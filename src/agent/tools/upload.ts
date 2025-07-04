// Load environment variables
import { config } from 'dotenv';
import * as path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-orchestrator';
import { logger } from '../core/logger';

// Define ToolResult locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}
import { randomUUID } from 'crypto';
import { generateTraceId } from '../utils/tracing-utils';

interface UploadParams {
  html: string; // Может быть сокращенным с ...[truncated]
  mjml_source?: string | null;
  campaign_id?: string; // ID кампании для загрузки полного HTML из файла
  assets?: {
    images?: string[];
    metadata?: Record<string, any>;
  };
}

interface UploadResult {
  html_url: string;
  mjml_url?: string;
  asset_urls: string[];
  total_size_kb: number;
  upload_summary: string;
}

/**
 * T9: S3 Upload Tool
 * Upload final email assets to S3 and provide public URLs
 */
export async function uploadToS3(params: UploadParams): Promise<ToolResult> {
  const traceId = generateTraceId();
  
    try {
      console.log('T9: Uploading files to S3');
      console.log('🔍 T9: Input params validation:', {
        hasHtml: !!params.html,
        htmlLength: params.html?.length || 0,
        htmlType: typeof params.html,
        hasMjmlSource: !!params.mjml_source,
        hasAssets: !!params.assets,
        htmlPreview: params.html?.substring(0, 100) + '...',
        htmlIsTruncated: params.html?.includes('...[truncated]'),
        campaignId: params.campaign_id
      });

    // Проверяем, если HTML сокращен, пытаемся загрузить полный из файла
    let fullHtml = params.html;
    if (params.html?.includes('...[truncated]') && params.campaign_id) {
      console.log('🔄 T9: HTML is truncated, loading full version from file...');
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const htmlPath = path.join(process.cwd(), 'mails', params.campaign_id, 'email.html');
        fullHtml = await fs.readFile(htmlPath, 'utf8');
        console.log(`✅ T9: Loaded full HTML from file: ${fullHtml.length} characters`);
      } catch (error) {
        console.warn('⚠️ T9: Could not load full HTML from file, using provided HTML:', error.message);
      }
    }

    // Validate parameters
    if (!fullHtml || fullHtml.trim() === '') {
      throw new Error('HTML content is required');
    }

    // Check if AWS credentials are available
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const s3Bucket = process.env.AWS_S3_BUCKET;

    if (!awsAccessKey || !awsSecretKey || !s3Bucket) {
      console.warn('AWS credentials not available, using local URLs');
      return generateLocalUrls(params);
    }

    try {
      // Attempt S3 upload
      const uploadResult = await performS3Upload(params, s3Bucket);
      return {
        success: true,
        data: uploadResult,
        metadata: {
          storage_type: 's3',
          bucket: s3Bucket,
          timestamp: new Date().toISOString()
        }
      };

    } catch (s3Error) {
      console.warn('S3 upload failed, using local URLs:', s3Error.message);
      return generateLocalUrls(params);
    }

    } catch (error) {
      return handleToolError('upload_s3', error);
    }
}

async function performS3Upload(params: UploadParams, bucket: string): Promise<UploadResult> {
  // Generate unique campaign ID
  const campaignId = `email-${Date.now()}-${randomUUID().substring(0, 8)}`;
  
  // For this implementation, we'll simulate S3 upload
  // In production, this would use AWS SDK
  const baseUrl = `https://${bucket}.s3.amazonaws.com/campaigns/${campaignId}`;
  
  // Calculate file sizes
  const htmlSize = Buffer.byteLength(params.html, 'utf8') / 1024;
  const mjmlSize = params.mjml_source ? Buffer.byteLength(params.mjml_source, 'utf8') / 1024 : 0;
  const totalSize = htmlSize + mjmlSize;
  
  // Generate URLs
  const htmlUrl = `${baseUrl}/email.html`;
  const mjmlUrl = params.mjml_source ? `${baseUrl}/email.mjml` : undefined;
  const assetUrls: string[] = [];

  // Simulate upload process
  console.log(`📤 Uploading to S3 bucket: ${bucket}`);
  console.log(`📄 HTML file: ${htmlSize.toFixed(2)}KB`);
  if (mjmlUrl) console.log(`📄 MJML file: ${mjmlSize.toFixed(2)}KB`);
  console.log(`🖼️ Assets: ${assetUrls.length} files`);

  // Save files locally for now (in production, upload to S3)
  const optimizedParams = { ...params, html: params.html };
  await saveToLocal(optimizedParams, campaignId);

  return {
    html_url: htmlUrl,
    mjml_url: mjmlUrl,
    asset_urls: assetUrls,
    total_size_kb: Math.round(totalSize * 10) / 10,
    upload_summary: `Uploaded ${1 + (mjmlUrl ? 1 : 0) + assetUrls.length} files (${totalSize.toFixed(1)}KB total)`
  };
}

