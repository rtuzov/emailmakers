/**
 * 🎯 CONTENT SPECIALIST TOOLS - Context-Aware with OpenAI Agents SDK
 * 
 * Real-time Kupibilet API integration with enhanced error handling,
 * airport conversion, and CSV data processing capabilities.
 * 
 * OpenAI Agents SDK compatible tools with context parameter support.
 * Eliminates global state anti-pattern for proper data flow.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { join } from 'path';
import path from 'path';

// Enhanced pricing integration
import { getPrices } from '../tools/prices';
import { convertAirportToCity, getDestinationInfo } from '../tools/airports-loader';

// Import asset preparation tools
import { assetPreparationTools } from '../tools/asset-preparation';

// Import technical specification tools
import { technicalSpecificationTools } from '../tools/technical-specification';

// Import structured logging system
import { log, getGlobalLogger } from '../core/agent-logger';
import { debuggers } from '../core/debug-output';

// Initialize debug output for Content Specialist
const debug = debuggers.contentSpecialist;

// ============================================================================
// CONTEXT-AWARE CAMPAIGN STATE MANAGEMENT
// ============================================================================

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
  trace_id?: string;
}

/**
 * Builds campaign context from individual tool outputs
 * Replaces global state with context parameter pattern
 */
function buildCampaignContext(context: any, updates: Partial<CampaignWorkflowContext>): CampaignWorkflowContext {
  const existingContext = context?.campaignContext || {};
  const newContext = { ...existingContext, ...updates };
  
  // Debug output with environment variable support
  debug.debug('ContentSpecialist', 'Campaign context built', {
    updatedFields: Object.keys(updates),
    contextSize: Object.keys(newContext).length
  });
  
  // Also use structured logging
  log.debug('ContentSpecialist', 'Campaign context built', { 
    updatedFields: Object.keys(updates),
    contextSize: Object.keys(newContext).length
  });
  
  return newContext;
}

/**
 * Gets campaign context from OpenAI Agents SDK context parameter
 */
function getCampaignContextFromSdk(context: any): CampaignWorkflowContext {
  return context?.campaignContext || {};
}

// ============================================================================
// CAMPAIGN FOLDER CREATION
// ============================================================================

export const createCampaignFolder = tool({
  name: 'createCampaignFolder',
  description: 'Creates comprehensive campaign folder structure with metadata, brief organization, and asset planning for email campaign workflow',
  parameters: z.object({
    campaign_name: z.string().describe('Name of the email campaign'),
    brand_name: z.string().describe('Brand name for the campaign'),
    campaign_type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).describe('Type of campaign'),
    target_audience: z.string().describe('Target audience description'),
    language: z.string().default('ru').describe('Campaign language'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    const performanceMarkId = debug.performanceStart('ContentSpecialist', 'createCampaignFolder');
    
    debug.info('ContentSpecialist', 'Campaign folder creation started', {
      campaign_name: params.campaign_name,
      brand_name: params.brand_name,
      campaign_type: params.campaign_type,
      target_audience: params.target_audience,
      trace_id: params.trace_id
    });
    
    log.info('ContentSpecialist', 'Campaign folder creation started', {
      campaign_name: params.campaign_name,
      brand_name: params.brand_name,
      campaign_type: params.campaign_type,
      target_audience: params.target_audience,
      trace_id: params.trace_id
    });

    try {
      // Generate unique campaign ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const campaignId = `campaign_${timestamp}_${randomId}`;
      
      // Create campaign directory
      const campaignPath = path.join(process.cwd(), 'campaigns', campaignId);
      await fs.mkdir(campaignPath, { recursive: true });
      
      // Create subdirectories
      const subdirs = ['content', 'assets', 'templates', 'docs', 'exports'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(campaignPath, subdir), { recursive: true });
      }
      
      // Create campaign metadata
      const metadata = {
        id: campaignId,
        name: params.campaign_name,
        brand: params.brand_name,
        type: params.campaign_type,
        target_audience: params.target_audience,
        language: params.language,
        created_at: new Date().toISOString(),
        status: 'active'
      };
      
      await fs.writeFile(
        path.join(campaignPath, 'campaign-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Create README
      const readmeContent = `# ${params.campaign_name}\n\n**Бренд:** ${params.brand_name}\n**Тип:** ${params.campaign_type}\n**Аудитория:** ${params.target_audience}\n**Язык:** ${params.language}\n**Создано:** ${new Date().toLocaleString('ru-RU')}\n\n## Структура папок\n\n- \`content/\` - Контент кампании\n- \`assets/\` - Изображения и медиа\n- \`templates/\` - Email шаблоны\n- \`docs/\` - Документация\n- \`exports/\` - Готовые файлы\n`;
      
      await fs.writeFile(
        path.join(campaignPath, 'README.md'),
        readmeContent
      );
      
      const duration = Date.now() - startTime;
      
      debug.info('ContentSpecialist', 'Campaign folder created successfully', {
        campaignId,
        campaignPath,
        duration,
        subdirectories: subdirs
      });
      
      debug.performanceEnd(performanceMarkId, 'ContentSpecialist', 'createCampaignFolder', {
        campaignId,
        subdirectories: subdirs.length
      });
      
      log.info('ContentSpecialist', 'Campaign folder created successfully', {
        campaignId,
        campaignPath,
        duration,
        subdirectories: subdirs
      });
      
      log.performance('ContentSpecialist', 'createCampaignFolder', duration, {
        campaignId,
        subdirectories: subdirs.length
      });
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        campaignId, 
        campaignPath, 
        metadata,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = campaignContext;
      }

      // Return string as required by OpenAI Agents SDK
      return `Кампания успешно создана! ID: ${campaignId}. Папка: ${campaignPath}. Структура включает: content/, assets/, templates/, docs/, exports/. Метаданные сохранены в campaign-metadata.json. Контекст сохранен для передачи следующим инструментам.`;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Campaign folder creation failed', {
        error: error.message,
        duration,
        campaign_name: params.campaign_name,
        trace_id: params.trace_id
      });
      
      log.tool('createCampaignFolder', params, null, duration, false, error.message);
      return `Ошибка создания кампании: ${error.message}`;
    }
  }
});

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

