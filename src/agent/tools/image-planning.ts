/**
 * Image Planning Module for Email Campaigns
 * Determines optimal images for email content based on topic and campaign type
 */

import { AssetManager, AssetSearchParams } from '../core/asset-manager';

export interface ImagePlanningConfig {
  content: any;
  topic: string;
  campaign_type: string;
  emotional_tone: string;
}

export interface ImagePlanItem {
  position: number;
  type: 'hero' | 'illustration' | 'icon' | 'background' | 'product' | 'testimonial';
  content_description: string;
  size_priority: 'large' | 'medium' | 'small';
  emotional_tone: string;
  search_tags: string[];
  placement?: 'header' | 'body' | 'footer' | 'sidebar';
  fallback_options?: string[];
}

export interface ImagePlan {
  total_images_needed: number;
  figma_assets_needed: number;
  image_plan: ImagePlanItem[];
  layout_optimization: {
    mobile_friendly: boolean;
    load_time_optimized: boolean;
    accessibility_compliant: boolean;
  };
}

/**
 * Plans optimal images for email content based on topic and campaign requirements
 */
export async function planEmailImages(params: ImagePlanningConfig): Promise<ImagePlan> {
  console.log('🖼️ Image Planning Module: Analyzing content for optimal image strategy...');
  
  // Analyze content to determine image needs
  const contentLength = (params.content.subject?.length || 0) + (params.content.body?.length || 0);
  const topicLower = params.topic.toLowerCase();
  
  // Determine base image count based on content length and type
  let baseImageCount = 2; // Default: hero + illustration
  if (contentLength > 500) baseImageCount = 3; // Add product/testimonial
  if (contentLength > 1000) baseImageCount = 4; // Add background/icon
  
  // Adjust for topic type
  if (topicLower.includes('франци') || topicLower.includes('путешеств') || topicLower.includes('поездк')) {
    baseImageCount += 1; // Travel needs more visuals
  }
  
  // Create image plan
  const imagePlan = [];
  
  // 1. Hero image (always needed)
  imagePlan.push({
    position: 1,
    type: 'hero' as const,
    content_description: `Hero image for ${params.topic} showing destination or travel scene`,
    size_priority: 'large' as const,
    emotional_tone: params.emotional_tone,
    search_tags: extractTopicTags(params.topic).concat(['путешествие', 'туризм']),
    placement: 'header' as const
  });
  
  // 2. Illustration/mascot (Kupibilet rabbit)
  imagePlan.push({
    position: 2,
    type: 'illustration' as const,
    content_description: 'Kupibilet rabbit mascot with travel theme',
    size_priority: 'medium' as const,
    emotional_tone: 'positive',
    search_tags: ['заяц', 'кролик', 'путешествие', 'счастливый'],
    placement: 'body' as const
  });
  
  // 3. Additional images based on content
  if (baseImageCount >= 3) {
    imagePlan.push({
      position: 3,
      type: 'product' as const,
      content_description: 'Travel product or service visualization',
      size_priority: 'medium' as const,
      emotional_tone: params.emotional_tone,
      search_tags: ['билеты', 'самолет', 'авиакомпания'],
      placement: 'body' as const
    });
  }
  
  if (baseImageCount >= 4) {
    imagePlan.push({
      position: 4,
      type: 'icon' as const,
      content_description: 'Supporting icons for features or benefits',
      size_priority: 'small' as const,
      emotional_tone: 'neutral',
      search_tags: ['иконка', 'сервис', 'удобство'],
      placement: 'footer' as const
    });
  }
  
  console.log(`🎯 Image Planning Module: Planned ${baseImageCount} images for optimal engagement`);
  
  return {
    total_images_needed: baseImageCount,
    figma_assets_needed: Math.min(baseImageCount, 3), // Prefer Figma assets for first 3 images
    image_plan: imagePlan,
    layout_optimization: {
      mobile_friendly: true,
      load_time_optimized: true,
      accessibility_compliant: true
    }
  };
}

/**
 * Extracts topic-relevant tags for asset selection
 */
export function extractTopicTags(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  const tags = [];
  
  // Geographic tags
  if (topicLower.includes('франци')) tags.push('франция', 'париж', 'европа');
  if (topicLower.includes('италь')) tags.push('италия', 'рим', 'венеция');
  if (topicLower.includes('испан')) tags.push('испания', 'мадрид', 'барселона');
  
  // Seasonal tags  
  if (topicLower.includes('осен')) tags.push('осень', 'сентябрь', 'октябрь');
  if (topicLower.includes('зим')) tags.push('зима', 'снег', 'новый год');
  if (topicLower.includes('лет')) tags.push('лето', 'солнце', 'пляж');
  if (topicLower.includes('весн')) tags.push('весна', 'цветы', 'природа');
  
  // Activity tags
  if (topicLower.includes('путешеств')) tags.push('путешествие', 'отпуск', 'туризм');
  if (topicLower.includes('отдых')) tags.push('отдых', 'релакс', 'vacation');
  if (topicLower.includes('экскурс')) tags.push('экскурсия', 'достопримечательности');
  
  if (tags.length === 0) {
    // ❌ FALLBACK POLICY: absence of topic tags is a critical error
    throw new Error('extractTopicTags: unable to determine topic tags – insufficient input.');
  }
  return tags;
}

