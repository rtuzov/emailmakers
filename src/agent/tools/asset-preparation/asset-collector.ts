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
 * Enhanced with AI-powered asset selection and data insights integration.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';

// Import AI analysis functions from asset-collection.ts logic
import {
  analyzeContentWithAI,
  selectFigmaAssetsWithAI,
  finalFileSelectionWithAI,
  generateExternalImageLinks
} from './ai-analysis';
import { ContentContext, CampaignContext } from './types';

// ============================================================================
// DATA INSIGHTS INTEGRATION
// ============================================================================

/**
 * Load data insights from campaign /data folder
 */
async function loadDataInsights(campaignPath?: string): Promise<any> {
  if (!campaignPath) {
    console.log('⚠️ No campaign path provided, skipping data insights');
    return null;
  }

  const dataPath = path.join(campaignPath, 'data');
  const insights: any = {};

  try {
    // Try to load each data file
    const dataFiles = [
      'consolidated-insights.json',
      'destination-analysis.json', 
      'emotional-profile.json',
      'market-intelligence.json',
      'travel_intelligence-insights.json',
      'trend-analysis.json'
    ];

    for (const fileName of dataFiles) {
      try {
        const filePath = path.join(dataPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Extract key from filename (remove -insights.json and .json)
        const key = fileName.replace('-insights.json', '').replace('.json', '').replace('-', '_');
        insights[key] = data;
        
        console.log(`✅ Loaded ${fileName} with ${Object.keys(data).length} keys`);
      } catch (fileError) {
        console.log(`⚠️ Could not load ${fileName}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    const insightKeys = Object.keys(insights);
    if (insightKeys.length > 0) {
      console.log(`🧠 Loaded data insights: ${insightKeys.join(', ')}`);
      return insights;
    } else {
      console.log('⚠️ No data insights could be loaded');
      return null;
    }
  } catch (error) {
    console.log(`⚠️ Failed to access data folder ${dataPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

// ============================================================================
// ASSET COLLECTION SCHEMAS
// ============================================================================

const AssetSourceSchema = z.object({
      type: z.enum(['figma', 'local', 'url', 'campaign', 'external']).describe('Asset source type'),
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
  file_path?: string;
  size: number;
  format: string;
  dimensions?: { width: number; height: number };
  hash: string;
  created: string;
  modified: string;
  tags: string[];
  description?: string;
  isExternal?: boolean;
  purpose?: string;
  priority?: string;
  aiReasoning?: string;
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
    
    const collectionOptions = options || {} as {
      recursive?: boolean;
      validateAssets?: boolean;
      generateThumbnails?: boolean;
      extractMetadata?: boolean;
      deduplicate?: boolean;
    };
    const collectionId = `collection_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(destination, { recursive: true });
      
      // 🧠 Load data insights for AI-powered asset selection
      const dataInsights = await loadDataInsights(context?.campaignPath || undefined);
      
      const collectedAssets: AssetMetadata[] = [];
      const errors: string[] = [];
      const sourceCounts: Record<string, number> = {};
      
      // Process each source with AI enhancement
      for (const source of sources) {
        console.log(`🔍 Processing ${source.type} source: ${source.path}`);
        
        try {
          const sourceAssets = await collectFromSourceWithAI(
            source, 
            destination, 
            collectionOptions,
            context,
            dataInsights
          );
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
      
      if (collectionOptions.deduplicate !== false) { // Default to true
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
  execute: async ({ assetPath, validationRules, context: _context, trace_id }) => {
    console.log('\n✅ === ASSET VALIDATION STARTED ===');
    console.log(`📂 Asset Path: ${assetPath}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const rules = validationRules || {} as {
      maxFileSize?: number;
      allowedFormats?: string[];
      requireOptimization?: boolean;
      validateDimensions?: boolean;
      minWidth?: number;
      maxWidth?: number;
    };
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
          if (rules.maxFileSize && fileStats.size > rules.maxFileSize) {
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
          valid: (!rules.maxFileSize || stats.size <= rules.maxFileSize) && 
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

async function collectFromSourceWithAI(
  source: any,
  destination: string,
  options: any,
  context: any,
  dataInsights: any
): Promise<AssetMetadata[]> {
  
  switch (source.type) {
    case 'local':
    case 'figma':
      // Use AI-powered selection for Figma and local assets
      return await collectFromLocalPathWithAI(source.path, destination, options, context, dataInsights);
    case 'url':
    case 'external':
      // Use AI-powered external image selection
      return await collectFromExternalWithAI(source.path, destination, options, context, dataInsights);
    case 'campaign':
      return await collectFromCampaign(source.path, destination, options);
    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
}

/**
 * AI-powered collection from local/Figma sources
 */
async function collectFromLocalPathWithAI(
  sourcePath: string,
  destination: string,
  _options: any,
  context: any,
  dataInsights: any
): Promise<AssetMetadata[]> {
  console.log('🎨 Using AI to select optimal assets from source...');
  
  try {
    // Create content context for AI analysis
    const contentContext: ContentContext = {
      campaign_type: context?.campaign_type || 'email campaign',
      language: context?.language || 'en',
      target_audience: context?.target_audience || 'travelers'
    };
    
    const campaignContext: CampaignContext = {
      campaignId: context?.campaignId || '',
      campaignPath: context?.campaignPath || '',
      language: context?.language || 'en',
      industry: context?.industry || 'travel'
    };

    // Get AI analysis with data insights
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext, dataInsights);
    
    // Check if sourcePath is a file or directory
    let figmaTagsPath: string;
    
    try {
      const sourceStats = await fs.stat(sourcePath);
      if (sourceStats.isFile()) {
        console.log(`⚠️ Source path is a file: ${sourcePath}, using basic collection`);
        return await collectFromLocalPath(sourcePath, destination, _options);
      }
      // If it's a directory, proceed with AI selection
      figmaTagsPath = path.join(sourcePath, 'ai-optimized-tags.json');
    } catch (error) {
      console.error(`❌ Could not access source path ${sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`❌ Invalid asset source path: ${sourcePath}`);
    }
    
    // Load Figma tags for AI selection
    let figmaTags: any = {};
    
    try {
      const figmaTagsContent = await fs.readFile(figmaTagsPath, 'utf8');
      figmaTags = JSON.parse(figmaTagsContent);
    } catch (error) {
      console.warn(`⚠️ Could not load Figma tags from ${figmaTagsPath}, using basic selection`);
      return await collectFromLocalPath(sourcePath, destination, _options);
    }
    
    // Get AI-powered tag selection
    const tagSelections = await selectFigmaAssetsWithAI(aiAnalysis, figmaTags, contentContext);
    const assets: AssetMetadata[] = [];
    
    // Process each tag selection
    for (const selection of tagSelections) {
      console.log(`🎯 Processing selection: ${selection.reasoning}`);
      
      // Find actual files by tags
      const foundFiles = await findActualFilesByTags(
        selection.tags,
        selection.folders,
        figmaTags,
        sourcePath,
        selection.max_files || 10
      );
      
      if (foundFiles.length === 0) {
        console.warn(`⚠️ No files found for tags: ${selection.tags.join(', ')}`);
        continue;
      }
      
      // AI makes final selection (максимум 2 файла)
      const finalSelection = await finalFileSelectionWithAI(
        foundFiles,
        campaignContext,
        contentContext,
        2
      );
      
      // Copy selected files
      for (const selected of finalSelection) {
        const filePath = path.join(sourcePath, selected.folder, selected.filename);
        const destPath = path.join(destination, selected.filename);
        
        try {
          const stats = await fs.stat(filePath);
          await fs.copyFile(filePath, destPath);
          
          // Calculate relative path
          const campaignPath = context?.campaignPath || path.dirname(path.dirname(destination));
          const relativePath = path.relative(campaignPath, destPath);
          
          assets.push({
            filename: selected.filename,
            path: destPath,
            file_path: relativePath,
            size: stats.size,
            format: path.extname(selected.filename).toLowerCase().substring(1),
            hash: `ai_final_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            tags: selection.tags,
            description: `AI final selection: ${selected.reasoning}`,
            purpose: 'visual',
            priority: 'high',
            aiReasoning: selected.reasoning,
            isExternal: false
          });
          
          console.log(`✅ Added AI-selected asset: ${selected.filename}`);
          
        } catch (fileError) {
          throw new Error(`❌ Could not process AI-selected file ${selected.filename}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }
    }
    
    console.log(`🎯 AI selection result: ${assets.length} carefully selected assets`);
    return assets;
    
  } catch (error) {
    console.error('❌ AI-powered asset collection failed:', error);
    throw new Error(`AI asset collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered external image collection
 */
async function collectFromExternalWithAI(
  _sourcePath: string,
  _destination: string,
  _options: any,
  context: any,
  dataInsights: any
): Promise<AssetMetadata[]> {
  console.log('🌐 Using AI to select external images...');
  
  try {
    // Create content context for AI analysis
    const contentContext: ContentContext = {
      campaign_type: context?.campaign_type || 'email campaign',
      language: context?.language || 'en',
      target_audience: context?.target_audience || 'travelers'
    };
    
    const campaignContext: CampaignContext = {
      campaignId: context?.campaignId || '',
      campaignPath: context?.campaignPath || '',
      language: context?.language || 'en',
      industry: context?.industry || 'travel'
    };

    // Get AI analysis with data insights
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext, dataInsights);
    
    // Use AI to generate appropriate external image URLs
    const aiSelectedImages = await generateExternalImageLinks(aiAnalysis, contentContext);
    
    console.log(`✅ AI selected ${aiSelectedImages.length} external images`);
    return aiSelectedImages.map(img => ({
      filename: img.filename,
      path: img.path,
      file_path: img.file_path,
      size: img.size || 150000,
      format: img.format,
      hash: img.hash,
      created: img.created,
      modified: img.modified,
      tags: img.tags || [],
      description: img.description,
      isExternal: img.isExternal,
      purpose: img.purpose,
      aiReasoning: img.aiReasoning
    }));
    
  } catch (error) {
    console.error('❌ AI external image selection failed:', error);
    throw new Error(`Failed to select external images: ${error instanceof Error ? error.message : 'AI selection unavailable'}`);
  }
}

/**
 * Find actual files by tags from the file system
 */
async function findActualFilesByTags(
  selectedTags: string[],
  priorityFolders: string[],
  figmaTags: any,
  sourcePath: string,
  maxFiles: number = 5
): Promise<{ filename: string; folder: string; score: number; matchedTags: string[]; size?: number }[]> {
  console.log(`🔍 Finding actual files by tags: ${selectedTags.join(', ')}`);
  console.log(`📁 Priority folders: ${priorityFolders.join(', ')}`);
  
  const foundFiles: { filename: string; folder: string; score: number; matchedTags: string[]; size?: number }[] = [];
  
  // Search in each priority folder
  for (const folderName of priorityFolders) {
    const folderPath = path.join(sourcePath, folderName);
    
    try {
      // Check if folder exists
      await fs.access(folderPath);
      
      // Get all files in folder
      const files = await fs.readdir(folderPath);
      const folderData = figmaTags.folders[folderName];
      
      if (!folderData) {
        console.warn(`⚠️ No tag data found for folder: ${folderName}`);
        continue;
      }
      
      const folderTags = folderData.tags || [];
      
      // Calculate relevance score for each tag match
      const tagMatches = selectedTags.filter(tag => folderTags.includes(tag));
      const score = tagMatches.length;
      
      if (score > 0) {
        // Process each file in the folder
        for (const filename of files.slice(0, maxFiles)) {
          try {
            const filePath = path.join(folderPath, filename);
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              foundFiles.push({
                filename,
                folder: folderName,
                score,
                matchedTags: tagMatches,
                size: stats.size
              });
            }
          } catch (fileError) {
            console.warn(`⚠️ Could not access file ${filename}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
          }
        }
      }
    } catch (folderError) {
      console.warn(`⚠️ Could not access folder ${folderPath}: ${folderError instanceof Error ? folderError.message : 'Unknown error'}`);
    }
  }
  
  // Sort by score and return top files
  foundFiles.sort((a, b) => b.score - a.score);
  const selectedFiles = foundFiles.slice(0, maxFiles);
  
  console.log(`✅ Found ${selectedFiles.length} files by tags: ${selectedFiles.map(f => f.filename).join(', ')}`);
  
  return selectedFiles;
}

async function collectFromLocalPath(
  sourcePath: string,
  destination: string,
  _options: any
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

// Unused function - keeping for future Figma integration
/*
async function collectFromFigma(
  _figmaPath: string,
  _destination: string,
  _options: any
): Promise<AssetMetadata[]> {
  // Placeholder for Figma integration
  // This would use the Figma API to collect assets
  console.log('📋 Figma asset collection not yet implemented');
  return [];
}
*/

// Unused function - keeping for future URL collection
/*
async function collectFromUrl(
  _url: string,
  _destination: string,
  _options: any
): Promise<AssetMetadata[]> {
  // Placeholder for URL-based asset collection
  console.log('🌐 URL asset collection not yet implemented');
  return [];
}
*/

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