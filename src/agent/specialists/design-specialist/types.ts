/**
 * Shared types and interfaces for Design Specialist modules
 */

export interface DesignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  contentContext?: any;
  technical_specification?: any;
  asset_manifest?: any;
  template_design?: any;
  mjml_template?: any;
  design_decisions?: any;
  preview_files?: any;
  performance_metrics?: any;
  design_package?: any;
  trace_id?: string;
}

export interface AssetManifest {
  images: AssetImage[];
  icons: AssetIcon[];
  fonts: AssetFont[];
}

export interface AssetImage {
  id: string;
  path?: string;
  url?: string;
  alt_text: string;
  usage?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  file_size?: number;
  format?: string;
  isExternal?: boolean;
  processed?: boolean;
  optimized?: boolean;
  email_client_support?: Record<string, boolean>;
  technical_compliance?: {
    max_width_respected: boolean;
    format_supported: boolean;
    size_optimized: boolean;
  };
}

export interface AssetIcon {
  id: string;
  path?: string;
  url?: string;
  alt_text: string;
  usage?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  file_size?: number;
  format?: string;
  isExternal?: boolean;
  processed?: boolean;
  optimized?: boolean;
  email_client_support?: Record<string, boolean>;
  technical_compliance?: {
    format_supported: boolean;
    size_optimized: boolean;
  };
}

export interface AssetFont {
  id: string;
  family: string;
  variants: string[];
  source?: string;
}

export interface MjmlTemplate {
  source: string;
  file_size: number;
  html_content?: string;
  html_path?: string;
  mjml_path?: string;
  technical_compliance: {
    max_width_respected: boolean;
    color_scheme_applied: boolean;
    typography_followed: boolean;
    email_client_optimized: boolean;
    real_asset_paths?: boolean;
  };
  specifications_used: {
    layout: string;
    max_width: number;
    color_scheme: number;
    typography: string;
    email_clients: number;
  };
}

export interface TemplateDesign {
  template_id: string;
  template_name: string;
  description: string;
  target_audience: string;
  visual_concept: string;
  layout: {
    type: string;
    max_width: number;
    sections_count: number;
    visual_hierarchy: string;
    spacing_system: Record<string, string>;
  };
  sections: TemplateSection[];
  components: TemplateComponent[];
  responsive: {
    breakpoints: ResponsiveBreakpoint[];
  };
  accessibility: {
    alt_texts: string;
    color_contrast: string;
    font_sizes: string;
    link_styling: string;
  };
  email_client_optimizations: Record<string, any>;
  performance: {
    total_size_target: string;
    image_optimization: string;
    css_inlining: string;
    loading_strategy: string;
  };
  metadata?: {
    generated_at: string;
    generated_by: string;
    campaign_id: string;
    assets_used: {
      total_images: number;
      local_images: number;
      external_images: number;
      icons: number;
    };
    brand_colors: {
      primary: string;
      accent: string;
      background: string;
    };
  };
}

export interface TemplateSection {
  id: string;
  type: string;
  position: number;
  content: Record<string, any>;
  styling: Record<string, any>;
}

export interface TemplateComponent {
  id: string;
  type: string;
  styling: Record<string, any>;
  hover_effects?: Record<string, any>;
}

export interface ResponsiveBreakpoint {
  name: string;
  max_width: string;
  adjustments: Record<string, any>;
}

export interface PerformanceMetrics {
  html_size: number;
  total_assets_size: number;
  estimated_load_time: number;
  optimization_score: number;
}

export interface DesignDecisions {
  layout_strategy: string;
  color_scheme_applied: Record<string, string>;
  typography_implementation: {
    heading_font: string;
    body_font: string;
    font_sizes: Record<string, string>;
  };
  asset_optimization: Array<{
    original_path: string;
    optimized_path: string;
    optimization_type: string;
    size_reduction: number;
  }>;
  accessibility_features: string[];
  email_client_adaptations: Record<string, string>;
}

export interface PreviewFile {
  type: 'desktop' | 'mobile' | 'dark_mode';
  path: string;
  format: 'png' | 'jpg' | 'webp';
}

export interface DesignPackage {
  package_id: string;
  package_path: string;
  created_at: string;
  contents: Record<string, any>;
  quality_indicators: {
    technical_compliance: number;
    asset_optimization: number;
    accessibility_score: number;
    performance_score: number;
    email_client_compatibility: number;
  };
  readiness_status: {
    design_complete: boolean;
    assets_optimized: boolean;
    previews_generated: boolean;
    performance_analyzed: boolean;
    ready_for_quality_review: boolean;
  };
} 