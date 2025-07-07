/**
 * 🔍 QUALITY SPECIALIST TYPES
 * 
 * Comprehensive TypeScript interfaces for Quality Specialist Agent
 * - Input/Output types for agent handoffs
 * - Task-specific configurations
 * - Email package structures
 * - Quality requirements and criteria
 */

// Core task types
export type QualityTaskType = 
  | 'analyze_quality' 
  | 'test_rendering' 
  | 'validate_compliance' 
  | 'optimize_performance' 
  | 'comprehensive_audit' 
  | 'ai_consultation'
  | 'validate_multi_destination_content';

// Quality focus areas
export type QualityFocusArea = 
  | 'performance' 
  | 'accessibility' 
  | 'compatibility' 
  | 'content' 
  | 'technical';

// Compliance levels
export type ComplianceLevel = 'WCAG_AA' | 'WCAG_A' | 'basic';

// Compliance status
export type ComplianceStatus = 'pass' | 'fail' | 'warning';

// Issue severity levels
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';

// Email package structure (updated for ML-scoring compatibility)
export interface EmailPackage {
  html_output: string;
  html_content?: string; // Added for ML-scoring compatibility
  mjml_source?: string;
  assets_used?: any[];
  rendering_metadata?: any;
  subject?: string;
  preheader?: string;
  assets?: string[];
}

// Quality requirements configuration
export interface QualityRequirements {
  html_validation: boolean;
  email_client_compatibility: number; // Minimum percentage
  accessibility_compliance: ComplianceLevel;
  performance_targets: {
    load_time: number; // Max milliseconds
    file_size: number; // Max bytes
  };
  visual_consistency: boolean;
  mobile_optimization: boolean;
}

// AI consultation requirements
export interface AIConsultationRequirements {
  target_score?: number;
  priority_focus?: QualityFocusArea;
  enable_auto_execution?: boolean;
  max_iterations?: number;
  iteration_count?: number;
  previous_analysis?: any;
}

// Testing criteria configuration
export interface TestingCriteria {
  client_tests: string[];
  device_tests: string[];
  functionality_tests: string[];
  performance_tests: string[];
  accessibility_tests: string[];
}

// Compliance standards configuration
export interface ComplianceStandards {
  email_standards: boolean;
  security_requirements: boolean;
  privacy_compliance: boolean;
  brand_guidelines: boolean;
}

// Optimization goals configuration
export interface OptimizationGoals {
  target_metrics: string[];
  priority_focus: QualityFocusArea;
  automated_fixes: boolean;
}

// Main input interface for Quality Specialist Agent (updated for ML-scoring)
export interface QualitySpecialistInput {
  task_type: QualityTaskType;
  email_package: EmailPackage;
  quality_requirements?: QualityRequirements;
  ai_consultation_requirements?: AIConsultationRequirements;
  testing_criteria?: TestingCriteria;
  compliance_standards?: ComplianceStandards;
  optimization_goals?: OptimizationGoals;
  multi_destination_validation_criteria?: MultiDestinationValidationCriteria;
  multi_destination_context?: any; // Multi-destination campaign data
  handoff_data?: any; // Data from DesignSpecialist
  brand_guidelines?: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    brand_voice: string;
  };
  design_tokens?: { // Added for ML-scoring compatibility
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
    spacing?: Record<string, string>;
  };
}

// Quality issue structure
export interface QualityIssue {
  severity: IssueSeverity;
  category: string;
  description: string;
  fix_suggestion: string;
  auto_fixable: boolean;
}

// Quality report structure
export interface QualityReport {
  overall_score: number;
  category_scores: {
    technical: number;
    content: number;
    accessibility: number;
    performance: number;
    compatibility: number;
  };
  issues_found: QualityIssue[];
  passed_checks: string[];
  recommendations: string[];
}

// Compliance status structure
export interface ComplianceStatusReport {
  email_standards: ComplianceStatus;
  accessibility: ComplianceStatus;
  performance: ComplianceStatus;
  security: ComplianceStatus;
  overall_compliance: ComplianceStatus;
}

