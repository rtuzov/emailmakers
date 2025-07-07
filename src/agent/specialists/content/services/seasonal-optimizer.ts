/**
 * 🗓️ SEASONAL OPTIMIZER SERVICE
 * 
 * Сервис для оптимизации дат и сезонной релевантности в multi-destination кампаниях
 * Анализ климатических данных, лучших периодов для путешествий
 * Совместим с OpenAI Agents SDK v2
 */

import {
  DestinationPlan,
  TravelSeason,
  SupportedRegion,
  TRAVEL_SEASONS,
  SUPPORTED_REGIONS,
  REGION_CHARACTERISTICS
} from '../../../../shared/types/multi-destination-types';
import { ContentUtils } from '../common/content-utils';

export interface SeasonalOptimizerConfig {
  preferredSeasons?: TravelSeason[];
  avoidPeakPricing?: boolean;
  weatherPriority?: 'optimal' | 'good' | 'acceptable';
  crowdPreference?: 'avoid_crowds' | 'moderate' | 'any';
}

export interface DateOptimizationParams {
  destinations: DestinationPlan[];
  targetDate?: string; // ISO date string
  flexibilityDays?: number; // How many days flexible around target date
  duration?: number; // Campaign duration in days
  budgetSensitive?: boolean;
  mustAvoidDates?: string[]; // ISO date strings to avoid
}

export interface SeasonalAnalysis {
  destination_id: string;
  optimal_periods: Array<{
    season: TravelSeason;
    start_month: number;
    end_month: number;
    weather_score: number;
    price_level: 'low' | 'medium' | 'high' | 'peak';
    crowd_level: 'low' | 'medium' | 'high' | 'peak';
    overall_score: number;
    special_events?: string[];
  }>;
  avoid_periods: Array<{
    season: TravelSeason;
    start_month: number;
    end_month: number;
    reason: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  best_months: number[];
  worst_months: number[];
}

export interface DateOptimizationResult {
  optimized_dates: {
    campaign_start: string;
    campaign_end: string;
    travel_period_start: string;
    travel_period_end: string;
  };
  destinations_seasonal_fit: Array<{
    destination_id: string;
    seasonal_score: number;
    weather_fit: number;
    price_advantage: number;
    crowd_advantage: number;
    recommended_months: number[];
  }>;
  optimization_summary: {
    overall_score: number;
    seasonal_alignment: number;
    price_optimization: number;
    weather_optimization: number;
    crowd_optimization: number;
    flexibility_used: number; // Days adjusted from original target
  };
  warnings: Array<{
    destination_id: string;
    warning_type: 'weather' | 'pricing' | 'crowds' | 'events';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  alternatives: Array<{
    start_date: string;
    end_date: string;
    score: number;
    advantages: string[];
    trade_offs: string[];
  }>;
}

export interface CountrySeasonalData {
  country_code: string;
  seasons: Record<TravelSeason, {
    months: number[];
    temperature_range: { min: number; max: number };
    rainfall_level: 'low' | 'medium' | 'high';
    humidity_level: 'low' | 'medium' | 'high';
    tourist_season: 'off' | 'shoulder' | 'peak';
    price_multiplier: number; // 1.0 = baseline, 1.5 = 50% higher
    crowd_factor: number; // 1-10 scale
    weather_score: number; // 1-100 scale
  }>;
  special_considerations: {
    monsoon_season?: { start_month: number; end_month: number };
    hurricane_season?: { start_month: number; end_month: number };
    extreme_heat?: { start_month: number; end_month: number };
    extreme_cold?: { start_month: number; end_month: number };
  };
}

export class SeasonalOptimizer {
  private config: SeasonalOptimizerConfig;
  private seasonalDatabase: Map<string, CountrySeasonalData>;
  private performanceStart: number = 0;

