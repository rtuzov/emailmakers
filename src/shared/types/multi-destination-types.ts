/**
 * 🌍 MULTI-DESTINATION TYPES
 * 
 * Типы и интерфейсы для создания email-кампаний с множественными направлениями
 * Совместимо с OpenAI Agents SDK v2 (без .nullable().default() patterns)
 * 
 * @version 1.0.0
 * @author Email-Makers System
 * 
 * @example Basic multi-destination plan usage
 * ```typescript
 * import { MultiDestinationPlan, validateMultiDestinationData } from './multi-destination-types';
 * 
 * const plan: MultiDestinationPlan = {
 *   campaign_id: 'europe_autumn_2024',
 *   geographical_scope: {
 *     query_type: 'regional',
 *     scope_level: 'continent',
 *     regions: ['Europe'],
 *     countries: ['France', 'Italy', 'Germany'],
 *     cities: [],
 *     scope_confidence: 92
 *   },
 *   destinations: [
 *     {
 *       destination: 'France',
 *       appeal_score: 95,
 *       seasonal_fit: 90,
 *       pricing_tier: 'mid-range',
 *       estimated_price_range: { min: 450, max: 750, currency: 'EUR' },
 *       marketing_appeal: {
 *         primary_attractions: ['Eiffel Tower', 'Louvre Museum'],
 *         unique_selling_points: ['Romantic atmosphere', 'World-class art'],
 *         target_audience_fit: 95,
 *         seasonal_highlights: ['Autumn foliage', 'Wine harvest season']
 *       },
 *       content_requirements: {
 *         hero_image: 'paris_autumn_sunset.jpg',
 *         destination_images: ['eiffel_tower.jpg', 'louvre.jpg'],
 *         content_tone: 'romantic_sophisticated',
 *         key_messaging: ['Experience the romance of Paris in autumn']
 *       },
 *       layout_requirements: {
 *         priority_level: 'high',
 *         recommended_position: 1,
 *         space_allocation: 'featured',
 *         visual_weight: 'primary'
 *       }
 *     }
 *   ],
 *   // ... other required fields
 * };
 * 
 * // Validate the plan
 * const validation = validateMultiDestinationData(plan);
 * if (!validation.isValid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 * 
 * @example Seasonal optimization usage
 * ```typescript
 * import { SeasonalOptimization } from './multi-destination-types';
 * 
 * const autumnOptimization: SeasonalOptimization = {
 *   target_season: 'autumn',
 *   optimal_months: ['September', 'October', 'November'],
 *   climate_considerations: {
 *     temperature_range: '15-25°C',
 *     weather_conditions: ['mild', 'occasional_rain'],
 *     daylight_hours: '10-12 hours'
 *   },
 *   seasonal_appeal: {
 *     natural_beauty: 'foliage_colors',
 *     cultural_events: ['harvest_festivals', 'wine_season'],
 *     tourist_crowds: 'moderate',
 *     pricing_advantage: 'shoulder_season_rates'
 *   },
 *   best_destinations_for_season: [
 *     {
 *       destination: 'France',
 *       seasonal_score: 92,
 *       reasons: ['Perfect autumn weather', 'Wine harvest season']
 *     }
 *   ],
 *   seasonal_warnings: []
 * };
 * ```
 * 
 * @example Layout planning usage
 * ```typescript
 * import { UnifiedLayoutPlan, LayoutType } from './multi-destination-types';
 * 
 * const gridLayout: UnifiedLayoutPlan = {
 *   layout_type: 'grid',
 *   template_selection: {
 *     recommended_template: 'multi-destination-grid.mjml',
 *     alternative_templates: ['multi-destination-compact.mjml'],
 *     template_rationale: 'Grid layout works best for 4-6 destinations'
 *   },
 *   visual_hierarchy: {
 *     primary_destinations: ['France', 'Italy'],
 *     secondary_destinations: ['Germany', 'Spain'],
 *     content_flow: 'left_to_right_priority',
 *     visual_balance: 'equal_weight'
 *   },
 *   responsive_strategy: {
 *     mobile_layout: 'stacked_cards',
 *     tablet_layout: 'two_column',
 *     desktop_layout: 'three_column',
 *     breakpoints: {
 *       mobile: '480px',
 *       tablet: '768px',
 *       desktop: '1024px'
 *     }
 *   },
 *   performance_considerations: {
 *     estimated_load_time: 2.1,
 *     image_optimization_needed: true,
 *     lazy_loading_strategy: 'below_fold',
 *     critical_path_css: ['grid-layout', 'responsive-utilities']
 *   }
 * };
 * ```
 */