export const contextProvider = tool({
  name: 'contextProvider',
  description: 'Reads and processes travel intelligence data from Data Collection Specialist to create comprehensive context for design technical specification',
  parameters: z.object({
    destination: z.string().describe('Travel destination or location'),
    context_type: z.enum(['destination', 'seasonal', 'market', 'trends']).describe('Type of context needed'),
    audience_segment: z.string().nullable().describe('Target audience segment for context'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    log.info('ContentSpecialist', 'Context provider started - reading Data Collection data', {
      destination: params.destination,
      context_type: params.context_type,
      audience_segment: params.audience_segment,
      trace_id: params.trace_id
    });

    try {
      // 🔍 STEP 1: Find active campaign folder
      const campaignsDir = path.join(process.cwd(), 'campaigns');
      const campaignFolders = await fs.readdir(campaignsDir);
      const latestCampaign = campaignFolders
        .filter(folder => folder.startsWith('campaign_'))
        .sort()
        .pop();
        
      if (!latestCampaign) {
        throw new Error('❌ Активная кампания не найдена. Data Collection Specialist должен создать данные первым.');
      }
      
      const campaignPath = path.join(campaignsDir, latestCampaign);
      const dataDir = path.join(campaignPath, 'data');
      
      console.log(`📂 CONTENT: Reading data from campaign: ${latestCampaign}`);
      console.log(`📊 CONTENT: Data directory: ${dataDir}`);
      
      // 🔍 STEP 2: Read Data Collection Specialist files
      let contextData: any = {};
      
      try {
        // Read the files that Data Collection Specialist actually creates
        const dataFiles = {
          destination: path.join(dataDir, 'destination-analysis.json'),
          market: path.join(dataDir, 'market-intelligence.json'),
          emotional: path.join(dataDir, 'emotional-profile.json'),
          trends: path.join(dataDir, 'trend-analysis.json'),
          insights: path.join(dataDir, 'consolidated-insights.json')
        };
        
        console.log('🔍 CONTENT: Looking for Data Collection files...');
        
        // Check which files exist
        const existingFiles = {};
        for (const [key, filePath] of Object.entries(dataFiles)) {
          if (await fs.access(filePath).then(() => true).catch(() => false)) {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            existingFiles[key] = JSON.parse(fileContent);
            console.log(`✅ CONTENT: Found ${key} file: ${path.basename(filePath)}`);
          } else {
            console.warn(`⚠️ CONTENT: Missing ${key} file: ${path.basename(filePath)}`);
          }
        }
        
        if (Object.keys(existingFiles).length === 0) {
          throw new Error('❌ Не найдено ни одного файла от Data Collection Specialist. Убедитесь что Data Collection Specialist выполнился первым.');
        }
        
        // Extract context data from existing files
        const files = existingFiles as any;
        contextData = {
          destination: params.destination,
          seasonal_trends: files.destination?.data?.seasonal_trends || 'Сезонные тренды из анализа направления',
          emotional_triggers: files.emotional?.data?.emotional_triggers || 'Эмоциональные триггеры из анализа',
          market_positioning: files.market?.data?.market_positioning || 'Рыночное позиционирование из анализа',
          competitive_landscape: files.market?.data?.competitive_landscape || 'Конкурентная среда из анализа',
          price_sensitivity: files.market?.data?.price_sensitivity || 'Ценовая чувствительность из анализа',
          booking_patterns: files.trends?.data?.booking_patterns || 'Паттерны бронирования из анализа',
          actionable_insights: files.insights?.data?.actionable_insights || [],
          key_insights: files.insights?.data?.key_insights || []
        };
        
        console.log(`✅ CONTENT: Successfully loaded context from ${Object.keys(existingFiles).length} Data Collection files`);
        
      } catch (fileError) {
        throw new Error(`❌ Не удалось прочитать данные Data Collection Specialist: ${fileError.message}. Убедитесь что Data Collection Specialist выполнился первым и сохранил данные.`);
      }

      // 🔍 STEP 3: Create design technical specification based on context
      const designBrief = {
        destination_context: {
          name: params.destination,
          seasonal_advantages: contextData.seasonal_trends,
          emotional_appeal: contextData.emotional_triggers,
          market_position: contextData.market_positioning
        },
        design_requirements: {
          visual_style: 'Современный, привлекательный стиль на основе анализа направления',
          color_palette: 'Цветовая палитра, соответствующая эмоциональным триггерам направления',
          imagery_direction: 'Направление изображений на основе сезонных трендов и особенностей направления',
          typography_mood: 'Типографическое настроение, отражающее позиционирование на рынке'
        },
        content_priorities: {
          key_messages: contextData.key_insights || [],
          emotional_triggers: contextData.travel_insights || [],
          actionable_insights: contextData.actionable_insights || []
        },
        competitive_differentiation: {
          unique_selling_points: 'Уникальные преимущества направления на основе анализа конкуренции',
          market_advantages: contextData.competitive_landscape
        }
      };
      
      // 🔍 STEP 4: Save design brief to campaign folder
      const contentDir = path.join(campaignPath, 'content');
      await fs.mkdir(contentDir, { recursive: true });
      
      const designBriefFile = path.join(contentDir, 'design-brief-from-context.json');
      await fs.writeFile(designBriefFile, JSON.stringify(designBrief, null, 2));
      
      console.log(`✅ CONTENT: Design brief saved to: ${designBriefFile}`);

      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Context analysis completed with design brief', {
        destination: params.destination,
        context_type: params.context_type,
        duration,
        design_brief_file: designBriefFile,
        key_insights_count: contextData.key_insights?.length || 0,
        travel_insights_count: contextData.travel_insights?.length || 0
      });
      
      log.performance('ContentSpecialist', 'contextProvider', duration, {
        destination: params.destination,
        context_type: params.context_type
      });
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        context_analysis: contextData,
        design_brief: designBrief,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = campaignContext;
      }

      // Return formatted string with design brief info
      return `✅ Контекстная информация для ${params.destination} успешно обработана из данных Data Collection Specialist. Создано техническое задание для дизайна с визуальным стилем, цветовой палитрой и направлением изображений. Ключевых инсайтов: ${contextData.key_insights?.length || 0}. Travel инсайтов: ${contextData.travel_insights?.length || 0}. Design brief сохранен в ${designBriefFile}. Контекст готов для следующих инструментов.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Context provider failed', {
        error: error.message,
        destination: params.destination,
        context_type: params.context_type,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('contextProvider', params, null, duration, false, error.message);
      return `Ошибка получения контекста: ${error.message}`;
    }
  }
});

// Dynamic context analysis using LLM
async function generateDynamicContextAnalysis(params: {
  destination: string;
  context_type: string;
  audience_segment?: string | null;
  current_date: string;
}) {
  const { destination, context_type, audience_segment, current_date } = params;
  
  // Get current date for more accurate analysis
  const now = new Date();
  const actualCurrentDate = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const formattedCurrentDate = now.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  // Prompt for LLM to generate contextual analysis
  const analysisPrompt = `
Проанализируй туристическое направление "${destination}" и предоставь детальную информацию для создания маркетинговой кампании.

КРИТИЧЕСКИ ВАЖНО - АКТУАЛЬНАЯ ДАТА:
- Сегодняшняя дата: ${actualCurrentDate} (${formattedCurrentDate})
- Текущий год: ${currentYear}
- Текущий месяц: ${currentMonth}

Параметры анализа:
- Направление: ${destination}
- Тип анализа: ${context_type}
- Целевая аудитория: ${audience_segment || 'Общая аудитория'}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К АНАЛИЗУ:
- Учитывай текущий сезон (месяц ${currentMonth}) для сезонных трендов
- Анализируй актуальность направления на дату ${actualCurrentDate}
- Рассматривай предстоящие месяцы и сезоны от текущей даты
- Учитывай текущие события и праздники

Предоставь следующую информацию в JSON формате:

{
  "seasonal_trends": "Актуальные сезонные тренды с учетом текущего времени года и месяца ${currentMonth}",
  "emotional_triggers": "Эмоциональные триггеры для данного направления",
  "market_positioning": "Рыночное позиционирование направления",
  "competitive_landscape": "Конкурентная среда и особенности рынка",
  "price_sensitivity": "Ценовая чувствительность целевой аудитории",
  "booking_patterns": "Паттерны бронирования для данного направления",
  "current_season_context": "Контекст текущего сезона и месяца ${currentMonth} для направления ${destination}",
  "upcoming_opportunities": "Предстоящие возможности и события в ближайшие месяцы"
}

Требования:
- Используй актуальную информацию о туристическом рынке
- Учитывай сезонность и текущее время года (месяц ${currentMonth})
- Адаптируй информацию под целевую аудиторию
- Предоставь конкретные, применимые данные для маркетинга
- Фокусируйся на актуальных трендах относительно ${actualCurrentDate}
- Ответ должен быть на русском языке
`;

      try {
      // Use OpenAI to generate dynamic analysis
      const response = await generateWithOpenAI({
        prompt: analysisPrompt,
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000
      });

      // Parse JSON response (extract from markdown if needed)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysisData = JSON.parse(jsonString.trim());
    
    return {
      destination: destination,
      seasonal_trends: analysisData.seasonal_trends,
      emotional_triggers: analysisData.emotional_triggers,
      market_positioning: analysisData.market_positioning,
      competitive_landscape: analysisData.competitive_landscape,
      price_sensitivity: analysisData.price_sensitivity,
      booking_patterns: analysisData.booking_patterns
    };

  } catch (error) {
    log.error('ContentSpecialist', 'Failed to generate dynamic context analysis', {
      error: error.message,
      destination,
      context_type
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать контекстный анализ для ${destination}: ${error.message}`);
  }
}

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
            content: 'Ты эксперт по туристическому маркетингу. Предоставляй точную, актуальную информацию в запрашиваемом формате.'
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

  } catch (error) {
    log.error('ContentSpecialist', 'OpenAI API call failed', {
      error: error.message,
      prompt: prompt.substring(0, 100) + '...'
    });
    throw error;
  }
}

