/**
 * 🔍 ENHANCED TRACING SYSTEM
 * 
 * Расширенная система трассировки для полного отслеживания функций в агентах
 * Интегрируется с OpenAI Agents SDK и сохраняет все handoffs
 * Делает видимыми все ключевые функции в логах OpenAI
 */

import { 
  withTrace, 
  createCustomSpan, 
  createFunctionSpan, 
  createGenerationSpan,
  getGlobalTraceProvider 
} from '@openai/agents';
import { generateTraceId, TraceMetadata } from '../utils/tracing-utils';
import { getLogger } from '../../shared/logger';
import fs from 'fs';
import path from 'path';

const logger = getLogger({ component: 'enhanced-tracing' });

// 🎯 ДЕТАЛЬНАЯ ТРАССИРОВКА ФУНКЦИЙ
export interface FunctionTraceData {
  functionName: string;
  agentType: string;
  agentId: string;
  inputs: any;
  outputs?: any;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  openaiSpanId?: string;
  sequence: number;
  parentFunction?: string;
  depth: number;
}

// 🔄 ТРАССИРОВКА HANDOFFS
export interface HandoffTraceData {
  handoffId: string;
  fromAgent: string;
  toAgent: string;
  handoffData: any;
  validationResults?: any;
  timestamp: number;
  success: boolean;
  error?: string;
  sequence: number;
}

// 📊 ПОЛНАЯ ТРАССИРОВКА АГЕНТА
export interface AgentExecutionTrace {
  traceId: string;
  agentType: string;
  agentId: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  functions: FunctionTraceData[];
  handoffs: HandoffTraceData[];
  metadata: Record<string, any>;
  openaiTraceId?: string;
  totalFunctions: number;
  totalHandoffs: number;
  performanceMetrics: {
    avgFunctionDuration: number;
    slowestFunction: string;
    fastestFunction: string;
    errorRate: number;
    successRate: number;
  };
}

/**
 * 🔍 ENHANCED TRACING SYSTEM
 * 
 * Singleton для комплексной трассировки всех функций агентов
 */
class EnhancedTracingSystem {
  private static instance: EnhancedTracingSystem;
  private activeTraces: Map<string, AgentExecutionTrace> = new Map();
  private globalSequenceCounter: number = 0;
  private functionDepthMap: Map<string, number> = new Map();

  private constructor() {
    logger.info('🔍 Enhanced Tracing System initialized');
  }

  static getInstance(): EnhancedTracingSystem {
    if (!EnhancedTracingSystem.instance) {
      EnhancedTracingSystem.instance = new EnhancedTracingSystem();
    }
    return EnhancedTracingSystem.instance;
  }

  /**
   * 🚀 Начать трассировку агента
   */
  startAgentTrace(
    agentType: string,
    workflowId: string,
    metadata: Record<string, any> = {}
  ): string {
    const traceId = generateTraceId();
    const startTime = Date.now();

    // Создаем OpenAI Trace
    const openaiTraceId = this.createOpenAITrace(agentType, workflowId);

    const trace: AgentExecutionTrace = {
      traceId,
      agentType,
      agentId: metadata.agentId || 'unknown',
      workflowId,
      startTime,
      success: false,
      functions: [],
      handoffs: [],
      metadata,
      openaiTraceId,
      totalFunctions: 0,
      totalHandoffs: 0,
      performanceMetrics: {
        avgFunctionDuration: 0,
        slowestFunction: '',
        fastestFunction: '',
        errorRate: 0,
        successRate: 0
      }
    };

    this.activeTraces.set(traceId, trace);
    
    console.log(`🔍 ============ AGENT TRACE STARTED ============`);
    console.log(`🤖 Agent: ${agentType}`);
    console.log(`🆔 Trace ID: ${traceId}`);
    console.log(`🔗 Workflow ID: ${workflowId}`);
    console.log(`⏰ Start Time: ${new Date(startTime).toISOString()}`);
    console.log(`📊 OpenAI Trace ID: ${openaiTraceId}`);
    console.log(`===============================================`);

    return traceId;
  }

