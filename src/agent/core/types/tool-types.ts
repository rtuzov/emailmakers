/**
 * 🔧 TOOL TYPES - OpenAI Agents SDK Compatible
 * 
 * Comprehensive type definitions and Zod schemas for all specialist tools
 * Organized by specialist categories with proper type safety
 */

import { z } from 'zod';

// ============================================================================
// SPECIALIST TYPES
// ============================================================================

export type SpecialistType = 'content' | 'design' | 'quality' | 'delivery';

export interface HandoffTarget {
  specialist: SpecialistType;
  description: string;
}

// ============================================================================
// CONTENT SPECIALIST SCHEMAS
// ============================================================================

export const campaignCreationSchema = z.object({
  campaign_name: z.string().describe('Name of the email campaign'),
  brand_name: z.string().describe('Brand name for the campaign'),
  campaign_type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).describe('Type of email campaign'),
  target_audience: z.string().nullable().optional().describe('Description of target audience'),
  campaign_goals: z.array(z.string()).nullable().optional().describe('List of campaign objectives')
});

export const contentGenerationSchema = z.object({
  subject: z.string().nullable().optional().describe('Email subject line'),
  preheader: z.string().nullable().optional().describe('Email preheader text'),
  body_content: z.string().nullable().optional().describe('Main email body content'),
  cta_text: z.string().nullable().optional().describe('Call-to-action button text'),
  cta_url: z.string().nullable().optional().describe('Call-to-action URL'),
  personalization_tokens: z.array(z.string()).nullable().optional().describe('Personalization tokens for dynamic content'),
  brand_voice: z.string().nullable().optional().describe('Brand voice and tone guidelines'),
  content_structure: z.object({
    header: z.string().nullable().optional(),
    main_message: z.string().nullable().optional(),
    offer_details: z.string().nullable().optional(),
    urgency_element: z.string().nullable().optional(),
    closing: z.string().nullable().optional()
  }).nullable().optional().describe('Structured content sections'),
  asset_plan: z.object({
    hero_image: z.object({
      type: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      placement: z.string().nullable().optional(),
      figma_reference: z.string().nullable().optional()
    }).nullable().optional(),
    icons: z.array(z.object({
      type: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      placement: z.string().nullable().optional(),
      figma_reference: z.string().nullable().optional()
    })).nullable().optional(),
    illustrations: z.array(z.object({
      type: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      placement: z.string().nullable().optional(),
      figma_reference: z.string().nullable().optional()
    })).nullable().optional()
  }).nullable().optional().describe('Visual asset planning')
});

export const pricingIntelligenceSchema = z.object({
  route: z.object({
    from: z.string().describe('Departure city/airport'),
    to: z.string().describe('Destination city/airport'),
    from_code: z.string().nullable().optional().describe('Departure airport code'),
    to_code: z.string().nullable().optional().describe('Destination airport code')
  }).describe('Flight route information'),
  departure_date: z.string().nullable().optional().describe('Departure date (YYYY-MM-DD)'),
  return_date: z.string().nullable().optional().describe('Return date (YYYY-MM-DD)'),
  price_analysis: z.object({
    current_price: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
    airline: z.string().nullable().optional(),
    price_trend: z.string().nullable().optional(),
    market_position: z.string().nullable().optional(),
    recommendations: z.array(z.string()).nullable().optional()
  }).nullable().optional().describe('Price analysis results')
});

export const contextProviderSchema = z.object({
  context_type: z.enum(['seasonal', 'cultural', 'marketing', 'travel', 'comprehensive']).default('comprehensive').describe('Type of context to provide'),
  destination: z.string().nullable().optional().describe('Target destination for context'),
  travel_purpose: z.string().nullable().optional().describe('Purpose of travel (vacation, business, etc.)')
});

export const dateIntelligenceSchema = z.object({
  target_date: z.string().default(new Date().toISOString().split('T')[0]).describe('Target date for analysis (YYYY-MM-DD)'),
  analysis_type: z.enum(['seasonal', 'holiday', 'event', 'comprehensive']).default('comprehensive').describe('Type of date analysis to perform'),
  region: z.string().default('Russia').nullable().optional().describe('Geographic region for context'),
  industry: z.string().default('travel').nullable().optional().describe('Industry context for analysis')
});

