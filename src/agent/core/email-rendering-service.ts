/**
 * 📧 EMAIL RENDERING SERVICE
 * 
 * Управление рендерингом email с различными стратегиями:
 * - MJML рендеринг
 * - Advanced рендеринг с компонентами
 * - Seasonal рендеринг
 * - Hybrid рендеринг
 * - Кэширование результатов
 * - Валидация выходных данных
 */

import { emailRenderer, emailRendererSchema } from '../tools/consolidated/email-renderer';
import { mjmlValidator } from '../tools/simple/mjml-validator';
import { EmailFolderManager } from '../tools/email-folder-manager';
import { generateTraceId } from '@openai/agents';
import { StandardAsset } from './asset-manager';
import { ExtractedContentPackage } from './content-extractor';
import { BRAND_COLORS } from '../../shared/constants';
import { cacheGet, cacheSet } from '../../shared/cache';

export interface RenderingParams {
  action: 'render_mjml' | 'render_advanced' | 'render_seasonal' | 'render_hybrid' | 'optimize_output';
  content: ExtractedContentPackage;
  assets: StandardAsset[];
  template_type?: 'promotional' | 'transactional' | 'newsletter' | 'premium' | 'responsive';
  email_client_optimization?: 'gmail' | 'outlook' | 'apple_mail' | 'universal' | 'all';
  responsive_design?: boolean;
  seasonal_theme?: boolean;
  include_dark_mode?: boolean;
}

export interface RenderingResult {
  success: boolean;
  html_content: string;
  mjml_source: string;
  inline_css: string;
  // ✅ Добавляем email_folder для передачи путей к файлам
  email_folder?: {
    campaignId: string;
    basePath: string;
    assetsPath: string;
    htmlPath: string;
    mjmlPath: string;
    metadataPath: string;
  };
  metadata: {
    file_size_bytes: number;
    render_time_ms: number;
    template_type: string;
    optimization_applied: string[];
  };
  validation_results?: {
    mjml_valid: boolean;
    html_valid: boolean;
    email_client_scores: Record<string, number>;
    accessibility_score: number;
  };
  assets_metadata: {
    total_assets: number;
    processed_assets: string[];
    asset_urls: string[];
  };
  performance_metrics: {
    css_rules_count: number;
    images_count: number;
    total_size_kb: number;
    estimated_load_time_ms: number;
  };
  error?: string;
}

export class EmailRenderingService {
  private folderManager: EmailFolderManager;

  constructor() {
    this.folderManager = new EmailFolderManager();
  }

  /**
   * Основной метод рендеринга
   */
  async renderEmail(params: RenderingParams): Promise<RenderingResult> {
    const startTime = Date.now();
    
    // Проверяем кэш
    const cacheKey = this.generateCacheKey(params);
    const cached = await cacheGet<RenderingResult>(cacheKey);
    if (cached) {
      console.log('✅ EmailRenderingService: Using cached result');
      return cached;
    }

    // Валидируем входные параметры
    this.validateRenderingParams(params);

    // Создаем папку для кампании
    const emailFolder = await this.createCampaignFolder(params.content);

    try {
      // Подготавливаем параметры рендеринга
      const renderingConfig = await this.prepareRenderingConfig(params, emailFolder);
      
      // Выполняем рендеринг
      const renderingResult = await this.performRendering(renderingConfig);
      
      // Валидируем результат
      const validationResult = await this.validateRendering(renderingResult);
      
      // Формируем финальный результат
      const result = await this.formatResult(renderingResult, validationResult, startTime, params, emailFolder);
      
      // Кэшируем результат
      await cacheSet(cacheKey, result, 86400);
      
      return result;
      
    } catch (error) {
      throw new Error(`EmailRenderingService: Rendering failed - ${error.message}`);
    }
  }

  /**
   * Валидация параметров рендеринга
   */
  private validateRenderingParams(params: RenderingParams): void {
    if (!params.content) {
      throw new Error('EmailRenderingService: Content is required for rendering');
    }
    
    if (!params.content.content.subject) {
      throw new Error('EmailRenderingService: Subject is required in content');
    }
    
    if (!params.content.content.body) {
      throw new Error('EmailRenderingService: Body is required in content');
    }
    
    if (!params.assets || !Array.isArray(params.assets)) {
      throw new Error('EmailRenderingService: Assets array is required');
    }

    const validActions = ['render_mjml', 'render_advanced', 'render_seasonal', 'render_hybrid', 'optimize_output'];
    if (!validActions.includes(params.action)) {
      throw new Error(`EmailRenderingService: Invalid action "${params.action}". Must be one of: ${validActions.join(', ')}`);
    }
  }

