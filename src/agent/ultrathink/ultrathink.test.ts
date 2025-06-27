import { describe, test, expect } from '@jest/globals';
import { 
  UltraThinkEngine, 
  UltraThinkUtils, 
  RouteValidator, 
  DateValidator, 
  SimpleDataProvider,
  ContextEnricher
} from './index';
import { EmailGenerationRequest } from '../types';

describe('UltraThink Phase 1 Components', () => {
  
  /**
   * TC-UT-01: Route Validation
   */
  test('TC-UT-01: Should validate routes correctly', () => {
    // Test same origin/destination correction
    const invalidRoute = RouteValidator.validateRoute('LED', 'LED');
    expect(invalidRoute.valid).toBe(false);
    expect(invalidRoute.correctedDestination).toBeDefined();
    expect(invalidRoute.issues).toContain('same_origin_destination');

    // Test valid popular route
    const validRoute = RouteValidator.validateRoute('MOW', 'LED');
    expect(validRoute.valid).toBe(true);
    expect(validRoute.popularity).toBe('high');

    // Test unknown airport
    const unknownRoute = RouteValidator.validateRoute('ABC', 'XYZ');
    expect(unknownRoute.valid).toBe(false);
    expect(unknownRoute.issues).toContain('unknown_origin');
  });

  /**
   * TC-UT-02: Date Validation
   */
  test('TC-UT-02: Should validate dates correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const validDateRange = `${futureDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
    
    const dateValidation = DateValidator.validateDateRange(validDateRange, 'AER');
    expect(dateValidation.valid).toBe(true);
    expect(dateValidation.seasonalContext).toBeDefined();

    // Test invalid format
    const invalidDate = DateValidator.validateDateRange('invalid-format');
    expect(invalidDate.valid).toBe(false);
    expect(invalidDate.issue).toBe('invalid_date_format');

    // Test past date
    const pastDate = DateValidator.validateDateRange('2020-01-01,2020-01-07');
    expect(pastDate.valid).toBe(false);
    expect(pastDate.issue).toBe('date_in_past');
  });

  /**
   * TC-UT-03: Simple Data Provider
   */
  test('TC-UT-03: Should provide correct data', () => {
    // Test holiday check
    expect(SimpleDataProvider.isHoliday('2025-01-01', 'RU')).toBe(true);
    expect(SimpleDataProvider.isHoliday('2025-06-15', 'RU')).toBe(false);

    // Test seasonal context
    const summerDate = new Date('2025-07-15');
    const seasonal = SimpleDataProvider.getSeasonalContext(summerDate);
    expect(seasonal.season).toBe('summer');
    expect(seasonal.priceFactor).toBeGreaterThan(1);

    // Test route popularity
    const popularity = SimpleDataProvider.getRoutePopularity('MOW', 'LED');
    expect(popularity).toBeGreaterThan(5);

    // Test price multiplier
    const testDate = new Date('2025-07-15');
    const multiplier = SimpleDataProvider.getPriceMultiplier(testDate, 'MOW', 'LED', 'RU');
    expect(multiplier.multiplier).toBeGreaterThan(1);
    expect(multiplier.factors).toContain('Сезонность: summer');
  });

  /**
   * TC-UT-04: Context Enrichment
   */
  test('TC-UT-04: Should enrich context correctly', async () => {
    const request: EmailGenerationRequest = {
      topic: 'Путешествие в Сочи',
      origin: 'MOW',
      destination: 'AER',
      date_range: '2025-07-15,2025-07-22',
      campaign_type: 'seasonal'
    };

    const enrichment = await ContextEnricher.enrichContext(request);
    
    expect(enrichment.seasonal.season).toBe('summer');
    expect(enrichment.routePopularity).toBe('high');
    expect(enrichment.suggestions.length).toBeGreaterThan(0);
    expect(enrichment.timezoneDiff).toBe(0); // Same timezone
  });

  /**
   * TC-UT-05: Request Validation and Correction
   */
  test('TC-UT-05: Should validate and correct requests', async () => {
    const invalidRequest: EmailGenerationRequest = {
      topic: 'Поездка',
      origin: 'LED',
      destination: 'LED', // Same as origin
      date_range: '2020-01-01,2020-01-07' // Past date
    };

    const validation = await ContextEnricher.validateAndCorrect(invalidRequest);
    
    expect(validation.valid).toBe(false);
    expect(validation.issues.length).toBeGreaterThan(0);
    expect(validation.correctedRequest).toBeDefined();
    expect(validation.correctedRequest?.destination).not.toBe('LED');
  });

  /**
   * TC-UT-06: UltraThink Engine Integration
   */
  test('TC-UT-06: Should enhance requests with UltraThink', async () => {
    const engine = new UltraThinkEngine();
    
    const request: EmailGenerationRequest = {
      topic: 'Летний отпуск в Сочи',
      origin: 'MOW',
      destination: 'AER',
      date_range: '2025-08-15,2025-08-22'
    };

    const enhancement = await engine.enhanceRequest(request);
    
    expect(enhancement.validatedRequest).toBeDefined();
    expect(enhancement.enrichedContext).toBeDefined();
    expect(enhancement.optimizedSequence).toBeDefined();
    expect(enhancement.validationResult).toBeDefined();

    // Check that summer context is detected
    expect(enhancement.enrichedContext.seasonal.season).toBe('summer');
    expect(enhancement.enrichedContext.suggestions.length).toBeGreaterThan(0);
  });

  /**
   * TC-UT-07: Utility Functions
   */
  test('TC-UT-07: Should provide correct utility functions', () => {
    // Test route validation utility
    const routeValidation = UltraThinkUtils.validateRoute('MOW', 'LED');
    expect(routeValidation.valid).toBe(true);

    // Test date validation utility
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const endDate = new Date(futureDate);
    endDate.setDate(endDate.getDate() + 7);
    const dateRange = `${futureDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`;
    
    const dateValidation = UltraThinkUtils.validateDate(dateRange);
    expect(dateValidation.valid).toBe(true);

    // Test holiday check utility
    expect(UltraThinkUtils.isHoliday('2025-01-01', 'RU')).toBe(true);

    // Test seasonal context utility
    const seasonal = UltraThinkUtils.getSeasonalContext(new Date('2025-07-15'));
    expect(seasonal.season).toBe('summer');
  });

  /**
   * TC-UT-08: Error Handling Analytics
   */
  test('TC-UT-08: Should track execution analytics', async () => {
    const engine = new UltraThinkEngine();
    
    // Record some successful executions
    engine.recordSuccess('get_prices', 1500);
    engine.recordSuccess('generate_copy', 3000);
    
    const analytics = engine.getExecutionAnalytics();
    
    expect(analytics.totalSteps).toBe(2);
    expect(analytics.successfulSteps).toBe(2);
    expect(analytics.failedSteps).toBe(0);
    expect(analytics.errorRate).toBe(0);
    expect(analytics.averageStepDuration).toBe(2250);
  });

  /**
   * TC-UT-09: City Database Coverage
   */
  test('TC-UT-09: Should have comprehensive city database', () => {
    const cities = RouteValidator.getAllCities();
    
    // Check major Russian cities
    expect(cities['MOW']).toBeDefined();
    expect(cities['LED']).toBeDefined();
    expect(cities['AER']).toBeDefined();
    expect(cities['SVX']).toBeDefined();

    // Check major European cities
    expect(cities['CDG']).toBeDefined();
    expect(cities['LHR']).toBeDefined();
    expect(cities['FCO']).toBeDefined();

    // Check popular destinations
    expect(cities['BKK']).toBeDefined();
    expect(cities['DXB']).toBeDefined();

    // Verify city info structure
    expect(cities['MOW'].name).toBe('Москва');
    expect(cities['MOW'].country).toBe('RU');
    expect(cities['MOW'].popular).toBe(true);
  });

  /**
   * TC-UT-10: Performance Benchmarks
   */
  test('TC-UT-10: Should meet performance benchmarks', async () => {
    const engine = new UltraThinkEngine();
    
    const request: EmailGenerationRequest = {
      topic: 'Бизнес поездка в Санкт-Петербург',
      origin: 'MOW',
      destination: 'LED',
      date_range: '2025-06-15,2025-06-17'
    };

    const startTime = Date.now();
    const enhancement = await engine.enhanceRequest(request);
    const duration = Date.now() - startTime;

    // UltraThink enhancement should be fast (<200ms)
    expect(duration).toBeLessThan(200);
    
    // Should provide meaningful enhancements
    expect(enhancement.enrichedContext.suggestions.length).toBeGreaterThan(0);
    expect(enhancement.optimizedSequence.steps.length).toBeGreaterThan(0);
  });
});