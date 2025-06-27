#!/usr/bin/env node

const path = require('path');
const fs = require('fs').promises;

/**
 * Сервис для дедупликации и оптимизации тегов
 */
class TagDeduplicationService {
  constructor() {
    this.config = {
      maxTagsPerFile: 6,
      maxFileNameLength: 80,
      priorityTags: [
        'заяц',
        'билет',
        'авиабилеты', 
        'путешествия',
        'новости',
        'акция',
        'скидка'
      ],
      synonymGroups: [
        ['дешевые', 'дешевыебилеты', 'дешевые_билеты', 'дешевые билеты'],
        ['авиабилет', 'авиабилеты', 'билеты', 'билет'],
        ['путешествие', 'путешествия', 'авиапутешествия'],
        ['новости', 'новости_авиакомпаний', 'новостиавиакомпаний'],
        ['авиаперелет', 'авиаперелеты', 'перелеты', 'дешевые перелеты'],
        ['москва', 'Москва'],
        ['батуми', 'Батуми'],
        ['сочи', 'Сочи'],
        ['питер', 'Питер', 'Санкт-Петербург'],
        ['владикавказ', 'Владикавказ'],
        ['ягадугу', 'Ягадугу', 'Ягодугу'],
        ['цена', 'цена_3000', '3000рублей', '3000руб']
      ],
      excludePatterns: [
        'яркий',
        'зеленый', 
        'дружелюбный',
        'позитивный',
        'позитив',
        'веселый',
        'анимация',
        'иллюстрация',
        'маршрут',
        'юмор',
        'бронирование',
        'предложение',
        'спецпредложение'
      ]
    };
  }

  /**
   * Оптимизирует теги, удаляя дубли и применяя синонимы
   */
  optimizeTags(tags, hasRabbit = true) {
    const originalTags = [...tags];
    let processedTags = [...tags];
    const removedDuplicates = [];
    const appliedSynonyms = {};

    // 1. Удаляем теги-исключения
    processedTags = processedTags.filter(tag => {
      const shouldExclude = this.config.excludePatterns.some(pattern => 
        tag.toLowerCase().includes(pattern.toLowerCase())
      );
      if (shouldExclude) {
        removedDuplicates.push(tag);
      }
      return !shouldExclude;
    });

    // 2. Применяем группы синонимов
    processedTags = processedTags.map(tag => {
      for (const synonymGroup of this.config.synonymGroups) {
        const matchedSynonym = synonymGroup.find(synonym => 
          tag.toLowerCase() === synonym.toLowerCase()
        );
        if (matchedSynonym && matchedSynonym !== synonymGroup[0]) {
          appliedSynonyms[tag] = synonymGroup[0];
          return synonymGroup[0];
        }
      }
      return tag;
    });

    // 3. Удаляем дубли после применения синонимов
    const uniqueTags = Array.from(new Set(processedTags.map(tag => tag.toLowerCase())))
      .map(lowerTag => processedTags.find(tag => tag.toLowerCase() === lowerTag));

    // 4. Удаляем "заяц" если его нет на изображении
    let finalTags = uniqueTags;
    if (!hasRabbit) {
      finalTags = finalTags.filter(tag => tag.toLowerCase() !== 'заяц');
    }

    // 5. Приоритизируем теги
    const priorityTags = finalTags.filter(tag => 
      this.config.priorityTags.some(priority => 
        tag.toLowerCase().includes(priority.toLowerCase())
      )
    );
    const otherTags = finalTags.filter(tag => 
      !this.config.priorityTags.some(priority => 
        tag.toLowerCase().includes(priority.toLowerCase())
      )
    );

    // 6. Ограничиваем количество тегов
    const optimizedTags = [
      ...priorityTags.slice(0, 4),
      ...otherTags.slice(0, this.config.maxTagsPerFile - priorityTags.length)
    ].slice(0, this.config.maxTagsPerFile);

    // 7. Создаем короткое имя файла
    const shortFileName = this.createShortFileName(optimizedTags);

    return {
      originalTags,
      optimizedTags,
      shortFileName,
      removedDuplicates,
      appliedSynonyms
    };
  }

