/**
 * 📊 PERFORMANCE DASHBOARD
 * 
 * Visual performance dashboard for monitoring agent performance
 * Real-time metrics, alerts, and recommendations
 */

import { performanceMonitor, PerformanceAlert, AgentPerformanceStats } from './performance-monitor';

export interface DashboardData {
  timestamp: string;
  systemHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'degrading';
  };
  agentSummary: {
    totalAgents: number;
    activeAgents: number;
    healthyAgents: number;
    alertingAgents: number;
  };
  performanceMetrics: {
    averageResponseTime: number;
    totalExecutions: number;
    successRate: number;
    errorRate: number;
  };
  topIssues: PerformanceAlert[];
  recommendations: string[];
}

export interface AgentHealthCard {
  agentType: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    executionTime: number;
    successRate: number;
    errorRate: number;
    memoryUsage: number;
  };
  trends: {
    executionTime: 'improving' | 'stable' | 'degrading';
    successRate: 'improving' | 'stable' | 'degrading';
  };
  alerts: number;
  lastActivity: string;
}

/**
 * 📊 PERFORMANCE DASHBOARD CLASS
 */
export class PerformanceDashboard {
  private static instance: PerformanceDashboard;
  private updateInterval: NodeJS.Timeout | null = null;
  private dashboardData: DashboardData | null = null;

  private constructor() {
    console.log('📊 [DASHBOARD] Performance Dashboard initialized');
  }

  static getInstance(): PerformanceDashboard {
    if (!PerformanceDashboard.instance) {
      PerformanceDashboard.instance = new PerformanceDashboard();
    }
    return PerformanceDashboard.instance;
  }

  /**
   * 🚀 Start dashboard monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.updateInterval) {
      this.stopMonitoring();
    }

    console.log(`📊 [DASHBOARD] Starting monitoring with ${intervalMs}ms interval`);
    
    // Initial update
    this.updateDashboard();
    
    // Set interval for updates
    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, intervalMs);
  }

  /**
   * ⏹️ Stop dashboard monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('📊 [DASHBOARD] Monitoring stopped');
    }
  }

  /**
   * 🔄 Update dashboard data
   */
  private updateDashboard(): void {
    try {
      const report = performanceMonitor.getPerformanceReport();
      
      this.dashboardData = {
        timestamp: new Date().toISOString(),
        systemHealth: this.calculateSystemHealth(report),
        agentSummary: this.calculateAgentSummary(report.agentStats),
        performanceMetrics: this.calculatePerformanceMetrics(report.agentStats),
        topIssues: this.getTopIssues(report.recentAlerts),
        recommendations: report.recommendations
      };

      this.logDashboardUpdate();
    } catch (error) {
      console.error('❌ [DASHBOARD] Failed to update dashboard:', error);
    }
  }

  /**
   * 🏥 Calculate system health
   */
  private calculateSystemHealth(report: any): DashboardData['systemHealth'] {
    const score = report.summary.systemHealthScore;
    
    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 50) status = 'warning';
    else status = 'critical';

    // Simple trend calculation based on recent alerts
    const criticalAlerts = report.recentAlerts.filter((alert: PerformanceAlert) => 
      alert.severity === 'critical'
    ).length;
    
    let trend: 'improving' | 'stable' | 'degrading';
    if (criticalAlerts > 2) trend = 'degrading';
    else if (criticalAlerts === 0 && score > 85) trend = 'improving';
    else trend = 'stable';

