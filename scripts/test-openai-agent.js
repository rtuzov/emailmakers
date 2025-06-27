#!/usr/bin/env node

const http = require('http');

console.log('🤖 Testing OpenAI Agent Integration...\n');

async function testOpenAIAgent() {
  const data = JSON.stringify({
    topic: "OpenAI Agent Test - Romantic Paris Flight " + new Date().toLocaleTimeString()
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agent/paris-campaign',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Invalid JSON', body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('📡 Calling OpenAI Agent API...');
    const startTime = Date.now();
    
    const result = await testOpenAIAgent();
    const elapsed = Date.now() - startTime;
    
    console.log(`⏱️  Response received in ${elapsed}ms\n`);
    
    if (result.status === 'success') {
      console.log('✅ OpenAI Agent Test PASSED\n');
      
      console.log('🤖 Agent Information:');
      if (result.agent_info) {
        console.log(`   • Used OpenAI Agent: ${result.agent_info.used_openai_agent ? '✅' : '❌'}`);
        console.log(`   • Model: ${result.agent_info.model || 'Unknown'}`);
        console.log(`   • Agent Name: ${result.agent_info.agent_name || 'Unknown'}`);
        console.log(`   • SDK Version: ${result.agent_info.sdk_version || 'Unknown'}`);
      }
      
      console.log('\n📊 Performance Metrics:');
      if (result.data) {
        console.log(`   • Generation Time: ${result.data.generation_time || 0}ms`);
        console.log(`   • Token Usage: ${result.data.token_usage || 0} tokens`);
        console.log(`   • Layout Regression: ${result.data.layout_regression || 'unknown'}`);
        console.log(`   • Render Testing: ${result.data.render_testing || 'unknown'}`);
      }
      
      console.log('\n📈 Campaign Details:');
      if (result.campaign_details) {
        console.log(`   • Route: ${result.campaign_details.route || 'unknown'}`);
        console.log(`   • Destination: ${result.campaign_details.destination || 'unknown'}`);
      }
      
      console.log('\n🎯 OpenAI Traces Status:');
      console.log('   • Check your OpenAI dashboard at: https://platform.openai.com/');
      console.log('   • Look for traces from agent: kupibilet-email-generator-v2');
      console.log('   • Model used: gpt-4o-mini');
      console.log(`   • Request time: ${new Date().toISOString()}`);
      
    } else {
      console.log('❌ OpenAI Agent Test FAILED\n');
      console.log('Error:', result.error || result.message || 'Unknown error');
      
      if (result.agent_info?.error_occurred) {
        console.log('\n🔧 Agent Error Details:');
        console.log(`   • Used OpenAI Agent: ${result.agent_info.used_openai_agent ? 'Yes' : 'No'}`);
        console.log('   • Check API keys and organization settings');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed with exception:');
    console.log(error.message);
  }
}

main(); 