/**
 * OpenAI Agent SDK Tracing Integration
 * Provides comprehensive tracing, monitoring, and performance metrics for multi-agent workflows
 * 
 * Features:
 * - Workflow-level tracing with OpenAI Agent SDK
 * - Custom spans for each agent and handoff
 * - Performance metrics and timing
 * - Error tracking and debugging
 * - Metadata collection and context preservation
 */

import { 
  withTrace, 
  createCustomSpan, 
  createGenerationSpan, 
  createFunctionSpan,
  getGlobalTraceProvider 
} from '@openai/agents';

export interface TracingConfig {
  workflowName: string;
  traceId?: string;
  groupId?: string;
  metadata?: Record<string, any>;
  includeSensitiveData?: boolean;
  disabled?: boolean;
}

export interface SpanMetadata {
  agentName: string;
  agentType: 'content' | 'design' | 'quality' | 'delivery';
  iterationCount?: number;
  qualityScore?: number;
  processingTime?: number;
  inputSize?: number;
  outputSize?: number;
  errorCount?: number;
  retryCount?: number;
  [key: string]: any;
}

export interface WorkflowMetrics {
  totalDuration: number;
  agentExecutionTimes: Map<string, number>;
  handoffTimes: Map<string, number>;
  qualityScores: Map<string, number>;
  iterationCounts: Map<string, number>;
  errorCounts: Map<string, number>;
  totalTokensUsed?: number;
  totalCost?: number;
}

export class TracingSystem {
  private currentTraceId: string | null = null;
  private workflowStartTime: number = 0;
  private agentStartTimes = new Map<string, number>();
  private metrics: WorkflowMetrics = this.initializeMetrics();

  /**
   * Initialize workflow tracing
   */
  async initializeWorkflowTracing(config: TracingConfig): Promise<string> {
    this.workflowStartTime = Date.now();
    this.metrics = this.initializeMetrics();

    const traceConfig = {
      workflowName: config.workflowName,
      traceId: config.traceId,
      groupId: config.groupId,
      disabled: config.disabled || false,
      metadata: {
        ...config.metadata,
        version: '2.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        workflowType: 'email_generation',
        platform: 'kupibilet'
      }
    };

    // Create workflow-level trace
    const trace = await withTrace(traceConfig, async () => {
      return { initialized: true, traceId: traceConfig.traceId };
    });

    this.currentTraceId = traceConfig.traceId || this.generateTraceId();
    
    // Log workflow initialization
    await this.logWorkflowEvent('workflow_initialized', {
      traceId: this.currentTraceId,
      config: traceConfig
    });

    return this.currentTraceId;
  }

  /**
   * Create agent execution span
   */
  async createAgentSpan(
    agentName: string,
    agentType: 'content' | 'design' | 'quality' | 'delivery',
    metadata: SpanMetadata = {} as SpanMetadata
  ): Promise<string> {
    const spanId = this.generateSpanId();
    const startTime = Date.now();
    this.agentStartTimes.set(agentName, startTime);

    const spanMetadata: SpanMetadata = {
      agentName,
      agentType,
      startTime,
      spanId,
      traceId: this.currentTraceId,
      ...metadata
    };

    // Create custom span for agent execution
    const span = createCustomSpan({
      name: `${agentName}_execution`,
      metadata: spanMetadata
    });

    // Log agent start
    await this.logAgentEvent(agentName, 'agent_started', {
      spanId,
      agentType,
      metadata: spanMetadata
    });

    return spanId;
  }

  /**
   * Complete agent execution span
   */
  async completeAgentSpan(
    agentName: string,
    spanId: string,
    result: any,
    metadata: Partial<SpanMetadata> = {}
  ): Promise<void> {
    const endTime = Date.now();
    const startTime = this.agentStartTimes.get(agentName) || endTime;
    const duration = endTime - startTime;

    // Update metrics
    this.metrics.agentExecutionTimes.set(agentName, duration);
    if (metadata.qualityScore) {
      this.metrics.qualityScores.set(agentName, metadata.qualityScore);
    }
    if (metadata.iterationCount) {
      this.metrics.iterationCounts.set(agentName, metadata.iterationCount);
    }

    const completionMetadata = {
      spanId,
      agentName,
      duration,
      endTime,
      result: this.sanitizeResult(result),
      ...metadata
    };

    // Log agent completion
    await this.logAgentEvent(agentName, 'agent_completed', completionMetadata);

    // Clean up
    this.agentStartTimes.delete(agentName);
  }

  /**
   * Create handoff span
   */
  async createHandoffSpan(
    fromAgent: string,
    toAgent: string,
    handoffData: any,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const spanId = this.generateSpanId();
    const handoffKey = `${fromAgent}_to_${toAgent}`;
    const startTime = Date.now();

    const handoffMetadata = {
      spanId,
      fromAgent,
      toAgent,
      handoffKey,
      startTime,
      traceId: this.currentTraceId,
      handoffData: this.sanitizeResult(handoffData),
      ...metadata
    };

    // Create handoff span
    const span = createCustomSpan({
      name: `handoff_${handoffKey}`,
      metadata: handoffMetadata
    });

    // Log handoff start
    await this.logHandoffEvent(handoffKey, 'handoff_started', handoffMetadata);

    return spanId;
  }