// ============================================================================
// DATE INTELLIGENCE
// ============================================================================

export const dateIntelligence = tool({
  name: 'dateIntelligence',
  description: 'Analyzes optimal travel dates based on destination, season, and current market conditions',
  parameters: z.object({
    destination: z.string().describe('Travel destination'),
    season: z.enum(['spring', 'summer', 'autumn', 'winter', 'year-round']).describe('Preferred travel season'),
    flexibility: z.enum(['flexible', 'semi-flexible', 'fixed']).describe('Date flexibility level'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    log.info('ContentSpecialist', 'Date intelligence started', {
      destination: params.destination,
      season: params.season,
      flexibility: params.flexibility,
      trace_id: params.trace_id
    });

    try {
      const currentDate = new Date();
      
      // Dynamic date analysis using LLM instead of static calculations
      const dateAnalysis = await generateDynamicDateAnalysis({
        destination: params.destination,
        season: params.season,
        flexibility: params.flexibility,
        current_date: currentDate.toISOString()
      });

      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Date analysis completed', {
        destination: params.destination,
        season: params.season,
        optimal_dates: dateAnalysis.optimal_dates,
        duration,
        booking_recommendation: dateAnalysis.booking_recommendation
      });
      
      log.performance('ContentSpecialist', 'dateIntelligence', duration, {
        destination: params.destination,
        optimal_dates_count: dateAnalysis.optimal_dates.length
      });
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        date_analysis: dateAnalysis,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = campaignContext;
      }

      // Return formatted string
      return `Анализ дат для ${params.destination} в ${params.season}: Оптимальные даты - ${dateAnalysis.optimal_dates.join(', ')}. Ценовые окна - ${dateAnalysis.pricing_windows.join(', ')}. Рекомендация по бронированию - ${dateAnalysis.booking_recommendation}. Сезонные факторы - ${dateAnalysis.seasonal_factors}. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Date intelligence failed', {
        error: error.message,
        destination: params.destination,
        season: params.season,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('dateIntelligence', params, null, duration, false, error.message);
      return `Ошибка анализа дат: ${error.message}`;
    }
  }
});

// Dynamic date analysis using LLM
async function generateDynamicDateAnalysis(params: {
  destination: string;
  season: string;
  flexibility: string;
  current_date: string;
}) {
  const { destination, season, flexibility, current_date } = params;
  
  // Get current date for more accurate analysis
  const now = new Date();
  const actualCurrentDate = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Prompt for LLM to generate date analysis
  const dateAnalysisPrompt = `
Проанализируй оптимальные даты для путешествия в "${destination}" и предоставь детальные рекомендации.

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
- НИКОГДА НЕ ИСПОЛЬЗУЙ ДАТЫ 2024 ГОДА
- Используй только ${currentYear} год и позже
- Минимальная дата: завтра (${new Date(now.getTime() + 24*60*60*1000).toISOString().split('T')[0]})

Предоставь следующую информацию в JSON формате:

{
  "destination": "${destination}",
  "season": "${season}",
  "optimal_dates": ["YYYY-MM-DD", "YYYY-MM-DD", "..."],
  "pricing_windows": ["период с описанием", "период с описанием", "..."],
  "booking_recommendation": "конкретная рекомендация по срокам бронирования",
  "seasonal_factors": "описание сезонных факторов",
  "current_date": "${actualCurrentDate}"
}

Требования:
- Предложи 4-6 оптимальных дат в ближайшие 12 месяцев от ${actualCurrentDate}
- Учти сезонность и климатические особенности направления
- Рассмотри туристические потоки и ценовые периоды
- Адаптируй рекомендации под уровень гибкости (flexible/semi-flexible/fixed)
- Предоставь практические советы по бронированию
- Все даты в формате YYYY-MM-DD и ТОЛЬКО В БУДУЩЕМ
- Ответ должен быть на русском языке
`;

      try {
      // Use OpenAI to generate dynamic date analysis
      const response = await generateWithOpenAI({
        prompt: dateAnalysisPrompt,
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1200
      });

      // Parse JSON response (extract from markdown if needed)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysisData = JSON.parse(jsonString.trim());
    
    return {
      destination: analysisData.destination,
      season: analysisData.season,
      optimal_dates: analysisData.optimal_dates,
      pricing_windows: analysisData.pricing_windows,
      booking_recommendation: analysisData.booking_recommendation,
      seasonal_factors: analysisData.seasonal_factors,
      current_date: analysisData.current_date
    };

  } catch (error) {
    log.error('ContentSpecialist', 'Failed to generate dynamic date analysis', {
      error: error.message,
      destination,
      season,
      flexibility
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать анализ дат для ${destination}: ${error.message}`);
  }
}

