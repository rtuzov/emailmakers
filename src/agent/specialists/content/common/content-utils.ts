/**
 * 🛠️ CONTENT UTILITIES
 * 
 * Общие утилиты для всех content сервисов
 * Используется в pricing-service, generation-service
 */

import { ContentGeneratorParams, ValidationResult, PerformanceMetrics } from './content-types';

export class ContentUtils {
  /**
   * Валидация входных параметров content задач
   */
  static validateContentInput(params: ContentGeneratorParams): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка обязательных полей
    if (!params.topic || params.topic.trim().length === 0) {
      errors.push('Topic is required and cannot be empty');
    }

    if (!params.action) {
      errors.push('Action is required');
    }

    // Валидация pricing_data если требуется
    if (params.pricing_data) {
      if (!params.pricing_data.prices || params.pricing_data.prices.length === 0) {
        errors.push('Pricing data must contain at least one price');
      }

      if (!params.pricing_data.currency) {
        errors.push('Currency is required when pricing data is provided');
      }

      if (params.pricing_data.cheapest !== undefined && typeof params.pricing_data.cheapest !== 'number') {
        errors.push('Cheapest price must be a valid number');
      }
    }

    // Валидация вариантов для A/B тестирования
    if (params.variant_options?.generate_variants) {
      const variantCount = params.variant_options.variant_count || 2;
      if (variantCount < 1 || variantCount > 5) {
        errors.push('Variant count must be between 1 and 5');
      }
    }

    // Валидация контента для оптимизации
    if (params.action === 'optimize' && !params.existing_content) {
      errors.push('Existing content is required for optimization action');
    }

    // Валидация для анализа
    if (params.action === 'analyze') {
      if (!params.existing_content && !params.benchmark_content) {
        errors.push('Either existing content or benchmark content is required for analysis');
      }
    }

    // Предупреждения
    if (params.content_specs?.max_length && params.content_specs.max_length < 100) {
      warnings.push('Maximum content length is very short, may limit content quality');
    }

