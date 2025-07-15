/**
 * 🏗️ CAMPAIGN CONTEXT UTILITIES
 * 
 * Shared utilities for extracting campaign context from OpenAI SDK context parameter
 * Prevents circular imports between specialists
 */

export interface CampaignWorkflowContext {
  campaignId?: string;
  campaignPath?: string;
  campaignName?: string;
  brandName?: string;
  language?: string;
  campaignType?: string;
  metadata?: any;
  context_analysis?: any;
  date_analysis?: any;
  pricing_analysis?: any;
  asset_strategy?: any;
  generated_content?: any;
  technical_requirements?: any;
}

/**
 * Gets campaign context from OpenAI Agents SDK context parameter
 * Works across all specialists with consistent extraction logic
 */
export function getCampaignContextFromSdk(context: any): CampaignWorkflowContext {
  // Debug: Let's see what's actually in the context
  console.log('🔍 DEBUG: Full context structure:', {
    contextKeys: Object.keys(context || {}),
    contextType: typeof context,
    hasWorkflowType: !!context?.workflowType,
    hasCampaign: !!context?.campaign,
    campaignKeys: context?.campaign ? Object.keys(context.campaign) : []
  });
  
  // Try multiple possible context structures from OpenAI SDK
  let campaignContext: CampaignWorkflowContext = {};
  
  // Method 1: Direct campaign context
  if (context?.campaignContext) {
    campaignContext = context.campaignContext;
    console.log('🎯 Found campaign context via: campaignContext');
  }
  // Method 2: campaign object (most likely from ContextManager)
  else if (context?.campaign) {
    campaignContext = {
      campaignId: context.campaign.id,
      campaignPath: context.campaign.path,
      campaignName: context.campaign.name,
      brandName: context.campaign.brand,
      language: context.campaign.language || 'ru',
      campaignType: context.campaign.type || 'promotional'
    };
    console.log('🎯 Found campaign context via: campaign object');
  }
  // Method 3: dataFlow context
  else if (context?.dataFlow?.persistentState?.campaign) {
    const campaign = context.dataFlow.persistentState.campaign;
    campaignContext = {
      campaignId: campaign.id,
      campaignPath: campaign.path,
      campaignName: campaign.name,
      brandName: campaign.brand,
      language: campaign.language || 'ru',
      campaignType: campaign.type || 'promotional'
    };
    console.log('🎯 Found campaign context via: dataFlow.persistentState.campaign');
  }
  // Method 4: Try to extract from handoff data
  else if (context?.dataFlow?.handoffData?.campaign) {
    const campaign = context.dataFlow.handoffData.campaign;
    campaignContext = {
      campaignId: campaign.id,
      campaignPath: campaign.campaignPath || campaign.path,
      campaignName: campaign.name,
      brandName: campaign.brand,
      language: campaign.language || 'ru',
      campaignType: campaign.type || 'promotional'
    };
    console.log('🎯 Found campaign context via: dataFlow.handoffData.campaign');
  }
  else {
    console.log('⚠️ No campaign context found in any expected location');
  }
  
  return campaignContext;
} 