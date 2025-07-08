/**
 * 🎨 DESIGN SPECIALIST AGENT V2 - TYPE DEFINITIONS
 * 
 * Comprehensive TypeScript interfaces for the Design Specialist Agent V2
 * Extracted from the original 1818-line file for better maintainability
 */

import { AssetSearchResult, StandardAsset } from '../../../core/asset-manager';
import { ExtractedContentPackage } from '../../../core/content-extractor';
import { RenderingResult } from '../services/email-rendering-service';
import { DesignToQualityHandoffData } from '../../../types/base-agent-types';

// Re-export types that are used by other modules
export type { DesignToQualityHandoffData };

// =============================================================================
// CORE TASK TYPES
// =============================================================================

export type DesignTaskType = 
  | 'find_assets' 
  | 'render_email' 
  | 'optimize_design' 
  | 'responsive_design' 
  | 'accessibility_check'
  | 'select_multi_destination_template'
  | 'plan_multi_destination_images';

// =============================================================================
// INPUT INTERFACES
// =============================================================================

export interface DesignSpecialistInputV2 {
  task_type: DesignTaskType;
  content_package: any;
  rendering_requirements?: RenderingRequirements;
  asset_requirements?: AssetRequirements;
  campaign_context?: CampaignContext;
  multi_destination_requirements?: MultiDestinationRequirements;
}

export interface RenderingRequirements {
  template_type?: 'promotional' | 'transactional' | 'newsletter' | 'premium';
  email_client_optimization?: 'gmail' | 'outlook' | 'apple_mail' | 'universal' | 'all';
  responsive_design?: boolean;
  seasonal_theme?: boolean;
  include_dark_mode?: boolean;
}

export interface AssetRequirements {
  tags?: string[];
  emotional_tone?: 'positive' | 'neutral' | 'urgent' | 'friendly';
  campaign_type?: 'seasonal' | 'promotional' | 'informational';
  target_count?: number;
  preferred_emotion?: 'happy' | 'angry' | 'neutral' | 'sad' | 'confused';
  image_requirements?: ImageRequirements;
}

export interface ImageRequirements {
  total_images_needed: number;
  figma_images_count: number;
  internet_images_count: number;
  require_logo: boolean;
  image_categories?: Array<'illustration' | 'photo' | 'icon' | 'banner' | 'background'>;
}

export interface CampaignContext {
  campaign_id?: string;
  performance_session?: string;
}

export interface MultiDestinationRequirements {
  multi_destination_plan?: any; // MultiDestinationPlan from multi-destination-types
  template_selection_criteria?: {
    destination_count: number;
    layout_preference?: 'compact' | 'grid' | 'carousel' | 'list' | 'featured';
    device_targets: ('mobile' | 'tablet' | 'desktop')[];
    content_complexity: 'simple' | 'detailed' | 'rich';
    performance_priority: 'speed' | 'visual_quality' | 'balanced';
  };
  image_planning_requirements?: {
    performance_priority: 'speed' | 'visual_quality' | 'balanced';
    max_total_size_kb?: number;
    compression_strategy?: 'aggressive' | 'balanced' | 'quality_first';
  };
}

// =============================================================================
// OUTPUT INTERFACES
// =============================================================================

export interface DesignSpecialistOutputV2 {
  success: boolean;
  task_type: DesignTaskType;
  results: DesignResults;
  design_artifacts?: DesignArtifacts;
  handoff_data?: DesignToQualityHandoffData;
  recommendations: DesignRecommendations;
  analytics: DesignAnalytics;
  error?: string;
  trace_id: string;
}

export interface DesignResults {
  assets?: AssetSearchResult;
  rendering?: RenderingResult;
  optimization?: OptimizationResult;
  template_design?: TemplateDesign;
  image_plan?: ImagePlan;
  external_images?: ExternalImageResult;
  multi_destination_template?: MultiDestinationTemplateResult;
  multi_destination_images?: MultiDestinationImageResult;
}

export interface DesignArtifacts {
  html_output?: string;
  mjml_source?: string;
  assets_used?: StandardAsset[];
  performance_metrics?: PerformanceMetrics;
  dark_mode_support?: boolean;
}

export interface DesignRecommendations {
  next_agent?: 'quality_specialist' | 'delivery_specialist';
  next_actions: string[];
}

