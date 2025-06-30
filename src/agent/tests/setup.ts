/**
 * 🔧 TEST SETUP CONFIGURATION
 * 
 * Глобальная настройка для всех тестов валидации
 * Устанавливает моки, переменные окружения и общие настройки
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Глобальные моки для внешних зависимостей
beforeAll(() => {
  // Mock environment variables  
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!';
  
  // Mock OpenAI API
  vi.mock('@openai/agents', () => ({
    Agent: vi.fn().mockImplementation(() => ({
      name: 'test-agent',
      instructions: 'test instructions',
      model: 'gpt-4o-mini',
      tools: []
    })),
    run: vi.fn().mockResolvedValue('Mock AI Response'),
    tool: vi.fn().mockImplementation((config) => config),
    withTrace: vi.fn().mockImplementation((name, fn) => fn()),
    generateTraceId: vi.fn().mockReturnValue('test-trace-id-123456'),
    getCurrentTrace: vi.fn().mockReturnValue({ id: 'test-trace-id-123456' })
  }));

  // Mock file system operations
  vi.mock('fs/promises', () => ({
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('mock file content'),
    access: vi.fn().mockResolvedValue(undefined)
  }));

  // Mock path operations
  vi.mock('path', () => ({
    join: vi.fn().mockImplementation((...args) => args.join('/')),
    resolve: vi.fn().mockImplementation((...args) => '/' + args.join('/')),
    dirname: vi.fn().mockImplementation((path) => path.split('/').slice(0, -1).join('/')),
    basename: vi.fn().mockImplementation((path) => path.split('/').pop())
  }));

  // Mock model configuration
  vi.mock('../../shared/utils/model-config', () => ({
    getUsageModel: vi.fn().mockReturnValue('gpt-4o-mini')
  }));

  // Console warnings для критических ошибок валидации
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = vi.fn().mockImplementation((...args) => {
    // Выводим критические предупреждения валидации
    if (args.some(arg => typeof arg === 'string' && 
        (arg.includes('валидацию') || arg.includes('validation') || arg.includes('КРИТИЧЕСКАЯ')))) {
      originalConsoleWarn.apply(console, args);
    }
  });
  
  console.error = vi.fn().mockImplementation((...args) => {
    // Выводим все ошибки валидации
    if (args.some(arg => typeof arg === 'string' && 
        (arg.includes('валидация') || arg.includes('validation') || arg.includes('ERROR')))) {
      originalConsoleError.apply(console, args);
    }
  });

  console.log('🧪 Test environment initialized with zero tolerance validation setup');
});

// Очистка перед каждым тестом
beforeEach(() => {
  // Очищаем все моки
  vi.clearAllMocks();
  
  // Сбрасываем таймеры
  vi.clearAllTimers();
  vi.useFakeTimers({
    shouldAdvanceTime: true
  });
  
  // Устанавливаем начальную дату для консистентности
  vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
});

// Очистка после каждого теста
afterEach(() => {
  // Восстанавливаем реальные таймеры
  vi.useRealTimers();
  
  // Очищаем предупреждения и ошибки
  vi.clearAllMocks();
});

// Глобальная очистка
afterAll(() => {
  // Восстанавливаем оригинальные функции
  vi.restoreAllMocks();
  
  console.log('🧹 Test environment cleaned up');
});

// Глобальные утилиты для тестов
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidHandoffData(): any;
      toPassZeroToleranceValidation(): any;
      toMeetQualityStandards(): any;
    }
  }
}

// Кастомные матчеры для валидации
expect.extend({
  toBeValidHandoffData(received: any) {
    const isValid = received && 
                   typeof received === 'object' &&
                   received.trace_id &&
                   received.timestamp &&
                   !Array.isArray(received);
    
    return {
      pass: isValid,
      message: () => isValid
        ? `Expected object not to be valid handoff data`
        : `Expected object to be valid handoff data with trace_id and timestamp`
    };
  },

  toPassZeroToleranceValidation(received: any) {
    const passes = received &&
                  received.isValid === true &&
                  Array.isArray(received.errors) &&
                  received.errors.length === 0;
    
    return {
      pass: passes,
      message: () => passes
        ? `Expected validation not to pass zero tolerance standards`
        : `Expected validation to pass zero tolerance standards (isValid: true, no errors)`
    };
  },

  toMeetQualityStandards(received: any) {
    const meetsStandards = received &&
                          typeof received.overall_score === 'number' &&
                          received.overall_score >= 70 &&
                          received.wcag_aa_compliant === true;
    
    return {
      pass: meetsStandards,
      message: () => meetsStandards
        ? `Expected data not to meet quality standards`
        : `Expected data to meet quality standards (score ≥70, WCAG AA compliant)`
    };
  }
});

// Утилиты для создания тестовых данных
export const createValidContentToDesignData = () => ({
  content_package: {
    complete_content: {
      subject: 'Test Email Subject for Validation',
      preheader: 'Test Email Preheader for Validation Testing',
      body: 'Test email body content with sufficient length for validation purposes and meaningful content structure.',
      cta: 'Test Call to Action'
    },
    content_metadata: {
      language: 'ru' as const,
      tone: 'friendly' as const,
      word_count: 18,
      reading_time: 1
    },
    brand_guidelines: {
      voice_tone: 'professional' as const,
      key_messages: ['качество', 'тестирование'],
      compliance_notes: []
    }
  },
  design_requirements: {
    template_type: 'promotional' as const,
    visual_priority: 'balanced' as const,
    layout_preferences: ['responsive', 'clean'],
    color_scheme: 'warm_inviting'
  },
  campaign_context: {
    topic: 'тестирование валидации',
    target_audience: 'developers',
    urgency_level: 'medium' as const
  },
  trace_id: crypto.randomUUID(),
  timestamp: new Date().toISOString()
});

export const createValidDesignToQualityData = () => ({
  email_package: {
    html_output: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><meta charset="UTF-8"><title>Test Email</title></head><body><h1>Test Email for Validation</h1><p>This is a comprehensive test email with proper structure and sufficient content for thorough validation testing.</p></body></html>',
    mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Test Email for Validation</mj-text></mj-column></mj-section></mj-body></mjml>',
    assets_used: ['test-logo.png', 'test-banner.jpg'],
    rendering_metadata: {
      template_type: 'promotional' as const,
      responsive_design: true,
      dark_mode_support: false,
      rendering_time_ms: 450,
      total_size_kb: 65
    }
  },
  design_context: {
    visual_elements: ['header', 'content', 'footer'],
    color_palette: ['#2B5CE6', '#FF6B6B'],
    typography_choices: ['Arial', 'Helvetica'],
    layout_structure: 'standard'
  },
  brand_compliance: {
    guidelines_followed: true,
    brand_consistency_score: 88,
    deviation_notes: []
  },
  trace_id: crypto.randomUUID(),
  timestamp: new Date().toISOString()
});

export const createValidQualityToDeliveryData = () => ({
  quality_assessment: {
    overall_score: 85,
    html_validation: {
      w3c_compliant: true,
      validation_errors: [],
      semantic_correctness: true
    },
    email_compliance: {
      client_compatibility_score: 96,
      spam_score: 2,
      deliverability_rating: 'excellent' as const
    },
    accessibility: {
      wcag_aa_compliant: true,
      accessibility_score: 90,
      screen_reader_compatible: true
    },
    performance: {
      load_time_ms: 750,
      file_size_kb: 65,
      image_optimization_score: 92,
      css_efficiency_score: 88
    }
  },
  test_results: {
    cross_client_tests: [
      { client: 'gmail', status: 'passed', score: 96 },
      { client: 'outlook', status: 'passed', score: 92 }
    ],
    device_compatibility: [
      { device: 'desktop', status: 'passed' },
      { device: 'mobile', status: 'passed' }
    ],
    rendering_verification: {
      screenshots_generated: true,
      visual_regression_passed: true,
      rendering_consistency_score: 94
    }
  },
  optimization_applied: {
    performance_optimizations: ['minification', 'compression'],
    code_minification: true,
    image_compression: true,
    css_inlining: true
  },
  trace_id: crypto.randomUUID(),
  timestamp: new Date().toISOString()
});

console.log('🔧 Test utilities and custom matchers loaded successfully');