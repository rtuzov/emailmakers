/**
 * 🎯 OPTIMIZATION DASHBOARD - Панель мониторинга системы оптимизации
 * 
 * Интерактивная панель для мониторинга системы автоматической оптимизации
 * агентов и валидаторов в реальном времени.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function OptimizationDashboard() {
  const [status, setStatus] = useState<OptimizationStatus | null>(null);
  const [analysis, setAnalysis] = useState<SystemAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [demoResults, setDemoResults] = useState<DemoResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'recommendations' | 'demo'>('overview');

  const fetchSystemAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/optimization/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_system' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.analysis);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch system analysis:', error);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/optimization/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_recommendations' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecommendations(data.recommendations.items);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  }, []);

  const runDemo = async (demoType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/optimization/demo?type=${demoType}`);
      const data = await response.json();
      setDemoResults(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoResults({
        success: false,
        error: { message: 'Demo execution failed', type: 'network_error' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем данные при монтировании
    fetchSystemAnalysis();
    fetchRecommendations();

    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      if (activeTab === 'analysis') {
        fetchSystemAnalysis();
      } else if (activeTab === 'recommendations') {
        fetchRecommendations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, fetchSystemAnalysis, fetchRecommendations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#4BFF7E';
      case 'stopped': return '#FFA500';
      case 'error': return '#FF6240';
      case 'maintenance': return '#E03EEF';
      default: return '#FFFFFF';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#FF6240';
      case 'high': return '#FFA500';
      case 'medium': return '#E03EEF';
      case 'low': return '#4BFF7E';
      default: return '#FFFFFF';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return '#FF6240';
      case 'high': return '#FFA500';
      case 'medium': return '#E03EEF';
      case 'low': return '#4BFF7E';
      default: return '#FFFFFF';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)',
      padding: '32px 24px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(75, 255, 126, 0.2)',
            marginBottom: '24px'
          }}>
            <span>⚙️</span>
            <span>Optimization System</span>
          </div>
          
          <h1 style={{ 
            fontSize: '42px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Панель <span style={{color: '#4BFF7E'}}>Оптимизации</span>
          </h1>
          
          <p style={{ 
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Мониторинг и управление AI-powered системой автоматической оптимизации
          </p>
        </div>

        {/* Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: analysis ? '#4BFF7E' : '#FFA500',
            animation: loading ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {loading ? 'Выполнение...' : analysis ? 'Система активна' : 'Ожидание данных'}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
            • Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { id: 'overview', label: '📊 Обзор', icon: '📊' },
            { id: 'analysis', label: '🔍 Анализ', icon: '🔍' },
            { id: 'recommendations', label: '💡 Рекомендации', icon: '💡' },
            { id: 'demo', label: '🎯 Демо', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'rgba(75, 255, 126, 0.2)' : 'transparent',
                color: activeTab === tab.id ? '#4BFF7E' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
              Общий обзор системы
            </h2>
            
            {analysis && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E', marginBottom: '8px' }}>
                    {analysis.current_state.health_score}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Health Score</div>
                </div>

                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E', marginBottom: '8px' }}>
                    {analysis.current_state.active_agents}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Активные агенты</div>
                </div>

                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E', marginBottom: '8px' }}>
                    {analysis.current_state.success_rate}%
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Success Rate</div>
                </div>

                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E', marginBottom: '8px' }}>
                    {Math.round(analysis.current_state.average_response_time)}ms
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Время отклика</div>
                </div>
              </div>
            )}

            <div style={{
              textAlign: 'center',
              padding: '32px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '16px' }}>
                🎯 Система оптимизации готова к работе
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Переключитесь на другие вкладки для подробного анализа и управления
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>
                Анализ системы
              </h2>
              <button
                onClick={fetchSystemAnalysis}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: loading ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>

            {analysis ? (
              <div>
                {/* Analysis Overview */}
                <div style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                    Оценка состояния
                  </h3>
                  <div style={{ 
                    fontSize: '16px', 
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '16px'
                  }}>
                    {analysis.assessment}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4BFF7E' }}>
                        {analysis.insights.trends_detected}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Выявлено трендов</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: analysis.insights.bottlenecks_found > 0 ? '#FFA500' : '#4BFF7E' }}>
                        {analysis.insights.bottlenecks_found}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Узких мест</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: analysis.insights.error_patterns > 0 ? '#FF6240' : '#4BFF7E' }}>
                        {analysis.insights.error_patterns}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Паттернов ошибок</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: analysis.insights.predicted_issues > 0 ? '#E03EEF' : '#4BFF7E' }}>
                        {analysis.insights.predicted_issues}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Предсказанных проблем</div>
                    </div>
                  </div>
                </div>

                {/* Optimization Opportunities */}
                {analysis.opportunities.length > 0 && (
                  <div style={{
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                      Возможности оптимизации
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {analysis.opportunities.map((opportunity, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(75, 255, 126, 0.1)',
                            border: '1px solid rgba(75, 255, 126, 0.2)',
                            fontSize: '14px'
                          }}
                        >
                          💡 {opportunity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Анализ не выполнен. Нажмите "Обновить" для запуска анализа системы.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>
                Рекомендации по оптимизации
              </h2>
              <button
                onClick={fetchRecommendations}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: loading ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>

            {recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: '24px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                            {rec.title}
                          </h3>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: `${getPriorityColor(rec.priority)}20`,
                            color: getPriorityColor(rec.priority),
                            border: `1px solid ${getPriorityColor(rec.priority)}40`
                          }}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: `${getRiskColor(rec.safety.risk_level)}20`,
                            color: getRiskColor(rec.safety.risk_level),
                            border: `1px solid ${getRiskColor(rec.safety.risk_level)}40`
                          }}>
                            {rec.safety.risk_level} risk
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '4px' }}>
                          {rec.description}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Тип: {rec.type} • Время выполнения: {rec.estimated_duration}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4BFF7E' }}>
                          +{rec.expected_impact.performance_improvement}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Производительность</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4BFF7E' }}>
                          +{rec.expected_impact.success_rate_improvement}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Success Rate</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4BFF7E' }}>
                          -{rec.expected_impact.response_time_reduction}ms
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Время отклика</div>
                      </div>
                    </div>

                    {rec.safety.requires_approval && (
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 165, 0, 0.1)',
                        border: '1px solid rgba(255, 165, 0, 0.2)',
                        fontSize: '14px',
                        color: '#FFA500'
                      }}>
                        ⚠️ Требует ручного подтверждения
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Рекомендации не найдены. Нажмите "Обновить" для получения новых рекомендаций.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'demo' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
              Демонстрация системы оптимизации
            </h2>

            {/* Demo Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {[
                { type: 'basic', title: 'Базовая демонстрация', description: 'Полный цикл оптимизации с анализом и рекомендациями' },
                { type: 'simulation', title: 'Симуляция реального времени', description: 'Имитация работы системы в production режиме' },
                { type: 'integration', title: 'Демо интеграции', description: 'Показ интеграции с существующими системами мониторинга' }
              ].map(demo => (
                <button
                  key={demo.type}
                  onClick={() => runDemo(demo.type)}
                  disabled={loading}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: loading ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'rgba(75, 255, 126, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(75, 255, 126, 0.3)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {demo.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Demo Results */}
            {demoResults && (
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: demoResults.success ? '#4BFF7E' : '#FF6240'
                  }}></div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                    Результаты демонстрации
                  </h3>
                </div>

                {demoResults.success ? (
                  <div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px' }}>
                      ✅ Демонстрация выполнена успешно
                    </div>
                    
                    {demoResults.demo && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                          {demoResults.demo.description}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {demoResults.demo.features?.map((feature: string, index: number) => (
                            <div key={index} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                              • {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoResults.summary && (
                      <div style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(75, 255, 126, 0.1)',
                        border: '1px solid rgba(75, 255, 126, 0.2)'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                          Сводка выполнения:
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                          Записей в логе: {demoResults.summary.total_log_entries} • 
                          Статус: {demoResults.summary.status}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '14px', color: '#FF6240', marginBottom: '16px' }}>
                      ❌ Ошибка выполнения демонстрации
                    </div>
                    {demoResults.error && (
                      <div style={{
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 98, 64, 0.1)',
                        border: '1px solid rgba(255, 98, 64, 0.2)',
                        fontSize: '14px',
                        color: '#FF6240'
                      }}>
                        {demoResults.error.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid rgba(75, 255, 126, 0.3)',
                  borderTop: '4px solid #4BFF7E',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Выполнение демонстрации...
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  );
}