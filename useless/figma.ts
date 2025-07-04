// @ts-nocheck
// Temporary until figma tool refactor

import { config } from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

// OpenAI Agent SDK imports
import { Agent, tool, run } from '@openai/agents';
import { generateTraceId } from '../utils/tracing-utils';

// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-orchestrator';
import { logger } from '../core/logger';

// Define types locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface AssetInfo {
  path: string;
  url?: string;
  width?: number;
  height?: number;
  size?: number;
  metadata?: Record<string, any>;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}
import * as fs from 'fs/promises';
import { splitFigmaVariants } from './figma-variant-splitter';
import EmailFolderManager, { EmailFolder } from './email-folder-manager';
import { getUsageModel } from '../../shared/utils/model-config';

interface FigmaAssetParams {
  tags: string[];
  // Email folder для сохранения ассетов
  emailFolder?: EmailFolder;
  // Новые параметры для улучшенного выбора
  context?: {
    campaign_type?: 'urgent' | 'newsletter' | 'seasonal' | 'promotional' | 'informational';
    emotional_tone?: 'positive' | 'neutral' | 'urgent' | 'friendly';
    target_count?: number; // Количество изображений для выбора (по умолчанию 1-3)
    diversity_mode?: boolean; // Выбирать разнообразные изображения
    auto_split_variants?: boolean; // Автоматически разделять варианты
    preferred_variant?: 'first' | 'middle' | 'last' | 'auto'; // Предпочтительный вариант
  };
}

interface FigmaAssetResult {
  paths: string[];
  metadata: Record<string, AssetInfo>;
  selection_strategy: {
    strategy_used: string;
    reasoning: string;
    diversity_applied: boolean;
    randomization_factor: number;
  };
}

interface ScoredAsset {
  id: string;
  name: string;
  type: string;
  category: string;
  priority: number;
  score: number;
  aiAnalysis?: AIAnalysisResult;
  deduplicationHash: string;
  visualPriority: number;
}

interface AIAnalysisResult {
  visualImpact: number;        // 1-10: Визуальная привлекательность
  emailCompatibility: number; // 1-10: Совместимость с email
  brandAlignment: number;      // 1-10: Соответствие бренду
  contentRelevance: number;    // 1-10: Релевантность контенту
  description: string;         // Описание изображения
  reasoning: string;           // Объяснение оценки
  overallScore: number;        // Итоговая оценка
}

// FigmaAnalysisAgent - использует OpenAI Agent SDK для анализа изображений
class FigmaAnalysisAgent extends Agent {
  constructor() {
    super({
      name: 'FigmaAnalysisAgent',
      model: getUsageModel(),
      tools: [analyzeImageTool]
    });
  }
}

// Tool для анализа изображений
const analyzeImageTool = tool({
  name: 'analyze_figma_image',
  description: 'Analyze a Figma image for email marketing suitability',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      imageUrl: { type: 'string', description: 'URL of the image to analyze' },
      fileName: { type: 'string', description: 'Name of the image file' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Search tags for relevance' },
      assetType: { type: 'string', description: 'Type of the asset (COMPONENT, VECTOR, etc.)' }
    },
    required: ['imageUrl', 'fileName', 'tags']
  },
  async execute(params) {
    const analysisPrompt = `Проанализируй это изображение для использования в email-маркетинге.

КОНТЕКСТ ПОИСКА: ${params.tags.join(', ')}
ФАЙЛ: ${params.fileName}
ТИП: ${params.assetType || 'unknown'}

Оцени по шкале 1-10:
1. ВИЗУАЛЬНАЯ ПРИВЛЕКАТЕЛЬНОСТЬ (visual_impact): Насколько изображение привлекает внимание
2. EMAIL СОВМЕСТИМОСТЬ (email_compatibility): Подходит ли для email (размер, качество, читаемость)
3. СООТВЕТСТВИЕ БРЕНДУ (brand_alignment): Соответствует ли стилю Kupibilet
4. РЕЛЕВАНТНОСТЬ КОНТЕНТУ (content_relevance): Соответствует ли поисковым тегам

ВАЖНЫЕ ФАКТОРЫ ДЛЯ EMAIL:
- Изображение должно быть четким и читаемым в малом размере
- Подходящие цвета и контрастность
- Релевантность для путешествий/авиабилетов
- Эмоциональная привлекательность

Отвечай ТОЛЬКО в JSON формате:
{
  "visual_impact": 8,
  "email_compatibility": 7,
  "brand_alignment": 9,
  "content_relevance": 6,
  "description": "Краткое описание изображения",
  "reasoning": "Объяснение оценок",
  "overall_score": 7.5
}`;

    return analysisPrompt;
  }
});

// Exportable node types in Figma with visual priority
const VISUAL_PRIORITY_TYPES: Record<string, number> = {
  'COMPONENT': 10,      // Высший приоритет - готовые компоненты
  'COMPONENT_SET': 10,  // Наборы компонентов
  'VECTOR': 9,          // Векторная графика
  'FRAME': 8,           // Фреймы с содержимым
  'GROUP': 7,           // Группы элементов
  'RECTANGLE': 6,       // Геометрические фигуры
  'ELLIPSE': 6,
  'POLYGON': 6,
  'STAR': 6,
  'BOOLEAN_OPERATION': 5, // Булевы операции
  'INSTANCE': 5,        // Экземпляры компонентов
  'LINE': 4,            // Линии
  'TEXT': 3             // Текст - низший приоритет
};

// All exportable node types
const EXPORTABLE_NODE_TYPES = Object.keys(VISUAL_PRIORITY_TYPES);

// All hardcoded mappings removed - AI will determine appropriate tags dynamically

// enhanceTagsWithContext function removed - NO HARDCODED TAG ENHANCEMENT
// Tag enhancement should be done through AI analysis

