import { ContextEnrichment, ValidationResult, ValidationIssue } from './types';
import { EmailGenerationRequest } from '../agent';
import { RouteValidator } from './route-validator';
import { DateValidator } from './date-validator';
import { SimpleDataProvider } from './simple-data-provider';

export class ContextEnricher {

  /**
   * Enrich request with contextual intelligence
   */
  static async enrichContext(request: EmailGenerationRequest): Promise<ContextEnrichment> {
    console.log('🧠 ContextEnricher: Enriching context for request');

    // Initialize enrichment object
    const enrichment: ContextEnrichment = {
      seasonal: { season: 'unknown', priceFactor: 1.0, months: [] },
      holidays: false,
      routePopularity: 'medium',
      timezoneDiff: 0,
      suggestions: [],
      warnings: []
    };

    try {
      // Enrich route context
      if (request.origin && request.destination) {
        await this.enrichRouteContext(request.origin, request.destination, enrichment);
      }

      // Enrich date context
      if (request.date_range) {
        await this.enrichDateContext(request.date_range, request.destination, enrichment);
      }

      // Add general travel context
      await this.enrichTravelContext(request, enrichment);

      // Generate smart suggestions
      this.generateSmartSuggestions(request, enrichment);

      console.log('✅ ContextEnricher: Context enriched successfully');
      return enrichment;

    } catch (error) {
      console.error('❌ ContextEnricher: Error enriching context:', error);
      
      // Return basic enrichment on error
      return {
        seasonal: SimpleDataProvider.getSeasonalContext(new Date()),
        holidays: false,
        routePopularity: 'medium',
        timezoneDiff: 0,
        suggestions: ['Используйте проверенные коды аэропортов и даты'],
        warnings: ['Не удалось обогатить контекст - используются базовые настройки']
      };
    }
  }

