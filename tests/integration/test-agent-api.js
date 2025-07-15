/**
 * 🧪 TEST SCENARIO: Content Specialist Tool Execution
 * 
 * This test verifies that:
 * 1. Tools are properly registered and callable
 * 2. Execute functions run with proper logging
 * 3. Output appears in OpenAI dashboard logs
 */

const axios = require('axios');

console.log('🧪 TESTING CONTENT SPECIALIST TOOL EXECUTION');
console.log('='.repeat(60));

async function testContentSpecialistTools() {
  try {
    console.log('\n1️⃣ Testing API endpoint /api/agent/run-improved...');
    
    const testBrief = {
      brief: "Create an email campaign for special offers from Moscow to Dubai for the upcoming spring season. Target audience: Russian travelers looking for affordable vacation options. The campaign should highlight great prices and the perfect weather in Dubai during spring.",
      campaign_name: "Spring Dubai Deals",
      brand_name: "Kupibilet"
    };

    console.log('\n📝 Test Brief:', JSON.stringify(testBrief, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/agent/run-improved', testBrief, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Response received!');
    console.log('📊 Status:', response.status);
    console.log('📊 Response type:', typeof response.data);
    
    if (response.data) {
      console.log('\n🔍 Response Analysis:');
      
      // Check for tool executions
      if (response.data.messages) {
        console.log('📨 Messages found:', response.data.messages.length);
        
        // Look for tool calls
        const toolCalls = response.data.messages.filter(msg => 
          msg.tool_calls || msg.content?.includes('[') || msg.role === 'tool'
        );
        console.log('🔧 Tool calls detected:', toolCalls.length);
        
        // Check for specific tools
        const toolsExecuted = new Set();
        response.data.messages.forEach(msg => {
          if (msg.tool_calls) {
            msg.tool_calls.forEach(call => {
              toolsExecuted.add(call.function.name);
            });
          }
        });
        
        console.log('\n🔧 Tools executed:');
        toolsExecuted.forEach(tool => {
          console.log(`  ✅ ${tool}`);
        });
        
        // Check for expected content specialist tools
        const expectedTools = [
          'contextProvider',
          'dateIntelligence', 
          'pricingIntelligence',
          'assetStrategy',
          'contentGenerator'
        ];
        
        console.log('\n📋 Expected Tools Check:');
        expectedTools.forEach(tool => {
          const found = toolsExecuted.has(tool);
          console.log(`  ${found ? '✅' : '❌'} ${tool}`);
        });
      }
      
      // Check for handoffs
      if (response.data.thread_id) {
        console.log('\n🆔 Thread ID:', response.data.thread_id);
        console.log('   ℹ️  Check OpenAI dashboard for detailed logs');
      }
      
      // Look for console logs in output
      const output = JSON.stringify(response.data);
      const hasLogs = output.includes('[CONTEXT PROVIDER]') || 
                     output.includes('[PRICING INTELLIGENCE]') ||
                     output.includes('[DATE INTELLIGENCE]') ||
                     output.includes('[ASSET STRATEGY]') ||
                     output.includes('[CONTENT GENERATOR]');
      
      console.log('\n📊 Logging Detection:');
      console.log(`  ${hasLogs ? '✅' : '❌'} Tool execution logs found in output`);
      
      // Display final result
      if (response.data.result) {
        console.log('\n🎯 Final Result:');
        console.log(response.data.result.substring(0, 200) + '...');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  }
}

console.log('\n🚀 Starting test in 3 seconds...');
console.log('   ⚠️  Make sure the Next.js server is running on port 3000');

setTimeout(() => {
  testContentSpecialistTools().then(() => {
    console.log('\n✅ Test completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Check the console output above for tool executions');
    console.log('2. Visit OpenAI dashboard to see the thread logs');
    console.log('3. Verify all content specialist tools appear in the trace');
    console.log('4. Look for the detailed logging output from each tool');
  });
}, 3000);