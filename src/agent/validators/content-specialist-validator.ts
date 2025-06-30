/**
 * 🔍 CONTENT SPECIALIST VALIDATOR
 * 
 * Валидатор для выходных данных ContentSpecialistAgent
 * Обеспечивает корректность структуры данных для передачи другим агентам
 */

import { z } from 'zod';
import { BaseAgentOutputSchema, AgentResponseUtils, AgentErrorCodes, AgentError } from '../types/base-agent-types';

// Схема для контекстных данных
export const ContextDataSchema = z.object({
  seasonal_context: z.object({
    current_season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
    holidays: z.array(z.string()).optional(),
    seasonal_trends: z.array(z.string()).optional()
  }).optional(),
  cultural_context: z.object({
    regional_preferences: z.record(z.any()).optional(),
    cultural_events: z.array(z.string()).optional(),
    demographic_insights: z.record(z.any()).optional()
  }).optional(),
  marketing_context: z.object({
    travel_trends: z.array(z.string()).optional(),
    pricing_trends: z.record(z.any()).optional(),
    urgency_factors: z.array(z.string()).optional()
  }).optional(),
  travel_context: z.object({
    seasonal_demand: z.record(z.any()).optional(),
    destination_trends: z.array(z.string()).optional(),
    booking_patterns: z.record(z.any()).optional()
  }).optional()
});

// Схема для ценовых данных
export const PricingDataSchema = z.object({
  prices: z.array(z.object({
    price: z.number(),
    currency: z.string(),
    date: z.string().optional(),
    airline: z.string().optional()
  })).optional(),
  statistics: z.object({
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    avg_price: z.number().optional(),
    median_price: z.number().optional()
  }).optional(),
  pricing_insights: z.object({
    price_trend: z.enum(['increasing', 'decreasing', 'stable']).optional(),
    urgency_level: z.enum(['low', 'medium', 'high']).optional(),
    best_booking_time: z.string().optional()
  }).optional(),
  marketing_copy: z.object({
    urgency_message: z.string().optional(),
    price_highlight: z.string().optional(),
    value_proposition: z.string().optional()
  }).optional()
});

// Схема для контентных данных
export const ContentDataSchema = z.object({
  complete_content: z.object({
    subject: z.string().min(1, 'Subject is required'),
    preheader: z.string().min(1, 'Preheader is required'),
    body: z.string().min(1, 'Body content is required'),
    cta: z.string().min(1, 'CTA text is required'),
    language: z.enum(['ru', 'en']),
    tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family'])
  }),
  content_metadata: z.object({
    content_type: z.string(),
    generation_confidence: z.number().min(0).max(100).optional(),
    optimization_score: z.number().min(0).max(100).optional(),
    complexity: z.number().min(0).max(100).optional(),
    word_count: z.number().optional(),
    reading_time: z.number().optional()
  }).optional(),
  variants: z.array(z.object({
    type: z.string(),
    content: z.record(z.string())
  })).optional()
});

// Схема для данных кампании
export const CampaignDataSchema = z.object({
  campaign_id: z.string(),
  folder_path: z.string(),
  status: z.enum(['initialized', 'in_progress', 'completed', 'failed']),
  created_at: z.string().optional(),
  performance_metrics: z.record(z.any()).optional()
});

