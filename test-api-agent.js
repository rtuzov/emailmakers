#!/usr/bin/env node

/**
 * Comprehensive API Test for /api/agent/run-improved
 * Testing the Email-Makers agent system
 */

// Node.js v18+ has native fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch').default || require('node-fetch');
}

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  colorLog('cyan', '\n🔍 === HEALTH CHECK TEST ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      colorLog('green', '✅ Health Check: PASSED');
      colorLog('white', `📊 Status: ${result.status}`);
      colorLog('white', `🤖 Agents: ${Object.keys(result.agents).length} available`);
      colorLog('white', `🔄 Handoffs: ${Object.keys(result.handoffs).length} configured`);
      
      // Detail view
      colorLog('blue', '\n📋 Agent Details:');
      Object.entries(result.agents).forEach(([agent, status]) => {
        const icon = status === 'available' ? '✅' : '❌';
        colorLog('white', `   ${icon} ${agent}: ${status}`);
      });
      
      colorLog('blue', '\n🔗 Handoff Details:');
      Object.entries(result.handoffs).forEach(([handoff, details]) => {
        const icon = details ? '✅' : '❌';
        colorLog('white', `   ${icon} ${handoff}: ${details ? 'configured' : 'missing'}`);
      });
      
      return true;
    } else {
      colorLog('red', '❌ Health Check: FAILED');
      colorLog('red', `📱 Status: ${response.status}`);
      colorLog('red', `💥 Error: ${result.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    colorLog('red', '❌ Health Check: ERROR');
    colorLog('red', `💥 Error: ${error.message}`);
    return false;
  }
}

async function testAgentExecution() {
  colorLog('cyan', '\n🚀 === AGENT EXECUTION TEST ===');
  
  const testRequest = {
    task_type: 'email-campaign-creation',
    input: `Создать email-кампанию для туристической компании "Русский Путь" с акцией на авиабилеты в Турцию:

БРИФ:
- Компания: "Русский Путь" (туристическое агентство)
- Акция: Авиабилеты в Турцию на 30% дешевле
- Срок действия: До 31 декабря 2024
- Целевая аудитория: 18-35 лет, активные молодые люди
- Тон: Энергичный, дружелюбный, мотивирующий
- Язык: Русский
- Формат: HTML email с современным дизайном
- Основной призыв: "Забронировать сейчас"
- Дополнительные элементы: Фотографии турецких курортов, отзывы клиентов, контактная информация

ТРЕБОВАНИЯ:
- Адаптивный дизайн для мобильных устройств
- Совместимость с основными email-клиентами
- Размер файла <100KB
- Подходит для массовой рассылки
- Соответствует CAN-SPAM требованиям`,
    context: {
      language: 'ru',
      campaign_type: 'promotional',
      industry: 'travel',
      urgency: 'high',
      target_audience: 'young_adults'
    }
  };
  
  try {
    const startTime = Date.now();
    colorLog('yellow', `⏱️  Starting agent execution...`);
    colorLog('white', `📋 Task: ${testRequest.task_type}`);
    colorLog('white', `📝 Input length: ${testRequest.input.length} characters`);
    colorLog('white', `🔧 Context: ${JSON.stringify(testRequest.context)}`);
    
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    const result = await response.json();
    const executionTime = Date.now() - startTime;
    
    if (response.ok) {
      colorLog('green', `✅ Agent Execution: PASSED in ${executionTime}ms`);
      colorLog('white', `🎯 Agent: ${result.agent}`);
      colorLog('white', `📋 Task Type: ${result.taskType}`);
      colorLog('white', `⏱️  Execution Time: ${result.executionTime}ms`);
      colorLog('white', `📊 Response Time: ${executionTime}ms`);
      
      // Result analysis
      if (result.result) {
        colorLog('blue', '\n📈 RESULT ANALYSIS:');
        colorLog('white', `📤 Final Output Type: ${typeof result.result.finalOutput}`);
        colorLog('white', `🔧 Available Properties: ${Object.keys(result.result).join(', ')}`);
        
        if (result.result.finalOutput) {
          const output = result.result.finalOutput;
          if (typeof output === 'string') {
            colorLog('white', `📝 Output Preview: ${output.slice(0, 200)}...`);
          } else {
            colorLog('white', `📝 Output Preview: ${JSON.stringify(output).slice(0, 200)}...`);
          }
        }
        
        if (result.result.history) {
          colorLog('white', `📚 History Items: ${result.result.history.length}`);
        }
      }
      
      return true;
    } else {
      colorLog('red', `❌ Agent Execution: FAILED (${response.status})`);
      colorLog('red', `📱 HTTP Status: ${response.status}`);
      colorLog('red', `💥 Error: ${result.error || 'Unknown error'}`);
      colorLog('red', `⏱️  Request Time: ${executionTime}ms`);
      
      // Additional error details
      if (result.timestamp) {
        colorLog('red', `⏰ Error Time: ${result.timestamp}`);
      }
      
      return false;
    }
  } catch (error) {
    colorLog('red', '❌ Agent Execution: ERROR');
    colorLog('red', `💥 Error: ${error.message}`);
    colorLog('red', `📍 Stack: ${error.stack}`);
    return false;
  }
}

async function performanceTest() {
  colorLog('cyan', '\n⚡ === PERFORMANCE TEST ===');
  
  const results = [];
  const testRuns = 3;
  
  for (let i = 1; i <= testRuns; i++) {
    colorLog('yellow', `🔄 Performance Test ${i}/${testRuns}`);
    
    const testRequest = {
      task_type: 'email-campaign-creation',
      input: `Test performance run ${i}: Create a simple email campaign for a tech company announcing a new product launch. Keep it brief and professional.`,
      context: {
        test_run: i,
        performance_test: true
      }
    };
    
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:3000/api/agent/run-improved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      results.push({
        run: i,
        success: response.ok,
        responseTime,
        executionTime: result.executionTime || null,
        error: result.error || null
      });
      
      if (response.ok) {
        colorLog('green', `   ✅ Run ${i}: ${responseTime}ms`);
      } else {
        colorLog('red', `   ❌ Run ${i}: ${responseTime}ms (${result.error})`);
      }
      
    } catch (error) {
      results.push({
        run: i,
        success: false,
        responseTime: null,
        executionTime: null,
        error: error.message
      });
      
      colorLog('red', `   ❌ Run ${i}: ERROR (${error.message})`);
    }
  }
  
  // Performance summary
  colorLog('blue', '\n📊 PERFORMANCE SUMMARY:');
  const successfulRuns = results.filter(r => r.success);
  const failedRuns = results.filter(r => !r.success);
  
  colorLog('white', `📈 Successful runs: ${successfulRuns.length}/${testRuns}`);
  colorLog('white', `📉 Failed runs: ${failedRuns.length}/${testRuns}`);
  
  if (successfulRuns.length > 0) {
    const responseTimes = successfulRuns.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    colorLog('white', `⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    colorLog('white', `🏃 Fastest Response: ${minResponseTime}ms`);
    colorLog('white', `🐌 Slowest Response: ${maxResponseTime}ms`);
  }
  
  return successfulRuns.length / testRuns;
}

