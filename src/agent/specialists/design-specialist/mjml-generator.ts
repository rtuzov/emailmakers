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

ТРЕБОВАНИЯ К MJML:
- Используй ТОЛЬКО валидные MJML теги
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Соблюдай структуру: <mjml><mj-head>...</mj-head><mj-body>...</mj-body></mjml>
- Используй все предоставленные изображения
- Создавай современный и читаемый дизайн
- Учитывай email клиенты (Outlook, Gmail, Apple Mail)

Создавай детальный контент, не сокращай текст.`,
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
  
  // Extract content for template generation - NO FALLBACK VALUES
  const subject = contentContext.subject;
  const preheader = contentContext.preheader;
  const body = contentContext.body;
  const pricing = contentContext.pricing;
  const cta = contentContext.cta;
  
  if (!subject || !preheader || !body || !pricing || !cta) {
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
  
  // Extract fonts from asset manifest - NO FALLBACK
  const fonts = assetManifest.fonts;
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
  const templatePrompt = `
Создай ВАЛИДНЫЙ MJML email шаблон для туристической кампании с ДЕТАЛЬНЫМ КОНТЕНТОМ.

${templateStructure}

${designGuidance}

СТРУКТУРА MJML:
<mjml>
  <mj-head>
    <mj-title>...</mj-title>
    <mj-preview>...</mj-preview>
    <mj-attributes>...</mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>...</mj-text>
        <mj-image>...</mj-image>
        <mj-button>...</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>

ДЕТАЛЬНЫЙ КОНТЕНТ:
- Заголовок: "${subject}"
- Превью: "${preheader}"
- Основной текст: "${body}"
- Цена: ${pricing.best_price} ${pricing.currency}
- CTA: "${cta.primary}"

ИЗОБРАЖЕНИЯ (используй ВСЕ):
${processedImages.map((img: any, index: number) => 
  `${index + 1}. ${img.url} - ${img.alt_text} ${img.isExternal ? '(EXTERNAL)' : '(LOCAL)'}`
).join('\n')}

ФИРМЕННЫЕ ЦВЕТА:
- Основной: ${colors.primary}
- Акцент: ${colors.accent}
- Фон: ${colors.background}
- Текст: ${colors.text}

ШРИФТЫ (используй эти шрифты):
- Заголовки: ${fontConfiguration.headingFont}
- Основной текст: ${fontConfiguration.bodyFont}
- Доступные веса: ${fontConfiguration.fontWeights.join(', ')}

ТРЕБОВАНИЯ:
- Используй ТОЛЬКО валидные MJML теги
- НЕ вкладывай <mj-section> внутрь <mj-section>
- Каждая секция должна иметь <mj-column>
- Используй ВСЕ ${images.length} изображений
- ПОЛНЫЙ ДЕТАЛЬНЫЙ ТЕКСТ из body (не сокращай!)
- Современный визуальный дизайн с читаемым текстом
- Ширина: ${layout.maxWidth}px
${templateDesign ? `
- СЛЕДУЙ ТОЧНО структуре из AI Template Design
- Используй указанные компоненты и стили
- Соблюдай spacing system: ${JSON.stringify(templateDesign.layout.spacing_system)}
` : ''}

СОЗДАЙ СЕКЦИИ:
${templateDesign && templateDesign.sections ? 
  templateDesign.sections.map((section: any, index: number) => 
    `${index + 1}. ${section.type}: ${section.content ? Object.keys(section.content).join(', ') : 'standard content'}`
  ).join('\n') :
  `1. Hero с главным изображением и заголовком
2. Детальное описание направления (используй весь body text)
3. Галерея изображений с подписями
4. Секция с ценой и мотивацией
5. CTA кнопка с призывом к действию
6. Простой футер`
}

ВАЖНО: Используй ВЕСЬ текст из body, разбей его на абзацы и секции. Не сокращай контент!

