/**
 * Core Orchestrator for Multi-Agent Email Generation Workflow
 * Coordinates the execution of Content, Design, Quality, and Delivery specialists
 * 
 * Features:
 * - Sequential agent handoffs with feedback loops
 * - Quality evaluation and retry mechanisms
 * - OpenAI Agent SDK tracing integration
 * - Performance monitoring and metrics
 * - Error handling and recovery
 */

import { run, Agent } from '@openai/agents';
import { createEmailCampaignOrchestrator } from '../specialists/specialist-agents';
import { toolRegistry } from './tool-registry';

export interface OrchestrationConfig {
  workflowName?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface OrchestrationResult {
  success: boolean;
  result?: any;
  error?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export class EmailCampaignOrchestrator {
  private orchestrator: Agent | null = null;

  async initialize(): Promise<void> {
    if (!this.orchestrator) {
      // Log Tool Registry status before initializing orchestrator
      console.log('🔧 Tool Registry Status:', toolRegistry.getToolStats());
      
      const { orchestrator } = await createEmailCampaignOrchestrator();
      this.orchestrator = orchestrator;
      
      console.log('✅ Email Campaign Orchestrator initialized with Tool Registry support');
    }
  }

  async processRequest(
    request: string,
    config: OrchestrationConfig = {}
  ): Promise<OrchestrationResult> {
    try {
      await this.initialize();
      
      if (!this.orchestrator) {
        throw new Error('Orchestrator not initialized');
      }

      const result = await run(this.orchestrator, request);

      return {
        success: true,
        result: result.finalOutput,
        traceId: config.traceId,
        metadata: config.metadata
      };
    } catch (error) {
      console.error('Orchestration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        traceId: config.traceId,
        metadata: config.metadata
      };
    }
  }
}

// Singleton instance
export const emailCampaignOrchestrator = new EmailCampaignOrchestrator(); 