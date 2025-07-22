/**
 * 🎨 MULTI-DESTINATION LAYOUT SERVICE
 * 
 * Интеллектуальный сервис для выбора MJML шаблонов и планирования изображений
 * для multi-destination email кампаний. Совместим с OpenAI Agents SDK v2.
 * 
 * Основные функции:
 * - Автоматический выбор подходящего MJML шаблона по количеству направлений
 * - Планирование изображений и layout структуры
 * - Оптимизация отображения для различных устройств
 * - Интеграция с Figma API для получения assets
 */

import {
  MultiDestinationPlan,
  DestinationPlan,
  LayoutType,
  // LAYOUT_TYPES, // Currently unused
  MULTI_DESTINATION_LIMITS
} from '../../../../shared/types/multi-destination-types';

export interface TemplateSelectionCriteria {
  destinationCount: number;
  layoutPreference?: LayoutType;
  deviceTargets: ('mobile' | 'tablet' | 'desktop')[];
  brandingRequirements?: {
    mustIncludeLogo: boolean;
    colorSchemeCompliance: boolean;
    fontConsistency: boolean;
  };
  contentComplexity: 'simple' | 'detailed' | 'rich';
  performancePriority: 'speed' | 'visual_quality' | 'balanced';
}

export interface SelectedTemplate {
  templateName: string;
  templatePath: string;
  layoutType: LayoutType;
  estimatedFileSize: number;
  optimizedFor: ('mobile' | 'tablet' | 'desktop')[];
  renderingComplexity: 'low' | 'medium' | 'high';
  mjmlVersion: string;
  compatibilityScore: number;
}

export interface ImagePlan {
  destinationId: string;
  images: {
    primary: {
      figmaUrl?: string;
      dimensions: { width: number; height: number };
      format: 'jpg' | 'png' | 'webp';
      quality: number;
      alt: string;
      loading: 'eager' | 'lazy';
    };
    gallery?: Array<{
      figmaUrl?: string;
      dimensions: { width: number; height: number };
      format: 'jpg' | 'png' | 'webp';
      category: 'landmark' | 'food' | 'culture' | 'nature' | 'activity';
      alt: string;
    }>;
    thumbnails?: {
      small: { width: number; height: number };
      medium: { width: number; height: number };
    };
  };
  totalEstimatedSize: number;
  compressionStrategy: 'aggressive' | 'balanced' | 'quality_first';
}

export interface LayoutOptimization {
  templateSelection: SelectedTemplate;
  imagePlans: ImagePlan[];
  responsiveBreakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  performanceMetrics: {
    estimatedLoadTime: number;
    totalFileSize: number;
    imageOptimizationSavings: number;
  };
  recommendations: string[];
}

export interface MultiDestinationLayoutConfig {
  templateBaseDirectory?: string;
  defaultImageDimensions?: {
    primary: { width: number; height: number };
    thumbnail: { width: number; height: number };
  };
  compressionSettings?: {
    jpegQuality: number;
    pngOptimization: boolean;
    webpFallback: boolean;
  };
  performanceTargets?: {
    maxTotalFileSize: number;
    maxLoadTime: number;
    minCompatibilityScore: number;
  };
}

export class MultiDestinationLayoutService {
  private config: Required<MultiDestinationLayoutConfig>;
  private readonly templateMappings: Record<LayoutType, string[]>;

  constructor(config: MultiDestinationLayoutConfig = {}) {
    this.config = {
      templateBaseDirectory: config.templateBaseDirectory || '/src/domains/template-processing/templates',
      defaultImageDimensions: config.defaultImageDimensions || {
        primary: { width: 600, height: 400 },
        thumbnail: { width: 150, height: 100 }
      },
      compressionSettings: config.compressionSettings || {
        jpegQuality: 85,
        pngOptimization: true,
        webpFallback: true
      },
      performanceTargets: config.performanceTargets || {
        maxTotalFileSize: 100000, // 100KB
        maxLoadTime: 3000, // 3 seconds
        minCompatibilityScore: 85
      },
      ...config
    };

    this.templateMappings = {
      compact: ['multi-destination-compact.mjml'],
      grid: ['multi-destination-grid.mjml'],
      carousel: ['multi-destination-carousel.mjml'],
      list: ['multi-destination-grid.mjml'], // Alternative grid layout
      featured: ['multi-destination-compact.mjml'] // Alternative compact layout
    };
  }

