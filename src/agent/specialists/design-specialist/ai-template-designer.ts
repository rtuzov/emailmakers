/**
 * AI Template Designer
 * AI-powered template design generation before MJML coding
 */

import { tool, Agent, run } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext } from './design-context';
import { TemplateDesign } from './types';

/**
 * AI Template Design Sub-Agent
 * Uses OpenAI Agents SDK patterns for AI generation
 */
const templateDesignAgent = new Agent({
  name: 'Template Design AI',
  instructions: `Ты эксперт по email дизайну и верстке. Создавай профессиональные email шаблоны с учетом всех технических требований.

ТВОЯ ЗАДАЧА: Создать детальный дизайн email шаблона в формате JSON.

ВСЕГДА возвращай ТОЛЬКО валидный JSON без дополнительных комментариев или markdown форматирования.

Структура JSON должна включать:
- template_id, template_name, description
- target_audience, visual_concept
- layout (type, max_width, sections_count, visual_hierarchy, spacing_system)
- sections (массив с header, hero, content, cta, footer)
- components (кнопки, карточки и т.д.)
- responsive (breakpoints с adjustments)
- accessibility (alt_texts, color_contrast, font_sizes)
- email_client_optimizations (outlook, gmail, apple_mail)
- performance (size targets, optimization)

Используй предоставленный контекст для создания уникального и продуманного дизайна.`,
  model: 'gpt-4o-mini'
});

/**
 * Generate AI-powered template design using sub-agent
 */
