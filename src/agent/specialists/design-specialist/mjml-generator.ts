/**
 * MJML Template Generator
 * Handles MJML template generation with AI-powered dynamic creation
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext } from './design-context';
import { MjmlTemplate } from './types';
import { OpenAI } from 'openai';
import { logToFile } from '../../../shared/utils/campaign-logger';

/**
 * OpenAI Client for MJML Generation
 * Uses direct OpenAI API for MJML code generation integrated with main workflow
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

/**
 * MJML Generation Instructions
 */
const MJML_GENERATION_INSTRUCTIONS = `Ты эксперт по созданию MJML email шаблонов. Создавай только валидный MJML код без комментариев и объяснений.

ТВОЯ ЗАДАЧА: Создать профессиональный MJML email шаблон на основе предоставленного контента и дизайна.

ВСЕГДА возвращай ТОЛЬКО валидный MJML код без дополнительных комментариев или markdown форматирования.

🎨 ПРАВИЛА АДАПТИВНОЙ ВЕРСТКИ EMAIL:

1. АНАЛИЗ БРЕНДА И КОНТЕНТА:
   - Изучи предоставленный контент и определи подходящую цветовую схему
   - Анализируй тон и стиль сообщения для выбора типографики
   - Определи оптимальную структуру на основе типа кампании
   - Учитывай целевую аудиторию при выборе визуального стиля

2. АДАПТИВНАЯ ЦВЕТОВАЯ СХЕМА:
   - Для путешествий: теплые тропические тона или холодные горные
   - Для бизнеса: корпоративные синие, серые, белые
   - Для акций: яркие контрастные цвета (красный, оранжевый)
   - Для премиум: элегантные темные тона с золотыми акцентами
   - Применяй градиенты соответственно тематике

3. ДИНАМИЧЕСКАЯ СТРУКТУРА:
   - Анализируй длину контента для определения количества секций
   - Для коротких сообщений: компактная структура
   - Для детальных: расширенная структура с дополнительными блоками
   - Адаптируй под тип кампании (промо, информационная, сезонная)

4. УМНАЯ ТИПОГРАФИКА:
   - Заголовки: размер зависит от важности сообщения
   - Основной текст: оптимальная читаемость для целевой аудитории
   - Используй эмодзи соответственно тематике и аудитории
   - Выделяй ключевые моменты адаптивно

5. КОНТЕКСТНЫЕ ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ:
   - CTA кнопки: стиль зависит от срочности и типа действия
   - Элементы доверия: подбирай под специфику бренда
   - Социальные доказательства: адаптируй под контекст

6. RESPONSIVE DESIGN:
   - Всегда включай адаптивность для мобильных
   - Оптимизируй для различных email клиентов
   - Учитывай ограничения Outlook и Gmail

🚨 CSS ТРЕБОВАНИЯ:
1. ПРАВИЛЬНЫЕ CSS СВОЙСТВА:
   ✅ "list-style-type: none" (НЕ "list-style-type: -")
   ✅ "font-weight: 500" (НЕ "font-weight: 500px")
   ✅ "margin: 0 auto" (НЕ "margin: auto auto")
   ✅ "padding: 10px 20px" (НЕ "padding: 10 20")

2. ОБЯЗАТЕЛЬНЫЕ FALLBACK ШРИФТЫ:
   ✅ "font-family: 'Inter', Arial, sans-serif"
   ✅ "font-family: Georgia, 'Times New Roman', serif"
   ❌ "font-family: 'Custom Font'" (без fallback)

3. ВАЛИДНЫЕ CSS ЗНАЧЕНИЯ:
   - Всегда указывай единицы измерения (px, em, rem, %)
   - Используй валидные значения цветов (#hex, rgb(), названия)
   - Проверяй правописание CSS свойств

ТРЕБОВАНИЯ К MJML:
- Используй ТОЛЬКО валидные MJML теги
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Соблюдай структуру: <mjml><mj-head>...</mj-head><mj-body>...</mj-body></mjml>
- Используй все предоставленные изображения
- Создавай современный и читаемый дизайн
- Учитывай email клиенты (Outlook, Gmail, Apple Mail)
- Используй ПРАВИЛЬНЫЕ CSS свойства

ВАЖНО: Анализируй каждый случай индивидуально и создавай уникальный дизайн с ВАЛИДНЫМ CSS!`;

/**
 * Validate and fix common MJML errors
 */
function validateAndFixMjml(mjmlContent: string): string {
  // Remove invalid MJML elements
  mjmlContent = mjmlContent.replace(/<mj-list[^>]*>/g, '');
  mjmlContent = mjmlContent.replace(/<\/mj-list>/g, '');
  mjmlContent = mjmlContent.replace(/<mj-list-item[^>]*>/g, '');
  mjmlContent = mjmlContent.replace(/<\/mj-list-item>/g, '');
  
  // Replace invalid class attributes with css-class
  mjmlContent = mjmlContent.replace(/\s+class="([^"]*)"/g, ' css-class="$1"');
  mjmlContent = mjmlContent.replace(/\s+class='([^']*)'/g, ' css-class=\'$1\'');
  
  // Fix common MJML element issues
  mjmlContent = mjmlContent.replace(/<mj-list[^>]*>[\s\S]*?<\/mj-list>/g, (match) => {
    // Extract list items and convert to mj-text with HTML list
    const listItems = match.match(/<mj-list-item[^>]*>([\s\S]*?)<\/mj-list-item>/g);
    if (listItems) {
      const htmlList = '<ul>' + 
        listItems.map(item => {
          const content = item.replace(/<\/?mj-list-item[^>]*>/g, '');
          return `<li>${content}</li>`;
        }).join('') + 
        '</ul>';
      return `<mj-text>${htmlList}</mj-text>`;
    }
    return '';
  });
  
  console.log('✅ MJML validation and fixing completed');
  return mjmlContent;
}

/**
 * Compile MJML to HTML and save to campaign
 */
