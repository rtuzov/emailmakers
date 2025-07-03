/**
 * Comprehensive test suite for Phase 2.2.1: Create Form API Integration
 * Tests the create form connection to /api/agent endpoint with full functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
});

describe('Phase 2.2.1: Create Form API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the create form with all required fields', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    // Check main heading
    expect(screen.getByText('Создать Email-шаблон')).toBeInTheDocument();
    expect(screen.getByText(/4-агентную систему/)).toBeInTheDocument();

    // Check all form fields
    expect(screen.getByLabelText(/Бриф для создания шаблона/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Направление/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Откуда/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Тон общения/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Язык/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Figma URL/)).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: 'Создать шаблон' })).toBeInTheDocument();
  });

  it('displays 4-agent pipeline overview cards', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    // Check all 4 agent cards
    expect(screen.getByText('Контент')).toBeInTheDocument();
    expect(screen.getByText('AI-генерация текста')).toBeInTheDocument();
    
    expect(screen.getByText('Дизайн')).toBeInTheDocument();
    expect(screen.getByText('Figma интеграция')).toBeInTheDocument();
    
    expect(screen.getByText('Качество')).toBeInTheDocument();
    expect(screen.getByText('Автопроверка')).toBeInTheDocument();
    
    expect(screen.getByText('Доставка')).toBeInTheDocument();
    expect(screen.getByText('Оптимизация')).toBeInTheDocument();
  });

  it('has correct default form values', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    // Check default values
    expect(screen.getByDisplayValue('Париж')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Москва')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Профессиональный')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Русский')).toBeInTheDocument();

    // Brief text should be empty
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    expect(briefField).toHaveValue('');
  });

  it('validates required brief text field', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });

    // Try to submit without brief text
    await user.click(submitButton);

    // Should show alert
    expect(window.alert).toHaveBeenCalledWith('Пожалуйста, заполните бриф для создания шаблона');
  });

  it('updates form fields correctly when user types', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Update brief text
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Создать промо письмо для отпуска в Париже');
    expect(briefField).toHaveValue('Создать промо письмо для отпуска в Париже');

    // Update destination
    const destinationField = screen.getByLabelText(/Направление/);
    await user.clear(destinationField);
    await user.type(destinationField, 'Лондон');
    expect(destinationField).toHaveValue('Лондон');

    // Update tone
    const toneField = screen.getByLabelText(/Тон общения/);
    await user.selectOptions(toneField, 'friendly');
    expect(toneField).toHaveValue('friendly');

    // Update Figma URL
    const figmaField = screen.getByLabelText(/Figma URL/);
    await user.type(figmaField, 'https://www.figma.com/file/test');
    expect(figmaField).toHaveValue('https://www.figma.com/file/test');
  });

  it('makes successful API request and displays result', async () => {
    // Mock successful API response
    const mockResponse = {
      status: 'success',
      data: {
        subject: 'Отдых в Париже ждет вас!',
        html_content: '<html><body>Test email content</body></html>',
        metadata: {
          agents_used: ['content', 'design', 'quality', 'delivery']
        }
      },
      metadata: {
        generation_time: 15000,
        mode: 'real_agent',
        apis_used: ['openai', 'figma']
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill in the form
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Создать промо письмо для отпуска в Париже');

    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Создание...')).toBeInTheDocument();
      expect(screen.getByText('Генерация шаблона...')).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Шаблон успешно создан!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Check that API was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        briefText: 'Создать промо письмо для отпуска в Париже',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru',
        figmaUrl: undefined
      }),
    });

    // Check success display
    expect(screen.getByText('Время генерации: 15000мс')).toBeInTheDocument();
    expect(screen.getByText('Создать еще')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    const mockErrorResponse = {
      status: 'error',
      error_message: 'OpenAI API rate limit exceeded'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill and submit form
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Test brief');

    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });
    await user.click(submitButton);

    // Wait for error display
    await waitFor(() => {
      expect(screen.getByText('Ошибка создания')).toBeInTheDocument();
    });

    expect(screen.getByText('OpenAI API rate limit exceeded')).toBeInTheDocument();
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
  });

  it('handles network errors', async () => {
    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill and submit form
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Test brief');

    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });
    await user.click(submitButton);

    // Wait for error display
    await waitFor(() => {
      expect(screen.getByText('Ошибка создания')).toBeInTheDocument();
    });

    expect(screen.getByText('Произошла ошибка при создании шаблона. Попробуйте еще раз.')).toBeInTheDocument();
  });

  it('shows progress indicator during generation', async () => {
    // Mock slow API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ status: 'success', data: {}, metadata: { generation_time: 5000 } })
        }), 2000)
      )
    );

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill and submit form
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Test brief');

    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });
    await user.click(submitButton);

    // Check progress elements
    await waitFor(() => {
      expect(screen.getByText('Генерация шаблона...')).toBeInTheDocument();
    });

    // Check for progress bar
    const progressBar = document.querySelector('.bg-kupibilet-primary');
    expect(progressBar).toBeInTheDocument();

    // Check for progress text
    expect(screen.getByText(/Анализ брифа и подготовка.../)).toBeInTheDocument();

    // Button should be disabled
    expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled();
  });

  it('resets form after successful generation', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        status: 'success', 
        data: {}, 
        metadata: { generation_time: 1000 } 
      }),
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill and submit form
    const briefField = screen.getByLabelText(/Бриф для создания шаблона/);
    await user.type(briefField, 'Test brief');

    await user.click(screen.getByRole('button', { name: 'Создать шаблон' }));

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Шаблон успешно создан!')).toBeInTheDocument();
    });

    // Click "Create another"
    await user.click(screen.getByText('Создать еще'));

    // Form should be reset
    expect(screen.getByLabelText(/Бриф для создания шаблона/)).toHaveValue('');
    expect(screen.getByDisplayValue('Париж')).toBeInTheDocument(); // Default values restored
    expect(screen.getByRole('button', { name: 'Создать шаблон' })).toBeInTheDocument();
  });

  it('validates all tone options are available', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const toneSelect = screen.getByLabelText(/Тон общения/);
    const options = Array.from(toneSelect.querySelectorAll('option')).map(option => option.textContent);

    expect(options).toEqual([
      'Профессиональный',
      'Дружелюбный', 
      'Официальный',
      'Неформальный',
      'Срочный'
    ]);
  });

  it('validates all language options are available', async () => {
    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const languageSelect = screen.getByLabelText(/Язык/);
    const options = Array.from(languageSelect.querySelectorAll('option')).map(option => option.textContent);

    expect(options).toEqual(['Русский', 'English']);
  });

  it('includes Figma URL in API request when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: {}, metadata: { generation_time: 1000 } }),
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill form with Figma URL
    await user.type(screen.getByLabelText(/Бриф для создания шаблона/), 'Test brief');
    await user.type(screen.getByLabelText(/Figma URL/), 'https://www.figma.com/file/abc123');

    await user.click(screen.getByRole('button', { name: 'Создать шаблон' }));

    // Check API call includes Figma URL
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        briefText: 'Test brief',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru',
        figmaUrl: 'https://www.figma.com/file/abc123'
      }),
    });
  });

  it('excludes empty Figma URL from API request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', data: {}, metadata: { generation_time: 1000 } }),
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    // Fill form without Figma URL
    await user.type(screen.getByLabelText(/Бриф для создания шаблона/), 'Test brief');

    await user.click(screen.getByRole('button', { name: 'Создать шаблон' }));

    // Check API call excludes Figma URL
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        briefText: 'Test brief',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru',
        figmaUrl: undefined
      }),
    });
  });

  it('displays detailed result data when available', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        subject: 'Путешествие в Париж',
        content: 'Откройте для себя красоту Парижа...',
        html_content: '<html><body><h1>Test</h1></body></html>',
        metadata: {
          agents_used: ['content-specialist', 'design-specialist']
        }
      },
      metadata: {
        generation_time: 8500,
        mode: 'real_agent',
        apis_used: ['openai']
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Бриф для создания шаблона/), 'Test brief');
    await user.click(screen.getByRole('button', { name: 'Создать шаблон' }));

    await waitFor(() => {
      expect(screen.getByText('Шаблон успешно создан!')).toBeInTheDocument();
    });

    // Check detailed result display
    expect(screen.getByText('Результат:')).toBeInTheDocument();
    
    // Check if JSON data is displayed
    const resultPre = screen.getByText((content, element) => 
      element?.tagName.toLowerCase() === 'pre' && content.includes('subject')
    );
    expect(resultPre).toBeInTheDocument();
  });

  it('measures form performance', async () => {
    const startTime = performance.now();

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Form should render quickly
    expect(renderTime).toBeLessThan(100); // Less than 100ms

    // All form elements should be present
    expect(screen.getByLabelText(/Бриф для создания шаблона/)).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1); // Submit button
  });

  it('handles rapid form submissions correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: {}, metadata: { generation_time: 1000 } }),
    });

    const CreatePage = (await import('@/app/create/page')).default;
    render(<CreatePage />);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Бриф для создания шаблона/), 'Test brief');

    const submitButton = screen.getByRole('button', { name: 'Создать шаблон' });

    // Click multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only make one API call
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Button should be disabled after first click
    expect(submitButton).toBeDisabled();
  });
});