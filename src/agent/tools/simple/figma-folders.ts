/**
 * 📁 FIGMA FOLDERS - Simple Tool
 * 
 * Простое получение информации о папках Figma ассетов
 * Заменяет часть функциональности figma-asset-manager
 */

import { z } from 'zod';
import { getLocalFigmaFoldersInfo } from '../figma-local-processor';

export const figmaFoldersSchema = z.object({
  include_stats: z.boolean().default(true).describe('Include folder statistics (file counts, etc.)'),
  include_priority: z.boolean().default(true).describe('Include priority information for folders'),
  filter_by_priority: z.number().optional().nullable().describe('Filter folders by minimum priority level')
});

export type FigmaFoldersParams = z.infer<typeof figmaFoldersSchema>;

export interface FigmaFoldersResult {
  success: boolean;
  folders: Array<{
    name: string;
    priority: number;
    description: string;
    file_count: number;
    categories: string[];
    usage_examples: string[];
  }>;
  folder_metadata: {
    total_folders: number;
    total_assets: number;
    priority_distribution: Record<number, number>;
    recommendations: string[];
  };
  error?: string;
}

export async function figmaFolders(params: FigmaFoldersParams): Promise<FigmaFoldersResult> {
  const startTime = Date.now();
  
  try {
    console.log('📁 Getting Figma folders information:', {
      include_stats: params.include_stats,
      include_priority: params.include_priority
    });

    // Use existing local processor
    const result = await getLocalFigmaFoldersInfo();

    if (!result.success) {
      return {
        success: false,
        folders: [],
        folder_metadata: {
          total_folders: 0,
          total_assets: 0,
          priority_distribution: {},
          recommendations: ['Check if local Figma folders exist', 'Verify folder structure']
        },
        error: result.error || 'Failed to get folder information'
      };
    }

    // Transform and filter folders
    let folders = result.folders.map(folder => ({
      name: folder.name,
      priority: folder.priority,
      description: folder.description,
      file_count: folder.file_count,
      categories: folder.categories || [],
      usage_examples: folder.usage_examples || []
    }));

    // Apply priority filter if specified
    if (params.filter_by_priority) {
      folders = folders.filter(folder => folder.priority >= params.filter_by_priority!);
    }

    // Sort by priority (highest first)
    folders.sort((a, b) => b.priority - a.priority);

    // Calculate metadata
    const totalAssets = folders.reduce((sum, folder) => sum + folder.file_count, 0);
    const priorityDistribution: Record<number, number> = {};
    
    folders.forEach(folder => {
      priorityDistribution[folder.priority] = (priorityDistribution[folder.priority] || 0) + 1;
    });

    // Generate recommendations
    const recommendations = generateFolderRecommendations(folders, params);

    return {
      success: true,
      folders,
      folder_metadata: {
        total_folders: folders.length,
        total_assets: totalAssets,
        priority_distribution: priorityDistribution,
        recommendations
      }
    };

  } catch (error) {
    console.error('❌ Figma folders query failed:', error);

    return {
      success: false,
      folders: [],
      folder_metadata: {
        total_folders: 0,
        total_assets: 0,
        priority_distribution: {},
        recommendations: ['Check error logs', 'Verify local setup']
      },
      error: error instanceof Error ? error.message : 'Unknown folders error'
    };
  }
}

function generateFolderRecommendations(folders: any[], params: FigmaFoldersParams): string[] {
  const recommendations: string[] = [];

  if (folders.length === 0) {
    recommendations.push('No folders found - check local Figma setup');
    return recommendations;
  }

  // Find high priority folders
  const highPriorityFolders = folders.filter(f => f.priority >= 8);
  if (highPriorityFolders.length > 0) {
    recommendations.push(`High priority folders available: ${highPriorityFolders.map(f => f.name).join(', ')}`);
  }

  // Check for emotion-based folders
  const emotionFolders = folders.filter(f => f.name.includes('эмоции') || f.name.includes('emotion'));
  if (emotionFolders.length > 0) {
    recommendations.push('Emotion-based assets available for expressive campaigns');
  }

  // Check for brand assets
  const brandFolders = folders.filter(f => f.name.includes('айдентика') || f.name.includes('логотипы'));
  if (brandFolders.length > 0) {
    recommendations.push('Brand identity and logos available for professional campaigns');
  }

  // Asset distribution insight
  const avgAssetsPerFolder = folders.reduce((sum, f) => sum + f.file_count, 0) / folders.length;
  if (avgAssetsPerFolder > 10) {
    recommendations.push('Rich asset collection - consider targeted searches');
  } else {
    recommendations.push('Focused asset collection - good for specific use cases');
  }

  return recommendations;
}