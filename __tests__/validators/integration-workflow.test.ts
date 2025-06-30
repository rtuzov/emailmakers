/**
 * 🧪 INTEGRATION WORKFLOW TESTS
 * 
 * Integration tests for complete agent handoff workflow
 * Tests end-to-end validation from ContentSpecialist to DeliverySpecialist
 */

import { HandoffValidator } from '../../src/agent/validators/agent-handoff-validator';
import { AICorrector } from '../../src/agent/validators/ai-corrector';
import { createValidContentToDesignData } from './agent-handoff-validator.test';
import { 
  ContentToDesignHandoffData,
  DesignToQualityHandoffData,
  QualityToDeliveryHandoffData 
} from '../../src/agent/types/base-agent-types';

describe('Integration Workflow Tests', () => {
  let handoffValidator: HandoffValidator;
  let mockAICorrector: jest.Mocked<AICorrector>;

  beforeEach(() => {
    mockAICorrector = {
      correctHandoffData: jest.fn(),
      getErrorCorrections: jest.fn(),
      validateCorrection: jest.fn()
    } as any;

    handoffValidator = HandoffValidator.getInstance(mockAICorrector);
  });

  describe('Complete Agent Workflow', () => {
    it('should validate complete Content → Design → Quality → Delivery workflow', async () => {
      // Step 1: ContentSpecialist → DesignSpecialist
      const contentToDesignData = createValidContentToDesignData();
      
      const contentToDesignResult = await handoffValidator.validateContentToDesign(contentToDesignData);
      expect(contentToDesignResult.isValid).toBe(true);

      // Step 2: DesignSpecialist → QualitySpecialist  
      const designToQualityData: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<html><body>Generated Email Content</body></html>',
          mjml_source: '<mjml><mj-body><mj-text>Generated Email</mj-text></mj-body></mjml>',
          inline_css: 'body { font-family: Arial; color: #333; }',
          asset_urls: ['https://cdn.example.com/logo.png', 'https://cdn.example.com/banner.jpg']
        },
        rendering_metadata: {
          template_type: contentToDesignData.design_requirements.template_type,
          file_size_bytes: 75000,
          render_time_ms: 2500,
          optimization_applied: ['css-inline', 'image-optimize', 'minify-html']
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 45,
            images_count: 2,
            total_size_kb: 73
          },
          accessibility_features: ['alt-text', 'aria-labels', 'proper-contrast'],
          responsive_breakpoints: ['mobile-480', 'tablet-768', 'desktop-1024'],
          dark_mode_support: true
        },
        original_content: contentToDesignData.content_package,
        trace_id: contentToDesignData.trace_id,
        timestamp: new Date().toISOString()
      };

      const designToQualityResult = await handoffValidator.validateDesignToQuality(designToQualityData);
      expect(designToQualityResult.isValid).toBe(true);

      // Step 3: QualitySpecialist → DeliverySpecialist
      const qualityToDeliveryData: QualityToDeliveryHandoffData = {
        quality_package: {
          validated_html: designToQualityData.email_package.html_content,
          quality_score: 88,
          validation_status: 'passed',
          optimized_assets: [
            'https://cdn.example.com/optimized-logo.webp',
            'https://cdn.example.com/optimized-banner.webp'
          ]
        },
        test_results: {
          html_validation: {
            w3c_compliant: true,
            errors: [],
            warnings: ['Consider using semantic HTML5 elements']
          },
          css_validation: {
            valid: true,
            issues: []
          },
          email_client_compatibility: {
            gmail: true,
            outlook: true,
            apple_mail: true,
            yahoo_mail: true,
            compatibility_score: 96
          }
        },
        accessibility_report: {
          wcag_aa_compliant: true,
          issues: [],
          score: 92
        },
        performance_analysis: {
          load_time_score: 89,
          file_size_score: 91,
          optimization_score: 85
        },
        spam_analysis: {
          spam_score: 12,
          risk_factors: [],
          recommendations: ['Maintain current content strategy', 'Consider A/B testing subject lines']
        },
        original_content: contentToDesignData.content_package,
        trace_id: contentToDesignData.trace_id,
        timestamp: new Date().toISOString()
      };

      const qualityToDeliveryResult = await handoffValidator.validateQualityToDelivery(qualityToDeliveryData);
      expect(qualityToDeliveryResult.isValid).toBe(true);

      // Step 4: Validate complete handoff chain integrity
      const integrityResult = await handoffValidator.validateHandoffIntegrity([
        contentToDesignData,
        designToQualityData,
        qualityToDeliveryData
      ], 'content-to-design');

      expect(integrityResult.isValid).toBe(true);
      expect(integrityResult.errors).toHaveLength(0);
    });

    it('should detect and report workflow integrity issues', async () => {
      const contentToDesignData = createValidContentToDesignData();
      
      // Create data with trace_id mismatch
      const designToQualityData: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<html><body>Test</body></html>',
          mjml_source: '<mjml><mj-body>Test</mj-body></mjml>',
          inline_css: 'body { color: black; }',
          asset_urls: []
        },
        rendering_metadata: {
          template_type: 'promotional',
          file_size_bytes: 50000,
          render_time_ms: 1500,
          optimization_applied: []
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 25,
            images_count: 0,
            total_size_kb: 48
          },
          accessibility_features: [],
          responsive_breakpoints: [],
          dark_mode_support: false
        },
        original_content: contentToDesignData.content_package,
        trace_id: 'different-trace-id', // This will cause integrity failure
        timestamp: new Date().toISOString()
      };

      const integrityResult = await handoffValidator.validateHandoffIntegrity([
        contentToDesignData,
        designToQualityData
      ], 'content-to-design');

      expect(integrityResult.isValid).toBe(false);
      expect(integrityResult.errors).toContainEqual(
        expect.objectContaining({
          field: 'trace_id_chain',
          errorType: 'invalid_value'
        })
      );
    });
  });

  describe('Workflow Performance', () => {
    it('should complete full workflow validation within acceptable time', async () => {
      const startTime = Date.now();
      
      const contentToDesignData = createValidContentToDesignData();
      await handoffValidator.validateContentToDesign(contentToDesignData);
      
      // Simulate additional workflow steps
      const designToQualityData: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<html><body>Test</body></html>',
          mjml_source: '<mjml><mj-body>Test</mj-body></mjml>',
          inline_css: 'body { color: black; }',
          asset_urls: []
        },
        rendering_metadata: {
          template_type: 'promotional',
          file_size_bytes: 50000,
          render_time_ms: 1500,
          optimization_applied: []
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 25,
            images_count: 0,
            total_size_kb: 48
          },
          accessibility_features: [],
          responsive_breakpoints: [],
          dark_mode_support: false
        },
        original_content: contentToDesignData.content_package,
        trace_id: contentToDesignData.trace_id,
        timestamp: new Date().toISOString()
      };

      await handoffValidator.validateDesignToQuality(designToQualityData);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Full workflow should complete within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial workflow failures gracefully', async () => {
      const contentToDesignData = createValidContentToDesignData({
        content_package: {
          ...createValidContentToDesignData().content_package,
          complete_content: {
            subject: '', // Invalid: empty subject
            preheader: 'Test Preheader',
            body: 'Test Body',
            cta: 'Test CTA'
          }
        }
      });

      const result = await handoffValidator.validateContentToDesign(contentToDesignData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.correctionSuggestions).toHaveLength(1);
      
      // Verify that correction suggestions are provided
      expect(result.correctionSuggestions[0]).toMatchObject({
        field: 'content_package.complete_content.subject',
        priority: 'high'
      });
    });
  });
}); 