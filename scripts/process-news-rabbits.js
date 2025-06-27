#!/usr/bin/env node

/**
 * Скрипт для обработки листа "Зайцы Новости" из Figma
 * Интегрирует с GPT-4 для генерации тегов и переименования файлов
 */

const { processNewsRabbits } = require('../src/agent/tools/figma-news-rabbits-processor');
const path = require('path');

async function main() {
  console.log('🐰 ЗАПУСК ОБРАБОТКИ "ЗАЙЦЫ НОВОСТИ"');
  console.log('═'.repeat(50));

  // Параметры обработки
  const params = {
    figmaUrl: 'https://www.figma.com/design/GBnGxSQlfM1XhjSkLHogk6/%F0%9F%8C%88-%D0%91%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B0-%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%B8%D0%BD%D0%B3%D0%B0--Copy-?t=z7QX9Qp6s7y2dhFi-0',
    outputDirectory: path.join(process.cwd(), `news-rabbits-output-${Date.now()}`),
    context: {
      campaign_type: 'newsletter',
      content_theme: 'новости авиакомпаний и путешествий',
      target_audience: 'пользователи сервиса бронирования билетов',
      brand_guidelines: [
        'дружелюбный тон',
        'позитивная коммуникация',
        'информативность',
        'профессионализм'
      ]
    }
  };

  try {
    console.log('📋 Параметры обработки:');
    console.log(`   Figma URL: ${params.figmaUrl}`);
    console.log(`   Выходная директория: ${params.outputDirectory}`);
    console.log(`   Тип кампании: ${params.context.campaign_type}`);
    console.log(`   Тема контента: ${params.context.content_theme}`);
    console.log('');

    // Запускаем обработку
    const result = await processNewsRabbits(params);

    if (result.success) {
      console.log('✅ ОБРАБОТКА ЗАВЕРШЕНА УСПЕШНО!');
      console.log('─'.repeat(40));
      
      const { data } = result;
      console.log(`📊 Статистика:`);
      console.log(`   Всего ассетов: ${data.summary.totalAssets}`);
      console.log(`   С вариантами: ${data.summary.assetsWithVariants}`);
      console.log(`   Уникальных тегов: ${data.summary.uniqueTags.length}`);
      console.log('');

      console.log(`📁 Результаты сохранены в: ${data.outputDirectory}`);
      console.log(`📄 Отчет: ${data.report}`);
      console.log('');

      console.log('🏷️ Найденные теги:');
      data.summary.uniqueTags.forEach(tag => {
        console.log(`   • ${tag}`);
      });
      console.log('');

      console.log('📋 Обработанные ассеты:');
      data.processedAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.originalName}`);
        console.log(`      → ${asset.newName}`);
        console.log(`      Теги: ${asset.tags.join(', ')}`);
        console.log(`      Варианты: ${asset.metadata.hasVariants ? 'Да' : 'Нет'}`);
        console.log(`      Confidence: ${(asset.metadata.aiAnalysis.confidence * 100).toFixed(1)}%`);
        console.log('');
      });

    } else {
      console.error('❌ ОШИБКА ОБРАБОТКИ:');
      console.error(result.error || 'Неизвестная ошибка');
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Проверяем переменные окружения
function checkEnvironment() {
  const requiredVars = ['FIGMA_ACCESS_TOKEN', 'OPENAI_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Отсутствуют переменные окружения:');
    missing.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    console.error('');
    console.error('Убедитесь, что файл .env.local содержит все необходимые ключи.');
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  checkEnvironment();
  main().catch(error => {
    console.error('❌ Необработанная ошибка:', error);
    process.exit(1);
  });
}

module.exports = { main }; 