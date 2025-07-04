import { v4 as uuidv4 } from 'uuid';
import { generateTraceId, delay } from '../utils/tracing-utils';
import { DEFAULT_RETRY_POLICY } from '../../shared/constants';
import { getLogger } from '../../shared/logger';
import { Agent, run } from '@openai/agents';
import { enhancedTracing, AgentExecutionTrace } from './enhanced-tracing';

/**
 * BaseSpecialistAgent – shared functionality for Content/Design/Quality/Delivery specialists.
 * Provides:
 * • agent/trace initialisation
 * • enhanced tracing with function tracking
 * • comprehensive function visibility
 * • simple retry helper
 * Reduces duplication across specialist implementations.
 */
export class BaseSpecialistAgent {
  protected readonly agentId: string;
  protected readonly traceId: string;
  protected workflowId: string;
  protected agentType: string;
  protected currentTrace: AgentExecutionTrace | null = null;
  
  /**
   * Proper instance of the OpenAI Agents SDK `Agent`.
   * Using the concrete type ensures we catch SDK-level typing errors at compile time.
   */
  protected readonly agent: Agent;
  protected readonly logger = getLogger({ agent: 'specialist', name: 'base-specialist' });

  protected constructor(name: string, instructions: string, tools: any[] = []) {
    this.agentId = uuidv4();
    this.traceId = generateTraceId();
    this.workflowId = `workflow-${Date.now()}`;
    this.agentType = name;

    // Create a fully-typed SDK Agent instance (complies with latest docs)
    this.agent = new Agent({
      name,
      instructions,
      model: process.env.USAGE_MODEL || 'gpt-4o-mini',
      tools,
    });

    // 🔍 Инициализируем расширенную трассировку агента
    this.initializeEnhancedTracing();
  }

  /**
   * 🔍 Инициализация расширенной системы трассировки
   */
  private initializeEnhancedTracing(): void {
    const enhancedTraceId = enhancedTracing.startAgentTrace(
      this.agentType,
      this.workflowId,
      {
        agent: this.agentType,
        agentId: this.agentId,
        component_type: 'agent',
        sdk_version: 'openai-agents-js',
        timestamp: new Date().toISOString()
      }
    );
    
    // Обновляем traceId с enhanced версией
    (this as any).traceId = enhancedTraceId;
    
    console.log(`🔍 [${this.agentType}] Enhanced tracing initialized with ID: ${enhancedTraceId}`);
  }

  /**
   * 🎯 Execute operation with enhanced tracing and full visibility
   */
  protected async traced<T>(label: string, op: () => Promise<T>): Promise<T> {
    return this.tracedFunction(label, { operation: label }, op);
  }

