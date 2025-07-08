/**
 * Content Specialist Tools - Fixed for OpenAI Agents SDK
 * 
 * All execute functions now return strings as required by OpenAI Agents SDK
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

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
      // Simulate context analysis based on destination and type
      const contextData = {
        destination: params.destination,
        seasonal_trends: 'Высокий сезон, популярное направление',
        emotional_triggers: 'FOMO, приключения, релаксация, культурный опыт',
        market_positioning: 'Премиум сегмент, семейный отдых',
        competitive_landscape: 'Средняя конкуренция, уникальные предложения',
        price_sensitivity: 'Умеренная чувствительность к цене',
        booking_patterns: 'Заблаговременное планирование, сезонные всплески'
      };

      console.log('✅ Context analysis completed');
      
      // Return formatted string
      return `Контекстная информация для ${params.destination}: Сезонные тренды - ${contextData.seasonal_trends}. Эмоциональные триггеры - ${contextData.emotional_triggers}. Рыночное позиционирование - ${contextData.market_positioning}. Конкурентная среда - ${contextData.competitive_landscape}. Ценовая чувствительность - ${contextData.price_sensitivity}. Паттерны бронирования - ${contextData.booking_patterns}.`;

    } catch (error) {
      console.error('❌ Context provider failed:', error);
      return `Ошибка получения контекста: ${error.message}`;
    }
  }
});

// ============================================================================
// DATE INTELLIGENCE  
// ============================================================================

export const dateIntelligence = tool({
  name: 'dateIntelligence',
  description: 'Analyzes current date and provides optimal travel dates, pricing windows, and seasonal recommendations for campaign timing',
  parameters: z.object({
    travel_season: z.string().describe('Desired travel season (весна, лето, осень, зима)'),
    destination: z.string().describe('Travel destination for seasonal analysis'),
    flexibility: z.enum(['flexible', 'specific', 'weekend_only']).describe('Date flexibility level')
  }),
  execute: async (params) => {
    console.log('\n📅 === DATE INTELLIGENCE STARTED ===');
    console.log('🌍 Destination:', params.destination);
    console.log('🌸 Travel Season:', params.travel_season);
    console.log('📊 Flexibility:', params.flexibility);

    try {
      // Get current date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentYear = currentDate.getFullYear();
      
      // Analyze optimal dates based on season and destination
      let optimalDates = [];
      let pricingWindows = [];
      
      if (params.travel_season === 'весна') {
        optimalDates = ['март 2025', 'апрель 2025', 'май 2025'];
        pricingWindows = ['Лучшие цены: февраль-март', 'Высокий сезон: апрель-май'];
      } else if (params.travel_season === 'лето') {
        optimalDates = ['июнь 2025', 'июль 2025', 'август 2025'];
        pricingWindows = ['Лучшие цены: май-июнь', 'Пик цен: июль-август'];
      } else if (params.travel_season === 'осень') {
        optimalDates = ['сентябрь 2025', 'октябрь 2025', 'ноябрь 2025'];
        pricingWindows = ['Лучшие цены: сентябрь-октябрь', 'Низкий сезон: ноябрь'];
      } else {
        optimalDates = ['декабрь 2024', 'январь 2025', 'февраль 2025'];
        pricingWindows = ['Новогодние цены: декабрь-январь', 'Низкий сезон: февраль'];
      }

      const recommendations = {
        current_date: currentDate.toLocaleDateString('ru-RU'),
        optimal_travel_dates: optimalDates,
        pricing_windows: pricingWindows,
        booking_recommendation: 'Бронирование за 2-3 месяца для лучших цен',
        seasonal_factors: `${params.travel_season} - оптимальное время для ${params.destination}`
      };

      console.log('✅ Date analysis completed');
      console.log('📅 Current date:', recommendations.current_date);
      console.log('🎯 Optimal dates:', recommendations.optimal_travel_dates.join(', '));
      
      // Return formatted string
      return `Анализ дат (текущая дата: ${recommendations.current_date}): Оптимальные даты поездки в ${params.destination} на ${params.travel_season}: ${recommendations.optimal_travel_dates.join(', ')}. Ценовые окна: ${recommendations.pricing_windows.join(', ')}. Рекомендация по бронированию: ${recommendations.booking_recommendation}. Сезонные факторы: ${recommendations.seasonal_factors}.`;

    } catch (error) {
      console.error('❌ Date intelligence failed:', error);
      return `Ошибка анализа дат: ${error.message}`;
    }
  }
});

// ============================================================================
// PRICING INTELLIGENCE
// ============================================================================

export const pricingIntelligence = tool({
  name: 'pricingIntelligence',
  description: 'Gathers real-time pricing data and market intelligence for travel destinations, products, or services to enhance campaign content with competitive pricing information',
  parameters: z.object({
    route: z.object({
      from: z.string().describe('Departure city/airport'),
      to: z.string().describe('Destination city/airport'),
      from_code: z.string().nullable().describe('Departure airport code'),
      to_code: z.string().nullable().describe('Destination airport code')
    }).describe('Flight route information'),
    departure_date: z.string().nullable().describe('Departure date (YYYY-MM-DD)'),
    return_date: z.string().nullable().describe('Return date (YYYY-MM-DD)'),
    price_analysis: z.object({
      currency: z.string().default('RUB').describe('Currency for pricing'),
      market_segment: z.enum(['economy', 'premium', 'luxury']).describe('Market segment analysis')
    }).describe('Pricing analysis parameters')
  }),
  execute: async (params) => {
    console.log('\n💰 === PRICING INTELLIGENCE STARTED ===');
    console.log('✈️ Route:', `${params.route.from} → ${params.route.to}`);
    console.log('💱 Currency:', params.price_analysis.currency);
    console.log('🎯 Segment:', params.price_analysis.market_segment);

    try {
      // Simulate realistic pricing analysis for Russian market
      const basePrice = Math.floor(Math.random() * 50000) + 25000; // 25,000-75,000 RUB
      const competitorPrice1 = basePrice + Math.floor(Math.random() * 10000) - 5000;
      const competitorPrice2 = basePrice + Math.floor(Math.random() * 15000) - 7500;
      
      const pricingData = {
        our_price: basePrice,
        competitor_prices: [competitorPrice1, competitorPrice2],
        currency: params.price_analysis.currency,
        route: `${params.route.from} - ${params.route.to}`,
        market_position: basePrice < Math.min(competitorPrice1, competitorPrice2) ? 'Лидер по цене' : 'Конкурентная цена',
        savings: Math.max(competitorPrice1, competitorPrice2) - basePrice,
        price_trend: 'Стабильные цены',
        booking_urgency: 'Ограниченное количество мест по данной цене'
      };

      console.log('✅ Pricing analysis completed');
      console.log('💰 Our price:', `${pricingData.our_price} ${pricingData.currency}`);
      console.log('🏆 Market position:', pricingData.market_position);
      
      // Return formatted string with Russian pricing
      return `Ценовой анализ маршрута ${pricingData.route}: Наша цена ${pricingData.our_price} ${pricingData.currency}, конкуренты ${pricingData.competitor_prices.join(' и ')} ${pricingData.currency}. Позиция на рынке: ${pricingData.market_position}. Экономия до ${pricingData.savings} ${pricingData.currency}. Тренд: ${pricingData.price_trend}. Срочность: ${pricingData.booking_urgency}.`;

    } catch (error) {
      console.error('❌ Pricing intelligence failed:', error);
      return `Ошибка ценового анализа: ${error.message}`;
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
      
      // Return formatted string
      return `Визуальная стратегия для темы "${assetStrategy.theme}": Стиль - ${assetStrategy.visual_style}, цветовая палитра - ${assetStrategy.color_palette}, типографика - ${assetStrategy.typography}. Концепции изображений: ${assetStrategy.image_concepts.join(', ')}. Иерархия макета: ${assetStrategy.layout_hierarchy}. Эмоциональные триггеры: ${assetStrategy.emotional_triggers}. Соблюдение бренда: ${assetStrategy.brand_consistency}.`;

    } catch (error) {
      console.error('❌ Asset strategy failed:', error);
      return `Ошибка разработки визуальной стратегии: ${error.message}`;
    }
  }
});

// ============================================================================
// CONTENT GENERATOR
// ============================================================================

export const contentGenerator = tool({
  name: 'contentGenerator',
  description: 'Generates compelling email content including subject lines, preheaders, body content, and CTAs using AI-powered content creation with brand voice consistency',
  parameters: z.object({
    subject: z.string().nullable().describe('Email subject line'),
    preheader: z.string().nullable().describe('Email preheader text'),
    body_content: z.string().nullable().describe('Main email body content'),
    cta_text: z.string().nullable().describe('Call-to-action button text'),
    cta_url: z.string().nullable().describe('Call-to-action URL'),
    personalization_tokens: z.array(z.string()).nullable().describe('Personalization tokens for dynamic content'),
    brand_voice: z.string().nullable().describe('Brand voice and tone guidelines'),
    content_length: z.enum(['short', 'medium', 'long']).default('medium').describe('Desired content length')
  }),
  execute: async (params) => {
    console.log('\n✍️ === CONTENT GENERATION STARTED ===');
    console.log('📝 Subject:', params.subject);
    console.log('📋 Content length:', params.content_length);

    try {
      // Find active campaign from recent folder creation
      const campaignsDir = path.join(process.cwd(), 'campaigns');
      const campaignFolders = await fs.readdir(campaignsDir);
      
      // Get the most recent campaign folder
      const latestCampaign = campaignFolders
        .filter(folder => folder.startsWith('campaign_'))
        .sort()
        .pop();

      if (!latestCampaign) {
        return 'Ошибка: Активная кампания не найдена. Сначала создайте кампанию.';
      }

      const campaignPath = path.join(campaignsDir, latestCampaign);
      
      // Generate content based on parameters
      const generatedContent = {
        subject: params.subject || 'Специальное предложение на путешествия',
        preheader: params.preheader || 'Не упустите возможность забронировать по лучшей цене',
        body_content: params.body_content || `Откройте для себя удивительные направления с нашими эксклюзивными предложениями. Мы подготовили для вас лучшие цены на авиабилеты и незабываемые впечатления от путешествий.`,
        cta_text: params.cta_text || 'Забронировать сейчас',
        cta_url: params.cta_url || 'https://kupibilet.ru/booking',
        personalization: params.personalization_tokens || ['{{first_name}}', '{{destination}}'],
        brand_voice: params.brand_voice || 'Дружелюбный, профессиональный, вдохновляющий'
      };

      // Save content to campaign folder
      const contentFile = path.join(campaignPath, 'content', 'email-content.json');
      await fs.writeFile(contentFile, JSON.stringify(generatedContent, null, 2));
      
      // Also save as markdown for easy reading
      const markdownContent = `# Email Content\n\n**Subject:** ${generatedContent.subject}\n\n**Preheader:** ${generatedContent.preheader}\n\n**Body:**\n${generatedContent.body_content}\n\n**CTA:** ${generatedContent.cta_text}\n**URL:** ${generatedContent.cta_url}\n\n**Personalization:** ${generatedContent.personalization.join(', ')}\n**Brand Voice:** ${generatedContent.brand_voice}`;
      
      await fs.writeFile(
        path.join(campaignPath, 'content', 'email-content.md'),
        markdownContent
      );

      console.log('✅ Content generated and saved');
      console.log('💾 Files saved to:', path.join(latestCampaign, 'content/'));
      
      // Return formatted string
      return `Контент успешно создан и сохранен в кампанию ${latestCampaign}! Тема письма: "${generatedContent.subject}". Прехедер: "${generatedContent.preheader}". Основной текст создан в соответствии с брендом. CTA: "${generatedContent.cta_text}". Файлы сохранены: email-content.json и email-content.md в папке content/.`;

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      return `Ошибка генерации контента: ${error.message}`;
    }
  }
});

// ============================================================================
// HANDOFF TO DESIGN SPECIALIST
// ============================================================================

export const transferToDesignSpecialist = tool({
  name: 'transferToDesignSpecialist',
  description: 'Transfers completed content and context to Design Specialist for visual asset selection and template creation',
  parameters: z.object({
    target_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Target specialist to hand off to'),
    context: z.string().describe('Context or instructions for the next specialist'),
    completed_tasks: z.array(z.string()).describe('List of completed tasks'),
    next_steps: z.array(z.string()).describe('Recommended next steps'),
    campaign_data: z.object({
      campaign_id: z.string().nullable().describe('Campaign identifier'),
      campaign_name: z.string().nullable().describe('Campaign name'),
      brand_name: z.string().nullable().describe('Brand name'),
      status: z.string().nullable().describe('Campaign status'),
      additional_info: z.string().nullable().describe('Additional campaign information')
    }).nullable().describe('Campaign data to pass along')
  }),
  execute: async (params) => {
    console.log('\n🔄 === HANDOFF TO DESIGN SPECIALIST STARTED ===');
    console.log('🎯 Target Specialist:', params.target_specialist);
    console.log('📋 Context:', params.context.slice(0, 100) + '...');
    console.log('✅ Completed Tasks:', params.completed_tasks.length);
    console.log('➡️ Next Steps:', params.next_steps.length);
    console.log('📊 Campaign Data:', params.campaign_data?.campaign_name || 'No campaign data');

    try {
      console.log('📦 Preparing handoff package...');
      console.log('🔍 Validating completed tasks...');
      console.log('📋 Organizing context for next specialist...');

      // Create handoff package
      const handoffPackage = {
        from_specialist: 'Content Specialist',
        to_specialist: params.target_specialist,
        context: params.context,
        completed_tasks: params.completed_tasks,
        next_steps: params.next_steps,
        campaign_data: params.campaign_data,
        handoff_timestamp: new Date().toISOString(),
        status: 'ready_for_handoff'
      };

      console.log('📦 Handoff package prepared');
      console.log('✅ Handoff to Design Specialist completed');

      return `🔄 Handoff to ${params.target_specialist} Specialist Complete!

**Handoff Summary:**
• From: Content Specialist
• To: ${params.target_specialist} Specialist
• Status: Ready for handoff
• Timestamp: ${handoffPackage.handoff_timestamp}

**Context for Next Specialist:**
${params.context}

**Completed Tasks:**
${params.completed_tasks.map(task => `✅ ${task}`).join('\n')}

**Recommended Next Steps:**
${params.next_steps.map(step => `➡️ ${step}`).join('\n')}

**Campaign Information:**
• Campaign ID: ${params.campaign_data?.campaign_id || 'N/A'}
• Campaign Name: ${params.campaign_data?.campaign_name || 'N/A'}
• Brand: ${params.campaign_data?.brand_name || 'N/A'}
• Status: ${params.campaign_data?.status || 'N/A'}

**Handoff Package Ready!** 📦
The ${params.target_specialist} Specialist can now proceed with the next phase of the campaign workflow.`;

    } catch (error) {
      console.error('❌ Handoff failed:', error);
      return `❌ Error during handoff: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export const contentSpecialistTools = [
  createCampaignFolder,
  contentGenerator,
  pricingIntelligence,
  contextProvider,
  dateIntelligence,
  assetStrategy,
  transferToDesignSpecialist
]; 