import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolResult, AssetInfo, handleToolError } from './index';

/**
 * Интерфейс для локального поиска Figma ассетов
 */
interface LocalFigmaAssetParams {
  tags: string[];
  context?: {
    campaign_type?: 'seasonal' | 'promotional' | 'informational';
    emotional_tone?: 'positive' | 'neutral' | 'urgent' | 'friendly';
    target_count?: number;
    diversity_mode?: boolean;
    preferred_emotion?: 'happy' | 'angry' | 'neutral' | 'sad' | 'confused';
    airline?: string;
    use_local_only?: boolean;
  };
}

/**
 * Структура данных из agent-file-mapping.json
 */
interface AgentFileMapping {
  version: string;
  updatedAt: string;
  totalFiles: number;
  fileMapping: Record<string, {
    allTags: string[];
    description: string;
    tone: string;
    confidence: number;
  }>;
}

/**
 * Структура данных из tag-dictionary.json
 */
interface TagDictionary {
  version: string;
  createdAt: string;
  updatedAt: string;
  totalFiles: number;
  totalTags: number;
  uniqueTags: string[];
  entries: Record<string, {
    originalName: string;
    shortName: string;
    allTags: string[];
    selectedTags: string[];
    aiAnalysis: {
      contentDescription: string;
      emotionalTone: string;
      usageContext: string[];
      confidence: number;
      reasoning: string;
    };
    metadata: {
      figmaNodeId: string;
      componentType: string;
      hasVariants: boolean;
      createdAt: string;
    };
    imageMetadata: {
      technical: {
        width: number;
        height: number;
        format: string;
        fileSize: number;
        fileSizeFormatted: string;
        aspectRatio: string;
        orientation: string;
      };
      analysis: {
        dimensions: Record<string, boolean>;
        quality: Record<string, any>;
        file: Record<string, any>;
      };
    };
  }>;
}

/**
 * Конфигурация папок локальных Figma файлов
 */
const LOCAL_FIGMA_FOLDERS = {
  'зайцы-общие': {
    name: 'Зайцы общие',
    description: 'Общие изображения зайцев для различных кампаний',
    priority: 10,
    categories: ['rabbit', 'general', 'mascot']
  },
  'зайцы-эмоции': {
    name: 'Зайцы эмоции',
    description: 'Эмоциональные состояния зайцев',
    priority: 9,
    categories: ['rabbit', 'emotions', 'expressions'],
    emotions: ['happy', 'angry', 'sad', 'confused', 'neutral']
  },
  'зайцы-подборка': {
    name: 'Зайцы подборка',
    description: 'Зайцы для newsletter и подборок',
    priority: 8,
    categories: ['rabbit', 'newsletter', 'collection']
  },
  'зайцы-новости': {
    name: 'Зайцы новости',
    description: 'Зайцы для новостных рассылок',
    priority: 7,
    categories: ['rabbit', 'news', 'announcements']
  },
  'логотипы-ак': {
    name: 'Логотипы авиакомпаний',
    description: 'Логотипы и символика авиакомпаний',
    priority: 6,
    categories: ['airline', 'logo', 'brand'],
    airlines: ['аэрофлот', 'turkish', 'emirates', 'utair', 'nordwind']
  },
  'иллюстрации': {
    name: 'Иллюстрации',
    description: 'Общие иллюстрации для email кампаний',
    priority: 5,
    categories: ['illustration', 'general', 'travel']
  },
  'иконки-допуслуг': {
    name: 'Иконки дополнительных услуг',
    description: 'Иконки для дополнительных авиа услуг',
    priority: 4,
    categories: ['icon', 'service', 'additional']
  },
  'айдентика': {
    name: 'Айдентика',
    description: 'Элементы фирменного стиля',
    priority: 3,
    categories: ['brand', 'identity', 'style']
  },
  'зайцы-прочее': {
    name: 'Зайцы прочее',
    description: 'Прочие изображения зайцев',
    priority: 2,
    categories: ['rabbit', 'misc']
  },
  'цвета': {
    name: 'Цвета',
    description: 'Цветовая палитра и дизайн-токены',
    priority: 1,
    categories: ['color', 'design-tokens', 'palette']
  }
};

