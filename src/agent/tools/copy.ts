import { config } from 'dotenv';
import * as path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

// OpenAI Agent SDK imports
import { Agent, tool, withTrace } from '@openai/agents';
import { generateTraceId } from '../validators/agent-handoff-validator';

// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-orchestrator';
import { logger } from '../core/logger';

// Define local interfaces to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface ContentInfo {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
}

interface PriceInfo {
  origin: string;
  destination: string;
  price: number;
  date: string;
  currency: string;
  metadata?: {
    airline?: string;
    flight_number?: string;
    duration?: number;
    stops?: number;
    estimated?: boolean;
    base_price?: number;
    variation_factor?: number;
  };
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}
import { getUsageModel } from '../../shared/utils/model-config';
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

// CopyGeneratorAgent - использует OpenAI Agent SDK
class CopyGeneratorAgent extends Agent {
  constructor() {
    super({
      name: 'CopyGeneratorAgent',
      description: 'Generates email marketing copy for travel topics',
      model: getUsageModel(),
      tools: [generateCopyTool]
    });
  }
}

// Tool для генерации копирайтинга
const generateCopyTool = tool({
  name: 'generate_marketing_copy',
  description: 'Generate Russian marketing copy for travel emails',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Travel topic or destination' },
      priceContext: { type: 'string', description: 'Price information context' },
      cheapestPrice: { type: 'number', description: 'Cheapest available price' },
      currency: { type: 'string', description: 'Currency for prices' }
    },
    required: ['topic', 'priceContext', 'cheapestPrice', 'currency']
  }
}, async (params) => {
  const prompt = `Ты эксперт по email-маркетингу для туристической компании Kupibilet. 
Создай привлекательное письмо на тему "${params.topic}" используя цены от ${params.cheapestPrice} ${params.currency}.

### Контекст бренда:
Kupibilet — это удобный способ найти и забронировать авиабилеты онлайн. Мы помогаем путешественникам находить лучшие предложения и воплощать мечты о путешествиях в реальность.

### Данные о ценах:
${params.priceContext}

### Требования:
- Заголовок до 50 символов с ценой (используй "от ${params.cheapestPrice} ${params.currency}")
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

  return prompt;
});

/**
 * T3: Generate Copy Tool
 * Generate email content using OpenAI Agent SDK with tracing
 */
export async function generateCopy(params: CopyParams): Promise<ToolResult> {
  const traceId = generateTraceId();
  
  return withTrace({
    name: 'generate_copy',
    metadata: { 
      trace_id: traceId,
      topic: params.topic,
      price_count: params.prices.prices.length,
      cheapest_price: params.prices.cheapest
    }
  }, async () => {
    try {
      console.log(`🖋️ [${traceId}] Генерация контента для темы:`, params.topic);

      // Validate parameters
      if (!params.topic || !params.prices) {
        throw new Error('Topic and prices are required');
      }

      // Check if OpenAI API is available
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not found. OPENAI_API_KEY environment variable is required.');
      }

      // Create copy generator agent
      const copyAgent = new CopyGeneratorAgent();

      // Prepare price context
      const pricesList = params.prices?.prices || [];
      const currency = params.prices?.currency || 'RUB';
      const cheapestPrice = params.prices?.cheapest || 0;
      
      // Generate price context only if we have valid prices
      let priceContext = 'Специальные предложения на авиабилеты';
      if (pricesList.length > 0) {
        priceContext = pricesList.slice(0, 3).map(p => 
          `${p.origin}→${p.destination}: ${p.price} ${p.currency} (${p.date})`
        ).join('\n');
      }

      console.log(`🔧 [${traceId}] Starting agent copy generation...`);
      
      // Generate content using agent
      const response = await copyAgent.run(`Generate marketing copy for ${params.topic} with pricing context`, {
        tools: {
          generate_marketing_copy: {
            topic: params.topic,
            priceContext: priceContext,
            cheapestPrice: cheapestPrice,
            currency: currency
          }
        }
      });

      // Parse response 
      const russianContent = await parseAgentResponse(response);

      const result: ContentInfo = {
        subject: russianContent.subject,
        preheader: russianContent.preheader,
        body: russianContent.body,
        cta: russianContent.cta,
        language: 'ru',
        tone: 'friendly'
      };

      console.log(`✅ [${traceId}] Copy generation completed successfully`);

      return {
        success: true,
        data: result,
        metadata: {
          trace_id: traceId,
          topic: params.topic,
          price_info: `от ${params.prices.cheapest} ${params.prices.currency}`,
          timestamp: new Date().toISOString(),
          agent_used: 'CopyGeneratorAgent',
          model: getUsageModel()
        }
      };

    } catch (error: any) {
      console.error(`❌ [${traceId}] Copy generation failed:`, error.message);
      return handleToolError('generate_copy', error);
    }
  });
}

// Parse agent response and extract content
async function parseAgentResponse(response: any): Promise<Omit<ContentInfo, 'language' | 'tone'>> {
  try {
    // Extract content from agent response
    let content = '';
    if (response && typeof response === 'string') {
      content = response;
    } else if (response?.content) {
      content = response.content;
    } else if (response?.text) {
      content = response.text;
    } else {
      throw new Error('Invalid agent response format');
    }

    // Clean and parse JSON
    const cleanContent = cleanMarkdownJson(content);
    const parsedContent = JSON.parse(cleanContent);

    return {
      subject: parsedContent.subject || '',
      preheader: parsedContent.preheader || '',
      body: parsedContent.body || '',
      cta: parsedContent.cta || 'Найти билеты'
    };

  } catch (parseError: any) {
    console.error('Failed to parse agent response:', parseError.message);
    throw new Error(`Failed to parse agent response: ${parseError.message}`);
  }
}

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from GPT-4o mini');
    }

    try {
      const cleanedContent = cleanMarkdownJson(content);
      console.log('🔍 Cleaned OpenAI content for parsing:', cleanedContent.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanedContent);
      console.log('🔍 Parsed OpenAI response:', {
        hasSubject: !!parsed.subject,
        hasPreheader: !!parsed.preheader,
        hasBody: !!parsed.body,
        hasCta: !!parsed.cta,
        subjectLength: parsed.subject?.length || 0,
        bodyLength: parsed.body?.length || 0
      });
      
      return {
        subject: parsed.subject,
        preheader: parsed.preheader,
        body: parsed.body,
        cta: parsed.cta
      };
    } catch (parseError: any) {
      console.error('❌ Failed to parse OpenAI response. Raw content:', content);
      console.error('❌ Cleaned content:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
    
  } catch (apiError: any) {
    throw new Error(`OpenAI API failed: ${apiError.message}`);
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



 