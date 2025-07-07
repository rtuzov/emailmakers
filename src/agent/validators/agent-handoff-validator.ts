import { z } from 'zod';
import { ValidationMonitor } from '../utils/validation-monitor-stub';
import { generateTraceId } from '../utils/tracing-utils';
import {
  HandoffDataUnion,
  HandoffValidationResult,
  HandoffValidationError,
  CorrectionSuggestion,
  ContentToDesignHandoffData,
  DesignToQualityHandoffData,
  QualityToDeliveryHandoffData,
  ContentToDesignHandoffDataSchema,
  DesignToQualityHandoffDataSchema,
  QualityToDeliveryHandoffDataSchema,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

/**
 * 🎯 UNIVERSAL HANDOFF VALIDATOR
 * 
 * Система строгой валидации передачи данных между агентами
 * Принцип: Zero tolerance к ошибкам, AI коррекция при необходимости
 */

export type HandoffType = 'content-to-design' | 'design-to-quality' | 'quality-to-delivery';

export interface AICorrector {
  correctData(
    invalidData: any,
    correctionSuggestions: CorrectionSuggestion[],
    handoffType: HandoffType
  ): Promise<any>;
}

export class HandoffValidator {
  private static instance: HandoffValidator;
  private aiCorrector?: AICorrector;
  private monitor: ValidationMonitor;

  private constructor(aiCorrector?: AICorrector) {
    this.aiCorrector = aiCorrector;
    this.monitor = ValidationMonitor.getInstance();
  }

  /**
   * Singleton instance для производительности
   */
  public static getInstance(aiCorrector?: AICorrector): HandoffValidator {
    if (!HandoffValidator.instance) {
      HandoffValidator.instance = new HandoffValidator(aiCorrector);
    }
    return HandoffValidator.instance;
  }

  /**
   * 🔄 ВАЛИДАЦИЯ ContentSpecialist → DesignSpecialist
   */
  public async validateContentToDesign(
    data: any,
    enableAICorrection: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    let correctionAttempts = 0;
    
    try {
      // Попытка прямой валидации
      const validatedData = ContentToDesignHandoffDataSchema.parse(data);
      
      // Мониторинг успешной валидации
      this.monitor.recordValidation({
        agentId: 'content-specialist',
        agentType: 'content',
        success: true,
        duration: Date.now() - startTime,
        validationType: 'content-to-design',
        correctionAttempts
      });
      
      return {
        isValid: true,
        errors: [],
        warnings: [],
        correctionSuggestions: [],
        validatedData: validatedData as ContentToDesignHandoffData,
        validationDuration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = this.processZodErrors(error);
        const correctionSuggestions = this.generateContentToDesignCorrections(validationErrors, data);
        
        // Попытка AI коррекции если включена
        if (enableAICorrection && this.aiCorrector) {
          correctionAttempts = 1;
          
          const correctedData = await this.attemptAICorrection(
            data,
            correctionSuggestions,
            'content-to-design'
          );
          
          if (correctedData) {
            // Повторная валидация исправленных данных
            try {
              const validatedCorrectedData = ContentToDesignHandoffDataSchema.parse(correctedData);
              
              // Мониторинг успешной коррекции
              this.monitor.recordValidation({
                agentId: 'content-specialist',
                agentType: 'content',
                success: true,
                duration: Date.now() - startTime,
                validationType: 'content-to-design',
                correctionAttempts
              });
              
              this.monitor.recordCorrection({
                agentId: 'content-specialist',
                success: true,
                attempts: correctionAttempts,
                correctionType: 'content-to-design',
                originalErrors: validationErrors,
                correctedData: validatedCorrectedData
              });
              
              return {
                isValid: true,
                errors: [],
                warnings: ['Data corrected by AI'],
                correctionSuggestions: correctionSuggestions,
                validatedData: validatedCorrectedData as ContentToDesignHandoffData,
                validationDuration: Date.now() - startTime
              };
            } catch (revalidationError) {
              // AI коррекция не помогла - мониторинг неудачи
              this.monitor.recordCorrection({
                agentId: 'content-specialist',
                success: false,
                attempts: correctionAttempts,
                correctionType: 'content-to-design',
                originalErrors: validationErrors
              });
              
              this.monitor.recordValidation({
                agentId: 'content-specialist',
                agentType: 'content',
                success: false,
                duration: Date.now() - startTime,
                validationType: 'content-to-design',
                errorDetails: validationErrors,
                correctionAttempts
              });
              
              return {
                isValid: false,
                errors: validationErrors,
                warnings: ['AI correction failed'],
                correctionSuggestions: correctionSuggestions,
                validationDuration: Date.now() - startTime
              };
            }
          }
        }
        
        // Мониторинг неудачной валидации без коррекции
        this.monitor.recordValidation({
          agentId: 'content-specialist',
          agentType: 'content',
          success: false,
          duration: Date.now() - startTime,
          validationType: 'content-to-design',
          errorDetails: validationErrors,
          correctionAttempts
        });
        
        return {
          isValid: false,
          errors: validationErrors,
          warnings: [],
          correctionSuggestions: correctionSuggestions,
          validationDuration: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  /**
   * 🔄 ВАЛИДАЦИЯ DesignSpecialist → QualitySpecialist
   */
  public async validateDesignToQuality(
    data: any,
    enableAICorrection: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    
    try {
      const validatedData = DesignToQualityHandoffDataSchema.parse(data);
      
      // Дополнительные строгие проверки
      const additionalValidation = this.performDesignQualityChecks(validatedData as DesignToQualityHandoffData);
      
      if (!additionalValidation.isValid) {
        const correctionSuggestions = this.generateDesignToQualityCorrections(
          additionalValidation.errors, 
          data
        );
        
        if (enableAICorrection && this.aiCorrector) {
          const correctedData = await this.attemptAICorrection(
            data,
            correctionSuggestions,
            'design-to-quality'
          );
          
          if (correctedData) {
            try {
              const validatedCorrectedData = DesignToQualityHandoffDataSchema.parse(correctedData);
              const recheck = this.performDesignQualityChecks(validatedCorrectedData as DesignToQualityHandoffData);
              
              if (recheck.isValid) {
                return {
                  isValid: true,
                  errors: [],
                  warnings: ['Data corrected by AI'],
                  correctionSuggestions: correctionSuggestions,
                  validatedData: validatedCorrectedData as DesignToQualityHandoffData,
                  validationDuration: Date.now() - startTime
                };
              }
            } catch (revalidationError) {
              // Ignore, fall through to error return
            }
          }
        }
        
        return {
          isValid: false,
          errors: additionalValidation.errors,
          warnings: [],
          correctionSuggestions: correctionSuggestions,
          validationDuration: Date.now() - startTime
        };
      }
      
      return {
        isValid: true,
        errors: [],
        warnings: [],
        correctionSuggestions: [],
        validatedData: validatedData as DesignToQualityHandoffData,
        validationDuration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = this.processZodErrors(error);
        const correctionSuggestions = this.generateDesignToQualityCorrections(validationErrors, data);
        
        if (enableAICorrection && this.aiCorrector) {
          const correctedData = await this.attemptAICorrection(
            data,
            correctionSuggestions,
            'design-to-quality'
          );
          
          if (correctedData) {
            try {
              const validatedCorrectedData = DesignToQualityHandoffDataSchema.parse(correctedData);
              return {
                isValid: true,
                errors: [],
                warnings: ['Data corrected by AI'],
                correctionSuggestions: correctionSuggestions,
                validatedData: validatedCorrectedData as DesignToQualityHandoffData,
                validationDuration: Date.now() - startTime
              };
            } catch (revalidationError) {
              // AI коррекция не помогла
            }
          }
        }
        
        return {
          isValid: false,
          errors: validationErrors,
          warnings: [],
          correctionSuggestions: correctionSuggestions,
          validationDuration: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  /**
   * 🔄 ВАЛИДАЦИЯ QualitySpecialist → DeliverySpecialist
   */
  public async validateQualityToDelivery(
    data: any,
    enableAICorrection: boolean = true
  ): Promise<HandoffValidationResult> {
    const startTime = Date.now();
    
    try {
      const validatedData = QualityToDeliveryHandoffDataSchema.parse(data);
      
      // Дополнительные финальные проверки
      const finalValidation = this.performFinalQualityChecks(validatedData as QualityToDeliveryHandoffData);
      
      if (!finalValidation.isValid) {
        const correctionSuggestions = this.generateQualityToDeliveryCorrections(
          finalValidation.errors,
          data
        );
        
        if (enableAICorrection && this.aiCorrector) {
          const correctedData = await this.attemptAICorrection(
            data,
            correctionSuggestions,
            'quality-to-delivery'
          );
          
          if (correctedData) {
            try {
              const validatedCorrectedData = QualityToDeliveryHandoffDataSchema.parse(correctedData);
              const recheck = this.performFinalQualityChecks(validatedCorrectedData as QualityToDeliveryHandoffData);
              
              if (recheck.isValid) {
                return {
                  isValid: true,
                  errors: [],
                  warnings: ['Data corrected by AI'],
                  correctionSuggestions: correctionSuggestions,
                  validatedData: validatedCorrectedData as QualityToDeliveryHandoffData,
                  validationDuration: Date.now() - startTime
                };
              }
            } catch (revalidationError) {
              // Ignore, fall through to error return
            }
          }
        }
        
        return {
          isValid: false,
          errors: finalValidation.errors,
          warnings: [],
          correctionSuggestions: correctionSuggestions,
          validationDuration: Date.now() - startTime
        };
      }
      
      return {
        isValid: true,
        errors: [],
        warnings: [],
        correctionSuggestions: [],
        validatedData: validatedData as QualityToDeliveryHandoffData,
        validationDuration: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = this.processZodErrors(error);
        const correctionSuggestions = this.generateQualityToDeliveryCorrections(validationErrors, data);
        
        if (enableAICorrection && this.aiCorrector) {
          const correctedData = await this.attemptAICorrection(
            data,
            correctionSuggestions,
            'quality-to-delivery'
          );
          
          if (correctedData) {
            try {
              const validatedCorrectedData = QualityToDeliveryHandoffDataSchema.parse(correctedData);
              return {
                isValid: true,
                errors: [],
                warnings: ['Data corrected by AI'],
                correctionSuggestions: correctionSuggestions,
                validatedData: validatedCorrectedData as QualityToDeliveryHandoffData,
                validationDuration: Date.now() - startTime
              };
            } catch (revalidationError) {
              // AI коррекция не помогла
            }
          }
        }
        
        return {
          isValid: false,
          errors: validationErrors,
          warnings: [],
          correctionSuggestions: correctionSuggestions,
          validationDuration: Date.now() - startTime
        };
      }
      
      throw error;
    }
  }

  /**
   * 🔍 ПРОВЕРКА ЦЕЛОСТНОСТИ HANDOFF ДАННЫХ
   */
  public validateHandoffIntegrity(
    data: any,
    expectedType: HandoffType
  ): HandoffValidationResult {
    const startTime = Date.now();
    const errors: HandoffValidationError[] = [];
    
    // Проверка обязательных полей для всех типов
    if (!data.trace_id) {
      errors.push({
        field: 'trace_id',
        errorType: 'missing',
        message: 'trace_id обязателен для отслеживания',
        severity: 'critical'
      });
    }
    
    if (!data.timestamp) {
      errors.push({
        field: 'timestamp',
        errorType: 'missing',
        message: 'timestamp обязателен',
        severity: 'critical'
      });
    }
    
    // Специфичные проверки по типу
    switch (expectedType) {
      case 'content-to-design':
        if (!data.content_package || !data.design_requirements) {
          errors.push({
            field: 'structure',
            errorType: 'missing',
            message: 'Отсутствуют обязательные секции для content-to-design',
            severity: 'critical'
          });
        }
        break;
        
      case 'design-to-quality':
        if (!data.email_package || !data.rendering_metadata) {
          errors.push({
            field: 'structure',
            errorType: 'missing',
            message: 'Отсутствуют обязательные секции для design-to-quality',
            severity: 'critical'
          });
        }
        break;
        
      case 'quality-to-delivery':
        if (!data.quality_package || !data.test_results) {
          errors.push({
            field: 'structure',
            errorType: 'missing',
            message: 'Отсутствуют обязательные секции для quality-to-delivery',
            severity: 'critical'
          });
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: [],
      correctionSuggestions: [],
      validationDuration: Date.now() - startTime
    };
  }

  /**
   * 🔧 PRIVATE HELPER METHODS
   */

  private processZodErrors(error: z.ZodError): HandoffValidationError[] {
    return error.errors.map(issue => ({
      field: issue.path.join('.'),
      errorType: this.mapZodErrorType(issue.code),
      message: issue.message,
      currentValue: 'received' in issue ? issue.received : undefined,
      expectedValue: 'expected' in issue ? issue.expected : undefined,
      severity: this.determineSeverity(issue.path, issue.code)
    }));
  }

  private mapZodErrorType(code: z.ZodIssueCode): HandoffValidationError['errorType'] {
    switch (code) {
      case 'invalid_type':
        return 'invalid_type';
      case 'too_small':
      case 'too_big':
        return 'size_limit';
      case 'invalid_string':
        return 'format_error';
      default:
        return 'invalid_value';
    }
  }

  private determineSeverity(path: (string | number)[], code: z.ZodIssueCode): 'critical' | 'major' | 'minor' {
    const criticalFields = ['trace_id', 'timestamp', 'quality_score', 'html_content'];
    const fieldName = path[path.length - 1]?.toString();
    
    if (criticalFields.includes(fieldName ?? '')) {
      return 'critical';
    }
    
    if (code === 'invalid_type' || code === 'invalid_literal') {
      return 'major';
    }
    
    return 'minor';
  }

  private generateContentToDesignCorrections(
    errors: HandoffValidationError[],
    originalData: any
  ): CorrectionSuggestion[] {
    return errors.map(error => ({
      field: error.field,
      issue: error.message,
      suggestion: this.getContentToDesignSuggestion(error.field, error.errorType),
      correctionPrompt: this.generateContentToDesignPrompt(error.field, error.errorType, originalData),
      priority: error.severity === 'critical' ? 'high' : error.severity === 'major' ? 'medium' : 'low'
    }));
  }

  private generateDesignToQualityCorrections(
    errors: HandoffValidationError[],
    originalData: any
  ): CorrectionSuggestion[] {
    return errors.map(error => ({
      field: error.field,
      issue: error.message,
      suggestion: this.getDesignToQualitySuggestion(error.field, error.errorType),
      correctionPrompt: this.generateDesignToQualityPrompt(error.field, error.errorType, originalData),
      priority: error.severity === 'critical' ? 'high' : error.severity === 'major' ? 'medium' : 'low'
    }));
  }

  private generateQualityToDeliveryCorrections(
    errors: HandoffValidationError[],
    originalData: any
  ): CorrectionSuggestion[] {
    return errors.map(error => ({
      field: error.field,
      issue: error.message,
      suggestion: this.getQualityToDeliverySuggestion(error.field, error.errorType),
      correctionPrompt: this.generateQualityToDeliveryPrompt(error.field, error.errorType, originalData),
      priority: error.severity === 'critical' ? 'high' : error.severity === 'major' ? 'medium' : 'low'
    }));
  }

  private getContentToDesignSuggestion(field: string, errorType: string): string {
    const suggestions: Record<string, string> = {
      'content_package.complete_content.subject': 'Subject должен быть 1-100 символов',
      'content_package.complete_content.preheader': 'Preheader должен быть 1-150 символов',
      'content_package.complete_content.body': 'Body должен быть 10-5000 символов',
      'content_package.complete_content.cta': 'CTA должен быть 1-50 символов',
      'design_requirements.template_type': 'Тип должен быть: promotional, informational, newsletter, transactional',
      'campaign_context.urgency_level': 'Уровень должен быть: low, medium, high, critical'
    };
    
    return suggestions[field] || `Исправьте поле ${field} согласно требованиям`;
  }

  private getDesignToQualitySuggestion(field: string, errorType: string): string {
    const suggestions: Record<string, string> = {
      'email_package.html_content': 'HTML контент должен быть корректным и >100 символов',
      'rendering_metadata.file_size_bytes': 'Размер файла должен быть ≤100KB (102400 байт)',
      'design_artifacts.performance_metrics.total_size_kb': 'Общий размер должен быть ≤100KB',
      'rendering_metadata.render_time_ms': 'Время рендеринга должно быть ≤1000мс'
    };
    
    return suggestions[field] || `Оптимизируйте поле ${field}`;
  }

  private getQualityToDeliverySuggestion(field: string, errorType: string): string {
    const suggestions: Record<string, string> = {
      'quality_package.quality_score': 'Quality score должен быть ≥70 баллов',
      'test_results.email_client_compatibility.compatibility_score': 'Совместимость должна быть ≥95%',
      'accessibility_report.score': 'Accessibility score должен быть ≥80 баллов',
      'spam_analysis.spam_score': 'Spam score должен быть ≤3 баллов'
    };
    
    return suggestions[field] || `Улучшите показатели поля ${field}`;
  }

  private generateContentToDesignPrompt(field: string, errorType: string, data: any): string {
    return `ИСПРАВИТЬ КОНТЕНТ: Поле "${field}" не соответствует требованиям. 
Создайте корректный контент для email рассылки с учетом:
- Subject: 1-100 символов, привлекательный
- Preheader: 1-150 символов, дополняет subject
- Body: 10-5000 символов, структурированный текст
- CTA: 1-50 символов, призыв к действию
Тема: ${data?.campaign_context?.topic || 'не указана'}
Верните ТОЛЬКО исправленные данные в JSON формате.`;
  }

  private generateDesignToQualityPrompt(field: string, errorType: string, data: any): string {
    return `ОПТИМИЗИРОВАТЬ ДИЗАЙН: Поле "${field}" превышает лимиты. 
Оптимизируйте:
- HTML: корректный, валидный, <100KB
- CSS: инлайн стили, минификация
- Изображения: оптимизированные размеры
- Время рендеринга: <1000мс
Сохраните качество дизайна, но соблюдите все технические требования.
Верните ТОЛЬКО оптимизированные данные в JSON формате.`;
  }

  private generateQualityToDeliveryPrompt(field: string, errorType: string, data: any): string {
    return `УЛУЧШИТЬ КАЧЕСТВО: Поле "${field}" не соответствует стандартам качества.
Требования:
- Quality score ≥70 баллов
- Совместимость email клиентов ≥95%
- Accessibility score ≥80 баллов (WCAG AA)
- Spam score ≤3 баллов
Проанализируйте проблемы и устраните их.
Верните ТОЛЬКО улучшенные данные в JSON формате.`;
  }

  /**
   * 🔄 ПОПЫТКА AI КОРРЕКЦИИ С УМНОЙ ЛОГИКОЙ
   */
  private async attemptAICorrection(
    data: any,
    suggestions: CorrectionSuggestion[],
    handoffType: HandoffType
  ): Promise<any> {
    if (!this.aiCorrector) {
      console.warn('⚠️ AICorrector не инициализирован');
      return null;
    }

    // Проверяем, стоит ли запускать коррекцию
    const criticalErrors = suggestions.filter(s => s.priority === 'high').length;
    const totalErrors = suggestions.length;
    
    // Умная логика: не запускаем коррекцию для незначительных ошибок
    if (AGENT_CONSTANTS.HANDOFF_VALIDATION.SKIP_CORRECTION_FOR_MINOR_ERRORS) {
      if (criticalErrors === 0 && totalErrors < AGENT_CONSTANTS.HANDOFF_VALIDATION.TOTAL_ERROR_THRESHOLD) {
        console.log(`⚠️ Пропускаем автокоррекцию: ${criticalErrors} критических ошибок, ${totalErrors} общих ошибок (порог: ${AGENT_CONSTANTS.HANDOFF_VALIDATION.TOTAL_ERROR_THRESHOLD})`);
        return null;
      }
    }

    // Проверяем размер данных
    const dataSize = JSON.stringify(data).length;
    if (dataSize > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_CORRECTION_DATA_SIZE) {
      console.warn(`⚠️ Данные слишком большие для коррекции: ${dataSize} байт (максимум: ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_CORRECTION_DATA_SIZE})`);
      return null;
    }

    console.log(`🤖 Запускаем AI коррекцию: ${criticalErrors} критических, ${totalErrors} общих ошибок`);
    
    try {
      return await this.aiCorrector.correctData(data, suggestions, handoffType);
    } catch (error) {
      console.error('❌ AI коррекция провалена:', error.message);
      return null;
    }
  }

  private performDesignQualityChecks(data: DesignToQualityHandoffData): { isValid: boolean; errors: HandoffValidationError[] } {
    const errors: HandoffValidationError[] = [];
    
    // Проверка размера HTML с безопасной проверкой на undefined
    if (!data.email_package?.html_content) {
      errors.push({
        field: 'email_package.html_content',
        errorType: 'missing',
        message: `HTML контент отсутствует или пустой`,
        currentValue: data.email_package?.html_content || null,
        expectedValue: 'Строка длиной >100 символов',
        severity: 'critical'
      });
    } else {
      const htmlSize = Buffer.byteLength(data.email_package.html_content, 'utf8');
      if (htmlSize > AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB * 1024) {
        errors.push({
          field: 'email_package.html_content',
          errorType: 'size_limit',
          message: `HTML размер ${Math.round(htmlSize/1024)}KB превышает лимит ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB}KB`,
          currentValue: htmlSize,
          expectedValue: AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_FILE_SIZE_KB * 1024,
          severity: 'critical'
        });
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private performFinalQualityChecks(data: QualityToDeliveryHandoffData): { isValid: boolean; errors: HandoffValidationError[] } {
    const errors: HandoffValidationError[] = [];
    
    // Жесткая проверка quality score
    if (data.quality_package.quality_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE) {
      errors.push({
        field: 'quality_package.quality_score',
        errorType: 'invalid_value',
        message: `Quality score ${data.quality_package.quality_score} меньше минимального ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE}`,
        currentValue: data.quality_package.quality_score,
        expectedValue: AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE,
        severity: 'critical'
      });
    }
    
    // Проверка совместимости email клиентов
    if (data.test_results.email_client_compatibility.compatibility_score < AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE) {
      errors.push({
        field: 'test_results.email_client_compatibility.compatibility_score',
        errorType: 'invalid_value',
        message: `Совместимость ${data.test_results.email_client_compatibility.compatibility_score}% меньше требуемых ${AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE}%`,
        currentValue: data.test_results.email_client_compatibility.compatibility_score,
        expectedValue: AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_COMPATIBILITY_SCORE,
        severity: 'critical'
      });
    }
    
    return { isValid: errors.length === 0, errors };
  }
}

/**
 * 🔧 UTILITY FUNCTIONS
 */

export function createTimestamp(): string {
  return new Date().toISOString();
}

export function calculateDataSize(data: any): number {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}