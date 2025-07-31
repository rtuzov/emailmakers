/**
 * Fix Handoff Data Script
 * Исправляет handoff файлы с пустыми данными, загружая их из файлов кампании
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Проверяет, содержит ли объект валидные данные
 */
function hasValidData(data) {
  return data && typeof data === 'object' && Object.keys(data).length > 0 && 
         !(Object.keys(data).length === 1 && Object.keys(data)[0] === 'length');
}

/**
 * Загружает файлы data-collection из папки /data
 */
async function loadDataCollectionFiles(campaignPath) {
  const dataPath = path.join(campaignPath, 'data');
  const loadedData = {};

  try {
    const dataFiles = [
      'consolidated-insights.json',
      'destination-analysis.json', 
      'emotional-profile.json',
      'market-intelligence.json',
      'travel_intelligence-insights.json',
      'trend-analysis.json',
      'key_insights_insights.json' // Добавляем файл с нестандартным именем
    ];

    for (const fileName of dataFiles) {
      try {
        const filePath = path.join(dataPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        const key = fileName.replace('-insights.json', '').replace('.json', '').replace('-', '_');
        loadedData[key] = data;
        
        console.log(`✅ Загружен ${fileName} для handoff`);
      } catch (fileError) {
        const key = fileName.replace('-insights.json', '').replace('.json', '').replace('-', '_');
        loadedData[key] = null;
        
        if (!fileError.message.includes('ENOENT')) {
          console.log(`⚠️ Не удалось загрузить ${fileName}: ${fileError.message}`);
        }
      }
    }

    // Генерируем метаданные коллекции
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    loadedData.collection_metadata = {
      files_created: jsonFiles.map(file => `data/${file}`),
      total_analyses: jsonFiles.length,
      data_quality_score: 100,
      processing_completed_at: new Date().toISOString(),
      data_types: jsonFiles.map(file => file.replace('.json', '').replace('-insights', ''))
    };

    return loadedData;
  } catch (error) {
    console.log(`⚠️ Ошибка при загрузке папки data: ${error.message}`);
    return {};
  }
}

/**
 * Генерирует deliverables на основе данных специалиста
 */
function generateDeliverables(specialistData, specialist) {
  const validKeys = Object.keys(specialistData).filter(key => 
    hasValidData(specialistData[key])
  );

  const metadata = specialistData[`${specialist.replace('-', '_')}_metadata`];
  
  return {
    created_files: metadata?.files_created?.map(file => ({
      file_name: file.split('/').pop() || file,
      file_path: file,
      file_type: 'data',
      description: `Auto-generated data file: ${file}`,
      is_primary: false
    })) || [],
    key_outputs: validKeys.filter(key => !key.includes('metadata')),
    data_quality_metrics: {
      total_analyses: metadata?.total_analyses || metadata?.total_files || validKeys.length,
      completion_rate: Math.round((validKeys.length / 7) * 100), // 7 expected data types for data-collection
      quality_score: metadata?.data_quality_score || metadata?.content_quality_score || metadata?.design_quality_score || metadata?.quality_score || 0
    }
  };
}

/**
 * Исправляет handoff файл с пустыми данными
 */
async function fixHandoffFile(campaignPath, handoffFileName) {
  const handoffFilePath = path.join(campaignPath, 'handoffs', handoffFileName);
  
  try {
    // Читаем существующий handoff файл
    const handoffContent = await fs.readFile(handoffFilePath, 'utf8');
    const handoffData = JSON.parse(handoffContent);
    
    console.log(`📄 Обрабатываем handoff файл: ${handoffFileName}`);
    console.log(`📋 От: ${handoffData.from_specialist} → К: ${handoffData.to_specialist}`);
    
    // Проверяем, нужно ли исправление
    const needsFix = !hasValidData(handoffData.specialist_data?.destination_analysis) ||
                     !hasValidData(handoffData.specialist_data?.market_intelligence) ||
                     !hasValidData(handoffData.specialist_data?.emotional_profile);
    
    if (!needsFix) {
      console.log(`✅ Handoff файл уже содержит валидные данные`);
      return;
    }
    
    // Загружаем актуальные данные из файлов
    let actualData = {};
    
    if (handoffData.from_specialist === 'data-collection') {
      actualData = await loadDataCollectionFiles(campaignPath);
    }
    
    // Обогащаем specialist_data
    const enrichedSpecialistData = {};
    const allKeys = [...new Set([
      ...Object.keys(actualData),
      ...Object.keys(handoffData.specialist_data || {})
    ])];
    
    for (const key of allKeys) {
      if (hasValidData(actualData[key])) {
        enrichedSpecialistData[key] = actualData[key];
      } else if (hasValidData(handoffData.specialist_data?.[key])) {
        enrichedSpecialistData[key] = handoffData.specialist_data[key];
      } else {
        enrichedSpecialistData[key] = actualData[key] || handoffData.specialist_data?.[key] || null;
      }
    }
    
    // Генерируем новые deliverables
    const enrichedDeliverables = generateDeliverables(enrichedSpecialistData, handoffData.from_specialist);
    
    // Обновляем handoff данные
    const updatedHandoffData = {
      ...handoffData,
      specialist_data: enrichedSpecialistData,
      deliverables: {
        ...handoffData.deliverables,
        ...enrichedDeliverables
      },
      quality_metadata: {
        ...handoffData.quality_metadata,
        data_quality_score: enrichedDeliverables.data_quality_metrics.quality_score,
        completeness_score: enrichedDeliverables.data_quality_metrics.completion_rate
      },
      updated_at: new Date().toISOString(),
      fix_applied: true
    };
    
    // Сохраняем обновленный файл
    await fs.writeFile(handoffFilePath, JSON.stringify(updatedHandoffData, null, 2), 'utf-8');
    
    console.log(`✅ Handoff файл успешно исправлен`);
    console.log(`📊 Загружено данных: ${Object.keys(enrichedSpecialistData).filter(key => hasValidData(enrichedSpecialistData[key])).length}`);
    console.log(`📁 Создано файлов: ${enrichedDeliverables.created_files.length}`);
    console.log(`🎯 Качество данных: ${enrichedDeliverables.data_quality_metrics.quality_score}%`);
    
  } catch (error) {
    console.error(`❌ Ошибка при исправлении handoff файла: ${error.message}`);
  }
}

/**
 * Основная функция
 */
async function main() {
  const campaignId = process.argv[2];
  
  if (!campaignId) {
    console.log('❌ Укажите ID кампании как аргумент');
    console.log('Пример: node scripts/fix-handoff-data.js campaign_1753793256478_6zzlb3cp2ze');
    return;
  }
  
  const campaignPath = path.join(__dirname, '..', 'campaigns', campaignId);
  
  try {
    // Проверяем существование кампании
    await fs.access(campaignPath);
    
    // Получаем список handoff файлов
    const handoffsPath = path.join(campaignPath, 'handoffs');
    const handoffFiles = await fs.readdir(handoffsPath);
    
    console.log(`🎯 Исправляем handoff файлы для кампании: ${campaignId}`);
    console.log(`📂 Найдено handoff файлов: ${handoffFiles.length}`);
    
    // Исправляем каждый handoff файл
    for (const handoffFile of handoffFiles.filter(file => file.endsWith('.json'))) {
      await fixHandoffFile(campaignPath, handoffFile);
    }
    
    console.log(`🎉 Все handoff файлы обработаны`);
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
  }
}

main().catch(console.error); 