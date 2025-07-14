/**
 * Specialist Agents Module - Updated for OpenAI Agents SDK
 * 
 * Updated to use the new specialized agents from tool-registry.ts
 * Provides unified access to all specialist agents and orchestration
 * Includes orchestrator functionality for complete workflow management
 */

import { run, Agent } from '@openai/agents';
import { 
  dataCollectionSpecialistAgent,
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
  transferToDataCollectionSpecialist,
  transferToContentSpecialist,
  transferToDesignSpecialist,
  transferToQualitySpecialist,
  transferToDeliverySpecialist
} from '../core/transfer-tools';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { commonTools } from '../core/common-tools';
import { getAgentModel } from '../core/agent-model-config';

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
// ORCHESTRATOR TOOLS - Campaign Folder Creation
// ============================================================================

/**
 * Campaign Folder Creation Tool for Orchestrator
 */
export { transferToDataCollectionSpecialist } from '../core/transfer-tools';

export const createCampaignFolderForOrchestrator = tool({
  name: 'create_campaign_folder',
  description: 'Creates a new campaign folder structure before starting specialist workflow',
  parameters: z.object({
    campaign_name: z.string().describe('Name of the email campaign'),
    brand_name: z.string().default('Kupibilet').describe('Brand name for the campaign'),
    campaign_type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).default('promotional').describe('Type of campaign'),
    target_audience: z.string().default('travel enthusiasts').describe('Target audience description'),
    user_request: z.string().describe('Original user request for context'),
    trace_id: z.string().nullable().describe('Trace ID for tracking')
  }),
  execute: async (params) => {
    try {
      console.log('📁 ORCHESTRATOR: Creating campaign folder structure...');
      
      // Generate unique campaign ID
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const campaignId = `campaign_${timestamp}_${randomId}`;
      
      // Create campaign directory in campaigns/ folder
      const campaignPath = path.join(process.cwd(), 'campaigns', campaignId);
      await fs.mkdir(campaignPath, { recursive: true });
      
      // Create all required subdirectories for all specialists
      const subdirs = [
        'content',     // For Content Specialist
        'data',        // For Data Collection Specialist
        'assets',      // For Design Specialist  
        'templates',   // For Design Specialist
        'docs',        // For documentation
        'handoffs',    // For inter-specialist data transfer
        'exports',     // For final deliverables
        'logs'         // For process logs
      ];
      
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(campaignPath, subdir), { recursive: true });
      }
      
      // Correct campaign name to reflect Kupibilet's business model (flights, not tours)
      let correctedCampaignName = params.campaign_name;
      if (correctedCampaignName.includes('туры') || correctedCampaignName.includes('тур')) {
        correctedCampaignName = correctedCampaignName
          .replace(/туры в/gi, 'авиабилеты в')
          .replace(/туры на/gi, 'авиабилеты на') 
          .replace(/тур в/gi, 'перелет в')
          .replace(/тур на/gi, 'перелет на')
          .replace(/осенние туры/gi, 'осенние авиабилеты')
          .replace(/зимние туры/gi, 'зимние авиабилеты')
          .replace(/летние туры/gi, 'летние авиабилеты')
          .replace(/весенние туры/gi, 'весенние авиабилеты');
        
        console.log(`🔧 CORRECTED campaign name: "${params.campaign_name}" → "${correctedCampaignName}"`);
      }

      // Create campaign metadata
      const metadata = {
        id: campaignId,
        name: correctedCampaignName,
        brand: params.brand_name,
        type: params.campaign_type,
        target_audience: params.target_audience,
        user_request: params.user_request,
        created_at: new Date().toISOString(),
        status: 'active',
        workflow_phase: 'data_collection',
        specialists_completed: {
          data_collection: false,
          content: false,
          design: false,
          quality: false,
          delivery: false
        },
        folder_structure: subdirs,
        trace_id: params.trace_id
      };
      
      await fs.writeFile(
        path.join(campaignPath, 'campaign-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Create README
      const readmeContent = `# ${correctedCampaignName}

**Campaign ID:** ${campaignId}
**Brand:** ${params.brand_name}
**Type:** ${params.campaign_type}
**Audience:** ${params.target_audience}
**Created:** ${new Date().toLocaleString('ru-RU')}

## User Request
${params.user_request}

## Workflow Progress
- [ ] Data Collection Specialist
- [ ] Content Specialist  
- [ ] Design Specialist
- [ ] Quality Specialist
- [ ] Delivery Specialist

## Folder Structure

- \`data/\` - Dynamic data collected by Data Collection Specialist
- \`content/\` - Email content and copy generated by Content Specialist
- \`assets/\` - Visual assets and images selected by Design Specialist
- \`templates/\` - MJML and HTML templates created by Design Specialist
- \`docs/\` - Technical specifications and documentation
- \`handoffs/\` - Data transfer files between specialists
- \`exports/\` - Final campaign deliverables
- \`logs/\` - Process execution logs

## Trace ID
\`${params.trace_id || 'none'}\`
`;
      
      await fs.writeFile(
        path.join(campaignPath, 'README.md'),
        readmeContent
      );
      
      console.log(`✅ ORCHESTRATOR: Campaign folder created - ${campaignId}`);
      console.log(`📂 Path: ${campaignPath}`);
      console.log(`📋 Subdirectories: ${subdirs.join(', ')}`);
      
      return {
        campaign_id: campaignId,
        campaign_path: campaignPath,
        metadata: metadata,
        folder_structure: subdirs,
        status: 'folder_created'
      };
      
    } catch (error) {
      console.error('❌ ORCHESTRATOR: Failed to create campaign folder:', error);
      throw new Error(`Campaign folder creation failed: ${error.message}`);
    }
  }
});

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
  
  const orchestratorTools = [
    createCampaignFolderForOrchestrator,
    transferToDataCollectionSpecialist,
    transferToContentSpecialist,
    transferToDesignSpecialist,
    transferToQualitySpecialist,
    transferToDeliverySpecialist,
    ...commonTools
  ];
  
  const orchestrator = new Agent({
    name: 'Email Campaign Orchestrator',
    model: getAgentModel(),
    instructions: instructions,
    tools: orchestratorTools,
    handoffs: [
      dataCollectionSpecialistAgent,
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
      console.log('📋 Orchestration config:', config);
      
      // Create initial context with orchestration metadata
      const initialContext = {
        orchestrationId: `orch_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        workflowName: config.workflowName || 'email-campaign',
        traceId: config.traceId,
        metadata: {
          ...config.metadata,
          workflow_start: new Date().toISOString(),
          orchestrator_version: '2.0.0'
        }
      };
      
      console.log('🔄 Passing context to orchestrator:', Object.keys(initialContext));
      
      // Pass context through OpenAI Agents SDK context parameter
      const result = await run(this.orchestrator, request, { context: initialContext });

      console.log('✅ Orchestration completed successfully');

      return {
        success: true,
        result: result.finalOutput,
        traceId: config.traceId,
        metadata: {
          ...config.metadata,
          workflow_completed: true,
          timestamp: new Date().toISOString(),
          orchestrationId: initialContext.orchestrationId
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
      total_tools: stats.totalTools,
      total_agents: stats.totalAgents,
      workflow_phases_count: workflowSequence.length,
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