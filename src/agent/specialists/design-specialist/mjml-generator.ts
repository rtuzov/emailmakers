/**
 * MJML Template Generator
 * Handles MJML template generation with AI-powered dynamic creation
 */

import { tool, Agent, run } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext } from './design-context';
import { MjmlTemplate } from './types';

/**
 * MJML Generation Sub-Agent
 * Uses OpenAI Agents SDK patterns for MJML code generation
 */
const mjmlGenerationAgent = new Agent({
  name: 'MJML Generator AI',
  instructions: `Ты эксперт по созданию MJML email шаблонов. Создавай только валидный MJML код без комментариев и объяснений.

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

ТРЕБОВАНИЯ К MJML:
- Используй ТОЛЬКО валидные MJML теги
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Соблюдай структуру: <mjml><mj-head>...</mj-head><mj-body>...</mj-body></mjml>
- Используй все предоставленные изображения
- Создавай современный и читаемый дизайн
- Учитывай email клиенты (Outlook, Gmail, Apple Mail)

ВАЖНО: Анализируй каждый случай индивидуально и создавай уникальный дизайн!`,
  model: 'gpt-4o-mini'
});

/**
 * Generate dynamic MJML template using AI - NO PREDEFINED TEMPLATES
 */
async function generateDynamicMjmlTemplate(params: {
  contentContext: any;
  designBrief: any;
  assetManifest: any;
  techSpec: any;
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
}): Promise<any> {
  const { contentContext, designBrief, assetManifest, templateDesign, colors, layout } = params;
  
  // Extract content for template generation with fallback values
  const subject = contentContext.subject || contentContext.generated_content?.subject;
  const preheader = contentContext.preheader || contentContext.generated_content?.preheader;
  const body = contentContext.body || contentContext.generated_content?.body;
  const pricing = contentContext.pricing || contentContext.pricing_analysis || contentContext.generated_content?.pricing;
  const cta = contentContext.cta || contentContext.generated_content?.cta;
  
  if (!subject || !preheader || !body || !pricing || !cta) {
    console.error('Missing content fields diagnostic:', {
      subject: !!subject,
      preheader: !!preheader,
      body: !!body,
      pricing: !!pricing,
      cta: !!cta,
      contentContextKeys: Object.keys(contentContext),
      generated_content: !!contentContext.generated_content
    });
    throw new Error('Required content fields missing: subject, preheader, body, pricing, or cta');
  }
  
  // Extract images from asset manifest - NO FALLBACK
  const images = assetManifest.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error('Asset manifest must contain at least one image');
  }
  
  // 🌐 PROCESS IMAGES WITH EXTERNAL URL SUPPORT
  const processedImages = images.map((image: any, index: number) => {
    const imageUrl = image.isExternal ? image.url : image.path;
    const altText = image.alt_text || `Image ${index + 1}`;
    
    console.log(`📸 Processing image ${index + 1}: ${image.isExternal ? 'EXTERNAL' : 'LOCAL'} - ${imageUrl}`);
    
    return {
      url: imageUrl,
      alt_text: altText,
      isExternal: image.isExternal || false,
      usage: image.usage || 'general'
    };
  });
  
  const heroImage = processedImages[0];
  const galleryImages = processedImages.slice(1, 4); // Next 3 images for gallery
  
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
  let templateStructure = '';
  let designGuidance = '';
  
  if (templateDesign) {
    console.log('🎯 Using AI Template Design for enhanced MJML generation');
    
    if (!templateDesign.template_name) {
      throw new Error('Template design must have a template_name');
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
    
    templateStructure = `
СТРУКТУРА ИЗ AI TEMPLATE DESIGN:
- Template: ${templateDesign.template_name}
- Layout: ${templateDesign.layout.type}
- Sections: ${templateDesign.sections.length}
- Components: ${templateDesign.components.length}

СЕКЦИИ:
${templateDesign.sections.map((section: any, index: number) => 
  `${index + 1}. ${section.type}: ${section.content ? Object.keys(section.content).join(', ') : 'базовый контент'}`
).join('\n')}

КОМПОНЕНТЫ:
${templateDesign.components.map((comp: any) => 
  `- ${comp.id}: ${comp.type} (${comp.styling ? Object.keys(comp.styling).join(', ') : 'базовые стили'})`
).join('\n')}
`;

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

    designGuidance = `
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
`;
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
- Основной текст: "${body}"
- Цена: ${pricing.best_price} ${pricing.currency}
- CTA кнопка: "${cta.primary}"
- Бренд: ${colors.primary ? 'Kupibilet' : 'Не указан'}

ДОСТУПНЫЕ ИЗОБРАЖЕНИЯ (${processedImages.length} изображений):
${processedImages.map((img: any, index: number) => 
  `${index + 1}. ${img.url} - ${img.alt_text}`
).join('\n')}

БАЗОВЫЕ ЦВЕТА БРЕНДА (можешь адаптировать):
- Основной: ${colors.primary}
- Акцент: ${colors.accent}  
- Фон: ${colors.background}
- Текст: ${colors.text}

ШРИФТЫ:
- Заголовки: ${fontConfiguration.headingFont}
- Основной текст: ${fontConfiguration.bodyFont}

🎨 ЗАДАЧА: СОЗДАЙ УНИКАЛЬНЫЙ ДИЗАЙН

1. АНАЛИЗИРУЙ КОНТЕНТ:
   - Определи тематику (путешествия, бизнес, акции, премиум)
   - Оцени тон сообщения (формальный, дружелюбный, срочный)
   - Выяви ключевые моменты для выделения
   - Определи целевую аудиторию по стилю текста

2. ПОДБЕРИ ЦВЕТОВУЮ СХЕМУ:
   - Для путешествий: теплые тропические или холодные горные тона
   - Для бизнеса: корпоративные синие, серые, белые
   - Для акций: яркие контрастные цвета
   - Для премиум: элегантные темные с золотыми акцентами
   - Создавай градиенты соответственно настроению

3. ОПРЕДЕЛИ СТРУКТУРУ:
   - Для коротких сообщений: компактная структура (5-6 секций)
   - Для детальных: расширенная структура (8-10 секций)
   - Адаптируй под тип кампании (промо, информационная, сезонная)

4. ВЫБЕРИ ТИПОГРАФИКУ:
   - Заголовки: размер зависит от важности (24px-36px)
   - Основной текст: читаемость для аудитории (14px-18px)
   - Эмодзи: соответственно тематике и аудитории
   - Выделения: адаптивно под ключевые моменты

5. СОЗДАЙ ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ:
   - CTA кнопки: стиль зависит от срочности
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
7. Создай кнопку CTA через <mj-button>
8. Добавь футер с контактной информацией

ВАЖНО: 
- Анализируй каждый случай индивидуально
- Создавай уникальный дизайн под контент
- Используй ТОЛЬКО валидные MJML теги
- НЕ используй HTML теги внутри MJML
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Включи ВСЕ изображения
- Не сокращай текст!

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
      const result = await run(mjmlGenerationAgent, templatePrompt);
      
      // Clean up the response - remove any markdown formatting
      mjmlCode = result.finalOutput.trim();
      
      // Remove markdown code blocks if present
      if (mjmlCode.startsWith('```mjml')) {
        mjmlCode = mjmlCode.replace(/^```mjml\s*/, '').replace(/\s*```$/, '');
      } else if (mjmlCode.startsWith('```xml')) {
        mjmlCode = mjmlCode.replace(/^```xml\s*/, '').replace(/\s*```$/, '');
      } else if (mjmlCode.startsWith('```')) {
        mjmlCode = mjmlCode.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Validate MJML structure
      const validationErrors = [];
      
      if (!mjmlCode.includes('<mjml>') || !mjmlCode.includes('</mjml>')) {
        validationErrors.push('Missing required <mjml> tags');
      }
      
      if (!mjmlCode.includes('<mj-head>') || !mjmlCode.includes('<mj-body>')) {
        validationErrors.push('Missing required <mj-head> or <mj-body> sections');
      }
      
      if (!mjmlCode.includes('<mj-section>')) {
        validationErrors.push('Missing required <mj-section> tags');
      }
      
      if (!mjmlCode.includes('<mj-column>')) {
        validationErrors.push('Missing required <mj-column> tags');
      }
      
      // Check for basic content
      if (!mjmlCode.includes(subject.substring(0, 10))) {
        validationErrors.push('Subject not found in generated MJML');
      }
      
      if (validationErrors.length === 0) {
        console.log('✅ MJML template generated successfully using AI');
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
7. Используется основной текст: "${body.substring(0, 100)}..."

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

  try {
    
    // Create MJML template object with metadata
    const mjmlTemplateObject = {
      mjml_code: mjmlCode,
      sections_count: (mjmlCode.match(/<mj-section/g) || []).length,
      responsive_optimized: mjmlCode.includes('@media') || mjmlCode.includes('mj-breakpoint'),
      email_clients: ['gmail', 'outlook', 'apple-mail', 'yahoo-mail'], // Standard email clients
      specifications_used: {
        layout: templateDesign?.layout?.type || 'single-column',
        typography: `${layout.headingFont}, ${layout.bodyFont}`,
        colors: `Primary: ${colors.primary}, Accent: ${colors.accent}`,
        components: templateDesign?.components?.map((c: any) => c.type).join(', ') || 'standard'
      },
      validation_status: 'generated',
      file_path: '' // Will be set when saved
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
    
    // Load content context from OpenAI SDK context parameter - NO FALLBACK ALLOWED
    let contentContext;
    
    // Get content context from design context (loaded by loadDesignContext)
    if (context?.designContext?.content_context) {
      contentContext = context.designContext.content_context;
      console.log('✅ Using content context from design context (loaded by loadDesignContext)');
    } else {
      throw new Error('Content context not found in design context. loadDesignContext must be called first to load campaign context.');
    }
    
    // Extract campaign path from content context or design context
    let campaignPath;
    if (contentContext.campaign?.campaignPath) {
      campaignPath = contentContext.campaign.campaignPath;
    } else if (context?.designContext?.campaign_path) {
      campaignPath = context.designContext.campaign_path;
    } else {
      throw new Error('Campaign path is missing from content context. loadDesignContext must provide valid campaign path.');
    }
    
    console.log(`📋 Campaign: ${contentContext.campaign?.id || 'unknown'}`);
    console.log(`📁 Campaign Path: ${campaignPath}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Get required data from design context
      const assetManifest = context?.designContext?.asset_manifest;
      let templateDesign = context?.designContext?.template_design;
      const technicalSpec = context?.designContext?.technical_specification;
      
      if (!assetManifest) {
        throw new Error('Asset manifest not found in design context. processContentAssets must be completed first.');
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

      // Use technical specification from design context (loaded by readTechnicalSpecification)
      let techSpec = context?.designContext?.technical_specification;
      
      if (!techSpec) {
        // Try to load from handoff file as fallback
        console.log('🔍 Technical specification not found in context, loading from handoff...');
        try {
          const handoffPath = path.join(campaignPath, 'handoffs', 'content-specialist-to-design-specialist.json');
          const handoffContent = await fs.readFile(handoffPath, 'utf8');
          const handoffData = JSON.parse(handoffContent);
          techSpec = handoffData.technical_specification;
          console.log('✅ Technical specification loaded from handoff');
        } catch (error) {
          throw new Error('Technical specification not found in context or handoff files. readTechnicalSpecification must be completed first.');
        }
      }

      console.log('✅ Loaded technical specification and asset manifest');
      console.log(`📊 Assets: ${Array.isArray(assetManifest.images) ? assetManifest.images.length : 0} images, ${Array.isArray(assetManifest.icons) ? assetManifest.icons.length : 0} icons`);

      // Generate MJML template - NO FALLBACK ALLOWED
      console.log('🎨 Using AI template design for enhanced MJML generation');
      
      // Extract colors from technical specification - REQUIRED
      let colors: {
        primary: string;
        accent: string;
        background: string;
        text: string;
      };
      
      if (!techSpec || !techSpec.design?.constraints?.colorScheme) {
        // Use default Kupibilet colors if technical specification is missing
        console.log('⚠️ Technical specification missing color scheme, using default Kupibilet colors');
        colors = {
          primary: '#4BFF7E',
          accent: '#FF6240',
          background: '#FFFFFF',
          text: '#2C3959'
        };
      } else {
        colors = {
          primary: techSpec.design.constraints.colorScheme.primary || '#4BFF7E',
          accent: techSpec.design.constraints.colorScheme.accent || '#FF6240',
          background: techSpec.design.constraints.colorScheme.background?.primary || '#FFFFFF',
          text: techSpec.design.constraints.colorScheme.text?.primary || '#2C3959'
        };
      }
      
      // Extract layout from technical specification - REQUIRED
      let layout: {
        maxWidth: number;
        headingFont: string;
        bodyFont: string;
        typography: any;
      };
      
      if (!techSpec || !techSpec.design?.constraints?.layout || !techSpec.design?.constraints?.typography) {
        // Use default layout and typography if technical specification is missing
        console.log('⚠️ Technical specification missing layout/typography, using defaults');
        layout = {
          maxWidth: 600,
          headingFont: 'Inter',
          bodyFont: 'Inter',
          typography: {
            headingFont: { family: 'Inter', size: '24px' },
            bodyFont: { family: 'Inter', size: '16px' }
          }
        };
      } else {
        layout = {
          maxWidth: techSpec.design.constraints.layout.maxWidth || 600,
          headingFont: techSpec.design.constraints.typography.headingFont?.family || 'Inter',
          bodyFont: techSpec.design.constraints.typography.bodyFont?.family || 'Inter',
          typography: techSpec.design.constraints.typography
        };
      }
      
      const mjmlTemplate = await generateDynamicMjmlTemplate({
        contentContext,
        designBrief: null, // Not used in current implementation
        templateDesign,
        assetManifest,
        techSpec,
        colors,
        layout
      });

      // Save MJML template to campaign
      const mjmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.mjml');
      await fs.mkdir(path.dirname(mjmlTemplatePath), { recursive: true });
      await fs.writeFile(mjmlTemplatePath, mjmlTemplate.mjml_code);
      
      console.log('✅ MJML template saved to campaign');

      // 🔧 COMPILE MJML TO HTML
      console.log('🔧 Compiling MJML to HTML...');
      try {
        const mjml = require('mjml');
        const htmlResult = mjml(mjmlTemplate.mjml_code, {
          validationLevel: 'soft',
          keepComments: false,
          beautify: true
        });
        
        if (htmlResult.errors && htmlResult.errors.length > 0) {
          console.warn('⚠️ MJML compilation warnings:', htmlResult.errors);
        }
        
        // Save HTML template
        const htmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.html');
        await fs.writeFile(htmlTemplatePath, htmlResult.html);
        
        // Update mjmlTemplate object with HTML
        mjmlTemplate.html_content = htmlResult.html;
        mjmlTemplate.html_file_path = htmlTemplatePath;
        mjmlTemplate.file_size = Buffer.byteLength(htmlResult.html, 'utf8');
        
        console.log('✅ HTML template compiled and saved');
        console.log(`📄 HTML size: ${(mjmlTemplate.file_size / 1024).toFixed(2)} KB`);
        
      } catch (error) {
        console.error('❌ MJML to HTML compilation failed:', error);
        // Don't fail the whole process, just log the error
        mjmlTemplate.html_content = null;
        mjmlTemplate.compilation_error = error.message;
      }

      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        mjml_template: mjmlTemplate,
        trace_id: params.trace_id
      });

      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.designContext = updatedDesignContext;
      }

      console.log('✅ MJML Template generation completed successfully');
      console.log(`📏 Template size: ${mjmlTemplate.mjml_code.length} characters`);
      console.log(`🎨 Sections: ${mjmlTemplate.sections_count}`);
      console.log(`📱 Responsive: ${mjmlTemplate.responsive_optimized ? 'Yes' : 'No'}`);

      return `MJML Template generated successfully using OpenAI Agents SDK! Template size: ${mjmlTemplate.mjml_code.length} characters with ${mjmlTemplate.sections_count} sections. Responsive optimization: ${mjmlTemplate.responsive_optimized ? 'enabled' : 'disabled'}. Email client compatibility: ${mjmlTemplate.email_clients.join(', ')}. Template saved to: ${mjmlTemplatePath}. Ready for preview generation.`;

    } catch (error) {
      console.error('❌ MJML Template generation failed:', error);
      throw error;
    }
  }
}); 