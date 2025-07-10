/**
 * 🧪 DESIGN SPECIALIST ENHANCED PHASE 5 INTEGRATION TEST
 * 
 * Test suite for Design Specialist Phase 5.1-5.3 enhancements:
 * - Context-aware processing
 * - Real asset path integration
 * - Comprehensive design package output
 * 
 * Tests OpenAI Agents SDK compatibility and real workflow integration.
 */

import { jest } from '@jest/globals';
import { 
  designSpecialistTools,
  readTechnicalSpecification,
  processContentAssets,
  generateMjmlTemplate,
  generateComprehensiveDesignPackage
} from '../../src/agent/specialists/design-specialist-tools';
import * as fs from 'fs';
import * as path from 'path';

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn()
  }
}));

const mockFs = fs.promises as jest.Mocked<typeof fs.promises>;

describe('Design Specialist Enhanced Phase 5 Integration Tests', () => {
  let mockCampaignPath: string;
  let mockContentContext: any;
  let mockTechnicalSpecification: any;
  let mockAssetManifest: any;
  let mockContext: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock data
    mockCampaignPath = '/test/campaigns/campaign_123';
    mockContentContext = {
      campaign: {
        id: 'campaign_123',
        campaignPath: mockCampaignPath
      },
      generated_content: {
        subject: 'Amazing Travel Deal',
        body: 'Discover incredible destinations',
        preheader: 'Limited time offer',
        cta: { primary: 'Book Now' },
        footer: 'Thank you for choosing us'
      },
      context_analysis: {
        destination: 'Paris'
      },
      pricing_analysis: {
        best_price: 599,
        currency: 'USD'
      },
      date_analysis: {
        optimal_dates: ['2024-06-15', '2024-06-20']
      },
      asset_strategy: {
        visual_style: 'Modern minimalist'
      }
    };

    mockTechnicalSpecification = {
      campaign: { id: 'campaign_123', name: 'Test Campaign' },
      design: {
        constraints: {
          layout: { type: 'single-column', maxWidth: 600, minWidth: 320 },
          colorScheme: {
            primary: '#3498db',
            secondary: '#2c3e50',
            text: { primary: '#333333', secondary: '#666666' },
            background: { primary: '#ffffff', secondary: '#f8f9fa' }
          },
          typography: {
            headingFont: { family: 'Arial, sans-serif', sizes: { h1: 28, h2: 24 } },
            bodyFont: { family: 'Arial, sans-serif', size: 16, lineHeight: 1.5 }
          }
        },
        assets: {
          manifest: { images: [], icons: [], fonts: [] },
          requirements: []
        }
      },
      quality: {
        criteria: {
          performance: { maxFileSize: 100000 },
          accessibility: { wcagLevel: 'AA', contrastRatio: 4.5 },
          emailDeliverability: { textToHtmlRatio: 0.3 }
        }
      },
      delivery: {
        emailClients: [
          { client: 'gmail', maxWidth: 600, supportsWebP: true, supportsSVG: false },
          { client: 'outlook', maxWidth: 600, supportsWebP: false, supportsSVG: false },
          { client: 'apple-mail', maxWidth: 600, supportsWebP: true, supportsSVG: true }
        ]
      }
    };

    mockAssetManifest = {
      images: [
        {
          id: 'hero-image',
          path: `${mockCampaignPath}/assets/optimized/hero-image.webp`,
          url: `${mockCampaignPath}/assets/optimized/hero-image.webp`,
          alt_text: 'Paris travel destination',
          usage: 'hero',
          dimensions: { width: 600, height: 360 },
          file_size: 45000,
          format: 'webp',
          optimized: true,
          email_client_support: {
            gmail: true,
            outlook: false,
            apple_mail: true
          },
          accessibility: {
            alt_text_provided: true,
            descriptive: true,
            wcag_compliant: true
          },
          performance: {
            load_time_estimate: 45,
            optimization_score: 85
          }
        }
      ],
      icons: [
        {
          id: 'calendar-icon',
          path: `${mockCampaignPath}/assets/optimized/calendar-icon.png`,
          url: `${mockCampaignPath}/assets/optimized/calendar-icon.png`,
          alt_text: 'Calendar date indicator',
          usage: 'date-indicator',
          dimensions: { width: 24, height: 24 },
          file_size: 2000,
          format: 'png',
          optimized: true,
          email_client_support: {
            gmail: true,
            outlook: true,
            apple_mail: true
          }
        }
      ],
      fonts: [
        {
          id: 'primary-font',
          family: 'Arial, sans-serif',
          weights: ['400', '600', '700'],
          fallbacks: ['Helvetica', 'sans-serif'],
          usage: 'primary-text',
          email_client_support: {
            gmail: true,
            outlook: true,
            apple_mail: true
          }
        }
      ]
    };

    mockContext = {
      designContext: {
        technical_specification: mockTechnicalSpecification,
        asset_manifest: mockAssetManifest
      }
    };
  });

  describe('Phase 5.1: Context-Aware Processing', () => {
    it('should validate all tools follow OpenAI Agents SDK patterns', () => {
      designSpecialistTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('execute');
        expect(typeof tool.execute).toBe('function');
      });
    });

    it('should read technical specification and update context', async () => {
      // Mock successful file read
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        specification: mockTechnicalSpecification
      }));

      const result = await readTechnicalSpecification.execute({
        campaignPath: mockCampaignPath,
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Technical specification loaded successfully');
      expect(result).toContain('single-column');
      expect(result).toContain('600px');
      expect(result).toContain('3 supported');
      expect(mockContext.designContext.technical_specification).toBeDefined();
    });

    it('should handle missing technical specification with defaults', async () => {
      // Mock file read failure
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await readTechnicalSpecification.execute({
        campaignPath: mockCampaignPath,
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Technical specification loaded successfully');
      expect(result).toContain('default');
      expect(mockContext.designContext.technical_specification).toBeDefined();
    });
  });

  describe('Phase 5.2: Real Asset Path Integration', () => {
    it('should process content assets with real paths from asset manifest', async () => {
      // Mock asset manifest file read
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        result: { assetManifest: mockAssetManifest }
      }));

      const result = await processContentAssets.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        optimization_level: 'high',
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Asset processing completed with real asset paths');
      expect(result).toContain('Total assets:');
      expect(result).toContain('Images:');
      expect(result).toContain('Icons:');
      expect(result).toContain('/assets/optimized');
      expect(mockContext.designContext.asset_manifest).toBeDefined();
    });

    it('should create minimal asset manifest when file not found', async () => {
      // Mock file read failure
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await processContentAssets.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        optimization_level: 'high',
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Asset processing completed with real asset paths');
      expect(result).toContain('Total assets:');
      expect(result).toContain('Paris');
      expect(result).toContain('599 USD');
      expect(mockContext.designContext.asset_manifest).toBeDefined();
    });

    it('should generate MJML template with real asset paths', async () => {
      const contextWithAssets = {
        designContext: {
          technical_specification: mockTechnicalSpecification,
          asset_manifest: mockAssetManifest
        }
      };

      const result = await generateMjmlTemplate.execute({
        content_context: mockContentContext,
        asset_manifest: mockAssetManifest,
        technical_specification: mockTechnicalSpecification,
        trace_id: 'test-trace-123'
      }, contextWithAssets);

      expect(result).toContain('MJML template generated successfully with real asset paths');
      expect(result).toContain('Layout: single-column');
      expect(result).toContain('600px max width');
      expect(result).toContain('Assets used:');
      expect(result).toContain('Total asset size:');
      expect(contextWithAssets.designContext.mjml_template).toBeDefined();
      expect(contextWithAssets.designContext.mjml_template.assets_used).toBeDefined();
      expect(contextWithAssets.designContext.mjml_template.technical_compliance.real_asset_paths).toBe(true);
    });

    it('should validate email client compatibility for assets', async () => {
      const contextWithAssets = {
        designContext: {
          technical_specification: mockTechnicalSpecification,
          asset_manifest: mockAssetManifest
        }
      };

      const result = await generateMjmlTemplate.execute({
        content_context: mockContentContext,
        asset_manifest: mockAssetManifest,
        technical_specification: mockTechnicalSpecification,
        trace_id: 'test-trace-123'
      }, contextWithAssets);

      expect(result).toContain('Email client compatibility: 3 clients supported');
      
      const mjmlTemplate = contextWithAssets.designContext.mjml_template;
      expect(mjmlTemplate.source).toContain('hero-image.webp');
      expect(mjmlTemplate.source).toContain('calendar-icon.png');
      expect(mjmlTemplate.source).toContain('Paris travel destination');
    });
  });

  describe('Phase 5.3: Comprehensive Design Package Output', () => {
    it('should generate comprehensive design package with all components', async () => {
      const mockMjmlTemplate = {
        source: '<mjml><mj-body>Test template</mj-body></mjml>',
        file_size: 2500,
        assets_used: {
          hero_image: { path: '/test/hero.webp', size: 45000 },
          calendar_icon: { path: '/test/calendar.png', size: 2000 }
        },
        technical_compliance: {
          max_width_respected: true,
          color_scheme_applied: true,
          typography_followed: true,
          email_client_optimized: true,
          real_asset_paths: true
        },
        specifications_used: {
          layout: 'single-column',
          max_width: 600,
          color_scheme: 4,
          typography: 'Arial, sans-serif / Arial, sans-serif',
          email_clients: 3
        }
      };

      const mockDesignDecisions = {
        layout_strategy: 'Modern minimalist layout',
        color_scheme_applied: mockTechnicalSpecification.design.constraints.colorScheme,
        accessibility_features: [
          'Alt text for all images',
          'Proper heading hierarchy',
          'High contrast colors',
          'Keyboard navigation support'
        ]
      };

      const mockPreviewFiles = [
        { type: 'desktop', format: 'png' },
        { type: 'mobile', format: 'png' },
        { type: 'dark_mode', format: 'png' }
      ];

      const mockPerformanceMetrics = {
        optimization_score: 87,
        html_size: 2500,
        total_assets_size: 47000,
        estimated_load_time: 850
      };

      // Mock directory creation
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await generateComprehensiveDesignPackage.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        asset_manifest: mockAssetManifest,
        mjml_template: mockMjmlTemplate,
        design_decisions: mockDesignDecisions,
        preview_files: mockPreviewFiles,
        performance_metrics: mockPerformanceMetrics,
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Comprehensive design package generated successfully');
      expect(result).toContain('Package ID:');
      expect(result).toContain('Template: 2.44 KB MJML');
      expect(result).toContain('Assets: 2 optimized');
      expect(result).toContain('Previews: 3 generated');
      expect(result).toContain('Performance score: 87/100');
      expect(result).toContain('Package ready for Quality Specialist');

      // Verify directory creation calls
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('design-package'),
        { recursive: true }
      );

      // Verify file writing calls
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('email-template.mjml'),
        mockMjmlTemplate.source
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('asset-manifest.json'),
        expect.stringContaining('"package_info"')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('package-metadata.json'),
        expect.any(String)
      );
    });

    it('should calculate quality indicators correctly', async () => {
      const mockMjmlTemplate = {
        source: '<mjml><mj-body>Test template</mj-body></mjml>',
        file_size: 2500,
        technical_compliance: {
          max_width_respected: true,
          color_scheme_applied: true,
          typography_followed: true,
          email_client_optimized: true,
          real_asset_paths: true
        }
      };

      const mockDesignDecisions = {
        accessibility_features: [
          'Alt text for all images',
          'Proper heading hierarchy',
          'High contrast colors',
          'Keyboard navigation support'
        ]
      };

      const mockPreviewFiles = [
        { type: 'desktop', format: 'png' },
        { type: 'mobile', format: 'png' }
      ];

      const mockPerformanceMetrics = {
        optimization_score: 90
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await generateComprehensiveDesignPackage.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        asset_manifest: mockAssetManifest,
        mjml_template: mockMjmlTemplate,
        design_decisions: mockDesignDecisions,
        preview_files: mockPreviewFiles,
        performance_metrics: mockPerformanceMetrics,
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Technical compliance: 100%');
      expect(result).toContain('Email client compatibility:');
      expect(result).toContain('Performance score: 90/100');

      // Verify context update
      expect(mockContext.designContext.design_package).toBeDefined();
      expect(mockContext.designContext.design_package.quality_indicators).toBeDefined();
      expect(mockContext.designContext.design_package.quality_indicators.technical_compliance).toBe(100);
    });

    it('should generate asset usage instructions', async () => {
      const mockMjmlTemplate = {
        source: '<mjml><mj-body>Test template</mj-body></mjml>',
        file_size: 2500,
        technical_compliance: {
          real_asset_paths: true
        }
      };

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generateComprehensiveDesignPackage.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        asset_manifest: mockAssetManifest,
        mjml_template: mockMjmlTemplate,
        design_decisions: {},
        preview_files: [],
        performance_metrics: { optimization_score: 85 },
        trace_id: 'test-trace-123'
      }, mockContext);

      // Verify asset manifest enhancement call
      const assetManifestCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('asset-manifest.json')
      );
      expect(assetManifestCall).toBeDefined();
      
      const assetManifestContent = JSON.parse(assetManifestCall[1] as string);
      expect(assetManifestContent.usage_instructions).toBeDefined();
      expect(Array.isArray(assetManifestContent.usage_instructions)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing technical specification gracefully', async () => {
      const result = await processContentAssets.execute({
        content_context: mockContentContext,
        technical_specification: null,
        optimization_level: 'high',
        trace_id: 'test-trace-123'
      }, { designContext: {} });

      expect(result).toContain('Technical specification required');
    });

    it('should handle missing asset manifest gracefully', async () => {
      const result = await generateMjmlTemplate.execute({
        content_context: mockContentContext,
        asset_manifest: null,
        technical_specification: mockTechnicalSpecification,
        trace_id: 'test-trace-123'
      }, { designContext: { technical_specification: mockTechnicalSpecification } });

      expect(result).toContain('Asset manifest required');
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(generateComprehensiveDesignPackage.execute({
        content_context: mockContentContext,
        technical_specification: mockTechnicalSpecification,
        asset_manifest: mockAssetManifest,
        mjml_template: { source: 'test', file_size: 100 },
        design_decisions: {},
        preview_files: [],
        performance_metrics: { optimization_score: 85 },
        trace_id: 'test-trace-123'
      }, mockContext)).rejects.toThrow('Permission denied');
    });
  });

  describe('OpenAI Agents SDK Compatibility', () => {
    it('should validate tool parameter schemas', () => {
      designSpecialistTools.forEach(tool => {
        expect(tool.parameters).toBeDefined();
        expect(typeof tool.parameters).toBe('object');
        
        // Check for required fields
        if (tool.name === 'readTechnicalSpecification') {
          expect(tool.parameters.shape.campaignPath).toBeDefined();
          expect(tool.parameters.shape.trace_id).toBeDefined();
        }
        
        if (tool.name === 'processContentAssets') {
          expect(tool.parameters.shape.content_context).toBeDefined();
          expect(tool.parameters.shape.technical_specification).toBeDefined();
        }
      });
    });

    it('should support context parameter in all tools', () => {
      designSpecialistTools.forEach(tool => {
        expect(tool.execute.length).toBe(2); // params, context
      });
    });

    it('should update context properly across tool chain', async () => {
      const testContext = { designContext: {} };

      // Step 1: Read technical specification
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        specification: mockTechnicalSpecification
      }));

      await readTechnicalSpecification.execute({
        campaignPath: mockCampaignPath,
        trace_id: 'test-trace-123'
      }, testContext);

      expect(testContext.designContext.technical_specification).toBeDefined();

      // Step 2: Process assets
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        result: { assetManifest: mockAssetManifest }
      }));

      await processContentAssets.execute({
        content_context: mockContentContext,
        technical_specification: null, // Should use from context
        optimization_level: 'high',
        trace_id: 'test-trace-123'
      }, testContext);

      expect(testContext.designContext.asset_manifest).toBeDefined();

      // Step 3: Generate MJML template
      await generateMjmlTemplate.execute({
        content_context: mockContentContext,
        asset_manifest: null, // Should use from context
        technical_specification: null, // Should use from context
        trace_id: 'test-trace-123'
      }, testContext);

      expect(testContext.designContext.mjml_template).toBeDefined();
      expect(testContext.designContext.mjml_template.technical_compliance.real_asset_paths).toBe(true);
    });
  });
});