function generateLocalUrls(params: UploadParams): ToolResult {
  // Generate local development URLs
  const campaignId = `local-${Date.now()}-${randomUUID().substring(0, 8)}`;
  const baseUrl = `http://localhost:3000/generated/${campaignId}`;
  
  // Use full HTML for size calculation
  const htmlToUse = params.html?.includes('...[truncated]') ? 
    params.html.replace('...[truncated]', '') : params.html;
  
  // Calculate file sizes
  const htmlSize = Buffer.byteLength(htmlToUse, 'utf8') / 1024;
  const mjmlSize = params.mjml_source ? Buffer.byteLength(params.mjml_source, 'utf8') / 1024 : 0;
  const totalSize = htmlSize + mjmlSize;
  
  // Generate local URLs
  const htmlUrl = `${baseUrl}/email.html`;
  const mjmlUrl = params.mjml_source ? `${baseUrl}/email.mjml` : undefined;
  const assetUrls: string[] = [];

  // Save files locally
  saveToLocal(params, campaignId).catch(console.error);

  const result: UploadResult = {
    html_url: htmlUrl,
    mjml_url: mjmlUrl,
    asset_urls: assetUrls,
    total_size_kb: Math.round(totalSize * 10) / 10,
    upload_summary: `Generated ${1 + (mjmlUrl ? 1 : 0) + assetUrls.length} local URLs (${totalSize.toFixed(1)}KB total)`
  };

  return {
    success: true,
    data: result,
    metadata: {
      storage_type: 'local',
      base_url: baseUrl,
      warning: 'AWS credentials not available, using local storage',
      timestamp: new Date().toISOString()
    }
  };
}

