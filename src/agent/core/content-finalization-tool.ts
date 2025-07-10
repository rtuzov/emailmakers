/**
 * 🎯 CONTENT SPECIALIST FINALIZATION TOOL
 * 
 * Standalone finalization tool for Content Specialist to avoid circular imports.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

import {
  ContentContext,
  createHandoffMetadata,
  validateHandoffData,
  ContentToDesignHandoffSchema
} from './handoff-schemas';

import {
  buildContentContextFromOutputs,
  saveContentContext,
  prepareContentToDesignHandoff,
  validateContextCompleteness
} from './context-builders';

// Import handoff monitoring system
import { getHandoffMonitor } from './handoff-monitoring';
import { getGlobalLogger } from './agent-logger';
import { debuggers } from './debug-output';

// Initialize logging and monitoring
const logger = getGlobalLogger();
const debug = debuggers.handoffs;

export const finalizeContentAndTransferToDesign = tool({
  name: 'finalizeContentAndTransferToDesign',
  description: 'Finalize all Content Specialist work and prepare comprehensive handoff to Design Specialist with complete context',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    campaign_id: z.string().describe('Campaign identifier'),
    campaign_path: z.string().describe('Campaign folder path'),
    context_analysis: z.object({
      industry: z.string().nullable(),
      target_audience: z.string().nullable(),
      campaign_type: z.string().nullable(),
      language: z.string().nullable(),
      market_insights: z.object({
        trends: z.array(z.string()).nullable(),
        preferences: z.array(z.string()).nullable()
      }).nullable()
    }).describe('Context analysis results'),
    date_analysis: z.object({
      optimal_dates: z.array(z.string()),
      seasonal_factors: z.array(z.string()).nullable(),
      booking_trends: z.object({
        peak_periods: z.array(z.string()).nullable(),
        advance_booking: z.string().nullable()
      }).nullable()
    }).describe('Date analysis results'),
    pricing_analysis: z.object({
      best_price: z.string(),
      currency: z.string(),
      products: z.array(z.object({
        name: z.string(),
        price: z.string(),
        description: z.string().nullable()
      })).nullable(),
      pricing_strategy: z.string().nullable()
    }).describe('Pricing analysis results'),
    asset_strategy: z.object({
      theme: z.string(),
      visual_style: z.string(),
      color_palette: z.string(),
      typography: z.string(),
      image_concepts: z.array(z.string()),
      layout_hierarchy: z.string(),
      emotional_triggers: z.string(),
      brand_consistency: z.string()
    }).describe('Asset strategy results'),
    generated_content: z.object({
      subject: z.string(),
      preheader: z.string(),
      body_sections: z.array(z.string()),
      cta_buttons: z.array(z.string()),
      footer_content: z.string().nullable(),
      social_links: z.array(z.string()).nullable()
    }).describe('Generated content results'),
    technical_requirements: z.object({
      email_clients: z.array(z.string()).nullable(),
      responsive_design: z.boolean().nullable(),
      dark_mode_support: z.boolean().nullable(),
      accessibility_level: z.string().nullable(),
      performance_requirements: z.object({
        max_file_size: z.number().nullable(),
        load_time_target: z.number().nullable()
      }).nullable()
    }).nullable().describe('Technical requirements'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, context) => {
    const startTime = Date.now();
    const handoffMonitor = getHandoffMonitor(params.campaign_path, logger);
    
    debug.info('ContentFinalization', 'Content Specialist finalization started', {
      campaign_id: params.campaign_id,
      campaign_path: params.campaign_path,
      trace_id: params.trace_id
    });

    try {
      // Transform input data to match context builder expectations
      const transformedContextAnalysis = {
        destination: 'Turkey', // Will be normalized by context builder
        seasonal_trends: params.context_analysis?.market_insights?.trends?.join(', ') || '',
        emotional_triggers: params.asset_strategy?.emotional_triggers || '',
        market_positioning: params.context_analysis?.industry || '',
        competitive_landscape: 'Travel market competition',
        price_sensitivity: 'High',
        booking_patterns: params.date_analysis?.booking_trends?.advance_booking || ''
      };

      const transformedDateAnalysis = {
        destination: 'Turkey',
        season: 'summer',
        optimal_dates: params.date_analysis?.optimal_dates || [],
        pricing_windows: [],
        booking_recommendation: params.date_analysis?.booking_trends?.advance_booking || '',
        seasonal_factors: params.date_analysis?.seasonal_factors || [],
        current_date: new Date().toISOString().split('T')[0]
      };

      const transformedPricingAnalysis = {
        best_price: params.pricing_analysis?.best_price || '0',
        min_price: params.pricing_analysis?.best_price || '0',
        max_price: params.pricing_analysis?.best_price || '0',
        average_price: params.pricing_analysis?.best_price || '0',
        currency: params.pricing_analysis?.currency || 'RUB',
        offers_count: 0,
        recommended_dates: params.date_analysis?.optimal_dates || [],
        route: {
          from: 'Moscow',
          to: 'Istanbul',
          from_code: 'MOW',
          to_code: 'IST'
        },
        enhanced_features: {
          airport_conversion: {},
          csv_integration: 'enabled',
          api_source: 'kupibilet_api'
        }
      };

      const transformedGeneratedContent = {
        subject: params.generated_content?.subject || '',
        preheader: params.generated_content?.preheader || '',
        body: params.generated_content?.body_sections?.join('\n\n') || '',
        cta: {
          primary: params.generated_content?.cta_buttons?.[0] || 'Book Now',
          secondary: params.generated_content?.cta_buttons?.[1] || 'Learn More'
        },
        personalization_level: 'advanced',
        urgency_level: 'high'
      };

      // Build comprehensive content context
      const contentContext = await buildContentContextFromOutputs(
        params.campaign_id,
        params.campaign_path,
        transformedContextAnalysis,
        transformedDateAnalysis,
        transformedPricingAnalysis,
        params.asset_strategy,
        transformedGeneratedContent,
        params.technical_requirements
      );

      // Validate content context completeness
      const validation = validateContextCompleteness(contentContext, 'content');
      if (!validation.isComplete) {
        console.warn('⚠️ Content context incomplete:', validation.missingFields);
        return `Content context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }

      // Save content context to campaign folder
      await saveContentContext(contentContext, params.campaign_path);

      // Prepare handoff to Design Specialist with execution time
      const executionTime = Date.now() - startTime;
      const handoffData = await prepareContentToDesignHandoff(
        params.request,
        contentContext,
        params.trace_id,
        executionTime
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }

      debug.info('ContentFinalization', 'Content context built and validated', {
        subject: contentContext.generated_content.subject,
        pricing: `${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}`,
        visual_style: contentContext.asset_strategy.visual_style,
        dates: contentContext.date_analysis.optimal_dates.slice(0, 3).join(', ')
      });

      // Monitor handoff to Design Specialist
      debug.info('ContentFinalization', 'Monitoring handoff to Design Specialist', {
        campaign_id: params.campaign_id,
        handoff_type: 'content-to-design',
        data_size: JSON.stringify(handoffData).length
      });

      const handoffMetrics = await handoffMonitor.monitorHandoff(
        'ContentSpecialist',
        'DesignSpecialist',
        handoffData,
        params.campaign_id
      );

      // Save handoff data to campaign folder for Design Specialist
      debug.info('ContentFinalization', 'Saving handoff data for Design Specialist', {
        handoff_path: path.join(params.campaign_path, 'handoffs', 'content-to-design.json')
      });
      
      const handoffPath = path.join(params.campaign_path, 'handoffs', 'content-to-design.json');
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));

      const duration = Date.now() - startTime;
      
      debug.info('ContentFinalization', 'Content finalization completed', {
        campaign_id: params.campaign_id,
        duration,
        handoff_duration: handoffMetrics.duration,
        handoff_success: handoffMetrics.success,
        data_size: handoffMetrics.dataSize
      });

      return `✅ Content work finalized! Campaign: ${params.campaign_id}. Subject: "${contentContext.generated_content.subject}". Price: ${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}. Visual style: ${contentContext.asset_strategy.visual_style}. Ready for Design Specialist transfer via OpenAI SDK handoff system.`;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      debug.error('ContentFinalization', 'Content finalization failed', {
        error: error.message,
        campaign_id: params.campaign_id,
        duration,
        trace_id: params.trace_id
      });
      
      logger.error('ContentFinalization', 'Content finalization failed', {
        error: error.message,
        campaign_id: params.campaign_id,
        duration
      });
      
      return `Content finalization failed: ${error.message}`;
    }
  }
}); 