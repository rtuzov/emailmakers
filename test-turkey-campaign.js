const { execSync } = require('child_process');

console.log('\n🧪 === TURKEY SUMMER CAMPAIGN TESTING ===');
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Test input for Turkey summer campaign
const turkeyInput = `Создай email-кампанию для продвижения авиабилетов в Турцию летом:

🏖️ НАПРАВЛЕНИЕ: Турция (Стамбул, Анталья, Каппадокия)
🌅 СЕЗОН: Лето 2025 (июнь-август)
💰 БЮДЖЕТ: 40,000-100,000 рублей
👥 АУДИТОРИЯ: Молодые пары и семьи 25-40 лет
🎯 ЭМОЦИОНАЛЬНЫЕ ТРИГГЕРЫ: Культурное наследие, пляжи, приключения, восточная экзотика
📧 ТИП: Промо-кампания с ограниченным предложением
🎨 СТИЛЬ: Яркий, культурный, теплый

ОСОБЕННОСТИ:
- Акцент на культурное наследие Стамбула
- Пляжный отдых в Анталье
- Воздушные шары в Каппадокии
- Турецкая кухня и гостеприимство
- Выгодные цены на летний сезон`;

async function testTurkeyCampaign() {
  console.log('\n🚀 === TURKEY SUMMER CAMPAIGN TEST ===');
  console.log('⏱️ Starting Turkey campaign agent execution...');
  
  try {
    const startTime = Date.now();
    
    // Run the agent with Turkey campaign
    const result = execSync(`node test-api-agent.js`, {
      input: JSON.stringify({
        task: 'email-campaign-creation',
        input: turkeyInput,
        context: {
          language: 'ru',
          campaign_type: 'promotional',
          industry: 'travel',
          urgency: 'medium',
          target_audience: 'couples_families_25_40',
          destination: 'Turkey',
          season: 'summer'
        }
      }),
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`✅ Agent Execution: PASSED in ${executionTime}ms`);
    console.log(`🎯 Agent: Email Campaign Orchestrator`);
    console.log(`⏱️ Execution Time: ${executionTime}ms`);
    console.log(`📊 Response Time: ${executionTime}ms`);
    
    // Parse and analyze result
    const parsedResult = JSON.parse(result);
    console.log('\n📈 RESULT ANALYSIS:');
    console.log(`📤 Result: ${JSON.stringify(parsedResult).substring(0, 200)}...`);
    
    // Check for Turkey-specific content
    const resultStr = JSON.stringify(parsedResult).toLowerCase();
    const turkeyKeywords = ['турция', 'turkey', 'стамбул', 'istanbul', 'анталья', 'antalya', 'каппадокия', 'cappadocia', 'лето', 'summer', 'июнь', 'июль', 'август'];
    const foundKeywords = turkeyKeywords.filter(keyword => resultStr.includes(keyword));
    
    if (foundKeywords.length > 0) {
      console.log(`🎯 Turkey Campaign Content Detected: ${foundKeywords.join(', ')}`);
      return { success: true, executionTime, foundKeywords };
    } else {
      console.log('❌ Turkey-specific content not detected');
      return { success: false, executionTime, foundKeywords: [] };
    }
    
  } catch (error) {
    console.error('❌ Turkey Campaign Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // Health check first
  console.log('\n🔍 === HEALTH CHECK TEST ===');
  try {
    const healthResult = execSync('curl -s http://localhost:3000/api/health', { encoding: 'utf8' });
    const health = JSON.parse(healthResult);
    
    if (health.status === 'healthy') {
      console.log('✅ Health Check: PASSED');
      console.log(`📊 Status: ${health.status}`);
      console.log(`🤖 Agents: ${health.agents?.length || 0} available`);
      console.log(`🔄 Handoffs: ${health.handoffs?.length || 0} configured`);
      
      if (health.agents) {
        console.log('📋 Agent Details:');
        health.agents.forEach(agent => {
          console.log(`   ✅ ${agent.name}: ${agent.status}`);
        });
      }
      
      if (health.handoffs) {
        console.log('🔗 Handoff Details:');
        health.handoffs.forEach(handoff => {
          console.log(`   ✅ ${handoff.from}To${handoff.to.charAt(0).toUpperCase() + handoff.to.slice(1)}: ${handoff.status}`);
        });
      }
    } else {
      throw new Error(`Health check failed: ${health.status}`);
    }
  } catch (error) {
    console.error('❌ Health Check: FAILED -', error.message);
    process.exit(1);
  }
  
  // Run Turkey campaign test
  const turkeyResult = await testTurkeyCampaign();
  
  // Final summary
  console.log('\n📊 === FINAL TEST SUMMARY ===');
  console.log(`📅 Completed at: ${new Date().toISOString()}`);
  console.log('✅ Health Check: PASSED');
  console.log(`${turkeyResult.success ? '✅' : '❌'} Turkey Campaign: ${turkeyResult.success ? 'PASSED' : 'FAILED'}`);
  
  if (turkeyResult.success) {
    console.log('🇹🇷 Turkey-specific content successfully generated!');
    console.log(`🎯 Keywords found: ${turkeyResult.foundKeywords?.join(', ')}`);
  } else {
    console.log('❌ Turkey campaign test failed');
    if (turkeyResult.error) {
      console.log(`❌ Error: ${turkeyResult.error}`);
    }
  }
  
  console.log(`${turkeyResult.success ? '✅' : '❌'} OVERALL RESULT: ${turkeyResult.success ? 'PASSED' : 'FAILED'}`);
}

runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 