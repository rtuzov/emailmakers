/**
 * 🎯 QUALITY SPECIALIST FINALIZATION TOOL
 * 
 * Standalone finalization tool for Quality Specialist to avoid circular imports.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import {
  QualityContext,
  createHandoffMetadata,
  validateHandoffData,
  QualityToDeliveryHandoffSchema
} from './handoff-schemas';

import {
  buildQualityContextFromOutputs,
  saveQualityContext,
  prepareQualityToDeliveryHandoff,
  validateContextCompleteness
} from './context-builders';

// Import handoff monitoring system
import { getHandoffMonitor } from './handoff-monitoring';
import { getGlobalLogger } from './agent-logger';
import { debuggers } from './debug-output';

// Initialize logging and monitoring
const logger = getGlobalLogger();
const debug = debuggers.handoffs;

export const finalizeQualityAndTransferToDelivery = tool({
  name: 'finalizeQualityAndTransferToDelivery',
  description: 'Finalize all Quality Specialist work and prepare comprehensive handoff to Delivery Specialist with complete quality package',
  parameters: z.object({
    request: z.string().describe('Original user request'),
          content_context: z.any().describe('Content context from Content Specialist'),
      design_context: z.any().describe('Design context from Design Specialist'),
      quality_report: z.any().describe('Comprehensive quality analysis report'),
      validation_results: z.any().describe('Validation results from all tests'),
      performance_analysis: z.any().describe('Performance analysis results'),
      client_compatibility: z.any().describe('Email client compatibility results'),
      accessibility_test: z.any().describe('Accessibility test results'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    const campaignPath = params.content_context.campaign_path || params.design_context.campaign_path || process.cwd();
    const handoffMonitor = getHandoffMonitor(campaignPath, logger);
    
    debug.info('QualityFinalization', 'Quality Specialist finalization started', {
      quality_score: params.quality_report.overall_score,
      validation_status: params.validation_results.status,
      performance_score: params.performance_analysis.score,
      trace_id: params.trace_id
    });
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`📊 Quality Score: ${params.quality_report.overall_score}`);
    console.log(`✅ Validation Status: ${params.validation_results.validation_passed}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive quality context
      const qualityContext = await buildQualityContextFromOutputs(
        params.design_context,
        params.quality_report,
        params.validation_results,
        params.performance_analysis
      );

      // Validate quality context completeness
      const validation = validateContextCompleteness(qualityContext, 'quality');
      if (!validation.isComplete) {
        console.warn('⚠️ Quality context incomplete:', validation.missingFields);
        return `Quality context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }

      // Save quality context to campaign folder
      // Extract campaign path correctly - handle handoff file path vs campaign directory
      let campaignPath = params.content_context.campaign.campaignPath;
      
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
      await saveQualityContext(qualityContext, campaignPath);

      // Prepare handoff to Delivery Specialist
      const handoffData = await prepareQualityToDeliveryHandoff(
        params.request,
        params.content_context,
        params.design_context,
        qualityContext,
        params.trace_id
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, QualityToDeliveryHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      debug.info('QualityFinalization', 'Quality context built and validated', {
        overall_score: qualityContext.quality_report.overall_score,
        email_client_tests: qualityContext.quality_report.email_client_tests.length,
        accessibility_score: qualityContext.quality_report.accessibility_test.overall_score,
        deliverability_score: qualityContext.quality_report.deliverability_score,
        approval_status: qualityContext.quality_report.approval_status
      });

      // Monitor handoff to Delivery Specialist
      debug.info('QualityFinalization', 'Monitoring handoff to Delivery Specialist', {
        handoff_type: 'quality-to-delivery',
        data_size: JSON.stringify(handoffData).length,
        overall_score: qualityContext.quality_report.overall_score,
        approval_status: qualityContext.quality_report.approval_status
      });

      const handoffMetrics = await handoffMonitor.monitorHandoff(
        'QualitySpecialist',
        'DeliverySpecialist',
        handoffData,
        params.content_context.campaign.id
      );

      // Save handoff data to campaign folder for Delivery Specialist
      debug.info('QualityFinalization', 'Saving handoff data for Delivery Specialist', {
        handoff_path: path.join(campaignPath, 'handoffs', 'quality-to-delivery.json')
      });
      
      const handoffPath = path.join(campaignPath, 'handoffs', 'quality-to-delivery.json');
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));

      const duration = Date.now() - startTime;
      
      debug.info('QualityFinalization', 'Quality finalization completed', {
        duration,
        handoff_duration: handoffMetrics.duration,
        handoff_success: handoffMetrics.success,
        data_size: handoffMetrics.dataSize,
        overall_score: qualityContext.quality_report.overall_score
      });

      return `Quality work finalized and successfully transferred to Delivery Specialist. Overall score: ${qualityContext.quality_report.overall_score}. Email client tests: ${qualityContext.quality_report.email_client_tests.length}. Accessibility score: ${qualityContext.quality_report.accessibility_test.overall_score}. Approval: ${qualityContext.quality_report.approval_status}. Handoff monitored (${handoffMetrics.duration}ms, ${handoffMetrics.dataSize} bytes). Handoff data saved to campaign folder for Delivery Specialist to process.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      debug.error('QualityFinalization', 'Quality finalization failed', {
        error: error.message,
        duration,
        trace_id: params.trace_id
      });
      
      logger.error('QualityFinalization', 'Quality finalization failed', {
        error: error.message,
        duration
      });
      
      return `Quality finalization failed: ${error.message}`;
    }
  }
}); 