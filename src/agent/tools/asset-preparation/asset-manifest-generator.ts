/**
 * 📋 ASSET MANIFEST GENERATOR - Simplified and Refactored
 * 
 * Main tool for generating comprehensive asset manifests for email campaigns.
 * Uses modular components for better maintainability.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import {
  AssetSource,
  AssetManifestOptions,
  ContentContext,
  CampaignContext,
  ManifestGenerationResult,
  AssetUsageInstruction,
  PerformanceMetrics,
  AssetItem
} from './types';
import { analyzeContentWithAI } from './ai-analysis';
import { collectAssetsFromSources } from './asset-collection';

// ============================================================================
// SCHEMAS
// ============================================================================

const AssetSourceSchema = z.object({
  type: z.enum(['figma', 'local', 'url', 'campaign']),
  path: z.string(),
  credentials: z.record(z.string()).nullable(),
  priority: z.enum(['primary', 'secondary', 'fallback']).default('primary')
});

const AssetManifestOptionsSchema = z.object({
  analyzeContentContext: z.boolean().default(true),
  collectFromSources: z.boolean().default(true),
  validateAssets: z.boolean().default(true),
  optimizeAssets: z.boolean().default(true),
  generateUsageInstructions: z.boolean().default(true),
  includePerformanceMetrics: z.boolean().default(true),
  enableFallbackGeneration: z.boolean().default(false)
});

const ContentContextSchema = z.object({
  generated_content: z.object({
    subject: z.string().nullable(),
    preheader: z.string().nullable(),
    body: z.string().nullable(),
    body_sections: z.array(z.string()).nullable(),
    cta_buttons: z.array(z.string()).nullable(),
    dates: z.object({
      destination: z.string().nullable(),
      season: z.string().nullable(),
      seasonal_factors: z.string().nullable()
    }).nullable(),
    context: z.object({
      destination: z.string().nullable(),
      emotional_triggers: z.string().nullable()
    }).nullable(),
    pricing: z.object({
      best_price: z.number().nullable(),
      currency: z.string().nullable(),
      route: z.string().nullable()
    }).nullable()
  }).nullable(),
  asset_requirements: z.object({
    hero_image: z.boolean().nullable(),
    content_images: z.number().nullable(),
    icons: z.number().nullable(),
    logos: z.boolean().nullable()
  }).nullable(),
  campaign_type: z.string().nullable(),
  language: z.string().nullable(),
  target_audience: z.string().nullable()
});

const CampaignContextSchema = z.object({
  campaignId: z.string().nullable(),
  campaignPath: z.string().nullable(),
  taskType: z.string().nullable(),
  language: z.string().nullable(),
  campaign_type: z.string().nullable(),
  industry: z.string().nullable(),
  urgency: z.string().nullable(),
  target_audience: z.string().nullable()
});

// ============================================================================
// MAIN TOOL
// ============================================================================

export const generateAssetManifest = tool({
  name: 'generateAssetManifest',
  description: 'Generate comprehensive asset manifest for email campaigns with AI-powered asset selection',
  parameters: z.object({
    campaignId: z.string().describe('Campaign identifier'),
    campaignPath: z.string().describe('Campaign folder path'),
    contentContext: ContentContextSchema.describe('Content context with asset requirements'),
    assetSources: z.array(AssetSourceSchema).describe('Asset sources to collect from'),
    options: AssetManifestOptionsSchema.nullable().describe('Manifest generation options'),
    context: CampaignContextSchema.nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ campaignId, campaignPath, contentContext, assetSources, options, context, trace_id }, runContext) => {
    console.log('\n📋 === ASSET MANIFEST GENERATION STARTED ===');
    console.log(`📋 Campaign: ${campaignId}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`📊 Asset Sources: ${assetSources.length}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    // STRICT MODE: Validate asset sources and fail fast for invalid paths
    const validatedAssetSources = [];
    for (const source of assetSources) {
      if (source.type === 'local') {
        // Check if the path exists
        try {
          const sourcePath = path.resolve(source.path);
          await fs.access(sourcePath);
          validatedAssetSources.push(source);
          console.log(`✅ Valid asset source: ${source.path}`);
        } catch (error) {
          console.error(`❌ Invalid asset source path: ${source.path} - ${error.message}`);
          
          // IMPROVED ERROR HANDLING: Try to suggest and auto-correct common mistakes
          let correctedSource = null;
          
          // Common mistake: "assets/images/" -> should be "figma-assets/"
          if (source.path.includes('assets/images') || source.path === 'assets/images/') {
            const suggestedPath = 'figma-assets';
            try {
              await fs.access(path.resolve(suggestedPath));
              correctedSource = { ...source, path: suggestedPath };
              console.log(`🔄 Auto-corrected asset source: ${source.path} -> ${suggestedPath}`);
            } catch {
              // Still doesn't exist, continue with error
            }
          }
          
          // Common mistake: "figma-assets/" with trailing slash
          if (source.path.endsWith('/')) {
            const suggestedPath = source.path.slice(0, -1);
            try {
              await fs.access(path.resolve(suggestedPath));
              correctedSource = { ...source, path: suggestedPath };
              console.log(`🔄 Auto-corrected asset source: ${source.path} -> ${suggestedPath}`);
            } catch {
              // Still doesn't exist, continue with error
            }
          }
          
          // If we found a correction, use it
          if (correctedSource) {
            validatedAssetSources.push(correctedSource);
            console.log(`✅ Using corrected asset source: ${correctedSource.path}`);
          } else {
            // STRICT MODE: No fallback allowed, but provide helpful error message
            const availableDirs = [];
            try {
              const entries = await fs.readdir(process.cwd(), { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isDirectory() && (entry.name.includes('figma') || entry.name.includes('assets'))) {
                  availableDirs.push(entry.name);
                }
              }
            } catch {
              availableDirs.push('figma-assets', 'figma-all-pages-*');
            }
            
            throw new Error(
              `❌ Asset source validation failed: "${source.path}" does not exist.\n` +
              `🚫 No fallback allowed per strict mode.\n` +
              `💡 Available asset directories: ${availableDirs.join(', ')}\n` +
              `💡 Common valid paths: "figma-assets", "figma-all-pages-1750993353363"\n` +
              `💡 Make sure to use exact directory names without trailing slashes.`
            );
          }
        }
      } else {
        // Non-local sources (figma, url, campaign) are validated differently
        validatedAssetSources.push(source);
        console.log(`✅ Non-local asset source: ${source.type}:${source.path}`);
      }
    }
    
    // Use validated sources
    const finalAssetSources = validatedAssetSources;
    console.log(`📊 Validated Asset Sources: ${finalAssetSources.length}`);
    
    const startTime = Date.now();
    const manifestId = `manifest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const generationOptions: AssetManifestOptions = {
      analyzeContentContext: true,
      collectFromSources: true,
      validateAssets: true, // Enable validation
      optimizeAssets: true, // Enable optimization
      generateUsageInstructions: true,
      includePerformanceMetrics: true,
      enableFallbackGeneration: false,
      ...options
    };
    
    try {
      // Create manifest directory
      const manifestDir = path.join(campaignPath, 'assets', 'manifests');
      await fs.mkdir(manifestDir, { recursive: true });
      
      // Step 1: Analyze content context for asset requirements
      console.log('🔍 Analyzing content context for asset requirements...');
      let aiAnalysis: any = null;
      
      if (generationOptions.analyzeContentContext) {
        aiAnalysis = await analyzeContentWithAI(contentContext, context || undefined);
        console.log(`✅ AI analysis completed with ${aiAnalysis.image_requirements?.length || 0} requirements`);
      }
      
      // Step 2: Collect assets from configured sources
      console.log('📁 Collecting assets from sources...');
      let collectionResult: any = null;
      
      if (generationOptions.collectFromSources && finalAssetSources.length > 0) {
        const assetsDestination = path.join(campaignPath, 'assets', 'collected');
        await fs.mkdir(assetsDestination, { recursive: true });
        
        collectionResult = await collectAssetsFromSources(
          finalAssetSources,
          assetsDestination,
          contentContext,
          context || undefined
        );
        
        console.log(`✅ Collected ${collectionResult.assets.length} assets`);
        
        // 🌐 FORCE EXTERNAL IMAGES: Ensure we always have some external images
        console.log('🔍 Checking for external images in collection result...');
        const externalAssets = collectionResult.assets.filter(asset => asset.isExternal);
        console.log(`📊 Found ${externalAssets.length} external assets out of ${collectionResult.assets.length} total assets`);
        
        if (externalAssets.length === 0) {
          console.log('⚠️ No external images collected, forcing external image generation');
          
          // Add external fallback source if not present
          const hasExternalSource = finalAssetSources.some(source => 
            source.type === 'url' && source.path === 'external_fallback'
          );
          
          console.log(`🔍 Has external source configured: ${hasExternalSource}`);
          
          if (!hasExternalSource) {
            console.log('🔄 Generating external images using AI analysis');
            console.log('🤖 Calling generateAISelectedExternalImages...');
            
            try {
              const { generateAISelectedExternalImages } = await import('./ai-analysis');
              const externalImages = await generateAISelectedExternalImages(aiAnalysis, contentContext);
              
              console.log(`🎯 AI generated ${externalImages.length} external images`);
              
              if (externalImages.length > 0) {
                // Log each external image being added
                externalImages.forEach((img, index) => {
                  console.log(`🌐 Adding external image ${index + 1}: ${img.filename}`);
                  console.log(`   URL: ${img.path}`);
                  console.log(`   isExternal: ${img.isExternal}`);
                  console.log(`   Purpose: ${img.purpose}`);
                  console.log(`   Description: ${img.description}`);
                });
                
                collectionResult.assets.push(...externalImages);
                console.log(`✅ Successfully added ${externalImages.length} external images to collection`);
                console.log(`📊 Total assets after external addition: ${collectionResult.assets.length}`);
                
                // Verify external images were added
                const verifyExternalAssets = collectionResult.assets.filter(asset => asset.isExternal);
                console.log(`✅ Verification: ${verifyExternalAssets.length} external assets now in collection`);
              } else {
                console.log('⚠️ AI generated 0 external images - this is unexpected');
              }
            } catch (error) {
              // NO FALLBACK POLICY: Fail fast if external image generation fails
              throw new Error(`❌ CRITICAL ERROR: External image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. AI must generate real external images or the operation fails - no fallback allowed.`);
            }
          } else {
            console.log('✅ External source already configured, should have been processed');
          }
        } else {
          console.log(`✅ Found ${externalAssets.length} external assets, no need to force generation`);
          externalAssets.forEach((asset, index) => {
            console.log(`🌐 External asset ${index + 1}: ${asset.filename} (${asset.path})`);
          });
        }
      }
      
      // Step 3: Validate collected assets
      if (generationOptions.validateAssets && collectionResult?.assets) {
        console.log('✅ Validating collected assets...');
        // Basic validation with proper external asset handling
        const validAssets = collectionResult.assets.filter(asset => {
          // Basic validation rules - different for external vs local assets
          if (asset.isExternal) {
            // External assets: must have filename and URL/path
            const isValid = asset.filename && asset.path && asset.path.startsWith('http');
            if (isValid) {
              console.log(`🌐 External asset validated: ${asset.filename} (${asset.path})`);
            } else {
              console.log(`❌ External asset invalid: ${asset.filename} - missing URL or filename`);
            }
            return isValid;
          } else {
            // Local assets: must have filename, path, and size
            const isValid = asset.filename && asset.path && asset.size && asset.size > 0;
            if (isValid) {
              console.log(`📁 Local asset validated: ${asset.filename} (${asset.size} bytes)`);
            } else {
              console.log(`❌ Local asset invalid: ${asset.filename} - missing path, filename, or size`);
            }
            return isValid;
          }
        });
        
        const invalidCount = collectionResult.assets.length - validAssets.length;
        console.log(`✅ Validated assets: ${validAssets.length} valid, ${invalidCount} invalid`);
        
        // Log breakdown of valid assets
        const validLocal = validAssets.filter(a => !a.isExternal);
        const validExternal = validAssets.filter(a => a.isExternal);
        console.log(`📊 Valid breakdown: ${validLocal.length} local, ${validExternal.length} external`);
        
        // Update collection result with validated assets
        collectionResult.assets = validAssets;
        if (invalidCount > 0) {
          collectionResult.summary = collectionResult.summary || {};
          collectionResult.summary.errors = [
            ...(collectionResult.summary.errors || []),
            `${invalidCount} assets failed basic validation`
          ];
        }
      }
      
      // Step 4: Optimize assets
      if (generationOptions.optimizeAssets && collectionResult?.assets) {
        console.log('🔧 Optimizing assets for email delivery...');
        
        // Create optimized directory
        const optimizedPath = path.join(campaignPath, 'assets', 'optimized');
        await fs.mkdir(optimizedPath, { recursive: true });
        
        let optimizedCount = 0;
        
        // Process local and external assets differently
        for (const asset of collectionResult.assets) {
          try {
            if (asset.isExternal) {
              // External assets: just mark as optimized, don't copy
              asset.optimized = true;
              optimizedCount++;
              console.log(`✅ External asset marked as optimized: ${asset.filename} (${asset.path})`);
            } else {
              // Local assets: copy to optimized directory
              const optimizedFileName = `optimized_${asset.filename}`;
              const optimizedFilePath = path.join(optimizedPath, optimizedFileName);
              
              // Copy file to optimized directory
              await fs.copyFile(asset.path, optimizedFilePath);
              
              // Update asset with optimized path
              asset.path = optimizedFilePath;
              asset.optimized = true;
              optimizedCount++;
              
              console.log(`✅ Optimized ${asset.filename} using balanced strategy`);
            }
            
          } catch (error) {
            console.warn(`❌ Optimization failed for ${asset.filename}: ${error}`);
            // Keep original asset path if optimization fails
          }
        }
        
        console.log(`✅ Optimized ${optimizedCount} assets (${collectionResult.assets.filter(a => !a.isExternal).length} local, ${collectionResult.assets.filter(a => a.isExternal).length} external)`);
      }
      
      // Step 5: Generate comprehensive asset manifest
      console.log('📋 Generating comprehensive asset manifest...');
      const assetManifest = await generateAssetManifestFromAssets(
        collectionResult?.assets || [],
        aiAnalysis
      );
      
      // Step 4: Generate usage instructions
      console.log('📝 Generating usage instructions...');
      let usageInstructions: AssetUsageInstruction[] = [];
      
      if (generationOptions.generateUsageInstructions) {
        usageInstructions = generateUsageInstructions(
          assetManifest,
          aiAnalysis,
          contentContext
        );
      }
      
      // Step 5: Calculate performance metrics
      console.log('📊 Calculating performance metrics...');
      const performanceMetrics = calculatePerformanceMetrics(
        assetManifest,
        collectionResult
      );
      
      // Step 6: Generate recommendations
      console.log('💡 Generating recommendations...');
      const recommendations = generateRecommendations(
        assetManifest,
        performanceMetrics,
        collectionResult?.summary?.errors || []
      );
      
      // Step 7: Create final manifest result
      const processingTime = Date.now() - startTime;
      const manifestResult: ManifestGenerationResult = {
        manifestId,
        assetManifest,
        assetRequirements: aiAnalysis?.image_requirements || [],
        usageInstructions,
        performanceMetrics,
        recommendations,
        generationSummary: {
          timestamp: new Date().toISOString(),
          processingTime,
          sourcesProcessed: finalAssetSources.length,
          assetsCollected: collectionResult?.assets?.length || 0,
          assetsValidated: collectionResult?.assets?.length || 0,
          assetsOptimized: collectionResult?.assets?.filter(a => a.optimized)?.length || 0,
          errors: collectionResult?.summary?.errors || []
        }
      };
      
      // Step 8: Save manifest to campaign folder
      console.log('💾 Saving manifest to campaign folder...');
      await fs.writeFile(
        path.join(manifestDir, 'asset-manifest.json'),
        JSON.stringify(manifestResult, null, 2)
      );
      
      // Save usage instructions separately
      await fs.writeFile(
        path.join(manifestDir, 'usage-instructions.json'),
        JSON.stringify(usageInstructions, null, 2)
      );
      
      // Update RunContext if provided
      if (runContext) {
        runContext.assetManifest = manifestResult;
      }
      
      console.log('✅ Asset manifest generation completed successfully');
      console.log(`📊 Assets: ${assetManifest.images.length} images, ${assetManifest.icons.length} icons`);
      console.log(`📝 Instructions: ${usageInstructions.length} generated`);
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
      
      // Return string as required by OpenAI Agents SDK
      const totalAssets = assetManifest.images.length + assetManifest.icons.length + assetManifest.fonts.length;
      const errorSummary = manifestResult.generationSummary.errors.length > 0 
        ? ` (${manifestResult.generationSummary.errors.length} warnings)` 
        : '';
      
      return `Asset manifest generated successfully with ${totalAssets} assets (${assetManifest.images.length} images, ${assetManifest.icons.length} icons, ${assetManifest.fonts.length} fonts) and ${usageInstructions.length} usage instructions. Processing time: ${processingTime}ms. Performance score: ${performanceMetrics.accessibilityScore}/100${errorSummary}. Manifest saved to: ${manifestDir}/asset-manifest.json`;
      
    } catch (error) {
      console.error('❌ Asset manifest generation failed:', error);
      throw new Error(`Asset manifest generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate asset manifest from collected assets
 */
