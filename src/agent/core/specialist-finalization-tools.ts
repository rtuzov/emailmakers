/**
 * 🎯 SPECIALIST FINALIZATION TOOLS
 * 
 * Finalization tools for each specialist to prepare comprehensive handoff data.
 * These tools collect all specialist outputs and create proper context for next agent.
 * 
 * Replaces the broken global state pattern with proper context building.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Import enhanced file operations and error handling
// import {
//   readJSONOrThrow,
//   accessFileOrThrow,
//   CRITICAL_OPERATION_RETRY_OPTIONS
// } from './file-operations-retry';
// import {
//   DataExtractionError,
// } from './error-types';
import {
  // ContentContext,
  // DesignContext,
  // QualityContext,
  // DeliveryContext,
  // createHandoffMetadata,
  validateHandoffData,
  ContentToDesignHandoffSchema,
  DesignToQualityHandoffSchema,
  QualityToDeliveryHandoffSchema
} from './handoff-schemas';

import {
  // buildContentContextFromOutputs,
  buildDesignContextFromOutputs,
  buildQualityContextFromOutputs,
  buildDeliveryContextFromOutputs,
  // saveContentContext,
  saveDesignContext,
  saveQualityContext,
  saveDeliveryContext,
  prepareContentToDesignHandoff,
  prepareDesignToQualityHandoff,
  prepareQualityToDeliveryHandoff,
  validateContextCompleteness
} from './context-builders';

// ============================================================================
// CONTENT CONTEXT LOADING UTILITIES  
// ============================================================================

/**
 * Load comprehensive content context from campaign files
 */
