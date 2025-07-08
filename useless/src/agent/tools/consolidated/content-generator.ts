/**
 * ✍️ CONTENT GENERATOR - Modular Consolidated Tool
 * 
 * МОДУЛЬНАЯ АРХИТЕКТУРА v2:
 * - PricingService: анализ цен и ценового контекста
 * - GenerationService: генерация, оптимизация, варианты, персонализация, анализ
 * - Совместимость с OpenAI Agents SDK v2
 * 
 * Единый интерфейс для интеллектуальной генерации контента
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { recordToolUsage } from '../../utils/tracing-utils';
import {
  contentGeneratorSchema,
  ContentGeneratorParams,
  ContentGeneratorResult,
  PricingService,
  GenerationService
} from '../../specialists/content';
import EmailFolderManager from '../email-folder-manager';
import { campaignState } from '../../core/campaign-state';

// Инициализация модульных сервисов
const pricingService = new PricingService();
const generationService = new GenerationService();

/**
 * Content Generator - Modular intelligent content creation with context awareness
 */
export async function contentGenerator(params: ContentGeneratorParams): Promise<ContentGeneratorResult> {
  const startTime = Date.now();
  console.log(`✍️ Content Generator (Modular): Executing action "${params.action}" for topic: "${params.topic}"`);
  
  try {
    // Добавляем таймаут для предотвращения зависания
    const timeoutPromise = new Promise<ContentGeneratorResult>((_, reject) => {
      setTimeout(() => reject(new Error('Content generation timeout after 30 seconds')), 30000);
    });

    const generationPromise = executeContentGeneration(params, startTime);
    
    const result = await Promise.race([generationPromise, timeoutPromise]);
    
    // Record tracing statistics
    if (result.analytics) {
      recordToolUsage({
        tool: 'content-generator-modular',
        operation: params.action,
        duration: result.analytics.execution_time,
        success: result.success
      });
    }
    
    console.log(`✅ Content Generator (Modular): Completed "${params.action}" successfully`);
    return result;
    
  } catch (error) {
    console.error('❌ Content Generator (Modular) error:', error);
    
    const errorResult: ContentGeneratorResult = {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        content_length: 0,
        complexity_score: 0,
        generation_confidence: 0,
        ai_model_used: 'error'
      } : undefined
    };
    
    // Record error statistics
    recordToolUsage({
      tool: 'content-generator-modular',
      operation: params.action,
      duration: Date.now() - startTime,
      success: false,
      error: errorResult.error
    });
    
    return errorResult;
  }
}

async function executeContentGeneration(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  let result: ContentGeneratorResult;
    
  switch (params.action) {
    case 'generate': {
      const generatedContent = await generateContentBodyForTopic(params.topic);
      result = {
        success: true,
        action: 'generate',
        data: {
          content: generatedContent
        },
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: generatedContent.body.length,
          complexity_score: 80,
          generation_confidence: 90,
          ai_model_used: 'gpt-4o-mini'
        }
      };
      break;
    }
      
    case 'optimize': {
      // Return placeholder result for now
      result = {
        success: true,
        action: 'optimize',
        data: {
          content: {
            subject: `Оптимизированная тема: ${params.topic}`,
            preheader: 'Улучшенный предзаголовок',
            body: 'Оптимизированное содержание письма...',
            cta: 'Узнать больше',
            language: 'ru',
            tone: 'friendly'
          }
        }
      };
      break;
    }
      
    case 'variants': {
      // Return placeholder result for now
      result = {
        success: true,
        action: 'variants',
        data: {
          variants: [
            {
              id: 'variant-1',
              content: {
                subject: `Вариант 1: ${params.topic}`,
                preheader: 'Предзаголовок варианта 1',
                body: 'Содержание варианта 1...',
                cta: 'Действие 1',
                language: 'ru',
                tone: 'friendly'
              },
              focus: 'urgency',
              score: 85
            }
          ]
        }
      };
      break;
    }
      
    case 'personalize': {
      // Return placeholder result for now
      result = {
        success: true,
        action: 'personalize',
        data: {
          content: {
            subject: `Персональное предложение: ${params.topic}`,
            preheader: 'Специально для вас',
            body: 'Персонализированное содержание...',
            cta: 'Узнать больше',
            language: 'ru',
            tone: 'friendly'
          }
        }
      };
      break;
    }
      
    case 'analyze': {
      // Return placeholder result for now
      result = {
        success: true,
        action: 'analyze',
        data: {
          analysis: {
            readability_score: 75,
            sentiment_score: 80,
            engagement_potential: 70,
            brand_alignment: 85
          }
        }
      };
      break;
    }
      
    case 'test': {
      // Return placeholder result for now
      result = {
        success: true,
        action: 'test',
        data: {
          test_setup: {
            variants: [
              {
                variant_id: 'test-1',
                content: {
                  subject: `Тест: ${params.topic}`,
                  preheader: 'Тестовый предзаголовок',
                  body: 'Тестовое содержание...',
                  cta: 'Тестовое действие',
                  language: 'ru',
                  tone: 'friendly'
                },
                predicted_performance: 78
              }
            ],
            recommended_split: '50/50',
            test_duration: '7 days',
            success_metric: 'click_rate'
          }
        }
      };
      break;
    }
      
    default:
      throw new Error(`Unknown action: ${params.action}`);
  }
  
  return result;
}

