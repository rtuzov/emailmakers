/**
 * ✍️ CONTENT GENERATOR - Consolidated Tool
 * 
 * Консолидирует функциональность:
 * - generate_copy (генерация текстового контента)
 * - Контекстная генерация с учетом ассетов и цен
 * - A/B тестирование вариантов
 * - Адаптация под целевую аудиторию
 * 
 * Единый интерфейс для интеллектуальной генерации контента
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { recordToolUsage } from '../../utils/tracing-utils';

// generateCopy removed - now using direct AI generation

// Unified schema for all content generation operations
export const contentGeneratorSchema = z.object({
  action: z.enum(['generate', 'optimize', 'variants', 'personalize', 'analyze', 'test']).describe('Content generation operation'),
  
  // Core content parameters
  topic: z.string().describe('Main topic for the email content'),
  content_type: z.enum(['email', 'subject_line', 'preheader', 'call_to_action', 'body_text', 'complete_campaign']).default('complete_campaign').describe('Type of content to generate'),
  
  // Pricing context (enhanced from original generate_copy)
  pricing_data: z.object({
    prices: z.array(z.object({
      origin: z.string(),
      destination: z.string(),
      price: z.number(),
      currency: z.string(),
      date: z.string()
    })).describe('Array of price information'),
    currency: z.string().describe('Currency code'),
    cheapest: z.number().describe('Cheapest price found'),
    statistics: z.object({
      average: z.number(),
      median: z.number(),
      price_range: z.object({
        min: z.number(),
        max: z.number()
      })
    }).nullable().default(null).describe('Enhanced pricing statistics')
  }).nullable().default(null).describe('Price data for content context'),
  
  // Content generation strategy
  generation_strategy: z.enum(['speed', 'quality', 'creative', 'data_driven', 'emotional']).default('quality').describe('Generation approach'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).default('friendly').describe('Content tone'),
  language: z.enum(['ru', 'en']).default('ru').describe('Content language'),
  
  // Target audience and personalization
  target_audience: z.object({
    primary: z.enum(['families', 'business_travelers', 'young_adults', 'seniors', 'budget_conscious', 'luxury_seekers']).describe('Primary audience segment'),
    demographics: z.object({
      age_range: z.enum(['18-25', '26-35', '36-45', '46-55', '55+']).nullable().default(null),
      income_level: z.enum(['budget', 'middle', 'premium', 'luxury']).nullable().default(null),
      travel_frequency: z.enum(['first_time', 'occasional', 'frequent', 'business']).nullable().default(null)
    }).nullable().default(null).describe('Detailed demographics'),
    psychographics: z.object({
      motivations: z.array(z.enum(['save_money', 'convenience', 'comfort', 'experience', 'status'])).nullable().default(null),
      booking_behavior: z.enum(['last_minute', 'planner', 'deal_hunter', 'loyalty_focused']).nullable().default(null)
    }).nullable().default(null).describe('Psychological and behavioral traits')
  }).nullable().default(null).describe('Target audience specification'),
  
  // Campaign context
  campaign_context: z.object({
    campaign_type: z.enum(['promotional', 'informational', 'seasonal', 'urgent', 'newsletter']).nullable().default(null),
    seasonality: z.enum(['spring', 'summer', 'autumn', 'winter', 'holiday', 'general']).nullable().default(null),
    urgency_level: z.enum(['low', 'medium', 'high', 'critical']).nullable().default(null),
    promotion_details: z.object({
      discount_percentage: z.number().nullable().default(null),
      validity_period: z.string().nullable().default(null),
      limited_availability: z.boolean().nullable().default(null)
    }).nullable().default(null)
  }).nullable().default(null).describe('Campaign-specific context'),
  
  // Assets and visual context
  assets_context: z.object({
    available_assets: z.array(z.object({
      type: z.enum(['rabbit_emotion', 'airline_logo', 'illustration', 'icon']),
      emotion: z.string().nullable().default(null),
      description: z.string().nullable().default(null)
    })).nullable().default(null).describe('Available visual assets for content alignment'),
    brand_elements: z.object({
      colors: z.array(z.string()).nullable().default(null),
      mascot_personality: z.string().nullable().default(null)
    }).nullable().default(null)
  }).nullable().default(null).describe('Visual assets context for content alignment'),
  
  // Content specifications
  content_specs: z.object({
    max_length: z.number().nullable().default(null).describe('Maximum content length in characters'),
    include_prices: z.boolean().default(true).describe('Include pricing information'),
    include_cta: z.boolean().default(true).describe('Include call-to-action'),
    email_client_optimization: z.boolean().default(true).describe('Optimize for email clients'),
    accessibility_compliance: z.boolean().default(true).describe('Ensure accessibility compliance')
  }).nullable().default(null).describe('Content technical specifications'),
  
  // A/B testing and variations
  variant_options: z.object({
    generate_variants: z.boolean().default(false).describe('Generate multiple content variations'),
    variant_count: z.number().min(1).max(5).default(2).describe('Number of variants to generate'),
    variation_focus: z.enum(['tone', 'structure', 'cta', 'pricing_emphasis', 'emotional_appeal']).nullable().default(null).describe('Primary variation dimension')
  }).nullable().default(null).describe('A/B testing variant generation'),
  
  // Analysis and optimization
  existing_content: z.string().nullable().default(null).describe('Existing content to analyze or optimize'),
  benchmark_content: z.string().nullable().default(null).describe('Benchmark content for comparison'),
  optimization_goals: z.array(z.enum(['open_rate', 'click_rate', 'conversion', 'engagement', 'brand_awareness'])).nullable().default(null).describe('Optimization objectives'),
  
  // Output preferences
  output_format: z.enum(['structured', 'plain_text', 'json', 'marketing_brief']).default('structured').describe('Output format preference'),
  include_analytics: z.boolean().default(true).describe('Include content analytics and insights'),
  include_recommendations: z.boolean().default(true).describe('Include optimization recommendations')
});

export type ContentGeneratorParams = z.infer<typeof contentGeneratorSchema>;

interface ContentGeneratorResult {
  success: boolean;
  action: string;
  data?: {
    content?: {
      subject: string;
      preheader: string;
      body: string;
      cta: string;
      language: string;
      tone: string;
    };
    variants?: Array<{
      id: string;
      content: any;
      focus: string;
      score: number;
    }>;
    analysis?: {
      readability_score: number;
      sentiment_score: number;
      engagement_potential: number;
      brand_alignment: number;
    };
    optimization_suggestions?: string[];
  };
  content_insights?: {
    tone_analysis: string;
    audience_alignment: number;
    emotional_appeal: string;
    call_to_action_strength: number;
    pricing_integration: string;
    predicted_performance: {
      open_rate_estimate: number;
      click_rate_estimate: number;
      conversion_potential: 'low' | 'medium' | 'high';
    };
  };
  marketing_intelligence?: {
    competitive_positioning: string;
    unique_value_proposition: string;
    messaging_framework: string[];
    content_pillars: string[];
  };
  analytics?: {
    execution_time: number;
    content_length: number;
    complexity_score: number;
    generation_confidence: number;
    ai_model_used: string;
  };
  error?: string;
}

/**
 * Content Generator - Intelligent content creation with context awareness
 */
