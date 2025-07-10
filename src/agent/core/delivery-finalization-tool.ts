/**
 * 🎯 DELIVERY SPECIALIST FINALIZATION TOOL
 * 
 * Standalone finalization tool for Delivery Specialist to avoid circular imports.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import {
  DeliveryContext,
  createHandoffMetadata,
  validateHandoffData
} from './handoff-schemas';

import {
  buildDeliveryContextFromOutputs,
  saveDeliveryContext,
  validateContextCompleteness
} from './context-builders';

export const createFinalDeliveryPackage = tool({
  name: 'createFinalDeliveryPackage',
  description: 'Create final delivery package with all campaign materials, reports, and export files',
  parameters: z.object({
    request: z.string().describe('Original user request'),
          content_context: z.any().describe('Content context from Content Specialist'),
      design_context: z.any().describe('Design context from Design Specialist'),
      quality_context: z.any().describe('Quality context from Quality Specialist'),
      delivery_manifest: z.any().describe('Delivery manifest with package contents'),
      export_format: z.any().describe('Export format configuration'),
      delivery_report: z.any().describe('Final delivery report'),
      deployment_artifacts: z.any().describe('Deployment artifacts organization'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    console.log('\n🎯 === DELIVERY SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`📦 Package Format: ${params.export_format.format}`);
    console.log(`📁 Total Files: ${params.delivery_manifest.total_files}`);
    console.log(`💾 Total Size: ${(params.delivery_manifest.total_size / 1024).toFixed(2)} KB`);
    console.log(`🚀 Deployment Ready: ${params.delivery_report.deployment_ready}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive delivery context
      const deliveryContext = await buildDeliveryContextFromOutputs(
        params.quality_context,
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

      // Save delivery context to campaign folder
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
      await saveDeliveryContext(deliveryContext, campaignPath);

      // Create final delivery summary
      const deliverySummary = {
        campaign_id: params.content_context.campaign.id,
        campaign_name: params.content_context.campaign.name,
        total_files: deliveryContext.delivery_manifest.total_files,
        total_size: `${(deliveryContext.delivery_manifest.total_size / 1024).toFixed(2)} KB`,
        export_path: deliveryContext.export_format.export_path,
        deployment_ready: deliveryContext.delivery_report.deployment_ready,
        quality_score: params.quality_context.quality_report.overall_score,
        completion_time: deliveryContext.delivery_timestamp
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
        campaign_id: params.content_context.campaign.id,
        campaign_name: params.content_context.campaign.name,
        completion_time: new Date().toISOString(),
        workflow_summary: {
          content_specialist: {
            subject: params.content_context.generated_content.subject,
            pricing: `${params.content_context.pricing_analysis.best_price} ${params.content_context.pricing_analysis.currency}`,
            visual_style: params.content_context.asset_strategy.visual_style
          },
          design_specialist: {
            template_size: `${(params.design_context.mjml_template.file_size / 1024).toFixed(2)} KB`,
            assets_count: params.design_context.asset_manifest.images.length + params.design_context.asset_manifest.icons.length,
            performance_score: params.design_context.performance_metrics.optimization_score
          },
          quality_specialist: {
            overall_score: params.quality_context.quality_report.overall_score,
            email_client_tests: params.quality_context.quality_report.email_client_tests.length,
            accessibility_score: params.quality_context.quality_report.accessibility_test.overall_score,
            approval_status: params.quality_context.quality_report.approval_status
          },
          delivery_specialist: {
            package_format: deliveryContext.export_format.format,
            total_files: deliveryContext.delivery_manifest.total_files,
            total_size: deliverySummary.total_size,
            deployment_ready: deliveryContext.delivery_report.deployment_ready
          }
        },
        final_deliverables: deliveryContext.delivery_report.deliverables
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
      return `Delivery finalization failed: ${error.message}`;
    }
  }
}); 