// Схема для handoff данных
export const HandoffDataSchema = z.object({
  content_package: z.object({
    content: ContentDataSchema.shape.complete_content
  }).optional(),
  context_intelligence: z.any().optional(),
  pricing_intelligence: z.any().optional(),
  campaign_info: z.any().optional(),
  design_requirements: z.object({
    tone: z.string(),
    style: z.string(),
    color_scheme: z.string(),
    imagery_focus: z.string(),
    layout_priority: z.string(),
    template_type: z.string().optional(),
    visual_hierarchy: z.string().optional(),
    responsive_breakpoints: z.array(z.string()).optional(),
    accessibility_requirements: z.object({
      contrast_ratio: z.string(),
      font_size_min: z.string(),
      alt_text_required: z.boolean()
    }).optional()
  }),
  brand_guidelines: z.object({
    brand_voice: z.string(),
    visual_style: z.string(),
    color_palette: z.array(z.string()),
    typography: z.string(),
    brand_name: z.string().optional(),
    logo_requirements: z.object({
      position: z.string(),
      size: z.string(),
      variant: z.string()
    }).optional(),
    tone_guidelines: z.object({
      primary_tone: z.string(),
      voice_attributes: z.array(z.string()),
      language: z.enum(['ru', 'en'])
    }).optional(),
    visual_guidelines: z.object({
      imagery_style: z.string(),
      icon_style: z.string(),
      button_style: z.string()
    }).optional()
  }),
  content_metadata: z.any().optional(),
  pricing_context: z.any().optional(),
  market_insights: z.object({
    trend: z.string(),
    urgency: z.string(),
    opportunities: z.array(z.string())
  }).optional(),
  content_suggestions: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional()
});

// Основная схема для ContentSpecialistOutput
export const ContentSpecialistOutputSchema = BaseAgentOutputSchema.extend({
  task_type: z.enum(['analyze_context', 'get_pricing', 'generate_content', 'manage_campaign']),
  results: z.object({
    context_data: z.any().optional(),
    pricing_data: z.any().optional(),
    content_data: z.any().optional(),
    campaign_data: z.any().optional()
  }),
  recommendations: z.object({
    next_agent: z.enum(['design_specialist', 'quality_specialist', 'delivery_specialist']).optional(),
    next_actions: z.array(z.string()).optional(),
    handoff_data: HandoffDataSchema.optional()
  })
});

export type ValidatedContentSpecialistOutput = z.infer<typeof ContentSpecialistOutputSchema>;

export class ContentSpecialistValidator {
  /**
   * Валидация выходных данных ContentSpecialistAgent с повторными запросами
   */
  static async validateOutputWithRetry(
    output: any,
    originalInput?: any,
    retryCallback?: (prompt: string, attempt: number) => Promise<any>
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    sanitized?: ValidatedContentSpecialistOutput;
    handoff_ready: boolean;
    attempts: number;
    final_attempt: boolean;
  }> {
    const maxAttempts = 3;
    let currentAttempt = 1;
    let lastResult = this.validateOutput(output);

    // Если валидация прошла успешно с первого раза
    if (lastResult.valid) {
      return {
        ...lastResult,
        attempts: 1,
        final_attempt: false
      };
    }

    // Если есть callback для повторных запросов
    if (retryCallback && originalInput) {
      while (currentAttempt <= maxAttempts && !lastResult.valid) {
        const retryPrompt = this.generateRetryPrompt(lastResult.errors, originalInput, currentAttempt);
        
        console.log(`🔄 Attempt ${currentAttempt}/${maxAttempts}: Retrying with improved prompt`);
        console.log(`📝 Retry prompt: ${retryPrompt}`);

        try {
          const retryOutput = await retryCallback(retryPrompt, currentAttempt);
          lastResult = this.validateOutput(retryOutput);
          currentAttempt++;

          if (lastResult.valid) {
            console.log(`✅ Validation successful on attempt ${currentAttempt - 1}`);
            break;
          }
        } catch (error) {
          console.error(`❌ Retry attempt ${currentAttempt} failed:`, error);
          currentAttempt++;
        }
      }
    }

    return {
      ...lastResult,
      attempts: currentAttempt - 1,
      final_attempt: currentAttempt > maxAttempts
    };
  }

