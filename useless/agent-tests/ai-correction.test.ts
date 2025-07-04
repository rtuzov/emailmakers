/**
 * 🤖 ТЕСТЫ AI КОРРЕКЦИИ ДАННЫХ
 * 
 * Comprehensive testing suite для системы AI коррекции
 * Тестирует способность AI исправлять невалидные данные различных типов
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AICorrector, HandoffType } from '../validators/ai-corrector';
import { CorrectionSuggestion, AGENT_CONSTANTS } from '../types/base-agent-types';

// Mock OpenAI Agent для контролируемого тестирования
jest.mock('@openai/agents', () => ({
  Agent: jest.fn().mockImplementation(() => ({})),
  run: jest.fn()
}));

import { run } from '@openai/agents';

describe('🤖 AI Correction System Tests', () => {
  let aiCorrector: AICorrector;

  beforeEach(() => {
    aiCorrector = new AICorrector();
    jest.clearAllMocks();
  });

  describe('📝 Content-to-Design Correction', () => {
    test('✅ Должен исправлять пустые обязательные поля', async () => {
      // Mock успешного ответа от AI
      const mockAIResponse = {
        content_package: {
          complete_content: {
            subject: 'Исправленный заголовок специального предложения',
            preheader: 'Исправленный preheader с привлекательным описанием',
            body: 'Исправленный контент письма с подробной информацией о предложении и призывом к действию.',
            cta: 'Воспользоваться предложением'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 20,
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
          topic: 'путешествия',
          target_audience: 'travelers',
          urgency_level: 'medium'
        },
        trace_id: 'cnt-' + Date.now() + '-corrected',
        timestamp: new Date().toISOString()
      };

      (run as any).mockResolvedValue(JSON.stringify(mockAIResponse));

      const invalidData = {
        content_package: {
          complete_content: {
            subject: '', // Пустой subject
            preheader: '',
            body: '',
            cta: ''
          }
        }
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'content_package.complete_content.subject',
          issue: 'Пустой заголовок',
          suggestion: 'Добавить привлекательный заголовок',
          correctionPrompt: 'Создайте привлекательный заголовок для email кампании',
          priority: 'high'
        },
        {
          field: 'content_package.complete_content.cta',
          issue: 'Пустой CTA',
          suggestion: 'Добавить четкий призыв к действию',
          correctionPrompt: 'Создайте четкий призыв к действию',
          priority: 'high'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        invalidData,
        suggestions,
        'content-to-design'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.content_package.complete_content.subject).toBe('Исправленный заголовок специального предложения');
      expect(correctedData.content_package.complete_content.cta).toBe('Воспользоваться предложением');
      expect(run).toHaveBeenCalledTimes(1);
    });

    test('🔧 Должен исправлять неверные типы данных', async () => {
      const mockAIResponse = {
        content_package: {
          content_metadata: {
            language: 'ru', // Исправлено с 'invalid-lang'
            tone: 'friendly',
            word_count: 15, // Исправлено с отрицательного числа
            reading_time: 1
          }
        },
        design_requirements: {
          template_type: 'promotional', // Исправлено с 'invalid-type'
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        trace_id: 'cnt-' + Date.now() + '-uuid-format', // Исправлен формат
        timestamp: new Date().toISOString() // Исправлен формат даты
      };

      (run as any).mockResolvedValue(`\`\`\`json\n${JSON.stringify(mockAIResponse)}\n\`\`\``);

      const invalidData = {
        content_package: {
          content_metadata: {
            language: 'invalid-lang',
            tone: 'friendly',
            word_count: -5,
            reading_time: 1
          }
        },
        design_requirements: {
          template_type: 'invalid-type',
          visual_priority: 'balanced',
          layout_preferences: ['responsive'],
          color_scheme: 'warm_inviting'
        },
        trace_id: 'invalid-id-format',
        timestamp: 'invalid-date'
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'content_package.content_metadata.language',
          issue: 'Неверный код языка',
          suggestion: 'Использовать валидный код языка (ru или en)',
          correctionPrompt: 'Исправьте код языка на валидный',
          priority: 'high'
        },
        {
          field: 'content_package.content_metadata.word_count',
          issue: 'Отрицательное количество слов',
          suggestion: 'Установить положительное число',
          correctionPrompt: 'Подсчитайте корректное количество слов',
          priority: 'medium'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        invalidData,
        suggestions,
        'content-to-design'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.content_package.content_metadata.language).toBe('ru');
      expect(correctedData.content_package.content_metadata.word_count).toBe(15);
      expect(correctedData.design_requirements.template_type).toBe('promotional');
    });

    test('❌ Должен возвращать null после максимума попыток', async () => {
      // Mock AI возвращает невалидный ответ
      (run as any).mockResolvedValue('Invalid response');

      const invalidData = { invalid: 'data' };
      const suggestions: CorrectionSuggestion[] = [];

      // Первая попытка
      let result = await aiCorrector.correctData(invalidData, suggestions, 'content-to-design');
      expect(result).toBeNull();

      // Вторая попытка
      result = await aiCorrector.correctData(invalidData, suggestions, 'content-to-design');
      expect(result).toBeNull();

      // Третья попытка (должна быть последней)
      result = await aiCorrector.correctData(invalidData, suggestions, 'content-to-design');
      expect(result).toBeNull();

      // Четвертая попытка (должна быть заблокирована)
      result = await aiCorrector.correctData(invalidData, suggestions, 'content-to-design');
      expect(result).toBeNull();

      expect(run).toHaveBeenCalledTimes(3); // Только 3 попытки
    });
  });

  describe('🎨 Design-to-Quality Correction', () => {
    test('📏 Должен оптимизировать размер файлов', async () => {
      const mockAIResponse = {
        email_package: {
          html_output: '<!DOCTYPE html><html><head><title>Optimized</title></head><body><h1>Optimized Email</h1><p>Content optimized for size.</p></body></html>', // Сжатый HTML
          rendering_metadata: {
            template_type: 'promotional',
            responsive_design: true,
            dark_mode_support: false,
            rendering_time_ms: 400, // Улучшено с 2000ms
            total_size_kb: 80 // Уменьшено с 150KB
          }
        },
        design_context: {
          visual_elements: ['header', 'content'],
          color_palette: ['#2B5CE6'],
          typography_choices: ['Arial'],
          layout_structure: 'standard'
        },
        brand_compliance: {
          guidelines_followed: true,
          brand_consistency_score: 90,
          deviation_notes: []
        },
        trace_id: 'dsn-' + Date.now() + '-optimized',
        timestamp: new Date().toISOString()
      };

      (run as any).mockResolvedValue(JSON.stringify(mockAIResponse));

      const oversizedData = {
        email_package: {
          html_output: '<!DOCTYPE html><html><body>' + 'x'.repeat(200000) + '</body></html>', // Слишком большой
          rendering_metadata: {
            rendering_time_ms: 2000, // Слишком медленно
            total_size_kb: 150 // Превышает лимит 100KB
          }
        }
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'email_package.rendering_metadata.total_size_kb',
          issue: 'Превышен лимит размера файла',
          suggestion: 'Оптимизировать и сжать HTML контент до <100KB',
          correctionPrompt: 'Сожмите HTML контент, удалите лишние пробелы и оптимизируйте код для достижения размера менее 100KB',
          priority: 'high'
        },
        {
          field: 'email_package.rendering_metadata.rendering_time_ms',
          issue: 'Медленное время рендеринга',
          suggestion: 'Оптимизировать для времени рендеринга <1000ms',
          correctionPrompt: 'Упростите структуру HTML для ускорения рендеринга',
          priority: 'medium'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        oversizedData,
        suggestions,
        'design-to-quality'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.email_package.rendering_metadata.total_size_kb).toBeLessThanOrEqual(100);
      expect(correctedData.email_package.rendering_metadata.rendering_time_ms).toBeLessThan(1000);
    });

    test('🔧 Должен исправлять HTML структуру', async () => {
      const mockAIResponse = {
        email_package: {
          html_output: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html><head><meta charset="UTF-8"><title>Fixed Email</title></head><body><h1>Fixed Email Structure</h1><p>Properly structured HTML content.</p></body></html>', // Исправленный HTML
          mjml_source: '<mjml><mj-body><mj-section><mj-column><mj-text>Fixed</mj-text></mj-column></mj-section></mj-body></mjml>' // Валидный MJML
        }
      };

      (run as any).mockResolvedValue(JSON.stringify(mockAIResponse));

      const brokenData = {
        email_package: {
          html_output: '<div>Broken HTML without DOCTYPE', // Некорректный HTML
          mjml_source: '<mjml><invalid-tag>Broken MJML</invalid-tag></mjml>' // Некорректный MJML
        }
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'email_package.html_output',
          issue: 'Отсутствует DOCTYPE и некорректная HTML структура',
          suggestion: 'Добавить корректный DOCTYPE и исправить HTML структуру',
          correctionPrompt: 'Создайте валидный HTML с правильным DOCTYPE, метатегами и структурой для email',
          priority: 'high'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        brokenData,
        suggestions,
        'design-to-quality'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.email_package.html_output).toContain('<!DOCTYPE');
      expect(correctedData.email_package.html_output).toContain('<html>');
      expect(correctedData.email_package.html_output).toContain('<head>');
      expect(correctedData.email_package.html_output).toContain('<body>');
    });
  });

  describe('🔍 Quality-to-Delivery Correction', () => {
    test('📊 Должен повышать quality scores до минимальных требований', async () => {
      const mockAIResponse = {
        quality_assessment: {
          overall_score: 75, // Повышено с 50 до минимального 70+
          html_validation: {
            w3c_compliant: true, // Исправлено с false
            validation_errors: [], // Очищены ошибки
            semantic_correctness: true
          },
          email_compliance: {
            client_compatibility_score: 95, // Улучшено с 60
            spam_score: 2, // Снижено с 8
            deliverability_rating: 'excellent' // Улучшено с 'poor'
          },
          accessibility: {
            wcag_aa_compliant: true, // Исправлено с false
            accessibility_score: 85, // Повышено с 40
            screen_reader_compatible: true
          },
          performance: {
            load_time_ms: 800, // Улучшено с 3000
            file_size_kb: 95, // Уменьшено с 150
            image_optimization_score: 90, // Улучшено с 30
            css_efficiency_score: 85 // Улучшено с 25
          }
        },
        test_results: {
          cross_client_tests: [
            { client: 'gmail', status: 'passed', score: 95 }, // Исправлено
            { client: 'outlook', status: 'passed', score: 90 } // Исправлено
          ],
          device_compatibility: [
            { device: 'desktop', status: 'passed' }, // Исправлено
            { device: 'mobile', status: 'passed' } // Исправлено
          ],
          rendering_verification: {
            screenshots_generated: true, // Исправлено
            visual_regression_passed: true, // Исправлено
            rendering_consistency_score: 92 // Улучшено с 20
          }
        },
        optimization_applied: {
          performance_optimizations: ['minification', 'compression', 'image_optimization'], // Добавлены
          code_minification: true, // Исправлено
          image_compression: true, // Исправлено
          css_inlining: true // Исправлено
        },
        trace_id: 'qlt-' + Date.now() + '-corrected',
        timestamp: new Date().toISOString()
      };

      (run as any).mockResolvedValue(JSON.stringify(mockAIResponse));

      const lowQualityData = {
        quality_assessment: {
          overall_score: 50, // Ниже минимального
          html_validation: {
            w3c_compliant: false,
            validation_errors: ['Missing DOCTYPE'],
            semantic_correctness: false
          },
          accessibility: {
            wcag_aa_compliant: false,
            accessibility_score: 40
          },
          performance: {
            load_time_ms: 3000,
            file_size_kb: 150
          }
        }
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'quality_assessment.overall_score',
          issue: 'Quality score ниже минимального (70)',
          suggestion: 'Повысить общий балл качества до 70+',
          correctionPrompt: 'Улучшите все аспекты качества для достижения минимального балла 70+',
          priority: 'high'
        },
        {
          field: 'quality_assessment.accessibility.wcag_aa_compliant',
          issue: 'Не соответствует WCAG AA',
          suggestion: 'Обеспечить соответствие WCAG AA',
          correctionPrompt: 'Исправьте проблемы доступности для соответствия WCAG AA',
          priority: 'high'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        lowQualityData,
        suggestions,
        'quality-to-delivery'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.quality_assessment.overall_score).toBeGreaterThanOrEqual(AGENT_CONSTANTS.HANDOFF_VALIDATION.MIN_QUALITY_SCORE);
      expect(correctedData.quality_assessment.html_validation.w3c_compliant).toBe(true);
      expect(correctedData.quality_assessment.accessibility.wcag_aa_compliant).toBe(true);
      expect(correctedData.quality_assessment.performance.file_size_kb).toBeLessThanOrEqual(100);
    });

    test('🚫 Должен корректировать spam score и совместимость', async () => {
      const mockAIResponse = {
        quality_assessment: {
          email_compliance: {
            client_compatibility_score: 95, // Исправлено с 60
            spam_score: 1, // Снижено с 9
            deliverability_rating: 'excellent' // Улучшено
          },
          performance: {
            load_time_ms: 600, // Оптимизировано
            file_size_kb: 45 // Оптимизировано
          }
        },
        test_results: {
          cross_client_tests: [
            { client: 'gmail', status: 'passed', score: 98 },
            { client: 'outlook', status: 'passed', score: 94 },
            { client: 'apple_mail', status: 'passed', score: 96 }
          ]
        }
      };

      (run as any).mockResolvedValue(JSON.stringify(mockAIResponse));

      const problematicData = {
        quality_assessment: {
          email_compliance: {
            client_compatibility_score: 60, // Низкая совместимость
            spam_score: 9, // Высокий spam score
            deliverability_rating: 'poor'
          }
        }
      };

      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'quality_assessment.email_compliance.spam_score',
          issue: 'Высокий spam score (9)',
          suggestion: 'Снизить spam score до ≤3',
          correctionPrompt: 'Оптимизируйте контент и структуру для снижения spam score до безопасного уровня ≤3',
          priority: 'high'
        },
        {
          field: 'quality_assessment.email_compliance.client_compatibility_score',
          issue: 'Низкая совместимость с email клиентами',
          suggestion: 'Повысить совместимость до ≥95%',
          correctionPrompt: 'Исправьте проблемы совместимости с email клиентами для достижения 95%+ совместимости',
          priority: 'high'
        }
      ];

      const correctedData = await aiCorrector.correctData(
        problematicData,
        suggestions,
        'quality-to-delivery'
      );

      expect(correctedData).toBeDefined();
      expect(correctedData.quality_assessment.email_compliance.spam_score).toBeLessThanOrEqual(3);
      expect(correctedData.quality_assessment.email_compliance.client_compatibility_score).toBeGreaterThanOrEqual(95);
    });
  });

  describe('🛡️ Error Handling & Resilience', () => {
    test('❌ Должен обрабатывать сбой AI сервиса', async () => {
      // Mock сбоя AI
      (run as any).mockRejectedValue(new Error('AI service unavailable'));

      const invalidData = { test: 'data' };
      const suggestions: CorrectionSuggestion[] = [];

      const result = await aiCorrector.correctData(invalidData, suggestions, 'content-to-design');

      expect(result).toBeNull();
    });

    test('🔍 Должен корректно парсить различные форматы ответов AI', async () => {
      const testData = { test: 'corrected' };
      
      // Тест JSON в markdown блоке
      (run as any).mockResolvedValue(`\`\`\`json\n${JSON.stringify(testData)}\n\`\`\``);
      let result = await aiCorrector.correctData({}, [], 'content-to-design');
      expect(result).toEqual(testData);

      // Тест чистого JSON
      (run as any).mockResolvedValue(JSON.stringify(testData));
      result = await aiCorrector.correctData({}, [], 'content-to-design');
      expect(result).toEqual(testData);

      // Тест JSON в тексте
      (run as any).mockResolvedValue(`Here is the corrected data: ${JSON.stringify(testData)} - please use it.`);
      result = await aiCorrector.correctData({}, [], 'content-to-design');
      expect(result).toEqual(testData);
    });

    test('🧹 Должен очищать историю коррекций', () => {
      const initialStats = aiCorrector.getCorrectionStats();
      
      aiCorrector.clearCorrectionHistory();
      
      const clearedStats = aiCorrector.getCorrectionStats();
      expect(clearedStats.activeCorrections).toBe(0);
      expect(clearedStats.totalAttempts).toBe(0);
    });

    test('📊 Должен предоставлять точную статистику коррекций', async () => {
      // Mock успешной коррекции
      (run as any).mockResolvedValue('{"corrected": "data"}');

      await aiCorrector.correctData({}, [], 'content-to-design');
      await aiCorrector.correctData({}, [], 'design-to-quality');

      const stats = aiCorrector.getCorrectionStats();
      expect(stats.activeCorrections).toBeGreaterThanOrEqual(0);
      expect(stats.totalAttempts).toBeGreaterThanOrEqual(2);
    });
  });

  describe('🎯 Prompt Engineering Tests', () => {
    test('📝 Должен генерировать детальные промпты для разных типов handoff', async () => {
      const suggestions: CorrectionSuggestion[] = [
        {
          field: 'test_field',
          issue: 'Test issue',
          suggestion: 'Test suggestion',
          correctionPrompt: 'Test correction prompt',
          priority: 'high'
        }
      ];

      // Проверяем что AI получает правильные промпты для каждого типа
      (run as any).mockImplementation((agent, prompt) => {
        expect(prompt).toContain('КРИТИЧЕСКАЯ КОРРЕКЦИЯ ДАННЫХ');
        
        if (prompt.includes('content-to-design')) {
          expect(prompt).toContain('Subject: 1-100 символов');
          expect(prompt).toContain('CTA: 1-50 символов');
        } else if (prompt.includes('design-to-quality')) {
          expect(prompt).toContain('HTML контент: Корректный, валидный');
          expect(prompt).toContain('Размер файла: СТРОГО ≤100KB');
        } else if (prompt.includes('quality-to-delivery')) {
          expect(prompt).toContain('Quality score: ОБЯЗАТЕЛЬНО ≥70 баллов');
          expect(prompt).toContain('WCAG AA compliance: ОБЯЗАТЕЛЬНО true');
        }

        return Promise.resolve('{"corrected": "data"}');
      });

      await aiCorrector.correctData({}, suggestions, 'content-to-design');
      await aiCorrector.correctData({}, suggestions, 'design-to-quality');
      await aiCorrector.correctData({}, suggestions, 'quality-to-delivery');

      expect(run).toHaveBeenCalledTimes(3);
    });

    test('🔄 Должен корректно обрабатывать несколько попыток коррекции', async () => {
      let attemptCount = 0;
      
      (run as any).mockImplementation((agent, prompt) => {
        attemptCount++;
        expect(prompt).toContain(`ПОПЫТКА ${attemptCount}`);
        
        if (attemptCount < 3) {
          return Promise.resolve('invalid json'); // Первые 2 попытки неуспешны
        }
        return Promise.resolve('{"success": "corrected"}');
      });

      const result = await aiCorrector.correctData({}, [], 'content-to-design');
      
      expect(attemptCount).toBe(3);
      expect(result).toEqual({ success: 'corrected' });
    });
  });
});