import { EmailGeneratorAgent } from './src/agent/agent';
import { EmailGenerationRequest } from './src/agent/types';

/**
 * Быстрый тест полного workflow агента
 */

async function quickAgentTest() {
  console.log('🚀 Quick Agent Test - Full Workflow\n');
  
  // Создаем агента с UltraThink в speed режиме для быстрого теста
  const agent = new EmailGeneratorAgent(true, 'speed');
  
  const testRequest: EmailGenerationRequest = {
    topic: 'Быстрый тест агента - скидки на билеты в Париж',
    origin: 'MOW',
    destination: 'CDG',
    campaign_type: 'promotional',
    target_audience: 'молодые путешественники',
    tone: 'friendly'
  };
  
  console.log('📋 Test Request:');
  console.log(JSON.stringify(testRequest, null, 2));
  console.log('\n🔄 Starting email generation...\n');
  
  try {
    const startTime = Date.now();
    const result = await agent.generateEmail(testRequest);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Email generation completed in ${duration}ms`);
    console.log('\n📊 Results:');
    console.log(`Status: ${result.status}`);
    
    if (result.status === 'success') {
      console.log(`Quality Score: ${result.quality_score || 'N/A'}`);
      console.log(`Quality Check: ${result.quality_check}`);
      console.log(`Layout Regression: ${result.layout_regression}`);
      console.log(`Render Testing: ${result.render_testing}`);
      console.log(`Generation Time: ${result.generation_time}ms`);
      console.log(`Trace ID: ${result.trace_id}`);
      
      if (result.campaign_metadata) {
        console.log('\n📈 Campaign Metadata:');
        console.log(`Topic: ${result.campaign_metadata.topic}`);
        console.log(`Routes Analyzed: ${result.campaign_metadata.routes_analyzed?.join(', ')}`);
        console.log(`Prices Found: ${result.campaign_metadata.prices_found}`);
        console.log(`Content Variations: ${result.campaign_metadata.content_variations}`);
        
        // Multi-agent specific data
        if (result.campaign_metadata.agents_executed) {
          console.log(`Agents Executed: ${result.campaign_metadata.agents_executed.join(', ')}`);
        }
        if (result.campaign_metadata.workflow_efficiency) {
          console.log(`Workflow Efficiency: ${result.campaign_metadata.workflow_efficiency}%`);
        }
        if (result.campaign_metadata.issues_resolved) {
          console.log(`Issues Resolved: ${result.campaign_metadata.issues_resolved}`);
        }
      }
      
      if (result.html_url) {
        console.log(`\n🌐 HTML Output: ${result.html_url}`);
      }
      
      console.log('\n🎉 Test PASSED - Agent workflow completed successfully!');
      
    } else {
      console.log(`❌ Error: ${result.error_message}`);
      console.log('\n🚨 Test FAILED - Agent workflow failed');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with exception:', error);
    console.log('\n🚨 Test FAILED - Exception thrown');
  }
}

// Запуск теста
if (require.main === module) {
  quickAgentTest().catch(console.error);
}

export { quickAgentTest }; 