/**
 * 🔧 EMAIL-MAKERS TOOL REGISTRY - OpenAI Agents SDK Compatible
 * 
 * Centralized registry for all specialist tools using pure OpenAI Agents SDK approach
 * Organized by specialist domains with clean separation of concerns
 * All prompts loaded dynamically from /prompts directory
 * 
 * ✅ FIXED: Using proper SDK handoffs without transfer tools
 */

import { Agent } from '@openai/agents';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import agent model configuration
import { getAgentModel, logAgentModelConfig } from './agent-model-config';

// Import specialist tool collections  
import { dataCollectionSpecialistTools } from '../specialists/data-collection-specialist-tools';
import { contentSpecialistTools } from '../specialists/content-specialist-tools';
import { designSpecialistTools } from '../specialists/design-specialist';
import { qualitySpecialistTools } from '../specialists/quality-specialist-tools';
import { deliverySpecialistTools } from '../specialists/delivery-specialist-tools';

// Import common tools
import { commonTools } from './common-tools';

// Log model configuration on load
logAgentModelConfig();

// ============================================================================
// PROMPT LOADING UTILITY
// ============================================================================

/**
 * Load prompt from markdown file
 */
function loadPrompt(promptPath: string): string {
  try {
    const fullPath = join(process.cwd(), 'prompts', promptPath);
    const content = readFileSync(fullPath, 'utf-8');
    console.log(`📄 Loaded prompt: ${promptPath} (${content.length} chars)`);
    
    // Debug for content-specialist specifically
    if (promptPath.includes('content-specialist')) {
      console.log(`🔍 Content Specialist prompt preview: ${content.substring(0, 200)}...`);
      console.log(`🔍 Contains generateAssetManifest: ${content.includes('generateAssetManifest')}`);
    }
    
    return content;
  } catch (error) {
    console.warn(`Failed to load prompt from ${promptPath}:`, error);
    return `You are a specialist agent. Please follow the workflow instructions.`;
  }
}

// ============================================================================
// SPECIALIST AGENTS WITH PROPER SDK HANDOFFS
// ============================================================================

/**
 * Delivery Specialist Agent (Final destination - no handoffs needed)
 */
export const deliverySpecialistAgent = Agent.create({
  name: 'Delivery Specialist',
  model: getAgentModel(),
  instructions: loadPrompt('specialists/delivery-specialist.md'),
  handoffDescription: 'I finalize and package email campaigns for delivery. I create ZIP packages, documentation, and ensure deployment readiness.',
  tools: [...deliverySpecialistTools, ...commonTools]
});

/**
 * Quality Specialist Agent with handoff to Delivery
 */
export const qualitySpecialistAgent = Agent.create({
  name: 'Quality Specialist',
  model: getAgentModel(),
  instructions: loadPrompt('specialists/quality-specialist.md'),
  handoffDescription: 'I validate email templates for cross-client compatibility, accessibility, and performance. I run comprehensive tests and ensure email standards compliance.',
  tools: [...qualitySpecialistTools, ...commonTools],
  handoffs: [deliverySpecialistAgent]
});

/**
 * Design Specialist Agent V3 with handoff to Quality (ENHANCED VERSION)
 */
export const designSpecialistAgent = Agent.create({
  name: 'Enhanced Design Specialist V3',
  model: getAgentModel(),
  instructions: loadPrompt('specialists/design-specialist-v3.md'),
  handoffDescription: 'I create intelligent MJML email templates with AI content analysis, adaptive design, and modern responsive components. I analyze content to determine optimal design patterns.',
  tools: [...designSpecialistTools, ...commonTools],
  handoffs: [qualitySpecialistAgent]
});

/**
 * Content Specialist Agent with handoff to Design
 */
export const contentSpecialistAgent = Agent.create({
  name: 'Content Specialist',
  model: getAgentModel(),
  instructions: loadPrompt('specialists/content-specialist.md'),
  handoffDescription: 'I generate compelling email content, create asset strategies, and prepare technical specifications. I transform data insights into engaging email copy.',
  tools: [...contentSpecialistTools, ...commonTools],
  handoffs: [designSpecialistAgent]
});

