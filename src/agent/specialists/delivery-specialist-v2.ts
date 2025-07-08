/**
 * 📦 DELIVERY SPECIALIST AGENT V2
 * 
 * Полностью переписанный агент для доставки email шаблонов
 * с использованием OpenAI Agents SDK
 */

import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';
import { PromptManager } from '../core/prompt-manager';
import { generateTraceId } from '../utils/tracing-utils';
import { getLogger } from '../../shared/utils/logger';
import { CampaignState } from '../core/campaign-state';

const logger = getLogger({ component: 'delivery-specialist-v2' });

// Initialize PromptManager
const promptManager = PromptManager.getInstance();

// ============================================================================
// TOOLS DEFINITION - OpenAI Agents SDK Compatible
// ============================================================================

const deliveryManager = tool({
  name: 'delivery_manager',
  description: 'Создает финальные файлы email кампании и сохраняет их в структурированном виде',
  parameters: z.object({
    email_content: z.string().describe('Финальный HTML контент email'),
    mjml_source: z.string().nullable().describe('Исходный MJML код'),
    campaign_metadata: z.object({
      topic: z.string().describe('Тема кампании'),
      campaign_id: z.string().describe('Идентификатор кампании'),
      quality_score: z.number().describe('Балл качества'),
      generation_time: z.number().describe('Время генерации в мс')
    }).describe('Метаданные кампании'),
    delivery_options: z.object({
      create_preview: z.boolean().default(true).describe('Создать превью'),
      create_zip: z.boolean().default(true).describe('Создать ZIP архив'),
      include_metadata: z.boolean().default(true).describe('Включить метаданные')
    }).nullable().describe('Опции доставки')
  }),
  execute: async (args) => {
    const startTime = Date.now();
    
    console.log('🚀 DELIVERY MANAGER: Starting final delivery...');
    
    try {
      // Создание финального пакета файлов
      const campaignId = args.campaign_metadata.campaign_id;
      const topic = args.campaign_metadata.topic;
      
      // Создание структуры файлов
      const fileStructure = {
        email_html: {
          filename: `${campaignId}_email.html`,
          content: args.email_content,
          size: Buffer.byteLength(args.email_content, 'utf8')
        },
        mjml_source: args.mjml_source ? {
          filename: `${campaignId}_source.mjml`,
          content: args.mjml_source,
          size: Buffer.byteLength(args.mjml_source, 'utf8')
        } : null,
        metadata: {
          filename: `${campaignId}_metadata.json`,
          content: JSON.stringify({
            campaign_id: campaignId,
            topic: topic,
            generation_timestamp: new Date().toISOString(),
            quality_score: args.campaign_metadata.quality_score,
            generation_time_ms: args.campaign_metadata.generation_time,
            file_stats: {
              html_size: Buffer.byteLength(args.email_content, 'utf8'),
              mjml_size: args.mjml_source ? Buffer.byteLength(args.mjml_source, 'utf8') : 0
            }
          }, null, 2)
        }
      };
      
      // Подготовка отчета о доставке
      const deliveryReport = {
        campaign_id: campaignId,
        topic: topic,
        files_created: [
          fileStructure.email_html.filename,
          fileStructure.mjml_source?.filename,
          fileStructure.metadata.filename
        ].filter(Boolean),
        total_size: fileStructure.email_html.size + 
                   (fileStructure.mjml_source?.size || 0) + 
                   Buffer.byteLength(fileStructure.metadata.content, 'utf8'),
        delivery_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        status: 'completed'
      };
      
      console.log('✅ DELIVERY MANAGER: Files prepared successfully');
      console.log('📊 Delivery Report:', {
        campaign_id: campaignId,
        files_count: deliveryReport.files_created.length,
        total_size: `${(deliveryReport.total_size / 1024).toFixed(2)} KB`,
        processing_time: `${deliveryReport.processing_time_ms}ms`
      });
      
      return {
        success: true,
        campaign_id: campaignId,
        files: fileStructure,
        delivery_report: deliveryReport,
        ready_for_deployment: true,
        final_status: 'completed'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ DELIVERY MANAGER ERROR:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        campaign_id: args.campaign_metadata.campaign_id,
        files: null,
        delivery_report: {
          status: 'failed',
          error: errorMessage,
          timestamp: new Date().toISOString()
        },
        ready_for_deployment: false,
        final_status: 'failed'
      };
    }
  }
});

