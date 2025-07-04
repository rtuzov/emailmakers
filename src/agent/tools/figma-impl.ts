/**
 * Figma Assets Implementation (No OpenAI Agent SDK)
 * Direct function implementation to avoid build issues
 */

import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface FigmaAssetParams {
  tags: string[];
  context: {
    campaign_type?: string;
    emotional_tone?: string;
    target_count?: number;
    diversity_mode?: boolean;
  };
}

interface AssetInfo {
  path: string;
  url?: string;
  width?: number;
  height?: number;
  tag?: string;
  relevanceScore?: number;
}

/**
 * Direct implementation of Figma assets retrieval
 */
export async function getFigmaAssetsImpl(params: FigmaAssetParams): Promise<ToolResult> {
  try {
    console.log('🎯 Direct Figma Assets Implementation called:', {
      tags: params.tags,
      context: params.context
    });

    // Get assets from file system
    const assets = await getAssetsFromFileSystem(params.tags, params.context);
    
    // Apply contextual filtering and selection
    const selectedAssets = applyContextualSelection(assets, params.context);
    
    // Calculate relevance scores
    const scoredAssets = calculateRelevanceScores(selectedAssets, params.tags, params.context);
    
    // Apply diversity if requested
    const finalAssets = params.context.diversity_mode 
      ? applyDiversityFilter(scoredAssets, params.context.target_count || 5)
      : scoredAssets.slice(0, params.context.target_count || 5);

    const result = {
      success: true,
      data: {
        paths: finalAssets.map(asset => asset.path),
        assets: finalAssets,
        metadata: {
          total_found: assets.length,
          after_filtering: selectedAssets.length,
          after_scoring: scoredAssets.length,
          final_count: finalAssets.length
        },
        selection_strategy: {
          strategy_used: params.context.diversity_mode ? 'diversity_optimized' : 'relevance_ranked',
          reasoning: `Selected based on ${params.context.emotional_tone} tone for ${params.context.campaign_type} campaign`,
          diversity_applied: params.context.diversity_mode || false,
          randomization_factor: 0.2
        }
      }
    };

    console.log('✅ Direct Figma implementation result:', {
      success: result.success,
      assets_found: finalAssets.length,
      total_available: assets.length
    });

    return result;

  } catch (error) {
    console.error('❌ Direct Figma implementation error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in Figma implementation',
      data: {
        paths: [],
        assets: [],
        metadata: { error: true }
      }
    };
  }
}

/**
 * Get assets from file system (scan figma directories)
 */
async function getAssetsFromFileSystem(tags: string[], context: any): Promise<AssetInfo[]> {
  const assets: AssetInfo[] = [];
  
  try {
    // Look for figma directories
    const figmaPath = path.join(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    
    if (!fs.existsSync(figmaPath)) {
      console.log('📁 Figma directory not found, using fallback assets');
      return getFallbackAssets(tags, context);
    }

    // Scan directories for assets
    const directories = fs.readdirSync(figmaPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of directories) {
      const dirPath = path.join(figmaPath, dir);
      
      try {
        const files = fs.readdirSync(dirPath)
          .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg'));

        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const relativePath = path.relative(process.cwd(), filePath);
          
          assets.push({
            path: relativePath,
            tag: dir,
            relevanceScore: 0 // Will be calculated later
          });
        }
      } catch (dirError) {
        console.warn(`⚠️ Could not read directory ${dir}:`, dirError);
      }
    }

    console.log(`📁 Found ${assets.length} assets in ${directories.length} directories`);
    return assets;

  } catch (error) {
    console.error('❌ Error scanning file system:', error);
    return getFallbackAssets(tags, context);
  }
}

/**
 * Provide fallback assets when file system scanning fails
 */
function getFallbackAssets(tags: string[], context: any): AssetInfo[] {
  const fallbackAssets = [
    { path: 'assets/fallback/rabbit-travel-1.png', tag: 'заяц', relevanceScore: 0.8 },
    { path: 'assets/fallback/rabbit-travel-2.png', tag: 'путешествие', relevanceScore: 0.7 },
    { path: 'assets/fallback/airplane-icon.png', tag: 'авиация', relevanceScore: 0.6 },
    { path: 'assets/fallback/luggage-icon.png', tag: 'чемодан', relevanceScore: 0.5 },
    { path: 'assets/fallback/ticket-icon.png', tag: 'билеты', relevanceScore: 0.4 }
  ];

  return fallbackAssets;
}

/**
 * Apply contextual selection based on campaign context
 */
function applyContextualSelection(assets: AssetInfo[], context: any): AssetInfo[] {
  if (!context) return assets;

  let filtered = assets;

  // Filter by emotional tone
  if (context.emotional_tone === 'positive') {
    filtered = filtered.filter(asset => 
      asset.tag?.includes('веселый') || 
      asset.tag?.includes('радостный') || 
      asset.tag?.includes('счастлив') ||
      asset.tag?.includes('заяц') // Rabbit is generally positive
    );
  }

  // Filter by campaign type
  if (context.campaign_type === 'promotional') {
    filtered = filtered.filter(asset => 
      asset.tag?.includes('акция') || 
      asset.tag?.includes('специальный') ||
      asset.tag?.includes('билеты') ||
      asset.tag?.includes('путешествие')
    );
  }

  return filtered.length > 0 ? filtered : assets; // Fallback to all if nothing matches
}

/**
 * Calculate relevance scores for assets
 */
function calculateRelevanceScores(assets: AssetInfo[], tags: string[], context: any): AssetInfo[] {
  return assets.map(asset => {
    let score = 0.1; // Base score

    // Tag matching (highest weight)
    for (const tag of tags) {
      if (asset.tag?.toLowerCase().includes(tag.toLowerCase()) || 
          asset.path.toLowerCase().includes(tag.toLowerCase())) {
        score += 0.3;
      }
    }

    // Context matching
    if (context.emotional_tone && asset.tag?.includes(context.emotional_tone)) {
      score += 0.2;
    }

    if (context.campaign_type && asset.tag?.includes(context.campaign_type)) {
      score += 0.2;
    }

    // Special bonus for brand mascot
    if (asset.tag?.includes('заяц') || asset.path.includes('rabbit')) {
      score += 0.1;
    }

    return {
      ...asset,
      relevanceScore: Math.min(score, 1.0) // Cap at 1.0
    };
  }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Sort by relevance
}

/**
 * Apply diversity filter to avoid similar assets
 */
function applyDiversityFilter(assets: AssetInfo[], targetCount: number): AssetInfo[] {
  if (assets.length <= targetCount) return assets;

  const selected: AssetInfo[] = [];
  const usedTags = new Set<string>();

  // First pass: select one from each unique tag
  for (const asset of assets) {
    if (selected.length >= targetCount) break;
    
    if (asset.tag && !usedTags.has(asset.tag)) {
      selected.push(asset);
      usedTags.add(asset.tag);
    }
  }

  // Second pass: fill remaining slots with highest scoring assets
  for (const asset of assets) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(asset)) {
      selected.push(asset);
    }
  }

  return selected.slice(0, targetCount);
}