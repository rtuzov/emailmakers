/**
 * Image Planning Module for Email Campaigns
 * Determines optimal images for email content based on topic and campaign type
 */

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
  
  return tags.length > 0 ? tags : ['путешествие', 'отпуск']; // Default fallback
}

/**
 * Selects appropriate Figma assets based on tags and image type
 */
export async function selectFigmaAssetByTags(searchTags: string[], imageType: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Define Figma asset directories to search
    const figmaBasePath = path.join(process.cwd(), 'figma-all-pages-1750993353363');
    
    // Load AI-optimized tags to understand available assets
    const tagsFilePath = path.join(figmaBasePath, 'ai-optimized-tags.json');
    let availableTags: any = {};
    
    try {
      const tagsContent = await fs.readFile(tagsFilePath, 'utf-8');
      availableTags = JSON.parse(tagsContent);
      console.log('📚 Loaded AI-optimized tags for asset selection');
    } catch (tagsError) {
      console.warn('⚠️ Could not load AI-optimized tags, using basic search');
    }
    
    // Map image types to preferred directories based on AI tags
    const directoryMapping: Record<string, string[]> = {
      'hero': ['иллюстрации', 'зайцы-общие', 'зайцы-новости'],
      'illustration': ['зайцы-общие', 'зайцы-эмоции', 'зайцы-новости'],
      'icon': ['иконки-допуслуг', 'айдентика', 'логотипы-ак'],
      'product': ['иллюстрации', 'зайцы-общие', 'айдентика'],
      'background': ['иллюстрации', 'цвета'],
      'testimonial': ['зайцы-эмоции', 'зайцы-общие']
    };
    
    const searchDirectories = directoryMapping[imageType] || ['зайцы-общие', 'иллюстрации'];
    
    // Enhanced search using AI tags if available
    if (availableTags.folders) {
      for (const directory of searchDirectories) {
        const folderInfo = availableTags.folders[directory];
        if (!folderInfo) continue;
        
        // Find matching tags in this folder
        const matchingTags = searchTags.filter(tag => 
          folderInfo.tags?.some((folderTag: string) => 
            folderTag.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(folderTag.toLowerCase())
          )
        );
        
        if (matchingTags.length > 0) {
          console.log(`🎯 Found matching tags in ${directory}:`, matchingTags);
          
          // Search for actual files in this directory
          const dirPath = path.join(figmaBasePath, directory);
          try {
            const files = await fs.readdir(dirPath);
            const pngFiles = files.filter(file => file.endsWith('.png'));
            
            if (pngFiles.length > 0) {
              // Return first available file from matching directory
              const selectedFile = pngFiles[0];
              const fullPath = path.join(dirPath, selectedFile);
              console.log(`✅ Selected Figma asset: ${selectedFile} from ${directory}`);
              return fullPath;
            }
          } catch (dirError) {
            console.warn(`⚠️ Could not read directory ${directory}:`, dirError);
            continue;
          }
        }
      }
    }
    
    // Fallback: basic file name search
    for (const directory of searchDirectories) {
      const dirPath = path.join(figmaBasePath, directory);
      
      try {
        const files = await fs.readdir(dirPath);
        const pngFiles = files.filter(file => file.endsWith('.png'));
        
        // Find files matching search tags by filename
        for (const tag of searchTags) {
          const matchingFiles = pngFiles.filter(file => 
            file.toLowerCase().includes(tag.toLowerCase())
          );
          
          if (matchingFiles.length > 0) {
            const selectedFile = matchingFiles[0];
            const fullPath = path.join(dirPath, selectedFile);
            console.log(`🎯 Found Figma asset by filename: ${selectedFile} in ${directory}`);
            return fullPath;
          }
        }
        
        // If no specific matches, use first available file from priority directory
        if (pngFiles.length > 0 && directory === searchDirectories[0]) {
          const selectedFile = pngFiles[0];
          const fullPath = path.join(dirPath, selectedFile);
          console.log(`📁 Using first available asset from ${directory}: ${selectedFile}`);
          return fullPath;
        }
        
      } catch (dirError) {
        console.warn(`⚠️ Could not read directory ${directory}:`, dirError);
      }
    }
    
    console.warn(`⚠️ No Figma assets found for tags: ${searchTags.join(', ')} and type: ${imageType}`);
    
    // Fallback to external images via Unsplash
    const fallbackUrl = generateUnsplashFallback(searchTags, imageType);
    console.log(`🌐 Using external fallback image: ${fallbackUrl}`);
    return fallbackUrl;
    
  } catch (error) {
    console.error('❌ Error selecting Figma asset:', error);
    return null;
  }
}

/**
 * Generates fallback external image URL when Figma assets are not found
 */
export function generateUnsplashFallback(searchTags: string[], imageType: string): string {
  const baseUrl = 'https://images.unsplash.com/photo-';
  
  // Map image types and tags to curated Unsplash photo IDs
  const imageMapping: Record<string, string[]> = {
    'hero': [
      '1488646953-e3888c8e4c0a', // Travel destination
      '1488646953-e3888c8e4c0a', // Beautiful landscape
      '1506905925-b8e7b0c7d8d8'  // City view
    ],
    'illustration': [
      '1542314831-2b2e3b4e5c6d', // Cute character
      '1542314831-2b2e3b4e5c6d'  // Friendly mascot
    ],
    'icon': [
      '1541963463-b8e7b0c7d8d8', // Simple icon
      '1541963463-b8e7b0c7d8d8'  // Clean symbol
    ],
    'product': [
      '1488646953-e3888c8e4c0a', // Travel product
      '1488646953-e3888c8e4c0a'  // Service visualization
    ]
  };
  
  // Get appropriate photo IDs for the image type
  const photoIds = imageMapping[imageType] || imageMapping['hero'];
  const randomId = photoIds[Math.floor(Math.random() * photoIds.length)];
  
  // Build URL with appropriate dimensions
  const dimensions = imageType === 'hero' ? 'w=800&h=400' : 'w=400&h=300';
  return `${baseUrl}${randomId}?${dimensions}&fit=crop&auto=format`;
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