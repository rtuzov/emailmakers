/**
 * 🎯 DESIGN SPECIALIST FINALIZATION TOOL
 * 
 * Standalone finalization tool for Design Specialist to avoid circular imports.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import {
  DesignContext,
  createHandoffMetadata,
  validateHandoffData,
  DesignToQualityHandoffSchema
} from './handoff-schemas';

import {
  buildDesignContextFromOutputs,
  saveDesignContext,
  prepareDesignToQualityHandoff,
  validateContextCompleteness
} from './context-builders';

// Import handoff monitoring system
import { getHandoffMonitor } from './handoff-monitoring';
import { getGlobalLogger } from './agent-logger';
import { debuggers } from './debug-output';

// Initialize logging and monitoring
const logger = getGlobalLogger();
const debug = debuggers.handoffs;

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
  }).strict(),
  execute: async (params, context) => {
    const startTime = Date.now();
    
    // Extract campaign path correctly - handle handoff file path vs campaign directory
    let campaignPath;
    if (params.content_context?.campaign?.campaignPath) {
      campaignPath = params.content_context.campaign.campaignPath;
    } else if (params.content_context?.campaign_path) {
      campaignPath = params.content_context.campaign_path;
    } else {
      console.error('❌ DESIGN FINALIZATION: Campaign path not found in content context');
      throw new Error('Campaign path is missing from content context. Content Specialist must provide valid campaign.campaignPath. No fallback campaign detection allowed.');
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
    
    const handoffMonitor = getHandoffMonitor(campaignPath, logger);
    
    debug.info('DesignFinalization', 'Design Specialist finalization started', {
      request_preview: params.request.substring(0, 50),
      mjml_status: params.mjml_template.validation_status,
      performance_score: params.performance_metrics.optimization_score,
      campaignPath,
      trace_id: params.trace_id
    });

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
        console.warn('⚠️ Design context incomplete:', validation.missingFields);
        return `Design context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }

      // Save design context to campaign folder
      await saveDesignContext(designContext, campaignPath);

      // Prepare handoff to Quality Specialist
      const handoffData = await prepareDesignToQualityHandoff(
        params.request,
        params.content_context,
        designContext,
        params.trace_id
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      debug.info('DesignFinalization', 'Design context built and validated', {
        template_size: `${(designContext.mjml_template.file_size / 1024).toFixed(2)} KB`,
        assets_count: designContext.asset_manifest.images.length + designContext.asset_manifest.icons.length,
        performance_score: designContext.performance_metrics.optimization_score,
        layout_strategy: designContext.design_decisions.layout_strategy
      });

      // Monitor handoff to Quality Specialist
      debug.info('DesignFinalization', 'Monitoring handoff to Quality Specialist', {
        handoff_type: 'design-to-quality',
        data_size: JSON.stringify(handoffData).length,
        template_size: designContext.mjml_template.file_size
      });

      const handoffMetrics = await handoffMonitor.monitorHandoff(
        'DesignSpecialist',
        'QualitySpecialist',
        handoffData,
        params.content_context.campaign?.id || 'unknown'
      );

      // Save handoff data to campaign folder for Quality Specialist
      debug.info('DesignFinalization', 'Saving handoff data for Quality Specialist', {
        handoff_path: path.join(campaignPath, 'handoffs', 'design-to-quality.json')
      });
      
      const handoffPath = path.join(campaignPath, 'handoffs', 'design-to-quality.json');
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));

      const duration = Date.now() - startTime;
      
      debug.info('DesignFinalization', 'Design finalization completed', {
        duration,
        handoff_duration: handoffMetrics.duration,
        handoff_success: handoffMetrics.success,
        data_size: handoffMetrics.dataSize,
        template_size: designContext.mjml_template.file_size,
        campaignPath
      });

      return `Design work finalized and successfully transferred to Quality Specialist. Template: ${(designContext.mjml_template.file_size / 1024).toFixed(2)} KB. Assets: ${designContext.asset_manifest.images.length + designContext.asset_manifest.icons.length}. Performance: ${designContext.performance_metrics.optimization_score}. Layout: ${designContext.design_decisions.layout_strategy}. Handoff monitored (${handoffMetrics.duration}ms, ${handoffMetrics.dataSize} bytes). Handoff data saved to campaign folder for Quality Specialist to process.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      debug.error('DesignFinalization', 'Design finalization failed', {
        error: error.message,
        duration,
        campaignPath,
        trace_id: params.trace_id
      });
      
      logger.error('DesignFinalization', 'Design finalization failed', {
        error: error.message,
        duration,
        campaignPath
      });
      
      return `Design finalization failed: ${error.message}`;
    }
  }
}); 