  /**
   * 🎯 Execute function with enhanced tracing and automatic logging
   */
  protected async tracedFunction<T>(
    functionName: string,
    inputs: any,
    executor: () => Promise<T>
  ): Promise<T> {
    return enhancedTracing.traceFunction(
      this.traceId,
      functionName,
      inputs,
      async () => {
        this.logger.info(`🚀 [${this.agentType}] Executing ${functionName}`, {
          agentId: this.agentId,
          traceId: this.traceId,
          inputs: typeof inputs === 'object' ? JSON.stringify(inputs).slice(0, 200) : inputs
        });

        try {
          const result = await executor();
          
          this.logger.info(`✅ [${this.agentType}] Completed ${functionName}`, {
            agentId: this.agentId,
            traceId: this.traceId,
            success: true
          });

          return result;
        } catch (error) {
          this.logger.error(`❌ [${this.agentType}] Failed ${functionName}`, {
            agentId: this.agentId,
            traceId: this.traceId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      },
      {
        agentType: this.agentType,
        agentId: this.agentId,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * 🤖 Execute OpenAI Agent with comprehensive tracing
   */
  protected async executeOpenAIAgent<T>(
    prompt: string,
    context: Record<string, any> = {}
  ): Promise<T> {
    return this.tracedFunction(
      'openai-agent-execution',
      { prompt: prompt.slice(0, 200), context },
      async () => {
        console.log(`🤖 [${this.agentType}] Starting OpenAI Agent execution`);
        console.log(`📝 Prompt: ${prompt.slice(0, 300)}...`);

        const result = await run(this.agent, prompt);
        
        console.log(`🤖 [${this.agentType}] OpenAI Agent execution completed`);
        console.log(`📤 Result: ${JSON.stringify(result.finalOutput).slice(0, 200)}...`);

        return result as T;
      }
    );
  }

  /**
   * 🔄 Generic retry wrapper with enhanced tracing
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = DEFAULT_RETRY_POLICY.max_retries,
    context: string = 'operation',
  ): Promise<T> {
    return this.tracedFunction(
      `retry-${context}`,
      { maxRetries, context },
      async () => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`🔄 [${this.agentType}] Retry attempt ${attempt + 1}/${maxRetries + 1} for ${context}`);
            
            const result = await operation();
            
            if (attempt > 0) {
              console.log(`✅ [${this.agentType}] Retry succeeded on attempt ${attempt + 1} for ${context}`);
            }
            
            return result;
          } catch (err) {
            const last = attempt === maxRetries;
            if (last) {
              console.error(`❌ [${this.agentType}] All retry attempts failed for ${context}`, err);
              throw err;
            }
            
            const backoff = Math.min(DEFAULT_RETRY_POLICY.retry_delay_ms * Math.pow(2, attempt), 10000);
            console.warn(`⚠️ [${this.agentType}] Attempt ${attempt + 1} failed for ${context}, retrying in ${backoff}ms`, err);
            await delay(backoff);
          }
        }
        throw new Error('executeWithRetry: unreachable');
      }
    );
  }

  /**
   * 🔧 Execute tool with tracing
   */
  protected async executeTracedTool<T>(
    toolName: string,
    toolInputs: any,
    toolExecutor: () => Promise<T>
  ): Promise<T> {
    return this.tracedFunction(
      `tool-${toolName}`,
      { tool: toolName, inputs: toolInputs },
      async () => {
        console.log(`🔧 [${this.agentType}] Executing tool: ${toolName}`);
        console.log(`📥 Tool inputs: ${JSON.stringify(toolInputs).slice(0, 200)}...`);

        const result = await toolExecutor();
        
        console.log(`🔧 [${this.agentType}] Tool ${toolName} completed successfully`);
        console.log(`📤 Tool result: ${JSON.stringify(result).slice(0, 200)}...`);

        return result;
      }
    );
  }

  /**
   * 🔍 Execute validation with tracing
   */
  protected async executeTracedValidation<T>(
    validationType: string,
    validationInputs: any,
    validator: () => Promise<T>
  ): Promise<T> {
    return this.tracedFunction(
      `validation-${validationType}`,
      { type: validationType, inputs: validationInputs },
      async () => {
        console.log(`🔍 [${this.agentType}] Running validation: ${validationType}`);

        const result = await validator();
        
        console.log(`🔍 [${this.agentType}] Validation ${validationType} completed`);

        return result;
      }
    );
  }

  /**
   * 🔄 Trace agent handoff to another agent
   */
  protected async traceHandoff(
    toAgent: string,
    handoffData: any,
    validationResults?: any
  ): Promise<string> {
    return enhancedTracing.traceHandoff(
      this.traceId,
      this.agentType,
      toAgent,
      handoffData,
      validationResults
    );
  }

  /**
   * 🎯 Execute agent function with comprehensive tracing
   */
  protected async executeTracedAgentFunction<T>(
    functionName: string,
    inputs: any,
    executor: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.tracedFunction(
      functionName,
      inputs,
      async () => {
        console.log(`🎯 [${this.agentType}] Executing agent function: ${functionName}`);
        
        const result = await executor();
        
        console.log(`🎯 [${this.agentType}] Agent function ${functionName} completed`);
        
        return result;
      }
    );
  }

  /**
   * 📊 Get current trace information
   */
  protected getCurrentTrace(): AgentExecutionTrace | null {
    return enhancedTracing.getActiveTrace(this.traceId);
  }

  /**
   * 🏁 Complete agent tracing
   */
  protected completeTracing(success: boolean, error?: string): AgentExecutionTrace | null {
    const trace = enhancedTracing.endAgentTrace(this.traceId, success, error);
    
    if (trace) {
      console.log(`🏁 [${this.agentType}] Agent execution completed`);
      console.log(`📊 Functions executed: ${trace.totalFunctions}`);
      console.log(`🔄 Handoffs performed: ${trace.totalHandoffs}`);
      console.log(`⏱️ Total duration: ${trace.duration}ms`);
      console.log(`📈 Success rate: ${trace.performanceMetrics.successRate}%`);
    }
    
    return trace;
  }

  /**
   * 💾 Save trace to file
   */
  public async saveTrace(filePath?: string): Promise<string | null> {
    const savedPath = await enhancedTracing.saveTraceToFile(this.traceId, filePath);
    
    if (savedPath) {
      console.log(`💾 [${this.agentType}] Trace saved to: ${savedPath}`);
    }
    
    return savedPath;
  }

  /**
   * 📋 Print execution sequence
   */
  protected printExecutionSequence(): void {
    const trace = this.getCurrentTrace();
    if (trace) {
      console.log(`\n📋 [${this.agentType}] EXECUTION SEQUENCE:`);
      console.log(`🔢 Total Functions: ${trace.totalFunctions}`);
      console.log(`🔄 Total Handoffs: ${trace.totalHandoffs}`);
      console.log(`⏱️ Duration: ${trace.duration || 'In progress...'}ms`);
      console.log(`📊 Success Rate: ${trace.performanceMetrics.successRate}%`);
    }
  }

  /**
   * 📊 Get agent status with tracing information
   */
  protected getAgentStatus() {
    const trace = this.getCurrentTrace();
    
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      traceId: this.traceId,
      workflowId: this.workflowId,
      status: 'active',
      tracing: {
        functionsExecuted: trace?.totalFunctions || 0,
        handoffsPerformed: trace?.totalHandoffs || 0,
        duration: trace?.duration || 0,
        successRate: trace?.performanceMetrics.successRate || 0
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔍 Get detailed function execution history
   */
  public getFunctionExecutionHistory(): any[] {
    const trace = this.getCurrentTrace();
    if (!trace) return [];

    return trace.functions.map(func => ({
      sequence: func.sequence,
      name: func.functionName,
      duration: func.duration,
      success: func.success,
      timestamp: new Date(func.startTime).toISOString(),
      error: func.error
    }));
  }

  /**
   * 🔄 Get handoff history
   */
  public getHandoffHistory(): any[] {
    const trace = this.getCurrentTrace();
    if (!trace) return [];

    return trace.handoffs.map(handoff => ({
      sequence: handoff.sequence,
      from: handoff.fromAgent,
      to: handoff.toAgent,
      timestamp: new Date(handoff.timestamp).toISOString(),
      success: handoff.success
    }));
  }
} 