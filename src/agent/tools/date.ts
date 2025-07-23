// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-handler';
import { logger } from '../core/logger';

// Define ToolResult locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}

interface DateParams {
  months_ahead?: number | null; // Количество месяцев вперед для поиска (по умолчанию 3)
  search_window?: number | null; // Окно поиска в днях (по умолчанию 30)
  // Новые параметры для интеллектуального выбора дат
  campaign_context?: {
    topic?: string; // Тема кампании
    urgency?: 'urgent' | 'standard' | 'seasonal'; // Срочность
    campaign_type?: 'hot_deals' | 'newsletter' | 'seasonal' | 'announcement';
    destination?: string; // Направление для сезонности
  } | null;
}

interface DateResult {
  today: string;
  search_start: string;
  search_end: string;
  suggested_ranges: Array<{
    from: string;
    to: string;
    period: string;
    reasoning: string; // Объяснение выбора
  }>;
  intelligent_selection: {
    primary_range: {
      from: string;
      to: string;
      reasoning: string;
    };
    campaign_factors: string[];
  };
}

/**
 * Date Tool - интеллектуальное определение дат на основе контекста кампании
 * Генерирует разумные диапазоны дат для поиска авиабилетов с учетом типа рассылки
 */
export async function getCurrentDate(params: DateParams = {}): Promise<ToolResult> {
  try {
    console.log('📅 Getting intelligent date ranges with context:', params);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Интеллектуальная логика выбора дат на основе контекста
    const dateSelection = generateIntelligentDateSelection(now, params.campaign_context);
    
    // Базовые параметры с учетом контекста
    const monthsAhead = params.months_ahead ?? dateSelection.recommended_months_ahead;
    const searchWindow = params.search_window ?? dateSelection.recommended_search_window;
    
    // Динамическое определение начальной даты поиска
    const searchStartDate = new Date(now);
    searchStartDate.setDate(now.getDate() + dateSelection.days_ahead_start);
    const searchStart = searchStartDate.toISOString().split('T')[0];
    
    // Конец периода поиска
    const searchEndDate = new Date(searchStartDate);
    searchEndDate.setMonth(searchStartDate.getMonth() + monthsAhead);
    const searchEnd = searchEndDate.toISOString().split('T')[0];
    
    // Генерируем контекстуальные диапазоны
    const suggestedRanges = generateContextualRanges(searchStartDate, monthsAhead, params.campaign_context);
    
    const result: DateResult = {
      today: today || new Date().toISOString().split('T')[0]!,
      search_start: searchStart || new Date().toISOString().split('T')[0]!,
      search_end: searchEnd || new Date().toISOString().split('T')[0]!,
      suggested_ranges: suggestedRanges.filter((range): range is { from: string; to: string; period: string; reasoning: string } => 
        Boolean(range.from && range.to && range.period && range.reasoning)
      ),
      intelligent_selection: {
        primary_range: dateSelection.primary_range,
        campaign_factors: dateSelection.factors_considered
      }
    };

    console.log('✅ Intelligent date ranges generated:', result);

    return {
      success: true,
      data: result,
      metadata: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now.toISOString(),
        months_ahead: monthsAhead,
        search_window: searchWindow,
        campaign_context: params.campaign_context,
        selection_strategy: dateSelection.strategy
      }
    };

  } catch (error) {
    return handleToolError('get_current_date', error);
  }
}

