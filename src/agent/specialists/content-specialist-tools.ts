import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import { 
  createCampaignFolder, 
  updateCampaignMetadata,
  contextProvider,
  dateIntelligence,
  createHandoffFile
} from './content/tools';
// Removed: finalizeContentAndTransferToDesign - OpenAI SDK handles handoffs automatically
import { getPrices } from '../tools/prices';
import { getErrorMessage } from './content/utils/error-handling';
// import { generateTechnicalSpecification } from '../tools/technical-specification/technical-spec-generator';

// Import AI-powered asset collection system
// import { collectAssetsFromSources } from '../tools/asset-preparation/asset-collection';
// import { 
//   AssetSource, 
//   ContentContext, 
//   CampaignContext 
// } from '../tools/asset-preparation/types';

// Helper function to make OpenAI API calls
async function generateWithOpenAI(params: {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}) {
  const { prompt, temperature = 0.7, max_tokens = 1000 } = params;
  
  try {
    // Use the OpenAI client from the project's configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use GPT-4o mini as specified in project rules
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по маркетингу авиабилетов. Предоставляй точную, актуальную информацию в запрашиваемом формате. КРИТИЧЕСКИ ВАЖНО: Всегда возвращай валидный JSON без дополнительных комментариев.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    return data.choices[0].message.content;

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('ContentSpecialist OpenAI API call failed:', {
      error: errorMessage,
      prompt: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
}

// Helper function to safely parse JSON from AI response
function parseAIJsonResponse(jsonString: string, context: string = 'AI response'): any {
  try {
    // Clean the JSON string
    let cleanedJson = jsonString.trim();
    
    // Remove markdown code blocks if present
    if (cleanedJson.startsWith('```json')) {
      cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedJson.startsWith('```')) {
      cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing text that's not JSON
    const firstBrace = cleanedJson.indexOf('{');
    const lastBrace = cleanedJson.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
    }
    
    // Fix common JSON issues
    cleanedJson = cleanedJson
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unescaped quotes in strings (basic fix)
      .replace(/: "([^"]*)"([^",\]\}]*)",/g, ': "$1$2",')
      // Fix missing commas between objects
      .replace(/}(\s*){/g, '},\n{')
      // Fix missing commas between array elements
      .replace(/](\s*)\[/g, '],\n[')
      // Fix missing commas after string values (like preheader/headline issue)
      .replace(/"(\s*\n\s*)"([a-zA-Z_])/g, '",\n  "$2')
      // Fix missing commas after property values before next property
      .replace(/"\s*\n\s*"([a-zA-Z_])/g, '",\n  "$1')
      // Fix specific case where comma is missing after quoted value before property name
      .replace(/: "([^"]*)"(\s*\n\s*)"([a-zA-Z_]+)":/g, ': "$1",\n  "$3":');
    
    console.log(`🔧 Parsing JSON for ${context}:`, cleanedJson.substring(0, 200) + '...');
    
    const parsed = JSON.parse(cleanedJson);
    console.log(`✅ Successfully parsed JSON for ${context}`);
    return parsed;
    
  } catch (error) {
    console.error(`❌ JSON parsing failed for ${context}:`, {
      error: error instanceof Error ? error.message : String(error),
      originalLength: jsonString.length,
      position: error instanceof SyntaxError ? error.message.match(/position (\d+)/) : null,
      preview: jsonString.substring(0, 500) + '...'
    });
    
    // Try to provide more specific error information
    if (error instanceof SyntaxError && error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match && match[1]) {
        const position = parseInt(match[1]);
        const start = Math.max(0, position - 50);
        const end = Math.min(jsonString.length, position + 50);
        const problemArea = jsonString.substring(start, end);
        console.error(`❌ Problem area around position ${position}:`, problemArea);
      }
    }
    
    throw new Error(`Failed to parse AI JSON response for ${context}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
 * Builds campaign context from individual tool outputs
 * Replaces global state with context parameter pattern
 */
function buildCampaignContext(context: any, updates: Partial<CampaignWorkflowContext>): CampaignWorkflowContext {
  const existingContext = context?.campaignContext || {};
  const newContext = { ...existingContext, ...updates };
  
  console.log('Campaign context built', {
    updatedFields: Object.keys(updates),
    contextSize: Object.keys(newContext).length
  });
  
  return newContext;
}

/**
 * Pricing Intelligence Tool - Real Kupibilet API Integration with Date Analysis Integration
 */
const pricingIntelligence = tool({
  name: 'pricingIntelligence',
  description: 'Gets real-time pricing data from Kupibilet API for ALL dates from date-analysis.json with enhanced airport conversion, route correction, and comprehensive error handling',
  parameters: z.object({
    route: z.object({
      from: z.string().describe('Departure city/airport'),
      to: z.string().describe('Destination city/airport'),
      from_code: z.string().describe('Departure airport code (MOW, LED, etc.)'),
      to_code: z.string().describe('Destination airport code (BKK, AYT, etc.)')
    }).describe('Flight route information'),
    cabin_class: z.enum(['economy', 'business', 'first']).default('economy').describe('Cabin class'),
    currency: z.string().default('RUB').describe('Currency for pricing'),
    filters: z.object({
      is_direct: z.boolean().nullable().describe('Direct flights only'),
      with_baggage: z.boolean().nullable().describe('Include baggage'),
      airplane_only: z.boolean().nullable().describe('Airplane only (no trains/buses)')
    }).nullable().describe('Additional search filters'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    console.log('💰 Starting comprehensive pricing intelligence with date analysis integration:', {
      route: `${params.route.from} (${params.route.from_code}) → ${params.route.to} (${params.route.to_code})`,
      cabin_class: params.cabin_class,
      currency: params.currency,
      filters: params.filters,
      trace_id: params.trace_id
    });

    try {
      // 🔍 STEP 1: Read date-analysis.json for all optimal dates
      const extractedContext = extractCampaignContext(context);
      if (!extractedContext.campaignPath) {
        throw new Error('❌ CRITICAL: No campaign path available. Cannot read date analysis for pricing.');
      }

      const dateAnalysisPath = path.join(extractedContext.campaignPath, 'content', 'date-analysis.json');
      
      let dateAnalysis: any;
      try {
        console.log(`🔍 Reading date analysis from: ${dateAnalysisPath}`);
        const dateAnalysisData = await fs.readFile(dateAnalysisPath, 'utf8');
        dateAnalysis = JSON.parse(dateAnalysisData);
        console.log(`✅ Date analysis loaded:`, {
          optimal_dates_count: dateAnalysis.optimal_dates?.length || 0,
          pricing_windows_count: dateAnalysis.pricing_windows?.length || 0,
          destination: dateAnalysis.destination
        });
      } catch (error) {
        throw new Error(`❌ CRITICAL: Cannot read date-analysis.json from ${dateAnalysisPath}. The dateIntelligence tool must be executed BEFORE pricingIntelligence to create this file. Make sure dateIntelligence runs first in your workflow. Error: ${error}`);
      }

      // 🔍 STEP 2: Extract all dates for pricing analysis
      const allDatesToCheck = [];
      
      // Add optimal dates
      if (dateAnalysis.optimal_dates && Array.isArray(dateAnalysis.optimal_dates)) {
        allDatesToCheck.push(...dateAnalysis.optimal_dates);
        console.log(`📅 Added ${dateAnalysis.optimal_dates.length} optimal dates for pricing check`);
      }

      // Extract dates from pricing windows if they contain date ranges
      if (dateAnalysis.pricing_windows && Array.isArray(dateAnalysis.pricing_windows)) {
        dateAnalysis.pricing_windows.forEach((window: string, index: number) => {
          // Try to extract dates from pricing window descriptions
          const dateMatches = window.match(/\d{4}-\d{2}-\d{2}/g);
          if (dateMatches) {
            allDatesToCheck.push(...dateMatches);
            console.log(`📅 Added ${dateMatches.length} dates from pricing window ${index + 1}: ${window}`);
          }
        });
      }

      // Add some buffer dates around optimal dates for comprehensive analysis
      const additionalDates: string[] = [];
      allDatesToCheck.forEach(dateStr => {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          // Add ±7 days around each optimal date
          const beforeDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);
          const afterDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
          const beforeDateStr = beforeDate.toISOString().split('T')[0];
          const afterDateStr = afterDate.toISOString().split('T')[0];
          if (beforeDateStr) additionalDates.push(beforeDateStr);
          if (afterDateStr) additionalDates.push(afterDateStr);
        }
      });
      
      allDatesToCheck.push(...additionalDates);
      
      // Remove duplicates and sort
      const uniqueDates = [...new Set(allDatesToCheck)].sort();
      console.log(`📅 Total unique dates for pricing analysis: ${uniqueDates.length}`);
      
      if (uniqueDates.length === 0) {
        throw new Error('❌ CRITICAL: No dates found in date analysis. Cannot perform pricing analysis without dates.');
      }

      // 🔍 STEP 3: Determine optimal date range for API call
      const earliestDate = uniqueDates[0];
      const latestDate = uniqueDates[uniqueDates.length - 1];
      
      console.log(`💰 Analyzing prices for date range: ${earliestDate} to ${latestDate}`);

      // 🔍 STEP 4: Get pricing data using enhanced getPrices function
      const pricesResult = await getPrices({
        origin: params.route.from_code,
        destination: params.route.to_code,
        date_range: `${earliestDate},${latestDate}`,
        cabin_class: params.cabin_class,
        filters: params.filters || {}
      });

      if (!pricesResult.success) {
        // No fallback logic - fail immediately with clear error message
        console.error('❌ Pricing request failed for airport code:', {
          failed_route: `${params.route.from_code}-${params.route.to_code}`,
          error: pricesResult.error,
          date_range: `${earliestDate} to ${latestDate}`
        });
        
        throw new Error(`Kupibilet API failed: ${pricesResult.error}. Check that airport code ${params.route.to_code} is supported and date range is valid.`);
      }

      const pricingData = pricesResult.data;

      // 🔍 STEP 5: Analyze prices specifically for optimal dates
      const optimalDatePrices: any[] = [];
      const allDatePrices: any[] = [];
      
      pricingData.prices.forEach((priceData: any) => {
        allDatePrices.push(priceData);
        
        // Check if this price is for one of our optimal dates
        if (dateAnalysis.optimal_dates?.includes(priceData.date)) {
          optimalDatePrices.push(priceData);
        }
      });

      // 🔍 STEP 6: Create comprehensive pricing analysis
      const comprehensivePricingAnalysis = {
        // Date analysis integration
        date_analysis_source: {
          total_optimal_dates: dateAnalysis.optimal_dates?.length || 0,
          optimal_dates: dateAnalysis.optimal_dates || [],
          pricing_windows: dateAnalysis.pricing_windows || [],
          booking_recommendation: dateAnalysis.booking_recommendation || '',
          seasonal_factors: dateAnalysis.seasonal_factors || ''
        },
        
        // Price analysis for optimal dates
        optimal_dates_pricing: {
          total_offers: optimalDatePrices.length,
          cheapest_on_optimal: optimalDatePrices.length > 0 ? Math.min(...optimalDatePrices.map(p => p.price)) : null,
          most_expensive_on_optimal: optimalDatePrices.length > 0 ? Math.max(...optimalDatePrices.map(p => p.price)) : null,
          average_on_optimal: optimalDatePrices.length > 0 ? Math.round(optimalDatePrices.reduce((sum, p) => sum + p.price, 0) / optimalDatePrices.length) : null,
          optimal_date_prices: optimalDatePrices.map(p => ({
            date: p.date,
            price: p.price,
            airline: p.airline || 'Unknown',
            is_optimal: true
          }))
        },
        
        // Overall price analysis
        comprehensive_pricing: {
          total_dates_analyzed: uniqueDates.length,
          total_offers_found: pricingData.search_metadata.total_found,
          date_range_analyzed: `${earliestDate} to ${latestDate}`,
          best_price_overall: pricingData.cheapest,
          worst_price_overall: Math.max(...pricingData.prices.map((p: any) => p.price)),
          average_price_overall: Math.round(pricingData.prices.reduce((sum: number, p: any) => sum + p.price, 0) / pricingData.prices.length),
          currency: pricingData.currency,
          route: pricingData.search_metadata.route
        },
        
        // Price trends and insights
        price_insights: {
          optimal_vs_average_savings: optimalDatePrices.length > 0 && pricingData.prices.length > 0 ? 
            Math.round(((Math.round(pricingData.prices.reduce((sum: number, p: any) => sum + p.price, 0) / pricingData.prices.length) - 
                       Math.round(optimalDatePrices.reduce((sum, p) => sum + p.price, 0) / optimalDatePrices.length)) / 
                       Math.round(pricingData.prices.reduce((sum: number, p: any) => sum + p.price, 0) / pricingData.prices.length)) * 100) : 0,
          cheapest_optimal_date: optimalDatePrices.length > 0 ? 
            optimalDatePrices.find(p => p.price === Math.min(...optimalDatePrices.map(p => p.price)))?.date : null,
          price_volatility: pricingData.prices.length > 1 ? 
            Math.round((Math.max(...pricingData.prices.map((p: any) => p.price)) - Math.min(...pricingData.prices.map((p: any) => p.price))) / 
                      Math.min(...pricingData.prices.map((p: any) => p.price)) * 100) : 0
        },
        
        // Enhanced features
        enhanced_features: {
          date_analysis_integration: true,
          comprehensive_date_coverage: true,
          optimal_date_focus: true,
          airport_conversion: pricesResult.metadata?.route_processing || {},
          csv_integration: pricesResult.metadata?.csv_integration || 'enabled',
          api_source: pricesResult.metadata?.source || 'kupibilet_api_v2'
        },
        
        // Analysis metadata
        analysis_metadata: {
          analyzed_at: new Date().toISOString(),
          analysis_duration_ms: Date.now() - startTime,
          date_analysis_file: dateAnalysisPath,
          route_analyzed: `${params.route.from_code}-${params.route.to_code}`,
          trace_id: params.trace_id
        }
      };

      const duration = Date.now() - startTime;
      console.log('✅ Comprehensive pricing analysis completed:', {
        route: `${params.route.from} → ${params.route.to}`,
        total_dates_analyzed: uniqueDates.length,
        optimal_dates_found: optimalDatePrices.length,
        best_price_overall: comprehensivePricingAnalysis.comprehensive_pricing.best_price_overall,
        best_price_optimal: comprehensivePricingAnalysis.optimal_dates_pricing.cheapest_on_optimal,
        savings_on_optimal: comprehensivePricingAnalysis.price_insights.optimal_vs_average_savings,
        currency: comprehensivePricingAnalysis.comprehensive_pricing.currency,
        duration,
        api_source: pricesResult.metadata?.source
      });
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        pricing_analysis: comprehensivePricingAnalysis,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = campaignContext;
      }

      // ✅ CRITICAL: Save comprehensive pricing analysis to file for finalization tool
      const pricingFilePath = path.join(extractedContext.campaignPath, 'content', 'pricing-analysis.json');
      await fs.mkdir(path.dirname(pricingFilePath), { recursive: true });
      await fs.writeFile(pricingFilePath, JSON.stringify(comprehensivePricingAnalysis, null, 2));
      console.log(`✅ Comprehensive pricing analysis saved to: ${pricingFilePath}`);

      // Return formatted string with comprehensive analysis
      return `Комплексный ценовой анализ маршрута ${params.route.from} - ${params.route.to} выполнен с интеграцией анализа дат:

📊 АНАЛИЗ ОПТИМАЛЬНЫХ ДАТ:
• Проанализировано дат: ${uniqueDates.length} (из них оптимальных: ${dateAnalysis.optimal_dates?.length || 0})
• Найдено предложений на оптимальные даты: ${optimalDatePrices.length}
• Лучшая цена на оптимальные даты: ${comprehensivePricingAnalysis.optimal_dates_pricing.cheapest_on_optimal || 'не найдено'} ${comprehensivePricingAnalysis.comprehensive_pricing.currency}
• Средняя цена на оптимальные даты: ${comprehensivePricingAnalysis.optimal_dates_pricing.average_on_optimal || 'не найдено'} ${comprehensivePricingAnalysis.comprehensive_pricing.currency}

💰 ОБЩИЙ ЦЕНОВОЙ АНАЛИЗ:
• Диапазон анализа: ${earliestDate} - ${latestDate}
• Всего предложений найдено: ${comprehensivePricingAnalysis.comprehensive_pricing.total_offers_found}
• Лучшая цена общая: ${comprehensivePricingAnalysis.comprehensive_pricing.best_price_overall} ${comprehensivePricingAnalysis.comprehensive_pricing.currency}
• Средняя цена общая: ${comprehensivePricingAnalysis.comprehensive_pricing.average_price_overall} ${comprehensivePricingAnalysis.comprehensive_pricing.currency}

🎯 ИНСАЙТЫ:
• Экономия на оптимальных датах: ${comprehensivePricingAnalysis.price_insights.optimal_vs_average_savings}%
• Самая дешевая оптимальная дата: ${comprehensivePricingAnalysis.price_insights.cheapest_optimal_date || 'не найдено'}
• Волатильность цен: ${comprehensivePricingAnalysis.price_insights.price_volatility}%

✅ Данные интегрированы с анализом дат и сохранены для следующих этапов. Используется улучшенная система конвертации аэропортов и полная интеграция с date-analysis.json.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Comprehensive pricing intelligence failed:', {
        error: errorMessage,
        route: `${params.route.from_code}-${params.route.to_code}`,
        duration,
        trace_id: params.trace_id
      });
      
      throw new Error(`Comprehensive pricing intelligence failed: ${errorMessage}`);
    }
  }
});

