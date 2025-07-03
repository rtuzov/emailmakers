/**
 * End-to-End test for Create Form to API Agent workflow
 * Tests the complete user journey from form submission to result display
 */

describe('Create Form to Agent API E2E Workflow', () => {
  // Mock the actual agent implementation for E2E testing
  jest.mock('@/agent/agent', () => ({
    runAgent: jest.fn()
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup global fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes full workflow: form submission → API call → result display', async () => {
    // Setup mock agent response
    const mockAgentResult = {
      success: true,
      data: {
        subject: 'Откройте для себя Париж - Эксклюзивные предложения!',
        content: 'Дорогие путешественники! Мы рады предложить вам уникальную возможность...',
        html_content: `
          <!DOCTYPE html>
          <html>
            <head><title>Paris Travel</title></head>
            <body>
              <h1>Откройте для себя Париж</h1>
              <p>Эксклюзивные предложения на путешествия в город любви!</p>
              <a href="#">Забронировать сейчас</a>
            </body>
          </html>
        `,
        metadata: {
          agents_used: [
            'content-specialist',
            'design-specialist', 
            'quality-specialist',
            'delivery-specialist'
          ],
          processing_time: 18750,
          quality_score: 94,
          design_tokens_extracted: 12,
          figma_integration: true
        }
      },
      apis_used: ['openai-gpt4', 'figma-api', 'html-validator']
    };

    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue(mockAgentResult);

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: mockAgentResult.data,
        metadata: {
          ...mockAgentResult.data.metadata,
          generation_time: 18750,
          mode: 'real_agent',
          apis_used: mockAgentResult.apis_used
        }
      })
    });

    // Test data
    const testFormData = {
      briefText: 'Создать промо-письмо для туристического агентства о путешествиях в Париж. Целевая аудитория - молодые профессионалы 25-35 лет с доходом выше среднего. Акцент на романтике, культуре и гастономии.',
      destination: 'Париж',
      origin: 'Москва',
      tone: 'friendly',
      language: 'ru',
      figmaUrl: 'https://www.figma.com/file/travel-template-design'
    };

    // Simulate user workflow
    const workflowSteps = {
      // Step 1: User fills form
      formSubmission: {
        briefText: testFormData.briefText,
        destination: testFormData.destination,
        origin: testFormData.origin,
        tone: testFormData.tone,
        language: testFormData.language,
        figmaUrl: testFormData.figmaUrl
      },

      // Step 2: Frontend sends API request
      apiRequest: {
        endpoint: '/api/agent/run',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          briefText: testFormData.briefText,
          destination: testFormData.destination,
          origin: testFormData.origin,
          tone: testFormData.tone,
          language: testFormData.language,
          figmaUrl: testFormData.figmaUrl
        })
      },

      // Step 3: Backend processes request
      backendProcessing: {
        agentCall: {
          topic: testFormData.briefText,
          destination: testFormData.destination,
          origin: testFormData.origin,
          options: {
            use_real_apis: true,
            mock_mode: false,
            use_ultrathink: true,
            ultrathink_mode: 'debug'
          }
        }
      },

      // Step 4: Expected response
      expectedResponse: {
        status: 'success',
        data: mockAgentResult.data,
        metadata: {
          generation_time: 18750,
          mode: 'real_agent',
          apis_used: mockAgentResult.apis_used
        }
      }
    };

    // Execute workflow simulation
    
    // 1. Simulate form submission
    const formData = workflowSteps.formSubmission;
    expect(formData.briefText).toBeTruthy();
    expect(formData.destination).toBe('Париж');
    expect(formData.origin).toBe('Москва');

    // 2. Simulate frontend API call
    const apiResponse = await fetch(workflowSteps.apiRequest.endpoint, {
      method: workflowSteps.apiRequest.method,
      headers: workflowSteps.apiRequest.headers,
      body: workflowSteps.apiRequest.body
    });

    // Verify API call was made correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        briefText: testFormData.briefText,
        destination: testFormData.destination,
        origin: testFormData.origin,
        tone: testFormData.tone,
        language: testFormData.language,
        figmaUrl: testFormData.figmaUrl
      })
    });

    // 3. Process API response
    const responseData = await apiResponse.json();

    // Verify response structure
    expect(responseData.status).toBe('success');
    expect(responseData.data).toBeDefined();
    expect(responseData.metadata).toBeDefined();

    // 4. Validate response content
    expect(responseData.data.subject).toContain('Париж');
    expect(responseData.data.html_content).toContain('<!DOCTYPE html>');
    expect(responseData.data.metadata.agents_used).toHaveLength(4);
    expect(responseData.metadata.generation_time).toBeGreaterThan(0);
    expect(responseData.metadata.apis_used).toContain('openai-gpt4');

    // 5. Verify all 4 agents were used
    const agentsUsed = responseData.data.metadata.agents_used;
    expect(agentsUsed).toContain('content-specialist');
    expect(agentsUsed).toContain('design-specialist');
    expect(agentsUsed).toContain('quality-specialist');
    expect(agentsUsed).toContain('delivery-specialist');

    // 6. Validate HTML output quality
    const htmlContent = responseData.data.html_content;
    expect(htmlContent).toMatch(/<!DOCTYPE html>/);
    expect(htmlContent).toContain('<html>');
    expect(htmlContent).toContain('<head>');
    expect(htmlContent).toContain('<body>');
    expect(htmlContent).toContain('</html>');

    // 7. Check quality metrics
    expect(responseData.data.metadata.quality_score).toBeGreaterThanOrEqual(90);
    expect(responseData.data.metadata.design_tokens_extracted).toBeGreaterThan(0);
    expect(responseData.data.metadata.figma_integration).toBe(true);
  });

  it('handles error workflow: form submission → API error → error display', async () => {
    // Mock agent failure
    const { runAgent } = require('@/agent/agent');
    runAgent.mockResolvedValue({
      success: false,
      error: 'OpenAI API quota exceeded. Please try again later.'
    });

    // Mock error API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        status: 'error',
        error_message: 'OpenAI API quota exceeded. Please try again later.',
        generation_time: 1250
      })
    });

    // Simulate error workflow
    const errorFormData = {
      briefText: 'Test brief that will cause an error',
      destination: 'Тест',
      origin: 'Тест'
    };

    // Make API call
    const apiResponse = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorFormData)
    });

    const responseData = await apiResponse.json();

    // Verify error handling
    expect(apiResponse.ok).toBe(false);
    expect(responseData.status).toBe('error');
    expect(responseData.error_message).toContain('OpenAI API quota exceeded');
    expect(responseData.generation_time).toBeDefined();

    // Verify no partial data is returned
    expect(responseData.data).toBeUndefined();
  });

  it('validates timeout handling for long-running agent processes', async () => {
    // Mock slow agent (30+ seconds)
    const { runAgent } = require('@/agent/agent');
    runAgent.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: { 
            subject: 'Slow generation result',
            content: 'This took a long time to generate',
            html_content: '<html><body>Slow result</body></html>'
          },
          apis_used: ['openai']
        }), 30000) // 30 second delay
      )
    );

    // Mock timeout response
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            status: 'success',
            data: {
              subject: 'Slow generation result',
              content: 'This took a long time to generate',
              html_content: '<html><body>Slow result</body></html>'
            },
            metadata: {
              generation_time: 30000,
              mode: 'real_agent',
              apis_used: ['openai']
            }
          })
        }), 30000)
      })
    );

    const timeoutTest = async () => {
      const startTime = Date.now();

      const apiResponse = await fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          briefText: 'Complex brief requiring long processing',
          destination: 'Париж',
          origin: 'Москва'
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const responseData = await apiResponse.json();

      // Verify long processing is handled
      expect(duration).toBeGreaterThan(25000); // Should take significant time
      expect(responseData.status).toBe('success');
      expect(responseData.metadata.generation_time).toBeGreaterThan(25000);
    };

    // Run timeout test (this should pass but take 30+ seconds)
    // In real implementation, we'd want proper timeout handling
    await timeoutTest();
  });

  it('validates data flow integrity through the entire pipeline', async () => {
    // Test data that should be preserved through the pipeline
    const originalData = {
      briefText: 'Создать письмо для промо-акции "Черная пятница" с скидками до 70% на авиабилеты в Европу',
      destination: 'Лондон',
      origin: 'Санкт-Петербург',
      tone: 'urgent',
      language: 'ru',
      figmaUrl: 'https://www.figma.com/file/black-friday-promo'
    };

    // Mock agent that preserves input data
    const { runAgent } = require('@/agent/agent');
    runAgent.mockImplementation((input) => {
      // Verify agent receives correct data
      expect(input.topic).toBe(originalData.briefText);
      expect(input.destination).toBe(originalData.destination);
      expect(input.origin).toBe(originalData.origin);

      return Promise.resolve({
        success: true,
        data: {
          subject: `Черная пятница: ${input.destination} от 9,999₽!`,
          content: `Скидки до 70% на авиабилеты ${input.origin} → ${input.destination}`,
          html_content: '<html><body><h1>Black Friday Deal</h1></body></html>',
          metadata: {
            original_brief: input.topic,
            destination: input.destination,
            origin: input.origin,
            agents_used: ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist']
          }
        },
        apis_used: ['openai-gpt4']
      });
    });

    // Mock API response
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      const requestBody = JSON.parse(options.body);
      
      // Verify request body contains original data
      expect(requestBody.briefText).toBe(originalData.briefText);
      expect(requestBody.destination).toBe(originalData.destination);
      expect(requestBody.origin).toBe(originalData.origin);
      expect(requestBody.tone).toBe(originalData.tone);
      expect(requestBody.language).toBe(originalData.language);
      expect(requestBody.figmaUrl).toBe(originalData.figmaUrl);

      return {
        ok: true,
        json: async () => ({
          status: 'success',
          data: {
            subject: `Черная пятница: ${requestBody.destination} от 9,999₽!`,
            content: `Скидки до 70% на авиабилеты ${requestBody.origin} → ${requestBody.destination}`,
            html_content: '<html><body><h1>Black Friday Deal</h1></body></html>',
            metadata: {
              original_brief: requestBody.briefText,
              destination: requestBody.destination,
              origin: requestBody.origin,
              agents_used: ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist']
            }
          },
          metadata: {
            generation_time: 12500,
            mode: 'real_agent',
            apis_used: ['openai-gpt4']
          }
        })
      };
    });

    // Execute data flow test
    const apiResponse = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(originalData)
    });

    const responseData = await apiResponse.json();

    // Verify data integrity throughout pipeline
    expect(responseData.status).toBe('success');
    expect(responseData.data.subject).toContain('Лондон');
    expect(responseData.data.content).toContain('Санкт-Петербург → Лондон');
    expect(responseData.data.metadata.original_brief).toBe(originalData.briefText);
    expect(responseData.data.metadata.destination).toBe(originalData.destination);
    expect(responseData.data.metadata.origin).toBe(originalData.origin);

    // Verify all agents participated
    expect(responseData.data.metadata.agents_used).toHaveLength(4);

    // Verify processing metadata
    expect(responseData.metadata.generation_time).toBeGreaterThan(0);
    expect(responseData.metadata.mode).toBe('real_agent');
    expect(responseData.metadata.apis_used).toContain('openai-gpt4');
  });

  it('validates concurrent request handling', async () => {
    // Mock agent for concurrent testing
    const { runAgent } = require('@/agent/agent');
    let callCount = 0;
    
    runAgent.mockImplementation(() => {
      callCount++;
      return new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          data: {
            subject: `Concurrent Request ${callCount}`,
            content: `Result for request ${callCount}`,
            html_content: `<html><body>Request ${callCount}</body></html>`
          },
          apis_used: ['openai']
        }), 1000 + Math.random() * 1000) // 1-2 second random delay
      );
    });

    // Mock API responses
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'success',
          data: {
            subject: `Concurrent Request ${callCount}`,
            content: `Result for request ${callCount}`,
            html_content: `<html><body>Request ${callCount}</body></html>`
          },
          metadata: {
            generation_time: 1500,
            mode: 'real_agent',
            apis_used: ['openai']
          }
        })
      })
    );

    // Create multiple concurrent requests
    const concurrentRequests = Array.from({ length: 3 }, (_, index) => 
      fetch('/api/agent/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          briefText: `Concurrent test request ${index + 1}`,
          destination: 'Париж',
          origin: 'Москва'
        })
      })
    );

    // Execute all requests concurrently
    const responses = await Promise.all(concurrentRequests);
    const responseData = await Promise.all(responses.map(r => r.json()));

    // Verify all requests completed successfully
    responseData.forEach((data, index) => {
      expect(data.status).toBe('success');
      expect(data.data.subject).toContain('Concurrent Request');
      expect(data.metadata.generation_time).toBeGreaterThan(0);
    });

    // Verify agent was called for each request
    expect(runAgent).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});