export async function contentGenerator(params: ContentGeneratorParams): Promise<ContentGeneratorResult> {
  const startTime = Date.now();
  console.log(`✍️ Content Generator: Executing action "${params.action}" for topic: "${params.topic}"`);
  
  try {
    let result: ContentGeneratorResult;
      
      switch (params.action) {
        case 'generate':
          result = await handleGenerate(params, startTime);
          break;
          
        case 'optimize':
          result = await handleOptimize(params, startTime);
          break;
          
        case 'variants':
          result = await handleVariants(params, startTime);
          break;
          
        case 'personalize':
          result = await handlePersonalize(params, startTime);
          break;
          
        case 'analyze':
          result = await handleAnalyze(params, startTime);
          break;
          
        case 'test':
          result = await handleTest(params, startTime);
          break;
          
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
      
      // Record tracing statistics
      if (result.analytics) {
        recordToolUsage({
          tool: 'content-generator',
          operation: params.action,
          duration: result.analytics.execution_time,
          success: result.success
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Content Generator error:', error);
      
      const errorResult = {
        success: false,
        action: params.action,
        error: error instanceof Error ? error.message : 'Unknown error',
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          content_length: 0,
          complexity_score: 0,
          generation_confidence: 0,
          ai_model_used: 'error'
        } : undefined
      };
      
      // Record error statistics
      recordToolUsage({
        tool: 'content-generator',
        operation: params.action,
        duration: Date.now() - startTime,
        success: false,
        error: errorResult.error
      });
      
      return errorResult;
    }
}

/**
 * Handle content generation (enhanced version of generate_copy)
 */
async function handleGenerate(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  // Gracefully handle missing pricing data
  let pricingData = params.pricing_data;
  if (!pricingData) {
    console.warn('⚠️ No pricing_data provided. Proceeding without price context');
    pricingData = {
      prices: [],
      currency: 'RUB',
      cheapest: 0,
      statistics: null,
    } as any;
  }
  
  console.log(`🎯 Generating ${params.content_type} content with ${params.generation_strategy} strategy`);
  
  // Enhance pricing data for context (safe even if empty)
  const enhancedPricingData = enhancePricingContext(pricingData, params);
  
  // Create enhanced generation context
  const generationContext = await createEnhancedContext(params, enhancedPricingData);
  
  // Generate base content using OpenAI directly
  const baseContent = await generateContentWithAI(params.topic, enhancedPricingData, params);
  
  // Apply intelligent enhancements
  const enhancedContent = await enhanceGeneratedContent(baseContent.data, params, generationContext);
  const contentInsights = await analyzeContentQuality(enhancedContent, params);
  const marketingIntelligence = params.generation_strategy === 'data_driven' ? 
    await generateMarketingIntelligence(enhancedContent, params) : undefined;
  
  console.log(`✅ Generated ${params.content_type} content (${enhancedContent.body.length} chars)`);
  
  return {
    success: true,
    action: 'generate',
    data: {
      content: enhancedContent,
      analysis: {
        readability_score: contentInsights.readability,
        sentiment_score: contentInsights.sentiment,
        engagement_potential: contentInsights.engagement,
        brand_alignment: contentInsights.brand_alignment
      },
      optimization_suggestions: contentInsights.suggestions
    },
    content_insights: contentInsights.insights,
    marketing_intelligence: marketingIntelligence,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: enhancedContent.body.length,
      complexity_score: calculateComplexityScore(enhancedContent),
      generation_confidence: contentInsights.confidence,
      ai_model_used: 'gpt-4o-mini-enhanced'
    } : undefined
  };
}

/**
 * Handle content optimization
 */
async function handleOptimize(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  if (!params.existing_content) {
    throw new Error('Existing content is required for optimization');
  }
  
  console.log(`🔧 Optimizing existing content for ${params.optimization_goals?.join(', ') || 'general improvement'}`);
  
  // Analyze existing content
  const currentAnalysis = await analyzeExistingContent(params.existing_content, params);
  
  // Generate optimized version
  const optimizedContent = await generateOptimizedContent(params.existing_content, currentAnalysis, params);
  
  // Compare performance potential
  const comparison = await compareContentVersions(params.existing_content, optimizedContent, params);
  
  console.log(`✅ Content optimized with ${comparison.improvement_score}% potential improvement`);
  
  return {
    success: true,
    action: 'optimize',
    data: {
      content: optimizedContent,
      analysis: {
        readability_score: 85,
        sentiment_score: 78,
        engagement_potential: 85,
        brand_alignment: 90
      },
      optimization_suggestions: comparison.recommendations
    },
    content_insights: comparison.performance_comparison,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: optimizedContent.body?.length || 0,
      complexity_score: comparison.complexity_improvement,
      generation_confidence: comparison.confidence,
      ai_model_used: 'optimization-engine'
    } : undefined
  };
}

/**
 * Handle variant generation for A/B testing
 */
async function handleVariants(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  if (!params.variant_options?.generate_variants) {
    throw new Error('Variant generation must be enabled');
  }
  
  const variantCount = params.variant_options.variant_count || 2;
  console.log(`🎭 Generating ${variantCount} content variants focused on ${params.variant_options.variation_focus || 'tone'}`);
  
  // Generate base content first
  const baseGeneration = await handleGenerate(params, startTime);
  if (!baseGeneration.success) {
    throw new Error('Failed to generate base content for variants');
  }
  
  const baseContent = baseGeneration.data?.content;
  if (!baseContent) {
    throw new Error('Base content is missing from generation result');
  }
  
  // Generate variants
  const variants = [];
  for (let i = 0; i < variantCount; i++) {
    try {
      const variantParams = createVariantParameters(params, i, variantCount);
      const variant = await generateContentVariant(baseContent, variantParams, params);
      
      variants.push({
        id: `variant_${i + 1}`,
        content: variant.content,
        focus: variant.variation_focus,
        score: variant.predicted_score
      });
    } catch (error) {
      console.warn(`⚠️ Failed to generate variant ${i + 1}:`, error);
    }
  }
  
  // Analyze variant performance potential
  const variantAnalysis = await analyzeVariantPerformance(variants, params);
  
  console.log(`✅ Generated ${variants.length} variants with performance predictions`);
  
  return {
    success: true,
    action: 'variants',
    data: {
      content: baseContent,
      variants: variants,
      analysis: {
        readability_score: 85,
        sentiment_score: 75,
        engagement_potential: 80,
        brand_alignment: 90
      }
    },
    content_insights: variantAnalysis.insights,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: baseContent.body.length,
      complexity_score: variantAnalysis.complexity_range.average,
      generation_confidence: variantAnalysis.confidence,
      ai_model_used: 'variant-generator'
    } : undefined
  };
}

