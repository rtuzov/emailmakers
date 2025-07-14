/**
 * OpenAI Agents SDK Configuration and Integration
 * 
 * Configures OpenAI Agents SDK with proper logging, tracing, and monitoring
 * for the Email-Makers agent system.
 */

import { Agent, run, setTraceProcessors, addTraceProcessor } from '@openai/agents';
import { logger } from './logger';
import { getConfig } from './config';
import { createAgentRunConfig, withSDKTrace } from '../utils/tracing-utils';
import { getAgentModel } from './agent-model-config';

const cfg = getConfig();

/**
 * Custom trace processor for OpenAI Agents SDK
 * Integrates with our existing logging system
 */
class EmailMakersTraceProcessor {
  name = 'email-makers-trace-processor';

  async onTraceStart(trace: any) {
    // Handle trace start
  }

  async onTraceEnd(trace: any) {
    // Handle trace end - main processing logic here
    await this.process(trace);
  }

  async onSpanStart(span: any) {
    // Handle span start
  }

  async onSpanEnd(span: any) {
    // Handle span end
  }

  async onError(error: any) {
    // Handle errors
    logger.error('TracingProcessor error:', error);
  }

  async flush() {
    // Flush any pending data
  }

  async shutdown() {
    // Shutdown the processor
    logger.info('EmailMakersTraceProcessor shutting down');
  }

  async forceFlush() {
    // Force flush any pending data
    await this.flush();
  }

  async process(trace: any) {
    try {
      // Log trace start
      if (trace.type === 'workflow_start') {
        logger.info(`🚀 [OpenAI Agents] Workflow started: ${trace.workflow_name}`, {
          workflow_name: trace.workflow_name,
          trace_id: trace.trace_id,
          metadata: trace.metadata
        });
      }

      // Log agent interactions
      if (trace.type === 'agent_call') {
        logger.info(`🤖 [OpenAI Agents] Agent call: ${trace.agent_name}`, {
          agent_name: trace.agent_name,
          trace_id: trace.trace_id,
          input_length: trace.input?.length || 0
        });
      }

      // Log tool calls
      if (trace.type === 'tool_call') {
        logger.info(`🔧 [OpenAI Agents] Tool call: ${trace.tool_name}`, {
          tool_name: trace.tool_name,
          function_name: trace.function_name,
          trace_id: trace.trace_id,
          parameters: trace.parameters
        });
      }

      // Log completions
      if (trace.type === 'completion') {
        logger.info(`✅ [OpenAI Agents] Completion received`, {
          model: trace.model,
          usage: trace.usage,
          trace_id: trace.trace_id,
          duration_ms: trace.duration_ms
        });
      }

      // Log errors
      if (trace.type === 'error') {
        logger.error(`❌ [OpenAI Agents] Error occurred`, {
          error: trace.error,
          trace_id: trace.trace_id,
          context: trace.context
        });
      }

      // Log workflow completion
      if (trace.type === 'workflow_end') {
        logger.info(`🏁 [OpenAI Agents] Workflow completed: ${trace.workflow_name}`, {
          workflow_name: trace.workflow_name,
          trace_id: trace.trace_id,
          duration_ms: trace.duration_ms,
          success: trace.success,
          result_length: trace.result?.length || 0
        });
      }

    } catch (error) {
      logger.error('Failed to process OpenAI Agents trace', { error });
    }
  }
}

/**
 * Enhanced Agent class with built-in logging
 */
export class LoggedAgent extends Agent {
  public agentName: string;

  constructor(config: any) {
    super(config);
    this.agentName = config.name || 'UnnamedAgent';
    
    logger.info(`🤖 [OpenAI Agents] Agent created: ${this.agentName}`, {
      agent_name: this.agentName,
      model: config.model || getAgentModel(),
      instructions_length: config.instructions?.length || 0
    });
  }

  /**
   * Enhanced run method with detailed logging
   */
  async run(prompt: string, options?: any): Promise<any> {
    const startTime = Date.now();
    const traceId = options?.traceId || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`🚀 [OpenAI Agents] Starting agent run: ${this.agentName}`, {
      agent_name: this.agentName,
      prompt_length: prompt.length,
      trace_id: traceId,
      options
    });

    try {
      const result = await run(this, prompt, options);
      const duration = Date.now() - startTime;

      logger.info(`✅ [OpenAI Agents] Agent run completed: ${this.agentName}`, {
        agent_name: this.agentName,
        trace_id: traceId,
        duration_ms: duration,
        result_length: result?.finalOutput?.length || 0,
        success: true
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`❌ [OpenAI Agents] Agent run failed: ${this.agentName}`, {
        agent_name: this.agentName,
        trace_id: traceId,
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  }
}

/**
 * Initialize OpenAI Agents SDK with Email-Makers configuration
 */
export async function initializeOpenAIAgents(): Promise<void> {
  try {
    logger.info('🔧 [OpenAI Agents] Initializing SDK configuration');

    // Add our custom trace processor
    const traceProcessor = new EmailMakersTraceProcessor();
    addTraceProcessor(traceProcessor);

    logger.info('✅ [OpenAI Agents] SDK configuration completed', {
      trace_processor: traceProcessor.name,
      api_key_configured: !!cfg.openaiApiKey
    });

  } catch (error) {
    logger.error('❌ [OpenAI Agents] Failed to initialize SDK', { error });
    throw error;
  }
}

/**
 * Create a configured agent with logging
 */
export function createLoggedAgent(config: {
  name: string;
  instructions: string;
  model?: string;
  tools?: any[];
  handoffs?: Agent[];
}): LoggedAgent {
  const agentConfig = {
    name: config.name,
    instructions: config.instructions,
    model: config.model || getAgentModel(),
    tools: config.tools || [],
    handoffs: config.handoffs || []
  };

  return new LoggedAgent(agentConfig);
}

/**
 * Run an agent with comprehensive tracing
 */
export async function runWithTracing(
  agent: Agent,
  prompt: string,
  metadata?: Record<string, any>
): Promise<any> {
  return withSDKTrace(`Agent: ${agent.name}`, async () => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`🎯 [OpenAI Agents] Executing agent with tracing`, {
      agent_name: agent.name,
      trace_id: traceId,
      prompt_length: prompt.length,
      metadata
    });

    const result = await run(agent, prompt);

    logger.info(`✅ [OpenAI Agents] Agent execution completed with tracing`, {
      agent_name: agent.name,
      trace_id: traceId,
      result_available: !!result
    });

    return result;
  });
}

/**
 * Get agent performance metrics
 */
export function getAgentMetrics() {
  // This would integrate with the logger's metrics
  return {
    total_agent_calls: logger.getRecentLogs().filter(log => 
      log.msg.includes('[OpenAI Agents] Agent call')).length,
    successful_completions: logger.getRecentLogs().filter(log => 
      log.msg.includes('[OpenAI Agents] Agent run completed')).length,
    failed_runs: logger.getRecentLogs().filter(log => 
      log.msg.includes('[OpenAI Agents] Agent run failed')).length
  };
}

/**
 * Export configured instances
 */
export { Agent, run } from '@openai/agents';
export { withSDKTrace } from '../utils/tracing-utils';
export const configuredLogger = logger; 