export const assetStrategySchema = z.object({
  campaign_type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).default('promotional').describe('Type of email campaign'),
  brand_guidelines: z.string().default('Kupibilet brand standards').nullable().optional().describe('Brand visual guidelines'),
  target_audience: z.string().default('Russian travelers').nullable().optional().describe('Target audience demographics'),
  message_tone: z.string().default('exciting and affordable').nullable().optional().describe('Desired message tone and mood'),
  visual_requirements: z.array(z.string()).nullable().optional().describe('Specific visual requirements')
});

// ============================================================================
// DESIGN SPECIALIST SCHEMAS
// ============================================================================

export const figmaAssetSelectionSchema = z.object({
  search_tags: z.array(z.string()).describe('Tags for asset search in Figma'),
  asset_type: z.enum(['image', 'icon', 'illustration', 'component']).describe('Type of asset to find'),
  campaign_context: z.string().describe('Campaign context for asset selection'),
  style_preferences: z.array(z.string()).nullable().optional().describe('Visual style preferences'),
  size_requirements: z.string().nullable().optional().describe('Size or dimension requirements')
});

export const assetTagPlanningSchema = z.object({
  content_brief: z.string().describe('Content brief or campaign description'),
  visual_themes: z.array(z.string()).nullable().optional().describe('Visual themes to focus on'),
  brand_keywords: z.array(z.string()).nullable().optional().describe('Brand-specific keywords'),
  campaign_goals: z.array(z.string()).nullable().optional().describe('Campaign objectives')
});

export const imageOptimizationSchema = z.object({
  image_url: z.string().url().describe('URL of the image to optimize'),
  target_format: z.enum(['webp', 'jpeg', 'png']).default('webp').describe('Target image format'),
  quality: z.number().min(1).max(100).default(85).describe('Image quality percentage'),
  max_width: z.number().nullable().optional().describe('Maximum width in pixels'),
  email_client_compatibility: z.boolean().default(true).describe('Optimize for email client compatibility')
});

export const mjmlTemplateSchema = z.object({
  content_structure: z.object({
    header: z.string().nullable().optional(),
    body: z.string(),
    footer: z.string().nullable().optional()
  }).describe('Email content structure'),
  design_tokens: z.object({
    primary_color: z.string().nullable().optional(),
    secondary_color: z.string().nullable().optional(),
    font_family: z.string().nullable().optional(),
    font_size: z.string().nullable().optional()
  }).nullable().optional().describe('Design system tokens'),
  layout_type: z.enum(['single-column', 'two-column', 'newsletter', 'promotional']).describe('Email layout type'),
  responsive: z.boolean().default(true).describe('Enable responsive design')
});

// ============================================================================
// QUALITY SPECIALIST SCHEMAS
// ============================================================================

export const qualityAnalysisSchema = z.object({
  content: z.string().describe('Content to analyze for quality'),
  check_types: z.array(z.enum(['grammar', 'tone', 'brand_consistency', 'accessibility', 'deliverability'])).describe('Types of quality checks to perform'),
  brand_guidelines: z.string().nullable().optional().describe('Brand guidelines for consistency checking'),
  target_audience: z.string().nullable().optional().describe('Target audience for tone analysis')
});

export const emailValidationSchema = z.object({
  html_content: z.string().describe('HTML email content to validate'),
  validation_types: z.array(z.enum(['html', 'css', 'accessibility', 'spam_score', 'links'])).describe('Types of validation to perform'),
  email_client_targets: z.array(z.string()).nullable().optional().describe('Target email clients for compatibility'),
  strict_mode: z.boolean().default(false).describe('Enable strict validation mode')
});

export const compatibilityCheckSchema = z.object({
  html_content: z.string().describe('HTML email content to test'),
  client_list: z.array(z.enum(['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird', 'all'])).describe('Email clients to test against'),
  test_types: z.array(z.enum(['rendering', 'css_support', 'image_loading', 'interactive_elements'])).describe('Types of compatibility tests')
});

export const performanceAnalysisSchema = z.object({
  html_content: z.string().describe('HTML email content to analyze'),
  metrics: z.array(z.enum(['file_size', 'load_time', 'image_optimization', 'css_efficiency'])).describe('Performance metrics to analyze'),
  optimization_suggestions: z.boolean().default(true).describe('Include optimization suggestions')
});

