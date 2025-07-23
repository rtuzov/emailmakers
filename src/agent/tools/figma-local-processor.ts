/**
 * 🔍 FIGMA LOCAL PROCESSOR
 * 
 * Обработчик локальных Figma ассетов для поиска и анализа
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { AITagMapper } from './ai-tag-mapper';

interface LocalFigmaAsset {
  fileName: string;
  filePath: string;
  metadata: {
    allTags: string[];
    description: string;
    folderName: string;
    aiAnalysis?: {
      emotionalTone?: string;
      category?: string;
    };
  };
}

interface LocalFigmaSearchParams {
  tags: string[];
  context: {
    campaign_type: 'promotional' | 'seasonal' | 'informational';
    emotional_tone: 'positive' | 'neutral' | 'urgent' | 'friendly';
    target_count: number;
    diversity_mode?: boolean;
    preferred_emotion?: 'neutral' | 'happy' | 'angry' | 'sad' | 'confused';
    airline?: string;
    use_local_only?: boolean;
  };
}

interface LocalFigmaSearchResult {
  success: boolean;
  data: {
    metadata: Record<string, {
      path: string;
      metadata: LocalFigmaAsset['metadata'];
    }>;
  };
  error?: string;
}

/**
 * Поиск локальных Figma ассетов с AI-маппингом тегов
 */
export async function getLocalFigmaAssets(params: LocalFigmaSearchParams): Promise<LocalFigmaSearchResult> {
  try {
    const basePath = path.resolve(process.cwd(), 'figma-all-pages-1750993353363');
    
    // Проверяем существование базовой папки
    try {
      await fs.access(basePath);
    } catch (error) {
      return {
        success: false,
        error: `Figma assets directory not found: ${basePath}`,
        data: { metadata: {} }
      };
    }

    console.log(`🔍 Figma search: ${params.tags.length} input tags, target: ${params.context.target_count}`);

    // 🤖 AI-POWERED TAG MAPPING
    const aiTagMapper = new AITagMapper();
    const tagMappingResult = await aiTagMapper.mapTags({
      inputTags: params.tags,
      campaignType: params.context.campaign_type,
      emotionalTone: params.context.emotional_tone,
      contentContext: `Target count: ${params.context.target_count}, Diversity: ${params.context.diversity_mode}`
    });

    let searchTags: string[];
    if (tagMappingResult.success && tagMappingResult.mappedTags.length > 0) {
      searchTags = tagMappingResult.mappedTags;
      console.log(`✅ AI Tag Mapping: [${params.tags.join(', ')}] → [${searchTags.join(', ')}]`);
      console.log(`📝 Mapping reasoning: ${tagMappingResult.mappingReasoning}`);
    } else {
      searchTags = params.tags;
      console.log(`⚠️ AI Tag Mapping failed, using original tags: [${searchTags.join(', ')}]`);
    }

    // Получаем список всех PNG файлов
    const assets = await findAllAssetsWithAITags(basePath);
    
    if (assets.length === 0) {
      return {
        success: false,
        error: 'No assets found in Figma directory',
        data: { metadata: {} }
      };
    }

    // Фильтруем ассеты по AI-маппированным тегам
    const filteredAssets = filterAssetsByAITags(assets, searchTags, tagMappingResult.selectedFolders);
    
    // Применяем дополнительные фильтры
    const finalAssets = applyContextFilters(filteredAssets, params.context);
    
    // Ограничиваем количество результатов
    const limitedAssets = finalAssets.slice(0, params.context.target_count);
    
    console.log(`🎯 Found ${limitedAssets.length}/${assets.length} matching assets`);
    
    // Преобразуем в формат результата
    const metadata: Record<string, any> = {};
    limitedAssets.forEach(asset => {
      metadata[asset.fileName] = {
        path: asset.filePath,
        metadata: {
          ...asset.metadata,
          ai_mapping: {
            original_tags: params.tags,
            mapped_tags: searchTags,
            mapping_confidence: tagMappingResult.confidence,
            selected_folders: tagMappingResult.selectedFolders
          }
        }
      };
    });

    return {
      success: true,
      data: { metadata }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: { metadata: {} }
    };
  }
}