/**
 * Маппинг эмоциональных состояний на папки и теги
 */
const EMOTION_MAPPING = {
  happy: {
    folders: ['зайцы-эмоции', 'зайцы-общие'],
    tags: ['счастье', 'счастлив', 'радость', 'веселье', 'позитив', 'лето', 'отдых'],
    keywords: ['счастье', 'радость', 'веселье', 'акция', 'лето']
  },
  angry: {
    folders: ['зайцы-эмоции'],
    tags: ['гнев', 'недовольство', 'раздражение', 'разозлен'],
    keywords: ['гнев', 'недовольство', 'эмоции', 'раздражение']
  },
  sad: {
    folders: ['зайцы-эмоции'],
    tags: ['грусть', 'грустный', 'забота', 'помощь'],
    keywords: ['грусть', 'грустный', 'персонаж', 'забота']
  },
  confused: {
    folders: ['зайцы-эмоции', 'зайцы-общие'],
    tags: ['озадаченность', 'вопросы', 'размышления', 'задумчивость'],
    keywords: ['озадаченность', 'вопросы', 'размышления', 'забавный']
  },
  neutral: {
    folders: ['зайцы-общие', 'зайцы-эмоции'],
    tags: ['нейтрален', 'кролик', 'персонаж', 'дружелюбный'],
    keywords: ['кролик', 'персонаж', 'дружелюбный', 'нейтральный']
  }
};

/**
 * Маппинг типов кампаний на подходящие папки
 */
const CAMPAIGN_TYPE_MAPPING = {
  promotional: {
    folders: ['зайцы-эмоции', 'зайцы-общие', 'логотипы-ак'],
    preferredEmotion: 'happy',
    tags: ['акция', 'скидки', 'предложение', 'путешествие']
  },
  informational: {
    folders: ['зайцы-новости', 'зайцы-общие', 'иллюстрации'],
    preferredEmotion: 'neutral',
    tags: ['новости', 'информация', 'путешествие']
  },
  seasonal: {
    folders: ['зайцы-подборка', 'зайцы-общие', 'иллюстрации'],
    preferredEmotion: 'happy',
    tags: ['подборка', 'сезон', 'лето', 'зима', 'отдых']
  }
};

/**
 * Основная функция для поиска локальных Figma ассетов
 */
export async function getLocalFigmaAssets(params: LocalFigmaAssetParams): Promise<ToolResult> {
  try {
    console.log('🎯 Поиск локальных Figma ассетов:', params);

    // Валидация параметров
    if (!params.tags || params.tags.length === 0) {
      throw new Error('Tags array is required and cannot be empty');
    }

    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    
    // Проверяем существование базовой папки
    try {
      await fs.access(basePath);
    } catch {
      throw new Error('Local Figma assets directory not found');
    }

    // Определяем стратегию поиска на основе контекста
    const searchStrategy = determineSearchStrategy(params);
    console.log('📋 Стратегия поиска:', searchStrategy);

    // Выполняем поиск по приоритетным папкам
    const searchResults = await searchInPriorityFolders(basePath, searchStrategy);
    
    if (searchResults.length === 0) {
      console.log('⚠️ Не найдено подходящих ассетов, выполняем широкий поиск...');
      const fallbackResults = await performFallbackSearch(basePath, params.tags);
      
      if (fallbackResults.length === 0) {
        throw new Error('No matching assets found in local Figma directory');
      }
      
      return formatResults(fallbackResults, 'fallback-search');
    }

    return formatResults(searchResults, searchStrategy.name);

  } catch (error) {
    return handleToolError('get_local_figma_assets', error);
  }
}

