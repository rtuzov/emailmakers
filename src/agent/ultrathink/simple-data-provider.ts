import { SeasonalContext } from './types';

export class SimpleDataProvider {
  
  // Public holidays from open sources (major holidays only)
  static readonly holidays: Record<string, string[]> = {
    'RU': [
      '2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05',
      '2025-01-06', '2025-01-07', '2025-01-08', // New Year holidays
      '2025-02-23', // Defender of the Fatherland Day
      '2025-03-08', // International Women's Day
      '2025-05-01', // Labour Day
      '2025-05-09', // Victory Day
      '2025-06-12', // Russia Day
      '2025-11-04', // Unity Day
      '2025-12-31'  // New Year's Eve
    ],
    'FR': ['2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08', '2025-05-29', '2025-06-09', '2025-07-14', '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25'],
    'GB': ['2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05', '2025-05-26', '2025-08-25', '2025-12-25', '2025-12-26'],
    'IT': ['2025-01-01', '2025-01-06', '2025-04-21', '2025-04-25', '2025-05-01', '2025-06-02', '2025-08-15', '2025-11-01', '2025-12-08', '2025-12-25', '2025-12-26'],
    'ES': ['2025-01-01', '2025-01-06', '2025-04-18', '2025-04-21', '2025-05-01', '2025-08-15', '2025-10-12', '2025-11-01', '2025-12-06', '2025-12-08', '2025-12-25'],
    'DE': ['2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-05-29', '2025-06-09', '2025-10-03', '2025-12-25', '2025-12-26'],
    'TH': ['2025-01-01', '2025-02-26', '2025-04-13', '2025-04-14', '2025-04-15', '2025-05-01', '2025-05-22', '2025-07-28', '2025-08-12', '2025-10-23', '2025-12-05', '2025-12-10', '2025-12-31'],
    'AE': ['2025-01-01', '2025-04-10', '2025-04-11', '2025-04-12', '2025-06-16', '2025-06-17', '2025-12-02', '2025-12-03']
  };

  // Seasonal pricing patterns based on travel industry data
  static readonly seasonalPricing: Record<string, SeasonalContext> = {
    'spring': { 
      season: 'spring', 
      priceFactor: 0.9, 
      months: [3, 4, 5],
      description: 'Весенний сезон - умеренные цены, отличное время для городского туризма'
    },
    'summer': { 
      season: 'summer', 
      priceFactor: 1.3, 
      months: [6, 7, 8],
      description: 'Летний пик - высокий сезон с максимальными ценами'
    },
    'autumn': { 
      season: 'autumn', 
      priceFactor: 0.8, 
      months: [9, 10, 11],
      description: 'Золотая осень - низкие цены и комфортная погода'
    },
    'winter': { 
      season: 'winter', 
      priceFactor: 1.1, 
      months: [12, 1, 2],
      description: 'Зимний период - новогодние праздники и горнолыжный сезон'
    }
  };

  // Route popularity based on travel statistics
  static readonly routePopularity: Record<string, number> = {
    // Domestic Russia routes (score 1-10)
    'MOW-LED': 10, 'LED-MOW': 10,  // Moscow ↔ St. Petersburg
    'MOW-AER': 9,  'AER-MOW': 9,   // Moscow ↔ Sochi
    'LED-AER': 7,  'AER-LED': 7,   // St. Petersburg ↔ Sochi
    'MOW-SVX': 8,  'SVX-MOW': 8,   // Moscow ↔ Ekaterinburg
    'MOW-OVB': 7,  'OVB-MOW': 7,   // Moscow ↔ Novosibirsk
    'MOW-VVO': 6,  'VVO-MOW': 6,   // Moscow ↔ Vladivostok
    
    // International from Moscow
    'MOW-CDG': 9,  'CDG-MOW': 9,   // Moscow ↔ Paris
    'MOW-LHR': 8,  'LHR-MOW': 8,   // Moscow ↔ London
    'MOW-FCO': 8,  'FCO-MOW': 8,   // Moscow ↔ Rome
    'MOW-BCN': 7,  'BCN-MOW': 7,   // Moscow ↔ Barcelona
    'MOW-AMS': 7,  'AMS-MOW': 7,   // Moscow ↔ Amsterdam
    'MOW-BKK': 8,  'BKK-MOW': 8,   // Moscow ↔ Bangkok
    'MOW-DXB': 9,  'DXB-MOW': 9,   // Moscow ↔ Dubai
    'MOW-TLV': 7,  'TLV-MOW': 7,   // Moscow ↔ Tel Aviv
    'MOW-IST': 8,  'IST-MOW': 8,   // Moscow ↔ Istanbul
    
    // International from St. Petersburg
    'LED-CDG': 6,  'CDG-LED': 6,   // St. Petersburg ↔ Paris
    'LED-LHR': 5,  'LHR-LED': 5,   // St. Petersburg ↔ London
    'LED-FCO': 5,  'FCO-LED': 5,   // St. Petersburg ↔ Rome
    'LED-AMS': 5,  'AMS-LED': 5    // St. Petersburg ↔ Amsterdam
  };

