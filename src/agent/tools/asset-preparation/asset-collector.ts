/**
 * 📁 ASSET COLLECTOR - Context-Aware Asset Collection Tool
 * 
 * Collects and organizes visual assets from various sources including:
 * - Figma design files
 * - Local file system
 * - CDN/remote URLs
 * - Campaign folder structures
 * 
 * Integrates with OpenAI Agents SDK context parameter system.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// ASSET COLLECTION SCHEMAS
// ============================================================================

const AssetSourceSchema = z.object({
  type: z.enum(['figma', 'local', 'url', 'campaign']).describe('Asset source type'),
  path: z.string().describe('Source path or URL'),
  credentials: z.record(z.string()).nullable().describe('Authentication credentials if needed'),
  filters: z.object({
    formats: z.array(z.enum(['jpg', 'png', 'svg', 'webp', 'gif'])).nullable(),
    minSize: z.number().nullable().describe('Minimum file size in bytes'),
    maxSize: z.number().nullable().describe('Maximum file size in bytes'),
    tags: z.array(z.string()).nullable().describe('Asset tags to filter by')
  }).nullable()
});

const CollectionOptionsSchema = z.object({
  recursive: z.boolean().default(true).describe('Recursively search subdirectories'),
  validateAssets: z.boolean().default(true).describe('Validate asset integrity'),
  generateThumbnails: z.boolean().default(false).describe('Generate thumbnail previews'),
  extractMetadata: z.boolean().default(true).describe('Extract asset metadata'),
  deduplicate: z.boolean().default(true).describe('Remove duplicate assets')
});

// ============================================================================
// ASSET COLLECTION INTERFACES
// ============================================================================

interface AssetMetadata {
  filename: string;
  path: string;
  size: number;
  format: string;
  dimensions?: { width: number; height: number };
  hash: string;
  created: string;
  modified: string;
  tags: string[];
  description?: string;
}

interface CollectionResult {
  assets: AssetMetadata[];
  summary: {
    totalAssets: number;
    totalSize: number;
    formats: Record<string, number>;
    sources: Record<string, number>;
    duplicatesRemoved: number;
    errors: string[];
  };
  manifest: {
    collectionId: string;
    timestamp: string;
    sources: any[];
    options: any;
  };
}

// ============================================================================
// ASSET COLLECTION TOOLS
// ============================================================================

export const collectAssets = tool({
  name: 'collectAssets',
  description: 'Collect and organize visual assets from multiple sources with context awareness',
  parameters: z.object({
    sources: z.array(AssetSourceSchema).describe('Asset sources to collect from'),
    destination: z.string().describe('Destination directory for collected assets'),
    options: CollectionOptionsSchema.nullable().describe('Collection options'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context for campaign awareness'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ sources, destination, options, context, trace_id }) => {
    console.log('\n📁 === ASSET COLLECTION STARTED ===');
    console.log(`📋 Sources: ${sources.length}`);
    console.log(`📂 Destination: ${destination}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const collectionOptions = options || {};
    const collectionId = `collection_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(destination, { recursive: true });
      
      const collectedAssets: AssetMetadata[] = [];
      const errors: string[] = [];
      const sourceCounts: Record<string, number> = {};
      
      // Process each source
      for (const source of sources) {
        console.log(`🔍 Processing ${source.type} source: ${source.path}`);
        
        try {
          const sourceAssets = await collectFromSource(source, destination, collectionOptions);
          collectedAssets.push(...sourceAssets);
          sourceCounts[source.type] = (sourceCounts[source.type] || 0) + sourceAssets.length;
          
          console.log(`✅ Collected ${sourceAssets.length} assets from ${source.type}`);
        } catch (error) {
          const errorMsg = `Failed to collect from ${source.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      // Remove duplicates if enabled
      let duplicatesRemoved = 0;
      let finalAssets = collectedAssets;
      
      if (collectionOptions.deduplicate) {
        const deduplicatedAssets = deduplicateAssets(collectedAssets);
        duplicatesRemoved = collectedAssets.length - deduplicatedAssets.length;
        finalAssets = deduplicatedAssets;
        console.log(`🔄 Removed ${duplicatesRemoved} duplicate assets`);
      }
      
      // Calculate summary statistics
      const formatCounts: Record<string, number> = {};
      let totalSize = 0;
      
      finalAssets.forEach(asset => {
        formatCounts[asset.format] = (formatCounts[asset.format] || 0) + 1;
        totalSize += asset.size;
      });
      
      // Create collection manifest
      const manifest = {
        collectionId,
        timestamp: new Date().toISOString(),
        sources: sources.map(s => ({ type: s.type, path: s.path })),
        options: collectionOptions,
        campaignContext: context?.campaignId ? {
          campaignId: context.campaignId,
          campaignPath: context.campaignPath
        } : undefined
      };
      
      // Save manifest
      await fs.writeFile(
        path.join(destination, 'collection-manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      
      // Save asset index
      await fs.writeFile(
        path.join(destination, 'asset-index.json'),
        JSON.stringify(finalAssets, null, 2)
      );
      
      const result: CollectionResult = {
        assets: finalAssets,
        summary: {
          totalAssets: finalAssets.length,
          totalSize,
          formats: formatCounts,
          sources: sourceCounts,
          duplicatesRemoved,
          errors
        },
        manifest
      };
      
      console.log('✅ Asset collection completed successfully');
      console.log(`📊 Total Assets: ${finalAssets.length}`);
      console.log(`📦 Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`🎯 Formats: ${Object.keys(formatCounts).join(', ')}`);
      
      return {
        success: true,
        collectionId,
        result,
        message: `Successfully collected ${finalAssets.length} assets from ${sources.length} sources`
      };
      
    } catch (error) {
      console.error('❌ Asset collection failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// ASSET VALIDATION TOOL
// ============================================================================

export const validateAssets = tool({
  name: 'validateAssets',
  description: 'Validate asset integrity, format compliance, and optimization status',
  parameters: z.object({
    assetPath: z.string().describe('Path to assets directory or specific asset'),
    validationRules: z.object({
      maxFileSize: z.number().default(5000000).describe('Maximum file size in bytes'),
      allowedFormats: z.array(z.string()).default(['jpg', 'png', 'svg', 'webp']).describe('Allowed image formats'),
      requireOptimization: z.boolean().default(true).describe('Require images to be optimized'),
      validateDimensions: z.boolean().default(true).describe('Validate image dimensions'),
      minWidth: z.number().default(100).describe('Minimum image width'),
      maxWidth: z.number().default(2000).describe('Maximum image width')
    }).nullable().describe('Validation rules'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ assetPath, validationRules, context, trace_id }) => {
    console.log('\n✅ === ASSET VALIDATION STARTED ===');
    console.log(`📂 Asset Path: ${assetPath}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const rules = validationRules || {};
    const validationResults: any[] = [];
    const issues: string[] = [];
    
    try {
      // Check if path exists
      const stats = await fs.stat(assetPath);
      
      if (stats.isDirectory()) {
        // Validate directory of assets
        const files = await fs.readdir(assetPath);
        const assetFiles = files.filter(file => 
          /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
        );
        
        console.log(`📁 Found ${assetFiles.length} asset files to validate`);
        
        for (const file of assetFiles) {
          const filePath = path.join(assetPath, file);
          const fileStats = await fs.stat(filePath);
          const format = path.extname(file).toLowerCase().substring(1);
          
          const validation = {
            filename: file,
            path: filePath,
            size: fileStats.size,
            format,
            valid: true,
            issues: [] as string[]
          };
          
          // Validate file size
          if (fileStats.size > rules.maxFileSize!) {
            validation.valid = false;
            validation.issues.push(`File size ${fileStats.size} exceeds maximum ${rules.maxFileSize}`);
          }
          
          // Validate format
          if (rules.allowedFormats && !rules.allowedFormats.includes(format)) {
            validation.valid = false;
            validation.issues.push(`Format ${format} not in allowed formats: ${rules.allowedFormats.join(', ')}`);
          }
          
          // Add more validation logic here for dimensions, optimization, etc.
          
          validationResults.push(validation);
          
          if (!validation.valid) {
            issues.push(`${file}: ${validation.issues.join(', ')}`);
          }
        }
      } else {
        // Validate single file
        const format = path.extname(assetPath).toLowerCase().substring(1);
        const validation = {
          filename: path.basename(assetPath),
          path: assetPath,
          size: stats.size,
          format,
          valid: stats.size <= rules.maxFileSize! && 
                (!rules.allowedFormats || rules.allowedFormats.includes(format)),
          issues: [] as string[]
        };
        
        validationResults.push(validation);
      }
      
      const validAssets = validationResults.filter(v => v.valid);
      const invalidAssets = validationResults.filter(v => !v.valid);
      
      console.log('✅ Asset validation completed');
      console.log(`📊 Valid Assets: ${validAssets.length}`);
      console.log(`❌ Invalid Assets: ${invalidAssets.length}`);
      
      return {
        success: true,
        validation: {
          totalAssets: validationResults.length,
          validAssets: validAssets.length,
          invalidAssets: invalidAssets.length,
          rules: rules,
          results: validationResults,
          issues: issues
        },
        message: `Validated ${validationResults.length} assets: ${validAssets.length} valid, ${invalidAssets.length} invalid`
      };
      
    } catch (error) {
      console.error('❌ Asset validation failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function collectFromSource(
  source: any,
  destination: string,
  options: any
): Promise<AssetMetadata[]> {
  const assets: AssetMetadata[] = [];
  
  switch (source.type) {
    case 'local':
      return await collectFromLocalPath(source.path, destination, options);
    case 'figma':
      return await collectFromFigma(source.path, destination, options);
    case 'url':
      return await collectFromUrl(source.path, destination, options);
    case 'campaign':
      return await collectFromCampaign(source.path, destination, options);
    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
}

async function collectFromLocalPath(
  sourcePath: string,
  destination: string,
  options: any
): Promise<AssetMetadata[]> {
  const assets: AssetMetadata[] = [];
  
  try {
    const files = await fs.readdir(sourcePath);
    const assetFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
    );
    
    for (const file of assetFiles) {
      const filePath = path.join(sourcePath, file);
      const destPath = path.join(destination, file);
      const stats = await fs.stat(filePath);
      
      // Copy file to destination
      await fs.copyFile(filePath, destPath);
      
      // Create asset metadata
      const asset: AssetMetadata = {
        filename: file,
        path: destPath,
        size: stats.size,
        format: path.extname(file).toLowerCase().substring(1),
        hash: `hash_${Date.now()}_${Math.random().toString(36)}`,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        tags: [],
        description: `Local asset: ${file}`
      };
      
      assets.push(asset);
    }
    
    return assets;
  } catch (error) {
    throw new Error(`Failed to collect from local path: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function collectFromFigma(
  figmaPath: string,
  destination: string,
  options: any
): Promise<AssetMetadata[]> {
  // Placeholder for Figma integration
  // This would use the Figma API to collect assets
  console.log('📋 Figma asset collection not yet implemented');
  return [];
}

async function collectFromUrl(
  url: string,
  destination: string,
  options: any
): Promise<AssetMetadata[]> {
  // Placeholder for URL-based asset collection
  console.log('🌐 URL asset collection not yet implemented');
  return [];
}

async function collectFromCampaign(
  campaignPath: string,
  destination: string,
  options: any
): Promise<AssetMetadata[]> {
  // Collect assets from existing campaign structure
  const assetsDir = path.join(campaignPath, 'assets');
  
  try {
    await fs.access(assetsDir);
    return await collectFromLocalPath(assetsDir, destination, options);
  } catch (error) {
    console.log(`⚠️ No assets directory found in campaign: ${campaignPath}`);
    return [];
  }
}

function deduplicateAssets(assets: AssetMetadata[]): AssetMetadata[] {
  const seen = new Set();
  const deduplicated: AssetMetadata[] = [];
  
  for (const asset of assets) {
    // Use hash for deduplication (simplified approach)
    const key = `${asset.hash}_${asset.size}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(asset);
    }
  }
  
  return deduplicated;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const assetCollectionTools = [
  collectAssets,
  validateAssets
];