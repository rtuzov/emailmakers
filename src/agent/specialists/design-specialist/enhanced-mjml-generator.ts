/**
 * Enhanced MJML Generator
 * Генерирует современные MJML шаблоны на основе анализа контента и адаптивного дизайна
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { ContentAnalysis, DesignPersonality } from './content-intelligence-analyzer';
import { AdaptiveDesign } from './adaptive-design-engine';

export class VisualComponentLibrary {
  
  /**
   * Генерирует умный блок цен на основе анализа
   */
  generatePriceCard(pricing: any, analysis: ContentAnalysis, colors: any): string {
    const urgencyEmoji = analysis.urgencyLevel === 'high' ? '🔥 ' : 
                        analysis.urgencyLevel === 'medium' ? '⭐ ' : '';
    
    const offerText = this.getOfferText(analysis.urgencyLevel, analysis.campaignType);
    
    return `
    <mj-section background-color="${colors.cta.primary}" border-radius="15px" padding="20px" css-class="price-card">
      <mj-column>
        <mj-text font-size="14px" color="white" align="center" font-weight="500">
          ${urgencyEmoji}${offerText}
        </mj-text>
        <mj-text font-size="32px" font-weight="bold" color="white" align="center" line-height="1.2" padding="5px 0">
          от ${pricing.best_price}${pricing.currency}
        </mj-text>
        <mj-text font-size="14px" color="white" align="center" css-class="price-subtitle">
          за человека
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  /**
   * Интерактивный календарь дат
   */
  generateDateSelector(dates: string[], colors: any): string {
    const dateCards = dates.slice(0, 5).map((date, index) => {
      const isHighlighted = index === 0;
      const borderColor = isHighlighted ? colors.cta.primary : '#ddd';
      const bgColor = isHighlighted ? colors.cta.primary : 'white';
      const textColor = isHighlighted ? 'white' : '#333';
      
      return `
        <td align="center" style="padding:8px;">
          <div style="background:${bgColor};border-radius:8px;padding:12px;border:2px solid ${borderColor};min-width:60px;">
            <div style="font-size:11px;color:${textColor};opacity:0.8;font-weight:500;">${this.formatDateMonth(date)}</div>
            <div style="font-size:18px;font-weight:bold;color:${textColor};margin-top:2px;">${this.formatDateDay(date)}</div>
          </div>
        </td>`;
    }).join('');
    
    return `
    <mj-section background-color="#f8f9ff" border-radius="12px" padding="20px" css-class="date-selector">
      <mj-column>
        <mj-text font-size="18px" font-weight="bold" align="center" color="#333" padding-bottom="15px">
          📅 Оптимальные даты для путешествия
        </mj-text>
        <mj-raw>
          <table style="width:100%;border-collapse:separate;border-spacing:10px;">
            <tr>
              ${dateCards}
            </tr>
          </table>
        </mj-raw>
      </mj-column>
    </mj-section>`;
  }

  /**
   * Блок с иконками преимуществ
   */
  generateFeatureIcons(analysis: ContentAnalysis, colors: any): string {
    const features = this.getThemeFeatures(analysis.theme);
    const icons = this.getThemeIcons(analysis.theme);
    
    const featureCards = features.slice(0, 3).map((feature, index) => {
      const icon = icons[index] || '✨';
      const bgColor = this.generateFeatureColor(colors, index);
      
      return `
        <td align="center" style="width:33.33%;padding:15px;">
          <div style="width:60px;height:60px;background:${bgColor};border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:24px;">
            ${icon}
          </div>
          <div style="font-size:14px;font-weight:bold;color:#333;line-height:1.3;">${feature}</div>
        </td>`;
    }).join('');
    
    return `
    <mj-section padding="30px 20px" css-class="feature-icons">
      <mj-column>
        <mj-raw>
          <table style="width:100%;">
            <tr>
              ${featureCards}
            </tr>
          </table>
        </mj-raw>
      </mj-column>
    </mj-section>`;
  }

  /**
   * Блок срочности с анимацией
   */
  generateUrgencyBlock(analysis: ContentAnalysis, colors: any): string {
    if (analysis.urgencyLevel === 'low') return '';
    
    const urgencyTexts = {
      high: 'Ограниченное предложение!',
      medium: 'Специальная цена!'
    };
    
    const subTexts = {
      high: 'Осталось мест: 12 | До окончания акции: 3 дня',
      medium: 'Количество мест ограничено'
    };
    
    return `
    <mj-section background-color="${colors.status.warning}" padding="15px" border-radius="8px" css-class="urgency-block">
      <mj-column>
        <mj-text font-size="16px" font-weight="bold" color="white" align="center" padding-bottom="5px">
          ⏰ ${urgencyTexts[analysis.urgencyLevel]}
        </mj-text>
        <mj-text font-size="14px" color="white" align="center" css-class="urgency-subtitle">
          ${subTexts[analysis.urgencyLevel]}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  /**
   * Социальные доказательства для премиум сегмента
   */
  generateTrustElements(analysis: ContentAnalysis, _colors: any): string {
    if (analysis.priceCategory !== 'premium') return '';
    
    return `
    <mj-section background-color="#fff8e1" border-radius="10px" padding="20px" css-class="trust-elements">
      <mj-column>
        <mj-text align="center" padding-bottom="10px">
          <span style="color:#FFD700;font-size:20px;">⭐⭐⭐⭐⭐</span>
        </mj-text>
        <mj-text font-size="16px" color="#333" font-style="italic" align="center" padding-bottom="8px">
          "Незабываемое путешествие! Превзошло все ожидания"
        </mj-text>
        <mj-text font-size="14px" color="#666" align="center">
          — Мария К., путешественница
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  /**
   * Адаптивная галерея изображений
   */
  generateImageGallery(images: any[], _colors: any): string {
    if (!images || images.length <= 1) return '';
    
    const galleryImages = images.slice(1, 5).map(image => `
      <mj-column width="50%">
        <mj-image 
          src="${image.url}" 
          alt="${image.alt_text}" 
          border-radius="8px"
          padding="5px"
        />
      </mj-column>
    `).join('');
    
    return `
    <mj-section padding="20px" css-class="image-gallery">
      ${galleryImages}
    </mj-section>`;
  }

  /**
   * Модернизированная CTA кнопка
   */
  generateModernCTA(cta: string, analysis: ContentAnalysis, colors: any): string {
    const buttonStyle = this.getCTAStyle(analysis, colors);
    
    return `
    <mj-section padding="30px 20px" css-class="cta-section">
      <mj-column>
        <mj-button 
          background-color="${buttonStyle.background}"
          color="${buttonStyle.textColor}"
          border-radius="${buttonStyle.borderRadius}"
          font-size="${buttonStyle.fontSize}"
          font-weight="${buttonStyle.fontWeight}"
          inner-padding="${buttonStyle.padding}"
          css-class="${buttonStyle.cssClass}"
          href="#"
        >
          ${cta}
        </mj-button>
      </mj-column>
    </mj-section>`;
  }

  // Утилиты
  private getOfferText(urgencyLevel: string, _campaignType: string): string {
    const texts = {
      high: 'Ограниченное предложение',
      medium: 'Специальная цена',
      low: 'Выгодное предложение'
    };
    
    return texts[urgencyLevel as keyof typeof texts] || texts.low;
  }

  private formatDateMonth(dateStr: string): string {
    const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
    const date = new Date(dateStr);
    return months[date.getMonth()] || 'МАР';
  }

  private formatDateDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }

  private getThemeFeatures(theme: string): string[] {
    const featureMap = {
      travel: ['Древние руины майя', 'Треккинг к вулканам', 'Местная культура'],
      business: ['Экспертность', 'Надежность', 'Инновации'],
      promotional: ['Выгодная цена', 'Быстрое оформление', 'Гарантия качества'],
      premium: ['Эксклюзивность', 'Персональный сервис', 'Высокое качество']
    };
    
    return featureMap[theme as keyof typeof featureMap] || featureMap.business;
  }

  private getThemeIcons(theme: string): string[] {
    const iconMap = {
      travel: ['🏛️', '🌋', '🎭'],
      business: ['🚀', '🛡️', '💡'],
      promotional: ['💰', '⚡', '✅'],
      premium: ['👑', '🌟', '💎']
    };
    
    return iconMap[theme as keyof typeof iconMap] || iconMap.business;
  }

  private generateFeatureColor(colors: any, index: number): string {
    const baseColors = [colors.primary, colors.accent, colors.cta.primary];
    return baseColors[index % baseColors.length] + '20'; // 20% opacity
  }

  private getCTAStyle(analysis: ContentAnalysis, colors: any) {
    const baseStyle = {
      background: colors.cta.primary,
      textColor: '#FFFFFF',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '15px 30px',
      cssClass: 'cta-button'
    };

    // Модификации в зависимости от анализа
    if (analysis.urgencyLevel === 'high') {
      baseStyle.background = `linear-gradient(135deg, ${colors.cta.primary}, #FF6B35)`;
      baseStyle.cssClass += ' urgent-cta';
    }

    if ((analysis as any).visualStyle === 'luxurious') {
      baseStyle.borderRadius = '12px';
      baseStyle.padding = '18px 35px';
    }

    if (analysis.audienceType === 'young') {
      baseStyle.borderRadius = '25px';
      baseStyle.cssClass += ' playful-cta';
    }

    return baseStyle;
  }
}

