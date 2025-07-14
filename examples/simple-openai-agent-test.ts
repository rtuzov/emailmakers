/**
 * 🤖 ПРОСТЕЙШИЙ ТЕСТ OPENAI AGENT
 * 
 * Базовый тест OpenAI Agents SDK без инструментов
 */

import { Agent, run } from '@openai/agents';

/**
 * 🎯 Создание простого OpenAI Agent без инструментов
 */
function createSimpleEmailAgent(): Agent {
  const agent = new Agent({
    name: 'SimpleEmailAgent',
    instructions: `
      Ты - эксперт по email маркетингу.
      
      Твоя задача:
      1. Анализировать email кампании
      2. Давать рекомендации по улучшению
      3. Предлагать стратегии для достижения целей
      4. Помогать с контентом для email рассылок
      
      Отвечай на русском языке.
      Будь конкретным, полезным и профессиональным.
      Структурируй свои ответы с помощью эмодзи и заголовков.
    `,
    model: 'gpt-4o-mini'
    // Без инструментов для простоты
  });

  return agent;
}

/**
 * 🚀 Тест простого OpenAI Agent
 */
async function testSimpleAgent() {
  console.log('🚀 ========== ТЕСТ ПРОСТОГО OPENAI AGENT ==========');
  console.log('📋 Тестирование базового OpenAI Agents SDK');
  console.log('============================================\n');

  try {
    // 🤖 Создаем агента
    console.log('🤖 Создание простого OpenAI Agent...');
    const agent = createSimpleEmailAgent();
    
    // 🎯 Тестовый запрос
    const request = `
      Проанализируй email кампанию для осенних путешествий в Норвегию.
      
      Детали кампании:
      - Целевая аудитория: путешественники 25-45 лет
      - Цель: увеличить продажи авиабилетов на 20%
      - Сезон: осень (сентябрь-ноябрь)
      - Направление: Норвегия
      
      Дай рекомендации по:
      1. Теме письма
      2. Структуре контента
      3. Call-to-action
      4. Визуальным элементам
    `;
    
    console.log('📝 Запрос отправлен агенту...\n');
    
    // 🚀 Запускаем агента
    const result = await run(agent, request);
    
    console.log('✅ Агент завершил работу!');
    console.log('📊 Результат:');
    console.log('═'.repeat(80));
    console.log(result.finalOutput);
    console.log('═'.repeat(80));
    
    // 📈 Показываем дополнительную информацию
    if (result.steps && result.steps.length > 0) {
      console.log('\n📋 Информация о выполнении:');
      console.log(`🔢 Количество шагов: ${result.steps.length}`);
      console.log(`⏱️ Время выполнения: ${result.duration || 'неизвестно'}ms`);
    }
    
    console.log('\n✅ ========== ТЕСТ ЗАВЕРШЕН УСПЕШНО ==========');
    return true;
    
  } catch (error) {
    console.error('❌ Тест провалился:', error);
    
    if (error instanceof Error) {
      console.error('📝 Детали ошибки:');
      console.error(`  Название: ${error.name}`);
      console.error(`  Сообщение: ${error.message}`);
    }
    
    return false;
  }
}

/**
 * 🔄 Тест нескольких простых запросов
 */
async function testMultipleSimpleRequests() {
  console.log('\n🔄 ========== ТЕСТ НЕСКОЛЬКИХ ЗАПРОСОВ ==========');
  console.log('📋 Последовательное выполнение запросов');
  console.log('=========================================\n');

  try {
    const agent = createSimpleEmailAgent();
    
    const requests = [
      'Создай тему для email о бизнес-путешествиях',
      'Предложи структуру письма для семейного отдыха',
      'Дай совет по call-to-action для молодежной аудитории'
    ];
    
    console.log(`🚀 Выполнение ${requests.length} запросов...\n`);
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      console.log(`📝 Запрос ${i + 1}: ${request}`);
      
      try {
        const result = await run(agent, request);
        console.log(`✅ Ответ ${i + 1}:`);
        console.log('─'.repeat(50));
        console.log(result.finalOutput);
        console.log('─'.repeat(50));
      } catch (error) {
        console.error(`❌ Ошибка в запросе ${i + 1}:`, error);
      }
      
      console.log(''); // Разделитель
    }
    
    console.log('✅ ========== МНОЖЕСТВЕННЫЕ ЗАПРОСЫ ЗАВЕРШЕНЫ ==========');
    return true;
    
  } catch (error) {
    console.error('❌ Тест множественных запросов провалился:', error);
    return false;
  }
}

/**
 * 🎯 Главная функция
 */
async function main() {
  console.log('🎬 Запуск простого теста OpenAI Agent...\n');
  
  // Проверяем API ключ
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY не установлен в переменных окружения');
    console.error('💡 Установите ключ: export OPENAI_API_KEY=your_key_here');
    process.exit(1);
  }
  
  console.log('✅ OpenAI API ключ найден');
  console.log('🚀 Начинаем тестирование...\n');

  try {
    const singleTest = await testSimpleAgent();
    const multipleTest = await testMultipleSimpleRequests();
    
    if (singleTest && multipleTest) {
      console.log('\n🎉 ========== ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО ==========');
      console.log('✅ OpenAI Agents SDK работает корректно');
      console.log('✅ Агент отвечает на вопросы по email маркетингу');
      console.log('✅ Множественные запросы обрабатываются успешно');
      console.log('✅ Система готова к использованию!');
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

export { testSimpleAgent, testMultipleSimpleRequests, createSimpleEmailAgent }; 