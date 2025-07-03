/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Simple test component to validate logs UI functionality
const TestLogsComponent: React.FC = () => {
  const [agentLogs, setAgentLogs] = React.useState<any[]>([]);
  const [showLogs, setShowLogs] = React.useState(false);
  const [logFilter, setLogFilter] = React.useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [isMonitoring, setIsMonitoring] = React.useState(false);

  const mockLogs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      msg: 'Content Specialist: Processing email generation request',
      tool: 'content-specialist',
      duration: 2340
    },
    {
      timestamp: new Date().toISOString(),
      level: 'warn',
      msg: 'Quality Specialist: Detected compatibility issue',
      tool: 'quality-specialist'
    },
    {
      timestamp: new Date().toISOString(),
      level: 'error',
      msg: 'Delivery Specialist: SMTP connection failed',
      tool: 'delivery-specialist',
      error: 'Connection timeout after 30 seconds'
    }
  ];

  const toggleLogs = () => {
    setShowLogs(!showLogs);
    if (!showLogs) {
      setIsMonitoring(true);
      setAgentLogs(mockLogs);
    } else {
      setIsMonitoring(false);
    }
  };

  const clearLogs = () => {
    setAgentLogs([]);
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getToolDisplayName = (tool: string) => {
    switch (tool) {
      case 'content-specialist': return 'Контент-специалист';
      case 'design-specialist': return 'Дизайн-специалист';
      case 'quality-specialist': return 'Контроль качества';
      case 'delivery-specialist': return 'Специалист доставки';
      case 'system': return 'Система';
      default: return tool || 'Неизвестно';
    }
  };

  const formatLogTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      {/* Logs Header */}
      <div data-testid="logs-section">
        <div>
          <h3>Логи агентов</h3>
          <p>Мониторинг работы системы в режиме реального времени</p>
        </div>
        <div>
          {/* Log Filter */}
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value as any)}
            data-testid="log-filter"
          >
            <option value="all">Все логи</option>
            <option value="info">Информация</option>
            <option value="warn">Предупреждения</option>
            <option value="error">Ошибки</option>
          </select>
          
          <button onClick={toggleLogs} data-testid="toggle-logs-btn">
            {showLogs ? 'Скрыть' : 'Показать'}
          </button>
          
          {agentLogs.length > 0 && (
            <button onClick={clearLogs} data-testid="clear-logs-btn">
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Logs Display */}
      {showLogs && (
        <div data-testid="logs-display">
          {agentLogs.length === 0 ? (
            <div data-testid="empty-logs">
              <p>Логи пока отсутствуют</p>
              <p>Начните генерацию для отображения логов</p>
            </div>
          ) : (
            <div data-testid="logs-content">
              {agentLogs
                .filter(log => logFilter === 'all' || log.level === logFilter)
                .map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} data-testid={`log-entry-${index}`}>
                    <span data-testid={`log-icon-${index}`}>
                      {getLogLevelIcon(log.level)}
                    </span>
                    <div>
                      <p data-testid={`log-message-${index}`}>{log.msg}</p>
                      {log.tool && (
                        <p data-testid={`log-tool-${index}`}>
                          🤖 {getToolDisplayName(log.tool)}
                        </p>
                      )}
                      {log.duration && (
                        <p data-testid={`log-duration-${index}`}>
                          ⏱️ {log.duration}мс
                        </p>
                      )}
                      {log.error && (
                        <p data-testid={`log-error-${index}`}>
                          {log.error}
                        </p>
                      )}
                      <span data-testid={`log-timestamp-${index}`}>
                        {formatLogTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          {/* Logs Footer */}
          {agentLogs.length > 0 && (
            <div data-testid="logs-footer">
              <p>Отображено {agentLogs.filter(log => logFilter === 'all' || log.level === logFilter).length} записей • Обновляется каждые 2 секунды</p>
              {isMonitoring && (
                <div data-testid="realtime-indicator">
                  <span>В режиме реального времени</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('Agent Logs UI Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Logs Section Display', () => {
    test('renders logs section with header and controls', () => {
      render(<TestLogsComponent />);
      
      expect(screen.getByTestId('logs-section')).toBeInTheDocument();
      expect(screen.getByText('Логи агентов')).toBeInTheDocument();
      expect(screen.getByText('Мониторинг работы системы в режиме реального времени')).toBeInTheDocument();
      expect(screen.getByTestId('log-filter')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-logs-btn')).toBeInTheDocument();
    });

    test('displays all filter options correctly', () => {
      render(<TestLogsComponent />);
      
      const filterSelect = screen.getByTestId('log-filter');
      expect(filterSelect).toHaveValue('all');
      
      expect(screen.getByText('Все логи')).toBeInTheDocument();
      expect(screen.getByText('Информация')).toBeInTheDocument();
      expect(screen.getByText('Предупреждения')).toBeInTheDocument();
      expect(screen.getByText('Ошибки')).toBeInTheDocument();
    });

    test('initially shows "Показать" button and hides logs', () => {
      render(<TestLogsComponent />);
      
      expect(screen.getByText('Показать')).toBeInTheDocument();
      expect(screen.queryByTestId('logs-display')).not.toBeInTheDocument();
    });
  });

  describe('Logs Visibility Toggle', () => {
    test('shows logs when toggle button is clicked', async () => {
      render(<TestLogsComponent />);
      
      const toggleBtn = screen.getByTestId('toggle-logs-btn');
      expect(toggleBtn).toHaveTextContent('Показать');
      
      fireEvent.click(toggleBtn);
      
      await waitFor(() => {
        expect(toggleBtn).toHaveTextContent('Скрыть');
        expect(screen.getByTestId('logs-display')).toBeInTheDocument();
      });
    });

    test('hides logs when toggle button is clicked again', async () => {
      render(<TestLogsComponent />);
      
      const toggleBtn = screen.getByTestId('toggle-logs-btn');
      
      // Show logs first
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(screen.getByTestId('logs-display')).toBeInTheDocument();
      });
      
      // Hide logs
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(toggleBtn).toHaveTextContent('Показать');
        expect(screen.queryByTestId('logs-display')).not.toBeInTheDocument();
      });
    });
  });

  describe('Logs Content Display', () => {
    test('displays log entries with correct icons and messages', async () => {
      render(<TestLogsComponent />);
      
      // Show logs
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('logs-content')).toBeInTheDocument();
        
        // Check log messages
        expect(screen.getByText('Content Specialist: Processing email generation request')).toBeInTheDocument();
        expect(screen.getByText('Quality Specialist: Detected compatibility issue')).toBeInTheDocument();
        expect(screen.getByText('Delivery Specialist: SMTP connection failed')).toBeInTheDocument();
        
        // Check log icons
        expect(screen.getByTestId('log-icon-0')).toHaveTextContent('ℹ️');
        expect(screen.getByTestId('log-icon-1')).toHaveTextContent('⚠️');
        expect(screen.getByTestId('log-icon-2')).toHaveTextContent('❌');
      });
    });

    test('displays tool names in Russian', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByText('🤖 Контент-специалист')).toBeInTheDocument();
        expect(screen.getByText('🤖 Контроль качества')).toBeInTheDocument();
        expect(screen.getByText('🤖 Специалист доставки')).toBeInTheDocument();
      });
    });

    test('displays processing time when available', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByText('⏱️ 2340мс')).toBeInTheDocument();
      });
    });

    test('displays error details when available', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByText('Connection timeout after 30 seconds')).toBeInTheDocument();
      });
    });

    test('displays formatted timestamps', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        const timestamp = screen.getByTestId('log-timestamp-0');
        expect(timestamp).toBeInTheDocument();
        expect(timestamp.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });
    });
  });

  describe('Log Filtering', () => {
    test('filters logs by error level', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        // Initially shows all logs
        expect(screen.getByText('Content Specialist: Processing email generation request')).toBeInTheDocument();
        expect(screen.getByText('Quality Specialist: Detected compatibility issue')).toBeInTheDocument();
        expect(screen.getByText('Delivery Specialist: SMTP connection failed')).toBeInTheDocument();
      });
      
      // Filter by error level
      fireEvent.change(screen.getByTestId('log-filter'), { target: { value: 'error' } });
      
      await waitFor(() => {
        // Should only show error logs
        expect(screen.queryByText('Content Specialist: Processing email generation request')).not.toBeInTheDocument();
        expect(screen.queryByText('Quality Specialist: Detected compatibility issue')).not.toBeInTheDocument();
        expect(screen.getByText('Delivery Specialist: SMTP connection failed')).toBeInTheDocument();
      });
    });

    test('filters logs by warning level', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      // Filter by warning level
      fireEvent.change(screen.getByTestId('log-filter'), { target: { value: 'warn' } });
      
      await waitFor(() => {
        // Should only show warning logs
        expect(screen.queryByText('Content Specialist: Processing email generation request')).not.toBeInTheDocument();
        expect(screen.getByText('Quality Specialist: Detected compatibility issue')).toBeInTheDocument();
        expect(screen.queryByText('Delivery Specialist: SMTP connection failed')).not.toBeInTheDocument();
      });
    });

    test('updates log count in footer when filtering', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByText('Отображено 3 записей • Обновляется каждые 2 секунды')).toBeInTheDocument();
      });
      
      // Filter by error level (should show 1 record)
      fireEvent.change(screen.getByTestId('log-filter'), { target: { value: 'error' } });
      
      await waitFor(() => {
        expect(screen.getByText('Отображено 1 записей • Обновляется каждые 2 секунды')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Logs Functionality', () => {
    test('shows clear button when logs are present', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('clear-logs-btn')).toBeInTheDocument();
      });
    });

    test('clears logs when clear button is clicked', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('logs-content')).toBeInTheDocument();
        expect(screen.getByText('Content Specialist: Processing email generation request')).toBeInTheDocument();
      });
      
      // Clear logs
      fireEvent.click(screen.getByTestId('clear-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-logs')).toBeInTheDocument();
        expect(screen.getByText('Логи пока отсутствуют')).toBeInTheDocument();
        expect(screen.queryByTestId('clear-logs-btn')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Indicator', () => {
    test('shows real-time indicator when monitoring is active', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('realtime-indicator')).toBeInTheDocument();
        expect(screen.getByText('В режиме реального времени')).toBeInTheDocument();
      });
    });
    
    test('shows update frequency information', async () => {
      render(<TestLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByText('Отображено 3 записей • Обновляется каждые 2 секунды')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('shows empty state message when no logs are available', async () => {
      const EmptyLogsComponent: React.FC = () => {
        const [showLogs, setShowLogs] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setShowLogs(!showLogs)} data-testid="toggle-logs-btn">
              {showLogs ? 'Скрыть' : 'Показать'}
            </button>
            {showLogs && (
              <div data-testid="logs-display">
                <div data-testid="empty-logs">
                  <p>Логи пока отсутствуют</p>
                  <p>Начните генерацию для отображения логов</p>
                </div>
              </div>
            )}
          </div>
        );
      };
      
      render(<EmptyLogsComponent />);
      
      fireEvent.click(screen.getByTestId('toggle-logs-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-logs')).toBeInTheDocument();
        expect(screen.getByText('Логи пока отсутствуют')).toBeInTheDocument();
        expect(screen.getByText('Начните генерацию для отображения логов')).toBeInTheDocument();
      });
    });
  });
});