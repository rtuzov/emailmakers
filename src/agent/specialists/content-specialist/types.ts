/**
 * TypeScript types and interfaces for Content Specialist
 * 
 * Provides type definitions for content generation, campaign context,
 * and OpenAI SDK integration.
 */

import { RunContext } from '@openai/agents';

// ============================================================================
// CAMPAIGN CONTEXT TYPES
// ============================================================================

export interface CampaignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  metadata?: CampaignMetadata;
  context_analysis?: ContextAnalysis;
  date_analysis?: DateAnalysis;
  pricing_analysis?: PricingAnalysis;
  asset_strategy?: AssetStrategy;
  generated_content?: GeneratedContent;
  technical_requirements?: TechnicalRequirements;
  design_brief?: DesignBrief;
  trace_id?: string | null;
}

export interface CampaignMetadata {
  id: string;
  name: string;
  brand: string;
  type: string;
  target_audience: string;
  language: string;
  created_at: string;
  status: string;
}

// ============================================================================
// EXTENDED OPENAI SDK CONTEXT
// ============================================================================

export interface ExtendedRunContext extends RunContext<unknown> {
  campaignContext?: CampaignWorkflowContext;
}

// ============================================================================
// CONTENT GENERATION TYPES
// ============================================================================

export interface GeneratedContent {
  subject: string;
  preheader: string;
  body: string;
  cta: {
    primary: string;
    secondary: string;
  };
  personalization_level: string;
  urgency_level: string;
  pricing?: {
    best_price: string;
    currency: string;
    offers_count: number;
  };
  dates?: {
    optimal_dates: string[];
    season: string;
  };
  context?: {
    destination: string;
    emotional_triggers: string;
  };
}

export interface ContextAnalysis {
  destination: string;
  seasonal_trends: string;
  emotional_triggers: string;
  market_positioning: string;
  competitive_landscape: string;
  price_sensitivity: string;
  booking_patterns: string;
}

export interface DateAnalysis {
  destination: string;
  season: string;
  optimal_dates: string[];
  pricing_windows: string[];
  booking_recommendation: string;
  seasonal_factors: string;
  current_date: string;
}

export interface PricingAnalysis {
  best_price: number;
  min_price: number;
  max_price: number;
  average_price: number;
  currency: string;
  offers_count: number;
  recommended_dates: string[];
  route: string;
  enhanced_features: {
    airport_conversion: any;
    csv_integration: string;
    api_source: string;
  };
}

export interface AssetStrategy {
  theme: string;
  visual_style: string;
  color_palette: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  typography: string;
  image_concepts: string[];
  layout_hierarchy: string;
  emotional_triggers: string;
  brand_consistency: string;
}

export interface TechnicalRequirements {
  max_width?: string;
  email_clients?: string[];
  dark_mode_support?: boolean;
  accessibility_level?: 'A' | 'AA' | 'AAA';
}

export interface DesignBrief {
  destination_context?: {
    name?: string;
    seasonal_advantages?: string;
    emotional_appeal?: string;
    market_position?: string;
  };
  design_requirements?: {
    visual_style?: string;
    color_palette?: string;
    imagery_direction?: string;
    typography_mood?: string;
  };
  content_priorities?: {
    key_messages?: string[];
    emotional_triggers?: string[];
    actionable_insights?: string[];
  };
  competitive_differentiation?: {
    unique_selling_points?: string;
    market_advantages?: string;
  };
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface ToolError extends Error {
  toolName: string;
  originalError: unknown;
}

export type ErrorHandler = (error: unknown, toolName: string) => string;

// ============================================================================
// LLM GENERATION TYPES
// ============================================================================

export interface LLMGenerationParams {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface AssetSource {
  type: 'local' | 'figma' | 'unsplash';
  path?: string;
  priority: 'primary' | 'secondary' | 'fallback';
  expected_count: number;
}

export interface ContentContext {
  generated_content: {
    subject: string;
    body: string;
    context: {
      emotional_triggers: string;
    };
  };
  campaign_type: string;
  target_audience: string;
  language: string;
}

export interface CampaignContext {
  campaignPath: string;
  campaign_type: string;
  target_audience: string;
  language: string;
} 