    if (params.target_audience && typeof params.target_audience !== 'string') {
      warnings.push('Target audience should be a string literal, not an object');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Расчет метрик производительности
   */
  static calculatePerformance(
    _action: string,
    startTime: number,
    additionalMetrics?: Record<string, number>
  ): PerformanceMetrics {
    const executionTime = Date.now() - startTime;
    
    return {
      execution_time: executionTime,
      tokens_used: additionalMetrics?.tokens_used || 0,
      api_calls_made: additionalMetrics?.api_calls_made || 1,
      cache_hits: additionalMetrics?.cache_hits || 0,
      success_rate: additionalMetrics?.success_rate || 100
    };
  }

  /**
   * Генерация уникального ID
   */
  static generateId(prefix: string = 'content'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Расчет размера контента в KB
   */
  static calculateContentSize(content: string): number {
    return new Blob([content]).size / 1024;
  }

  /**
   * Мапинг аудитории на тон
   */
  static mapAudienceToTone(audienceType: string): 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family' {
    const mapping: Record<string, any> = {
      'business_travelers': 'professional',
      'families': 'family',
      'young_adults': 'casual',
      'seniors': 'friendly',
      'budget_conscious': 'urgent',
      'luxury_seekers': 'luxury'
    };

    return mapping[audienceType] || 'friendly';
  }

  /**
   * Определение психологических триггеров аудитории
   */
  static mapAudienceToTriggers(audienceType: string): string[] {
    const triggers: Record<string, string[]> = {
      'families': ['safety', 'value', 'convenience', 'memories'],
      'business_travelers': ['efficiency', 'comfort', 'reliability', 'status'],
      'young_adults': ['adventure', 'social', 'budget', 'flexibility'],
      'seniors': ['comfort', 'service', 'security', 'simplicity'],
      'budget_conscious': ['savings', 'deals', 'value', 'comparison'],
      'luxury_seekers': ['exclusivity', 'premium', 'status', 'experience']
    };

    return triggers[audienceType] || ['value', 'convenience'];
  }

  /**
   * Получение приоритетов сообщений для аудитории
   */
  static getMessagingPriorities(audience: string | any): string[] {
    const audienceType = typeof audience === 'string' ? audience : audience?.primary;
    
    if (!audienceType) {
      return ['value', 'convenience', 'quality'];
    }

    const priorities: Record<string, string[]> = {
      'families': ['safety', 'value', 'convenience', 'fun'],
      'business_travelers': ['efficiency', 'reliability', 'comfort', 'time-saving'],
      'young_adults': ['affordability', 'adventure', 'flexibility', 'social'],
      'seniors': ['comfort', 'service', 'simplicity', 'security'],
      'budget_conscious': ['price', 'deals', 'savings', 'value'],
      'luxury_seekers': ['premium', 'exclusivity', 'service', 'status']
    };

    return priorities[audienceType] || ['value', 'quality', 'convenience'];
  }

  /**
   * Получение предпочтений контента для аудитории
   */
  static getContentPreferences(audience: string | any): Record<string, any> {
    const audienceType = typeof audience === 'string' ? audience : audience?.primary;
    
    if (!audienceType) {
      return {
        length: 'medium',
        complexity: 'simple',
        emotional_appeal: 'moderate',
        urgency: 'low'
      };
    }

    const preferences: Record<string, any> = {
      'families': {
        length: 'medium',
        complexity: 'simple',
        emotional_appeal: 'high',
        urgency: 'low',
        focus: ['safety', 'value', 'convenience']
      },
      'business_travelers': {
        length: 'short',
        complexity: 'moderate',
        emotional_appeal: 'low',
        urgency: 'medium',
        focus: ['efficiency', 'reliability', 'status']
      },
      'young_adults': {
        length: 'short',
        complexity: 'simple',
        emotional_appeal: 'high',
        urgency: 'high',
        focus: ['adventure', 'social', 'budget']
      },
      'seniors': {
        length: 'medium',
        complexity: 'simple',
        emotional_appeal: 'moderate',
        urgency: 'low',
        focus: ['comfort', 'service', 'simplicity']
      },
      'budget_conscious': {
        length: 'medium',
        complexity: 'simple',
        emotional_appeal: 'high',
        urgency: 'high',
        focus: ['savings', 'deals', 'value']
      },
      'luxury_seekers': {
        length: 'long',
        complexity: 'sophisticated',
        emotional_appeal: 'moderate',
        urgency: 'low',
        focus: ['premium', 'exclusivity', 'experience']
      }
    };

    return preferences[audienceType] || preferences['families'];
  }

  /**
   * Расчет сложности контента
   */
  static calculateComplexityScore(content: any): number {
    if (!content || typeof content !== 'object') {
      return 0;
    }

    let score = 0;
    
    // Длина контента
    const totalLength = (content.subject?.length || 0) + 
                       (content.body?.length || 0) + 
                       (content.preheader?.length || 0);
    score += Math.min(totalLength / 100, 50); // max 50 points for length

    // Количество слов в теле письма
    const wordCount = content.body ? content.body.split(/\s+/).length : 0;
    score += Math.min(wordCount / 10, 30); // max 30 points for word count

    // Сложность структуры (наличие разных компонентов)
    const components = ['subject', 'preheader', 'body', 'cta'].filter(
      comp => content[comp] && content[comp].length > 0
    ).length;
    score += components * 5; // 5 points per component

    return Math.round(Math.min(score, 100));
  }

  /**
   * Форматирование цены
   */
  static formatPrice(price: number, currency: string): string {
    const formatters: Record<string, Intl.NumberFormat> = {
      'RUB': new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    };

    const formatter = formatters[currency] || formatters['RUB'];
    return formatter!.format(price);
  }

  /**
   * Создание контекста для персонализации
   */
  static createPersonalizationContext(audience: string | any, _params: ContentGeneratorParams): Record<string, any> {
    const audienceType = typeof audience === 'string' ? audience : audience?.primary;
    const preferences = this.getContentPreferences(audience);
    const triggers = this.mapAudienceToTriggers(audienceType || 'families');
    const priorities = this.getMessagingPriorities(audience);

    return {
      audience_type: audienceType || 'general',
      tone_preference: this.mapAudienceToTone(audienceType || 'families'),
      content_preferences: preferences,
      psychological_triggers: triggers,
      messaging_priorities: priorities,
      demographics: typeof audience === 'object' ? audience?.demographics || {} : {},
      psychographics: typeof audience === 'object' ? audience?.psychographics || {} : {}
    };
  }

  /**
   * Построение артефактов для результата
   */
  static buildContentArtifacts(action: string, result: any): Record<string, any> {
    const artifacts: Record<string, any> = {
      generated_at: new Date().toISOString(),
      action_performed: action,
      content_type: result.content?.language || 'ru'
    };

    switch (action) {
      case 'generate':
        artifacts.content_components = {
          subject: !!result.content?.subject,
          preheader: !!result.content?.preheader,
          body: !!result.content?.body,
          cta: !!result.content?.cta
        };
        break;

      case 'optimize':
        artifacts.optimization_applied = true;
        artifacts.improvement_metrics = result.improvement_analysis || {};
        break;

      case 'variants':
        artifacts.variants_generated = result.variants?.length || 0;
        artifacts.variant_focuses = result.variants?.map((v: any) => v.focus) || [];
        break;

      case 'analyze':
        artifacts.analysis_performed = true;
        artifacts.metrics_calculated = !!result.analysis;
        break;
    }

    return artifacts;
  }
}