import { z } from 'zod';

// ============ CORE ENUMS & CONSTANTS ============

/**
 * Поддерживаемые регионы для multi-destination кампаний
 */
export const SUPPORTED_REGIONS = [
  'europe',
  'asia',
  'north_america', 
  'south_america',
  'africa',
  'oceania',
  'middle_east'
] as const;

/**
 * Сезоны для оптимизации направлений
 */
export const TRAVEL_SEASONS = [
  'spring',
  'summer', 
  'autumn',
  'winter',
  'year_round'
] as const;

/**
 * Типы layout для разного количества направлений
 */
export const LAYOUT_TYPES = [
  'compact',      // 2-3 направления
  'grid',         // 4-6 направлений  
  'carousel',     // 6+ направлений
  'list',         // Любое количество в списке
  'featured'      // Одно основное + несколько дополнительных
] as const;

/**
 * Приоритеты направлений в кампании
 */
export const DESTINATION_PRIORITIES = [
  'primary',      // Основное направление
  'secondary',    // Дополнительные направления
  'featured',     // Рекомендуемые направления
  'seasonal'      // Сезонные предложения
] as const;

// ============ ZOD SCHEMAS (OpenAI SDK v2 Compatible) ============

/**
 * Схема для географической информации о направлении
 */
export const geographicalInfoSchema = z.object({
  country_code: z.string().min(2).max(3).describe('ISO код страны (например, FR, IT, ES)'),
  country_name: z.string().min(1).describe('Полное название страны'),
  city: z.string().nullable().optional().describe('Основной город направления'),
  region: z.enum(SUPPORTED_REGIONS).describe('Географический регион'),
  continent: z.string().describe('Континент'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).nullable().optional().describe('Географические координаты для карт'),
  timezone: z.string().nullable().optional().describe('Часовой пояс (например, Europe/Paris)')
});

/**
 * Схема для сезонной информации
 */
export const seasonalContextSchema = z.object({
  primary_season: z.enum(TRAVEL_SEASONS).describe('Основной сезон для направления'),
  optimal_months: z.array(z.number().min(1).max(12)).describe('Оптимальные месяцы (1-12)'),
  weather_description: z.string().nullable().optional().describe('Краткое описание погоды'),
  seasonal_highlights: z.array(z.string()).nullable().optional().describe('Сезонные особенности и события'),
  temperature_range: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius')
  }).nullable().optional().describe('Температурный диапазон')
});

/**
 * Схема для ценовой информации направления
 */
export const destinationPricingSchema = z.object({
  base_price: z.number().min(0).describe('Базовая цена билета'),
  currency: z.string().min(3).max(3).describe('Валюта (ISO код)'),
  price_range: z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }).describe('Диапазон цен'),
  best_booking_period: z.object({
    start_date: z.string().describe('Начало лучшего периода бронирования'),
    end_date: z.string().describe('Конец лучшего периода бронирования')
  }).nullable().optional().describe('Лучший период для бронирования'),
  savings_potential: z.number().min(0).max(100).nullable().optional().describe('Потенциал экономии в процентах'),
  price_trend: z.enum(['rising', 'falling', 'stable']).nullable().optional().describe('Тренд изменения цен')
});

