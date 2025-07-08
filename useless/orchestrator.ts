/**
 * Core Orchestrator for Multi-Agent Email Generation Workflow
 * Coordinates the execution of Content, Design, Quality, and Delivery specialists
 * 
 * Updated for OpenAI Agents SDK with new specialist structure
 */

import { run, Agent } from '@openai/agents';
import { createEmailCampaignOrchestrator } from '../specialists/specialist-agents';
import { getRegistryStatistics, getWorkflowSequence } from './tool-registry';

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
      console.log('🔧 Tool Registry Statistics:', getRegistryStatistics());
      console.log('📋 Workflow Sequence:', getWorkflowSequence().map(s => s.specialist));
      
      const { orchestrator } = createEmailCampaignOrchestrator();
      this.orchestrator = orchestrator;
      
      console.log('✅ Email Campaign Orchestrator initialized with new specialist structure');
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

      console.log('🚀 Starting orchestration with request:', request.slice(0, 100) + '...');
      
      const result = await run(this.orchestrator, request);

      console.log('✅ Orchestration completed successfully');

      return {
        success: true,
        result: result.finalOutput,
        traceId: config.traceId,
        metadata: {
          ...config.metadata,
          workflow_completed: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ Orchestration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        traceId: config.traceId,
        metadata: {
          ...config.metadata,
          workflow_failed: true,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get orchestrator capabilities and workflow information
   */
  getCapabilities() {
    const workflowSequence = getWorkflowSequence();
    const stats = getRegistryStatistics();
    
    return {
      workflow_phases: workflowSequence.map(phase => ({
        specialist: phase.specialist,
        description: phase.description,
        tools_count: phase.tools.length
      })),
      total_tools: stats.total_tools,
      total_agents: stats.total_agents,
      workflow_phases_count: stats.workflow_phases,
      initialized: this.orchestrator !== null
    };
  }
}

// Singleton instance
export const emailCampaignOrchestrator = new EmailCampaignOrchestrator(); 