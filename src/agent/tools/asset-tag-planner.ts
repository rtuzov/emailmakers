/**
 * ��️ ASSET TAG PLANNER - OpenAI Agents SDK Compatible
 * 
 * Планирует теги для поиска изображений на основе контента email кампании.
 * Анализирует бриф и определяет оптимальные теги для Figma и внешних источников.
 * 
 * АРХИТЕКТУРА:
 * ├── Анализ брифа кампании
 * ├── Извлечение ключевых слов
 * ├── Маппинг на русские теги Figma
 * ├── Планирование распределения изображений
 * └── Создание структурированного плана ассетов
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { AITagMapper } from './ai-tag-mapper';

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

/**
 * Схема параметров для планировщика тегов ассетов
 */
export const AssetTagPlannerParamsSchema = z.object({
  campaign_brief: z.string().describe('Краткое описание кампании'),
  campaign_type: z.enum(['promotional', 'seasonal', 'informational']).describe('Тип кампании'),
  target_audience: z.string().describe('Целевая аудитория'),
  emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).describe('Эмоциональный тон'),
  content_context: z.string().optional().nullable().describe('Дополнительный контекст контента'),
  destinations: z.array(z.string()).optional().nullable().describe('Направления путешествий'),
  themes: z.array(z.string()).optional().nullable().describe('Основные темы кампании')
});

/**
 * Схема плана тегов ассетов
 */
export const AssetTagPlanSchema = z.object({
  success: z.boolean().describe('Успешность планирования'),
  asset_requirements: z.object({
    hero_image: z.object({
      tags: z.array(z.string()).describe('Теги для hero изображения'),
      description: z.string().describe('Описание требований к hero изображению'),
      priority: z.enum(['high', 'medium', 'low']).describe('Приоритет')
    }),
    content_images: z.array(z.object({
      tags: z.array(z.string()).describe('Теги для контентного изображения'),
      description: z.string().describe('Описание изображения'),
      placement: z.string().describe('Размещение в шаблоне')
    })).describe('Контентные изображения'),
    footer_elements: z.array(z.object({
      tags: z.array(z.string()).describe('Теги для footer элементов'),
      description: z.string().describe('Описание footer элементов'),
      type: z.enum(['icon', 'logo', 'decoration']).describe('Тип элемента')
    })).describe('Footer элементы')
  }).describe('Требования к ассетам'),
  figma_search_tags: z.array(z.string()).describe('Теги для поиска в Figma'),
  external_search_tags: z.array(z.string()).describe('Теги для внешнего поиска'),
  image_distribution: z.object({
    figma_images_count: z.number().describe('Количество изображений из Figma'),
    external_images_count: z.number().describe('Количество внешних изображений'),
    total_images_needed: z.number().describe('Общее количество изображений')
  }).describe('Распределение изображений'),
  reasoning: z.string().describe('Обоснование выбранной стратегии')
});

type AssetTagPlannerParams = z.infer<typeof AssetTagPlannerParamsSchema>;
type AssetTagPlan = z.infer<typeof AssetTagPlanSchema>;

// ============================================================================
// OPENAI AGENTS SDK TOOL DEFINITION
// ============================================================================

/**
 * OpenAI Agents SDK совместимый инструмент для планирования тегов ассетов
 */
