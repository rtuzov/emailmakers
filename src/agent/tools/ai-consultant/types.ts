/**
 * Phase 13: T11 AI Quality Consultant - TypeScript Interfaces
 * 
 * Comprehensive type definitions for intelligent quality analysis and improvement system
 */

import { getValidatedUsageModel } from '../../../shared/utils/model-config';

// ================================
// CORE INTERFACES
// ================================

/**
 * Quality dimension types for analysis
 */
export type QualityDimension = 
  | 'content_quality' 
  | 'visual_appeal' 
  | 'technical_compliance' 
  | 'emotional_resonance' 
  | 'brand_alignment';

/**
 * Quality recommendation with automated execution capability
 */
export interface QualityRecommendation {
  id: string;
  type: 'visual' | 'content' | 'technical' | 'accessibility' | 'emotional';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'auto_execute' | 'manual_approval' | 'critical_review';
  
  // Description and reasoning
  title: string;
  description: string;
  reasoning: string;
  problem_details: string;
  
  // Agent execution
  agent_command: AgentCommand;
  auto_execute: boolean;
  requires_approval: boolean;
  
  // Impact estimation
  estimated_improvement: number; // Expected score increase (0-50)
  confidence: number; // AI confidence in recommendation (0-1)
  execution_complexity: 'simple' | 'moderate' | 'complex';
  estimated_time: number; // Execution time in seconds
}

/**
 * Agent command for automated execution
 */
export interface AgentCommand {
  tool: string;
  parameters: Record<string, any>;
  expected_result: string;
  success_criteria: string[];
  fallback_strategy?: AgentCommand;
  max_retries: number;
  timeout: number; // seconds
}

/**
 * Comprehensive quality analysis result
 */
export interface QualityAnalysisResult {
  // Overall assessment
  overall_score: number; // 0-100
  quality_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  quality_gate_passed: boolean;
  
  // Dimensional scores
  dimension_scores: {
    content_quality: number;      // Clarity, persuasiveness, tone match
    visual_appeal: number;        // Design, colors, layout, images
    technical_compliance: number; // Email client compatibility, accessibility
    emotional_resonance: number;  // Engagement, emotional triggers, CTA
    brand_alignment: number;      // Brand guidelines compliance
  };
  
  // Recommendations and actions
  recommendations: QualityRecommendation[];
  auto_executable_count: number;
  manual_approval_count: number;
  critical_issues_count: number;
  
  // Improvement potential
  improvement_potential: number; // 0-100, potential score after improvements
  estimated_final_score: number;
  max_achievable_score: number;
  
  // Analysis metadata
  analysis_time: number;
  confidence_level: number;
  analyzed_elements: AnalyzedElement[];
  
  // Score tracking
  score_impact?: number; // Score change from executed improvements
  
  // Individual dimension scores (for backward compatibility)
  content_quality_score?: number;
  visual_design_score?: number;
  technical_compliance_score?: number;
  emotional_resonance_score?: number;
  brand_alignment_score?: number;
  overall_quality_score?: number;
  
  // Insights by dimension
  content_insights?: string[];
  visual_insights?: string[];
  technical_insights?: string[];
  emotional_insights?: string[];
  brand_insights?: string[];
  
  // Recommendations by dimension  
  content_recommendations?: string[];
  visual_recommendations?: string[];
  technical_recommendations?: string[];
  emotional_recommendations?: string[];
  brand_recommendations?: string[];
  improvement_recommendations?: string[];
  
  // Additional properties
  quality_issues?: string[];
  passed_checks?: string[];
  confidence_score?: number;
  execution_time_ms?: number;
}

/**
 * Individual analyzed element
 */
export interface AnalyzedElement {
  type: 'html' | 'image' | 'text' | 'style' | 'structure';
  element_id: string;
  description: string;
  issues: string[];
  score: number;
  recommendations: string[];
  element?: any; // HTML element or element data
}

// ================================
// AI CONSULTANT INTERFACES
// ================================

/**
 * Quality analysis request interface
 */
export interface QualityAnalysisRequest {
  html_content: string;
  mjml_source?: string;
  topic: string;
  target_audience?: string;
  campaign_type?: string;
  screenshots?: {
    desktop?: string;
    mobile?: string;
    tablet?: string;
  };
  assets_info?: any;
  render_results?: any;
  pricing_info?: any;
  quality_requirements?: any;
}

/**
 * AI Quality Consultant request interface
 */
export interface AIConsultantRequest {
  // Email content
  html_content: string;
  mjml_source?: string;
  topic: string;
  target_audience?: string;
  campaign_type?: string;
  
  // Скриншоты для визуального анализа
  screenshots?: {
    desktop?: string;
    mobile?: string;
    tablet?: string;
  };

  // Context data
  assets_used?: any;
  assets_info?: any;
  prices?: any;
  pricing_info?: any;
  content_metadata?: any;
  render_test_results?: any;
  render_results?: any;

  // Session management
  session_id?: string;
  user_id?: string;
  iteration_count?: number;
  improvement_history?: ImprovementIteration[];
  previous_analysis?: QualityAnalysisResult;
  
  // User interaction
  user_approvals?: Record<string, boolean>;
  approval_callback?: (command: AgentCommand) => Promise<boolean>;
  progress_callback?: (status: ExecutionStatus, progress: number) => void;
}

/**
 * AI Consultant response
 */
