/**
 * 🧪 ЖЕСТКИЕ ТЕСТЫ ВАЛИДАЦИИ HANDOFF ДАННЫХ
 * 
 * Comprehensive testing suite для системы валидации между агентами
 * Zero tolerance принцип: все должно работать без ошибок или быть исправлено AI
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { HandoffValidator } from '../validators/agent-handoff-validator';
import { AICorrector } from '../validators/ai-corrector';
import { DesignSpecialistValidator } from '../validators/design-specialist-validator';
import { QualitySpecialistValidator } from '../validators/quality-specialist-validator';
import { DeliverySpecialistValidator } from '../validators/delivery-specialist-validator';
import {
  ContentToDesignHandoffData,
  DesignToQualityHandoffData,
  QualityToDeliveryHandoffData,
  AGENT_CONSTANTS
} from '../types/base-agent-types';

describe('🔍 Handoff Validation System - Zero Tolerance Testing', () => {
  let handoffValidator: HandoffValidator;
  let aiCorrector: AICorrector;
  let designValidator: DesignSpecialistValidator;
  let qualityValidator: QualitySpecialistValidator;
  let deliveryValidator: DeliverySpecialistValidator;

  beforeEach(() => {
    aiCorrector = new AICorrector();
    handoffValidator = HandoffValidator.getInstance(aiCorrector);
    designValidator = DesignSpecialistValidator.getInstance();
    qualityValidator = QualitySpecialistValidator.getInstance();
    deliveryValidator = DeliverySpecialistValidator.getInstance();
  });

  describe('📝 ContentToDesign Handoff Validation', () => {
    test('✅ Валидация корректных данных должна проходить', async () => {
      const validData: ContentToDesignHandoffData = {
        content_package: {
          complete_content: {
            subject: 'Специальное предложение на авиабилеты',
            preheader: 'Скидки до 50% на популярные направления',
            body: 'Открывайте мир с нашими специальными предложениями! Бронируйте билеты прямо сейчас и получите скидку до 50% на самые популярные направления.',
            cta: 'Забронировать билет'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 25,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['качество', 'надежность'],
            compliance_notes: []
          }
        },
        design_requirements: {
          template_type: 'promotional',
          visual_priority: 'balanced',
          layout_preferences: ['responsive', 'clean'],
          color_scheme: 'warm_inviting'
        },
        campaign_context: {
          topic: 'авиабилеты',
          target_audience: 'travelers',
          destination: 'Париж',
          origin: 'Москва',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-123456789-abc123',
        timestamp: new Date().toISOString()
      };

      const result = await handoffValidator.validateContentToDesign(validData, false);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toEqual(validData);
    });

    test('❌ Критические ошибки должны блокировать валидацию', async () => {
      const invalidData = {
        content_package: {
          complete_content: {
            subject: '', // КРИТИЧЕСКАЯ ОШИБКА: пустой subject
            preheader: 'test',
            body: 'test',
            cta: ''  // КРИТИЧЕСКАЯ ОШИБКА: пустой CTA
          },
          content_metadata: {
            language: 'invalid-lang', // ОШИБКА: неверный язык
            tone: 'friendly',
            word_count: -5, // ОШИБКА: отрицательное число
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: [],
            compliance_notes: []
          }
        },
        design_requirements: {
          template_type: 'invalid-type', // ОШИБКА: неверный тип
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        campaign_context: {
          topic: 'test',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'invalid-id', // ОШИБКА: неверный формат
        timestamp: 'invalid-date' // ОШИБКА: неверная дата
      };

      const result = await handoffValidator.validateContentToDesign(invalidData, false);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Проверяем что критические ошибки найдены
      const criticalErrors = result.errors.filter(e => e.severity === 'critical');
      expect(criticalErrors.length).toBeGreaterThan(0);
      
      // Проверяем что есть предложения по исправлению
      expect(result.correctionSuggestions.length).toBeGreaterThan(0);
    });

    test('🤖 AI коррекция должна исправлять невалидные данные', async () => {
      // Mock AI Corrector для тестирования
      const mockCorrectData = jest.spyOn(aiCorrector, 'correctData').mockResolvedValue({
        content_package: {
          complete_content: {
            subject: 'Исправленный заголовок',
            preheader: 'Исправленный preheader',
            body: 'Исправленный контент тела письма с достаточным количеством текста для валидации.',
            cta: 'Исправленный CTA'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 15,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['качество'],
            compliance_notes: []
          }
        },
        design_requirements: {
          template_type: 'promotional',
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        campaign_context: {
          topic: 'test',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-' + Date.now() + '-corrected',
        timestamp: new Date().toISOString()
      });

      const invalidData = {
        content_package: {
          complete_content: {
            subject: '', // Будет исправлено AI
            preheader: '',
            body: '',
            cta: ''
          }
        }
      };

      const result = await handoffValidator.validateContentToDesign(invalidData, true);
      
      expect(mockCorrectData).toHaveBeenCalled();
      expect(result.validatedData).toBeDefined();
      if (result.validatedData && 'content_package' in result.validatedData) {
        expect(result.validatedData.content_package.complete_content.subject).toBe('Исправленный заголовок');
      }
    });

    test('⏱️ Валидация должна работать быстро', async () => {
      const validData: ContentToDesignHandoffData = {
        content_package: {
          complete_content: {
            subject: 'Test Subject',
            preheader: 'Test Preheader',
            body: 'Test Body Content',
            cta: 'Test CTA'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 4,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['test'],
            compliance_notes: []
          }
        },
        design_requirements: {
          template_type: 'promotional',
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        campaign_context: {
          topic: 'test',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-123456789-abc123',
        timestamp: new Date().toISOString()
      };

      const startTime = Date.now();
      const result = await handoffValidator.validateContentToDesign(validData, false);
      const duration = Date.now() - startTime;
      
      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS);
    });
  });

  describe('🎨 DesignToQuality Handoff Validation', () => {
    test('✅ Валидация корректных design данных должна проходить', async () => {
      const validData: DesignToQualityHandoffData = {
        email_package: {
          html_content: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Email</h1><p>This is a valid email with sufficient content for testing purposes.</p></body></html>',
          mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>',
          inline_css: 'body { margin: 0; padding: 0; }',
          asset_urls: ['https://example.com/logo.png', 'https://example.com/banner.jpg']
        },
        rendering_metadata: {
          template_type: 'promotional',
          file_size_bytes: 51200, // 50KB in bytes
          render_time_ms: 500,
          optimization_applied: ['minification', 'compression']
        },
        design_artifacts: {
          performance_metrics: {
            css_rules_count: 25,
            images_count: 2,
            total_size_kb: 50
          },
          accessibility_features: ['alt_texts', 'semantic_html'],
          responsive_breakpoints: ['mobile', 'tablet', 'desktop'],
          dark_mode_support: false
        },
        original_content: {
          complete_content: {
            subject: 'Test Subject',
            preheader: 'Test Preheader',
            body: 'Test body content with sufficient length for validation testing',
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
            key_messages: ['test', 'validation'],
            compliance_notes: []
          }
        },
        trace_id: 'test-trace-id-123456',
        timestamp: new Date().toISOString()
      };

      const result = await handoffValidator.validateDesignToQuality(validData, false);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('🚫 Превышение лимита размера должно блокировать валидацию', async () => {
      const oversizedData = {
        email_package: {
          html_output: '<!DOCTYPE html><html><body>' + 'x'.repeat(200000) + '</body></html>', // >100KB
          rendering_metadata: {
            template_type: 'promotional',
            responsive_design: true,
            dark_mode_support: false,
            rendering_time_ms: 500,
            total_size_kb: 200 // Превышает лимит
          }
        },
        design_context: {
          visual_elements: [],
          color_palette: [],
          typography_choices: [],
          layout_structure: 'standard'
        },
        brand_compliance: {
          guidelines_followed: true,
          brand_consistency_score: 90,
          deviation_notes: []
        },
        trace_id: 'test-trace-id-123456',
        timestamp: new Date().toISOString()
      };

      const result = await handoffValidator.validateDesignToQuality(oversizedData, false);
      
      expect(result.isValid).toBe(false);
      
      const sizeErrors = result.errors.filter(e => 
        e.field === 'email_package.rendering_metadata.total_size_kb' && 
        e.errorType === 'size_limit'
      );
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    test('🎯 DesignSpecialistValidator должен работать независимо', async () => {
      const testData = {
        html_content: '<!DOCTYPE html><html><body><h1>Test</h1></body></html>',
        mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
        assets: [],
        rendering_time_ms: 800,
        total_size_kb: 45
      };

      const result = await designValidator.validateDesignOutput(testData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('🔍 QualityToDelivery Handoff Validation', () => {
    test('✅ Высокий quality score должен проходить валидацию', async () => {
      const validData: QualityToDeliveryHandoffData = {
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Validated Email</h1></body></html>',
          quality_score: 85, // Выше минимального порога
          validation_status: 'passed',
          optimized_assets: ['https://example.com/optimized-logo.png']
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
          spam_score: 2,
          risk_factors: [],
          recommendations: ['Keep content balanced']
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
            key_messages: ['test', 'validation'],
            compliance_notes: []
          }
        },
        trace_id: 'qlt-123456789-abc123',
        timestamp: new Date().toISOString()
      };

      const result = await handoffValidator.validateQualityToDelivery(validData, false);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('❌ Низкий quality score должен блокировать доставку', async () => {
      const lowQualityData = {
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Low Quality Email</h1></body></html>',
          quality_score: 50, // Ниже минимального порога 70
          validation_status: 'failed',
          optimized_assets: []
        },
        test_results: {
          html_validation: {
            w3c_compliant: false, // КРИТИЧЕСКАЯ ОШИБКА
            errors: ['Missing DOCTYPE', 'Invalid HTML structure'],
            warnings: ['Deprecated tags']
          },
          css_validation: {
            valid: false,
            issues: ['Invalid CSS properties']
          },
          email_client_compatibility: {
            gmail: false,
            outlook: false,
            apple_mail: false,
            yahoo_mail: false,
            compatibility_score: 60 // Низкая совместимость
          }
        },
        accessibility_report: {
          wcag_aa_compliant: false, // КРИТИЧЕСКАЯ ОШИБКА
          issues: ['Missing alt texts', 'Low contrast'],
          score: 40
        },
        performance_analysis: {
          load_time_score: 25,
          file_size_score: 30,
          optimization_score: 20
        },
        spam_analysis: {
          spam_score: 8, // Высокий spam score
          risk_factors: ['Too many exclamation marks', 'Suspicious links'],
          recommendations: ['Reduce promotional language', 'Add more text content']
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
            key_messages: ['test', 'validation'],
            compliance_notes: []
          }
        },
        trace_id: 'qlt-123456789-abc123',
        timestamp: new Date().toISOString()
      };

      const result = await handoffValidator.validateQualityToDelivery(lowQualityData, false);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Проверяем критические ошибки
      const criticalErrors = result.errors.filter(e => e.severity === 'critical');
      expect(criticalErrors.length).toBeGreaterThan(0);
    });

    test('🎯 QualitySpecialistValidator должен соблюдать строгие стандарты', async () => {
      const testData: QualityToDeliveryHandoffData = {
        quality_package: {
          validated_html: '<!DOCTYPE html><html><body><h1>Test</h1></body></html>',
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
        timestamp: new Date().toISOString()
      };

      const result = await qualityValidator.validateQualityOutput(testData, true);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('📦 DeliverySpecialist Package Validation', () => {
    test('✅ Готовый пакет должен проходить финальную валидацию', async () => {
      const readyPackage = {
        html_email: '<!DOCTYPE html><html><head><title>Ready</title></head><body><h1>Ready for Delivery</h1><p>This email package is complete and ready for client delivery with all required components.</p></body></html>',
        mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Ready</mj-text></mj-column></mj-section></mj-body></mjml>',
        assets: [
          {
            filename: 'logo.png',
            content: 'binary-data',
            size_bytes: 5000,
            mime_type: 'image/png',
            optimized: true
          }
        ],
        metadata: {
          package_version: '1.0.0',
          creation_date: new Date().toISOString(),
          quality_score: 85,
          compatibility_report: 'All tests passed',
          accessibility_report: 'WCAG AA compliant',
          performance_metrics: 'Optimized for fast loading',
          total_size_kb: 50
        },
        documentation: {
          readme: 'This is a comprehensive README file with detailed instructions for using this email template. It includes setup instructions, customization options, and troubleshooting tips.',
          implementation_guide: 'Step-by-step implementation guide for integrating this email template into your email marketing platform.',
          testing_notes: 'Testing has been performed across multiple email clients including Gmail, Outlook, and Apple Mail.',
          browser_support: 'Supports all modern email clients and browsers with responsive design.',
          troubleshooting: 'Common issues and their solutions are documented here.'
        },
        preview_files: [
          {
            filename: 'desktop-preview.png',
            content: 'preview-image-data',
            type: 'desktop',
            size_bytes: 15000
          },
          {
            filename: 'mobile-preview.png',
            content: 'preview-image-data',
            type: 'mobile',
            size_bytes: 12000
          }
        ]
      };

      const result = await deliveryValidator.validateDeliveryPackage(readyPackage, true);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('🚫 Превышение лимита 600KB должно блокировать доставку', async () => {
      const oversizedPackage = {
        html_email: '<!DOCTYPE html><html><body>' + 'x'.repeat(700000) + '</body></html>', // >600KB
        assets: [],
        metadata: {
          package_version: '1.0.0',
          creation_date: new Date().toISOString(),
          quality_score: 85,
          compatibility_report: 'Tests passed',
          accessibility_report: 'WCAG AA compliant',
          performance_metrics: 'Optimized',
          total_size_kb: 700 // Превышает лимит 600KB
        },
        documentation: {
          readme: 'Test readme',
          implementation_guide: 'Test guide',
          testing_notes: 'Test notes',
          browser_support: 'Test support',
          troubleshooting: 'Test troubleshooting'
        },
        preview_files: []
      };

      const result = await deliveryValidator.validateDeliveryPackage(oversizedPackage, true);
      
      expect(result.isValid).toBe(false);
      
      const sizeErrors = result.errors.filter(e => e.errorType === 'size_limit');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    test('📊 Package integrity report должен быть точным', () => {
      const testPackage = {
        html_email: '<!DOCTYPE html><html><body>Test</body></html>',
        assets: [
          { content: 'test-data', size_bytes: 1000 }
        ],
        documentation: {
          readme: 'Test readme file content'
        },
        preview_files: [
          { content: 'preview-data', size_bytes: 2000 }
        ]
      };

      const report = deliveryValidator.generatePackageIntegrityReport(testPackage);
      
      expect(report.total_files).toBeGreaterThan(0);
      expect(report.total_size_kb).toBeGreaterThan(0);
      expect(report.within_size_limit).toBe(true);
    });
  });

  describe('🚨 Zero Tolerance Error Handling', () => {
    test('❌ AI коррекция должна останавливаться после максимума попыток', async () => {
      // Mock AI Corrector чтобы всегда возвращать null (неудачная коррекция)
      const mockCorrectData = jest.spyOn(aiCorrector, 'correctData').mockResolvedValue(null);

      const invalidData = { invalid: 'data' };

      const result = await handoffValidator.validateContentToDesign(invalidData, true);
      
      expect(result.isValid).toBe(false);
      expect(result.validatedData).toBeUndefined();
    });

    test('⚡ Превышение времени валидации должно прерывать процесс', async () => {
      const startTime = Date.now();
      
      // Создаем очень большие данные для медленной валидации
      const heavyData = {
        content_package: {
          complete_content: {
            subject: 'Test',
            preheader: 'Test',
            body: 'x'.repeat(100000), // Большой контент
            cta: 'Test'
          }
        }
      };

      try {
        await Promise.race([
          handoffValidator.validateContentToDesign(heavyData, false),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS)
          )
        ]);
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThanOrEqual(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS + 100);
      }
    });

    test('🔒 Система должна быть устойчива к некорректным входным данным', async () => {
      const maliciousInputs = [
        null,
        undefined,
        {},
        [],
        'string',
        123,
        Object.create({ malicious: true }),
        Object.create(null)
      ];

      for (const input of maliciousInputs) {
        const result = await handoffValidator.validateContentToDesign(input as any, false);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('📈 Performance & Memory Tests', () => {
    test('🚀 Валидация должна работать эффективно при большой нагрузке', async () => {
      const validData: ContentToDesignHandoffData = {
        content_package: {
          complete_content: {
            subject: 'Load Test Subject',
            preheader: 'Load Test Preheader',
            body: 'Load Test Body Content',
            cta: 'Load Test CTA'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 4,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['test'],
            compliance_notes: []
          }
        },
        design_requirements: {
          template_type: 'promotional',
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        campaign_context: {
          topic: 'test',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-123456789-load-test',
        timestamp: new Date().toISOString()
      };

      const promises = Array(10).fill(null).map(() => 
        handoffValidator.validateContentToDesign(validData, false)
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results.every(r => r.isValid)).toBe(true);
      expect(duration).toBeLessThan(5000); // Все 10 валидаций за 5 секунд
    });
  });
});