/**
 * Определение стратегии поиска на основе контекста
 */
function determineSearchStrategy(params: LocalFigmaAssetParams) {
  const { tags, context } = params;
  
  let strategy = {
    name: 'general-search',
    priorityFolders: Object.keys(LOCAL_FIGMA_FOLDERS),
    searchTags: [...tags],
    targetCount: context?.target_count || 2,
    diversityMode: context?.diversity_mode || false
  };

  // Умная стратегия - комбинируем критерии вместо перезаписи
  let priorityFolders: string[] = [];
  let additionalTags: string[] = [];

  // Стратегия на основе типа кампании
  if (context?.campaign_type && CAMPAIGN_TYPE_MAPPING[context.campaign_type]) {
    const campaignMapping = CAMPAIGN_TYPE_MAPPING[context.campaign_type];
    priorityFolders.push(...campaignMapping.folders);
    additionalTags.push(...campaignMapping.tags);
    
    // Добавляем предпочтительную эмоцию
    if (campaignMapping.preferredEmotion && !context.preferred_emotion) {
      context.preferred_emotion = campaignMapping.preferredEmotion as any;
    }
  }

  // Стратегия на основе эмоционального тона
  if (context?.preferred_emotion && EMOTION_MAPPING[context.preferred_emotion]) {
    const emotionMapping = EMOTION_MAPPING[context.preferred_emotion];
    priorityFolders.push(...emotionMapping.folders);
    additionalTags.push(...emotionMapping.tags);
  }

  // Стратегия для авиакомпаний - ДОБАВЛЯЕМ к существующим папкам, а не заменяем
  if (context?.airline) {
    priorityFolders.push('логотипы-ак');
    additionalTags.push(context.airline, 'авиаперевозки', 'путешествие');
    
    // Обновляем название стратегии для отражения комбинированного поиска
    const emotionPart = context.preferred_emotion ? `-${context.preferred_emotion}` : '';
    const campaignPart = context.campaign_type ? `-${context.campaign_type}` : '';
    strategy.name = `combined-airline-${context.airline}${emotionPart}${campaignPart}`;
  }

  // Если определены приоритетные папки, используем их
  if (priorityFolders.length > 0) {
    // Убираем дубликаты и сортируем по приоритету
    const uniqueFolders = Array.from(new Set(priorityFolders));
    strategy.priorityFolders = uniqueFolders.sort((a, b) => {
      const priorityA = LOCAL_FIGMA_FOLDERS[a]?.priority || 0;
      const priorityB = LOCAL_FIGMA_FOLDERS[b]?.priority || 0;
      return priorityB - priorityA; // Высокий приоритет первым
    });
  }

  // Объединяем все теги
  strategy.searchTags = Array.from(new Set([...tags, ...additionalTags]));

  // Для комбинированного поиска всегда включаем режим разнообразия
  if (context?.airline && context?.preferred_emotion) {
    strategy.diversityMode = true;
  }

  return strategy;
}

/**
 * Поиск в приоритетных папках
 */