export class EnhancedMjmlGenerator {
  private componentLibrary: VisualComponentLibrary;

  constructor() {
    this.componentLibrary = new VisualComponentLibrary();
  }

  /**
   * Генерирует MJML шаблон на основе всех данных анализа
   */
  generateEnhancedMjmlTemplate(
    contentContext: any,
    analysis: ContentAnalysis,
    personality: DesignPersonality,
    adaptiveDesign: AdaptiveDesign,
    assets: any
  ): string {
    console.log('🎨 Generating enhanced MJML template...');
    
    // Диагностическая информация о структуре contentContext
    console.log('🔍 ContentContext structure check:', {
      hasContentContext: !!contentContext,
      hasSubject: !!contentContext?.subject,
      hasPreheader: !!contentContext?.preheader,
      hasCta: !!contentContext?.cta,
      ctaStructure: contentContext?.cta ? Object.keys(contentContext.cta) : 'null',
      ctaPrimary: contentContext?.cta?.primary || 'missing',
      hasGeneratedContent: !!contentContext?.generated_content,
      generatedContentCta: contentContext?.generated_content?.cta ? Object.keys(contentContext.generated_content.cta) : 'null',
      generatedContentCtaPrimary: contentContext?.generated_content?.cta?.primary || 'missing',
      // Проверим также все ключи верхнего уровня contentContext
      contentContextKeys: contentContext ? Object.keys(contentContext) : 'null'
    });

    // Базовая структура MJML с fallback значениями
    const subject = contentContext.subject || contentContext.generated_content?.subject || 'Email Campaign';
    const preheader = contentContext.preheader || contentContext.generated_content?.preheader || 'Email Preview';
    
    const mjmlTemplate = `
<mjml>
  <mj-head>
    <mj-title>${subject}</mj-title>
    <mj-preview>${preheader}</mj-preview>
    
    <!-- Responsive attributes -->
    <mj-attributes>
      <mj-all font-family="${adaptiveDesign.typography.fontFamilies.body}" />
      <mj-text font-size="${adaptiveDesign.typography.fontSizes.body}" 
               color="${adaptiveDesign.adaptedColors.text.primary}" 
               line-height="${adaptiveDesign.typography.lineHeights.normal}" />
      <mj-button background-color="${adaptiveDesign.adaptedColors.cta.primary}" 
                 color="${adaptiveDesign.adaptedColors.cta.text}"
                 border-radius="8px"
                 font-weight="${adaptiveDesign.typography.fontWeights.bold}" />
    </mj-attributes>
    
    <!-- Enhanced CSS Styles -->
    <mj-style>
      ${this.generateAdvancedCSS(analysis, personality, adaptiveDesign)}
    </mj-style>
    
    <!-- Dark theme support -->
    <mj-style>
      ${this.generateDarkThemeCSS(adaptiveDesign.adaptedColors)}
    </mj-style>
  </mj-head>
  
  <mj-body background-color="${adaptiveDesign.adaptedColors.background}">
    ${this.generateBodySections(contentContext, analysis, personality, adaptiveDesign, assets)}
  </mj-body>
</mjml>`;

    return mjmlTemplate.trim();
  }

