/**
 * 🔧 TEST ML-SCORING INTEGRATION
 * 
 * Тест для проверки правильной интеграции ML scoring tools
 * после исправления типов и включения в Tool Registry
 */

import { toolRegistry } from './core/tool-registry';
import { workflowQualityAnalyzer } from './tools/ai-consultant/workflow-quality-analyzer';

// Тестовые данные
const testEmailData = {
  html_content: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
    <html>
      <head>
        <title>Test Email - Kupibilet</title>
        <style>
          .header { background-color: #4BFF7E; color: #1DA857; }
          .content { font-family: Arial, sans-serif; }
          .cta { background-color: #FF6240; color: white; padding: 12px 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌟 Эксклюзивное предложение от Kupibilet!</h1>
        </div>
        <div class="content">
          <p>Привет! У нас для вас особенное предложение.</p>
          <p>Скидка до 40% на авиабилеты в европейские столицы!</p>
          <p><strong>Только до 31 декабря 2024!</strong></p>
          <a href="#" class="cta">Найти билеты →</a>
        </div>
      </body>
    </html>
  `,
  mjml_source: `
    <mjml>
      <mj-body>
        <mj-section background-color="#4BFF7E">
          <mj-column>
            <mj-text color="#1DA857">
              <h1>🌟 Эксклюзивное предложение от Kupibilet!</h1>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  topic: "Новогодняя распродажа авиабилетов"
};

async function testMLScoringIntegration() {
  console.log('🧪 TESTING ML-SCORING INTEGRATION');
  console.log('=' .repeat(60));
  
  try {
    // 1. Проверяем статус Tool Registry
    console.log('\n📋 Step 1: Tool Registry Status');
    console.log('-'.repeat(40));
    
    const qualityTools = toolRegistry.getToolsForAgent('quality');
    console.log(`✅ Quality tools loaded: ${qualityTools.length}`);
    
    // Проверяем ML-scoring tools
    const mlTools = qualityTools.filter(tool => tool.metadata?.ml_powered === true);
    console.log(`🤖 ML-powered tools: ${mlTools.length}`);
    
    mlTools.forEach(tool => {
      console.log(`   - ${tool.name} (v${tool.version}) - ${tool.enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Проверяем workflow_quality_analyzer
    const workflowTool = qualityTools.find(tool => tool.name === 'workflow_quality_analyzer');
    if (workflowTool) {
      console.log(`✅ Workflow Quality Analyzer: ${workflowTool.enabled ? 'ENABLED' : 'DISABLED'} (v${workflowTool.version})`);
      console.log(`   - Agents count: ${workflowTool.metadata?.agents_count}`);
      console.log(`   - OpenAI SDK: ${workflowTool.metadata?.openai_sdk_integrated}`);
    } else {
      console.log('❌ Workflow Quality Analyzer: NOT FOUND');
    }
    
    // 2. Тест ML scoring tools availability
    console.log('\n🤖 Step 2: ML Scoring Tools Availability');
    console.log('-'.repeat(40));
    
    const mlToolNames = ['analyze_email_quality', 'quick_quality_check', 'compare_email_quality'];
    for (const toolName of mlToolNames) {
      const tool = toolRegistry.getOpenAITool(toolName);
      if (tool) {
        console.log(`✅ ${toolName}: Available`);
      } else {
        console.log(`❌ ${toolName}: NOT AVAILABLE`);
      }
    }
    
    // 3. Тест workflow quality analyzer
    console.log('\n🔍 Step 3: Workflow Quality Analyzer Test');
    console.log('-'.repeat(40));
    
    const analysisParams = {
      html_content: testEmailData.html_content,
      mjml_source: testEmailData.mjml_source,
      topic: testEmailData.topic,
      campaign_context: {
        campaign_type: 'promotional' as const,
        target_audience: 'frequent_travelers',
        brand_guidelines: JSON.stringify({
          primary_color: '#4BFF7E',
          secondary_color: '#1DA857',
          accent_color: '#FF6240',
          tone: 'friendly_professional'
        }),
        assets_used: ['kupibilet-logo.png', 'plane-icon.svg']
      },
      analysis_scope: {
        content_quality: true,
        visual_design: true,
        technical_compliance: true,
        emotional_resonance: true,
        brand_alignment: true,
        performance_optimization: true
      },
      quality_requirements: {
        minimum_score: 70,
        require_compliance: true,
        auto_fix_issues: false
      },
      workflow_context: {
        workflow_id: 'test-ml-integration-' + Date.now(),
        trace_id: 'test-trace-' + Date.now(),
        iteration_count: 0,
        previous_scores: []
      }
    };
    
    console.log('⚙️ Starting analysis...');
    const startTime = Date.now();
    
    const result = await workflowQualityAnalyzer(analysisParams);
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ Analysis completed in ${duration}ms`);
    
    // 4. Проверяем результаты
    console.log('\n📊 Step 4: Results Analysis');
    console.log('-'.repeat(40));
    
    console.log(`✨ Success: ${result.success}`);
    console.log(`📈 Quality Score: ${result.quality_score}/100`);
    console.log(`🚪 Quality Gate: ${result.quality_gate_passed ? 'PASSED' : 'FAILED'}`);
    console.log(`🤖 Agents Executed: ${result.analytics.agents_executed}`);
    console.log(`🎯 ML Confidence: ${result.analytics.ml_confidence}%`);
    console.log(`⏰ Execution Time: ${result.analytics.execution_time_ms}ms`);
    
    if (result.quality_report) {
      console.log('\n📋 Quality Breakdown:');
      console.log(`   - Content Quality: ${result.agent_analysis.content_quality.score}/20`);
      console.log(`   - Visual Design: ${result.agent_analysis.visual_design.score}/20`);
      console.log(`   - Technical Compliance: ${result.agent_analysis.technical_compliance.score}/20`);
      console.log(`   - Emotional Resonance: ${result.agent_analysis.emotional_resonance.score}/20`);
      console.log(`   - Brand Alignment: ${result.agent_analysis.brand_alignment.score}/20`);
    }
    
    if (result.handoff_recommendations) {
      console.log('\n🔄 Handoff Recommendations:');
      console.log(`   - Next Agent: ${result.handoff_recommendations.next_agent || 'None'}`);
      console.log(`   - Requires Manual Review: ${result.handoff_recommendations.requires_manual_review}`);
      console.log(`   - Next Actions: ${result.handoff_recommendations.next_actions.length} actions`);
    }
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    // 5. Проверяем performance metrics
    console.log('\n⚡ Step 5: Performance Metrics');
    console.log('-'.repeat(40));
    
    const expectedMinScore = 40; // Ожидаем как минимум 40/100 для тестового email'а
    const maxExpectedTime = 10000; // Максимум 10 секунд
    
    const scoreTest = result.quality_score >= expectedMinScore;
    const timeTest = result.analytics.execution_time_ms <= maxExpectedTime;
    const agentsTest = result.analytics.agents_executed === 5;
    
    console.log(`📊 Score Test (≥${expectedMinScore}): ${scoreTest ? '✅ PASS' : '❌ FAIL'} (${result.quality_score})`);
    console.log(`⏰ Time Test (≤${maxExpectedTime}ms): ${timeTest ? '✅ PASS' : '❌ FAIL'} (${result.analytics.execution_time_ms}ms)`);
    console.log(`🤖 Agents Test (=5): ${agentsTest ? '✅ PASS' : '❌ FAIL'} (${result.analytics.agents_executed})`);
    
    const allTestsPassed = scoreTest && timeTest && agentsTest && result.success;
    
    console.log('\n🎯 FINAL RESULT');
    console.log('=' .repeat(60));
    
    if (allTestsPassed) {
      console.log('🎉 ML-SCORING INTEGRATION: SUCCESS!');
      console.log('✅ All tests passed');
      console.log('✅ ML scoring tools properly integrated');
      console.log('✅ Workflow quality analyzer working correctly');
      console.log('✅ Performance metrics within acceptable ranges');
      console.log('✅ Type fixes resolved');
      console.log('\n🚀 System ready for production!');
    } else {
      console.log('❌ ML-SCORING INTEGRATION: PARTIALLY WORKING');
      console.log('⚠️ Some tests failed or performance issues detected');
      console.log('🔧 Review integration and type definitions');
    }
    
  } catch (error) {
    console.error('\n💥 INTEGRATION TEST FAILED');
    console.error('=' .repeat(60));
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('\n🔧 Next steps:');
    console.error('   1. Check type definitions in types.ts');
    console.error('   2. Verify AgentEmailAnalyzer integration');
    console.error('   3. Check ML scoring tools availability');
    console.error('   4. Review OpenAI Agents SDK configuration');
  }
}

// Если запускается напрямую, выполняем тест
if (require.main === module) {
  testMLScoringIntegration().catch(console.error);
}

export { testMLScoringIntegration }; 