/**
 * Secure Logger for UltraThink
 * Prevents information disclosure and log injection attacks
 */

import { InputSanitizer } from './input-sanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export class SecureLogger {
  private static readonly isProduction = process.env.NODE_ENV === 'production';
  private static readonly isDebugMode = process.env.ULTRATHINK_DEBUG === 'true';

  /**
   * Log with security considerations
   */
  private static log(level: LogLevel, message: string, context?: LogContext): void {
    // In production, limit sensitive information
    if (this.isProduction && level === 'debug') {
      return; // Skip debug logs in production
    }

    // Sanitize message to prevent log injection
    const sanitizedMessage = InputSanitizer.sanitizeForLogging(message);
    
    // Sanitize context
    const sanitizedContext = this.sanitizeContext(context);
    
    // Create safe log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMessage,
      ...sanitizedContext
    };

    // Output based on level
    switch (level) {
      case 'error':
        console.error(`❌ UltraThink: ${sanitizedMessage}`, this.isDebugMode ? sanitizedContext : {});
        break;
      case 'warn':
        console.warn(`⚠️ UltraThink: ${sanitizedMessage}`, this.isDebugMode ? sanitizedContext : {});
        break;
      case 'info':
        console.log(`ℹ️ UltraThink: ${sanitizedMessage}`, this.isDebugMode ? sanitizedContext : {});
        break;
      case 'debug':
        if (this.isDebugMode) {
          console.log(`🔍 UltraThink: ${sanitizedMessage}`, sanitizedContext);
        }
        break;
    }
  }

  /**
   * Sanitize context object to remove sensitive data
   */
  private static sanitizeContext(context?: LogContext): LogContext {
    if (!context) return {};

    const sanitized: LogContext = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Skip potentially sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = InputSanitizer.sanitizeForLogging(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? InputSanitizer.sanitizeForLogging(item) : item
        );
      } else if (value && typeof value === 'object') {
        // Recursively sanitize nested objects (limit depth)
        sanitized[key] = this.sanitizeNestedObject(value, 2);
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  /**
   * Check if field name indicates sensitive data
   */
  private static isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /auth/i,
      /credential/i,
      /api[_-]?key/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * Sanitize nested objects with depth limit
   */
  private static sanitizeNestedObject(obj: any, maxDepth: number): any {
    if (maxDepth <= 0) return '[MAX_DEPTH_REACHED]';

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = InputSanitizer.sanitizeForLogging(value);
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeNestedObject(value, maxDepth - 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Public logging methods
   */
  static debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  static info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  static warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  static error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Specialized methods for common UltraThink scenarios
   */
  static toolExecution(toolName: string, duration: number, success: boolean, additionalContext?: LogContext): void {
    const emoji = success ? '✅' : '❌';
    this.info(`${emoji} ${toolName} completed`, {
      component: 'tool_execution',
      operation: toolName,
      duration,
      success,
      ...additionalContext
    });
  }

  static validation(validationType: string, result: boolean, details?: string): void {
    const emoji = result ? '✅' : '⚠️';
    this.debug(`${emoji} Validation: ${validationType}`, {
      component: 'validation',
      operation: validationType,
      result,
      details: details ? InputSanitizer.sanitizeForLogging(details) : undefined
    });
  }

  static contextEnrichment(enrichmentType: string, context?: LogContext): void {
    this.debug(`🧠 Context enriched: ${enrichmentType}`, {
      component: 'context_enrichment',
      operation: enrichmentType,
      ...context
    });
  }

  static qualityControl(stage: string, passed: boolean, score?: number): void {
    const emoji = passed ? '🛡️' : '🚨';
    this.info(`${emoji} Quality Control: ${stage}`, {
      component: 'quality_control',
      operation: stage,
      passed,
      score
    });
  }

  static errorHandling(toolName: string, errorType: string, action: string): void {
    this.warn(`🔧 Error handling: ${toolName}`, {
      component: 'error_handling',
      operation: toolName,
      errorType: InputSanitizer.sanitizeForLogging(errorType),
      action
    });
  }

  /**
   * Performance monitoring with automatic thresholds
   */
  static performance(operation: string, duration: number, threshold: number = 1000): void {
    const isSlow = duration > threshold;
    const emoji = isSlow ? '🐌' : '⚡';
    
    this[isSlow ? 'warn' : 'debug'](`${emoji} Performance: ${operation}`, {
      component: 'performance',
      operation,
      duration,
      threshold,
      isSlow
    });
  }

  // Interface methods for ILogger compatibility
  static logInterface(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any): void {
    this.log(level, message, context);
  }

  static logSecure(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any): void {
    this.log(level, message, context);
  }

  static sanitizeForLogging(data: any): any {
    return this.sanitizeContext(data);
  }
}