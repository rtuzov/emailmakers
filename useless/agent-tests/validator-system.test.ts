/**
 * 🛡️ ТЕСТЫ СИСТЕМЫ ВАЛИДАТОРОВ
 * 
 * Comprehensive testing suite для всех специализированных валидаторов
 * Проверяет корректность работы DesignSpecialistValidator, QualitySpecialistValidator, DeliverySpecialistValidator
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { DesignSpecialistValidator } from '../validators/design-specialist-validator';
import { QualitySpecialistValidator } from '../validators/quality-specialist-validator';
import { DeliverySpecialistValidator } from '../validators/delivery-specialist-validator';
import { AGENT_CONSTANTS, QualityToDeliveryHandoffData } from '../types/base-agent-types';

// Helper function to create valid QualityToDeliveryHandoffData
function createQualityHandoffData(overrides: Partial<QualityToDeliveryHandoffData> = {}): QualityToDeliveryHandoffData {
  return {
    quality_package: {
      validated_html: '<!DOCTYPE html><html><body><h1>Test Email</h1></body></html>',
      quality_score: 85,
      validation_status: 'passed',
      optimized_assets: ['https://example.com/logo.png']
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
      score: 85
    },
    performance_analysis: {
      load_time_score: 80,
      file_size_score: 85,
      optimization_score: 82
    },
    spam_analysis: {
      spam_score: 2,
      risk_factors: [],
      recommendations: []
    },
    original_content: {
      complete_content: {
        subject: 'Test Subject',
        preheader: 'Test Preheader',
        body: 'Test body content',
        cta: 'Test CTA'
      },
      content_metadata: {
        language: 'ru' as const,
        tone: 'friendly',
        word_count: 50,
        reading_time: 1
      },
      brand_guidelines: {
        voice_tone: 'professional',
        key_messages: ['test'],
        compliance_notes: []
      }
    },
    trace_id: 'test-trace-id-123456',
    timestamp: new Date().toISOString(),
    ...overrides
  };
}

describe('🛡️ Validator System Tests', () => {
  let designValidator: DesignSpecialistValidator;
  let qualityValidator: QualitySpecialistValidator;
  let deliveryValidator: DeliverySpecialistValidator;

  beforeEach(() => {
    designValidator = DesignSpecialistValidator.getInstance();
    qualityValidator = QualitySpecialistValidator.getInstance();
    deliveryValidator = DeliverySpecialistValidator.getInstance();
  });

  describe('🎨 DesignSpecialistValidator Tests', () => {
    test('✅ Валидный design output должен проходить проверку', async () => {
      const validDesignOutput = {
        html_content: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><meta charset="UTF-8"><title>Valid Email</title></head><body><h1>Valid Email</h1><p>This is a valid email with proper structure and sufficient content for testing purposes.</p></body></html>',
        mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Valid Email Content</mj-text></mj-column></mj-section></mj-body></mjml>',
        assets: [
          { filename: 'logo.png', size_kb: 15, optimized: true },
          { filename: 'banner.jpg', size_kb: 25, optimized: true }
        ],
        rendering_time_ms: 600,
        total_size_kb: 85
      };

      const result = await designValidator.validateDesignOutput(validDesignOutput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    test('🚫 Превышение лимита размера должно блокировать валидацию', async () => {
      const oversizedDesignOutput = {
        html_content: '<!DOCTYPE html><html><body>' + 'x'.repeat(150000) + '</body></html>', // >100KB
        mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
        assets: [],
        rendering_time_ms: 500,
        total_size_kb: 150 // Превышает лимит 100KB
      };

      const result = await designValidator.validateDesignOutput(oversizedDesignOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const sizeErrors = result.errors.filter(e => e.errorType === 'size_limit');
      expect(sizeErrors.length).toBeGreaterThan(0);
      expect(sizeErrors[0].field).toContain('total_size_kb');
    });

    test('❌ Некорректный HTML должен генерировать ошибки', async () => {
      const invalidDesignOutput = {
        html_content: '<div>Invalid HTML without DOCTYPE or proper structure', // Некорректный HTML
        mjml_source: '<mjml><invalid-tag>Broken MJML</invalid-tag></mjml>', // Некорректный MJML
        assets: [],
        rendering_time_ms: 2500, // Превышает рекомендуемое время
        total_size_kb: 45
      };

      const result = await designValidator.validateDesignOutput(invalidDesignOutput);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Проверяем специфические ошибки
      const htmlErrors = result.errors.filter(e => e.field === 'html_content');
      expect(htmlErrors.length).toBeGreaterThan(0);
    });

    test('⚠️ Медленный рендеринг должен генерировать предупреждения', async () => {
      const slowDesignOutput = {
        html_content: '<!DOCTYPE html><html><head><title>Slow</title></head><body><h1>Slow Email</h1><p>Valid content but slow rendering.</p></body></html>',
        mjml_source: '<mjml><mj-body><mj-text>Slow</mj-text></mj-body></mjml>',
        assets: [],
        rendering_time_ms: 1800, // Медленно, но не критично
        total_size_kb: 45
      };

      const result = await designValidator.validateDesignOutput(slowDesignOutput);

      expect(result.isValid).toBe(true); // Не критично
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const perfWarnings = result.warnings.filter(w => w.includes('rendering time'));
      expect(perfWarnings.length).toBeGreaterThan(0);
    });

    test('📊 W3C compliance проверка должна работать', async () => {
      const nonCompliantOutput = {
        html_content: '<html><body><h1>Missing DOCTYPE and meta tags</body></html>', // Не соответствует W3C
        mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
        assets: [],
        rendering_time_ms: 400,
        total_size_kb: 30
      };

      const result = await designValidator.validateDesignOutput(nonCompliantOutput);

      expect(result.isValid).toBe(false);
      
      const complianceErrors = result.errors.filter(e => 
        e.message.includes('DOCTYPE') || e.message.includes('W3C')
      );
      expect(complianceErrors.length).toBeGreaterThan(0);
    });

    test('🎯 Asset validation должна проверять файлы', async () => {
      const invalidAssetsOutput = {
        html_content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test</h1><img src="missing.jpg" alt="test"></body></html>',
        mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
        assets: [
          { filename: '', size_kb: 50, optimized: false }, // Пустое имя файла
          { filename: 'huge.png', size_kb: 1000, optimized: false }, // Слишком большой
          { filename: 'valid.jpg', size_kb: 15, optimized: true }
        ],
        rendering_time_ms: 500,
        total_size_kb: 80
      };

      const result = await designValidator.validateDesignOutput(invalidAssetsOutput);

      expect(result.isValid).toBe(false);
      
      const assetErrors = result.errors.filter(e => e.field.includes('assets'));
      expect(assetErrors.length).toBeGreaterThan(0);
    });
  });

  describe('🔍 QualitySpecialistValidator Tests', () => {
    test('✅ Высокие качественные метрики должны проходить', async () => {
      const highQualityData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>High Quality Email</h1></body></html>',
          quality_score: 88,
          validation_status: 'passed',
          optimized_assets: ['https://example.com/logo.png']
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
            compatibility_score: 96
          }
        },
        accessibility_report: {
          wcag_aa_compliant: true,
          issues: [],
          score: 92
        },
        spam_analysis: {
          spam_score: 1,
          risk_factors: [],
          recommendations: []
        }
      });

      const result = await qualityValidator.validateQualityOutput(highQualityData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('❌ Низкий quality_score должен блокировать', async () => {
      const lowQualityData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Low Quality Email</h1></body></html>',
          quality_score: 55, // Ниже минимального 70
          validation_status: 'failed',
          optimized_assets: []
        },
        performance_analysis: {
          load_time_score: 70,
          file_size_score: 75,
          optimization_score: 65
        }
      });

      const result = await qualityValidator.validateQualityOutput(lowQualityData);

      expect(result.isValid).toBe(false);
      
      const scoreErrors = result.errors.filter(e => e.field === 'quality_package.quality_score');
      expect(scoreErrors.length).toBeGreaterThan(0);
      expect(scoreErrors[0].severity).toBe('critical');
    });

    test('🚫 Нарушение WCAG AA должно быть критичным', async () => {
      const nonAccessibleData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Non-Accessible Email</h1></body></html>',
          quality_score: 75,
          validation_status: 'passed',
          optimized_assets: []
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
          wcag_aa_compliant: false, // КРИТИЧЕСКАЯ ОШИБКА
          issues: ['Missing alt text on images', 'Low color contrast ratio'],
          score: 50 // Низкий балл доступности
        },
        performance_analysis: {
          load_time_score: 80,
          file_size_score: 85,
          optimization_score: 82
        },
        spam_analysis: {
          spam_score: 2,
          risk_factors: [],
          recommendations: []
        }
      });

      const result = await qualityValidator.validateQualityOutput(nonAccessibleData);

      expect(result.isValid).toBe(false);
      
      const wcagErrors = result.errors.filter(e => e.field === 'accessibility_report.wcag_aa_compliant');
      expect(wcagErrors.length).toBeGreaterThan(0);
      expect(wcagErrors[0].severity).toBe('critical');
    });

    test('⚠️ Высокий spam score должен предупреждать', async () => {
      const highSpamData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>High Spam Email</h1></body></html>',
          quality_score: 78,
          validation_status: 'passed',
          optimized_assets: []
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
          score: 85
        },
        performance_analysis: {
          load_time_score: 75,
          file_size_score: 78, // Близко к лимиту
          optimization_score: 75
        },
        spam_analysis: {
          spam_score: 6, // Высокий spam score
          risk_factors: ['Too many promotional words', 'High image-to-text ratio'],
          recommendations: ['Reduce promotional language', 'Add more text content']
        }
      });

      const result = await qualityValidator.validateQualityOutput(highSpamData);

      expect(result.isValid).toBe(false); // Spam score >5 критичен
      
      const spamErrors = result.errors.filter(e => e.field === 'spam_analysis.spam_score');
      expect(spamErrors.length).toBeGreaterThan(0);
    });

    test('📱 Mobile optimization должна проверяться', async () => {
      const poorMobileData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Poor Mobile Email</h1></body></html>',
          quality_score: 72,
          validation_status: 'passed',
          optimized_assets: []
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
            apple_mail: false, // Плохая мобильная совместимость
            yahoo_mail: true,
            compatibility_score: 75 // Снижено из-за мобильных проблем
          }
        },
        accessibility_report: {
          wcag_aa_compliant: true,
          issues: [],
          score: 80
        },
        performance_analysis: {
          load_time_score: 75,
          file_size_score: 85,
          optimization_score: 45 // Плохая мобильная оптимизация
        },
        spam_analysis: {
          spam_score: 3,
          risk_factors: [],
          recommendations: []
        }
      });

      const result = await qualityValidator.validateQualityOutput(poorMobileData);

      expect(result.isValid).toBe(false);
      
      const mobileErrors = result.errors.filter(e => e.field === 'performance_analysis.optimization_score');
      expect(mobileErrors.length).toBeGreaterThan(0);
    });

    test('⚡ Performance metrics должны соблюдаться', async () => {
      const slowData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Slow Email</h1>' + 'x'.repeat(100000) + '</body></html>', // Большой размер
          quality_score: 75,
          validation_status: 'passed',
          optimized_assets: []
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
          score: 85
        },
        performance_analysis: {
          load_time_score: 45, // Низкая производительность
          file_size_score: 30, // Превышает лимит
          optimization_score: 45
        },
        spam_analysis: {
          spam_score: 2,
          risk_factors: [],
          recommendations: []
        }
      });

      const result = await qualityValidator.validateQualityOutput(slowData);

      expect(result.isValid).toBe(false);
      
      const perfErrors = result.errors.filter(e => 
        e.field === 'performance_analysis.load_time_score' || e.field === 'performance_analysis.file_size_score' || e.field === 'performance_analysis.optimization_score'
      );
      expect(perfErrors.length).toBeGreaterThan(0);
    });

    test('🎯 Client compatibility должна быть высокой', async () => {
      const lowCompatibilityData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Low Compatibility Email</h1></body></html>',
          quality_score: 73,
          validation_status: 'passed',
          optimized_assets: []
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
            outlook: false, // Проблемы с Outlook
            apple_mail: true,
            yahoo_mail: false, // Проблемы с Yahoo
            compatibility_score: 80 // Ниже минимальных 95%
          }
        },
        accessibility_report: {
          wcag_aa_compliant: true,
          issues: [],
          score: 82
        },
        performance_analysis: {
          load_time_score: 70,
          file_size_score: 75,
          optimization_score: 70
        },
        spam_analysis: {
          spam_score: 3,
          risk_factors: [],
          recommendations: []
        }
      });

      const result = await qualityValidator.validateQualityOutput(lowCompatibilityData);

      expect(result.isValid).toBe(false);
      
      const compatErrors = result.errors.filter(e => e.field === 'test_results.email_client_compatibility.compatibility_score');
      expect(compatErrors.length).toBeGreaterThan(0);
    });
  });

  describe('📦 DeliverySpecialistValidator Tests', () => {
    test('✅ Готовый пакет должен проходить валидацию', async () => {
      const readyPackage = {
        html_email: '<!DOCTYPE html><html><head><title>Ready Package</title></head><body><h1>Ready for Delivery</h1><p>This email package is complete and ready for client delivery with all required components including comprehensive documentation and preview files.</p></body></html>',
        mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Ready Package</mj-text></mj-column></mj-section></mj-body></mjml>',
        assets: [
          {
            filename: 'logo.png',
            content: 'mock-binary-data-for-logo',
            size_bytes: 8000,
            mime_type: 'image/png',
            optimized: true
          },
          {
            filename: 'banner.jpg',
            content: 'mock-binary-data-for-banner',
            size_bytes: 15000,
            mime_type: 'image/jpeg',
            optimized: true
          }
        ],
        metadata: {
          package_version: '1.2.0',
          creation_date: new Date().toISOString(),
          quality_score: 87,
          compatibility_report: 'All email clients tested successfully with 98% compatibility rate across Gmail, Outlook, Apple Mail, and Yahoo Mail',
          accessibility_report: 'WCAG AA compliance verified with screen reader compatibility and proper semantic structure',
          performance_metrics: 'Optimized for fast loading with minified CSS, compressed images, and efficient HTML structure',
          total_size_kb: 180
        },
        documentation: {
          readme: 'This is a comprehensive README file with detailed instructions for using this email template. It includes setup instructions, customization options, troubleshooting tips, and best practices for implementation.',
          implementation_guide: 'Step-by-step implementation guide for integrating this email template into your email marketing platform. Covers installation, configuration, testing, and deployment procedures.',
          testing_notes: 'Comprehensive testing has been performed across multiple email clients including Gmail, Outlook 2016+, Apple Mail, Yahoo Mail, and mobile clients. All tests passed with excellent rendering consistency.',
          browser_support: 'Supports all modern email clients and browsers with responsive design optimized for desktop, tablet, and mobile devices. Dark mode compatibility included.',
          troubleshooting: 'Common issues and their solutions are documented here including rendering problems, delivery issues, image loading problems, and responsive design fixes for specific email clients.'
        },
        preview_files: [
          {
            filename: 'desktop-preview.png',
            content: 'mock-desktop-preview-image-data',
            type: 'desktop' as const,
            size_bytes: 25000
          },
          {
            filename: 'mobile-preview.png',
            content: 'mock-mobile-preview-image-data',
            type: 'mobile' as const,
            size_bytes: 18000
          },
          {
            filename: 'dark-mode-preview.png',
            content: 'mock-dark-mode-preview-image-data',
            type: 'dark_mode' as const,
            size_bytes: 22000
          }
        ]
      };

      const result = await deliveryValidator.validateDeliveryPackage(readyPackage, true);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('🚫 Превышение лимита 600KB должно блокировать', async () => {
      const oversizedPackage = {
        html_email: '<!DOCTYPE html><html><body>' + 'x'.repeat(700000) + '</body></html>', // >600KB
        mjml_source: '<mjml><mj-body><mj-text>Oversized</mj-text></mj-body></mjml>',
        assets: [
          {
            filename: 'huge-image.jpg',
            content: 'x'.repeat(100000), // 100KB
            size_bytes: 100000,
            mime_type: 'image/jpeg',
            optimized: false
          }
        ],
        metadata: {
          package_version: '1.0.0',
          creation_date: new Date().toISOString(),
          quality_score: 85,
          compatibility_report: 'Test report',
          accessibility_report: 'Test accessibility',
          performance_metrics: 'Test metrics',
          total_size_kb: 750 // Превышает лимит 600KB
        },
        documentation: {
          readme: 'Basic readme',
          implementation_guide: 'Basic guide',
          testing_notes: 'Basic testing notes',
          browser_support: 'Basic browser support info',
          troubleshooting: 'Basic troubleshooting guide'
        },
        preview_files: []
      };

      const result = await deliveryValidator.validateDeliveryPackage(oversizedPackage, true);

      expect(result.isValid).toBe(false);
      
      const sizeErrors = result.errors.filter(e => e.errorType === 'size_limit');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    test('❌ Неполная документация должна генерировать ошибки', async () => {
      const incompletePackage = {
        html_email: '<!DOCTYPE html><html><head><title>Incomplete</title></head><body><h1>Incomplete Package</h1></body></html>',
        assets: [],
        metadata: {
          package_version: '1.0.0',
          creation_date: new Date().toISOString(),
          quality_score: 75,
          compatibility_report: 'Test',
          accessibility_report: 'Test',
          performance_metrics: 'Test',
          total_size_kb: 50
        },
        documentation: {
          readme: 'Short', // Слишком короткая документация
          implementation_guide: '', // Пустая
          testing_notes: 'Test',
          browser_support: '',
          troubleshooting: ''
        },
        preview_files: [] // Отсутствуют preview файлы
      };

      const result = await deliveryValidator.validateDeliveryPackage(incompletePackage, true);

      expect(result.isValid).toBe(false);
      
      const docErrors = result.errors.filter(e => e.field === 'documentation');
      expect(docErrors.length).toBeGreaterThan(0);
      
      const previewErrors = result.errors.filter(e => e.field === 'preview_files');
      expect(previewErrors.length).toBeGreaterThan(0);
    });

    test('🔍 Package integrity report должен быть точным', () => {
      const testPackage = {
        html_email: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Email Content</h1><p>Package integrity test content.</p></body></html>',
        mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Test Content for Integrity</mj-text></mj-column></mj-section></mj-body></mjml>',
        assets: [
          { content: 'test-asset-data-content', size_bytes: 5000 },
          { content: 'another-test-asset-content', size_bytes: 3000 }
        ],
        documentation: {
          readme: 'Comprehensive readme file content for testing package integrity calculation',
          implementation_guide: 'Detailed implementation guide content',
          testing_notes: 'Testing documentation content',
          browser_support: 'Browser support information',
          troubleshooting: 'Troubleshooting guide content'
        },
        preview_files: [
          { content: 'desktop-preview-content', size_bytes: 12000 },
          { content: 'mobile-preview-content', size_bytes: 8000 }
        ]
      };

      const report = deliveryValidator.generatePackageIntegrityReport(testPackage);

      expect(report.total_files).toBeGreaterThan(0);
      expect(report.total_size_kb).toBeGreaterThan(0);
      expect(report.html_size_kb).toBeGreaterThan(0);
      expect(report.assets_size_kb).toBeGreaterThan(0);
      expect(report.documentation_size_kb).toBeGreaterThan(0);
      expect(report.within_size_limit).toBe(report.total_size_kb <= AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB);
      expect(report.missing_files).toHaveLength(0);
      expect(report.corrupted_files).toHaveLength(0);
    });

    test('🎯 Readiness check должен быть строгим', () => {
      const readyPackage = {
        html_email: '<!DOCTYPE html><html><head><title>Ready</title></head><body><h1>Ready Package</h1><p>Complete package ready for delivery.</p></body></html>',
        assets: [
          { content: 'valid-asset', size_bytes: 2000 }
        ],
        metadata: {
          quality_score: 82,
          compatibility_report: 'Excellent compatibility',
          accessibility_report: 'WCAG AA compliant',
          performance_metrics: 'Optimized performance'
        },
        documentation: {
          readme: 'Complete readme documentation with all necessary information for users'
        },
        preview_files: [
          { content: 'preview', size_bytes: 1000 }
        ]
      };

      const readiness = deliveryValidator.isReadyForClientDelivery(readyPackage);

      expect(readiness.ready).toBe(true);
      expect(readiness.blockers).toHaveLength(0);
      expect(readiness.summary).toContain('✅');

      // Тест с неготовым пакетом
      const notReadyPackage = {
        html_email: '', // Пустой HTML
        metadata: {
          quality_score: 50 // Низкое качество
        }
      };

      const notReadiness = deliveryValidator.isReadyForClientDelivery(notReadyPackage);

      expect(notReadiness.ready).toBe(false);
      expect(notReadiness.blockers.length).toBeGreaterThan(0);
      expect(notReadiness.summary).toContain('❌');
    });

    test('🗂️ Отсутствующие preview типы должны генерировать ошибки', async () => {
      const missingPreviewsPackage = {
        html_email: '<!DOCTYPE html><html><head><title>Missing Previews</title></head><body><h1>Missing Preview Files</h1></body></html>',
        assets: [],
        metadata: {
          package_version: '1.0.0',
          creation_date: new Date().toISOString(),
          quality_score: 80,
          compatibility_report: 'Good',
          accessibility_report: 'Compliant',
          performance_metrics: 'Optimized',
          total_size_kb: 45
        },
        documentation: {
          readme: 'Complete readme with detailed information about the email template and its usage',
          implementation_guide: 'Comprehensive implementation guide with step-by-step instructions',
          testing_notes: 'Detailed testing notes covering all email clients and devices',
          browser_support: 'Complete browser support documentation',
          troubleshooting: 'Comprehensive troubleshooting guide with common issues and solutions'
        },
        preview_files: [
          {
            filename: 'only-desktop.png',
            content: 'desktop-preview-content',
            type: 'desktop' as const,
            size_bytes: 15000
          }
          // Отсутствует mobile preview
        ]
      };

      const result = await deliveryValidator.validateDeliveryPackage(missingPreviewsPackage, true);

      expect(result.isValid).toBe(false);
      
      const previewErrors = result.errors.filter(e => 
        e.field === 'preview_files' && e.message.includes('mobile')
      );
      expect(previewErrors.length).toBeGreaterThan(0);
    });
  });

  describe('🎯 Cross-Validator Integration', () => {
    test('📊 Все валидаторы должны использовать одинаковые константы', () => {
      // Проверяем что все валидаторы используют одни и те же лимиты
      expect(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_HTML_SIZE_KB).toBe(100);
      expect(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_PACKAGE_SIZE_KB).toBe(600);
      expect(AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE).toBe(70);
      expect(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_SPAM_SCORE).toBe(3);
      expect(AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_CLIENT_COMPATIBILITY).toBe(95);
    });

    test('🔗 Валидаторы должны быть синглтонами', () => {
      const designValidator1 = DesignSpecialistValidator.getInstance();
      const designValidator2 = DesignSpecialistValidator.getInstance();
      expect(designValidator1).toBe(designValidator2);

      const qualityValidator1 = QualitySpecialistValidator.getInstance();
      const qualityValidator2 = QualitySpecialistValidator.getInstance();
      expect(qualityValidator1).toBe(qualityValidator2);

      const deliveryValidator1 = DeliverySpecialistValidator.getInstance();
      const deliveryValidator2 = DeliverySpecialistValidator.getInstance();
      expect(deliveryValidator1).toBe(deliveryValidator2);
    });

    test('⚡ Валидаторы должны работать быстро под нагрузкой', async () => {
      const testData = createQualityHandoffData({
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Performance Test Email</h1></body></html>',
          quality_score: 85,
          validation_status: 'passed',
          optimized_assets: ['https://example.com/logo.png']
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
            compatibility_score: 96
          }
        },
        accessibility_report: {
          wcag_aa_compliant: true,
          issues: [],
          score: 90
        },
        performance_analysis: {
          load_time_score: 85,
          file_size_score: 88,
          optimization_score: 85
        },
        spam_analysis: {
          spam_score: 2,
          risk_factors: [],
          recommendations: []
        }
      });

      const startTime = Date.now();
      
      // Одновременная валидация множественных данных
      const promises = Array(20).fill(null).map(() => 
        qualityValidator.validateQualityOutput(testData)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results.every(r => r.isValid)).toBe(true);
      expect(duration).toBeLessThan(1000); // Все 20 валидаций за 1 секунду
    });

    test('🛡️ Валидаторы должны быть устойчивы к некорректным данным', async () => {
      const maliciousInputs = [
        null,
        undefined,
        {},
        [],
        'string',
        123,
        Object.create({ malicious: true }),
        { constructor: 'malicious' },
        { toString: () => { throw new Error('Evil toString'); } },
        { valueOf: () => { throw new Error('Evil valueOf'); } }
      ];

      for (const input of maliciousInputs) {
        // Design validator
        const designResult = await designValidator.validateDesignOutput(input as any);
        expect(designResult.isValid).toBe(false);
        expect(designResult.errors.length).toBeGreaterThan(0);

        // Quality validator  
        const qualityResult = await qualityValidator.validateQualityOutput(input as any);
        expect(qualityResult.isValid).toBe(false);
        expect(qualityResult.errors.length).toBeGreaterThan(0);

        // Delivery validator
        const deliveryResult = await deliveryValidator.validateDeliveryPackage(input as any);
        expect(deliveryResult.isValid).toBe(false);
        expect(deliveryResult.errors.length).toBeGreaterThan(0);
      }
    });
  });
});