  /**
   * Генерация промпта для повторного запроса на основе ошибок валидации
   */
  private static generateRetryPrompt(errors: string[], originalInput: any, attempt: number): string {
    const errorSummary = errors.join('; ');
    
    const basePrompt = `VALIDATION FAILED - RETRY ATTEMPT ${attempt}/3

PREVIOUS ERRORS: ${errorSummary}

REQUIRED OUTPUT STRUCTURE:
You must return a valid ContentSpecialistOutput with the following structure:

{
  "success": true,
  "task_type": "${originalInput.task_type || 'generate_content'}",
  "results": {
    "content_data": {
      "complete_content": {
        "subject": "string (required, min 1 char)",
        "preheader": "string (required, min 1 char)", 
        "body": "string (required, min 1 char)",
        "cta": "string (required, min 1 char)",
        "language": "ru" | "en",
        "tone": "professional" | "friendly" | "urgent" | "casual" | "luxury" | "family"
      }
    }
  },
  "recommendations": {
    "next_agent": "design_specialist",
    "next_actions": ["array", "of", "strings"],
    "handoff_data": {
      "content_package": {
        "content": {
          "subject": "same as above",
          "preheader": "same as above",
          "body": "same as above", 
          "cta": "same as above",
          "language": "same as above",
          "tone": "same as above"
        }
      },
      "design_requirements": {
        "tone": "string",
        "style": "string",
        "color_scheme": "string",
        "imagery_focus": "string",
        "layout_priority": "string"
      },
      "brand_guidelines": {
        "brand_voice": "string",
        "visual_style": "string", 
        "color_palette": ["array", "of", "colors"],
        "typography": "string"
      }
    }
  },
  "analytics": {
    "execution_time": number,
    "operations_performed": number,
    "confidence_score": number,
    "agent_efficiency": number
  }
}

CRITICAL REQUIREMENTS:
1. ALL string fields marked as required must be non-empty
2. handoff_data MUST include both design_requirements and brand_guidelines
3. content_package.content MUST match results.content_data.complete_content
4. Return valid JSON only, no additional text or explanations

ORIGINAL INPUT: ${JSON.stringify(originalInput, null, 2)}

Generate the corrected output now:`;

    return basePrompt;
  }

