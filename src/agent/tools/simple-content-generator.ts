/**
 * 🚀 SIMPLE CONTENT GENERATOR
 * 
 * Упрощенная версия content_generator без сложных зависимостей
 * Предотвращает зависание системы
 */

import { z } from 'zod';
import { tool } from '@openai/agents';

// Простая Zod схема
const simpleContentGeneratorSchema = z.object({
  topic: z.string().describe('Тема контента'),
  action: z.enum(['generate', 'test']).describe('Действие'),
  language: z.string().optional().nullable().describe('Язык контента'),
  tone: z.string().optional().nullable().describe('Тон контента'),
  pricing_data: z.any().optional().nullable().describe('Ценовые данные'),
  include_analytics: z.boolean().optional().nullable().describe('Включить аналитику')
});

type SimpleContentGeneratorParams = z.infer<typeof simpleContentGeneratorSchema>;

/**
 * Простой генератор контента
 */
export async function simpleContentGenerator(params: SimpleContentGeneratorParams): Promise<any> {
  const startTime = Date.now();
  console.log(`🚀 Simple Content Generator: ${params.action} for "${params.topic}"`);
  
  try {
    // Простая генерация без сложных зависимостей
    const content = {
      subject: `${params.topic} - Специальное предложение от Kupibilet`,
      preheader: `Не упустите возможность сэкономить на путешествии`,
      body: `Уважаемый путешественник! Мы рады предложить вам отличную возможность для путешествия по теме "${params.topic}". ${
        params.pricing_data?.cheapest ? `Цены от ${params.pricing_data.cheapest} ${params.pricing_data.currency}.` : ''
      } Забронируйте сейчас и получите незабываемые впечатления! Безопасность и комфорт вашей семьи - наш приоритет.`,
      cta: 'Забронировать сейчас',
      language: params.language || 'ru',
      tone: params.tone || 'friendly'
    };

    const result = {
      success: true,
      action: params.action,
      data: {
        content: content
      },
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        content_length: content.body.length,
        complexity_score: 75,
        generation_confidence: 85,
        ai_model_used: 'simple-generator'
      } : undefined
    };

    console.log(`✅ Simple Content Generator: Completed in ${Date.now() - startTime}ms`);
    return JSON.stringify(result);

  } catch (error) {
    console.error('❌ Simple Content Generator error:', error);
    
    const errorResult = {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
      analytics: {
        execution_time: Date.now() - startTime,
        content_length: 0,
        complexity_score: 0,
        generation_confidence: 0,
        ai_model_used: 'error'
      }
    };
    
    return JSON.stringify(errorResult);
  }
}

// Export the tool
export const simpleContentGeneratorTool = tool({
  name: 'simple_content_generator',
  description: 'Простой генератор контента для email кампаний без сложных зависимостей',
  parameters: simpleContentGeneratorSchema,
  execute: simpleContentGenerator
}); 