/**
 * 🎯 MASTER OPTIMIZATION DASHBOARD - Полная панель мониторинга всех фаз системы оптимизации
 * 
 * Интерактивная панель для мониторинга и управления всей системой автоматической оптимизации
 * включая все фазы: Foundation, Phase 2 (Dynamic Thresholds), Phase 3 (ML + Auto-Scaling).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface MasterTestResults {
  test_id: string;
  overall_success: boolean;
  total_duration_ms: number;
  test_summary: {
    total_scenarios: number;
    passed_scenarios: number;
    failed_scenarios: number;
    overall_success_rate: number;
  };
  performance_metrics: {
    foundation_performance_score: number;
    phase2_performance_score: number;
    phase3_performance_score: number;
    system_responsiveness: number;
    reliability_score: number;
  };
  recommendations: string[];
}

interface SystemStatus {
  optimization_service: {
    is_running: boolean;
    recommendations_count: number;
    optimizations_applied: number;
  };
  current_health: {
    system_health_score: number;
    active_agents: number;
    success_rate: number;
    avg_response_time: number;
  };
  system_insights: {
    trends_detected: number;
    bottlenecks_found: number;
    error_patterns: number;
    predicted_issues: number;
  };
  optimization_opportunities: string[];
}

interface TestResult {
  success: boolean;
  test?: any;
  logs?: string[];
  error?: any;
  summary?: any;
}

export default function MasterOptimizationDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [masterTestResults, setMasterTestResults] = useState<MasterTestResults | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'phase2' | 'phase3' | 'testing' | 'insights'>('overview');

  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/optimization/master-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_test_status' })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemStatus(data.system_status);
          setLastUpdate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  const runTest = async (testType: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/optimization/master-test?type=${testType}`);
      const data = await response.json();
      
      setTestResults(prev => ({ ...prev, [testType]: data }));
      
      if (testType === 'master' && data.success) {
        setMasterTestResults(data.test.result);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error(`Test ${testType} failed:`, error);
      setTestResults(prev => ({ 
        ...prev, 
        [testType]: { 
          success: false, 
          error: { message: 'Network error', type: 'network_error' } 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const runPhaseComparison = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/optimization/master-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_phase_comparison' })
      });
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, 'comparison': data }));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Phase comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return '#4BFF7E';
    if (score >= 70) return '#E03EEF';
    if (score >= 50) return '#FFA500';
    return '#FF6240';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return '#4BFF7E';
    if (rate >= 85) return '#E03EEF';
    if (rate >= 70) return '#FFA500';
    return '#FF6240';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)',
      padding: '32px 24px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
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
            <span>🎯</span>
            <span>Master Optimization System</span>
          </div>
          
          <h1 style={{ 
            fontSize: '42px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Мастер <span style={{color: '#4BFF7E'}}>Оптимизации</span>
          </h1>
          
          <p style={{ 
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Комплексная панель мониторинга и управления всеми фазами системы автоматической оптимизации
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
            backgroundColor: systemStatus ? '#4BFF7E' : '#FFA500',
            animation: loading ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {loading ? 'Выполнение...' : systemStatus ? 'Система активна' : 'Ожидание данных'}
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
            { id: 'phase2', label: '🎯 Phase 2', icon: '🎯' },
            { id: 'phase3', label: '🤖 Phase 3', icon: '🤖' },
            { id: 'testing', label: '🧪 Тестирование', icon: '🧪' },
            { id: 'insights', label: '💡 Аналитика', icon: '💡' }
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
        {activeTab === 'overview' && systemStatus && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
              Общий обзор системы
            </h2>
            
            {/* Main Health Metrics */}
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
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: getHealthColor(systemStatus.current_health.system_health_score), marginBottom: '8px' }}>
                  {systemStatus.current_health.system_health_score}%
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Здоровье системы</div>
              </div>

              <div style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#E03EEF', marginBottom: '8px' }}>
                  {systemStatus.current_health.active_agents}
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
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: getSuccessRateColor(systemStatus.current_health.success_rate), marginBottom: '8px' }}>
                  {systemStatus.current_health.success_rate}%
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Успешность</div>
              </div>

              <div style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E', marginBottom: '8px' }}>
                  {Math.round(systemStatus.current_health.avg_response_time)}ms
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Время отклика</div>
              </div>
            </div>

            {/* Service Status */}
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                Статус сервисов
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: systemStatus.optimization_service.is_running ? '#4BFF7E' : '#FF6240' }}>
                    {systemStatus.optimization_service.is_running ? 'ACTIVE' : 'STOPPED'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Сервис оптимизации</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E03EEF' }}>
                    {systemStatus.optimization_service.recommendations_count}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Рекомендации</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6240' }}>
                    {systemStatus.optimization_service.optimizations_applied}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Применено</div>
                </div>
              </div>
            </div>

            {/* System Insights */}
            <div style={{
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                Аналитика системы
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4BFF7E' }}>
                    {systemStatus.system_insights.trends_detected}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Трендов</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: systemStatus.system_insights.bottlenecks_found > 0 ? '#FFA500' : '#4BFF7E' }}>
                    {systemStatus.system_insights.bottlenecks_found}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Узких мест</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: systemStatus.system_insights.error_patterns > 0 ? '#FF6240' : '#4BFF7E' }}>
                    {systemStatus.system_insights.error_patterns}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Ошибок</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: systemStatus.system_insights.predicted_issues > 0 ? '#E03EEF' : '#4BFF7E' }}>
                    {systemStatus.system_insights.predicted_issues}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Предсказаний</div>
                </div>
              </div>
              
              {systemStatus.optimization_opportunities.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', margin: '0 0 12px 0' }}>
                    Возможности оптимизации:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {systemStatus.optimization_opportunities.map((opportunity, index) => (
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
          </div>
        )}

        {activeTab === 'testing' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px', textAlign: 'center' }}>
              Интеграционное тестирование
            </h2>

            {/* Test Controls */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {[
                { type: 'smoke', title: 'Smoke Test', description: 'Быстрая проверка основных компонентов системы' },
                { type: 'phase2', title: 'Phase 2 Test', description: 'Dynamic Thresholds + Human Oversight' },
                { type: 'phase3', title: 'Phase 3 Test', description: 'Auto-Scaling + Machine Learning' },
                { type: 'master', title: 'Master Test', description: 'Полное интеграционное тестирование всех фаз' }
              ].map(test => (
                <button
                  key={test.type}
                  onClick={() => runTest(test.type)}
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
                >
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    {test.title}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    {test.description}
                  </div>
                  {testResults[test.type] && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: testResults[test.type].success ? '#4BFF7E' : '#FF6240' 
                    }}>
                      {testResults[test.type].success ? '✅ Успешно' : '❌ Ошибка'}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Phase Comparison */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button
                onClick={runPhaseComparison}
                disabled={loading}
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: loading ? 'rgba(255, 255, 255, 0.05)' : 'rgba(224, 62, 239, 0.2)',
                  color: '#E03EEF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                📊 Запустить сравнение фаз
              </button>
            </div>

            {/* Test Results */}
            {(Object || {}).keys(testResults).length > 0 && (
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                  Результаты тестирования
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(Object || {}).entries(testResults).map(([testType, result]) => (
                    <div
                      key={testType}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: result.success ? 'rgba(75, 255, 126, 0.1)' : 'rgba(255, 98, 64, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>
                          {testType.toUpperCase()}
                        </span>
                        <span style={{ 
                          color: result.success ? '#4BFF7E' : '#FF6240',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {result.success ? '✅ SUCCESS' : '❌ FAILED'}
                        </span>
                      </div>
                      
                      {result.test?.description && (
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                          {result.test.description}
                        </div>
                      )}
                      
                      {result.summary && (
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Duration: {result.summary.duration_ms}ms • Status: {result.summary.test_status}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Master Test Results */}
            {masterTestResults && (
              <div style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                marginTop: '24px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
                  Результаты Master Test
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4BFF7E' }}>
                      {masterTestResults.test_summary.overall_success_rate}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Общий успех</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E03EEF' }}>
                      {masterTestResults.test_summary.passed_scenarios}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Успешно</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6240' }}>
                      {masterTestResults.test_summary.failed_scenarios}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Неудачно</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFA500' }}>
                      {Math.round(masterTestResults.total_duration_ms / 1000)}s
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>Длительность</div>
                  </div>
                </div>

                {masterTestResults.recommendations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', margin: '0 0 12px 0' }}>
                      Рекомендации:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {masterTestResults.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(224, 62, 239, 0.1)',
                            border: '1px solid rgba(224, 62, 239, 0.2)',
                            fontSize: '14px'
                          }}
                        >
                          💡 {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading Indicator */}
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
              Выполнение тестов...
            </div>
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