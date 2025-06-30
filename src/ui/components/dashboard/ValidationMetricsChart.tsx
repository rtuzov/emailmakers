'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ValidationMetric {
  agent: string;
  validationScore: number;
  errorCount: number;
  warningCount: number;
  timestamp: string;
  trend: 'up' | 'down' | 'stable';
}

interface ValidationMetricsChartProps {
  className?: string;
}

export default function ValidationMetricsChart({ className = '' }: ValidationMetricsChartProps) {
  const [metrics, setMetrics] = useState<ValidationMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  // Mock data - в реальности будет загружаться из API
  useEffect(() => {
    const generateMockMetrics = (): ValidationMetric[] => {
      const agents = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'];
      return agents.map(agent => ({
        agent,
        validationScore: Math.floor(Math.random() * 20) + 80, // 80-100
        errorCount: Math.floor(Math.random() * 5),
        warningCount: Math.floor(Math.random() * 10),
        timestamp: new Date().toISOString(),
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
      }));
    };

    setTimeout(() => {
      setMetrics(generateMockMetrics());
      setLoading(false);
    }, 1000);

    // Обновление каждые 30 секунд
    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
    }, 30000);

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

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-kupibilet-primary';
    if (score >= 85) return 'text-kupibilet-secondary';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 95) return 'bg-kupibilet-primary/20 border-kupibilet-primary/30';
    if (score >= 85) return 'bg-kupibilet-secondary/20 border-kupibilet-secondary/30';
    if (score >= 70) return 'bg-yellow-400/20 border-yellow-400/30';
    return 'bg-red-400/20 border-red-400/30';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-kupibilet-primary" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-white/60" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Validation Metrics</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-white/10 rounded-xl"></div>
            </div>
          ))}
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
          <h3 className="text-lg font-semibold text-white">Validation Metrics</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="1h">1 час</option>
            <option value="24h">24 часа</option>
            <option value="7d">7 дней</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.agent} className="bg-glass-primary rounded-xl border border-white/10 p-4 hover:bg-glass-surface transition-all duration-200">
            <div className="flex items-center justify-between">
              {/* Agent Info */}
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-white">
                  {getAgentDisplayName(metric.agent)}
                </div>
                {getTrendIcon(metric.trend)}
              </div>

              {/* Score */}
              <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${getScoreBgColor(metric.validationScore)} ${getScoreColor(metric.validationScore)}`}>
                {metric.validationScore}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 mb-2">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.validationScore >= 95 ? 'bg-kupibilet-primary' :
                    metric.validationScore >= 85 ? 'bg-kupibilet-secondary' :
                    metric.validationScore >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${metric.validationScore}%` }}
                ></div>
              </div>
            </div>

            {/* Error/Warning Count */}
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>
                {metric.errorCount > 0 && (
                  <span className="text-red-400">{metric.errorCount} ошибок</span>
                )}
                {metric.errorCount > 0 && metric.warningCount > 0 && ', '}
                {metric.warningCount > 0 && (
                  <span className="text-yellow-400">{metric.warningCount} предупреждений</span>
                )}
                {metric.errorCount === 0 && metric.warningCount === 0 && (
                  <span className="text-kupibilet-primary">Все проверки пройдены</span>
                )}
              </span>
              <span className="text-white/40">
                {new Date(metric.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-kupibilet-primary">
              {Math.round(metrics.reduce((acc, m) => acc + m.validationScore, 0) / metrics.length)}%
            </div>
            <div className="text-xs text-white/60">Средний балл</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-400">
              {metrics.reduce((acc, m) => acc + m.errorCount, 0)}
            </div>
            <div className="text-xs text-white/60">Всего ошибок</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-400">
              {metrics.reduce((acc, m) => acc + m.warningCount, 0)}
            </div>
            <div className="text-xs text-white/60">Предупреждений</div>
          </div>
        </div>
      </div>
    </div>
  );
}