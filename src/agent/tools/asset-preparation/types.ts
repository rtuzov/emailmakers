/**
 * Types and interfaces for Asset Manifest Generation System
 */

export interface CampaignContext {
  campaignId?: string;
  campaignPath?: string;
  taskType?: string;
  language?: string;
  campaign_type?: string;
  industry?: string;
  urgency?: string;
  target_audience?: string;
}

export interface ContentContext {
  generated_content?: {
    subject?: string;
    preheader?: string;
    body?: string;
    body_sections?: string[];
    cta_buttons?: string[];
    dates?: {
      destination?: string;
      season?: string;
      seasonal_factors?: string;
    };
    context?: {
      destination?: string;
      emotional_triggers?: string;
    };
    pricing?: {
      best_price?: number;
      currency?: string;
      route?: string;
    };
  };
  asset_requirements?: {
    hero_image?: boolean;
    content_images?: number;
    icons?: number;
    logos?: boolean;
  };
  campaign_type?: string;
  language?: string;
  target_audience?: string;
}

export interface AssetSource {
  type: 'figma' | 'local' | 'url' | 'campaign' | 'external';
  path: string;
  credentials?: Record<string, string>;
  priority?: 'primary' | 'secondary' | 'fallback';
  images?: any[];  // For external type
}

export interface AssetManifestOptions {
  analyzeContentContext?: boolean;
  collectFromSources?: boolean;
  validateAssets?: boolean;
  optimizeAssets?: boolean;
  generateUsageInstructions?: boolean;
  includePerformanceMetrics?: boolean;
  enableFallbackGeneration?: boolean;
}

export interface AIAnalysisResult {
  image_requirements: ImageRequirement[];
  destinations: DestinationInfo[];
  icons_needed: IconRequirement[];
  brand_elements: BrandElement[];
  figma_search_strategy: FigmaSearchStrategy;
}

export interface ImageRequirement {
  type: 'hero' | 'destination' | 'promotional' | 'seasonal';
  purpose: string;
  dimensions: {
    width: number;
    height: number;
  };
  priority: 'required' | 'recommended' | 'optional';
  emotional_tone: string;
  visual_style: string;
  content_context: string;
}

export interface DestinationInfo {
  name: string;
  search_keywords: string[];
}

export interface IconRequirement {
  type: 'promotional' | 'navigation' | 'social' | 'booking';
  purpose: string;
  size: number;
  style: 'filled' | 'outlined' | 'minimal';
}

export interface BrandElement {
  type: 'logo' | 'pattern' | 'decoration';
  placement: 'header' | 'footer' | 'background';
  size: {
    width: number;
    height: number;
  };
}

export interface FigmaSearchStrategy {
  primary_folders: string[];
  search_tags: string[];
  emotional_keywords: string[];
  avoid_tags: string[];
}

export interface ExternalImageSelection {
  selected_images: ExternalImage[];
  selection_reasoning: string;
}

export interface ExternalImage {
  filename: string;
  url: string;
  description: string;
  tags: string[];
  purpose: 'hero' | 'support' | 'decoration' | 'branding';
  emotional_match: string;
}

export interface AssetItem {
  filename: string;
  path: string;
  file_path?: string;  // ✅ ДОБАВЛЕНО: относительный путь для манифеста
  size: number;
  format: string;
  hash: string;
  created: string;
  modified: string;
  tags: string[];
  description: string;
  isExternal?: boolean;
  purpose?: string;
  emotionalMatch?: string;
  aiReasoning?: string;
  priority?: string;
}

export interface AssetCollectionResult {
  success: boolean;
  assets: AssetItem[];
  summary: {
    totalAssets: number;
    totalSize: number;
    formats: Record<string, number>;
    sources: Record<string, number>;
    duplicatesRemoved: number;
    errors: string[];
  };
}

export interface ValidationRules {
  file_size_limits: {
    hero_images: number;
    product_images: number;
    icons: number;
    total_email: number;
  };
  dimension_requirements: {
    min_width: number;
    max_width: number;
    min_height: number;
    max_height: number;
  };
  format_preferences: {
    primary: string[];
    fallback: string[];
    avoid: string[];
  };
  quality_thresholds: {
    compression_level: number;
    optimization_target: number;
  };
  email_client_compatibility?: Record<string, {
    max_size: number;
    formats: string[];
  }>;
}

export interface AssetValidationResult {
  success: boolean;
  validation: {
    totalAssets: number;
    validAssets: number;
    invalidAssets: number;
    rules: ValidationRules;
    aiRules: ValidationRules;
    results: ValidationItem[];
    issues: string[];
    overallCompliance: number;
  };
}

export interface ValidationItem {
  filename: string;
  path: string;
  size: number;
  format: string;
  valid: boolean;
  score: number;
  issues: string[];
}

export interface OptimizationStrategy {
  method: 'aggressive' | 'balanced' | 'conservative';
  compressionLevel: number;
  targetSize: number;
  formatRecommendation: 'keep' | 'convert_to_jpg' | 'convert_to_webp' | 'convert_to_png';
  reasoning: string;
  emailClientNotes: string[];
}

export interface AssetOptimizationResult {
  success: boolean;
  optimization: {
    processedAssets: number;
    profile: string;
    emailClients: string[];
    aiRules: ValidationRules;
    averageOptimization: number;
    totalSizeReduction: number;
    optimizedFiles: OptimizedFile[];
  };
}

export interface OptimizedFile {
  original: string;
  optimized: string;
  strategy: OptimizationStrategy;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export interface AssetUsageInstruction {
  assetId: string;
  placement: string;
  context: string;
  responsiveBehavior: string;
  emailClientNotes: string[];
  accessibilityRequirements: string;
  fallbackStrategy: string;
}

export interface PerformanceMetrics {
  totalAssets: number;
  totalSize: number;
  averageOptimization: number;
  emailClientCompatibility: number;
  accessibilityScore: number;
}

export interface ManifestGenerationResult {
  manifestId: string;
  assetManifest: any;
  assetRequirements: any[];
  usageInstructions: AssetUsageInstruction[];
  performanceMetrics: PerformanceMetrics;
  recommendations: string[];
  generationSummary: {
    timestamp: string;
    processingTime: number;
    sourcesProcessed: number;
    assetsCollected: number;
    assetsValidated: number;
    assetsOptimized: number;
    errors: string[];
  };
}

export interface AIRequestConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}

export const DEFAULT_AI_CONFIG: AIRequestConfig = {
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  system_prompt: process.env.AI_SYSTEM_PROMPT || 'You are an expert in email marketing and visual asset curation.'
}; 