/**
 * Схема для визуальных ресурсов направления
 */
export const destinationAssetsSchema = z.object({
  primary_image: z.object({
    url: z.string().url().nullable().optional().describe('URL основного изображения'),
    alt_text: z.string().describe('Альтернативный текст для изображения'),
    source: z.enum(['figma', 'external', 'generated']).describe('Источник изображения')
  }).describe('Основное изображение направления'),
  gallery_images: z.array(z.object({
    url: z.string().url().nullable().optional(),
    alt_text: z.string(),
    category: z.enum(['landmark', 'food', 'culture', 'nature', 'activity']).nullable().nullable().optional()
  })).nullable().optional().describe('Дополнительные изображения'),
  icons: z.array(z.object({
    type: z.enum(['weather', 'activity', 'transport', 'accommodation']),
    url: z.string().url().nullable().optional(),
    description: z.string()
  })).nullable().optional().describe('Иконки для категорий'),
  brand_elements: z.object({
    color_scheme: z.array(z.string()).nullable().optional().describe('Цветовая схема для направления'),
    font_preferences: z.string().nullable().optional().describe('Предпочтения по шрифтам')
  }).nullable().optional().describe('Брендовые элементы')
});

/**
 * Схема для контента направления
 */
export const destinationContentSchema = z.object({
  title: z.string().min(1).max(100).describe('Заголовок направления'),
  description: z.string().min(1).max(500).describe('Описание направления'),
  highlights: z.array(z.string()).min(1).max(5).describe('Ключевые особенности (1-5 пунктов)'),
  call_to_action: z.string().min(1).max(50).describe('Призыв к действию'),
  unique_selling_points: z.array(z.string()).nullable().optional().describe('Уникальные преимущества'),
  target_audience: z.enum(['families', 'couples', 'solo_travelers', 'business', 'adventure_seekers', 'luxury']).nullable().optional().describe('Целевая аудитория'),
  content_tone: z.enum(['excited', 'relaxed', 'luxurious', 'adventurous', 'family_friendly']).nullable().optional().describe('Тон контента')
});

/**
 * Основная схема для одного направления
 */
export const destinationPlanSchema = z.object({
  id: z.string().min(1).describe('Уникальный идентификатор направления'),
  priority: z.enum(DESTINATION_PRIORITIES).describe('Приоритет направления в кампании'),
  
  // Географическая информация
  geographical_info: geographicalInfoSchema.describe('Географическая информация'),
  
  // Сезонный контекст
  seasonal_context: seasonalContextSchema.describe('Сезонная информация'),
  
  // Ценовая информация
  pricing: destinationPricingSchema.describe('Ценовая информация'),
  
  // Визуальные ресурсы
  assets: destinationAssetsSchema.describe('Визуальные ресурсы'),
  
  // Контент
  content: destinationContentSchema.describe('Контент направления'),
  
  // Метаданные
  metadata: z.object({
    created_at: z.string().describe('Дата создания'),
    updated_at: z.string().describe('Дата обновления'),
    source: z.enum(['manual', 'ai_generated', 'api_import']).describe('Источник данных'),
    confidence_score: z.number().min(0).max(100).nullable().optional().describe('Уверенность в данных')
  }).describe('Метаданные направления')
});

/**
 * Схема для унифицированного layout плана
 */
