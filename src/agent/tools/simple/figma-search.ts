/**
 * 🔍 FIGMA SEARCH - Simple Tool
 * 
 * Простой поиск ассетов по тегам в локальных Figma папках
 * Заменяет часть функциональности figma-asset-manager
 */

import { z } from 'zod';
import { getLocalFigmaAssets } from '../figma-local-processor';

export const figmaSearchSchema = z.object({
  tags: z.array(z.string()).describe('Tags to search for. Examples: ["заяц", "счастлив"] for happy rabbit'),
  emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).optional().nullable().describe('Emotional tone of the campaign'),
  target_count: z.number().default(2).describe('Number of assets to return'),
  preferred_emotion: z.enum(['happy', 'angry', 'neutral', 'sad', 'confused']).optional().nullable().describe('Preferred rabbit emotion'),
  airline: z.string().optional().nullable().describe('Specific airline for logo search')
});

export type FigmaSearchParams = z.infer<typeof figmaSearchSchema>;

export interface FigmaSearchResult {
  success: boolean;
  assets: Array<{
    fileName: string;
    filePath: string;
    tags: string[];
    description: string;
    emotion?: string;
    category?: string;
  }>;
  search_metadata: {
    query_tags: string[];
    assets_found: number;
    search_time: number;
    recommendations: string[];
  };
  error?: string;
}

export async function figmaSearch(params: FigmaSearchParams): Promise<FigmaSearchResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Searching local Figma assets:', {
      tags: params.tags,
      target_count: params.target_count,
      emotional_tone: params.emotional_tone
    });

    // Use existing local processor with search context
    const searchContext = {
      campaign_type: 'promotional' as const,
      emotional_tone: params.emotional_tone || 'positive' as const,
      target_count: params.target_count,
      diversity_mode: true,
      preferred_emotion: params.preferred_emotion,
      airline: params.airline,
      use_local_only: true
    };

    const result = await getLocalFigmaAssets(params.tags, searchContext);
    const searchTime = Date.now() - startTime;

    if (!result.success) {
      return {
        success: false,
        assets: [],
        search_metadata: {
          query_tags: params.tags,
          assets_found: 0,
          search_time: searchTime,
          recommendations: ['Try different tags', 'Check if assets exist locally']
        },
        error: result.error || 'Search failed'
      };
    }

    // Transform result to simple format
    const assets = result.assets.map(asset => ({
      fileName: asset.fileName,
      filePath: asset.filePath,
      tags: asset.tags,
      description: asset.description,
      emotion: asset.metadata?.emotion,
      category: asset.metadata?.category
    }));

    // Generate search recommendations
    const recommendations = generateSearchRecommendations(assets, params);

    return {
      success: true,
      assets,
      search_metadata: {
        query_tags: params.tags,
        assets_found: assets.length,
        search_time: searchTime,
        recommendations
      }
    };

  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('❌ Figma search failed:', error);

    return {
      success: false,
      assets: [],
      search_metadata: {
        query_tags: params.tags,
        assets_found: 0,
        search_time: searchTime,
        recommendations: ['Check error logs', 'Verify local assets exist']
      },
      error: error instanceof Error ? error.message : 'Unknown search error'
    };
  }
}

function generateSearchRecommendations(assets: any[], params: FigmaSearchParams): string[] {
  const recommendations: string[] = [];

  if (assets.length === 0) {
    recommendations.push('No assets found - try broader tags');
    recommendations.push('Check available emotions: happy, sad, angry, neutral, confused');
  } else if (assets.length < params.target_count) {
    recommendations.push('Found fewer assets than requested - try additional tags');
  } else {
    recommendations.push('Good asset selection found');
  }

  if (params.preferred_emotion && !assets.some(a => a.emotion === params.preferred_emotion)) {
    recommendations.push(`No ${params.preferred_emotion} emotion found - consider alternatives`);
  }

  if (params.airline && !assets.some(a => a.description.toLowerCase().includes(params.airline.toLowerCase()))) {
    recommendations.push(`No ${params.airline} airline assets found - check available logos`);
  }

  return recommendations;
}