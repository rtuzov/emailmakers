#!/usr/bin/env node

/**
 * ТЕСТ ПРЯМОГО ОБРАЩЕНИЯ К MJML COMPILATION SERVICE
 * Проверяем, что система правильно генерирует MJML и HTML файлы
 * используя правильный action: 'render_mjml'
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_OUTPUT_DIR = './test-outputs';

console.log('\n🧪 ТЕСТ: ПРЯМОЕ ОБРАЩЕНИЕ К MJML COMPILATION SERVICE');
console.log('==================================================');
console.log('Тестируем с action: render_mjml (НЕ optimize_output)');

// Создаем правильный тестовый запрос
const testRequest = {
  task_type: 'generate_content',
  input: {
    brief: 'Create a beautiful email for winter skiing trip to Alps with special offers and amazing mountain views. Include pricing information and call to action.',
    content_type: 'email_marketing',
    target_audience: 'adventure travel enthusiasts',
    tone: 'exciting and inspiring',
    language: 'Russian',
    campaign_context: 'winter sports promotion'
  },
  context: {
    test_mode: true
  }
};

async function testMjmlCompilationService() {
  try {
    console.log('\n📤 Отправляем запрос к API...');
    console.log('URL:', `${API_BASE_URL}/api/agent/run-improved`);
    console.log('Method: POST');
    console.log('Body preview:', JSON.stringify(testRequest, null, 2).substring(0, 300) + '...');

    const response = await fetch(`${API_BASE_URL}/api/agent/run-improved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ Получен ответ от API');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    // Сохраняем результат для анализа
    const timestamp = Date.now();
    const filename = `mjml_service_test_${timestamp}.json`;
    const filepath = path.join(TEST_OUTPUT_DIR, filename);
    
    // Создаем папку если не существует
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`📁 Результат сохранен: ${filepath}`);
    
    // Анализируем результат
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТА:');
    console.log('====================');
    
    if (result.success) {
      console.log('✅ API запрос успешен');
    } else {
      console.log('❌ API запрос неуспешен');
      console.log('Ошибка:', result.error || 'Unknown error');
    }
    
    // Проверяем использование правильного action
    const actions = extractActionsFromResult(result);
    console.log('\n🔍 ДЕЙСТВИЯ В WORKFLOW:');
    actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action}`);
    });
    
    // Проверяем генерацию MJML
    const mjmlGenerated = checkMjmlGeneration(result);
    console.log('\n📧 MJML ГЕНЕРАЦИЯ:');
    console.log(mjmlGenerated ? '✅ MJML был сгенерирован' : '❌ MJML НЕ был сгенерирован');
    
    // Проверяем сохранение файлов
    const filesSaved = checkFilesSaved(result);
    console.log('\n💾 СОХРАНЕНИЕ ФАЙЛОВ:');
    console.log(filesSaved ? '✅ Файлы были сохранены' : '❌ Файлы НЕ были сохранены');
    
    // Пробуем найти созданную папку кампании
    const campaignFolder = findCampaignFolder(result);
    if (campaignFolder) {
      console.log('\n📁 НАЙДЕННАЯ ПАПКА КАМПАНИИ:');
      console.log(`Путь: mails/${campaignFolder}`);
      
      // Проверяем содержимое папки
      const campaignPath = path.join('mails', campaignFolder);
      if (fs.existsSync(campaignPath)) {
        const files = fs.readdirSync(campaignPath);
        console.log('Файлы в папке:', files);
        
        // Проверяем конкретные файлы
        const emailHtml = path.join(campaignPath, 'email.html');
        const emailMjml = path.join(campaignPath, 'email.mjml');
        
        if (fs.existsSync(emailHtml)) {
          const htmlStats = fs.statSync(emailHtml);
          console.log(`✅ email.html: ${htmlStats.size} bytes`);
        } else {
          console.log('❌ email.html: не найден');
        }
        
        if (fs.existsSync(emailMjml)) {
          const mjmlStats = fs.statSync(emailMjml);
          console.log(`✅ email.mjml: ${mjmlStats.size} bytes`);
        } else {
          console.log('❌ email.mjml: не найден');
        }
      } else {
        console.log('❌ Папка кампании не найдена');
      }
    }
    
    console.log('\n🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
    console.log('=====================');
    
    if (mjmlGenerated && filesSaved) {
      console.log('🎉 УСПЕХ! MJML генерируется и файлы сохраняются');
    } else {
      console.log('⚠️  ЧАСТИЧНЫЙ УСПЕХ: не все компоненты работают');
    }
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Ошибка при тестировании:', error);
    throw error;
  }
}

function extractActionsFromResult(result) {
  const actions = [];
  const resultStr = JSON.stringify(result);
  
  // Ищем упоминания действий в логах
  const actionMatches = resultStr.match(/"action":"([^"]+)"/g);
  if (actionMatches) {
    actionMatches.forEach(match => {
      const action = match.replace(/"action":"([^"]+)"/, '$1');
      if (!actions.includes(action)) {
        actions.push(action);
      }
    });
  }
  
  return actions;
}

function checkMjmlGeneration(result) {
  const resultStr = JSON.stringify(result).toLowerCase();
  
  // Ищем признаки генерации MJML
  return resultStr.includes('mjml') && 
         resultStr.includes('mj-body') ||
         resultStr.includes('mjml_content') ||
         resultStr.includes('generatestandardmjmltemplate');
}

function checkFilesSaved(result) {
  const resultStr = JSON.stringify(result).toLowerCase();
  
  // Ищем признаки сохранения файлов
  return resultStr.includes('savehtml') ||
         resultStr.includes('savemjml') ||
         resultStr.includes('saved') ||
         resultStr.includes('email.html') ||
         resultStr.includes('email.mjml');
}

function findCampaignFolder(result) {
  const resultStr = JSON.stringify(result);
  
  // Ищем имя папки кампании
  const folderMatches = resultStr.match(/"campaignId":"([^"]+)"/);
  if (folderMatches) {
    return folderMatches[1];
  }
  
  // Альтернативный поиск
  const emailFolderMatches = resultStr.match(/"emailFolder":"([^"]+)"/);
  if (emailFolderMatches) {
    return emailFolderMatches[1];
  }
  
  return null;
}

// Запускаем тест
testMjmlCompilationService()
  .then(result => {
    console.log('\n✅ Тест завершен успешно');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Тест завершился с ошибкой:', error.message);
    process.exit(1);
  }); 