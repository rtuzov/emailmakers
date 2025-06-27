import { DateValidation, SeasonalContext } from './types';
import { RouteValidator } from './route-validator';
import { InputSanitizer } from './input-sanitizer';

export class DateValidator {
  // Public holidays from open sources (major holidays only)
  private static readonly holidays: Record<string, string[]> = {
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
    'FR': [
      '2025-01-01', // New Year
      '2025-04-21', // Easter Monday
      '2025-05-01', // Labour Day
      '2025-05-08', // Victory in Europe Day
      '2025-05-29', // Ascension Day
      '2025-06-09', // Whit Monday
      '2025-07-14', // Bastille Day
      '2025-08-15', // Assumption of Mary
      '2025-11-01', // All Saints' Day
      '2025-11-11', // Armistice Day
      '2025-12-25'  // Christmas
    ],
    'GB': [
      '2025-01-01', // New Year
      '2025-04-18', // Good Friday
      '2025-04-21', // Easter Monday
      '2025-05-05', // Early May Bank Holiday
      '2025-05-26', // Spring Bank Holiday
      '2025-08-25', // Summer Bank Holiday
      '2025-12-25', // Christmas
      '2025-12-26'  // Boxing Day
    ],
    'IT': [
      '2025-01-01', // New Year
      '2025-01-06', // Epiphany
      '2025-04-21', // Easter Monday
      '2025-04-25', // Liberation Day
      '2025-05-01', // Labour Day
      '2025-06-02', // Republic Day
      '2025-08-15', // Assumption of Mary
      '2025-11-01', // All Saints' Day
      '2025-12-08', // Immaculate Conception
      '2025-12-25', // Christmas
      '2025-12-26'  // St. Stephen's Day
    ]
  };

  // Seasonal data based on travel patterns
  private static readonly seasonalPricing: Record<string, SeasonalContext> = {
    'spring': { 
      season: 'spring', 
      priceFactor: 0.9, 
      months: [3, 4, 5],
      description: 'Весенний сезон - умеренные цены, хорошая погода для городского туризма'
    },
    'summer': { 
      season: 'summer', 
      priceFactor: 1.3, 
      months: [6, 7, 8],
      description: 'Летний пик - высокие цены, лучшее время для пляжного отдыха'
    },
    'autumn': { 
      season: 'autumn', 
      priceFactor: 0.8, 
      months: [9, 10, 11],
      description: 'Осенний сезон - низкие цены, комфортная погода для экскурсий'
    },
    'winter': { 
      season: 'winter', 
      priceFactor: 1.1, 
      months: [12, 1, 2],
      description: 'Зимний период - умеренные цены, время новогодних поездок'
    }
  };

  /**
   * Validate date range and provide contextual information
   */
  static validateDateRange(dateRange: string, destination?: string): DateValidation {
    // Security: Rate limiting check
    if (!InputSanitizer.checkRateLimit('date_validation')) {
      return {
        valid: false,
        issue: 'rate_limit_exceeded',
        suggestion: 'Too many validation requests. Please try again later.'
      };
    }

    // Security: Input sanitization and validation
    const sanitizedDateRange = InputSanitizer.validateDateRange(dateRange);
    if (!sanitizedDateRange) {
      return {
        valid: false,
        issue: 'invalid_date_format',
        suggestion: 'Date range must be in format YYYY-MM-DD,YYYY-MM-DD'
      };
    }

    // Sanitize destination if provided
    const sanitizedDestination = destination ? InputSanitizer.validateCityCode(destination) : undefined;

    try {
      const [startDateStr, endDateStr] = sanitizedDateRange.split(',');
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      const now = new Date();

      // Validation checks
      const validationResult = this.performDateChecks(startDate, endDate, now);
      
      if (!validationResult.valid) {
        return validationResult;
      }

      // Get seasonal context
      const seasonalContext = this.getSeasonalContext(startDate);
      
      // Check holidays (use sanitized destination)
      const isHoliday = this.checkHoliday(startDate, sanitizedDestination);
      
      // Destination-specific validation (use sanitized destination)
      const destinationWarnings = this.getDestinationWarnings(startDate, sanitizedDestination);

      return {
        valid: true,
        seasonalContext,
        isHoliday,
        warning: destinationWarnings.length > 0 ? destinationWarnings.join('; ') : undefined,
        suggestion: this.generateDateSuggestion(startDate, endDate, seasonalContext, isHoliday, sanitizedDestination)
      };

    } catch (error) {
      return {
        valid: false,
        issue: 'invalid_date_format',
        suggestion: 'Используйте формат YYYY-MM-DD,YYYY-MM-DD'
      };
    }
  }

