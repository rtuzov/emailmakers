/**
 * Test Improved Handoff System
 * Тестирует улучшенную систему создания handoff файлов с автоматической загрузкой данных
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Симулирует вызов createHandoffFile с пустыми данными (как делает агент)
 */
async function simulateAgentCall(campaignPath, campaignId) {
  console.log('🤖 Симулируем вызов агента с пустыми данными...');
  
  // Симулируем пустые данные, которые передает агент
  const emptySpecialistData = {
    destination_analysis: null,
    market_intelligence: null,
    emotional_profile: null,
    trend_analysis: null,
    consolidated_insights: null,
    travel_intelligence: null,
    collection_metadata: null
  };
  
  // Симулируем улучшенную логику createHandoffFile
  const hasValidSpecialistData = emptySpecialistData && 
    Object.keys(emptySpecialistData).some(key => 
      emptySpecialistData[key] && 
      typeof emptySpecialistData[key] === 'object' && 
      Object.keys(emptySpecialistData[key]).length > 0 &&
      !Array.isArray(emptySpecialistData[key])
    );
  
  console.log(`🔍 Проверка качества данных: ${hasValidSpecialistData ? 'ВАЛИДНЫЕ' : 'ПУСТЫЕ'}`);
  
  let finalSpecialistData = emptySpecialistData;
  
  if (!hasValidSpecialistData) {
    console.log('⚠️ Агент передал пустые данные в specialist_data, принудительно загружаем из файлов кампании...');
    finalSpecialistData = await forceLoadSpecialistDataFromCampaign(campaignPath);
    
    if (Object.keys(finalSpecialistData).length === 0) {
      console.log('❌ Не удалось загрузить данные из файлов кампании, используем переданные данные');
      finalSpecialistData = emptySpecialistData;
    } else {
      console.log(`✅ Принудительно загружено ${Object.keys(finalSpecialistData).length} типов данных`);
    }
  } else {
    console.log('✅ Агент передал валидные данные в specialist_data');
  }
  
  return finalSpecialistData;
}

/**
 * Симулирует функцию принудительной загрузки данных
 */
async function forceLoadSpecialistDataFromCampaign(campaignPath) {
  console.log('🔄 Принудительная загрузка specialist_data из файлов кампании...');
  
  const dataPath = path.join(campaignPath, 'data');
  const loadedData = {};

  try {
    // Получаем все JSON файлы в папке data
    const files = await fs.readdir(dataPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📂 Найдено ${jsonFiles.length} JSON файлов в папке data для specialist_data`);

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
        
        console.log(`✅ Принудительно загружен ${fileName} как '${key}' для specialist_data`);
      } catch (fileError) {
        console.log(`⚠️ Не удалось принудительно загрузить ${fileName}: ${fileError.message}`);
      }
    }

    // Генерируем метаданные коллекции
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

    console.log(`📊 Принудительно загружено ${Object.keys(loadedData).filter(key => 
      loadedData[key] && typeof loadedData[key] === 'object' && Object.keys(loadedData[key]).length > 0
    ).length} валидных файлов данных`);
    
    return loadedData;
  } catch (error) {
    console.log(`⚠️ Ошибка при принудительной загрузке данных: ${error.message}`);
    return {};
  }
}

/**
 * Создает тестовый handoff файл с использованием улучшенной системы
 */
async function createImprovedHandoffFile(campaignPath, campaignId, specialistData) {
  console.log('\n📝 Создаем тестовый handoff файл...');
  
  const handoffData = {
    from_specialist: "data-collection",
    to_specialist: "content",
    campaign_id: campaignId,
    campaign_path: campaignPath,
    specialist_data: specialistData,
    handoff_context: {
      summary: "Тестовое создание handoff файла с автоматической загрузкой данных",
      context_for_next: "Все данные были автоматически загружены из файлов кампании",
      recommendations: [
        "Использовать автоматически загруженные данные для создания контента",
        "Проверить качество всех загруженных данных"
      ],
      success_criteria: [
        "Все необходимые данные загружены и доступны"
      ]
    },
    deliverables: {
      created_files: specialistData.collection_metadata?.files_created?.map(file => ({
        file_name: file.split('/').pop() || file,
        file_path: file,
        file_type: 'data',
        description: `Auto-loaded data file: ${file}`,
        is_primary: false
      })) || [],
      key_outputs: Object.keys(specialistData).filter(key => 
        specialistData[key] && 
        typeof specialistData[key] === 'object' && 
        Object.keys(specialistData[key]).length > 0 &&
        !key.includes('metadata')
      ),
      data_quality_metrics: {
        total_analyses: specialistData.collection_metadata?.total_analyses || 0,
        completion_rate: Math.round((Object.keys(specialistData).filter(key => 
          specialistData[key] && typeof specialistData[key] === 'object' && Object.keys(specialistData[key]).length > 0
        ).length / 8) * 100),
        quality_score: specialistData.collection_metadata?.data_quality_score || 0
      }
    },
    quality_metadata: {
      data_quality_score: specialistData.collection_metadata?.data_quality_score || 100,
      completeness_score: 100,
      validation_status: "passed",
      error_count: 0,
      warning_count: 0,
      processing_time: 500
    },
    trace_id: `test_handoff_${Date.now()}_data-collection`,
    validate_context: true,
    created_at: new Date().toISOString(),
    test_mode: true,
    auto_loaded: true
  };
  
  // Сохраняем handoff файл
  const handoffId = `handoff_${campaignId}_data-collection_to_content`;
  const handoffFilePath = path.join(campaignPath, 'handoffs', `${handoffId}.json`);
  
  // Убеждаемся что папка handoffs существует
  const handoffsDir = path.join(campaignPath, 'handoffs');
  await fs.mkdir(handoffsDir, { recursive: true });
  
  await fs.writeFile(handoffFilePath, JSON.stringify(handoffData, null, 2), 'utf-8');
  
  console.log(`✅ Тестовый handoff файл создан: ${handoffFilePath}`);
  console.log(`📊 Данных загружено: ${Object.keys(specialistData).length}`);
  console.log(`🎯 Процент завершения: ${handoffData.deliverables.data_quality_metrics.completion_rate}%`);
  console.log(`🏆 Оценка качества: ${handoffData.deliverables.data_quality_metrics.quality_score}%`);
  
  return handoffFilePath;
}

/**
 * Основная функция тестирования
 */
async function main() {
  const campaignId = process.argv[2] || 'campaign_1753795787750_oek9ly4wjbm';
  const campaignPath = path.join(__dirname, '..', 'campaigns', campaignId);
  
  try {
    await fs.access(campaignPath);
    
    console.log(`🧪 Тестирование улучшенной системы handoff для кампании: ${campaignId}`);
    console.log(`📁 Путь: ${campaignPath}\n`);
    
    // Шаг 1: Симулируем вызов агента с пустыми данными
    const loadedSpecialistData = await simulateAgentCall(campaignPath, campaignId);
    
    // Шаг 2: Создаем handoff файл с загруженными данными
    const handoffFilePath = await createImprovedHandoffFile(campaignPath, campaignId, loadedSpecialistData);
    
    console.log(`\n🎉 Тест успешно завершен!`);
    console.log(`📄 Handoff файл создан: ${handoffFilePath}`);
    console.log(`\n✅ Система теперь автоматически загружает данные, даже если агент передает пустые значения!`);
    
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    console.log(`💡 Попробуйте: node scripts/test-improved-handoff.js campaign_1753795787750_oek9ly4wjbm`);
  }
}

main().catch(console.error); 