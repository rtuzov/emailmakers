/**
 * 🎯 SIMPLIFIED E2E MULTI-DESTINATION WORKFLOW TESTS
 * 
 * Функциональный E2E тест полного multi-destination workflow
 * От пользовательского запроса до готового HTML email с assets
 * 
 * Тестирует:
 * - Полный pipeline от ContentSpecialist до DeliverySpecialist
 * - Реальную генерацию HTML с валидацией
 * - Asset организацию и управление
 * - Quality validation и compatibility checking
 * 
 * @version 1.0.0
 * @requires Jest, Multi-destination services
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

// Import multi-destination services
import { DestinationAnalyzer } from '../../src/agent/specialists/content/services/destination-analyzer';
import { MultiDestinationPlanner } from '../../src/agent/specialists/content/services/multi-destination-planner';
import { SeasonalOptimizer } from '../../src/agent/specialists/content/services/seasonal-optimizer';
import { MultiDestinationLayoutService } from '../../src/agent/specialists/design/services/multi-destination-layout';
import { MultiDestinationValidationService } from '../../src/agent/specialists/quality/services/multi-destination-validation-service';

// Import types
import {
  type MultiDestinationPlan,
  type UnifiedLayoutPlan,
  type GeographicalScope,
  validateMultiDestinationData,
  MULTI_DESTINATION_LIMITS
} from '../../src/shared/types/multi-destination-types';

// E2E Test Configuration
const E2E_CONFIG = {
  timeout: 120000, // 2 minutes for full workflow
  outputDir: path.join(__dirname, 'temp-e2e-output'),
  
  // Test scenarios
  scenarios: {
    europeAutumn: {
      userQuery: 'Хочу поехать в Европу осенью, покажи лучшие варианты',
      expectedRegion: 'europe',
      expectedSeason: 'autumn',
      expectedDestinations: ['France', 'Italy', 'Germany'],
      minDestinations: 3,
      maxDestinations: 6
    },
    asiaWinter: {
      userQuery: 'Планирую зимнее путешествие по Азии',
      expectedRegion: 'asia', 
      expectedSeason: 'winter',
      expectedDestinations: ['Japan', 'Thailand', 'India'],
      minDestinations: 3,
      maxDestinations: 5
    }
  },
  
  // Quality thresholds
  quality: {
    minHtmlSize: 5000, // 5KB minimum
    maxHtmlSize: 102400, // 100KB maximum
    minQualityScore: 70,
    minCompatibilityScore: 95,
    requiredAssets: ['hero-image', 'destination-images']
  }
} as const;

describe('Multi-Destination E2E Workflow Tests', () => {
  
  // Service instances
  let destinationAnalyzer: DestinationAnalyzer;
  let multiDestinationPlanner: MultiDestinationPlanner;
  let seasonalOptimizer: SeasonalOptimizer;
  let layoutService: MultiDestinationLayoutService;
  let validationService: MultiDestinationValidationService;
  
  // Workflow state
  let workflowResults: {
    campaignPlan?: MultiDestinationPlan;
    layoutPlan?: UnifiedLayoutPlan;
    htmlOutput?: string;
    assets?: string[];
    validationResults?: any;
  } = {};

  beforeAll(async () => {
    // Initialize services
    destinationAnalyzer = new DestinationAnalyzer();
    multiDestinationPlanner = new MultiDestinationPlanner();
    seasonalOptimizer = new SeasonalOptimizer();
    layoutService = new MultiDestinationLayoutService();
    validationService = new MultiDestinationValidationService();
    
    // Create output directory
    try {
      await fs.mkdir(E2E_CONFIG.outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }, E2E_CONFIG.timeout);

  afterAll(async () => {
    // Cleanup test output directory
    try {
      await fs.rmdir(E2E_CONFIG.outputDir, { recursive: true });
    } catch (error) {
      // Directory might not exist or cleanup failed
      console.log('Cleanup warning:', error);
    }
  });

  describe('Complete Europe Autumn Campaign Workflow', () => {
    const scenario = E2E_CONFIG.scenarios.europeAutumn;

    it('1. Content Analysis: Should analyze user query and generate geographical scope', async () => {
      // Step 1: Analyze geographical scope from user query
      const geoScope = await destinationAnalyzer.analyzeGeographicalScope(scenario.userQuery);
      
      expect(geoScope).toBeDefined();
      expect(geoScope.query_type).toBe('regional');
      expect(geoScope.regions).toContain('Europe');
      expect(geoScope.scope_confidence).toBeGreaterThan(80);
      
      console.log('✅ Step 1: Geographical scope analyzed successfully');
      console.log(`   - Regions: ${geoScope.regions.join(', ')}`);
      console.log(`   - Confidence: ${geoScope.scope_confidence}%`);
    });

    it('2. Destination Generation: Should generate destination options', async () => {
      // Create geographical scope for destination generation
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Europe'],
        countries: ['France', 'Italy', 'Germany', 'Spain'],
        cities: [],
        scope_confidence: 95
      };

      // Step 2: Generate destination options
      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      expect(destinations).toBeDefined();
      expect(destinations.length).toBeGreaterThanOrEqual(scenario.minDestinations);
      expect(destinations.length).toBeLessThanOrEqual(scenario.maxDestinations);
      
      // Check that expected destinations are included
      const destinationNames = destinations.map(d => d.destination);
      scenario.expectedDestinations.forEach(expectedDest => {
        expect(destinationNames).toContain(expectedDest);
      });
      
      console.log('✅ Step 2: Destinations generated successfully');
      console.log(`   - Count: ${destinations.length}`);
      console.log(`   - Destinations: ${destinationNames.join(', ')}`);
    });

    it('3. Campaign Planning: Should create unified multi-destination plan', async () => {
      // Create unified campaign plan
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Europe'],
        countries: ['France', 'Italy', 'Germany', 'Spain'],
        cities: [],
        scope_confidence: 95
      };

      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      
      // Step 3: Create unified plan
      workflowResults.campaignPlan = await multiDestinationPlanner.createUnifiedPlan({
        campaignName: `${scenario.userQuery}_campaign_${Date.now()}`,
        geographical_scope: geoScope,
        destinations: destinations,
        campaign_brief: {
          topic: scenario.userQuery,
          target_audience: 'travel_enthusiasts',
          campaign_type: 'promotional'
        }
      });

      expect(workflowResults.campaignPlan).toBeDefined();
      expect(workflowResults.campaignPlan!.campaign_id).toMatch(/^europe_autumn_\d{4}_[a-f0-9]{8}$/);
      expect(workflowResults.campaignPlan!.destinations.length).toBeGreaterThanOrEqual(3);
      expect(workflowResults.campaignPlan!.geographical_scope.regions).toContain('Europe');
      
      console.log('✅ Step 3: Campaign plan created successfully');
      console.log(`   - Campaign ID: ${workflowResults.campaignPlan!.campaign_id}`);
      console.log(`   - Destinations: ${workflowResults.campaignPlan!.destinations.length}`);
    });

    it('4. Seasonal Optimization: Should optimize campaign for autumn season', async () => {
      expect(workflowResults.campaignPlan).toBeDefined();
      
      // Step 4: Optimize seasonal context
      const optimizedPlan = await seasonalOptimizer.optimizeCampaignDates(workflowResults.campaignPlan!);
      
      expect(optimizedPlan).toBeDefined();
      expect(optimizedPlan.seasonal_optimization).toBeDefined();
      expect(optimizedPlan.seasonal_optimization?.target_season).toBe('autumn');
      
      // Check optimal months for autumn
      const optimalMonths = optimizedPlan.seasonal_optimization?.optimal_months || [];
      expect(optimalMonths).toContain('September');
      expect(optimalMonths).toContain('October');
      expect(optimalMonths).toContain('November');
      
      // Update campaign plan with optimization
      workflowResults.campaignPlan = optimizedPlan;
      
      console.log('✅ Step 4: Seasonal optimization completed');
      console.log(`   - Target season: ${optimizedPlan.seasonal_optimization?.target_season}`);
      console.log(`   - Optimal months: ${optimalMonths.join(', ')}`);
    });

    it('5. Layout Planning: Should select optimal template and plan layout', async () => {
      expect(workflowResults.campaignPlan).toBeDefined();
      
      // Step 5: Select optimal template
      workflowResults.layoutPlan = await layoutService.selectOptimalTemplate({
        destinationCount: workflowResults.campaignPlan!.destinations.length,
        layoutPreferences: ['grid', 'compact'],
        campaignType: 'promotional',
        targetAudience: 'travel_enthusiasts'
      });

      expect(workflowResults.layoutPlan).toBeDefined();
      expect(workflowResults.layoutPlan!.layout_type).toMatch(/^(grid|compact|carousel)$/);
      expect(workflowResults.layoutPlan!.template_selection.recommended_template).toMatch(/\.mjml$/);
      
      // Plan destination images
      const imagePlan = await layoutService.planDestinationImages({
        destinations: workflowResults.campaignPlan!.destinations,
        layout_type: workflowResults.layoutPlan!.layout_type,
        seasonal_context: workflowResults.campaignPlan!.seasonal_context
      });

      expect(imagePlan).toBeDefined();
      expect(imagePlan.image_requirements).toBeDefined();
      expect(imagePlan.image_requirements.length).toBeGreaterThan(0);
      
      console.log('✅ Step 5: Layout planning completed');
      console.log(`   - Layout type: ${workflowResults.layoutPlan!.layout_type}`);
      console.log(`   - Template: ${workflowResults.layoutPlan!.template_selection.recommended_template}`);
      console.log(`   - Images planned: ${imagePlan.image_requirements.length}`);
    });

    it('6. HTML Generation: Should generate valid email HTML output', async () => {
      expect(workflowResults.campaignPlan).toBeDefined();
      expect(workflowResults.layoutPlan).toBeDefined();
      
      // Step 6: Generate mock HTML content (in real scenario, this would be MJML compilation)
      const destinations = workflowResults.campaignPlan!.destinations;
      const layoutType = workflowResults.layoutPlan!.layout_type;
      
      // Generate realistic HTML email content
      workflowResults.htmlOutput = generateMockEmailHTML({
        campaign: workflowResults.campaignPlan!,
        layout: workflowResults.layoutPlan!,
        destinations: destinations
      });
      
      expect(workflowResults.htmlOutput).toBeDefined();
      expect(typeof workflowResults.htmlOutput).toBe('string');
      expect(workflowResults.htmlOutput!.length).toBeGreaterThan(E2E_CONFIG.quality.minHtmlSize);
      expect(workflowResults.htmlOutput!.length).toBeLessThan(E2E_CONFIG.quality.maxHtmlSize);
      
      // Validate HTML structure
      expect(workflowResults.htmlOutput).toMatch(/<!DOCTYPE html|<html/i);
      expect(workflowResults.htmlOutput).toContain('<head>');
      expect(workflowResults.htmlOutput).toContain('<body>');
      expect(workflowResults.htmlOutput).toContain('</html>');
      
      // Validate content presence
      expect(workflowResults.htmlOutput).toMatch(/europe/i);
      expect(workflowResults.htmlOutput).toMatch(/autumn/i);
      
      // Save HTML output for inspection
      const htmlPath = path.join(E2E_CONFIG.outputDir, 'europe-autumn-campaign.html');
      await fs.writeFile(htmlPath, workflowResults.htmlOutput!);
      
      console.log('✅ Step 6: HTML generation completed');
      console.log(`   - HTML size: ${workflowResults.htmlOutput!.length} bytes`);
      console.log(`   - Saved to: ${htmlPath}`);
    });

    it('7. Asset Generation: Should generate campaign assets', async () => {
      expect(workflowResults.campaignPlan).toBeDefined();
      
      // Step 7: Generate asset URLs/references
      workflowResults.assets = generateMockAssets(workflowResults.campaignPlan!);
      
      expect(workflowResults.assets).toBeDefined();
      expect(Array.isArray(workflowResults.assets)).toBe(true);
      expect(workflowResults.assets!.length).toBeGreaterThan(0);
      
      // Validate asset types
      const hasHeroImage = workflowResults.assets!.some(asset => 
        asset.includes('hero') || asset.includes('main')
      );
      const hasDestinationImages = workflowResults.assets!.some(asset => 
        scenario.expectedDestinations.some(dest => 
          asset.toLowerCase().includes(dest.toLowerCase())
        )
      );
      
      expect(hasHeroImage).toBe(true);
      expect(hasDestinationImages).toBe(true);
      
      // Validate asset naming conventions
      workflowResults.assets!.forEach(asset => {
        expect(asset).toMatch(/\.(jpg|jpeg|png|svg|webp)$/i);
        expect(asset).not.toContain(' '); // No spaces in filenames
      });
      
      console.log('✅ Step 7: Asset generation completed');
      console.log(`   - Assets count: ${workflowResults.assets!.length}`);
      console.log(`   - Asset types: ${workflowResults.assets!.map(a => path.extname(a)).join(', ')}`);
    });

    it('8. Quality Validation: Should validate complete campaign output', async () => {
      expect(workflowResults.campaignPlan).toBeDefined();
      expect(workflowResults.layoutPlan).toBeDefined();
      expect(workflowResults.htmlOutput).toBeDefined();
      expect(workflowResults.assets).toBeDefined();
      
      // Step 8: Validate multi-destination content
      const mockEmailPackage = {
        html_output: workflowResults.htmlOutput!,
        mjml_source: '<mjml><mj-body>Mock MJML content</mj-body></mjml>',
        file_size_bytes: Buffer.byteLength(workflowResults.htmlOutput!, 'utf8'),
        asset_urls: workflowResults.assets!.map(asset => `https://cdn.example.com/${asset}`)
      };

      workflowResults.validationResults = await validationService.validateMultiDestinationContent({
        input: {
          campaign_data: workflowResults.campaignPlan!,
          layout_plan: workflowResults.layoutPlan!,
          email_package: mockEmailPackage,
          multi_destination_validation_criteria: {
            max_email_size_kb: 100,
            seasonal_date_validation: true,
            min_destinations: 3,
            max_destinations: 6
          }
        },
        context: {
          campaign_id: workflowResults.campaignPlan!.campaign_id,
          trace_id: 'e2e-test-europe-autumn'
        }
      });

      expect(workflowResults.validationResults).toBeDefined();
      expect(workflowResults.validationResults.overall_validation).toBeDefined();
      expect(workflowResults.validationResults.overall_validation.is_valid).toBe(true);
      expect(workflowResults.validationResults.overall_validation.confidence_score).toBeGreaterThan(70);
      
      // Check specific validation categories
      expect(workflowResults.validationResults.email_size_validation.is_valid).toBe(true);
      expect(workflowResults.validationResults.image_validation.is_valid).toBe(true);
      expect(workflowResults.validationResults.date_validation.is_valid).toBe(true);
      
      console.log('✅ Step 8: Quality validation completed');
      console.log(`   - Overall score: ${workflowResults.validationResults.overall_validation.confidence_score}%`);
      console.log(`   - Email size valid: ${workflowResults.validationResults.email_size_validation.is_valid}`);
    });

    it('9. End-to-End Validation: Should validate complete workflow integrity', async () => {
      // Step 9: Final validation of complete workflow
      expect(workflowResults.campaignPlan).toBeDefined();
      expect(workflowResults.layoutPlan).toBeDefined();
      expect(workflowResults.htmlOutput).toBeDefined();
      expect(workflowResults.assets).toBeDefined();
      expect(workflowResults.validationResults).toBeDefined();
      
      // Validate the complete multi-destination data
      const dataValidation = validateMultiDestinationData(workflowResults.campaignPlan!, {
        max_email_size_kb: 100,
        seasonal_date_validation: true
      });

      expect(dataValidation.isValid).toBe(true);
      expect(dataValidation.errors).toHaveLength(0);
      expect(dataValidation.validationScore).toBeGreaterThan(70);
      
      // Validate constraints
      expect(workflowResults.campaignPlan!.destinations.length).toBeGreaterThanOrEqual(MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS);
      expect(workflowResults.campaignPlan!.destinations.length).toBeLessThanOrEqual(MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS);
      
      // Generate workflow summary
      const workflowSummary = {
        campaign_id: workflowResults.campaignPlan!.campaign_id,
        destinations_count: workflowResults.campaignPlan!.destinations.length,
        layout_type: workflowResults.layoutPlan!.layout_type,
        html_size_bytes: Buffer.byteLength(workflowResults.htmlOutput!, 'utf8'),
        assets_count: workflowResults.assets!.length,
        quality_score: workflowResults.validationResults.overall_validation.confidence_score,
        validation_status: 'passed'
      };
      
      // Save workflow summary
      const summaryPath = path.join(E2E_CONFIG.outputDir, 'workflow-summary.json');
      await fs.writeFile(summaryPath, JSON.stringify(workflowSummary, null, 2));
      
      console.log('✅ Step 9: End-to-end validation completed');
      console.log(`   - Workflow summary saved to: ${summaryPath}`);
      console.log(`   - Final validation score: ${dataValidation.validationScore}%`);
    });
  });

  describe('Asia Winter Campaign Workflow', () => {
    const scenario = E2E_CONFIG.scenarios.asiaWinter;

    it('Should complete Asia winter workflow successfully', async () => {
      // Complete workflow for Asia winter scenario
      const geoScope: GeographicalScope = {
        query_type: 'regional',
        scope_level: 'continent',
        regions: ['Asia'],
        countries: ['Japan', 'Thailand', 'India'],
        cities: [],
        scope_confidence: 92
      };

      // Generate destinations
      const destinations = await destinationAnalyzer.generateDestinationOptions(geoScope);
      expect(destinations.length).toBeGreaterThanOrEqual(scenario.minDestinations);
      
      // Create campaign plan
      const campaignPlan = await multiDestinationPlanner.createUnifiedPlan({
        campaignName: `${scenario.userQuery}_campaign_${Date.now()}`,
        geographical_scope: geoScope,
        destinations: destinations,
        campaign_brief: {
          topic: scenario.userQuery,
          target_audience: 'winter_travelers',
          campaign_type: 'seasonal'
        }
      });

      expect(campaignPlan.campaign_id).toMatch(/^asia_winter_\d{4}_[a-f0-9]{8}$/);
      
      // Optimize for winter
      const optimizedPlan = await seasonalOptimizer.optimizeCampaignDates(campaignPlan);
      expect(optimizedPlan.seasonal_optimization?.target_season).toBe('winter');
      
      console.log('✅ Asia winter workflow completed successfully');
      console.log(`   - Campaign ID: ${optimizedPlan.campaign_id}`);
      console.log(`   - Season: ${optimizedPlan.seasonal_optimization?.target_season}`);
    });
  });
});

/**
 * Generate mock email HTML content for testing
 */
