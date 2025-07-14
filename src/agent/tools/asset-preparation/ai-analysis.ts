/**
 * AI Analysis for Asset Preparation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { cleanAIJsonResponse } from './ai-utils';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  correctedHtml?: string;
  correctionsMade: string[];
}

export interface ValidationError {
  type: 'template' | 'technical' | 'asset' | 'structure';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'optimization' | 'accessibility' | 'compatibility';
  message: string;
  suggestion?: string;
}

/**
 * AI-powered content analysis for dynamic asset requirements
 */
export async function analyzeContentWithAI(contentContext: any, campaignContext?: any): Promise<any> {
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
1. Extract ANY destinations mentioned from the actual content
2. Detect ANY season/weather references from the actual content
3. Identify ANY emotional triggers from the actual content
4. Determine visual style based on content tone and destination type
5. Generate appropriate search tags based on detected themes

Be adaptive - analyze the actual content and generate requirements based on what you find, not assumptions.

Format as JSON:
{
  "image_requirements": [
    {
      "type": "hero|destination|promotional|seasonal",
      "purpose": "detailed purpose based on actual content analysis",
      "dimensions": {"width": number, "height": number},
      "priority": "required|recommended|optional",
      "emotional_tone": "based on detected content mood",
      "visual_style": "based on destination and content type",
      "content_context": "specific description based on detected themes"
    }
  ],
  "destinations": [
    {
      "name": "actual destination name from content",
      "search_keywords": ["content-based", "keywords", "from", "analysis"]
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
    "primary_folders": ["folders", "based", "on", "content"],
    "search_tags": ["tags", "from", "content", "analysis"],
    "emotional_keywords": ["emotions", "from", "content"],
    "avoid_tags": ["opposite", "themes", "to", "avoid"]
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
            content: 'You are an expert email marketing designer. Analyze content and provide optimal asset requirements in valid JSON format based solely on the provided content.'
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
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered Figma asset selection
 */
export async function selectFigmaAssetsWithAI(
  aiAnalysis: any,
  figmaTags: any,
  contentContext: any
): Promise<any[]> {
  console.log('🎨 Using AI to select Figma assets...');
  
  const selectionPrompt = `
Based on the content analysis and available Figma assets, select the most appropriate assets for this email campaign.

Content Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Available Figma Assets:
${JSON.stringify(figmaTags, null, 2)}

Content Context:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Body: ${contentContext.generated_content?.body || 'N/A'}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}

INSTRUCTIONS:
1. Match the content requirements with available Figma assets
2. Select assets that best represent the campaign theme
3. Prioritize assets that match the emotional tone
4. Ensure variety in asset types (hero, supporting, icons)

Return JSON format:
{
  "selections": [
    {
      "folder": "figma_folder_name",
      "usage": "hero|support|icon|decoration",
      "priority": "high|medium|low",
      "expected_count": 3,
      "search_criteria": {
        "tags": ["relevant", "tags"],
        "purpose": "specific purpose",
        "emotional_match": "why this matches campaign emotion"
      }
    }
  ]
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
            content: 'You are an expert asset curator. Select the most appropriate Figma assets for email campaigns based on content analysis.'
          },
          {
            role: 'user',
            content: selectionPrompt
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
    const selection = JSON.parse(aiContent);
    
    console.log(`✅ AI selected ${selection.selections?.length || 0} asset groups`);
    
    return selection.selections || [];
    
  } catch (error) {
    console.error('❌ AI Figma asset selection failed:', error);
    // Return basic fallback selection
    return [
      {
        folder: 'зайцы-общие',
        usage: 'hero',
        priority: 'high',
        expected_count: 2,
        search_criteria: {
          tags: ['путешествия', 'отдых'],
          purpose: 'hero image',
          emotional_match: 'travel and vacation theme'
        }
      }
    ];
  }
}

/**
 * AI-powered file filtering
 */
export async function filterFilesWithAI(
  files: string[],
  searchCriteria: any,
  expectedCount: number
): Promise<string[]> {
  console.log(`🔍 Using AI to filter ${files.length} files...`);
  
  // If we have fewer files than expected, return all
  if (files.length <= expectedCount) {
    return files;
  }
  
  const filterPrompt = `
Filter these files to select the most appropriate ones for an email campaign.

Available Files:
${files.map(file => `- ${file}`).join('\n')}

Selection Criteria:
${JSON.stringify(searchCriteria, null, 2)}

Expected Count: ${expectedCount}

INSTRUCTIONS:
1. Select files that best match the search criteria
2. Prioritize files that match the emotional tone
3. Ensure variety in the selected files
4. Return exactly ${expectedCount} files

Return JSON format:
{
  "selected_files": ["filename1.jpg", "filename2.png", "filename3.svg"],
  "reasoning": "Why these files were selected"
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
            content: 'You are an expert file curator. Select the most appropriate files based on given criteria.'
          },
          {
            role: 'user',
            content: filterPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const selection = JSON.parse(aiContent);
    
    const selectedFiles = selection.selected_files || [];
    console.log(`✅ AI filtered to ${selectedFiles.length} files: ${selectedFiles.join(', ')}`);
    
    return selectedFiles;
    
  } catch (error) {
    console.error('❌ AI file filtering failed:', error);
    // Return first N files as fallback
    return files.slice(0, expectedCount);
  }
}

/**
 * Generate external images using real Unsplash API
 */
export async function generateAISelectedExternalImages(
  aiAnalysis: any,
  contentContext: any
): Promise<any[]> {
  console.log('🎨 Using real Unsplash API to get contextual external images...');
  
  // First, use AI to determine what types of images we need
  const imageAnalysisPrompt = `
Based on this campaign analysis, determine what types of images would be most appropriate.

Campaign Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Campaign Context:
- Subject: ${contentContext.generated_content?.subject || 'N/A'}
- Body: ${contentContext.generated_content?.body || 'N/A'}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || 'N/A'}

Analyze the content and suggest 3-5 search terms for finding appropriate images.

Return JSON format:
{
  "search_terms": [
    {
      "query": "english search term for Unsplash",
      "purpose": "hero|support|decoration|branding",
      "description": "What this image should represent"
    }
  ],
  "campaign_theme": "Overall theme description",
  "emotional_tone": "Target emotional response"
}
`;

  try {
    // Step 1: Get AI analysis for search terms
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
            content: 'You are an expert at analyzing campaign content and determining appropriate visual themes. Provide search terms in English for international image databases.'
          },
          {
            role: 'user',
            content: imageAnalysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const searchAnalysis = JSON.parse(aiContent);
    
    console.log(`🔍 AI suggested search terms: ${searchAnalysis.search_terms.map((t: any) => t.query).join(', ')}`);
    
    // Step 2: Search real images using Unsplash API
    const assets: any[] = [];
    
    for (let i = 0; i < searchAnalysis.search_terms.length; i++) {
      const searchTerm = searchAnalysis.search_terms[i];
      
      try {
        const unsplashImages = await searchUnsplashImages(searchTerm.query, 1); // Get 1 image per search term
        
        if (unsplashImages.length > 0) {
          const img = unsplashImages[0];
          
          assets.push({
            filename: `${searchTerm.query.replace(/\s+/g, '-')}-${img.id}.jpg`,
            path: img.urls.regular,
            size: 0, // External URL, size unknown
            format: 'jpg',
            hash: `unsplash_${img.id}_${Date.now()}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: searchTerm.query.split(' '),
            description: img.alt_description || searchTerm.description,
            isExternal: true,
            purpose: searchTerm.purpose || 'support',
            emotionalMatch: searchAnalysis.emotional_tone,
            aiReasoning: `Real Unsplash image for: ${searchTerm.description}`,
            unsplash_metadata: {
              id: img.id,
              author: img.user.name,
              download_url: img.links.download_location
            }
          });
          
          console.log(`✅ Added real Unsplash image: ${img.id} (${searchTerm.query})`);
        } else {
          console.log(`⚠️ No Unsplash images found for: ${searchTerm.query}`);
        }
      } catch (searchError) {
        console.error(`❌ Failed to search Unsplash for "${searchTerm.query}":`, searchError);
      }
    }
    
    if (assets.length === 0) {
      throw new Error('No real images could be found from Unsplash API');
    }
    
    console.log(`🎯 Successfully collected ${assets.length} real Unsplash images`);
    return assets;
    
  } catch (error) {
    console.error('❌ Real image collection failed:', error);
    throw new Error(`Real image collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search Unsplash API for real images
 * NO FALLBACK ALLOWED - System must fail if API key not configured
 */
async function searchUnsplashImages(query: string, count: number = 5): Promise<any[]> {
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!unsplashAccessKey) {
    throw new Error('UNSPLASH_ACCESS_KEY not configured. Please set up your Unsplash API key in environment variables. See UNSPLASH_SETUP.md for instructions.');
  }
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`🔍 Unsplash API returned ${data.results.length} results for "${query}"`);
    
    if (data.results.length === 0) {
      throw new Error(`No images found for query: "${query}"`);
    }
    
    return data.results;
    
  } catch (error) {
    console.error(`❌ Unsplash API search failed for "${query}":`, error);
    throw error; // Re-throw the error instead of falling back to demo images
  }
}

/**
 * ❌ REMOVED - Demo images are not allowed per project FALLBACK POLICY
 * System must fail if Unsplash API is not available
 */

/**
 * Generate fallback external images when AI doesn't provide them
 * ❌ REMOVED - NO FALLBACK ALLOWED PER PROJECT RULES
 */
export function generateFallbackExternalImages(contentContext: any): any[] {
  console.log('❌ Fallback external images are not allowed - failing fast');
  throw new Error('Fallback external images are not allowed. AI must generate real images or the operation fails.');
} 