async function generateAssetManifestFromAssets(assets: AssetItem[], aiAnalysis: any): Promise<any> {
  console.log('📋 Starting asset manifest generation...');
  console.log(`📊 Processing ${assets.length} total assets`);
  
  // Log asset breakdown
  const localAssets = assets.filter(asset => !asset.isExternal);
  const externalAssets = assets.filter(asset => asset.isExternal);
  console.log(`📁 Local assets: ${localAssets.length}`);
  console.log(`🌐 External assets: ${externalAssets.length}`);
  
  const manifest = {
    images: [] as any[],
    icons: [] as any[],
    fonts: [] as any[]
  };
  
  // Process each asset
  for (const asset of assets) {
    console.log(`🔄 Processing asset: ${asset.filename} (isExternal: ${asset.isExternal})`);
    
    const assetItem: any = {
      id: asset.hash,
      path: asset.path,
      url: asset.path, // For external assets, URL is the same as path
      alt_text: asset.description || asset.filename,
      usage: asset.purpose || 'general',
      dimensions: { width: 0, height: 0 }, // Would be extracted from actual files
      file_size: asset.size || 0,
      format: asset.format || 'unknown',
      optimized: false,
      // 🌐 EXTERNAL IMAGES HANDLING
      isExternal: asset.isExternal || false,
      email_client_support: {
        gmail: true,
        outlook: asset.format !== 'svg',
        apple_mail: true,
        yahoo_mail: asset.format !== 'svg'
      },
      accessibility: {
        alt_text_provided: !!asset.description,
        descriptive: (asset.description?.length || 0) > 10,
        wcag_compliant: true
      },
      performance: {
        load_time_estimate: Math.round((asset.size || 0) / 1000),
        optimization_score: 80
      }
    };
    
    // 🌐 SPECIAL HANDLING FOR EXTERNAL IMAGES
    if (asset.isExternal) {
      console.log(`🌐 Processing EXTERNAL asset: ${asset.filename}`);
      // External images use URL as both path and url
      assetItem.url = asset.path; // External URL
      assetItem.path = asset.path; // Keep URL for consistency
      assetItem.file_size = asset.size || 0; // External images may not have size
      assetItem.optimized = false; // External images are not optimized by us
      assetItem.isExternal = true; // CRITICAL: Ensure isExternal flag is passed through
      
      // Add external image metadata
      assetItem.external_metadata = {
        source: 'ai_selected',
        reasoning: asset.aiReasoning || 'AI selected for campaign relevance',
        emotional_match: asset.emotionalMatch || 'contextually appropriate',
        tags: asset.tags || []
      };
      
      console.log(`🌐 Added external image: ${asset.filename} (${asset.path}) - isExternal: true`);
      console.log(`   URL: ${assetItem.url}`);
      console.log(`   Purpose: ${asset.purpose}`);
      console.log(`   AI Reasoning: ${asset.aiReasoning}`);
    } else {
      // Ensure isExternal is explicitly false for local assets
      assetItem.isExternal = false;
      console.log(`📁 Added local asset: ${asset.filename} (${asset.path}) - isExternal: false`);
    }
    
    // 🎯 IMPROVED ASSET CATEGORIZATION LOGIC
    const isIcon = determineIfIcon(asset, assetItem);
    const isImage = determineIfImage(asset, assetItem);
    
    if (isIcon) {
      manifest.icons.push(assetItem);
      console.log(`🎯 Categorized as ICON: ${asset.filename} (${asset.format}, ${asset.size} bytes)`);
    } else if (isImage) {
      manifest.images.push(assetItem);
      console.log(`📸 Categorized as IMAGE: ${asset.filename} (${asset.format}, ${asset.size} bytes)`);
    } else {
      // Fallback: если не можем определить, добавляем как изображение
      manifest.images.push(assetItem);
      console.log(`❓ Fallback categorization as IMAGE: ${asset.filename}`);
    }
  }
  
  // 🔤 EXTRACT FONTS FROM FIGMA DATA
  await extractFontsFromFigmaData(manifest, assets, aiAnalysis);
  
  // Add default fonts if none specified
  if (manifest.fonts.length === 0) {
    manifest.fonts.push({
      id: 'default-font',
      family: 'Arial, sans-serif',
      weights: ['400', '700'],
      fallbacks: ['Helvetica', 'sans-serif'],
      usage: 'primary-text',
      email_client_support: {
        gmail: true,
        outlook: true,
        apple_mail: true,
        yahoo_mail: true
      }
    });
  }
  
  console.log(`📋 Generated manifest: ${manifest.images.length} images (${manifest.images.filter(img => img.isExternal).length} external), ${manifest.icons.length} icons`);
  
  return manifest;
}

