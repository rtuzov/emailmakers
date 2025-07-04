/**
 * 🔄 AGENT HANDOFFS COORDINATOR
 * 
 * Координирует передачу данных между агентами с расширенной трассировкой
 * Интегрируется с OpenAI Agents SDK для видимости в логах
 */

import { v4 as uuidv4 } from 'uuid';
import { generateTraceId } from '../utils/tracing-utils';
import { AgentHandoffValidationService, HandoffValidationResult } from './agent-handoff-validation-service';
import { enhancedTracing } from './enhanced-tracing';
import { withTrace, createCustomSpan } from '@openai/agents';
import { getLogger } from '../../shared/logger';

const logger = getLogger({ component: 'agent-handoffs' });

export interface HandoffRequest {
  fromAgent: string;
  toAgent: string;
  data: any;
  context: Record<string, any>;
  traceId?: string;
  workflowId?: string;
}

export interface HandoffResponse {
  success: boolean;
  data?: any;
  error?: string;
  handoffId: string;
  traceId: string;
}

/**
 * 🔄 AGENT HANDOFFS COORDINATOR
 * 
 * Координирует передачу данных между агентами с расширенной трассировкой
 * Интегрируется с OpenAI Agents SDK для видимости в логах
 */
export class AgentHandoffsCoordinator {
  private static instance: AgentHandoffsCoordinator;
  private validationService: AgentHandoffValidationService;
  private activeHandoffs: Map<string, HandoffRequest> = new Map();

  private constructor() {
    this.validationService = new AgentHandoffValidationService();
  }

  static getInstance(): AgentHandoffsCoordinator {
    if (!AgentHandoffsCoordinator.instance) {
      AgentHandoffsCoordinator.instance = new AgentHandoffsCoordinator();
    }
    return AgentHandoffsCoordinator.instance;
  }

  /**
   * 🔄 Выполняет handoff между агентами с полной трассировкой
   */
  async executeHandoff(request: HandoffRequest): Promise<HandoffResponse> {
    const handoffId = uuidv4();
    const traceId = request.traceId || generateTraceId();
    
    // Регистрируем handoff в enhanced tracing
    await enhancedTracing.traceHandoff(
      traceId,
      request.fromAgent,
      request.toAgent,
      request.data,
      request.context
    );

    try {
      // Используем OpenAI SDK tracing для видимости в логах
      return await withTrace(
        {
          name: `Agent Handoff: ${request.fromAgent} -> ${request.toAgent}`,
          metadata: {
            handoffId,
            fromAgent: request.fromAgent,
            toAgent: request.toAgent,
            workflowId: request.workflowId
          }
        },
        async () => {
          logger.info(`🔄 Starting handoff: ${request.fromAgent} -> ${request.toAgent}`, {
            handoffId,
            traceId,
            dataKeys: Object.keys(request.data || {})
          });

          // Сохраняем активный handoff
          this.activeHandoffs.set(handoffId, request);

          // Валидация данных handoff
          const validationResult = await this.tracedValidation(request, traceId);
          if (!validationResult.isValid) {
            throw new Error(`Handoff validation failed: ${validationResult.errors.join(', ')}`);
          }

          // Выполняем handoff
          const result = await this.performHandoff(request, handoffId, traceId);

          // Handoff успешно завершен - трассировка уже записана

          logger.info(`✅ Handoff completed successfully: ${request.fromAgent} -> ${request.toAgent}`, {
            handoffId,
            traceId,
            success: true
          });

          return result;
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Ошибка уже залогирована

      logger.error(`❌ Handoff failed: ${request.fromAgent} -> ${request.toAgent}`, {
        handoffId,
        traceId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        handoffId,
        traceId
      };
    } finally {
      // Очищаем активный handoff
      this.activeHandoffs.delete(handoffId);
    }
  }

  /**
   * 🔍 Валидация данных handoff с трассировкой
   */
  private async tracedValidation(request: HandoffRequest, traceId: string): Promise<HandoffValidationResult> {
    logger.debug(`🔍 Validating handoff data`, {
      fromAgent: request.fromAgent,
      toAgent: request.toAgent,
      traceId
    });

    const result = await this.validationService.validateHandoff(request);
    
    logger.debug(`🔍 Validation result: ${result.isValid ? 'VALID' : 'INVALID'}`, {
      fromAgent: request.fromAgent,
      toAgent: request.toAgent,
      traceId,
      errors: result.errors
    });

    return result;
  }

  /**
   * 🚀 Выполняет фактический handoff
   */
  private async performHandoff(
    request: HandoffRequest, 
    handoffId: string, 
    traceId: string
  ): Promise<HandoffResponse> {
    logger.info(`🚀 Executing handoff logic`, {
      handoffId,
      fromAgent: request.fromAgent,
      toAgent: request.toAgent,
      traceId
    });

    // Здесь должна быть логика передачи данных между агентами
    // Пока возвращаем успешный результат
    const result = {
      success: true,
      data: {
        ...request.data,
        handoffId,
        processedAt: new Date().toISOString(),
        fromAgent: request.fromAgent,
        toAgent: request.toAgent
      },
      handoffId,
      traceId
    };

    logger.info(`🚀 Handoff execution completed`, {
      handoffId,
      traceId,
      success: true
    });

    return result;
  }

  /**
   * 🧹 Очищает данные для логирования
   */
  private sanitizeDataForLogging(data: any): any {
    if (!data) return {};
    
    const sanitized = { ...data };
    
    // Удаляем чувствительные данные
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credentials'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    // Ограничиваем размер больших объектов
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
        sanitized[key] = sanitized[key].substring(0, 1000) + '... [TRUNCATED]';
      }
    });

    return sanitized;
  }

  /**
   * 📊 Получает статистику активных handoffs
   */
  getActiveHandoffsStats(): { count: number; handoffs: string[] } {
    const handoffs = Array.from(this.activeHandoffs.entries()).map(([id, request]) => 
      `${id}: ${request.fromAgent} -> ${request.toAgent}`
    );
    
    return {
      count: this.activeHandoffs.size,
      handoffs
    };
  }

  /**
   * 🔍 Получает детали активного handoff
   */
  getHandoffDetails(handoffId: string): HandoffRequest | undefined {
    return this.activeHandoffs.get(handoffId);
  }

  /**
   * 🧹 Очищает все активные handoffs (для тестирования)
   */
  clearActiveHandoffs(): void {
    this.activeHandoffs.clear();
  }
}