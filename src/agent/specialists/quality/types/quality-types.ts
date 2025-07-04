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
  | 'ai_consultation';

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

// Email package structure
export interface EmailPackage {
  html_output: string;
  mjml_source?: string;
  assets_used?: any[];
  rendering_metadata?: any;
  subject?: string;
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

// Main input interface for Quality Specialist Agent
export interface QualitySpecialistInput {
  task_type: QualityTaskType;
  email_package: EmailPackage;
  quality_requirements?: QualityRequirements;
  ai_consultation_requirements?: AIConsultationRequirements;
  testing_criteria?: TestingCriteria;
  compliance_standards?: ComplianceStandards;
  optimization_goals?: OptimizationGoals;
  handoff_data?: any; // Data from DesignSpecialist
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

// Analytics data structure
export interface QualityAnalytics {
  execution_time: number;
  tests_performed: number;
  issues_detected: number;
  fixes_applied: number;
  confidence_score: number;
  agent_efficiency: number;
}

// Task results structure
export interface TaskResults {
  quality_data?: any;
  testing_data?: any;
  validation_data?: any;
  optimization_data?: any;
  audit_data?: any;
  consultation_data?: any;
  detailed_check?: any;
}

// Recommendations structure
export interface QualityRecommendations {
  next_agent?: 'delivery_specialist';
  next_actions?: string[];
  critical_fixes?: string[];
  handoff_data?: any;
}

// Main output interface for Quality Specialist Agent
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

// Service execution context
export interface QualityServiceContext {
  traceId: string;
  startTime: number;
  taskType: QualityTaskType;
  input: QualitySpecialistInput;
}

// Tool execution result
export interface ToolExecutionResult {
  success: boolean;
  data: any;
  error?: string;
  execution_time: number;
}

// Performance metrics tracking
export interface PerformanceMetrics {
  averageExecutionTime: number;
  successRate: number;
  toolUsageStats: Map<string, number>;
  totalExecutions: number;
  totalSuccesses: number;
  validationSuccessRate: number;
  correctionAttempts: number;
}

// Agent capabilities
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