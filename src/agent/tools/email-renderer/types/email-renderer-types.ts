/**
 * 📧 EMAIL RENDERER TYPES
 * 
 * Comprehensive TypeScript interfaces for email rendering operations
 * Extracted from consolidated email-renderer.ts for modular architecture
 */

import { z } from 'zod';

// ============================================================================
// CORE SCHEMAS AND TYPES
// ============================================================================

export const emailRendererSchema = z.object({
  action: z.enum(['render_mjml', 'render_component', 'render_advanced', 'render_seasonal', 'render_hybrid', 'optimize_output']).describe('Email rendering operation'),
  
  // For render_mjml action
  mjml_content: z.string().describe('MJML content to compile to HTML'),
  
  // For render_component action
  component_type: z.enum(['header', 'footer', 'body', 'cta', 'pricing_block', 'hero', 'newsletter']).describe('Type of React component to render'),
  component_props: z.string().describe('Props to pass to the React component (JSON string)'),
  
  // For render_advanced action
  advanced_config: z.object({
    template_type: z.enum(['promotional', 'transactional', 'newsletter', 'premium', 'responsive']).describe('Advanced template type'),
    customization_level: z.enum(['basic', 'standard', 'advanced', 'enterprise']).describe('Customization complexity'),
    features: z.array(z.enum(['dark_mode', 'interactive', 'animation', 'personalization', 'a_b_testing'])).describe('Advanced features to include'),
    brand_guidelines: z.object({
      primary_color: z.string(),
      secondary_color: z.string(),
      font_family: z.string(),
      logo_url: z.string()
    }).describe('Brand customization')
  }).describe('Advanced component configuration'),
  
  // For render_seasonal action
  seasonal_config: z.object({
    season: z.enum(['spring', 'summer', 'autumn', 'winter', 'holiday', 'new_year', 'valentine', 'easter']).describe('Seasonal theme'),
    seasonal_intensity: z.enum(['subtle', 'moderate', 'festive', 'full_theme']).describe('How prominent seasonal elements should be'),
    cultural_context: z.enum(['russian', 'international', 'european', 'mixed']).describe('Cultural context for seasonal elements'),
    include_animations: z.boolean().describe('Include seasonal animations')
  }).describe('Seasonal rendering configuration'),
  
  // For render_hybrid action (combines multiple systems)
  hybrid_config: z.object({
    base_template: z.enum(['mjml', 'react', 'advanced', 'seasonal']).describe('Base rendering system'),
    enhancements: z.array(z.enum(['seasonal_overlay', 'advanced_components', 'react_widgets', 'mjml_structure'])).describe('Additional rendering layers'),
    priority_order: z.array(z.string()).describe('Order of rendering operations')
  }).describe('Hybrid rendering configuration'),
  
  // Content and data
  content_data: z.object({
    subject: z.string(),
    preheader: z.string(),
    body: z.string(),
    cta_text: z.string(),
    cta_url: z.string(),
    pricing_data: z.string(),
    assets: z.array(z.string()),
    personalization: z.string()
  }).describe('Content data for rendering'),
  
  // Additional parameters for backward compatibility
  assets: z.array(z.string()).describe('Asset paths for email rendering'),
  pricing_data: z.string().describe('Pricing data for content'),
  brand_guidelines: z.object({
    brand_voice: z.string(),
    visual_style: z.string(),
    color_palette: z.array(z.string()),
    typography: z.string(),
    primary_color: z.string(),
    secondary_color: z.string(),
    font_family: z.string(),
    logo_url: z.string()
  }).describe('Brand guidelines for rendering'),
  
  // Rendering options
  rendering_options: z.object({
    output_format: z.enum(['html', 'mjml', 'amp', 'text', 'preview']).describe('Output format'),
    email_client_optimization: z.enum(['gmail', 'outlook', 'apple_mail', 'universal', 'all']).describe('Target email client optimization'),
    responsive_design: z.boolean().describe('Enable responsive design'),
    inline_css: z.boolean().describe('Inline CSS for email client compatibility'),
    minify_output: z.boolean().describe('Minify HTML output'),
    validate_html: z.boolean().describe('Validate HTML for email standards'),
    accessibility_compliance: z.boolean().describe('Ensure accessibility compliance')
  }).describe('Rendering optimization options'),
  
  // Performance and caching
  performance_config: z.object({
    cache_strategy: z.enum(['aggressive', 'normal', 'minimal', 'disabled']).describe('Caching strategy'),
    parallel_rendering: z.boolean().describe('Enable parallel rendering for components'),
    lazy_loading: z.boolean().describe('Enable lazy loading for images'),
    image_optimization: z.boolean().describe('Optimize images during rendering')
  }).describe('Performance optimization settings'),
  
  // Analytics and debugging
  include_analytics: z.boolean().describe('Include rendering analytics'),
  debug_mode: z.boolean().describe('Enable debug output and logging'),
  render_metadata: z.boolean().describe('Include rendering metadata in output'),
  
  // Email folder for saving files
  emailFolder: z.string().describe('Email folder path or identifier')
});

