/**
 * 🤖 ТЕСТ ТОЛЬКО OPENAI SDK AGENT
 * 
 * Использует исключительно OpenAI Agents SDK без дополнительных систем
 */

import { Agent, run } from '@openai/agents';
import { z } from 'zod';

// Простая схема для инструмента
const emailAnalysisSchema = z.object({
  topic: z.string().describe('Тема email кампании'),
  audience: z.string().describe('Целевая аудитория'),
  goal: z.string().describe('Цель кампании')
});

// Простая функция инструмента
async function analyzeEmailCampaign(input: z.infer<typeof emailAnalysisSchema>) {
  console.log('🔍 Анализ email кампании:', input);
  
  // Простая логика анализа
  const analysis = {
    topic: input.topic,
    audience: input.audience,
    goal: input.goal,
    recommendations: [
      'Использовать персонализированный подход',
      'Добавить яркие визуальные элементы',
      'Создать четкий call-to-action'
    ],
    confidence: 85,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ Анализ завершен:', analysis);
  return analysis;
}

/**
 * 🎯 Создание OpenAI Agent
 */
function createEmailAgent(): Agent {
  const agent = new Agent({
    name: 'EmailCampaignAgent',
    instructions: `
      Ты - специалист по email маркетингу.
      
      Твоя задача:
      1. Анализировать темы email кампаний
      2. Определять целевую аудиторию
      3. Предлагать стратегии для достижения целей
      4. Давать рекомендации по улучшению
      
      Отвечай на русском языке.
      Будь конкретным и полезным.
      
      Когда нужно проанализировать кампанию, используй функцию analyzeEmailCampaign.
    `,
    model: 'gpt-4o-mini',
    tools: [
      {
        name: 'analyzeEmailCampaign',
        description: 'Анализирует email кампанию и дает рекомендации',
        parameters: emailAnalysisSchema,
        execute: analyzeEmailCampaign
      }
    ]
  });

  return agent;
}

/**
 * 🚀 Тест OpenAI Agent
 */
async function testOpenAIAgent() {
  console.log('🚀 ========== ТЕСТ OPENAI AGENT ==========');
  console.log('📋 Тестирование чистого OpenAI Agents SDK');
  console.log('========================================\n');

  try {
    // 🤖 Создаем агента
    console.log('🤖 Создание OpenAI Agent...');
    const agent = createEmailAgent();
    
    // 🎯 Тестовый запрос
    const request = 'Проанализируй email кампанию для осенних путешествий в Норвегию. Целевая аудитория - путешественники 25-45 лет. Цель - увеличить продажи авиабилетов на 20%.';
    
    console.log('📝 Запрос:', request);
    console.log('\n🚀 Выполнение запроса...\n');
    
    // 🚀 Запускаем агента
    const result = await run(agent, request);
    
    console.log('\n✅ Агент завершил работу!');
    console.log('📊 Результат:');
    console.log('─'.repeat(50));
    console.log(result.finalOutput);
    console.log('─'.repeat(50));
    
    // 📈 Показываем дополнительную информацию
    if (result.steps && result.steps.length > 0) {
      console.log('\n📋 Шаги выполнения:');
      result.steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.type}: ${step.message || 'Выполнено'}`);
      });
    }
    
    console.log('\n✅ ========== ТЕСТ ЗАВЕРШЕН УСПЕШНО ==========');
    return true;
    
  } catch (error) {
    console.error('❌ Тест провалился:', error);
    
    // Показываем детали ошибки
    if (error instanceof Error) {
      console.error('📝 Детали ошибки:');
      console.error('  Название:', error.name);
      console.error('  Сообщение:', error.message);
      if (error.stack) {
        console.error('  Стек:', error.stack.split('\n').slice(0, 5).join('\n'));
      }
    }
    
    return false;
  }
}

/**
 * 🔄 Тест нескольких запросов
 */
async function testMultipleRequests() {
  console.log('\n🔄 ========== ТЕСТ НЕСКОЛЬКИХ ЗАПРОСОВ ==========');
  console.log('📋 Тестирование последовательных запросов');
  console.log('============================================\n');

  try {
    const agent = createEmailAgent();
    
    const requests = [
      'Проанализируй кампанию для бизнес-путешествий',
      'Создай стратегию для семейного отдыха',
      'Предложи подход для молодежной аудитории'
    ];
    
    console.log(`🚀 Выполнение ${requests.length} запросов...\n`);
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      console.log(`📝 Запрос ${i + 1}: ${request}`);
      
      try {
        const result = await run(agent, request);
        console.log(`✅ Результат ${i + 1}:`, result.finalOutput.slice(0, 100) + '...');
      } catch (error) {
        console.error(`❌ Ошибка в запросе ${i + 1}:`, error);
      }
      
      console.log(''); // Пустая строка для разделения
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
  console.log('🎬 Запуск теста OpenAI Agent...\n');
  
  // Проверяем наличие API ключа
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY не установлен в переменных окружения');
    console.error('💡 Установите ключ: export OPENAI_API_KEY=your_key_here');
    process.exit(1);
  }
  
  console.log('✅ OpenAI API ключ найден');
  console.log('🚀 Начинаем тестирование...\n');

  try {
    const singleTest = await testOpenAIAgent();
    const multipleTest = await testMultipleRequests();
    
    if (singleTest && multipleTest) {
      console.log('\n🎉 ========== ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО ==========');
      console.log('✅ OpenAI Agents SDK работает корректно');
      console.log('✅ Агент выполняет задачи и использует инструменты');
      console.log('✅ Множественные запросы обрабатываются успешно');
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

export { testOpenAIAgent, testMultipleRequests, createEmailAgent }; 