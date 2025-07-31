/**
 * Content Intelligence Analyzer
 * Анализирует контент для определения оптимального дизайна
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { autoRestoreCampaignLogging } from '../../../shared/utils/campaign-logger';

// Типы для анализа контента
export interface ContentAnalysis {
  theme: 'travel' | 'business' | 'seasonal' | 'premium' | 'promotional' | 'newsletter';
  emotionalTone: 'urgent' | 'friendly' | 'professional' | 'exciting' | 'informative';
  campaignType: 'promotional' | 'informational' | 'newsletter' | 'seasonal';
  priceCategory: 'budget' | 'mid-range' | 'premium';
  urgencyLevel: 'low' | 'medium' | 'high';
  audienceType: 'mass' | 'professional' | 'luxury' | 'young';
}

export interface DesignPersonality {
  visualStyle: 'minimalist' | 'vibrant' | 'corporate' | 'luxurious' | 'playful';
  colorPalette: {
    primary: string;
    accent: string;
    background: string;
    text: string;
    cta: string;
  };
  layoutComplexity: 'simple' | 'moderate' | 'complex';
  componentSuggestions: string[];
  animationLevel: 'none' | 'subtle' | 'moderate' | 'dynamic';
}

export class ContentIntelligenceAnalyzer {
  
  /**
   * Анализирует тематику контента на основе ключевых слов
   */
  detectTheme(content: string): ContentAnalysis['theme'] {
    const lowerContent = content.toLowerCase();
    
    // Ключевые слова для определения тематики
    const themeKeywords = {
      travel: ['путешест', 'тур', 'отпуск', 'билет', 'самолет', 'отель', 'экзотик', 'страна', 'город', 'море', 'горы'],
      business: ['бизнес', 'компания', 'услуга', 'партнер', 'клиент', 'решение', 'эффективн'],
      seasonal: ['весна', 'лето', 'осень', 'зима', 'новый год', 'праздник', 'сезон'],
      premium: ['премиум', 'люкс', 'эксклюзив', 'vip', 'элитн', 'роскош'],
      promotional: ['акция', 'скидка', 'распродажа', 'спецпредложение', 'выгодно', 'экономь'],
      newsletter: ['новости', 'обновление', 'информация', 'рассылка']
    };

    let maxScore = 0;
    let detectedTheme: ContentAnalysis['theme'] = 'newsletter';

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        const matches = (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
        return acc + matches;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedTheme = theme as ContentAnalysis['theme'];
      }
    }

    return detectedTheme;
  }

  /**
   * Определяет эмоциональный тон сообщения
   */
  detectEmotionalTone(content: string): ContentAnalysis['emotionalTone'] {
    const lowerContent = content.toLowerCase();
    
    const toneKeywords = {
      urgent: ['срочно', 'быстро', 'ограничен', 'спешите', 'последн', 'сегодня', 'сейчас', 'немедленно'],
      exciting: ['удивительн', 'потрясающ', 'невероятн', 'фантастическ', 'восхитительн', 'захватывающ'],
      friendly: ['дружелюбн', 'приятн', 'уютн', 'комфортн', 'теплый', 'добро пожаловать'],
      professional: ['профессиональн', 'качественн', 'надежн', 'опытн', 'экспертн'],
      informative: ['информаци', 'подробн', 'детально', 'узнайте', 'изучите', 'познакомьтесь']
    };

    let maxScore = 0;
    let detectedTone: ContentAnalysis['emotionalTone'] = 'informative';

    for (const [tone, keywords] of Object.entries(toneKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        const matches = (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
        return acc + matches;
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedTone = tone as ContentAnalysis['emotionalTone'];
      }
    }

    return detectedTone;
  }

  /**
   * Определяет тип кампании
   */
  detectCampaignType(content: any): ContentAnalysis['campaignType'] {
    let textContent: string;
    if (typeof content === 'string') {
      textContent = content;
    } else if (content.body) {
      textContent = content.body;
    } else {
      throw new Error('Content Intelligence Analyzer: Content body is missing. Content must have body property for campaign type detection.');
    }
    const pricing = content.pricing;

    // Если есть цены и призывы к действию - скорее всего промо
    if (pricing && (textContent.includes('купить') || textContent.includes('заказать'))) {
      return 'promotional';
    }

    // Сезонные кампании
    if (this.detectTheme(textContent) === 'seasonal') {
      return 'seasonal';
    }

    // Информационные - если много текста без явных призывов к покупке
    if (textContent.length > 500 && !textContent.includes('купить')) {
      return 'informational';
    }

    return 'newsletter';
  }

  /**
   * Анализирует ценовую категорию
   */
  analyzePricing(pricing: any): ContentAnalysis['priceCategory'] {
    if (!pricing || !pricing.best_price) {
      return 'mid-range';
    }

    const price = parseFloat(pricing.best_price.toString().replace(/[^\d.]/g, ''));
    
    // Примерные пороги для туристических цен (в рублях)
    if (price < 30000) {
      return 'budget';
    } else if (price < 100000) {
      return 'mid-range';
    } else {
      return 'premium';
    }
  }

  /**
   * Определяет уровень срочности
   */
  detectUrgencyLevel(content: string): ContentAnalysis['urgencyLevel'] {
    const urgencyWords = ['срочно', 'ограничен', 'сегодня', 'сейчас', 'последн'];
    const matches = urgencyWords.filter(word => content.toLowerCase().includes(word)).length;
    
    if (matches >= 3) return 'high';
    if (matches >= 1) return 'medium';
    return 'low';
  }

  /**
   * Определяет тип аудитории
   */
  detectAudienceType(content: string, pricing: any): ContentAnalysis['audienceType'] {
    const priceCategory = this.analyzePricing(pricing);
    const theme = this.detectTheme(content);
    
    if (priceCategory === 'premium' || theme === 'premium') {
      return 'luxury';
    }
    
    if (theme === 'business' || content.includes('бизнес')) {
      return 'professional';
    }
    
    if (content.includes('молод') || content.includes('студент')) {
      return 'young';
    }
    
    return 'mass';
  }

  /**
   * Основной метод анализа контента
   */
  analyzeContent(content: any): ContentAnalysis {
    let textContent: string;
    if (typeof content === 'string') {
      textContent = content;
    } else if (content.body) {
      textContent = content.body;
    } else {
      throw new Error('Content Intelligence Analyzer: Content body is missing. Content must have body property for content analysis.');
    }
    
    return {
      theme: this.detectTheme(textContent),
      emotionalTone: this.detectEmotionalTone(textContent),
      campaignType: this.detectCampaignType(content),
      priceCategory: this.analyzePricing(content.pricing),
      urgencyLevel: this.detectUrgencyLevel(textContent),
      audienceType: this.detectAudienceType(textContent, content.pricing)
    };
  }

  /**
   * Генерирует дизайн-личность на основе анализа
   */
  generateDesignPersonality(analysis: ContentAnalysis): DesignPersonality {
    // Определяем визуальный стиль
    const visualStyle = this.determineVisualStyle(analysis);
    
    // Генерируем цветовую палитру
    const colorPalette = this.generateSmartColorPalette(analysis);
    
    // Определяем сложность макета
    const layoutComplexity = this.determineLayoutComplexity(analysis);
    
    // Предлагаем компоненты
    const componentSuggestions = this.suggestComponents(analysis);
    
    // Уровень анимации
    const animationLevel = this.determineAnimationLevel(analysis);

    return {
      visualStyle,
      colorPalette,
      layoutComplexity,
      componentSuggestions,
      animationLevel
    };
  }

  private determineVisualStyle(analysis: ContentAnalysis): DesignPersonality['visualStyle'] {
    if (analysis.audienceType === 'luxury' || analysis.priceCategory === 'premium') {
      return 'luxurious';
    }
    
    if (analysis.theme === 'business') {
      return 'corporate';
    }
    
    if (analysis.emotionalTone === 'exciting' || analysis.urgencyLevel === 'high') {
      return 'vibrant';
    }
    
    if (analysis.audienceType === 'young') {
      return 'playful';
    }
    
    return 'minimalist';
  }

  private generateSmartColorPalette(analysis: ContentAnalysis): DesignPersonality['colorPalette'] {
    // Базовые палитры для разных тематик
    const palettes = {
      travel: {
        budget: { primary: '#4BFF7E', accent: '#FFB74D', background: '#F0FFFF', text: '#2C3959', cta: '#FF6240' },
        'mid-range': { primary: '#2196F3', accent: '#4BFF7E', background: '#E3F2FD', text: '#1565C0', cta: '#FF5722' },
        premium: { primary: '#1A237E', accent: '#FFD700', background: '#F5F5F5', text: '#0D47A1', cta: '#FF6F00' }
      },
      business: {
        budget: { primary: '#607D8B', accent: '#4CAF50', background: '#FAFAFA', text: '#37474F', cta: '#FF5722' },
        'mid-range': { primary: '#1976D2', accent: '#FFC107', background: '#F8F9FA', text: '#0D47A1', cta: '#FF6F00' },
        premium: { primary: '#263238', accent: '#FFD700', background: '#FFFFFF', text: '#37474F', cta: '#D32F2F' }
      },
      promotional: {
        budget: { primary: '#F44336', accent: '#FFEB3B', background: '#FFF3E0', text: '#D32F2F', cta: '#FF5722' },
        'mid-range': { primary: '#E91E63', accent: '#4BFF7E', background: '#FCE4EC', text: '#C2185B', cta: '#FF6240' },
        premium: { primary: '#9C27B0', accent: '#FFD700', background: '#F3E5F5', text: '#7B1FA2', cta: '#FF6F00' }
      }
    };

    const themeGroup = (palettes as any)[analysis.theme] || palettes.business;
    return (themeGroup as any)[analysis.priceCategory] || themeGroup['mid-range'];
  }

  private determineLayoutComplexity(analysis: ContentAnalysis): DesignPersonality['layoutComplexity'] {
    if (analysis.campaignType === 'promotional' && analysis.urgencyLevel === 'high') {
      return 'complex';
    }
    
    if (analysis.theme === 'travel' || analysis.campaignType === 'informational') {
      return 'moderate';
    }
    
    return 'simple';
  }

  private suggestComponents(analysis: ContentAnalysis): string[] {
    const components: string[] = [];
    
    // Базовые компоненты для всех
    components.push('hero-section', 'cta-button');
    
    // Компоненты в зависимости от тематики
    if (analysis.theme === 'travel') {
      components.push('destination-cards', 'date-selector', 'image-gallery');
    }
    
    if (analysis.campaignType === 'promotional') {
      components.push('price-highlight', 'urgency-block', 'countdown-timer');
    }
    
    if (analysis.priceCategory === 'premium') {
      components.push('trust-badges', 'testimonial-card', 'luxury-features');
    }
    
    if (analysis.urgencyLevel === 'high') {
      components.push('urgency-banner', 'limited-offer-block');
    }
    
    // Всегда добавляем footer
    components.push('footer-contact');
    
    return components;
  }

  private determineAnimationLevel(analysis: ContentAnalysis): DesignPersonality['animationLevel'] {
    if (analysis.audienceType === 'young' || analysis.emotionalTone === 'exciting') {
      return 'dynamic';
    }
    
    if (analysis.urgencyLevel === 'high') {
      return 'moderate';
    }
    
    if ((analysis as any).visualStyle === 'corporate') {
      return 'subtle';
    }
    
    return 'none';
  }
}