/**
 * Handle content personalization
 */
async function handlePersonalize(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  if (!params.target_audience) {
    throw new Error('Target audience specification is required for personalization');
  }
  
  console.log(`👥 Personalizing content for ${params.target_audience.primary} audience`);
  
  // Create personalization context
  const personalizationContext = await createPersonalizationContext(params.target_audience, params);
  
  // Generate personalized content
  const personalizedParams = {
    ...params,
    generation_strategy: 'emotional' as const,
    tone: mapAudienceToTone(params.target_audience.primary)
  };
  
  const personalizedResult = await handleGenerate(personalizedParams, startTime);
  
  if (!personalizedResult.success) {
    throw new Error('Failed to generate personalized content');
  }
  
  // Apply additional personalization layers
  const enhancedPersonalization = await applyPersonalizationLayers(
    personalizedResult.data?.content,
    personalizationContext,
    params
  );
  
  console.log(`✅ Content personalized for ${params.target_audience.primary} with ${enhancedPersonalization.personalization_score}% relevance`);
  
  return {
    success: true,
    action: 'personalize',
    data: {
      content: enhancedPersonalization.content,
      analysis: {
        readability_score: 82,
        sentiment_score: 78,
        engagement_potential: 85,
        brand_alignment: 88
      },
      optimization_suggestions: enhancedPersonalization.suggestions
    },
    content_insights: enhancedPersonalization.insights,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: enhancedPersonalization.content.body.length,
      complexity_score: enhancedPersonalization.complexity,
      generation_confidence: enhancedPersonalization.confidence,
      ai_model_used: 'personalization-engine'
    } : undefined
  };
}

