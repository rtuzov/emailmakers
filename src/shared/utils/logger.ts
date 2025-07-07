/**
 * Simple Logger Utility
 * Provides consistent logging across the application
 */

export interface LoggerConfig {
  component?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  [key: string]: any;
}

export interface LoggerInstance {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

class Logger implements LoggerInstance {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = {}) {
    this.config = config;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const component = this.config.component || 'app';
    const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}${metaString}`;
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = this.config.level || 'info';
    const currentLevelIndex = levels.indexOf(level);
    const configLevelIndex = levels.indexOf(configLevel);
    
    return currentLevelIndex >= configLevelIndex;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }
}

/**
 * Get logger instance with configuration
 */
export function getLogger(config: LoggerConfig = {}): LoggerInstance {
  return new Logger(config);
}

/**
 * Default logger instance
 */
export const logger = getLogger();

export default logger; 