  // Weekend patterns for pricing
  static readonly weekendDays = [0, 6]; // Sunday = 0, Saturday = 6

  // School holiday periods (approximate)
  static readonly schoolHolidays: Record<string, Array<{start: string, end: string, name: string}>> = {
    'RU': [
      { start: '2025-01-01', end: '2025-01-08', name: 'Новогодние каникулы' },
      { start: '2025-03-24', end: '2025-03-30', name: 'Весенние каникулы' },
      { start: '2025-06-01', end: '2025-08-31', name: 'Летние каникулы' },
      { start: '2025-10-28', end: '2025-11-05', name: 'Осенние каникулы' },
      { start: '2025-12-28', end: '2025-12-31', name: 'Зимние каникулы' }
    ]
  };

  // Travel advisory data (simplified)
  static readonly travelAdvisory: Record<string, {
    level: 'green' | 'yellow' | 'orange' | 'red';
    description: string;
    updated: string;
  }> = {
    'FR': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'GB': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'IT': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'ES': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'DE': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'TH': { level: 'yellow', description: 'Соблюдайте обычные меры предосторожности', updated: '2025-01-01' },
    'AE': { level: 'green', description: 'Нормальные условия путешествия', updated: '2025-01-01' },
    'TR': { level: 'yellow', description: 'Соблюдайте повышенные меры предосторожности', updated: '2025-01-01' }
  };

  // Currency exchange rates (simplified, for estimation only)
  static readonly exchangeRates: Record<string, number> = {
    'RUB': 1.0,    // Base currency
    'EUR': 110.0,
    'USD': 100.0,
    'GBP': 125.0,
    'THB': 2.8,
    'AED': 27.0,
    'TRY': 3.2
  };

  /**
   * Check if a date is a holiday in a specific country
   */
  static isHoliday(date: string, countryCode: string): boolean {
    const countryHolidays = this.holidays[countryCode];
    if (!countryHolidays) return false;
    
    return countryHolidays.includes(date);
  }

  /**
   * Get seasonal context for a date
   */
  static getSeasonalContext(date: Date): SeasonalContext {
    const month = date.getMonth() + 1;
    
    for (const season of Object.values(this.seasonalPricing)) {
      if (season.months.includes(month)) {
        return season;
      }
    }
    
    return {
      season: 'unknown',
      priceFactor: 1.0,
      months: [],
      description: 'Неопределенный сезон'
    };
  }

  /**
   * Get route popularity score (1-10)
   */
  static getRoutePopularity(origin: string, destination: string): number {
    const routeKey = `${origin}-${destination}`;
    return this.routePopularity[routeKey] || 3; // Default medium popularity
  }

  /**
   * Check if date is weekend
   */
  static isWeekend(date: Date): boolean {
    return this.weekendDays.includes(date.getDay());
  }

  /**
   * Check if date falls in school holidays
   */
  static isSchoolHoliday(date: Date, countryCode: string = 'RU'): {
    isHoliday: boolean;
    holidayName?: string;
  } {
    const dateStr = date.toISOString().split('T')[0];
    const holidays = this.schoolHolidays[countryCode] || [];
    
    for (const holiday of holidays) {
      if (dateStr >= holiday.start && dateStr <= holiday.end) {
        return { isHoliday: true, holidayName: holiday.name };
      }
    }
    
    return { isHoliday: false };
  }

