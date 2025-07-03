/**
 * Integration test suite for /api/agent/run endpoint
 * Tests the backend API integration with the create form
 */

describe('Agent Run API Integration', () => {
  // Mock the agent function
  jest.mock('@/agent/agent', () => ({
    runAgent: jest.fn()
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates API endpoint accepts correct request format', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: true,
      data: {
        subject: 'Test Subject',
        content: 'Test Content',
        html_content: '<html><body>Test</body></html>',
        metadata: {
          agents_used: ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist']
        }
      },
      apis_used: ['openai', 'figma']
    });

    // Mock NextRequest
    const mockRequest = {
      json: async () => ({
        briefText: 'Создать промо письмо для отпуска в Париже',
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru',
        figmaUrl: 'https://www.figma.com/file/test'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.metadata.mode).toBe('real_agent');

    // Verify runAgent was called with correct parameters
    expect(runAgent).toHaveBeenCalledWith({
      topic: 'Создать промо письмо для отпуска в Париже',
      destination: 'Париж',
      origin: 'Москва',
      options: {
        use_real_apis: true,
        mock_mode: false,
        use_ultrathink: true,
        ultrathink_mode: 'debug'
      }
    });
  });

  it('handles missing required parameters', async () => {
    const mockRequest = {
      json: async () => ({
        // Missing briefText and old format parameters
        destination: 'Париж'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.status).toBe('error');
    expect(result.error_message).toContain('Missing required parameters');
  });

  it('supports legacy format with topic/destination/origin', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: true,
      data: { test: 'data' },
      apis_used: []
    });

    const mockRequest = {
      json: async () => ({
        topic: 'Paris vacation email',
        destination: 'Париж',
        origin: 'Москва'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe('success');

    expect(runAgent).toHaveBeenCalledWith({
      topic: 'Paris vacation email',
      destination: 'Париж',
      origin: 'Москва',
      options: {
        use_real_apis: true,
        mock_mode: false,
        use_ultrathink: true,
        ultrathink_mode: 'debug'
      }
    });
  });

  it('handles agent execution failure', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: false,
      error: 'OpenAI API rate limit exceeded'
    });

    const mockRequest = {
      json: async () => ({
        briefText: 'Test brief',
        destination: 'Test',
        origin: 'Test'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.status).toBe('error');
    expect(result.error_message).toBe('OpenAI API rate limit exceeded');
  });

  it('handles unexpected errors gracefully', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockRejectedValue(new Error('Unexpected error occurred'));

    const mockRequest = {
      json: async () => ({
        briefText: 'Test brief',
        destination: 'Test',
        origin: 'Test'
      })
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.status).toBe('error');
    expect(result.error_message).toBe('Unexpected error occurred');
    expect(result.note).toBe('Real agent execution failed');

    expect(consoleSpy).toHaveBeenCalledWith('❌ Real Agent run error:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('includes generation time in response', async () => {
    const { runAgent } = require('@/agent/agent');
    
    // Mock a slow agent execution
    runAgent.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: { test: 'data' },
          apis_used: ['openai']
        }), 100)
      )
    );

    const mockRequest = {
      json: async () => ({
        briefText: 'Test brief',
        destination: 'Test',
        origin: 'Test'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.metadata.generation_time).toBeGreaterThan(50); // Should be > 50ms
    expect(result.metadata.mode).toBe('real_agent');
    expect(result.metadata.apis_used).toEqual(['openai']);
  });

  it('validates request body parsing errors', async () => {
    const mockRequest = {
      json: async () => {
        throw new Error('Invalid JSON');
      }
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.status).toBe('error');
    expect(result.error_message).toBe('Invalid JSON');

    consoleSpy.mockRestore();
  });

  it('sets default values for missing destination/origin in new format', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: true,
      data: { test: 'data' },
      apis_used: []
    });

    const mockRequest = {
      json: async () => ({
        briefText: 'Test brief'
        // Missing destination and origin
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    await POST(mockRequest as any);

    // Should use default values
    expect(runAgent).toHaveBeenCalledWith({
      topic: 'Test brief',
      destination: 'Париж', // Default
      origin: 'Москва', // Default
      options: {
        use_real_apis: true,
        mock_mode: false,
        use_ultrathink: true,
        ultrathink_mode: 'debug'
      }
    });
  });

  it('validates response format matches frontend expectations', async () => {
    const { runAgent } = require('@/agent/agent');
    const mockAgentData = {
      subject: 'Путешествие в Париж',
      content: 'Откройте для себя красоту Парижа',
      html_content: '<html><body><h1>Paris Travel</h1></body></html>',
      metadata: {
        agents_used: ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'],
        processing_time: 12500,
        quality_score: 95
      }
    };

    runAgent.mockResolvedValue({
      success: true,
      data: mockAgentData,
      apis_used: ['openai', 'figma']
    });

    const mockRequest = {
      json: async () => ({
        briefText: 'Create Paris travel email',
        destination: 'Париж',
        origin: 'Москва'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    // Validate response structure matches frontend GenerationResult interface
    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('metadata');

    expect(result.data).toEqual(mockAgentData);
    expect(result.metadata).toHaveProperty('generation_time');
    expect(result.metadata).toHaveProperty('mode', 'real_agent');
    expect(result.metadata).toHaveProperty('apis_used', ['openai', 'figma']);

    // Data should contain expected fields
    expect(result.data.subject).toBe('Путешествие в Париж');
    expect(result.data.html_content).toContain('<html>');
    expect(result.data.metadata.agents_used).toHaveLength(4);
  });

  it('handles large request payloads', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: true,
      data: { test: 'data' },
      apis_used: []
    });

    // Create a large brief text (10KB)
    const largeBrief = 'Test brief content. '.repeat(500);

    const mockRequest = {
      json: async () => ({
        briefText: largeBrief,
        destination: 'Париж',
        origin: 'Москва',
        tone: 'professional',
        language: 'ru'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    const response = await POST(mockRequest as any);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe('success');

    // Verify large brief was passed correctly
    expect(runAgent).toHaveBeenCalledWith({
      topic: largeBrief,
      destination: 'Париж',
      origin: 'Москва',
      options: {
        use_real_apis: true,
        mock_mode: false,
        use_ultrathink: true,
        ultrathink_mode: 'debug'
      }
    });
  });

  it('validates agent options are set correctly', async () => {
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: true,
      data: { test: 'data' },
      apis_used: []
    });

    const mockRequest = {
      json: async () => ({
        briefText: 'Test brief',
        destination: 'Test',
        origin: 'Test'
      })
    };

    const { POST } = await import('@/app/api/agent/run/route');
    await POST(mockRequest as any);

    // Verify agent options are configured for production use
    const calledOptions = runAgent.mock.calls[0][0].options;
    expect(calledOptions.use_real_apis).toBe(true);
    expect(calledOptions.mock_mode).toBe(false);
    expect(calledOptions.use_ultrathink).toBe(true);
    expect(calledOptions.ultrathink_mode).toBe('debug');
  });
});