async function compileMjmlToHtml(
  mjmlTemplate: MjmlTemplate, 
  campaignPath: string
): Promise<MjmlTemplate> {
  console.log('🔧 Compiling MJML to HTML...');
  
  try {
    const mjml = require('mjml');
    const htmlResult = mjml(mjmlTemplate.source, {
      validationLevel: 'soft',
      keepComments: false
      // Removed deprecated 'beautify' option to prevent warning escalation
    });
    
    if (htmlResult.errors && htmlResult.errors.length > 0) {
      console.warn('⚠️ MJML compilation warnings:', htmlResult.errors);
    }
    
    // Save HTML template
    const htmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.html');
    await fs.writeFile(htmlTemplatePath, htmlResult.html);
    
    // Update mjmlTemplate object with HTML
    mjmlTemplate.html_content = htmlResult.html;
    mjmlTemplate.html_path = htmlTemplatePath;
    mjmlTemplate.file_size = Buffer.byteLength(htmlResult.html, 'utf8');
    
    console.log('✅ HTML template compiled and saved');
    console.log(`📄 HTML size: ${(mjmlTemplate.file_size / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ MJML to HTML compilation failed:', error);
    // Don't fail the whole process, just log the error
    // html_content remains undefined if compilation fails
  }
  
  return mjmlTemplate;
}

/**
 * Generate dynamic MJML template using AI - NO PREDEFINED TEMPLATES
 */
async function generateDynamicMjmlTemplate(params: {
  contentContext: any;
  designBrief: any;
  assetManifest: any;
  templateDesign?: any;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout: {
    maxWidth: number;
    headingFont: string;
    bodyFont: string;
    typography: any;
  };
  trace_id?: string | null;
}): Promise<any> {
  const { contentContext, designBrief: _designBrief, assetManifest, templateDesign, colors, layout } = params;
  
  // Extract content for template generation with proper object handling
  let subjectContent = contentContext.subject || contentContext.subject_line || contentContext.generated_content?.subject || contentContext.generated_content?.subject_line;
  
  // Handle subject as object or string
  let subject = '';
  if (typeof subjectContent === 'object' && subjectContent) {
    subject = subjectContent.primary || subjectContent.main || subjectContent.text || subjectContent.value || String(subjectContent);
  } else if (typeof subjectContent === 'string') {
    subject = subjectContent;
  }
  const preheader = contentContext.preheader || contentContext.generated_content?.preheader;
  
  // Extract body content with FULL STRUCTURE PRESERVATION
  let bodyContent = contentContext.body || contentContext.sections || contentContext.generated_content?.body || contentContext.generated_content?.sections;
  
  // Extract structured content components - PRESERVE STRUCTURE!
  let structuredContent: any = {
    opening: '',
    main_content: '',
    benefits: [],
    social_proof: '',
    urgency_elements: '',
    closing: '',
    emotional_hooks: {},
    personalization: {},
    call_to_action: {}
  };

  // Extract structured data from contentContext
  if (typeof bodyContent === 'object' && bodyContent) {
    structuredContent.opening = bodyContent.opening || '';
    structuredContent.main_content = bodyContent.main_content || '';
    structuredContent.benefits = Array.isArray(bodyContent.benefits) ? bodyContent.benefits : [];
    structuredContent.social_proof = bodyContent.social_proof || '';
    structuredContent.urgency_elements = bodyContent.urgency_elements || '';
    structuredContent.closing = bodyContent.closing || '';
  }

  // Extract additional structured data from contentContext
  const emotionalHooks = contentContext.emotional_hooks || contentContext.generated_content?.emotional_hooks || {};
  const personalization = contentContext.personalization || contentContext.generated_content?.personalization || {};
  const callToAction = contentContext.call_to_action || contentContext.cta || contentContext.generated_content?.call_to_action || {};

  structuredContent.emotional_hooks = emotionalHooks;
  structuredContent.personalization = personalization;  
  structuredContent.call_to_action = callToAction;

  // DEBUG: Log structured content to understand what's being passed to AI
  console.log('🔍 MJML Generator - Structured Content Diagnostic:', {
    opening: structuredContent.opening ? 'Available' : 'MISSING',
    main_content: structuredContent.main_content ? 'Available' : 'MISSING',
    benefits: Array.isArray(structuredContent.benefits) ? `${structuredContent.benefits.length} benefits` : 'MISSING',
    social_proof: structuredContent.social_proof ? 'Available' : 'MISSING',
    urgency_elements: structuredContent.urgency_elements ? 'Available' : 'MISSING',
    emotional_hooks: Object.keys(structuredContent.emotional_hooks).length,
    call_to_action: Object.keys(structuredContent.call_to_action).length
  });
  
  console.log('📋 Benefits content:', structuredContent.benefits);
  console.log('📋 Social proof content:', structuredContent.social_proof);
  console.log('📋 Urgency content:', structuredContent.urgency_elements);

  // Create fallback bodyText only for validation
  let bodyText = '';
  if (typeof bodyContent === 'object' && bodyContent) {
    const parts = [];
    if (bodyContent.opening) parts.push(bodyContent.opening);
    if (bodyContent.main_content) parts.push(bodyContent.main_content);
    if (bodyContent.benefits) parts.push('Benefits available');
    if (bodyContent.social_proof) parts.push('Social proof available');
    if (bodyContent.urgency_elements) parts.push('Urgency elements available');
    if (bodyContent.closing) parts.push(bodyContent.closing);
    bodyText = parts.join(' ');
  } else if (typeof bodyContent === 'string') {
    bodyText = bodyContent;
  }
  
  const pricing = contentContext.pricing || contentContext.pricing_analysis || contentContext.generated_content?.pricing;
  const cta = contentContext.cta || contentContext.call_to_action || contentContext.generated_content?.cta;
  const destination = contentContext.destination || contentContext.location || contentContext.travel_destination || 'Не указано';
  
  if (!subject || !preheader || !bodyText || !cta) {
    console.error('Missing content fields diagnostic:', {
      subject: !!subject,
      preheader: !!preheader,
      body: !!bodyText,
      pricing: !!pricing,
      cta: !!cta,
      contentContextKeys: Object.keys(contentContext),
      generated_content: !!contentContext.generated_content,
      actualValues: {
        subject_from: contentContext.subject ? 'subject' : contentContext.subject_line ? 'subject_line' : 'missing',
        preheader_from: contentContext.preheader ? 'preheader' : 'missing',
        body_from: bodyText ? 'body/bodyText' : 'missing',
        pricing_from: contentContext.pricing ? 'pricing' : contentContext.pricing_analysis ? 'pricing_analysis' : 'missing',
        cta_from: contentContext.cta ? 'cta' : contentContext.call_to_action ? 'call_to_action' : 'missing'
      }
    });
    
    const missingFields = [];
    if (!subject) missingFields.push('subject (looking for: subject, subject_line)');
    if (!preheader) missingFields.push('preheader');
    if (!bodyText) missingFields.push('body (looking for: body, sections)');
    if (!cta) missingFields.push('cta (looking for: cta, call_to_action)');
    
    throw new Error(`Required content fields missing: ${missingFields.join(', ')}`);
  }
  
  // Pricing is optional - log if available
  if (pricing) {
    console.log('📊 Pricing information available:', typeof pricing === 'string' ? pricing.substring(0, 100) + '...' : 'object data');
  } else {
    console.log('💰 No explicit pricing field found, pricing information may be embedded in content');
  }
  
  // Extract images from asset manifest - NO FALLBACK
  // Support both direct and nested asset manifest structures
  const images = assetManifest?.images || assetManifest?.assetManifest?.images || [];
  if (!images || !Array.isArray(images) || images.length === 0) {
    console.log('🔍 Debug asset manifest structure:', {
      hasAssetManifest: !!assetManifest,
      hasDirectImages: !!assetManifest?.images,
      hasNestedImages: !!assetManifest?.assetManifest?.images,
      assetManifestKeys: assetManifest ? Object.keys(assetManifest) : 'none',
      imagesLength: images?.length || 0
    });
    throw new Error('Asset manifest must contain at least one image');
  }
  
  // 🌐 PROCESS IMAGES WITH EXTERNAL URL SUPPORT
  const processedImages = images.map((image: any, index: number) => {
    // ✅ ИСПРАВЛЕНО: Используем правильные поля из манифеста
    const isExternal = image.purpose === 'external_image' || image.isExternal || (image.path && image.path.startsWith('http'));
    const imageUrl = image.path || image.file_path || image.url;
    const altText = image.description || image.alt_text || `Image ${index + 1}`;
    
    console.log(`📸 Processing image ${index + 1}: ${isExternal ? 'EXTERNAL' : 'LOCAL'} - ${imageUrl}`);
    
    return {
      url: imageUrl,
      alt_text: altText,
      isExternal: isExternal,
      usage: image.usage || 'general',
      description: image.description || altText
    };
  });
  
  console.log(`🖼️  Found ${processedImages.length} images for MJML template`);
  
  // const _heroImage = processedImages[0]; // Currently unused
  // const _galleryImages = processedImages.slice(1, 4); // Currently unused
  
  // Extract fonts from asset manifest - check both direct and nested structure
  const fonts = assetManifest?.fonts || assetManifest?.assetManifest?.fonts;
  let fontConfiguration = {
    headingFont: 'Arial, sans-serif',
    bodyFont: 'Arial, sans-serif',
    fontWeights: ['normal', 'bold']
  };
  
  if (fonts && fonts.length > 0) {
    // Use first font as primary, or find heading/body specific fonts
    const headingFont = fonts.find((font: any) => font.usage === 'heading') || fonts[0];
    const bodyFont = fonts.find((font: any) => font.usage === 'body') || fonts[0];
    
    fontConfiguration = {
      headingFont: `${headingFont.family}, ${headingFont.fallbacks?.join(', ') || 'Arial, sans-serif'}`,
      bodyFont: `${bodyFont.family}, ${bodyFont.fallbacks?.join(', ') || 'Arial, sans-serif'}`,
      fontWeights: headingFont.weights || ['normal', 'bold']
    };
    
    console.log(`🔤 Using fonts from asset manifest:`);
    console.log(`   Heading: ${fontConfiguration.headingFont}`);
    console.log(`   Body: ${fontConfiguration.bodyFont}`);
  } else {
    console.log('⚠️ No fonts in asset manifest, using default Arial');
  }
  
  // 🎨 USE AI TEMPLATE DESIGN IF AVAILABLE
  // let __templateStructure = ''; // Currently unused
  // let __designGuidance = ''; // Currently unused
  
  if (templateDesign) {
    console.log('🎯 Using AI Template Design for enhanced MJML generation');
    
    // Set default template_name if not provided
    if (!templateDesign.template_name) {
      templateDesign.template_name = `template_${Date.now()}`;
      console.log('⚠️ Template name missing, using default:', templateDesign.template_name);
    }
    
    if (!templateDesign.layout || !templateDesign.layout.type) {
      throw new Error('Template design must have layout with type');
    }
    
    if (!templateDesign.sections || templateDesign.sections.length === 0) {
      throw new Error('Template design must have at least one section');
    }
    
    if (!templateDesign.components || templateDesign.components.length === 0) {
      throw new Error('Template design must have at least one component');
    }
    
    /* _templateStructure = `
СТРУКТУРА ИЗ AI TEMPLATE DESIGN:
- Template: ${templateDesign.template_name}
- Layout: ${templateDesign.layout.type}
- Sections: ${templateDesign.sections.length}
- Components: ${templateDesign.components.length}

СЕКЦИИ:
${templateDesign.sections.map((section: any, index: number) => 
  `${index + 1}. ${section.name || section.type}: базовый контент`
).join('\n')}

📸 ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ (если >2 изображений):

КОМПОНЕНТЫ:
${templateDesign.components.map((comp: any) => 
  `- ${comp.id}: ${comp.type} (${comp.styling ? Object.keys(comp.styling).join(', ') : 'базовые стили'})`
).join('\n')}
`; */

    if (!templateDesign.visual_concept) {
      throw new Error('Template design must have visual_concept');
    }
    
    if (!templateDesign.target_audience) {
      throw new Error('Template design must have target_audience');
    }
    
    if (!templateDesign.layout.max_width) {
      throw new Error('Template design layout must have max_width');
    }
    
    if (!templateDesign.layout.spacing_system) {
      throw new Error('Template design layout must have spacing_system');
    }

    /* _designGuidance = `
СЛЕДУЙ ТОЧНО ЭТОМУ ДИЗАЙНУ:
- Visual Concept: ${templateDesign.visual_concept}
- Target Audience: ${templateDesign.target_audience}
- Layout Type: ${templateDesign.layout.type}
- Max Width: ${templateDesign.layout.max_width}px
- Spacing System: ${JSON.stringify(templateDesign.layout.spacing_system)}

RESPONSIVE BREAKPOINTS:
${templateDesign.responsive?.breakpoints?.map((bp: any) => 
  `- ${bp.name}: ${bp.max_width} (${bp.adjustments ? Object.keys(bp.adjustments).join(', ') : 'базовые настройки'})`
).join('\n')}

ACCESSIBILITY REQUIREMENTS:
- ${templateDesign.accessibility?.alt_texts}
- ${templateDesign.accessibility?.color_contrast}
- ${templateDesign.accessibility?.font_sizes}
`; */
  } else {
    throw new Error('Template design is required for MJML generation - run generateTemplateDesign first');
  }
  
  // Create AI prompt for MJML generation
  let templatePrompt = `
Ты - эксперт по MJML (Mailjet Markup Language). Создай ВАЛИДНЫЙ MJML email шаблон, анализируя контент и подбирая оптимальный дизайн.

🧠 АНАЛИЗ КОНТЕНТА И БРЕНДА:

КОНТЕНТ ДЛЯ АНАЛИЗА:
- Заголовок: "${subject}"
- Превью: "${preheader}"  

СТРУКТУРИРОВАННЫЙ КОНТЕНТ:
📝 ОСНОВНОЙ КОНТЕНТ:
- Открытие: "${structuredContent.opening}"
- Основная часть: "${structuredContent.main_content}"
- Заключение: "${structuredContent.closing}"

🎯 ПРЕИМУЩЕСТВА (создай визуальный список):
${structuredContent.benefits.map((benefit: string, index: number) => `${index + 1}. ${benefit}`).join('\n')}

💬 СОЦИАЛЬНОЕ ДОКАЗАТЕЛЬСТВО:
"${structuredContent.social_proof}"

⚡ ЭЛЕМЕНТЫ СРОЧНОСТИ:
"${structuredContent.urgency_elements}"

💖 ЭМОЦИОНАЛЬНЫЕ ХУКИ:
- Желание: "${structuredContent.emotional_hooks.desire || ''}"
- FOMO: "${structuredContent.emotional_hooks.fear_of_missing_out || ''}"
- Стремления: "${structuredContent.emotional_hooks.aspiration || ''}"

👤 ПЕРСОНАЛИЗАЦИЯ:
- Приветствие: "${structuredContent.personalization.greeting || ''}"
- Рекомендации: "${structuredContent.personalization.recommendations || ''}"

🔗 ПРИЗЫВЫ К ДЕЙСТВИЮ:
- Основной: "${structuredContent.call_to_action.primary?.text || cta?.primary?.text || 'Узнать больше'}"
  URL: "${structuredContent.call_to_action.primary?.url || cta?.primary?.url || '#'}"
- Дополнительный: "${structuredContent.call_to_action.secondary?.text || cta?.secondary?.text || ''}"
  URL: "${structuredContent.call_to_action.secondary?.url || cta?.secondary?.url || '#'}"
- Срочный: "${structuredContent.call_to_action.urgency_cta?.text || cta?.urgency_cta?.text || ''}"
  URL: "${structuredContent.call_to_action.urgency_cta?.url || cta?.urgency_cta?.url || '#'}"

💰 ЦЕНОВАЯ ИНФОРМАЦИЯ (используй для конкретных преимуществ):
- Текущая цена: ${pricing?.best_price || pricing?.cheapest_on_optimal || pricing?.comprehensive_pricing?.best_price_overall || 'Не указана'} ${pricing?.currency || pricing?.comprehensive_pricing?.currency || ''}
- Средняя цена: ${pricing?.optimal_dates_pricing?.average_on_optimal || pricing?.comprehensive_pricing?.average_price_overall || ''} ${pricing?.currency || pricing?.comprehensive_pricing?.currency || ''}
- Экономия: Рассчитай на основе разности средней и текущей цены
- Лучшая дата: ${pricing?.price_insights?.cheapest_optimal_date || ''}
- Всего предложений: ${pricing?.comprehensive_pricing?.total_offers_found || ''}
- Диапазон цен: ${pricing?.comprehensive_pricing?.best_price_overall || ''} - ${pricing?.comprehensive_pricing?.worst_price_overall || ''} ${pricing?.currency || pricing?.comprehensive_pricing?.currency || ''}

🏢 БРЕНД: ${colors.primary ? 'Kupibilet' : 'Не указан'}

ДОСТУПНЫЕ ИЗОБРАЖЕНИЯ (${processedImages.length} изображений) - ИСПОЛЬЗУЙ ВСЕ:
${processedImages.map((img: any, index: number) => 
  `${index + 1}. ${img.url} - ${img.alt_text} (${img.description})`
).join('\n')}

🎯 ТЕМАТИЧЕСКИЙ АНАЛИЗ ДЛЯ НАПРАВЛЕНИЯ: ${destination}
- Используй изображения, подходящие для темы "${destination}"
- Проверь что alt тексты соответствуют теме направления
- Для горных регионов - горные пейзажи, для тропических - тропические виды
- Избегай generic туристические картинки, предпочитай специфичные для региона

🖼️ ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ (НОВОЕ УЛУЧШЕНИЕ):
- Создай отдельную секцию "gallery" после hero
- Используй <mj-group> для создания сетки изображений (2-3 колонки)
- Каждое изображение в <mj-column> с подписью
- Добавь hover-эффекты через CSS
- Адаптивная сетка: мобайл=1 колонка, планшет=2, десктоп=3

ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ ИЗОБРАЖЕНИЙ:
- Изображение #1: Hero изображение (полная ширина)
- Изображения #2-${processedImages.length}: Галерея изображений (сетка)
- Все изображения должны быть использованы в галерее
- Добавляй alt-текст и подписи к каждому изображению

БАЗОВЫЕ ЦВЕТА БРЕНДА (можешь адаптировать):
- Основной: ${colors.primary}
- Акцент: ${colors.accent}  
- Фон: ${colors.background}
- Текст: ${colors.text}

ШРИФТЫ:
- Заголовки: ${fontConfiguration.headingFont}
- Основной текст: ${fontConfiguration.bodyFont}

🎨 ЗАДАЧА: СОЗДАЙ СТРУКТУРИРОВАННЫЙ EMAIL С ПОЛНЫМ ИСПОЛЬЗОВАНИЕМ КОНТЕНТА

КРИТИЧЕСКИ ВАЖНО - MJML ПРАВИЛА ВАЛИДАЦИИ:
❌ ЗАПРЕЩЕННЫЕ ЭЛЕМЕНТЫ (НЕ ИСПОЛЬЗУЙ):
- <mj-list> и <mj-list-item> - не существуют в MJML
- Атрибут class="" - недопустим в MJML элементах

✅ РАЗРЕШЕННЫЕ ЭЛЕМЕНТЫ MJML:
- <mj-section>, <mj-column>, <mj-text>, <mj-button>
- <mj-image>, <mj-divider>, <mj-spacer>
- <mj-group>, <mj-wrapper>, <mj-hero>

✅ ДЛЯ СПИСКОВ ИСПОЛЬЗУЙ:
- <mj-text> с HTML списками: <ul><li>элемент</li></ul>
- Или отдельные <mj-text> блоки с иконками/номерами

✅ ДЛЯ СТИЛИЗАЦИИ ИСПОЛЬЗУЙ:
- css-class вместо class
- Inline стили: background-color, color, font-size, padding
- MJML атрибуты: width, padding, align, background-color

🚀 АВТОМАТИЧЕСКИЕ УЛУЧШЕНИЯ В MJML (ОБЯЗАТЕЛЬНО):

1. 📸 СТРУКТУРА С ГАЛЕРЕЕЙ:
   - Header с заголовком и превью
   - Hero секция с открытием (изображение #1)
   - Gallery секция с сеткой остальных изображений
   - Benefits секция в компактном формате
   - Multiple CTA секции
   - Social proof с visual indicators
   - Footer оптимизированный

2. 📐 ОПТИМИЗАЦИЯ РАЗМЕРА:
   - Объединяй похожие секции в одну
   - Используй <mj-group> для компактности
   - Минимизируй лишние <mj-spacer>
   - Цель: генерировать <600 строк финального HTML
   - Benefits секция с HTML списком в <mj-text>
   - Social Proof секция с выделенной цитатой
   - Urgency секция с элементами срочности
   - Emotional hooks как отдельные выделенные блоки
   - Multiple CTA секции (primary, secondary, urgency)
   - Footer с compliance информацией

2. ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ ВСЕ СТРУКТУРИРОВАННЫЕ ДАННЫЕ:
   ✅ Создай отдельную секцию для каждого преимущества с HTML списком
   ✅ Выдели социальное доказательство в отдельный блок с кавычками
   ✅ Добавь элементы срочности как яркие баннеры
   ✅ Используй эмоциональные хуки как highlighted секции
   ✅ Создай 3 разные CTA кнопки (primary, secondary, urgency)
   ✅ Добавь персонализацию в greeting и recommendations

3. ЦВЕТОВАЯ СХЕМА И СТИЛЬ:
   - Определи тематику и подбери соответствующие цвета
   - Для путешествий: теплые тропические тона
   - Для бизнеса: корпоративные цвета
   - Для акций: яркие контрастные цвета
   - Используй градиенты для emotional hooks

4. СТРУКТУРА MJML (СТРОГО ВАЛИДНАЯ):
   - Используй <mjml><mj-head> и <mj-body>
   - Создай отдельные <mj-section> для каждого блока
   - Hero секция с opening текстом
   - Gallery секция с grid изображений (если есть >2 изображений)
   - Main content секция с основной частью  
   - Benefits секция с HTML списком в <mj-text>
   - Social proof секция с выделенной цитатой
   - Urgency секция с элементами срочности

5. 📸 ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ (если >2 изображений):
   - Создай секцию после hero с заголовком "Галерея направления"
   - Используй <mj-group> с <mj-column> для каждого изображения
   - КРИТИЧНО: Ширина изображений МИНИМУМ 150px! НЕ используй width="16px" или width="50px"
   - Для 3 изображений: width="33%" но минимум 150px
   - Для 2 изображений: width="50%" но минимум 200px  
   - Добавь подписи под каждым изображением через <mj-text>
   - Используй <mj-image width="150px" /> с фиксированной шириной для галереи
   - Для hero изображения используй полную ширину: <mj-image width="550px" />

5. СОЗДАЙ ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ:
   - CTA кнопки: используй РЕАЛЬНЫЕ URLs из section "ПРИЗЫВЫ К ДЕЙСТВИЮ" (НЕ href="#")
   - Кнопки: используй только MJML атрибуты (НЕ class)
   - Элементы доверия: под специфику бренда
   - Социальные доказательства: под контекст

СТРУКТУРА MJML:
<mjml>
  <mj-head>
    <mj-title>[АДАПТИРОВАННЫЙ ЗАГОЛОВОК]</mj-title>
    <mj-preview>[АДАПТИРОВАННОЕ ПРЕВЬЮ]</mj-preview>
    <mj-attributes>
      <mj-all font-family="[ВЫБРАННЫЙ ШРИФТ]" />
      <mj-text font-size="[ОПТИМАЛЬНЫЙ РАЗМЕР]" line-height="[ЧИТАЕМОСТЬ]" />
    </mj-attributes>
    <mj-style>
      [АДАПТИРОВАННЫЕ CSS СТИЛИ ПОД КОНТЕНТ]
    </mj-style>
  </mj-head>
  <mj-body>
    [СЕКЦИИ АДАПТИРОВАННЫЕ ПОД КОНТЕНТ]
  </mj-body>
</mjml>

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
1. ОБЯЗАТЕЛЬНО используй открывающий <mjml> и закрывающий </mjml>
2. ОБЯЗАТЕЛЬНО создай <mj-head> с <mj-title> и <mj-preview>
3. ОБЯЗАТЕЛЬНО создай <mj-body> с несколькими <mj-section>
4. КАЖДАЯ <mj-section> должна содержать <mj-column>
5. Используй ВСЕ ${processedImages.length} изображений через <mj-image>
6. Включи ВЕСЬ текст из body (не сокращай!)
7. ⚠️ КРИТИЧНО ДЛЯ ГАЛЕРЕИ: Используй width="150px" для изображений, НЕ width="16px"!
8. Создай кнопки CTA через <mj-button> с РЕАЛЬНЫМИ URLs:
   - Основная кнопка: используй URL из "Основной" CTA
   - Дополнительная кнопка: используй URL из "Дополнительный" CTA  
   - Срочная кнопка: используй URL из "Срочный" CTA
9. Добавь футер с контактной информацией

ВАЖНО: 
- Анализируй каждый случай индивидуально
- Создавай уникальный дизайн под контент
- Используй ТОЛЬКО валидные MJML теги
- НЕ используй HTML теги внутри MJML
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Включи ВСЕ изображения
- Не сокращай текст!
- ОБЯЗАТЕЛЬНО используй реальные URLs в href атрибутах кнопок

ВЕРНИ ТОЛЬКО MJML КОД БЕЗ ОБЪЯСНЕНИЙ И БЕЗ MARKDOWN ФОРМАТИРОВАНИЯ:
`;

  // 🎯 GENERATE MJML TEMPLATE USING AI WITH RETRY MECHANISM
  console.log('🎨 Generating MJML template using AI with retry mechanism...');
  
  let mjmlCode = '';
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🔄 AI generation attempt ${attempts}/${maxAttempts}`);
    
    try {
      // 🔍 DEBUG: Log template prompt length and structure
      console.log(`🔍 Template prompt length: ${templatePrompt.length} characters`);
      console.log(`🔍 Template prompt preview: ${templatePrompt.substring(0, 200)}...`);
      
      // Call OpenAI API directly - integrated with main workflow
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: MJML_GENERATION_INSTRUCTIONS
          },
          {
            role: 'user',
            content: templatePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      // ✅ ИСПРАВЛЕНО: Правильное получение MJML контента от OpenAI API
      let mjmlContent = response.choices?.[0]?.message?.content;
      
      if (!mjmlContent || typeof mjmlContent !== 'string') {
        throw new Error(`AI failed to generate MJML template. Response: ${JSON.stringify(response.choices?.[0]?.message || 'No message')}`);
      }
      
      logToFile('info', `Raw AI MJML generated: ${mjmlContent.length} characters`, 'DesignSpecialist-MJML', params.trace_id || undefined);
      
      // ✅ ДОБАВЛЕНО: Валидация и исправление MJML
      mjmlContent = validateAndFixMjml(mjmlContent);
      
      // Извлекаем только MJML код если он в блоке кода
      const mjmlMatch = mjmlContent.match(/```mjml\n([\s\S]*?)\n```/) || 
                       mjmlContent.match(/```\n([\s\S]*?)\n```/) ||
                       mjmlContent.match(/<mjml[^>]*>[\s\S]*<\/mjml>/);
      
      if (mjmlMatch) {
        mjmlContent = mjmlMatch[1] || mjmlMatch[0];
        mjmlContent = mjmlContent.trim();
      }
      
      logToFile('info', `Processed MJML: ${mjmlContent.length} characters`, 'DesignSpecialist-MJML', params.trace_id || undefined);
      
      // Validate MJML structure
      const validationErrors = [];
      
      if (!mjmlContent.includes('<mjml>') || !mjmlContent.includes('</mjml>')) {
        validationErrors.push('Missing required <mjml> tags');
      }
      
      if (!mjmlContent.includes('<mj-head>') || !mjmlContent.includes('<mj-body>')) {
        validationErrors.push('Missing required <mj-head> or <mj-body> sections');
      }
      
      if (!mjmlContent.includes('<mj-section>')) {
        validationErrors.push('Missing required <mj-section> tags');
      }
      
      if (!mjmlContent.includes('<mj-column>')) {
        validationErrors.push('Missing required <mj-column> tags');
      }
      
      // Check for basic content (handle subject as string or object)
      const subjectText = typeof subject === 'string' ? subject : ((subject as any)?.text || (subject as any)?.value || String(subject || ''));
      if (subjectText && !mjmlContent.includes(subjectText.substring(0, 10))) {
        validationErrors.push('Subject not found in generated MJML');
      }
      
      if (validationErrors.length === 0) {
        console.log('✅ MJML template generated successfully using AI');
        mjmlCode = mjmlContent; // ✅ ДОБАВЛЕНО: присваиваем валидный контент
        logToFile('info', `MJML template generated successfully: ${mjmlCode.length} characters`, 'DesignSpecialist-MJML', params.trace_id || undefined);
        break;
      } else {
        console.log(`❌ Validation failed (attempt ${attempts}): ${validationErrors.join(', ')}`);
        
        if (attempts < maxAttempts) {
          console.log('🔄 Retrying with improved prompt...');
          
          // Improve prompt for next attempt
          templatePrompt += `

КРИТИЧЕСКАЯ ОШИБКА В ПРЕДЫДУЩЕЙ ПОПЫТКЕ:
${validationErrors.join('\n')}

ИСПРАВЬ ЭТИ ОШИБКИ! Убедись что:
1. Есть открывающий <mjml> и закрывающий </mjml>
2. Есть <mj-head> с <mj-title> и <mj-preview>
3. Есть <mj-body> с несколькими <mj-section>
4. Каждая <mj-section> содержит <mj-column>
5. Используется заголовок: "${subject}"
6. Используется превью: "${preheader}"
7. Используется основной текст: "${bodyText.substring(0, 100)}..."

ГЕНЕРИРУЙ ТОЛЬКО ВАЛИДНЫЙ MJML КОД!`;
        }
      }
      
    } catch (error) {
      console.error(`❌ AI generation failed (attempt ${attempts}):`, error);
      
      if (attempts < maxAttempts) {
        console.log('🔄 Retrying AI generation...');
        
        // Add error context to prompt
        templatePrompt += `

ОШИБКА В ПРЕДЫДУЩЕЙ ПОПЫТКЕ: ${error instanceof Error ? error.message : 'Unknown error'}

ИСПРАВЬ ОШИБКУ И ГЕНЕРИРУЙ КОРРЕКТНЫЙ MJML!`;
      }
    }
  }
  
  if (!mjmlCode || mjmlCode.length < 100) {
    throw new Error(`Failed to generate valid MJML after ${maxAttempts} attempts. Last attempt produced: ${mjmlCode.substring(0, 200)}...`);
  }

  // 🔍 ВАЛИДАЦИЯ MJML ПЕРЕД ПЕРЕДАЧЕЙ В HTML КОМПИЛЯТОР
  console.log('🔍 Validating generated MJML before compilation...');
  
  const mjmlValidationErrors: string[] = [];
  
  // Проверяем основную структуру
  if (!mjmlCode.includes('<mjml>') || !mjmlCode.includes('</mjml>')) {
    mjmlValidationErrors.push('Missing MJML root tags');
  }
  
  if (!mjmlCode.includes('<mj-head>') || !mjmlCode.includes('</mj-head>')) {
    mjmlValidationErrors.push('Missing MJML head section');
  }
  
  if (!mjmlCode.includes('<mj-body>') || !mjmlCode.includes('</mj-body>')) {
    mjmlValidationErrors.push('Missing MJML body section');
  }
  
  // Проверяем что все изображения используются
  const mjmlImageCount = (mjmlCode.match(/<mj-image[^>]*src=/g) || []).length;
  if (mjmlImageCount < processedImages.length) {
    mjmlValidationErrors.push(`Only ${mjmlImageCount}/${processedImages.length} images used in MJML`);
  }
  
  // Проверяем наличие галереи если есть >2 изображений
  if (processedImages.length > 2 && !mjmlCode.includes('галерея')) {
    mjmlValidationErrors.push('Gallery section missing for multiple images');
  }
  
  // Проверяем что есть CTA кнопки
  const ctaButtonCount = (mjmlCode.match(/<mj-button[^>]*href=/g) || []).length;
  if (ctaButtonCount === 0) {
    mjmlValidationErrors.push('No CTA buttons found in MJML');
  }
  
  if (mjmlValidationErrors.length > 0) {
    console.warn('⚠️ MJML validation warnings:', mjmlValidationErrors);
    console.warn('⚠️ Proceeding with compilation, HTML validator will fix issues');
  } else {
    console.log('✅ MJML validation passed');
  }

  try {
    
          // Create MJML template object with metadata
      const mjmlTemplateObject: MjmlTemplate = {
        source: mjmlCode,
        file_size: Buffer.byteLength(mjmlCode, 'utf8'),
        technical_compliance: {
          max_width_respected: mjmlCode.includes('max-width') || mjmlCode.includes('600px'),
          color_scheme_applied: mjmlCode.includes(colors.primary) || mjmlCode.includes(colors.accent),
          typography_followed: mjmlCode.includes('font-family') || mjmlCode.includes('font-size'),
          email_client_optimized: mjmlCode.includes('mj-') && mjmlCode.includes('<mjml>'),
          real_asset_paths: !!assetManifest?.images?.length
        },
        specifications_used: {
          layout: templateDesign?.layout?.type || 'single-column',
          max_width: 600,
          color_scheme: Object.keys(colors).length,
          typography: `${layout.headingFont}, ${layout.bodyFont}`,
          email_clients: 4 // gmail, outlook, apple-mail, yahoo-mail
        }
      };
    
    return mjmlTemplateObject;
    
  } catch (error) {
    console.error('❌ AI MJML generation failed:', error);
    throw new Error(`Failed to generate MJML template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * MJML template generation tool
 */
export const generateMjmlTemplate = tool({
  name: 'generateMjmlTemplate',
  description: 'Generate MJML email template with AI-powered dynamic creation and technical optimization',
  parameters: z.object({
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    design_requirements: z.object({}).strict().nullable().describe('Design requirements and brand guidelines'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n📧 === MJML TEMPLATE GENERATOR (OpenAI Agents SDK) ===');
    
    // Load content context from email-content.json file - REQUIRED
    console.log('🔍 Loading content context from email-content.json...');
    let contentContext;
    
    // Extract campaign path from context - NO CONTENT ACCESS YET
    let campaignPath;
    
    if ((context?.context as any)?.campaign?.path) {
      // OpenAI SDK context format
      campaignPath = (context?.context as any).campaign.path;
      console.log('✅ Found campaign path in OpenAI SDK context.campaign.path');
    } else if ((context?.context as any)?.campaign?.id) {
      // Try to construct path from campaign ID
      campaignPath = `/Users/rtuzov/PycharmProjects/Email-Makers/campaigns/${(context?.context as any).campaign.id}`;
      console.log('✅ Constructed campaign path from context.campaign.id:', campaignPath);
    } else if ((context?.context as any)?.designContext?.campaign_path) {
      campaignPath = (context?.context as any).designContext.campaign_path;
      console.log('✅ Found campaign path in context.designContext.campaign_path');
    } else {
      // Last resort: try to auto-detect from latest campaign
      console.log('🔍 Attempting auto-detection of campaign path...');
      try {
        const fs = require('fs');
        const path = require('path');
        const campaignsDir = '/Users/rtuzov/PycharmProjects/Email-Makers/campaigns';
        const campaigns = fs.readdirSync(campaignsDir).filter((dir: string) => dir.startsWith('campaign_'));
        if (campaigns.length > 0) {
          const latestCampaign = campaigns.sort().pop();
          campaignPath = path.join(campaignsDir, latestCampaign);
          console.log('✅ Auto-detected campaign path from latest campaign:', campaignPath);
        } else {
          throw new Error('❌ CRITICAL ERROR: No campaigns found for auto-detection');
        }
      } catch (autoDetectError) {
        console.error('❌ Auto-detection failed:', autoDetectError instanceof Error ? autoDetectError.message : String(autoDetectError));
        throw new Error('❌ CRITICAL ERROR: Campaign path not found in any context and auto-detection failed. Available context: ' + JSON.stringify(Object.keys(context || {})));
      }
    }
    
    // Load content context from email-content.json
    const contentFilePath = path.join(campaignPath, 'content', 'email-content.json');
    const contentFileContent = await fs.readFile(contentFilePath, 'utf8');
    contentContext = JSON.parse(contentFileContent);
    console.log('✅ Content context loaded from email-content.json');
    
    // Debug logging after loading content
    console.log('🔍 Debug - Available context keys:', Object.keys(context || {}));
    console.log('🔍 Debug - Content context keys:', Object.keys(contentContext || {}));
    console.log('🔍 Debug - Context campaign:', (context?.context as any)?.campaign);
    console.log('🔍 Debug - Context designContext:', !!(context?.context as any)?.designContext);
    
    console.log(`📋 Campaign: ${contentContext.campaign?.id || 'unknown'}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Get required data from design context
      let assetManifest = (context?.context as any)?.designContext?.asset_manifest;
      let templateDesign = (context?.context as any)?.designContext?.template_design;
      // const _technicalSpec = (context?.context as any)?.designContext?.technical_specification; // Currently unused
      
      // Load asset manifest from correct path
      if (!assetManifest) {
        console.log('🔍 Asset manifest not found in context, loading from assets/manifests/asset-manifest.json...');
        const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
        const assetManifestContent = await fs.readFile(assetManifestPath, 'utf8');
        assetManifest = JSON.parse(assetManifestContent);
        console.log('✅ Asset manifest loaded from file successfully');
      }
      
      // 🎯 CRITICAL: Load template design from file if not in context
      if (!templateDesign) {
        console.log('🔍 Template design not found in context, loading from file...');
        const templateDesignPath = path.join(campaignPath, 'design', 'template-design.json');
        try {
          const templateDesignContent = await fs.readFile(templateDesignPath, 'utf8');
          templateDesign = JSON.parse(templateDesignContent);
          console.log('✅ Template design loaded from file');
        } catch (error) {
          throw new Error(`Template design file not found: ${templateDesignPath}. generateTemplateDesign must be completed first.`);
        }
      }

      // All design data now comes from template-design.json (no technical specification)

      console.log('✅ Loaded technical specification and asset manifest');
      console.log(`📊 Assets: ${Array.isArray(assetManifest?.images || assetManifest?.assetManifest?.images) ? (assetManifest?.images || assetManifest?.assetManifest?.images).length : 0} images, ${Array.isArray(assetManifest?.icons || assetManifest?.assetManifest?.icons) ? (assetManifest?.icons || assetManifest?.assetManifest?.icons).length : 0} icons`);

      // Generate MJML template - NO FALLBACK ALLOWED
      console.log('🎨 Using AI template design for enhanced MJML generation');
      
      // Extract colors from template-design.json
      const colors = {
        primary: templateDesign.metadata?.brand_colors?.primary || '#4BFF7E',
        accent: templateDesign.metadata?.brand_colors?.accent || '#FF6240', 
        background: templateDesign.metadata?.brand_colors?.background || '#FFFFFF',
        text: '#2C3959'
      };
      
      // Extract layout from template-design.json
      const layout = {
        maxWidth: templateDesign.layout?.max_width || 600,
        headingFont: 'Inter',
        bodyFont: 'Inter',
        typography: {
          headingFont: { family: 'Inter', size: '24px' },
          bodyFont: { family: 'Inter', size: '16px' }
        }
      };
      
      let mjmlTemplate = await generateDynamicMjmlTemplate({
        contentContext,
        designBrief: null, // Not used in current implementation
        templateDesign,
        assetManifest,
        colors,
        layout,
        trace_id: params.trace_id || null
      });

      // Save MJML template to campaign
      const mjmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.mjml');
      await fs.mkdir(path.dirname(mjmlTemplatePath), { recursive: true });
      await fs.writeFile(mjmlTemplatePath, mjmlTemplate.source);
      mjmlTemplate.mjml_path = mjmlTemplatePath;
      
      console.log('✅ MJML template saved to campaign');

      // 🔧 COMPILE MJML TO HTML USING SEPARATE FUNCTION
      mjmlTemplate = await compileMjmlToHtml(mjmlTemplate, campaignPath);

      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        mjml_template: mjmlTemplate,
        trace_id: params.trace_id
      });

      // Save context to context parameter (OpenAI SDK pattern)
      if (context && context.context) {
        (context.context as any).designContext = updatedDesignContext;
      }

      console.log('✅ MJML Template generation completed successfully');
      console.log(`📏 Template size: ${mjmlTemplate.source.length} characters`);
      console.log(`🎨 HTML size: ${mjmlTemplate.file_size} bytes`);
      console.log(`📱 Email client optimized: ${mjmlTemplate.technical_compliance.email_client_optimized ? 'Yes' : 'No'}`);

      // ✅ LOG TO CAMPAIGN
      logToFile('info', `MJML Template generated successfully: ${mjmlTemplate.source.length} characters, HTML: ${mjmlTemplate.file_size} bytes`, 'DesignSpecialist-MJML', params.trace_id || undefined);
      logToFile('info', `Email client optimized: ${mjmlTemplate.technical_compliance.email_client_optimized ? 'Yes' : 'No'}`, 'DesignSpecialist-MJML', params.trace_id || undefined);

      return `MJML Template generated successfully! Template size: ${mjmlTemplate.source.length} characters. HTML file size: ${mjmlTemplate.file_size} bytes. Email client optimization: ${mjmlTemplate.technical_compliance.email_client_optimized ? 'enabled' : 'disabled'}. Layout: ${mjmlTemplate.specifications_used.layout}. Typography: ${mjmlTemplate.specifications_used.typography}.`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error('❌ MJML Template generation failed:', errorMessage);
      console.error('❌ Error stack:', errorStack);
      console.error('❌ MJML generation error:', errorMessage);
      throw new Error(`MJML Template generation failed: ${errorMessage}`);
    }
  }
}); 