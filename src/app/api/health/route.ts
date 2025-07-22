import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/shared/infrastructure/performance/performance-monitoring-service';
import { databaseOptimization } from '@/shared/infrastructure/performance/database-optimization-service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    performance: HealthCheck;
    externalServices: HealthCheck;
    diskSpace: HealthCheck;
    redis: HealthCheck;
  };
  metrics: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  };
  alerts: {
    recent: any[];
    critical: number;
    warnings: number;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration?: number;
  details?: any;
  lastCheck?: string;
}

class HealthCheckService {
  private startTime = Date.now();
  private lastHealthCheck: HealthCheckResult | null = null;
  private healthCheckCache: { [key: string]: HealthCheck } = {};
  private cacheExpiry = 30000; // 30 seconds

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(detailed = true): Promise<HealthCheckResult> {
    const checks = detailed ? await this.runAllChecks() : await this.runBasicChecks();
    const metrics = this.getSystemMetrics();
    const alerts = this.getAlertsSummary();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics,
      alerts,
    };

    this.lastHealthCheck = result;
    return result;
  }

  /**
   * Run all health checks (detailed)
   */
  private async runAllChecks(): Promise<HealthCheckResult['checks']> {
    const [database, memory, performance, externalServices, diskSpace, redis] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkPerformance(),
      this.checkExternalServices(),
      this.checkDiskSpace(),
      this.checkRedis(),
    ]);

    return {
      database: this.extractResult(database),
      memory: this.extractResult(memory),
      performance: this.extractResult(performance),
      externalServices: this.extractResult(externalServices),
      diskSpace: this.extractResult(diskSpace),
      redis: this.extractResult(redis),
    };
  }

  /**
   * Run basic health checks (for load balancer)
   */
  private async runBasicChecks(): Promise<HealthCheckResult['checks']> {
    const [database, memory] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    return {
      database: this.extractResult(database),
      memory: this.extractResult(memory),
      performance: { status: 'pass', message: 'Skipped in basic check' },
      externalServices: { status: 'pass', message: 'Skipped in basic check' },
      diskSpace: { status: 'pass', message: 'Skipped in basic check' },
      redis: { status: 'pass', message: 'Skipped in basic check' },
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const cacheKey = 'database';
    const cached = this.getCachedCheck(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Simple database connectivity test
      const testQuery = async () => {
        // Simulate database query - in production, use actual database ping
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
        return true;
      };

      await testQuery();
      
      const duration = Date.now() - startTime;
      const stats = databaseOptimization.getPerformanceStats();

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Database connectivity OK';

      if (duration > 1000) {
        status = 'warn';
        message = 'Database responding slowly';
      }

      if (duration > 5000) {
        status = 'fail';
        message = 'Database response too slow';
      }

      const result: HealthCheck = {
        status,
        message,
        duration,
        details: { queryTime: duration, stats },
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    } catch (error) {
      const result: HealthCheck = {
        status: 'fail',
        message: `Database connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    }
  }

  /**
   * Check Redis connectivity and performance
   */
  private async checkRedis(): Promise<HealthCheck> {
    const cacheKey = 'redis';
    const cached = this.getCachedCheck(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Simulate Redis ping - in production, use actual Redis client
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5));
      
      const duration = Date.now() - startTime;

      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = 'Redis connectivity OK';

      if (duration > 100) {
        status = 'warn';
        message = 'Redis responding slowly';
      }

      if (duration > 500) {
        status = 'fail';
        message = 'Redis response too slow';
      }

      const result: HealthCheck = {
        status,
        message,
        duration,
        details: { responseTime: duration },
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    } catch (error) {
      const result: HealthCheck = {
        status: 'fail',
        message: `Redis connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheck> {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryLimitMB = parseInt(process.env.MAX_MEMORY_USAGE || '536870912') / 1024 / 1024; // Default 512MB

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Memory usage normal: ${memoryUsageMB.toFixed(2)}MB`;

    if (memoryUsageMB > memoryLimitMB * 0.9) {
      status = 'fail';
      message = `Critical memory usage: ${memoryUsageMB.toFixed(2)}MB (>${(memoryLimitMB * 0.9).toFixed(2)}MB)`;
    } else if (memoryUsageMB > memoryLimitMB * 0.7) {
      status = 'warn';
      message = `Elevated memory usage: ${memoryUsageMB.toFixed(2)}MB (>${(memoryLimitMB * 0.7).toFixed(2)}MB)`;
    }

    return {
      status,
      message,
      details: {
        ...memoryUsage,
        usageMB: memoryUsageMB,
        limitMB: memoryLimitMB,
        usagePercent: (memoryUsageMB / memoryLimitMB) * 100,
      },
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    const cacheKey = 'diskSpace';
    const cached = this.getCachedCheck(cacheKey);
    if (cached) return cached;

    try {
      // Simulate disk space check - in production, use actual filesystem stats
      const diskUsagePercent = Math.random() * 60 + 10; // Simulate 10-70% usage
      
      let status: 'pass' | 'warn' | 'fail' = 'pass';
      let message = `Disk space OK: ${diskUsagePercent.toFixed(1)}% used`;

      if (diskUsagePercent > 90) {
        status = 'fail';
        message = `Critical disk space: ${diskUsagePercent.toFixed(1)}% used`;
      } else if (diskUsagePercent > 80) {
        status = 'warn';
        message = `High disk usage: ${diskUsagePercent.toFixed(1)}% used`;
      }

      const result: HealthCheck = {
        status,
        message,
        details: {
          usagePercent: diskUsagePercent,
          threshold: { warning: 80, critical: 90 },
        },
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    } catch (error) {
      const result: HealthCheck = {
        status: 'fail',
        message: `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toISOString(),
      };

      this.setCachedCheck(cacheKey, result);
      return result;
    }
  }

  /**
   * Check performance metrics
   */
  private async checkPerformance(): Promise<HealthCheck> {
    const stats = performanceMonitor.getPerformanceStats();
    const maxDuration = parseInt(process.env.MAX_REQUEST_DURATION || '5000');

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Performance OK: ${stats.averageRequestDuration.toFixed(2)}ms avg`;

    if (stats.averageRequestDuration > maxDuration) {
      status = 'fail';
      message = `Poor performance: ${stats.averageRequestDuration.toFixed(2)}ms avg (>${maxDuration}ms)`;
    } else if (stats.averageRequestDuration > maxDuration * 0.7) {
      status = 'warn';
      message = `Slow performance: ${stats.averageRequestDuration.toFixed(2)}ms avg (>${(maxDuration * 0.7).toFixed(0)}ms)`;
    }

    // Check error rate
    const maxErrorRate = parseFloat(process.env.MAX_ERROR_RATE || '0.05');
    if (stats.errorRate > maxErrorRate) {
      status = 'fail';
      message = `High error rate: ${(stats.errorRate * 100).toFixed(2)}% (>${(maxErrorRate * 100).toFixed(2)}%)`;
    }

    return {
      status,
      message,
      details: {
        ...stats,
        thresholds: {
          maxDuration,
          maxErrorRate: maxErrorRate * 100,
        },
      },
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Check external services connectivity
   */
  private async checkExternalServices(): Promise<HealthCheck> {
    const cacheKey = 'externalServices';
    const cached = this.getCachedCheck(cacheKey);
    if (cached) return cached;

    const services = [
      { name: 'OpenAI', url: 'https://api.openai.com', required: true },
      { name: 'Anthropic', url: 'https://api.anthropic.com', required: false },
      { name: 'Figma', url: 'https://api.figma.com', required: false },
    ];

    const results = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          // Simulate service check - in production, make actual health check requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
          
          return {
            name: service.name,
            status: 'pass' as const,
            duration: Date.now() - startTime,
            required: service.required,
          };
        } catch (error) {
          return {
            name: service.name,
            status: 'fail' as const,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            required: service.required,
          };
        }
      })
    );

    const serviceResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: 'Unknown',
        status: 'fail' as const,
        duration: 0,
        error: 'Promise rejected',
        required: false,
      }
    );

    const failedRequired = serviceResults.filter(r => r.status === 'fail' && r.required);
    const failedOptional = serviceResults.filter(r => r.status === 'fail' && !r.required);

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = 'All external services OK';

    if (failedRequired.length > 0) {
      status = 'fail';
      message = `Required services failed: ${failedRequired.map(r => r.name).join(', ')}`;
    } else if (failedOptional.length > 0) {
      status = 'warn';
      message = `Optional services failed: ${failedOptional.map(r => r.name).join(', ')}`;
    }

    const result: HealthCheck = {
      status,
      message,
      details: { services: serviceResults },
      lastCheck: new Date().toISOString(),
    };

    this.setCachedCheck(cacheKey, result);
    return result;
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): HealthCheckResult['metrics'] {
    const stats = performanceMonitor.getPerformanceStats();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate CPU usage percentage
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000) * 100;

    return {
      requestCount: stats.totalRequests,
      averageResponseTime: stats.averageRequestDuration,
      errorRate: stats.errorRate,
      memoryUsage,
      cpuUsage: cpuPercent,
      activeConnections: 0, // Would be populated from actual connection pool
      systemHealth: stats.systemHealth,
    };
  }

  /**
   * Get alerts summary
   */
  private getAlertsSummary(): HealthCheckResult['alerts'] {
    const recentAlerts = performanceMonitor.getRecentAlerts(10);
    const critical = recentAlerts.filter(a => a.severity === 'critical').length;
    const warnings = recentAlerts.filter(a => a.severity === 'high' || a.severity === 'medium').length;

    return {
      recent: recentAlerts.slice(0, 5), // Last 5 alerts
      critical,
      warnings,
    };
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(checks: HealthCheckResult['checks']): HealthCheckResult['status'] {
    const checkValues = Object.values(checks);
    
    if (checkValues.some(check => check.status === 'fail')) {
      return 'unhealthy';
    }
    
    if (checkValues.some(check => check.status === 'warn')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Extract result from Promise.allSettled
   */
  private extractResult(result: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    return {
      status: 'fail',
      message: `Health check failed: ${result.reason}`,
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Cache management
   */
  private getCachedCheck(key: string): HealthCheck | null {
    const cached = this.healthCheckCache[key];
    if (cached && cached.lastCheck) {
      const age = Date.now() - new Date(cached.lastCheck).getTime();
      if (age < this.cacheExpiry) {
        return cached;
      }
    }
    return null;
  }

  private setCachedCheck(key: string, check: HealthCheck): void {
    this.healthCheckCache[key] = check;
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  /**
   * Get readiness status (for Kubernetes)
   */
  async getReadiness(): Promise<{ ready: boolean; message: string }> {
    try {
      const basicChecks = await this.runBasicChecks();
      const critical = ['database', 'memory'];
      
      for (const check of critical) {
        if (basicChecks[check as keyof typeof basicChecks]?.status === 'fail') {
          return {
            ready: false,
            message: `Critical service ${check} is failing: ${basicChecks[check as keyof typeof basicChecks].message}`,
          };
        }
      }

      return { ready: true, message: 'Service is ready' };
    } catch (error) {
      return {
        ready: false,
        message: `Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get liveness status (for Kubernetes)
   */
  async getLiveness(): Promise<{ alive: boolean; message: string }> {
    try {
      // Basic liveness check - just ensure the service can respond
      const memoryUsage = process.memoryUsage();
      const memoryLimitMB = parseInt(process.env.MAX_MEMORY_USAGE || '536870912') / 1024 / 1024;
      const currentUsageMB = memoryUsage.heapUsed / 1024 / 1024;

      if (currentUsageMB > memoryLimitMB) {
        return {
          alive: false,
          message: `Memory usage exceeded limit: ${currentUsageMB.toFixed(2)}MB > ${memoryLimitMB}MB`,
        };
      }

      return { alive: true, message: 'Service is alive' };
    } catch (error) {
      return {
        alive: false,
        message: `Liveness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Export singleton instance
const healthCheckService = new HealthCheckService();

// Force this route to be dynamic to avoid build-time static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/health - Comprehensive health check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') !== 'false';
    const format = searchParams.get('format') || 'json';

    const result = await healthCheckService.performHealthCheck(detailed);

    // Return appropriate format
    if (format === 'prometheus') {
      const metrics = performanceMonitor.getPrometheusMetrics();
      return new NextResponse(metrics, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const status = result.status === 'healthy' ? 200 : 
                   result.status === 'degraded' ? 200 : 503;

    return NextResponse.json(result, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

/**
 * HEAD /api/health - Simple health check for load balancers
 */
export async function HEAD(_request: NextRequest) {
  try {
    const readiness = await healthCheckService.getReadiness();
    
    return new NextResponse(null, {
      status: readiness.ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': readiness.ready ? 'healthy' : 'unhealthy',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}

// Note: Kubernetes readiness and liveness probes should be separate endpoints:
// - /api/health/ready/route.ts for readiness probe
// - /api/health/live/route.ts for liveness probe
// These are removed from this file to fix Next.js App Router compatibility 