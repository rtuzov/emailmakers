import { z } from 'zod';
import { 
  BaseAgentOutput, 
  BaseAgentOutputSchema, 
  AgentResponseValidator,
  AgentResponseUtils 
} from '../types/base-agent-types';

/**
 * 🔍 AGENT RESPONSE VALIDATOR
 * 
 * Централизованная валидация ответов всех специализированных агентов
 * Обеспечивает единообразие форматов и обработку ошибок
 */

// Специфичные схемы для каждого типа агента
const ContentSpecialistResultsSchema = z.object({
  context_data: z.any().optional().nullable(),
  pricing_data: z.any().optional().nullable(),
  content_data: z.any().optional().nullable(),
  campaign_data: z.any().optional().nullable()
});

const DesignSpecialistResultsSchema = z.object({
  design_data: z.any().optional().nullable(),
  template_data: z.any().optional().nullable(),
  asset_data: z.any().optional().nullable()
});

const QualitySpecialistResultsSchema = z.object({
  quality_data: z.any().optional().nullable(),
  validation_data: z.any().optional().nullable(),
  test_data: z.any().optional().nullable()
});

const DeliverySpecialistResultsSchema = z.object({
  delivery_data: z.any().optional().nullable(),
  deployment_data: z.any().optional().nullable(),
  monitoring_data: z.any().optional().nullable()
});

// Полные схемы для каждого агента
const ContentSpecialistOutputSchema = BaseAgentOutputSchema.extend({
  results: ContentSpecialistResultsSchema,
  recommendations: z.object({
    next_agent: z.enum(['design_specialist', 'quality_specialist', 'delivery_specialist']).optional().nullable(),
    next_actions: z.array(z.string()).optional().nullable(),
    handoff_data: z.any().optional().nullable()
  })
});

const DesignSpecialistOutputSchema = BaseAgentOutputSchema.extend({
  results: DesignSpecialistResultsSchema,
  recommendations: z.object({
    next_agent: z.enum(['content_specialist', 'quality_specialist', 'delivery_specialist']).optional().nullable(),
    next_actions: z.array(z.string()).optional().nullable(),
    handoff_data: z.any().optional().nullable()
  })
});

const QualitySpecialistOutputSchema = BaseAgentOutputSchema.extend({
  results: QualitySpecialistResultsSchema,
  recommendations: z.object({
    next_agent: z.enum(['content_specialist', 'design_specialist', 'delivery_specialist']).optional().nullable(),
    next_actions: z.array(z.string()).optional().nullable(),
    handoff_data: z.any().optional().nullable()
  })
});

const DeliverySpecialistOutputSchema = BaseAgentOutputSchema.extend({
  results: DeliverySpecialistResultsSchema,
  recommendations: z.object({
    next_agent: z.enum(['content_specialist', 'design_specialist', 'quality_specialist']).optional().nullable(),
    next_actions: z.array(z.string()).optional().nullable(),
    handoff_data: z.any().optional().nullable()
  })
});

export class AgentResponseValidatorImpl implements AgentResponseValidator {
  
  /**
   * Валидация ответа агента по типу
   */
  validateOutput(output: any, agentType: string): {
    valid: boolean;
    errors: string[];
    sanitized?: BaseAgentOutput;
  } {
    console.log(`🔍 Validating ${agentType} output:`, {
      hasOutput: !!output,
      outputType: typeof output,
      outputKeys: output ? Object.keys(output) : []
    });

    try {
      let schema: z.ZodSchema;
      
      switch (agentType) {
        case 'content_specialist':
          schema = ContentSpecialistOutputSchema;
          break;
        case 'design_specialist':
          schema = DesignSpecialistOutputSchema;
          break;
        case 'quality_specialist':
          schema = QualitySpecialistOutputSchema;
          break;
        case 'delivery_specialist':
          schema = DeliverySpecialistOutputSchema;
          break;
        default:
          // Fallback to base schema for unknown agent types
          schema = BaseAgentOutputSchema;
          break;
      }

      const result = schema.parse(output);
      
      console.log(`✅ ${agentType} output validation passed`);
      return {
        valid: true,
        errors: [],
        sanitized: result
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        console.warn(`⚠️ ${agentType} output validation failed:`, errors);
        
        return {
          valid: false,
          errors: errors
        };
      }
      
      console.error(`❌ ${agentType} output validation error:`, error);
      return {
        valid: false,
        errors: [`Unknown validation error: ${error}`]
      };
    }
  }

