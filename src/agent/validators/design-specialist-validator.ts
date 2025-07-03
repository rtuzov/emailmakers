import { z } from 'zod';
import {
  DesignToQualityHandoffData,
  DesignToQualityHandoffDataSchema,
  HandoffValidationResult,
  HandoffValidationError,
  CorrectionSuggestion,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

/**
 * 🎨 DESIGN SPECIALIST VALIDATOR
 * 
 * Строгая валидация выходных данных DesignSpecialist для передачи QualitySpecialist
 * Принцип: Жесткие требования к HTML качеству, размерам файлов и W3C compliance
 */

export interface W3CValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatorUrl?: string;
}

export interface AssetValidationResult {
  isValid: boolean;
  missingAssets: string[];
  invalidFormats: string[];
  oversizedAssets: string[];
  totalSize: number;
}

export interface HTMLQualityMetrics {
  w3cCompliant: boolean;
  fileSizeBytes: number;
  cssRulesCount: number;
  imagesCount: number;
  totalSizeKB: number;
  hasInlineStyles: boolean;
  hasExternalDependencies: boolean;
  estimatedRenderTime: number;
}

export class DesignSpecialistValidator {
  private static instance: DesignSpecialistValidator;

  private constructor() {}

  public static getInstance(): DesignSpecialistValidator {
    if (!DesignSpecialistValidator.instance) {
      DesignSpecialistValidator.instance = new DesignSpecialistValidator();
    }
    return DesignSpecialistValidator.instance;
  }

