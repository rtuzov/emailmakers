#!/usr/bin/env node

/**
 * 🧪 THAILAND AUTUMN CAMPAIGN TEST
 * 
 * Testing Email-Makers agent system with Thailand autumn travel campaign
 * through the api/agent/run-improved endpoint
 */

const http = require('http');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const API_BASE = 'http://localhost:3000';

function colorLog(color, prefix, message) {
  console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            raw: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            raw: responseData,
            parseError: error
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthCheck() {
  colorLog('cyan', '🔍', '=== HEALTH CHECK TEST ===');
  
  try {
    const startTime = Date.now();
    const response = await makeRequest('/api/agent/run-improved');
    const duration = Date.now() - startTime;
    
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      colorLog('green', '✅', 'Health Check: PASSED');
      colorLog('blue', '📊', `Status: ${response.data.status}`);
      colorLog('blue', '🤖', `Agents: ${response.data.agents ? Object.keys(response.data.agents).length : 0} available`);
      colorLog('blue', '🔄', `Handoffs: ${response.data.handoffs ? Object.keys(response.data.handoffs).length : 0} configured`);
      
      if (response.data.agents) {
        colorLog('blue', '📋', 'Agent Details:');
        Object.entries(response.data.agents).forEach(([name, status]) => {
          const icon = status === 'available' ? '✅' : '❌';
          console.log(`   ${icon} ${name}: ${status}`);
        });
      }
      
      if (response.data.handoffs) {
        colorLog('blue', '🔗', 'Handoff Details:');
        Object.entries(response.data.handoffs).forEach(([name, statusObj]) => {
          const status = typeof statusObj === 'object' ? 'configured' : statusObj;
          const icon = status === 'configured' ? '✅' : '❌';
          console.log(`   ${icon} ${name}: ${status}`);
        });
      }
      
      return { success: true, duration };
    } else {
      colorLog('red', '❌', `Health Check: FAILED (${response.statusCode})`);
      console.log('Response:', response.data);
      return { success: false, duration };
    }
  } catch (error) {
    colorLog('red', '❌', `Health Check: ERROR - ${error.message}`);
    return { success: false, duration: 0 };
  }
}

async function testThailandCampaign() {
  colorLog('cyan', '🚀', '=== THAILAND AUTUMN CAMPAIGN TEST ===');
  
  const campaignBrief = `Создай email-кампанию для продвижения авиабилетов в Тайланд осенью:

🌏 НАПРАВЛЕНИЕ: Тайланд (Бангкок, Пхукет, Краби)
📅 СЕЗОН: Осень 2025 (октябрь-ноябрь)  
🎯 АУДИТОРИЯ: Путешественники 25-45 лет, семьи с детьми
💰 БЮДЖЕТ: Средний+ сегмент (50,000-120,000 руб)
🎨 СТИЛЬ: Тёплый, экзотический, вдохновляющий

ПРЕИМУЩЕСТВА ОСЕНИ В ТАЙЛАНДЕ:
- Конец сезона дождей, отличная погода
- Меньше туристов, больше места на пляжах
- Более выгодные цены на отели
- Идеальное время для островов и дайвинга
- Фестивали и культурные события

ЭМОЦИОНАЛЬНЫЕ ТРИГГЕРЫ:
- Экзотика и приключения
- Спокойствие и релакс  
- Семейное время вместе
- Новые впечатления и открытия

ПРИЗЫВ К ДЕЙСТВИЮ: "Забронировать авиабилеты в Тайланд" 

Создай привлекательный email с ярким дизайном, качественными текстами и убедительными аргументами для бронирования.`;

  const requestData = {
    task_type: 'email-campaign-creation',
    input: campaignBrief,
    context: {
      language: 'ru',
      campaign_type: 'promotional', 
      industry: 'travel',
      urgency: 'medium',
      target_audience: 'adults_families',
      destination: 'thailand',
      season: 'autumn',
      budget_segment: 'medium_plus'
    }
  };

  try {
    colorLog('yellow', '⏱️', 'Starting Thailand campaign agent execution...');
    colorLog('blue', '📋', `Task Type: ${requestData.task_type}`);
    colorLog('blue', '📝', `Input length: ${requestData.input.length} characters`);
    colorLog('blue', '🔧', `Context: ${JSON.stringify(requestData.context).substring(0, 100)}...`);
    
    const startTime = Date.now();
    const response = await makeRequest('/api/agent/run-improved', 'POST', requestData);
    const executionTime = Date.now() - startTime;
    
    if (response.statusCode === 200) {
      colorLog('green', '✅', `Agent Execution: PASSED in ${executionTime}ms`);
      
      if (response.data.agent) {
        colorLog('blue', '🎯', `Agent: ${response.data.agent}`);
      }
      
      if (response.data.task) {
        colorLog('blue', '📋', `Task Type: ${response.data.task}`);
      }
      
      colorLog('blue', '⏱️', `Execution Time: ${executionTime}ms`);
      colorLog('blue', '📊', `Response Time: ${executionTime}ms`);
      
      // Analyze response content
      colorLog('cyan', '📈', 'RESULT ANALYSIS:');
      if (response.data.result) {
        const resultStr = typeof response.data.result === 'string' 
          ? response.data.result 
          : JSON.stringify(response.data.result);
        colorLog('blue', '📤', `Result: ${resultStr.substring(0, 200)}...`);
      }
      
      if (response.data.state) {
        colorLog('blue', '🔧', `Final State: ${JSON.stringify(response.data.state).substring(0, 100)}...`);
      }
      
      // Look for campaign-specific indicators
      const responseText = JSON.stringify(response.data).toLowerCase();
      const thailandIndicators = [
        'тайланд', 'thailand', 'бангкок', 'bangkok', 
        'пхукет', 'phuket', 'краби', 'krabi',
        'осень', 'autumn', 'октябрь', 'ноябрь'
      ];
      
      const foundIndicators = thailandIndicators.filter(indicator => 
        responseText.includes(indicator)
      );
      
      if (foundIndicators.length > 0) {
        colorLog('green', '🎯', `Thailand Campaign Content Detected: ${foundIndicators.join(', ')}`);
      }
      
      return { 
        success: true, 
        duration: executionTime,
        hasThailandContent: foundIndicators.length > 0,
        response: response.data
      };
      
    } else {
      colorLog('red', '❌', `Agent Execution: FAILED (${response.statusCode})`);
      console.log('Error Response:', response.data);
      return { 
        success: false, 
        duration: executionTime,
        error: response.data
      };
    }
    
  } catch (error) {
    colorLog('red', '❌', `Agent Execution: ERROR - ${error.message}`);
    return { 
      success: false, 
      duration: 0,
      error: error.message 
    };
  }
}