  constructor(config: SeasonalOptimizerConfig = {}) {
    this.config = {
      preferredSeasons: config.preferredSeasons || ['spring', 'summer', 'autumn'],
      avoidPeakPricing: config.avoidPeakPricing ?? true,
      weatherPriority: config.weatherPriority || 'optimal',
      crowdPreference: config.crowdPreference || 'moderate',
      ...config
    };
    
    this.seasonalDatabase = this.initializeSeasonalDatabase();
  }

  /**
   * Анализ сезонной пригодности направлений
   */
  async analyzeSeasonalFit(destinations: DestinationPlan[]): Promise<SeasonalAnalysis[]> {
    this.performanceStart = Date.now();
    
    try {
      console.log(`🗓️ Analyzing seasonal fit for ${destinations.length} destinations`);
      
      const analyses: SeasonalAnalysis[] = [];
      
      for (const destination of destinations) {
        const analysis = await this.analyzeDestinationSeasons(destination);
        analyses.push(analysis);
      }
      
      console.log(`✅ Seasonal analysis completed for all destinations`);
      return analyses;
      
    } catch (error) {
      console.error('❌ Seasonal analysis error:', error);
      throw error;
    }
  }

  /**
   * Оптимизация дат кампании на основе сезонных факторов
   */
  async optimizeCampaignDates(params: DateOptimizationParams): Promise<DateOptimizationResult> {
    this.performanceStart = Date.now();
    
    try {
      console.log(`📅 Optimizing campaign dates for ${params.destinations.length} destinations`);
      
      // Шаг 1: Анализ сезонной пригодности каждого направления
      const seasonalAnalyses = await this.analyzeSeasonalFit(params.destinations);
      
      // Шаг 2: Определение оптимального временного окна
      const optimalWindow = this.findOptimalTimeWindow(seasonalAnalyses, params);
      
      // Шаг 3: Расчет сезонной пригодности для каждого направления
      const destinationsFit = this.calculateDestinationsFit(params.destinations, optimalWindow, seasonalAnalyses);
      
      // Шаг 4: Генерация альтернативных вариантов
      const alternatives = this.generateDateAlternatives(seasonalAnalyses, params);
      
      // Шаг 5: Сбор предупреждений
      const warnings = this.generateWarnings(destinationsFit, optimalWindow);
      
      // Шаг 6: Расчет общих метрик оптимизации
      const optimizationSummary = this.calculateOptimizationSummary(destinationsFit, params);
      
      console.log(`✅ Date optimization completed: ${optimalWindow.campaign_start} - ${optimalWindow.campaign_end}`);
      
      return {
        optimized_dates: optimalWindow,
        destinations_seasonal_fit: destinationsFit,
        optimization_summary: optimizationSummary,
        warnings,
        alternatives
      };
      
    } catch (error) {
      console.error('❌ Date optimization error:', error);
      throw error;
    }
  }

  /**
   * Получение рекомендаций по лучшим месяцам для направления
   */
  getBestMonthsForDestination(destination: DestinationPlan): number[] {
    const countryData = this.getCountrySeasonalData(destination.geographical_info.country_code);
    
    if (!countryData) {
      // Fallback на данные из destination
      return destination.seasonal_context.optimal_months;
    }
    
    // Анализ всех сезонов и выбор лучших месяцев
    const monthScores = new Map<number, number>();
    
    Object.entries(countryData.seasons).forEach(([season, data]) => {
      data.months.forEach(month => {
        const score = this.calculateMonthScore(data, season as TravelSeason);
        monthScores.set(month, (monthScores.get(month) || 0) + score);
      });
    });
    
    // Сортируем месяцы по скору и берем топ-6
    const sortedMonths = Array.from(monthScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([month]) => month);
    
    return sortedMonths.sort((a, b) => a - b);
  }