export const assetTagPlannerTool = tool({
  name: 'asset_tag_planner',
  description: 'Планирует теги для поиска изображений на основе контента email кампании. Анализирует бриф и определяет оптимальные теги для Figma и внешних источников.',
  parameters: AssetTagPlannerParamsSchema,
  execute: async (params: AssetTagPlannerParams): Promise<AssetTagPlan> => {
    console.log('🏷️ Asset Tag Planner: Starting planning process...');
    console.log('📋 Campaign Brief:', params.campaign_brief);
    
    try {
      // Инициализируем AI Tag Mapper
      const aiTagMapper = new AITagMapper();
      
      // Извлекаем ключевые слова из брифа
      const keywords = extractKeywordsFromBrief(params.campaign_brief);
      console.log('🔍 Extracted keywords:', keywords);
      
      // Генерируем базовые теги
      const baseTags = generateBaseTags(params);
      console.log('🏷️ Base tags:', baseTags);
      
      // Комбинируем все теги
      const allTags = [...keywords, ...baseTags];
      
      // Маппим теги на русские Figma теги
      const mappingResult = await aiTagMapper.mapTags({
        inputTags: allTags,
        campaignType: params.campaign_type,
        emotionalTone: params.emotional_tone,
        ...(params.content_context ? { contentContext: params.content_context } : {})
      });
      
      const figmaTags = mappingResult.success ? mappingResult.mappedTags : [];
      
      console.log('🎯 Mapped Figma tags:', figmaTags);
      
      // Планируем распределение изображений
      const distribution = planImageDistribution(params);
      console.log('📊 Image distribution:', distribution);
      
      // Создаем требования к ассетам
      const assetRequirements = createAssetRequirements(figmaTags, params, distribution);
      
      // Создаем теги для внешнего поиска
      const externalTags = createExternalSearchTags(allTags, params);
      
      // Формируем финальный план
      const plan: AssetTagPlan = {
        success: true,
        asset_requirements: assetRequirements,
        figma_search_tags: figmaTags,
        external_search_tags: externalTags,
        image_distribution: distribution,
        reasoning: `Создан план для ${params.campaign_type} кампании с ${distribution.total_images_needed} изображениями. ` +
                  `${distribution.figma_images_count} из Figma (брендированные) и ${distribution.external_images_count} внешних. ` +
                  `Использованы теги: ${figmaTags.slice(0, 3).join(', ')} и другие.`
      };
      
      console.log('✅ Asset Tag Planner: Plan created successfully');
      return plan;
      
    } catch (error) {
      console.error('❌ Asset Tag Planner error:', error);
      throw new Error(`Asset Tag Planner failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Извлечение ключевых слов из брифа кампании
 */
function extractKeywordsFromBrief(brief: string): string[] {
  const keywords: string[] = [];
  
  // Ключевые слова для путешествий
  const travelKeywords = ['путешеств', 'отдых', 'перелет', 'авиа', 'самолет', 'полет', 'билет', 'маршрут'];
  const seasonKeywords = ['весна', 'лето', 'осень', 'зима', 'сезон'];
  const locationKeywords = ['япония', 'сочи', 'москва', 'европа', 'азия'];
  const actionKeywords = ['скидка', 'акция', 'предложение', 'горящий', 'специальный'];
  
  const briefLower = brief.toLowerCase();
  
  // Проверяем наличие ключевых слов
  [...travelKeywords, ...seasonKeywords, ...locationKeywords, ...actionKeywords].forEach(keyword => {
    if (briefLower.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  // Добавляем специфичные теги на основе контекста
  if (briefLower.includes('япония') || briefLower.includes('сакура')) {
    keywords.push('япония', 'сакура', 'азия');
  }
  
  if (briefLower.includes('горящие') || briefLower.includes('скидка')) {
    keywords.push('акция', 'скидка', 'предложение');
  }
  
  return [...new Set(keywords)]; // Убираем дубликаты
}

/**
 * Генерация базовых тегов на основе параметров кампании
 */
function generateBaseTags(params: AssetTagPlannerParams): string[] {
  const tags: string[] = [];
  
  // Теги на основе типа кампании
  switch (params.campaign_type) {
    case 'promotional':
      tags.push('promotion', 'sale', 'offer', 'акция');
      break;
    case 'seasonal':
      tags.push('seasonal', 'holiday', 'celebration', 'сезон');
      break;
    case 'informational':
      tags.push('info', 'news', 'update', 'информация');
      break;
  }
  
  // Теги на основе эмоционального тона
  switch (params.emotional_tone) {
    case 'positive':
      tags.push('happy', 'joy', 'positive', 'веселый');
      break;
    case 'friendly':
      tags.push('friendly', 'warm', 'welcoming', 'дружелюбный');
      break;
    case 'urgent':
      tags.push('urgent', 'fast', 'quick', 'срочно');
      break;
  }
  
  // Теги для целевой аудитории
  if (params.target_audience.includes('молодеж') || params.target_audience.includes('young')) {
    tags.push('young', 'youth', 'modern', 'молодежь');
  }
  
  // Добавляем направления
  if (params.destinations) {
    tags.push(...params.destinations);
  }
  
  // Добавляем темы
  if (params.themes) {
    tags.push(...params.themes);
  }
  
  return tags;
}

/**
 * Планирование распределения изображений
 */
function planImageDistribution(params: AssetTagPlannerParams): {
  figma_images_count: number;
  external_images_count: number;
  total_images_needed: number;
} {
  // Базовое количество изображений в зависимости от типа кампании
  let totalImages = 3; // По умолчанию: hero + 1 content + 1 footer
  
  if (params.campaign_type === 'promotional') {
    totalImages = 4; // Больше визуального контента для промо
  } else if (params.campaign_type === 'seasonal') {
    totalImages = 5; // Сезонные кампании более визуальные
  }
  
  // Приоритет Figma ассетам (брендированные)
  const figmaCount = Math.ceil(totalImages * 0.7); // 70% из Figma
  const externalCount = totalImages - figmaCount;
  
  return {
    figma_images_count: figmaCount,
    external_images_count: externalCount,
    total_images_needed: totalImages
  };
}

/**
 * Создание требований к ассетам
 */
function createAssetRequirements(
  figmaTags: string[],
  params: AssetTagPlannerParams,
  distribution: { figma_images_count: number; external_images_count: number; total_images_needed: number; }
): AssetTagPlan['asset_requirements'] {
  
  // Hero изображение (всегда из Figma для брендинга)
  const heroTags = figmaTags.filter(tag => 
    ['заяц', 'кролик', 'персонаж', 'герой', 'главный'].includes(tag)
  ).slice(0, 3);
  
  // Контентные изображения
  const contentImages = [];
  const remainingTags = figmaTags.filter(tag => !heroTags.includes(tag));
  
  for (let i = 0; i < distribution.total_images_needed - 2; i++) { // -2 для hero и footer
    const startIdx = i * 2;
    const imageTags = remainingTags.slice(startIdx, startIdx + 3);
    
    contentImages.push({
      tags: imageTags,
      description: `Контентное изображение ${i + 1} для поддержки основного сообщения`,
      placement: i === 0 ? 'main_content' : `section_${i + 1}`
    });
  }
  
  // Footer элементы
  const footerTags = ['иконка', 'логотип', 'значок'].filter(tag => figmaTags.includes(tag));
  
  return {
    hero_image: {
      tags: heroTags.length > 0 ? heroTags : ['заяц', 'персонаж', 'герой'],
      description: `Hero изображение для ${params.campaign_type} кампании с брендированным персонажем`,
      priority: 'high' as const
    },
    content_images: contentImages,
    footer_elements: [{
      tags: footerTags.length > 0 ? footerTags : ['иконка', 'логотип'],
      description: 'Footer элементы и иконки для завершения дизайна',
      type: 'icon' as const
    }]
  };
}

/**
 * Создание тегов для внешнего поиска
 */
function createExternalSearchTags(inputTags: string[], params: AssetTagPlannerParams): string[] {
  const externalTags = [];
  
  // Переводим русские теги на английский для международных источников
  const translationMap: Record<string, string> = {
    'путешествия': 'travel',
    'отдых': 'vacation',
    'авиация': 'aviation',
    'самолет': 'airplane',
    'весна': 'spring',
    'лето': 'summer',
    'япония': 'japan',
    'сакура': 'sakura',
    'молодежь': 'young people',
    'акция': 'promotion',
    'скидка': 'discount'
  };
  
  // Добавляем переведенные теги
  inputTags.forEach(tag => {
    const translated = translationMap[tag.toLowerCase()];
    if (translated) {
      externalTags.push(translated);
    } else if (!/[а-яё]/i.test(tag)) { // Если тег уже на английском
      externalTags.push(tag);
    }
  });
  
  // Добавляем контекстные теги
  externalTags.push('high quality', 'professional', 'marketing');
  
  if (params.campaign_type === 'promotional') {
    externalTags.push('sale', 'offer', 'deal');
  }
  
  return [...new Set(externalTags)]; // Убираем дубликаты
}

// No fallback plans - all errors must be handled properly by throwing

// ============================================================================
// EXPORTS
// ============================================================================

// Для обратной совместимости - определяем отдельную функцию
export const executeAssetTagPlanner = async (params: AssetTagPlannerParams): Promise<AssetTagPlan> => {
  // Эта функция содержит ту же логику, что и в tool.execute
  console.log('🏷️ Asset Tag Planner: Starting planning process...');
  console.log('📋 Campaign Brief:', params.campaign_brief);
  
  try {
    // Инициализируем AI Tag Mapper
    const aiTagMapper = new AITagMapper();
    
    // Извлекаем ключевые слова из брифа
    const keywords = extractKeywordsFromBrief(params.campaign_brief);
    console.log('🔍 Extracted keywords:', keywords);
    
    // Генерируем базовые теги
    const baseTags = generateBaseTags(params);
    console.log('🏷️ Base tags:', baseTags);
    
    // Комбинируем все теги
    const allTags = [...keywords, ...baseTags];
    
    // Маппим теги на русские Figma теги
    const mappingResult = await aiTagMapper.mapTags({
      inputTags: allTags,
      campaignType: params.campaign_type,
      emotionalTone: params.emotional_tone,
      ...(params.content_context ? { contentContext: params.content_context } : {})
    });
    
    const figmaTags = mappingResult.success ? mappingResult.mappedTags : [];
    
    console.log('🎯 Mapped Figma tags:', figmaTags);
    
    // Планируем распределение изображений
    const distribution = planImageDistribution(params);
    console.log('📊 Image distribution:', distribution);
    
    // Создаем требования к ассетам
    const assetRequirements = createAssetRequirements(figmaTags, params, distribution);
    
    // Создаем теги для внешнего поиска
    const externalTags = createExternalSearchTags(allTags, params);
    
    // Формируем финальный план
    const plan: AssetTagPlan = {
      success: true,
      asset_requirements: assetRequirements,
      figma_search_tags: figmaTags,
      external_search_tags: externalTags,
      image_distribution: distribution,
      reasoning: `Создан план для ${params.campaign_type} кампании с ${distribution.total_images_needed} изображениями. ` +
                `${distribution.figma_images_count} из Figma (брендированные) и ${distribution.external_images_count} внешних. ` +
                `Использованы теги: ${figmaTags.slice(0, 3).join(', ')} и другие.`
    };
    
    console.log('✅ Asset Tag Planner: Plan created successfully');
    return plan;
    
  } catch (error) {
    console.error('❌ Asset Tag Planner error:', error);
    throw new Error(`Asset Tag Planner failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`);
  }
};

export type { AssetTagPlannerParams, AssetTagPlan };
export default assetTagPlannerTool; 