  /**
   * Get travel advisory for a country
   */
  static getTravelAdvisory(countryCode: string) {
    return this.travelAdvisory[countryCode] || {
      level: 'green' as const,
      description: 'Информация недоступна',
      updated: '2025-01-01'
    };
  }

  /**
   * Convert price between currencies (simplified)
   */
  static convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromRate = this.exchangeRates[fromCurrency] || 1;
    const toRate = this.exchangeRates[toCurrency] || 1;
    
    // Convert to RUB first, then to target currency
    const rubAmount = amount / fromRate;
    return Math.round(rubAmount * toRate);
  }

  /**
   * Get price multiplier for a specific date
   */
  static getPriceMultiplier(date: Date, origin: string, destination: string, countryCode?: string): {
    multiplier: number;
    factors: string[];
  } {
    let multiplier = 1.0;
    const factors: string[] = [];
    
    // Seasonal factor
    const seasonal = this.getSeasonalContext(date);
    multiplier *= seasonal.priceFactor;
    if (seasonal.priceFactor !== 1.0) {
      factors.push(`Сезонность: ${seasonal.season}`);
    }
    
    // Holiday factor
    const dateStr = date.toISOString().split('T')[0];
    if (countryCode && this.isHoliday(dateStr, countryCode)) {
      multiplier *= 1.15;
      factors.push('Праздничный период');
    }
    
    // Weekend factor
    if (this.isWeekend(date)) {
      multiplier *= 1.05;
      factors.push('Выходной день');
    }
    
    // School holiday factor
    const schoolHoliday = this.isSchoolHoliday(date);
    if (schoolHoliday.isHoliday) {
      multiplier *= 1.1;
      factors.push(`Школьные каникулы: ${schoolHoliday.holidayName}`);
    }
    
    // Route popularity factor
    const popularity = this.getRoutePopularity(origin, destination);
    if (popularity >= 8) {
      multiplier *= 1.08;
      factors.push('Популярный маршрут');
    } else if (popularity <= 4) {
      multiplier *= 0.95;
      factors.push('Редкий маршрут');
    }
    
    return { multiplier, factors };
  }

  /**
   * Get all holidays for a year
   */
  static getYearlyHolidays(year: number, countryCode: string): string[] {
    const holidays = this.holidays[countryCode] || [];
    return holidays.filter(date => date.startsWith(year.toString()));
  }

  /**
   * Get booking recommendations based on date
   */
  static getBookingRecommendations(travelDate: Date, bookingDate: Date = new Date()): {
    recommendation: string;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  } {
    const daysAhead = Math.ceil((travelDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAhead < 7) {
      return {
        recommendation: 'Забронируйте как можно скорее',
        urgency: 'high',
        reason: 'Последняя неделя - цены обычно максимальные'
      };
    } else if (daysAhead < 21) {
      return {
        recommendation: 'Хорошее время для бронирования',
        urgency: 'medium',
        reason: '2-3 недели до поездки - умеренные цены'
      };
    } else if (daysAhead < 60) {
      return {
        recommendation: 'Оптимальное время для бронирования',
        urgency: 'low',
        reason: '1-2 месяца до поездки - обычно лучшие цены'
      };
    } else {
      return {
        recommendation: 'Можно подождать',
        urgency: 'low',
        reason: 'Раннее бронирование - цены могут снизиться'
      };
    }
  }

  /**
   * Get destination-specific tips
   */
  static getDestinationTips(countryCode: string): string[] {
    const tips: Record<string, string[]> = {
      'FR': [
        'Музеи бесплатны в первое воскресенье месяца',
        'Рестораны закрыты в воскресенье',
        'Август - месяц отпусков, многие заведения закрыты'
      ],
      'IT': [
        'Сиеста с 13:00 до 16:00 - магазины закрыты',
        'Избегайте августа - пик туристического сезона',
        'Покрывайте плечи при посещении церквей'
      ],
      'TH': [
        'Сезон дождей с мая по октябрь',
        'Снимайте обувь при входе в храмы',
        'Не прикасайтесь к голове тайцев'
      ],
      'AE': [
        'Рамадан влияет на работу заведений',
        'Дресс-код в общественных местах',
        'Пятница - выходной день'
      ]
    };
    
    return tips[countryCode] || ['Изучите местные обычаи и традиции'];
  }
}