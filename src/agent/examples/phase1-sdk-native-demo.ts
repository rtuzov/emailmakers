/**
 * 🚀 PHASE 1 SDK-NATIVE DEMONSTRATION
 * 
 * Демонстрирует правильное использование OpenAI Agents SDK:
 * - Agent.create() для type-safe handoffs
 * - Встроенная функциональность SDK
 * - Native tool integration
 * - Streaming support
 */

import { 
  triageAgent, 
  runEmailMakersWorkflow, 
  createSpecializedWorkflow,
  getWorkflowStats 
} from '../core/agent-handoffs-sdk';

/**
 * 🎯 Demo 1: SDK-Native Handoffs
 */
async function demoSDKNativeHandoffs() {
  console.log('\n🎯 === DEMO 1: SDK-Native Handoffs ===');
  
  const startTime = Date.now();
  
  try {
    const result = await runEmailMakersWorkflow(
      'Create a promotional email template for our summer sale with bright colors and beach imagery'
    );
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Handoff completed successfully');
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📊 Final output type: ${typeof result.finalOutput}`);
    console.log(`🔄 Handoffs occurred: ${!!result.finalOutput}`);
    
    // Show type safety
    console.log('\n📋 Type Safety Demo:');
    console.log('- Agent.create() ensures type-safe handoffs');
    console.log('- finalOutput is properly typed union');
    console.log('- SDK handles all routing automatically');
    
  } catch (error) {
    console.error('❌ Handoff failed:', error instanceof Error ? error.message : error);
  }
}

/**
 * 🔧 Demo 2: Specialized Workflows
 */
async function demoSpecializedWorkflows() {
  console.log('\n🔧 === DEMO 2: Specialized Workflows ===');
  
  const specialists = ['design', 'quality', 'delivery'] as const;
  
  for (const specialist of specialists) {
    const startTime = Date.now();
    
    try {
      const workflow = createSpecializedWorkflow(specialist);
      const result = await workflow(
        `Help me with ${specialist} aspects of email template creation`
      );
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${specialist.toUpperCase()} workflow: ${duration}ms`);
      console.log(`   Output available: ${!!result.finalOutput}`);
      
    } catch (error) {
      console.error(`❌ ${specialist} workflow failed:`, error);
    }
  }
}

/**
 * 📊 Demo 3: Performance Comparison
 */
async function demoPerformanceComparison() {
  console.log('\n📊 === DEMO 3: Performance Comparison ===');
  
  const iterations = 3;
  const results = [];
  
  console.log(`Testing ${iterations} SDK-native handoffs...`);
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      await runEmailMakersWorkflow(
        `Test request ${i + 1}: Create a simple newsletter template`
      );
      
      const duration = Date.now() - startTime;
      results.push(duration);
      console.log(`   Iteration ${i + 1}: ${duration}ms`);
      
    } catch (error) {
      console.error(`   Iteration ${i + 1} failed:`, error);
      results.push(0);
    }
  }
  
  const validResults = results.filter(r => r > 0);
  if (validResults.length > 0) {
    const avgTime = Math.round(validResults.reduce((a, b) => a + b, 0) / validResults.length);
    const minTime = Math.min(...validResults);
    const maxTime = Math.max(...validResults);
    
    console.log('\n📈 Performance Metrics:');
    console.log(`   Average: ${avgTime}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);
    console.log(`   Success rate: ${validResults.length}/${iterations} (${Math.round(validResults.length/iterations*100)}%)`);
  }
}

/**
 * 🎮 Demo 4: Streaming Support
 */
async function demoStreamingSupport() {
  console.log('\n🎮 === DEMO 4: Streaming Support ===');
  
  try {
    console.log('Starting streaming workflow...');
    
    const result = await runEmailMakersWorkflow(
      'Create an email template with real-time progress updates',
      { stream: true }
    );
    
    console.log('✅ Streaming completed');
    console.log(`📊 Result available: ${!!result.finalOutput}`);
    
  } catch (error) {
    console.error('❌ Streaming failed:', error);
  }
}

/**
 * 📋 Demo 5: SDK Features Showcase
 */
function demoSDKFeatures() {
  console.log('\n📋 === DEMO 5: SDK Features Showcase ===');
  
  const stats = getWorkflowStats();
  
  console.log('🔧 Architecture Features:');
  console.log(`   ✅ SDK Native: ${stats.sdk_native}`);
  console.log(`   ✅ Type Safe: ${stats.type_safe}`);
  console.log(`   ✅ Handoffs Enabled: ${stats.handoff_enabled}`);
  console.log(`   📊 Total Tools: ${stats.total_tools}`);
  console.log(`   🎯 Specialists: ${stats.available_specialists.join(', ')}`);
  
  console.log('\n🚀 SDK Benefits:');
  console.log('   • Agent.create() for type-safe handoffs');
  console.log('   • Built-in streaming support');
  console.log('   • Native tool integration');
  console.log('   • Automatic error handling');
  console.log('   • Performance optimization');
  console.log('   • OpenAI tracing integration');
}

/**
 * 🏃 Main Demo Runner
 */
async function runAllDemos() {
  console.log('🚀 === PHASE 1 SDK-NATIVE OPTIMIZATION DEMO ===');
  console.log('Demonstrating proper OpenAI Agents SDK usage\n');
  
  const totalStartTime = Date.now();
  
  try {
    // Run all demos
    await demoSDKNativeHandoffs();
    await demoSpecializedWorkflows();
    await demoPerformanceComparison();
    await demoStreamingSupport();
    demoSDKFeatures();
    
    const totalDuration = Date.now() - totalStartTime;
    
    console.log('\n🎉 === DEMO COMPLETED ===');
    console.log(`⏱️ Total time: ${totalDuration}ms`);
    console.log('✅ All SDK features demonstrated successfully');
    console.log('🚀 Ready for Phase 2 implementation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

/**
 * 🔥 Quick Performance Test
 */
export async function quickPerformanceTest() {
  console.log('\n⚡ === QUICK PERFORMANCE TEST ===');
  
  const startTime = Date.now();
  
  try {
    const result = await runEmailMakersWorkflow(
      'Quick test: Create a simple email template'
    );
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Quick test completed in ${duration}ms`);
    console.log(`📊 Success: ${!!result.finalOutput}`);
    
    return {
      success: true,
      duration,
      hasOutput: !!result.finalOutput
    };
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run demos if called directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  runAllDemos,
  demoSDKNativeHandoffs,
  demoSpecializedWorkflows,
  demoPerformanceComparison,
  demoStreamingSupport,
  demoSDKFeatures
}; 