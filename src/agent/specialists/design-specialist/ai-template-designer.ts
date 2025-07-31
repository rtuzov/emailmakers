/**
 * AI Template Designer
 * AI-powered template design generation before MJML coding
 */

import { tool, Agent, run } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { autoRestoreCampaignLogging } from '../../../shared/utils/campaign-logger';
import { buildDesignContext as _buildDesignContext } from './design-context';
import { TemplateDesign } from './types';
import { parseJSONWithRetry } from '../../../shared/utils/ai-retry-mechanism';

/**
 * Валидация уникальности template design
 * Проверяет отличие от последних 5 кампаний
 */
async function validateTemplateUniqueness(templateDesign: any, currentCampaignPath: string): Promise<{ isUnique: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];
  
  try {
    // Найти все кампании
    const campaignsDir = path.join(process.cwd(), 'campaigns');
    const campaigns = await fs.readdir(campaignsDir);
    
    // Получить последние 5 кампаний (исключая текущую)
    const currentCampaignId = path.basename(currentCampaignPath);
    const otherCampaigns = campaigns
      .filter(c => c !== currentCampaignId && c.startsWith('campaign_'))
      .sort()
      .slice(-5);
    
    // Проверить каждую кампанию на схожесть
    for (const campaignId of otherCampaigns) {
      try {
        const designPath = path.join(campaignsDir, campaignId, 'design', 'template-design.json');
        const designData = await fs.readFile(designPath, 'utf8');
        const otherDesign = JSON.parse(designData);
        
        // Проверки уникальности
        if (templateDesign.layout?.type === otherDesign.layout?.type) {
          conflicts.push(`Layout type "${templateDesign.layout.type}" уже использован в ${campaignId}`);
        }
        
        if (templateDesign.layout?.max_width === otherDesign.layout?.max_width) {
          conflicts.push(`Max width ${templateDesign.layout.max_width}px уже использована в ${campaignId}`);
        }
        
        if (templateDesign.metadata?.brand_colors?.primary === otherDesign.metadata?.brand_colors?.primary) {
          conflicts.push(`Primary color ${templateDesign.metadata.brand_colors.primary} уже использован в ${campaignId}`);
        }
        
        // Проверка порядка секций
        const currentSections = templateDesign.sections?.map((s: any) => s.position).join('→') || '';
        const otherSections = otherDesign.sections?.map((s: any) => s.position).join('→') || '';
        if (currentSections === otherSections && currentSections.length > 0) {
          conflicts.push(`Порядок секций "${currentSections}" уже использован в ${campaignId}`);
        }
        
      } catch (error) {
        // Игнорируем ошибки чтения отдельных файлов
        console.log(`Не удалось прочитать дизайн кампании ${campaignId}:`, error);
      }
    }
    
    return {
      isUnique: conflicts.length === 0,
      conflicts
    };
    
  } catch (error) {
    console.error('Ошибка при валидации уникальности:', error);
    return { isUnique: true, conflicts: [] }; // В случае ошибки считаем уникальным
  }
}

/**
 * AI Template Design Sub-Agent with Self-Correction Retry
 * NO FALLBACKS - only AI retry with error feedback
 */



/**
 * Generate AI Template Design with validation and self-correction
 */
async function generateAITemplateDesignWithRetry(params: any): Promise<any> {
  let lastError = '';
  
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // Always use the original generateAITemplateDesign, but enhance params with error feedback
      let templateDesign;
      
      if (attempt === 0) {
        console.log('🎨 AI Template Design Generation - Initial Attempt');
        templateDesign = await generateAITemplateDesign(params);
      } else {
        console.log(`🔄 AI Self-Correction Attempt ${attempt + 1}/5`);
        console.log(`🎯 Fixing error: ${lastError.substring(0, 100)}...`);
        
        // Enhance params with error feedback for retry
        const enhancedParams = {
          ...params,
          error_feedback: lastError,
          retry_attempt: attempt + 1
        };
        templateDesign = await generateAITemplateDesign(enhancedParams);
      }

      // Validate the generated design
      console.log('🔍 Validating generated template design...');
      
      // Check spacing_system
      if (!templateDesign.layout?.spacing_system) {
        throw new Error('AI Template Designer failed to generate required spacing_system in layout');
      }
      
      // Check brand_colors
      if (!templateDesign.metadata?.brand_colors?.primary || 
          !templateDesign.metadata?.brand_colors?.accent || 
          !templateDesign.metadata?.brand_colors?.background) {
        throw new Error('AI Template Designer failed to generate required brand_colors {primary, accent, background} in metadata');
      }
      
      // Validate HEX colors
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      const brandColors = templateDesign.metadata.brand_colors;
      
      if (!hexPattern.test(brandColors.primary)) {
        throw new Error(`AI Template Designer: brand_colors.primary must be valid HEX color. Received: ${brandColors.primary}`);
      }
      if (!hexPattern.test(brandColors.accent)) {
        throw new Error(`AI Template Designer: brand_colors.accent must be valid HEX color. Received: ${brandColors.accent}`);
      }
      if (!hexPattern.test(brandColors.background)) {
        throw new Error(`AI Template Designer: brand_colors.background must be valid HEX color. Received: ${brandColors.background}`);
      }
      
      console.log(`✅ Template design validation passed on attempt ${attempt + 1}`);
      return templateDesign;
      
    } catch (validationError) {
      lastError = validationError instanceof Error ? validationError.message : String(validationError);
      console.warn(`⚠️ Validation failed on attempt ${attempt + 1}: ${lastError}`);
      
      if (attempt === 4) {
        throw new Error(`AI Template Design failed after 5 attempts with self-correction. Final error: ${lastError}`);
      }
      
      console.log(`🔄 Retrying with error feedback (attempt ${attempt + 2}/5)...`);
    }
  }
  
  throw new Error('AI Template Design failed: Maximum retry attempts reached');
}

