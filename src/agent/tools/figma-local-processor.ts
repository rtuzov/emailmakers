/**
 * 🔍 FIGMA LOCAL PROCESSOR
 * 
 * Обработчик локальных Figma ассетов для поиска и анализа
 */

import * as fs from 'fs/promises';
import * as path from 'path';

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
 * Поиск локальных Figma ассетов
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

    // Получаем список всех PNG файлов
    const assets = await findAllAssets(basePath);
    
    if (assets.length === 0) {
      return {
        success: false,
        error: 'No assets found in Figma directory',
        data: { metadata: {} }
      };
    }

    // Фильтруем ассеты по тегам
    const filteredAssets = filterAssetsByTags(assets, params.tags);
    
    // Применяем дополнительные фильтры
    const finalAssets = applyContextFilters(filteredAssets, params.context);
    
    // Ограничиваем количество результатов
    const limitedAssets = finalAssets.slice(0, params.context.target_count);
    
    // Преобразуем в формат результата
    const metadata: Record<string, any> = {};
    limitedAssets.forEach(asset => {
      metadata[asset.fileName] = {
        path: asset.filePath,
        metadata: asset.metadata
      };
    });

    return {
      success: true,
      data: { metadata }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during asset search',
      data: { metadata: {} }
    };
  }
}

/**
 * Поиск всех ассетов в папке
 */
async function findAllAssets(basePath: string): Promise<LocalFigmaAsset[]> {
  const assets: LocalFigmaAsset[] = [];
  
  try {
    const folders = await fs.readdir(basePath, { withFileTypes: true });
    
    for (const folder of folders) {
      if (folder.isDirectory()) {
        const folderPath = path.join(basePath, folder.name);
        const folderAssets = await findAssetsInFolder(folderPath, folder.name);
        assets.push(...folderAssets);
      }
    }
  } catch (error) {
    console.warn('Error reading figma assets directory:', error);
  }
  
  return assets;
}

/**
 * Поиск ассетов в конкретной папке
 */
async function findAssetsInFolder(folderPath: string, folderName: string): Promise<LocalFigmaAsset[]> {
  const assets: LocalFigmaAsset[] = [];
  
  try {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.png')) {
        const asset = createAssetFromFile(file.name, folderPath, folderName);
        assets.push(asset);
      }
    }
  } catch (error) {
    console.warn(`Error reading folder ${folderName}:`, error);
  }
  
  return assets;
}

/**
 * Создание объекта ассета из файла
 */
function createAssetFromFile(fileName: string, folderPath: string, folderName: string): LocalFigmaAsset {
  const filePath = path.join(folderPath, fileName);
  const tags = extractTagsFromFileName(fileName, folderName);
  
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
 * Извлечение тегов из имени файла
 */
function extractTagsFromFileName(fileName: string, folderName: string): string[] {
  const tags: string[] = [];
  
  // Добавляем теги из названия папки
  if (folderName.includes('зайц')) tags.push('заяц', 'кролик');
  if (folderName.includes('новости')) tags.push('новости', 'путешествия');
  if (folderName.includes('иллюстрации')) tags.push('иллюстрация', 'картинка');
  if (folderName.includes('логотипы')) tags.push('логотип', 'лого');
  if (folderName.includes('иконки')) tags.push('иконка', 'значок');
  if (folderName.includes('айдентика')) tags.push('бренд', 'айдентика');
  
  // Добавляем теги из имени файла
  const fileNameLower = fileName.toLowerCase();
  if (fileNameLower.includes('счастлив') || fileNameLower.includes('радост')) tags.push('счастливый', 'радостный');
  if (fileNameLower.includes('грустн') || fileNameLower.includes('печаль')) tags.push('грустный', 'печальный');
  if (fileNameLower.includes('сердит') || fileNameLower.includes('злой')) tags.push('сердитый', 'злой');
  if (fileNameLower.includes('путешеств')) tags.push('путешествие', 'поездка');
  if (fileNameLower.includes('самолет') || fileNameLower.includes('авиа')) tags.push('самолет', 'авиация');
  if (fileNameLower.includes('билет')) tags.push('билет', 'бронирование');
  
  // Общие теги
  tags.push('купибилет', 'авиакомпания');
  
  return [...new Set(tags)]; // Убираем дубликаты
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
function determineEmotionalTone(fileName: string, folderName: string): string {
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
 * Фильтрация ассетов по тегам
 */
function filterAssetsByTags(assets: LocalFigmaAsset[], searchTags: string[]): LocalFigmaAsset[] {
  if (!searchTags || searchTags.length === 0) {
    return assets;
  }
  
  return assets.filter(asset => {
    const assetTags = asset.metadata.allTags.map(tag => tag.toLowerCase());
    return searchTags.some(searchTag => 
      assetTags.some(assetTag => 
        assetTag.includes(searchTag.toLowerCase()) || 
        searchTag.toLowerCase().includes(assetTag)
      )
    );
  });
}

/**
 * Применение контекстных фильтров
 */
function applyContextFilters(assets: LocalFigmaAsset[], context: LocalFigmaSearchParams['context']): LocalFigmaAsset[] {
  let filtered = [...assets];
  
  // Фильтр по предпочитаемой эмоции
  if (context.preferred_emotion) {
    const emotionFiltered = filtered.filter(asset => 
      asset.metadata.aiAnalysis?.emotionalTone === context.preferred_emotion
    );
    if (emotionFiltered.length > 0) {
      filtered = emotionFiltered;
    }
  }
  
  // Фильтр по авиакомпании
  if (context.airline) {
    const airlineFiltered = filtered.filter(asset => 
      asset.metadata.description.toLowerCase().includes(context.airline.toLowerCase()) ||
      asset.fileName.toLowerCase().includes(context.airline.toLowerCase())
    );
    if (airlineFiltered.length > 0) {
      filtered = airlineFiltered;
    }
  }
  
  return filtered;
} 