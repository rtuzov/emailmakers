import pino from 'pino';
import { Counter, Registry, register } from 'prom-client';

/**
 * Core Logger – provides consistent structured logging across all agent tools.
 * Automatically includes timestamp, service name and correlation id when available.
 */
class CoreLogger {
  private static instance: CoreLogger;
  private logger = pino({ name: 'email-makers-agent', level: process.env.LOG_LEVEL || 'info' });

  // Prometheus metrics
  private registry: Registry;
  private toolSuccessTotal: Counter<string>;
  private toolFailureTotal: Counter<string>;

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
  }

  static get(): CoreLogger {
    if (!CoreLogger.instance) {
      CoreLogger.instance = new CoreLogger();
    }
    return CoreLogger.instance;
  }

  info(msg: string, meta?: any) {
    this.logger.info(meta || {}, msg);
  }

  warn(msg: string, meta?: any) {
    this.logger.warn(meta || {}, msg);
  }

  error(msg: string, meta?: any) {
    this.logger.error(meta || {}, msg);
  }

  debug(msg: string, meta?: any) {
    this.logger.debug(meta || {}, msg);
  }

  incrementToolSuccess(tool: string) {
    this.toolSuccessTotal.inc({ tool });
  }

  incrementToolFailure(tool: string) {
    this.toolFailureTotal.inc({ tool });
  }

  /**
   * Expose metrics for Prometheus scraper
   */
  async metrics(): Promise<string> {
    return register.metrics();
  }
}

export const logger = CoreLogger.get(); 