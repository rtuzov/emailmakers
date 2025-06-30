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
        sanitized: result as BaseAgentOutput
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

/**
 * 🔄 HANDOFF DATA INTERFACES
 * 
 * Специализированные интерфейсы для передачи данных между агентами
 * Обеспечивают строгую типизацию и валидацию handoff операций
 */

// Handoff от ContentSpecialist к DesignSpecialist
export interface ContentToDesignHandoffData {
  content_package: {
    complete_content: {
      subject: string;
      preheader: string;
      body: string;
      cta: string;
    };
    content_metadata: {
      language: 'ru' | 'en';
      tone: string;
      word_count: number;
      reading_time: number;
    };
    brand_guidelines: {
      voice_tone: string;
      key_messages: string[];
      compliance_notes?: string[];
    };
  };
  design_requirements: {
    template_type: 'promotional' | 'informational' | 'newsletter' | 'transactional';
    visual_priority: 'text-heavy' | 'image-heavy' | 'balanced';
    layout_preferences: string[];
    color_scheme?: string;
  };
  campaign_context: {
    topic: string;
    target_audience: string;
    destination?: string;
    origin?: string;
    urgency_level: 'low' | 'medium' | 'high' | 'critical';
  };
  trace_id: string;
  timestamp: string;
}

// Handoff от DesignSpecialist к QualitySpecialist
export interface DesignToQualityHandoffData {
  email_package: {
    html_content: string;
    mjml_source: string;
    inline_css: string;
    asset_urls: string[];
  };
  rendering_metadata: {
    template_type: string;
    file_size_bytes: number;
    render_time_ms: number;
    optimization_applied: string[];
  };
  design_artifacts: {
    performance_metrics: {
      css_rules_count: number;
      images_count: number;
      total_size_kb: number;
    };
    accessibility_features: string[];
    responsive_breakpoints: string[];
    dark_mode_support: boolean;
  };
  original_content: ContentToDesignHandoffData['content_package'];
  trace_id: string;
  timestamp: string;
}

// Handoff от QualitySpecialist к DeliverySpecialist
export interface QualityToDeliveryHandoffData {
  quality_package: {
    validated_html: string;
    quality_score: number; // Обязательно ≥ 70
    validation_status: 'passed' | 'passed_with_warnings' | 'failed';
    optimized_assets: string[];
  };
  test_results: {
    html_validation: {
      w3c_compliant: boolean;
      errors: string[];
      warnings: string[];
    };
    css_validation: {
      valid: boolean;
      issues: string[];
    };
    email_client_compatibility: {
      gmail: boolean;
      outlook: boolean;
      apple_mail: boolean;
      yahoo_mail: boolean;
      compatibility_score: number;
    };
  };
  accessibility_report: {
    wcag_aa_compliant: boolean;
    issues: string[];
    score: number;
  };
  performance_analysis: {
    load_time_score: number;
    file_size_score: number;
    optimization_score: number;
  };
  spam_analysis: {
    spam_score: number;
    risk_factors: string[];
    recommendations: string[];
  };
  original_content: ContentToDesignHandoffData['content_package'];
  trace_id: string;
  timestamp: string;
}

// Union тип для всех handoff данных
export type HandoffDataUnion = 
  | ContentToDesignHandoffData 
  | DesignToQualityHandoffData 
  | QualityToDeliveryHandoffData;

// Результат валидации handoff данных
export interface HandoffValidationResult {
  isValid: boolean;
  errors: HandoffValidationError[];
  warnings: string[];
  correctionSuggestions: CorrectionSuggestion[];
  validatedData?: HandoffDataUnion;
  validationDuration: number;
}

// Детальная ошибка валидации
export interface HandoffValidationError {
  field: string;
  errorType: 'missing' | 'invalid_type' | 'invalid_value' | 'size_limit' | 'format_error';
  message: string;
  currentValue?: any;
  expectedValue?: any;
  severity: 'critical' | 'major' | 'minor';
}

// Предложение по исправлению
export interface CorrectionSuggestion {
  field: string;
  issue: string;
  suggestion: string;
  correctionPrompt: string; // Prompt для AI коррекции
  priority: 'high' | 'medium' | 'low';
}

/**
 * 📋 ZOD SCHEMAS FOR HANDOFF VALIDATION
 * 
 * Строгие схемы валидации для всех handoff интерфейсов
 */

