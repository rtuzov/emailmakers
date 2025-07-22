/**
 * 🚀 SIMPLE PRICING TOOL
 * 
 * Упрощенная версия pricing_intelligence без внешних API вызовов
 * Предотвращает зависание системы
 */

import { z } from 'zod';
import { tool } from '@openai/agents';

// Простая Zod схема
const simplePricingSchema = z.object({
  origin: z.string().describe('Код аэропорта отправления'),
  destination: z.string().describe('Код аэропорта назначения'),
  date_range: z.string().describe('Диапазон дат поиска')
});

type SimplePricingParams = z.infer<typeof simplePricingSchema>;

/**
 * Простой генератор ценовых данных
 */
export async function simplePricing(params: SimplePricingParams): Promise<any> {
  const startTime = Date.now();
  console.log(`🚀 Simple Pricing: ${params.origin} → ${params.destination}`);
  
  try {
    // Генерируем реалистичные цены на основе популярности маршрута
    const routePrices = generateRoutePrices(params.origin, params.destination);
    
    const result = {
      success: true,
      data: {
        prices: routePrices.prices,
        currency: 'RUB',
        cheapest: routePrices.cheapest,
        search_metadata: {
          route: `${params.origin} → ${params.destination}`,
          date_range: params.date_range,
          cabin_class: 'economy',
          total_found: routePrices.prices.length
        }
      },
      analytics: {
        execution_time: Date.now() - startTime,
        data_source: 'simulated',
        route_popularity: routePrices.popularity
      }
    };

    console.log(`✅ Simple Pricing: Generated ${routePrices.prices.length} prices, cheapest: ${routePrices.cheapest} ₽`);
    return JSON.stringify(result);

  } catch (error) {
    console.error('❌ Simple Pricing error:', error);
    
    const errorResult = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        prices: [],
        currency: 'RUB',
        cheapest: 0,
        search_metadata: {
          route: `${params.origin} → ${params.destination}`,
          date_range: params.date_range,
          cabin_class: 'economy',
          total_found: 0
        }
      }
    };
    
    return JSON.stringify(errorResult);
  }
}

/**
 * Генерация реалистичных цен для маршрута
 */
function generateRoutePrices(origin: string, destination: string) {
  // Базовые цены для популярных маршрутов
  const routeBasePrices: Record<string, number> = {
    'MOW-PAR': 25000,
    'MOW-ROM': 22000,
    'MOW-BCN': 28000,
    'MOW-MAD': 26000,
    'MOW-LIS': 30000,
    'MOW-ATH': 24000,
    'MOW-VIE': 20000,
    'MOW-PRG': 18000,
    'MOW-BUD': 19000,
    'MOW-WAW': 16000,
    'LED-PAR': 23000,
    'LED-ROM': 20000,
    'LED-BCN': 26000,
    'LED-MAD': 24000,
    'LED-LIS': 28000
  };

  const routeKey = `${origin}-${destination}`;
  const basePrice = routeBasePrices[routeKey] || 35000; // Дефолтная цена для неизвестных маршрутов
  
  // Генерируем несколько вариантов цен
  const prices = [];
  const variations = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5]; // Вариации цен
  
  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    const price = Math.round(basePrice * variation);
    const date = getRandomFutureDate();
    
    prices.push({
      origin,
      destination,
      price,
      currency: 'RUB',
      date,
      metadata: {
        airline: getRandomAirline(),
        duration: getRandomDuration(origin, destination),
        stops: Math.random() > 0.7 ? 1 : 0,
        estimated: true
      }
    });
  }

  const cheapest = Math.min(...prices.map(p => (p || {}).price));
  const popularity = routeBasePrices[routeKey] ? 'high' : 'medium';

  return {
    prices,
    cheapest,
    popularity
  };
}

/**
 * Получение случайной даты в будущем
 */
function getRandomFutureDate(): string {
  const today = new Date();
  const futureDate = new Date(today.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000); // До 90 дней вперед
  return futureDate.toISOString().split('T')[0];
}

/**
 * Получение случайной авиакомпании
 */
function getRandomAirline(): string {
  const airlines = [
    'Aeroflot',
    'S7 Airlines',
    'Ural Airlines',
    'Pobeda',
    'Red Wings',
    'Nordwind',
    'Azur Air',
    'Smartavia'
  ];
  return airlines[Math.floor(Math.random() * airlines.length)];
}

/**
 * Получение случайной продолжительности полета
 */
function getRandomDuration(origin: string, destination: string): number {
  // Базовая продолжительность в минутах для разных типов маршрутов
  const shortHaul = 120 + Math.random() * 60; // 2-3 часа
  const mediumHaul = 180 + Math.random() * 120; // 3-5 часов
  const _longHaul // Currently unused = 300 + Math.random() * 180; // 5-8 часов

  // Определяем тип маршрута по коду аэропорта
  if (origin.startsWith('MOW') || origin.startsWith('LED')) {
    if (['PAR', 'ROM', 'BCN', 'MAD', 'LIS', 'ATH'].includes(destination)) {
      return Math.round(mediumHaul);
    } else if (['PRG', 'BUD', 'WAW', 'VIE'].includes(destination)) {
      return Math.round(shortHaul);
    }
  }

  return Math.round(mediumHaul); // По умолчанию средний маршрут
}

// Export the tool
export const simplePricingTool = tool({
  name: 'simple_pricing_intelligence',
  description: 'Простой инструмент для получения ценовых данных без внешних API вызовов',
  parameters: simplePricingSchema,
  execute: simplePricing
}); 