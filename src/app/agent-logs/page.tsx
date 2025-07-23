'use client';

import { RefreshCw, Filter, Search, Download, Trash2, Settings, Clock, AlertCircle, Info, Bug, AlertTriangle, Zap, Activity, Bell, BellOff, Plus, Eye, EyeOff, BarChart3, Cpu, MemoryStick, TrendingUp, Target, Play, BarChart2, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  timestamp: string;
  tool?: string;
  error?: string;
  duration?: number;
  requestId?: string;
  userId?: string;
}

interface Metrics {
  totalLogs: number;
  successRate: number;
  avgDuration: number;
  activeAgents: number;
  logLevels: Record<string, number>;
  timeRange: {
    start: string;
    end: string;
    duration?: number;
  };
}

interface LogsData {
  logs: LogEntry[];
  metrics: Metrics;
  traces: any[];
  summary: {
    total_logs: number;
    log_levels: Record<string, number>;
    time_range: {
      start: string;
      end: string;
      duration: number;
    } | null;
    active_traces: number;
  };
}

interface Alert {
  id: string;
  name: string;
  type: 'error_threshold' | 'performance_degradation' | 'agent_down' | 'custom';
  enabled: boolean;
  conditions: {
    level?: string[];
    agent?: string[];
    error_rate_threshold?: number;
    response_time_threshold?: number;
    frequency_threshold?: number;
    time_window_minutes?: number;
  };
  actions: {
    notification: boolean;
    email?: string[];
    webhook?: string;
    escalation_timeout_minutes?: number;
  };
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
  status: 'active' | 'triggered' | 'resolved' | 'snoozed';
}

interface AlertsData {
  alerts: Alert[];
  statistics: {
    total_alerts: number;
    active_alerts: number;
    triggered_alerts: number;
    resolved_alerts: number;
  };
}

const iconMap = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle
};