// Enhanced node mapping for better AI understanding with optimized guide integration
const NODE_CATEGORIES = {
  // Travel and destinations
  travel: {
    keywords: ['paris', 'france', 'travel', 'trip', 'journey', 'destination', 'vacation', 'holiday', 
               'париж', 'франция', 'путешествие', 'поездка', 'отпуск', 'каникулы', 'романтика', 'romance', 
               'москва', 'moscow', 'акция', 'полет', 'flight'],
    description: 'Travel destinations, vacation themes, and tourism-related imagery',
    excludeKeywords: ['document', 'page', 'cover', 'обложка'],
    emotionalTones: ['positive', 'excited', 'adventurous']
  },
  
  // Tourist attractions and landmarks
  landmarks: {
    keywords: ['tower', 'eiffel', 'louvre', 'museum', 'castle', 'cathedral', 'monument',
               'башня', 'эйфелева', 'лувр', 'музей', 'замок', 'собор', 'памятник'],
    description: 'Famous landmarks, tourist attractions, and architectural wonders',
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['inspiring', 'cultural', 'prestigious']
  },
  
  // Rabbit characters - main mascots
  rabbits: {
    keywords: ['заяц', 'rabbit', 'общие'],
    description: 'Kupibilet rabbit mascot characters in various poses and expressions',
    emotion_keywords: [
      'недоволен', 'недовольный', 'серьезный', 'основной',
      'счастлив', 'счастливый', 'дополнительный', 'альтернатив',
      'озадачен', 'озадаченный', 'вопрос', 'помощь', 'faq',
      'нейтрален', 'нейтральный', 'деловой', 'официальный',
      'разозлен', 'разозленный', 'срочный', 'критичный',
      'грустн', 'грустный', 'извинение', 'компенсация'
    ],
    context_keywords: [
      'подборка', 'newsletter', 'предложение',
      'новости', 'анонс', 'информация',
      'faq', 'поддержка', 'справка'
    ],
    airline_keywords: [
      'основной', 'горизонтальный', 'вертикальный',
      'большой', 'малый', 'цветной', 'монохром'
    ],
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['friendly', 'helpful', 'approachable']
  },
  
  // Airlines and transportation
  airlines: {
    keywords: [
      'аэрофлот', 'авиакомпания-аэрофлот', 'основной', 'цветной', 'монохром',
      'turkish', 'авиакомпания-turkish-airlines', 'большой', 'малый',
      'utair', 'авиакомпания-utair',
      'nordwind', 'авиакомпания-nordwind', 'горизонтальный', 'вертикальный',
      'airline'
    ],
    description: 'Airline company logos and branding elements with variants',
    variants: {
      'аэрофлот': ['основной', 'цветной', 'монохром'],
      'turkish-airlines': ['основной', 'большой', 'малый'],
      'nordwind': ['основной', 'горизонтальный', 'вертикальный'],
      'utair': ['основной']
    },
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['professional', 'trustworthy', 'reliable']
  },
  
  // Email template types
  email_types: {
    keywords: ['подборка', 'новости', 'вопрос-ответ', 'общие'],
    description: 'Different email template categories and layouts',
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['informative', 'engaging', 'friendly']
  },
  
  // Specialized components
  specialized_components: {
    keywords: [
      'компонент-изменение-рейса', 'изменение', 'рейс',
      'компонент-отмена-рейса', 'отмена',
      'компонент-выбор-меню', 'выбор', 'меню', 'питание',
      'компонент-спокойная-стыковка', 'стыковка', 'пересадка',
      'компонент-паспортные-данные', 'паспорт', 'документы',
      'компонент-базовый-шаблон', 'базовый', 'шаблон',
      'компонент-расширенный-шаблон', 'расширенный'
    ],
    description: 'Specialized email components for specific scenarios',
    scenarios: {
      'изменение-рейса': ['изменение', 'перенос', 'время', 'рейс'],
      'отмена-рейса': ['отмена', 'аннулирование', 'возврат'],
      'выбор-меню': ['питание', 'меню', 'бортовое', 'выбор'],
      'спокойная-стыковка': ['стыковка', 'пересадка', 'транзит'],
      'паспортные-данные': ['документы', 'паспорт', 'виза', 'проверка'],
      'базовый-шаблон': ['стандарт', 'основной', 'базовый'],
      'расширенный-шаблон': ['расширенный', 'дополнительный', 'полный']
    },
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['helpful', 'informative', 'supportive']
  },
  
  // UI elements and icons
  ui_elements: {
    keywords: ['icon', 'element', 'component', 'brand'],
    description: 'UI components, icons, and brand elements',
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['clean', 'modern', 'functional']
  },
  
  // Colors and design tokens
  design_tokens: {
    keywords: ['цвет', 'color', 'rectangle'],
    description: 'Color palette and design system tokens',
    excludeKeywords: ['document', 'page'],
    emotionalTones: ['neutral', 'systematic', 'branded']
  }
};

/**
 * T1: Get Figma Assets Tool
 * Search and download assets from Figma project by tags with AI-powered selection and diversity
 */

export async function getFigmaAssets(params: FigmaAssetParams): Promise<ToolResult> {
  const traceId = generateTraceId();
  
  return ({
    name: 'get_figma_assets',
    metadata: { 
      trace_id: traceId,
      tags: params.tags,
      tag_count: params.tags?.length || 0,
      context: params.context
    }
  }, async () => {
    try {
      console.log(`🎯 [${traceId}] Getting Figma assets with LOCAL-ONLY mode (API disabled):`, params);

    // Validate parameters - теги могут быть пустыми, тогда используем контекст
    if (!params.tags) {
      params.tags = [];
    }
    
    // Если теги пустые, создаем базовые теги из контекста
          if (params.tags.length === 0) {
        console.log(`⚠️ [${traceId}] Теги не предоставлены, генерируем базовые теги из контекста`);
        const contextTags = [];
        
        if (params.context?.campaign_type) {
          contextTags.push(params.context.campaign_type);
        }
        if (params.context?.emotional_tone) {
          contextTags.push(params.context.emotional_tone);
        }
        
        // Добавляем общие теги если контекст тоже пустой
        if (contextTags.length === 0) {
          contextTags.push('общие', 'email', 'изображения');
        }
        
        params.tags = contextTags;
        console.log(`🏷️ [${traceId}] Сгенерированные контекстные теги:`, params.tags);
      }

      // FORCE LOCAL-ONLY MODE - API disabled as requested
      console.log(`🔍 [${traceId}] Using LOCAL-ONLY mode - Figma API disabled`);
    
    // Import the new local processor
    const { getLocalFigmaAssets } = await import('./figma-local-processor');
    
    // Convert parameters to match local processor interface
    const localParams = {
      tags: params.tags,
      context: {
        campaign_type: params.context?.campaign_type as 'seasonal' | 'promotional' | 'informational' | undefined,
        target_count: params.context?.target_count || 2,
        diversity_mode: params.context?.diversity_mode || false,
        preferred_emotion: params.context?.emotional_tone === 'positive' ? 'happy' as const : 
                          params.context?.emotional_tone === 'urgent' ? 'angry' as const :
                          params.context?.emotional_tone === 'neutral' ? 'neutral' as const : undefined,
        use_local_only: true
      }
    };
    
    console.log('📋 Calling local processor with params:', localParams);
    
    const localResult = await getLocalFigmaAssets(localParams);
    
    if (localResult.success && localResult.data) {
      console.log(`✅ Found ${localResult.data.length} local Figma assets`);
      
      // Convert local result to expected format
      const paths = localResult.data.map((asset: any) => asset.filePath);
      const metadata: Record<string, AssetInfo> = {};
      
      localResult.data.forEach((asset: any) => {
        metadata[asset.fileName] = {
          path: asset.filePath,
          url: `/${asset.filePath}`,
          width: asset.metadata?.technical?.width || 400,
          height: asset.metadata?.technical?.height || 300,
          metadata: {
            fileName: asset.fileName,
            folderName: asset.folderName,
            relevanceScore: asset.relevanceScore,
            matchedTags: asset.matchedTags,
            allTags: asset.allTags,
            description: asset.description,
            tone: asset.tone,
            confidence: asset.confidence,
            source: 'figma-local-processor',
            tags: params.tags,
            context: params.context
          }
        };
      });
      
      return {
        success: true,
        data: {
          paths,
          metadata,
          selection_strategy: {
            strategy_used: 'local-figma-processor',
            reasoning: 'Using intelligent local Figma asset search with context awareness',
            diversity_applied: localParams.context.diversity_mode,
            randomization_factor: 0
          }
        },
        metadata: {
          source: 'figma-local-processor',
          tags: params.tags,
          context: params.context,
          timestamp: new Date().toISOString(),
          total_found: localResult.data.length
        }
      };
    }
    
    throw new Error('No assets found in local Figma directory');

  } catch (error: any) {
    console.error(`❌ [${traceId}] Figma assets search failed:`, error.message);
    return handleToolError('get_figma_assets', error);
  }
  });
}