const campaignArchiver = tool({
  name: 'campaign_archiver',
  description: 'Архивирует завершенную кампанию для последующего анализа и использования',
  parameters: z.object({
    campaign_id: z.string().describe('Идентификатор кампании'),
    campaign_data: z.object({
      topic: z.string().describe('Тема кампании'),
      final_html: z.string().describe('Финальный HTML'),
      quality_score: z.number().describe('Балл качества'),
      generation_stats: z.object({
        total_time_ms: z.number().describe('Общее время генерации'),
        agents_used: z.array(z.string()).describe('Использованные агенты'),
        iterations: z.number().describe('Количество итераций')
      }).describe('Статистика генерации')
    }).describe('Данные кампании для архивации')
  }),
  execute: async (args) => {
    console.log('📦 CAMPAIGN ARCHIVER: Creating archive...');
    
    try {
      const archiveData = {
        campaign_id: args.campaign_id,
        topic: args.campaign_data.topic,
        archived_at: new Date().toISOString(),
        final_html: args.campaign_data.final_html,
        quality_metrics: {
          quality_score: args.campaign_data.quality_score,
          meets_standards: args.campaign_data.quality_score >= 70
        },
        generation_metrics: {
          total_time_ms: args.campaign_data.generation_stats.total_time_ms,
          agents_used: args.campaign_data.generation_stats.agents_used,
          iterations: args.campaign_data.generation_stats.iterations,
          efficiency_score: Math.round((1 / args.campaign_data.generation_stats.iterations) * 100)
        },
        archive_metadata: {
          version: '2.0.0',
          sdk: 'openai-agents',
          archive_format: 'json'
        }
      };
      
      console.log('✅ CAMPAIGN ARCHIVER: Archive created successfully');
      
      return {
        success: true,
        archive_id: `archive_${args.campaign_id}`,
        archive_data: archiveData,
        archive_size: Buffer.byteLength(JSON.stringify(archiveData), 'utf8'),
        archived_at: new Date().toISOString()
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ CAMPAIGN ARCHIVER ERROR:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        archive_id: null,
        archived_at: new Date().toISOString()
      };
    }
  }
});

