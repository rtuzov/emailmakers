#!/usr/bin/env node

/**
 * Скрипт для создания комплексного отчета по всем обогащенным данным
 */

const fs = require('fs').promises;
const path = require('path');

async function createComprehensiveReport() {
  const targetDir = process.argv[2] || 'figma-all-pages-1750993353363';
  
  console.log('📊 Создание комплексного отчета...');
  
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '2.0.0',
      totalFolders: 0,
      totalFiles: 0,
      analysisFeatures: [
        'visual_analysis',
        'content_analysis', 
        'technical_analysis',
        'email_optimization',
        'usage_recommendations',
        'quality_assessment',
        'comprehensive_scoring'
      ]
    },
    summary: {
      filesByCategory: {},
      averageScores: {},
      technicalStats: {},
      emailCompatibility: {},
      qualityDistribution: {}
    },
    folders: {}
  };
  
  try {
    const folders = await fs.readdir(targetDir);
    
    for (const folder of folders) {
      const folderPath = path.join(targetDir, folder);
      const stat = await fs.stat(folderPath);
      
      if (stat.isDirectory()) {
        console.log(`📁 Анализируем папку: ${folder}`);
        
        const jsonPath = path.join(folderPath, 'tag-dictionary.json');
        
        try {
          await fs.access(jsonPath);
          const folderReport = await analyzeFolderData(jsonPath, folder);
          report.folders[folder] = folderReport;
          report.metadata.totalFolders++;
          report.metadata.totalFiles += folderReport.totalFiles;
          
        } catch (error) {
          console.log(`⚠️  JSON файл не найден: ${jsonPath}`);
        }
      }
    }
    
    // Вычисляем итоговую статистику
    calculateSummaryStats(report);
    
    // Сохраняем отчет в JSON
    const reportPath = path.join(targetDir, 'comprehensive-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    // Создаем HTML отчет
    await createHtmlReport(report, targetDir);
    
    console.log('\n🎉 Комплексный отчет создан!');
    console.log(`📄 JSON отчет: ${reportPath}`);
    console.log(`🌐 HTML отчет: ${path.join(targetDir, 'comprehensive-analysis-report.html')}`);
    
    // Выводим краткую статистику
    console.log('\n📊 Краткая статистика:');
    console.log(`   📁 Папок: ${report.metadata.totalFolders}`);
    console.log(`   🖼️  Файлов: ${report.metadata.totalFiles}`);
    console.log(`   ⭐ Средний общий балл: ${report.summary.averageScores.overall?.toFixed(1) || 'N/A'}`);
    console.log(`   📧 Email-готовность: ${report.summary.averageScores.emailReadiness?.toFixed(1) || 'N/A'}%`);
    console.log(`   🔧 Оптимизация файлов: ${report.summary.averageScores.fileOptimization?.toFixed(1) || 'N/A'}%`);
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

async function analyzeFolderData(jsonPath, folderName) {
  const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  
  const folderReport = {
    folderName,
    totalFiles: 0,
    enrichedFiles: 0,
    files: {},
    statistics: {
      scores: {
        visual: [],
        content: [],
        technical: [],
        overall: [],
        fileOptimization: [],
        emailReadiness: [],
        qualityScore: []
      },
      technical: {
        formats: {},
        sizesKB: [],
        resolutions: {},
        aspectRatios: []
      },
      email: {
        compatibility: {},
        loadingSpeeds: {},
        mobileOptimized: 0,
        retinalReady: 0
      },
      quality: {
        levels: {},
        sharpness: {}
      }
    }
  };
  
  if (!jsonData.entries || Object.keys(jsonData.entries).length === 0) {
    return folderReport;
  }
  
  folderReport.totalFiles = Object.keys(jsonData.entries).length;
  
  for (const [fileName, entry] of Object.entries(jsonData.entries)) {
    if (entry.analysis && entry.imageMetadata && !entry.analysis.error) {
      folderReport.enrichedFiles++;
      
      const fileAnalysis = {
        fileName,
        tags: entry.selectedTags || [],
        scores: entry.analysis.scores || {},
        technical: entry.imageMetadata.technical || {},
        emailCompatibility: entry.imageMetadata.analysis?.emailCompatibility || {}
      };
      
      folderReport.files[fileName] = fileAnalysis;
      
      // Собираем статистику по баллам
      const scores = entry.analysis.scores || {};
      if (scores.visual !== undefined) folderReport.statistics.scores.visual.push(scores.visual);
      if (scores.content !== undefined) folderReport.statistics.scores.content.push(scores.content);
      if (scores.technical !== undefined) folderReport.statistics.scores.technical.push(scores.technical);
      if (scores.overall !== undefined) folderReport.statistics.scores.overall.push(scores.overall);
      if (scores.fileOptimization !== undefined) folderReport.statistics.scores.fileOptimization.push(scores.fileOptimization);
      if (scores.emailReadiness !== undefined) folderReport.statistics.scores.emailReadiness.push(scores.emailReadiness);
      if (scores.qualityScore !== undefined) folderReport.statistics.scores.qualityScore.push(scores.qualityScore);
      
      // Собираем техническую статистику
      const tech = entry.imageMetadata.technical || {};
      if (tech.format) {
        folderReport.statistics.technical.formats[tech.format] = 
          (folderReport.statistics.technical.formats[tech.format] || 0) + 1;
      }
      if (tech.fileSize) {
        folderReport.statistics.technical.sizesKB.push(Math.round(tech.fileSize / 1024));
      }
      if (tech.width && tech.height) {
        const resolution = `${tech.width}x${tech.height}`;
        folderReport.statistics.technical.resolutions[resolution] = 
          (folderReport.statistics.technical.resolutions[resolution] || 0) + 1;
        folderReport.statistics.technical.aspectRatios.push(
          parseFloat((tech.width / tech.height).toFixed(2))
        );
      }
      
      // Email статистика
      const email = entry.imageMetadata.analysis?.emailCompatibility || {};
      if (email.sizeForEmail) {
        folderReport.statistics.email.compatibility[email.sizeForEmail] = 
          (folderReport.statistics.email.compatibility[email.sizeForEmail] || 0) + 1;
      }
      if (email.loadingSpeed) {
        folderReport.statistics.email.loadingSpeeds[email.loadingSpeed] = 
          (folderReport.statistics.email.loadingSpeeds[email.loadingSpeed] || 0) + 1;
      }
      if (email.mobileOptimized) folderReport.statistics.email.mobileOptimized++;
      if (email.retinalReady) folderReport.statistics.email.retinalReady++;
      
      // Качество
      const quality = entry.imageMetadata.analysis?.quality || {};
      if (quality.qualityLevel) {
        folderReport.statistics.quality.levels[quality.qualityLevel] = 
          (folderReport.statistics.quality.levels[quality.qualityLevel] || 0) + 1;
      }
      if (quality.sharpness) {
        folderReport.statistics.quality.sharpness[quality.sharpness] = 
          (folderReport.statistics.quality.sharpness[quality.sharpness] || 0) + 1;
      }
    }
  }
  
  // Вычисляем средние значения
  for (const [scoreType, values] of Object.entries(folderReport.statistics.scores)) {
    if (values.length > 0) {
      folderReport.statistics.scores[scoreType] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
  }
  
  return folderReport;
}

function calculateSummaryStats(report) {
  const allScores = {
    visual: [],
    content: [],
    technical: [],
    overall: [],
    fileOptimization: [],
    emailReadiness: [],
    qualityScore: []
  };
  
  const allTechnical = {
    formats: {},
    sizesKB: [],
    resolutions: {},
    aspectRatios: []
  };
  
  const allEmail = {
    compatibility: {},
    loadingSpeeds: {},
    mobileOptimized: 0,
    retinalReady: 0,
    totalFiles: 0
  };
  
  const allQuality = {
    levels: {},
    sharpness: {}
  };
  
  // Агрегируем данные из всех папок
  for (const folderData of Object.values(report.folders)) {
    for (const [scoreType, scoreData] of Object.entries(folderData.statistics.scores)) {
      if (scoreData.average !== undefined) {
        allScores[scoreType].push(scoreData.average);
      }
    }
    
    // Техническая статистика
    Object.assign(allTechnical.formats, folderData.statistics.technical.formats);
    allTechnical.sizesKB.push(...folderData.statistics.technical.sizesKB);
    Object.assign(allTechnical.resolutions, folderData.statistics.technical.resolutions);
    allTechnical.aspectRatios.push(...folderData.statistics.technical.aspectRatios);
    
    // Email статистика
    Object.assign(allEmail.compatibility, folderData.statistics.email.compatibility);
    Object.assign(allEmail.loadingSpeeds, folderData.statistics.email.loadingSpeeds);
    allEmail.mobileOptimized += folderData.statistics.email.mobileOptimized;
    allEmail.retinalReady += folderData.statistics.email.retinalReady;
    allEmail.totalFiles += folderData.enrichedFiles;
    
    // Качество
    Object.assign(allQuality.levels, folderData.statistics.quality.levels);
    Object.assign(allQuality.sharpness, folderData.statistics.quality.sharpness);
  }
  
  // Вычисляем средние значения
  for (const [scoreType, values] of Object.entries(allScores)) {
    if (values.length > 0) {
      report.summary.averageScores[scoreType] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
  
  report.summary.technicalStats = allTechnical;
  report.summary.emailCompatibility = {
    ...allEmail,
    mobileOptimizedPercent: allEmail.totalFiles > 0 ? (allEmail.mobileOptimized / allEmail.totalFiles) * 100 : 0,
    retinalReadyPercent: allEmail.totalFiles > 0 ? (allEmail.retinalReady / allEmail.totalFiles) * 100 : 0
  };
  report.summary.qualityDistribution = allQuality;
}

async function createHtmlReport(report, targetDir) {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Комплексный анализ изображений Figma</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #2d3748; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 0; text-align: center; margin-bottom: 30px; border-radius: 12px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 4px solid #667eea; }
        .stat-card h3 { color: #4a5568; margin-bottom: 15px; font-size: 1.1rem; }
        .stat-value { font-size: 2.2rem; font-weight: bold; color: #667eea; margin-bottom: 5px; }
        .stat-label { color: #718096; font-size: 0.9rem; }
        .folders-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; }
        .folder-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .folder-header { background: #667eea; color: white; padding: 20px; }
        .folder-header h3 { font-size: 1.3rem; margin-bottom: 5px; }
        .folder-stats { color: rgba(255,255,255,0.9); font-size: 0.9rem; }
        .folder-content { padding: 20px; }
        .score-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .score-label { font-weight: 500; color: #4a5568; }
        .score-value { font-weight: bold; padding: 4px 12px; border-radius: 20px; color: white; }
        .score-excellent { background: #48bb78; }
        .score-good { background: #ed8936; }
        .score-poor { background: #f56565; }
        .technical-info { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        .tech-item { display: inline-block; background: #edf2f7; padding: 4px 8px; border-radius: 6px; margin: 2px; font-size: 0.8rem; color: #4a5568; }
        .timestamp { text-align: center; color: #718096; margin-top: 30px; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Комплексный анализ изображений</h1>
            <p>Полный отчет по техническим характеристикам и качеству</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📁 Общая статистика</h3>
                <div class="stat-value">${report.metadata.totalFiles}</div>
                <div class="stat-label">файлов в ${report.metadata.totalFolders} папках</div>
            </div>
            <div class="stat-card">
                <h3>⭐ Общий балл</h3>
                <div class="stat-value">${report.summary.averageScores.overall?.toFixed(1) || 'N/A'}</div>
                <div class="stat-label">средний балл качества</div>
            </div>
            <div class="stat-card">
                <h3>📧 Email-готовность</h3>
                <div class="stat-value">${report.summary.averageScores.emailReadiness?.toFixed(0) || 'N/A'}%</div>
                <div class="stat-label">готовность для email</div>
            </div>
            <div class="stat-card">
                <h3>🔧 Оптимизация</h3>
                <div class="stat-value">${report.summary.averageScores.fileOptimization?.toFixed(0) || 'N/A'}%</div>
                <div class="stat-label">оптимизация файлов</div>
            </div>
        </div>
        
        <div class="folders-grid">
            ${Object.values(report.folders).map(folder => `
                <div class="folder-card">
                    <div class="folder-header">
                        <h3>${folder.folderName}</h3>
                        <div class="folder-stats">${folder.enrichedFiles} файлов проанализировано</div>
                    </div>
                    <div class="folder-content">
                        ${generateScoreRows(folder.statistics.scores)}
                        <div class="technical-info">
                            ${generateTechnicalInfo(folder.statistics)}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Отчет создан: ${new Date(report.metadata.generatedAt).toLocaleString('ru-RU')}
        </div>
    </div>
</body>
</html>`;

  function generateScoreRows(scores) {
    return Object.entries(scores)
      .filter(([_, data]) => data.average !== undefined)
      .map(([type, data]) => {
        const value = data.average.toFixed(1);
        const scoreClass = value >= 80 ? 'score-excellent' : value >= 60 ? 'score-good' : 'score-poor';
        const labels = {
          visual: 'Визуальное качество',
          content: 'Контент',
          technical: 'Технические характеристики',
          overall: 'Общий балл',
          fileOptimization: 'Оптимизация файла',
          emailReadiness: 'Email-готовность',
          qualityScore: 'Качество изображения'
        };
        return `
          <div class="score-row">
            <span class="score-label">${labels[type] || type}</span>
            <span class="score-value ${scoreClass}">${value}</span>
          </div>
        `;
      }).join('');
  }

  function generateTechnicalInfo(stats) {
    const info = [];
    
    if (stats.technical.formats) {
      const formats = Object.entries(stats.technical.formats)
        .map(([format, count]) => `${format.toUpperCase()}: ${count}`)
        .join(', ');
      info.push(`<span class="tech-item">Форматы: ${formats}</span>`);
    }
    
    if (stats.email.compatibility) {
      const compat = Object.entries(stats.email.compatibility)
        .map(([level, count]) => `${level}: ${count}`)
        .join(', ');
      info.push(`<span class="tech-item">Email-совместимость: ${compat}</span>`);
    }
    
    if (stats.quality.levels) {
      const quality = Object.entries(stats.quality.levels)
        .map(([level, count]) => `${level}: ${count}`)
        .join(', ');
      info.push(`<span class="tech-item">Качество: ${quality}</span>`);
    }
    
    return info.join(' ');
  }

  const htmlPath = path.join(targetDir, 'comprehensive-analysis-report.html');
  await fs.writeFile(htmlPath, html, 'utf8');
}

// Запуск скрипта
if (require.main === module) {
  createComprehensiveReport();
} 