export interface DesignAnalytics {
  execution_time_ms: number;
  operations_performed: number;
  confidence_score: number;
  cache_hit_rate: number;
}

// =============================================================================
// SPECIALIZED RESULT TYPES
// =============================================================================

export interface OptimizationResult {
  optimized_html?: string;
  optimized_mjml?: string;
  optimization_type: 'responsive' | 'accessibility' | 'performance' | 'cross_client';
  improvements: string[];
  metrics: {
    before: PerformanceMetrics;
    after: PerformanceMetrics;
    improvement_percentage: number;
  };
}

export interface TemplateDesign {
  template_type: string;
  layout_structure: LayoutStructure;
  color_scheme: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  responsive_breakpoints: ResponsiveBreakpoints;
}

export interface LayoutStructure {
  header: LayoutSection;
  body: LayoutSection[];
  footer: LayoutSection;
  sidebar?: LayoutSection;
}

export interface LayoutSection {
  type: 'header' | 'hero' | 'content' | 'cta' | 'footer' | 'sidebar';
  width: string;
  height: string;
  background_color?: string;
  padding: string;
  margin: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  link: string;
  border: string;
}

export interface Typography {
  font_family: string;
  font_sizes: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
  };
  line_heights: {
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
  };
  font_weights: {
    normal: string;
    bold: string;
    light: string;
  };
}

export interface Spacing {
  padding: {
    small: string;
    medium: string;
    large: string;
  };
  margin: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
}

// =============================================================================
// IMAGE PLANNING TYPES
// =============================================================================

export interface ImagePlan {
  total_images_needed: number;
  image_plan: ImagePlanItem[];
  figma_assets_needed?: any;
  layout_optimization: LayoutOptimization;
}

export interface ImagePlanItem {
  position: number;
  type: 'hero' | 'illustration' | 'icon' | 'background' | 'product' | 'testimonial';
  content_description: string;
  size_priority: 'large' | 'medium' | 'small';
  emotional_tone: string;
  search_tags: string[];
  fallback_options: string[];
}

export interface LayoutOptimization {
  mobile_friendly: boolean;
  load_time_optimized: boolean;
  accessibility_compliant: boolean;
}

export interface ExternalImageResult {
  images: ExternalImage[];
  total_found: number;
  search_queries_used: string[];
  confidence_score: number;
}

export interface ExternalImage {
  url: string;
  title: string;
  description: string;
  tags: string[];
  size: {
    width: number;
    height: number;
  };
  format: string;
  quality_score: number;
}

// =============================================================================
// PERFORMANCE AND METRICS
// =============================================================================

export interface PerformanceMetrics {
  load_time_ms: number;
  html_size_kb: number;
  css_size_kb: number;
  image_size_kb: number;
  total_size_kb: number;
  compression_ratio: number;
  mobile_performance_score: number;
  accessibility_score: number;
  cross_client_compatibility: number;
}

// =============================================================================
// CONTENT ANALYSIS TYPES
// =============================================================================

export interface ContentAnalysis {
  theme: string;
  target_audience: string;
  seasonal_context: string;
  geographic_context: string;
  content_length: 'short' | 'medium' | 'long';
  campaign_type: string;
  emotional_requirements: string[];
  brand_requirements: BrandRequirements;
  technical_constraints: TechnicalConstraints;
}

export interface BrandRequirements {
  brand_character: string;
  color_preferences: string[];
  style_preferences: string[];
  tone_of_voice: string;
}

export interface TechnicalConstraints {
  max_width: string;
  max_file_size_kb: number;
  supported_email_clients: string[];
  responsive_required: boolean;
  dark_mode_required: boolean;
}

// =============================================================================
// TAG SELECTION TYPES
// =============================================================================

export interface TagSelectionContext {
  keywords: string[];
  campaign_context: any;
  content_theme: string;
  target_audience: string;
  seasonal_context: string;
  geographic_context: string;
  max_tags: number;
}

export interface TagSelectionResult {
  selected_tags: string[];
  confidence_score: number;
  selection_method: 'ai' | 'context' | 'fallback';
  reasoning: string;
}

// =============================================================================
// SERVICE EXECUTION CONTEXT
// =============================================================================