  /**
   * Validate and correct request parameters
   */
  static async validateAndCorrect(request: EmailGenerationRequest): Promise<ValidationResult> {
    console.log('🔍 ContextEnricher: Validating request parameters');

    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    let correctedRequest = { ...request };

    // Validate route
    if (request.origin && request.destination) {
      const routeValidation = RouteValidator.validateRoute(request.origin, request.destination);
      
      if (!routeValidation.valid) {
        issues.push({
          type: 'route',
          severity: 'error',
          message: 'Некорректный маршрут',
          suggestion: routeValidation.suggestion,
          autofix: true
        });

        // Apply corrections
        if (routeValidation.correctedOrigin) {
          correctedRequest.origin = routeValidation.correctedOrigin;
        }
        if (routeValidation.correctedDestination) {
          correctedRequest.destination = routeValidation.correctedDestination;
        }
      } else if (routeValidation.popularity === 'low') {
        issues.push({
          type: 'route',
          severity: 'warning',
          message: 'Редкий маршрут - проверьте наличие прямых рейсов',
          suggestion: 'Рассмотрите альтернативные аэропорты'
        });
      }

      if (routeValidation.suggestion) {
        suggestions.push(routeValidation.suggestion);
      }
    }

    // Validate dates
    if (request.date_range) {
      const dateValidation = DateValidator.validateDateRange(request.date_range, request.destination);
      
      if (!dateValidation.valid) {
        issues.push({
          type: 'date',
          severity: 'error',
          message: dateValidation.issue || 'Некорректная дата',
          suggestion: dateValidation.suggestion,
          autofix: dateValidation.issue === 'too_soon'
        });

        // Auto-fix date issues if possible
        if (dateValidation.issue === 'too_soon') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 3);
          const endDate = new Date(tomorrow);
          endDate.setDate(endDate.getDate() + 7);
          
          correctedRequest.date_range = `${tomorrow.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
        }
      } else if (dateValidation.warning) {
        issues.push({
          type: 'date',
          severity: 'warning',
          message: dateValidation.warning,
          suggestion: dateValidation.suggestion
        });
      }

      if (dateValidation.suggestion) {
        suggestions.push(dateValidation.suggestion);
      }
    }

    // Validate other parameters
    this.validateOtherParameters(request, issues, suggestions);

    const isValid = issues.every(issue => issue.severity !== 'error');

    return {
      valid: isValid,
      correctedRequest: isValid ? undefined : correctedRequest,
      issues,
      suggestions
    };
  }

  /**
   * Enrich route-specific context
   */
  private static async enrichRouteContext(
    origin: string, 
    destination: string, 
    enrichment: ContextEnrichment
  ): Promise<void> {
    const routeValidation = RouteValidator.validateRoute(origin, destination);
    
    enrichment.routePopularity = routeValidation.popularity || 'medium';
    enrichment.timezoneDiff = routeValidation.timezoneDiff || 0;

    // Get route-specific insights
    const popularity = SimpleDataProvider.getRoutePopularity(origin, destination);
    
    if (popularity >= 8) {
      enrichment.suggestions.push('Популярный маршрут - рекомендуется раннее бронирование');
    } else if (popularity <= 4) {
      enrichment.suggestions.push('Редкий маршрут - проверьте наличие прямых рейсов');
    }

    // Timezone suggestions
    if (Math.abs(enrichment.timezoneDiff) >= 6) {
      enrichment.suggestions.push('Значительная разница во времени - учтите джетлаг');
    }

    // City-specific context
    const originInfo = RouteValidator.getCityInfo(origin);
    const destinationInfo = RouteValidator.getCityInfo(destination);

    if (destinationInfo) {
      // Add destination tips
      const tips = SimpleDataProvider.getDestinationTips(destinationInfo.country);
      enrichment.suggestions.push(...tips.slice(0, 2)); // Add first 2 tips

      // Travel advisory
      const advisory = SimpleDataProvider.getTravelAdvisory(destinationInfo.country);
      if (advisory.level !== 'green') {
        enrichment.warnings.push(`Уровень безопасности: ${advisory.level} - ${advisory.description}`);
      }
    }
  }

  /**
   * Enrich date-specific context
   */
  private static async enrichDateContext(
    dateRange: string, 
    destination: string | undefined, 
    enrichment: ContextEnrichment
  ): Promise<void> {
    try {
      const [startDateStr] = dateRange.split(',');
      const startDate = new Date(startDateStr);

      // Get seasonal context
      enrichment.seasonal = SimpleDataProvider.getSeasonalContext(startDate);

      // Check holidays
      const dateStr = startDate.toISOString().split('T')[0];
      enrichment.holidays = SimpleDataProvider.isHoliday(dateStr, 'RU');

      // Add destination country holidays
      if (destination) {
        const cityInfo = RouteValidator.getCityInfo(destination);
        if (cityInfo && SimpleDataProvider.isHoliday(dateStr, cityInfo.country)) {
          enrichment.holidays = true;
          enrichment.suggestions.push(`${dateStr} - праздник в ${cityInfo.name}`);
        }
      }

      // School holidays check
      const schoolHoliday = SimpleDataProvider.isSchoolHoliday(startDate);
      if (schoolHoliday.isHoliday) {
        enrichment.suggestions.push(`Школьные каникулы: ${schoolHoliday.holidayName}`);
      }

      // Weekend check
      if (SimpleDataProvider.isWeekend(startDate)) {
        enrichment.suggestions.push('Вылет в выходной день - возможно повышение цен');
      }

      // Booking recommendations
      const bookingRec = SimpleDataProvider.getBookingRecommendations(startDate);
      if (bookingRec.urgency === 'high') {
        enrichment.warnings.push(bookingRec.reason);
      } else {
        enrichment.suggestions.push(bookingRec.recommendation + ': ' + bookingRec.reason);
      }

      // Price multiplier context
      if (destination) {
        const cityInfo = RouteValidator.getCityInfo(destination);
        const priceContext = SimpleDataProvider.getPriceMultiplier(
          startDate, 
          'MOW', // Default origin for calculation
          destination, 
          cityInfo?.country
        );

        if (priceContext.multiplier > 1.15) {
          enrichment.warnings.push(`Ожидается повышение цен: ${priceContext.factors.join(', ')}`);
        } else if (priceContext.multiplier < 0.9) {
          enrichment.suggestions.push(`Выгодный период: ${priceContext.factors.join(', ')}`);
        }
      }

    } catch (error) {
      enrichment.warnings.push('Не удалось проанализировать даты');
    }
  }

  /**
   * Enrich general travel context
   */
  private static async enrichTravelContext(
    request: EmailGenerationRequest, 
    enrichment: ContextEnrichment
  ): Promise<void> {
    // Campaign type specific suggestions
    switch (request.campaign_type) {
      case 'promotional':
        enrichment.suggestions.push('Акцентируйте внимание на выгоде и скидках');
        break;
      case 'seasonal':
        enrichment.suggestions.push('Используйте сезонные мотивы в дизайне');
        break;
      case 'informational':
        enrichment.suggestions.push('Фокус на полезной информации и советах');
        break;
    }

    // Cabin class suggestions
    if (request.cabin_class === 'business' || request.cabin_class === 'first') {
      enrichment.suggestions.push('Премиум-класс - используйте люксовые образы');
    }

    // Target audience insights
    if (request.target_audience) {
      if (request.target_audience.includes('семь') || request.target_audience.includes('дети')) {
        enrichment.suggestions.push('Семейная аудитория - добавьте детские активности');
      }
      if (request.target_audience.includes('бизнес')) {
        enrichment.suggestions.push('Бизнес-аудитория - фокус на комфорте и времени');
      }
    }
  }

  /**
   * Generate smart contextual suggestions
   */
  private static generateSmartSuggestions(
    request: EmailGenerationRequest, 
    enrichment: ContextEnrichment
  ): void {
    // Seasonal marketing suggestions
    switch (enrichment.seasonal.season) {
      case 'spring':
        enrichment.suggestions.push('Весенняя тематика - обновление, первые путешествия года');
        break;
      case 'summer':
        enrichment.suggestions.push('Летние мотивы - отпуск, море, солнце');
        break;
      case 'autumn':
        enrichment.suggestions.push('Осенние краски - уютные города, музеи');
        break;
      case 'winter':
        enrichment.suggestions.push('Зимняя магия - новогодние каникулы, горы');
        break;
    }

    // Route-specific marketing angles
    if (enrichment.routePopularity === 'high') {
      enrichment.suggestions.push('Популярное направление - создайте ощущение эксклюзивности');
    } else if (enrichment.routePopularity === 'low') {
      enrichment.suggestions.push('Необычное направление - подчеркните уникальность');
    }

    // Price-focused suggestions based on seasonal factor
    if (enrichment.seasonal.priceFactor > 1.2) {
      enrichment.suggestions.push('Высокий сезон - фокус на качестве, а не на цене');
    } else if (enrichment.seasonal.priceFactor < 0.9) {
      enrichment.suggestions.push('Выгодный период - акцентируйте экономию');
    }

    // Holiday-specific suggestions
    if (enrichment.holidays) {
      enrichment.suggestions.push('Праздничные даты - используйте праздничную тематику');
    }
  }

  /**
   * Validate other request parameters
   */
  private static validateOtherParameters(
    request: EmailGenerationRequest, 
    issues: ValidationIssue[], 
    suggestions: string[]
  ): void {
    // Topic validation
    if (!request.topic || request.topic.trim().length < 3) {
      issues.push({
        type: 'parameter',
        severity: 'error',
        message: 'Тема письма слишком короткая',
        suggestion: 'Укажите описательную тему (минимум 3 символа)'
      });
    } else if (request.topic.length > 100) {
      issues.push({
        type: 'parameter',
        severity: 'warning',
        message: 'Слишком длинная тема',
        suggestion: 'Сократите тему до 100 символов для лучшей читаемости'
      });
    }

    // Check for common topic issues
    if (request.topic.toLowerCase().includes('test') || request.topic.toLowerCase().includes('тест')) {
      issues.push({
        type: 'parameter',
        severity: 'warning',
        message: 'Тестовая тема обнаружена',
        suggestion: 'Убедитесь, что это не случайный тест'
      });
    }

    // Cabin class validation
    if (request.cabin_class && !['economy', 'business', 'first'].includes(request.cabin_class)) {
      issues.push({
        type: 'parameter',
        severity: 'error',
        message: 'Некорректный класс обслуживания',
        suggestion: 'Используйте: economy, business, или first'
      });
    }

    // Target audience suggestions
    if (!request.target_audience) {
      suggestions.push('Укажите целевую аудиторию для персонализации контента');
    }
  }

  /**
   * Get enrichment summary for logging
   */
  static getEnrichmentSummary(enrichment: ContextEnrichment): string {
    const summary = [
      `Сезон: ${enrichment.seasonal.season} (фактор: ${enrichment.seasonal.priceFactor})`,
      `Популярность маршрута: ${enrichment.routePopularity}`,
      `Разница в часовых поясах: ${enrichment.timezoneDiff}ч`,
      `Праздники: ${enrichment.holidays ? 'да' : 'нет'}`,
      `Предложений: ${enrichment.suggestions.length}`,
      `Предупреждений: ${enrichment.warnings.length}`
    ];

    return summary.join(', ');
  }

  /**
   * Format enrichment for prompt injection
   */
  static formatForPrompt(enrichment: ContextEnrichment): string {
    const sections: string[] = [];

    // Seasonal context
    sections.push(`СЕЗОННЫЙ КОНТЕКСТ: ${enrichment.seasonal.description}`);

    // Route context
    if (enrichment.routePopularity !== 'medium') {
      sections.push(`МАРШРУТ: ${enrichment.routePopularity === 'high' ? 'Популярное направление' : 'Редкий маршрут'}`);
    }

    // Holiday context
    if (enrichment.holidays) {
      sections.push('ПРАЗДНИКИ: Праздничный период - учтите повышенный спрос');
    }

    // Key suggestions
    if (enrichment.suggestions.length > 0) {
      sections.push(`РЕКОМЕНДАЦИИ: ${enrichment.suggestions.slice(0, 3).join('; ')}`);
    }

    // Important warnings
    if (enrichment.warnings.length > 0) {
      sections.push(`ВАЖНО: ${enrichment.warnings.join('; ')}`);
    }

    return sections.join('\n');
  }
}