/**
 * 📦 DELIVERY TYPES & INTERFACES
 * 
 * Общие типы и интерфейсы для всех delivery сервисов
 * Используется в upload-service, screenshot-service, deployment-service
 */

// Input/Output types for agent handoffs
export interface DeliverySpecialistInput {
  task_type: 'upload_assets' | 'generate_screenshots' | 'deploy_campaign' | 'visual_testing' | 'finalize_delivery' | 'monitor_performance';
  email_package: {
    html_output: string;
    mjml_source?: string;
    assets_used?: string[];
    quality_score: number;
    compliance_status: any;
  };
  deployment_config?: {
    environment: 'staging' | 'production' | 'preview' | 'test';
    rollout_strategy?: 'immediate' | 'gradual' | 'scheduled';
    validation_required?: boolean;
    auto_monitoring?: boolean;
  };
  upload_requirements?: {
    s3_bucket?: string;
    cdn_distribution?: boolean;
    compression_enabled?: boolean;
    versioning_enabled?: boolean;
  };
  testing_requirements?: {
    visual_regression?: boolean;
    performance_benchmarks?: boolean;
    cross_client_validation?: boolean;
    screenshot_comparison?: boolean;
  };
  campaign_context?: {
    campaign_id?: string;
    folder_path?: string;
    performance_session?: string;
    deployment_target?: string;
  };
  handoff_data?: any; // Data from QualitySpecialist
}

export interface DeliverySpecialistOutput {
  success: boolean;
  task_type: string;
  results: {
    upload_data?: any;
    screenshot_data?: any;
    deployment_data?: any;
    testing_data?: any;
    monitoring_data?: any;
  };
  delivery_artifacts: {
    deployment_urls?: string[];
    asset_urls?: string[];
    screenshot_urls?: string[];
    monitoring_endpoints?: string[];
    backup_locations?: string[];
  };
  deployment_status: {
    environment: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rollback';
    deployed_at?: string;
    deployment_id?: string;
    rollout_status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
    validation_status?: 'pending' | 'passed' | 'failed';
    monitoring_enabled?: boolean;
    rollback_available: boolean;
    monitoring_active: boolean;
  };
  performance_metrics: {
    deployment_time: number;
    asset_upload_time: number;
    total_file_size: number;
    cdn_propagation_time?: number;
    success_rate: number;
    task_duration_ms: number;
    processing_time_breakdown: {
      validation_ms?: number;
      upload_ms?: number;
      deployment_ms?: number;
      testing_ms?: number;
      monitoring_ms?: number;
    };
    resource_usage: {
      memory_peak_mb?: number;
      cpu_usage_percent?: number;
      network_bandwidth_mb?: number;
    };
    quality_indicators: {
      error_count: number;
      warning_count: number;
      success_rate_percent: number;
    };
  };
  recommendations: {
    next_actions?: string[];
    monitoring_suggestions?: string[];
    optimization_opportunities?: string[];
    handoff_complete: boolean;
  };
  analytics: {
    execution_time: number;
    operations_performed: number;
    data_transferred: number;
    success_rate: number;
    agent_efficiency: number;
    estimated_cost: number;
  };
  metadata: {
    agent_version: string;
    processing_timestamp: string;
    tools_used: string[];
    handoff_type?: string;
    original_request_size_kb: number;
  };
  error?: string;
}

// Service-specific result types
export interface UploadResult {
  success: boolean;
  upload_data: {
    uploaded_files: Array<{
      filename: string;
      s3_key: string;
      size_bytes: number;
      content_type: string;
      upload_duration_ms: number;
    }>;
    s3_bucket: string;
    total_size_mb: number;
    compression_ratio?: number;
  };
  performance_metrics: PerformanceMetrics;
}

export interface ScreenshotResult {
  success: boolean;
  screenshot_data: {
    generated_screenshots: Array<{
      client_name: string;
      screenshot_url: string;
      viewport_size: string;
      capture_duration_ms: number;
    }>;
    comparison_results?: Array<{
      baseline_url: string;
      current_url: string;
      diff_percentage: number;
      passed: boolean;
    }>;
  };
  performance_metrics: PerformanceMetrics;
}

export interface DeploymentResult {
  success: boolean;
  deployment_data: {
    deployment_id: string;
    environment: string;
    deployment_url: string;
    rollout_status: string;
    deployment_timestamp: string;
  };
  performance_metrics: PerformanceMetrics;
}

export interface VisualTestResult {
  success: boolean;
  testing_data: {
    test_results: Array<{
      test_name: string;
      status: 'passed' | 'failed' | 'skipped';
      score: number;
      details: string;
    }>;
    overall_score: number;
    passed_count: number;
    failed_count: number;
  };
  performance_metrics: PerformanceMetrics;
}

export interface MonitoringResult {
  success: boolean;
  monitoring_data: {
    monitoring_endpoints: string[];
    analytics_setup: any;
    performance_baseline: any;
  };
  performance_metrics: PerformanceMetrics;
}

export interface FinalizationResult {
  success: boolean;
  finalization_data: {
    archival_status: string;
    backup_locations: string[];
    completion_timestamp: string;
  };
  performance_metrics: PerformanceMetrics;
}

// Performance tracking types
export interface PerformanceMetrics {
  task_duration_ms: number;
  processing_time_breakdown: Record<string, number>;
  resource_usage: {
    memory_peak_mb?: number;
    cpu_usage_percent?: number;
    network_bandwidth_mb?: number;
  };
  quality_indicators: {
    error_count: number;
    warning_count: number;
    success_rate_percent: number;
  };
}

export interface DeliveryArtifacts {
  deployment_urls?: string[];
  asset_urls?: string[];
  screenshot_urls?: string[];
  monitoring_endpoints?: string[];
  backup_locations?: string[];
}

// Asset file structure
export interface AssetFile {
  filename: string;
  content: string | Buffer;
  size_kb: number;
  mime_type: string;
  relative_path?: string;
}

// Deployment status tracking
export type DeploymentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type ValidationStatus = 'pending' | 'passed' | 'failed';