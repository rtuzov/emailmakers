/**
 * T11 Quality Validation Module - Core Types & Interfaces
 * 
 * Comprehensive quality validation system for Email-Makers
 * Integrates with T1-T10 workflow, positioned between T8 (render_test) and T9 (upload_s3)
 */

import { EmailGenerationRequest } from '../../types';

// ========================================
// CORE VALIDATION INTERFACES
// ========================================

/**
 * Main quality validation request interface
 * Receives data from previous T1-T8 tools in the pipeline
 */
export interface QualityValidationRequest {
  html_content: string;                           // From T4 render_mjml
  mjml_source: string;                            // From T4 render_mjml  
  topic: string;                                  // From original request
  assets_used: EnhancedAssetValidation;           // From T1 + T10 (if executed)
  campaign_metadata: CampaignMetadata;            // From T2 get_prices + T3 generate_copy
  original_request: EmailGenerationRequest;       // Original user request
  render_test_results?: RenderTestResults;        // From T8 render_test (optional)
}

/**
 * Enhanced asset validation supporting T10 sprite integration
 */
export interface EnhancedAssetValidation {
  original_assets: string[];                      // From T1 get_figma_assets
  processed_assets: string[];                     // From T10 split_figma_sprite (if executed)
  sprite_metadata?: {
    original_sprite: string;
    split_components: SpriteComponent[];
    classification_confidence: number;
    processing_time: number;
  };
}

/**
 * Sprite component from T10 processing
 */
export interface SpriteComponent {
  path: string;
  classification: 'color' | 'mono' | 'logo';
  confidence: number;
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
}

/**
 * Campaign metadata from T2 + T3
 */
export interface CampaignMetadata {
  prices?: {
    origin: string;
    destination: string;
    cheapest_price: number;
    currency: string;
    date_range: string;
  };
  content?: {
    subject: string;
    tone: string;
    language: string;
    word_count: number;
  };
  generation_time: number;
}

/**
 * Render test results from T8 (optional)
 */
export interface RenderTestResults {
  overall_score: number;
  client_compatibility: Record<string, number>;
  issues_found: string[];
}

// ========================================
// VALIDATION RESPONSE INTERFACES
// ========================================

/**
 * Main quality validation response
 */
export interface QualityValidationResponse {
  overall_score: number;                          // 0-100 weighted score
  quality_gate_passed: boolean;                   // true if score >= 70
  
  // Individual validation results
  logic_validation: LogicValidationResult;
  visual_validation: VisualValidationResult;
  image_analysis: ImageAnalysisResult;
  coherence_validation: CoherenceValidationResult;
  
  // Summary
  critical_issues: string[];                      // Issues that block upload
  recommendations: string[];                      // Suggestions for improvement
  validation_time: number;                        // Time taken in milliseconds
}

// ========================================
// INDIVIDUAL VALIDATOR RESULTS
// ========================================

/**
 * Logic Validator Results (30% weight)
 * Validates data accuracy and business logic
 */
export interface LogicValidationResult {
  score: number;                                  // 0-100
  passed: boolean;                                // score >= 70
  
  checks: {
    price_realism: ValidationCheck;               // Are prices realistic?
    date_consistency: ValidationCheck;            // Are dates logical?
    route_accuracy: ValidationCheck;              // Do routes exist?
    data_completeness: ValidationCheck;           // All required data present?
  };
  
  issues: string[];
  recommendations: string[];
}

/**
 * Visual Validator Results (25% weight)
 * Validates brand compliance and design quality
 */
export interface VisualValidationResult {
  score: number;                                  // 0-100
  passed: boolean;                                // score >= 70
  
  checks: {
    brand_compliance: ValidationCheck;            // Kupibilet brand guidelines
    accessibility: ValidationCheck;               // WCAG AA compliance
    email_compatibility: ValidationCheck;         // Email client support
    layout_quality: ValidationCheck;              // Design quality assessment
  };
  
  issues: string[];
  recommendations: string[];
}

/**
 * Image Analysis Results (20% weight)
 * AI-powered image content analysis using OpenAI Vision
 */
export interface ImageAnalysisResult {
  score: number;                                  // 0-100
  passed: boolean;                                // score >= 70
  
  images_analyzed: ImageAnalysis[];
  
