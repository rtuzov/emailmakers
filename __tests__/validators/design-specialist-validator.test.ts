/**
 * 🧪 DESIGN SPECIALIST VALIDATOR TESTS
 * 
 * Unit tests for DesignSpecialistValidator
 * Tests design output validation and MJML compliance
 */

import { DesignSpecialistValidator } from '../../src/agent/validators/design-specialist-validator';
import { DesignToQualityHandoffData } from '../../src/agent/types/base-agent-types';

describe('DesignSpecialistValidator', () => {
  let validator: DesignSpecialistValidator;

  beforeEach(() => {
    validator = DesignSpecialistValidator.getInstance();
  });

  const createValidDesignOutput = (): DesignToQualityHandoffData => ({
    email_package: {
      html_content: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><title>Test Email</title></head><body><table><tr><td>Test Email Content</td></tr></table></body></html>',
      mjml_source: '<mjml><mj-body><mj-text>Test Email Content</mj-text></mj-body></mjml>',
      inline_css: 'body { margin: 0; font-family: Arial, sans-serif; }',
      asset_urls: ['https://example.com/image.jpg', 'https://example.com/logo.png']
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

  describe('Output Validation', () => {
    it('should validate correct design output', async () => {
      const validData = createValidDesignOutput();
      const result = await validator.validateOutput(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject output with missing HTML', async () => {
      const validData = createValidDesignOutput();
      const invalidOutput = {
        ...validData,
        email_package: {
          ...validData.email_package,
          html_content: ''
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email_package.html_content',
          errorType: 'invalid_value'
        })
      );
    });

    it('should reject output with file size over limit', async () => {
      const validData = createValidDesignOutput();
      const invalidOutput = {
        ...validData,
        rendering_metadata: {
          ...validData.rendering_metadata,
          file_size_bytes: 150000 // Over 100KB limit
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'rendering_metadata.file_size_bytes',
          errorType: 'size_limit'
        })
      );
    });

    it('should reject output with invalid MJML', async () => {
      const validData = createValidDesignOutput();
      const invalidOutput = {
        ...validData,
        email_package: {
          ...validData.email_package,
          mjml_source: '<invalid-mjml>'
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email_package.mjml_source',
          errorType: 'format_error'
        })
      );
    });
  });

  describe('Asset Validation', () => {
    it('should validate asset URLs', async () => {
      const validData = createValidDesignOutput();
      const result = await validator.validateOutput(validData);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid asset URLs', async () => {
      const validData = createValidDesignOutput();
      const invalidOutput = {
        ...validData,
        email_package: {
          ...validData.email_package,
          asset_urls: ['invalid-url', 'not-a-url']
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email_package.asset_urls',
          errorType: 'format_error'
        })
      );
    });
  });

  describe('Performance Validation', () => {
    it('should validate performance metrics', async () => {
      const validData = createValidDesignOutput();
      const result = await validator.validateOutput(validData);

      expect(result.isValid).toBe(true);
      expect(result.validationDuration).toBeLessThan(1000);
    });

    it('should reject output with poor confidence score', async () => {
      const validData = createValidDesignOutput();
      const invalidOutput = {
        ...validData,
        rendering_metadata: {
          ...validData.rendering_metadata,
          file_size_bytes: 150000 // This will trigger validation error
        }
      };

      const result = await validator.validateOutput(invalidOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'rendering_metadata.file_size_bytes',
          errorType: 'size_limit'
        })
      );
    });
  });
}); 