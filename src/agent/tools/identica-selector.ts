// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-handler';
import { logger } from '../core/logger';

// Define ToolResult locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}
import * as path from 'path';
import * as fs from 'fs/promises';

interface IdenticaAsset {
  fileName: string;
  filePath: string;
  shortName: string;
  tags: string[];
  description: string;
  tone: string;
  confidence: number;
  usageContext: string[];
  figmaNodeId?: string;
}

interface IdenticaSelectionParams {
  campaign_type?: 'promotional' | 'informational' | 'brand' | 'logo' | 'premium';
  emotional_tone?: 'позитивный' | 'нейтральный' | 'дружелюбный';
  usage_context?: string[];
  tags?: string[];
  target_count?: number;
  prefer_logo?: boolean;
  prefer_premium?: boolean;
}

interface IdenticaSelectionResult {
  selected_assets: IdenticaAsset[];
  total_available: number;
  selection_criteria: string;
  confidence_score: number;
}

/**
 * T16: Identica Creative Selector
 * Выбирает креативы из папки айдентика на основе критериев кампании
 */
export async function selectIdenticaCreatives(params: IdenticaSelectionParams): Promise<ToolResult> {
  try {
    console.log('🎨 T16: Selecting identica creatives with params:', params);
    
    const identicaPath = path.join(process.cwd(), 'figma-all-pages-1750993353363', 'айдентика');
    
    // Загружаем метаданные из agent-file-mapping.json
    const mappingPath = path.join(identicaPath, 'agent-file-mapping.json');
    let assetMapping: any = {};
    
    try {
      const mappingContent = await fs.readFile(mappingPath, 'utf-8');
      const mappingData = JSON.parse(mappingContent);
      if (!mappingData.fileMapping) {
        throw new Error('No file mapping found in asset mapping data');
      }
      assetMapping = mappingData.fileMapping;
    } catch (error) {
      throw new Error(`Required agent-file-mapping.json not found or invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Получаем список всех PNG файлов
    const files = await fs.readdir(identicaPath);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    
    console.log(`📁 T16: Found ${pngFiles.length} PNG files in identica folder`);
    
    // Создаем массив ассетов с метаданными
    const assets: IdenticaAsset[] = [];
    
    for (const fileName of pngFiles) {
      const filePath = path.join(identicaPath, fileName);
      
      // Ищем соответствие в mapping
      const shortName = fileName.replace('.png', '');
      const mappingKey = (Object || {}).keys(assetMapping).find(key => 
        fileName.includes(key) || shortName.includes(key)
      );
      
      let assetData: IdenticaAsset;
      
      if (mappingKey && assetMapping[mappingKey]) {
        // Используем данные из mapping
        const mapping = assetMapping[mappingKey];
        assetData = {
          fileName,
          filePath,
          shortName: mappingKey,
          tags: mapping.allTags ? mapping.allTags : [],
          description: mapping.description ? mapping.description : '',
          tone: mapping.tone ? mapping.tone : 'нейтральный',
          confidence: mapping.confidence ? mapping.confidence : 0.8,
          usageContext: ['email-рассылка', 'маркетинг'],
          figmaNodeId: mapping.figmaNodeId
        };
      } else {
        // Asset not found in mapping - fail fast
        throw new Error(`Asset ${fileName} not found in agent-file-mapping.json. All assets must be properly mapped.`);
      }
      
      assets.push(assetData);
    }
    
    console.log(`🔍 T16: Processed ${assets.length} assets with metadata`);
    
    // Применяем фильтры и выбираем подходящие ассеты
    const selectedAssets = selectBestAssets(assets, params);
    
    const result: IdenticaSelectionResult = {
      selected_assets: selectedAssets,
      total_available: assets.length,
      selection_criteria: buildSelectionCriteria(params),
      confidence_score: calculateSelectionConfidence(selectedAssets, params)
    };
    
    console.log(`✅ T16: Selected ${selectedAssets.length} identica assets:`, 
      selectedAssets.map(a => ({ name: (a || {}).shortName, tags: (a || {}).tags, tone: (a || {}).tone }))
    );
    
    return {
      success: true,
      data: result,
      metadata: {
        source: 'identica-folder',
        total_processed: assets.length,
        selection_method: 'smart-matching',
        avg_confidence: selectedAssets.reduce((sum, a) => sum + (a || {}).confidence, 0) / selectedAssets.length
      }
    };
    
  } catch (error) {
    console.error('❌ T16: Identica selection failed:', error);
    return {
      success: false,
      error: `Identica selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      metadata: {
        source: 'identica-folder',
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    };
  }
}

// Removed analyzeAssetByFileName function - no fallback logic allowed

/**
 * Выбирает лучшие ассеты на основе критериев
 */
function selectBestAssets(assets: IdenticaAsset[], params: IdenticaSelectionParams): IdenticaAsset[] {
  if (!params.target_count) {
    throw new Error('target_count parameter is required');
  }
  const targetCount = params.target_count;
  
  // Сортируем ассеты по релевантности
  const scoredAssets = assets.map(asset => ({
    asset,
    score: calculateAssetScore(asset, params)
  }));
  
  // Сортируем по убыванию релевантности
  scoredAssets.sort((a, b) => (b || {}).score - (a || {}).score);
  
  console.log('🎯 T16: Asset scoring results (top 5):', 
    scoredAssets.slice(0, 5).map(item => ({
      name: item.asset.shortName,
      score: item.score,
      tags: item.asset.tags,
      tone: item.asset.tone
    }))
  );
  
  // Применяем логику разнообразия и специальные предпочтения
  const selected: IdenticaAsset[] = [];
  const usedTags = new Set<string>();
  
  // Если нужен логотип, сначала ищем логотипы
  if (params.prefer_logo) {
    const logos = scoredAssets.filter(item => 
      item.asset.tags.includes('логотип') || item.asset.tags.includes('брендинг')
    );
    if (logos.length > 0) {
      selected.push(logos[0].asset);
      logos[0].asset.tags.forEach(tag => usedTags.add(tag));
    }
  }
  
  // Если нужен премиум, ищем премиум ассеты
  if (params.prefer_premium) {
    const premiumAssets = scoredAssets.filter(item => 
      item.asset.tags.includes('премиум') && !selected.includes(item.asset)
    );
    if (premiumAssets.length > 0) {
      selected.push(premiumAssets[0].asset);
      premiumAssets[0].asset.tags.forEach(tag => usedTags.add(tag));
    }
  }
  
  // Добавляем остальные ассеты с учетом разнообразия
  for (const item of scoredAssets) {
    if (selected.length >= targetCount) break;
    if (selected.includes(item.asset)) continue;
    
    // Проверяем разнообразие тегов
    const hasNewTags = item.asset.tags.some(tag => !usedTags.has(tag));
    const hasMatchingTone = params.emotional_tone ? item.asset.tone === params.emotional_tone : true;
    
    if (hasNewTags && hasMatchingTone) {
      selected.push(item.asset);
      item.asset.tags.forEach(tag => usedTags.add(tag));
    }
  }
  
  // Если не набрали нужное количество, добавляем лучшие оставшиеся
  for (const item of scoredAssets) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(item.asset)) {
      selected.push(item.asset);
    }
  }
  
  return selected.slice(0, targetCount);
}

