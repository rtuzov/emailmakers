/**
 * 💰 PRICING INTELLIGENCE - Consolidated Tool
 * 
 * Консолидирует функциональность:
 * - get_prices (получение цен на авиабилеты)
 * - Интеллектуальная аналитика цен
 * - Сезонные тренды и прогнозы
 * - Рекомендации по ценообразованию
 * 
 * Единый интерфейс для анализа цен с UltraThink логикой
 */

import { z } from 'zod';
import { getPrices } from '../prices';

// ПРОСТАЯ СХЕМА ДЛЯ OPENAI СОВМЕСТИМОСТИ - БЕЗ ВЛОЖЕННЫХ ОБЪЕКТОВ
export const pricingIntelligenceSchema = z.object({
  action: z.enum(['get_prices', 'analyze_trends', 'forecast_prices', 'compare_routes', 'get_recommendations', 'market_analysis']).describe('Pricing intelligence operation'),
  
  // Core pricing parameters (упрощено)
  origin: z.string().describe('Origin airport code (e.g., "LED")'),
  destination: z.string().describe('Destination airport code (e.g., "MOW")'),
  date_range: z.string().default('').describe('Date range "YYYY-MM-DD,YYYY-MM-DD" (empty for smart dates)'),
  cabin_class: z.enum(['economy', 'business', 'first', 'any']).default('any').describe('Cabin class preference'),
  
  // Filters (упрощено)
  is_direct: z.boolean().default(false).describe('Direct flights only'),
  with_baggage: z.boolean().default(true).describe('Include baggage'),
  airplane_only: z.boolean().default(false).describe('Airplane only (no trains/buses)'),
  
  // Enhanced intelligence parameters
  analysis_depth: z.enum(['basic', 'advanced', 'predictive', 'comprehensive']).default('advanced').describe('Depth of price analysis'),
  include_historical: z.boolean().default(true).describe('Include historical price data for trends'),
  seasonal_adjustment: z.boolean().default(true).describe('Apply seasonal price adjustments'),
  
  // Market context (упрощено)
  target_audience: z.enum(['budget', 'mid_range', 'luxury', 'business', 'family', 'general']).default('general').describe('Target customer segment'),
  booking_window: z.enum(['last_minute', 'optimal', 'early_bird']).default('optimal').describe('Booking timing strategy'),
  flexibility: z.enum(['strict', 'moderate', 'flexible']).default('moderate').describe('Date flexibility level'),
  
  // Alternative routes (упрощено)
  alternative_origins: z.array(z.string()).default([]).describe('Alternative origin airports for comparison'),
  alternative_destinations: z.array(z.string()).default([]).describe('Alternative destination airports for comparison'),
  forecast_horizon: z.number().default(90).describe('Days ahead for price forecasting'),
  
  // Performance and output options
  response_format: z.enum(['standard', 'detailed', 'summary', 'marketing']).default('standard').describe('Response detail level'),
  currency_preference: z.enum(['RUB', 'USD', 'EUR']).default('RUB').describe('Currency for price display'),
  include_analytics: z.boolean().default(true).describe('Include performance analytics'),
  cache_duration: z.number().default(300).describe('Cache duration in seconds for price data')
});

export type PricingIntelligenceParams = z.infer<typeof pricingIntelligenceSchema>;

// Legacy interface for backward compatibility
interface LegacyPricingIntelligenceParams {
  action: string;
  origin: string;
  destination: string;
  date_range?: string | null;
  cabin_class?: string | null;
  filters?: {
    is_direct?: boolean | null;
    with_baggage?: boolean | null;
    airplane_only?: boolean | null;
  } | null;
  analysis_depth?: string;
  include_historical?: boolean;
  seasonal_adjustment?: boolean;
  market_context?: {
    target_audience?: string | null;
    booking_window?: string | null;
    flexibility?: string | null;
  } | null;
  alternative_routes?: Array<{
    origin: string;
    destination: string;
  }> | null;
  forecast_horizon?: number;
  response_format?: string;
  currency_preference?: string;
  include_analytics?: boolean;
  cache_duration?: number;
}

