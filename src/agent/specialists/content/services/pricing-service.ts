/**
 * 💰 PRICING SERVICE
 * 
 * Сервис для анализа цен и создания ценового контекста
 * Выделен из content-generator.ts для модульности
 * Совместим с OpenAI Agents SDK v2
 */

import {
  ContentGeneratorParams,
  PricingData,
  PricingContext,
  PricingAnalysisResult,
  ValidationResult,
  PerformanceMetrics,
  BaseContentService
} from '../common/content-types';
import { ContentUtils } from '../common/content-utils';

export class PricingService implements BaseContentService {
  private performanceStart: number = 0;
  private metricsData: Record<string, number> = {};

  /**
   * Анализ ценовых данных и создание контекста
   */
  async analyzePricingData(params: ContentGeneratorParams): Promise<PricingAnalysisResult> {
    this.performanceStart = Date.now();
    
    try {
      // Валидация входных данных
      const validation = this.validateInput(params);
      if (!validation.valid) {
        throw new Error(`Pricing validation failed: ${validation.errors.join(', ')}`);
      }

      if (!params.pricing_data) {
        throw new Error('Pricing data is required for pricing analysis');
      }

      console.log(`💰 Analyzing pricing data for ${params.pricing_data.prices.length} routes`);

      // Нормализация ценовых данных
      const normalizedPricingData = this.normalizePricingData(params.pricing_data);
      
      // Расширенный анализ ценового контекста
      const enhancedPricing = this.enhancePricingContext(normalizedPricingData, params);
      
      // Создание ценового контекста
      const pricingContext = this.createPricingContext(enhancedPricing, params);
      
      // Генерация ценовой аналитики
      const pricingIntelligence = this.generatePricingIntelligence(enhancedPricing, params);

      // Обновление метрик
      this.metricsData.api_calls_made = 1;
      this.metricsData.success_rate = 100;
      
      // Обновляем данные о formatPricesForDisplay с normalizedPricingData
      const formattedPrices = this.formatPricesForDisplay(normalizedPricingData);

      console.log(`✅ Pricing analysis completed: ${pricingContext.competitive_analysis.market_position} positioning`);

      return {
        success: true,
        pricing_context: pricingContext,
        enhanced_pricing: {
          formatted_prices: formattedPrices,
          saving_messages: this.generateSavingMessages(enhancedPricing),
          urgency_triggers: this.generateUrgencyTriggers(enhancedPricing, params)
        },
        pricing_intelligence: pricingIntelligence
      };

    } catch (error) {
      console.error('❌ Pricing service error:', error);
      this.metricsData.success_rate = 0;
      
      return {
        success: false,
        pricing_context: this.getDefaultPricingContext(),
        enhanced_pricing: {
          formatted_prices: [],
          saving_messages: [],
          urgency_triggers: []
        },
        pricing_intelligence: {
          psychological_pricing: 'standard',
          optimal_presentation: 'simple',
          cross_sell_opportunities: []
        }
      };
    }
  }

  /**
   * Расширение ценового контекста
   */
  private enhancePricingContext(pricingData: PricingData, params: ContentGeneratorParams): any {
    const enhanced = {
      ...pricingData,
      price_positioning: this.determinePricePositioning(pricingData),
      savings_potential: this.calculateSavingsPotential(pricingData),
      market_analysis: this.analyzeMarketPosition(pricingData),
      psychological_factors: this.analyzePsychologicalFactors(pricingData, params)
    };

    // Добавляем статистику если отсутствует
    if (!enhanced.statistics) {
      enhanced.statistics = this.calculatePricingStatistics(pricingData.prices);
    }

    return enhanced;
  }

  /**
   * Создание ценового контекста для генерации контента
   */
  private createPricingContext(enhancedPricing: any, params: ContentGeneratorParams): PricingContext {
    const urgencyData = this.generateUrgencyIndicators(enhancedPricing, params.campaign_context);
    
    return {
      price_positioning: enhancedPricing.price_positioning,
      savings_potential: enhancedPricing.savings_potential,
      urgency_indicators: urgencyData,
      competitive_analysis: {
        market_position: enhancedPricing.market_analysis.position,
        value_proposition: enhancedPricing.market_analysis.value_prop,
        messaging_strategy: enhancedPricing.market_analysis.messaging
      }
    };
  }

