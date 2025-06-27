#!/usr/bin/env node
/**
 * Test Fixes Script
 * Тестирует все исправления агента
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

/**
 * Тест генерации и автосохранения
 */
async function testGenerationAndAutoSave() {
  console.log('🧪 Testing email generation and auto-save...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agent/paris-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Тест автосохранения - Романтические билеты в Париж'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.status === 'success') {
      console.log('✅ Generation successful');
      console.log('   Generation time:', data.campaign_details?.generation_time + 'ms');
      console.log('   Auto-saved:', data.campaign_details?.auto_saved ? 'Yes' : 'No');
      console.log('   Subject:', data.data?.subject);
      
      return true;
    } else {
      console.log('❌ Generation failed');
      console.log('   Error:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Test error:', error.message);
    return false;
  }
}

/**
 * Проверить файлы в папке mails
 */
async function checkMailsFolder() {
  console.log('📁 Checking mails folder...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const mailsDir = path.join(process.cwd(), 'mails');
    const files = fs.readdirSync(mailsDir);
    
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`✅ Found ${htmlFiles.length} HTML files`);
    console.log(`✅ Found ${jsonFiles.length} JSON files`);
    
    // Показать последние файлы
    if (htmlFiles.length > 0) {
      const latest = htmlFiles.sort().pop();
      console.log(`   Latest: ${latest}`);
    }
    
    return htmlFiles.length > 0;
  } catch (error) {
    console.log('❌ Error checking mails folder:', error.message);
    return false;
  }
}

/**
 * Тест исправленного API цен
 */
async function testPricesAPI() {
  console.log('💰 Testing prices API fix...');
  
  try {
    // Тестируем прямо через API агента
    const response = await fetch(`${BASE_URL}/api/agent/paris-campaign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Тест цен MOW-CDG'
      })
    });
    
    const data = await response.json();
    
    if (data.campaign_details?.prices) {
      const prices = data.campaign_details.prices;
      console.log('✅ Prices API working');
      console.log('   Cheapest price:', prices.cheapest + ' ' + prices.currency);
      console.log('   Options found:', prices.options_found);
      
      return prices.cheapest > 0;
    } else {
      console.log('❌ No price data in response');
      return false;
    }
  } catch (error) {
    console.log('❌ Prices test error:', error.message);
    return false;
  }
}

/**
 * Полный тест исправлений
 */
async function runFullTest() {
  console.log('🔧 Running full fixes test...\n');
  
  const results = {
    generation: await testGenerationAndAutoSave(),
    autosave: await checkMailsFolder(),
    prices: await testPricesAPI()
  };
  
  console.log('\n📊 Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All fixes working correctly!');
  } else {
    console.log('⚠️ Some issues need attention');
  }
  
  return results;
}

// CLI интерфейс
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'generation':
      testGenerationAndAutoSave();
      break;
      
    case 'files':
      checkMailsFolder();
      break;
      
    case 'prices':
      testPricesAPI();
      break;
      
    default:
      runFullTest();
      break;
  }
}

module.exports = {
  testGenerationAndAutoSave,
  checkMailsFolder,
  testPricesAPI,
  runFullTest
};