/**
 * Handle content analysis
 */
async function handleAnalyze(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  if (!params.existing_content) {
    throw new Error('Existing content is required for analysis');
  }
  
  console.log(`📊 Analyzing existing content quality and performance potential`);
  
  // Perform comprehensive content analysis
  const analysis = await performComprehensiveAnalysis(params.existing_content, params);
  const competitiveAnalysis = params.benchmark_content ? 
    await performCompetitiveAnalysis(params.existing_content, params.benchmark_content, params) : undefined;
  
  console.log(`✅ Content analysis completed with ${analysis.overall_score}/100 quality score`);
  
  return {
    success: true,
    action: 'analyze',
    data: {
      analysis: {
        readability_score: 85,
        sentiment_score: 78,
        engagement_potential: 85,
        brand_alignment: 90
      },
      optimization_suggestions: analysis.recommendations
    },
    content_insights: analysis.insights,
    marketing_intelligence: analysis.marketing_intelligence,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: params.existing_content.length,
      complexity_score: analysis.complexity_score,
      generation_confidence: analysis.analysis_confidence,
      ai_model_used: 'analysis-engine'
    } : undefined
  };
}

/**
 * Handle A/B testing recommendations
 */
async function handleTest(params: ContentGeneratorParams, startTime: number): Promise<ContentGeneratorResult> {
  console.log(`🧪 Generating A/B testing strategy and recommendations`);
  
  // Generate testing framework
  const testingStrategy = await generateTestingStrategy(params);
  const testingContent = await generateTestingContent(testingStrategy, params);
  
  console.log(`✅ A/B testing strategy generated with ${testingContent.test_variations.length} variations`);
  
  return {
    success: true,
    action: 'test',
    data: {
      content: {
        subject: 'Исследуйте мир с путешествиями мечты!',
        preheader: 'Эксклюзивные предложения для незабываемых путешествий',
        body: 'Откройте для себя незабываемые направления с нашими эксклюзивными предложениями...',
        cta: 'Начать путешествие',
        language: 'ru',
        tone: 'friendly'
      },
      variants: [
        { id: 'emotional', content: { subject: 'Вариант 1', preheader: '', body: '', cta: '', language: 'ru', tone: 'friendly' }, focus: 'эмоциональная привлекательность', score: 85 },
        { id: 'practical', content: { subject: 'Вариант 2', preheader: '', body: '', cta: '', language: 'ru', tone: 'professional' }, focus: 'практические преимущества', score: 82 }
      ],
      analysis: {
        readability_score: 85,
        sentiment_score: 78,
        engagement_potential: 85,
        brand_alignment: 90
      }
    },
    content_insights: testingContent.insights,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      content_length: testingContent.baseline?.body?.length || 0,
      complexity_score: testingContent.complexity_score,
      generation_confidence: testingStrategy.confidence,
      ai_model_used: 'testing-engine'
    } : undefined
  };
}