/**
 * Data Collection Specialist Agent with handoff to Content (Entry point)
 */
export const dataCollectionSpecialistAgent = Agent.create({
  name: 'Data Collection Specialist',
  model: getAgentModel(),
  instructions: loadPrompt('specialists/data-collection-specialist.md'),
  handoffDescription: 'I gather pricing data, destination information, and market intelligence. I provide data insights and context for email campaigns.',
  tools: [...dataCollectionSpecialistTools, ...commonTools],
  handoffs: [contentSpecialistAgent]
});

// ============================================================================
// TOOL COLLECTIONS BY SPECIALIST
// ============================================================================

/**
 * All Data Collection Specialist tools
 */
export const dataCollectionTools = dataCollectionSpecialistTools;

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
  ...dataCollectionSpecialistTools,
  ...contentSpecialistTools,
  ...designSpecialistTools,
  ...qualitySpecialistTools,
  ...deliverySpecialistTools
];

// ============================================================================
// SPECIALIST AGENTS COLLECTION
// ============================================================================

/**
 * All specialist agents for multi-agent workflows (in execution order)
 */
export const specialistAgents = [
  dataCollectionSpecialistAgent,
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
export function getToolsBySpecialist(specialist: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery') {
  switch (specialist) {
    case 'data-collection':
      return dataCollectionSpecialistTools;
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
export function getAgentBySpecialist(specialist: 'data-collection' | 'content' | 'design' | 'quality' | 'delivery') {
  switch (specialist) {
    case 'data-collection':
      return dataCollectionSpecialistAgent;
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
 * Get the workflow execution sequence for reference
 */
export function getWorkflowSequence(): Array<{
  specialist: string;
  agent: Agent;
  tools: any[];
  description: string;
}> {
  return [
    {
      specialist: 'Data Collection',
      agent: dataCollectionSpecialistAgent,
      tools: dataCollectionSpecialistTools,
      description: 'Gathers pricing, dates and contextual data'
    },
    {
      specialist: 'Content',
      agent: contentSpecialistAgent,
      tools: contentSpecialistTools,
      description: 'Generates email content and specifications'
    },
    {
      specialist: 'Design',
      agent: designSpecialistAgent,
      tools: designSpecialistTools,
      description: 'Creates MJML templates and processes assets'
    },
    {
      specialist: 'Quality',
      agent: qualitySpecialistAgent,
      tools: qualitySpecialistTools,
      description: 'Validates and tests email templates'
    },
    {
      specialist: 'Delivery',
      agent: deliverySpecialistAgent,
      tools: deliverySpecialistTools,
      description: 'Packages and delivers final campaign'
    }
  ];
}

/**
 * Get statistics about the tool registry
 */
export function getRegistryStatistics() {
  return {
    totalAgents: specialistAgents.length,
    totalTools: allSpecialistTools.length,
    toolsBySpecialist: {
      dataCollection: dataCollectionSpecialistTools.length,
      content: contentSpecialistTools.length,
      design: designSpecialistTools.length,
      quality: qualitySpecialistTools.length,
      delivery: deliverySpecialistTools.length
    },
    hasHandoffs: true,
    sdkCompliant: true
  };
}

/**
 * Load additional prompts for debugging
 */
export function loadAdditionalPrompts() {
  return {
    orchestrator: loadPrompt('orchestrator/main-orchestrator.md'),
    dataCollection: loadPrompt('specialists/data-collection-specialist.md'),
    content: loadPrompt('specialists/content-specialist.md'),
    design: loadPrompt('specialists/design-specialist.md'),
    quality: loadPrompt('specialists/quality-specialist.md'),
    delivery: loadPrompt('specialists/delivery-specialist.md')
  };
}

console.log('🔧 Tool Registry loaded with OpenAI Agents SDK handoffs');
console.log('📊 Statistics:', getRegistryStatistics());