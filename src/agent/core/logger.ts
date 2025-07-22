import pino from 'pino';
import { Counter, Registry, register } from 'prom-client';
import fs from 'fs/promises';
import path from 'path';

/**
 * Core Logger – provides consistent structured logging across all agent tools.
 * Automatically includes timestamp, service name and correlation id when available.
 */
class CoreLogger {
  private static instance: CoreLogger;
  private logger = pino({ name: 'email-makers-agent', level: process.env.LOG_LEVEL || 'warn' });

  // Prometheus metrics
  private registry: Registry;
  private toolSuccessTotal: Counter<string>;
  private toolFailureTotal: Counter<string>;

  // Trace tracking
  private activeTraces: Map<string, any> = new Map();
  private logBuffer: any[] = [];
  private maxBufferSize = 1000;

  private constructor() {
    // Prometheus registry (optional – only created in server context)
    this.registry = new Registry();
    
    this.toolSuccessTotal = new Counter({
      name: 'tool_success_total',
      help: 'Total successful tool executions',
      labelNames: ['tool'],
      registers: [this.registry],
    });
    
    this.toolFailureTotal = new Counter({
      name: 'tool_failure_total',
      help: 'Total failed tool executions',
      labelNames: ['tool'],
      registers: [this.registry],
    });

    // Регистрируем метрики в глобальном реестре
    register.registerMetric(this.toolSuccessTotal);
    register.registerMetric(this.toolFailureTotal);

    // Периодически сохраняем логи в файл
    this.startLogPersistence();
  }

  static get(): CoreLogger {
    if (!CoreLogger.instance) {
      CoreLogger.instance = new CoreLogger();
    }
    return CoreLogger.instance;
  }

  info(msg: string, meta?: any) {
    const logEntry = { level: 'info', msg, ...meta, timestamp: new Date().toISOString() };
    this.logger.info(meta || {}, msg);
    this.addToBuffer(logEntry);
  }

  warn(msg: string, meta?: any) {
    const logEntry = { level: 'warn', msg, ...meta, timestamp: new Date().toISOString() };
    this.logger.warn(meta || {}, msg);
    this.addToBuffer(logEntry);
  }

  error(msg: string, meta?: any) {
    const logEntry = { level: 'error', msg, ...meta, timestamp: new Date().toISOString() };
    this.logger.error(meta || {}, msg);
    this.addToBuffer(logEntry);
  }

  debug(msg: string, meta?: any) {
    const logEntry = { level: 'debug', msg, ...meta, timestamp: new Date().toISOString() };
    this.logger.debug(meta || {}, msg);
    this.addToBuffer(logEntry);
  }

  incrementToolSuccess(tool: string) {
    this.toolSuccessTotal.inc({ tool });
  }

  incrementToolFailure(tool: string) {
    this.toolFailureTotal.inc({ tool });
  }

  /**
   * Start a new trace for agent execution
   */
  startTrace(traceId: string, context: any = {}) {
    const trace = {
      traceId,
      startTime: Date.now(),
      startTimestamp: new Date().toISOString(),
      context,
      steps: [],
      status: 'active'
    };
    
    this.activeTraces.set(traceId, trace);
    this.info(`Started trace: ${traceId}`, { traceId, context });
    
    return trace;
  }

  /**
   * Add a step to an active trace
   */
  addTraceStep(traceId: string, step: {
    tool: string;
    action: string;
    params?: any;
    result?: any;
    error?: any;
    duration?: number;
  }) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      this.warn(`Trace not found: ${traceId}`);
      return;
    }

    const traceStep = {
      ...step,
      timestamp: new Date().toISOString(),
      stepId: trace.steps.length + 1
    };

    trace.steps.push(traceStep);
    this.debug(`Trace step added: ${traceId}`, { traceId, step: traceStep });
  }

  /**
   * End a trace and save to file
   */
  async endTrace(traceId: string, result?: any, error?: any) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      this.warn(`Trace not found: ${traceId}`);
      return;
    }

    trace.endTime = Date.now();
    trace.endTimestamp = new Date().toISOString();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = error ? 'failed' : 'completed';
    trace.result = result;
    trace.error = error;

    // Save trace to file
    try {
      await this.saveTraceToFile(trace);
      this.info(`Trace completed: ${traceId}`, { 
        traceId, 
        duration: trace.duration, 
        status: trace.status,
        steps: trace.steps.length
      });
    } catch (saveError) {
      this.error(`Failed to save trace: ${traceId}`, { traceId, error: saveError });
    }

    this.activeTraces.delete(traceId);
    return trace;
  }

  /**
   * Get active traces
   */
  getActiveTraces() {
    return Array.from(this.activeTraces.values());
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string) {
    return this.activeTraces.get(traceId);
  }

  /**
   * Expose metrics for Prometheus scraper
   */
  async metrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get recent logs from buffer
   */
  getRecentLogs(limit: number = 100) {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer() {
    this.logBuffer = [];
  }

  private addToBuffer(logEntry: any) {
    this.logBuffer.push(logEntry);
    
    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private async startLogPersistence() {
    // Сохраняем логи каждые 30 секунд
    setInterval(async () => {
      if (this.logBuffer.length > 0) {
        try {
          await this.saveLogsToFile();
        } catch (error) {
          console.error('Failed to persist logs:', error);
        }
      }
    }, 30000);
  }

  private async saveLogsToFile() {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `agent-${timestamp}.log`;
      const filepath = path.join(tempDir, filename);

      const logLines = this.logBuffer.map(log => JSON.stringify(log)).join('\n');
      await fs.appendFile(filepath, logLines + '\n');

      // Clear buffer after saving
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to save logs to file:', error);
    }
  }

  private async saveTraceToFile(trace: any) {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      const filename = `trace-${trace.traceId}.json`;
      const filepath = path.join(tempDir, filename);

      await fs.writeFile(filepath, JSON.stringify(trace, null, 2));
    } catch (error) {
      console.error('Failed to save trace to file:', error);
      throw error;
    }
  }
}

export const logger = CoreLogger.get(); 