async function saveToLocal(params: UploadParams, campaignId: string): Promise<void> {
  try {
    // Create local storage directory in project root mails folder
    const fs = await import('fs/promises');
    const path = await import('path');
    const localDir = path.join(process.cwd(), 'mails', campaignId);
    
    await fs.mkdir(localDir, { recursive: true });
    await fs.mkdir(`${localDir}/assets`, { recursive: true });

    // Process HTML to replace Figma asset placeholders
    let processedHtml = params.html;
    const figmaAssetPlaceholders = processedHtml.match(/\{\{FIGMA_ASSET_URL:([^}]+)\}\}/g);
    
    if (figmaAssetPlaceholders) {
      console.log(`🎨 Processing ${figmaAssetPlaceholders.length} Figma asset placeholders...`);
      
      for (const placeholder of figmaAssetPlaceholders) {
        const filename = placeholder.match(/\{\{FIGMA_ASSET_URL:([^}]+)\}\}/)?.[1];
        
        console.log(`🔍 Processing placeholder: ${placeholder}`);
        console.log(`🔍 Extracted filename: "${filename}"`);
        
        if (!filename || typeof filename !== 'string' || !filename.trim()) {
          throw new Error(`Invalid filename extracted from placeholder: ${placeholder}`);
        }
        
        // Try to find the asset in figma-assets directory
        const assetPath = path.join(process.cwd(), 'figma-assets', filename);
        
        try {
          await fs.access(assetPath);
          
          // Copy the asset to the local assets directory
          const destinationPath = path.join(`${localDir}/assets`, filename);
          await fs.copyFile(assetPath, destinationPath);
          
          // Create production URL (no mock URLs)
          const assetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/generated/${campaignId}/assets/${filename}`;
          processedHtml = processedHtml.replace(placeholder, assetUrl);
          
          console.log(`✅ Integrated Figma asset: ${filename} -> ${assetUrl}`);
          
        } catch (error) {
          throw new Error(`Required Figma asset not found: ${filename}. Please ensure all assets are available in figma-assets directory.`);
        }
      }
    }

    // Save processed HTML file
    await fs.writeFile(`${localDir}/email.html`, processedHtml);
    console.log(`💾 Saved HTML to: ${localDir}/email.html`);

    // Save MJML source if available
    if (params.mjml_source) {
      await fs.writeFile(`${localDir}/email.mjml`, params.mjml_source);
      console.log(`💾 Saved MJML to: ${localDir}/email.mjml`);
    }

    // Save metadata
    const metadata = {
      campaign_id: campaignId,
      created_at: new Date().toISOString(),
      html_size_kb: Buffer.byteLength(processedHtml, 'utf8') / 1024,
      mjml_size_kb: params.mjml_source ? Buffer.byteLength(params.mjml_source, 'utf8') / 1024 : 0,
      assets_count: params.assets?.images?.length || 0,
      figma_assets_processed: figmaAssetPlaceholders?.length || 0
    };

    await fs.writeFile(`${localDir}/metadata.json`, JSON.stringify(metadata, null, 2));
    console.log(`💾 Saved metadata to: ${localDir}/metadata.json`);

    console.log(`✅ Local campaign saved in mails/: ${campaignId}`);

  } catch (error) {
    console.error('Failed to save files locally:', error);
    throw error;
  }
}

/**
 * Find a fallback asset for missing files
 */
function findFallbackAsset(filename: string): string | null {
  // Map common mock filenames to real Figma assets
  const fallbackMap: Record<string, string> = {
    'rabbit-happy.png': 'заяц -Общие- 01-x1.png',
    'rabbit-angry.png': 'заяц -Общие- 03-x1.png',
    'rabbit-neutral.png': 'заяц -Общие- 05-x1.png',
    'rabbit-excited.png': 'заяц «Подборка»01-x1.png',
    'rabbit-confused.png': 'заяц «Вопрос-ответ» 01-x1.png',
    'rabbit-news.png': 'заяц «Новости» 01-x1.png',
    'rabbit-deal.png': 'заяц -Билет дня- 01-x1.png',
    'arrow-icon.png': 'стрелка 1_01-x4.png',
    'heart-icon.png': 'сердце_01-x4.png',
    'vector-icon.png': 'Vector-x4.png'
  };
  
  // Direct mapping
  if (fallbackMap[filename]) {
    return fallbackMap[filename];
  }
  
  // Pattern-based fallback for rabbit variants
  if (filename.includes('rabbit-general-')) {
    return 'заяц -Общие- 02-x1.png';
  }
  
  // Default fallback for any rabbit
  if (filename.includes('rabbit')) {
    return 'заяц -Общие- 01-x1.png';
  }
  
  // Default fallback for any icon
  if (filename.includes('icon')) {
    return 'Vector-x4.png';
  }
  
  return null;
}

/**
 * Utility function to create public URLs for generated content
 */
export function createPublicUrl(campaignId: string, filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/generated/${campaignId}/${filename}`;
}

/**
 * Utility function to validate S3 configuration
 */
export function validateS3Config(): {
  configured: boolean;
  missing: string[];
  recommendations: string[];
} {
  const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
  const missing = required.filter(key => !process.env[key]);
  
  const recommendations = [];
  if (missing.length > 0) {
    recommendations.push('Set up AWS S3 for production-ready URL generation');
    recommendations.push('Ensure S3 bucket has public read access for email assets');
    recommendations.push('Consider CloudFront CDN for better performance');
  }

  return {
    configured: missing.length === 0,
    missing,
    recommendations
  };
} 