'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar } from 'lucide-react';

interface PerformanceData {
  timestamp: string;
  metrics: {
    response_time: number;
    success_rate: number;
    throughput: number;
    error_rate: number;
    validation_score: number;
    memory_usage: number;
    cpu_usage: number;
  };
  agent: string;
}

interface PerformanceTrendsChartProps {
  className?: string;
}

export default function PerformanceTrendsChart({ className = '' }: PerformanceTrendsChartProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'response_time' | 'success_rate' | 'throughput' | 'error_rate'>('response_time');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  useEffect(() => {
    const generateMockPerformanceData = (): PerformanceData[] => {
      const agents = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'];
      const now = Date.now();
      const dataPoints: PerformanceData[] = [];
      
      // Generate data points for the last 24 hours
      for (let i = 0; i < 24; i++) {
        agents.forEach(agent => {
          const timestamp = new Date(now - i * 3600000).toISOString(); // Every hour
          dataPoints.push({
            timestamp,
            agent,
            metrics: {
              response_time: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
              success_rate: Math.floor(Math.random() * 15) + 85, // 85-100%
              throughput: Math.floor(Math.random() * 50) + 10, // 10-60 req/min
              error_rate: Math.floor(Math.random() * 8), // 0-8%
              validation_score: Math.floor(Math.random() * 20) + 80, // 80-100%
              memory_usage: Math.floor(Math.random() * 40) + 30, // 30-70%
              cpu_usage: Math.floor(Math.random() * 50) + 20 // 20-70%
            }
          });
        });
      }
      
      return dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    setTimeout(() => {
      setPerformanceData(generateMockPerformanceData());
      setLoading(false);
    }, 800);

    const interval = setInterval(() => {
      setPerformanceData(generateMockPerformanceData());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timeRange]);

  const getAgentDisplayName = (agent: string) => {
    const names: Record<string, string> = {
      'content-specialist': 'Content',
      'design-specialist': 'Design',
      'quality-specialist': 'Quality',
      'delivery-specialist': 'Delivery'
    };
    return names[agent] || agent;
  };

  const _getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'content-specialist': 'kupibilet-primary',
      'design-specialist': 'kupibilet-secondary',
      'quality-specialist': 'kupibilet-accent',
      'delivery-specialist': 'purple-400'
    };
    return colors[agent] || 'white';
  };

  const getMetricDisplayName = (metric: string) => {
    const names: Record<string, string> = {
      'response_time': 'Время отклика (мс)',
      'success_rate': 'Успешность (%)',
      'throughput': 'Пропускная способность',
      'error_rate': 'Процент ошибок (%)'
    };
    return names[metric] || metric;
  };

  const getMetricTrend = (data: PerformanceData[], metric: string, agent?: string) => {
    const filteredData = agent && agent !== 'all' 
      ? data.filter(d => d.agent === agent)
      : data;
    
    if (filteredData.length < 2) return 'stable';
    
    const recent = filteredData.slice(-6); // Last 6 data points
    const early = filteredData.slice(0, 6); // First 6 data points
    
    const recentAvg = recent.reduce((acc, d) => acc + (d.metrics as any)[metric], 0) / recent.length;
    const earlyAvg = early.reduce((acc, d) => acc + (d.metrics as any)[metric], 0) / early.length;
    
    const percentChange = ((recentAvg - earlyAvg) / earlyAvg) * 100;
    
    if (Math.abs(percentChange) < 5) return 'stable';
    return percentChange > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string, metric: string) => {
    const isPositiveMetric = ['success_rate', 'throughput', 'validation_score'].includes(metric);
    
    if (trend === 'stable') {
      return <Activity className="w-4 h-4 text-white/60" />;
    }
    
    const isGoodTrend = (trend === 'up' && isPositiveMetric) || (trend === 'down' && !isPositiveMetric);
    
    return trend === 'up' 
      ? <TrendingUp className={`w-4 h-4 ${isGoodTrend ? 'text-kupibilet-primary' : 'text-red-400'}`} />
      : <TrendingDown className={`w-4 h-4 ${isGoodTrend ? 'text-kupibilet-primary' : 'text-red-400'}`} />;
  };

  const calculateCurrentAverages = () => {
    const filteredData = selectedAgent === 'all' 
      ? performanceData 
      : performanceData.filter(d => d.agent === selectedAgent);
    
    if (filteredData.length === 0) return null;
    
    const recentData = filteredData.slice(-12); // Last 12 data points
    
    return {
      response_time: Math.round(recentData.reduce((acc, d) => acc + d.metrics.response_time, 0) / recentData.length),
      success_rate: Math.round(recentData.reduce((acc, d) => acc + d.metrics.success_rate, 0) / recentData.length),
      throughput: Math.round(recentData.reduce((acc, d) => acc + d.metrics.throughput, 0) / recentData.length),
      error_rate: Math.round(recentData.reduce((acc, d) => acc + d.metrics.error_rate, 0) / recentData.length),
      validation_score: Math.round(recentData.reduce((acc, d) => acc + d.metrics.validation_score, 0) / recentData.length),
      memory_usage: Math.round(recentData.reduce((acc, d) => acc + d.metrics.memory_usage, 0) / recentData.length),
      cpu_usage: Math.round(recentData.reduce((acc, d) => acc + d.metrics.cpu_usage, 0) / recentData.length)
    };
  };

  const currentAverages = calculateCurrentAverages();

  if (loading) {
    return (
      <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Performance Trends</h3>
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-white/10 rounded-xl animate-pulse"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Performance Trends</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="all">Все агенты</option>
            <option value="content-specialist">Content</option>
            <option value="design-specialist">Design</option>
            <option value="quality-specialist">Quality</option>
            <option value="delivery-specialist">Delivery</option>
          </select>
          
          <select 
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="response_time">Время отклика</option>
            <option value="success_rate">Успешность</option>
            <option value="throughput">Пропускная способность</option>
            <option value="error_rate">Процент ошибок</option>
          </select>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="1h">1 час</option>
            <option value="6h">6 часов</option>
            <option value="24h">24 часа</option>
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
          </select>
        </div>
      </div>

      {/* Current Metrics Overview */}
      {currentAverages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Время отклика</span>
              {getTrendIcon(getMetricTrend(performanceData, 'response_time', selectedAgent), 'response_time')}
            </div>
            <div className="text-lg font-bold text-white">{currentAverages.response_time}ms</div>
          </div>
          
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Успешность</span>
              {getTrendIcon(getMetricTrend(performanceData, 'success_rate', selectedAgent), 'success_rate')}
            </div>
            <div className="text-lg font-bold text-kupibilet-primary">{currentAverages.success_rate}%</div>
          </div>
          
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Пропускная способ.</span>
              {getTrendIcon(getMetricTrend(performanceData, 'throughput', selectedAgent), 'throughput')}
            </div>
            <div className="text-lg font-bold text-kupibilet-secondary">{currentAverages.throughput}/мин</div>
          </div>
          
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Ошибки</span>
              {getTrendIcon(getMetricTrend(performanceData, 'error_rate', selectedAgent), 'error_rate')}
            </div>
            <div className="text-lg font-bold text-red-400">{currentAverages.error_rate}%</div>
          </div>
        </div>
      )}

      {/* Chart Placeholder */}
      <div className="bg-glass-primary rounded-xl border border-white/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white">
            {getMetricDisplayName(selectedMetric)} - {selectedAgent === 'all' ? 'Все агенты' : getAgentDisplayName(selectedAgent)}
          </h4>
          <div className="flex items-center space-x-2 text-xs text-white/60">
            <Calendar className="w-4 h-4" />
            <span>Последние {timeRange}</span>
          </div>
        </div>
        
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
          <div className="text-center text-white/60">
            <BarChart3 className="w-12 h-12 mx-auto mb-3" />
            <div className="text-sm">Интерактивный график трендов</div>
            <div className="text-xs opacity-60">Интеграция с Chart.js в разработке</div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      {currentAverages && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Использование памяти</span>
              <span className="text-sm text-kupibilet-primary">{currentAverages.memory_usage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-kupibilet-primary transition-all duration-300"
                style={{ width: `${currentAverages.memory_usage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">Загрузка CPU</span>
              <span className="text-sm text-kupibilet-secondary">{currentAverages.cpu_usage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-kupibilet-secondary transition-all duration-300"
                style={{ width: `${currentAverages.cpu_usage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Обновляется каждую минуту</span>
          <span>Последнее обновление: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}