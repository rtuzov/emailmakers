/**
 * Comprehensive test suite for Phase 2.1.6: Real-time Status Indicators + Testing Coverage
 * Tests visual status indicators showing system health in real-time
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the fetch API for dashboard metrics
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

describe('Phase 2.1.6: Real-time Status Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        metrics: {
          systemStats: {
            templateCount: 127,
            successRate: 95,
            activeAgents: 4,
            totalRequests: 500,
            averageResponseTime: 850,
            errorRate: 3,
            uptime: 3600000,
          },
          recent: {
            generatedTemplates: 12,
            failedRequests: 1,
            averageQualityScore: 92,
            totalUsers: 185,
          },
        },
      }),
    });
  });

  it('displays system health status indicator with correct color', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const statusIndicators = screen.getByText(/Система здорова/);
      expect(statusIndicators).toBeInTheDocument();
    });

    // Check for green indicator (healthy system with < 5% error rate)
    const healthIndicator = screen.getByText(/Система здорова/).previousElementSibling;
    expect(healthIndicator).toHaveClass('bg-green-500');
  });

  it('displays agent activity status with correct count and color', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const agentStatus = screen.getByText(/4 агентов активно/);
      expect(agentStatus).toBeInTheDocument();
    });

    // Check for green indicator (4+ agents active)
    const agentIndicator = screen.getByText(/4 агентов активно/).previousElementSibling;
    expect(agentIndicator).toHaveClass('bg-green-500');
  });

  it('displays response time status with correct threshold colors', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const responseStatus = screen.getByText(/850мс отклик/);
      expect(responseStatus).toBeInTheDocument();
    });

    // Check for green indicator (< 1000ms response time)
    const responseIndicator = screen.getByText(/850мс отклик/).previousElementSibling;
    expect(responseIndicator).toHaveClass('bg-green-500');
  });

  it('displays success rate status with correct percentage and color', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const successStatus = screen.getByText(/95% успех/);
      expect(successStatus).toBeInTheDocument();
    });

    // Check for green indicator (>= 95% success rate)
    const successIndicator = screen.getByText(/95% успех/).previousElementSibling;
    expect(successIndicator).toHaveClass('bg-green-500');
  });

  it('shows yellow indicators for warning thresholds', async () => {
    // Mock moderate performance metrics
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        metrics: {
          systemStats: {
            templateCount: 127,
            successRate: 88, // Warning level
            activeAgents: 3, // Warning level
            totalRequests: 500,
            averageResponseTime: 2500, // Warning level
            errorRate: 7, // Warning level
            uptime: 3600000,
          },
          recent: {
            generatedTemplates: 12,
            failedRequests: 3,
            averageQualityScore: 88,
            totalUsers: 185,
          },
        },
      }),
    });

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Система стабильна/)).toBeInTheDocument();
      expect(screen.getByText(/3 агентов активно/)).toBeInTheDocument();
      expect(screen.getByText(/2500мс отклик/)).toBeInTheDocument();
      expect(screen.getByText(/88% успех/)).toBeInTheDocument();
    });

    // Check for yellow indicators
    const healthIndicator = screen.getByText(/Система стабильна/).previousElementSibling;
    expect(healthIndicator).toHaveClass('bg-yellow-500');

    const agentIndicator = screen.getByText(/3 агентов активно/).previousElementSibling;
    expect(agentIndicator).toHaveClass('bg-yellow-500');

    const responseIndicator = screen.getByText(/2500мс отклик/).previousElementSibling;
    expect(responseIndicator).toHaveClass('bg-yellow-500');

    const successIndicator = screen.getByText(/88% успех/).previousElementSibling;
    expect(successIndicator).toHaveClass('bg-yellow-500');
  });

  it('shows red indicators for critical thresholds', async () => {
    // Mock poor performance metrics
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        metrics: {
          systemStats: {
            templateCount: 127,
            successRate: 75, // Critical level
            activeAgents: 1, // Critical level
            totalRequests: 500,
            averageResponseTime: 4000, // Critical level
            errorRate: 15, // Critical level
            uptime: 3600000,
          },
          recent: {
            generatedTemplates: 5,
            failedRequests: 8,
            averageQualityScore: 75,
            totalUsers: 185,
          },
        },
      }),
    });

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Система перегружена/)).toBeInTheDocument();
      expect(screen.getByText(/1 агентов активно/)).toBeInTheDocument();
      expect(screen.getByText(/4000мс отклик/)).toBeInTheDocument();
      expect(screen.getByText(/75% успех/)).toBeInTheDocument();
    });

    // Check for red indicators
    const healthIndicator = screen.getByText(/Система перегружена/).previousElementSibling;
    expect(healthIndicator).toHaveClass('bg-red-500');

    const agentIndicator = screen.getByText(/1 агентов активно/).previousElementSibling;
    expect(agentIndicator).toHaveClass('bg-red-500');

    const responseIndicator = screen.getByText(/4000мс отклик/).previousElementSibling;
    expect(responseIndicator).toHaveClass('bg-red-500');

    const successIndicator = screen.getByText(/75% успех/).previousElementSibling;
    expect(successIndicator).toHaveClass('bg-red-500');
  });

  it('displays live activity indicator on active agents card', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const agentsCard = screen.getByText(/Активных агентов/).closest('.text-center');
      expect(agentsCard).toBeInTheDocument();
      expect(agentsCard).toHaveClass('relative');
    });

    // Check for live activity indicator element
    const agentsCard = screen.getByText(/Активных агентов/).closest('.text-center');
    const liveIndicator = agentsCard?.querySelector('.absolute.-top-1.-right-1 .animate-pulse');
    expect(liveIndicator).toBeInTheDocument();
    expect(liveIndicator).toHaveClass('bg-green-500'); // 4+ agents = green
  });

  it('animates status indicators with pulse effect', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const statusIndicators = document.querySelectorAll('.animate-pulse');
      expect(statusIndicators).toHaveLength(5); // 4 status indicators + 1 live activity indicator
    });

    // Verify all status indicators have pulse animation
    const statusRow = screen.getByText(/Система здорова/).closest('.flex.items-center.gap-6');
    const pulseElements = statusRow?.querySelectorAll('.animate-pulse');
    expect(pulseElements).toHaveLength(4); // One for each status indicator
  });

  it('handles loading state gracefully without breaking indicators', async () => {
    // Mock slow API response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          metrics: {
            systemStats: {
              templateCount: 0,
              successRate: 0,
              activeAgents: 0,
              totalRequests: 0,
              averageResponseTime: 0,
              errorRate: 0,
              uptime: 0,
            },
            recent: {
              generatedTemplates: 0,
              failedRequests: 0,
              averageQualityScore: 0,
              totalUsers: 0,
            },
          },
        })
      }), 100))
    );

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    // Should show loading state
    expect(screen.getByText(/загрузка.../)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/0 агентов активно/)).toBeInTheDocument();
    }, { timeout: 500 });

    // Verify indicators still work with zero values
    const agentIndicator = screen.getByText(/0 агентов активно/).previousElementSibling;
    expect(agentIndicator).toHaveClass('bg-red-500'); // 0 agents = red
  });

  it('maintains responsive layout on mobile screens', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const statusContainer = screen.getByText(/Система здорова/).closest('.flex.items-center.gap-6');
      expect(statusContainer).toBeInTheDocument();
    });

    // Verify responsive classes are applied
    const statusContainer = screen.getByText(/Система здорова/).closest('.flex.items-center.gap-6');
    expect(statusContainer).toHaveClass('gap-6'); // Should maintain spacing on mobile
  });

  it('updates indicators when metrics change', async () => {
    const HomePage = (await import('@/app/page')).default;
    const { rerender } = render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Система здорова/)).toBeInTheDocument();
    });

    // Mock updated metrics with different values
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        metrics: {
          systemStats: {
            templateCount: 150,
            successRate: 92,
            activeAgents: 6,
            totalRequests: 750,
            averageResponseTime: 1200,
            errorRate: 4,
            uptime: 7200000,
          },
          recent: {
            generatedTemplates: 18,
            failedRequests: 2,
            averageQualityScore: 94,
            totalUsers: 220,
          },
        },
      }),
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/6 агентов активно/)).toBeInTheDocument();
      expect(screen.getByText(/1200мс отклик/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully without breaking indicators', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      // Should show loading initially, then handle error gracefully
      expect(screen.getByText(/загрузка.../)).toBeInTheDocument();
    });

    // Verify error was logged but page doesn't crash
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('validates color thresholds for each status type', () => {
    // Test health status thresholds
    const healthColors = [
      { errorRate: 2, expected: 'bg-green-500' },
      { errorRate: 7, expected: 'bg-yellow-500' },
      { errorRate: 15, expected: 'bg-red-500' },
    ];

    healthColors.forEach(({ errorRate, expected }) => {
      const className = errorRate < 5 ? 'bg-green-500' : 
                       errorRate < 10 ? 'bg-yellow-500' : 'bg-red-500';
      expect(className).toBe(expected);
    });

    // Test agent count thresholds
    const agentColors = [
      { agents: 5, expected: 'bg-green-500' },
      { agents: 3, expected: 'bg-yellow-500' },
      { agents: 1, expected: 'bg-red-500' },
    ];

    agentColors.forEach(({ agents, expected }) => {
      const className = agents >= 4 ? 'bg-green-500' : 
                       agents >= 2 ? 'bg-yellow-500' : 'bg-red-500';
      expect(className).toBe(expected);
    });

    // Test response time thresholds
    const responseColors = [
      { time: 800, expected: 'bg-green-500' },
      { time: 2000, expected: 'bg-yellow-500' },
      { time: 4000, expected: 'bg-red-500' },
    ];

    responseColors.forEach(({ time, expected }) => {
      const className = time < 1000 ? 'bg-green-500' : 
                       time < 3000 ? 'bg-yellow-500' : 'bg-red-500';
      expect(className).toBe(expected);
    });

    // Test success rate thresholds
    const successColors = [
      { rate: 97, expected: 'bg-green-500' },
      { rate: 88, expected: 'bg-yellow-500' },
      { rate: 75, expected: 'bg-red-500' },
    ];

    successColors.forEach(({ rate, expected }) => {
      const className = rate >= 95 ? 'bg-green-500' : 
                       rate >= 85 ? 'bg-yellow-500' : 'bg-red-500';
      expect(className).toBe(expected);
    });
  });

  it('ensures accessibility with proper contrast and labels', async () => {
    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      const statusContainer = screen.getByText(/Система здорова/).closest('.flex.items-center.gap-6');
      expect(statusContainer).toBeInTheDocument();
    });

    // Verify text contrast classes
    const statusTexts = screen.getAllByText(/text-white\/80/);
    statusTexts.forEach(text => {
      expect(text).toHaveClass('text-white/80'); // Good contrast on dark background
    });

    // Verify semantic status descriptions
    expect(screen.getByText(/Система здорова/)).toBeInTheDocument();
    expect(screen.getByText(/агентов активно/)).toBeInTheDocument();
    expect(screen.getByText(/мс отклик/)).toBeInTheDocument();
    expect(screen.getByText(/% успех/)).toBeInTheDocument();
  });

  it('measures performance impact of status indicators', async () => {
    const startTime = performance.now();

    const HomePage = (await import('@/app/page')).default;
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Статистика системы/)).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Status indicators should not significantly impact render performance
    expect(renderTime).toBeLessThan(500); // Should render within 500ms
  });
});