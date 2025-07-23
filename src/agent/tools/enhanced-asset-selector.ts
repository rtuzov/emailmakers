/**
 * 🎨 ENHANCED ASSET SELECTOR - OpenAI Agents SDK Compatible
 * 
 * Выбирает и обрабатывает изображения для email шаблонов на основе плана от Content Specialist.
 * Использует интеллектуальный поиск в Figma и внешних источниках.
 * 
 * АРХИТЕКТУРА:
 * ├── Обработка плана ассетов от Content Specialist
 * ├── Интеллектуальный поиск в Figma по тегам
 * ├── Try external image sources if Figma assets not found
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
    hero_assets: z.array(z.any()).describe('Выбранные hero ассеты'),
    content_assets: z.array(z.any()).describe('Выбранные контентные ассеты'),
    footer_assets: z.array(z.any()).describe('Выбранные footer ассеты')
  }).describe('Выбранные ассеты'),
  distribution_achieved: z.object({
    figma_count: z.number().describe('Количество ассетов из Figma'),
    external_count: z.number().describe('Количество внешних ассетов'),
    total_count: z.number().describe('Общее количество ассетов')
  }).describe('Достигнутое распределение'),
  search_metadata: z.object({
    figma_search_results: z.number().describe('Результаты поиска в Figma'),
    external_search_results: z.number().describe('Результаты внешнего поиска'),
    selection_strategy: z.string().describe('Стратегия выбора'),
    processing_time_ms: z.number().describe('Время обработки в миллисекундах')
  }).describe('Метаданные поиска'),
  reasoning: z.string().describe('Обоснование выбора ассетов')
});

// Типы будут экспортированы в конце файла

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
      throw new Error(`Enhanced Asset Selector failed: ${error instanceof Error ? error.message : String(error)}`);
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
    const figmaSearchResult = await assetManager.searchAssets({
      tags: heroReq.tags,
      emotional_tone: 'positive',
      campaign_type: 'promotional',
      target_count: 3,
      preferred_emotion: 'happy'
    });
    
    if (figmaSearchResult.success && figmaSearchResult.assets.length > 0) {
      return figmaSearchResult.assets.slice(0, 1).map(asset => ({
        asset_id: `hero_${Date.now()}`,
        filename: (asset || {}).fileName || 'hero_image.png',
        url: (asset || {}).filePath || '',
        source: 'figma' as const,
        tags: heroReq.tags,
        metadata: {
          description: heroReq.description,
          priority: heroReq.priority,
          folder: 'unknown',
          figma_tags: (asset || {}).tags || []
        }
      }));
    }
    
    // Try external sources if no Figma assets found
    const externalSearchResult = await assetManager.searchAssets({
      tags: plan.external_search_tags.filter(tag => 
        ['hero', 'main', 'primary', 'character', 'mascot'].some(heroTag => 
          tag.toLowerCase().includes(heroTag)
        )
      ).slice(0, 3),
      emotional_tone: 'positive',
      campaign_type: 'promotional',
      target_count: 1,
      preferred_emotion: 'happy'
    });
    
    if (externalSearchResult.success && externalSearchResult.assets.length > 0) {
      return externalSearchResult.assets.map(asset => ({
        asset_id: `hero_ext_${Date.now()}`,
        filename: (asset || {}).fileName || 'hero_external.jpg',
        url: (asset || {}).filePath || '',
        source: 'external' as const,
        tags: heroReq.tags,
        metadata: {
          description: heroReq.description,
          priority: heroReq.priority,
          external_source: (asset || {}).source || 'internet'
        }
      }));
    }
    
    // Если ничего не найдено, возвращаем пустой массив
    return [];
    
  } catch (error) {
    console.error('❌ Hero asset selection failed:', error);
    
    // Fail fast - no fallback allowed
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Hero asset selection failed: ${error instanceof Error ? error.message : String(error)}`);
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
    console.log(`📄 Processing content asset ${i + 1}:`, (req || {}).tags);
    
    try {
      // Поиск в Figma
      const figmaSearchResult = await assetManager.searchAssets({
        tags: (req || {}).tags || [],
        emotional_tone: 'positive',
        campaign_type: 'promotional',
        target_count: 2,
        preferred_emotion: 'happy'
      });
      
      if (figmaSearchResult.success && figmaSearchResult.assets.length > 0) {
        const asset = figmaSearchResult.assets[0];
        allContentAssets.push({
          asset_id: `content_${i}_${Date.now()}`,
          filename: (asset || {}).fileName || `content_${i + 1}.png`,
          url: (asset || {}).filePath || '',
          source: 'figma' as const,
          placement: (req || {}).placement,
          tags: (req || {}).tags || [],
          metadata: {
            description: (req || {}).description,
            folder: 'unknown',
            figma_tags: (asset || {}).tags || []
          }
        });
        continue;
      }
      
      // Try external sources if no Figma assets found
      const externalSearchResult = await assetManager.searchAssets({
        tags: plan.external_search_tags.slice(0, 3),
        emotional_tone: 'positive',
        campaign_type: 'promotional',
        target_count: 1,
        preferred_emotion: 'happy'
      });
      
      if (externalSearchResult.success && externalSearchResult.assets.length > 0) {
        const asset = externalSearchResult.assets[0];
        allContentAssets.push({
          asset_id: `content_ext_${i}_${Date.now()}`,
          filename: (asset || {}).fileName || `content_external_${i + 1}.jpg`,
          url: (asset || {}).filePath || '',
          source: 'external' as const,
          placement: (req || {}).placement,
          tags: (req || {}).tags || [],
          metadata: {
            description: (req || {}).description,
            external_source: (asset || {}).source || 'internet'
          }
        });
      }
      
    } catch (error) {
      console.error(`❌ Content asset ${i + 1} selection failed:`, error);
      
      // Fail fast - no fallback allowed
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Content asset selection failed for asset ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
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
    console.log(`🔗 Processing footer asset ${i + 1}:`, (req || {}).tags);
    
    try {
      // Поиск в Figma (приоритет иконкам и логотипам)
      const figmaSearchResult = await assetManager.searchAssets({
        tags: (req || {}).tags || [],
        emotional_tone: 'positive',
        campaign_type: 'promotional',
        target_count: 2,
        preferred_emotion: 'happy'
      });
      
      if (figmaSearchResult.success && figmaSearchResult.assets.length > 0) {
        const asset = figmaSearchResult.assets[0];
        allFooterAssets.push({
          asset_id: `footer_${i}_${Date.now()}`,
          filename: (asset || {}).fileName || `footer_${i + 1}.png`,
          url: (asset || {}).filePath || '',
          source: 'figma' as const,
          type: (req || {}).type,
          tags: (req || {}).tags || [],
          metadata: {
            description: (req || {}).description,
            folder: 'unknown',
            figma_tags: (asset || {}).tags || []
          }
        });
        continue;
      }
      
      // If no assets found, fail fast
      throw new Error(`No footer assets found for ${(req || {}).type || 'unknown'} with tags: ${((req || {}).tags || []).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Footer asset ${i + 1} selection failed:`, error);
      
      // Fail fast - no fallback allowed
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Footer asset selection failed for asset ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
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
  
  const figmaCount = allAssets.filter(asset => (asset || {}).source === 'figma').length;
  const externalCount = allAssets.filter(asset => (asset || {}).source === 'external').length;
  
  return {
    figma_count: figmaCount,
    external_count: externalCount,
    total_count: allAssets.length
  };
}

// No fallback results - all errors must be handled properly by throwing

// ============================================================================
// EXPORTS
// ============================================================================

// enhancedAssetSelectorTool уже экспортирован на строке 111 как export const
export type AssetPlan = z.infer<typeof AssetPlanSchema>;
export type AssetSelectionResult = z.infer<typeof AssetSelectionResultSchema>;

// Для обратной совместимости - прямая функция-обертка
export const executeEnhancedAssetSelector = async (assetPlan: AssetPlan): Promise<AssetSelectionResult> => {
  // Копируем логику execute из tool definition
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
    
    // Fail fast - no fallback allowed
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Enhanced asset selector failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
export default enhancedAssetSelectorTool; 