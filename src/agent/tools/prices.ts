// Load environment variables
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ToolResult, PriceInfo, handleToolError } from './index';
import { convertAirportToCity, getDestinationInfo } from './airports-loader';

interface PricesParams {
  origin: string;
  destination: string;
  date_range?: string | null; // Опциональный, можно использовать умные даты
  cabin_class?: 'economy' | 'business' | 'first' | null;
  filters?: {
    is_direct?: boolean | null;
    with_baggage?: boolean | null;
    airplane_only?: boolean | null;
  } | null;
}

interface KupibiletApiRequest {
  arrival: string;
  cabin_class: string;
  currency: string;
  departure: string;
  departure_date: {
    from: string;
    to: string;
  };
  filters: {
    airplane_only?: boolean | null;
    is_direct?: boolean | null;
    with_baggage?: boolean | null;
  };
}

interface KupibiletApiResponse {
  solutions?: Array<{
    price: {
      amount: number;
      currency: string;
    };
    departure_date: string;
    arrival_date?: string;
    airline?: string;
    flight_number?: string;
    duration?: number;
    stops?: number;
  }>;
  flights?: Array<{
    price: number;
    departure_date: string;
    arrival_date?: string;
    airline?: string;
    flight_number?: string;
    duration?: number;
    stops?: number;
  }>;
  min_price?: number;
  currency?: string;
  search_id?: string;
  status?: string;
}

interface PricesResult {
  prices: PriceInfo[];
  currency: string;
  cheapest: number;
  search_metadata: {
    route: string;
    date_range: string;
    cabin_class: string;
    total_found: number;
  };
}

/**
 * T2: Get Flight Prices Tool (Updated for Kupibilet API v2)
 * Получение цен на авиабилеты через новый API Купибилет
 */
export async function getPrices(params: PricesParams): Promise<ToolResult> {
  // Защита от unhandled promise rejections
  const safeExecute = async (): Promise<ToolResult> => {
    try {
      console.log('T2: Getting flight prices with new API:', params);

      // Add tracing
      const { logger } = await import('../core/logger');
      const traceId = `get_prices_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.startTrace(traceId, {
        tool: 'get_prices',
        origin: params.origin,
        destination: params.destination,
        date_range: params.date_range,
        cabin_class: params.cabin_class
      });

      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'validate_parameters',
        params: { origin: params.origin, destination: params.destination }
      });

    // Валидация параметров
    if (!params.origin || !params.destination) {
      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'validate_parameters',
        error: 'Origin and destination are required'
      });
      throw new Error('Origin and destination are required');
    }
    
    // Дополнительная проверка целостности параметров
    if (typeof params.origin !== 'string' || typeof params.destination !== 'string') {
      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'validate_parameters',
        error: 'Origin and destination must be strings'
      });
      throw new Error('Origin and destination must be strings');
    }

    logger.addTraceStep(traceId, {
      tool: 'get_prices',
      action: 'parameters_validated',
      result: { valid: true }
    });

    // Интеллектуальная коррекция маршрута с использованием CSV данных
    logger.addTraceStep(traceId, {
      tool: 'get_prices',
      action: 'correct_route',
      params: { original_origin: params.origin, original_destination: params.destination }
    });

    const { origin, destination, metadata: routeMetadata } = correctRoute(params.origin, params.destination);

    logger.addTraceStep(traceId, {
      tool: 'get_prices',
      action: 'route_corrected',
      result: { corrected_origin: origin, corrected_destination: destination, metadata: routeMetadata }
    });
    
    // Генерация умного диапазона дат если не указан
    const dateRange = params.date_range || generateSmartDateRange();
    const [fromDate, toDate] = dateRange.split(',');

    // Подготовка запроса к API
    const apiRequest = buildApiRequest({
      origin,
      destination,
      fromDate,
      toDate,
      cabinClass: params.cabin_class || 'economy',
      filters: params.filters || {}
    });

    try {
      // Попытка получить данные через реальный API
      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'fetch_from_api',
        params: { api_request: apiRequest }
      });

      const apiStartTime = Date.now();
      const pricesResult = await fetchFromKupibiletV2(apiRequest);
      const apiDuration = Date.now() - apiStartTime;

      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'api_response_received',
        result: { 
          prices_count: pricesResult.prices.length,
          cheapest_price: pricesResult.cheapest,
          currency: pricesResult.currency
        },
        duration: apiDuration
      });
      
      console.log('✅ Kupibilet API success, returning real data');
      
      const result = {
        success: true,
        data: pricesResult,
        metadata: {
          source: 'kupibilet_api_v2',
          original_route: `${params.origin}->${params.destination}`,
          corrected_route: `${origin}->${destination}`,
          api_endpoint: 'https://lpc.kupibilet.ru/api/v2/one_way',
          timestamp: new Date().toISOString(),
          route_processing: routeMetadata,
          csv_integration: 'enabled'
        }
      };

      await logger.endTrace(traceId, result);
      return result;

    } catch (apiError) {
      logger.addTraceStep(traceId, {
        tool: 'get_prices',
        action: 'api_error',
        error: apiError instanceof Error ? apiError.message : String(apiError)
      });
      
      await logger.endTrace(traceId, undefined, apiError);
      throw new Error(`Kupibilet API failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

  } catch (error) {
    return handleToolError('get_prices', error);
  }
  };

  // Выполняем безопасное выполнение с обработкой всех возможных ошибок
  try {
    return await safeExecute();
  } catch (finalError) {
    console.error('❌ Final error in getPrices:', finalError);
    return {
      success: false,
      error: finalError instanceof Error ? finalError.message : 'Unknown error in getPrices',
      metadata: {
        source: 'final_error_handler',
        timestamp: new Date().toISOString()
      }
    };
  }
}