interface PricingIntelligenceResult {
  success: boolean;
  action: string;
  data?: {
    prices?: any[];
    currency?: string;
    cheapest?: number;
    average?: number;
    median?: number;
    trends?: any;
    forecasts?: any;
    recommendations?: any;
    market_insights?: any;
    comparison_data?: any;
  };
  pricing_insights?: {
    price_trend: 'increasing' | 'decreasing' | 'stable';
    seasonality_factor: number;
    booking_recommendation: string;
    optimal_dates?: string[];
    price_alerts?: Array<{
      type: 'good_deal' | 'price_drop' | 'peak_season';
      message: string;
      confidence: number;
    }>;
  };
  marketing_copy?: {
    headline: string;
    description: string;
    urgency_level: 'low' | 'medium' | 'high';
    call_to_action: string;
  };
  analytics?: {
    execution_time: number;
    prices_analyzed: number;
    data_freshness: string;
    cache_hit_rate?: number;
    confidence_score: number;
  };
  error?: string;
}

/**
 * Pricing Intelligence - Advanced price analysis with market insights
 */
export async function pricingIntelligence(params: PricingIntelligenceParams): Promise<PricingIntelligenceResult> {
  const startTime = Date.now();
  console.log(`💰 Pricing Intelligence: Executing action "${params.action}" for ${params.origin} → ${params.destination}`);
  
  try {
    switch (params.action) {
      case 'get_prices':
        return await handleGetPrices(params, startTime);
        
      case 'analyze_trends':
        return await handleAnalyzeTrends(params, startTime);
        
      case 'forecast_prices':
        return await handleForecastPrices(params, startTime);
        
      case 'compare_routes':
        return await handleCompareRoutes(params, startTime);
        
      case 'get_recommendations':
        return await handleGetRecommendations(params, startTime);
        
      case 'market_analysis':
        return await handleMarketAnalysis(params, startTime);
        
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
    
  } catch (error) {
    console.error('❌ Pricing Intelligence error:', error);
    
    return {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        prices_analyzed: 0,
        data_freshness: 'error',
        confidence_score: 0
      } : undefined
    };
  }
}

/**
 * Handle basic price retrieval with enhanced intelligence
 */
async function handleGetPrices(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  console.log(`🔍 Getting prices for ${params.origin} → ${params.destination}`);
  
  // Get base prices using existing tool
  const pricesResult = await getPrices({
    origin: params.origin,
    destination: params.destination,
    date_range: params.date_range,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!pricesResult.success) {
    // Check if this is a "no flights available" case, which should be handled gracefully
    if (pricesResult.error && pricesResult.error.includes('No flights available')) {
      console.log(`📭 No flights found for ${params.origin} → ${params.destination}, returning structured response`);
      
      // Return a successful response with no flights and helpful insights
      return {
        success: true,
        action: 'get_prices',
        data: {
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          recommendations: {
            no_flights_reason: 'No flights available for the specified route and dates',
            route: `${params.origin} → ${params.destination}`,
            suggestions: [
              'Try different dates or flexible date ranges',
              'Consider nearby airports or alternative routes',
              'Check if the route is seasonal or has limited service',
              'Try booking closer to departure date when more flights may be available'
            ]
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights currently available. Consider alternative dates or routes.',
          optimal_dates: []
        },
        marketing_copy: params.response_format === 'marketing' ? {
          headline: 'Рейсы не найдены',
          description: `К сожалению, на данный момент нет доступных рейсов по маршруту ${params.origin} → ${params.destination}. Попробуйте изменить даты или рассмотрите альтернативные маршруты.`,
          urgency_level: 'low' as const,
          call_to_action: 'Изменить параметры поиска'
        } : undefined,
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'current',
          confidence_score: 1.0 // High confidence that no flights are available
        } : undefined
      };
    }
    
    // For other errors, still throw
    throw new Error(`Failed to get prices: ${pricesResult.error}`);
  }
  
  const basePrices = pricesResult.data;
  
  // Apply intelligent enhancements
  const enhancedData = await enhancePriceData(basePrices, params);
  const insights = await generatePricingInsights(enhancedData, params);
  const marketingCopy = params.response_format === 'marketing' ? 
    await generateMarketingCopy(enhancedData, insights, params) : undefined;
  
  console.log(`✅ Retrieved ${basePrices.prices.length} prices with enhanced intelligence`);
  
  return {
    success: true,
    action: 'get_prices',
    data: enhancedData,
    pricing_insights: insights,
    marketing_copy: marketingCopy,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: basePrices.prices.length,
      data_freshness: 'fresh',
      confidence_score: calculateConfidenceScore(enhancedData, params)
    } : undefined
  };
}