/**
 * Selects appropriate Figma assets based on tags and image type using AI-powered AssetManager
 * Enhanced version with intelligent tag selection and external image fallback
 */
export async function selectFigmaAssetByTags(searchTags: string[], imageType: string, contentPackage?: any): Promise<string | null> {
  try {
    console.log(`🎯 AI-Powered Asset Selection: Searching for ${imageType} with tags:`, searchTags);
    
    const assetManager = new AssetManager();
    
    // Map image types to campaign types
    const campaignTypeMapping: Record<string, 'seasonal' | 'promotional' | 'informational'> = {
      'hero': 'promotional',
      'illustration': 'informational', 
      'icon': 'informational',
      'product': 'promotional',
      'background': 'seasonal',
      'testimonial': 'promotional'
    };
    
    // Map image types to emotional tones
    const emotionalToneMapping: Record<string, 'positive' | 'neutral' | 'urgent' | 'friendly'> = {
      'hero': 'positive',
      'illustration': 'friendly',
      'icon': 'neutral',
      'product': 'positive', 
      'background': 'neutral',
      'testimonial': 'positive'
    };
    
    // Enhanced search parameters with image requirements
    const searchParams: AssetSearchParams = {
      tags: searchTags,
      emotional_tone: emotionalToneMapping[imageType] || 'friendly',
      campaign_type: campaignTypeMapping[imageType] || 'promotional',
      target_count: 1,
      preferred_emotion: 'happy',
      image_requirements: {
        total_images_needed: 1,
        figma_images_count: 1,
        internet_images_count: 0,
        require_logo: imageType === 'logo',
        image_categories: [imageType as any],
        size_constraints: {
          max_width: 800,
          max_height: 600,
          max_file_size_kb: 500
          }
        }
    };
    
    // Use AI-powered asset search with intelligent fallback
    const searchResult = await assetManager.searchAssets(searchParams, contentPackage);
    
    if (searchResult.success && searchResult.assets.length > 0) {
      const selectedAsset = searchResult.assets[0]; // Take highest relevance score
      console.log(`✅ AI-Selected Asset: ${selectedAsset.fileName} (relevance: ${selectedAsset.relevanceScore}, source: ${selectedAsset.source})`);
      
      // Log the intelligent tag selection results
      if (searchResult.search_metadata.figma_tags_used.length > 0) {
        console.log(`📚 Figma tags used: ${searchResult.search_metadata.figma_tags_used.join(', ')}`);
      }
      if (searchResult.search_metadata.external_sources_used) {
        console.log(`🌐 External sources: ${searchResult.search_metadata.external_sources_used.join(', ')}`);
      }
      
      return selectedAsset.filePath;
    }
    
    // ❌ FALLBACK POLICY: No fallback allowed - fail fast
    throw new Error(`selectFigmaAssetByTags: Enhanced AssetManager found no suitable assets for tags: ${searchTags.join(', ')} and type: ${imageType}`);
    
  } catch (error) {
    console.error(`❌ AI Asset Selection Error: ${error.message}`);
    throw error;
  }
}

/**
 * Generates fallback external image URL when Figma assets are not found
 */
export function generateUnsplashFallback(): never {
  throw new Error('generateUnsplashFallback is disabled by project policy.');
}

/**
 * Recursively searches for asset files in Figma directories
 */
export async function findFigmaAsset(basePath: string, assetName: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Recursive function to search directories
    async function searchDirectory(dirPath: string): Promise<string | null> {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        // First, look for exact file matches
        for (const entry of entries) {
          if (entry.isFile()) {
            const fileName = entry.name;
            // Check if filename matches (with or without extension)
            if (fileName === assetName || 
                fileName.replace(/\.[^/.]+$/, '') === assetName.replace(/\.[^/.]+$/, '') ||
                fileName.toLowerCase().includes(assetName.toLowerCase())) {
              return path.join(dirPath, fileName);
            }
          }
        }
        
        // Then search subdirectories
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const found = await searchDirectory(path.join(dirPath, entry.name));
            if (found) return found;
          }
        }
        
        return null;
      } catch (error) {
        console.warn(`Warning: Could not search directory ${dirPath}:`, error.message);
        return null;
      }
    }
    
    return await searchDirectory(basePath);
  } catch (error) {
    console.error('Error in findFigmaAsset:', error);
    return null;
  }
} 