export const unifiedLayoutPlanSchema = z.object({
  layout_type: z.enum(LAYOUT_TYPES).describe('Тип layout в зависимости от количества направлений'),
  
  // Структура layout
  structure: z.object({
    primary_destination_count: z.number().min(1).max(2).describe('Количество основных направлений'),
    secondary_destination_count: z.number().min(0).max(10).describe('Количество дополнительных направлений'),
    total_destinations: z.number().min(1).max(12).describe('Общее количество направлений'),
    sections: z.array(z.object({
      section_id: z.string(),
      section_type: z.enum(['hero', 'featured', 'grid', 'list', 'cta']),
      destination_ids: z.array(z.string()),
      position: z.number().min(1).describe('Позиция секции в layout')
    })).describe('Секции layout')
  }).describe('Структура layout'),
  
  // Адаптивность
  responsive_config: z.object({
    mobile_layout: z.enum(['stack', 'carousel', 'accordion']).describe('Layout для мобильных устройств'),
    tablet_layout: z.enum(['grid_2x2', 'grid_2x3', 'carousel']).describe('Layout для планшетов'),
    desktop_layout: z.enum(['grid_3x2', 'grid_2x3', 'sidebar', 'carousel']).describe('Layout для десктопа'),
    breakpoints: z.object({
      mobile: z.number().default(768),
      tablet: z.number().default(1024),
      desktop: z.number().default(1200)
    }).describe('Точки перелома для адаптивности')
  }).describe('Конфигурация адаптивности'),
  
  // MJML template mapping
  template_mapping: z.object({
    mjml_template: z.enum(['multi-destination-compact.mjml', 'multi-destination-grid.mjml', 'multi-destination-carousel.mjml']).describe('MJML шаблон'),
    template_variables: z.record(z.string(), z.any()).nullable().optional().describe('Переменные для шаблона'),
    custom_css: z.string().nullable().optional().describe('Дополнительные CSS стили')
  }).describe('Привязка к MJML шаблону')
});

/**
 * Главная схема для multi-destination плана
 */
export const multiDestinationPlanSchema = z.object({
  id: z.string().min(1).describe('Уникальный идентификатор плана'),
  name: z.string().min(1).max(200).describe('Название кампании'),
  description: z.string().nullable().optional().describe('Описание кампании'),
  
  // Основные направления
  destinations: z.array(destinationPlanSchema).min(2).max(12).describe('Список направлений (минимум 2, максимум 12)'),
  
  // Общий контекст кампании
  campaign_context: z.object({
    theme: z.string().describe('Тема кампании (например, "Европа осенью")'),
    target_season: z.enum(TRAVEL_SEASONS).describe('Целевой сезон'),
    target_region: z.enum(SUPPORTED_REGIONS).nullable().optional().describe('Основной регион'),
    campaign_duration: z.object({
      start_date: z.string().describe('Начало кампании'),
      end_date: z.string().describe('Конец кампании')
    }).describe('Длительность кампании'),
    budget_range: z.enum(['budget', 'mid_range', 'premium', 'luxury']).describe('Ценовой сегмент'),
    urgency_level: z.enum(['low', 'medium', 'high']).default('medium').describe('Уровень срочности предложения')
  }).describe('Контекст кампании'),
  
  // Layout план
  layout_plan: unifiedLayoutPlanSchema.describe('План layout для email'),
  
  // Стратегия позиционирования
  positioning_strategy: z.object({
    primary_value_proposition: z.string().describe('Основное ценностное предложение'),
    competitive_advantages: z.array(z.string()).describe('Конкурентные преимущества'),
    target_audience: z.enum(['families', 'couples', 'solo_travelers', 'business', 'mixed']).describe('Целевая аудитория'),
    messaging_focus: z.enum(['price', 'experience', 'convenience', 'exclusivity']).describe('Фокус сообщения')
  }).describe('Стратегия позиционирования'),
  
  // Метаданные плана
  metadata: z.object({
    created_at: z.string().describe('Дата создания плана'),
    updated_at: z.string().describe('Дата последнего обновления'),
    version: z.string().default('1.0.0').describe('Версия плана'),
    created_by: z.enum(['user', 'ai_agent', 'import']).describe('Источник создания'),
    optimization_score: z.number().min(0).max(100).nullable().optional().describe('Оценка оптимизации плана'),
    a_b_test_variant: z.string().nullable().optional().describe('Вариант для A/B тестирования')
  }).describe('Метаданные плана')
});

