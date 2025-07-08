/**
 * Specialist Agents Module - Updated for OpenAI Agents SDK
 * 
 * Updated to use the new specialized agents from tool-registry.ts
 * Provides unified access to all specialist agents and orchestration
 * Includes orchestrator functionality for complete workflow management
 */

import { run, Agent } from '@openai/agents';
import { 
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent,
  getWorkflowSequence,
  getAgentBySpecialist,
  getRegistryStatistics
} from '../core/tool-registry';
import { promises as fs } from 'fs';
import path from 'path';
import {
  transferToContentSpecialist,
  transferToDesignSpecialist,
  transferToQualitySpecialist,
  transferToDeliverySpecialist
} from '../core/transfer-tools';

// ============================================================================
// SPECIALIST AGENTS ACCESS
// ============================================================================

/**
 * Get all specialist agents
 */
export function getSpecialistAgents() {
  return {
    contentSpecialist: contentSpecialistAgent,
    designSpecialist: designSpecialistAgent,
    qualitySpecialist: qualitySpecialistAgent,
    deliverySpecialist: deliverySpecialistAgent
  };
}

/**
 * Get specialist agent by type
 */
export function getSpecialistAgent(specialist: 'content' | 'design' | 'quality' | 'delivery'): Agent {
  return getAgentBySpecialist(specialist);
}

/**
 * Get workflow sequence for orchestration
 */
export function getEmailWorkflowSequence() {
  return getWorkflowSequence();
}

// ============================================================================
// ORCHESTRATOR SETUP
// ============================================================================

/**
 * Load orchestrator instructions from file
 */
async function loadOrchestratorInstructions(): Promise<string> {
  try {
    const instructionsPath = path.join(process.cwd(), 'src', 'agent', 'prompts', 'orchestrator', 'main-orchestrator.md');
    const instructions = await fs.readFile(instructionsPath, 'utf-8');
    console.log('📖 Loaded orchestrator instructions from:', instructionsPath);
    return instructions;
  } catch (error) {
    console.error('❌ Failed to load orchestrator instructions:', error);
    // Fallback to basic instructions
    return `You are the Email Campaign Orchestrator for Email-Makers. You coordinate the workflow between specialized agents to create high-quality email campaigns.

**Workflow Process:**
1. **Content Phase**: Start with Content Specialist for campaign creation and content generation
2. **Design Phase**: Hand off to Design Specialist for visual assets and MJML templates
3. **Quality Phase**: Transfer to Quality Specialist for validation and testing
4. **Delivery Phase**: Complete with Delivery Specialist for final packaging and delivery

**Orchestration Rules:**
- Always start with Content Specialist unless explicitly requested otherwise
- Follow the linear workflow: Content → Design → Quality → Delivery
- Monitor each phase for completion before moving to next
- Handle errors by providing clear feedback and retry instructions
- Maintain campaign context throughout the workflow

**Communication Style:**
- Professional and coordinating
- Provide clear status updates on workflow progress
- Explain which specialist is handling each phase
- Give estimated timelines when possible
- Celebrate successful completions

**Error Handling:**
- If a specialist reports issues, provide clear next steps
- Don't retry automatically - explain the problem and suggested solutions
- Maintain campaign integrity throughout error recovery
- Escalate complex issues with detailed context`;
  }
}

/**
 * Create email campaign orchestrator with all specialists
 */
export async function createEmailCampaignOrchestrator() {
  console.log('📖 Loading orchestrator instructions...');
  const instructions = await loadOrchestratorInstructions();
  
  const transferTools = [
    transferToContentSpecialist,
    transferToDesignSpecialist,
    transferToQualitySpecialist,
    transferToDeliverySpecialist
  ];
  
  const orchestrator = new Agent({
    name: 'Email Campaign Orchestrator',
    instructions: instructions,
    tools: transferTools,
    handoffs: [
      contentSpecialistAgent,
      designSpecialistAgent,
      qualitySpecialistAgent,
      deliverySpecialistAgent
    ]
  });

  console.log('✅ Email Campaign Orchestrator created with transfer functions and handoffs');

  return {
    orchestrator,
    contentSpecialist: contentSpecialistAgent,
    designSpecialist: designSpecialistAgent,
    qualitySpecialist: qualitySpecialistAgent,
    deliverySpecialist: deliverySpecialistAgent
  };
}

// ============================================================================
// ORCHESTRATION INTERFACES AND CLASSES
// ============================================================================

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
      
      const { orchestrator } = await createEmailCampaignOrchestrator();
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

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

/**
 * Singleton orchestrator instance
 */
export const emailCampaignOrchestrator = new EmailCampaignOrchestrator();

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility
 */
export async function createSpecialistAgents() {
  return getSpecialistAgents();
} 