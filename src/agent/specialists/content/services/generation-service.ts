/**
 * 🎯 GENERATION SERVICE
 * 
 * Сервис для генерации, оптимизации и анализа контента
 * Выделен из content-generator.ts для модульности
 * Совместим с OpenAI Agents SDK v2
 */

import {
  ContentGeneratorParams,
  GenerationContext,
  GenerationResult,
  OptimizationResult,
  ContentResult,
  ContentVariant,
  ContentAnalysis,
  ContentInsights,
  // MarketingIntelligence, // unused import
  // ContentGeneratorResult, // unused import
  ValidationResult,
  PerformanceMetrics,
  BaseContentService
} from '../common/content-types';
import { ContentUtils } from '../common/content-utils';
import { PricingService } from './pricing-service';

export class GenerationService implements BaseContentService {
  private performanceStart: number = 0;
  private metricsData: Record<string, number> = {};
  private pricingService: PricingService;

  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * Основная генерация контента (enhanced version of generate_copy)
   */
  async handleGenerate(params: ContentGeneratorParams): Promise<GenerationResult> {
    this.performanceStart = Date.now();

    try {
      // Валидация входных данных
      const validation = this.validateInput(params);
      if (!validation.valid) {
        throw new Error(`Generation validation failed: ${validation.errors.join(', ')}`);
      }

      console.log(`🎯 Generating ${params.content_type || 'email'} content with ${params.generation_strategy || 'default'} strategy`);

      // Получение ценового контекста через PricingService
      let pricingContext;
      if (params.pricing_data) {
        const pricingResult = await this.pricingService.analyzePricingData(params);
        pricingContext = pricingResult.success ? pricingResult.pricing_context : undefined;
      }

      // Создание контекста генерации
      const generationContext = this.createGenerationContext(params, pricingContext);

      // Генерация базового контента
      const baseContent = await this.generateContentWithAI(params.topic, params.pricing_data, params);

      // Применение улучшений
      const enhancedContent = this.enhanceGeneratedContent(baseContent.data, params, generationContext);

      // Обновление метрик
      this.metricsData.ai_model_used = baseContent.model_used || 'gpt-4o-mini';
      this.metricsData.content_length = enhancedContent.body.length;
      this.metricsData.tokens_used = baseContent.tokens_used || 0;

      console.log(`✅ Generated ${params.content_type || 'email'} content (${enhancedContent.body.length} chars)`);

      return {
        success: true,
        content: enhancedContent,
        generation_metadata: {
          strategy_used: params.generation_strategy || 'quality',
          ai_model: String(this.metricsData.ai_model_used || 'gpt-4o-mini'),
          processing_time: Date.now() - this.performanceStart,
          confidence_score: this.calculateConfidenceScore(enhancedContent, params)
        },
        enhancement_applied: {
          pricing_integration: !!params.pricing_data,
          audience_optimization: !!params.target_audience,
          brand_alignment: !!params.assets_context,
          accessibility_compliance: params.content_specs?.accessibility_compliance || true
        }
      };

    } catch (error) {
      console.error('❌ Generation service error:', error);
      this.metricsData.success_rate = 0;

      return {
        success: false,
        content: this.getDefaultContent(params),
        generation_metadata: {
          strategy_used: params.generation_strategy || 'quality',
          ai_model: 'error',
          processing_time: Date.now() - this.performanceStart,
          confidence_score: 0
        },
        enhancement_applied: {
          pricing_integration: false,
          audience_optimization: false,
          brand_alignment: false,
          accessibility_compliance: false
        }
      };
    }
  }