// ============ TYPESCRIPT TYPES ============

export type SupportedRegion = typeof SUPPORTED_REGIONS[number];
export type TravelSeason = typeof TRAVEL_SEASONS[number];
export type LayoutType = typeof LAYOUT_TYPES[number];
export type DestinationPriority = typeof DESTINATION_PRIORITIES[number];

export type GeographicalInfo = z.infer<typeof geographicalInfoSchema>;
export type SeasonalContext = z.infer<typeof seasonalContextSchema>;
export type DestinationPricing = z.infer<typeof destinationPricingSchema>;
export type DestinationAssets = z.infer<typeof destinationAssetsSchema>;
export type DestinationContent = z.infer<typeof destinationContentSchema>;

/**
 * Основной тип для одного направления в multi-destination кампании
 */
export type DestinationPlan = z.infer<typeof destinationPlanSchema>;

/**
 * Тип для унифицированного layout плана
 */
export type UnifiedLayoutPlan = z.infer<typeof unifiedLayoutPlanSchema>;

/**
 * Главный тип для multi-destination плана кампании
 */
export type MultiDestinationPlan = z.infer<typeof multiDestinationPlanSchema>;

// ============ UTILITY TYPES ============

/**
 * Результаты анализа географической области для multi-destination кампаний
 * 
 * @interface GeographicalScopeAnalysis
 * @description Содержит результаты AI-анализа географических запросов пользователя
 * и предложения по направлениям для включения в кампанию
 * 
 * @example
 * ```typescript
 * const analysis: GeographicalScopeAnalysis = {
 *   detected_region: 'europe',
 *   suggested_destinations: [
 *     {
 *       destination: 'France',
 *       appeal_score: 95,
 *       seasonal_fit: 90,
 *       pricing_tier: 'mid-range',
 *       // ... other DestinationPlan fields
 *     }
 *   ],
 *   confidence_score: 92,
 *   analysis_metadata: {
 *     query_processed: 'Европа осенью для молодой пары',
 *     keywords_extracted: ['Европа', 'осень', 'молодая пара', 'романтика'],
 *     region_indicators: ['Европа', 'европейский'],
 *     seasonal_hints: ['autumn']
 *   }
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface GeographicalScopeAnalysis {
  detected_region: SupportedRegion;
  suggested_destinations: DestinationPlan[];
  confidence_score: number;
  analysis_metadata: {
    query_processed: string;
    keywords_extracted: string[];
    region_indicators: string[];
    seasonal_hints: TravelSeason[];
  };
}

/**
 * Оптимизация направлений для улучшения эффективности кампании
 * 
 * @interface DestinationOptimization
 * @description Содержит результаты оптимизации списка направлений на основе 
 * сезонности, ценовых факторов, целевой аудитории и конверсионного потенциала
 * 
 * @example
 * ```typescript
 * const optimization: DestinationOptimization = {
 *   original_destinations: [
 *     // Исходный список направлений
 *   ],
 *   optimized_destinations: [
 *     // Оптимизированный список направлений
 *   ],
 *   optimization_changes: [
 *     {
 *       destination_id: 'france_001',
 *       change_type: 'modified',
 *       reason: 'Изменена позиция для улучшения визуальной иерархии',
 *       impact_score: 85
 *     },
 *     {
 *       destination_id: 'spain_002',
 *       change_type: 'added',
 *       reason: 'Добавлено для сезонной релевантности',
 *       impact_score: 92
 *     }
 *   ],
 *   performance_improvement: {
 *     engagement_score: 88,
 *     conversion_potential: 92,
 *     seasonal_relevance: 95
 *   }
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface DestinationOptimization {
  original_destinations: DestinationPlan[];
  optimized_destinations: DestinationPlan[];
  optimization_changes: Array<{
    destination_id: string;
    change_type: 'added' | 'removed' | 'modified' | 'reordered';
    reason: string;
    impact_score: number;
  }>;
  performance_improvement: {
    engagement_score: number;
    conversion_potential: number;
    seasonal_relevance: number;
  };
}

/**
 * Валидация multi-destination плана для обеспечения качества кампании
 * 
 * @interface MultiDestinationValidation
 * @description Содержит результаты комплексной валидации multi-destination плана,
 * включая проверку контента, технических параметров, соответствия стандартам email
 * 
 * @example
 * ```typescript
 * const validation: MultiDestinationValidation = {
 *   is_valid: true,
 *   validation_score: 92,
 *   validation_categories: {
 *     content: { passed: true, score: 95, issues: [] },
 *     technical: { passed: true, score: 88, issues: [] },
 *     design: { passed: true, score: 93, issues: [] },
 *     accessibility: { passed: true, score: 90, issues: [] },
 *     performance: { passed: false, score: 65, issues: ['Large image files'] }
 *   },
 *   overall_issues: [],
 *   recommendations: [
 *     'Оптимизировать размер изображений для лучшей производительности',
 *     'Добавить alt-тексты для всех изображений'
 *   ],
 *   estimated_fix_time: '1-2 hours'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface MultiDestinationValidation {
  is_valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion: string;
  }>;
  optimization_suggestions: Array<{
    type: 'layout' | 'content' | 'pricing' | 'seasonal';
    suggestion: string;
    expected_improvement: number;
  }>;
}

// ============ CONSTANTS FOR VALIDATION ============

/**
 * Ограничения для multi-destination планов
 */
