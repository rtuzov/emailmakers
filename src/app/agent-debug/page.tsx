'use client';

import { Brain, Palette, Shield, Truck, Zap, CheckCircle, AlertCircle, Clock, RefreshCw, Play, Activity, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'standby' | 'error' | 'offline';
  description: string;
  capabilities: string[];
  lastActivity: string;
  color: string;
  icon: string;
  metrics: {
    uptime: string;
    tasksCompleted: number;
    avgResponseTime: number;
    errorRate: number;
    lastError?: string;
  };
  health: {
    cpu: number;
    memory: number;
    connections: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface SystemStatus {
  totalAgents: number;
  activeAgents: number;
  completedTasks: number;
  avgResponseTime: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdate: string;
}

const iconMap = {
  Brain,
  Palette,
  Shield,
  Truck
};

export default function AgentDebugPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingAgent, setTestingAgent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch agent status data
  const fetchAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent/status?metrics=true&health=true');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
        setSystemStatus(data.system_status);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch agent status');
      }
    } catch (err) {
      console.error('Failed to fetch agent status:', err);
      setError('Network error: Unable to connect to agent API');
    } finally {
      setLoading(false);
    }
  };

  // Test specific agent
  const testAgent = async (agentId: string) => {
    setTestingAgent(agentId);
    try {
      const response = await fetch('/api/agent/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          agent_id: agentId,
          data: { quick_test: true }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh status after test
        await fetchAgentStatus();
        alert(`Тест агента ${agentId} завершен успешно`);
      } else {
        alert(`Тест агента ${agentId} завершился ошибкой: ${result.error}`);
      }
    } catch (err) {
      console.error('Agent test failed:', err);
      alert(`Ошибка при тестировании агента ${agentId}`);
    } finally {
      setTestingAgent(null);
    }
  };

  // Run comprehensive test
  const runComprehensiveTest = async () => {
    setTestingAgent('comprehensive');
    try {
      const response = await fetch('/api/agent/test-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Системное тестирование агентов' })
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchAgentStatus();
        alert('Комплексное тестирование завершено успешно');
      } else {
        alert(`Комплексное тестирование завершилось ошибкой: ${result.error}`);
      }
    } catch (err) {
      console.error('Comprehensive test failed:', err);
      alert('Ошибка при комплексном тестировании');
    } finally {
      setTestingAgent(null);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchAgentStatus();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAgentStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchAgentStatus();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-kupibilet-primary" />;
      case 'standby':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-kupibilet-primary bg-kupibilet-primary/10 border-kupibilet-primary/20';
      case 'standby':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'error':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'offline':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'standby': return 'Ожидание';
      case 'error': return 'Ошибка';
      case 'offline': return 'Отключен';
      default: return 'Неизвестно';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading && !systemStatus) {
    return (
      <div className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-kupibilet-primary mx-auto mb-4 animate-spin" />
          <p className="text-white/70">Загрузка статуса агентов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ошибка подключения</h2>
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

  return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-glass-primary rounded-full text-sm font-medium text-kupibilet-primary border border-kupibilet-primary/20 mb-6">
              <Zap className="w-4 h-4" />
              <span>AI Agent System</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <h1 className="text-4xl sm:text-5xl font-bold text-white">
                Отладка <span className="text-kupibilet-primary">Агентов</span>
              </h1>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 bg-glass-surface hover:bg-glass-primary border border-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Обновить статус"
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
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Мониторинг и тестирование AI-агентов системы EmailMakers
            </p>
            
            {systemStatus && (
              <div className="mt-4 text-sm text-white/50">
                Последнее обновление: {new Date(systemStatus.lastUpdate).toLocaleTimeString('ru-RU')}
                {systemStatus.systemHealth !== 'healthy' && (
                  <span className={`ml-2 ${getHealthColor(systemStatus.systemHealth)}`}>
                    • Система: {systemStatus.systemHealth === 'warning' ? 'Предупреждения' : 'Критические ошибки'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* System Status */}
          {systemStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
                <div className="text-2xl font-bold text-kupibilet-primary mb-1">
                  {systemStatus.totalAgents}
                </div>
                <div className="text-sm text-white/60">Всего агентов</div>
              </div>
              
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  systemStatus.activeAgents === systemStatus.totalAgents ? 'text-kupibilet-secondary' : 'text-yellow-400'
                }`}>
                  {systemStatus.activeAgents}
                </div>
                <div className="text-sm text-white/60">Активных</div>
              </div>
              
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
                <div className="text-2xl font-bold text-kupibilet-accent mb-1">
                  {systemStatus.completedTasks}
                </div>
                <div className="text-sm text-white/60">Выполнено задач</div>
              </div>
              
              <div className="bg-glass-surface rounded-xl border border-white/20 p-6 text-center">
                <div className="text-2xl font-bold text-kupibilet-primary mb-1">
                  {systemStatus.avgResponseTime}
                </div>
                <div className="text-sm text-white/60">Среднее время</div>
              </div>
            </div>
          )}

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {agents.map((agent) => {
              const IconComponent = iconMap[agent.icon as keyof typeof iconMap] || Brain;
              const isTestingThis = testingAgent === agent.id;
              
              return (
                <div
                  key={agent.id}
                  className="group bg-glass-surface hover:bg-glass-primary rounded-2xl border border-white/20 hover:border-white/30 p-8 transition-all duration-300"
                >
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-white/10 rounded-xl ${agent.color} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {agent.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(agent.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                            {getStatusText(agent.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Health indicator */}
                    <div className={`p-2 rounded-lg ${getHealthColor(agent.health.status)}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Agent Description */}
                  <p className="text-white/70 mb-6">
                    {agent.description}
                  </p>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-kupibilet-primary">{agent.metrics.uptime}</div>
                      <div className="text-xs text-white/50">Аптайм</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-kupibilet-secondary">{agent.metrics.tasksCompleted}</div>
                      <div className="text-xs text-white/50">Задач</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-kupibilet-accent">{agent.metrics.avgResponseTime}ms</div>
                      <div className="text-xs text-white/50">Отклик</div>
                    </div>
                  </div>

                  {/* Health Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agent.health.cpu > 70 ? 'text-red-400' : agent.health.cpu > 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {agent.health.cpu}%
                      </div>
                      <div className="text-xs text-white/50">CPU</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${agent.health.memory > 80 ? 'text-red-400' : agent.health.memory > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {agent.health.memory}%
                      </div>
                      <div className="text-xs text-white/50">Память</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-white/70">{agent.health.connections}</div>
                      <div className="text-xs text-white/50">Подключ.</div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white mb-3">Возможности:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {agent.capabilities.map((capability, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-kupibilet-primary rounded-full"></div>
                          <span className="text-sm text-white/70">{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Display */}
                  {agent.metrics.lastError && (
                    <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                      <div className="text-xs text-red-400 font-medium mb-1">Последняя ошибка:</div>
                      <div className="text-xs text-white/70">{agent.metrics.lastError}</div>
                    </div>
                  )}

                  {/* Last Activity & Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <div className="text-sm text-white/50">
                        Активность: {agent.lastActivity}
                      </div>
                      {agent.metrics.errorRate > 0 && (
                        <div className="text-xs text-red-400">
                          Ошибок: {agent.metrics.errorRate}%
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => testAgent(agent.id)}
                      disabled={isTestingThis || testingAgent !== null}
                      className="px-4 py-2 bg-kupibilet-primary hover:bg-kupibilet-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      {isTestingThis ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Тестирую...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Тестировать
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="bg-glass-surface rounded-2xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                {systemStatus?.systemHealth === 'healthy' 
                  ? 'Система готова к работе' 
                  : systemStatus?.systemHealth === 'warning'
                  ? 'Система работает с предупреждениями'
                  : 'Обнаружены критические проблемы'
                }
              </h2>
              
              <p className="text-white/70 mb-6">
                {systemStatus?.systemHealth === 'healthy' 
                  ? 'Все агенты функционируют в штатном режиме. Система готова к обработке запросов.'
                  : systemStatus?.systemHealth === 'warning'
                  ? 'Некоторые агенты работают с предупреждениями. Рекомендуется проверить статус.'
                  : 'Обнаружены критические ошибки. Требуется немедленное вмешательство.'
                }
              </p>

              {/* System Health Indicator */}
              {systemStatus && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className={`w-3 h-3 rounded-full ${
                    systemStatus.systemHealth === 'healthy' ? 'bg-green-400' :
                    systemStatus.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${getHealthColor(systemStatus.systemHealth)}`}>
                    {systemStatus.systemHealth === 'healthy' ? 'Система здорова' :
                     systemStatus.systemHealth === 'warning' ? 'Требует внимания' : 'Критическое состояние'}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={runComprehensiveTest}
                  disabled={testingAgent !== null}
                  className="px-6 py-3 bg-kupibilet-primary hover:bg-kupibilet-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-glow-green flex items-center gap-2"
                >
                  {testingAgent === 'comprehensive' ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Выполняется тест...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Запустить полный тест
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => window.open('/agent-logs', '_blank')}
                  className="px-6 py-3 bg-glass-primary hover:bg-glass-surface text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Просмотреть логи
                </button>
              </div>

              {/* Quick Stats */}
              {systemStatus && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-white/50">Активные агенты: </span>
                      <span className="text-white font-medium">{systemStatus.activeAgents}/{systemStatus.totalAgents}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Выполнено задач: </span>
                      <span className="text-white font-medium">{systemStatus.completedTasks}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Среднее время: </span>
                      <span className="text-white font-medium">{systemStatus.avgResponseTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
} 