  /**
   * 🎯 Трассировка функции с OpenAI интеграцией
   */
  async traceFunction<T>(
    traceId: string,
    functionName: string,
    inputs: any,
    executor: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    const sequence = ++this.globalSequenceCounter;
    const depth = this.calculateFunctionDepth(traceId, functionName);
    const startTime = Date.now();
    const sanitizedInputs = this.sanitizeData(inputs);

    // Создаем OpenAI Function Span
    const openaiSpanId = await this.createOpenAIFunctionSpan(
      functionName,
      sanitizedInputs,
      trace.openaiTraceId
    );

    const functionTrace: FunctionTraceData = {
      functionName,
      agentType: trace.agentType,
      agentId: trace.agentId,
      inputs: sanitizedInputs,
      startTime,
      success: false,
      sequence,
      depth,
      openaiSpanId,
      ...metadata
    };

    // Логируем начало функции
    this.logFunctionStart(functionTrace);

    try {
      // Выполняем функцию с OpenAI tracing
      const result = await withTrace(
        { 
          name: `${trace.agentType}-${functionName}`,
          metadata: { 
            ...metadata, 
            functionName, 
            sequence,
            agentType: trace.agentType
          }
        },
        async () => {
          return await executor();
        }
      );

      // Успешное завершение
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      functionTrace.endTime = endTime;
      functionTrace.duration = duration;
      functionTrace.success = true;
      functionTrace.outputs = this.sanitizeData(result);

      // Завершаем OpenAI Span
      await this.completeOpenAIFunctionSpan(openaiSpanId, result, true);

      // Логируем успешное завершение
      this.logFunctionEnd(functionTrace);

      // Сохраняем трассировку
      trace.functions.push(functionTrace);
      trace.totalFunctions++;
      
      return result;

    } catch (error) {
      // Обработка ошибки
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      functionTrace.endTime = endTime;
      functionTrace.duration = duration;
      functionTrace.success = false;
      functionTrace.error = error instanceof Error ? error.message : String(error);

      // Завершаем OpenAI Span с ошибкой
      await this.completeOpenAIFunctionSpan(openaiSpanId, null, false, error);

      // Логируем ошибку
      this.logFunctionError(functionTrace);

      // Сохраняем трассировку
      trace.functions.push(functionTrace);
      trace.totalFunctions++;
      
      throw error;
    } finally {
      this.updateFunctionDepth(traceId, functionName, false);
    }
  }

