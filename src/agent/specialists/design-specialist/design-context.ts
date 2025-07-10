/**
 * Design Context Management
 * Handles loading and building design context from handoff files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { DesignWorkflowContext } from './types';

// Import structured logging system
import { log, getGlobalLogger } from '../../core/agent-logger';
import { debuggers } from '../../core/debug-output';

// Initialize debug output for Design Specialist
const debug = debuggers.designSpecialist;

/**
 * Load Design Context Tool
 * Loads all necessary context from handoff files into Design Specialist
 */
export const loadDesignContext = tool({
  name: 'loadDesignContext',
  description: 'Load design context from Content Specialist handoff files and campaign data',
  parameters: z.object({
    campaign_path: z.string().describe('Path to campaign directory'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n📁 === LOADING DESIGN CONTEXT ===');
    console.log(`📋 Campaign path: ${params.campaign_path}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Load comprehensive context from handoff files
      const loadedContext = await loadContextFromHandoffFiles(params.campaign_path);
      
      // Store context in OpenAI SDK context parameter
      if (context) {
        context.content_context = loadedContext.contentContext;
        context.contentContext = loadedContext.contentContext; // Alternative naming
        context.designContext = {
          content_context: loadedContext.contentContext, // Add content_context to designContext
          asset_manifest: loadedContext.asset_manifest,
          technical_specification: loadedContext.technical_specification,
          campaign_path: params.campaign_path, // Add campaign_path directly
          campaign: loadedContext.campaign,
          trace_id: params.trace_id
        };
        
        // CRITICAL: Ensure contentContext has campaign with campaignPath for generateTemplateDesign
        if (context.content_context) {
          context.content_context.campaign = {
            ...loadedContext.campaign,
            campaignPath: params.campaign_path
          };
        }
        if (context.contentContext) {
          context.contentContext.campaign = {
            ...loadedContext.campaign,
            campaignPath: params.campaign_path
          };
        }
      }
      
      console.log('✅ Design context loaded successfully into OpenAI SDK context');
      console.log(`📊 Content keys: ${Object.keys(loadedContext.contentContext).length}`);
      console.log(`🖼️ Assets: ${loadedContext.asset_manifest.images.length} images, ${loadedContext.asset_manifest.icons.length} icons`);
      console.log(`🎯 Campaign: ${loadedContext.campaign.id}`);
      
      return `Design context loaded successfully! Campaign: ${loadedContext.campaign.id}. Content context with ${Object.keys(loadedContext.contentContext).length} properties. Asset manifest with ${loadedContext.asset_manifest.images.length} images and ${loadedContext.asset_manifest.icons.length} icons. Technical specification loaded. Context is now available for all Design Specialist tools.`;
      
    } catch (error) {
      console.error('❌ Failed to load design context:', error);
      throw error;
    }
  }
});

/**
 * Helper function to load context from handoff files - NO FALLBACK ALLOWED
 */
export async function loadContextFromHandoffFiles(campaignPath?: string): Promise<any> {
  if (!campaignPath) {
    throw new Error('Campaign path is required for loading context from handoff files');
  }
  
  try {
    // Load handoff file from Content Specialist - REQUIRED
    const handoffPath = path.join(campaignPath, 'handoffs', 'content-specialist-to-design-specialist.json');
    
    if (!await fs.access(handoffPath).then(() => true).catch(() => false)) {
      throw new Error(`Handoff file not found: ${handoffPath}. Content Specialist must complete content generation first.`);
    }
    
    const handoffContent = await fs.readFile(handoffPath, 'utf-8');
    const handoffData = JSON.parse(handoffContent);
    
    console.log('✅ DESIGN: Loaded context from Content Specialist handoff file');
    
    // Extract context from handoff data - REQUIRED STRUCTURE
    const handoffContentContext = handoffData.content_context;
    
    if (!handoffContentContext) {
      throw new Error('No content_context found in handoff file. Content Specialist must provide valid context structure.');
    }
    
    console.log('🔍 DEBUG: Handoff file structure:', {
      hasContentContext: !!handoffContentContext,
      hasMetadata: !!handoffData.metadata,
      hasRequest: !!handoffData.request,
      contentContextKeys: Object.keys(handoffContentContext)
    });
    
    // Load content files directly - REQUIRED
    const contentDir = path.join(campaignPath, 'content');
    const emailContentPath = path.join(contentDir, 'email-content.json');
    
    if (!await fs.access(emailContentPath).then(() => true).catch(() => false)) {
      throw new Error(`Email content file not found: ${emailContentPath}. Content Specialist must generate email content first.`);
    }
    
    const emailContentData = await fs.readFile(emailContentPath, 'utf-8');
    const emailContent = JSON.parse(emailContentData);
    console.log('✅ DESIGN: Loaded email content from content directory');
    
    // Load campaign metadata - REQUIRED
    const metadataPath = path.join(campaignPath, 'campaign-metadata.json');
    if (!await fs.access(metadataPath).then(() => true).catch(() => false)) {
      throw new Error(`Campaign metadata not found: ${metadataPath}. Campaign must be properly initialized.`);
    }
    
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const campaignMetadata = JSON.parse(metadataContent);
    console.log('✅ DESIGN: Loaded campaign metadata');
    
    // Load asset manifest - REQUIRED
    const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    if (!await fs.access(assetManifestPath).then(() => true).catch(() => false)) {
      throw new Error(`Asset manifest not found: ${assetManifestPath}. Content Specialist must generate asset manifest first.`);
    }
    
    const assetManifestContent = await fs.readFile(assetManifestPath, 'utf-8');
    const assetManifestData = JSON.parse(assetManifestContent);
    console.log('✅ DESIGN: Loaded asset manifest');
    
    // Load technical specification - REQUIRED
    const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
    if (!await fs.access(techSpecPath).then(() => true).catch(() => false)) {
      throw new Error(`Technical specification not found: ${techSpecPath}. Content Specialist must generate technical specification first.`);
    }
    
    const techSpecContent = await fs.readFile(techSpecPath, 'utf-8');
    const techSpecData = JSON.parse(techSpecContent);
    console.log('✅ DESIGN: Loaded technical specification');
    
    // Build comprehensive context - NO FALLBACK VALUES
    const mergedContext = {
      campaign: {
        id: campaignMetadata.campaign_id,
        name: campaignMetadata.campaign_name,
        campaignPath: campaignPath
      },
      contentContext: {
        generated_content: handoffContentContext.generated_content,
        asset_requirements: handoffContentContext.asset_requirements,
        campaign_type: handoffContentContext.campaign_type,
        language: handoffContentContext.language,
        target_audience: handoffContentContext.target_audience,
        context_analysis: handoffContentContext.context_analysis,
        asset_strategy: handoffContentContext.asset_strategy,
        pricing_analysis: handoffContentContext.pricing_analysis,
        date_analysis: handoffContentContext.date_analysis,
        handoff_summary: handoffData.metadata.summary,
        
        // Add email content directly to context for easier access
        subject: emailContent.subject,
        preheader: emailContent.preheader,
        body: emailContent.body,
        cta: emailContent.cta,
        pricing: emailContent.pricing,
        dates: emailContent.dates,
        context: emailContent.context
      },
      asset_manifest: assetManifestData.assetManifest,
      technical_specification: techSpecData.specification
    };
    
    console.log('🔍 DEBUG: Merged context structure:', {
      hasSubject: !!mergedContext.contentContext.subject,
      hasPreheader: !!mergedContext.contentContext.preheader,
      hasBody: !!mergedContext.contentContext.body,
      bodyLength: mergedContext.contentContext.body?.length || 0,
      hasCta: !!mergedContext.contentContext.cta,
      hasPricing: !!mergedContext.contentContext.pricing
    });
    
    return mergedContext;
    
  } catch (error) {
    console.error('❌ DESIGN: Failed to load context from handoff files:', error.message);
    throw error;
  }
}

/**
 * Builds design context from content context and design outputs
 */
export function buildDesignContext(context: any, updates: Partial<DesignWorkflowContext>): DesignWorkflowContext {
  const existingContext = context?.designContext || {};
  const newContext = { ...existingContext, ...updates };
  
  // Debug output with environment variable support
  debug.debug('DesignSpecialist', 'Design context built', {
    updatedFields: Object.keys(updates),
    contextSize: Object.keys(newContext).length
  });
  
  // Also use structured logging
  log.debug('DesignSpecialist', 'Design context built', {
    updatedFields: Object.keys(updates),
    contextSize: Object.keys(newContext).length
  });
  
  return newContext;
}

/**
 * Load design context from handoff directory (legacy signature support)
 * This function provides backward compatibility for tools that expect buildDesignContext(handoff_directory)
 */
export async function loadDesignContextFromHandoffDirectory(handoff_directory: string): Promise<any> {
  if (!handoff_directory) {
    throw new Error('Handoff directory is required for loading design context');
  }
  
  try {
    // Extract campaign path from handoff directory
    // handoff_directory is typically: /path/to/campaign/handoffs
    const campaignPath = handoff_directory.replace('/handoffs', '');
    
    console.log(`🔧 Loading design context from handoff directory: ${handoff_directory}`);
    console.log(`📁 Extracted campaign path: ${campaignPath}`);
    
    // Use the existing loadContextFromHandoffFiles function
    const loadedContext = await loadContextFromHandoffFiles(campaignPath);
    
    // Return context in the format expected by legacy tools
    return {
      content_context: loadedContext.contentContext,
      campaign: loadedContext.campaign,
      asset_manifest: loadedContext.asset_manifest,
      technical_specification: loadedContext.technical_specification
    };
    
  } catch (error) {
    console.error('❌ Failed to load design context from handoff directory:', error);
    throw error;
  }
} 