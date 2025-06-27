#!/usr/bin/env tsx

/**
 * UltraThink Example Usage
 * Demonstrates Phase 1 intelligent logic enhancement capabilities
 */

import { 
  createUltraThink, 
  UltraThinkUtils, 
  RouteValidator, 
  DateValidator,
  SimpleDataProvider 
} from './index';
import { EmailGenerationRequest } from '../types';

async function demonstrateUltraThink() {
  console.log('🧠 UltraThink Phase 1 Demonstration\n');

  // Example 1: Route Intelligence
  console.log('📍 Route Intelligence:');
  
  // Invalid route correction
  const invalidRoute = UltraThinkUtils.validateRoute('LED', 'LED');
  console.log('Invalid route LED→LED:', {
    valid: invalidRoute.valid,
    corrected: invalidRoute.correctedDestination,
    suggestion: invalidRoute.suggestion
  });

  // Popular route analysis
  const popularRoute = UltraThinkUtils.validateRoute('MOW', 'LED');
  console.log('Popular route MOW→LED:', {
    popularity: popularRoute.popularity,
    timezoneDiff: popularRoute.timezoneDiff
  });

  console.log();

  // Example 2: Date Intelligence
  console.log('📅 Date Intelligence:');

  // Summer travel context
  const summerDate = new Date('2025-07-15');
  const seasonal = UltraThinkUtils.getSeasonalContext(summerDate);
  console.log('Summer context:', {
    season: seasonal.season,
    priceFactor: seasonal.priceFactor,
    description: seasonal.description
  });

  // Holiday check
  const isNewYear = UltraThinkUtils.isHoliday('2025-01-01', 'RU');
  console.log('New Year holiday:', isNewYear);

  // Price multiplier with factors
  const priceContext = UltraThinkUtils.getPriceMultiplier(
    new Date('2025-07-15'), // Summer weekend
    'MOW', 
    'AER', 
    'RU'
  );
  console.log('Price multiplier for summer weekend:', {
    multiplier: priceContext.multiplier.toFixed(2),
    factors: priceContext.factors
  });

  console.log();

  // Example 3: Request Enhancement
  console.log('🚀 Request Enhancement:');

  const ultraThink = createUltraThink('quality');
  
  const sampleRequest: EmailGenerationRequest = {
    topic: 'Летний отпуск в Сочи',
    origin: 'LED', // Will be kept as-is (valid)
    destination: 'LED', // Will be corrected to valid destination
    departure_date: '2025-07-15',
    date_range: '2025-07-15,2025-07-22',
    campaign_type: 'seasonal',
    target_audience: 'семьи с детьми'
  };

  console.log('Original request:', sampleRequest);

  const enhancement = await ultraThink.enhanceRequest(sampleRequest);
  
  console.log('\nValidation result:', {
    valid: enhancement.validationResult.valid,
    issuesCount: enhancement.validationResult.issues.length,
    suggestionsCount: enhancement.validationResult.suggestions.length
  });

  console.log('\nCorrected request:', enhancement.validatedRequest);

  console.log('\nContext enrichment:', {
    season: enhancement.enrichedContext.seasonal.season,
    routePopularity: enhancement.enrichedContext.routePopularity,
    holidays: enhancement.enrichedContext.holidays,
    suggestionsCount: enhancement.enrichedContext.suggestions.length,
    warningsCount: enhancement.enrichedContext.warnings.length
  });

  console.log('\nKey suggestions:');
  enhancement.enrichedContext.suggestions.slice(0, 3).forEach((suggestion, i) => {
    console.log(`  ${i + 1}. ${suggestion}`);
  });

  if (enhancement.enrichedContext.warnings.length > 0) {
    console.log('\nWarnings:');
    enhancement.enrichedContext.warnings.forEach((warning, i) => {
      console.log(`  ⚠️  ${warning}`);
    });
  }

  console.log('\nExecution sequence:', {
    strategy: enhancement.optimizedSequence.strategy,
    totalSteps: enhancement.optimizedSequence.steps.length,
    estimatedDuration: `${enhancement.optimizedSequence.estimatedDuration}s`
  });

  console.log();

  // Example 4: City Database Exploration
  console.log('🏙️ City Database:');
  
  const cities = RouteValidator.getAllCities();
  const russianCities = Object.entries(cities)
    .filter(([code, info]) => info.country === 'RU')
    .slice(0, 5);
    
  console.log('Sample Russian cities:');
  russianCities.forEach(([code, info]) => {
    console.log(`  ${code}: ${info.name} (${info.popular ? 'popular' : 'regional'})`);
  });

  console.log();

  // Example 5: Error Analytics
  console.log('📊 Error Analytics:');

  // Simulate some executions
  ultraThink.recordSuccess('get_prices', 1500);
  ultraThink.recordSuccess('get_figma_assets', 2200);
  ultraThink.recordSuccess('generate_copy', 3500);

  const analytics = ultraThink.getExecutionAnalytics();
  console.log('Execution analytics:', {
    totalSteps: analytics.totalSteps,
    successRate: `${((analytics.successfulSteps / analytics.totalSteps) * 100).toFixed(1)}%`,
    avgDuration: `${analytics.averageStepDuration.toFixed(0)}ms`,
    errorRate: `${(analytics.errorRate * 100).toFixed(1)}%`
  });

  console.log();

  // Example 6: Practical Use Cases
  console.log('💡 Practical Use Cases:');

  // Case 1: Booking recommendations
  const travelDate = new Date('2025-08-15');
  const bookingRec = SimpleDataProvider.getBookingRecommendations(travelDate);
  console.log('Booking recommendation for August travel:', {
    recommendation: bookingRec.recommendation,
    urgency: bookingRec.urgency,
    reason: bookingRec.reason
  });

  // Case 2: Destination tips
  const tips = SimpleDataProvider.getDestinationTips('TH');
  console.log('Thailand travel tips:', tips.slice(0, 2));

  // Case 3: Alternative destinations
  const alternatives = RouteValidator.getPopularDestinations('MOW', 3);
  console.log('Popular destinations from Moscow:', alternatives);

  console.log('\n✅ UltraThink demonstration completed!');
  console.log('🚀 Ready for integration with EmailGeneratorAgent');
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateUltraThink().catch(console.error);
}

export { demonstrateUltraThink };