async function runAllTests() {
  colorLog('magenta', '\n🧪 === COMPREHENSIVE AGENT TESTING ===');
  colorLog('white', `📅 Started at: ${new Date().toISOString()}`);
  
  const testResults = {
    health: false,
    execution: false,
    performance: 0
  };
  
  // Test 1: Health Check
  testResults.health = await testHealthCheck();
  
  // Test 2: Agent Execution (only if health check passes)
  if (testResults.health) {
    testResults.execution = await testAgentExecution();
  } else {
    colorLog('yellow', '\n⚠️  Skipping execution test due to health check failure');
  }
  
  // Test 3: Performance Test (only if execution works)
  if (testResults.execution) {
    testResults.performance = await performanceTest();
  } else {
    colorLog('yellow', '\n⚠️  Skipping performance test due to execution failure');
  }
  
  // Final Summary
  colorLog('magenta', '\n📊 === FINAL TEST SUMMARY ===');
  colorLog('white', `📅 Completed at: ${new Date().toISOString()}`);
  
  const healthIcon = testResults.health ? '✅' : '❌';
  const executionIcon = testResults.execution ? '✅' : '❌';
  const performanceIcon = testResults.performance > 0.5 ? '✅' : '❌';
  
  colorLog('white', `${healthIcon} Health Check: ${testResults.health ? 'PASSED' : 'FAILED'}`);
  colorLog('white', `${executionIcon} Agent Execution: ${testResults.execution ? 'PASSED' : 'FAILED'}`);
  colorLog('white', `${performanceIcon} Performance Test: ${(testResults.performance * 100).toFixed(1)}% success rate`);
  
  const overallSuccess = testResults.health && testResults.execution && testResults.performance > 0.5;
  const overallIcon = overallSuccess ? '✅' : '❌';
  
  colorLog(overallSuccess ? 'green' : 'red', `\n${overallIcon} OVERALL RESULT: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
  
  return testResults;
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    colorLog('red', `\n💥 Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests, testHealthCheck, testAgentExecution, performanceTest }; 