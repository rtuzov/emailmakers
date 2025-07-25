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
import {
  readJSONOrThrow,
  accessFileOrThrow,
  CRITICAL_OPERATION_RETRY_OPTIONS
} from './file-operations-retry';
import {
  FileNotFoundError,
  DataExtractionError,
  HandoffError,
  createError
} from './error-types';
import {
  ContentContext,
  DesignContext,
  QualityContext,
  DeliveryContext,
  createHandoffMetadata,
  validateHandoffData,
  ContentToDesignHandoffSchema,
  DesignToQualityHandoffSchema,
  QualityToDeliveryHandoffSchema
} from './handoff-schemas';

import {
  buildContentContextFromOutputs,
  buildDesignContextFromOutputs,
  buildQualityContextFromOutputs,
  buildDeliveryContextFromOutputs,
  saveContentContext,
  saveDesignContext,
  saveQualityContext,
  saveDeliveryContext,
  prepareContentToDesignHandoff,
  prepareDesignToQualityHandoff,
  prepareQualityToDeliveryHandoff,
  validateContextCompleteness
} from './context-builders';

// Removed specialist agent imports - handoffs handled by OpenAI SDK

// ============================================================================
// CONTENT SPECIALIST FINALIZATION
// ============================================================================

export const finalizeContentAndTransferToDesign = tool({
  name: 'finalizeContentAndTransferToDesign',
  description: 'Finalize all Content Specialist work and prepare comprehensive handoff to Design Specialist with complete context',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    campaign_id: z.string().describe('Campaign identifier'),
    campaign_path: z.string().describe('Campaign folder path'),
    context_analysis: z.object({}).strict().describe('Context analysis results'),
    date_analysis: z.object({}).strict().describe('Date analysis results'),
    pricing_analysis: z.object({}).strict().describe('Pricing analysis results'),
    asset_strategy: z.object({}).strict().describe('Asset strategy results'),
    generated_content: z.object({}).strict().describe('Generated content results'),
    technical_requirements: z.object({}).strict().describe('Technical requirements'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    console.log('\n🎯 === CONTENT SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Campaign: ${params.campaign_id}`);
    console.log(`📁 Path: ${params.campaign_path}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Check if parameters are empty and load actual data from files
      let contextAnalysis = params.context_analysis;
      let dateAnalysis = params.date_analysis;
      let pricingAnalysis = params.pricing_analysis;
      let assetStrategy = params.asset_strategy;
      let generatedContent = params.generated_content;
      let technicalRequirements = params.technical_requirements;

      // If parameters are empty objects, load from campaign files
      if (Object.keys(params.context_analysis).length === 0) {
        console.log('🔍 Loading context analysis from campaign files...');
        try {
          const contextPath = path.join(params.campaign_path, 'data', 'destination-analysis.json');
          
          // Use enhanced file operations with retry logic
          await accessFileOrThrow(contextPath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
          const rawData = await readJSONOrThrow(contextPath, CRITICAL_OPERATION_RETRY_OPTIONS);
          
          // Extract data from the nested structure
          if (rawData.data) {
            contextAnalysis = rawData.data;
            console.log('✅ Context analysis loaded from file with retry protection (extracted from data field)');
          } else {
            contextAnalysis = rawData;
            console.log('✅ Context analysis loaded from file with retry protection (direct structure)');
          }
        } catch (error) {
          throw new DataExtractionError(
            'context_analysis',
            'destination-analysis',
            path.join(params.campaign_path, 'data', 'destination-analysis.json'),
            error
          );
        }
      }

      if (Object.keys(params.date_analysis).length === 0) {
        console.log('🔍 Loading date analysis from campaign files...');
        try {
          // Try multiple possible locations for date analysis
          const possiblePaths = [
            path.join(params.campaign_path, 'content', 'email-content.json'), // PRIMARY: dates are in email-content.json
            path.join(params.campaign_path, 'data', 'consolidated-insights.json'),
            path.join(params.campaign_path, 'content', 'date-analysis.json'),
            path.join(params.campaign_path, 'data', 'trend-analysis.json')
          ];
          
          let dateData = null;
          for (const filePath of possiblePaths) {
            try {
              // Use enhanced file operations with retry logic
              await accessFileOrThrow(filePath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
              const data = await readJSONOrThrow(filePath, CRITICAL_OPERATION_RETRY_OPTIONS);
              
              // Check for dates field in email-content.json
              if (data.dates && (data.dates.optimal_dates || data.dates.seasonal_factors)) {
                dateData = data.dates;
                console.log(`✅ Date analysis loaded from ${filePath} (dates field)`);
                break;
              }
              // Check for direct fields
              else if (data.optimal_dates || data.seasonal_factors || data.booking_trends) {
                dateData = data;
                console.log(`✅ Date analysis loaded from ${filePath}`);
                break;
              }
            } catch (err) {
              // Continue to next path
            }
          }
          
          if (dateData) {
            dateAnalysis = dateData;
          } else {
            throw new Error('❌ CRITICAL ERROR: No date analysis found in any campaign. Date analysis is required for email generation.');
          }
        } catch (error) {
          throw new Error(`❌ CRITICAL ERROR: Could not load date analysis: ${error.message}`);
        }
      }

      if (Object.keys(params.pricing_analysis).length === 0) {
        console.log('🔍 Loading pricing analysis from campaign files...');
        try {
          // Try multiple possible locations for pricing analysis
          const possiblePaths = [
            path.join(params.campaign_path, 'content', 'email-content.json'), // PRIMARY: pricing is in email-content.json
            path.join(params.campaign_path, 'data', 'consolidated-insights.json'),
            path.join(params.campaign_path, 'content', 'pricing-analysis.json'),
            path.join(params.campaign_path, 'data', 'market-intelligence.json')
          ];
          
          let pricingData = null;
          for (const filePath of possiblePaths) {
            try {
              // Use enhanced file operations with retry logic
              await accessFileOrThrow(filePath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
              const data = await readJSONOrThrow(filePath, CRITICAL_OPERATION_RETRY_OPTIONS);
              
              // Check for pricing field in email-content.json
              if (data.pricing && (data.pricing.best_price || data.pricing.min_price)) {
                pricingData = data.pricing;
                console.log(`✅ Pricing analysis loaded from ${filePath} (pricing field)`);
                break;
              }
              // Check for direct fields
              else if (data.best_price || data.currency || data.pricing_strategy) {
                pricingData = data;
                console.log(`✅ Pricing analysis loaded from ${filePath}`);
                break;
              }
            } catch (err) {
              // Continue to next path
            }
          }
          
          if (pricingData) {
            pricingAnalysis = pricingData;
          } else {
            throw new Error('❌ CRITICAL ERROR: No pricing analysis found in any campaign. Pricing analysis is required for email generation.');
          }
        } catch (error) {
          throw new Error(`❌ CRITICAL ERROR: Could not load pricing analysis: ${error.message}`);
        }
      }

      if (Object.keys(params.asset_strategy).length === 0) {
        console.log('🔍 Loading asset strategy from campaign files...');
        try {
          // Try multiple possible locations for asset strategy
          const possiblePaths = [
            path.join(params.campaign_path, 'content', 'design-brief-from-context.json'),
            path.join(params.campaign_path, 'content', 'asset-strategy.json'),
            path.join(params.campaign_path, 'data', 'emotional-profile.json')
          ];
          
          let assetData = null;
          for (const filePath of possiblePaths) {
            try {
              // Use enhanced file operations with retry logic
              await accessFileOrThrow(filePath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
              const data = await readJSONOrThrow(filePath, CRITICAL_OPERATION_RETRY_OPTIONS);
              
              console.log(`🔍 Checking ${filePath} for asset strategy...`);
              
              // Check for direct fields (original logic)
              if (data.visual_style || data.theme || data.image_concepts || data.color_palette) {
                assetData = data;
                console.log(`✅ Asset strategy loaded from ${filePath} (direct fields)`);
                break;
              }
              // Check for nested design_requirements structure (design-brief-from-context.json)
              else if (data.design_requirements && (
                data.design_requirements.visual_style || 
                data.design_requirements.color_palette || 
                data.design_requirements.imagery_direction
              )) {
                assetData = data;
                console.log(`✅ Asset strategy loaded from ${filePath} (design_requirements structure)`);
                break;
              }
              // Check for destination_context structure 
              else if (data.destination_context && data.destination_context.emotional_appeal) {
                assetData = data;
                console.log(`✅ Asset strategy loaded from ${filePath} (destination_context structure)`);
                break;
              }
              else {
                console.log(`⚠️ File ${filePath} exists but doesn't contain required asset strategy fields`);
              }
            } catch (err) {
              console.log(`⚠️ Could not access ${filePath}: ${err.message}`);
              // Continue to next path
            }
          }
          
          if (assetData) {
            assetStrategy = assetData;
          } else {
            // NO FALLBACK POLICY: Fail fast if asset strategy not found in current campaign
            throw new Error(`❌ CRITICAL ERROR: No asset strategy found in current campaign ${params.campaign_path}. Content Specialist must generate asset strategy in current campaign first. Checked paths: ${possiblePaths.join(', ')}`);
          }
        } catch (error) {
          throw new Error(`❌ CRITICAL ERROR: Could not load asset strategy: ${error.message}`);
        }
      }

      if (Object.keys(params.generated_content).length === 0) {
        console.log('🔍 Loading generated content from campaign files...');
        try {
          let contentPath = path.join(params.campaign_path, 'content', 'email-content.json');
          
          // Try primary campaign path first
          try {
            await accessFileOrThrow(contentPath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
            generatedContent = await readJSONOrThrow(contentPath, CRITICAL_OPERATION_RETRY_OPTIONS);
            console.log('✅ Generated content loaded from primary campaign path');
          } catch (primaryError) {
            // NO FALLBACK POLICY: Fail fast if content not found in current campaign
            throw new DataExtractionError(
              'generated_content',
              'email-content',
              contentPath,
              primaryError
            );
          }
        } catch (error) {
          throw new DataExtractionError(
            'generated_content',
            'email-content',
            path.join(params.campaign_path, 'content', 'email-content.json'),
            error
          );
        }
      }

      // Technical requirements check removed as requested
      // Use empty object as default instead of loading from file
      if (Object.keys(params.technical_requirements).length === 0) {
        console.log('⚠️ Technical requirements check disabled - using empty requirements');
        technicalRequirements = {};
      }

      // Build comprehensive content context with loaded data
      const contentContext = await buildContentContextFromOutputs(
        params.campaign_id,
        params.campaign_path,
        contextAnalysis,
        dateAnalysis,
        pricingAnalysis,
        assetStrategy,
        generatedContent,
        technicalRequirements
      );

      // Validate content context completeness
      const validation = validateContextCompleteness(contentContext, 'content');
      if (!validation.isComplete) {
        throw new Error(`❌ CRITICAL ERROR: Content context incomplete. Missing: ${validation.missingFields.join(', ')}`);
      }

      // Save content context to campaign folder
      await saveContentContext(contentContext, params.campaign_path);

      // Prepare handoff to Design Specialist
      const handoffData = await prepareContentToDesignHandoff(
        params.request,
        contentContext,
        params.trace_id
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      console.log('✅ Content context built and validated');
      console.log('📝 Content summary:', {
        subject: contentContext.generated_content.subject,
        pricing: `${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}`,
        visual_style: contentContext.asset_strategy.visual_style,
        dates: contentContext.date_analysis.optimal_dates.slice(0, 3).join(', ')
      });

      // Save handoff data to campaign folder for Design Specialist
      const handoffPath = path.join(params.campaign_path, 'handoffs', 'content-specialist-to-design-specialist.json');
      console.log(`📁 Creating handoff directory: ${path.dirname(handoffPath)}`);
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      console.log(`💾 Saving handoff file: ${handoffPath}`);
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));
      console.log(`✅ Handoff file saved successfully: ${handoffPath}`);
      
      // ✅ CORRECT: Return result and let OpenAI SDK handle handoff automatically
      // The SDK will pass this result to the Design Specialist via handoff
      console.log('🔄 Content finalization complete - OpenAI SDK will handle handoff to Design Specialist');
      
      return {
        status: 'content_finalized_ready_for_design',
        campaign_id: params.campaign_id,
        content_context: contentContext,
        handoff_data: handoffData,
        subject: contentContext.generated_content.subject,
        price: `${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}`,
        visual_style: contentContext.asset_strategy.visual_style,
        next_specialist: 'design',
        message: `Content work finalized and ready for Design Specialist handoff. Campaign: ${params.campaign_id}. Subject: "${contentContext.generated_content.subject}". Price: ${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}. Visual style: ${contentContext.asset_strategy.visual_style}. Handoff data prepared for automatic SDK transfer.`
      };

    } catch (error) {
      console.error('❌ Content finalization failed:', error);
      return `Content finalization failed: ${error.message}`;
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
  execute: async (params, context) => {
    console.log('\n🎯 === DESIGN SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`🎨 MJML Status: ${params.mjml_template.validation_status}`);
    console.log(`📊 Performance Score: ${params.performance_metrics.optimization_score}`);
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
      if (params.content_context?.campaign?.campaignPath) {
        campaignPath = params.content_context.campaign.campaignPath;
      } else if (params.content_context?.campaignPath) {
        campaignPath = params.content_context.campaignPath;
      } else if (context?.designContext?.campaign_path) {
        campaignPath = context.designContext.campaign_path;
      } else if (context?.contentContext?.campaign?.campaignPath) {
        campaignPath = context.contentContext.campaign.campaignPath;
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
        params.trace_id
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, DesignToQualityHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      console.log('✅ Design context built and validated');
      console.log('🎨 Design summary:', {
        template_size: `${(designContext.mjml_template.file_size / 1024).toFixed(2)} KB`,
        assets_count: designContext.asset_manifest.images.length + designContext.asset_manifest.icons.length,
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
        template_size: `${(designContext.mjml_template.file_size / 1024).toFixed(2)} KB`,
        assets_count: designContext.asset_manifest.images.length + designContext.asset_manifest.icons.length,
        performance_score: designContext.performance_metrics.optimization_score,
        next_specialist: 'quality',
        message: `Design work finalized and ready for Quality Specialist handoff. Template size: ${(designContext.mjml_template.file_size / 1024).toFixed(2)} KB. Assets: ${designContext.asset_manifest.images.length + designContext.asset_manifest.icons.length}. Performance score: ${designContext.performance_metrics.optimization_score}. Handoff data prepared for automatic SDK transfer.`
      };

    } catch (error) {
      console.error('❌ Design finalization failed:', error);
      return `Design finalization failed: ${error.message}`;
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
  execute: async (params, context) => {
    console.log('\n🎯 === QUALITY SPECIALIST FINALIZATION STARTED ===');
    console.log(`📋 Request: ${params.request.substring(0, 50)}...`);
    console.log(`✅ Quality Score: ${params.quality_report.overall_score}`);
    console.log(`📧 Email Client Tests: ${params.quality_report.email_client_tests?.length || 0}`);
    console.log(`🎯 Approval Status: ${params.quality_report.approval_status}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);

    try {
      // Build comprehensive quality context
      const qualityContext = await buildQualityContextFromOutputs(
        params.design_context,
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
      
      // Save quality context to campaign folder
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
      return `Quality finalization failed: ${error.message}`;
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
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    design_context: z.object({}).strict().describe('Design context from Design Specialist'),
    quality_context: z.object({}).strict().describe('Quality context from Quality Specialist'),
    delivery_manifest: z.object({}).strict().describe('Delivery manifest with package contents'),
    export_format: z.object({}).strict().describe('Export format configuration'),
    delivery_report: z.object({}).strict().describe('Final delivery report'),
    deployment_artifacts: z.object({}).strict().describe('Deployment artifacts organization'),
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
      
      // Save delivery context to campaign folder
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