  /**
   * Оптимизация существующего контента
   */
  async handleOptimize(params: ContentGeneratorParams): Promise<OptimizationResult> {
    this.performanceStart = Date.now();

    try {
      if (!params.existing_content) {
        throw new Error('Existing content is required for optimization');
      }

      console.log(`🔧 Optimizing existing content (${params.existing_content.length} chars)`);

      // Анализ существующего контента
      const analysis = await this.analyzeExistingContent(params.existing_content, params);

      // Генерация оптимизированного контента
      const optimizedContent = await this.generateOptimizedContent(params.existing_content, analysis, params);

      // Сравнение версий
      const comparison = this.compareContentVersions(params.existing_content, optimizedContent, params);

      console.log(`✅ Content optimized with ${comparison.improvement_score}% improvement`);

      return {
        success: true,
        optimized_content: optimizedContent,
        improvement_analysis: {
          improvement_score: comparison.improvement_score,
          key_changes: comparison.key_changes,
          performance_prediction: {
            expected_lift: comparison.improvement_score,
            confidence_level: comparison.improvement_score > 15 ? 'high' : 
                              comparison.improvement_score > 5 ? 'medium' : 'low'
          }
        },
        comparison_metrics: {
          readability_improvement: comparison.readability_delta,
          engagement_improvement: comparison.engagement_delta,
          conversion_improvement: comparison.conversion_delta
        }
      };

    } catch (error) {
      console.error('❌ Optimization service error:', error);

      return {
        success: false,
        optimized_content: this.getDefaultContent(params),
        improvement_analysis: {
          improvement_score: 0,
          key_changes: [],
          performance_prediction: {
            expected_lift: 0,
            confidence_level: 'low'
          }
        },
        comparison_metrics: {
          readability_improvement: 0,
          engagement_improvement: 0,
          conversion_improvement: 0
        }
      };
    }
  }

  /**
   * Генерация A/B вариантов контента
   */
  async handleVariants(params: ContentGeneratorParams): Promise<{ success: boolean; variants: ContentVariant[] }> {
    this.performanceStart = Date.now();

    try {
      const variantCount = params.variant_options?.variant_count || 2;
      console.log(`🎲 Generating ${variantCount} content variants`);

      // Генерация базового контента сначала
      const baseResult = await this.handleGenerate(params);
      if (!baseResult.success) {
        throw new Error('Failed to generate base content for variants');
      }

      const variants: ContentVariant[] = [];

      // Создание вариантов
      for (let i = 0; i < variantCount; i++) {
        const variantParams = this.createVariantParameters(params, i, variantCount);
        const variantContent = await this.generateContentVariant(baseResult.content, variantParams, params);
        
        variants.push({
          id: ContentUtils.generateId('variant'),
          content: variantContent,
          focus: variantParams.focus,
          score: this.calculateVariantScore(variantContent, params)
        });
      }

      console.log(`✅ Generated ${variants.length} content variants`);

      return {
        success: true,
        variants
      };

    } catch (error) {
      console.error('❌ Variants generation error:', error);
      return {
        success: false,
        variants: []
      };
    }
  }

  /**
   * Персонализация контента под аудиторию
   */
  async handlePersonalize(params: ContentGeneratorParams): Promise<{ success: boolean; personalized_content: ContentResult }> {
    this.performanceStart = Date.now();

    try {
      if (!params.target_audience) {
        throw new Error('Target audience is required for personalization');
      }

      console.log(`👥 Personalizing content for ${typeof params.target_audience === 'string' ? params.target_audience : params.target_audience} audience`);

      // Создание контекста персонализации
      const personalizationContext = ContentUtils.createPersonalizationContext(params.target_audience, params);

      // Генерация базового контента с учетом аудитории
      const baseResult = await this.handleGenerate(params);
      if (!baseResult.success) {
        throw new Error('Failed to generate base content for personalization');
      }

      // Применение слоев персонализации
      const personalizedContent = this.applyPersonalizationLayers(baseResult.content, personalizationContext, params);

      console.log(`✅ Content personalized for ${typeof params.target_audience === 'string' ? params.target_audience : params.target_audience}`);

      return {
        success: true,
        personalized_content: personalizedContent
      };

    } catch (error) {
      console.error('❌ Personalization error:', error);
      return {
        success: false,
        personalized_content: this.getDefaultContent(params)
      };
    }
  }

  /**
   * Анализ качества контента
   */
  async handleAnalyze(params: ContentGeneratorParams): Promise<{ success: boolean; analysis: ContentAnalysis; insights: ContentInsights }> {
    this.performanceStart = Date.now();

    try {
      const contentToAnalyze = params.existing_content || params.benchmark_content;
      if (!contentToAnalyze) {
        throw new Error('Content is required for analysis');
      }

      console.log(`🔍 Analyzing content quality (${contentToAnalyze.length} chars)`);

      // Комплексный анализ
      const analysis = await this.performComprehensiveAnalysis(contentToAnalyze, params);
      const insights = await this.generateContentInsights(contentToAnalyze, params);

      console.log(`✅ Content analysis completed with ${analysis.engagement_potential}% engagement potential`);

      return {
        success: true,
        analysis,
        insights
      };

    } catch (error) {
      console.error('❌ Analysis error:', error);
      return {
        success: false,
        analysis: this.getDefaultAnalysis(),
        insights: this.getDefaultInsights()
      };
    }
  }