/**
 * Поиск всех ассетов в папке с AI-тегами
 */
async function findAllAssetsWithAITags(basePath: string): Promise<LocalFigmaAsset[]> {
  const assets: LocalFigmaAsset[] = [];
  
  try {
    const folders = await fs.readdir(basePath, { withFileTypes: true });
    
    for (const folder of folders) {
      if (folder.isDirectory() && !folder.name.endsWith('.json')) {
        const folderPath = path.join(basePath, folder.name);
        const folderAssets = await findAssetsInFolderWithAITags(folderPath, folder.name);
        assets.push(...folderAssets);
      }
    }
  } catch (error) {
    console.warn('Error reading figma assets directory:', error);
  }
  
  return assets;
}

/**
 * Legacy function for backward compatibility
 */
// async function _findAllAssets(_basePath: string): Promise<LocalFigmaAsset[]> {
//   return findAllAssetsWithAITags(_basePath);
// }

/**
 * Поиск ассетов в конкретной папке с AI-тегами
 */
async function findAssetsInFolderWithAITags(folderPath: string, folderName: string): Promise<LocalFigmaAsset[]> {
  const assets: LocalFigmaAsset[] = [];
  
  try {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.png')) {
        const asset = await createAssetFromFileWithAITags(file.name, folderPath, folderName);
        assets.push(asset);
      }
    }
  } catch (error) {
    console.warn(`Error reading folder ${folderName}:`, error);
  }
  
  return assets;
}



/**
 * Создание объекта ассета из файла с AI-тегами
 */
async function createAssetFromFileWithAITags(fileName: string, folderPath: string, folderName: string): Promise<LocalFigmaAsset> {
  const filePath = path.join(folderPath, fileName);
  const tags = await extractTagsFromAIOptimizedData(fileName, folderName);
  
  return {
    fileName,
    filePath,
    metadata: {
      allTags: tags,
      description: generateDescription(fileName, folderName),
      folderName,
      aiAnalysis: {
        emotionalTone: determineEmotionalTone(fileName, folderName),
        category: determineCategoryFromFolder(folderName)
      }
    }
  };
}



/**
 * Извлечение тегов из AI-оптимизированных данных через агента
 */
async function extractTagsFromAIOptimizedData(fileName: string, folderName: string): Promise<string[]> {
  const aiTagMapper = new AITagMapper();
  
  // Create input tags from filename and folder
  const inputTags = [fileName.toLowerCase(), folderName];
  
  // Map tags using AI agent
  const mappingResult = await aiTagMapper.mapTags({
    inputTags,
    campaignType: 'promotional',
    emotionalTone: 'friendly',
    contentContext: `Figma asset: ${fileName} from folder ${folderName}`
  });
  
  if (!mappingResult.success) {
    throw new Error(`AI Tag Mapping failed: ${mappingResult.error}`);
  }
  
  return mappingResult.mappedTags;
}



/**
 * Генерация описания ассета
 */
function generateDescription(fileName: string, folderName: string): string {
  const category = determineCategoryFromFolder(folderName);
  const emotion = determineEmotionalTone(fileName, folderName);
  
  return `${category} из папки ${folderName}${emotion ? ` с эмоцией ${emotion}` : ''}`;
}

/**
 * Определение эмоционального тона
 */
function determineEmotionalTone(fileName: string, _folderName: string): string {
  const fileNameLower = fileName.toLowerCase();
  
  if (fileNameLower.includes('счастлив') || fileNameLower.includes('радост')) return 'happy';
  if (fileNameLower.includes('грустн') || fileNameLower.includes('печаль')) return 'sad';
  if (fileNameLower.includes('сердит') || fileNameLower.includes('злой')) return 'angry';
  if (fileNameLower.includes('удивлен') || fileNameLower.includes('смущен')) return 'confused';
  
  return 'neutral';
}