// ============================================================================
// PRICING INTELLIGENCE - ENHANCED WITH PRICES.TS
// ============================================================================

export const pricingIntelligence = tool({
  name: 'pricingIntelligence',
  description: 'Gets real-time pricing data from Kupibilet API with enhanced airport conversion, route correction, and comprehensive error handling',
  parameters: z.object({
    route: z.object({
      from: z.string().describe('Departure city/airport'),
      to: z.string().describe('Destination city/airport'),
      from_code: z.string().describe('Departure airport code (MOW, LED, etc.)'),
      to_code: z.string().describe('Destination airport code (BKK, AYT, etc.)')
    }).describe('Flight route information'),
    date_range: z.object({
      from: z.string().describe('Start date for search (YYYY-MM-DD)'),
      to: z.string().describe('End date for search (YYYY-MM-DD)')
    }).describe('Date range for price search'),
    cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy').describe('Cabin class'),
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
    log.info('ContentSpecialist', 'Enhanced pricing intelligence started', {
      route: `${params.route.from} (${params.route.from_code}) → ${params.route.to} (${params.route.to_code})`,
      date_range: `${params.date_range.from} to ${params.date_range.to}`,
      cabin_class: params.cabin_class,
      currency: params.currency,
      filters: params.filters,
      trace_id: params.trace_id
    });

    try {
      // Use enhanced getPrices function from prices.ts
      const pricesResult = await getPrices({
        origin: params.route.from_code,
        destination: params.route.to_code,
        date_range: `${params.date_range.from},${params.date_range.to}`,
        cabin_class: params.cabin_class,
        filters: params.filters || {}
      });

      if (!pricesResult.success) {
        // No fallback logic - fail immediately with clear error message
        log.error('ContentSpecialist', 'Pricing request failed for airport code', {
          failed_route: `${params.route.from_code}-${params.route.to_code}`,
          error: pricesResult.error,
          date_range: `${params.date_range.from} to ${params.date_range.to}`
        });
        
        throw new Error(`Kupibilet API failed: ${pricesResult.error}. Check that airport code ${params.route.to_code} is supported and date range is wide enough (recommended: 1 year).`);
      }

      const pricingData = pricesResult.data;

      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Enhanced pricing data received', {
        route: `${params.route.from} → ${params.route.to}`,
        cheapest_price: pricingData.cheapest,
        currency: pricingData.currency,
        total_offers: pricingData.search_metadata.total_found,
        duration,
        api_source: pricesResult.metadata?.source
      });
      
      log.performance('ContentSpecialist', 'pricingIntelligence', duration, {
        route: `${params.route.from_code}-${params.route.to_code}`,
        offers_found: pricingData.search_metadata.total_found
      });
      
      // Transform data for campaign context
      const campaignPricingData = {
        best_price: pricingData.cheapest,
        min_price: pricingData.cheapest,
        max_price: Math.max(...pricingData.prices.map(p => p.price)),
        average_price: Math.round(pricingData.prices.reduce((sum, p) => sum + p.price, 0) / pricingData.prices.length),
        currency: pricingData.currency,
        offers_count: pricingData.search_metadata.total_found,
        recommended_dates: pricingData.prices.slice(0, 3).map(p => p.date),
        route: pricingData.search_metadata.route,
        enhanced_features: {
          airport_conversion: pricesResult.metadata?.route_processing || {},
          csv_integration: pricesResult.metadata?.csv_integration || 'enabled',
          api_source: pricesResult.metadata?.source || 'kupibilet_api_v2'
        }
      };
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        pricing_analysis: campaignPricingData,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = campaignContext;
      }

      // Return formatted string with enhanced pricing
      return `Улучшенный ценовой анализ маршрута ${params.route.from} - ${params.route.to}: Лучшая цена ${campaignPricingData.best_price} ${campaignPricingData.currency}. Диапазон цен: ${campaignPricingData.min_price} - ${campaignPricingData.max_price} ${campaignPricingData.currency}. Средняя цена: ${campaignPricingData.average_price} ${campaignPricingData.currency}. Найдено предложений: ${campaignPricingData.offers_count}. Рекомендуемые даты: ${campaignPricingData.recommended_dates.join(', ')}. Используется улучшенная система конвертации аэропортов и CSV-интеграция. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Enhanced pricing intelligence failed', {
        error: error.message,
        route: `${params.route.from_code}-${params.route.to_code}`,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('pricingIntelligence', params, null, duration, false, error.message);
      return `Ошибка получения цен от улучшенного API: ${error.message}`;
    }
  }
});

// ============================================================================
// ASSET STRATEGY
// ============================================================================

// Dynamic asset strategy generation using LLM
async function generateDynamicAssetStrategy(params: {
  campaign_theme: string;
  visual_style: string;
  color_preference: string | null | { primary: string[]; secondary: string[]; supporting: string[]; };
  target_emotion: string;
}) {
  const { campaign_theme, visual_style, color_preference, target_emotion } = params;
  
  const strategyPrompt = `
Создай ВИЗУАЛЬНО-БОГАТУЮ стратегию для email кампании с МНОЖЕСТВОМ ИЗОБРАЖЕНИЙ и СОВРЕМЕННЫМ ДИЗАЙНОМ.

🎯 НОВЫЕ ТРЕБОВАНИЯ - ВИЗУАЛЬНЫЙ ПОДХОД:
- Создай 6-8 различных концепций изображений для разных секций
- Фокус на эмоциональном воздействии через визуал
- Современные email design patterns (hero, gallery, cards, etc.)
- Минимум текста, максимум визуальных элементов

Тема кампании: ${campaign_theme}
Визуальный стиль: ${visual_style}
Цветовые предпочтения: ${typeof color_preference === 'object' && color_preference ? 
  `Структурированные фирменные цвета Kupibilet:
  - Основные: ${color_preference.primary.join(', ')}
  - Дополнительные: ${color_preference.secondary.join(', ')}
  - Вспомогательные: ${color_preference.supporting.join(', ')}` : 
  (color_preference || 'Использовать фирменные цвета Kupibilet')}
Целевая эмоция: ${target_emotion}

ОБЯЗАТЕЛЬНО используй фирменные цвета Kupibilet:
${typeof color_preference === 'object' && color_preference ? 
  `- Основные: ${color_preference.primary.join(', ')} (бренд, акцент, текст)
- Дополнительные: ${color_preference.secondary.join(', ')} (CTA, яркие акценты)
- Вспомогательные: ${color_preference.supporting.join(', ')} (фоны, градиенты, дополнительные элементы)` :
  `- Основные: #4BFF7E (бренд), #1DA857 (акцент), #2C3959 (текст)
- Дополнительные: #FF6240 (CTA), #E03EEF (акценты)
- Вспомогательные: #FFC7BB, #FFEDE9, #F8A7FF, #FDE8FF, #B0C6FF, #EDEFFF`}

Выбери цвета из фирменной палитры Kupibilet, которые лучше всего подходят для темы "${campaign_theme}" и эмоции "${target_emotion}".

ВАЖНО: Используй конкретные цвета из каждой категории:
- Из основных цветов выбери 1 для главного элемента
- Из дополнительных цветов выбери 1 для CTA и акцентов
- Из вспомогательных цветов выбери 1-2 для фонов и дополнительных элементов

Предоставь визуальную стратегию в JSON формате:

{
  "theme": "Название темы кампании",
  "visual_style": "Стиль визуального оформления",
  "color_palette": "Конкретные цвета из фирменной палитры Kupibilet с объяснением выбора",
  "primary_color": "Основной цвет из палитры Kupibilet (например, #4BFF7E)",
  "accent_color": "Акцентный цвет из палитры Kupibilet (например, #FF6240)",
  "background_color": "Цвет фона из вспомогательных цветов (например, #EDEFFF)",
  "text_color": "#2C3959",
  "typography": "Рекомендации по типографике",
  "image_concepts": [
    "Hero изображение - главная визуальная концепция",
    "Lifestyle фото - люди в контексте направления",
    "Архитектура/достопримечательности - знаковые места",
    "Кулинария/культура - местные особенности", 
    "Природа/пейзажи - естественная красота",
    "Активности/развлечения - что можно делать",
    "Шоппинг/сувениры - местные товары",
    "Транспорт/логистика - как добраться"
  ],
  "layout_sections": [
    {
      "type": "hero",
      "description": "Главная визуальная секция с минимумом текста",
      "image_type": "hero",
      "content_approach": "Эмоциональный заголовок + визуал"
    },
    {
      "type": "gallery",
      "description": "Галерея из 3-4 изображений с короткими подписями",
      "image_type": "lifestyle",
      "content_approach": "Визуальные карточки с 2-3 словами"
    },
    {
      "type": "highlights",
      "description": "Ключевые особенности с иконками",
      "image_type": "icons",
      "content_approach": "Иконки + короткие фразы"
    },
    {
      "type": "cta_visual",
      "description": "Визуальный призыв к действию",
      "image_type": "cta_background",
      "content_approach": "Большая кнопка + цена"
    }
  ],
  "layout_hierarchy": "Визуальная иерархия с акцентом на изображения",
  "emotional_triggers": "Эмоциональные триггеры",
  "brand_consistency": "Как стратегия соответствует бренду Kupibilet"
}

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
- МИНИМУМ 6-8 различных концепций изображений
- Создай секции для современного email дизайна
- Используй только цвета из фирменной палитры Kupibilet
- Объясни выбор цветов для конкретной темы
- Предоставь конкретные hex-коды цветов
- Учитывай эмоциональное воздействие цветов
- Ответ должен быть на русском языке
`;

  try {
    const response = await generateWithOpenAI({
      prompt: strategyPrompt,
      temperature: 0.4,
      max_tokens: 1200
    });

    // Parse JSON response
    let jsonString = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const strategyData = JSON.parse(jsonString.trim());
    
    return {
      theme: strategyData.theme,
      visual_style: strategyData.visual_style,
      color_palette: strategyData.color_palette,
      primary_color: strategyData.primary_color,
      accent_color: strategyData.accent_color,
      background_color: strategyData.background_color,
      text_color: strategyData.text_color,
      typography: strategyData.typography,
      image_concepts: strategyData.image_concepts,
      layout_hierarchy: strategyData.layout_hierarchy,
      emotional_triggers: strategyData.emotional_triggers,
      brand_consistency: strategyData.brand_consistency
    };

  } catch (error) {
    log.error('ContentSpecialist', 'Failed to generate dynamic asset strategy', {
      error: error.message,
      campaign_theme,
      visual_style,
      target_emotion
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать визуальную стратегию для ${campaign_theme}: ${error.message}`);
  }
}

