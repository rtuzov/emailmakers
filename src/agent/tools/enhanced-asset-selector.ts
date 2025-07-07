/**
 * 🎨 ENHANCED ASSET SELECTOR - OpenAI Agents SDK Compatible
 * 
 * Выбирает и обрабатывает изображения для email шаблонов на основе плана от Content Specialist.
 * Использует интеллектуальный поиск в Figma и внешних источниках.
 * 
 * АРХИТЕКТУРА:
 * ├── Обработка плана ассетов от Content Specialist
 * ├── Интеллектуальный поиск в Figma по тегам
 * ├── Fallback на внешние источники изображений
 * ├── Оптимизация и валидация выбранных ассетов
 * └── Формирование структурированного результата
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { AssetManager } from '../core/asset-manager';

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

/**
 * Схема плана ассетов от Content Specialist
 */
export const AssetPlanSchema = z.object({
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

/**
 * Схема результата выбора ассетов
 */
export const AssetSelectionResultSchema = z.object({
  success: z.boolean().describe('Успешность выбора ассетов'),
  selected_assets: z.object({
    hero_assets: z.array(z.object({
      asset_id: z.string().describe('ID ассета'),
      filename: z.string().describe('Имя файла'),
      url: z.string().describe('URL изображения'),
      source: z.enum(['figma', 'external']).describe('Источник'),
      tags: z.array(z.string()).describe('Теги ассета'),
      metadata: z.any().describe('Метаданные ассета')
    })).describe('Hero ассеты'),
    content_assets: z.array(z.object({
      asset_id: z.string().describe('ID ассета'),
      filename: z.string().describe('Имя файла'),
      url: z.string().describe('URL изображения'),
      source: z.enum(['figma', 'external']).describe('Источник'),
      placement: z.string().describe('Размещение'),
      tags: z.array(z.string()).describe('Теги ассета'),
      metadata: z.any().describe('Метаданные ассета')
    })).describe('Контентные ассеты'),
    footer_assets: z.array(z.object({
      asset_id: z.string().describe('ID ассета'),
      filename: z.string().describe('Имя файла'),
      url: z.string().describe('URL изображения'),
      source: z.enum(['figma', 'external']).describe('Источник'),
      type: z.enum(['icon', 'logo', 'decoration']).describe('Тип'),
      tags: z.array(z.string()).describe('Теги ассета'),
      metadata: z.any().describe('Метаданные ассета')
    })).describe('Footer ассеты')
  }).describe('Выбранные ассеты'),
  distribution_achieved: z.object({
    figma_count: z.number().describe('Фактическое количество из Figma'),
    external_count: z.number().describe('Фактическое количество внешних'),
    total_count: z.number().describe('Общее количество')
  }).describe('Достигнутое распределение'),
  search_metadata: z.object({
    figma_search_results: z.number().describe('Результатов поиска в Figma'),
    external_search_results: z.number().describe('Результатов внешнего поиска'),
    selection_strategy: z.string().describe('Стратегия выбора'),
    processing_time_ms: z.number().describe('Время обработки в мс')
  }).describe('Метаданные поиска'),
  reasoning: z.string().describe('Обоснование выбора ассетов')
});

export type AssetPlan = z.infer<typeof AssetPlanSchema>;
export type AssetSelectionResult = z.infer<typeof AssetSelectionResultSchema>;

// ============================================================================
// OPENAI AGENTS SDK TOOL DEFINITION
// ============================================================================

/**
 * OpenAI Agents SDK совместимый инструмент для выбора ассетов
 */
export const enhancedAssetSelectorTool = tool({
  name: 'enhanced_asset_selector',
  description: 'Выбирает и обрабатывает изображения для email шаблонов на основе плана от Content Specialist. Использует интеллектуальный поиск в Figma и внешних источниках.',
  parameters: AssetPlanSchema,
  execute: async (assetPlan: AssetPlan): Promise<AssetSelectionResult> => {
    console.log('🎨 Enhanced Asset Selector: Starting asset selection...');
    console.log('📋 Asset Plan:', JSON.stringify(assetPlan, null, 2));
    
    const startTime = Date.now();
    
    try {
      // Инициализируем Asset Manager
      const assetManager = new AssetManager();
      
      // Выбираем hero ассеты
      const heroAssets = await selectHeroAssets(assetManager, assetPlan);
      console.log(`🎯 Selected ${heroAssets.length} hero assets`);
      
      // Выбираем контентные ассеты
      const contentAssets = await selectContentAssets(assetManager, assetPlan);
      console.log(`📄 Selected ${contentAssets.length} content assets`);
      
      // Выбираем footer ассеты
      const footerAssets = await selectFooterAssets(assetManager, assetPlan);
      console.log(`🔗 Selected ${footerAssets.length} footer assets`);
      
      // Подсчитываем распределение
      const distributionAchieved = calculateDistribution(heroAssets, contentAssets, footerAssets);
      
      // Создаем метаданные поиска
      const searchMetadata = {
        figma_search_results: distributionAchieved.figma_count,
        external_search_results: distributionAchieved.external_count,
        selection_strategy: 'intelligent_priority_based',
        processing_time_ms: Date.now() - startTime
      };
      
      // Формируем результат
      const result: AssetSelectionResult = {
        success: true,
        selected_assets: {
          hero_assets: heroAssets,
          content_assets: contentAssets,
          footer_assets: footerAssets
        },
        distribution_achieved: distributionAchieved,
        search_metadata: searchMetadata,
        reasoning: `Выбрано ${distributionAchieved.total_count} ассетов: ${distributionAchieved.figma_count} из Figma и ${distributionAchieved.external_count} внешних. ` +
                  `Hero: ${heroAssets.length}, Content: ${contentAssets.length}, Footer: ${footerAssets.length}. ` +
                  `Время обработки: ${searchMetadata.processing_time_ms}мс.`
      };
      
      console.log('✅ Enhanced Asset Selector: Selection completed successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Enhanced Asset Selector error:', error);
      return createFallbackResult(assetPlan, error, Date.now() - startTime);
    }
  }
});

// ============================================================================
// ASSET SELECTION FUNCTIONS
// ============================================================================

/**
 * Выбор hero ассетов
 */
async function selectHeroAssets(assetManager: AssetManager, plan: AssetPlan): Promise<any[]> {
  const heroReq = plan.asset_requirements.hero_image;
  console.log('🎯 Selecting hero assets with tags:', heroReq.tags);
  
  try {
    // Поиск в Figma
    const figmaResults = await assetManager.searchFigmaAssets(heroReq.tags, {
      limit: 3,
      priority: 'mascot', // Приоритет персонажам для hero
      campaignType: 'promotional'
    });
    
    if (figmaResults.length > 0) {
      return figmaResults.slice(0, 1).map(asset => ({
        asset_id: asset.id || `hero_${Date.now()}`,
        filename: asset.filename || 'hero_image.png',
        url: asset.url || asset.local_path || '',
        source: 'figma' as const,
        tags: heroReq.tags,
        metadata: {
          description: heroReq.description,
          priority: heroReq.priority,
          folder: asset.folder || 'unknown',
          figma_tags: asset.tags || []
        }
      }));
    }
    
    // Fallback на внешние источники
    const externalResults = await assetManager.searchExternalImages(
      plan.external_search_tags.filter(tag => 
        ['hero', 'main', 'primary', 'character', 'mascot'].some(heroTag => 
          tag.toLowerCase().includes(heroTag)
        )
      ).slice(0, 3),
      { limit: 1, type: 'hero' }
    );
    
    return externalResults.map(asset => ({
      asset_id: `hero_ext_${Date.now()}`,
      filename: asset.filename || 'hero_external.jpg',
      url: asset.url || '',
      source: 'external' as const,
      tags: heroReq.tags,
      metadata: {
        description: heroReq.description,
        priority: heroReq.priority,
        external_source: asset.source || 'unsplash'
      }
    }));
    
  } catch (error) {
    console.warn('⚠️ Hero asset selection failed, using fallback:', error);
    return [{
      asset_id: `hero_fallback_${Date.now()}`,
      filename: 'hero_fallback.png',
      url: '/assets/fallback/hero.png',
      source: 'figma' as const,
      tags: ['заяц', 'персонаж'],
      metadata: {
        description: 'Fallback hero image',
        priority: 'high',
        fallback: true
      }
    }];
  }
}

/**
 * Выбор контентных ассетов
 */
async function selectContentAssets(assetManager: AssetManager, plan: AssetPlan): Promise<any[]> {
  const contentReqs = plan.asset_requirements.content_images;
  console.log(`📄 Selecting ${contentReqs.length} content assets`);
  
  const allContentAssets: any[] = [];
  
  for (let i = 0; i < contentReqs.length; i++) {
    const req = contentReqs[i];
    console.log(`📄 Processing content asset ${i + 1}:`, req.tags);
    
    try {
      // Поиск в Figma
      const figmaResults = await assetManager.searchFigmaAssets(req.tags, {
        limit: 2,
        campaignType: 'promotional'
      });
      
      if (figmaResults.length > 0) {
        const asset = figmaResults[0];
        allContentAssets.push({
          asset_id: asset.id || `content_${i}_${Date.now()}`,
          filename: asset.filename || `content_${i + 1}.png`,
          url: asset.url || asset.local_path || '',
          source: 'figma' as const,
          placement: req.placement,
          tags: req.tags,
          metadata: {
            description: req.description,
            folder: asset.folder || 'unknown',
            figma_tags: asset.tags || []
          }
        });
        continue;
      }
      
      // Fallback на внешние источники
      const externalResults = await assetManager.searchExternalImages(
        plan.external_search_tags.slice(0, 3),
        { limit: 1, type: 'content' }
      );
      
      if (externalResults.length > 0) {
        const asset = externalResults[0];
        allContentAssets.push({
          asset_id: `content_ext_${i}_${Date.now()}`,
          filename: asset.filename || `content_external_${i + 1}.jpg`,
          url: asset.url || '',
          source: 'external' as const,
          placement: req.placement,
          tags: req.tags,
          metadata: {
            description: req.description,
            external_source: asset.source || 'unsplash'
          }
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ Content asset ${i + 1} selection failed:`, error);
      // Добавляем fallback ассет
      allContentAssets.push({
        asset_id: `content_fallback_${i}_${Date.now()}`,
        filename: `content_fallback_${i + 1}.png`,
        url: `/assets/fallback/content_${i + 1}.png`,
        source: 'figma' as const,
        placement: req.placement,
        tags: ['путешествия', 'отдых'],
        metadata: {
          description: `Fallback content image ${i + 1}`,
          fallback: true
        }
      });
    }
  }
  
  return allContentAssets;
}

/**
 * Выбор footer ассетов
 */
async function selectFooterAssets(assetManager: AssetManager, plan: AssetPlan): Promise<any[]> {
  const footerReqs = plan.asset_requirements.footer_elements;
  console.log(`🔗 Selecting ${footerReqs.length} footer assets`);
  
  const allFooterAssets: any[] = [];
  
  for (let i = 0; i < footerReqs.length; i++) {
    const req = footerReqs[i];
    console.log(`🔗 Processing footer asset ${i + 1}:`, req.tags);
    
    try {
      // Поиск в Figma (приоритет иконкам и логотипам)
      const figmaResults = await assetManager.searchFigmaAssets(req.tags, {
        limit: 2,
        priority: 'icon',
        campaignType: 'promotional'
      });
      
      if (figmaResults.length > 0) {
        const asset = figmaResults[0];
        allFooterAssets.push({
          asset_id: asset.id || `footer_${i}_${Date.now()}`,
          filename: asset.filename || `footer_${i + 1}.png`,
          url: asset.url || asset.local_path || '',
          source: 'figma' as const,
          type: req.type,
          tags: req.tags,
          metadata: {
            description: req.description,
            folder: asset.folder || 'unknown',
            figma_tags: asset.tags || []
          }
        });
        continue;
      }
      
      // Fallback - используем стандартные иконки
      allFooterAssets.push({
        asset_id: `footer_fallback_${i}_${Date.now()}`,
        filename: `footer_${req.type}_${i + 1}.png`,
        url: `/assets/fallback/footer_${req.type}.png`,
        source: 'figma' as const,
        type: req.type,
        tags: req.tags,
        metadata: {
          description: `Fallback ${req.type} element`,
          fallback: true
        }
      });
      
    } catch (error) {
      console.warn(`⚠️ Footer asset ${i + 1} selection failed:`, error);
    }
  }
  
  return allFooterAssets;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Подсчет достигнутого распределения
 */
function calculateDistribution(heroAssets: any[], contentAssets: any[], footerAssets: any[]): {
  figma_count: number;
  external_count: number;
  total_count: number;
} {
  const allAssets = [...heroAssets, ...contentAssets, ...footerAssets];
  
  const figmaCount = allAssets.filter(asset => asset.source === 'figma').length;
  const externalCount = allAssets.filter(asset => asset.source === 'external').length;
  
  return {
    figma_count: figmaCount,
    external_count: externalCount,
    total_count: allAssets.length
  };
}

/**
 * Создание fallback результата при ошибке
 */
function createFallbackResult(
  plan: AssetPlan, 
  error: any, 
  processingTime: number
): AssetSelectionResult {
  console.warn('🔄 Creating fallback asset selection result due to error:', error);
  
  return {
    success: false,
    selected_assets: {
      hero_assets: [{
        asset_id: `hero_fallback_${Date.now()}`,
        filename: 'hero_fallback.png',
        url: '/assets/fallback/hero.png',
        source: 'figma',
        tags: ['заяц', 'персонаж'],
        metadata: { fallback: true, error: true }
      }],
      content_assets: [{
        asset_id: `content_fallback_${Date.now()}`,
        filename: 'content_fallback.png',
        url: '/assets/fallback/content.png',
        source: 'figma',
        placement: 'main_content',
        tags: ['путешествия', 'отдых'],
        metadata: { fallback: true, error: true }
      }],
      footer_assets: [{
        asset_id: `footer_fallback_${Date.now()}`,
        filename: 'footer_fallback.png',
        url: '/assets/fallback/footer.png',
        source: 'figma',
        type: 'icon',
        tags: ['иконка'],
        metadata: { fallback: true, error: true }
      }]
    },
    distribution_achieved: {
      figma_count: 3,
      external_count: 0,
      total_count: 3
    },
    search_metadata: {
      figma_search_results: 0,
      external_search_results: 0,
      selection_strategy: 'fallback_error_recovery',
      processing_time_ms: processingTime
    },
    reasoning: `Fallback результат создан из-за ошибки: ${error instanceof Error ? error.message : 'Unknown error'}. Использованы стандартные ассеты.`
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { enhancedAssetSelectorTool };
export type { AssetPlan, AssetSelectionResult };

// Для обратной совместимости
export const executeEnhancedAssetSelector = enhancedAssetSelectorTool.execute;
export default enhancedAssetSelectorTool; 