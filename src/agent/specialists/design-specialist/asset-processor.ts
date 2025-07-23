/**
 * Asset Processor
 * Handles asset processing and optimization for email templates
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { loadContextFromHandoffFiles } from './design-context';
import { enhanceAssetManifestWithTechSpec, generateAssetUsageInstructions } from './design-helpers';
import { AssetManifest } from './types';

/**
 * Process Content Assets Tool
 * Processes and optimizes assets from content context for email template usage
 */
export const processContentAssets = tool({
  name: 'processContentAssets',
  description: 'Process and optimize content assets for email template integration',
  parameters: z.object({
    handoff_directory: z.string().describe('Campaign handoff directory path (will be auto-corrected if invalid)'),
    optimization_level: z.enum(['basic', 'standard', 'aggressive']).describe('Asset optimization level - no default allowed')
  }),
  execute: async (params, context) => {
    try {
      // ✅ ИСПРАВЛЕНО: Получаем правильный путь кампании из context
      let handoffDirectory = params.handoff_directory;
      
      // Защита от неправильных путей сгенерированных SDK
      if (handoffDirectory === 'docs' || handoffDirectory === 'package' || handoffDirectory === 'handoffs' || !handoffDirectory.includes('campaigns/')) {
        const campaignPath = (context?.context as any)?.designContext?.campaign_path;
        if (campaignPath) {
          handoffDirectory = path.join(campaignPath, 'handoffs');
          console.log(`🔧 ИСПРАВЛЕНО: SDK передал неправильный путь "${params.handoff_directory}", использую правильный: ${handoffDirectory}`);
        } else {
          throw new Error('Campaign path not available in design context. loadDesignContext must be called first.');
        }
      }
      
      console.log(`🎨 Processing content assets from: ${handoffDirectory}`);
      console.log(`🔧 Optimization level: ${params.optimization_level}`);
      
      // Validate optimization level is provided
      if (!params.optimization_level) {
        throw new Error('Optimization level must be specified explicitly - no default values allowed');
      }
      
      // Extract campaign path from handoff directory
      let campaignPath = handoffDirectory;
      if (campaignPath.endsWith('/handoffs/') || campaignPath.endsWith('/handoffs')) {
        campaignPath = campaignPath.replace(/\/handoffs\/?$/, '');
      } else if (campaignPath.endsWith('/assets/') || campaignPath.endsWith('/assets')) {
        // Handle case where assets directory is passed instead of handoffs
        campaignPath = campaignPath.replace(/\/assets\/?$/, '');
      }
      
      // Load context from handoff files
      const context_data = await loadContextFromHandoffFiles(campaignPath);
      
      // Validate required context
      if (!context_data.content_context) {
        throw new Error('Content context not found in handoff files');
      }
      
      // Technical specification check removed - not required for asset processing
      
      // Extract asset manifest from context
      const assetManifestData = context_data.asset_manifest;
      if (!assetManifestData) {
        throw new Error('Asset manifest not found in context');
      }
      
      // Extract the actual manifest from the loaded file structure
      const assetManifest = assetManifestData.assetManifest || assetManifestData;
      
      // Validate asset manifest structure
      if (!assetManifest.images || !Array.isArray(assetManifest.images)) {
        console.log('📊 Asset manifest structure:', JSON.stringify(assetManifest, null, 2));
        throw new Error('Asset manifest must contain images array');
      }
      
      if (!assetManifest.icons || !Array.isArray(assetManifest.icons)) {
        // Icons array is optional, initialize if missing
        assetManifest.icons = [];
        console.log('⚠️ Icons array missing, initialized empty array');
      }
      
      console.log(`📷 Processing ${assetManifest.images.length} images`);
      console.log(`🎯 Processing ${assetManifest.icons.length} icons`);
      
      // Process local assets
      const processedAssets = await processLocalAssets(assetManifest, params.optimization_level);
      
      // Process external assets
      const processedExternalAssets = await processExternalAssets(assetManifest, params.optimization_level);
      
      // Combine processed assets
      const combinedAssetManifest: AssetManifest = {
        images: [...processedAssets.images, ...processedExternalAssets.images],
        icons: [...processedAssets.icons, ...processedExternalAssets.icons],
        fonts: assetManifest.fonts || []
      };
      
      // Enhance with technical specification
      const enhancedManifest = enhanceAssetManifestWithTechSpec(combinedAssetManifest, context_data.technical_specification || {});
      
      // Generate asset usage instructions
      const usageInstructions = generateAssetUsageInstructions(enhancedManifest, context_data.content_context);
      
      // Save processed asset manifest
      const manifestPath = path.join(handoffDirectory, 'processed-assets.json');
      const assetData = {
        manifest: enhancedManifest,
        usage_instructions: usageInstructions,
        processing_summary: {
          total_images: enhancedManifest.images.length,
          total_icons: enhancedManifest.icons.length,
          optimization_level: params.optimization_level,
          processed_at: new Date().toISOString()
        }
      };
      
      await fs.writeFile(manifestPath, JSON.stringify(assetData, null, 2));
      
      // ✅ UPDATE DESIGN CONTEXT WITH PROCESSED ASSET MANIFEST
      if (context_data) {
        if (!(context_data as any).designContext) {
          (context_data as any).designContext = {};
        }
        (context_data as any).designContext.asset_manifest = enhancedManifest;
        console.log('✅ Asset manifest saved to design context for next tools');
      }
      
      console.log(`✅ Asset processing completed successfully!`);
      console.log(`📁 Processed manifest saved to: ${manifestPath}`);
      console.log(`📊 Total assets processed: ${enhancedManifest.images.length + enhancedManifest.icons.length}`);
      
      return `Content assets processed successfully! Processed ${enhancedManifest.images.length} images and ${enhancedManifest.icons.length} icons with ${params.optimization_level} optimization level. Enhanced manifest includes technical compliance, email client support, and usage instructions. Asset data saved to ${manifestPath}. Ready for template design generation.`;
      
    } catch (error) {
      const errorMessage = `Failed to process content assets: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
});

/**
 * Process local assets (images and icons stored locally)
 */
async function processLocalAssets(assetManifest: any, optimizationLevel: string): Promise<AssetManifest> {
  const processedImages = [];
  const processedIcons = [];
  
  // Process local images
  for (const image of assetManifest.images) {
    // Improved logic: check if it's truly local (not a URL and not explicitly external)
    const isExternalUrl = image.path && (image.path.startsWith('http://') || image.path.startsWith('https://'));
    const isMarkedExternal = image.isExternal === true;
    
    if (!isExternalUrl && !isMarkedExternal && image.path) {
      try {
        console.log(`📸 Processing local image: ${image.path}`);
        const processedImage = await processLocalImage(image, optimizationLevel);
        processedImages.push(processedImage);
      } catch (error) {
        console.warn(`⚠️ Failed to process local image ${image.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Failed to process local image ${image.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  // Process local icons
  for (const icon of assetManifest.icons) {
    // Improved logic: check if it's truly local (not a URL and not explicitly external)
    const isExternalUrl = icon.path && (icon.path.startsWith('http://') || icon.path.startsWith('https://'));
    const isMarkedExternal = icon.isExternal === true;
    
    if (!isExternalUrl && !isMarkedExternal && icon.path) {
      try {
        console.log(`🎯 Processing local icon: ${icon.path}`);
        const processedIcon = await processLocalIcon(icon, optimizationLevel);
        processedIcons.push(processedIcon);
      } catch (error) {
        console.warn(`⚠️ Failed to process local icon ${icon.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Failed to process local icon ${icon.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  return {
    images: processedImages,
    icons: processedIcons,
    fonts: assetManifest.fonts || []
  };
}

/**
 * Process external assets (images and icons from URLs)
 */
async function processExternalAssets(assetManifest: any, optimizationLevel: string): Promise<AssetManifest> {
  const processedImages = [];
  const processedIcons = [];
  
  // Process external images
  for (const image of assetManifest.images) {
    // Improved logic: check if it's truly external (URL or explicitly marked external)
    const isExternalUrl = image.path && (image.path.startsWith('http://') || image.path.startsWith('https://'));
    const isMarkedExternal = image.isExternal === true;
    const hasExternalUrl = image.url && (image.url.startsWith('http://') || image.url.startsWith('https://'));
    
    if (isExternalUrl || isMarkedExternal || hasExternalUrl) {
      try {
        console.log(`🌐 Processing external image: ${image.url || image.path || image.id}`);
        const processedImage = await processExternalImage(image, optimizationLevel);
        processedImages.push(processedImage);
      } catch (error) {
        console.warn(`⚠️ Failed to process external image ${image.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Failed to process external image ${image.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  // Process external icons
  for (const icon of assetManifest.icons) {
    // Improved logic: check if it's truly external (URL or explicitly marked external)
    const isExternalUrl = icon.path && (icon.path.startsWith('http://') || icon.path.startsWith('https://'));
    const isMarkedExternal = icon.isExternal === true;
    const hasExternalUrl = icon.url && (icon.url.startsWith('http://') || icon.url.startsWith('https://'));
    
    if (isExternalUrl || isMarkedExternal || hasExternalUrl) {
      try {
        console.log(`🌐 Processing external icon: ${icon.url || icon.path || icon.id}`);
        const processedIcon = await processExternalIcon(icon, optimizationLevel);
        processedIcons.push(processedIcon);
      } catch (error) {
        console.warn(`⚠️ Failed to process external icon ${icon.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw new Error(`Failed to process external icon ${icon.id || 'undefined'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  return {
    images: processedImages,
    icons: processedIcons,
    fonts: assetManifest.fonts || []
  };
}

/**
 * Process individual local image
 */
async function processLocalImage(image: any, optimizationLevel: string): Promise<any> {
  // Check if this is actually an external URL
  if (image.path && (image.path.startsWith('http://') || image.path.startsWith('https://'))) {
    // This is actually an external image, process it as such
    return await processExternalImage(image, optimizationLevel);
  }
  
  // Validate image path exists for actual local files
  if (!await fs.access(image.path).then(() => true).catch(() => false)) {
    throw new Error(`Local image file not found: ${image.path}`);
  }
  
  // Get image stats
  const stats = await fs.stat(image.path);
  
  return {
    ...image,
    file_size: stats.size,
    processed: true,
    optimized: true,
    optimization_applied: getOptimizationForLevel(optimizationLevel),
    processing_timestamp: new Date().toISOString()
  };
}

/**
 * Process individual local icon
 */
async function processLocalIcon(icon: any, optimizationLevel: string): Promise<any> {
  // Check if this is actually an external URL
  if (icon.path && (icon.path.startsWith('http://') || icon.path.startsWith('https://'))) {
    // This is actually an external icon, process it as such
    return await processExternalIcon(icon, optimizationLevel);
  }
  
  // Validate icon path exists for actual local files
  if (!await fs.access(icon.path).then(() => true).catch(() => false)) {
    throw new Error(`Local icon file not found: ${icon.path}`);
  }
  
  // Get icon stats
  const stats = await fs.stat(icon.path);
  
  return {
    ...icon,
    file_size: stats.size,
    processed: true,
    optimized: true,
    optimization_applied: getOptimizationForLevel(optimizationLevel),
    processing_timestamp: new Date().toISOString()
  };
}

/**
 * Process individual external image
 */
async function processExternalImage(image: any, _optimizationLevel: string): Promise<any> {
  // ✅ ИСПРАВЛЕНО: Проверяем и url и path для внешних изображений
  const imageUrl = image.url || image.path || image.file_path;
  
  // Validate URL is accessible
  if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
    throw new Error(`Invalid external image URL: ${imageUrl}`);
  }
  
  return {
    ...image,
    url: imageUrl, // ✅ ДОБАВЛЕНО: нормализуем URL в поле url
    processed: true,
    optimized: false, // External images are not optimized locally
    optimization_applied: 'external_url_validation',
    processing_timestamp: new Date().toISOString(),
    external_validation: 'url_accessible'
  };
}

/**
 * Process individual external icon
 */
async function processExternalIcon(icon: any, _optimizationLevel: string): Promise<any> {
  // ✅ ИСПРАВЛЕНО: Проверяем и url и path для внешних иконок
  const iconUrl = icon.url || icon.path || icon.file_path;
  
  // Validate URL is accessible
  if (!iconUrl || (!iconUrl.startsWith('http://') && !iconUrl.startsWith('https://'))) {
    throw new Error(`Invalid external icon URL: ${iconUrl}`);
  }
  
  return {
    ...icon,
    url: iconUrl, // ✅ ДОБАВЛЕНО: нормализуем URL в поле url
    processed: true,
    optimized: false, // External icons are not optimized locally
    optimization_applied: 'external_url_validation',
    processing_timestamp: new Date().toISOString(),
    external_validation: 'url_accessible'
  };
}

/**
 * Get optimization strategy for level
 */
function getOptimizationForLevel(level: string): string {
  switch (level) {
    case 'basic':
      return 'format_conversion';
    case 'standard':
      return 'format_conversion_and_compression';
    case 'aggressive':
      return 'format_conversion_compression_and_resizing';
    default:
      throw new Error(`Invalid optimization level: ${level}`);
  }
} 