// Update design brief with specific colors from asset strategy
async function updateDesignBriefWithColors(assetStrategy: any, context: any) {
  try {
    // Get campaign context
    const campaignContext = getCampaignContextFromSdk(context);
    
    // Find active campaign folder
    const campaignsDir = path.join(process.cwd(), 'campaigns');
    let campaignPath = campaignContext.campaignPath;
    
    if (!campaignPath) {
      const campaignFolders = await fs.readdir(campaignsDir);
      const latestCampaign = campaignFolders
        .filter(folder => folder.startsWith('campaign_'))
        .sort()
        .pop();
        
      if (!latestCampaign) {
        console.log('❌ No active campaign found for design brief update');
        return;
      }
      
      campaignPath = path.join(campaignsDir, latestCampaign);
    }
    
    // Read existing design brief
    const designBriefFile = path.join(campaignPath, 'content', 'design-brief-from-context.json');
    
    if (await fs.access(designBriefFile).then(() => true).catch(() => false)) {
      const existingBrief = JSON.parse(await fs.readFile(designBriefFile, 'utf8'));
      
      // Update with specific colors from asset strategy
      const updatedBrief = {
        ...existingBrief,
        design_requirements: {
          ...existingBrief.design_requirements,
          visual_style: assetStrategy.visual_style,
          color_palette: assetStrategy.color_palette,
          primary_color: assetStrategy.primary_color,
          accent_color: assetStrategy.accent_color,
          background_color: assetStrategy.background_color,
          text_color: assetStrategy.text_color,
          typography_mood: assetStrategy.typography
        },
        brand_colors: {
          primary: assetStrategy.primary_color,
          accent: assetStrategy.accent_color,
          background: assetStrategy.background_color,
          text: assetStrategy.text_color
        },
        image_concepts: assetStrategy.image_concepts,
        layout_hierarchy: assetStrategy.layout_hierarchy,
        emotional_triggers: assetStrategy.emotional_triggers,
        brand_consistency: assetStrategy.brand_consistency
      };
      
      // Save updated design brief
      await fs.writeFile(designBriefFile, JSON.stringify(updatedBrief, null, 2));
      
      console.log(`✅ CONTENT: Design brief updated with specific Kupibilet colors`);
      console.log(`🎨 COLORS: Primary=${assetStrategy.primary_color}, Accent=${assetStrategy.accent_color}, Background=${assetStrategy.background_color}`);
      
    } else {
      console.log('❌ Design brief file not found, cannot update with colors');
    }
    
  } catch (error) {
    console.error('❌ Error updating design brief with colors:', error.message);
  }
}

