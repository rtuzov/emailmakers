/**
 * ✂️ ASSET SPLITTER - Simple Tool
 * 
 * Простое разделение PNG спрайтов на отдельные изображения
 * Заменяет часть функциональности figma-asset-manager
 */

import { z } from 'zod';
import { splitFigmaSprite } from '../figma-sprite-splitter';

export const assetSplitterSchema = z.object({
  sprite_path: z.string().describe('Path to the PNG sprite file to split'),
  h_gap: z.number().default(15).describe('Horizontal gap threshold in pixels'),
  v_gap: z.number().default(15).describe('Vertical gap threshold in pixels'),
  confidence_threshold: z.number().default(0.9).describe('Minimum confidence threshold for classification'),
  output_prefix: z.string().optional().nullable().describe('Prefix for output filenames')
});

export type AssetSplitterParams = z.infer<typeof assetSplitterSchema>;

export interface AssetSplitterResult {
  success: boolean;
  split_results: {
    original_sprite: string;
    output_directory: string;
    split_images: Array<{
      filename: string;
      path: string;
      dimensions: {
        width: number;
        height: number;
      };
      classification?: {
        confidence: number;
        category: string;
        tags: string[];
      };
    }>;
  };
  split_metadata: {
    total_images_extracted: number;
    processing_time: number;
    average_confidence: number;
    recommendations: string[];
  };
  error?: string;
}

export async function assetSplitter(params: AssetSplitterParams): Promise<AssetSplitterResult> {
  const startTime = Date.now();
  
  try {
    console.log('✂️ Splitting sprite asset:', {
      sprite_path: params.sprite_path,
      h_gap: params.h_gap,
      v_gap: params.v_gap
    });

    // Use existing sprite splitter with options
    const splitOptions = {
      h_gap: params.h_gap,
      v_gap: params.v_gap,
      confidence_threshold: params.confidence_threshold
    };

    const result = await splitFigmaSprite(params.sprite_path, splitOptions);
    const processingTime = Date.now() - startTime;

    if (!result.success) {
      return {
        success: false,
        split_results: {
          original_sprite: params.sprite_path,
          output_directory: '',
          split_images: []
        },
        split_metadata: {
          total_images_extracted: 0,
          processing_time: processingTime,
          average_confidence: 0,
          recommendations: ['Check sprite file exists', 'Verify image format is PNG']
        },
        error: result.error || 'Sprite splitting failed'
      };
    }

    // Transform result to simple format
    const splitImages = result.split_images.map((image, index) => ({
      filename: params.output_prefix ? `${params.output_prefix}_${index + 1}.png` : image.filename,
      path: image.path,
      dimensions: {
        width: image.width || 0,
        height: image.height || 0
      },
      classification: image.classification ? {
        confidence: image.classification.confidence,
        category: image.classification.category,
        tags: image.classification.tags || []
      } : undefined
    }));

    // Calculate average confidence
    const confidenceScores = splitImages
      .map(img => img.classification?.confidence)
      .filter((score): score is number => score !== undefined);
    
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
      : 0;

    // Generate recommendations
    const recommendations = generateSplitterRecommendations(splitImages, params, averageConfidence);

    return {
      success: true,
      split_results: {
        original_sprite: params.sprite_path,
        output_directory: result.output_directory || '',
        split_images: splitImages
      },
      split_metadata: {
        total_images_extracted: splitImages.length,
        processing_time: processingTime,
        average_confidence: Math.round(averageConfidence * 100) / 100,
        recommendations
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Asset splitting failed:', error);

    return {
      success: false,
      split_results: {
        original_sprite: params.sprite_path,
        output_directory: '',
        split_images: []
      },
      split_metadata: {
        total_images_extracted: 0,
        processing_time: processingTime,
        average_confidence: 0,
        recommendations: ['Check file path', 'Verify image processing libraries']
      },
      error: error instanceof Error ? error.message : 'Unknown splitting error'
    };
  }
}

function generateSplitterRecommendations(
  splitImages: any[], 
  params: AssetSplitterParams, 
  averageConfidence: number
): string[] {
  const recommendations: string[] = [];

  if (splitImages.length === 0) {
    recommendations.push('No images extracted - check gap thresholds');
    recommendations.push(`Try reducing h_gap (${params.h_gap}) or v_gap (${params.v_gap})`);
    return recommendations;
  }

  if (splitImages.length === 1) {
    recommendations.push('Only one image extracted - sprite might not need splitting');
  } else {
    recommendations.push(`Successfully extracted ${splitImages.length} images from sprite`);
  }

  if (averageConfidence > 0) {
    if (averageConfidence >= 0.9) {
      recommendations.push('High classification confidence - excellent results');
    } else if (averageConfidence >= 0.7) {
      recommendations.push('Good classification confidence');
    } else {
      recommendations.push('Low classification confidence - manual review recommended');
    }
  }

  // Check for size variations
  const dimensions = splitImages.map(img => img.dimensions);
  const widths = dimensions.map(d => d.width);
  const heights = dimensions.map(d => d.height);
  
  const uniformWidth = new Set(widths).size === 1;
  const uniformHeight = new Set(heights).size === 1;

  if (uniformWidth && uniformHeight) {
    recommendations.push('Uniform image sizes detected - good for consistent layouts');
  } else {
    recommendations.push('Variable image sizes - consider responsive design approaches');
  }

  return recommendations;
}