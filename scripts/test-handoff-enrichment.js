/**
 * Test Handoff Enrichment Script
 * Тестирует систему автоматического обогащения handoff данных
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Симулирует функцию hasValidData
 */
function hasValidData(data) {
  return data && typeof data === 'object' && Object.keys(data).length > 0 && 
         !(Object.keys(data).length === 1 && Object.keys(data)[0] === 'length');
}

/**
 * Симулирует loadDataCollectionFiles с улучшенной логикой
 */
async function testLoadDataCollectionFiles(campaignPath) {
  const dataPath = path.join(campaignPath, 'data');
  const loadedData = {};

  try {
    // Получаем все JSON файлы в папке data
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📂 Найдено ${jsonFiles.length} JSON файлов в папке data:`, jsonFiles);

    // Загружаем все найденные JSON файлы
    for (const fileName of jsonFiles) {
      try {
        const filePath = path.join(dataPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Создаем ключ из имени файла, обрабатывая различные форматы
        let key = fileName.replace('.json', '');
        
        // Обрабатываем различные паттерны именования файлов
        if (key.includes('_insights_')) {
          // key_insights_insights.json -> key_insights
          key = key.replace('_insights_insights', '_insights');
        } else if (key.endsWith('-insights')) {
          // travel_intelligence-insights.json -> travel_intelligence
          key = key.replace('-insights', '');
        }
        
        // Заменяем дефисы на подчеркивания для консистентности
        key = key.replace(/-/g, '_');
        
        loadedData[key] = data;
        
        console.log(`✅ Загружен ${fileName} как '${key}'`);
        console.log(`   Размер данных: ${JSON.stringify(data).length} символов`);
        console.log(`   Валидные данные: ${hasValidData(data) ? 'Да' : 'Нет'}`);
      } catch (fileError) {
        console.log(`⚠️ Не удалось загрузить ${fileName}: ${fileError.message}`);
      }
    }

    // Генерируем метаданные
    loadedData.collection_metadata = {
      files_created: jsonFiles.map(file => `data/${file}`),
      total_analyses: jsonFiles.length,
      data_quality_score: 100,
      processing_completed_at: new Date().toISOString(),
      data_types: jsonFiles.map(file => {
        let type = file.replace('.json', '');
        if (type.includes('_insights_')) {
          type = type.replace('_insights_insights', '_insights');
        } else if (type.endsWith('-insights')) {
          type = type.replace('-insights', '');
        }
        return type.replace(/-/g, '_');
      })
    };

    console.log(`📊 Общий результат:`);
    console.log(`   Всего ключей: ${Object.keys(loadedData).length}`);
    console.log(`   Валидных данных: ${Object.keys(loadedData).filter(key => hasValidData(loadedData[key])).length}`);
    console.log(`   Метаданные: ${hasValidData(loadedData.collection_metadata) ? 'Сгенерированы' : 'Отсутствуют'}`);

    return loadedData;
  } catch (error) {
    console.log(`⚠️ Ошибка при загрузке папки data: ${error.message}`);
    return {};
  }
}

/**
 * Генерирует deliverables
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
      completion_rate: Math.round((validKeys.length / 8) * 100), // 8 expected data types for data-collection
      quality_score: metadata?.data_quality_score || metadata?.content_quality_score || metadata?.design_quality_score || metadata?.quality_score || 0
    }
  };
}

/**
 * Тестирует полную систему обогащения
 */
async function testEnrichmentSystem(campaignPath) {
  console.log(`🧪 Тестирование системы обогащения для кампании:`);
  console.log(`📁 Путь: ${campaignPath}`);
  
  try {
    // Загружаем данные
    const actualData = await testLoadDataCollectionFiles(campaignPath);
    
    // Симулируем пустые входные данные (как в проблемном handoff)
    const providedData = {
      consolidated: null,
      destination_analysis: {},
      emotional_profile: {},
      market_intelligence: {},
      travel_intelligence: {},
      trend_analysis: {},
      collection_metadata: {},
      consolidated_insights: {}
    };
    
    console.log(`\n🔄 Обогащение данных...`);
    
    // Обогащаем данные
    const enrichedData = {};
    const allKeys = [...new Set([
      ...Object.keys(actualData),
      ...Object.keys(providedData)
    ])];
    
    for (const key of allKeys) {
      if (hasValidData(actualData[key])) {
        enrichedData[key] = actualData[key];
      } else if (hasValidData(providedData[key])) {
        enrichedData[key] = providedData[key];
      } else {
        enrichedData[key] = actualData[key] || providedData[key] || null;
      }
    }
    
    // Генерируем deliverables
    const enrichedDeliverables = generateDeliverables(enrichedData, 'data-collection');
    
    console.log(`\n✅ Результаты обогащения:`);
    console.log(`📊 Обогащенных ключей: ${Object.keys(enrichedData).length}`);
    console.log(`🟢 Валидных данных: ${Object.keys(enrichedData).filter(key => hasValidData(enrichedData[key])).length}`);
    console.log(`📁 Файлов в deliverables: ${enrichedDeliverables.created_files.length}`);
    console.log(`🎯 Процент завершения: ${enrichedDeliverables.data_quality_metrics.completion_rate}%`);
    console.log(`🏆 Оценка качества: ${enrichedDeliverables.data_quality_metrics.quality_score}%`);
    
    // Показываем какие ключи были обогащены
    console.log(`\n📋 Детали обогащения:`);
    for (const key of Object.keys(enrichedData)) {
      const wasEmpty = !hasValidData(providedData[key]);
      const nowValid = hasValidData(enrichedData[key]);
      const status = wasEmpty && nowValid ? '🔄 ОБОГАЩЕН' : nowValid ? '✅ ВАЛИДЕН' : '❌ ПУСТОЙ';
      console.log(`   ${key}: ${status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Ошибка при тестировании: ${error.message}`);
    return false;
  }
}

/**
 * Основная функция
 */
async function main() {
  const campaignId = process.argv[2] || 'campaign_1753793256478_6zzlb3cp2ze';
  const campaignPath = path.join(__dirname, '..', 'campaigns', campaignId);
  
  try {
    await fs.access(campaignPath);
    const success = await testEnrichmentSystem(campaignPath);
    
    if (success) {
      console.log(`\n🎉 Тест успешно завершен!`);
    } else {
      console.log(`\n❌ Тест завершился с ошибками`);
    }
  } catch (error) {
    console.error(`❌ Кампания не найдена: ${campaignPath}`);
    console.log(`💡 Попробуйте: node scripts/test-handoff-enrichment.js campaign_1753793256478_6zzlb3cp2ze`);
  }
}

main().catch(console.error); 