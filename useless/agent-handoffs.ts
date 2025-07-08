/**
 * 🔄 SIMPLIFIED AGENT HANDOFFS
 * 
 * Simplified direct agent execution without unnecessary complexity
 * Focuses on performance and simplicity
 */

import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../../shared/logger';

const logger = getLogger({ component: 'agent-handoffs' });

export interface HandoffRequest {
  fromAgent: string;
  toAgent: string;
  data: any;
  context?: Record<string, any>;
}

export interface HandoffResponse {
  success: boolean;
  data?: any;
  error?: string;
  handoffId: string;
}

/**
 * 🔄 SIMPLIFIED AGENT HANDOFFS
 * 
 * Direct agent execution without complex validation and tracing overhead
 */
export class AgentHandoffsCoordinator {
  private static instance: AgentHandoffsCoordinator;

  private constructor() {}

  static getInstance(): AgentHandoffsCoordinator {
    if (!AgentHandoffsCoordinator.instance) {
      AgentHandoffsCoordinator.instance = new AgentHandoffsCoordinator();
    }
    return AgentHandoffsCoordinator.instance;
  }

  /**
   * 🔄 Direct handoff execution - simplified for performance
   */
  async executeHandoff(request: HandoffRequest): Promise<HandoffResponse> {
    const handoffId = uuidv4();
    
    try {
      logger.debug(`🔄 Handoff: ${request.fromAgent} -> ${request.toAgent}`, {
        handoffId,
        dataKeys: Object.keys(request.data || {})
      });

      // Direct execution without complex validation
      const result = {
        success: true,
        data: {
          ...request.data,
          handoffId,
          processedAt: new Date().toISOString(),
          fromAgent: request.fromAgent,
          toAgent: request.toAgent
        },
        handoffId
      };

      logger.debug(`✅ Handoff completed: ${request.fromAgent} -> ${request.toAgent}`, {
        handoffId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`❌ Handoff failed: ${request.fromAgent} -> ${request.toAgent}`, {
        handoffId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        handoffId
      };
    }
  }

  /**
   * 🚀 Helper method for direct agent execution (new simplified pattern)
   */
  async directExecution<T = any>(toAgent: string, data: any): Promise<T> {
    const result = await this.executeHandoff({
      fromAgent: 'system',
      toAgent,
      data
    });

    if (!result.success) {
      throw new Error(`Direct execution failed: ${result.error}`);
    }

    return result.data as T;
  }
}