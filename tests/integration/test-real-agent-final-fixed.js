#!/usr/bin/env node

/**
 * ФИНАЛЬНЫЙ ТЕСТ ИСПРАВЛЕННОГО АГЕНТА
 * Тестирует все исправления: создание папки кампании, AI-driven MJML, сохранение файлов
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_OUTPUT_DIR = './test-outputs';

console.log('\n🔧 ФИНАЛЬНЫЙ ТЕСТ ИСПРАВЛЕННОГО АГЕНТА');
console.log('==================================================');
console.log('Тестируем все исправления: создание папки + AI MJML + сохранение файлов\n');

// Создаем выходную папку
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Тестовый запрос
const testRequest = {
  task_type: 'generate_content',
  input: {
    brief: 'Создай красивый email для зимних каникул в Японии с горячими источниками и сакурой. Включи информацию о ценах и специальных предложениях для семей с детьми.',
    tone: 'дружелюбный',
    target_audience: 'семьи с детьми',
    campaign_type: 'seasonal',
    language: 'ru'
  },
  context: {
    urgency_level: 'medium',
    test_mode: true,
    trace_validation: true
  }
};

// Проверяем создание папки кампании
async function validateCampaignFolder() {
  console.log('\n📁 Проверка создания папки кампании...');
  
  try {
    const mailsDirs = fs.readdirSync('mails/');
    const latestDir = mailsDirs
      .filter(dir => dir.includes('japan') || dir.includes('winter'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join('mails', a));
        const statB = fs.statSync(path.join('mails', b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      })[0];
    
    if (latestDir) {
      console.log(`✅ Найдена папка кампании: ${latestDir}`);
      
      // Проверяем содержимое
      const campaignPath = path.join('mails', latestDir);
      const files = fs.readdirSync(campaignPath);
      
      console.log('📂 Файлы в папке кампании:');
      files.forEach(file => {
        const filePath = path.join(campaignPath, file);
        const stats = fs.statSync(filePath);
        console.log(`  - ${file} (${stats.size} байт)`);
      });
      
      // Проверяем важные файлы
      const hasHtml = files.some(f => f.includes('.html'));
      const hasMjml = files.some(f => f.includes('.mjml'));
      const hasMetadata = files.some(f => f.includes('metadata.json'));
      
      console.log(`\n📊 Проверка файлов:`);
      console.log(`  HTML файлы: ${hasHtml ? '✅' : '❌'}`);
      console.log(`  MJML файлы: ${hasMjml ? '✅' : '❌'}`);
      console.log(`  Метаданные: ${hasMetadata ? '✅' : '❌'}`);
      
      if (hasHtml && hasMjml) {
        console.log('🎉 ВСЕ ФАЙЛЫ СОЗДАНЫ УСПЕШНО!');
        return true;
      } else {
        console.log('⚠️ Некоторые файлы отсутствуют');
        return false;
      }
    } else {
      console.log('❌ Папка кампании не найдена');
      return false;
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке папки кампании:', error);
    return false;
  }
}

// Основной тест
async function runTest() {
  console.log('🚀 Запуск теста...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/run-improved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const timestamp = Date.now();
    
    // Сохраняем результат
    const outputFile = path.join(TEST_OUTPUT_DIR, `final_test_fixed_${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    console.log('\n📊 АНАЛИЗ РЕЗУЛЬТАТА:');
    console.log(`✅ Ответ получен: ${JSON.stringify(result).length} символов`);
    console.log(`💾 Сохранено в: ${outputFile}`);
    
    // Проверяем валидации
    const responseText = JSON.stringify(result);
    
    console.log('\n🔍 ВАЛИДАЦИЯ ИСПРАВЛЕНИЙ:');
    
    // 1. Проверка создания папки кампании
    const folderCreated = responseText.includes('create_campaign_folder') || 
                         responseText.includes('Campaign folder created') ||
                         responseText.includes('📁');
    console.log(`1. Создание папки кампании: ${folderCreated ? '✅' : '❌'}`);
    
    // 2. Проверка consolidated content generator
    const consolidatedContent = responseText.includes('content_generator') && 
                               !responseText.includes('simpleContentGenerator');
    console.log(`2. Consolidated Content Generator: ${consolidatedContent ? '✅' : '❌'}`);
    
    // 3. Проверка AI-driven MJML
    const aiMjml = responseText.includes('generateAIDrivenMjmlTemplate') ||
                   responseText.includes('AI-driven MJML') ||
                   responseText.includes('AI-generated MJML');
    console.log(`3. AI-driven MJML Generation: ${aiMjml ? '✅' : '❌'}`);
    
    // 4. Проверка планирования изображений
    const imagePlanning = responseText.includes('figma_asset_selector') ||
                         responseText.includes('image_plan') ||
                         responseText.includes('Planning images');
    console.log(`4. Image Planning: ${imagePlanning ? '✅' : '❌'}`);
    
    // 5. Проверка сохранения файлов
    const fileSaving = responseText.includes('saveHtml') ||
                      responseText.includes('saveMjml') ||
                      responseText.includes('Saved HTML');
    console.log(`5. File Saving: ${fileSaving ? '✅' : '❌'}`);
    
    // 6. Проверка полного workflow
    const workflowComplete = responseText.includes('success') &&
                            responseText.includes('campaign') &&
                            responseText.includes('email');
    console.log(`6. Workflow Complete: ${workflowComplete ? '✅' : '❌'}`);
    
    // Подождем 2 секунды и проверим файлы
    console.log('\n⏳ Ожидание создания файлов...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const filesCreated = await validateCampaignFolder();
    console.log(`7. Files Actually Created: ${filesCreated ? '✅' : '❌'}`);
    
    // Итоговый счет
    const validations = [folderCreated, consolidatedContent, aiMjml, imagePlanning, fileSaving, workflowComplete, filesCreated];
    const passed = validations.filter(v => v).length;
    const total = validations.length;
    
    console.log(`\n🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ: ${passed}/${total} тестов пройдено (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 ВСЕ ИСПРАВЛЕНИЯ РАБОТАЮТ ИДЕАЛЬНО!');
    } else if (passed >= total * 0.8) {
      console.log('✅ Большинство исправлений работают, есть мелкие проблемы');
    } else {
      console.log('⚠️ Есть серьезные проблемы, нужны дополнительные исправления');
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error);
  }
}

// Запуск
runTest().catch(console.error); 