function correctRoute(origin: string, destination: string): { 
  origin: string; 
  destination: string;
  metadata: {
    originInfo?: any;
    destinationInfo?: any;
  };
} {
  // Коррекция некорректных маршрутов
  if (origin === destination) {
    console.log(`⚠️  Identical origin and destination (${origin}), applying smart correction`);
    
    // Популярные маршруты из основных городов
    const smartRoutes: Record<string, string> = {
      'MOW': 'LED', // Москва -> Питер
      'LED': 'MOW', // Питер -> Москва  
      'SPB': 'MOW', // Питер -> Москва (альтернативный код)
      'SVO': 'LED', // Шереметьево -> Питер
      'DME': 'LED', // Домодедово -> Питер
    };
    
    const suggestedDestination = smartRoutes[origin] || 'LED';
    return { 
      origin, 
      destination: suggestedDestination,
      metadata: {
        originInfo: { correctionApplied: 'identical_origin_destination' },
        destinationInfo: { correctionApplied: 'smart_route_suggestion' }
      }
    };
  }

  console.log(`🔍 Processing route: ${origin} → ${destination}`);

  // Нормализация российских кодов аэропортов для origin
  const russianAirportCodes: Record<string, string> = {
    'SPB': 'LED', // Санкт-Петербург
    'MSK': 'MOW', // Москва (общий код)
    'SVO': 'MOW', // Шереметьево
    'DME': 'MOW', // Домодедово
    'VKO': 'MOW', // Внуково
  };

  const correctedOrigin = russianAirportCodes[origin] || origin;
  
  // Используем CSV данные для конвертации destination
  const destinationInfo = getDestinationInfo(destination);
  const correctedDestination = destinationInfo.finalCode;
  
  // Логирование конвертации
  if (destinationInfo.wasConverted) {
    console.log(`🌍 CSV-based airport → city conversion: ${destinationInfo.originalCode} → ${destinationInfo.finalCode}`);
    console.log(`📍 Country: ${destinationInfo.countryCode}, International: ${destinationInfo.isInternational}`);
  }
  
  if (correctedOrigin !== origin) {
    console.log(`🏠 Russian airport normalization: ${origin} → ${correctedOrigin}`);
  }

  return {
    origin: correctedOrigin,
    destination: correctedDestination,
    metadata: {
      originInfo: correctedOrigin !== origin ? { 
        original: origin, 
        corrected: correctedOrigin,
        type: 'russian_airport_normalization'
      } : null,
      destinationInfo: destinationInfo
    }
  };
}

