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
  content_type: z.enum(['email', 'subject_line', 'preheader', 'call_to_action', 'body_text', 'complete_campaign']).describe('Type of content to generate'),
  
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
    }).nullable().optional().nullable().describe('Enhanced pricing statistics')
  }).nullable().optional().nullable().describe('Price data for content context'),
  
  // Content generation strategy
  generation_strategy: z.enum(['speed', 'quality', 'creative', 'data_driven', 'emotional']).describe('Generation approach'),
  tone: z.enum(['professional', 'friendly', 'urgent', 'casual', 'luxury', 'family']).describe('Content tone'),
  language: z.enum(['ru', 'en']).describe('Content language'),
  
  // Target audience and personalization
  target_audience: z.object({
    primary: z.enum(['families', 'business_travelers', 'young_adults', 'seniors', 'budget_conscious', 'luxury_seekers']).describe('Primary audience segment'),
    demographics: z.object({
      age_range: z.enum(['18-25', '26-35', '36-45', '46-55', '55+']).nullable().optional().nullable(),
      income_level: z.enum(['budget', 'middle', 'premium', 'luxury']).nullable().optional().nullable(),
      travel_frequency: z.enum(['first_time', 'occasional', 'frequent', 'business']).nullable().optional().nullable()
    }).nullable().optional().nullable().describe('Detailed demographics'),
    psychographics: z.object({
      motivations: z.array(z.enum(['save_money', 'convenience', 'comfort', 'experience', 'status'])).nullable().optional().nullable(),
      booking_behavior: z.enum(['last_minute', 'planner', 'deal_hunter', 'loyalty_focused']).nullable().optional().nullable()
    }).nullable().optional().nullable().describe('Psychological and behavioral traits')
  }).nullable().optional().nullable().describe('Target audience specification'),
  
  // Campaign context
  campaign_context: z.object({
    campaign_type: z.enum(['promotional', 'informational', 'seasonal', 'urgent', 'newsletter']).nullable().optional().nullable(),
    seasonality: z.enum(['spring', 'summer', 'autumn', 'winter', 'holiday', 'general']).nullable().optional().nullable(),
    urgency_level: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional().nullable(),
    promotion_details: z.object({
      discount_percentage: z.number().nullable().optional().nullable(),
      validity_period: z.string().nullable().optional().nullable(),
      limited_availability: z.boolean().nullable().optional().nullable()
    }).nullable().optional().nullable()
  }).nullable().optional().nullable().describe('Campaign-specific context'),
  
  // Assets and visual context
  assets_context: z.object({
    available_assets: z.array(z.object({
      type: z.enum(['rabbit_emotion', 'airline_logo', 'illustration', 'icon']),
      emotion: z.string().nullable().optional().nullable(),
      description: z.string().nullable().optional().nullable()
    })).nullable().optional().nullable().describe('Available visual assets for content alignment'),
    brand_elements: z.object({
      colors: z.array(z.string()).nullable().optional().nullable(),
      mascot_personality: z.string().nullable().optional().nullable()
    }).nullable().optional().nullable(),
    image_requirements: z.object({
      total_images_needed: z.number().min(1).max(10).describe('Total number of images needed for the email'),
      figma_images_count: z.number().min(0).max(8).describe('Number of images to source from Figma assets'),
      internet_images_count: z.number().min(0).max(5).describe('Number of images to source from external internet sources'),
      require_logo: z.boolean().describe('Whether a logo/brand asset is required'),
      image_categories: z.array(z.enum(['illustration', 'photo', 'icon', 'banner', 'background', 'mascot'])).nullable().optional().nullable().describe('Categories of images needed'),
      placement_instructions: z.object({
        hero_image: z.object({
          source: z.enum(['figma', 'internet']).describe('Source for hero/header image'),
          category: z.enum(['illustration', 'photo', 'mascot']).describe('Type of hero image'),
          description: z.string().describe('Description of desired hero image')
        }).nullable().optional().nullable(),
        content_images: z.array(z.object({
          source: z.enum(['figma', 'internet']).describe('Source for content image'),
          category: z.enum(['illustration', 'photo', 'icon']).describe('Type of content image'),
          description: z.string().describe('Description of desired content image')
        })).nullable().optional().nullable().describe('Specific content images with placement'),
        footer_elements: z.array(z.object({
          source: z.enum(['figma', 'internet']).describe('Source for footer element'),
          category: z.enum(['logo', 'icon', 'mascot']).describe('Type of footer element'),
          description: z.string().describe('Description of desired footer element')
        })).nullable().optional().nullable().describe('Footer visual elements')
      }).nullable().optional().nullable().describe('Specific placement instructions for different image types'),
      size_constraints: z.object({
        max_width: z.number().describe('Maximum width in pixels'),
        max_height: z.number().describe('Maximum height in pixels'),
        max_file_size_kb: z.number().describe('Maximum file size in KB')
      }).nullable().optional().nullable().describe('Technical constraints for images')
    }).nullable().optional().nullable().describe('Detailed image requirements and distribution strategy')
  }).nullable().optional().nullable().describe('Visual assets context for content alignment'),
  
  // Content specifications
  content_specs: z.object({
    max_length: z.number().nullable().optional().nullable().describe('Maximum content length in characters'),
    include_prices: z.boolean().describe('Include pricing information'),
    include_cta: z.boolean().describe('Include call-to-action'),
    email_client_optimization: z.boolean().describe('Optimize for email clients'),
    accessibility_compliance: z.boolean().describe('Ensure accessibility compliance')
  }).nullable().optional().nullable().describe('Content technical specifications'),
  
  // A/B testing and variations
  variant_options: z.object({
    generate_variants: z.boolean().describe('Generate multiple content variations'),
    variant_count: z.number().min(1).max(5).describe('Number of variants to generate'),
    variation_focus: z.enum(['tone', 'structure', 'cta', 'pricing_emphasis', 'emotional_appeal']).nullable().optional().nullable().describe('Primary variation dimension')
  }).nullable().optional().nullable().describe('A/B testing variant generation'),
  
  // Analysis and optimization
  existing_content: z.string().nullable().optional().nullable().describe('Existing content to analyze or optimize'),
  benchmark_content: z.string().nullable().optional().nullable().describe('Benchmark content for comparison'),
  optimization_goals: z.array(z.enum(['open_rate', 'click_rate', 'conversion', 'engagement', 'brand_awareness'])).nullable().optional().nullable().describe('Optimization objectives'),
  
  // Output preferences
  output_format: z.enum(['structured', 'plain_text', 'json', 'marketing_brief']).describe('Output format preference'),
  include_analytics: z.boolean().describe('Include content analytics and insights'),
  include_recommendations: z.boolean().describe('Include optimization recommendations')
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