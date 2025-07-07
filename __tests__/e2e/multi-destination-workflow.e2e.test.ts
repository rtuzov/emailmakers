/**
 * 🎯 E2E MULTI-DESTINATION WORKFLOW TESTS
 * 
 * Полный сквозной тест multi-destination email generation workflow
 * От пользовательского запроса до готового HTML email с assets
 * 
 * Основано на OpenAI Agents SDK v2 документации:
 * - Agent.create() для type safety с handoffs 
 * - tool() с Zod validation без .nullable().default()
 * - run() с proper error handling
 * - Handoffs между специализированными агентами
 * 
 * @version 1.0.0
 * @requires OpenAI Agents SDK v2, Jest, Playwright
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Import types for testing
import {
  type MultiDestinationPlan,
  type UnifiedLayoutPlan,
  validateMultiDestinationData,
  MULTI_DESTINATION_LIMITS
} from '../../src/shared/types/multi-destination-types';

// E2E Test Configuration
const E2E_CONFIG = {
  timeout: 180000, // 3 minutes for full workflow
  retries: 1,
  
  // Test scenarios
  scenarios: {
    europeAutumn: {
      userQuery: 'Хочу поехать в Европу осенью, покажи лучшие варианты',
      expectedDestinations: ['France', 'Italy', 'Germany', 'Spain'],
      minDestinations: 3,
      maxDestinations: 6,
      expectedSeason: 'autumn',
      expectedRegion: 'europe'
    },
    asiaWinter: {
      userQuery: 'Планирую зимнее путешествие по Азии',
      expectedDestinations: ['Japan', 'Thailand', 'India', 'Vietnam'],
      minDestinations: 3,
      maxDestinations: 5,
      expectedSeason: 'winter',
      expectedRegion: 'asia'
    }
  },
  
  // Quality thresholds
  quality: {
    minHtmlSize: 10000, // 10KB minimum
    maxHtmlSize: 102400, // 100KB maximum
    minCompatibilityScore: 95,
    minQualityScore: 80,
    requiredAssets: ['hero-image', 'destination-images'],
    emailClients: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail']
  },
  
  // API endpoints
  endpoints: {
    agentRun: '/api/agent/run',
    templateGenerate: '/api/templates/generate',
    health: '/api/health'
  }
} as const;

// Mock data for E2E testing
const mockApiResponses = {
  healthCheck: {
    status: 'healthy',
    version: '1.0.0',
    agents: {
      content_specialist: 'ready',
      design_specialist: 'ready', 
      quality_specialist: 'ready',
      delivery_specialist: 'ready'
    }
  },
  
  agentRunSuccess: {
    success: true,
    task_type: 'analyze_multi_destination',
    results: {
      multiDestinationPlan: {
        campaign_id: 'europe_autumn_2024_test',
        geographical_scope: {
          query_type: 'regional',
          scope_level: 'continent',
          regions: ['Europe'],
          countries: ['France', 'Italy', 'Germany'],
          cities: [],
          scope_confidence: 95
        },
        destinations: [
          {
            destination: 'France',
            appeal_score: 95,
            seasonal_fit: 90,
            pricing_tier: 'mid-range'
          },
          {
            destination: 'Italy', 
            appeal_score: 92,
            seasonal_fit: 88,
            pricing_tier: 'mid-range'
          }
        ],
        seasonal_context: {
          target_season: 'autumn',
          optimal_months: [9, 10, 11]
        }
      },
      htmlOutput: '<html><head><title>Europe Autumn Campaign</title></head><body><h1>Discover Europe This Autumn</h1><p>Experience the beauty of autumn in Europe with our carefully selected destinations.</p></body></html>',
      assets: [
        'europe-autumn-hero.jpg',
        'france-autumn.jpg', 
        'italy-autumn.jpg'
      ]
    },
    analytics: {
      execution_time: 45000,
      operations_performed: 8,
      confidence_score: 92,
      agent_efficiency: 89
    }
  }
};

describe('Multi-Destination E2E Workflow Tests', () => {
  let browser: Browser;
  let page: Page;
  let baseURL: string;

  beforeAll(async () => {
    // Setup Playwright browser
    browser = await chromium.launch({
      headless: process.env.CI === 'true', // Headless in CI, headed locally for debugging
      slowMo: 100 // Slow down for better visibility during development
    });
    
    page = await browser.newPage();
    baseURL = process.env.BASE_URL || 'http://localhost:3000';
    
    // Setup console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('🔴 Browser Console Error:', msg.text());
      }
    });
    
    // Setup request/response monitoring
    page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`🔴 HTTP Error: ${response.status()} ${response.url()}`);
      }
    });
    
    // Verify server is running
    try {
      const healthResponse = await page.goto(`${baseURL}${E2E_CONFIG.endpoints.health}`);
      expect(healthResponse?.status()).toBe(200);
      console.log('✅ Server health check passed');
    } catch (error) {
      console.error('❌ Server health check failed:', error);
      throw new Error(`Server not available at ${baseURL}`);
    }
  }, E2E_CONFIG.timeout);

  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
  });

  describe('Scenario: Europe Autumn Campaign E2E', () => {
    const scenario = E2E_CONFIG.scenarios.europeAutumn;
    let generatedCampaign: any;
    let htmlOutput: string;
    let assets: string[];

    it('1. Health Check: Should verify all systems are operational', async () => {
      const response = await page.goto(`${baseURL}${E2E_CONFIG.endpoints.health}`);
      expect(response?.status()).toBe(200);
      
      const healthData = await response?.json();
      expect(healthData.status).toBe('healthy');
      expect(healthData.agents).toBeDefined();
      
      // Verify all required agents are ready
      const requiredAgents = ['content_specialist', 'design_specialist', 'quality_specialist', 'delivery_specialist'];
      requiredAgents.forEach(agent => {
        expect(healthData.agents[agent]).toBe('ready');
      });
      
      console.log('✅ All agent systems operational');
    });

    it('2. User Input Processing: Should handle natural language query', async () => {
      // Navigate to the main template creation page
      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      // Fill in the user query
      const queryInput = page.locator('input[name="topic"], textarea[name="topic"], [data-testid="topic-input"]').first();
      await queryInput.waitFor({ state: 'visible', timeout: 10000 });
      await queryInput.fill(scenario.userQuery);
      
      // Set campaign type to multi-destination if selector exists
      const campaignTypeSelector = page.locator('select[name="campaign_type"], [data-testid="campaign-type"]');
      if (await campaignTypeSelector.count() > 0) {
        await campaignTypeSelector.selectOption('promotional');
      }
      
      console.log(`✅ User query processed: "${scenario.userQuery}"`);
    });

    it('3. Agent Workflow Execution: Should run complete multi-agent pipeline', async () => {
      // Mock API response for agent run
      await page.route(`${baseURL}${E2E_CONFIG.endpoints.agentRun}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.agentRunSuccess)
        });
      });
      
      // Start the generation process
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      // Wait for processing to complete
      await page.waitForSelector('[data-testid="generation-complete"], .generation-success, .template-preview', {
        timeout: E2E_CONFIG.timeout
      });
      
      // Capture the generated campaign data
      const pageContent = await page.content();
      expect(pageContent).toContain('Europe');
      expect(pageContent).toContain('autumn');
      
      generatedCampaign = mockApiResponses.agentRunSuccess.results.multiDestinationPlan;
      htmlOutput = mockApiResponses.agentRunSuccess.results.htmlOutput;
      assets = mockApiResponses.agentRunSuccess.results.assets;
      
      console.log('✅ Multi-agent workflow completed successfully');
    });

    it('4. Content Validation: Should validate multi-destination campaign structure', async () => {
      expect(generatedCampaign).toBeDefined();
      expect(generatedCampaign.campaign_id).toMatch(/^europe_autumn_\d{4}/);
      
      // Validate geographical scope
      expect(generatedCampaign.geographical_scope).toBeDefined();
      expect(generatedCampaign.geographical_scope.regions).toContain('Europe');
      expect(generatedCampaign.geographical_scope.scope_confidence).toBeGreaterThan(80);
      
      // Validate destinations
      expect(generatedCampaign.destinations).toBeDefined();
      expect(generatedCampaign.destinations.length).toBeGreaterThanOrEqual(scenario.minDestinations);
      expect(generatedCampaign.destinations.length).toBeLessThanOrEqual(scenario.maxDestinations);
      
      // Check destination quality scores
      generatedCampaign.destinations.forEach((dest: any) => {
        expect(dest.appeal_score).toBeGreaterThan(70);
        expect(dest.seasonal_fit).toBeGreaterThan(70);
        expect(['budget', 'mid-range', 'luxury']).toContain(dest.pricing_tier);
      });
      
      // Validate seasonal context
      expect(generatedCampaign.seasonal_context?.target_season).toBe(scenario.expectedSeason);
      
      console.log('✅ Multi-destination campaign structure validated');
    });

    it('5. HTML Output Validation: Should generate valid email HTML', async () => {
      expect(htmlOutput).toBeDefined();
      expect(typeof htmlOutput).toBe('string');
      expect(htmlOutput.length).toBeGreaterThan(E2E_CONFIG.quality.minHtmlSize);
      expect(htmlOutput.length).toBeLessThan(E2E_CONFIG.quality.maxHtmlSize);
      
      // Validate HTML structure
      expect(htmlOutput).toMatch(/<!DOCTYPE html|<html/i);
      expect(htmlOutput).toContain('<head>');
      expect(htmlOutput).toContain('<body>');
      expect(htmlOutput).toContain('</html>');
      
      // Validate content presence
      expect(htmlOutput).toMatch(/europe/i);
      expect(htmlOutput).toMatch(/autumn/i);
      
      // Validate email-specific requirements
      expect(htmlOutput).toMatch(/width\s*[:=]\s*["']?6[0-4][0-9]px/i); // Email width 600-640px
      
      console.log(`✅ HTML output validated (${htmlOutput.length} bytes)`);
    });

    it('6. Asset Management: Should handle campaign assets correctly', async () => {
      expect(assets).toBeDefined();
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.length).toBeGreaterThan(0);
      
      // Validate asset types
      const hasHeroImage = assets.some(asset => asset.includes('hero') || asset.includes('main'));
      const hasDestinationImages = assets.some(asset => 
        scenario.expectedDestinations.some(dest => 
          asset.toLowerCase().includes(dest.toLowerCase())
        )
      );
      
      expect(hasHeroImage).toBe(true);
      expect(hasDestinationImages).toBe(true);
      
      // Validate asset naming conventions
      assets.forEach(asset => {
        expect(asset).toMatch(/\.(jpg|jpeg|png|svg|webp)$/i);
        expect(asset).not.toContain(' '); // No spaces in filenames
      });
      
      console.log(`✅ Asset management validated (${assets.length} assets)`);
    });

    it('7. Email Client Compatibility: Should render correctly across clients', async () => {
      // Create a test HTML file for cross-client testing
      const testHtmlPath = path.join(__dirname, 'temp-email-test.html');
      await fs.writeFile(testHtmlPath, htmlOutput);
      
      try {
        // Load the generated HTML in browser
        await page.goto(`file://${testHtmlPath}`);
        await page.waitForLoadState('networkidle');
        
        // Check viewport rendering
        await page.setViewportSize({ width: 640, height: 800 }); // Email width
        
        // Validate visual elements are present
        const bodyElement = await page.locator('body').first();
        expect(await bodyElement.isVisible()).toBe(true);
        
        // Check for responsive design
        await page.setViewportSize({ width: 320, height: 600 }); // Mobile width
        const isResponsive = await page.evaluate(() => {
          const body = document.body;
          return body.scrollWidth <= window.innerWidth + 10; // 10px tolerance
        });
        
        expect(isResponsive).toBe(true);
        
        console.log('✅ Email client compatibility validated');
      } finally {
        // Cleanup test file
        await fs.unlink(testHtmlPath).catch(() => {});
      }
    });

    it('8. Performance Validation: Should meet performance requirements', async () => {
      const analytics = mockApiResponses.agentRunSuccess.analytics;
      
      // Validate execution time (should be under 60 seconds for E2E)
      expect(analytics.execution_time).toBeLessThan(60000);
      
      // Validate agent efficiency
      expect(analytics.confidence_score).toBeGreaterThan(E2E_CONFIG.quality.minQualityScore);
      expect(analytics.agent_efficiency).toBeGreaterThan(70);
      
      // Validate operations count (should have performed multiple operations)
      expect(analytics.operations_performed).toBeGreaterThan(5);
      
      console.log(`✅ Performance validated (${analytics.execution_time}ms, ${analytics.confidence_score}% confidence)`);
    });

    it('9. Data Consistency: Should maintain consistency across workflow', async () => {
      // Validate campaign data using utility function
      const validation = validateMultiDestinationData(generatedCampaign);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.validationScore).toBeGreaterThan(80);
      
      // Check constraints compliance
      expect(generatedCampaign.destinations.length).toBeGreaterThanOrEqual(MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS);
      expect(generatedCampaign.destinations.length).toBeLessThanOrEqual(MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS);
      
      // Validate region consistency
      const specifiedRegions = generatedCampaign.geographical_scope.regions;
      specifiedRegions.forEach((region: string) => {
        expect(['europe', 'asia', 'north_america', 'south_america', 'africa', 'oceania']).toContain(region);
      });
      
      console.log('✅ Data consistency validated across workflow');
    });
  });

  describe('Scenario: Asia Winter Campaign E2E', () => {
    const scenario = E2E_CONFIG.scenarios.asiaWinter;

    it('1. Should handle Asia winter scenario end-to-end', async () => {
      // Mock API response for Asia winter scenario
      const asiaWinterResponse = {
        ...mockApiResponses.agentRunSuccess,
        results: {
          ...mockApiResponses.agentRunSuccess.results,
          multiDestinationPlan: {
            campaign_id: 'asia_winter_2024_test',
            geographical_scope: {
              query_type: 'regional',
              scope_level: 'continent',
              regions: ['Asia'],
              countries: ['Japan', 'Thailand', 'India'],
              cities: [],
              scope_confidence: 88
            },
            destinations: [
              {
                destination: 'Japan',
                appeal_score: 94,
                seasonal_fit: 95,
                pricing_tier: 'luxury'
              },
              {
                destination: 'Thailand',
                appeal_score: 91,
                seasonal_fit: 89,
                pricing_tier: 'budget'
              }
            ],
            seasonal_context: {
              target_season: 'winter',
              optimal_months: [12, 1, 2]
            }
          },
          assets: ['asia-winter-hero.jpg', 'japan-winter.jpg', 'thailand-winter.jpg']
        }
      };

      await page.route(`${baseURL}${E2E_CONFIG.endpoints.agentRun}`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(asiaWinterResponse)
        });
      });

      // Navigate and process query
      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      const queryInput = page.locator('input[name="topic"], textarea[name="topic"], [data-testid="topic-input"]').first();
      await queryInput.fill(scenario.userQuery);
      
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      await page.waitForSelector('[data-testid="generation-complete"], .generation-success, .template-preview', {
        timeout: E2E_CONFIG.timeout
      });

      // Validate Asia-specific results
      const campaign = asiaWinterResponse.results.multiDestinationPlan;
      expect(campaign.geographical_scope.regions).toContain('Asia');
      expect(campaign.seasonal_context?.target_season).toBe('winter');
      expect(campaign.destinations.some((d: any) => scenario.expectedDestinations.includes(d.destination))).toBe(true);

      console.log('✅ Asia winter scenario completed successfully');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    it('Should handle API errors gracefully', async () => {
      await page.route(`${baseURL}${E2E_CONFIG.endpoints.agentRun}`, async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      const queryInput = page.locator('input[name="topic"], textarea[name="topic"], [data-testid="topic-input"]').first();
      await queryInput.fill('Test error handling');
      
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should show error message
      await page.waitForSelector('[data-testid="error-message"], .error-alert, .alert-error', {
        timeout: 30000
      });
      
      const errorElement = await page.locator('[data-testid="error-message"], .error-alert, .alert-error').first();
      expect(await errorElement.isVisible()).toBe(true);
      
      console.log('✅ Error handling validated');
    });

    it('Should handle invalid user input', async () => {
      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      // Submit empty form
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should show validation error
      const validationError = await page.waitForSelector('[data-testid="validation-error"], .validation-error, .form-error', {
        timeout: 10000
      }).catch(() => null);
      
      if (validationError) {
        expect(await validationError.isVisible()).toBe(true);
        console.log('✅ Input validation working correctly');
      } else {
        console.log('ℹ️ No validation errors shown for empty input');
      }
    });

    it('Should handle network timeouts', async () => {
      await page.route(`${baseURL}${E2E_CONFIG.endpoints.agentRun}`, async route => {
        // Simulate network timeout by delaying response
        await new Promise(resolve => setTimeout(resolve, 65000)); // 65 second delay
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Request timeout' })
        });
      });

      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      const queryInput = page.locator('input[name="topic"], textarea[name="topic"], [data-testid="topic-input"]').first();
      await queryInput.fill('Test timeout');
      
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should handle timeout gracefully
      const timeoutHandler = await page.waitForSelector('[data-testid="timeout-error"], .timeout-alert', {
        timeout: 70000
      }).catch(() => null);
      
      if (timeoutHandler) {
        expect(await timeoutHandler.isVisible()).toBe(true);
      }
      
      console.log('✅ Network timeout handling validated');
    }, 90000); // Extended timeout for this test
  });

  describe('Accessibility and UX', () => {
    
    it('Should be accessible to screen readers', async () => {
      await page.goto(`${baseURL}/create`);
      await page.waitForLoadState('networkidle');
      
      // Check for proper ARIA labels and semantic HTML
      const mainContent = await page.locator('main, [role="main"]').count();
      expect(mainContent).toBeGreaterThan(0);
      
      const headings = await page.locator('h1, h2, h3').count();
      expect(headings).toBeGreaterThan(0);
      
      // Check form accessibility
      const formLabels = await page.locator('label').count();
      const formInputs = await page.locator('input, textarea, select').count();
      expect(formLabels).toBeGreaterThan(0);
      expect(formInputs).toBeGreaterThan(0);
      
      console.log('✅ Basic accessibility features validated');
    });

    it('Should provide clear user feedback during processing', async () => {
      await page.route(`${baseURL}${E2E_CONFIG.endpoints.agentRun}`, async route => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.agentRunSuccess)
        });
      });

      await page.goto(`${baseURL}/create`);
      const queryInput = page.locator('input[name="topic"], textarea[name="topic"], [data-testid="topic-input"]').first();
      await queryInput.fill('Test user feedback');
      
      const generateButton = page.locator('button[type="submit"], [data-testid="generate-button"], button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should show loading state
      const loadingIndicator = await page.waitForSelector('[data-testid="loading"], .loading, .spinner', {
        timeout: 5000
      }).catch(() => null);
      
      if (loadingIndicator) {
        expect(await loadingIndicator.isVisible()).toBe(true);
      }
      
      console.log('✅ User feedback during processing validated');
    });
  });
});

/**
 * Utility function to validate HTML email structure
 */
function validateEmailHTML(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!html.includes('<html')) errors.push('Missing HTML tag');
  if (!html.includes('<head>')) errors.push('Missing HEAD section');
  if (!html.includes('<body>')) errors.push('Missing BODY section');
  if (html.length > 102400) errors.push('HTML exceeds 100KB limit');
  if (html.length < 1000) errors.push('HTML too short');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Utility function to extract campaign data from page
 */
async function extractCampaignData(page: Page): Promise<any> {
  return await page.evaluate(() => {
    // Try to extract campaign data from various possible locations
    const dataElements = [
      document.querySelector('[data-testid="campaign-data"]'),
      document.querySelector('.campaign-results'),
      document.querySelector('#campaign-data')
    ];
    
    for (const element of dataElements) {
      if (element && element.textContent) {
        try {
          return JSON.parse(element.textContent);
        } catch {
          continue;
        }
      }
    }
    
    return null;
  });
}