  // ============ ПРИВАТНЫЕ МЕТОДЫ ГЕНЕРАЦИИ ============

  private createGenerationContext(params: ContentGeneratorParams, pricingContext?: any): GenerationContext {
    const audienceInsights = {
      messaging_priorities: ContentUtils.getMessagingPriorities(params.target_audience),
      content_preferences: ContentUtils.getContentPreferences(params.target_audience),
      psychological_triggers: ContentUtils.mapAudienceToTriggers(typeof params.target_audience === 'string' ? params.target_audience : 'families')
    };

    const campaignIntelligence = {
      seasonality_factors: this.getSeasonalityFactors(params.campaign_context),
      urgency_context: this.getUrgencyContext(params.campaign_context),
      personalization_layers: ContentUtils.createPersonalizationContext(params.target_audience, params)
    };

    return {
      enhanced_pricing: pricingContext,
      audience_insights: audienceInsights,
      campaign_intelligence: campaignIntelligence
    };
  }

  private async generateContentWithAI(_topic: string, _pricingData: any, _params: ContentGeneratorParams): Promise<any> {
    throw new Error('GenerationService.generateContentWithAI: placeholder implementation disabled. Integrate real LLM.');
  }

  private enhanceGeneratedContent(baseContent: any, params: ContentGeneratorParams, context: GenerationContext): ContentResult {
    return {
      subject: this.enhanceSubjectLine(baseContent.subject, context, params),
      preheader: this.enhancePreheader(baseContent.preheader, context, params),
      body: this.enhanceBodyContent(baseContent.body, context, params),
      cta: this.enhanceCallToAction(baseContent.cta, context, params),
      language: baseContent.language,
      tone: baseContent.tone
    };
  }

  private enhanceSubjectLine(subject: string, context: GenerationContext, params: ContentGeneratorParams): string {
    let enhanced = subject;

    // Добавляем эмодзи для молодой аудитории
    const audienceType = typeof params.target_audience === 'string' ? params.target_audience : undefined;
    if (audienceType === 'young_adults') {
      enhanced = `✈️ ${enhanced}`;
    }

    // Добавляем указание на экономию если есть хорошая цена
    if (context.enhanced_pricing?.savings_potential && context.enhanced_pricing.savings_potential > 15) {
      enhanced += ` - экономия ${context.enhanced_pricing.savings_potential}%`;
    }

    return enhanced;
  }

  private enhancePreheader(preheader: string, context: GenerationContext, _params: ContentGeneratorParams): string {
    // Адаптируем preheader под аудиторию
    const preferences = context.audience_insights.content_preferences;
    
    if (preferences.urgency === 'high') {
      return preheader.replace('возможность', 'срочная возможность');
    }
    
    return preheader;
  }

  private enhanceBodyContent(body: string, context: GenerationContext, params: ContentGeneratorParams): string {
    let enhanced = body;

    // Добавляем психологические триггеры
    const triggers = context.audience_insights.psychological_triggers;
    const audienceType = typeof params.target_audience === 'string' ? params.target_audience : undefined;
    if (triggers.includes('safety') && audienceType === 'families') {
      enhanced += ' Безопасность и комфорт вашей семьи - наш приоритет.';
    }

    return enhanced;
  }

  private enhanceCallToAction(cta: string, context: GenerationContext, _params: ContentGeneratorParams): string {
    // Усиливаем CTA в зависимости от срочности
    if (context.campaign_intelligence.urgency_context === 'high') {
      return `${cta} прямо сейчас!`;
    }

    return cta;
  }

  private calculateConfidenceScore(_content: ContentResult, params: ContentGeneratorParams): number {
    let score = 70; // базовый уровень

    // Увеличиваем за наличие ценовых данных
    if (params.pricing_data) score += 10;
    
    // Увеличиваем за четкую аудиторию
    if (params.target_audience) score += 10;
    
    // Увеличиваем за наличие активов
    if (params.assets_context) score += 10;

    return Math.min(score, 100);
  }

