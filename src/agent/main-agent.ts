/**
 * 🤖 MAIN EMAIL-MAKERS AGENT - OpenAI Agents SDK Compatible
 * 
 * Primary entry point for the Email-Makers AI agent system
 * Uses proper OpenAI Agents SDK handoffs for multi-agent workflow
 * 
 * Architecture:
 * - Entry Point: Data Collection Specialist
 * - Automatic Handoffs: Data Collection → Content → Design → Quality → Delivery
 * - Pure OpenAI Agents SDK approach with built-in context flow
 * - No manual orchestration needed - SDK handles workflow
 * 
 * ✅ FIXED: Using proper SDK handoffs without orchestrator
 */

import { run, Agent } from '@openai/agents';
import {
  dataCollectionSpecialistAgent,
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent,
  getWorkflowSequence,
  getRegistryStatistics,
  getAgentBySpecialist
} from './core/tool-registry';
import { createEmailCampaignOrchestrator } from './specialists/specialist-agents';
import { cleanupLogger } from './core/agent-logger';

// ============================================================================
// MAIN AGENT CLASS
// ============================================================================

export class EmailMakersAgent {
  private entryAgent: Agent | null = null;
  private orchestrator: any;

  constructor() {
    // Entry agent will be set during initialization
    console.log('🔧 Email-Makers Agent initializing...');
  }

  /**
   * Initialize the agent system with orchestrator
   */
  async initialize(): Promise<void> {
    console.log('📖 Loading orchestrator...');
    const { orchestrator } = await createEmailCampaignOrchestrator();
    this.orchestrator = orchestrator;
    this.entryAgent = orchestrator;
    
    console.log('✅ Email-Makers Agent initialized with Orchestrator entry point');
    console.log('🎯 Entry Point: Email Campaign Orchestrator');
    console.log('🔗 Workflow: Orchestrator → Data Collection → Content → Design → Quality → Delivery');
    this.logSystemStatus();
  }

  /**
   * Process an email campaign request
   */
  async processRequest(request: string, options?: {
    specialist?: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery';
    traceId?: string;
    metadata?: Record<string, any>;
    context?: Record<string, any>;
  }): Promise<any> {
    try {
      // Ensure system is initialized
      if (!this.entryAgent) {
        await this.initialize();
      }

      // If specific specialist requested, use that agent directly
      if (options?.specialist) {
        const agent = getAgentBySpecialist(options.specialist);
        console.log(`🎯 Using ${options.specialist} specialist directly`);
        
        // Create context for direct specialist access
        const specialistContext = {
          specialistMode: true,
          requestedSpecialist: options.specialist,
          traceId: options?.traceId,
          metadata: options?.metadata,
          ...options?.context
        };
        
        console.log('🔄 Passing context to specialist:', Object.keys(specialistContext));
        return await run(agent, request, { 
          context: specialistContext,
          maxTurns: 20
        });
      }

      // Use full workflow starting from Orchestrator
      // Orchestrator creates campaign folder then hands off to specialists
      console.log('🚀 Starting full workflow with Orchestrator coordination');
      
      const workflowContext = {
        workflowType: 'full-campaign',
        startTime: new Date().toISOString(),
        traceId: options?.traceId,
        metadata: options?.metadata,
        ...options?.context
      };

      const result = await run(this.entryAgent!, request, {
        context: workflowContext,
        maxTurns: 50 // Increased for complex multi-agent workflows
      });

      console.log('✅ Full workflow completed via Orchestrator coordination');
      return result;
      
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
      version: '3.1.0',
      architecture: 'Orchestrator + OpenAI Agents SDK Handoffs',
      entryPoint: 'Email Campaign Orchestrator',
      handoffChain: 'Orchestrator → Data Collection → Content → Design → Quality → Delivery',
      statistics: stats,
      workflow: workflow.map(phase => ({
        specialist: phase.specialist,
        description: phase.description,
        tools_count: phase.tools.length
      })),
      available_specialists: ['data-collection', 'content', 'design', 'quality', 'delivery'],
      totalTools: stats.totalTools,
      totalAgents: stats.totalAgents + 1, // +1 for orchestrator
      hasHandoffs: stats.hasHandoffs,
      sdkCompliant: stats.sdkCompliant,
      hasOrchestrator: true
    };
  }

