'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  };
  uptime: number;
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
  agentMetrics?: {
    contentSpecialist: AgentMetrics;
    designSpecialist: AgentMetrics;
    qualitySpecialist: AgentMetrics;
    deliverySpecialist: AgentMetrics;
  };
  recent: {
    generatedTemplates: number;
    failedRequests: number;
    averageQualityScore: number;
    totalUsers: number;
  };
}

interface AgentMetrics {
  status: 'active' | 'idle' | 'error';
  processedJobs: number;
  successRate: number;
  averageProcessingTime: number;
}

interface SystemStats {
  templateCount: number;
  successRate: number;
  activeAgents: number;
  systemStatus: 'healthy' | 'degraded' | 'unhealthy';
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  recentTemplates: number;
  averageQualityScore: number;
}

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    templateCount: 127,
    successRate: 94,
    activeAgents: 4,
    systemStatus: 'healthy',
    totalRequests: 0,
    averageResponseTime: 0,
    errorRate: 0,
    recentTemplates: 0,
    averageQualityScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both health and metrics in parallel
        const [healthResponse, metricsResponse] = await Promise.all([
          fetch('/api/health?detailed=false'),
          fetch('/api/metrics/dashboard?agents=true&performance=false')
        ]);

        if (healthResponse.ok) {
          const health = await healthResponse.json();
          setHealthStatus(health);
          setSystemStats(prev => ({
            ...prev,
            systemStatus: health.status
          }));
        }

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          if (metricsData.success) {
            const metrics = metricsData.metrics;
            setDashboardMetrics(metrics);
            setSystemStats(prev => ({
              templateCount: metrics.systemStats.templateCount,
              successRate: metrics.systemStats.successRate,
              activeAgents: metrics.systemStats.activeAgents,
              systemStatus: prev.systemStatus, // Keep existing status, update from health separately
              totalRequests: metrics.systemStats.totalRequests,
              averageResponseTime: metrics.systemStats.averageResponseTime,
              errorRate: metrics.systemStats.errorRate,
              recentTemplates: metrics.recent.generatedTemplates,
              averageQualityScore: metrics.recent.averageQualityScore
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Set fallback values to prevent UI breaking
        setSystemStats(prev => ({ 
          ...prev, 
          systemStatus: 'unhealthy',
          errorRate: prev.errorRate || 10, // Ensure errorRate exists for status indicators
          averageResponseTime: prev.averageResponseTime || 3000, // Ensure responseTime exists
          activeAgents: prev.activeAgents || 0 // Ensure agents count exists
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'unhealthy': return 'text-red-400';
      default: return 'text-white/70';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="text-center max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Email<span className="text-kupibilet-primary">Makers</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
            AI-Powered Email Template Generation
          </p>
          <p className="text-lg text-white/70 mb-12 max-w-2xl mx-auto">
            Создавайте профессиональные email-шаблоны с помощью искусственного интеллекта. 
            Идеальная совместимость, современный дизайн, быстрая генерация.
          </p>
          
          {/* System Status Indicator */}
          {healthStatus && (
            <div className="mb-8 flex items-center justify-center gap-2">
              <span className="text-sm text-white/70">Статус системы:</span>
              <span className={`flex items-center gap-1 ${getStatusColor(systemStats.systemStatus)}`}>
                {getStatusIcon(systemStats.systemStatus)}
                <span className="text-sm font-medium capitalize">{systemStats.systemStatus}</span>
              </span>
              <span className="text-xs text-white/50 ml-2">
                {Math.round(healthStatus.uptime / 1000 / 60)}м работы
              </span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href='/create' 
              className="glass-button px-8 py-4 bg-kupibilet-primary hover:bg-kupibilet-primary/80 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              🚀 Начать создание
            </a>
            <a 
              href='/templates' 
              className="glass-button px-8 py-4 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-300"
            >
              📧 Посмотреть шаблоны
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-генерация</h3>
            <p className="text-white/70 text-sm">Умный контент на основе вашего брифа</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Figma интеграция</h3>
            <p className="text-white/70 text-sm">Автоматическое извлечение дизайн-токенов</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">Совместимость</h3>
            <p className="text-white/70 text-sm">Gmail, Outlook, Apple Mail и другие</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Быстро</h3>
            <p className="text-white/70 text-sm">От идеи до шаблона за минуты</p>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card p-8 mb-16">
          <h2 className="text-2xl font-bold text-white mb-8">
            Статистика системы
            {loading && <span className="text-sm text-white/50 ml-2"> загрузка...</span>}
          </h2>
          
          {/* Real-time Status Indicators */}
          <div className="flex justify-center mb-6">
            <div className="flex flex-wrap items-center gap-3 md:gap-6 bg-white/5 rounded-lg px-4 md:px-6 py-3 border border-white/10 max-w-full">
              {/* System Health Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  systemStats.errorRate < 5 ? 'bg-green-500' : 
                  systemStats.errorRate < 10 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-white/80">
                  <span className="hidden sm:inline">Система </span>
                  {systemStats.errorRate < 5 ? 'здорова' : systemStats.errorRate < 10 ? 'стабильна' : 'перегружена'}
                </span>
              </div>
              
              {/* Agent Activity Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  systemStats.activeAgents >= 4 ? 'bg-green-500' : 
                  systemStats.activeAgents >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-white/80">
                  {systemStats.activeAgents} <span className="hidden sm:inline">агентов активно</span>
                  <span className="sm:hidden">агент</span>
                </span>
              </div>
              
              {/* Response Time Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  systemStats.averageResponseTime < 1000 ? 'bg-green-500' : 
                  systemStats.averageResponseTime < 3000 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-white/80">
                  {systemStats.averageResponseTime}мс <span className="hidden sm:inline">отклик</span>
                </span>
              </div>
              
              {/* Success Rate Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  systemStats.successRate >= 95 ? 'bg-green-500' : 
                  systemStats.successRate >= 85 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-white/80">
                  {systemStats.successRate}% <span className="hidden sm:inline">успех</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-kupibilet-primary mb-2">
                {systemStats.templateCount}
              </div>
              <div className="text-white/70">Созданных шаблонов</div>
              {dashboardMetrics && (
                <div className="text-xs text-white/50 mt-1">
                  +{systemStats.recentTemplates} за последнее время
                </div>
              )}
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${getStatusColor(systemStats.systemStatus)}`}>
                {systemStats.successRate}%
              </div>
              <div className="text-white/70">
                Успешных генераций
                <div className="text-xs text-white/50 mt-1">
                  ~{systemStats.averageResponseTime}мс отклик
                </div>
              </div>
            </div>
            <div className="text-center relative">
              <div className="text-3xl font-bold text-kupibilet-accent mb-2">
                {systemStats.activeAgents}
              </div>
              <div className="text-white/70">
                Активных агентов
                <div className="text-xs text-white/50 mt-1">
                  {systemStats.totalRequests} запросов
                </div>
              </div>
              {/* Live Activity Indicator */}
              <div className="absolute -top-1 -right-1">
                <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${
                  systemStats.activeAgents >= 4 ? 'bg-green-500 shadow-green-500/50' : 
                  systemStats.activeAgents >= 2 ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-red-500 shadow-red-500/50'
                }`}></div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {dashboardMetrics && (
            <div className="border-t border-white/10 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-xl font-semibold text-blue-400 mb-1">
                    {systemStats.averageQualityScore}%
                  </div>
                  <div className="text-xs text-white/60">Качество шаблонов</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-green-400 mb-1">
                    {dashboardMetrics.recent.totalUsers}
                  </div>
                  <div className="text-xs text-white/60">Активных пользователей</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-yellow-400 mb-1">
                    {dashboardMetrics.recent.failedRequests}
                  </div>
                  <div className="text-xs text-white/60">Ошибок</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-purple-400 mb-1">
                    {Math.round(systemStats.totalRequests / Math.max(1, systemStats.activeAgents))}
                  </div>
                  <div className="text-xs text-white/60">Запросов на агента</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Status */}
          {dashboardMetrics?.agentMetrics && (
            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Статус агентов</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardMetrics.agentMetrics).map(([agentType, metrics]) => (
                  <div key={agentType} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-white/80 capitalize">
                        {agentType.replace('Specialist', '')}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        metrics.status === 'active' ? 'bg-green-400' :
                        metrics.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                    </div>
                    <div className="text-xs text-white/60">
                      <div>{metrics.processedJobs} задач</div>
                      <div>{metrics.successRate}% успех</div>
                      <div>{metrics.averageProcessingTime}мс среднее</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}