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
 * Структура данных из tag-dictionary.json - ПОЛНАЯ СХЕМА
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
        density: number;
        channels: number;
        hasAlpha: boolean;
        colorSpace: string;
        compression: string | null;
        lastModified: string;
        created: string;
      };
      analysis: {
        dimensions: {
          isIcon: boolean;
          isSmall: boolean;
          isMedium: boolean;
          isLarge: boolean;
          isSquare: boolean;
          isWide: boolean;
          isTall: boolean;
          isPortrait: boolean;
          isLandscape: boolean;
        };
        quality: {
          resolution: string;
          megapixels: number;
          pixelDensity: number;
          qualityLevel: string;
          sharpness: string;
        };
        file: {
          sizeBytes: number;
          sizeKB: number;
          sizeMB: number;
          sizeCategory: string;
          compressionRatio: number;
          efficiency: string;
        };
        technical: {
          format: string;
          hasAlpha: boolean;
          channels: number;
          colorSpace: string;
          bitDepth: number;
          isTransparent: boolean;
          isOptimized: boolean;
        };
        emailCompatibility: {
          sizeForEmail: string;
          loadingSpeed: string;
          mobileOptimized: boolean;
          retinalReady: boolean;
          webOptimized: boolean;
        };
        usageRecommendations: {
          bestFor: string[];
          emailContext: string[];
          responsiveBreakpoints: {
            mobile: string;
            tablet: string;
            desktop: string;
          };
        };
      };
    };
    analysis: {
      visual: {
        colors: {
          dominant: {
            red: number;
            green: number;
            blue: number;
          };
          primaryColor: string;
          brightness: number;
          saturation: number;
        };
        composition: {
          aspectRatio: number;
          composition: string;
          complexity: string;
          resolution: string;
          pixelDensity: number;
        };
        quality: {
          resolution: string;
          megapixels: number;
          pixelDensity: number;
          qualityLevel: string;
          sharpness: string;
        };
        dimensions: {
          isIcon: boolean;
          isSmall: boolean;
          isMedium: boolean;
          isLarge: boolean;
          isSquare: boolean;
          isWide: boolean;
          isTall: boolean;
          isPortrait: boolean;
          isLandscape: boolean;
        };
      };
      content: {
        categories: string[];
        primaryTheme: string;
        contentElements: string[];
        complexity: string;
      };
      technical: {
        fileSize: number;
        dimensions: string;
        format: string;
        hasAlpha: boolean;
        colorSpace: string;
        channels: number;
        bitDepth: number;
        isTransparent: boolean;
        isOptimized: boolean;
        file: {
          sizeBytes: number;
          sizeKB: number;
          sizeMB: number;
          sizeCategory: string;
          compressionRatio: number;
          efficiency: string;
        };
        emailCompatibility: {
          sizeForEmail: string;
          loadingSpeed: string;
          mobileOptimized: boolean;
          retinalReady: boolean;
          webOptimized: boolean;
        };
      };
      usage: {
        email: {
          recommendations: string[];
          suitability: {
            hero?: string;
            darkTheme?: string;
            background?: string;
            accent?: string;
            featured?: string;
          };
          fileSize: string;
          loadingSpeed: string;
        };
        general: {
          bestFor: string[];
          emailContext: string[];
          responsiveBreakpoints: {
            mobile: string;
            tablet: string;
            desktop: string;
          };
        };
      };
      scores: {
        visual: number;
        content: number;
        technical: number;
        overall: number;
        fileOptimization: number;
        emailReadiness: number;
        qualityScore: number;
      };
      analysisMetadata: {
        version: string;
        timestamp: string;
        analysisType: string;
        features: string[];
      };
    };
  }>;
}

/**
 * Кэш для AI-оптимизированных тегов
 */
let aiOptimizedTagsCache: any = null;

/**
 * Словарь для перевода английских тегов на русский
 */