export type EmailRendererParams = z.infer<typeof emailRendererSchema>;

// ============================================================================
// RENDERING ENGINE TYPES
// ============================================================================

export type RenderingEngine = 'mjml-core' | 'react-dom' | 'advanced-system';
export type TemplateType = 'promotional' | 'transactional' | 'newsletter' | 'premium' | 'responsive' | 'dynamic_generated';
export type EmailClient = 'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'universal' | 'all';
export type OutputFormat = 'html' | 'mjml' | 'amp' | 'text' | 'preview';
export type ComponentType = 'header' | 'footer' | 'body' | 'cta' | 'pricing_block' | 'hero' | 'newsletter';
export type SeasonalTheme = 'spring' | 'summer' | 'autumn' | 'winter' | 'holiday' | 'new_year' | 'valentine' | 'easter';
export type CustomizationLevel = 'basic' | 'standard' | 'advanced' | 'enterprise';
export type CacheStrategy = 'aggressive' | 'normal' | 'minimal' | 'disabled';

// ============================================================================
// VALIDATION AND QUALITY TYPES
// ============================================================================

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  fix_suggestion?: string;
}

export interface ValidationResult {
  is_valid: boolean;
  issues: ValidationIssue[];
  fixes_applied: number;
  auto_fixes_available: boolean;
}

export interface QualityMetrics {
  overall_score: number;
  accessibility_score: number;
  performance_score: number;
  email_client_scores: Record<string, number>;
}

export interface ComplianceResult {
  html_valid: boolean;
  email_client_scores: Record<string, number>;
  accessibility_score: number;
  performance_score: number;
  issues: ValidationIssue[];
}

// ============================================================================
// CONTENT AND DATA TYPES
// ============================================================================

export interface ContentData {
  subject?: string;
  preheader?: string;
  body?: string;
  cta_text?: string;
  cta_url?: string;
  pricing_data?: string;
  assets?: string[];
  personalization?: string;
  language?: string;
  tone?: string;
}

export interface BrandGuidelines {
  brand_voice?: string;
  visual_style?: string;
  color_palette?: string[];
  typography?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  logo_url?: string;
}

export interface AssetMetadata {
  paths: string[];
  metadata: Record<string, any>;
  optimized?: boolean;
  sprite_data?: any;
}

// ============================================================================
// RENDERING CONFIGURATION TYPES
// ============================================================================

export interface RenderingOptions {
  output_format?: OutputFormat;
  email_client_optimization?: EmailClient;
  responsive_design?: boolean;
  inline_css?: boolean;
  minify_output?: boolean;
  validate_html?: boolean;
  accessibility_compliance?: boolean;
}

export interface PerformanceConfig {
  cache_strategy: CacheStrategy;
  parallel_rendering: boolean;
  lazy_loading: boolean;
  image_optimization: boolean;
}

export interface AdvancedConfig {
  template_type?: TemplateType;
  customization_level?: CustomizationLevel;
  features?: string[];
  brand_guidelines?: Partial<BrandGuidelines>;
}

export interface SeasonalConfig {
  season?: SeasonalTheme;
  seasonal_intensity?: 'subtle' | 'moderate' | 'festive' | 'full_theme';
  cultural_context?: 'russian' | 'international' | 'european' | 'mixed';
  include_animations?: boolean;
}

export interface HybridConfig {
  base_template?: 'mjml' | 'react' | 'advanced' | 'seasonal';
  enhancements?: string[];
  priority_order?: string[];
}

// ============================================================================
// OUTPUT AND RESULT TYPES
// ============================================================================

export interface RenderingMetadata {
  template_type: string;
  rendering_engine: string;
  optimizations_applied: string[];
  client_compatibility: string[];
  file_size: number;
  load_time_estimate: number;
}

export interface RenderingAnalytics {
  execution_time: number;
  rendering_complexity: number;
  cache_efficiency: number;
  components_rendered: number;
  optimizations_performed: number;
}

