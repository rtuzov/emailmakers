/**
 * 🎯 CONTENT SPECIALIST FINALIZATION TOOL
 * 
 * Standalone finalization tool for Content Specialist to avoid circular imports.
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
} from '../../../core/file-operations-retry';
import {
  DataExtractionError,
  HandoffError,
  createError
} from '../../../core/error-types';

import {
  validateHandoffData,
  ContentToDesignHandoffSchema
} from '../../../core/handoff-schemas';

import {
  buildContentContextFromOutputs,
  saveContentContext,
  prepareContentToDesignHandoff,
  validateContextCompleteness,
  loadDataCollectionContext
} from '../../../core/context-builders';

// Import handoff monitoring system
import { getHandoffMonitor } from '../../../core/handoff-monitoring';
import { getGlobalLogger } from '../../../core/agent-logger';
import { debuggers } from '../../../core/debug-output';
import { CampaignPathResolver, CampaignPathError } from '../../../core/campaign-path-resolver';
import { getErrorMessage } from '../utils/error-handling';

// Initialize logging and monitoring
const logger = getGlobalLogger();
const debug = debuggers.handoffs;

/**
 * Read campaign data from various files
 */
async function readCampaignData(campaignPath: string) {
  const data: any = {};
  
  try {
    // Read destination analysis
    const destPath = path.join(campaignPath, 'data', 'destination-analysis.json');
    const destData = await readJSONOrThrow(destPath, CRITICAL_OPERATION_RETRY_OPTIONS);
    data.destination = destData;
    
    // Read market intelligence  
    const marketPath = path.join(campaignPath, 'data', 'market-intelligence.json');
    const marketData = await readJSONOrThrow(marketPath, CRITICAL_OPERATION_RETRY_OPTIONS);
    data.market = marketData;
    
    // Read emotional profile
    const emotionalPath = path.join(campaignPath, 'data', 'emotional-profile.json');
    const emotionalData = await readJSONOrThrow(emotionalPath, CRITICAL_OPERATION_RETRY_OPTIONS);
    data.emotional = emotionalData;
    
    // Read consolidated insights if available
    try {
      const consolidatedPath = path.join(campaignPath, 'data', 'consolidated-insights.json');
      const consolidatedData = await readJSONOrThrow(consolidatedPath, CRITICAL_OPERATION_RETRY_OPTIONS);
      data.consolidated = consolidatedData;
    } catch {
      // Optional file
    }
    
    return data;
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    throw new DataExtractionError(
      'campaign_data',
      'multiple_files',
      campaignPath,
      error
    );
  }
}

/**
 * Read JSON file safely
 */
async function readJsonFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.warn(`Could not read ${filePath}: ${errorMessage}`);
    return null;
  }
}

/**
 * Extract destination information from campaign data
 */
function extractDestinationInfo(campaignData: any): {
  destination: string;
  season: string;
  country: string;
  city: string;
} {
  // Try to extract from various data sources
  let destination = 'Unknown Destination';
  let season = 'autumn';
  let country = 'Unknown';
  let city = 'Unknown';
  
  // Check destination analysis
  if (campaignData.destination?.data) {
    const destData = campaignData.destination.data;
    
    // Look for destination in various fields
    if (destData.destination_name) {
      destination = destData.destination_name;
    } else if (destData.location) {
      destination = destData.location;
    } else if (destData.country) {
      destination = destData.country;
      country = destData.country;
    }
    
    // Extract city if available
    if (destData.city) {
      city = destData.city;
    } else if (destData.main_city) {
      city = destData.main_city;
    }
    
    // Extract season
    if (destData.season) {
      season = destData.season;
    } else if (destData.optimal_season) {
      season = destData.optimal_season;
    }
  }
  
  // Fallback to market data
  if (destination === 'Unknown Destination' && campaignData.market?.data) {
    const marketData = campaignData.market.data;
    if (marketData.destination) {
      destination = marketData.destination;
    } else if (marketData.target_destination) {
      destination = marketData.target_destination;
    }
  }
  
  // Fallback to emotional data
  if (destination === 'Unknown Destination' && campaignData.emotional?.data) {
    const emotionalData = campaignData.emotional.data;
    if (emotionalData.destination) {
      destination = emotionalData.destination;
    }
  }
  
  return { destination, season, country, city };
}

/**
 * Extract pricing information from campaign data
 */
