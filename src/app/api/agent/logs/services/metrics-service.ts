import { 
  PerformanceProfile, 
  ProfilingConfig, 
  PerformanceAnalysis,
  PerformanceRecommendation,
  DebugSession,
  Bottleneck,
  ExecutionTiming,
  MemorySnapshot,
  ResourceUsage
} from '../types/log-types';

// In-memory storage for performance data (in production, use Redis, ElasticSearch, or similar)
const performanceProfiles = new Map<string, PerformanceProfile>();
const debugSessions = new Map<string, DebugSession>();

export class MetricsService {

  /**
   * Start performance profiling for an agent
   */
  async startPerformanceProfiling(config: ProfilingConfig): Promise<string> {
    const profilingId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const profile: PerformanceProfile = {
      id: profilingId,
      agent_id: config.agent_id,
      start_time: new Date().toISOString(),
      status: 'active',
      config,
      data: {
        execution_times: [],
        memory_snapshots: [],
        resource_usage: [],
        call_stack: [],
        bottlenecks: []
      }
    };
    
    performanceProfiles.set(profilingId, profile);
    
    // Start collecting metrics
    this.startMetricsCollection(profilingId, config);
    
    // Auto-stop profiling after duration if specified
    if (config.duration_ms) {
      setTimeout(async () => {
        await this.stopPerformanceProfiling(profilingId);
      }, config.duration_ms);
    }
    
    return profilingId;
  }

  /**
   * Stop performance profiling
   */
  async stopPerformanceProfiling(profilingId: string): Promise<PerformanceProfile | null> {
    const profile = performanceProfiles.get(profilingId);
    
    if (!profile) {
      return null;
    }
    
    profile.end_time = new Date().toISOString();
    profile.status = 'completed';
    
    // Detect bottlenecks
    profile.data.bottlenecks = await this.detectPerformanceBottlenecks(profile);
    
    performanceProfiles.set(profilingId, profile);
    
    return profile;
  }

  /**
   * Get profiling data
   */
  async getProfilingData(profilingId: string): Promise<PerformanceProfile | null> {
    return performanceProfiles.get(profilingId) || null;
  }