export const assetStrategy = tool({
  name: 'assetStrategy',
  description: 'Develops comprehensive visual asset strategy including image concepts, color schemes, typography, and visual hierarchy for email campaign design',
  parameters: z.object({
    campaign_theme: z.string().describe('Main theme or concept of the campaign'),
    visual_style: z.enum(['modern', 'classic', 'minimalist', 'vibrant', 'elegant']).describe('Desired visual style'),
    color_preference: z.string().nullable().describe('Preferred color scheme or brand colors'),
    target_emotion: z.enum(['excitement', 'trust', 'urgency', 'relaxation', 'adventure']).describe('Target emotional response'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    
    // Generate dynamic visual strategy using LLM with Kupibilet brand colors
    // Develop comprehensive visual strategy with structured Kupibilet colors
    const kupibiletColors = {
      primary: ['#4BFF7E', '#1DA857', '#2C3959'],
      secondary: ['#FF6240', '#E03EEF'], 
      supporting: ['#FFC7BB', '#FFEDE9', '#F8A7FF', '#FDE8FF', '#B0C6FF', '#EDEFFF']
    };
    
    log.info('ContentSpecialist', 'Asset strategy started', {
      campaign_theme: params.campaign_theme,
      visual_style: params.visual_style,
      color_preference: kupibiletColors,
      target_emotion: params.target_emotion,
      trace_id: params.trace_id
    });

    try {
      
      const assetStrategy = await generateDynamicAssetStrategy({
        campaign_theme: params.campaign_theme,
        visual_style: params.visual_style,
        color_preference: kupibiletColors,
        target_emotion: params.target_emotion
      });

      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Asset strategy developed', {
        theme: assetStrategy.theme,
        visual_style: assetStrategy.visual_style,
        image_concepts: assetStrategy.image_concepts,
        duration,
        emotional_triggers: assetStrategy.emotional_triggers
      });
      
      log.performance('ContentSpecialist', 'assetStrategy', duration, {
        theme: params.campaign_theme,
        concepts_count: assetStrategy.image_concepts.length
      });
      
      // Update design brief with specific colors
      await updateDesignBriefWithColors(assetStrategy, context);
      
      // Build context for next tools (no global state)
      const campaignContext = buildCampaignContext(context, { 
        asset_strategy: assetStrategy,
        trace_id: params.trace_id
      });
      
      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = campaignContext;
      }

      // Return formatted string with specific colors
      return `Визуальная стратегия для темы "${assetStrategy.theme}": Стиль - ${assetStrategy.visual_style}, цветовая палитра - ${assetStrategy.color_palette}. КОНКРЕТНЫЕ ЦВЕТА: Основной - ${assetStrategy.primary_color}, Акцентный - ${assetStrategy.accent_color}, Фон - ${assetStrategy.background_color}, Текст - ${assetStrategy.text_color}. Типографика - ${assetStrategy.typography}. Концепции изображений: ${assetStrategy.image_concepts.join(', ')}. Иерархия макета: ${assetStrategy.layout_hierarchy}. Эмоциональные триггеры: ${assetStrategy.emotional_triggers}. Соблюдение бренда: ${assetStrategy.brand_consistency}. Контекст сохранен для передачи следующим инструментам.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Asset strategy failed', {
        error: error.message,
        campaign_theme: params.campaign_theme,
        visual_style: params.visual_style,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('assetStrategy', params, null, duration, false, error.message);
      return `Ошибка разработки визуальной стратегии: ${error.message}`;
    }
  }
});

// ============================================================================
// CONTENT GENERATOR - USES REAL DATA
// ============================================================================

export const contentGenerator = tool({
  name: 'contentGenerator',
  description: 'Generates compelling email content using real pricing data and date analysis from previous tools via context parameter',
  parameters: z.object({
    campaign_theme: z.string().describe('Main campaign theme or destination'),
    content_type: z.enum(['promotional', 'newsletter', 'announcement']).describe('Type of email content'),
    personalization_level: z.enum(['basic', 'advanced', 'premium']).describe('Level of personalization'),
    urgency_level: z.enum(['low', 'medium', 'high']).describe('Urgency level for the offer'),
    trace_id: z.string().nullable().describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    log.info('ContentSpecialist', 'Content generation started', {
      campaign_theme: params.campaign_theme,
      content_type: params.content_type,
      personalization_level: params.personalization_level,
      urgency_level: params.urgency_level,
      trace_id: params.trace_id
    });

    try {
      // Get real data from context parameter (no global state)
      const campaignContext = getCampaignContextFromSdk(context);
      const pricingData = campaignContext.pricing_analysis;
      const dateAnalysis = campaignContext.date_analysis;
      const contextAnalysis = campaignContext.context_analysis;
      
      // Find active campaign from context
      const campaignsDir = path.join(process.cwd(), 'campaigns');
      let campaignPath = campaignContext.campaignPath;
      
      if (!campaignPath) {
        const campaignFolders = await fs.readdir(campaignsDir);
        const latestCampaign = campaignFolders
          .filter(folder => folder.startsWith('campaign_'))
          .sort()
          .pop();
          
        if (!latestCampaign) {
          return 'Ошибка: Активная кампания не найдена. Сначала создайте кампанию.';
        }
        
        campaignPath = path.join(campaignsDir, latestCampaign);
      }
      
      // Generate content using real data from context via LLM
      const generatedContent = await generateDynamicEmailContent(params, pricingData, dateAnalysis, contextAnalysis);

      // Save content to campaign folder
      const contentFile = path.join(campaignPath, 'content', 'email-content.json');
      await fs.writeFile(contentFile, JSON.stringify(generatedContent, null, 2));
      
      // Also save as markdown for easy reading
      const markdownContent = createMarkdownContent(generatedContent);
      
      await fs.writeFile(
        path.join(campaignPath, 'content', 'email-content.md'),
        markdownContent
      );

      const duration = Date.now() - startTime;
      log.info('ContentSpecialist', 'Content generated with real data', {
        campaign_theme: params.campaign_theme,
        subject: generatedContent.subject,
        content_file: contentFile,
        duration,
        has_pricing_data: !!pricingData,
        has_date_analysis: !!dateAnalysis
      });
      
      log.performance('ContentSpecialist', 'contentGenerator', duration, {
        campaign_theme: params.campaign_theme,
        content_type: params.content_type,
        personalization_level: params.personalization_level
      });
      
      // Build final context for finalization tool
      const finalCampaignContext = buildCampaignContext(context, { 
        generated_content: {
          subject: generatedContent.subject,
          preheader: generatedContent.preheader,
          body: generatedContent.body,
          cta: generatedContent.cta,
          personalization_level: generatedContent.personalization,
          urgency_level: generatedContent.urgency
        },
        technical_requirements: {
          max_width: '600px',
          email_clients: ['gmail', 'outlook', 'apple_mail'],
          dark_mode_support: true,
          accessibility_level: 'AA' as const
        },
        trace_id: params.trace_id
      });
      
      // Save final context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.campaignContext = finalCampaignContext;
      }
      
      // Return formatted string with context info
      return `Контент сгенерирован с реальными данными! Тема: "${generatedContent.subject}". Цена: ${generatedContent.pricing?.best_price || 'N/A'} ${generatedContent.pricing?.currency || ''}. Даты: ${generatedContent.dates?.optimal_dates?.join(', ') || 'N/A'}. Контент сохранен в ${contentFile} и ${path.join(campaignPath, 'content', 'email-content.md')}. Контекст готов для передачи Design Specialist.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('ContentSpecialist', 'Content generation failed', {
        error: error.message,
        campaign_theme: params.campaign_theme,
        content_type: params.content_type,
        duration,
        trace_id: params.trace_id
      });
      
      log.tool('contentGenerator', params, null, duration, false, error.message);
      return `Ошибка генерации контента: ${error.message}`;
    }
  }
});