function generateSmartDateRange(): string {
  const now = new Date();
  
  // Начинаем поиск завтра (API не любит далекие даты)
  const startDate = new Date(now);
  startDate.setDate(now.getDate() + 1);
  
  // Заканчиваем через 2 недели (короткое окно для надежности API)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 14);
  
  console.log(`📅 Generated smart date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  return `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
}

function buildApiRequest(params: {
  origin: string;
  destination: string;
  fromDate: string;
  toDate: string;
  cabinClass: string;
  filters: any;
}): KupibiletApiRequest {
  return {
    arrival: params.destination,
    cabin_class: params.cabinClass,
    currency: 'RUB',
    departure: params.origin,
    departure_date: {
      from: params.fromDate,
      to: params.toDate
    },
    filters: {
      airplane_only: params.filters.airplane_only || null,
      // Не требуем прямые рейсы по умолчанию для международных маршрутов
      is_direct: params.filters.is_direct === true ? true : null,
      with_baggage: params.filters.with_baggage || null
    }
  };
}

async function fetchFromKupibiletV2(request: KupibiletApiRequest): Promise<PricesResult> {
  console.log('🔄 Calling Kupibilet API v2 with request:', JSON.stringify(request, null, 2));
  
  const response = await fetch('https://lpc.kupibilet.ru/api/v2/one_way', {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'content-type': 'application/json',
      'origin': 'https://kupibilet.ru',
      'referer': 'https://kupibilet.ru/',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    body: JSON.stringify(request)
  });

  console.log('📊 Kupibilet API response status:', response.status, response.statusText);
  console.log('📊 Content-Type:', response.headers.get('content-type'));

  if (!response.ok) {
    throw new Error(`Kupibilet API v2 error: ${response.status} ${response.statusText}`);
  }

  // Обрабатываем случай 204 No Content
  if (response.status === 204) {
    console.log('📭 API returned 204 No Content - no flights available for this route/dates');
    throw new Error('No flights available for the specified route and dates');
  }

  // Получаем сырой текст для анализа
  const responseText = await response.text();
  console.log('📄 Raw response length:', responseText.length);

  // Проверяем на пустой ответ
  if (!responseText || responseText.length === 0) {
    console.log('📭 Empty response received from API');
    throw new Error('Empty response from Kupibilet API v2');
  }

  let responseData: any;
  try {
    responseData = JSON.parse(responseText);
  } catch (parseError) {
    console.error('❌ JSON parsing failed:', parseError);
    console.log('📄 Raw response preview:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from Kupibilet API v2');
  }

  console.log('✅ Kupibilet API response received:', {
    solutions_count: responseData.solutions?.length || 0,
    flights_count: responseData.flights?.length || 0,
    min_price: responseData.min_price,
    currency: responseData.currency,
    status: responseData.status
  });

  // Приоритетная обработка solutions (новый формат API)
  if (responseData.solutions && Array.isArray(responseData.solutions) && responseData.solutions.length > 0) {
    console.log(`🎯 Processing ${responseData.solutions.length} solutions from API`);
    
    // Обрабатываем реальные данные о решениях
    const prices: PriceInfo[] = responseData.solutions.map((solution: any, index: number) => ({
      origin: request.departure,
      destination: request.arrival,
      price: Math.round((solution.price?.amount || 0) / 100), // Конвертируем копейки в рубли
      currency: solution.price?.currency || 'RUB',
      date: solution.departure_date,
      metadata: {
        airline: solution.airline || '',
        duration: solution.duration,
        stops: solution.stops || 0,
        flight_number: solution.flight_number
      }
    }));

    // Найдем самую дешевую цену
    const cheapest = Math.min(...prices.map(p => p.price));
    
    console.log(`💰 Processed prices: cheapest ${cheapest} ₽, total ${prices.length} options`);

    return {
      prices,
      currency: 'RUB', // Всегда RUB после конвертации
      cheapest,
      search_metadata: {
        route: `${request.departure} → ${request.arrival}`,
        date_range: `${request.departure_date.from} to ${request.departure_date.to}`,
        cabin_class: request.cabin_class,
        total_found: prices.length
      }
    };
  } 
        // Use old format flights
  else if (responseData.flights && Array.isArray(responseData.flights) && responseData.flights.length > 0) {
    console.log(`🎯 Processing ${responseData.flights.length} flights from API (legacy format)`);
    
    // Обрабатываем реальные данные о рейсах
    const prices: PriceInfo[] = responseData.flights.map((flight: any, index: number) => ({
      origin: request.departure,
      destination: request.arrival,
      price: flight.price || flight.amount || 0,
      currency: responseData.currency || flight.currency || 'RUB',
      date: flight.departure_date || flight.date,
      metadata: {
        airline: flight.airline || '',
        duration: flight.duration,
        stops: flight.stops || 0,
        flight_number: flight.flight_number
      }
    }));

    // Найдем самую дешевую цену
    const cheapest = Math.min(...prices.map(p => p.price));

    return {
      prices,
      currency: responseData.currency || 'RUB',
      cheapest,
      search_metadata: {
        route: `${request.departure} → ${request.arrival}`,
        date_range: `${request.departure_date.from} to ${request.departure_date.to}`,
        cabin_class: request.cabin_class,
        total_found: prices.length
      }
    };
  } else {
    // Если нет ни solutions, ни flights - API не нашел результатов
    console.log('❌ No solutions or flights found in API response');
    throw new Error('No flights found for the specified route and dates');
  }
}

 