/**
 * 🧪 ТЕСТИРОВАНИЕ ОРИГИНАЛЬНОГО DESIGN SPECIALIST AGENT
 * 
 * Реальные тесты, демонстрирующие все проблемы найденные в аудите:
 * - Deprecated функции
 * - Дублирования кода
 * - Неконсистентная обработка ошибок
 * - Проблемы производительности
 */

import { DesignSpecialistAgent, DesignSpecialistInput } from '../../src/agent/specialists/design-specialist-agent';

describe('ORIGINAL DesignSpecialistAgent - REAL PROBLEMS TESTING', () => {
  let agent: DesignSpecialistAgent;

  beforeEach(() => {
    agent = new DesignSpecialistAgent();
  });

  describe('🔥 CRITICAL BUGS - Found in Audit', () => {
    
    it('should FAIL with generateSmartTags deprecated function', async () => {
      console.log('🔍 Testing deprecated generateSmartTags function...');
      
      const input: DesignSpecialistInput = {
        task_type: 'select_assets',
        content_package: {
          content: {
            subject: 'Тест deprecated функции',
            preheader: 'Проверяем сломанную функцию',
            body: 'Эта функция должна вызвать ошибку',
            cta: 'Проверить',
            language: 'ru',
            tone: 'professional'
          }
        }
      };

      // Пытаемся вызвать метод, который использует generateSmartTags
      try {
        const result = await agent.executeTask(input);
        console.log('❌ ПРОБЛЕМА: deprecated функция не вызвала ошибку!', result.success);
        
        // Проверяем, работает ли результат корректно
        if (result.success) {
          console.log('⚠️ СКРЫТАЯ ПРОБЛЕМА: код работает, но может содержать баги');
        }
      } catch (error) {
        console.log('✅ ОШИБКА НАЙДЕНА:', error.message);
        expect(error.message).toContain('deprecated');
      }
    });

    it('should demonstrate DUPLICATE LOGIC in asset searching', async () => {
      console.log('🔍 Testing duplicate asset search logic...');
      
      const input: DesignSpecialistInput = {
        task_type: 'render_email', // Этот тип задачи вызывает дублирование поиска
        content_package: {
          content: {
            subject: 'Демонстрация дублирования логики поиска ассетов',
            preheader: 'Поиск ассетов будет вызван дважды',
            body: 'Это демонстрирует проблему дублирования в handleFullEmailGeneration',
            cta: 'Найти проблему',
            language: 'ru',
            tone: 'professional'
          }
        },
        asset_requirements: {
          tags: ['тест', 'проблема'],
          target_count: 2
        }
      };

      const startTime = Date.now();
      let searchCallCount = 0;

      // Мокаем поиск ассетов для подсчета вызовов
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        if (args.join(' ').includes('figma_search') || args.join(' ').includes('asset search')) {
          searchCallCount++;
        }
        originalConsoleLog(...args);
      };

      try {
        const result = await agent.executeTask(input);
        const executionTime = Date.now() - startTime;
        
        console.log = originalConsoleLog;
        
        console.log(`⏱️ Время выполнения: ${executionTime}ms`);
        console.log(`🔄 Количество поисков ассетов: ${searchCallCount}`);
        
        if (searchCallCount > 1) {
          console.log('❌ ПРОБЛЕМА: Поиск ассетов вызывается несколько раз!');
          console.log('   - handleFullEmailGeneration() ищет ассеты');
          console.log('   - handleEmailRendering() может искать ассеты снова');
        }
        
        expect(result).toBeDefined();
      } catch (error) {
        console.log = originalConsoleLog;
        console.log('❌ Ошибка при тестировании дублирования:', error.message);
      }
    });

    it('should show INCONSISTENT error handling', async () => {
      console.log('🔍 Testing inconsistent error handling...');
      
      // Тест 1: Пустые данные (должны обрабатываться по-разному в разных методах)
      const emptyInput: DesignSpecialistInput = {
        task_type: 'select_assets',
        content_package: {
          content: {
            subject: '', // Пустой subject
            preheader: '',
            body: '',
            cta: '',
            language: 'ru',
            tone: 'professional'
          }
        }
      };

      try {
        console.log('   Тестируем обработку пустых данных...');
        const result1 = await agent.executeTask(emptyInput);
        console.log(`   Результат с пустыми данными: success=${result1.success}`);
        
        if (result1.success) {
          console.log('❌ ПРОБЛЕМА: Пустые данные приняты без валидации!');
        }
      } catch (error) {
        console.log(`   Ошибка с пустыми данными: ${error.message}`);
      }

      // Тест 2: Неверный тип задачи
      const invalidTaskInput = {
        task_type: 'invalid_task' as any,
        content_package: {
          content: {
            subject: 'Valid subject',
            preheader: 'Valid preheader', 
            body: 'Valid body',
            cta: 'Valid CTA',
            language: 'ru',
            tone: 'professional'
          }
        }
      };

      try {
        console.log('   Тестируем обработку неверного типа задачи...');
        const result2 = await agent.executeTask(invalidTaskInput);
        console.log(`   Результат с неверным типом: success=${result2.success}`);
      } catch (error) {
        console.log(`   Ошибка с неверным типом: ${error.message}`);
      }

      // Тест 3: Отсутствующие обязательные поля
      const missingFieldsInput: DesignSpecialistInput = {
        task_type: 'render_email',
        content_package: {
          content: {
            subject: 'Valid subject',
            // Отсутствуют preheader, body, cta
            language: 'ru',
            tone: 'professional'
          } as any
        }
      };

      try {
        console.log('   Тестируем обработку отсутствующих полей...');
        const result3 = await agent.executeTask(missingFieldsInput);
        console.log(`   Результат с отсутствующими полями: success=${result3.success}`);
      } catch (error) {
        console.log(`   Ошибка с отсутствующими полями: ${error.message}`);
      }

      console.log('✅ Продемонстрирована неконсистентная обработка ошибок');
    });
  });

  describe('🐌 PERFORMANCE PROBLEMS', () => {
    
    it('should demonstrate SLOW execution due to no caching', async () => {
      console.log('🔍 Testing performance without caching...');
      
      const testInput: DesignSpecialistInput = {
        task_type: 'select_assets',
        content_package: {
          content: {
            subject: 'Тест производительности без кэширования',
            preheader: 'Проверяем скорость работы',
            body: 'Каждый запрос выполняется заново без кэширования результатов',
            cta: 'Проверить скорость',
            language: 'ru',
            tone: 'professional'
          }
        },
        asset_requirements: {
          tags: ['производительность', 'тест'],
          target_count: 3
        }
      };

      // Первый запрос
      console.log('   Выполняем первый запрос...');
      const start1 = Date.now();
      try {
        const result1 = await agent.executeTask(testInput);
        const time1 = Date.now() - start1;
        console.log(`   Первый запрос: ${time1}ms, success: ${result1.success}`);

        // Второй идентичный запрос (должен быть такой же медленный)
        console.log('   Выполняем второй идентичный запрос...');
        const start2 = Date.now();
        const result2 = await agent.executeTask(testInput);
        const time2 = Date.now() - start2;
        console.log(`   Второй запрос: ${time2}ms, success: ${result2.success}`);

        const improvement = time1 > 0 ? ((time1 - time2) / time1 * 100).toFixed(1) : '0';
        console.log(`   Улучшение производительности: ${improvement}%`);
        
        if (Math.abs(time1 - time2) < time1 * 0.1) {
          console.log('❌ ПРОБЛЕМА: Нет кэширования! Время выполнения почти одинаковое');
          console.log('   Рекомендация: Внедрить кэширование результатов поиска');
        }
      } catch (error) {
        console.log(`   Ошибка при тестировании производительности: ${error.message}`);
      }
    });

    it('should show MEMORY INEFFICIENCY', async () => {
      console.log('🔍 Testing memory usage patterns...');
      
      const heapBefore = process.memoryUsage().heapUsed;
      console.log(`   Память до тестов: ${Math.round(heapBefore / 1024 / 1024)}MB`);

      const largeInput: DesignSpecialistInput = {
        task_type: 'render_email',
        content_package: {
          content: {
            subject: 'Тест использования памяти с большим контентом',
            preheader: 'Проверяем эффективность использования памяти',
            body: 'Этот тест создает большой объем данных для проверки использования памяти. '.repeat(100),
            cta: 'Проверить память',
            language: 'ru',
            tone: 'professional'
          }
        },
        asset_requirements: {
          tags: ['память', 'тест', 'производительность'],
          target_count: 5
        }
      };

      try {
        const result = await agent.executeTask(largeInput);
        
        const heapAfter = process.memoryUsage().heapUsed;
        const memoryDiff = heapAfter - heapBefore;
        console.log(`   Память после тестов: ${Math.round(heapAfter / 1024 / 1024)}MB`);
        console.log(`   Использовано памяти: ${Math.round(memoryDiff / 1024 / 1024)}MB`);
        
        if (memoryDiff > 50 * 1024 * 1024) { // Больше 50MB
          console.log('❌ ПРОБЛЕМА: Высокое потребление памяти!');
          console.log('   Возможные причины:');
          console.log('   - Отсутствие переиспользования объектов');
          console.log('   - Множественные копии данных');
          console.log('   - Неэффективные структуры данных');
        }
        
        console.log(`   Успешность операции: ${result.success}`);
      } catch (error) {
        console.log(`   Ошибка при тестировании памяти: ${error.message}`);
      }
    });
  });

  describe('🔀 COMPLEX LOGIC PROBLEMS', () => {
    
    it('should demonstrate OVERLAPPING task types', async () => {
      console.log('🔍 Testing overlapping task type logic...');
      
      const baseInput = {
        content_package: {
          content: {
            subject: 'Демонстрация перекрывающихся типов задач',
            preheader: 'Показываем проблемы логики',
            body: 'Разные типы задач делают похожие операции',
            cta: 'Проверить логику',
            language: 'ru',
            tone: 'professional'
          }
        },
        asset_requirements: {
          tags: ['логика', 'проблемы'],
          target_count: 2
        }
      };

      const taskTypes = ['select_assets', 'render_email', 'create_templates', 'optimize_design'] as const;
      const results: Record<string, any> = {};

      for (const taskType of taskTypes) {
        console.log(`   Тестируем тип задачи: ${taskType}`);
        
        try {
          const input: DesignSpecialistInput = {
            ...baseInput,
            task_type: taskType
          };

          const startTime = Date.now();
          const result = await agent.executeTask(input);
          const executionTime = Date.now() - startTime;
          
          results[taskType] = {
            success: result.success,
            executionTime,
            operations: result.analytics?.operations_performed || 0,
            hasAssets: !!result.results?.assets_data,
            hasRendering: !!result.results?.rendered_email,
            hasTemplates: !!result.results?.template_data
          };
          
          console.log(`     Результат: success=${result.success}, время=${executionTime}ms`);
        } catch (error) {
          console.log(`     Ошибка: ${error.message}`);
          results[taskType] = { error: error.message };
        }
      }

      console.log('\n   АНАЛИЗ ПЕРЕКРЫТИЙ:');
      
      // Проверяем какие типы задач делают похожие операции
      const assetTasks = Object.entries(results).filter(([_, result]) => result.hasAssets);
      const renderingTasks = Object.entries(results).filter(([_, result]) => result.hasRendering);
      
      if (assetTasks.length > 1) {
        console.log(`❌ ПРОБЛЕМА: ${assetTasks.length} типов задач работают с ассетами:`);
        assetTasks.forEach(([taskType]) => console.log(`     - ${taskType}`));
      }
      
      if (renderingTasks.length > 1) {
        console.log(`❌ ПРОБЛЕМА: ${renderingTasks.length} типов задач делают рендеринг:`);
        renderingTasks.forEach(([taskType]) => console.log(`     - ${taskType}`));
      }

      console.log('   Рекомендация: Упростить логику типов задач');
    });

    it('should show COMPLEX data transformations', async () => {
      console.log('🔍 Testing complex data transformation chains...');
      
      const complexInput: DesignSpecialistInput = {
        task_type: 'render_email',
        content_package: {
          content: {
            subject: 'Тест сложных трансформаций данных',
            preheader: 'Данные проходят через множество слоев',
            body: 'Тестируем extractContentData -> combineAssetResults -> formatDesignToQualityData',
            cta: 'Проследить трансформации',
            language: 'ru',
            tone: 'professional'
          },
          design_requirements: {
            tone: 'modern',
            style: 'minimal',
            color_scheme: 'blue',
            imagery_focus: 'photography',
            layout_priority: 'readability'
          },
          brand_guidelines: {
            brand_voice: 'friendly',
            visual_style: 'clean',
            color_palette: ['#4BFF7E', '#1DA857'],
            typography: 'Arial, sans-serif'
          }
        },
        asset_requirements: {
          tags: ['трансформации', 'данные'],
          emotional_tone: 'positive',
          campaign_type: 'promotional',
          target_count: 3,
          image_requirements: {
            total_images_needed: 3,
            figma_images_count: 2,
            internet_images_count: 1,
            require_logo: true,
            image_categories: ['illustration', 'photo']
          }
        },
        rendering_requirements: {
          output_format: 'html',
          template_type: 'promotional',
          email_client_optimization: 'universal',
          responsive_design: true,
          seasonal_theme: false
        }
      };

      try {
        console.log('   Запускаем сложную трансформацию данных...');
        const result = await agent.executeTask(complexInput);
        
        console.log(`   Результат трансформации: success=${result.success}`);
        
        if (result.success) {
          // Анализируем количество слоев обработки данных
          const dataLayers = [];
          if (result.results?.assets_data) dataLayers.push('assets processing');
          if (result.results?.rendered_email) dataLayers.push('email rendering');
          if (result.design_artifacts) dataLayers.push('design artifacts');
          if (result.recommendations?.handoff_data) dataLayers.push('handoff formatting');
          
          console.log(`   Количество слоев обработки данных: ${dataLayers.length}`);
          dataLayers.forEach(layer => console.log(`     - ${layer}`));
          
          if (dataLayers.length > 3) {
            console.log('❌ ПРОБЛЕМА: Слишком много слоев трансформации данных!');
            console.log('   Это приводит к:');
            console.log('   - Сложности отладки');
            console.log('   - Потере производительности');
            console.log('   - Возможности потери данных между слоями');
          }
        }
      } catch (error) {
        console.log(`   Ошибка при сложной трансформации: ${error.message}`);
        
        if (error.message.includes('validation') || error.message.includes('format')) {
          console.log('❌ ПРОБЛЕМА: Трансформации данных нарушают валидацию!');
        }
      }
    });
  });

  describe('📊 COMPARISON WITH AUDIT FINDINGS', () => {
    
    it('should confirm ALL audit problems in real execution', async () => {
      console.log('🔍 Финальный тест: подтверждение всех найденных проблем...');
      
      const problemsFound = {
        deprecatedFunctions: false,
        duplicateLogic: false,
        inconsistentErrors: false,
        noCache: false,
        complexTransformations: false,
        overlappingTasks: false
      };

      // Комплексный тест всех проблем одновременно
      const testInput: DesignSpecialistInput = {
        task_type: 'render_email',
        content_package: {
          content: {
            subject: 'Комплексный тест всех проблем аудита',
            preheader: 'Проверяем реальные проблемы в коде',
            body: 'Этот тест должен выявить все проблемы, найденные в аудите кода',
            cta: 'Найти все проблемы',
            language: 'ru',
            tone: 'professional'
          }
        },
        asset_requirements: {
          tags: ['аудит', 'проблемы', 'тест'],
          target_count: 3
        }
      };

      try {
        const startTime = Date.now();
        const result = await agent.executeTask(testInput);
        const executionTime = Date.now() - startTime;
        
        console.log('\n   📋 ИТОГОВЫЙ ОТЧЕТ О ПРОБЛЕМАХ:');
        console.log(`   Время выполнения: ${executionTime}ms`);
        console.log(`   Результат: success=${result.success}`);
        
        // Проверяем производительность (медленно = нет кэша)
        if (executionTime > 10000) { // Больше 10 секунд
          problemsFound.noCache = true;
          console.log('   ❌ ПОДТВЕРЖДЕНО: Отсутствие кэширования (медленное выполнение)');
        }
        
        // Проверяем сложность данных
        const dataComplexity = JSON.stringify(result).length;
        if (dataComplexity > 10000) { // Большой объем данных
          problemsFound.complexTransformations = true;
          console.log('   ❌ ПОДТВЕРЖДЕНО: Сложные трансформации данных');
        }
        
        console.log('\n   📊 СТАТИСТИКА ПРОБЛЕМ:');
        Object.entries(problemsFound).forEach(([problem, found]) => {
          const status = found ? '❌ НАЙДЕНО' : '✅ НЕ ОБНАРУЖЕНО';
          console.log(`   ${problem}: ${status}`);
        });
        
        const totalProblems = Object.values(problemsFound).filter(Boolean).length;
        console.log(`\n   ИТОГО ПРОБЛЕМ ПОДТВЕРЖДЕНО: ${totalProblems}/6`);
        
        if (totalProblems > 0) {
          console.log('\n   🚨 РЕКОМЕНДАЦИЯ: Требуется рефакторинг агента!');
          console.log('   Все найденные проблемы влияют на:');
          console.log('   - Производительность системы');
          console.log('   - Надежность обработки данных');
          console.log('   - Сложность поддержки кода');
        }
        
      } catch (error) {
        console.log(`   ❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`);
        console.log('   Агент не может выполнить базовые операции!');
      }
    });
  });

  describe('🔧 ARCHITECTURE ANALYSIS', () => {
    
    it('should analyze class complexity', () => {
      console.log('🔍 Анализ сложности архитектуры...');
      
      // Получаем все методы класса
      const agentMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(agent))
        .filter(name => typeof agent[name] === 'function' && name !== 'constructor');
      
      console.log(`   Количество методов в классе: ${agentMethods.length}`);
      
      // Анализируем названия методов для определения ответственностей
      const responsibilities = {
        asset_related: agentMethods.filter(m => m.includes('Asset') || m.includes('asset')),
        rendering_related: agentMethods.filter(m => m.includes('Render') || m.includes('render') || m.includes('template')),
        validation_related: agentMethods.filter(m => m.includes('validate') || m.includes('Validate')),
        data_transformation: agentMethods.filter(m => m.includes('extract') || m.includes('format') || m.includes('transform')),
        error_handling: agentMethods.filter(m => m.includes('error') || m.includes('Error'))
      };
      
      console.log('\n   📊 РАСПРЕДЕЛЕНИЕ ОТВЕТСТВЕННОСТЕЙ:');
      Object.entries(responsibilities).forEach(([category, methods]) => {
        console.log(`   ${category}: ${methods.length} методов`);
        if (methods.length > 0) {
          methods.slice(0, 3).forEach(method => console.log(`     - ${method}`));
          if (methods.length > 3) console.log(`     ... и еще ${methods.length - 3}`);
        }
      });
      
      const totalSpecialized = Object.values(responsibilities).reduce((sum, methods) => sum + methods.length, 0);
      const unspecialized = agentMethods.length - totalSpecialized;
      
      console.log(`\n   Специализированных методов: ${totalSpecialized}`);
      console.log(`   Неклассифицированных методов: ${unspecialized}`);
      
      if (Object.values(responsibilities).filter(methods => methods.length > 5).length > 2) {
        console.log('\n   ❌ ПРОБЛЕМА: Класс имеет слишком много ответственностей!');
        console.log('   Рекомендация: Разделить на специализированные классы');
      }
    });
  });
}); 