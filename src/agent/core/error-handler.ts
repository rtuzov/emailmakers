/**
 * ⚠️ ERROR HANDLER
 * 
 * Унифицированная система обработки ошибок:
 * - Категоризация ошибок по типам
 * - Двухуровневое логирование (basic + detailed)
 * - Форматирование ошибок для пользователей
 * - Сбор метрик ошибок
 * - Строгий подход без fallback
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTENT_EXTRACTION_ERROR = 'CONTENT_EXTRACTION_ERROR',
  ASSET_SEARCH_ERROR = 'ASSET_SEARCH_ERROR',
  RENDERING_ERROR = 'RENDERING_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  HANDOFF_ERROR = 'HANDOFF_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface StandardError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context: Record<string, any>;
  timestamp: string;
  traceId: string;
  source: string;
  stack?: string;
}

export interface ErrorMetrics {
  total_errors: number;
  errors_by_type: Record<ErrorType, number>;
  errors_by_severity: Record<ErrorSeverity, number>;
  critical_errors_last_hour: number;
  avg_resolution_time_ms: number;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: StandardError[] = [];
  private maxLogSize = 1000; // Максимум ошибок в памяти
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Основной метод обработки ошибок
   */
  handleError(
    error: Error, 
    type: ErrorType, 
    source: string, 
    context: Record<string, any> = {},
    traceId?: string
  ): StandardError {
    const severity = this.determineSeverity(type, error);
    const timestamp = new Date().toISOString();
    const errorId = traceId || this.generateErrorId();
    
    const standardError: StandardError = {
      type,
      severity,
      message: error.message,
      context: this.sanitizeContext(context),
      timestamp,
      traceId: errorId,
      source,
      stack: error.stack
    };
    
    // Логируем ошибку
    this.logError(standardError);
    
    // Добавляем в лог
    this.addToErrorLog(standardError);
    
    return standardError;
  }

  /**
   * Создание ошибки с контекстом
   */
  createError(
    message: string,
    type: ErrorType,
    source: string,
    context: Record<string, any> = {},
    traceId?: string
  ): StandardError {
    const error = new Error(message);
    return this.handleError(error, type, source, context, traceId);
  }

  /**
   * Логирование критических ошибок
   */
  logCriticalError(
    error: Error,
    type: ErrorType,
    source: string,
    context: Record<string, any> = {},
    traceId?: string
  ): StandardError {
    const standardError = this.handleError(error, type, source, context, traceId);
    
    // Дополнительное логирование для критических ошибок
    if (standardError.severity === ErrorSeverity.CRITICAL) {
      console.error('🚨 CRITICAL ERROR ALERT:', {
        errorId: standardError.traceId,
        type: standardError.type,
        source: standardError.source,
        message: standardError.message,
        context: standardError.context,
        requiresImmediateAttention: true
      });
    }
    
    return standardError;
  }

  /**
   * Определение серьезности ошибки
   */
  private determineSeverity(type: ErrorType, error: Error): ErrorSeverity {
    // Критические ошибки - блокируют выполнение основных функций
    if (type === ErrorType.AI_SERVICE_ERROR && error.message.includes('API key')) {
      return ErrorSeverity.CRITICAL;
    }
    if (type === ErrorType.VALIDATION_ERROR && error.message.includes('required')) {
      return ErrorSeverity.CRITICAL;
    }
    if (type === ErrorType.CONTENT_EXTRACTION_ERROR) {
      return ErrorSeverity.CRITICAL;
    }
    if (type === ErrorType.CONFIGURATION_ERROR) {
      return ErrorSeverity.CRITICAL;
    }
    
    // Высокий приоритет - влияют на качество результата
    if (type === ErrorType.ASSET_SEARCH_ERROR) {
      return ErrorSeverity.HIGH;
    }
    if (type === ErrorType.RENDERING_ERROR) {
      return ErrorSeverity.HIGH;
    }
    if (type === ErrorType.HANDOFF_ERROR) {
      return ErrorSeverity.HIGH;
    }
    
    // Средний приоритет - ухудшают производительность
    if (type === ErrorType.FILE_SYSTEM_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    if (type === ErrorType.NETWORK_ERROR) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Низкий приоритет - не критичны для основных функций
    return ErrorSeverity.LOW;
  }

  /**
   * Логирование ошибки (двухуровневое)
   */
  private logError(standardError: StandardError): void {
    // УРОВЕНЬ 1: Основная информация об ошибке
    console.error(`❌ ${standardError.severity} [${standardError.type}]:`, {
      message: standardError.message,
      source: standardError.source,
      traceId: standardError.traceId,
      timestamp: standardError.timestamp
    });
    
    // УРОВЕНЬ 2: Детальная информация (только для HIGH и CRITICAL)
    if (standardError.severity === ErrorSeverity.CRITICAL || standardError.severity === ErrorSeverity.HIGH) {
      console.error(`🔍 ERROR DETAILS [${standardError.traceId}]:`, {
        context: standardError.context,
        stack: standardError.stack?.split('\n').slice(0, 5).join('\n'), // Первые 5 строк стека
        errorType: standardError.type,
        severity: standardError.severity
      });
    }
  }

  /**
   * Санитизация контекста (убираем чувствительные данные)
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };
    
    // Убираем чувствительные поля
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    // Ограничиваем размер строковых полей
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '... [TRUNCATED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Добавление в лог ошибок
   */
  private addToErrorLog(error: StandardError): void {
    this.errorLog.push(error);
    
    // Ограничиваем размер лога
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Генерация ID ошибки
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `err_${timestamp}_${random}`;
  }

  /**
   * Форматирование ошибки для пользователя
   */
  formatUserError(standardError: StandardError): string {
    const userFriendlyMessages: Record<ErrorType, string> = {
      [ErrorType.VALIDATION_ERROR]: 'Проверьте корректность входных данных',
      [ErrorType.CONTENT_EXTRACTION_ERROR]: 'Ошибка обработки контента. Проверьте формат данных',
      [ErrorType.ASSET_SEARCH_ERROR]: 'Не удалось найти подходящие изображения',
      [ErrorType.RENDERING_ERROR]: 'Ошибка создания email-шаблона',
      [ErrorType.FILE_SYSTEM_ERROR]: 'Ошибка работы с файлами',
      [ErrorType.NETWORK_ERROR]: 'Проблемы с сетевым соединением',
      [ErrorType.AI_SERVICE_ERROR]: 'Временные проблемы с AI-сервисом',
      [ErrorType.HANDOFF_ERROR]: 'Ошибка передачи данных между компонентами',
      [ErrorType.CONFIGURATION_ERROR]: 'Ошибка конфигурации системы'
    };
    
    const baseMessage = userFriendlyMessages[standardError.type] || 'Произошла неизвестная ошибка';
    return `${baseMessage} (ID: ${standardError.traceId})`;
  }

  /**
   * Получение метрик ошибок
   */
  getErrorMetrics(): ErrorMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const errorsByType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;
    
    // Инициализируем счетчики
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);
    
    let criticalErrorsLastHour = 0;
    
    // Подсчитываем ошибки
    for (const error of this.errorLog) {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
      
      const errorTime = new Date(error.timestamp);
      if (error.severity === ErrorSeverity.CRITICAL && errorTime > oneHourAgo) {
        criticalErrorsLastHour++;
      }
    }
    
    return {
      total_errors: this.errorLog.length,
      errors_by_type: errorsByType,
      errors_by_severity: errorsBySeverity,
      critical_errors_last_hour: criticalErrorsLastHour,
      avg_resolution_time_ms: 2500 // Примерное значение
    };
  }

  /**
   * Получение ошибок по типу
   */
  getErrorsByType(type: ErrorType): StandardError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  /**
   * Получение критических ошибок
   */
  getCriticalErrors(): StandardError[] {
    return this.errorLog.filter(error => error.severity === ErrorSeverity.CRITICAL);
  }

  /**
   * Очистка лога ошибок
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Проверка состояния системы на основе ошибок
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    critical_errors_count: number;
    last_critical_error?: StandardError;
    recommendations: string[];
  } {
    const criticalErrors = this.getCriticalErrors();
    const recentCriticalErrors = criticalErrors.filter(error => {
      const errorTime = new Date(error.timestamp);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return errorTime > fiveMinutesAgo;
    });
    
    const recommendations = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (recentCriticalErrors.length > 0) {
      status = 'critical';
      recommendations.push('Immediate attention required for critical errors');
      recommendations.push('Check system configuration and dependencies');
    } else if (criticalErrors.length > 5) {
      status = 'degraded';
      recommendations.push('Monitor system performance');
      recommendations.push('Review recent configuration changes');
    } else {
      recommendations.push('System operating normally');
    }
    
    return {
      status,
      critical_errors_count: criticalErrors.length,
      last_critical_error: criticalErrors[criticalErrors.length - 1],
      recommendations
    };
  }

  /**
   * Экспорт ошибок для анализа
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = 'timestamp,type,severity,source,message,traceId\n';
      const rows = this.errorLog.map(error => 
        `${error.timestamp},${error.type},${error.severity},${error.source},"${error.message}",${error.traceId}`
      ).join('\n');
      return headers + rows;
    }
    
    return JSON.stringify(this.errorLog, null, 2);
  }
}

// ============================================================================
// ERROR ORCHESTRATOR FUNCTIONALITY (consolidated from error-orchestrator.ts)
// ============================================================================

import { SmartErrorHandler } from '../utils/ultrathink-stub';
import { logger } from './logger';

export const ErrorOrchestrator = SmartErrorHandler;

/**
 * Unified helper to log and convert error into standard result shape.
 * Consolidates error-orchestrator.ts functionality into main error-handler.ts
 */
export function handleToolErrorUnified(toolName: string, error: any) {
  logger.error(`Tool ${toolName} failed`, { error: error?.message || error });
  ErrorOrchestrator.handleError(error);
  return {
    success: false,
    error: error instanceof Error ? error.message : String(error),
  };
} 