  /**
   * Валидация выходных данных ContentSpecialistAgent
   */
  static validateOutput(output: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    sanitized?: ValidatedContentSpecialistOutput;
    handoff_ready: boolean;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Базовая валидация структуры
    try {
      const sanitized = ContentSpecialistOutputSchema.parse(output);
      
      // Дополнительная валидация в зависимости от типа задачи
      const taskSpecificValidation = this.validateTaskSpecificData(sanitized);
      
      // Валидация handoff данных
      const handoffValidation = this.validateHandoffData(sanitized);
      
      return {
        valid: taskSpecificValidation.valid && handoffValidation.valid,
        errors: [...errors, ...taskSpecificValidation.errors, ...handoffValidation.errors],
        warnings: [...warnings, ...taskSpecificValidation.warnings, ...handoffValidation.warnings],
        sanitized,
        handoff_ready: handoffValidation.ready
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings,
          handoff_ready: false
        };
      }
      
      return {
        valid: false,
        errors: [`Unknown validation error: ${error}`],
        warnings,
        handoff_ready: false
      };
    }
  }

  /**
   * Валидация данных специфичных для типа задачи
   */
  private static validateTaskSpecificData(output: ValidatedContentSpecialistOutput): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (output.task_type) {
      case 'analyze_context':
        if (!output.results.context_data) {
          errors.push('Context data is required for analyze_context task');
        }
        break;

      case 'get_pricing':
        if (!output.results.pricing_data) {
          errors.push('Pricing data is required for get_pricing task');
        }
        break;

      case 'generate_content':
        if (!output.results.content_data) {
          errors.push('Content data is required for generate_content task');
        } else {
          const contentValidation = this.validateContentData(output.results.content_data);
          errors.push(...contentValidation.errors);
          warnings.push(...contentValidation.warnings);
        }
        break;

      case 'manage_campaign':
        if (!output.results.campaign_data) {
          errors.push('Campaign data is required for manage_campaign task');
        }
        break;
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Валидация контентных данных
   */
  private static validateContentData(contentData: any): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверяем наличие основных элементов контента
    if (!contentData) {
      errors.push('Content data is null or undefined');
      return { errors, warnings };
    }

    // Извлекаем данные из различных возможных структур
    const extractedData = AgentResponseUtils.extractDataFromOpenAIResponse(contentData);
    
    if (!extractedData) {
      errors.push('Failed to extract content data from response');
      return { errors, warnings };
    }

    // Проверяем complete_content или отдельные поля
    const content = extractedData.complete_content || extractedData;
    
    if (!content.subject || typeof content.subject !== 'string') {
      errors.push('Subject is required and must be a string');
    } else if (content.subject.length < 5) {
      warnings.push('Subject is very short (less than 5 characters)');
    } else if (content.subject.length > 100) {
      warnings.push('Subject is very long (more than 100 characters)');
    }

    if (!content.preheader || typeof content.preheader !== 'string') {
      errors.push('Preheader is required and must be a string');
    }

    if (!content.body || typeof content.body !== 'string') {
      errors.push('Body content is required and must be a string');
    } else if (content.body.length < 50) {
      warnings.push('Body content is very short (less than 50 characters)');
    }

    if (!content.cta || typeof content.cta !== 'string') {
      errors.push('CTA text is required and must be a string');
    }

    return { errors, warnings };
  }

  /**
   * Валидация handoff данных для передачи следующему агенту
   */
  private static validateHandoffData(output: ValidatedContentSpecialistOutput): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    ready: boolean;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const handoffData = output.recommendations.handoff_data;
    
    if (!handoffData) {
      errors.push('Handoff data is required for agent communication');
      return { valid: false, errors, warnings, ready: false };
    }

    // Проверяем обязательные компоненты для handoff
    if (!handoffData.design_requirements) {
      errors.push('Design requirements are required in handoff data');
    }

    if (!handoffData.brand_guidelines) {
      errors.push('Brand guidelines are required in handoff data');
    }

    // Для generate_content задач требуется content_package
    if (output.task_type === 'generate_content' && !handoffData.content_package) {
      errors.push('Content package is required in handoff data for generate_content task');
    }

    // Проверяем качество данных
    if (output.analytics.confidence_score < 70) {
      warnings.push('Low confidence score may affect handoff quality');
    }

    const ready = errors.length === 0 && !!handoffData.design_requirements && !!handoffData.brand_guidelines;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      ready
    };
  }

  /**
   * Создание отчета о валидации
   */
  static createValidationReport(validationResult: ReturnType<typeof ContentSpecialistValidator.validateOutput>): string {
    const report = [`🔍 Content Specialist Validation Report`];
    
    report.push(`Status: ${validationResult.valid ? '✅ VALID' : '❌ INVALID'}`);
    report.push(`Handoff Ready: ${validationResult.handoff_ready ? '✅ YES' : '❌ NO'}`);
    
    if (validationResult.errors.length > 0) {
      report.push(`\n❌ Errors (${validationResult.errors.length}):`);
      validationResult.errors.forEach((error, index) => {
        report.push(`  ${index + 1}. ${error}`);
      });
    }
    
    if (validationResult.warnings.length > 0) {
      report.push(`\n⚠️ Warnings (${validationResult.warnings.length}):`);
      validationResult.warnings.forEach((warning, index) => {
        report.push(`  ${index + 1}. ${warning}`);
      });
    }
    
    if (validationResult.valid) {
      report.push(`\n✅ Validation passed successfully`);
      if (validationResult.sanitized) {
        report.push(`Task Type: ${validationResult.sanitized.task_type}`);
        report.push(`Confidence Score: ${validationResult.sanitized.analytics.confidence_score}%`);
        report.push(`Execution Time: ${validationResult.sanitized.analytics.execution_time}ms`);
      }
    }
    
    return report.join('\n');
  }

  /**
   * Извлечение готовых данных для handoff
   */
  static extractHandoffData(output: ValidatedContentSpecialistOutput): any {
    if (!output.recommendations.handoff_data) {
      throw new AgentError(
        AgentErrorCodes.HANDOFF_FAILED,
        'No handoff data available',
        'content_specialist'
      );
    }

    return {
      agent_type: 'content_specialist',
      task_completed: output.task_type,
      success: output.success,
      confidence_score: output.analytics.confidence_score,
      handoff_data: output.recommendations.handoff_data,
      next_agent: output.recommendations.next_agent,
      next_actions: output.recommendations.next_actions,
      timestamp: new Date().toISOString()
    };
  }
} 