  /**
   * Выбор оптимального MJML шаблона на основе критериев
   */
  async selectOptimalTemplate(
    plan: MultiDestinationPlan,
    criteria: TemplateSelectionCriteria
  ): Promise<SelectedTemplate> {
    console.log(`🎯 Selecting optimal template for ${criteria.destinationCount} destinations`);

    try {
      // Шаг 1: Определение layout типа
      const layoutType = this.determineLayoutType(criteria);
      
      // Шаг 2: Выбор конкретного шаблона
      const templateName = this.selectTemplateByLayout(layoutType, criteria);
      
      // Шаг 3: Анализ характеристик шаблона
      const templateAnalysis = await this.analyzeTemplate(templateName, plan, criteria);
      
      // Шаг 4: Оценка совместимости
      const compatibilityScore = this.calculateCompatibilityScore(templateAnalysis, criteria);

      const selectedTemplate: SelectedTemplate = {
        templateName,
        templatePath: `${this.config.templateBaseDirectory}/${templateName}`,
        layoutType,
        estimatedFileSize: templateAnalysis.estimatedSize,
        optimizedFor: this.getOptimizedDevices(layoutType, criteria),
        renderingComplexity: this.assessRenderingComplexity(layoutType, criteria),
        mjmlVersion: '4.15.0',
        compatibilityScore
      };

      console.log(`✅ Selected template: ${templateName} (${layoutType}, score: ${compatibilityScore})`);
      return selectedTemplate;

    } catch (error) {
      console.error('❌ Template selection error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Планирование изображений для всех направлений
   */
  async planDestinationImages(
    destinations: DestinationPlan[],
    layoutType: LayoutType,
    performancePriority: 'speed' | 'visual_quality' | 'balanced' = 'balanced'
  ): Promise<ImagePlan[]> {
    console.log(`🖼️ Planning images for ${destinations.length} destinations (${layoutType} layout)`);

    try {
      const imagePlans: ImagePlan[] = [];

      for (const destination of destinations) {
        const plan = await this.createImagePlanForDestination(
          destination,
          layoutType,
          performancePriority
        );
        imagePlans.push(plan);
      }

      // Оптимизация общего размера
      const optimizedPlans = this.optimizeImagePlansForPerformance(imagePlans, performancePriority);

      console.log(`✅ Created image plans for ${optimizedPlans.length} destinations`);
      return optimizedPlans;

    } catch (error) {
      console.error('❌ Image planning error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Комплексная оптимизация layout для multi-destination кампании
   */
  async optimizeLayoutForCampaign(
    plan: MultiDestinationPlan,
    criteria: TemplateSelectionCriteria
  ): Promise<LayoutOptimization> {
    console.log(`🚀 Optimizing layout for campaign: ${plan.name}`);

    try {
      // Шаг 1: Выбор шаблона
      const templateSelection = await this.selectOptimalTemplate(plan, criteria);
      
      // Шаг 2: Планирование изображений
      const imagePlans = await this.planDestinationImages(
        plan.destinations,
        templateSelection.layoutType,
        criteria.performancePriority
      );
      
      // Шаг 3: Настройка responsive breakpoints
      const responsiveBreakpoints = this.calculateResponsiveBreakpoints(
        templateSelection.layoutType,
        criteria.deviceTargets
      );
      
      // Шаг 4: Расчет метрик производительности
      const performanceMetrics = this.calculatePerformanceMetrics(
        templateSelection,
        imagePlans
      );
      
      // Шаг 5: Генерация рекомендаций
      const recommendations = this.generateOptimizationRecommendations(
        templateSelection,
        imagePlans,
        performanceMetrics,
        criteria
      );

      const optimization: LayoutOptimization = {
        templateSelection,
        imagePlans,
        responsiveBreakpoints,
        performanceMetrics,
        recommendations
      };

      console.log(`✅ Layout optimization completed: ${performanceMetrics.estimatedLoadTime}ms load time`);
      return optimization;

    } catch (error) {
      console.error('❌ Layout optimization error:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Валидация совместимости выбранного layout
   */
  validateLayoutCompatibility(
    optimization: LayoutOptimization,
    requirements: {
      maxFileSize?: number;
      maxLoadTime?: number;
      requiredDeviceSupport?: ('mobile' | 'tablet' | 'desktop')[];
      minQualityScore?: number;
    }
  ): {
    isValid: boolean;
    issues: Array<{
      type: 'performance' | 'compatibility' | 'quality';
      message: string;
      severity: 'error' | 'warning' | 'info';
      suggestion?: string;
    }>;
  } {
    const issues: any[] = [];
    
    // Проверка размера файлов
    if (requirements.maxFileSize && optimization.performanceMetrics.totalFileSize > requirements.maxFileSize) {
      issues.push({
        type: 'performance',
        message: `Total file size (${optimization.performanceMetrics.totalFileSize}B) exceeds limit (${requirements.maxFileSize}B)`,
        severity: 'error',
        suggestion: 'Consider using more aggressive image compression or smaller image dimensions'
      });
    }
    
    // Проверка времени загрузки
    if (requirements.maxLoadTime && optimization.performanceMetrics.estimatedLoadTime > requirements.maxLoadTime) {
      issues.push({
        type: 'performance',
        message: `Estimated load time (${optimization.performanceMetrics.estimatedLoadTime}ms) exceeds limit (${requirements.maxLoadTime}ms)`,
        severity: 'warning',
        suggestion: 'Optimize images or consider lazy loading for gallery images'
      });
    }
    
    // Проверка поддержки устройств
    if (requirements.requiredDeviceSupport) {
      const supportedDevices = optimization.templateSelection.optimizedFor;
      const missingSupport = requirements.requiredDeviceSupport.filter(
        device => !supportedDevices.includes(device)
      );
      
      if (missingSupport.length > 0) {
        issues.push({
          type: 'compatibility',
          message: `Template lacks optimization for: ${missingSupport.join(', ')}`,
          severity: 'warning',
          suggestion: 'Consider selecting a different template or adding responsive breakpoints'
        });
      }
    }
    
    // Проверка качества
    if (requirements.minQualityScore && optimization.templateSelection.compatibilityScore < requirements.minQualityScore) {
      issues.push({
        type: 'quality',
        message: `Template compatibility score (${optimization.templateSelection.compatibilityScore}) below minimum (${requirements.minQualityScore})`,
        severity: 'warning',
        suggestion: 'Consider adjusting criteria or selecting a different template'
      });
    }

    return {
      isValid: issues.filter(issue => issue.severity === 'error').length === 0,
      issues
    };
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ============

  /**
   * Определение layout типа на основе критериев
   */
  private determineLayoutType(criteria: TemplateSelectionCriteria): LayoutType {
    const { destinationCount, layoutPreference } = criteria;
    
    // Если есть явное предпочтение и оно подходит для количества направлений
    if (layoutPreference && this.isLayoutSuitableForCount(layoutPreference, destinationCount)) {
      return layoutPreference;
    }
    
    // Автоматический выбор на основе количества
    if (destinationCount <= 3) return 'compact';
    if (destinationCount <= 6) return 'grid';
    return 'carousel';
  }

  /**
   * Проверка подходящности layout для количества направлений
   */
  private isLayoutSuitableForCount(layout: LayoutType, count: number): boolean {
    const limits = MULTI_DESTINATION_LIMITS.OPTIMAL_DESTINATIONS[layout];
    if (!limits) return false;
    
    return count >= limits.min && count <= limits.max;
  }

  /**
   * Выбор конкретного шаблона по layout типу
   */
  private selectTemplateByLayout(layoutType: LayoutType, _criteria: TemplateSelectionCriteria): string {
    const templates = this.templateMappings[layoutType];
    if (!templates || templates.length === 0) {
      throw new Error(`No templates available for layout type: ${layoutType}`);
    }
    
    // Пока возвращаем первый доступный шаблон
    // В будущем можно добавить логику выбора на основе дополнительных критериев
    const selectedTemplate = templates[0];
    if (!selectedTemplate) {
      throw new Error(`Template selection failed for layout type: ${layoutType}`);
    }
    return selectedTemplate;
  }

  /**
   * Анализ характеристик шаблона
   */
  private async analyzeTemplate(
    templateName: string,
    _plan: MultiDestinationPlan,
    _criteria: TemplateSelectionCriteria
  ): Promise<{ estimatedSize: number; complexity: 'low' | 'medium' | 'high' }> {
    // Базовые размеры шаблонов (примерные)
    const templateSizes: Record<string, number> = {
      'multi-destination-compact.mjml': 15000,
      'multi-destination-grid.mjml': 20000,
      'multi-destination-carousel.mjml': 25000
    };
    
    const baseSize = templateSizes[templateName] || 18000;
    
    // Добавляем размер на основе количества направлений и сложности контента
    const contentMultiplier = this.getContentSizeMultiplier(_criteria);
    const estimatedSize = Math.round(baseSize * contentMultiplier);
    
    return {
      estimatedSize,
      complexity: this.assessTemplateComplexity(templateName, _criteria)
    };
  }

  /**
   * Получение множителя размера на основе сложности контента
   */
  private getContentSizeMultiplier(criteria: TemplateSelectionCriteria): number {
    let multiplier = 1;
    
    // Множитель по количеству направлений
    multiplier += (criteria.destinationCount - 2) * 0.1;
    
    // Множитель по сложности контента
    switch (criteria.contentComplexity) {
      case 'simple': multiplier *= 0.8; break;
      case 'detailed': multiplier *= 1.2; break;
      case 'rich': multiplier *= 1.5; break;
    }
    
    return Math.max(0.5, Math.min(3, multiplier));
  }

  /**
   * Оценка сложности рендеринга шаблона
   */
  private assessTemplateComplexity(templateName: string, _criteria: TemplateSelectionCriteria): 'low' | 'medium' | 'high' {
    if (templateName.includes('compact')) return 'low';
    if (templateName.includes('grid')) return 'medium';
    if (templateName.includes('carousel')) return 'high';
    return 'medium';
  }

  /**
   * Оценка рендеринга на основе layout и критериев
   */
  private assessRenderingComplexity(layoutType: LayoutType, criteria: TemplateSelectionCriteria): 'low' | 'medium' | 'high' {
    if (layoutType === 'compact') return 'low';
    if (layoutType === 'grid' && criteria.destinationCount <= 4) return 'medium';
    if (layoutType === 'carousel' || criteria.destinationCount > 8) return 'high';
    return 'medium';
  }

  /**
   * Расчет совместимости шаблона
   */
  private calculateCompatibilityScore(
    templateAnalysis: { estimatedSize: number; complexity: 'low' | 'medium' | 'high' },
    criteria: TemplateSelectionCriteria
  ): number {
    let score = 90; // Базовый высокий балл
    
    // Снижение за превышение целевого размера
    const targetSize = this.config.performanceTargets.maxTotalFileSize;
    if (templateAnalysis.estimatedSize > targetSize) {
      const overageRatio = templateAnalysis.estimatedSize / targetSize;
      score -= Math.min(20, (overageRatio - 1) * 30);
    }
    
    // Снижение за высокую сложность при приоритете скорости
    if (criteria.performancePriority === 'speed' && templateAnalysis.complexity === 'high') {
      score -= 15;
    }
    
    // Бонус за соответствие device targets
    if (criteria.deviceTargets.includes('mobile') && templateAnalysis.complexity === 'low') {
      score += 5;
    }
    
    return Math.max(50, Math.min(100, Math.round(score)));
  }

  /**
   * Получение устройств, для которых оптимизирован layout
   */
  private getOptimizedDevices(
    layoutType: LayoutType, 
    criteria: TemplateSelectionCriteria
  ): ('mobile' | 'tablet' | 'desktop')[] {
    const devices: ('mobile' | 'tablet' | 'desktop')[] = [];
    
    // Все layout поддерживают mobile через responsive design
    devices.push('mobile');
    
    if (layoutType !== 'carousel') {
      devices.push('tablet');
    }
    
    devices.push('desktop');
    
    return devices.filter(device => criteria.deviceTargets.includes(device));
  }

  /**
   * Создание плана изображений для одного направления
   */
  private async createImagePlanForDestination(
    destination: DestinationPlan,
    layoutType: LayoutType,
    performancePriority: 'speed' | 'visual_quality' | 'balanced'
  ): Promise<ImagePlan> {
    const dimensions = this.getImageDimensionsForLayout(layoutType);
    const compressionStrategy = this.getCompressionStrategy(performancePriority);
    
    const primaryImage = {
      ...(destination.assets.primary_image.url ? { figmaUrl: destination.assets.primary_image.url } : {}),
      dimensions: dimensions.primary,
      format: this.selectOptimalFormat(performancePriority),
      quality: this.getImageQuality(performancePriority),
      alt: destination.assets.primary_image.alt_text,
      loading: destination.priority === 'primary' ? 'eager' as const : 'lazy' as const
    };
    
    const estimatedPrimarySize = this.estimateImageSize(primaryImage.dimensions, primaryImage.format, primaryImage.quality);
    
    return {
      destinationId: destination.id,
      images: {
        primary: primaryImage,
        thumbnails: {
          small: { width: 150, height: 100 },
          medium: { width: 300, height: 200 }
        }
      },
      totalEstimatedSize: estimatedPrimarySize,
      compressionStrategy
    };
  }

  /**
   * Получение размеров изображений для layout
   */
  private getImageDimensionsForLayout(layoutType: LayoutType): {
    primary: { width: number; height: number };
  } {
    switch (layoutType) {
      case 'compact':
        return { primary: { width: 600, height: 400 } };
      case 'grid':
        return { primary: { width: 400, height: 300 } };
      case 'carousel':
        return { primary: { width: 350, height: 250 } };
      default:
        return this.config.defaultImageDimensions;
    }
  }

  /**
   * Получение стратегии сжатия
   */
  private getCompressionStrategy(performancePriority: 'speed' | 'visual_quality' | 'balanced'): 'aggressive' | 'balanced' | 'quality_first' {
    switch (performancePriority) {
      case 'speed': return 'aggressive';
      case 'visual_quality': return 'quality_first';
      case 'balanced': return 'balanced';
    }
  }

  /**
   * Выбор оптимального формата изображения
   */
  private selectOptimalFormat(performancePriority: 'speed' | 'visual_quality' | 'balanced'): 'jpg' | 'png' | 'webp' {
    if (performancePriority === 'speed') return 'jpg';
    if (performancePriority === 'visual_quality') return 'png';
    return 'jpg'; // Balanced default
  }

  /**
   * Получение качества изображения
   */
  private getImageQuality(performancePriority: 'speed' | 'visual_quality' | 'balanced'): number {
    switch (performancePriority) {
      case 'speed': return 70;
      case 'visual_quality': return 95;
      case 'balanced': return 85;
    }
  }

  /**
   * Оценка размера изображения
   */
  private estimateImageSize(
    dimensions: { width: number; height: number },
    format: 'jpg' | 'png' | 'webp',
    quality: number
  ): number {
    const pixels = dimensions.width * dimensions.height;
    
    // Базовые коэффициенты сжатия
    const compressionRatios = {
      jpg: 0.05, // ~20:1 compression
      webp: 0.04, // ~25:1 compression  
      png: 0.2    // ~5:1 compression
    };
    
    const baseSize = pixels * 3; // RGB
    const compressionRatio = compressionRatios[format];
    const qualityMultiplier = quality / 100;
    
    return Math.round(baseSize * compressionRatio * qualityMultiplier);
  }

  /**
   * Оптимизация планов изображений для производительности
   */
  private optimizeImagePlansForPerformance(
    plans: ImagePlan[],
    performancePriority: 'speed' | 'visual_quality' | 'balanced'
  ): ImagePlan[] {
    if (performancePriority !== 'speed') return plans;
    
    // Для приоритета скорости - агрессивная оптимизация
    return plans.map(plan => ({
      ...plan,
      images: {
        ...plan.images,
        primary: {
          ...plan.images.primary,
          quality: Math.min(plan.images.primary.quality, 75),
          format: 'jpg' as const
        }
      },
      compressionStrategy: 'aggressive' as const,
      totalEstimatedSize: Math.round(plan.totalEstimatedSize * 0.7)
    }));
  }

  /**
   * Создание минимальных планов изображений (альтернативный способ)
   */
  /*
  private __createMinimalImagePlans(_: DestinationPlan[]): never { // Currently unused
    throw new Error('createMinimalImagePlans is disabled by project policy.');
  }
  */

  /**
   * Расчет responsive breakpoints
   */
  private calculateResponsiveBreakpoints(
    layoutType: LayoutType,
    _deviceTargets: ('mobile' | 'tablet' | 'desktop')[]
  ): { mobile: number; tablet: number; desktop: number } {
    // Базовые breakpoints
    const base = { mobile: 768, tablet: 1024, desktop: 1200 };
    
    // Корректировка для carousel layout (требует больше пространства)
    if (layoutType === 'carousel') {
      return {
        mobile: base.mobile,
        tablet: base.tablet + 100,
        desktop: base.desktop + 200
      };
    }
    
    return base;
  }

  /**
   * Расчет метрик производительности
   */
  private calculatePerformanceMetrics(
    templateSelection: SelectedTemplate,
    imagePlans: ImagePlan[]
  ): {
    estimatedLoadTime: number;
    totalFileSize: number;
    imageOptimizationSavings: number;
  } {
    const totalImageSize = imagePlans.reduce((sum, plan) => sum + plan.totalEstimatedSize, 0);
    const totalFileSize = templateSelection.estimatedFileSize + totalImageSize;
    
    // Простая модель времени загрузки (основана на размере файла)
    const estimatedLoadTime = Math.round((totalFileSize / 1000) * 50); // ~50ms per KB
    
    // Расчет экономии от оптимизации (сравнение с неоптимизированными изображениями)
    const unoptimizedImageSize = imagePlans.length * 50000; // 50KB per unoptimized image
    const imageOptimizationSavings = Math.max(0, unoptimizedImageSize - totalImageSize);
    
    return {
      estimatedLoadTime,
      totalFileSize,
      imageOptimizationSavings
    };
  }

  /**
   * Генерация рекомендаций по оптимизации
   */
  private generateOptimizationRecommendations(
    templateSelection: SelectedTemplate,
    imagePlans: ImagePlan[],
    performanceMetrics: { estimatedLoadTime: number; totalFileSize: number; imageOptimizationSavings: number },
    criteria: TemplateSelectionCriteria
  ): string[] {
    const recommendations: string[] = [];
    
    // Рекомендации по производительности
    if (performanceMetrics.totalFileSize > this.config.performanceTargets.maxTotalFileSize) {
      recommendations.push(`Рассмотрите сжатие изображений: текущий размер ${performanceMetrics.totalFileSize}B превышает цель ${this.config.performanceTargets.maxTotalFileSize}B`);
    }
    
    if (performanceMetrics.estimatedLoadTime > this.config.performanceTargets.maxLoadTime) {
      recommendations.push(`Оптимизируйте загрузку: текущее время ${performanceMetrics.estimatedLoadTime}ms превышает цель ${this.config.performanceTargets.maxLoadTime}ms`);
    }
    
    // Рекомендации по template
    if (templateSelection.compatibilityScore < this.config.performanceTargets.minCompatibilityScore) {
      recommendations.push(`Рассмотрите другой шаблон: текущий рейтинг совместимости ${templateSelection.compatibilityScore} ниже целевого ${this.config.performanceTargets.minCompatibilityScore}`);
    }
    
    // Рекомендации по изображениям
    const highQualityImages = imagePlans.filter(plan => plan.images.primary.quality > 90);
    if (highQualityImages.length > 0 && criteria.performancePriority === 'speed') {
      recommendations.push(`Снизьте качество ${highQualityImages.length} изображений для улучшения скорости загрузки`);
    }
    
    // Позитивные рекомендации
    if (performanceMetrics.imageOptimizationSavings > 10000) {
      recommendations.push(`Отличная оптимизация изображений: экономия ${Math.round(performanceMetrics.imageOptimizationSavings / 1000)}KB`);
    }
    
    return recommendations;
  }

  /**
   * Получение fallback шаблона
   */
  /*
  private _getFallbackTemplate(_destinationCount: number): never { // Currently unused
    throw new Error('getFallbackTemplate is disabled by project policy.');
  }
  */
}