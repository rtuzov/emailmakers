/**
 * 🔍 FIGMA SEARCH - Simple Tool
 * 
 * Простой поиск ассетов по тегам в локальных Figma папках
 * Заменяет часть функциональности figma-asset-manager
 */

import { z } from 'zod';
import { getLocalFigmaAssets } from '../figma-local-processor';

export const FigmaSearchSchema = z.object({
    search_query: z.string().describe('Search query for Figma assets'),
    emotional_tone: z.string().describe('Emotional tone of the campaign: positive, neutral, urgent, friendly'),
    target_count: z.number().describe('Number of assets to return'),
    preferred_emotion: z.string().describe('Preferred rabbit emotion: happy, angry, neutral, sad, confused'),
    airline: z.string().describe('Specific airline for logo search')
});

export type FigmaSearchParams = z.infer<typeof FigmaSearchSchema>;

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
    // Simplified logging - detailed logs are in figma-local-processor
    console.log(`🔍 Figma search: ${params.search_query.length} tags, target: ${params.target_count}`);

    // Use existing local processor with search context
    const emotionalTone = params.emotional_tone || 'positive';
    const validTones = ['positive', 'neutral', 'urgent', 'friendly'];
    const normalizedTone = validTones.includes(emotionalTone) ? emotionalTone : 'positive';
    
    const preferredEmotion = params.preferred_emotion || '';
    const validEmotions = ['neutral', 'happy', 'angry', 'sad', 'confused'];
    const normalizedEmotion = validEmotions.includes(preferredEmotion) ? preferredEmotion : undefined;
    
    const searchContext = {
      campaign_type: 'promotional' as const,
      emotional_tone: normalizedTone as "positive" | "neutral" | "urgent" | "friendly",
      target_count: params.target_count,
      diversity_mode: true,
      ...(normalizedEmotion && { preferred_emotion: normalizedEmotion as "neutral" | "happy" | "angry" | "sad" | "confused" }),
      ...(params.airline && { airline: params.airline }),
      use_local_only: true
    };

    const result = await getLocalFigmaAssets({
      tags: [params.search_query],
      context: searchContext
    });
    const searchTime = Date.now() - startTime;

    if (!result.success) {
      return {
        success: false,
        assets: [],
        search_metadata: {
          query_tags: [params.search_query],
          assets_found: 0,
          search_time: searchTime,
          recommendations: ['Try different tags', 'Check if assets exist locally']
        },
        error: result.error || 'Search failed'
      };
    }

    // Transform result to simple format
    const assets = Object.entries(result.data.metadata).map(([fileName, asset]: [string, any]) => ({
      fileName: fileName,
      filePath: asset.path,
      tags: asset.metadata.allTags || [],
      description: asset.metadata.description || '',
      emotion: asset.metadata.aiAnalysis?.emotionalTone,
      category: asset.metadata.folderName
    }));

    // Generate search recommendations
    const recommendations = generateSearchRecommendations(assets, params);

    return {
      success: true,
      assets,
      search_metadata: {
        query_tags: [params.search_query],
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
        query_tags: [params.search_query],
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

  if (params.preferred_emotion && params.preferred_emotion.trim() !== '' && !assets.some(a => a.emotion === params.preferred_emotion)) {
    recommendations.push(`No ${params.preferred_emotion} emotion found - consider alternatives`);
  }

  if (params.airline && params.airline.trim() !== '' && !assets.some(a => a.description.toLowerCase().includes(params.airline.toLowerCase()))) {
    recommendations.push(`No ${params.airline} airline assets found - check available logos`);
  }

  return recommendations;
}