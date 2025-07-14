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
} from './file-operations-retry';
import {
  FileNotFoundError,
  DataExtractionError,
  HandoffError,
  createError
} from './error-types';

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
  validateContextCompleteness,
  loadDataCollectionContext
} from './context-builders';

// Import handoff monitoring system
import { getHandoffMonitor } from './handoff-monitoring';
import { getGlobalLogger } from './agent-logger';
import { debuggers } from './debug-output';
import { CampaignPathResolver, CampaignPathError } from './campaign-path-resolver';

// Initialize logging and monitoring
const logger = getGlobalLogger();
const debug = debuggers.handoffs;

// ============================================================================
// CAMPAIGN DATA READING FUNCTIONS
// ============================================================================

/**
 * Reads real campaign data from files instead of using hardcoded values
 */
async function readCampaignData(campaignPath: string) {
  const dataDir = path.join(campaignPath, 'data');
  
  try {
    // Read all data files in parallel for performance
    const [
      destinationData,
      marketData, 
      emotionalData,
      consolidatedData
    ] = await Promise.all([
      readJsonFile(path.join(dataDir, 'destination-analysis.json')),
      readJsonFile(path.join(dataDir, 'market-intelligence.json')),
      readJsonFile(path.join(dataDir, 'emotional-profile.json')),
      readJsonFile(path.join(dataDir, 'consolidated-insights.json'))
    ]);

    debug.info('CampaignDataReader', 'Successfully loaded campaign data files', {
      campaignPath,
      filesLoaded: ['destination-analysis', 'market-intelligence', 'emotional-profile', 'consolidated-insights']
    });

    return {
      destination: destinationData?.data || {},
      market: marketData?.data || {},
      emotional: emotionalData?.data || {},
      consolidated: consolidatedData || {}
    };

  } catch (error) {
    debug.error('CampaignDataReader', 'Failed to load campaign data', {
      error: error.message,
      campaignPath
    });
    
    throw new Error(`CAMPAIGN_DATA_READ_ERROR: Failed to load campaign data from ${campaignPath}. Error: ${error.message}. No fallback data allowed.`);
  }
}

/**
 * Helper function to read and parse JSON files safely with retry logic
 */
async function readJsonFile(filePath: string): Promise<any> {
  try {
    await accessFileOrThrow(filePath, undefined, CRITICAL_OPERATION_RETRY_OPTIONS);
    return await readJSONOrThrow(filePath, CRITICAL_OPERATION_RETRY_OPTIONS);
  } catch (error) {
    debug.warn('CampaignDataReader', `Failed to read ${filePath} after retries`, { 
      error: error.message,
      retryContext: (error as any).retryContext
    });
    return null;
  }
}

/**
 * Extracts destination information from campaign data
 */
function extractDestinationInfo(campaignData: any): {
  destination: string;
  season: string;
  country: string;
  city: string;
} {
  if (!campaignData) {
    debug.error('DestinationExtractor', 'No campaign data available');
    throw new Error('DESTINATION_EXTRACTION_ERROR: Campaign data is required for destination extraction. No fallback values allowed.');
  }

  // Extract destination from various sources
  const destData = campaignData.destination;
  const insights = campaignData.consolidated;

  if (!destData || !insights) {
    debug.error('DestinationExtractor', 'Missing required destination or consolidated data');
    throw new Error('DESTINATION_EXTRACTION_ERROR: Campaign data missing destination or consolidated insights. Cannot extract destination information.');
  }

  // Look for Thailand mentions in the data
  const isThailand = 
    destData?.climate_factors?.includes('Тайланд') ||
    destData?.cultural_highlights?.includes('Буддийские') ||
    destData?.key_attractions?.includes('Бангкок') ||
    insights?.key_insights?.some((insight: string) => insight.includes('Тайланд'));

  if (isThailand) {
    debug.info('DestinationExtractor', 'Detected Thailand as destination from campaign data');
    return {
      destination: 'Thailand',
      season: 'autumn', // Based on "осень" in insights
      country: 'Thailand', 
      city: 'Bangkok'
    };
  }

  // Look for Turkey mentions in the data
  const isTurkey = 
    destData?.climate_factors?.includes('Турция') ||
    destData?.cultural_highlights?.includes('турецк') ||
    destData?.key_attractions?.includes('Стамбул') ||
    insights?.key_insights?.some((insight: string) => insight.includes('Турц'));

  if (isTurkey) {
    debug.info('DestinationExtractor', 'Detected Turkey as destination from campaign data');
    return {
      destination: 'Turkey',
      season: destData?.seasonal_advantages?.includes('осень') ? 'autumn' : 'year-round',
      country: 'Turkey',
      city: 'Istanbul'
    };
  }

  // Add more destination detection logic here as needed
  debug.error('DestinationExtractor', 'Could not determine destination from campaign data', {
    availableData: Object.keys(destData || {}),
    hasInsights: !!insights?.key_insights
  });
  throw new Error('DESTINATION_EXTRACTION_ERROR: Unable to determine destination from campaign data. Supported destinations: Thailand, Turkey. Add more destination detection logic if needed.');
}