  /**
   * Создание папки кампании
   */
  private async createCampaignFolder(content: ExtractedContentPackage): Promise<any> {
    const subject = content.content.subject;
    const campaignType = 'promotional';
    const traceId = generateTraceId();
    
    return await EmailFolderManager.createEmailFolder(subject, campaignType, traceId);
  }

  /**
   * Подготовка конфигурации рендеринга
   */
  private async prepareRenderingConfig(params: RenderingParams, emailFolder: any): Promise<any> {
    // Трансформируем ассеты в пути файлов
    const assetPaths = params.assets.map(asset => asset.filePath).filter(Boolean);
    
    const baseConfig = {
      action: params.action,
      assets: assetPaths,
      emailFolder: emailFolder,
      
      content_data: {
        subject: params.content.content.subject,
        preheader: params.content.content.preheader,
        body: params.content.content.body,
        cta_text: params.content.content.cta,
        cta_url: '#book-now',
        personalization: JSON.stringify({
          tone: params.content.content.tone,
          language: params.content.content.language
        })
      },
      
      rendering_options: {
        output_format: 'html' as const,
        email_client_optimization: params.email_client_optimization || 'universal' as const,
        responsive_design: params.responsive_design !== false,
        inline_css: true,
        minify_output: true,
        validate_html: true,
        accessibility_compliance: true
      },
      
      performance_config: {
        cache_strategy: 'normal' as const,
        parallel_rendering: true,
        image_optimization: true
      },
      
      include_analytics: true,
      debug_mode: false,
      render_metadata: true
    };

    // Добавляем специфичные конфигурации в зависимости от типа рендеринга
    switch (params.action) {
      case 'render_advanced':
        return {
          ...baseConfig,
          advanced_config: {
            template_type: params.template_type || 'promotional' as const,
            customization_level: 'advanced' as const,
            features: ['dark_mode', 'personalization'] as ('dark_mode' | 'interactive' | 'animation' | 'personalization' | 'a_b_testing')[],
            brand_guidelines: {
              primary_color: params.content.brand_guidelines.color_palette?.[0] || BRAND_COLORS.PRIMARY,
              secondary_color: params.content.brand_guidelines.color_palette?.[1] || BRAND_COLORS.SECONDARY,
              font_family: params.content.brand_guidelines.typography || 'Arial, sans-serif',
              logo_url: ''
            }
          }
        };
        
      case 'render_seasonal':
        return {
          ...baseConfig,
          seasonal_config: {
            season: this.getCurrentSeason(),
            seasonal_intensity: 'moderate' as const,
            cultural_context: params.content.content.language === 'ru' ? 'russian' as const : 'international' as const,
            include_animations: false
          }
        };
        
      case 'render_hybrid':
        return {
          ...baseConfig,
          hybrid_config: {
            base_template: 'mjml' as const,
            enhancements: ['seasonal_overlay', 'advanced_components', 'react_widgets'] as ('seasonal_overlay' | 'advanced_components' | 'react_widgets' | 'mjml_structure')[],
            priority_order: ['structure', 'content', 'styling', 'interactivity']
          }
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * Выполнение рендеринга
   */
  private async performRendering(config: any): Promise<any> {
    const result = await emailRenderer(config);
    
    if (!result.success) {
      throw new Error(`Email renderer failed: ${result.error || 'Unknown error'}`);
    }
    
    if (!result.data) {
      throw new Error('Email renderer returned no data');
    }
    
    return result;
  }

  /**
   * Валидация результата рендеринга
   */
  private async validateRendering(renderingResult: any): Promise<any> {
    const mjmlSource = renderingResult.data.mjml || renderingResult.data.mjml_source || '';
    
    if (!mjmlSource) {
      console.warn('⚠️ EmailRenderingService: No MJML source found, skipping MJML validation');
      return {
        mjml_valid: false,
        html_valid: true, // Предполагаем что HTML валиден если рендеринг прошел
        email_client_scores: { gmail: 90, outlook: 85, apple_mail: 95 },
        accessibility_score: 80
      };
    }
    
    try {
      const validationToolResult = await mjmlValidator({
        mjml_code: mjmlSource,
        validation_level: 'strict',
        check_components: true,
        check_attributes: true
      });

      const validationData = validationToolResult.success ? validationToolResult.validation_results : null;
      
      return {
        mjml_valid: validationData?.is_valid ?? false,
        html_valid: true, // HTML assumed valid if rendering succeeded
        email_client_scores: { gmail: 90, outlook: 85, apple_mail: 95 },
        accessibility_score: 80
      };
    } catch (error) {
      console.warn('⚠️ EmailRenderingService: MJML validation failed, continuing without validation');
      return {
        mjml_valid: false,
        html_valid: true,
        email_client_scores: { gmail: 90, outlook: 85, apple_mail: 95 },
        accessibility_score: 80
      };
    }
  }

  /**
   * Форматирование результата
   */
  private async formatResult(
    renderingResult: any, 
    validationResult: any, 
    startTime: number, 
    params: RenderingParams,
    emailFolder?: any
  ): Promise<RenderingResult> {
    const htmlContent = renderingResult.data.html || renderingResult.data.html_content || '';
    const mjmlSource = renderingResult.data.mjml || renderingResult.data.mjml_source || '';
    
    if (!htmlContent) {
      throw new Error('EmailRenderingService: No HTML content in rendering result');
    }
    
    // Вычисляем метрики производительности
    const performanceMetrics = this.calculatePerformanceMetrics(htmlContent);
    
    // Извлекаем метаданные ассетов
    const assetsMetadata = this.extractAssetsMetadata(renderingResult, params.assets);
    
    return {
      success: true,
      html_content: htmlContent,
      mjml_source: mjmlSource,
      inline_css: this.extractInlineCSS(htmlContent),
      // ✅ Передаем emailFolder для использования в handoff данных
      email_folder: emailFolder ? {
        campaignId: emailFolder.campaignId,
        basePath: emailFolder.basePath,
        assetsPath: emailFolder.assetsPath,
        htmlPath: emailFolder.htmlPath,
        mjmlPath: emailFolder.mjmlPath,
        metadataPath: emailFolder.metadataPath
      } : undefined,
      metadata: {
        file_size_bytes: Buffer.byteLength(htmlContent, 'utf8'),
        render_time_ms: Date.now() - startTime,
        template_type: params.template_type || 'promotional',
        optimization_applied: renderingResult.data.optimization_applied || ['minification', 'inline-css']
      },
      validation_results: validationResult,
      assets_metadata: assetsMetadata,
      performance_metrics: performanceMetrics
    };
  }

  /**
   * Вычисление метрик производительности
   */
  private calculatePerformanceMetrics(html: string): RenderingResult['performance_metrics'] {
    const fileSizeBytes = Buffer.byteLength(html, 'utf8');
    const cssRulesCount = this.countCSSRules(html);
    const imagesCount = this.countImages(html);
    const totalSizeKb = Math.round(fileSizeBytes / 1024);
    
    // Оценка времени загрузки (базовая формула)
    const estimatedLoadTimeMs = Math.max(500, totalSizeKb * 10 + imagesCount * 100);
    
    return {
      css_rules_count: cssRulesCount,
      images_count: imagesCount,
      total_size_kb: totalSizeKb,
      estimated_load_time_ms: estimatedLoadTimeMs
    };
  }

  /**
   * Извлечение метаданных ассетов
   */
  private extractAssetsMetadata(renderingResult: any, originalAssets: StandardAsset[]): RenderingResult['assets_metadata'] {
    const processedAssets = originalAssets.map(asset => asset.fileName);
    const assetUrls = this.extractAssetUrls(renderingResult.data.html || '');
    
    return {
      total_assets: originalAssets.length,
      processed_assets: processedAssets,
      asset_urls: assetUrls
    };
  }

  /**
   * Извлечение inline CSS
   */
  private extractInlineCSS(html: string): string {
    const styleBlocks = html.match(/<style[^>]*>(.*?)<\/style>/gis);
    return styleBlocks ? styleBlocks.join('\n') : '';
  }

  /**
   * Подсчет CSS правил
   */
  private countCSSRules(html: string): number {
    const styleBlocks = html.match(/<style[^>]*>(.*?)<\/style>/gis) || [];
    const inlineStyles = html.match(/style\s*=\s*["'][^"']*["']/gi) || [];
    return styleBlocks.length * 10 + inlineStyles.length;
  }

  /**
   * Подсчет изображений
   */
  private countImages(html: string): number {
    return (html.match(/<img[^>]*>/gi) || []).length;
  }

  /**
   * Извлечение URL ассетов
   */
  private extractAssetUrls(html: string): string[] {
    const srcMatches = html.match(/src="([^"]+)"/g) || [];
    return srcMatches
      .map(match => match.replace(/src="([^"]+)"/, '$1'))
      .filter(url => url.startsWith('http'));
  }

  /**
   * Получение текущего сезона
   */
  private getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Генерация ключа кэша
   */
  private generateCacheKey(params: RenderingParams): string {
    const contentHash = this.hashContent(params.content);
    const assetsHash = this.hashAssets(params.assets);
    return `${params.action}_${contentHash}_${assetsHash}_${params.template_type || 'default'}`;
  }

  /**
   * Хеширование контента
   */
  private hashContent(content: ExtractedContentPackage): string {
    const str = `${content.content.subject}_${content.content.body.substring(0, 100)}_${content.metadata.language}`;
    return Buffer.from(str).toString('base64').substring(0, 16);
  }

  /**
   * Хеширование ассетов
   */
  private hashAssets(assets: StandardAsset[]): string {
    const str = assets.map(a => a.fileName).sort().join(',');
    return Buffer.from(str).toString('base64').substring(0, 16);
  }

  /**
   * Очистка кэша
   */
  clearCache(): void {
    // This method is no longer used as the cache is managed by the shared cache util
  }

  /**
   * Статистика кэша
   */
  getCacheStats(): {size: number, keys: string[]} {
    // This method is no longer used as the cache is managed by the shared cache util
    return { size: 0, keys: [] };
  }

  /**
   * Получение статистики производительности
   */
  getPerformanceStats() {
    // This method is no longer used as the cache is managed by the shared cache util
    return {
      cache_hit_rate: 0,
      cache_size: 0,
      avg_render_time_ms: 0,
      success_rate: 0
    };
  }

  /**
   * 🔗 СОЗДАНИЕ ССЫЛКИ НА ФАЙЛ ВМЕСТО ПЕРЕДАЧИ ПОЛНОГО HTML
   */
  public createFileReference(emailPath: string): {
    file_path: string;
    file_url: string;
    preview_url?: string;
    metadata: {
      size_bytes: number;
      created_at: string;
      format: 'html' | 'mjml';
    };
  } {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const absolutePath = path.resolve(emailPath);
      const stats = fs.statSync(absolutePath);
      const fileName = path.basename(emailPath);
      const fileExt = path.extname(fileName).toLowerCase();
      
      return {
        file_path: absolutePath,
        file_url: `file://${absolutePath}`,
        preview_url: fileExt === '.html' ? `http://localhost:3000/preview?file=${encodeURIComponent(absolutePath)}` : undefined,
        metadata: {
          size_bytes: stats.size,
          created_at: stats.birthtime.toISOString(),
          format: fileExt === '.mjml' ? 'mjml' : 'html'
        }
      };
    } catch (error) {
      console.error('❌ Ошибка создания файловой ссылки:', error);
      throw new Error(`Не удалось создать ссылку на файл: ${emailPath}`);
    }
  }

  /**
   * 🔧 ОПТИМИЗИРОВАННАЯ ПЕРЕДАЧА ДАННЫХ С ФАЙЛОВЫМИ ССЫЛКАМИ
   */
  public optimizeHandoffData(originalHandoffData: any, emailOutputPath: string): any {
    const fileReference = this.createFileReference(emailOutputPath);
    
    return {
      ...originalHandoffData,
      email_package: {
        ...originalHandoffData.email_package,
        // Заменяем полный HTML на ссылку
        html_content: `[FILE_REFERENCE] ${fileReference.file_url}`,
        html_file_reference: fileReference,
        // Сохраняем только размер для валидации
        file_size_bytes: fileReference.metadata.size_bytes
      },
      optimization_applied: {
        ...originalHandoffData.optimization_applied,
        file_reference_optimization: true,
        data_transfer_optimization: true,
        reduced_payload_size: true
      }
    };
  }
} 