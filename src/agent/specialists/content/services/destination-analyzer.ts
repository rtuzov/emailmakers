/**
 * 🌍 DESTINATION ANALYZER SERVICE
 * 
 * Сервис для анализа географических запросов и генерации направлений
 * Использует AI для понимания запросов типа "Европа осенью"
 * Совместим с OpenAI Agents SDK v2
 */

import {
  MultiDestinationPlan,
  DestinationPlan,
  GeographicalScopeAnalysis,
  SupportedRegion,
  TravelSeason,
  SUPPORTED_REGIONS,
  // TRAVEL_SEASONS,
  REGION_CHARACTERISTICS,
  multiDestinationPlanSchema,
  // destinationPlanSchema
} from '../../../../shared/types/multi-destination-types';
import { ContentUtils } from '../common/content-utils';

export interface DestinationAnalyzerConfig {
  aiModel?: string;
  confidenceThreshold?: number;
  maxDestinations?: number;
  preferredRegions?: SupportedRegion[];
}

export interface DestinationGenerationParams {
  query: string;
  season?: TravelSeason;
  region?: SupportedRegion;
  budgetRange?: 'budget' | 'mid_range' | 'premium' | 'luxury';
  targetAudience?: 'families' | 'couples' | 'solo_travelers' | 'business' | 'mixed';
  maxDestinations?: number;
  preferences?: {
    culture?: boolean;
    nature?: boolean;
    cities?: boolean;
    beaches?: boolean;
    adventure?: boolean;
    food?: boolean;
  };
}

export class DestinationAnalyzer {
  private config: DestinationAnalyzerConfig;
  // private _performanceStart: number = 0;

  constructor(config: DestinationAnalyzerConfig = {}) {
    this.config = {
      aiModel: config.aiModel || 'gpt-4o-mini',
      confidenceThreshold: config.confidenceThreshold || 75,
      maxDestinations: config.maxDestinations || 6,
      preferredRegions: config.preferredRegions || [...SUPPORTED_REGIONS],
      ...config
    };
  }

