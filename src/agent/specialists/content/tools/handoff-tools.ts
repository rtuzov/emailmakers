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

/**
 * Create handoff file tool
 */
export const createHandoffFile = tool({
  name: 'createHandoffFile',
  description: 'Создает файл передачи между специалистами с полным контекстом кампании и результатами работы',
  parameters: z.object({
    campaignId: z.string().describe('ID кампании'),
    campaignPath: z.string().describe('Путь к папке кампании'),
    contentContext: z.object({
      generated_content: z.nullable(z.object({
        subject: z.nullable(z.string()),
        preheader: z.nullable(z.string()),
        headline: z.nullable(z.string()),
        body_sections: z.nullable(z.array(z.string())),
        cta_text: z.nullable(z.string()),
        footer_text: z.nullable(z.string()),
        pricing: z.nullable(z.object({
          base_price: z.nullable(z.number()),
          currency: z.nullable(z.string()),
          discount_info: z.nullable(z.string())
        }))
      })),
      asset_requirements: z.nullable(z.object({
        primary_images: z.nullable(z.array(z.string())),
        background_style: z.nullable(z.string()),
        color_scheme: z.nullable(z.array(z.string())),
        visual_hierarchy: z.nullable(z.array(z.string()))
      })),
      campaign_brief: z.nullable(z.object({
        destination: z.nullable(z.string()),
        target_audience: z.nullable(z.string()),
        key_messages: z.nullable(z.array(z.string())),
        tone: z.nullable(z.string())
      })),
      technical_specs: z.nullable(z.object({
        template_type: z.nullable(z.string()),
        responsive_design: z.nullable(z.boolean()),
        email_client_support: z.nullable(z.array(z.string())),
        file_size_limit: z.nullable(z.string())
      }))
    }).describe('Контекст содержимого от Content Specialist'),
    fromSpecialist: z.string().describe('Специалист, передающий контроль'),
    toSpecialist: z.string().describe('Специалист, получающий контроль'),
    trace_id: z.string().optional().describe('ID трассировки для отладки')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Get campaign context
      const campaignContext = extractCampaignContext(context);
      
      // Load existing analysis data from files
      const loadAnalysisFromFiles = async (dataType: string) => {
        try {
          const analysisPath = path.join(params.campaignPath, 'content', `${dataType}.json`);
          const data = await fs.readFile(analysisPath, 'utf-8');
          return JSON.parse(data);
        } catch {
          return null;
        }
      };
      
      // Load all analysis data
      const [contextAnalysis, dateAnalysis, pricingAnalysis, assetStrategy] = await Promise.all([
        loadAnalysisFromFiles('context-analysis'),
        loadAnalysisFromFiles('date-analysis'), 
        loadAnalysisFromFiles('pricing-analysis'),
        loadAnalysisFromFiles('asset-strategy')
      ]);
      
      // Create comprehensive handoff data
      const handoffData = {
        handoff_info: {
          campaign_id: params.campaignId,
          from_specialist: params.fromSpecialist,
          to_specialist: params.toSpecialist,
          created_at: new Date().toISOString(),
          trace_id: params.trace_id
        },
        campaign_context: {
          metadata: campaignContext.metadata,
          campaign_path: params.campaignPath
        },
        content_context: params.contentContext,
        analysis_data: {
          context_analysis: contextAnalysis,
          date_analysis: dateAnalysis,
          pricing_analysis: pricingAnalysis,
          asset_strategy: assetStrategy
        },
        workflow_status: {
          content_specialist: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            deliverables: {
              generated_content: !!params.contentContext.generated_content,
              asset_requirements: !!params.contentContext.asset_requirements,
              campaign_brief: !!params.contentContext.campaign_brief,
              technical_specs: !!params.contentContext.technical_specs
            }
          },
          next_specialist: {
            specialist: params.toSpecialist,
            status: 'ready',
            expected_deliverables: params.toSpecialist === 'design-specialist' ? 
              ['mjml_template', 'visual_design', 'responsive_layout'] :
              ['quality_report', 'final_validation']
          }
        },
        design_brief: {
          visual_strategy: campaignContext.context_analysis?.visual_elements || {},
          content_requirements: {
            headline: params.contentContext.generated_content?.headline,
            cta_text: params.contentContext.generated_content?.cta_text,
            body_sections: params.contentContext.generated_content?.body_sections
          },
          asset_manifest: assetStrategy || {},
          technical_requirements: params.contentContext.technical_specs || {}
        }
      };
      
      // Save handoff file
      const handoffFileName = `${params.fromSpecialist}-to-${params.toSpecialist}.json`;
      const handoffPath = path.join(params.campaignPath, 'handoffs', handoffFileName);
      
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));
      
      // Also save to data directory for easy access
      const dataPath = path.join(params.campaignPath, 'data', `handoff-${params.toSpecialist}.json`);
      await fs.writeFile(dataPath, JSON.stringify(handoffData, null, 2));
      
      // Update campaign context with handoff info
      const updatedCampaignContext = {
        ...campaignContext,
        latest_handoff: {
          file: handoffFileName,
          to_specialist: params.toSpecialist,
          created_at: new Date().toISOString()
        }
      };
      
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }
      
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Handoff file created successfully', {
        campaign_id: params.campaignId,
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        handoff_file: handoffFileName,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('createHandoffFile', params, handoffData, duration, true);
      
      return `Файл передачи создан успешно! От ${params.fromSpecialist} к ${params.toSpecialist}. Файл: ${handoffFileName}. Включены: контент (${!!params.contentContext.generated_content}), ассеты (${!!params.contentContext.asset_requirements}), анализ (${!!contextAnalysis}), технические требования (${!!params.contentContext.technical_specs}). Готово для передачи следующему специалисту.`;
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Failed to create handoff file', {
        error: errorMessage,
        campaign_id: params.campaignId,
        from_specialist: params.fromSpecialist,
        to_specialist: params.toSpecialist,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('createHandoffFile', params, null, duration, false, errorMessage);
      return `Ошибка создания файла передачи: ${errorMessage}`;
    }
  }
}); 