/**
 * 🧪 QUALITY SPECIALIST VALIDATOR TESTS
 * 
 * Unit tests for QualitySpecialistValidator
 * Tests quality control and email client compatibility
 */

import { QualitySpecialistValidator } from '../../src/agent/validators/quality-specialist-validator';
import { QualityToDeliveryHandoffData } from '../../src/agent/types/base-agent-types';

describe('QualitySpecialistValidator', () => {
  let validator: QualitySpecialistValidator;

  beforeEach(() => {
    validator = QualitySpecialistValidator.getInstance();
  });

  const createValidQualityOutput = (): QualityToDeliveryHandoffData => ({
    quality_package: {
      validated_html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><title>Test Email</title></head><body><table><tr><td>Test Email Content</td></tr></table></body></html>',
      quality_score: 85,
      validation_status: 'passed',
      optimized_assets: ['https://example.com/optimized-image.jpg']
    },
    test_results: {
      html_validation: {
        w3c_compliant: true,
        errors: [],
        warnings: []
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
      spam_score: 15,
      risk_factors: [],
      recommendations: ['maintain current practices']
    },
    original_content: {
      complete_content: {
        subject: 'Test Subject',
        preheader: 'Test Preheader',
        body: 'Test Body Content',
        cta: 'Test CTA'
      },
      content_metadata: {
        language: 'ru' as const,
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
    trace_id: '123e4567-e89b-12d3-a456-426614174000',
    timestamp: new Date().toISOString()
  });

  describe('Quality Gate Validation', () => {
    it('should validate output meeting quality threshold', async () => {
      const validData = createValidQualityOutput();
      const result = await validator.validateOutput(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject output below quality threshold', async () => {
      const validData = createValidQualityOutput();
      const invalidOutput = {
        ...validData,
        quality_package: {
          ...validData.quality_package,
          quality_score: 65 // Below 70 threshold
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quality_package.quality_score',
          errorType: 'invalid_value',
          severity: 'critical'
        })
      );
    });

    it('should reject output with failed compliance', async () => {
      const validData = createValidQualityOutput();
      const invalidOutput = {
        ...validData,
        accessibility_report: {
          ...validData.accessibility_report,
          wcag_aa_compliant: false,
          score: 45
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'accessibility_report.wcag_aa_compliant',
          errorType: 'invalid_value'
        })
      );
    });
  });

  describe('Critical Issue Detection', () => {
    it('should reject output with critical issues', async () => {
      const validData = createValidQualityOutput();
      const invalidOutput = {
        ...validData,
        test_results: {
          ...validData.test_results,
          html_validation: {
            w3c_compliant: false,
            errors: ['Critical HTML error'],
            warnings: []
          }
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'test_results.html_validation.w3c_compliant',
          errorType: 'invalid_value',
          severity: 'critical'
        })
      );
    });
  });

  describe('Performance Validation', () => {
    it('should complete validation within time limit', async () => {
      const validData = createValidQualityOutput();
      const result = await validator.validateOutput(validData);

      expect(result.isValid).toBe(true);
      expect(result.validationDuration).toBeLessThan(1000);
    });
  });
}); 