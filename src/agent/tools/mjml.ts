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

    // Load base MJML template
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'load_mjml_template',
      params: {}
    });

    const mjmlTemplate = await loadMjmlTemplate();

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'mjml_template_loaded',
      result: { templateLength: mjmlTemplate.length }
    });
    
    // Render template with content and assets
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'render_template',
      params: {
        contentSubject: params.content.subject,
        assetsCount: params.assets.paths.length,
        hasIdenticaAssets: !!params.identica_assets
      }
    });

    const renderStartTime = Date.now();
    const renderedMjml = await renderTemplate(mjmlTemplate, params.content, params.assets, params.identica_assets);
    const renderDuration = Date.now() - renderStartTime;

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'template_rendered',
      result: { renderedMjmlLength: renderedMjml.length },
      duration: renderDuration
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

async function loadMjmlTemplate(): Promise<string> {
  // Base MJML template for Kupibilet emails
  return `<mjml>
  <mj-head>
    <mj-title>{{subject}}</mj-title>
    <mj-preview>{{preheader}}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="16px" color="#333333" line-height="1.5" />
      <mj-button background-color="#007bff" color="#ffffff" border-radius="4px" />
    </mj-attributes>
    <mj-style>
      .kupibilet-brand { color: #007bff; font-weight: bold; }
      .price-highlight { color: #28a745; font-size: 18px; font-weight: bold; }
      @media only screen and (max-width: 600px) {
        .mobile-padding { padding: 10px !important; }
        .mobile-text { font-size: 14px !important; }
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8f9fa">
    <!-- Header -->
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-image src="{{logo_url}}" alt="Kupibilet" width="150px" align="left" />
      </mj-column>
    </mj-section>
    
    <!-- Hero Section -->
    <mj-section background-color="#ffffff" padding="0">
      <mj-column>
        <mj-image src="{{header_image}}" alt="Travel destination" width="600px" />
      </mj-column>
    </mj-section>
    
    <!-- Content Section -->
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-text font-size="28px" color="#333333" font-weight="bold" line-height="1.2">
          {{subject}}
        </mj-text>
        <mj-text font-size="16px" color="#666666" padding-top="15px">
          {{body}}
        </mj-text>
        
        <!-- Rabbit Component Section -->
        {{rabbit_component}}
        
        <mj-text css-class="price-highlight" padding-top="20px">
          {{price_text}}
        </mj-text>
        
        <!-- CTA Section with optional icon -->
        <mj-table padding-top="25px">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td>
                    <a href="{{cta_url}}" style="background-color: #007bff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold; display: inline-block;">
                      {{#if cta_icon}}{{cta_icon}}{{/if}}
                      {{cta}}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </mj-table>
      </mj-column>
    </mj-section>
    
    <!-- Footer -->
    <mj-section background-color="#f8f9fa" padding="20px">
      <mj-column>
        <mj-text font-size="12px" color="#999999" align="center">
          © 2025 Kupibilet. Все права защищены.
        </mj-text>
        <mj-text font-size="12px" color="#999999" align="center">
          <a href="{{unsubscribe_url}}" style="color: #999999;">Отписаться</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

async function renderTemplate(mjmlTemplate: string, content: ContentInfo, assets: any, identica_assets?: { selected_assets: Array<{ fileName: string; filePath: string; tags: string[]; description: string; }> }): Promise<string> {
  // Debug logging for assets
  console.log('🔍 T4: Analyzing assets structure:', {
    assets: assets ? 'Present' : 'Missing',
    paths: assets?.paths ? `Array[${assets.paths.length}]` : 'Missing',
    metadata: assets?.metadata ? `Object with ${Object.keys(assets.metadata).length} keys` : 'Missing',
  });
  
  // Ensure assets has paths array
  const assetPaths = assets?.paths || [];
  
  console.log('📁 T4: Asset paths:', assetPaths);
  
      // Use real Figma assets
  let headerImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop';
  
  if (assetPaths.length > 0) {
    // Get the first asset path - downloaded Figma asset
    const firstAsset = assetPaths[0];
    
    // Validate firstAsset with detailed error reporting
    if (!firstAsset || typeof firstAsset !== 'string') {
      console.error('🚨 T4: Invalid asset detected:', {
        firstAsset,
        firstAssetType: typeof firstAsset,
        allAssetPaths: assetPaths,
        assetTypes: assetPaths.map(path => typeof path),
        originalAssetsObject: assets
      });
      throw new Error(`Invalid first asset: received ${typeof firstAsset} (${firstAsset}) instead of string. This usually means the OpenAI agent passed undefined/null values in the assets.paths array. Asset paths: ${JSON.stringify(assetPaths)}`);
    }
    
    console.log(`🎨 Using Figma asset for header: ${firstAsset}`);
    
    // Check if it's a local file path and convert to proper URL
    if (firstAsset.startsWith('/') || firstAsset.includes('figma-ai-') || firstAsset.includes('figma-assets/')) {
      // For email compatibility, we need to create a publicly accessible URL
      // Since we're uploading to S3 later, we'll use a placeholder that will be replaced
      // with the actual S3 URL in the upload process
      
      // Extract filename from path
      let filename: string;
      let fullPath: string;
      
      if (firstAsset.includes('figma-assets/')) {
        // Handle figma-assets/ paths
        filename = firstAsset.split('/').pop() || 'figma-asset.png';
        fullPath = firstAsset.startsWith('/') ? firstAsset : path.resolve(process.cwd(), firstAsset);
      } else if (firstAsset.includes('figma-ai-')) {
        // Handle direct figma-ai files
        filename = firstAsset.split('/').pop() || firstAsset;
        fullPath = firstAsset.startsWith('/') ? firstAsset : path.resolve(process.cwd(), 'mails', firstAsset);
      } else {
        // Handle absolute paths
        filename = firstAsset.split('/').pop() || 'figma-asset.png';
        fullPath = firstAsset;
      }
      
      // Use a placeholder URL that will be replaced during upload
      headerImage = `{{FIGMA_ASSET_URL:${filename}}}`;
      console.log(`🔗 Created placeholder URL for Figma asset: ${filename} from ${fullPath}`);
    } else {
      // Use direct URL if it's already a URL
      headerImage = firstAsset;
      console.log(`🔗 Using direct URL for asset: ${firstAsset}`);
    }
  } else {
    console.warn('🚨 T4: No valid Figma assets available after filtering. Using fallback image.');
    console.log('🔍 T4: Asset debugging info:', {
      originalAssets: assets,
      filteredPaths: assetPaths,
      pathsLength: assetPaths.length,
      assetsProvided: !!assets?.paths,
      originalPathsLength: assets?.paths?.length || 0
    });
    
    // Use fallback image instead of throwing error
    headerImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=300&fit=crop';
    console.log('📷 Using fallback header image due to missing/invalid Figma assets');
  }

  // Ensure content properties exist
  const safeContent = {
    subject: content?.subject || 'Путешествие в Париж - Специальные предложения от Kupibilet',
    preheader: content?.preheader || 'Откройте для себя лучшие цены на билеты в Париж',
    body: content?.body || 'Найдите лучшие предложения на авиабилеты для вашего путешествия в город любви. Париж ждет вас с незабываемыми впечатлениями!',
    cta: content?.cta || 'Найти билеты в Париж'
  };

  // Check if content includes component requests or if we have rabbit assets
  let rabbitComponent = '';
  const hasRabbitInContent = content?.body && (content.body.includes('заяц') || content.body.includes('rabbit'));
  const hasRabbitAssets = assetPaths.some(path => path.includes('заяц') || path.includes('rabbit'));
  
  // Enhanced component detection logic - always add components for promotional emails
  const isPromotionalEmail = content?.subject?.toLowerCase().includes('предложени') || 
                            content?.subject?.toLowerCase().includes('скидк') ||
                            content?.body?.toLowerCase().includes('предложени') ||
                            content?.body?.toLowerCase().includes('скидк') ||
                            content?.cta?.toLowerCase().includes('найти') ||
                            content?.cta?.toLowerCase().includes('купить');
  
  const shouldAddComponent = hasRabbitInContent || hasRabbitAssets || assetPaths.length > 1 || isPromotionalEmail;
  
  console.log('🎯 T4: Component decision logic:', {
    hasRabbitInContent,
    hasRabbitAssets,
    multipleAssets: assetPaths.length > 1,
    isPromotionalEmail,
    shouldAddComponent
  });
  
  if (shouldAddComponent) {
    // Use the second asset as rabbit component if available, otherwise use first
    let rabbitAssetPath = '';
    if (assetPaths.length > 1) {
      rabbitAssetPath = assetPaths[1]; // Second asset for rabbit
    } else if (hasRabbitAssets) {
      rabbitAssetPath = assetPaths.find(path => path.includes('заяц') || path.includes('rabbit')) || '';
    }
    
    if (rabbitAssetPath && typeof rabbitAssetPath === 'string') {
      // Extract filename for placeholder
      const filename = rabbitAssetPath.split('/').pop() || 'rabbit-asset.png';
      const rabbitUrl = `{{FIGMA_ASSET_URL:${filename}}}`;
      
      rabbitComponent = `
        <mj-image src="${rabbitUrl}" alt="Купибилет заяц" width="150px" align="center" padding-top="20px" />`;
      
      console.log(`🐰 Added rabbit component with asset: ${filename}`);
    } else {
      // Enhanced fallback rabbit component for promotional emails
      rabbitComponent = `
        <mj-text align="center" font-size="48px" padding-top="20px">🐰</mj-text>
        <mj-text align="center" font-size="14px" color="#666" padding-top="10px">Ваш помощник в путешествиях от Купибилет</mj-text>`;
      
      console.log(`🐰 Added enhanced fallback emoji rabbit component for promotional email`);
    }
  } else {
    console.log(`🚫 No component needed - not a promotional email and no specific rabbit requests`);
  }

  // Process identica assets for logo
  let logoUrl = 'https://kupibilet.ru/assets/logo.png'; // default logo
  
  if (identica_assets?.selected_assets && identica_assets.selected_assets.length > 0) {
    console.log('🎨 T4: Processing identica assets:', identica_assets.selected_assets.length);
    
    // Find logo asset (prefer assets with 'логотип' tag or description containing 'логотип')
    const logoAsset = identica_assets.selected_assets.find(asset => 
      asset.tags.some(tag => tag.toLowerCase().includes('логотип')) ||
      asset.description.toLowerCase().includes('логотип') ||
      asset.fileName.toLowerCase().includes('логотип')
    ) || identica_assets.selected_assets[0]; // fallback to first asset
    
    if (logoAsset) {
      const filename = logoAsset.fileName;
      logoUrl = `{{IDENTICA_ASSET_URL:${filename}}}`;
      console.log(`🏷️ Using identica asset for logo: ${filename}`);
    }
  } else {
    console.log('🏷️ No identica assets provided, using default logo');
  }

  // Template variables
  const variables = {
    subject: safeContent.subject,
    preheader: safeContent.preheader,
    body: safeContent.body.replace(/\n/g, '</mj-text><mj-text>'),
    cta: safeContent.cta,
    cta_text: safeContent.cta,
    logo_url: logoUrl, // Use identica logo if available
    hero_image: headerImage, // Changed from header_image to hero_image to match template
    destination_name: 'Travel Destination', // For alt text in hero image
    price_text: 'Специальные цены на билеты в Париж!',
    cta_url: 'https://kupibilet.ru/search?origin=LED&destination=CDG',
    unsubscribe_url: 'https://kupibilet.ru/unsubscribe',
    rabbit_component: rabbitComponent
  };

  // Replace template variables
  let rendered = mjmlTemplate;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }

  console.log('🧩 T4: Component integration check:', {
    rabbitRequested: hasRabbitInContent || hasRabbitAssets,
    componentGenerated: rabbitComponent.length > 0,
    templateHasPlaceholder: mjmlTemplate.includes('{{rabbit_component}}'),
    componentIntegrated: rabbitComponent.length > 0 && mjmlTemplate.includes('{{rabbit_component}}'),
    assetsAvailable: assetPaths.length,
    hasRabbitAssets: hasRabbitAssets,
    isPromotionalEmail: isPromotionalEmail,
    shouldAddComponent: shouldAddComponent,
    finalStatus: rabbitComponent.length > 0 && mjmlTemplate.includes('{{rabbit_component}}') ? 'SUCCESS' : 'NEEDS_ATTENTION'
  });

  return rendered;
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