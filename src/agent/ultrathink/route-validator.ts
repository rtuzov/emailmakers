import { CityInfo, RouteValidation } from './types';

export class RouteValidator {
  // Static database of popular cities with metadata (from open sources)
  private static readonly cityDatabase: Record<string, CityInfo> = {
    // Russia - Major cities
    'MOW': { name: 'Москва', country: 'RU', timezone: 'Europe/Moscow', popular: true, region: 'Central' },
    'LED': { name: 'Санкт-Петербург', country: 'RU', timezone: 'Europe/Moscow', popular: true, region: 'Northwest' },
    'AER': { name: 'Сочи', country: 'RU', timezone: 'Europe/Moscow', popular: true, seasonal: 'summer', region: 'South' },
    'KRR': { name: 'Краснодар', country: 'RU', timezone: 'Europe/Moscow', popular: false, region: 'South' },
    'ROV': { name: 'Ростов-на-Дону', country: 'RU', timezone: 'Europe/Moscow', popular: false, region: 'South' },
    'SVX': { name: 'Екатеринбург', country: 'RU', timezone: 'Asia/Yekaterinburg', popular: true, region: 'Urals' },
    'NOZ': { name: 'Новокузнецк', country: 'RU', timezone: 'Asia/Novokuznetsk', popular: false, region: 'Siberia' },
    'OVB': { name: 'Новосибирск', country: 'RU', timezone: 'Asia/Novosibirsk', popular: true, region: 'Siberia' },
    'VVO': { name: 'Владивосток', country: 'RU', timezone: 'Asia/Vladivostok', popular: true, region: 'Far East' },
    'IKT': { name: 'Иркутск', country: 'RU', timezone: 'Asia/Irkutsk', popular: false, region: 'Siberia' },
    
    // Europe - Popular destinations
    'CDG': { name: 'Париж', country: 'FR', timezone: 'Europe/Paris', popular: true, seasonal: 'all-year' },
    'LHR': { name: 'Лондон', country: 'GB', timezone: 'Europe/London', popular: true, seasonal: 'all-year' },
    'FCO': { name: 'Рим', country: 'IT', timezone: 'Europe/Rome', popular: true, seasonal: 'all-year' },
    'BCN': { name: 'Барселона', country: 'ES', timezone: 'Europe/Madrid', popular: true, seasonal: 'summer' },
    'MAD': { name: 'Мадрид', country: 'ES', timezone: 'Europe/Madrid', popular: true, seasonal: 'all-year' },
    'FRA': { name: 'Франкфурт', country: 'DE', timezone: 'Europe/Berlin', popular: true, seasonal: 'all-year' },
    'AMS': { name: 'Амстердам', country: 'NL', timezone: 'Europe/Amsterdam', popular: true, seasonal: 'all-year' },
    'VIE': { name: 'Вена', country: 'AT', timezone: 'Europe/Vienna', popular: true, seasonal: 'all-year' },
    'PRG': { name: 'Прага', country: 'CZ', timezone: 'Europe/Prague', popular: true, seasonal: 'all-year' },
    'WAW': { name: 'Варшава', country: 'PL', timezone: 'Europe/Warsaw', popular: false, seasonal: 'all-year' },
    
    // Asia - Popular destinations
    'BKK': { name: 'Бангкок', country: 'TH', timezone: 'Asia/Bangkok', popular: true, seasonal: 'winter' },
    'HKT': { name: 'Пхукет', country: 'TH', timezone: 'Asia/Bangkok', popular: true, seasonal: 'winter' },
    'DXB': { name: 'Дубай', country: 'AE', timezone: 'Asia/Dubai', popular: true, seasonal: 'winter' },
    'DEL': { name: 'Дели', country: 'IN', timezone: 'Asia/Kolkata', popular: true, seasonal: 'winter' },
    'GOI': { name: 'Гоа', country: 'IN', timezone: 'Asia/Kolkata', popular: true, seasonal: 'winter' },
    'TAS': { name: 'Ташкент', country: 'UZ', timezone: 'Asia/Tashkent', popular: false, seasonal: 'all-year' },
    'ALA': { name: 'Алматы', country: 'KZ', timezone: 'Asia/Almaty', popular: false, seasonal: 'all-year' },
    'TSE': { name: 'Астана', country: 'KZ', timezone: 'Asia/Almaty', popular: false, seasonal: 'all-year' },
    
    // Americas
    'JFK': { name: 'Нью-Йорк', country: 'US', timezone: 'America/New_York', popular: true, seasonal: 'all-year' },
    'LAX': { name: 'Лос-Анджелес', country: 'US', timezone: 'America/Los_Angeles', popular: true, seasonal: 'all-year' },
    'MIA': { name: 'Майами', country: 'US', timezone: 'America/New_York', popular: true, seasonal: 'winter' },
    'YYZ': { name: 'Торонто', country: 'CA', timezone: 'America/Toronto', popular: false, seasonal: 'all-year' },
    
    // Others
    'CAI': { name: 'Каир', country: 'EG', timezone: 'Africa/Cairo', popular: false, seasonal: 'winter' },
    'TLV': { name: 'Тель-Авив', country: 'IL', timezone: 'Asia/Jerusalem', popular: true, seasonal: 'all-year' },
    'IST': { name: 'Стамбул', country: 'TR', timezone: 'Europe/Istanbul', popular: true, seasonal: 'all-year' }
  };

