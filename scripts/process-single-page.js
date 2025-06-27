#!/usr/bin/env node

/**
 * CLI скрипт для обработки одной конкретной страницы Figma
 */

const FIGMA_URL = 'https://www.figma.com/design/GBnGxSQlfM1XhjSkLHogk6/%F0%9F%8C%88-%D0%91%D0%B8%D0%B1%D0%BB%D0%B8%D0%BE%D1%82%D0%B5%D0%BA%D0%B0-%D0%BC%D0%B0%D1%80%D0%BA%D0%B5%D1%82%D0%B8%D0%BD%D0%B3%D0%B0--Copy-?t=z7QX9Qp6s7y2dhFi';
const API_BASE = 'http://localhost:3000';

// Доступные страницы для обработки
const AVAILABLE_PAGES = {
  'цвета': { name: 'Цвета', id: '930:967' },
  'айдентика': { name: 'Айдентика', id: '1989:9' },
  'зайцы-общие': { name: 'Зайцы общие', id: '1718:2' },
  'зайцы-прочее': { name: 'Зайцы прочее', id: '9622:1080' },
  'зайцы-подборка': { name: 'Зайцы подборка', id: '9622:1059' },
  'зайцы-новости': { name: 'Зайцы новости', id: '9622:1068' },
  'зайцы-эмоции': { name: 'Зайцы эмоции', id: '9622:1076' },
  'иллюстрации': { name: 'Иллюстрации', id: '3077:274' },
  'иконки': { name: 'Иконки доп.услуг', id: '1816:2' },
  'логотипы': { name: 'Логотипы АК', id: '2926:2' }
};

async function processSinglePage(pageKey) {
  try {
    if (!pageKey || !AVAILABLE_PAGES[pageKey]) {
      console.log('❌ Неверное название страницы');
      showAvailablePages();
      return;
    }

    const page = AVAILABLE_PAGES[pageKey];
    
    console.log(`🎯 Обрабатываем страницу: "${page.name}"`);
    console.log(`🔗 Figma URL: ${FIGMA_URL}`);

         const requestBody = {
       figmaUrl: FIGMA_URL,
       outputDirectory: `./figma-page-${pageKey}-${Date.now()}`,
       targetPageId: page.id,  // Добавляем ID конкретной страницы
       context: null  // Убираем все преднастроенные контексты для чистого анализа
     };

         console.log('📋 Параметры запроса:');
     console.log(`   📄 Страница: ${page.name} (${page.id})`);
     console.log(`   📁 Папка: ${requestBody.outputDirectory}`);
     console.log(`   🎨 Контекст: ${requestBody.context ? 'настроенный' : 'чистый анализ'}`);

    console.log('\n⏳ Отправляем запрос на обработку...');

    const response = await fetch(`${API_BASE}/api/figma/process-single-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${data.error || data.details || 'Unknown error'}`);
    }

    if (!data.success) {
      throw new Error(`Processing failed: ${data.error || 'Unknown error'}`);
    }

    console.log('\n🎉 Обработка завершена успешно!');
    console.log('\n📊 Результаты:');
    console.log(`   📄 Страница: ${page.name}`);
    console.log(`   🖼️  Обработано ассетов: ${data.data.processedAssets}`);
    console.log(`   🏷️  Уникальных тегов: ${data.data.summary.uniqueTags}`);
    console.log(`   📁 Результаты сохранены в: ${data.data.outputDirectory}`);

    console.log('\n✨ Страница обработана! Проверьте папку с результатами.');

  } catch (error) {
    console.error('\n💥 Ошибка:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ Сервер не запущен. Запустите сервер командой: npm run dev');
    } else if (error.message.includes('FIGMA_ACCESS_TOKEN')) {
      console.error('❌ Не найден FIGMA_ACCESS_TOKEN в переменных окружения');
      console.error('   Добавьте токен в файл .env.local');
    } else if (error.message.includes('API Error: 500')) {
      console.error('❌ Внутренняя ошибка сервера. Проверьте логи сервера.');
    } else if (error.message.includes('404')) {
      console.error('❌ API endpoint не найден. Нужно создать /api/figma/process-single-page');
    }
    
    process.exit(1);
  }
}

function showAvailablePages() {
  console.log('\n📋 Доступные страницы для обработки:');
  Object.entries(AVAILABLE_PAGES).forEach(([key, page]) => {
    console.log(`   ${key.padEnd(15)} → "${page.name}"`);
  });
  
  console.log('\n💡 Использование:');
  console.log('   node process-single-page.js зайцы-прочее');
  console.log('   node process-single-page.js иллюстрации');
  console.log('   node process-single-page.js зайцы-эмоции');
}

function showHelp() {
  console.log(`
🎯 Figma Single Page Processor - CLI

Этот скрипт обрабатывает ОДНУ конкретную страницу Figma файла.

📋 Команды:
  node process-single-page.js <page-key>     - Обработать конкретную страницу
  node process-single-page.js list          - Показать доступные страницы
  node process-single-page.js help          - Показать эту справку

🔧 Настройка:
  1. Убедитесь, что сервер запущен: npm run dev
  2. Добавьте FIGMA_ACCESS_TOKEN в .env.local

📁 Результат:
  Страница будет обработана в отдельную папку:
  - figma-page-[page-key]-[timestamp]/
    ├── *.png                    (изображения)
    ├── tag-dictionary.json      (словарь тегов)
    ├── agent-file-mapping.json  (для агента)
    └── page-processing-report.json (отчет)

✨ Особенности:
  - Автоматическое сохранение словаря после каждого файла
  - Оптимизация тегов (максимум 6 тегов на файл)
  - Обработка вариантов компонентов
  - Быстрая обработка одной страницы
`);
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list':
    showAvailablePages();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  case undefined:
    console.log('❌ Укажите страницу для обработки');
    showAvailablePages();
    break;
  default:
    processSinglePage(command);
    break;
} 