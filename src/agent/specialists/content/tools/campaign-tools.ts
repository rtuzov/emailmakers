/**
 * Campaign Management Tools
 * 
 * Provides tools for creating campaign folders, managing metadata,
 * and campaign lifecycle operations for Content Specialist.
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
 * Create campaign folder structure
 */
export const createCampaignFolder = tool({
  name: 'createCampaignFolder',
  description: 'Создает структуру папок для новой email-кампании с метаданными',
  parameters: z.object({
    campaign_name: z.string().describe('Название кампании'),
    brief: z.string().describe('Краткое описание кампании'),
    target_audience: z.string().describe('Целевая аудитория'),
    goals: z.string().describe('Цели кампании'),
    trace_id: z.string().optional().describe('ID трассировки для отладки')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Generate unique campaign ID with random component
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const campaignId = `campaign_${timestamp}_${randomId}`;
      
      // Create campaign path
      const campaignPath = path.join(process.cwd(), 'campaigns', campaignId);
      
      // Create directory structure
      await fs.mkdir(campaignPath, { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'content'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'assets'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'templates'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'docs'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'exports'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'handoffs'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'logs'), { recursive: true });
      await fs.mkdir(path.join(campaignPath, 'data'), { recursive: true });
      
      // Create metadata
      const metadata = {
        campaign_id: campaignId,
        campaign_name: params.campaign_name,
        brief: params.brief,
        target_audience: params.target_audience,
        goals: params.goals,
        created_at: new Date().toISOString(),
        status: 'initialized',
        trace_id: params.trace_id,
        workflow_stage: 'content_generation',
        specialists: {
          content: { status: 'active', started_at: new Date().toISOString() },
          design: { status: 'pending' },
          quality: { status: 'pending' },
          delivery: { status: 'pending' }
        }
      };
      
      // Save metadata
      await fs.writeFile(
        path.join(campaignPath, 'campaign-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Create README
      const readmeContent = `# ${params.campaign_name}

## Описание кампании
${params.brief}

## Целевая аудитория
${params.target_audience}

## Цели кампании
${params.goals}

## Структура папок
- \`content/\` - Контентные материалы и анализ
- \`assets/\` - Изображения и медиафайлы  
- \`templates/\` - MJML шаблоны
- \`docs/\` - Документация и спецификации
- \`exports/\` - Готовые файлы для доставки
- \`handoffs/\` - Файлы передачи между специалистами
- \`logs/\` - Логи выполнения
- \`data/\` - Данные анализа и результаты

## Статус
Создано: ${new Date().toLocaleString()}
ID кампании: ${campaignId}
`;
      
      await fs.writeFile(path.join(campaignPath, 'README.md'), readmeContent);
      
      // Create campaign context for next tools
      const campaignContext: CampaignWorkflowContext = {
        campaignId,
        campaignPath,
        metadata,
        trace_id: params.trace_id
      };
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = campaignContext;
      }

      // Log success
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Campaign folder created successfully', {
        campaign_id: campaignId,
        campaign_path: campaignPath,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('createCampaignFolder', params, { campaignId, campaignPath }, duration, true);

      // Return string as required by OpenAI Agents SDK
      return `Кампания успешно создана! ID: ${campaignId}. Папка: ${campaignPath}. Структура включает: content/, assets/, templates/, docs/, exports/. Метаданные сохранены в campaign-metadata.json. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Campaign folder creation failed', {
        error: errorMessage,
        duration,
        campaign_name: params.campaign_name,
        trace_id: params.trace_id
      });
      
      log.tool('createCampaignFolder', params, null, duration, false, errorMessage);
      return `Ошибка создания кампании: ${errorMessage}`;
    }
  }
});

/**
 * Update campaign metadata
 */
export const updateCampaignMetadata = tool({
  name: 'updateCampaignMetadata',
  description: 'Обновляет метаданные кампании с новой информацией о прогрессе',
  parameters: z.object({
    updates: z.record(z.any()).describe('Объект с обновлениями метаданных'),
    trace_id: z.string().optional().describe('ID трассировки для отладки')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Get campaign context
      const campaignContext = extractCampaignContext(context);
      
      if (!campaignContext.campaignPath) {
        throw new Error('Campaign path is missing from context');
      }
      
      const metadataPath = path.join(campaignContext.campaignPath, 'campaign-metadata.json');
      
      // Read existing metadata
      const existingData = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(existingData);
      
      // Apply updates
      const updatedMetadata = {
        ...metadata,
        ...params.updates,
        updated_at: new Date().toISOString()
      };
      
      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
      
      // Update campaign context
      const updatedCampaignContext = {
        ...campaignContext,
        metadata: updatedMetadata
      };
      
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }
      
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Campaign metadata updated', {
        campaign_id: campaignContext.campaignId,
        updates: Object.keys(params.updates),
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('updateCampaignMetadata', params, updatedMetadata, duration, true);
      
      return `Метаданные кампании обновлены. Изменения: ${Object.keys(params.updates).join(', ')}. Время обновления: ${updatedMetadata.updated_at}`;
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Failed to update campaign metadata', {
        error: errorMessage,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('updateCampaignMetadata', params, null, duration, false, errorMessage);
      return `Ошибка обновления метаданных: ${errorMessage}`;
    }
  }
}); 