/**
 * 🧪 DESIGN SPECIALIST AGENT V2 - COMPREHENSIVE TESTS
 * 
 * Тестирование всех исправлений и новой архитектуры:
 * - Разделение ответственности
 * - Отсутствие fallback логики
 * - Унифицированная обработка ошибок
 * - Кэширование и производительность
 */

import { 
  DesignSpecialistAgentV2, 
  DesignSpecialistInputV2, 
  DesignSpecialistOutputV2, 
  DesignTaskType 
} from '../../src/agent/specialists/design-specialist-agent-v2';

describe('DesignSpecialistAgentV2', () => {
  let agent: DesignSpecialistAgentV2;

  beforeEach(() => {
    agent = new DesignSpecialistAgentV2();
    // Очищаем кэши перед каждым тестом
    agent.clearCaches();
  });

  describe('Initialization', () => {
    it('should initialize all services correctly', () => {
      const capabilities = agent.getCapabilities();
      
      expect(capabilities.agent_id).toBe('design-specialist-v2');
      expect(capabilities.version).toBe('2.0');
      expect(capabilities.supported_tasks).toContain('find_assets');
      expect(capabilities.supported_tasks).toContain('render_email');
      expect(capabilities.supported_tasks).toContain('optimize_design');
      expect(capabilities.performance_metrics.error_recovery).toBe(false); // Строгий подход
    });

    it('should have proper service separation', () => {
      const perfStats = agent.getPerformanceStats();
      
      expect(perfStats).toHaveProperty('asset_manager');
      expect(perfStats).toHaveProperty('rendering_service');
      expect(perfStats).toHaveProperty('error_metrics');
      expect(perfStats).toHaveProperty('system_health');
    });
  });

  describe('Input Validation', () => {
    it('should reject null/undefined input', async () => {
      await expect(agent.executeTask(null as any)).rejects.toThrow('Input is required');
      await expect(agent.executeTask(undefined as any)).rejects.toThrow('Input is required');
    });

    it('should reject missing task_type', async () => {
      const input = {
        content_package: { subject: 'Test' }
      } as DesignSpecialistInputV2;

      await expect(agent.executeTask(input)).rejects.toThrow('task_type is required');
    });

    it('should reject invalid task_type', async () => {
      const input = {
        task_type: 'invalid_task' as DesignTaskType,
        content_package: { subject: 'Test' }
      };

      await expect(agent.executeTask(input)).rejects.toThrow('Invalid task_type');
    });

    it('should reject missing content_package', async () => {
      const input = {
        task_type: 'find_assets'
      } as DesignSpecialistInputV2;

      await expect(agent.executeTask(input)).rejects.toThrow('content_package is required');
    });
  });

  describe('Content Extraction', () => {
    it('should extract content correctly from complete_content structure', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            subject: 'Скидка 50% на авиабилеты!',
            preheader: 'Не упустите шанс',
            body: 'Друзья, у нас отличная новость для всех любителей путешествий!',
            cta: 'Забронировать сейчас'
          },
          content_metadata: {
            language: 'ru',
            tone: 'friendly',
            word_count: 15
          }
        }
      };

      const result = await agent.executeTask(input);
      expect(result.success).toBe(true);
      expect(result.task_type).toBe('find_assets');
    });

    it('should fail without required content fields', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            subject: 'Test' // Нет preheader, body, cta
          }
        }
      };

      const result = await agent.executeTask(input);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Preheader is required');
    });

    it('should fail with too short content', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            subject: 'AB', // Слишком короткий
            preheader: 'CD',
            body: 'Short',
            cta: 'X'
          }
        }
      };

      const result = await agent.executeTask(input);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be at least');
    });
  });

  describe('Find Assets Task', () => {
    const validInput: DesignSpecialistInputV2 = {
      task_type: 'find_assets',
      content_package: {
        complete_content: {
          subject: 'Путешествие мечты: авиабилеты со скидкой!',
          preheader: 'Открой мир с нами',
          body: 'Приглашаем вас в увлекательное путешествие! Специальные предложения на авиабилеты в самые популярные направления.',
          cta: 'Выбрать направление'
        },
        content_metadata: {
          language: 'ru',
          tone: 'friendly'
        }
      },
      asset_requirements: {
        tags: ['путешествия', 'самолет', 'отпуск'],
        emotional_tone: 'positive',
        campaign_type: 'promotional',
        target_count: 3,
        preferred_emotion: 'happy'
      }
    };

    it('should find assets successfully', async () => {
      const result = await agent.executeTask(validInput);
      
      expect(result.success).toBe(true);
      expect(result.task_type).toBe('find_assets');
      expect(result.results.assets).toBeDefined();
      expect(result.recommendations.next_actions).toContain('Use found assets for email rendering');
      expect(result.analytics.operations_performed).toBe(1);
      expect(result.analytics.confidence_score).toBeGreaterThanOrEqual(0);
    });

    it('should generate AI tags when none provided', async () => {
      const inputWithoutTags = {
        ...validInput,
        asset_requirements: {
          emotional_tone: 'positive' as const,
          campaign_type: 'promotional' as const,
          target_count: 3,
          preferred_emotion: 'happy' as const
        }
      };

      const result = await agent.executeTask(inputWithoutTags);
      
      // Должен успешно сгенерировать теги через AI
      expect(result.success).toBe(true);
      expect(result.results.assets?.search_metadata.query_tags.length).toBeGreaterThan(0);
    });

    it('should use caching for repeated requests', async () => {
      // Первый запрос
      const result1 = await agent.executeTask(validInput);
      const stats1 = agent.getPerformanceStats();
      
      // Второй идентичный запрос
      const result2 = await agent.executeTask(validInput);
      const stats2 = agent.getPerformanceStats();
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Второй запрос должен быть быстрее (кэширование)
      expect(result2.analytics.execution_time_ms).toBeLessThanOrEqual(result1.analytics.execution_time_ms);
    });
  });

  describe('Render Email Task', () => {
    const validInput: DesignSpecialistInputV2 = {
      task_type: 'render_email',
      content_package: {
        complete_content: {
          subject: 'Эксклюзивные предложения по авиабилетам',
          preheader: 'Только сегодня - специальные цены',
          body: 'Дорогие путешественники! Мы подготовили для вас невероятные предложения по авиабилетам в самые красивые уголки мира.',
          cta: 'Посмотреть предложения'
        },
        content_metadata: {
          language: 'ru',
          tone: 'professional'
        }
      },
      rendering_requirements: {
        template_type: 'promotional',
        email_client_optimization: 'universal',
        responsive_design: true,
        seasonal_theme: false,
        include_dark_mode: false
      }
    };

    it('should render email successfully', async () => {
      const result = await agent.executeTask(validInput);
      
      expect(result.success).toBe(true);
      expect(result.task_type).toBe('render_email');
      expect(result.results.rendering).toBeDefined();
      expect(result.results.rendering?.html_content).toContain('<html');
      expect(result.handoff_data).toBeDefined();
      expect(result.recommendations.next_agent).toBe('quality_specialist');
    });

    it('should choose correct rendering action based on requirements', async () => {
      const seasonalInput = {
        ...validInput,
        rendering_requirements: {
          ...validInput.rendering_requirements,
          seasonal_theme: true
        }
      };

      const result = await agent.executeTask(seasonalInput);
      expect(result.success).toBe(true);
      // Seasonal rendering должен применить сезонные элементы
    });

    it('should auto-search assets when none provided', async () => {
      const inputWithoutAssets = {
        ...validInput
        // Нет asset_requirements - должен автоматически найти ассеты
      };

      const result = await agent.executeTask(inputWithoutAssets);
      
      expect(result.success).toBe(true);
      expect(result.analytics.operations_performed).toBe(2); // Search + rendering
    });

    it('should create valid handoff data', async () => {
      const result = await agent.executeTask(validInput);
      
      expect(result.success).toBe(true);
      expect(result.handoff_data).toBeDefined();
      
      const handoff = result.handoff_data!;
      expect(handoff.email_package.html_content).toBeTruthy();
      expect(handoff.original_content.complete_content.subject).toBe(validInput.content_package.complete_content.subject);
      expect(handoff.trace_id).toBeTruthy();
      expect(handoff.timestamp).toBeTruthy();
    });
  });

  describe('Optimize Design Task', () => {
    const validInput: DesignSpecialistInputV2 = {
      task_type: 'optimize_design',
      content_package: {
        complete_content: {
          subject: 'Большая распродажа авиабилетов!',
          preheader: 'Скидки до 70% на популярные направления',
          body: 'Друзья! Невероятная возможность сэкономить на путешествиях. Мы предлагаем эксклюзивные скидки на авиабилеты.',
          cta: 'Купить билет'
        },
        content_metadata: {
          language: 'ru',
          tone: 'urgent'
        }
      },
      rendering_requirements: {
        template_type: 'promotional',
        email_client_optimization: 'all'
      }
    };

    it('should optimize design successfully', async () => {
      const result = await agent.executeTask(validInput);
      
      expect(result.success).toBe(true);
      expect(result.task_type).toBe('optimize_design');
      expect(result.results.optimization).toBeDefined();
      expect(result.recommendations.next_agent).toBe('delivery_specialist');
      expect(result.analytics.confidence_score).toBeGreaterThan(80); // Оптимизация должна иметь высокую уверенность
    });

    it('should reduce file size during optimization', async () => {
      const result = await agent.executeTask(validInput);
      
      expect(result.success).toBe(true);
      const optimization = result.results.optimization!;
      expect(optimization.performance_metrics.total_size_kb).toBeLessThan(100); // Должен быть меньше 100KB
    });
  });

  describe('Error Handling', () => {
    it('should handle content extraction errors properly', async () => {
      const invalidInput: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            // Отсутствует subject
            preheader: 'Test',
            body: 'Test body',
            cta: 'Test CTA'
          }
        }
      };

      const result = await agent.executeTask(invalidInput);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Subject is required');
      expect(result.trace_id).toBeTruthy();
      expect(result.analytics.operations_performed).toBe(0);
      expect(result.analytics.confidence_score).toBe(0);
    });

    it('should not use fallback logic', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            subject: '', // Пустой subject
            preheader: 'Test',
            body: 'Test body',
            cta: 'Test CTA'
          }
        }
      };

      const result = await agent.executeTask(input);
      
      // Должен строго проваливаться без fallback
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should provide meaningful error messages', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'render_email',
        content_package: {
          complete_content: {
            subject: 'AB', // Слишком короткий
            preheader: 'Test preheader',
            body: 'Test body content',
            cta: 'Test CTA'
          }
        }
      };

      const result = await agent.executeTask(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID:'); // Должен содержать error ID
      expect(result.recommendations.next_actions).toContain('Review error details');
    });
  });

  describe('Performance and Caching', () => {
    it('should track performance metrics accurately', async () => {
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          complete_content: {
            subject: 'Тестовый email для проверки производительности',
            preheader: 'Проверяем метрики',
            body: 'Этот email используется для тестирования системы отслеживания производительности.',
            cta: 'Продолжить тестирование'
          },
          content_metadata: {
            language: 'ru',
            tone: 'professional'
          }
        }
      };

      const result = await agent.executeTask(input);
      
      expect(result.success).toBe(true);
      expect(result.analytics.execution_time_ms).toBeGreaterThan(0);
      expect(result.analytics.execution_time_ms).toBeLessThan(30000); // Не более 30 секунд
      expect(result.analytics.operations_performed).toBeGreaterThan(0);
      expect(result.analytics.cache_hit_rate).toBeGreaterThanOrEqual(0);
    });

    it('should clear caches properly', () => {
      const statsBefore = agent.getPerformanceStats();
      
      agent.clearCaches();
      
      const statsAfter = agent.getPerformanceStats();
      
      // После очистки кэши должны быть пустыми
      expect(statsAfter.asset_manager.size).toBe(0);
      expect(statsAfter.rendering_service.size).toBe(0);
    });
  });

  describe('Task Type Unification', () => {
    it('should have only 3 main task types (no duplicates)', () => {
      const capabilities = agent.getCapabilities();
      
      expect(capabilities.supported_tasks).toHaveLength(3);
      expect(capabilities.supported_tasks).toEqual(['find_assets', 'render_email', 'optimize_design']);
    });

    it('should handle all task types without overlap', async () => {
      const baseInput = {
        content_package: {
          complete_content: {
            subject: 'Универсальный тест для всех типов задач',
            preheader: 'Проверяем каждый тип',
            body: 'Этот тест проверяет работу всех типов задач агента.',
            cta: 'Выполнить задачу'
          },
          content_metadata: {
            language: 'ru',
            tone: 'professional'
          }
        }
      };

      const taskTypes: DesignTaskType[] = ['find_assets', 'render_email', 'optimize_design'];
      
      for (const taskType of taskTypes) {
        const input: DesignSpecialistInputV2 = {
          ...baseInput,
          task_type: taskType
        };

        const result = await agent.executeTask(input);
        
        expect(result.success).toBe(true);
        expect(result.task_type).toBe(taskType);
      }
    });
  });

  describe('System Health Monitoring', () => {
    it('should report system health correctly', () => {
      const health = agent.getPerformanceStats().system_health;
      
      expect(health.status).toMatch(/healthy|degraded|critical/);
      expect(health.critical_errors_count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });

    it('should track error metrics', () => {
      const errorMetrics = agent.getPerformanceStats().error_metrics;
      
      expect(errorMetrics.total_errors).toBeGreaterThanOrEqual(0);
      expect(typeof errorMetrics.errors_by_type).toBe('object');
      expect(typeof errorMetrics.errors_by_severity).toBe('object');
      expect(errorMetrics.critical_errors_last_hour).toBeGreaterThanOrEqual(0);
    });
  });
}); 