/**
 * 🔍 TRACING DECORATORS
 * 
 * Автоматические декораторы для трейсинга функций агентов
 * Основано на актуальной документации OpenAI Agent SDK
 * 
 * Функциональность:
 * - Автоматическое создание spans для методов
 * - Интеграция с OpenAI SDK withTrace
 * - Поддержка createFunctionSpan и createCustomSpan
 * - Обработка ошибок и производительности
 * - Метаданные для лучшей видимости в трейсинге
 */

import { withTrace, createFunctionSpan, createCustomSpan } from '@openai/agents';

export interface TracingDecoratorOptions {
  spanName?: string;
  spanType?: 'function' | 'custom' | 'agent' | 'tool';
  includeArgs?: boolean;
  includeResult?: boolean;
  metadata?: Record<string, any>;
  sensitiveDataMode?: boolean;
  errorHandler?: (error: Error, context: any) => void;
}

export interface DecoratorMetadata {
  agentType?: string;
  functionName: string;
  category?: 'core' | 'specialist' | 'tool' | 'utility';
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * 🎯 ОСНОВНОЙ ДЕКОРАТОР ТРЕЙСИНГА
 * 
 * Автоматически оборачивает методы в OpenAI SDK трейсинг
 */
export function Traced(options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const spanName = options.spanName || `${className}.${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Создаем контекст для трейсинга
      const tracingContext = {
        className,
        methodName: propertyName,
        spanName,
        traceId,
        startTime,
        agentType: (this as any).agentType || 'unknown',
        ...options.metadata
      };
      
      console.log(`🔍 [${tracingContext.agentType}] Starting traced method: ${spanName}`);
      
      // Используем withTrace из OpenAI SDK
      return withTrace(
        {
          name: spanName,
          metadata: {
            ...tracingContext,
            functionCategory: 'agent_method',
            argsCount: args.length,
            includeArgs: options.includeArgs,
            includeResult: options.includeResult,
            timestamp: new Date().toISOString()
          }
        },
        async () => {
          try {
            // Логирование входных параметров (если разрешено)
            if (options.includeArgs && !options.sensitiveDataMode) {
              console.log(`📥 [${spanName}] Args:`, args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg).slice(0, 200) + '...' : arg
              ));
            }
            
            // Выполняем оригинальный метод
            const result = await method.apply(this, args);
            const duration = Date.now() - startTime;
            
            // Логирование результата (если разрешено)
            if (options.includeResult && !options.sensitiveDataMode) {
              console.log(`📤 [${spanName}] Result:`, 
                typeof result === 'object' ? JSON.stringify(result).slice(0, 200) + '...' : result
              );
            }
            
            console.log(`✅ [${tracingContext.agentType}] Completed traced method: ${spanName} (${duration}ms)`);
            return result;
            
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.error(`❌ [${tracingContext.agentType}] Failed traced method: ${spanName} (${duration}ms)`, errorMessage);
            
            // Кастомная обработка ошибок
            if (options.errorHandler) {
              options.errorHandler(error as Error, tracingContext);
            }
            
            throw error;
          }
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 🔧 ДЕКОРАТОР ДЛЯ TOOL ФУНКЦИЙ
 * 
 * Специализированный декоратор для инструментов агентов
 */
export function TracedTool(toolName: string, options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const spanName = `tool_${toolName}_${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      // Используем createFunctionSpan из OpenAI SDK для инструментов
      console.log(`🔧 [TOOL] Starting tool execution: ${toolName}.${propertyName}`);
      
      return withTrace(
        {
          name: spanName,
          metadata: {
            toolName,
            functionName: propertyName,
            spanType: 'tool_execution',
            agentType: (this as any).agentType || 'unknown',
            argsCount: args.length,
            timestamp: new Date().toISOString(),
            ...options.metadata
          }
        },
        async () => {
          try {
            const result = await method.apply(this, args);
            const duration = Date.now() - startTime;
            
            console.log(`✅ [TOOL] Completed tool execution: ${toolName}.${propertyName} (${duration}ms)`);
            return result;
            
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.error(`❌ [TOOL] Failed tool execution: ${toolName}.${propertyName} (${duration}ms)`, errorMessage);
            throw error;
          }
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 🎯 ДЕКОРАТОР ДЛЯ HANDOFF ОПЕРАЦИЙ
 * 
 * Специализированный декоратор для передач между агентами
 */
export function TracedHandoff(options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const spanName = `handoff_${className}_${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const fromAgent = (this as any).agentType || className;
      
      console.log(`🔄 [HANDOFF] Starting handoff from ${fromAgent}: ${propertyName}`);
      
      // Используем createCustomSpan для handoff операций
      try {
        await createCustomSpan({
          data: {
            name: spanName
          }
        });
      } catch (error) {
        console.warn('⚠️ Failed to create custom span for handoff:', error);
      }
      
      return withTrace(
        {
          name: spanName,
          metadata: {
            handoffType: 'agent_to_agent',
            fromAgent,
            operation: propertyName,
            timestamp: new Date().toISOString(),
            ...options.metadata
          }
        },
        async () => {
          try {
            const result = await method.apply(this, args);
            const duration = Date.now() - startTime;
            
            console.log(`✅ [HANDOFF] Completed handoff from ${fromAgent}: ${propertyName} (${duration}ms)`);
            return result;
            
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.error(`❌ [HANDOFF] Failed handoff from ${fromAgent}: ${propertyName} (${duration}ms)`, errorMessage);
            throw error;
          }
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 🧠 ДЕКОРАТОР ДЛЯ AGENT ОПЕРАЦИЙ
 * 
 * Специализированный декоратор для основных операций агентов
 */
export function TracedAgent(agentType: string, options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const spanName = `agent_${agentType}_${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      console.log(`🤖 [${agentType.toUpperCase()}] Starting agent operation: ${propertyName}`);
      
      return withTrace(
        {
          name: spanName,
          metadata: {
            agentType,
            operation: propertyName,
            spanType: 'agent_operation',
            argsCount: args.length,
            timestamp: new Date().toISOString(),
            ...options.metadata
          }
        },
        async () => {
          try {
            const result = await method.apply(this, args);
            const duration = Date.now() - startTime;
            
            console.log(`✅ [${agentType.toUpperCase()}] Completed agent operation: ${propertyName} (${duration}ms)`);
            return result;
            
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.error(`❌ [${agentType.toUpperCase()}] Failed agent operation: ${propertyName} (${duration}ms)`, errorMessage);
            throw error;
          }
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 📊 ДЕКОРАТОР ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
 * 
 * Специализированный декоратор для мониторинга производительности
 */
export function TracedPerformance(options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const spanName = `perf_${className}_${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      console.log(`📊 [PERF] Starting performance tracking: ${spanName}`);
      
      return withTrace(
        {
          name: spanName,
          metadata: {
            performanceTracking: true,
            className,
            methodName: propertyName,
            startMemory: startMemory.heapUsed,
            timestamp: new Date().toISOString(),
            ...options.metadata
          }
        },
        async () => {
          try {
            const result = await method.apply(this, args);
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();
            const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
            
            // Логирование метрик производительности
            console.log(`📊 [PERF] Performance metrics for ${spanName}:`, {
              duration: `${duration}ms`,
              memoryDelta: `${Math.round(memoryDelta / 1024)}KB`,
              heapUsed: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
              resultSize: typeof result === 'object' ? JSON.stringify(result).length : 0
            });
            
            return result;
            
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            console.error(`❌ [PERF] Performance tracking failed for ${spanName} (${duration}ms)`, errorMessage);
            throw error;
          }
        }
      );
    };
    
    return descriptor;
  };
}

/**
 * 🔧 УТИЛИТАРНЫЕ ФУНКЦИИ ДЛЯ ДЕКОРАТОРОВ
 */
export class TracingUtils {
  /**
   * Создать кастомную метрику трейсинга
   */
  static async createCustomMetric(name: string, value: number, metadata?: Record<string, any>) {
    try {
      await createCustomSpan({
        data: {
          name: `metric_${name}`
        }
      });
      
      console.log(`📈 [METRIC] ${name}: ${value}`, metadata);
    } catch (error) {
      console.warn('⚠️ Failed to create custom metric:', error);
    }
  }
  
  /**
   * Логировать важное событие в трейсинге
   */
  static async logTraceEvent(eventName: string, data: any, agentType?: string) {
    const timestamp = new Date().toISOString();
    const prefix = agentType ? `[${agentType.toUpperCase()}]` : '[EVENT]';
    
    console.log(`🎯 ${prefix} Trace Event: ${eventName}`, {
      timestamp,
      data: typeof data === 'object' ? JSON.stringify(data).slice(0, 200) + '...' : data
    });
  }
  
  /**
   * Создать span для группы операций
   */
  static async createOperationGroup(groupName: string, operations: string[], agentType?: string) {
    try {
      await createCustomSpan({
        data: {
          name: `group_${groupName}`
        }
      });
      
      console.log(`🏗️ [GROUP] ${agentType ? `[${agentType.toUpperCase()}] ` : ''}Operation group: ${groupName}`, {
        operationsCount: operations.length,
        operations: operations.join(', ')
      });
    } catch (error) {
      console.warn('⚠️ Failed to create operation group span:', error);
    }
  }
}

/**
 * 🎨 ДЕКОРАТОР ДЛЯ АВТОМАТИЧЕСКОГО ПРИМЕНЕНИЯ ТРЕЙСИНГА
 * 
 * Применяет трейсинг ко всем методам класса автоматически
 */
export function AutoTraced(agentType: string, options: TracingDecoratorOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);
    
    methodNames.forEach(methodName => {
      if (methodName !== 'constructor' && typeof prototype[methodName] === 'function') {
        const originalMethod = prototype[methodName];
        
        // Применяем трейсинг автоматически
        prototype[methodName] = async function (...args: any[]) {
          const spanName = `${agentType}_${methodName}`;
          
          return withTrace(
            {
              name: spanName,
              metadata: {
                agentType,
                methodName,
                autoTraced: true,
                timestamp: new Date().toISOString(),
                ...options.metadata
              }
            },
            async () => {
              return originalMethod.apply(this, args);
            }
          );
        };
      }
    });
    
    return constructor;
  };
}