function generateIntelligentDateSelection(
  currentDate: Date, 
  context?: DateParams['campaign_context']
) {
  const factors: string[] = [];
  let strategy = 'standard';
  let daysAheadStart = 7; // По умолчанию
  let recommendedMonthsAhead = 3;
  let recommendedSearchWindow = 30;

  // Анализ темы кампании
  if (context?.topic) {
    const topic = context.topic.toLowerCase();
    
    // Горящие билеты и срочные предложения
    if (topic.includes('горящ') || topic.includes('срочн') || topic.includes('скидк') || 
        topic.includes('акция') || topic.includes('последн') || topic.includes('успей')) {
      daysAheadStart = 1; // Вылет уже завтра
      recommendedMonthsAhead = 2; // Короткий период
      recommendedSearchWindow = 14; // Узкое окно
      strategy = 'urgent_deals';
      factors.push('Обнаружены срочные предложения - сокращен период поиска');
  }
  
    // Сезонные предложения
    if (topic.includes('лет') || topic.includes('зим') || topic.includes('новый год') || 
        topic.includes('праздник') || topic.includes('отпуск') || topic.includes('осен')) {
      const season = detectSeason(currentDate, topic);
      const seasonDates = getSeasonOptimalDates(currentDate, season);
      daysAheadStart = seasonDates.daysAhead;
      recommendedMonthsAhead = seasonDates.monthsAhead;
      strategy = 'seasonal';
      factors.push(`Сезонная кампания (${season}) - оптимизированы даты под сезон`);
    }
    
    // Деловые поездки
    if (topic.includes('бизнес') || topic.includes('деловая') || topic.includes('конференц') || 
        topic.includes('встреча')) {
      daysAheadStart = 14; // Заблаговременное планирование
      recommendedMonthsAhead = 4; // Более длинный период
      strategy = 'business_travel';
      factors.push('Деловые поездки - увеличен период планирования');
    }
  }

  // Анализ типа кампании
  if (context?.campaign_type) {
    switch (context.campaign_type) {
      case 'hot_deals':
        daysAheadStart = Math.min(daysAheadStart, 3);
        recommendedMonthsAhead = 2;
        factors.push('Горячие предложения - ускоренные даты');
        break;
      case 'seasonal':
        // Сезонные предложения требуют заблаговременного планирования
        daysAheadStart = Math.max(daysAheadStart, 21);
        recommendedMonthsAhead = 5;
        factors.push('Сезонная кампания - расширенное планирование');
        break;
      case 'newsletter':
        // Обычная рассылка - стандартные сроки
        daysAheadStart = 7;
        recommendedMonthsAhead = 3;
        factors.push('Регулярная рассылка - стандартные сроки');
        break;
    }
  }

  // Анализ срочности
  if (context?.urgency) {
    switch (context.urgency) {
      case 'urgent':
        daysAheadStart = 1;
        recommendedMonthsAhead = 1;
        recommendedSearchWindow = 7;
        factors.push('Срочная кампания - минимальные сроки');
        break;
      case 'seasonal':
        daysAheadStart = Math.max(daysAheadStart, 30);
        recommendedMonthsAhead = 6;
        factors.push('Сезонная кампания - максимальное планирование');
        break;
    }
  }

  // Анализ направления для сезонности
  if (context?.destination) {
    const destinationInsights = getDestinationSeasonality(context.destination, currentDate);
    if (destinationInsights.optimal_booking_ahead_days) {
      daysAheadStart = Math.max(daysAheadStart, destinationInsights.optimal_booking_ahead_days);
      factors.push(`Направление ${context.destination}: ${destinationInsights.reasoning}`);
    }
  }

  const primaryRange = generatePrimaryRange(currentDate, daysAheadStart, recommendedMonthsAhead);

  return {
    strategy,
    days_ahead_start: daysAheadStart,
    recommended_months_ahead: recommendedMonthsAhead,
    recommended_search_window: recommendedSearchWindow,
    primary_range: primaryRange,
    factors_considered: factors
  };
}

function generatePrimaryRange(currentDate: Date, daysAhead: number, monthsAhead: number) {
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + daysAhead);
  
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + monthsAhead);
  
  let reasoning = `Оптимальный период с ${daysAhead} дней от сегодня на ${monthsAhead} месяцев вперед`;
  
  return {
    from: startDate.toISOString().split('T')[0] || startDate.toISOString().substring(0, 10),
    to: endDate.toISOString().split('T')[0] || endDate.toISOString().substring(0, 10),
    reasoning
  };
}

function generateContextualRanges(
  startDate: Date, 
  monthsAhead: number, 
  context?: DateParams['campaign_context']
) {
  const ranges = [];
  
  // Ближайший период (всегда актуален)
  const nearRange = getNearestOptimalRange(startDate);
  if (nearRange) {
    ranges.push(nearRange);
  }
  
  // Контекстуальные диапазоны на основе кампании
  if (context?.campaign_type === 'hot_deals') {
            // Для горящих билетов - ближайшие выходные и следующая неделя
    const weekendRange = getUpcomingWeekend(startDate);
    if (weekendRange) {
      ranges.push({
        ...weekendRange,
                  reasoning: 'Идеально для горящих билетов на выходные'
      });
    }
    
    const nextWeekRange = getNextWeekRange(startDate);
    ranges.push({
      ...nextWeekRange,
      reasoning: 'Быстрое бронирование на следующую неделю'
    });
    
  } else if (context?.campaign_type === 'seasonal') {
    // Для сезонных кампаний - оптимальные месяцы
    const seasonalRanges = getSeasonalRanges(startDate, context.topic);
    ranges.push(...seasonalRanges);
    
  } else {
    // Стандартные диапазоны для обычных кампаний
    ranges.push(...getStandardRanges(startDate, monthsAhead));
  }
  
  return ranges;
}