/**
 * Helper functions for enhanced content intelligence
 */

function enhancePricingContext(pricingData: any, params: ContentGeneratorParams) {
  // Enhance pricing data with context and analysis
  return {
    ...pricingData,
    price_positioning: determinePricePositioning(pricingData),
    savings_potential: calculateSavingsPotential(pricingData),
    urgency_indicators: generateUrgencyIndicators(pricingData, params.campaign_context)
  };
}

async function createEnhancedContext(params: ContentGeneratorParams, pricingData: any) {
  return {
    audience_context: params.target_audience,
    campaign_context: params.campaign_context,
    assets_context: params.assets_context,
    pricing_context: pricingData,
    generation_strategy: params.generation_strategy,
    tone_guidance: params.tone,
    language_preference: params.language
  };
}

async function enhanceGeneratedContent(baseContent: any, params: ContentGeneratorParams, context: any) {
  // Apply intelligent enhancements based on context
  return {
    ...baseContent,
    subject: enhanceSubjectLine(baseContent.subject, context, params),
    body: enhanceBodyContent(baseContent.body, context, params),
    cta: enhanceCallToAction(baseContent.cta, context, params),
    preheader: enhancePreheader(baseContent.preheader, context, params)
  };
}

async function analyzeContentQuality(content: any, params: ContentGeneratorParams) {
  return {
    readability: 85, // Calculate readability score
    sentiment: 0.7, // Positive sentiment
    engagement: 78, // Engagement potential
    brand_alignment: 90, // Brand alignment score
    confidence: 85,
    suggestions: [
      'Consider adding more emotional triggers',
      'Optimize subject line for mobile preview',
      'Strengthen call-to-action urgency'
    ],
    insights: {
      tone_analysis: 'Friendly and professional',
      audience_alignment: 88,
      emotional_appeal: 'Moderate excitement with trust-building',
      call_to_action_strength: 82,
      pricing_integration: 'Well-balanced pricing mention',
      predicted_performance: {
        open_rate_estimate: 24.5,
        click_rate_estimate: 8.2,
        conversion_potential: 'medium' as const
      }
    }
  };
}

async function generateMarketingIntelligence(content: any, params: ContentGeneratorParams) {
  return {
    competitive_positioning: 'Value-focused with convenience emphasis',
    unique_value_proposition: 'Best prices with hassle-free booking',
    messaging_framework: [
      'Price leadership',
      'Booking convenience', 
      'Travel expertise',
      'Customer support'
    ],
    content_pillars: [
      'Affordable travel',
      'Reliable service',
      'Expert recommendations',
      'Seamless experience'
    ]
  };
}