  /**
   * Perform basic date validation checks
   */
  private static performDateChecks(startDate: Date, endDate: Date, now: Date): DateValidation {
    // Check 1: Valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        valid: false,
        issue: 'invalid_date_format',
        suggestion: 'Проверьте формат дат (YYYY-MM-DD)'
      };
    }

    // Check 2: Start date before end date
    if (startDate >= endDate) {
      return {
        valid: false,
        issue: 'start_after_end',
        suggestion: 'Дата начала должна быть раньше даты окончания'
      };
    }

    // Check 3: Not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return {
        valid: false,
        issue: 'date_in_past',
        suggestion: 'Нельзя забронировать билеты на прошедшую дату'
      };
    }

    // Check 4: Too close to departure (less than 2 days)
    const daysAhead = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAhead < 2) {
      return {
        valid: false,
        issue: 'too_soon',
        suggestion: 'Рекомендуется бронировать минимум за 2 дня до вылета'
      };
    }

    // Check 5: Too far in the future (more than 11 months)
    if (daysAhead > 330) {
      return {
        valid: false,
        issue: 'too_far',
        suggestion: 'Большинство авиакомпаний открывают продажи за 11 месяцев'
      };
    }

    // Check 6: Trip duration
    const tripDuration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (tripDuration > 30) {
      return {
        valid: true,
        warning: 'long_trip',
        suggestion: 'Длительная поездка - рассмотрите возможность покупки билетов в разное время'
      };
    }

    return { valid: true };
  }

  /**
   * Get seasonal context for the travel date
   */
  static getSeasonalContext(date: Date): SeasonalContext {
    const month = date.getMonth() + 1; // getMonth() returns 0-11

    for (const [seasonKey, seasonData] of Object.entries(this.seasonalPricing)) {
      if (seasonData.months.includes(month)) {
        return seasonData;
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
   * Check if date is a holiday
   */
  static checkHoliday(date: Date, destination?: string): boolean {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check Russian holidays
    if (this.holidays['RU'].includes(dateStr)) {
      return true;
    }

    // Check destination country holidays if available
    if (destination) {
      const cityInfo = RouteValidator.getCityInfo(destination);
      if (cityInfo && this.holidays[cityInfo.country]) {
        return this.holidays[cityInfo.country].includes(dateStr);
      }
    }

    return false;
  }

  /**
   * Get destination-specific warnings
   */
  private static getDestinationWarnings(date: Date, destination?: string): string[] {
    const warnings: string[] = [];
    
    if (!destination) {
      return warnings;
    }

    const cityInfo = RouteValidator.getCityInfo(destination);
    if (!cityInfo) {
      return warnings;
    }

    const month = date.getMonth() + 1;
    const seasonalContext = this.getSeasonalContext(date);

    // Seasonal warnings for specific destinations
    if (cityInfo.seasonal === 'summer' && !seasonalContext.months.includes(month) && month < 5) {
      warnings.push(`${cityInfo.name} лучше посещать летом (июнь-август)`);
    }

    if (cityInfo.seasonal === 'winter' && seasonalContext.season === 'summer') {
      warnings.push(`${cityInfo.name} популярен зимой - летом может быть слишком жарко`);
    }

    // Regional specific warnings
    if (cityInfo.region === 'Siberia' && (month === 12 || month === 1 || month === 2)) {
      warnings.push('Сибирские регионы зимой - экстремально холодная погода');
    }

    return warnings;
  }

  /**
   * Generate helpful date suggestion
   */
  private static generateDateSuggestion(
    startDate: Date, 
    endDate: Date, 
    seasonal: SeasonalContext, 
    isHoliday: boolean, 
    destination?: string
  ): string {
    const suggestions: string[] = [];

    // Holiday suggestions
    if (isHoliday) {
      suggestions.push('Праздничные даты - ожидайте повышенный спрос и цены');
    }

    // Seasonal suggestions
    if (seasonal.priceFactor > 1.2) {
      suggestions.push('Пиковый сезон - рассмотрите даты в межсезонье для экономии');
    } else if (seasonal.priceFactor < 0.9) {
      suggestions.push('Низкий сезон - хорошее время для выгодных покупок');
    }

    // Destination-specific suggestions
    if (destination) {
      const cityInfo = RouteValidator.getCityInfo(destination);
      if (cityInfo?.seasonal === 'summer' && seasonal.season !== 'summer') {
        suggestions.push('Для пляжного отдыха рекомендуется летний период');
      }
    }

    // Booking timing suggestions
    const daysAhead = (startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (daysAhead < 7) {
      suggestions.push('Позднее бронирование - цены могут быть выше');
    } else if (daysAhead > 60) {
      suggestions.push('Раннее бронирование - хорошие шансы на выгодные цены');
    }

    return suggestions.length > 0 ? suggestions.join('. ') : 'Выбранные даты выглядят подходящими';
  }

  /**
   * Suggest optimal date ranges for a destination
   */
  static suggestOptimalDates(destination: string, monthsAhead: number = 3): string[] {
    const cityInfo = RouteValidator.getCityInfo(destination);
    const suggestions: string[] = [];
    const now = new Date();
    
    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 15); // Mid-month
      const seasonal = this.getSeasonalContext(futureDate);
      const isHoliday = this.checkHoliday(futureDate, destination);
      
      let score = 100;
      
      // Adjust score based on seasonal context
      if (cityInfo?.seasonal === 'summer' && seasonal.season === 'summer') {
        score += 20;
      } else if (cityInfo?.seasonal === 'winter' && seasonal.season === 'winter') {
        score += 20;
      }
      
      // Penalty for holidays
      if (isHoliday) {
        score -= 15;
      }
      
      // Penalty for high price factor
      score -= (seasonal.priceFactor - 1) * 30;
      
      const startDate = futureDate.toISOString().split('T')[0];
      const endDate = new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      suggestions.push(`${startDate},${endDate} (оценка: ${Math.round(score)})`);
    }
    
    return suggestions.sort((a, b) => {
      const scoreA = parseInt(a.match(/оценка: (\d+)/)?.[1] || '0');
      const scoreB = parseInt(b.match(/оценка: (\d+)/)?.[1] || '0');
      return scoreB - scoreA;
    });
  }

  /**
   * Get all holidays for a country
   */
  static getHolidays(countryCode: string): string[] {
    return this.holidays[countryCode] || [];
  }

  /**
   * Check if a date range spans holidays
   */
  static checkHolidaySpan(dateRange: string, destination?: string): { hasHolidays: boolean; holidays: string[] } {
    try {
      const [startDateStr, endDateStr] = dateRange.split(',');
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      const holidaysInRange: string[] = [];
      
      // Check each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (this.checkHoliday(d, destination)) {
          holidaysInRange.push(d.toISOString().split('T')[0]);
        }
      }
      
      return {
        hasHolidays: holidaysInRange.length > 0,
        holidays: holidaysInRange
      };
    } catch {
      return { hasHolidays: false, holidays: [] };
    }
  }
}