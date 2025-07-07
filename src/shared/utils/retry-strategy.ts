/**
 * 🔄 UNIFIED RETRY STRATEGY
 * 
 * Единая стратегия retry с экспоненциальным backoff
 * Используется всеми агентами для обеспечения надежности
 */

import { getLogger } from '../logger';

const logger = getLogger({ component: 'retry-strategy' });

/**
 * Опции для retry стратегии
 */
export interface RetryOptions {
  /** Максимальное количество попыток */
  maxAttempts?: number;
  /** Базовая задержка в миллисекундах */
  baseDelay?: number;
  /** Максимальная задержка в миллисекундах */
  maxDelay?: number;
  /** Множитель для экспоненциального backoff */
  backoffMultiplier?: number;
  /** Jitter для рандомизации задержки */
  jitter?: boolean;
  /** Функция для определения, стоит ли повторять попытку */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** Callback для логирования попыток */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Результат retry операции
 */
export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

/**
 * Типы ошибок для retry логики
 */
export enum RetryableErrorType {
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  OPENAI_API = 'openai_api',
  FIGMA_API = 'figma_api',
  TEMPORARY = 'temporary'
}

/**
 * 🚀 UNIFIED RETRY STRATEGY CLASS
 */
export class UnifiedRetryStrategy {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    shouldRetry: this.defaultShouldRetry.bind(this),
    onRetry: this.defaultOnRetry.bind(this)
  };

  constructor(private options: Partial<RetryOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Выполняет операцию с retry логикой
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...this.options, ...options } as Required<RetryOptions>;
    const startTime = Date.now();
    let lastError: any;

    logger.info('🔄 Starting retry operation', {
      maxAttempts: config.maxAttempts,
      baseDelay: config.baseDelay
    });

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        const totalTime = Date.now() - startTime;
        logger.info('✅ Operation succeeded', {
          attempt,
          totalTime,
          success: true
        });

        return result;

      } catch (error) {
        lastError = error;
        
        logger.warn('❌ Operation failed', {
          attempt,
          maxAttempts: config.maxAttempts,
          error: error instanceof Error ? error.message : error
        });

        // Проверяем, стоит ли повторять попытку
        if (attempt === config.maxAttempts || !config.shouldRetry(error, attempt)) {
          break;
        }

        // Вычисляем задержку
        const delay = this.calculateDelay(attempt, config);
        
        // Вызываем callback
        config.onRetry(error, attempt, delay);

        // Ждем перед следующей попыткой
        await this.delay(delay);
      }
    }

    const totalTime = Date.now() - startTime;
    logger.error('💥 All retry attempts failed', {
      attempts: config.maxAttempts,
      totalTime,
      finalError: lastError instanceof Error ? lastError.message : lastError
    });

    throw lastError;
  }

  /**
   * Выполняет операцию с детальным результатом
   */
  async executeWithResult<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      const result = await this.execute(operation, {
        ...options,
        onRetry: (error, attempt, delay) => {
          attempts = attempt;
          options.onRetry?.(error, attempt, delay);
        }
      });

      return {
        success: true,
        result,
        attempts: attempts || 1,
        totalTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error,
        attempts: attempts || 1,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Создает специализированную стратегию для типа операции
   */
  static forOperation(type: RetryableErrorType): UnifiedRetryStrategy {
    const configs = {
      [RetryableErrorType.NETWORK]: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      [RetryableErrorType.RATE_LIMIT]: {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3
      },
      [RetryableErrorType.TIMEOUT]: {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000
      },
      [RetryableErrorType.SERVER_ERROR]: {
        maxAttempts: 4,
        baseDelay: 1500,
        maxDelay: 20000
      },
      [RetryableErrorType.OPENAI_API]: {
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 30000,
        shouldRetry: (error: any) => {
          // Retry для определенных OpenAI ошибок
          if (error?.status === 429) return true; // Rate limit
          if (error?.status >= 500) return true; // Server errors
          if (error?.code === 'ECONNRESET') return true; // Network issues
          return false;
        }
      },
      [RetryableErrorType.FIGMA_API]: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 15000,
        shouldRetry: (error: any) => {
          // Retry для определенных Figma ошибок
          if (error?.status === 429) return true; // Rate limit
          if (error?.status >= 500) return true; // Server errors
          return false;
        }
      },
      [RetryableErrorType.TEMPORARY]: {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000
      }
    };

    return new UnifiedRetryStrategy(configs[type]);
  }

  /**
   * Вычисляет задержку для экспоненциального backoff
   */
  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Применяем максимальную задержку
    delay = Math.min(delay, config.maxDelay);
    
    // Добавляем jitter для рандомизации
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }

  /**
   * Задержка выполнения
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Стандартная логика определения retry
   */
  private defaultShouldRetry(error: any, attempt: number): boolean {
    // Не повторяем для ошибок валидации
    if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
      return false;
    }

    // Повторяем для сетевых ошибок
    if (error?.code === 'ECONNRESET' || 
        error?.code === 'ENOTFOUND' || 
        error?.code === 'ETIMEDOUT') {
      return true;
    }

    // Повторяем для server errors
    if (error?.status >= 500) {
      return true;
    }

    // Повторяем для rate limits
    if (error?.status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Стандартный callback для retry
   */
  private defaultOnRetry(error: any, attempt: number, delay: number): void {
    logger.warn('🔄 Retrying operation', {
      attempt,
      delay,
      errorType: error?.constructor?.name || 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * 🎯 CONVENIENCE FUNCTIONS
 */

/**
 * Быстрый retry для простых операций
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const strategy = new UnifiedRetryStrategy(options);
  return strategy.execute(operation);
}

/**
 * Retry для OpenAI операций
 */
export async function withOpenAIRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  const strategy = UnifiedRetryStrategy.forOperation(RetryableErrorType.OPENAI_API);
  return strategy.execute(operation);
}

/**
 * Retry для Figma операций
 */
export async function withFigmaRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  const strategy = UnifiedRetryStrategy.forOperation(RetryableErrorType.FIGMA_API);
  return strategy.execute(operation);
}

/**
 * Retry для сетевых операций
 */
export async function withNetworkRetry<T>(
  operation: () => Promise<T>
): Promise<T> {
  const strategy = UnifiedRetryStrategy.forOperation(RetryableErrorType.NETWORK);
  return strategy.execute(operation);
}

/**
 * 📊 METRICS COLLECTION
 */
export class RetryMetrics {
  private static metrics = new Map<string, {
    totalAttempts: number;
    totalSuccesses: number;
    totalFailures: number;
    averageAttempts: number;
    averageTime: number;
  }>();

  static recordResult<T>(operationName: string, result: RetryResult<T>): void {
    const existing = this.metrics.get(operationName) || {
      totalAttempts: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      averageAttempts: 0,
      averageTime: 0
    };

    existing.totalAttempts += result.attempts;
    if (result.success) {
      existing.totalSuccesses++;
    } else {
      existing.totalFailures++;
    }

    const totalOperations = existing.totalSuccesses + existing.totalFailures;
    existing.averageAttempts = existing.totalAttempts / totalOperations;
    existing.averageTime = (existing.averageTime * (totalOperations - 1) + result.totalTime) / totalOperations;

    this.metrics.set(operationName, existing);
  }

  static getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics.entries());
  }

  static reset(): void {
    this.metrics.clear();
  }
}

export default UnifiedRetryStrategy; 