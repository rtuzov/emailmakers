/**
 * 📊 PERFORMANCE MONITORING SYSTEM
 * 
 * Comprehensive performance monitoring for agent tracing and optimization
 * Integrates with OpenAI SDK tracing for real-time performance insights
 */

import { createCustomSpan } from '@openai/agents';
import { tracingConfig } from './tracing-config';

export interface PerformanceMetric {
  timestamp: string;
  agentType: string;
  methodName: string;
  executionTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  success: boolean;
  errorType?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface AgentPerformanceStats {
  agentType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  averageMemoryUsage: number;
  errorRate: number;
  lastExecution: string;
  methodStats: Map<string, MethodPerformanceStats>;
}

export interface MethodPerformanceStats {
  methodName: string;
  totalCalls: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  lastCall: string;
  trendDirection: 'improving' | 'degrading' | 'stable';
}

export interface PerformanceAlert {
  id: string;
  timestamp: string;
  agentType: string;
  methodName?: string;
  alertType: 'slow_execution' | 'memory_leak' | 'high_error_rate' | 'degrading_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
  recommendations: string[];
}

/**
 * 🔧 PERFORMANCE MONITOR CLASS
 * 
 * Central performance monitoring and analytics system
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private agentStats: Map<string, AgentPerformanceStats> = new Map();
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    slowExecutionMs: 5000,      // 5 seconds
    highMemoryMb: 500,          // 500 MB
    errorRatePercent: 10,       // 10%
    degradationThreshold: 1.5   // 50% slower than average
  };

  private constructor() {
    console.log('📊 [PERF MONITOR] Performance Monitor initialized');
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 📈 Record performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      this.metrics.push(metric);
      await this.updateAgentStats(metric);
      await this.checkForAlerts(metric);
      
      // Create custom span for this metric
      await createCustomSpan({
        data: {
          name: `perf_metric_${metric.agentType}_${metric.methodName}`
        }
      });

      // Trim old metrics (keep last 1000)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      console.error('❌ [PERF MONITOR] Failed to record metric:', error);
    }
  }

  /**
   * 🔄 Update agent statistics
   */
  private async updateAgentStats(metric: PerformanceMetric): Promise<void> {
    const agentType = metric.agentType;
    let stats = this.agentStats.get(agentType);

    if (!stats) {
      stats = {
        agentType,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        averageMemoryUsage: 0,
        errorRate: 0,
        lastExecution: metric.timestamp,
        methodStats: new Map()
      };
      this.agentStats.set(agentType, stats);
    }

    // Update totals
    stats.totalExecutions++;
    if (metric.success) {
      stats.successfulExecutions++;
    } else {
      stats.failedExecutions++;
    }
    stats.lastExecution = metric.timestamp;

    // Calculate averages
    const agentMetrics = this.metrics.filter(m => m.agentType === agentType);
    const executionTimes = agentMetrics.map(m => m.executionTime);
    const memoryUsages = agentMetrics.map(m => m.memoryUsage.heapUsed);

    stats.averageExecutionTime = this.calculateAverage(executionTimes);
    stats.medianExecutionTime = this.calculateMedian(executionTimes);
    stats.p95ExecutionTime = this.calculatePercentile(executionTimes, 95);
    stats.averageMemoryUsage = this.calculateAverage(memoryUsages);
    stats.errorRate = (stats.failedExecutions / stats.totalExecutions) * 100;

    // Update method stats
    await this.updateMethodStats(stats, metric);
  }

  /**
   * 🎯 Update method-specific statistics
   */
  private async updateMethodStats(agentStats: AgentPerformanceStats, metric: PerformanceMetric): Promise<void> {
    const methodName = metric.methodName;
    let methodStats = agentStats.methodStats.get(methodName);

    if (!methodStats) {
      methodStats = {
        methodName,
        totalCalls: 0,
        averageTime: 0,
        minTime: Number.MAX_VALUE,
        maxTime: 0,
        successRate: 0,
        lastCall: metric.timestamp,
        trendDirection: 'stable'
      };
      agentStats.methodStats.set(methodName, methodStats);
    }

    // Update method stats
    methodStats.totalCalls++;
    methodStats.lastCall = metric.timestamp;
    methodStats.minTime = Math.min(methodStats.minTime, metric.executionTime);
    methodStats.maxTime = Math.max(methodStats.maxTime, metric.executionTime);

    // Calculate averages for this method
    const methodMetrics = this.metrics.filter(m => 
      m.agentType === metric.agentType && m.methodName === methodName
    );
    const successfulCalls = methodMetrics.filter(m => m.success).length;
    methodStats.successRate = (successfulCalls / methodMetrics.length) * 100;
    methodStats.averageTime = this.calculateAverage(methodMetrics.map(m => m.executionTime));

    // Determine performance trend
    methodStats.trendDirection = this.calculateTrend(methodMetrics.map(m => m.executionTime));
  }

  /**
   * ⚠️ Check for performance alerts
   */
  private async checkForAlerts(metric: PerformanceMetric): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Check slow execution
    if (metric.executionTime > this.thresholds.slowExecutionMs) {
      alerts.push({
        id: `slow_exec_${Date.now()}`,
        timestamp: metric.timestamp,
        agentType: metric.agentType,
        methodName: metric.methodName,
        alertType: 'slow_execution',
        severity: metric.executionTime > this.thresholds.slowExecutionMs * 2 ? 'critical' : 'high',
        message: `Slow execution detected: ${metric.executionTime}ms`,
        currentValue: metric.executionTime,
        threshold: this.thresholds.slowExecutionMs,
        recommendations: [
          'Review method implementation for optimization opportunities',
          'Check for blocking operations or inefficient algorithms',
          'Consider caching or pre-computation strategies'
        ]
      });
    }