function extractPricingInfo(campaignData: any): {
  minPrice: number;
  maxPrice: number;
  currency: string;
  route: { from: string; to: string; from_code: string; to_code: string };
} {
  let minPrice = 0;
  let maxPrice = 0;
  let currency = 'RUB';
  let route = {
    from: 'Moscow',
    to: 'Bangkok',
    from_code: 'MOW', 
    to_code: 'BKK'
  };
  
  // Try to extract from market intelligence
  if (campaignData.market?.data) {
    const marketData = campaignData.market.data;
    
    if (marketData.pricing_insights) {
      const pricing = marketData.pricing_insights;
      
      if (pricing.min_price) minPrice = pricing.min_price;
      if (pricing.max_price) maxPrice = pricing.max_price;
      if (pricing.currency) currency = pricing.currency;
      
      // Extract route information
      if (pricing.route) {
        route = { ...route, ...pricing.route };
      }
    }
  }
  
  // Fallback to destination data
  if (minPrice === 0 && campaignData.destination?.data?.pricing) {
    const pricing = campaignData.destination.data.pricing;
    if (pricing.estimated_cost) {
      minPrice = pricing.estimated_cost;
      maxPrice = pricing.estimated_cost * 1.5; // Estimate range
    }
  }
  
  return determineRoute(campaignData);
}

/**
 * Determine route from campaign data
 */
function determineRoute(campaignData: any): { from: string; to: string; from_code: string; to_code: string } {
  // Default route
  let route = {
    from: 'Moscow',
    to: 'Bangkok',
    from_code: 'MOW',
    to_code: 'BKK'
  };
  
  // Try to extract from campaign data
  if (campaignData.market?.data?.route) {
    route = { ...route, ...campaignData.market.data.route };
  }
  
  // Extract destination to determine "to" city
  const { destination } = extractDestinationInfo(campaignData);
  if (destination && destination !== 'Unknown Destination') {
    route.to = destination;
    
    // Map destinations to airport codes
    const airportMap: Record<string, string> = {
      'Thailand': 'BKK',
      'Bangkok': 'BKK',
      'Phuket': 'HKT',
      'Turkey': 'IST',
      'Istanbul': 'IST',
      'UAE': 'DXB',
      'Dubai': 'DXB'
    };
    
    route.to_code = airportMap[destination] || 'BKK';
  }
  
  return route;
}

/**
 * Extract emotional triggers from campaign data
 */
function extractEmotionalTriggers(campaignData: any): string {
  if (campaignData.emotional?.data?.emotional_triggers) {
    return campaignData.emotional.data.emotional_triggers;
  }
  
  if (campaignData.emotional?.data?.core_motivations) {
    return campaignData.emotional.data.core_motivations;
  }
  
  // Fallback based on destination
  const { destination } = extractDestinationInfo(campaignData);
  if (destination.includes('Thailand')) {
    return 'Exotic adventure and cultural immersion';
  }
  
  return 'Travel excitement and new experiences';
}

/**
 * Content Specialist finalization tool
 */