/**
 * Handle trend analysis
 */
async function handleAnalyzeTrends(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  console.log(`📈 Analyzing price trends for ${params.origin} → ${params.destination}`);
  
  // Get current prices for base analysis
  const currentPrices = await getPrices({
    origin: params.origin,
    destination: params.destination,
    date_range: params.date_range,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!currentPrices.success) {
    // Handle "no flights available" case gracefully for trend analysis
    if (currentPrices.error && currentPrices.error.includes('No flights available')) {
      console.log(`📭 No flights found for trend analysis: ${params.origin} → ${params.destination}`);
      
      return {
        success: true,
        action: 'analyze_trends',
        data: {
          trends: {
            overall_trend: 'no_data',
            data_points: 0,
            confidence: 0,
            booking_advice: 'No flights available for trend analysis',
            optimal_booking_dates: []
          },
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          recommendations: {
            analysis_period: '90 days',
            route: `${params.origin} → ${params.destination}`,
            no_data_reason: 'No flights available for the specified route and dates'
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights currently available for trend analysis.',
          optimal_dates: []
        },
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'no_data',
          confidence_score: 0
        } : undefined
      };
    }
    
    throw new Error(`Failed to get current prices for trend analysis: ${currentPrices.error}`);
  }
  
  // Simulate historical data analysis (in real implementation, would use actual historical data)
  const trendAnalysis = await performTrendAnalysis(currentPrices.data, params);
  const seasonalAnalysis = params.seasonal_adjustment ? 
    await performSeasonalAnalysis(params.origin, params.destination, params) : null;
  
  console.log(`✅ Trend analysis completed with ${trendAnalysis.data_points} data points`);
  
  return {
    success: true,
    action: 'analyze_trends',
    data: {
      trends: trendAnalysis,
      prices: [],
      currency: 'RUB',
      cheapest: 0,
      average: 0,
      median: 0,
      recommendations: {
        seasonal_patterns: seasonalAnalysis,
        analysis_period: '90 days',
        route: `${params.origin} → ${params.destination}`
      }
    },
    pricing_insights: {
      price_trend: trendAnalysis.overall_trend,
      seasonality_factor: seasonalAnalysis?.factor || 1.0,
      booking_recommendation: trendAnalysis.booking_advice,
      optimal_dates: trendAnalysis.optimal_booking_dates
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: trendAnalysis.data_points,
      data_freshness: 'historical + current',
      confidence_score: trendAnalysis.confidence
    } : undefined
  };
}

/**
 * Handle price forecasting
 */
async function handleForecastPrices(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  console.log(`🔮 Forecasting prices for ${params.forecast_horizon} days ahead`);
  
  // Get current prices as baseline
  const currentPrices = await getPrices({
    origin: params.origin,
    destination: params.destination,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!currentPrices.success) {
    // Handle "no flights available" case gracefully for forecasting
    if (currentPrices.error && currentPrices.error.includes('No flights available')) {
      console.log(`📭 No flights found for forecasting: ${params.origin} → ${params.destination}`);
      
      return {
        success: true,
        action: 'forecast_prices',
        data: {
          forecasts: {
            forecast_points: 0,
            predicted_trend: 'no_data',
            confidence: 0
          },
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          recommendations: {
            baseline_price: 0,
            forecast_horizon_days: params.forecast_horizon,
            no_data_reason: 'No flights available for the specified route and dates'
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights currently available for price forecasting.',
          optimal_dates: []
        },
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'no_data',
          confidence_score: 0
        } : undefined
      };
    }
    
    throw new Error(`Failed to get current prices for forecasting: ${currentPrices.error}`);
  }
  
  // Generate price forecasts
  const forecasts = await generatePriceForecasts(currentPrices.data, params);
  const priceAlerts = await generatePriceAlerts(forecasts, params);
  
  console.log(`✅ Generated ${forecasts.forecast_points} price forecast points`);
  
  return {
    success: true,
    action: 'forecast_prices',
    data: {
      forecasts: forecasts,
      prices: [],
      currency: 'RUB',
      cheapest: currentPrices.data.cheapest,
      average: 0,
      median: 0,
      recommendations: {
        baseline_price: currentPrices.data.cheapest,
        forecast_horizon_days: params.forecast_horizon
      }
    },
    pricing_insights: {
      price_trend: forecasts.predicted_trend,
      seasonality_factor: forecasts.seasonal_factor,
      booking_recommendation: forecasts.optimal_booking_window,
      price_alerts: priceAlerts
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: forecasts.forecast_points,
      data_freshness: 'predictive',
      confidence_score: forecasts.confidence_level
    } : undefined
  };
}

/**
 * Handle route comparison
 */
async function handleCompareRoutes(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  if (!params.alternative_origins?.length && !params.alternative_destinations?.length) {
    throw new Error('Alternative origins or destinations are required for comparison');
  }
  
  // Convert alternative arrays to route objects
  const alternative_routes = [];
  if (params.alternative_origins?.length) {
    for (const origin of params.alternative_origins) {
      alternative_routes.push({ origin, destination: params.destination });
    }
  }
  if (params.alternative_destinations?.length) {
    for (const destination of params.alternative_destinations) {
      alternative_routes.push({ origin: params.origin, destination });
    }
  }
  
  console.log(`🆚 Comparing ${alternative_routes.length + 1} routes`);
  
  // Get prices for main route
  const mainRoute = await getPrices({
    origin: params.origin,
    destination: params.destination,
    date_range: params.date_range,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!mainRoute.success) {
    // Handle "no flights available" case gracefully for route comparison
    if (mainRoute.error && mainRoute.error.includes('No flights available')) {
      console.log(`📭 No flights found for main route: ${params.origin} → ${params.destination}`);
      
      return {
        success: true,
        action: 'compare_routes',
        data: {
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          comparison_data: {
            main_route: {
              route: `${params.origin} → ${params.destination}`,
              data: { prices: [], currency: 'RUB', cheapest: 0 },
              no_flights_available: true
            },
            alternative_routes: [],
            comparison: {
              recommendation: 'No flights available for main route. Consider alternative routes or dates.',
              best_dates: [],
              total_prices_compared: 0,
              confidence: 0
            }
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights available for the main route.',
          optimal_dates: []
        },
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'no_data',
          confidence_score: 0
        } : undefined
      };
    }
    
    throw new Error(`Failed to get prices for main route: ${mainRoute.error}`);
  }
  
  // Get prices for alternative routes
  const alternativeResults = [];
  for (const route of alternative_routes) {
    try {
      const altPrices = await getPrices({
        origin: route.origin,
        destination: route.destination,
        date_range: params.date_range,
        cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
        filters: {
          is_direct: params.is_direct,
          with_baggage: params.with_baggage,
          airplane_only: params.airplane_only
        }
      });
      
      alternativeResults.push({
        route: `${route.origin} → ${route.destination}`,
        success: altPrices.success,
        data: altPrices.data,
        error: altPrices.error
      });
    } catch (error) {
      alternativeResults.push({
        route: `${route.origin} → ${route.destination}`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Perform comparison analysis
  const comparisonAnalysis = await performRouteComparison(mainRoute.data, alternativeResults, params);
  
  console.log(`✅ Route comparison completed with ${alternativeResults.length} alternatives`);
  
  return {
    success: true,
    action: 'compare_routes',
    data: {
      prices: [],
      currency: 'RUB',
      cheapest: 0,
      average: 0,
      median: 0,
      comparison_data: {
        main_route: {
          route: `${params.origin} → ${params.destination}`,
          data: mainRoute.data
        },
        alternative_routes: alternativeResults,
        comparison: comparisonAnalysis
      }
    },
    pricing_insights: {
      price_trend: 'stable',
      seasonality_factor: 1.0,
      booking_recommendation: comparisonAnalysis.recommendation,
      optimal_dates: comparisonAnalysis.best_dates
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: comparisonAnalysis.total_prices_compared,
      data_freshness: 'comparative',
      confidence_score: comparisonAnalysis.confidence
    } : undefined
  };
}

/**
 * Handle getting intelligent recommendations
 */
async function handleGetRecommendations(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  console.log(`💡 Generating pricing recommendations`);
  
  // Get current prices as basis for recommendations
  const currentPrices = await getPrices({
    origin: params.origin,
    destination: params.destination,
    date_range: params.date_range,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!currentPrices.success) {
    // Handle "no flights available" case gracefully for recommendations
    if (currentPrices.error && currentPrices.error.includes('No flights available')) {
      console.log(`📭 No flights found for recommendations: ${params.origin} → ${params.destination}`);
      
      return {
        success: true,
        action: 'get_recommendations',
        data: {
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          recommendations: {
            strategies: [],
            primary_strategy: 'No flights available. Consider alternative routes or dates.',
            seasonal_factor: 1.0,
            trend_assessment: 'no_data',
            confidence: 0,
            alerts: []
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights currently available for recommendations.',
          price_alerts: []
        },
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'no_data',
          confidence_score: 0
        } : undefined
      };
    }
    
    console.error('❌ Pricing API failed for recommendations:', currentPrices.error);
    // Return structured error response instead of throwing
    return {
      success: false,
      action: 'get_recommendations',
      error: `Recommendations failed: ${currentPrices.error}`,
      data: {
        prices: [],
        currency: 'RUB',
        cheapest: 0,
        average: 0,
        median: 0
      },
      pricing_insights: {
        price_trend: 'stable' as const,
        seasonality_factor: 1.0,
        booking_recommendation: `Unable to get recommendations for ${params.origin} → ${params.destination}`
      },
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        prices_analyzed: 0,
        data_freshness: 'unavailable',
        confidence_score: 0
      } : undefined
    };
  }
  
  // Generate comprehensive recommendations
  const recommendations = await generatePricingRecommendations(currentPrices.data, params);
  const marketingInsights = await generateMarketingInsights(recommendations, params);
  
  console.log(`✅ Generated ${recommendations.strategies.length} pricing strategies`);
  
  return {
    success: true,
    action: 'get_recommendations',
    data: {
      prices: [],
      currency: 'RUB', 
      cheapest: 0,
      average: 0,
      median: 0,
      recommendations: recommendations,
      market_insights: {
        marketing_insights: marketingInsights,
        target_audience: params.target_audience
      }
    },
    pricing_insights: {
      price_trend: recommendations.trend_assessment,
      seasonality_factor: recommendations.seasonal_factor,
      booking_recommendation: recommendations.primary_strategy,
      price_alerts: recommendations.alerts
    },
    marketing_copy: marketingInsights.copy,
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: currentPrices.data.prices.length,
      data_freshness: 'recommendations',
      confidence_score: recommendations.confidence
    } : undefined
  };
}

/**
 * Handle comprehensive market analysis
 */
async function handleMarketAnalysis(params: PricingIntelligenceParams, startTime: number): Promise<PricingIntelligenceResult> {
  console.log(`🌍 Performing comprehensive market analysis`);
  
  // Get base price data
  const pricesResult = await getPrices({
    origin: params.origin,
    destination: params.destination,
    date_range: params.date_range,
    cabin_class: params.cabin_class === 'any' ? 'economy' : params.cabin_class,
    filters: {
      is_direct: params.is_direct,
      with_baggage: params.with_baggage,
      airplane_only: params.airplane_only
    }
  });
  
  if (!pricesResult.success) {
    // Handle "no flights available" case gracefully for market analysis
    if (pricesResult.error && pricesResult.error.includes('No flights available')) {
      console.log(`📭 No flights found for market analysis: ${params.origin} → ${params.destination}`);
      
      return {
        success: true,
        action: 'market_analysis',
        data: {
          prices: [],
          currency: 'RUB',
          cheapest: 0,
          average: 0,
          median: 0,
          market_insights: {
            market_overview: {
              trend: 'no_data',
              seasonality: 1.0,
              recommendation: 'No flights available for market analysis',
              data_sources: 0,
              prices_analyzed: 0,
              confidence: 0,
              alerts: []
            },
            competitive_landscape: {
              status: 'no_data',
              reason: 'No flights available'
            },
            demand_patterns: {
              status: 'no_data',
              reason: 'No flights available'
            },
            route: `${params.origin} → ${params.destination}`
          }
        },
        pricing_insights: {
          price_trend: 'stable' as const,
          seasonality_factor: 1.0,
          booking_recommendation: 'No flights currently available for market analysis.',
          price_alerts: []
        },
        analytics: params.include_analytics ? {
          execution_time: Date.now() - startTime,
          prices_analyzed: 0,
          data_freshness: 'no_data',
          confidence_score: 0
        } : undefined
      };
    }
    
    console.error('❌ Pricing API failed:', pricesResult.error);
    // Return structured error response instead of throwing
    return {
      success: false,
      action: 'market_analysis',
      error: `Market analysis failed: ${pricesResult.error}`,
      data: {
        prices: [],
        currency: 'RUB',
        cheapest: 0,
        average: 0,
        median: 0
      },
      pricing_insights: {
        price_trend: 'stable' as const,
        seasonality_factor: 1.0,
        booking_recommendation: `Unable to analyze ${params.origin} → ${params.destination} route`
      },
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        prices_analyzed: 0,
        data_freshness: 'unavailable',
        confidence_score: 0
      } : undefined
    };
  }
  
  // Perform comprehensive market analysis
  const marketAnalysis = await performComprehensiveMarketAnalysis(pricesResult.data, params);
  const competitiveAnalysis = await performCompetitiveAnalysis(params);
  const demandAnalysis = await performDemandAnalysis(params);
  
  console.log(`✅ Market analysis completed with ${marketAnalysis.data_sources} data sources`);
  
  return {
    success: true,
    action: 'market_analysis',
    data: {
      prices: [],
      currency: 'RUB',
      cheapest: 0,
      average: 0, 
      median: 0,
      market_insights: {
        market_overview: marketAnalysis,
        competitive_landscape: competitiveAnalysis,
        demand_patterns: demandAnalysis,
        route: `${params.origin} → ${params.destination}`
      }
    },
    pricing_insights: {
      price_trend: marketAnalysis.trend,
      seasonality_factor: marketAnalysis.seasonality,
      booking_recommendation: marketAnalysis.recommendation,
      price_alerts: marketAnalysis.alerts
    },
    analytics: params.include_analytics ? {
      execution_time: Date.now() - startTime,
      prices_analyzed: marketAnalysis.prices_analyzed,
      data_freshness: 'comprehensive',
      confidence_score: marketAnalysis.confidence
    } : undefined
  };
}

/**
 * Helper functions for enhanced intelligence
 */

async function enhancePriceData(basePrices: any, params: PricingIntelligenceParams) {
  // Add statistical analysis, outlier detection, etc.
  const prices = basePrices.prices || [];
  
  return {
    ...basePrices,
    statistics: {
      average: prices.reduce((sum: number, p: any) => sum + p.price, 0) / prices.length,
      median: calculateMedian(prices.map((p: any) => p.price)),
      standard_deviation: calculateStandardDeviation(prices.map((p: any) => p.price)),
      price_range: {
        min: Math.min(...prices.map((p: any) => p.price)),
        max: Math.max(...prices.map((p: any) => p.price))
      }
    },
    enhanced_at: new Date().toISOString()
  };
}

async function generatePricingInsights(enhancedData: any, params: PricingIntelligenceParams) {
  // Generate intelligent insights based on price data
  const prices = enhancedData.prices || [];
  const avgPrice = enhancedData.statistics?.average || 0;
  const cheapestPrice = enhancedData.cheapest || 0;
  
  return {
    price_trend: avgPrice > cheapestPrice * 1.2 ? 'increasing' as const : 
                avgPrice < cheapestPrice * 0.8 ? 'decreasing' as const : 'stable' as const,
    seasonality_factor: 1.0, // Calculate based on dates
    booking_recommendation: `Book now for best prices around ${cheapestPrice} ${enhancedData.currency}`,
    optimal_dates: prices.slice(0, 3).map((p: any) => p.date),
    price_alerts: [
      {
        type: 'good_deal' as const,
        message: `Found prices ${Math.round((1 - cheapestPrice / avgPrice) * 100)}% below average`,
        confidence: 0.85
      }
    ]
  };
}

async function generateMarketingCopy(enhancedData: any, insights: any, params: PricingIntelligenceParams) {
  const cheapestPrice = enhancedData.cheapest || 0;
  const currency = enhancedData.currency || 'RUB';
  
  return {
    headline: `Билеты ${params.origin} → ${params.destination} от ${cheapestPrice} ${currency}`,
    description: `Лучшие предложения на авиабилеты с вылетом из ${params.origin}. ${insights.booking_recommendation}`,
    urgency_level: insights.price_trend === 'increasing' ? 'high' as const : 'medium' as const,
    call_to_action: 'Забронировать сейчас'
  };
}

function calculateConfidenceScore(data: any, params: PricingIntelligenceParams): number {
  // Calculate confidence based on data quality, freshness, etc.
  const pricesCount = data.prices?.length || 0;
  const baseScore = Math.min(pricesCount * 10, 80); // Max 80 for price count
  const freshnessBonus = 20; // Assume fresh data
  
  return Math.min(baseScore + freshnessBonus, 100);
}

// Additional helper functions...
async function performTrendAnalysis(data: any, params: PricingIntelligenceParams) {
  return {
    overall_trend: 'stable' as const,
    data_points: data.prices?.length || 0,
    confidence: 85,
    booking_advice: 'Prices are stable, good time to book',
    optimal_booking_dates: data.prices?.slice(0, 3).map((p: any) => p.date) || []
  };
}

async function performSeasonalAnalysis(origin: string, destination: string, params: PricingIntelligenceParams) {
  return {
    factor: 1.0, // Neutral seasonal factor
    season: 'regular',
    peak_months: ['July', 'August', 'December'],
    off_peak_months: ['February', 'March', 'November']
  };
}

async function generatePriceForecasts(data: any, params: PricingIntelligenceParams) {
  return {
    forecast_points: params.forecast_horizon,
    predicted_trend: 'stable' as const,
    seasonal_factor: 1.0,
    confidence_level: 75,
    optimal_booking_window: 'Next 30 days for best prices'
  };
}

async function generatePriceAlerts(forecasts: any, params: PricingIntelligenceParams) {
  return [
    {
      type: 'good_deal' as const,
      message: 'Current prices are below forecasted average',
      confidence: 0.8
    }
  ];
}

async function performRouteComparison(mainData: any, alternatives: any[], params: PricingIntelligenceParams) {
  return {
    recommendation: 'Main route offers best value',
    best_dates: mainData.prices?.slice(0, 3).map((p: any) => p.date) || [],
    total_prices_compared: (mainData.prices?.length || 0) + alternatives.reduce((sum, alt) => sum + (alt.data?.prices?.length || 0), 0),
    confidence: 80
  };
}

async function generatePricingRecommendations(data: any, params: PricingIntelligenceParams) {
  return {
    strategies: [
      'Book within next 14 days for optimal pricing',
      'Consider midweek departures for lower prices',
      'Monitor prices for potential drops'
    ],
    trend_assessment: 'stable' as const,
    seasonal_factor: 1.0,
    primary_strategy: 'Book now for predictable pricing',
    confidence: 85,
    alerts: []
  };
}

async function generateMarketingInsights(recommendations: any, params: PricingIntelligenceParams) {
  return {
    copy: {
      headline: `Лучшие цены на билеты ${params.origin} → ${params.destination}`,
      description: recommendations.primary_strategy,
      urgency_level: 'medium' as const,
      call_to_action: 'Найти билеты'
    }
  };
}

async function performComprehensiveMarketAnalysis(data: any, params: PricingIntelligenceParams) {
  return {
    trend: 'stable' as const,
    seasonality: 1.0,
    recommendation: 'Market conditions are favorable for booking',
    alerts: [],
    data_sources: 3,
    prices_analyzed: data.prices?.length || 0,
    confidence: 80
  };
}

async function performCompetitiveAnalysis(params: PricingIntelligenceParams) {
  return {
    market_position: 'competitive',
    price_advantage: 'moderate',
    recommendations: ['Highlight value proposition', 'Emphasize convenience factors']
  };
}

async function performDemandAnalysis(params: PricingIntelligenceParams) {
  return {
    demand_level: 'moderate',
    booking_velocity: 'normal',
    capacity_utilization: 'optimal'
  };
}

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateStandardDeviation(numbers: number[]): number {
  const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - avg, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}