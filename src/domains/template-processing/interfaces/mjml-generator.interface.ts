/**
 * 📧 MJML Generator Interfaces
 * 
 * Core interfaces for MJML template generation following DDD principles
 * - Clean separation of concerns
 * - Type safety for all operations
 * - No fallback mechanisms (fail-fast approach)
 */

export interface IMjmlGenerator {
  /**
   * Generate MJML template from content and design requirements
   */
  generate(request: MjmlGenerationRequest): Promise<MjmlGenerationResult>;
  
  /**
   * Validate MJML generation parameters
   */
  validateRequest(request: MjmlGenerationRequest): ValidationResult;
}

export interface ITemplateRenderer {
  /**
   * Render MJML to HTML
   */
  render(mjmlContent: string, options?: RenderingOptions): Promise<RenderingResult>;
  
  /**
   * Batch render multiple MJML templates
   */
  renderBatch(requests: BatchRenderRequest[]): Promise<BatchRenderResult>;
}

export interface ITemplateValidator {
  /**
   * Validate MJML structure and content
   */
  validateMjml(mjmlContent: string): ValidationResult;
  
  /**
   * Validate generated HTML against email client compatibility
   */
  validateHtml(htmlContent: string, targetClients: EmailClient[]): ValidationResult;
}

export interface ITemplateCache {
  /**
   * Get cached compiled template
   */
  get(key: string): Promise<CachedTemplate | null>;
  
  /**
   * Store compiled template in cache
   */
  set(key: string, template: CachedTemplate, ttl?: number): Promise<void>;
  
  /**
   * Clear cache for specific key or all
   */
  clear(key?: string): Promise<void>;
}

// Core data structures
export interface MjmlGenerationRequest {
  contentContext: ContentContext;
  designRequirements: DesignRequirements;
  assetManifest: AssetManifest;
  templateDesign: TemplateDesign;
  traceId?: string;
}

export interface ContentContext {
  campaign: {
    id: string;
    type: CampaignType;
    destination: string;
  };
  subject: string;
  preheader: string;
  body: StructuredContent;
  emotional_hooks: EmotionalHooks;
  personalization: PersonalizationData;
  call_to_action: CallToActionData;
  pricing?: PricingData;
}

export interface StructuredContent {
  opening: string;
  main_content: string;
  benefits: string[];
  social_proof: string;
  urgency_elements: string;
  closing: string;
}

export interface DesignRequirements {
  colors: ColorScheme;
  layout: LayoutConfiguration;
  typography: TypographyConfiguration;
  email_clients: EmailClient[];
  responsive: boolean;
  dark_mode: boolean;
}

export interface ColorScheme {
  primary: string;
  accent: string;
  background: string;
  text: string;
  surface?: string;
}

export interface LayoutConfiguration {
  maxWidth: number;
  spacing: SpacingSystem;
  structure: LayoutStructure;
}

export interface TypographyConfiguration {
  headingFont: string;
  bodyFont: string;
  fontSizes: FontSizeScale;
  fontWeights: FontWeightScale;
}

export interface AssetManifest {
  images: ImageAsset[];
  icons?: IconAsset[];
  fonts?: FontAsset[];
}

export interface ImageAsset {
  url: string;
  alt_text: string;
  usage: ImageUsage;
  isExternal: boolean;
  description?: string;
}

export interface TemplateDesign {
  template_name: string;
  layout: {
    type: LayoutType;
    max_width: number;
    spacing_system: SpacingSystem;
  };
  sections: TemplateSection[];
  components: TemplateComponent[];
  visual_concept: string;
  target_audience: string;
  metadata: {
    campaign_type: CampaignType;
    brand_colors: ColorScheme;
  };
}

export interface TemplateSection {
  position: SectionPosition;
  background?: {
    type: BackgroundType;
    color?: string;
    path?: string;
  };
  content: {
    text: string;
    font?: FontConfiguration;
    items?: string[];
    buttons?: ButtonConfiguration[];
    images?: string[];
  };
}