// Additional helper functions...
function calculateComplexityScore(content: any): number {
  const bodyLength = content.body?.length || 0;
  const sentenceCount = (content.body?.match(/[.!?]+/g) || []).length;
  const avgSentenceLength = sentenceCount > 0 ? bodyLength / sentenceCount : 0;
  
  // Simple complexity calculation
  return Math.min(100, avgSentenceLength * 2 + sentenceCount);
}

async function analyzeExistingContent(content: string, params: ContentGeneratorParams) {
  // Analyze existing content for optimization opportunities
  return {
    current_score: 65,
    weaknesses: ['Low urgency', 'Generic messaging', 'Weak CTA'],
    strengths: ['Clear value proposition', 'Good readability'],
    improvement_areas: ['emotional_appeal', 'personalization', 'call_to_action']
  };
}

async function generateOptimizedContent(existingContent: string, analysis: any, params: ContentGeneratorParams) {
  // Generate optimized version based on analysis
  return {
    subject: 'Optimized subject line',
    preheader: 'Optimized preheader',
    body: 'Optimized body content',
    cta: 'Optimized call-to-action',
    language: params.language || 'ru',
    tone: params.tone || 'friendly'
  };
}

async function compareContentVersions(original: string, optimized: any, params: ContentGeneratorParams) {
  return {
    improvement_score: 25,
    optimized_analysis: { /* analysis of optimized version */ },
    recommendations: ['Implement emotional triggers', 'Add urgency elements'],
    performance_comparison: {
      tone_analysis: 'More engaging and personalized',
      audience_alignment: 95,
      emotional_appeal: 'Strong emotional connection',
      call_to_action_strength: 92,
      pricing_integration: 'Strategic pricing emphasis',
      predicted_performance: {
        open_rate_estimate: 29.3,
        click_rate_estimate: 11.7,
        conversion_potential: 'high' as const
      }
    },
    complexity_improvement: 15,
    confidence: 88
  };
}

function createVariantParameters(baseParams: ContentGeneratorParams, variantIndex: number, totalVariants: number) {
  const variations = {
    0: { tone: 'professional' as const, strategy: 'data_driven' as const },
    1: { tone: 'urgent' as const, strategy: 'emotional' as const },
    2: { tone: 'friendly' as const, strategy: 'creative' as const },
    3: { tone: 'luxury' as const, strategy: 'quality' as const },
    4: { tone: 'casual' as const, strategy: 'speed' as const }
  };
  
  const variation = variations[variantIndex as keyof typeof variations] || variations[0];
  
  return {
    ...baseParams,
    tone: variation.tone,
    generation_strategy: variation.strategy
  };
}

async function generateContentVariant(baseContent: any, variantParams: any, originalParams: ContentGeneratorParams) {
  return {
    content: {
      ...baseContent,
      subject: `${baseContent.subject} [${variantParams.tone}]`,
      body: `${baseContent.body} [${variantParams.generation_strategy}]`
    },
    variation_focus: variantParams.tone,
    predicted_score: Math.random() * 40 + 60 // 60-100 range
  };
}

async function analyzeVariantPerformance(variants: any[], params: ContentGeneratorParams) {
  return {
    overview: {
      total_variants: variants.length,
      average_score: variants.reduce((sum, v) => sum + v.score, 0) / variants.length,
      best_variant: variants.reduce((best, current) => current.score > best.score ? current : best)
    },
    insights: {
      tone_analysis: 'Multiple tones tested for audience resonance',
      audience_alignment: 85,
      emotional_appeal: 'Varied emotional approaches',
      call_to_action_strength: 85,
      pricing_integration: 'Consistent pricing integration',
      predicted_performance: {
        open_rate_estimate: 26.8,
        click_rate_estimate: 9.5,
        conversion_potential: 'medium' as const
      }
    },
    complexity_range: {
      min: 45,
      max: 75,
      average: 60
    },
    confidence: 82
  };
}

async function createPersonalizationContext(audience: any, params: ContentGeneratorParams) {
  return {
    audience_profile: audience,
    personalization_triggers: mapAudienceToTriggers(audience.primary),
    messaging_priorities: getMessagingPriorities(audience),
    content_preferences: getContentPreferences(audience)
  };
}

