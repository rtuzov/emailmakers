/**
 * Adaptive Design Engine
 * Создает адаптивные дизайны на основе анализа контента
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { ContentAnalysis, DesignPersonality } from './content-intelligence-analyzer';

export interface AdaptiveDesign {
  templateStructure: TemplateStructure;
  visualComponents: VisualComponent[];
  adaptedColors: ColorSystem;
  typography: TypographySystem;
  layoutSettings: LayoutSettings;
  animations: AnimationSettings;
  responsiveSettings: ResponsiveSettings;
}

export interface TemplateStructure {
  sections: EmailSection[];
  totalSections: number;
  layoutType: 'single-column' | 'two-column' | 'complex-grid';
  contentFlow: 'linear' | 'hierarchical' | 'card-based';
}

export interface EmailSection {
  id: string;
  type: 'header' | 'hero' | 'content' | 'features' | 'pricing' | 'cta' | 'gallery' | 'testimonials' | 'footer';
  priority: 'high' | 'medium' | 'low';
  mobileOrder: number;
  components: string[];
}

export interface VisualComponent {
  id: string;
  type: string;
  config: ComponentConfig;
  styling: ComponentStyling;
  content: ComponentContent;
}

export interface ComponentConfig {
  width: string;
  height: string;
  padding: string;
  margin: string;
  position: 'static' | 'relative';
  responsive: boolean;
}

export interface ComponentStyling {
  backgroundColor: string;
  borderRadius: string;
  boxShadow: string;
  border: string;
  gradient?: string;
}

export interface ComponentContent {
  placeholder: string;
  maxLength?: number;
  required: boolean;
  dynamic: boolean;
}

export interface ColorSystem {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cta: {
    primary: string;
    hover: string;
    text: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    primary: string;
    secondary: string;
    cta: string;
  };
}

export interface TypographySystem {
  fontFamilies: {
    heading: string;
    body: string;
    accent: string;
  };
  fontSizes: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
    cta: string;
  };
  fontWeights: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface LayoutSettings {
  maxWidth: string;
  containerPadding: string;
  sectionSpacing: string;
  gridGap: string;
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export interface AnimationSettings {
  level: 'none' | 'subtle' | 'moderate' | 'dynamic';
  duration: string;
  easing: string;
  effects: string[];
}

export interface ResponsiveSettings {
  mobileFirst: boolean;
  fluidTypography: boolean;
  adaptiveImages: boolean;
  stackingOrder: string[];
}

export class AdaptiveDesignEngine {
  
  generateAdaptiveDesign(
    analysis: ContentAnalysis, 
    personality: DesignPersonality, 
    assets: any
  ): AdaptiveDesign {
    console.log('🎨 Generating adaptive design...');
    
    // Создаем структуру шаблона
    const templateStructure = this.createTemplateStructure(analysis, personality);
    
    // Генерируем визуальные компоненты
    const visualComponents = this.generateVisualComponents(analysis, personality, assets);
    
    // Адаптируем цвета
    const adaptedColors = this.adaptColorSystem(personality.colorPalette, analysis);
    
    // Настраиваем типографику
    const typography = this.createTypographySystem(analysis, personality);
    
    // Настройки макета
    const layoutSettings = this.createLayoutSettings(personality);
    
    // Настройки анимации
    const animations = this.createAnimationSettings(personality);
    
    // Responsive настройки
    const responsiveSettings = this.createResponsiveSettings(analysis);
    
    return {
      templateStructure,
      visualComponents,
      adaptedColors,
      typography,
      layoutSettings,
      animations,
      responsiveSettings
    };
  }

  private createTemplateStructure(analysis: ContentAnalysis, personality: DesignPersonality): TemplateStructure {
    const sections: EmailSection[] = [];
    let sectionOrder = 1;
    
    // Header (всегда присутствует)
    sections.push({
      id: 'header',
      type: 'header',
      priority: 'medium',
      mobileOrder: sectionOrder++,
      components: ['logo', 'navigation']
    });
    
    // Hero секция
    sections.push({
      id: 'hero',
      type: 'hero',
      priority: 'high',
      mobileOrder: sectionOrder++,
      components: ['main-image', 'title', 'subtitle', 'primary-cta']
    });
    
    // Контентные секции в зависимости от анализа
    if (analysis.theme === 'travel') {
      sections.push({
        id: 'destinations',
        type: 'features',
        priority: 'high',
        mobileOrder: sectionOrder++,
        components: ['destination-cards', 'feature-icons']
      });
      
      if (personality.layoutComplexity !== 'simple') {
        sections.push({
          id: 'dates',
          type: 'content',
          priority: 'medium',
          mobileOrder: sectionOrder++,
          components: ['date-selector', 'calendar-widget']
        });
      }
    }
    
    if (analysis.campaignType === 'promotional') {
      sections.push({
        id: 'pricing',
        type: 'pricing',
        priority: 'high',
        mobileOrder: sectionOrder++,
        components: ['price-card', 'urgency-block']
      });
    }
    
    // Галерея изображений если есть ассеты
    if (personality.layoutComplexity === 'complex') {
      sections.push({
        id: 'gallery',
        type: 'gallery',
        priority: 'medium',
        mobileOrder: sectionOrder++,
        components: ['image-grid', 'lightbox']
      });
    }
    
    // Доверие для премиум сегмента
    if (analysis.priceCategory === 'premium') {
      sections.push({
        id: 'trust',
        type: 'testimonials',
        priority: 'medium',
        mobileOrder: sectionOrder++,
        components: ['testimonial-card', 'trust-badges', 'ratings']
      });
    }
    
    // Основной CTA
    sections.push({
      id: 'main-cta',
      type: 'cta',
      priority: 'high',
      mobileOrder: sectionOrder++,
      components: ['cta-button', 'secondary-text']
    });
    
    // Footer
    sections.push({
      id: 'footer',
      type: 'footer',
      priority: 'low',
      mobileOrder: sectionOrder++,
      components: ['contact-info', 'social-links', 'unsubscribe']
    });
    
    // Определяем тип макета
    let layoutType: TemplateStructure['layoutType'] = 'single-column';
    if (personality.layoutComplexity === 'moderate') {
      layoutType = 'two-column';
    } else if (personality.layoutComplexity === 'complex') {
      layoutType = 'complex-grid';
    }
    
    // Определяем поток контента
    let contentFlow: TemplateStructure['contentFlow'] = 'linear';
    if (analysis.theme === 'travel' || personality.layoutComplexity === 'complex') {
      contentFlow = 'card-based';
    } else if (analysis.campaignType === 'informational') {
      contentFlow = 'hierarchical';
    }
    
    return {
      sections,
      totalSections: sections.length,
      layoutType,
      contentFlow
    };
  }

  private generateVisualComponents(
    analysis: ContentAnalysis, 
    personality: DesignPersonality, 
    assets: any
  ): VisualComponent[] {
    const components: VisualComponent[] = [];
    
    // Генерируем компоненты из предложений
    personality.componentSuggestions.forEach((componentType, index) => {
      const component = this.createVisualComponent(componentType, analysis, personality, index);
      if (component) {
        components.push(component);
      }
    });
    
    return components;
  }

  private createVisualComponent(
    type: string, 
    analysis: ContentAnalysis, 
    personality: DesignPersonality, 
    index: number
  ): VisualComponent | null {
    
    const baseConfig: ComponentConfig = {
      width: '100%',
      height: 'auto',
      padding: '20px',
      margin: '0 0 20px 0',
      position: 'static',
      responsive: true
    };
    
    const baseStyling: ComponentStyling = {
      backgroundColor: personality.colorPalette.background,
      borderRadius: personality.visualStyle === 'luxurious' ? '12px' : '8px',
      boxShadow: personality.visualStyle === 'luxurious' ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 16px rgba(0,0,0,0.08)',
      border: 'none'
    };
    
    switch (type) {
      case 'hero-section':
        return {
          id: `hero-${index}`,
          type: 'hero',
          config: { ...baseConfig, padding: '40px 20px' },
          styling: {
            ...baseStyling,
            backgroundColor: personality.colorPalette.primary,
            gradient: `linear-gradient(135deg, ${personality.colorPalette.primary}, ${personality.colorPalette.accent})`
          },
          content: {
            placeholder: 'Main heading and hero content',
            required: true,
            dynamic: true
          }
        };
        
      case 'price-highlight':
        return {
          id: `price-${index}`,
          type: 'pricing',
          config: { ...baseConfig, padding: '30px' },
          styling: {
            ...baseStyling,
            backgroundColor: personality.colorPalette.cta,
            gradient: `linear-gradient(135deg, ${personality.colorPalette.cta}, #FF6B35)`,
            borderRadius: '15px'
          },
          content: {
            placeholder: 'Price information and special offers',
            required: true,
            dynamic: true
          }
        };
        
      case 'cta-button':
        return {
          id: `cta-${index}`,
          type: 'button',
          config: { ...baseConfig, width: 'auto', padding: '15px 30px' },
          styling: {
            ...baseStyling,
            backgroundColor: personality.colorPalette.cta,
            borderRadius: '8px',
            boxShadow: `0 4px 16px ${personality.colorPalette.cta}40`
          },
          content: {
            placeholder: 'Call-to-action button text',
            maxLength: 50,
            required: true,
            dynamic: true
          }
        };
        
      case 'destination-cards':
        return {
          id: `destinations-${index}`,
          type: 'card-grid',
          config: { ...baseConfig, padding: '20px' },
          styling: {
            ...baseStyling,
            backgroundColor: '#FFFFFF'
          },
          content: {
            placeholder: 'Travel destination cards with images and descriptions',
            required: false,
            dynamic: true
          }
        };
        
      case 'urgency-block':
        return {
          id: `urgency-${index}`,
          type: 'urgency',
          config: { ...baseConfig, padding: '15px' },
          styling: {
            ...baseStyling,
            backgroundColor: '#FF6B35',
            gradient: 'linear-gradient(135deg, #FF6B35, #F7931E)',
            borderRadius: '8px'
          },
          content: {
            placeholder: 'Urgency message and countdown',
            required: false,
            dynamic: true
          }
        };
        
      default:
        return null;
    }
  }

  private adaptColorSystem(basePalette: DesignPersonality['colorPalette'], analysis: ContentAnalysis): ColorSystem {
    return {
      primary: basePalette.primary,
      secondary: this.lightenColor(basePalette.primary, 20),
      accent: basePalette.accent,
      background: basePalette.background,
      surface: '#FFFFFF',
      text: {
        primary: basePalette.text,
        secondary: this.lightenColor(basePalette.text, 30),
        accent: basePalette.accent
      },
      cta: {
        primary: basePalette.cta,
        hover: this.darkenColor(basePalette.cta, 10),
        text: '#FFFFFF'
      },
      status: {
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3'
      },
      gradients: {
        primary: `linear-gradient(135deg, ${basePalette.primary}, ${basePalette.accent})`,
        secondary: `linear-gradient(135deg, ${basePalette.background}, #FFFFFF)`,
        cta: `linear-gradient(135deg, ${basePalette.cta}, ${this.darkenColor(basePalette.cta, 15)})`
      }
    };
  }

  private createTypographySystem(analysis: ContentAnalysis, personality: DesignPersonality): TypographySystem {
    // Выбираем шрифты в зависимости от стиля
    let headingFont = 'Arial, sans-serif';
    let bodyFont = 'Arial, sans-serif';
    
    if (personality.visualStyle === 'luxurious') {
      headingFont = "'Playfair Display', Georgia, serif";
      bodyFont = "'Source Sans Pro', Arial, sans-serif";
    } else if (personality.visualStyle === 'corporate') {
      headingFont = "'Roboto', Arial, sans-serif";
      bodyFont = "'Open Sans', Arial, sans-serif";
    } else if (personality.visualStyle === 'playful') {
      headingFont = "'Poppins', Arial, sans-serif";
      bodyFont = "'Inter', Arial, sans-serif";
    }
    
    return {
      fontFamilies: {
        heading: headingFont,
        body: bodyFont,
        accent: headingFont
      },
      fontSizes: {
        h1: analysis.urgencyLevel === 'high' ? '32px' : '28px',
        h2: '24px',
        h3: '20px',
        body: '16px',
        small: '14px',
        cta: '16px'
      },
      fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        bold: personality.visualStyle === 'corporate' ? 600 : 700
      },
      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.7
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em'
      }
    };
  }

  private createLayoutSettings(personality: DesignPersonality): LayoutSettings {
    return {
      maxWidth: '600px',
      containerPadding: personality.layoutComplexity === 'simple' ? '15px' : '20px',
      sectionSpacing: personality.layoutComplexity === 'complex' ? '40px' : '30px',
      gridGap: '20px',
      breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px'
      }
    };
  }

  private createAnimationSettings(personality: DesignPersonality): AnimationSettings {
    const effectsMap = {
      none: [],
      subtle: ['fadeIn'],
      moderate: ['fadeIn', 'slideUp'],
      dynamic: ['fadeIn', 'slideUp', 'bounce', 'pulse']
    };
    
    return {
      level: personality.animationLevel,
      duration: personality.animationLevel === 'dynamic' ? '0.6s' : '0.3s',
      easing: 'ease-out',
      effects: effectsMap[personality.animationLevel]
    };
  }

  private createResponsiveSettings(analysis: ContentAnalysis): ResponsiveSettings {
    return {
      mobileFirst: true,
      fluidTypography: true,
      adaptiveImages: true,
      stackingOrder: ['header', 'hero', 'content', 'cta', 'footer']
    };
  }

  // Утилиты для работы с цветами
  private lightenColor(color: string, percent: number): string {
    // Простая функция для осветления цвета
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private darkenColor(color: string, percent: number): string {
    return this.lightenColor(color, -percent);
  }
}

/**
 * OpenAI Agent SDK Tool для генерации адаптивного дизайна
 */
