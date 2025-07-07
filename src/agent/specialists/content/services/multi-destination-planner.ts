/**
 * 🗺️ MULTI-DESTINATION PLANNER SERVICE
 * 
 * Сервис для создания унифицированных планов multi-destination кампаний
 * Оптимизация направлений, балансировка по сезонам и регионам
 * Совместим с OpenAI Agents SDK v2
 */

import {
  MultiDestinationPlan,
  DestinationPlan,
  SupportedRegion,
  TravelSeason,
  LayoutType,
  SUPPORTED_REGIONS,
  TRAVEL_SEASONS,
  LAYOUT_TYPES,
  MULTI_DESTINATION_LIMITS,
  REGION_CHARACTERISTICS,
  multiDestinationPlanSchema,
  destinationPlanSchema
} from '../../../../shared/types/multi-destination-types';
import { ContentUtils } from '../common/content-utils';
import { DestinationAnalyzer, DestinationGenerationParams } from './destination-analyzer';

export interface MultiDestinationPlannerConfig {
  maxDestinations?: number;
  preferBalancedRegions?: boolean;
  seasonalOptimization?: boolean;
  pricingStrategy?: 'budget_first' | 'premium_first' | 'balanced' | 'value_optimized';
  layoutPreferences?: LayoutType[];
}

export interface PlanOptimizationParams {
  originalPlan: MultiDestinationPlan;
  optimizationGoals: ('engagement' | 'conversion' | 'seasonal_relevance' | 'price_optimization' | 'regional_balance')[];
  constraints?: {
    maxPriceIncrease?: number;
    mustIncludeRegions?: SupportedRegion[];
    mustIncludeSeasons?: TravelSeason[];
    budgetRange?: 'budget' | 'mid_range' | 'premium' | 'luxury';
  };
}

export interface DestinationMixOptimization {
  optimized_destinations: DestinationPlan[];
  removed_destinations: DestinationPlan[];
  added_destinations: DestinationPlan[];
  optimization_score: number;
  changes_summary: {
    total_changes: number;
    regional_balance_improved: boolean;
    seasonal_optimization_applied: boolean;
    pricing_optimized: boolean;
    layout_improved: boolean;
  };
  performance_prediction: {
    engagement_lift: number;
    conversion_improvement: number;
    seasonal_relevance_score: number;
    confidence_level: 'high' | 'medium' | 'low';
  };
}

export interface UnifiedPlanCreationParams {
  destinations: DestinationPlan[];
  campaignName: string;
  campaignTheme?: string;
  targetSeason?: TravelSeason;
  targetRegion?: SupportedRegion;
  budgetRange?: 'budget' | 'mid_range' | 'premium' | 'luxury';
  urgencyLevel?: 'low' | 'medium' | 'high';
  targetAudience?: 'families' | 'couples' | 'solo_travelers' | 'business' | 'mixed';
  layoutPreference?: LayoutType;
}

export class MultiDestinationPlanner {
  private config: MultiDestinationPlannerConfig;
  private destinationAnalyzer: DestinationAnalyzer;
  private performanceStart: number = 0;

  constructor(config: MultiDestinationPlannerConfig = {}) {
    this.config = {
      maxDestinations: config.maxDestinations || 6,
      preferBalancedRegions: config.preferBalancedRegions ?? true,
      seasonalOptimization: config.seasonalOptimization ?? true,
      pricingStrategy: config.pricingStrategy || 'balanced',
      layoutPreferences: config.layoutPreferences || ['grid', 'compact', 'carousel'],
      ...config
    };
    
    this.destinationAnalyzer = new DestinationAnalyzer({
      maxDestinations: this.config.maxDestinations
    });
  }

