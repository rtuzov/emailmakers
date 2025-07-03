import { render, screen, waitFor } from '@testing-library/react';
import Home from '@/app/page';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console.error to avoid test noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Main Page Metrics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches and displays dashboard metrics', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: {
        requestCount: 150,
        averageResponseTime: 120,
        errorRate: 0.02,
        systemHealth: 'healthy'
      },
      uptime: 3600000
    };

    const mockMetricsData = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 135,
          successRate: 98,
          activeAgents: 4,
          totalRequests: 250,
          averageResponseTime: 85,
          errorRate: 2,
          uptime: 7200000
        },
        agentMetrics: {
          contentSpecialist: {
            status: 'active',
            processedJobs: 25,
            successRate: 96,
            averageProcessingTime: 800
          },
          designSpecialist: {
            status: 'active',
            processedJobs: 20,
            successRate: 94,
            averageProcessingTime: 1200
          },
          qualitySpecialist: {
            status: 'active',
            processedJobs: 30,
            successRate: 99,
            averageProcessingTime: 600
          },
          deliverySpecialist: {
            status: 'idle',
            processedJobs: 15,
            successRate: 92,
            averageProcessingTime: 400
          }
        },
        recent: {
          generatedTemplates: 8,
          failedRequests: 2,
          averageQualityScore: 92,
          totalUsers: 180
        }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsData
      });

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
      expect(fetch).toHaveBeenCalledWith('/api/metrics/dashboard?agents=true&performance=false');
    });

    await waitFor(() => {
      // Check main stats from metrics
      expect(screen.getByText('135')).toBeInTheDocument(); // Template count
      expect(screen.getByText('98%')).toBeInTheDocument(); // Success rate
      expect(screen.getByText('4')).toBeInTheDocument(); // Active agents
      
      // Check additional metrics
      expect(screen.getByText('92%')).toBeInTheDocument(); // Quality score
      expect(screen.getByText('180')).toBeInTheDocument(); // Total users
      expect(screen.getByText('2')).toBeInTheDocument(); // Failed requests
      expect(screen.getByText('63')).toBeInTheDocument(); // Requests per agent (250/4)
      
      // Check recent templates indicator
      expect(screen.getByText('+8 за последнее время')).toBeInTheDocument();
    });
  });

  it('displays agent status indicators correctly', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.02, systemHealth: 'healthy' },
      uptime: 3600000
    };

    const mockMetricsData = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 130,
          successRate: 95,
          activeAgents: 4,
          totalRequests: 200,
          averageResponseTime: 90,
          errorRate: 5,
          uptime: 3600000
        },
        agentMetrics: {
          contentSpecialist: {
            status: 'active',
            processedJobs: 25,
            successRate: 96,
            averageProcessingTime: 800
          },
          designSpecialist: {
            status: 'error',
            processedJobs: 20,
            successRate: 85,
            averageProcessingTime: 1200
          },
          qualitySpecialist: {
            status: 'idle',
            processedJobs: 30,
            successRate: 99,
            averageProcessingTime: 600
          },
          deliverySpecialist: {
            status: 'active',
            processedJobs: 15,
            successRate: 92,
            averageProcessingTime: 400
          }
        },
        recent: {
          generatedTemplates: 5,
          failedRequests: 1,
          averageQualityScore: 88,
          totalUsers: 165
        }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsData
      });

    render(<Home />);

    await waitFor(() => {
      // Check that agent status section is displayed
      expect(screen.getByText('Статус агентов')).toBeInTheDocument();
      
      // Check agent names
      expect(screen.getByText('content')).toBeInTheDocument();
      expect(screen.getByText('design')).toBeInTheDocument();
      expect(screen.getByText('quality')).toBeInTheDocument();
      expect(screen.getByText('delivery')).toBeInTheDocument();
      
      // Check agent metrics
      expect(screen.getByText('25 задач')).toBeInTheDocument();
      expect(screen.getByText('20 задач')).toBeInTheDocument();
      expect(screen.getByText('30 задач')).toBeInTheDocument();
      expect(screen.getByText('15 задач')).toBeInTheDocument();
      
      // Check success rates
      expect(screen.getByText('96% успех')).toBeInTheDocument();
      expect(screen.getByText('85% успех')).toBeInTheDocument();
      expect(screen.getByText('99% успех')).toBeInTheDocument();
      expect(screen.getByText('92% успех')).toBeInTheDocument();
    });
  });

  it('handles metrics API failure gracefully', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.02, systemHealth: 'healthy' },
      uptime: 3600000
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      });

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
      expect(fetch).toHaveBeenCalledWith('/api/metrics/dashboard?agents=true&performance=false');
    });

    // Should still display default template count
    await waitFor(() => {
      expect(screen.getByText('127')).toBeInTheDocument(); // Default template count
      expect(screen.queryByText('Статус агентов')).not.toBeInTheDocument(); // No agent metrics
    });
  });

  it('handles unsuccessful metrics response', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.02, systemHealth: 'healthy' },
      uptime: 3600000
    };

    const mockMetricsError = {
      success: false,
      error: 'Database connection failed'
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsError
      });

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
      expect(fetch).toHaveBeenCalledWith('/api/metrics/dashboard?agents=true&performance=false');
    });

    // Should still display default values
    await waitFor(() => {
      expect(screen.getByText('127')).toBeInTheDocument(); // Default template count
      expect(screen.queryByText('Статус агентов')).not.toBeInTheDocument(); // No agent metrics
    });
  });

  it('updates metrics on interval', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.02, systemHealth: 'healthy' },
      uptime: 3600000
    };

    const mockMetricsData1 = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 130,
          successRate: 95,
          activeAgents: 4,
          totalRequests: 200,
          averageResponseTime: 90,
          errorRate: 5,
          uptime: 3600000
        },
        recent: { generatedTemplates: 5, failedRequests: 1, averageQualityScore: 88, totalUsers: 165 }
      }
    };

    const mockMetricsData2 = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 132, // Updated count
          successRate: 96,
          activeAgents: 4,
          totalRequests: 210,
          averageResponseTime: 85,
          errorRate: 4,
          uptime: 3630000
        },
        recent: { generatedTemplates: 7, failedRequests: 0, averageQualityScore: 90, totalUsers: 170 }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockHealthData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockMetricsData1 })
      .mockResolvedValueOnce({ ok: true, json: async () => mockHealthData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockMetricsData2 });

    render(<Home />);

    // Initial load
    await waitFor(() => {
      expect(screen.getByText('130')).toBeInTheDocument();
    });

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000);

    // Check updated metrics
    await waitFor(() => {
      expect(screen.getByText('132')).toBeInTheDocument(); // Updated template count
    });
  });

  it('displays correct performance indicators', async () => {
    const mockHealthData = {
      status: 'degraded',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.08, systemHealth: 'degraded' },
      uptime: 3600000
    };

    const mockMetricsData = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 128,
          successRate: 92, // Lower success rate
          activeAgents: 6, // Scaled up agents
          totalRequests: 300,
          averageResponseTime: 150, // Slower response
          errorRate: 8,
          uptime: 3600000
        },
        recent: { generatedTemplates: 3, failedRequests: 5, averageQualityScore: 85, totalUsers: 200 }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsData
      });

    render(<Home />);

    await waitFor(() => {
      // Check performance indicators
      expect(screen.getByText('92%')).toBeInTheDocument(); // Lower success rate
      expect(screen.getByText('6')).toBeInTheDocument(); // Scaled up agents
      expect(screen.getByText('5')).toBeInTheDocument(); // More failed requests
      expect(screen.getByText('50')).toBeInTheDocument(); // Requests per agent (300/6)
      expect(screen.getByText('~150мс отклик')).toBeInTheDocument(); // Slower response time
    });
  });

  it('handles partial metrics data', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: { requestCount: 150, averageResponseTime: 120, errorRate: 0.02, systemHealth: 'healthy' },
      uptime: 3600000
    };

    const mockMetricsData = {
      success: true,
      metrics: {
        systemStats: {
          templateCount: 140,
          successRate: 97,
          activeAgents: 4,
          totalRequests: 220,
          averageResponseTime: 75,
          errorRate: 3,
          uptime: 3600000
        },
        recent: { generatedTemplates: 6, failedRequests: 1, averageQualityScore: 91, totalUsers: 175 }
        // No agentMetrics provided
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsData
      });

    render(<Home />);

    await waitFor(() => {
      // Main stats should be displayed
      expect(screen.getByText('140')).toBeInTheDocument();
      expect(screen.getByText('97%')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      
      // Additional metrics should be displayed
      expect(screen.getByText('91%')).toBeInTheDocument(); // Quality score
      expect(screen.getByText('175')).toBeInTheDocument(); // Total users
      
      // Agent status section should not be displayed
      expect(screen.queryByText('Статус агентов')).not.toBeInTheDocument();
    });
  });
});