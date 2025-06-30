/**
 * 🧪 DELIVERY SPECIALIST VALIDATOR TESTS
 * 
 * Unit tests for DeliverySpecialistValidator
 * Tests final package validation and delivery readiness
 */

import { DeliverySpecialistValidator, DeliveryPackage } from '../../src/agent/validators/delivery-specialist-validator';

describe('DeliverySpecialistValidator', () => {
  let validator: DeliverySpecialistValidator;

  beforeEach(() => {
    validator = DeliverySpecialistValidator.getInstance();
  });

  const createValidDeliveryPackage = (): DeliveryPackage => ({
    html_email: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><title>Test Email</title></head><body><table><tr><td>Test Email Content</td></tr></table></body></html>',
    mjml_source: '<mjml><mj-body><mj-text>Test Email Content</mj-text></mj-body></mjml>',
    assets: [
      {
        filename: 'image.jpg',
        content: Buffer.from('test image content'),
        size_bytes: 5000,
        mime_type: 'image/jpeg',
        optimized: true
      }
    ],
    metadata: {
      package_version: '1.0.0',
      creation_date: new Date().toISOString(),
      quality_score: 85,
      compatibility_report: 'All email clients supported',
      accessibility_report: 'WCAG AA compliant',
      performance_metrics: 'Load time: 1.2s',
      total_size_kb: 45
    },
    documentation: {
      readme: '# Email Template\nThis is a test email template.',
      implementation_guide: 'Copy the HTML and use in your email client.',
      testing_notes: 'Tested on Gmail, Outlook, Apple Mail.',
      browser_support: 'All modern email clients.',
      troubleshooting: 'Contact support if issues arise.'
    },
    preview_files: [
      {
        filename: 'preview-desktop.html',
        content: '<html>Desktop preview</html>',
        type: 'desktop',
        size_bytes: 1000
      },
      {
        filename: 'preview-mobile.html',
        content: '<html>Mobile preview</html>',
        type: 'mobile',
        size_bytes: 800
      }
    ]
  });

  describe('Final Package Validation', () => {
    it('should validate complete delivery package', async () => {
      const validPackage = createValidDeliveryPackage();
      const result = await validator.validateOutput(validPackage);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject package over size limit', async () => {
      const validPackage = createValidDeliveryPackage();
      const oversizedPackage = {
        ...validPackage,
        metadata: {
          ...validPackage.metadata,
          total_size_kb: 700 // Over 600KB limit
        }
      };

      const result = await validator.validateOutput(oversizedPackage);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'package_size',
          errorType: 'size_limit'
        })
      );
    });

    it('should reject failed deployment', async () => {
      const validPackage = createValidDeliveryPackage();
      const invalidPackage = {
        ...validPackage,
        html_email: '' // Empty HTML
      };

      const result = await validator.validateOutput(invalidPackage);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'html_email',
          errorType: 'invalid_value'
        })
      );
    });
  });

  describe('Deployment Validation', () => {
    it('should validate successful deployment', async () => {
      const validPackage = createValidDeliveryPackage();
      const result = await validator.validateOutput(validPackage);

      expect(result.isValid).toBe(true);
      expect(result.validationDuration).toBeLessThan(1000);
    });

    it('should require monitoring activation', async () => {
      const validPackage = createValidDeliveryPackage();
      const packageWithoutMonitoring = {
        ...validPackage,
        documentation: {
          ...validPackage.documentation,
          readme: '' // Missing documentation
        }
      };

      const result = await validator.validateOutput(packageWithoutMonitoring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'documentation.readme',
          errorType: 'missing'
        })
      );
    });
  });

  describe('URL Validation', () => {
    it('should validate all artifact URLs', async () => {
      const validPackage = createValidDeliveryPackage();
      const result = await validator.validateOutput(validPackage);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid URLs', async () => {
      const validPackage = createValidDeliveryPackage();
      const packageWithInvalidAsset = {
        ...validPackage,
        assets: [
          {
            filename: '',
            content: Buffer.from(''),
            size_bytes: 0,
            mime_type: '',
            optimized: false
          }
        ]
      };

      const result = await validator.validateOutput(packageWithInvalidAsset);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'assets',
          errorType: 'invalid_value'
        })
      );
    });
  });
}); 