function detectSeason(currentDate: Date, topic: string): string {
  const month = currentDate.getMonth();
  
  if (topic.includes('лет') || topic.includes('пляж') || topic.includes('море')) {
    return 'summer';
  }
  if (topic.includes('зим') || topic.includes('новый год') || topic.includes('рождест')) {
    return 'winter';
  }
  if (topic.includes('весн') || topic.includes('8 марта')) {
    return 'spring';
  }
  if (topic.includes('осен') || topic.includes('сентябр') || topic.includes('октябр')) {
    return 'autumn';
  }
  
  // Определяем по текущему времени года
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  return 'autumn';
}

function getSeasonOptimalDates(currentDate: Date, season: string) {
  const currentMonth = currentDate.getMonth(); // 0-11
  
  switch (season) {
    case 'summer':
      return { daysAhead: 45, monthsAhead: 4 }; // Летние поездки планируют заранее
    case 'winter':
      return { daysAhead: 60, monthsAhead: 5 }; // Новогодние поездки планируют очень заранее
    case 'spring':
      return { daysAhead: 21, monthsAhead: 3 }; // Весенние поездки
    case 'autumn':
      // Если сейчас лето (июнь-август), планируем на осень заранее
      if (currentMonth >= 5 && currentMonth <= 7) {
        return { daysAhead: 60, monthsAhead: 4 }; // Планирование с лета на осень
      }
      // Если уже осень, то ближайшие даты
      return { daysAhead: 7, monthsAhead: 3 }; // Осенние поездки
    default:
      return { daysAhead: 7, monthsAhead: 3 };
  }
}

function getDestinationSeasonality(destination: string, currentDate: Date) {
  const dest = destination.toLowerCase();
  
  // Популярные летние направления
  if (dest.includes('турция') || dest.includes('греция') || dest.includes('кипр') || 
      dest.includes('испания') || dest.includes('италия')) {
    const month = currentDate.getMonth();
    if (month >= 1 && month <= 4) { // Февраль-май
      return {
        optimal_booking_ahead_days: 60,
        reasoning: 'Летние направления лучше бронировать заранее'
      };
    }
  }
  
  // Горнолыжные курорты
  if (dest.includes('сочи') || dest.includes('швейцария') || dest.includes('австрия') || 
      dest.includes('франция') && dest.includes('альпы')) {
    const month = currentDate.getMonth();
    if (month >= 8 && month <= 11) { // Сентябрь-декабрь
      return {
        optimal_booking_ahead_days: 45,
        reasoning: 'Горнолыжные курорты бронируют до начала сезона'
      };
    }
  }
  
  return { optimal_booking_ahead_days: 14, reasoning: 'Стандартное направление' };
}

function getNearestOptimalRange(startDate: Date) {
  const nearStart = new Date(startDate);
  const nearEnd = new Date(startDate);
  nearEnd.setDate(startDate.getDate() + 14);
  
  return {
    from: nearStart.toISOString().split('T')[0] || nearStart.toISOString().substring(0, 10),
    to: nearEnd.toISOString().split('T')[0] || nearEnd.toISOString().substring(0, 10),
    period: 'Ближайшие 2 недели',
    reasoning: 'Оптимально для быстрого бронирования'
  };
}

function getUpcomingWeekend(fromDate: Date): { from: string; to: string; period: string } | null {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  
  // Находим ближайшую пятницу
  let daysToFriday = 5 - dayOfWeek;
  if (daysToFriday <= 0) {
    daysToFriday += 7;
  }
  
  const friday = new Date(date);
  friday.setDate(date.getDate() + daysToFriday);
  
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  
  return {
    from: friday.toISOString().split('T')[0] || friday.toISOString().substring(0, 10),
    to: sunday.toISOString().split('T')[0] || sunday.toISOString().substring(0, 10),
    period: 'Ближайшие выходные'
  };
}

function getNextWeekRange(startDate: Date) {
  const nextWeekStart = new Date(startDate);
  nextWeekStart.setDate(startDate.getDate() + 7);
  
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
  
  return {
    from: nextWeekStart.toISOString().split('T')[0] || nextWeekStart.toISOString().substring(0, 10),
    to: nextWeekEnd.toISOString().split('T')[0] || nextWeekEnd.toISOString().substring(0, 10),
    period: 'Следующая неделя',
    reasoning: 'Быстрое бронирование'
  };
}