async function generateAITemplateDesign(params: {
  contentContext: any;
  designBrief: any;
  assetManifest: any;
  techSpec: any;
  designRequirements: any;
}): Promise<TemplateDesign> {
  const { contentContext, designBrief, assetManifest, techSpec, designRequirements } = params;
  
  // Extract content for AI analysis
  const subject = contentContext.subject || contentContext.generated_content?.subject;
  const body = contentContext.body || contentContext.generated_content?.body;
  const pricing = contentContext.pricing || contentContext.generated_content?.pricing;
  const cta = contentContext.cta || contentContext.generated_content?.cta;
  
  // Extract brand colors
  const primaryColor = designBrief.design_requirements?.primary_color || designBrief.brand_colors?.primary;
  const accentColor = designBrief.design_requirements?.accent_color || designBrief.brand_colors?.accent;
  const backgroundColor = designBrief.design_requirements?.background_color || designBrief.brand_colors?.background;
  
  // Extract assets information
  const localImages = assetManifest.images.filter((img: any) => !img.isExternal);
  const externalImages = assetManifest.images.filter((img: any) => img.isExternal);
  const totalImages = assetManifest.images.length;
  
  const templateDesignPrompt = `
Создай детальный дизайн email шаблона для профессиональной верстки в MJML.

📧 КОНТЕКСТ КАМПАНИИ:
Тема: ${subject}
Контент: ${body}
Цены: ${JSON.stringify(pricing)}
Призыв к действию: ${cta}

🎨 БРЕНДИНГ:
Основной цвет: ${primaryColor}
Акцентный цвет: ${accentColor}
Фон: ${backgroundColor}
Стиль: ${designBrief.visual_style || 'modern'}

🖼️ ДОСТУПНЫЕ РЕСУРСЫ:
Всего изображений: ${totalImages}
Локальные изображения: ${localImages.length}
Внешние изображения: ${externalImages.length}
Иконки: ${assetManifest.icons.length}

📱 ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
Максимальная ширина: ${techSpec.specification?.design?.constraints?.layout?.maxWidth || 600}px
Email клиенты: ${techSpec.specification?.delivery?.emailClients?.map((c: any) => c.client).join(', ')}
Темная тема: ${techSpec.specification?.design?.constraints?.layout?.supportsDarkMode ? 'да' : 'нет'}

🎯 ЗАДАЧА:
Создай профессиональный дизайн email шаблона в формате JSON со следующей структурой:

{
  "template_id": "уникальный_идентификатор",
  "template_name": "Название шаблона",
  "description": "Описание концепции дизайна",
  "target_audience": "Целевая аудитория",
  "visual_concept": "Визуальная концепция и подход",
  
  "layout": {
    "type": "single-column | multi-column | hybrid",
    "max_width": 600,
    "sections_count": 5,
    "visual_hierarchy": "Описание визуальной иерархии",
    "spacing_system": {
      "section_padding": "20px",
      "content_padding": "15px",
      "element_margin": "10px"
    }
  },
  
  "sections": [
    {
      "id": "header",
      "type": "header",
      "position": 1,
      "content": {
        "logo": {
          "required": true,
          "position": "left | center | right",
          "size": "small | medium | large"
        },
        "navigation": {
          "required": false,
          "items": []
        }
      },
      "styling": {
        "background_color": "#ffffff",
        "padding": "20px",
        "border_bottom": "1px solid #e5e5e5"
      }
    },
    {
      "id": "hero",
      "type": "hero",
      "position": 2,
      "content": {
        "headline": "Основной заголовок",
        "subheadline": "Подзаголовок",
        "hero_image": {
          "required": true,
          "source": "external | local",
          "position": "background | inline",
          "size": "full-width | contained"
        },
        "cta_button": {
          "text": "Призыв к действию",
          "style": "primary | secondary",
          "position": "center | left | right"
        }
      },
      "styling": {
        "background_color": "${backgroundColor}",
        "text_color": "#333333",
        "padding": "40px 20px",
        "text_align": "center"
      }
    },
    {
      "id": "content",
      "type": "content",
      "position": 3,
      "content": {
        "text_blocks": [
          {
            "type": "paragraph",
            "content": "Основной текст контента",
            "styling": "body-text"
          }
        ],
        "images": {
          "count": ${Math.min(totalImages - 1, 3)},
          "layout": "grid | carousel | inline",
          "sources": ["external", "local"]
        },
        "pricing": {
          "display": true,
          "style": "card | inline | highlight",
          "position": "center"
        }
      },
      "styling": {
        "background_color": "#ffffff",
        "padding": "30px 20px",
        "text_align": "left"
      }
    },
    {
      "id": "cta",
      "type": "call-to-action",
      "position": 4,
      "content": {
        "headline": "Финальный призыв",
        "button": {
          "text": "${cta}",
          "style": "large-primary",
          "background_color": "${accentColor}",
          "text_color": "#ffffff"
        },
        "supporting_text": "Дополнительный текст"
      },
      "styling": {
        "background_color": "${primaryColor}",
        "text_color": "#ffffff",
        "padding": "40px 20px",
        "text_align": "center"
      }
    },
    {
      "id": "footer",
      "type": "footer",
      "position": 5,
      "content": {
        "social_links": {
          "required": true,
          "platforms": ["facebook", "instagram", "twitter"]
        },
        "contact_info": {
          "required": true,
          "elements": ["address", "phone", "email"]
        },
        "unsubscribe": {
          "required": true,
          "text": "Отписаться от рассылки"
        }
      },
      "styling": {
        "background_color": "#f8f9fa",
        "text_color": "#666666",
        "padding": "30px 20px",
        "text_align": "center",
        "font_size": "14px"
      }
    }
  ],
  
  "components": [
    {
      "id": "primary_button",
      "type": "button",
      "styling": {
        "background_color": "${accentColor}",
        "text_color": "#ffffff",
        "border_radius": "6px",
        "padding": "12px 24px",
        "font_weight": "600",
        "font_size": "16px"
      },
      "hover_effects": {
        "background_color": "${accentColor}dd"
      }
    },
    {
      "id": "price_card",
      "type": "card",
      "styling": {
        "background_color": "#ffffff",
        "border": "1px solid #e5e5e5",
        "border_radius": "8px",
        "padding": "20px",
        "box_shadow": "0 2px 8px rgba(0,0,0,0.1)"
      }
    }
  ],
  
  "responsive": {
    "breakpoints": [
      {
        "name": "mobile",
        "max_width": "480px",
        "adjustments": {
          "font_sizes": "уменьшить на 2px",
          "padding": "уменьшить на 25%",
          "images": "full-width",
          "columns": "stack vertically"
        }
      },
      {
        "name": "tablet",
        "max_width": "768px",
        "adjustments": {
          "font_sizes": "уменьшить на 1px",
          "padding": "уменьшить на 15%"
        }
      }
    ]
  },
  
  "accessibility": {
    "alt_texts": "Все изображения должны иметь описательные alt-тексты",
    "color_contrast": "Минимум 4.5:1 для основного текста",
    "font_sizes": "Минимум 14px для основного текста",
    "link_styling": "Подчеркивание для всех ссылок"
  },
  
  "email_client_optimizations": {
    "outlook": {
      "table_based_layout": true,
      "conditional_comments": true,
      "fallback_fonts": true
    },
    "gmail": {
      "embedded_css": true,
      "image_blocking": "учтено",
      "clipping_prevention": true
    },
    "apple_mail": {
      "dark_mode_support": true,
      "retina_images": true
    }
  },
  
  "performance": {
    "total_size_target": "под 100KB",
    "image_optimization": "WebP с JPEG fallback",
    "css_inlining": "критичные стили инлайн",
    "loading_strategy": "прогрессивная загрузка"
  }
}

ВАЖНО:
- Создай уникальный и продуманный дизайн
- Используй все доступные изображения эффективно
- Учти особенности email клиентов
- Обеспечь отличную читаемость на мобильных
- Сделай дизайн конверсионно-ориентированным
- Ответ должен быть валидным JSON БЕЗ markdown форматирования
`;

  try {
    // Use OpenAI Agents SDK sub-agent for AI generation
    const result = await run(templateDesignAgent, templateDesignPrompt);
    
    // Parse JSON response
    let jsonString = result.finalOutput.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const templateDesign = JSON.parse(jsonString.trim());
    
    // Add metadata
    templateDesign.metadata = {
      generated_at: new Date().toISOString(),
      generated_by: 'AI Template Designer (OpenAI Agents SDK)',
      campaign_id: contentContext.campaign?.id,
      assets_used: {
        total_images: totalImages,
        local_images: localImages.length,
        external_images: externalImages.length,
        icons: assetManifest.icons.length
      },
      brand_colors: {
        primary: primaryColor,
        accent: accentColor,
        background: backgroundColor
      }
    };
    
    return templateDesign;

  } catch (error) {
    console.error('AI Template Design generation failed:', error);
    throw new Error(`Failed to generate AI template design: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    console.log(`🎯 AI Template Design Generation using OpenAI Agents SDK`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Get asset manifest from design context - REQUIRED
      const assetManifest = context?.designContext?.asset_manifest;
      
      if (!assetManifest) {
        throw new Error('Asset manifest not found in design context. processContentAssets must be completed before template design.');
      }
      
      // Load design brief and technical specification
      const designBriefPath = path.join(campaignPath, 'content', 'design-brief-from-context.json');
      const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
      
      const designBriefContent = await fs.readFile(designBriefPath, 'utf8');
      const techSpecContent = await fs.readFile(techSpecPath, 'utf8');
      
      const designBrief = JSON.parse(designBriefContent);
      const techSpec = JSON.parse(techSpecContent);
      
      console.log('✅ Loaded design brief and technical specification');

      // 🤖 GENERATE TEMPLATE DESIGN WITH AI using OpenAI Agents SDK
      const templateDesign = await generateAITemplateDesign({
        contentContext,
        designBrief,
        assetManifest,
        techSpec,
        designRequirements: params.design_requirements
      });

      // Save template design to campaign
      const templateDesignPath = path.join(campaignPath, 'design', 'template-design.json');
      await fs.mkdir(path.dirname(templateDesignPath), { recursive: true });
      await fs.writeFile(templateDesignPath, JSON.stringify(templateDesign, null, 2));
      
      console.log('✅ Template design saved to campaign');

      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        template_design: templateDesign,
        trace_id: params.trace_id
      });

      // Save context to context parameter (OpenAI SDK pattern)
      if (context) {
        context.designContext = updatedDesignContext;
      }

      console.log('✅ AI Template Design completed successfully (OpenAI Agents SDK)');
      console.log(`📊 Sections: ${templateDesign.sections.length}`);
      console.log(`🎨 Layout: ${templateDesign.layout.type}`);
      console.log(`📱 Responsive: ${templateDesign.responsive.breakpoints.length} breakpoints`);
      console.log(`🎯 Components: ${templateDesign.components.length} custom components`);

      return `AI Template Design completed successfully using OpenAI Agents SDK! Generated ${templateDesign.sections.length} sections with ${templateDesign.layout.type} layout. Responsive design with ${templateDesign.responsive.breakpoints.length} breakpoints. Created ${templateDesign.components.length} custom components. Visual hierarchy optimized for ${templateDesign.target_audience}. Design saved to: ${templateDesignPath}. Ready for MJML template generation.`;

    } catch (error) {
      console.error('❌ AI Template Design failed:', error);
      throw error;
    }
  }
}); 