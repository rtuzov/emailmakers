/**
 * 🌍 MULTI-DESTINATION VALIDATION SERVICE
 * 
 * Специализированный сервис для валидации email кампаний с множественными направлениями
 * - Проверка размера email и оптимизация контента
 * - Валидация изображений (формат, разрешение, размер)
 * - Проверка сезонных дат и временных рамок
 * - Валидация географической консистентности направлений
 * - Проверка responsive layout и совместимости шаблонов
 * 
 * @version 1.0.0
 * @author Email-Makers Quality System
 */

import { 
  MultiDestinationValidationCriteria,
  MultiDestinationValidationResults,
  QualityServiceContext
} from '../types/quality-types';
// import { 
//   MultiDestinationPlan,
//   DestinationPlan,
//   LayoutType
// } from '../../../../shared/types/multi-destination-types'; // Currently unused

export class MultiDestinationValidationService {
  private readonly DEFAULT_MAX_EMAIL_SIZE_KB = 100;
  private readonly DEFAULT_REQUIRED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
  private readonly DEFAULT_MIN_RESOLUTION = { width: 300, height: 200 };

  /**
   * Выполняет комплексную валидацию multi-destination email контента
   */
  async validateMultiDestinationContent(
    context: QualityServiceContext
  ): Promise<MultiDestinationValidationResults> {
    const { input } = context;
    const criteria = input.multi_destination_validation_criteria || {};
    const multiDestinationContext = input.multi_destination_context;

    console.log('🌍 Starting multi-destination content validation', {
      traceId: context.traceId,
      criteria
    });

    try {
      // 1. Валидация размера email
      const emailSizeValidation = await this.validateEmailSize(
        input.email_package.html_output,
        criteria.max_email_size_kb || this.DEFAULT_MAX_EMAIL_SIZE_KB
      );

      // 2. Валидация изображений
      const imageValidation = await this.validateImages(
        input.email_package,
        criteria
      );

      // 3. Валидация дат и сезонности
      const dateValidation = await this.validateDatesAndSeasonality(
        multiDestinationContext,
        criteria.seasonal_date_validation !== false
      );

      // 4. Валидация направлений
      const destinationValidation = await this.validateDestinations(
        multiDestinationContext,
        criteria.destination_consistency_check !== false
      );

      // 5. Валидация layout и responsive дизайна
      const layoutValidation = await this.validateLayout(
        input.email_package,
        multiDestinationContext,
        criteria.layout_responsive_validation !== false
      );

      // 6. Общая валидация
      const overallValidation = this.calculateOverallValidation([
        emailSizeValidation,
        imageValidation,
        dateValidation,
        destinationValidation,
        layoutValidation
      ]);

      return {
        email_size_validation: emailSizeValidation,
        image_validation: imageValidation,
        date_validation: dateValidation,
        destination_validation: destinationValidation,
        layout_validation: layoutValidation,
        overall_validation: overallValidation
      };

    } catch (error) {
      console.error('❌ Multi-destination validation failed:', error);
      return this.generateFailureValidation(error);
    }
  }

  /**
   * Валидация размера email
   */
  private async validateEmailSize(
    htmlContent: string,
    maxSizeKb: number
  ): Promise<MultiDestinationValidationResults['email_size_validation']> {
    const currentSizeBytes = Buffer.byteLength(htmlContent, 'utf8');
    const currentSizeKb = Math.round(currentSizeBytes / 1024);
    const passed = currentSizeKb <= maxSizeKb;

    const optimizationSuggestions: string[] = [];
    if (!passed) {
      optimizationSuggestions.push(
        'Compress images and optimize CSS',
        'Remove unused HTML elements',
        'Inline critical CSS only',
        'Use progressive JPEG format for photos'
      );
    }

    return {
      passed,
      current_size_kb: currentSizeKb,
      max_allowed_kb: maxSizeKb,
      ...(optimizationSuggestions.length > 0 && { optimization_suggestions: optimizationSuggestions })
    };
  }