  /**
   * Определение позиционирования цены
   */
  private determinePricePositioning(pricingData: PricingData): string {
    if (!pricingData.statistics) {
      return 'competitive';
    }

    const { cheapest, statistics } = pricingData;
    const { average, price_range } = statistics;
    
    const priceRatio = cheapest / average;
    
    if (priceRatio <= 0.7) {
      return 'budget';
    } else if (priceRatio <= 0.9) {
      return 'value';
    } else if (priceRatio <= 1.1) {
      return 'competitive';
    } else {
      return 'premium';
    }
  }

  /**
   * Расчет потенциала экономии
   */
  private calculateSavingsPotential(pricingData: PricingData): number {
    if (!pricingData.statistics) {
      return 0;
    }

    const { cheapest, statistics } = pricingData;
    const maxPrice = statistics.price_range.max;
    
    if (maxPrice <= cheapest) {
      return 0;
    }

    return Math.round(((maxPrice - cheapest) / maxPrice) * 100);
  }

  /**
   * Анализ рыночной позиции
   */
  private analyzeMarketPosition(pricingData: PricingData): any {
    const positioning = this.determinePricePositioning(pricingData);
    const savingsPotential = this.calculateSavingsPotential(pricingData);

    const positionData: Record<string, any> = {
      'budget': {
        position: 'lowest',
        value_prop: 'Самые низкие цены на рынке',
        messaging: ['экономия', 'выгодные предложения', 'лучшие цены']
      },
      'value': {
        position: 'competitive', 
        value_prop: 'Отличное соотношение цены и качества',
        messaging: ['оптимальный выбор', 'разумные цены', 'выгодное предложение']
      },
      'competitive': {
        position: 'competitive',
        value_prop: 'Конкурентные цены на рынке',
        messaging: ['справедливые цены', 'рыночные условия', 'стандартные тарифы']
      },
      'premium': {
        position: 'premium',
        value_prop: 'Премиум-услуги по соответствующей цене',
        messaging: ['качественный сервис', 'премиум-опыт', 'дополнительные преимущества']
      }
    };

    return positionData[positioning] || positionData['competitive'];
  }

  /**
   * Анализ психологических факторов ценообразования
   */
  private analyzePsychologicalFactors(pricingData: PricingData, params: ContentGeneratorParams): any {
    const positioning = this.determinePricePositioning(pricingData);
    const audience = typeof params.target_audience === 'string' ? params.target_audience : 'general';
    
    const factors: any = {
      price_anchoring: this.createPriceAnchoring(pricingData),
      scarcity_messaging: this.createScarcityMessaging(params.campaign_context),
      social_proof: this.createSocialProofElements(positioning),
      urgency_drivers: this.createUrgencyDrivers(pricingData, params.campaign_context)
    };

    // Адаптация под аудиторию
    switch (audience) {
      case 'budget_conscious':
        factors.emphasis = 'savings';
        factors.comparison_focus = 'price_difference';
        break;
      case 'young_adults':
        factors.emphasis = 'value';
        factors.comparison_focus = 'quality_benefits';
        break;
      case 'business_travelers':
        factors.emphasis = 'efficiency';
        factors.comparison_focus = 'time_value';
        break;
      default:
        factors.emphasis = 'balance';
        factors.comparison_focus = 'overall_value';
    }

    return factors;
  }