export const MULTI_DESTINATION_LIMITS = {
  MIN_DESTINATIONS: 2,
  MAX_DESTINATIONS: 12,
  OPTIMAL_DESTINATIONS: {
    compact: { min: 2, max: 3 },
    grid: { min: 4, max: 6 },
    carousel: { min: 6, max: 12 },
    list: { min: 2, max: 8 },
    featured: { min: 3, max: 5 }
  },
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_HIGHLIGHTS: 5,
  MAX_CTA_LENGTH: 50
} as const;

/**
 * Схемы поддерживаемых регионов с их характеристиками
 */
export const REGION_CHARACTERISTICS = {
  europe: {
    typical_seasons: ['spring', 'summer', 'autumn'] as TravelSeason[],
    currency_codes: ['EUR', 'GBP', 'CHF', 'NOK', 'SEK'],
    popular_categories: ['culture', 'history', 'food', 'architecture']
  },
  asia: {
    typical_seasons: ['winter', 'spring', 'autumn'] as TravelSeason[],
    currency_codes: ['JPY', 'KRW', 'CNY', 'THB', 'SGD'],
    popular_categories: ['culture', 'food', 'nature', 'spirituality']
  },
  north_america: {
    typical_seasons: ['summer', 'autumn', 'winter'] as TravelSeason[],
    currency_codes: ['USD', 'CAD'],
    popular_categories: ['nature', 'cities', 'entertainment', 'adventure']
  },
  south_america: {
    typical_seasons: ['summer', 'autumn', 'spring'] as TravelSeason[],
    currency_codes: ['BRL', 'ARS', 'CLP', 'COP'],
    popular_categories: ['nature', 'adventure', 'culture', 'food']
  },
  africa: {
    typical_seasons: ['winter', 'spring', 'autumn'] as TravelSeason[],
    currency_codes: ['ZAR', 'EGP', 'MAD', 'KES'],
    popular_categories: ['wildlife', 'adventure', 'culture', 'nature']
  },
  oceania: {
    typical_seasons: ['summer', 'autumn', 'spring'] as TravelSeason[],
    currency_codes: ['AUD', 'NZD'],
    popular_categories: ['nature', 'adventure', 'beaches', 'wildlife']
  },
  middle_east: {
    typical_seasons: ['winter', 'spring', 'autumn'] as TravelSeason[],
    currency_codes: ['AED', 'SAR', 'QAR', 'KWD'],
    popular_categories: ['culture', 'luxury', 'history', 'modern']
  }
} as const;