/**
 * Определение категории по папке
 */
function determineCategoryFromFolder(folderName: string): string {
  if (folderName.includes('зайц')) return 'character';
  if (folderName.includes('иллюстрации')) return 'illustration';
  if (folderName.includes('логотипы')) return 'logo';
  if (folderName.includes('иконки')) return 'icon';
  if (folderName.includes('айдентика')) return 'brand';
  
  return 'image';
}

/**
 * AI-powered фильтрация ассетов по тегам с приоритетом папок
 */
function filterAssetsByAITags(assets: LocalFigmaAsset[], searchTags: string[], priorityFolders: string[]): LocalFigmaAsset[] {
  if (!searchTags || searchTags.length === 0) {
    return assets;
  }
  
  console.log(`🔍 Filtering ${assets.length} assets by AI tags: [${searchTags.join(', ')}]`);
  console.log(`📂 Priority folders: [${priorityFolders.join(', ')}]`);
  
  // Score and filter assets
  const scoredAssets = assets.map(asset => {
    const score = calculateAssetRelevanceScore(asset, searchTags, priorityFolders);
    return { asset, score };
  }).filter(item => item.score > 0);
  
  // Sort by score (highest first)
  scoredAssets.sort((a, b) => b.score - a.score);
  
  const filteredAssets = scoredAssets.map(item => item.asset);
  
  console.log(`✅ Filtered to ${filteredAssets.length} relevant assets`);
  
  return filteredAssets;
}

/**
 * Calculate relevance score for an asset
 */
function calculateAssetRelevanceScore(asset: LocalFigmaAsset, searchTags: string[], priorityFolders: string[]): number {
  let score = 0;
  const assetTags = asset.metadata.allTags.map(tag => tag.toLowerCase());
  const folderName = asset.metadata.folderName;
  
  // Exact tag matches (high score)
  for (const searchTag of searchTags) {
    const searchTagLower = searchTag.toLowerCase();
    
    if (assetTags.includes(searchTagLower)) {
      score += 10; // Exact match
    } else {
      // Partial matches
      for (const assetTag of assetTags) {
        if (assetTag.includes(searchTagLower) || searchTagLower.includes(assetTag)) {
          score += 5; // Partial match
        }
      }
    }
  }
  
  // Priority folder bonus
  if (priorityFolders.includes(folderName)) {
    const folderIndex = priorityFolders.indexOf(folderName);
    score += (priorityFolders.length - folderIndex) * 2; // Higher bonus for higher priority folders
  }
  
  // Brand mascot bonus (always prefer rabbit/mascot assets)
  if (assetTags.some(tag => ['заяц', 'кролик'].includes(tag))) {
    score += 3;
  }
  
  return score;
}

/**
 * Legacy фильтрация ассетов по тегам
 */


/**
 * Применение контекстных фильтров
 */
function applyContextFilters(assets: LocalFigmaAsset[], context: LocalFigmaSearchParams['context']): LocalFigmaAsset[] {
  let filtered = [...assets];
  
  // Фильтр по предпочитаемой эмоции
  if (context?.preferred_emotion) {
    const emotionFiltered = filtered.filter(asset => 
      asset.metadata.aiAnalysis?.emotionalTone === context.preferred_emotion
    );
    if (emotionFiltered.length > 0) {
      filtered = emotionFiltered;
    }
  }
  
  // Фильтр по авиакомпании
  if (context?.airline) {
    const airlineFiltered = filtered.filter(asset => 
      asset.metadata.description.toLowerCase().includes(context.airline?.toLowerCase() || '') ||
      asset.fileName.toLowerCase().includes(context.airline?.toLowerCase() || '')
    );
    if (airlineFiltered.length > 0) {
      filtered = airlineFiltered;
    }
  }
  
  return filtered;
} 