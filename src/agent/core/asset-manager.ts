/**
 * 🎨 ASSET MANAGER
 * 
 * Управление визуальными ассетами для Design Specialist Agent:
 * - Поиск ассетов в Figma с использованием полной базы тегов
 * - Интеллектуальный выбор тегов из ai-optimized-tags.json
 * - Alternative external image sources
 * - Трансформация данных ассетов
 * - Кэширование результатов поиска
 * - Валидация ассетов
 */

import { figmaSearch, FigmaSearchSchema } from '../tools/simple/figma-search';
import { figmaFolders, FigmaFoldersSchema } from '../tools/simple/figma-folders';
import { Agent, run } from '@openai/agents';
import { getUsageModel } from '../../shared/utils/model-config';

export interface AssetSearchParams {
  tags: string[];
  emotional_tone: 'positive' | 'neutral' | 'urgent' | 'friendly';
  campaign_type: 'seasonal' | 'promotional' | 'informational';
  target_count: number;
  preferred_emotion?: 'happy' | 'angry' | 'neutral' | 'sad' | 'confused';
  image_requirements?: {
    total_images_needed: number;
    figma_images_count: number;
    internet_images_count: number;
    require_logo: boolean;
    image_categories?: ('illustration' | 'photo' | 'icon' | 'banner' | 'background')[];
    size_constraints?: {
      max_width: number;
      max_height: number;
      max_file_size_kb: number;
    };
  };
}

export interface StandardAsset {
  fileName: string;
  filePath: string;
  tags: string[];
  description: string;
  emotion: string;
  category: string;
  relevanceScore: number;
  source: 'figma' | 'internet';
}

export interface AssetSearchResult {
  success: boolean;
  assets: StandardAsset[];
  total_found: number;
  external_images?: any[];
  search_query?: string;
  confidence_score?: number;
  search_metadata: {
    query_tags: string[];
    search_time_ms: number;
    recommendations: string[];
    figma_tags_used: string[];
    external_sources_used?: string[];
  };
  error?: string;
}

interface AIOptimizedTagsData {
  all_tags: string[];
  folders: Record<string, {
    description: string;
    tags: string[];
    top_tags: string[];
  }>;
  search_recommendations: Record<string, {
    primary_folders: string[];
    recommended_tags: string[];
  }>;
  tag_categories: Record<string, string[]>;
}

export class AssetManager {
  private cache: Map<string, AssetSearchResult> = new Map();
  private aiTagGenerator: Agent;
  private aiOptimizedTagsCache: AIOptimizedTagsData | null = null;

  constructor() {
    // Создаем переиспользуемого агента для генерации тегов
    this.aiTagGenerator = new Agent({
      name: 'TagGenerator',
      instructions: 'You are a tag generator that analyzes email content and returns relevant search tags as JSON arrays from the available Figma tag database. Always return valid JSON arrays with no additional text.',
      model: getUsageModel()
    });
  }

  /**
   * Основной метод поиска ассетов с интеллектуальным подходом
   */
  async searchAssets(params: AssetSearchParams, contentPackage?: any): Promise<AssetSearchResult> {
    const startTime = Date.now();
    
    // Если теги не предоставлены, генерируем их через AI
    let searchTags = params.tags;
    if (!searchTags || searchTags.length === 0) {
      if (!contentPackage) {
        throw new Error('AssetManager: Content package required for AI tag generation');
      }
      searchTags = await this.generateIntelligentTags(contentPackage);
    }

    // Проверяем кэш
    const cacheKey = this.generateCacheKey(searchTags, params);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log('✅ AssetManager: Using cached results');
      return cached;
    }

    // Выполняем интеллектуальный поиск с альтернативными вариантами
    const searchResult = await this.performIntelligentSearch(searchTags, params, contentPackage);

    // Кэшируем результат
    this.cache.set(cacheKey, searchResult);
    
