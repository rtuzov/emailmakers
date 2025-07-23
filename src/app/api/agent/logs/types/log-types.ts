// Log Types for Agent Logs API
// Extracted from monolithic route.ts file

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  timestamp: string;
  tool?: string;
  error?: string;
  duration?: number;
  requestId?: string;
  userId?: string;
}

export interface AgentLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  agent?: string;
  tool?: string;
  traceId?: string;
  details?: any;
}

export interface LogsResponse {
  success: boolean;
  logs: AgentLog[];
  total_count: number;
  filtered_count: number;
  trace_id?: string;
  timestamp: string;
}

// Performance Debugging Interfaces
export interface PerformanceProfile {
  id: string;
  agent_id: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'error';
  config: ProfilingConfig;
  data: {
    execution_times: ExecutionTiming[];
    memory_snapshots: MemorySnapshot[];
    resource_usage: ResourceUsage[];
    call_stack: CallStackEntry[];
    bottlenecks: Bottleneck[];
  };
}

export interface ProfilingConfig {
  agent_id: string;
  duration_ms?: number;
  sample_interval_ms?: number;
  include_memory?: boolean;
  include_cpu?: boolean;
  include_network?: boolean;
  include_call_stack?: boolean;
  filters?: {
    min_duration_ms?: number;
    operation_types?: string[];
  };
}

export interface ExecutionTiming {
  timestamp: string;
  operation: string;
  duration_ms: number;
  agent_id: string;
  tool_id?: string;
  status: 'success' | 'error' | 'timeout';
  metadata: any;
}

export interface MemorySnapshot {
  timestamp: string;
  heap_used_mb: number;
  heap_total_mb: number;
  external_mb: number;
  array_buffers_mb: number;
  gc_stats?: {
    collections: number;
    time_ms: number;
  };
}

export interface ResourceUsage {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  network_io: {
    bytes_sent: number;
    bytes_received: number;
    requests_count: number;
  };
  disk_io?: {
    reads: number;
    writes: number;
  };
}

export interface CallStackEntry {
  timestamp: string;
  function_name: string;
  file_path: string;
  line_number: number;
  execution_time_ms: number;
  parameters?: any;
  return_value?: any;
}

export interface Bottleneck {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'database' | 'external_api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected_at: string;
  affected_operations: string[];
  impact_score: number;
  recommendations: string[];
}

export interface DebugSession {
  id: string;
  agent_id: string;
  created_at: string;
  status: 'active' | 'paused' | 'completed';
  breakpoints: Breakpoint[];
  variables: VariableWatch[];
  call_stack: CallStackEntry[];
  execution_log: ExecutionLogEntry[];
}

export interface Breakpoint {
  id: string;
  file_path: string;
  line_number: number;
  condition?: string;
  hit_count: number;
  enabled: boolean;
}

export interface VariableWatch {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'parameter';
  last_changed: string;
}

export interface ExecutionLogEntry {
  timestamp: string;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: any;
}

export interface PerformanceAnalysis {
  agent_id: string;
  analysis_period: {
    start: string;
    end: string;
  };
  overall_score: number;
  metrics: {
    avg_response_time_ms: number;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
    error_rate_percent: number;
    throughput_per_minute: number;
    memory_efficiency_score: number;
    cpu_efficiency_score: number;
  };
  trends: {
    response_time_trend: 'improving' | 'stable' | 'degrading';
    error_rate_trend: 'improving' | 'stable' | 'degrading';
    memory_trend: 'improving' | 'stable' | 'degrading';
  };
  recommendations: PerformanceRecommendation[];
  bottlenecks: Bottleneck[];
}

export interface PerformanceRecommendation {
  id: string;
  category: 'performance' | 'memory' | 'error_handling' | 'architecture';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact_estimate: string;
  implementation_effort: 'low' | 'medium' | 'high';
  code_examples?: string[];
}

export interface ErrorTrackingData {
  errorId: string;
  message: string;
  level: 'error' | 'warn' | 'critical';
  agent: string;
  tool?: string;
  timestamp: string;
  context?: any;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  frequency?: number;
}

export interface Alert {
  id: string;
  name: string;
  type: 'error_threshold' | 'performance_degradation' | 'agent_down' | 'custom';
  enabled: boolean;
  conditions: {
    level?: string[];
    agent?: string[];
    error_rate_threshold?: number;
    response_time_threshold?: number;
    frequency_threshold?: number;
    time_window_minutes?: number;
  };
  actions: {
    notification: boolean;
    email?: string[];
    webhook?: string;
    escalation_timeout_minutes?: number;
  };
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
  status: 'active' | 'triggered' | 'resolved' | 'snoozed';
}

// Filter types for various operations
export interface LogFilters {
  level?: string;
  limit?: number;
  since?: string;
  tool?: string;
  agent?: string;
  traceId?: string;
  startTime?: string;
  endTime?: string;
}

export interface SearchConfig {
  query: string;
  filters?: LogFilters;
  fuzzy?: boolean;
  highlight?: boolean;
  sort?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AnalysisConfig {
  agent_id?: string;
  time_range?: {
    start: string;
    end: string;
  };
  metrics?: string[];
  include_trends?: boolean;
  include_recommendations?: boolean;
} 