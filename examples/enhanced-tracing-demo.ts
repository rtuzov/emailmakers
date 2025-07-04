/**
 * 🔍 ENHANCED TRACING DEMONSTRATION
 * 
 * Демонстрирует работу расширенной системы трассировки агентов
 * с интеграцией OpenAI Agents SDK
 */

import { ContentSpecialistAgent, ContentSpecialistInput } from '../src/agent/specialists/content-specialist-agent';
import { enhancedTracing } from '../src/agent/core/enhanced-tracing';

/**
 * 🎯 Основная демонстрация трассировки
 */
async function demonstrateEnhancedTracing() {
  console.log('🚀 ========== ENHANCED TRACING DEMO ==========');
  console.log('📋 Демонстрация расширенной трассировки агентов');
  console.log('===============================================\n');

  try {
    // 🔧 Создаем агента
    console.log('🔧 Создание ContentSpecialistAgent...');
    const contentAgent = new ContentSpecialistAgent();
    
    // 🎯 Тестовый ввод с правильными типами
    const testInput: ContentSpecialistInput = {
      task_type: 'analyze_context',
      context_requirements: {
        include_seasonal: true,
        include_cultural: true,
        include_marketing: true,
        include_travel: true
      },
      campaign_brief: {
        topic: 'Осенние путешествия в Норвегию',
        campaign_type: 'seasonal',
        target_audience: 'Путешественники 25-45 лет',
        destination: 'Норвегия',
        origin: 'Россия'
      }
    };

    // 🚀 Выполняем задачу с трассировкой
    console.log('🚀 Выполнение задачи с трассировкой...');
    const result = await contentAgent.executeTask(testInput);
    
    console.log('✅ Задача выполнена успешно!');
    console.log(`📊 Результат: ${JSON.stringify(result, null, 2).slice(0, 300)}...`);

    // 📊 Получаем историю выполнения функций
    console.log('\n📊 ========== FUNCTION EXECUTION HISTORY ==========');
    const functionHistory = contentAgent.getFunctionExecutionHistory();
    
    if (functionHistory.length > 0) {
      functionHistory.forEach((func, index) => {
        console.log(`${index + 1}. 🔧 ${func.name}`);
        console.log(`   ⏱️ Duration: ${func.duration}ms`);
        console.log(`   ✅ Success: ${func.success}`);
        console.log(`   🕐 Time: ${func.timestamp}`);
        if (func.error) {
          console.log(`   ❌ Error: ${func.error}`);
        }
        console.log('');
      });
    } else {
      console.log('📝 No function execution history found');
    }

    // 🔄 Получаем историю handoff'ов
    console.log('\n🔄 ========== HANDOFF HISTORY ==========');
    const handoffHistory = contentAgent.getHandoffHistory();
    
    if (handoffHistory.length > 0) {
      handoffHistory.forEach((handoff, index) => {
        console.log(`${index + 1}. 🔄 ${handoff.from} → ${handoff.to}`);
        console.log(`   🕐 Time: ${handoff.timestamp}`);
        console.log(`   ✅ Success: ${handoff.success}`);
        console.log('');
      });
    } else {
      console.log('📝 No handoff history found');
    }

    // 💾 Сохраняем трассировку
    console.log('\n💾 ========== SAVING TRACE ==========');
    const savedPath = await contentAgent.saveTrace();
    
    if (savedPath) {
      console.log(`💾 Трассировка сохранена в: ${savedPath}`);
    } else {
      console.log('⚠️ Не удалось сохранить трассировку');
    }

    // 📈 Показываем общую статистику
    console.log('\n📈 ========== ENHANCED TRACING STATS ==========');
    const stats = enhancedTracing.getSystemStats();
    console.log(`🎯 Активных агентов: ${stats.activeAgents}`);
    console.log(`📊 Всего трассировок: ${stats.totalTraces}`);
    console.log(`🔧 Всего функций: ${stats.totalFunctions}`);
    console.log(`🔄 Всего handoff'ов: ${stats.totalHandoffs}`);
    console.log(`⏱️ Среднее время выполнения: ${stats.averageExecutionTime}ms`);
    console.log(`📈 Общий процент успеха: ${stats.successRate}%`);

    console.log('\n✅ ========== DEMO COMPLETED SUCCESSFULLY ==========');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

/**
 * 🔄 Демонстрация нескольких агентов одновременно
 */
async function demonstrateMultipleAgents() {
  console.log('\n🔄 ========== MULTIPLE AGENTS DEMO ==========');
  console.log('📋 Демонстрация работы нескольких агентов');
  console.log('===========================================\n');

  const agents = [
    new ContentSpecialistAgent(),
    new ContentSpecialistAgent(),
    new ContentSpecialistAgent()
  ];

  const tasks: ContentSpecialistInput[] = [
    {
      task_type: 'analyze_context',
      campaign_brief: {
        topic: 'Путешествия',
        campaign_type: 'informational'
      },
      context_requirements: {
        include_seasonal: true,
        include_travel: true
      }
    },
    {
      task_type: 'generate_content',
      campaign_brief: {
        topic: 'Email контент',
        campaign_type: 'promotional'
      },
      content_requirements: {
        content_type: 'email',
        tone: 'friendly',
        language: 'ru'
      }
    },
    {
      task_type: 'generate_copy',
      campaign_brief: {
        topic: 'Копирайтинг',
        campaign_type: 'promotional'
      },
      copy_requirements: {
        copy_type: 'subject',
        target_audience: 'Путешественники',
        campaign_goal: 'conversion',
        max_characters: 50
      }
    }
  ];

  try {
    // 🚀 Запускаем все агенты параллельно
    console.log('🚀 Запуск нескольких агентов параллельно...');
    
    const promises = agents.map((agent, index) => 
      agent.executeTask(tasks[index]).catch(error => {
        console.error(`❌ Agent ${index + 1} failed:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    
    console.log('✅ Все агенты завершили работу');
    
    // 📊 Показываем результаты каждого агента
    agents.forEach((agent, index) => {
      console.log(`\n📊 Agent ${index + 1} Results:`);
      const functionHistory = agent.getFunctionExecutionHistory();
      const handoffHistory = agent.getHandoffHistory();
      
      console.log(`   🔧 Functions executed: ${functionHistory.length}`);
      console.log(`   🔄 Handoffs performed: ${handoffHistory.length}`);
      console.log(`   ✅ Result: ${results[index] ? 'Success' : 'Failed'}`);
    });

    // 📈 Общая статистика системы
    console.log('\n📈 ========== SYSTEM STATS AFTER MULTIPLE AGENTS ==========');
    const finalStats = enhancedTracing.getSystemStats();
    console.log(`🎯 Активных агентов: ${finalStats.activeAgents}`);
    console.log(`📊 Всего трассировок: ${finalStats.totalTraces}`);
    console.log(`🔧 Всего функций: ${finalStats.totalFunctions}`);
    console.log(`🔄 Всего handoff'ов: ${finalStats.totalHandoffs}`);
    console.log(`📈 Общий процент успеха: ${finalStats.successRate}%`);

    console.log('\n✅ ========== MULTIPLE AGENTS DEMO COMPLETED ==========');
    
  } catch (error) {
    console.error('❌ Multiple agents demo failed:', error);
    throw error;
  }
}

/**
 * 🎯 Главная функция демонстрации
 */
async function main() {
  try {
    await demonstrateEnhancedTracing();
    await demonstrateMultipleAgents();
    
    console.log('\n🎉 ========== ALL DEMOS COMPLETED SUCCESSFULLY ==========');
    
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    process.exit(1);
  }
}

// 🚀 Запуск демонстрации
if (require.main === module) {
  main();
}

export { demonstrateEnhancedTracing, demonstrateMultipleAgents }; 