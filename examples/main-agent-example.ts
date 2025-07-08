/**
 * 📝 EXAMPLE: Using the Main Email-Makers Agent
 * 
 * This example shows how to use the optimized Email-Makers agent
 * with the new tool-registry.ts architecture
 */

import EmailMakersAgent, { 
  generateEmail, 
  generateWithSpecialist, 
  getSystemInfo 
} from '../src/agent/main-agent';

async function demonstrateMainAgent() {
  console.log('🚀 Email-Makers Agent Demo\n');

  // 1. Get system information
  console.log('📊 System Information:');
  const systemInfo = getSystemInfo();
  console.log(JSON.stringify(systemInfo, null, 2));
  console.log('\n');

  // 2. Quick email generation
  console.log('⚡ Quick Email Generation:');
  try {
    const result = await generateEmail('Black Friday deals for flights to Paris');
    console.log('✅ Quick generation result:', result);
  } catch (error) {
    console.error('❌ Quick generation error:', error);
  }
  console.log('\n');

  // 3. Use specific specialist
  console.log('🎯 Content Specialist Only:');
  try {
    const contentResult = await generateWithSpecialist(
      'Create content for summer vacation deals',
      'content'
    );
    console.log('✅ Content specialist result:', contentResult);
  } catch (error) {
    console.error('❌ Content specialist error:', error);
  }
  console.log('\n');

  // 4. Full agent workflow
  console.log('🏗️ Full Agent Workflow:');
  const agent = new EmailMakersAgent();
  await agent.initialize();

  try {
    const fullResult = await agent.processRequest(
      'Create a complete email campaign for weekend getaway deals to Rome',
      {
        traceId: 'demo-trace-001',
        metadata: {
          demo: true,
          timestamp: new Date().toISOString()
        }
      }
    );
    console.log('✅ Full workflow result:', fullResult);
  } catch (error) {
    console.error('❌ Full workflow error:', error);
  }
  console.log('\n');

  // 5. Individual specialist usage
  console.log('👥 Individual Specialists:');
  try {
    const designResult = await agent.runSpecialist(
      'design',
      'Create MJML template for holiday deals email'
    );
    console.log('✅ Design specialist result:', designResult);
  } catch (error) {
    console.error('❌ Design specialist error:', error);
  }

  console.log('\n🎉 Demo completed!');
}

// Run the demo
if (require.main === module) {
  demonstrateMainAgent().catch(console.error);
}

export { demonstrateMainAgent }; 