/**
 * 🔍 ПРОСТОЙ ТЕСТ АГЕНТА
 * 
 * Демонстрирует работу системы трассировки без OpenAI SDK
 */

import { ContentSpecialistAgent, ContentSpecialistInput } from '../src/agent/specialists/content-specialist-agent';
import { enhancedTracing } from '../src/agent/core/enhanced-tracing';
import { AgentHandoffsCoordinator } from '../src/agent/core/agent-handoffs';

/**
 * 🎯 Простой тест агента
 */
async function testAgent() {
  console.log('🚀 ========== ПРОСТОЙ ТЕСТ АГЕНТА ==========');
  console.log('📋 Тестирование основной функциональности');
  console.log('==========================================\n');

  try {
    // 🔧 Создаем агента
    console.log('🔧 Создание ContentSpecialistAgent...');
    const contentAgent = new ContentSpecialistAgent();
    
    // 🎯 Тестовый ввод
    const testInput: ContentSpecialistInput = {
      task_type: 'analyze_context',
      campaign_brief: {
        topic: 'Тестовая кампания',
        campaign_type: 'informational'
      },
      context_requirements: {
        include_seasonal: true,
        include_travel: true
      }
    };

    console.log('📋 Входные данные:', JSON.stringify(testInput, null, 2));

    // 🚀 Выполняем задачу
    console.log('\n🚀 Выполнение задачи...');
    const result = await contentAgent.executeTask(testInput);
    
    console.log('✅ Задача выполнена!');
    console.log('📊 Результат:', JSON.stringify(result, null, 2));

    // 📊 Показываем историю выполнения
    console.log('\n📊 ========== ИСТОРИЯ ВЫПОЛНЕНИЯ ==========');
    const functionHistory = contentAgent.getFunctionExecutionHistory();
    const handoffHistory = contentAgent.getHandoffHistory();
    
    console.log(`🔧 Функций выполнено: ${functionHistory.length}`);
    console.log(`🔄 Handoff'ов выполнено: ${handoffHistory.length}`);
    
    if (functionHistory.length > 0) {
      console.log('\n📋 Функции:');
      functionHistory.forEach((func, index) => {
        console.log(`  ${index + 1}. ${func.success ? '✅' : '❌'} ${func.name} (${func.duration}ms)`);
      });
    }
    
    if (handoffHistory.length > 0) {
      console.log('\n📋 Handoff\'ы:');
      handoffHistory.forEach((handoff, index) => {
        console.log(`  ${index + 1}. 🔄 ${handoff.from} → ${handoff.to}`);
      });
    }

    // 💾 Сохраняем трассировку
    console.log('\n💾 Сохранение трассировки...');
    const savedPath = await contentAgent.saveTrace();
    if (savedPath) {
      console.log(`💾 Трассировка сохранена: ${savedPath}`);
    }

    // 📈 Статистика системы
    console.log('\n📈 ========== СТАТИСТИКА СИСТЕМЫ ==========');
    const stats = enhancedTracing.getSystemStats();
    console.log(`🎯 Активных агентов: ${stats.activeAgents}`);
    console.log(`📊 Всего трассировок: ${stats.totalTraces}`);
    console.log(`🔧 Всего функций: ${stats.totalFunctions}`);
    console.log(`🔄 Всего handoff'ов: ${stats.totalHandoffs}`);
    console.log(`⏱️ Среднее время: ${stats.averageExecutionTime}ms`);
    console.log(`📈 Процент успеха: ${stats.successRate}%`);

    console.log('\n✅ ========== ТЕСТ ЗАВЕРШЕН УСПЕШНО ==========');
    return true;
    
  } catch (error) {
    console.error('❌ Тест провалился:', error);
    return false;
  }
}

/**
 * 🔄 Тест координатора handoff'ов
 */
async function testHandoffCoordinator() {
  console.log('\n🔄 ========== ТЕСТ HANDOFF КООРДИНАТОРА ==========');
  console.log('📋 Тестирование координации между агентами');
  console.log('===============================================\n');

  try {
    const coordinator = AgentHandoffsCoordinator.getInstance();
    
    // 🎯 Тестовый handoff
    const handoffRequest = {
      fromAgent: 'content-specialist',
      toAgent: 'design-specialist',
      data: {
        content: 'Тестовый контент',
        metadata: { type: 'test' }
      },
      context: {
        campaign_id: 'test-campaign',
        workflow_step: 1
      }
    };

    console.log('📋 Handoff запрос:', JSON.stringify(handoffRequest, null, 2));

    // 🚀 Выполняем handoff
    console.log('\n🚀 Выполнение handoff...');
    const handoffResult = await coordinator.executeHandoff(handoffRequest);
    
    console.log('✅ Handoff выполнен!');
    console.log('📊 Результат:', JSON.stringify(handoffResult, null, 2));

    // 📊 Статистика handoff'ов
    console.log('\n📊 ========== СТАТИСТИКА HANDOFF\'ОВ ==========');
    const handoffStats = coordinator.getActiveHandoffsStats();
    console.log(`🔄 Активных handoff'ов: ${handoffStats.count}`);
    console.log('📋 Список handoff\'ов:', handoffStats.handoffs);

    console.log('\n✅ ========== ТЕСТ HANDOFF ЗАВЕРШЕН ==========');
    return true;
    
  } catch (error) {
    console.error('❌ Тест handoff провалился:', error);
    return false;
  }
}

/**
 * 🎯 Главная функция
 */
async function main() {
  console.log('🎬 Запуск простого теста агента...\n');

  try {
    const agentTest = await testAgent();
    const handoffTest = await testHandoffCoordinator();
    
    if (agentTest && handoffTest) {
      console.log('\n🎉 ========== ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО ==========');
      console.log('✅ Система трассировки работает корректно');
      console.log('✅ Координатор handoff\'ов функционирует');
      console.log('✅ Агенты выполняют задачи с полной трассировкой');
    } else {
      console.log('\n❌ ========== НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛИЛИСЬ ==========');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  }
}

// 🚀 Запуск
if (require.main === module) {
  main();
}

export { testAgent, testHandoffCoordinator }; 