'use client'

import React, { useState, useEffect } from 'react'

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
  };
  activity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    totalSessions: number;
    averageSessionsPerUser: number;
  };
  engagement: {
    templatesPerUser: number;
    activeCreators: number;
    topUsersBy: {
      templates: Array<{
        userId: string;
        email: string;
        templateCount: number;
        lastActive: string;
      }>;
      activity: Array<{
        userId: string;
        email: string;
        sessionCount: number;
        lastSession: string;
      }>;
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
      averageTime: number;
    };
    weekly: {
      total: number;
      successful: number;
      failed: number;
      averageTime: number;
    };
    monthly: {
      total: number;
      successful: number;
      failed: number;
      averageTime: number;
    };
    topCategories: Array<{
      category: string;
      count: number;
      successRate: number;
    }>;
    timeDistribution: Array<{
      hour: number;
      count: number;
    }>;
  };
  systemHealth?: SystemHealth;
  userAnalytics?: UserAnalytics;
}

interface ApiResponse {
  success: boolean;
  metrics: DashboardMetrics;
  timestamp: string;
  error?: string;
}

export default function DashboardContent() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
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
        ])

        if (!metricsResponse.ok) {
          throw new Error(`Failed to fetch metrics: ${metricsResponse.status}`)
        }

        const metricsData: ApiResponse = await metricsResponse.json()
        
        if (!metricsData.success) {
          throw new Error(metricsData.error || 'Failed to get metrics')
        }

        // Parse health data if available
        let healthData: SystemHealth | undefined
        if (healthResponse.ok) {
          healthData = await healthResponse.json()
        }

        // Parse user analytics data if available
        let userAnalyticsData: UserAnalytics | undefined
        if (userAnalyticsResponse.ok) {
          const analyticsResponse = await userAnalyticsResponse.json()
          if (analyticsResponse.success) {
            userAnalyticsData = analyticsResponse.analytics
          }
        }

        // Combine metrics, health data, and user analytics
        const combinedMetrics = {
          ...metricsData.metrics,
          systemHealth: healthData,
          userAnalytics: userAnalyticsData
        }

        setMetrics(combinedMetrics)
        setError(null)
      } catch (err) {
        console.error('Dashboard data error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        
        // Fallback to mock data on error
        setMetrics({
          systemStats: {
            templateCount: 127,
            successRate: 92,
            activeAgents: 4,
            totalRequests: 1543,
            averageResponseTime: 850,
            errorRate: 2,
            uptime: Date.now() - 24 * 60 * 60 * 1000,
          },
          recent: {
            generatedTemplates: 12,
            failedRequests: 1,
            averageQualityScore: 89,
            totalUsers: 167,
          },
          agentMetrics: {
            contentSpecialist: {
              status: 'active' as const,
              processedJobs: 42,
              successRate: 94,
              averageProcessingTime: 1200,
            },
            designSpecialist: {
              status: 'active' as const,
              processedJobs: 38,
              successRate: 91,
              averageProcessingTime: 1800,
            },
            qualitySpecialist: {
              status: 'active' as const,
              processedJobs: 56,
              successRate: 97,
              averageProcessingTime: 900,
            },
            deliverySpecialist: {
              status: 'active' as const,
              processedJobs: 35,
              successRate: 93,
              averageProcessingTime: 650,
            },
          },
          emailGeneration: {
            daily: { total: 12, successful: 11, failed: 1, averageTime: 1200 },
            weekly: { total: 85, successful: 78, failed: 7, averageTime: 1350 },
            monthly: { total: 342, successful: 318, failed: 24, averageTime: 1420 },
            topCategories: [
              { category: 'Marketing', count: 45, successRate: 89 },
              { category: 'Newsletter', count: 32, successRate: 94 },
              { category: 'Transactional', count: 28, successRate: 97 },
            ],
            timeDistribution: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              count: Math.floor(Math.random() * 10) + 2,
            })),
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toLocaleString()
  }

  const formatUptime = (uptime: number): string => {
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`
    }
    return `${hours}h`
  }

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-white/20 rounded mb-2"></div>
                  <div className="h-8 bg-white/20 rounded mb-2"></div>
                  <div className="h-3 bg-white/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error} (using fallback data)
            </div>
          )}
          {isLoading && (
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm">
              Updating...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Templates Created</h3>
            <p className="text-3xl font-bold text-green-400">
              {metrics ? formatNumber(metrics.systemStats.templateCount) : '---'}
            </p>
            <p className="text-green-400 text-sm">
              {metrics ? `${metrics.recent.generatedTemplates} recent` : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Success Rate</h3>
            <p className="text-3xl font-bold text-blue-400">
              {metrics ? `${metrics.systemStats.successRate}%` : '---'}
            </p>
            <p className="text-blue-400 text-sm">
              {metrics ? `${metrics.systemStats.errorRate}% error rate` : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Active Agents</h3>
            <p className="text-3xl font-bold text-purple-400">
              {metrics ? metrics.systemStats.activeAgents : '---'}
            </p>
            <p className="text-purple-400 text-sm">
              {metrics ? `Avg: ${metrics.systemStats.averageResponseTime}ms` : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">System Uptime</h3>
            <p className="text-3xl font-bold text-orange-400">
              {metrics ? formatUptime(metrics.systemStats.uptime) : '---'}
            </p>
            <p className="text-orange-400 text-sm">
              {metrics ? `${formatNumber(metrics.systemStats.totalRequests)} requests` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Email Generation Statistics Section */}
        {metrics && metrics.emailGeneration && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Email Generation Statistics</h3>
              
              {/* Period Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Daily Statistics */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-3">📅 Daily</h4>
                  <div className="text-2xl font-bold text-green-400 mb-2">
                    {metrics.emailGeneration.daily.total}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">✅ {metrics.emailGeneration.daily.successful} successful</div>
                    <div className="text-red-300">❌ {metrics.emailGeneration.daily.failed} failed</div>
                    <div className="text-white/60">⏱️ {metrics.emailGeneration.daily.averageTime}ms avg</div>
                  </div>
                </div>

                {/* Weekly Statistics */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-3">📊 Weekly</h4>
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {metrics.emailGeneration.weekly.total}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">✅ {metrics.emailGeneration.weekly.successful} successful</div>
                    <div className="text-red-300">❌ {metrics.emailGeneration.weekly.failed} failed</div>
                    <div className="text-white/60">⏱️ {metrics.emailGeneration.weekly.averageTime}ms avg</div>
                  </div>
                </div>

                {/* Monthly Statistics */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-purple-400 font-semibold mb-3">📈 Monthly</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {metrics.emailGeneration.monthly.total}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-green-300">✅ {metrics.emailGeneration.monthly.successful} successful</div>
                    <div className="text-red-300">❌ {metrics.emailGeneration.monthly.failed} failed</div>
                    <div className="text-white/60">⏱️ {metrics.emailGeneration.monthly.averageTime}ms avg</div>
                  </div>
                </div>
              </div>

              {/* Top Categories and Time Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Categories */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">🏷️ Top Categories</h4>
                  <div className="space-y-3">
                    {metrics.emailGeneration.topCategories.map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-yellow-400 font-bold">#{index + 1}</span>
                          <span className="text-white">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-semibold">{category.count} emails</div>
                          <div className="text-green-400 text-sm">{category.successRate}% success</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 24-Hour Distribution Chart */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">🕒 24-Hour Distribution</h4>
                  <div className="flex items-end justify-between h-32 space-x-1">
                    {metrics.emailGeneration.timeDistribution.map((hour) => {
                      const maxCount = Math.max(...metrics.emailGeneration.timeDistribution.map(h => h.count));
                      const heightPercentage = (hour.count / maxCount) * 100;
                      
                      return (
                        <div key={hour.hour} className="flex flex-col items-center space-y-1">
                          <div
                            className="bg-gradient-to-t from-blue-400 to-green-400 rounded-t"
                            style={{ height: `${heightPercentage}%`, minHeight: '4px', width: '12px' }}
                            title={`${hour.count} emails at ${hour.hour}:00`}
                          ></div>
                          <span className="text-xs text-white/60 transform rotate-45 origin-bottom-left">
                            {hour.hour.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Status Section */}
        {metrics && metrics.agentMetrics && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Agent Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Content Specialist */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">📝</span>
                      <span className="text-white font-semibold">Content Specialist</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      metrics.agentMetrics.contentSpecialist.status === 'active' ? 'text-green-400' :
                      metrics.agentMetrics.contentSpecialist.status === 'idle' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metrics.agentMetrics.contentSpecialist.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Jobs Processed</span>
                      <span className="text-white">{metrics.agentMetrics.contentSpecialist.processedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Success Rate</span>
                      <span className="text-green-400">{metrics.agentMetrics.contentSpecialist.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Avg Time</span>
                      <span className="text-blue-400">{metrics.agentMetrics.contentSpecialist.averageProcessingTime}ms</span>
                    </div>
                  </div>
                </div>

                {/* Design Specialist */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🎨</span>
                      <span className="text-white font-semibold">Design Specialist</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      metrics.agentMetrics.designSpecialist.status === 'active' ? 'text-green-400' :
                      metrics.agentMetrics.designSpecialist.status === 'idle' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metrics.agentMetrics.designSpecialist.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Jobs Processed</span>
                      <span className="text-white">{metrics.agentMetrics.designSpecialist.processedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Success Rate</span>
                      <span className="text-green-400">{metrics.agentMetrics.designSpecialist.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Avg Time</span>
                      <span className="text-blue-400">{metrics.agentMetrics.designSpecialist.averageProcessingTime}ms</span>
                    </div>
                  </div>
                </div>

                {/* Quality Specialist */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🔍</span>
                      <span className="text-white font-semibold">Quality Specialist</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      metrics.agentMetrics.qualitySpecialist.status === 'active' ? 'text-green-400' :
                      metrics.agentMetrics.qualitySpecialist.status === 'idle' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metrics.agentMetrics.qualitySpecialist.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Jobs Processed</span>
                      <span className="text-white">{metrics.agentMetrics.qualitySpecialist.processedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Success Rate</span>
                      <span className="text-green-400">{metrics.agentMetrics.qualitySpecialist.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Avg Time</span>
                      <span className="text-blue-400">{metrics.agentMetrics.qualitySpecialist.averageProcessingTime}ms</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Specialist */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🚀</span>
                      <span className="text-white font-semibold">Delivery Specialist</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      metrics.agentMetrics.deliverySpecialist.status === 'active' ? 'text-green-400' :
                      metrics.agentMetrics.deliverySpecialist.status === 'idle' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {metrics.agentMetrics.deliverySpecialist.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Jobs Processed</span>
                      <span className="text-white">{metrics.agentMetrics.deliverySpecialist.processedJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Success Rate</span>
                      <span className="text-green-400">{metrics.agentMetrics.deliverySpecialist.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Avg Time</span>
                      <span className="text-blue-400">{metrics.agentMetrics.deliverySpecialist.averageProcessingTime}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Health Monitoring Section */}
        {metrics && metrics.systemHealth && (
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">System Health Monitoring</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    metrics.systemHealth.status === 'healthy' ? 'bg-green-400' :
                    metrics.systemHealth.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    metrics.systemHealth.status === 'healthy' ? 'text-green-400' :
                    metrics.systemHealth.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {metrics.systemHealth.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* System Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Version</div>
                  <div className="text-lg font-semibold text-white">{metrics.systemHealth.version}</div>
                  <div className="text-xs text-blue-400">{metrics.systemHealth.environment}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Uptime</div>
                  <div className="text-lg font-semibold text-white">
                    {Math.floor(metrics.systemHealth.uptime / (1000 * 60 * 60))}h
                  </div>
                  <div className="text-xs text-green-400">Running</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Memory Usage</div>
                  <div className="text-lg font-semibold text-white">
                    {Math.round(metrics.systemHealth.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB
                  </div>
                  <div className="text-xs text-blue-400">
                    {Math.round((metrics.systemHealth.metrics.memoryUsage.heapUsed / metrics.systemHealth.metrics.memoryUsage.heapTotal) * 100)}% used
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">CPU Usage</div>
                  <div className="text-lg font-semibold text-white">
                    {Math.round(metrics.systemHealth.metrics.cpuUsage / 10000)}%
                  </div>
                  <div className="text-xs text-purple-400">Normal</div>
                </div>
              </div>

              {/* Health Checks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(metrics.systemHealth.checks).map(([checkName, check]) => (
                  <div key={checkName} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {checkName === 'database' ? '🗄️' :
                           checkName === 'memory' ? '💾' :
                           checkName === 'performance' ? '⚡' :
                           checkName === 'externalServices' ? '🌐' :
                           checkName === 'diskSpace' ? '💽' :
                           checkName === 'redis' ? '🔴' : '⚙️'}
                        </span>
                        <span className="text-white font-medium capitalize">
                          {checkName.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        check.status === 'pass' ? 'text-green-400 bg-green-400/10' :
                        check.status === 'warn' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'
                      }`}>
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-white/80 mb-1">{check.message}</div>
                    {check.duration && (
                      <div className="text-xs text-blue-400">
                        Response: {check.duration}ms
                      </div>
                    )}
                    {check.lastCheck && (
                      <div className="text-xs text-white/40">
                        Last: {new Date(check.lastCheck).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Alerts Section */}
              {(metrics.systemHealth.alerts.critical > 0 || metrics.systemHealth.alerts.warnings > 0) && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">🚨 System Alerts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.systemHealth.alerts.critical > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-400 font-bold">🔴</span>
                          <span className="text-red-400 font-semibold">
                            {metrics.systemHealth.alerts.critical} Critical Alert{metrics.systemHealth.alerts.critical !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    {metrics.systemHealth.alerts.warnings > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400 font-bold">⚠️</span>
                          <span className="text-yellow-400 font-semibold">
                            {metrics.systemHealth.alerts.warnings} Warning{metrics.systemHealth.alerts.warnings !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Recent Alerts */}
                  {metrics.systemHealth.alerts.recent.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-white/60 mb-2">Recent Alerts:</div>
                      <div className="space-y-1">
                        {metrics.systemHealth.alerts.recent.slice(0, 3).map((alert, index) => (
                          <div key={index} className="text-sm text-white/80 bg-white/5 rounded px-2 py-1">
                            {alert.message || 'System alert detected'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Alerts State */}
              {metrics.systemHealth.alerts.critical === 0 && metrics.systemHealth.alerts.warnings === 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-lg">✅</span>
                    <span className="text-green-400 font-semibold">All Systems Operational</span>
                  </div>
                  <div className="text-sm text-green-400/80 mt-1">
                    No critical issues or warnings detected
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">System Overview</h2>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Generated Templates</h3>
                      <p className="text-sm text-white/60">Last 24 hours</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {metrics ? metrics.recent.generatedTemplates : '---'}
                      </div>
                      <div className="text-xs text-white/60">Templates</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Quality Score</h3>
                      <p className="text-sm text-white/60">Average quality</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {metrics ? `${metrics.recent.averageQualityScore}%` : '---'}
                      </div>
                      <div className="text-xs text-white/60">Quality</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Active Users</h3>
                      <p className="text-sm text-white/60">Total registered</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-400">
                        {metrics ? formatNumber(metrics.recent.totalUsers) : '---'}
                      </div>
                      <div className="text-xs text-white/60">Users</div>
                    </div>
                  </div>
                </div>

                {metrics && metrics.recent.failedRequests > 0 && (
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-red-400">Failed Requests</h3>
                        <p className="text-sm text-red-400/60">Requires attention</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-400">
                          {metrics.recent.failedRequests}
                        </div>
                        <div className="text-xs text-red-400/60">Errors</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <a 
                  href="/create" 
                  className="block w-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors rounded-lg p-3 text-left"
                >
                  <div className="font-medium">Create New Template</div>
                  <div className="text-xs opacity-80">Start with AI assistance</div>
                </a>
                
                <a 
                  href="/templates" 
                  className="block w-full bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors rounded-lg p-3 text-left"
                >
                  <div className="font-medium">Browse Templates</div>
                  <div className="text-xs opacity-80">Explore our library</div>
                </a>
                
                <a 
                  href="/optimization-dashboard" 
                  className="block w-full bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors rounded-lg p-3 text-left"
                >
                  <div className="font-medium">View Analytics</div>
                  <div className="text-xs opacity-80">Check performance</div>
                </a>

                <a 
                  href="/agent-debug" 
                  className="block w-full bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors rounded-lg p-3 text-left"
                >
                  <div className="font-medium">Debug Tools</div>
                  <div className="text-xs opacity-80">Agent debugging</div>
                </a>
              </div>
            </div>

            {/* Real-time status indicator */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">API Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    <span className={`text-sm ${error ? 'text-red-400' : 'text-green-400'}`}>
                      {error ? 'Degraded' : 'Operational'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Response Time</span>
                  <span className="text-sm text-blue-400">
                    {metrics ? `${metrics.systemStats.averageResponseTime}ms` : '---'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Last Updated</span>
                  <span className="text-sm text-purple-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Analytics Section */}
        {metrics && metrics.userAnalytics && (
          <div className="mt-8">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">👥 User Analytics</h3>
              
              {/* User Overview Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">📊 Total Users</h4>
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {formatNumber(metrics.userAnalytics.overview.totalUsers)}
                  </div>
                  <div className="text-xs text-white/60">
                    {metrics.userAnalytics.overview.activeUsers} active users
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-green-400 font-semibold mb-2">📈 Growth Rate</h4>
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {metrics.userAnalytics.overview.userGrowthRate > 0 ? '+' : ''}{metrics.userAnalytics.overview.userGrowthRate}%
                  </div>
                  <div className="text-xs text-white/60">
                    vs last month
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-purple-400 font-semibold mb-2">🎯 Active Today</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {metrics.userAnalytics.activity.dailyActiveUsers}
                  </div>
                  <div className="text-xs text-white/60">
                    {metrics.userAnalytics.overview.newUsersToday} new today
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-orange-400 font-semibold mb-2">⏱️ Avg Session</h4>
                  <div className="text-2xl font-bold text-orange-400 mb-1">
                    {metrics.userAnalytics.activity.averageSessionDuration}m
                  </div>
                  <div className="text-xs text-white/60">
                    {metrics.userAnalytics.activity.averageSessionsPerUser} sessions/user
                  </div>
                </div>
              </div>

              {/* User Activity & Engagement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Activity */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">📱 User Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Daily Active Users</span>
                      <span className="text-green-400 font-semibold">
                        {metrics.userAnalytics.activity.dailyActiveUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Weekly Active Users</span>
                      <span className="text-blue-400 font-semibold">
                        {metrics.userAnalytics.activity.weeklyActiveUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Monthly Active Users</span>
                      <span className="text-purple-400 font-semibold">
                        {metrics.userAnalytics.activity.monthlyActiveUsers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Total Sessions</span>
                      <span className="text-orange-400 font-semibold">
                        {formatNumber(metrics.userAnalytics.activity.totalSessions)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Engagement */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">💡 User Engagement</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Templates per User</span>
                      <span className="text-green-400 font-semibold">
                        {metrics.userAnalytics.engagement.templatesPerUser}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Active Creators</span>
                      <span className="text-blue-400 font-semibold">
                        {metrics.userAnalytics.engagement.activeCreators}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">7-day Retention</span>
                      <span className="text-purple-400 font-semibold">
                        {metrics.userAnalytics.engagement.userRetention.day7}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">30-day Retention</span>
                      <span className="text-orange-400 font-semibold">
                        {metrics.userAnalytics.engagement.userRetention.day30}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Users and Demographics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Users by Templates */}
                {metrics.userAnalytics.engagement.topUsersBy.templates.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-4">🏆 Top Template Creators</h4>
                    <div className="space-y-3">
                      {metrics.userAnalytics.engagement.topUsersBy.templates.slice(0, 5).map((user, index) => (
                        <div key={user.userId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60">#{index + 1}</span>
                            <span className="text-white/80 truncate max-w-[150px]">
                              {user.email.substring(0, user.email.indexOf('@'))}
                            </span>
                          </div>
                          <span className="text-green-400 font-semibold">
                            {user.templateCount} templates
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role Distribution */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">👤 Role Distribution</h4>
                  <div className="space-y-3">
                    {metrics.userAnalytics.demographics.roleDistribution.map((role) => (
                      <div key={role.role} className="flex items-center justify-between">
                        <span className="text-white/80 capitalize">{role.role}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-400 font-semibold">{role.count}</span>
                          <span className="text-white/60 text-sm">({role.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/80">Email Verification Rate</span>
                      <span className="text-green-400 font-semibold">
                        {metrics.userAnalytics.demographics.verificationStatus.verificationRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Usage */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">🔧 Service Usage</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">API Keys Configured</span>
                      <span className="text-green-400 font-semibold">
                        {metrics.userAnalytics.usage.apiKeysConfigured}
                      </span>
                    </div>
                    {metrics.userAnalytics.usage.servicesUsed.map((service) => (
                      <div key={service.service} className="flex items-center justify-between">
                        <span className="text-white/80 capitalize">{service.service}</span>
                        <span className="text-blue-400 font-semibold">
                          {service.userCount} users
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Content Briefs</span>
                      <span className="text-purple-400 font-semibold">
                        {metrics.userAnalytics.usage.contentBriefsCreated}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registration Trends (Last 6 Months) */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-4">📅 Registration Trends</h4>
                  <div className="space-y-2">
                    {metrics.userAnalytics.demographics.registrationTrends.slice(-6).map((trend) => {
                      const maxCount = Math.max(...metrics.userAnalytics!.demographics.registrationTrends.map(t => t.count));
                      const widthPercent = (trend.count / maxCount) * 100;
                      
                      return (
                        <div key={trend.period} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/80">{trend.period}</span>
                            <span className="text-blue-400 font-semibold">{trend.count}</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${widthPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 