  /**
   * Создает короткое имя файла из оптимизированных тегов
   */
  createShortFileName(tags) {
    const fileName = tags
      .map(tag => tag.toLowerCase().replace(/\s+/g, ''))
      .join('-');
    
    if (fileName.length <= this.config.maxFileNameLength) {
      return fileName;
    }

    // Если имя слишком длинное, берем только первые теги
    let shortName = '';
    for (const tag of tags) {
      const tagFormatted = tag.toLowerCase().replace(/\s+/g, '');
      if ((shortName + '-' + tagFormatted).length <= this.config.maxFileNameLength) {
        shortName = shortName ? shortName + '-' + tagFormatted : tagFormatted;
      } else {
        break;
      }
    }
    
    return shortName || tags[0].toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Оптимизирует существующий JSON файл словаря
   */
  async optimizeTagDictionary(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const dictionary = JSON.parse(content);
      
      const optimizedEntries = {};
      const optimizationReport = {
        originalFiles: Object.keys(dictionary.entries || dictionary.assets || {}).length,
        optimizedFiles: 0,
        totalTagsRemoved: 0,
        duplicatesFound: 0,
        synonymsApplied: 0
      };

      // Определяем структуру данных (словарь тегов или отчет Figma)
      const entries = dictionary.entries || {};
      const assets = dictionary.assets || [];

      // Обрабатываем entries из словаря тегов
      if (Object.keys(entries).length > 0) {
        for (const [longName, entry] of Object.entries(entries)) {
          const hasRabbit = (entry.allTags || []).some(tag => 
            tag.toLowerCase().includes('заяц')
          ) || (entry.originalName || '').toLowerCase().includes('заяц');

          const optimization = this.optimizeTags(entry.allTags || [], hasRabbit);
          
          const optimizedEntry = {
            ...entry,
            shortName: optimization.shortFileName,
            allTags: optimization.optimizedTags,
            selectedTags: optimization.optimizedTags,
            optimization: {
              removedTags: optimization.removedDuplicates,
              appliedSynonyms: optimization.appliedSynonyms,
              originalTagCount: optimization.originalTags.length,
              optimizedTagCount: optimization.optimizedTags.length
            }
          };

          optimizedEntries[optimization.shortFileName] = optimizedEntry;
          
          optimizationReport.optimizedFiles++;
          optimizationReport.totalTagsRemoved += optimization.removedDuplicates.length;
          optimizationReport.synonymsApplied += Object.keys(optimization.appliedSynonyms).length;
        }
      }

      // Обрабатываем assets из отчета Figma
      if (assets.length > 0) {
        for (const asset of assets) {
          if (!asset.tags || asset.tags.length === 0) continue;

          const hasRabbit = asset.tags.some(tag => 
            tag.toLowerCase().includes('заяц')
          ) || (asset.originalName || '').toLowerCase().includes('заяц');

          const optimization = this.optimizeTags(asset.tags, hasRabbit);
          
          asset.optimizedTags = optimization.optimizedTags;
          asset.shortName = optimization.shortFileName;
          asset.optimization = {
            removedTags: optimization.removedDuplicates,
            appliedSynonyms: optimization.appliedSynonyms,
            originalTagCount: optimization.originalTags.length,
            optimizedTagCount: optimization.optimizedTags.length
          };
          
          optimizationReport.optimizedFiles++;
          optimizationReport.totalTagsRemoved += optimization.removedDuplicates.length;
          optimizationReport.synonymsApplied += Object.keys(optimization.appliedSynonyms).length;
        }
      }

      // Подсчитываем уникальные теги после оптимизации
      const allOptimizedTags = [
        ...Object.values(optimizedEntries).flatMap(entry => entry.allTags || []),
        ...assets.flatMap(asset => asset.optimizedTags || [])
      ];
      const uniqueOptimizedTags = Array.from(new Set(allOptimizedTags));

      const optimizedDictionary = {
        ...dictionary,
        ...(Object.keys(optimizedEntries).length > 0 && { entries: optimizedEntries }),
        ...(assets.length > 0 && { assets }),
        totalTags: allOptimizedTags.length,
        uniqueTags: uniqueOptimizedTags,
        optimizationReport,
        optimizedAt: new Date().toISOString()
      };

      // Сохраняем оптимизированную версию
      const optimizedPath = filePath.replace('.json', '-optimized.json');
      await fs.writeFile(optimizedPath, JSON.stringify(optimizedDictionary, null, 2));
      
      console.log(`✅ Оптимизация завершена:`);
      console.log(`📁 Файлов обработано: ${optimizationReport.originalFiles}`);
      console.log(`🏷️  Тегов удалено: ${optimizationReport.totalTagsRemoved}`);
      console.log(`🔄 Синонимов применено: ${optimizationReport.synonymsApplied}`);
      console.log(`📊 Уникальных тегов: ${(dictionary.uniqueTags || []).length} → ${uniqueOptimizedTags.length}`);
      console.log(`💾 Сохранено: ${optimizedPath}`);

      return optimizedPath;

    } catch (error) {
      console.error('❌ Ошибка оптимизации:', error.message);
      throw error;
    }
  }

