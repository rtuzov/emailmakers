/**
 * Handoff Management Tools
 * 
 * Provides tools for creating handoff files and transferring
 * campaign context between specialists in the workflow.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
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
// Import universal handoff auto-enrichment utilities
import { enrichHandoffData } from '../../../core/handoff-auto-enrichment';

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
      
      // 🎯 UNIVERSAL AUTO-ENRICHMENT: Use new universal handoff enrichment system
      console.log('📂 Auto-enriching content handoff data using universal enrichment system...');
      
      const { enrichedData: enrichedContentData, enrichedDeliverables, autoTraceId } = await enrichHandoffData(
        params.contentContext,
        params.fromSpecialist,
        params.campaignPath,
        params.trace_id ?? undefined
      );
      
      // Merge provided deliverables with auto-generated ones, respecting the complex structure
      const finalDeliverables = {
        ...enrichedDeliverables,
        ...params.deliverables,
        created_files: params.deliverables?.created_files?.length > 0 
          ? params.deliverables.created_files 
          : enrichedDeliverables.created_files?.map((file: string) => ({
              file_name: file.split('/').pop() || file,
              file_path: file,
              file_type: 'content' as const,
              description: `Auto-generated content file: ${file}`,
              is_primary: false
            })) || []
      };
      
      // Create actual handoff file (not just prepare for SDK)
      const handoffId = `handoff_${params.campaignId}_${params.fromSpecialist}_to_${params.toSpecialist}`;
      const handoffFilePath = path.join(params.campaignPath, 'handoffs', `${handoffId}.json`);
      
      const handoffData = {
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        campaign_id: params.campaignId,
        campaign_path: params.campaignPath,
        specialist_data: enrichedContentData,
        handoff_context: params.handoff_context,
        deliverables: finalDeliverables,
        quality_metadata: params.quality_metadata,
        trace_id: autoTraceId,
        validate_context: params.validate_context,
        created_at: new Date().toISOString()
      };
      
      // Ensure handoffs directory exists
      const handoffsDir = path.join(params.campaignPath, 'handoffs');
      await fs.mkdir(handoffsDir, { recursive: true });
      
      // Write handoff file
      await fs.writeFile(handoffFilePath, JSON.stringify(handoffData, null, 2), 'utf-8');
      
      console.log('✅ Content handoff file created with enriched data:', handoffFilePath);
      
      // Update campaign context with handoff info
      const contextHandoffId = `handoff_${Date.now()}_${params.fromSpecialist}_to_${params.toSpecialist}`;
      const updatedCampaignContext = {
        ...campaignContext,
        latest_handoff: {
          handoff_id: contextHandoffId,
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
        handoff_id: contextHandoffId,
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
        handoffId: contextHandoffId,
        sdk_handled: true
      }, duration, true);
      
      return `Стандартизированный файл передачи подготовлен для OpenAI SDK! Handoff ID: ${contextHandoffId}. От ${params.fromSpecialist} к ${params.toSpecialist}. Кампания: ${params.campaignId}. Валидация контекста: ${params.validate_context ? 'включена' : 'отключена'}. SDK автоматически обработает передачу следующему специалисту.`;
      
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