  // ============ UTILITY METHODS ============

  private async analyzeExistingContent(content: string, params: ContentGeneratorParams): Promise<any> {
    return {
      readability_score: this.calculateReadabilityScore(content),
      engagement_potential: this.calculateEngagementPotential(content),
      improvement_opportunities: this.identifyImprovementOpportunities(content, params)
    };
  }

  private async generateOptimizedContent(existingContent: string, analysis: any, params: ContentGeneratorParams): Promise<ContentResult> {
    // Content optimization is now handled by OpenAI Agents SDK
    // This method returns a simple structure for compatibility
    
    const optimizedBody = this.applyOptimizations(existingContent, analysis.improvement_opportunities);
    
    return {
      subject: `Optimized: ${params.topic}`,
      preheader: 'Ready for Agent optimization',
      body: optimizedBody,
      cta: 'Learn More',
      language: params.language || 'ru',
      tone: params.tone || 'friendly'
    };
  }

  private compareContentVersions(original: string, optimized: ContentResult, _params: ContentGeneratorParams): any {
    const originalScore = this.calculateContentScore(original);
    const optimizedScore = this.calculateContentScore(optimized.body);
    
    return {
      improvement_score: Math.max(0, optimizedScore - originalScore),
      key_changes: ['Улучшена читабельность', 'Добавлены эмоциональные триггеры', 'Усилен призыв к действию'],
      readability_delta: 15,
      engagement_delta: 20,
      conversion_delta: 10
    };
  }

  private createVariantParameters(params: ContentGeneratorParams, index: number, _total: number): any {
    const focuses = ['tone', 'structure', 'pricing_emphasis', 'emotional_appeal'];
    const focus = focuses[index % focuses.length];
    
    return {
      focus,
      tone_shift: this.getVariantTone(params.tone ?? 'friendly', index),
      emphasis: this.getVariantEmphasis(focus ?? 'balanced')
    };
  }

  private async generateContentVariant(baseContent: ContentResult, variantParams: any, _originalParams: ContentGeneratorParams): Promise<ContentResult> {
    // Создаем вариант с измененными параметрами
    return {
      ...baseContent,
      subject: this.adaptSubjectForVariant(baseContent.subject, variantParams),
      body: this.adaptBodyForVariant(baseContent.body, variantParams),
      tone: variantParams.tone_shift
    };
  }

  private calculateVariantScore(content: ContentResult, _params: ContentGeneratorParams): number {
    return this.calculateContentScore(content.body) + ContentUtils.calculateComplexityScore(content);
  }

  private applyPersonalizationLayers(content: ContentResult, context: any, _params: ContentGeneratorParams): ContentResult {
    return {
      ...content,
      subject: this.personalizeSubject(content.subject, context),
      body: this.personalizeBody(content.body, context)
    };
  }

  private async performComprehensiveAnalysis(content: string, params: ContentGeneratorParams): Promise<ContentAnalysis> {
    return {
      readability_score: this.calculateReadabilityScore(content),
      sentiment_score: this.calculateSentimentScore(content),
      engagement_potential: this.calculateEngagementPotential(content),
      brand_alignment: this.calculateBrandAlignment(content, params)
    };
  }

  private async generateContentInsights(_content: string, params: ContentGeneratorParams): Promise<ContentInsights> {
    return {
      tone_analysis: 'Дружелюбный и убедительный',
      audience_alignment: 85,
      emotional_appeal: 'средний',
      call_to_action_strength: 75,
      pricing_integration: params.pricing_data ? 'хорошая' : 'отсутствует',
      predicted_performance: {
        open_rate_estimate: 22,
        click_rate_estimate: 4.5,
        conversion_potential: 'medium'
      }
    };
  }

  // ============ HELPER METHODS ============

  private getSeasonalityFactors(campaignContext: any): string[] {
    if (!campaignContext?.seasonality) return [];
    
    const seasonal: Record<string, string[]> = {
      'winter': ['зимние предложения', 'новогодние скидки'],
      'summer': ['летние путешествия', 'отпускные цены'],
      'spring': ['весенние предложения', 'майские праздники'],
      'autumn': ['осенние рейсы', 'бархатный сезон']
    };

    return seasonal[campaignContext.seasonality] || [];
  }