  /**
   * Создает оптимизированный CSV файл
   */
  async createOptimizedCSV(jsonPath, csvPath) {
    try {
      const content = await fs.readFile(jsonPath, 'utf-8');
      const dictionary = JSON.parse(content);
      
      const csvHeaders = [
        'Short Name',
        'Original Name', 
        'Optimized Tags',
        'Removed Tags',
        'Applied Synonyms',
        'Content Description',
        'Emotional Tone',
        'Confidence',
        'Original Tag Count',
        'Optimized Tag Count',
        'Optimization Ratio'
      ];

      const csvRows = [csvHeaders.join(',')];

      const entries = dictionary.entries || {};
      const assets = dictionary.assets || [];

      // Обрабатываем entries
      for (const [shortName, entry] of Object.entries(entries)) {
        const optimization = entry.optimization || {};
        const optimizationRatio = optimization.originalTagCount > 0 
          ? ((optimization.originalTagCount - optimization.optimizedTagCount) / optimization.originalTagCount * 100).toFixed(1)
          : '0';

        const row = [
          `"${shortName}"`,
          `"${entry.originalName || ''}"`,
          `"${(entry.allTags || []).join(', ')}"`,
          `"${(optimization.removedTags || []).join(', ')}"`,
          `"${Object.entries(optimization.appliedSynonyms || {}).map(([k,v]) => `${k}→${v}`).join(', ')}"`,
          `"${entry.aiAnalysis?.contentDescription || ''}"`,
          `"${entry.aiAnalysis?.emotionalTone || ''}"`,
          `"${entry.aiAnalysis?.confidence || ''}"`,
          `"${optimization.originalTagCount || 0}"`,
          `"${optimization.optimizedTagCount || 0}"`,
          `"${optimizationRatio}%"`
        ];

        csvRows.push(row.join(','));
      }

      // Обрабатываем assets
      for (const asset of assets) {
        if (!asset.optimization) continue;

        const optimization = asset.optimization;
        const optimizationRatio = optimization.originalTagCount > 0 
          ? ((optimization.originalTagCount - optimization.optimizedTagCount) / optimization.originalTagCount * 100).toFixed(1)
          : '0';

        const row = [
          `"${asset.shortName || asset.newName || ''}"`,
          `"${asset.originalName || ''}"`,
          `"${(asset.optimizedTags || []).join(', ')}"`,
          `"${(optimization.removedTags || []).join(', ')}"`,
          `"${Object.entries(optimization.appliedSynonyms || {}).map(([k,v]) => `${k}→${v}`).join(', ')}"`,
          `"${asset.aiAnalysis?.contentDescription || ''}"`,
          `"${asset.emotionalTone || ''}"`,
          `"${asset.aiConfidence || ''}"`,
          `"${optimization.originalTagCount || 0}"`,
          `"${optimization.optimizedTagCount || 0}"`,
          `"${optimizationRatio}%"`
        ];

        csvRows.push(row.join(','));
      }

      await fs.writeFile(csvPath, csvRows.join('\n'));
      console.log(`📊 Оптимизированный CSV создан: ${csvPath}`);

    } catch (error) {
      console.error('❌ Ошибка создания CSV:', error.message);
      throw error;
    }
  }
}

/**
 * Скрипт для оптимизации словаря тегов
 * Удаляет дубли, применяет синонимы, сокращает названия файлов
 */
async function main() {
  console.log('🚀 Запуск оптимизации словаря тегов...\n');
  
  const tagService = new TagDeduplicationService();
  
  // Пути к файлам
  const testImagesDir = path.join(process.cwd(), 'test-images');
  const figmaOutputDir = path.join(process.cwd(), 'figma-output');
  
  const jsonPath = path.join(testImagesDir, 'tag-dictionary.json');
  const csvPath = path.join(testImagesDir, 'tag-dictionary-optimized.csv');
  
  try {
    // 1. Оптимизируем JSON словарь
    console.log('📝 Оптимизация JSON словаря...');
    const optimizedJsonPath = await tagService.optimizeTagDictionary(jsonPath);
    
    // 2. Создаем оптимизированный CSV
    console.log('\n📊 Создание оптимизированного CSV...');
    await tagService.createOptimizedCSV(optimizedJsonPath, csvPath);
    
    // 3. Ищем и обрабатываем файлы из figma-output
    console.log('\n🔍 Поиск файлов Figma для оптимизации...');
    
    const figmaOutputs = await fs.readdir(figmaOutputDir);
    
    for (const outputDir of figmaOutputs) {
      if (outputDir.startsWith('figma-') && outputDir !== '.DS_Store') {
        const reportPath = path.join(figmaOutputDir, outputDir, 'processing-report.json');
        
        try {
          console.log(`\n📁 Обработка: ${outputDir}`);
          await tagService.optimizeTagDictionary(reportPath);
        } catch (error) {
          console.log(`⚠️  Пропускаем ${outputDir}: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Оптимизация завершена успешно!');
    console.log('\n📋 Результаты:');
    console.log(`• Оптимизированные JSON файлы: *-optimized.json`);
    console.log(`• Оптимизированный CSV: ${csvPath}`);
    console.log('\n🎯 Применены оптимизации:');
    console.log('• Удалены дублирующиеся теги');
    console.log('• Применены группы синонимов');
    console.log('• Исключены описательные теги');
    console.log('• Сокращены названия файлов до 80 символов');
    console.log('• Ограничено количество тегов до 6 на файл');
    console.log('• Убран тег "заяц" для файлов без зайца');
    
  } catch (error) {
    console.error('❌ Ошибка оптимизации:', error);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, TagDeduplicationService }; 