async function searchLocalFigmaAssetsEnhanced(
  tags: string[], 
  context?: FigmaAssetParams['context']
): Promise<FigmaAssetResult> {
  try {
    const figmaAssetsDir = path.resolve(process.cwd(), 'figma-assets');
    
    // Check if directory exists
    try {
      await fs.access(figmaAssetsDir);
    } catch {
      console.log('📁 figma-assets directory not found');
      return { 
        paths: [], 
        metadata: {},
        selection_strategy: {
          strategy_used: 'none',
          reasoning: 'No figma-assets directory found',
          diversity_applied: false,
          randomization_factor: 0
        }
      };
    }
    
    // Read all files in the directory
    const allFiles = await fs.readdir(figmaAssetsDir);
    const pngFiles = allFiles.filter(file => file.toLowerCase().endsWith('.png'));
    
    console.log(`📁 Found ${pngFiles.length} PNG files in figma-assets/`);
    console.log(`📋 Sample files: ${pngFiles.slice(0, 5).join(', ')}...`);
    
    // Enhanced scoring with context awareness
    const scoredFiles = await scoreFilesWithContext(pngFiles, tags, context);
    
    // Determine selection strategy based on context
    const selectionStrategy = determineSelectionStrategy(context);
    
    // Apply selection strategy
    const selectedFiles = applySelectionStrategy(scoredFiles, selectionStrategy);
    
    console.log('🏆 Enhanced selection results:');
    selectedFiles.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.file} (Score: ${item.finalScore.toFixed(2)}, Strategy: ${item.selectionReason})`);
    });
    
    const paths: string[] = [];
    const metadata: Record<string, AssetInfo> = {};
    
    // Process selected files
    for (const item of selectedFiles) {
      const relativePath = path.join('figma-assets', item.file);
      let finalPath = relativePath;
      let finalMetadata = {
        fileName: item.file,
        score: item.finalScore,
        matchedTags: item.matchedTags,
        category: item.category,
        emotionalTone: item.emotionalTone,
        selectionReason: item.selectionReason,
        source: 'figma-local-enhanced',
        tags: tags,
        context: context
      };

      // Автоматическое разделение вариантов через Figma API, если включено
      if (context?.auto_split_variants) {
        console.log(`🎯 Поиск вариантов через Figma API для: ${item.file}`);
        
        try {
          // Пытаемся найти соответствующий node в Figma по имени файла
          const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
          const figmaProjectId = process.env.FIGMA_PROJECT_ID;
          
          if (figmaToken && figmaProjectId) {
            const variantResult = await findAndSelectFigmaVariant(
              figmaToken, 
              figmaProjectId, 
              item.file, 
              context
            );

            if (variantResult) {
              console.log(`✅ Найден и выбран вариант: ${variantResult.selectedVariant.name}`);
              
              // Используем выбранный вариант вместо оригинального файла
              finalPath = variantResult.selectedVariant.path;
              finalMetadata = {
                ...finalMetadata,
                variantInfo: {
                  totalVariants: variantResult.totalVariants,
                  selectedVariant: variantResult.selectedVariant.name,
                  selectionReason: variantResult.selectionReason,
                  variantProperties: variantResult.selectedVariant.properties,
                  confidenceScore: variantResult.selectedVariant.confidence_score,
                  extractionMethod: 'figma_api_variants'
                },
                source: 'figma-api-enhanced-with-variants'
              } as any; // Type assertion to allow variantInfo property
            } else {
              console.log(`⚠️ Варианты не найдены в Figma API для ${item.file}, используем локальный файл`);
            }
          }
        } catch (error) {
          console.log(`❌ Ошибка поиска вариантов в Figma API для ${item.file}: ${error.message}`);
          // Продолжаем с оригинальным файлом
        }
      }
      
      paths.push(finalPath);
      metadata[item.file] = {
        path: finalPath,
        url: `/${finalPath}`,
        width: 400,
        height: 300,
        metadata: finalMetadata
      };
    }
    
    return { 
      paths, 
      metadata,
      selection_strategy: {
        strategy_used: selectionStrategy.name,
        reasoning: selectionStrategy.reasoning,
        diversity_applied: selectionStrategy.diversity_applied,
        randomization_factor: selectionStrategy.randomization_factor
      }
    };
    
  } catch (error) {
    console.error('Error in enhanced local Figma assets search:', error);
    return { 
      paths: [], 
      metadata: {},
      selection_strategy: {
        strategy_used: 'error',
        reasoning: `Search failed: ${error.message}`,
        diversity_applied: false,
        randomization_factor: 0
      }
    };
  }
}

interface ScoredFile {
  file: string;
  baseScore: number;
  contextScore: number;
  diversityScore: number;
  finalScore: number;
  matchedTags: string[];
  category: string;
  emotionalTone: string;
  selectionReason: string;
}

async function scoreFilesWithContext(
  files: string[], 
  tags: string[], 
  context?: FigmaAssetParams['context']
): Promise<ScoredFile[]> {
  const scoredFiles: ScoredFile[] = [];
  
  console.log(`🔍 Enhanced scoring for ${files.length} files with tags: [${tags.join(', ')}]`);
  if (context) {
    console.log(`🎯 Context: ${JSON.stringify(context)}`);
  }
  
  for (const file of files) {
    const fileName = file.toLowerCase();
    let baseScore = 0;
    let contextScore = 0;
    let diversityScore = 0;
    const matchedTags: string[] = [];
    let category = 'unknown';
    let emotionalTone = 'neutral';
    
    // Base scoring - existing logic enhanced
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      
      // Exact match gets highest score
      if (fileName.includes(tagLower)) {
        baseScore += 10;
        matchedTags.push(tag);
        console.log(`✅ Exact match: "${tagLower}" found in "${file}"`);
      }
      
      // Enhanced rabbit matching with emotional states
      if (tagLower === 'заяц' && (fileName.includes('заяц') || fileName.includes('rabbit'))) {
        baseScore += 10;
        matchedTags.push(tag);
        category = 'rabbits';
        
        // Detect emotional state from filename
        if (fileName.includes('счастлив') || fileName.includes('радост') || fileName.includes('happy')) {
          emotionalTone = 'positive';
          baseScore += 3;
        } else if (fileName.includes('недоволен') || fileName.includes('грустн') || fileName.includes('angry')) {
          emotionalTone = 'negative';
          baseScore += 3;
        } else if (fileName.includes('озадачен') || fileName.includes('вопрос')) {
          emotionalTone = 'confused';
          baseScore += 3;
        }
        
        console.log(`🐰 Enhanced rabbit match: "${tag}" in "${file}" (emotion: ${emotionalTone})`);
      }
      
      // Enhanced airline matching
      if (tagLower === 'аэрофлот' && fileName.includes('аэрофлот')) {
        baseScore += 8;
        matchedTags.push(tag);
        category = 'airlines';
        emotionalTone = 'professional';
      }
      
      // Enhanced destination matching
      if ((tagLower === 'париж' || tagLower === 'paris') && (fileName.includes('париж') || fileName.includes('paris'))) {
        baseScore += 12; // Higher score for destination matches
        matchedTags.push(tag);
        category = 'travel';
        emotionalTone = 'exciting';
      }
    }
    
    // Context-aware scoring
    if (context) {
      contextScore = calculateContextScore(fileName, context, category, emotionalTone);
    }
    
    // Diversity scoring (helps avoid same images)
    diversityScore = calculateDiversityScore(fileName, files);
    
    // Final score calculation with randomization
    const randomizationFactor = context?.diversity_mode ? (Math.random() * 2) : 0.5;
    const finalScore = (baseScore * 0.6) + (contextScore * 0.3) + (diversityScore * 0.1) + randomizationFactor;
    
    if (finalScore > 0) {
      scoredFiles.push({
        file,
        baseScore,
        contextScore,
        diversityScore,
        finalScore,
        matchedTags,
        category,
        emotionalTone,
        selectionReason: generateSelectionReason(baseScore, contextScore, diversityScore, context)
      });
      
      console.log(`📊 Enhanced scoring: "${file}" - Base: ${baseScore}, Context: ${contextScore.toFixed(1)}, Diversity: ${diversityScore.toFixed(1)}, Final: ${finalScore.toFixed(2)}`);
    }
  }
  
  return scoredFiles;
}

function calculateContextScore(
  fileName: string, 
  context: FigmaAssetParams['context'], 
  category: string, 
  emotionalTone: string
): number {
  let score = 0;
  
  // Campaign type alignment
  if (context?.campaign_type) {
    switch (context.campaign_type) {
      case 'urgent':
        if (emotionalTone === 'urgent' || fileName.includes('срочн') || fileName.includes('горящ')) {
          score += 5;
        }
        if (fileName.includes('билет дня') || fileName.includes('акция')) {
          score += 3;
        }
        break;
      case 'newsletter':
        if (fileName.includes('подборка') || fileName.includes('newsletter')) {
          score += 5;
        }
        if (emotionalTone === 'friendly' || emotionalTone === 'positive') {
          score += 2;
        }
        break;
      case 'seasonal':
        if (fileName.includes('сезон') || fileName.includes('лет') || fileName.includes('зим')) {
          score += 5;
        }
        break;
      case 'promotional':
        if (fileName.includes('акция') || fileName.includes('скидк') || fileName.includes('специальн')) {
          score += 5;
        }
        break;
    }
  }
  
  // Emotional tone alignment
  if (context?.emotional_tone) {
    if (context.emotional_tone === emotionalTone) {
      score += 4;
    } else {
      // Partial matches
      if (context.emotional_tone === 'positive' && (emotionalTone === 'exciting' || emotionalTone === 'friendly')) {
        score += 2;
      }
      if (context.emotional_tone === 'urgent' && emotionalTone === 'negative') {
        score += 2;
      }
    }
  }
  
  return score;
}

function calculateDiversityScore(fileName: string, allFiles: string[]): number {
  // Encourage selection of files with different characteristics
  let score = 0;
  
  // Prefer files with numbers (variants) - but cap the score to prevent huge numbers
  if (fileName.match(/\d+/)) {
    const numbers = fileName.match(/\d+/g);
    if (numbers) {
      // Small bonus for numbered variants, capped at 2 points
      const number = parseInt(numbers[0]);
      score += Math.min(number / 100, 2); // Much smaller impact, max 2 points
    }
  }
  
  // Prefer files with resolution indicators
  if (fileName.includes('x1') || fileName.includes('x2') || fileName.includes('x4')) {
    score += 0.5; // Reduced from 1
  }
  
  // Add small randomness to prevent always picking the same files
  score += Math.random() * 0.5; // Reduced from 2
  
  return score;
}

function generateSelectionReason(
  baseScore: number, 
  contextScore: number, 
  diversityScore: number, 
  context?: FigmaAssetParams['context']
): string {
  const reasons = [];
  
  if (baseScore > 8) {
    reasons.push('strong tag match');
  }
  if (contextScore > 3) {
    reasons.push('context alignment');
  }
  if (diversityScore > 1.5) {
    reasons.push('diversity factor');
  }
  if (context?.diversity_mode) {
    reasons.push('diversity mode');
  }
  
  return reasons.length > 0 ? reasons.join(', ') : 'basic match';
}

interface SelectionStrategy {
  name: string;
  reasoning: string;
  target_count: number;
  diversity_applied: boolean;
  randomization_factor: number;
}

function determineSelectionStrategy(context?: FigmaAssetParams['context']): SelectionStrategy {
  const targetCount = context?.target_count || 1;
  
  if (context?.diversity_mode) {
    return {
      name: 'diversity_focused',
      reasoning: 'Maximizing variety in image selection',
      target_count: Math.max(targetCount, 2),
      diversity_applied: true,
      randomization_factor: 0.8
    };
  }
  
  if (context?.campaign_type === 'urgent') {
    return {
      name: 'urgency_focused',
      reasoning: 'Prioritizing urgent/hot deal imagery',
      target_count: 1,
      diversity_applied: false,
      randomization_factor: 0.2
    };
  }
  
  if (context?.campaign_type === 'newsletter') {
    return {
      name: 'newsletter_balanced',
      reasoning: 'Balanced selection for regular newsletter',
      target_count: Math.max(targetCount, 2),
      diversity_applied: true,
      randomization_factor: 0.6
    };
  }
  
  return {
    name: 'standard',
    reasoning: 'Standard selection algorithm',
    target_count: targetCount,
    diversity_applied: false,
    randomization_factor: 0.3
  };
}

function applySelectionStrategy(
  scoredFiles: ScoredFile[], 
  strategy: SelectionStrategy
): ScoredFile[] {
  // Sort by final score
  const sortedFiles = [...scoredFiles].sort((a, b) => b.finalScore - a.finalScore);
  
  if (strategy.diversity_applied) {
    // Apply diversity selection
    return selectDiverseFiles(sortedFiles, strategy.target_count);
  } else {
    // Take top N files
    return sortedFiles.slice(0, strategy.target_count);
  }
}

function selectDiverseFiles(files: ScoredFile[], targetCount: number): ScoredFile[] {
  const selected: ScoredFile[] = [];
  const usedCategories = new Set<string>();
  const usedEmotionalTones = new Set<string>();
  
  // First pass: select best file from each category/emotion
  for (const file of files) {
    if (selected.length >= targetCount) break;
    
    const categoryKey = `${file.category}-${file.emotionalTone}`;
    if (!usedCategories.has(categoryKey)) {
      selected.push(file);
      usedCategories.add(categoryKey);
      usedEmotionalTones.add(file.emotionalTone);
    }
  }
  
  // Second pass: fill remaining slots with top scored files
  for (const file of files) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(file)) {
      selected.push(file);
    }
  }
  
  return selected.slice(0, targetCount);
}

async function fetchFromFigmaWithAI(token: string, projectId: string, tags: string[], emailFolder?: EmailFolder): Promise<FigmaAssetResult> {
  const headers = {
    'X-Figma-Token': token,
    'Content-Type': 'application/json'
  };

  // Get the full file structure to search through all nodes
  const fileUrl = `https://api.figma.com/v1/files/${projectId}`;
  const response = await fetch(fileUrl, { headers });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const matchedAssets: string[] = [];
  const metadata: Record<string, AssetInfo> = {};

  // STEP 1: Enhanced node matching with smart filtering
  console.log('🎯 Step 1: Finding and filtering nodes...');
  const candidateNodes = findSmartMatchingNodes(data.document, tags);
  
  console.log(`📊 Found ${candidateNodes.length} candidates after smart filtering`);

  if (candidateNodes.length > 0) {
    // STEP 2: Get top 10 candidates for AI analysis
    const topCandidates = candidateNodes.slice(0, 10);
    console.log(`🎯 Step 2: Analyzing top ${topCandidates.length} candidates...`);
    
    // Export nodes as images for AI analysis
    const nodeIds = topCandidates.map(node => encodeURIComponent(node.id));
    const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(projectId)}?ids=${nodeIds.join(',')}&format=png&scale=1`;
    
    const exportResponse = await fetch(exportUrl, { headers });
    
    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      console.error(`Export failed with status ${exportResponse.status}:`, errorText);
      throw new Error(`Failed to export images: ${exportResponse.status} ${exportResponse.statusText}`);
    }
    
    const exportData = await exportResponse.json();
    
    if (exportData.err) {
      console.error('Figma export error:', exportData.err);
      throw new Error(`Figma export error: ${exportData.err}`);
    }

    // STEP 3: Download and analyze images with AI
    console.log('🤖 Step 3: AI analysis of images...');
    const analyzedAssets = await analyzeImagesWithAI(topCandidates, exportData.images, tags);
    
    // STEP 4: Select best 3 based on AI analysis
    const bestAssets = analyzedAssets
      .sort((a, b) => b.aiAnalysis!.overallScore - a.aiAnalysis!.overallScore)
      .slice(0, 3);
    
    console.log('🏆 Step 4: Selected best assets:');
    bestAssets.forEach((asset, index) => {
      const analysis = asset.aiAnalysis!;
      console.log(`  ${index + 1}. ${asset.name} (${asset.type}) - Score: ${analysis.overallScore.toFixed(2)}`);
      console.log(`     Visual Impact: ${analysis.visualImpact}, Email Compatibility: ${analysis.emailCompatibility}`);
      console.log(`     Reasoning: ${analysis.reasoning.substring(0, 100)}...`);
    });

    // Download and save the best assets
    for (const asset of bestAssets) {
      const imageUrl = exportData.images[asset.id];
      
      if (imageUrl) {
        const fileName = `figma-ai-${asset.name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()}-score-${asset.aiAnalysis!.overallScore.toFixed(1)}.png`;
        const localPath = await downloadImage(imageUrl, fileName, emailFolder);
        
        matchedAssets.push(localPath);
        metadata[fileName] = {
          path: localPath,
          url: imageUrl,
          width: 400,
          height: 300,
          metadata: {
            figmaNodeId: asset.id,
            nodeName: asset.name,
            nodeType: asset.type,
            category: asset.category,
            priority: asset.priority,
            visualPriority: asset.visualPriority,
            aiScore: asset.aiAnalysis!.overallScore,
            aiAnalysis: asset.aiAnalysis,
            description: asset.aiAnalysis!.description,
            source: 'figma-ai',
            tags: tags
          }
        };
        
        console.log(`📁 Downloaded: ${fileName} (AI Score: ${asset.aiAnalysis!.overallScore.toFixed(2)})`);
      }
    }
  }

  return {
    paths: matchedAssets,
    metadata,
    selection_strategy: {
      strategy_used: 'figma_ai_analysis',
      reasoning: 'Used Figma API with AI analysis for optimal selection',
      diversity_applied: true,
      randomization_factor: 0.2
    }
  };
}

function findSmartMatchingNodes(node: any, tags: string[]): ScoredAsset[] {
  const matches: ScoredAsset[] = [];
  const seenHashes = new Set<string>(); // For deduplication

  function traverse(currentNode: any): void {
    // Skip if node is not exportable
    if (!currentNode.type || !EXPORTABLE_NODE_TYPES.includes(currentNode.type)) {
      if (currentNode.children && Array.isArray(currentNode.children)) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
      return;
    }

    // Skip if node is not visible or has no name
    if (!currentNode.name || currentNode.visible === false) {
      if (currentNode.children && Array.isArray(currentNode.children)) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
      return;
    }

    const nodeName = currentNode.name.toLowerCase();
    
    // Create deduplication hash
    const position = `${currentNode.absoluteBoundingBox?.x || 0},${currentNode.absoluteBoundingBox?.y || 0}`;
    const size = `${currentNode.absoluteBoundingBox?.width || 0}x${currentNode.absoluteBoundingBox?.height || 0}`;
    const deduplicationHash = `${nodeName}-${currentNode.type}-${position}-${size}`;
    
    // Skip if we've seen this exact element before
    if (seenHashes.has(deduplicationHash)) {
      if (currentNode.children && Array.isArray(currentNode.children)) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
      return;
    }

    // Check each category for matches
    for (const [categoryName, category] of Object.entries(NODE_CATEGORIES)) {
      // Skip if node name contains excluded keywords
      if (category.excludeKeywords && category.excludeKeywords.some(exclude => 
        nodeName.includes(exclude.toLowerCase())
      )) {
        continue;
      }

      // Check for keyword matches
      const hasKeywordMatch = category.keywords.some(keyword => {
        if (keyword.length <= 3) {
          return nodeName === keyword.toLowerCase();
        }
        return nodeName.includes(keyword.toLowerCase()) || 
               tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()));
      });
      
      // Special handling for emotional rabbit states
      if (categoryName === 'rabbits' && 'emotion_keywords' in category && category.emotion_keywords) {
        const hasEmotionMatch = category.emotion_keywords.some((emotion: string) =>
          nodeName.includes(emotion.toLowerCase()) ||
          tags.some(tag => tag.toLowerCase().includes(emotion.toLowerCase()))
        );
        
        if (hasKeywordMatch || hasEmotionMatch) {
          const priority = hasEmotionMatch ? 10 : 8;
          const visualPriority = VISUAL_PRIORITY_TYPES[currentNode.type] || 1;
          const combinedScore = priority + visualPriority;
          
          matches.push({
            id: currentNode.id,
            name: currentNode.name,
            type: currentNode.type,
            category: categoryName,
            priority,
            score: combinedScore,
            deduplicationHash,
            visualPriority
          });
          
          seenHashes.add(deduplicationHash);
        }
      } else if (hasKeywordMatch) {
        const hasDirectTagMatch = tags.some(tag => {
          const tagLower = tag.toLowerCase();
          return nodeName.includes(tagLower) || tagLower.includes(nodeName);
        });
        
        if (hasDirectTagMatch || category.keywords.some(keyword => 
          keyword.length > 3 && nodeName.includes(keyword.toLowerCase())
        )) {
          const basePriority = categoryName === 'travel' ? 12 :     
                              categoryName === 'landmarks' ? 11 :   
                              categoryName === 'rabbits' ? 9 : 
                              categoryName === 'specialized_components' ? 8 :
                              categoryName === 'airlines' ? 7 :
                              categoryName === 'email_types' ? 6 : 5;
          
          const visualPriority = VISUAL_PRIORITY_TYPES[currentNode.type] || 1;
          const combinedScore = basePriority + visualPriority;
          
          matches.push({
            id: currentNode.id,
            name: currentNode.name,
            type: currentNode.type,
            category: categoryName,
            priority: basePriority,
            score: combinedScore,
            deduplicationHash,
            visualPriority
          });
          
          seenHashes.add(deduplicationHash);
        }
      }
    }

    // Continue searching children
    if (currentNode.children && Array.isArray(currentNode.children)) {
      for (const child of currentNode.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  
  // Sort by combined score (priority + visual priority)
  return matches.sort((a, b) => b.score - a.score);
}

async function analyzeImagesWithAI(candidates: ScoredAsset[], imageUrls: Record<string, string>, tags: string[]): Promise<ScoredAsset[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API key not found, using basic scoring');
    return candidates.map(candidate => ({
      ...candidate,
      aiAnalysis: {
        visualImpact: candidate.visualPriority,
        emailCompatibility: candidate.type === 'TEXT' ? 3 : 7,
        brandAlignment: 5,
        contentRelevance: candidate.priority,
        description: `${candidate.type} element named "${candidate.name}"`,
        reasoning: 'Basic scoring used (no OpenAI API key)',
        overallScore: (candidate.score + candidate.visualPriority) / 2
      }
    }));
  }

  const analyzedAssets: ScoredAsset[] = [];

  for (const candidate of candidates) {
    const imageUrl = imageUrls[candidate.id];
    
    if (!imageUrl) {
      console.warn(`⚠️ No image URL for candidate: ${candidate.name}`);
      continue;
    }

    try {
      console.log(`🔍 Analyzing: ${candidate.name} (${candidate.type})`);
      
      const analysis = await analyzeImageWithOpenAI(imageUrl, candidate, tags);
      
      analyzedAssets.push({
        ...candidate,
        aiAnalysis: analysis
      });
      
    } catch (error) {
      console.warn(`⚠️ AI analysis failed for ${candidate.name}:`, error);
      
              // Use basic scoring
      analyzedAssets.push({
        ...candidate,
        aiAnalysis: {
          visualImpact: candidate.visualPriority,
          emailCompatibility: candidate.type === 'TEXT' ? 3 : 7,
          brandAlignment: 5,
          contentRelevance: candidate.priority,
          description: `${candidate.type} element named "${candidate.name}"`,
          reasoning: 'AI analysis failed, using basic scoring',
          overallScore: (candidate.score + candidate.visualPriority) / 2
        }
      });
    }
  }

  return analyzedAssets;
}

async function analyzeImageWithOpenAI(imageUrl: string, candidate: ScoredAsset, tags: string[]): Promise<AIAnalysisResult> {
  const traceId = generateTraceId();
  
  return ({
    name: 'analyze_figma_image',
    metadata: { 
      trace_id: traceId,
      candidate_name: candidate.name,
      candidate_type: candidate.type,
      tags: tags
    }
  }, async () => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found. OPENAI_API_KEY environment variable is required for AI image analysis.');
      }

      console.log(`🔍 [${traceId}] Analyzing via Agent SDK: ${candidate.name} (${candidate.type})`);

      // Create Figma analysis agent
      const analysisAgent = new FigmaAnalysisAgent();

      console.log(`🔧 [${traceId}] Starting image analysis...`);
      
      // Generate analysis using agent
      const response = await run(analysisAgent, `Analyze this Figma image for email marketing`, {
        tools: {
          analyze_figma_image: {
            imageUrl: imageUrl,
            fileName: candidate.name,
            tags: tags,
            assetType: candidate.type
          }
        }
      });

      // Parse response 
      const analysis = await parseAnalysisResponse(response);
      
      // Calculate overall score
      const overallScore = (
        analysis.visualImpact * 0.3 +
        analysis.emailCompatibility * 0.3 +
        analysis.brandAlignment * 0.2 +
        analysis.contentRelevance * 0.2
      );

      console.log(`✅ [${traceId}] Image analysis completed - Score: ${overallScore.toFixed(1)}`);

      return {
        visualImpact: analysis.visualImpact,
        emailCompatibility: analysis.emailCompatibility,
        brandAlignment: analysis.brandAlignment,
        contentRelevance: analysis.contentRelevance,
        description: analysis.description,
        reasoning: analysis.reasoning,
        overallScore: Math.round(overallScore * 100) / 100
      };

    } catch (error: any) {
      console.error(`❌ [${traceId}] Image analysis failed:`, error.message);
      throw new Error(`AI image analysis via Agent SDK failed: ${error.message}`);
    }
  });
}

// Parse analysis response and extract scores
async function parseAnalysisResponse(response: any): Promise<{
  visualImpact: number;
  emailCompatibility: number;
  brandAlignment: number;
  contentRelevance: number;
  description: string;
  reasoning: string;
}> {
  try {
    // Extract content from agent response
    let content = '';
    if (response && typeof response === 'string') {
      content = response;
    } else if (response?.content) {
      content = response.content;
    } else if (response?.text) {
      content = response.text;
    } else {
      throw new Error('Invalid agent response format');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    const requiredFields = ['visual_impact', 'email_compatibility', 'brand_alignment', 'content_relevance', 'description', 'reasoning'];
    for (const field of requiredFields) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      visualImpact: analysis.visual_impact,
      emailCompatibility: analysis.email_compatibility,
      brandAlignment: analysis.brand_alignment,
      contentRelevance: analysis.content_relevance,
      description: analysis.description,
      reasoning: analysis.reasoning
    };

  } catch (parseError: any) {
    console.error('Failed to parse analysis response:', parseError.message);
    throw new Error(`Failed to parse analysis response: ${parseError.message}`);
  }
}

async function downloadImage(url: string, fileName: string, emailFolder?: EmailFolder): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();

  // Если есть emailFolder, сохраняем в папку кампании
  if (emailFolder) {
    const outputPath = await EmailFolderManager.saveFigmaAsset(emailFolder, url, fileName);
    console.log(`✅ Downloaded to email folder: ${fileName} -> ${outputPath}`);
    return outputPath;
  } else {
    // Fallback - сохраняем в старую папку mails
    const mailsDir = path.join(process.cwd(), 'mails');
    await fs.mkdir(mailsDir, { recursive: true });
    const filePath = path.join(mailsDir, fileName);
    await fs.writeFile(filePath, Buffer.from(buffer));
    console.log(`✅ Downloaded to mails folder: ${fileName} -> ${filePath}`);
    return filePath;
  }
}

/**
 * Поиск и выбор варианта из Figma API по имени файла
 */
export async function findAndSelectFigmaVariant(
  token: string,
  projectId: string, 
  fileName: string,
  context: FigmaAssetParams['context']
): Promise<{
  selectedVariant: {
    name: string;
    path: string;
    properties: Record<string, string>;
    confidence_score: number;
  };
  totalVariants: number;
  selectionReason: string;
} | null> {
  
  try {
    console.log(`🔍 Ищем компонент в Figma для файла: ${fileName}`);
    
    // Извлекаем базовое имя компонента из имени файла
    const baseName = extractComponentNameFromFileName(fileName);
    console.log(`📝 Базовое имя компонента: "${baseName}"`);
    
    // Получаем все компоненты проекта
    const fileUrl = `https://api.figma.com/v1/files/${projectId}`;
    const response = await fetch(fileUrl, {
      headers: { 'X-Figma-Token': token }
    });
    
    if (!response.ok) {
      throw new Error(`Figma API request failed: ${response.status}`);
    }
    
    const fileData = await response.json();
    
    if (fileData.err) {
      throw new Error(`Figma API error: ${fileData.err}`);
    }
    
    // Ищем подходящий компонент
    const matchingComponent = findMatchingComponent(fileData.document, baseName);
    
    if (!matchingComponent) {
      console.log(`⚠️ Компонент "${baseName}" не найден в Figma`);
      return null;
    }
    
    console.log(`✅ Найден компонент: ${matchingComponent.name} (${matchingComponent.type})`);
    
    // Если это COMPONENT_SET, получаем варианты
    if (matchingComponent.type === 'COMPONENT_SET' && matchingComponent.children) {
      console.log(`🎨 Найдено ${matchingComponent.children.length} вариантов`);
      
      // Выбираем лучший вариант на основе контекста
      const selectedVariantNode = selectBestVariantFromNodes(matchingComponent.children, context);
      
      console.log(`🎯 Выбран вариант: ${selectedVariantNode.name}`);
      
      // Экспортируем выбранный вариант
      const exportUrl = `https://api.figma.com/v1/images/${encodeURIComponent(projectId)}?ids=${selectedVariantNode.id}&format=png&scale=2`;
      
      const exportResponse = await fetch(exportUrl, {
        headers: { 'X-Figma-Token': token }
      });
      
      const exportData = await exportResponse.json();
      
      if (exportData.err) {
        throw new Error(`Export failed: ${exportData.err}`);
      }
      
      const imageUrl = exportData.images[selectedVariantNode.id];
      if (!imageUrl) {
        throw new Error('No image URL returned from export');
      }
      
      // Скачиваем выбранный вариант
      const variantFileName = `${baseName}-${sanitizeVariantName(selectedVariantNode.name)}.png`;
      const downloadedPath = await downloadImage(imageUrl, variantFileName);
      
      return {
        selectedVariant: {
          name: selectedVariantNode.name,
          path: downloadedPath,
          properties: selectedVariantNode.variantProperties || {},
          confidence_score: 0.9
        },
        totalVariants: matchingComponent.children.length,
        selectionReason: generateVariantSelectionReason(selectedVariantNode, context)
      };
      
    } else {
      // Это обычный компонент без вариантов
      console.log(`📄 Обычный компонент без вариантов`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Ошибка поиска вариантов: ${error.message}`);
    return null;
  }
}

/**
 * Извлечение имени компонента из имени файла
 */
function extractComponentNameFromFileName(fileName: string): string {
  // Убираем расширение и суффиксы типа -x1, -variant-1 и т.д.
  let baseName = fileName
    .replace(/\.png$/, '')
    .replace(/-x\d+.*$/, '')
    .replace(/-variant-\d+.*$/, '')
    .trim();
  
  // Для файлов типа "заяц -Общие- 09-x1.png" извлекаем основную часть
  // Убираем номера в конце
  baseName = baseName.replace(/\s*\d+\s*$/, '');
  
  console.log(`📝 Извлечённое базовое имя: "${baseName}" из "${fileName}"`);
  
  return baseName;
}

/**
 * Поиск подходящего компонента в дереве Figma
 */
function findMatchingComponent(node: any, targetName: string): any {
  if (!node) return null;
  
  const matches: any[] = [];
  
  function searchRecursively(currentNode: any): void {
    if (!currentNode) return;
    
    // Проверяем текущий узел
    if (currentNode.name && (currentNode.type === 'COMPONENT_SET' || currentNode.type === 'COMPONENT')) {
      const nodeName = currentNode.name.toLowerCase();
      const searchName = targetName.toLowerCase();
      
      // Точное совпадение
      if (nodeName === searchName) {
        matches.push({ node: currentNode, score: 100 });
      }
      // Содержит искомое имя
      else if (nodeName.includes(searchName)) {
        matches.push({ node: currentNode, score: 80 });
      }
      // Обратное совпадение (искомое содержит имя узла)
      else if (searchName.includes(nodeName)) {
        matches.push({ node: currentNode, score: 60 });
      }
      // Частичное совпадение по словам
      else {
        const nodeWords = nodeName.split(/[\s\-_«»"]+/).filter(w => w.length > 2);
        const searchWords = searchName.split(/[\s\-_«»"]+/).filter(w => w.length > 2);
        
        let matchingWords = 0;
        for (const searchWord of searchWords) {
          for (const nodeWord of nodeWords) {
            if (nodeWord.includes(searchWord) || searchWord.includes(nodeWord)) {
              matchingWords++;
              break;
            }
          }
        }
        
        if (matchingWords > 0) {
          const score = (matchingWords / Math.max(nodeWords.length, searchWords.length)) * 40;
          if (score > 10) {
            matches.push({ node: currentNode, score });
          }
        }
      }
    }
    
    // Рекурсивно ищем в дочерних узлах
    if (currentNode.children) {
      for (const child of currentNode.children) {
        searchRecursively(child);
      }
    }
  }
  
  searchRecursively(node);
  
  if (matches.length === 0) {
    console.log(`❌ Не найдено совпадений для "${targetName}"`);
    return null;
  }
  
  // Сортируем по score и возвращаем лучший
  matches.sort((a, b) => b.score - a.score);
  
  console.log(`✅ Найдено ${matches.length} совпадений для "${targetName}":`);
  matches.slice(0, 3).forEach((match, i) => {
    console.log(`  ${i + 1}. "${match.node.name}" (${match.node.type}, score: ${match.score.toFixed(1)})`);
  });
  
  return matches[0].node;
}

/**
 * Выбор лучшего варианта из списка узлов на основе контекста
 */
function selectBestVariantFromNodes(
  variants: any[], 
  context?: FigmaAssetParams['context']
): any {
  
  if (variants.length === 0) {
    throw new Error('No variants available');
  }
  
  if (variants.length === 1) {
    return variants[0];
  }
  
  // Сортируем варианты по Y-координате (для вертикального расположения)
  const sortedVariants = [...variants].sort((a, b) => {
    const aY = a.absoluteBoundingBox?.y || 0;
    const bY = b.absoluteBoundingBox?.y || 0;
    return aY - bY;
  });
  
  let selectedIndex = 0;
  
  if (context?.preferred_variant) {
    switch (context.preferred_variant) {
      case 'first':
        selectedIndex = 0;
        break;
      case 'middle':
        selectedIndex = Math.floor(sortedVariants.length / 2);
        break;
      case 'last':
        selectedIndex = sortedVariants.length - 1;
        break;
      case 'auto':
        selectedIndex = selectVariantByContextFromNodes(sortedVariants, context);
        break;
    }
  } else if (context?.emotional_tone || context?.campaign_type) {
    selectedIndex = selectVariantByContextFromNodes(sortedVariants, context);
  }
  
  return sortedVariants[selectedIndex];
}

/**
 * Автоматический выбор варианта на основе контекста кампании
 */
function selectVariantByContextFromNodes(
  variants: any[], 
  context: FigmaAssetParams['context']
): number {
  
  // Анализируем properties вариантов для более умного выбора
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const props = variant.variantProperties || {};
    const propValues = Object.values(props).join(' ').toLowerCase();
    
    // Проверяем соответствие контексту по properties
    if (context?.emotional_tone === 'urgent' && 
        (propValues.includes('variant1') || propValues.includes('первый'))) {
      return i;
    }
    
    if (context?.emotional_tone === 'friendly' && 
        (propValues.includes('variant3') || propValues.includes('третий'))) {
      return i;
    }
    
    if (context?.campaign_type === 'newsletter' && 
        (propValues.includes('variant2') || propValues.includes('второй'))) {
      return i;
    }
  }
  
  // Если специфичное соответствие не найдено, используем общую логику
  if (context?.emotional_tone === 'urgent' || context?.campaign_type === 'urgent') {
    return 0; // Первый вариант для срочности
  }
  
  if (context?.emotional_tone === 'neutral' || context?.campaign_type === 'informational') {
    return Math.floor(variants.length / 2); // Средний для нейтральности
  }
  
  if (context?.emotional_tone === 'friendly' || context?.campaign_type === 'newsletter') {
    return variants.length - 1; // Последний для дружелюбности
  }
  
  // По умолчанию средний
  return Math.floor(variants.length / 2);
}

/**
 * Очистка имени варианта для использования в имени файла
 */
function sanitizeVariantName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9а-яА-Я\s\-_=]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Генерация объяснения выбора варианта
 */
function generateVariantSelectionReason(
  variant: any, 
  context?: FigmaAssetParams['context']
): string {
  const props = variant.variantProperties || {};
  const propString = Object.entries(props)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  let reason = `Выбран вариант "${variant.name}"`;
  
  if (propString) {
    reason += ` (${propString})`;
  }
  
  if (context?.preferred_variant) {
    reason += ` по предпочтению: ${context.preferred_variant}`;
  } else if (context?.emotional_tone || context?.campaign_type) {
    reason += ` на основе контекста: ${context.emotional_tone || context.campaign_type}`;
  }
  
  return reason;
} 