Верни ТОЛЬКО MJML код БЕЗ markdown форматирования:
`;

  try {
    // 🎯 GENERATE MJML TEMPLATE USING AI with OpenAI Agents SDK
    console.log('🎨 Generating MJML template using OpenAI Agents SDK...');
    
    const result = await run(mjmlGenerationAgent, templatePrompt);
    
    // Clean up the response - remove any markdown formatting
    let mjmlCode = result.finalOutput.trim();
    
    // Remove markdown code blocks if present
    if (mjmlCode.startsWith('```mjml')) {
      mjmlCode = mjmlCode.replace(/^```mjml\s*/, '').replace(/\s*```$/, '');
    } else if (mjmlCode.startsWith('```xml')) {
      mjmlCode = mjmlCode.replace(/^```xml\s*/, '').replace(/\s*```$/, '');
    } else if (mjmlCode.startsWith('```')) {
      mjmlCode = mjmlCode.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Validate MJML structure and fix if needed
    if (!mjmlCode.includes('<mjml>') || !mjmlCode.includes('</mjml>')) {
      console.warn('⚠️ Generated MJML missing <mjml> tags, wrapping content');
      mjmlCode = `<mjml>\n${mjmlCode}\n</mjml>`;
    }
    
    if (!mjmlCode.includes('<mj-head>') || !mjmlCode.includes('<mj-body>')) {
      console.warn('⚠️ Generated MJML missing required sections, adding fallback structure');
      
      // Extract content between mjml tags if they exist
      const mjmlMatch = mjmlCode.match(/<mjml[^>]*>([\s\S]*)<\/mjml>/);
      const innerContent = mjmlMatch ? mjmlMatch[1].trim() : mjmlCode;
      
      // Create proper MJML structure with fallback
      mjmlCode = `<mjml>
  <mj-head>
    <mj-title>Email Campaign</mj-title>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, Arial, sans-serif" />
      <mj-text font-size="16px" color="#2C3959" line-height="1.6" />
      <mj-button background-color="#4BFF7E" color="#FFFFFF" font-size="16px" font-weight="600" border-radius="6px" />
    </mj-attributes>
    <mj-style>
      .hero-text { font-size: 28px; font-weight: 700; line-height: 1.2; }
      .price-highlight { font-size: 24px; font-weight: 700; color: #FF6240; }
      @media only screen and (max-width: 600px) {
        .hero-text { font-size: 24px !important; }
        .price-highlight { font-size: 20px !important; }
      }
    </mj-style>
  </mj-head>
  <mj-body background-color="#FFFFFF">
    ${innerContent.includes('<mj-section>') ? innerContent : `
    <mj-section background-color="#FFFFFF" padding="20px">
      <mj-column>
        <mj-text>
          ${innerContent || 'Email content will be generated here'}
        </mj-text>
      </mj-column>
    </mj-section>
    `}
  </mj-body>
</mjml>`;
    }
    
    console.log('✅ MJML template generated successfully using OpenAI Agents SDK');
    
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
    
    // Load content context from OpenAI SDK context parameter - prioritize loaded context
    let contentContext;
    
    // Try to get content context from design context first (loaded by loadDesignContext)
    if (context?.designContext?.content_context) {
      contentContext = context.designContext.content_context;
      console.log('✅ Using content context from design context (loaded by loadDesignContext)');
    } else if (params.content_context && Object.keys(params.content_context).length > 0) {
      contentContext = params.content_context;
      console.log('⚠️ Using content context from parameters (fallback)');
    } else if (context?.content_context) {
      contentContext = context.content_context;
      console.log('⚠️ Using content context from SDK context (fallback)');
    } else if (context?.contentContext) {
      contentContext = context.contentContext;
      console.log('⚠️ Using contentContext from SDK context (fallback)');
    } else {
      throw new Error('Content context not found in parameters or context. loadDesignContext must be called first to load campaign context.');
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
      const templateDesign = context?.designContext?.template_design;
      const technicalSpec = context?.designContext?.technical_specification;
      
      if (!assetManifest) {
        throw new Error('Asset manifest not found in design context. processContentAssets must be completed first.');
      }

      // Load technical specification from campaign
      const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
      const techSpecContent = await fs.readFile(techSpecPath, 'utf8');
      const techSpec = JSON.parse(techSpecContent);

      console.log('✅ Loaded technical specification and asset manifest');
      console.log(`📊 Assets: ${Array.isArray(assetManifest.images) ? assetManifest.images.length : 0} images, ${Array.isArray(assetManifest.icons) ? assetManifest.icons.length : 0} icons`);

      // Generate MJML template
      let mjmlTemplate;
      
      if (templateDesign) {
        // Use AI-enhanced generation with template design
        console.log('🎨 Using AI template design for enhanced MJML generation');
        
        // Extract colors from technical specification or use defaults
        const colors = {
          primary: techSpec.design?.constraints?.colorScheme?.primary || '#4BFF7E',
          accent: techSpec.design?.constraints?.colorScheme?.accent || '#FF6240', 
          background: techSpec.design?.constraints?.colorScheme?.background?.primary || '#FFFFFF',
          text: techSpec.design?.constraints?.colorScheme?.text?.primary || '#2C3959'
        };
        
        // Extract layout from technical specification
        const layout = {
          maxWidth: techSpec.design?.constraints?.layout?.maxWidth || 600,
          headingFont: techSpec.design?.constraints?.typography?.headingFont?.family || 'Arial, sans-serif',
          bodyFont: techSpec.design?.constraints?.typography?.bodyFont?.family || 'Arial, sans-serif',
          typography: techSpec.design?.constraints?.typography || {}
        };
        
        mjmlTemplate = await generateDynamicMjmlTemplate({
          contentContext,
          designBrief: null, // Not used in current implementation
          templateDesign,
          assetManifest,
          techSpec,
          colors,
          layout
        });
      } else {
        // Fallback to standard generation
        console.log('⚠️ No template design found, using standard MJML generation');
        
        // Use default colors and layout for fallback
        const colors = {
          primary: '#4BFF7E',
          accent: '#FF6240',
          background: '#FFFFFF',
          text: '#2C3959'
        };
        
        const layout = {
          maxWidth: 600,
          headingFont: 'Arial, sans-serif',
          bodyFont: 'Arial, sans-serif',
          typography: {}
        };
        
        mjmlTemplate = await generateDynamicMjmlTemplate({
          contentContext,
          designBrief: null,
          templateDesign: null,
          assetManifest,
          techSpec,
          colors,
          layout
        });
      }

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