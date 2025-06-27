import { ToolResult, handleToolError } from './index';
import EmailFolderManager, { EmailFolder } from './email-folder-manager';

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

    // Валидация параметров
    if (!params.topic || params.topic.trim().length === 0) {
      throw new Error('Topic is required and cannot be empty');
    }

    // Создаем папку email кампании
    const emailFolder = await EmailFolderManager.createEmailFolder(
      params.topic.trim(),
      params.campaign_type || 'promotional'
    );

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
        structure_created: true
      },
      metadata: {
        tool: 'initialize_email_folder',
        topic: params.topic,
        campaign_type: params.campaign_type || 'promotional',
        timestamp: new Date().toISOString()
      }
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
      metadata: {
        tool: 'load_email_folder',
        campaignId: params.campaignId,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return handleToolError('load_email_folder', error);
  }
}

export default { initializeEmailFolder, loadEmailFolder }; 