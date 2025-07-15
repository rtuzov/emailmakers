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
  
  // Extract content for AI analysis - use proper paths for all data
  const subject = contentContext.generated_content?.subject || contentContext.subject;
  const body = contentContext.generated_content?.body || contentContext.body;
  const preheader = contentContext.generated_content?.preheader;
  
  // Extract pricing information from multiple possible sources
  const pricingData = contentContext.pricing_analysis || contentContext.pricing || contentContext.generated_content?.pricing;
  const bestPrice = pricingData?.best_price || pricingData?.min_price;
  const currency = pricingData?.currency || 'RUB';
  const formattedPrice = bestPrice ? `${bestPrice} ${currency}` : 'Цена по запросу';
  
  // Extract CTA from content
  const ctaData = contentContext.generated_content?.cta;
  const primaryCTA = ctaData?.primary || 'Забронировать';
  const secondaryCTA = ctaData?.secondary || 'Узнать больше';
  
  // Extract dates
  const dateAnalysis = contentContext.date_analysis;
  const optimalDates = dateAnalysis?.optimal_dates || [];
  const formattedDates = optimalDates.slice(0, 3).join(', ');
  
  // Extract destination info
  const destination = contentContext.context_analysis?.destination || dateAnalysis?.destination || 'место назначения';
  
  // Extract brand colors with fallbacks
  const primaryColor = designBrief.design_requirements?.primary_color || 
                      designBrief.brand_colors?.primary || 
                      '#4BFF7E';
  const accentColor = designBrief.design_requirements?.accent_color || 
                     designBrief.brand_colors?.accent || 
                     '#FF6240';
  const backgroundColor = designBrief.design_requirements?.background_color || 
                         designBrief.brand_colors?.background || 
                         '#EDEFFF';
  
  // Extract assets information - handle both local and external assets properly
  const images = Array.isArray(assetManifest?.images) ? assetManifest.images : [];
  const icons = Array.isArray(assetManifest?.icons) ? assetManifest.icons : [];
  const allAssets = [...images, ...icons];
  
  console.log(`🔍 Processing assets: ${images.length} images, ${icons.length} icons`);
  
  // Separate local and external images
  const localImages = images.filter((img: any) => !img.isExternal);
  const externalImages = images.filter((img: any) => img.isExternal);
  const totalImages = images.length;
  
  console.log(`📊 Asset breakdown: ${localImages.length} local, ${externalImages.length} external images`);
  
  // Find specific assets for template - prioritize external images for hero
  const heroAsset = externalImages[0] || localImages[0] || images[0];
  
  // Use remaining images for content sections
  const contentAssets = [
    ...externalImages.slice(1),  // Use external images first
    ...localImages.slice(heroAsset === localImages[0] ? 1 : 0)  // Then local images
  ].slice(0, 3);
  
  console.log(`🎯 Selected hero asset: ${heroAsset?.filename || 'none'} (external: ${heroAsset?.isExternal})`);
  console.log(`📷 Content assets: ${contentAssets.length} selected`);

  const templateDesignPrompt = `
Проанализируй контент и создай детальный дизайн email шаблона, адаптированный под специфику кампании.

🧠 АНАЛИЗ КОНТЕНТА:

📧 КОНТЕКСТ КАМПАНИИ:
Тема: ${subject}
Preheader: ${preheader}
Контент: ${body?.substring(0, 500)}...
Цена: ${formattedPrice}
Даты: ${formattedDates}
Направление: ${destination}
Основной CTA: ${primaryCTA}
Дополнительный CTA: ${secondaryCTA}

🎨 БАЗОВЫЕ ЦВЕТА БРЕНДА (можешь адаптировать):
Основной цвет: ${primaryColor}
Акцентный цвет: ${accentColor}
Фон: ${backgroundColor}
Стиль: ${designBrief.visual_style || 'modern'}

🖼️ ДОСТУПНЫЕ РЕСУРСЫ:
Всего изображений: ${totalImages}
Локальные изображения: ${localImages.length}
Внешние изображения: ${externalImages.length}
Иконки: ${icons.length}

Hero изображение: ${heroAsset?.filename || 'не найдено'} 
- Путь: ${heroAsset?.path || heroAsset?.url || 'placeholder.jpg'}
- Описание: ${heroAsset?.alt_text || heroAsset?.description || 'Hero image'}
- Внешнее: ${heroAsset?.isExternal ? 'да' : 'нет'}

Контентные изображения (${contentAssets.length}):
${contentAssets.map((asset, i) => 
  `${i+1}. ${asset.filename} - ${asset.alt_text || asset.description} (внешнее: ${asset.isExternal ? 'да' : 'нет'})`
).join('\n')}

📱 ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
Максимальная ширина: ${techSpec.specification?.design?.constraints?.layout?.maxWidth || 600}px
Email клиенты: ${techSpec.specification?.delivery?.emailClients?.map((c: any) => c.client).join(', ') || 'gmail, outlook, apple-mail'}

🎯 ЗАДАЧА: СОЗДАЙ АДАПТИВНЫЙ ДИЗАЙН

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
   - Адаптируй базовые цвета бренда под контекст

3. ОПРЕДЕЛИ СТРУКТУРУ:
   - Для коротких сообщений: компактная структура (5-6 секций)
   - Для детальных: расширенная структура (8-10 секций)
   - Адаптируй под тип кампании (промо, информационная, сезонная)

4. ВЫБЕРИ ТИПОГРАФИКУ:
   - Заголовки: размер зависит от важности
   - Основной текст: читаемость для аудитории
   - Эмодзи: соответственно тематике и аудитории

ВАЖНЫЕ ТРЕБОВАНИЯ:
1. Используй ТОЧНЫЕ пути к файлам из списка ассетов выше
2. Для внешних изображений используй URL (поле path/url)
3. Для локальных изображений используй локальный путь
4. Используй РЕАЛЬНУЮ цену: ${formattedPrice}
5. Используй РЕАЛЬНЫЕ CTA кнопки: "${primaryCTA}" и "${secondaryCTA}"
6. Включи реальные даты: ${formattedDates}
7. АДАПТИРУЙ дизайн под анализ контента

{
  "template_id": "autumn_${destination.toLowerCase()}_campaign",
  "template_name": "${subject}",
  "description": "Email шаблон для ${destination} кампании с реальными ассетами и ценами",
  "target_audience": "${contentContext.campaign?.target_audience || 'путешественники'}",
  "visual_concept": "Современный дизайн с акцентом на ${destination} и осенний отдых",
  
  "layout": {
    "type": "single-column",
    "max_width": 600,
    "sections_count": 5,
    "visual_hierarchy": "Hero изображение → контент → цены → CTA → footer",
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
          "position": "center",
          "size": "medium"
        }
      },
      "styling": {
        "background_color": "#ffffff",
        "padding": "20px"
      }
    },
    {
      "id": "hero",
      "type": "hero", 
      "position": 2,
      "content": {
        "headline": "${subject}",
        "subheadline": "${preheader}",
        "hero_image": {
          "required": true,
          "source": "${heroAsset?.isExternal ? 'external' : 'local'}",
          "position": "background",
          "size": "full-width",
          "asset_file": "${heroAsset?.path || heroAsset?.url || 'placeholder.jpg'}",
          "alt_text": "${heroAsset?.alt_text || heroAsset?.description || 'Hero image'}"
        },
        "cta_button": {
          "text": "${primaryCTA}",
          "style": "primary",
          "position": "center"
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
            "content": "${body?.substring(0, 200)}...",
            "styling": "body-text"
          }
        ],
        "images": {
          "count": ${contentAssets.length},
          "layout": "grid",
          "sources": [${contentAssets.map(a => `"${a.isExternal ? 'external' : 'local'}"`).join(', ')}],
          "asset_files": [
            ${contentAssets.map(asset => 
              `{
                "file": "${asset.path || asset.url}",
                "alt_text": "${asset.alt_text || asset.description}",
                "usage": "${asset.usage || 'content'}",
                "isExternal": ${asset.isExternal || false}
              }`
            ).join(',\n            ')}
          ]
        },
        "pricing": {
          "display": true,
          "price": "${formattedPrice}",
          "dates": "${formattedDates}",
          "style": "highlight",
          "position": "center"
        }
      },
      "styling": {
        "background_color": "#ffffff",
        "padding": "30px 20px"
      }
    },
    {
      "id": "cta",
      "type": "call-to-action",
      "position": 4,
      "content": {
        "headline": "Не упустите шанс!",
        "button": {
          "text": "${primaryCTA} от ${formattedPrice}",
          "style": "large-primary",
          "background_color": "${accentColor}",
          "text_color": "#ffffff"
        },
        "supporting_text": "Лучшие даты: ${formattedDates}"
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
        "text_align": "center"
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
          } else if (context?.content_context) {
        contentContext = context.content_context;
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
      
      console.log(`🔍 Looking for design brief at: ${designBriefPath}`);
      console.log(`🔍 Looking for tech spec at: ${techSpecPath}`);
      
      // Check if design brief exists
      let designBrief;
      try {
        const designBriefExists = await fs.access(designBriefPath).then(() => true).catch(() => false);
        console.log(`📋 Design brief exists: ${designBriefExists}`);
        
        if (designBriefExists) {
          const designBriefContent = await fs.readFile(designBriefPath, 'utf8');
          designBrief = JSON.parse(designBriefContent);
          console.log('✅ Loaded design brief from file');
        } else {
          console.log('⚠️ Design brief not found, creating fallback design brief');
          // Create fallback design brief
          designBrief = {
            destination_context: {
              name: contentContext.campaign?.destination || 'Thailand',
              seasonal_advantages: 'Осенний сезон с комфортной погодой',
              emotional_appeal: 'Приключения и отдых',
              market_position: 'Популярное туристическое направление'
            },
            design_requirements: {
              visual_style: 'Современный, привлекательный стиль',
              color_palette: 'Яркие цвета Kupibilet',
              primary_color: '#4BFF7E',
              accent_color: '#1DA857', 
              background_color: '#FFFFFF',
              text_color: '#2C3959',
              imagery_direction: 'Тропические пейзажи и культура',
              typography_mood: 'Дружелюбный и современный'
            },
            content_priorities: {
              key_messages: ['Отличные цены', 'Удобное бронирование'],
              emotional_triggers: ['Приключения', 'Отдых'],
              actionable_insights: ['Бронируйте сейчас', 'Ограниченное предложение']
            }
          };
        }
      } catch (error) {
        console.error('❌ Error loading design brief:', error.message);
        throw new Error(`Failed to load design brief: ${error.message}`);
      }
      
      // Check if technical specification exists
      let techSpec;
      try {
        const techSpecExists = await fs.access(techSpecPath).then(() => true).catch(() => false);
        console.log(`📋 Tech spec exists: ${techSpecExists}`);
        
        if (techSpecExists) {
          const techSpecContent = await fs.readFile(techSpecPath, 'utf8');
          techSpec = JSON.parse(techSpecContent);
          console.log('✅ Loaded technical specification from file');
        } else {
          console.log('⚠️ Technical specification not found, creating fallback tech spec');
          // Create fallback technical specification
          techSpec = {
            email_specifications: {
              max_width: '600px',
              responsive_breakpoints: ['600px', '480px'],
              supported_clients: ['Gmail', 'Outlook', 'Apple Mail'],
              dark_mode_support: true
            },
            content_structure: {
              header: 'Логотип и навигация',
              hero_section: 'Главное предложение',
              content_blocks: 'Детали предложения',
              cta_section: 'Призыв к действию',
              footer: 'Контакты и отписка'
            },
            performance_requirements: {
              load_time: '<3 seconds',
              file_size: '<100KB',
              image_optimization: 'WebP with JPEG fallback'
            }
          };
        }
      } catch (error) {
        console.error('❌ Error loading technical specification:', error.message);
        throw new Error(`Failed to load technical specification: ${error.message}`);
      }
      
      console.log('✅ Design brief and technical specification loaded (with fallbacks if needed)');

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