  /**
   * Создание унифицированного плана из списка направлений
   * Главный метод для создания multi-destination кампаний
   */
  async createUnifiedPlan(params: UnifiedPlanCreationParams): Promise<MultiDestinationPlan> {
    this.performanceStart = Date.now();
    
    try {
      console.log(`🗺️ Creating unified plan for "${params.campaignName}" with ${params.destinations.length} destinations`);
      
      // Шаг 1: Валидация входных данных
      this.validatePlanInputs(params);
      
      // Шаг 2: Оптимизация направлений если нужно
      const optimizedDestinations = await this.optimizeDestinationsForPlan(params.destinations, params);
      
      // Шаг 3: Определение layout типа
      const layoutType = this.determineOptimalLayout(optimizedDestinations, params.layoutPreference);
      
      // Шаг 4: Создание базового плана через DestinationAnalyzer
      const basePlan = await this.destinationAnalyzer.createUnifiedPlan(
        optimizedDestinations,
        params.campaignName,
        {
          theme: params.campaignTheme || params.campaignName,
          targetSeason: params.targetSeason,
          budgetRange: params.budgetRange,
          urgencyLevel: params.urgencyLevel
        }
      );
      
      // Шаг 5: Расширение плана с дополнительной логикой планировщика
      const enhancedPlan = await this.enhancePlanWithPlannerLogic(basePlan, params);
      
      // Шаг 6: Финальная валидация
      const validationResult = multiDestinationPlanSchema.safeParse(enhancedPlan);
      if (!validationResult.success) {
        console.warn('⚠️ Plan validation issues:', validationResult.error.issues);
      }
      
      console.log(`✅ Unified plan created successfully: ${enhancedPlan.layout_plan.layout_type} layout with ${enhancedPlan.destinations.length} destinations`);
      
      return enhancedPlan;
      
    } catch (error) {
      console.error('❌ Unified plan creation error:', error);
      throw error;
    }
  }