// Results and responses
export interface MjmlGenerationResult {
  mjmlContent: string;
  metadata: GenerationMetadata;
  validation: ValidationResult;
  performance: PerformanceMetrics;
}

export interface RenderingResult {
  html: string;
  css?: string;
  fileSize: number;
  renderTime: number;
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  location?: string;
  suggestedFix?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
  recommendation?: string;
}

export interface PerformanceMetrics {
  generationTime: number;
  templateSize: number;
  complexityScore: number;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  memoryMB: number;
  cpuTime: number;
  cacheHits: number;
  cacheMisses: number;
}

// Enums and types
export type CampaignType = 'promotional' | 'newsletter' | 'luxury' | 'transactional';
export type EmailClient = 'gmail' | 'outlook' | 'outlook-web' | 'apple-mail' | 'yahoo-mail' | 'thunderbird';
export type LayoutType = 'minimal' | 'content-heavy' | 'cta-focused' | 'luxury-visual' | 'gallery-focused';
export type SectionPosition = 'header' | 'hero' | 'content1' | 'gallery' | 'benefits' | 'social_proof' | 'urgency' | 'cta' | 'footer';
export type BackgroundType = 'color' | 'image' | 'gradient';
export type ImageUsage = 'hero' | 'gallery' | 'icon' | 'background' | 'decorative';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Additional supporting interfaces
export interface EmotionalHooks {
  desire?: string;
  fear_of_missing_out?: string;
  aspiration?: string;
}

export interface PersonalizationData {
  greeting?: string;
  recommendations?: string;
}

export interface CallToActionData {
  primary: {
    text: string;
    url: string;
  };
  secondary?: {
    text: string;
    url: string;
  };
  urgency_cta?: {
    text: string;
    url: string;
  };
}

export interface PricingData {
  best_price?: string;
  currency?: string;
  optimal_dates_pricing?: {
    average_on_optimal?: string;
  };
  price_insights?: {
    cheapest_optimal_date?: string;
  };
  comprehensive_pricing?: {
    total_offers_found?: number;
    best_price_overall?: string;
    worst_price_overall?: string;
  };
}

export interface SpacingSystem {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface LayoutStructure {
  sections: string[];
  columns: number;
  responsive_breakpoints: number[];
}

export interface FontSizeScale {
  small: string;
  medium: string;
  large: string;
  xlarge: string;
  h1: string;
  h2: string;
  h3: string;
  body: string;
}

export interface FontWeightScale {
  normal: number;
  bold: number;
  light?: number;
  medium?: number;
}

export interface IconAsset {
  name: string;
  url: string;
  usage: string;
}

export interface FontAsset {
  family: string;
  weights: number[];
  fallbacks: string[];
  usage: 'heading' | 'body';
}

export interface FontConfiguration {
  size?: string;
  weight?: string;
  color?: string;
  family?: string;
}

export interface ButtonConfiguration {
  text: string;
  link: string;
  font?: FontConfiguration;
  style?: string;
}

export interface TemplateComponent {
  id: string;
  type: string;
  styling?: { [key: string]: any };
}

export interface GenerationMetadata {
  templateId: string;
  generatedAt: Date;
  version: string;
  layoutType: LayoutType;
  sectionsCount: number;
  assetsUsed: number;
}

export interface RenderingOptions {
  minify?: boolean;
  validation_level?: 'soft' | 'strict';
  keep_comments?: boolean;
  target_clients?: EmailClient[];
}

export interface BatchRenderRequest {
  id: string;
  mjmlContent: string;
  options?: RenderingOptions;
}

export interface BatchRenderResult {
  results: Array<{
    id: string;
    result: RenderingResult;
    error?: string;
  }>;
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
}

export interface CachedTemplate {
  key: string;
  mjmlContent: string;
  htmlContent: string;
  compiledAt: Date;
  metadata: GenerationMetadata;
} 