/**
 * Multi-handoff Agent V2 - Refactored and optimized
 * 
 * This is the main entry point for the email campaign generation system.
 * It coordinates between multiple specialist agents to create complete email campaigns.
 * 
 * Architecture:
 * - Orchestrator: Manages the overall workflow
 * - Content Specialist: Creates email content with pricing data
 * - Design Specialist: Creates HTML email design with Figma assets
 * - Quality Specialist: Validates email quality and compatibility
 * - Delivery Specialist: Finalizes and saves campaign files
 */

import { EmailCampaignOrchestrator } from './specialists/specialist-agents';

/**
 * Main function for generating Kupibilet emails
 * @param topic - The email campaign topic
 * @returns Promise with generation result
 */
export async function generateKupibiletEmail(topic: string): Promise<any> {
  const orchestrator = new EmailCampaignOrchestrator();
  
  const result = await orchestrator.processRequest(topic, {
    workflowName: 'Kupibilet Email Generation',
    metadata: {
      topic,
      timestamp: new Date().toISOString(),
      version: 'v2'
    }
  });

  return {
    success: result.success,
    result: result.result,
    error: result.error,
    metadata: result.metadata
  };
}

/**
 * Enhanced function with tracing support
 * @param topic - The email campaign topic
 * @param options - Tracing options
 * @returns Promise with generation result
 */
export async function generateKupibiletEmailWithTracing(
  topic: string,
  options?: { enableTracing?: boolean; traceLevel?: 'basic' | 'detailed' }
): Promise<any> {
  const orchestrator = new EmailCampaignOrchestrator();
  
  const result = await orchestrator.processRequest(topic, {
    workflowName: 'Kupibilet Email Generation with Tracing',
    metadata: {
      topic,
      timestamp: new Date().toISOString(),
      version: 'v2',
      tracing: options
    }
  });

  return {
    success: result.success,
    result: result.result,
    error: result.error,
    metadata: result.metadata
  };
}

// Export the orchestrator and specialist creation function
export { EmailCampaignOrchestrator, createEmailCampaignOrchestrator } from './specialists/specialist-agents';

/**
 * Quick generation function with default settings
 */
export async function quickGenerate(topic: string) {
  return await generateKupibiletEmail(topic);
}

/**
 * Generation with full tracing and monitoring
 */
export async function generateWithFullTracing(topic: string) {
  return await generateKupibiletEmailWithTracing(topic, {
    enableTracing: true,
    traceLevel: 'detailed'
  });
}

/**
 * Version information
 */
export const VERSION = '2.0.0';
export const ARCHITECTURE = 'modular';
export const MODULES = [
  'image-planning',
  'specialist-agents', 
  'tool-registry'
];

console.log(`📦 Multi-Handoff Agent v${VERSION} loaded with ${ARCHITECTURE} architecture`);
console.log(`🧩 Modules: ${MODULES.join(', ')}`);

/**
 * Module exports for advanced usage
 */
export { planEmailImages, extractTopicTags, selectFigmaAssetByTags, findFigmaAsset } from './tools/image-planning';
// Note: agent-tools.ts moved to useless/ - use specialist tools from tool-registry.ts instead 