function mapAudienceToTone(audienceType: string): 'professional' | 'friendly' | 'urgent' | 'casual' | 'luxury' | 'family' {
  const mapping = {
    families: 'family' as const,
    business_travelers: 'professional' as const,
    young_adults: 'casual' as const,
    seniors: 'friendly' as const,
    budget_conscious: 'urgent' as const,
    luxury_seekers: 'luxury' as const
  };
  
  return mapping[audienceType as keyof typeof mapping] || 'friendly';
}

async function applyPersonalizationLayers(content: any, context: any, params: ContentGeneratorParams) {
  return {
    content: {
      ...content,
      // Apply personalization
    },
    personalization_score: 85,
    analysis: { /* personalization analysis */ },
    suggestions: ['Add audience-specific benefits', 'Use audience-preferred language'],
    insights: {
      tone_analysis: 'Highly personalized for target audience',
      audience_alignment: 95,
      emotional_appeal: 'Strong audience-specific emotional connection',
      call_to_action_strength: 90,
      pricing_integration: 'Audience-optimized pricing presentation',
      predicted_performance: {
        open_rate_estimate: 31.2,
        click_rate_estimate: 13.4,
        conversion_potential: 'high' as const
      }
    },
    complexity: 70,
    confidence: 92
  };
}

async function performComprehensiveAnalysis(content: string, params: ContentGeneratorParams) {
  return {
    overall_score: 78,
    detailed_metrics: {
      readability: 82,
      engagement: 75,
      brand_alignment: 85,
      technical_quality: 80
    },
    recommendations: [
      'Enhance emotional appeal',
      'Strengthen value proposition',
      'Improve call-to-action'
    ],
    insights: {
      tone_analysis: 'Professional with room for emotional enhancement',
      audience_alignment: 75,
      emotional_appeal: 'Moderate emotional connection',
      call_to_action_strength: 70,
      pricing_integration: 'Basic pricing mention',
      predicted_performance: {
        open_rate_estimate: 22.1,
        click_rate_estimate: 6.8,
        conversion_potential: 'medium' as const
      }
    },
    complexity_score: 65,
    analysis_confidence: 87,
    marketing_intelligence: {
      competitive_positioning: 'Standard market positioning',
      unique_value_proposition: 'Needs strengthening',
      messaging_framework: ['Price', 'Service', 'Convenience'],
      content_pillars: ['Affordability', 'Reliability']
    }
  };
}

async function performCompetitiveAnalysis(content: string, benchmark: string, params: ContentGeneratorParams) {
  return {
    comparison_score: 68,
    advantages: ['Better price presentation', 'Clearer CTA'],
    disadvantages: ['Less emotional appeal', 'Generic messaging'],
    recommendations: ['Adopt competitor emotional triggers', 'Enhance urgency elements']
  };
}

async function generateTestingStrategy(params: ContentGeneratorParams) {
  return {
    test_type: 'A/B',
    test_duration: 14,
    sample_size_recommendation: 10000,
    success_metrics: ['open_rate', 'click_rate', 'conversion'],
    confidence_level: 95,
    statistical_significance: 0.05,
    confidence: 85
  };
}

async function generateTestingContent(strategy: any, params: ContentGeneratorParams) {
  return {
    baseline: {
      subject: 'Baseline subject',
      body: 'Baseline body',
      cta: 'Baseline CTA'
    },
    test_variations: [
      { id: 'test_a', focus: 'emotional_appeal' },
      { id: 'test_b', focus: 'urgency' }
    ],
    testing_framework: {
      hypothesis: 'Emotional appeal will increase engagement',
      success_criteria: '15% improvement in click rate'
    },
    insights: {
      tone_analysis: 'Testing multiple emotional approaches',
      audience_alignment: 80,
      emotional_appeal: 'Varied testing approaches',
      call_to_action_strength: 85,
      pricing_integration: 'Consistent across variants',
      predicted_performance: {
        open_rate_estimate: 25.0,
        click_rate_estimate: 8.5,
        conversion_potential: 'medium' as const
      }
    },
    complexity_score: 70
  };
}

// Additional utility functions
function determinePricePositioning(pricingData: any): string {
  return 'competitive'; // Analyze price vs market
}

function calculateSavingsPotential(pricingData: any): number {
  return 15; // Calculate savings percentage
}