  /**
   * Генерация индикаторов срочности
   */
  private generateUrgencyIndicators(enhancedPricing: any, campaignContext: any): any {
    const savingsPotential = enhancedPricing.savings_potential || 0;
    const positioning = enhancedPricing.price_positioning;
    
    const indicators = {
      is_deal: savingsPotential > 15,
      time_sensitive: false,
      inventory_limited: false,
      messaging: [] as string[]
    };

    // Определение срочности на основе контекста кампании
    if (campaignContext?.urgency_level) {
      switch (campaignContext.urgency_level) {
        case 'high':
        case 'critical':
          indicators.time_sensitive = true;
          indicators.inventory_limited = true;
          indicators.messaging.push('Ограниченное предложение');
          indicators.messaging.push('Спешите забронировать');
          break;
        case 'medium':
          indicators.time_sensitive = true;
          indicators.messaging.push('Предложение ограничено по времени');
          break;
      }
    }

    // Добавление сообщений на основе экономии
    if (indicators.is_deal) {
      indicators.messaging.push(`Экономия до ${savingsPotential}%`);
      indicators.messaging.push('Выгодное предложение');
    }

    // Сезонная срочность
    if (campaignContext?.seasonality) {
      const seasonalMessages: Record<string, string[]> = {
        'holiday': ['Праздничные цены', 'Новогодние скидки'],
        'summer': ['Летние предложения', 'Сезонные тарифы'], 
        'winter': ['Зимние предложения', 'Горячие предложения']
      };
      
      const seasonal = seasonalMessages[campaignContext.seasonality];
      if (seasonal) {
        indicators.messaging.push(...seasonal);
      }
    }

    return indicators;
  }

  /**
   * Генерация ценовой аналитики
   */
  private generatePricingIntelligence(enhancedPricing: any, params: ContentGeneratorParams): any {
    const positioning = enhancedPricing.price_positioning;
    const audience = typeof params.target_audience === 'string' ? params.target_audience : 'general';

    // Психологическое ценообразование
    const psychologicalPricing = this.determinePsychologicalPricing(enhancedPricing, audience);
    
    // Оптимальная презентация
    const optimalPresentation = this.determineOptimalPresentation(positioning, audience);
    
    // Возможности кросс-продаж
    const crossSellOpportunities = this.generateCrossSellOpportunities(enhancedPricing, params);

    return {
      psychological_pricing: psychologicalPricing,
      optimal_presentation: optimalPresentation,
      cross_sell_opportunities: crossSellOpportunities
    };
  }

  // ============ ПРИВАТНЫЕ УТИЛИТЫ ============