  checks: {
    content_recognition: ValidationCheck;         // What's in the images?
    emotional_tone: ValidationCheck;              // Emotional appropriateness
    topic_relevance: ValidationCheck;             // Relevance to email topic
    quality_assessment: ValidationCheck;          // Image quality and clarity
  };
  
  issues: string[];
  recommendations: string[];
}

/**
 * Individual image analysis from OpenAI Vision
 */
export interface ImageAnalysis {
  image_path: string;
  description: string;                            // AI-generated description
  emotional_tone: 'positive' | 'neutral' | 'negative';
  relevance_score: number;                        // 0-100 relevance to topic
  quality_score: number;                          // 0-100 image quality
  detected_objects: string[];                     // Objects detected in image
  ai_confidence: number;                          // OpenAI Vision confidence
}

/**
 * Coherence Validation Results (25% weight)
 * Text-image semantic alignment analysis
 */
export interface CoherenceValidationResult {
  score: number;                                  // 0-100
  passed: boolean;                                // score >= 70
  
  checks: {
    semantic_alignment: ValidationCheck;          // Text-image alignment
    thematic_consistency: ValidationCheck;        // Theme consistency
    emotional_coherence: ValidationCheck;         // Emotional alignment
    cta_alignment: ValidationCheck;               // CTA matches message
  };
  
  coherence_analysis: {
    text_themes: string[];                        // Extracted themes from text
    image_themes: string[];                       // Extracted themes from images
    alignment_score: number;                      // 0-100 alignment score
    mismatches: string[];                         // Identified mismatches
  };
  
  issues: string[];
  recommendations: string[];
}

// ========================================
// SHARED VALIDATION TYPES
// ========================================

/**
 * Individual validation check result
 */
export interface ValidationCheck {
  passed: boolean;
  score: number;                                  // 0-100
  message: string;
  details?: Record<string, any>;
}

/**
 * Quality scoring weights configuration
 */
export const QUALITY_SCORING_WEIGHTS = {
  logic: 0.30,                                    // 30% - Critical for functionality
  visual: 0.25,                                   // 25% - Important for brand
  image: 0.20,                                    // 20% - Significant for engagement
  coherence: 0.25                                 // 25% - Essential for UX
} as const;

/**
 * Quality gate threshold
 */
export const QUALITY_GATE_THRESHOLD = 70;

// ========================================
// ERROR TYPES
// ========================================

/**
 * Quality validation specific errors
 */
export class QualityValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'QualityValidationError';
  }
}

/**
 * OpenAI Vision API specific errors
 */
export class VisionAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'VisionAPIError';
  }
}

// ========================================
// CONFIGURATION TYPES
// ========================================

/**
 * Validator configuration
 */
export interface ValidatorConfig {
  openai_api_key: string;
  vision_model: string;                           // e.g., 'gpt-4-vision-preview'
  max_image_size: number;                         // Max image size for analysis
  cache_ttl: number;                              // Cache time-to-live in seconds
  parallel_execution: boolean;                    // Run validators in parallel
  timeout: number;                                // Validation timeout in ms
}

/**
 * Brand guidelines for visual validation
 */
export interface BrandGuidelines {
  colors: {
    primary: string[];                            // Kupibilet primary colors
    secondary: string[];                          // Secondary colors
    accent: string[];                             // Accent colors
  };
  fonts: {
    primary: string[];                            // Primary font families
    fallback: string[];                           // Fallback fonts
  };
  logos: {
    required_elements: string[];                  // Required logo elements
    prohibited_elements: string[];                // Prohibited elements
  };
}

/**
 * Accessibility standards configuration
 */
export interface AccessibilityConfig {
  contrast_ratio_aa: number;                      // WCAG AA contrast ratio (4.5:1)
  contrast_ratio_aaa: number;                     // WCAG AAA contrast ratio (7:1)
  required_alt_text: boolean;                     // Alt text required for images
  max_line_length: number;                        // Maximum line length for readability
}

/**
 * Email client compatibility requirements
 */
export interface EmailCompatibilityConfig {
  supported_clients: string[];                    // Supported email clients
  required_fallbacks: string[];                   // Required fallback elements
  max_html_size: number;                          // Maximum HTML size (100KB)
  inline_css_required: boolean;                   // CSS must be inline
} 