export const finalizeContentAndTransferToDesign = tool({
  name: 'finalizeContentAndTransferToDesign',
  description: 'Finalize all Content Specialist work and prepare comprehensive handoff to Design Specialist with complete context',
  parameters: z.object({
    request: z.string().describe('Original user request'),
    campaign_id: z.string().describe('Campaign identifier'),
    campaign_path: z.string().describe('Campaign folder path'),
    date_analysis: z.any().describe('Date analysis results'),
    pricing_analysis: z.any().describe('Pricing analysis results'),
    asset_strategy: z.any().describe('Asset strategy results'),
    generated_content: z.any().describe('Generated content results'),
    technical_requirements: z.any().describe('Technical requirements'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async (params, _context) => {
    const startTime = Date.now();
    
    // Resolve and validate campaign path using centralized resolver
    let campaignPath: string;
    try {
      campaignPath = await CampaignPathResolver.resolveAndValidate({
        campaign_path: params.campaign_path,
        campaign: { campaignPath: params.campaign_path }
      });
      debug.info('ContentFinalization', 'Campaign path resolved successfully', {
        campaignPath,
        trace_id: params.trace_id
      });
    } catch (error: unknown) {
      console.error('❌ CONTENT FINALIZATION: Campaign path resolution failed');
      if (error instanceof CampaignPathError) {
        throw new Error(`Campaign path resolution failed: ${error.message}. Orchestrator must provide valid campaign path.`);
      }
      const errorMessage = getErrorMessage(error);
      throw new Error(`Unexpected error in campaign path resolution: ${errorMessage}`);
    }
    
    const handoffMonitor = getHandoffMonitor(campaignPath, logger);
    
    debug.info('ContentFinalization', 'Content Specialist finalization started', {
      campaign_id: params.campaign_id,
      campaign_path: campaignPath,
      trace_id: params.trace_id
    });

    try {
      // 🚀 LOAD DATA COLLECTION CONTEXT AND CAMPAIGN DATA
      debug.info('ContentFinalization', 'Loading data collection context and campaign data', {
        campaign_path: campaignPath
      });
      
      // Load data collection context first for complete reference
      const dataCollectionContext = await loadDataCollectionContext(campaignPath);
      
      debug.info('ContentFinalization', 'Data collection context loaded', {
        available_sources: dataCollectionContext.collection_metadata.data_sources.length,
        collection_status: dataCollectionContext.collection_metadata.collection_status,
        quality_score: dataCollectionContext.collection_metadata.data_quality_score
      });
      
      // Also read campaign data for backward compatibility with existing extraction functions
      const campaignData = await readCampaignData(campaignPath);

      // Extract real destination info from campaign data
      const destinationInfo = extractDestinationInfo(campaignData);
      const pricingInfo = extractPricingInfo(campaignData);
      const emotionalTrigger = extractEmotionalTriggers(campaignData);

      debug.info('ContentFinalization', 'Extracted real data from campaign files', {
        destination: destinationInfo.destination,
        season: destinationInfo.season,
        priceRange: `${pricingInfo.minPrice}-${pricingInfo.maxPrice} ${pricingInfo.currency}`,
        route: `${pricingInfo.route.from} -> ${pricingInfo.route.to}`,
        emotionalTrigger,
        dataSource: 'campaign_files'
      });

      // 🎯 BUILD DYNAMIC CONTEXT USING REAL DATA
      const transformedContextAnalysis = {
        destination: destinationInfo.destination, // 🎯 REAL destination
        seasonal_trends: `${destinationInfo.season} season travel trends for ${destinationInfo.destination}`,
        emotional_triggers: emotionalTrigger, // 🎯 REAL emotional triggers
        market_positioning: `Premium ${destinationInfo.destination} travel experience`,
        competitive_landscape: `Competitive ${destinationInfo.destination} travel market`,
        price_sensitivity: 'Medium price sensitivity for exotic destinations',
        booking_patterns: 'Advance planning with seasonal booking patterns'
      };

      const transformedDateAnalysis = {
        destination: destinationInfo.destination, // 🎯 REAL destination
        season: destinationInfo.season, // 🎯 REAL season
        optimal_dates: params.date_analysis?.optimal_dates || [],
        pricing_windows: params.date_analysis?.pricing_windows || [],
        booking_recommendation: 'Book 2-3 months in advance for best rates',
        seasonal_factors: `${destinationInfo.season} season advantages for ${destinationInfo.destination}`,
        current_date: new Date().toISOString().split('T')[0]
      };

      const transformedPricingAnalysis = {
        best_price: pricingInfo.minPrice || params.pricing_analysis?.best_price || 0, // 🎯 REAL pricing
        min_price: pricingInfo.minPrice || params.pricing_analysis?.best_price || 0, // 🎯 REAL pricing
        max_price: pricingInfo.maxPrice || params.pricing_analysis?.best_price || 0, // 🎯 REAL pricing  
        average_price: Math.round((pricingInfo.minPrice + pricingInfo.maxPrice) / 2) || params.pricing_analysis?.best_price || 0,
        currency: pricingInfo.currency, // 🎯 REAL currency
        offers_count: 0,
        recommended_dates: params.date_analysis?.optimal_dates || [],
        route: pricingInfo.route, // 🎯 REAL route from campaign data
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

      // Build comprehensive content context with data collection context
      const contentContext = await buildContentContextFromOutputs(
        params.campaign_id,
        params.campaign_path,
        transformedContextAnalysis,
        transformedDateAnalysis,
        transformedPricingAnalysis,
        params.asset_strategy,
        transformedGeneratedContent,
        params.technical_requirements,
        dataCollectionContext
      );

      // 🚨 ENHANCED VALIDATION: Check completeness, hardcodes, and content quality
      const validation = validateContextCompleteness(contentContext, 'content');
      
      if (!validation.isComplete) {
        const errorDetails = [
          `Missing fields: ${validation.missingFields.join(', ')}`,
          `Warnings: ${validation.warnings.join(', ')}`,
          `Content quality score: ${validation.contentQualityScore}%`
        ];
        
        if (validation.hardcodeViolations.length > 0) {
          errorDetails.push(`Hardcode violations: ${validation.hardcodeViolations.join(', ')}`);
        }
        
        if (validation.dataConsistencyIssues.length > 0) {
          errorDetails.push(`Data consistency issues: ${validation.dataConsistencyIssues.join(', ')}`);
        }
        
        throw new Error(`Content context validation failed: ${errorDetails.join('; ')}`);
      }
      
      // Log validation results
      console.log('✅ Content context validation passed');
      console.log(`📊 Content quality score: ${validation.contentQualityScore}%`);
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Validation warnings:', validation.warnings);
      }

      // Save content context to campaign folder
      await saveContentContext(contentContext, campaignPath);
      
      // Monitor handoff process
      const handoffPerformance = await handoffMonitor.monitorHandoff(
        'content-specialist',
        'design-specialist',
        contentContext,
        params.campaign_id
      );

      // Prepare handoff to Design Specialist
      const handoffData = await prepareContentToDesignHandoff(
        params.request,
        contentContext,
        params.trace_id,
        Date.now() - startTime
      );

      // Validate handoff data
      const handoffValidation = validateHandoffData(handoffData, ContentToDesignHandoffSchema);
      if (!handoffValidation.success) {
        const errors = 'errors' in handoffValidation ? handoffValidation.errors : ['Unknown validation error'];
        throw new HandoffError(
          `Content to Design handoff validation failed: ${errors.join(', ')}`,
          'content-specialist',
          'design-specialist',
          handoffData
        );
      }

      debug.info('ContentFinalization', 'Content context built and validated', {
        campaign_id: params.campaign_id,
        subject: contentContext.generated_content?.subject,
        pricing: `${contentContext.pricing_analysis?.best_price} ${contentContext.pricing_analysis?.currency}`,
        visual_style: contentContext.asset_strategy?.visual_style,
        handoff_performance: handoffPerformance.duration
      });

      // Save handoff data to campaign folder for Design Specialist
      const handoffPath = path.join(campaignPath, 'handoffs', 'content-specialist-to-design-specialist.json');
      await fs.mkdir(path.dirname(handoffPath), { recursive: true });
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2));
      
      debug.info('ContentFinalization', 'Handoff file saved successfully', {
        handoff_path: handoffPath,
        data_size: JSON.stringify(handoffData).length
      });
      
      // Generate final performance summary
      const duration = Date.now() - startTime;
      debug.info('ContentFinalization', 'Content Specialist finalization completed', {
        campaign_id: params.campaign_id,
        total_duration: duration,
        handoff_duration: handoffPerformance.duration,
        content_quality_score: validation.contentQualityScore,
        trace_id: params.trace_id
      });
      
      // Return result for OpenAI SDK handoff
      return {
        status: 'content_finalized_ready_for_design',
        campaign_id: params.campaign_id,
        content_context: contentContext,
        handoff_data: handoffData,
        performance: {
          total_duration: duration,
          handoff_duration: handoffPerformance.duration,
          content_quality_score: validation.contentQualityScore
        },
        summary: {
          subject: contentContext.generated_content?.subject,
          destination: contentContext.context_analysis?.destination,
          price: `${contentContext.pricing_analysis?.best_price} ${contentContext.pricing_analysis?.currency}`,
          visual_style: contentContext.asset_strategy?.visual_style,
          route: `${contentContext.pricing_analysis?.route?.from} → ${contentContext.pricing_analysis?.route?.to}`
        },
        next_specialist: 'design',
        message: `Content work finalized and ready for Design Specialist handoff. Campaign: ${params.campaign_id}. Subject: "${contentContext.generated_content?.subject}". Destination: ${contentContext.context_analysis?.destination}. Price: ${contentContext.pricing_analysis?.best_price} ${contentContext.pricing_analysis?.currency}. Visual style: ${contentContext.asset_strategy?.visual_style}. Quality score: ${validation.contentQualityScore}%. Handoff data prepared for automatic SDK transfer.`
      };

    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      const duration = Date.now() - startTime;
      
      debug.error('ContentFinalization', 'Content finalization failed', {
        error: errorMessage,
        campaign_id: params.campaign_id,
        duration,
        trace_id: params.trace_id
      });
      
      logger.error('ContentSpecialist', 'Finalization failed', {
        error: errorMessage,
        campaign_id: params.campaign_id,
        duration
      });
      
      throw new Error(`Content finalization failed: ${errorMessage}`);
    }
  }
}); 