const englishToRussianMap: Record<string, string[]> = {
  // Travel & Aviation
  'travel': ['путешествие', 'путешествия', 'поездка'],
  'flight': ['полет', 'рейс', 'авиация'],
  'ticket': ['билет', 'авиабилет', 'билеты'],
  'aviation': ['авиация', 'авиакомпания', 'самолет'],
  'airplane': ['самолет', 'авиация', 'полет'],
  'airport': ['аэропорт', 'терминал', 'авиация'],
  'vacation': ['отпуск', 'каникулы', 'отдых'],
  'holiday': ['праздник', 'отпуск', 'каникулы'],
  'summer': ['лето', 'летний', 'летние'],
  'winter': ['зима', 'зимний', 'зимние'],
  
  // Emotions & Feelings
  'happy': ['счастливый', 'веселый', 'радостный', 'позитивный'],
  'joy': ['радость', 'веселье', 'счастье'],
  'excitement': ['волнение', 'возбуждение', 'энтузиазм'],
  'positive': ['позитивный', 'положительный', 'оптимистичный'],
  'friendly': ['дружелюбный', 'приветливый', 'добрый'],
  'cheerful': ['веселый', 'жизнерадостный', 'бодрый'],
  
  // Marketing & Business
  'promotion': ['акция', 'промо', 'предложение'],
  'discount': ['скидка', 'распродажа', 'льгота'],
  'sale': ['распродажа', 'акция', 'скидка'],
  'offer': ['предложение', 'акция', 'оффер'],
  'deal': ['сделка', 'предложение', 'выгода'],
  'special': ['специальный', 'особый', 'эксклюзивный'],
  'urgent': ['срочно', 'экстренно', 'немедленно'],
  'limited': ['ограниченный', 'лимитированный', 'эксклюзивный'],
  
  // Characters & Mascots
  'rabbit': ['заяц', 'кролик', 'зайчик'],
  'bunny': ['зайчик', 'заяц', 'кролик'],
  'mascot': ['маскот', 'персонаж', 'символ'],
  'character': ['персонаж', 'герой', 'символ'],
  'cute': ['милый', 'симпатичный', 'очаровательный'],
  
  // Design & Visual
  'design': ['дизайн', 'оформление', 'графика'],
  'creative': ['креативный', 'творческий', 'креатив'],
  'illustration': ['иллюстрация', 'рисунок', 'изображение'],
  'graphic': ['графика', 'графический', 'изображение'],
  'visual': ['визуальный', 'зрительный', 'наглядный'],
  'colorful': ['цветной', 'яркий', 'красочный'],
  'bright': ['яркий', 'светлый', 'насыщенный'],
  
  // Technology & Digital
  'technology': ['технологии', 'техника', 'цифровой'],
  'digital': ['цифровой', 'электронный', 'онлайн'],
  'online': ['онлайн', 'интернет', 'сетевой'],
  'mobile': ['мобильный', 'телефон', 'смартфон'],
  'app': ['приложение', 'программа', 'софт'],
  
  // Time & Urgency
  'time': ['время', 'временной', 'срок'],
  'fast': ['быстро', 'скорый', 'оперативно'],
  'quick': ['быстрый', 'скорый', 'мгновенный'],
  'instant': ['мгновенный', 'немедленный', 'быстрый'],
  'now': ['сейчас', 'немедленно', 'прямо сейчас'],
  
  // Cities (common destinations)
  'moscow': ['Москва', 'московский'],
  'sochi': ['Сочи', 'сочинский'],
  'petersburg': ['Санкт-Петербург', 'Питер', 'СПб'],
  'batumi': ['Батуми', 'батумский'],
  
  // General concepts
  'news': ['новости', 'новость', 'информация'],
  'information': ['информация', 'данные', 'сведения'],
  'service': ['сервис', 'услуга', 'обслуживание'],
  'quality': ['качество', 'качественный'],
  'reliable': ['надежный', 'безопасный', 'проверенный'],
  'convenient': ['удобный', 'комфортный', 'практичный'],
  'cheap': ['дешевый', 'недорогой', 'бюджетный'],
  'affordable': ['доступный', 'недорогой', 'бюджетный'],
  'family': ['семья', 'семейный', 'родители'],
  'children': ['дети', 'детский', 'ребенок']
};

/**
 * Загружает AI-оптимизированные теги из файла
 */
async function loadAIOptimizedTags(): Promise<any> {
  if (aiOptimizedTagsCache) {
    return aiOptimizedTagsCache;
  }

  try {
    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    const aiOptimizedTagsPath = path.join(basePath, 'ai-optimized-tags.json');
    
    const content = await fs.readFile(aiOptimizedTagsPath, 'utf-8');
    aiOptimizedTagsCache = JSON.parse(content);
    
    console.log('📋 Загружен ai-optimized-tags.json:', {
      total_folders: aiOptimizedTagsCache.summary?.total_folders,
      total_unique_tags: aiOptimizedTagsCache.summary?.total_unique_tags,
      most_common_tags: Object.keys(aiOptimizedTagsCache.most_common_tags || {}).slice(0, 5)
    });
    
    return aiOptimizedTagsCache;
  } catch (error) {
    console.error('❌ Ошибка загрузки ai-optimized-tags.json:', error);
    return null;
  }
}

/**
 * Переводит английские теги на русский язык
 */
function translateEnglishToRussian(englishTags: string[]): string[] {
  const russianTags = new Set<string>();
  
  englishTags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    
    // Прямой перевод из словаря
    if (englishToRussianMap[lowerTag]) {
      englishToRussianMap[lowerTag].forEach(russianTag => russianTags.add(russianTag));
    }
    
    // Добавляем оригинальный тег (может быть уже на русском)
    russianTags.add(tag);
    
    // Частичные совпадения для составных слов
    Object.entries(englishToRussianMap).forEach(([englishWord, translations]) => {
      if (lowerTag.includes(englishWord) || englishWord.includes(lowerTag)) {
        translations.forEach(russianTag => russianTags.add(russianTag));
      }
    });
  });
  
  return Array.from(russianTags);
}

/**
 * Расширяет поиск с использованием AI-оптимизированных тегов
 */
function expandSearchWithAITags(originalTags: string[], aiOptimizedTags: any): string[] {
  const expandedTags = new Set(originalTags);
  
  // Переводим английские теги на русский
  const russianTags = translateEnglishToRussian(originalTags);
  russianTags.forEach(tag => expandedTags.add(tag));
  
  // Добавляем связанные теги из AI-оптимизированного словаря
  if (aiOptimizedTags?.most_common_tags) {
    const commonTags = Object.keys(aiOptimizedTags.most_common_tags);
    
    originalTags.forEach(searchTag => {
      const lowerSearchTag = searchTag.toLowerCase();
      
      // Ищем похожие теги в словаре
      commonTags.forEach(aiTag => {
        const lowerAITag = aiTag.toLowerCase();
        
        // Точное совпадение
        if (lowerSearchTag === lowerAITag) {
          expandedTags.add(aiTag);
        }
        
        // Частичное совпадение (содержит подстроку)
        if (lowerSearchTag.includes(lowerAITag) || lowerAITag.includes(lowerSearchTag)) {
          if (lowerSearchTag.length >= 3 && lowerAITag.length >= 3) { // Минимум 3 символа
            expandedTags.add(aiTag);
          }
        }
      });
    });
  }
  
  const result = Array.from(expandedTags);
  console.log('🔄 Расширение тегов:', {
    original: originalTags,
    expanded: result,
    added_count: result.length - originalTags.length
  });
  
  return result;
}

