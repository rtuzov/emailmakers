interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  timestamp: string;
  tool?: string;
  error?: string;
  duration?: number;
  requestId?: string;
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
  };
}

async function getAgentLogs(): Promise<{ logs: LogEntry[], metrics: Metrics }> {
  try {
    // Simulate fetching logs from filesystem or database
    const logs: LogEntry[] = [
      {
        level: 'info',
        msg: 'Agent started successfully',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        tool: 'content-specialist',
        duration: 1200,
        requestId: 'req_001'
      },
      {
        level: 'debug',
        msg: 'Processing content generation request',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        tool: 'content-specialist',
        duration: 2300,
        requestId: 'req_002'
      },
      {
        level: 'warn',
        msg: 'Rate limit approaching for OpenAI API',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        tool: 'content-specialist',
        requestId: 'req_003'
      },
      {
        level: 'error',
        msg: 'Failed to validate MJML template',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        tool: 'quality-specialist',
        error: 'Invalid MJML syntax at line 45',
        requestId: 'req_004'
      },
      {
        level: 'info',
        msg: 'Email template generated successfully',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        tool: 'delivery-specialist',
        duration: 1800,
        requestId: 'req_005'
      }
    ];

    const metrics: Metrics = {
      totalLogs: logs.length,
      successRate: 85.5,
      avgDuration: 1825,
      activeAgents: 4,
      logLevels: {
        debug: logs.filter(l => l.level === 'debug').length,
        info: logs.filter(l => l.level === 'info').length,
        warn: logs.filter(l => l.level === 'warn').length,
        error: logs.filter(l => l.level === 'error').length,
      },
      timeRange: {
        start: logs[0]?.timestamp || new Date().toISOString(),
        end: logs[logs.length - 1]?.timestamp || new Date().toISOString(),
      }
    };

    return { logs, metrics };
  } catch (error) {
    console.error('Error fetching logs:', error);
    return { logs: [], metrics: {
      totalLogs: 0,
      successRate: 0,
      avgDuration: 0,
      activeAgents: 0,
      logLevels: { debug: 0, info: 0, warn: 0, error: 0 },
      timeRange: { start: '', end: '' }
    }};
  }
}

export default async function AgentLogsPage() {
  const { logs, metrics } = await getAgentLogs();

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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgb(44, 57, 89) 0%, rgb(52, 67, 99) 50%, rgb(62, 77, 109) 100%)',
      padding: '32px 24px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
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
            <span>🔧</span>
            <span>Monitoring System</span>
          </div>
          
          <h1 style={{ 
            fontSize: '42px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Логи <span style={{color: '#4BFF7E'}}>Агентов</span>
          </h1>
          
          <p style={{ 
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Мониторинг в реальном времени и анализ работы AI-агентов
          </p>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          <div style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Всего логов</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E' }}>{metrics.totalLogs}</div>
          </div>

          <div style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Успешность</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E' }}>{metrics.successRate}%</div>
          </div>

          <div style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Среднее время</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E' }}>{formatDuration(metrics.avgDuration)}</div>
          </div>

          <div style={{
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Активные агенты</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4BFF7E' }}>{metrics.activeAgents}</div>
          </div>
        </div>

        {/* Log Levels Summary */}
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
            Распределение по уровням
          </h3>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {Object.entries(metrics.logLevels).map(([level, count]) => (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getLogLevelColor(level)
                }}></div>
                <span style={{ fontSize: '14px', textTransform: 'uppercase' }}>{level}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: getLogLevelColor(level) }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div style={{
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
              Последние события
            </h3>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Обновлено: {new Date().toLocaleTimeString('ru-RU')}
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{
                padding: '48px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div>Логи не найдены</div>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{
                  padding: '16px 24px',
                  borderBottom: index < logs.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '120px 100px 1fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                  </div>
                  
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    backgroundColor: `${getLogLevelColor(log.level)}20`,
                    color: getLogLevelColor(log.level),
                    border: `1px solid ${getLogLevelColor(log.level)}40`
                  }}>
                    {log.level}
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      {log.msg}
                    </div>
                    {log.tool && (
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                        Tool: {log.tool}
                      </div>
                    )}
                    {log.error && (
                      <div style={{ fontSize: '12px', color: '#FF6240', marginTop: '4px' }}>
                        Error: {log.error}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'right' }}>
                    {log.requestId && (
                      <div>ID: {log.requestId}</div>
                    )}
                    {log.duration && (
                      <div>{formatDuration(log.duration)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}