  /**
   * Валидация изображений
   */
  private async validateImages(
    emailPackage: any,
    criteria: MultiDestinationValidationCriteria
  ): Promise<MultiDestinationValidationResults['image_validation']> {
    const requiredFormats = criteria.required_image_formats || this.DEFAULT_REQUIRED_FORMATS;
    const minResolution = criteria.min_image_resolution || this.DEFAULT_MIN_RESOLUTION;

    // Извлекаем информацию об изображениях из email package
    const images = this._extractImagesFromEmailPackage(emailPackage);
    
    const invalidFormats: string[] = [];
    const lowResolutionImages: string[] = [];
    const oversizedImages: string[] = [];

    images.forEach((image: any) => {
      // Проверка формата
      const format = this.getImageFormat(image.url);
      if (!requiredFormats.includes(format)) {
        invalidFormats.push(`${image.name}: ${format} (required: ${requiredFormats.join(', ')})`);
      }

      // Проверка разрешения (mock проверка)
      if (image.width < minResolution.width || image.height < minResolution.height) {
        lowResolutionImages.push(`${image.name}: ${image.width}x${image.height} (min: ${minResolution.width}x${minResolution.height})`);
      }

      // Проверка размера файла
      if (image.sizeKb > 500) { // Больше 500KB считаем oversized
        oversizedImages.push(`${image.name}: ${image.sizeKb}KB (recommended: <500KB)`);
      }
    });

    const passed = invalidFormats.length === 0 && 
                   lowResolutionImages.length === 0 && 
                   oversizedImages.length === 0;

    const suggestions: string[] = [];
    if (!passed) {
      if (invalidFormats.length > 0) {
        suggestions.push('Convert images to supported formats (JPEG, PNG, WebP)');
      }
      if (lowResolutionImages.length > 0) {
        suggestions.push('Increase image resolution for better quality');
      }
      if (oversizedImages.length > 0) {
        suggestions.push('Compress oversized images to reduce email size');
      }
    }

    return {
      passed,
      total_images: images.length,
      invalid_formats: invalidFormats,
      low_resolution_images: lowResolutionImages,
      oversized_images: oversizedImages,
      ...(suggestions.length > 0 && { suggestions })
    };
  }

  /**
   * Валидация дат и сезонности
   */
  private async validateDatesAndSeasonality(
    multiDestinationContext: any,
    enableValidation: boolean
  ): Promise<MultiDestinationValidationResults['date_validation']> {
    if (!enableValidation || !multiDestinationContext) {
      return {
        passed: true,
        seasonal_consistency: true,
        optimal_timing: true,
        date_conflicts: []
      };
    }

    const dateConflicts: string[] = [];
    const recommendations: string[] = [];

    // Проверяем сезонную консистентность
    const seasonalConsistency = this.checkSeasonalConsistency(multiDestinationContext);
    if (!seasonalConsistency.consistent) {
      dateConflicts.push(...seasonalConsistency.conflicts);
    }

    // Проверяем оптимальное время для кампании
    const optimalTiming = this.checkOptimalTiming(multiDestinationContext);
    if (!optimalTiming.optimal) {
      recommendations.push(...optimalTiming.suggestions);
    }

    const passed = dateConflicts.length === 0;

    return {
      passed,
      seasonal_consistency: seasonalConsistency.consistent,
      optimal_timing: optimalTiming.optimal,
      date_conflicts: dateConflicts,
      ...(recommendations.length > 0 && { recommendations })
    };
  }

  /**
   * Валидация географической консистентности направлений
   */
  private async validateDestinations(
    multiDestinationContext: any,
    enableValidation: boolean
  ): Promise<MultiDestinationValidationResults['destination_validation']> {
    if (!enableValidation || !multiDestinationContext) {
      return {
        passed: true,
        geographic_consistency: true,
        pricing_consistency: true,
        content_relevance_score: 1.0
      };
    }

    const inconsistencies: string[] = [];

    // Проверяем географическую консистентность
    const geographicConsistency = this.checkGeographicConsistency(multiDestinationContext);
    
    // Проверяем ценовую консистентность
    const pricingConsistency = this.checkPricingConsistency(multiDestinationContext);
    
    // Рассчитываем релевантность контента
    const contentRelevanceScore = this.calculateContentRelevance(multiDestinationContext);

    if (!geographicConsistency.consistent) {
      inconsistencies.push(...geographicConsistency.issues);
    }
    
    if (!pricingConsistency.consistent) {
      inconsistencies.push(...pricingConsistency.issues);
    }

    if (contentRelevanceScore < 0.7) {
      inconsistencies.push(`Low content relevance score: ${(contentRelevanceScore * 100).toFixed(1)}%`);
    }

    const passed = inconsistencies.length === 0 && contentRelevanceScore >= 0.7;

    return {
      passed,
      geographic_consistency: geographicConsistency.consistent,
      pricing_consistency: pricingConsistency.consistent,
      content_relevance_score: contentRelevanceScore,
      ...(inconsistencies.length > 0 && { inconsistencies })
    };
  }

  /**
   * Валидация layout и responsive дизайна
   */
  private async validateLayout(
    emailPackage: any,
    multiDestinationContext: any,
    enableValidation: boolean
  ): Promise<MultiDestinationValidationResults['layout_validation']> {
    if (!enableValidation) {
      return {
        passed: true,
        responsive_compatibility: true,
        template_suitability: true,
        mobile_optimization_score: 0.9
      };
    }

    const layoutIssues: string[] = [];

    // Проверяем responsive совместимость
    const responsiveCompatibility = this.checkResponsiveCompatibility(emailPackage);
    
    // Проверяем подходящность шаблона
    const templateSuitability = this.checkTemplateSuitability(
      emailPackage, 
      multiDestinationContext
    );
    
    // Рассчитываем мобильную оптимизацию
    const mobileOptimizationScore = this.calculateMobileOptimization(emailPackage);

    if (!responsiveCompatibility.compatible) {
      layoutIssues.push(...responsiveCompatibility.issues);
    }
    
    if (!templateSuitability.suitable) {
      layoutIssues.push(...templateSuitability.issues);
    }

    if (mobileOptimizationScore < 0.8) {
      layoutIssues.push(`Low mobile optimization score: ${(mobileOptimizationScore * 100).toFixed(1)}%`);
    }

    const passed = layoutIssues.length === 0 && mobileOptimizationScore >= 0.8;

    return {
      passed,
      responsive_compatibility: responsiveCompatibility.compatible,
      template_suitability: templateSuitability.suitable,
      mobile_optimization_score: mobileOptimizationScore,
      ...(layoutIssues.length > 0 && { layout_issues: layoutIssues })
    };
  }

