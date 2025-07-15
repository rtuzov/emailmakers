/**
 * Context Intelligence Tools
 * 
 * Provides AI-powered context analysis and date intelligence
 * for destination-specific campaign content generation.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import { log } from '../../../core/agent-logger';
import { getErrorMessage } from '../utils/error-handling';

// Campaign context types 
interface CampaignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  metadata?: any;
  context_analysis?: any;
  date_analysis?: any;
  pricing_analysis?: any;
  asset_strategy?: any;
  generated_content?: any;
  technical_requirements?: any;
  design_brief?: any;
  trace_id?: string | null;
}

interface ExtendedRunContext {
  campaignContext?: CampaignWorkflowContext;
}

/**
 * Extract campaign context from OpenAI SDK context parameter
 */
function extractCampaignContext(context?: any): CampaignWorkflowContext {
  if (!context) return {};
  return context.campaignContext || {};
}

/**
 * Generate dynamic context analysis using OpenAI
 */
async function generateDynamicContextAnalysis(
  destination: string,
  contextType: string
): Promise<any> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Проанализируй контекст для туристического направления "${destination}" по типу "${contextType}".

Создай детальный анализ в формате JSON со следующей структурой:
{
  "destination": "${destination}",
  "context_type": "${contextType}",
  "cultural_insights": {
    "traditions": ["традиция1", "традиция2"],
    "local_customs": ["обычай1", "обычай2"],
    "cultural_highlights": ["особенность1", "особенность2"]
  },
  "target_audience": {
    "primary_segments": ["сегмент1", "сегмент2"],
    "interests": ["интерес1", "интерес2"],
    "demographics": {
      "age_groups": ["18-25", "26-40"],
      "travel_style": "luxury|budget|family|adventure"
    }
  },
  "content_strategy": {
    "key_messages": ["сообщение1", "сообщение2"],
    "tone": "friendly|professional|adventurous|luxury",
    "emotional_hooks": ["эмоция1", "эмоция2"]
  },
  "visual_elements": {
    "recommended_imagery": ["тип изображения1", "тип изображения2"],
    "color_palette": ["цвет1", "цвет2"],
    "visual_style": "описание стиля"
  },
  "seasonal_context": {
    "best_months": ["месяц1", "месяц2"],
    "weather_highlights": "описание погоды",
    "seasonal_activities": ["активность1", "активность2"]
  }
}

Используй знания о туризме, культуре и маркетинге для создания точного анализа.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch {
      // If JSON parsing fails, create structured response
      return {
        destination,
        context_type: contextType,
        raw_analysis: content,
        generated_at: new Date().toISOString()
      };
    }

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    log.error('ContentSpecialist', 'Failed to generate dynamic context analysis', {
      error: errorMessage,
      destination,
      context_type: contextType
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать контекстный анализ для ${destination}: ${errorMessage}`);
  }
}

/**
 * Context provider tool
 */
export const contextProvider = tool({
  name: 'contextProvider',
  description: 'Предоставляет AI-генерируемый контекстный анализ для направления с учетом культуры, аудитории и стратегии контента',
  parameters: z.object({
    destination: z.string().describe('Туристическое направление'),
    context_type: z.string().describe('Тип контекста (cultural, marketing, seasonal)'),
    trace_id: z.string().optional().describe('ID трассировки для отладки')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Get campaign context
      const campaignContext = extractCampaignContext(context);
      
      // Generate dynamic context analysis
      const contextAnalysis = await generateDynamicContextAnalysis(
        params.destination,
        params.context_type
      );
      
      // Save analysis to campaign folder if available
      if (campaignContext.campaignPath) {
        const analysisPath = path.join(campaignContext.campaignPath, 'content', 'context-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(contextAnalysis, null, 2));
      }
      
      // Update campaign context
      const updatedCampaignContext = {
        ...campaignContext,
        context_analysis: contextAnalysis
      };
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }

      // Return formatted string with design brief info
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Context analysis generated', {
        destination: params.destination,
        context_type: params.context_type,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('contextProvider', params, contextAnalysis, duration, true);
      
      return `Контекстный анализ для ${params.destination} создан! Тип: ${params.context_type}. Ключевые сообщения: ${contextAnalysis.content_strategy?.key_messages?.join(', ') || 'не определены'}. Тон: ${contextAnalysis.content_strategy?.tone || 'не определен'}. Целевая аудитория: ${contextAnalysis.target_audience?.primary_segments?.join(', ') || 'не определена'}. Визуальный стиль: ${contextAnalysis.visual_elements?.visual_style || 'не определен'}. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Context provider failed', {
        error: errorMessage,
        destination: params.destination,
        context_type: params.context_type,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('contextProvider', params, null, duration, false, errorMessage);
      return `Ошибка получения контекста: ${errorMessage}`;
    }
  }
});

