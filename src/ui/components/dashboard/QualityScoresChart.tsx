'use client';

import { useState, useEffect } from 'react';
import { BarChart, LineChart, TrendingUp, TrendingDown, Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface QualityScore {
  agent: string;
  timestamp: string;
  scores: {
    compatibility: number;
    accessibility: number;
    performance: number;
    validation: number;
    overall: number;
  };
  trend: 'up' | 'down' | 'stable';
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface QualityScoresChartProps {
  className?: string;
}

export default function QualityScoresChart({ className = '' }: QualityScoresChartProps) {
  const [qualityData, setQualityData] = useState<QualityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  useEffect(() => {
    const generateMockQualityData = (): QualityScore[] => {
      const agents = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'];
      return agents.map(agent => ({
        agent,
        timestamp: new Date().toISOString(),
        scores: {
          compatibility: Math.floor(Math.random() * 15) + 85, // 85-100
          accessibility: Math.floor(Math.random() * 20) + 75, // 75-95
          performance: Math.floor(Math.random() * 25) + 70, // 70-95
          validation: Math.floor(Math.random() * 10) + 90, // 90-100
          overall: Math.floor(Math.random() * 20) + 80 // 80-100
        },
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        issues: {
          critical: Math.floor(Math.random() * 3),
          high: Math.floor(Math.random() * 5),
          medium: Math.floor(Math.random() * 8),
          low: Math.floor(Math.random() * 12)
        }
      }));
    };

    setTimeout(() => {
      setQualityData(generateMockQualityData());
      setLoading(false);
    }, 800);

    const interval = setInterval(() => {
      setQualityData(generateMockQualityData());
    }, 45000);

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

  const getIssueIcon = (issueCount: number, type: 'critical' | 'high' | 'medium' | 'low') => {
    if (issueCount === 0) return <CheckCircle className="w-4 h-4 text-kupibilet-primary" />;
    
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const filteredData = selectedAgent === 'all' 
    ? qualityData 
    : qualityData.filter(item => item.agent === selectedAgent);

  if (loading) {
    return (
      <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-6">
          <BarChart className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Quality Scores</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-white/10 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const averageScores = filteredData.length > 0 ? {
    compatibility: Math.round(filteredData.reduce((acc, item) => acc + item.scores.compatibility, 0) / filteredData.length),
    accessibility: Math.round(filteredData.reduce((acc, item) => acc + item.scores.accessibility, 0) / filteredData.length),
    performance: Math.round(filteredData.reduce((acc, item) => acc + item.scores.performance, 0) / filteredData.length),
    validation: Math.round(filteredData.reduce((acc, item) => acc + item.scores.validation, 0) / filteredData.length),
    overall: Math.round(filteredData.reduce((acc, item) => acc + item.scores.overall, 0) / filteredData.length)
  } : { compatibility: 0, accessibility: 0, performance: 0, validation: 0, overall: 0 };

  return (
    <div className={`bg-glass-surface rounded-2xl border border-white/20 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-kupibilet-primary" />
          <h3 className="text-lg font-semibold text-white">Quality Scores</h3>
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
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '6h' | '24h' | '7d')}
            className="bg-glass-primary border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-kupibilet-primary/50 focus:border-kupibilet-primary/50"
          >
            <option value="1h">1 час</option>
            <option value="6h">6 часов</option>
            <option value="24h">24 часа</option>
            <option value="7d">7 дней</option>
          </select>
        </div>
      </div>

      {/* Average Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-glass-primary rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-2xl font-bold ${getScoreColor(averageScores.overall)} mb-1`}>
            {averageScores.overall}%
          </div>
          <div className="text-xs text-white/60">Общий балл</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-lg font-semibold ${getScoreColor(averageScores.compatibility)} mb-1`}>
            {averageScores.compatibility}%
          </div>
          <div className="text-xs text-white/60">Совместимость</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-lg font-semibold ${getScoreColor(averageScores.accessibility)} mb-1`}>
            {averageScores.accessibility}%
          </div>
          <div className="text-xs text-white/60">Доступность</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-lg font-semibold ${getScoreColor(averageScores.performance)} mb-1`}>
            {averageScores.performance}%
          </div>
          <div className="text-xs text-white/60">Производит.</div>
        </div>
        
        <div className="bg-glass-primary rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-lg font-semibold ${getScoreColor(averageScores.validation)} mb-1`}>
            {averageScores.validation}%
          </div>
          <div className="text-xs text-white/60">Валидация</div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="space-y-4">
        {filteredData.map((item) => (
          <div key={item.agent} className="bg-glass-primary rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-white">
                  {getAgentDisplayName(item.agent)}
                </div>
                {getTrendIcon(item.trend)}
                <div className={`px-2 py-1 rounded-lg border text-xs font-medium ${getScoreBgColor(item.scores.overall)} ${getScoreColor(item.scores.overall)}`}>
                  {item.scores.overall}%
                </div>
              </div>
              
              <div className="text-xs text-white/40">
                {new Date(item.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(item.scores).slice(0, 4).map(([key, score]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 capitalize">
                      {key === 'compatibility' ? 'Совмест.' : 
                       key === 'accessibility' ? 'Доступ.' :
                       key === 'performance' ? 'Произв.' : 'Валид.'}
                    </span>
                    <span className={`text-xs font-medium ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        score >= 95 ? 'bg-kupibilet-primary' :
                        score >= 85 ? 'bg-kupibilet-secondary' :
                        score >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Issues Summary */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center space-x-4">
                {Object.entries(item.issues).map(([type, count]) => (
                  <div key={type} className="flex items-center space-x-1">
                    {getIssueIcon(count, type as 'critical' | 'high' | 'medium' | 'low')}
                    <span className={`text-xs ${
                      type === 'critical' ? 'text-red-400' :
                      type === 'high' ? 'text-orange-400' :
                      type === 'medium' ? 'text-yellow-400' : 'text-white/60'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-white/60">
                {Object.values(item.issues).reduce((a, b) => a + b, 0) === 0 ? 
                  'Все проверки пройдены' : 
                  `${Object.values(item.issues).reduce((a, b) => a + b, 0)} проблем`
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center h-32 bg-glass-primary rounded-xl border border-white/10">
          <div className="text-center text-white/60">
            <LineChart className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm">График трендов качества</div>
            <div className="text-xs opacity-60">Будет добавлен в следующей версии</div>
          </div>
        </div>
      </div>
    </div>
  );
}