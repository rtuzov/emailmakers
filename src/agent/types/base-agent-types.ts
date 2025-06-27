import { z } from 'zod';

/**
 * 🎯 BASE AGENT TYPES
 * 
 * Базовые типы и интерфейсы для унификации всех специализированных агентов
 * Обеспечивают единообразие форматов ввода/вывода и валидацию
 */

// Базовый интерфейс для входных данных всех агентов
export interface BaseAgentInput {
  task_type: string;
  campaign_brief: {
    topic: string;
    campaign_type?: 'promotional' | 'informational' | 'seasonal' | 'urgent' | 'newsletter';
    target_audience?: string;
    destination?: string;
    origin?: string;
  };
  handoff_context?: any;
  trace_id?: string;
}

// Базовый интерфейс для выходных данных всех агентов
export interface BaseAgentOutput {
  success: boolean;
  task_type: string;
  results: Record<string, any>;
  recommendations: {
    next_agent?: 'content_specialist' | 'design_specialist' | 'quality_specialist' | 'delivery_specialist';
    next_actions?: string[];
    handoff_data?: any;
  };
  analytics: {
    execution_time: number;
    operations_performed: number;
    confidence_score: number;
    agent_efficiency: number;
  };
  error?: string;
}

// Zod схема для валидации базового ответа агента
export const BaseAgentOutputSchema = z.object({
  success: z.boolean(),
  task_type: z.string(),
  results: z.record(z.any()),
  recommendations: z.object({
    next_agent: z.enum(['content_specialist', 'design_specialist', 'quality_specialist', 'delivery_specialist']).optional(),
    next_actions: z.array(z.string()).optional(),
    handoff_data: z.any().optional()
  }),
  analytics: z.object({
    execution_time: z.number(),
    operations_performed: z.number(),
    confidence_score: z.number().min(0).max(100),
    agent_efficiency: z.number().min(0).max(100)
  }),
  error: z.string().optional()
});

// Тип для валидированного ответа агента
export type ValidatedAgentOutput = z.infer<typeof BaseAgentOutputSchema>;

// Интерфейс для валидатора ответов агентов
export interface AgentResponseValidator {
  validateOutput(output: any, agentType: string): {
    valid: boolean;
    errors: string[];
    sanitized?: BaseAgentOutput;
  };
}

// Стандартные коды ошибок для агентов
export enum AgentErrorCodes {
  INVALID_INPUT = 'INVALID_INPUT',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  DATA_EXTRACTION_FAILED = 'DATA_EXTRACTION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  HANDOFF_FAILED = 'HANDOFF_FAILED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Стандартная ошибка агента
export class AgentError extends Error {
  constructor(
    public code: AgentErrorCodes,
    message: string,
    public agentType: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

// Утилиты для работы с ответами агентов
export class AgentResponseUtils {
  /**
   * Безопасное извлечение данных из ответа OpenAI агента
   */
  static extractDataFromOpenAIResponse(response: any): any {
    if (!response) return null;
    
    // Пробуем различные возможные структуры ответа OpenAI
    return response.content_data ||
           response.data ||
           response.result ||
           response.output ||
           response.results ||
           response;
  }

  /**
   * Создание стандартного ответа об ошибке
   */
  static createErrorResponse(
    taskType: string,
    error: string | Error,
    startTime: number,
    agentType: string
  ): BaseAgentOutput {
    return {
      success: false,
      task_type: taskType,
      results: {},
      recommendations: {
        next_actions: ['Check error logs', 'Verify input parameters', 'Retry with different parameters']
      },
      analytics: {
        execution_time: Date.now() - startTime,
        operations_performed: 0,
        confidence_score: 0,
        agent_efficiency: 0
      },
      error: error instanceof Error ? error.message : error
    };
  }

  /**
   * Валидация и санитизация ответа агента
   */
  static validateAndSanitize(output: any, agentType: string): {
    valid: boolean;
    errors: string[];
    sanitized?: BaseAgentOutput;
  } {
    try {
      const result = BaseAgentOutputSchema.parse(output);
      return {
        valid: true,
        errors: [],
        sanitized: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      
      return {
        valid: false,
        errors: [`Unknown validation error for ${agentType}: ${error}`]
      };
    }
  }

  /**
   * Создание fallback данных для контента
   */
  static createFallbackContentData(topic: string, language: 'ru' | 'en' = 'ru'): any {
    const templates = {
      ru: {
        subject: `Специальное предложение: ${topic}`,
        preheader: 'Не упустите выгодную возможность!',
        body: `Откройте для себя ${topic}. Мы подготовили для вас особенное предложение с отличными условиями.`,
        cta: 'Узнать подробнее'
      },
      en: {
        subject: `Special Offer: ${topic}`,
        preheader: 'Don\'t miss this great opportunity!',
        body: `Discover ${topic}. We have prepared a special offer with excellent conditions for you.`,
        cta: 'Learn More'
      }
    };

    return {
      complete_content: templates[language]
    };
  }
}

// Константы для агентов
export const AGENT_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 2,
  MIN_CONFIDENCE_SCORE: 70,
  DEFAULT_TEMPERATURE: 0.8,
  MAX_TOKENS: 10000
} as const; 