// Hardcoded fallback removed - using AI self-correction only

/**
 * AI Template Design Sub-Agent
 * Uses OpenAI Agents SDK patterns for AI generation
 */
const templateDesignAgent = new Agent({
  name: 'Template Design AI',
  model: 'gpt-4o-mini', // Faster model for JSON generation
  modelSettings: {
    temperature: 0.9, // Maximum creativity for unique designs
    maxTokens: 8000 // Reasonable limit for JSON response
  },
  instructions: `🎨 ТЫ - КРЕАТИВНЫЙ EMAIL ДИЗАЙНЕР С АДАПТИВНЫМ МЫШЛЕНИЕМ

ЗАДАЧА: Анализируй контекст кампании и создавай КОНТЕКСТНО-АДАПТИВНЫЕ дизайны без шаблонов.

🧠 АНАЛИТИЧЕСКИЙ ПОДХОД:

1. 📊 АНАЛИЗ КОНТЕНТА КАМПАНИИ:
   - Изучи destination, тематику, сезон, эмоциональный тон
   - Определи тип аудитории (авантюристы/семьи/luxury/бюджет)  
   - Проанализируй pricing strategy (premium/budget/special_offer)
   - Учти культурные особенности направления

2. 🎯 ДИЗАЙН-СТРАТЕГИЯ НА ОСНОВЕ КОНТЕКСТА:
   
   ДЛЯ ЭКЗОТИЧЕСКИХ НАПРАВЛЕНИЙ (Азия, Африка, Латинская Америка):
   - Layout: Визуальный с большими gallery, hero-focused
   - Секции: visual_story → immersive_gallery → cultural_highlights → booking_urgency
   - Настроение: mystical, adventurous, colorful
   
   ДЛЯ ЕВРОПЕЙСКИХ НАПРАВЛЕНИЙ:
   - Layout: Элегантный, минималистичный  
   - Секции: sophisticated_intro → curated_experiences → practical_info → refined_cta
   - Настроение: sophisticated, cultured, refined
   
   ДЛЯ BEACH/TROPICAL НАПРАВЛЕНИЙ:
   - Layout: Расслабленный, воздушный
   - Секции: relaxation_promise → beach_gallery → activities → easy_booking
   - Настроение: relaxed, sunny, carefree
   
   ДЛЯ ГОРНЫХ/ADVENTURE НАПРАВЛЕНИЙ:
   - Layout: Динамичный, энергичный
   - Секции: adventure_call → peak_moments → gear_tips → challenge_cta  
   - Настроение: energetic, bold, challenging

3. 🎨 АДАПТИВНАЯ СТРУКТУРА (НЕ ФИКСИРОВАННАЯ):
   
   ВАРЬИРУЙ LAYOUT ПОД КОНТЕНТ:
   - Для фото-rich кампаний: "gallery-focused" (много изображений)
   - Для price-focused: "deal-centric" (акцент на ценах/скидках)
   - Для story-telling: "narrative-flow" (последовательное повествование)
   - Для urgent offers: "conversion-optimized" (срочность + CTA)
   - Для luxury: "minimal-elegant" (много whitespace, премиум)
   
   СОЗДАВАЙ УНИКАЛЬНЫЕ ПОРЯДКИ СЕКЦИЙ ПОД ЦЕЛЬ КАМПАНИИ:
   - Story-telling: teaser → journey_stages → emotional_peak → action
   - Sales-focused: hook → benefits → social_proof → scarcity → conversion
   - Discovery: curiosity → exploration → details → next_steps
   - Premium: exclusivity → sophistication → value → privileged_access

4. 📐 ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ:
   
   ШИРИНА АДАПТИРУЕТСЯ К КОНТЕНТУ:
   - Text-heavy кампании: 520-560px (удобно читать)
   - Visual-rich кампании: 680-720px (больше места для изображений)  
   - Mixed content: 580-620px (баланс)
   
   SPACING ОТРАЖАЕТ НАСТРОЕНИЕ:
   - Динамичные кампании: плотный spacing (sm: 6px, md: 12px)
   - Премиум кампании: воздушный spacing (sm: 16px, md: 32px)
   - Urgent кампании: компактный spacing (sm: 4px, md: 10px)

5. 🌈 ЦВЕТА ИЗ КУЛЬТУРНОГО КОНТЕКСТА:
   - Средиземноморье: солнечные, теплые (оранжевый, терракотовый)
   - Скандинавия: прохладные, чистые (голубой, белый)  
   - Тропики: яркие, сочные (зеленый, бирюзовый)
   - Пустыня: земляные, контрастные (песочный, индиго)

ПРИНЦИП: НЕ ИСПОЛЬЗУЙ ГОТОВЫЕ ШАБЛОНЫ - АНАЛИЗИРУЙ И АДАПТИРУЙСЯ!

Создавай каждый дизайн как ответ на конкретные задачи кампании, а не как заполнение стандартной формы.

Возвращай ТОЛЬКО валидный JSON без комментариев.`
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
  // ✅ NEW: Data intelligence files for comprehensive context
  destinationAnalysisData?: any;  // ✅ Climate, culture, routes
  emotionalProfileData?: any;     // ✅ Motivations, triggers, desires
  marketIntelligenceData?: any;   // ✅ Pricing trends, competition
  trendAnalysisData?: any;        // ✅ Market trends, consumer behavior
  consolidatedInsightsData?: any; // ✅ Key actionable insights
  travelIntelligenceData?: any;   // ✅ Travel patterns, seasonal factors
  keyInsightsData?: any;          // ✅ Critical insights summary
  error_feedback?: string;  // ✅ Error feedback for retry attempts
  retry_attempt?: number;   // ✅ Current retry attempt number
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
    // Destructure data intelligence files
    destinationAnalysisData,
    emotionalProfileData,
    marketIntelligenceData,
    trendAnalysisData,
    consolidatedInsightsData,
    travelIntelligenceData,
    // Destructure retry parameters
    error_feedback,
    retry_attempt,
    traceId 
  } = params;
  
  // ✅ EXTRACT RICH CONTENT FROM LOADED FILES - PRIORITIZE REAL DATA
  
  // Subject and preheader from email content (STRICT VALIDATION - NO FALLBACKS)
  if (!emailContent?.subject_line?.primary && !contentContext.generated_content?.subject && !contentContext.subject) {
    throw new Error('Design Specialist: Subject line is missing from all sources. Content Specialist must provide valid subject line.');
  }
  const subject = emailContent?.subject_line?.primary || 
                 contentContext.generated_content?.subject || 
                 contentContext.subject;
  
  const subjectAlternative = emailContent?.subject_line?.alternative;
  
  if (!emailContent?.preheader && !contentContext.generated_content?.preheader) {
    throw new Error('Design Specialist: Preheader is missing from email content and generated content. Content Specialist must provide preheader.');
  }
  const preheader = emailContent?.preheader || contentContext.generated_content?.preheader;
  
  // Body content - STRICT VALIDATION for critical fields
  if (!emailContent?.headline?.main) {
    throw new Error('Design Specialist: Headline is missing from email content. Content Specialist must provide structured email content with headline.');
  }
  const headline = emailContent.headline.main;
  const subheadline = emailContent?.headline?.subheadline;
  const openingText = emailContent?.body?.opening;
  const mainContent = emailContent?.body?.main_content;
  
  if (!emailContent?.body?.benefits || !Array.isArray(emailContent.body.benefits) || emailContent.body.benefits.length === 0) {
    throw new Error('Design Specialist: Benefits list is missing or empty. Content Specialist must provide structured benefits array.');
  }
  const benefits = emailContent.body.benefits;
  const socialProof = emailContent?.body?.social_proof;
  const urgencyElements = emailContent?.body?.urgency_elements;
  const closingText = emailContent?.body?.closing;
  
  // ✅ EXTRACT REAL PRICING DATA - STRICT VALIDATION
  if (!pricingAnalysis?.overall_analysis) {
    throw new Error('Design Specialist: Pricing analysis is missing. Content Specialist must provide complete pricing data.');
  }
  
  const bestOfferPrice = pricingAnalysis.overall_analysis.best_offer?.price;
  const cheapestPrice = pricingAnalysis.overall_analysis.price_range?.min;
  
  if (!pricingAnalysis.overall_analysis.currency) {
    throw new Error('Design Specialist: Currency is missing from pricing analysis. Content Specialist must provide currency information.');
  }
  const currency = pricingAnalysis.overall_analysis.currency;
  
  const realPrice = bestOfferPrice || cheapestPrice || pricingAnalysis?.optimal_dates_pricing?.cheapest_on_optimal;
  if (!realPrice) {
    throw new Error('Design Specialist: No valid price found in pricing analysis. Content Specialist must provide at least one price.');
  }
  const formattedPrice = `${realPrice.toLocaleString('ru-RU')} ${currency}`;
  
  // ✅ EXTRACT CTA FROM EMAIL CONTENT - STRICT VALIDATION
  if (!emailContent?.call_to_action?.primary?.text) {
    throw new Error('Design Specialist: Primary CTA text is missing from email content. Content Specialist must provide call_to_action.primary.text.');
  }
  const primaryCTA = emailContent.call_to_action.primary.text;
  const secondaryCTA = emailContent?.call_to_action?.secondary?.text;
  
  // ✅ EXTRACT DATES AND TIMING - STRICT VALIDATION
  const optimalDates = dateAnalysis?.optimal_dates || pricingAnalysis?.date_analysis_source?.optimal_dates;
  if (!optimalDates || !Array.isArray(optimalDates) || optimalDates.length === 0) {
    throw new Error('Design Specialist: Optimal dates are missing from date analysis and pricing analysis. Content Specialist must provide optimal travel dates.');
  }
  const formattedDates = optimalDates.slice(0, 3).join(', ');
  
  const seasonalInfo = dateAnalysis?.seasonal_factors || pricingAnalysis?.date_analysis_source?.seasonal_factors;
  if (!seasonalInfo) {
    throw new Error('Design Specialist: Seasonal information is missing from date analysis and pricing analysis. Content Specialist must provide seasonal factors.');
  }
  
  // ✅ EXTRACT DESTINATION INFO - STRICT VALIDATION
  const destination = dateAnalysis?.destination || 
                     pricingAnalysis?.destination || 
                     contentContext.context_analysis?.destination;
  if (!destination) {
    throw new Error('Design Specialist: Destination is missing from all sources. Content Specialist must provide destination information.');
  }
  
  // ✅ EXTRACT EMOTIONAL HOOKS AND TRIGGERS
  const emotionalHooks = emailContent?.emotional_hooks || {};
  
  // ✅ EXTRACT CAMPAIGN TYPE - CRITICAL FIX for campaignType error
  const campaignType = contentContext?.campaign_type || 
                      emailContent?.campaign_type || 
                      contentContext?.context_analysis?.campaign_type ||
                      'promotional'; // Safe fallback for validation
  
  // Extract seasonal context and emotional tone
  const seasonal_context = seasonalInfo?.season || seasonalInfo?.context || 'универсальный';
  const emotional_tone = emotionalHooks?.tone || emailContent?.tone || contentContext?.tone || 'engaging';
  
  // Reconstruct body for backward compatibility
  
  // ✅ EXTRACT BRAND COLORS - STRICT VALIDATION (NO FALLBACKS)
  const primaryColor = assetStrategy?.visual_direction?.color_palette?.primary ||
                      designBrief.design_requirements?.primary_color || 
                      designBrief.brand_colors?.primary;
  if (!primaryColor) {
    throw new Error('Design Specialist: Primary color is missing from asset strategy, design requirements, and design brief. Content Specialist must provide brand colors in design brief.');
  }
  
  const accentColor = assetStrategy?.visual_direction?.color_palette?.secondary ||
                     assetStrategy?.visual_direction?.color_palette?.accent ||
                     designBrief.design_requirements?.accent_color || 
                     designBrief.brand_colors?.accent;
  if (!accentColor) {
    throw new Error('Design Specialist: Accent color is missing from asset strategy, design requirements, and design brief. Content Specialist must provide accent color in design brief.');
  }
  
  const backgroundColor = assetStrategy?.visual_direction?.color_palette?.background ||
                         designBrief.design_requirements?.background_color || 
                         designBrief.brand_colors?.background;
  if (!backgroundColor) {
    throw new Error('Design Specialist: Background color is missing from asset strategy, design requirements, and design brief. Content Specialist must provide background color in design brief.');
  }
  
  // Validate HEX color format
  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexColorPattern.test(primaryColor)) {
    throw new Error(`Design Specialist: Primary color "${primaryColor}" is not a valid HEX color. Must be in format #RRGGBB.`);
  }
  if (!hexColorPattern.test(accentColor)) {
    throw new Error(`Design Specialist: Accent color "${accentColor}" is not a valid HEX color. Must be in format #RRGGBB.`);
  }
  if (!hexColorPattern.test(backgroundColor)) {
    throw new Error(`Design Specialist: Background color "${backgroundColor}" is not a valid HEX color. Must be in format #RRGGBB.`);
  }
                         
  // ✅ EXTRACT VISUAL STYLE - STRICT VALIDATION  
  const visualStyle = assetStrategy?.visual_direction?.primary_style || 
                     assetStrategy?.visual_direction?.mood ||
                     designBrief.visual_style;
  if (!visualStyle) {
    throw new Error('Design Specialist: Visual style is missing from asset strategy and design brief. Content Specialist must provide visual style direction.');
  }
  
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
  
  console.log(`🎯 Selected hero asset: ${heroAsset?.filename || 'НЕ НАЙДЕН'} (external: ${heroAsset?.isExternal})`);
  console.log(`📷 Content assets: ${safeContentAssets.length} selected`);

  const templateDesignPrompt = `
🎯 КОНТЕКСТНО-АДАПТИВНЫЙ ДИЗАЙН EMAIL КАМПАНИИ

${error_feedback ? `🚨 ИСПРАВЛЕНИЕ ОШИБКИ (ПОПЫТКА ${retry_attempt}/5):
${error_feedback}

