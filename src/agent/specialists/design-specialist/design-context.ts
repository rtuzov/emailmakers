/**
 * 🎯 DESIGN SPECIALIST CONTEXT LOADER
 * 
 * Loads design context from handoff files with enhanced OpenAI SDK context extraction.
 * This tool MUST be called first to load campaign context and handoff data.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// CONTEXT-AWARE CAMPAIGN STATE MANAGEMENT
// ============================================================================

interface CampaignWorkflowContext {
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
 * Gets campaign context from OpenAI Agents SDK context parameter (same as Content Specialist)
 */
function getCampaignContextFromSdk(context: any): CampaignWorkflowContext {
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

export const loadDesignContext = tool({
  name: 'loadDesignContext',
  description: `
🎯 CRITICAL FIRST STEP: Load complete design context from handoff files and OpenAI SDK context.

This tool MUST be called first to:
1. Extract campaign path from OpenAI SDK context (passed from orchestrator)
2. Load content context and handoff data from Content Specialist
3. Prepare design context for all subsequent tools

⚠️ ALL OTHER TOOLS DEPEND ON THIS CONTEXT - CALL FIRST!
  `,
  parameters: z.object({
    campaign_path: z.string()
      .default('/auto-detect')
      .describe('Campaign path - use /auto-detect to extract from context automatically'),
    trace_id: z.string()
      .default('initial-load')
      .describe('Trace ID for context tracking')
  }),
  execute: async (params, context) => {
    console.log('📁 === LOADING DESIGN CONTEXT ===');
    console.log('🔍 DEBUG: Received parameters:', { campaign_path: params.campaign_path, trace_id: params.trace_id });
    
    console.log('🔍 DEBUG: SDK context structure:', {
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : [],
      hasCampaign: !!(context as any)?.campaign,
      campaignKeys: (context as any)?.campaign ? Object.keys((context as any).campaign) : [],
      hasDataFlow: !!(context as any)?.dataFlow,
      dataFlowKeys: (context as any)?.dataFlow ? Object.keys((context as any).dataFlow) : []
    });
    
    // 🎯 ENHANCED: Use the same logic as Content Specialist to extract campaign context
    const campaignContext = getCampaignContextFromSdk(context);
    let campaignPath = campaignContext.campaignPath;
    
    console.log('🎯 Campaign context extracted:', {
      campaignId: campaignContext.campaignId,
      campaignPath: campaignContext.campaignPath,
      campaignName: campaignContext.campaignName
    });

    // If no campaign path found in context, try auto-detection
    if (!campaignPath || campaignPath === '/auto-detect' || campaignPath.startsWith('/path/to/')) {
      console.log('⚠️ Campaign path is placeholder or missing from SDK context, auto-detecting...');
      try {
        const campaignsDir = path.join(process.cwd(), 'campaigns');
        const folders = await fs.readdir(campaignsDir);
        
        // Find latest campaign folder
        const latestCampaign = folders
          .filter(folder => folder.startsWith('campaign_'))
          .sort()
          .pop();
          
        if (latestCampaign) {
          campaignPath = path.join(campaignsDir, latestCampaign);
          console.log('✅ Auto-detected campaign path:', campaignPath);
        } else {
          throw new Error('No campaign folders found in campaigns directory');
        }
      } catch (error) {
        throw new Error(`Failed to auto-detect campaign path: ${(error as Error).message}`);
      }
    }

    console.log('📋 Final campaign path:', campaignPath);
    console.log('🔍 Trace ID:', params.trace_id);

    try {
      // Load context from handoff files
      const loadedContext = await loadContextFromHandoffFiles(campaignPath);
      
      // Store in context for other tools
      (context as any).designContext = {
        campaign_path: campaignPath,
        trace_id: params.trace_id,
        ...loadedContext
      };
      
      console.log('✅ DESIGN: Context loaded successfully');
      console.log('📊 DESIGN: Content sections available:', Object.keys(loadedContext.content_context || {}));
      
      return {
        success: true,
        campaign_path: campaignPath,
        trace_id: params.trace_id,
        content_sections: Object.keys(loadedContext.content_context || {}),
        asset_strategy: !!loadedContext.asset_strategy,
        design_brief: !!loadedContext.design_brief,
        message: 'Design context loaded successfully. Ready for design generation.'
      };
      
    } catch (error) {
      console.error('❌ DESIGN: Failed to load context from handoff files:', (error as Error).message);
      throw new Error(`❌ Failed to load design context: ${(error as Error).message}`);
    }
  }
});

// ============================================================================
// CONTEXT LOADING UTILITIES
// ============================================================================

/**
 * Simple helper function to build/update design context
 */
export function buildDesignContext(context: any, newData: any): any {
  if (!context) {
    return { designContext: newData };
  }
  
  if (!context.designContext) {
    context.designContext = {};
  }
  
  // Merge new data into design context
  context.designContext = {
    ...context.designContext,
    ...newData
  };
  
  return context;
}

/**
 * Loads context from handoff directory files
 */
export async function loadContextFromHandoffFiles(campaignPath: string): Promise<any> {
  const handoffDir = path.join(campaignPath, 'handoffs');
  
  try {
    // Load Content Specialist handoff
    const contentHandoffPath = path.join(handoffDir, 'content-specialist-to-design-specialist.json');
    const handoffData = JSON.parse(await fs.readFile(contentHandoffPath, 'utf-8'));
    
    // Диагностическая информация о загруженном handoff файле
    console.log('🔍 Handoff file diagnostic:', {
      hasContentContext: !!handoffData.content_context,
      hasGeneratedContent: !!handoffData.content_context?.generated_content,
      hasCta: !!handoffData.content_context?.generated_content?.cta,
      ctaStructure: handoffData.content_context?.generated_content?.cta ? 
        Object.keys(handoffData.content_context.generated_content.cta) : 'null',
      ctaPrimary: handoffData.content_context?.generated_content?.cta?.primary || 'missing'
    });
    
    return {
      content_context: handoffData.content_context,
      asset_strategy: handoffData.asset_strategy,
      design_brief: handoffData.design_brief,
      technical_specification: handoffData.technical_specification,
      campaign: handoffData.campaign
    };
  } catch (error) {
    throw new Error(`Handoff file not found: ${path.join(handoffDir, 'content-specialist-to-design-specialist.json')}. Content Specialist must complete content generation first.`);
  }
}

/**
 * Loads design context from handoff directory (backward compatibility)
 */
export async function loadDesignContextFromHandoffDirectory(handoff_directory: string): Promise<any> {
  console.log('🔍 Loading design context from handoff directory:', handoff_directory);
  
  try {
    const loadedContext = await loadContextFromHandoffFiles(handoff_directory);
    console.log('✅ Design context loaded from handoff directory');
    return loadedContext;
  } catch (error) {
    console.error('❌ Failed to load design context from handoff directory:', (error as Error).message);
    throw error;
  }
} 