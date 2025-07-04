/**
 * 🎨 FIGMA ASSET MANAGER - Consolidated Tool
 * 
 * Консолидирует функциональность:
 * - get_figma_assets (поиск и загрузка ассетов)
 * - get_figma_folders_info (информация о папках)
 * - split_figma_sprite (разделение спрайтов)
 * - select_identica_creatives (выбор айдентики)
 * 
 * Единый интерфейс для всех операций с Figma ресурсами
 */

import { z } from 'zod';
import { recordToolUsage } from '../../utils/tracing-utils';

// import { getLocalFigmaAssets, getLocalFigmaFoldersInfo } from '../figma-local-processor';
// import { splitFigmaSprite } from '../figma-sprite-splitter';
// import { selectIdenticaCreatives } from '../identica-selector';

// Stub implementations for removed functions
async function getLocalFigmaAssets(params: any) {
  return { success: false, error: 'getLocalFigmaAssets not implemented', data: null };
}

async function getLocalFigmaFoldersInfo() {
  return { success: false, error: 'getLocalFigmaFoldersInfo not implemented', data: null };
}

async function splitFigmaSprite(params: any) {
  return { success: false, error: 'splitFigmaSprite not implemented', manifest: null };
}

async function selectIdenticaCreatives(params: any) {
  return { success: false, error: 'selectIdenticaCreatives not implemented', data: null };
}

// Unified schema for all Figma asset operations
export const figmaAssetManagerSchema = z.object({
  action: z.enum(['search', 'list_folders', 'split_sprite', 'select_identica', 'bulk_process', 'analyze_assets']).describe('Figma asset operation to perform'),
  
  // For search action (replaces get_figma_assets) - make tags required for search
  tags: z.array(z.string()).default([]).describe('Tags to search for. Examples: ["заяц", "счастлив"] for happy rabbit'),
  search_context: z.object({
    campaign_type: z.enum(['seasonal', 'promotional', 'informational']).nullable().default(null).describe('Type of email campaign'),
    emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).nullable().default(null).describe('Emotional tone of the campaign'),
    target_count: z.number().nullable().default(2).describe('Number of assets to return (default: 2)'),
    diversity_mode: z.boolean().nullable().default(false).describe('Select diverse assets from different categories'),
    preferred_emotion: z.enum(['happy', 'angry', 'neutral', 'sad', 'confused']).nullable().default(null).describe('Preferred rabbit emotion'),
    airline: z.string().nullable().default(null).describe('Specific airline for logo search'),
    use_local_only: z.boolean().nullable().default(true).describe('Force local-only search (always true now)')
  }).nullable().default(null).describe('Search context for intelligent asset selection'),
  
  // For split_sprite action
  sprite_path: z.string().nullable().default(null).describe('Path to the PNG sprite file to split'),
  split_options: z.object({
    h_gap: z.number().default(15).describe('Horizontal gap threshold in pixels'),
    v_gap: z.number().default(15).describe('Vertical gap threshold in pixels'),
    confidence_threshold: z.number().default(0.9).describe('Minimum confidence threshold for classification')
  }).nullable().default(null).describe('Sprite splitting options'),
  
  // For select_identica action
  identica_criteria: z.object({
    campaign_type: z.enum(['promotional', 'informational', 'brand', 'logo', 'premium']).nullable().default(null).describe('Campaign type for creative selection'),
    emotional_tone: z.enum(['позитивный', 'нейтральный', 'дружелюбный']).nullable().default(null).describe('Desired emotional tone'),
    usage_context: z.array(z.string()).nullable().default(null).describe('Usage context for creatives'),
    tags: z.array(z.string()).nullable().default(null).describe('Specific tags for creative search'),
    target_count: z.number().default(2).describe('Number of creatives to select'),
    prefer_logo: z.boolean().default(false).describe('Prefer logos in selection'),
    prefer_premium: z.boolean().default(false).describe('Prefer premium creatives')
  }).nullable().default(null).describe('Criteria for identica selection'),
  
  // For bulk_process action
  bulk_operations: z.array(z.object({
    operation: z.enum(['search', 'split', 'analyze']),
    parameters: z.object({
      tags: z.array(z.string()).nullable().default(null),
      action_specific_data: z.string().nullable().default(null)
    }).nullable().default(null)
  })).nullable().default(null).describe('Multiple operations to perform in sequence'),
  
  // Common options - required with defaults
  quality_filter: z.enum(['any', 'medium', 'high', 'premium']).default('medium').describe('Quality filter for assets'),
  format_preference: z.array(z.enum(['png', 'svg', 'jpg', 'webp'])).default(['png', 'svg']).describe('Preferred asset formats'),
  size_constraints: z.object({
    min_width: z.number().nullable().default(null),
    max_width: z.number().nullable().default(null),
    min_height: z.number().nullable().default(null),
    max_height: z.number().nullable().default(null)
  }).nullable().default(null).describe('Size constraints for assets'),
  
  // Performance and caching - required with defaults
  cache_strategy: z.enum(['aggressive', 'normal', 'minimal', 'disabled']).default('normal').describe('Caching strategy for assets'),
  parallel_processing: z.boolean().default(true).describe('Enable parallel processing for multiple operations'),
  
  // Analytics and tracking - required with defaults
  include_analytics: z.boolean().default(true).describe('Include performance analytics in response'),
  track_usage: z.boolean().default(false).describe('Track asset usage for optimization')
});