/**
 * OpenAI Agent SDK Tool для анализа контента
 */
export const analyzeContentForDesign = tool({
  name: 'analyzeContentForDesign',
  description: 'Анализирует контент email кампании для определения оптимального дизайна и визуальной подачи',
  parameters: z.object({
    trace_id: z.string().describe('ID трассировки для отладки').default('content-trace')
  }),
  execute: async (_params, context) => {
    // ✅ Восстанавливаем campaign context для логирования
    autoRestoreCampaignLogging(context, 'analyzeContentForDesign');
    
    console.log('\n🧠 === CONTENT INTELLIGENCE ANALYZER ===');
    
    try {
      // Получаем контекст из design context с авто-загрузкой
      let contentContext = (context as any)?.designContext?.content_context;
      
      if (!contentContext) {
        throw new Error('Content context not found in design context. loadDesignContext must be called first to load campaign context. Auto-loading disabled to prevent recursive calls.');
      }

      console.log('📊 Analyzing content for optimal design...');
      
      // Создаем анализатор
      const analyzer = new ContentIntelligenceAnalyzer();
      
      // Анализируем контент
      const analysis = analyzer.analyzeContent(contentContext);
      console.log('✅ Content analysis completed:', {
        theme: analysis.theme,
        emotionalTone: analysis.emotionalTone,
        campaignType: analysis.campaignType,
        priceCategory: analysis.priceCategory,
        urgencyLevel: analysis.urgencyLevel,
        audienceType: analysis.audienceType
      });
      
      // Генерируем дизайн-личность
      const designPersonality = analyzer.generateDesignPersonality(analysis);
      console.log('🎨 Design personality generated:', {
        visualStyle: designPersonality.visualStyle,
        layoutComplexity: designPersonality.layoutComplexity,
        componentsCount: designPersonality.componentSuggestions.length,
        animationLevel: designPersonality.animationLevel
      });
      
      // Сохраняем результаты в контекст
      if ((context as any)?.designContext) {
        (context as any).designContext.content_analysis = analysis;
        (context as any).designContext.design_personality = designPersonality;
      }
      
      return `Content analysis completed successfully! 
Theme: ${analysis.theme} | Tone: ${analysis.emotionalTone} | Type: ${analysis.campaignType}
Visual Style: ${designPersonality.visualStyle} | Complexity: ${designPersonality.layoutComplexity}
Suggested Components: ${designPersonality.componentSuggestions.join(', ')}
Color Palette: Primary(${designPersonality.colorPalette.primary}) CTA(${designPersonality.colorPalette.cta})
Ready for adaptive design generation.`;

    } catch (error) {
      console.error('❌ Content analysis failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorData: error
      });
      throw new Error(`Content analysis failed: ${error instanceof Error ? error.message : 'Unknown analysis error'}`);
    }
  }
}); 