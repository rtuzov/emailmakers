#!/usr/bin/env node

/**
 * Скрипт для обогащения JSON и CSV файлов техническими метаданными изображений
 * Добавляет размеры, соотношение сторон, размер файла, формат и другие данные
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Функция для получения технических метаданных изображения
async function getImageMetadata(imagePath) {
  try {
    const stats = await fs.stat(imagePath);
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    const aspectRatio = metadata.width && metadata.height 
      ? (metadata.width / metadata.height).toFixed(2)
      : null;
    
    const orientation = metadata.width && metadata.height
      ? metadata.width > metadata.height ? 'landscape' : 
        metadata.width < metadata.height ? 'portrait' : 'square'
      : null;

    return {
      technical: {
        width: metadata.width || null,
        height: metadata.height || null,
        format: metadata.format || null,
        fileSize: stats.size,
        fileSizeFormatted: formatFileSize(stats.size),
        aspectRatio: aspectRatio,
        orientation: orientation,
        density: metadata.density || null,
        channels: metadata.channels || null,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || null,
        compression: metadata.compression || null,
        lastModified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString()
      },
      analysis: {
        isIcon: metadata.width <= 64 && metadata.height <= 64,
        isLarge: metadata.width > 1000 || metadata.height > 1000,
        isSquare: metadata.width === metadata.height,
        isWide: aspectRatio > 1.5,
        isTall: aspectRatio < 0.67,
        megapixels: metadata.width && metadata.height 
          ? ((metadata.width * metadata.height) / 1000000).toFixed(2)
          : null
      }
    };
  } catch (error) {
    console.error(`Ошибка анализа ${imagePath}:`, error.message);
    return {
      technical: { error: error.message },
      analysis: { error: error.message }
    };
  }
}

// Форматирование размера файла
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Обогащение JSON файла
async function enrichJsonFile(jsonPath, imagesDir) {
  try {
    console.log(`📄 Обрабатываем JSON: ${jsonPath}`);
    
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    
    if (!jsonData.entries || Object.keys(jsonData.entries).length === 0) {
      console.log(`⚠️  JSON файл пустой: ${jsonPath}`);
      return;
    }

    let enrichedCount = 0;
    
    for (const [key, entry] of Object.entries(jsonData.entries)) {
      // Ищем соответствующий PNG файл
      const possibleImageNames = [
        `${entry.shortName}.png`,
        `${key}.png`,
        `${entry.originalName}.png`
      ];
      
      let imagePath = null;
      for (const imageName of possibleImageNames) {
        const testPath = path.join(imagesDir, imageName);
        try {
          await fs.access(testPath);
          imagePath = testPath;
          break;
        } catch (e) {
          // Файл не найден, пробуем следующий
        }
      }
      
      if (imagePath) {
        const metadata = await getImageMetadata(imagePath);
        entry.imageMetadata = metadata;
        enrichedCount++;
        console.log(`  ✅ ${entry.shortName} - ${metadata.technical.width}x${metadata.technical.height} (${metadata.technical.fileSizeFormatted})`);
      } else {
        console.log(`  ❌ Изображение не найдено для: ${entry.shortName}`);
      }
    }
    
    // Добавляем общую статистику
    jsonData.statistics = {
      ...jsonData.statistics,
      enrichedFiles: enrichedCount,
      lastEnriched: new Date().toISOString(),
      enrichmentVersion: "1.0.0"
    };
    
    // Сохраняем обогащенный JSON
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Обогащено ${enrichedCount} записей в ${jsonPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка обработки JSON ${jsonPath}:`, error.message);
  }
}

// Обогащение CSV файла
async function enrichCsvFile(csvPath, jsonData) {
  try {
    console.log(`📊 Обрабатываем CSV: ${csvPath}`);
    
    const csvContent = await fs.readFile(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      console.log(`⚠️  CSV файл пустой: ${csvPath}`);
      return;
    }
    
    // Добавляем новые колонки к заголовку
    const header = lines[0];
    const newHeader = header + ',Image Width,Image Height,Image File Size,Image Aspect Ratio,Image Orientation,Image Format,Image Megapixels,Is Icon,Is Large';
    
    const enrichedLines = [newHeader];
    
    // Обрабатываем каждую строку данных
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const columns = line.split(',');
      const shortName = columns[1]?.replace(/"/g, ''); // Предполагаем, что shortName во втором столбце
      
      // Ищем соответствующую запись в JSON
      const entry = Object.values(jsonData.entries || {}).find(e => e.shortName === shortName);
      
      if (entry && entry.imageMetadata && entry.imageMetadata.technical) {
        const tech = entry.imageMetadata.technical;
        const analysis = entry.imageMetadata.analysis;
        
        const enrichedLine = line + 
          `,"${tech.width || 'N/A'}"` +
          `,"${tech.height || 'N/A'}"` +
          `,"${tech.fileSizeFormatted || 'N/A'}"` +
          `,"${tech.aspectRatio || 'N/A'}"` +
          `,"${tech.orientation || 'N/A'}"` +
          `,"${tech.format || 'N/A'}"` +
          `,"${analysis.megapixels || 'N/A'}"` +
          `,"${analysis.isIcon ? 'Yes' : 'No'}"` +
          `,"${analysis.isLarge ? 'Yes' : 'No'}"`;
        
        enrichedLines.push(enrichedLine);
      } else {
        // Добавляем пустые значения, если метаданные не найдены
        const enrichedLine = line + ',"N/A","N/A","N/A","N/A","N/A","N/A","N/A","No","No"';
        enrichedLines.push(enrichedLine);
      }
    }
    
    // Сохраняем обогащенный CSV
    await fs.writeFile(csvPath, enrichedLines.join('\n'));
    console.log(`✅ CSV файл обогащен: ${csvPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка обработки CSV ${csvPath}:`, error.message);
  }
}

// Обработка одной папки
async function processDirectory(dirPath) {
  try {
    console.log(`\n🔍 Обрабатываем папку: ${dirPath}`);
    
    const files = await fs.readdir(dirPath);
    const jsonFile = files.find(f => f === 'tag-dictionary.json');
    const csvFile = files.find(f => f === 'tag-dictionary.csv');
    
    if (!jsonFile) {
      console.log(`⚠️  JSON файл не найден в ${dirPath}`);
      return;
    }
    
    const jsonPath = path.join(dirPath, jsonFile);
    
    // Обогащаем JSON файл
    await enrichJsonFile(jsonPath, dirPath);
    
    // Читаем обогащенный JSON для CSV
    const enrichedJsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    
    // Обогащаем CSV файл, если он существует
    if (csvFile) {
      const csvPath = path.join(dirPath, csvFile);
      await enrichCsvFile(csvPath, enrichedJsonData);
    }
    
  } catch (error) {
    console.error(`❌ Ошибка обработки папки ${dirPath}:`, error.message);
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || './figma-all-pages-test';
  
  console.log('🚀 Запуск обогащения метаданными...');
  console.log(`📁 Целевая папка: ${targetDir}`);
  
  try {
    const items = await fs.readdir(targetDir);
    
    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        await processDirectory(itemPath);
      }
    }
    
    console.log('\n🎉 Обогащение завершено!');
    console.log('\n📊 Добавленные метаданные:');
    console.log('   • Размеры изображения (ширина x высота)');
    console.log('   • Размер файла');
    console.log('   • Соотношение сторон');
    console.log('   • Ориентация (landscape/portrait/square)');
    console.log('   • Формат файла');
    console.log('   • Количество мегапикселей');
    console.log('   • Флаги: иконка, большое изображение');
    console.log('   • Цветовое пространство и каналы');
    console.log('   • Даты создания и изменения');
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Показать справку
function showHelp() {
  console.log(`
🔧 Image Metadata Enricher

Этот скрипт добавляет технические метаданные к JSON и CSV файлам.

📋 Использование:
  node enrich-metadata.js [папка]

📁 Параметры:
  папка    Путь к папке с результатами Figma (по умолчанию: ./figma-all-pages-test)

📊 Добавляемые метаданные:
  • Размеры изображения (width, height)
  • Размер файла (в байтах и форматированный)
  • Соотношение сторон (aspect ratio)
  • Ориентация (landscape/portrait/square)
  • Формат файла (PNG, JPEG, etc.)
  • Количество мегапикселей
  • Цветовые характеристики (channels, colorSpace, hasAlpha)
  • Флаги анализа (isIcon, isLarge, isSquare, isWide, isTall)
  • Даты создания и изменения файла

✨ Примеры:
  node enrich-metadata.js                          # Обработать ./figma-all-pages-test
  node enrich-metadata.js ./my-figma-results       # Обработать указанную папку
  node enrich-metadata.js help                     # Показать эту справку
`);
}

// Обработка аргументов
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
} 