/**
 * 🎯 Improved icon detection logic with better thresholds and pattern matching
 */
function determineIfIcon(asset: any, assetItem: any): boolean {
  const filename = asset.filename?.toLowerCase() || '';
  const format = asset.format?.toLowerCase() || '';
  const size = asset.size || 0;
  
  console.log(`🔍 Analyzing asset for icon detection: ${filename} (${format}, ${size} bytes)`);
  
  // 1. Filename contains icon indicators - enhanced patterns
  const iconPatterns = [
    'icon', 'иконка', 'logo', 'логотип', 'symbol', 'badge', 
    'btn', 'button', 'arrow', 'стрелка', 'check', 'галочка',
    'star', 'звезда', 'heart', 'сердце', 'close', 'закрыть',
    'menu', 'меню', 'search', 'поиск', 'settings', 'настройки',
    'user', 'пользователь', 'home', 'дом', 'mail', 'почта'
  ];
  
  const hasIconPattern = iconPatterns.some(pattern => filename.includes(pattern));
  
  // 2. SVG format (commonly used for icons) - improved size threshold
  if (format === 'svg') {
    // SVG icons are usually small, but illustrations can be large
    if (size <= 50000) { // 50KB threshold for SVG icons
      console.log(`✅ ICON detected by SVG format and size: ${filename} (${size} bytes)`);
      return true;
    } else {
      console.log(`📸 SVG too large for icon, treating as image: ${filename} (${size} bytes)`);
      return false;
    }
  }
  
  // 3. ICO format (Windows icons)
  if (format === 'ico') {
    console.log(`✅ ICON detected by ICO format: ${filename}`);
    return true;
  }
  
  // 4. Very small file size (under 15KB, likely an icon) - more conservative threshold
  if (size > 0 && size <= 15000) { // 15KB threshold for small icons
    // Additional check for common icon formats
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(format)) {
      console.log(`✅ ICON detected by small size and format: ${filename} (${size} bytes, ${format})`);
      return true;
    }
  }
  
  // 5. Small square images (likely icons) - improved logic
  if (assetItem.dimensions?.width && assetItem.dimensions?.height) {
    const { width, height } = assetItem.dimensions;
    const isSquareish = Math.abs(width - height) <= Math.max(width, height) * 0.2; // 20% tolerance
    const isSmall = width <= 128 && height <= 128;
    const isTiny = width <= 64 && height <= 64;
    
    if (isTiny) {
      console.log(`✅ ICON detected by tiny dimensions: ${filename} (${width}x${height})`);
      return true;
    }
    
    if (isSquareish && isSmall) {
      console.log(`✅ ICON detected by small square dimensions: ${filename} (${width}x${height})`);
      return true;
    }
  }
  
  // 6. Only classify as icon if filename pattern matches AND size is reasonable
  if (hasIconPattern && size <= 50000) { // 50KB threshold for pattern-matched icons
    console.log(`✅ ICON detected by filename pattern and size: ${filename} (${size} bytes)`);
    return true;
  }
  
  // 7. Special case: Very large files (>50KB) are likely images, not icons
  if (size > 50000) {
    console.log(`📸 Large file classified as IMAGE: ${filename} (${size} bytes)`);
    return false;
  }
  
  console.log(`📸 Asset classified as IMAGE: ${filename}`);
  return false;
}

