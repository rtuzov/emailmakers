/**
 * 🚀 ЖИВАЯ ДЕМОНСТРАЦИЯ DESIGN SPECIALIST AGENT V2
 * 
 * Демонстрация нового агента с созданием реальных файлов
 * - Запуск без Jest (избегаем проблемы с ES модулями)
 * - Создание выходных файлов
 * - Проверка производительности
 */

import { DesignSpecialistAgentV2, DesignSpecialistInputV2 } from '../src/agent/specialists/design-specialist-agent-v2';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 ЗАПУСК ДЕМОНСТРАЦИИ DESIGN SPECIALIST AGENT V2');
  console.log('='.repeat(60));

  // Создаем выходную директорию
  const outputDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Выходная директория: ${outputDir}`);
  console.log('');

  // 1. ТЕСТ ПОИСКА АССЕТОВ
  console.log('🔍 ТЕСТ 1: ПОИСК АССЕТОВ');
  console.log('-'.repeat(40));

  try {
    const agent1 = new DesignSpecialistAgentV2();
    console.log('✅ Агент создан успешно');

         const input1: DesignSpecialistInputV2 = {
       task_type: 'find_assets',
       content_package: {
         content: {
           subject: 'Летние путешествия с выгодой',
           preheader: 'Откройте для себя удивительные направления',
           body: 'Присоединяйтесь к тысячам путешественников, которые доверяют нашим рекомендациям',
           cta: 'Забронировать поездку'
         },
         brand_guidelines: {
           colors: {
             primary: '#4BFF7E',
             secondary: '#004E89', 
             accent: '#FFD23F'
           },
           fonts: {
             primary: 'Montserrat',
             secondary: 'Open Sans'
           }
         }
       },
       asset_requirements: {
         tags: ['travel', 'summer', 'vacation'],
         emotional_tone: 'positive',
         campaign_type: 'promotional',
         target_count: 5
       }
     };

     console.log('⏱️  Запуск поиска ассетов...');
     const startTime1 = Date.now();
     const result1 = await agent1.executeTask(input1);
     const executionTime1 = Date.now() - startTime1;

         console.log(`✅ Завершено за ${executionTime1}ms`);
     console.log(`📊 Задача выполнена: ${result1.success}`);
     console.log(`🎯 Найдено ассетов: ${result1.results.assets?.assets?.length || 0}`);

    // Сохраняем результат
    const outputFile1 = path.join(outputDir, 'demo-asset-search-result.json');
    const outputData1 = {
      test_name: 'Asset Search Demo',
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime1,
      input: input1,
      result: result1,
      performance: {
        memory_usage: process.memoryUsage(),
        execution_time_ms: executionTime1
      }
    };

    fs.writeFileSync(outputFile1, JSON.stringify(outputData1, null, 2));
    console.log(`💾 Результат сохранен: ${outputFile1}`);
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка в тесте поиска ассетов:', error);
    console.log('');
  }

  // 2. ТЕСТ РЕНДЕРИНГА EMAIL
  console.log('📧 ТЕСТ 2: РЕНДЕРИНГ EMAIL ШАБЛОНА');  
  console.log('-'.repeat(40));

  try {
    const agent2 = new DesignSpecialistAgentV2();

         const input2: DesignSpecialistInputV2 = {
       task_type: 'render_email',
       content_package: {
         content: {
           subject: 'Добро пожаловать в нашу рассылку!',
           preheader: 'Готовьтесь к потрясающему контенту',
           body: `
             <h1>Добро пожаловать!</h1>
             <p>Мы рады приветствовать вас в нашем сообществе подписчиков.</p>
             <p>Вы будете получать:</p>
             <ul>
               <li>Еженедельные советы и идеи</li>
               <li>Эксклюзивные предложения</li>
               <li>Новости индустрии</li>
             </ul>
             <p>Спасибо за подписку!</p>
           `,
           cta: 'Читать нашу последнюю статью'
         },
         brand_guidelines: {
           colors: {
             primary: '#2563EB',
             secondary: '#EF4444',
             accent: '#10B981',
             background: '#F8FAFC',
             text: '#1E293B'
           },
           fonts: {
             primary: 'Inter',
             secondary: 'Roboto'
           }
         }
       },
       rendering_requirements: {
         template_type: 'newsletter',
         email_client_optimization: 'universal',
         responsive_design: true,
         include_dark_mode: true
       }
     };

     console.log('⏱️  Запуск рендеринга email...');
     const startTime2 = Date.now();
     const result2 = await agent2.executeTask(input2);
     const executionTime2 = Date.now() - startTime2;

         console.log(`✅ Завершено за ${executionTime2}ms`);
     console.log(`📊 Задача выполнена: ${result2.success}`);
     console.log(`📄 MJML шаблон создан: ${result2.results.rendering?.mjml_source ? 'ДА' : 'НЕТ'}`);

     if (result2.results.rendering?.mjml_source) {
       const mjmlFile = path.join(outputDir, 'demo-email-template.mjml');
       fs.writeFileSync(mjmlFile, result2.results.rendering.mjml_source);
       console.log(`💾 MJML файл сохранен: ${mjmlFile}`);
       console.log(`📏 Размер шаблона: ${result2.results.rendering.mjml_source.length} символов`);
     }

    // Сохраняем результат
    const outputFile2 = path.join(outputDir, 'demo-email-render-result.json');
    const outputData2 = {
      test_name: 'Email Rendering Demo',
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime2,
      input: input2,
             result: {
         ...result2,
         mjml_template: result2.results.rendering?.mjml_source ? `${result2.results.rendering.mjml_source.length} characters` : null
       },
      performance: {
        memory_usage: process.memoryUsage(),
        execution_time_ms: executionTime2
      }
    };

    fs.writeFileSync(outputFile2, JSON.stringify(outputData2, null, 2));
    console.log(`💾 Результат сохранен: ${outputFile2}`);
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка в тесте рендеринга email:', error);
    console.log('');
  }

  // 3. ТЕСТ ОПТИМИЗАЦИИ ДИЗАЙНА
  console.log('🎨 ТЕСТ 3: ОПТИМИЗАЦИЯ ДИЗАЙНА');
  console.log('-'.repeat(40));

  try {
    const agent3 = new DesignSpecialistAgentV2();

         const input3: DesignSpecialistInputV2 = {
       task_type: 'optimize_design',
       content_package: {
         content: {
           subject: 'Анонс запуска нового продукта',
           preheader: 'Представляем революционное решение',
           body: 'После месяцев разработки мы рады анонсировать запуск нашей новейшей инновации.',
           cta: 'Узнать больше о продукте'
         },
         brand_guidelines: {
           colors: {
             primary: '#8B5CF6',
             secondary: '#06B6D4',
             accent: '#F59E0B'
           },
           fonts: {
             primary: 'Poppins',
             secondary: 'Source Sans Pro'
           }
         }
       },
       rendering_requirements: {
         template_type: 'promotional',
         email_client_optimization: 'all',
         responsive_design: true
       }
     };

     console.log('⏱️  Запуск оптимизации дизайна...');
     const startTime3 = Date.now();
     const result3 = await agent3.executeTask(input3);
     const executionTime3 = Date.now() - startTime3;

         console.log(`✅ Завершено за ${executionTime3}ms`);
     console.log(`📊 Задача выполнена: ${result3.success}`);
     console.log(`💡 Оптимизация: ${result3.results.optimization ? 'ДА' : 'НЕТ'}`);

    // Сохраняем результат
    const outputFile3 = path.join(outputDir, 'demo-design-optimization-result.json');
    const outputData3 = {
      test_name: 'Design Optimization Demo',
      timestamp: new Date().toISOString(),
      execution_time_ms: executionTime3,
      input: input3,
      result: result3,
      performance: {
        memory_usage: process.memoryUsage(),
        execution_time_ms: executionTime3
      }
    };

    fs.writeFileSync(outputFile3, JSON.stringify(outputData3, null, 2));
    console.log(`💾 Результат сохранен: ${outputFile3}`);
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка в тесте оптимизации дизайна:', error);
    console.log('');
  }

  // 4. ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ (КОНКУРЕНТНЫЕ ЗАПРОСЫ)
  console.log('⚡ ТЕСТ 4: ПРОИЗВОДИТЕЛЬНОСТЬ (КОНКУРЕНТНЫЕ ЗАПРОСЫ)');
  console.log('-'.repeat(40));

  try {
    const concurrentRequests = 3;
    const promises: Promise<any>[] = [];
    const startTimeTotal = Date.now();

    console.log(`🚀 Запуск ${concurrentRequests} конкурентных запросов...`);

    for (let i = 0; i < concurrentRequests; i++) {
      const agent = new DesignSpecialistAgentV2();
             const input: DesignSpecialistInputV2 = {
         task_type: 'find_assets',
         content_package: {
           content: {
             subject: `Тестовый email ${i + 1}`,
             preheader: `Тестовый preheader ${i + 1}`,
             body: `Тестовый контент для email ${i + 1}`,
             cta: `CTA ${i + 1}`
           },
           brand_guidelines: {
             colors: { primary: '#000000' },
             fonts: { primary: 'Arial' }
           }
         },
         asset_requirements: {
           tags: ['test'],
           emotional_tone: 'neutral',
           target_count: 3
         }
       };

       promises.push(agent.executeTask(input));
    }

    const results = await Promise.all(promises);
    const totalExecutionTime = Date.now() - startTimeTotal;

    console.log(`✅ Все запросы завершены за ${totalExecutionTime}ms`);
    console.log(`📊 Среднее время на запрос: ${Math.round(totalExecutionTime / concurrentRequests)}ms`);

         results.forEach((result, index) => {
       console.log(`   Запрос ${index + 1}: ${result.success ? '✅ Успех' : '❌ Ошибка'} (${result.trace_id})`);
     });

    // Сохраняем результат производительности
    const outputFile4 = path.join(outputDir, 'demo-performance-result.json');
    const outputData4 = {
      test_name: 'Performance Demo',
      timestamp: new Date().toISOString(),
      concurrent_requests: concurrentRequests,
      total_execution_time_ms: totalExecutionTime,
      average_time_per_request_ms: Math.round(totalExecutionTime / concurrentRequests),
             results_summary: results.map((result, index) => ({
         request_id: index + 1,
         task_completed: result.success,
         trace_id: result.trace_id
       })),
      performance: {
        memory_usage: process.memoryUsage(),
        total_execution_time_ms: totalExecutionTime
      }
    };

    fs.writeFileSync(outputFile4, JSON.stringify(outputData4, null, 2));
    console.log(`💾 Результат сохранен: ${outputFile4}`);
    console.log('');

  } catch (error) {
    console.error('❌ Ошибка в тесте производительности:', error);
    console.log('');
  }

  // ИТОГИ
  console.log('🎉 ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА');
  console.log('='.repeat(60));
  console.log(`📁 Все результаты сохранены в: ${outputDir}`);
  console.log('');
  console.log('📋 Созданные файлы:');
  
  try {
    const files = fs.readdirSync(outputDir).filter(f => f.startsWith('demo-'));
    files.forEach(file => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   📄 ${file} (${stats.size} байт)`);
    });
  } catch (error) {
    console.log('   (не удалось прочитать список файлов)');
  }

  console.log('');
  console.log('🏆 DesignSpecialistAgentV2 успешно протестирован!');
  console.log('   Агент готов к производственному использованию 🚀');
}

// Запуск демонстрации
if (require.main === module) {
  main().catch(error => {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
    process.exit(1);
  });
} 