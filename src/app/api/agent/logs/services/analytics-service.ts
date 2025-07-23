import { 
  AgentLog, 
  LogFilters, 
  SearchConfig, 
  // AnalysisConfig,
  Bottleneck 
} from '../types/log-types';

export class AnalyticsService {

  /**
   * Perform advanced search on logs
   */
  async performAdvancedSearch(searchConfig: SearchConfig): Promise<{
    logs: AgentLog[];
    total_matches: number;
    search_metadata: any;
  }> {
    const { query, filters, fuzzy = false, highlight = false, sort = 'desc', limit = 100, offset = 0 } = searchConfig;
    
    // This would be implemented with proper search engine in production
    // For now, implementing basic search functionality
    
    let allLogs: AgentLog[] = [];
    // In production, this would query from proper storage
    
    // Apply text search
    let searchResults = allLogs.filter(log => {
      const searchText = `${log.message} ${log.agent || ''} ${log.tool || ''}`.toLowerCase();
      const searchQuery = query.toLowerCase();
      
      if (fuzzy) {
        return this.fuzzyMatch(searchText, searchQuery);
      } else {
        return searchText.includes(searchQuery);
      }
    });
    
    // Apply filters
    if (filters) {
      if (filters.level) {
        searchResults = searchResults.filter(log => log.level === filters.level);
      }
      if (filters.agent) {
        searchResults = searchResults.filter(log => log.agent === filters.agent);
      }
      if (filters.tool) {
        searchResults = searchResults.filter(log => log.tool === filters.tool);
      }
      if (filters.startTime && filters.endTime) {
        const start = new Date(filters.startTime);
        const end = new Date(filters.endTime);
        searchResults = searchResults.filter(log => {
          const logTime = new Date(log.timestamp);
          return logTime >= start && logTime <= end;
        });
      }
    }
    
    // Sort results
    searchResults.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sort === 'desc' ? timeB - timeA : timeA - timeB;
    });
    
    // Apply pagination
    const paginatedResults = searchResults.slice(offset, offset + limit);
    
    // Highlight search terms if requested
    if (highlight) {
      paginatedResults.forEach(log => {
        log.message = this.highlightSearchTerms(log.message, [query]);
      });
    }
    
    return {
      logs: paginatedResults,
      total_matches: searchResults.length,
      search_metadata: {
        query,
        fuzzy,
        highlight,
        sort,
        execution_time_ms: Date.now() % 1000, // Mock execution time
        filters_applied: filters
      }
    };
  }

  /**
   * Analyze log patterns
   */
  async analyzeLogPatterns(_filters: LogFilters): Promise<{
    temporal_patterns: any;
    error_patterns: any;
    performance_patterns: any;
    common_messages: any;
    anomalies: any;
  }> {
    // This would query logs based on filters
    const logs: AgentLog[] = []; // Placeholder
    
    return {
      temporal_patterns: this.getTemporalPatterns(logs),
      error_patterns: this.getErrorPatterns(logs),
      performance_patterns: this.getPerformancePatterns(logs),
      common_messages: this.getCommonMessages(logs),
      anomalies: this.detectAnomalies(logs)
    };
  }

  /**
   * Get agent performance statistics
   */
  getPerformanceStats(logs: AgentLog[]) {
    const agentStats: Record<string, any> = {};
    
    for (const log of logs) {
      if (!log.agent) continue;
      
      if (!agentStats[log.agent]) {
        agentStats[log.agent] = {
          total_logs: 0,
          error_count: 0,
          avg_duration: 0,
          total_duration: 0,
          last_activity: log.timestamp
        };
      }
      
      const stats = agentStats[log.agent];
      stats.total_logs++;
      
      if (log.level === 'error') {
        stats.error_count++;
      }
      
      if (log.details?.duration) {
        stats.total_duration += log.details.duration;
        stats.avg_duration = stats.total_duration / stats.total_logs;
      }
      
      if (new Date(log.timestamp) > new Date(stats.last_activity)) {
        stats.last_activity = log.timestamp;
      }
    }
    
    return agentStats;
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate(logs: AgentLog[]): number {
    if (logs.length === 0) return 100;
    
    const errorCount = logs.filter(log => log.level === 'error').length;
    return Math.round(((logs.length - errorCount) / logs.length) * 100);
  }

  /**
   * Get agent counts
   */
  getAgentCounts(logs: AgentLog[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      if (log.agent) {
        counts[log.agent] = (counts[log.agent] || 0) + 1;
      }
    }
    
    return counts;
  }

  /**
   * Detect bottlenecks in agent logs
   */
  async detectAgentBottlenecks(agentId: string, logs: AgentLog[]): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];
    
    // Analyze response times
    const durations = logs
      .filter(log => log.agent === agentId && log.details?.duration)
      .map(log => log.details.duration);
    
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      if (maxDuration > avgDuration * 3) {
        bottlenecks.push({
          id: `${agentId}-response-time`,
          type: 'cpu',
          severity: 'high',
          description: `Agent ${agentId} has response times up to ${maxDuration}ms (avg: ${avgDuration}ms)`,
          detected_at: new Date().toISOString(),
          affected_operations: ['agent_execution'],
          impact_score: Math.min(100, (maxDuration / avgDuration) * 20),
          recommendations: [
            'Optimize agent processing logic',
            'Consider caching frequently used data',
            'Review tool execution efficiency'
          ]
        });
      }
    }
    
    // Analyze error rates
    const errorRate = logs.filter(log => log.agent === agentId && log.level === 'error').length / logs.length;
    
    if (errorRate > 0.1) { // More than 10% errors
      bottlenecks.push({
        id: `${agentId}-error-rate`,
        type: 'external_api',
        severity: errorRate > 0.3 ? 'critical' : 'high',
        description: `Agent ${agentId} has high error rate: ${(errorRate * 100).toFixed(1)}%`,
        detected_at: new Date().toISOString(),
        affected_operations: ['agent_execution'],
        impact_score: Math.min(100, errorRate * 100),
        recommendations: [
          'Review error handling logic',
          'Add retry mechanisms for external dependencies',
          'Improve input validation'
        ]
      });
    }
    
    return bottlenecks;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(logs: AgentLog[]): number {
    const durations = logs
      .filter(log => log.details?.duration)
      .map(log => log.details.duration);
    
    if (durations.length === 0) return 0;
    
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Calculate agent health score
   */
  calculateAgentHealthScore(logs: AgentLog[]): number {
    if (logs.length === 0) return 100;
    
    const errorRate = logs.filter(log => log.level === 'error').length / logs.length;
    const successRate = 1 - errorRate;
    
    // Factor in response times
    const avgResponseTime = this.calculateAverageResponseTime(logs);
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 100)); // Penalize slow responses
    
    // Weighted score
    return Math.round((successRate * 70) + (responseTimeScore * 0.3));
  }

  /**
   * Fuzzy matching for search
   */
  private fuzzyMatch(text: string, query: string): boolean {
    const textChars = text.toLowerCase().split('');
    const queryChars = query.toLowerCase().split('');
    
    let queryIndex = 0;
    
    for (const char of textChars) {
      if (queryIndex < queryChars.length && char === queryChars[queryIndex]) {
        queryIndex++;
      }
    }
    
    return queryIndex === queryChars.length;
  }

  /**
   * Highlight search terms in text
   */
  private highlightSearchTerms(text: string, searchTerms: string[]): string {
    let highlightedText = text;
    
    for (const term of searchTerms) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    }
    
    return highlightedText;
  }

  /**
   * Get temporal patterns in logs
   */
  private getTemporalPatterns(logs: AgentLog[]) {
    const hourlyDistribution: Record<string, number> = {};
    const dailyDistribution: Record<string, number> = {};
    
    for (const log of logs) {
      const date = new Date(log.timestamp);
      const hour = date.getHours().toString().padStart(2, '0');
      const day = date.toISOString().split('T')[0];
      
      if (hour !== undefined) {
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      }
      if (day !== undefined) {
        dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
      }
    }
    
    return {
      hourly_distribution: hourlyDistribution,
      daily_distribution: dailyDistribution,
      peak_hours: Object.entries(hourlyDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour, count }))
    };
  }

  /**
   * Get error patterns in logs
   */
  private getErrorPatterns(logs: AgentLog[]) {
    const errorLogs = logs.filter(log => log.level === 'error');
    const errorsByAgent: Record<string, number> = {};
    const errorsByTool: Record<string, number> = {};
    const commonErrors: Record<string, number> = {};
    
    for (const log of errorLogs) {
      if (log.agent) {
        errorsByAgent[log.agent] = (errorsByAgent[log.agent] || 0) + 1;
      }
      if (log.tool) {
        errorsByTool[log.tool] = (errorsByTool[log.tool] || 0) + 1;
      }
      
      // Extract error type from message
      const errorType = log.message.split(':')[0] || 'Unknown';
      commonErrors[errorType] = (commonErrors[errorType] || 0) + 1;
    }
    
    return {
      total_errors: errorLogs.length,
      error_rate: logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0,
      errors_by_agent: errorsByAgent,
      errors_by_tool: errorsByTool,
      common_error_types: commonErrors
    };
  }

  /**
   * Get performance patterns in logs
   */
  private getPerformancePatterns(logs: AgentLog[]) {
    const logsWithDuration = logs.filter(log => log.details?.duration);
    
    if (logsWithDuration.length === 0) {
      return {
        avg_duration: 0,
        median_duration: 0,
        p95_duration: 0,
        slowest_operations: []
      };
    }
    
    const durations = logsWithDuration.map(log => log.details.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const medianDuration = durations[Math.floor(durations.length / 2)];
    const p95Duration = durations[Math.floor(durations.length * 0.95)];
    
    const slowestOperations = logsWithDuration
      .sort((a, b) => b.details.duration - a.details.duration)
      .slice(0, 5)
      .map(log => ({
        agent: log.agent,
        tool: log.tool,
        duration: log.details.duration,
        timestamp: log.timestamp
      }));
    
    return {
      avg_duration: Math.round(avgDuration),
      median_duration: medianDuration,
      p95_duration: p95Duration,
      slowest_operations: slowestOperations
    };
  }

  /**
   * Get common messages in logs
   */
  private getCommonMessages(logs: AgentLog[]) {
    const messageCounts: Record<string, number> = {};
    
    for (const log of logs) {
      // Normalize message (remove timestamps, IDs, etc.)
      const normalizedMessage = log.message
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, '[TIMESTAMP]')
        .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]')
        .replace(/\d+/g, '[NUMBER]');
      
      messageCounts[normalizedMessage] = (messageCounts[normalizedMessage] || 0) + 1;
    }
    
    return Object.entries(messageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count, percentage: (count / logs.length) * 100 }));
  }

  /**
   * Detect anomalies in logs
   */
  private detectAnomalies(logs: AgentLog[]) {
    const anomalies: any[] = [];
    
    // Detect sudden spike in errors
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return logTime > oneHourAgo;
    });
    
    const recentErrorRate = recentLogs.filter(log => log.level === 'error').length / Math.max(1, recentLogs.length);
    const overallErrorRate = logs.filter(log => log.level === 'error').length / Math.max(1, logs.length);
    
    if (recentErrorRate > overallErrorRate * 2 && recentErrorRate > 0.1) {
      anomalies.push({
        type: 'error_spike',
        severity: 'high',
        description: `Error rate spike detected: ${(recentErrorRate * 100).toFixed(1)}% in last hour vs ${(overallErrorRate * 100).toFixed(1)}% overall`,
        detected_at: new Date().toISOString(),
        confidence: 0.8
      });
    }
    
    // Detect unusual silence (no logs for extended period)
    if (logs.length > 0) {
      const lastLogTime = new Date(Math.max(...logs.map(log => new Date(log.timestamp).getTime())));
      const timeSinceLastLog = Date.now() - lastLogTime.getTime();
      
      if (timeSinceLastLog > 30 * 60 * 1000) { // 30 minutes
        anomalies.push({
          type: 'silence',
          severity: 'medium',
          description: `No logs received for ${Math.round(timeSinceLastLog / 60000)} minutes`,
          detected_at: new Date().toISOString(),
          confidence: 0.9
        });
      }
    }
    
    return anomalies;
  }
} 