async function searchInPriorityFolders(basePath: string, strategy: any): Promise<any[]> {
  const results: any[] = [];
  const folderResults: Record<string, any[]> = {};

  console.log(`🔍 Поиск в ${strategy.priorityFolders.length} приоритетных папках: ${strategy.priorityFolders.join(', ')}`);

  // Ищем во ВСЕХ приоритетных папках для получения максимального покрытия
  for (const folderName of strategy.priorityFolders) {
    const folderPath = path.join(basePath, folderName);
    
    try {
      await fs.access(folderPath);
      console.log(`🔍 Поиск в папке: ${folderName}`);
      
      const currentFolderResults = await searchInFolder(folderPath, folderName, strategy.searchTags);
      folderResults[folderName] = currentFolderResults;
      results.push(...currentFolderResults);
      
      console.log(`📊 Папка ${folderName}: найдено ${currentFolderResults.length} результатов`);
      
    } catch (error) {
      console.log(`⚠️ Папка ${folderName} недоступна: ${error.message}`);
      continue;
    }
  }

  console.log(`📊 Общий результат поиска: ${results.length} файлов из ${Object.keys(folderResults).length} папок`);

  // Если результатов мало, выполняем дополнительный поиск в остальных папках
  if (results.length < strategy.targetCount) {
    console.log(`⚠️ Найдено только ${results.length} из ${strategy.targetCount} требуемых файлов, расширяем поиск...`);
    
    const remainingFolders = Object.keys(LOCAL_FIGMA_FOLDERS).filter(
      folder => !strategy.priorityFolders.includes(folder)
    );
    
    for (const folderName of remainingFolders) {
      const folderPath = path.join(basePath, folderName);
      
      try {
        await fs.access(folderPath);
        console.log(`🔍 Дополнительный поиск в папке: ${folderName}`);
        
        const additionalResults = await searchInFolder(folderPath, folderName, strategy.searchTags);
        results.push(...additionalResults);
        
        if (results.length >= strategy.targetCount * 2) {
          console.log(`✅ Набрано достаточно результатов (${results.length}), прекращаем поиск`);
          break;
        }
        
      } catch (error) {
        continue;
      }
    }
  }

  // Сортируем по релевантности
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  console.log(`📊 Финальная сортировка: топ-5 результатов по релевантности:`);
  results.slice(0, 5).forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.fileName} (${result.folderName}) - Score: ${result.relevanceScore}, Tags: [${result.matchedTags.join(', ')}]`);
  });
  
  if (strategy.diversityMode) {
    const diverseResults = selectDiverseResults(results, strategy.targetCount);
    console.log(`🎯 Режим разнообразия: выбрано ${diverseResults.length} разнообразных результатов`);
    return diverseResults;
  } else {
    const topResults = results.slice(0, strategy.targetCount);
    console.log(`🎯 Обычный режим: выбрано ${topResults.length} лучших результатов`);
    return topResults;
  }
}

/**
 * Поиск в конкретной папке
 */
async function searchInFolder(folderPath: string, folderName: string, searchTags: string[]): Promise<any[]> {
  const results: any[] = [];

  try {
    // Читаем agent-file-mapping.json для быстрого поиска
    const mappingPath = path.join(folderPath, 'agent-file-mapping.json');
    const mappingData: AgentFileMapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

    // Читаем tag-dictionary.json для детальной информации
    const dictionaryPath = path.join(folderPath, 'tag-dictionary.json');
    const dictionaryData: TagDictionary = JSON.parse(await fs.readFile(dictionaryPath, 'utf-8'));

    console.log(`📊 Анализ папки ${folderName}: ${mappingData.totalFiles} файлов`);

    // Поиск по agent-file-mapping
    for (const [fileName, fileInfo] of Object.entries(mappingData.fileMapping)) {
      const relevanceScore = calculateRelevanceScore(fileInfo.allTags, searchTags);
      
      if (relevanceScore > 0) {
        // Получаем дополнительную информацию из tag-dictionary
        const dictionaryEntry = dictionaryData.entries[fileName];
        
        const result = {
          fileName: `${fileName}.png`,
          filePath: path.join(folderPath, `${fileName}.png`),
          folderName,
          relevanceScore,
          matchedTags: fileInfo.allTags.filter(tag => 
            searchTags.some(searchTag => 
              tag.toLowerCase().includes(searchTag.toLowerCase()) ||
              searchTag.toLowerCase().includes(tag.toLowerCase())
            )
          ),
          allTags: fileInfo.allTags,
          description: fileInfo.description,
          tone: fileInfo.tone,
          confidence: fileInfo.confidence,
          metadata: dictionaryEntry ? {
            technical: dictionaryEntry.imageMetadata.technical,
            aiAnalysis: dictionaryEntry.aiAnalysis,
            figmaNodeId: dictionaryEntry.metadata.figmaNodeId
          } : null
        };

        results.push(result);
      }
    }

    console.log(`✅ Найдено ${results.length} релевантных файлов в ${folderName}`);

  } catch (error) {
    console.log(`❌ Ошибка чтения метаданных папки ${folderName}: ${error.message}`);
  }

  return results;
}

/**
 * Расчет релевантности на основе совпадения тегов
 */
function calculateRelevanceScore(fileTags: string[], searchTags: string[]): number {
  let score = 0;
  let matchedTagsCount = 0;
  
  for (const searchTag of searchTags) {
    let bestMatchForThisTag = 0;
    
    for (const fileTag of fileTags) {
      let currentMatch = 0;
      
      // Точное совпадение - максимальный приоритет
      if (fileTag.toLowerCase() === searchTag.toLowerCase()) {
        currentMatch = 15;
      }
      // Частичное совпадение - один тег содержит другой
      else if (fileTag.toLowerCase().includes(searchTag.toLowerCase()) ||
               searchTag.toLowerCase().includes(fileTag.toLowerCase())) {
        currentMatch = 10;
      }
      // Семантическое совпадение
      else if (areTagsRelated(fileTag, searchTag)) {
        currentMatch = 7;
      }
      // Контекстуальное совпадение (новое)
      else if (areTagsContextuallyRelated(fileTag, searchTag)) {
        currentMatch = 5;
      }
      
      bestMatchForThisTag = Math.max(bestMatchForThisTag, currentMatch);
    }
    
    if (bestMatchForThisTag > 0) {
      score += bestMatchForThisTag;
      matchedTagsCount++;
    }
  }
  
  // Бонус за количество совпавших тегов
  const coverageBonus = (matchedTagsCount / searchTags.length) * 10;
  
  return score + coverageBonus;
}

/**
 * Проверка семантической связи между тегами
 */
function areTagsRelated(tag1: string, tag2: string): boolean {
  const synonyms = {
    'заяц': ['кролик', 'rabbit', 'персонаж', 'животные'],
    'счастье': ['радость', 'веселье', 'позитив', 'счастлив', 'веселый'],
    'путешествие': ['поездка', 'отпуск', 'туризм', 'отдых'],
    'авиация': ['авиаперевозки', 'самолет', 'полет', 'airline'],
    'акция': ['скидка', 'предложение', 'промо', 'скидки'],
    'турция': ['turkish', 'турецкий', 'турецкая'],
    'эмоции': ['настроение', 'чувства', 'состояние'],
    'грусть': ['грустный', 'печаль', 'забота'],
    'гнев': ['злость', 'недовольство', 'раздражение', 'разозлен'],
    'помощь': ['поддержка', 'забота', 'сервис']
  };

  const t1 = tag1.toLowerCase();
  const t2 = tag2.toLowerCase();

  for (const [main, syns] of Object.entries(synonyms)) {
    if ((main === t1 && syns.includes(t2)) || 
        (main === t2 && syns.includes(t1)) ||
        (syns.includes(t1) && syns.includes(t2))) {
      return true;
    }
  }

  return false;
}

/**
 * Проверка контекстуальной связи между тегами
 */
function areTagsContextuallyRelated(tag1: string, tag2: string): boolean {
  const contextualGroups = {
    // Авиакомпании и связанные термины
    airlines: ['аэрофлот', 'turkish', 'emirates', 'utair', 'nordwind', 'авиаперевозки', 'авиация', 'путешествие'],
    // Эмоциональные состояния
    emotions: ['счастье', 'грусть', 'гнев', 'радость', 'веселье', 'недовольство', 'счастлив', 'грустный'],
    // Кампании и промо
    promotional: ['акция', 'скидки', 'предложение', 'промо', 'лето', 'отдых'],
    // Персонажи и животные
    characters: ['заяц', 'кролик', 'персонаж', 'животные', 'rabbit']
  };

  const t1 = tag1.toLowerCase();
  const t2 = tag2.toLowerCase();

  for (const group of Object.values(contextualGroups)) {
    if (group.includes(t1) && group.includes(t2)) {
      return true;
    }
  }

  return false;
}

/**
 * Выбор разнообразных результатов
 */
function selectDiverseResults(results: any[], targetCount: number): any[] {
  if (results.length <= targetCount) {
    return results;
  }

  const selected: any[] = [];
  const usedFolders = new Set<string>();
  const usedTones = new Set<string>();
  const usedEmotions = new Set<string>();

  // Группируем результаты по категориям для лучшего анализа
  const resultsByFolder = results.reduce((acc, result) => {
    if (!acc[result.folderName]) acc[result.folderName] = [];
    acc[result.folderName].push(result);
    return acc;
  }, {});

  console.log(`🎯 Выбор разнообразных результатов из ${results.length} кандидатов:`);
  Object.entries(resultsByFolder).forEach(([folder, items]: [string, any]) => {
    console.log(`  ${folder}: ${items.length} файлов`);
  });

  // Фаза 1: Выбираем лучший результат из каждой папки
  for (const folderName of Object.keys(resultsByFolder)) {
    if (selected.length >= targetCount) break;
    
    const folderResults = resultsByFolder[folderName].sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    const bestFromFolder = folderResults[0];
    
    selected.push(bestFromFolder);
    usedFolders.add(bestFromFolder.folderName);
    usedTones.add(bestFromFolder.tone);
    
    // Определяем эмоцию из тегов
    const emotion = detectEmotionFromTags(bestFromFolder.allTags);
    if (emotion) usedEmotions.add(emotion);
    
    console.log(`  ✅ Выбран из ${folderName}: ${bestFromFolder.fileName} (Score: ${bestFromFolder.relevanceScore})`);
  }

  // Фаза 2: Дополняем результатами с разными тонами и эмоциями
  const remainingResults = results.filter(result => !selected.includes(result));
  
  for (const result of remainingResults.sort((a, b) => b.relevanceScore - a.relevanceScore)) {
    if (selected.length >= targetCount) break;
    
    const emotion = detectEmotionFromTags(result.allTags);
    
    // Приоритет для результатов с новыми характеристиками
    const hasNewTone = !usedTones.has(result.tone);
    const hasNewEmotion = emotion && !usedEmotions.has(emotion);
    const isHighRelevance = result.relevanceScore >= 20;
    
    if (hasNewTone || hasNewEmotion || isHighRelevance) {
      selected.push(result);
      usedTones.add(result.tone);
      if (emotion) usedEmotions.add(emotion);
      
      console.log(`  ✅ Дополнительно выбран: ${result.fileName} (${result.folderName}) - Score: ${result.relevanceScore}, Tone: ${result.tone}, Emotion: ${emotion || 'none'}`);
    }
  }

  // Фаза 3: Если все еще не хватает, добавляем лучшие по релевантности
  if (selected.length < targetCount) {
    const stillNeeded = targetCount - selected.length;
    const remaining = results
      .filter(result => !selected.includes(result))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, stillNeeded);
    
    selected.push(...remaining);
    
    console.log(`  ✅ Добавлено ${remaining.length} лучших по релевантности`);
  }

  console.log(`🎯 Финальный выбор (${selected.length} из ${targetCount}):`);
  selected.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.fileName} (${result.folderName}) - Score: ${result.relevanceScore}`);
  });

  return selected.slice(0, targetCount);
}