export interface AIConsultantResponse {
  analysis: QualityAnalysisResult;
  execution_plan: ExecutionPlan;
  next_actions: NextAction[];
  should_continue: boolean;
  completion_reason?: string;
  execution_results?: ExecutionResult[];
}

/**
 * Execution plan for improvements
 */
export interface ExecutionPlan {
  total_recommendations: number;
  auto_execute_actions: AgentCommand[];
  manual_approval_actions: AgentCommand[];
  critical_review_actions: AgentCommand[];
  estimated_total_time: number;
  execution_order: string[]; // recommendation IDs in execution order
}

/**
 * Next action for the agent or user
 */
export interface NextAction {
  type: 'auto_execute' | 'request_approval' | 'escalate' | 'complete';
  description: string;
  command?: AgentCommand;
  approval_required?: boolean;
  escalation_reason?: string;
}

// ================================
// IMPROVEMENT TRACKING
// ================================

/**
 * Single improvement iteration result
 */
export interface ImprovementIteration {
  iteration_number: number;
  timestamp: Date;
  initial_score: number;
  final_score: number;
  score_improvement: number;
  recommendations_applied: string[];
  execution_results: ExecutionResult[];
  total_time: number;
  success: boolean;
  error_message?: string;
  consultant_response?: AIConsultantResponse;
}

/**
 * Execution result for a single recommendation
 */
export interface ExecutionResult {
  recommendation_id: string;
  command: AgentCommand;
  execution_time: number;
  success: boolean;
  result: any;
  error_message?: string;
  score_impact: number; // actual score change
}

// ================================
// CONFIGURATION
// ================================

/**
 * AI Consultant configuration
 */
export interface AIConsultantConfig {
  // Quality thresholds
  quality_gate_threshold: number; // Default: 70
  auto_execute_threshold: number; // Default: 80 (confidence threshold for auto-execution)
  critical_issue_threshold: number; // Default: 30 (score below which issues are critical)
  
  // Execution limits
  max_iterations: number; // Default: 3
  max_auto_execute_per_iteration: number; // Default: 5
  max_total_execution_time: number; // Default: 300 seconds
  
  // AI model configuration
  ai_model: 'gpt-4o-mini';
  analysis_temperature: number; // Default: 0.3 (more deterministic)
  max_recommendations: number; // Default: 10
  
  // Feature flags
  enable_auto_execution: boolean;
  enable_image_analysis: boolean;
  enable_brand_compliance: boolean;
  enable_accessibility_checks: boolean;
  
  // Logging and monitoring
  log_level: 'debug' | 'info' | 'warn' | 'error';
  enable_analytics: boolean;
  analytics_endpoint?: string;
  enable_progress_tracking?: boolean;
  max_tokens?: number;
}

// ================================
// ERROR HANDLING
// ================================

/**
 * AI Consultant error types
 */
export class AIConsultantError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AIConsultantError';
  }
}

export type AIConsultantErrorCode = 
  | 'ANALYSIS_FAILED'
  | 'RECOMMENDATION_GENERATION_FAILED'
  | 'AGENT_COMMAND_FAILED'
  | 'EXECUTION_TIMEOUT'
  | 'MAX_ITERATIONS_EXCEEDED'
  | 'CRITICAL_ISSUE_DETECTED'
  | 'INVALID_REQUEST'
  | 'AI_API_ERROR';

// ================================
// UTILITY TYPES
// ================================

/**
 * Quality improvement status
 */
export type ImprovementStatus = 
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'requires_approval'
  | 'escalated';

/**
 * Recommendation execution status
 */
export type ExecutionStatus = 
  | 'pending'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'requires_approval';

// QualityDimension already defined above

// ================================
// DEFAULT CONFIGURATIONS
// ================================

/**
 * Default AI Consultant configuration
 */
export const DEFAULT_AI_CONSULTANT_CONFIG: AIConsultantConfig = {
  // Quality thresholds
  quality_gate_threshold: 70,
  auto_execute_threshold: 0.8,
  critical_issue_threshold: 30,
  
  // Execution limits
  max_iterations: 3,
  max_auto_execute_per_iteration: 5,
  max_total_execution_time: 300,
  
  // AI model configuration
  ai_model: getValidatedUsageModel(),
  analysis_temperature: 0.3,
  max_recommendations: 10,
  
  // Feature flags
  enable_auto_execution: true,
  enable_image_analysis: true,
  enable_brand_compliance: true,
  enable_accessibility_checks: true,
  
  // Logging and monitoring
  log_level: 'info',
  enable_analytics: true
};

/**
 * Quality scoring weights for dimensions
 */
export const QUALITY_DIMENSION_WEIGHTS = {
  content_quality: 0.25,      // 25%
  visual_appeal: 0.20,        // 20%
  technical_compliance: 0.20, // 20%
  emotional_resonance: 0.20,  // 20%
  brand_alignment: 0.15       // 15%
} as const;

/**
 * Auto-execution safety rules
 */
export const AUTO_EXECUTION_RULES = {
  // Always safe to auto-execute
  safe_operations: [
    'fix_color_compliance',
    'add_alt_text',
    'fix_font_family',
    'optimize_spacing',
    'add_accessibility_attributes'
  ],
  
  // Require approval
  approval_required: [
    'replace_images',
    'rewrite_content',
    'change_structure',
    'modify_cta',
    'change_subject_line'
  ],
  
  // Never auto-execute (escalate to human)
  escalation_required: [
    'fundamental_restructure',
    'brand_violation_major',
    'legal_compliance_issue',
    'technical_rendering_failure'
  ]
} as const; 