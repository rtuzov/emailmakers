/**
 * 🧪 QUALITY SPECIALIST PHASE 6.1 VALIDATION TEST
 * 
 * Validation tests for Quality Specialist Phase 6.1 enhancements:
 * - Context-aware validation using design packages
 * - Real asset and technical specification integration
 * - Comprehensive quality reporting with actionable insights
 * 
 * Tests integration with Design Specialist Phase 5.1-5.3 outputs.
 */

import { jest } from '@jest/globals';
import {
  loadDesignPackage,
  validateDesignPackageIntegrity,
  validateEmailTemplate,
  testEmailClientCompatibility,
  testAccessibilityCompliance,
  analyzeEmailPerformance,
  generateQualityReport
} from '../../src/agent/specialists/quality-specialist-tools';
import * as fs from 'fs';
import * as path from 'path';

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn(),
    readdir: jest.fn(),
    access: jest.fn()
  }
}));

const mockFs = fs.promises as jest.Mocked<typeof fs.promises>;

describe('Quality Specialist Phase 6.1 Validation Tests', () => {
  let mockCampaignPath: string;
  let mockDesignPackageData: any;
  let mockContext: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCampaignPath = '/test/campaigns/campaign_123';
    
    // Mock design package data structure from Design Specialist Phase 5.1-5.3
    mockDesignPackageData = {
      packageId: 'design_package_123',
      mjmlTemplate: {
        source: `<mjml>
          <mj-head>
            <mj-title>Amazing Travel Deal</mj-title>
            <mj-preview>Limited time offer</mj-preview>
          </mj-head>
          <mj-body background-color="#ffffff">
            <mj-section padding="0">
              <mj-column width="100%">
                <mj-image src="/test/campaigns/campaign_123/assets/optimized/hero-image.webp" 
                          alt="Paris travel destination" width="600px" padding="0" />
              </mj-column>
            </mj-section>
            <mj-section background-color="#ffffff" padding="20px">
              <mj-column>
                <mj-text color="#333333" align="center">Amazing Travel Deal</mj-text>
                <mj-text color="#3498db" align="center" padding-top="20px">599 USD</mj-text>
                <mj-button background-color="#3498db" color="#ffffff">Book Now</mj-button>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>`,
        filePath: '/test/campaigns/campaign_123/design-package/templates/email-template.mjml',
        fileSize: 2500,
        technicalCompliance: {
          max_width_respected: true,
          color_scheme_applied: true,
          typography_followed: true,
          email_client_optimized: true,
          real_asset_paths: true
        },
        assetsUsed: {
          hero_image: { path: '/test/hero-image.webp', size: 45000 },
          calendar_icon: { path: '/test/calendar-icon.png', size: 2000 }
        },
        specificationsUsed: {
          layout: 'single-column',
          max_width: 600,
          color_scheme: 4,
          typography: 'Arial, sans-serif / Arial, sans-serif',
          email_clients: 3
        }
      },
      assetManifest: {
        images: [
          {
            id: 'hero-image',
            path: '/test/campaigns/campaign_123/assets/optimized/hero-image.webp',
            url: '/test/campaigns/campaign_123/assets/optimized/hero-image.webp',
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
            path: '/test/campaigns/campaign_123/assets/optimized/calendar-icon.png',
            url: '/test/campaigns/campaign_123/assets/optimized/calendar-icon.png',
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
            usage: 'primary-text'
          }
        ],
        usageInstructions: [
          {
            assetId: 'hero-image',
            placement: 'Place at top of email as main header image',
            context: 'Hero image for travel campaign',
            responsiveBehavior: 'Scale proportionally for mobile',
            emailClientNotes: ['WebP not supported in Outlook - provide JPEG fallback'],
            accessibilityRequirements: 'Alt text: Paris travel destination',
            fallbackStrategy: 'JPEG fallback for Outlook compatibility'
          }
        ]
      },
      technicalSpecification: {
        campaign: { id: 'campaign_123', name: 'Travel Campaign' },
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
          }
        },
        delivery: {
          emailClients: [
            { client: 'gmail', maxWidth: 600, supportsWebP: true, supportsSVG: false },
            { client: 'outlook', maxWidth: 600, supportsWebP: false, supportsSVG: false },
            { client: 'apple-mail', maxWidth: 600, supportsWebP: true, supportsSVG: true }
          ]
        },
        quality: {
          criteria: {
            performance: { maxFileSize: 100000 },
            accessibility: { wcagLevel: 'AA', contrastRatio: 4.5 },
            emailDeliverability: { textToHtmlRatio: 0.3 }
          }
        }
      },
      packageMetadata: {
        qualityIndicators: {
          technical_compliance: 100,
          asset_optimization: 100,
          accessibility_score: 100,
          performance_score: 87,
          email_client_compatibility: 85
        },
        readinessStatus: {
          design_complete: true,
          assets_optimized: true,
          previews_generated: true,
          performance_analyzed: true,
          ready_for_quality_review: true
        },
        performanceMetrics: {
          emailClientCompatibility: 85,
          accessibilityScore: 90
        }
      }
    };

    mockContext = {
      qualityContext: {
        campaignId: 'campaign_123',
        campaignPath: mockCampaignPath,
        design_package: mockDesignPackageData,
        validation_results: {}
      }
    };
  });

  describe('Phase 6.1: Context-Aware Quality Validation', () => {
    it('should successfully load design package from Design Specialist output', async () => {
      // Mock file reads for design package loading
      mockFs.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('email-template.mjml')) {
          return mockDesignPackageData.mjmlTemplate.source;
        }
        if (filePath.includes('asset-manifest.json')) {
          return JSON.stringify(mockDesignPackageData.assetManifest);
        }
        if (filePath.includes('technical-specification.json')) {
          return JSON.stringify({ specification: mockDesignPackageData.technicalSpecification });
        }
        if (filePath.includes('package-metadata.json')) {
          return JSON.stringify({
            package_id: mockDesignPackageData.packageId,
            quality_indicators: mockDesignPackageData.packageMetadata.qualityIndicators,
            readiness_status: mockDesignPackageData.packageMetadata.readinessStatus,
            package_contents: {
              mjml_template: {
                technical_compliance: mockDesignPackageData.mjmlTemplate.technicalCompliance,
                assets_used: mockDesignPackageData.mjmlTemplate.assetsUsed,
                specifications_used: mockDesignPackageData.mjmlTemplate.specificationsUsed
              }
            }
          });
        }
        throw new Error(`Unexpected file path: ${filePath}`);
      });

      mockFs.stat.mockResolvedValue({ size: 2500 } as any);

      const result = await loadDesignPackage.execute({
        campaignPath: mockCampaignPath,
        packageId: 'design_package_123',
        loadOptions: {
          validateIntegrity: true,
          loadAssets: true,
          loadTechnicalSpec: true,
          loadMetadata: true
        },
        trace_id: 'test-trace-123'
      }, {});

      expect(result).toContain('Design package loaded successfully');
      expect(result).toContain('2.44 KB');
      expect(result).toContain('1 images, 1 icons, 1 fonts');
      expect(result).toContain('100% technical compliance');
      expect(result).toContain('Package ready for comprehensive validation');
    });

    it('should validate design package integrity with real data', async () => {
      const result = await validateDesignPackageIntegrity.execute({
        design_package: mockDesignPackageData,
        integrity_checks: {
          template_completeness: true,
          asset_consistency: true,
          specification_compliance: true,
          metadata_validation: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Design package integrity validation completed');
      expect(result).toContain('Overall integrity score: 100/100');
      expect(result).toContain('Template completeness: 100/100');
      expect(result).toContain('Asset consistency: 100/100');
      expect(result).toContain('Package integrity excellent');
    });

    it('should validate email template with technical specifications', async () => {
      const result = await validateEmailTemplate.execute({
        design_package: mockDesignPackageData,
        validation_options: {
          html_validation: true,
          css_validation: true,
          mjml_validation: true,
          technical_compliance: true,
          asset_path_validation: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Context-aware email template validation completed');
      expect(result).toContain('Technical compliance:');
      expect(result).toContain('Asset paths:');
      expect(result).toContain('validated against technical specifications');
      expect(result).toContain('Ready for email client compatibility testing');
    });

    it('should test email client compatibility with real asset data', async () => {
      const result = await testEmailClientCompatibility.execute({
        design_package: mockDesignPackageData,
        client_targets: null, // Should use from tech spec
        test_options: {
          include_mobile: true,
          include_dark_mode: true,
          screenshot_tests: true,
          test_asset_formats: true,
          validate_rendering: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Context-aware email client compatibility testing completed');
      expect(result).toContain('Clients tested: 3');
      expect(result).toContain('Asset format issues:');
      expect(result).toContain('real asset email client support data');
      expect(result).toContain('Screenshots generated:');
    });

    it('should test accessibility compliance with real alt text and color data', async () => {
      const result = await testAccessibilityCompliance.execute({
        design_package: mockDesignPackageData,
        accessibility_level: 'AA',
        test_options: {
          color_contrast: true,
          alt_text_coverage: true,
          keyboard_navigation: true,
          screen_reader: true,
          semantic_structure: true,
          focus_indicators: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Context-aware accessibility compliance testing completed');
      expect(result).toContain('Alt text coverage: 100%');
      expect(result).toContain('Color contrast:');
      expect(result).toContain('real asset alt text data and color scheme');
      expect(result).toContain('WCAG AA level');
    });

    it('should analyze performance with real file sizes and asset data', async () => {
      const result = await analyzeEmailPerformance.execute({
        design_package: mockDesignPackageData,
        performance_targets: {
          max_load_time: 3000,
          max_total_size: 500000,
          min_deliverability_score: 85,
          max_html_size: 102400,
          max_image_size: 300000
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Context-aware email performance analysis completed');
      expect(result).toContain('HTML size: 2.44 KB');
      expect(result).toContain('Asset optimization:');
      expect(result).toContain('real file sizes and asset optimization data');
      expect(result).toContain('Load time:');
      expect(result).toContain('Deliverability score:');
    });

    it('should generate comprehensive quality report from all validations', async () => {
      // Setup validation results in context
      mockContext.qualityContext.validation_results = {
        integrity_validation: { overall_score: 100, total_issues: 0 },
        template_validation: { overall_score: 95, total_issues: 2 },
        client_compatibility: { average_compatibility: 85, client_tests: [{ test_status: 'pass' }] },
        accessibility_test: { overall_score: 90, issues: [] },
        performance_analysis: { deliverability_score: 87, optimization_suggestions: [] }
      };

      const result = await generateQualityReport.execute({
        design_package: mockDesignPackageData,
        include_recommendations: true,
        approval_thresholds: {
          minimum_score: 85,
          critical_issue_threshold: 0,
          accessibility_minimum: 80
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Comprehensive context-aware quality report generated');
      expect(result).toContain('Overall score:');
      expect(result).toContain('Approval status: APPROVED');
      expect(result).toContain('Component scores:');
      expect(result).toContain('Tests passed: 5/5');
      expect(result).toContain('ready for delivery preparation');
    });

    it('should handle missing design package gracefully', async () => {
      await expect(validateEmailTemplate.execute({
        design_package: null,
        validation_options: {
          html_validation: true,
          css_validation: true,
          mjml_validation: true,
          technical_compliance: true,
          asset_path_validation: true
        },
        trace_id: 'test-trace-123'
      }, {})).rejects.toThrow('Design package not found');
    });
  });

  describe('Integration with Design Specialist Phase 5.1-5.3', () => {
    it('should work with Design Specialist package structure', async () => {
      // Test that Quality Specialist tools properly consume Design Specialist outputs
      const packageData = mockDesignPackageData;
      
      // Verify package structure compatibility
      expect(packageData.mjmlTemplate.technicalCompliance.real_asset_paths).toBe(true);
      expect(packageData.assetManifest.images[0].email_client_support).toBeDefined();
      expect(packageData.technicalSpecification.design.constraints.layout.maxWidth).toBe(600);
      expect(packageData.packageMetadata.qualityIndicators.technical_compliance).toBe(100);
      
      // Test that Quality Specialist can validate Design Specialist outputs
      const result = await validateDesignPackageIntegrity.execute({
        design_package: packageData,
        integrity_checks: {
          template_completeness: true,
          asset_consistency: true,
          specification_compliance: true,
          metadata_validation: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);
      
      expect(result).toContain('Package integrity excellent');
    });

    it('should provide meaningful feedback for Design Specialist improvements', async () => {
      // Test with package that has some issues
      const packageWithIssues = {
        ...mockDesignPackageData,
        mjmlTemplate: {
          ...mockDesignPackageData.mjmlTemplate,
          technicalCompliance: {
            ...mockDesignPackageData.mjmlTemplate.technicalCompliance,
            real_asset_paths: false
          }
        }
      };

      const result = await validateEmailTemplate.execute({
        design_package: packageWithIssues,
        validation_options: {
          html_validation: true,
          css_validation: true,
          mjml_validation: true,
          technical_compliance: true,
          asset_path_validation: true
        },
        trace_id: 'test-trace-123'
      }, mockContext);

      expect(result).toContain('Technical compliance:');
      expect(result).toContain('Asset paths:');
      // Should provide specific feedback about real asset paths issue
    });
  });
});