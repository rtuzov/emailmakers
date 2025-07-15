/**
 * Тест API endpoint /api/agent/run-improved 
 * Тема: Путешествие в Тайланд осенью
 */

const API_BASE = 'http://localhost:3000';

async function testRunImprovedEndpoint() {
  console.log('\n🚀 === ТЕСТ API /api/agent/run-improved ===');
  console.log('🌴 Тема: Путешествие в Тайланд осенью');
  console.log(`⏰ Начало теста: ${new Date().toISOString()}\n`);

  // 1. Сначала проверим health check
  console.log('🔍 1. Проверка health check...');
  try {
    const healthResponse = await fetch(`${API_BASE}/api/agent/run-improved`, {
      method: 'GET'
    });
    
    const healthData = await healthResponse.json();
    console.log('✅ Health check результат:', {
      status: healthData.status,
      agents_available: Object.keys(healthData.agents || {}).length,
      handoffs_working: Object.values(healthData.handoffs || {}).filter(h => h === true).length
    });
    
    if (healthData.status !== 'healthy') {
      console.warn('⚠️  Система не готова, но продолжаем тест...');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    console.log('🔄 Продолжаем основной тест...');
  }

  // 2. Основной тест - запуск агента
  console.log('\n🤖 2. Запуск агента с темой "Путешествие в Тайланд осенью"...');
  
  const requestBody = {
    task_type: 'create_email_campaign',
    input: 'Создать email кампанию на тему "Путешествие в Тайланд осенью". Включить информацию о погоде осенью, лучших местах для посещения, культурных особенностях, практических советах для туристов. Тон дружелюбный и информативный.',
    context: {
      campaign_type: 'travel_promotion',
      season: 'autumn',
      destination: 'Thailand',
      language: 'ru',
      tone: 'friendly_informative',
      target_audience: 'russian_travelers',
      include_practical_tips: true,
      include_cultural_info: true
    }
  };

  console.log('📋 Параметры запроса:');
  console.log('   task_type:', requestBody.task_type);
  console.log('   input:', requestBody.input.slice(0, 100) + '...');
  console.log('   context:', JSON.stringify(requestBody.context, null, 2));

  const startTime = Date.now();

  try {
    console.log('\n📡 Отправка запроса...');
    const response = await fetch(`${API_BASE}/api/agent/run-improved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    console.log('\n✅ === РЕЗУЛЬТАТ ВЫПОЛНЕНИЯ ===');
    console.log(`⏱️  Время выполнения: ${executionTime}ms`);
    console.log(`🎯 Агент: ${result.agent}`);
    console.log(`📋 Тип задачи: ${result.taskType}`);
    console.log(`✅ Успех: ${result.success}`);
    console.log(`📊 Время выполнения агента: ${result.executionTime}ms`);
    console.log(`⏰ Timestamp: ${result.timestamp}`);

    // Анализ результата
    if (result.result) {
      console.log('\n📈 АНАЛИЗ РЕЗУЛЬТАТА:');
      
      if (typeof result.result === 'object') {
        console.log(`🔧 Доступные свойства: ${Object.keys(result.result).join(', ')}`);
        
        if (result.result.finalOutput) {
          const output = result.result.finalOutput;
          console.log(`📤 Final output тип: ${typeof output}`);
          
          if (typeof output === 'string') {
            console.log(`📝 Длина output: ${output.length} символов`);
            console.log(`📄 Превью: ${output.slice(0, 200)}...`);
          }
        }

        if (result.result.messages && Array.isArray(result.result.messages)) {
          console.log(`💬 Сообщений: ${result.result.messages.length}`);
        }

        if (result.result.usage) {
          console.log(`🔢 Использование токенов: ${JSON.stringify(result.result.usage)}`);
        }
      } else {
        console.log(`📄 Результат (${typeof result.result}): ${result.result}`);
      }
    }

    console.log('\n🎉 === ТЕСТ ЗАВЕРШЕН УСПЕШНО ===');
    return {
      success: true,
      executionTime,
      agentExecutionTime: result.executionTime,
      agent: result.agent,
      taskType: result.taskType,
      hasResult: !!result.result
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('\n❌ === ОШИБКА ВЫПОЛНЕНИЯ ===');
    console.error(`💥 Ошибка: ${error.message}`);
    console.error(`⏱️  Время до ошибки: ${executionTime}ms`);
    
    if (error.stack) {
      console.error(`📍 Stack trace:\n${error.stack}`);
    }

    return {
      success: false,
      error: error.message,
      executionTime
    };
  }
}

// Дополнительная функция для проверки статуса агентов
async function checkAgentStatus() {
  console.log('\n🔍 === ПРОВЕРКА СТАТУСА АГЕНТОВ ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/agent/status`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Статус системы агентов:');
      console.log(`📊 Всего агентов: ${data.agents?.length || 0}`);
      
      if (data.agents) {
        data.agents.forEach(agent => {
          const statusIcon = agent.status === 'healthy' ? '✅' : 
                           agent.status === 'warning' ? '⚠️' : '❌';
          console.log(`   ${statusIcon} ${agent.id}: ${agent.status}`);
        });
      }

      if (data.system_status) {
        console.log('🖥️  Статус системы:', data.system_status.overall_status);
      }
    } else {
      console.log('❌ Не удалось получить статус агентов');
    }
  } catch (error) {
    console.log('⚠️  Проверка статуса недоступна:', error.message);
  }
}

// Запуск тестов
async function runTests() {
  console.log('🧪 === ЗАПУСК ТЕСТОВ run-improved API ===\n');
  
  // Проверяем статус агентов
  await checkAgentStatus();
  
  // Основной тест
  const testResult = await testRunImprovedEndpoint();
  
  // Финальная сводка
  console.log('\n📋 === ИТОГОВАЯ СВОДКА ===');
  console.log(`✅ Успех: ${testResult.success}`);
  console.log(`⏱️  Общее время: ${testResult.executionTime}ms`);
  
  if (testResult.success) {
    console.log(`🤖 Агент: ${testResult.agent}`);
    console.log(`📋 Тип задачи: ${testResult.taskType}`);
    console.log(`⚡ Время агента: ${testResult.agentExecutionTime}ms`);
    console.log(`📊 Результат получен: ${testResult.hasResult ? 'Да' : 'Нет'}`);
  } else {
    console.log(`❌ Ошибка: ${testResult.error}`);
  }
  
  console.log('\n🏁 === ТЕСТЫ ЗАВЕРШЕНЫ ===');
}

// Обработка запуска
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  });
}

module.exports = { testRunImprovedEndpoint, checkAgentStatus }; 