export interface WorkflowExecutionInput {
  workflow_id: string;
  campaign_brief: {
    topic: string;
    campaign_type?: 'promotional' | 'informational' | 'seasonal' | 'urgent' | 'newsletter';
    target_audience?: string;
    destination?: string;
    origin?: string;
  };
  execution_config?: {
    skip_agents?: ('content' | 'design' | 'quality' | 'delivery')[];
    retry_policy?: {
      max_retries: number;
      retry_delay_ms: number;
      retry_on_failure: boolean;
    };
    quality_requirements?: {
      minimum_score: number;
      require_compliance: boolean;
      auto_fix_issues: boolean;
    };
    deployment_config?: {
      environment: 'staging' | 'production' | 'preview' | 'test';
      auto_deploy: boolean;
      monitoring_enabled: boolean;
    };
  };
  handoff_context?: any;
}

export interface WorkflowExecutionOutput {
  success: boolean;
  workflow_id: string;
  execution_summary: {
    agents_executed: string[];
    total_execution_time: number;
    overall_confidence: number;
    quality_score: number;
    issues_found: number;
    issues_resolved: number;
  };
  agent_results: any;
  final_artifacts: any;
  handoff_analytics: any;
  recommendations: any;
  error?: string;
}

export interface HandoffExecution {
  agent_id: string;
  start_time: number;
  end_time?: number;
  input_data: any;
  output_data?: any;
  success: boolean;
  error?: string;
  retry_count: number;
  handoff_data?: any;
} 