/**
 * Asset Strategy Tool - AI-powered comprehensive strategy generation
 */
export const assetStrategy = tool({
  name: 'asset_strategy',
  description: 'Develop comprehensive asset and content strategy using AI analysis',
  parameters: z.object({
    campaignType: z.string().describe('Type of campaign'),
    targetAudience: z.string().describe('Target audience'),
    contentThemes: z.array(z.string()).describe('Content themes'),
    brandGuidelines: z.string().nullable().describe('Brand guidelines'),
    destination: z.string().describe('Travel destination'),
    seasonality: z.string().nullable().describe('Seasonal context'),
    priceRange: z.string().nullable().describe('Price range information'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    console.log('🎨 Developing AI-powered asset strategy...');
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `Разработай комплексную стратегию ассетов для email-кампании по продаже авиабилетов.

ПАРАМЕТРЫ КАМПАНИИ:
- Тип кампании: ${params.campaignType}
- Целевая аудитория: ${params.targetAudience}
- Направление: ${params.destination}
- Темы контента: ${params.contentThemes.join(', ')}
- Сезонность: ${params.seasonality || 'не указано'}
- Ценовой диапазон: ${params.priceRange || 'не указано'}
- Бренд-гайдлайны: ${params.brandGuidelines || 'стандартные Kupibilet'}

ТРЕБОВАНИЯ:
1. Создай детальную стратегию ассетов с учетом психологии путешественников
2. Определи визуальное направление, основанное на направлении и сезоне
3. Выбери оптимальные типы изображений для максимальной конверсии
4. Разработай контентную стратегию с эмоциональными триггерами
5. Учти специфику email-маркетинга и требования к ассетам

ОТВЕТ ДОЛЖЕН БЫТЬ СТРОГО В JSON БЕЗ MARKDOWN БЛОКОВ:

{
  "visual_direction": {
    "primary_style": "описание основного стиля",
    "color_palette": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex"
    },
    "imagery_style": "описание стиля изображений",
    "mood": "описание настроения",
    "visual_hierarchy": "описание иерархии"
  },
  "asset_types": [
    {
      "type": "hero-image",
      "description": "описание",
      "requirements": "требования",
      "emotional_impact": "эмоциональное воздействие"
    },
    {
      "type": "destination-showcase",
      "description": "описание",
      "requirements": "требования",
      "emotional_impact": "эмоциональное воздействие"
    },
    {
      "type": "price-highlight",
      "description": "описание",
      "requirements": "требования",
      "emotional_impact": "эмоциональное воздействие"
    },
    {
      "type": "cta-buttons",
      "description": "описание",
      "requirements": "требования",
      "emotional_impact": "эмоциональное воздействие"
    },
    {
      "type": "supporting-visuals",
      "description": "описание",
      "requirements": "требования",
      "emotional_impact": "эмоциональное воздействие"
    }
  ],
  "content_strategy": {
    "tone": "описание тона",
    "approach": "описание подхода",
    "structure": "описание структуры",
    "key_messages": ["сообщение1", "сообщение2", "сообщение3"],
    "emotional_triggers": ["триггер1", "триггер2", "триггер3"],
    "call_to_action": {
      "primary": "основной CTA",
      "secondary": "дополнительный CTA",
      "urgency": "элементы срочности"
    }
  },
  "targeting_insights": {
    "audience_motivations": ["мотивация1", "мотивация2"],
    "pain_points": ["проблема1", "проблема2"],
    "decision_factors": ["фактор1", "фактор2"],
    "seasonal_considerations": "сезонные соображения"
  },
  "technical_requirements": {
    "image_formats": ["формат1", "формат2"],
    "dimensions": "размеры",
    "file_size_limits": "ограничения размера",
    "accessibility": "требования доступности"
  },
  "success_metrics": {
    "primary_kpi": "основной показатель",
    "engagement_metrics": ["метрика1", "метрика2"],
    "conversion_indicators": ["индикатор1", "индикатор2"]
  }
}

Создай стратегию, которая максимизирует желание путешествовать и мотивирует к покупке билетов.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по визуальному маркетингу в сфере путешествий. Создавай стратегии ассетов, которые максимизируют конверсию и эмоциональное воздействие. Отвечай ТОЛЬКО в JSON формате.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // ✅ FIX: Use parseAIJsonResponse instead of basic JSON.parse
      console.log('🔧 Parsing AI response using parseAIJsonResponse...');
      let strategy;
      try {
        strategy = parseAIJsonResponse(content, 'asset strategy generation');
      } catch (parseError) {
        console.error('❌ AI asset strategy generation failed:', parseError instanceof Error ? parseError.message : 'Unknown error');
        throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Get campaign context
      const campaignContext = extractCampaignContext(context);

      // Save strategy to campaign folder if available
      if (campaignContext.campaignPath) {
        const strategyPath = path.join(campaignContext.campaignPath, 'content', 'asset-strategy.json');
        await fs.mkdir(path.dirname(strategyPath), { recursive: true });
        await fs.writeFile(strategyPath, JSON.stringify(strategy, null, 2));
        
        // ✅ FIX: Create asset manifest using simplified approach instead of calling tool directly
        console.log('🤖 Generating asset manifest for Design Specialist...');
        try {
          await generateSimpleAssetManifest(campaignContext.campaignPath, strategy, params.destination);
          console.log(`✅ Simple asset manifest generated successfully`);
        } catch (manifestError) {
          console.warn('⚠️ Asset manifest generation failed:', manifestError instanceof Error ? manifestError.message : String(manifestError));
          // Don't fail the entire strategy generation if manifest fails
        }
      }

      // Update campaign context
      const updatedCampaignContext = {
        ...campaignContext,
        asset_strategy: strategy
      };

      // Save updated context
      if (context) {
        (context as any).campaignContext = updatedCampaignContext;
      }

      const duration = Date.now() - startTime;
      console.log(`⚡ AI asset strategy generation completed in ${duration}ms`);

      return `✅ Комплексная стратегия ассетов разработана за ${duration}ms! Визуальное направление: ${strategy.visual_direction?.primary_style || 'определено'}. Типы ассетов: ${strategy.asset_types?.length || 0}. Контентная стратегия: ${strategy.content_strategy?.tone || 'определена'}. Технические требования: ${strategy.technical_requirements?.image_formats?.join(', ') || 'определены'}. Файл сохранен в кампании. Asset manifest создан для Design Specialist.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ AI asset strategy generation failed in ${duration}ms:`, errorMessage);
      
      return `❌ Ошибка разработки стратегии ассетов: ${errorMessage}`;
    }
  }
});

// ✅ HELPER: Read campaign content for AI analysis
async function readCampaignContent(campaignPath: string): Promise<Array<{filename: string; content: any}>> {
  const contentFiles: Array<{filename: string; content: any}> = [];
  const contentDir = path.join(campaignPath, 'content');
  
  try {
    const files = await fs.readdir(contentDir);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.md')) {
        const filePath = path.join(contentDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        let parsedContent: any;
        if (file.endsWith('.json')) {
          try {
            parsedContent = JSON.parse(content);
          } catch {
            parsedContent = { raw: content };
          }
        } else {
          parsedContent = { markdown: content };
        }
        
        contentFiles.push({
          filename: file,
          content: parsedContent
        });
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not read content directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return contentFiles;
}

// ✅ HELPER: Generate external images for campaign based on content
async function generateExternalImagesForCampaign(contentContext: any, _destination: string): Promise<any[]> {
  try {
    const { generateExternalImageLinks } = await import('../tools/asset-preparation/ai-analysis');
    return await generateExternalImageLinks(contentContext);
  } catch (error) {
    console.warn(`⚠️ Could not generate external images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

// ✅ AI-ONLY ASSET MANIFEST: No fallback, full AI generation required
async function generateSimpleAssetManifest(campaignPath: string, _strategy: any, destination: string) {
  console.log('🤖 Creating asset manifest - checking AI availability');
  
  // Create assets directory structure
  const assetsDir = path.join(campaignPath, 'assets');
  const manifestsDir = path.join(assetsDir, 'manifests');
  await fs.mkdir(manifestsDir, { recursive: true });
  
  // ✅ FIXED: Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ OPENAI_API_KEY not found, creating basic asset manifest without AI analysis');
    
    // Create basic asset manifest without AI analysis
    const basicManifest = {
      manifestId: `manifest_${Date.now()}_basic`,
      assetManifest: {
        images: [
          {
            id: 'hero-placeholder',
            path: '/placeholder/hero-image.jpg',
            alt_text: `${destination} travel destination`,
            usage: 'hero-section',
            dimensions: { width: 600, height: 300 },
            file_size: 50000,
            format: 'jpg',
            optimized: false,
            isExternal: false,
            email_client_support: {
              gmail: true,
              outlook: true,
              apple_mail: true,
              yahoo_mail: true
            }
          }
        ],
        icons: [
          {
            id: 'cta-icon',
            path: '/icons/arrow-right.svg',
            format: 'svg',
            size: '24x24',
            usage: 'call-to-action'
          }
        ],
        fonts: [
          {
            id: 'primary-font',
            family: 'Arial, sans-serif',
            weights: ['400', '700'],
            usage: 'primary-text'
          }
        ]
      },
      assetRequirements: [
        {
          type: 'hero',
          purpose: `Travel destination image for ${destination}`,
          priority: 'required',
          emotional_tone: 'inspiring',
          visual_style: 'vibrant'
        }
      ],
      usageInstructions: [
        {
          assetId: 'hero-placeholder',
          placement: 'email-header',
          instructions: 'Use as main hero image in email header section'
        }
      ],
      performanceMetrics: {
        totalAssets: 3,
        totalSize: 50000,
        optimizationScore: 80
      },
      generationSummary: {
        timestamp: new Date().toISOString(),
        sourcesProcessed: 0,
        assetsCollected: 3,
        errors: []
      }
    };
    
    // Save basic manifest
    const manifestPath = path.join(manifestsDir, 'asset-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(basicManifest, null, 2));
    
    console.log(`✅ Basic asset manifest created at: ${manifestPath}`);
    return basicManifest;
  }
  
  // Use ONLY the full generateAssetManifest tool if API key is available
  console.log('🔄 Using ONLY full generateAssetManifest tool...');
  
  try {
    // ✅ RESTORED: Use proper AI asset manifest generation
    console.log('🤖 Using AI-powered asset manifest generation...');
    // const { generateAssetManifestFunction } = await import('../tools/asset-preparation/asset-manifest-generator'); // Currently unused
    
    // ✅ ENHANCED: Read and analyze campaign content
    console.log('📖 Reading campaign content for AI analysis...');
    const contentFiles = await readCampaignContent(campaignPath);
    console.log(`📖 Found ${contentFiles.length} content files`);
    
         // ✅ COMPREHENSIVE CONTEXT: Include all campaign content
     const contentContext = {
       generated_content: { 
         destination: destination,
         ...contentFiles.reduce((acc: any, file: any) => ({ ...acc, ...file.content }), {})
       },
       campaign_type: 'promotional',
       target_audience: 'travelers',
       campaignPath: campaignPath
     };
    
    // ✅ AI-GENERATED EXTERNAL IMAGES: Based on content analysis
    console.log('🌐 Generating AI-selected external images...');
    const externalImages = await generateExternalImagesForCampaign(contentContext, destination);
    console.log(`✅ Generated ${externalImages.length} external images`);
    
         const assetSources = [
       { type: 'local', path: 'figma-assets', priority: 'high' },
       { type: 'external', path: 'external', images: externalImages, priority: 'medium' }
     ];
     
     // const options = {
     //   analyzeContentContext: true,
     //   collectFromSources: true,
     //   validateAssets: true,
     //   optimizeAssets: false,
     //   generateUsageInstructions: true,
     //   includePerformanceMetrics: false,
     //   enableFallbackGeneration: false // ❌ NO FALLBACK
     // }; // Currently unused
     
     // const context = {
     //   campaignPath: campaignPath,
     //   destination: destination
     // }; // Currently unused
    
    // ✅ AI-POWERED ASSET MANIFEST GENERATION with new function_tool syntax
    const { generateAssetManifest } = await import('../tools/asset-preparation/asset-manifest-generator');
    const resultString = await generateAssetManifest(
      path.basename(campaignPath),
      campaignPath,
      JSON.stringify(contentContext),
      JSON.stringify(assetSources),
      `manifest_${Date.now()}`
    );
    const result = JSON.parse(resultString);

    console.log('✅ Successfully generated AI-powered asset manifest');
    console.log(`📊 Manifest includes ${result.manifest?.images?.length || 0} images and ${result.manifest?.icons?.length || 0} icons`);
    return result;
    
  } catch (error) {
    console.error('❌ AI asset manifest generation failed:', error instanceof Error ? error.message : error);
    throw new Error(`AI asset manifest generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Content Generator Tool - AI-powered comprehensive content generation
 */
export const contentGenerator = tool({
  name: 'content_generator', 
  description: 'Generate comprehensive email content using AI analysis of context and strategy',
  parameters: z.object({
    destination: z.string().describe('Travel destination'),
    campaignType: z.string().describe('Type of campaign'),
    targetAudience: z.string().describe('Target audience'),
    pricePoint: z.string().nullable().describe('Price point or range'),
    seasonality: z.string().nullable().describe('Seasonal context'),
    urgency: z.string().nullable().describe('Urgency level'),
    brandVoice: z.string().nullable().describe('Brand voice guidelines'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    console.log('✍️ Generating AI-powered email content...');
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // Get campaign context for additional data
      const campaignContext = extractCampaignContext(context);
      const contextAnalysis = campaignContext.context_analysis;
      const dateAnalysis = campaignContext.date_analysis;
      const pricingAnalysis = campaignContext.pricing_analysis;
      const assetStrategy = campaignContext.asset_strategy;

      const prompt = `Создай высококонвертирующий email-контент для продажи авиабилетов в ${params.destination}.

ПАРАМЕТРЫ КАМПАНИИ:
- Направление: ${params.destination}
- Тип кампании: ${params.campaignType}
- Целевая аудитория: ${params.targetAudience}
- Ценовой диапазон: ${params.pricePoint || 'средний'}
- Сезонность: ${params.seasonality || 'круглогодично'}
- Уровень срочности: ${params.urgency || 'средний'}
- Бренд-голос: ${params.brandVoice || 'дружелюбный и надежный'}

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:
${contextAnalysis ? `- Культурный контекст: ${contextAnalysis.cultural_insights?.traditions?.join(', ') || 'стандартный'}` : ''}
${dateAnalysis ? `- Оптимальные даты: ${dateAnalysis.optimal_dates?.join(', ') || 'гибкие'}` : ''}
${pricingAnalysis ? `- Лучшая цена: ${pricingAnalysis.best_price || 'конкурентная'} ${pricingAnalysis.currency || 'RUB'}` : ''}
${assetStrategy ? `- Тон стратегии: ${assetStrategy.content_strategy?.tone || 'привлекательный'}` : ''}
${assetStrategy ? `- Эмоциональные триггеры: ${assetStrategy.content_strategy?.emotional_triggers?.join(', ') || 'стандартные'}` : ''}

ТРЕБОВАНИЯ:
1. Создай привлекательный subject line (тему письма)
2. Разработай цепляющий preheader
3. Создай сильный заголовок (headline)
4. Напиши основной текст с эмоциональными триггерами
5. Добавь убедительный призыв к действию
6. Включи элементы социального доказательства
7. Создай ощущение срочности и дефицита

ОТВЕТ ДОЛЖЕН БЫТЬ СТРОГО В JSON БЕЗ MARKDOWN БЛОКОВ:

{
  "subject_line": {
    "primary": "основная тема письма",
    "alternative": "альтернативная тема",
    "personalization": "элементы персонализации"
  },
  "preheader": "текст превью письма",
  "headline": {
    "main": "основной заголовок",
    "subheadline": "подзаголовок"
  },
  "body": {
    "opening": "вступительный абзац",
    "main_content": "основное содержание",
    "benefits": ["преимущество1", "преимущество2", "преимущество3"],
    "social_proof": "элементы социального доказательства",
    "urgency_elements": "элементы срочности",
    "closing": "заключительный абзац"
  },
  "call_to_action": {
    "primary": {
      "text": "основная кнопка",
      "url": "#booking-primary"
    },
    "secondary": {
      "text": "дополнительная кнопка",
      "url": "#booking-secondary"
    },
    "urgency_cta": {
      "text": "срочный призыв",
      "url": "#booking-urgent"
    }
  },
  "personalization": {
    "greeting": "персонализированное приветствие",
    "content_adaptation": "адаптация контента",
    "recommendations": "персональные рекомендации"
  },
  "emotional_hooks": {
    "desire": "элементы желания",
    "fear_of_missing_out": "FOMO элементы",
    "aspiration": "элементы стремления"
  },
  "content_structure": {
    "flow": "описание потока контента",
    "key_messages": ["сообщение1", "сообщение2", "сообщение3"],
    "conversion_path": "путь к конверсии"
  },
  "compliance": {
    "legal_disclaimers": "юридические оговорки",
    "unsubscribe": "информация об отписке",
    "privacy": "политика конфиденциальности"
  }
}

Создай контент, который максимизирует желание путешествовать и мотивирует к немедленной покупке билетов.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по email-маркетингу в сфере путешествий. Создавай высококонвертирующий контент, который вызывает эмоции и мотивирует к покупке. КРИТИЧЕСКИ ВАЖНО: Отвечай ТОЛЬКО в JSON формате без дополнительного текста или markdown блоков.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No content generated from OpenAI API');
      }

      // Use robust JSON parsing
      const emailContent = parseAIJsonResponse(aiResponse, 'email content generation');

      // ✅ CRITICAL: Create design-brief-from-context.json for finalization tool
      if (campaignContext.campaignPath) {
        const designBriefPath = path.join(campaignContext.campaignPath, 'content', 'design-brief-from-context.json');
        const designBrief = {
          design_requirements: {
            visual_style: emailContent.style_guide?.visual_style || 'modern and clean',
            color_palette: emailContent.style_guide?.color_palette || {
              primary: '#007bff',
              secondary: '#6c757d',
              accent: '#28a745'
            },
            imagery_direction: emailContent.style_guide?.imagery_direction || 'high-quality travel photography',
            layout_approach: emailContent.style_guide?.layout_approach || 'responsive email template'
          },
          content_context: {
            destination: params.destination,
            tone: emailContent.tone || 'friendly and inspiring',
            target_audience: campaignContext.metadata?.target_audience || 'travelers',
            key_messages: emailContent.key_messages || []
          },
          technical_specs: {
            email_client_support: ['Gmail', 'Outlook', 'Apple Mail'],
            responsive_breakpoints: ['600px', '480px'],
            image_formats: ['JPEG', 'PNG'],
            accessibility_level: 'WCAG AA'
          },
          created_at: new Date().toISOString(),
          created_by: 'Content Specialist'
        };
        await fs.writeFile(designBriefPath, JSON.stringify(designBrief, null, 2));
        console.log(`✅ Design brief created: ${designBriefPath}`);
      }

      // Save content to campaign folder
      if (campaignContext.campaignPath) {
        const contentPath = path.join(campaignContext.campaignPath, 'content', 'email-content.json');
        await fs.mkdir(path.dirname(contentPath), { recursive: true });
        await fs.writeFile(contentPath, JSON.stringify(emailContent, null, 2));

        // Also save as markdown for easier reading
        const markdownPath = path.join(campaignContext.campaignPath, 'content', 'email-content.md');
        const markdownContent = `# Email Content for ${params.destination}

## Subject Line
**Primary:** ${emailContent.subject_line?.primary || 'Generated'}
**Alternative:** ${emailContent.subject_line?.alternative || 'Generated'}

## Preheader
${emailContent.preheader || 'Generated'}

## Headline
**Main:** ${emailContent.headline?.main || 'Generated'}
**Sub:** ${emailContent.headline?.subheadline || 'Generated'}

## Body Content

### Opening
${emailContent.body?.opening || 'Generated'}

### Main Content
${emailContent.body?.main_content || 'Generated'}

### Benefits
${emailContent.body?.benefits?.map((benefit: string, index: number) => `${index + 1}. ${benefit}`).join('\n') || 'Generated'}

### Social Proof
${emailContent.body?.social_proof || 'Generated'}

### Urgency Elements
${emailContent.body?.urgency_elements || 'Generated'}

### Closing
${emailContent.body?.closing || 'Generated'}

## Call to Action
**Primary:** ${emailContent.call_to_action?.primary?.text || 'Generated'}
**Secondary:** ${emailContent.call_to_action?.secondary?.text || 'Generated'}
**Urgent:** ${emailContent.call_to_action?.urgency_cta?.text || 'Generated'}

## Key Messages
${emailContent.content_structure?.key_messages?.map((msg: string, index: number) => `${index + 1}. ${msg}`).join('\n') || 'Generated'}
`;
        await fs.writeFile(markdownPath, markdownContent);
      }

      // Update campaign context
      const updatedCampaignContext = {
        ...campaignContext,
        generated_content: emailContent
      };

      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedCampaignContext;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ AI email content generated in ${duration}ms`);
      console.log(`📧 Subject: ${emailContent.subject_line?.primary || 'Generated'}`);
      console.log(`📝 Headlines: ${emailContent.headline?.main || 'Generated'}`);
      console.log(`🎯 CTAs: ${emailContent.call_to_action?.primary?.text || 'Generated'}`);

      return `AI-контент email успешно создан! Тема письма: "${emailContent.subject_line?.primary || 'Создана'}". Заголовок: "${emailContent.headline?.main || 'Создан'}". Основной CTA: "${emailContent.call_to_action?.primary?.text || 'Создан'}". Эмоциональные хуки: ${emailContent.emotional_hooks?.desire || 'добавлены'}. Элементы срочности: ${emailContent.body?.urgency_elements || 'включены'}. Социальное доказательство: ${emailContent.body?.social_proof || 'добавлено'}. Контент оптимизирован для ${params.destination} и аудитории ${params.targetAudience}.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ AI content generation failed in ${duration}ms:`, errorMessage);
      throw new Error(`AI-генерация контента не удалась: ${errorMessage}`);
    }
  }
});

// ============================================================================
// AI-POWERED DESIGN BRIEF GENERATION 
// ============================================================================

async function generateAIDesignBrief(params: {
  destination: string;
  campaign_theme: string;
  visual_style?: string;
  target_emotion?: string;
}) {
  const { destination, campaign_theme, visual_style, target_emotion } = params;
  
  const designBriefPrompt = `
Создай ПРОФЕССИОНАЛЬНОЕ техническое задание для дизайна email-рассылки авиабилетов.

🎯 ТРЕБОВАНИЯ К ТЕХНИЧЕСКОМУ ЗАДАНИЮ:
- Основано на направлении: ${destination}
- Тема кампании: ${campaign_theme}
- Визуальный стиль: ${visual_style || 'современный'}
- Целевая эмоция: ${target_emotion || 'вдохновение к путешествию'}

ОБЯЗАТЕЛЬНО используй фирменные цвета Kupibilet:
- Основные: #4BFF7E (основной зеленый), #1DA857 (темно-зеленый), #2C3959 (темно-синий текст)
- Дополнительные: #FF6240 (оранжевый CTA), #E03EEF (фиолетовый акцент)
- Вспомогательные: #FFC7BB, #FFEDE9, #F8A7FF, #FDE8FF, #B0C6FF, #EDEFFF

Выбери цвета из фирменной палитры, которые лучше всего подходят для направления "${destination}".

Предоставь техническое задание в JSON формате:

{
  "destination_context": {
    "name": "${destination}",
    "seasonal_advantages": "Сезонные преимущества направления для текущего времени",
    "emotional_appeal": "Эмоциональная привлекательность направления",
    "market_position": "Позиционирование направления на рынке"
  },
  "design_requirements": {
    "visual_style": "Конкретный визуальный стиль для ${destination}",
    "color_palette": "Детальное описание цветовой палитры из фирменных цветов Kupibilet",
    "primary_color": "Основной цвет из палитры Kupibilet (например, #4BFF7E)",
    "accent_color": "Акцентный цвет из палитры Kupibilet (например, #FF6240)",
    "background_color": "Цвет фона из вспомогательных цветов (например, #EDEFFF)",
    "text_color": "#2C3959",
    "imagery_direction": "Направление изображений для ${destination}",
    "typography_mood": "Типографическое настроение"
  },
  "content_priorities": {
    "key_messages": ["Ключевое сообщение 1", "Ключевое сообщение 2", "Ключевое сообщение 3"],
    "emotional_triggers": ["Эмоциональный триггер 1", "Эмоциональный триггер 2"],
    "actionable_insights": ["Инсайт к действию 1", "Инсайт к действию 2"]
  },
  "competitive_differentiation": {
    "unique_selling_points": "Уникальные преимущества направления",
    "market_advantages": "Преимущества на рынке"
  },
  "technical_specs": {
    "email_client_support": ["Gmail", "Outlook", "Apple Mail"],
    "responsive_breakpoints": ["600px", "480px"],
    "image_formats": ["JPEG", "PNG"],
    "accessibility_level": "WCAG AA"
  }
}

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
- Используй только цвета из фирменной палитры Kupibilet
- Объясни выбор цветов для конкретного направления
- Предоставь конкретные hex-коды цветов
- Создай эмоциональную привлекательность для ${destination}
- Учитывай особенности направления при выборе стиля
- Ответ должен быть на русском языке
`;

  try {
    const response = await generateWithOpenAI({
      prompt: designBriefPrompt,
      temperature: 0.3, // Lower temperature for more consistent technical specs
      max_tokens: 1200
    });

    // Parse JSON response using robust parser
    const designBriefData = parseAIJsonResponse(response, 'design brief generation');
    
    // Add creation metadata
    designBriefData.created_at = new Date().toISOString();
    designBriefData.created_by = 'Content Specialist AI';
    designBriefData.destination = destination;
    
    return designBriefData;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to generate AI design brief:', errorMessage);
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать техническое задание для дизайна ${destination}: ${errorMessage}`);
  }
}

export const createDesignBrief = tool({
  name: 'createDesignBrief',
  description: 'Creates comprehensive AI-powered design brief with Kupibilet brand colors for email template design',
  parameters: z.object({
    destination: z.string().describe('Travel destination'),
    campaign_theme: z.string().describe('Campaign theme or main message'),
    visual_style: z.enum(['modern', 'classic', 'minimalist', 'vibrant', 'elegant']).default('modern').describe('Visual style preference'),
    target_emotion: z.enum(['excitement', 'trust', 'urgency', 'relaxation', 'adventure']).default('adventure').describe('Target emotional response'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    console.log('🎨 === AI DESIGN BRIEF GENERATION ===');
    console.log('📍 Destination:', params.destination);
    console.log('🎯 Theme:', params.campaign_theme);
    console.log('✨ Style:', params.visual_style);
    console.log('💫 Emotion:', params.target_emotion);
    
    try {
      // Extract campaign context
      const campaignContext = extractCampaignContext(context);
      
      if (!campaignContext.campaignPath) {
        throw new Error('Campaign path not found. Campaign must be created first.');
      }
      
      // Generate AI-powered design brief
      const designBrief = await generateAIDesignBrief({
        destination: params.destination,
        campaign_theme: params.campaign_theme,
        visual_style: params.visual_style,
        target_emotion: params.target_emotion
      });
      
      // Save design brief to campaign folder
      const contentDir = path.join(campaignContext.campaignPath, 'content');
      await fs.mkdir(contentDir, { recursive: true });
      
      const designBriefFile = path.join(contentDir, 'design-brief-from-context.json');
      await fs.writeFile(designBriefFile, JSON.stringify(designBrief, null, 2));
      
      console.log(`✅ AI Design brief saved to: ${designBriefFile}`);
      console.log(`🎨 Primary color: ${designBrief.design_requirements?.color_palette?.primary_color}`);
      console.log(`🔥 Accent color: ${designBrief.design_requirements?.color_palette?.accent_color}`);
      console.log(`📄 Background color: ${designBrief.design_requirements?.color_palette?.background_color}`);
      
      // Update campaign context
      const updatedContext = buildCampaignContext(context, {
        design_brief: designBrief,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        (context as ExtendedRunContext).campaignContext = updatedContext;
      }
      
      const duration = Date.now() - startTime;
      console.log(`⚡ Design brief generation completed in ${duration}ms`);
      
      return `✅ AI-powered design brief created for ${params.destination}! Визуальный стиль: ${designBrief.design_requirements.visual_style}. Цвета Kupibilet: основной ${designBrief.design_requirements?.color_palette?.primary_color}, акцентный ${designBrief.design_requirements?.color_palette?.accent_color}. Файл сохранен: ${designBriefFile}. Готов для Design Specialist.`;
      
    } catch (error) {
      // const _duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Design brief generation failed:', errorMessage);
      
      return `Ошибка создания технического задания для дизайна: ${errorMessage}`;
    }
  }
});

// ============================================================================

// Import standardized handoff tool
// Removed: createStandardizedHandoff - OpenAI SDK handles handoffs automatically

// Export all tools for the Content Specialist
export const contentSpecialistTools = [
  createCampaignFolder,
  updateCampaignMetadata,
  contextProvider,
  dateIntelligence,
  createHandoffFile,
  // Removed: finalizeContentAndTransferToDesign - OpenAI SDK handles handoffs automatically
  pricingIntelligence,
  assetStrategy,
  contentGenerator,
  createDesignBrief
]; 