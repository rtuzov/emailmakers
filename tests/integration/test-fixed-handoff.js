/**
 * Тест исправленного handoff файла для Design Specialist
 */

const fs = require('fs');
const path = require('path');

async function testFixedHandoff() {
  console.log('🔍 === ТЕСТ ИСПРАВЛЕННОГО HANDOFF ФАЙЛА ===\n');
  
  const campaignPath = './campaigns/campaign_1752067390491_6bw26vhgh4e';
  const handoffPath = path.join(campaignPath, 'handoffs', 'content-specialist-to-design-specialist.json');
  
  try {
    // 1. Проверяем, что handoff файл существует
    console.log('📁 1. Проверка существования handoff файла...');
    if (!fs.existsSync(handoffPath)) {
      throw new Error(`Handoff файл не найден: ${handoffPath}`);
    }
    console.log('✅ Handoff файл найден');
    
    // 2. Загружаем и парсим handoff файл
    console.log('\n📖 2. Загрузка handoff данных...');
    const handoffData = JSON.parse(fs.readFileSync(handoffPath, 'utf-8'));
    console.log('✅ Handoff файл успешно загружен');
    
    // 3. Проверяем структуру content_context
    console.log('\n🔍 3. Проверка content_context...');
    const contentContext = handoffData.content_context;
    
    if (!contentContext) {
      console.error('❌ content_context отсутствует!');
      return false;
    }
    
    if (contentContext === null) {
      console.error('❌ content_context равен null!');
      return false;
    }
    
    console.log('✅ content_context присутствует');
    
    // 4. Проверяем обязательные поля
    console.log('\n📋 4. Проверка обязательных полей...');
    
    const checks = [
      { field: 'campaign.id', value: contentContext.campaign?.id },
      { field: 'campaign.campaignPath', value: contentContext.campaign?.campaignPath },
      { field: 'generated_content.subject', value: contentContext.generated_content?.subject },
      { field: 'generated_content.body', value: contentContext.generated_content?.body },
      { field: 'pricing_analysis.best_price', value: contentContext.pricing_analysis?.best_price },
      { field: 'pricing_analysis.currency', value: contentContext.pricing_analysis?.currency },
      { field: 'asset_strategy.visual_style', value: contentContext.asset_strategy?.visual_style },
      { field: 'date_analysis.optimal_dates', value: contentContext.date_analysis?.optimal_dates }
    ];
    
    let allFieldsPresent = true;
    
    checks.forEach(check => {
      if (!check.value || (Array.isArray(check.value) && check.value.length === 0)) {
        console.error(`❌ ${check.field}: отсутствует или пустое`);
        allFieldsPresent = false;
      } else {
        const displayValue = typeof check.value === 'string' && check.value.length > 50 
          ? check.value.substring(0, 50) + '...'
          : Array.isArray(check.value) 
          ? `[${check.value.length} items]`
          : check.value;
        console.log(`✅ ${check.field}: ${displayValue}`);
      }
    });
    
    // 5. Итоговый результат
    console.log('\n📊 === РЕЗУЛЬТАТ ПРОВЕРКИ ===');
    
    if (allFieldsPresent) {
      console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
      console.log('✅ Content context полный и готов для Design Specialist');
      console.log('📧 Тема:', contentContext.generated_content.subject);
      console.log('💰 Цена:', `${contentContext.pricing_analysis.best_price} ${contentContext.pricing_analysis.currency}`);
      console.log('🎨 Стиль:', contentContext.asset_strategy.visual_style);
      console.log('📅 Даты:', contentContext.date_analysis.optimal_dates.slice(0, 3).join(', '));
      
      return true;
    } else {
      console.log('❌ ЕСТЬ ПРОБЛЕМЫ!');
      console.log('⚠️ Design Specialist не сможет работать с неполным контекстом');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Ошибка при проверке handoff файла:');
    console.error(error.message);
    return false;
  }
}

// Запускаем тест
testFixedHandoff()
  .then(success => {
    console.log(`\n🏁 Тест завершен: ${success ? 'УСПЕШНО' : 'С ОШИБКАМИ'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }); 