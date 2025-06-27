#!/usr/bin/env node
/**
 * Agent Status Checker
 * Проверяет состояние агента и API интеграций
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

/**
 * Проверить здоровье сервера
 */
async function checkServerHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    console.log('🏥 Server Health:', response.ok ? '✅ Healthy' : '❌ Unhealthy');
    
    if (data.checks) {
      console.log('   Database:', data.checks.database?.status === 'pass' ? '✅' : '❌');
      console.log('   Memory:', data.checks.memory?.status === 'pass' ? '✅' : '❌');
      console.log('   External APIs:', data.checks.externalServices?.status === 'pass' ? '✅' : '❌');
    }
    
    return response.ok;
  } catch (error) {
    console.log('🏥 Server Health: ❌ Unreachable');
    return false;
  }
}

/**
 * Проверить агент статус
 */
async function checkAgentStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/agent/run`, {
      method: 'GET'
    });
    const data = await response.json();
    
    console.log('🤖 Agent Status:', response.ok ? '✅ Active' : '❌ Inactive');
    console.log('   Mode:', data.mode || 'Unknown');
    console.log('   Version:', data.version || 'Unknown');
    
    return response.ok;
  } catch (error) {
    console.log('🤖 Agent Status: ❌ Unreachable');
    return false;
  }
}

/**
 * Проверить статус Париж-кампании
 */
async function checkParisCampaign() {
  try {
    const response = await fetch(`${BASE_URL}/api/agent/paris-campaign`, {
      method: 'GET'
    });
    const data = await response.json();
    
    console.log('🗼 Paris Campaign:', response.ok ? '✅ Ready' : '❌ Not Ready');
    console.log('   Features:', data.features?.length || 0, 'available');
    
    return response.ok;
  } catch (error) {
    console.log('🗼 Paris Campaign: ❌ Unreachable');
    return false;
  }
}

/**
 * Тест быстрой генерации
 */
async function testQuickGeneration() {
  try {
    console.log('⚡ Testing quick generation...');
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/agent/test-offline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Test email generation' })
    });
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    if (response.ok && data.status === 'success') {
      console.log(`⚡ Quick Generation: ✅ Success (${duration}ms)`);
      console.log('   Token Usage:', data.token_usage || 'Unknown');
      console.log('   File Size:', data.data?.metadata?.file_size || 'Unknown');
      return true;
    } else {
      console.log('⚡ Quick Generation: ❌ Failed');
      console.log('   Error:', data.error_message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('⚡ Quick Generation: ❌ Error');
    console.log('   Error:', error.message);
    return false;
  }
}

/**
 * Мониторинг активных операций
 */
async function monitorActiveOperations(duration = 30000) {
  console.log(`👀 Monitoring active operations for ${duration/1000}s...`);
  
  const startTime = Date.now();
  let lastCheck = Date.now();
  
  while (Date.now() - startTime < duration) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();
      
      const now = Date.now();
      if (now - lastCheck >= 5000) { // каждые 5 секунд
        console.log(`   [${new Date().toLocaleTimeString()}] Memory: ${Math.round(data.metrics?.memoryUsage?.heapUsed / 1024 / 1024)}MB, Requests: ${data.metrics?.requestCount || 0}`);
        lastCheck = now;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('   ❌ Monitoring error:', error.message);
      break;
    }
  }
  
  console.log('👀 Monitoring completed.');
}

/**
 * Полная проверка системы
 */
async function fullSystemCheck() {
  console.log('🔍 Running full system check...\n');
  
  const results = {
    server: await checkServerHealth(),
    agent: await checkAgentStatus(),
    paris: await checkParisCampaign(),
    generation: await testQuickGeneration()
  };
  
  console.log('\n📊 Summary:');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;
  
  console.log(`   Passed: ${passed}/${total} checks`);
  console.log(`   Status: ${passed === total ? '✅ All systems operational' : '⚠️ Issues detected'}`);
  
  return results;
}

// CLI интерфейс
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'health':
      checkServerHealth();
      break;
      
    case 'agent':
      checkAgentStatus();
      break;
      
    case 'paris':
      checkParisCampaign();
      break;
      
    case 'test':
      testQuickGeneration();
      break;
      
    case 'monitor':
      const duration = parseInt(process.argv[3]) || 30000;
      monitorActiveOperations(duration);
      break;
      
    case 'full':
    default:
      fullSystemCheck();
      break;
  }
}

module.exports = {
  checkServerHealth,
  checkAgentStatus,
  checkParisCampaign,
  testQuickGeneration,
  monitorActiveOperations,
  fullSystemCheck
};
