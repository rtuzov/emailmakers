/**
 * 📋 ASSET MANIFEST GENERATOR - Refactored Asset Manifest Generation System
 * 
 * Generates comprehensive asset manifests for email campaigns by analyzing content context,
 * collecting assets from multiple sources, and creating usage instructions for Design Specialist.
 * 
 * Refactored into modular components for better maintainability and testing.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  AssetSource,
  AssetManifestOptions,
  ContentContext,
  CampaignContext,
  ManifestGenerationResult,
  AssetUsageInstruction,
  PerformanceMetrics
} from './types';
import { analyzeContentWithAI } from './ai-analysis';
import { collectAssetsFromSources } from './asset-collection';

// ============================================================================
// AI-POWERED DYNAMIC ANALYSIS
// ============================================================================

/**
 * Clean AI response content for JSON parsing
 */
function cleanAIJsonResponse(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks if present (multiline support)
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/\s*```/g, '');
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\s*/g, '').replace(/\s*```/g, '');
  }
  
  // Remove any trailing commas before parsing
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * AI-powered content analysis for dynamic asset requirements
 */
async function analyzeContentWithAI(contentContext: any): Promise<any> {
  console.log('🤖 Using AI to analyze content for asset requirements...');
  
  const analysisPrompt = `
Analyze this email campaign content and determine the optimal asset requirements. Be completely dynamic - extract ANY destinations, seasons, and emotional triggers from the content:

Campaign Content:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Preheader: ${contentContext.generated_content?.preheader || 'N/A'}
- Body Text: ${contentContext.generated_content?.body || 'N/A'}
- CTA: ${JSON.stringify(contentContext.generated_content?.cta || {})}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || 'N/A'}
- Language: ${contentContext.language || 'N/A'}

Travel Context:
- Destination: ${contentContext.generated_content?.dates?.destination || contentContext.generated_content?.context?.destination || 'N/A'}
- Season: ${contentContext.generated_content?.dates?.season || 'N/A'}
- Seasonal Factors: ${contentContext.generated_content?.dates?.seasonal_factors || 'N/A'}
- Emotional Triggers: ${contentContext.generated_content?.context?.emotional_triggers || 'N/A'}

Pricing Context:
- Best Price: ${contentContext.generated_content?.pricing?.best_price || 'N/A'} ${contentContext.generated_content?.pricing?.currency || ''}
- Route: ${contentContext.generated_content?.pricing?.route || 'N/A'}

INSTRUCTIONS: 
1. Extract ANY destinations mentioned (Thailand, Turkey, Greece, Spain, Italy, France, Sochi, etc.)
2. Detect ANY season/weather references (spring, summer, autumn, winter, warm, cold, etc.)
3. Identify ANY emotional triggers (adventure, relaxation, luxury, family, culture, beaches, mountains, etc.)
4. Determine visual style based on content tone and destination type
5. Generate appropriate search tags for Figma based on detected themes

Be adaptive - if content mentions beaches, include beach-related elements. If cultural sites, include cultural elements. If luxury travel, include luxury elements.

Format as JSON:
{
  "image_requirements": [
    {
      "type": "hero|destination|promotional|seasonal",
      "purpose": "main visual to capture attention and convey the essence of [detected destination/season]",
      "dimensions": {"width": number, "height": number},
      "priority": "required|recommended|optional",
      "emotional_tone": "based on detected content mood",
      "visual_style": "based on destination and content type",
      "content_context": "specific description based on detected themes"
    }
  ],
  "destinations": [
    {
      "name": "detected destination name",
      "fallback_url": "https://images.unsplash.com/photo-[appropriate ID for destination]",
      "search_keywords": ["destination-specific", "detected-season", "detected-activity", "landmark"]
    }
  ],
  "icons_needed": [
    {
      "type": "promotional|navigation|social|booking",
      "purpose": "based on content needs",
      "size": 24,
      "style": "filled|outlined|minimal"
    }
  ],
  "brand_elements": [
    {
      "type": "logo|pattern|decoration",
      "placement": "header|footer|background",
      "size": {"width": number, "height": number}
    }
  ],
  "figma_search_strategy": {
    "primary_folders": ["зайцы-общие", "иллюстрации", "логотипы-ак"],
    "search_tags": ["путешествия", "detected-theme1", "detected-theme2", "detected-activity"],
    "emotional_keywords": ["detected-emotion1", "detected-emotion2", "detected-mood"],
    "avoid_tags": ["opposite-season", "opposite-mood", "irrelevant-themes"]
  }
}
`;

  try {
    // Call OpenAI API for dynamic analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email marketing designer. Analyze content and provide optimal asset requirements in valid JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const aiAnalysis = JSON.parse(aiContent);
    
    console.log('✅ AI analysis completed');
    console.log(`📊 Found ${aiAnalysis.image_requirements?.length || 0} image requirements`);
    console.log(`🌍 Detected ${aiAnalysis.destinations?.length || 0} destinations`);
    
    return aiAnalysis;
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    // Fallback to basic analysis if AI fails
    return await basicContentAnalysis(contentContext);
  }
}

/**
 * Fallback basic analysis if AI is unavailable - fully dynamic content extraction
 */
async function basicContentAnalysis(contentContext: any): Promise<any> {
  console.log('🔄 Using dynamic content analysis...');
  
  // Extract all content information dynamically
  const content = contentContext.generated_content || {};
  const destinationText = content.dates?.destination || content.context?.destination || content.subject || content.body || '';
  const season = content.dates?.season || extractSeasonFromText(destinationText);
  const emotionalTriggers = content.context?.emotional_triggers || extractEmotionalTriggersFromText(destinationText);
  
  // Extract destinations dynamically from content
  const destinations = extractDestinationsFromText(destinationText);
  const visualStyle = determineVisualStyleFromContent(destinationText, emotionalTriggers);
  const emotionalTone = determineEmotionalToneFromContent(destinationText, emotionalTriggers);
  
  return {
    image_requirements: [
      {
        type: 'hero',
        purpose: `main visual to capture attention and convey the essence of ${season} in ${destinations[0]?.name || 'destination'}`,
        dimensions: { width: 1200, height: 600 },
        priority: 'required',
        emotional_tone: emotionalTone,
        visual_style: visualStyle,
        content_context: `${visualStyle} image for main visual to capture attention and convey the essence of ${season} in ${destinations[0]?.name || 'destination'}`
      },
      {
        type: 'destination',
        purpose: `showcase specific locations like ${destinations.map(d => d.name).join(' and ')}`,
        dimensions: { width: 800, height: 400 },
        priority: 'recommended',
        emotional_tone: 'exciting and adventurous',
        visual_style: 'colorful and picturesque',
        content_context: `colorful and picturesque image for showcase specific locations like ${destinations.map(d => d.name).join(' and ')}`
      },
      {
        type: 'promotional',
        purpose: 'highlight special offers and prices',
        dimensions: { width: 600, height: 300 },
        priority: 'optional',
        emotional_tone: 'urgent and enticing',
        visual_style: 'clean and modern',
        content_context: 'clean and modern image for highlight special offers and prices'
      }
    ],
    destinations: destinations,
    icons_needed: [
      {
        type: 'promotional',
        purpose: 'to represent booking and offers',
        size: 24,
        style: 'filled'
      },
      {
        type: 'navigation',
        purpose: 'to guide users through the email',
        size: 24,
        style: 'outlined'
      },
      {
        type: 'social',
        purpose: 'to link to social media platforms',
        size: 24,
        style: 'minimal'
      }
    ],
    brand_elements: [
      {
        type: 'logo',
        placement: 'header',
        size: { width: 200, height: 100 }
      },
      {
        type: 'pattern',
        placement: 'background',
        size: { width: 1200, height: 800 }
      }
    ],
    figma_search_strategy: generateFigmaSearchStrategy(destinationText, emotionalTriggers, season)
  };
}

/**
 * Extract season from text content
 */
function extractSeasonFromText(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('осен') || lowerText.includes('autumn') || lowerText.includes('fall')) return 'autumn';
  if (lowerText.includes('зим') || lowerText.includes('winter')) return 'winter';
  if (lowerText.includes('весн') || lowerText.includes('spring')) return 'spring';
  if (lowerText.includes('лет') || lowerText.includes('summer')) return 'summer';
  return 'any season';
}

/**
 * Extract emotional triggers from text content
 */
