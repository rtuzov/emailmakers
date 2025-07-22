/**
 * 📊 AGENT LOGGER - Structured Logging System
 * 
 * Comprehensive logging system for OpenAI Agents SDK integration with:
 * - Campaign folder structure logging
 * - OpenTelemetry compatibility
 * - Structured JSON logging
 * - Performance metrics tracking
 * - Handoff event monitoring
 * - Error tracking and analytics
 * 
 * Compatible with OpenAI Agents SDK environment variables:
 * - DEBUG=openai-agents:* (enable detailed logging)
 * - OPENAI_AGENTS_DONT_LOG_TOOL_DATA=1 (disable tool data logging)
 * - OPENAI_AGENTS_DONT_LOG_MODEL_DATA=1 (disable model data logging)
 */

import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

export interface LoggerConfig {
  campaignPath?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableConsoleOutput: boolean;
  enableFileOutput: boolean;
  enableMetrics: boolean;
  enableTracing: boolean;
  rotateLogFiles: boolean;
  maxLogFileSize: number; // in MB
  traceId?: string;
  sessionId?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'agent' | 'tool' | 'handoff' | 'performance' | 'error';
  component: string;
  message: string;
  data?: Record<string, any>;
  traceId?: string;
  sessionId?: string;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  componentName: string;
  operationType: 'tool_execution' | 'agent_run' | 'handoff' | 'generation';
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HandoffEvent {
  handoffId: string;
  sourceAgent: string;
  targetAgent: string;
  timestamp: string;
  dataSize: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// AGENT LOGGER CLASS
// ============================================================================

export class AgentLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private metricsBuffer: PerformanceMetrics[] = [];
  private handoffBuffer: HandoffEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  // Store references to bound functions for proper cleanup
  private boundFlushExit: () => void;
  private boundFlushSigint: () => void;
  private boundFlushSigterm: () => void;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      logLevel: 'warn', // Changed from 'info' to 'warn' to reduce verbosity
      enableConsoleOutput: true,
      enableFileOutput: true,
      enableMetrics: true,
      enableTracing: true,
      rotateLogFiles: true,
      maxLogFileSize: 10, // 10MB
      ...config
    };

    // Bind functions to this instance for proper cleanup
    this.boundFlushExit = () => this.flush();
    this.boundFlushSigint = () => this.flush();
    this.boundFlushSigterm = () => this.flush();

    // Initialize logging directories
    this.initializeLogDirectories();

    // Setup automatic flushing
    this.setupAutoFlush();

    // Increase max listeners to prevent warnings (default is 10)
    // This is safe since we properly clean up listeners in close()
    const currentMaxListeners = process.getMaxListeners();
    if (currentMaxListeners < 20) {
      process.setMaxListeners(20);
    }

