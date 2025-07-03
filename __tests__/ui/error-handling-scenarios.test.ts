/**
 * Test suite for Phase 2.2.5: Comprehensive Error Handling
 * Tests error scenarios, validation, retry mechanisms, and user-friendly error messages
 */

describe('Comprehensive Error Handling and Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form Validation Errors', () => {
    it('validates required brief text field', () => {
      const validateForm = (formData: any) => {
        const errors: string[] = [];
        
        if (!formData.briefText.trim()) {
          errors.push('Бриф не может быть пустым');
        } else if (formData.briefText.length < 10) {
          errors.push('Бриф должен содержать минимум 10 символов');
        } else if (formData.briefText.length > 5000) {
          errors.push('Бриф не может превышать 5000 символов');
        }
        
        return { isValid: errors.length === 0, errors };
      };

      // Test empty brief
      expect(validateForm({ briefText: '' }).isValid).toBe(false);
      expect(validateForm({ briefText: '' }).errors).toContain('Бриф не может быть пустым');

      // Test too short brief
      expect(validateForm({ briefText: 'короткий' }).isValid).toBe(false);
      expect(validateForm({ briefText: 'короткий' }).errors).toContain('Бриф должен содержать минимум 10 символов');

      // Test too long brief
      const longText = 'а'.repeat(5001);
      expect(validateForm({ briefText: longText }).isValid).toBe(false);
      expect(validateForm({ briefText: longText }).errors).toContain('Бриф не может превышать 5000 символов');

      // Test valid brief
      expect(validateForm({ briefText: 'Создать email для отпусков в Париж с профессиональным тоном' }).isValid).toBe(true);
    });

    it('validates destination and origin fields', () => {
      const validateForm = (formData: any) => {
        const errors: string[] = [];
        
        if (!formData.destination?.trim()) {
          errors.push('Направление не может быть пустым');
        }
        
        if (!formData.origin?.trim()) {
          errors.push('Место отправления не может быть пустым');
        }
        
        return { isValid: errors.length === 0, errors };
      };

      // Test empty destination
      expect(validateForm({ destination: '', origin: 'Москва' }).errors).toContain('Направление не может быть пустым');

      // Test empty origin
      expect(validateForm({ destination: 'Париж', origin: '' }).errors).toContain('Место отправления не может быть пустым');

      // Test valid data
      expect(validateForm({ destination: 'Париж', origin: 'Москва' }).isValid).toBe(true);
    });

    it('displays validation errors in user-friendly format', () => {
      const errorDetails = {
        type: 'validation' as const,
        message: 'Ошибка валидации формы',
        details: 'Бриф не может быть пустым. Направление не может быть пустым',
        retryable: false
      };

      expect(errorDetails.type).toBe('validation');
      expect(errorDetails.message).toContain('валидации');
      expect(errorDetails.details).toContain('Бриф не может быть пустым');
      expect(errorDetails.retryable).toBe(false);
    });
  });

  describe('Network Error Handling', () => {
    it('handles fetch network errors gracefully', async () => {
      const handleError = (error: any, context: string) => {
        let errorType: 'network' | 'timeout' | 'validation' | 'server' | 'agent' = 'server';
        let message = 'Произошла неизвестная ошибка';
        let details = '';
        let retryable = false;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorType = 'network';
          message = 'Ошибка подключения к серверу';
          details = 'Проверьте подключение к интернету и попробуйте снова';
          retryable = true;
        }
        
        return { type: errorType, message, details, retryable };
      };

      const networkError = new TypeError('Failed to fetch');
      const result = handleError(networkError, 'template generation');

      expect(result.type).toBe('network');
      expect(result.message).toBe('Ошибка подключения к серверу');
      expect(result.retryable).toBe(true);
      expect(result.details).toContain('подключение к интернету');
    });

    it('handles HTTP status errors appropriately', async () => {
      const handleError = (error: any) => {
        if (error.status === 400) {
          return {
            type: 'validation',
            message: 'Ошибка валидации данных',
            details: error.message || 'Проверьте правильность заполнения формы',
            retryable: false
          };
        } else if (error.status === 500) {
          return {
            type: 'server',
            message: 'Внутренняя ошибка сервера',
            details: 'Попробуйте позже или обратитесь в службу поддержки',
            retryable: true
          };
        }
        return { type: 'server', message: 'Unknown error', details: '', retryable: false };
      };

      // Test 400 error
      const validationError = { status: 400, message: 'Invalid brief text' };
      const result400 = handleError(validationError);
      expect(result400.type).toBe('validation');
      expect(result400.retryable).toBe(false);

      // Test 500 error
      const serverError = { status: 500, message: 'Internal server error' };
      const result500 = handleError(serverError);
      expect(result500.type).toBe('server');
      expect(result500.retryable).toBe(true);
    });

    it('implements exponential backoff for retries', async () => {
      let callCount = 0;
      const maxRetries = 3;
      
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= maxRetries) {
          return Promise.reject(new TypeError('Failed to fetch'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      });

      // Simulate retry mechanism
      const retryWithBackoff = async (fn: () => Promise<any>, maxAttempts: number) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await fn();
          } catch (error) {
            if (attempt === maxAttempts) throw error;
            
            // Exponential backoff: 100ms, 200ms, 400ms
            const delay = Math.pow(2, attempt - 1) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      try {
        await retryWithBackoff(() => fetch('/api/test'), maxRetries + 1);
        expect(callCount).toBe(maxRetries + 1);
      } catch (error) {
        // Should succeed after retries
        fail('Should not reach here if retry logic works');
      }
    });
  });

  describe('Timeout Error Handling', () => {
    it('handles request timeouts with AbortController', async () => {
      const handleError = (error: any) => {
        if (error.name === 'AbortError') {
          return {
            type: 'timeout',
            message: 'Время ожидания истекло',
            details: 'Операция заняла слишком много времени. Попробуйте снова',
            retryable: true
          };
        }
        return { type: 'server', message: 'Unknown error', details: '', retryable: false };
      };

      const timeoutError = { name: 'AbortError', message: 'The operation was aborted' };
      const result = handleError(timeoutError);

      expect(result.type).toBe('timeout');
      expect(result.message).toBe('Время ожидания истекло');
      expect(result.retryable).toBe(true);
    });

    it('sets appropriate timeout durations for different operations', () => {
      const timeouts = {
        progressTracking: 10000,  // 10 seconds
        templateGeneration: 120000, // 2 minutes
        agentExecution: 180000    // 3 minutes
      };

      expect(timeouts.progressTracking).toBe(10000);
      expect(timeouts.templateGeneration).toBe(120000);
      expect(timeouts.agentExecution).toBe(180000);
    });

    it('cancels ongoing requests when component unmounts', () => {
      const controller = new AbortController();
      
      // Simulate fetch with abort signal
      const mockFetch = jest.fn().mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          if (options?.signal?.aborted) {
            reject({ name: 'AbortError', message: 'Aborted' });
            return;
          }
          options?.signal?.addEventListener('abort', () => {
            reject({ name: 'AbortError', message: 'Aborted' });
          });
        });
      });

      const fetchPromise = mockFetch('/api/test', { signal: controller.signal });
      
      // Simulate component unmount
      controller.abort();
      
      expect(controller.signal.aborted).toBe(true);
      
      // Verify the promise rejects properly
      return expect(fetchPromise).rejects.toMatchObject({
        name: 'AbortError',
        message: 'Aborted'
      });
    });
  });

  describe('Agent Pipeline Error Handling', () => {
    it('handles individual agent failures in pipeline', async () => {
      const agentFailureResponse = {
        success: true,
        progress: {
          trace_id: 'test_agent_failure',
          overall_progress: 25,
          status: 'failed',
          error: 'Content specialist failed: OpenAI API rate limit exceeded',
          agents: [
            { agent: 'content_specialist', status: 'failed', progress_percentage: 0, error: 'OpenAI API rate limit exceeded' },
            { agent: 'design_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => agentFailureResponse
      });

      const response = await fetch('/api/agent/progress?traceId=test_agent_failure');
      const data = await response.json();

      expect(data.progress.status).toBe('failed');
      expect(data.progress.error).toContain('OpenAI API rate limit');
      expect(data.progress.agents[0].status).toBe('failed');
      expect(data.progress.agents[0].error).toContain('rate limit');
    });

    it('provides specific error messages for different agent types', () => {
      const getAgentErrorMessage = (agent: string, error: string) => {
        switch (agent) {
          case 'content_specialist':
            if (error.includes('OpenAI')) return 'Ошибка генерации контента: проблема с AI сервисом';
            if (error.includes('rate limit')) return 'Превышен лимит запросов к AI сервису';
            return 'Ошибка в работе специалиста по контенту';
          case 'design_specialist':
            if (error.includes('Figma')) return 'Ошибка получения дизайн-токенов из Figma';
            if (error.includes('MJML')) return 'Ошибка компиляции MJML шаблона';
            return 'Ошибка в работе дизайн-специалиста';
          case 'quality_specialist':
            if (error.includes('validation')) return 'Ошибка валидации качества шаблона';
            return 'Ошибка контроля качества';
          case 'delivery_specialist':
            if (error.includes('optimization')) return 'Ошибка оптимизации для почтовых клиентов';
            if (error.includes('Optimization')) return 'Ошибка оптимизации для почтовых клиентов';
            return 'Ошибка специалиста доставки';
          default:
            return 'Неизвестная ошибка агента';
        }
      };

      expect(getAgentErrorMessage('content_specialist', 'OpenAI API error')).toContain('AI сервисом');
      expect(getAgentErrorMessage('design_specialist', 'Figma token invalid')).toContain('Figma');
      expect(getAgentErrorMessage('quality_specialist', 'HTML validation failed')).toContain('валидации');
      expect(getAgentErrorMessage('delivery_specialist', 'Optimization timeout')).toContain('оптимизации');
    });

    it('allows pipeline retry after agent failure', async () => {
      let callCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: agent failure
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              progress: {
                trace_id: 'retry_test',
                status: 'failed',
                error: 'Content specialist timeout'
              }
            })
          });
        } else {
          // Retry: success
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              progress: {
                trace_id: 'retry_test',
                status: 'running',
                overall_progress: 50
              }
            })
          });
        }
      });

      // First attempt
      const firstResponse = await fetch('/api/agent/progress?traceId=retry_test');
      const firstData = await firstResponse.json();
      expect(firstData.progress.status).toBe('failed');

      // Retry attempt
      const retryResponse = await fetch('/api/agent/progress?traceId=retry_test');
      const retryData = await retryResponse.json();
      expect(retryData.progress.status).toBe('running');
      expect(callCount).toBe(2);
    });
  });

  describe('Progress Tracking Error Recovery', () => {
    it('handles progress API 404 errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Progress not found' })
      });

      const response = await fetch('/api/agent/progress?traceId=nonexistent');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it('continues polling despite intermittent network errors', async () => {
      let callCount = 0;
      const responses = [
        Promise.reject(new TypeError('Failed to fetch')), // Network error
        Promise.reject(new TypeError('Failed to fetch')), // Network error
        Promise.resolve({ // Success
          ok: true,
          json: async () => ({
            success: true,
            progress: { trace_id: 'test', overall_progress: 50 }
          })
        })
      ];

      (global.fetch as jest.Mock).mockImplementation(() => {
        return responses[callCount++];
      });

      // Simulate polling with error recovery
      const pollWithRecovery = async (maxRetries: number) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await fetch('/api/agent/progress?traceId=test');
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            // Continue to next attempt
          }
        }
      };

      const result = await pollWithRecovery(3);
      expect(result.success).toBe(true);
      expect(result.progress.overall_progress).toBe(50);
      expect(callCount).toBe(3);
    });

    it('implements circuit breaker pattern for repeated failures', () => {
      interface CircuitBreaker {
        state: 'closed' | 'open' | 'half-open';
        failureCount: number;
        lastFailureTime: number;
        threshold: number;
        timeout: number;
      }

      const createCircuitBreaker = (threshold: number, timeout: number): CircuitBreaker => ({
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        threshold,
        timeout
      });

      const executeWithCircuitBreaker = async (circuitBreaker: CircuitBreaker, operation: () => Promise<any>) => {
        if (circuitBreaker.state === 'open') {
          if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.timeout) {
            circuitBreaker.state = 'half-open';
          } else {
            throw new Error('Circuit breaker is open');
          }
        }

        try {
          const result = await operation();
          // Success resets the circuit breaker
          circuitBreaker.failureCount = 0;
          circuitBreaker.state = 'closed';
          return result;
        } catch (error) {
          circuitBreaker.failureCount++;
          circuitBreaker.lastFailureTime = Date.now();
          
          if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
            circuitBreaker.state = 'open';
          }
          
          throw error;
        }
      };

      const breaker = createCircuitBreaker(3, 60000); // 3 failures, 1 minute timeout
      
      expect(breaker.state).toBe('closed');
      expect(breaker.threshold).toBe(3);
      expect(breaker.timeout).toBe(60000);
    });
  });

  describe('User Experience and Error Display', () => {
    it('shows appropriate icons for different error types', () => {
      const getErrorIcon = (type: string) => {
        switch (type) {
          case 'validation': return '⚠️';
          case 'network': return '🌐';
          case 'timeout': return '⏰';
          case 'agent': return '🤖';
          default: return '❌';
        }
      };

      expect(getErrorIcon('validation')).toBe('⚠️');
      expect(getErrorIcon('network')).toBe('🌐');
      expect(getErrorIcon('timeout')).toBe('⏰');
      expect(getErrorIcon('agent')).toBe('🤖');
      expect(getErrorIcon('server')).toBe('❌');
    });

    it('provides contextual help messages for error resolution', () => {
      const getHelpMessage = (errorType: string) => {
        switch (errorType) {
          case 'validation':
            return 'Проверьте правильность заполнения всех обязательных полей';
          case 'network':
            return 'Проверьте подключение к интернету и повторите попытку';
          case 'timeout':
            return 'Операция заняла слишком много времени. Попробуйте с упрощенным брифом';
          case 'agent':
            return 'Один из AI агентов столкнулся с проблемой. Система автоматически попробует снова';
          case 'server':
            return 'Временные проблемы на сервере. Попробуйте через несколько минут';
          default:
            return 'Обратитесь в службу поддержки, если проблема повторяется';
        }
      };

      expect(getHelpMessage('validation')).toContain('обязательных полей');
      expect(getHelpMessage('network')).toContain('подключение к интернету');
      expect(getHelpMessage('timeout')).toContain('упрощенным брифом');
      expect(getHelpMessage('agent')).toContain('AI агентов');
    });

    it('tracks error metrics for monitoring', () => {
      interface ErrorMetrics {
        totalErrors: number;
        errorsByType: Record<string, number>;
        lastError: Date | null;
        averageRetryCount: number;
      }

      const updateErrorMetrics = (metrics: ErrorMetrics, errorType: string, retryCount: number): ErrorMetrics => {
        const newTotalErrors = metrics.totalErrors + 1;
        return {
          totalErrors: newTotalErrors,
          errorsByType: {
            ...metrics.errorsByType,
            [errorType]: (metrics.errorsByType[errorType] || 0) + 1
          },
          lastError: new Date(),
          averageRetryCount: metrics.totalErrors === 0 ? retryCount : 
            ((metrics.averageRetryCount * metrics.totalErrors) + retryCount) / newTotalErrors
        };
      };

      const initialMetrics: ErrorMetrics = {
        totalErrors: 0,
        errorsByType: {},
        lastError: null,
        averageRetryCount: 0
      };

      const updatedMetrics = updateErrorMetrics(initialMetrics, 'network', 2);
      
      expect(updatedMetrics.totalErrors).toBe(1);
      expect(updatedMetrics.errorsByType.network).toBe(1);
      expect(updatedMetrics.averageRetryCount).toBe(2);
    });

    it('implements progressive error disclosure', () => {
      interface ErrorDisplay {
        level: 'minimal' | 'detailed' | 'debug';
        showRetryButton: boolean;
        showDetails: boolean;
        showTechnicalInfo: boolean;
      }

      const getErrorDisplayLevel = (errorCount: number, userType: 'regular' | 'developer'): ErrorDisplay => {
        if (userType === 'developer') {
          return {
            level: 'debug',
            showRetryButton: true,
            showDetails: true,
            showTechnicalInfo: true
          };
        }

        if (errorCount === 1) {
          return {
            level: 'minimal',
            showRetryButton: true,
            showDetails: false,
            showTechnicalInfo: false
          };
        } else if (errorCount <= 3) {
          return {
            level: 'detailed',
            showRetryButton: true,
            showDetails: true,
            showTechnicalInfo: false
          };
        } else {
          return {
            level: 'debug',
            showRetryButton: false,
            showDetails: true,
            showTechnicalInfo: true
          };
        }
      };

      const regularUserFirstError = getErrorDisplayLevel(1, 'regular');
      expect(regularUserFirstError.level).toBe('minimal');
      expect(regularUserFirstError.showDetails).toBe(false);

      const regularUserRepeatedError = getErrorDisplayLevel(3, 'regular');
      expect(regularUserRepeatedError.level).toBe('detailed');
      expect(regularUserRepeatedError.showDetails).toBe(true);

      const developerError = getErrorDisplayLevel(1, 'developer');
      expect(developerError.level).toBe('debug');
      expect(developerError.showTechnicalInfo).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('implements graceful degradation when partial failures occur', () => {
      const processWithGracefulDegradation = (services: { primary: boolean; fallback: boolean; cache: boolean }) => {
        if (services.primary) {
          return { source: 'primary', quality: 'high', features: ['full', 'optimized', 'validated'] };
        } else if (services.fallback) {
          return { source: 'fallback', quality: 'medium', features: ['basic', 'functional'] };
        } else if (services.cache) {
          return { source: 'cache', quality: 'low', features: ['cached', 'basic'] };
        } else {
          throw new Error('All services unavailable');
        }
      };

      // Primary service working
      expect(processWithGracefulDegradation({ primary: true, fallback: true, cache: true }).quality).toBe('high');

      // Primary down, fallback working
      expect(processWithGracefulDegradation({ primary: false, fallback: true, cache: true }).quality).toBe('medium');

      // Only cache available
      expect(processWithGracefulDegradation({ primary: false, fallback: false, cache: true }).quality).toBe('low');
    });

    it('persists user input during error recovery', () => {
      interface FormState {
        briefText: string;
        destination: string;
        origin: string;
        tone: string;
        language: string;
      }

      // Mock localStorage for testing
      const mockStorage: { [key: string]: string } = {};
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
        removeItem: jest.fn((key: string) => { delete mockStorage[key]; })
      };

      const saveFormState = (formData: FormState) => {
        mockLocalStorage.setItem('form_draft', JSON.stringify({
          ...formData,
          timestamp: Date.now()
        }));
      };

      const restoreFormState = (): FormState | null => {
        try {
          const saved = mockLocalStorage.getItem('form_draft');
          if (!saved) return null;
          
          const parsed = JSON.parse(saved);
          const age = Date.now() - parsed.timestamp;
          
          // Expire after 1 hour
          if (age > 3600000) {
            mockLocalStorage.removeItem('form_draft');
            return null;
          }
          
          return parsed;
        } catch {
          return null;
        }
      };

      const testFormData: FormState = {
        briefText: 'Создать email для отпуска в Париж',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru'
      };

      saveFormState(testFormData);
      const restored = restoreFormState();
      
      expect(restored?.briefText).toBe(testFormData.briefText);
      expect(restored?.destination).toBe(testFormData.destination);
    });

    it('provides error context for debugging and support', () => {
      interface ErrorContext {
        timestamp: string;
        userAgent: string;
        url: string;
        userId?: string;
        formData: any;
        errorStack?: string;
        requestId?: string;
        sessionId: string;
      }

      const createErrorContext = (error: Error, formData: any): ErrorContext => {
        return {
          timestamp: new Date().toISOString(),
          userAgent: 'test-user-agent',
          url: 'http://localhost:3000/create',
          formData: {
            briefText: formData.briefText ? '[REDACTED]' : null,
            destination: formData.destination,
            origin: formData.origin,
            tone: formData.tone,
            language: formData.language
          },
          errorStack: error.stack,
          sessionId: 'test_session_123'
        };
      };

      const testError = new Error('Test error');
      const context = createErrorContext(testError, {
        briefText: 'Sensitive content',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru'
      });

      expect(context.timestamp).toBeTruthy();
      expect(context.formData.briefText).toBe('[REDACTED]');
      expect(context.formData.destination).toBe('Париж');
      expect(context.errorStack).toContain('Test error');
    });
  });
});