  private generateBodySections(
    contentContext: any,
    analysis: ContentAnalysis,
    _personality: DesignPersonality,
    adaptiveDesign: AdaptiveDesign,
    assets: any
  ): string {
    let sections = '';

    // Генерируем секции в зависимости от структуры адаптивного дизайна
    adaptiveDesign.templateStructure.sections.forEach(section => {
      switch (section.type) {
        case 'header':
          sections += this.generateHeaderSection(contentContext, adaptiveDesign);
          break;
        case 'hero':
          sections += this.generateHeroSection(contentContext, adaptiveDesign, assets, analysis);
          break;
        case 'features':
          sections += this.componentLibrary.generateFeatureIcons(analysis, adaptiveDesign.adaptedColors);
          break;
        case 'content':
          sections += this.generateContentSections(contentContext, adaptiveDesign, analysis);
          break;
        case 'pricing':
          // Защитная проверка для поля pricing с несколькими возможными путями
          let pricingData = contentContext.pricing || 
                           contentContext.pricing_analysis || 
                           contentContext.generated_content?.pricing;
          
          if (pricingData) {
            sections += this.componentLibrary.generatePriceCard(pricingData, analysis, adaptiveDesign.adaptedColors);
          } else {
            console.warn('⚠️ Данные о ценах не найдены, пропускаем секцию pricing');
          }
          break;
        case 'gallery':
          sections += this.componentLibrary.generateImageGallery(assets.images, adaptiveDesign.adaptedColors);
          break;
        case 'testimonials':
          sections += this.componentLibrary.generateTrustElements(analysis, adaptiveDesign.adaptedColors);
          break;
        case 'cta':
          // Защитная проверка для поля cta с несколькими возможными путями
          let ctaText;
          
          if (contentContext.cta && contentContext.cta.primary) {
            ctaText = contentContext.cta.primary;
          } else if (contentContext.generated_content?.cta?.primary) {
            ctaText = contentContext.generated_content.cta.primary;
          } else {
            ctaText = 'Забронировать сейчас';
            console.warn('⚠️ contentContext.cta.primary не найден ни в одном из возможных путей, используем fallback:', ctaText);
          }
          
          sections += this.componentLibrary.generateModernCTA(ctaText, analysis, adaptiveDesign.adaptedColors);
          break;
        case 'footer':
          sections += this.generateFooterSection(adaptiveDesign);
          break;
      }
    });

    // Добавляем блок срочности если нужно
    if (analysis.urgencyLevel !== 'low') {
      sections = this.componentLibrary.generateUrgencyBlock(analysis, adaptiveDesign.adaptedColors) + sections;
    }

    return sections;
  }