async function runPerformanceTest() {
  colorLog('cyan', '⚡', '=== PERFORMANCE TEST ===');
  
  const results = [];
  const testRuns = 2; // Reduced for Thailand campaign focus
  
  for (let i = 1; i <= testRuns; i++) {
    colorLog('yellow', '🔄', `Performance Test ${i}/${testRuns}`);
    
    const result = await testThailandCampaign();
    results.push(result);
    
    if (result.success) {
      colorLog('green', '✅', `Run ${i}: ${result.duration}ms`);
    } else {
      colorLog('red', '❌', `Run ${i}: FAILED`);
    }
  }
  
  const successfulRuns = results.filter(r => r.success);
  const failedRuns = results.filter(r => !r.success);
  
  colorLog('cyan', '📊', 'PERFORMANCE SUMMARY:');
  colorLog('green', '📈', `Successful runs: ${successfulRuns.length}/${testRuns}`);
  colorLog('red', '📉', `Failed runs: ${failedRuns.length}/${testRuns}`);
  
  if (successfulRuns.length > 0) {
    const avgTime = successfulRuns.reduce((sum, r) => sum + r.duration, 0) / successfulRuns.length;
    const minTime = Math.min(...successfulRuns.map(r => r.duration));
    const maxTime = Math.max(...successfulRuns.map(r => r.duration));
    
    colorLog('blue', '⏱️', `Average Response Time: ${avgTime.toFixed(2)}ms`);
    colorLog('blue', '🏃', `Fastest Response: ${minTime}ms`);
    colorLog('blue', '🐌', `Slowest Response: ${maxTime}ms`);
  }
  
  const successRate = (successfulRuns.length / testRuns) * 100;
  return {
    totalRuns: testRuns,
    successfulRuns: successfulRuns.length,
    failedRuns: failedRuns.length,
    successRate,
    results
  };
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
🧪 === THAILAND AUTUMN CAMPAIGN TESTING ===
📅 Started at: ${new Date().toISOString()}
${colors.reset}`);

  // Test 1: Health Check
  const healthResult = await testHealthCheck();
  console.log('');

  if (!healthResult.success) {
    colorLog('red', '💥', 'Health check failed. Stopping tests.');
    process.exit(1);
  }

  // Test 2: Single Thailand Campaign Test (NO RETRIES)
  const campaignResult = await testThailandCampaign();
  console.log('');

  // Final Summary
  colorLog('cyan', '📊', '=== FINAL TEST SUMMARY ===');
  colorLog('blue', '📅', `Completed at: ${new Date().toISOString()}`);
  colorLog(healthResult.success ? 'green' : 'red', healthResult.success ? '✅' : '❌', 
    `Health Check: ${healthResult.success ? 'PASSED' : 'FAILED'}`);
  colorLog(campaignResult.success ? 'green' : 'red', campaignResult.success ? '✅' : '❌', 
    `Thailand Campaign: ${campaignResult.success ? 'PASSED' : 'FAILED'}`);

  if (campaignResult.hasThailandContent) {
    colorLog('green', '🌏', 'Thailand-specific content successfully generated!');
  }

  const overallSuccess = healthResult.success && campaignResult.success;
  colorLog('cyan', overallSuccess ? '✅' : '❌', `OVERALL RESULT: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
  
  console.log('');
}

// Run the test
main().catch(error => {
  colorLog('red', '💥', `Test execution failed: ${error.message}`);
  process.exit(1);
}); 