export interface StandardMjmlResponse {
  success: boolean;
  action: string;
  mjml: {
    source: string;
    is_valid: boolean;
    validation_issues: ValidationIssue[];
    auto_fixes_applied: number;
    length: number;
  };
  html: {
    content: string;
    size_kb: number;
    is_valid: boolean;
    length: number;
  };
  rendering: {
    engine: RenderingEngine;
    template_type: string;
    execution_time_ms: number;
    optimizations_applied: string[];
    client_compatibility: string[];
  };
  quality: QualityMetrics;
  metadata: {
    generation_timestamp: string;
    content_language: string;
    tone: string;
    components_used: string[];
    assets_count: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  recommendations: string[];
}

export interface EmailRendererResult {
  success: boolean;
  action: string;
  data?: {
    html?: string;
    mjml?: string;
    text_version?: string;
    amp_version?: string;
    preview_url?: string;
    component_metadata?: any;
    rendering_stats?: any;
    standard_response?: StandardMjmlResponse;
  };
  rendering_metadata?: RenderingMetadata;
  validation_results?: ComplianceResult;
  trace_id?: string;
  analytics?: RenderingAnalytics;
  error?: string;
  recommendations?: string[];
}

// ============================================================================
// EMAIL FOLDER TYPES
// ============================================================================

export interface EmailFolder {
  campaignId: string;
  basePath: string;
  assetsPath: string;
  spritePath: string;
  htmlPath: string;
  mjmlPath: string;
  metadataPath: string;
}

// ============================================================================
// MJML GENERATION TYPES
// ============================================================================

export interface MjmlGenerationContext {
  content_data: ContentData;
  assets: string[];
  brand_guidelines?: BrandGuidelines;
  seasonal_config?: SeasonalConfig;
  advanced_config?: AdvancedConfig;
}

export interface MjmlValidationContext {
  mjml_content: string;
  validation_options: {
    strict_mode: boolean;
    auto_fix: boolean;
    client_compatibility: EmailClient[];
  };
}

// ============================================================================
// OPTIMIZATION TYPES
// ============================================================================

export interface OptimizationContext {
  html_content: string;
  mjml_content?: string;
  target_clients: EmailClient[];
  performance_targets: {
    max_size_kb: number;
    max_load_time_ms: number;
    min_accessibility_score: number;
  };
}

export interface OptimizationResult {
  optimized_html: string;
  optimized_mjml?: string;
  text_version?: string;
  amp_version?: string;
  optimizations_applied: string[];
  performance_improvements: {
    size_reduction_percent: number;
    load_time_improvement_ms: number;
    accessibility_score_improvement: number;
  };
  warnings: string[];
}

// ============================================================================
// SERVICE EXECUTION TYPES
// ============================================================================

export interface ServiceExecutionContext {
  params: EmailRendererParams;
  start_time: number;
  email_folder?: EmailFolder;
  trace_id?: string;
}

export interface ServiceExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  execution_time_ms: number;
  warnings?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// COMPONENT RENDERING TYPES
// ============================================================================

export interface ComponentRenderingContext {
  component_type: ComponentType;
  component_props: Record<string, any>;
  content_data: ContentData;
  brand_guidelines?: BrandGuidelines;
  rendering_options: RenderingOptions;
}

export interface ComponentRenderingResult {
  rendered_component: string;
  component_metadata: {
    type: ComponentType;
    props_used: string[];
    rendering_time_ms: number;
    size_bytes: number;
  };
  integration_points: {
    css_dependencies: string[];
    js_dependencies: string[];
    asset_dependencies: string[];
  };
}

// ============================================================================
// HYBRID RENDERING TYPES
// ============================================================================

export interface HybridRenderingStage {
  stage_name: string;
  engine: RenderingEngine;
  input_data: any;
  output_data?: any;
  execution_time_ms?: number;
  success?: boolean;
  error?: string;
}

export interface HybridRenderingPipeline {
  stages: HybridRenderingStage[];
  total_execution_time_ms: number;
  final_output: any;
  pipeline_metadata: {
    stages_executed: number;
    stages_failed: number;
    optimizations_applied: string[];
  };
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface EmailRendererError {
  code: string;
  message: string;
  details?: any;
  stage?: string;
  recoverable?: boolean;
  suggested_fix?: string;
}

export interface ErrorContext {
  action: string;
  stage: string;
  params_summary: Record<string, any>;
  execution_time_ms: number;
  trace_id?: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// All types are already exported individually above
// This bulk export is removed to avoid TypeScript conflicts 