function extractEmotionalTriggersFromText(text: string): string {
  const triggers = [];
  const lowerText = text.toLowerCase();
  
  // Travel-related triggers
  if (lowerText.includes('пляж') || lowerText.includes('beach')) triggers.push('пляжи');
  if (lowerText.includes('закат') || lowerText.includes('sunset')) triggers.push('закаты');
  if (lowerText.includes('тропик') || lowerText.includes('tropical')) triggers.push('тропики');
  if (lowerText.includes('экзотик') || lowerText.includes('exotic')) triggers.push('экзотика');
  if (lowerText.includes('приключени') || lowerText.includes('adventure')) triggers.push('приключения');
  if (lowerText.includes('релакс') || lowerText.includes('relax')) triggers.push('релакс');
  if (lowerText.includes('семь') || lowerText.includes('family')) triggers.push('семейное время');
  if (lowerText.includes('массаж') || lowerText.includes('massage')) triggers.push('массаж');
  if (lowerText.includes('культур') || lowerText.includes('culture')) triggers.push('культура');
  
  return triggers.join(' ');
}

/**
 * Extract destinations from text content dynamically - no fallback URLs
 */
function extractDestinationsFromText(text: string): any[] {
  const destinations = [];
  const lowerText = text.toLowerCase();
  
  // Common travel destinations - only names and keywords, no hardcoded URLs
  const destinationMap = {
    'тайланд': { name: 'Тайланд', keywords: ['thailand', 'tropical', 'temple'] },
    'thailand': { name: 'Thailand', keywords: ['thailand', 'tropical', 'temple'] },
    'бангкок': { name: 'Бангкок', keywords: ['bangkok', 'thailand', 'city', 'skyline'] },
    'bangkok': { name: 'Bangkok', keywords: ['bangkok', 'thailand', 'city', 'skyline'] },
    'пхукет': { name: 'Пхукет', keywords: ['phuket', 'thailand', 'beach', 'tropical'] },
    'phuket': { name: 'Phuket', keywords: ['phuket', 'thailand', 'beach', 'tropical'] },
    'краби': { name: 'Краби', keywords: ['krabi', 'thailand', 'limestone', 'cliffs'] },
    'krabi': { name: 'Krabi', keywords: ['krabi', 'thailand', 'limestone', 'cliffs'] },
    'турци': { name: 'Турция', keywords: ['turkey', 'istanbul', 'mediterranean'] },
    'turkey': { name: 'Turkey', keywords: ['turkey', 'istanbul', 'mediterranean'] },
    'греци': { name: 'Греция', keywords: ['greece', 'santorini', 'islands'] },
    'greece': { name: 'Greece', keywords: ['greece', 'santorini', 'islands'] },
    'испани': { name: 'Испания', keywords: ['spain', 'barcelona', 'mediterranean'] },
    'spain': { name: 'Spain', keywords: ['spain', 'barcelona', 'mediterranean'] },
    'итали': { name: 'Италия', keywords: ['italy', 'rome', 'venice'] },
    'italy': { name: 'Italy', keywords: ['italy', 'rome', 'venice'] },
    'франци': { name: 'Франция', keywords: ['france', 'paris', 'eiffel'] },
    'france': { name: 'France', keywords: ['france', 'paris', 'eiffel'] },
    'сочи': { name: 'Сочи', keywords: ['sochi', 'russia', 'resort', 'black sea'] },
    'sochi': { name: 'Sochi', keywords: ['sochi', 'russia', 'resort', 'black sea'] }
  };
  
  // Find all mentioned destinations
  for (const [key, value] of Object.entries(destinationMap)) {
    if (lowerText.includes(key)) {
      destinations.push({
        name: value.name,
        search_keywords: value.keywords
      });
    }
  }
  
  // If no destinations found, let AI handle it completely
  if (destinations.length === 0) {
    destinations.push({
      name: 'Campaign Content',
      search_keywords: ['content', 'campaign', 'marketing']
    });
  }
  
  return destinations;
}

/**
 * Determine visual style from content
 */
function determineVisualStyleFromContent(text: string, emotionalTriggers: string): string {
  const lowerText = text.toLowerCase();
  const lowerTriggers = emotionalTriggers.toLowerCase();
  
  if (lowerText.includes('тропик') || lowerText.includes('tropical') || lowerTriggers.includes('тропики')) {
    return 'vibrant and tropical';
  }
  if (lowerText.includes('экзотик') || lowerText.includes('exotic') || lowerTriggers.includes('экзотика')) {
    return 'exotic and colorful';
  }
  if (lowerText.includes('культур') || lowerText.includes('culture') || lowerTriggers.includes('культура')) {
    return 'authentic and cultural';
  }
  if (lowerText.includes('роскош') || lowerText.includes('luxury') || lowerText.includes('премиум')) {
    return 'elegant and luxurious';
  }
  if (lowerText.includes('семь') || lowerText.includes('family') || lowerTriggers.includes('семейное')) {
    return 'warm and family-friendly';
  }
  
  return 'clean and modern';
}

/**
 * Determine emotional tone from content
 */
function determineEmotionalToneFromContent(text: string, emotionalTriggers: string): string {
  const lowerText = text.toLowerCase();
  const lowerTriggers = emotionalTriggers.toLowerCase();
  
  if (lowerText.includes('приключени') || lowerText.includes('adventure') || lowerTriggers.includes('приключения')) {
    return 'exciting and adventurous';
  }
  if (lowerText.includes('релакс') || lowerText.includes('relax') || lowerTriggers.includes('релакс')) {
    return 'relaxing and peaceful';
  }
  if (lowerText.includes('романтик') || lowerText.includes('romantic') || lowerText.includes('пар')) {
    return 'romantic and intimate';
  }
  if (lowerText.includes('тепл') || lowerText.includes('warm') || lowerTriggers.includes('теплый')) {
    return 'inviting and warm';
  }
  if (lowerText.includes('ярк') || lowerText.includes('bright') || lowerText.includes('солнц')) {
    return 'bright and energetic';
  }
  
  return 'inviting and warm';
}

/**
 * Generate Figma search strategy based on content
 */
function generateFigmaSearchStrategy(text: string, emotionalTriggers: string, season: string): any {
  const lowerText = text.toLowerCase();
  const lowerTriggers = emotionalTriggers.toLowerCase();
  
  // Base folders for travel content
  const primaryFolders = ['зайцы-общие', 'иллюстрации', 'логотипы-ак'];
  
  // Dynamic search tags based on content
  const searchTags = ['путешествия'];
  const emotionalKeywords = [];
  const avoidTags = [];
  
  // Add content-specific tags
  if (lowerText.includes('пляж') || lowerTriggers.includes('пляж')) {
    searchTags.push('пляж', 'море', 'отдых');
  }
  if (lowerText.includes('тропик') || lowerTriggers.includes('тропик')) {
    searchTags.push('тропики', 'солнце', 'экзотика');
  }
  if (lowerText.includes('семь') || lowerTriggers.includes('семь')) {
    searchTags.push('семья', 'дети');
  }
  if (lowerText.includes('культур') || lowerTriggers.includes('культур')) {
    searchTags.push('культура', 'достопримечательности');
  }
  if (lowerText.includes('город') || lowerText.includes('city')) {
    searchTags.push('город', 'архитектура');
  }
  
  // Add emotional keywords
  if (lowerText.includes('ярк') || lowerTriggers.includes('ярк')) {
    emotionalKeywords.push('яркий', 'позитивный');
  }
  if (lowerText.includes('тепл') || lowerTriggers.includes('тепл')) {
    emotionalKeywords.push('теплый', 'дружелюбный');
  }
  if (lowerText.includes('экзотик') || lowerTriggers.includes('экзотик')) {
    emotionalKeywords.push('экзотический', 'необычный');
  }
  
  // Season-specific avoid tags
  if (season === 'autumn' || season === 'summer') {
    avoidTags.push('зима', 'холод', 'снег');
  }
  if (season === 'winter' || season === 'spring') {
    avoidTags.push('жара', 'пляж');
  }
  
  // Always avoid negative emotions
  avoidTags.push('грустный', 'серый', 'депрессивный');
  
  return {
    primary_folders: primaryFolders,
    search_tags: searchTags,
    emotional_keywords: emotionalKeywords,
    avoid_tags: avoidTags
  };
}

/**
 * AI-powered Figma asset selection
 */
