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
  
  // Simplified pricing context
  pricing_data: z.object({
    prices: z.array(z.object({
      destination: z.string(),
      price: z.number(),
      currency: z.string()
    })),
    currency: z.string().default('RUB'),
    cheapest: z.number().nullable().optional()
  }).nullable().optional().describe('Optional price data for content context'),
  
  // Basic content preferences
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual']).default('friendly').describe('Content tone'),
  language: z.enum(['ru', 'en']).default('ru').describe('Content language'),
  
  // Simple target audience
  target_audience: z.enum(['families', 'business_travelers', 'young_adults', 'budget_conscious']).default('families').describe('Primary audience segment'),
  
  // Campaign type
  campaign_type: z.enum(['promotional', 'newsletter', 'seasonal']).default('promotional').describe('Type of campaign'),
  
  // Output preferences
  include_prices: z.boolean().default(true).describe('Include pricing information'),
  include_analytics: z.boolean().default(false).describe('Include content analytics'),
  
  // Additional properties for different actions
  content_type: z.string().nullable().optional().describe('Type of content to generate'),
  generation_strategy: z.string().nullable().optional().describe('Strategy for content generation'),
  variant_options: z.object({
    generate_variants: z.boolean().default(false),
    variant_count: z.number().default(2)
  }).nullable().optional().describe('Options for variant generation'),
  existing_content: z.string().nullable().optional().describe('Existing content for optimization/analysis'),
  benchmark_content: z.string().nullable().optional().describe('Benchmark content for analysis'),
  content_specs: z.object({
    max_length: z.number().nullable().optional(),
    accessibility_compliance: z.boolean().default(true)
  }).nullable().optional().describe('Content specifications'),
      assets_context: z.object({}).nullable().optional().describe('Context for assets and images'),
  campaign_context: z.object({
    campaign_type: z.string().nullable().optional(),
    seasonality: z.string().nullable().optional(),
    urgency_level: z.string().nullable().optional()
  }).nullable().optional().describe('Campaign context information')
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
    campaign_id?: string;
    email_folder?: string;
    test_setup?: {
      variants: Array<{
        variant_id: string;
        content: ContentResult;
        predicted_performance: number;
      }>;
      recommended_split: string;
      test_duration: string;
      success_metric: string;
    };
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