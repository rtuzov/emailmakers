/**
 * 📝 CONTENT TYPES & INTERFACES
 * 
 * Общие типы и интерфейсы для всех content сервисов
 * Используется в pricing-service, generation-service
 * Обновлено с учетом актуальной документации OpenAI Agents SDK
 */

import { z } from 'zod';

// ================== CORE SCHEMA ==================

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
    }).nullable().optional().describe('Enhanced pricing statistics')
  }).nullable().optional().describe('Price data for content context'),
  
  // Content generation strategy
  generation_strategy: z.enum(['speed', 'quality', 'creative', 'data_driven', 'emotional']).default('quality').describe('Generation approach'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).default('friendly').describe('Content tone'),
  language: z.enum(['ru', 'en']).default('ru').describe('Content language'),
  
  // Target audience and personalization
  target_audience: z.object({
    primary: z.enum(['families', 'business_travelers', 'young_adults', 'seniors', 'budget_conscious', 'luxury_seekers']).describe('Primary audience segment'),
    demographics: z.object({
      age_range: z.enum(['18-25', '26-35', '36-45', '46-55', '55+']).nullable().optional(),
      income_level: z.enum(['budget', 'middle', 'premium', 'luxury']).nullable().optional(),
      travel_frequency: z.enum(['first_time', 'occasional', 'frequent', 'business']).nullable().optional()
    }).nullable().optional().describe('Detailed demographics'),
    psychographics: z.object({
      motivations: z.array(z.enum(['save_money', 'convenience', 'comfort', 'experience', 'status'])).nullable().optional(),
      booking_behavior: z.enum(['last_minute', 'planner', 'deal_hunter', 'loyalty_focused']).nullable().optional()
    }).nullable().optional().describe('Psychological and behavioral traits')
  }).nullable().optional().describe('Target audience specification'),
  
  // Campaign context
  campaign_context: z.object({
    campaign_type: z.enum(['promotional', 'informational', 'seasonal', 'urgent', 'newsletter']).nullable().optional(),
    seasonality: z.enum(['spring', 'summer', 'autumn', 'winter', 'holiday', 'general']).nullable().optional(),
    urgency_level: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
    promotion_details: z.object({
      discount_percentage: z.number().nullable().optional(),
      validity_period: z.string().nullable().optional(),
      limited_availability: z.boolean().nullable().optional()
    }).nullable().optional()
  }).nullable().optional().describe('Campaign-specific context'),
  
  // Assets and visual context
  assets_context: z.object({
    available_assets: z.array(z.object({
      type: z.enum(['rabbit_emotion', 'airline_logo', 'illustration', 'icon']),
      emotion: z.string().nullable().optional(),
      description: z.string().nullable().optional()
    })).nullable().optional().describe('Available visual assets for content alignment'),
    brand_elements: z.object({
      colors: z.array(z.string()).nullable().optional(),
      mascot_personality: z.string().nullable().optional()
    }).nullable().optional()
  }).nullable().optional().describe('Visual assets context for content alignment'),
  
  // Content specifications
  content_specs: z.object({
    max_length: z.number().nullable().optional().describe('Maximum content length in characters'),
    include_prices: z.boolean().default(true).describe('Include pricing information'),
    include_cta: z.boolean().default(true).describe('Include call-to-action'),
    email_client_optimization: z.boolean().default(true).describe('Optimize for email clients'),
    accessibility_compliance: z.boolean().default(true).describe('Ensure accessibility compliance')
  }).nullable().optional().describe('Content technical specifications'),
  
  // A/B testing and variations
  variant_options: z.object({
    generate_variants: z.boolean().default(false).describe('Generate multiple content variations'),
    variant_count: z.number().min(1).max(5).default(2).describe('Number of variants to generate'),
    variation_focus: z.enum(['tone', 'structure', 'cta', 'pricing_emphasis', 'emotional_appeal']).nullable().optional().describe('Primary variation dimension')
  }).nullable().optional().describe('A/B testing variant generation'),
  
  // Analysis and optimization
  existing_content: z.string().nullable().optional().describe('Existing content to analyze or optimize'),
  benchmark_content: z.string().nullable().optional().describe('Benchmark content for comparison'),
  optimization_goals: z.array(z.enum(['open_rate', 'click_rate', 'conversion', 'engagement', 'brand_awareness'])).nullable().optional().describe('Optimization objectives'),
  
  // Output preferences
  output_format: z.enum(['structured', 'plain_text', 'json', 'marketing_brief']).default('structured').describe('Output format preference'),
  include_analytics: z.boolean().default(true).describe('Include content analytics and insights'),
  include_recommendations: z.boolean().default(true).describe('Include optimization recommendations')
});

