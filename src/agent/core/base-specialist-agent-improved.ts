/**
 * IMPROVED Base Specialist Agent with Type-Safe Handoffs
 * Uses Agent.create() for proper type inference and handoff management
 * Based on OpenAI Agents SDK v2 best practices
 */

import { Agent, AgentOptions } from '@openai/agents';
import { generateTraceId, addTraceContext } from '../utils/tracing-utils';
import { ToolRegistry } from './tool-registry';
import { PromptManager } from './prompt-manager';

export interface BaseSpecialistAgentConfig {
  name: string;
  type: 'content' | 'design' | 'quality' | 'delivery';
  instructions: string;
  handoffDescription: string;
  tools: any[];
  handoffs?: Agent[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class BaseSpecialistAgentImproved {
  private agent: Agent;
  private config: BaseSpecialistAgentConfig;
  private toolRegistry: ToolRegistry;
  private promptManager: PromptManager;

  constructor(config: BaseSpecialistAgentConfig) {
    this.config = config;
    this.toolRegistry = ToolRegistry.getInstance();
    this.promptManager = PromptManager.getInstance();
    
    // Create agent using Agent.create() for type safety
    this.agent = this.createTypeSafeAgent();
  }

  private createTypeSafeAgent(): Agent {
    const agentOptions: AgentOptions = {
      name: this.config.name,
      instructions: this.config.instructions,
      handoffDescription: this.config.handoffDescription,
      tools: this.config.tools,
      handoffs: this.config.handoffs || [],
      model: this.config.model || 'gpt-4o-mini'
    };

    return new Agent(agentOptions);
  }

  /**
   * Execute agent with proper tracing and handoff management
   */
  async execute(input: any, options: {
    threadId?: string;
    parentTraceId?: string;
    context?: any;
  } = {}): Promise<any> {
    const traceId = options.parentTraceId || generateTraceId();
    
    try {
      // Add trace context
      addTraceContext(traceId, {
        agent: this.config.name,
        type: this.config.type,
        input: input,
        timestamp: new Date().toISOString()
      });

      // Execute with proper input format
      const inputString = typeof input === 'string' ? input : JSON.stringify(input);
      const result = await this.agent.run(inputString);

      // Log successful execution
      addTraceContext(traceId, {
        status: 'success',
        result: result,
        completedAt: new Date().toISOString()
      });

      return result;
    } catch (error) {
      // Log error with trace context
      addTraceContext(traceId, {
        status: 'error',
        error: error.message,
        stack: error.stack,
        failedAt: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Add handoff to this agent
   */
  addHandoff(agent: Agent): void {
    if (!this.config.handoffs) {
      this.config.handoffs = [];
    }
    this.config.handoffs.push(agent);
    
    // Recreate agent with new handoffs
    this.agent = this.createTypeSafeAgent();
  }

  /**
   * Get agent instance for use in handoffs
   */
  getAgent(): Agent {
    return this.agent;
  }

  /**
   * Get agent configuration
   */
  getConfig(): BaseSpecialistAgentConfig {
    return this.config;
  }

  /**
   * Update agent instructions
   */
  updateInstructions(instructions: string): void {
    this.config.instructions = instructions;
    this.agent = this.createTypeSafeAgent();
  }

  /**
   * Get agent name for handoff descriptions
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get agent type
   */
  getType(): string {
    return this.config.type;
  }

  /**
   * Test handoff capability
   */
  async testHandoff(targetAgent: Agent, testInput: any): Promise<boolean> {
    try {
      const result = await this.execute(testInput);
      return result !== null && result !== undefined;
    } catch (error) {
      console.error(`Handoff test failed for ${this.config.name}:`, error);
      return false;
    }
  }
}

export default BaseSpecialistAgentImproved; 