// Dynamic email content generation using LLM
async function generateDynamicEmailContent(params: any, pricingData: any, dateAnalysis: any, contextAnalysis: any) {
  const destination = params.campaign_theme;
  const price = pricingData?.best_price || 0;
  const currency = pricingData?.currency || 'RUB';
  const dates = dateAnalysis?.optimal_dates || [];
  
  // Get current date for more accurate content generation
  const now = new Date();
  const actualCurrentDate = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const formattedCurrentDate = now.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  // Prompt for LLM to generate VISUAL-FIRST email content
  const contentPrompt = `
Создай ВИЗУАЛЬНО-ОРИЕНТИРОВАННЫЙ email-контент для туристической рассылки с МИНИМУМОМ ТЕКСТА.

🎯 НОВЫЕ ТРЕБОВАНИЯ - ВИЗУАЛЬНЫЙ ПОДХОД:
- Заголовок: МАКСИМУМ 3-5 слов, эмоциональный крючок
- Подзаголовок: 1 короткое предложение (до 8 слов)
- Основной текст: ТОЛЬКО 3 bullet points по 4-6 слов каждый
- CTA: 1-2 слова максимум
- Фокус на ЭМОЦИЯХ и ВИЗУАЛЬНЫХ КОНЦЕПЦИЯХ

КРИТИЧЕСКИ ВАЖНО - АКТУАЛЬНАЯ ДАТА:
- Сегодняшняя дата: ${actualCurrentDate} (${formattedCurrentDate})
- Текущий год: ${currentYear}
- Текущий месяц: ${currentMonth}

Параметры кампании:
- Направление: ${destination}
- Тип контента: ${params.content_type}
- Уровень персонализации: ${params.personalization_level}
- Уровень срочности: ${params.urgency_level}

Актуальные данные:
- Лучшая цена: ${price} ${currency}
- Оптимальные даты: ${dates.join(', ')}
- Сезонные тренды: ${contextAnalysis?.seasonal_trends || 'Не указаны'}
- Эмоциональные триггеры: ${contextAnalysis?.emotional_triggers || 'Не указаны'}

Предоставь следующую информацию в JSON формате:

{
  "subject": "Короткий заголовок (3-5 слов)",
  "preheader": "Эмоциональный крючок (до 8 слов)",
  "body": "3 bullet points по 4-6 слов",
  "visual_sections": [
    {
      "type": "hero",
      "title": "Короткий заголовок (3-4 слова)",
      "subtitle": "Эмоциональная фраза (5-6 слов)"
    },
    {
      "type": "highlights",
      "items": ["Фраза 1", "Фраза 2", "Фраза 3"]
    },
    {
      "type": "cta_section",
      "title": "1-2 слова",
      "subtitle": "Короткая мотивация (3-4 слова)"
    }
  ],
  "cta": {
    "primary": "1-2 слова",
    "secondary": "1-2 слова"
  },
  "pricing": {
    "best_price": "${price}",
    "currency": "${currency}",
    "offers_count": 23
  },
  "dates": {
    "optimal_dates": ${JSON.stringify(dates)},
    "season": "${dateAnalysis?.season || 'current'}",
    "destination": "${destination}"
  },
  "context": {
    "destination": "${destination}",
    "emotional_triggers": "${contextAnalysis?.emotional_triggers || 'Путешествия, новые впечатления, отдых'}",
    "current_date_context": "Контекст относительно текущей даты ${actualCurrentDate}"
  }
}

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
- МАКСИМУМ 50 слов во всем email контенте
- Фокус на эмоциях, а не на деталях
- Создай атмосферу, а не описывай факты
- Используй реальные цены и даты
- Все даты в будущем относительно ${actualCurrentDate}
- Ответ на русском языке
`;

  try {
    // Use OpenAI to generate dynamic email content
    const response = await generateWithOpenAI({
      prompt: contentPrompt,
      temperature: 0.4, // Balanced creativity for marketing content
      max_tokens: 1500
    });

    // Parse JSON response (extract from markdown if needed)
    let jsonString = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const contentData = JSON.parse(jsonString.trim());
    
    return {
      subject: contentData.subject,
      preheader: contentData.preheader,
      body: contentData.body,
      cta: contentData.cta,
      pricing: pricingData,
      dates: dateAnalysis,
      context: contextAnalysis,
      personalization: params.personalization_level,
      urgency: params.urgency_level
    };

  } catch (error) {
    log.error('ContentSpecialist', 'Failed to generate dynamic email content', {
      error: error.message,
      campaign_theme: destination,
      content_type: params.content_type
    });
    
    // Fallback error - no static fallback allowed per project rules
    throw new Error(`Не удалось сгенерировать email-контент для ${destination}: ${error.message}`);
  }
}

function createMarkdownContent(content: any): string {
  return `# ${content.subject}

**Preheader:** ${content.preheader}

## Основной контент

${content.body}

## Призыв к действию

- Основной: ${content.cta.primary}
- Дополнительный: ${content.cta.secondary}

## Данные о ценах

- Лучшая цена: ${content.pricing?.best_price || 'N/A'} ${content.pricing?.currency || ''}
- Количество предложений: ${content.pricing?.offers_count || 'N/A'}

## Анализ дат

- Оптимальные даты: ${content.dates?.optimal_dates?.join(', ') || 'N/A'}
- Сезон: ${content.dates?.season || 'N/A'}

## Контекст

- Направление: ${content.context?.destination || 'N/A'}
- Эмоциональные триггеры: ${content.context?.emotional_triggers || 'N/A'}
`;
}

// ============================================================================
// HANDOFF AND METADATA TOOLS
// ============================================================================

/**
 * Create handoff file for next specialist
 */
