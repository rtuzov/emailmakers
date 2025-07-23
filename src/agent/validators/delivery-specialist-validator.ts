// import { z } from 'zod';
import {
  HandoffValidationResult,
  HandoffValidationError,
  CorrectionSuggestion,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

/**
 * 📦 DELIVERY SPECIALIST VALIDATOR
 * 
 * Финальная валидация выходных данных системы перед доставкой клиенту
 * Принцип: Абсолютная готовность к доставке, размер пакета <600KB, полная комплектация
 */

export interface DeliveryPackage {
  html_email: string;
  mjml_source?: string;
  assets: AssetFile[];
  metadata: DeliveryMetadata;
  documentation: DeliveryDocumentation;
  preview_files: PreviewFile[];
}

export interface AssetFile {
  filename: string;
  content: Buffer | string;
  size_bytes: number;
  mime_type: string;
  optimized: boolean;
}

export interface DeliveryMetadata {
  package_version: string;
  creation_date: string;
  quality_score: number;
  compatibility_report: string;
  accessibility_report: string;
  performance_metrics: string;
  total_size_kb: number;
}

export interface DeliveryDocumentation {
  readme: string;
  implementation_guide: string;
  testing_notes: string;
  browser_support: string;
  troubleshooting: string;
}

export interface PreviewFile {
  filename: string;
  content: string;
  type: 'desktop' | 'mobile' | 'dark_mode' | 'plain_text';
  size_bytes: number;
}

export interface PackageIntegrityReport {
  total_files: number;
  total_size_bytes: number;
  total_size_kb: number;
  html_size_kb: number;
  assets_size_kb: number;
  documentation_size_kb: number;
  compression_ratio: number;
  within_size_limit: boolean;
  missing_files: string[];
  corrupted_files: string[];
}

export class DeliverySpecialistValidator {
  private static instance: DeliverySpecialistValidator;

  private constructor() {}

  public static getInstance(): DeliverySpecialistValidator {
    if (!DeliverySpecialistValidator.instance) {
      DeliverySpecialistValidator.instance = new DeliverySpecialistValidator();
    }
    return DeliverySpecialistValidator.instance;
  }

  /**
   * 🎯 ОСНОВНАЯ ВАЛИДАЦИЯ ФИНАЛЬНОГО ПАКЕТА ДОСТАВКИ
   */
  public async validateDeliveryPackage(
    deliveryPackage: any,
    enableStrictValidation: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    
    try {
      const errors: HandoffValidationError[] = [];
      const warnings: string[] = [];
      const correctionSuggestions: CorrectionSuggestion[] = [];
      
      // 1. ПРОВЕРКА СТРУКТУРЫ ПАКЕТА
      const structureValidation = this.validatePackageStructure(deliveryPackage);
      if (!structureValidation.isValid) {
        errors.push(...structureValidation.errors);
        correctionSuggestions.push(...structureValidation.suggestions);
      }
      
      // 2. ЖЕСТКАЯ ПРОВЕРКА РАЗМЕРА ПАКЕТА <600KB
      const sizeValidation = await this.validatePackageSize(deliveryPackage);
      if (!sizeValidation.isValid) {
        errors.push(...sizeValidation.errors);
        correctionSuggestions.push(...sizeValidation.suggestions);
      }
      
      // 3. ВАЛИДАЦИЯ ЦЕЛОСТНОСТИ ВСЕХ ФАЙЛОВ
      const integrityValidation = await this.validateFileIntegrity(deliveryPackage);
      if (!integrityValidation.isValid) {
        errors.push(...integrityValidation.errors);
        correctionSuggestions.push(...integrityValidation.suggestions);
      }
      
      // 4. ПРОВЕРКА КАЧЕСТВА ФИНАЛЬНОГО HTML
      const htmlValidation = this.validateFinalHTML(deliveryPackage.html_email);
      if (!htmlValidation.isValid) {
        errors.push(...htmlValidation.errors);
        correctionSuggestions.push(...htmlValidation.suggestions);
      }
      
      // 5. ВАЛИДАЦИЯ EXPORT ФОРМАТОВ
      const exportValidation = this.validateExportFormats(deliveryPackage);
      if (!exportValidation.isValid) {
        errors.push(...exportValidation.errors);
        correctionSuggestions.push(...exportValidation.suggestions);
      }
      
      // 6. ПРОВЕРКА PREVIEW ФАЙЛОВ
      const previewValidation = this.validatePreviewFiles(deliveryPackage.preview_files);
      if (!previewValidation.isValid) {
        errors.push(...previewValidation.errors);
        correctionSuggestions.push(...previewValidation.suggestions);
      }
      
      // 7. ВАЛИДАЦИЯ ДОКУМЕНТАЦИИ
      const docsValidation = this.validateDocumentation(deliveryPackage.documentation);
      if (!docsValidation.isValid) {
        errors.push(...docsValidation.errors);
        correctionSuggestions.push(...docsValidation.suggestions);
      }
      
      // 8. ФИНАЛЬНАЯ ПРОВЕРКА ГОТОВНОСТИ К ДОСТАВКЕ
      const readinessValidation = this.validateDeliveryReadiness(deliveryPackage);
      if (!readinessValidation.isValid) {
        errors.push(...readinessValidation.errors);
        correctionSuggestions.push(...readinessValidation.suggestions);
      }
      
      // В строгом режиме любая ошибка блокирует доставку
      const blockingErrors = enableStrictValidation ? 
        errors :
        errors.filter(e => e.severity === 'critical');
      
      return {
        isValid: blockingErrors.length === 0,
        errors: blockingErrors,
        warnings: warnings.concat(errors.filter(e => !blockingErrors.includes(e)).map(e => e.message)),
        correctionSuggestions: correctionSuggestions,
        validatedData: blockingErrors.length === 0 ? deliveryPackage : undefined,
        validationDuration: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'delivery_package',
          errorType: 'invalid_value',
          message: `Критическая ошибка валидации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          severity: 'critical'
        }],
        warnings: [],
        correctionSuggestions: [],
        validationDuration: Date.now() - startTime
      };
    }
  }

  /**
   * 🔄 ALIAS ДЛЯ СОВМЕСТИМОСТИ С ТЕСТАМИ
   */
  public async validateOutput(deliveryPackage: any): Promise<HandoffValidationResult> {
    return this.validateDeliveryPackage(deliveryPackage, true);
  }

  /**
   * 📋 ВАЛИДАЦИЯ СТРУКТУРЫ ПАКЕТА
   */
  private validatePackageStructure(pkg: any): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка обязательных полей
    const requiredFields = [
      'html_email',
      'assets',
      'metadata',
      'documentation',
      'preview_files'
    ];
    
    const missingFields = requiredFields.filter(field => !pkg[field]);
    
    if (missingFields.length > 0) {
      errors.push({
        field: 'package_structure',
        errorType: 'missing',
        message: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'package_structure',
        issue: 'Неполная структура пакета',
        suggestion: 'Добавить все обязательные компоненты',
        correctionPrompt: `Пакет доставки НЕПОЛНЫЙ. Добавьте обязательные компоненты: ${missingFields.join(', ')}. Полная структура должна включать: 1) html_email (финальный HTML) 2) assets (все ресурсы) 3) metadata (метаданные качества) 4) documentation (инструкции) 5) preview_files (превью файлы)`,
        priority: 'high'
      });
    }
    
    // Проверка типов данных
    if (pkg.html_email && typeof pkg.html_email !== 'string') {
      errors.push({
        field: 'html_email',
        errorType: 'invalid_type',
        message: 'html_email должен быть строкой',
        severity: 'critical'
      });
    }
    
    if (pkg.assets && !Array.isArray(pkg.assets)) {
      errors.push({
        field: 'assets',
        errorType: 'invalid_type',
        message: 'assets должен быть массивом',
        severity: 'critical'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 📏 ЖЕСТКАЯ ПРОВЕРКА РАЗМЕРА ПАКЕТА <600KB
   */
  private async validatePackageSize(pkg: any): Promise<{
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  }> {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const maxSizeKB = AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB;
    
    // Рассчитываем общий размер пакета
    let totalSizeBytes = 0;
    
    // HTML размер
    if (pkg.html_email) {
      totalSizeBytes += Buffer.byteLength(pkg.html_email, 'utf8');
    }
    
    // MJML размер (если есть)
    if (pkg.mjml_source) {
      totalSizeBytes += Buffer.byteLength(pkg.mjml_source, 'utf8');
    }
    
    // Размер ассетов
    if (pkg.assets && Array.isArray(pkg.assets)) {
      for (const asset of pkg.assets) {
        if (asset.size_bytes) {
          totalSizeBytes += asset.size_bytes;
        } else if (asset.content) {
          totalSizeBytes += Buffer.byteLength(
            typeof asset.content === 'string' ? asset.content : asset.content.toString(),
            'utf8'
          );
        }
      }
    }
    
    // Размер документации
    if (pkg.documentation) {
      Object.values(pkg.documentation).forEach((doc: any) => {
        if (typeof doc === 'string') {
          totalSizeBytes += Buffer.byteLength(doc, 'utf8');
        }
      });
    }
    
    // Размер preview файлов
    if (pkg.preview_files && Array.isArray(pkg.preview_files)) {
      for (const preview of pkg.preview_files) {
        totalSizeBytes += preview.size_bytes || Buffer.byteLength(preview.content || '', 'utf8');
      }
    }
    
    const totalSizeKB = totalSizeBytes / 1024;
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА ЛИМИТА 600KB
    if (totalSizeKB > maxSizeKB) {
      errors.push({
        field: 'package_size',
        errorType: 'size_limit',
        message: `Размер пакета ${Math.round(totalSizeKB)}KB превышает лимит ${maxSizeKB}KB`,
        currentValue: totalSizeKB,
        expectedValue: maxSizeKB,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'package_size',
        issue: 'Превышен лимит размера пакета',
        suggestion: 'Оптимизировать размер всех компонентов',
        correctionPrompt: `КРИТИЧНО: Пакет весит ${Math.round(totalSizeKB)}KB, максимум ${maxSizeKB}KB. Срочно оптимизируйте: 1) Сжимайте HTML (минификация) 2) Оптимизируйте изображения (WebP, качество) 3) Удалите неиспользуемые ассеты 4) Минифицируйте документацию 5) Сжимайте preview файлы. Каждый килобайт критичен!`,
        priority: 'high'
      });
    }
    
    // Предупреждение при приближении к лимиту (>80%)
    if (totalSizeKB > maxSizeKB * 0.8) {
      suggestions.push({
        field: 'package_size',
        issue: 'Размер пакета близок к лимиту',
        suggestion: 'Профилактическая оптимизация',
        correctionPrompt: `Размер пакета ${Math.round(totalSizeKB)}KB близок к лимиту ${maxSizeKB}KB. Рекомендуется дополнительная оптимизация для запаса.`,
        priority: 'medium'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 🔐 ВАЛИДАЦИЯ ЦЕЛОСТНОСТИ ФАЙЛОВ
   */
  private async validateFileIntegrity(pkg: any): Promise<{
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  }> {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка HTML файла
    if (!pkg.html_email || pkg.html_email.length < 100) {
      errors.push({
        field: 'html_email',
        errorType: 'invalid_value',
        message: 'HTML email файл поврежден или слишком короткий',
        severity: 'critical'
      });
    }
    
    // Проверка ассетов
    if (pkg.assets && Array.isArray(pkg.assets)) {
      for (let i = 0; i < pkg.assets.length; i++) {
        const asset = pkg.assets[i];
        
        if (!asset.filename) {
          errors.push({
            field: `assets[${i}].filename`,
            errorType: 'missing',
            message: `Ассет ${i} не имеет имени файла`,
            severity: 'major'
          });
        }
        
        if (!asset.content && !asset.size_bytes) {
          errors.push({
            field: `assets[${i}].content`,
            errorType: 'missing',
            message: `Ассет ${asset.filename || i} не имеет контента`,
            severity: 'major'
          });
        }
        
        if (!asset.mime_type) {
          errors.push({
            field: `assets[${i}].mime_type`,
            errorType: 'missing',
            message: `Ассет ${asset.filename || i} не имеет MIME типа`,
            severity: 'minor'
          });
        }
      }
    }
    
    // Проверка preview файлов
    if (pkg.preview_files && Array.isArray(pkg.preview_files)) {
      const requiredPreviews = ['desktop', 'mobile'];
      const existingTypes = pkg.preview_files.map((p: any) => p.type);
      const missingPreviews = requiredPreviews.filter(type => !existingTypes.includes(type));
      
      if (missingPreviews.length > 0) {
        errors.push({
          field: 'preview_files',
          errorType: 'missing',
          message: `Отсутствуют обязательные preview: ${missingPreviews.join(', ')}`,
          severity: 'major'
        });
        
        suggestions.push({
          field: 'preview_files',
          issue: 'Неполный набор preview файлов',
          suggestion: 'Добавить все обязательные preview',
          correctionPrompt: `Добавьте обязательные preview файлы: ${missingPreviews.join(', ')}. Создайте скриншоты email в desktop и mobile версиях.`,
          priority: 'medium'
        });
      }
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 📧 ПРОВЕРКА КАЧЕСТВА ФИНАЛЬНОГО HTML
   */
  private validateFinalHTML(htmlContent: string): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    if (!htmlContent) {
      errors.push({
        field: 'html_email',
        errorType: 'missing',
        message: 'Финальный HTML отсутствует',
        severity: 'critical'
      });
      return { isValid: false, errors, suggestions };
    }
    
    // Проверка базовой структуры
    const requiredElements = ['<!DOCTYPE', '<html', '<head', '<body', '<title'];
    const missingElements = requiredElements.filter(element => !htmlContent.includes(element));
    
    if (missingElements.length > 0) {
      errors.push({
        field: 'html_email',
        errorType: 'format_error',
        message: `Финальный HTML неполный, отсутствуют: ${missingElements.join(', ')}`,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'html_email',
        issue: 'Неполная HTML структура',
        suggestion: 'Добавить все обязательные HTML элементы',
        correctionPrompt: `Финальный HTML неполный. Добавьте: ${missingElements.join(', ')}. HTML должен быть готов к отправке без дополнительной обработки.`,
        priority: 'high'
      });
    }
    
    // Проверка email-specific элементов
    if (!htmlContent.includes('charset')) {
      errors.push({
        field: 'html_email',
        errorType: 'missing',
        message: 'Отсутствует charset declaration',
        severity: 'major'
      });
    }
    
    // Проверка на наличие placeholder текста
    const placeholderPatterns = [
      /\{\{.*?\}\}/g,
      /\[.*?\]/g,
      /placeholder/gi,
      /lorem ipsum/gi,
      /test content/gi
    ];
    
    const foundPlaceholders = placeholderPatterns.some(pattern => pattern.test(htmlContent));
    
    if (foundPlaceholders) {
      errors.push({
        field: 'html_email',
        errorType: 'invalid_value',
        message: 'HTML содержит placeholder контент',
        severity: 'major'
      });
      
      suggestions.push({
        field: 'html_email',
        issue: 'Placeholder контент в финальном HTML',
        suggestion: 'Заменить все placeholder на финальный контент',
        correctionPrompt: 'Финальный HTML содержит placeholder контент. Замените все временные тексты, {{variables}}, [placeholders] на финальный контент для доставки.',
        priority: 'high'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 📁 ВАЛИДАЦИЯ EXPORT ФОРМАТОВ
   */
  private validateExportFormats(pkg: any): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // HTML обязателен
    if (!pkg.html_email) {
      errors.push({
        field: 'export_formats.html',
        errorType: 'missing',
        message: 'HTML format отсутствует',
        severity: 'critical'
      });
    }
    
    // MJML желателен, но не критичен
    if (!pkg.mjml_source) {
      suggestions.push({
        field: 'export_formats.mjml',
        issue: 'MJML source отсутствует',
        suggestion: 'Добавить MJML source для будущих изменений',
        correctionPrompt: 'Рекомендуется включить MJML source файл для возможности будущих изменений email шаблона.',
        priority: 'low'
      });
    }
    
    // Проверка ассетов
    if (!pkg.assets || !Array.isArray(pkg.assets) || pkg.assets.length === 0) {
      suggestions.push({
        field: 'export_formats.assets',
        issue: 'Ассеты отсутствуют',
        suggestion: 'Проверить необходимость ассетов',
        correctionPrompt: 'Email не содержит ассетов (изображений). Если email использует изображения, включите их в пакет.',
        priority: 'low'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 🖼️ ВАЛИДАЦИЯ PREVIEW ФАЙЛОВ
   */
  private validatePreviewFiles(previewFiles: any[]): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    if (!previewFiles || !Array.isArray(previewFiles)) {
      errors.push({
        field: 'preview_files',
        errorType: 'missing',
        message: 'Preview файлы отсутствуют',
        severity: 'major'
      });
      return { isValid: false, errors, suggestions };
    }
    
    // Проверка обязательных preview типов
    const requiredTypes = ['desktop', 'mobile'];
    const existingTypes = previewFiles.map(p => p.type);
    const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));
    
    if (missingTypes.length > 0) {
      errors.push({
        field: 'preview_files',
        errorType: 'missing',
        message: `Отсутствуют preview типы: ${missingTypes.join(', ')}`,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'preview_files',
        issue: 'Неполный набор preview',
        suggestion: 'Добавить обязательные preview типы',
        correctionPrompt: `Добавьте preview файлы для: ${missingTypes.join(', ')}. Создайте скриншоты email в разных форматах для демонстрации клиенту.`,
        priority: 'medium'
      });
    }
    
    // Проверка каждого preview файла
    previewFiles.forEach((preview, index) => {
      if (!preview.filename) {
        errors.push({
          field: `preview_files[${index}].filename`,
          errorType: 'missing',
          message: `Preview ${index} не имеет имени файла`,
          severity: 'minor'
        });
      }
      
      if (!preview.content) {
        errors.push({
          field: `preview_files[${index}].content`,
          errorType: 'missing',
          message: `Preview ${preview.filename || index} не имеет контента`,
          severity: 'major'
        });
      }
    });
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 📚 ВАЛИДАЦИЯ ДОКУМЕНТАЦИИ
   */
  private validateDocumentation(documentation: any): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    if (!documentation) {
      errors.push({
        field: 'documentation',
        errorType: 'missing',
        message: 'Документация отсутствует',
        severity: 'major'
      });
      return { isValid: false, errors, suggestions };
    }
    
    // Проверка обязательных разделов документации
    const requiredDocs = [
      'readme',
      'implementation_guide',
      'testing_notes',
      'browser_support'
    ];
    
    const missingDocs = requiredDocs.filter(doc => !documentation[doc] || documentation[doc].length < 50);
    
    if (missingDocs.length > 0) {
      errors.push({
        field: 'documentation',
        errorType: 'missing',
        message: `Неполная документация, отсутствуют: ${missingDocs.join(', ')}`,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'documentation',
        issue: 'Неполная документация',
        suggestion: 'Добавить все разделы документации',
        correctionPrompt: `Добавьте недостающие разделы документации: ${missingDocs.join(', ')}. Каждый раздел должен содержать полезную информацию для клиента (минимум 50 символов).`,
        priority: 'medium'
      });
    }
    
    // Проверка качества документации
    if (documentation.readme && documentation.readme.length < 100) {
      suggestions.push({
        field: 'documentation.readme',
        issue: 'Слишком короткий README',
        suggestion: 'Расширить README файл',
        correctionPrompt: 'README файл слишком короткий. Добавьте описание email шаблона, инструкции по использованию, важные замечания.',
        priority: 'low'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 🚀 ВАЛИДАЦИЯ ГОТОВНОСТИ К ДОСТАВКЕ
   */
  private validateDeliveryReadiness(pkg: any): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка метаданных качества
    if (pkg.metadata) {
      if (pkg.metadata.quality_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE) {
        errors.push({
          field: 'metadata.quality_score',
          errorType: 'invalid_value',
          message: `Quality score ${pkg.metadata.quality_score} ниже минимального для доставки`,
          severity: 'critical'
        });
      }
      
      if (!pkg.metadata.compatibility_report) {
        errors.push({
          field: 'metadata.compatibility_report',
          errorType: 'missing',
          message: 'Отсутствует отчет о совместимости',
          severity: 'major'
        });
      }
      
      if (!pkg.metadata.accessibility_report) {
        errors.push({
          field: 'metadata.accessibility_report',
          errorType: 'missing',
          message: 'Отсутствует отчет о доступности',
          severity: 'major'
        });
      }
    } else {
      errors.push({
        field: 'metadata',
        errorType: 'missing',
        message: 'Метаданные пакета отсутствуют',
        severity: 'critical'
      });
    }
    
    // Финальная проверка готовности
    const hasHTML = pkg.html_email && pkg.html_email.length > 100;
    const hasAssets = !pkg.assets || pkg.assets.length === 0 || pkg.assets.every((a: any) => a.content || a.size_bytes);
    const hasDocs = pkg.documentation && pkg.documentation.readme;
    const hasPreviews = pkg.preview_files && pkg.preview_files.length > 0;
    
    if (!hasHTML || !hasAssets || !hasDocs || !hasPreviews) {
      errors.push({
        field: 'delivery_readiness',
        errorType: 'invalid_value',
        message: 'Пакет не готов к доставке: неполная комплектация',
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'delivery_readiness',
        issue: 'Пакет не готов к доставке',
        suggestion: 'Завершить все компоненты пакета',
        correctionPrompt: 'Пакет НЕ готов к доставке. Убедитесь что все компоненты присутствуют и корректны: HTML email, ассеты, документация, preview файлы. Проверьте качество каждого компонента.',
        priority: 'high'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 📊 СОЗДАНИЕ ОТЧЕТА О ЦЕЛОСТНОСТИ ПАКЕТА
   */
  public generatePackageIntegrityReport(pkg: any): PackageIntegrityReport {
    let totalFiles = 0;
    let totalSizeBytes = 0;
    
    // HTML файл
    const htmlSizeBytes = pkg.html_email ? Buffer.byteLength(pkg.html_email, 'utf8') : 0;
    if (htmlSizeBytes > 0) totalFiles++;
    totalSizeBytes += htmlSizeBytes;
    
    // MJML файл
    const mjmlSizeBytes = pkg.mjml_source ? Buffer.byteLength(pkg.mjml_source, 'utf8') : 0;
    if (mjmlSizeBytes > 0) totalFiles++;
    totalSizeBytes += mjmlSizeBytes;
    
    // Ассеты
    let assetsSizeBytes = 0;
    if (pkg.assets && Array.isArray(pkg.assets)) {
      totalFiles += pkg.assets.length;
      pkg.assets.forEach((asset: any) => {
        assetsSizeBytes += asset.size_bytes || Buffer.byteLength(asset.content || '', 'utf8');
      });
    }
    totalSizeBytes += assetsSizeBytes;
    
    // Документация
    let docsSizeBytes = 0;
    if (pkg.documentation) {
      Object.values(pkg.documentation).forEach((doc: any) => {
        if (typeof doc === 'string') {
          docsSizeBytes += Buffer.byteLength(doc, 'utf8');
        }
      });
      totalFiles += Object.keys(pkg.documentation).length;
    }
    totalSizeBytes += docsSizeBytes;
    
    // Preview файлы
    if (pkg.preview_files && Array.isArray(pkg.preview_files)) {
      totalFiles += pkg.preview_files.length;
      pkg.preview_files.forEach((preview: any) => {
        totalSizeBytes += preview.size_bytes || Buffer.byteLength(preview.content || '', 'utf8');
      });
    }
    
    const totalSizeKB = totalSizeBytes / 1024;
    const maxSizeKB = AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB;
    
    return {
      total_files: totalFiles,
      total_size_bytes: totalSizeBytes,
      total_size_kb: Math.round(totalSizeKB * 100) / 100,
      html_size_kb: Math.round(htmlSizeBytes / 1024 * 100) / 100,
      assets_size_kb: Math.round(assetsSizeBytes / 1024 * 100) / 100,
      documentation_size_kb: Math.round(docsSizeBytes / 1024 * 100) / 100,
      compression_ratio: totalSizeBytes > 0 ? Math.round((1 - totalSizeBytes / (totalSizeBytes * 1.5)) * 100) / 100 : 0,
      within_size_limit: totalSizeKB <= maxSizeKB,
      missing_files: [],
      corrupted_files: []
    };
  }

  /**
   * 🎯 ФИНАЛЬНАЯ ПРОВЕРКА ГОТОВНОСТИ К ДОСТАВКЕ
   */
  public isReadyForClientDelivery(pkg: any): {
    ready: boolean;
    blockers: string[];
    recommendations: string[];
    summary: string;
  } {
    const blockers: string[] = [];
    const recommendations: string[] = [];
    
    // Критические блокеры
    if (!pkg.html_email || pkg.html_email.length < 100) {
      blockers.push('Отсутствует или поврежден HTML email');
    }
    
    const integrityReport = this.generatePackageIntegrityReport(pkg);
    if (!integrityReport.within_size_limit) {
      blockers.push(`Превышен лимит размера: ${integrityReport.total_size_kb}KB > ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB}KB`);
    }
    
    if (!pkg.metadata || pkg.metadata.quality_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE) {
      blockers.push('Недостаточный quality score для доставки');
    }
    
    if (!pkg.documentation || !pkg.documentation.readme) {
      blockers.push('Отсутствует базовая документация');
    }
    
    // Рекомендации
    if (!pkg.mjml_source) {
      recommendations.push('Добавить MJML source для будущих изменений');
    }
    
    if (!pkg.preview_files || pkg.preview_files.length < 2) {
      recommendations.push('Добавить больше preview файлов (desktop, mobile, dark mode)');
    }
    
    if (integrityReport.total_size_kb > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB * 0.8) {
      recommendations.push('Оптимизировать размер для запаса');
    }
    
    const ready = blockers.length === 0;
    const summary = ready ? 
      `✅ Пакет готов к доставке (${integrityReport.total_files} файлов, ${integrityReport.total_size_kb}KB)` :
      `❌ Пакет НЕ готов: ${blockers.length} критических проблем`;
    
    return {
      ready,
      blockers,
      recommendations,
      summary
    };
  }
}