  /**
   * Get specific specialist agent
   */
  getSpecialist(type: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery') {
    return getAgentBySpecialist(type);
  }

  /**
   * Run specific specialist directly
   */
  async runSpecialist(
    type: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery',
    request: string,
    context?: Record<string, any>
  ) {
    const agent = this.getSpecialist(type);
    console.log(`🎯 Running ${type} specialist directly`);
    
    // Create context for direct specialist run
    const specialistContext = {
      directRun: true,
      specialistType: type,
      timestamp: new Date().toISOString(),
      ...context
    };
    
    console.log('🔄 Context passed to specialist:', Object.keys(specialistContext));
    return await run(agent, request, { 
      context: specialistContext,
      maxTurns: 20
    });
  }

  /**
   * Cleanup resources and remove event listeners
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Email-Makers Agent resources...');
    
    try {
      // Cleanup logger to remove process listeners
      await cleanupLogger();
      
      // Reset agent references
      this.entryAgent = null;
      this.orchestrator = null;
      
      console.log('✅ Email-Makers Agent cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Log system status
   */
  private logSystemStatus(): void {
    const stats = getRegistryStatistics();
    console.log('🔧 Email-Makers Agent System Status:');
    console.log(`   📊 Total Tools: ${stats.totalTools}`);
    console.log(`   👥 Specialist Agents: ${stats.totalAgents} + 1 Orchestrator`);
    console.log(`   🔄 Handoffs Enabled: ${stats.hasHandoffs}`);
    console.log(`   ✅ SDK Compliant: ${stats.sdkCompliant}`);
    console.log(`   🎯 Entry Point: Email Campaign Orchestrator`);
    console.log(`   🔗 Workflow: Orchestrator → Data Collection → Content → Design → Quality → Delivery`);
    console.log('   ✅ System Ready with Orchestrator Coordination');
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick email generation function
 */
export async function generateEmail(
  topic: string,
  options?: {
    traceId?: string;
    metadata?: Record<string, any>;
    context?: Record<string, any>;
  }
): Promise<any> {
  const agent = new EmailMakersAgent();
  await agent.initialize();
  return await agent.processRequest(topic, options);
}

/**
 * Generate email with specific specialist
 */
export async function generateWithSpecialist(
  topic: string,
  specialist: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery',
  context?: Record<string, any>
): Promise<any> {
  const agent = new EmailMakersAgent();
  await agent.initialize();
  return await agent.processRequest(topic, { specialist, context });
}

/**
 * Get system information
 */
export function getSystemInfo() {
  const agent = new EmailMakersAgent();
  return agent.getCapabilities();
}

/**
 * Test the workflow with a sample request
 */
export async function testWorkflow(topic: string = 'Путешествие в Японию весной') {
  console.log('🧪 Testing Email-Makers workflow...');
  
  try {
    const agent = new EmailMakersAgent();
    await agent.initialize();
    
    const result = await agent.processRequest(topic, {
      traceId: `test-${Date.now()}`,
      metadata: { 
        testMode: true,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('✅ Workflow test completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Workflow test failed:', error);
    throw error;
  }
}

/**
 * Global cleanup function for application shutdown
 */
export async function cleanupEmailMakersAgent(): Promise<void> {
  console.log('🧹 Performing global Email-Makers Agent cleanup...');
  await cleanupLogger();
  console.log('✅ Global cleanup completed');
}

// Setup automatic cleanup on process exit
process.once('exit', () => {
  cleanupEmailMakersAgent().catch(err => console.warn('Cleanup error on exit:', err));
});

process.once('SIGINT', () => {
  cleanupEmailMakersAgent().then(() => process.exit(0)).catch(err => {
    console.warn('Cleanup error on SIGINT:', err);
    process.exit(1);
  });
});

process.once('SIGTERM', () => {
  cleanupEmailMakersAgent().then(() => process.exit(0)).catch(err => {
    console.warn('Cleanup error on SIGTERM:', err);
    process.exit(1);
  });
});

console.log('🔧 Email-Makers Main Agent loaded with OpenAI SDK handoffs');
console.log('📊 System Info:', getSystemInfo()); 