export default function AgentLogsPage() {
  const [logsData, setLogsData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval] = useState(10);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, _setLimit] = useState(100);
  const [since, _setSince] = useState<string>('');
  const [clearingLogs, setClearingLogs] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // Error tracking and alerts state
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [trackingError, setTrackingError] = useState(false);

  // Phase 3.3.6: Performance debugging state
  const [showPerformanceTools, setShowPerformanceTools] = useState(false);
  // const [_profilingData, setProfilingData] = useState<any>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<any>(null);
  const [activeProfiles, setActiveProfiles] = useState<any[]>([]);
  const [debugSessions, setDebugSessions] = useState<any[]>([]);
  // const [showProfilingModal, setShowProfilingModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('content-specialist');

  // Fetch logs data from API
  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        level: levelFilter,
        limit: limit.toString(),
        format: 'json'
      });
      
      if (toolFilter !== 'all') {
        params.append('tool', toolFilter);
      }
      
      if (since) {
        params.append('since', since);
      }

      const response = await fetch(`/api/agent/logs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLogsData(data.data);
        setError(null);
        setLastUpdate(new Date().toISOString());
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Network error: Unable to connect to logs API');
    } finally {
      setLoading(false);
    }
  };

  // Clear logs action
  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    setClearingLogs(true);
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchLogs(); // Refresh logs
        alert('Logs cleared successfully');
      } else {
        alert(`Failed to clear logs: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
      alert('Error clearing logs');
    } finally {
      setClearingLogs(false);
    }
  };

  // Export logs action
  const exportLogs = async (format: 'json' | 'text' = 'json') => {
    setExportingLogs(true);
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', format })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Logs exported successfully: ${result.result.filename}`);
      } else {
        alert(`Failed to export logs: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to export logs:', err);
      alert('Error exporting logs');
    } finally {
      setExportingLogs(false);
    }
  };

  // Fetch alerts data
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_alerts' })
      });
      
      const result = await response.json();
      if (result.success) {
        setAlertsData(result);
      } else {
        console.error('Failed to fetch alerts:', result.error);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  // Track error
  const trackError = async (logEntry: LogEntry) => {
    if (logEntry.level !== 'error' && logEntry.level !== 'warn') return;
    
    setTrackingError(true);
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_error',
          errorData: {
            message: logEntry.msg,
            level: logEntry.level,
            agent: logEntry.tool || 'unknown',
            tool: logEntry.tool,
            context: { requestId: logEntry.requestId, duration: logEntry.duration },
            userId: logEntry.userId
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Error tracked successfully:', result.error_tracked);
        // Refresh alerts to show any triggered alerts
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to track error:', err);
    } finally {
      setTrackingError(false);
    }
  };

  // Create alert
  const createAlert = async (alertConfig: Partial<Alert>) => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_alert',
          alertConfig
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Alert "${result.alert_created.name}" created successfully`);
        await fetchAlerts();
        setShowCreateAlert(false);
      } else {
        alert(`Failed to create alert: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
      alert('Error creating alert');
    }
  };

  // Toggle alert
  const toggleAlert = async (alertId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_alert',
          alertId,
          alertConfig: { enabled }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchAlerts();
      } else {
        alert(`Failed to toggle alert: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to toggle alert:', err);
    }
  };

  // Phase 3.3.6: Performance debugging functions
  const startProfiling = async (agentId: string) => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_profiling',
          profilingConfig: {
            agent_id: agentId,
            duration_ms: 60000, // 1 minute
            sample_interval_ms: 1000,
            include_memory: true,
            include_cpu: true,
            include_network: true
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Profiling started for ${agentId}. ID: ${result.profiling_id}`);
        await fetchActiveProfiles();
      } else {
        alert(`Failed to start profiling: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to start profiling:', err);
      alert('Error starting profiling');
    }
  };

  const analyzePerformance = async (agentId: string) => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_performance',
          analysisConfig: {
            agent_id: agentId,
            time_period_hours: 24
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setPerformanceAnalysis(result.performance_analysis);
        setShowAnalysisModal(true);
      } else {
        alert(`Failed to analyze performance: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to analyze performance:', err);
      alert('Error analyzing performance');
    }
  };

  const detectBottlenecks = async (agentId: string) => {
    try {
      const response = await fetch('/api/agent/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bottleneck_detection',
          detectionConfig: {
            agent_id: agentId,
            threshold_percentile: 95
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Found ${result.bottlenecks_detected.length} bottlenecks for ${agentId}`);
        console.log('Bottlenecks detected:', result.bottlenecks_detected);
      } else {
        alert(`Failed to detect bottlenecks: ${result.error}`);
      }
    } catch (err) {
      console.error('Failed to detect bottlenecks:', err);
      alert('Error detecting bottlenecks');
    }
  };

  const fetchActiveProfiles = async () => {
    // This would fetch active profiling sessions in a real implementation
    // For now, we'll simulate it
    setActiveProfiles([]);
  };

  const fetchDebugSessions = async () => {
    // This would fetch active debug sessions in a real implementation
    // For now, we'll simulate it
    setDebugSessions([]);
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchLogs();
    fetchAlerts();
    fetchActiveProfiles();
    fetchDebugSessions();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchAlerts();
        fetchActiveProfiles();
        fetchDebugSessions();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [autoRefresh, refreshInterval, levelFilter, toolFilter, limit, since]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchLogs();
  };

  // Filter logs based on search query
  const filteredLogs = logsData?.logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.msg.toLowerCase().includes(query) ||
        log.tool?.toLowerCase().includes(query) ||
        log.requestId?.toLowerCase().includes(query) ||
        log.error?.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#FF6240';
      case 'warn': return '#E03EEF';
      case 'info': return '#4BFF7E';
      case 'debug': return '#1DA857';
      default: return '#FFFFFF';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getToolDisplayName = (tool: string) => {
    const toolNames: Record<string, string> = {
      'content-specialist': 'Content Specialist',
      'design-specialist': 'Design Specialist',
      'quality-specialist': 'Quality Specialist',
      'delivery-specialist': 'Delivery Specialist',
      'system': 'System'
    };
    return toolNames[tool] || tool;
  };

  if (loading && !logsData) {
    return (
      <div className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-kupibilet-primary mx-auto mb-4 animate-spin" />
          <p className="text-white/70">Загрузка логов агентов...</p>
        </div>
      </div>
    );
  }

  if (error && !logsData) {
    return (
      <div className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ошибка загрузки логов</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white rounded-lg transition-all duration-200"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  const logs = filteredLogs;
  const metrics = logsData?.metrics || {
    totalLogs: 0,
    successRate: 0,
    avgDuration: 0,
    activeAgents: 0,
    logLevels: { debug: 0, info: 0, warn: 0, error: 0 },
    timeRange: { start: '', end: '' }
  };

  const availableTools = Array.from(new Set(
    logsData?.logs.map(log => log.tool).filter(Boolean) || []
  ));

  return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-glass-primary rounded-full text-sm font-medium text-kupibilet-primary border border-kupibilet-primary/20 mb-6">
              <Activity className="w-4 h-4" />
              <span>Real-time Monitoring</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Логи <span className="text-kupibilet-primary">Агентов</span>
              </h1>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 bg-glass-surface hover:bg-glass-primary border border-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Обновить логи"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 border border-white/20 rounded-lg transition-all duration-200 ${
                    autoRefresh ? 'bg-kupibilet-primary text-white' : 'bg-glass-surface text-white/70'
                  }`}
                  title={autoRefresh ? 'Отключить автообновление' : 'Включить автообновление'}
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Мониторинг в реальном времени и анализ работы AI-агентов
            </p>
            
            {lastUpdate && (
              <div className="mt-4 text-sm text-white/50">
                Последнее обновление: {new Date(lastUpdate).toLocaleTimeString('ru-RU')}
                {autoRefresh && <span className="ml-2 text-kupibilet-primary">• Авто-обновление включено</span>}
              </div>
            )}
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
              <div className="text-2xl font-bold text-kupibilet-primary mb-1">
                {logsData?.summary.total_logs || 0}
              </div>
              <div className="text-sm text-white/60">Всего логов</div>
            </div>
            
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
              <div className="text-2xl font-bold text-kupibilet-secondary mb-1">
                {metrics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-white/60">Успешность</div>
            </div>
            
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
              <div className="text-2xl font-bold text-kupibilet-accent mb-1">
                {formatDuration(metrics.avgDuration)}
              </div>
              <div className="text-sm text-white/60">Среднее время</div>
            </div>
            
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
              <div className="text-2xl font-bold text-kupibilet-primary mb-1">
                {logsData?.summary.active_traces || 0}
              </div>
              <div className="text-sm text-white/60">Активных трейсов</div>
            </div>

            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
              <div className={`text-2xl font-bold mb-1 ${
                alertsData?.statistics.triggered_alerts ? 'text-red-400' : 'text-green-400'
              }`}>
                {alertsData?.statistics.triggered_alerts || 0}
              </div>
              <div className="text-sm text-white/60">Активных алертов</div>
            </div>
          </div>

          {/* Controls and Filters */}
          <div className="bg-glass-surface rounded-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Log Level Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/50" />
                  <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="all">Все уровни</option>
                    <option value="error">Только ошибки</option>
                    <option value="warn">Предупреждения+</option>
                    <option value="info">Информация+</option>
                    <option value="debug">Debug+</option>
                  </select>
                </div>

                {/* Tool Filter */}
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-white/50" />
                  <select
                    value={toolFilter}
                    onChange={(e) => setToolFilter(e.target.value)}
                    className="px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="all">Все агенты</option>
                    {availableTools.map(tool => (
                      <option key={tool} value={tool}>{getToolDisplayName(tool || '')}</option>
                    ))}
                  </select>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Поиск в логах..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white text-sm placeholder-white/50 w-48"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPerformanceTools(!showPerformanceTools)}
                  className={`px-3 py-2 border border-white/20 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                    showPerformanceTools ? 'bg-kupibilet-primary text-white' : 'bg-glass-primary hover:bg-glass-surface text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Отладка производительности
                </button>

                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className={`px-3 py-2 border border-white/20 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                    showAlerts ? 'bg-kupibilet-primary text-white' : 'bg-glass-primary hover:bg-glass-surface text-white'
                  }`}
                >
                  {alertsData?.statistics.triggered_alerts ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  Алерты ({alertsData?.statistics.total_alerts || 0})
                </button>

                <button
                  onClick={() => setShowCreateAlert(true)}
                  className="px-3 py-2 bg-glass-primary hover:bg-glass-surface border border-white/20 rounded-lg text-white text-sm transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Создать алерт
                </button>
                
                <button
                  onClick={() => exportLogs('json')}
                  disabled={exportingLogs}
                  className="px-3 py-2 bg-glass-primary hover:bg-glass-surface border border-white/20 rounded-lg text-white text-sm transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                </button>
                
                <button
                  onClick={clearLogs}
                  disabled={clearingLogs}
                  className="px-3 py-2 bg-red-400/20 hover:bg-red-400/30 border border-red-400/20 rounded-lg text-red-400 text-sm transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearingLogs ? 'Очистка...' : 'Очистить'}
                </button>
              </div>
            </div>

            {/* Log Levels Summary */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-3">Распределение по уровням:</h3>
              <div className="flex gap-6 flex-wrap">
                {Object.entries(logsData?.summary.log_levels || {}).map(([level, count]) => {
                  const IconComponent = iconMap[level as keyof typeof iconMap] || Info;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLogLevelColor(level) }}></div>
                      <IconComponent className="w-4 h-4" style={{ color: getLogLevelColor(level) }} />
                      <span className="text-sm text-white/70 uppercase">{level}</span>
                      <span className="text-sm font-bold" style={{ color: getLogLevelColor(level) }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Tools Panel */}
          {showPerformanceTools && (
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Инструменты отладки производительности</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="px-3 py-1 bg-glass-primary border border-white/20 rounded-lg text-white text-sm"
                  >
                    <option value="content-specialist">Content Specialist</option>
                    <option value="design-specialist">Design Specialist</option>
                    <option value="quality-specialist">Quality Specialist</option>
                    <option value="delivery-specialist">Delivery Specialist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => startProfiling(selectedAgent)}
                  className="p-4 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/30 rounded-lg text-white transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <Play className="w-6 h-6 text-blue-400" />
                  <span className="font-medium">Начать профилирование</span>
                  <span className="text-xs text-white/60">Собрать данные производительности</span>
                </button>

                <button
                  onClick={() => analyzePerformance(selectedAgent)}
                  className="p-4 bg-green-400/10 hover:bg-green-400/20 border border-green-400/30 rounded-lg text-white transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <BarChart2 className="w-6 h-6 text-green-400" />
                  <span className="font-medium">Анализ производительности</span>
                  <span className="text-xs text-white/60">Получить отчет о производительности</span>
                </button>

                <button
                  onClick={() => detectBottlenecks(selectedAgent)}
                  className="p-4 bg-orange-400/10 hover:bg-orange-400/20 border border-orange-400/30 rounded-lg text-white transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <Target className="w-6 h-6 text-orange-400" />
                  <span className="font-medium">Поиск узких мест</span>
                  <span className="text-xs text-white/60">Найти проблемы производительности</span>
                </button>

                <button
                  onClick={() => {
                    // Start resource monitoring
                    fetch('/api/agent/logs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'resource_monitoring',
                        monitoringConfig: {
                          duration_minutes: 5,
                          sample_interval_seconds: 10
                        }
                      })
                    }).then(response => response.json())
                    .then(result => {
                      if (result.success) {
                        alert(`Мониторинг ресурсов запущен. ID: ${result.monitoring_id}`);
                      } else {
                        alert(`Ошибка запуска мониторинга: ${result.error}`);
                      }
                    });
                  }}
                  className="p-4 bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/30 rounded-lg text-white transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <Monitor className="w-6 h-6 text-purple-400" />
                  <span className="font-medium">Мониторинг ресурсов</span>
                  <span className="text-xs text-white/60">Отслеживать CPU, память, сеть</span>
                </button>
              </div>

              {/* Active Profiles and Sessions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Активные профили ({activeProfiles.length})
                  </h4>
                  {activeProfiles.length === 0 ? (
                    <div className="text-center py-4 text-white/50 text-sm">
                      Нет активных профилей
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeProfiles.map((profile) => (
                        <div key={profile.id} className="p-3 bg-glass-primary rounded-lg border border-white/10">
                          <div className="text-sm font-medium text-white">{profile.agent_id}</div>
                          <div className="text-xs text-white/60">{profile.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Bug className="w-4 h-4" />
                    Сессии отладки ({debugSessions.length})
                  </h4>
                  {debugSessions.length === 0 ? (
                    <div className="text-center py-4 text-white/50 text-sm">
                      Нет активных сессий отладки
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {debugSessions.map((session) => (
                        <div key={session.id} className="p-3 bg-glass-primary rounded-lg border border-white/10">
                          <div className="text-sm font-medium text-white">{session.agent_id}</div>
                          <div className="text-xs text-white/60">{session.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alerts Panel */}
          {showAlerts && alertsData && (
            <div className="bg-glass-surface rounded-xl border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Система алертов</h3>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>Активных: {alertsData.statistics.active_alerts}</span>
                  <span>•</span>
                  <span>Сработавших: {alertsData.statistics.triggered_alerts}</span>
                </div>
              </div>

              {alertsData.alerts.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Алерты не настроены</p>
                  <p className="text-sm mt-1">Создайте первый алерт для мониторинга ошибок</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertsData.alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${
                      alert.status === 'triggered' ? 'bg-red-400/10 border-red-400/30' :
                      alert.enabled ? 'bg-green-400/10 border-green-400/30' :
                      'bg-gray-400/10 border-gray-400/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{alert.name}</h4>
                        <button
                          onClick={() => toggleAlert(alert.id, !alert.enabled)}
                          className={`p-1 rounded ${alert.enabled ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {alert.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="text-sm text-white/70 mb-2">
                        Тип: {alert.type}
                      </div>
                      
                      <div className={`text-xs px-2 py-1 rounded inline-block ${
                        alert.status === 'triggered' ? 'bg-red-400/20 text-red-400' :
                        alert.status === 'active' ? 'bg-green-400/20 text-green-400' :
                        'bg-gray-400/20 text-gray-400'
                      }`}>
                        {alert.status === 'triggered' ? 'Сработал' :
                         alert.status === 'active' ? 'Активен' : 'Неактивен'}
                      </div>
                      
                      {alert.trigger_count > 0 && (
                        <div className="text-xs text-white/50 mt-2">
                          Сработал: {alert.trigger_count} раз
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Alert Modal */}
          {showCreateAlert && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 max-w-lg w-full">
                <h3 className="text-lg font-semibold text-white mb-4">Создать алерт</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Название алерта</label>
                    <input
                      type="text"
                      placeholder="Например: Критические ошибки агентов"
                      className="w-full px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white placeholder-white/50"
                      id="alertName"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Тип алерта</label>
                    <select className="w-full px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white" id="alertType">
                      <option value="error_threshold">Превышение порога ошибок</option>
                      <option value="performance_degradation">Снижение производительности</option>
                      <option value="agent_down">Агент недоступен</option>
                      <option value="custom">Пользовательский</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Уровни логов</label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" className="rounded" defaultChecked /> Error
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" className="rounded" /> Warn
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input type="checkbox" className="rounded" /> Critical
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Порог ошибок (в минуту)</label>
                    <input
                      type="number"
                      placeholder="5"
                      min="1"
                      className="w-full px-3 py-2 bg-glass-primary border border-white/20 rounded-lg text-white placeholder-white/50"
                      id="errorThreshold"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      const name = (document.getElementById('alertName') as HTMLInputElement)?.value;
                      const type = (document.getElementById('alertType') as HTMLSelectElement)?.value as any;
                      const threshold = parseInt((document.getElementById('errorThreshold') as HTMLInputElement)?.value || '5');
                      
                      if (name) {
                        createAlert({
                          name,
                          type,
                          conditions: {
                            level: ['error'],
                            error_rate_threshold: threshold,
                            time_window_minutes: 1
                          },
                          actions: {
                            notification: true
                          }
                        });
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-kupibilet-primary hover:bg-kupibilet-primary/90 text-white rounded-lg transition-all duration-200"
                  >
                    Создать алерт
                  </button>
                  <button
                    onClick={() => setShowCreateAlert(false)}
                    className="px-4 py-2 bg-glass-primary hover:bg-glass-surface border border-white/20 text-white rounded-lg transition-all duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Performance Analysis Modal */}
          {showAnalysisModal && performanceAnalysis && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Анализ производительности: {performanceAnalysis.agent_id}
                  </h3>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-white text-xl">×</span>
                  </button>
                </div>

                {/* Overall Score */}
                <div className="mb-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${
                      performanceAnalysis.overall_score >= 80 ? 'text-green-400' :
                      performanceAnalysis.overall_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {performanceAnalysis.overall_score}/100
                    </div>
                    <div className="text-white/70">Общий балл производительности</div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white/70">Среднее время отклика</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.avg_response_time_ms.toFixed(0)}ms
                    </div>
                  </div>

                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/70">P95 время отклика</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.p95_response_time_ms.toFixed(0)}ms
                    </div>
                  </div>

                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-white/70">Процент ошибок</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.error_rate_percent.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white/70">Пропускная способность</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.throughput_per_minute.toFixed(1)}/мин
                    </div>
                  </div>

                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MemoryStick className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-white/70">Эффективность памяти</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.memory_efficiency_score.toFixed(0)}%
                    </div>
                  </div>

                  <div className="bg-glass-primary p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-white/70">Эффективность CPU</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {performanceAnalysis.metrics.cpu_efficiency_score.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Trends */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Тренды</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg ${
                      performanceAnalysis.trends.response_time_trend === 'improving' ? 'bg-green-400/10 border border-green-400/30' :
                      performanceAnalysis.trends.response_time_trend === 'stable' ? 'bg-blue-400/10 border border-blue-400/30' :
                      'bg-red-400/10 border border-red-400/30'
                    }`}>
                      <div className="text-sm text-white/70">Время отклика</div>
                      <div className="font-medium text-white capitalize">
                        {performanceAnalysis.trends.response_time_trend === 'improving' ? 'Улучшается' :
                         performanceAnalysis.trends.response_time_trend === 'stable' ? 'Стабильно' : 'Ухудшается'}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${
                      performanceAnalysis.trends.error_rate_trend === 'improving' ? 'bg-green-400/10 border border-green-400/30' :
                      performanceAnalysis.trends.error_rate_trend === 'stable' ? 'bg-blue-400/10 border border-blue-400/30' :
                      'bg-red-400/10 border border-red-400/30'
                    }`}>
                      <div className="text-sm text-white/70">Частота ошибок</div>
                      <div className="font-medium text-white capitalize">
                        {performanceAnalysis.trends.error_rate_trend === 'improving' ? 'Улучшается' :
                         performanceAnalysis.trends.error_rate_trend === 'stable' ? 'Стабильно' : 'Ухудшается'}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${
                      performanceAnalysis.trends.memory_trend === 'improving' ? 'bg-green-400/10 border border-green-400/30' :
                      performanceAnalysis.trends.memory_trend === 'stable' ? 'bg-blue-400/10 border border-blue-400/30' :
                      'bg-red-400/10 border border-red-400/30'
                    }`}>
                      <div className="text-sm text-white/70">Использование памяти</div>
                      <div className="font-medium text-white capitalize">
                        {performanceAnalysis.trends.memory_trend === 'improving' ? 'Улучшается' :
                         performanceAnalysis.trends.memory_trend === 'stable' ? 'Стабильно' : 'Ухудшается'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {performanceAnalysis.recommendations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Рекомендации</h4>
                    <div className="space-y-3">
                      {performanceAnalysis.recommendations.map((rec: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          rec.priority === 'critical' ? 'bg-red-400/10 border-red-400/30' :
                          rec.priority === 'high' ? 'bg-orange-400/10 border-orange-400/30' :
                          rec.priority === 'medium' ? 'bg-yellow-400/10 border-yellow-400/30' :
                          'bg-blue-400/10 border-blue-400/30'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white">{rec.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                              rec.priority === 'critical' ? 'bg-red-400/20 text-red-400' :
                              rec.priority === 'high' ? 'bg-orange-400/20 text-orange-400' :
                              rec.priority === 'medium' ? 'bg-yellow-400/20 text-yellow-400' :
                              'bg-blue-400/20 text-blue-400'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-white/70 mb-2">{rec.description}</p>
                          <div className="text-xs text-white/50">
                            Влияние: {rec.impact_estimate} • Усилия: {rec.implementation_effort}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottlenecks */}
                {performanceAnalysis.bottlenecks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Узкие места</h4>
                    <div className="space-y-3">
                      {performanceAnalysis.bottlenecks.map((bottleneck: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg border ${
                          bottleneck.severity === 'critical' ? 'bg-red-400/10 border-red-400/30' :
                          bottleneck.severity === 'high' ? 'bg-orange-400/10 border-orange-400/30' :
                          'bg-yellow-400/10 border-yellow-400/30'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-white">{bottleneck.type}</h5>
                            <span className="text-xs text-white/50">
                              Влияние: {bottleneck.impact_score}/100
                            </span>
                          </div>
                          <p className="text-sm text-white/70">{bottleneck.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logs Display */}
          <div className="bg-glass-surface rounded-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Логи агентов ({logs.length})
              </h3>
              <div className="flex items-center gap-4 text-sm text-white/50">
                {logsData?.summary.time_range && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(logsData.summary.time_range.start).toLocaleTimeString('ru-RU')} - 
                      {new Date(logsData.summary.time_range.end).toLocaleTimeString('ru-RU')}
                    </span>
                  </div>
                )}
                {lastUpdate && (
                  <span>Обновлено: {new Date(lastUpdate).toLocaleTimeString('ru-RU')}</span>
                )}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <div className="text-white/50">Логи не найдены</div>
                  {searchQuery && (
                    <div className="text-sm text-white/30 mt-2">
                      Попробуйте изменить фильтры или поисковый запрос
                    </div>
                  )}
                </div>
              ) : (
                logs.map((log, index) => {
                  const IconComponent = iconMap[log.level] || Info;
                  return (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Timestamp and Level */}
                        <div className="lg:col-span-3 flex items-center gap-3">
                          <div className="text-xs text-white/50 font-mono">
                            {new Date(log.timestamp).toLocaleString('ru-RU')}
                          </div>
                          <div 
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium uppercase"
                            style={{
                              backgroundColor: `${getLogLevelColor(log.level)}20`,
                              color: getLogLevelColor(log.level),
                              border: `1px solid ${getLogLevelColor(log.level)}40`
                            }}
                          >
                            <IconComponent className="w-3 h-3" />
                            {log.level}
                          </div>
                        </div>

                        {/* Message */}
                        <div className="lg:col-span-6">
                          <div className="text-sm text-white mb-1">
                            {log.msg}
                          </div>
                          {log.error && (
                            <div className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded mt-2">
                              Error: {log.error}
                            </div>
                          )}
                          
                          {/* Error tracking button */}
                          {(log.level === 'error' || log.level === 'warn') && (
                            <button
                              onClick={() => trackError(log)}
                              disabled={trackingError}
                              className="mt-2 px-2 py-1 text-xs bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded text-red-400 transition-all duration-200 disabled:opacity-50"
                            >
                              {trackingError ? 'Отслеживание...' : 'Отследить ошибку'}
                            </button>
                          )}
                        </div>

                        {/* Tool and Metadata */}
                        <div className="lg:col-span-3 flex flex-col items-end gap-1">
                          {log.tool && (
                            <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                              {getToolDisplayName(log.tool)}
                            </div>
                          )}
                          {log.requestId && (
                            <div className="text-xs text-white/50 font-mono">
                              ID: {log.requestId}
                            </div>
                          )}
                          {log.duration && (
                            <div className="text-xs text-kupibilet-secondary font-medium">
                              {formatDuration(log.duration)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
  );
}