/**
 * 🔍 AGENT HANDOFF VALIDATION SERVICE
 * 
 * Сервис валидации данных для handoffs между агентами
 * Обеспечивает целостность и корректность передаваемых данных
 */

import { getLogger } from '../../shared/logger';

const logger = getLogger({ component: 'handoff-validation' });

export interface HandoffValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

export interface HandoffRequest {
  fromAgent: string;
  toAgent: string;
  data: any;
  context: Record<string, any>;
  traceId?: string;
  workflowId?: string;
}

/**
 * 🔍 Сервис валидации handoffs между агентами
 */
export class AgentHandoffValidationService {
  private validationRules: Map<string, (data: any) => HandoffValidationResult> = new Map();

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * 🔍 Валидирует handoff запрос
   */
  async validateHandoff(request: HandoffRequest): Promise<HandoffValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Базовая валидация структуры
    if (!request.fromAgent || typeof request.fromAgent !== 'string') {
      errors.push('fromAgent is required and must be a string');
    }

    if (!request.toAgent || typeof request.toAgent !== 'string') {
      errors.push('toAgent is required and must be a string');
    }

    if (!request.data) {
      errors.push('data is required');
    }

    if (!request.context || typeof request.context !== 'object') {
      errors.push('context is required and must be an object');
    }

    // Специфическая валидация для пар агентов
    const handoffKey = `${request.fromAgent}->${request.toAgent}`;
    const specificValidator = this.validationRules.get(handoffKey);
    
    if (specificValidator && request.data) {
      const specificResult = specificValidator(request.data);
      errors.push(...specificResult.errors);
      warnings.push(...specificResult.warnings);
    }

    // Валидация размера данных
    const dataSize = JSON.stringify(request.data || {}).length;
    if (dataSize > 1000000) { // 1MB limit
      warnings.push(`Data size is large (${dataSize} bytes), consider optimization`);
    }

    const result: HandoffValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        handoffKey,
        dataSize,
        validatedAt: new Date().toISOString()
      }
    };

    logger.debug('Handoff validation completed', {
      fromAgent: request.fromAgent,
      toAgent: request.toAgent,
      isValid: result.isValid,
      errorCount: errors.length,
      warningCount: warnings.length
    });

    return result;
  }

  /**
   * 🔧 Инициализация правил валидации для конкретных пар агентов
   */
  private initializeValidationRules(): void {
    // Content -> Design
    this.validationRules.set('content-specialist->design-specialist', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.content_package && !data.content_data) {
        errors.push('Missing content_package or content_data');
      }

      if (!data.design_requirements) {
        warnings.push('Missing design_requirements - may affect design quality');
      }

      if (!data.brand_guidelines) {
        warnings.push('Missing brand_guidelines - may affect brand consistency');
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Design -> Quality
    this.validationRules.set('design-specialist->quality-specialist', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.html_output && !data.email_output) {
        errors.push('Missing html_output or email_output');
      }

      if (!data.assets_used && !data.visual_assets) {
        warnings.push('Missing assets_used or visual_assets');
      }

      if (data.html_output && data.html_output.length < 100) {
        warnings.push('HTML output seems too short (< 100 characters)');
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Quality -> Delivery
    this.validationRules.set('quality-specialist->delivery-specialist', (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!data.validated_output && !data.quality_results) {
        errors.push('Missing validated_output or quality_results');
      }

      if (!data.quality_metrics && !data.validation_results) {
        warnings.push('Missing quality_metrics or validation_results');
      }

      if (data.quality_metrics && typeof data.quality_metrics.score === 'number' && data.quality_metrics.score < 70) {
        warnings.push(`Quality score is low: ${data.quality_metrics.score} (recommended minimum: 70)`);
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    logger.info('Handoff validation rules initialized', {
      rulesCount: this.validationRules.size,
      supportedHandoffs: Array.from(this.validationRules.keys())
    });
  }

  /**
   * 📊 Получает статистику валидации
   */
  getValidationStats(): { supportedHandoffs: string[], rulesCount: number } {
    return {
      supportedHandoffs: Array.from(this.validationRules.keys()),
      rulesCount: this.validationRules.size
    };
  }

  /**
   * 🔧 Добавляет новое правило валидации
   */
  addValidationRule(
    handoffKey: string, 
    validator: (data: any) => HandoffValidationResult
  ): void {
    this.validationRules.set(handoffKey, validator);
    logger.info('New validation rule added', { handoffKey });
  }
} 