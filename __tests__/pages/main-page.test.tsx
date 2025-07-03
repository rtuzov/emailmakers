import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('Main Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders main page with hero section', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        metrics: {
          requestCount: 150,
          averageResponseTime: 120,
          errorRate: 0.02,
          systemHealth: 'healthy'
        },
        uptime: 3600000 // 1 hour
      })
    });

    render(<Home />);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Makers')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Email Template Generation')).toBeInTheDocument();
    expect(screen.getByText('🚀 Начать создание')).toBeInTheDocument();
    expect(screen.getByText('📧 Посмотреть шаблоны')).toBeInTheDocument();
  });

  it('displays system statistics correctly', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        metrics: {
          requestCount: 150,
          averageResponseTime: 120,
          errorRate: 0.02,
          systemHealth: 'healthy'
        },
        uptime: 3600000
      })
    });

    render(<Home />);

    expect(screen.getByText('127')).toBeInTheDocument(); // Template count
    expect(screen.getByText('Созданных шаблонов')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Active agents
    expect(screen.getByText('Активных агентов')).toBeInTheDocument();
  });

  it('fetches and displays health status', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: {
        requestCount: 150,
        averageResponseTime: 120,
        errorRate: 0.02,
        systemHealth: 'healthy'
      },
      uptime: 3600000 // 1 hour
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthData
    });

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
    });

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
      expect(screen.getByText('🟢')).toBeInTheDocument();
      expect(screen.getByText('60м работы')).toBeInTheDocument(); // 1 hour = 60 minutes
    });
  });

  it('calculates success rate from error rate correctly', async () => {
    const mockHealthData = {
      status: 'healthy',
      metrics: {
        requestCount: 150,
        averageResponseTime: 120,
        errorRate: 0.05, // 5% error rate = 95% success rate
        systemHealth: 'healthy'
      },
      uptime: 3600000
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthData
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('95%')).toBeInTheDocument(); // Success rate
      expect(screen.getByText('~120мс отклик')).toBeInTheDocument(); // Response time
      expect(screen.getByText('150 запросов')).toBeInTheDocument(); // Request count
    });
  });

  it('handles different health statuses correctly', async () => {
    const mockHealthData = {
      status: 'degraded',
      metrics: {
        requestCount: 150,
        averageResponseTime: 120,
        errorRate: 0.02,
        systemHealth: 'degraded'
      },
      uptime: 3600000
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthData
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('degraded')).toBeInTheDocument();
      expect(screen.getByText('🟡')).toBeInTheDocument();
    });
  });

  it('handles unhealthy status correctly', async () => {
    const mockHealthData = {
      status: 'unhealthy',
      metrics: {
        requestCount: 150,
        averageResponseTime: 120,
        errorRate: 0.15, // 15% error rate
        systemHealth: 'unhealthy'
      },
      uptime: 3600000
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthData
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('unhealthy')).toBeInTheDocument();
      expect(screen.getByText('🔴')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument(); // Success rate
    });
  });

  it('handles fetch error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
    });

    // Should not crash and should hide loading indicator
    await waitFor(() => {
      expect(screen.queryByText('загрузка...')).not.toBeInTheDocument();
    });
  });

  it('handles failed response gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503
    });

    render(<Home />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/health?detailed=false');
    });

    // Should not crash and should hide loading indicator
    await waitFor(() => {
      expect(screen.queryByText('загрузка...')).not.toBeInTheDocument();
    });
  });

  it('shows loading indicator initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Home />);

    expect(screen.getByText('загрузка...')).toBeInTheDocument();
  });

  it('refreshes health status every 30 seconds', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'healthy',
        metrics: {
          requestCount: 150,
          averageResponseTime: 120,
          errorRate: 0.02,
          systemHealth: 'healthy'
        },
        uptime: 3600000
      })
    });

    render(<Home />);

    // Initial call
    expect(fetch).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have made another call
    expect(fetch).toHaveBeenCalledTimes(2);

    // Fast-forward another 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have made a third call
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('displays features grid correctly', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        metrics: {
          requestCount: 150,
          averageResponseTime: 120,
          errorRate: 0.02,
          systemHealth: 'healthy'
        },
        uptime: 3600000
      })
    });

    render(<Home />);

    expect(screen.getByText('AI-генерация')).toBeInTheDocument();
    expect(screen.getByText('Figma интеграция')).toBeInTheDocument();
    expect(screen.getByText('Совместимость')).toBeInTheDocument();
    expect(screen.getByText('Быстро')).toBeInTheDocument();
    expect(screen.getByText('🤖')).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('📱')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'healthy',
        metrics: {
          requestCount: 150,
          averageResponseTime: 120,
          errorRate: 0.02,
          systemHealth: 'healthy'
        },
        uptime: 3600000
      })
    });

    render(<Home />);

    const createLink = screen.getByText('🚀 Начать создание').closest('a');
    const templatesLink = screen.getByText('📧 Посмотреть шаблоны').closest('a');

    expect(createLink).toHaveAttribute('href', '/create');
    expect(templatesLink).toHaveAttribute('href', '/templates');
  });
});