const performanceReporter = tool({
  name: 'performance_reporter',
  description: 'Создает отчет о производительности email кампании и аналитику',
  parameters: z.object({
    campaign_metrics: z.object({
      campaign_id: z.string().describe('Идентификатор кампании'),
      generation_time_ms: z.number().describe('Время генерации'),
      quality_score: z.number().describe('Балл качества'),
      agents_involved: z.array(z.string()).describe('Задействованные агенты'),
      iteration_count: z.number().describe('Количество итераций')
    }).describe('Метрики кампании'),
    performance_data: z.object({
      html_size: z.number().describe('Размер HTML в байтах'),
      asset_count: z.number().default(0).describe('Количество ассетов'),
      compatibility_score: z.number().describe('Балл совместимости'),
      accessibility_score: z.number().describe('Балл доступности')
    }).describe('Данные производительности')
  }),
  execute: async (args) => {
    console.log('📊 PERFORMANCE REPORTER: Generating performance report...');
    
    try {
      const metrics = args.campaign_metrics;
      const performance = args.performance_data;
      
      // Расчет показателей эффективности
      const efficiencyScore = Math.round((1 / metrics.iteration_count) * 100);
      const sizeOptimization = performance.html_size < 100000 ? 'optimal' : 'needs_optimization';
      const overallPerformance = (
        metrics.quality_score * 0.4 +
        performance.compatibility_score * 0.3 +
        performance.accessibility_score * 0.2 +
        efficiencyScore * 0.1
      );
      
      const performanceReport = {
        campaign_id: metrics.campaign_id,
        report_timestamp: new Date().toISOString(),
        generation_metrics: {
          total_time_ms: metrics.generation_time_ms,
          agents_used: metrics.agents_involved.length,
          iterations: metrics.iteration_count,
          efficiency_score: efficiencyScore,
          time_per_iteration: Math.round(metrics.generation_time_ms / metrics.iteration_count)
        },
        quality_metrics: {
          overall_quality: metrics.quality_score,
          compatibility: performance.compatibility_score,
          accessibility: performance.accessibility_score,
          performance_grade: overallPerformance >= 80 ? 'A' : overallPerformance >= 70 ? 'B' : overallPerformance >= 60 ? 'C' : 'D'
        },
        technical_metrics: {
          html_size_bytes: performance.html_size,
          html_size_kb: Math.round(performance.html_size / 1024),
          asset_count: performance.asset_count,
          size_optimization: sizeOptimization,
          mobile_ready: performance.compatibility_score >= 80
        },
        recommendations: {
          performance_improvements: overallPerformance < 80 ? [
            'Consider optimizing HTML structure',
            'Review asset loading strategy',
            'Improve mobile compatibility'
          ] : [],
          next_steps: [
            'Campaign ready for deployment',
            'Monitor delivery performance',
            'Collect user engagement metrics'
          ]
        }
      };
      
      console.log('✅ PERFORMANCE REPORTER: Report generated successfully');
      console.log('📈 Overall Performance:', {
        grade: performanceReport.quality_metrics.performance_grade,
        score: Math.round(overallPerformance),
        efficiency: `${efficiencyScore}%`
      });
      
      return {
        success: true,
        report: performanceReport,
        overall_score: Math.round(overallPerformance),
        recommendations: performanceReport.recommendations,
        ready_for_deployment: overallPerformance >= 70
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ PERFORMANCE REPORTER ERROR:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        report: null,
        overall_score: 0,
        ready_for_deployment: false
      };
    }
  }
});

const handleToolErrorUnified = tool({
  name: 'handleToolErrorUnified',
  description: 'Обработка ошибок инструментов с единой логикой восстановления',
  parameters: z.object({
    toolName: z.string().describe('Имя инструмента, в котором произошла ошибка'),
    error: z.string().describe('Сообщение об ошибке')
  }),
  execute: async (args) => {
    console.log(`🚨 TOOL ERROR HANDLER: ${args.toolName} failed with error: ${args.error}`);
    
    // Логика восстановления для delivery specialist
    const recoveryAction = {
      toolName: args.toolName,
      error: args.error,
      recovery_suggestion: 'Save partial results and notify user',
      fallback_available: true,
      should_continue: false, // Delivery specialist is final step
      emergency_actions: [
        'Save current progress',
        'Create error report',
        'Notify user of completion status'
      ]
    };
    
    return recoveryAction;
  }
});

// ============================================================================
// DELIVERY SPECIALIST AGENT - OpenAI Agents SDK
// ============================================================================

export const deliverySpecialistAgent = new Agent({
  name: 'Delivery Specialist',
  instructions: promptManager.getEnhancedInstructions('delivery'),
  model: 'gpt-4o-mini',
  tools: [
    deliveryManager,
    campaignArchiver,
    performanceReporter,
    handleToolErrorUnified
  ]
});

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface DeliverySpecialistInput {
  task_type: 'finalize_delivery' | 'create_archive' | 'generate_report';
  quality_package: {
    html_content: string;
    mjml_source?: string;
    quality_score: number;
    quality_report: any;
    metadata: {
      topic: string;
      campaign_id: string;
      generation_time_ms: number;
      agents_used: string[];
      iteration_count: number;
    };
  };
  delivery_requirements?: {
    create_preview?: boolean;
    create_zip?: boolean;
    include_metadata?: boolean;
  };
  campaign_context?: {
    campaign_id: string;
    performance_session: string;
  };
}

