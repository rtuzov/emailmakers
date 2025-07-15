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
import { CampaignPathResolver, CampaignPathError } from './campaign-path-resolver';

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
  execute: async (params, _context) => {
    const startTime = Date.now();
    
    // Resolve and validate campaign path using centralized resolver
    let campaignPath: string;
    try {
      campaignPath = await CampaignPathResolver.resolveAndValidate(params.content_context);
      debug.info('DesignFinalization', 'Campaign path resolved successfully', {
        campaignPath,
        trace_id: params.trace_id
      });
    } catch (error: unknown) {
      console.error('❌ DESIGN FINALIZATION: Campaign path resolution failed');
      if (error instanceof CampaignPathError) {
        throw new Error(`Campaign path resolution failed: ${error.message}. Content Specialist must provide valid campaign path.`);
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Unexpected error in campaign path resolution: ${errorMessage}`);
    }
    
    const handoffMonitor = getHandoffMonitor(campaignPath, logger);
    
    debug.info('DesignFinalization', 'Design Specialist finalization started', {
      request_preview: params.request.substring(0, 50),
      mjml_status: (params.mjml_template as any).validation_status || 'unknown',
      performance_score: (params.performance_metrics as any).optimization_score || 0,
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
        params.trace_id || undefined
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      debug.info('DesignFinalization', 'Design context built and validated', {
        template_size: `${(designContext.mjml_template?.file_size || 0) / 1024} KB`,
        assets_count: (designContext.asset_manifest?.images?.length || 0) + (designContext.asset_manifest?.icons?.length || 0),
        performance_score: designContext.performance_metrics?.optimization_score || 0,
        layout_strategy: designContext.design_decisions?.layout_strategy || 'unknown'
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
        template_size: designContext.mjml_template?.file_size || 0,
        campaignPath
      });

      return `Design work finalized and successfully transferred to Quality Specialist. Template: ${((designContext.mjml_template?.file_size || 0) / 1024).toFixed(2)} KB. Assets: ${(designContext.asset_manifest?.images?.length || 0) + (designContext.asset_manifest?.icons?.length || 0)}. Performance: ${designContext.performance_metrics?.optimization_score || 0}. Layout: ${designContext.design_decisions?.layout_strategy || 'unknown'}. Handoff monitored (${handoffMetrics.duration}ms, ${handoffMetrics.dataSize} bytes). Handoff data saved to campaign folder for Quality Specialist to process.`;

    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      debug.error('DesignFinalization', 'Design finalization failed', {
        error: errorMessage,
        duration,
        campaignPath,
        trace_id: params.trace_id
      });
      
      logger.error('DesignFinalization', 'Design finalization failed', {
        error: errorMessage,
        duration,
        campaignPath
      });
      
      return `Design finalization failed: ${errorMessage}`;
    }
  }
}); 