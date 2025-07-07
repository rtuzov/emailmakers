/**
 * 🎨 ENHANCED ASSET SELECTOR
 * 
 * Улучшенный селектор ассетов для Design Specialist
 * Принимает план ассетов от Content Specialist и выполняет интеллектуальный подбор
 */

import type { AssetTagPlan } from './asset-tag-planner';

// Схема результата выбора ассетов
export interface AssetSelectionResult {
  success: boolean;
  selected_assets: {
    hero_assets: Array<{
      fileName: string;
      filePath: string;
      tags: string[];
      source: 'figma' | 'external';
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    content_assets: Array<{
      fileName: string;
      filePath: string;
      tags: string[];
      source: 'figma' | 'external';
      description: string;
      placement: string;
    }>;
    footer_assets: Array<{
      fileName: string;
      filePath: string;
      tags: string[];
      source: 'figma' | 'external';
      description: string;
      type: 'icon' | 'logo' | 'decoration';
    }>;
  };
  distribution_achieved: {
    figma_count: number;
    external_count: number;
    total_count: number;
  };
  search_metadata: {
    figma_search_performed: boolean;
    external_search_performed: boolean;
    tags_used: string[];
    selection_reasoning: string;
  };
  error?: string;
}

/**
 * Выполняет выбор ассетов на основе плана от Content Specialist
 */
export async function executeAssetSelection(assetPlan: AssetTagPlan): Promise<AssetSelectionResult> {
  try {
    console.log('🎨 Enhanced Asset Selector: Executing asset selection based on plan...', {
      figma_tags_count: assetPlan.figma_search_tags.length,
      external_tags_count: assetPlan.external_search_tags.length,
      total_images_needed: assetPlan.image_distribution.total_images_needed
    });

    // Импортируем необходимые инструменты
    const { AssetManager } = await import('../core/asset-manager');
    
    // Создаем Asset Manager
    const assetManager = new AssetManager();

    // Результат выбора
    const result: AssetSelectionResult = {
      success: true,
      selected_assets: {
        hero_assets: [],
        content_assets: [],
        footer_assets: []
      },
      distribution_achieved: {
        figma_count: 0,
        external_count: 0,
        total_count: 0
      },
      search_metadata: {
        figma_search_performed: false,
        external_search_performed: false,
        tags_used: assetPlan.figma_search_tags,
        selection_reasoning: assetPlan.reasoning
      }
    };

    // 1. Выбираем Hero ассеты
    console.log('🦸‍♂️ Selecting hero assets...');
    const heroAssets = await selectHeroAssets(assetManager, assetPlan);
    result.selected_assets.hero_assets = heroAssets;

    // 2. Выбираем контентные ассеты
    console.log('📄 Selecting content assets...');
    const contentAssets = await selectContentAssets(assetManager, assetPlan);
    result.selected_assets.content_assets = contentAssets;

    // 3. Выбираем footer ассеты
    console.log('🦶 Selecting footer assets...');
    const footerAssets = await selectFooterAssets(assetManager, assetPlan);
    result.selected_assets.footer_assets = footerAssets;

    // Подсчитываем итоговое распределение
    const allAssets = [...heroAssets, ...contentAssets, ...footerAssets];
    result.distribution_achieved = {
      figma_count: allAssets.filter(asset => asset.source === 'figma').length,
      external_count: allAssets.filter(asset => asset.source === 'external').length,
      total_count: allAssets.length
    };

    // Проверяем, достигнуты ли цели плана
    const targetFigma = assetPlan.image_distribution.figma_images_count;
    const targetExternal = assetPlan.image_distribution.external_images_count;
    const targetTotal = assetPlan.image_distribution.total_images_needed;

    if (result.distribution_achieved.total_count < targetTotal) {
      console.warn(`⚠️ Asset selection incomplete: ${result.distribution_achieved.total_count}/${targetTotal} images selected`);
    }

    result.search_metadata.figma_search_performed = result.distribution_achieved.figma_count > 0;
    result.search_metadata.external_search_performed = result.distribution_achieved.external_count > 0;

    console.log('✅ Enhanced Asset Selector: Selection completed', {
      hero_count: result.selected_assets.hero_assets.length,
      content_count: result.selected_assets.content_assets.length,
      footer_count: result.selected_assets.footer_assets.length,
      figma_count: result.distribution_achieved.figma_count,
      external_count: result.distribution_achieved.external_count
    });

    return result;

  } catch (error) {
    console.error('❌ Enhanced Asset Selector error:', error);
    
    return {
      success: false,
      selected_assets: {
        hero_assets: [],
        content_assets: [],
        footer_assets: []
      },
      distribution_achieved: {
        figma_count: 0,
        external_count: 0,
        total_count: 0
      },
      search_metadata: {
        figma_search_performed: false,
        external_search_performed: false,
        tags_used: [],
        selection_reasoning: 'Selection failed due to error'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Выбор Hero ассетов
 */
async function selectHeroAssets(
  assetManager: any, 
  assetPlan: AssetTagPlan
): Promise<AssetSelectionResult['selected_assets']['hero_assets']> {
  const heroReq = assetPlan.asset_requirements.hero_image;
  
  try {
    // Поиск в Figma приоритетен для hero изображений (брендинг)
    const searchResult = await assetManager.searchAssets(heroReq.tags, {
      target_count: 1,
      campaign_type: 'promotional', // Из плана можно извлечь
      image_requirements: {
        figma_images_count: 1,
        internet_images_count: 0,
        total_images_needed: 1
      }
    });

    if (searchResult.success && searchResult.assets.length > 0) {
      const asset = searchResult.assets[0];
      return [{
        fileName: asset.fileName || 'hero-image',
        filePath: asset.filePath || asset.url || '',
        tags: heroReq.tags,
        source: asset.source === 'external' ? 'external' : 'figma',
        description: heroReq.description,
        priority: heroReq.priority
      }];
    }

    // Fallback - создаем placeholder
    return [{
      fileName: 'hero-placeholder.jpg',
      filePath: '/assets/placeholders/hero-placeholder.jpg',
      tags: heroReq.tags,
      source: 'figma',
      description: `${heroReq.description} (placeholder)`,
      priority: heroReq.priority
    }];

  } catch (error) {
    console.warn('⚠️ Hero asset selection failed:', error);
    return [];
  }
}

/**
 * Выбор контентных ассетов
 */
async function selectContentAssets(
  assetManager: any, 
  assetPlan: AssetTagPlan
): Promise<AssetSelectionResult['selected_assets']['content_assets']> {
  const contentReqs = assetPlan.asset_requirements.content_images;
  const results: AssetSelectionResult['selected_assets']['content_assets'] = [];

  for (const [index, contentReq] of contentReqs.entries()) {
    try {
      const searchResult = await assetManager.searchAssets(contentReq.tags, {
        target_count: 1,
        campaign_type: 'promotional',
        image_requirements: {
          figma_images_count: 1,
          internet_images_count: 0,
          total_images_needed: 1
        }
      });

      if (searchResult.success && searchResult.assets.length > 0) {
        const asset = searchResult.assets[0];
        results.push({
          fileName: asset.fileName || `content-image-${index + 1}`,
          filePath: asset.filePath || asset.url || '',
          tags: contentReq.tags,
          source: asset.source === 'external' ? 'external' : 'figma',
          description: contentReq.description,
          placement: contentReq.placement
        });
      } else {
        // Placeholder для контентного изображения
        results.push({
          fileName: `content-placeholder-${index + 1}.jpg`,
          filePath: `/assets/placeholders/content-placeholder-${index + 1}.jpg`,
          tags: contentReq.tags,
          source: 'figma',
          description: `${contentReq.description} (placeholder)`,
          placement: contentReq.placement
        });
      }

    } catch (error) {
      console.warn(`⚠️ Content asset ${index + 1} selection failed:`, error);
    }
  }

  return results;
}

/**
 * Выбор footer ассетов
 */
async function selectFooterAssets(
  assetManager: any, 
  assetPlan: AssetTagPlan
): Promise<AssetSelectionResult['selected_assets']['footer_assets']> {
  const footerReqs = assetPlan.asset_requirements.footer_elements;
  const results: AssetSelectionResult['selected_assets']['footer_assets'] = [];

  for (const [index, footerReq] of footerReqs.entries()) {
    try {
      const searchResult = await assetManager.searchAssets(footerReq.tags, {
        target_count: 1,
        campaign_type: 'promotional',
        image_requirements: {
          figma_images_count: 1,
          internet_images_count: 0,
          total_images_needed: 1
        }
      });

      if (searchResult.success && searchResult.assets.length > 0) {
        const asset = searchResult.assets[0];
        results.push({
          fileName: asset.fileName || `footer-element-${index + 1}`,
          filePath: asset.filePath || asset.url || '',
          tags: footerReq.tags,
          source: asset.source === 'external' ? 'external' : 'figma',
          description: footerReq.description,
          type: footerReq.type
        });
      } else {
        // Placeholder для footer элемента
        results.push({
          fileName: `footer-placeholder-${index + 1}.svg`,
          filePath: `/assets/placeholders/footer-placeholder-${index + 1}.svg`,
          tags: footerReq.tags,
          source: 'figma',
          description: `${footerReq.description} (placeholder)`,
          type: footerReq.type
        });
      }

    } catch (error) {
      console.warn(`⚠️ Footer asset ${index + 1} selection failed:`, error);
    }
  }

  return results;
} 