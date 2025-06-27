import { ToolResult, ContentInfo, AssetInfo, handleToolError } from './index';
import * as path from 'path';
import EmailFolderManager, { EmailFolder } from './email-folder-manager';

interface MjmlParams {
  content: any;
  assets: any;
  emailFolder?: EmailFolder;
}

interface MjmlResult {
  html: string;
  size_kb: number;
  mjml_source: string;
}

/**
 * T4: Render MJML Tool
 * Render email using MJML template with content and assets
 */
export async function renderMjml(params: MjmlParams): Promise<ToolResult> {
  try {
    console.log('T4: Rendering MJML template');

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
    
    // Ensure assets.paths exists and is an array
    if (!params.assets.paths) {
      params.assets.paths = [];
    }

    // Load base MJML template
    const mjmlTemplate = await loadMjmlTemplate();
    
    // Render template with content and assets
    const renderedMjml = await renderTemplate(mjmlTemplate, params.content, params.assets);
    
    // Compile MJML to HTML
    const html = await compileMjmlToHtml(renderedMjml);
    
    // Calculate size
    const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
    
    if (sizeKb > 100) {
      console.warn(`Email size ${sizeKb.toFixed(1)}KB exceeds 100KB limit`);
    }

    // Save to email folder if provided
    if (params.emailFolder) {
      await EmailFolderManager.saveHtml(params.emailFolder, html);
      await EmailFolderManager.saveMjml(params.emailFolder, renderedMjml);
      
      // Update metadata with rendering info
      await EmailFolderManager.updateMetadata(params.emailFolder, {
        status: 'processing'
      });
      
      console.log(`💾 T4: Saved HTML and MJML to email folder: ${params.emailFolder.campaignId}`);
    }

    const result: MjmlResult = {
      html,
      size_kb: Math.round(sizeKb * 10) / 10,
      mjml_source: renderedMjml
    };

    return {
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

  } catch (error) {
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

async function renderTemplate(mjmlTemplate: string, content: ContentInfo, assets: any): Promise<string> {
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
    throw new Error('No Figma assets available. Figma assets are required for email generation.');
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
    
    if (rabbitAssetPath) {
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

  // Template variables
  const variables = {
    subject: safeContent.subject,
    preheader: safeContent.preheader,
    body: safeContent.body.replace(/\n/g, '</mj-text><mj-text>'),
    cta: safeContent.cta,
    logo_url: 'https://kupibilet.ru/assets/logo.png',
    header_image: headerImage,
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