export const generateAdaptiveDesign = tool({
  name: 'generateAdaptiveDesign',
  description: 'Создает адаптивный дизайн email шаблона на основе анализа контента и дизайн-личности',
  parameters: z.object({
    trace_id: z.string().describe('ID трассировки для отладки').default('design-trace')
  }),
  execute: async (params, context) => {
    console.log('\n🎨 === ADAPTIVE DESIGN ENGINE ===');
    
    try {
      // Проверяем наличие необходимых данных
      const contentAnalysis = context?.designContext?.content_analysis;
      const designPersonality = context?.designContext?.design_personality;
      const assetManifest = context?.designContext?.asset_manifest;
      
      if (!contentAnalysis || !designPersonality) {
        throw new Error('Content analysis and design personality required. analyzeContentForDesign must be called first.');
      }
      
      console.log('🏗️ Creating adaptive design based on analysis...');
      
      // Создаем движок дизайна
      const engine = new AdaptiveDesignEngine();
      
      // Генерируем адаптивный дизайн
      const adaptiveDesign = engine.generateAdaptiveDesign(
        contentAnalysis,
        designPersonality,
        assetManifest
      );
      
      console.log('✅ Adaptive design generated:', {
        sections: adaptiveDesign.templateStructure.totalSections,
        layoutType: adaptiveDesign.templateStructure.layoutType,
        components: adaptiveDesign.visualComponents.length,
        animationLevel: adaptiveDesign.animations.level
      });
      
      // Сохраняем результат в контекст
      if (context?.designContext) {
        context.designContext.adaptive_design = adaptiveDesign;
      }
      
      return `Adaptive design created successfully!
Layout: ${adaptiveDesign.templateStructure.layoutType} with ${adaptiveDesign.templateStructure.totalSections} sections
Components: ${adaptiveDesign.visualComponents.length} visual components
Color System: ${Object.keys(adaptiveDesign.adaptedColors).length} color categories
Typography: ${adaptiveDesign.typography.fontFamilies.heading} / ${adaptiveDesign.typography.fontFamilies.body}
Animation Level: ${adaptiveDesign.animations.level}
Ready for enhanced MJML generation.`;
      
    } catch (error) {
      console.error('❌ Adaptive design generation failed:', error);
      throw error;
    }
  }
}); 