/**
 * Extracts pricing information from campaign data
 */
function extractPricingInfo(campaignData: any): {
  minPrice: number;
  maxPrice: number;
  currency: string;
  route: { from: string; to: string; from_code: string; to_code: string };
} {
  if (!campaignData) {
    debug.error('PricingExtractor', 'No campaign data available for pricing extraction');
    throw new Error('PRICING_EXTRACTION_ERROR: Campaign data is required for pricing extraction. No fallback values allowed.');
  }

  const marketData = campaignData.market;
  
  if (!marketData) {
    debug.error('PricingExtractor', 'Market data missing from campaign data');
    throw new Error('PRICING_EXTRACTION_ERROR: Market data is missing from campaign. Cannot extract pricing information.');
  }
  
  // Extract price range from pricing_insights
  const pricingText = marketData?.pricing_insights || '';
  const priceMatch = pricingText.match(/(\d+000)\s*(\d+000)/);
  
  if (priceMatch) {
    const minPrice = parseInt(priceMatch[1]);
    const maxPrice = parseInt(priceMatch[2]);
    
    debug.info('PricingExtractor', 'Extracted pricing from campaign data', {
      minPrice,
      maxPrice,
      source: 'pricing_insights'
    });

    return {
      minPrice,
      maxPrice,
      currency: 'RUB',
      route: determineRoute(campaignData)
    };
  }

  // Try alternative pricing extraction methods
  if (marketData?.pricing_data || marketData?.price_range) {
    debug.error('PricingExtractor', 'Alternative pricing data found but extraction not implemented', {
      hasPricingData: !!marketData.pricing_data,
      hasPriceRange: !!marketData.price_range
    });
    throw new Error('PRICING_EXTRACTION_ERROR: Alternative pricing data found but extraction logic not implemented. Update extractPricingInfo function.');
  }

  debug.error('PricingExtractor', 'Could not extract pricing from campaign data', {
    pricingText: pricingText.substring(0, 100),
    marketDataKeys: Object.keys(marketData)
  });
  throw new Error('PRICING_EXTRACTION_ERROR: Unable to extract pricing information from campaign market data. Check pricing_insights format or add alternative extraction logic.');
}

/**
 * Determines route information based on destination
 */
function determineRoute(campaignData: any): { from: string; to: string; from_code: string; to_code: string } {
  const destInfo = extractDestinationInfo(campaignData);
  
  if (destInfo.destination === 'Thailand') {
    return {
      from: 'Moscow',
      to: 'Bangkok',
      from_code: 'SVO',
      to_code: 'BKK'
    };
  }

  if (destInfo.destination === 'Turkey') {
    return {
      from: 'Moscow',
      to: 'Istanbul',
      from_code: 'SVO',
      to_code: 'IST'
    };
  }

  debug.error('RouteMapper', 'Unsupported destination for route mapping', {
    destination: destInfo.destination
  });
  throw new Error(`ROUTE_MAPPING_ERROR: No route mapping available for destination "${destInfo.destination}". Supported destinations: Thailand, Turkey.`);
}

/**
 * Extracts emotional triggers from campaign data
 */
