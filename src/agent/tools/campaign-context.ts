/**
 * Campaign Context Management for OpenAI SDK
 * 
 * Provides context extraction and management functionality
 * for campaign workflow context in OpenAI Agents SDK environment.
 */

export interface CampaignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  metadata?: any;
  context_analysis?: any;
  date_analysis?: any;
  pricing_analysis?: any;
  asset_strategy?: any;
  generated_content?: any;
  technical_requirements?: any;
  design_brief?: any;
  trace_id?: string | null;
}

/**
 * Extract campaign context from OpenAI SDK context parameter
 * Replaces global state with context parameter pattern
 */
export function getCampaignContextFromSdk(context?: any): CampaignWorkflowContext {
  if (!context) {
    return {};
  }
  
  return context.campaignContext || {};
}

/**
 * Update campaign context in OpenAI SDK context parameter
 */
export function updateCampaignContext(
  context: any, 
  updates: Partial<CampaignWorkflowContext>
): CampaignWorkflowContext {
  const existingContext = getCampaignContextFromSdk(context);
  const newContext = { ...existingContext, ...updates };
  
  if (context) {
    context.campaignContext = newContext;
  }
  
  return newContext;
} 