function getSeasonalRanges(startDate: Date, topic?: string) {
  const ranges = [];
  const currentMonth = startDate.getMonth();
  if (!topic) {
    throw new Error('Topic parameter is required');
  }
  const topicLower = topic.toLowerCase();
  
  // Осенний сезон (сентябрь-ноябрь)
  if (topicLower.includes('осен')) {
    const autumnStart = new Date(startDate.getFullYear(), 8, 1); // Сентябрь
    const autumnEnd = new Date(startDate.getFullYear(), 10, 30); // Ноябрь
    
    // Если сейчас еще лето, планируем на осень
    if (currentMonth < 8) {
      ranges.push({
        from: autumnStart.toISOString().split('T')[0] || autumnStart.toISOString().substring(0, 10),
        to: autumnEnd.toISOString().split('T')[0] || autumnEnd.toISOString().substring(0, 10),
        period: 'Осенний сезон',
        reasoning: 'Оптимальное время для осенних путешествий (сентябрь-ноябрь)'
      });
    } else if (currentMonth >= 8 && currentMonth <= 10) {
      // Уже осень - ближайшие даты
      const nearStart = new Date(startDate);
      nearStart.setDate(startDate.getDate() + 7);
      ranges.push({
        from: nearStart.toISOString().split('T')[0] || nearStart.toISOString().substring(0, 10),
        to: autumnEnd.toISOString().split('T')[0] || autumnEnd.toISOString().substring(0, 10),
        period: 'Оставшаяся осень',
        reasoning: 'Текущий осенний период'
      });
    }
  }
  
  // Летний сезон
  if (topicLower.includes('лет') && currentMonth <= 4) { // До мая
    const summerStart = new Date(startDate.getFullYear(), 5, 1); // Июнь
    const summerEnd = new Date(startDate.getFullYear(), 7, 31); // Август
    ranges.push({
      from: summerStart.toISOString().split('T')[0] || summerStart.toISOString().substring(0, 10),
      to: summerEnd.toISOString().split('T')[0] || summerEnd.toISOString().substring(0, 10),
      period: 'Летний сезон',
      reasoning: 'Оптимальное время для летнего отдыха'
    });
  }
  
  // Новогодние праздники
  if ((topicLower.includes('зим') || topicLower.includes('новый год')) && currentMonth >= 8) { // С сентября
    const nyStart = new Date(startDate.getFullYear(), 11, 28); // 28 декабря
    const nyEnd = new Date(startDate.getFullYear() + 1, 0, 8); // 8 января
    ranges.push({
      from: nyStart.toISOString().split('T')[0] || nyStart.toISOString().substring(0, 10),
      to: nyEnd.toISOString().split('T')[0] || nyEnd.toISOString().substring(0, 10),
      period: 'Новогодние праздники',
      reasoning: 'Популярное время для путешествий'
    });
  }
  
  return ranges;
}

function getStandardRanges(startDate: Date, _monthsAhead: number) {
  const ranges = [];
  
  // Следующий месяц
  const nextMonth = new Date(startDate);
  nextMonth.setMonth(startDate.getMonth() + 1);
  nextMonth.setDate(1);
  const nextMonthEnd = new Date(nextMonth);
  nextMonthEnd.setMonth(nextMonth.getMonth() + 1);
  nextMonthEnd.setDate(0);
  
  ranges.push({
    from: nextMonth.toISOString().split('T')[0] || nextMonth.toISOString().substring(0, 10),
    to: nextMonthEnd.toISOString().split('T')[0] || nextMonthEnd.toISOString().substring(0, 10),
    period: 'Следующий месяц',
    reasoning: 'Стандартный период планирования'
  });
  
  // Через 2 месяца
  const twoMonthsAhead = new Date(startDate);
  twoMonthsAhead.setMonth(startDate.getMonth() + 2);
  twoMonthsAhead.setDate(1);
  const twoMonthsEnd = new Date(twoMonthsAhead);
  twoMonthsEnd.setMonth(twoMonthsAhead.getMonth() + 1);
  twoMonthsEnd.setDate(0);
  
  ranges.push({
    from: twoMonthsAhead.toISOString().split('T')[0] || twoMonthsAhead.toISOString().substring(0, 10),
    to: twoMonthsEnd.toISOString().split('T')[0] || twoMonthsEnd.toISOString().substring(0, 10),
    period: 'Через 2 месяца',
    reasoning: 'Заблаговременное планирование'
  });
  
  return ranges;
} 