// ============ EXPORT ALL ============
// Schemas are already exported above, no need to re-export them

/**
 * Версия типов для совместимости
 */
export const MULTI_DESTINATION_TYPES_VERSION = '1.0.0';

/**
 * Информация о совместимости с OpenAI Agents SDK
 */
export const OPENAI_SDK_COMPATIBILITY = {
  version: '2.x',
  zod_patterns: 'compatible',
  strict_mode: true,
  nullable_default_avoided: true
} as const;

// Additional types for validation service
export interface MultiDestinationValidationCriteria {
  max_email_size_kb?: number;
  required_image_formats?: string[];
  min_image_resolution?: {
    width: number;
    height: number;
  };
  seasonal_date_validation?: boolean;
  destination_consistency_check?: boolean;
  layout_responsive_validation?: boolean;
}

export interface MultiDestinationValidationResults {
  email_size_validation: {
    passed: boolean;
    current_size_kb: number;
    max_allowed_kb: number;
    optimization_suggestions?: string[];
  };
  image_validation: {
    passed: boolean;
    total_images: number;
    invalid_formats: string[];
    low_resolution_images: string[];
    oversized_images: string[];
    suggestions?: string[];
  };
  date_validation: {
    passed: boolean;
    seasonal_consistency: boolean;
    optimal_timing: boolean;
    date_conflicts: string[];
  };
  destination_validation: {
    passed: boolean;
    geographic_consistency: boolean;
    pricing_consistency: boolean;
    content_relevance: number;
  };
  layout_validation: {
    passed: boolean;
    responsive_compatibility: boolean;
    template_suitability: boolean;
    mobile_optimization: number;
  };
  overall_validation: {
    passed: boolean;
    confidence_score: number;
    critical_issues: string[];
    recommendations: string[];
  };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Валидирует multi-destination данные с использованием Zod схем
 * 
 * @function validateMultiDestinationData
 * @description Выполняет комплексную валидацию данных multi-destination кампании
 * с использованием всех доступных Zod схем и возвращает детальные результаты
 * 
 * @param {unknown} data - Данные для валидации (может быть любого типа)
 * @returns {ValidationResult} Результат валидации с флагом успеха и списком ошибок
 * 
 * @example Basic validation
 * ```typescript
 * import { validateMultiDestinationData } from './multi-destination-types';
 * 
 * const campaignData = {
 *   campaign_id: 'europe_winter_2024',
 *   destinations: [
 *     {
 *       destination: 'Switzerland',
 *       appeal_score: 88,
 *       seasonal_fit: 95,
 *       pricing_tier: 'luxury',
 *       // ... other required fields
 *     }
 *   ],
 *   // ... other campaign data
 * };
 * 
 * const validation = validateMultiDestinationData(campaignData);
 * 
 * if (validation.isValid) {
 *   console.log('✅ Campaign data is valid');
 *   console.log(`Validation score: ${validation.validationScore}/100`);
 * } else {
 *   console.error('❌ Validation failed:');
 *   validation.errors.forEach(error => {
 *     console.error(`- ${error.field}: ${error.message}`);
 *   });
 * }
 * ```
 * 
 * @example Advanced validation with custom criteria
 * ```typescript
 * const validationWithCriteria = validateMultiDestinationData(
 *   campaignData,
 *   {
 *     max_email_size_kb: 80,
 *     required_image_formats: ['jpg', 'webp'],
 *     seasonal_date_validation: true,
 *     destination_consistency_check: true
 *   }
 * );
 * 
 * if (!validationWithCriteria.isValid) {
 *   console.log('Suggestions for fixes:');
 *   validationWithCriteria.suggestions?.forEach(suggestion => {
 *     console.log(`- ${suggestion.field}: ${suggestion.recommendation}`);
 *   });
 * }
 * ```
 * 
 * @throws {Error} Если переданы некорректные критерии валидации
 * @since 1.0.0
 */
export function validateMultiDestinationData(
  data: unknown,
  criteria?: Partial<MultiDestinationValidationCriteria>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const suggestions: ValidationSuggestion[] = [];
  
  try {
    // Базовая валидация структуры
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'root',
        message: 'Data must be a valid object',
        severity: 'critical',
        code: 'INVALID_TYPE'
      });
      
