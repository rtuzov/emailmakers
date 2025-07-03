/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch before importing the component
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({
    success: true,
    analysis: {
      current_state: {
        health_score: 85,
        active_agents: 3,
        success_rate: 92,
        average_response_time: 1500
      },
      insights: {
        trends_detected: 2,
        bottlenecks_found: 0,
        error_patterns: 1,
        predicted_issues: 0
      },
      assessment: "System operating normally",
      opportunities: []
    }
  })
});

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: jest.fn().mockImplementation((message, options) => {
    console.log('Toast:', message, options);
    return 'toast-id';
  }),
  Toaster: ({ children }: { children?: React.ReactNode }) => <div data-testid="toaster">{children}</div>
}));

describe('Optimization Dashboard Basic Tests', () => {
  it('should import and render without crashing', async () => {
    // Dynamic import to avoid module loading issues
    const { default: OptimizationDashboard } = await import('@/app/optimization-dashboard/page');
    
    const { container } = render(<OptimizationDashboard />);
    
    // Check that the component renders something
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render the main title', async () => {
    const { default: OptimizationDashboard } = await import('@/app/optimization-dashboard/page');
    
    const { getByText } = render(<OptimizationDashboard />);
    
    expect(getByText('Панель')).toBeInTheDocument();
    expect(getByText('Оптимизации')).toBeInTheDocument();
  });

  it('should render metric cards', async () => {
    const { default: OptimizationDashboard } = await import('@/app/optimization-dashboard/page');
    
    const { getByText } = render(<OptimizationDashboard />);
    
    expect(getByText('Здоровье системы')).toBeInTheDocument();
    expect(getByText('Активные агенты')).toBeInTheDocument();
    expect(getByText('Успешность')).toBeInTheDocument();
    expect(getByText('Время отклика')).toBeInTheDocument();
  });

  it('should render action buttons', async () => {
    const { default: OptimizationDashboard } = await import('@/app/optimization-dashboard/page');
    
    const { getByText } = render(<OptimizationDashboard />);
    
    expect(getByText('🔍 Запустить анализ')).toBeInTheDocument();
    expect(getByText('🔄 Обновить данные')).toBeInTheDocument();
    expect(getByText('⚙️ Настройки')).toBeInTheDocument();
  });
});