/**
 * Generate dynamic date analysis using OpenAI
 */
async function generateDynamicDateAnalysis(
  destination: string,
  season: string,
  flexibility: string
): Promise<any> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Проанализируй оптимальные даты для путешествия в "${destination}" в сезон "${season}" с гибкостью "${flexibility}".

Создай анализ в формате JSON:
{
  "destination": "${destination}",
  "season": "${season}",
  "flexibility": "${flexibility}",
  "optimal_dates": ["дата1", "дата2", "дата3"],
  "pricing_windows": {
    "low_season": {
      "months": ["месяц1", "месяц2"],
      "price_level": "low|medium|high",
      "description": "описание"
    },
    "high_season": {
      "months": ["месяц1", "месяц2"],
      "price_level": "low|medium|high",
      "description": "описание"
    }
  },
  "weather_forecast": {
    "temperature_range": "XX-XX°C",
    "precipitation": "low|medium|high",
    "weather_description": "описание погоды"
  },
  "booking_recommendation": {
    "advance_booking": "1-2 месяца|2-3 месяца|3+ месяцев",
    "best_booking_time": "описание лучшего времени",
    "price_trends": "растущие|стабильные|падающие"
  },
  "seasonal_factors": {
    "local_events": ["событие1", "событие2"],
    "tourist_density": "low|medium|high",
    "unique_experiences": ["опыт1", "опыт2"]
  },
  "recommendations": ["рекомендация1", "рекомендация2"]
}

Используй актуальные знания о климате, туристических сезонах и ценовых трендах.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Try to parse JSON response
    try {
      return JSON.parse(content);
    } catch {
      // If JSON parsing fails, create structured response
      return {
        destination,
        season,
        flexibility,
        raw_analysis: content,
        generated_at: new Date().toISOString()
      };
    }

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    log.error('ContentSpecialist', 'Failed to generate dynamic date analysis', {
      error: errorMessage,
      destination,
      season,
      flexibility
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать анализ дат для ${destination}: ${errorMessage}`);
  }
}

/**
 * Date intelligence tool
 */
export const dateIntelligence = tool({
  name: 'dateIntelligence',
  description: 'AI-анализ оптимальных дат путешествия с учетом сезонности, погоды и ценовых трендов',
  parameters: z.object({
    destination: z.string().describe('Направление путешествия'),
    season: z.string().describe('Предпочитаемый сезон'),
    flexibility: z.string().describe('Гибкость дат (fixed, flexible, very_flexible)'),
    trace_id: z.string().optional().describe('ID трассировки для отладки')
  }),
  
  async execute(params, context) {
    const startTime = Date.now();
    
    try {
      // Get campaign context
      const campaignContext = extractCampaignContext(context);
      
      // Generate dynamic date analysis
      const dateAnalysis = await generateDynamicDateAnalysis(
        params.destination,
        params.season,
        params.flexibility
      );
      
      // Save analysis to campaign folder if available
      if (campaignContext.campaignPath) {
        const analysisPath = path.join(campaignContext.campaignPath, 'content', 'date-analysis.json');
        await fs.writeFile(analysisPath, JSON.stringify(dateAnalysis, null, 2));
      }
      
      // Update campaign context
      const updatedCampaignContext = {
        ...campaignContext,
        date_analysis: dateAnalysis
      };
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }

      // Return formatted string
      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Date analysis generated', {
        destination: params.destination,
        season: params.season,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('dateIntelligence', params, dateAnalysis, duration, true);
      
      return `Анализ дат для ${params.destination} в ${params.season}: Оптимальные даты - ${dateAnalysis.optimal_dates?.join(', ') || 'не определены'}. Ценовые окна - низкий сезон: ${dateAnalysis.pricing_windows?.low_season?.months?.join(', ') || 'не определены'}. Рекомендация по бронированию - ${dateAnalysis.booking_recommendation?.advance_booking || 'не определена'}. Сезонные факторы - ${dateAnalysis.seasonal_factors?.local_events?.join(', ') || 'не определены'}. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = getErrorMessage(error);
      log.error('ContentSpecialist', 'Date intelligence failed', {
        error: errorMessage,
        destination: params.destination,
        season: params.season,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('dateIntelligence', params, null, duration, false, errorMessage);
      return `Ошибка анализа дат: ${errorMessage}`;
    }
  }
}); 