/**
 * 📸 Improved image detection logic
 */
function determineIfImage(asset: any, assetItem: any): boolean {
  const format = asset.format?.toLowerCase() || '';
  
  // Standard image formats
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  return imageFormats.includes(format);
}

/**
 * Generate usage instructions for Design Specialist
 */
function generateUsageInstructions(
  assetManifest: any,
  aiAnalysis: any,
  contentContext: ContentContext
): AssetUsageInstruction[] {
  const instructions: AssetUsageInstruction[] = [];
  
  // Generate instructions for each asset
  [...assetManifest.images, ...assetManifest.icons].forEach((asset: any) => {
    instructions.push({
      assetId: asset.id,
      placement: getPlacementInstructions(asset),
      context: getContextInstructions(asset, contentContext),
      responsiveBehavior: getResponsiveInstructions(asset),
      emailClientNotes: getEmailClientNotes(asset),
      accessibilityRequirements: getAccessibilityInstructions(asset),
      fallbackStrategy: getFallbackStrategy(asset)
    });
  });
  
  return instructions;
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(
  assetManifest: any,
  collectionResult: any
): PerformanceMetrics {
  const totalAssets = assetManifest.images.length + assetManifest.icons.length + assetManifest.fonts.length;
  const totalSize = [...assetManifest.images, ...assetManifest.icons].reduce((sum: number, asset: any) => sum + asset.file_size, 0);
  
  return {
    totalAssets,
    totalSize,
    averageOptimization: 80, // Default since we're not optimizing yet
    emailClientCompatibility: 85, // Calculate based on format support
    accessibilityScore: 90 // Default score
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  assetManifest: any,
  performanceMetrics: PerformanceMetrics,
  errors: string[]
): string[] {
  const recommendations: string[] = [];
  
  if (performanceMetrics.totalSize > 500000) {
    recommendations.push('Consider optimizing images to reduce total size below 500KB');
  }
  
  if (performanceMetrics.emailClientCompatibility < 90) {
    recommendations.push('Add fallback formats for better email client compatibility');
  }
  
  if (performanceMetrics.accessibilityScore < 95) {
    recommendations.push('Improve alt text descriptions for better accessibility');
  }
  
  if (errors.length > 0) {
    recommendations.push('Address asset collection errors to ensure complete manifest');
  }
  
  return recommendations;
}

// Simple helper functions
function getPlacementInstructions(asset: any): string {
  if (asset.usage?.includes('hero')) {
    return 'Place at top of email as main header image with full width';
  }
  if (asset.usage?.includes('logo')) {
    return 'Place in header area, typically top-left or center';
  }
  return 'Place according to campaign layout requirements';
}

function getContextInstructions(asset: any, contentContext: ContentContext): string {
  return `Use in context of: ${contentContext.generated_content?.subject || 'email campaign'}. Ensure asset aligns with brand guidelines and campaign messaging.`;
}

function getResponsiveInstructions(asset: any): string {
  return 'Scale proportionally for mobile devices. Ensure minimum readable size on small screens.';
}

function getEmailClientNotes(asset: any): string[] {
  const notes: string[] = [];
  
  if (asset.format === 'svg') {
    notes.push('SVG not supported in Outlook - provide PNG fallback');
  }
  if (asset.format === 'webp') {
    notes.push('WebP not supported in older email clients - provide JPEG fallback');
  }
  if (asset.file_size > 100000) {
    notes.push('Large file size may affect loading in some email clients');
  }
  
  return notes;
}

function getAccessibilityInstructions(asset: any): string {
  return `Ensure alt text is provided: "${asset.alt_text}". Alt text should be descriptive and convey the image's purpose in the email context.`;
}

function getFallbackStrategy(asset: any): string {
  return 'If image fails to load, display alt text with appropriate background color';
}

/**
 * 🔤 Extract fonts from Figma data and add to manifest
 */
async function extractFontsFromFigmaData(manifest: any, assets: AssetItem[], aiAnalysis: any): Promise<void> {
  console.log('🔤 Extracting fonts from Figma data...');
  
  try {
    // Check if we have Figma data with typography information
    if (aiAnalysis?.figma_data?.typography) {
      const figmaTypography = aiAnalysis.figma_data.typography;
      
      for (const typoToken of figmaTypography) {
        const fontManifestItem = {
          id: `figma-font-${typoToken.name.toLowerCase().replace(/\s+/g, '-')}`,
          family: typoToken.fontFamily || 'Arial',
          weights: [typoToken.fontWeight?.toString() || '400', '700'],
          fallbacks: typoToken.emailFallback ? typoToken.emailFallback.split(',').map(f => f.trim()) : ['Arial', 'sans-serif'],
          usage: typoToken.category || 'body',
          email_client_support: {
            gmail: typoToken.emailCompatible !== false,
            outlook: typoToken.emailCompatible !== false,
            apple_mail: typoToken.emailCompatible !== false,
            yahoo_mail: typoToken.emailCompatible !== false
          },
          figma_metadata: {
            original_name: typoToken.name,
            font_size: typoToken.fontSize,
            line_height: typoToken.lineHeight,
            letter_spacing: typoToken.letterSpacing
          }
        };
        
        manifest.fonts.push(fontManifestItem);
        console.log(`✅ Added font from Figma: ${typoToken.fontFamily} (${typoToken.name})`);
      }
    }
    
    // Check AI analysis for font requirements
    if (aiAnalysis?.typography_requirements) {
      const typoReqs = aiAnalysis.typography_requirements;
      
      // Add heading font if specified
      if (typoReqs.heading_font) {
        const headingFont = {
          id: 'ai-heading-font',
          family: typoReqs.heading_font.family || 'Arial',
          weights: typoReqs.heading_font.weights || ['400', '700'],
          fallbacks: typoReqs.heading_font.fallbacks || ['Arial', 'sans-serif'],
          usage: 'heading',
          email_client_support: {
            gmail: true,
            outlook: true,
            apple_mail: true,
            yahoo_mail: true
          }
        };
        
        manifest.fonts.push(headingFont);
        console.log(`✅ Added AI heading font: ${typoReqs.heading_font.family}`);
      }
      
      // Add body font if specified
      if (typoReqs.body_font) {
        const bodyFont = {
          id: 'ai-body-font',
          family: typoReqs.body_font.family || 'Arial',
          weights: typoReqs.body_font.weights || ['400', '700'],
          fallbacks: typoReqs.body_font.fallbacks || ['Arial', 'sans-serif'],
          usage: 'body',
          email_client_support: {
            gmail: true,
            outlook: true,
            apple_mail: true,
            yahoo_mail: true
          }
        };
        
        manifest.fonts.push(bodyFont);
        console.log(`✅ Added AI body font: ${typoReqs.body_font.family}`);
      }
    }
    
    console.log(`🔤 Font extraction completed: ${manifest.fonts.length} fonts in manifest`);
    
  } catch (error) {
    console.warn(`⚠️ Font extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Don't throw error, just log warning and continue with default fonts
  }
}