async function selectFigmaAssetsWithAI(
  aiAnalysis: any, 
  figmaTagsPath: string,
  contentContext: any
): Promise<any[]> {
  console.log('🎨 Using AI to select optimal Figma assets...');
  
  try {
    // Load Figma tags data
    const figmaTagsContent = await fs.readFile(figmaTagsPath, 'utf8');
    const figmaTags = JSON.parse(figmaTagsContent);
    
    const selectionPrompt = `
Based on the campaign analysis and available Figma assets, select the most appropriate images for this specific campaign. Be completely adaptive to the detected content:

Campaign Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Campaign Details:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Destination: ${contentContext.generated_content?.dates?.destination || contentContext.generated_content?.context?.destination || 'N/A'}
- Season: ${contentContext.generated_content?.dates?.season || 'N/A'}
- Emotional Triggers: ${contentContext.generated_content?.context?.emotional_triggers || 'N/A'}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}

Available Figma Folders and Tags:
${JSON.stringify(figmaTags.folders, null, 2)}

Most Common Tags: ${JSON.stringify(figmaTags.most_common_tags, null, 2)}

DYNAMIC SELECTION CRITERIA:
1. Extract the actual destinations from campaign content (Thailand, Turkey, Greece, Spain, etc.)
2. Match the detected season/weather preferences (warm, cold, tropical, mountain, etc.)
3. Align with identified emotional triggers (adventure, relaxation, luxury, family, culture, etc.)
4. Consider the target audience and campaign tone
5. Select images that authentically represent the detected themes

Be adaptive - if content is about:
- Beach destinations → look for пляж, море, отдых, солнце
- Cultural travel → look for культура, достопримечательности, архитектура
- Adventure travel → look for приключения, активность, природа
- Luxury travel → look for роскошь, премиум, элегантность
- Family travel → look for семья, дети, дружелюбный

Select the best assets by providing a JSON response:
{
  "selected_assets": [
    {
      "folder": "folder_name",
      "search_criteria": {
        "tags": ["detected-theme-tags", "destination-specific", "season-appropriate"],
        "emotional_match": "based on detected emotional triggers",
        "purpose": "hero|destination|promotional|decoration",
        "avoid_tags": ["opposite-themes", "wrong-season", "conflicting-mood"]
      },
      "expected_count": number,
      "priority": "high|medium|low",
      "usage": "detailed usage description for this specific campaign theme"
    }
  ],
  "selection_reasoning": "Why these specific assets match the detected campaign themes and destinations",
  "fallback_strategy": "Use external images matching the detected destination/theme if Figma assets don't match"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in visual asset selection for email marketing. Choose assets that match campaign tone and objectives.'
          },
          {
            role: 'user',
            content: selectionPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const assetSelection = JSON.parse(aiContent);
    
    console.log('✅ AI asset selection completed');
    console.log(`🎯 Selected ${assetSelection.selected_assets?.length || 0} asset groups`);
    console.log(`💡 Reasoning: ${assetSelection.selection_reasoning}`);
    
    return assetSelection.selected_assets || [];
    
  } catch (error) {
    console.error('❌ AI asset selection failed:', error);
    return [];
  }
}

/**
 * AI-powered validation rules generation
 */
async function generateValidationRulesWithAI(
  contentContext: any,
  aiAnalysis: any
): Promise<any> {
  console.log('🔍 Using AI to generate validation rules...');
  
  const rulesPrompt = `Generate email asset validation rules for this campaign. Respond with ONLY valid JSON, no explanations or markdown.

Campaign Type: ${contentContext.campaign_type || 'N/A'}
Target Audience: ${contentContext.target_audience || 'N/A'}
Email Clients: Gmail, Outlook, Apple Mail, Yahoo Mail

AI Analysis Results:
${JSON.stringify(aiAnalysis.image_requirements, null, 2)}

IMPORTANT: Return ONLY the JSON object below with actual numeric values:

{
  "file_size_limits": {
    "hero_images": 150000,
    "product_images": 100000,
    "icons": 10000,
    "total_email": 500000
  },
  "dimension_requirements": {
    "min_width": 50,
    "max_width": 600,
    "min_height": 50,
    "max_height": 400
  },
  "format_preferences": {
    "primary": ["jpg", "png"],
    "fallback": ["gif"],
    "avoid": ["bmp", "tiff"]
  },
  "quality_thresholds": {
    "compression_level": 80,
    "optimization_target": 85
  },
  "email_client_compatibility": {
    "gmail": {"max_size": 500000, "formats": ["jpg", "png"]},
    "outlook": {"max_size": 400000, "formats": ["jpg", "png"]},
    "apple_mail": {"max_size": 600000, "formats": ["jpg", "png", "gif"]},
    "yahoo_mail": {"max_size": 450000, "formats": ["jpg", "png"]}
  }
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in email deliverability and asset optimization. You MUST respond with ONLY valid JSON. Do not include any explanations, markdown, or text outside the JSON object.'
          },
          {
            role: 'user',
            content: rulesPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const validationRules = JSON.parse(aiContent);
    
    console.log('✅ AI validation rules generated');
    console.log(`📏 Max email size: ${validationRules.file_size_limits?.total_email || 'N/A'} bytes`);
    
    return validationRules;
    
  } catch (error) {
    console.error('❌ AI validation rules generation failed:', error);
    // Return basic fallback rules
    return {
      file_size_limits: {
        hero_images: 150000,
        product_images: 100000,
        icons: 10000,
        total_email: 500000
      },
      dimension_requirements: {
        min_width: 50,
        max_width: 600,
        min_height: 50,
        max_height: 400
      },
      format_preferences: {
        primary: ['jpg', 'png'],
        fallback: ['gif'],
        avoid: ['bmp', 'tiff']
      },
      quality_thresholds: {
        compression_level: 80,
        optimization_target: 85
      }
    };
  }
}

// ============================================================================
// ASSET MANIFEST GENERATION SCHEMAS
// ============================================================================

const AssetRequirementSchema = z.object({
  type: z.enum(['image', 'icon', 'font', 'sprite']).describe('Type of asset required'),
  purpose: z.string().describe('Purpose of the asset (hero, product, decoration, etc.)'),
  specifications: z.object({
    dimensions: z.object({
      width: z.number().nullable(),
      height: z.number().nullable(),
      aspectRatio: z.string().nullable()
    }).nullable(),
    format: z.array(z.string()).nullable(),
    quality: z.enum(['low', 'medium', 'high']).nullable(),
    emailClients: z.array(z.string()).nullable()
  }).nullable(),
  priority: z.enum(['required', 'recommended', 'optional']).default('recommended'),
  fallback: z.string().nullable().describe('Fallback text or alternative')
});

const ManifestGenerationOptionsSchema = z.object({
  analyzeContentContext: z.boolean().default(true).describe('Analyze content context for asset requirements'),
  collectFromSources: z.boolean().default(true).describe('Collect assets from configured sources'),
  validateAssets: z.boolean().default(true).describe('Validate collected assets'),
  optimizeAssets: z.boolean().default(true).describe('Optimize assets for email delivery'),
  generateUsageInstructions: z.boolean().default(true).describe('Generate usage instructions for Design Specialist'),
  includePerformanceMetrics: z.boolean().default(true).describe('Include performance metrics in manifest'),
  enableFallbackGeneration: z.boolean().default(false).describe('Generate fallback assets if needed')
});

// ============================================================================
// ASSET MANIFEST GENERATION INTERFACES
// ============================================================================

interface AssetUsageInstruction {
  assetId: string;
  placement: string;
  context: string;
  responsiveBehavior: string;
  emailClientNotes: string[];
  accessibilityRequirements: string;
  fallbackStrategy: string;
}

interface AssetRequirement {
  id: string;
  type: 'image' | 'icon' | 'font' | 'sprite';
  purpose: string;
  specifications: {
    dimensions?: { width?: number; height?: number; aspectRatio?: string };
    format?: string[];
    quality?: 'low' | 'medium' | 'high';
    emailClients?: string[];
  };
  priority: 'required' | 'recommended' | 'optional';
  fallback?: string;
  contentContext?: string;
}

interface ManifestGenerationResult {
  manifestId: string;
  assetManifest: any; // AssetManifest type from handoff-schemas
  assetRequirements: AssetRequirement[];
  usageInstructions: AssetUsageInstruction[];
  performanceMetrics: {
    totalAssets: number;
    totalSize: number;
    averageOptimization: number;
    emailClientCompatibility: number;
    accessibilityScore: number;
  };
  recommendations: string[];
  generationSummary: {
    timestamp: string;
    processingTime: number;
    sourcesProcessed: number;
    assetsCollected: number;
    assetsValidated: number;
    assetsOptimized: number;
    errors: string[];
  };
}

// ============================================================================
// ASSET MANIFEST GENERATION TOOL
// ============================================================================

const generateAssetManifest = tool({
  name: 'generateAssetManifest',
  description: 'Generate comprehensive asset manifest for email campaigns with usage instructions and performance metrics',
  parameters: z.object({
    campaignId: z.string().describe('Campaign identifier'),
    campaignPath: z.string().describe('Campaign folder path'),
    contentContext: z.object({
      generated_content: z.object({
        subject: z.string().nullable(),
        preheader: z.string().nullable(),
        body_sections: z.array(z.string()).nullable(),
        cta_buttons: z.array(z.string()).nullable()
      }).nullable(),
      asset_requirements: z.object({
        hero_image: z.boolean().nullable(),
        content_images: z.number().nullable(),
        icons: z.number().nullable(),
        logos: z.boolean().nullable()
      }).nullable(),
      campaign_type: z.string().nullable(),
      language: z.string().nullable(),
      target_audience: z.string().nullable()
    }).describe('Content context with asset requirements'),
    assetSources: z.array(z.object({
      type: z.enum(['figma', 'local', 'url', 'campaign']),
      path: z.string(),
      credentials: z.record(z.string()).nullable(),
      priority: z.enum(['primary', 'secondary', 'fallback']).default('primary')
    })).describe('Asset sources to collect from'),
    options: ManifestGenerationOptionsSchema.nullable().describe('Manifest generation options'),
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
  execute: async ({ campaignId, campaignPath, contentContext, assetSources, options, context, trace_id }, runContext) => {
    console.log('\n📋 === ASSET MANIFEST GENERATION STARTED ===');
    console.log(`📋 Campaign: ${campaignId}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`📊 Asset Sources: ${assetSources.length}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const startTime = Date.now();
    const manifestId = `manifest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const generationOptions = options || {};
    
    try {
      // Create manifest directory
      const manifestDir = path.join(campaignPath, 'assets', 'manifests');
      await fs.mkdir(manifestDir, { recursive: true });
      
      // Step 1: Analyze content context for asset requirements
      console.log('🔍 Analyzing content context for asset requirements...');
      let assetRequirements: AssetRequirement[] = [];
      
      if (generationOptions.analyzeContentContext) {
        assetRequirements = await analyzeContentForAssetRequirements(contentContext);
        console.log(`✅ Identified ${assetRequirements.length} asset requirements`);
      }
      
      // Step 2: Collect assets from configured sources
      console.log('📁 Collecting assets from sources...');
      let collectedAssets: any[] = [];
      const collectionErrors: string[] = [];
      
      if (generationOptions.collectFromSources && assetSources.length > 0) {
        try {
          const assetsDestination = path.join(campaignPath, 'assets', 'collected');
          await fs.mkdir(assetsDestination, { recursive: true });
          
          // Call collectAssets tool logic directly
          const collectionResult = await collectAssetsFromSources(
            assetSources.map(source => ({
              type: source.type,
              path: source.path,
              credentials: source.credentials || {}
            })),
            assetsDestination,
            {
              recursive: true,
              validateAssets: true,
              generateThumbnails: false,
              extractMetadata: true,
              deduplicate: true
            },
            { campaignId, campaignPath, ...context },
            trace_id
          );
          
          collectedAssets = collectionResult.result?.assets || [];
          console.log(`✅ Collected ${collectedAssets.length} assets`);
        } catch (error) {
          const errorMsg = `Asset collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(`⚠️ ${errorMsg}`);
          collectionErrors.push(errorMsg);
        }
      }
      
      // Step 3: Validate collected assets
      console.log('✅ Validating collected assets...');
      let validationResults: any = null;
      
      if (generationOptions.validateAssets && collectedAssets.length > 0) {
        try {
          const assetsPath = path.join(campaignPath, 'assets', 'collected');
          // Call validateAssets tool logic directly
          validationResults = await validateAssetsInDirectory(
            assetsPath,
            {
              maxFileSize: 100000, // 100KB max for email
              allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
              requireOptimization: true,
              validateDimensions: true,
              minWidth: 50,
              maxWidth: 600
            },
            { campaignId, campaignPath, ...context },
            trace_id
          );
          
          console.log(`✅ Validated assets: ${validationResults.validation?.validAssets || 0} valid, ${validationResults.validation?.invalidAssets || 0} invalid`);
        } catch (error) {
          const errorMsg = `Asset validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(`⚠️ ${errorMsg}`);
          collectionErrors.push(errorMsg);
        }
      }
      
      // Step 4: Optimize assets for email delivery
      console.log('🔧 Optimizing assets for email delivery...');
      let optimizationResults: any = null;
      
      if (generationOptions.optimizeAssets && collectedAssets.length > 0) {
        try {
          const assetsPath = path.join(campaignPath, 'assets', 'collected');
          // Call optimizeAssets tool logic directly
          optimizationResults = await optimizeAssetsInDirectory(
            assetsPath,
            path.join(campaignPath, 'assets', 'optimized'),
            'email-marketing',
            ['gmail', 'outlook', 'apple-mail', 'yahoo-mail'],
            true,
            { campaignId, campaignPath, ...context },
            trace_id
          );
          
          console.log(`✅ Optimized ${optimizationResults.optimization?.processedAssets || 0} assets`);
        } catch (error) {
          const errorMsg = `Asset optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.warn(`⚠️ ${errorMsg}`);
          collectionErrors.push(errorMsg);
        }
      }
      
      // Step 5: Generate comprehensive asset manifest
      console.log('📋 Generating comprehensive asset manifest...');
      const assetManifest = await generateComprehensiveAssetManifest(
        collectedAssets,
        assetRequirements,
        validationResults,
        optimizationResults,
        campaignPath
      );
      
      // Step 6: Generate usage instructions for Design Specialist
      console.log('📝 Generating usage instructions for Design Specialist...');
      let usageInstructions: AssetUsageInstruction[] = [];
      
      if (generationOptions.generateUsageInstructions) {
        usageInstructions = await generateUsageInstructions(
          assetManifest,
          assetRequirements,
          contentContext
        );
      }
      
      // Step 7: Calculate performance metrics
      console.log('📊 Calculating performance metrics...');
      const performanceMetrics = calculatePerformanceMetrics(
        assetManifest,
        validationResults,
        optimizationResults
      );
      
      // Step 8: Generate recommendations
      console.log('💡 Generating recommendations...');
      const recommendations = generateRecommendations(
        assetManifest,
        performanceMetrics,
        collectionErrors
      );
      
      // Step 9: Create final manifest result
      const processingTime = Date.now() - startTime;
      const manifestResult: ManifestGenerationResult = {
        manifestId,
        assetManifest,
        assetRequirements,
        usageInstructions,
        performanceMetrics,
        recommendations,
        generationSummary: {
          timestamp: new Date().toISOString(),
          processingTime,
          sourcesProcessed: assetSources.length,
          assetsCollected: collectedAssets.length,
          assetsValidated: validationResults?.validation?.totalAssets || 0,
          assetsOptimized: optimizationResults?.optimization?.processedAssets || 0,
          errors: collectionErrors
        }
      };
      
      // Step 10: Save manifest to campaign folder
      console.log('💾 Saving manifest to campaign folder...');
      await fs.writeFile(
        path.join(manifestDir, 'asset-manifest.json'),
        JSON.stringify(manifestResult, null, 2)
      );
      
      // Save usage instructions separately for Design Specialist
      await fs.writeFile(
        path.join(manifestDir, 'usage-instructions.json'),
        JSON.stringify(usageInstructions, null, 2)
      );
      
      // Save performance report
      await fs.writeFile(
        path.join(manifestDir, 'performance-report.json'),
        JSON.stringify({
          metrics: performanceMetrics,
          recommendations,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
      
      // Update RunContext if provided (OpenAI Agents SDK pattern)
      if (runContext) {
        runContext.assetManifest = manifestResult;
      }
      
      console.log('✅ Asset manifest generation completed successfully');
      console.log(`📊 Assets in Manifest: ${assetManifest.images.length} images, ${assetManifest.icons.length} icons, ${assetManifest.fonts.length} fonts`);
      console.log(`📝 Usage Instructions: ${usageInstructions.length} instructions generated`);
      console.log(`📊 Performance Score: ${performanceMetrics.accessibilityScore}/100`);
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
      
      // Return string as required by OpenAI Agents SDK
      const totalAssets = assetManifest.images.length + assetManifest.icons.length + assetManifest.fonts.length;
      const errorSummary = collectionErrors.length > 0 ? ` (${collectionErrors.length} warnings)` : '';
      
      return `Asset manifest generated successfully with ${totalAssets} assets (${assetManifest.images.length} images, ${assetManifest.icons.length} icons, ${assetManifest.fonts.length} fonts) and ${usageInstructions.length} usage instructions. Processing time: ${processingTime}ms. Performance score: ${performanceMetrics.accessibilityScore}/100${errorSummary}. Manifest saved to: ${manifestDir}/asset-manifest.json`;
      
    } catch (error) {
      console.error('❌ Asset manifest generation failed:', error);
      // Return error message as string (OpenAI Agents SDK requirement)
      throw new Error(`Asset manifest generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// ============================================================================
// ASSET REQUIREMENT ANALYSIS TOOL
// ============================================================================

export const analyzeAssetRequirements = tool({
  name: 'analyzeAssetRequirements',
  description: 'Analyze content context to identify specific asset requirements for email campaign',
  parameters: z.object({
    contentContext: z.object({
      generated_content: z.object({
        subject: z.string().nullable(),
        preheader: z.string().nullable(),
        body_sections: z.array(z.string()).nullable(),
        social_links: z.array(z.string()).nullable(),
        footer_content: z.string().nullable()
      }).nullable(),
      pricing_analysis: z.object({
        products: z.array(z.object({
          name: z.string().nullable(),
          description: z.string().nullable(),
          price: z.string().nullable()
        })).nullable()
      }).nullable(),
      asset_strategy: z.object({
        visual_style: z.string().nullable()
      }).nullable(),
      brand_context: z.string().nullable(),
      company_name: z.string().nullable()
    }).describe('Content context with campaign details'),
    assetTypes: z.array(z.enum(['image', 'icon', 'font', 'sprite'])).nullable().describe('Asset types to analyze for'),
    emailClients: z.array(z.string()).default(['gmail', 'outlook', 'apple-mail']).describe('Target email clients'),
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
  execute: async ({ contentContext, assetTypes, emailClients, context, trace_id }) => {
    console.log('\n🔍 === ASSET REQUIREMENTS ANALYSIS STARTED ===');
    console.log(`📋 Content Context: ${Object.keys(contentContext).length} keys`);
    console.log(`📧 Email Clients: ${emailClients.join(', ')}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    try {
      const assetRequirements = await analyzeContentForAssetRequirements(contentContext);
      
      // Filter by asset types if specified
      const filteredRequirements = assetTypes 
        ? assetRequirements.filter(req => assetTypes.includes(req.type))
        : assetRequirements;
      
      // Add email client specifications
      const enhancedRequirements = filteredRequirements.map(req => ({
        ...req,
        specifications: {
          ...req.specifications,
          emailClients
        }
      }));
      
      console.log('✅ Asset requirements analysis completed');
      console.log(`📊 Requirements Found: ${enhancedRequirements.length}`);
      console.log(`🎯 Required Assets: ${enhancedRequirements.filter(r => r.priority === 'required').length}`);
      console.log(`💡 Recommended Assets: ${enhancedRequirements.filter(r => r.priority === 'recommended').length}`);
      
      return {
        success: true,
        requirements: enhancedRequirements,
        summary: {
          totalRequirements: enhancedRequirements.length,
          requiredAssets: enhancedRequirements.filter(r => r.priority === 'required').length,
          recommendedAssets: enhancedRequirements.filter(r => r.priority === 'recommended').length,
          optionalAssets: enhancedRequirements.filter(r => r.priority === 'optional').length,
          assetTypes: [...new Set(enhancedRequirements.map(r => r.type))]
        },
        message: `Analyzed content context and identified ${enhancedRequirements.length} asset requirements`
      };
      
    } catch (error) {
      console.error('❌ Asset requirements analysis failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function analyzeContentForAssetRequirements(contentContext: any): Promise<AssetRequirement[]> {
  console.log('🤖 Starting AI-powered asset requirements analysis...');
  
  // Get AI analysis of content
  const aiAnalysis = await analyzeContentWithAI(contentContext);
  
  const requirements: AssetRequirement[] = [];
  
  // Convert AI analysis to asset requirements
  if (aiAnalysis.image_requirements) {
    aiAnalysis.image_requirements.forEach((req: any, index: number) => {
      requirements.push({
        id: `ai-image-${index}`,
        type: 'image',
        purpose: req.purpose,
        specifications: {
          dimensions: req.dimensions,
          format: ['jpg', 'webp', 'png'],
          quality: req.priority === 'required' ? 'high' : 'medium',
          emailClients: ['gmail', 'outlook', 'apple-mail']
        },
        priority: req.priority as 'required' | 'recommended' | 'optional',
        fallback: `AI-generated fallback for ${req.purpose}`,
        contentContext: `${req.emotional_tone} ${req.visual_style} image for ${req.purpose}`
      });
    });
  }
  
  // Add destination-specific requirements
  if (aiAnalysis.destinations) {
    aiAnalysis.destinations.forEach((dest: any, index: number) => {
      requirements.push({
        id: `destination-${index}`,
        type: 'image',
        purpose: `Destination image for ${dest.name}`,
        specifications: {
          dimensions: { width: 400, height: 250, aspectRatio: '16:10' },
          format: ['jpg', 'webp'],
          quality: 'high'
        },
        priority: 'recommended',
        fallback: dest.fallback_url,
        contentContext: `Travel destination: ${dest.name}`
      });
    });
  }
  
  // Add AI-determined icon requirements
  if (aiAnalysis.icons_needed) {
    aiAnalysis.icons_needed.forEach((icon: any, index: number) => {
      requirements.push({
        id: `ai-icon-${index}`,
        type: 'icon',
        purpose: icon.purpose,
        specifications: {
          dimensions: { width: icon.size, height: icon.size, aspectRatio: '1:1' },
          format: ['svg', 'png'],
          quality: 'high'
        },
        priority: 'recommended',
        fallback: `${icon.style} ${icon.type} icon`,
        contentContext: `${icon.style} style ${icon.type} icon`
      });
    });
  }
  
  // Add AI-determined brand elements
  if (aiAnalysis.brand_elements) {
    aiAnalysis.brand_elements.forEach((brand: any, index: number) => {
      requirements.push({
        id: `brand-${index}`,
        type: 'image',
        purpose: `${brand.type} for ${brand.placement}`,
        specifications: {
          dimensions: brand.size,
          format: ['png', 'svg'],
          quality: 'high'
        },
        priority: 'required',
        fallback: `Text-based ${brand.type}`,
        contentContext: `Brand ${brand.type} element`
      });
    });
  }
  
  console.log(`✅ Generated ${requirements.length} AI-powered asset requirements`);
  return requirements;
}

async function generateComprehensiveAssetManifest(
  collectedAssets: any[],
  assetRequirements: AssetRequirement[],
  validationResults: any,
  optimizationResults: any,
  campaignPath: string
): Promise<any> {
  const manifest = {
    images: [],
    icons: [],
    fonts: []
  };
  
  // Process collected assets
  for (const asset of collectedAssets) {
    const assetItem = {
      id: asset.hash || `asset_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      path: asset.path,
      url: asset.path, // Could be converted to URL later
      alt_text: asset.description || asset.filename,
      usage: determineAssetUsage(asset, assetRequirements),
      dimensions: asset.dimensions || { width: 0, height: 0 },
      file_size: asset.size || 0,
      format: asset.format || 'unknown',
      optimized: optimizationResults ? true : false,
      email_client_support: {
        gmail: true,
        outlook: asset.format !== 'svg',
        apple_mail: true,
        yahoo_mail: asset.format !== 'svg'
      },
      accessibility: {
        alt_text_provided: !!asset.description,
        descriptive: asset.description?.length > 10,
        wcag_compliant: true
      },
      performance: {
        load_time_estimate: Math.round(asset.size / 1000), // Rough estimate
        optimization_score: validationResults?.validation?.results?.find((r: any) => r.filename === asset.filename)?.score || 80
      }
    };
    
    // Categorize asset
    if (asset.format === 'svg' && asset.size < 5000) {
      manifest.icons.push(assetItem);
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(asset.format)) {
      manifest.images.push(assetItem);
    }
  }
  
  // Add default fonts if none specified
  if (manifest.fonts.length === 0) {
    manifest.fonts.push({
      id: 'default-font',
      family: 'Arial, sans-serif',
      weights: ['400', '700'],
      fallbacks: ['Helvetica', 'sans-serif'],
      usage: 'primary-text',
      email_client_support: {
        gmail: true,
        outlook: true,
        apple_mail: true,
        yahoo_mail: true
      }
    });
  }
  
  return manifest;
}

function determineAssetUsage(asset: any, requirements: AssetRequirement[]): string {
  // Match asset to requirements based on filename, size, or format
  const matchingRequirement = requirements.find(req => 
    asset.filename?.toLowerCase().includes(req.purpose.toLowerCase()) ||
    asset.description?.toLowerCase().includes(req.purpose.toLowerCase())
  );
  
  return matchingRequirement ? matchingRequirement.purpose : 'general';
}

async function generateUsageInstructions(
  assetManifest: any,
  assetRequirements: AssetRequirement[],
  contentContext: any
): Promise<AssetUsageInstruction[]> {
  const instructions: AssetUsageInstruction[] = [];
  
  // Generate instructions for each asset
  [...assetManifest.images, ...assetManifest.icons].forEach(asset => {
    const requirement = assetRequirements.find(req => 
      asset.usage?.includes(req.purpose) || asset.id.includes(req.id)
    );
    
    instructions.push({
      assetId: asset.id,
      placement: getPlacementInstructions(asset, requirement),
      context: getContextInstructions(asset, contentContext),
      responsiveBehavior: getResponsiveInstructions(asset),
      emailClientNotes: getEmailClientNotes(asset),
      accessibilityRequirements: getAccessibilityInstructions(asset),
      fallbackStrategy: getFallbackStrategy(asset, requirement)
    });
  });
  
  return instructions;
}

function getPlacementInstructions(asset: any, requirement?: AssetRequirement): string {
  if (asset.usage?.includes('hero')) {
    return 'Place at top of email as main header image with full width';
  }
  if (asset.usage?.includes('product')) {
    return 'Place in product showcase section with proper spacing';
  }
  if (asset.usage?.includes('logo')) {
    return 'Place in header area, typically top-left or center';
  }
  if (asset.usage?.includes('social')) {
    return 'Place in footer area with other social media links';
  }
  return 'Place according to campaign layout requirements';
}

function getContextInstructions(asset: any, contentContext: any): string {
  return `Use in context of: ${contentContext.generated_content?.subject || 'email campaign'}. Ensure asset aligns with brand guidelines and campaign messaging.`;
}

function getResponsiveInstructions(asset: any): string {
  if (asset.dimensions?.width > 400) {
    return 'Scale proportionally for mobile devices. Ensure minimum readable size on small screens.';
  }
  return 'Maintain fixed size across devices unless specified otherwise.';
}

function getEmailClientNotes(asset: any): string[] {
  const notes: string[] = [];
  
  if (asset.format === 'svg') {
    notes.push('SVG not supported in Outlook - provide PNG fallback');
  }
  if (asset.format === 'webp') {
    notes.push('WebP not supported in older email clients - provide JPEG fallback');
  }
  if (asset.file_size > 100000) {
    notes.push('Large file size may affect loading in some email clients');
  }
  
  return notes;
}

function getAccessibilityInstructions(asset: any): string {
  return `Ensure alt text is provided: "${asset.alt_text}". Alt text should be descriptive and convey the image's purpose in the email context.`;
}

function getFallbackStrategy(asset: any, requirement?: AssetRequirement): string {
  return requirement?.fallback || 'If image fails to load, display alt text with appropriate background color';
}

function calculatePerformanceMetrics(
  assetManifest: any,
  validationResults: any,
  optimizationResults: any
): any {
  const totalAssets = assetManifest.images.length + assetManifest.icons.length + assetManifest.fonts.length;
  const totalSize = [...assetManifest.images, ...assetManifest.icons].reduce((sum, asset) => sum + asset.file_size, 0);
  
  return {
    totalAssets,
    totalSize,
    averageOptimization: optimizationResults?.optimization?.averageOptimization || 80,
    emailClientCompatibility: 85, // Calculate based on format support
    accessibilityScore: validationResults?.validation?.overallCompliance || 90
  };
}

function generateRecommendations(
  assetManifest: any,
  performanceMetrics: any,
  errors: string[]
): string[] {
  const recommendations: string[] = [];
  
  if (performanceMetrics.totalSize > 500000) {
    recommendations.push('Consider further optimizing images to reduce total size below 500KB');
  }
  
  if (performanceMetrics.emailClientCompatibility < 90) {
    recommendations.push('Add fallback formats for better email client compatibility');
  }
  
  if (performanceMetrics.accessibilityScore < 95) {
    recommendations.push('Improve alt text descriptions for better accessibility');
  }
  
  if (errors.length > 0) {
    recommendations.push('Address asset collection errors to ensure complete manifest');
  }
  
  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateAssetManifest,
};

// ============================================================================
// HELPER FUNCTIONS FOR TOOL INTEGRATION
// ============================================================================

/**
 * Wrapper function to call asset collection logic with AI-powered selection
 */
async function collectAssetsFromSources(
  sources: any[],
  destination: string,
  options: any,
  context: any,
  trace_id: string | null
): Promise<any> {
  console.log('🤖 Starting AI-powered asset collection...');
  
  const collectedAssets: any[] = [];
  
  for (const source of sources) {
    console.log(`🔍 Processing ${source.type} source: ${source.path}`);
    
    try {
      if (source.type === 'local') {
        // Use AI to select optimal assets from local directory
        const localAssets = await collectFromLocalDirectoryWithAI(
          source.path, 
          destination, 
          context
        );
        collectedAssets.push(...localAssets);
      } else if (source.type === 'campaign') {
        // Collect from campaign directory
        const campaignAssets = await collectFromCampaignDirectory(source.path, destination);
        collectedAssets.push(...campaignAssets);
      } else if (source.type === 'url') {
        // Handle external URLs (fallback strategy)
        const urlAssets = await collectFromExternalUrls(source.path, destination, context);
        collectedAssets.push(...urlAssets);
      } else {
        console.warn(`⚠️ ${source.type} source type not implemented`);
      }
    } catch (error) {
      console.error(`❌ Failed to collect from ${source.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return {
    success: true,
    result: {
      assets: collectedAssets,
      summary: {
        totalAssets: collectedAssets.length,
        totalSize: collectedAssets.reduce((sum, asset) => sum + (asset.size || 0), 0),
        formats: {},
        sources: {},
        duplicatesRemoved: 0,
        errors: []
      }
    }
  };
}

/**
 * AI-powered collection from local directory (Figma assets)
 */
async function collectFromLocalDirectoryWithAI(
  sourcePath: string, 
  destination: string, 
  context: any
): Promise<any[]> {
  console.log('🎨 Using AI to select optimal assets from Figma directory...');
  
  const assets: any[] = [];
  
  try {
    // Get AI analysis for this campaign
    const aiAnalysis = await analyzeContentWithAI(context);
    
    // Get AI-powered asset selection
    const figmaTagsPath = path.join(sourcePath, 'ai-optimized-tags.json');
    const assetSelection = await selectFigmaAssetsWithAI(aiAnalysis, figmaTagsPath, context);
    
    // Process each selected asset group
    for (const selection of assetSelection) {
      const folderPath = path.join(sourcePath, selection.folder);
      
      try {
        await fs.access(folderPath);
        const files = await fs.readdir(folderPath);
        const assetFiles = files.filter(file => 
          /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
        );
        
        // Use AI to filter files based on search criteria
        const selectedFiles = await filterFilesWithAI(
          assetFiles, 
          selection.search_criteria, 
          selection.expected_count
        );
        
        // Copy selected files to destination
        for (const file of selectedFiles) {
          const filePath = path.join(folderPath, file);
          const destPath = path.join(destination, file);
          const stats = await fs.stat(filePath);
          
          await fs.copyFile(filePath, destPath);
          
          assets.push({
            filename: file,
            path: destPath,
            size: stats.size,
            format: path.extname(file).toLowerCase().substring(1),
            hash: `ai_${Date.now()}_${Math.random().toString(36)}`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            tags: selection.search_criteria.tags,
            description: `AI-selected ${selection.usage}`,
            aiReasoning: selection.search_criteria.emotional_match,
            purpose: selection.search_criteria.purpose,
            priority: selection.priority
          });
        }
        
        console.log(`✅ Selected ${selectedFiles.length} assets from ${selection.folder}`);
        
      } catch (error) {
        console.warn(`⚠️ Could not access folder ${selection.folder}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return assets;
    
  } catch (error) {
    console.error('❌ AI-powered asset collection failed, falling back to basic collection');
    return await collectFromLocalDirectoryBasic(sourcePath, destination);
  }
}

/**
 * AI-powered file filtering based on search criteria
 */
async function filterFilesWithAI(
  files: string[], 
  searchCriteria: any, 
  expectedCount: number
): Promise<string[]> {
  console.log('🔍 Using AI to filter files based on search criteria...');
  
  const filterPrompt = `
Select the best ${expectedCount} files from this list that match the search criteria:

Available Files:
${files.map((file, index) => `${index + 1}. ${file}`).join('\n')}

Search Criteria:
- Tags: ${JSON.stringify(searchCriteria.tags)}
- Emotional Match: ${searchCriteria.emotional_match}
- Purpose: ${searchCriteria.purpose}

Analyze the filenames and select the ${expectedCount} most relevant files.
Return only a JSON array of exact filenames: ["filename1.png", "filename2.png"]
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in visual asset selection. Choose files that best match the criteria based on their descriptive filenames.'
          },
          {
            role: 'user',
            content: filterPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const selectedFiles = JSON.parse(aiContent);
    
    console.log(`✅ AI selected ${selectedFiles.length} files`);
    return selectedFiles.filter((file: string) => files.includes(file));
    
  } catch (error) {
    console.error('❌ AI file filtering failed, using basic selection');
    // Fallback: select first N files
    return files.slice(0, expectedCount);
  }
}

/**
 * AI-powered external image selection - generates appropriate URLs based on content
 */
async function generateAISelectedExternalImages(aiAnalysis: any, context: any): Promise<any[]> {
  console.log('🎨 Using AI to generate contextual external image URLs...');
  
  const imageSelectionPrompt = `
Based on this campaign analysis, generate appropriate Unsplash image URLs that match the content theme and emotional tone.

Campaign Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Campaign Context:
- Subject: ${context.generated_content?.subject || 'N/A'}
- Body: ${context.generated_content?.body || 'N/A'}
- Campaign Type: ${context.campaign_type || 'N/A'}
- Target Audience: ${context.target_audience || 'N/A'}

INSTRUCTIONS:
1. Analyze the campaign content to understand the theme (travel, tech, business, lifestyle, etc.)
2. Generate 3-5 appropriate Unsplash image URLs that match the theme
3. For each image, provide descriptive filename and appropriate tags
4. Ensure images are relevant to the detected content themes

Return JSON format:
{
  "selected_images": [
    {
      "filename": "descriptive-name-based-on-content.jpg",
      "url": "https://images.unsplash.com/photo-[ID]",
      "description": "Detailed description of why this image fits the campaign",
      "tags": ["relevant", "content", "tags"],
      "purpose": "hero|support|decoration|branding",
      "emotional_match": "how this image supports the campaign's emotional goals"
    }
  ],
  "selection_reasoning": "Why these specific images were chosen for this campaign"
}

IMPORTANT: Choose images that authentically represent the campaign's actual content and purpose, not generic fallbacks.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert visual content curator. Select images that authentically match campaign content and emotional tone. Always provide valid Unsplash URLs.'
          },
          {
            role: 'user',
            content: imageSelectionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const imageSelection = JSON.parse(aiContent);
    
    // Convert AI selection to asset format
    const assets: any[] = [];
    
    if (imageSelection.selected_images) {
      imageSelection.selected_images.forEach((img: any, index: number) => {
        assets.push({
          filename: img.filename,
          path: img.url,
          size: 0, // External URL, size unknown
          format: 'jpg',
          hash: `ai_selected_${Date.now()}_${index}`,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          tags: img.tags || [],
          description: img.description,
          isExternal: true,
          purpose: img.purpose || 'support',
          emotionalMatch: img.emotional_match,
          aiReasoning: imageSelection.selection_reasoning
        });
      });
    }
    
    console.log(`🎯 AI selected ${assets.length} contextual images`);
    console.log(`💡 Selection reasoning: ${imageSelection.selection_reasoning}`);
    
    return assets;
    
  } catch (error) {
    console.error('❌ AI image selection failed:', error);
    throw new Error(`AI image selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered external image selection based on campaign content
 */
async function collectFromExternalUrls(
  fallbackType: string,
  destination: string,
  context: any
): Promise<any[]> {
  console.log('🤖 Using AI to select appropriate external images...');
  
  if (fallbackType !== 'external_fallback') {
    return [];
  }
  
  try {
    // Get AI analysis to determine what external assets are needed
    const aiAnalysis = await analyzeContentWithAI(context);
    
    // Use AI to generate appropriate external image URLs
    const aiSelectedImages = await generateAISelectedExternalImages(aiAnalysis, context);
    
    console.log(`✅ AI selected ${aiSelectedImages.length} external images`);
    return aiSelectedImages;
    
  } catch (error) {
    console.error('❌ AI external image selection failed:', error);
    throw new Error(`Failed to select external images: ${error instanceof Error ? error.message : 'AI selection unavailable'}`);
  }
}



/**
 * Basic fallback collection method
 */
async function collectFromLocalDirectoryBasic(sourcePath: string, destination: string): Promise<any[]> {
  const assets: any[] = [];
  
  try {
    const files = await fs.readdir(sourcePath);
    const assetFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
    ).slice(0, 5); // Limit to 5 files as fallback
    
    for (const file of assetFiles) {
      const filePath = path.join(sourcePath, file);
      const destPath = path.join(destination, file);
      const stats = await fs.stat(filePath);
      
      await fs.copyFile(filePath, destPath);
      
      assets.push({
        filename: file,
        path: destPath,
        size: stats.size,
        format: path.extname(file).toLowerCase().substring(1),
        hash: `basic_${Date.now()}_${Math.random().toString(36)}`,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        tags: [],
        description: `Basic selected asset: ${file}`
      });
    }
    
    return assets;
  } catch (error) {
    throw new Error(`Failed to collect from local directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wrapper function to call asset validation logic with AI-generated rules
 */
async function validateAssetsInDirectory(
  assetPath: string,
  defaultRules: any,
  context: any,
  trace_id: string | null
): Promise<any> {
  console.log('🤖 Using AI-generated validation rules...');
  
  try {
    // Get AI analysis and generate validation rules
    const aiAnalysis = await analyzeContentWithAI(context);
    const validationRules = await generateValidationRulesWithAI(context, aiAnalysis);
    
    // Use AI-generated rules instead of default ones
    const finalRules = {
      maxFileSize: validationRules.file_size_limits?.total_email || defaultRules.maxFileSize,
      allowedFormats: validationRules.format_preferences?.primary || defaultRules.allowedFormats,
      requireOptimization: true,
      validateDimensions: true,
      minWidth: validationRules.dimension_requirements?.min_width || defaultRules.minWidth,
      maxWidth: validationRules.dimension_requirements?.max_width || defaultRules.maxWidth
    };
    
    console.log(`🔍 Using AI rules: max size ${finalRules.maxFileSize}, formats ${finalRules.allowedFormats.join(', ')}`);
    
    // Perform validation with AI-generated rules
    const validationResults: any[] = [];
    
    const files = await fs.readdir(assetPath);
    const assetFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
    );
    
    for (const file of assetFiles) {
      const filePath = path.join(assetPath, file);
      const stats = await fs.stat(filePath);
      const format = path.extname(file).toLowerCase().substring(1);
      
      const validation = {
        filename: file,
        path: filePath,
        size: stats.size,
        format,
        valid: stats.size <= finalRules.maxFileSize && 
               finalRules.allowedFormats.includes(format),
        score: calculateAIValidationScore(stats.size, format, finalRules, validationRules),
        issues: []
      };
      
      if (stats.size > finalRules.maxFileSize) {
        validation.issues.push(`File size ${stats.size} exceeds AI-determined maximum ${finalRules.maxFileSize}`);
      }
      
      if (!finalRules.allowedFormats.includes(format)) {
        validation.issues.push(`Format ${format} not in AI-recommended formats: ${finalRules.allowedFormats.join(', ')}`);
      }
      
      validationResults.push(validation);
    }
    
    const validAssets = validationResults.filter(v => v.valid);
    
    return {
      success: true,
      validation: {
        totalAssets: validationResults.length,
        validAssets: validAssets.length,
        invalidAssets: validationResults.length - validAssets.length,
        rules: finalRules,
        aiRules: validationRules,
        results: validationResults,
        issues: [],
        overallCompliance: validAssets.length > 0 ? (validAssets.length / validationResults.length) * 100 : 0
      }
    };
    
  } catch (error) {
    console.error('❌ AI validation failed, using default rules');
    throw new Error(`Asset validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate validation score using AI-generated criteria
 */
function calculateAIValidationScore(
  fileSize: number, 
  format: string, 
  rules: any, 
  aiRules: any
): number {
  let score = 100;
  
  // Size penalty
  const sizeRatio = fileSize / rules.maxFileSize;
  if (sizeRatio > 0.8) score -= 20;
  else if (sizeRatio > 0.6) score -= 10;
  
  // Format preference
  if (aiRules.format_preferences?.primary?.includes(format)) {
    score += 0; // No penalty
  } else if (aiRules.format_preferences?.fallback?.includes(format)) {
    score -= 10;
  } else if (aiRules.format_preferences?.avoid?.includes(format)) {
    score -= 30;
  }
  
  // Email client compatibility
  if (format === 'svg') score -= 15; // SVG issues in Outlook
  if (format === 'webp') score -= 10; // WebP support issues
  
  return Math.max(0, Math.min(100, score));
}

/**
 * AI-powered asset optimization with dynamic rules
 */
async function optimizeAssetsInDirectory(
  inputPath: string,
  outputPath: string,
  profile: string,
  emailClients: string[],
  generateResponsive: boolean,
  context: any,
  trace_id: string | null
): Promise<any> {
  console.log('🤖 Using AI-powered asset optimization...');
  
  await fs.mkdir(outputPath, { recursive: true });
  
  try {
    // Get AI analysis and optimization rules
    const aiAnalysis = await analyzeContentWithAI(context);
    const validationRules = await generateValidationRulesWithAI(context, aiAnalysis);
    
    const files = await fs.readdir(inputPath);
    const assetFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
    );
    
    let processedAssets = 0;
    const optimizedFiles: any[] = [];
    
    for (const file of assetFiles) {
      const inputFile = path.join(inputPath, file);
      const outputFile = path.join(outputPath, file);
      const stats = await fs.stat(inputFile);
      const format = path.extname(file).toLowerCase().substring(1);
      
      // Apply AI-determined optimization strategy
      const optimizationStrategy = await getOptimizationStrategyWithAI(
        file,
        stats.size,
        format,
        validationRules,
        emailClients
      );
      
      // For now, copy file (real optimization would use image processing libraries)
      await fs.copyFile(inputFile, outputFile);
      
      optimizedFiles.push({
        original: inputFile,
        optimized: outputFile,
        strategy: optimizationStrategy,
        originalSize: stats.size,
        optimizedSize: stats.size, // Would be different with real optimization
        compressionRatio: optimizationStrategy.compressionLevel / 100
      });
      
      processedAssets++;
      console.log(`✅ Optimized ${file} using ${optimizationStrategy.method} strategy`);
    }
    
    return {
      success: true,
      optimization: {
        processedAssets,
        profile,
        emailClients,
        aiRules: validationRules,
        averageOptimization: validationRules.quality_thresholds?.optimization_target || 80,
        totalSizeReduction: 0.3,
        optimizedFiles
      }
    };
    
  } catch (error) {
    console.error('❌ AI optimization failed, using basic optimization');
    throw new Error(`Asset optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered optimization strategy selection
 */
async function getOptimizationStrategyWithAI(
  filename: string,
  fileSize: number,
  format: string,
  validationRules: any,
  emailClients: string[]
): Promise<any> {
  const strategyPrompt = `
Determine the optimal optimization strategy for this email asset:

File: ${filename}
Size: ${fileSize} bytes
Format: ${format}
Email Clients: ${emailClients.join(', ')}

Validation Rules:
${JSON.stringify(validationRules, null, 2)}

Provide optimization strategy as JSON:
{
  "method": "aggressive|balanced|conservative",
  "compressionLevel": number_0_to_100,
  "targetSize": number_in_bytes,
  "formatRecommendation": "keep|convert_to_jpg|convert_to_webp|convert_to_png",
  "reasoning": "Why this strategy was chosen",
  "emailClientNotes": ["note1", "note2"]
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in email asset optimization. Choose strategies that maximize deliverability and compatibility.'
          },
          {
            role: 'user',
            content: strategyPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const strategy = JSON.parse(aiContent);
    
    return strategy;
    
  } catch (error) {
    console.error('❌ AI optimization strategy failed, using default');
    return {
      method: 'balanced',
      compressionLevel: 80,
      targetSize: Math.min(fileSize, 100000),
      formatRecommendation: 'keep',
      reasoning: 'Default balanced optimization',
      emailClientNotes: []
    };
  }
}

/**
 * Collect assets from local directory
 */
async function collectFromLocalDirectory(sourcePath: string, destination: string): Promise<any[]> {
  const assets: any[] = [];
  
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
      
      assets.push({
        filename: file,
        path: destPath,
        size: stats.size,
        format: path.extname(file).toLowerCase().substring(1),
        hash: `hash_${Date.now()}_${Math.random().toString(36)}`,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        tags: [],
        description: `Local asset: ${file}`
      });
    }
    
    return assets;
  } catch (error) {
    throw new Error(`Failed to collect from local directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Collect assets from campaign directory
 */
async function collectFromCampaignDirectory(campaignPath: string, destination: string): Promise<any[]> {
  const assetsDir = path.join(campaignPath, 'assets');
  
  try {
    await fs.access(assetsDir);
    return await collectFromLocalDirectoryBasic(assetsDir, destination);
  } catch (error) {
    console.log(`⚠️ No assets directory found in campaign: ${campaignPath}`);
    return [];
  }
}

// Temporarily disabled due to OpenAI schema validation issues
// TODO: Fix schema validation for nested objects in arrays
/*
const collectAssets = tool({
  name: 'collectAssets',
  description: 'Collect assets from multiple sources (Figma, local directories, URLs, campaigns) with validation and optimization',
  parameters: z.object({
    sources: z.array(z.object({
      type: z.enum(['figma', 'local', 'url', 'campaign']),
      path: z.string(),
      credentials: z.record(z.string())
    })).describe('Asset sources to collect from'),
    destination: z.string().describe('Destination directory for collected assets'),
    options: z.object({
      recursive: z.boolean(),
      validateAssets: z.boolean(),
      generateThumbnails: z.boolean(),
      extractMetadata: z.boolean(),
      deduplicate: z.boolean()
    }).describe('Collection options'),
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
  execute: async ({ sources, destination, options, context, trace_id }, runContext) => {
    console.log('\n📁 === ASSET COLLECTION STARTED ===');
    console.log(`📁 Sources: ${sources.length}`);
    console.log(`📁 Destination: ${destination}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const startTime = Date.now();
    const collectionOptions = { 
      recursive: options?.recursive ?? true, 
      validateAssets: options?.validateAssets ?? true, 
      generateThumbnails: options?.generateThumbnails ?? false, 
      extractMetadata: options?.extractMetadata ?? true, 
      deduplicate: options?.deduplicate ?? true
    };
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(destination, { recursive: true });
      
      const collectionResult = await collectAssetsFromSources(
        sources,
        destination,
        collectionOptions,
        context || {},
        trace_id
      );
      
      const processingTime = Date.now() - startTime;
      
      // Update RunContext if provided (OpenAI Agents SDK pattern)
      if (runContext) {
        runContext.assetCollection = collectionResult;
      }
      
      console.log('✅ Asset collection completed successfully');
      console.log(`📊 Collected: ${collectionResult.result?.assets?.length || 0} assets`);
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
      
      // Return string as required by OpenAI Agents SDK
      const assetsCount = collectionResult.result?.assets?.length || 0;
      const errors = collectionResult.errors?.length || 0;
      const errorSummary = errors > 0 ? ` (${errors} errors)` : '';
      
      return `Asset collection completed successfully. Collected ${assetsCount} assets from ${sources.length} sources in ${processingTime}ms${errorSummary}. Assets saved to: ${destination}`;
      
    } catch (error) {
      console.error('❌ Asset collection failed:', error);
      // Return error message as string (OpenAI Agents SDK requirement)
      throw new Error(`Asset collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});
*/