    // Check high memory usage
    const memoryMb = metric.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMb > this.thresholds.highMemoryMb) {
      alerts.push({
        id: `high_mem_${Date.now()}`,
        timestamp: metric.timestamp,
        agentType: metric.agentType,
        methodName: metric.methodName,
        alertType: 'memory_leak',
        severity: memoryMb > this.thresholds.highMemoryMb * 2 ? 'critical' : 'medium',
        message: `High memory usage: ${Math.round(memoryMb)}MB`,
        currentValue: memoryMb,
        threshold: this.thresholds.highMemoryMb,
        recommendations: [
          'Check for memory leaks or large object retention',
          'Implement proper garbage collection strategies',
          'Consider data streaming for large datasets'
        ]
      });
    }

    // Check error rate
    const agentStats = this.agentStats.get(metric.agentType);
    if (agentStats && agentStats.errorRate > this.thresholds.errorRatePercent) {
      alerts.push({
        id: `high_error_${Date.now()}`,
        timestamp: metric.timestamp,
        agentType: metric.agentType,
        alertType: 'high_error_rate',
        severity: agentStats.errorRate > this.thresholds.errorRatePercent * 2 ? 'critical' : 'high',
        message: `High error rate: ${agentStats.errorRate.toFixed(1)}%`,
        currentValue: agentStats.errorRate,
        threshold: this.thresholds.errorRatePercent,
        recommendations: [
          'Review error handling and input validation',
          'Check external service dependencies',
          'Implement proper retry mechanisms'
        ]
      });
    }

    // Add alerts
    alerts.forEach(alert => {
      this.alerts.push(alert);
      console.warn(`⚠️ [PERF ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
    });

    // Trim old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * 📊 Get comprehensive performance report
   */
  getPerformanceReport(): {
    summary: {
      totalMetrics: number;
      totalAgents: number;
      totalAlerts: number;
      systemHealthScore: number;
    };
    agentStats: AgentPerformanceStats[];
    recentAlerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const agentStatsArray = Array.from(this.agentStats.values());
    const recentAlerts = this.alerts.slice(-10);
    
    // Calculate system health score (0-100)
    const healthScore = this.calculateSystemHealthScore();

    return {
      summary: {
        totalMetrics: this.metrics.length,
        totalAgents: this.agentStats.size,
        totalAlerts: this.alerts.length,
        systemHealthScore: healthScore
      },
      agentStats: agentStatsArray,
      recentAlerts,
      recommendations: this.generateRecommendations(agentStatsArray, recentAlerts)
    };
  }

  /**
   * 🎯 Get performance for specific agent
   */
  getAgentPerformance(agentType: string): AgentPerformanceStats | undefined {
    return this.agentStats.get(agentType);
  }

  /**
   * ⚠️ Get active alerts
   */
  getActiveAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): PerformanceAlert[] {
    const recent = this.alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      const now = Date.now();
      return now - alertTime < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    return severity ? recent.filter(alert => alert.severity === severity) : recent;
  }

  /**
   * 🔧 Utility methods
   */
  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 10) return 'stable';
    
    const recent = values.slice(-5);
    const previous = values.slice(-10, -5);
    
    const recentAvg = this.calculateAverage(recent);
    const previousAvg = this.calculateAverage(previous);
    
    const change = (recentAvg - previousAvg) / previousAvg;
    
    if (change > 0.1) return 'degrading';  // 10% slower
    if (change < -0.1) return 'improving'; // 10% faster
    return 'stable';
  }

  private calculateSystemHealthScore(): number {
    const agentStatsArray = Array.from(this.agentStats.values());
    if (agentStatsArray.length === 0) return 100;

    let totalScore = 0;
    agentStatsArray.forEach(stats => {
      let agentScore = 100;
      
      // Penalize high error rate
      agentScore -= Math.min(stats.errorRate * 2, 50);
      
      // Penalize slow execution
      if (stats.averageExecutionTime > this.thresholds.slowExecutionMs) {
        agentScore -= 20;
      }
      
      // Penalize high memory usage
      if (stats.averageMemoryUsage > this.thresholds.highMemoryMb * 1024 * 1024) {
        agentScore -= 15;
      }
      
      totalScore += Math.max(0, agentScore);
    });

    return Math.round(totalScore / agentStatsArray.length);
  }

  private generateRecommendations(stats: AgentPerformanceStats[], alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = [];

    // Analyze stats for recommendations
    stats.forEach(agentStat => {
      if (agentStat.errorRate > 5) {
        recommendations.push(`Investigate error patterns in ${agentStat.agentType} agent`);
      }
      if (agentStat.averageExecutionTime > 3000) {
        recommendations.push(`Optimize performance for ${agentStat.agentType} agent methods`);
      }
    });

    // Analyze alerts for recommendations
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical performance issues immediately');
    }

    const memoryAlerts = alerts.filter(alert => alert.alertType === 'memory_leak');
    if (memoryAlerts.length > 2) {
      recommendations.push('Implement memory profiling and leak detection');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }
}

/**
 * 🌍 Global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * 🎯 Helper function to record performance metric
 */
export async function recordPerformanceMetric(
  agentType: string,
  methodName: string,
  executionTime: number,
  success: boolean,
  errorType?: string,
  traceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const metric: PerformanceMetric = {
    timestamp: new Date().toISOString(),
    agentType,
    methodName,
    executionTime,
    memoryUsage: process.memoryUsage(),
    success,
    errorType,
    traceId,
    metadata
  };

  await performanceMonitor.recordMetric(metric);
}