  /**
   * Проверка избежания неблагоприятных сезонов
   */
  checkSeasonalConstraints(destinations: DestinationPlan[], targetDate: string): Array<{
    destination_id: string;
    constraint_violations: Array<{
      type: string;
      severity: 'warning' | 'error';
      message: string;
    }>;
  }> {
    const date = new Date(targetDate);
    const targetMonth = date.getMonth() + 1; // 1-12
    
    const violations = [];
    
    for (const destination of destinations) {
      const destViolations = [];
      const countryData = this.getCountrySeasonalData(destination.geographical_info.country_code);
      
      if (countryData) {
        // Проверка специальных ограничений
        const { special_considerations } = countryData;
        
        if (special_considerations.monsoon_season) {
          const { start_month, end_month } = special_considerations.monsoon_season;
          if (this.isMonthInRange(targetMonth, start_month, end_month)) {
            destViolations.push({
              type: 'monsoon_season',
              severity: 'error' as const,
              message: `${destination.geographical_info.city} - сезон муссонов не рекомендуется`
            });
          }
        }
        
        if (special_considerations.hurricane_season) {
          const { start_month, end_month } = special_considerations.hurricane_season;
          if (this.isMonthInRange(targetMonth, start_month, end_month)) {
            destViolations.push({
              type: 'hurricane_season',
              severity: 'warning' as const,
              message: `${destination.geographical_info.city} - возможны ураганы`
            });
          }
        }
        
        if (special_considerations.extreme_heat) {
          const { start_month, end_month } = special_considerations.extreme_heat;
          if (this.isMonthInRange(targetMonth, start_month, end_month)) {
            destViolations.push({
              type: 'extreme_heat',
              severity: 'warning' as const,
              message: `${destination.geographical_info.city} - экстремальная жара`
            });
          }
        }
      }
      
      if (destViolations.length > 0) {
        violations.push({
          destination_id: destination.id,
          constraint_violations: destViolations
        });
      }
    }
    
    return violations;
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ============

  /**
   * Анализ сезонов для одного направления
   */
  private async analyzeDestinationSeasons(destination: DestinationPlan): Promise<SeasonalAnalysis> {
    const countryData = this.getCountrySeasonalData(destination.geographical_info.country_code);
    
    const analysis: SeasonalAnalysis = {
      destination_id: destination.id,
      optimal_periods: [],
      avoid_periods: [],
      best_months: [],
      worst_months: []
    };
    
    if (!countryData) {
      // Fallback на базовые данные из destination
      analysis.best_months = destination.seasonal_context.optimal_months;
      analysis.optimal_periods.push({
        season: destination.seasonal_context.primary_season,
        start_month: Math.min(...destination.seasonal_context.optimal_months),
        end_month: Math.max(...destination.seasonal_context.optimal_months),
        weather_score: 75,
        price_level: 'medium',
        crowd_level: 'medium',
        overall_score: 75
      });
      
      return analysis;
    }
    
    // Анализ каждого сезона
    Object.entries(countryData.seasons).forEach(([season, data]) => {
      const overallScore = this.calculateSeasonScore(data, season as TravelSeason);
      
      if (overallScore >= 70) {
        analysis.optimal_periods.push({
          season: season as TravelSeason,
          start_month: Math.min(...data.months),
          end_month: Math.max(...data.months),
          weather_score: data.weather_score,
          price_level: this.getPriceLevelFromMultiplier(data.price_multiplier),
          crowd_level: this.getCrowdLevelFromFactor(data.crowd_factor),
          overall_score: overallScore
        });
      } else if (overallScore < 40) {
        analysis.avoid_periods.push({
          season: season as TravelSeason,
          start_month: Math.min(...data.months),
          end_month: Math.max(...data.months),
          reason: this.determineAvoidanceReason(data),
          severity: overallScore < 20 ? 'severe' : 'moderate'
        });
      }
    });
    
    // Определение лучших и худших месяцев
    const monthScores = new Map<number, number>();
    Object.values(countryData.seasons).forEach(data => {
      data.months.forEach(month => {
        const score = this.calculateMonthScore(data, 'year_round');
        monthScores.set(month, score);
      });
    });
    
    const sortedMonths = Array.from(monthScores.entries()).sort(([, a], [, b]) => b - a);
    analysis.best_months = sortedMonths.slice(0, 6).map(([month]) => month);
    analysis.worst_months = sortedMonths.slice(-3).map(([month]) => month);
    
    return analysis;
  }

  /**
   * Поиск оптимального временного окна
   */
  private findOptimalTimeWindow(
    analyses: SeasonalAnalysis[], 
    params: DateOptimizationParams
  ): DateOptimizationResult['optimized_dates'] {
    
    const targetDate = params.targetDate ? new Date(params.targetDate) : new Date();
    const flexibility = params.flexibilityDays || 14;
    const duration = params.duration || 30;
    
    // Если указана целевая дата, начинаем с неё
    let bestStartDate = new Date(targetDate);
    let bestScore = 0;
    
    // Проверяем варианты в диапазоне гибкости
    for (let dayOffset = -flexibility; dayOffset <= flexibility; dayOffset++) {
      const candidateDate = new Date(targetDate);
      candidateDate.setDate(candidateDate.getDate() + dayOffset);
      
      const score = this.scoreTimeWindow(candidateDate, duration, analyses);
      
      if (score > bestScore) {
        bestScore = score;
        bestStartDate = new Date(candidateDate);
      }
    }
    
    const bestEndDate = new Date(bestStartDate);
    bestEndDate.setDate(bestEndDate.getDate() + duration);
    
    // Для travel период добавляем буфер
    const travelStart = new Date(bestStartDate);
    travelStart.setDate(travelStart.getDate() + 7); // Неделя на подготовку
    
    const travelEnd = new Date(bestEndDate);
    travelEnd.setDate(travelEnd.getDate() + 60); // 2 месяца на путешествия
    
    return {
      campaign_start: bestStartDate.toISOString().split('T')[0],
      campaign_end: bestEndDate.toISOString().split('T')[0],
      travel_period_start: travelStart.toISOString().split('T')[0],
      travel_period_end: travelEnd.toISOString().split('T')[0]
    };
  }

  /**
   * Расчет пригодности направлений для выбранного окна
   */
  private calculateDestinationsFit(
    destinations: DestinationPlan[],
    timeWindow: DateOptimizationResult['optimized_dates'],
    analyses: SeasonalAnalysis[]
  ): DateOptimizationResult['destinations_seasonal_fit'] {
    
    const travelDate = new Date(timeWindow.travel_period_start);
    const travelMonth = travelDate.getMonth() + 1;
    
    return destinations.map(destination => {
      const analysis = analyses.find(a => a.destination_id === destination.id);
      const countryData = this.getCountrySeasonalData(destination.geographical_info.country_code);
      
      let seasonalScore = 75; // базовый скор
      let weatherFit = 75;
      let priceAdvantage = 50;
      let crowdAdvantage = 50;
      
      if (countryData && analysis) {
        // Находим сезон для месяца путешествия
        const currentSeason = Object.entries(countryData.seasons).find(([, data]) =>
          data.months.includes(travelMonth)
        );
        
        if (currentSeason) {
          const [seasonName, seasonData] = currentSeason;
          weatherFit = seasonData.weather_score;
          priceAdvantage = this.calculatePriceAdvantage(seasonData.price_multiplier);
          crowdAdvantage = this.calculateCrowdAdvantage(seasonData.crowd_factor);
          seasonalScore = this.calculateSeasonScore(seasonData, seasonName as TravelSeason);
        }
      }
      
      return {
        destination_id: destination.id,
        seasonal_score: seasonalScore,
        weather_fit: weatherFit,
        price_advantage: priceAdvantage,
        crowd_advantage: crowdAdvantage,
        recommended_months: analysis?.best_months || destination.seasonal_context.optimal_months
      };
    });
  }

  /**
   * Генерация альтернативных дат
   */
  private generateDateAlternatives(
    analyses: SeasonalAnalysis[],
    params: DateOptimizationParams
  ): DateOptimizationResult['alternatives'] {
    
    const alternatives = [];
    const baseDate = params.targetDate ? new Date(params.targetDate) : new Date();
    
    // Генерируем 3 альтернативы
    for (let i = 1; i <= 3; i++) {
      const altDate = new Date(baseDate);
      altDate.setMonth(altDate.getMonth() + i * 2); // Каждые 2 месяца
      
      const duration = params.duration || 30;
      const endDate = new Date(altDate);
      endDate.setDate(endDate.getDate() + duration);
      
      const score = this.scoreTimeWindow(altDate, duration, analyses);
      
      alternatives.push({
        start_date: altDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        score: score,
        advantages: this.determineAdvantages(altDate, analyses),
        trade_offs: this.determineTradeOffs(altDate, analyses)
      });
    }
    
    return alternatives.sort((a, b) => b.score - a.score);
  }

  /**
   * Генерация предупреждений
   */
  private generateWarnings(
    destinationsFit: DateOptimizationResult['destinations_seasonal_fit'],
    timeWindow: DateOptimizationResult['optimized_dates']
  ): DateOptimizationResult['warnings'] {
    
    const warnings = [];
    
    for (const fit of destinationsFit) {
      if (fit.weather_fit < 50) {
        warnings.push({
          destination_id: fit.destination_id,
          warning_type: 'weather' as const,
          message: 'Неблагоприятные погодные условия в выбранный период',
          severity: fit.weather_fit < 30 ? 'high' as const : 'medium' as const
        });
      }
      
      if (fit.price_advantage < 30) {
        warnings.push({
          destination_id: fit.destination_id,
          warning_type: 'pricing' as const,
          message: 'Высокий сезон - повышенные цены',
          severity: 'medium' as const
        });
      }
      
      if (fit.crowd_advantage < 30) {
        warnings.push({
          destination_id: fit.destination_id,
          warning_type: 'crowds' as const,
          message: 'Пиковый туристический сезон - большие толпы',
          severity: 'low' as const
        });
      }
    }
    
    return warnings;
  }

  /**
   * Расчет общих метрик оптимизации
   */
  private calculateOptimizationSummary(
    destinationsFit: DateOptimizationResult['destinations_seasonal_fit'],
    params: DateOptimizationParams
  ): DateOptimizationResult['optimization_summary'] {
    
    const avgSeasonal = destinationsFit.reduce((sum, d) => sum + d.seasonal_score, 0) / destinationsFit.length;
    const avgWeather = destinationsFit.reduce((sum, d) => sum + d.weather_fit, 0) / destinationsFit.length;
    const avgPrice = destinationsFit.reduce((sum, d) => sum + d.price_advantage, 0) / destinationsFit.length;
    const avgCrowd = destinationsFit.reduce((sum, d) => sum + d.crowd_advantage, 0) / destinationsFit.length;
    
    return {
      overall_score: Math.round((avgSeasonal + avgWeather + avgPrice + avgCrowd) / 4),
      seasonal_alignment: Math.round(avgSeasonal),
      price_optimization: Math.round(avgPrice),
      weather_optimization: Math.round(avgWeather),
      crowd_optimization: Math.round(avgCrowd),
      flexibility_used: params.flexibilityDays || 0
    };
  }

  // ============ УТИЛИТЫ И ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ============

  /**
   * Инициализация базы данных сезонных данных
   */
  private initializeSeasonalDatabase(): Map<string, CountrySeasonalData> {
    const database = new Map();
    
    // Франция
    database.set('FR', {
      country_code: 'FR',
      seasons: {
        spring: {
          months: [3, 4, 5],
          temperature_range: { min: 8, max: 18 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.1,
          crowd_factor: 6,
          weather_score: 85
        },
        summer: {
          months: [6, 7, 8],
          temperature_range: { min: 15, max: 25 },
          rainfall_level: 'low',
          humidity_level: 'medium',
          tourist_season: 'peak',
          price_multiplier: 1.4,
          crowd_factor: 9,
          weather_score: 90
        },
        autumn: {
          months: [9, 10, 11],
          temperature_range: { min: 8, max: 18 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.2,
          crowd_factor: 7,
          weather_score: 80
        },
        winter: {
          months: [12, 1, 2],
          temperature_range: { min: 2, max: 8 },
          rainfall_level: 'high',
          humidity_level: 'high',
          tourist_season: 'off',
          price_multiplier: 0.8,
          crowd_factor: 4,
          weather_score: 60
        },
        year_round: {
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          temperature_range: { min: 2, max: 25 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.1,
          crowd_factor: 6,
          weather_score: 75
        }
      },
      special_considerations: {}
    });
    
    // Италия
    database.set('IT', {
      country_code: 'IT',
      seasons: {
        spring: {
          months: [4, 5, 6],
          temperature_range: { min: 12, max: 22 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.2,
          crowd_factor: 7,
          weather_score: 88
        },
        summer: {
          months: [7, 8],
          temperature_range: { min: 20, max: 32 },
          rainfall_level: 'low',
          humidity_level: 'medium',
          tourist_season: 'peak',
          price_multiplier: 1.6,
          crowd_factor: 10,
          weather_score: 75
        },
        autumn: {
          months: [9, 10],
          temperature_range: { min: 15, max: 25 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.3,
          crowd_factor: 8,
          weather_score: 85
        },
        winter: {
          months: [11, 12, 1, 2, 3],
          temperature_range: { min: 5, max: 15 },
          rainfall_level: 'high',
          humidity_level: 'high',
          tourist_season: 'off',
          price_multiplier: 0.9,
          crowd_factor: 5,
          weather_score: 65
        },
        year_round: {
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          temperature_range: { min: 5, max: 32 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.2,
          crowd_factor: 7,
          weather_score: 78
        }
      },
      special_considerations: {
        extreme_heat: { start_month: 7, end_month: 8 }
      }
    });
    
    // Япония
    database.set('JP', {
      country_code: 'JP',
      seasons: {
        spring: {
          months: [3, 4, 5],
          temperature_range: { min: 8, max: 20 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'peak',
          price_multiplier: 1.5,
          crowd_factor: 9,
          weather_score: 95
        },
        summer: {
          months: [6, 7, 8],
          temperature_range: { min: 22, max: 32 },
          rainfall_level: 'high',
          humidity_level: 'high',
          tourist_season: 'shoulder',
          price_multiplier: 1.1,
          crowd_factor: 6,
          weather_score: 60
        },
        autumn: {
          months: [9, 10, 11],
          temperature_range: { min: 12, max: 22 },
          rainfall_level: 'low',
          humidity_level: 'medium',
          tourist_season: 'peak',
          price_multiplier: 1.4,
          crowd_factor: 8,
          weather_score: 90
        },
        winter: {
          months: [12, 1, 2],
          temperature_range: { min: 0, max: 10 },
          rainfall_level: 'low',
          humidity_level: 'low',
          tourist_season: 'shoulder',
          price_multiplier: 1.0,
          crowd_factor: 5,
          weather_score: 70
        },
        year_round: {
          months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          temperature_range: { min: 0, max: 32 },
          rainfall_level: 'medium',
          humidity_level: 'medium',
          tourist_season: 'shoulder',
          price_multiplier: 1.2,
          crowd_factor: 7,
          weather_score: 75
        }
      },
      special_considerations: {
        monsoon_season: { start_month: 6, end_month: 7 }
      }
    });
    
    return database;
  }

  /**
   * Получение данных о сезонах для страны
   */
  private getCountrySeasonalData(countryCode: string): CountrySeasonalData | null {
    return this.seasonalDatabase.get(countryCode) || null;
  }

  /**
   * Расчет скора сезона
   */
  private calculateSeasonScore(seasonData: any, season: TravelSeason): number {
    let score = seasonData.weather_score;
    
    // Корректировка на основе конфигурации
    if (this.config.avoidPeakPricing && seasonData.tourist_season === 'peak') {
      score -= 20;
    }
    
    if (this.config.crowdPreference === 'avoid_crowds' && seasonData.crowd_factor > 7) {
      score -= 15;
    }
    
    if (this.config.preferredSeasons && !this.config.preferredSeasons.includes(season)) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Расчет скора месяца
   */
  private calculateMonthScore(seasonData: any, season: TravelSeason): number {
    return this.calculateSeasonScore(seasonData, season);
  }

  /**
   * Скоринг временного окна
   */
  private scoreTimeWindow(startDate: Date, duration: number, analyses: SeasonalAnalysis[]): number {
    const startMonth = startDate.getMonth() + 1;
    let totalScore = 0;
    
    for (const analysis of analyses) {
      const monthScore = analysis.best_months.includes(startMonth) ? 100 : 
                        analysis.worst_months.includes(startMonth) ? 20 : 60;
      totalScore += monthScore;
    }
    
    return totalScore / analyses.length;
  }

  /**
   * Проверка попадания месяца в диапазон
   */
  private isMonthInRange(month: number, startMonth: number, endMonth: number): boolean {
    if (startMonth <= endMonth) {
      return month >= startMonth && month <= endMonth;
    } else {
      // Диапазон переходит через год (например, декабрь-февраль)
      return month >= startMonth || month <= endMonth;
    }
  }

  /**
   * Определение уровня цены по множителю
   */
  private getPriceLevelFromMultiplier(multiplier: number): 'low' | 'medium' | 'high' | 'peak' {
    if (multiplier < 0.9) return 'low';
    if (multiplier < 1.2) return 'medium';
    if (multiplier < 1.5) return 'high';
    return 'peak';
  }

  /**
   * Определение уровня толпы по фактору
   */
  private getCrowdLevelFromFactor(factor: number): 'low' | 'medium' | 'high' | 'peak' {
    if (factor < 4) return 'low';
    if (factor < 7) return 'medium';
    if (factor < 9) return 'high';
    return 'peak';
  }

  /**
   * Определение причины избегания
   */
  private determineAvoidanceReason(seasonData: any): string {
    if (seasonData.weather_score < 50) return 'Неблагоприятная погода';
    if (seasonData.price_multiplier > 1.5) return 'Слишком высокие цены';
    if (seasonData.crowd_factor > 8) return 'Слишком много туристов';
    return 'Низкие общие показатели';
  }

  /**
   * Расчет ценового преимущества
   */
  private calculatePriceAdvantage(multiplier: number): number {
    // Инвертируем: чем меньше множитель, тем больше преимущество
    return Math.round(Math.max(0, Math.min(100, (2 - multiplier) * 50)));
  }

  /**
   * Расчет преимущества по толпам
   */
  private calculateCrowdAdvantage(crowdFactor: number): number {
    // Инвертируем: чем меньше толпа, тем больше преимущество
    return Math.round(Math.max(0, Math.min(100, (10 - crowdFactor) * 10)));
  }

  /**
   * Определение преимуществ даты
   */
  private determineAdvantages(date: Date, analyses: SeasonalAnalysis[]): string[] {
    const month = date.getMonth() + 1;
    const advantages = [];
    
    const goodWeatherCount = analyses.filter(a => a.best_months.includes(month)).length;
    if (goodWeatherCount > analyses.length * 0.7) {
      advantages.push('Отличная погода в большинстве направлений');
    }
    
    // Добавляем другие преимущества на основе анализа
    if (month >= 3 && month <= 5) {
      advantages.push('Весенний сезон - умеренные цены');
    }
    
    return advantages;
  }

  /**
   * Определение компромиссов даты
   */
  private determineTradeOffs(date: Date, analyses: SeasonalAnalysis[]): string[] {
    const month = date.getMonth() + 1;
    const tradeOffs = [];
    
    const badWeatherCount = analyses.filter(a => a.worst_months.includes(month)).length;
    if (badWeatherCount > 0) {
      tradeOffs.push(`Неидеальная погода в ${badWeatherCount} направлениях`);
    }
    
    return tradeOffs;
  }
}