  private calculatePricingStatistics(prices: PricingData['prices']): any {
    const priceValues = prices.map(p => p.price);
    const average = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const sorted = [...priceValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
      : sorted[Math.floor(sorted.length / 2)];

    return {
      average: Math.round(average),
      median: Math.round(median),
      price_range: {
        min: Math.min(...priceValues),
        max: Math.max(...priceValues)
      }
    };
  }

  private formatPricesForDisplay(pricingData: PricingData): string[] {
    return pricingData.prices.map(price => 
      `${price.origin} → ${price.destination}: ${ContentUtils.formatPrice(price.price, price.currency)}`
    );
  }

  private generateSavingMessages(enhancedPricing: any): string[] {
    const messages: string[] = [];
    const savingsPotential = enhancedPricing.savings_potential || 0;

    if (savingsPotential > 20) {
      messages.push('Невероятная экономия!');
      messages.push(`Сэкономьте до ${savingsPotential}%`);
    } else if (savingsPotential > 10) {
      messages.push('Выгодное предложение');
      messages.push(`Экономия ${savingsPotential}%`);
    } else if (savingsPotential > 0) {
      messages.push('Хорошая цена');
    }

    return messages;
  }

  private generateUrgencyTriggers(enhancedPricing: any, params: ContentGeneratorParams): string[] {
    const triggers: string[] = [];
    const positioning = enhancedPricing.price_positioning;

    // Удален предустановленный контент - все триггеры должны генерироваться через OpenAI SDK
    // в зависимости от конкретного контекста и ценовых данных
    
    return triggers; // Возвращаем пустой массив - контент будет генерироваться агентом
  }

  private createPriceAnchoring(pricingData: PricingData): any {
    if (!pricingData.statistics) {
      return { strategy: 'simple', anchor: pricingData.cheapest };
    }

    return {
      strategy: 'comparison',
      anchor: pricingData.statistics.price_range.max,
      target: pricingData.cheapest,
      savings: pricingData.statistics.price_range.max - pricingData.cheapest
    };
  }

  private createScarcityMessaging(campaignContext: any): string[] {
    const messages: string[] = [];
    
    if (campaignContext?.promotion_details?.limited_availability) {
      messages.push('Ограниченное количество мест');
      messages.push('Только до исчерпания');
    }

    if (campaignContext?.urgency_level === 'high') {
      messages.push('Последние места');
      messages.push('Заканчивается предложение');
    }

    return messages;
  }

  private createSocialProofElements(positioning: string): string[] {
    const proofElements: Record<string, string[]> = {
      'budget': ['Выбор экономных путешественников', 'Тысячи довольных клиентов'],
      'value': ['Оптимальный выбор', 'Рекомендуют эксперты'],
      'competitive': ['Популярное направление', 'Проверенное качество'],
      'premium': ['Эксклюзивное предложение', 'Для взыскательных клиентов']
    };

    return proofElements[positioning] || proofElements['competitive'];
  }

  private createUrgencyDrivers(pricingData: PricingData, campaignContext: any): string[] {
    const drivers: string[] = [];

    if (campaignContext?.promotion_details?.validity_period) {
      drivers.push(`Действует до ${campaignContext.promotion_details.validity_period}`);
    }

    if (pricingData.statistics && this.calculateSavingsPotential(pricingData) > 10) {
      drivers.push('Цены растут каждый день');
    }

    return drivers;
  }

  private determinePsychologicalPricing(enhancedPricing: any, audience: string): string {
    const strategies: Record<string, string> = {
      'budget_conscious': 'price_emphasis',
      'luxury_seekers': 'value_emphasis', 
      'business_travelers': 'efficiency_emphasis',
      'families': 'savings_emphasis'
    };

    return strategies[audience] || 'balanced';
  }

  private determineOptimalPresentation(positioning: string, audience: string): string {
    if (positioning === 'budget' && audience === 'budget_conscious') {
      return 'price_highlighted';
    }

    if (positioning === 'premium' && audience === 'luxury_seekers') {
      return 'value_focused';
    }

    return 'balanced_presentation';
  }

  private generateCrossSellOpportunities(enhancedPricing: any, params: ContentGeneratorParams): string[] {
    const opportunities: string[] = [];

    if (enhancedPricing.savings_potential > 15) {
      opportunities.push('Страхование путешествий со скидкой');
      opportunities.push('Дополнительные услуги по специальной цене');
    }

    const audienceType = typeof params.target_audience === 'string' ? params.target_audience : undefined;
    if (audienceType === 'families') {
      opportunities.push('Детские тарифы');
      opportunities.push('Семейные пакеты');
    }

    return opportunities;
  }

  private getDefaultPricingContext(): PricingContext {
    return {
      price_positioning: 'competitive',
      savings_potential: 0,
      urgency_indicators: {
        is_deal: false,
        time_sensitive: false,
        inventory_limited: false,
        messaging: []
      },
      competitive_analysis: {
        market_position: 'competitive',
        value_proposition: 'Стандартные рыночные цены',
        messaging_strategy: ['качественный сервис', 'надежность']
      }
    };
  }

  // ============ ПРИВАТНЫЕ УТИЛИТЫ ============

  /**
   * Нормализация ценовых данных для совместимости с PricingData
   */
  private normalizePricingData(pricingData: any): PricingData {
    if (!pricingData || !pricingData.prices) {
      return {
        prices: [],
        currency: 'RUB',
        cheapest: 0,
        statistics: {
          average: 0,
          median: 0,
          price_range: { min: 0, max: 0 }
        }
      };
    }

    const normalizedPrices = pricingData.prices.map((price: any) => ({
      origin: price.origin || 'Москва',
      destination: price.destination || 'Направление',
      price: price.price || 0,
      currency: price.currency || pricingData.currency || 'RUB',
      date: price.date || new Date().toISOString().split('T')[0]
    }));

    return {
      prices: normalizedPrices,
      currency: pricingData.currency || 'RUB',
      cheapest: pricingData.cheapest || 0,
      statistics: pricingData.statistics || this.calculatePricingStatistics(normalizedPrices)
    };
  }

  // ============ БАЗОВЫЕ МЕТОДЫ ИНТЕРФЕЙСА ============

  validateInput(params: ContentGeneratorParams): ValidationResult {
    return ContentUtils.validateContentInput(params);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return ContentUtils.calculatePerformance(
      'pricing_analysis',
      this.performanceStart,
      this.metricsData
    );
  }
}