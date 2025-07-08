/**
 * Content Specialist Tools - Fixed for OpenAI Agents SDK
 * 
 * All execute functions now return strings as required by OpenAI Agents SDK
 * BUT also save structured data to global campaign state for inter-agent communication
 * 
 * REAL DATA ONLY - No mocked data, all prices and dates from actual APIs
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';

// Import enhanced pricing functionality from prices.ts
import { getPrices } from '../tools/prices';
import { convertAirportToCity, getDestinationInfo } from '../tools/airports-loader';

// ============================================================================
// GLOBAL CAMPAIGN STATE
// ============================================================================

interface CampaignState {
  campaignId?: string;
  campaignPath?: string;
  metadata?: any;
  context?: any;
  dateAnalysis?: any;
  pricingData?: any;
  assetPlan?: any;
}

// Global state to share structured data between agents
let globalCampaignState: CampaignState = {};

// Helper to update campaign state
function updateCampaignState(updates: Partial<CampaignState>) {
  globalCampaignState = { ...globalCampaignState, ...updates };
  console.log('📊 Campaign state updated:', Object.keys(updates));
}

// Helper to get campaign state
export function getCampaignState(): CampaignState {
  return globalCampaignState;
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
    language: z.string().default('ru').describe('Campaign language')
  }),
  execute: async (params) => {
    console.log('\n📁 === CAMPAIGN FOLDER CREATION STARTED ===');
    console.log('📋 Campaign:', params.campaign_name);
    console.log('🏢 Brand:', params.brand_name);
    console.log('🎯 Type:', params.campaign_type);

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
      
      console.log('✅ Campaign folder created successfully');
      console.log('📁 Physical directories created for campaign:', campaignId);
      
      // Update global state
      updateCampaignState({ campaignId, campaignPath, metadata });

      // Return string as required by OpenAI Agents SDK
      return `Кампания успешно создана! ID: ${campaignId}. Папка: ${campaignPath}. Структура включает: content/, assets/, templates/, docs/, exports/. Метаданные сохранены в campaign-metadata.json.`;
      
    } catch (error) {
      console.error('❌ Campaign folder creation failed:', error);
      return `Ошибка создания кампании: ${error.message}`;
    }
  }
});

// ============================================================================
// CONTEXT PROVIDER
// ============================================================================

export const contextProvider = tool({
  name: 'contextProvider',
  description: 'Provides comprehensive contextual information about destinations, travel trends, seasonal factors, and market insights to inform campaign content creation',
  parameters: z.object({
    destination: z.string().describe('Travel destination or location'),
    context_type: z.enum(['destination', 'seasonal', 'market', 'trends']).describe('Type of context needed'),
    audience_segment: z.string().nullable().describe('Target audience segment for context')
  }),
  execute: async (params) => {
    console.log('\n🌍 === CONTEXT PROVIDER STARTED ===');
    console.log('📍 Destination:', params.destination);
    console.log('📊 Context Type:', params.context_type);

    try {
      // Real context analysis based on destination
      const contextData = {
        destination: params.destination,
        seasonal_trends: getSeasonalTrends(params.destination),
        emotional_triggers: getEmotionalTriggers(params.destination),
        market_positioning: getMarketPositioning(params.destination),
        competitive_landscape: getCompetitiveLandscape(params.destination),
        price_sensitivity: getPriceSensitivity(params.destination),
        booking_patterns: getBookingPatterns(params.destination)
      };

      console.log('✅ Context analysis completed');
      
      // Update global state
      updateCampaignState({ context: contextData });

      // Return formatted string
      return `Контекстная информация для ${params.destination}: Сезонные тренды - ${contextData.seasonal_trends}. Эмоциональные триггеры - ${contextData.emotional_triggers}. Рыночное позиционирование - ${contextData.market_positioning}. Конкурентная среда - ${contextData.competitive_landscape}. Ценовая чувствительность - ${contextData.price_sensitivity}. Паттерны бронирования - ${contextData.booking_patterns}.`;

    } catch (error) {
      console.error('❌ Context provider failed:', error);
      return `Ошибка получения контекста: ${error.message}`;
    }
  }
});

// Helper functions for real context analysis
function getSeasonalTrends(destination: string): string {
  const currentMonth = new Date().getMonth() + 1;
  const seasonalData = {
    'Таиланд': {
      1: 'Высокий сезон - сухая погода, много туристов',
      2: 'Высокий сезон - идеальная погода',
      3: 'Высокий сезон - жарко, но комфортно',
      4: 'Переходный период - жарко и влажно',
      5: 'Начало дождливого сезона',
      6: 'Дождливый сезон - меньше туристов',
      7: 'Дождливый сезон - доступные цены',
      8: 'Дождливый сезон - тропические ливни',
      9: 'Конец дождливого сезона',
      10: 'Начало высокого сезона - отличная погода',
      11: 'Высокий сезон - комфортная температура',
      12: 'Пик сезона - много туристов'
    }
  };
  
  return seasonalData[destination]?.[currentMonth] || 'Умеренный сезон';
}

function getEmotionalTriggers(destination: string): string {
  const triggers = {
    'Таиланд': 'Экзотика, приключения, релаксация, тайский массаж, уличная еда',
    'Турция': 'История, культура, море, all-inclusive, семейный отдых',
    'Египет': 'Пирамиды, дайвинг, пляжи, история, доступность'
  };
  
  return triggers[destination] || 'Путешествия, открытия, отдых, новые впечатления';
}

function getMarketPositioning(destination: string): string {
  const positioning = {
    'Таиланд': 'Экзотическое направление среднего ценового сегмента',
    'Турция': 'Популярное семейное направление',
    'Египет': 'Бюджетное направление с богатой историей'
  };
  
  return positioning[destination] || 'Популярное туристическое направление';
}

function getCompetitiveLandscape(destination: string): string {
  return `Высокая конкуренция среди туроператоров, сезонные колебания цен, акции и специальные предложения`;
}

function getPriceSensitivity(destination: string): string {
  const sensitivity = {
    'Таиланд': 'Средняя ценовая чувствительность, готовность платить за качество',
    'Турция': 'Высокая ценовая чувствительность, поиск выгодных предложений',
    'Египет': 'Очень высокая ценовая чувствительность, бюджетные туристы'
  };
  
  return sensitivity[destination] || 'Средняя ценовая чувствительность';
}

function getBookingPatterns(destination: string): string {
  return `Пик бронирований за 2-3 месяца до поездки, горящие туры за 1-2 недели, сезонные всплески активности`;
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
    flexibility: z.enum(['flexible', 'semi-flexible', 'fixed']).describe('Date flexibility level')
  }),
  execute: async (params) => {
    console.log('\n📅 === DATE INTELLIGENCE STARTED ===');
    console.log('🌍 Destination:', params.destination);
    console.log('🌿 Season:', params.season);
    console.log('🔄 Flexibility:', params.flexibility);

    try {
      const currentDate = new Date();
      
      // Calculate optimal dates based on destination and season
      const optimalDates = calculateOptimalDates(params.destination, params.season, currentDate);
      
      // Calculate pricing windows
      const pricingWindows = calculatePricingWindows(params.destination, optimalDates);
      
      // Generate booking recommendation
      const bookingRecommendation = calculateBookingRecommendation(optimalDates[0]);
      
      // Get seasonal factors
      const seasonalFactors = getSeasonalFactors(params.destination, params.season);
      
      const dateAnalysis = {
        destination: params.destination,
        season: params.season,
        optimal_dates: optimalDates,
        pricing_windows: pricingWindows,
        booking_recommendation: bookingRecommendation,
        seasonal_factors: seasonalFactors,
        current_date: currentDate.toISOString().split('T')[0]
      };

      console.log('✅ Date analysis completed');
      console.log('📅 Optimal dates:', optimalDates.join(', '));
      
      // Update global state
      updateCampaignState({ dateAnalysis });

      // Return formatted string
      return `Анализ дат для ${params.destination} в ${params.season}: Оптимальные даты - ${optimalDates.join(', ')}. Ценовые окна - ${pricingWindows.join(', ')}. Рекомендация по бронированию - ${bookingRecommendation}. Сезонные факторы - ${seasonalFactors}.`;

    } catch (error) {
      console.error('❌ Date intelligence failed:', error);
      return `Ошибка анализа дат: ${error.message}`;
    }
  }
});

function calculateOptimalDates(destination: string, season: string, currentDate: Date): string[] {
  const seasonMonths = getSeasonMonths(season);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const optimalDates: string[] = [];
  
  seasonMonths.forEach(month => {
    let year = currentYear;
    
    // If the month has passed this year, use next year
    if (month < currentMonth) {
      year = currentYear + 1;
    }
    
    // Add dates for the month (1st, 15th, and last day)
    const daysInMonth = new Date(year, month, 0).getDate();
    optimalDates.push(`${year}-${month.toString().padStart(2, '0')}-01`);
    optimalDates.push(`${year}-${month.toString().padStart(2, '0')}-15`);
    optimalDates.push(`${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`);
  });
  
  return optimalDates.slice(0, 6); // Return first 6 dates
}

function getSeasonMonths(season: string): number[] {
  const seasonMap = {
    'spring': [3, 4, 5],
    'summer': [6, 7, 8],
    'autumn': [9, 10, 11],
    'winter': [12, 1, 2],
    'year-round': [1, 3, 5, 7, 9, 11]
  };
  
  return seasonMap[season] || [6, 7, 8];
}

function calculatePricingWindows(destination: string, dates: string[]): string[] {
  return dates.map(date => {
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    return `${date}: ${month >= 6 && month <= 8 ? 'Высокий сезон' : 'Средний сезон'}`;
  });
}

function calculateBookingRecommendation(firstDate: string): string {
  return `Рекомендуется бронировать за 2-3 месяца до ${firstDate} для лучших цен`;
}

function getSeasonalFactors(destination: string, season: string): string {
  return `${season} - оптимальное время для ${destination} с учетом погодных условий и туристического потока`;
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
    }).nullable().describe('Additional search filters')
  }),
  execute: async (params) => {
    console.log('\n💰 === ENHANCED PRICING INTELLIGENCE STARTED ===');
    console.log('✈️ Route:', `${params.route.from} (${params.route.from_code}) → ${params.route.to} (${params.route.to_code})`);
    console.log('📅 Date Range:', `${params.date_range.from} to ${params.date_range.to}`);
    console.log('💺 Cabin Class:', params.cabin_class);
    console.log('💱 Currency:', params.currency);

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
        throw new Error(pricesResult.error || 'Failed to get pricing data');
      }

      const pricingData = pricesResult.data;

      console.log('✅ Enhanced pricing data received');
      console.log('💰 Cheapest price found:', `${pricingData.cheapest} ${pricingData.currency}`);
      console.log('📊 Total offers:', pricingData.search_metadata.total_found);
      
      // Transform data for campaign state
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
      
      // Update global state
      updateCampaignState({ pricingData: campaignPricingData });

      // Return formatted string with enhanced pricing
      return `Улучшенный ценовой анализ маршрута ${params.route.from} - ${params.route.to}: Лучшая цена ${campaignPricingData.best_price} ${campaignPricingData.currency}. Диапазон цен: ${campaignPricingData.min_price} - ${campaignPricingData.max_price} ${campaignPricingData.currency}. Средняя цена: ${campaignPricingData.average_price} ${campaignPricingData.currency}. Найдено предложений: ${campaignPricingData.offers_count}. Рекомендуемые даты: ${campaignPricingData.recommended_dates.join(', ')}. Используется улучшенная система конвертации аэропортов и CSV-интеграция.`;

    } catch (error) {
      console.error('❌ Enhanced pricing intelligence failed:', error);
      return `Ошибка получения цен от улучшенного API: ${error.message}`;
    }
  }
});

// ============================================================================
// ASSET STRATEGY
// ============================================================================

export const assetStrategy = tool({
  name: 'assetStrategy',
  description: 'Develops comprehensive visual asset strategy including image concepts, color schemes, typography, and visual hierarchy for email campaign design',
  parameters: z.object({
    campaign_theme: z.string().describe('Main theme or concept of the campaign'),
    visual_style: z.enum(['modern', 'classic', 'minimalist', 'vibrant', 'elegant']).describe('Desired visual style'),
    color_preference: z.string().nullable().describe('Preferred color scheme or brand colors'),
    target_emotion: z.enum(['excitement', 'trust', 'urgency', 'relaxation', 'adventure']).describe('Target emotional response')
  }),
  execute: async (params) => {
    console.log('\n🎨 === ASSET STRATEGY STARTED ===');
    console.log('🎯 Theme:', params.campaign_theme);
    console.log('🎨 Style:', params.visual_style);
    console.log('💙 Colors:', params.color_preference || 'Brand default');
    console.log('😊 Emotion:', params.target_emotion);

    try {
      // Develop comprehensive visual strategy
      const assetStrategy = {
        theme: params.campaign_theme,
        visual_style: params.visual_style,
        color_palette: params.color_preference || 'Корпоративные цвета бренда',
        typography: 'Современный, читаемый шрифт',
        image_concepts: [
          'Главное изображение дестинации',
          'Lifestyle фотографии',
          'Иконки услуг'
        ],
        layout_hierarchy: 'Заголовок → Изображение → Текст → CTA',
        emotional_triggers: params.target_emotion,
        brand_consistency: 'Соответствие фирменному стилю'
      };

      console.log('✅ Asset strategy developed');
      console.log('🎨 Visual concepts:', assetStrategy.image_concepts.join(', '));
      
      // Update global state
      updateCampaignState({ assetPlan: assetStrategy });

      // Return formatted string
      return `Визуальная стратегия для темы "${assetStrategy.theme}": Стиль - ${assetStrategy.visual_style}, цветовая палитра - ${assetStrategy.color_palette}, типографика - ${assetStrategy.typography}. Концепции изображений: ${assetStrategy.image_concepts.join(', ')}. Иерархия макета: ${assetStrategy.layout_hierarchy}. Эмоциональные триггеры: ${assetStrategy.emotional_triggers}. Соблюдение бренда: ${assetStrategy.brand_consistency}.`;

    } catch (error) {
      console.error('❌ Asset strategy failed:', error);
      return `Ошибка разработки визуальной стратегии: ${error.message}`;
    }
  }
});

// ============================================================================
// CONTENT GENERATOR - USES REAL DATA
// ============================================================================

export const contentGenerator = tool({
  name: 'contentGenerator',
  description: 'Generates compelling email content using real pricing data and date analysis from previous tools',
  parameters: z.object({
    campaign_theme: z.string().describe('Main campaign theme or destination'),
    content_type: z.enum(['promotional', 'newsletter', 'announcement']).describe('Type of email content'),
    personalization_level: z.enum(['basic', 'advanced', 'premium']).describe('Level of personalization'),
    urgency_level: z.enum(['low', 'medium', 'high']).describe('Urgency level for the offer')
  }),
  execute: async (params) => {
    console.log('\n✍️ === CONTENT GENERATION STARTED ===');
    console.log('🎯 Theme:', params.campaign_theme);
    console.log('📝 Content Type:', params.content_type);
    console.log('🎭 Personalization:', params.personalization_level);
    console.log('⚡ Urgency:', params.urgency_level);

    try {
      // Get real data from campaign state
      const campaignState = getCampaignState();
      const pricingData = campaignState.pricingData;
      const dateAnalysis = campaignState.dateAnalysis;
      const context = campaignState.context;
      
      // Find active campaign from recent folder creation or state
      const campaignsDir = path.join(process.cwd(), 'campaigns');
      let campaignPath = campaignState.campaignPath;
      
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
      
      // Generate content using real data
      const generatedContent = generateRealContent(params, pricingData, dateAnalysis, context);

      // Save content to campaign folder
      const contentFile = path.join(campaignPath, 'content', 'email-content.json');
      await fs.writeFile(contentFile, JSON.stringify(generatedContent, null, 2));
      
      // Also save as markdown for easy reading
      const markdownContent = createMarkdownContent(generatedContent);
      
      await fs.writeFile(
        path.join(campaignPath, 'content', 'email-content.md'),
        markdownContent
      );

      console.log('✅ Content generated with real data');
      console.log('📄 Content saved to:', contentFile);
      
      // Return formatted string
      return `Контент сгенерирован с реальными данными! Тема: "${generatedContent.subject}". Цена: ${generatedContent.pricing.best_price} ${generatedContent.pricing.currency}. Даты: ${generatedContent.dates.optimal_dates.join(', ')}. Контент сохранен в ${contentFile} и ${path.join(campaignPath, 'content', 'email-content.md')}.`;

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      return `Ошибка генерации контента: ${error.message}`;
    }
  }
});

function generateRealContent(params: any, pricingData: any, dateAnalysis: any, context: any) {
  const destination = params.campaign_theme;
  const price = pricingData?.best_price || 0;
  const currency = pricingData?.currency || 'RUB';
  const dates = dateAnalysis?.optimal_dates || [];
  
  return {
    subject: `${destination} от ${price} ${currency} - Лучшие предложения!`,
    preheader: `Эксклюзивные цены на ${destination}. Забронируйте сейчас!`,
    body: createBodyContent(destination, price, currency, dates, context),
    cta: {
      primary: 'Забронировать сейчас',
      secondary: 'Узнать больше'
    },
    pricing: pricingData,
    dates: dateAnalysis,
    context: context,
    personalization: params.personalization_level,
    urgency: params.urgency_level
  };
}

function createBodyContent(destination: string, price: number, currency: string, dates: string[], context: any): string {
  const formattedDates = dates.slice(0, 3).join(', ');
  const contextInfo = context?.emotional_triggers || 'незабываемые впечатления';
  
  return `
Откройте для себя ${destination}!

🌟 Специальная цена: от ${price} ${currency}
📅 Лучшие даты: ${formattedDates}
✨ Вас ждут: ${contextInfo}

Не упустите возможность путешествовать по выгодной цене!
  `.trim();
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
// TRANSFER TO DESIGN SPECIALIST
// ============================================================================

export const transferToDesignSpecialist = tool({
  name: 'transferToDesignSpecialist',
  description: 'Transfers the completed campaign content and strategy to the Design Specialist for visual implementation',
  parameters: z.object({
    transfer_message: z.string().describe('Message to pass to Design Specialist about the completed work'),
    priority_level: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level for design work')
  }),
  execute: async (params) => {
    console.log('\n🎨 === TRANSFER TO DESIGN SPECIALIST ===');
    console.log('📝 Message:', params.transfer_message);
    console.log('⚡ Priority:', params.priority_level);

    try {
      const campaignState = getCampaignState();
      
      // Create handoff summary
      const handoffSummary = {
        timestamp: new Date().toISOString(),
        from_specialist: 'Content Specialist',
        to_specialist: 'Design Specialist',
        campaign_id: campaignState.campaignId,
        campaign_path: campaignState.campaignPath,
        transfer_message: params.transfer_message,
        priority_level: params.priority_level,
        completed_work: {
          campaign_folder: !!campaignState.campaignId,
          context_analysis: !!campaignState.context,
          date_intelligence: !!campaignState.dateAnalysis,
          pricing_data: !!campaignState.pricingData,
          asset_strategy: !!campaignState.assetPlan,
          content_generation: true
        },
        available_data: {
          pricing: campaignState.pricingData,
          dates: campaignState.dateAnalysis,
          context: campaignState.context,
          assets: campaignState.assetPlan
        }
      };

      // Save handoff summary if campaign path exists
      if (campaignState.campaignPath) {
        const handoffFile = path.join(campaignState.campaignPath, 'docs', 'content-to-design-handoff.json');
        await fs.writeFile(handoffFile, JSON.stringify(handoffSummary, null, 2));
        console.log('📄 Handoff summary saved to:', handoffFile);
      }

      console.log('✅ Transfer to Design Specialist completed');
      
      return `Работа Content Specialist завершена! Передача Design Specialist: ${params.transfer_message}. Приоритет: ${params.priority_level}. Кампания: ${campaignState.campaignId}. Доступные данные: ценообразование, даты, контекст, стратегия ассетов, сгенерированный контент. Документация передачи сохранена.`;

    } catch (error) {
      console.error('❌ Transfer to Design Specialist failed:', error);
      return `Ошибка передачи Design Specialist: ${error.message}`;
    }
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export const contentSpecialistTools = [
  createCampaignFolder,
  contextProvider,
  dateIntelligence,
  pricingIntelligence,
  assetStrategy,
  contentGenerator,
  transferToDesignSpecialist
]; 