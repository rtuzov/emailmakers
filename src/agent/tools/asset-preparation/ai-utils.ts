/**
 * AI utilities for asset manifest generation
 */

import { ENV_CONFIG } from '../../../config/env';
import { 
  AIRequestConfig, 
  DEFAULT_AI_CONFIG,
  ContentContext,
  CampaignContext 
} from './types';

/**
 * Clean AI response content for JSON parsing
 */
export function cleanAIJsonResponse(content: string): string {
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
 * Make AI request with error handling
 */
export async function makeAIRequest(
  prompt: string,
  config: Partial<AIRequestConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };
  
  if (!ENV_CONFIG.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV_CONFIG.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: finalConfig.model,
      messages: [
        {
          role: 'system',
          content: finalConfig.system_prompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: finalConfig.temperature,
      max_tokens: finalConfig.max_tokens
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Parse AI JSON response with error handling
 */
export function parseAIJsonResponse<T>(content: string): T {
  try {
    const cleaned = cleanAIJsonResponse(content);
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse AI JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build content analysis prompt
 */
export function buildContentAnalysisPrompt(
  contentContext: ContentContext,
  campaignContext?: CampaignContext
): string {
  return `
Analyze this email campaign content and determine the optimal asset requirements. Be completely dynamic - extract ANY destinations, seasons, and emotional triggers from the content:

Campaign Content:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Preheader: ${contentContext.generated_content?.preheader || 'N/A'}
- Body Text: ${contentContext.generated_content?.body || 'N/A'}
- CTA: ${JSON.stringify(contentContext.generated_content?.cta_buttons || [])}
- Campaign Type: ${contentContext.campaign_type || campaignContext?.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || campaignContext?.target_audience || 'N/A'}
- Language: ${contentContext.language || campaignContext?.language || 'N/A'}

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
}

/**
 * Build external image selection prompt
 */
export function buildExternalImagePrompt(
  aiAnalysis: any,
  contentContext: ContentContext
): string {
  return `
Based on this campaign analysis, generate appropriate Unsplash image URLs that match the content theme and emotional tone.

Campaign Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Campaign Context:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Body: ${contentContext.generated_content?.body || 'N/A'}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || 'N/A'}

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
}

/**
 * Build validation rules prompt
 */
export function buildValidationRulesPrompt(
  contentContext: ContentContext,
  aiAnalysis: any
): string {
  return `Generate email asset validation rules for this campaign. Respond with ONLY valid JSON, no explanations or markdown.

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
}

/**
 * Build file filtering prompt
 */
export function buildFileFilteringPrompt(
  files: string[],
  searchCriteria: any,
  expectedCount: number
): string {
  return `
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
}

/**
 * Build Figma asset selection prompt
 */
export function buildFigmaSelectionPrompt(
  aiAnalysis: any,
  figmaTags: any,
  contentContext: ContentContext
): string {
  return `
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
} 