import { config } from 'dotenv';
import * as path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

import { ToolResult, ContentInfo, PriceInfo, handleToolError } from './index';
import { OpenAI } from 'openai';
// import ABTestingService from '../../lib/ab-testing'; // DISABLED - A/B testing framework disabled

// Helper function to clean API keys
function cleanApiKey(apiKey: string | undefined): string | undefined {
  if (!apiKey) return undefined;
  return apiKey.replace(/\s+/g, '').trim();
}

function cleanMarkdownJson(content: string): string {
  // Remove markdown code blocks
  return content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*```/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();
}

interface CopyParams {
  topic: string;
  prices: {
    prices: PriceInfo[];
    currency: string;
    cheapest: number;
  };
}

/**
 * T3: Generate Copy Tool
 * Generate email content using dual LLM approach (GPT-4o mini + Claude)
 */
export async function generateCopy(params: CopyParams): Promise<ToolResult> {
  try {
    console.log('T3: Generating copy for topic:', params.topic);

    // Validate parameters
    if (!params.topic || !params.prices) {
      throw new Error('Topic and prices are required');
    }

    // Check if OpenAI API is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. OPENAI_API_KEY environment variable is required.');
    }

    try {
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      // Test connectivity with a simple request
      await testOpenAIConnectivity(openai);

      // Generate Russian content using GPT-4o mini
      const russianContent = await generateRussianContent(openai, params.topic, params.prices);
      
      // Generate English A-variant using GPT-4o mini
      const englishContent = await generateEnglishContent(params.topic, params.prices);

      const result: ContentInfo = {
        subject: russianContent.subject,
        preheader: russianContent.preheader,
        body: russianContent.body,
        cta: russianContent.cta,
        language: 'ru',
        tone: 'friendly',
        a_variant: englishContent
      };

      return {
        success: true,
        data: result,
        metadata: {
          topic: params.topic,
          price_info: `от ${params.prices.cheapest} ${params.prices.currency}`,
          timestamp: new Date().toISOString()
        }
      };

    } catch (networkError: any) {
      throw new Error(`Network error: ${networkError.message}`);
    }

  } catch (error: any) {
    return handleToolError('generate_copy', error);
  }
}

async function generateRussianContent(
  openai: OpenAI, 
  topic: string, 
  prices: { prices: PriceInfo[]; currency: string; cheapest: number }
): Promise<Omit<ContentInfo, 'language' | 'tone' | 'a_variant'>> {
  
  // Defensive checks for prices
  const pricesList = prices?.prices || [];
  const currency = prices?.currency || 'RUB';
  const cheapestPrice = prices?.cheapest || 0;
  
  // Generate price context only if we have valid prices
  let priceContext = 'Специальные предложения на авиабилеты';
  if (pricesList.length > 0) {
    priceContext = pricesList.slice(0, 3).map(p => `${p.origin}→${p.destination}: ${p.price} ${p.currency} (${p.date})`).join('\n');
  }
  
  // Enhanced prompt using content.md guidelines
  const prompt = `Ты эксперт по email-маркетингу для туристической компании Kupibilet. 
Создай привлекательное письмо на тему "${topic}" используя цены от ${cheapestPrice} ${currency}.

### Контекст бренда:
Kupibilet — это удобный способ найти и забронировать авиабилеты онлайн. Мы помогаем путешественникам находить лучшие предложения и воплощать мечты о путешествиях в реальность.

### Данные о ценах:
${priceContext}

### Требования:
- Заголовок до 50 символов с ценой (используй "от ${cheapestPrice} ${currency}")
- Preheader до 90 символов, дополняющий заголовок
- Основной текст 200-300 слов
- Призыв к действию до 20 символов
- Тон: дружелюбный, мотивирующий
- Фокус на выгоде и эмоциях

### Эмоциональные триггеры:
- Жажда путешествий и приключений
- FOMO (ограниченное по времени предложение)
- Ценность и экономия
- Мечты и стремления
- Удобство и простота

### Структура письма:
1. **Заголовок**: Привлекающий внимание с ценой
2. **Preheader**: Дополняющий заголовок
3. **Основной текст**: Эмоциональная история + выгода + призыв
4. **CTA**: Ясный призыв к действию (примеры: "Найти билеты", "Забронировать", "Посмотреть цены")

ВАЖНО: Отвечай ТОЛЬКО в формате JSON без дополнительного текста:
{
  "subject": "...",
  "preheader": "...",
  "body": "...",
  "cta": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from GPT-4o mini');
    }

    try {
      const cleanedContent = cleanMarkdownJson(content);
      const parsed = JSON.parse(cleanedContent);
      return {
        subject: parsed.subject,
        preheader: parsed.preheader,
        body: parsed.body,
        cta: parsed.cta
      };
    } catch (parseError: any) {
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
  } catch (apiError: any) {
    throw new Error(`OpenAI API failed: ${apiError.message}`);
  }
}

async function generateEnglishContent(
  topic: string, 
  prices: { prices: PriceInfo[]; currency: string; cheapest: number }
): Promise<{ subject: string; body: string }> {
  
  try {
    // Use only GPT-4o mini (Claude disabled)
    console.log('🤖 Generating English content with GPT-4o mini only...');
    return await generateEnglishWithGPT(topic, prices);
  } catch (gptError: any) {
    throw new Error(`English content generation failed: ${gptError.message}`);
  }
}

// Claude API removed - using only GPT-4o mini for content generation

async function generateEnglishWithGPT(
  topic: string, 
  prices: { prices: PriceInfo[]; currency: string; cheapest: number }
): Promise<{ subject: string; body: string }> {
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Create compelling email content for Kupibilet travel company about "${topic}" 
using price data from ${prices.cheapest} ${prices.currency}.

REQUIREMENTS:
- Subject line under 50 characters with price
- Body content 200-300 words
- Tone: friendly, motivating
- Focus on benefits and emotions

RESPONSE FORMAT (JSON ONLY):
{
  "subject": "...",
  "body": "..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 800
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content generated from GPT-4o mini for English variant');
  }

  try {
    const cleanedContent = cleanMarkdownJson(content);
    const parsed = JSON.parse(cleanedContent);
    return {
      subject: parsed.subject,
      body: parsed.body
    };
  } catch (parseError) {
    throw new Error(`Failed to parse English content response: ${parseError.message}`);
  }
}

async function testOpenAIConnectivity(openai: OpenAI): Promise<void> {
  try {
    // Simple test to check if OpenAI API is reachable
    await openai.models.list();
  } catch (error: any) {
    if (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
      throw new Error('Network connectivity issue - OpenAI API unreachable');
    }
    throw error;
  }
}



 