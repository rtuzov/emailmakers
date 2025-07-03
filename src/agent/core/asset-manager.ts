/**
 * 🎨 ASSET MANAGER
 * 
 * Управление визуальными ассетами для Design Specialist Agent:
 * - Поиск ассетов в Figma
 * - Трансформация данных ассетов
 * - Кэширование результатов поиска
 * - Валидация ассетов
 */

import { figmaSearch, figmaSearchSchema } from '../tools/simple/figma-search';
import { figmaFolders, figmaFoldersSchema } from '../tools/simple/figma-folders';
import { Agent, run } from '@openai/agents';
import { getUsageModel } from '../../shared/utils/model-config';

export interface AssetSearchParams {
  tags: string[];
  emotional_tone: 'positive' | 'neutral' | 'urgent' | 'friendly';
  campaign_type: 'seasonal' | 'promotional' | 'informational';
  target_count: number;
  preferred_emotion: 'happy' | 'angry' | 'neutral' | 'sad' | 'confused';
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
  search_metadata: {
    query_tags: string[];
    search_time_ms: number;
    recommendations: string[];
  };
  error?: string;
}

export class AssetManager {
  private cache: Map<string, AssetSearchResult> = new Map();
  private aiTagGenerator: Agent;

  constructor() {
    // Создаем переиспользуемого агента для генерации тегов
    this.aiTagGenerator = new Agent({
      name: 'TagGenerator',
      instructions: 'You are a tag generator that analyzes email content and returns relevant search tags as JSON arrays. Always return valid JSON arrays with no additional text.',
      model: getUsageModel()
    });
  }

  /**
   * Основной метод поиска ассетов
   */
  async searchAssets(params: AssetSearchParams, contentPackage?: any): Promise<AssetSearchResult> {
    const startTime = Date.now();
    
    // Если теги не предоставлены, генерируем их через AI
    let searchTags = params.tags;
    if (!searchTags || searchTags.length === 0) {
      if (!contentPackage) {
        throw new Error('AssetManager: Content package required for AI tag generation');
      }
      searchTags = await this.generateAITags(contentPackage);
    }

    // Проверяем кэш
    const cacheKey = this.generateCacheKey(searchTags, params);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log('✅ AssetManager: Using cached results');
      return cached;
    }

    // Выполняем поиск
    const searchResult = await this.performSearch(searchTags, params);
    
    // Трансформируем результаты в стандартный формат
    const standardizedAssets = this.transformToStandardFormat(searchResult);
    
    const result: AssetSearchResult = {
      success: true,
      assets: standardizedAssets,
      total_found: standardizedAssets.length,
      search_metadata: {
        query_tags: searchTags,
        search_time_ms: Date.now() - startTime,
        recommendations: this.generateRecommendations(standardizedAssets, params)
      }
    };

    // Кэшируем результат
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Генерация AI-тегов без fallback
   */
  private async generateAITags(contentPackage: any): Promise<string[]> {
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

    // Загружаем AI-оптимизированные теги для контекста
    const aiOptimizedTags = await this.loadAIOptimizedTags();
    
    const prompt = `Analyze this email content and generate 5-7 relevant search tags for finding appropriate Figma assets.

EMAIL CONTENT:
Subject: ${subject}
Body: ${body.substring(0, 500)}...

AVAILABLE TAGS DATABASE:
${aiOptimizedTags.availableTags.join(', ')}

FOLDER CATEGORIES:
${aiOptimizedTags.folderDescriptions}

Return 5-7 tags as a JSON array. Use tags from the available database when possible.
Return only the JSON array, no explanations.`;

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
    
    return tags;
  }

  /**
   * Загрузка AI-оптимизированных тегов
   */
  private async loadAIOptimizedTags(): Promise<{availableTags: string[], folderDescriptions: string}> {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const basePath = path.resolve(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
      const aiOptimizedTagsPath = path.join(basePath, 'ai-optimized-tags.json');
      
      const content = await fs.readFile(aiOptimizedTagsPath, 'utf-8');
      const data = JSON.parse(content);
      
      return {
        availableTags: Object.keys(data.most_common_tags).slice(0, 50),
        folderDescriptions: Object.entries(data.folders)
          .map(([folder, info]: [string, any]) => `${folder}: ${info.description}`)
          .join('\n')
      };
    } catch (error) {
      throw new Error(`AssetManager: Failed to load AI-optimized tags: ${error.message}`);
    }
  }

  /**
   * Выполнение поиска в Figma
   */
  private async performSearch(tags: string[], params: AssetSearchParams): Promise<any> {
    const searchParams = {
      action: 'search' as const,
      tags: tags,
      search_context: {
        campaign_type: params.campaign_type,
        emotional_tone: params.emotional_tone,
        target_count: params.target_count,
        diversity_mode: true,
        preferred_emotion: params.preferred_emotion,
        use_local_only: true
      },
      quality_filter: 'high' as const,
      format_preference: ['png', 'svg'] as const,
      size_constraints: params.image_requirements?.size_constraints || {
        max_width: 600,
        max_height: 400
      },
      include_analytics: true,
      track_usage: true
    };

    const result = await figmaSearch(searchParams);
    
    if (!result.success) {
      throw new Error(`AssetManager: Figma search failed: ${result.error}`);
    }
    
    return result;
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
   * Очистка кэша
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Получение статистики кэша
   */
  getCacheStats(): {size: number, keys: string[]} {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 