// Analytics data structure (updated for ML-scoring)
export interface QualityAnalytics {
  execution_time?: number;
  tests_performed?: number;
  issues_detected?: number;
  fixes_applied?: number;
  confidence_score?: number;
  agent_efficiency?: number;
  // ML-scoring specific fields
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  processing_time_ms: number;
  ml_score: number;
  ml_issues: any[];
  ml_recommendations: string[];
}

// Multi-destination validation configuration
export interface MultiDestinationValidationCriteria {
  max_email_size_kb?: number;
  required_image_formats?: string[];
  min_image_resolution?: { width: number; height: number };
  seasonal_date_validation?: boolean;
  destination_consistency_check?: boolean;
  layout_responsive_validation?: boolean;
}

// Multi-destination validation results
export interface MultiDestinationValidationResults {
  email_size_validation: {
    passed: boolean;
    current_size_kb: number;
    max_allowed_kb: number;
    optimization_suggestions?: string[];
  };
  image_validation: {
    passed: boolean;
    total_images: number;
    invalid_formats: string[];
    low_resolution_images: string[];
    oversized_images: string[];
    suggestions?: string[];
  };
  date_validation: {
    passed: boolean;
    seasonal_consistency: boolean;
    optimal_timing: boolean;
    date_conflicts: string[];
    recommendations?: string[];
  };
  destination_validation: {
    passed: boolean;
    geographic_consistency: boolean;
    pricing_consistency: boolean;
    content_relevance_score: number;
    inconsistencies?: string[];
  };
  layout_validation: {
    passed: boolean;
    responsive_compatibility: boolean;
    template_suitability: boolean;
    layout_issues?: string[];
    mobile_optimization_score: number;
  };
  overall_validation: {
    passed: boolean;
    confidence_score: number;
    critical_issues: string[];
    warnings: string[];
    recommendations: string[];
  };
}

// Task results structure (updated for ML-scoring)
export interface TaskResults {
  status: 'completed' | 'failed' | 'in_progress';
  quality_score: number;
  validation_passed: boolean;
  recommendations: QualityRecommendations;
  analytics: QualityAnalytics;
  processing_time_ms: number;
  timestamp: string;
  // Optional legacy fields
  quality_data?: any;
  testing_data?: any;
  validation_data?: any;
  optimization_data?: any;
  audit_data?: any;
  consultation_data?: any;
  detailed_check?: any;
  multi_destination_validation?: MultiDestinationValidationResults;
  ml_quality_report?: any;
  validation_result?: any;
  error?: string;
}

// Quality recommendations structure (updated for ML-scoring)
export interface QualityRecommendations {
  next_agent?: 'delivery_specialist';
  next_actions?: string[];
  critical_fixes?: string[];
  critical_issues?: string[]; // Added for ML-scoring compatibility
  improvements?: string[]; // Added for ML-scoring compatibility
  handoff_data?: any;
  ml_recommendations?: string[];
}

// Quality specialist output structure
export interface QualitySpecialistOutput {
  success: boolean;
  task_type: string;
  results: TaskResults;
  quality_report: QualityReport;
  compliance_status: ComplianceStatusReport;
  recommendations: QualityRecommendations;
  analytics: QualityAnalytics;
  error?: string;
}

// Quality service context structure
export interface QualityServiceContext {
  traceId: string;
  startTime: number;
  taskType: QualityTaskType;
  input: QualitySpecialistInput;
}

// Tool execution result structure
export interface ToolExecutionResult {
  success: boolean;
  data: any;
  error?: string;
  execution_time: number;
}

// Performance metrics structure
export interface PerformanceMetrics {
  averageExecutionTime: number;
  successRate: number;
  toolUsageStats: Map<string, number>;
  totalExecutions: number;
  totalSuccesses: number;
  validationSuccessRate: number;
  correctionAttempts: number;
}

// Agent capabilities structure
export interface AgentCapabilities {
  agent_id: string;
  specialization: string;
  tools: string[];
  handoff_support: boolean;
  workflow_stage: string;
  previous_agents: string[];
  next_agents: string[];
  performance_metrics: PerformanceMetrics;
} 