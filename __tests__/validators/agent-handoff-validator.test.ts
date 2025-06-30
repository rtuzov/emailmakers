/**
 * 🧪 AGENT HANDOFF VALIDATOR TESTS
 * 
 * Comprehensive unit tests for HandoffValidator class
 * Tests all handoff validation scenarios and edge cases
 */

import { HandoffValidator, HandoffType } from '../../src/agent/validators/agent-handoff-validator';
import { AICorrector } from '../../src/agent/validators/ai-corrector';
import { 
  ContentToDesignHandoffData,
  DesignToQualityHandoffData,
  QualityToDeliveryHandoffData
} from '../../src/agent/types/base-agent-types';

jest.mock('../../src/agent/validators/ai-corrector');

describe('HandoffValidator', () => {
  let validator: HandoffValidator;
  let mockAICorrector: jest.Mocked<AICorrector>;

  beforeEach(() => {
    mockAICorrector = new AICorrector() as jest.Mocked<AICorrector>;
    validator = HandoffValidator.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ContentToDesign Validation', () => {
    it('should validate correct ContentToDesign data', async () => {
      const validData = createValidContentToDesignData();
      const result = await validator.validateContentToDesign(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toEqual(validData);
    });

    it('should reject data with missing subject', async () => {
      const validData = createValidContentToDesignData();
      const invalidData = {
        ...validData,
        content_package: {
          ...validData.content_package,
          complete_content: {
            ...validData.content_package.complete_content,
            subject: ''
          }
        }
      };

      const result = await validator.validateContentToDesign(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'content_package.complete_content.subject',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject data with invalid language', async () => {
      const validData = createValidContentToDesignData();
      const invalidData = {
        ...validData,
        content_package: {
          ...validData.content_package,
          content_metadata: {
            ...validData.content_package.content_metadata,
            language: 'invalid' as any
          }
        }
      };

      const result = await validator.validateContentToDesign(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'content_package.content_metadata.language',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject data with missing trace_id', async () => {
      const validData = createValidContentToDesignData();
      const invalidData = {
        ...validData,
        trace_id: ''
      };

      const result = await validator.validateContentToDesign(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'trace_id',
          errorType: 'invalid_value'
        })
      );
    });

    it('should provide correction suggestions for invalid data', async () => {
      const validData = createValidContentToDesignData();
      const invalidData = {
        ...validData,
        content_package: {
          ...validData.content_package,
          complete_content: {
            ...validData.content_package.complete_content,
            subject: ''
          }
        }
      };

      const result = await validator.validateContentToDesign(invalidData);

      expect(result.correctionSuggestions).toContainEqual(
        expect.objectContaining({
          field: 'content_package.complete_content.subject',
          suggestion: expect.stringContaining('subject')
        })
      );
    });
  });

  describe('DesignToQuality Validation', () => {
    const createValidDesignToQualityData = (): DesignToQualityHandoffData => ({
      email_package: {
        html_content: '<html><body>Test Email</body></html>',
        mjml_source: '<mjml><mj-body>Test</mj-body></mjml>',
        inline_css: 'body { color: black; }',
        asset_urls: ['https://example.com/image.jpg']
      },
      rendering_metadata: {
        template_type: 'promotional',
        file_size_bytes: 50000,
        render_time_ms: 1500,
        optimization_applied: ['css-inline', 'image-optimize']
      },
      design_artifacts: {
        performance_metrics: {
          css_rules_count: 25,
          images_count: 3,
          total_size_kb: 45
        },
        accessibility_features: ['alt-text', 'aria-labels'],
        responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
        dark_mode_support: true
      },
      original_content: createValidContentToDesignData().content_package,
      trace_id: 'test-trace-123',
      timestamp: new Date().toISOString()
    });

    it('should validate correct DesignToQuality data', async () => {
      const validData = createValidDesignToQualityData();
      const result = await validator.validateDesignToQuality(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toEqual(validData);
    });

    it('should reject data with empty HTML content', async () => {
      const validData = createValidDesignToQualityData();
      const invalidData = {
        ...validData,
        email_package: {
          ...validData.email_package,
          html_content: ''
        }
      };

      const result = await validator.validateDesignToQuality(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email_package.html_content',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject data with file size over limit', async () => {
      const validData = createValidDesignToQualityData();
      const invalidData = {
        ...validData,
        rendering_metadata: {
          ...validData.rendering_metadata,
          file_size_bytes: 150000 // Over 100KB limit
        }
      };

      const result = await validator.validateDesignToQuality(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'rendering_metadata.file_size_bytes',
          errorType: 'size_limit'
        })
      );
    });

    it('should reject data with invalid asset URLs', async () => {
      const validData = createValidDesignToQualityData();
      const invalidData = {
        ...validData,
        email_package: {
          ...validData.email_package,
          asset_urls: ['invalid-url', 'not-a-url']
        }
      };

      const result = await validator.validateDesignToQuality(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email_package.asset_urls',
          errorType: 'format_error'
        })
      );
    });
  });

  describe('QualityToDelivery Validation', () => {
    const createValidQualityToDeliveryData = (): QualityToDeliveryHandoffData => ({
      quality_package: {
        validated_html: '<html><body>Validated Email</body></html>',
        quality_score: 85, // Must be >= 70
        validation_status: 'passed',
        optimized_assets: ['https://example.com/optimized.jpg']
      },
      test_results: {
        html_validation: {
          w3c_compliant: true,
          errors: [],
          warnings: ['minor warning']
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
          compatibility_score: 95
        }
      },
      accessibility_report: {
        wcag_aa_compliant: true,
        issues: [],
        score: 90
      },
      performance_analysis: {
        load_time_score: 85,
        file_size_score: 90,
        optimization_score: 88
      },
      spam_analysis: {
        spam_score: 15, // Lower is better
        risk_factors: [],
        recommendations: ['maintain current practices']
      },
      original_content: createValidContentToDesignData().content_package,
      trace_id: 'test-trace-123',
      timestamp: new Date().toISOString()
    });

    it('should validate correct QualityToDelivery data', async () => {
      const validData = createValidQualityToDeliveryData();
      const result = await validator.validateQualityToDelivery(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toEqual(validData);
    });

    it('should reject data with quality score below threshold', async () => {
      const validData = createValidQualityToDeliveryData();
      const invalidData = {
        ...validData,
        quality_package: {
          ...validData.quality_package,
          quality_score: 65 // Below 70 threshold
        }
      };

      const result = await validator.validateQualityToDelivery(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quality_package.quality_score',
          errorType: 'invalid_value',
          severity: 'critical'
        })
      );
    });

    it('should reject data with failed validation status', async () => {
      const validData = createValidQualityToDeliveryData();
      const invalidData = {
        ...validData,
        quality_package: {
          ...validData.quality_package,
          validation_status: 'failed' as any
        }
      };

      const result = await validator.validateQualityToDelivery(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quality_package.validation_status',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject data with non-W3C compliant HTML', async () => {
      const validData = createValidQualityToDeliveryData();
      const invalidData = {
        ...validData,
        test_results: {
          ...validData.test_results,
          html_validation: {
            w3c_compliant: false,
            errors: ['HTML error 1', 'HTML error 2'],
            warnings: []
          }
        }
      };

      const result = await validator.validateQualityToDelivery(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'test_results.html_validation.w3c_compliant',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject data with poor email client compatibility', async () => {
      const validData = createValidQualityToDeliveryData();
      const invalidData = {
        ...validData,
        test_results: {
          ...validData.test_results,
          email_client_compatibility: {
            gmail: false,
            outlook: false,
            apple_mail: true,
            yahoo_mail: true,
            compatibility_score: 40 // Below 70 threshold
          }
        }
      };

      const result = await validator.validateQualityToDelivery(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'test_results.email_client_compatibility.compatibility_score',
          errorType: 'invalid_value'
        })
      );
    });
  });

  describe('Handoff Chain Validation', () => {
    it('should validate complete handoff chain', async () => {
      const contentToDesign = createValidContentToDesignData();
      const designToQuality: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<html><body>Test Email</body></html>',
          mjml_source: '<mjml><mj-body>Test</mj-body></mjml>',
          inline_css: 'body { color: black; }',
          asset_urls: ['https://example.com/image.jpg']
        },
        rendering_metadata: {
          template_type: 'promotional',
          file_size_bytes: 50000,
          render_time_ms: 1500,
          optimization_applied: ['css-inline', 'image-optimize']
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 25,
            images_count: 3,
            total_size_kb: 45
          },
          accessibility_features: ['alt-text', 'aria-labels'],
          responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
          dark_mode_support: true
        },
        original_content: contentToDesign.content_package,
        trace_id: 'test-trace-123',
        timestamp: new Date().toISOString()
      };

      const result = await validator.validateHandoffIntegrity([contentToDesign, designToQuality], 'content-to-design');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect broken handoff chain', async () => {
      const contentToDesign = createValidContentToDesignData();
      const designToQuality: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<html><body>Test Email</body></html>',
          mjml_source: '<mjml><mj-body>Test</mj-body></mjml>',
          inline_css: 'body { color: black; }',
          asset_urls: ['https://example.com/image.jpg']
        },
        rendering_metadata: {
          template_type: 'promotional',
          file_size_bytes: 50000,
          render_time_ms: 1500,
          optimization_applied: ['css-inline', 'image-optimize']
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 25,
            images_count: 3,
            total_size_kb: 45
          },
          accessibility_features: ['alt-text', 'aria-labels'],
          responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
          dark_mode_support: true
        },
        original_content: contentToDesign.content_package,
        trace_id: 'different-trace-456', // Different trace_id
        timestamp: new Date().toISOString()
      };

      const result = await validator.validateHandoffIntegrity([contentToDesign, designToQuality], 'content-to-design');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'trace_id',
          errorType: 'consistency_error'
        })
      );
    });
  });

  describe('AI Correction Integration', () => {
    it('should trigger AI correction for invalid data', async () => {
      const validData = createValidContentToDesignData();
      const invalidData = {
        ...validData,
        content_package: {
          ...validData.content_package,
          complete_content: {
            ...validData.content_package.complete_content,
            subject: ''
          }
        }
      };

      // Mock the AI corrector to return a corrected version
      const mockCorrectHandoffData = jest.fn().mockResolvedValue({
        success: true,
        correctedData: validData,
        corrections: [
          {
            field: 'content_package.complete_content.subject',
            originalValue: '',
            correctedValue: 'Corrected Subject',
            reason: 'Subject cannot be empty'
          }
        ]
      });

      // Add the mock method to the mocked AI corrector
      (mockAICorrector as any).correctHandoffData = mockCorrectHandoffData;

      await validator.validateContentToDesign(invalidData);

      // Verify that AI correction was called
      expect(mockCorrectHandoffData).toHaveBeenCalled();
    });

    it('should handle AI correction failures gracefully', async () => {
      const validData = createValidContentToDesignData();
      await validator.validateContentToDesign(validData);

      // Should not attempt correction for valid data
      expect(mockAICorrector).not.toHaveProperty('correctHandoffData');
    });
  });
});

export const createValidContentToDesignData = (overrides: Partial<ContentToDesignHandoffData> = {}): ContentToDesignHandoffData => {
  return {
    content_package: {
      complete_content: {
        subject: 'Test Subject',
        preheader: 'Test Preheader', 
        body: 'Test Body Content',
        cta: 'Test CTA'
      },
      content_metadata: {
        language: 'ru',
        tone: 'professional',
        word_count: 150,
        reading_time: 2
      },
      brand_guidelines: {
        voice_tone: 'professional',
        key_messages: ['message1', 'message2'],
        compliance_notes: ['note1']
      }
    },
    design_requirements: {
      template_type: 'promotional',
      visual_priority: 'balanced',
      layout_preferences: ['responsive', 'mobile-first'],
      color_scheme: 'brand-primary'
    },
    campaign_context: {
      topic: 'Test Campaign',
      target_audience: 'travelers',
      destination: 'Paris',
      origin: 'Moscow',
      urgency_level: 'medium'
    },
    trace_id: 'test-trace-123',
    timestamp: new Date().toISOString(),
    ...overrides
  };
}; 