  /**
   * Analyze agent performance
   */
  async analyzeAgentPerformance(analysisConfig: {
    agent_id?: string;
    time_range?: { start: string; end: string };
    include_trends?: boolean;
    include_recommendations?: boolean;
  }): Promise<PerformanceAnalysis> {
    const { agent_id, time_range, include_trends = true, include_recommendations = true } = analysisConfig;
    
    // Collect relevant performance data
    const relevantProfiles = Array.from(performanceProfiles.values()).filter(profile => {
      if (agent_id && profile.agent_id !== agent_id) return false;
      
      if (time_range) {
        const profileStart = new Date(profile.start_time);
        const rangeStart = new Date(time_range.start);
        const rangeEnd = new Date(time_range.end);
        
        if (profileStart < rangeStart || profileStart > rangeEnd) return false;
      }
      
      return true;
    });
    
    // Calculate metrics
    const allExecutionTimes = relevantProfiles.flatMap(p => (p || {}).data.execution_times);
    const durations = allExecutionTimes.map(et => et.duration_ms);
    
    const metrics = {
      avg_response_time_ms: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      p95_response_time_ms: durations.length > 0 ? this.calculatePercentile(durations, 95) : 0,
      p99_response_time_ms: durations.length > 0 ? this.calculatePercentile(durations, 99) : 0,
      error_rate_percent: this.calculateErrorRate(allExecutionTimes),
      throughput_per_minute: this.calculateThroughput(allExecutionTimes),
      memory_efficiency_score: this.calculateMemoryEfficiencyScore(relevantProfiles),
      cpu_efficiency_score: this.calculateCpuEfficiencyScore(relevantProfiles)
    };
    
    // Calculate trends if requested
    const trends = include_trends ? {
      response_time_trend: this.calculateTrend(durations, 'response_time') as 'improving' | 'stable' | 'degrading',
      error_rate_trend: this.calculateTrend(allExecutionTimes.map(et => et.status === 'error' ? 1 : 0), 'error_rate') as 'improving' | 'stable' | 'degrading',
      memory_trend: this.calculateMemoryTrend(relevantProfiles) as 'improving' | 'stable' | 'degrading'
    } : {
      response_time_trend: 'stable' as const,
      error_rate_trend: 'stable' as const,
      memory_trend: 'stable' as const
    };
    
    // Generate recommendations if requested
    const recommendations = include_recommendations ? this.generatePerformanceRecommendations(metrics) : [];
    
    // Collect all bottlenecks
    const bottlenecks = relevantProfiles.flatMap(p => (p || {}).data.bottlenecks);
    
    return {
      agent_id: agent_id || 'all',
      analysis_period: time_range || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        end: new Date().toISOString()
      },
      overall_score: this.calculateOverallPerformanceScore(metrics),
      metrics,
      trends,
      recommendations,
      bottlenecks
    };
  }

  /**
   * Get performance metrics with custom configuration
   */
  async getPerformanceMetrics(metricsConfig: {
    agent_id?: string;
    metric_types?: string[];
    time_window_minutes?: number;
    aggregation?: 'avg' | 'sum' | 'max' | 'min';
  }): Promise<any> {
    const { 
      agent_id, 
      metric_types = ['response_time', 'error_rate', 'throughput'], 
      time_window_minutes = 60,
      aggregation = 'avg'
    } = metricsConfig;
    
    const cutoffTime = new Date(Date.now() - time_window_minutes * 60 * 1000);
    
    const relevantProfiles = Array.from(performanceProfiles.values()).filter(profile => {
      if (agent_id && profile.agent_id !== agent_id) return false;
      return new Date(profile.start_time) > cutoffTime;
    });
    
    const metrics: any = {};
    
    for (const metricType of metric_types) {
      switch (metricType) {
        case 'response_time':
          metrics.response_time = this.aggregateResponseTimes(relevantProfiles, aggregation);
          break;
        case 'error_rate':
          metrics.error_rate = this.aggregateErrorRates(relevantProfiles, aggregation);
          break;
        case 'throughput':
          metrics.throughput = this.aggregateThroughput(relevantProfiles, aggregation);
          break;
        case 'memory_usage':
          metrics.memory_usage = this.aggregateMemoryUsage(relevantProfiles, aggregation);
          break;
        case 'cpu_usage':
          metrics.cpu_usage = this.aggregateCpuUsage(relevantProfiles, aggregation);
          break;
      }
    }
    
    return {
      agent_id: agent_id || 'all',
      time_window_minutes,
      aggregation,
      metrics,
      collected_at: new Date().toISOString()
    };
  }

  /**
   * Debug agent execution
   */
  async debugAgent(agentId: string, debugConfig: {
    enable_breakpoints?: boolean;
    watch_variables?: string[];
    log_level?: 'trace' | 'debug' | 'info';
  }): Promise<string> {
    const sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const debugSession: DebugSession = {
      id: sessionId,
      agent_id: agentId,
      created_at: new Date().toISOString(),
      status: 'active',
      breakpoints: [],
      variables: [],
      call_stack: [],
      execution_log: []
    };
    
    debugSessions.set(sessionId, debugSession);
    
    return sessionId;
  }

  /**
   * Get debug session data
   */
  async getDebugSession(sessionId: string): Promise<DebugSession | null> {
    return debugSessions.get(sessionId) || null;
  }

  /**
   * Trace agent execution
   */
  async traceAgentExecution(traceConfig: {
    agent_id: string;
    operation_types?: string[];
    duration_ms?: number;
    include_stack_trace?: boolean;
  }): Promise<{
    trace_id: string;
    execution_path: any[];
    performance_data: any;
  }> {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, this would integrate with distributed tracing
    const executionPath = [
      {
        timestamp: new Date().toISOString(),
        operation: 'agent_start',
        agent_id: traceConfig.agent_id,
        duration_ms: 0
      }
    ];
    
    const performanceData = {
      total_duration_ms: 0,
      operation_count: 1,
      memory_peak_mb: 0,
      cpu_usage_percent: 0
    };
    
    return {
      trace_id: traceId,
      execution_path: executionPath,
      performance_data: performanceData
    };
  }

  /**
   * Analyze memory usage patterns
   */
  async analyzeMemoryUsage(analysisConfig: {
    agent_id?: string;
    time_range?: { start: string; end: string };
    detect_leaks?: boolean;
  }): Promise<{
    memory_stats: any;
    usage_patterns: any;
    potential_leaks: any[];
    recommendations: string[];
  }> {
    const { agent_id, time_range, detect_leaks = true } = analysisConfig;
    
    const relevantProfiles = this.getRelevantProfiles(agent_id, time_range);
    const memorySnapshots = relevantProfiles.flatMap(p => (p || {}).data.memory_snapshots);
    
    const memoryStats = {
      avg_heap_used_mb: this.calculateAverage(memorySnapshots.map(s => (s || {}).heap_used_mb)),
      max_heap_used_mb: Math.max(...memorySnapshots.map(s => (s || {}).heap_used_mb)),
      avg_heap_total_mb: this.calculateAverage(memorySnapshots.map(s => (s || {}).heap_total_mb)),
      gc_frequency: this.calculateGcFrequency(memorySnapshots)
    };
    
    const usagePatterns = this.identifyMemoryPatterns(memorySnapshots);
    const potentialLeaks = detect_leaks ? this.detectMemoryLeaks(memorySnapshots) : [];
    
    const recommendations = this.generateMemoryRecommendations(memoryStats, potentialLeaks);
    
    return {
      memory_stats: memoryStats,
      usage_patterns: usagePatterns,
      potential_leaks: potentialLeaks,
      recommendations
    };
  }

  /**
   * Detect performance bottlenecks
   */
  async detectBottlenecks(detectionConfig: {
    agent_id?: string;
    time_range?: { start: string; end: string };
    severity_threshold?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<Bottleneck[]> {
    const { agent_id, time_range, severity_threshold = 'medium' } = detectionConfig;
    
    const relevantProfiles = this.getRelevantProfiles(agent_id, time_range);
    const allBottlenecks = relevantProfiles.flatMap(p => (p || {}).data.bottlenecks);
    
    // Filter by severity
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const minSeverityIndex = severityOrder.indexOf(severity_threshold);
    
    return allBottlenecks.filter(bottleneck => {
      const bottleneckSeverityIndex = severityOrder.indexOf(bottleneck.severity);
      return bottleneckSeverityIndex >= minSeverityIndex;
    });
  }

  /**
   * Monitor resource usage
   */
  async monitorResources(monitoringConfig: {
    agent_id?: string;
    metrics?: string[];
    interval_ms?: number;
    duration_ms?: number;
  }): Promise<{
    monitoring_id: string;
    status: 'active' | 'completed';
    data: ResourceUsage[];
  }> {
    const monitoringId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { interval_ms = 5000, duration_ms = 60000 } = monitoringConfig;
    
    const resourceData: ResourceUsage[] = [];
    
    // Simulate resource monitoring
    const startTime = Date.now();
    const endTime = startTime + duration_ms;
    
    while (Date.now() < endTime) {
      resourceData.push({
        timestamp: new Date().toISOString(),
        cpu_percent: Math.random() * 100,
        memory_percent: Math.random() * 100,
        network_io: {
          bytes_sent: Math.floor(Math.random() * 10000),
          bytes_received: Math.floor(Math.random() * 10000),
          requests_count: Math.floor(Math.random() * 100)
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, interval_ms));
    }
    
    return {
      monitoring_id: monitoringId,
      status: 'completed',
      data: resourceData
    };
  }

  // Private helper methods

  private async startMetricsCollection(profilingId: string, config: ProfilingConfig): Promise<void> {
    const profile = performanceProfiles.get(profilingId);
    if (!profile) return;
    
    const interval = config.sample_interval_ms || 1000;
    
    const collectMetrics = () => {
      if (profile.status !== 'active') return;
      
      // Collect execution timing
      if (Math.random() > 0.7) { // Simulate some operations
        const executionTiming: ExecutionTiming = {
          timestamp: new Date().toISOString(),
          operation: 'agent_operation',
          duration_ms: Math.floor(Math.random() * 5000),
          agent_id: config.agent_id,
          status: Math.random() > 0.9 ? 'error' : 'success',
          metadata: {}
        };
        profile.data.execution_times.push(executionTiming);
      }
      
      // Collect memory snapshot
      if (config.include_memory) {
        const memorySnapshot: MemorySnapshot = {
          timestamp: new Date().toISOString(),
          heap_used_mb: Math.floor(Math.random() * 500),
          heap_total_mb: Math.floor(Math.random() * 1000),
          external_mb: Math.floor(Math.random() * 100),
          array_buffers_mb: Math.floor(Math.random() * 50)
        };
        profile.data.memory_snapshots.push(memorySnapshot);
      }
      
      // Collect resource usage
      const resourceUsage: ResourceUsage = {
        timestamp: new Date().toISOString(),
        cpu_percent: Math.random() * 100,
        memory_percent: Math.random() * 100,
        network_io: {
          bytes_sent: Math.floor(Math.random() * 10000),
          bytes_received: Math.floor(Math.random() * 10000),
          requests_count: Math.floor(Math.random() * 100)
        }
      };
      profile.data.resource_usage.push(resourceUsage);
      
      setTimeout(collectMetrics, interval);
    };
    
    setTimeout(collectMetrics, interval);
  }

  private async detectPerformanceBottlenecks(profile: PerformanceProfile): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];
    
    // Analyze execution times
    const durations = profile.data.execution_times.map(et => et.duration_ms);
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      if (maxDuration > avgDuration * 3) {
        bottlenecks.push({
          id: `${profile.id}-slow-execution`,
          type: 'cpu',
          severity: 'high',
          description: `Slow execution detected: max ${maxDuration}ms vs avg ${avgDuration.toFixed(1)}ms`,
          detected_at: new Date().toISOString(),
          affected_operations: ['agent_execution'],
          impact_score: Math.min(100, (maxDuration / avgDuration) * 20),
          recommendations: ['Optimize processing logic', 'Add caching', 'Review algorithm complexity']
        });
      }
    }
    
    // Analyze memory usage
    const memorySnapshots = profile.data.memory_snapshots;
    if (memorySnapshots.length > 0) {
      const heapUsages = memorySnapshots.map(s => (s || {}).heap_used_mb);
      const maxHeap = Math.max(...heapUsages);
      const avgHeap = heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length;
      
      if (maxHeap > 1000) { // More than 1GB
        bottlenecks.push({
          id: `${profile.id}-high-memory`,
          type: 'memory',
          severity: 'medium',
          description: `High memory usage detected: ${maxHeap}MB peak (avg: ${avgHeap.toFixed(1)}MB)`,
          detected_at: new Date().toISOString(),
          affected_operations: ['memory_allocation'],
          impact_score: Math.min(100, maxHeap / 10),
          recommendations: ['Review memory usage patterns', 'Implement garbage collection optimization', 'Consider memory pooling']
        });
      }
    }
    
    return bottlenecks;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  private calculateErrorRate(executionTimes: ExecutionTiming[]): number {
    if (executionTimes.length === 0) return 0;
    const errorCount = executionTimes.filter(et => et.status === 'error').length;
    return (errorCount / executionTimes.length) * 100;
  }

  private calculateThroughput(executionTimes: ExecutionTiming[]): number {
    if (executionTimes.length === 0) return 0;
    
    const timeSpan = executionTimes.length > 1 ? 
      new Date(executionTimes[executionTimes.length - 1].timestamp).getTime() - 
      new Date(executionTimes[0].timestamp).getTime() : 60000;
    
    return (executionTimes.length / timeSpan) * 60000; // Operations per minute
  }

  private calculateMemoryEfficiencyScore(profiles: PerformanceProfile[]): number {
    const allSnapshots = profiles.flatMap(p => (p || {}).data.memory_snapshots);
    if (allSnapshots.length === 0) return 100;
    
    const avgHeapUsed = allSnapshots.reduce((sum, s) => sum + (s || {}).heap_used_mb, 0) / allSnapshots.length;
    const avgHeapTotal = allSnapshots.reduce((sum, s) => sum + (s || {}).heap_total_mb, 0) / allSnapshots.length;
    
    const efficiency = (avgHeapUsed / avgHeapTotal) * 100;
    return Math.max(0, 100 - efficiency); // Higher score for lower usage
  }

  private calculateCpuEfficiencyScore(profiles: PerformanceProfile[]): number {
    const allResourceUsage = profiles.flatMap(p => (p || {}).data.resource_usage);
    if (allResourceUsage.length === 0) return 100;
    
    const avgCpuUsage = allResourceUsage.reduce((sum, r) => sum + r.cpu_percent, 0) / allResourceUsage.length;
    return Math.max(0, 100 - avgCpuUsage);
  }

  private calculateTrend(values: number[], type: string): string {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (type === 'error_rate') {
      return change > 10 ? 'degrading' : change < -10 ? 'improving' : 'stable';
    } else {
      return change > 10 ? 'degrading' : change < -10 ? 'improving' : 'stable';
    }
  }

  private calculateMemoryTrend(profiles: PerformanceProfile[]): string {
    const allSnapshots = profiles.flatMap(p => (p || {}).data.memory_snapshots);
    const heapUsages = allSnapshots.map(s => (s || {}).heap_used_mb);
    return this.calculateTrend(heapUsages, 'memory');
  }

  private calculateOverallPerformanceScore(metrics: any): number {
    // Weighted scoring based on different metrics
    const responseTimeScore = Math.max(0, 100 - (metrics.avg_response_time_ms / 50)); // Penalize slow responses
    const errorRateScore = Math.max(0, 100 - metrics.error_rate_percent * 5); // Heavy penalty for errors
    const memoryScore = metrics.memory_efficiency_score;
    const cpuScore = metrics.cpu_efficiency_score;
    
    return Math.round(
      (responseTimeScore * 0.3) +
      (errorRateScore * 0.4) +
      (memoryScore * 0.15) +
      (cpuScore * 0.15)
    );
  }

  private generatePerformanceRecommendations(metrics: any): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    if (metrics.avg_response_time_ms > 2000) {
      recommendations.push({
        id: 'slow-response-time',
        category: 'performance',
        priority: 'high',
        title: 'Optimize Response Time',
        description: `Average response time is ${metrics.avg_response_time_ms}ms, which exceeds the recommended 2000ms threshold.`,
        impact_estimate: 'High - Users may experience noticeable delays',
        implementation_effort: 'medium',
        code_examples: [
          'Add caching for frequently accessed data',
          'Optimize database queries',
          'Consider async processing for heavy operations'
        ]
      });
    }
    
    if (metrics.error_rate_percent > 5) {
      recommendations.push({
        id: 'high-error-rate',
        category: 'error_handling',
        priority: 'critical',
        title: 'Reduce Error Rate',
        description: `Error rate is ${metrics.error_rate_percent.toFixed(1)}%, which is above the acceptable 5% threshold.`,
        impact_estimate: 'Critical - Affects system reliability',
        implementation_effort: 'high',
        code_examples: [
          'Implement comprehensive error handling',
          'Add retry mechanisms for transient failures',
          'Improve input validation'
        ]
      });
    }
    
    return recommendations;
  }

  private getRelevantProfiles(agentId?: string, timeRange?: { start: string; end: string }): PerformanceProfile[] {
    return Array.from(performanceProfiles.values()).filter(profile => {
      if (agentId && profile.agent_id !== agentId) return false;
      
      if (timeRange) {
        const profileStart = new Date(profile.start_time);
        const rangeStart = new Date(timeRange.start);
        const rangeEnd = new Date(timeRange.end);
        
        if (profileStart < rangeStart || profileStart > rangeEnd) return false;
      }
      
      return true;
    });
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateGcFrequency(snapshots: MemorySnapshot[]): number {
    const gcSnapshots = snapshots.filter(s => (s || {}).gc_stats);
    return gcSnapshots.length / Math.max(1, snapshots.length);
  }

  private identifyMemoryPatterns(snapshots: MemorySnapshot[]): any {
    // Simplified pattern identification
    const heapUsages = snapshots.map(s => (s || {}).heap_used_mb);
    const trend = this.calculateTrend(heapUsages, 'memory');
    
    return {
      trend,
      peak_usage: Math.max(...heapUsages),
      avg_usage: this.calculateAverage(heapUsages),
      volatility: this.calculateVolatility(heapUsages)
    };
  }

  private detectMemoryLeaks(snapshots: MemorySnapshot[]): any[] {
    const leaks: any[] = [];
    
    // Simple leak detection: consistently increasing memory usage
    const heapUsages = snapshots.map(s => (s || {}).heap_used_mb);
    if (heapUsages.length >= 10) {
      const firstQuarter = heapUsages.slice(0, Math.floor(heapUsages.length / 4));
      const lastQuarter = heapUsages.slice(-Math.floor(heapUsages.length / 4));
      
      const firstAvg = this.calculateAverage(firstQuarter);
      const lastAvg = this.calculateAverage(lastQuarter);
      
      if (lastAvg > firstAvg * 1.5) {
        leaks.push({
          type: 'potential_memory_leak',
          severity: 'high',
          description: `Memory usage increased from ${firstAvg.toFixed(1)}MB to ${lastAvg.toFixed(1)}MB`,
          confidence: 0.7
        });
      }
    }
    
    return leaks;
  }

  private generateMemoryRecommendations(memoryStats: any, potentialLeaks: any[]): string[] {
    const recommendations: string[] = [];
    
    if (memoryStats.max_heap_used_mb > 1000) {
      recommendations.push('Consider implementing memory pooling for large objects');
      recommendations.push('Review data structures for memory efficiency');
    }
    
    if (potentialLeaks.length > 0) {
      recommendations.push('Investigate potential memory leaks');
      recommendations.push('Implement proper cleanup in event handlers');
      recommendations.push('Review closure usage to prevent memory retention');
    }
    
    if (memoryStats.gc_frequency > 0.5) {
      recommendations.push('High GC frequency detected - optimize object allocation patterns');
    }
    
    return recommendations;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const avg = this.calculateAverage(values);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private aggregateResponseTimes(profiles: PerformanceProfile[], aggregation: string): number {
    const allTimes = profiles.flatMap(p => (p || {}).data.execution_times.map(et => et.duration_ms));
    
    switch (aggregation) {
      case 'avg': return this.calculateAverage(allTimes);
      case 'max': return Math.max(...allTimes, 0);
      case 'min': return Math.min(...allTimes, 0);
      case 'sum': return allTimes.reduce((a, b) => a + b, 0);
      default: return this.calculateAverage(allTimes);
    }
  }

  private aggregateErrorRates(profiles: PerformanceProfile[], aggregation: string): number {
    const allExecutions = profiles.flatMap(p => (p || {}).data.execution_times);
    return this.calculateErrorRate(allExecutions);
  }

  private aggregateThroughput(profiles: PerformanceProfile[], aggregation: string): number {
    const allExecutions = profiles.flatMap(p => (p || {}).data.execution_times);
    return this.calculateThroughput(allExecutions);
  }

  private aggregateMemoryUsage(profiles: PerformanceProfile[], aggregation: string): number {
    const allSnapshots = profiles.flatMap(p => (p || {}).data.memory_snapshots);
    const heapUsages = allSnapshots.map(s => (s || {}).heap_used_mb);
    
    switch (aggregation) {
      case 'avg': return this.calculateAverage(heapUsages);
      case 'max': return Math.max(...heapUsages, 0);
      case 'min': return Math.min(...heapUsages, 0);
      case 'sum': return heapUsages.reduce((a, b) => a + b, 0);
      default: return this.calculateAverage(heapUsages);
    }
  }

  private aggregateCpuUsage(profiles: PerformanceProfile[], aggregation: string): number {
    const allResourceUsage = profiles.flatMap(p => (p || {}).data.resource_usage);
    const cpuUsages = allResourceUsage.map(r => r.cpu_percent);
    
    switch (aggregation) {
      case 'avg': return this.calculateAverage(cpuUsages);
      case 'max': return Math.max(...cpuUsages, 0);
      case 'min': return Math.min(...cpuUsages, 0);
      case 'sum': return cpuUsages.reduce((a, b) => a + b, 0);
      default: return this.calculateAverage(cpuUsages);
    }
  }
} 