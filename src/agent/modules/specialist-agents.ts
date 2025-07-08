/**
 * 🤖 SPECIALIST AGENTS MODULE
 * 
 * Exports all specialist agents for use in the multi-handoff system.
 * This module serves as the main entry point for agent coordination.
 */

// Import specialist agents
export { DesignSpecialistAgent } from '../specialists/design-specialist-v2';
export { QualitySpecialistV2 } from '../specialists/quality-specialist-v2';

// Import base types and interfaces  
export type { QualitySpecialistInput } from '../specialists/quality/types/quality-types';

// Agent registry for dynamic loading
export const SPECIALIST_AGENTS = {
  'design-specialist': 'DesignSpecialistAgent', 
  'quality-specialist': 'QualitySpecialistV2'
} as const;

export type SpecialistAgentType = keyof typeof SPECIALIST_AGENTS;

// Stub function for backward compatibility
export function createEmailCampaignOrchestrator() {
  throw new Error('createEmailCampaignOrchestrator is deprecated - use individual specialist agents');
}