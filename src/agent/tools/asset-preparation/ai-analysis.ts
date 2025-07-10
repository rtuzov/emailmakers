/**
 * AI-powered content analysis and asset selection
 */

import { 
  AIAnalysisResult,
  ContentContext,
  CampaignContext,
  ExternalImageSelection,
  ValidationRules,
  AssetItem
} from './types';
import {
  makeAIRequest,
  parseAIJsonResponse,
  buildContentAnalysisPrompt,
  buildExternalImagePrompt,
  buildValidationRulesPrompt,
  buildFileFilteringPrompt,
  buildFigmaSelectionPrompt
} from './ai-utils';

/**
 * AI-powered content analysis for dynamic asset requirements
 */
export async function analyzeContentWithAI(
  contentContext: ContentContext,
  campaignContext?: CampaignContext
): Promise<AIAnalysisResult> {
  console.log('🤖 Using AI to analyze content for asset requirements...');
  
  const prompt = buildContentAnalysisPrompt(contentContext, campaignContext);
  
  try {
    const aiContent = await makeAIRequest(prompt, {
      system_prompt: 'You are an expert email marketing designer. Analyze content and provide optimal asset requirements in valid JSON format.',
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const aiAnalysis = parseAIJsonResponse<AIAnalysisResult>(aiContent);
    
    console.log('✅ AI analysis completed');
    console.log(`📊 Found ${aiAnalysis.image_requirements?.length || 0} image requirements`);
    console.log(`🌍 Detected ${aiAnalysis.destinations?.length || 0} destinations`);
    
    return aiAnalysis;
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    throw new Error(`AI content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate external images using AI selection
 */
export async function generateAISelectedExternalImages(
  aiAnalysis: AIAnalysisResult,
  contentContext: ContentContext
): Promise<AssetItem[]> {
  console.log('🎨 Using AI to generate contextual external image URLs...');
  
  const prompt = buildExternalImagePrompt(aiAnalysis, contentContext);
  
  try {
    const aiContent = await makeAIRequest(prompt, {
      system_prompt: 'You are an expert visual content curator. Select images that authentically match campaign content and emotional tone. Always provide valid Unsplash URLs.',
      temperature: 0.3,
      max_tokens: 1500
    });
    
    const imageSelection = parseAIJsonResponse<ExternalImageSelection>(aiContent);
    
    // Convert AI selection to asset format
    const assets: AssetItem[] = [];
    
    if (imageSelection.selected_images) {
      imageSelection.selected_images.forEach((img, index) => {
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
 * AI-powered Figma asset selection
 */
export async function selectFigmaAssetsWithAI(
  aiAnalysis: AIAnalysisResult,
  figmaTags: any,
  contentContext: ContentContext
): Promise<any[]> {
  console.log('🎨 Using AI to select optimal Figma assets...');
  
  const prompt = buildFigmaSelectionPrompt(aiAnalysis, figmaTags, contentContext);
  
  try {
    const aiContent = await makeAIRequest(prompt, {
      system_prompt: 'You are an expert in visual asset selection for email marketing. Choose assets that match campaign tone and objectives.',
      temperature: 0.2,
      max_tokens: 1500
    });
    
    const assetSelection = parseAIJsonResponse<{ selected_assets: any[]; selection_reasoning: string }>(aiContent);
    
    console.log('✅ AI asset selection completed');
    console.log(`🎯 Selected ${assetSelection.selected_assets?.length || 0} asset groups`);
    console.log(`💡 Reasoning: ${assetSelection.selection_reasoning}`);
    
    return assetSelection.selected_assets || [];
    
  } catch (error) {
    console.error('❌ AI asset selection failed:', error);
    throw new Error(`AI Figma asset selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered file filtering based on search criteria
 */
export async function filterFilesWithAI(
  files: string[],
  searchCriteria: any,
  expectedCount: number
): Promise<string[]> {
  console.log('🔍 Using AI to filter files based on search criteria...');
  
  const prompt = buildFileFilteringPrompt(files, searchCriteria, expectedCount);
  
  try {
    const aiContent = await makeAIRequest(prompt, {
      system_prompt: 'You are an expert in visual asset selection. Choose files that best match the criteria based on their descriptive filenames.',
      temperature: 0.1,
      max_tokens: 500
    });
    
    const selectedFiles = parseAIJsonResponse<string[]>(aiContent);
    
    console.log(`✅ AI selected ${selectedFiles.length} files`);
    return selectedFiles.filter((file: string) => files.includes(file));
    
  } catch (error) {
    console.error('❌ AI file filtering failed:', error);
    throw new Error(`AI file filtering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AI-powered validation rules generation
 */
export async function generateValidationRulesWithAI(
  contentContext: ContentContext,
  aiAnalysis: AIAnalysisResult
): Promise<ValidationRules> {
  console.log('🔍 Using AI to generate validation rules...');
  
  const prompt = buildValidationRulesPrompt(contentContext, aiAnalysis);
  
  try {
    const aiContent = await makeAIRequest(prompt, {
      system_prompt: 'You are an expert in email deliverability and asset optimization. You MUST respond with ONLY valid JSON. Do not include any explanations, markdown, or text outside the JSON object.',
      temperature: 0.1,
      max_tokens: 1000
    });
    
    const validationRules = parseAIJsonResponse<ValidationRules>(aiContent);
    
    console.log('✅ AI validation rules generated');
    console.log(`📏 Max email size: ${validationRules.file_size_limits?.total_email || 'N/A'} bytes`);
    
    return validationRules;
    
  } catch (error) {
    console.error('❌ AI validation rules generation failed:', error);
    throw new Error(`AI validation rules generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 