  private generateHeaderSection(_contentContext: any, adaptiveDesign: AdaptiveDesign): string {
    return `
    <!-- Header Section -->
    <mj-section background-color="${adaptiveDesign.adaptedColors.surface}" padding="10px 0">
      <mj-column>
        <mj-text align="center" font-size="24px" font-weight="${adaptiveDesign.typography.fontWeights.bold}" 
                 color="${adaptiveDesign.adaptedColors.primary}">
          ✈️ Kupibilet
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateHeroSection(contentContext: any, adaptiveDesign: AdaptiveDesign, assets: any, _analysis: ContentAnalysis): string {
    const heroImage = assets.images && assets.images[0] ? assets.images[0] : null;
    
    return `
    <!-- Hero Section -->
    <mj-section background-color="${adaptiveDesign.adaptedColors.primary}" 
                background-url="${heroImage ? heroImage.url : ''}"
                background-size="cover"
                background-position="center"
                padding="40px 20px">
      <mj-column>
        <mj-text align="center" 
                 font-size="${adaptiveDesign.typography.fontSizes.h1}" 
                 font-weight="${adaptiveDesign.typography.fontWeights.bold}"
                 color="white"
                 line-height="${adaptiveDesign.typography.lineHeights.tight}"
                 css-class="hero-title">
          ${contentContext.subject}
        </mj-text>
        <mj-text align="center" 
                 font-size="${adaptiveDesign.typography.fontSizes.body}" 
                 color="white"
                 padding-top="10px"
                 css-class="hero-subtitle">
          ${contentContext.preheader}
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateContentSections(contentContext: any, adaptiveDesign: AdaptiveDesign, _analysis: ContentAnalysis): string {
    // Защитная проверка для поля body с fallback значениями
    const bodyText = contentContext.body || 
                    contentContext.generated_content?.body || 
                    'Email content will be displayed here.';
    
    const bodyParagraphs = this.splitContentIntoParagraphs(bodyText);
    
    let contentSections = '';
    
    bodyParagraphs.forEach((paragraph, _index) => {
      contentSections += `
      <mj-section background-color="${adaptiveDesign.adaptedColors.surface}" 
                  padding="20px">
        <mj-column>
          <mj-text font-size="${adaptiveDesign.typography.fontSizes.body}"
                   line-height="${adaptiveDesign.typography.lineHeights.normal}"
                   color="${adaptiveDesign.adaptedColors.text.primary}">
            ${paragraph}
          </mj-text>
        </mj-column>
      </mj-section>`;
    });
    
    return contentSections;
  }

  private generateFooterSection(adaptiveDesign: AdaptiveDesign): string {
    return `
    <!-- Footer Section -->
    <mj-section background-color="${adaptiveDesign.adaptedColors.text.primary}" padding="30px 20px">
      <mj-column>
        <mj-text align="center" 
                 font-size="${adaptiveDesign.typography.fontSizes.small}" 
                 color="white">
          Связаться с нами:<br/>
          📧 info@kupibilet.ru<br/>
          📞 +7 (800) 555-35-35
        </mj-text>
        <mj-text align="center" 
                 font-size="${adaptiveDesign.typography.fontSizes.small}" 
                 color="white"
                 padding-top="20px">
          © 2024 Kupibilet. Все права защищены.
        </mj-text>
      </mj-column>
    </mj-section>`;
  }

  private generateAdvancedCSS(_analysis: ContentAnalysis, _personality: DesignPersonality, adaptiveDesign: AdaptiveDesign): string {
    return `
      /* Enhanced Email Styles */
      .hero-title {
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      .price-card {
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        transform: translateY(0);
        transition: transform 0.3s ease;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(75, 255, 126, 0.4);
      }
      
      .urgency-block {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.8; }
        100% { opacity: 1; }
      }
      
      /* Mobile optimizations */
      @media only screen and (max-width: 600px) {
        .hero-title {
          font-size: ${parseInt(adaptiveDesign.typography.fontSizes.h1) - 4}px !important;
        }
        
        .price-card {
          padding: 15px !important;
          margin: 10px !important;
        }
        
        .feature-icons td {
          width: 100% !important;
          display: block !important;
          padding: 10px !important;
        }
      }`;
  }

  private generateDarkThemeCSS(colors: any): string {
    return `
      /* Dark theme support */
      @media (prefers-color-scheme: dark) {
        .mj-body {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        
        .content-section {
          background-color: #2a2a2a !important;
        }
        
        .hero-title, .hero-subtitle {
          color: #ffffff !important;
        }
        
        .cta-button {
          background-color: ${colors.cta.primary} !important;
        }
      }`;
  }

  private splitContentIntoParagraphs(content: string): string[] {
    return content.split('\n\n').filter(p => p.trim().length > 0);
  }
}

/**
 * OpenAI Agent SDK Tool для улучшенной генерации MJML
 */
export const generateEnhancedMjmlTemplate = tool({
  name: 'generateEnhancedMjmlTemplate',
  description: 'Генерирует современный MJML email шаблон с использованием анализа контента и адаптивного дизайна',
  parameters: z.object({
    trace_id: z.string().describe('ID трассировки для отладки').default('mjml-trace')
  }),
  execute: async (_params, context) => {
    console.log('\n📧 === ENHANCED MJML GENERATOR ===');
    
    try {
      // Проверяем наличие всех необходимых данных
      const contentContext = (context?.context as any)?.designContext?.content_context;
      const contentAnalysis = (context?.context as any)?.designContext?.content_analysis;
      const designPersonality = (context?.context as any)?.designContext?.design_personality;
      const adaptiveDesign = (context?.context as any)?.designContext?.adaptive_design;
      const assetManifest = (context?.context as any)?.designContext?.asset_manifest;
      
      if (!contentContext || !contentAnalysis || !designPersonality || !adaptiveDesign) {
        throw new Error('All analysis data required: content context, content analysis, design personality, and adaptive design must be generated first.');
      }
      
      console.log('🎨 Generating enhanced MJML with full analysis data...');
      
      // Создаем генератор
      const generator = new EnhancedMjmlGenerator();
      
      // Генерируем улучшенный MJML
      const mjmlCode = generator.generateEnhancedMjmlTemplate(
        contentContext,
        contentAnalysis,
        designPersonality,
        adaptiveDesign,
        assetManifest || { images: [] }
      );
      
      console.log('✅ Enhanced MJML template generated:', {
        length: mjmlCode.length,
        sections: (mjmlCode.match(/<mj-section/g) || []).length,
        responsive: mjmlCode.includes('@media'),
        darkTheme: mjmlCode.includes('prefers-color-scheme'),
        animations: mjmlCode.includes('animation')
      });
      
      // Сохраняем результат в контекст
      if (context && (context.context as any)?.designContext) {
        (context.context as any).designContext.enhanced_mjml = {
          mjml_code: mjmlCode,
          generation_method: 'enhanced',
          features: {
            responsive: true,
            darkTheme: true,
            animations: adaptiveDesign.animations.level !== 'none',
            contentAware: true,
            adaptiveColors: true,
            modernComponents: true
          }
        };
      }
      
      return `Enhanced MJML template generated successfully!
Features: ✅ Content-aware design ✅ Adaptive colors ✅ Modern components
Responsive: ✅ Mobile-first ✅ Dark theme support ✅ Animations (${adaptiveDesign.animations.level})
Template length: ${mjmlCode.length} characters
Sections: ${(mjmlCode.match(/<mj-section/g) || []).length} dynamic sections
Ready for compilation to HTML.`;
      
    } catch (error) {
      console.error('❌ Enhanced MJML generation failed:', error);
      throw error;
    }
  }
}); 