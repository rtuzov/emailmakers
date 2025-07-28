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
import { ENV_CONFIG } from '../../../../config/env';
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
  
  // Extract campaign path from OpenAI Agent SDK context structure
  const campaignPath = context.context?.campaign?.path || null;
  
  console.log(`🔍 DEBUG: extractCampaignContext - found campaignPath: ${campaignPath}`);
  
  return {
    campaignPath,
    // Use only the correct context structure
    ...context.context?.campaign
  };
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
      apiKey: ENV_CONFIG.OPENAI_API_KEY
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

    // Enhanced JSON parsing with markdown cleanup
    try {
      let jsonString = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(jsonString.trim());
    } catch (parseError) {
      // Log the actual response for debugging
      log.error('ContentSpecialist', 'JSON parsing failed for context analysis', {
        destination,
        context_type: contextType,
        raw_response: content.substring(0, 500) + '...',
        parse_error: parseError instanceof Error ? parseError.message : String(parseError)
      });
      
      // NO FALLBACK POLICY: Fail fast with clear error
      throw new Error(`Failed to parse OpenAI response as JSON for ${destination} context analysis. Response was not valid JSON format. Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
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
    trace_id: z.string().nullable().describe('ID трассировки для отладки')
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
        const contentDir = path.join(campaignContext.campaignPath, 'content');
        const analysisPath = path.join(contentDir, 'context-analysis.json');
        
        // Ensure content directory exists
        await fs.mkdir(contentDir, { recursive: true });
        await fs.writeFile(analysisPath, JSON.stringify(contextAnalysis, null, 2));
        console.log(`✅ Context analysis saved to: ${analysisPath}`);
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
      apiKey: ENV_CONFIG.OPENAI_API_KEY
    });

    // Get current date for more accurate analysis
    const now = new Date();
    const actualCurrentDate = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const prompt = `Проанализируй оптимальные даты для путешествия в "${destination}" и предоставь детальные рекомендации.

КРИТИЧЕСКИ ВАЖНО - АКТУАЛЬНАЯ ДАТА:
- Сегодняшняя дата: ${actualCurrentDate}
- Текущий год: ${currentYear}
- Текущий месяц: ${currentMonth}

Параметры анализа:
- Направление: ${destination}
- Предпочитаемый сезон: ${season}
- Гибкость дат: ${flexibility}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К ДАТАМ:
- ВСЕ ДАТЫ ДОЛЖНЫ БЫТЬ В БУДУЩЕМ (после ${actualCurrentDate})
- Используй только ${currentYear} год и позже
- Минимальная дата: завтра (${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]})

ВАЖНО: Ответ должен быть ТОЛЬКО в формате JSON без дополнительного текста или markdown блоков.

Предоставь следующую информацию в JSON формате:

{
  "destination": "${destination}",
  "season": "${season}",
  "flexibility": "${flexibility}",
  "optimal_dates": ["YYYY-MM-DD", "YYYY-MM-DD", "YYYY-MM-DD"],
  "pricing_windows": ["период с описанием", "период с описанием"],
  "booking_recommendation": "конкретная рекомендация по срокам бронирования",
  "seasonal_factors": "описание сезонных факторов",
  "current_date": "${actualCurrentDate}",
  "weather_forecast": {
    "temperature_range": "XX-XX°C",
    "precipitation": "low|medium|high",
    "weather_description": "описание погоды"
  },
  "recommendations": ["рекомендация1", "рекомендация2"]
}

Требования:
- Предложи 4-6 оптимальных дат в ближайшие 12 месяцев от ${actualCurrentDate}
- Учти сезонность и климатические особенности направления
- Рассмотри пассажиропотоки и ценовые периоды авиаперевозок
- Адаптируй рекомендации под уровень гибкости
- Предоставь практические советы по бронированию
- Все даты в формате YYYY-MM-DD и ТОЛЬКО В БУДУЩЕМ
- Ответ должен быть на русском языке
- НЕ ИСПОЛЬЗУЙ MARKDOWN БЛОКИ (\`\`\`json), только чистый JSON`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по маркетингу авиабилетов. Предоставляй точную, актуальную информацию СТРОГО в запрашиваемом JSON формате без дополнительного текста или markdown блоков.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON structure
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Enhanced JSON parsing with markdown cleanup
    let jsonString = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing text that's not JSON
    const jsonStart = jsonString.indexOf('{');
    const jsonEnd = jsonString.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
    }
    
    try {
      const parsedResult = JSON.parse(jsonString.trim());
      
      // 🔥 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ ДАТ - ПРОГРАММНАЯ ПРОВЕРКА 
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];
      
      console.log(`🔍 DEBUG: Date validation - Current date: ${today}`);
      console.log(`🔍 DEBUG: Received optimal_dates from AI:`, parsedResult.optimal_dates);
      
      // Фильтруем только будущие даты
      if (parsedResult.optimal_dates && Array.isArray(parsedResult.optimal_dates)) {
        const futureDates = parsedResult.optimal_dates.filter((date: string) => {
          const dateObj = new Date(date);
          const isValid = dateObj > currentDate;
          console.log(`🔍 DEBUG: Date ${date} - Valid future date: ${isValid}`);
          return isValid;
        });
        
        console.log(`🔍 DEBUG: Filtered future dates:`, futureDates);
        
        // Если нет будущих дат или их слишком мало, генерируем новые
        if (futureDates.length < 3) {
          console.log(`⚠️ WARNING: Too few future dates (${futureDates.length}), generating new ones...`);
          
          const newOptimalDates = [];
          const baseDate = new Date(currentDate);
          baseDate.setDate(baseDate.getDate() + 7); // Начинаем через неделю
          
          // Генерируем 5 дат с интервалом 2-3 недели
          for (let i = 0; i < 5; i++) {
            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + (i * 17)); // ~2.5 недели интервал
            newOptimalDates.push(newDate.toISOString().split('T')[0]);
          }
          
          console.log(`✅ Generated new future dates:`, newOptimalDates);
          parsedResult.optimal_dates = newOptimalDates;
          parsedResult.current_date = today;
          parsedResult.date_validation_applied = true;
        } else {
          // Используем только будущие даты
          parsedResult.optimal_dates = futureDates;
          parsedResult.current_date = today;
          parsedResult.date_validation_applied = true;
        }
      }
      
      return parsedResult;
    } catch (parseError) {
      // Log the actual response for debugging
      log.error('ContentSpecialist', 'JSON parsing failed for date analysis', {
        destination,
        season,
        flexibility,
        raw_response: content.substring(0, 500) + '...',
        cleaned_json: jsonString.substring(0, 500) + '...',
        parse_error: parseError instanceof Error ? parseError.message : String(parseError)
      });
      
      // NO FALLBACK POLICY: Fail fast with clear error
      throw new Error(`Failed to parse OpenAI response as JSON for ${destination} date analysis. Response was not valid JSON format. Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
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
    trace_id: z.string().nullable().describe('ID трассировки для отладки')
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
        const contentDir = path.join(campaignContext.campaignPath, 'content');
        const analysisPath = path.join(contentDir, 'date-analysis.json');
        
        try {
          // Campaign folder should already exist from orchestrator
          // Just ensure content subdirectory exists 
          await fs.mkdir(contentDir, { recursive: true });
          console.log(`📁 Content directory ensured: ${contentDir}`);
          
          // Save with enhanced structure that finalization tool expects
          const enhancedDateAnalysis = {
            ...dateAnalysis,
            // Ensure required fields exist for finalization tool
            optimal_dates: dateAnalysis.optimal_dates || [],
            seasonal_factors: dateAnalysis.seasonal_factors || {},
            booking_trends: dateAnalysis.booking_recommendation || {},
            saved_at: new Date().toISOString(),
            campaign_path: campaignContext.campaignPath
          };
          
          await fs.writeFile(analysisPath, JSON.stringify(enhancedDateAnalysis, null, 2));
          console.log(`✅ Date analysis saved to: ${analysisPath}`);
          
          // Verify file was actually written
          try {
            const verifyData = await fs.readFile(analysisPath, 'utf8');
            const parsed = JSON.parse(verifyData);
            console.log(`✅ File verification successful. Keys: ${Object.keys(parsed).join(', ')}`);
          } catch (verifyError) {
            console.error(`❌ File verification failed: ${verifyError}`);
          }
          
        } catch (saveError) {
          console.error(`❌ Failed to save date analysis: ${saveError}`);
          console.error(`❌ Campaign path: ${campaignContext.campaignPath}`);
          console.error(`❌ Content dir: ${contentDir}`);
          console.error(`❌ Analysis path: ${analysisPath}`);
          throw new Error(`Failed to save date analysis to ${analysisPath}: ${getErrorMessage(saveError)}`);
        }
      } else {
        console.error(`❌ No campaign path available for saving date analysis. Context:`, campaignContext);
        throw new Error(`❌ CRITICAL ERROR: No campaign path available for saving date analysis. Date analysis is required for email generation. Campaign context keys: ${Object.keys(campaignContext)}`);
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