export const createHandoffFile = tool({
  name: 'create_handoff_file',
  description: 'Create handoff file to pass context to the next specialist',
  parameters: z.object({
    from_specialist: z.string().describe('Current specialist name'),
    to_specialist: z.string().describe('Next specialist name'),
    handoff_data: z.object({
      summary: z.string().describe('Summary of work completed'),
      key_outputs: z.array(z.string()).describe('Key files and outputs created'),
      context_for_next: z.string().describe('Important context for next specialist'),
      data_files: z.array(z.string()).describe('Data files created'),
      recommendations: z.array(z.string()).describe('Recommendations for next specialist'),
      content_context: z.object({
        campaign: z.object({
          id: z.string().describe('Campaign ID'),
          campaignPath: z.string().describe('Campaign folder path'),
          theme: z.string().describe('Campaign theme/destination')
        }).describe('Campaign information'),
        generated_content: z.object({
          subject: z.string().describe('Email subject line'),
          preheader: z.string().describe('Email preheader text'),
          body: z.string().describe('Email body content'),
          cta: z.object({
            primary: z.string().describe('Primary call-to-action'),
            secondary: z.string().describe('Secondary call-to-action')
          }).describe('Call-to-action elements'),
          pricing: z.object({
            best_price: z.string().nullable(),
            currency: z.string().nullable(),
            offers_count: z.number().nullable()
          }).nullable().describe('Pricing information'),
          dates: z.object({
            optimal_dates: z.array(z.string()).nullable(),
            season: z.string().nullable()
          }).nullable().describe('Date analysis'),
          context: z.object({
            destination: z.string().nullable(),
            emotional_triggers: z.string().nullable()
          }).nullable().describe('Context analysis')
        }).describe('Generated email content'),
        technical_requirements: z.object({
          email_clients: z.array(z.string()).nullable(),
          design_constraints: z.object({}).nullable()
        }).nullable().describe('Technical requirements'),
        design_brief: z.object({
          destination_context: z.object({
            name: z.string().nullable(),
            seasonal_advantages: z.string().nullable(),
            emotional_appeal: z.string().nullable(),
            market_position: z.string().nullable()
          }).nullable(),
          design_requirements: z.object({
            visual_style: z.string().nullable(),
            color_palette: z.string().nullable(),
            imagery_direction: z.string().nullable(),
            typography_mood: z.string().nullable()
          }).nullable()
        }).nullable().describe('Design brief for templates'),
        asset_manifest: z.object({
          manifestId: z.string().nullable(),
          images_count: z.number().nullable(),
          icons_count: z.number().nullable(),
          total_size: z.number().nullable()
        }).nullable().describe('Asset manifest summary')
      }).nullable().describe('Complete content context for Design Specialist')
    }),
    campaign_path: z.string().describe('Campaign folder path')
  }),
  execute: async ({ from_specialist, to_specialist, handoff_data, campaign_path }) => {
    try {
      console.log(`🤝 Creating handoff from ${from_specialist} to ${to_specialist}`);
      
      // Load asset manifest and design brief to include in handoff
      let assetManifest = null;
      let designBrief = null;
      
      try {
        const assetManifestPath = path.join(campaign_path, 'assets', 'manifests', 'asset-manifest.json');
        if (await fs.access(assetManifestPath).then(() => true).catch(() => false)) {
          const assetManifestData = await fs.readFile(assetManifestPath, 'utf-8');
          assetManifest = JSON.parse(assetManifestData);
          console.log('✅ Loaded asset manifest for handoff');
        }
        
        const designBriefPath = path.join(campaign_path, 'content', 'design-brief-from-context.json');
        if (await fs.access(designBriefPath).then(() => true).catch(() => false)) {
          const designBriefData = await fs.readFile(designBriefPath, 'utf-8');
          designBrief = JSON.parse(designBriefData);
          console.log('✅ Loaded design brief for handoff');
        }
      } catch (error) {
        console.warn('⚠️ Could not load asset manifest or design brief for handoff:', error.message);
      }
      
      // Ensure handoffs directory exists
      const handoffsDir = path.join(campaign_path, 'handoffs');
      await fs.mkdir(handoffsDir, { recursive: true });
      
      // Create handoff file
      const fileName = `${from_specialist.toLowerCase().replace(/\s+/g, '-')}-to-${to_specialist.toLowerCase().replace(/\s+/g, '-')}.json`;
      const filePath = path.join(handoffsDir, fileName);
      
      // Enhanced handoff data with asset manifest and design brief
      const enhancedHandoffData = {
        ...handoff_data,
        content_context: {
          ...handoff_data.content_context,
          asset_manifest: assetManifest ? {
            manifestId: assetManifest.manifestId,
            images_count: assetManifest.assetManifest?.images?.length || 0,
            icons_count: assetManifest.assetManifest?.icons?.length || 0,
            total_size: assetManifest.assetManifest?.images?.reduce((sum: number, img: any) => sum + (img.file_size || 0), 0) || 0
          } : null,
          design_brief: designBrief
        }
      };
      
      const handoffContent = {
        from_specialist,
        to_specialist,
        handoff_data: enhancedHandoffData,
        created_at: new Date().toISOString(),
        file_path: filePath,
        // КРИТИЧЕСКИ ВАЖНО: Сохранение content_context для Design Specialist
        content_context: enhancedHandoffData.content_context || null
      };
      
      await fs.writeFile(filePath, JSON.stringify(handoffContent, null, 2));
      
      console.log(`✅ Handoff file created: ${filePath}`);
      console.log(`📦 Asset manifest included: ${!!assetManifest}`);
      console.log(`🎨 Design brief included: ${!!designBrief}`);
      
      return `✅ Handoff file created successfully: ${fileName}. Context passed from ${from_specialist} to ${to_specialist}. Asset manifest: ${!!assetManifest}, Design brief: ${!!designBrief}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to create handoff file:', error);
      return `❌ Failed to create handoff file from ${from_specialist} to ${to_specialist}: ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

/**
 * Update campaign metadata to mark specialist as completed
 */
export const updateCampaignMetadata = tool({
  name: 'update_campaign_metadata',
  description: 'Update campaign metadata to mark specialist work as completed',
  parameters: z.object({
    campaign_path: z.string().describe('Campaign folder path'),
    specialist_name: z.string().describe('Name of specialist that completed work'),
    workflow_phase: z.string().describe('Current workflow phase'),
    additional_data: z.object({}).strict().nullable().optional().describe('Additional metadata to update')
  }),
  execute: async ({ campaign_path, specialist_name, workflow_phase, additional_data }) => {
    try {
      console.log(`📝 Updating campaign metadata for ${specialist_name}`);
      
      const metadataPath = path.join(campaign_path, 'campaign-metadata.json');
      
      // Read existing metadata
      let metadata;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        console.error('❌ Failed to read metadata file:', error);
        return `❌ Failed to read metadata file: ${error.message}`;
      }
      
      // Update specialists_completed
      const specialistKey = specialist_name.toLowerCase().replace(/\s+/g, '_').replace('_specialist', '');
      metadata.specialists_completed[specialistKey] = true;
      
      // Update workflow phase
      metadata.workflow_phase = workflow_phase;
      metadata.last_updated = new Date().toISOString();
      
      // Add any additional data
      if (additional_data) {
        Object.assign(metadata, additional_data);
      }
      
      // Write updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`✅ Campaign metadata updated for ${specialist_name}`);
      
      return `✅ Campaign metadata updated successfully. ${specialist_name} marked as completed. Workflow phase: ${workflow_phase}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to update campaign metadata:', error);
      return `❌ Failed to update campaign metadata for ${specialist_name}: ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export const contentSpecialistTools = [
  contextProvider,
  dateIntelligence,
  pricingIntelligence,
  assetStrategy,
  contentGenerator,
  createHandoffFile,
  updateCampaignMetadata,
  ...assetPreparationTools,
  ...technicalSpecificationTools
]; 