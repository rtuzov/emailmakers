#!/usr/bin/env node

/**
 * Разделение Figma спрайта на 3 варианта
 * Специализированный алгоритм для "заяц Общие 09"
 */

const fetch = require('node-fetch');
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

// Конфигурация
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || 'YOUR_FIGMA_TOKEN_HERE';
const FIGMA_PROJECT_ID = 'GBnGxSQlfM1XhjSkLHogk6';
const TARGET_NODE_ID = '2014:3485';

async function split3Variants() {
  console.log('🎯 РАЗДЕЛЕНИЕ НА 3 ВАРИАНТА');
  console.log('═'.repeat(40));
  
  try {
    // Используем существующий файл
    const imagePath = path.join(process.cwd(), 'temp', `figma-node-${TARGET_NODE_ID}-1750942733695.png`);
    console.log(`📁 Анализируем: ${imagePath}`);
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    
    console.log(`📊 Размеры: ${width}×${height}`);
    
    // Получаем данные пикселей
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const { channels } = info;
    
    // Анализируем плотность контента по колонкам
    const columnDensity = [];
    
    for (let x = 0; x < width; x++) {
      let contentPixels = 0;
      
      for (let y = 0; y < height; y++) {
        const pixelIndex = (y * width + x) * channels;
        
        if (channels === 4) {
          const alpha = data[pixelIndex + 3];
          if (alpha > 30) { // Не прозрачный
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < 220) { // Не белый фон
              contentPixels++;
            }
          }
        }
      }
      
      columnDensity.push({
        x: x,
        density: contentPixels / height,
        contentPixels: contentPixels
      });
    }
    
    // Находим области с контентом
    const minDensity = 0.05; // 5% минимум для контента
    const contentAreas = [];
    let currentArea = null;
    
    for (let i = 0; i < columnDensity.length; i++) {
      const col = columnDensity[i];
      
      if (col.density > minDensity) {
        if (!currentArea) {
          currentArea = {
            startX: col.x,
            endX: col.x,
            maxDensity: col.density,
            totalContent: col.contentPixels
          };
        } else {
          currentArea.endX = col.x;
          currentArea.maxDensity = Math.max(currentArea.maxDensity, col.density);
          currentArea.totalContent += col.contentPixels;
        }
      } else {
        if (currentArea) {
          currentArea.width = currentArea.endX - currentArea.startX + 1;
          if (currentArea.width > 30) { // Минимальная ширина
            contentAreas.push(currentArea);
          }
          currentArea = null;
        }
      }
    }
    
    // Добавляем последнюю область
    if (currentArea) {
      currentArea.width = currentArea.endX - currentArea.startX + 1;
      if (currentArea.width > 30) {
        contentAreas.push(currentArea);
      }
    }
    
    console.log(`\n🔍 НАЙДЕНО ОБЛАСТЕЙ: ${contentAreas.length}`);
    contentAreas.forEach((area, index) => {
      console.log(`📍 Область ${index + 1}: x=${area.startX}-${area.endX}, ширина=${area.width}, плотность=${(area.maxDensity * 100).toFixed(1)}%`);
    });
    
    // Если найдена только одна большая область, разделим её на 3 части
    if (contentAreas.length === 1) {
      console.log('\n🔧 ПРИНУДИТЕЛЬНОЕ РАЗДЕЛЕНИЕ НА 3 ЧАСТИ');
      await forceSplit3Parts(image, contentAreas[0], width, height, columnDensity);
    } else if (contentAreas.length >= 3) {
      console.log('\n✅ ИЗВЛЕКАЕМ НАЙДЕННЫЕ ОБЛАСТИ');
      await extractAreas(image, contentAreas.slice(0, 3), width, height);
    } else {
      console.log('\n🔧 УМНОЕ РАЗДЕЛЕНИЕ');
      await smartSplit(image, contentAreas, width, height, columnDensity);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

async function forceSplit3Parts(image, area, width, height, columnDensity) {
  console.log(`📏 Разделяем область ${area.startX}-${area.endX} (${area.width}px) на 3 части`);
  
  // Анализируем плотность внутри области для поиска натуральных разделителей
  const areaData = columnDensity.slice(area.startX, area.endX + 1);
  
  // Ищем локальные минимумы плотности
  const localMinima = [];
  for (let i = 1; i < areaData.length - 1; i++) {
    const prev = areaData[i - 1].density;
    const curr = areaData[i].density;
    const next = areaData[i + 1].density;
    
    if (curr < prev && curr < next && curr < 0.3) {
      localMinima.push({
        x: area.startX + i,
        density: curr,
        relativeX: i
      });
    }
  }
  
  console.log(`🔍 Найдено локальных минимумов: ${localMinima.length}`);
  
  let variants = [];
  
  if (localMinima.length >= 2) {
    // Используем два лучших минимума для разделения на 3 части
    localMinima.sort((a, b) => a.density - b.density); // Сортируем по плотности
    const split1 = Math.min(localMinima[0].x, localMinima[1].x);
    const split2 = Math.max(localMinima[0].x, localMinima[1].x);
    
    variants = [
      { startX: area.startX, endX: split1, name: 'variant-1' },
      { startX: split1 + 1, endX: split2, name: 'variant-2' },
      { startX: split2 + 1, endX: area.endX, name: 'variant-3' }
    ];
    
    console.log(`✂️ Разделение по минимумам: ${split1}, ${split2}`);
  } else {
    // Равномерное разделение на 3 части
    const partWidth = Math.floor(area.width / 3);
    
    variants = [
      { startX: area.startX, endX: area.startX + partWidth - 1, name: 'variant-1' },
      { startX: area.startX + partWidth, endX: area.startX + partWidth * 2 - 1, name: 'variant-2' },
      { startX: area.startX + partWidth * 2, endX: area.endX, name: 'variant-3' }
    ];
    
    console.log(`✂️ Равномерное разделение по ${partWidth}px`);
  }
  
  await extractVariants(image, variants, width, height);
}

async function smartSplit(image, areas, width, height, columnDensity) {
  console.log('🧠 Умное разделение на основе анализа плотности');
  
  // Если есть 2 области, попробуем разделить одну из них
  if (areas.length === 2) {
    const largerArea = areas[0].width > areas[1].width ? areas[0] : areas[1];
    const smallerArea = areas[0].width > areas[1].width ? areas[1] : areas[0];
    
    console.log(`📊 Большая область: ${largerArea.width}px, малая: ${smallerArea.width}px`);
    
    // Разделяем большую область пополам
    const midPoint = Math.floor((largerArea.startX + largerArea.endX) / 2);
    
    const variants = [
      { startX: smallerArea.startX, endX: smallerArea.endX, name: 'variant-1' },
      { startX: largerArea.startX, endX: midPoint, name: 'variant-2' },
      { startX: midPoint + 1, endX: largerArea.endX, name: 'variant-3' }
    ];
    
    // Сортируем по startX
    variants.sort((a, b) => a.startX - b.startX);
    variants.forEach((v, i) => v.name = `variant-${i + 1}`);
    
    await extractVariants(image, variants, width, height);
  }
}

async function extractAreas(image, areas, width, height) {
  const variants = areas.map((area, index) => ({
    startX: area.startX,
    endX: area.endX,
    name: `variant-${index + 1}`
  }));
  
  await extractVariants(image, variants, width, height);
}

async function extractVariants(image, variants, width, height) {
  const outputDir = path.join(process.cwd(), `figma-3-variants-${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  
  console.log(`\n📁 Создана директория: ${outputDir}`);
  
  for (const variant of variants) {
    const outputFile = path.join(outputDir, `${variant.name}.png`);
    const variantWidth = variant.endX - variant.startX + 1;
    
    console.log(`📐 ${variant.name}: x=${variant.startX}-${variant.endX}, ширина=${variantWidth}px`);
    
    // Добавляем небольшие отступы
    const padding = 5;
    const extractLeft = Math.max(0, variant.startX - padding);
    const extractWidth = Math.min(variantWidth + padding * 2, width - extractLeft);
    
    try {
      await image
        .extract({
          left: extractLeft,
          top: 0,
          width: extractWidth,
          height: height
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Сохранен ${variant.name}: ${outputFile} (${extractWidth}×${height})`);
      
    } catch (error) {
      console.log(`❌ Ошибка извлечения ${variant.name}: ${error.message}`);
    }
  }
  
  // Сохраняем метаданные
  const metadataFile = path.join(outputDir, 'variants.json');
  await fs.writeFile(metadataFile, JSON.stringify({
    source: 'figma',
    node_id: TARGET_NODE_ID,
    original_size: { width, height },
    variants: variants.map((variant, index) => ({
      name: variant.name,
      startX: variant.startX,
      endX: variant.endX,
      width: variant.endX - variant.startX + 1
    })),
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`📋 Метаданные сохранены: ${metadataFile}`);
}

// Запуск
split3Variants()
  .then(() => {
    console.log('\n🎉 РАЗДЕЛЕНИЕ НА 3 ВАРИАНТА ЗАВЕРШЕНО');
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }); 