  /**
   * Complete handoff span
   */
  async completeHandoffSpan(
    fromAgent: string,
    toAgent: string,
    spanId: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const endTime = Date.now();
    const handoffKey = `${fromAgent}_to_${toAgent}`;
    const duration = endTime - (metadata.startTime || endTime);

    // Update metrics
    this.metrics.handoffTimes.set(handoffKey, duration);

    const completionMetadata = {
      spanId,
      handoffKey,
      duration,
      endTime,
      success,
      ...metadata
    };

    // Log handoff completion
    await this.logHandoffEvent(handoffKey, 'handoff_completed', completionMetadata);
  }

  /**
   * Create tool execution span
   */
  async createToolSpan(
    toolName: string,
    agentName: string,
    input: any,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const spanId = this.generateSpanId();
    const startTime = Date.now();

    const toolMetadata = {
      spanId,
      toolName,
      agentName,
      startTime,
      traceId: this.currentTraceId,
      input: this.sanitizeResult(input),
      ...metadata
    };

    // Create function span for tool execution
    const span = createFunctionSpan({
      name: toolName,
      metadata: toolMetadata
    });

    // Log tool start
    await this.logToolEvent(toolName, agentName, 'tool_started', toolMetadata);

    return spanId;
  }

  /**
   * Complete tool execution span
   */
  async completeToolSpan(
    toolName: string,
    agentName: string,
    spanId: string,
    result: any,
    error?: Error,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - (metadata.startTime || endTime);

    const completionMetadata = {
      spanId,
      toolName,
      agentName,
      duration,
      endTime,
      result: this.sanitizeResult(result),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      success: !error,
      ...metadata
    };

    // Update error metrics
    if (error) {
      const currentErrorCount = this.metrics.errorCounts.get(agentName) || 0;
      this.metrics.errorCounts.set(agentName, currentErrorCount + 1);
    }

    // Log tool completion
    await this.logToolEvent(toolName, agentName, 'tool_completed', completionMetadata);
  }

  /**
   * Create generation span for LLM calls
   */
  async createLLMGenerationSpan(
    agentName: string,
    model: string,
    prompt: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const spanId = this.generateSpanId();
    const startTime = Date.now();

    const generationMetadata = {
      spanId,
      agentName,
      model,
      startTime,
      traceId: this.currentTraceId,
      promptLength: prompt.length,
      ...metadata
    };

    // Create generation span
    const span = createGenerationSpan({
      name: `${agentName}_generation`,
      metadata: generationMetadata
    });

    // Log generation start
    await this.logGenerationEvent(agentName, 'generation_started', generationMetadata);

    return spanId;
  }

  /**
   * Complete LLM generation span
   */
  async completeLLMGenerationSpan(
    agentName: string,
    spanId: string,
    response: any,
    tokenUsage?: { prompt: number; completion: number; total: number },
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const endTime = Date.now();
    const duration = endTime - (metadata.startTime || endTime);

    const completionMetadata = {
      spanId,
      agentName,
      duration,
      endTime,
      responseLength: response ? JSON.stringify(response).length : 0,
      tokenUsage,
      ...metadata
    };

    // Update token usage metrics
    if (tokenUsage) {
      this.metrics.totalTokensUsed = (this.metrics.totalTokensUsed || 0) + tokenUsage.total;
    }

    // Log generation completion
    await this.logGenerationEvent(agentName, 'generation_completed', completionMetadata);
  }

