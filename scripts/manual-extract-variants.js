#!/usr/bin/env node

/**
 * Ручное извлечение вариантов с консервативными координатами
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const TARGET_NODE_ID = '2014:3485';

async function manualExtractVariants() {
  console.log('✂️ РУЧНОЕ ИЗВЛЕЧЕНИЕ ВАРИАНТОВ');
  console.log('═'.repeat(40));
  
  try {
    // Используем существующий файл
    const imagePath = path.join(process.cwd(), 'temp', `figma-node-${TARGET_NODE_ID}-1750942733695.png`);
    console.log(`📁 Источник: ${imagePath}`);
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    
    console.log(`📊 Размеры: ${width}×${height}`);
    
    // Создаем выходную директорию
    const outputDir = path.join(process.cwd(), `manual-variants-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Выходная директория: ${outputDir}`);
    
    // Консервативные координаты на основе анализа
    const variants = [
      {
        name: 'rabbit-left',
        startX: 790,
        width: 65,
        description: 'Левый зайчик (узкий)'
      },
      {
        name: 'rabbit-center', 
        startX: 920,
        width: 400,
        description: 'Центральный зайчик (средний)'
      },
      {
        name: 'rabbit-right',
        startX: 1450,
        width: 400,
        description: 'Правый зайчик (широкий)'
      }
    ];
    
    console.log('\n🎯 ИЗВЛЕЧЕНИЕ С КОНСЕРВАТИВНЫМИ КООРДИНАТАМИ');
    console.log('─'.repeat(50));
    
    for (const variant of variants) {
      console.log(`\n📐 ${variant.name} (${variant.description}):`);
      console.log(`   Начало: x=${variant.startX}`);
      console.log(`   Ширина: ${variant.width}px`);
      console.log(`   Конец: x=${variant.startX + variant.width - 1}`);
      
      // Проверяем границы
      if (variant.startX + variant.width > width) {
        const adjustedWidth = width - variant.startX - 10; // Отступ 10px
        console.log(`   ⚠️ Корректировка ширины: ${variant.width} → ${adjustedWidth}`);
        variant.width = adjustedWidth;
      }
      
      if (variant.width <= 0) {
        console.log(`   ❌ Некорректная ширина, пропускаем`);
        continue;
      }
      
      const outputFile = path.join(outputDir, `${variant.name}.png`);
      
      try {
        console.log(`   🔧 Извлекаем: left=${variant.startX}, width=${variant.width}, height=${height}`);
        
        await image
          .extract({
            left: variant.startX,
            top: 0,
            width: variant.width,
            height: height
          })
          .png()
          .toFile(outputFile);
        
        console.log(`   ✅ Успешно сохранен: ${outputFile}`);
        
        // Проверяем размер файла
        const stats = await fs.stat(outputFile);
        console.log(`   📊 Размер: ${(stats.size / 1024).toFixed(1)} KB`);
        
      } catch (error) {
        console.log(`   ❌ Ошибка: ${error.message}`);
        
        // Попробуем с ещё меньшей шириной
        const safeWidth = Math.max(50, variant.width - 50);
        console.log(`   🔄 Повтор с безопасной шириной: ${safeWidth}px`);
        
        try {
          await image
            .extract({
              left: variant.startX,
              top: 0,
              width: safeWidth,
              height: height
            })
            .png()
            .toFile(outputFile);
          
          console.log(`   ✅ Сохранен (уменьшенный): ${outputFile} (${safeWidth}×${height})`);
          
        } catch (retryError) {
          console.log(`   ❌ Повторная ошибка: ${retryError.message}`);
          
          // Последняя попытка с минимальной шириной
          const minWidth = 30;
          console.log(`   🔄 Последняя попытка с шириной: ${minWidth}px`);
          
          try {
            await image
              .extract({
                left: variant.startX,
                top: 0,
                width: minWidth,
                height: height
              })
              .png()
              .toFile(outputFile);
            
            console.log(`   ✅ Сохранен (минимальный): ${outputFile} (${minWidth}×${height})`);
            
          } catch (finalError) {
            console.log(`   ❌ Финальная ошибка: ${finalError.message}`);
          }
        }
      }
    }
    
    // Также создадим несколько тестовых извлечений
    console.log('\n🧪 ТЕСТОВЫЕ ИЗВЛЕЧЕНИЯ');
    console.log('─'.repeat(25));
    
    const testExtracts = [
      { name: 'test-small', startX: 800, width: 50 },
      { name: 'test-medium', startX: 1000, width: 200 },
      { name: 'test-large', startX: 1500, width: 300 }
    ];
    
    for (const test of testExtracts) {
      const outputFile = path.join(outputDir, `${test.name}.png`);
      
      try {
        await image
          .extract({
            left: test.startX,
            top: 0,
            width: test.width,
            height: height
          })
          .png()
          .toFile(outputFile);
        
        console.log(`✅ ${test.name}: ${test.startX}-${test.startX + test.width} (${test.width}px)`);
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    // Сохраняем информацию
    const infoFile = path.join(outputDir, 'extraction-log.json');
    await fs.writeFile(infoFile, JSON.stringify({
      source: 'figma',
      node_id: TARGET_NODE_ID,
      original_size: { width, height },
      extraction_method: 'manual_conservative',
      attempted_variants: variants,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📋 Лог сохранен: ${infoFile}`);
    
    // Показываем результаты
    const files = await fs.readdir(outputDir);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    console.log('\n📊 РЕЗУЛЬТАТЫ');
    console.log('─'.repeat(15));
    console.log(`✅ Создано файлов: ${pngFiles.length}`);
    
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
manualExtractVariants()
  .then(() => {
    console.log('\n🎉 РУЧНОЕ ИЗВЛЕЧЕНИЕ ЗАВЕРШЕНО');
  })
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error);
    process.exit(1);
  }); 