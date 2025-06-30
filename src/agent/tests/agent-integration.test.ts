/**
 * 🔄 ИНТЕГРАЦИОННЫЕ ТЕСТЫ АГЕНТОВ
 * 
 * End-to-end тестирование полного пайплайна валидации между агентами
 * Проверяет что данные корректно передаются через всю цепочку агентов
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ContentSpecialistAgent, ContentSpecialistInput } from '../specialists/content-specialist-agent';
import { DesignSpecialistAgent } from '../specialists/design-specialist-agent';
import { QualitySpecialistAgent } from '../specialists/quality-specialist-agent';
import { DeliverySpecialistAgent } from '../specialists/delivery-specialist-agent';
import { AGENT_CONSTANTS } from '../types/base-agent-types';

// Mock внешних зависимостей
vi.mock('@openai/agents', () => ({
  Agent: vi.fn().mockImplementation(() => ({})),
  run: vi.fn().mockResolvedValue('Mock AI Response' as any),
  tool: vi.fn(),
  withTrace: vi.fn().mockImplementation((name, fn) => fn()),
  generateTraceId: vi.fn().mockReturnValue('test-trace-id'),
  getCurrentTrace: vi.fn()
}));

// Mock всех инструментов агентов
vi.mock('../tools/consolidated/context-provider', () => ({
  contextProvider: vi.fn().mockResolvedValue({
    success: true,
    data: { context: 'test' }
  }),
  contextProviderSchema: {}
}));

vi.mock('../tools/consolidated/pricing-intelligence', () => ({
  pricingIntelligence: vi.fn().mockResolvedValue({
    success: true,
    data: { pricing: 'test' }
  }),
  pricingIntelligenceSchema: {}
}));

vi.mock('../tools/simple/content-create', () => ({
  contentCreate: vi.fn().mockResolvedValue({
    success: true,
    content_data: {
      complete_content: {
        subject: 'Test Email Subject',
        preheader: 'Test Email Preheader',
        body: 'Test email body content with sufficient length for validation purposes.',
        cta: 'Test CTA'
      }
    }
  }),
  contentCreateSchema: {}
}));

vi.mock('../tools/consolidated/email-renderer', () => ({
  emailRenderer: vi.fn().mockResolvedValue({
    success: true,
    html_output: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Email</h1><p>Test content</p></body></html>',
    mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>'
  }),
  emailRendererSchema: {}
}));

vi.mock('../tools/simple/html-validate', () => ({
  htmlValidate: vi.fn().mockResolvedValue({
    success: true,
    validation_results: { valid: true }
  }),
  htmlValidateSchema: {}
}));

vi.mock('../tools/simple/s3-upload', () => ({
  s3Upload: vi.fn().mockResolvedValue({
    success: true,
    upload_results: { uploaded: true }
  }),
  s3UploadSchema: {}
}));

describe('🔄 Agent Integration Pipeline Tests', () => {
  let contentAgent: ContentSpecialistAgent;
  let designAgent: DesignSpecialistAgent;
  let qualityAgent: QualitySpecialistAgent;
  let deliveryAgent: DeliverySpecialistAgent;

  beforeEach(() => {
    contentAgent = new ContentSpecialistAgent();
    designAgent = new DesignSpecialistAgent();
    qualityAgent = new QualitySpecialistAgent();
    deliveryAgent = new DeliverySpecialistAgent();
    
    vi.clearAllMocks();
  });

  describe('📝➡️🎨 Content → Design Pipeline', () => {
    test('✅ Полный пайплайн Content → Design должен работать', async () => {
      // STEP 1: Генерация контента
      const contentInput = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Авиабилеты в Париж',
          campaign_type: 'promotional' as const,
          target_audience: 'путешественники',
          urgency_level: 'medium',
          geographic_scope: 'Russia',
          seasonal_context: 'spring'
        },
        content_requirements: {
          content_type: 'complete_campaign' as const,
          tone: 'friendly' as const,
          language: 'ru' as const,
          generate_variants: false
        }
      };

      const contentResult = await contentAgent.executeTask(contentInput);
      
      expect(contentResult.success).toBe(true);
      expect(contentResult.recommendations.next_agent).toBe('design_specialist');
      expect(contentResult.recommendations.handoff_data).toBeDefined();

      // STEP 2: Передача в Design Specialist
      const designInput = {
        task_type: 'render_email' as const,
        content_package: {
          content: {
            subject: 'Test Subject',
            preheader: 'Test Preheader',
            body: 'Test Body',
            cta: 'Test CTA',
            language: 'ru',
            tone: 'friendly'
          }
        },
        handoff_data: contentResult.recommendations.handoff_data
      };

      const designResult = await designAgent.executeTask(designInput);

      expect(designResult.success).toBe(true);
      expect(designResult.recommendations.next_agent).toBe('quality_specialist');
      expect(designResult.recommendations.handoff_data).toBeDefined();
      expect(designResult.design_artifacts.html_output).toBeDefined();
    });

    test('🚫 Невалидные данные от Content должны блокировать Design', async () => {
      const invalidHandoffData = {
        content_package: {
          complete_content: {
            subject: '', // КРИТИЧЕСКАЯ ОШИБКА: пустой subject
            preheader: '',
            body: '',
            cta: ''
          }
        }
        // Отсутствуют обязательные поля trace_id, timestamp
      };

      const designInput = {
        task_type: 'render_email' as const,
        content_package: {
          content: {
            subject: '',
            preheader: '',
            body: '',
            cta: '',
            language: 'ru',
            tone: 'friendly'
          }
        },
        handoff_data: invalidHandoffData
      };

      // Ожидаем что будет выброшена ошибка валидации
      await expect(designAgent.executeTask(designInput)).rejects.toThrow();
    });

    test('🤖 AI коррекция должна спасать частично невалидные данные', async () => {
      // Mock AI Corrector для успешной коррекции
      const mockRun = vi.mocked(await import('@openai/agents')).run;
      mockRun.mockResolvedValue(JSON.stringify({
        content_package: {
          complete_content: {
            subject: 'AI Corrected Subject',
            preheader: 'AI Corrected Preheader',
            body: 'AI corrected body content with sufficient length.',
            cta: 'AI Corrected CTA'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 10,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['quality'],
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
          topic: 'travel',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-corrected-123',
        timestamp: new Date().toISOString()
      }) as any);

      const partiallyInvalidData = {
        content_package: {
          complete_content: {
            subject: 'Valid Subject',
            preheader: '',  // Будет исправлено AI
            body: 'Valid body content',
            cta: ''  // Будет исправлено AI
          }
        },
        trace_id: 'invalid-format',  // Будет исправлено AI
        timestamp: 'invalid-date'    // Будет исправлено AI
      };

      const designInput = {
        task_type: 'render_email' as const,
        content_package: {
          content: {
            subject: 'Valid Subject',
            preheader: 'Valid Preheader',
            body: 'Valid Body',
            cta: 'Valid CTA',
            language: 'ru',
            tone: 'friendly'
          }
        },
        handoff_data: partiallyInvalidData
      };

      const designResult = await designAgent.executeTask(designInput);
      
      expect(designResult.success).toBe(true);
      expect(mockRun).toHaveBeenCalled(); // AI коррекция была вызвана
    });
  });

  describe('🎨➡️🔍 Design → Quality Pipeline', () => {
    test('✅ Валидный design output должен проходить в Quality', async () => {
      const validDesignData = {
        email_package: {
          html_output: '<!DOCTYPE html><html><head><title>Valid</title></head><body><h1>Valid Email</h1><p>Valid content for testing.</p></body></html>',
          mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Valid</mj-text></mj-column></mj-section></mj-body></mjml>',
          assets_used: ['logo.png'],
          rendering_metadata: {
            template_type: 'promotional',
            responsive_design: true,
            dark_mode_support: false,
            rendering_time_ms: 500,
            total_size_kb: 45  // В пределах лимита
          }
        },
        design_context: {
          visual_elements: ['header'],
          color_palette: ['#2B5CE6'],
          typography_choices: ['Arial'],
          layout_structure: 'standard'
        },
        brand_compliance: {
          guidelines_followed: true,
          brand_consistency_score: 90,
          deviation_notes: []
        },
        trace_id: 'dsn-valid-123',
        timestamp: new Date().toISOString()
      };

      const qualityInput = {
        task_type: 'analyze_quality' as const,
        email_package: {
          html_output: validDesignData.email_package.html_output,
          mjml_source: validDesignData.email_package.mjml_source,
          assets_used: validDesignData.email_package.assets_used
        },
        handoff_data: validDesignData
      };

      const qualityResult = await qualityAgent.executeTask(qualityInput);

      expect(qualityResult.success).toBe(true);
      expect(qualityResult.quality_report.overall_score).toBeGreaterThanOrEqual(70);
      expect(qualityResult.recommendations.handoff_data).toBeDefined();
    });

    test('🚫 Превышение размера должно блокировать Quality', async () => {
      const oversizedDesignData = {
        email_package: {
          html_output: '<!DOCTYPE html><html><body>' + 'x'.repeat(200000) + '</body></html>', // >100KB
          rendering_metadata: {
            total_size_kb: 200  // Превышает лимит
          }
        }
      };

      const qualityInput = {
        task_type: 'analyze_quality' as const,
        email_package: {
          html_output: oversizedDesignData.email_package.html_output
        },
        handoff_data: oversizedDesignData
      };

      await expect(qualityAgent.executeTask(qualityInput)).rejects.toThrow();
    });
  });

  describe('🔍➡️🚀 Quality → Delivery Pipeline', () => {
    test('✅ Высокое качество должно проходить в Delivery', async () => {
      const highQualityData = {
        quality_assessment: {
          overall_score: 85,  // Выше минимального 70
          html_validation: {
            w3c_compliant: true,
            validation_errors: [],
            semantic_correctness: true
          },
          email_compliance: {
            client_compatibility_score: 95,
            spam_score: 2,
            deliverability_rating: 'excellent'
          },
          accessibility: {
            wcag_aa_compliant: true,
            accessibility_score: 90,
            screen_reader_compatible: true
          },
          performance: {
            load_time_ms: 800,
            file_size_kb: 45,
            image_optimization_score: 90,
            css_efficiency_score: 85
          }
        },
        test_results: {
          cross_client_tests: [
            { client: 'gmail', status: 'passed', score: 95 }
          ],
          device_compatibility: [
            { device: 'desktop', status: 'passed' }
          ],
          rendering_verification: {
            screenshots_generated: true,
            visual_regression_passed: true,
            rendering_consistency_score: 92
          }
        },
        optimization_applied: {
          performance_optimizations: ['minification'],
          code_minification: true,
          image_compression: true,
          css_inlining: true
        },
        trace_id: 'qlt-high-quality-123',
        timestamp: new Date().toISOString()
      };

      const deliveryInput = {
        task_type: 'finalize_delivery' as const,
        email_package: {
          html_output: '<!DOCTYPE html><html><body><h1>High Quality Email</h1></body></html>',
          quality_score: 85,
          compliance_status: { overall: 'pass' }
        },
        handoff_data: highQualityData
      };

      const deliveryResult = await deliveryAgent.executeTask(deliveryInput);

      expect(deliveryResult.success).toBe(true);
      expect(deliveryResult.recommendations.handoff_complete).toBe(true);
    });

    test('❌ Низкое качество должно блокировать Delivery', async () => {
      const lowQualityData = {
        quality_assessment: {
          overall_score: 45,  // Ниже минимального 70
          html_validation: {
            w3c_compliant: false,
            validation_errors: ['Multiple errors'],
            semantic_correctness: false
          },
          accessibility: {
            wcag_aa_compliant: false,
            accessibility_score: 30
          }
        }
      };

      const deliveryInput = {
        task_type: 'finalize_delivery' as const,
        email_package: {
          html_output: '<div>Low quality HTML</div>',
          quality_score: 45,
          compliance_status: { overall: 'fail' }
        },
        handoff_data: lowQualityData
      };

      await expect(deliveryAgent.executeTask(deliveryInput)).rejects.toThrow();
    });
  });

  describe('🔄 Full End-to-End Pipeline', () => {
    test('✅ Полный пайплайн Content → Design → Quality → Delivery', async () => {
      // Mock успешных AI ответов для всех этапов
      const mockRun = vi.mocked(await import('@openai/agents')).run;
      
      // Mock для Content → Design коррекции
      mockRun.mockResolvedValueOnce(JSON.stringify({
        content_package: {
          complete_content: {
            subject: 'End-to-End Test Subject',
            preheader: 'End-to-End Test Preheader', 
            body: 'End-to-End test body content with sufficient length for validation.',
            cta: 'End-to-End Test CTA'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 12,
            reading_time: 1
          },
          brand_guidelines: {
            voice_tone: 'professional',
            key_messages: ['quality'],
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
          topic: 'travel',
          target_audience: 'general',
          urgency_level: 'medium'
        },
        trace_id: 'e2e-content-123',
        timestamp: new Date().toISOString()
      }) as any);

      // Mock для Design → Quality коррекции
      mockRun.mockResolvedValueOnce(JSON.stringify({
        email_package: {
          html_output: '<!DOCTYPE html><html><head><title>E2E</title></head><body><h1>End-to-End Email</h1><p>Complete pipeline test content.</p></body></html>',
          mjml_source: '<mjml><mj-body><mj-text>E2E</mj-text></mj-body></mjml>',
          assets_used: [],
          rendering_metadata: {
            template_type: 'promotional',
            responsive_design: true,
            dark_mode_support: false,
            rendering_time_ms: 400,
            total_size_kb: 35
          }
        },
        design_context: {
          visual_elements: ['header'],
          color_palette: ['#2B5CE6'],
          typography_choices: ['Arial'],
          layout_structure: 'standard'
        },
        brand_compliance: {
          guidelines_followed: true,
          brand_consistency_score: 92,
          deviation_notes: []
        },
        trace_id: 'e2e-design-123',
        timestamp: new Date().toISOString()
      }) as any);

      // Mock для Quality → Delivery коррекции
      mockRun.mockResolvedValueOnce(JSON.stringify({
        quality_assessment: {
          overall_score: 88,
          html_validation: {
            w3c_compliant: true,
            validation_errors: [],
            semantic_correctness: true
          },
          email_compliance: {
            client_compatibility_score: 96,
            spam_score: 1,
            deliverability_rating: 'excellent'
          },
          accessibility: {
            wcag_aa_compliant: true,
            accessibility_score: 92,
            screen_reader_compatible: true
          },
          performance: {
            load_time_ms: 600,
            file_size_kb: 35,
            image_optimization_score: 95,
            css_efficiency_score: 90
          }
        },
        test_results: {
          cross_client_tests: [
            { client: 'gmail', status: 'passed', score: 98 },
            { client: 'outlook', status: 'passed', score: 94 }
          ],
          device_compatibility: [
            { device: 'desktop', status: 'passed' },
            { device: 'mobile', status: 'passed' }
          ],
          rendering_verification: {
            screenshots_generated: true,
            visual_regression_passed: true,
            rendering_consistency_score: 95
          }
        },
        optimization_applied: {
          performance_optimizations: ['minification', 'compression'],
          code_minification: true,
          image_compression: true,
          css_inlining: true
        },
        trace_id: 'e2e-quality-123',
        timestamp: new Date().toISOString()
      }) as any);

      // STEP 1: Content Generation
      const contentInput: ContentSpecialistInput = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'End-to-End Test Campaign',
          campaign_type: 'promotional' as const,
          target_audience: 'testers'
        }
      };

      const contentResult = await contentAgent.executeTask(contentInput);
      expect(contentResult.success).toBe(true);

      // STEP 2: Design Generation
      const designInput = {
        task_type: 'render_email' as const,
        content_package: {
          content: {
            subject: 'E2E Subject',
            preheader: 'E2E Preheader',
            body: 'E2E Body',
            cta: 'E2E CTA',
            language: 'ru',
            tone: 'friendly'
          }
        },
        handoff_data: contentResult.recommendations.handoff_data
      };

      const designResult = await designAgent.executeTask(designInput);
      expect(designResult.success).toBe(true);

      // STEP 3: Quality Analysis
      const qualityInput = {
        task_type: 'analyze_quality' as const,
        email_package: {
          html_output: designResult.design_artifacts.html_output!,
          mjml_source: designResult.design_artifacts.mjml_source,
          assets_used: designResult.design_artifacts.assets_used
        },
        handoff_data: designResult.recommendations.handoff_data
      };

      const qualityResult = await qualityAgent.executeTask(qualityInput);
      expect(qualityResult.success).toBe(true);
      expect(qualityResult.quality_report.overall_score).toBeGreaterThanOrEqual(70);

      // STEP 4: Final Delivery
      const deliveryInput = {
        task_type: 'finalize_delivery' as const,
        email_package: {
          html_output: designResult.design_artifacts.html_output!,
          quality_score: qualityResult.quality_report.overall_score,
          compliance_status: qualityResult.compliance_status
        },
        handoff_data: qualityResult.recommendations.handoff_data
      };

      const deliveryResult = await deliveryAgent.executeTask(deliveryInput);
      expect(deliveryResult.success).toBe(true);
      expect(deliveryResult.recommendations.handoff_complete).toBe(true);

      // Проверка трейсинга через весь пайплайн
      const contentTraceId = contentResult.recommendations.handoff_data.trace_id;
      expect(contentTraceId).toBeDefined();
      expect(contentTraceId).toMatch(/^e2e-content-/);
    });

    test('⚡ Полный пайплайн должен выполняться в разумное время', async () => {
      const startTime = Date.now();

      // Быстрый пайплайн с минимальными данными
      const quickInput = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Quick Test',
          campaign_type: 'promotional' as const,
          target_audience: 'general',
          urgency_level: 'low',
          geographic_scope: 'Local',
          seasonal_context: 'current'
        }
      };

      try {
        await contentAgent.executeTask(quickInput);
        const duration = Date.now() - startTime;
        
        // Должно выполняться быстрее максимального времени валидации
        expect(duration).toBeLessThan(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS * 4);
      } catch (error) {
        // Ошибка ожидаема из-за mock данных, главное - время выполнения
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(AGENT_CONSTANTS.HANDOFF_VALIDATION.MAX_VALIDATION_TIME_MS * 4);
      }
    });
  });

  describe('📊 Performance Metrics Integration', () => {
    test('📈 Все агенты должны собирать метрики производительности', async () => {
      const simpleInput: ContentSpecialistInput = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Metrics Test',
          campaign_type: 'informational' as const,
          target_audience: 'developers'
        }
      };

      try {
        await contentAgent.executeTask(simpleInput);
      } catch {
        // Ожидаемо из-за mock данных
      }

      const contentMetrics = contentAgent.getPerformanceMetrics();
      expect(contentMetrics.totalExecutions).toBeGreaterThan(0);
      expect(contentMetrics.averageExecutionTime).toBeGreaterThan(0);

      // Проверяем что все агенты имеют методы для метрик
      expect(typeof contentAgent.getPerformanceMetrics).toBe('function');
      expect(typeof designAgent.getPerformanceMetrics).toBe('function');
      expect(typeof qualityAgent.getPerformanceMetrics).toBe('function');
      expect(typeof deliveryAgent.getPerformanceMetrics).toBe('function');
    });

    test('🎯 Агенты должны предоставлять информацию о возможностях', () => {
      const contentCapabilities = contentAgent.getCapabilities();
      const designCapabilities = designAgent.getCapabilities();
      const qualityCapabilities = qualityAgent.getCapabilities();
      const deliveryCapabilities = deliveryAgent.getCapabilities();

      // Проверяем структуру capabilities
      expect(contentCapabilities.agent_id).toBeDefined();
      expect(contentCapabilities.specialization).toBeDefined();
      expect(contentCapabilities.tools).toBeInstanceOf(Array);
      expect(contentCapabilities.handoff_support).toBe(true);

      // Проверяем цепочку агентов
      expect(contentCapabilities.next_agents).toContain('design_specialist');
      expect(designCapabilities.next_agents).toContain('quality_specialist');
      expect(qualityCapabilities.next_agents).toContain('delivery_specialist');
      expect(deliveryCapabilities.next_agents).toHaveLength(0); // Финальный агент
    });
  });
});