#!/usr/bin/env node

/**
 * Скрипт для анализа изображений и добавления блока analysis
 * Анализирует каждое изображение и добавляет подробную информацию
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// Функция для анализа цветовой палитры
async function analyzeColors(imagePath) {
  try {
    const image = sharp(imagePath);
    const { dominant } = await image.stats();
    
    // Анализ доминантных цветов
    const colors = {
      red: dominant.r,
      green: dominant.g,
      blue: dominant.b
    };
    
    // Определение основного цвета
    let primaryColor = 'neutral';
    if (colors.red > 150 && colors.green < 100 && colors.blue < 100) {
      primaryColor = 'red';
    } else if (colors.green > 150 && colors.red < 100 && colors.blue < 100) {
      primaryColor = 'green';
    } else if (colors.blue > 150 && colors.red < 100 && colors.green < 100) {
      primaryColor = 'blue';
    } else if (colors.red > 200 && colors.green > 150 && colors.blue < 100) {
      primaryColor = 'orange';
    } else if (colors.red > 150 && colors.green > 150 && colors.blue < 100) {
      primaryColor = 'yellow';
    } else if (colors.red > 100 && colors.green < 100 && colors.blue > 150) {
      primaryColor = 'purple';
    } else if (colors.red > 200 && colors.green > 200 && colors.blue > 200) {
      primaryColor = 'white';
    } else if (colors.red < 50 && colors.green < 50 && colors.blue < 50) {
      primaryColor = 'black';
    }
    
    return {
      dominant: colors,
      primaryColor,
      brightness: Math.round((colors.red + colors.green + colors.blue) / 3),
      saturation: Math.round(Math.max(colors.red, colors.green, colors.blue) - Math.min(colors.red, colors.green, colors.blue))
    };
  } catch (error) {
    return {
      dominant: { red: 128, green: 128, blue: 128 },
      primaryColor: 'neutral',
      brightness: 128,
      saturation: 0
    };
  }
}

// Функция для анализа композиции
async function analyzeComposition(imagePath, metadata) {
  const aspectRatio = metadata.width / metadata.height;
  
  let composition = 'square';
  if (aspectRatio > 1.5) {
    composition = 'wide_landscape';
  } else if (aspectRatio > 1.1) {
    composition = 'landscape';
  } else if (aspectRatio < 0.7) {
    composition = 'tall_portrait';
  } else if (aspectRatio < 0.9) {
    composition = 'portrait';
  }
  
  // Анализ сложности (примерный на основе размера файла)
  const complexity = metadata.size > 100000 ? 'complex' : 
                    metadata.size > 50000 ? 'medium' : 'simple';
  
  return {
    aspectRatio: parseFloat(aspectRatio.toFixed(2)),
    composition,
    complexity,
    resolution: `${metadata.width}x${metadata.height}`,
    pixelDensity: Math.round(metadata.width * metadata.height / 1000000 * 100) / 100
  };
}

// Функция для анализа содержимого на основе тегов
function analyzeContent(tags, fileName) {
  const categories = {
    characters: ['заяц', 'кролик', 'персонаж', 'животные', 'мультфильм'],
    emotions: ['веселье', 'радость', 'грусть', 'счастье', 'эмоции', 'улыбка'],
    travel: ['путешествие', 'авиабилет', 'авиация', 'отпуск', 'сочи'],
    business: ['маркетинг', 'email', 'бизнес', 'логотип', 'брендинг'],
    activities: ['спорт', 'музыка', 'чтение', 'игра', 'отдых'],
    technology: ['мобильные', 'технологии', 'дизайн', 'инновации'],
    nature: ['экология', 'природа', 'лето', 'зима'],
    food: ['еда', 'кофе', 'напитки'],
    abstract: ['графика', 'дизайн', 'креатив', 'арт']
  };
  
  const detectedCategories = [];
  const contentElements = [];
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(keyword => 
      tags.some(tag => tag.toLowerCase().includes(keyword))
    );
    if (matches.length > 0) {
      detectedCategories.push(category);
      contentElements.push(...matches);
    }
  }
  
  // Определение основной темы
  let primaryTheme = 'general';
  if (detectedCategories.includes('characters')) primaryTheme = 'character_based';
  else if (detectedCategories.includes('travel')) primaryTheme = 'travel_related';
  else if (detectedCategories.includes('business')) primaryTheme = 'business_oriented';
  else if (detectedCategories.includes('technology')) primaryTheme = 'tech_focused';
  
  return {
    categories: detectedCategories,
    primaryTheme,
    contentElements: [...new Set(contentElements)],
    complexity: detectedCategories.length > 3 ? 'multi_theme' : 
                detectedCategories.length > 1 ? 'dual_theme' : 'single_theme'
  };
}

// Функция для анализа использования в email
function analyzeEmailUsage(metadata, colors, content) {
  const usageRecommendations = [];
  const suitability = {};
  
  // Анализ размера для email
  if (metadata.width <= 600 && metadata.height <= 400) {
    usageRecommendations.push('header_banner');
    suitability.header = 'excellent';
  } else if (metadata.width <= 300 && metadata.height <= 300) {
    usageRecommendations.push('icon', 'inline_element');
    suitability.icon = 'excellent';
  } else if (metadata.width > 800) {
    usageRecommendations.push('hero_image');
    suitability.hero = 'good';
  }
  
  // Анализ цвета для email
  if (colors.brightness > 200) {
    usageRecommendations.push('light_theme_background');
    suitability.lightTheme = 'excellent';
  } else if (colors.brightness < 80) {
    usageRecommendations.push('dark_theme_accent');
    suitability.darkTheme = 'good';
  }
  
  // Анализ содержимого для email
  if (content.categories.includes('emotions')) {
    usageRecommendations.push('engagement_element');
    suitability.engagement = 'excellent';
  }
  
  if (content.categories.includes('business')) {
    usageRecommendations.push('professional_communication');
    suitability.professional = 'excellent';
  }
  
  return {
    recommendations: usageRecommendations,
    suitability,
    fileSize: metadata.size < 100000 ? 'optimal' : 
              metadata.size < 500000 ? 'acceptable' : 'too_large',
    loadingSpeed: metadata.size < 50000 ? 'fast' : 
                  metadata.size < 200000 ? 'medium' : 'slow'
  };
}

// Основная функция анализа файла
async function analyzeImage(imagePath, tags, fileName) {
  try {
    console.log(`  🔍 Анализируем: ${fileName}`);
    
    // Получаем базовые метаданные
    const stats = await fs.stat(imagePath);
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Выполняем различные виды анализа
    const [colors, composition] = await Promise.all([
      analyzeColors(imagePath),
      analyzeComposition(imagePath, { ...metadata, size: stats.size })
    ]);
    
    const content = analyzeContent(tags, fileName);
    const emailUsage = analyzeEmailUsage(
      { ...metadata, size: stats.size }, 
      colors, 
      content
    );
    
    // Формируем итоговый анализ
    const analysis = {
      visual: {
        colors,
        composition,
        quality: metadata.width * metadata.height > 1000000 ? 'high' : 
                metadata.width * metadata.height > 100000 ? 'medium' : 'standard'
      },
      content,
      emailUsage,
      technical: {
        fileSize: stats.size,
        dimensions: `${metadata.width}x${metadata.height}`,
        format: metadata.format,
        hasAlpha: metadata.channels === 4,
        colorSpace: metadata.space || 'srgb'
      },
      score: {
        visual: Math.min(100, Math.round((colors.saturation + colors.brightness) / 2.55)),
        content: Math.min(100, content.contentElements.length * 15),
        technical: Math.min(100, 100 - (stats.size / 10000)),
        overall: 0 // будет вычислен ниже
      }
    };
    
    // Вычисляем общий балл
    analysis.score.overall = Math.round(
      (analysis.score.visual + analysis.score.content + analysis.score.technical) / 3
    );
    
    return analysis;
    
  } catch (error) {
    console.log(`  ❌ Ошибка анализа ${fileName}: ${error.message}`);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Функция для обработки одного JSON файла
async function processJsonFile(jsonPath, folderName) {
  try {
    console.log(`📄 Обрабатываем JSON: ${jsonPath}`);
    
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    
    if (!jsonData.entries || Object.keys(jsonData.entries).length === 0) {
      console.log(`⚠️  JSON файл пустой: ${jsonPath}`);
      return;
    }
    
    let processedCount = 0;
    const totalEntries = Object.keys(jsonData.entries).length;
    
    // Обрабатываем каждую запись
    for (const [fileName, entry] of Object.entries(jsonData.entries)) {
      if (!entry.analysis || entry.analysis.error) { // Добавляем анализ если его нет или есть ошибка
        // Добавляем расширение .png если его нет
        const imageFileName = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        const imagePath = path.join(path.dirname(jsonPath), imageFileName);
        
        // Проверяем, существует ли файл
        try {
          await fs.access(imagePath);
          const analysis = await analyzeImage(imagePath, entry.tags || [], fileName);
          entry.analysis = analysis;
          processedCount++;
        } catch (error) {
          console.log(`  ⚠️  Файл не найден: ${imageFileName}`);
          entry.analysis = {
            error: 'File not found',
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    // Добавляем метаданные анализа
    jsonData.analysisMetadata = {
      lastAnalysis: new Date().toISOString(),
      totalFiles: totalEntries,
      analyzedFiles: processedCount,
      version: '1.0.0'
    };
    
    // Сохраняем обновленный JSON
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✅ Анализ добавлен для ${processedCount} файлов в ${jsonPath}`);
    
  } catch (error) {
    console.log(`❌ Ошибка обработки ${jsonPath}: ${error.message}`);
  }
}

// Основная функция
async function main() {
  const targetDir = process.argv[2] || 'figma-all-pages-1750993353363';
  
  console.log('🔬 Запуск анализа изображений...');
  console.log(`📁 Целевая папка: ${targetDir}`);
  
  try {
    const folders = await fs.readdir(targetDir);
    
    for (const folder of folders) {
      const folderPath = path.join(targetDir, folder);
      const stat = await fs.stat(folderPath);
      
      if (stat.isDirectory()) {
        console.log(`\n🔍 Обрабатываем папку: ${folderPath}`);
        
        const jsonPath = path.join(folderPath, 'tag-dictionary.json');
        
        try {
          await fs.access(jsonPath);
          await processJsonFile(jsonPath, folder);
        } catch (error) {
          console.log(`⚠️  JSON файл не найден: ${jsonPath}`);
        }
      }
    }
    
    console.log('\n🎉 Анализ завершен!');
    console.log('\n📊 Добавленные блоки анализа:');
    console.log('   • Визуальный анализ (цвета, композиция, качество)');
    console.log('   • Анализ содержимого (категории, темы, элементы)');
    console.log('   • Рекомендации для email (использование, пригодность)');
    console.log('   • Технические характеристики');
    console.log('   • Оценочные баллы (визуал, контент, техника, общий)');
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
} 