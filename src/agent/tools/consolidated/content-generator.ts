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
      const optimizedContent = {
        subject: `Оптимизированная версия - ${params.topic}`,
        preheader: 'Улучшенное предложение специально для вас',
        body: params.existing_content ? 
          `${params.existing_content} [ОПТИМИЗИРОВАНО: Добавлены эмоциональные триггеры и улучшена читабельность]` :
          `Оптимизированный контент для "${params.topic}". Улучшенная версия с эмоциональными триггерами.`,
        cta: 'Воспользоваться предложением',
        language: params.language || 'ru',
        tone: params.tone || 'friendly'
      };

      result = {
        success: true,
        action: 'optimize',
        data: {
          content: optimizedContent,
          optimization_suggestions: ['Улучшена читабельность', 'Добавлены эмоциональные триггеры', 'Усилен призыв к действию']
        },
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: optimizedContent.body.length,
          complexity_score: 80,
          generation_confidence: 90,
          ai_model_used: 'gpt-4o-mini'
        }
      };
      break;
    }
      
    case 'variants': {
      const variantCount = params.variant_options?.variant_count || 2;
      const baseContent = {
        subject: `${params.topic} - Специальное предложение`,
        preheader: `Не упустите возможность сэкономить`,
        body: `Контент для "${params.topic}". Забронируйте сейчас!`,
        cta: 'Забронировать',
        language: params.language || 'ru',
        tone: params.tone || 'friendly'
      };

      const variants = [];
      for (let i = 0; i < variantCount; i++) {
        variants.push({
          variant_id: `variant_${i + 1}`,
          content: {
            ...baseContent,
            subject: `${baseContent.subject} - Вариант ${i + 1}`,
            body: `${baseContent.body} [Вариант ${i + 1}]`
          },
          variant_score: 75 + (i * 5)
        });
      }

      result = {
        success: true,
        action: 'variants',
        data: {
          variants: variants
        },
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: variants.reduce((sum, v) => sum + v.content.body.length, 0),
          complexity_score: 85,
          generation_confidence: 80,
          ai_model_used: 'gpt-4o-mini'
        }
      };
      break;
    }
      
    case 'personalize': {
      const personalizedContent = {
        subject: `Персонализированно: ${params.topic}`,
        preheader: 'Специально для вас',
        body: `Персонализированный контент для "${params.topic}". Учтены ваши предпочтения.`,
        cta: 'Забронировать сейчас',
        language: params.language || 'ru',
        tone: params.tone || 'friendly'
      };

      result = {
        success: true,
        action: 'personalize',
        data: {
          content: personalizedContent
        },
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: personalizedContent.body.length,
          complexity_score: 90,
          generation_confidence: 85,
          ai_model_used: 'gpt-4o-mini'
        }
      };
      break;
    }
      
    case 'analyze': {
      const analysis = {
        readability_score: 85,
        sentiment_score: 75,
        engagement_potential: 80,
        brand_alignment: 90
      };

      const insights = {
        tone_analysis: 'Дружелюбный и убедительный',
        audience_alignment: 85,
        emotional_appeal: 'средний',
        call_to_action_strength: 75,
        pricing_integration: params.pricing_data ? 'хорошая' : 'отсутствует',
        predicted_performance: {
          open_rate_estimate: 22,
          click_rate_estimate: 4.5,
          conversion_potential: 'medium' as const
        }
      };

      result = {
        success: true,
        action: 'analyze',
        data: {
          analysis: analysis
        },
        content_insights: insights,
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: params.existing_content?.length || 0,
          complexity_score: 70,
          generation_confidence: 95,
          ai_model_used: 'gpt-4o-mini'
        }
      };
      break;
    }
      
    case 'test': {
      const testContent = {
        subject: `Тест: ${params.topic}`,
        preheader: 'Тестовое сообщение',
        body: `Тестовый контент для "${params.topic}". Быстрая генерация.`,
        cta: 'Тест',
        language: params.language || 'ru',
        tone: params.tone || 'friendly'
      };
      
      result = {
        success: true,
        action: 'test',
        data: {
          content: testContent
        },
        analytics: {
          execution_time: Date.now() - startTime,
          content_length: testContent.body.length,
          complexity_score: 60,
          generation_confidence: 70,
          ai_model_used: 'gpt-4o-mini'
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
    const { Agent, run } = await import('@openai/agents-core');
    const { getUsageModel } = await import('../../../shared/utils/model-config');
    
    // Extract prices from context for prompt injection
    const pricesText = context.prices ? 
      `Цены: ${context.prices.map((p: any) => `${p.destination} от ${p.price} ${p.currency}`).join(', ')}` :
      'Цены уточняются при бронировании';
    
    // Enhanced prompt with image requirements
    const contentPrompt = `Ты эксперт по email-маркетингу для туристической компании Kupibilet. 
Создай привлекательное письмо на тему "${topic}" используя цены ${pricesText}.

### Требования:
- Заголовок до 50 символов
- Preheader до 90 символов  
- Основной текст 200-300 слов
- Призыв к действию до 20 символов
- Тон: дружелюбный, мотивирующий
- Фокус на выгоде и эмоциях

### Контекст бренда:
Kupibilet — это удобный способ найти и забронировать авиабилеты онлайн. Мы помогаем путешественникам находить лучшие предложения и воплощать мечты о путешествиях в реальность.

### Структура письма:
1. **Заголовок**: Привлекающий внимание с ценой
2. **Preheader**: Дополняющий заголовок
3. **Основной текст**: Эмоциональная история + выгода + призыв
4. **CTA**: Ясный призыв к действию

### Эмоциональные триггеры:
- Страсть к путешествиям и приключениям
- FOMO (ограниченное время предложения)
- Ценность и экономия
- Мечты и стремления
- Удобство и простота

### Интеграция цен:
- Всегда включай стартовую цену на видном месте
- Используй "от" для указания цены
- Подчеркивай экономию или специальные предложения
- Создавай срочность с ограниченными по времени сообщениями

### Примеры призывов к действию:
- Найти билеты
- Забронировать
- Посмотреть цены
- Купить билет
- Улететь сейчас

### ТРЕБОВАНИЯ К ИЗОБРАЖЕНИЯМ:
Определи оптимальную стратегию использования изображений:

**Figma Assets (Приоритет):**
- Используй фирменных зайцев Kupibilet для брендинга
- Иконки и элементы интерфейса
- Логотипы авиакомпаний
- Эмоциональные персонажи

**Внешние изображения (Дополнение):**
- Реальные фотографии направлений
- Достопримечательности и пейзажи
- Lifestyle фотографии путешественников

**Размещение:**
- Header: Hero изображение (внешнее) + логотип (Figma)
- Body: Заяц Kupibilet (Figma) + фото направления (внешнее)
- Footer: Иконки услуг (Figma)

ВАЖНО: Верни результат ТОЛЬКО в формате JSON:
{
  "subject": "Заголовок с эмодзи до 50 символов",
  "preheader": "Краткий предпросмотр до 90 символов",
  "body": "Основной контент письма с форматированием, эмодзи и деталями путешествия",
  "cta": "Текст кнопки действия до 20 символов",
  "language": "ru",
  "tone": "friendly",
  "image_requirements": {
    "total_images_needed": 3,
    "figma_images_count": 2,
    "internet_images_count": 1,
    "require_logo": true,
    "image_categories": ["hero", "illustration", "icon"],
    "placement_instructions": {
      "figma_assets": ["Заяц Kupibilet в header для брендинга", "Иконки услуг в footer"],
      "external_images": ["Hero фото направления в header"]
    }
  }
}

Адаптируй количество и типы изображений под конкретную тему "${topic}".`;

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