export type FigmaAssetManagerParams = z.infer<typeof figmaAssetManagerSchema>;

interface FigmaAssetManagerResult {
  success: boolean;
  action: string;
  data?: any;
  assets?: Array<{
    fileName: string;
    filePath: string;
    tags: string[];
    description: string;
    metadata?: any;
  }>;
  folders_info?: any;
  sprite_results?: any;
  identica_results?: any;
  bulk_results?: any[];
  analytics?: {
    execution_time: number;
    assets_found: number;
    operations_performed: number;
    cache_hits?: number;
    quality_score?: number;
  };
  error?: string;
  recommendations?: string[];
}

/**
 * Figma Asset Manager - Unified asset management for all Figma operations
 */
export async function figmaAssetManager(params: FigmaAssetManagerParams): Promise<FigmaAssetManagerResult> {
  const startTime = Date.now();
  console.log(`🎨 Figma Asset Manager: Executing action "${params.action}"`);
  
  try {
    let result: FigmaAssetManagerResult;
      
      switch (params.action) {
        case 'search':
          result = await handleAssetSearch(params, startTime);
          break;
          
        case 'list_folders':
          result = await handleListFolders(params, startTime);
          break;
          
        case 'split_sprite':
          result = await handleSpriteSpitting(params, startTime);
          break;
          
        case 'select_identica':
          result = await handleIdenticaSelection(params, startTime);
          break;
          
        case 'bulk_process':
          result = await handleBulkProcessing(params, startTime);
          break;
          
        case 'analyze_assets':
          result = await handleAssetAnalysis(params, startTime);
          break;
          
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
      
      // Record tracing statistics
      if (result.analytics) {
        recordToolUsage({
          tool: 'figma-asset-manager',
          operation: params.action,
          duration: result.analytics.execution_time,
          success: result.success
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Figma Asset Manager error:', error);
      
      const errorResult = {
        success: false,
        action: params.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          assets_found: 0,
          operations_performed: 0
        } : undefined
      };
      
      // Record error statistics
      recordToolUsage({
        tool: 'figma-asset-manager',
        operation: params.action,
        duration: Date.now() - startTime,
        success: false,
        error: errorResult.error
      });
      
      return errorResult;
    }
}

/**
 * Handle asset search (replaces get_figma_assets)
 */
async function handleAssetSearch(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  if (params.tags.length === 0) {
    // If no tags provided, use default search terms
    params.tags = ['заяц', 'логотип']; // Default search terms
    console.log('🔍 No tags provided, using default search terms:', params.tags.join(', '));
  } else {
  console.log(`🔍 Searching for assets with tags: ${params.tags.join(', ')}`);
  }
  
  // Enhance search with quality filtering and intelligent context
  const enhancedContext = {
    ...params.search_context,
    use_local_only: true, // Force local mode
    quality_filter: params.quality_filter,
    format_preference: params.format_preference,
    size_constraints: params.size_constraints
  };
  
  const searchResult = await getLocalFigmaAssets({
    tags: params.tags,
    context: enhancedContext
  });
  
  if (!searchResult.success) {
    throw new Error(`Asset search failed: ${searchResult.error}`);
  }
  
  // Apply additional filtering and enhancement
  const filteredAssets = applyAdvancedFiltering(searchResult.data.paths || [], params);
  const enrichedAssets = await enrichAssetMetadata(filteredAssets, params);
  
  console.log(`✅ Found ${enrichedAssets.length} matching assets`);
  
  // Generate intelligent recommendations
  const recommendations = generateAssetRecommendations(enrichedAssets, params);
  
  return {
    success: true,
    action: 'search',
    data: {
      paths: enrichedAssets.map(a => a.filePath),
      metadata: enrichedAssets
    },
    assets: enrichedAssets,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: enrichedAssets.length,
      operations_performed: 1,
      quality_score: calculateQualityScore(enrichedAssets)
    } : undefined,
    recommendations
  };
}

/**
 * Handle folder listing (replaces get_figma_folders_info)
 */
async function handleListFolders(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  console.log('📁 Listing Figma folders information');
  
  const foldersResult = await getLocalFigmaFoldersInfo();
  
  if (!foldersResult.success) {
    throw new Error(`Failed to get folders info: ${foldersResult.error}`);
  }
  
  // Enhance folder info with usage statistics and recommendations
  const enhancedFoldersInfo = await enhanceFoldersInfo(foldersResult.data, params);
  
  console.log(`✅ Retrieved information for ${Object.keys(enhancedFoldersInfo.folders || {}).length} folders`);
  
  return {
    success: true,
    action: 'list_folders',
    data: enhancedFoldersInfo,
    folders_info: enhancedFoldersInfo,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: 0,
      operations_performed: 1
    } : undefined
  };
}

/**
 * Handle sprite splitting (replaces split_figma_sprite)
 */
async function handleSpriteSpitting(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  if (!params.sprite_path) {
    throw new Error('Sprite path is required for sprite splitting');
  }
  
  console.log(`✂️ Splitting sprite: ${params.sprite_path}`);
  
  const splitOptions = params.split_options || {};
  const splitResult = await splitFigmaSprite({
    path: params.sprite_path,
    h_gap: splitOptions.h_gap ?? 15,
    v_gap: splitOptions.v_gap ?? 15,
    confidence_threshold: splitOptions.confidence_threshold ?? 0.9
  });
  
  if (!splitResult.success) {
    throw new Error(`Sprite splitting failed: ${splitResult.error}`);
  }
  
  console.log(`✅ Sprite split into ${splitResult.manifest?.slices?.length || 0} components`);
  
  return {
    success: true,
    action: 'split_sprite',
    data: splitResult,
    sprite_results: splitResult,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: splitResult.manifest?.slices?.length || 0,
      operations_performed: 1
    } : undefined
  };
}