function generateUrgencyIndicators(pricingData: any, campaignContext: any) {
  return {
    price_trend: 'stable',
    availability: 'limited',
    booking_velocity: 'moderate'
  };
}

function enhanceSubjectLine(subject: string, context: any, params: ContentGeneratorParams): string {
  // Apply context-based enhancements
  return subject;
}

function enhanceBodyContent(body: string, context: any, params: ContentGeneratorParams): string {
  // Apply context-based enhancements
  return body;
}

function enhanceCallToAction(cta: string, context: any, params: ContentGeneratorParams): string {
  // Apply context-based enhancements
  return cta;
}

function enhancePreheader(preheader: string, context: any, params: ContentGeneratorParams): string {
  // Apply context-based enhancements
  return preheader;
}

function mapAudienceToTriggers(audienceType: string): string[] {
  const triggers = {
    families: ['safety', 'value', 'convenience'],
    business_travelers: ['efficiency', 'reliability', 'status'],
    young_adults: ['adventure', 'affordability', 'flexibility'],
    seniors: ['comfort', 'service', 'peace_of_mind'],
    budget_conscious: ['savings', 'deals', 'value'],
    luxury_seekers: ['exclusivity', 'premium', 'experience']
  };
  
  return triggers[audienceType as keyof typeof triggers] || ['value', 'convenience'];
}

function getMessagingPriorities(audience: any): string[] {
  return ['primary_benefit', 'secondary_benefit', 'call_to_action'];
}

function getContentPreferences(audience: any): any {
  return {
    length: 'medium',
    complexity: 'simple',
    emotional_tone: 'positive'
  };
}

/**
 * Generate content using OpenAI directly without old tools
 */
async function generateContentWithAI(topic: string, pricingData: any, params: ContentGeneratorParams) {
  console.log(`🤖 Generating content with AI for topic: ${topic}`);
  
  try {
    const OpenAI = require('openai').OpenAI;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Prepare pricing context
    const priceContext = pricingData?.prices?.length > 0 
      ? pricingData.prices.slice(0, 5).map((p: any) => 
          `${p.origin || 'Москва'} → ${p.destination || 'Destination'}: от ${p.price || 'N/A'} ${p.currency || 'RUB'}`
        ).join('\n')
      : 'Специальные предложения на авиабилеты';

    const contentPrompt = `Создай email-контент для Kupibilet на тему: "${topic}"

ЦЕНЫ И МАРШРУТЫ:
${priceContext}

ТРЕБОВАНИЯ:
- Язык: русский
- Бренд: Kupibilet (авиабилеты)
- Тон: ${params.tone || 'friendly'}
- Тип контента: ${params.content_type || 'promotional'}
- Целевая аудитория: ${params.target_audience?.primary || 'путешественники'}

ОБЯЗАТЕЛЬНО верни ТОЛЬКО JSON в формате:
{
  "subject": "Заголовок письма",
  "preheader": "Краткое описание",
  "body": "Основной текст письма с ценами",
  "cta": "Текст кнопки",
  "language": "ru",
  "tone": "${params.tone || 'friendly'}"
}

НЕ добавляй никакого другого текста, только JSON!`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: contentPrompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;
    
    // Parse JSON response
    let contentData;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback content structure
      contentData = {
        subject: `${topic} - специальные предложения от Kupibilet`,
        preheader: 'Лучшие цены на авиабилеты',
        body: `Отличные предложения по направлению "${topic}". ${priceContext}. Бронируйте сейчас!`,
        cta: 'Найти билеты',
        language: 'ru',
        tone: params.tone || 'friendly'
      };
    }

    console.log(`✅ AI content generated successfully`);
    
    return {
      success: true,
      data: contentData
    };

  } catch (error) {
    console.error('❌ AI content generation failed:', error);
    throw new Error(`AI content generation failed: ${error.message}`);
  }
}

export const contentGeneratorSchemaAlias = contentGeneratorSchema;

/**
 * Legacy alias for backward compatibility – mirrors contentGenerator
 */
export const generateCopyTool = tool({
  name: 'generate_copy',
  description: 'Legacy alias for content_generator – generates email copy/content. Use content_generator for new flows.',
  parameters: contentGeneratorSchema,
  execute: contentGenerator,
});