/**
 * 🧪 MULTI-DESTINATION INTEGRATION TESTS
 * 
 * Comprehensive integration tests for multi-destination email campaign workflow
 * Tests scenarios like 'Европа осенью', 'Азия зимой' and validates the full pipeline
 * 
 * Test Coverage:
 * - Content analysis and geographical scope detection
 * - Destination generation and optimization
 * - Design template selection and layout planning  
 * - Quality validation of multi-destination content
 * - Asset organization and delivery
 * 
 * @version 1.0.0
 * @requires Jest, OpenAI SDK v2, multi-destination services
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Import only services that don't depend on OpenAI SDK for testing

// Import multi-destination types and services
import {
  type MultiDestinationPlan,
  type DestinationPlan,
  type UnifiedLayoutPlan,
  type GeographicalScope,
  validateMultiDestinationData,
  MULTI_DESTINATION_LIMITS,
  SUPPORTED_REGIONS
} from '../../src/shared/types/multi-destination-types';

import { DestinationAnalyzer } from '../../src/agent/specialists/content/services/destination-analyzer';
import { MultiDestinationPlanner } from '../../src/agent/specialists/content/services/multi-destination-planner';
import { SeasonalOptimizer } from '../../src/agent/specialists/content/services/seasonal-optimizer';
import { MultiDestinationLayoutService } from '../../src/agent/specialists/design/services/multi-destination-layout';
import { MultiDestinationValidationService } from '../../src/agent/specialists/quality/services/multi-destination-validation-service';

// Import base types
import { 
  type BaseAgentInput, 
  type BaseAgentOutput,
  type ContentToDesignHandoffData 
} from '../../src/agent/types/base-agent-types';

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds for integration tests
  retries: 2,
  mockMode: process.env.NODE_ENV === 'test',
  
  // Test scenarios
  scenarios: {
    europeAutumn: {
      query: 'Европа осенью',
      expectedRegion: 'europe' as const,
      expectedSeason: 'autumn' as const,
      expectedDestinations: ['France', 'Italy', 'Germany'],
      minDestinations: 3,
      maxDestinations: 6
    },
    asiaWinter: {
      query: 'Азия зимой',
      expectedRegion: 'asia' as const,
      expectedSeason: 'winter' as const,
      expectedDestinations: ['Japan', 'Thailand', 'India'],
      minDestinations: 3,
      maxDestinations: 5
    }
  }
} as const;

// Mock responses for testing
const mockResponses = {
  contentAnalysis: {
    geographical_scope: {
      query_type: 'regional' as const,
      scope_level: 'continent' as const,
      regions: ['Europe'] as const,
      countries: ['France', 'Italy', 'Germany'],
      cities: [],
      scope_confidence: 95
    },
    seasonal_context: {
      target_season: 'autumn' as const,
      optimal_months: [9, 10, 11],
      climate_considerations: {
        temperature_range: '15-25°C',
        weather_conditions: ['mild', 'occasional_rain'],
        daylight_hours: '10-12 hours'
      }
    }
  },
  
  designSelection: {
    layout_type: 'grid' as const,
    template_selection: {
      recommended_template: 'multi-destination-grid.mjml',
      alternative_templates: ['multi-destination-compact.mjml'],
      template_rationale: 'Grid layout optimal for 4-6 destinations'
    }
  },
  
  qualityValidation: {
    validation_status: 'passed' as const,
    overall_score: 88,
    email_size_kb: 75,
    compatibility_score: 97
  }
};

describe('Multi-Destination Integration Tests', () => {
  
  // Service instances
  let destinationAnalyzer: DestinationAnalyzer;
  let multiDestinationPlanner: MultiDestinationPlanner;
  let seasonalOptimizer: SeasonalOptimizer;
  let layoutService: MultiDestinationLayoutService;
  let validationService: MultiDestinationValidationService;

  beforeAll(async () => {
    // Initialize services for testing
    
    // Initialize services
    destinationAnalyzer = new DestinationAnalyzer();
    multiDestinationPlanner = new MultiDestinationPlanner();
    seasonalOptimizer = new SeasonalOptimizer();
    layoutService = new MultiDestinationLayoutService();
    validationService = new MultiDestinationValidationService();
    
    // Setup mocks for external dependencies
    if (TEST_CONFIG.mockMode) {
      jest.setTimeout(TEST_CONFIG.timeout);
      setupMockResponses();
    }
  });

  afterAll(async () => {
    // Cleanup test resources
    jest.restoreAllMocks();
  });

  describe('Scenario: Европа осенью', () => {
    const scenario = TEST_CONFIG.scenarios.europeAutumn;
    let campaignPlan: MultiDestinationPlan;
    let layoutPlan: UnifiedLayoutPlan;
    let validationResults: any;

    it('1. Content Analysis: Should analyze geographical and seasonal context', async () => {
      // Prepare input for content specialist
      const contentInput: BaseAgentInput = {
        task_type: 'analyze_multi_destination',
        campaign_brief: {
          topic: scenario.query,
          campaign_type: 'promotional',
          target_audience: 'travel_enthusiasts',
        },
        trace_id: 'test-europe-autumn-001'
      };

      // Analyze geographical scope
      const geoScope = await destinationAnalyzer.analyzeGeographicalScope(scenario.query);
      
      expect(geoScope).toBeDefined();
      expect(geoScope.query_type).toBe('regional');
      expect(geoScope.regions).toContain('Europe');
      expect(geoScope.scope_confidence).toBeGreaterThan(80);
      
      // Generate destination options
      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      expect(destinations).toBeDefined();
      expect(destinations.length).toBeGreaterThanOrEqual(scenario.minDestinations);
      expect(destinations.length).toBeLessThanOrEqual(scenario.maxDestinations);
      
      // Check that expected destinations are included
      const destinationNames = destinations.map(d => d.destination);
      scenario.expectedDestinations.forEach(expectedDest => {
        expect(destinationNames).toContain(expectedDest);
      });
    });

    it('2. Campaign Planning: Should create unified multi-destination plan', async () => {
      // Create sample geographical scope
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Europe'],
        countries: ['France', 'Italy', 'Germany'],
        cities: [],
        scope_confidence: 95
      };

      // Generate destinations
      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      // Create unified plan
      campaignPlan = await multiDestinationPlanner.createUnifiedPlan({
        campaignName: `${scenario.query}_campaign_${Date.now()}`,
        geographical_scope: geoScope,
        destinations: destinations,
        campaign_brief: {
          topic: scenario.query,
          target_audience: 'travel_enthusiasts',
          campaign_type: 'promotional'
        }
      });

      expect(campaignPlan).toBeDefined();
      expect(campaignPlan.campaign_id).toMatch(/^europe_autumn_\d{4}_[a-f0-9]{8}$/);
      expect(campaignPlan.destinations.length).toBeGreaterThanOrEqual(3);
      expect(campaignPlan.geographical_scope.regions).toContain('Europe');
      
      // Validate seasonal context
      expect(campaignPlan.seasonal_context?.target_season).toBe('autumn');
      expect(campaignPlan.seasonal_context?.optimal_months).toContain(10); // October
    });

    it('3. Seasonal Optimization: Should optimize dates and seasonal context', async () => {
      expect(campaignPlan).toBeDefined();
      
      // Optimize seasonal context
      const optimizedPlan = await seasonalOptimizer.optimizeCampaignDates(campaignPlan);
      
      expect(optimizedPlan).toBeDefined();
      expect(optimizedPlan.seasonal_optimization).toBeDefined();
      expect(optimizedPlan.seasonal_optimization?.target_season).toBe('autumn');
      
      // Check optimal months for autumn in Europe
      const optimalMonths = optimizedPlan.seasonal_optimization?.optimal_months || [];
      expect(optimalMonths).toContain('September');
      expect(optimalMonths).toContain('October');
      expect(optimalMonths).toContain('November');
      
      // Validate seasonal recommendations
      expect(optimizedPlan.seasonal_optimization?.best_destinations_for_season).toBeDefined();
      expect(optimizedPlan.seasonal_optimization?.best_destinations_for_season.length).toBeGreaterThan(0);
    });

    it('4. Layout Planning: Should select optimal template and plan images', async () => {
      expect(campaignPlan).toBeDefined();
      
      // Select optimal template
      const templateSelection = await layoutService.selectOptimalTemplate({
        destination_count: campaignPlan.destinations.length,
        layout_preferences: ['grid', 'compact'],
        campaign_type: 'promotional',
        target_audience: 'travel_enthusiasts'
      });

      expect(templateSelection).toBeDefined();
      expect(templateSelection.layout_type).toMatch(/^(grid|compact|carousel)$/);
      expect(templateSelection.template_selection.recommended_template).toMatch(/\.mjml$/);
      
      // Plan destination images
      const imagePlan = await layoutService.planDestinationImages({
        destinations: campaignPlan.destinations,
        layout_type: templateSelection.layout_type,
        seasonal_context: campaignPlan.seasonal_context
      });

      expect(imagePlan).toBeDefined();
      expect(imagePlan.image_requirements).toBeDefined();
      expect(imagePlan.image_requirements.length).toBeGreaterThan(0);
      
      // Validate image optimization
      expect(imagePlan.optimization_settings).toBeDefined();
      expect(imagePlan.optimization_settings.target_file_size_kb).toBeLessThanOrEqual(500);
      
      layoutPlan = templateSelection;
    });

    it('5. Quality Validation: Should validate multi-destination content', async () => {
      expect(campaignPlan).toBeDefined();
      expect(layoutPlan).toBeDefined();
      
      // Create mock email package for validation
      const mockEmailPackage = {
        html_output: '<html><head><title>Europe Autumn Campaign</title></head><body>Mock HTML content for testing</body></html>',
        mjml_source: '<mjml><mj-body>Mock MJML content</mj-body></mjml>',
        file_size_bytes: 76800, // 75KB
        asset_urls: [
          'https://example.com/france-autumn.jpg',
          'https://example.com/italy-autumn.jpg',
          'https://example.com/germany-autumn.jpg'
        ]
      };

      // Validate multi-destination content
      validationResults = await validationService.validateMultiDestinationContent({
        input: {
          campaign_data: campaignPlan,
          layout_plan: layoutPlan,
          email_package: mockEmailPackage,
          multi_destination_validation_criteria: {
            max_email_size_kb: 100,
            seasonal_date_validation: true,
            min_destinations: 3,
            max_destinations: 6
          }
        },
        context: {
          campaign_id: campaignPlan.campaign_id,
          trace_id: 'test-europe-autumn-validation'
        }
      });

      expect(validationResults).toBeDefined();
      expect(validationResults.overall_validation).toBeDefined();
      expect(validationResults.overall_validation.is_valid).toBe(true);
      expect(validationResults.overall_validation.confidence_score).toBeGreaterThan(70);
      
      // Check specific validation categories
      expect(validationResults.email_size_validation.is_valid).toBe(true);
      expect(validationResults.image_validation.is_valid).toBe(true);
      expect(validationResults.date_validation.is_valid).toBe(true);
    });

    it('6. End-to-End Validation: Should validate complete workflow data', async () => {
      expect(campaignPlan).toBeDefined();
      expect(layoutPlan).toBeDefined();
      expect(validationResults).toBeDefined();
      
      // Validate the complete multi-destination data
      const dataValidation = validateMultiDestinationData(campaignPlan, {
        max_email_size_kb: 100,
        seasonal_date_validation: true
      });

      expect(dataValidation.isValid).toBe(true);
      expect(dataValidation.errors).toHaveLength(0);
      expect(dataValidation.validationScore).toBeGreaterThan(70);
      
      // Validate constraints
      expect(campaignPlan.destinations.length).toBeGreaterThanOrEqual(MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS);
      expect(campaignPlan.destinations.length).toBeLessThanOrEqual(MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS);
      
      // Validate region support
      campaignPlan.geographical_scope.regions.forEach(region => {
        expect(SUPPORTED_REGIONS).toContain(region);
      });
    });
  });

  describe('Scenario: Азия зимой', () => {
    const scenario = TEST_CONFIG.scenarios.asiaWinter;
    let asiaCampaignPlan: MultiDestinationPlan;

    it('1. Geographic Analysis: Should detect Asian scope and winter season', async () => {
      // Analyze geographical scope for Asia
      const geoScope = await destinationAnalyzer.analyzeGeographicalScope(scenario.query);
      
      expect(geoScope).toBeDefined();
      expect(geoScope.query_type).toBe('regional');
      expect(geoScope.regions).toContain('Asia');
      expect(geoScope.scope_confidence).toBeGreaterThan(80);
    });

    it('2. Destination Generation: Should generate Asian winter destinations', async () => {
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Asia'],
        countries: ['Japan', 'Thailand', 'India'],
        cities: [],
        scope_confidence: 92
      };

      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      expect(destinations).toBeDefined();
      expect(destinations.length).toBeGreaterThanOrEqual(scenario.minDestinations);
      
      // Check for winter-appropriate Asian destinations
      const destinationNames = destinations.map(d => d.destination);
      expect(destinationNames.some(name => scenario.expectedDestinations.includes(name))).toBe(true);
    });

    it('3. Winter Optimization: Should optimize for winter season in Asia', async () => {
      // Create test campaign for Asia winter
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent', 
        regions: ['Asia'],
        countries: ['Japan', 'Thailand', 'India'],
        cities: [],
        scope_confidence: 92
      };

      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      asiaCampaignPlan = await multiDestinationPlanner.createUnifiedPlan({
        campaignName: `${scenario.query}_campaign_${Date.now()}`,
        geographical_scope: geoScope,
        destinations: destinations,
        campaign_brief: {
          topic: scenario.query,
          target_audience: 'winter_travelers',
          campaign_type: 'seasonal'
        }
      });

      // Optimize for winter
      const optimizedPlan = await seasonalOptimizer.optimizeCampaignDates(asiaCampaignPlan);
      
      expect(optimizedPlan.seasonal_optimization?.target_season).toBe('winter');
      
      // Winter months in Asia
      const optimalMonths = optimizedPlan.seasonal_optimization?.optimal_months || [];
      expect(optimalMonths.some(month => ['December', 'January', 'February'].includes(month))).toBe(true);
    });

    it('4. Layout Adaptation: Should adapt layout for Asian winter theme', async () => {
      expect(asiaCampaignPlan).toBeDefined();
      
      const templateSelection = await layoutService.selectOptimalTemplate({
        destination_count: asiaCampaignPlan.destinations.length,
        layout_preferences: ['compact', 'grid'],
        campaign_type: 'seasonal',
        target_audience: 'winter_travelers'
      });

      expect(templateSelection).toBeDefined();
      expect(['compact', 'grid', 'carousel']).toContain(templateSelection.layout_type);
      
      // Validate winter-specific image planning
      const imagePlan = await layoutService.planDestinationImages({
        destinations: asiaCampaignPlan.destinations,
        layout_type: templateSelection.layout_type,
        seasonal_context: asiaCampaignPlan.seasonal_context
      });

      expect(imagePlan.seasonal_adaptations).toBeDefined();
      expect(imagePlan.seasonal_adaptations?.winter_themes).toBeDefined();
    });
  });

  describe('Service Integration Tests', () => {
    
    it('Should handle service interdependencies correctly', async () => {
      // Test that services can work together without conflicts
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Europe'],
        countries: ['France', 'Italy'],
        cities: [],
        scope_confidence: 85
      };

      // Chain service calls
      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      const plan = await multiDestinationPlanner.createUnifiedPlan({
        campaignName: `test_integration_campaign_${Date.now()}`,
        geographical_scope: geoScope,
        destinations: destinations,
        campaign_brief: {
          topic: 'Test Integration',
          target_audience: 'test_users',
          campaign_type: 'promotional'
        }
      });
      const optimizedPlan = await seasonalOptimizer.optimizeCampaignDates(plan);
      
      expect(optimizedPlan).toBeDefined();
      expect(optimizedPlan.campaign_id).toBe(plan.campaign_id);
      expect(optimizedPlan.destinations.length).toBe(plan.destinations.length);
    });

    it('Should validate cross-service data consistency', async () => {
      // Test data consistency across different services
      const testData = {
        regions: ['Europe', 'Asia'],
        seasons: ['autumn', 'winter'] as const,
        layoutTypes: ['grid', 'compact'] as const
      };

      testData.regions.forEach(region => {
        expect(SUPPORTED_REGIONS).toContain(region);
      });

      // Test layout constraints consistency
      testData.layoutTypes.forEach(layoutType => {
        const constraints = MULTI_DESTINATION_LIMITS.OPTIMAL_DESTINATIONS[layoutType];
        expect(constraints).toBeDefined();
        expect(constraints.min).toBeGreaterThan(0);
        expect(constraints.max).toBeGreaterThan(constraints.min);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    it('Should handle invalid geographical queries gracefully', async () => {
      const invalidQuery = 'Марс летом'; // Mars in summer - invalid location
      
      try {
        const geoScope = await destinationAnalyzer.analyzeGeographicalScope(invalidQuery);
        // Should either handle gracefully or provide fallback
        expect(geoScope.scope_confidence).toBeLessThan(50);
      } catch (error) {
        // Error should be informative
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/geographical|location|invalid/i);
      }
    });

    it('Should handle minimum and maximum destination limits', async () => {
      // Test minimum destinations
      const minGeoScope: GeographicalScope = {
        query_type: 'city',
        scope_level: 'city',
        regions: [],
        countries: ['France'],
        cities: ['Paris'],
        scope_confidence: 70
      };

      const minDestinations = await destinationAnalyzer.generateDestinationOptions(minGeoScope);
      expect(minDestinations.length).toBeGreaterThanOrEqual(MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS);

      // Test maximum destinations constraint
      const maxGeoScope: GeographicalScope = {
        query_type: 'global',
        scope_level: 'global',
        regions: ['Europe', 'Asia', 'North America'],
        countries: [],
        cities: [],
        scope_confidence: 90
      };

      const maxDestinations = await destinationAnalyzer.generateDestinationOptions(maxGeoScope);
      expect(maxDestinations.length).toBeLessThanOrEqual(MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS);
    });

    it('Should validate seasonal constraints', async () => {
      // Test invalid seasonal combinations
      const invalidSeasonalData = {
        target_season: 'invalid_season' as any,
        optimal_months: [13, 14] // Invalid months
      };

      const validationResult = validateMultiDestinationData({
        campaign_id: 'test-invalid-seasonal',
        destinations: [{ destination: 'Test', appeal_score: 80 }],
        seasonal_context: invalidSeasonalData
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Setup mock responses for external dependencies during testing
 */
function setupMockResponses(): void {
  // Mock OpenAI SDK responses
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(mockResponses.contentAnalysis)
              }
            }]
          })
        }
      }
    }))
  }));

  // Mock file system operations
  jest.mock('fs/promises', () => ({
    readFile: jest.fn().mockResolvedValue('Mock file content'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  }));

  // Mock path operations
  jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => '/' + args.join('/')),
    dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
    basename: jest.fn((path) => path.split('/').pop())
  }));
}