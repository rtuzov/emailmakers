#!/usr/bin/env node

/**
 * Скрипт для заполнения analysis внутри imageMetadata и объединения анализов
 */

const fs = require('fs').promises;
const path = require('path');

// Функция для расширенного анализа изображения
function createExtendedImageAnalysis(metadata, mainAnalysis) {
  const technical = metadata.technical;
  const width = technical.width;
  const height = technical.height;
  const fileSize = technical.fileSize;
  const aspectRatio = width / height;
  
  return {
    // Размерный анализ
    dimensions: {
      isIcon: width <= 64 && height <= 64,
      isSmall: width <= 200 && height <= 200,
      isMedium: width > 200 && width <= 800 && height > 200 && height <= 800,
      isLarge: width > 800 || height > 800,
      isSquare: Math.abs(aspectRatio - 1) < 0.1,
      isWide: aspectRatio > 1.5,
      isTall: aspectRatio < 0.7,
      isPortrait: aspectRatio < 0.9,
      isLandscape: aspectRatio > 1.1
    },
    
    // Качественный анализ
    quality: {
      resolution: `${width}x${height}`,
      megapixels: parseFloat((width * height / 1000000).toFixed(2)),
      pixelDensity: technical.density || 72,
      qualityLevel: width * height > 1000000 ? 'high' : 
                   width * height > 100000 ? 'medium' : 'standard',
      sharpness: width > 500 && height > 500 ? 'high' : 
                width > 200 && height > 200 ? 'medium' : 'low'
    },
    
    // Файловый анализ
    file: {
      sizeBytes: fileSize,
      sizeKB: Math.round(fileSize / 1024),
      sizeMB: parseFloat((fileSize / (1024 * 1024)).toFixed(2)),
      sizeCategory: fileSize < 50000 ? 'small' : 
                   fileSize < 200000 ? 'medium' : 
                   fileSize < 500000 ? 'large' : 'very_large',
      compressionRatio: parseFloat((fileSize / (width * height * 4)).toFixed(3)),
      efficiency: fileSize < 100000 ? 'optimal' : 
                 fileSize < 500000 ? 'acceptable' : 'needs_optimization'
    },
    
    // Технический анализ
    technical: {
      format: technical.format,
      hasAlpha: technical.hasAlpha,
      channels: technical.channels,
      colorSpace: technical.colorSpace,
      bitDepth: technical.channels === 4 ? 32 : 24,
      isTransparent: technical.hasAlpha,
      isOptimized: fileSize < (width * height * 2)
    },
    
    // Email пригодность
    emailCompatibility: {
      sizeForEmail: fileSize < 100000 ? 'excellent' : 
                   fileSize < 500000 ? 'good' : 'poor',
      loadingSpeed: fileSize < 50000 ? 'fast' : 
                   fileSize < 200000 ? 'medium' : 'slow',
      mobileOptimized: width <= 600 && fileSize < 200000,
      retinalReady: width >= 300 && height >= 300,
      webOptimized: technical.format === 'png' && fileSize < 300000
    },
    
    // Использование
    usageRecommendations: {
      bestFor: width <= 64 ? ['icon', 'button'] :
              width <= 300 ? ['thumbnail', 'avatar', 'small_banner'] :
              width <= 600 ? ['content_image', 'email_header'] :
              ['hero_image', 'background', 'large_banner'],
      
      emailContext: aspectRatio > 2 ? ['header_banner', 'footer_banner'] :
                   aspectRatio < 0.5 ? ['sidebar_element', 'vertical_banner'] :
                   width <= 300 ? ['inline_icon', 'content_accent'] :
                   ['main_content', 'featured_image'],
      
      responsiveBreakpoints: {
        mobile: width <= 320 ? 'native' : 'needs_scaling',
        tablet: width <= 768 ? 'native' : 'needs_scaling',
        desktop: width <= 1200 ? 'native' : 'full_width'
      }
    }
  };
}

// Функция для объединения анализов
function mergeAnalyses(imageMetadataAnalysis, mainAnalysis) {
  return {
    // Визуальные характеристики
    visual: {
      ...mainAnalysis.visual,
      dimensions: imageMetadataAnalysis.dimensions,
      quality: imageMetadataAnalysis.quality
    },
    
    // Содержимое и контент
    content: mainAnalysis.content,
    
    // Технические характеристики (объединенные)
    technical: {
      ...mainAnalysis.technical,
      ...imageMetadataAnalysis.technical,
      file: imageMetadataAnalysis.file,
      emailCompatibility: imageMetadataAnalysis.emailCompatibility
    },
    
    // Рекомендации по использованию (объединенные)
    usage: {
      email: mainAnalysis.emailUsage,
      general: imageMetadataAnalysis.usageRecommendations
    },
    
    // Оценки (расширенные)
    scores: {
      ...mainAnalysis.score,
      fileOptimization: imageMetadataAnalysis.file.efficiency === 'optimal' ? 100 :
                       imageMetadataAnalysis.file.efficiency === 'acceptable' ? 75 : 50,
      emailReadiness: imageMetadataAnalysis.emailCompatibility.sizeForEmail === 'excellent' ? 100 :
                     imageMetadataAnalysis.emailCompatibility.sizeForEmail === 'good' ? 75 : 50,
      qualityScore: imageMetadataAnalysis.quality.qualityLevel === 'high' ? 100 :
                   imageMetadataAnalysis.quality.qualityLevel === 'medium' ? 75 : 50
    },
    
    // Метаданные анализа
    analysisMetadata: {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      analysisType: 'comprehensive',
      features: [
        'visual_analysis',
        'content_analysis', 
        'technical_analysis',
        'email_optimization',
        'usage_recommendations',
        'quality_assessment'
      ]
    }
  };
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
      if (entry.imageMetadata && entry.analysis && !entry.analysis.error) {
        console.log(`  🔄 Объединяем анализ: ${fileName}`);
        
        // Создаем расширенный анализ для imageMetadata
        const extendedImageAnalysis = createExtendedImageAnalysis(
          entry.imageMetadata, 
          entry.analysis
        );
        
        // Заполняем analysis внутри imageMetadata
        entry.imageMetadata.analysis = extendedImageAnalysis;
        
        // Объединяем два анализа в один главный
        entry.analysis = mergeAnalyses(extendedImageAnalysis, entry.analysis);
        
        processedCount++;
      }
    }
    
    // Обновляем метаданные JSON
    jsonData.analysisVersion = '2.0.0';
    jsonData.lastMerge = new Date().toISOString();
    jsonData.mergedAnalysis = {
      totalFiles: totalEntries,
      processedFiles: processedCount,
      features: [
        'unified_analysis',
        'extended_metadata',
        'comprehensive_scoring',
        'email_optimization'
      ]
    };
    
    // Сохраняем обновленный JSON
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✅ Объединено анализов: ${processedCount} файлов в ${jsonPath}`);
    
  } catch (error) {
    console.log(`❌ Ошибка обработки ${jsonPath}: ${error.message}`);
  }
}

// Основная функция
async function main() {
  const targetDir = process.argv[2] || 'figma-all-pages-1750993353363';
  
  console.log('🔗 Запуск объединения анализов...');
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
    
    console.log('\n🎉 Объединение анализов завершено!');
    console.log('\n📊 Добавленные функции:');
    console.log('   • Расширенный анализ в imageMetadata.analysis');
    console.log('   • Объединенный главный анализ');
    console.log('   • Размерный и качественный анализ');
    console.log('   • Email-совместимость и оптимизация');
    console.log('   • Рекомендации по использованию');
    console.log('   • Расширенная система оценок');
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
} 