/**
 * Вычисляет оценку релевантности ассета
 */
function calculateAssetScore(asset: IdenticaAsset, params: IdenticaSelectionParams): number {
  let score = 0;
  
  // Базовая оценка уверенности
  score += asset.confidence * 30;
  
  // Соответствие типу кампании
  if (params.campaign_type) {
    switch (params.campaign_type) {
      case 'promotional':
        if (asset.tags.includes('маркетинг') || asset.tags.includes('акции')) score += 20;
        break;
      case 'brand':
        if (asset.tags.includes('брендинг') || asset.tags.includes('логотип')) score += 25;
        break;
      case 'logo':
        if (asset.tags.includes('логотип')) score += 30;
        break;
      case 'premium':
        if (asset.tags.includes('премиум')) score += 25;
        break;
    }
  }
  
  // Соответствие эмоциональному тону
  if (params.emotional_tone && asset.tone === params.emotional_tone) {
    score += 15;
  }
  
  // Соответствие тегам
  if (params.tags) {
    const matchingTags = asset.tags.filter(tag => 
      params.tags!.some(paramTag => 
        tag.includes(paramTag) || paramTag.includes(tag)
      )
    );
    score += matchingTags.length * 10;
  }
  
  // Соответствие контексту использования
  if (params.usage_context) {
    const matchingContext = asset.usageContext.filter(context =>
      params.usage_context!.some(paramContext =>
        context.includes(paramContext) || paramContext.includes(context)
      )
    );
    score += matchingContext.length * 8;
  }
  
  // Бонус за специфические теги
  if (asset.tags.includes('авиация') || asset.tags.includes('путешествия')) {
          score += 5; // Подходит для тематики путешествий
  }
  
  return score;
}

/**
 * Строит описание критериев выбора
 */
function buildSelectionCriteria(params: IdenticaSelectionParams): string {
  const criteria: string[] = [];
  
  if (params.campaign_type) {
    criteria.push(`тип кампании: ${params.campaign_type}`);
  }
  
  if (params.emotional_tone) {
    criteria.push(`эмоциональный тон: ${params.emotional_tone}`);
  }
  
  if (params.tags && params.tags.length > 0) {
    criteria.push(`теги: ${params.tags.join(', ')}`);
  }
  
  if (params.prefer_logo) {
    criteria.push('предпочтение логотипам');
  }
  
  if (params.prefer_premium) {
    criteria.push('предпочтение премиум-ассетам');
  }
  
  criteria.push(`целевое количество: ${params.target_count}`);
  
  return criteria.join('; ');
}

/**
 * Вычисляет общую уверенность в выборе
 */
function calculateSelectionConfidence(assets: IdenticaAsset[], params: IdenticaSelectionParams): number {
  if (assets.length === 0) return 0;
  
  const avgConfidence = assets.reduce((sum, asset) => sum + asset.confidence, 0) / assets.length;
  const targetCount = params.target_count;
  const countPenalty = assets.length < targetCount ? 0.8 : 1.0;
  
  return Math.min(0.95, avgConfidence * countPenalty);
}

// Экспортируем схему для OpenAI
export const identicaSelectorSchema = {
  name: "select_identica_creatives",
  description: "Выбирает креативы из папки айдентика на основе критериев кампании",
  parameters: {
    type: "object",
    properties: {
      campaign_type: {
        type: "string",
        enum: ["promotional", "informational", "brand", "logo", "premium"],
        description: "Тип кампании для выбора подходящих креативов"
      },
      emotional_tone: {
        type: "string",
        enum: ["позитивный", "нейтральный", "дружелюбный"],
        description: "Желаемый эмоциональный тон креативов"
      },
      usage_context: {
        type: "array",
        items: { type: "string" },
        description: "Контекст использования креативов"
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Специфические теги для поиска креативов"
      },
      target_count: {
        type: "number",
        default: 2,
        description: "Количество креативов для выбора"
      },
      prefer_logo: {
        type: "boolean",
        default: false,
        description: "Предпочитать логотипы в выборе"
      },
      prefer_premium: {
        type: "boolean", 
        default: false,
        description: "Предпочитать премиум креативы"
      }
    },
    required: []
  }
}; 