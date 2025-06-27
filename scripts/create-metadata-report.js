#!/usr/bin/env node

/**
 * Скрипт для создания итогового отчета по техническим метаданным
 * Анализирует все обработанные JSON файлы и создает сводную статистику
 */

const fs = require('fs').promises;
const path = require('path');

// Функция для анализа одного JSON файла
async function analyzeJsonFile(jsonPath, folderName) {
  try {
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    
    if (!jsonData.entries || Object.keys(jsonData.entries).length === 0) {
      return {
        folderName,
        totalFiles: 0,
        enrichedFiles: 0,
        statistics: null
      };
    }

    const entries = Object.values(jsonData.entries);
    const enrichedEntries = entries.filter(entry => entry.imageMetadata);
    
    // Анализ размеров
    const sizes = enrichedEntries.map(entry => ({
      width: entry.imageMetadata?.technical?.width || 0,
      height: entry.imageMetadata?.technical?.height || 0,
      fileSize: entry.imageMetadata?.technical?.fileSize || 0,
      aspectRatio: parseFloat(entry.imageMetadata?.technical?.aspectRatio || 0)
    }));

    // Анализ форматов
    const formats = {};
    enrichedEntries.forEach(entry => {
      const format = entry.imageMetadata?.technical?.format || 'unknown';
      formats[format] = (formats[format] || 0) + 1;
    });

    // Анализ ориентации
    const orientations = {};
    enrichedEntries.forEach(entry => {
      const orientation = entry.imageMetadata?.technical?.orientation || 'unknown';
      orientations[orientation] = (orientations[orientation] || 0) + 1;
    });

    // Анализ флагов
    const flags = {
      icons: enrichedEntries.filter(e => e.imageMetadata?.analysis?.isIcon).length,
      large: enrichedEntries.filter(e => e.imageMetadata?.analysis?.isLarge).length,
      square: enrichedEntries.filter(e => e.imageMetadata?.analysis?.isSquare).length,
      wide: enrichedEntries.filter(e => e.imageMetadata?.analysis?.isWide).length,
      tall: enrichedEntries.filter(e => e.imageMetadata?.analysis?.isTall).length
    };

    // Статистика размеров
    const widths = sizes.map(s => s.width).filter(w => w > 0);
    const heights = sizes.map(s => s.height).filter(h => h > 0);
    const fileSizes = sizes.map(s => s.fileSize).filter(fs => fs > 0);

    return {
      folderName,
      totalFiles: entries.length,
      enrichedFiles: enrichedEntries.length,
      statistics: {
        formats,
        orientations,
        flags,
        dimensions: {
          widthRange: widths.length > 0 ? {
            min: Math.min(...widths),
            max: Math.max(...widths),
            avg: Math.round(widths.reduce((a, b) => a + b, 0) / widths.length)
          } : null,
          heightRange: heights.length > 0 ? {
            min: Math.min(...heights),
            max: Math.max(...heights),
            avg: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length)
          } : null,
          fileSizeRange: fileSizes.length > 0 ? {
            min: Math.min(...fileSizes),
            max: Math.max(...fileSizes),
            avg: Math.round(fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length)
          } : null
        }
      }
    };
  } catch (error) {
    console.error(`Ошибка анализа ${jsonPath}:`, error.message);
    return {
      folderName,
      totalFiles: 0,
      enrichedFiles: 0,
      statistics: null,
      error: error.message
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

// Создание HTML отчета
function generateHtmlReport(analysisResults, globalStats) {
  const timestamp = new Date().toLocaleString('ru-RU');
  
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет по техническим метаданным Figma</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 40px;
        }
        .global-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .stat-card p {
            margin: 0;
            opacity: 0.9;
        }
        .folders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
        }
        .folder-card {
            border: 1px solid #e1e5e9;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }
        .folder-card:hover {
            transform: translateY(-5px);
        }
        .folder-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 20px;
        }
        .folder-header h3 {
            margin: 0;
            font-size: 1.3em;
        }
        .folder-body {
            padding: 20px;
        }
        .stats-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .stats-row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: 600;
            color: #666;
        }
        .value {
            color: #333;
        }
        .formats, .orientations {
            margin-top: 15px;
        }
        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 8px;
        }
        .tag {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 20px;
            padding: 4px 12px;
            font-size: 0.85em;
            color: #495057;
        }
        .flags {
            margin-top: 15px;
        }
        .flag-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        .flag-item {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .flag-count {
            font-weight: bold;
            color: #495057;
        }
        .flag-label {
            font-size: 0.8em;
            color: #6c757d;
            margin-top: 2px;
        }
        .dimensions {
            margin-top: 15px;
        }
        .dim-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 10px;
        }
        .dim-item {
            text-align: center;
            padding: 15px 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .dim-label {
            font-size: 0.9em;
            color: #6c757d;
            margin-bottom: 5px;
        }
        .dim-value {
            font-weight: bold;
            color: #495057;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Отчет по техническим метаданным</h1>
            <p>Анализ изображений из Figma • ${timestamp}</p>
        </div>
        
        <div class="content">
            <div class="global-stats">
                <div class="stat-card">
                    <h3>${globalStats.totalFolders}</h3>
                    <p>Папок обработано</p>
                </div>
                <div class="stat-card">
                    <h3>${globalStats.totalFiles}</h3>
                    <p>Всего файлов</p>
                </div>
                <div class="stat-card">
                    <h3>${globalStats.enrichedFiles}</h3>
                    <p>Обогащено метаданными</p>
                </div>
                <div class="stat-card">
                    <h3>${globalStats.successRate}%</h3>
                    <p>Успешность обработки</p>
                </div>
            </div>

            <div class="folders-grid">
                ${analysisResults.map(result => `
                    <div class="folder-card">
                        <div class="folder-header">
                            <h3>📁 ${result.folderName}</h3>
                        </div>
                        <div class="folder-body">
                            ${result.error ? `
                                <div style="color: #dc3545; text-align: center; padding: 20px;">
                                    ❌ Ошибка: ${result.error}
                                </div>
                            ` : result.statistics ? `
                                <div class="stats-row">
                                    <span class="label">Файлов:</span>
                                    <span class="value">${result.enrichedFiles} из ${result.totalFiles}</span>
                                </div>
                                
                                <div class="formats">
                                    <div class="label">Форматы:</div>
                                    <div class="tag-list">
                                        ${Object.entries(result.statistics.formats).map(([format, count]) => 
                                            `<span class="tag">${format.toUpperCase()}: ${count}</span>`
                                        ).join('')}
                                    </div>
                                </div>

                                <div class="orientations">
                                    <div class="label">Ориентация:</div>
                                    <div class="tag-list">
                                        ${Object.entries(result.statistics.orientations).map(([orientation, count]) => 
                                            `<span class="tag">${orientation}: ${count}</span>`
                                        ).join('')}
                                    </div>
                                </div>

                                <div class="flags">
                                    <div class="label">Характеристики:</div>
                                    <div class="flag-grid">
                                        <div class="flag-item">
                                            <div class="flag-count">${result.statistics.flags.icons}</div>
                                            <div class="flag-label">Иконки</div>
                                        </div>
                                        <div class="flag-item">
                                            <div class="flag-count">${result.statistics.flags.large}</div>
                                            <div class="flag-label">Большие</div>
                                        </div>
                                        <div class="flag-item">
                                            <div class="flag-count">${result.statistics.flags.square}</div>
                                            <div class="flag-label">Квадратные</div>
                                        </div>
                                        <div class="flag-item">
                                            <div class="flag-count">${result.statistics.flags.wide}</div>
                                            <div class="flag-label">Широкие</div>
                                        </div>
                                        <div class="flag-item">
                                            <div class="flag-count">${result.statistics.flags.tall}</div>
                                            <div class="flag-label">Высокие</div>
                                        </div>
                                    </div>
                                </div>

                                ${result.statistics.dimensions.widthRange ? `
                                    <div class="dimensions">
                                        <div class="label">Размеры (ширина):</div>
                                        <div class="dim-grid">
                                            <div class="dim-item">
                                                <div class="dim-label">Мин.</div>
                                                <div class="dim-value">${result.statistics.dimensions.widthRange.min}px</div>
                                            </div>
                                            <div class="dim-item">
                                                <div class="dim-label">Средн.</div>
                                                <div class="dim-value">${result.statistics.dimensions.widthRange.avg}px</div>
                                            </div>
                                            <div class="dim-item">
                                                <div class="dim-label">Макс.</div>
                                                <div class="dim-value">${result.statistics.dimensions.widthRange.max}px</div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}

                                ${result.statistics.dimensions.fileSizeRange ? `
                                    <div class="dimensions">
                                        <div class="label">Размер файлов:</div>
                                        <div class="dim-grid">
                                            <div class="dim-item">
                                                <div class="dim-label">Мин.</div>
                                                <div class="dim-value">${formatFileSize(result.statistics.dimensions.fileSizeRange.min)}</div>
                                            </div>
                                            <div class="dim-item">
                                                <div class="dim-label">Средн.</div>
                                                <div class="dim-value">${formatFileSize(result.statistics.dimensions.fileSizeRange.avg)}</div>
                                            </div>
                                            <div class="dim-item">
                                                <div class="dim-label">Макс.</div>
                                                <div class="dim-value">${formatFileSize(result.statistics.dimensions.fileSizeRange.max)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                            ` : `
                                <div style="color: #6c757d; text-align: center; padding: 20px;">
                                    📄 Нет данных для анализа
                                </div>
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            Сгенерировано автоматически • Email-Makers Figma Processor
        </div>
    </div>
</body>
</html>`;
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || './figma-all-pages-1750993353363';
  
  console.log('📊 Создание отчета по техническим метаданным...');
  console.log(`📁 Анализируемая папка: ${targetDir}`);
  
  try {
    const items = await fs.readdir(targetDir);
    const analysisResults = [];
    
    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        const jsonPath = path.join(itemPath, 'tag-dictionary.json');
        try {
          await fs.access(jsonPath);
          const result = await analyzeJsonFile(jsonPath, item);
          analysisResults.push(result);
          console.log(`✅ ${item}: ${result.enrichedFiles}/${result.totalFiles} файлов`);
        } catch (e) {
          console.log(`⚠️  ${item}: JSON файл не найден`);
        }
      }
    }
    
    // Глобальная статистика
    const globalStats = {
      totalFolders: analysisResults.length,
      totalFiles: analysisResults.reduce((sum, r) => sum + r.totalFiles, 0),
      enrichedFiles: analysisResults.reduce((sum, r) => sum + r.enrichedFiles, 0),
      successRate: 0
    };
    
    globalStats.successRate = globalStats.totalFiles > 0 
      ? Math.round((globalStats.enrichedFiles / globalStats.totalFiles) * 100)
      : 0;
    
    // Генерация HTML отчета
    const htmlReport = generateHtmlReport(analysisResults, globalStats);
    const reportPath = path.join(targetDir, 'metadata-report.html');
    await fs.writeFile(reportPath, htmlReport);
    
    // Генерация JSON отчета
    const jsonReport = {
      timestamp: new Date().toISOString(),
      globalStats,
      folderAnalysis: analysisResults
    };
    const jsonReportPath = path.join(targetDir, 'metadata-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(jsonReport, null, 2));
    
    console.log('\n🎉 Отчет создан успешно!');
    console.log(`📄 HTML отчет: ${reportPath}`);
    console.log(`📋 JSON отчет: ${jsonReportPath}`);
    console.log('\n📊 Глобальная статистика:');
    console.log(`   📁 Папок: ${globalStats.totalFolders}`);
    console.log(`   📄 Всего файлов: ${globalStats.totalFiles}`);
    console.log(`   ✅ Обогащено: ${globalStats.enrichedFiles}`);
    console.log(`   🎯 Успешность: ${globalStats.successRate}%`);
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Показать справку
function showHelp() {
  console.log(`
📊 Metadata Report Generator

Создает итоговый отчет по техническим метаданным изображений.

📋 Использование:
  node create-metadata-report.js [папка]

📁 Параметры:
  папка    Путь к папке с результатами (по умолчанию: ./figma-all-pages-1750993353363)

📊 Что включает отчет:
  • Общая статистика по всем папкам
  • Детальный анализ каждой папки
  • Статистика форматов и ориентации
  • Анализ размеров и характеристик
  • Флаги (иконки, большие изображения, etc.)
  • HTML и JSON версии отчета

✨ Примеры:
  node create-metadata-report.js                    # Анализ по умолчанию
  node create-metadata-report.js ./my-figma-data    # Анализ указанной папки
  node create-metadata-report.js help               # Показать эту справку
`);
}

// Обработка аргументов
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
} 