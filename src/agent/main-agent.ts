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
import { 
  createEnhancedContext, 
  enhanceContextForHandoff,
  validateAgentContext,
  getContextManager,
  type AgentRunContext 
} from './core/context-manager';

// ============================================================================
// MAIN EMAIL-MAKERS AGENT CLASS
// ============================================================================

export class EmailMakersAgent {
  private entryAgent: Agent | null = null;
  private orchestrator: any;

  constructor() {
    // Entry agent will be set during initialization
    console.log('🔧 Email-Makers Agent initializing...');
  }

  /**
   * Initialize the agent system with Orchestrator as MANDATORY entry point
   */
  async initialize(): Promise<void> {
    console.log('📖 Setting up orchestrator-first workflow...');
    
    // ALWAYS use Orchestrator as entry point - это обязательно!
    const { orchestrator } = await createEmailCampaignOrchestrator();
    this.orchestrator = orchestrator;
    this.entryAgent = orchestrator; // Orchestrator is the ONLY entry point
    
    console.log('✅ Email-Makers Agent initialized with Orchestrator as MANDATORY entry point');
    console.log('🎯 Entry Point: Email Campaign Orchestrator (ОБЯЗАТЕЛЬНО!)');
    console.log('🔗 Workflow: Orchestrator → Data Collection → Content → Design → Quality → Delivery');
    this.logSystemStatus();
  }

  /**
   * Process an email campaign request with enhanced context management
   */
  async processRequest(request: string, options?: {
    specialist?: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery';
    traceId?: string;
    metadata?: Record<string, any>;
    context?: Record<string, any>;
    campaignId?: string;
    campaignPath?: string;
    // useOrchestrator removed - Orchestrator is now MANDATORY entry point
  }): Promise<any> {
    try {
      // Ensure system is initialized
      if (!this.entryAgent) {
        await this.initialize();
      }

      console.log('🔧 Creating enhanced context for agent run...');
      
      // Create enhanced context using the new context manager
      const enhancedContext = await createEnhancedContext(request, {
        traceId: options?.traceId,
        workflowType: options?.specialist ? 'specialist-direct' : 'full-campaign',
        currentPhase: options?.specialist || 'data-collection',
        
        campaign: {
          id: options?.campaignId || `campaign_${Date.now()}`,
          name: options?.metadata?.campaignName || 'Email Campaign',
          path: options?.campaignPath || '',
          brand: options?.metadata?.brand || 'Default Brand',
          language: options?.metadata?.language || 'ru',
          type: options?.metadata?.campaignType || 'promotional'
        },
        
        execution: {
          mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          apiRequest: options?.metadata?.apiRequest || false,
          directSpecialistRun: !!options?.specialist,
          maxTurns: options?.specialist ? 20 : 50
        },
        
        dataFlow: {
          previousResults: {},
          handoffData: null,
          persistentState: options?.context || {},
          correlationId: `corr_${Date.now()}`,
          handoffChain: []
        },
        
        quality: {
          validationLevel: options?.metadata?.validationLevel || 'standard',
          requiresApproval: options?.metadata?.requiresApproval ?? true,
          qualityThreshold: options?.metadata?.qualityThreshold || 85,
          errorHandling: 'fail-fast'
        },
        
        monitoring: {
          enableDebugOutput: process.env.NODE_ENV === 'development',
          logLevel: 'info',
          performanceTracking: true,
          contextSnapshot: process.env.NODE_ENV === 'development'
        },
        
        metadata: {
          ...options?.metadata,
          originalOptions: options
        }
      }, {
        validateRequired: true,
        enableSnapshot: process.env.NODE_ENV === 'development',
        debugOutput: process.env.NODE_ENV === 'development'
      });
      
      console.log('✅ Enhanced context created:', {
        requestId: enhancedContext.requestId,
        correlationId: enhancedContext.dataFlow.correlationId,
        campaign: enhancedContext.campaign.id,
        workflowType: enhancedContext.workflowType,
        currentPhase: enhancedContext.currentPhase
      });

      // If specific specialist requested, use that agent directly
      if (options?.specialist) {
        const agent = getAgentBySpecialist(options.specialist);
        console.log(`🎯 Using ${options.specialist} specialist directly with enhanced context`);
        
        const result = await run(agent, request, { 
          context: enhancedContext,
          maxTurns: enhancedContext.execution.maxTurns
        });
        
        console.log('✅ Direct specialist execution completed');
        return result;
      }

      // ALWAYS use Orchestrator as entry point - это обязательно!
      const agentToUse = this.entryAgent; // this.entryAgent is now always the orchestrator
      const workflowType = 'Orchestrator coordination';
      
      console.log(`🚀 Starting full workflow with ${workflowType} and enhanced context`);
      
      const result = await run(agentToUse!, request, {
        context: enhancedContext,
        maxTurns: enhancedContext.execution.maxTurns
      });

      console.log(`✅ Full workflow completed via ${workflowType}`);
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
      version: '3.2.0',
      architecture: 'Orchestrator + OpenAI Agents SDK Handoffs',
      entryPoint: 'Email Campaign Orchestrator (ОБЯЗАТЕЛЬНО!)',
      handoffChain: 'Orchestrator → Data Collection → Content → Design → Quality → Delivery',
      statistics: stats,
      workflow: workflow.map(phase => ({
        specialist: phase.specialist,
        description: phase.description,
        tools_count: phase.tools.length
      })),
      available_specialists: ['data-collection', 'content', 'design', 'quality', 'delivery'],
      totalTools: stats.totalTools,
      totalAgents: stats.totalAgents,
      hasHandoffs: stats.hasHandoffs,
      sdkCompliant: stats.sdkCompliant,
      hasOrchestrator: true, // Available as fallback
      directHandoffs: true,
      handoffMode: 'automatic_sdk'
    };
  }

  /**
   * Get specific specialist agent
   */
  getSpecialist(type: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery') {
    return getAgentBySpecialist(type);
  }

  /**
   * Run specific specialist directly with enhanced context
   */
  async runSpecialist(
    type: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery',
    request: string,
    context?: Record<string, any>
  ) {
    const agent = this.getSpecialist(type);
    console.log(`🎯 Running ${type} specialist directly with enhanced context`);
    
    // Create enhanced context for direct specialist run
    const enhancedContext = await createEnhancedContext(request, {
      workflowType: 'specialist-direct',
      currentPhase: type,
      
      execution: {
        directSpecialistRun: true,
        maxTurns: 20
      },
      
      dataFlow: {
        previousResults: {},
        handoffData: null,
        persistentState: context || {},
        correlationId: `specialist_${Date.now()}`,
        handoffChain: []
      },
      
      monitoring: {
        enableDebugOutput: process.env.NODE_ENV === 'development',
        contextSnapshot: true
      },
      
      metadata: {
        directSpecialistType: type,
        ...context
      }
    }, {
      validateRequired: true,
      debugOutput: true
    });
    
    console.log('🔄 Enhanced context created for specialist:', {
      requestId: enhancedContext.requestId,
      specialistType: type,
      correlationId: enhancedContext.dataFlow.correlationId
    });
    
    return await run(agent, request, { 
      context: enhancedContext,
      maxTurns: enhancedContext.execution.maxTurns
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
      
      // Cleanup context manager
      getContextManager().cleanup();
      
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