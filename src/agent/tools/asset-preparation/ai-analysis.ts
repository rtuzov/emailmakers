/**
 * AI Analysis for Asset Preparation
 */

// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { tool } from '@openai/agents';
// import { z } from 'zod';
import { cleanAIJsonResponse } from './ai-utils';
import { ENV_CONFIG, validateEnvironment } from '../../../config/env';
import { parseJSONWithRetry } from '../../../shared/utils/ai-retry-mechanism';

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
export async function analyzeContentWithAI(
  contentContext: any, 
  // campaignContext not used in current implementation
  _campaignContext?: any,
  dataInsights?: {
    consolidated_insights?: any;
    destination_analysis?: any;
    emotional_profile?: any;
    market_intelligence?: any;
    travel_intelligence?: any;
    trend_analysis?: any;
  }
): Promise<any> {
  console.log('🤖 Using AI to analyze content for asset requirements...');
  
  // ✅ FAIL FAST: Validate environment before making request
  validateEnvironment();
  
  // ✅ DEBUG: Log actual contentContext structure
  console.log('🔍 DEBUG: ContentContext structure:', JSON.stringify(contentContext, null, 2));
  console.log('🔍 DEBUG: DataInsights available:', dataInsights ? Object.keys(dataInsights) : 'None');
  
  const analysisPrompt = `
CAMPAIGN UNIQUENESS ID: ${Date.now()}_${Math.random().toString(36).substring(2, 8)}
ANALYSIS TIMESTAMP: ${new Date().toISOString()}
CREATIVITY MODE: MAXIMUM DIVERSITY - каждый анализ должен быть уникальным!

Анализируй этот email контент и определи оптимальные требования к ресурсам. КРИТИЧЕСКИ ВАЖНО - будь полностью динамичным и извлекай ЛЮБЫЕ направления, сезоны, эмоциональные триггеры из контента:

КОНТЕКСТ КАМПАНИИ:
- Тема: ${contentContext.generated_content?.subject_line?.primary || contentContext.generated_content?.subject || 'N/A'}
- Прехедер: ${contentContext.generated_content?.preheader || 'N/A'}
- Основной текст: ${contentContext.generated_content?.body?.main_content || contentContext.generated_content?.body?.opening || contentContext.generated_content?.body || 'N/A'}
- Преимущества: ${Array.isArray(contentContext.generated_content?.benefits) ? contentContext.generated_content.benefits.join(', ') : 'N/A'}
- CTA: ${contentContext.generated_content?.cta_buttons?.primary || contentContext.generated_content?.cta || 'N/A'}
- Тип кампании: ${contentContext.campaign_type || 'N/A'}
- Целевая аудитория: ${contentContext.target_audience || 'N/A'}

🧠 УГЛУБЛЕННЫЕ INSIGHTS ИЗ АНАЛИЗА ДАННЫХ:
${dataInsights?.consolidated_insights ? `
✨ КЛЮЧЕВЫЕ INSIGHTS:
${JSON.stringify(dataInsights.consolidated_insights, null, 2)}
` : ''}

${dataInsights?.destination_analysis ? `
🌍 АНАЛИЗ НАПРАВЛЕНИЯ:
${JSON.stringify(dataInsights.destination_analysis, null, 2)}
` : ''}

${dataInsights?.emotional_profile ? `
💭 ЭМОЦИОНАЛЬНЫЙ ПРОФИЛЬ:
${JSON.stringify(dataInsights.emotional_profile, null, 2)}
` : ''}

${dataInsights?.market_intelligence ? `
📊 РЫНОЧНАЯ АНАЛИТИКА:
${JSON.stringify(dataInsights.market_intelligence, null, 2)}
` : ''}

${dataInsights?.travel_intelligence ? `
✈️ TRAVEL INTELLIGENCE:
${JSON.stringify(dataInsights.travel_intelligence, null, 2)}
` : ''}

${dataInsights?.trend_analysis ? `
📈 АНАЛИЗ ТРЕНДОВ:
${JSON.stringify(dataInsights.trend_analysis, null, 2)}
` : ''}

ТВОРЧЕСКИЙ АНАЛИЗ ТРЕБОВАНИЙ С УЧЕТОМ ВСЕХ ДАННЫХ:

1. 🎭 ИЗВЛЕКИ УНИКАЛЬНУЮ ТЕМАТИКУ ИЗ INSIGHTS:
   - Используй данные destination_analysis для специфичных локаций
   - Примени emotional_profile для определения настроения
   - Учти seasonal_patterns и cultural особенности из travel_intelligence
   - Определи уникальные аспекты из market_intelligence

2. 🌍 ДЕТАЛЬНЫЙ АНАЛИЗ НАПРАВЛЕНИЯ ИЗ DATA:
   - География: используй route_analysis и attractions из destination_analysis
   - Климат: применяй climate и seasonal_patterns данные
   - Культура: используй culture insights и local traditions
   - Активности: извлекай из motivations и desires в emotional_profile

3. 🎨 ВИЗУАЛЬНЫЕ ТРЕБОВАНИЯ НА ОСНОВЕ INSIGHTS:
   - Цветовая палитра: адаптируй под seasonal_factors и cultural context
   - Стиль изображений: согласуй с target audience motivations
   - Композиция: учти competitive_landscape и market_trends
   - Настроение фото: отрази emotional triggers и desires

4. 📸 СПЕЦИФИЧНЫЕ ТИПЫ ИЗОБРАЖЕНИЙ ИЗ АНАЛИЗА:
   - Hero: главное изображение отражающее key attractions и emotional desires
   - Gallery: дополнительные изображения под cultural experiences
   - Background: текстуры согласованные с seasonal_patterns
   - Icons: тематические под booking_windows и market_conditions

ИНСТРУКЦИЯ: Используй ВСЕ доступные insights для создания максимально контекстуального и уникального анализа. Каждая кампания должна отличаться благодаря богатству исходных данных.

ВЕРНИ детальный JSON с полным анализом, основанным на insights:
`;

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
        temperature: 0.9, // Maximum creativity for unique analysis
        max_tokens: 3000 // More tokens for detailed analysis
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    
    // Use robust JSON parsing with AI self-correction on failure
    let aiAnalysis;
    try {
      // Try enhanced JSON parsing
      aiAnalysis = parseJSONWithRetry(aiContent, 'AI Analysis');
    } catch (parseError) {
      console.warn('⚠️ AI Analysis JSON parse failed - throwing error for AI self-correction...');
      // ✅ NO FALLBACK: Let error bubble up for AI self-correction
      // The calling function should retry with error feedback to fix JSON issues
      throw new Error(`AI Analysis JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown JSON error'}. AI must generate valid JSON format. Original content length: ${aiContent.length}`);
    }
    
    console.log('✅ AI analysis completed');
    console.log(`📊 Found ${aiAnalysis.image_requirements?.length || 0} image requirements`);
    console.log(`🌍 Detected ${aiAnalysis.destinations?.length || 0} destinations`);
    
    return aiAnalysis;
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    console.log('🚫 No hardcoded fallback - AI analysis must succeed with self-correction');
    
    // ✅ NO FALLBACK: Let caller handle retry with AI self-correction
    // The calling functions should use aiSelfCorrectionRetry for automatic error correction
    throw new Error(`AI analysis failed completely: ${error instanceof Error ? error.message : 'Unknown error'}. No fallback allowed per project rules - AI retry mechanism should handle self-correction.`);
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
- Генерируй ПОЛНОСТЬЮ РАЗНЫЕ поисковые запросы от любой предыдущей кампании
- Фокусируйся на СПЕЦИФИЧНЫХ достопримечательностях, архитектуре, активностях уникальных для направления
- Избегай стандартных туристических фото - ищи уникальные ракурсы и культурные элементы
- Учитывай время дня, погоду, сезонные активности специфичные для этой кампании
- Думай как travel фотограф ищущий уникальные, аутентичные моменты

🔍 КРЕАТИВНЫЕ НАПРАВЛЕНИЯ (МАКСИМАЛЬНАЯ СПЕЦИФИЧНОСТЬ):

1. 🏛️ АРХИТЕКТУРА И КУЛЬТУРА:
   - Ищи СПЕЦИФИЧНЫЕ культурные фестивали, местную еду, традиционную одежду
   - Фокусируйся на УНИКАЛЬНОЙ архитектуре, скрытых жемчужинах, сценах местной жизни
   - Используй КОНКРЕТНЫЕ названия мест, районов, кварталов когда возможно

2. 🌅 АТМОСФЕРА И НАСТРОЕНИЕ:
   - Учитывай СПЕЦИФИЧНЫЕ активности упомянутые в контенте кампании
   - Думай о УНИКАЛЬНЫХ сезонных элементах (зимние активности, осенние цвета)
   - Фокусируйся на эмоциональном воздействии и аутентичности

3. 🎯 ВРЕМЕННОЙ И КУЛЬТУРНЫЙ КОНТЕКСТ:
   - Добавляй время дня: рассвет, золотой час, ночь, туман утром
   - Включай погодные условия: дождь, снег, туман, солнце
   - Специфичные сезонные моменты: цветение сакуры, осенние листья, зимний иней

4. 🔍 ФОТОГРАФИЧЕСКИЙ ПОДХОД:
   - Конкретные ракурсы: с высоты птичьего полета, уличная фотография, портрет, детали
   - Композиционные техники: отражения, симметрия, контраст, силуэты
   - Световые эффекты: контровое освещение, драматические тени, мягкий свет

АНАЛИЗИРУЙ контент и предложи 5-7 ВЫСОКО СПЕЦИФИЧНЫХ поисковых запросов для уникальных изображений.

КРИТИЧЕСКИ ВАЖНО: Будь экстремально специфичным чтобы избежать дублирования результатов между кампаниями!

ПРИМЕРЫ СПЕЦИФИЧНОСТИ:
❌ Generic BAD: "iceland winter", "northern lights", "mountains snow"
✅ Specific GOOD: "iceland jokulsarlon ice caves winter morning light", "iceland reykjavik northern lights purple sky february", "iceland landmannalaugar rhyolite mountains snow rainbow", "iceland seljalandsfoss waterfall winter icicles sunset"

Для Японии: "japan kyoto bamboo grove morning mist golden light", "japan yoshino cherry blossoms pink petals spring wind", "japan arashiyama togetsu bridge cherry reflection", "japan philosopher path stone lanterns sakura tunnel"

Для Марокко: "morocco sahara desert camel caravan sunset dunes", "morocco marrakech jemaa el-fnaa night lights performers", "morocco ait benhaddou kasbah golden hour mud brick", "morocco chefchaouen blue streets cat doorway morning"

🚨 КРИТИЧЕСКИ ВАЖНО: Возвращай ТОЛЬКО валидный JSON в ТОЧНОМ формате:

{
  "search_terms": [
    {
      "query": "КОНКРЕТНЫЙ_ПОИСКОВЫЙ_ЗАПРОС_НА_АНГЛИЙСКОМ",
      "purpose": "hero|destination|support|decoration|branding",
      "description": "Детальное описание зачем нужно это изображение"
    }
  ],
  "campaign_theme": "Краткое описание темы кампании",
  "emotional_tone": "Эмоциональный тон для подбора изображений",
  "uniqueness_factor": "Что делает эту кампанию уникальной визуально"
}

Каждый query ДОЛЖЕН быть:
- На английском языке
- Длиной минимум 4 слова  
- Конкретным и уникальным
- НЕ содержать undefined, null или пустые строки
- Реально существующим поисковым запросом

ОБЯЗАТЕЛЬНО: Сгенерируй минимум 5 search_terms!
`;

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
            content: 'You are an expert at analyzing campaign content and determining appropriate visual themes. Provide search terms in English for international image databases. BE CREATIVE AND UNIQUE - avoid generic terms and create specific, diverse search queries. CRITICAL: Return ONLY valid JSON in the exact format specified. Each query must be at least 4 words long, specific, and NOT contain undefined, null, or empty strings. Generate minimum 5 search_terms.'
          },
          {
            role: 'user',
            content: imageAnalysisPrompt
          }
        ],
        temperature: 0.9, // Maximum creativity for diverse image searches
        max_tokens: 3000 // More tokens for detailed analysis
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`🤖 DEBUG: Raw AI response: ${JSON.stringify(data, null, 2)}`);
    
    const aiContent = cleanAIJsonResponse(data.choices[0].message.content);
    console.log(`🤖 DEBUG: Cleaned AI content: ${aiContent}`);
    
    let searchAnalysis;
    try {
      searchAnalysis = JSON.parse(aiContent);
      console.log(`🤖 DEBUG: Parsed search analysis: ${JSON.stringify(searchAnalysis, null, 2)}`);
    } catch (parseError) {
      console.error('❌ AI JSON parsing failed!');
      console.error('🔍 Raw AI content:', data.choices[0].message.content);
      console.error('🔍 Cleaned content:', aiContent);
      console.error('📋 Parse error:', parseError);
      throw new Error(`AI returned invalid JSON for image search. AI must return valid JSON format. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`);
    }
    
    // ✅ КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Проверяем базовую структуру ответа AI
    if (!searchAnalysis || typeof searchAnalysis !== 'object') {
      throw new Error('AI response is not a valid object');
    }
    
    if (!searchAnalysis.search_terms || !Array.isArray(searchAnalysis.search_terms)) {
      console.log('❌ AI did not provide search_terms array, response:', searchAnalysis);
      throw new Error('AI response missing search_terms array. AI must provide search terms for image search.');
    }
    
    if (searchAnalysis.search_terms.length === 0) {
      throw new Error('AI provided empty search_terms array. AI must generate at least one search term.');
    }
    
    // ✅ КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Фильтруем пустые и некорректные search terms
    const validSearchTerms = searchAnalysis.search_terms.filter((term: any) => {
      if (!term || typeof term !== 'object') {
        console.log('🚫 Skipping invalid search term (not object):', term);
        return false;
      }
      if (!term.query || typeof term.query !== 'string' || term.query.trim().length === 0) {
        console.log('🚫 Skipping search term with empty/invalid query:', term);
        return false;
      }
      if (term.query.trim() === 'undefined' || term.query.trim() === 'null') {
        console.log('🚫 Skipping search term with undefined/null query:', term);
        return false;
      }
      return true;
    });

    console.log(`🔍 AI suggested search terms: ${validSearchTerms.map((t: any) => t.query).join(', ')}`);
    console.log(`✅ Valid search terms count: ${validSearchTerms.length} (filtered from ${searchAnalysis.search_terms.length})`);
    
    if (validSearchTerms.length === 0) {
      console.log('❌ No valid search terms available for image search');
      throw new Error('No valid search terms generated by AI for image search');
    }
    
    // Step 2: Search real images using Unsplash API
    const assets: any[] = [];
    
    for (let i = 0; i < validSearchTerms.length; i++) {
      const searchTerm = validSearchTerms[i];
      
      try {
        console.log(`🔍 Searching Unsplash for "${searchTerm.query}"...`);
        const unsplashImages = await searchUnsplashImages(searchTerm.query, 1); // Get 1 image per search term
        
        if (unsplashImages.length > 0) {
          const img = unsplashImages[0];
          
          // ✅ БЕЗОПАСНАЯ ОБРАБОТКА: searchTerm.query уже валидирован выше
          const safeQuery = searchTerm.query.trim();
          const safeTags = safeQuery.split(' ').filter((tag: string) => tag.length > 0);
          
          assets.push({
            filename: `${safeQuery.replace(/\s+/g, '-')}-${img.id}.jpg`,
            path: img.urls.regular,
            size: 0, // External URL, size unknown
            format: 'jpg',
            hash: `unsplash_${img.id}_${Date.now()}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            tags: safeTags,
            description: img.alt_description || searchTerm.description || 'Unsplash image',
            isExternal: true,
            purpose: searchTerm.purpose || 'support',
            emotionalMatch: searchAnalysis.emotional_tone || 'neutral',
            aiReasoning: `Real Unsplash image for: ${searchTerm.description || safeQuery}`,
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
    // Note: dataInsights will be null here since campaignContext typically doesn't have campaignPath
    // This is acceptable as this function is called when the campaign folder structure may not be ready yet
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext, undefined);
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