#!/usr/bin/env node

/**
 * Скрипт для работы с API обработки "Зайцы Новости"
 * Использует новый API endpoint вместо прямого вызова агента
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/figma/process-news-rabbits';

async function main() {
  console.log('🐰 API ОБРАБОТКА "ЗАЙЦЫ НОВОСТИ"');
  console.log('═'.repeat(50));

  // Параметры запроса
  const requestData = {
    figmaUrl: 'https://www.figma.com/design/GBnGxSQlfM1XhjSkLHogk6/%F0%9F%8C%88-%D0%91%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B0-%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%B8%D0%BD%D0%B3%D0%B0--Copy-?t=z7QX9Qp6s7y2dhFi-0',
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
    },
    options: {
      includeVariants: true,
      generateReport: true,
      aiAnalysis: true,
      maxAssets: 20
    }
  };

  try {
    console.log('📋 Параметры запроса:');
    console.log(`   Figma URL: ${requestData.figmaUrl}`);
    console.log(`   Тип кампании: ${requestData.context.campaign_type}`);
    console.log(`   Тема: ${requestData.context.content_theme}`);
    console.log('');

    // Отправляем запрос на обработку
    console.log('🚀 Отправляем запрос на обработку...');
    const startResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const startResult = await startResponse.json();

    if (!startResult.success) {
      throw new Error(startResult.error || 'Ошибка запуска обработки');
    }

    console.log(`✅ Обработка запущена! Job ID: ${startResult.jobId}`);
    console.log(`📍 Отслеживание: ${startResult.trackingUrl}`);
    console.log('');

    // Отслеживаем прогресс
    await trackProgress(startResult.jobId);

  } catch (error) {
    console.error('❌ ОШИБКА:', error.message);
    process.exit(1);
  }
}

/**
 * Отслеживает прогресс выполнения задачи
 */
async function trackProgress(jobId) {
  console.log('📊 Отслеживаем прогресс...');
  console.log('─'.repeat(40));

  let lastStatus = '';
  let lastProgress = 0;

  while (true) {
    try {
      const response = await fetch(`${API_BASE}/${jobId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Ошибка получения статуса');
      }

      const job = data.job;

      // Выводим обновления только при изменениях
      if (job.status !== lastStatus || job.progress !== lastProgress) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[${timestamp}] ${getStatusEmoji(job.status)} ${job.status.toUpperCase()} - ${job.progress}%`);
        
        if (job.estimatedTimeRemaining) {
          console.log(`   ⏱️ Осталось ~${job.estimatedTimeRemaining}с`);
        }

        lastStatus = job.status;
        lastProgress = job.progress;
      }

      // Проверяем завершение
      if (job.status === 'completed') {
        console.log('');
        console.log('🎉 ОБРАБОТКА ЗАВЕРШЕНА УСПЕШНО!');
        console.log('═'.repeat(50));
        
        if (job.result) {
          console.log('📊 Результаты:');
          console.log(`   Обработано ассетов: ${job.result.assetCount}`);
          console.log(`   Выходная папка: ${job.result.outputDirectory}`);
          console.log(`   Отчет: ${job.result.reportPath}`);
          
          if (job.result.summary?.uniqueTags) {
            console.log(`   Уникальных тегов: ${job.result.summary.uniqueTags.length}`);
            console.log('   Теги:', job.result.summary.uniqueTags.join(', '));
          }
        }
        break;
      }

      if (job.status === 'failed') {
        console.log('');
        console.log('❌ ОБРАБОТКА ПРОВАЛИЛАСЬ!');
        console.log('═'.repeat(50));
        if (job.error) {
          console.log(`Ошибка: ${job.error}`);
        }
        process.exit(1);
      }

      // Ждем перед следующей проверкой
      await sleep(2000);

    } catch (error) {
      console.error('❌ Ошибка отслеживания:', error.message);
      await sleep(5000); // Ждем дольше при ошибке
    }
  }
}

/**
 * Получает эмодзи для статуса
 */
function getStatusEmoji(status) {
  const emojis = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    failed: '❌'
  };
  return emojis[status] || '❓';
}

/**
 * Показывает список всех задач
 */
async function listJobs() {
  console.log('📋 СПИСОК ЗАДАЧ');
  console.log('═'.repeat(50));

  try {
    const response = await fetch(API_BASE);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Ошибка получения списка задач');
    }

    if (data.jobs.length === 0) {
      console.log('Задач пока нет');
      return;
    }

    data.jobs.forEach((job, index) => {
      const duration = job.endTime 
        ? Math.round((new Date(job.endTime) - new Date(job.startTime)) / 1000)
        : Math.round((new Date() - new Date(job.startTime)) / 1000);

      console.log(`${index + 1}. ${job.id}`);
      console.log(`   ${getStatusEmoji(job.status)} ${job.status} (${job.progress}%)`);
      console.log(`   Время: ${new Date(job.startTime).toLocaleString('ru-RU')}`);
      console.log(`   Длительность: ${formatDuration(duration)}`);
      if (job.metadata.totalAssets) {
        console.log(`   Ассетов: ${job.metadata.totalAssets}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

/**
 * Форматирует длительность в человекочитаемый вид
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}м`;
  return `${Math.round(seconds / 3600)}ч`;
}

/**
 * Простая функция сна
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listJobs().catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
} else if (command === 'help') {
  console.log('Использование:');
  console.log('  node scripts/api-process-news-rabbits.js        # Запустить обработку');
  console.log('  node scripts/api-process-news-rabbits.js list   # Показать список задач');
  console.log('  node scripts/api-process-news-rabbits.js help   # Показать справку');
} else {
  // По умолчанию запускаем обработку
  main().catch(error => {
    console.error('❌ Необработанная ошибка:', error);
    process.exit(1);
  });
} 