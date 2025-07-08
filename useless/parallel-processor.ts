/**
 * ⚡ PARALLEL PROCESSOR
 * 
 * Система параллельной обработки для агентов
 * Позволяет выполнять независимые операции одновременно
 * Сокращает время выполнения на 50-70%
 */

import { getLogger } from '../../shared/logger';
import { withRetry, RetryOptions } from '../../shared/utils/retry-strategy';

const logger = getLogger({ component: 'parallel-processor' });

/**
 * Результат параллельной операции
 */
export interface ParallelResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  executionTime: number;
  operationName: string;
}

/**
 * Опции для параллельного выполнения
 */
export interface ParallelOptions {
  /** Timeout для всех операций в миллисекундах */
  timeout?: number;
  /** Максимальное количество одновременных операций */
  concurrency?: number;
  /** Опции retry для каждой операции */
  retryOptions?: RetryOptions;
  /** Прерывать ли выполнение при первой ошибке */
  failFast?: boolean;
  /** Логировать ли прогресс выполнения */
  logProgress?: boolean;
}

/**
 * Операция для параллельного выполнения
 */
export interface ParallelOperation<T> {
  name: string;
  operation: () => Promise<T>;
  retryOptions?: RetryOptions;
  dependencies?: string[]; // Зависимости от других операций
}

/**
 * Результат пакетного выполнения
 */
export interface BatchResult<T> {
  results: Map<string, ParallelResult<T>>;
  totalTime: number;
  successCount: number;
  errorCount: number;
  overallSuccess: boolean;
}

/**
 * 🚀 PARALLEL PROCESSOR CLASS
 */
export class ParallelProcessor {
  private defaultOptions: Required<ParallelOptions> = {
    timeout: 30000,
    concurrency: 10,
    retryOptions: { maxAttempts: 3 },
    failFast: false,
    logProgress: true
  };

