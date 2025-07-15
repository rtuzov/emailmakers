/**
 * Content Specialist Tools
 * 
 * Barrel export for all Content Specialist tools.
 * Provides clean imports for the main content-specialist-tools.ts file.
 */

// Campaign Management
export { 
  createCampaignFolder,
  updateCampaignMetadata 
} from './campaign-tools';

// Context Intelligence
export { 
  contextProvider,
  dateIntelligence 
} from './context-tools';

// Handoff Management
export { 
  createHandoffFile 
} from './handoff-tools';

// Types and utilities (will be added as we extract more modules)
export type {
  CampaignWorkflowContext,
  ExtendedRunContext
} from './campaign-tools';

// Re-export error handling utilities
export { getErrorMessage } from '../utils/error-handling'; 