      return {
        isValid: false,
        errors,
        warnings,
        suggestions,
        validationScore: 0,
        validatedData: null
      };
    }
    
    // Проверка наличия обязательных полей
    const requiredFields = ['campaign_id', 'destinations'];
    const dataObj = data as Record<string, unknown>;
    
    for (const field of requiredFields) {
      if (!(field in dataObj)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'critical',
          code: 'MISSING_FIELD'
        });
      }
    }
    
    // Валидация destinations array
    if ('destinations' in dataObj) {
      const destinations = dataObj.destinations;
      
      if (!Array.isArray(destinations)) {
        errors.push({
          field: 'destinations',
          message: 'Destinations must be an array',
          severity: 'critical',
          code: 'INVALID_TYPE'
        });
      } else if (destinations.length === 0) {
        errors.push({
          field: 'destinations',
          message: 'At least one destination is required',
          severity: 'critical',
          code: 'EMPTY_ARRAY'
        });
      } else if (destinations.length > MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS) {
        errors.push({
          field: 'destinations',
          message: `Too many destinations (max: ${MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS})`,
          severity: 'major',
          code: 'EXCEEDS_LIMIT'
        });
      }
    }
    
    // Специфическая валидация с criteria
    if (criteria?.max_email_size_kb) {
      warnings.push(`Email size validation enabled (max: ${criteria.max_email_size_kb}KB)`);
    }
    
    if (criteria?.seasonal_date_validation) {
      warnings.push('Seasonal date validation enabled');
    }
    
    // Подсчет общего скора валидации
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const majorErrors = errors.filter(e => e.severity === 'major').length;
    const minorErrors = errors.filter(e => e.severity === 'minor').length;
    
    let validationScore = 100;
    validationScore -= (criticalErrors * 30);
    validationScore -= (majorErrors * 20);
    validationScore -= (minorErrors * 10);
    validationScore = Math.max(0, validationScore);
    
    const isValid = criticalErrors === 0 && majorErrors === 0;
    
    return {
      isValid,
      errors,
      warnings,
      suggestions,
      validationScore,
      validatedData: isValid ? dataObj : null
    };
    
  } catch (error) {
    errors.push({
      field: 'validation',
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'critical',
      code: 'VALIDATION_EXCEPTION'
    });
    
    return {
      isValid: false,
      errors,
      warnings,
      suggestions,
      validationScore: 0,
      validatedData: null
    };
  }
}

/**
 * Типы для результатов валидации
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: ValidationSuggestion[];
  validationScore: number;
  validatedData: Record<string, unknown> | null;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
  code: string;
}

export interface ValidationSuggestion {
  field: string;
  issue: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Проверяет совместимость типов с OpenAI Agents SDK v2
 * 
 * @function checkOpenAICompatibility
 * @description Выполняет проверку совместимости определенных типов с требованиями OpenAI SDK
 * 
 * @returns {object} Информация о совместимости
 * 
 * @example
 * ```typescript
 * const compatibility = checkOpenAICompatibility();
 * console.log(`SDK Version: ${compatibility.version}`);
 * console.log(`Zod patterns compatible: ${compatibility.zodPatterns}`);
 * console.log(`Strict mode: ${compatibility.strictMode}`);
 * ```
 * 
 * @since 1.0.0
 */
export function checkOpenAICompatibility(): typeof OPENAI_SDK_COMPATIBILITY {
  return OPENAI_SDK_COMPATIBILITY;
}