  /**
   * Анализ географической области из текстового запроса
   * Примеры: "Европа осенью", "Азия зимой", "теплые страны в январе"
   */
  async analyzeGeographicalScope(query: string): Promise<GeographicalScopeAnalysis> {
    // this._performanceStart = Date.now();
    
    try {
      console.log(`🌍 Analyzing geographical scope for query: "${query}"`);

      // Шаг 1: Извлечение ключевых слов и индикаторов
      const keywords = this.extractKeywords(query);
      const regionIndicators = this.detectRegionIndicators(query, keywords);
      const seasonalHints = this.detectSeasonalHints(query, keywords);
      
      // Шаг 2: Определение основного региона
      const detectedRegion = this.determineRegion(regionIndicators, keywords);
      
      // Шаг 3: Генерация предложенных направлений
      const suggestedDestinations = await this.generateDestinationOptions({
        query,
        region: detectedRegion,
        season: seasonalHints[0] || 'year_round',
        maxDestinations: this.config.maxDestinations || 5
      });

      // Шаг 4: Расчет уверенности
      const confidenceScore = this.calculateConfidenceScore(
        detectedRegion,
        regionIndicators,
        seasonalHints,
        keywords
      );

      console.log(`✅ Geographical analysis completed: ${detectedRegion} (confidence: ${confidenceScore}%)`);

      return {
        detected_region: detectedRegion,
        suggested_destinations: suggestedDestinations,
        confidence_score: confidenceScore,
        analysis_metadata: {
          query_processed: query.toLowerCase().trim(),
          keywords_extracted: keywords,
          region_indicators: regionIndicators,
          seasonal_hints: seasonalHints
        }
      };

    } catch (error) {
      console.error('❌ Geographical scope analysis error:', error);
      
      // NO FALLBACK POLICY: Fail fast with clear error
      throw new Error(`DestinationAnalyzer.analyzeGeographicalScope failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Генерация опций направлений на основе параметров
   */
  async generateDestinationOptions(params: DestinationGenerationParams): Promise<DestinationPlan[]> {
    // this._performanceStart = Date.now();
    
    try {
      console.log(`🎯 Generating destination options for: ${params.query}`);

      // Шаг 1: Определение базовых параметров
      const region = params.region || this.detectRegionFromQuery(params.query);
      const season = params.season || this.detectSeasonFromQuery(params.query);
      const maxDestinations = Math.min(params.maxDestinations || 6, 12);

      // Шаг 2: Получение характеристик региона
      const regionChar = REGION_CHARACTERISTICS[region];
      
      // Шаг 3: Генерация направлений на основе AI анализа
      const destinations = await this.generateDestinationsWithAI(params, region, season, regionChar);
      
      // Шаг 4: Обогащение направлений дополнительными данными
      const enrichedDestinations = await this.enrichDestinations(destinations, params);
      
      // Шаг 5: Сортировка и ограничение количества
      const finalDestinations = this.prioritizeDestinations(enrichedDestinations, params)
        .slice(0, maxDestinations);

      console.log(`✅ Generated ${finalDestinations.length} destination options`);
      
      return finalDestinations;

    } catch (error) {
      console.error('❌ Destination generation error:', error);
      
      // NO FALLBACK POLICY: Fail fast with clear error
      throw new Error(`DestinationAnalyzer.generateRecommendations failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Создание унифицированного плана из списка направлений
   */
  async createUnifiedPlan(
    destinations: DestinationPlan[], 
    campaignName: string,
    context?: {
      theme?: string;
      targetSeason?: TravelSeason;
      budgetRange?: 'budget' | 'mid_range' | 'premium' | 'luxury';
      urgencyLevel?: 'low' | 'medium' | 'high';
    }
  ): Promise<MultiDestinationPlan> {
    try {
      console.log(`📋 Creating unified plan for ${destinations.length} destinations`);

      // Определение layout типа на основе количества направлений
      const layoutType = this.determineLayoutType(destinations.length);
      
      // Создание базового плана
      const plan: MultiDestinationPlan = {
        id: ContentUtils.generateId('multi_plan'),
        name: campaignName,
        description: context?.theme || `Кампания с ${destinations.length} направлениями`,
        destinations: destinations,
        campaign_context: {
          theme: context?.theme || campaignName,
          target_season: context?.targetSeason || this.detectDominantSeason(destinations),
          target_region: this.detectDominantRegion(destinations),
          campaign_duration: {
            start_date: new Date().toISOString().split('T')[0]!,
            end_date: this.calculateCampaignEndDate(context?.targetSeason)
          },
          budget_range: context?.budgetRange || 'mid_range',
          urgency_level: context?.urgencyLevel || 'medium'
        },
        layout_plan: {
          layout_type: layoutType,
          structure: this.createLayoutStructure(destinations, layoutType),
          responsive_config: this.createResponsiveConfig(layoutType),
          template_mapping: this.createTemplateMapping(layoutType, destinations.length)
        },
        positioning_strategy: {
          primary_value_proposition: this.generateValueProposition(destinations, context),
          competitive_advantages: this.identifyCompetitiveAdvantages(destinations),
          target_audience: context?.budgetRange === 'luxury' ? 'couples' : 'families',
          messaging_focus: context?.budgetRange === 'budget' ? 'price' : 'experience'
        },
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: '1.0.0',
          created_by: 'ai_agent',
          optimization_score: this.calculateOptimizationScore(destinations)
        }
      };

      // Валидация плана
      const validationResult = multiDestinationPlanSchema.safeParse(plan);
      if (!validationResult.success) {
        console.warn('⚠️ Plan validation issues:', validationResult.error.issues);
      }

      console.log(`✅ Unified plan created: ${plan.layout_plan.layout_type} layout`);
      
      return plan;

    } catch (error) {
      console.error('❌ Unified plan creation error:', error);
      throw error;
    }
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ============

  /**
   * Извлечение ключевых слов из запроса
   */
  private extractKeywords(query: string): string[] {
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Удаляем стоп-слова
    const stopWords = ['и', 'в', 'на', 'с', 'по', 'для', 'от', 'до', 'the', 'in', 'on', 'at', 'to', 'for', 'of'];
    return words.filter(word => !stopWords.includes(word));
  }

  /**
   * Определение индикаторов регионов
   */
  private detectRegionIndicators(query: string, _keywords: string[]): string[] {
    const indicators: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Прямые упоминания регионов
    const regionMentions: Record<string, string[]> = {
      'europe': ['европ', 'europe', 'eu'],
      'asia': ['азия', 'asia', 'восток'],
      'north_america': ['америк', 'america', 'сша', 'usa', 'канад'],
      'south_america': ['южная америка', 'латинск', 'бразили'],
      'africa': ['африк', 'africa'],
      'oceania': ['австрали', 'океани', 'australia'],
      'middle_east': ['ближний восток', 'middle east', 'арабск']
    };

    // Упоминания стран
    const countryMentions: Record<string, SupportedRegion> = {
      'франция': 'europe', 'франци': 'europe', 'paris': 'europe', 'париж': 'europe',
      'италия': 'europe', 'итали': 'europe', 'рим': 'europe', 'rome': 'europe',
      'испания': 'europe', 'испани': 'europe', 'мадрид': 'europe', 'barcelona': 'europe',
      'германия': 'europe', 'герман': 'europe', 'берлин': 'europe', 'berlin': 'europe',
      'япония': 'asia', 'japan': 'asia', 'токио': 'asia', 'tokyo': 'asia',
      'китай': 'asia', 'china': 'asia', 'пекин': 'asia', 'beijing': 'asia',
      'таиланд': 'asia', 'thailand': 'asia', 'бангкок': 'asia', 'bangkok': 'asia'
    };

    // Проверяем прямые упоминания регионов
    Object.entries(regionMentions).forEach(([region, words]) => {
      if (words.some(word => lowerQuery.includes(word))) {
        indicators.push(region);
      }
    });

    // Проверяем упоминания стран
    Object.entries(countryMentions).forEach(([country, region]) => {
      if (lowerQuery.includes(country)) {
        indicators.push(region);
      }
    });

    return Array.from(new Set(indicators)); // Убираем дубликаты
  }

  /**
   * Определение сезонных подсказок
   */
  private detectSeasonalHints(query: string, _keywords: string[]): TravelSeason[] {
    const hints: TravelSeason[] = [];
    const lowerQuery = query.toLowerCase();

    const seasonKeywords: Record<TravelSeason, string[]> = {
      'spring': ['весн', 'spring', 'март', 'апрел', 'май', 'march', 'april', 'may'],
      'summer': ['лет', 'summer', 'июн', 'июл', 'август', 'june', 'july', 'august'],
      'autumn': ['осен', 'autumn', 'fall', 'сентябр', 'октябр', 'ноябр', 'september', 'october', 'november'],
      'winter': ['зим', 'winter', 'декабр', 'январ', 'феврал', 'december', 'january', 'february'],
      'year_round': ['круглый год', 'year round', 'всегда', 'always']
    };

    Object.entries(seasonKeywords).forEach(([season, words]) => {
      if (words.some(word => lowerQuery.includes(word))) {
        hints.push(season as TravelSeason);
      }
    });

    return hints;
  }

  /**
   * Определение основного региона
   */
  private determineRegion(indicators: string[], _keywords: string[]): SupportedRegion {
    if (indicators.length === 0) {
      return 'europe'; // По умолчанию
    }

    // Возвращаем первый найденный регион
    const validRegion = indicators.find(indicator => 
      SUPPORTED_REGIONS.includes(indicator as SupportedRegion)
    );
    
    return (validRegion as SupportedRegion) || 'europe';
  }

  /**
   * Расчет уверенности анализа
   */
  private calculateConfidenceScore(
    _region: SupportedRegion,
    indicators: string[],
    seasonalHints: TravelSeason[],
    _keywords: string[]
  ): number {
    let score = 50; // Базовая уверенность

    // +30 за прямые индикаторы региона
    if (indicators.length > 0) score += 30;
    
    // +20 за сезонные подсказки
    if (seasonalHints.length > 0) score += 20;
    
    // +10 за количество ключевых слов
    score += Math.min(_keywords.length * 2, 20);
    
    // -10 если слишком мало информации
    if (_keywords.length < 3) score -= 10;

    return Math.max(25, Math.min(95, score));
  }

  /**
   * Генерация направлений с помощью AI (mock implementation)
   */
  private async generateDestinationsWithAI(
    _params: DestinationGenerationParams,
    region: SupportedRegion,
    season: TravelSeason | undefined,
    _regionChar: any
  ): Promise<DestinationPlan[]> {
    // В реальной реализации здесь будет вызов AI модели
    console.log(`🤖 AI generating destinations for ${region} in ${season || 'any season'}`);
    
    // Mock destinations на основе региона
    const mockDestinations: Record<SupportedRegion, Partial<DestinationPlan>[]> = {
      'europe': [
        {
          id: 'fr-paris',
          geographical_info: {
            country_code: 'FR',
            country_name: 'Франция',
            city: 'Париж',
            region: 'europe',
            continent: 'Европа'
          },
          content: {
            title: 'Париж - Город Света',
            description: 'Романтичная столица Франции с уникальной архитектурой',
            highlights: ['Эйфелева башня', 'Лувр', 'Елисейские поля'],
            call_to_action: 'Открыть Париж'
          }
        },
        {
          id: 'it-rome',
          geographical_info: {
            country_code: 'IT',
            country_name: 'Италия',
            city: 'Рим',
            region: 'europe',
            continent: 'Европа'
          },
          content: {
            title: 'Рим - Вечный Город',
            description: 'Древняя столица империи с богатой историей',
            highlights: ['Колизей', 'Ватикан', 'Пантеон'],
            call_to_action: 'Исследовать Рим'
          }
        }
      ],
      'asia': [
        {
          id: 'jp-tokyo',
          geographical_info: {
            country_code: 'JP',
            country_name: 'Япония',
            city: 'Токио',
            region: 'asia',
            continent: 'Азия'
          },
          content: {
            title: 'Токио - Мегаполис будущего',
            description: 'Современная столица с традиционной культурой',
            highlights: ['Сибуя', 'Храмы', 'Современные технологии'],
            call_to_action: 'Открыть Токио'
          }
        }
      ],
      'north_america': [],
      'south_america': [],
      'africa': [],
      'oceania': [],
      'middle_east': []
    };

    const baseDests = mockDestinations[region] || mockDestinations['europe'];
    
    return baseDests.map((dest, index) => ({
      id: dest.id || ContentUtils.generateId('dest'),
      priority: index === 0 ? 'primary' : 'secondary',
      geographical_info: dest.geographical_info!,
      seasonal_context: {
        primary_season: season || 'year_round',
        optimal_months: this.getOptimalMonths(region, season)
      },
      pricing: {
        base_price: 35000 + Math.random() * 15000,
        currency: 'RUB',
        price_range: { min: 30000, max: 50000 }
      },
      assets: {
        primary_image: {
          alt_text: `${dest.content?.title} - основное изображение`,
          source: 'figma'
        }
      },
      content: dest.content!,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'ai_generated',
        confidence_score: 85
      }
    })) as DestinationPlan[];
  }

  /**
   * Обогащение направлений дополнительными данными
   */
  private async enrichDestinations(
    destinations: DestinationPlan[],
    params: DestinationGenerationParams
  ): Promise<DestinationPlan[]> {
    return destinations.map(dest => ({
      ...dest,
      seasonal_context: {
        ...dest.seasonal_context,
        weather_description: this.generateWeatherDescription(dest, params.season),
        seasonal_highlights: this.generateSeasonalHighlights(dest, params.season)
      },
      pricing: {
        ...dest.pricing,
        savings_potential: Math.floor(Math.random() * 25) + 5,
        price_trend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as any
      }
    }));
  }

  /**
   * Приоритизация направлений
   */
  private prioritizeDestinations(
    destinations: DestinationPlan[],
    _params: DestinationGenerationParams
  ): DestinationPlan[] {
    return destinations.sort((a, b) => {
      // Сортируем по confidence_score в метаданных
      const scoreA = a.metadata.confidence_score || 0;
      const scoreB = b.metadata.confidence_score || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Определение региона из запроса (альтернативный метод)
   */
  private detectRegionFromQuery(query: string): SupportedRegion {
    const analysis = this.detectRegionIndicators(query, this.extractKeywords(query));
    return (analysis[0] as SupportedRegion) || 'europe';
  }

  /**
   * Определение сезона из запроса
   */
  private detectSeasonFromQuery(query: string): TravelSeason | undefined {
    const hints = this.detectSeasonalHints(query, this.extractKeywords(query));
    return hints[0];
  }

  /**
   * Получение оптимальных месяцев для региона и сезона
   */
  private getOptimalMonths(_region: SupportedRegion, season?: TravelSeason): number[] {
    const seasonMonths: Record<TravelSeason, number[]> = {
      'spring': [3, 4, 5],
      'summer': [6, 7, 8],
      'autumn': [9, 10, 11],
      'winter': [12, 1, 2],
      'year_round': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };

    return seasonMonths[season || 'year_round'];
  }

  // ============ ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ============

  private determineLayoutType(destinationCount: number): any {
    if (destinationCount <= 3) return 'compact';
    if (destinationCount <= 6) return 'grid';
    return 'carousel';
  }

  private detectDominantSeason(destinations: DestinationPlan[]): TravelSeason {
    const seasons = destinations.map(d => d.seasonal_context.primary_season);
    return seasons[0] || 'year_round';
  }

  private detectDominantRegion(destinations: DestinationPlan[]): SupportedRegion | undefined {
    const regions = destinations.map(d => d.geographical_info.region);
    return regions[0];
  }

  private calculateCampaignEndDate(_season?: TravelSeason): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Кампания на 3 месяца
    return date.toISOString().split('T')[0]!;
  }

  private createLayoutStructure(destinations: DestinationPlan[], _layoutType: string): any {
    return {
      primary_destination_count: Math.min(destinations.length, 2),
      secondary_destination_count: Math.max(0, destinations.length - 2),
      total_destinations: destinations.length,
      sections: [
        {
          section_id: 'hero',
          section_type: 'hero',
          destination_ids: destinations.slice(0, 1).map(d => d.id),
          position: 1
        },
        {
          section_id: 'featured',
          section_type: 'featured',
          destination_ids: destinations.slice(1).map(d => d.id),
          position: 2
        }
      ]
    };
  }

  private createResponsiveConfig(layoutType: string): any {
    return {
      mobile_layout: 'stack',
      tablet_layout: 'grid_2x2',
      desktop_layout: layoutType === 'grid' ? 'grid_3x2' : 'carousel',
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      }
    };
  }

  private createTemplateMapping(layoutType: string, destinationCount: number): any {
    const templateMap: Record<string, string> = {
      'compact': 'multi-destination-compact.mjml',
      'grid': 'multi-destination-grid.mjml',
      'carousel': 'multi-destination-carousel.mjml'
    };

    return {
      mjml_template: templateMap[layoutType] || 'multi-destination-grid.mjml',
      template_variables: {
        destination_count: destinationCount,
        layout_style: layoutType
      }
    };
  }

  private generateValueProposition(destinations: DestinationPlan[], _context: any): string {
    if (destinations.length <= 3) {
      return `Эксклюзивная подборка ${destinations.length} лучших направлений`;
    }
    return `Откройте ${destinations.length} удивительных направлений в одной кампании`;
  }

  private identifyCompetitiveAdvantages(destinations: DestinationPlan[]): string[] {
    return [
      'Тщательно отобранные направления',
      'Оптимальные цены для каждого направления',
      'Экспертные рекомендации',
      `${destinations.length} направлений в одном предложении`
    ];
  }

  private calculateOptimizationScore(destinations: DestinationPlan[]): number {
    const avgConfidence = destinations.reduce((sum, d) => 
      sum + (d.metadata.confidence_score || 0), 0) / destinations.length;
    
    return Math.round(avgConfidence);
  }

  private generateWeatherDescription(_dest: DestinationPlan, season?: TravelSeason): string {
    const seasonDescriptions: Record<TravelSeason, string> = {
      'spring': 'Мягкая весенняя погода',
      'summer': 'Теплое солнечное лето',
      'autumn': 'Комфортная осенняя температура',
      'winter': 'Прохладная зимняя погода',
      'year_round': 'Комфортная погода круглый год'
    };
    
    return seasonDescriptions[season || 'year_round'];
  }

  private generateSeasonalHighlights(_dest: DestinationPlan, season?: TravelSeason): string[] {
    const highlights: Record<TravelSeason, string[]> = {
      'spring': ['Цветение садов', 'Комфортные прогулки'],
      'summer': ['Пляжный сезон', 'Фестивали на открытом воздухе'],
      'autumn': ['Золотая осень', 'Сезон урожая'],
      'winter': ['Зимние развлечения', 'Праздничная атмосфера'],
      'year_round': ['Всесезонные развлечения']
    };
    
    return highlights[season || 'year_round'];
  }
}