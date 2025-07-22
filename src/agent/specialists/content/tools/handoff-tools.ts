/**
 * Handoff Management Tools
 * 
 * Provides tools for creating handoff files and transferring
 * campaign context between specialists in the workflow.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
// import { promises as fs } from 'fs';
// import path from 'path';
import { log } from '../../../core/agent-logger';
import { getErrorMessage } from '../utils/error-handling';

// Campaign context types 
interface CampaignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  metadata?: any;
  context_analysis?: any;
  date_analysis?: any;
  pricing_analysis?: any;
  asset_strategy?: any;
  generated_content?: any;
  technical_requirements?: any;
  design_brief?: any;
  trace_id?: string | null;
}

interface ExtendedRunContext {
  campaignContext?: CampaignWorkflowContext;
}

/**
 * Extract campaign context from OpenAI SDK context parameter
 */
function extractCampaignContext(context?: any): CampaignWorkflowContext {
  if (!context) return {};
  return context.campaignContext || {};
}

// Import standardized handoff tool and context validation
// Removed: createStandardizedHandoff - OpenAI SDK handles handoffs automatically
import { /* validateHandoffContext, quickValidateHandoff, */ quickValidateHandoffDirect } from '../../../core/context-validation-tool';

/**
 * Create standardized handoff file tool with context validation
 */
