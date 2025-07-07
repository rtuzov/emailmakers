import { ToolResult, handleToolError } from './index';
import EmailFolderManager, { EmailFolder } from './email-folder-manager';
import { getCurrentTrace } from '@openai/agents';
import { campaignState } from '../core/campaign-state';

interface InitializeFolderParams {
  topic: string;
  campaign_type?: 'urgent' | 'newsletter' | 'seasonal' | 'promotional' | 'informational';
}

/**
 * T0: Initialize Email Folder - создает структуру папок для новой email кампании
 * 
 * Этот инструмент должен вызываться ПЕРВЫМ в каждой генерации email.
 * Он создает правильную архитектуру папок и возвращает EmailFolder объект
 * для использования во всех последующих инструментах.
 */
export async function initializeEmailFolder(params: InitializeFolderParams): Promise<ToolResult> {
  try {
    console.log('T0: Initializing email folder structure for campaign:', params.topic);

    // Проверяем, есть ли уже активная кампания
    if (campaignState.hasActiveCampaign()) {
      const existingCampaign = campaignState.getCurrentCampaign();
      console.log(`📁 Using existing campaign: ${existingCampaign?.campaignId}`);
      
      return {
        success: true,
        data: {
          emailFolder: existingCampaign?.emailFolder,
          campaignId: existingCampaign?.campaignId,
          paths: {
            base: existingCampaign?.emailFolder.basePath,
            assets: existingCampaign?.emailFolder.assetsPath,
            sprites: existingCampaign?.emailFolder.spritePath,
            html: existingCampaign?.emailFolder.htmlPath,
            mjml: existingCampaign?.emailFolder.mjmlPath,
            metadata: existingCampaign?.emailFolder.metadataPath
          },
          structure_created: false,
          reused_existing: true
        }
      };
    }

    // Валидация параметров
    if (!params.topic || params.topic.trim().length === 0) {
      throw new Error('Topic is required and cannot be empty');
    }

    // Получаем trace_id из контекста выполнения OpenAI Agents SDK
    let traceId: string | undefined;
    let traceSource = 'none';
    
    try {
      console.log('🔍 Attempting to get trace_id from OpenAI Agents SDK context...');
      const currentTrace = getCurrentTrace();
      console.log('📋 getCurrentTrace() result:', currentTrace);
      
      if (currentTrace) {
        console.log('📋 Trace object properties:', Object.keys(currentTrace));
        traceId = currentTrace.traceId;
        traceSource = 'openai-agents-sdk';
        
        if (traceId) {
          console.log('✅ Successfully obtained trace_id from OpenAI Agents SDK:', traceId);
        } else {
          console.log('⚠️ Trace object exists but traceId is undefined/null');
        }
      } else {
        console.log('⚠️ getCurrentTrace() returned null/undefined');
      }
    } catch (error) {
      console.log('❌ Error getting trace_id from OpenAI Agents SDK:', error);
    }
    
    // Альтернативные источники trace_id
    if (!traceId) {
      console.log('🔍 Checking alternative trace_id sources...');
      
      // Проверяем переменные окружения
      if (process.env.OPENAI_TRACE_ID) {
        traceId = process.env.OPENAI_TRACE_ID;
        traceSource = 'environment';
        console.log('✅ Found trace_id in environment variables:', traceId);
      }
      
      // Проверяем process.argv для trace_id
      const traceArg = process.argv.find(arg => arg.startsWith('--trace-id='));
      if (traceArg && !traceId) {
        traceId = traceArg.split('=')[1];
        traceSource = 'command-line';
        console.log('✅ Found trace_id in command line arguments:', traceId);
      }
    }
    
    if (traceId) {
      console.log(`📋 Final trace_id: ${traceId} (source: ${traceSource})`);
    } else {
      console.log('⚠️ No trace_id found from any source, will use random ID');
    }

    // Создаем папку email кампании
    const emailFolder = await EmailFolderManager.createEmailFolder(
      params.topic.trim(),
      params.campaign_type || 'promotional',
      traceId
    );

    // Сохраняем кампанию в глобальном состоянии
    campaignState.setCampaign({
      campaignId: emailFolder.campaignId,
      emailFolder,
      topic: params.topic.trim(),
      campaign_type: params.campaign_type || 'promotional',
      created_at: new Date().toISOString(),
      trace_id: traceId
    });

    console.log(`✅ T0: Email folder structure created successfully`);
    console.log(`📁 Campaign ID: ${emailFolder.campaignId}`);
    console.log(`📂 Base path: ${emailFolder.basePath}`);
    console.log(`🖼️ Assets path: ${emailFolder.assetsPath}`);
    console.log(`🔪 Sprite path: ${emailFolder.spritePath}`);

    return {
      success: true,
      data: {
        emailFolder,
        campaignId: emailFolder.campaignId,
        paths: {
          base: emailFolder.basePath,
          assets: emailFolder.assetsPath,
          sprites: emailFolder.spritePath,
          html: emailFolder.htmlPath,
          mjml: emailFolder.mjmlPath,
          metadata: emailFolder.metadataPath
        },
        structure_created: true,
        trace_info: {
          trace_id: traceId,
          trace_source: traceSource,
          folder_format: traceId ? 'trace-based' : 'random-based'
        }
      },
      // metadata: {
      //   tool: 'initialize_email_folder',
      //   topic: params.topic,
      //   campaign_type: params.campaign_type || 'promotional',
      //   timestamp: new Date().toISOString(),
      //   trace_id: traceId,
      //   trace_source: traceSource
      // }
    };

  } catch (error) {
    return handleToolError('initialize_email_folder', error);
  }
}

/**
 * T0b: Load Existing Email Folder - загружает существующую папку email кампании
 */
export async function loadEmailFolder(params: { campaignId: string }): Promise<ToolResult> {
  try {
    console.log('T0b: Loading existing email folder:', params.campaignId);

    if (!params.campaignId || params.campaignId.trim().length === 0) {
      throw new Error('Campaign ID is required and cannot be empty');
    }

    const emailFolder = await EmailFolderManager.loadEmailFolder(params.campaignId.trim());

          if (!emailFolder) {
        throw new Error(`Email folder not found: ${params.campaignId}`);
      }

    console.log(`✅ T0b: Email folder loaded successfully`);
    console.log(`📁 Campaign ID: ${emailFolder.campaignId}`);
    console.log(`📂 Base path: ${emailFolder.basePath}`);

    // Получаем текущий metadata
    const metadata = await EmailFolderManager.getMetadata(emailFolder);

    return {
      success: true,
      data: {
        emailFolder,
        campaignId: emailFolder.campaignId,
        paths: {
          base: emailFolder.basePath,
          assets: emailFolder.assetsPath,
          sprites: emailFolder.spritePath,
          html: emailFolder.htmlPath,
          mjml: emailFolder.mjmlPath,
          metadata: emailFolder.metadataPath
        },
        current_metadata: metadata,
        structure_loaded: true
      },
      // metadata: {
      //   tool: 'load_email_folder',
      //   campaignId: params.campaignId,
      //   timestamp: new Date().toISOString()
      // }
    };

  } catch (error) {
    return handleToolError('load_email_folder', error);
  }
}

export default { initializeEmailFolder, loadEmailFolder }; 