// ContentToDesignHandoffData schema
export const ContentToDesignHandoffDataSchema = z.object({
  content_package: z.object({
    complete_content: z.object({
      subject: z.string().min(1, "Subject обязателен").max(100, "Subject слишком длинный"),
      preheader: z.string().min(1, "Preheader обязателен").max(150, "Preheader слишком длинный"),
      body: z.string().min(10, "Body слишком короткий").max(5000, "Body слишком длинный"),
      cta: z.string().min(1, "CTA обязателен").max(50, "CTA слишком длинный")
    }),
    content_metadata: z.object({
      language: z.enum(['ru', 'en']),
      tone: z.string().min(1),
      word_count: z.number().positive(),
      reading_time: z.number().positive()
    }),
    brand_guidelines: z.object({
      voice_tone: z.string().min(1),
      key_messages: z.array(z.string()).min(1),
      compliance_notes: z.array(z.string()).optional()
    })
  }),
  design_requirements: z.object({
    template_type: z.enum(['promotional', 'informational', 'newsletter', 'transactional']),
    visual_priority: z.enum(['text-heavy', 'image-heavy', 'balanced']),
    layout_preferences: z.array(z.string()),
    color_scheme: z.string().optional()
  }),
  campaign_context: z.object({
    topic: z.string().min(1),
    target_audience: z.string().min(1),
    destination: z.string().optional(),
    origin: z.string().optional(),
    urgency_level: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  trace_id: z.string().uuid(),
  timestamp: z.string().datetime()
});

// DesignToQualityHandoffData schema
export const DesignToQualityHandoffDataSchema = z.object({
  email_package: z.object({
    html_content: z.string().min(100, "HTML контент слишком короткий"),
    mjml_source: z.string().min(50, "MJML source обязателен"),
    inline_css: z.string(),
    asset_urls: z.array(z.string().url())
  }),
  rendering_metadata: z.object({
    template_type: z.string().min(1),
    file_size_bytes: z.number().positive().max(102400, "Файл превышает лимит 100KB"), // 100KB строгий лимит
    render_time_ms: z.number().positive().max(1000, "Время рендеринга превышает 1 сек"),
    optimization_applied: z.array(z.string())
  }),
  design_artifacts: z.object({
    performance_metrics: z.object({
      css_rules_count: z.number().nonnegative(),
      images_count: z.number().nonnegative(),
      total_size_kb: z.number().positive().max(100, "Общий размер превышает 100KB")
    }),
    accessibility_features: z.array(z.string()),
    responsive_breakpoints: z.array(z.string()),
    dark_mode_support: z.boolean()
  }),
  original_content: ContentToDesignHandoffDataSchema.shape.content_package,
  trace_id: z.string().uuid(),
  timestamp: z.string().datetime()
});

// QualityToDeliveryHandoffData schema
export const QualityToDeliveryHandoffDataSchema = z.object({
  quality_package: z.object({
    validated_html: z.string().min(100),
    quality_score: z.number().min(70, "Quality score должен быть ≥ 70"), // Жесткое требование
    validation_status: z.enum(['passed', 'passed_with_warnings', 'failed']),
    optimized_assets: z.array(z.string().url())
  }),
  test_results: z.object({
    html_validation: z.object({
      w3c_compliant: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string())
    }),
    css_validation: z.object({
      valid: z.boolean(),
      issues: z.array(z.string())
    }),
    email_client_compatibility: z.object({
      gmail: z.boolean(),
      outlook: z.boolean(),
      apple_mail: z.boolean(),
      yahoo_mail: z.boolean(),
      compatibility_score: z.number().min(95, "Совместимость должна быть ≥ 95%") // Жесткое требование
    })
  }),
  accessibility_report: z.object({
    wcag_aa_compliant: z.boolean(),
    issues: z.array(z.string()),
    score: z.number().min(80, "Accessibility score должен быть ≥ 80") // WCAG AA требование
  }),
  performance_analysis: z.object({
    load_time_score: z.number().min(70),
    file_size_score: z.number().min(70),
    optimization_score: z.number().min(70)
  }),
  spam_analysis: z.object({
    spam_score: z.number().max(3, "Spam score должен быть ≤ 3"), // Низкий spam score
    risk_factors: z.array(z.string()),
    recommendations: z.array(z.string())
  }),
  original_content: ContentToDesignHandoffDataSchema.shape.content_package,
  trace_id: z.string().uuid(),
  timestamp: z.string().datetime()
});

// Union schema для валидации любого handoff типа
export const HandoffDataUnionSchema = z.union([
  ContentToDesignHandoffDataSchema,
  DesignToQualityHandoffDataSchema, 
  QualityToDeliveryHandoffDataSchema
]);

// Константы для агентов
export const AGENT_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 2,
  MIN_CONFIDENCE_SCORE: 70,
  DEFAULT_TEMPERATURE: 0.8,
  MAX_TOKENS: 10000,
  // Новые константы для handoff валидации
  HANDOFF_VALIDATION: {
    MAX_FILE_SIZE_KB: 100,
    MAX_HTML_SIZE_KB: 100, // Alias for backward compatibility
    MAX_PACKAGE_SIZE_KB: 600,
    MIN_QUALITY_SCORE: 70,
    MIN_COMPATIBILITY_SCORE: 95,
    MIN_CLIENT_COMPATIBILITY: 95, // Alias for backward compatibility
    MIN_ACCESSIBILITY_SCORE: 80,
    MAX_SPAM_SCORE: 3,
    MAX_VALIDATION_TIME_MS: 1000,
    MAX_AI_CORRECTION_ATTEMPTS: 3
  }
} as const; 