/**
 * 🔗 PERFORMANCE INTEGRATION
 * 
 * Integration layer connecting performance monitoring with tracing decorators
 * Automatic performance metrics collection for all traced methods
 */

import { recordPerformanceMetric } from './performance-monitor';
import { TracingDecoratorOptions } from './tracing-decorators';
import { withTrace } from '@openai/agents';

/**
 * 📊 Enhanced tracing decorator with performance monitoring
 */
export function TracedWithPerformance(options: TracingDecoratorOptions & {
  enablePerformanceTracking?: boolean;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;
    const spanName = options.spanName || `${className}.${propertyName}`;
    const agentType = options.metadata?.agentType || 'unknown';
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let success = true;
      let errorType: string | undefined;
      
      try {
        // Execute with OpenAI SDK tracing
        const result = await withTrace(
          {
            name: spanName,
            metadata: {
              agentType,
              functionName: propertyName,
              traceId,
              performanceTracking: options.enablePerformanceTracking !== false,
              ...options.metadata
            }
          },
          async () => {
            return await method.apply(this, args);
          }
        );
        
        return result;
        
      } catch (error) {
        success = false;
        errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
        throw error;
        
      } finally {
        // Record performance metric if enabled
        if (options.enablePerformanceTracking !== false) {
          const executionTime = Date.now() - startTime;
          
          await recordPerformanceMetric(
            agentType,
            propertyName,
            executionTime,
            success,
            errorType,
            traceId,
            {
              className,
              spanName,
              argsCount: args.length,
              ...options.metadata
            }
          );
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * 🎯 Performance-aware agent decorator
 */
export function PerformanceTrackedAgent(agentType: string, options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    return TracedWithPerformance({
      ...options,
      enablePerformanceTracking: true,
      metadata: {
        ...options.metadata,
        agentType,
        category: 'agent_operation'
      }
    })(target, propertyName, descriptor);
  };
}

/**
 * 🔧 Performance-aware tool decorator
 */
export function PerformanceTrackedTool(toolName: string, options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    return TracedWithPerformance({
      ...options,
      enablePerformanceTracking: true,
      spanName: `tool_${toolName}_${propertyName}`,
      metadata: {
        ...options.metadata,
        toolName,
        category: 'tool_execution',
        spanType: 'tool'
      }
    })(target, propertyName, descriptor);
  };
}

/**
 * 🔄 Performance-aware handoff decorator
 */
export function PerformanceTrackedHandoff(options: TracingDecoratorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;
    
    return TracedWithPerformance({
      ...options,
      enablePerformanceTracking: true,
      spanName: `handoff_${className}_${propertyName}`,
      metadata: {
        ...options.metadata,
        category: 'agent_handoff',
        spanType: 'custom'
      }
    })(target, propertyName, descriptor);
  };
}

/**
 * 🚀 Auto-apply performance tracking to class
 */
export function AutoPerformanceTracked(agentType: string, options: {
  enabledMethods?: string[];
  disabledMethods?: string[];
  performanceOptions?: TracingDecoratorOptions;
} = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const prototype = constructor.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype);
    
    methodNames.forEach(methodName => {
      if (methodName === 'constructor') return;
      if (typeof prototype[methodName] !== 'function') return;
      
      // Check if method should be tracked
      const { enabledMethods, disabledMethods } = options;
      if (enabledMethods && !enabledMethods.includes(methodName)) return;
      if (disabledMethods && disabledMethods.includes(methodName)) return;
      
      // Apply performance tracking
      const originalMethod = prototype[methodName];
      const decorator = PerformanceTrackedAgent(agentType, options.performanceOptions);
      const descriptor = { value: originalMethod };
      
      decorator(prototype, methodName, descriptor);
      prototype[methodName] = descriptor.value;
    });
    
    // Add metadata to constructor
    (constructor as any).performanceTracked = true;
    (constructor as any).agentType = agentType;
    
    return constructor;
  };
}

/**
 * 📊 Performance metrics wrapper for existing functions
 */
export async function withPerformanceTracking<T>(
  agentType: string,
  methodName: string,
  executor: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  const traceId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let success = true;
  let errorType: string | undefined;
  
  try {
    const result = await executor();
    return result;
    
  } catch (error) {
    success = false;
    errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
    throw error;
    
  } finally {
    const executionTime = Date.now() - startTime;
    
    await recordPerformanceMetric(
      agentType,
      methodName,
      executionTime,
      success,
      errorType,
      traceId,
      metadata
    );
  }
}

/**
 * 🔧 Utility to add performance tracking to existing agent instances
 */
export function addPerformanceTracking(
  agentInstance: any,
  agentType: string,
  methodNames: string[]
): void {
  methodNames.forEach(methodName => {
    const originalMethod = agentInstance[methodName];
    if (typeof originalMethod !== 'function') return;
    
    agentInstance[methodName] = async function (...args: any[]) {
      return withPerformanceTracking(
        agentType,
        methodName,
        () => originalMethod.apply(this, args),
        {
          instanceId: agentInstance.agentId || 'unknown',
          argsCount: args.length
        }
      );
    };
  });
  
  console.log(`📊 [PERF INTEGRATION] Added performance tracking to ${methodNames.length} methods in ${agentType}`);
}

/**
 * 📈 Batch performance tracking setup
 */
export function setupBatchPerformanceTracking(agents: {
  [agentType: string]: {
    instance: any;
    methods: string[];
  };
}): void {
  console.log('📊 [PERF INTEGRATION] Setting up batch performance tracking...');
  
  Object.entries(agents).forEach(([agentType, config]) => {
    addPerformanceTracking(config.instance, agentType, config.methods);
  });
  
  console.log(`✅ [PERF INTEGRATION] Performance tracking setup complete for ${Object.keys(agents).length} agents`);
}

/**
 * 🎯 Enhanced initialization with performance monitoring
 */
export async function initializePerformanceIntegration(): Promise<void> {
  console.log('🚀 [PERF INTEGRATION] Initializing performance integration...');
  
  try {
    // Import and start dashboard monitoring
    const { startPerformanceMonitoring } = await import('./performance-dashboard');
    startPerformanceMonitoring(30000); // 30 second intervals
    
    console.log('✅ [PERF INTEGRATION] Performance integration initialized successfully');
    
  } catch (error) {
    console.error('❌ [PERF INTEGRATION] Failed to initialize performance integration:', error);
    throw error;
  }
}

/**
 * 📊 Get integration status
 */
export function getPerformanceIntegrationStatus(): {
  enabled: boolean;
  trackedAgents: number;
  activeMonitoring: boolean;
  lastUpdate: string;
} {
  return {
    enabled: true,
    trackedAgents: 0, // Will be updated by actual usage
    activeMonitoring: true,
    lastUpdate: new Date().toISOString()
  };
}