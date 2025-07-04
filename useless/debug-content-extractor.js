// Debug script для ContentExtractor
const fs = require('fs');

// Симуляция handoff данных из логов
const testHandoffData = {
  content_package: {
    complete_content: {
      subject: "Путешествие на Камчатку - откройте дикую красоту",
      preheader: "Эксклюзивные туры на полуостров вулканов и горячих источников",
      body: "Уважаемый путешественник! Приглашаем вас в незабываемое путешествие на Камчатку...",
      cta: "Забронировать тур",
      footer: "С уважением, команда ArcticTours"
    },
    design_requirements: {
      template_type: "adventure_travel",
      visual_priority: "high_impact_imagery", 
      layout_preferences: "hero_image_cta",
      color_scheme: "nature_earth_tones"
    },
    brand_guidelines: {
      primary_color: "#2E7D32",
      secondary_color: "#FF6F00",
      font_family: "Arial, sans-serif",
      logo_url: "https://arctictours.ru/logo.png"
    }
  }
};

// Альтернативная структура данных (как в реальных логах)
const alternativeHandoffData = {
  content: {
    subject: "Путешествие на Камчатку - откройте дикую красоту", 
    preheader: "Эксклюзивные туры на полуостров вулканов и горячих источников",
    body: "Уважаемый путешественник! Приглашаем вас в незабываемое путешествие на Камчатку...",
    email_body: "Уважаемый путешественник! Приглашаем вас в незабываемое путешествие на Камчатку...",
    cta: "Забронировать тур",
    footer: "С уважением, команда ArcticTours"
  },
  design_requirements: {
    template_type: "adventure_travel",
    visual_priority: "high_impact_imagery",
    layout_preferences: "hero_image_cta", 
    color_scheme: "nature_earth_tones"
  },
  brand_guidelines: {
    primary_color: "#2E7D32",
    secondary_color: "#FF6F00", 
    font_family: "Arial, sans-serif",
    logo_url: "https://arctictours.ru/logo.png"
  }
};

console.log('🔍 TESTING CONTENT EXTRACTOR LOGIC');
console.log('=====================================');

function testContentExtraction(contentPackage, testName) {
  console.log(`\n📋 Testing: ${testName}`);
  console.log('contentPackage keys:', Object.keys(contentPackage || {}));
  
  // Логика из ContentExtractor
  const contentSource = contentPackage.content || contentPackage.content_package?.complete_content || contentPackage;
  console.log('contentSource keys:', Object.keys(contentSource || {}));
  
  const body = contentSource.body || contentSource.email_body || '';
  console.log('Extracted body:', body ? `"${body.substring(0, 50)}..."` : 'EMPTY');
  console.log('Body length:', body?.length || 0);
  
  console.log('✅ Test result:', body && body.trim() !== '' ? 'SUCCESS' : 'FAILED - EMPTY BODY');
}

// Тестируем обе структуры
testContentExtraction(testHandoffData, 'Original structure (content_package.complete_content)');
testContentExtraction(alternativeHandoffData, 'Alternative structure (content)');

// Тестируем ИСПРАВЛЕННУЮ agent-handoffs логику
console.log('\n🔧 TESTING FIXED AGENT-HANDOFFS EXTRACTION');
console.log('===============================================');

function testFixedAgentHandoffsExtraction(handoffData, testName) {
  console.log(`\n📋 Testing: ${testName}`);
  
  // ИСПРАВЛЕННАЯ логика из agent-handoffs.ts
  const contentPackage = handoffData?.content_package?.complete_content || handoffData?.content_package || handoffData || {};
  console.log('agent-handoffs contentPackage keys:', Object.keys(contentPackage || {}));
  
  // Теперь тестируем извлечение body через ContentExtractor логику
  const contentSource = contentPackage.content || contentPackage.content_package?.complete_content || contentPackage;
  console.log('contentSource keys:', Object.keys(contentSource || {}));
  
  const body = contentSource.body || contentSource.email_body || '';
  console.log('Extracted body:', body ? `"${body.substring(0, 50)}..."` : 'EMPTY');
  console.log('✅ Test result:', body && body.trim() !== '' ? 'SUCCESS' : 'FAILED - EMPTY BODY');
}

testFixedAgentHandoffsExtraction(testHandoffData, 'From testHandoffData');
testFixedAgentHandoffsExtraction(alternativeHandoffData, 'From alternativeHandoffData (CRITICAL TEST)');

console.log('\n🎯 CRITICAL TEST: Simulating Real Handoff Data Structure');
console.log('=========================================================');

// Тестируем полную цепочку как в реальности
function testFullChain(handoffData, testName) {
  console.log(`\n📋 Full Chain Test: ${testName}`);
  
  // Шаг 1: agent-handoffs извлекает contentPackage
  const contentPackage = handoffData?.content_package?.complete_content || handoffData?.content_package || handoffData || {};
  console.log('Step 1 - contentPackage keys:', Object.keys(contentPackage || {}));
  
  // Шаг 2: ContentExtractor извлекает contentSource
  const contentSource = contentPackage.content || contentPackage.content_package?.complete_content || contentPackage;
  console.log('Step 2 - contentSource keys:', Object.keys(contentSource || {}));
  
  // Шаг 3: Извлечение body
  const body = contentSource.body || contentSource.email_body || '';
  console.log('Step 3 - body:', body ? `"${body.substring(0, 50)}..."` : 'EMPTY');
  
  console.log('✅ FULL CHAIN RESULT:', body && body.trim() !== '' ? 'SUCCESS ✅' : 'FAILED ❌');
}

testFullChain(testHandoffData, 'Original Structure');
testFullChain(alternativeHandoffData, 'Real Alternative Structure (from logs)'); 