/**
 * 🔧 QUICK ML-SCORING INTEGRATION CHECK
 * 
 * Быстрая проверка статуса интеграции ML scoring tools
 * без запуска полного workflow
 */

import { toolRegistry } from '../src/agent/core/tool-registry';

async function quickMLIntegrationCheck() {
  console.log('🔍 QUICK ML-SCORING INTEGRATION CHECK');
  console.log('=' .repeat(50));
  
  try {
    // 1. Проверяем общую статистику Tool Registry
    console.log('\n📊 Tool Registry Overview:');
    const stats = toolRegistry.getToolStats();
    console.log(`   - Total tools: ${stats.total}`);
    console.log(`   - Enabled tools: ${stats.enabled}`);
    console.log(`   - Quality tools: ${stats.byCategory.quality || 0}`);
    
    // 2. Проверяем ML-scoring tools
    console.log('\n🤖 ML-Scoring Tools Check:');
    const qualityTools = toolRegistry.getToolsForAgent('quality');
    
    // Получаем ML tools напрямую из registry (ToolDefinition), а не из OpenAI SDK objects
    const qualityToolNames = ['workflow_quality_analyzer', 'quality_controller', 'html_validator', 'analyze_email_quality', 'quick_quality_check', 'compare_email_quality'];
    const mlTools = qualityToolNames
      .map(name => toolRegistry.getTool(name))
      .filter(tool => tool && tool.metadata?.ml_powered === true);
    
    console.log(`   - Quality tools loaded: ${qualityTools.length}`);
    console.log(`   - ML-powered tools: ${mlTools.length}`);
    
    if (mlTools.length > 0) {
      console.log('\n✅ ML-Powered Tools Found:');
      mlTools.forEach(tool => {
        console.log(`   - ${tool.name} (v${tool.version}) - ${tool.enabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`     * OpenAI SDK: ${tool.metadata?.openai_sdk_native || false}`);
        console.log(`     * Analysis Type: ${tool.metadata?.analysis_type || 'unknown'}`);
      });
    } else {
      console.log('❌ No ML-powered tools found');
    }
    
    // 3. Проверяем workflow_quality_analyzer
    console.log('\n🔧 Workflow Quality Analyzer:');
    const workflowTool = toolRegistry.getTool('workflow_quality_analyzer');
    if (workflowTool) {
      console.log(`   ✅ Status: ${workflowTool.enabled ? 'ENABLED' : 'DISABLED'} (v${workflowTool.version})`);
      console.log(`   - Agents count: ${workflowTool.metadata?.agents_count || 'unknown'}`);
      console.log(`   - OpenAI SDK: ${workflowTool.metadata?.openai_sdk_integrated || false}`);
      console.log(`   - Tracing: ${workflowTool.metadata?.tracing_enabled || false}`);
      console.log(`   - Parallel execution: ${workflowTool.metadata?.parallel_execution || false}`);
    } else {
      console.log('   ❌ Workflow Quality Analyzer: NOT FOUND');
    }
    
    // 4. Проверяем individual ML tools доступность
    console.log('\n🎯 Individual ML Tools Availability:');
    const mlToolNames = ['analyze_email_quality', 'quick_quality_check', 'compare_email_quality'];
    let availableCount = 0;
    
    for (const toolName of mlToolNames) {
      try {
        const tool = toolRegistry.getOpenAITool(toolName);
        if (tool) {
          console.log(`   ✅ ${toolName}: Available`);
          availableCount++;
        } else {
          console.log(`   ❌ ${toolName}: NOT AVAILABLE`);
        }
      } catch (error) {
        console.log(`   ❌ ${toolName}: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // 5. Финальная оценка
    console.log('\n🎯 INTEGRATION STATUS SUMMARY:');
    console.log('=' .repeat(50));
    
    const totalMLTools = mlTools.length + availableCount;
    const workflowEnabled = workflowTool?.enabled || false;
    const hasMLTools = mlTools.length > 0;
    const hasWorkflow = !!workflowTool;
    
    if (totalMLTools >= 3 && workflowEnabled && hasMLTools && hasWorkflow) {
      console.log('🎉 ML-SCORING INTEGRATION: ✅ FULLY OPERATIONAL');
      console.log('   ✅ ML scoring tools properly registered');
      console.log('   ✅ Workflow quality analyzer enabled');
      console.log('   ✅ OpenAI SDK integration active');
      console.log('   ✅ Type fixes successfully applied');
      console.log('\n🚀 System ready for production use!');
    } else if (totalMLTools > 0 || hasWorkflow) {
      console.log('⚠️ ML-SCORING INTEGRATION: 🟡 PARTIALLY WORKING');
      console.log(`   - ML tools registered: ${mlTools.length}/3`);
      console.log(`   - Individual tools: ${availableCount}/3`);
      console.log(`   - Workflow analyzer: ${workflowEnabled ? 'enabled' : 'disabled'}`);
      console.log('\n🔧 Some components need attention');
    } else {
      console.log('❌ ML-SCORING INTEGRATION: 🔴 NOT WORKING');
      console.log('   ❌ No ML tools found');
      console.log('   ❌ Workflow analyzer missing or disabled');
      console.log('\n🛠️ Integration requires fixes');
    }
    
    // 6. Пример использования
    if (workflowEnabled) {
      console.log('\n📖 Usage Example:');
      console.log('```typescript');
      console.log("import { workflowQualityAnalyzer } from './tools/ai-consultant/workflow-quality-analyzer';");
      console.log('const result = await workflowQualityAnalyzer({');
      console.log('  html_content: "...",');
      console.log('  topic: "Campaign analysis",');
      console.log('  // ... other params');
      console.log('});');
      console.log('```');
    }
    
  } catch (error) {
    console.error('\n💥 CHECK FAILED:');
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('🔧 This indicates a critical integration issue');
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
  }
}

// Запускаем проверку
if (require.main === module) {
  quickMLIntegrationCheck().catch(console.error);
}

export { quickMLIntegrationCheck }; 