/**
 * Определение эмоции из тегов файла
 */
function detectEmotionFromTags(tags: string[]): string | null {
  const emotionKeywords = {
    'happy': ['счастье', 'счастлив', 'радость', 'веселье', 'веселый', 'позитив', 'лето'],
    'sad': ['грусть', 'грустный', 'печаль', 'забота'],
    'angry': ['гнев', 'злость', 'недовольство', 'раздражение', 'разозлен'],
    'confused': ['озадаченность', 'вопросы', 'размышления', 'задумчивость'],
    'neutral': ['нейтрален', 'нейтральный', 'персонаж', 'кролик']
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const tag of tags) {
      if (keywords.some(keyword => tag.toLowerCase().includes(keyword.toLowerCase()))) {
        return emotion;
      }
    }
  }

  return null;
}

/**
 * Резервный поиск по всем папкам
 */
async function performFallbackSearch(basePath: string, searchTags: string[]): Promise<any[]> {
  const results: any[] = [];

  for (const folderName of Object.keys(LOCAL_FIGMA_FOLDERS)) {
    const folderPath = path.join(basePath, folderName);
    
    try {
      const folderResults = await searchInFolder(folderPath, folderName, searchTags);
      results.push(...folderResults);
    } catch (error) {
      continue;
    }
  }

  // Возвращаем топ-3 результата
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, 3);
}

