import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  timestamp: number;
  endpoint?: string;
  userId?: string;
  statusCode?: number;
  userAgent?: string;
  method?: string;
}

export interface PerformanceAlert {
  type: 'HIGH_MEMORY' | 'SLOW_REQUEST' | 'HIGH_CPU' | 'ERROR_RATE' | 'DISK_SPACE' | 'CONNECTION_POOL';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  endpoint?: string;
}

export interface PrometheusMetrics {
  http_requests_total: Map<string, number>;
  http_request_duration_seconds: Map<string, number[]>;
  memory_usage_bytes: number;
  cpu_usage_percent: number;
  active_connections: number;
  error_rate: number;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private prometheusMetrics: PrometheusMetrics;
  private readonly maxMetricsHistory = 10000; // Increased for production
  private readonly maxAlertsHistory = 1000;
  
  // Enhanced performance thresholds
  private readonly thresholds = {
    maxRequestDuration: 5000, // 5 seconds
    maxMemoryUsage: 2048 * 1024 * 1024, // 2GB (increased from 512MB)
    maxCpuUsage: 80, // 80%
    maxErrorRate: 0.05, // 5%
    maxDiskUsage: 0.85, // 85%
    maxConnectionPoolUsage: 0.9, // 90%
    slowRequestThreshold: 2000, // 2 seconds for warnings
    criticalMemoryThreshold: 0.95, // 95% of max memory
  };

  constructor() {
    this.prometheusMetrics = {
      http_requests_total: new Map(),
      http_request_duration_seconds: new Map(),
      memory_usage_bytes: 0,
      cpu_usage_percent: 0,
      active_connections: 0,
      error_rate: 0,
    };

    // Start background monitoring
    this.startBackgroundMonitoring();
  }

  /**
   * Start performance tracking for a request
   */
  startTracking(identifier: string): string {
    const trackingId = `${identifier}_${Date.now()}_${Math.random()}`;
    performance.mark(`start_${trackingId}`);
    return trackingId;
  }

  /**
   * End performance tracking and record metrics
   */
  endTracking(
    trackingId: string, 
    _options: {
      endpoint?: string;
      userId?: string;
      statusCode?: number;
      userAgent?: string;
      method?: string;
    } = {}
  ): PerformanceMetrics {
    performance.mark(`end_${trackingId}`);
    performance.measure(`duration_${trackingId}`, `start_${trackingId}`, `end_${trackingId}`);
    
    const measure = performance.getEntriesByName(`duration_${trackingId}`)[0];
    const requestDuration = measure?.duration || 0;
    
    const metrics: PerformanceMetrics = {
      requestDuration,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: Date.now(),
      ...(_options || {}),
    };

    this.recordMetrics(metrics);
    this.updatePrometheusMetrics(metrics);
    this.checkThresholds(metrics);
    
    // Cleanup performance marks
    performance.clearMarks(`start_${trackingId}`);
    performance.clearMarks(`end_${trackingId}`);
    performance.clearMeasures(`duration_${trackingId}`);
    
    return metrics;
  }

  /**
   * Record metrics and maintain history
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Maintain maximum history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Update Prometheus-compatible metrics
   */
  private updatePrometheusMetrics(metrics: PerformanceMetrics): void {
    // Update request counters
    const key = `${metrics.method || 'unknown'}_${metrics.endpoint || 'unknown'}_${metrics.statusCode || 'unknown'}`;
    const currentCount = this.prometheusMetrics.http_requests_total.get(key) || 0;
    this.prometheusMetrics.http_requests_total.set(key, currentCount + 1);

    // Update request duration histogram
    const durations = this.prometheusMetrics.http_request_duration_seconds.get(key) || [];
    durations.push(metrics.requestDuration / 1000); // Convert to seconds
    this.prometheusMetrics.http_request_duration_seconds.set(key, durations);

    // Update system metrics
    this.prometheusMetrics.memory_usage_bytes = metrics.memoryUsage.heapUsed;
    this.prometheusMetrics.cpu_usage_percent = metrics.cpuUsage 
      ? this.calculateCpuUsagePercent(metrics.cpuUsage) 
      : 0;
  }