export type ContentGeneratorParams = z.infer<typeof contentGeneratorSchema>;

// ================== RESULT INTERFACES ==================

export interface ContentResult {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
}

export interface ContentVariant {
  id: string;
  content: ContentResult;
  focus: string;
  score: number;
}

export interface ContentAnalysis {
  readability_score: number;
  sentiment_score: number;
  engagement_potential: number;
  brand_alignment: number;
}

export interface ContentInsights {
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
}

export interface MarketingIntelligence {
  competitor_analysis: {
    positioning_summary: string;
    differentiation_opportunities: string[];
    market_trends: string[];
  };
  price_psychology: {
    price_perception: 'budget' | 'value' | 'premium' | 'luxury';
    urgency_triggers: string[];
    saving_messaging: string;
  };
  content_optimization: {
    subject_line_recommendations: string[];
    body_improvements: string[];
    cta_enhancements: string[];
  };
  // Legacy properties for backward compatibility
  competitive_positioning?: string;
  unique_value_proposition?: string;
  messaging_framework?: string[];
  content_pillars?: string[];
}

export interface ContentGeneratorResult {
  success: boolean;
  action: string;
  data?: {
    content?: ContentResult;
    variants?: ContentVariant[];
    analysis?: ContentAnalysis;
    optimization_suggestions?: string[];
  };
  content_insights?: ContentInsights;
  marketing_intelligence?: MarketingIntelligence;
  analytics?: {
    execution_time: number;
    content_length: number;
    complexity_score: number;
    generation_confidence: number;
    ai_model_used: string;
  };
  error?: string;
}

// ================== PRICING SERVICE TYPES ==================

export interface PricingData {
  prices: Array<{
    origin: string;
    destination: string;
    price: number;
    currency: string;
    date: string;
  }>;
  currency: string;
  cheapest: number;
  statistics?: {
    average: number;
    median: number;
    price_range: {
      min: number;
      max: number;
    };
  };
}

export interface PricingContext {
  price_positioning: string;
  savings_potential: number;
  urgency_indicators: {
    is_deal: boolean;
    time_sensitive: boolean;
    inventory_limited: boolean;
    messaging: string[];
  };
  competitive_analysis: {
    market_position: 'lowest' | 'competitive' | 'premium';
    value_proposition: string;
    messaging_strategy: string[];
  };
}

export interface PricingAnalysisResult {
  success: boolean;
  pricing_context: PricingContext;
  enhanced_pricing: {
    formatted_prices: string[];
    saving_messages: string[];
    urgency_triggers: string[];
  };
  pricing_intelligence: {
    psychological_pricing: string;
    optimal_presentation: string;
    cross_sell_opportunities: string[];
  };
}

// ================== GENERATION SERVICE TYPES ==================

export interface GenerationContext {
  enhanced_pricing?: PricingContext;
  audience_insights: {
    messaging_priorities: string[];
    content_preferences: Record<string, any>;
    psychological_triggers: string[];
  };
  campaign_intelligence: {
    seasonality_factors: string[];
    urgency_context: string;
    personalization_layers: Record<string, any>;
  };
}

export interface GenerationResult {
  success: boolean;
  content: ContentResult;
  generation_metadata: {
    strategy_used: string;
    ai_model: string;
    processing_time: number;
    confidence_score: number;
  };
  enhancement_applied: {
    pricing_integration: boolean;
    audience_optimization: boolean;
    brand_alignment: boolean;
    accessibility_compliance: boolean;
  };
}

export interface OptimizationResult {
  success: boolean;
  optimized_content: ContentResult;
  improvement_analysis: {
    improvement_score: number;
    key_changes: string[];
    performance_prediction: {
      expected_lift: number;
      confidence_level: 'low' | 'medium' | 'high';
    };
  };
  comparison_metrics: {
    readability_improvement: number;
    engagement_improvement: number;
    conversion_improvement: number;
  };
}

// ================== UTILITY TYPES ==================

export interface PerformanceMetrics {
  execution_time: number;
  tokens_used?: number;
  api_calls_made: number;
  cache_hits?: number;
  success_rate: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ================== SERVICE BASE INTERFACE ==================

export interface BaseContentService {
  validateInput(params: ContentGeneratorParams): ValidationResult;
  getPerformanceMetrics(): PerformanceMetrics;
}