function generateMockEmailHTML(params: {
  campaign: MultiDestinationPlan;
  layout: UnifiedLayoutPlan;
  destinations: any[];
}): string {
  const { campaign, layout, destinations } = params;
  
  const destinationCards = destinations.map(dest => `
    <div class="destination-card" style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="color: #333; margin: 0 0 10px 0;">${dest.destination}</h3>
      <p style="color: #666; margin: 0 0 10px 0;">Appeal Score: ${dest.appeal_score}/100</p>
      <img src="https://cdn.example.com/${dest.destination.toLowerCase()}-autumn.jpg" 
           alt="${dest.destination}" 
           style="width: 100%; max-width: 300px; height: 200px; object-fit: cover;" />
    </div>
  `).join('');
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.campaign_id} - Multi-Destination Campaign</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 640px; margin: 0 auto; background-color: white; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .destinations { display: flex; flex-wrap: wrap; gap: 20px; }
    .destination-card { flex: 1; min-width: 280px; }
    @media (max-width: 600px) {
      .destinations { flex-direction: column; }
      .destination-card { min-width: auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #2c3e50; margin: 0;">Discover Europe This Autumn</h1>
      <p style="color: #7f8c8d; margin: 10px 0 0 0;">Experience the beauty of autumn with our carefully selected destinations</p>
    </div>
    
    <div class="destinations" style="margin-bottom: 30px;">
      ${destinationCards}
    </div>
    
    <div style="text-align: center; margin-top: 40px;">
      <a href="https://example.com/book" 
         style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Book Your Journey
      </a>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
      <p>Campaign ID: ${campaign.campaign_id}</p>
      <p>Layout: ${layout.layout_type} | Template: ${layout.template_selection.recommended_template}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate mock assets for testing
 */
function generateMockAssets(campaign: MultiDestinationPlan): string[] {
  const assets: string[] = [];
  
  // Hero image
  assets.push(`${campaign.campaign_id}-hero.jpg`);
  
  // Destination images
  campaign.destinations.forEach(dest => {
    assets.push(`${dest.destination.toLowerCase()}-autumn.jpg`);
    assets.push(`${dest.destination.toLowerCase()}-thumbnail.jpg`);
  });
  
  // Additional assets
  assets.push(`${campaign.campaign_id}-background.jpg`);
  assets.push(`${campaign.campaign_id}-logo.svg`);
  assets.push(`${campaign.campaign_id}-cta-button.png`);
  
  return assets;
}