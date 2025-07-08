/**
 * 🧪 ТЕСТОВЫЙ СКРИПТ: Content Specialist Intelligence Functions
 * 
 * Проверяет видимость pricing intelligence и date intelligence 
 * в OpenAI трейсинге и логах
 */

import { contentSpecialistAgentWrapper } from './src/agent/specialists/content-specialist-agent.js';

async function testPricingIntelligence() {
  console.log('\n🔥 ТЕСТИРОВАНИЕ PRICING INTELLIGENCE');
  console.log('=' .repeat(50));
  
  try {
    const pricingInput = {
      task: 'pricing_analysis',
      origin: 'MOW',
      destination: 'DXB', 
      date_range: '2025-03-15 to 2025-03-22',
      analysis_depth: 'deep',
      passenger_count: 2
    };
    
    console.log('📊 Input данные:', pricingInput);
    
    const result = await contentSpecialistAgentWrapper.executeTask(pricingInput);
    
    console.log('\n✅ РЕЗУЛЬТАТ:');
    console.log(JSON.stringify(result, null, 2));
    
    // Проверяем видимость tool execution
    if (result.tool_data && result.tool_data.tool_execution === 'PRICING_INTELLIGENCE_SUCCESS') {
      console.log('\n🎉 SUCCESS: Pricing Intelligence tool выполнен и виден в результатах!');
    } else {
      console.log('\n❌ WARNING: Pricing Intelligence tool не найден в результатах');
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА при тестировании Pricing Intelligence:', error);
  }
}

async function testDateIntelligence() {
  console.log('\n📅 ТЕСТИРОВАНИЕ DATE INTELLIGENCE');
  console.log('=' .repeat(50));
  
  try {
    const dateInput = {
      task: 'date_intelligence',
      campaign_context: {
        topic: 'Весенние каникулы в ОАЭ',
        urgency: 'seasonal',
        campaign_type: 'hot_deals'
      },
      months_ahead: 2,
      search_window: 10
    };
    
    console.log('📊 Input данные:', dateInput);
    
    const result = await contentSpecialistAgentWrapper.executeTask(dateInput);
    
    console.log('\n✅ РЕЗУЛЬТАТ:');
    console.log(JSON.stringify(result, null, 2));
    
    // Проверяем видимость tool execution
    if (result.tool_data && result.tool_data.tool_execution === 'DATE_INTELLIGENCE_SUCCESS') {
      console.log('\n🎉 SUCCESS: Date Intelligence tool выполнен и виден в результатах!');
    } else {
      console.log('\n❌ WARNING: Date Intelligence tool не найден в результатах');
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА при тестировании Date Intelligence:', error);
  }
}

async function testCombinedIntelligence() {
  console.log('\n🔥📅 ТЕСТИРОВАНИЕ КОМБИНИРОВАННОГО АНАЛИЗА');
  console.log('=' .repeat(50));
  
  try {
    const combinedInput = {
      task: 'content_generation',
      content_type: 'complete_campaign',
      topic: 'Горящие туры в Турцию',
      tone: 'urgent',
      target_audience: 'budget travelers',
      // Агент должен использовать и pricing, и date intelligence tools
      analysis_requirements: 'Use both pricing and date intelligence for optimization'
    };
    
    console.log('📊 Input данные:', combinedInput);
    
    const result = await contentSpecialistAgentWrapper.executeTask(combinedInput);
    
    console.log('\n✅ РЕЗУЛЬТАТ:');
    console.log(JSON.stringify(result, null, 2));
    
    // Проверяем количество использованных tools
    const toolsUsed = result.execution_metadata?.tools_used || 0;
    console.log(`\n🔧 Использовано tools: ${toolsUsed}`);
    
    if (toolsUsed > 0) {
      console.log('\n🎉 SUCCESS: Tools успешно выполнены агентом!');
    } else {
      console.log('\n❌ WARNING: Агент не использовал tools');
    }
    
  } catch (error) {
    console.error('\n❌ ОШИБКА при тестировании комбинированного анализа:', error);
  }
}

// Основная функция тестирования
async function runAllTests() {
  console.log('🚀 ЗАПУСК ТЕСТИРОВАНИЯ CONTENT SPECIALIST INTELLIGENCE FUNCTIONS');
  console.log('=' .repeat(70));
  
  console.log('\n💡 Эти тесты проверяют видимость функций в OpenAI трейсинге');
  console.log('📊 Обратите внимание на логи с префиксами [PRICING INTELLIGENCE] и [DATE INTELLIGENCE]');
  console.log('🔍 В OpenAI Dashboard должны быть видны tool calls и их результаты');
  
  try {
    await testPricingIntelligence();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза между тестами
    
    await testDateIntelligence();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза между тестами
    
    await testCombinedIntelligence();
    
    console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!');
    console.log('👀 Проверьте OpenAI Dashboard для просмотра трейсинга');
    
  } catch (error) {
    console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
  }
}

// Запуск тестов
runAllTests().catch(console.error); 