  /**
   * Enhanced threshold checking with severity levels
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // Check request duration with multiple severity levels
    if (metrics.requestDuration > this.thresholds.maxRequestDuration) {
      this.generateAlert({
        type: 'SLOW_REQUEST',
        message: `Critical slow request detected: ${metrics.requestDuration}ms on ${metrics.endpoint}`,
        threshold: this.thresholds.maxRequestDuration,
        currentValue: metrics.requestDuration,
        timestamp: Date.now(),
        severity: 'critical',
        ...(metrics.endpoint && { endpoint: metrics.endpoint }),
      });
    } else if (metrics.requestDuration > this.thresholds.slowRequestThreshold) {
      this.generateAlert({
        type: 'SLOW_REQUEST',
        message: `Slow request warning: ${metrics.requestDuration}ms on ${metrics.endpoint}`,
        threshold: this.thresholds.slowRequestThreshold,
        currentValue: metrics.requestDuration,
        timestamp: Date.now(),
        severity: 'medium',
        ...(metrics.endpoint && { endpoint: metrics.endpoint }),
      });
    }

    // Enhanced memory usage checking
    const memoryUsageMB = metrics.memoryUsage.heapUsed;
    const memoryUsagePercent = memoryUsageMB / this.thresholds.maxMemoryUsage;
    
    if (memoryUsagePercent > this.thresholds.criticalMemoryThreshold) {
      this.generateAlert({
        type: 'HIGH_MEMORY',
        message: `Critical memory usage: ${(memoryUsageMB / 1024 / 1024).toFixed(2)}MB (${(memoryUsagePercent * 100).toFixed(1)}%)`,
        threshold: this.thresholds.maxMemoryUsage / 1024 / 1024,
        currentValue: memoryUsageMB / 1024 / 1024,
        timestamp: Date.now(),
        severity: 'critical',
      });
    } else if (memoryUsageMB > this.thresholds.maxMemoryUsage * 0.8) {
      this.generateAlert({
        type: 'HIGH_MEMORY',
        message: `High memory usage warning: ${(memoryUsageMB / 1024 / 1024).toFixed(2)}MB (${(memoryUsagePercent * 100).toFixed(1)}%)`,
        threshold: this.thresholds.maxMemoryUsage * 0.8 / 1024 / 1024,
        currentValue: memoryUsageMB / 1024 / 1024,
        timestamp: Date.now(),
        severity: 'medium',
      });
    }

    // Enhanced CPU usage checking
    if (metrics.cpuUsage) {
      const cpuPercent = this.calculateCpuUsagePercent(metrics.cpuUsage);
      if (cpuPercent > this.thresholds.maxCpuUsage) {
        this.generateAlert({
          type: 'HIGH_CPU',
          message: `High CPU usage detected: ${cpuPercent.toFixed(2)}%`,
          threshold: this.thresholds.maxCpuUsage,
          currentValue: cpuPercent,
          timestamp: Date.now(),
          severity: cpuPercent > 95 ? 'critical' : 'high',
        });
      }
    }

    // Check error rate
    this.checkErrorRate();
  }

  /**
   * Check error rate and generate alerts
   */
  private checkErrorRate(): void {
    const recentMetrics = this.getRecentMetrics(100);
    if (recentMetrics.length < 10) return; // Need sufficient data

    const errorCount = recentMetrics.filter(m => m.statusCode && m.statusCode >= 400).length;
    const errorRate = errorCount / recentMetrics.length;

    if (errorRate > this.thresholds.maxErrorRate) {
      this.generateAlert({
        type: 'ERROR_RATE',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}% (${errorCount}/${recentMetrics.length} requests)`,
        threshold: this.thresholds.maxErrorRate * 100,
        currentValue: errorRate * 100,
        timestamp: Date.now(),
        severity: errorRate > 0.1 ? 'critical' : 'high',
      });
    }
  }

  /**
   * Enhanced alert generation with external integrations
   */
  private generateAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Maintain alerts history
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }
    
    // Log alert with appropriate level
    const logLevel = alert.severity === 'critical' ? 'error' : 
                    alert.severity === 'high' ? 'warn' : 'info';
    console[logLevel](`[PERFORMANCE ALERT] ${alert.type}: ${alert.message}`);
    
    // Send to external monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringServices(alert);
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsagePercent(cpuUsage: NodeJS.CpuUsage): number {
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return (totalUsage / 1000) * 100; // Convert microseconds to percentage
  }

  /**
   * Send alert to multiple monitoring services
   */
  private async sendToMonitoringServices(alert: PerformanceAlert): Promise<void> {
    const promises = [];

    // Send to Prometheus AlertManager
    if (process.env.PROMETHEUS_ALERT_URL) {
      promises.push(this.sendToPrometheus(alert));
    }

    // Send to Slack
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'critical') {
      promises.push(this.sendToSlack(alert));
    }

    // Send to email alerts
    if (process.env.ALERT_EMAIL && alert.severity === 'critical') {
      promises.push(this.sendEmailAlert(alert));
    }

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Failed to send alerts to monitoring services:', error);
    }
  }

  /**
   * Send alert to Prometheus AlertManager
   */
  private async sendToPrometheus(alert: PerformanceAlert): Promise<void> {
    try {
      const payload = [{
        labels: {
          alertname: alert.type,
          severity: alert.severity,
          instance: process.env.INSTANCE_ID || 'unknown',
          endpoint: alert.endpoint || 'unknown',
        },
        annotations: {
          summary: alert.message,
          description: `Threshold: ${alert.threshold}, Current: ${alert.currentValue}`,
        },
        startsAt: new Date(alert.timestamp).toISOString(),
      }];

      // In production, make actual HTTP request to AlertManager
      console.log('Would send to Prometheus:', payload);
    } catch (error) {
      console.error('Failed to send alert to Prometheus:', error);
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: PerformanceAlert): Promise<void> {
    try {
      const payload = {
        text: `🚨 Performance Alert: ${alert.type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${alert.type}* - ${alert.severity.toUpperCase()}\n${alert.message}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Threshold:* ${alert.threshold}`,
              },
              {
                type: 'mrkdwn',
                text: `*Current:* ${alert.currentValue}`,
              },
              {
                type: 'mrkdwn',
                text: `*Endpoint:* ${alert.endpoint || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time:* ${new Date(alert.timestamp).toISOString()}`,
              },
            ],
          },
        ],
      };

      // In production, make actual HTTP request to Slack webhook
      console.log('Would send to Slack:', payload);
    } catch (error) {
      console.error('Failed to send alert to Slack:', error);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // In production, integrate with email service
      console.log('Would send email alert:', alert);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Start background monitoring for system metrics
   */
  private startBackgroundMonitoring(): void {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Cleanup old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000);
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Update Prometheus metrics
    this.prometheusMetrics.memory_usage_bytes = memoryUsage.heapUsed;
    this.prometheusMetrics.cpu_usage_percent = this.calculateCpuUsagePercent(cpuUsage);

    // Check thresholds for system metrics
    // const mockMetrics: PerformanceMetrics = {
    //   requestDuration: 0,
    //   memoryUsage,
    //   cpuUsage,
    //   timestamp: Date.now(),
    // };

    // Only check memory and CPU thresholds for system monitoring
    const memoryUsageMB = memoryUsage.heapUsed;
    if (memoryUsageMB > this.thresholds.maxMemoryUsage) {
      this.generateAlert({
        type: 'HIGH_MEMORY',
        message: `System memory usage high: ${(memoryUsageMB / 1024 / 1024).toFixed(2)}MB`,
        threshold: this.thresholds.maxMemoryUsage / 1024 / 1024,
        currentValue: memoryUsageMB / 1024 / 1024,
        timestamp: Date.now(),
        severity: 'high',
      });
    }
  }

  /**
   * Cleanup old metrics and alerts
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Remove old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    
    // Remove old alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);

    // Cleanup Prometheus metrics (keep only recent data)
    for (const [key, durations] of Array.from(this.prometheusMetrics.http_request_duration_seconds.entries())) {
      if (durations.length > 1000) {
        this.prometheusMetrics.http_request_duration_seconds.set(key, durations.slice(-1000));
      }
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getPerformanceStats(): {
    averageRequestDuration: number;
    medianRequestDuration: number;
    p95RequestDuration: number;
    p99RequestDuration: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
    recentAlerts: PerformanceAlert[];
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    if (this.metrics.length === 0) {
      return {
        averageRequestDuration: 0,
        medianRequestDuration: 0,
        p95RequestDuration: 0,
        p99RequestDuration: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0,
        recentAlerts: [],
        systemHealth: 'healthy',
      };
    }

    const durations = this.metrics.map(m => m.requestDuration).sort((a, b) => a - b);
    const memoryUsages = this.metrics.map(m => m.memoryUsage.heapUsed);
    const errorRequests = this.metrics.filter(m => m.statusCode && m.statusCode >= 400);
    // const recentMetrics = this.getRecentMetrics(100); // Currently unused
    const recentAlerts = this.alerts.filter(a => a.timestamp > Date.now() - (60 * 60 * 1000)); // Last hour

    // Calculate throughput (requests per second)
    const timeSpan = Math.max(1, (Date.now() - (this.metrics && this.metrics[0] ? this.metrics[0].timestamp : Date.now())) / 1000);
    const throughput = this.metrics.length / timeSpan;

    // Determine system health
    const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = recentAlerts.filter(a => a.severity === 'high').length;
    const systemHealth = criticalAlerts > 0 ? 'unhealthy' : 
                        highAlerts > 3 ? 'degraded' : 'healthy';

    return {
      averageRequestDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      medianRequestDuration: durations[Math.floor(durations.length / 2)] || 0,
      p95RequestDuration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99RequestDuration: durations[Math.floor(durations.length * 0.99)] || 0,
      averageMemoryUsage: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
      peakMemoryUsage: Math.max(...memoryUsages),
      totalRequests: this.metrics.length,
      errorRate: errorRequests.length / this.metrics.length,
      throughput,
      recentAlerts: recentAlerts.slice(-10), // Last 10 alerts
      systemHealth,
    };
  }

  /**
   * Get Prometheus-compatible metrics
   */
  getPrometheusMetrics(): string {
    let output = '';

    // HTTP requests total
    output += '# HELP http_requests_total Total number of HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    for (const [key, count] of Array.from(this.prometheusMetrics.http_requests_total.entries())) {
      const [method, endpoint, status] = key.split('_');
      output += `http_requests_total{method="${method}",endpoint="${endpoint}",status="${status}"} ${count}\n`;
    }

    // Memory usage
    output += '# HELP memory_usage_bytes Current memory usage in bytes\n';
    output += '# TYPE memory_usage_bytes gauge\n';
    output += `memory_usage_bytes ${this.prometheusMetrics.memory_usage_bytes}\n`;

    // CPU usage
    output += '# HELP cpu_usage_percent Current CPU usage percentage\n';
    output += '# TYPE cpu_usage_percent gauge\n';
    output += `cpu_usage_percent ${this.prometheusMetrics.cpu_usage_percent}\n`;

    return output;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 20): PerformanceAlert[] {
    return this.alerts.slice(-count);
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
    this.prometheusMetrics.http_requests_total.clear();
    this.prometheusMetrics.http_request_duration_seconds.clear();
  }

  /**
   * Create Express/Next.js middleware for automatic performance tracking
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const trackingId = this.startTracking('http_request');
      
      // Store original end function
      const originalEnd = res.end;
      
      // Override end function to capture metrics
      res.end = (...args: any[]) => {
        this.endTracking(trackingId, {
          endpoint: req.route?.path || req.url,
          method: req.method,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
        });
        
        // Call original end function
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Track function execution performance
   */
  trackFunction<T extends (...args: any[]) => any>(
    fn: T,
    functionName: string
  ): T {
    return ((...args: any[]) => {
      const trackingId = this.startTracking(`function_${functionName}`);
      
      try {
        const result = fn(...args);
        
        // Handle async functions
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            this.endTracking(trackingId, { endpoint: functionName });
          });
        }
        
        // Handle sync functions
        this.endTracking(trackingId, { endpoint: functionName });
        return result;
      } catch (error) {
        this.endTracking(trackingId, { 
          endpoint: functionName, 
          statusCode: 500 
        });
        throw error;
      }
    }) as T;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitoringService(); 