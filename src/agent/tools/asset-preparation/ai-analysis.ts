/**
 * AI Analysis for Asset Preparation
 */

// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { tool } from '@openai/agents';
// import { z } from 'zod';
import { cleanAIJsonResponse } from './ai-utils';
import { ENV_CONFIG, validateEnvironment } from '../../../config/env';

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
export async function analyzeContentWithAI(contentContext: any, _campaignContext?: any): Promise<any> {
  console.log('🤖 Using AI to analyze content for asset requirements...');
  
  // ✅ FAIL FAST: Validate environment before making request
  validateEnvironment();
  
  // ✅ DEBUG: Log actual contentContext structure
  console.log('🔍 DEBUG: ContentContext structure:', JSON.stringify(contentContext, null, 2));
  
  const analysisPrompt = `
CAMPAIGN UNIQUENESS ID: ${Date.now()}_${Math.random().toString(36).substring(2, 8)}
ANALYSIS TIMESTAMP: ${new Date().toISOString()}

Analyze this email campaign content and determine the optimal asset requirements. Be completely dynamic - extract ANY destinations, seasons, and emotional triggers from the content:

Campaign Content:
- Subject: ${contentContext.generated_content?.subject_line?.primary || contentContext.generated_content?.subject || 'N/A'}
- Preheader: ${contentContext.generated_content?.preheader || 'N/A'}
- Body Text: ${contentContext.generated_content?.body?.main_content || contentContext.generated_content?.body?.opening || contentContext.generated_content?.body || 'N/A'}
- Benefits: ${Array.isArray(contentContext.generated_content?.body?.benefits) ? contentContext.generated_content.body.benefits.join(', ') : 'N/A'}
- CTA: ${JSON.stringify(contentContext.generated_content?.call_to_action || contentContext.generated_content?.cta || {})}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || 'N/A'}
- Language: ${contentContext.language || 'N/A'}

Travel Context:
- Destination: ${contentContext.generated_content?.destination || contentContext.generated_content?.dates?.destination || contentContext.generated_content?.context?.destination || 'N/A'}
- Season: ${contentContext.generated_content?.dates?.season || 'N/A'}
- Seasonal Factors: ${contentContext.generated_content?.dates?.seasonal_factors || 'N/A'}

Pricing Context:
- Best Price: ${contentContext.generated_content?.pricing?.best_price || 'N/A'} ${contentContext.generated_content?.pricing?.currency || ''}
- Route: ${contentContext.generated_content?.pricing?.route || 'N/A'}

FULL CONTEXT DEBUG:
${JSON.stringify(contentContext.generated_content, null, 2)}

🎯 CREATIVE ANALYSIS REQUIREMENTS:
1. Extract SPECIFIC destinations mentioned from the actual content (e.g., "Guatemala", "Maya temples", "Antigua")
2. Detect SPECIFIC season/weather references from the actual content
3. Identify SPECIFIC emotional triggers and activities from the actual content
4. Generate DESTINATION-SPECIFIC search keywords focusing on UNIQUE aspects
5. Think creatively about visual storytelling for THIS specific campaign
6. Consider UNIQUE angles that would make this campaign visually distinct

🔍 VISUAL DIFFERENTIATION STRATEGY:
- Focus on SPECIFIC time periods, lighting conditions, or seasonal elements
- Identify UNIQUE cultural elements, festivals, or local traditions
- Consider SPECIFIC architectural styles, landscapes, or activities
- Think about EMOTIONAL visual narratives unique to this campaign
- Avoid generic travel photography - aim for authentic, specific moments

EXAMPLE ANALYSIS DEPTH:
Instead of "Guatemala travel" → "Guatemala: Focus on ancient Maya civilization (Tikal), colonial architecture (Antigua cobblestones), volcanic landscapes (Fuego volcano), indigenous markets (Chichicastenango textiles), authentic cultural experiences during autumn season"

Be highly specific - use actual destination names, landmarks, and cultural elements mentioned in the content.

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
      "content_context": "specific description based on detected themes",
      "uniqueness_approach": "what makes this visual requirement unique for this campaign"
    }
  ],
  "destinations": [
    {
      "name": "actual destination name from content",
      "search_keywords": ["highly", "specific", "cultural", "elements"],
      "visual_focus": "unique aspect to emphasize for this destination",
      "seasonal_context": "specific seasonal elements to highlight"
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
  "creative_direction": {
    "visual_narrative": "unique story this campaign should tell visually",
    "emotional_journey": "specific emotional progression through images",
    "differentiation_strategy": "how this campaign's visuals differ from typical travel campaigns"
  },
  "figma_search_strategy": {
    "primary_folders": ["folders", "based", "on", "content"],
    "search_tags": ["tags", "from", "content", "analysis"],
    "emotional_keywords": ["emotions", "from", "content"],
    "avoid_tags": ["opposite", "themes", "to", "avoid"]
  }
}`;

  try {
    // Call OpenAI API for dynamic analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email campaign content analyst specializing in dynamic asset requirements. Generate unique, creative analysis for each campaign. Avoid generic responses - focus on specific details that make each campaign unique.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.8, // Higher temperature for creative diversity
        max_tokens: 3000 // More tokens for detailed analysis
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
 * AI-powered Figma asset selection using tags instead of file names
 */
export async function selectFigmaAssetsWithAI(
  aiAnalysis: any,
  figmaTags: any,
  _contentContext: any
): Promise<any[]> {
  console.log('🎯 Using AI to select relevant tags from Figma metadata...');
  
  const selectionPrompt = `
Analyze this email campaign and select the most relevant tags and folders from the available Figma assets.

Campaign Content Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Available Figma Tags and Folders:
${JSON.stringify(figmaTags.folders, null, 2)}

Most Common Tags: ${Object.keys(figmaTags.most_common_tags || {}).slice(0, 20).join(', ')}

Search Recommendations:
${JSON.stringify(figmaTags.search_recommendations, null, 2)}

INSTRUCTIONS:
1. Analyze the campaign theme, destination, season, and emotional tone
2. Select 5-8 most relevant tags from the available tags
3. Choose 2-3 priority folders that best match the campaign
4. Consider tag frequency and relevance

Return JSON format:
{
  "selected_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "priority_folders": ["folder1", "folder2"],
  "max_files": 5,
  "reasoning": "Why these tags and folders were selected",
  "emotional_match": "Target emotional response"
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at matching campaign content with visual assets using tag analysis. Select the most relevant tags and folders for optimal asset selection.'
          },
          {
            role: 'user',
            content: selectionPrompt
          }
        ],
        temperature: ENV_CONFIG.AI_TEMPERATURE,
        max_tokens: ENV_CONFIG.AI_MAX_TOKENS
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const tagSelection = JSON.parse(aiContent);
    
    // Validate selected folders exist
    const availableFolders = Object.keys(figmaTags.folders || {});
    const validFolders = (tagSelection.priority_folders || []).filter((folder: string) => {
      if (!availableFolders.includes(folder)) {
        console.warn(`⚠️ Folder "${folder}" not found, skipping`);
        return false;
      }
      return true;
    });
    
    if (validFolders.length === 0) {
      throw new Error(`❌ No valid folders selected from: ${availableFolders.join(', ')}`);
    }
    
    console.log(`✅ AI selected tags: ${tagSelection.selected_tags?.join(', ')}`);
    console.log(`✅ AI selected folders: ${validFolders.join(', ')}`);
    
    return [{
      tags: tagSelection.selected_tags || [],
      folders: validFolders,
      max_files: tagSelection.max_files || 5,
      reasoning: tagSelection.reasoning,
      emotional_match: tagSelection.emotional_match
    }];
    
  } catch (error) {
    console.error('❌ AI tag selection failed:', error);
    throw new Error(`❌ AI-powered tag selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find files by tags using Figma metadata (replaces filterFilesWithAI)
 */
export function findFilesByTags(
  selectedTags: string[],
  priorityFolders: string[],
  figmaTags: any,
  maxFiles: number = 5
): string[] {
  console.log(`🔍 Finding files by tags: ${selectedTags.join(', ')}`);
  console.log(`📁 Priority folders: ${priorityFolders.join(', ')}`);
  
  const foundFiles: { filename: string; score: number; folder: string }[] = [];
  
  // Search in each priority folder
  for (const folderName of priorityFolders) {
    const folderData = figmaTags.folders[folderName];
    if (!folderData) continue;
    
    const folderTags = folderData.tags || [];
    
    // Calculate relevance score for each tag match
    const tagMatches = selectedTags.filter(tag => folderTags.includes(tag));
    const score = tagMatches.length;
    
    if (score > 0) {
      // For simplicity, we'll assume 3-5 representative files per folder
      // In real implementation, you'd need file-to-tag mapping
      const representativeFiles = [
        `${folderName}-asset-1.png`,
        `${folderName}-asset-2.png`,
        `${folderName}-asset-3.png`
      ].slice(0, Math.min(parseInt(process.env.AI_MAX_FILES || '3'), maxFiles));
      
      representativeFiles.forEach(filename => {
        foundFiles.push({
          filename,
          score,
          folder: folderName
        });
      });
    }
  }
  
  // Sort by score and return top files
  foundFiles.sort((a, b) => b.score - a.score);
  const selectedFiles = foundFiles.slice(0, maxFiles).map(f => f.filename);
  
  console.log(`✅ Found ${selectedFiles.length} files by tags: ${selectedFiles.join(', ')}`);
  
  return selectedFiles;
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
CAMPAIGN UNIQUENESS ID: ${Date.now()}_${Math.random().toString(36).substring(2, 8)}

Based on this campaign analysis, determine what types of images would be most appropriate.

Campaign Analysis:
${JSON.stringify(aiAnalysis, null, 2)}

Campaign Context:
- Subject: ${contentContext.generated_content?.subject_line?.primary || contentContext.generated_content?.subject || 'N/A'}
- Body: ${contentContext.generated_content?.body?.main_content || contentContext.generated_content?.body?.opening || contentContext.generated_content?.body || 'N/A'}
- Campaign Type: ${contentContext.campaign_type || 'N/A'}
- Target Audience: ${contentContext.target_audience || 'N/A'}

FULL CONTENT DEBUG:
${JSON.stringify(contentContext.generated_content, null, 2)}

🎯 UNIQUENESS REQUIREMENTS:
- Generate COMPLETELY DIFFERENT search terms than any previous campaign
- Focus on SPECIFIC landmarks, architecture, activities unique to the destination
- Avoid common tourist photos - find unique angles and cultural elements
- Consider time of day, weather, seasonal activities specific to this campaign
- Think like a travel photographer looking for unique, authentic moments

🔍 CREATIVE DIRECTIONS:
- Look for SPECIFIC cultural festivals, local food, traditional clothing
- Focus on UNIQUE architecture, hidden gems, local life scenes  
- Consider SPECIFIC activities mentioned in the campaign content
- Think about UNIQUE seasonal elements (winter activities, autumn colors, etc.)
- Use SPECIFIC location names, districts, neighborhoods when possible

Analyze the content and suggest 4-6 HIGHLY SPECIFIC search terms for finding unique images.

CRITICAL: Be extremely specific to avoid duplicate results across campaigns!

EXAMPLES OF SPECIFICITY:
- Generic BAD: "iceland winter", "northern lights"
- Specific GOOD: "iceland jokulsarlon ice caves winter", "iceland reykjavik northern lights february", "iceland geysir strokkur winter steam", "iceland blue lagoon aurora reflection"

For Guatemala: "guatemala antigua cobblestone streets", "tikal pyramid jungle mist", "guatemala lake atitlan maya textiles", "chichicastenango market guatemala"
For Thailand: "thailand chiang mai lantern festival", "thai long tail boat phi phi", "thailand bangkok floating market dawn", "thai elephant blessing ceremony"

Return JSON format:
{
  "search_terms": [
    {
      "query": "extremely specific english search term with location + activity + context",
      "purpose": "hero|support|decoration|branding",
      "description": "Detailed description of why this specific scene fits the campaign"
    }
  ],
  "campaign_theme": "Detailed, specific destination and cultural theme",
  "emotional_tone": "Specific emotional response targeted by this campaign",
  "uniqueness_factor": "What makes this campaign's visual approach different from others"
}`;

  // ✅ FAIL FAST: Check API key before making request
  if (!ENV_CONFIG.OPENAI_API_KEY) {
    throw new Error('❌ OPENAI_API_KEY environment variable is required for AI image generation. Please configure your OpenAI API key.');
  }

  try {
    // Step 1: Get AI analysis for search terms
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing campaign content and determining appropriate visual themes. Provide search terms in English for international image databases. BE CREATIVE AND UNIQUE - avoid generic terms and create specific, diverse search queries.'
          },
          {
            role: 'user',
            content: imageAnalysisPrompt
          }
        ],
        temperature: 0.8, // Higher temperature for more creative diversity
        max_tokens: 2000 // More tokens for detailed analysis
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`🤖 DEBUG: Raw AI response: ${JSON.stringify(data, null, 2)}`);
    
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    console.log(`🤖 DEBUG: Cleaned AI content: ${aiContent}`);
    
    const searchAnalysis = JSON.parse(aiContent);
    console.log(`🤖 DEBUG: Parsed search analysis: ${JSON.stringify(searchAnalysis, null, 2)}`);
    
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
export function generateFallbackExternalImages(_contentContext: any): any[] {
  console.log('❌ Fallback external images are not allowed - failing fast');
  throw new Error('Fallback external images are not allowed. AI must generate real images or the operation fails.');
} 

/**
 * Final AI-powered file selection from filtered results
 */
export async function finalFileSelectionWithAI(
  foundFiles: { filename: string; folder: string; score: number; matchedTags: string[]; size?: number }[],
  _campaignContext: any,
  contentContext: any,
  maxSelection: number = 2
): Promise<{ filename: string; folder: string; reasoning: string }[]> {
  console.log(`🎯 Making final selection from ${foundFiles.length} files (max ${maxSelection})...`);
  
  if (foundFiles.length <= maxSelection) {
    console.log(`✅ Returning all ${foundFiles.length} files (under limit)`);
    return foundFiles.map(f => ({
      filename: f.filename,
      folder: f.folder,
      reasoning: `Auto-selected: only ${foundFiles.length} files found`
    }));
  }
  
  const selectionPrompt = `
Выберите ${maxSelection} лучших файла для email-кампании из найденных по тегам файлов.

КОНТЕКСТ КАМПАНИИ:
- Тема: ${contentContext.generated_content?.subject || 'N/A'}
- Описание: ${contentContext.generated_content?.body?.substring(0, 200) || 'N/A'}...
- Тип кампании: ${contentContext.campaign_type || 'N/A'}
- Целевая аудитория: ${contentContext.target_audience || 'N/A'}

ДОСТУПНЫЕ ФАЙЛЫ:
${foundFiles.map((file, index) => `
${index + 1}. "${file.filename}"
   - Папка: ${file.folder}
   - Совпавшие теги: ${file.matchedTags.join(', ')}
   - Скор релевантности: ${file.score}
   - Размер: ${file.size ? Math.round(file.size / 1024) + 'KB' : 'unknown'}
`).join('')}

КРИТЕРИИ ВЫБОРА:
1. Максимальная релевантность к теме кампании
2. Высокий скор совпадения тегов
3. Разнообразие (предпочтительно из разных папок)
4. Оптимальный размер для email (меньше - лучше)
5. Качество названия файла (описательность)

ИНСТРУКЦИИ:
- Выберите ТОЧНО ${maxSelection} файла
- Обязательно объясните выбор каждого файла
- Используйте точные имена файлов из списка
- Приоритет: релевантность > разнообразие > размер

Формат ответа JSON:
{
  "selected_files": [
    {
      "filename": "точное имя файла из списка",
      "folder": "название папки", 
      "reasoning": "подробное объяснение почему выбран этот файл"
    }
  ],
  "overall_strategy": "общая стратегия выбора для данной кампании"
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Вы эксперт по подбору визуального контента для email-маркетинга. Выбирайте файлы на основе максимальной релевантности к кампании и качества контента.'
          },
          {
            role: 'user',
            content: selectionPrompt
          }
        ],
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.2'),
        max_tokens: ENV_CONFIG.AI_MAX_TOKENS
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    const selection = JSON.parse(aiContent);
    
    const selectedFiles = selection.selected_files || [];
    
    // Валидация: проверяем что все выбранные файлы существуют в исходном списке
    const validSelections = selectedFiles.filter((selected: any) => {
      const found = foundFiles.find(f => f.filename === selected.filename);
      if (!found) {
        console.error(`❌ AI selected non-existent file: ${selected.filename}`);
        return false;
      }
      return true;
    });
    
    if (validSelections.length === 0) {
      throw new Error(`❌ AI selected no valid files from ${foundFiles.length} available files`);
    }
    
    console.log(`✅ AI selected ${validSelections.length} files for campaign:`);
    validSelections.forEach((file: any) => {
      console.log(`   📁 ${file.filename} → ${file.reasoning}`);
    });
    console.log(`🎯 Overall strategy: ${selection.overall_strategy}`);
    
    return validSelections;
    
  } catch (error) {
    console.error('❌ Final AI file selection failed:', error);
    console.error(`❌ FALLBACK POLICY VIOLATION: Cannot use fallback file selection`);
    console.error(`❌ Available files: ${foundFiles.length}, Max selection: ${maxSelection}`);
    
    // ✅ FAIL FAST: No fallback file selection allowed per project rules
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`AI file selection failed: ${errorMessage}. Fallback selection is prohibited.`);
  }
}