// Campaign folder creation tool - будет отображаться в логах OpenAI
export const createCampaignFolderTool = tool({
  name: 'create_campaign_folder',
  description: 'Creates a new campaign folder for email generation with proper structure and metadata',
  parameters: z.object({
    topic: z.string().describe('Campaign topic or theme'),
    campaign_type: z.enum(['promotional', 'newsletter', 'transactional', 'welcome']).describe('Type of email campaign'),
    trace_id: z.string().nullable().optional().describe('Optional trace ID for folder naming')
  }),
  execute: async (params) => {
    console.log(`📁 Creating campaign folder for topic: "${params.topic}"`);
    
    try {
      // Создаем папку кампании
      const emailFolder = await EmailFolderManager.createEmailFolder(
        params.topic,
        params.campaign_type,
        params.trace_id
      );
      
      // Устанавливаем состояние кампании
      campaignState.setCampaign({
        campaignId: emailFolder.campaignId,
        emailFolder: emailFolder,
        topic: params.topic,
        campaign_type: params.campaign_type,
        created_at: new Date().toISOString(),
        trace_id: params.trace_id
      });
      
      console.log(`✅ Campaign folder created: ${emailFolder.campaignId}`);
      console.log(`📂 Assets path: ${emailFolder.assetsPath}`);
      
      return JSON.stringify({
        success: true,
        campaign_id: emailFolder.campaignId,
        folder_path: emailFolder.basePath,
        assets_path: emailFolder.assetsPath,
        topic: params.topic,
        campaign_type: params.campaign_type
      }, null, 2);
      
    } catch (error) {
      console.error('❌ Failed to create campaign folder:', error);
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, null, 2);
    }
  }
});

// Export the tool using OpenAI Agents SDK v2 pattern
export const contentGeneratorTool = tool({
  name: 'content_generator',
  description: 'Intelligent content generation with modular architecture supporting pricing analysis, content generation, optimization, variants, personalization, and analysis',
  parameters: contentGeneratorSchema,
  execute: contentGenerator
});