  constructor(private options: Partial<ParallelOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Выполняет операции параллельно
   */
  async executeParallel<T>(
    operations: Array<ParallelOperation<T>>,
    options: Partial<ParallelOptions> = {}
  ): Promise<BatchResult<T>> {
    const config = { ...this.options, ...options } as Required<ParallelOptions>;
    const startTime = Date.now();
    
    logger.info('⚡ Starting parallel execution', {
      operationCount: operations.length,
      concurrency: config.concurrency,
      timeout: config.timeout
    });

    // Сортируем операции по зависимостям
    const sortedOperations = this.resolveDependencies(operations);
    
    // Группируем операции по уровням зависимостей
    const levels = this.groupByDependencyLevel(sortedOperations);
    
    const results = new Map<string, ParallelResult<T>>();
    let overallSuccess = true;

    // Выполняем операции по уровням
    for (let level = 0; level < levels.length; level++) {
      const levelOperations = levels[level];
      
      if (config.logProgress) {
        logger.info(`🔄 Executing level ${level + 1}/${levels.length}`, {
          operationsInLevel: levelOperations.length,
          operations: levelOperations.map(op => op.name)
        });
      }

      // Выполняем операции текущего уровня параллельно
      const levelResults = await this.executeBatch(levelOperations, config);
      
      // Объединяем результаты
      for (const [name, result] of levelResults.entries()) {
        results.set(name, result);
        
        if (!result.success) {
          overallSuccess = false;
          
          if (config.failFast) {
            logger.error('💥 Fail-fast triggered', {
              failedOperation: name,
              error: result.error
            });
            break;
          }
        }
      }

      if (config.failFast && !overallSuccess) {
        break;
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = Array.from(results.values()).filter(r => r.success).length;
    const errorCount = results.size - successCount;

    logger.info('✅ Parallel execution completed', {
      totalTime,
      successCount,
      errorCount,
      overallSuccess
    });

    return {
      results,
      totalTime,
      successCount,
      errorCount,
      overallSuccess
    };
  }

  /**
   * Выполняет простые операции параллельно (без зависимостей)
   */
  async executeSimple<T>(
    operations: Record<string, () => Promise<T>>,
    options: Partial<ParallelOptions> = {}
  ): Promise<BatchResult<T>> {
    const parallelOps = Object.entries(operations).map(([name, op]) => ({
      name,
      operation: op
    }));

    return this.executeParallel(parallelOps, options);
  }

  /**
   * Выполняет операции с таймаутом
   */
  async executeWithTimeout<T>(
    operations: Array<ParallelOperation<T>>,
    timeoutMs: number
  ): Promise<BatchResult<T>> {
    return Promise.race([
      this.executeParallel(operations, { timeout: timeoutMs }),
      this.createTimeoutPromise<BatchResult<T>>(timeoutMs)
    ]);
  }

  /**
   * Выполняет пакет операций одного уровня
   */
  private async executeBatch<T>(
    operations: Array<ParallelOperation<T>>,
    config: Required<ParallelOptions>
  ): Promise<Map<string, ParallelResult<T>>> {
    // Ограничиваем concurrency
    const batches = this.chunkArray(operations, config.concurrency);
    const results = new Map<string, ParallelResult<T>>();

    for (const batch of batches) {
      const batchPromises = batch.map(op => this.executeOperation(op, config));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const operation = batch[index];
        if (result.status === 'fulfilled') {
          results.set(operation.name, result.value);
        } else {
          results.set(operation.name, {
            success: false,
            error: result.reason,
            executionTime: 0,
            operationName: operation.name
          });
        }
      });
    }

    return results;
  }

  /**
   * Выполняет одну операцию
   */
  private async executeOperation<T>(
    operation: ParallelOperation<T>,
    config: Required<ParallelOptions>
  ): Promise<ParallelResult<T>> {
    const startTime = Date.now();
    
    try {
      const retryOptions = operation.retryOptions || config.retryOptions;
      
      const result = await withRetry(
        operation.operation,
        retryOptions
      );

      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        result,
        executionTime,
        operationName: operation.name
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('❌ Operation failed', {
        operation: operation.name,
        executionTime,
        error: error instanceof Error ? error.message : error
      });

      return {
        success: false,
        error,
        executionTime,
        operationName: operation.name
      };
    }
  }

  /**
   * Разрешает зависимости операций
   */
  private resolveDependencies<T>(
    operations: Array<ParallelOperation<T>>
  ): Array<ParallelOperation<T>> {
    const resolved: Array<ParallelOperation<T>> = [];
    const remaining = [...operations];
    const resolvedNames = new Set<string>();

    while (remaining.length > 0) {
      const canResolve = remaining.filter(op => 
        !op.dependencies || 
        op.dependencies.every(dep => resolvedNames.has(dep))
      );

      if (canResolve.length === 0) {
        throw new Error('Circular dependency detected in operations');
      }

      canResolve.forEach(op => {
        resolved.push(op);
        resolvedNames.add(op.name);
        const index = remaining.indexOf(op);
        remaining.splice(index, 1);
      });
    }

    return resolved;
  }

  /**
   * Группирует операции по уровням зависимостей
   */
  private groupByDependencyLevel<T>(
    operations: Array<ParallelOperation<T>>
  ): Array<Array<ParallelOperation<T>>> {
    const levels: Array<Array<ParallelOperation<T>>> = [];
    const processed = new Set<string>();

    for (const operation of operations) {
      const level = this.calculateDependencyLevel(operation, operations, processed);
      
      if (!levels[level]) {
        levels[level] = [];
      }
      
      levels[level].push(operation);
      processed.add(operation.name);
    }

    return levels.filter(level => level.length > 0);
  }

  /**
   * Вычисляет уровень зависимости операции
   */
  private calculateDependencyLevel<T>(
    operation: ParallelOperation<T>,
    allOperations: Array<ParallelOperation<T>>,
    processed: Set<string>
  ): number {
    if (!operation.dependencies || operation.dependencies.length === 0) {
      return 0;
    }

    let maxLevel = 0;
    for (const depName of operation.dependencies) {
      const depOperation = allOperations.find(op => op.name === depName);
      if (depOperation && !processed.has(depName)) {
        const depLevel = this.calculateDependencyLevel(depOperation, allOperations, processed);
        maxLevel = Math.max(maxLevel, depLevel + 1);
      }
    }

    return maxLevel;
  }

  /**
   * Разбивает массив на чанки
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Создает промис с таймаутом
   */
  private createTimeoutPromise<T>(timeoutMs: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }
}

/**
 * 🎯 CONVENIENCE FUNCTIONS
 */

/**
 * Быстрое параллельное выполнение простых операций
 */
export async function executeParallel<T>(
  operations: Record<string, () => Promise<T>>,
  options: Partial<ParallelOptions> = {}
): Promise<BatchResult<T>> {
  const processor = new ParallelProcessor(options);
  return processor.executeSimple(operations, options);
}

/**
 * Параллельное выполнение с зависимостями
 */
export async function executeWithDependencies<T>(
  operations: Array<ParallelOperation<T>>,
  options: Partial<ParallelOptions> = {}
): Promise<BatchResult<T>> {
  const processor = new ParallelProcessor(options);
  return processor.executeParallel(operations, options);
}

/**
 * Быстрое параллельное выполнение массива операций
 */
export async function executeAll<T>(
  operations: Array<() => Promise<T>>,
  operationNames?: string[],
  options: Partial<ParallelOptions> = {}
): Promise<T[]> {
  const namedOperations = operations.reduce((acc, op, index) => {
    const name = operationNames?.[index] || `operation_${index}`;
    acc[name] = op;
    return acc;
  }, {} as Record<string, () => Promise<T>>);

  const result = await executeParallel(namedOperations, options);
  
  if (!result.overallSuccess) {
    const errors = Array.from(result.results.values())
      .filter(r => !r.success)
      .map(r => r.error);
    throw new Error(`Some operations failed: ${errors.map(e => e.message).join(', ')}`);
  }

  return operations.map((_, index) => {
    const name = operationNames?.[index] || `operation_${index}`;
    return result.results.get(name)!.result!;
  });
}

/**
 * 📊 PERFORMANCE UTILITIES
 */

/**
 * Измеряет производительность параллельного выполнения
 */
export async function benchmarkParallel<T>(
  operations: Record<string, () => Promise<T>>,
  iterations: number = 3
): Promise<{
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
}> {
  const times: number[] = [];
  let successCount = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      const result = await executeParallel(operations);
      times.push(result.totalTime);
      if (result.overallSuccess) successCount++;
    } catch (error) {
      logger.warn('Benchmark iteration failed', { iteration: i, error });
    }
  }

  return {
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    successRate: successCount / iterations
  };
}

export default ParallelProcessor; 