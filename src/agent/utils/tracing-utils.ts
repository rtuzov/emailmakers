/**
 * 📊 OPENAI AGENTS SDK TRACING UTILITIES
 * 
 * Официальные утилиты для трейсинга OpenAI Agents SDK
 * Используют встроенную функциональность SDK согласно документации
 * https://github.com/openai/openai-agents-js/docs/guides/tracing.mdx
 */

import { withTrace, addTraceProcessor, setTraceProcessors } from '@openai/agents';
import { getGlobalTraceProvider } from '@openai/agents';

export interface TraceMetadata {
  agent?: string;
  operation?: string;
  component_type?: 'agent' | 'tool' | 'service';
  workflow_stage?: string;
  user_id?: string;
  session_id?: string;
  task_type?: string;
  language?: string;
  tone?: string;
  [key: string]: any;
}

/**
 * Создает trace_id в правильном формате согласно SDK
 * Формат: trace_<32_alphanumeric>
 */
export function generateTraceId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'trace_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Создает RunConfig для OpenAI Agents SDK
 * Использует официальную структуру RunConfig
 */
export function createRunConfig(
  workflowName: string,
  metadata?: TraceMetadata,
  options?: {
    includeSensitiveData?: boolean;
    groupId?: string;
    disabled?: boolean;
    traceId?: string;
  }
) {
  return {
    workflowName,
    traceIncludeSensitiveData: options?.includeSensitiveData ?? false,
    tracingDisabled: options?.disabled ?? false,
    traceId: options?.traceId || generateTraceId(),
    groupId: options?.groupId,
    traceMetadata: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'email-makers-agents',
      version: '1.0.0',
      ...metadata
    }
  };
}

/**
 * Создает RunConfig для агента
 */
export function createAgentRunConfig(
  agentName: string,
  operation: string,
  metadata?: TraceMetadata
) {
  return createRunConfig(
    `Agent: ${agentName}`,
    {
      agent: agentName,
      operation,
      component_type: 'agent',
      workflow_stage: operation,
      ...metadata
    }
  );
}

/**
 * Создает RunConfig для API endpoint
 */
export function createAPIRunConfig(
  endpoint: string,
  method: string,
  metadata?: TraceMetadata
) {
  return createRunConfig(
    `API: ${method} ${endpoint}`,
    {
      endpoint,
      method,
      component_type: 'service',
      ...metadata
    }
  );
}

/**
 * Wrapper для выполнения функции с трейсингом через SDK
 * Использует официальный withTrace() API
 */
export async function withSDKTrace<T>(
  workflowName: string,
  executeFunction: () => Promise<T>,
  metadata?: TraceMetadata
): Promise<T> {
  try {
    // withTrace() принимает только workflow name и function
    return await withTrace(workflowName, executeFunction);
  } catch (importError) {
    console.warn('OpenAI Agents SDK not available, executing without tracing:', importError);
    return await executeFunction();
  }
}

/**
 * Wrapper для выполнения tool операций с логированием
 * SDK автоматически создает FunctionSpan для tool calls
 */
export async function withToolExecution<T>(
  toolName: string,
  functionName: string,
  executeFunction: () => Promise<T>,
  metadata?: { inputs?: any; [key: string]: any }
): Promise<T> {
  const spanName = `${toolName}.${functionName}`;
  console.log(`🔧 Executing tool function: ${spanName}`);
  
  try {
    // SDK автоматически создает FunctionSpan для tool calls
    const result = await executeFunction();
    console.log(`✅ Tool function completed: ${spanName}`);
    return result;
  } catch (error) {
    console.error(`❌ Tool function failed: ${spanName}`, error);
    throw error;
  }
}

/**
 * Wrapper для выполнения операций с трейсингом
 * Использует официальный withTrace() API
 */
export async function withOperationTrace<T>(
  operationName: string,
  executeFunction: () => Promise<T>,
  metadata?: { operation_type?: string; [key: string]: any }
): Promise<T> {
  return withSDKTrace(operationName, executeFunction);
}

/**
 * Legacy compatibility - async wrapper для трейсинга
 */
export async function tracedAsync<T>(
  config: { 
    toolName?: string; 
    name?: string; 
    operation?: string; 
    params?: any; 
    metadata?: any 
  },
  fn: () => Promise<T>
): Promise<T> {
  const operationName = config.name || config.toolName || config.operation || 'operation';
  return withSDKTrace(operationName, fn);
}

/**
 * Настройка глобального TraceProvider
 * Добавляет дополнительные процессоры трейсинга
 */
export async function configureTracing(options?: {
  additionalProcessors?: any[];
  replaceProcessors?: any[];
  enableDebugLogging?: boolean;
}) {
  try {
    if (options?.enableDebugLogging) {
      // Включаем debug логирование согласно документации
      process.env.DEBUG = 'openai-agents*';
    }
    
    if (options?.replaceProcessors) {
      setTraceProcessors(options.replaceProcessors);
    } else if (options?.additionalProcessors) {
      for (const processor of options.additionalProcessors) {
        addTraceProcessor(processor);
      }
    }
    
    console.log('📊 OpenAI Agents SDK tracing configured');
    
  } catch (importError) {
    console.warn('OpenAI Agents SDK not available for tracing configuration:', importError);
  }
}

/**
 * Получает информацию о текущем trace
 */
export async function getCurrentTraceInfo() {
  try {
    const traceProvider = getGlobalTraceProvider();
    
    // Пытаемся получить информацию о текущем trace
    return {
      provider: traceProvider,
      available: true
    };
  } catch (importError) {
    console.warn('OpenAI Agents SDK not available for trace info:', importError);
    return {
      provider: null,
      available: false
    };
  }
}

/**
 * Simple delay function for retry logic
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  
  return Promise.race([fn(), timeout]);
}

/**
 * Execute with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  operation: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ ${operation} failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        await delay(delayMs * attempt); // Exponential backoff
      }
    }
  }
  
  throw new Error(`${operation} failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Legacy compatibility - статистика трейсинга
 */
export const tracingStats = {
  recordTrace: (data: {
    tool?: string;
    operation?: string;
    duration?: number;
    success?: boolean;
    error?: any;
  }) => {
    console.log('📊 Trace recorded (legacy):', data);
  },
  
  getStats: () => ({
    totalTraces: 0,
    successRate: 1.0,
    averageDuration: 0
  })
};

// Legacy exports для обратной совместимости
export const executeToolWithTrace = withToolExecution;
export const recordToolUsage = tracingStats.recordTrace;
export const withToolTrace = withSDKTrace;