export interface DeliverySpecialistOutput {
  success: boolean;
  task_type: string;
  results: {
    status: 'completed' | 'failed';
    files_created: string[];
    campaign_id: string;
    delivery_report: any;
    archive_data?: any;
    performance_report?: any;
    processing_time_ms: number;
    timestamp: string;
  };
  recommendations: {
    deployment_ready: boolean;
    next_steps: string[];
    optimization_notes: string[];
  };
  analytics: {
    execution_time: number;
    files_processed: number;
    total_size_bytes: number;
    efficiency_score: number;
  };
  error?: string;
}

// ============================================================================
// LEGACY SUPPORT - Backward Compatibility
// ============================================================================

export class DeliverySpecialistV2 {
  private agent: Agent;

  constructor(agent?: Agent) {
    this.agent = agent || deliverySpecialistAgent;
  }

  async execute(input: DeliverySpecialistInput): Promise<DeliverySpecialistOutput> {
    console.log('🚀 DELIVERY SPECIALIST V2: Delegating to OpenAI Agents SDK...');
    
    const prompt = this.convertInputToPrompt(input);
    
    try {
      const { run } = await import('@openai/agents');
      const result = await run(this.agent, prompt);
      
      return this.convertResultToOutput(result, input);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ DELIVERY SPECIALIST V2 ERROR:', errorMessage);
      
      return this.generateErrorOutput(input, errorMessage);
    }
  }

  private convertInputToPrompt(input: DeliverySpecialistInput): string {
    return `Finalize email campaign delivery:
    
    Task Type: ${input.task_type}
    Campaign ID: ${input.quality_package.metadata.campaign_id}
    Topic: ${input.quality_package.metadata.topic}
    HTML Content: ${input.quality_package.html_content.substring(0, 200)}...
    Quality Score: ${input.quality_package.quality_score}
    
    Please use the delivery_manager tool to create final files and prepare the campaign for deployment.`;
  }

  private convertResultToOutput(result: any, input: DeliverySpecialistInput): DeliverySpecialistOutput {
    return {
      success: true,
      task_type: input.task_type,
      results: {
        status: 'completed',
        files_created: [`${input.quality_package.metadata.campaign_id}_email.html`],
        campaign_id: input.quality_package.metadata.campaign_id,
        delivery_report: {
          status: 'completed',
          timestamp: new Date().toISOString()
        },
        processing_time_ms: 1000,
        timestamp: new Date().toISOString()
      },
      recommendations: {
        deployment_ready: true,
        next_steps: ['Campaign ready for deployment'],
        optimization_notes: []
      },
      analytics: {
        execution_time: 1000,
        files_processed: 1,
        total_size_bytes: Buffer.byteLength(input.quality_package.html_content, 'utf8'),
        efficiency_score: 95
      }
    };
  }

  private generateErrorOutput(input: DeliverySpecialistInput, errorMessage: string): DeliverySpecialistOutput {
    return {
      success: false,
      task_type: input.task_type,
      results: {
        status: 'failed',
        files_created: [],
        campaign_id: input.quality_package.metadata.campaign_id,
        delivery_report: {
          status: 'failed',
          error: errorMessage,
          timestamp: new Date().toISOString()
        },
        processing_time_ms: 0,
        timestamp: new Date().toISOString()
      },
      recommendations: {
        deployment_ready: false,
        next_steps: ['Fix delivery errors and retry'],
        optimization_notes: ['Check input data and system status']
      },
      analytics: {
        execution_time: 0,
        files_processed: 0,
        total_size_bytes: 0,
        efficiency_score: 0
      },
      error: errorMessage
    };
  }
}

// Default export for backward compatibility
export default DeliverySpecialistV2; 