  /**
   * Расчет общей валидации
   */
  private calculateOverallValidation(
    validations: Array<{ passed: boolean }>
  ): MultiDestinationValidationResults['overall_validation'] {
    const passedCount = validations.filter(v => v.passed).length;
    const totalCount = validations.length;
    const confidenceScore = totalCount > 0 ? passedCount / totalCount : 0;
    const passed = passedCount === totalCount;

    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!passed) {
      if (confidenceScore < 0.5) {
        criticalIssues.push('Multiple critical validation failures detected');
      } else if (confidenceScore < 0.8) {
        warnings.push('Some validation checks failed - review required');
      }

      recommendations.push(
        'Review and fix validation issues before campaign deployment',
        'Test email rendering across multiple clients',
        'Validate mobile responsiveness'
      );
    }

    return {
      passed,
      confidence_score: confidenceScore,
      critical_issues: criticalIssues,
      warnings,
      recommendations
    };
  }

  // Helper methods
  
  private _extractImagesFromEmailPackage(_emailPackage: any): Array<{ // Currently unused
    name: string;
    url: string;
    width: number;
    height: number;
    sizeKb: number;
  }> {
    // Mock implementation - в реальности парсим HTML или используем metadata
    return [
      { name: 'hero-image.jpg', url: 'https://example.com/hero.jpg', width: 600, height: 400, sizeKb: 245 },
      { name: 'destination-1.jpg', url: 'https://example.com/dest1.jpg', width: 300, height: 200, sizeKb: 120 },
      { name: 'destination-2.jpg', url: 'https://example.com/dest2.jpg', width: 300, height: 200, sizeKb: 135 }
    ];
  }

  private getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase() || '';
    return extension;
  }

  private checkSeasonalConsistency(_context: any): { consistent: boolean; conflicts: string[] } {
    // Mock implementation
    return {
      consistent: true,
      conflicts: []
    };
  }

  private checkOptimalTiming(_context: any): { optimal: boolean; suggestions: string[] } {
    // Mock implementation
    return {
      optimal: true,
      suggestions: []
    };
  }

  private checkGeographicConsistency(_context: any): { consistent: boolean; issues: string[] } {
    // Mock implementation
    return {
      consistent: true,
      issues: []
    };
  }

  private checkPricingConsistency(_context: any): { consistent: boolean; issues: string[] } {
    // Mock implementation
    return {
      consistent: true,
      issues: []
    };
  }

  private calculateContentRelevance(_context: any): number {
    // Mock implementation - возвращаем высокую релевантность
    return 0.92;
  }

  private checkResponsiveCompatibility(_emailPackage: any): { compatible: boolean; issues: string[] } {
    // Mock implementation
    return {
      compatible: true,
      issues: []
    };
  }

  private checkTemplateSuitability(_emailPackage: any, _context: any): { suitable: boolean; issues: string[] } {
    // Mock implementation
    return {
      suitable: true,
      issues: []
    };
  }

  private calculateMobileOptimization(_emailPackage: any): number {
    // Mock implementation
    return 0.88;
  }

  private generateFailureValidation(error: any): MultiDestinationValidationResults {
    return {
      email_size_validation: {
        passed: false,
        current_size_kb: 0,
        max_allowed_kb: this.DEFAULT_MAX_EMAIL_SIZE_KB,
        optimization_suggestions: ['Validation failed - unable to determine size']
      },
      image_validation: {
        passed: false,
        total_images: 0,
        invalid_formats: [],
        low_resolution_images: [],
        oversized_images: [],
        suggestions: ['Validation failed - unable to analyze images']
      },
      date_validation: {
        passed: false,
        seasonal_consistency: false,
        optimal_timing: false,
        date_conflicts: ['Validation failed - unable to check dates']
      },
      destination_validation: {
        passed: false,
        geographic_consistency: false,
        pricing_consistency: false,
        content_relevance_score: 0,
        inconsistencies: ['Validation failed - unable to analyze destinations']
      },
      layout_validation: {
        passed: false,
        responsive_compatibility: false,
        template_suitability: false,
        layout_issues: ['Validation failed - unable to analyze layout'],
        mobile_optimization_score: 0
      },
      overall_validation: {
        passed: false,
        confidence_score: 0,
        critical_issues: [`Validation service error: ${error.message || 'Unknown error'}`],
        warnings: [],
        recommendations: ['Retry validation after fixing the service error']
      }
    };
  }
}