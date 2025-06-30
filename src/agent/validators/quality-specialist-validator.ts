import { z } from 'zod';
import {
  QualityToDeliveryHandoffData,
  QualityToDeliveryHandoffDataSchema,
  HandoffValidationResult,
  HandoffValidationError,
  CorrectionSuggestion,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

/**
 * 🏆 QUALITY SPECIALIST VALIDATOR
 * 
 * Строгая валидация выходных данных QualitySpecialist для передачи DeliverySpecialist
 * Принцип: Обязательный quality score ≥70, WCAG AA compliance, 95%+ email client compatibility
 */

export interface QualityMetrics {
  overall_score: number;
  html_quality: number;
  accessibility_score: number;
  compatibility_score: number;
  performance_score: number;
  spam_risk_score: number;
}

export interface AccessibilityAudit {
  wcag_aa_compliant: boolean;
  missing_alt_texts: number;
  color_contrast_issues: number;
  keyboard_navigation_issues: number;
  screen_reader_issues: number;
  recommendations: string[];
}

export interface CompatibilityReport {
  gmail: { supported: boolean; issues: string[] };
  outlook: { supported: boolean; issues: string[] };
  apple_mail: { supported: boolean; issues: string[] };
  yahoo_mail: { supported: boolean; issues: string[] };
  mobile_clients: { supported: boolean; issues: string[] };
  overall_compatibility: number;
}

export interface SpamAnalysisReport {
  spam_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  flagged_elements: string[];
  recommendations: string[];
  sender_reputation_factors: string[];
}

export class QualitySpecialistValidator {
  private static instance: QualitySpecialistValidator;

  private constructor() {}

  public static getInstance(): QualitySpecialistValidator {
    if (!QualitySpecialistValidator.instance) {
      QualitySpecialistValidator.instance = new QualitySpecialistValidator();
    }
    return QualitySpecialistValidator.instance;
  }

  /**
   * 🎯 ОСНОВНАЯ ВАЛИДАЦИЯ ВЫХОДНЫХ ДАННЫХ QUALITY SPECIALIST
   */
  public async validateQualityOutput(
    data: any,
    enableStrictMode: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Базовая Zod валидация
      const validatedData = QualityToDeliveryHandoffDataSchema.parse(data);
      const typedData = validatedData as QualityToDeliveryHandoffData;
      
      const errors: HandoffValidationError[] = [];
      const warnings: string[] = [];
      const correctionSuggestions: CorrectionSuggestion[] = [];
      
      // 2. ЖЕСТКАЯ ПРОВЕРКА QUALITY SCORE ≥70
      const qualityValidation = this.validateQualityScore(typedData);
      if (!qualityValidation.isValid) {
        errors.push(...qualityValidation.errors);
        correctionSuggestions.push(...qualityValidation.suggestions);
      }
      
      // 3. ВАЛИДАЦИЯ ACCESSIBILITY WCAG AA COMPLIANCE
      const accessibilityValidation = this.validateAccessibilityCompliance(typedData);
      if (!accessibilityValidation.isValid) {
        errors.push(...accessibilityValidation.errors);
        correctionSuggestions.push(...accessibilityValidation.suggestions);
      }
      
      // 4. ЖЕСТКАЯ ПРОВЕРКА EMAIL CLIENT COMPATIBILITY ≥95%
      const compatibilityValidation = this.validateEmailClientCompatibility(typedData);
      if (!compatibilityValidation.isValid) {
        errors.push(...compatibilityValidation.errors);
        correctionSuggestions.push(...compatibilityValidation.suggestions);
      }
      
      // 5. ВАЛИДАЦИЯ HTML И CSS КАЧЕСТВА
      const htmlCssValidation = this.validateHTMLCSSQuality(typedData);
      if (!htmlCssValidation.isValid) {
        errors.push(...htmlCssValidation.errors);
        correctionSuggestions.push(...htmlCssValidation.suggestions);
      }
      
      // 6. АНАЛИЗ SPAM SCORE ≤3
      const spamValidation = this.validateSpamAnalysis(typedData);
      if (!spamValidation.isValid) {
        errors.push(...spamValidation.errors);
        correctionSuggestions.push(...spamValidation.suggestions);
      }
      
      // 7. ВАЛИДАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
      const performanceValidation = this.validatePerformanceAnalysis(typedData);
      if (!performanceValidation.isValid) {
        errors.push(...performanceValidation.errors);
        correctionSuggestions.push(...performanceValidation.suggestions);
      }
      
      // 8. ПРОВЕРКА ЦЕЛОСТНОСТИ VALIDATED HTML
      const integrityValidation = this.validateHTMLIntegrity(typedData.quality_package.validated_html);
      if (!integrityValidation.isValid) {
        errors.push(...integrityValidation.errors);
        correctionSuggestions.push(...integrityValidation.suggestions);
      }
      
      // В строгом режиме даже warning превращаются в errors
      const criticalErrors = enableStrictMode ? 
        errors.filter(e => e.severity === 'critical' || e.severity === 'major') :
        errors.filter(e => e.severity === 'critical');
      
      return {
        isValid: criticalErrors.length === 0,
        errors: criticalErrors,
        warnings: warnings.concat(errors.filter(e => !criticalErrors.includes(e)).map(e => e.message)),
        correctionSuggestions: correctionSuggestions,
        validatedData: criticalErrors.length === 0 ? typedData : undefined,
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
   * 🏆 ЖЕСТКАЯ ВАЛИДАЦИЯ QUALITY SCORE ≥70
   */
  private validateQualityScore(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const minScore = AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE;
    
    if (data.quality_package.quality_score < minScore) {
      errors.push({
        field: 'quality_package.quality_score',
        errorType: 'invalid_value',
        message: `Quality score ${data.quality_package.quality_score} меньше обязательного минимума ${minScore}`,
        currentValue: data.quality_package.quality_score,
        expectedValue: minScore,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'quality_package.quality_score',
        issue: 'Недостаточный качественный счет',
        suggestion: 'Улучшить все аспекты качества email',
        correctionPrompt: `Quality score составляет ${data.quality_package.quality_score} баллов, но требуется минимум ${minScore}. КРИТИЧНО: Улучшите качество по всем направлениям: 1) HTML структура и валидность 2) CSS оптимизация 3) Accessibility 4) Совместимость с email клиентами 5) Производительность загрузки 6) Антиспам оптимизация. Предоставьте улучшенную версию с качеством ≥${minScore} баллов.`,
        priority: 'high'
      });
    }
    
    // Проверка статуса валидации
    if (data.quality_package.validation_status === 'failed') {
      errors.push({
        field: 'quality_package.validation_status',
        errorType: 'invalid_value',
        message: 'Статус валидации "failed" недопустим для передачи',
        currentValue: data.quality_package.validation_status,
        expectedValue: 'passed',
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'quality_package.validation_status',
        issue: 'Провалена валидация',
        suggestion: 'Исправить все проблемы качества',
        correctionPrompt: 'Email провалил валидацию качества. Исправьте ВСЕ выявленные проблемы и убедитесь что validation_status = "passed" или "passed_with_warnings". Система не может передать email с failed статусом.',
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
   * ♿ ВАЛИДАЦИЯ WCAG AA COMPLIANCE
   */
  private validateAccessibilityCompliance(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const minAccessibilityScore = AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_ACCESSIBILITY_SCORE;
    
    // ОБЯЗАТЕЛЬНАЯ ПРОВЕРКА WCAG AA COMPLIANCE
    if (!data.accessibility_report.wcag_aa_compliant) {
      errors.push({
        field: 'accessibility_report.wcag_aa_compliant',
        errorType: 'invalid_value',
        message: 'WCAG AA compliance ОБЯЗАТЕЛЕН',
        currentValue: false,
        expectedValue: true,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'accessibility_report.wcag_aa_compliant',
        issue: 'Не соответствует WCAG AA',
        suggestion: 'Исправить все accessibility проблемы',
        correctionPrompt: 'Email НЕ соответствует WCAG AA стандартам. ОБЯЗАТЕЛЬНО исправьте: 1) Добавьте alt тексты для всех изображений 2) Обеспечьте контрастность цветов ≥4.5:1 3) Добавьте role атрибуты 4) Проверьте порядок tabindex 5) Убедитесь что email читается screen reader\'ами. Верните версию с wcag_aa_compliant: true.',
        priority: 'high'
      });
    }
    
    // ПРОВЕРКА ACCESSIBILITY SCORE ≥80
    if (data.accessibility_report.score < minAccessibilityScore) {
      errors.push({
        field: 'accessibility_report.score',
        errorType: 'invalid_value',
        message: `Accessibility score ${data.accessibility_report.score} меньше требуемого ${minAccessibilityScore}`,
        currentValue: data.accessibility_report.score,
        expectedValue: minAccessibilityScore,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'accessibility_report.score',
        issue: 'Низкий accessibility score',
        suggestion: 'Повысить доступность email',
        correctionPrompt: `Accessibility score ${data.accessibility_report.score} недостаточен, требуется ≥${minAccessibilityScore}. Улучшите: 1) Alt тексты должны быть описательными 2) Цветовая контрастность text/background ≥4.5:1 3) Логическая структура заголовков h1-h6 4) Keyboard navigation support 5) Семантическая HTML разметка.`,
        priority: 'high'
      });
    }
    
    // ПРОВЕРКА ACCESSIBILITY ISSUES
    if (data.accessibility_report.issues.length > 0) {
      const criticalIssues = data.accessibility_report.issues.filter(issue => 
        issue.includes('alt') || issue.includes('contrast') || issue.includes('color')
      );
      
      if (criticalIssues.length > 0) {
        errors.push({
          field: 'accessibility_report.issues',
          errorType: 'invalid_value',
          message: `Критические accessibility проблемы: ${criticalIssues.join(', ')}`,
          currentValue: criticalIssues.length,
          expectedValue: 0,
          severity: 'critical'
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
   * 📧 ВАЛИДАЦИЯ EMAIL CLIENT COMPATIBILITY ≥95%
   */
  private validateEmailClientCompatibility(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const minCompatibility = AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE;
    const compatibility = data.test_results.email_client_compatibility;
    
    // ЖЕСТКАЯ ПРОВЕРКА ОБЩЕЙ СОВМЕСТИМОСТИ ≥95%
    if (compatibility.compatibility_score < minCompatibility) {
      errors.push({
        field: 'test_results.email_client_compatibility.compatibility_score',
        errorType: 'invalid_value',
        message: `Совместимость ${compatibility.compatibility_score}% меньше требуемых ${minCompatibility}%`,
        currentValue: compatibility.compatibility_score,
        expectedValue: minCompatibility,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'test_results.email_client_compatibility',
        issue: 'Низкая совместимость email клиентов',
        suggestion: 'Исправить проблемы совместимости',
        correctionPrompt: `Совместимость ${compatibility.compatibility_score}% недостаточна, требуется ≥${minCompatibility}%. КРИТИЧНО: Исправьте проблемы совместимости: 1) Используйте table-based layout 2) Инлайн CSS стили 3) Удалите flexbox/grid 4) Проверьте поддержку в Outlook 5) Оптимизируйте для мобильных клиентов. Gmail, Outlook, Apple Mail, Yahoo должны работать на 100%.`,
        priority: 'high'
      });
    }
    
    // ПРОВЕРКА КАЖДОГО ОСНОВНОГО КЛИЕНТА
    const clients = [
      { name: 'Gmail', supported: compatibility.gmail },
      { name: 'Outlook', supported: compatibility.outlook },
      { name: 'Apple Mail', supported: compatibility.apple_mail },
      { name: 'Yahoo Mail', supported: compatibility.yahoo_mail }
    ];
    
    const unsupportedClients = clients.filter(client => !client.supported);
    
    if (unsupportedClients.length > 0) {
      errors.push({
        field: 'test_results.email_client_compatibility',
        errorType: 'invalid_value',
        message: `Неподдерживаемые клиенты: ${unsupportedClients.map(c => c.name).join(', ')}`,
        currentValue: unsupportedClients.length,
        expectedValue: 0,
        severity: 'critical'
      });
      
      unsupportedClients.forEach(client => {
        suggestions.push({
          field: `test_results.email_client_compatibility.${client.name.toLowerCase().replace(' ', '_')}`,
          issue: `${client.name} не поддерживается`,
          suggestion: `Исправить совместимость с ${client.name}`,
          correctionPrompt: `${client.name} НЕ поддерживает текущий email. Специфичные исправления для ${client.name}: ${this.getClientSpecificFixes(client.name)}`,
          priority: 'high'
        });
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * 🔍 ВАЛИДАЦИЯ HTML И CSS КАЧЕСТВА
   */
  private validateHTMLCSSQuality(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // W3C HTML COMPLIANCE ОБЯЗАТЕЛЕН
    if (!data.test_results.html_validation.w3c_compliant) {
      errors.push({
        field: 'test_results.html_validation.w3c_compliant',
        errorType: 'invalid_value',
        message: 'W3C HTML compliance ОБЯЗАТЕЛЕН',
        currentValue: false,
        expectedValue: true,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'test_results.html_validation',
        issue: 'HTML не соответствует W3C стандартам',
        suggestion: 'Исправить все HTML ошибки',
        correctionPrompt: 'HTML НЕ проходит W3C валидацию. ОБЯЗАТЕЛЬНО исправьте все ошибки: 1) Закройте все теги 2) Исправьте атрибуты 3) Используйте корректный DOCTYPE 4) Проверьте вложенность элементов 5) Валидируйте через validator.w3.org',
        priority: 'high'
      });
    }
    
    // ПРОВЕРКА HTML ОШИБОК
    if (data.test_results.html_validation.errors.length > 0) {
      errors.push({
        field: 'test_results.html_validation.errors',
        errorType: 'invalid_value',
        message: `HTML содержит ${data.test_results.html_validation.errors.length} ошибок`,
        currentValue: data.test_results.html_validation.errors.length,
        expectedValue: 0,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'test_results.html_validation.errors',
        issue: 'Ошибки в HTML коде',
        suggestion: 'Исправить все HTML ошибки',
        correctionPrompt: `HTML содержит ошибки: ${data.test_results.html_validation.errors.slice(0, 3).join('; ')}. Исправьте ВСЕ ошибки валидации. HTML должен быть полностью валидным.`,
        priority: 'high'
      });
    }
    
    // CSS ВАЛИДНОСТЬ
    if (!data.test_results.css_validation.valid) {
      errors.push({
        field: 'test_results.css_validation.valid',
        errorType: 'invalid_value',
        message: 'CSS содержит ошибки валидации',
        currentValue: false,
        expectedValue: true,
        severity: 'major'
      });
      
      suggestions.push({
        field: 'test_results.css_validation',
        issue: 'Ошибки в CSS',
        suggestion: 'Исправить CSS ошибки',
        correctionPrompt: `CSS содержит ошибки: ${data.test_results.css_validation.issues.slice(0, 3).join('; ')}. Исправьте все CSS проблемы: 1) Удалите неподдерживаемые свойства 2) Исправьте синтаксис 3) Оптимизируйте для email клиентов`,
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
   * 🚫 ВАЛИДАЦИЯ SPAM ANALYSIS ≤3
   */
  private validateSpamAnalysis(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const maxSpamScore = AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_SPAM_SCORE;
    
    // ЖЕСТКАЯ ПРОВЕРКА SPAM SCORE ≤3
    if (data.spam_analysis.spam_score > maxSpamScore) {
      errors.push({
        field: 'spam_analysis.spam_score',
        errorType: 'invalid_value',
        message: `Spam score ${data.spam_analysis.spam_score} превышает максимум ${maxSpamScore}`,
        currentValue: data.spam_analysis.spam_score,
        expectedValue: maxSpamScore,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'spam_analysis.spam_score',
        issue: 'Высокий риск попадания в спам',
        suggestion: 'Оптимизировать email для антиспам фильтров',
        correctionPrompt: `Spam score ${data.spam_analysis.spam_score} КРИТИЧНО высокий (максимум ${maxSpamScore}). Срочно исправьте: 1) Уберите спам-слова 2) Балансируйте текст/изображения 3) Добавьте plain text версию 4) Оптимизируйте subject line 5) Проверьте sender reputation факторы. Факторы риска: ${data.spam_analysis.risk_factors.join(', ')}.`,
        priority: 'high'
      });
    }
    
    // ПРОВЕРКА RISK FACTORS
    const criticalRiskFactors = data.spam_analysis.risk_factors.filter(factor => 
      factor.includes('spam') || factor.includes('blacklist') || factor.includes('reputation')
    );
    
    if (criticalRiskFactors.length > 0) {
      errors.push({
        field: 'spam_analysis.risk_factors',
        errorType: 'invalid_value',
        message: `Критические факторы риска: ${criticalRiskFactors.join(', ')}`,
        currentValue: criticalRiskFactors.length,
        expectedValue: 0,
        severity: 'major'
      });
    }
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * ⚡ ВАЛИДАЦИЯ PERFORMANCE ANALYSIS
   */
  private validatePerformanceAnalysis(data: QualityToDeliveryHandoffData): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    const minPerformanceScore = 70;
    const performance = data.performance_analysis;
    
    // Проверка всех аспектов производительности
    const performanceChecks = [
      { field: 'load_time_score', value: performance.load_time_score, name: 'Load Time' },
      { field: 'file_size_score', value: performance.file_size_score, name: 'File Size' },
      { field: 'optimization_score', value: performance.optimization_score, name: 'Optimization' }
    ];
    
    for (const check of performanceChecks) {
      if (check.value < minPerformanceScore) {
        errors.push({
          field: `performance_analysis.${check.field}`,
          errorType: 'invalid_value',
          message: `${check.name} score ${check.value} меньше требуемого ${minPerformanceScore}`,
          currentValue: check.value,
          expectedValue: minPerformanceScore,
          severity: 'major'
        });
        
        suggestions.push({
          field: `performance_analysis.${check.field}`,
          issue: `Низкий ${check.name} score`,
          suggestion: `Оптимизировать ${check.name.toLowerCase()}`,
          correctionPrompt: this.getPerformanceOptimizationPrompt(check.field, check.value),
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
   * 🔐 ВАЛИДАЦИЯ ЦЕЛОСТНОСТИ HTML
   */
  private validateHTMLIntegrity(validatedHtml: string): {
    isValid: boolean;
    errors: HandoffValidationError[];
    suggestions: CorrectionSuggestion[];
  } {
    const errors: HandoffValidationError[] = [];
    const suggestions: CorrectionSuggestion[] = [];
    
    // Проверка минимальной длины
    if (validatedHtml.length < 100) {
      errors.push({
        field: 'quality_package.validated_html',
        errorType: 'invalid_value',
        message: 'Validated HTML слишком короткий',
        currentValue: validatedHtml.length,
        expectedValue: 100,
        severity: 'critical'
      });
    }
    
    // Проверка наличия критических элементов
    const requiredElements = ['<html', '<head', '<body', '<title'];
    const missingElements = requiredElements.filter(element => !validatedHtml.includes(element));
    
    if (missingElements.length > 0) {
      errors.push({
        field: 'quality_package.validated_html',
        errorType: 'missing',
        message: `Отсутствуют обязательные элементы: ${missingElements.join(', ')}`,
        severity: 'critical'
      });
      
      suggestions.push({
        field: 'quality_package.validated_html',
        issue: 'Неполная HTML структура',
        suggestion: 'Добавить все обязательные HTML элементы',
        correctionPrompt: `HTML неполный, отсутствуют: ${missingElements.join(', ')}. Добавьте полную HTML структуру: <!DOCTYPE html>, <html>, <head>, <title>, <body>`,
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
   * 🔧 HELPER METHODS
   */

  private getClientSpecificFixes(clientName: string): string {
    const fixes: Record<string, string> = {
      'Gmail': '1) Удалите <style> блоки 2) Используйте только инлайн стили 3) Избегайте margin/padding на <body> 4) Тестируйте в Gmail interface',
      'Outlook': '1) Используйте table layout 2) Избегайте background-image на div 3) Используйте VML для фигур 4) Тестируйте в Outlook 2016+',
      'Apple Mail': '1) Оптимизируйте для retina дисплеев 2) Тестируйте dark mode поддержку 3) Проверьте iOS/macOS совместимость',
      'Yahoo Mail': '1) Минимизируйте CSS complexity 2) Используйте table-based layout 3) Тестируйте в web и mobile версиях'
    };
    
    return fixes[clientName] || 'Используйте стандартные email-safe практики: table layout, инлайн стили, простые селекторы';
  }

  private getPerformanceOptimizationPrompt(field: string, currentScore: number): string {
    const prompts: Record<string, string> = {
      'load_time_score': `Load time score ${currentScore} недостаточен. Оптимизируйте: 1) Сжимайте изображения 2) Минифицируйте CSS 3) Уберите неиспользуемые стили 4) Оптимизируйте DOM структуру`,
      'file_size_score': `File size score ${currentScore} низкий. Уменьшите размер: 1) Оптимизируйте изображения 2) Минифицируйте HTML/CSS 3) Удалите лишний контент 4) Используйте эффективные CSS правила`,
      'optimization_score': `Optimization score ${currentScore} требует улучшения. Оптимизируйте: 1) Кэширование ресурсов 2) Lazy loading изображений 3) Эффективные CSS селекторы 4) Минимизация HTTP запросов`
    };
    
    return prompts[field] || `Улучшите производительность поля ${field}`;
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
   * 📊 РАСЧЕТ КОМПЛЕКСНЫХ МЕТРИК КАЧЕСТВА
   */
  public calculateQualityMetrics(data: QualityToDeliveryHandoffData): QualityMetrics {
    return {
      overall_score: data.quality_package.quality_score,
      html_quality: data.test_results.html_validation.w3c_compliant ? 85 : 45,
      accessibility_score: data.accessibility_report.score,
      compatibility_score: data.test_results.email_client_compatibility.compatibility_score,
      performance_score: Math.round((
        data.performance_analysis.load_time_score +
        data.performance_analysis.file_size_score +
        data.performance_analysis.optimization_score
      ) / 3),
      spam_risk_score: 10 - data.spam_analysis.spam_score // Инвертируем для метрик
    };
  }

  /**
   * 🎯 ПРОВЕРКА ГОТОВНОСТИ К DELIVERY
   */
  public isReadyForDelivery(data: QualityToDeliveryHandoffData): {
    ready: boolean;
    blockers: string[];
    recommendations: string[];
  } {
    const blockers: string[] = [];
    const recommendations: string[] = [];
    
    // Критические блокеры
    if (data.quality_package.quality_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE) {
      blockers.push(`Quality score ${data.quality_package.quality_score} < ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE}`);
    }
    
    if (!data.accessibility_report.wcag_aa_compliant) {
      blockers.push('WCAG AA compliance required');
    }
    
    if (data.test_results.email_client_compatibility.compatibility_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE) {
      blockers.push(`Email compatibility ${data.test_results.email_client_compatibility.compatibility_score}% < ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE}%`);
    }
    
    if (data.spam_analysis.spam_score > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_SPAM_SCORE) {
      blockers.push(`Spam score ${data.spam_analysis.spam_score} > ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_SPAM_SCORE}`);
    }
    
    // Рекомендации для улучшения
    if (data.performance_analysis.load_time_score < 80) {
      recommendations.push('Improve load time optimization');
    }
    
    if (data.test_results.html_validation.warnings.length > 0) {
      recommendations.push('Address HTML validation warnings');
    }
    
    return {
      ready: blockers.length === 0,
      blockers,
      recommendations
    };
  }
}