    // Listen for process exit to flush logs
    process.on('exit', this.boundFlushExit);
    process.on('SIGINT', this.boundFlushSigint);
    process.on('SIGTERM', this.boundFlushSigterm);
  }

  // ============================================================================
  // CORE LOGGING METHODS
  // ============================================================================

  debug(component: string, message: string, data?: Record<string, any>): void {
    this.log('debug', 'agent', component, message, data);
  }

  info(component: string, message: string, data?: Record<string, any>): void {
    this.log('info', 'agent', component, message, data);
  }

  warn(component: string, message: string, data?: Record<string, any>): void {
    this.log('warn', 'agent', component, message, data);
  }

  error(component: string, message: string, data?: Record<string, any>): void {
    this.log('error', 'error', component, message, data);
  }

  // ============================================================================
  // SPECIALIZED LOGGING METHODS
  // ============================================================================

  logToolExecution(
    toolName: string,
    params: Record<string, any>,
    result: any,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const logData = {
      toolName,
      params: this.shouldLogToolData() ? params : '[REDACTED]',
      result: this.shouldLogToolData() ? result : '[REDACTED]',
      duration,
      success,
      error
    };

    this.log('info', 'tool', toolName, 
      `Tool execution ${success ? 'completed' : 'failed'} in ${duration}ms`, 
      logData
    );

    if (this.config.enableMetrics) {
      this.recordMetrics({
        componentName: toolName,
        operationType: 'tool_execution',
        startTime: Date.now() - duration,
        endTime: Date.now(),
        duration,
        success,
        ...(error && { error }),
        metadata: { params: Object.keys(params), resultType: typeof result }
      });
    }
  }

  logAgentRun(
    agentName: string,
    input: string,
    output: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const logData = {
      agentName,
      input: this.shouldLogModelData() ? input : '[REDACTED]',
      output: this.shouldLogModelData() ? output : '[REDACTED]',
      duration,
      success,
      error
    };

    this.log('info', 'agent', agentName, 
      `Agent run ${success ? 'completed' : 'failed'} in ${duration}ms`, 
      logData
    );

    if (this.config.enableMetrics) {
      this.recordMetrics({
        componentName: agentName,
        operationType: 'agent_run',
        startTime: Date.now() - duration,
        endTime: Date.now(),
        duration,
        success,
        ...(error && { error }),
        metadata: { 
          inputLength: input.length, 
          outputLength: output.length 
        }
      });
    }
  }

  logHandoff(
    handoffId: string,
    sourceAgent: string,
    targetAgent: string,
    data: any,
    success: boolean,
    error?: string
  ): void {
    const dataSize = JSON.stringify(data).length;
    const logData = {
      handoffId,
      sourceAgent,
      targetAgent,
      dataSize,
      success,
      error
    };

    this.log('info', 'handoff', 'HandoffManager', 
      `Handoff ${success ? 'completed' : 'failed'}: ${sourceAgent} → ${targetAgent}`, 
      logData
    );

    if (this.config.enableMetrics) {
      this.handoffBuffer.push({
        handoffId,
        sourceAgent,
        targetAgent,
        timestamp: new Date().toISOString(),
        dataSize,
        success,
        ...(error && { error }),
        metadata: { dataKeys: Object.keys(data) }
      });
    }
  }

  logPerformance(
    component: string,
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const logData = {
      component,
      operation,
      duration,
      metadata
    };

    this.log('info', 'performance', component, 
      `Performance: ${operation} took ${duration}ms`, 
      logData
    );
  }

  // ============================================================================
  // CORE LOGGING IMPLEMENTATION
  // ============================================================================

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    category: 'agent' | 'tool' | 'handoff' | 'performance' | 'error',
    component: string,
    message: string,
    data?: Record<string, any>,
    duration?: number
  ): void {
    // Check log level
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      message,
      ...(data && { data }),
      ...(this.config.traceId && { traceId: this.config.traceId }),
      ...(this.config.sessionId && { sessionId: this.config.sessionId }),
      ...(duration && { duration })
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Console output if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= 100) {
      this.flush();
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private shouldLogToolData(): boolean {
    // Default to false for less verbose logging, unless explicitly enabled
    return process.env.OPENAI_AGENTS_LOG_TOOL_DATA === 'true';
  }

  private shouldLogModelData(): boolean {
    return !process.env.OPENAI_AGENTS_DONT_LOG_MODEL_DATA;
  }

  private outputToConsole(entry: LogEntry): void {
    const colorize = (text: string, color: string): string => {
      const colors = {
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        green: '\x1b[32m',
        gray: '\x1b[90m',
        reset: '\x1b[0m'
      };
      return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
    };

    const levelColors = {
      debug: 'gray',
      info: 'blue',
      warn: 'yellow',
      error: 'red'
    };

    const timestamp = colorize(entry.timestamp, 'gray');
    const level = colorize(entry.level.toUpperCase().padEnd(5), levelColors[entry.level]);
    const component = colorize(`[${entry.component}]`, 'green');
    const message = entry.message;
    const duration = entry.duration ? colorize(`(${entry.duration}ms)`, 'gray') : '';

    console.log(`${timestamp} ${level} ${component} ${message} ${duration}`);

    if (entry.data && Object.keys(entry.data).length > 0) {
      console.log(colorize('  Data:', 'gray'), JSON.stringify(entry.data, null, 2));
    }
  }

  // ============================================================================
  // FILE OUTPUT METHODS
  // ============================================================================

  private async initializeLogDirectories(): Promise<void> {
    if (!this.config.enableFileOutput || !this.config.campaignPath) {
      return;
    }

    // STRICT MODE: Only verify logs directory exists, don't create it
    try {
      const logsDir = path.join(this.config.campaignPath, 'logs');
      await fs.access(logsDir);
    } catch (error) {
      console.warn('⚠️ STRICT MODE: Logs directory does not exist. Logging to file disabled. Use main workflow to create proper campaign structure.');
      this.config.enableFileOutput = false;
    }
  }

  private async flush(): Promise<void> {
    if (!this.config.enableFileOutput || !this.config.campaignPath) {
      return;
    }

    try {
      await Promise.all([
        this.flushLogs(),
        this.flushMetrics(),
        this.flushHandoffs()
      ]);
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsDir = path.join(this.config.campaignPath!, 'logs');
    const logFile = path.join(logsDir, 'agent-logs.jsonl');

    const logLines = this.logBuffer
      .map(entry => JSON.stringify(entry))
      .join('\n') + '\n';

    await fs.appendFile(logFile, logLines);
    this.logBuffer = [];
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const logsDir = path.join(this.config.campaignPath!, 'logs');
    const metricsFile = path.join(logsDir, 'performance-metrics.jsonl');

    const metricsLines = this.metricsBuffer
      .map(metric => JSON.stringify(metric))
      .join('\n') + '\n';

    await fs.appendFile(metricsFile, metricsLines);
    this.metricsBuffer = [];
  }

  private async flushHandoffs(): Promise<void> {
    if (this.handoffBuffer.length === 0) {
      return;
    }

    const logsDir = path.join(this.config.campaignPath!, 'logs');
    const handoffFile = path.join(logsDir, 'handoff-events.jsonl');

    const handoffLines = this.handoffBuffer
      .map(handoff => JSON.stringify(handoff))
      .join('\n') + '\n';

    await fs.appendFile(handoffFile, handoffLines);
    this.handoffBuffer = [];
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metricsBuffer.push(metrics);
  }

  private setupAutoFlush(): void {
    // Flush logs every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  setTraceId(traceId: string): void {
    this.config.traceId = traceId;
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  setCampaignPath(campaignPath: string): void {
    this.config.campaignPath = campaignPath;
    this.initializeLogDirectories();
  }

  async generateLogSummary(): Promise<any> {
    if (!this.config.campaignPath) {
      return null;
    }

    const logsDir = path.join(this.config.campaignPath, 'logs');
    const summaryFile = path.join(logsDir, 'log-summary.json');

    const summary = {
      generatedAt: new Date().toISOString(),
      totalLogs: this.logBuffer.length,
      totalMetrics: this.metricsBuffer.length,
      totalHandoffs: this.handoffBuffer.length,
      logLevels: this.getLogLevelCounts(),
      topComponents: this.getTopComponents(),
      averageToolDuration: this.getAverageToolDuration(),
      handoffSuccessRate: this.getHandoffSuccessRate()
    };

    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    return summary;
  }

  private getLogLevelCounts(): Record<string, number> {
    const counts = { debug: 0, info: 0, warn: 0, error: 0 };
    this.logBuffer.forEach(entry => {
      counts[entry.level]++;
    });
    return counts;
  }

  private getTopComponents(): string[] {
    const componentCounts = new Map<string, number>();
    this.logBuffer.forEach(entry => {
      componentCounts.set(entry.component, (componentCounts.get(entry.component) || 0) + 1);
    });
    
    return Array.from(componentCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component]) => component);
  }

  private getAverageToolDuration(): number {
    const toolMetrics = this.metricsBuffer.filter(m => m.operationType === 'tool_execution');
    if (toolMetrics.length === 0) return 0;
    
    const totalDuration = toolMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(totalDuration / toolMetrics.length);
  }

  private getHandoffSuccessRate(): number {
    if (this.handoffBuffer.length === 0) return 1;
    
    const successful = this.handoffBuffer.filter(h => h.success).length;
    return Math.round((successful / this.handoffBuffer.length) * 100) / 100;
  }

  // ============================================================================
  // LIFECYCLE METHODS
  // ============================================================================

  async close(): Promise<void> {
    // Remove process listeners to prevent memory leaks
    process.removeListener('exit', this.boundFlushExit);
    process.removeListener('SIGINT', this.boundFlushSigint);
    process.removeListener('SIGTERM', this.boundFlushSigterm);
    
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flush();
    await this.generateLogSummary();
  }
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

let globalLogger: AgentLogger | null = null;

export function getGlobalLogger(): AgentLogger {
  if (!globalLogger) {
    globalLogger = new AgentLogger({
      logLevel: process.env.DEBUG?.includes('openai-agents') ? 'debug' : 'info',
      enableConsoleOutput: true,
      enableFileOutput: true,
      enableMetrics: true,
      enableTracing: true
    });
  }
  return globalLogger;
}

export function initializeLogger(config: Partial<LoggerConfig>): AgentLogger {
  // Clean up existing logger if it exists
  if (globalLogger) {
    globalLogger.close().catch(err => console.warn('Failed to close previous logger:', err));
  }
  
  globalLogger = new AgentLogger(config);
  return globalLogger;
}

/**
 * Clean up the global logger instance
 */
export async function cleanupLogger(): Promise<void> {
  if (globalLogger) {
    await globalLogger.close();
    globalLogger = null;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const log = {
  debug: (component: string, message: string, data?: Record<string, any>) => 
    getGlobalLogger().debug(component, message, data),
  
  info: (component: string, message: string, data?: Record<string, any>) => 
    getGlobalLogger().info(component, message, data),
  
  warn: (component: string, message: string, data?: Record<string, any>) => 
    getGlobalLogger().warn(component, message, data),
  
  error: (component: string, message: string, data?: Record<string, any>) => 
    getGlobalLogger().error(component, message, data),
  
  tool: (toolName: string, params: any, result: any, duration: number, success: boolean, error?: string) => 
    getGlobalLogger().logToolExecution(toolName, params, result, duration, success, error),
  
  agent: (agentName: string, input: string, output: string, duration: number, success: boolean, error?: string) => 
    getGlobalLogger().logAgentRun(agentName, input, output, duration, success, error),
  
  handoff: (handoffId: string, sourceAgent: string, targetAgent: string, data: any, success: boolean, error?: string) => 
    getGlobalLogger().logHandoff(handoffId, sourceAgent, targetAgent, data, success, error),
  
  performance: (component: string, operation: string, duration: number, metadata?: Record<string, any>) => 
    getGlobalLogger().logPerformance(component, operation, duration, metadata)
};

// ============================================================================
// OPENAI AGENTS SDK INTEGRATION
// ============================================================================

export interface OpenAIAgentsLoggerIntegration {
  logger: AgentLogger;
  wrapTool: (toolName: string, toolFunction: Function) => Function;
  wrapAgent: (agentName: string, agentFunction: Function) => Function;
  wrapHandoff: (handoffFunction: Function) => Function;
}

export function createOpenAIAgentsIntegration(logger: AgentLogger): OpenAIAgentsLoggerIntegration {
  return {
    logger,
    
    wrapTool: (toolName: string, toolFunction: Function) => {
      return async (...args: any[]) => {
        const startTime = Date.now();
        let success = true;
        let error: string | undefined;
        let result: any;

        try {
          result = await toolFunction(...args);
          return result;
        } catch (err) {
          success = false;
          error = err instanceof Error ? err.message : String(err);
          throw err;
        } finally {
          const duration = Date.now() - startTime;
          logger.logToolExecution(toolName, args[0] || {}, result, duration, success, error);
        }
      };
    },
    
    wrapAgent: (agentName: string, agentFunction: Function) => {
      return async (...args: any[]) => {
        const startTime = Date.now();
        let success = true;
        let error: string | undefined;
        let result: any;

        try {
          result = await agentFunction(...args);
          return result;
        } catch (err) {
          success = false;
          error = err instanceof Error ? err.message : String(err);
          throw err;
        } finally {
          const duration = Date.now() - startTime;
          const input = args[0] || '';
          const output = result || '';
          logger.logAgentRun(agentName, String(input), String(output), duration, success, error);
        }
      };
    },
    
    wrapHandoff: (handoffFunction: Function) => {
      return async (...args: any[]) => {
        const handoffId = `handoff_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const sourceAgent = args[0]?.sourceAgent || 'unknown';
        const targetAgent = args[0]?.targetAgent || 'unknown';
        const data = args[0]?.data || {};
        let success = true;
        let error: string | undefined;
        let result: any;

        try {
          result = await handoffFunction(...args);
          return result;
        } catch (err) {
          success = false;
          error = err instanceof Error ? err.message : String(err);
          throw err;
        } finally {
          logger.logHandoff(handoffId, sourceAgent, targetAgent, data, success, error);
        }
      };
    }
  };
}