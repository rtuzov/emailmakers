/**
 * 📊 DASHBOARD CONTENT V2
 * 
 * Обновленная версия dashboard с исправлением hydration errors
 * Использует новую систему client-only рендеринга
 */

'use client'

import React from 'react'
import { useClientData } from '../../hooks/useClientOnly'
import { ClientOnlyWrapper, DashboardSkeleton } from '../../components/shared/ClientOnlyWrapper'

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  duration?: number;
  details?: any;
  lastCheck?: string;
}

interface SystemHealth {
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

interface UserAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
    engagementMetrics: {
      averageSessionDuration: number;
      pageViewsPerSession: number;
      bounceRate: number;
      conversionMetrics: {
        signupToFirstTemplate: number;
        templateCompletionRate: number;
        featureAdoptionRate: {
          aiGeneration: number;
          designSystem: number;
          qualityTesting: number;
        };
      };
    };
    userRetention: {
      day1: number;
      day7: number;
      day30: number;
    };
  };
  demographics: {
    roleDistribution: Array<{
      role: string;
      count: number;
      percentage: number;
    }>;
    registrationTrends: Array<{
      period: string;
      count: number;
    }>;
    verificationStatus: {
      verified: number;
      unverified: number;
      verificationRate: number;
    };
  };
  usage: {
    apiKeysConfigured: number;
    servicesUsed: Array<{
      service: string;
      userCount: number;
    }>;
    contentBriefsCreated: number;
    averageContentBriefsPerUser: number;
  };
  timeDistribution: Array<{
    hour: number;
    activeUsers: number;
    templatesCreated: number;
  }>;
}

interface DashboardMetrics {
  systemStats: {
    templateCount: number;
    successRate: number;
    activeAgents: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  recent: {
    generatedTemplates: number;
    failedRequests: number;
    averageQualityScore: number;
    totalUsers: number;
    newTemplatesLast24h: number;
    averageGenerationTime: number;
    queueLength: number;
    agentUtilization: number;
  };
  agentMetrics?: {
    contentSpecialist: {
      status: 'active' | 'idle' | 'error';
      processedJobs: number;
      successRate: number;
      averageProcessingTime: number;
    };
    designSpecialist: {
      status: 'active' | 'idle' | 'error';
      processedJobs: number;
      successRate: number;
      averageProcessingTime: number;
    };
    qualitySpecialist: {
      status: 'active' | 'idle' | 'error';
      processedJobs: number;
      successRate: number;
      averageProcessingTime: number;
    };
    deliverySpecialist: {
      status: 'active' | 'idle' | 'error';
      processedJobs: number;
      successRate: number;
      averageProcessingTime: number;
    };
  };
  emailGeneration?: {
    daily: {
      total: number;
      successful: number;
      failed: number;
      avgQualityScore: number;
    };
    weekly: {
      total: number;
      successful: number;
      failed: number;
      avgQualityScore: number;
      improvement: number;
    };
    monthly: {
      total: number;
      successful: number;
      failed: number;
      avgQualityScore: number;
      improvement: number;
    };
  };
  systemHealth?: SystemHealth;
  userAnalytics?: UserAnalytics;
}

interface ApiResponse {
  success: boolean;
  metrics: DashboardMetrics;
  error?: string;
  timestamp: string;
}

export default function DashboardContentV2() {
  // Функция для загрузки данных dashboard
  const fetchDashboardData = async (): Promise<DashboardMetrics> => {
    // Fetch metrics, health data, and user analytics in parallel
    const [metricsResponse, healthResponse, userAnalyticsResponse] = await Promise.all([
      fetch('/api/metrics/dashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }),
      fetch('/api/analytics/users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
    ]);

    if (!metricsResponse.ok) {
      throw new Error(`Failed to fetch metrics: ${metricsResponse.status}`);
    }

    const metricsData: ApiResponse = await metricsResponse.json();
    
    if (!metricsData.success) {
      throw new Error(metricsData.error || 'Failed to get metrics');
    }

    // Parse health data if available
    let healthData: SystemHealth | undefined;
    if (healthResponse.ok) {
      healthData = await healthResponse.json();
    }

    // Parse user analytics data if available
    let userAnalyticsData: UserAnalytics | undefined;
    if (userAnalyticsResponse.ok) {
      const response = await userAnalyticsResponse.json();
      if (response.success) {
        userAnalyticsData = response.analytics;
      }
    }

    // Combine metrics, health data, and user analytics
    return {
      ...metricsData.metrics,
      systemHealth: healthData,
      userAnalytics: userAnalyticsData
    };
  };

  // Используем новый hook для безопасной загрузки данных
  const { data: metrics, loading: isLoading, error, isClient } = useClientData(
    fetchDashboardData,
    // Fallback data для предотвращения hydration errors
    {
      systemStats: {
        templateCount: 0,
        successRate: 0,
        activeAgents: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0,
      },
      recent: {
        generatedTemplates: 0,
        failedRequests: 0,
        averageQualityScore: 0,
        totalUsers: 0,
        newTemplatesLast24h: 0,
        averageGenerationTime: 0,
        queueLength: 0,
        agentUtilization: 0,
      }
    }
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  const formatUptime = (uptime: number): string => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
      case 'pass':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'idle':
      case 'warn':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'fail':
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Обертка для предотвращения hydration errors
  return (
    <ClientOnlyWrapper fallback={<DashboardSkeleton />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error loading dashboard data</h3>
            <p className="text-red-600 text-sm mt-1">{error instanceof Error ? error.message : String(error)}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !metrics && (
          <DashboardSkeleton />
        )}

        {/* Dashboard Content */}
        {metrics && (
          <>
            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Templates</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(metrics.systemStats.templateCount)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  +{metrics.recent.newTemplatesLast24h} last 24h
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</h3>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.systemStats.successRate}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Quality: {metrics.recent.averageQualityScore}/100
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Agents</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.systemStats.activeAgents}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Utilization: {metrics.recent.agentUtilization}%
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Response Time</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {metrics.systemStats.averageResponseTime}ms
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Error rate: {metrics.systemStats.errorRate}%
                </p>
              </div>
            </div>

            {/* Agent Status */}
            {metrics.agentMetrics && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Agent Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(metrics.agentMetrics).map(([agentName, agent]) => (
                    <div key={agentName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                          {agentName.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <div>Jobs: {agent.processedJobs}</div>
                        <div>Success: {agent.successRate}%</div>
                        <div>Avg Time: {agent.averageProcessingTime}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Health */}
            {metrics.systemHealth && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  System Health
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(metrics.systemHealth.checks).map(([checkName, check]) => (
                    <div key={checkName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                          {checkName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {check.message}
                      </p>
                      {check.duration && (
                        <p className="text-xs text-gray-500 mt-1">
                          {check.duration}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ClientOnlyWrapper>
  );
}