  // Popular route patterns from open travel data
  private static readonly popularRoutes: Set<string> = new Set([
    'MOW-LED', 'LED-MOW',  // Moscow ↔ St. Petersburg
    'MOW-AER', 'AER-MOW',  // Moscow ↔ Sochi
    'LED-AER', 'AER-LED',  // St. Petersburg ↔ Sochi
    'MOW-SVX', 'SVX-MOW',  // Moscow ↔ Ekaterinburg
    'MOW-CDG', 'CDG-MOW',  // Moscow ↔ Paris
    'MOW-LHR', 'LHR-MOW',  // Moscow ↔ London
    'MOW-FCO', 'FCO-MOW',  // Moscow ↔ Rome
    'MOW-BKK', 'BKK-MOW',  // Moscow ↔ Bangkok
    'MOW-DXB', 'DXB-MOW',  // Moscow ↔ Dubai
    'LED-CDG', 'CDG-LED',  // St. Petersburg ↔ Paris
    'LED-LHR', 'LHR-LED'   // St. Petersburg ↔ London
  ]);

  /**
   * Validate route logic and suggest corrections
   */
  static validateRoute(origin: string, destination: string): RouteValidation {
    const issues: string[] = [];
    let correctedOrigin = origin;
    let correctedDestination = destination;

    // Check 1: Same city validation
    if (origin === destination) {
      issues.push('same_origin_destination');
      correctedDestination = this.suggestAlternativeDestination(origin);
    }

    // Check 2: City existence
    const originInfo = this.cityDatabase[origin];
    const destinationInfo = this.cityDatabase[destination];

    if (!originInfo) {
      issues.push('unknown_origin');
    }

    if (!destinationInfo) {
      issues.push('unknown_destination');
    }

    // If both cities are unknown, we can't validate much
    if (!originInfo && !destinationInfo) {
      return {
        valid: false,
        issues,
        suggestion: 'Используйте известные коды аэропортов (например: MOW, LED, AER)'
      };
    }

    // Check 3: Route popularity
    const routeKey = `${origin}-${destination}`;
    const popularity = this.getRoutePopularity(routeKey);

    // Check 4: Geographic logic
    const geoIssues = this.validateGeography(originInfo, destinationInfo);
    issues.push(...geoIssues);

    return {
      valid: issues.length === 0 || issues.every(issue => !['same_origin_destination', 'unknown_origin', 'unknown_destination'].includes(issue)),
      popularity,
      timezoneDiff: this.calculateTimezoneDiff(originInfo, destinationInfo),
      issues,
      correctedOrigin: correctedOrigin !== origin ? correctedOrigin : undefined,
      correctedDestination: correctedDestination !== destination ? correctedDestination : undefined,
      suggestion: this.generateSuggestion(issues, popularity)
    };
  }

  /**
   * Get city information by airport code
   */
  static getCityInfo(airportCode: string): CityInfo | null {
    return this.cityDatabase[airportCode] || null;
  }

  /**
   * Get all available cities
   */
  static getAllCities(): Record<string, CityInfo> {
    return { ...this.cityDatabase };
  }

  /**
   * Suggest alternative destination for same-city routes
   */
  private static suggestAlternativeDestination(origin: string): string {
    const suggestions: Record<string, string> = {
      'MOW': 'LED',  // Moscow → St. Petersburg
      'LED': 'MOW',  // St. Petersburg → Moscow
      'AER': 'MOW',  // Sochi → Moscow
      'SVX': 'MOW',  // Ekaterinburg → Moscow
      'CDG': 'LHR',  // Paris → London
      'LHR': 'CDG'   // London → Paris
    };

    return suggestions[origin] || 'MOW';
  }