/**
 * Форматирование результатов для возврата
 */
function formatResults(results: any[], strategy: string): ToolResult {
  const paths: string[] = [];
  const metadata: Record<string, AssetInfo> = {};

  for (const result of results) {
    // Конвертируем абсолютный путь в относительный от корня проекта
    const relativePath = path.relative(process.cwd(), result.filePath);
    paths.push(relativePath);

    metadata[result.fileName] = {
      path: relativePath,
      url: `/${relativePath}`,
      width: result.metadata?.technical?.width || 400,
      height: result.metadata?.technical?.height || 300,
      metadata: {
        fileName: result.fileName,
        folderName: result.folderName,
        relevanceScore: result.relevanceScore,
        matchedTags: result.matchedTags,
        allTags: result.allTags,
        description: result.description,
        tone: result.tone,
        confidence: result.confidence,
        source: 'figma-local-processor',
        strategy: strategy,
        technical: result.metadata?.technical,
        aiAnalysis: result.metadata?.aiAnalysis,
        figmaNodeId: result.metadata?.figmaNodeId
      }
    };
  }

  console.log(`🎉 Локальный поиск завершен: найдено ${paths.length} ассетов`);
  console.log('📁 Выбранные файлы:', paths.map(p => path.basename(p)));

  return {
    success: true,
    data: {
      paths,
      metadata,
      selection_strategy: {
        strategy_used: strategy,
        reasoning: `Локальный поиск с использованием стратегии: ${strategy}`,
        diversity_applied: strategy.includes('diverse'),
        randomization_factor: 0
      }
    },
    metadata: {
      source: 'figma-local-processor',
      total_found: results.length,
      strategy: strategy,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Получение информации о доступных папках и их содержимом
 */
export async function getLocalFigmaFoldersInfo(): Promise<ToolResult> {
  try {
    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    const foldersInfo: any = {};

    for (const [folderName, folderConfig] of Object.entries(LOCAL_FIGMA_FOLDERS)) {
      const folderPath = path.join(basePath, folderName);
      
      try {
        await fs.access(folderPath);
        
        // Читаем статистику из agent-file-mapping.json
        const mappingPath = path.join(folderPath, 'agent-file-mapping.json');
        const mappingData: AgentFileMapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

        foldersInfo[folderName] = {
          ...folderConfig,
          totalFiles: mappingData.totalFiles,
          available: true,
          lastUpdated: mappingData.updatedAt
        };
      } catch (error) {
        foldersInfo[folderName] = {
          ...folderConfig,
          available: false,
          error: error.message
        };
      }
    }

    return {
      success: true,
      data: {
        folders: foldersInfo,
        totalFolders: Object.keys(LOCAL_FIGMA_FOLDERS).length,
        availableFolders: Object.values(foldersInfo).filter((f: any) => f.available).length
      }
    };

  } catch (error) {
    return handleToolError('get_local_figma_folders_info', error);
  }
} 