  /**
   * Попытка исправить невалидный ответ агента
   */
  sanitizeOutput(output: any, agentType: string): BaseAgentOutput {
    console.log(`🔧 Sanitizing ${agentType} output`);

    // Базовая структура для исправления
    const baseStructure: BaseAgentOutput = {
      success: false,
      task_type: output?.task_type || 'unknown',
      results: output?.results || {},
      recommendations: {
        next_agent: output?.recommendations?.next_agent,
        next_actions: output?.recommendations?.next_actions || [],
        handoff_data: output?.recommendations?.handoff_data
      },
      analytics: {
        execution_time: output?.analytics?.execution_time || 0,
        operations_performed: output?.analytics?.operations_performed || 0,
        confidence_score: Math.min(Math.max(output?.analytics?.confidence_score || 0, 0), 100),
        agent_efficiency: Math.min(Math.max(output?.analytics?.agent_efficiency || 0, 0), 100)
      },
      error: output?.error || 'Output validation failed'
    };

    // Попытка извлечь success статус
    if (typeof output?.success === 'boolean') {
      baseStructure.success = output.success;
    }

    // Специфичная обработка для каждого типа агента
    switch (agentType) {
      case 'content_specialist':
        baseStructure.results = {
          context_data: output?.results?.context_data,
          pricing_data: output?.results?.pricing_data,
          content_data: output?.results?.content_data,
          campaign_data: output?.results?.campaign_data
        };
        break;
      case 'design_specialist':
        baseStructure.results = {
          design_data: output?.results?.design_data,
          template_data: output?.results?.template_data,
          asset_data: output?.results?.asset_data
        };
        break;
      case 'quality_specialist':
        baseStructure.results = {
          quality_data: output?.results?.quality_data,
          validation_data: output?.results?.validation_data,
          test_data: output?.results?.test_data
        };
        break;
      case 'delivery_specialist':
        baseStructure.results = {
          delivery_data: output?.results?.delivery_data,
          deployment_data: output?.results?.deployment_data,
          monitoring_data: output?.results?.monitoring_data
        };
        break;
    }

    console.log(`🔧 ${agentType} output sanitized successfully`);
    return baseStructure;
  }

  /**
   * Проверка критических полей ответа
   */
  validateCriticalFields(output: any, agentType: string): {
    valid: boolean;
    missingFields: string[];
  } {
    const requiredFields = ['success', 'task_type', 'results', 'recommendations', 'analytics'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in output) || output[field] === undefined) {
        missingFields.push(field);
      }
    }

    // Проверка вложенных полей
    if (output.analytics) {
      const requiredAnalytics = ['execution_time', 'operations_performed', 'confidence_score', 'agent_efficiency'];
      for (const field of requiredAnalytics) {
        if (!(field in output.analytics) || typeof output.analytics[field] !== 'number') {
          missingFields.push(`analytics.${field}`);
        }
      }
    }

    if (output.recommendations) {
      if (!Array.isArray(output.recommendations.next_actions)) {
        missingFields.push('recommendations.next_actions');
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Создание стандартного ответа об ошибке для агента
   */
  createErrorResponse(agentType: string, error: string, taskType: string = 'unknown'): BaseAgentOutput {
    return AgentResponseUtils.createErrorResponse(taskType, error, Date.now(), agentType);
  }
}

// Singleton instance
export const agentResponseValidator = new AgentResponseValidatorImpl();

// Утилитарные функции для быстрого использования
export const validateAgentOutput = (output: any, agentType: string) => 
  agentResponseValidator.validateOutput(output, agentType);

export const sanitizeAgentOutput = (output: any, agentType: string) => 
  agentResponseValidator.sanitizeOutput(output, agentType);

export const validateCriticalFields = (output: any, agentType: string) => 
  agentResponseValidator.validateCriticalFields(output, agentType); 