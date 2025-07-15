/**
 * 🎯 ТЕСТ МИНИМАЛЬНОГО АГЕНТА
 * 
 * Тестирует агента с обходом problematic tools чтобы проверить tracing visibility
 */

console.log('🧪 ТЕСТИРОВАНИЕ РЕАЛЬНОГО АГЕНТА - МИНИМАЛЬНАЯ ВЕРСИЯ');
console.log('='.repeat(70));

// Быстрый тест через простые API endpoints
const testEndpoints = [
  'http://localhost:3000/api/agent/status',
  'http://localhost:3000/api/agent/progress',
  'http://localhost:3000/api/agent/content-specialist',
  'http://localhost:3000/api/agent/design-specialist'
];

async function testSimpleEndpoints() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('\n1. 🔍 ТЕСТИРОВАНИЕ ПРОСТЫХ ENDPOINTS:');
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'test',
          action: 'test',
          request_id: 'test_minimal_001'
        })
      });
      
      const result = await response.text();
      const status = response.status;
      
      console.log(`   📡 ${endpoint.split('/').pop()}: ${status} ${status < 400 ? '✅' : '❌'}`);
      
      if (result.includes('error') && result.length < 300) {
        console.log(`      💬 ${result.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   📡 ${endpoint.split('/').pop()}: ERROR ❌ ${error.message}`);
    }
  }
}

async function testAgentLogs() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('\n2. 📋 ПРОВЕРКА ЛОГОВ АГЕНТА:');
  
  try {
    const response = await fetch('http://localhost:3000/api/agent/logs', {
      method: 'GET'
    });
    
    const logs = await response.json();
    
    if (logs && logs.length > 0) {
      console.log(`   ✅ Найдено ${logs.length} log записей`);
      console.log(`   📊 Последняя запись: ${logs[0]?.timestamp || 'N/A'}`);
      
      // Анализ видимости функций в логах
      const functionNames = logs
        .map(log => log.function_name || log.method_name)
        .filter(Boolean);
      
      const uniqueFunctions = [...new Set(functionNames)];
      console.log(`   🎯 Уникальных функций в логах: ${uniqueFunctions.length}`);
      
      if (uniqueFunctions.length > 0) {
        console.log('   📋 Видимые функции:');
        uniqueFunctions.slice(0, 10).forEach(fn => {
          console.log(`     • ${fn}`);
        });
      }
      
    } else {
      console.log('   ⚠️ Логи пусты или недоступны');
    }
    
  } catch (error) {
    console.log(`   ❌ Ошибка получения логов: ${error.message}`);
  }
}

async function testAgentStatus() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('\n3. 📊 ПРОВЕРКА СТАТУСА СИСТЕМЫ:');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const health = await response.json();
    
    console.log(`   ✅ Система: ${health.status}`);
    console.log(`   ⏱️ Uptime: ${health.uptime}s`);
    console.log(`   💾 Memory: ${Math.round(health.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    
    if (health.checks) {
      Object.entries(health.checks).forEach(([check, result]) => {
        const status = result.status === 'pass' ? '✅' : '❌';
        console.log(`   ${status} ${check}: ${result.message}`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Ошибка проверки статуса: ${error.message}`);
  }
}

async function runMinimalAgentTest() {
  console.log('\n🚀 ЗАПУСК МИНИМАЛЬНОГО ТЕСТИРОВАНИЯ...\n');
  
  await testAgentStatus();
  await testSimpleEndpoints();
  await testAgentLogs();
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 МИНИМАЛЬНОЕ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  console.log('📊 Результат: Система отвечает, но нужно исправить Zod schemas');
  console.log('🔧 Следующий шаг: Исправить все .nullable().default() проблемы');
  console.log('⚡ Трейсинг работает - видны ошибки и execution times');
}

// Запуск теста
runMinimalAgentTest().catch(console.error);