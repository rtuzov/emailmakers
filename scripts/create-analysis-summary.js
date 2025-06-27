#!/usr/bin/env node

/**
 * Скрипт для создания итогового CSV файла с аналитикой по всем файлам
 */

const fs = require('fs').promises;
const path = require('path');

async function createAnalysisSummary() {
  const targetDir = process.argv[2] || 'figma-all-pages-1750993353363';
  
  console.log('📊 Создание итогового анализа...');
  
  const csvRows = [];
  csvRows.push([
    'Folder', 'FileName', 'Width', 'Height', 'FileSize', 'AspectRatio', 
    'Orientation', 'Format', 'PrimaryColor', 'Brightness', 'Saturation',
    'Categories', 'PrimaryTheme', 'ContentElements', 'EmailRecommendations',
    'VisualScore', 'ContentScore', 'TechnicalScore', 'OverallScore',
    'Tags', 'TagCount'
  ]);
  
  try {
    const folders = await fs.readdir(targetDir);
    
    for (const folder of folders) {
      const folderPath = path.join(targetDir, folder);
      const stat = await fs.stat(folderPath);
      
      if (stat.isDirectory()) {
        const jsonPath = path.join(folderPath, 'tag-dictionary.json');
        
        try {
          await fs.access(jsonPath);
          const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
          
          if (jsonData.entries) {
            for (const [fileName, entry] of Object.entries(jsonData.entries)) {
              if (entry.analysis && !entry.analysis.error) {
                const analysis = entry.analysis;
                
                csvRows.push([
                  folder,
                  fileName,
                  analysis.technical.dimensions.split('x')[0],
                  analysis.technical.dimensions.split('x')[1],
                  analysis.technical.fileSize,
                  analysis.visual.composition.aspectRatio,
                  analysis.visual.composition.composition,
                  analysis.technical.format,
                  analysis.visual.colors.primaryColor,
                  analysis.visual.colors.brightness,
                  analysis.visual.colors.saturation,
                  analysis.content.categories.join(';'),
                  analysis.content.primaryTheme,
                  analysis.content.contentElements.join(';'),
                  analysis.emailUsage.recommendations.join(';'),
                  analysis.score.visual,
                  analysis.score.content,
                  analysis.score.technical,
                  analysis.score.overall,
                  entry.selectedTags.join(';'),
                  entry.selectedTags.length
                ]);
              }
            }
          }
        } catch (error) {
          console.log(`⚠️  Пропускаем ${folder}: ${error.message}`);
        }
      }
    }
    
    // Создаем CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\\n');
    
    const outputPath = path.join(targetDir, 'complete-analysis-summary.csv');
    await fs.writeFile(outputPath, csvContent, 'utf8');
    
    console.log(`✅ Итоговый анализ создан: ${outputPath}`);
    console.log(`📊 Обработано файлов: ${csvRows.length - 1}`);
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
  }
}

createAnalysisSummary(); 