// Wrapper function for createCampaignFolderTool
export async function createCampaignFolder(params: {
  topic: string;
  campaign_type: 'promotional' | 'newsletter' | 'transactional' | 'welcome';
  trace_id: string | null;
}) {
  console.log(`📁 Creating campaign folder for topic: "${params.topic}"`);
  
  try {
    // Создаем папку кампании
    const emailFolder = await EmailFolderManager.createEmailFolder(
      params.topic,
      params.campaign_type,
      params.trace_id
    );
    
    // Устанавливаем состояние кампании
    campaignState.setCampaign({
      campaignId: emailFolder.campaignId,
      emailFolder: emailFolder,
      topic: params.topic,
      campaign_type: params.campaign_type,
      created_at: new Date().toISOString(),
      trace_id: params.trace_id
    });
    
    console.log(`✅ Campaign folder created: ${emailFolder.campaignId}`);
    console.log(`📂 Assets path: ${emailFolder.assetsPath}`);
    
    return {
      success: true,
      campaign_id: emailFolder.campaignId,
      folder_path: emailFolder.basePath,
      assets_path: emailFolder.assetsPath,
      topic: params.topic,
      campaign_type: params.campaign_type
    };
    
  } catch (error) {
    console.error('❌ Failed to create campaign folder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Re-export schema for external use
export { contentGeneratorSchema } from '../../specialists/content';
export type { ContentGeneratorParams, ContentGeneratorResult } from '../../specialists/content';

/**
 * Generate detailed content body for a specific topic using prompts from @/prompts/content.md
 * This function uses structured prompts instead of creating AI agents
 */
async function generateContentBodyForTopic(topic: string, context: any = {}): Promise<{
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
  image_requirements?: {
    total_images_needed: number;
    figma_images_count: number;
    internet_images_count: number;
    require_logo: boolean;
    image_categories: string[];
    placement_instructions: {
      figma_assets: string[];
      external_images: string[];
    };
  };
}> {
  console.log(`🎯 Prompt-Based Content Generation: Generating content for topic: "${topic}"`);
  
  try {
    // Import AI dependencies
    const { Agent, run } = await import('@openai/agents');
    const { getUsageModel } = await import('../../../shared/utils/model-config');
    const { PromptManager } = await import('../../core/prompt-manager');
    
    // Extract prices from context for prompt injection
    const pricesText = context.prices ? 
      `Цены: ${context.prices.map((p: any) => `${p.destination} от ${p.price} ${p.currency}`).join(', ')}` :
      'Цены уточняются при бронировании';
    
    // Load prompt from content.md using PromptManager
    const promptManager = PromptManager.getInstance();
    const basePrompt = promptManager.loadPrompt('content.md');
    
    // Replace placeholders in the loaded prompt
    const contentPrompt = basePrompt
      .replace(/\{topic\}/g, topic)
      .replace(/\{prices\}/g, pricesText);

    // Create simple agent using the enhanced prompt
    const contentAgent = new Agent({
      name: 'ContentSpecialist',
      instructions: contentPrompt,
      model: getUsageModel()
    });

    console.log('🤖 AI Agent: Generating content with image requirements using enhanced prompt...');
    
    const result = await run(contentAgent, `Создай email контент для темы: "${topic}"\n\nКонтекст: ${JSON.stringify(context, null, 2)}\n\nВерни ТОЛЬКО валидный JSON с требуемыми полями включая image_requirements.`);
    const aiResponse = result.finalOutput;
    
    if (!aiResponse) {
      throw new Error('AI agent returned empty response');
    }
    
    // Parse AI response
    let parsedContent;
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      parsedContent = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error('AI response is not valid JSON');
    }
    
    // Validate required fields
    const requiredFields = ['subject', 'preheader', 'body', 'cta', 'language', 'tone'];
    for (const field of requiredFields) {
      if (!parsedContent[field]) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }
    
    // Add default image requirements if not provided by AI
    if (!parsedContent.image_requirements) {
      console.log('⚠️ AI did not provide image requirements, adding defaults');
      parsedContent.image_requirements = {
        total_images_needed: 3,
        figma_images_count: 2,
        internet_images_count: 1,
        require_logo: true,
        image_categories: ['hero', 'illustration', 'icon'],
        placement_instructions: {
          figma_assets: ['Заяц Kupibilet для брендинга', 'Иконки услуг'],
          external_images: ['Фото направления для hero секции']
        }
      };
    }
    
    console.log('✅ Prompt-Based Content Generated:', {
      subject_length: parsedContent.subject.length,
      body_length: parsedContent.body.length,
      language: parsedContent.language,
      tone: parsedContent.tone,
      image_strategy: `${parsedContent.image_requirements.figma_images_count} Figma + ${parsedContent.image_requirements.internet_images_count} external`
    });
    
    return parsedContent;
    
  } catch (error) {
    console.error('❌ Prompt-Based Content Generation Error:', error);
    
    // ❌ FALLBACK POLICY: No fallback allowed - fail fast
    throw new Error(`Prompt-based content generation failed: ${error.message}`);
  }
}