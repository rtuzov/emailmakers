/**
 * 🧪 ПРОСТОЙ ТЕСТ НОВЫХ ИНСТРУМЕНТОВ
 * 
 * Тестируем только новые инструменты Enhanced Design V3
 * без зависимостей от других частей системы
 */

import { analyzeContentForDesign } from './src/agent/specialists/design-specialist/content-intelligence-analyzer';
import { generateAdaptiveDesign } from './src/agent/specialists/design-specialist/adaptive-design-engine';
import { generateEnhancedMjmlTemplate } from './src/agent/specialists/design-specialist/enhanced-mjml-generator';

async function testNewTools() {
  console.log('🧪 === TESTING NEW ENHANCED TOOLS ===\n');
  
  // Создаем мок контекста
  const mockContext = {
    designContext: {
      content_context: {
        subject: 'Незабываемое путешествие в Гватемалу - от 45,000₽',
        preheader: 'Древние руины майя, активные вулканы и экзотическая природа',
        body: `Откройте для себя удивительную Гватемалу - страну древних цивилизаций и нетронутой природы! 
        
🏛️ Исследуйте величественные руины майя в Тикале
🌋 Покорите активные вулканы Фуэго и Акатенанго  
🎭 Погрузитесь в богатую культуру коренных народов

Специальное предложение действует только до конца месяца! Забронируйте сейчас и получите скидку 15% на групповые туры.`,
        cta: {
          primary: 'Забронировать путешествие'
        },
        pricing: {
          best_price: '45,000',
          currency: '₽',
          discount: '15%'
        }
      }
    }
  };

  try {
    console.log('🧠 Тест 1: Content Intelligence Analyzer...');
    
    // Тест 1: Анализ контента
    const contentResult = await analyzeContentForDesign.execute(
      { trace_id: 'test-content' },
      mockContext
    );
    console.log('✅ Content Analysis Result:', contentResult.substring(0, 100) + '...');
    
    console.log('\n🎨 Тест 2: Adaptive Design Engine...');
    
    // Тест 2: Генерация адаптивного дизайна
    const designResult = await generateAdaptiveDesign.execute(
      { trace_id: 'test-design' },
      mockContext
    );
    console.log('✅ Adaptive Design Result:', designResult.substring(0, 100) + '...');
    
    console.log('\n📧 Тест 3: Enhanced MJML Generator...');
    
    // Тест 3: Генерация MJML
    const mjmlResult = await generateEnhancedMjmlTemplate.execute(
      { trace_id: 'test-mjml' },
      mockContext
    );
    console.log('✅ Enhanced MJML Result:', mjmlResult.substring(0, 100) + '...');
    
    console.log('\n🎉 === ВСЕ ТЕСТЫ ПРОЙДЕНЫ! ===');
    console.log('✅ Content Intelligence - работает');
    console.log('✅ Adaptive Design Engine - работает');
    console.log('✅ Enhanced MJML Generator - работает');
    
    return {
      success: true,
      tools_tested: 3,
      all_working: true
    };
    
  } catch (error) {
    console.error('❌ ОШИБКА В ТЕСТАХ:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Запускаем тест
if (require.main === module) {
  testNewTools()
    .then(result => {
      console.log('\n🏁 РЕЗУЛЬТАТ ТЕСТОВ:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
      process.exit(1);
    });
}

export { testNewTools }; 