  /**
   * Determine route popularity
   */
  private static getRoutePopularity(routeKey: string): 'high' | 'medium' | 'low' {
    if (this.popularRoutes.has(routeKey)) {
      return 'high';
    }

    // Check if it's a route between popular cities
    const [origin, destination] = routeKey.split('-');
    const originInfo = this.cityDatabase[origin];
    const destinationInfo = this.cityDatabase[destination];

    if (originInfo?.popular && destinationInfo?.popular) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Validate geographic logic
   */
  private static validateGeography(originInfo: CityInfo | undefined, destinationInfo: CityInfo | undefined): string[] {
    const issues: string[] = [];

    if (!originInfo || !destinationInfo) {
      return issues;
    }

    // Check for very short domestic routes that might be better by train
    if (originInfo.country === 'RU' && destinationInfo.country === 'RU') {
      const shortRoutes = ['MOW-LED', 'LED-MOW']; // Moscow-SPb is often better by train
      const routeKey = `${this.getCodeByInfo(originInfo)}-${this.getCodeByInfo(destinationInfo)}`;
      
      if (shortRoutes.includes(routeKey)) {
        issues.push('consider_train_alternative');
      }
    }

    return issues;
  }

  /**
   * Calculate timezone difference between cities
   */
  private static calculateTimezoneDiff(originInfo: CityInfo | undefined, destinationInfo: CityInfo | undefined): number {
    if (!originInfo || !destinationInfo) {
      return 0;
    }

    // Simplified timezone offset calculation (would be more accurate with proper timezone library)
    const timezoneOffsets: Record<string, number> = {
      'Europe/Moscow': 3,
      'Europe/Paris': 1,
      'Europe/London': 0,
      'Europe/Rome': 1,
      'Europe/Madrid': 1,
      'Europe/Berlin': 1,
      'Europe/Amsterdam': 1,
      'Europe/Vienna': 1,
      'Europe/Prague': 1,
      'Europe/Warsaw': 1,
      'Europe/Istanbul': 3,
      'Asia/Yekaterinburg': 5,
      'Asia/Novosibirsk': 7,
      'Asia/Vladivostok': 10,
      'Asia/Irkutsk': 8,
      'Asia/Bangkok': 7,
      'Asia/Dubai': 4,
      'Asia/Kolkata': 5.5,
      'Asia/Tashkent': 5,
      'Asia/Almaty': 6,
      'Asia/Jerusalem': 2,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'America/Toronto': -5,
      'Africa/Cairo': 2
    };

    const originOffset = timezoneOffsets[originInfo.timezone] || 0;
    const destinationOffset = timezoneOffsets[destinationInfo.timezone] || 0;

    return destinationOffset - originOffset;
  }

  /**
   * Generate helpful suggestion based on validation issues
   */
  private static generateSuggestion(issues: string[], popularity: 'high' | 'medium' | 'low'): string {
    if (issues.includes('same_origin_destination')) {
      return 'Маршрут исправлен на популярное направление';
    }

    if (issues.includes('unknown_origin') || issues.includes('unknown_destination')) {
      return 'Проверьте коды аэропортов. Популярные: MOW, LED, AER, CDG, LHR';
    }

    if (issues.includes('consider_train_alternative')) {
      return 'Рассмотрите поезд для этого маршрута - может быть удобнее';
    }

    if (popularity === 'low') {
      return 'Редкий маршрут - проверьте наличие прямых рейсов';
    }

    return 'Маршрут выглядит корректным';
  }

  /**
   * Helper to find airport code by city info
   */
  private static getCodeByInfo(cityInfo: CityInfo): string {
    for (const [code, info] of Object.entries(this.cityDatabase)) {
      if (info === cityInfo) {
        return code;
      }
    }
    return '';
  }

  /**
   * Get popular destinations from a given origin
   */
  static getPopularDestinations(origin: string, limit: number = 5): string[] {
    const destinations: string[] = [];
    
    for (const route of this.popularRoutes) {
      if (route.startsWith(origin + '-')) {
        destinations.push(route.split('-')[1]);
      }
    }

    // If not enough popular routes, add other popular cities
    if (destinations.length < limit) {
      for (const [code, info] of Object.entries(this.cityDatabase)) {
        if (info.popular && code !== origin && !destinations.includes(code)) {
          destinations.push(code);
          if (destinations.length >= limit) break;
        }
      }
    }

    return destinations.slice(0, limit);
  }
}