export interface DesignServiceContext {
  task_type: DesignTaskType;
  content: ExtractedContentPackage | null;
  input: DesignSpecialistInputV2;
  start_time: number;
  trace_id: string;
}

export interface ServiceExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  execution_time_ms: number;
  confidence_score: number;
  operations_performed: number;
}

// =============================================================================
// RESPONSIVE DESIGN TYPES
// =============================================================================

export interface ResponsiveDesignParams {
  action: 'analyze' | 'optimize' | 'generate' | 'test';
  html_content: string | null;
  layout_type: 'single_column' | 'two_column' | 'multi_column' | 'hybrid' | null;
  target_devices: Array<'mobile' | 'tablet' | 'desktop'> | null;
  optimization_level: 'basic' | 'standard' | 'aggressive' | null;
  email_client_support: Array<'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'thunderbird'> | null;
}

export interface ResponsiveDesignResult {
  optimized_html: string;
  responsive_css: string;
  breakpoints: ResponsiveBreakpoints;
  compatibility_report: CompatibilityReport;
  performance_impact: PerformanceImpact;
}

export interface CompatibilityReport {
  email_clients: ClientCompatibility[];
  devices: DeviceCompatibility[];
  overall_score: number;
}

export interface ClientCompatibility {
  client: string;
  version: string;
  compatibility_score: number;
  issues: string[];
  recommendations: string[];
}

export interface DeviceCompatibility {
  device: string;
  screen_size: string;
  compatibility_score: number;
  issues: string[];
  recommendations: string[];
}

export interface PerformanceImpact {
  size_increase_percentage: number;
  load_time_impact_ms: number;
  rendering_performance_score: number;
}

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

export interface AccessibilityParams {
  action: 'analyze' | 'fix' | 'validate' | 'generate_report';
  html_content: string;
  compliance_level: 'WCAG_A' | 'WCAG_AA' | 'WCAG_AAA';
  auto_fix: boolean;
  preserve_design: boolean;
  target_disabilities: Array<'visual' | 'motor' | 'cognitive' | 'hearing'> | null;
}

export interface AccessibilityResult {
  fixed_html: string;
  accessibility_score: number;
  compliance_level: 'WCAG_A' | 'WCAG_AA' | 'WCAG_AAA';
  issues_found: AccessibilityIssue[];
  fixes_applied: AccessibilityFix[];
  recommendations: string[];
}

export interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element: string;
  wcag_guideline: string;
  impact: string;
}

export interface AccessibilityFix {
  issue_type: string;
  fix_description: string;
  before: string;
  after: string;
  impact: string;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

// =============================================================================
// MULTI-DESTINATION RESULT TYPES
// =============================================================================

export interface MultiDestinationTemplateResult {
  selected_template: {
    template_name: string;
    template_path: string;
    layout_type: 'compact' | 'grid' | 'carousel' | 'list' | 'featured';
    estimated_file_size: number;
    optimized_for: ('mobile' | 'tablet' | 'desktop')[];
    compatibility_score: number;
  };
  template_analysis: {
    destination_count: number;
    layout_suitability: number;
    performance_score: number;
    responsive_compatibility: number;
  };
  recommendations: string[];
}

export interface MultiDestinationImageResult {
  image_plans: Array<{
    destination_id: string;
    images: {
      primary: {
        figma_url?: string;
        dimensions: { width: number; height: number };
        format: 'jpg' | 'png' | 'webp';
        quality: number;
        alt: string;
        loading: 'eager' | 'lazy';
      };
      thumbnails?: {
        small: { width: number; height: number };
        medium: { width: number; height: number };
      };
    };
    total_estimated_size: number;
    compression_strategy: 'aggressive' | 'balanced' | 'quality_first';
  }>;
  layout_optimization: {
    responsive_breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    performance_metrics: {
      total_file_size: number;
      estimated_load_time: number;
      optimization_savings: number;
    };
  };
  recommendations: string[];
}

export interface DesignError {
  code: string;
  message: string;
  type: 'validation' | 'processing' | 'rendering' | 'asset' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: any;
  timestamp: number;
}

export interface DesignErrorResult {
  success: false;
  error: DesignError;
  partial_results?: Partial<DesignResults>;
  recovery_suggestions: string[];
} 