    return { score, status, trend };
  }

  /**
   * 👥 Calculate agent summary
   */
  private calculateAgentSummary(agentStats: AgentPerformanceStats[]): DashboardData['agentSummary'] {
    const totalAgents = agentStats.length;
    
    // Consider agent active if it had activity in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const activeAgents = agentStats.filter(stats => stats.lastExecution > oneHourAgo).length;
    
    // Consider agent healthy if error rate < 5% and avg execution time < 3s
    const healthyAgents = agentStats.filter(stats => 
      stats.errorRate < 5 && stats.averageExecutionTime < 3000
    ).length;
    
    const alertingAgents = totalAgents - healthyAgents;

    return {
      totalAgents,
      activeAgents,
      healthyAgents,
      alertingAgents
    };
  }

  /**
   * 📊 Calculate performance metrics
   */
  private calculatePerformanceMetrics(agentStats: AgentPerformanceStats[]): DashboardData['performanceMetrics'] {
    if (agentStats.length === 0) {
      return {
        averageResponseTime: 0,
        totalExecutions: 0,
        successRate: 0,
        errorRate: 0
      };
    }

    const totalExecutions = agentStats.reduce((sum, stats) => sum + stats.totalExecutions, 0);
    const totalSuccesses = agentStats.reduce((sum, stats) => sum + stats.successfulExecutions, 0);
    const totalFailures = agentStats.reduce((sum, stats) => sum + stats.failedExecutions, 0);
    
    const averageResponseTime = agentStats.reduce((sum, stats) => 
      sum + stats.averageExecutionTime, 0
    ) / agentStats.length;
    
    const successRate = totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0;
    const errorRate = totalExecutions > 0 ? (totalFailures / totalExecutions) * 100 : 0;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      totalExecutions,
      successRate: Math.round(successRate * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10
    };
  }

  /**
   * ⚠️ Get top issues
   */
  private getTopIssues(alerts: PerformanceAlert[]): PerformanceAlert[] {
    return alerts
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5); // Top 5 issues
  }

  /**
   * 📋 Get current dashboard data
   */
  getDashboardData(): DashboardData | null {
    return this.dashboardData;
  }

  /**
   * 🎯 Get agent health cards
   */
  getAgentHealthCards(): AgentHealthCard[] {
    const report = performanceMonitor.getPerformanceReport();
    const alerts = performanceMonitor.getActiveAlerts();
    
    return report.agentStats.map(stats => {
      const agentAlerts = alerts.filter(alert => alert.agentType === stats.agentType);
      
      let status: 'healthy' | 'warning' | 'critical';
      if (agentAlerts.some(alert => alert.severity === 'critical')) {
        status = 'critical';
      } else if (agentAlerts.some(alert => alert.severity === 'high' || alert.severity === 'medium')) {
        status = 'warning';
      } else {
        status = 'healthy';
      }

      return {
        agentType: stats.agentType,
        status,
        metrics: {
          executionTime: Math.round(stats.averageExecutionTime),
          successRate: Math.round(((stats.successfulExecutions / stats.totalExecutions) * 100) * 10) / 10,
          errorRate: Math.round(stats.errorRate * 10) / 10,
          memoryUsage: Math.round(stats.averageMemoryUsage / 1024 / 1024) // MB
        },
        trends: {
          executionTime: 'stable', // Simplified for now
          successRate: 'stable'    // Simplified for now
        },
        alerts: agentAlerts.length,
        lastActivity: stats.lastExecution
      };
    });
  }

  /**
   * 📝 Log dashboard update
   */
  private logDashboardUpdate(): void {
    if (!this.dashboardData) return;

    const data = this.dashboardData;
    const health = data.systemHealth;
    
    console.log(`📊 [DASHBOARD] System Health: ${health.score}% (${health.status}) - ${health.trend}`);
    console.log(`📊 [DASHBOARD] Agents: ${data.agentSummary.healthyAgents}/${data.agentSummary.totalAgents} healthy`);
    console.log(`📊 [DASHBOARD] Performance: ${data.performanceMetrics.averageResponseTime}ms avg, ${data.performanceMetrics.successRate}% success`);
    
    if (data.topIssues.length > 0) {
      console.log(`⚠️ [DASHBOARD] Top Issues: ${data.topIssues.length} active alerts`);
    }
  }

  /**
   * 📊 Generate dashboard report
   */
  generateReport(): string {
    if (!this.dashboardData) {
      return '❌ Dashboard data not available. Start monitoring first.';
    }

    const data = this.dashboardData;
    const report = [];

    // Header
    report.push('📊 AGENT PERFORMANCE DASHBOARD REPORT');
    report.push('='.repeat(50));
    report.push(`Generated: ${new Date(data.timestamp).toLocaleString()}`);
    report.push('');

    // System Health
    report.push('🏥 SYSTEM HEALTH:');
    report.push(`   Score: ${data.systemHealth.score}/100 (${data.systemHealth.status.toUpperCase()})`);
    report.push(`   Trend: ${data.systemHealth.trend.toUpperCase()}`);
    report.push('');

    // Agent Summary
    report.push('👥 AGENT SUMMARY:');
    report.push(`   Total Agents: ${data.agentSummary.totalAgents}`);
    report.push(`   Active Agents: ${data.agentSummary.activeAgents}`);
    report.push(`   Healthy Agents: ${data.agentSummary.healthyAgents}`);
    report.push(`   Alerting Agents: ${data.agentSummary.alertingAgents}`);
    report.push('');

    // Performance Metrics
    report.push('📊 PERFORMANCE METRICS:');
    report.push(`   Average Response Time: ${data.performanceMetrics.averageResponseTime}ms`);
    report.push(`   Total Executions: ${data.performanceMetrics.totalExecutions}`);
    report.push(`   Success Rate: ${data.performanceMetrics.successRate}%`);
    report.push(`   Error Rate: ${data.performanceMetrics.errorRate}%`);
    report.push('');

    // Top Issues
    if (data.topIssues.length > 0) {
      report.push('⚠️ TOP ISSUES:');
      data.topIssues.forEach((issue, index) => {
        report.push(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        report.push(`      Agent: ${issue.agentType}${issue.methodName ? `.${issue.methodName}` : ''}`);
      });
      report.push('');
    }

    // Recommendations
    if (data.recommendations.length > 0) {
      report.push('💡 RECOMMENDATIONS:');
      data.recommendations.forEach((rec, index) => {
        report.push(`   ${index + 1}. ${rec}`);
      });
      report.push('');
    }

    // Agent Health Cards
    const healthCards = this.getAgentHealthCards();
    if (healthCards.length > 0) {
      report.push('🎯 AGENT HEALTH DETAILS:');
      healthCards.forEach(card => {
        const statusIcon = card.status === 'healthy' ? '✅' : card.status === 'warning' ? '⚠️' : '❌';
        report.push(`   ${statusIcon} ${card.agentType.toUpperCase()}: ${card.status}`);
        report.push(`      Execution: ${card.metrics.executionTime}ms avg`);
        report.push(`      Success: ${card.metrics.successRate}%`);
        report.push(`      Memory: ${card.metrics.memoryUsage}MB`);
        report.push(`      Alerts: ${card.alerts}`);
      });
    }

    return report.join('\\n');
  }
}

/**
 * 🌍 Global dashboard instance
 */
export const performanceDashboard = PerformanceDashboard.getInstance();

/**
 * 🚀 Quick start function
 */
export function startPerformanceMonitoring(intervalMs: number = 30000): void {
  performanceDashboard.startMonitoring(intervalMs);
  console.log('🚀 [DASHBOARD] Performance monitoring started');
}

/**
 * ⏹️ Quick stop function  
 */
export function stopPerformanceMonitoring(): void {
  performanceDashboard.stopMonitoring();
  console.log('⏹️ [DASHBOARD] Performance monitoring stopped');
}

/**
 * 📊 Quick report function
 */
export function getPerformanceReport(): string {
  return performanceDashboard.generateReport();
}