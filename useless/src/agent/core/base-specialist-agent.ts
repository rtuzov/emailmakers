import { v4 as uuidv4 } from 'uuid';
import { generateTraceId, delay } from '../utils/tracing-utils';
import { DEFAULT_RETRY_POLICY } from '../../config/constants';
import { getLogger } from '../../shared/logger';
import { Agent, run, createCustomSpan } from '@openai/agents';
import { toolRegistry } from './tool-registry';

/**
 * BaseSpecialistAgent – shared functionality for Content/Design/Quality/Delivery specialists.
 * Provides:
 * • agent/trace initialisation
 * • OpenAI SDK native tracing
 * • comprehensive function visibility
 * • simple retry helper
 * Reduces duplication across specialist implementations.
 */
export class BaseSpecialistAgent {
  protected readonly agentId: string;
  protected readonly traceId: string;
  protected workflowId: string;
  protected agentType: string;
  protected functionExecutionHistory: Array<{
    sequence: number;
    name: string;
    duration: number;
    success: boolean;
    timestamp: string;
    error?: string;
  }> = [];
  protected handoffHistory: Array<{
    sequence: number;
    from: string;
    to: string;
    timestamp: string;
    success: boolean;
  }> = [];
  protected sequenceCounter: number = 0;
  
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

    // 🔍 Инициализируем нативную трассировку OpenAI SDK
    this.initializeNativeTracing();
  }

  /**
   * 🔍 Инициализация нативной системы трассировки OpenAI SDK
   */
  private initializeNativeTracing(): void {
    console.log(`🔍 [${this.agentType}] Native OpenAI SDK tracing initialized`);
    console.log(`🤖 Agent: ${this.agentType}`);
    console.log(`🆔 Agent ID: ${this.agentId}`);
    console.log(`🔗 Trace ID: ${this.traceId}`);
    console.log(`📊 Workflow ID: ${this.workflowId}`);
    console.log(`⏰ Start Time: ${new Date().toISOString()}`);
  }

  /**
   * 🎯 Execute operation with native OpenAI SDK tracing
   */
  protected async traced<T>(label: string, op: () => Promise<T>): Promise<T> {
    return this.tracedFunction(label, { operation: label }, op);
  }

  /**
   * 🎯 Execute function with native OpenAI SDK tracing
   */
  protected async tracedFunction<T>(
    functionName: string,
    inputs: any,
    executor: () => Promise<T>
  ): Promise<T> {
    const sequence = ++this.sequenceCounter;
    const startTime = Date.now();
    
    // Simplified tracing - execute with comprehensive logging
    this.logger.info(`🚀 [${this.agentType}] Executing ${functionName}`, {
      agentId: this.agentId,
      traceId: this.traceId,
      sequence,
      inputs: typeof inputs === 'object' ? JSON.stringify(inputs).slice(0, 200) : inputs
    });

    try {
      const result = await executor();
      const duration = Date.now() - startTime;
      
      // Record function execution in history
      this.functionExecutionHistory.push({
        sequence,
        name: functionName,
        duration,
        success: true,
        timestamp: new Date(startTime).toISOString()
      });
      
      this.logger.info(`✅ [${this.agentType}] Completed ${functionName}`, {
        agentId: this.agentId,
        traceId: this.traceId,
        sequence,
        duration,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Record failed function execution in history
      this.functionExecutionHistory.push({
        sequence,
        name: functionName,
        duration,
        success: false,
        timestamp: new Date(startTime).toISOString(),
        error: errorMessage
      });
      
      this.logger.error(`❌ [${this.agentType}] Failed ${functionName}`, {
        agentId: this.agentId,
        traceId: this.traceId,
        sequence,
        duration,
        error: errorMessage
      });
      
      throw error;
    }
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
   * 🔄 Trace agent handoff to another agent with native OpenAI SDK
   */
  protected async traceHandoff(
    toAgent: string,
    handoffData: any,
    validationResults?: any
  ): Promise<string> {
    const sequence = ++this.sequenceCounter;
    const handoffId = `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Use OpenAI SDK createCustomSpan for handoff tracing
    try {
      await createCustomSpan({
        data: {
          name: `handoff-${this.agentType}-to-${toAgent}`
        }
      });
      
      // Record handoff in history
      this.handoffHistory.push({
        sequence,
        from: this.agentType,
        to: toAgent,
        timestamp,
        success: true
      });
      
      console.log(`🔄 [${sequence}] HANDOFF: ${this.agentType} → ${toAgent}`);
      console.log(`   🆔 Handoff ID: ${handoffId}`);
      console.log(`   ⏰ Time: ${timestamp}`);
      
      if (handoffData && Object.keys(handoffData).length > 0) {
        console.log(`   📦 Data: ${JSON.stringify(handoffData).slice(0, 200)}...`);
      }
      
      return handoffId;
    } catch (error) {
      console.error('❌ Failed to create handoff span:', error);
      
      // Record failed handoff in history
      this.handoffHistory.push({
        sequence,
        from: this.agentType,
        to: toAgent,
        timestamp,
        success: false
      });
      
      return handoffId;
    }
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
  protected getCurrentTrace(): any {
    const totalFunctions = this.functionExecutionHistory.length;
    const totalHandoffs = this.handoffHistory.length;
    const successfulFunctions = this.functionExecutionHistory.filter(f => f.success).length;
    const successRate = totalFunctions > 0 ? (successfulFunctions / totalFunctions) * 100 : 100;
    
    return {
      traceId: this.traceId,
      agentType: this.agentType,
      agentId: this.agentId,
      workflowId: this.workflowId,
      totalFunctions,
      totalHandoffs,
      successRate,
      functions: this.functionExecutionHistory,
      handoffs: this.handoffHistory
    };
  }

  /**
   * 🏁 Complete agent tracing
   */
  protected completeTracing(success: boolean, error?: string): any {
    const trace = this.getCurrentTrace();
    
    console.log(`🏁 [${this.agentType}] Agent execution completed`);
    console.log(`📊 Functions executed: ${trace.totalFunctions}`);
    console.log(`🔄 Handoffs performed: ${trace.totalHandoffs}`);
    console.log(`📈 Success rate: ${trace.successRate}%`);
    console.log(`✅ Overall success: ${success}`);
    
    if (error) {
      console.log(`❌ Error: ${error}`);
    }
    
    return trace;
  }

  /**
   * 💾 Save trace to file (simplified native implementation)
   */
  public async saveTrace(filePath?: string): Promise<string | null> {
    try {
      const trace = this.getCurrentTrace();
      const fileName = filePath || `trace-${this.traceId}-${Date.now()}.json`;
      const fs = await import('fs');
      const path = await import('path');
      
      const fullPath = path.join(process.cwd(), 'logs', fileName);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(fullPath, JSON.stringify(trace, null, 2));
      
      console.log(`💾 [${this.agentType}] Trace saved to: ${fullPath}`);
      return fullPath;
    } catch (error) {
      console.error('❌ Failed to save trace:', error);
      return null;
    }
  }

  /**
   * 📋 Print execution sequence
   */
  protected printExecutionSequence(): void {
    const trace = this.getCurrentTrace();
    console.log(`\n📋 [${this.agentType}] EXECUTION SEQUENCE:`);
    console.log(`🔢 Total Functions: ${trace.totalFunctions}`);
    console.log(`🔄 Total Handoffs: ${trace.totalHandoffs}`);
    console.log(`📊 Success Rate: ${trace.successRate}%`);
    
    // Print function history
    if (trace.functions.length > 0) {
      console.log(`\n🎯 Function Execution History:`);
      trace.functions.forEach((func: any, index: number) => {
        const status = func.success ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${func.name} (${func.duration}ms)`);
        if (func.error) {
          console.log(`     ❌ Error: ${func.error}`);
        }
      });
    }
    
    // Print handoff history
    if (trace.handoffs.length > 0) {
      console.log(`\n🔄 Handoff History:`);
      trace.handoffs.forEach((handoff: any, index: number) => {
        const status = handoff.success ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${handoff.from} → ${handoff.to}`);
      });
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
        functionsExecuted: trace.totalFunctions,
        handoffsPerformed: trace.totalHandoffs,
        successRate: trace.successRate
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔍 Get detailed function execution history
   */
  public getFunctionExecutionHistory(): any[] {
    return [...this.functionExecutionHistory];
  }

  /**
   * 🔄 Get handoff history
   */
  public getHandoffHistory(): any[] {
    return [...this.handoffHistory];
  }

  /**
   * 🔧 Get tools from Tool Registry for this agent type
   */
  protected getRegistryTools(agentType: 'content' | 'design' | 'quality' | 'delivery'): any[] {
    return toolRegistry.getToolsForAgent(agentType);
  }

  /**
   * 🔧 Get specific tool from Tool Registry
   */
  protected getRegistryTool(toolName: string): any {
    return toolRegistry.getOpenAITool(toolName);
  }

  /**
   * 📊 Get Tool Registry statistics
   */
  protected getToolRegistryStats(): any {
    return toolRegistry.getToolStats();
  }

  /**
   * 🔧 Enable/disable tool in registry
   */
  protected setToolEnabled(toolName: string, enabled: boolean): boolean {
    return enabled ? toolRegistry.enableTool(toolName) : toolRegistry.disableTool(toolName);
  }
} 