// LOCAL_FIGMA_FOLDERS removed - NO HARDCODED FOLDER MAPPING
// Folders will be discovered dynamically through AI analysis

// EMOTION_MAPPING removed - NO HARDCODED EMOTION MAPPING
// Emotions will be analyzed dynamically through AI

// CAMPAIGN_TYPE_MAPPING removed - NO HARDCODED CAMPAIGN MAPPING
// Campaign types will be analyzed dynamically through AI

/**
 * Динамически обнаруживает доступные папки в Figma директории
 */
async function discoverAvailableFolders(basePath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .filter(name => !name.startsWith('.'));
    
    console.log('📁 Обнаруженные папки:', folders);
    return folders;
  } catch (error) {
    console.error('❌ Ошибка при обнаружении папок:', error);
    throw new Error(`❌ FigmaLocalProcessor: Failed to discover folders - ${error.message}`);
  }
}

/**
 * Использует AI для анализа и выбора релевантных папок с помощью ai-optimized-tags.json
 */
async function analyzeRelevantFolders(availableFolders: string[], params: LocalFigmaAssetParams): Promise<string[]> {
  try {
    // Загружаем ai-optimized-tags.json
    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    const aiOptimizedTagsPath = path.join(basePath, 'ai-optimized-tags.json');
    
    const aiOptimizedContent = await fs.readFile(aiOptimizedTagsPath, 'utf-8');
    const aiOptimizedTags = JSON.parse(aiOptimizedContent);
    console.log('📋 Загружен ai-optimized-tags.json для анализа папок');

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Используем данные из ai-optimized-tags.json для более точного анализа
    const folderInfo = Object.entries(aiOptimizedTags.folders)
      .map(([folder, data]: [string, any]) => 
        `${folder}: ${data.description} (${data.unique_tags_count} тегов) - топ теги: ${data.top_tags.slice(0, 3).join(', ')}`
      ).join('\n');

    const searchRecommendations = aiOptimizedTags.search_recommendations;
    const contextType = getContextType(params);
    const recommendedFolders = searchRecommendations[contextType]?.primary_folders || [];

    const prompt = `Analyze Figma folders using comprehensive tag data to find assets for: ${params.tags.join(', ')}

FOLDER DETAILS:
${folderInfo}

SEARCH CONTEXT:
- Campaign type: ${params.context?.campaign_type || 'not specified'}
- Emotional tone: ${params.context?.emotional_tone || 'not specified'}
- Preferred emotion: ${params.context?.preferred_emotion || 'not specified'}
- Target count: ${params.context?.target_count || 2}

RECOMMENDED FOLDERS FOR THIS CONTEXT (${contextType}): ${recommendedFolders.join(', ')}

MOST COMMON TAGS GLOBALLY: ${Object.keys(aiOptimizedTags.most_common_tags).slice(0, 10).join(', ')}

Select 3-4 most relevant folder names based on:
1. Tag overlap with search terms
2. Folder descriptions and content type
3. Context-specific recommendations
4. Emotional alignment

Available folders: ${availableFolders.join(', ')}

Return only a JSON array of folder names, no explanations.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI for folder analysis');
    }

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in AI response');
    }

    const selectedFolders = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(selectedFolders) || selectedFolders.length === 0) {
      throw new Error('AI returned invalid or empty folders array');
    }

    // Validate that selected folders exist
    const validFolders = selectedFolders.filter(folder => availableFolders.includes(folder));
    if (validFolders.length === 0) {
      throw new Error('AI selected folders that do not exist');
    }

    console.log('🤖 AI выбрал релевантные папки:', validFolders);
    console.log('📊 Используя данные из ai-optimized-tags.json для более точного анализа');
    
    return validFolders;

  } catch (error) {
    console.error('❌ AI анализ папок не удался:', error);
    throw new Error(`❌ FigmaLocalProcessor: AI folder analysis failed - ${error.message}. No fallback folder selection allowed.`);
  }
}

/**
 * Определяет тип контента для поиска рекомендаций
 */
function getContextType(params: LocalFigmaAssetParams): string {
  const tags = params.tags.map(t => t.toLowerCase());
  const emotionalTone = params.context?.emotional_tone || '';
  
  // Проверяем на промо-контент
  if (tags.some(tag => ['акция', 'скидка', 'предложение', 'промо', 'распродажа'].some(promo => tag.includes(promo)))) {
    return 'promotional_content';
  }
  
  // Проверяем на туристический контент
  if (tags.some(tag => ['путешествия', 'отдых', 'отпуск', 'авиация', 'билеты', 'туризм'].some(travel => tag.includes(travel)))) {
    return 'travel_content';
  }
  
  // Проверяем на эмоциональный контент
  if (emotionalTone === 'positive' || tags.some(tag => ['счастье', 'радость', 'веселье', 'улыбка'].some(emotion => tag.includes(emotion)))) {
    return 'emotional_content';
  }
  
  // По умолчанию информационный контент
  return 'informational_content';
}

/**
 * Выполняет поиск в AI-выбранных релевантных папках
 */
async function searchInRelevantFolders(basePath: string, relevantFolders: string[], params: LocalFigmaAssetParams): Promise<any[]> {
  const results: any[] = [];

  console.log(`🔍 Поиск в ${relevantFolders.length} AI-выбранных папках: ${relevantFolders.join(', ')}`);

  for (const folderName of relevantFolders) {
    const folderPath = path.join(basePath, folderName);
    
    try {
      await fs.access(folderPath);
      console.log(`🔍 Поиск в папке: ${folderName}`);
      
      const folderResults = await searchInFolder(folderPath, folderName, params.tags, params.context);
      results.push(...folderResults);
      
      console.log(`📊 Папка ${folderName}: найдено ${folderResults.length} результатов`);
      
    } catch (error) {
      console.log(`⚠️ Папка ${folderName} недоступна: ${error.message}`);
      continue;
    }
  }

  // Сортируем по релевантности
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  const targetCount = params.context?.target_count || 2;
  const finalResults = results.slice(0, targetCount);
  
  console.log(`📊 Финальные результаты: ${finalResults.length} из ${results.length} найденных`);
  
  return finalResults;
}

/**
 * Основная функция для поиска локальных Figma ассетов
 */
export async function getLocalFigmaAssets(params: LocalFigmaAssetParams): Promise<ToolResult> {
  try {
    console.log('🎯 AI-powered поиск локальных Figma ассетов:', params);

    // Валидация параметров - теги могут быть пустыми, тогда используем контекст
    if (!params.tags) {
      params.tags = [];
    }
    
    // Если теги пустые, создаем базовые теги из контекста
    if (params.tags.length === 0) {
      console.log('⚠️ Теги не предоставлены, генерируем базовые теги из контекста');
      const contextTags = [];
      
      if (params.context?.campaign_type) {
        contextTags.push(params.context.campaign_type);
      }
      if (params.context?.emotional_tone) {
        contextTags.push(params.context.emotional_tone);
      }
      if (params.context?.preferred_emotion) {
        contextTags.push(params.context.preferred_emotion);
      }
      
      // Добавляем общие теги если контекст тоже пустой
      if (contextTags.length === 0) {
        contextTags.push('общие', 'email', 'кампания');
      }
      
      params.tags = contextTags;
      console.log('🏷️ Сгенерированные контекстные теги:', params.tags);
    }

    // 🔄 НОВАЯ ЛОГИКА: Загружаем AI-оптимизированные теги и расширяем поиск
    console.log('📋 Загружаем AI-оптимизированные теги для улучшенного поиска...');
    const aiOptimizedTags = await loadAIOptimizedTags();
    
    // Расширяем теги с помощью перевода и AI-словаря
    const expandedTags = aiOptimizedTags 
      ? expandSearchWithAITags(params.tags, aiOptimizedTags)
      : translateEnglishToRussian(params.tags); // Fallback к простому переводу
    
    // Обновляем параметры с расширенными тегами
    const enhancedParams = {
      ...params,
      tags: expandedTags,
      originalTags: params.tags // Сохраняем оригинальные теги для отчетности
    };
    
    console.log('🔍 Улучшенный поиск с расширенными тегами:', {
      original_tags: params.tags,
      expanded_tags: expandedTags.slice(0, 10), // Показываем первые 10
      total_expanded: expandedTags.length
    });

    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    
    // Проверяем существование базовой папки
    try {
      await fs.access(basePath);
    } catch {
      throw new Error('❌ FigmaLocalProcessor: Local Figma assets directory not found');
    }

    // Динамически обнаруживаем доступные папки
    const availableFolders = await discoverAvailableFolders(basePath);
    console.log('📁 Обнаружено папок:', availableFolders.length);

    // Используем AI для определения релевантных папок (теперь с расширенными тегами)
    const relevantFolders = await analyzeRelevantFolders(availableFolders, enhancedParams);
    console.log('🤖 AI выбрал релевантные папки:', relevantFolders);

    // Выполняем поиск в релевантных папках (с расширенными тегами)
    const searchResults = await searchInRelevantFolders(basePath, relevantFolders, enhancedParams);
    
    if (searchResults.length === 0) {
      console.log('❌ Поиск не дал результатов. Детали поиска:', {
        original_tags: params.tags,
        expanded_tags: expandedTags,
        folders_searched: relevantFolders,
        ai_tags_loaded: !!aiOptimizedTags
      });
      throw new Error('❌ FigmaLocalProcessor: No matching assets found in any folders. Enhanced search with tag translation failed to find suitable content.');
    }

    console.log('✅ Найдено ассетов:', searchResults.length);
    return formatResults(searchResults, 'ai-powered-search-enhanced');

  } catch (error) {
    return handleToolError('get_local_figma_assets', error);
  }
}

// determineSearchStrategy function removed - NO HARDCODED SEARCH STRATEGIES
// Search strategy is now determined dynamically through AI analysis

// searchInPriorityFolders function removed - NO HARDCODED PRIORITY FOLDERS
// Folder priorities are now determined dynamically through AI analysis

/**
 * Поиск в конкретной папке
 */
async function searchInFolder(folderPath: string, folderName: string, searchTags: string[], context?: any): Promise<any[]> {
  const results: any[] = [];

  try {
    // Читаем agent-file-mapping.json для быстрого поиска
    const mappingPath = path.join(folderPath, 'agent-file-mapping.json');
    const mappingData: AgentFileMapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

    // Читаем tag-dictionary.json для детальной информации
    const dictionaryPath = path.join(folderPath, 'tag-dictionary.json');
    const dictionaryData: TagDictionary = JSON.parse(await fs.readFile(dictionaryPath, 'utf-8'));

    console.log(`📊 Анализ папки ${folderName}: ${mappingData.totalFiles} файлов`);

    // Поиск по tag-dictionary с использованием более точных тегов
    for (const [entryKey, dictionaryEntry] of Object.entries(dictionaryData.entries)) {
      // Используем теги из tag-dictionary как приоритетные
      const allTags = [
        ...dictionaryEntry.allTags,
        ...dictionaryEntry.selectedTags,
        ...(mappingData.fileMapping[entryKey]?.allTags || [])
      ];
      
      const relevanceScore = calculateRelevanceScore(allTags, searchTags);
      
      if (relevanceScore > 0) {
        // Получаем информацию из agent-file-mapping как fallback
        const mappingInfo = mappingData.fileMapping[entryKey];
        
        // Используем originalName из обновленного tag-dictionary.json
        const actualFileName = dictionaryEntry.originalName;
        if (!actualFileName) {
          console.log(`⚠️ originalName не найден для ключа ${entryKey} в папке ${folderName}`);
          continue;
        }
        
        // Проверяем, что файл действительно существует
        const fullFilePath = path.join(folderPath, actualFileName);
        try {
          await fs.access(fullFilePath);
          console.log(`✅ Файл подтвержден: ${actualFileName}`);
        } catch (error) {
          console.log(`⚠️ Файл ${actualFileName} не существует в папке ${folderName}`);
          continue;
        }
        
        // Расчет email-совместимости и качества на основе богатых метаданных
        const emailCompatibility = dictionaryEntry.analysis?.technical?.emailCompatibility || 
                                  dictionaryEntry.imageMetadata?.analysis?.emailCompatibility || {
          sizeForEmail: 'unknown',
          loadingSpeed: 'unknown',
          mobileOptimized: false,
          retinalReady: false,
          webOptimized: false
        };

        const emailUsage = dictionaryEntry.analysis?.usage?.email || {
          recommendations: [],
          suitability: {},
          fileSize: 'unknown',
          loadingSpeed: 'unknown'
        };

        const qualityScores = dictionaryEntry.analysis?.scores || {
          visual: 0,
          content: 0,
          technical: 0,
          overall: 0,
          fileOptimization: 0,
          emailReadiness: 0,
          qualityScore: 0
        };

        // Расчет улучшенного relevance score с учетом email-метрик
        const emailRelevanceBonus = calculateEmailRelevanceBonus(dictionaryEntry, context);
        const enhancedRelevanceScore = relevanceScore + emailRelevanceBonus;

        const result = {
          fileName: actualFileName,
          filePath: path.join(folderPath, actualFileName),
          folderName,
          relevanceScore: enhancedRelevanceScore,
          matchedTags: allTags.filter(tag => 
            searchTags.some(searchTag => 
              tag.toLowerCase().includes(searchTag.toLowerCase()) ||
              searchTag.toLowerCase().includes(tag.toLowerCase())
            )
          ),
          allTags: allTags,
          description: dictionaryEntry.aiAnalysis?.contentDescription || mappingInfo?.description || 'No description available',
          tone: dictionaryEntry.aiAnalysis?.emotionalTone || mappingInfo?.tone || 'neutral',
          confidence: dictionaryEntry.aiAnalysis?.confidence || mappingInfo?.confidence || 0.5,
          
          // БОГАТЫЕ МЕТАДАННЫЕ ДЛЯ EMAIL-ОПТИМИЗАЦИИ
          emailCompatibility,
          emailUsage,
          qualityScores,
          
          // Визуальный анализ
          visualAnalysis: dictionaryEntry.analysis?.visual || null,
          
          // Технические характеристики
          technicalAnalysis: dictionaryEntry.analysis?.technical || null,
          
          // Рекомендации по использованию
          usageRecommendations: dictionaryEntry.imageMetadata?.analysis?.usageRecommendations || 
                               dictionaryEntry.analysis?.usage?.general || null,
          
          // Полные метаданные изображения
          fullImageMetadata: dictionaryEntry.imageMetadata || null,
          
          metadata: dictionaryEntry ? {
            technical: dictionaryEntry.imageMetadata?.technical || {
              width: 400,
              height: 300,
              format: 'png',
              fileSize: 0,
              fileSizeFormatted: '0 KB',
              aspectRatio: '4:3',
              orientation: 'landscape'
            },
            aiAnalysis: dictionaryEntry.aiAnalysis,
            figmaNodeId: dictionaryEntry.metadata?.figmaNodeId,
            
            // Дополнительные метаданные для принятия решений
            emailReadiness: qualityScores.emailReadiness || 0,
            qualityLevel: dictionaryEntry.imageMetadata?.analysis?.quality?.qualityLevel || 'unknown',
            recommendedFor: emailUsage.recommendations || [],
            suitabilityRatings: emailUsage.suitability || {}
          } : {
            technical: {
              width: 400,
              height: 300,
              format: 'png',
              fileSize: 0,
              fileSizeFormatted: '0 KB',
              aspectRatio: '4:3',
              orientation: 'landscape'
            },
            emailReadiness: 0,
            qualityLevel: 'unknown',
            recommendedFor: [],
            suitabilityRatings: {}
          }
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
 * Расчет бонуса релевантности на основе email-совместимости и качества
 */
function calculateEmailRelevanceBonus(dictionaryEntry: any, context?: any): number {
  let bonus = 0;
  
  try {
    // Бонус за email-совместимость
    const emailCompatibility = dictionaryEntry.analysis?.technical?.emailCompatibility || 
                              dictionaryEntry.imageMetadata?.analysis?.emailCompatibility;
    
    if (emailCompatibility) {
      // Размер файла для email
      switch (emailCompatibility.sizeForEmail) {
        case 'excellent': bonus += 15; break;
        case 'good': bonus += 10; break;
        case 'acceptable': bonus += 5; break;
        case 'poor': bonus -= 5; break;
      }
      
      // Скорость загрузки
      switch (emailCompatibility.loadingSpeed) {
        case 'fast': bonus += 10; break;
        case 'medium': bonus += 5; break;
        case 'slow': bonus -= 5; break;
      }
      
      // Дополнительные бонусы
      if (emailCompatibility.mobileOptimized) bonus += 8;
      if (emailCompatibility.retinalReady) bonus += 5;
      if (emailCompatibility.webOptimized) bonus += 5;
    }
    
    // Бонус за качественные метрики
    const scores = dictionaryEntry.analysis?.scores;
    if (scores) {
      // Email-готовность (самый важный фактор)
      bonus += (scores.emailReadiness || 0) * 0.2;
      
      // Оптимизация файла
      bonus += (scores.fileOptimization || 0) * 0.15;
      
      // Общее качество
      bonus += (scores.qualityScore || 0) * 0.1;
      
      // Технические показатели
      bonus += (scores.technical || 0) * 0.05;
    }
    
          // 🎯 СУПЕР БОНУС за контекстуальное соответствие (приоритет над техническими характеристиками)
      if (context) {
        // Анализируем все теги на соответствие контексту
        const allTags = (dictionaryEntry.allTags || []).concat(dictionaryEntry.selectedTags || []);
        const allTagsString = allTags.join(' ').toLowerCase();
        const contentDescription = (dictionaryEntry.aiAnalysis?.contentDescription || '').toLowerCase();
        
        // ОГРОМНЫЙ бонус за путешествия и связанные термины
        if (allTagsString.includes('путешест') || allTagsString.includes('поездк') || 
            allTagsString.includes('отпуск') || allTagsString.includes('туризм') || 
            allTagsString.includes('чемодан') || allTagsString.includes('дорога') ||
            contentDescription.includes('путешест') || contentDescription.includes('чемодан') ||
            contentDescription.includes('поездк') || contentDescription.includes('туризм')) {
          console.log(`🎯 КОНТЕКСТНЫЙ СУПЕР-БОНУС: +50 за путешествия для ${dictionaryEntry.originalName}`);
          bonus += 50; // ОГРОМНЫЙ бонус за контекстуальное соответствие
        }
        
        // Бонус за персонажей (зайцы, герои) в контексте путешествий
        if ((allTagsString.includes('заяц') || allTagsString.includes('персонаж') || 
             allTagsString.includes('герой') || allTagsString.includes('кролик')) &&
            (allTagsString.includes('чемодан') || contentDescription.includes('чемодан'))) {
          console.log(`🐰 ПЕРСОНАЖ ПУТЕШЕСТВИЯ БОНУС: +30 для ${dictionaryEntry.originalName}`);
          bonus += 30;
        }
        
        // Штраф за неподходящие изображения (интерьер, мебель в контексте путешествий)  
        if (allTagsString.includes('интерьер') || allTagsString.includes('подлок') || 
            allTagsString.includes('мебель') || allTagsString.includes('дом') ||
            contentDescription.includes('интерьер') || contentDescription.includes('организация пространства')) {
          console.log(`❌ КОНТЕКСТНЫЙ ШТРАФ: -25 за неподходящий контент для ${dictionaryEntry.originalName}`);
          bonus -= 25; // Штраф за неподходящий контекст
        }
        
        const emailUsage = dictionaryEntry.analysis?.usage?.email;
        if (emailUsage && emailUsage.recommendations) {
          // Проверяем соответствие типу кампании
          const campaignType = context.campaign_type;
          if (campaignType === 'promotional' && emailUsage.recommendations.includes('hero_image')) {
            bonus += 12;
          } else if (campaignType === 'informational' && emailUsage.recommendations.includes('featured_image')) {
            bonus += 10;
          } else if (campaignType === 'seasonal' && emailUsage.recommendations.includes('background')) {
            bonus += 8;
          }
          
          // Проверяем эмоциональное соответствие
          const emotionalTone = context.emotional_tone;
          const aiAnalysis = dictionaryEntry.aiAnalysis;
          if (aiAnalysis && emotionalTone) {
            if (emotionalTone === aiAnalysis.emotionalTone) {
              bonus += 10;
            } else if (
              (emotionalTone === 'positive' && aiAnalysis.emotionalTone === 'позитивный') ||
              (emotionalTone === 'friendly' && aiAnalysis.emotionalTone === 'дружелюбный') ||
              (emotionalTone === 'urgent' && aiAnalysis.emotionalTone === 'срочный')
            ) {
              bonus += 8;
            }
          }
        }
      }
    
    // Бонус за рекомендации по использованию
    const usageRecommendations = dictionaryEntry.imageMetadata?.analysis?.usageRecommendations ||
                                dictionaryEntry.analysis?.usage?.general;
    
    if (usageRecommendations && usageRecommendations.emailContext) {
      // Приоритет для основного контента
      if (usageRecommendations.emailContext.includes('main_content')) bonus += 8;
      if (usageRecommendations.emailContext.includes('featured_image')) bonus += 6;
      if (usageRecommendations.emailContext.includes('hero_section')) bonus += 10;
    }
    
    console.log(`📊 Email relevance bonus для файла: +${bonus.toFixed(1)} баллов`);
    
  } catch (error) {
    console.log(`⚠️ Ошибка расчета email-бонуса: ${error.message}`);
  }
  
  return Math.round(bonus * 10) / 10; // Округляем до 1 знака после запятой
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
      // Контекстуальное совпадение удалено - используем только простые совпадения
      
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
 * Проверка семантической связи между тегами через простое сравнение
 */
function areTagsRelated(tag1: string, tag2: string): boolean {
  // Убрали hardcoded синонимы - используем только простое сравнение строк
  const t1 = tag1.toLowerCase();
  const t2 = tag2.toLowerCase();

  // Только базовое сравнение подстрок
  return t1.includes(t2) || t2.includes(t1);
}

// areTagsContextuallyRelated function removed - NO HARDCODED CONTEXTUAL GROUPS
// Contextual relations should be determined through AI analysis

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

  // Фаза 2: Дополняем результатами с учетом email-оптимизации и разнообразия
  const remainingResults = results.filter(result => !selected.includes(result));
  
  // Сортируем по комбинированному скору: релевантность + email-готовность + качество
  const sortedRemaining = remainingResults.sort((a, b) => {
    const aEmailScore = (a.qualityScores?.emailReadiness || 0) + (a.qualityScores?.qualityScore || 0) * 0.5;
    const bEmailScore = (b.qualityScores?.emailReadiness || 0) + (b.qualityScores?.qualityScore || 0) * 0.5;
    const aCombinedScore = a.relevanceScore + aEmailScore * 0.3;
    const bCombinedScore = b.relevanceScore + bEmailScore * 0.3;
    return bCombinedScore - aCombinedScore;
  });
  
  const usedEmailContexts = new Set<string>();
  const usedQualityLevels = new Set<string>();
  
  for (const result of sortedRemaining) {
    if (selected.length >= targetCount) break;
    
    const emotion = detectEmotionFromTags(result.allTags);
    
    // Анализируем email-контекст и качество для разнообразия
    const emailContext = result.usageRecommendations?.emailContext || [];
    const qualityLevel = result.metadata?.qualityLevel || 'unknown';
    
    // Приоритет для результатов с новыми характеристиками
    const hasNewTone = !usedTones.has(result.tone);
    const hasNewEmotion = emotion && !usedEmotions.has(emotion);
    const hasNewQuality = !usedQualityLevels.has(qualityLevel);
    const hasNewEmailContext = emailContext.some(ctx => !usedEmailContexts.has(ctx));
    
    // Приоритет для высококачественных email-оптимизированных изображений
    const isHighQuality = (result.qualityScores?.emailReadiness || 0) >= 80 && 
                         (result.qualityScores?.qualityScore || 0) >= 80;
    const isHighRelevance = result.relevanceScore >= 20;
    
    if (hasNewTone || hasNewEmotion || hasNewQuality || hasNewEmailContext || isHighQuality || isHighRelevance) {
      selected.push(result);
      usedTones.add(result.tone);
      usedQualityLevels.add(qualityLevel);
      
      // Отмечаем использованные email-контексты
      emailContext.forEach(ctx => usedEmailContexts.add(ctx));
      
      if (emotion) usedEmotions.add(emotion);
      
      const emailReadiness = result.qualityScores?.emailReadiness || 0;
      const qualityScore = result.qualityScores?.qualityScore || 0;
      
      console.log(`  ✅ Дополнительно выбран: ${result.fileName} (${result.folderName})`);
      console.log(`     📊 Score: ${result.relevanceScore}, Email: ${emailReadiness}%, Quality: ${qualityScore}%`);
      console.log(`     🎯 Contexts: ${emailContext.join(', ') || 'none'}, Quality: ${qualityLevel}`);
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
 * Определение эмоции из тегов файла - упрощенная версия без hardcoded значений
 */
function detectEmotionFromTags(tags: string[]): string | null {
  // Убрали hardcoded эмоциональные ключевые слова
  // Используем только базовую логику определения тона из метаданных файла
  return tags.length > 0 ? 'detected' : null;
}

// performFallbackSearch function removed - NO FALLBACK SEARCH ALLOWED
// All searches must be AI-powered and targeted

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
      width: result.metadata?.technical?.width || result.fullImageMetadata?.technical?.width || 400,
      height: result.metadata?.technical?.height || result.fullImageMetadata?.technical?.height || 300,
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
        
        // БОГАТЫЕ МЕТАДАННЫЕ ДЛЯ EMAIL-ОПТИМИЗАЦИИ
        emailCompatibility: result.emailCompatibility || {},
        emailUsage: result.emailUsage || {},
        qualityScores: result.qualityScores || {},
        
        // Визуальный и технический анализ
        visualAnalysis: result.visualAnalysis || {},
        technicalAnalysis: result.technicalAnalysis || {},
        usageRecommendations: result.usageRecommendations || {},
        
        // Базовые технические данные
        technical: result.metadata?.technical || result.fullImageMetadata?.technical || {},
        aiAnalysis: result.metadata?.aiAnalysis || result.aiAnalysis || {},
        figmaNodeId: result.metadata?.figmaNodeId || '',
        
        // Email-специфичные поля для принятия решений
        emailReadiness: result.metadata?.emailReadiness || 0,
        qualityLevel: result.metadata?.qualityLevel || 'unknown',
        recommendedFor: result.metadata?.recommendedFor || [],
        suitabilityRatings: result.metadata?.suitabilityRatings || {},
        
        // Дополнительная информация для логирования
        emailRelevanceBonus: result.emailRelevanceBonus || 0,
        isEmailOptimized: (result.qualityScores?.emailReadiness || 0) >= 70,
        isHighQuality: (result.qualityScores?.qualityScore || 0) >= 80
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
 * Получение информации о доступных папках через динамическое обнаружение
 */
export async function getLocalFigmaFoldersInfo(): Promise<ToolResult> {
  try {
    const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    
    // Динамически обнаруживаем папки
    const availableFolders = await discoverAvailableFolders(basePath);
    const foldersInfo: any = {};

    for (const folderName of availableFolders) {
      const folderPath = path.join(basePath, folderName);
      
      try {
        // Читаем статистику из agent-file-mapping.json
        const mappingPath = path.join(folderPath, 'agent-file-mapping.json');
        const mappingData: AgentFileMapping = JSON.parse(await fs.readFile(mappingPath, 'utf-8'));

        foldersInfo[folderName] = {
          name: folderName,
          description: `Динамически обнаруженная папка: ${folderName}`,
          totalFiles: mappingData.totalFiles,
          available: true,
          lastUpdated: mappingData.updatedAt
        };
      } catch (error) {
        foldersInfo[folderName] = {
          name: folderName,
          description: `Папка без метаданных: ${folderName}`,
          available: false,
          error: error.message
        };
      }
    }

    return {
      success: true,
      data: {
        folders: foldersInfo,
        totalFolders: availableFolders.length,
        availableFolders: Object.values(foldersInfo).filter((f: any) => f.available).length
      }
    };

  } catch (error) {
    return handleToolError('get_local_figma_folders_info', error);
  }
}

/**
 * Поиск реального имени файла по тегам и описанию
 */
async function findRealFileName(folderPath: string, entryKey: string, dictionaryEntry: any, mappingInfo: any): Promise<string | null> {
  try {
    // Читаем содержимое папки
    const files = await fs.readdir(folderPath);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    // Если нет файлов, возвращаем null
    if (pngFiles.length === 0) {
      return null;
    }
    
    // Получаем теги для поиска из mappingInfo или dictionaryEntry
    const searchTags = mappingInfo?.allTags || dictionaryEntry?.allTags || [];
    const description = mappingInfo?.description || '';
    
    // Ищем файл по соответствию тегов в названии
    let bestMatch = null;
    let maxMatches = 0;
    
    for (const fileName of pngFiles) {
      let matches = 0;
      const lowerFileName = fileName.toLowerCase();
      
      // Проверяем соответствие тегов
      for (const tag of searchTags) {
        if (lowerFileName.includes(tag.toLowerCase())) {
          matches++;
        }
      }
      
      // Дополнительные ключевые слова из описания
      if (description) {
        const descWords = description.toLowerCase().split(/\s+/);
        for (const word of descWords) {
          if (word.length > 3 && lowerFileName.includes(word)) {
            matches += 0.5; // Меньший вес для слов из описания
          }
        }
      }
      
      // Специальные соответствия для популярных ключей
      if (entryKey.includes('заяц') || entryKey.includes('кролик')) {
        if (lowerFileName.includes('кролик') || lowerFileName.includes('заяц')) {
          matches += 2;
        }
      }
      
      if (entryKey.includes('вино') || entryKey.includes('бокал')) {
        if (lowerFileName.includes('бокал') || lowerFileName.includes('вино')) {
          matches += 2;
        }
      }
      
      if (entryKey.includes('веселье') || entryKey.includes('праздник')) {
        if (lowerFileName.includes('веселый') || lowerFileName.includes('праздник')) {
          matches += 2;
        }
      }
      
      if (entryKey.includes('билет') || entryKey.includes('путешествие')) {
        if (lowerFileName.includes('билет') || lowerFileName.includes('путешеств')) {
          matches += 2;
        }
      }
      
      if (entryKey.includes('акция')) {
        if (lowerFileName.includes('акция') || lowerFileName.includes('скидка')) {
          matches += 2;
        }
      }
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = fileName;
      }
    }
    
    // Возвращаем лучшее соответствие, если найдено хотя бы одно совпадение
    if (bestMatch && maxMatches > 0) {
      console.log(`✅ Найдено соответствие для ${entryKey}: ${bestMatch} (${maxMatches} совпадений)`);
      return bestMatch;
    }
    
    // Если точного соответствия нет, возвращаем первый файл как fallback
    console.log(`⚠️ Точное соответствие для ${entryKey} не найдено, используем первый файл: ${pngFiles[0]}`);
    return pngFiles[0];
    
  } catch (error) {
    console.error(`❌ Ошибка при поиске файла для ${entryKey}:`, error);
    return null;
  }
} 