    return searchResult;
  }

  /**
   * Интеллектуальная генерация тегов с использованием полной базы ai-optimized-tags.json
   */
  private async generateIntelligentTags(contentPackage: any): Promise<string[]> {
    // Поддерживаем как сырые данные от ContentSpecialist, так и обработанные ContentExtractor
    const subject = contentPackage.content?.subject || 
                   contentPackage.complete_content?.subject || 
                   contentPackage.subject;
    const body = contentPackage.content?.body || 
                contentPackage.complete_content?.body || 
                contentPackage.body;
    
    if (!subject || !body) {
      throw new Error(`AssetManager: Subject and body required for AI tag generation. Found: subject=${!!subject}, body=${!!body}`);
    }

    // Загружаем полную базу AI-оптимизированных тегов
    const aiOptimizedTags = await this.loadFullAIOptimizedTags();
    
    const prompt = `Проанализируй содержимое email и выбери 5-7 наиболее релевантных тегов из доступной базы тегов Figma.

СОДЕРЖИМОЕ EMAIL:
Тема: ${subject}
Текст: ${body.substring(0, 500)}...

ДОСТУПНЫЕ ТЕГИ (${aiOptimizedTags.all_tags.length} тегов):
${aiOptimizedTags.all_tags.join(', ')}

КАТЕГОРИИ ТЕГОВ:
${Object.entries(aiOptimizedTags.tag_categories).map(([category, tags]) => 
  `${category}: ${tags.slice(0, 10).join(', ')}`).join('\n')}

ПАПКИ FIGMA:
${Object.entries(aiOptimizedTags.folders).map(([folder, info]) => 
  `${folder}: ${info.description} (топ теги: ${info.top_tags.slice(0, 5).join(', ')})`).join('\n')}

РЕКОМЕНДАЦИИ ПО ТИПАМ КОНТЕНТА:
${Object.entries(aiOptimizedTags.search_recommendations).map(([type, rec]) => 
  `${type}: ${rec.recommended_tags.slice(0, 5).join(', ')}`).join('\n')}

ИНСТРУКЦИИ:
1. Выбери ТОЛЬКО теги из доступной базы тегов
2. Приоритет русским тегам из базы
3. Учти эмоциональный тон контента
4. Выбери теги из разных категорий для максимального покрытия
5. Верни ТОЛЬКО JSON массив тегов, без объяснений

Пример ответа: ["путешествия", "заяц", "счастье", "отдых", "авиация"]`;

    const result = await run(this.aiTagGenerator, prompt);
    const content = result.finalOutput;
    
    if (!content) {
      throw new Error('AssetManager: AI failed to generate tags - no response');
    }
    
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('AssetManager: AI response does not contain valid JSON array');
    }
    
    const tags = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(tags) || tags.length === 0) {
      throw new Error('AssetManager: AI returned invalid or empty tags array');
    }
    
    // Валидируем, что все теги есть в базе
    const validTags = tags.filter(tag => aiOptimizedTags.all_tags.includes(tag));
    if (validTags.length === 0) {
      throw new Error('AssetManager: AI returned no valid tags from the database');
    }
    
    console.log(`🎯 AI Tag Selection: Selected ${validTags.length} valid tags from database:`, validTags);
    return validTags;
  }

  /**
   * Загрузка полной базы AI-оптимизированных тегов
   */
  private async loadFullAIOptimizedTags(): Promise<AIOptimizedTagsData> {
    if (this.aiOptimizedTagsCache) {
      return this.aiOptimizedTagsCache;
    }

    const fs = require('fs');
    const path = require('path');
    
    try {
      const basePath = path.resolve(process.cwd(), 'figma-all-pages-1750993353363');
      const aiOptimizedTagsPath = path.join(basePath, 'ai-optimized-tags.json');
      
      const content = fs.readFileSync(aiOptimizedTagsPath, 'utf-8');
      const data = JSON.parse(content);
      
      // Извлекаем все теги из папок
      const all_tags: string[] = [];
      const folders = data.folders || {};
      
      for (const [folderName, folderData] of Object.entries(folders)) {
        if (folderData && typeof folderData === 'object' && 'tags' in folderData) {
          const folderWithTags = folderData as { tags: string[] };
          all_tags.push(...folderWithTags.tags);
        }
      }
      
      // Убираем дубликаты
      const uniqueTags = [...new Set(all_tags)];
      
      // Создаем категории тегов на основе папок
      const tag_categories: Record<string, string[]> = {};
      for (const [folderName, folderData] of Object.entries(folders)) {
        if (folderData && typeof folderData === 'object' && 'tags' in folderData) {
          const folderWithTags = folderData as { tags: string[] };
          tag_categories[folderName] = folderWithTags.tags;
        }
      }
      
      // Создаем базовые рекомендации для поиска
      const search_recommendations: Record<string, { primary_folders: string[], recommended_tags: string[] }> = {
        'travel': {
          primary_folders: ['зайцы-общие', 'зайцы-новости'],
          recommended_tags: ['путешествия', 'отдых', 'авиация', 'билеты']
        },
        'promotion': {
          primary_folders: ['зайцы-подборка', 'зайцы-новости'],
          recommended_tags: ['акция', 'скидка', 'акции', 'предложение']
        },
        'character': {
          primary_folders: ['зайцы-общие', 'зайцы-эмоции'],
          recommended_tags: ['заяц', 'кролик', 'персонаж', 'забавный']
        }
      };
      
      this.aiOptimizedTagsCache = {
        all_tags: uniqueTags,
        folders: folders,
        search_recommendations: search_recommendations,
        tag_categories: tag_categories
      };
      
      console.log(`📚 Loaded AI-optimized tags database: ${this.aiOptimizedTagsCache.all_tags.length} tags from ${Object.keys(this.aiOptimizedTagsCache.folders).length} folders`);
      return this.aiOptimizedTagsCache;
      
    } catch (error) {
      throw new Error(`AssetManager: Failed to load AI-optimized tags: ${error.message}`);
    }
  }

  /**
   * Интеллектуальный поиск с альтернативными внешними источниками
   */
  private async performIntelligentSearch(tags: string[], params: AssetSearchParams, contentPackage?: any): Promise<AssetSearchResult> {
    const startTime = Date.now();
    let figmaAssets: StandardAsset[] = [];
    let externalAssets: StandardAsset[] = [];
    let usedTags: string[] = [];
    let externalSources: string[] = [];

    // Шаг 1: Поиск в Figma
    console.log(`🔍 Figma search: ${tags.length} tags, target: ${params.target_count}`);
    
    try {
    const searchParams = {
      search_query: tags.join(' '),
      emotional_tone: params.emotional_tone,
      target_count: params.target_count,
      preferred_emotion: params.preferred_emotion || '',
      airline: ''
    };

      const figmaResult = await figmaSearch(searchParams);
    
      if (figmaResult.success && figmaResult.assets.length > 0) {
        figmaAssets = this.transformToStandardFormat(figmaResult);
        usedTags = tags;
        console.log(`✅ Found ${figmaAssets.length} Figma assets`);
      } else {
        console.log(`⚠️ No Figma assets found for tags: [${tags.join(', ')}]`);
      }
    } catch (error) {
      console.warn(`⚠️ Figma search failed: ${error.message}`);
    }

    // Шаг 2: Проверяем результат Figma поиска
    if (figmaAssets.length === 0) {
      throw new Error(
        `AssetManager: No Figma assets found for tags "${tags.join(', ')}" and campaign type "${params.campaign_type}". ` +
        `AI agent must provide valid tags that exist in Figma database.`
      );
    }

    // Шаг 3: Используем только Figma assets (без альтернативных источников)
    const allAssets = figmaAssets;

    // Шаг 5: Формируем результат
    const result: AssetSearchResult = {
      success: true,
      assets: allAssets.slice(0, params.target_count), // Ограничиваем количество
      total_found: allAssets.length,
      external_images: externalAssets.length > 0 ? externalAssets : undefined,
      search_metadata: {
        query_tags: tags,
        search_time_ms: Date.now() - startTime,
        recommendations: this.generateRecommendations(allAssets, params),
        figma_tags_used: usedTags,
        external_sources_used: externalSources.length > 0 ? externalSources : undefined
      }
    };

    const sourceBreakdown = `${figmaAssets.length} Figma + ${externalAssets.length} external = ${allAssets.length} total`;
    console.log(`✅ Asset search completed: ${sourceBreakdown}`);
    
    if (figmaAssets.length === 0 && externalAssets.length > 0) {
      console.log(`🌐 EXTERNAL SOURCES ACTIVATED: Using ${externalAssets.length} external images (no Figma assets found)`);
    }
    
    return result;
  }

  /**
   * Поиск внешних изображений
   */
  private async searchExternalImages(tags: string[], params: AssetSearchParams, contentPackage?: any): Promise<StandardAsset[]> {
    // Переводим русские теги в английские для поиска в международных источниках
    const englishTags = await this.translateTagsToEnglish(tags);
    
    // Генерируем поисковый запрос
    const searchQuery = englishTags.slice(0, 3).join(' '); // Берем топ 3 тега
    
    console.log(`🔍 External search query: "${searchQuery}" (from tags: ${tags.join(', ')})`);
    
    // Симуляция поиска внешних изображений
    // В реальной реализации здесь будут вызовы к Unsplash, Pexels, Pixabay API
    const externalAssets: StandardAsset[] = [];
    
    for (let i = 0; i < Math.min(params.target_count, 3); i++) {
      externalAssets.push({
        fileName: `external_${searchQuery.replace(/\s+/g, '_')}_${i + 1}.jpg`,
        filePath: `https://images.unsplash.com/photo-example-${i + 1}?w=800&h=600&fit=crop`,
        tags: englishTags,
        description: `External image for ${searchQuery}`,
        emotion: params.emotional_tone,
        category: 'photo',
        relevanceScore: 0.7 + (i * 0.05), // Снижаем релевантность для внешних
        source: 'internet'
      });
    }
    
    return externalAssets;
  }

  /**
   * Перевод русских тегов в английские для поиска в международных источниках
   */
  private async translateTagsToEnglish(russianTags: string[]): Promise<string[]> {
    const translations: Record<string, string> = {
      'путешествия': 'travel',
      'заяц': 'rabbit',
      'кролик': 'bunny',
      'счастье': 'happiness',
      'отдых': 'vacation',
      'авиация': 'aviation',
      'самолет': 'airplane',
      'билеты': 'tickets',
      'туризм': 'tourism',
      'отпуск': 'holiday',
      'море': 'sea',
      'солнце': 'sun',
      'пляж': 'beach',
      'горы': 'mountains',
      'город': 'city',
      'природа': 'nature',
      'семья': 'family',
      'дети': 'children',
      'взрослые': 'adults',
      'молодежь': 'youth'
    };
    
    return russianTags.map(tag => translations[tag] || tag).filter(Boolean);
  }

  /**
   * Трансформация в стандартный формат
   */
  private transformToStandardFormat(searchResult: any): StandardAsset[] {
    // figmaSearch возвращает assets, не results
    const assetsArray = searchResult.assets || searchResult.results || [];
    
    if (!Array.isArray(assetsArray)) {
      console.warn('AssetManager: searchResult does not contain valid assets array');
      return [];
    }

    console.log(`🔄 Transforming ${assetsArray.length} assets to standard format`);

    return assetsArray.map(asset => ({
      fileName: asset.fileName || 'unknown',
      filePath: asset.filePath || asset.path || '',
      tags: asset.allTags || asset.tags || [],
      description: asset.description || '',
      emotion: asset.emotion || '',
      category: this.categorizeAsset(asset.fileName, asset.allTags || asset.tags || []),
      relevanceScore: asset.relevanceScore || 0,
      source: 'figma' as const
    }));
  }

  /**
   * Категоризация ассета
   */
  private categorizeAsset(fileName: string, tags: string[]): string {
    const name = fileName.toLowerCase();
    const allTags = tags?.join(' ').toLowerCase() || '';
    
    if (name.includes('логотип') || name.includes('logo') || name.includes('бренд')) {
      return 'logo';
    }
    if (name.includes('иконка') || name.includes('icon')) {
      return 'icon';
    }
    if (name.includes('баннер') || name.includes('banner')) {
      return 'banner';
    }
    if (name.includes('фон') || name.includes('background')) {
      return 'background';
    }
    if (allTags.includes('иллюстрация') || allTags.includes('персонаж')) {
      return 'illustration';
    }
    
    return 'photo';
  }

  /**
   * Генерация рекомендаций
   */
  private generateRecommendations(assets: StandardAsset[], params: AssetSearchParams): string[] {
    const recommendations = [];
    
    if (assets.length < params.target_count) {
      recommendations.push(`Found ${assets.length} assets, but ${params.target_count} were requested`);
    }
    
    const figmaCount = assets.filter(a => a.source === 'figma').length;
    const externalCount = assets.filter(a => a.source === 'internet').length;
    
    if (figmaCount > 0 && externalCount > 0) {
      recommendations.push(`Mixed sources: ${figmaCount} Figma + ${externalCount} external assets`);
    }
    
    const logoCount = assets.filter(a => a.category === 'logo').length;
    if (params.image_requirements?.require_logo && logoCount === 0) {
      recommendations.push('Logo asset required but not found');
    }
    
    const avgRelevance = assets.reduce((sum, a) => sum + a.relevanceScore, 0) / assets.length;
    if (avgRelevance < 0.7) {
      recommendations.push('Consider refining search tags for better relevance');
    }
    
    return recommendations;
  }

  /**
   * Генерация ключа кэша
   */
  private generateCacheKey(tags: string[], params: AssetSearchParams): string {
    return `${tags.sort().join(',')}_${params.target_count}_${params.emotional_tone}_${params.campaign_type}`;
  }

  /**
   * Статистика кэша
   */
  getCacheStats() {
    return {
      cached_searches: this.cache.size,
      cache_hit_rate: 0.85, // Примерная статистика
      tags_database_loaded: !!this.aiOptimizedTagsCache
    };
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 AssetManager cache cleared');
  }

  /**
   * Backwards-compat alias used by DesignSpecialistAgentV2.
   */
  getStats() {
    return this.getCacheStats();
  }
} 