  /**
   * 🔄 Трассировка handoff между агентами
   */
  async traceHandoff(
    traceId: string,
    fromAgent: string,
    toAgent: string,
    handoffData: any,
    validationResults?: any
  ): Promise<string> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    const handoffId = `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sequence = ++this.globalSequenceCounter;
    const timestamp = Date.now();

    // Создаем OpenAI Handoff Span
    const openaiSpanId = await this.createOpenAIHandoffSpan(
      fromAgent,
      toAgent,
      handoffData,
      trace.openaiTraceId
    );

    const handoffTrace: HandoffTraceData = {
      handoffId,
      fromAgent,
      toAgent,
      handoffData: this.sanitizeData(handoffData),
      validationResults,
      timestamp,
      success: true,
      sequence
    };

    // Логируем handoff
    this.logHandoff(handoffTrace);

    // Сохраняем трассировку
    trace.handoffs.push(handoffTrace);
    trace.totalHandoffs++;

    return handoffId;
  }

  /**
   * 🏁 Завершить трассировку агента
   */
  endAgentTrace(traceId: string, success: boolean, error?: string): AgentExecutionTrace | null {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return null;
    }

    const endTime = Date.now();
    trace.endTime = endTime;
    trace.duration = endTime - trace.startTime;
    trace.success = success;
    trace.error = error;

    // Вычисляем метрики производительности
    trace.performanceMetrics = this.calculatePerformanceMetrics(trace);

    // Выводим полную последовательность функций
    this.printFullExecutionSequence(trace);

    // Завершаем OpenAI Trace
    this.completeOpenAITrace(trace.openaiTraceId, success, error);

    console.log(`🏁 ============ AGENT TRACE COMPLETED ============`);
    console.log(`🤖 Agent: ${trace.agentType}`);
    console.log(`🆔 Trace ID: ${traceId}`);
    console.log(`✅ Success: ${success}`);
    console.log(`⏱️ Duration: ${trace.duration}ms`);
    console.log(`📊 Total Functions: ${trace.totalFunctions}`);
    console.log(`🔄 Total Handoffs: ${trace.totalHandoffs}`);
    console.log(`📈 Success Rate: ${trace.performanceMetrics.successRate}%`);
    console.log(`===============================================`);

    return trace;
  }

  /**
   * 📊 Получить активную трассировку
   */
  getActiveTrace(traceId: string): AgentExecutionTrace | null {
    return this.activeTraces.get(traceId) || null;
  }

  /**
   * 💾 Сохранить трассировку в файл
   */
  async saveTraceToFile(traceId: string, filePath?: string): Promise<string | null> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      return null;
    }

    const fileName = filePath || `trace-${traceId}-${Date.now()}.json`;
    const fullPath = path.join(process.cwd(), 'logs', fileName);

    try {
      // Создаем директорию если не существует
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Сохраняем трассировку
      await fs.promises.writeFile(fullPath, JSON.stringify(trace, null, 2));
      
      console.log(`💾 Trace saved to: ${fullPath}`);
      return fullPath;
    } catch (error) {
      console.error('❌ Failed to save trace:', error);
      return null;
    }
  }

  /**
   * 🔍 Создать OpenAI Trace
   */
  private createOpenAITrace(agentType: string, workflowId: string): string {
    try {
      const traceProvider = getGlobalTraceProvider();
      const trace = traceProvider.createTrace({
        metadata: {
          agentType,
          workflowId,
          workflowName: `${agentType}-workflow`,
          timestamp: new Date().toISOString()
        }
      });
      return trace.traceId;
    } catch (error) {
      console.warn('⚠️ Failed to create OpenAI trace:', error);
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * 🎯 Создать OpenAI Function Span
   */
  private async createOpenAIFunctionSpan(
    functionName: string,
    inputs: any,
    traceId?: string
  ): Promise<string> {
    try {
      const span = await createFunctionSpan({
        data: {
          name: functionName,
          input: inputs,
          traceId,
          timestamp: new Date().toISOString()
        }
      });
      return span.spanId || `span-${Date.now()}`;
    } catch (error) {
      console.warn('⚠️ Failed to create OpenAI function span:', error);
      return `fallback-span-${Date.now()}`;
    }
  }

  /**
   * 🔄 Создать OpenAI Handoff Span
   */
  private async createOpenAIHandoffSpan(
    fromAgent: string,
    toAgent: string,
    handoffData: any,
    traceId?: string
  ): Promise<string> {
    try {
      const span = await createCustomSpan({
        data: {
          name: `handoff-${fromAgent}-to-${toAgent}`,
          fromAgent,
          toAgent,
          handoffData,
          traceId,
          timestamp: new Date().toISOString()
        }
      });
      return span.spanId || `handoff-${Date.now()}`;
    } catch (error) {
      console.warn('⚠️ Failed to create OpenAI handoff span:', error);
      return `fallback-handoff-${Date.now()}`;
    }
  }

  /**
   * ✅ Завершить OpenAI Function Span
   */
  private async completeOpenAIFunctionSpan(
    spanId: string,
    result: any,
    success: boolean,
    error?: any
  ): Promise<void> {
    try {
      // В реальной реализации здесь был бы вызов SDK для завершения span
      logger.info(`Function span completed: ${spanId}`, {
        success,
        error: error?.message
      });
    } catch (err) {
      console.warn('⚠️ Failed to complete OpenAI function span:', err);
    }
  }

  /**
   * 🏁 Завершить OpenAI Trace
   */
  private completeOpenAITrace(traceId?: string, success?: boolean, error?: string): void {
    try {
      logger.info(`OpenAI trace completed: ${traceId}`, {
        success,
        error
      });
    } catch (err) {
      console.warn('⚠️ Failed to complete OpenAI trace:', err);
    }
  }

  /**
   * 📊 Вычислить метрики производительности
   */
  private calculatePerformanceMetrics(trace: AgentExecutionTrace): any {
    const functions = trace.functions;
    if (functions.length === 0) {
      return {
        avgFunctionDuration: 0,
        slowestFunction: '',
        fastestFunction: '',
        errorRate: 0,
        successRate: 100
      };
    }

    const durations = functions.map(f => f.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    
    const slowest = functions.reduce((a, b) => 
      (a.duration || 0) > (b.duration || 0) ? a : b
    );
    
    const fastest = functions.reduce((a, b) => 
      (a.duration || 0) < (b.duration || 0) ? a : b
    );

    const successCount = functions.filter(f => f.success).length;
    const successRate = (successCount / functions.length) * 100;
    const errorRate = 100 - successRate;

    return {
      avgFunctionDuration: Math.round(avgDuration),
      slowestFunction: slowest.functionName,
      fastestFunction: fastest.functionName,
      errorRate: Math.round(errorRate),
      successRate: Math.round(successRate)
    };
  }

  /**
   * 📋 Вывести полную последовательность выполнения
   */
  private printFullExecutionSequence(trace: AgentExecutionTrace): void {
    console.log(`\n🔍 ========== FULL EXECUTION SEQUENCE ==========`);
    console.log(`🤖 Agent: ${trace.agentType} (${trace.agentId})`);
    console.log(`⏱️ Total Duration: ${trace.duration}ms`);
    console.log(`📊 Functions: ${trace.totalFunctions} | Handoffs: ${trace.totalHandoffs}`);
    console.log(`===============================================`);

    // Объединяем функции и handoffs для полной последовательности
    const allEvents = [
      ...trace.functions.map(f => ({ ...f, type: 'function' })),
      ...trace.handoffs.map(h => ({ ...h, type: 'handoff' }))
    ].sort((a, b) => a.sequence - b.sequence);

    allEvents.forEach((event, index) => {
      if (event.type === 'function') {
        const f = event as FunctionTraceData & { type: string };
        const indent = '  '.repeat(f.depth);
        const status = f.success ? '✅' : '❌';
        const duration = f.duration ? `${f.duration}ms` : 'N/A';
        
        console.log(`${indent}${index + 1}. ${status} ${f.functionName} (${duration})`);
        
        if (f.inputs && Object.keys(f.inputs).length > 0) {
          console.log(`${indent}   📥 Input: ${JSON.stringify(f.inputs).slice(0, 100)}...`);
        }
        
        if (f.outputs && Object.keys(f.outputs).length > 0) {
          console.log(`${indent}   📤 Output: ${JSON.stringify(f.outputs).slice(0, 100)}...`);
        }
        
        if (f.error) {
          console.log(`${indent}   ❌ Error: ${f.error}`);
        }
      } else if (event.type === 'handoff') {
        const h = event as HandoffTraceData & { type: string };
        console.log(`${index + 1}. 🔄 HANDOFF: ${h.fromAgent} → ${h.toAgent}`);
        
        if (h.handoffData && Object.keys(h.handoffData).length > 0) {
          console.log(`   📦 Data: ${JSON.stringify(h.handoffData).slice(0, 100)}...`);
        }
      }
    });

    console.log(`===============================================\n`);
  }

  /**
   * 🚀 Логировать начало функции
   */
  private logFunctionStart(functionTrace: FunctionTraceData): void {
    const indent = '  '.repeat(functionTrace.depth);
    console.log(`${indent}🚀 [${functionTrace.sequence}] ${functionTrace.functionName} STARTED`);
    console.log(`${indent}   🤖 Agent: ${functionTrace.agentType}`);
    console.log(`${indent}   ⏰ Time: ${new Date(functionTrace.startTime).toISOString()}`);
    
    if (functionTrace.inputs && Object.keys(functionTrace.inputs).length > 0) {
      console.log(`${indent}   📥 Inputs: ${JSON.stringify(functionTrace.inputs).slice(0, 200)}...`);
    }
  }

  /**
   * ✅ Логировать завершение функции
   */
  private logFunctionEnd(functionTrace: FunctionTraceData): void {
    const indent = '  '.repeat(functionTrace.depth);
    console.log(`${indent}✅ [${functionTrace.sequence}] ${functionTrace.functionName} COMPLETED (${functionTrace.duration}ms)`);
    
    if (functionTrace.outputs && Object.keys(functionTrace.outputs).length > 0) {
      console.log(`${indent}   📤 Outputs: ${JSON.stringify(functionTrace.outputs).slice(0, 200)}...`);
    }
  }

  /**
   * ❌ Логировать ошибку функции
   */
  private logFunctionError(functionTrace: FunctionTraceData): void {
    const indent = '  '.repeat(functionTrace.depth);
    console.log(`${indent}❌ [${functionTrace.sequence}] ${functionTrace.functionName} FAILED (${functionTrace.duration}ms)`);
    console.log(`${indent}   💥 Error: ${functionTrace.error}`);
  }

  /**
   * 🔄 Логировать handoff
   */
  private logHandoff(handoffTrace: HandoffTraceData): void {
    console.log(`🔄 [${handoffTrace.sequence}] HANDOFF: ${handoffTrace.fromAgent} → ${handoffTrace.toAgent}`);
    console.log(`   🆔 Handoff ID: ${handoffTrace.handoffId}`);
    console.log(`   ⏰ Time: ${new Date(handoffTrace.timestamp).toISOString()}`);
    
    if (handoffTrace.handoffData && Object.keys(handoffTrace.handoffData).length > 0) {
      console.log(`   📦 Data: ${JSON.stringify(handoffTrace.handoffData).slice(0, 200)}...`);
    }
  }

  /**
   * 🧹 Очистить данные для логирования
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    try {
      const str = JSON.stringify(data);
      if (str.length > 5000) {
        return { 
          _truncated: true, 
          _originalLength: str.length,
          _preview: str.slice(0, 1000) + '...'
        };
      }
      return data;
    } catch (error) {
      return { _error: 'Failed to serialize data', _type: typeof data };
    }
  }

  /**
   * 📏 Вычислить глубину функции
   */
  private calculateFunctionDepth(traceId: string, functionName: string): number {
    const key = `${traceId}-${functionName}`;
    const current = this.functionDepthMap.get(key) || 0;
    this.functionDepthMap.set(key, current + 1);
    return current;
  }

  /**
   * 📏 Обновить глубину функции
   */
  private updateFunctionDepth(traceId: string, functionName: string, increment: boolean): void {
    const key = `${traceId}-${functionName}`;
    const current = this.functionDepthMap.get(key) || 0;
    
    if (increment) {
      this.functionDepthMap.set(key, current + 1);
    } else {
      this.functionDepthMap.set(key, Math.max(0, current - 1));
    }
  }

  /**
   * 📈 Получает статистику системы трассировки
   */
  getSystemStats(): {
    activeAgents: number;
    totalTraces: number;
    totalFunctions: number;
    totalHandoffs: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const activeTraces = Array.from(this.activeTraces.values());
    const totalFunctions = activeTraces.reduce((sum, trace) => sum + trace.totalFunctions, 0);
    const totalHandoffs = activeTraces.reduce((sum, trace) => sum + trace.totalHandoffs, 0);
    const totalExecutionTime = activeTraces.reduce((sum, trace) => sum + (trace.duration || 0), 0);
    const successfulTraces = activeTraces.filter(trace => trace.success).length;

    return {
      activeAgents: activeTraces.length,
      totalTraces: activeTraces.length,
      totalFunctions,
      totalHandoffs,
      averageExecutionTime: activeTraces.length > 0 ? totalExecutionTime / activeTraces.length : 0,
      successRate: activeTraces.length > 0 ? (successfulTraces / activeTraces.length) * 100 : 0
    };
  }
}

// Экспортируем singleton
export const enhancedTracing = EnhancedTracingSystem.getInstance();