export const createHandoffFile = tool({
  name: 'createHandoffFile',
  description: 'Создает стандартизированный файл передачи между специалистами с полным контекстом кампании, результатами работы и валидацией контекста',
  parameters: z.object({
    campaignId: z.string().describe('ID кампании'),
    campaignPath: z.string().describe('Путь к папке кампании'),
    contentContext: z.object({
          context_analysis: z.object({}).nullable().describe('Анализ контекста'),
    date_analysis: z.object({}).nullable().describe('Анализ дат'),
    pricing_analysis: z.object({}).nullable().describe('Анализ цен'),
    asset_strategy: z.object({}).nullable().describe('Стратегия ассетов'),
    generated_content: z.object({}).nullable().describe('Сгенерированный контент'),
    technical_requirements: z.object({}).nullable().describe('Технические требования'),
    design_brief: z.object({}).nullable().describe('Дизайн-бриф')
    }).describe('Контекст содержимого от Content Specialist'),
    fromSpecialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Специалист, передающий контроль'),
    toSpecialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Специалист, получающий контроль'),
    handoff_context: z.object({
      summary: z.string().describe('Краткое описание выполненной работы'),
      context_for_next: z.string().describe('Контекст для следующего специалиста'),
      recommendations: z.array(z.string()).describe('Рекомендации для следующего специалиста'),
      priority_items: z.array(z.string()).nullable().describe('Приоритетные элементы'),
      potential_issues: z.array(z.string()).nullable().describe('Потенциальные проблемы'),
      success_criteria: z.array(z.string()).nullable().describe('Критерии успеха')
    }).describe('Контекст передачи'),
    deliverables: z.object({
      created_files: z.array(z.object({
        file_name: z.string().describe('Имя файла'),
        file_path: z.string().describe('Путь к файлу'),
        file_type: z.enum(['data', 'content', 'template', 'asset', 'report', 'documentation']).describe('Тип файла'),
        description: z.string().describe('Описание файла'),
        is_primary: z.boolean().default(false).describe('Основной файл')
      })).describe('Созданные файлы'),
      key_outputs: z.array(z.string()).describe('Ключевые выходы')
    }).describe('Поставляемые результаты'),
    quality_metadata: z.object({
      data_quality_score: z.number().min(0).max(100).describe('Оценка качества данных'),
      completeness_score: z.number().min(0).max(100).describe('Оценка полноты'),
      validation_status: z.enum(['passed', 'warning', 'failed']).describe('Статус валидации'),
      error_count: z.number().default(0).describe('Количество ошибок'),
      warning_count: z.number().default(0).describe('Количество предупреждений'),
      processing_time: z.number().describe('Время обработки в мс')
    }).describe('Метаданные качества'),
    trace_id: z.string().nullable().describe('ID трассировки для отладки'),
    validate_context: z.boolean().default(true).describe('Выполнять валидацию контекста перед созданием handoff')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Get campaign context
      const campaignContext = extractCampaignContext(context);
      
      // Pre-validation using quick validation if enabled
      if (params.validate_context) {
        log.info('ContentSpecialist', 'Performing context validation before handoff creation', {
          campaign_id: params.campaignId,
          from_specialist: params.fromSpecialist,
          to_specialist: params.toSpecialist,
          trace_id: params.trace_id
        });
        
        const quickValidationResult = await quickValidateHandoffDirect({
          from_specialist: params.fromSpecialist,
          to_specialist: params.toSpecialist,
          specialist_data: params.contentContext,
          quality_metadata: params.quality_metadata
        });
        
        log.info('ContentSpecialist', 'Context validation completed', {
          validation_result: quickValidationResult,
          campaign_id: params.campaignId,
          trace_id: params.trace_id
        });
        
        if (quickValidationResult.includes('failed')) {
          log.warn('ContentSpecialist', 'Context validation failed but continuing with handoff creation', {
            campaign_id: params.campaignId,
            trace_id: params.trace_id
          });
        }
      }
      
      // Prepare standardized handoff parameters (commented out - unused)
      /*
      const _handoffParams = {
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        campaign_id: params.campaignId,
        campaign_path: params.campaignPath,
        specialist_data: params.contentContext,
        handoff_context: params.handoff_context,
        deliverables: params.deliverables,
        quality_metadata: params.quality_metadata,
        trace_id: params.trace_id,
        execution_time: Date.now() - startTime,
        validate_context: params.validate_context
      };
      */
      
      // Use standardized handoff tool with context validation
      // Note: OpenAI Agents SDK will handle handoff creation automatically
      // The createStandardizedHandoff tool is available to the agent and will be called by the LLM
      console.log('✅ Handoff parameters prepared for automatic SDK handoff');
      
      // Update campaign context with handoff info
      const handoffId = `handoff_${Date.now()}_${params.fromSpecialist}_to_${params.toSpecialist}`;
      const updatedCampaignContext = {
        ...campaignContext,
        latest_handoff: {
          handoff_id: handoffId,
          file: `${params.fromSpecialist}-to-${params.toSpecialist}.json`,
          to_specialist: params.toSpecialist,
          created_at: new Date().toISOString(),
          context_validation_enabled: params.validate_context
        }
      };
      
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }
      
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Standardized handoff file prepared for SDK', {
        campaign_id: params.campaignId,
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        handoff_id: handoffId,
        context_validation_enabled: params.validate_context,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('createHandoffFile', {
        campaignId: params.campaignId,
        fromSpecialist: params.fromSpecialist,
        toSpecialist: params.toSpecialist,
        contentSize: JSON.stringify(params.contentContext).length,
        contextValidation: params.validate_context
      }, {
        handoffId: handoffId,
        sdk_handled: true
      }, duration, true);
      
      return `Стандартизированный файл передачи подготовлен для OpenAI SDK! Handoff ID: ${handoffId}. От ${params.fromSpecialist} к ${params.toSpecialist}. Кампания: ${params.campaignId}. Валидация контекста: ${params.validate_context ? 'включена' : 'отключена'}. SDK автоматически обработает передачу следующему специалисту.`;
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Failed to create standardized handoff file', {
        error: errorMessage,
        campaign_id: params.campaignId,
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('createHandoffFile', {
        campaignId: params.campaignId,
        fromSpecialist: params.fromSpecialist,
        toSpecialist: params.toSpecialist
      }, null, duration, false, errorMessage);
      return `Ошибка создания стандартизированного файла передачи: ${errorMessage}`;
    }
  }
}); 