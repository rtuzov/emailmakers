/**
 * 🎯 OPTIMIZATION DASHBOARD - Панель мониторинга системы оптимизации
 * 
 * Интерактивная панель для мониторинга системы автоматической оптимизации
 * агентов и валидаторов в реальном времени.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface OptimizationStatus {
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  last_analysis: string | null;
  last_optimization: string | null;
  active_optimizations: number;
  total_optimizations_today: number;
  system_health_score: number;
  recommendations_pending: number;
}

interface SystemAnalysis {
  current_state: {
    health_score: number;
    active_agents: number;
    success_rate: number;
    average_response_time: number;
  };
  insights: {
    trends_detected: number;
    bottlenecks_found: number;
    error_patterns: number;
    predicted_issues: number;
  };
  assessment: string;
  opportunities: string[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  expected_impact: {
    performance_improvement: number;
    success_rate_improvement: number;
    response_time_reduction: number;
  };
  safety: {
    risk_level: string;
    requires_approval: boolean;
    potential_impacts: string[];
  };
  estimated_duration: string;
}

interface DemoResults {
  success: boolean;
  demo?: any;
  logs?: string[];
  error?: any;
  summary?: any;
}

interface OptimizationMetrics {
  systemHealth: number;
  activeAgents: number;
  successRate: number;
  avgResponseTime: number;
  totalOptimizations: number;
  pendingRecommendations: number;
  // Enhanced metrics for Phase 3.2.4
  performanceTrend: number; // Percentage change from last period
  efficiencyScore: number;
  optimizationImpact: number;
  predictionAccuracy: number;
  resourceUtilization: number;
  errorReduction: number;
}

interface PerformanceHistory {
  timestamp: string;
  systemHealth: number;
  successRate: number;
  responseTime: number;
  activeOptimizations: number;
}

interface RecommendationCategory {
  category: string;
  count: number;
  averageImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedValue: number;
}

interface PerformanceTrends {
  hourly: PerformanceHistory[];
  daily: PerformanceHistory[];
  weekly: PerformanceHistory[];
  monthlyAggregate: {
    totalOptimizations: number;
    averagePerformance: number;
    improvementRate: number;
    issuesResolved: number;
  };
}

// Enhanced interfaces for Phase 3.2.5
interface OptimizationHistoryEntry {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  status: 'completed' | 'failed' | 'partial' | 'rolled_back';
  impact: {
    performanceImprovement: number;
    responseTimeReduction: number;
    successRateImprovement: number;
    costSavings: number;
  };
  duration: string;
  rollbackAvailable: boolean;
  appliedBy: 'system' | 'user';
  confidence: number;
}

interface TrendAnalysis {
  period: '7d' | '30d' | '90d' | '1y';
  direction: 'improving' | 'declining' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  changePercentage: number;
  predictions: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
  keyFactors: string[];
  anomalies: {
    timestamp: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

interface HistoricalInsight {
  id: string;
  category: 'performance' | 'efficiency' | 'cost' | 'reliability';
  title: string;
  description: string;
  timeframe: string;
  impact: number;
  trend: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionRequired: boolean;
  relatedOptimizations: string[];
}

// Enhanced interfaces for Phase 3.2.6 - Optimization Controls
interface OptimizationConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'database' | 'caching' | 'memory' | 'network' | 'security';
  autoApply: boolean;
  thresholds: {
    cpu: number;
    memory: number;
    responseTime: number;
    errorRate: number;
  };
  schedule: {
    enabled: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
  };
  lastModified: string;
  appliedBy: string;
}

interface OptimizationControl {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'idle' | 'running' | 'pending' | 'error' | 'paused';
  lastRun: string | null;
  nextRun: string | null;
  successRate: number;
  averageImpact: number;
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  autoRollback: boolean;
  config: OptimizationConfig;
}

interface SystemSettings {
  globalOptimizationEnabled: boolean;
  autoApprovalThreshold: number;
  maxConcurrentOptimizations: number;
  rollbackWindow: number; // hours
  notificationSettings: {
    emailAlerts: boolean;
    slackIntegration: boolean;
    webhookUrl: string;
  };
  performanceThresholds: {
    criticalCpuUsage: number;
    criticalMemoryUsage: number;
    maxResponseTime: number;
    minSuccessRate: number;
  };
  backupSettings: {
    autoBackupEnabled: boolean;
    retentionDays: number;
    s3Bucket: string;
  };
}

export default function OptimizationDashboard() {
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    systemHealth: 0,
    activeAgents: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalOptimizations: 0,
    pendingRecommendations: 0,
    // Enhanced metrics for Phase 3.2.4
    performanceTrend: 0,
    efficiencyScore: 0,
    optimizationImpact: 0,
    predictionAccuracy: 0,
    resourceUtilization: 0,
    errorReduction: 0
  });

  const [status, setStatus] = useState<OptimizationStatus>({
    status: 'stopped',
    last_analysis: null,
    last_optimization: null,
    active_optimizations: 0,
    total_optimizations_today: 0,
    system_health_score: 0,
    recommendations_pending: 0
  });

  const [analysis, setAnalysis] = useState<SystemAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [demoResults, setDemoResults] = useState<DemoResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  // Enhanced state for Phase 3.2.4
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrends | null>(null);
  const [recommendationCategories, setRecommendationCategories] = useState<RecommendationCategory[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  // Enhanced state for Phase 3.2.5 - History and Trends
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistoryEntry[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [historicalInsights, setHistoricalInsights] = useState<HistoricalInsight[]>([]);
  const [selectedHistoryPeriod, setSelectedHistoryPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'failed' | 'rolled_back'>('all');
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);

  // Enhanced state for Phase 3.2.6 - Optimization Controls
  const [optimizationControls, setOptimizationControls] = useState<OptimizationControl[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeOptimizations, setActiveOptimizations] = useState<string[]>([]);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [showControlsPanel, setShowControlsPanel] = useState(false);
  const [controlsFilter, setControlsFilter] = useState<'all' | 'enabled' | 'disabled' | 'running'>('all');
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  // Load optimization data
  const loadOptimizationData = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Get system analysis
      const analysisResponse = await fetch('/api/optimization/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_system' }),
        cache: 'no-store'
      });
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        if (analysisData.success && analysisData.analysis) {
          setAnalysis(analysisData.analysis);
          
          // Update metrics from analysis
          setMetrics(prev => ({
            ...prev,
            systemHealth: analysisData.analysis.current_state.health_score || 0,
            activeAgents: analysisData.analysis.current_state.active_agents || 0,
            successRate: analysisData.analysis.current_state.success_rate || 0,
            avgResponseTime: (analysisData.analysis.current_state.average_response_time || 0) / 1000
          }));
          
          setStatus(prev => ({
            ...prev,
            status: 'running',
            last_analysis: new Date().toISOString(),
            system_health_score: analysisData.analysis.current_state.health_score || 0
          }));
        }
      }
      
      // Get recommendations
      const recResponse = await fetch('/api/optimization/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_recommendations' }),
        cache: 'no-store'
      });
      
      if (recResponse.ok) {
        const recData = await recResponse.json();
        if (recData.success && recData.recommendations) {
          setRecommendations(recData.recommendations.items || []);
          
          setMetrics(prev => ({
            ...prev,
            pendingRecommendations: recData.recommendations.total_count || 0,
            totalOptimizations: prev.totalOptimizations + (recData.recommendations.summary?.safe_to_auto_apply || 0)
          }));
          
          setStatus(prev => ({
            ...prev,
            recommendations_pending: recData.recommendations.total_count || 0
          }));
        }
      }
      
      setLastUpdate(new Date().toISOString());
      setIsInitialized(true);
      
      // Generate enhanced metrics for Phase 3.2.4
      await loadEnhancedMetrics();
      
    } catch (error) {
      console.error('❌ Failed to load optimization data:', error);
      setStatus(prev => ({
        ...prev,
        status: 'error'
      }));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Enhanced metrics loading for Phase 3.2.4
  const loadEnhancedMetrics = useCallback(async () => {
    try {
      // Generate realistic performance trends data
      const now = new Date();
      const generateHistoryPoint = (offset: number): PerformanceHistory => ({
        timestamp: new Date(now.getTime() - offset).toISOString(),
        systemHealth: 85 + Math.random() * 15, // 85-100%
        successRate: 92 + Math.random() * 8, // 92-100%
        responseTime: 800 + Math.random() * 400, // 800-1200ms
        activeOptimizations: Math.floor(Math.random() * 5)
      });

      const hourlyData = Array.from({ length: 24 }, (_, i) => 
        generateHistoryPoint(i * 60 * 60 * 1000) // Last 24 hours
      ).reverse();

      const dailyData = Array.from({ length: 7 }, (_, i) => 
        generateHistoryPoint(i * 24 * 60 * 60 * 1000) // Last 7 days
      ).reverse();

      const weeklyData = Array.from({ length: 4 }, (_, i) => 
        generateHistoryPoint(i * 7 * 24 * 60 * 60 * 1000) // Last 4 weeks
      ).reverse();

      setPerformanceTrends({
        hourly: hourlyData,
        daily: dailyData,
        weekly: weeklyData,
        monthlyAggregate: {
          totalOptimizations: 247,
          averagePerformance: 94.2,
          improvementRate: 12.8,
          issuesResolved: 89
        }
      });

      // Generate enhanced metrics
      const currentHealth = metrics.systemHealth || 94.8;
      const trend = (-2 + Math.random() * 14); // -2% to +12% trend
      
      setMetrics(prev => ({
        ...prev,
        performanceTrend: trend,
        efficiencyScore: Math.min(100, currentHealth + (trend / 2)),
        optimizationImpact: 15.6 + Math.random() * 10, // 15-25%
        predictionAccuracy: 87.3 + Math.random() * 10, // 87-97%
        resourceUtilization: 72.1 + Math.random() * 15, // 72-87%
        errorReduction: 23.4 + Math.random() * 20 // 23-43%
      }));

      // Generate recommendation categories
      if (recommendations.length > 0) {
        const categories = recommendations.reduce((acc, rec) => {
          const category = rec.type || 'general';
          if (!acc[category]) {
            acc[category] = {
              category,
              count: 0,
              totalImpact: 0,
              riskLevels: [],
              estimatedValues: []
            };
          }
          acc[category].count++;
          acc[category].totalImpact += rec.expected_impact?.performance_improvement || 0;
          acc[category].riskLevels.push(rec.safety?.risk_level || 'medium');
          acc[category].estimatedValues.push(5000 + Math.random() * 15000);
          return acc;
        }, {} as any);

        const categoryArray = Object.values(categories).map((cat: any) => ({
          category: cat.category,
          count: cat.count,
          averageImpact: cat.totalImpact / cat.count,
          riskLevel: (cat.riskLevels.filter((r: string) => r === 'low').length > cat.count / 2 ? 'low' : 'medium') as 'low' | 'medium' | 'high',
          estimatedValue: cat.estimatedValues.reduce((a: number, b: number) => a + b, 0) / cat.estimatedValues.length
        }));

        setRecommendationCategories(categoryArray);
      }

      // Phase 3.2.5: Generate historical data and trend analysis
      await loadHistoricalData();

      // Phase 3.2.6: Load optimization controls and system settings
      await loadOptimizationControls();

    } catch (error) {
      console.error('❌ Failed to load enhanced metrics:', error);
    }
  }, [metrics.systemHealth, recommendations]);

  // Phase 3.2.5: Historical data loading function
  const loadHistoricalData = useCallback(async () => {
    try {
      // Generate optimization history
      const generateOptimizationHistory = (): OptimizationHistoryEntry[] => {
        const types = ['performance', 'database', 'caching', 'memory', 'network', 'security'];
        const statuses: ('completed' | 'failed' | 'partial' | 'rolled_back')[] = ['completed', 'completed', 'completed', 'completed', 'failed', 'partial', 'rolled_back'];
        const appliedByOptions: ('system' | 'user')[] = ['system', 'system', 'system', 'user', 'user'];
        
        return Array.from({ length: 25 }, (_, i) => {
          const timestamp = new Date(Date.now() - (i * 2 + Math.random() * 8) * 24 * 60 * 60 * 1000);
          const type = types[Math.floor(Math.random() * types.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const appliedBy = appliedByOptions[Math.floor(Math.random() * appliedByOptions.length)];
          const confidence = 0.75 + Math.random() * 0.25;
          
          return {
            id: `opt-${i}-${timestamp.getTime()}`,
            timestamp: timestamp.toISOString(),
            type,
            title: `Оптимизация ${type === 'performance' ? 'производительности' : 
                             type === 'database' ? 'базы данных' :
                             type === 'caching' ? 'кэширования' :
                             type === 'memory' ? 'памяти' :
                             type === 'network' ? 'сети' : 'безопасности'} #${25-i}`,
            description: `Автоматическая оптимизация ${type} для повышения общей эффективности системы`,
            status,
            impact: {
              performanceImprovement: status === 'completed' ? 5 + Math.random() * 20 : 
                                    status === 'partial' ? 1 + Math.random() * 8 : 0,
              responseTimeReduction: status === 'completed' ? 50 + Math.random() * 300 : 
                                   status === 'partial' ? 10 + Math.random() * 100 : 0,
              successRateImprovement: status === 'completed' ? 1 + Math.random() * 5 : 
                                    status === 'partial' ? 0.2 + Math.random() * 2 : 0,
              costSavings: status === 'completed' ? 1000 + Math.random() * 8000 : 
                          status === 'partial' ? 200 + Math.random() * 2000 : 0
            },
            duration: `${Math.floor(1 + Math.random() * 8)} ${Math.random() > 0.5 ? 'часов' : 'минут'}`,
            rollbackAvailable: status === 'completed' && Math.random() > 0.3,
            appliedBy,
            confidence
          };
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      };
      
      setOptimizationHistory(generateOptimizationHistory());

      // Generate trend analysis
      const currentPerformance = metrics.systemHealth || 94.8;
      const previousPeriodPerformance = currentPerformance - 2 + Math.random() * 6; // Some variance
      const changePercentage = ((currentPerformance - previousPeriodPerformance) / previousPeriodPerformance) * 100;
      
      const trendDirection: 'improving' | 'declining' | 'stable' = 
        changePercentage > 2 ? 'improving' : 
        changePercentage < -2 ? 'declining' : 'stable';
      
      const trendStrength: 'strong' | 'moderate' | 'weak' = 
        Math.abs(changePercentage) > 5 ? 'strong' : 
        Math.abs(changePercentage) > 2 ? 'moderate' : 'weak';

      const generateAnomalies = () => {
        const anomalyCount = Math.floor(Math.random() * 4);
        return Array.from({ length: anomalyCount }, (_, i) => ({
          timestamp: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: [
            'Необычный всплеск нагрузки на базу данных',
            'Аномальное время отклика API',
            'Неожиданное увеличение использования памяти',
            'Периодические таймауты соединений'
          ][i % 4],
          severity: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)]
        }));
      };

      setTrendAnalysis({
        period: selectedHistoryPeriod,
        direction: trendDirection,
        strength: trendStrength,
        changePercentage,
        predictions: {
          nextWeek: currentPerformance + (changePercentage * 0.3) + (-1 + Math.random() * 2),
          nextMonth: currentPerformance + (changePercentage * 1.2) + (-2 + Math.random() * 4),
          confidence: 0.75 + Math.random() * 0.2
        },
        keyFactors: [
          'Оптимизация кэширования базы данных улучшила время отклика',
          'Внедрение новых алгоритмов балансировки нагрузки',
          'Автоматическое масштабирование ресурсов в пиковые нагрузки',
          'Улучшение алгоритмов сжатия данных',
          'Оптимизация SQL-запросов и индексирование'
        ],
        anomalies: generateAnomalies()
      });

      // Generate historical insights
      const generateHistoricalInsights = (): HistoricalInsight[] => {
        const categories: ('performance' | 'efficiency' | 'cost' | 'reliability')[] = 
          ['performance', 'efficiency', 'cost', 'reliability'];
        const trends: ('positive' | 'negative' | 'neutral')[] = ['positive', 'positive', 'neutral', 'negative'];
        
        return Array.from({ length: 8 }, (_, i) => {
          const category = categories[i % categories.length];
          const trend = trends[i % trends.length];
          const timeframes = ['За последние 7 дней', 'За последние 30 дней', 'За последние 3 месяца'];
          
          return {
            id: `insight-${i}`,
            category,
            title: category === 'performance' ? 'Стабильный рост производительности' :
                   category === 'efficiency' ? 'Повышение эффективности системы' :
                   category === 'cost' ? 'Оптимизация затрат на инфраструктуру' :
                   'Улучшение надежности сервисов',
            description: category === 'performance' ? 'Системная производительность показывает устойчивый рост благодаря последним оптимизациям' :
                        category === 'efficiency' ? 'Эффективность использования ресурсов значительно улучшилась' :
                        category === 'cost' ? 'Затраты на инфраструктуру снижены при сохранении качества сервиса' :
                        'Количество инцидентов и время восстановления сервисов улучшилось',
            timeframe: timeframes[i % timeframes.length],
            impact: trend === 'positive' ? 8 + Math.random() * 15 :
                   trend === 'negative' ? -(2 + Math.random() * 8) :
                   -1 + Math.random() * 2,
            trend,
            confidence: 0.7 + Math.random() * 0.25,
            actionRequired: trend === 'negative' || (Math.random() > 0.7),
            relatedOptimizations: [`opt-${i}`, `opt-${i+1}`]
          };
        });
      };

      setHistoricalInsights(generateHistoricalInsights());

    } catch (error) {
      console.error('❌ Failed to load historical data:', error);
    }
  }, [selectedHistoryPeriod, metrics.systemHealth]);

  // Phase 3.2.6: Optimization controls loading function
  const loadOptimizationControls = useCallback(async () => {
    try {
      // Generate optimization controls data
      const generateOptimizationControls = (): OptimizationControl[] => {
        const controlTypes: Array<OptimizationConfig['type']> = ['performance', 'database', 'caching', 'memory', 'network', 'security'];
        const priorities: Array<OptimizationConfig['priority']> = ['low', 'medium', 'high', 'critical'];
        const statuses: Array<OptimizationControl['status']> = ['idle', 'running', 'pending', 'paused'];
        const riskLevels: Array<OptimizationControl['riskLevel']> = ['low', 'medium', 'high'];
        
        return Array.from({ length: 12 }, (_, i) => {
          const type = controlTypes[i % controlTypes.length];
          const priority = priorities[Math.floor(Math.random() * priorities.length)];
          const status = i < 2 ? 'running' : statuses[Math.floor(Math.random() * statuses.length)];
          const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
          const enabled = Math.random() > 0.2; // 80% enabled
          
          const config: OptimizationConfig = {
            id: `config-${i}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Optimization`,
            description: `Автоматическая оптимизация ${type === 'performance' ? 'производительности' : 
                         type === 'database' ? 'базы данных' :
                         type === 'caching' ? 'кэширования' :
                         type === 'memory' ? 'памяти' :
                         type === 'network' ? 'сети' : 'безопасности'}`,
            enabled,
            priority,
            type,
            autoApply: priority !== 'critical' && riskLevel === 'low',
            thresholds: {
              cpu: 70 + Math.random() * 20,
              memory: 80 + Math.random() * 15,
              responseTime: 1000 + Math.random() * 2000,
              errorRate: 1 + Math.random() * 4
            },
            schedule: {
              enabled: Math.random() > 0.3,
              frequency: (['hourly', 'daily', 'weekly', 'monthly'] as const)[Math.floor(Math.random() * 4)],
              time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
              timezone: 'Europe/Moscow'
            },
            lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            appliedBy: Math.random() > 0.5 ? 'system' : 'admin'
          };

          return {
            id: `control-${i}`,
            name: config.name,
            description: config.description,
            enabled,
            status,
            lastRun: status === 'idle' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
            nextRun: enabled && config.schedule.enabled ? 
              new Date(Date.now() + (Math.random() * 24 + 1) * 60 * 60 * 1000).toISOString() : null,
            successRate: 85 + Math.random() * 15,
            averageImpact: 5 + Math.random() * 20,
            estimatedDuration: `${Math.floor(5 + Math.random() * 55)} минут`,
            riskLevel,
            requiresApproval: priority === 'critical' || riskLevel === 'high',
            autoRollback: riskLevel !== 'low',
            config
          };
        });
      };

      setOptimizationControls(generateOptimizationControls());

      // Generate system settings
      const generateSystemSettings = (): SystemSettings => ({
        globalOptimizationEnabled: true,
        autoApprovalThreshold: 85,
        maxConcurrentOptimizations: 3,
        rollbackWindow: 24,
        notificationSettings: {
          emailAlerts: true,
          slackIntegration: false,
          webhookUrl: ''
        },
        performanceThresholds: {
          criticalCpuUsage: 90,
          criticalMemoryUsage: 85,
          maxResponseTime: 3000,
          minSuccessRate: 80
        },
        backupSettings: {
          autoBackupEnabled: true,
          retentionDays: 30,
          s3Bucket: 'optimization-backups'
        }
      });

      setSystemSettings(generateSystemSettings());

      // Set active optimizations (currently running)
      const runningControls = optimizationControls.filter(control => control.status === 'running');
      setActiveOptimizations(runningControls.map(control => control.id));

    } catch (error) {
      console.error('❌ Failed to load optimization controls:', error);
    }
  }, []);

  // Phase 3.2.6: Control management functions
  const toggleOptimizationControl = useCallback(async (controlId: string) => {
    const control = optimizationControls.find(c => c.id === controlId);
    if (!control) return;

    const action = control.enabled ? 'disable' : 'enable';
    toast.loading(`${action === 'enable' ? 'Включение' : 'Отключение'} оптимизации...`, { id: controlId });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOptimizationControls(prev => prev.map(c => 
        c.id === controlId 
          ? { 
              ...c, 
              enabled: !c.enabled,
              status: !c.enabled ? 'idle' : 'paused',
              config: { 
                ...c.config, 
                enabled: !c.enabled,
                lastModified: new Date().toISOString(),
                appliedBy: 'user'
              }
            }
          : c
      ));

      toast.success(`Оптимизация ${action === 'enable' ? 'включена' : 'отключена'}`, { id: controlId });
    } catch (error) {
      toast.error('Ошибка изменения настроек', { id: controlId });
    }
  }, [optimizationControls]);

  const runOptimizationControl = useCallback(async (controlId: string) => {
    const control = optimizationControls.find(c => c.id === controlId);
    if (!control || !control.enabled) return;

    toast.loading('Запуск оптимизации...', { id: controlId });

    try {
      // Update status to running
      setOptimizationControls(prev => prev.map(c => 
        c.id === controlId ? { ...c, status: 'running' } : c
      ));

      setActiveOptimizations(prev => [...prev, controlId]);

      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update to completed
      setOptimizationControls(prev => prev.map(c => 
        c.id === controlId 
          ? { 
              ...c, 
              status: 'idle',
              lastRun: new Date().toISOString(),
              nextRun: control.config.schedule.enabled ? 
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
            }
          : c
      ));

      setActiveOptimizations(prev => prev.filter(id => id !== controlId));

      toast.success('Оптимизация завершена успешно!', { id: controlId });

      // Refresh data to show impact
      await loadOptimizationData();
    } catch (error) {
      setOptimizationControls(prev => prev.map(c => 
        c.id === controlId ? { ...c, status: 'error' } : c
      ));
      setActiveOptimizations(prev => prev.filter(id => id !== controlId));
      toast.error('Ошибка выполнения оптимизации', { id: controlId });
    }
  }, [optimizationControls, loadOptimizationData]);

  const pauseOptimizationControl = useCallback(async (controlId: string) => {
    toast.loading('Приостановка оптимизации...', { id: controlId });

    try {
      setOptimizationControls(prev => prev.map(c => 
        c.id === controlId ? { ...c, status: 'paused' } : c
      ));

      setActiveOptimizations(prev => prev.filter(id => id !== controlId));

      toast.success('Оптимизация приостановлена', { id: controlId });
    } catch (error) {
      toast.error('Ошибка приостановки', { id: controlId });
    }
  }, []);

  const updateSystemSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
    if (!systemSettings) return;

    toast.loading('Обновление системных настроек...', { id: 'settings' });

    try {
      const updatedSettings = { ...systemSettings, ...newSettings };
      setSystemSettings(updatedSettings);
      
      toast.success('Настройки обновлены', { id: 'settings' });
    } catch (error) {
      toast.error('Ошибка обновления настроек', { id: 'settings' });
    }
  }, [systemSettings]);
  
  // Run analysis
  const runAnalysis = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    toast.loading('Запуск анализа системы...', { id: 'analysis' });
    
    try {
      const response = await fetch('/api/optimization/demo?type=basic', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDemoResults(data);
          toast.success('Анализ завершен успешно!', { id: 'analysis' });
          
          // Reload data after analysis
          await loadOptimizationData();
        } else {
          throw new Error(data.error?.message || 'Analysis failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast.error(`Ошибка анализа: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'analysis' });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, loadOptimizationData]);

  // Initialize on mount
  useEffect(() => {
    loadOptimizationData();
  }, [loadOptimizationData]);
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(() => {
      loadOptimizationData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isInitialized, loadOptimizationData]);

  // Phase 3.2.5: Reload historical data when period changes
  useEffect(() => {
    if (isInitialized && optimizationHistory.length > 0) {
      loadHistoricalData();
    }
  }, [selectedHistoryPeriod, isInitialized, loadHistoricalData]);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full text-sm font-medium text-white border border-white/20 mb-6">
            <span>⚙️</span>
            <span>Optimization System</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Панель <span className="text-kupibilet-primary">Оптимизации</span>
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Мониторинг системы автоматической оптимизации агентов в реальном времени
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* System Health */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-primary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">
                  {status.status === 'running' ? '💚' : status.status === 'error' ? '❌' : status.status === 'maintenance' ? '🔧' : '⏸️'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Здоровье системы</h3>
                <p className="text-sm text-white/60">Общее состояние</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-kupibilet-primary mb-2">
              {isLoading ? '...' : `${Math.round(metrics.systemHealth)}%`}
            </div>
            <div className="text-sm text-white/60">
              {status.status === 'running' ? 'Система активна' : 
               status.status === 'error' ? 'Требует внимания' :
               status.status === 'maintenance' ? 'Обслуживание' : 'Остановлена'}
            </div>
          </div>

          {/* Active Agents */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-secondary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-secondary/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Активные агенты</h3>
                <p className="text-sm text-white/60">В работе сейчас</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-kupibilet-secondary mb-2">
              {isLoading ? '...' : metrics.activeAgents}
            </div>
            <div className="text-sm text-white/60">
              {metrics.activeAgents > 0 ? 'Content, Design, Delivery, Quality' : 'Агенты не активны'}
            </div>
          </div>

          {/* Success Rate */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-accent">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-accent/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Успешность</h3>
                <p className="text-sm text-white/60">Процент успеха</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-kupibilet-accent mb-2">
              {isLoading ? '...' : `${Math.round(metrics.successRate)}%`}
            </div>
            <div className="text-sm text-white/60">
              {metrics.successRate >= 90 ? 'Отличный показатель' :
               metrics.successRate >= 75 ? 'Хороший показатель' :
               metrics.successRate >= 50 ? 'Средний показатель' : 'Требует улучшения'}
            </div>
          </div>

          {/* Response Time */}
          <div className="glass-card p-6 border-t-2 border-t-white/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Время отклика</h3>
                <p className="text-sm text-white/60">Среднее время</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {isLoading ? '...' : `${metrics.avgResponseTime.toFixed(1)}s`}
            </div>
            <div className="text-sm text-white/60">
              {metrics.avgResponseTime <= 2 ? 'Быстрый отклик' :
               metrics.avgResponseTime <= 5 ? 'Нормальный отклик' : 'Медленный отклик'}
            </div>
          </div>
        </div>

        {/* Enhanced Performance Analytics - Phase 3.2.4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {/* Performance Trend */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-accent">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-accent/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">📈</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Тренд производительности</h3>
                <p className="text-sm text-white/60">За последние 24ч</p>
              </div>
            </div>
            <div className={`text-3xl font-bold mb-2 ${
              metrics.performanceTrend >= 0 ? 'text-kupibilet-primary' : 'text-red-400'
            }`}>
              {metrics.performanceTrend >= 0 ? '+' : ''}{metrics.performanceTrend.toFixed(1)}%
            </div>
            <div className="text-sm text-white/60">
              {metrics.performanceTrend >= 5 ? 'Отличный рост' :
               metrics.performanceTrend >= 0 ? 'Положительная динамика' :
               metrics.performanceTrend >= -2 ? 'Стабильное состояние' : 'Требует внимания'}
            </div>
          </div>

          {/* Efficiency Score */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-primary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Эффективность</h3>
                <p className="text-sm text-white/60">Общий балл</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-kupibilet-primary mb-2">
              {Math.round(metrics.efficiencyScore)}
            </div>
            <div className="text-sm text-white/60">
              {metrics.efficiencyScore >= 95 ? 'Превосходно' :
               metrics.efficiencyScore >= 85 ? 'Отлично' :
               metrics.efficiencyScore >= 75 ? 'Хорошо' : 'Средне'}
            </div>
          </div>

          {/* Optimization Impact */}
          <div className="glass-card p-6 border-t-2 border-t-kupibilet-secondary">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-kupibilet-secondary/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Влияние оптимизаций</h3>
                <p className="text-sm text-white/60">Улучшение системы</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-kupibilet-secondary mb-2">
              +{metrics.optimizationImpact.toFixed(1)}%
            </div>
            <div className="text-sm text-white/60">
              За последний месяц
            </div>
          </div>

          {/* Prediction Accuracy */}
          <div className="glass-card p-6 border-t-2 border-t-purple-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔮</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Точность прогнозов</h3>
                <p className="text-sm text-white/60">Предсказания ИИ</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {Math.round(metrics.predictionAccuracy)}%
            </div>
            <div className="text-sm text-white/60">
              {metrics.predictionAccuracy >= 90 ? 'Высокая точность' :
               metrics.predictionAccuracy >= 80 ? 'Хорошая точность' : 'Удовлетворительно'}
            </div>
          </div>
        </div>

        {/* Advanced Performance Dashboard */}
        <div className="glass-card p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">📊 Аналитика производительности</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-white/60 text-sm">Период:</span>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-kupibilet-primary"
                >
                  <option value="1h">1 час</option>
                  <option value="24h">24 часа</option>
                  <option value="7d">7 дней</option>
                  <option value="30d">30 дней</option>
                </select>
              </div>
              <button
                onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                {showAdvancedMetrics ? 'Скрыть детали' : 'Показать детали'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Performance Overview */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Тренды производительности</h3>
              <div className="bg-white/5 rounded-lg p-6">
                {performanceTrends && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-kupibilet-primary">
                          {performanceTrends.monthlyAggregate.totalOptimizations}
                        </div>
                        <div className="text-xs text-white/60">Оптимизаций за месяц</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-kupibilet-secondary">
                          {performanceTrends.monthlyAggregate.averagePerformance.toFixed(1)}%
                        </div>
                        <div className="text-xs text-white/60">Средняя производительность</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-kupibilet-accent">
                          +{performanceTrends.monthlyAggregate.improvementRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-white/60">Темп улучшений</div>
                      </div>
                    </div>
                    
                    {/* Simplified chart representation */}
                    <div className="mt-6">
                      <div className="text-sm text-white/60 mb-2">Динамика за последние 24 часа</div>
                      <div className="flex items-end space-x-1 h-20">
                        {performanceTrends.hourly.slice(-12).map((point, index) => (
                          <div
                            key={index}
                            className="bg-kupibilet-primary/60 rounded-t flex-1 transition-all hover:bg-kupibilet-primary"
                            style={{ height: `${(point.systemHealth / 100) * 80}px` }}
                            title={`${new Date(point.timestamp).getHours()}:00 - ${point.systemHealth.toFixed(1)}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Ключевые метрики</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80">Использование ресурсов</span>
                    <span className="text-kupibilet-primary font-semibold">
                      {Math.round(metrics.resourceUtilization)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-kupibilet-primary h-2 rounded-full transition-all"
                      style={{ width: `${metrics.resourceUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80">Снижение ошибок</span>
                    <span className="text-kupibilet-secondary font-semibold">
                      -{Math.round(metrics.errorReduction)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-kupibilet-secondary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, metrics.errorReduction * 2)}%` }}
                    />
                  </div>
                </div>

                {showAdvancedMetrics && (
                  <>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-kupibilet-accent mb-1">
                          {performanceTrends?.monthlyAggregate.issuesResolved || 0}
                        </div>
                        <div className="text-xs text-white/60">Проблем решено</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          {Math.round(metrics.predictionAccuracy)}%
                        </div>
                        <div className="text-xs text-white/60">Точность ИИ</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Real-time Monitoring */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Мониторинг в реальном времени</h2>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Общие оптимизации</span>
                <span className="text-2xl font-bold text-kupibilet-primary">
                  {isLoading ? '...' : metrics.totalOptimizations}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/80">Ожидающие рекомендации</span>
                <span className="text-2xl font-bold text-kupibilet-secondary">
                  {isLoading ? '...' : metrics.pendingRecommendations}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/80">Статус системы</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'running' ? 'bg-kupibilet-primary animate-pulse' :
                    status.status === 'error' ? 'bg-red-500' :
                    status.status === 'maintenance' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <span className={`font-medium ${
                    status.status === 'running' ? 'text-kupibilet-primary' :
                    status.status === 'error' ? 'text-red-400' :
                    status.status === 'maintenance' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {status.status === 'running' ? 'Активна' :
                     status.status === 'error' ? 'Ошибка' :
                     status.status === 'maintenance' ? 'Обслуживание' : 'Остановлена'}
                  </span>
                </div>
              </div>
              
              {lastUpdate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Последнее обновление</span>
                  <span className="text-white/60">
                    {new Date(lastUpdate).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* System Analysis */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Анализ системы</h2>
            
            <div className="space-y-4">
              <div className="text-center p-6 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-kupibilet-accent mb-2">
                  {isLoading ? '...' : Math.round(status.system_health_score)}
                </div>
                <div className="text-white/70">Общий балл здоровья</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white mb-1">
                    {isLoading ? '...' : analysis?.insights.bottlenecks_found || 0}
                  </div>
                  <div className="text-xs text-white/60">Узкие места</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white mb-1">
                    {isLoading ? '...' : analysis?.insights.error_patterns || 0}
                  </div>
                  <div className="text-xs text-white/60">Паттерны ошибок</div>
                </div>
              </div>
              
              {analysis && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/80 mb-2">Оценка системы:</div>
                  <div className="text-xs text-white/60">
                    {analysis.assessment || 'Анализ не завершен'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Engine Status Section */}
        <div className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🔧 Статус движка оптимизации</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Engine Health */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💚</span>
                Состояние движка
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Последний анализ</span>
                  <span className="text-sm text-white/60">
                    {status.last_analysis 
                      ? new Date(status.last_analysis).toLocaleString('ru-RU')
                      : 'Не выполнен'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Последняя оптимизация</span>
                  <span className="text-sm text-white/60">
                    {status.last_optimization 
                      ? new Date(status.last_optimization).toLocaleString('ru-RU')
                      : 'Не выполнена'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Активные задачи</span>
                  <span className={`text-sm font-medium ${
                    status.active_optimizations > 0 ? 'text-kupibilet-primary' : 'text-white/60'
                  }`}>
                    {status.active_optimizations}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Метрики производительности
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Оптимизаций сегодня</span>
                  <span className="text-lg font-bold text-kupibilet-secondary">
                    {status.total_optimizations_today}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Ожидающих рекомендаций</span>
                  <span className={`text-lg font-bold ${
                    status.recommendations_pending > 0 ? 'text-kupibilet-accent' : 'text-white/60'
                  }`}>
                    {status.recommendations_pending}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Эффективность</span>
                  <span className={`text-sm font-medium ${
                    metrics.successRate >= 90 ? 'text-kupibilet-primary' :
                    metrics.successRate >= 75 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {Math.round(metrics.successRate)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Engine Configuration */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">⚙️</span>
                Конфигурация
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Автооптимизация</span>
                  <div className={`w-3 h-3 rounded-full ${
                    status.status === 'running' ? 'bg-kupibilet-primary' : 'bg-gray-500'
                  }`}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Мониторинг</span>
                  <div className="w-3 h-3 rounded-full bg-kupibilet-primary"></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Безопасный режим</span>
                  <div className="w-3 h-3 rounded-full bg-kupibilet-primary"></div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-white/60">
                    Система работает в {status.status === 'running' ? 'активном' : 'пассивном'} режиме
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Engine Insights */}
          {analysis?.opportunities && analysis.opportunities.length > 0 && (
            <div className="mt-8 bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Возможности для оптимизации
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.opportunities.slice(0, 4).map((opportunity, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-kupibilet-accent rounded-full mt-2"></div>
                      <div className="text-sm text-white/80">{opportunity}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {analysis.opportunities.length > 4 && (
                <div className="text-center mt-4">
                  <span className="text-sm text-white/60">
                    +{analysis.opportunities.length - 4} дополнительных возможностей
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Recommendations Section - Phase 3.2.4 */}
        {(recommendations.length > 0 || recommendationCategories.length > 0) && (
          <div className="glass-card p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">💡 Интеллектуальные рекомендации</h2>
              <div className="text-sm text-white/60">
                {recommendations.length} активных рекомендаций
              </div>
            </div>

            {/* Recommendation Categories Overview */}
            {recommendationCategories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Анализ по категориям</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendationCategories.map((category, index) => (
                    <div key={category.category} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 capitalize text-sm">{category.category}</span>
                        <span className={`w-3 h-3 rounded-full ${
                          category.riskLevel === 'low' ? 'bg-green-500' :
                          category.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                      <div className="text-2xl font-bold text-kupibilet-primary mb-1">
                        {category.count}
                      </div>
                      <div className="text-xs text-white/60 mb-2">
                        Среднее влияние: +{category.averageImpact.toFixed(1)}%
                      </div>
                      <div className="text-xs text-kupibilet-accent">
                        ~${Math.round(category.estimatedValue).toLocaleString()} экономии
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Matrix */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Матрица приоритетов</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* High Priority */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-red-300 font-semibold">Высокий приоритет</span>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter(r => r.priority === 'high').slice(0, 3).map((rec, index) => (
                      <div key={rec.id || index} className="text-sm">
                        <div className="text-white font-medium">{rec.title}</div>
                        <div className="text-white/60 text-xs">
                          Влияние: +{rec.expected_impact?.performance_improvement || 0}%
                        </div>
                      </div>
                    ))}
                    {recommendations.filter(r => r.priority === 'high').length > 3 && (
                      <div className="text-xs text-red-300">
                        +{recommendations.filter(r => r.priority === 'high').length - 3} больше
                      </div>
                    )}
                  </div>
                </div>

                {/* Medium Priority */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-yellow-300 font-semibold">Средний приоритет</span>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter(r => r.priority === 'medium').slice(0, 3).map((rec, index) => (
                      <div key={rec.id || index} className="text-sm">
                        <div className="text-white font-medium">{rec.title}</div>
                        <div className="text-white/60 text-xs">
                          Влияние: +{rec.expected_impact?.performance_improvement || 0}%
                        </div>
                      </div>
                    ))}
                    {recommendations.filter(r => r.priority === 'medium').length > 3 && (
                      <div className="text-xs text-yellow-300">
                        +{recommendations.filter(r => r.priority === 'medium').length - 3} больше
                      </div>
                    )}
                  </div>
                </div>

                {/* Low Priority */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-300 font-semibold">Низкий приоритет</span>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter(r => r.priority === 'low').slice(0, 3).map((rec, index) => (
                      <div key={rec.id || index} className="text-sm">
                        <div className="text-white font-medium">{rec.title}</div>
                        <div className="text-white/60 text-xs">
                          Влияние: +{rec.expected_impact?.performance_improvement || 0}%
                        </div>
                      </div>
                    ))}
                    {recommendations.filter(r => r.priority === 'low').length > 3 && (
                      <div className="text-xs text-green-300">
                        +{recommendations.filter(r => r.priority === 'low').length - 3} больше
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Recommendations Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Детальные рекомендации</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendations.slice(0, 6).map((rec, index) => (
                  <div key={rec.id || index} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-kupibilet-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {rec.priority === 'high' ? 'Высокий' : rec.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        rec.safety?.risk_level === 'low' ? 'bg-green-500/20 text-green-300' :
                        rec.safety?.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {rec.safety?.risk_level === 'low' ? 'Низкий риск' :
                         rec.safety?.risk_level === 'medium' ? 'Средний риск' : 'Высокий риск'}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-semibold mb-2">{rec.title}</h3>
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{rec.description}</p>
                    
                    {/* Impact Visualization */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Влияние на производительность</span>
                        <span>+{rec.expected_impact?.performance_improvement || 0}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div
                          className="bg-kupibilet-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (rec.expected_impact?.performance_improvement || 0) * 2)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Время: {rec.estimated_duration || 'неизвестно'}</span>
                      <span className="text-kupibilet-accent">
                        ${Math.round(5000 + Math.random() * 15000).toLocaleString()}
                      </span>
                    </div>

                    {/* Action Button */}
                    <button className="w-full mt-3 px-3 py-2 bg-kupibilet-primary/20 hover:bg-kupibilet-primary/30 text-kupibilet-primary text-sm font-medium rounded-lg transition-colors">
                      {rec.safety?.risk_level === 'low' ? '🚀 Применить' : '👁️ Подробнее'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Timeline */}
            {recommendations.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">План внедрения</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Готовы к автоматическому применению</span>
                    <span className="text-kupibilet-primary font-bold">
                      {recommendations.filter(r => r.safety?.risk_level === 'low' && r.priority !== 'low').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Требуют ручной проверки</span>
                    <span className="text-yellow-400 font-bold">
                      {recommendations.filter(r => r.safety?.risk_level !== 'low' || r.priority === 'high').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Общее потенциальное улучшение</span>
                    <span className="text-kupibilet-secondary font-bold">
                      +{recommendations.reduce((sum, r) => sum + (r.expected_impact?.performance_improvement || 0), 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Предполагаемая экономия</span>
                    <span className="text-kupibilet-accent font-bold">
                      ${Math.round(recommendations.length * 12000).toLocaleString()}/месяц
                    </span>
                  </div>
                </div>
              </div>
            )}

            {recommendations.length > 6 && (
              <div className="text-center mt-6">
                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                  Показать все {recommendations.length} рекомендаций
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Demo Results */}
        {demoResults && (
          <div className="glass-card p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Результаты демонстрации</h2>
            
            <div className="bg-white/5 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-kupibilet-primary mb-2">
                    {demoResults.logs?.length || 0}
                  </div>
                  <div className="text-white/70">Записей в логе</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-kupibilet-secondary mb-2">
                    {demoResults.demo?.features?.length || 0}
                  </div>
                  <div className="text-white/70">Протестированных функций</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-kupibilet-accent mb-2">
                    {demoResults.summary?.status === 'completed_successfully' ? '✅' : '❌'}
                  </div>
                  <div className="text-white/70">Статус</div>
                </div>
              </div>
              
              {demoResults.demo?.features && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Протестированные функции:</h3>
                  <ul className="space-y-2">
                    {demoResults.demo.features.map((feature: string, index: number) => (
                      <li key={index} className="text-white/70 text-sm flex items-center">
                        <span className="text-kupibilet-primary mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 3.2.5: Optimization History and Trends Section */}
        <div className="glass-card p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">📈 История оптимизаций и тренды</h2>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedHistoryPeriod} 
                onChange={(e) => setSelectedHistoryPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-kupibilet-primary"
              >
                <option value="7d" className="bg-gray-800">7 дней</option>
                <option value="30d" className="bg-gray-800">30 дней</option>
                <option value="90d" className="bg-gray-800">90 дней</option>
                <option value="1y" className="bg-gray-800">1 год</option>
              </select>
              <button
                onClick={() => setShowHistoryDetails(!showHistoryDetails)}
                className="text-kupibilet-primary hover:text-kupibilet-accent transition-colors text-sm font-medium"
              >
                {showHistoryDetails ? 'Скрыть детали' : 'Показать детали'}
              </button>
            </div>
          </div>

          {/* Trend Analysis Overview */}
          {trendAnalysis && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Анализ трендов за {selectedHistoryPeriod}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Направление</span>
                    <span className={`text-sm font-medium ${
                      trendAnalysis.direction === 'improving' ? 'text-green-400' :
                      trendAnalysis.direction === 'declining' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {trendAnalysis.direction === 'improving' ? '↗️ Улучшение' :
                       trendAnalysis.direction === 'declining' ? '↘️ Ухудшение' : '→ Стабильно'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-kupibilet-primary">
                    {trendAnalysis.changePercentage > 0 ? '+' : ''}{trendAnalysis.changePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-white/60">
                    {trendAnalysis.strength} тренд
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Прогноз на неделю</span>
                    <span className="text-xs text-kupibilet-accent">📊</span>
                  </div>
                  <div className="text-2xl font-bold text-kupibilet-primary">
                    {trendAnalysis.predictions.nextWeek.toFixed(1)}%
                  </div>
                  <div className="text-xs text-white/60">
                    Уверенность: {(trendAnalysis.predictions.confidence * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Прогноз на месяц</span>
                    <span className="text-xs text-kupibilet-accent">🔮</span>
                  </div>
                  <div className="text-2xl font-bold text-kupibilet-primary">
                    {trendAnalysis.predictions.nextMonth.toFixed(1)}%
                  </div>
                  <div className="text-xs text-white/60">
                    Долгосрочный тренд
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Аномалии</span>
                    <span className="text-xs text-red-400">⚠️</span>
                  </div>
                  <div className="text-2xl font-bold text-kupibilet-primary">
                    {trendAnalysis.anomalies.length}
                  </div>
                  <div className="text-xs text-white/60">
                    {trendAnalysis.anomalies.filter(a => a.severity === 'high').length > 0 ? 
                      `${trendAnalysis.anomalies.filter(a => a.severity === 'high').length} критических` : 
                      'Все стабильно'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Performance Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">График производительности</h3>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80 text-sm">Динамика системных метрик</span>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-kupibilet-primary rounded-full"></div>
                    <span className="text-white/60">Производительность</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-kupibilet-accent rounded-full"></div>
                    <span className="text-white/60">Эффективность</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white/60">Надежность</span>
                  </div>
                </div>
              </div>
              
              {/* Simplified chart representation */}
              <div className="h-40 flex items-end space-x-1 bg-white/5 rounded p-4">
                {Array.from({ length: 30 }, (_, i) => {
                  const baseHeight = 20 + Math.sin(i * 0.2) * 15 + Math.random() * 10;
                  const performanceHeight = Math.max(10, baseHeight + (i % 7 === 0 ? -5 : 2));
                  const efficiencyHeight = Math.max(8, baseHeight * 0.8 + Math.random() * 8);
                  const reliabilityHeight = Math.max(12, baseHeight * 0.9 + Math.random() * 6);
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center space-y-1">
                      <div 
                        className="bg-kupibilet-primary/60 w-full rounded-sm transition-all hover:bg-kupibilet-primary"
                        style={{ height: `${performanceHeight}px` }}
                        title={`День ${30-i}: Производительность ${(85 + Math.random() * 15).toFixed(1)}%`}
                      ></div>
                      <div 
                        className="bg-kupibilet-accent/60 w-full rounded-sm transition-all hover:bg-kupibilet-accent"
                        style={{ height: `${efficiencyHeight}px` }}
                        title={`День ${30-i}: Эффективность ${(80 + Math.random() * 20).toFixed(1)}%`}
                      ></div>
                      <div 
                        className="bg-green-500/60 w-full rounded-sm transition-all hover:bg-green-500"
                        style={{ height: `${reliabilityHeight}px` }}
                        title={`День ${30-i}: Надежность ${(90 + Math.random() * 10).toFixed(1)}%`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-between text-xs text-white/50 mt-2">
                <span>30 дней назад</span>
                <span>15 дней назад</span>
                <span>Сегодня</span>
              </div>
            </div>
          </div>

          {/* Optimization History List */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">История оптимизаций</h3>
              <div className="flex items-center space-x-2">
                <select 
                  value={historyFilter} 
                  onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'completed' | 'failed' | 'rolled_back')}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-kupibilet-primary"
                >
                  <option value="all" className="bg-gray-800">Все</option>
                  <option value="completed" className="bg-gray-800">Выполнено</option>
                  <option value="failed" className="bg-gray-800">Ошибки</option>
                  <option value="rolled_back" className="bg-gray-800">Откаты</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              {optimizationHistory.length > 0 ? (
                optimizationHistory
                  .filter(entry => historyFilter === 'all' || entry.status === historyFilter)
                  .slice(0, showHistoryDetails ? 20 : 6)
                  .map((entry, index) => (
                    <div key={entry.id || index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`w-3 h-3 rounded-full ${
                              entry.status === 'completed' ? 'bg-green-500' :
                              entry.status === 'failed' ? 'bg-red-500' :
                              entry.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></span>
                            <span className="text-white font-medium">{entry.title}</span>
                            <span className="text-xs text-white/50">
                              {new Date(entry.timestamp).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              entry.appliedBy === 'system' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {entry.appliedBy === 'system' ? 'Автоматически' : 'Пользователем'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-white/70 mb-2">{entry.description}</div>
                          
                          {showHistoryDetails && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div className="text-xs">
                                <span className="text-white/50">Производительность: </span>
                                <span className="text-kupibilet-primary">+{entry.impact.performanceImprovement}%</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-white/50">Время отклика: </span>
                                <span className="text-green-400">-{entry.impact.responseTimeReduction}ms</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-white/50">Успешность: </span>
                                <span className="text-blue-400">+{entry.impact.successRateImprovement}%</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-white/50">Экономия: </span>
                                <span className="text-kupibilet-accent">${entry.impact.costSavings.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="text-xs text-white/60">
                            Уверенность: {(entry.confidence * 100).toFixed(0)}%
                          </div>
                          {entry.rollbackAvailable && entry.status === 'completed' && (
                            <button className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/20 hover:border-red-400/40 transition-colors">
                              🔙 Откат
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="bg-white/5 rounded-lg p-8 text-center">
                  <div className="text-white/60 mb-2">📊</div>
                  <div className="text-white/80 mb-1">История оптимизаций пуста</div>
                  <div className="text-white/60 text-sm">Запустите анализ для начала оптимизации системы</div>
                </div>
              )}
              
              {optimizationHistory.length > 6 && !showHistoryDetails && (
                <div className="text-center">
                  <button 
                    onClick={() => setShowHistoryDetails(true)}
                    className="text-kupibilet-primary hover:text-kupibilet-accent transition-colors text-sm font-medium"
                  >
                    Показать все {optimizationHistory.length} записей
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Historical Insights */}
          {historicalInsights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Исторические инсайты</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historicalInsights.slice(0, 4).map((insight, index) => (
                  <div key={insight.id || index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${
                          insight.trend === 'positive' ? 'bg-green-500' :
                          insight.trend === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-white/80 text-sm capitalize">{insight.category}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        insight.actionRequired ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {insight.actionRequired ? 'Требует внимания' : 'Информация'}
                      </span>
                    </div>
                    
                    <div className="text-white font-medium mb-1">{insight.title}</div>
                    <div className="text-sm text-white/70 mb-2">{insight.description}</div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">{insight.timeframe}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-kupibilet-primary">Влияние: {insight.impact.toFixed(1)}%</span>
                        <span className="text-white/50">Уверенность: {(insight.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {historicalInsights.length > 4 && (
                <div className="text-center mt-4">
                  <span className="text-sm text-white/60">
                    +{historicalInsights.length - 4} дополнительных инсайтов
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Key Trend Factors */}
          {trendAnalysis?.keyFactors && trendAnalysis.keyFactors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Ключевые факторы трендов</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendAnalysis.keyFactors.map((factor, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-kupibilet-accent rounded-full mt-2 flex-shrink-0"></div>
                      <div className="text-sm text-white/80">{factor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phase 3.2.6: Optimization Controls Panel */}
        <div className="glass-card p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🎛️ Управление оптимизациями</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-white/60 text-sm">Фильтр:</span>
                <select
                  value={controlsFilter}
                  onChange={(e) => setControlsFilter(e.target.value as any)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-kupibilet-primary"
                >
                  <option value="all">Все</option>
                  <option value="enabled">Включенные</option>
                  <option value="disabled">Отключенные</option>
                  <option value="running">Активные</option>
                </select>
              </div>
              <button
                onClick={() => setShowControlsPanel(!showControlsPanel)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                {showControlsPanel ? 'Скрыть панель' : 'Показать панель'}
              </button>
              <button
                onClick={() => setShowSystemSettings(!showSystemSettings)}
                className="px-4 py-2 bg-kupibilet-primary/20 hover:bg-kupibilet-primary/30 rounded-lg text-kupibilet-primary text-sm transition-colors"
              >
                ⚙️ Настройки системы
              </button>
            </div>
          </div>

          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Активные оптимизации</span>
                <span className="text-lg">🔄</span>
              </div>
              <div className="text-2xl font-bold text-kupibilet-primary">
                {activeOptimizations.length}
              </div>
              <div className="text-xs text-white/60">
                из {optimizationControls.filter(c => c.enabled).length} включенных
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Общий статус</span>
                <span className="text-lg">
                  {systemSettings?.globalOptimizationEnabled ? '✅' : '⏸️'}
                </span>
              </div>
              <div className="text-2xl font-bold text-kupibilet-secondary">
                {systemSettings?.globalOptimizationEnabled ? 'Активна' : 'Приостановлена'}
              </div>
              <div className="text-xs text-white/60">
                Глобальное состояние
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Средняя эффективность</span>
                <span className="text-lg">📈</span>
              </div>
              <div className="text-2xl font-bold text-kupibilet-accent">
                {optimizationControls.length > 0 ? 
                  (optimizationControls.reduce((acc, c) => acc + c.averageImpact, 0) / optimizationControls.length).toFixed(1) 
                  : '0.0'}%
              </div>
              <div className="text-xs text-white/60">
                Влияние оптимизаций
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Требует одобрения</span>
                <span className="text-lg">⚠️</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {optimizationControls.filter(c => c.requiresApproval && c.enabled).length}
              </div>
              <div className="text-xs text-white/60">
                Высокорисковые операции
              </div>
            </div>
          </div>

          {/* Controls Grid */}
          {showControlsPanel && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {optimizationControls
                  .filter(control => {
                    if (controlsFilter === 'enabled') return control.enabled;
                    if (controlsFilter === 'disabled') return !control.enabled;
                    if (controlsFilter === 'running') return control.status === 'running';
                    return true;
                  })
                  .map((control) => (
                    <div 
                      key={control.id} 
                      className={`bg-white/5 rounded-lg p-6 border-l-4 transition-all hover:bg-white/10 ${
                        control.status === 'running' ? 'border-l-kupibilet-primary' :
                        control.enabled ? 'border-l-green-500' :
                        'border-l-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{control.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              control.status === 'running' ? 'bg-kupibilet-primary/20 text-kupibilet-primary' :
                              control.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              control.status === 'error' ? 'bg-red-500/20 text-red-400' :
                              control.status === 'paused' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {control.status === 'running' ? 'Выполняется' :
                               control.status === 'pending' ? 'Ожидание' :
                               control.status === 'error' ? 'Ошибка' :
                               control.status === 'paused' ? 'Приостановлена' : 'Готова'}
                            </span>
                          </div>
                          <p className="text-sm text-white/70 mb-3">{control.description}</p>
                          
                          <div className="space-y-2 text-xs text-white/60">
                            <div className="flex justify-between">
                              <span>Успешность:</span>
                              <span className="text-green-400">{control.successRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Среднее влияние:</span>
                              <span className="text-kupibilet-accent">+{control.averageImpact.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Длительность:</span>
                              <span>{control.estimatedDuration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Уровень риска:</span>
                              <span className={
                                control.riskLevel === 'high' ? 'text-red-400' :
                                control.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                              }>
                                {control.riskLevel === 'high' ? 'Высокий' :
                                 control.riskLevel === 'medium' ? 'Средний' : 'Низкий'}
                              </span>
                            </div>
                            {control.lastRun && (
                              <div className="flex justify-between">
                                <span>Последний запуск:</span>
                                <span>{new Date(control.lastRun).toLocaleDateString('ru-RU')}</span>
                              </div>
                            )}
                            {control.nextRun && (
                              <div className="flex justify-between">
                                <span>Следующий запуск:</span>
                                <span>{new Date(control.nextRun).toLocaleDateString('ru-RU')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Control Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleOptimizationControl(control.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            control.enabled 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          }`}
                        >
                          {control.enabled ? 'Отключить' : 'Включить'}
                        </button>

                        {control.enabled && control.status !== 'running' && (
                          <button
                            onClick={() => runOptimizationControl(control.id)}
                            disabled={control.requiresApproval}
                            className="px-3 py-1 bg-kupibilet-primary/20 text-kupibilet-primary hover:bg-kupibilet-primary/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {control.requiresApproval ? 'Требует одобрения' : 'Запустить'}
                          </button>
                        )}

                        {control.status === 'running' && (
                          <button
                            onClick={() => pauseOptimizationControl(control.id)}
                            className="px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
                          >
                            Приостановить
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedControl(selectedControl === control.id ? null : control.id)}
                          className="px-3 py-1 bg-white/10 text-white/80 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          {selectedControl === control.id ? 'Скрыть' : 'Настройки'}
                        </button>
                      </div>

                      {/* Expanded Configuration */}
                      {selectedControl === control.id && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <h4 className="text-white/80 font-medium mb-2">Пороги срабатывания:</h4>
                              <div className="space-y-1 text-white/60">
                                <div>CPU: {control.config.thresholds.cpu.toFixed(1)}%</div>
                                <div>Память: {control.config.thresholds.memory.toFixed(1)}%</div>
                                <div>Время отклика: {control.config.thresholds.responseTime.toFixed(0)}ms</div>
                                <div>Ошибки: {control.config.thresholds.errorRate.toFixed(1)}%</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-white/80 font-medium mb-2">Расписание:</h4>
                              <div className="space-y-1 text-white/60">
                                <div>Включено: {control.config.schedule.enabled ? 'Да' : 'Нет'}</div>
                                <div>Частота: {control.config.schedule.frequency}</div>
                                <div>Время: {control.config.schedule.time}</div>
                                <div>Приоритет: {control.config.priority}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* System Settings Panel */}
          {showSystemSettings && systemSettings && (
            <div className="mt-8 bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-6">⚙️ Системные настройки</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Settings */}
                <div>
                  <h4 className="text-white/80 font-medium mb-4">Общие настройки</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Глобальная оптимизация</span>
                      <button
                        onClick={() => updateSystemSettings({ 
                          globalOptimizationEnabled: !systemSettings.globalOptimizationEnabled 
                        })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          systemSettings.globalOptimizationEnabled 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {systemSettings.globalOptimizationEnabled ? 'Включена' : 'Отключена'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Порог авто-одобрения</span>
                      <span className="text-kupibilet-primary">{systemSettings.autoApprovalThreshold}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Макс. одновременных оптимизаций</span>
                      <span className="text-kupibilet-accent">{systemSettings.maxConcurrentOptimizations}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Окно отката (часы)</span>
                      <span className="text-white">{systemSettings.rollbackWindow}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Thresholds */}
                <div>
                  <h4 className="text-white/80 font-medium mb-4">Пороги производительности</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Критический CPU</span>
                      <span className="text-red-400">{systemSettings.performanceThresholds.criticalCpuUsage}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Критическая память</span>
                      <span className="text-red-400">{systemSettings.performanceThresholds.criticalMemoryUsage}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Макс. время отклика</span>
                      <span className="text-yellow-400">{systemSettings.performanceThresholds.maxResponseTime}ms</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Мин. уровень успеха</span>
                      <span className="text-green-400">{systemSettings.performanceThresholds.minSuccessRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div>
                  <h4 className="text-white/80 font-medium mb-4">Уведомления</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Email-уведомления</span>
                      <button
                        onClick={() => updateSystemSettings({ 
                          notificationSettings: {
                            ...systemSettings.notificationSettings,
                            emailAlerts: !systemSettings.notificationSettings.emailAlerts
                          }
                        })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          systemSettings.notificationSettings.emailAlerts 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {systemSettings.notificationSettings.emailAlerts ? 'Включены' : 'Отключены'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Slack-интеграция</span>
                      <button
                        onClick={() => updateSystemSettings({ 
                          notificationSettings: {
                            ...systemSettings.notificationSettings,
                            slackIntegration: !systemSettings.notificationSettings.slackIntegration
                          }
                        })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          systemSettings.notificationSettings.slackIntegration 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {systemSettings.notificationSettings.slackIntegration ? 'Включена' : 'Отключена'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Backup Settings */}
                <div>
                  <h4 className="text-white/80 font-medium mb-4">Резервное копирование</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Авто-бэкапы</span>
                      <button
                        onClick={() => updateSystemSettings({ 
                          backupSettings: {
                            ...systemSettings.backupSettings,
                            autoBackupEnabled: !systemSettings.backupSettings.autoBackupEnabled
                          }
                        })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          systemSettings.backupSettings.autoBackupEnabled 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {systemSettings.backupSettings.autoBackupEnabled ? 'Включены' : 'Отключены'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Хранение (дни)</span>
                      <span className="text-white">{systemSettings.backupSettings.retentionDays}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/70">S3 Bucket</span>
                      <span className="text-kupibilet-primary text-xs">{systemSettings.backupSettings.s3Bucket}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={runAnalysis}
            className="glass-button px-8 py-3 bg-kupibilet-primary hover:bg-kupibilet-primary/80 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Анализ...' : '🔍 Запустить анализ'}
          </button>
          
          <button 
            onClick={loadOptimizationData}
            className="glass-button px-8 py-3 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Обновление...' : '🔄 Обновить данные'}
          </button>
          
          <button 
            onClick={() => {
              if (demoResults) {
                setDemoResults(null);
              } else {
                toast('Настройки будут доступны в следующих версиях', {
                  icon: 'ℹ️',
                  duration: 3000,
                });
              }
            }}
            className="glass-button px-8 py-3 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-300"
          >
            {demoResults ? '🗑️ Очистить результаты' : '⚙️ Настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}