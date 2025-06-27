#!/usr/bin/env node

/**
 * Безопасное извлечение 3 вариантов с известными координатами
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const TARGET_NODE_ID = '2014:3485';

// Найденные координаты
const VARIANTS = [
  { name: 'variant-1', startX: 787, endX: 858, width: 72 },
  { name: 'variant-2', startX: 910, endX: 1443, width: 534 },
  { name: 'variant-3', startX: 1444, endX: 1976, width: 533 }
];

async function safeExtractVariants() {
  console.log('🔧 БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ВАРИАНТОВ');
  console.log('═'.repeat(45));
  
  try {
    // Используем существующий файл
    const imagePath = path.join(process.cwd(), 'temp', `figma-node-${TARGET_NODE_ID}-1750942733695.png`);
    console.log(`📁 Источник: ${imagePath}`);
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    
    console.log(`📊 Размеры изображения: ${width}×${height}`);
    
    // Создаем выходную директорию
    const outputDir = path.join(process.cwd(), `rabbit-variants-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Выходная директория: ${outputDir}`);
    
    console.log('\n🎯 ИЗВЛЕЧЕНИЕ ВАРИАНТОВ');
    console.log('─'.repeat(30));
    
    for (const variant of VARIANTS) {
      console.log(`\n📐 ${variant.name}:`);
      console.log(`   Координаты: x=${variant.startX}-${variant.endX}`);
      console.log(`   Ширина: ${variant.width}px`);
      
      // Безопасные координаты с проверками
      const safeStartX = Math.max(0, variant.startX);
      const safeEndX = Math.min(variant.endX, width - 1);
      const safeWidth = safeEndX - safeStartX + 1;
      
      console.log(`   Безопасные: x=${safeStartX}-${safeEndX}, ширина=${safeWidth}px`);
      
      // Проверяем, что координаты корректны
      if (safeWidth <= 0 || safeStartX >= width) {
        console.log(`   ❌ Некорректные координаты, пропускаем`);
        continue;
      }
      
      const outputFile = path.join(outputDir, `${variant.name}.png`);
      
      try {
        // Извлекаем с минимальными отступами
        await image
          .extract({
            left: safeStartX,
            top: 0,
            width: safeWidth,
            height: height
          })
          .png()
          .toFile(outputFile);
        
        console.log(`   ✅ Сохранен: ${outputFile} (${safeWidth}×${height})`);
        
        // Проверяем размер файла
        const stats = await fs.stat(outputFile);
        console.log(`   📊 Размер файла: ${(stats.size / 1024).toFixed(1)} KB`);
        
      } catch (extractError) {
        console.log(`   ❌ Ошибка извлечения: ${extractError.message}`);
        
        // Попробуем с уменьшенной шириной
        const reducedWidth = Math.max(1, safeWidth - 20);
        console.log(`   🔄 Повтор с шириной ${reducedWidth}px`);
        
        try {
          await image
            .extract({
              left: safeStartX,
              top: 0,
              width: reducedWidth,
              height: height
            })
            .png()
            .toFile(outputFile);
          
          console.log(`   ✅ Сохранен (уменьшенный): ${outputFile} (${reducedWidth}×${height})`);
          
        } catch (retryError) {
          console.log(`   ❌ Повторная ошибка: ${retryError.message}`);
        }
      }
    }
    
    // Создаем полное изображение для сравнения
    const fullOutputFile = path.join(outputDir, 'full-original.png');
    await image.png().toFile(fullOutputFile);
    console.log(`\n📋 Полное изображение сохранено: ${fullOutputFile}`);
    
    // Сохраняем метаданные
    const metadataFile = path.join(outputDir, 'extraction-info.json');
    await fs.writeFile(metadataFile, JSON.stringify({
      source: 'figma',
      node_id: TARGET_NODE_ID,
      original_size: { width, height },
      extraction_method: 'safe_coordinates',
      variants: VARIANTS,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`📋 Метаданные: ${metadataFile}`);
    
    // Показываем итоги
    console.log('\n📊 ИТОГИ ИЗВЛЕЧЕНИЯ');
    console.log('─'.repeat(20));
    
    const files = await fs.readdir(outputDir);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    console.log(`✅ Создано PNG файлов: ${pngFiles.length}`);
    for (const file of pngFiles) {
      const filePath = path.join(outputDir, file);
      const stats = await fs.stat(filePath);
      console.log(`   📄 ${file}: ${(stats.size / 1024).toFixed(1)} KB`);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

// Запуск
safeExtractVariants()
  .then(() => {
    console.log('\n🎉 БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ ЗАВЕРШЕНО');
  })
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  }); 