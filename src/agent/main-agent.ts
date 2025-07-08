/**
 * 🤖 MAIN EMAIL-MAKERS AGENT
 * 
 * Primary entry point for the Email-Makers AI agent system
 * Uses the optimized tool-registry.ts with specialist agents
 * 
 * Architecture:
 * - Content Specialist → Design Specialist → Quality Specialist → Delivery Specialist
 * - Pure OpenAI Agents SDK approach
 * - Centralized tool registry with specialist separation
 */

import { run } from '@openai/agents';
import {
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent,
  getWorkflowSequence,
  getRegistryStatistics,
  getAgentBySpecialist,
  allSpecialistTools
} from './core/tool-registry';
import { EmailCampaignOrchestrator } from './specialists/specialist-agents';

// ============================================================================
// MAIN AGENT CLASS
// ============================================================================

export class EmailMakersAgent {
  private orchestrator: EmailCampaignOrchestrator;

  constructor() {
    this.orchestrator = new EmailCampaignOrchestrator();
    this.logSystemStatus();
  }

  /**
   * Initialize the agent system
   */
  async initialize(): Promise<void> {
    await this.orchestrator.initialize();
    console.log('✅ Email-Makers Agent initialized successfully');
  }

  /**
   * Process an email campaign request
   */
  async processRequest(request: string, options?: {
    specialist?: 'content' | 'design' | 'quality' | 'delivery';
    traceId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      // If specific specialist requested, use that agent directly
      if (options?.specialist) {
        const agent = getAgentBySpecialist(options.specialist);
        console.log(`🎯 Using ${options.specialist} specialist directly`);
        return await run(agent, request);
      }

      // Otherwise use full orchestrator workflow
      console.log('🚀 Starting full workflow orchestration');
      return await this.orchestrator.processRequest(request, {
        traceId: options?.traceId,
        metadata: options?.metadata
      });
    } catch (error) {
      console.error('❌ Agent processing error:', error);
      throw error;
    }
  }

  /**
   * Get agent capabilities and statistics
   */
  getCapabilities() {
    const stats = getRegistryStatistics();
    const workflow = getWorkflowSequence();
    
    return {
      system: 'Email-Makers AI Agent',
      version: '2.0.0',
      architecture: 'OpenAI Agents SDK + Specialist Pattern',
      statistics: stats,
      workflow: workflow.map(phase => ({
        specialist: phase.specialist,
        description: phase.description,
        tools_count: phase.tools.length
      })),
      available_specialists: ['content', 'design', 'quality', 'delivery'],
      total_tools: stats.total_tools,
      total_agents: stats.total_agents
    };
  }

  /**
   * Get specific specialist agent
   */
  getSpecialist(type: 'content' | 'design' | 'quality' | 'delivery') {
    return getAgentBySpecialist(type);
  }

  /**
   * Run specific specialist directly
   */
  async runSpecialist(
    type: 'content' | 'design' | 'quality' | 'delivery',
    request: string
  ) {
    const agent = this.getSpecialist(type);
    console.log(`🎯 Running ${type} specialist`);
    return await run(agent, request);
  }

  /**
   * Log system status
   */
  private logSystemStatus(): void {
    const stats = getRegistryStatistics();
    console.log('🔧 Email-Makers Agent System Status:');
    console.log(`   📊 Total Tools: ${stats.total_tools}`);
    console.log(`   👥 Specialist Agents: ${stats.total_agents}`);
    console.log(`   🔄 Workflow Phases: ${stats.workflow_phases}`);
    console.log(`   🔗 Handoff Connections: ${stats.handoff_connections}`);
    console.log('   ✅ System Ready');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick email generation function
 */
export async function generateEmail(topic: string): Promise<any> {
  const agent = new EmailMakersAgent();
  await agent.initialize();
  return await agent.processRequest(topic);
}

/**
 * Generate email with specific specialist
 */
export async function generateWithSpecialist(
  topic: string,
  specialist: 'content' | 'design' | 'quality' | 'delivery'
): Promise<any> {
  const agent = new EmailMakersAgent();
  await agent.initialize();
  return await agent.processRequest(topic, { specialist });
}

/**
 * Get system information
 */
export function getSystemInfo() {
  const agent = new EmailMakersAgent();
  return agent.getCapabilities();
}

// ============================================================================
// EXPORTS
// ============================================================================

// Main agent class
export { EmailMakersAgent as default };

// Individual specialist agents
export {
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent
};

// Utility functions
export {
  getWorkflowSequence,
  getRegistryStatistics,
  getAgentBySpecialist,
  allSpecialistTools
};

// Orchestrator
export { EmailCampaignOrchestrator };

// ============================================================================
// SYSTEM INITIALIZATION
// ============================================================================

console.log('📦 Email-Makers Main Agent loaded');
console.log('🎯 Using tool-registry.ts as primary tool source');
console.log('🏗️ Architecture: OpenAI Agents SDK + Specialist Pattern'); 