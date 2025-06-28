import { ToolResult, ContentInfo, AssetInfo, handleToolError } from './index';
import * as path from 'path';
import { EmailFolderManager, EmailFolder } from './email-folder-manager';

interface MjmlParams {
  content: ContentInfo;
  assets: MjmlAssetInfo;
  identica_assets?: {
    selected_assets: Array<{
      fileName: string;
      filePath: string;
      tags: string[];
      description: string;
    }>;
  };
  emailFolder?: EmailFolder;
  mjmlContent?: string; // Предварительно сгенерированный MJML контент
}

interface MjmlAssetInfo {
  paths?: string[]; // Array of valid file paths (strings only)
  metadata?: Record<string, any>;
}

interface MjmlResult {
  html: string; // Сокращенная версия для агента
  size_kb: number;
  mjml_source: string; // Сокращенная версия для агента
  full_html_saved?: boolean; // Индикатор что полный HTML сохранен
  html_length?: number; // Полная длина HTML
  mjml_length?: number; // Полная длина MJML
}

/**
 * T4: Render MJML Tool
 * Render email using MJML template with content and assets
 */
export async function renderMjml(params: MjmlParams): Promise<ToolResult> {
  try {
    console.log('T4: Rendering MJML template');
    console.log('🔍 T4: Input params validation:', {
      hasContent: !!params.content,
      hasAssets: !!params.assets,
      hasEmailFolder: !!params.emailFolder,
      contentType: typeof params.content,
      assetsType: typeof params.assets
    });

    // Add tracing
    const { logger } = await import('../core/logger');
    const traceId = `render_mjml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.startTrace(traceId, {
      tool: 'render_mjml',
      hasContent: !!params.content,
      hasAssets: !!params.assets,
      hasEmailFolder: !!params.emailFolder,
      assetsCount: params.assets?.paths?.length || 0
    });

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'validate_parameters',
      params: {
        contentType: typeof params.content,
        assetsType: typeof params.assets,
        hasEmailFolder: !!params.emailFolder
      }
    });

    // Validate parameters with proper null checks
    if (!params.content) {
      throw new Error('Content is required');
    }
    
    if (!params.assets) {
      // Provide default assets structure if missing
      params.assets = {
        paths: [],
        metadata: {},
      };
    }
    
    // Ensure assets.paths exists and is an array with valid string values
    if (!params.assets.paths) {
      params.assets.paths = [];
    } else if (Array.isArray(params.assets.paths)) {
      // Filter out undefined, null, or non-string values
      const originalLength = params.assets.paths.length;
      params.assets.paths = params.assets.paths.filter(path => 
        path && typeof path === 'string' && path.trim().length > 0
      );
      console.log('🔍 T4: Filtered asset paths:', {
        originalLength,
        filteredLength: params.assets.paths.length,
        removedCount: originalLength - params.assets.paths.length,
        validPaths: params.assets.paths
      });
    }

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'parameters_validated',
      result: { valid: true, assetsCount: params.assets.paths.length }
    });

    // Use provided MJML content (required parameter)
    if (!params.mjmlContent) {
      throw new Error('MJML content is required. Static templates are no longer supported.');
    }
    
    console.log('🔄 T4: Using provided MJML content...');
    const renderedMjml = params.mjmlContent;
    
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'use_provided_mjml',
      result: { mjmlLength: renderedMjml.length }
    });
    
    // Compile MJML to HTML
    console.log('🔄 T4: Starting MJML compilation...');
    console.log('🔍 T4: MJML content preview:', renderedMjml.substring(0, 500) + '...');
    
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'compile_mjml_to_html',
      params: { mjmlLength: renderedMjml.length }
    });
    
    let html: string;
    try {
      const compileStartTime = Date.now();
      html = await compileMjmlToHtml(renderedMjml);
      const compileDuration = Date.now() - compileStartTime;
      
      console.log('✅ T4: MJML compilation completed, HTML length:', html.length);
      
      logger.addTraceStep(traceId, {
        tool: 'render_mjml',
        action: 'mjml_compiled',
        result: { htmlLength: html.length },
        duration: compileDuration
      });
    } catch (compilationError) {
      console.error('❌ T4: MJML compilation failed:', compilationError);
      
      logger.addTraceStep(traceId, {
        tool: 'render_mjml',
        action: 'mjml_compilation_failed',
        error: compilationError.message
      });
      
      await logger.endTrace(traceId, undefined, compilationError);
      throw new Error(`MJML compilation failed: ${compilationError.message}`);
    }
    
    // Calculate size
    const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
    
    if (sizeKb > 100) {
      console.warn(`Email size ${sizeKb.toFixed(1)}KB exceeds 100KB limit`);
    }

    // Save to email folder if provided
    if (params.emailFolder) {
      console.log('🔍 T4: EmailFolder object received:', params.emailFolder);
      
      // Проверяем и дополняем emailFolder если нужно
      let emailFolder = params.emailFolder;
      
      // Если это неполный объект, создаем полный
      if (!emailFolder.htmlPath || !emailFolder.mjmlPath || !emailFolder.metadataPath) {
        console.log('🔧 T4: Converting incomplete emailFolder to complete EmailFolder interface');
        
        const emailFolderAny = emailFolder as any;
        
        // Определяем базовый путь
        let basePath = emailFolder.basePath;
        if (!basePath && emailFolderAny.folderPath) {
          // Если folderPath не является полным путем, создаем полный путь
          if (!emailFolderAny.folderPath.startsWith('/')) {
            basePath = path.join(process.cwd(), 'mails', emailFolder.campaignId);
          } else {
            basePath = emailFolderAny.folderPath;
          }
        }
        if (!basePath) {
          basePath = path.join(process.cwd(), 'mails', emailFolder.campaignId);
        }
        
        // Определяем путь к ассетам
        let assetsPath = emailFolder.assetsPath;
        if (!assetsPath || !assetsPath.startsWith('/')) {
          assetsPath = path.join(basePath, 'assets');
        }
        
        console.log('🔍 T4: Path construction:', {
          originalBasePath: emailFolder.basePath,
          originalFolderPath: emailFolderAny.folderPath,
          originalAssetsPath: emailFolder.assetsPath,
          computedBasePath: basePath,
          computedAssetsPath: assetsPath,
          campaignId: emailFolder.campaignId
        });
        
        // Дополнительная проверка путей перед созданием объекта
        if (!basePath || typeof basePath !== 'string') {
          throw new Error(`Invalid basePath: ${basePath} (type: ${typeof basePath})`);
        }
        if (!assetsPath || typeof assetsPath !== 'string') {
          throw new Error(`Invalid assetsPath: ${assetsPath} (type: ${typeof assetsPath})`);
        }
        
        emailFolder = {
          campaignId: emailFolder.campaignId,
          basePath: basePath,
          assetsPath: assetsPath,
          spritePath: path.join(assetsPath, 'sprite-slices'),
          htmlPath: path.join(basePath, 'email.html'),
          mjmlPath: path.join(basePath, 'email.mjml'),
          metadataPath: path.join(basePath, 'metadata.json')
        };
        
        console.log('✅ T4: Created complete EmailFolder:', emailFolder);
      }
      
      await EmailFolderManager.saveHtml(emailFolder, html);
      await EmailFolderManager.saveMjml(emailFolder, renderedMjml);
      
      // Update metadata with rendering info
      await EmailFolderManager.updateMetadata(emailFolder, {
        status: 'processing'
      });
      
      console.log(`💾 T4: Saved HTML and MJML to email folder: ${emailFolder.campaignId}`);
    }

    // Агрессивная оптимизация: возвращаем минимум данных агенту
    const htmlPreview = html.substring(0, 200) + '...[truncated]';
    const mjmlPreview = renderedMjml.substring(0, 150) + '...[truncated]';
    
    const result: MjmlResult = {
      html: htmlPreview, // Сокращенная версия для агента
      size_kb: Math.round(sizeKb * 10) / 10,
      mjml_source: mjmlPreview, // Сокращенная версия для агента
      full_html_saved: !!params.emailFolder, // Индикатор что полный HTML сохранен
      html_length: html.length,
      mjml_length: renderedMjml.length
    };

    console.log('✅ T4: MJML rendering completed successfully:', {
      htmlLength: html.length,
      sizeKb: result.size_kb,
      mjmlLength: renderedMjml.length,
      hasValidHtml: html.includes('<html>') && html.includes('</html>')
    });

    console.log(`🔄 T4: Response optimization: HTML ${html.length}→${htmlPreview.length} chars (${Math.round((1-htmlPreview.length/html.length)*100)}% reduction)`);
    console.log(`💾 T4: Full HTML saved to file: ${!!params.emailFolder}`);

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'create_result',
      result: {
        htmlLength: html.length,
        sizeKb: result.size_kb,
        mjmlLength: renderedMjml.length,
        fullHtmlSaved: result.full_html_saved
      }
    });

    const finalResult = {
      success: true,
      data: result,
      metadata: {
        size_status: sizeKb <= 100 ? 'pass' : 'fail',
        template_source: 'kupibilet-base',
        assets_count: (params.assets.paths || []).length,
        saved_to_folder: !!params.emailFolder,
        campaign_id: params.emailFolder?.campaignId,
        timestamp: new Date().toISOString()
      }
    };

    await logger.endTrace(traceId, finalResult);
    return finalResult;

  } catch (error) {
    // Error will be automatically traced by OpenAI Agents SDK
    console.error('❌ MJML rendering failed:', error);
    return handleToolError('render_mjml', error);
  }
}





async function convertImageToDataUrl(imagePath: string): Promise<string> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Validate imagePath parameter
    if (!imagePath || typeof imagePath !== 'string') {
      throw new Error(`Invalid image path: ${imagePath}`);
    }
    
    // Check if file exists
    await fs.access(imagePath);
    
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    
    // Determine MIME type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = 'image/png'; // default
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
    }
    
    // Convert to base64 data URL
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error(`Failed to convert image to data URL: ${imagePath}`, error);
    throw new Error(`Image conversion failed: ${error.message}`);
  }
}

async function compileMjmlToHtml(mjmlContent: string): Promise<string> {
  try {
    // Use actual MJML compiler
    const mjmlModule = await import('mjml');
    
    // MJML exports default function or module.default
    const mjml = (mjmlModule as any).default || mjmlModule;
    if (typeof mjml !== 'function') {
      throw new Error('MJML compiler function not found');
    }
    
    const result = mjml(mjmlContent);
    
    if (result.errors && result.errors.length > 0) {
      console.warn('MJML compilation warnings:', result.errors);
    }
    
    return result.html;
  } catch (error) {
    console.error('MJML compilation error:', error);
    throw new Error(`MJML compiler not available: ${error.message}. Please install mjml package.`);
  }
} 