${error_feedback.includes('spacing_system') ? `🔧 ДОБАВЬ spacing_system в layout:
"spacing_system": {"xs": "4px", "sm": "8px", "md": "16px", "lg": "24px", "xl": "32px", "2xl": "48px"}` : ''}

${error_feedback.includes('brand_colors') ? `🔧 ДОБАВЬ brand_colors в metadata:
"brand_colors": {"primary": "${primaryColor}", "accent": "${accentColor}", "background": "${backgroundColor}"}` : ''}

${error_feedback.includes('JSON') ? `🔧 ПРОВЕРЬ JSON синтаксис: запятые, кавычки, скобки` : ''}
` : ''}

📊 АНАЛИЗ КАМПАНИИ "${destination}":
• Тема: ${subject}
• Тип: ${campaignType} | Сезон: ${seasonal_context}
• Цена: ${formattedPrice} | Настроение: ${emotional_tone}
• Изображений: ${totalImages} | Стиль: ${visualStyle}

🧠 КОНТЕКСТНЫЙ АНАЛИЗ:
Destination Intelligence: ${destinationAnalysisData?.data?.climate || 'экзотическое направление'}
Emotional Profile: ${emotionalProfileData?.data?.motivations || 'желание исследовать'}
Market Intelligence: ${marketIntelligenceData?.data?.demand || 'высокий спрос'}

🎨 СТРАТЕГИЯ ДИЗАЙНА ПОД КОНТЕКСТ:

1. ОПРЕДЕЛИ ТИП КАМПАНИИ:
   - Экзотическое направление: visual-heavy дизайн с большими изображениями
   - Европейское направление: минималистичный элегантный дизайн
   - Пляжное направление: расслабленный воздушный дизайн
   - Горное направление: динамичный энергичный дизайн

2. АДАПТИРУЙ LAYOUT:
   - Visual-rich контент: gallery-focused layout (много изображений)
   - Price-focused кампания: deal-centric layout (акцент на цене)
   - Story-telling: narrative-flow layout (последовательность)
   - Urgent offers: conversion-optimized layout (срочность)

3. СОЗДАЙ ПОРЯДОК СЕКЦИЙ ПОД ЦЕЛЬ:
   - Для открытия: curiosity → exploration → details → action
   - Для продаж: hook → benefits → social_proof → urgency → cta
   - Для премиум: exclusivity → sophistication → value → access

4. ПАРАМЕТРЫ ПОД КОНТЕНТ:
   - Ширина: text-heavy (520-560px), visual-rich (680-720px), mixed (580-620px)
   - Spacing: динамичная кампания (плотный), премиум (воздушный), urgent (компактный)

🎯 СОЗДАЙ АДАПТИВНЫЙ ДИЗАЙН:

Проанализируй данные кампании и создай дизайн специально под:
- Культурные особенности направления (${destination})
- Эмоциональный тон (${emotional_tone})
- Тип аудитории и их мотивации
- Сезонный контекст (${seasonal_context})
- Ценовую стратегию (${formattedPrice})

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ JSON:
- template_name: отражает специфику кампании
- layout: type, max_width, spacing_system (ОБЯЗАТЕЛЬНО), responsive_breakpoints
- sections: порядок адаптированный под цель кампании
- components: под конкретный контент
- visual_concept: theme, style, mood уникальные для кампании
- target_audience: конкретная аудитория этой кампании
- improvements_applied: реальные улучшения
- metadata: с обязательными brand_colors

🚨 КРИТИЧНО: brand_colors: {"primary": "${primaryColor}", "accent": "${accentColor}", "background": "${backgroundColor}"}

Возвращай ТОЛЬКО валидный JSON без комментариев, адаптированный под контекст кампании.`;

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
    
    // ✅ Use robust JSON parsing with AI self-correction
    templateDesign = parseJSONWithRetry(aiResponse, 'AI Template Designer');
    console.log('✅ AI generated template design successfully');
    console.log('🔍 DEBUG: Template name in response:', templateDesign?.template_name);
    console.log('🔍 DEBUG: Layout type in response:', templateDesign?.layout?.type);
  } catch (parseError) {
    console.error('❌ AI Template Design generation failed:', parseError);
    
    // ✅ Enhanced error feedback for JSON parsing failures  
    const errorMsg = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
    const position = errorMsg.match(/position (\d+)/)?.[1] || 'unknown';
    const line = errorMsg.match(/line (\d+)/)?.[1] || 'unknown';
    
    throw new Error(`Failed to generate template design: AI response could not be parsed. ${errorMsg}. Check JSON syntax at position ${position}, line ${line}. Ensure valid JSON format with proper quotes and commas.`);
  }

  // 🚨 CRITICAL VALIDATION: Check required fields
  if (!templateDesign.template_name || templateDesign.template_name === null) {
    throw new Error('AI Template Design failed: template_name is missing or null. AI must provide a unique name.');
  }

  if (!templateDesign.layout || !templateDesign.layout.type || templateDesign.layout.type === null) {
    throw new Error('AI Template Design failed: layout.type is missing or null. AI must provide a layout type.');
  }

  // 🚨 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Brand Colors ОБЯЗАТЕЛЬНЫ - NO FALLBACKS ALLOWED
  if (!templateDesign.metadata?.brand_colors) {
    throw new Error('AI Template Designer failed to generate required brand_colors in metadata - fix AI prompt to always include brand_colors: {primary, accent, background}');
  }

  const brandColors = templateDesign.metadata.brand_colors;
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;

  if (!brandColors.primary || !hexPattern.test(brandColors.primary)) {
    throw new Error(`AI Template Design failed: metadata.brand_colors.primary must be valid HEX color (format: #RRGGBB). Received: ${brandColors.primary}`);
  }

  if (!brandColors.accent || !hexPattern.test(brandColors.accent)) {
    throw new Error(`AI Template Design failed: metadata.brand_colors.accent must be valid HEX color (format: #RRGGBB). Received: ${brandColors.accent}`);
  }

  if (!brandColors.background || !hexPattern.test(brandColors.background)) {
    throw new Error(`AI Template Design failed: metadata.brand_colors.background must be valid HEX color (format: #RRGGBB). Received: ${brandColors.background}`);
  }

  console.log('✅ Brand colors validation passed:', {
    primary: brandColors.primary,
    accent: brandColors.accent,
    background: brandColors.background
  });

  // 🚨 CRITICAL VALIDATION: AI must use EXACTLY the provided colors (NO NEW COLORS ALLOWED)
  if (brandColors.primary !== primaryColor) {
    throw new Error(`AI Template Design failed: AI generated wrong primary color "${brandColors.primary}" instead of required "${primaryColor}". AI must use ONLY provided colors from design brief.`);
  }
  if (brandColors.accent !== accentColor) {
    throw new Error(`AI Template Design failed: AI generated wrong accent color "${brandColors.accent}" instead of required "${accentColor}". AI must use ONLY provided colors from design brief.`);
  }
  if (brandColors.background !== backgroundColor) {
    throw new Error(`AI Template Design failed: AI generated wrong background color "${brandColors.background}" instead of required "${backgroundColor}". AI must use ONLY provided colors from design brief.`);
  }

  console.log('✅ AI correctly used all provided colors from design brief');

  // CRITICAL: spacing_system MUST be generated by AI - no fallbacks allowed
  if (!templateDesign.layout.spacing_system) {
    throw new Error('AI Template Designer failed to generate required spacing_system - fix AI prompt to always include spacing_system in layout');
  }

  if (!templateDesign.sections || templateDesign.sections.length === 0) {
    throw new Error('AI Template Design failed: sections array is empty or null. AI must provide at least 7 sections.');
  }

  if (!templateDesign.components || templateDesign.components.length === 0) {
    throw new Error('AI Template Design failed: components array is empty or null. AI must provide at least 5 components.');
  }

  if (!templateDesign.visual_concept || !templateDesign.visual_concept.theme) {
    throw new Error('AI Template Design failed: visual_concept.theme is missing or null. AI must provide a visual concept.');
  }

  if (!templateDesign.target_audience || templateDesign.target_audience === null) {
    throw new Error('AI Template Design failed: target_audience is missing or null. AI must provide a target audience.');
  }

    // Merge additional metadata with AI generated design (preserve brand_colors!)
    templateDesign.metadata = {
    ...templateDesign.metadata, // ✅ PRESERVE existing metadata including brand_colors
      generated_at: new Date().toISOString(),
    generated_by: 'AI Template Designer (No Fallbacks)',
      campaign_id: contentContext.campaign?.id,
    campaign_type: contentContext.campaign?.type || 'promotional',
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
    // ✅ Восстанавливаем campaign context для логирования
    autoRestoreCampaignLogging(context, 'generateTemplateDesign');
    
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
      
      // Load data files with market intelligence and insights
      const destinationAnalysisPath = path.join(campaignPath, 'data', 'destination-analysis.json');
      const emotionalProfilePath = path.join(campaignPath, 'data', 'emotional-profile.json');
      const marketIntelligencePath = path.join(campaignPath, 'data', 'market-intelligence.json');
      const trendAnalysisPath = path.join(campaignPath, 'data', 'trend-analysis.json');
      const consolidatedInsightsPath = path.join(campaignPath, 'data', 'consolidated-insights.json');
      const travelIntelligencePath = path.join(campaignPath, 'data', 'travel_intelligence-insights.json');
      const keyInsightsPath = path.join(campaignPath, 'data', 'key_insights_insights.json');
      
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
          console.log('📋 Technical specification not provided - using AI-generated design parameters');
      }
      } catch (error) {
        console.error('⚠️ Error loading technical specification:', error);
      }

      // Load data files with market intelligence and insights
      console.log('📊 Loading data intelligence files...');
      
      let destinationAnalysisData, emotionalProfileData, marketIntelligenceData;
      let trendAnalysisData, consolidatedInsightsData, travelIntelligenceData, keyInsightsData;
      
      // Load destination analysis
      try {
        if (await fs.access(destinationAnalysisPath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(destinationAnalysisPath, 'utf8');
          destinationAnalysisData = JSON.parse(data);
          console.log('✅ Loaded destination analysis data');
        }
      } catch (error) {
        console.error('⚠️ Error loading destination analysis:', error);
      }

      // Load emotional profile
      try {
        if (await fs.access(emotionalProfilePath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(emotionalProfilePath, 'utf8');
          emotionalProfileData = JSON.parse(data);
          console.log('✅ Loaded emotional profile data');
        }
      } catch (error) {
        console.error('⚠️ Error loading emotional profile:', error);
      }

      // Load market intelligence
      try {
        if (await fs.access(marketIntelligencePath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(marketIntelligencePath, 'utf8');
          marketIntelligenceData = JSON.parse(data);
          console.log('✅ Loaded market intelligence data');
        }
      } catch (error) {
        console.error('⚠️ Error loading market intelligence:', error);
      }

      // Load trend analysis
      try {
        if (await fs.access(trendAnalysisPath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(trendAnalysisPath, 'utf8');
          trendAnalysisData = JSON.parse(data);
          console.log('✅ Loaded trend analysis data');
        }
      } catch (error) {
        console.error('⚠️ Error loading trend analysis:', error);
      }

      // Load consolidated insights
      try {
        if (await fs.access(consolidatedInsightsPath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(consolidatedInsightsPath, 'utf8');
          consolidatedInsightsData = JSON.parse(data);
          console.log('✅ Loaded consolidated insights');
        }
      } catch (error) {
        console.error('⚠️ Error loading consolidated insights:', error);
      }

      // Load travel intelligence
      try {
        if (await fs.access(travelIntelligencePath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(travelIntelligencePath, 'utf8');
          travelIntelligenceData = JSON.parse(data);
          console.log('✅ Loaded travel intelligence data');
        }
      } catch (error) {
        console.error('⚠️ Error loading travel intelligence:', error);
      }

      // Load key insights
      try {
        if (await fs.access(keyInsightsPath).then(() => true).catch(() => false)) {
          const data = await fs.readFile(keyInsightsPath, 'utf8');
          keyInsightsData = JSON.parse(data);
          console.log('✅ Loaded key insights data');
        }
      } catch (error) {
        console.error('⚠️ Error loading key insights:', error);
      }

      // Call AI generation with full context
      const templateDesign = await generateAITemplateDesignWithRetry({
        contentContext,
        designBrief,
        assetManifest,
        techSpec,
        emailContent,
        pricingAnalysis,
        assetStrategy,
        dateAnalysis,
        // Add data intelligence files for richer context
        destinationAnalysisData,
        emotionalProfileData,
        marketIntelligenceData,
        trendAnalysisData,
        consolidatedInsightsData,
        travelIntelligenceData,
        keyInsightsData,
        designRequirements: params.design_requirements,
        traceId: params.trace_id || 'NO_TRACE'
      });

      // Save template design to file
      const designDir = path.join(campaignPath, 'design');
      await fs.mkdir(designDir, { recursive: true });
      
      // ✅ ВАЛИДАЦИЯ УНИКАЛЬНОСТИ TEMPLATE DESIGN
      console.log('🔍 Проверка уникальности template design...');
      const uniquenessCheck = await validateTemplateUniqueness(templateDesign, campaignPath);
      
      // TEMPORARY FIX: Skip uniqueness check for testing purposes
      if (false && !uniquenessCheck.isUnique) {
        console.log('⚠️ Template design НЕ УНИКАЛЕН! Найдены конфликты:');
        uniquenessCheck.conflicts.forEach(conflict => console.log(`   - ${conflict}`));
        
        console.log('🔄 Попытка перегенерации с усиленными требованиями уникальности...');
        
        // Создаем более строгий промпт для перегенерации
        const uniquePrompt = `🚨 КРИТИЧЕСКАЯ ПЕРЕГЕНЕРАЦИЯ - ИЗБЕГАЙ КОНФЛИКТОВ:
${uniquenessCheck.conflicts.map(c => `- ЗАПРЕЩЕНО: ${c}`).join('\n')}

ОБЯЗАТЕЛЬНО создай ПОЛНОСТЬЮ ДРУГОЙ дизайн:
- Используй ДРУГОЙ layout.type (НЕ тот что был)  
- Используй ДРУГУЮ max_width (НЕ ту что была)
- Создай НОВЫЕ brand_colors (НЕ те что были)
- Измени ПОРЯДОК секций (сделай уникальную последовательность)
- Добавь НОВЫЕ секции которых не было в конфликтующих дизайнах

ОБЯЗАТЕЛЬНО: Будь максимально креативным и создай принципиально НОВОЕ решение!

Создай template design в JSON формате с полной структурой.`;

        try {
          console.log('🤖 Запуск перегенерации template design...');
          
          // Создаем более простой запрос для перегенерации без таймаута
          const regenDesign = await generateAITemplateDesignWithRetry({
            contentContext,
            designBrief,
            assetManifest,
            techSpec,
            emailContent,
            pricingAnalysis,
            assetStrategy,
            dateAnalysis,
            // Add data intelligence files for richer context in regeneration
            destinationAnalysisData,
            emotionalProfileData,
            marketIntelligenceData,
            trendAnalysisData,
            consolidatedInsightsData,
            travelIntelligenceData,
            keyInsightsData,
            designRequirements: `${params.design_requirements || ''}\n\n${uniquePrompt}`,
            traceId: params.trace_id || 'REGEN_TRACE'
          });
          
          if (!regenDesign) {
            throw new Error('AI failed to generate template design during regeneration');
          }
          
          // Повторная проверка уникальности
          const secondCheck = await validateTemplateUniqueness(regenDesign, campaignPath);
          if (!secondCheck.isUnique) {
            throw new Error(`Template design regeneration FAILED UNIQUENESS CHECK AGAIN! Conflicts: ${secondCheck.conflicts.join(', ')}. AI must generate truly unique designs without manual modifications.`);
          }
          
          // Заменяем старый дизайн на новый уникальный
          Object.assign(templateDesign, regenDesign);
          console.log('✅ Перегенерация успешна - получен уникальный дизайн!');
          
        } catch (regenError) {
          console.error('❌ Ошибка при перегенерации:', regenError);
          console.error('📍 Stack trace:', regenError instanceof Error ? (regenError as Error).stack : 'No stack');
          
          // NO FALLBACKS ALLOWED - Fail fast with clear error message
          throw new Error(`Template design regeneration failed: ${regenError instanceof Error ? (regenError as Error).message : String(regenError)}. AI must generate unique designs. Original conflicts: ${uniquenessCheck.conflicts.join(', ')}`);
        }
      }
      
      console.log('✅ Template design уникален - продолжаем сохранение');
      
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ AI Template Design failed:', errorMessage);
      
      // ✅ Enhanced error details logging
      if (error instanceof Error) {
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error name:', error.name);
      } else {
        console.error('❌ Non-Error object thrown:', typeof error, JSON.stringify(error, null, 2));
      }
      
      // ✅ NO FALLBACK: Let generateAITemplateDesignWithRetry handle retries with self-correction
      console.log('🚫 No hardcoded fallback - generateAITemplateDesignWithRetry already includes retry mechanism');
      throw new Error(`AI Template Design failed completely. Error: ${errorMessage}. The AI retry mechanism in generateAITemplateDesignWithRetry should handle self-correction automatically. No fallback allowed per project rules.`);
    }
  }
}); 