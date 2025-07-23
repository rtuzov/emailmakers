/**
 * AI Template Designer
 * AI-powered template design generation before MJML coding
 */

import { tool, Agent, run } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { buildDesignContext as _buildDesignContext } from './design-context';
import { TemplateDesign } from './types';

/**
 * AI Template Design Sub-Agent
 * Uses OpenAI Agents SDK patterns for AI generation
 */
const templateDesignAgent = new Agent({
  name: 'Template Design AI',
  model: 'gpt-4o-mini', // Faster model for JSON generation
  modelSettings: {
    temperature: 0.3, // Lower temperature for more consistent JSON
    maxTokens: 8000 // Reasonable limit for JSON response
  },
  instructions: `Ты эксперт по email дизайну и верстке. Создавай профессиональные email шаблоны с учетом всех технических требований.

ТВОЯ ЗАДАЧА: Создать детальный дизайн email шаблона в формате JSON с АВТОМАТИЧЕСКИМ ВНЕДРЕНИЕМ ЛУЧШИХ ПРАКТИК.

🚀 АВТОМАТИЧЕСКИЕ УЛУЧШЕНИЯ ДЛЯ ВНЕДРЕНИЯ:

1. 📸 ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ:
   - Создавай секцию gallery с grid-layout для множественных изображений
   - Используй ВСЕ доступные изображения (5+), не только 1-2
   - Добавляй hover-эффекты и подписи к изображениям

2. 📐 ОПТИМИЗАЦИЯ СТРУКТУРЫ:
   - Уменьшай количество вложенных элементов (цель: <600 строк HTML)
   - Объединяй секции с похожим контентом
   - Используй компактные блоки benefits вместо длинных списков

3. 🎨 УЛУЧШЕННАЯ ТИПОГРАФИКА:
   - Добавляй visual hierarchy с 4-5 уровнями размеров шрифтов
   - Используй gradient backgrounds для важных секций
   - Добавляй text shadows и современные эффекты

4. 📱 АДАПТИВНОСТЬ:
   - Создавай 3+ breakpoints (mobile/tablet/desktop)
   - Добавляй touch-friendly кнопки (min 44px)
   - Responsive images с srcset

5. 🎯 CTA ОПТИМИЗАЦИЯ:
   - Размещай primary CTA в fold (верхняя часть)
   - Добавляй multiple CTA с разными стилями
   - Включай urgency indicators рядом с кнопками

6. 💎 МИКРОИНТЕРАКЦИИ:
   - Добавляй hover states для всех кнопок
   - Transition effects для плавности
   - Loading states для кнопок

ВСЕГДА возвращай ТОЛЬКО валидный JSON без дополнительных комментариев или markdown форматирования.

Структура JSON должна включать:
- template_id, template_name, description
- target_audience, visual_concept
- layout (type, max_width, sections_count, visual_hierarchy, spacing_system)

КРИТИЧНО - spacing_system ОБЯЗАТЕЛЕН:
{
  "spacing_system": {
    "section_padding": "20px",
    "element_margin": "10px",
    "text_line_height": "1.5",
    "button_padding": "12px 24px"
  }
}
- sections (массив с header, hero, gallery, content, cta, footer)
- components (кнопки, карточки, галерея)
- responsive (breakpoints с adjustments)
- accessibility (alt_texts, color_contrast, font_sizes)
- email_client_optimizations (outlook, gmail, apple_mail)
- performance (size targets, optimization)
- improvements_applied (список автоматически внедренных улучшений)

Используй предоставленный контекст для создания уникального и продуманного дизайна.`
});

/**
 * Generate AI-powered template design using sub-agent
 */