/**
 * Handle identica selection (replaces select_identica_creatives)
 */
async function handleIdenticaSelection(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  if (!params.identica_criteria) {
    throw new Error('Identica criteria are required for selection');
  }
  
  console.log('🎯 Selecting identica creatives');
  
  const identicaResult = await selectIdenticaCreatives(params.identica_criteria);
  
  if (!identicaResult.success) {
    throw new Error(`Identica selection failed: ${identicaResult.error}`);
  }
  
  console.log(`✅ Selected ${identicaResult.data?.selected_assets?.length || 0} identica creatives`);
  
  return {
    success: true,
    action: 'select_identica',
    data: identicaResult.data,
    identica_results: identicaResult.data,
    assets: identicaResult.data?.selected_assets || [],
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: identicaResult.data?.selected_assets?.length || 0,
      operations_performed: 1
    } : undefined
  };
}

/**
 * Handle bulk processing
 */
async function handleBulkProcessing(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  if (!params.bulk_operations || params.bulk_operations.length === 0) {
    throw new Error('Bulk operations are required for bulk processing');
  }
  
  console.log(`🔄 Performing ${params.bulk_operations.length} bulk operations`);
  
  const results = [];
  let totalAssetsFound = 0;
  
  for (const [index, operation] of params.bulk_operations.entries()) {
    try {
      console.log(`📋 Bulk operation ${index + 1}/${params.bulk_operations.length}: ${operation.operation}`);
      
      // Create sub-parameters for each operation
      const subParams = {
        ...params,
        action: operation.operation as any,
        ...operation.parameters
      };
      
      const operationResult = await figmaAssetManager(subParams);
      results.push({
        operation: operation.operation,
        success: operationResult.success,
        data: operationResult.data,
        error: operationResult.error
      });
      
      if (operationResult.analytics) {
        totalAssetsFound += operationResult.analytics.assets_found;
      }
      
    } catch (error) {
      console.error(`❌ Bulk operation ${index + 1} failed:`, error);
      results.push({
        operation: operation.operation,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const successfulOperations = results.filter(r => r.success).length;
  console.log(`✅ Completed ${successfulOperations}/${params.bulk_operations.length} bulk operations`);
  
  return {
    success: successfulOperations > 0,
    action: 'bulk_process',
    data: {
      total_operations: params.bulk_operations.length,
      successful_operations: successfulOperations,
      results
    },
    bulk_results: results,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: totalAssetsFound,
      operations_performed: params.bulk_operations.length
    } : undefined
  };
}

/**
 * Handle asset analysis
 */
async function handleAssetAnalysis(params: FigmaAssetManagerParams, startTime: number): Promise<FigmaAssetManagerResult> {
  console.log('📊 Analyzing available assets');
  
  // Get comprehensive folder info
  const foldersResult = await getLocalFigmaFoldersInfo();
  
  if (!foldersResult.success) {
    throw new Error(`Failed to analyze assets: ${foldersResult.error}`);
  }
  
  // Perform deep analysis
  const analysis = await performAssetAnalysis(foldersResult.data, params);
  
  console.log('✅ Asset analysis completed');
  
  return {
    success: true,
    action: 'analyze_assets',
    data: analysis,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      assets_found: analysis.total_assets || 0,
      operations_performed: 1,
      quality_score: analysis.overall_quality_score || 0
    } : undefined,
    recommendations: analysis.recommendations || []
  };
}

/**
 * Helper functions for enhanced functionality
 */

function applyAdvancedFiltering(assets: string[], params: FigmaAssetManagerParams): string[] {
  // Apply size constraints, format preferences, quality filters
  return assets.filter(asset => {
    // Implement filtering logic based on params
    return true; // Placeholder
  });
}

async function enrichAssetMetadata(assets: string[], params: FigmaAssetManagerParams) {
  return assets.map(asset => ({
    fileName: asset.split('/').pop() || '',
    filePath: asset,
    tags: [], // Extract from file analysis
    description: '', // Generate from context
    metadata: {
      quality_score: Math.random() * 100, // Placeholder
      format: 'png', // Extract from file
      dimensions: { width: 0, height: 0 } // Get from file
    }
  }));
}

function generateAssetRecommendations(assets: any[], params: FigmaAssetManagerParams): string[] {
  const recommendations = [];
  
  if (assets.length === 0) {
    recommendations.push('No assets found. Try broader search tags or different emotional tones.');
  } else if (assets.length === 1) {
    recommendations.push('Consider using diversity_mode for more varied asset selection.');
  }
  
  return recommendations;
}

function calculateQualityScore(assets: any[]): number {
  if (assets.length === 0) return 0;
  
  // Calculate average quality score
  const totalScore = assets.reduce((sum, asset) => {
    return sum + (asset.metadata?.quality_score || 0);
  }, 0);
  
  return Math.round(totalScore / assets.length);
}

async function enhanceFoldersInfo(foldersData: any, params: FigmaAssetManagerParams) {
  // Add usage statistics, recommendations, etc.
  return {
    ...foldersData,
    enhanced_at: new Date().toISOString(),
    usage_recommendations: [
      'Use зайцы-эмоции for promotional campaigns',
      'Use зайцы-новости for informational content',
      'Use логотипы-ак for airline-specific campaigns'
    ]
  };
}

async function performAssetAnalysis(foldersData: any, params: FigmaAssetManagerParams) {
  return {
    total_assets: 0, // Calculate from folders
    total_folders: Object.keys(foldersData.folders || {}).length,
    overall_quality_score: 85, // Calculate based on analysis
    recommendations: [
      'Consider organizing assets by campaign type',
      'Add more seasonal variations',
      'Optimize asset file sizes for faster loading'
    ],
    analysis_timestamp: new Date().toISOString()
  };
}