  /**
   * Оптимизация микса направлений для улучшения performance
   */
  async optimizeDestinationMix(params: PlanOptimizationParams): Promise<DestinationMixOptimization> {
    this.performanceStart = Date.now();
    
    try {
      console.log(`🔧 Optimizing destination mix for plan: ${params.originalPlan.name}`);
      console.log(`🎯 Optimization goals: ${params.optimizationGoals.join(', ')}`);
      
      const originalDestinations = params.originalPlan.destinations;
      let optimizedDestinations = [...originalDestinations];
      const changes = [];
      
      // Шаг 1: Региональная балансировка
      if (params.optimizationGoals.includes('regional_balance')) {
        const balanceResult = await this.optimizeRegionalBalance(optimizedDestinations, params.constraints);
        optimizedDestinations = balanceResult.destinations;
        changes.push(...balanceResult.changes);
      }
      
      // Шаг 2: Сезонная релевантность
      if (params.optimizationGoals.includes('seasonal_relevance')) {
        const seasonalResult = await this.optimizeSeasonalRelevance(optimizedDestinations, params.originalPlan.campaign_context.target_season);
        optimizedDestinations = seasonalResult.destinations;
        changes.push(...seasonalResult.changes);
      }
      
      // Шаг 3: Ценовая оптимизация
      if (params.optimizationGoals.includes('price_optimization')) {
        const pricingResult = await this.optimizePricing(optimizedDestinations, params.originalPlan.campaign_context.budget_range, params.constraints);
        optimizedDestinations = pricingResult.destinations;
        changes.push(...pricingResult.changes);
      }
      
      // Шаг 4: Оптимизация для конверсии
      if (params.optimizationGoals.includes('conversion')) {
        const conversionResult = await this.optimizeForConversion(optimizedDestinations, params.originalPlan.positioning_strategy.target_audience);
        optimizedDestinations = conversionResult.destinations;
        changes.push(...conversionResult.changes);
      }
      
      // Шаг 5: Расчет метрик оптимизации
      const optimizationMetrics = this.calculateOptimizationMetrics(originalDestinations, optimizedDestinations, changes);
      
      // Шаг 6: Определение добавленных и удаленных направлений
      const addedDestinations = this.findAddedDestinations(originalDestinations, optimizedDestinations);
      const removedDestinations = this.findRemovedDestinations(originalDestinations, optimizedDestinations);
      
      console.log(`✅ Destination mix optimization completed: ${changes.length} changes applied`);
      
      return {
        optimized_destinations: optimizedDestinations,
        removed_destinations: removedDestinations,
        added_destinations: addedDestinations,
        optimization_score: optimizationMetrics.overallScore,
        changes_summary: {
          total_changes: changes.length,
          regional_balance_improved: changes.some(c => c.type === 'regional_balance'),
          seasonal_optimization_applied: changes.some(c => c.type === 'seasonal'),
          pricing_optimized: changes.some(c => c.type === 'pricing'),
          layout_improved: changes.some(c => c.type === 'layout')
        },
        performance_prediction: {
          engagement_lift: optimizationMetrics.engagementImprovement,
          conversion_improvement: optimizationMetrics.conversionImprovement,
          seasonal_relevance_score: optimizationMetrics.seasonalRelevance,
          confidence_level: optimizationMetrics.confidence
        }
      };
      
    } catch (error) {
      console.error('❌ Destination mix optimization error:', error);
      throw error;
    }
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ============

  /**
   * Валидация входных параметров плана
   */
  private validatePlanInputs(params: UnifiedPlanCreationParams): void {
    if (!params.destinations || params.destinations.length < MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS) {
      throw new Error(`Minimum ${MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS} destinations required`);
    }
    
    if (params.destinations.length > MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS) {
      throw new Error(`Maximum ${MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS} destinations allowed`);
    }
    
    if (!params.campaignName || params.campaignName.trim().length === 0) {
      throw new Error('Campaign name is required');
    }
    
    // Валидация каждого направления
    params.destinations.forEach((dest, index) => {
      const validation = destinationPlanSchema.safeParse(dest);
      if (!validation.success) {
        console.warn(`⚠️ Destination ${index + 1} validation issues:`, validation.error.issues);
      }
    });
  }

  /**
   * Оптимизация направлений для плана
   */
  private async optimizeDestinationsForPlan(
    destinations: DestinationPlan[], 
    params: UnifiedPlanCreationParams
  ): Promise<DestinationPlan[]> {
    
    if (!this.config.seasonalOptimization && !this.config.preferBalancedRegions) {
      return destinations;
    }
    
    let optimized = [...destinations];
    
    // Региональная балансировка
    if (this.config.preferBalancedRegions) {
      optimized = this.balanceRegionalDistribution(optimized);
    }
    
    // Сезонная оптимизация
    if (this.config.seasonalOptimization && params.targetSeason) {
      optimized = this.optimizeForSeason(optimized, params.targetSeason);
    }
    
    // Ценовая стратегия
    optimized = this.applyPricingStrategy(optimized, params.budgetRange);
    
    return optimized.slice(0, this.config.maxDestinations);
  }

  /**
   * Определение оптимального layout
   */
  private determineOptimalLayout(destinations: DestinationPlan[], preference?: LayoutType): LayoutType {
    const count = destinations.length;
    
    // Если есть предпочтение и оно подходит, используем его
    if (preference && this.isLayoutSuitableForCount(preference, count)) {
      return preference;
    }
    
    // Автоматический выбор на основе количества
    if (count <= 3) return 'compact';
    if (count <= 6) return 'grid';
    return 'carousel';
  }

  /**
   * Проверка подходит ли layout для количества направлений
   */
  private isLayoutSuitableForCount(layout: LayoutType, count: number): boolean {
    const limits = MULTI_DESTINATION_LIMITS.OPTIMAL_DESTINATIONS[layout];
    return count >= limits.min && count <= limits.max;
  }

  /**
   * Расширение плана с логикой планировщика
   */
  private async enhancePlanWithPlannerLogic(
    basePlan: MultiDestinationPlan, 
    params: UnifiedPlanCreationParams
  ): Promise<MultiDestinationPlan> {
    
    return {
      ...basePlan,
      // Обновляем стратегию позиционирования
      positioning_strategy: {
        ...basePlan.positioning_strategy,
        target_audience: params.targetAudience || basePlan.positioning_strategy.target_audience,
        primary_value_proposition: this.generateValueProposition(basePlan.destinations, params),
        competitive_advantages: this.generateCompetitiveAdvantages(basePlan.destinations, params)
      },
      // Добавляем метаданные планировщика
      metadata: {
        ...basePlan.metadata,
        version: '1.0.0',
        optimization_score: this.calculatePlanQualityScore(basePlan.destinations)
      }
    };
  }

  /**
   * Балансировка региональной дистрибуции
   */
  private balanceRegionalDistribution(destinations: DestinationPlan[]): DestinationPlan[] {
    const regionCounts = new Map<SupportedRegion, number>();
    
    // Подсчет по регионам
    destinations.forEach(dest => {
      const region = dest.geographical_info.region;
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    
    // Если дистрибуция уже сбалансирована, возвращаем как есть
    const maxCount = Math.max(...regionCounts.values());
    const minCount = Math.min(...regionCounts.values());
    
    if (maxCount - minCount <= 1) {
      return destinations;
    }
    
    // Простая балансировка - сортируем по региону и берем по очереди
    const grouped = new Map<SupportedRegion, DestinationPlan[]>();
    destinations.forEach(dest => {
      const region = dest.geographical_info.region;
      if (!grouped.has(region)) {
        grouped.set(region, []);
      }
      grouped.get(region)!.push(dest);
    });
    
    const balanced: DestinationPlan[] = [];
    const regions = Array.from(grouped.keys());
    let maxIndex = Math.max(...Array.from(grouped.values()).map(arr => arr.length));
    
    for (let i = 0; i < maxIndex; i++) {
      for (const region of regions) {
        const regionDests = grouped.get(region)!;
        if (i < regionDests.length) {
          balanced.push(regionDests[i]);
        }
      }
    }
    
    return balanced;
  }

  /**
   * Оптимизация для сезона
   */
  private optimizeForSeason(destinations: DestinationPlan[], season: TravelSeason): DestinationPlan[] {
    return destinations.sort((a, b) => {
      const scoreA = this.calculateSeasonalScore(a, season);
      const scoreB = this.calculateSeasonalScore(b, season);
      return scoreB - scoreA;
    });
  }

  /**
   * Расчет сезонного скора
   */
  private calculateSeasonalScore(destination: DestinationPlan, targetSeason: TravelSeason): number {
    if (destination.seasonal_context.primary_season === targetSeason) {
      return 100;
    }
    
    // Проверка оптимальных месяцев
    const seasonMonths: Record<TravelSeason, number[]> = {
      'spring': [3, 4, 5],
      'summer': [6, 7, 8], 
      'autumn': [9, 10, 11],
      'winter': [12, 1, 2],
      'year_round': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
    
    const targetMonths = seasonMonths[targetSeason];
    const destMonths = destination.seasonal_context.optimal_months;
    const overlap = destMonths.filter(month => targetMonths.includes(month)).length;
    
    return (overlap / targetMonths.length) * 75;
  }

  /**
   * Применение ценовой стратегии
   */
  private applyPricingStrategy(destinations: DestinationPlan[], budgetRange?: string): DestinationPlan[] {
    if (!this.config.pricingStrategy || this.config.pricingStrategy === 'balanced') {
      return destinations;
    }
    
    switch (this.config.pricingStrategy) {
      case 'budget_first':
        return destinations.sort((a, b) => a.pricing.base_price - b.pricing.base_price);
      
      case 'premium_first':
        return destinations.sort((a, b) => b.pricing.base_price - a.pricing.base_price);
      
      case 'value_optimized':
        return destinations.sort((a, b) => {
          const valueA = this.calculateValueScore(a);
          const valueB = this.calculateValueScore(b);
          return valueB - valueA;
        });
      
      default:
        return destinations;
    }
  }

  /**
   * Расчет ценностного скора направления
   */
  private calculateValueScore(destination: DestinationPlan): number {
    const price = destination.pricing.base_price;
    const confidenceScore = destination.metadata.confidence_score || 50;
    const highlightsCount = destination.content.highlights.length;
    
    // Простая формула ценности: (качество контента * уверенность) / цена
    return ((highlightsCount * 20 + confidenceScore) / price) * 1000;
  }

  // ============ МЕТОДЫ ОПТИМИЗАЦИИ МИКСА ============

  /**
   * Оптимизация регионального баланса
   */
  private async optimizeRegionalBalance(
    destinations: DestinationPlan[], 
    constraints: any
  ): Promise<{ destinations: DestinationPlan[], changes: any[] }> {
    
    const balanced = this.balanceRegionalDistribution(destinations);
    const changes = [];
    
    // Находим изменения
    for (let i = 0; i < destinations.length; i++) {
      if (destinations[i].id !== balanced[i].id) {
        changes.push({
          type: 'regional_balance',
          destination_id: balanced[i].id,
          action: 'reordered',
          reason: 'Regional balance optimization'
        });
      }
    }
    
    return { destinations: balanced, changes };
  }

  /**
   * Оптимизация сезонной релевантности
   */
  private async optimizeSeasonalRelevance(
    destinations: DestinationPlan[], 
    targetSeason: TravelSeason
  ): Promise<{ destinations: DestinationPlan[], changes: any[] }> {
    
    const optimized = this.optimizeForSeason(destinations, targetSeason);
    const changes = [];
    
    for (let i = 0; i < destinations.length; i++) {
      if (destinations[i].id !== optimized[i].id) {
        changes.push({
          type: 'seasonal',
          destination_id: optimized[i].id,
          action: 'reordered',
          reason: `Seasonal optimization for ${targetSeason}`
        });
      }
    }
    
    return { destinations: optimized, changes };
  }

  /**
   * Ценовая оптимизация
   */
  private async optimizePricing(
    destinations: DestinationPlan[], 
    budgetRange: string,
    constraints: any
  ): Promise<{ destinations: DestinationPlan[], changes: any[] }> {
    
    const priceOptimized = this.applyPricingStrategy(destinations, budgetRange);
    const changes = [];
    
    for (let i = 0; i < destinations.length; i++) {
      if (destinations[i].id !== priceOptimized[i].id) {
        changes.push({
          type: 'pricing',
          destination_id: priceOptimized[i].id,
          action: 'reordered',
          reason: `Price optimization for ${budgetRange} segment`
        });
      }
    }
    
    return { destinations: priceOptimized, changes };
  }

  /**
   * Оптимизация для конверсии
   */
  private async optimizeForConversion(
    destinations: DestinationPlan[], 
    targetAudience: string
  ): Promise<{ destinations: DestinationPlan[], changes: any[] }> {
    
    // Сортируем по потенциалу конверсии для целевой аудитории
    const optimized = destinations.sort((a, b) => {
      const scoreA = this.calculateConversionPotential(a, targetAudience);
      const scoreB = this.calculateConversionPotential(b, targetAudience);
      return scoreB - scoreA;
    });
    
    const changes = [];
    for (let i = 0; i < destinations.length; i++) {
      if (destinations[i].id !== optimized[i].id) {
        changes.push({
          type: 'conversion',
          destination_id: optimized[i].id,
          action: 'reordered',
          reason: `Conversion optimization for ${targetAudience}`
        });
      }
    }
    
    return { destinations: optimized, changes };
  }

  /**
   * Расчет потенциала конверсии
   */
  private calculateConversionPotential(destination: DestinationPlan, audience: string): number {
    let score = 50; // базовый скор
    
    // Фактор цены (более доступные = выше конверсия для budget аудитории)
    if (audience === 'families' || audience === 'budget') {
      score += Math.max(0, 60000 - destination.pricing.base_price) / 1000;
    }
    
    // Фактор контента
    score += destination.content.highlights.length * 5;
    score += destination.metadata.confidence_score || 0;
    
    // Сезонный фактор
    if (destination.seasonal_context.primary_season !== 'winter') {
      score += 10; // Зимние направления обычно имеют меньший спрос
    }
    
    return score;
  }

  // ============ УТИЛИТЫ ============

  /**
   * Расчет метрик оптимизации
   */
  private calculateOptimizationMetrics(
    original: DestinationPlan[], 
    optimized: DestinationPlan[], 
    changes: any[]
  ): any {
    
    const engagementImprovement = Math.min(changes.length * 5, 25); // 5% за каждое изменение, макс 25%
    const conversionImprovement = Math.min(changes.length * 3, 15); // 3% за каждое изменение, макс 15%
    const seasonalRelevance = this.calculateOverallSeasonalRelevance(optimized);
    
    return {
      overallScore: Math.round((engagementImprovement + conversionImprovement + seasonalRelevance) / 3),
      engagementImprovement,
      conversionImprovement,
      seasonalRelevance,
      confidence: changes.length > 3 ? 'high' : changes.length > 1 ? 'medium' : 'low'
    };
  }

  /**
   * Расчет общей сезонной релевантности
   */
  private calculateOverallSeasonalRelevance(destinations: DestinationPlan[]): number {
    const scores = destinations.map(d => d.metadata.confidence_score || 50);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Поиск добавленных направлений
   */
  private findAddedDestinations(original: DestinationPlan[], optimized: DestinationPlan[]): DestinationPlan[] {
    const originalIds = new Set(original.map(d => d.id));
    return optimized.filter(d => !originalIds.has(d.id));
  }

  /**
   * Поиск удаленных направлений
   */
  private findRemovedDestinations(original: DestinationPlan[], optimized: DestinationPlan[]): DestinationPlan[] {
    const optimizedIds = new Set(optimized.map(d => d.id));
    return original.filter(d => !optimizedIds.has(d.id));
  }

  /**
   * Генерация ценностного предложения
   */
  private generateValueProposition(destinations: DestinationPlan[], params: UnifiedPlanCreationParams): string {
    const count = destinations.length;
    const regions = new Set(destinations.map(d => d.geographical_info.region));
    
    if (regions.size > 1) {
      return `Откройте ${count} удивительных направлений в ${regions.size} регионах мира`;
    }
    
    const region = Array.from(regions)[0];
    const regionName = this.getRegionDisplayName(region);
    
    return `Эксклюзивная подборка ${count} лучших направлений ${regionName}`;
  }

  /**
   * Генерация конкурентных преимуществ
   */
  private generateCompetitiveAdvantages(destinations: DestinationPlan[], params: UnifiedPlanCreationParams): string[] {
    const advantages = [
      'Тщательно отобранные направления экспертами',
      `${destinations.length} направлений в одном предложении`
    ];
    
    // Региональное разнообразие
    const regions = new Set(destinations.map(d => d.geographical_info.region));
    if (regions.size > 1) {
      advantages.push(`География ${regions.size} регионов для максимального выбора`);
    }
    
    // Ценовые преимущества
    const avgPrice = destinations.reduce((sum, d) => sum + d.pricing.base_price, 0) / destinations.length;
    if (avgPrice < 40000) {
      advantages.push('Оптимальные цены для каждого направления');
    }
    
    return advantages;
  }

  /**
   * Получение отображаемого имени региона
   */
  private getRegionDisplayName(region: SupportedRegion): string {
    const names: Record<SupportedRegion, string> = {
      'europe': 'Европы',
      'asia': 'Азии', 
      'north_america': 'Северной Америки',
      'south_america': 'Южной Америки',
      'africa': 'Африки',
      'oceania': 'Океании',
      'middle_east': 'Ближнего Востока'
    };
    
    return names[region] || region;
  }

  /**
   * Расчет скора качества плана
   */
  private calculatePlanQualityScore(destinations: DestinationPlan[]): number {
    const avgConfidence = destinations.reduce((sum, d) => sum + (d.metadata.confidence_score || 0), 0) / destinations.length;
    const regionBalance = this.calculateRegionBalanceScore(destinations);
    const contentQuality = this.calculateContentQualityScore(destinations);
    
    return Math.round((avgConfidence + regionBalance + contentQuality) / 3);
  }

  /**
   * Расчет скора баланса регионов
   */
  private calculateRegionBalanceScore(destinations: DestinationPlan[]): number {
    const regionCounts = new Map<SupportedRegion, number>();
    
    destinations.forEach(dest => {
      const region = dest.geographical_info.region;
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    
    const counts = Array.from(regionCounts.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const balance = minCount / maxCount;
    
    return balance * 100;
  }

  /**
   * Расчет качества контента
   */
  private calculateContentQualityScore(destinations: DestinationPlan[]): number {
    const avgHighlights = destinations.reduce((sum, d) => sum + d.content.highlights.length, 0) / destinations.length;
    const contentCompleteness = destinations.filter(d => 
      d.content.title && d.content.description && d.content.call_to_action
    ).length / destinations.length;
    
    return ((avgHighlights / 5) * 50) + (contentCompleteness * 50);
  }
}