/**
 * ✅ AI-GENERATED EXTERNAL IMAGES: No preset values, all generated by AI
 */
export async function generateExternalImageLinks(
  contentContext: any,
  campaignContext?: any
): Promise<any[]> {
  console.log('🤖 Generating AI-selected external images - NO PRESET VALUES');
  
  // ✅ FAIL FAST: Check required API keys before starting
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    throw new Error('❌ CONFIGURATION ERROR: UNSPLASH_ACCESS_KEY environment variable is required for external image generation. Please configure your Unsplash API key. Without this key, the system cannot generate external images and must fail according to NO FALLBACK policy.');
  }
  
  if (!ENV_CONFIG.OPENAI_API_KEY) {
    throw new Error('❌ CONFIGURATION ERROR: OPENAI_API_KEY environment variable is required for AI analysis. Please configure your OpenAI API key.');
  }
  
  try {
    // Step 1: Use AI to analyze content and determine what images are needed
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext);
    console.log('🔍 AI analysis completed for external image selection');
    
    // Step 2: Use AI to generate real external images
    const aiSelectedImages = await generateAISelectedExternalImages(aiAnalysis, contentContext);
    console.log(`✅ AI generated ${aiSelectedImages.length} external images based on content analysis`);
    
    if (aiSelectedImages.length === 0) {
      throw new Error('AI failed to generate any external images. System must fail - no fallback allowed.');
    }
    
    return aiSelectedImages;
    
  } catch (error) {
    console.error('❌ AI-generated external images failed:', error);
    
    // ✅ ENHANCED ERROR HANDLING: Provide clearer messages for specific errors
    if (error instanceof Error) {
      if (error.message.includes('401 Unauthorized')) {
        throw new Error('❌ API AUTHENTICATION FAILED: Invalid or expired Unsplash API key. Please check your UNSPLASH_ACCESS_KEY environment variable and ensure it is valid.');
      }
      if (error.message.includes('UNSPLASH_ACCESS_KEY')) {
        throw error; // Re-throw configuration errors as-is
      }
    }
    
    throw new Error(`AI external image generation failed: ${error instanceof Error ? error.message : 'AI analysis or image generation unavailable'}. No fallback allowed per project rules.`);
  }
} 