async function loadContentContext(campaignPath: string, traceId?: string): Promise<any> {
  console.log(`🔍 Loading content context from campaign: ${campaignPath}`);
  
  try {
    // Load all content files that Content Specialist should have created
    const contentFiles = {
      email_content: path.join(campaignPath, 'content', 'email-content.json'),
      asset_strategy: path.join(campaignPath, 'content', 'asset-strategy.json'),
      design_brief: path.join(campaignPath, 'content', 'design-brief-from-context.json'),
      pricing_analysis: path.join(campaignPath, 'content', 'pricing-analysis.json'),
      date_analysis: path.join(campaignPath, 'content', 'date-analysis.json')
    };
    
    // Load data collection files as well
    const dataFiles = {
      destination_analysis: path.join(campaignPath, 'data', 'destination-analysis.json'),
      market_intelligence: path.join(campaignPath, 'data', 'market-intelligence.json'),
      emotional_profile: path.join(campaignPath, 'data', 'emotional-profile.json'),
      consolidated_insights: path.join(campaignPath, 'data', 'consolidated-insights.json'),
      travel_intelligence: path.join(campaignPath, 'data', 'travel_intelligence-insights.json'),
      trend_analysis: path.join(campaignPath, 'data', 'trend-analysis.json')
    };
    
    const contentContext: any = {
      campaign_path: campaignPath,
      trace_id: traceId
    };
    
    // Helper functions for data normalization
    function normalizeEmotionalTrigger(value: any): 'excitement' | 'trust' | 'urgency' | 'relaxation' | 'adventure' {
      const triggers = ['excitement', 'trust', 'urgency', 'relaxation', 'adventure'];
      
      if (triggers.includes(value)) return value;
      
      // Try to map Russian to English
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('приключени') || lowerValue.includes('adventure')) return 'adventure';
        if (lowerValue.includes('доверие') || lowerValue.includes('trust')) return 'trust';
        if (lowerValue.includes('срочность') || lowerValue.includes('urgency')) return 'urgency';
        if (lowerValue.includes('релакс') || lowerValue.includes('relaxation') || lowerValue.includes('отдых')) return 'relaxation';
        if (lowerValue.includes('возбуждени') || lowerValue.includes('excitement') || lowerValue.includes('волнени')) return 'excitement';
      }
      
      return 'excitement'; // Default fallback
    }
    
    function normalizeVisualStyle(value: any): 'modern' | 'classic' | 'minimalist' | 'vibrant' | 'elegant' {
      const styles = ['modern', 'classic', 'minimalist', 'vibrant', 'elegant'];
      
      if (styles.includes(value)) return value;
      
      // Try to map Russian/descriptive text to English enums
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('современн') || lowerValue.includes('modern')) return 'modern';
        if (lowerValue.includes('классическ') || lowerValue.includes('classic')) return 'classic';
        if (lowerValue.includes('минимализм') || lowerValue.includes('minimalist')) return 'minimalist';
        if (lowerValue.includes('яркий') || lowerValue.includes('vibrant') || lowerValue.includes('насыщенн') || lowerValue.includes('тропическ')) return 'vibrant';
        if (lowerValue.includes('элегантн') || lowerValue.includes('elegant')) return 'elegant';
      }
      
      return 'modern'; // Default fallback
    }
    
    function normalizeSeason(value: any): 'spring' | 'summer' | 'autumn' | 'winter' | 'year-round' {
      const seasons = ['spring', 'summer', 'autumn', 'winter', 'year-round'];
      
      if (seasons.includes(value)) return value;
      
      // Try to map Russian to English
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue.includes('осен') || lowerValue.includes('autumn') || lowerValue.includes('fall')) return 'autumn';
        if (lowerValue.includes('зим') || lowerValue.includes('winter')) return 'winter';
        if (lowerValue.includes('весн') || lowerValue.includes('spring')) return 'spring';
        if (lowerValue.includes('лет') || lowerValue.includes('summer')) return 'summer';
        if (lowerValue.includes('круглогодичн') || lowerValue.includes('year-round')) return 'year-round';
      }
      
      return 'winter'; // Default fallback for current season
    }
    
    function normalizeColorPalette(value: any): string {
      // If it's already a string, return it
      if (typeof value === 'string') return value;
      
      // If it's an object, convert to string description
      if (typeof value === 'object' && value !== null) {
        const colors = [];
        if (value.primary) colors.push(`primary: ${value.primary}`);
        if (value.secondary) colors.push(`secondary: ${value.secondary}`);
        if (value.accent) colors.push(`accent: ${value.accent}`);
        return colors.length > 0 ? colors.join(', ') : 'Modern color palette';
      }
      
      return 'Modern color palette';
    }
    
    // Load each content file if it exists
    for (const [key, filePath] of Object.entries(contentFiles)) {
      try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          
          // Map to content context structure with proper data extraction
          switch (key) {
            case 'email_content':
              // Handle different email content formats
              if (data.subject_line || data.headline || data.body) {
                // New format from contentGenerator tool
                contentContext.generated_content = {
                  subject: data.subject_line?.primary || data.headline?.main || 'Generated Subject',
                  preheader: data.preheader || 'Generated Preheader',
                  body: data.body?.main_content || data.body?.opening || JSON.stringify(data.body) || 'Generated Body',
                  cta: {
                    primary: data.call_to_action?.primary?.text || data.cta?.primary || 'Book Now',
                    secondary: data.call_to_action?.secondary?.text || data.cta?.secondary || 'Learn More'
                  },
                  personalization_level: data.personalization?.greeting ? 'advanced' : 'basic',
                  urgency_level: data.emotional_hooks?.fear_of_missing_out ? 'high' : 'medium'
                };
              } else if (data.subject || data.body) {
                // Legacy format
                contentContext.generated_content = data;
              } else {
                // Fallback for any format
                contentContext.generated_content = data;
              }
              
              if (data.dates) contentContext.date_analysis = data.dates;
              if (data.pricing) contentContext.pricing_analysis = data.pricing;
              break;
            case 'asset_strategy':
              // Handle different asset strategy formats with proper normalization
              if (data.visual_direction || data.asset_types || data.content_strategy) {
                // New format from assetStrategy tool
                contentContext.asset_strategy = {
                  theme: data.content_strategy?.approach || 'Travel Campaign',
                  visual_style: normalizeVisualStyle(data.visual_direction?.primary_style || data.visual_style),
                  color_palette: normalizeColorPalette(data.visual_direction?.color_palette || data.color_palette),
                  typography: data.visual_direction?.mood || data.typography || 'clean and modern',
                  image_concepts: data.asset_types?.map((asset: any) => asset.description) || data.image_concepts || ['Hero image', 'Destination showcase'],
                  layout_hierarchy: data.visual_direction?.visual_hierarchy || data.layout_hierarchy || 'Hero, content, CTA',
                  emotional_triggers: normalizeEmotionalTrigger(
                    data.content_strategy?.emotional_triggers?.[0] || 
                    data.content_strategy?.emotional_triggers || 
                    data.emotional_triggers
                  ),
                  brand_consistency: data.brand_consistency || 'Maintain brand colors and typography'
                };
              } else {
                // Legacy format or direct mapping with normalization
                contentContext.asset_strategy = {
                  theme: data.theme || 'Travel Campaign',
                  visual_style: normalizeVisualStyle(data.visual_style),
                  color_palette: normalizeColorPalette(data.color_palette),
                  typography: data.typography || 'clean and modern',
                  image_concepts: data.image_concepts || ['Hero image', 'Destination showcase'],
                  layout_hierarchy: data.layout_hierarchy || 'Hero, content, CTA',
                  emotional_triggers: normalizeEmotionalTrigger(data.emotional_triggers),
                  brand_consistency: data.brand_consistency || 'Maintain brand colors and typography'
                };
              }
              break;
            case 'design_brief':
              contentContext.design_brief = data;
              break;
            case 'pricing_analysis':
              if (!contentContext.pricing_analysis) {
                // Handle different pricing analysis formats
                if (data.comprehensive_pricing) {
                  contentContext.pricing_analysis = {
                    best_price: data.comprehensive_pricing.best_price_overall,
                    currency: data.comprehensive_pricing.currency,
                    ...data
                  };
                } else {
                  contentContext.pricing_analysis = data;
                }
              }
              break;
            case 'date_analysis':
              if (!contentContext.date_analysis) {
                // Normalize date analysis data
                contentContext.date_analysis = {
                  destination: data.destination || 'Unknown',
                  season: normalizeSeason(data.season),
                  optimal_dates: Array.isArray(data.optimal_dates) ? data.optimal_dates : [data.optimal_dates].filter(Boolean),
                  pricing_windows: Array.isArray(data.pricing_windows) ? data.pricing_windows : [data.pricing_windows].filter(Boolean),
                  booking_recommendation: data.booking_recommendation || 'Book in advance for best rates',
                  seasonal_factors: data.seasonal_factors || 'Seasonal considerations apply',
                  current_date: data.current_date || new Date().toISOString().split('T')[0]
                };
              }
              break;
          }
          
          console.log(`✅ Loaded ${key} from ${filePath}`);
        } else {
          console.log(`⚠️ Content file not found: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load ${key} from ${filePath}:`, error);
      }
    }
    
    // Load data collection context
    const dataCollectionContext: any = {};
    
    for (const [key, filePath] of Object.entries(dataFiles)) {
      try {
        if (await fs.access(filePath).then(() => true).catch(() => false)) {
          const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
          dataCollectionContext[key] = data;
          console.log(`✅ Loaded data collection ${key} from ${filePath}`);
        } else {
          console.log(`⚠️ Data collection file not found: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to load data collection ${key} from ${filePath}:`, error);
      }
    }
    
    // Add data collection context to content context
    contentContext.data_collection_context = dataCollectionContext;
    
    // Validate required content components
    const requiredComponents = ['generated_content', 'asset_strategy'];
    const missingComponents = requiredComponents.filter(comp => !contentContext[comp]);
    
    if (missingComponents.length > 0) {
      throw new Error(`Missing required content components: ${missingComponents.join(', ')}`);
    }
    
    console.log('✅ Content context loaded successfully');
    return contentContext;
    
  } catch (error) {
    console.error('❌ Failed to load content context:', error);
    throw new Error(`Failed to load content context: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// CONTENT SPECIALIST FINALIZATION
// ============================================================================

export const finalizeContentAndTransferToDesign = tool({
  name: 'finalizeContentAndTransferToDesign',
  description: 'Finalize all Content Specialist work and complete agent task to enable automatic handoff to Design Specialist via OpenAI SDK',
  parameters: z.object({
    campaign_id: z.string().describe('Campaign ID'),
    campaign_path: z.string().describe('Path to campaign folder'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  
  execute: async (params, _context) => {
    console.log('\n🔄 === CONTENT SPECIALIST FINALIZATION ===');
    console.log(`📋 Campaign ID: ${params.campaign_id}`);
    console.log(`📁 Campaign Path: ${params.campaign_path}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    
    try {
      // Load and prepare content context for handoff
      const contentContext = await loadContentContext(params.campaign_path, params.trace_id || undefined);
      console.log('✅ Content context loaded for handoff preparation');

      // Prepare comprehensive handoff data following OpenAI SDK patterns
      const handoffData = await prepareContentToDesignHandoff(
        'Create email design based on finalized content',
        contentContext,
        params.trace_id || undefined
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      console.log('✅ Content context built and validated');
      console.log('📊 Content summary:', {
        subject: contentContext.generated_content?.subject || 'Unknown',
        pricing: `${contentContext.pricing_analysis?.best_price || 'N/A'} ${contentContext.pricing_analysis?.currency || 'N/A'}`,
        visual_style: contentContext.asset_strategy?.visual_style || 'N/A',
        dates: contentContext.date_analysis?.optimal_dates?.slice(0, 3).join(', ') || 'N/A'
      });

      // Save handoff data to campaign folder for Design Specialist
      const handoffPath = path.join(params.campaign_path, 'handoffs', 'content-specialist-to-design-specialist.json');
      console.log(`📁 Creating handoff directory: ${path.dirname(handoffPath)}`);
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      console.log(`💾 Saving handoff file: ${handoffPath}`);
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));
      console.log(`✅ Handoff file saved successfully: ${handoffPath}`);
      
      // ✅ UPDATE CAMPAIGN METADATA: Mark Content Specialist as completed
      console.log('📝 Updating campaign metadata to mark Content Specialist as completed...');
      const metadataPath = path.join(params.campaign_path, 'campaign-metadata.json');
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataContent);
        
        // Update specialists_completed
        metadata.specialists_completed.content = true;
        metadata.workflow_phase = 'design';
        metadata.last_updated = new Date().toISOString();
        
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        console.log('✅ Campaign metadata updated - Content Specialist marked as completed');
      } catch (metadataError) {
        console.error('⚠️ Failed to update campaign metadata:', metadataError);
        // Don't throw error - continue with handoff even if metadata update fails
      }
      
      // ✅ SIGNAL COMPLETION: Return a structured completion result that signals OpenAI SDK 
      // that Content Specialist work is complete and handoff should occur
      console.log('🔄 Content work finalized - Content Specialist task complete');
      console.log('🤖 OpenAI SDK will now automatically handoff to Design Specialist');
      
      // Return completion signal that OpenAI SDK recognizes as task completion
      const completionResult = {
        status: 'CONTENT_SPECIALIST_COMPLETE',
        campaign_id: params.campaign_id,
        campaign_path: params.campaign_path,
        content_context: contentContext,
        handoff_data: handoffData,
        next_agent: 'Design Specialist',
        completion_message: `✅ Content Specialist work complete for campaign ${params.campaign_id}. Subject: "${contentContext.generated_content?.subject || 'No subject'}". Price: ${contentContext.pricing_analysis?.best_price || 'N/A'} ${contentContext.pricing_analysis?.currency || 'N/A'}. Visual style: ${contentContext.asset_strategy?.visual_style || 'default'}. Asset manifest created. Ready for Design Specialist via OpenAI SDK handoff.`,
        
        // OpenAI SDK completion markers
        task_complete: true,
        handoff_ready: true,
        specialist_work_done: true,
        
        // Summary for handoff
        summary: {
          subject: contentContext.generated_content?.subject || 'No subject',
          pricing: `${contentContext.pricing_analysis?.best_price || 'N/A'} ${contentContext.pricing_analysis?.currency || 'N/A'}`,
          visual_style: contentContext.asset_strategy?.visual_style || 'default',
          asset_manifest_created: true,
          handoff_file_path: handoffPath
        }
      };
      
      return completionResult;

    } catch (error) {
      console.error('❌ Content finalization failed:', error);
      throw new Error(`Content finalization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
});

// ============================================================================
// DESIGN SPECIALIST FINALIZATION
// ============================================================================

export const finalizeDesignAndTransferToQuality = tool({
  name: 'finalizeDesignAndTransferToQuality',
  description: 'Finalize all Design Specialist work and prepare comprehensive handoff to Quality Specialist with complete design package',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    content_context: z.object({}).strict().describe('Content context from previous specialist'),
    asset_manifest: z.object({}).strict().describe('Asset manifest with all prepared assets'),
    mjml_template: z.object({}).strict().describe('Generated MJML template'),
    design_decisions: z.object({}).strict().describe('Design decisions and rationale'),
    preview_files: z.array(z.object({}).strict()).describe('Generated preview files'),
    performance_metrics: z.object({}).strict().describe('Performance metrics'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, _context) => {
    console.log('\n🎯 === DESIGN SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`🎨 MJML Status: ${(params.mjml_template as any)?.validation_status || 'unknown'}`);
    console.log(`📊 Performance Score: ${(params.performance_metrics as any)?.optimization_score || 'unknown'}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive design context
      const designContext = await buildDesignContextFromOutputs(
        params.content_context,
        params.asset_manifest,
        params.mjml_template,
        params.design_decisions,
        params.preview_files,
        params.performance_metrics
      );

      // Validate design context completeness
      const validation = validateContextCompleteness(designContext, 'design');
      if (!validation.isComplete) {
        throw new Error(`❌ CRITICAL ERROR: Design context incomplete. Missing: ${validation.missingFields.join(', ')}`);
      }

      // Extract campaign path correctly - handle multiple possible sources
      let campaignPath;
      
      // Try multiple sources for campaign path
      if ((params.content_context as any)?.campaign?.campaignPath) {
        campaignPath = (params.content_context as any).campaign.campaignPath;
      } else if ((params.content_context as any)?.campaignPath) {
        campaignPath = (params.content_context as any).campaignPath;
      } else if ((params.content_context as any)?.campaign_path) {
        campaignPath = (params.content_context as any).campaign_path;
      } else if ((_context as any)?.designContext?.campaign_path) {
        campaignPath = (_context as any).designContext.campaign_path;
      } else if ((_context as any)?.contentContext?.campaign?.campaignPath) {
        campaignPath = (_context as any).contentContext.campaign.campaignPath;
      } else if ((_context as any)?.contentContext?.campaign_path) {
        campaignPath = (_context as any).contentContext.campaign_path;
      }
      
      // If campaignPath is a handoff file path, extract the campaign directory
      if (campaignPath && campaignPath.includes('/handoffs/')) {
        campaignPath = campaignPath.split('/handoffs/')[0];
        console.log(`🔧 Corrected campaignPath from handoff file to directory: ${campaignPath}`);
      } else if (campaignPath && campaignPath.endsWith('.json')) {
        // Handle case where full handoff file path is passed
        campaignPath = path.dirname(path.dirname(campaignPath));
        console.log(`🔧 Corrected campaignPath from file path to directory: ${campaignPath}`);
      }
      
      if (!campaignPath) {
        // NO FALLBACK POLICY: Fail fast if campaign path is missing
        throw new Error('❌ CRITICAL ERROR: Campaign path is missing from content context. Content Specialist must provide valid campaign.campaignPath.');
      }
      
      // Save design context to campaign folder
      await saveDesignContext(designContext, campaignPath);

      // Prepare handoff to Quality Specialist
      const handoffData = await prepareDesignToQualityHandoff(
        params.request,
        params.content_context,
        designContext,
        params.trace_id || undefined || undefined
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      console.log('✅ Design context built and validated');
      console.log('🎨 Design summary:', {
        template_size: `${((designContext.mjml_template?.file_size || 0) / 1024).toFixed(2)} KB`,
        assets_count: (designContext.asset_manifest?.images?.length || 0) + (designContext.asset_manifest?.icons?.length || 0),
        performance_score: designContext.performance_metrics.optimization_score,
        layout_strategy: designContext.design_decisions.layout_strategy
      });

      // Execute handoff to Quality Specialist
      console.log('🔄 Executing handoff to Quality Specialist...');
      // Save handoff data to campaign folder for Quality Specialist
      const handoffPath2 = path.join(campaignPath, 'handoffs', 'design-to-quality.json');
      await fs.mkdir(path.dirname(handoffPath2), { recursive: true });
      await fs.writeFile(handoffPath2, JSON.stringify(handoffData, null, 2));
      
      // ✅ CORRECT: Return result and let OpenAI SDK handle handoff automatically
      console.log('🔄 Design finalization complete - OpenAI SDK will handle handoff to Quality Specialist');
      
      return {
        status: 'design_finalized_ready_for_quality',
        design_context: designContext,
        handoff_data: handoffData,
        template_size: `${((designContext.mjml_template?.file_size || 0) / 1024).toFixed(2)} KB`,
        assets_count: (designContext.asset_manifest?.images?.length || 0) + (designContext.asset_manifest?.icons?.length || 0),
        performance_score: designContext.performance_metrics.optimization_score,
        next_specialist: 'quality',
        message: `Design work finalized and ready for Quality Specialist handoff. Template size: ${((designContext.mjml_template?.file_size || 0) / 1024).toFixed(2)} KB. Assets: ${(designContext.asset_manifest?.images?.length || 0) + (designContext.asset_manifest?.icons?.length || 0)}. Performance score: ${designContext.performance_metrics?.optimization_score || 'N/A'}. Handoff data prepared for automatic SDK transfer.`
      };

    } catch (error) {
      console.error('❌ Design finalization failed:', error);
      return `Design finalization failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

// ============================================================================
// QUALITY SPECIALIST FINALIZATION
// ============================================================================

export const finalizeQualityAndTransferToDelivery = tool({
  name: 'finalizeQualityAndTransferToDelivery',
  description: 'Finalize all Quality Specialist work and prepare comprehensive handoff to Delivery Specialist with complete quality report',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    design_context: z.object({}).strict().describe('Design context from Design Specialist'),
    quality_report: z.object({}).strict().describe('Comprehensive quality analysis report'),
    test_artifacts: z.object({}).strict().describe('Test artifacts (screenshots, logs, reports)'),
    compliance_status: z.object({}).strict().describe('Compliance status across all standards'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, _context) => {
    console.log('\n🎯 === QUALITY SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`✅ Quality Score: ${(params.quality_report as any)?.overall_score || 'unknown'}`);
    console.log(`📧 Email Client Tests: ${(params.quality_report as any)?.email_client_tests?.length || 0}`);
    console.log(`🎯 Approval Status: ${(params.quality_report as any)?.approval_status || 'unknown'}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive quality context
      const qualityContext = await buildQualityContextFromOutputs(
        params.design_context as any,
        params.quality_report,
        params.test_artifacts,
        params.compliance_status
      );

      // Validate quality context completeness
      const validation = validateContextCompleteness(qualityContext, 'quality');
      if (!validation.isComplete) {
        console.warn('⚠️ Quality context incomplete:', validation.missingFields);
        return `Quality context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }

      // Extract campaign path correctly - handle handoff file path vs campaign directory
      let campaignPath = (params.content_context as any)?.campaign?.campaignPath;
      
      // If campaignPath is a handoff file path, extract the campaign directory
      if (campaignPath && campaignPath.includes('/handoffs/')) {
        campaignPath = campaignPath.split('/handoffs/')[0];
        console.log(`🔧 Corrected campaignPath from handoff file to directory: ${campaignPath}`);
      } else if (campaignPath && campaignPath.endsWith('.json')) {
        // Handle case where full handoff file path is passed
        campaignPath = path.dirname(path.dirname(campaignPath));
        console.log(`🔧 Corrected campaignPath from file path to directory: ${campaignPath}`);
      }
      
      if (!campaignPath) {
        throw new Error('Campaign path is missing from content context. Content Specialist must provide valid campaign.campaignPath.');
      }
      
      // Save quality context to campaign folder
      await saveQualityContext(qualityContext, campaignPath);

      // Prepare handoff to Delivery Specialist
      const handoffData = await prepareQualityToDeliveryHandoff(
        params.request,
        params.content_context,
        params.design_context as any,
        qualityContext,
        params.trace_id || undefined
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, QualityToDeliveryHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      console.log('✅ Quality context built and validated');
      console.log('📊 Quality summary:', {
        overall_score: qualityContext.quality_report.overall_score,
        email_client_tests: qualityContext.quality_report.email_client_tests.length,
        accessibility_score: qualityContext.quality_report.accessibility_test.overall_score,
        deliverability_score: qualityContext.quality_report.deliverability_score,
        approval_status: qualityContext.quality_report.approval_status
      });

      // Save handoff data to campaign folder for Delivery Specialist
      const handoffPath3 = path.join(campaignPath, 'handoffs', 'quality-to-delivery.json');
      await fs.mkdir(path.dirname(handoffPath3), { recursive: true });
      await fs.writeFile(handoffPath3, JSON.stringify(handoffData, null, 2));
      
      // ✅ CORRECT: Return result and let OpenAI SDK handle handoff automatically
      console.log('🔄 Quality finalization complete - OpenAI SDK will handle handoff to Delivery Specialist');
      
      return {
        status: 'quality_finalized_ready_for_delivery',
        quality_context: qualityContext,
        handoff_data: handoffData,
        overall_score: qualityContext.quality_report.overall_score,
        email_client_tests: qualityContext.quality_report.email_client_tests.length,
        accessibility_score: qualityContext.quality_report.accessibility_test.overall_score,
        approval_status: qualityContext.quality_report.approval_status,
        next_specialist: 'delivery',
        message: `Quality work finalized and ready for Delivery Specialist handoff. Overall score: ${qualityContext.quality_report.overall_score}. Email client tests: ${qualityContext.quality_report.email_client_tests.length}. Accessibility score: ${qualityContext.quality_report.accessibility_test.overall_score}. Approval: ${qualityContext.quality_report.approval_status}. Handoff data prepared for automatic SDK transfer.`
      };

    } catch (error) {
      console.error('❌ Quality finalization failed:', error);
      return `Quality finalization failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

// ============================================================================
// DELIVERY SPECIALIST FINALIZATION
// ============================================================================

export const createFinalDeliveryPackage = tool({
  name: 'createFinalDeliveryPackage',
  description: 'Create final delivery package with all campaign materials, reports, and export files',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    content_context: z.any().nullable().describe('Content context from Content Specialist'),
    design_context: z.any().nullable().describe('Design context from Design Specialist'),
    quality_context: z.any().nullable().describe('Quality context from Quality Specialist'),
    delivery_manifest: z.any().nullable().describe('Delivery manifest with package contents'),
    export_format: z.any().nullable().describe('Export format configuration'),
    delivery_report: z.any().nullable().describe('Final delivery report'),
    deployment_artifacts: z.any().nullable().describe('Deployment artifacts organization'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }).strict(),
  execute: async (params, _context) => {
    console.log('\n🎯 === DELIVERY SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`📦 Package Format: ${(params.export_format as any).format}`);
    console.log(`📁 Total Files: ${(params.delivery_manifest as any).total_files}`);
    console.log(`💾 Total Size: ${((params.delivery_manifest as any).total_size / 1024).toFixed(2)} KB`);
    console.log(`🚀 Deployment Ready: ${(params.delivery_report as any).deployment_ready}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive delivery context
      const deliveryContext = await buildDeliveryContextFromOutputs(
        params.quality_context as any,
        params.delivery_manifest,
        params.export_format,
        params.delivery_report,
        params.deployment_artifacts
      );

      // Validate delivery context completeness
      const validation = validateContextCompleteness(deliveryContext, 'delivery');
      if (!validation.isComplete) {
        console.warn('⚠️ Delivery context incomplete:', validation.missingFields);
        return `Delivery context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }

      // Extract campaign path correctly - handle handoff file path vs campaign directory
      let campaignPath = (params.content_context as any)?.campaign?.campaignPath;
      
      // If campaignPath is a handoff file path, extract the campaign directory
      if (campaignPath && campaignPath.includes('/handoffs/')) {
        campaignPath = campaignPath.split('/handoffs/')[0];
        console.log(`🔧 Corrected campaignPath from handoff file to directory: ${campaignPath}`);
      } else if (campaignPath && campaignPath.endsWith('.json')) {
        // Handle case where full handoff file path is passed
        campaignPath = path.dirname(path.dirname(campaignPath));
        console.log(`🔧 Corrected campaignPath from file path to directory: ${campaignPath}`);
      }
      
      if (!campaignPath) {
        throw new Error('Campaign path is missing from content context. Content Specialist must provide valid campaign.campaignPath.');
      }
      
      // Save delivery context to campaign folder
      await saveDeliveryContext(deliveryContext, campaignPath);

      // Create final delivery summary
      const deliverySummary = {
        campaign_id: (params.content_context as any)?.campaign?.id || 'unknown',
        campaign_name: (params.content_context as any)?.campaign?.name || 'unknown',
        total_files: (deliveryContext as any)?.delivery_manifest?.total_files || 0,
        total_size: `${((deliveryContext as any)?.delivery_manifest?.total_size || 0) / 1024} KB`,
        export_path: (deliveryContext as any)?.export_format?.export_path || 'unknown',
        deployment_ready: (deliveryContext as any)?.delivery_report?.deployment_ready || false,
        quality_score: (params.quality_context as any)?.quality_report?.overall_score || 0,
        completion_time: (deliveryContext as any)?.delivery_timestamp || new Date().toISOString()
      };

      // Save final delivery summary
      const summaryPath = path.join(campaignPath, 'docs', 'delivery-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(deliverySummary, null, 2));

      console.log('✅ Delivery context built and validated');
      console.log('📦 Final delivery summary:', {
        campaign_id: deliverySummary.campaign_id,
        total_files: deliverySummary.total_files,
        total_size: deliverySummary.total_size,
        deployment_ready: deliverySummary.deployment_ready,
        quality_score: deliverySummary.quality_score
      });

      // Create final workflow completion report
      const workflowReport = {
        status: 'completed',
        campaign_id: (params.content_context as any)?.campaign?.id || 'unknown',
        campaign_name: (params.content_context as any)?.campaign?.name || 'unknown',
        completion_time: new Date().toISOString(),
        workflow_summary: {
          content_specialist: {
            subject: (params.content_context as any)?.generated_content?.subject || 'No subject',
            pricing: `${(params.content_context as any)?.pricing_analysis?.best_price || 'N/A'} ${(params.content_context as any)?.pricing_analysis?.currency || 'N/A'}`,
            visual_style: (params.content_context as any)?.asset_strategy?.visual_style || 'default'
          },
          design_specialist: {
            template_size: `${((params.design_context as any)?.mjml_template?.file_size || 0) / 1024} KB`,
            assets_count: ((params.design_context as any)?.asset_manifest?.images?.length || 0) + ((params.design_context as any)?.asset_manifest?.icons?.length || 0),
            performance_score: (params.design_context as any)?.performance_metrics?.optimization_score || 0
          },
          quality_specialist: {
            overall_score: (params.quality_context as any)?.quality_report?.overall_score || 0,
            email_client_tests: (params.quality_context as any)?.quality_report?.email_client_tests?.length || 0,
            accessibility_score: (params.quality_context as any)?.quality_report?.accessibility_test?.overall_score || 0,
            approval_status: (params.quality_context as any)?.quality_report?.approval_status || 'unknown'
          },
          delivery_specialist: {
            package_format: (deliveryContext as any)?.export_format?.format || 'unknown',
            total_files: (deliveryContext as any)?.delivery_manifest?.total_files || 0,
            total_size: deliverySummary.total_size,
            deployment_ready: (deliveryContext as any)?.delivery_report?.deployment_ready || false
          }
        },
        final_deliverables: (deliveryContext as any)?.delivery_report?.deliverables || []
      };

      return `🎉 WORKFLOW COMPLETED SUCCESSFULLY! 

Campaign: ${workflowReport.campaign_name} (${workflowReport.campaign_id})
Subject: "${workflowReport.workflow_summary.content_specialist.subject}"
Price: ${workflowReport.workflow_summary.content_specialist.pricing}
Quality Score: ${workflowReport.workflow_summary.quality_specialist.overall_score}
Package: ${workflowReport.workflow_summary.delivery_specialist.total_files} files, ${workflowReport.workflow_summary.delivery_specialist.total_size}
Status: ${workflowReport.workflow_summary.quality_specialist.approval_status}
Deployment Ready: ${workflowReport.workflow_summary.delivery_specialist.deployment_ready}

Final package available at: ${deliveryContext.export_format.export_path}

All specialist work has been successfully completed with full context preservation throughout the workflow.`;

    } catch (error) {
      console.error('❌ Delivery finalization failed:', error);
      return `Delivery finalization failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Validates that all required outputs are present for finalization
 */
export function validateSpecialistOutputs(outputs: any, specialistType: string): {
  isValid: boolean;
  missingOutputs: string[];
} {
  const missingOutputs: string[] = [];

  switch (specialistType) {
    case 'content':
      if (!outputs.context_analysis) missingOutputs.push('context_analysis');
      if (!outputs.date_analysis) missingOutputs.push('date_analysis');
      if (!outputs.pricing_analysis) missingOutputs.push('pricing_analysis');
      if (!outputs.asset_strategy) missingOutputs.push('asset_strategy');
      if (!outputs.generated_content) missingOutputs.push('generated_content');
      break;

    case 'design':
      if (!outputs.asset_manifest) missingOutputs.push('asset_manifest');
      if (!outputs.mjml_template) missingOutputs.push('mjml_template');
      if (!outputs.design_decisions) missingOutputs.push('design_decisions');
      if (!outputs.performance_metrics) missingOutputs.push('performance_metrics');
      break;

    case 'quality':
      if (!outputs.quality_report) missingOutputs.push('quality_report');
      if (!outputs.test_artifacts) missingOutputs.push('test_artifacts');
      if (!outputs.compliance_status) missingOutputs.push('compliance_status');
      break;

    case 'delivery':
      if (!outputs.delivery_manifest) missingOutputs.push('delivery_manifest');
      if (!outputs.export_format) missingOutputs.push('export_format');
      if (!outputs.delivery_report) missingOutputs.push('delivery_report');
      if (!outputs.deployment_artifacts) missingOutputs.push('deployment_artifacts');
      break;
  }

  return {
    isValid: missingOutputs.length === 0,
    missingOutputs
  };
}

/**
 * Creates a finalization summary for monitoring
 */
export function createFinalizationSummary(
  specialistType: string,
  outputs: any,
  processingTime: number
): any {
  const summary = {
    specialist: specialistType,
    timestamp: new Date().toISOString(),
    processing_time: processingTime,
    outputs_count: Object.keys(outputs).length,
    status: 'completed'
  };

  // Add specialist-specific metrics
  switch (specialistType) {
    case 'content':
      return {
        ...summary,
        subject: outputs.generated_content?.subject,
        pricing: outputs.pricing_analysis?.best_price,
        visual_style: outputs.asset_strategy?.visual_style
      };

    case 'design':
      return {
        ...summary,
        template_size: outputs.mjml_template?.file_size,
        assets_count: (outputs.asset_manifest?.images?.length || 0) + (outputs.asset_manifest?.icons?.length || 0),
        performance_score: outputs.performance_metrics?.optimization_score
      };

    case 'quality':
      return {
        ...summary,
        overall_score: outputs.quality_report?.overall_score,
        email_client_tests: outputs.quality_report?.email_client_tests?.length || 0,
        approval_status: outputs.quality_report?.approval_status
      };

    case 'delivery':
      return {
        ...summary,
        total_files: outputs.delivery_manifest?.total_files,
        total_size: outputs.delivery_manifest?.total_size,
        deployment_ready: outputs.delivery_report?.deployment_ready
      };

    default:
      return summary;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const specialistFinalizationTools = [
  finalizeContentAndTransferToDesign,
  finalizeDesignAndTransferToQuality,
  finalizeQualityAndTransferToDelivery,
  createFinalDeliveryPackage
];

// All functions are already exported in their declarations above