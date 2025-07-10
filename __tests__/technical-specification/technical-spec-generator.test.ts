/**
 * 📋 TECHNICAL SPECIFICATION GENERATOR - Integration Tests
 * 
 * Tests for the technical specification generation system to ensure:
 * - Proper schema validation
 * - Correct tool execution patterns
 * - OpenAI Agents SDK compatibility
 * - Context parameter handling
 * - Error handling and validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  generateTechnicalSpecification, 
  validateTechnicalSpecification,
  technicalSpecificationTools,
  type TechnicalSpecificationResult,
  type SpecificationValidationResult
} from '../../src/agent/tools/technical-specification';

describe('Technical Specification Generator', () => {
  let testCampaignPath: string;
  let testCampaignId: string;
  let mockContentContext: any;
  let mockAssetManifest: any;
  
  beforeEach(async () => {
    // Setup test campaign directory
    testCampaignId = `test_campaign_${Date.now()}`;
    testCampaignPath = path.join(__dirname, '../../campaigns', testCampaignId);
    
    // Create test directory structure
    await fs.mkdir(testCampaignPath, { recursive: true });
    await fs.mkdir(path.join(testCampaignPath, 'docs'), { recursive: true });
    await fs.mkdir(path.join(testCampaignPath, 'assets'), { recursive: true });
    
    // Mock content context
    mockContentContext = {
      generated_content: {
        subject: 'Amazing Travel Deal to Thailand',
        preheader: 'Save up to 40% on tropical paradise getaways',
        headline: 'Discover Paradise in Thailand',
        sections: [
          {
            type: 'hero',
            content: 'Experience the breathtaking beaches and vibrant culture of Thailand'
          },
          {
            type: 'product',
            content: 'Our exclusive travel packages include flights, accommodation, and guided tours'
          },
          {
            type: 'cta',
            content: 'Book your dream vacation today and create memories that last a lifetime'
          }
        ]
      },
      pricing_analysis: {
        best_price: 45000,
        currency: 'RUB',
        discount_percentage: 35,
        products: [
          {
            name: 'Thailand Paradise Package',
            price: 45000,
            originalPrice: 69000,
            description: '7 days in Phuket with beach resort accommodation'
          }
        ]
      },
      context_analysis: {
        brand_voice: 'adventurous',
        target_audience: 'young professionals',
        campaign_theme: 'tropical paradise',
        urgency_level: 'medium'
      },
      asset_strategy: {
        visual_style: 'tropical paradise with vibrant colors',
        primary_assets: ['hero-beach-image', 'product-showcase', 'brand-logo'],
        color_palette: ['#FF6B35', '#004E89', '#00A896']
      }
    };
    
    // Mock asset manifest
    mockAssetManifest = {
      images: [
        {
          id: 'hero-beach-thailand',
          path: 'assets/optimized/hero-beach-thailand.jpg',
          alt_text: 'Beautiful Thailand beach with palm trees',
          usage: 'hero-section',
          dimensions: { width: 600, height: 300 },
          file_size: 85000,
          format: 'jpg',
          optimized: true
        },
        {
          id: 'brand-logo',
          path: 'assets/optimized/brand-logo.png',
          alt_text: 'Company logo',
          usage: 'header',
          dimensions: { width: 120, height: 60 },
          file_size: 15000,
          format: 'png',
          optimized: true
        }
      ],
      icons: [
        {
          id: 'plane-icon',
          path: 'assets/optimized/plane-icon.svg',
          usage: 'transportation',
          format: 'svg',
          size: 24
        }
      ],
      fonts: [
        {
          family: 'Inter',
          weights: ['400', '600', '700'],
          fallbacks: ['Arial', 'sans-serif'],
          usage: 'primary'
        }
      ]
    };
  });
  
  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testCampaignPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('generateTechnicalSpecification tool', () => {
    it('should generate technical specification with valid content context', async () => {
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        assetManifest: mockAssetManifest,
        emailClients: ['gmail', 'outlook', 'apple-mail'],
        context: { test: true },
        trace_id: 'test-trace-123'
      });
      
      expect(result.success).toBe(true);
      expect(result.specificationId).toBeDefined();
      expect(result.specification).toBeDefined();
      expect(result.specification.version).toBeDefined();
      expect(result.specification.campaign).toBeDefined();
      expect(result.specification.campaign.id).toBe(testCampaignId);
      expect(result.specification.content).toBeDefined();
      expect(result.specification.design).toBeDefined();
      expect(result.specification.quality).toBeDefined();
      expect(result.specification.emailClients).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle missing asset manifest gracefully', async () => {
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        emailClients: ['gmail', 'outlook'],
        context: { test: true },
        trace_id: 'test-trace-124'
      });
      
      expect(result.success).toBe(true);
      expect(result.specification.design.assets).toBeDefined();
      expect(result.specification.design.assets.manifest.fonts).toBeDefined();
      // Should have default fonts even without asset manifest
      expect(result.specification.design.assets.manifest.fonts.length).toBeGreaterThan(0);
    });

    it('should generate email client constraints for all target clients', async () => {
      const targetClients = ['gmail', 'outlook', 'apple-mail', 'yahoo-mail'];
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        assetManifest: mockAssetManifest,
        emailClients: targetClients,
        context: { test: true },
        trace_id: 'test-trace-125'
      });
      
      expect(result.success).toBe(true);
      expect(result.specification.emailClients).toBeDefined();
      expect(result.specification.emailClients.length).toBeGreaterThan(0);
      
      // Check that all target clients are covered
      const clientNames = result.specification.emailClients.map((client: any) => client.client);
      targetClients.forEach(client => {
        expect(clientNames).toContain(client);
      });
    });

    it('should save specification files to campaign directory', async () => {
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        assetManifest: mockAssetManifest,
        emailClients: ['gmail', 'outlook'],
        context: { test: true },
        trace_id: 'test-trace-126'
      });
      
      expect(result.success).toBe(true);
      
      // Check that files were created
      const specDir = path.join(testCampaignPath, 'docs', 'specifications');
      const specFile = path.join(specDir, 'technical-specification.json');
      const guideFile = path.join(specDir, 'implementation-guide.md');
      const reportFile = path.join(specDir, 'validation-report.json');
      
      expect(await fs.access(specFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(guideFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.access(reportFile).then(() => true).catch(() => false)).toBe(true);
    });

    it('should handle invalid content context gracefully', async () => {
      const invalidContext = {
        // Missing required fields
        incomplete: true
      };
      
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: invalidContext,
        emailClients: ['gmail'],
        context: { test: true },
        trace_id: 'test-trace-127'
      });
      
      expect(result.success).toBe(true);
      expect(result.specification).toBeDefined();
      // Should still generate a basic specification even with incomplete context
      expect(result.specification.campaign.id).toBe(testCampaignId);
    });
  });

  describe('validateTechnicalSpecification tool', () => {
    let validSpecificationPath: string;
    let validSpecification: any;
    
    beforeEach(async () => {
      // Generate a valid specification first
      const genResult = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        assetManifest: mockAssetManifest,
        emailClients: ['gmail', 'outlook'],
        context: { test: true },
        trace_id: 'test-setup'
      });
      
      validSpecificationPath = path.join(testCampaignPath, 'docs', 'specifications', 'technical-specification.json');
      validSpecification = genResult.specification;
    });

    it('should validate a correct technical specification', async () => {
      const result = await validateTechnicalSpecification.execute({
        specificationPath: validSpecificationPath,
        validationLevel: 'strict',
        context: { test: true },
        trace_id: 'test-validation-1'
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.errors).toBeDefined();
      expect(result.validation.warnings).toBeDefined();
      expect(result.validation.score).toBeDefined();
      expect(result.validation.score.overall).toBeGreaterThan(0);
    });

    it('should detect specification with missing required fields', async () => {
      // Create invalid specification
      const invalidSpec = {
        version: '1.0',
        // Missing required fields
        campaign: {
          id: testCampaignId
          // Missing other required fields
        }
      };
      
      const invalidPath = path.join(testCampaignPath, 'docs', 'specifications', 'invalid-spec.json');
      await fs.writeFile(invalidPath, JSON.stringify(invalidSpec, null, 2));
      
      const result = await validateTechnicalSpecification.execute({
        specificationPath: invalidPath,
        validationLevel: 'strict',
        context: { test: true },
        trace_id: 'test-validation-2'
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });

    it('should calculate quality scores correctly', async () => {
      const result = await validateTechnicalSpecification.execute({
        specificationPath: validSpecificationPath,
        validationLevel: 'standard',
        context: { test: true },
        trace_id: 'test-validation-3'
      });
      
      expect(result.success).toBe(true);
      expect(result.validation.score).toBeDefined();
      expect(result.validation.score.completeness).toBeGreaterThanOrEqual(0);
      expect(result.validation.score.completeness).toBeLessThanOrEqual(100);
      expect(result.validation.score.consistency).toBeGreaterThanOrEqual(0);
      expect(result.validation.score.consistency).toBeLessThanOrEqual(100);
      expect(result.validation.score.feasibility).toBeGreaterThanOrEqual(0);
      expect(result.validation.score.feasibility).toBeLessThanOrEqual(100);
      expect(result.validation.score.overall).toBeGreaterThanOrEqual(0);
      expect(result.validation.score.overall).toBeLessThanOrEqual(100);
    });

    it('should handle non-existent specification file', async () => {
      const nonExistentPath = path.join(testCampaignPath, 'docs', 'specifications', 'missing-spec.json');
      
      await expect(validateTechnicalSpecification.execute({
        specificationPath: nonExistentPath,
        validationLevel: 'strict',
        context: { test: true },
        trace_id: 'test-validation-4'
      })).rejects.toThrow();
    });
  });

  describe('Tool Configuration', () => {
    it('should export correct tool array', () => {
      expect(technicalSpecificationTools).toBeDefined();
      expect(Array.isArray(technicalSpecificationTools)).toBe(true);
      expect(technicalSpecificationTools.length).toBe(2);
      
      const toolNames = technicalSpecificationTools.map(tool => tool.name);
      expect(toolNames).toContain('generateTechnicalSpecification');
      expect(toolNames).toContain('validateTechnicalSpecification');
    });

    it('should have proper OpenAI Agents SDK tool structure', () => {
      technicalSpecificationTools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.parameters).toBeDefined();
        expect(tool.execute).toBeDefined();
        expect(typeof tool.execute).toBe('function');
      });
    });
  });

  describe('Integration with OpenAI Agents SDK Context', () => {
    it('should handle context parameter correctly', async () => {
      const contextData = {
        workflow_state: 'content_to_design',
        previous_outputs: ['content_analysis', 'asset_preparation'],
        campaign_metadata: {
          priority: 'high',
          deadline: '2024-01-15'
        }
      };
      
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        assetManifest: mockAssetManifest,
        emailClients: ['gmail', 'outlook'],
        context: contextData,
        trace_id: 'test-context-1'
      });
      
      expect(result.success).toBe(true);
      expect(result.specification).toBeDefined();
      // Context should be preserved in the specification
      expect(result.specification.metadata).toBeDefined();
    });

    it('should handle trace_id for monitoring', async () => {
      const traceId = 'test-trace-monitoring-123';
      
      const result = await generateTechnicalSpecification.execute({
        campaignId: testCampaignId,
        campaignPath: testCampaignPath,
        contentContext: mockContentContext,
        emailClients: ['gmail'],
        context: { test: true },
        trace_id: traceId
      });
      
      expect(result.success).toBe(true);
      // Trace ID should be handled without errors
      expect(result.specificationId).toBeDefined();
    });
  });
});