function extractEmotionalTriggers(campaignData: any): string {
  if (!campaignData?.emotional?.emotional_triggers) {
    debug.error('EmotionalExtractor', 'No emotional triggers found in campaign data');
    throw new Error('EMOTIONAL_EXTRACTION_ERROR: Emotional data with triggers is required. No fallback values allowed.');
  }

  const triggers = campaignData.emotional.emotional_triggers;
  
  if (!Array.isArray(triggers) || triggers.length === 0) {
    debug.error('EmotionalExtractor', 'Emotional triggers is not a valid array');
    throw new Error('EMOTIONAL_EXTRACTION_ERROR: Emotional triggers must be a non-empty array.');
  }
  
  // Map text to enum values
  if (triggers.includes('экзотика') || triggers.includes('приключение')) {
    debug.info('EmotionalExtractor', 'Mapped emotional trigger to adventure', { triggers });
    return 'adventure';
  }
  if (triggers.includes('релакс') || triggers.includes('массаж')) {
    debug.info('EmotionalExtractor', 'Mapped emotional trigger to relaxation', { triggers });
    return 'relaxation';
  }
  if (triggers.includes('романтика') || triggers.includes('закаты')) {
    debug.info('EmotionalExtractor', 'Mapped emotional trigger to excitement', { triggers });
    return 'excitement';
  }

  debug.error('EmotionalExtractor', 'Unable to map emotional triggers to known categories', {
    triggers,
    supportedTriggers: ['экзотика', 'приключение', 'релакс', 'массаж', 'романтика', 'закаты']
  });

  throw new Error(`EMOTIONAL_EXTRACTION_ERROR: Unable to map emotional triggers "${triggers.join(', ')}" to supported categories. Supported: adventure (экзотика, приключение), relaxation (релакс, массаж), excitement (романтика, закаты).`);
}

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
  execute: async (params, context) => {
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
    } catch (error) {
      console.error('❌ CONTENT FINALIZATION: Campaign path resolution failed');
      if (error instanceof CampaignPathError) {
        throw new Error(`Campaign path resolution failed: ${error.message}. Orchestrator must provide valid campaign path.`);
      }
      throw new Error(`Unexpected error in campaign path resolution: ${error.message}`);
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

      // Build context using REAL DATA from campaign files
      const transformedContextAnalysis = {
        destination: destinationInfo.destination, // 🎯 REAL destination from campaign data
        seasonal_trends: campaignData.destination?.seasonal_advantages || 'Seasonal travel trends',
        emotional_triggers: emotionalTrigger, // 🎯 REAL emotional triggers from campaign data
        market_positioning: campaignData.market?.competitive_position || 'Travel industry positioning',
        competitive_landscape: campaignData.market?.competitive_position || 'Travel market competition',
        price_sensitivity: campaignData.market?.demand_patterns?.includes('низкий спрос') ? 'High' : 'Medium',
        booking_patterns: campaignData.market?.booking_recommendations || 'Advanced booking recommended'
      };

      const transformedDateAnalysis = {
        destination: destinationInfo.destination, // 🎯 REAL destination 
        season: destinationInfo.season, // 🎯 REAL season from campaign data
        optimal_dates: params.date_analysis?.optimal_dates || [],
        pricing_windows: [],
        booking_recommendation: campaignData.market?.booking_recommendations || 'Book in advance for best rates',
        seasonal_factors: campaignData.destination?.seasonal_advantages || 'Seasonal considerations',
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
      
      // Critical validation failures that block progression
      if (validation.hardcodeViolations.length > 0) {
        debug.error('ContentFinalization', 'CRITICAL: Hardcode violations detected in context', {
          violations: validation.hardcodeViolations,
          campaign_id: params.campaign_id
        });
        
        console.error('🚨 HARDCODE VIOLATIONS DETECTED:');
        validation.hardcodeViolations.forEach(violation => console.error(`  ❌ ${violation}`));
        
        return `CRITICAL: Content context contains hardcoded values and will be REJECTED. Violations: ${validation.hardcodeViolations.join('; ')}. Use real campaign data only.`;
      }
      
      if (validation.dataConsistencyIssues.length > 0) {
        debug.error('ContentFinalization', 'CRITICAL: Data consistency issues detected', {
          issues: validation.dataConsistencyIssues,
          campaign_id: params.campaign_id
        });
        
        console.error('🚨 DATA CONSISTENCY ISSUES:');
        validation.dataConsistencyIssues.forEach(issue => console.error(`  ❌ ${issue}`));
        
        return `CRITICAL: Content context has data consistency issues: ${validation.dataConsistencyIssues.join('; ')}. Fix data alignment before proceeding.`;
      }

      if (!validation.isComplete) {
        debug.warn('ContentFinalization', 'Content context incomplete', {
          missingFields: validation.missingFields,
          warnings: validation.warnings,
          qualityScore: validation.contentQualityScore
        });
        
        console.warn('⚠️ Content context incomplete:', validation.missingFields);
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Additional warnings:', validation.warnings);
        }
        
        return `Content context incomplete. Missing: ${validation.missingFields.join(', ')}`;
      }
      
      // Quality warnings (non-blocking but important)
      if (validation.contentQualityScore < 70) {
        console.warn(`⚠️ Content quality score: ${validation.contentQualityScore}/100 - Below recommended threshold`);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Content quality warnings:');
        validation.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
      }

      debug.info('ContentFinalization', 'Enhanced content validation passed', {
        noHardcodes: validation.hardcodeViolations.length === 0,
        noConsistencyIssues: validation.dataConsistencyIssues.length === 0,
        isComplete: validation.isComplete,
        qualityScore: validation.contentQualityScore,
        warningCount: validation.warnings.length,
        dataCollectionQuality: dataCollectionContext.collection_metadata.data_quality_score,
        campaign_id: params.campaign_id
      });

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

      return `✅ Content work finalized! Campaign: ${params.campaign_id}. Subject: "${contentContext.generated_content.subject}". Price: ${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}. Visual style: ${contentContext.asset_strategy.visual_style}. Data collection: ${dataCollectionContext.collection_metadata.collection_status} (${dataCollectionContext.collection_metadata.data_quality_score}% quality). Ready for Design Specialist transfer via OpenAI SDK handoff system.`;

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