async function generateAITemplateDesign(params: {
  contentContext: any;
  designBrief: any;
  assetManifest: any;
  techSpec: any;
  emailContent: any;      // ✅ Rich email content
  pricingAnalysis: any;   // ✅ Real pricing data
  assetStrategy: any;     // ✅ Visual direction
  dateAnalysis: any;      // ✅ Timing context
  designRequirements: any;
  traceId: string;
}): Promise<TemplateDesign> {
  const { 
    contentContext, 
    designBrief, 
    assetManifest, 
    techSpec: _techSpec, 
    emailContent,
    pricingAnalysis,
    assetStrategy,
    dateAnalysis,
    designRequirements: _designRequirements,
    traceId 
  } = params;
  
  // ✅ EXTRACT RICH CONTENT FROM LOADED FILES - PRIORITIZE REAL DATA
  
  // Subject and preheader from email content (rich source)
  const subject = emailContent?.subject_line?.primary || 
                 contentContext.generated_content?.subject || 
                 contentContext.subject || 
                 'Email кампания';
  
  const subjectAlternative = emailContent?.subject_line?.alternative;
  const preheader = emailContent?.preheader || contentContext.generated_content?.preheader;
  
  // Body content - use structured email content
  const headline = emailContent?.headline?.main || 'Заголовок кампании';
  const subheadline = emailContent?.headline?.subheadline;
  const openingText = emailContent?.body?.opening;
  const mainContent = emailContent?.body?.main_content;
  const benefits = emailContent?.body?.benefits || [];
  const socialProof = emailContent?.body?.social_proof;
  const urgencyElements = emailContent?.body?.urgency_elements;
  const closingText = emailContent?.body?.closing;
  
  // ✅ EXTRACT REAL PRICING DATA
  const bestOfferPrice = pricingAnalysis?.overall_analysis?.best_offer?.price;
  const cheapestPrice = pricingAnalysis?.overall_analysis?.price_range?.min;
  const currency = pricingAnalysis?.overall_analysis?.currency || 'RUB';
  const realPrice = bestOfferPrice || cheapestPrice || pricingAnalysis?.optimal_dates_pricing?.cheapest_on_optimal;
  const formattedPrice = realPrice ? `${realPrice.toLocaleString('ru-RU')} ${currency}` : 'Цена по запросу';
  
  // ✅ EXTRACT CTA FROM EMAIL CONTENT
  const primaryCTA = emailContent?.call_to_action?.primary?.text || 'Забронировать';
  const secondaryCTA = emailContent?.call_to_action?.secondary?.text || 'Узнать больше';
  
  // ✅ EXTRACT DATES AND TIMING
  const optimalDates = dateAnalysis?.optimal_dates || pricingAnalysis?.date_analysis_source?.optimal_dates || [];
  const formattedDates = optimalDates.slice(0, 3).join(', ');
  const seasonalInfo = dateAnalysis?.seasonal_factors || pricingAnalysis?.date_analysis_source?.seasonal_factors;
  
  // ✅ EXTRACT DESTINATION INFO
  const destination = dateAnalysis?.destination || 
                     pricingAnalysis?.destination || 
                     contentContext.context_analysis?.destination || 
                     'место назначения';
  
  // ✅ EXTRACT EMOTIONAL HOOKS AND TRIGGERS
  const emotionalHooks = emailContent?.emotional_hooks || {};
  // Reconstruct body for backward compatibility
  
  // ✅ EXTRACT BRAND COLORS FROM ASSET STRATEGY (RICH SOURCE)
  const primaryColor = assetStrategy?.visual_direction?.color_palette?.primary ||
                      designBrief.design_requirements?.primary_color || 
                      designBrief.brand_colors?.primary || 
                      '#4BFF7E';
  const accentColor = assetStrategy?.visual_direction?.color_palette?.secondary ||
                     assetStrategy?.visual_direction?.color_palette?.accent ||
                     designBrief.design_requirements?.accent_color || 
                     designBrief.brand_colors?.accent || 
                     '#FF6240';
  const backgroundColor = assetStrategy?.visual_direction?.color_palette?.background ||
                         designBrief.design_requirements?.background_color || 
                         designBrief.brand_colors?.background || 
                         '#EDEFFF';
                         
  // ✅ EXTRACT VISUAL STYLE FROM ASSET STRATEGY
  const visualStyle = assetStrategy?.visual_direction?.primary_style || 
                     assetStrategy?.visual_direction?.mood ||
                     designBrief.visual_style || 
                     'modern';
  
  // Extract assets information - handle both local and external assets properly
  // ✅ ИСПРАВЛЕНО: Поддержка прямой и вложенной структуры assetManifest
  const images = Array.isArray(assetManifest?.images) ? assetManifest.images : 
                 Array.isArray(assetManifest?.assetManifest?.images) ? assetManifest.assetManifest.images : [];
  const icons = Array.isArray(assetManifest?.icons) ? assetManifest.icons :
                Array.isArray(assetManifest?.assetManifest?.icons) ? assetManifest.assetManifest.icons : [];
  
  console.log(`🔍 Processing assets: ${images.length} images, ${icons.length} icons`);
  console.log(`📊 Asset manifest structure:`, {
    hasAssetManifest: !!assetManifest,
    hasDirectImages: !!assetManifest?.images,
    hasNestedManifest: !!assetManifest?.assetManifest,
    hasNestedImages: !!assetManifest?.assetManifest?.images,
    manifestKeys: assetManifest ? Object.keys(assetManifest) : [],
    nestedKeys: assetManifest?.assetManifest ? Object.keys(assetManifest.assetManifest) : []
  });
  
  // ✅ ИСПРАВЛЕНО: Добавлены проверки безопасности для массивов
  // Separate local and external images with safe array operations
  const localImages = Array.isArray(images) ? images.filter((img: any) => 
    img.purpose !== 'external_image' && !img.isExternal && !img.path?.startsWith('http')
  ) : [];
  const externalImages = Array.isArray(images) ? images.filter((img: any) => 
    img.purpose === 'external_image' || img.isExternal || img.path?.startsWith('http')
  ) : [];
  const totalImages = images.length;
  
  console.log(`📊 Asset breakdown: ${localImages.length} local, ${externalImages.length} external images`);
  
  // Find specific assets for template - prioritize external images for hero
  const heroAsset = externalImages[0] || localImages[0] || images[0];
  
  // ✅ ИСПРАВЛЕНО: Безопасное создание contentAssets с проверками
  // Use remaining images for content sections
  const contentAssets = [
    ...(Array.isArray(externalImages) ? externalImages.slice(1) : []),  // Use external images first
    ...(Array.isArray(localImages) ? localImages.slice(heroAsset === localImages[0] ? 1 : 0) : [])  // Then local images
  ].slice(0, 3);
  
  // ✅ ИСПРАВЛЕНО: Дополнительная проверка что contentAssets является массивом
  const safeContentAssets = Array.isArray(contentAssets) ? contentAssets : [];
  
  console.log(`🎯 Selected hero asset: ${heroAsset?.filename || 'REQUIRED'} (external: ${heroAsset?.isExternal})`);
  console.log(`📷 Content assets: ${safeContentAssets.length} selected`);

  const templateDesignPrompt = `
Ты - эксперт по дизайну email-кампаний. Создай ДЕТАЛЬНЫЙ и КОНКРЕТНЫЙ дизайн-план email шаблона как ИНСТРУКЦИЯ ДЛЯ JUNIOR РАЗРАБОТЧИКА.

🔍 === ПОЛНЫЙ АНАЛИЗ КАМПАНИИ ===

📧 ОСНОВНЫЕ ДАННЫЕ КАМПАНИИ:
• Основная тема: "${subject}"
• Альтернативная тема: "${subjectAlternative || 'не указана'}"
• Preheader: "${preheader || 'не указан'}"
• Направление: ${destination}
• Реальная цена: ${formattedPrice}
• Оптимальные даты: ${formattedDates || 'не указаны'}

🎯 СТРУКТУРИРОВАННЫЙ КОНТЕНТ:
• Заголовок: "${headline}"
• Подзаголовок: "${subheadline || 'не указан'}"
• Текст открытия: "${openingText || 'не указан'}"
• Основной контент: "${mainContent || 'не указан'}"
• Преимущества (${benefits.length}): ${benefits.map((b: string) => `"${b}"`).join(', ')}
• Социальное доказательство: "${socialProof || 'не указано'}"
• Элементы срочности: "${urgencyElements || 'не указаны'}"
• Текст закрытия: "${closingText || 'не указан'}"

🎨 ВИЗУАЛЬНАЯ СТРАТЕГИЯ:
• Стиль: "${visualStyle}"
• Настроение: "${assetStrategy?.visual_direction?.mood || 'REQUIRED'}"
• Основной цвет: ${primaryColor}
• Акцентный цвет: ${accentColor}  
• Фон: ${backgroundColor}
• Типы ассетов: ${assetStrategy?.asset_types?.map((a: any) => a.type).join(', ') || 'REQUIRED'}

🖼️ ДОСТУПНЫЕ АССЕТЫ (ТОЧНЫЕ ПУТИ):
Всего изображений: ${totalImages} | Локальных: ${localImages.length} | Внешних: ${externalImages.length} | Иконок: ${icons.length}

HERO ИЗОБРАЖЕНИЕ:
- Файл: ${heroAsset?.filename || 'REQUIRED'}
- Путь: ${heroAsset?.path || heroAsset?.url || 'REQUIRED'}
- Описание: "${heroAsset?.alt_text || heroAsset?.description || 'REQUIRED'}"
- Тип: ${heroAsset?.isExternal ? 'Внешнее (используй URL)' : 'Локальное (используй путь)'}

КОНТЕНТНЫЕ ИЗОБРАЖЕНИЯ:
${safeContentAssets.map((asset, i) => 
  `${i+1}. ${asset.filename || 'unnamed'}
     Путь: ${asset.path || asset.url || 'REQUIRED'}
     Описание: "${asset.alt_text || asset.description || 'REQUIRED'}"
     Тип: ${asset.isExternal ? 'Внешнее' : 'Локальное'}`
).join('\n')}

⚡ ЭМОЦИОНАЛЬНЫЕ ТРИГГЕРЫ:
${Object.keys(emotionalHooks).length > 0 ? 
  Object.entries(emotionalHooks).map(([key, value]) => `• ${key}: ${value}`).join('\n') : 
  '• REQUIRED EMOTIONAL TRIGGERS'}

📅 СЕЗОННЫЙ КОНТЕКСТ:
${seasonalInfo || 'REQUIRED SEASONAL INFO'}

🎯 ЗАДАЧА: СОЗДАЙ ДЕТАЛЬНУЮ ИНСТРУКЦИЮ ДЛЯ JUNIOR РАЗРАБОТЧИКА

ТРЕБОВАНИЯ К ДЕТАЛИЗАЦИИ:
1. **ТОЧНЫЕ РАЗМЕРЫ**: Укажи конкретные размеры в пикселях для КАЖДОГО элемента
2. **ТОЧНЫЕ ПОЗИЦИИ**: Опиши где ИМЕННО располагать каждый элемент
3. **ТОЧНЫЕ ЦВЕТА**: Используй HEX коды для всех цветов
4. **ТОЧНЫЕ ШРИФТЫ**: Укажи конкретные размеры шрифтов и веса
5. **ТОЧНЫЕ АССЕТЫ**: Используй ТОЧНЫЕ пути из списка выше
6. **ТОЧНЫЕ ОТСТУПЫ**: Укажи padding и margin в пикселях
7. **ТОЧНЫЙ КОНТЕНТ**: Используй ВЕСЬ предоставленный контент, не сокращай

СТРУКТУРА ОТВЕТА:
1. ОПРЕДЕЛИ тип кампании (промо/инфо/премиум/срочность)
2. ВЫБЕРИ цветовую схему под тематику
3. СОЗДАЙ детальную структуру секций (7-10 секций)
4. ДЛЯ КАЖДОЙ СЕКЦИИ укажи:
   - ТОЧНОЕ положение (header/hero/content1/content2/cta/footer/etc.)
   - ТОЧНЫЕ размеры блока (width, height, padding)
   - ТОЧНЫЙ фон (цвет или изображение с путем)
   - ТОЧНОЕ содержимое (какой текст, какие изображения)
   - ТОЧНУЮ типографику (размер, вес, цвет шрифта)
   - ТОЧНЫЕ отступы между элементами
   - ТОЧНЫЕ пути к изображениям из списка выше

🚀 УЛУЧШЕНИЯ ДЛЯ ВНЕДРЕНИЯ:

1. 📸 ИЗОБРАЖЕНИЯ: 
   - Используй ВСЕ ${totalImages || 0} доступных изображений
   - Создай секцию gallery если изображений >2

2. 📐 СТРУКТУРА:
   - Оптимизируй для HTML <600 строк  
   - Компактные benefits блоки

3. 🎯 CTA:
   - Primary: "${primaryCTA}"
   - Secondary: "${secondaryCTA}"

КРИТИЧНО ВАЖНО:
- Используй ВСЕ benefits из списка в компактном формате
- Включи social proof и urgency elements с визуальными индикаторами
- Используй реальную цену ${formattedPrice}
- Размести ВСЕ ${totalImages || 0} изображений в gallery секции
- Создай конкретные размеры для оптимизации (цель <600 строк HTML)
- Укажи ТОЧНЫЕ HEX цвета для каждого элемента
- Добавь improvements_applied массив с внедренными улучшениями

📝 ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Используй реальные CTA кнопки: "${primaryCTA}" и "${secondaryCTA}"
- Включи оптимальные даты: ${formattedDates}
- Адаптируй дизайн под анализ контента и сезонность
- Создавай инструкции для junior разработчика: конкретно, подробно, с точными размерами

ВЕРНИ ДЕТАЛЬНЫЙ JSON с полной структурой template design согласно интерфейсу TemplateDesign.

🚨 ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (НЕ МОГУТ БЫТЬ NULL):
{
  "template_name": "guatemala_autumn_2025", // ОБЯЗАТЕЛЬНО - уникальное имя
  "layout": {
    "type": "single-column", // ОБЯЗАТЕЛЬНО - single-column/multi-column/grid
    "max_width": 600,
    "responsive_breakpoints": ["600px", "480px"]
  },
  "sections": [...], // ОБЯЗАТЕЛЬНО - минимум 7 секций
  "components": [...], // ОБЯЗАТЕЛЬНО - минимум 5 компонентов
  "visual_concept": {
    "theme": "travel_adventure", // ОБЯЗАТЕЛЬНО
    "style": "modern_clean", // ОБЯЗАТЕЛЬНО  
    "mood": "exciting_trustworthy" // ОБЯЗАТЕЛЬНО
  },
  "target_audience": "travelers_families", // ОБЯЗАТЕЛЬНО
  "improvements_applied": [
    "gallery_integration",
    "structure_optimization", 
    "cta_enhancement"
  ] // ОБЯЗАТЕЛЬНО - список примененных улучшений
}

ПРОВЕРЬ что ВСЕ обязательные поля заполнены ПЕРЕД отправкой ответа!
`;

  // 🤖 CALL AI AGENT TO GENERATE TEMPLATE DESIGN WITH TIMEOUT
  console.log('🎨 Calling AI to generate detailed template design...');
  console.log('📏 Template prompt length:', templateDesignPrompt.length, 'characters');
  
  // Add timeout to prevent hanging (increased to 3 minutes for complex prompts)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI Template Design generation timed out after 180 seconds')), 180000);
  });
  
  const result = await Promise.race([
    run(templateDesignAgent, templateDesignPrompt),
    timeoutPromise
  ]) as any;
  
  let templateDesign;
  try {
    // Parse AI response as JSON with enhanced validation
    const aiResponse = result.finalOutput?.trim() || '{}';
    console.log('🔍 DEBUG: AI response length:', aiResponse.length);
    console.log('🔍 DEBUG: AI response preview:', aiResponse.substring(0, 200) + '...');
    
    const cleanResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    console.log('🔍 DEBUG: Cleaned response preview:', cleanResponse.substring(0, 200) + '...');
    
    templateDesign = JSON.parse(cleanResponse);
    console.log('✅ AI generated template design successfully');
    console.log('🔍 DEBUG: Template name in response:', templateDesign?.template_name);
    console.log('🔍 DEBUG: Layout type in response:', templateDesign?.layout?.type);
  } catch (parseError) {
    console.error('❌ AI Template Design generation failed:', parseError);
    throw new Error(`Failed to generate template design: AI response could not be parsed. ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
  }

  // 🚨 CRITICAL VALIDATION: Check required fields
  if (!templateDesign.template_name || templateDesign.template_name === null) {
    templateDesign.template_name = `guatemala_template_${Date.now()}`;
    console.log('⚠️ Template name was null, using fallback:', templateDesign.template_name);
  }

  if (!templateDesign.layout || !templateDesign.layout.type || templateDesign.layout.type === null) {
    templateDesign.layout = {
      type: 'single-column',
      max_width: 600,
      responsive_breakpoints: ['600px', '480px']
    };
    console.log('⚠️ Layout was null, using fallback: single-column');
  }

  // CRITICAL FIX: Ensure spacing_system is always present
  if (!templateDesign.layout.spacing_system) {
    templateDesign.layout.spacing_system = {
      "xs": "4px",
      "sm": "8px", 
      "md": "16px",
      "lg": "24px",
      "xl": "32px",
      "2xl": "40px"
    };
    console.log('⚠️ Spacing system was missing, using fallback spacing system');
  }

  if (!templateDesign.sections || templateDesign.sections.length === 0) {
    throw new Error('AI Template Design failed: sections array is empty or null. AI must provide at least 7 sections.');
  }

  if (!templateDesign.components || templateDesign.components.length === 0) {
    throw new Error('AI Template Design failed: components array is empty or null. AI must provide at least 5 components.');
  }

  if (!templateDesign.visual_concept || !templateDesign.visual_concept.theme) {
    templateDesign.visual_concept = {
      theme: 'travel_adventure',
      style: 'modern_clean',
      mood: 'exciting_trustworthy'
    };
    console.log('⚠️ Visual concept was null, using fallback');
  }

  if (!templateDesign.target_audience || templateDesign.target_audience === null) {
    templateDesign.target_audience = 'travelers_families';
    console.log('⚠️ Target audience was null, using fallback');
  }

  // Add metadata to AI generated design
    templateDesign.metadata = {
      generated_at: new Date().toISOString(),
    generated_by: 'AI Template Designer (No Fallbacks)',
      campaign_id: contentContext.campaign?.id,
    trace_id: traceId || 'NO_TRACE'
    };
    
    return templateDesign;

}

/**
 * AI-powered template design generation tool
 */
export const generateTemplateDesign = tool({
  name: 'generateTemplateDesign',
  description: 'AI-powered template design generation - creates detailed template structure, layout, and visual hierarchy before MJML coding',
  parameters: z.object({
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    design_requirements: z.object({}).strict().nullable().describe('Design requirements and brand guidelines'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n🎨 === AI TEMPLATE DESIGNER (OpenAI Agents SDK) ===');
    
    // Load content context from OpenAI SDK context parameter
    let contentContext;
    
    if ((context as any)?.designContext?.content_context) {
      contentContext = (context as any).designContext.content_context;
      console.log('✅ Using content context from design context (loaded by loadDesignContext)');
    } else {
      throw new Error('Content context not found in design context. loadDesignContext must be called first to load campaign context.');
    }
    
    // Get campaign path from design context (set by loadDesignContext)
    const campaignPath = (context as any).designContext.campaign_path;
    if (!campaignPath) {
      throw new Error('Campaign path is missing from design context. loadDesignContext must provide valid campaign path.');
    }
    
    console.log(`📋 Campaign: ${contentContext.campaign?.id || 'REQUIRED_ID'}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`🎯 AI Template Design Generation using OpenAI Agents SDK`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'NO_TRACE'}`);

    try {
      // Load asset manifest
      const assetManifest = (context as any)?.designContext?.asset_manifest;
      if (!assetManifest) {
        throw new Error('Asset manifest not found in design context. processContentAssets must be completed before template design.');
      }
      
      // Load comprehensive content files
      const designBriefPath = path.join(campaignPath, 'content', 'design-brief-from-context.json');
      const emailContentPath = path.join(campaignPath, 'content', 'email-content.json');
      const pricingAnalysisPath = path.join(campaignPath, 'content', 'pricing-analysis.json');
      const assetStrategyPath = path.join(campaignPath, 'content', 'asset-strategy.json');
      const dateAnalysisPath = path.join(campaignPath, 'content', 'date-analysis.json');
      const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
      
      console.log('📋 Loading comprehensive campaign content for AI enrichment...');
      
      // Load design brief
      let designBrief;
      try {
        if (await fs.access(designBriefPath).then(() => true).catch(() => false)) {
          const designBriefContent = await fs.readFile(designBriefPath, 'utf8');
          designBrief = JSON.parse(designBriefContent);
          console.log('✅ Loaded design brief from file');
        } else {
          throw new Error('Design brief file not found. All content files must be loaded before template design generation.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error loading design brief:', errorMessage);
        throw new Error(`Design brief loading failed: ${errorMessage}`);
      }
      
      // Load email content
      let emailContent;
      try {
        if (await fs.access(emailContentPath).then(() => true).catch(() => false)) {
          const emailContentData = await fs.readFile(emailContentPath, 'utf8');
          emailContent = JSON.parse(emailContentData);
          console.log('✅ Loaded email content with rich details');
        } else {
          console.log('⚠️ Email content not found');
        }
      } catch (error) {
        console.error('⚠️ Error loading email content:', error);
      }

      // Load pricing analysis
      let pricingAnalysis;
      try {
        if (await fs.access(pricingAnalysisPath).then(() => true).catch(() => false)) {
          const pricingData = await fs.readFile(pricingAnalysisPath, 'utf8');
          pricingAnalysis = JSON.parse(pricingData);
          console.log('✅ Loaded pricing analysis with cost details');
        } else {
          console.log('⚠️ Pricing analysis not found');
        }
      } catch (error) {
        console.error('⚠️ Error loading pricing analysis:', error);
      }

      // Load asset strategy
      let assetStrategy;
      try {
        if (await fs.access(assetStrategyPath).then(() => true).catch(() => false)) {
          const assetStrategyData = await fs.readFile(assetStrategyPath, 'utf8');
          assetStrategy = JSON.parse(assetStrategyData);
          console.log('✅ Loaded asset strategy with visual direction');
        } else {
          console.log('⚠️ Asset strategy not found');
        }
      } catch (error) {
        console.error('⚠️ Error loading asset strategy:', error);
      }

      // Load date analysis
      let dateAnalysis;
      try {
        if (await fs.access(dateAnalysisPath).then(() => true).catch(() => false)) {
          const dateAnalysisData = await fs.readFile(dateAnalysisPath, 'utf8');
          dateAnalysis = JSON.parse(dateAnalysisData);
          console.log('✅ Loaded date analysis with seasonal insights');
        } else {
          console.log('⚠️ Date analysis not found');
        }
      } catch (error) {
        console.error('⚠️ Error loading date analysis:', error);
      }

      // Load technical specification
      let techSpec;
      try {
        if (await fs.access(techSpecPath).then(() => true).catch(() => false)) {
          const techSpecData = await fs.readFile(techSpecPath, 'utf8');
          techSpec = JSON.parse(techSpecData);
          console.log('✅ Loaded technical specification');
        } else {
          console.log('⚠️ Technical specification not found');
      }
      } catch (error) {
        console.error('⚠️ Error loading technical specification:', error);
      }

      // Call AI generation with full context
      const templateDesign = await generateAITemplateDesign({
        contentContext,
        designBrief,
        assetManifest,
        techSpec,
        emailContent,
        pricingAnalysis,
        assetStrategy,
        dateAnalysis,
        designRequirements: params.design_requirements,
        traceId: params.trace_id || 'NO_TRACE'
      });

      // Save template design to file
      const designDir = path.join(campaignPath, 'design');
      await fs.mkdir(designDir, { recursive: true });
      const templateDesignPath = path.join(designDir, 'template-design.json');
      await fs.writeFile(templateDesignPath, JSON.stringify(templateDesign, null, 2));
      console.log(`✅ Template design saved to: ${templateDesignPath}`);

      // Update design context with template design
      const updatedDesignContext = {
        ...(context as any).designContext,
        template_design: templateDesign,
        template_design_path: templateDesignPath
      };

      if (context) {
        (context as any).designContext = updatedDesignContext;
      }

      console.log('✅ AI Template Design completed successfully (OpenAI Agents SDK)');
      console.log(`📊 Sections: ${templateDesign.sections?.length || 0}`);
      console.log(`🎨 Layout: ${templateDesign.layout?.type || 'undefined'}`);
      console.log(`📱 Responsive: ${Object.keys(templateDesign.responsive?.breakpoints || {}).length} breakpoints`);
      const componentsCount = Array.isArray(templateDesign.components) 
        ? templateDesign.components.length 
        : Object.keys(templateDesign.components || {}).length;
      console.log(`🎯 Components: ${componentsCount} custom components`);

      return `AI Template Design completed successfully using OpenAI Agents SDK! Generated ${templateDesign.sections?.length || 0} sections with ${templateDesign.layout?.type || 'custom'} layout. Responsive design with ${Object.keys(templateDesign.responsive?.breakpoints || {}).length} breakpoints. Created ${componentsCount} custom components. Visual hierarchy optimized for ${templateDesign.target_audience || 'target users'}. Design saved to: ${templateDesignPath}. Ready for MJML template generation.`;

    } catch (error) {
      console.error('❌ AI Template Design failed:', error);
      throw error;
    }
  }
}); 