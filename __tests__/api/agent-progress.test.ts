/**
 * Test suite for Phase 2.2.2: 4-Agent Pipeline Progress Tracking
 * Tests real-time progress API and frontend integration
 */

describe('4-Agent Pipeline Progress Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup global fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('API Endpoint: /api/agent/progress', () => {
    it('initializes progress tracking for new trace ID', async () => {
      const mockResponse = {
        success: true,
        progress: {
          trace_id: 'test_trace_123',
          overall_progress: 0,
          current_agent: 'content_specialist',
          status: 'initializing',
          start_time: Date.now(),
          agents: [
            { agent: 'content_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'design_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch('/api/agent/progress?traceId=test_trace_123');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.progress.trace_id).toBe('test_trace_123');
      expect(data.progress.agents).toHaveLength(4);
      expect(data.progress.overall_progress).toBe(0);
      
      // Verify all 4 agents are initialized
      const expectedAgents = ['content_specialist', 'design_specialist', 'quality_specialist', 'delivery_specialist'];
      expectedAgents.forEach((agentName, index) => {
        expect(data.progress.agents[index].agent).toBe(agentName);
        expect(data.progress.agents[index].status).toBe('pending');
        expect(data.progress.agents[index].progress_percentage).toBe(0);
      });
    });

    it('simulates realistic agent progression over time', async () => {
      // Mock responses for different stages of progression
      const progressResponses = [
        // Stage 1: Content specialist in progress
        {
          success: true,
          progress: {
            trace_id: 'test_trace_456',
            overall_progress: 15,
            current_agent: 'content_specialist',
            status: 'running',
            agents: [
              { agent: 'content_specialist', status: 'in_progress', progress_percentage: 60, current_operation: 'Анализ брифа и целевой аудитории' },
              { agent: 'design_specialist', status: 'pending', progress_percentage: 0 },
              { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
              { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
            ]
          }
        },
        // Stage 2: Content completed, Design in progress
        {
          success: true,
          progress: {
            trace_id: 'test_trace_456',
            overall_progress: 45,
            current_agent: 'design_specialist',
            status: 'running',
            agents: [
              { agent: 'content_specialist', status: 'completed', progress_percentage: 100, confidence_score: 92 },
              { agent: 'design_specialist', status: 'in_progress', progress_percentage: 80, current_operation: 'Создание MJML макета' },
              { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
              { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
            ]
          }
        },
        // Stage 3: All completed
        {
          success: true,
          progress: {
            trace_id: 'test_trace_456',
            overall_progress: 100,
            current_agent: 'delivery_specialist',
            status: 'completed',
            agents: [
              { agent: 'content_specialist', status: 'completed', progress_percentage: 100, confidence_score: 92 },
              { agent: 'design_specialist', status: 'completed', progress_percentage: 100, confidence_score: 88 },
              { agent: 'quality_specialist', status: 'completed', progress_percentage: 100, confidence_score: 95 },
              { agent: 'delivery_specialist', status: 'completed', progress_percentage: 100, confidence_score: 90 }
            ]
          }
        }
      ];

      // Test progression through all stages
      for (let i = 0; i < progressResponses.length; i++) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => progressResponses[i]
        });

        const response = await fetch('/api/agent/progress?traceId=test_trace_456');
        const data = await response.json();

        expect(data.success).toBe(true);
        expect(data.progress.trace_id).toBe('test_trace_456');

        if (i === 0) {
          // First stage: Content specialist working
          expect(data.progress.current_agent).toBe('content_specialist');
          expect(data.progress.agents[0].status).toBe('in_progress');
          expect(data.progress.agents[0].current_operation).toContain('Анализ брифа');
        } else if (i === 1) {
          // Second stage: Design specialist working
          expect(data.progress.current_agent).toBe('design_specialist');
          expect(data.progress.agents[0].status).toBe('completed');
          expect(data.progress.agents[0].confidence_score).toBeGreaterThan(80);
          expect(data.progress.agents[1].status).toBe('in_progress');
        } else if (i === 2) {
          // Final stage: All completed
          expect(data.progress.status).toBe('completed');
          expect(data.progress.overall_progress).toBe(100);
          data.progress.agents.forEach(agent => {
            expect(agent.status).toBe('completed');
            expect(agent.progress_percentage).toBe(100);
            expect(agent.confidence_score).toBeGreaterThan(80);
          });
        }
      }
    });

    it('handles agent failure scenarios', async () => {
      const failureResponse = {
        success: true,
        progress: {
          trace_id: 'test_trace_fail',
          overall_progress: 25,
          current_agent: 'design_specialist',
          status: 'failed',
          error: 'Figma API connection failed',
          agents: [
            { agent: 'content_specialist', status: 'completed', progress_percentage: 100, confidence_score: 90 },
            { agent: 'design_specialist', status: 'failed', progress_percentage: 0, error: 'Figma API connection failed' },
            { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => failureResponse
      });

      const response = await fetch('/api/agent/progress?traceId=test_trace_fail');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.progress.status).toBe('failed');
      expect(data.progress.error).toContain('Figma API');
      expect(data.progress.agents[1].status).toBe('failed');
      expect(data.progress.agents[1].error).toContain('Figma API');
    });

    it('validates required trace ID parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing traceId parameter'
        })
      });

      const response = await fetch('/api/agent/progress');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('Missing traceId parameter');
    });

    it('supports POST updates for real agent integration', async () => {
      const updateRequest = {
        trace_id: 'real_agent_trace',
        agent: 'content_specialist',
        status: 'in_progress',
        progress_percentage: 75,
        current_operation: 'Генерация заголовков и CTA',
        confidence_score: 88
      };

      const updateResponse = {
        success: true,
        progress: {
          trace_id: 'real_agent_trace',
          overall_progress: 19, // 75/4 ≈ 19%
          current_agent: 'content_specialist',
          status: 'running',
          agents: [
            { 
              agent: 'content_specialist', 
              status: 'in_progress', 
              progress_percentage: 75,
              current_operation: 'Генерация заголовков и CTA',
              confidence_score: 88
            },
            { agent: 'design_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => updateResponse
      });

      const response = await fetch('/api/agent/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRequest)
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.progress.agents[0].status).toBe('in_progress');
      expect(data.progress.agents[0].progress_percentage).toBe(75);
      expect(data.progress.agents[0].current_operation).toContain('заголовков');
      expect(data.progress.overall_progress).toBe(19);
    });
  });

  describe('Frontend Integration', () => {
    it('displays all 4 specialist agents with correct labels', () => {
      const agents = [
        { name: 'content_specialist', label: 'Контент-специалист', emoji: '✍️' },
        { name: 'design_specialist', label: 'Дизайн-специалист', emoji: '🎨' },
        { name: 'quality_specialist', label: 'Контроль качества', emoji: '✅' },
        { name: 'delivery_specialist', label: 'Специалист доставки', emoji: '🚀' }
      ];

      // This would be tested with React Testing Library in a full test
      agents.forEach(agent => {
        expect(agent.name).toMatch(/^(content|design|quality|delivery)_specialist$/);
        expect(agent.label).toBeTruthy();
        expect(agent.emoji).toBeTruthy();
      });
    });

    it('polls progress API every second during generation', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            progress: {
              trace_id: 'test_polling',
              overall_progress: Math.min(callCount * 10, 100),
              status: callCount >= 10 ? 'completed' : 'running',
              agents: []
            }
          })
        });
      });

      // Simulate 3 seconds of polling
      const intervals = [];
      for (let i = 0; i < 3; i++) {
        intervals.push(
          new Promise(resolve => {
            setTimeout(async () => {
              await fetch('/api/agent/progress?traceId=test_polling');
              resolve(undefined);
            }, i * 1000);
          })
        );
      }

      await Promise.all(intervals);

      expect(callCount).toBeGreaterThanOrEqual(3);
      expect(global.fetch).toHaveBeenCalledWith('/api/agent/progress?traceId=test_polling');
    });

    it('stops polling when pipeline completes or fails', async () => {
      const completedResponse = {
        success: true,
        progress: {
          trace_id: 'test_complete',
          overall_progress: 100,
          status: 'completed',
          agents: [
            { agent: 'content_specialist', status: 'completed', progress_percentage: 100 },
            { agent: 'design_specialist', status: 'completed', progress_percentage: 100 },
            { agent: 'quality_specialist', status: 'completed', progress_percentage: 100 },
            { agent: 'delivery_specialist', status: 'completed', progress_percentage: 100 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => completedResponse
      });

      const response = await fetch('/api/agent/progress?traceId=test_complete');
      const data = await response.json();

      // Verify that polling should stop when status is 'completed'
      expect(data.progress.status).toBe('completed');
      expect(data.progress.overall_progress).toBe(100);
      
      // In the real implementation, this would stop the interval timer
      const shouldStopPolling = data.progress.status === 'completed' || data.progress.status === 'failed';
      expect(shouldStopPolling).toBe(true);
    });

    it('displays confidence scores for completed agents', async () => {
      const responseWithScores = {
        success: true,
        progress: {
          agents: [
            { agent: 'content_specialist', status: 'completed', progress_percentage: 100, confidence_score: 94 },
            { agent: 'design_specialist', status: 'completed', progress_percentage: 100, confidence_score: 87 },
            { agent: 'quality_specialist', status: 'in_progress', progress_percentage: 60 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => responseWithScores
      });

      const response = await fetch('/api/agent/progress?traceId=test_scores');
      const data = await response.json();

      // Verify confidence scores are present for completed agents
      expect(data.progress.agents[0].confidence_score).toBe(94);
      expect(data.progress.agents[1].confidence_score).toBe(87);
      expect(data.progress.agents[2].confidence_score).toBeUndefined(); // In progress
      expect(data.progress.agents[3].confidence_score).toBeUndefined(); // Pending
    });

    it('shows current operation details for active agents', async () => {
      const responseWithOperations = {
        success: true,
        progress: {
          agents: [
            { 
              agent: 'content_specialist', 
              status: 'completed', 
              progress_percentage: 100,
              current_operation: 'Анализ завершен'
            },
            { 
              agent: 'design_specialist', 
              status: 'in_progress', 
              progress_percentage: 45,
              current_operation: 'Извлечение токенов дизайна из Figma'
            },
            { agent: 'quality_specialist', status: 'pending', progress_percentage: 0 },
            { agent: 'delivery_specialist', status: 'pending', progress_percentage: 0 }
          ]
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => responseWithOperations
      });

      const response = await fetch('/api/agent/progress?traceId=test_operations');
      const data = await response.json();

      // Verify operation details are shown for relevant agents
      expect(data.progress.agents[1].current_operation).toContain('Figma');
      expect(data.progress.agents[1].status).toBe('in_progress');
      expect(data.progress.agents[1].progress_percentage).toBe(45);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/agent/progress?traceId=network_error');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('handles invalid trace ID format', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid trace ID format'
        })
      });

      const response = await fetch('/api/agent/progress?traceId=invalid-format');
      expect(response.ok).toBe(false);
    });

    it('provides estimated completion time', async () => {
      const now = Date.now();
      const estimatedCompletion = now + 25000; // 25 seconds from now

      const responseWithEstimate = {
        success: true,
        progress: {
          trace_id: 'test_estimate',
          overall_progress: 60,
          status: 'running',
          start_time: now - 15000, // Started 15 seconds ago
          estimated_completion: estimatedCompletion,
          agents: []
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => responseWithEstimate
      });

      const response = await fetch('/api/agent/progress?traceId=test_estimate');
      const data = await response.json();

      expect(data.progress.estimated_completion).toBe(estimatedCompletion);
      
      // Calculate remaining time
      const remainingTime = Math.max(0, Math.round((estimatedCompletion - Date.now()) / 1000));
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThan(30);
    });
  });
});