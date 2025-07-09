/**
 * 🔧 EMAIL-MAKERS TOOL REGISTRY - OpenAI Agents SDK Compatible
 * 
 * Centralized registry for all specialist tools using pure OpenAI Agents SDK approach
 * Organized by specialist domains with clean separation of concerns
 * All prompts loaded dynamically from /prompts directory
 */

import { Agent } from '@openai/agents';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import specialist tool collections  
import { contentSpecialistTools } from '../specialists/content-specialist-tools';
import { designSpecialistTools } from '../specialists/design-specialist-tools';
import { qualitySpecialistTools } from '../specialists/quality-specialist-tools';
import { deliverySpecialistTools } from '../specialists/delivery-specialist-tools';

// ============================================================================
// PROMPT LOADING UTILITY
// ============================================================================

/**
 * Load prompt from markdown file
 */
function loadPrompt(promptPath: string): string {
  try {
    const fullPath = join(process.cwd(), 'src/agent/prompts', promptPath);
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to load prompt from ${promptPath}:`, error);
    return `You are a specialist agent. Please follow the workflow instructions.`;
  }
}

// ============================================================================
// SPECIALIST AGENTS WITH HANDOFFS
// ============================================================================

/**
 * Delivery Specialist Agent (Final destination - no handoffs)
 */
export const deliverySpecialistAgent = new Agent({
  name: 'Delivery Specialist',
  instructions: loadPrompt('specialists/delivery-specialist.md'),
  tools: deliverySpecialistTools
});

/**
 * Quality Specialist Agent (Handoffs to Delivery)
 */
export const qualitySpecialistAgent = Agent.create({
  name: 'Quality Specialist',
  instructions: loadPrompt('specialists/quality-specialist.md'),
  tools: qualitySpecialistTools,
  handoffs: [deliverySpecialistAgent]
});

/**
 * Design Specialist Agent (Handoffs to Quality)
 */
export const designSpecialistAgent = Agent.create({
  name: 'Design Specialist',
  instructions: loadPrompt('specialists/design-specialist.md'),
  tools: designSpecialistTools,
  handoffs: [qualitySpecialistAgent]
});

/**
 * Content Specialist Agent (Handoffs to Design)
 */
export const contentSpecialistAgent = Agent.create({
  name: 'Content Specialist',
  instructions: loadPrompt('specialists/content-specialist.md'),
  tools: contentSpecialistTools,
  handoffs: [designSpecialistAgent]
});

// ============================================================================
// TOOL COLLECTIONS BY SPECIALIST
// ============================================================================

/**
 * All Content Specialist tools
 */
export const contentTools = contentSpecialistTools;

/**
 * All Design Specialist tools
 */
export const designTools = designSpecialistTools;

/**
 * All Quality Specialist tools
 */
export const qualityTools = qualitySpecialistTools;

/**
 * All Delivery Specialist tools
 */
export const deliveryTools = deliverySpecialistTools;

/**
 * Combined tool registry for all specialists
 */
export const allSpecialistTools = [
  ...contentSpecialistTools,
  ...designSpecialistTools,
  ...qualitySpecialistTools,
  ...deliverySpecialistTools
];

// ============================================================================
// SPECIALIST AGENTS COLLECTION
// ============================================================================

/**
 * All specialist agents for multi-agent workflows
 */
export const specialistAgents = [
  contentSpecialistAgent,
  designSpecialistAgent,
  qualitySpecialistAgent,
  deliverySpecialistAgent
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get tools by specialist type
 */
export function getToolsBySpecialist(specialist: 'content' | 'design' | 'quality' | 'delivery') {
  switch (specialist) {
    case 'content':
      return contentSpecialistTools;
    case 'design':
      return designSpecialistTools;
    case 'quality':
      return qualitySpecialistTools;
    case 'delivery':
      return deliverySpecialistTools;
    default:
      throw new Error(`Unknown specialist type: ${specialist}`);
  }
}

/**
 * Get agent by specialist type
 */
export function getAgentBySpecialist(specialist: 'content' | 'design' | 'quality' | 'delivery') {
  switch (specialist) {
    case 'content':
      return contentSpecialistAgent;
    case 'design':
      return designSpecialistAgent;
    case 'quality':
      return qualitySpecialistAgent;
    case 'delivery':
      return deliverySpecialistAgent;
    default:
      throw new Error(`Unknown specialist type: ${specialist}`);
  }
}

/**
 * Get workflow sequence for campaign processing
 */
export function getWorkflowSequence(): Array<{
  specialist: string;
  agent: Agent;
  tools: any[];
  description: string;
}> {
  return [
    {
      specialist: 'content',
      agent: contentSpecialistAgent,
      tools: contentSpecialistTools,
      description: 'Campaign creation, content generation, and asset planning'
    },
    {
      specialist: 'design',
      agent: designSpecialistAgent,
      tools: designSpecialistTools,
      description: 'Visual asset selection, optimization, and template generation'
    },
    {
      specialist: 'quality',
      agent: qualitySpecialistAgent,
      tools: qualitySpecialistTools,
      description: 'Quality validation, compatibility testing, and performance analysis'
    },
    {
      specialist: 'delivery',
      agent: deliverySpecialistAgent,
      tools: deliverySpecialistTools,
      description: 'Final packaging, delivery, and campaign completion'
    }
  ];
}

/**
 * Tool registry statistics
 */
export function getRegistryStatistics() {
  return {
    total_tools: allSpecialistTools.length,
    content_tools: contentSpecialistTools.length,
    design_tools: designSpecialistTools.length,
    quality_tools: qualitySpecialistTools.length,
    delivery_tools: deliverySpecialistTools.length,
    total_agents: specialistAgents.length,
    workflow_phases: 4,
    handoff_connections: 4 // Content->Design->Quality->Delivery workflow
  };
}

/**
 * Load additional prompts for specific use cases
 */
export function loadAdditionalPrompts() {
  return {
    universalWorkflow: loadPrompt('universal-workflow-instructions.md'),
    contentGeneration: loadPrompt('content.md'),
    figmaAssets: loadPrompt('figma-assets-guide.md'),
    figmaOptimized: loadPrompt('figma-assets-guide-optimized.md'),
    figmaLocal: loadPrompt('figma-local-instructions.md'),
    orchestrator: loadPrompt('orchestrator/main-orchestrator.md')
  };
}

// ============================================================================
// LEGACY COMPATIBILITY (if needed)
// ============================================================================

/**
 * Legacy export for backward compatibility
 */
export const toolRegistry = {
  agents: specialistAgents,
  tools: allSpecialistTools,
  getAgent: getAgentBySpecialist,
  getTools: getToolsBySpecialist,
  statistics: getRegistryStatistics
};