  /**
   * Log feedback loop events
   */
  async logFeedbackEvent(
    agentName: string,
    targetAgent: string,
    iterationCount: number,
    qualityScore: number,
    issues: any[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const feedbackMetadata = {
      agentName,
      targetAgent,
      iterationCount,
      qualityScore,
      issuesCount: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      highIssues: issues.filter(i => i.severity === 'high').length,
      traceId: this.currentTraceId,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    // Create feedback span
    const span = createCustomSpan({
      name: `feedback_${agentName}_to_${targetAgent}`,
      metadata: feedbackMetadata
    });

    // Log feedback event
    await this.logEvent('feedback_loop', 'feedback_sent', feedbackMetadata);
  }

  /**
   * Complete workflow tracing
   */
  async completeWorkflowTracing(
    success: boolean,
    finalResult?: any,
    error?: Error
  ): Promise<WorkflowMetrics> {
    const endTime = Date.now();
    this.metrics.totalDuration = endTime - this.workflowStartTime;

    const completionMetadata = {
      traceId: this.currentTraceId,
      success,
      totalDuration: this.metrics.totalDuration,
      agentCount: this.metrics.agentExecutionTimes.size,
      handoffCount: this.metrics.handoffTimes.size,
      totalErrors: Array.from(this.metrics.errorCounts.values()).reduce((a, b) => a + b, 0),
      finalResult: this.sanitizeResult(finalResult),
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined,
      metrics: this.serializeMetrics()
    };

    // Log workflow completion
    await this.logWorkflowEvent('workflow_completed', completionMetadata);

    return this.metrics;
  }

  /**
   * Get current workflow metrics
   */
  getCurrentMetrics(): WorkflowMetrics {
    return { ...this.metrics };
  }

  /**
   * Get trace ID
   */
  getCurrentTraceId(): string | null {
    return this.currentTraceId;
  }

  /**
   * Private helper methods
   */
  private initializeMetrics(): WorkflowMetrics {
    return {
      totalDuration: 0,
      agentExecutionTimes: new Map(),
      handoffTimes: new Map(),
      qualityScores: new Map(),
      iterationCounts: new Map(),
      errorCounts: new Map(),
      totalTokensUsed: 0,
      totalCost: 0
    };
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeResult(result: any): any {
    if (!result) return result;
    
    // Remove sensitive data
    const sanitized = { ...result };
    
    // Remove potential API keys or sensitive tokens
    if (sanitized.apiKey) delete sanitized.apiKey;
    if (sanitized.token) delete sanitized.token;
    if (sanitized.password) delete sanitized.password;
    
    // Truncate large content
    if (sanitized.content && sanitized.content.length > 1000) {
      sanitized.content = sanitized.content.substring(0, 1000) + '... [truncated]';
    }
    
    return sanitized;
  }

  private serializeMetrics(): any {
    return {
      totalDuration: this.metrics.totalDuration,
      agentExecutionTimes: Object.fromEntries(this.metrics.agentExecutionTimes),
      handoffTimes: Object.fromEntries(this.metrics.handoffTimes),
      qualityScores: Object.fromEntries(this.metrics.qualityScores),
      iterationCounts: Object.fromEntries(this.metrics.iterationCounts),
      errorCounts: Object.fromEntries(this.metrics.errorCounts),
      totalTokensUsed: this.metrics.totalTokensUsed,
      totalCost: this.metrics.totalCost
    };
  }

  private async logEvent(
    category: string,
    event: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const logData = {
      category,
      event,
      timestamp: new Date().toISOString(),
      traceId: this.currentTraceId,
      ...metadata
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TRACE] ${category}.${event}:`, logData);
    }

    // Here you could integrate with external logging services
    // await this.sendToExternalLogger(logData);
  }

  private async logWorkflowEvent(event: string, metadata: Record<string, any>): Promise<void> {
    await this.logEvent('workflow', event, metadata);
  }

  private async logAgentEvent(agentName: string, event: string, metadata: Record<string, any>): Promise<void> {
    await this.logEvent(`agent.${agentName}`, event, metadata);
  }

  private async logHandoffEvent(handoffKey: string, event: string, metadata: Record<string, any>): Promise<void> {
    await this.logEvent(`handoff.${handoffKey}`, event, metadata);
  }

  private async logToolEvent(toolName: string, agentName: string, event: string, metadata: Record<string, any>): Promise<void> {
    await this.logEvent(`tool.${toolName}.${agentName}`, event, metadata);
  }

  private async logGenerationEvent(agentName: string, event: string, metadata: Record<string, any>): Promise<void> {
    await this.logEvent(`generation.${agentName}`, event, metadata);
  }
}

// Export singleton instance
export const tracingSystem = new TracingSystem();

// Export tracing utilities
export const createWorkflowTrace = async (config: TracingConfig) => {
  return await tracingSystem.initializeWorkflowTracing(config);
};

export const withAgentSpan = async <T>(
  agentName: string,
  agentType: 'content' | 'design' | 'quality' | 'delivery',
  operation: () => Promise<T>,
  metadata: Partial<SpanMetadata> = {}
): Promise<T> => {
  const spanId = await tracingSystem.createAgentSpan(agentName, agentType, metadata as SpanMetadata);
  
  try {
    const result = await operation();
    await tracingSystem.completeAgentSpan(agentName, spanId, result, metadata);
    return result;
  } catch (error) {
    await tracingSystem.completeAgentSpan(agentName, spanId, null, { 
      ...metadata, 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
};

export const withToolSpan = async <T>(
  toolName: string,
  agentName: string,
  input: any,
  operation: () => Promise<T>,
  metadata: Record<string, any> = {}
): Promise<T> => {
  const spanId = await tracingSystem.createToolSpan(toolName, agentName, input, metadata);
  
  try {
    const result = await operation();
    await tracingSystem.completeToolSpan(toolName, agentName, spanId, result, undefined, metadata);
    return result;
  } catch (error) {
    await tracingSystem.completeToolSpan(toolName, agentName, spanId, null, error as Error, metadata);
    throw error;
  }
}; 