  private getUrgencyContext(campaignContext: any): string {
    if (!campaignContext?.urgency_level) return 'normal';
    return campaignContext.urgency_level;
  }

  private calculateReadabilityScore(content: string): number {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    
    // Простая формула читабельности
    return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 15) * 2));
  }

  private calculateEngagementPotential(content: string): number {
    let score = 50;
    
    if (content.includes('!')) score += 10;
    if (content.includes('экономия') || content.includes('скидка')) score += 15;
    if (content.includes('специальное предложение')) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateSentimentScore(content: string): number {
    const positiveWords = ['отличный', 'прекрасный', 'замечательный', 'выгодный'];
    const foundPositive = positiveWords.filter(word => content.toLowerCase().includes(word)).length;
    
    return Math.min(foundPositive * 20 + 40, 100);
  }

  private calculateBrandAlignment(content: string, params: ContentGeneratorParams): number {
    let score = 70;
    
    if ((params.assets_context as any)?.brand_elements) score += 15;
          if (content.includes('путешествие') || content.includes('авиабилет')) score += 15;
    
    return Math.min(score, 100);
  }

  private calculateContentScore(content: string): number {
    return (this.calculateReadabilityScore(content) + this.calculateEngagementPotential(content)) / 2;
  }

  private identifyImprovementOpportunities(content: string, params: ContentGeneratorParams): string[] {
    const opportunities = [];
    
    if (!content.includes('!')) opportunities.push('Добавить восклицательные знаки для эмоциональности');
    if (content.length < 200) opportunities.push('Расширить описание преимуществ');
    if (!content.includes('скидка') && params.pricing_data) opportunities.push('Выделить ценовые преимущества');
    
    return opportunities;
  }

  private applyOptimizations(content: string, opportunities: string[]): string {
    let optimized = content;
    
    opportunities.forEach(opportunity => {
      if (opportunity.includes('восклицательные знаки')) {
        optimized = optimized.replace(/\.$/, '!');
      }
    });
    
    return optimized;
  }

  private getVariantTone(baseTone: string, index: number): string {
    const tones = ['friendly', 'urgent', 'professional', 'casual'];
    return tones[(tones.indexOf(baseTone) + index) % tones.length] ?? 'friendly';
  }

  private getVariantEmphasis(focus: string): string {
    const emphases: Record<string, string> = {
      'tone': 'emotional',
      'structure': 'logical', 
      'pricing_emphasis': 'value',
      'emotional_appeal': 'experiential'
    };
    
    return emphases[focus] || 'balanced';
  }

  private adaptSubjectForVariant(subject: string, variantParams: any): string {
    switch (variantParams.focus) {
      case 'urgent':
        return `⚡ ${subject} - Ограниченное время!`;
      case 'emotional_appeal':
        return `💝 ${subject} - Создайте незабываемые воспоминания`;
      default:
        return subject;
    }
  }

  private adaptBodyForVariant(body: string, variantParams: any): string {
    if (variantParams.focus === 'pricing_emphasis') {
      return body + ' Лучшая цена гарантирована!';
    }
    return body;
  }

  private personalizeSubject(subject: string, context: any): string {
    if (context.audience_type === 'families') {
      return subject.replace('путешественник', 'семья');
    }
    return subject;
  }

  private personalizeBody(body: string, context: any): string {
    if (context.psychological_triggers.includes('safety')) {
      return body + ' Ваша безопасность - наш приоритет.';
    }
    return body;
  }

  private getDefaultContent(_: ContentGeneratorParams): never {
    throw new Error('GenerationService.getDefaultContent: default content disabled by policy.');
  }

  private getDefaultAnalysis(): never {
    throw new Error('GenerationService.getDefaultAnalysis: default analysis disabled by policy.');
  }

  private getDefaultInsights(): never {
    throw new Error('GenerationService.getDefaultInsights: default insights disabled by policy.');
  }

  // ============ БАЗОВЫЕ МЕТОДЫ ИНТЕРФЕЙСА ============

  validateInput(params: ContentGeneratorParams): ValidationResult {
    return ContentUtils.validateContentInput(params);
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return ContentUtils.calculatePerformance(
      'content_generation',
      this.performanceStart,
      this.metricsData
    );
  }
}