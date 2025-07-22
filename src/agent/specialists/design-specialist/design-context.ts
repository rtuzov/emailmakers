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
    
    // 🔍 ПОЛНОЕ ЛОГИРОВАНИЕ КОНТЕКСТА
    console.log('\n🔍 === ПОЛНЫЙ КОНТЕКСТ DEBUG ===');
    console.log('📋 Весь context:', JSON.stringify(context, null, 2));
    console.log('📊 Context keys:', context ? Object.keys(context) : 'none');
    
    if (context) {
      console.log('📁 context.context:', (context as any)?.context);
      console.log('📁 context.campaignContext:', (context as any)?.campaignContext);
      console.log('📁 context.campaign:', (context as any)?.campaign);
      console.log('📁 context.dataFlow:', (context as any)?.dataFlow);
      console.log('📁 context.usage:', (context as any)?.usage);
    }
    console.log('🔍 === КОНЕЦ ПОЛНОГО DEBUG ===\n');
    
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
  
  // Merge new data into design context WITHOUT circular references
  const updatedDesignContext = {
    ...context.designContext,
    ...newData
  };
  
  // Remove any potential circular references before assignment
  const cleanData = JSON.parse(JSON.stringify(updatedDesignContext, (key, value) => {
    // Skip context references to prevent circular dependency
    if (key === 'context' && typeof value === 'object' && value !== null) {
      return '[Circular Reference Removed]';
    }
    return value;
  }));
  
  context.designContext = cleanData;
  
  return context;
}

/**
 * Load context from campaign content files (OpenAI SDK compatible)
 */
export async function loadContextFromHandoffFiles(campaignPath: string): Promise<any> {
  const contentDir = path.join(campaignPath, 'content');
  
  try {
    console.log('🔍 Loading design context from content files...');
    
    // Load email content for content context
    const emailContentPath = path.join(contentDir, 'email-content.json');
    let contentContext = null;
    try {
      const emailContent = JSON.parse(await fs.readFile(emailContentPath, 'utf-8'));
      contentContext = {
        generated_content: emailContent,
        sections: emailContent.sections || [],
        subject_line: emailContent.subject_line,
        preheader: emailContent.preheader,
        cta: emailContent.cta || emailContent.call_to_action
      };
      console.log('✅ Email content loaded successfully');
    } catch (error) {
      throw new Error(`Email content file not found: ${emailContentPath}. Content Specialist must complete content generation first.`);
    }
    
    // Load asset strategy
    const assetStrategyPath = path.join(contentDir, 'asset-strategy.json');
    let assetStrategy = null;
    try {
      assetStrategy = JSON.parse(await fs.readFile(assetStrategyPath, 'utf-8'));
      console.log('✅ Asset strategy loaded successfully');
    } catch (error) {
      console.log('⚠️ Asset strategy file not found, will use default');
    }
    
    // Load design brief
    const designBriefPath = path.join(contentDir, 'design-brief-from-context.json');
    let designBrief = null;
    try {
      designBrief = JSON.parse(await fs.readFile(designBriefPath, 'utf-8'));
      console.log('✅ Design brief loaded successfully');
    } catch (error) {
      console.log('⚠️ Design brief file not found, will use default');
    }
    
    // Load asset manifest
    const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    let assetManifest = null;
    try {
      assetManifest = JSON.parse(await fs.readFile(assetManifestPath, 'utf-8'));
      console.log('✅ Asset manifest loaded successfully from:', assetManifestPath);
      console.log(`📊 Asset manifest contains: ${assetManifest.assetManifest?.images?.length || 0} images, ${assetManifest.assetManifest?.icons?.length || 0} icons`);
    } catch (error) {
      console.log(`⚠️ Asset manifest file not found at: ${assetManifestPath}`);
      console.log('⚠️ Asset manifest will not be available for asset processing');
    }
    
    // Load campaign metadata
    const campaignMetadataPath = path.join(campaignPath, 'campaign-metadata.json');
    let campaign = null;
    try {
      campaign = JSON.parse(await fs.readFile(campaignMetadataPath, 'utf-8'));
      console.log('✅ Campaign metadata loaded successfully');
    } catch (error) {
      console.log('⚠️ Campaign metadata file not found');
    }
    
    // Диагностическая информация о загруженном контексте
    console.log('🔍 Content context diagnostic:', {
      hasContentContext: !!contentContext,
      hasGeneratedContent: !!contentContext?.generated_content,
      hasCta: !!contentContext?.cta,
      ctaStructure: contentContext?.cta ? Object.keys(contentContext.cta) : 'null',
      ctaPrimary: contentContext?.cta?.primary || 'missing'
    });
    
    return {
      content_context: contentContext,
      asset_strategy: assetStrategy,
      design_brief: designBrief,
      asset_manifest: assetManifest,
      technical_specification: designBrief?.technical_specifications,
      campaign: campaign
    };
  } catch (error) {
    throw new Error(`Failed to load design context from content files: ${error instanceof Error ? error.message : String(error)}`);
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