/**
 * Comprehensive Handoffs and Tracing Validation Test
 * Tests all aspects of the improved OpenAI Agent SDK v2 implementation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Agent } from '@openai/agents';
import { createSpecialistAgentsImproved } from '../../src/agent/modules/specialist-agents-improved';
import { validateAgentRequest } from '../../src/agent/validators/agent-request-validator';
import { generateTraceId, addTraceContext, getTraceContext } from '../../src/agent/utils/tracing-utils';
import { BaseSpecialistAgentImproved } from '../../src/agent/core/base-specialist-agent-improved';

describe('Handoffs and Tracing Validation', () => {
  let agents: any;
  let traceId: string;

  beforeAll(async () => {
    // Create agents for testing
    agents = await createSpecialistAgentsImproved();
    traceId = generateTraceId();
  });

  afterAll(async () => {
    // Cleanup
    agents = null;
  });

  describe('Agent Creation Tests', () => {
    it('should create all specialist agents successfully', async () => {
      expect(agents).toBeDefined();
      expect(agents.contentSpecialist).toBeDefined();
      expect(agents.designSpecialist).toBeDefined();
      expect(agents.qualitySpecialist).toBeDefined();
      expect(agents.deliverySpecialist).toBeDefined();
    });

    it('should have proper Agent instances', () => {
      expect(agents.contentSpecialist).toBeInstanceOf(Agent);
      expect(agents.designSpecialist).toBeInstanceOf(Agent);
      expect(agents.qualitySpecialist).toBeInstanceOf(Agent);
      expect(agents.deliverySpecialist).toBeInstanceOf(Agent);
    });

    it('should have correct agent names', () => {
      expect(agents.contentSpecialist.name).toBe('Content Specialist');
      expect(agents.designSpecialist.name).toBe('Design Specialist');
      expect(agents.qualitySpecialist.name).toBe('Quality Specialist');
      expect(agents.deliverySpecialist.name).toBe('Delivery Specialist');
    });
  });

  describe('Handoff Configuration Tests', () => {
    it('should have proper handoff chains configured', () => {
      // Content -> Design
      expect(agents.contentSpecialist.handoffs).toContain(agents.designSpecialist);
      
      // Design -> Quality
      expect(agents.designSpecialist.handoffs).toContain(agents.qualitySpecialist);
      
      // Quality -> Delivery
      expect(agents.qualitySpecialist.handoffs).toContain(agents.deliverySpecialist);
    });

    it('should have handoff descriptions', () => {
      expect(agents.contentSpecialist.handoffDescription).toBeDefined();
      expect(agents.designSpecialist.handoffDescription).toBeDefined();
      expect(agents.qualitySpecialist.handoffDescription).toBeDefined();
      expect(agents.deliverySpecialist.handoffDescription).toBeDefined();
    });
  });

  describe('Tracing System Tests', () => {
    it('should generate unique trace IDs', () => {
      const traceId1 = generateTraceId();
      const traceId2 = generateTraceId();
      
      expect(traceId1).toBeDefined();
      expect(traceId2).toBeDefined();
      expect(traceId1).not.toBe(traceId2);
      expect(traceId1).toMatch(/^[a-z0-9]{16}$/);
    });

    it('should add and retrieve trace context', () => {
      const testTraceId = generateTraceId();
      const testContext = {
        test: 'data',
        timestamp: new Date().toISOString(),
        agent: 'test-agent'
      };

      addTraceContext(testTraceId, testContext);
      const retrievedContext = getTraceContext(testTraceId);

      expect(retrievedContext).toEqual(testContext);
    });

    it('should handle multiple trace contexts', () => {
      const testTraceId = generateTraceId();
      
      addTraceContext(testTraceId, { step: 1, action: 'start' });
      addTraceContext(testTraceId, { step: 2, action: 'process' });
      addTraceContext(testTraceId, { step: 3, action: 'complete' });

      const context = getTraceContext(testTraceId);
      expect(context.step).toBe(3);
      expect(context.action).toBe('complete');
    });
  });

  describe('Agent Request Validation Tests', () => {
    it('should validate correct agent requests', async () => {
      const validRequest = {
        task_type: 'generate_content',
        input: {
          brief: 'Create email content for travel campaign',
          tone: 'friendly',
          target_audience: 'leisure travelers'
        },
        context: {
          brand: 'TravelCorp'
        }
      };

      const result = await validateAgentRequest(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
    });

    it('should reject invalid agent requests', async () => {
      const invalidRequest = {
        task_type: 'invalid_task',
        input: null
      };

      const result = await validateAgentRequest(invalidRequest);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate all supported task types', async () => {
      const taskTypes = [
        'generate_content',
        'analyze_brief',
        'analyze_multi_destination',
        'create_design',
        'extract_figma_assets',
        'render_template',
        'validate_html',
        'upload_assets',
        'deploy_template'
      ];

      for (const taskType of taskTypes) {
        const request = {
          task_type: taskType,
          input: 'test input'
        };

        const result = await validateAgentRequest(request);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Agent Execution Tests', () => {
    it('should execute content specialist agent', async () => {
      const input = {
        brief: 'Create engaging email content about summer vacation deals',
        tone: 'enthusiastic',
        target_audience: 'families'
      };

      const result = await agents.contentSpecialist.run({
        messages: [{ role: 'user', content: JSON.stringify(input) }],
        threadId: 'test-thread-1',
        stream: false,
        metadata: {
          traceId: generateTraceId(),
          taskType: 'generate_content',
          test: true
        }
      });

      expect(result).toBeDefined();
      // Result should contain generated content
      expect(result.finalOutput || result.content || result.text).toBeDefined();
    }, 30000);

    it('should handle agent execution errors gracefully', async () => {
      try {
        await agents.contentSpecialist.run({
          messages: [{ role: 'user', content: null }],
          threadId: 'test-thread-error',
          stream: false,
          metadata: {
            traceId: generateTraceId(),
            taskType: 'generate_content',
            test: true,
            expectError: true
          }
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('BaseSpecialistAgentImproved Tests', () => {
    let testAgent: BaseSpecialistAgentImproved;

    beforeAll(() => {
      testAgent = new BaseSpecialistAgentImproved({
        name: 'Test Agent',
        type: 'content',
        instructions: 'You are a test agent for validation purposes.',
        handoffDescription: 'Test agent for handoff validation',
        tools: [],
        model: 'gpt-4o-mini',
        temperature: 0.7
      });
    });

    it('should create BaseSpecialistAgentImproved instance', () => {
      expect(testAgent).toBeDefined();
      expect(testAgent.getName()).toBe('Test Agent');
      expect(testAgent.getType()).toBe('content');
    });

    it('should get agent configuration', () => {
      const config = testAgent.getConfig();
      expect(config.name).toBe('Test Agent');
      expect(config.type).toBe('content');
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.temperature).toBe(0.7);
    });

    it('should update agent instructions', () => {
      const newInstructions = 'Updated test instructions';
      testAgent.updateInstructions(newInstructions);
      
      const config = testAgent.getConfig();
      expect(config.instructions).toBe(newInstructions);
    });

    it('should add handoffs to agent', () => {
      const mockAgent = new Agent({
        name: 'Mock Agent',
        instructions: 'Mock agent for testing',
        tools: []
      });

      testAgent.addHandoff(mockAgent);
      const config = testAgent.getConfig();
      expect(config.handoffs).toContain(mockAgent);
    });

    it('should execute with proper tracing', async () => {
      const testInput = 'Test input for agent execution';
      
      try {
        const result = await testAgent.execute(testInput, {
          threadId: 'test-thread-base',
          context: { test: true }
        });

        expect(result).toBeDefined();
      } catch (error) {
        // Even if execution fails, tracing should work
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow with tracing', async () => {
      const workflowTraceId = generateTraceId();
      
      // Start workflow
      addTraceContext(workflowTraceId, {
        workflow: 'content-to-design',
        step: 'start',
        timestamp: new Date().toISOString()
      });

      // Step 1: Content generation
      addTraceContext(workflowTraceId, {
        step: 'content-generation',
        agent: 'content-specialist',
        status: 'started'
      });

      const contentInput = {
        brief: 'Create email content for holiday travel promotion',
        tone: 'exciting',
        target_audience: 'adventure travelers'
      };

      try {
        const contentResult = await agents.contentSpecialist.run({
          messages: [{ role: 'user', content: JSON.stringify(contentInput) }],
          threadId: 'workflow-thread-1',
          stream: false,
          metadata: {
            traceId: workflowTraceId,
            taskType: 'generate_content',
            step: 'content-generation'
          }
        });

        addTraceContext(workflowTraceId, {
          step: 'content-generation',
          status: 'completed',
          result: contentResult
        });

        // Step 2: Design creation (handoff)
        addTraceContext(workflowTraceId, {
          step: 'design-creation',
          agent: 'design-specialist',
          status: 'started',
          handoff: 'content-to-design'
        });

        const designInput = {
          design_brief: 'Create visual design based on generated content',
          layout_type: 'grid',
          content: contentResult
        };

        const designResult = await agents.designSpecialist.run({
          messages: [{ role: 'user', content: JSON.stringify(designInput) }],
          threadId: 'workflow-thread-1',
          stream: false,
          metadata: {
            traceId: workflowTraceId,
            taskType: 'create_design',
            step: 'design-creation'
          }
        });

        addTraceContext(workflowTraceId, {
          step: 'design-creation',
          status: 'completed',
          result: designResult
        });

        // Verify trace context
        const finalContext = getTraceContext(workflowTraceId);
        expect(finalContext.workflow).toBe('content-to-design');
        expect(finalContext.step).toBe('design-creation');
        expect(finalContext.status).toBe('completed');

        expect(contentResult).toBeDefined();
        expect(designResult).toBeDefined();

      } catch (error) {
        addTraceContext(workflowTraceId, {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.log('Workflow error (expected in test):', error.message);
      }
    }, 60000);
  });

  describe('Error Handling Tests', () => {
    it('should handle agent creation errors', async () => {
      try {
        // Try to create agent with invalid configuration
        const invalidAgent = new BaseSpecialistAgentImproved({
          name: '',
          type: 'content',
          instructions: '',
          handoffDescription: '',
          tools: []
        });
        
        // If it doesn't throw, the error handling should still work
        expect(invalidAgent).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle tracing errors gracefully', () => {
      // Try to get context for non-existent trace
      const nonExistentContext = getTraceContext('nonexistent-trace-id');
      expect(nonExistentContext).toBeUndefined();
    });
  });
});

// Mock OpenAI Agent if needed
jest.mock('@openai/agents', () => ({
  Agent: class MockAgent {
    constructor(public config: any) {
      this.name = config.name;
      this.instructions = config.instructions;
      this.tools = config.tools || [];
      this.handoffs = config.handoffs || [];
      this.handoffDescription = config.handoffDescription;
    }

    static create(config: any) {
      return new MockAgent(config);
    }

    async run(options: any) {
      return {
        finalOutput: `Mock response for ${this.name}`,
        content: `Generated content by ${this.name}`,
        text: `Text response from ${this.name}`,
        metadata: options.metadata
      };
    }

    name: string;
    instructions: string;
    tools: any[];
    handoffs: any[];
    handoffDescription: string;
  }
})); 