// ============================================================================
// DELIVERY SPECIALIST SCHEMAS
// ============================================================================

export const deliveryPackagingSchema = z.object({
  campaign_id: z.string().describe('Campaign identifier'),
  assets: z.array(z.object({
    type: z.enum(['html', 'images', 'css', 'fonts']),
    path: z.string(),
    size: z.number().nullable().optional()
  })).describe('Assets to package for delivery'),
  compression_level: z.enum(['none', 'standard', 'maximum']).default('standard').describe('Compression level for packaging'),
  include_preview: z.boolean().default(true).describe('Include preview files in package')
});

export const finalDeliverySchema = z.object({
  package_path: z.string().describe('Path to the packaged campaign'),
  delivery_method: z.enum(['download', 'email', 'cloud_storage']).describe('Method of delivery'),
  recipient_email: z.string().email().nullable().optional().describe('Recipient email for delivery'),
  delivery_notes: z.string().nullable().optional().describe('Additional delivery notes or instructions')
});

export const deliveryReportingSchema = z.object({
  campaign_id: z.string().describe('Campaign identifier'),
  delivery_status: z.enum(['pending', 'in_progress', 'completed', 'failed']).describe('Current delivery status'),
  metrics: z.object({
    total_assets: z.number().nullable().optional(),
    package_size: z.number().nullable().optional(),
    delivery_time: z.number().nullable().optional(),
    success_rate: z.number().nullable().optional()
  }).nullable().optional().describe('Delivery performance metrics'),
  report_format: z.enum(['summary', 'detailed', 'analytics']).default('summary').describe('Type of report to generate')
});

// ============================================================================
// HANDOFF SCHEMAS
// ============================================================================

export const handoffSchema = z.object({
  target_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Target specialist to hand off to'),
  context: z.string().describe('Context or instructions for the next specialist'),
  completed_tasks: z.array(z.string()).describe('List of completed tasks'),
  next_steps: z.array(z.string()).describe('Recommended next steps'),
  campaign_data: z.object({
    campaign_id: z.string().nullable().optional().describe('Campaign identifier'),
    campaign_name: z.string().nullable().optional().describe('Campaign name'),
    brand_name: z.string().nullable().optional().describe('Brand name'),
    status: z.string().nullable().optional().describe('Campaign status'),
    additional_info: z.string().nullable().optional().describe('Additional campaign information')
  }).nullable().optional().describe('Campaign data to pass along')
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CampaignContext {
  campaign_id: string;
  brand_name: string;
  campaign_type: string;
  current_specialist: SpecialistType;
  completed_specialists: SpecialistType[];
  assets: Array<{
    type: string;
    path: string;
    metadata?: Record<string, any>;
  }>;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CampaignCreationInput = z.infer<typeof campaignCreationSchema>;
export type ContentGenerationInput = z.infer<typeof contentGenerationSchema>;
export type PricingIntelligenceInput = z.infer<typeof pricingIntelligenceSchema>;
export type ContextProviderInput = z.infer<typeof contextProviderSchema>;
export type DateIntelligenceInput = z.infer<typeof dateIntelligenceSchema>;
export type AssetStrategyInput = z.infer<typeof assetStrategySchema>;

export type FigmaAssetSelectionInput = z.infer<typeof figmaAssetSelectionSchema>;
export type AssetTagPlanningInput = z.infer<typeof assetTagPlanningSchema>;
export type ImageOptimizationInput = z.infer<typeof imageOptimizationSchema>;
export type MjmlTemplateInput = z.infer<typeof mjmlTemplateSchema>;

export type QualityAnalysisInput = z.infer<typeof qualityAnalysisSchema>;
export type EmailValidationInput = z.infer<typeof emailValidationSchema>;
export type CompatibilityCheckInput = z.infer<typeof compatibilityCheckSchema>;
export type PerformanceAnalysisInput = z.infer<typeof performanceAnalysisSchema>;

export type DeliveryPackagingInput = z.infer<typeof deliveryPackagingSchema>;
export type FinalDeliveryInput = z.infer<typeof finalDeliverySchema>;
export type DeliveryReportingInput = z.infer<typeof deliveryReportingSchema>;
export type HandoffInput = z.infer<typeof handoffSchema>; 