  /**
   * 🎯 ОСНОВНАЯ ВАЛИДАЦИЯ ВЫХОДНЫХ ДАННЫХ DESIGN SPECIALIST
   */
  public async validateDesignOutput(
    data: any,
    enableDeepValidation: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Базовая Zod валидация
      const validatedData = DesignToQualityHandoffDataSchema.parse(data);
      const typedData = validatedData as DesignToQualityHandoffData;
      
      const errors: HandoffValidationError[] = [];
      const warnings: string[] = [];
      const correctionSuggestions: CorrectionSuggestion[] = [];
      
      // 2. Валидация HTML качества
      const htmlValidation = await this.validateHTMLQuality(typedData.email_package.html_content);
      if (!htmlValidation.isValid) {
        errors.push(...htmlValidation.errors);
        correctionSuggestions.push(...htmlValidation.suggestions);
      }
      
      // 3. Строгая проверка размеров файлов
      const sizeValidation = this.validateFileSizes(typedData);
      if (!sizeValidation.isValid) {
        errors.push(...sizeValidation.errors);
        correctionSuggestions.push(...sizeValidation.suggestions);
      }
      
      // 4. Валидация ассетов
      const assetValidation = await this.validateAssets(typedData.email_package.asset_urls);
      if (!assetValidation.isValid) {
        errors.push(...assetValidation.errors);
        correctionSuggestions.push(...assetValidation.suggestions);
      }
      
      // 5. Проверка производительности рендеринга
      const performanceValidation = this.validateRenderingPerformance(typedData);
      if (!performanceValidation.isValid) {
        errors.push(...performanceValidation.errors);
        correctionSuggestions.push(...performanceValidation.suggestions);
      }
      
      // 6. W3C Compliance (если включена глубокая валидация)
      if (enableDeepValidation) {
        const w3cValidation = await this.validateW3CCompliance(typedData.email_package.html_content);
        if (!w3cValidation.isValid) {
          errors.push(...w3cValidation.errors);
          correctionSuggestions.push(...w3cValidation.suggestions);
        }
      }
      
      // 7. Валидация email-specific требований
      const emailValidation = this.validateEmailSpecificRequirements(typedData);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
        correctionSuggestions.push(...emailValidation.suggestions);
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors.filter(e => e.severity === 'critical'),
        warnings: warnings.concat(errors.filter(e => e.severity !== 'critical').map(e => e.message)),
        correctionSuggestions: correctionSuggestions,
        validatedData: errors.length === 0 ? typedData : undefined,
        validationDuration: Date.now() - startTime
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: HandoffValidationError[] = error.errors.map(issue => ({
          field: issue.path.join('.'),
          errorType: 'invalid_value',
          message: issue.message,
          severity: 'critical'
        }));
        
        return {
          isValid: false,
          errors: validationErrors,
          warnings: [],
          correctionSuggestions: this.generateZodErrorCorrections(validationErrors),
          validationDuration: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  /**
   * 🔄 ALIAS ДЛЯ СОВМЕСТИМОСТИ С ТЕСТАМИ
   */
  public async validateOutput(data: any): Promise<HandoffValidationResult> {
    return this.validateDesignOutput(data, true);
  }

  /**
   * 🔍 ВАЛИДАЦИЯ HTML КАЧЕСТВА
   */
  private async validateHTMLQuality(htmlContent: string): Promise<{
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  }> {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка базовой структуры HTML (поддержка разных вариантов DOCTYPE)
    const hasDoctype = htmlContent.toLowerCase().includes('<!doctype html') || 
                      htmlContent.includes('<!DOCTYPE html');
    if (!hasDoctype) {
      errors.push({
        field: 'email_package.html_content',
        errorType: 'format_error',
        message: 'HTML должен содержать DOCTYPE declaration',
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Отсутствует DOCTYPE',
        suggestion: 'Добавить DOCTYPE html PUBLIC declaration',
        correctionPrompt: 'Добавьте корректный DOCTYPE для email HTML: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
        priority: 'high'
      });
    }
    
    // Проверка наличия обязательных email-specific элементов
    if (!htmlContent.includes('<title>')) {
      errors.push({
        field: 'email_package.html_content',
        errorType: 'missing',
        message: 'HTML должен содержать <title> элемент',
        severity: 'major'
      });
    }
    
    // Проверка использования table-based layout
    if (!htmlContent.includes('<table') || htmlContent.includes('display: flex') || htmlContent.includes('display: grid')) {
      errors.push({
        field: 'email_package.html_content',
        errorType: 'format_error',
        message: 'Email HTML должен использовать table-based layout, не flex/grid',
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Неподходящий layout',
        suggestion: 'Использовать table-based структуру',
        correctionPrompt: 'Переделайте HTML структуру используя только <table>, <tr>, <td> элементы. Уберите flex, grid и другие современные CSS свойства. Email должен быть совместим с Outlook.',
        priority: 'high'
      });
    }
    
    // Проверка внешних CSS файлов (разрешаем Google Fonts)
    const externalStylesheets = htmlContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi);
    if (externalStylesheets && externalStylesheets.length > 0) {
      const hasGoogleFonts = externalStylesheets.some(link => link.includes('fonts.googleapis.com'));
      const hasOtherCSS = externalStylesheets.some(link => !link.includes('fonts.googleapis.com'));
      
      if (hasGoogleFonts && !hasOtherCSS) {
        // Только Google Fonts - предупреждение
        suggestions.push({
          field: 'email_package.html_content',
          issue: 'Google Fonts ссылка',
          suggestion: 'Рассмотрите использование web-safe шрифтов для лучшей совместимости',
          correctionPrompt: 'Google Fonts могут не работать во всех email клиентах. Добавьте fallback шрифты в CSS.',
          priority: 'medium'
        });
      } else if (hasOtherCSS) {
        // Другие внешние CSS - критическая ошибка
        errors.push({
          field: 'email_package.html_content',
          errorType: 'format_error',
          message: 'HTML не должен содержать внешние стилевые файлы (кроме Google Fonts)',
          severity: 'critical'
        });
        
        suggestions.push({
          field: 'email_package.html_content',
          issue: 'Внешние CSS файлы',
          suggestion: 'Конвертировать в инлайн стили',
          correctionPrompt: 'Уберите все внешние CSS файлы и конвертируйте стили в инлайн атрибуты style="". Каждый элемент должен иметь стили непосредственно в атрибуте style.',
          priority: 'high'
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
   * 📏 СТРОГАЯ ПРОВЕРКА РАЗМЕРОВ ФАЙЛОВ
   */
  private validateFileSizes(data: DesignToQualityHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка размера HTML файла
    const htmlSize = Buffer.byteLength(data.email_package.html_content, 'utf8');
    const maxSizeBytes = AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB * 1024;
    
    if (htmlSize > maxSizeBytes) {
      errors.push({
        field: 'email_package.html_content',
        errorType: 'size_limit',
        message: `HTML размер ${Math.round(htmlSize/1024)}KB превышает лимит ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB}KB`,
        currentValue: htmlSize,
        expectedValue: maxSizeBytes,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Превышен размер HTML файла',
        suggestion: 'Оптимизировать HTML и CSS',
        correctionPrompt: `HTML файл весит ${Math.round(htmlSize/1024)}KB, но должен быть ≤${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB}KB. Оптимизируйте: 1) Минифицируйте CSS 2) Удалите неиспользуемые стили 3) Оптимизируйте структуру 4) Сократите повторяющиеся стили`,
        priority: 'high'
      });
    }
    
    // Проверка total_size_kb из метрик
    if (data.design_artifacts.performance_metrics.total_size_kb > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB) {
      errors.push({
        field: 'design_artifacts.performance_metrics.total_size_kb',
        errorType: 'size_limit',
        message: `Общий размер ${data.design_artifacts.performance_metrics.total_size_kb}KB превышает лимит ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB}KB`,
        currentValue: data.design_artifacts.performance_metrics.total_size_kb,
        expectedValue: AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB,
        severity: 'critical'
      });
    }
    
    // Проверка времени рендеринга
    if (data.rendering_metadata.render_time_ms > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS) {
      errors.push({
        field: 'rendering_metadata.render_time_ms',
        errorType: 'invalid_value',
        message: `Время рендеринга ${data.rendering_metadata.render_time_ms}мс превышает лимит ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS}мс`,
        currentValue: data.rendering_metadata.render_time_ms,
        expectedValue: AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'rendering_metadata.render_time_ms',
        issue: 'Медленный рендеринг',
        suggestion: 'Оптимизировать структуру и стили',
        correctionPrompt: 'Рендеринг занимает слишком много времени. Оптимизируйте: 1) Упростите CSS селекторы 2) Уменьшите количество вложенных элементов 3) Оптимизируйте размеры изображений 4) Удалите сложные CSS эффекты',
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
   * 🖼️ ВАЛИДАЦИЯ АССЕТОВ
   */
  private async validateAssets(assetUrls: string[]): Promise<{
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  }> {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка валидности URL ассетов
    for (const url of assetUrls) {
      try {
        new URL(url);
      } catch {
        errors.push({
          field: 'email_package.asset_urls',
          errorType: 'format_error',
          message: `Невалидный URL ассета: ${url}`,
          currentValue: url,
          severity: 'major'
        });
      }
      
      // Проверка расширений файлов
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
      const hasValidExtension = allowedExtensions.some(ext => url.toLowerCase().includes(ext));
      
      if (!hasValidExtension) {
        errors.push({
          field: 'email_package.asset_urls',
          errorType: 'format_error',
          message: `Неподдерживаемый формат ассета: ${url}`,
          currentValue: url,
          severity: 'minor'
        });
      }
    }
    
    // Проверка количества ассетов (не должно быть слишком много)
    if (assetUrls.length > 20) {
      errors.push({
        field: 'email_package.asset_urls',
        errorType: 'size_limit',
        message: `Слишком много ассетов: ${assetUrls.length}. Рекомендуется ≤20`,
        currentValue: assetUrls.length,
        expectedValue: 20,
        severity: 'minor'
      });
      
      suggestions.push({
        field: 'email_package.asset_urls',
        issue: 'Слишком много изображений',
        suggestion: 'Оптимизировать количество ассетов',
        correctionPrompt: 'Уменьшите количество изображений: 1) Объедините изображения в спрайты 2) Уберите декоративные изображения 3) Используйте CSS для простых эффектов 4) Оптимизируйте размеры существующих изображений',
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
   * ⚡ ВАЛИДАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ РЕНДЕРИНГА
   */
  private validateRenderingPerformance(data: DesignToQualityHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка количества CSS правил
    const maxCssRules = 500;
    if (data.design_artifacts.performance_metrics.css_rules_count > maxCssRules) {
      errors.push({
        field: 'design_artifacts.performance_metrics.css_rules_count',
        errorType: 'size_limit',
        message: `Слишком много CSS правил: ${data.design_artifacts.performance_metrics.css_rules_count}. Максимум: ${maxCssRules}`,
        currentValue: data.design_artifacts.performance_metrics.css_rules_count,
        expectedValue: maxCssRules,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'design_artifacts.performance_metrics.css_rules_count',
        issue: 'Слишком много CSS правил',
        suggestion: 'Оптимизировать CSS',
        correctionPrompt: 'Сократите количество CSS правил: 1) Объедините похожие селекторы 2) Удалите неиспользуемые стили 3) Используйте краткие CSS свойства 4) Минифицируйте CSS код',
        priority: 'medium'
      });
    }
    
    // Проверка поддержки dark mode (рекомендация)
    if (!data.design_artifacts.dark_mode_support) {
      suggestions.push({
        field: 'design_artifacts.dark_mode_support',
        issue: 'Отсутствует поддержка темной темы',
        suggestion: 'Добавить dark mode support',
        correctionPrompt: 'Добавьте поддержку темной темы используя CSS media queries: @media (prefers-color-scheme: dark). Определите альтернативные цвета для фона и текста.',
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
   * 🌐 W3C COMPLIANCE ВАЛИДАЦИЯ
   */
  private async validateW3CCompliance(htmlContent: string): Promise<{
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  }> {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Базовая проверка W3C требований для email
    const requiredPatterns = [
      {
        pattern: /<!DOCTYPE html/i,
        message: 'Отсутствует DOCTYPE declaration',
        field: 'w3c_doctype'
      },
      {
        pattern: /<html[^>]*>/i,
        message: 'Отсутствует <html> элемент',
        field: 'w3c_html_element'
      },
      {
        pattern: /<head[^>]*>/i,
        message: 'Отсутствует <head> секция',
        field: 'w3c_head_section'
      },
      {
        pattern: /<meta[^>]*charset[^>]*>/i,
        message: 'Отсутствует meta charset',
        field: 'w3c_charset'
      }
    ];
    
    for (const check of requiredPatterns) {
      if (!check.pattern.test(htmlContent)) {
        errors.push({
          field: `email_package.html_content.${check.field}`,
          errorType: 'missing',
          message: check.message,
          severity: 'major'
        });
      }
    }
    
    // Проверка закрытых тегов
    const unclosedTags = this.findUnclosedTags(htmlContent);
    if (unclosedTags.length > 0) {
      errors.push({
        field: 'email_package.html_content.structure',
        errorType: 'format_error',
        message: `Незакрытые теги: ${unclosedTags.join(', ')}`,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Незакрытые HTML теги',
        suggestion: 'Закрыть все HTML теги',
        correctionPrompt: `Закройте все HTML теги: ${unclosedTags.join(', ')}. Убедитесь что каждый открывающий тег имеет соответствующий закрывающий тег или используйте self-closing синтаксис для одиночных тегов.`,
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
   * 📧 ВАЛИДАЦИЯ EMAIL-SPECIFIC ТРЕБОВАНИЙ
   */
  private validateEmailSpecificRequirements(data: DesignToQualityHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const htmlContent = data.email_package.html_content;
    
    // Проверка максимальной ширины (600-640px для email)
    const widthPattern = /width\s*:\s*(\d+)px/gi;
    let match;
    let hasValidWidth = false;
    
    while ((match = widthPattern.exec(htmlContent)) !== null) {
      const width = parseInt(match[1]);
      if (width <= 640) {
        hasValidWidth = true;
      }
      if (width > 640) {
        errors.push({
          field: 'email_package.html_content.width',
          errorType: 'invalid_value',
          message: `Ширина ${width}px превышает максимум 640px для email`,
          currentValue: width,
          expectedValue: 640,
          severity: 'major'
        });
      }
    }
    
    // Проверка наличия preheader текста
    if (!htmlContent.includes('preheader') && !htmlContent.includes('preview')) {
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Отсутствует preheader текст',
        suggestion: 'Добавить preheader для preview',
        correctionPrompt: 'Добавьте preheader текст в начало email: <div style="display:none;max-height:0;overflow:hidden;">Ваш preheader текст здесь</div>. Это улучшит preview в email клиентах.',
        priority: 'medium'
      });
    }
    
    // Проверка accessibility атрибутов
    if (!htmlContent.includes('alt=') && htmlContent.includes('<img')) {
      errors.push({
        field: 'email_package.html_content.accessibility',
        errorType: 'missing',
        message: 'Изображения должны иметь alt атрибуты',
        severity: 'major'
      });
      
      suggestions.push({
        field: 'email_package.html_content',
        issue: 'Отсутствуют alt атрибуты',
        suggestion: 'Добавить alt текст для изображений',
        correctionPrompt: 'Добавьте alt атрибуты для всех изображений: <img src="..." alt="Описание изображения">. Это важно для accessibility и для случаев когда изображения не загружаются.',
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
   * 🔧 HELPER METHODS
   */

  private findUnclosedTags(html: string): string[] {
    const openTags: string[] = [];
    const unclosedTags: string[] = [];
    
    // Простая проверка основных тегов
    const tagRegex = /<\/?(\w+)[^>]*>/g;
    let match;
    
    const selfClosingTags = ['img', 'br', 'hr', 'meta', 'link', 'input'];
    
    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');
      const isSelfClosing = selfClosingTags.includes(tag) || match[0].endsWith('/>');
      
      if (isSelfClosing) continue;
      
      if (isClosing) {
        const openIndex = openTags.lastIndexOf(tag);
        if (openIndex !== -1) {
          openTags.splice(openIndex, 1);
        }
      } else {
        openTags.push(tag);
      }
    }
    
    return openTags;
  }

  private generateZodErrorCorrections(errors: HandoffValidationError[]): CorrectionSuggestion[] {
    return errors.map(error => ({
      field: error.field,
      issue: error.message,
      suggestion: `Исправьте поле ${error.field}`,
      correctionPrompt: `Поле "${error.field}" содержит ошибку: ${error.message}. Предоставьте корректное значение согласно схеме валидации.`,
      priority: error.severity === 'critical' ? 'high' : 'medium'
    }));
  }

  /**
   * 📊 МЕТРИКИ КАЧЕСТВА HTML
   */
  public calculateHTMLQualityMetrics(htmlContent: string): HTMLQualityMetrics {
    return {
      w3cCompliant: this.isW3CCompliant(htmlContent),
      fileSizeBytes: Buffer.byteLength(htmlContent, 'utf8'),
      cssRulesCount: this.countCSSRules(htmlContent),
      imagesCount: this.countImages(htmlContent),
      totalSizeKB: Math.round(Buffer.byteLength(htmlContent, 'utf8') / 1024),
      hasInlineStyles: htmlContent.includes('style='),
      hasExternalDependencies: htmlContent.includes('<link') || htmlContent.includes('<script'),
      estimatedRenderTime: this.estimateRenderTime(htmlContent)
    };
  }

  private isW3CCompliant(html: string): boolean {
    return html.includes('<!DOCTYPE html') && 
           html.includes('<html') && 
           html.includes('<head') &&
           html.includes('charset');
  }

  private countCSSRules(html: string): number {
    const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    const inlineStyles = html.match(/style\s*=\s*["'][^"']*["']/gi) || [];
    return styleBlocks.length * 10 + inlineStyles.length; // Примерная оценка
  }

  private countImages(html: string): number {
    return (html.match(/<img[^>]*>/gi) || []).length;
  }

  private estimateRenderTime(html: string): number {
    const size = Buffer.byteLength(html, 'utf8');
    const complexity = this.countCSSRules(html) + this.countImages(html);
    return Math.round((size / 1000) + (complexity * 2)); // Простая формула оценки
  }
}