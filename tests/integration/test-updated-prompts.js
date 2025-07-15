/**
 * Test script to verify updated prompts with getCurrentDate() function
 */

const { EmailMakersAgent } = require('./src/agent/main-agent');

// Test function to simulate getCurrentDate() functionality
function getCurrentDate() {
  const now = new Date();
  return {
    current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
    current_datetime: now.toISOString(),
    current_year: now.getFullYear(),
    current_month: now.getMonth() + 1,
    current_day: now.getDate(),
    formatted_date: now.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }),
    weekday: now.toLocaleDateString('ru-RU', { weekday: 'long' })
  };
}

async function testUpdatedPrompts() {
  console.log('🧪 Testing updated prompts with getCurrentDate() function...');
  
  // Test current date functionality
  const currentDate = getCurrentDate();
  console.log('📅 Current date info:', currentDate);
  
  // Test campaign with current date context
  const testInput = {
    task_type: 'campaign_creation',
    campaign_name: 'Тест актуальной даты',
    brand_name: 'Kupibilet',
    campaign_type: 'travel',
    target_audience: 'travel_enthusiasts',
    campaign_goals: ['engagement', 'conversion'],
    destination: 'Стамбул',
    context: {
      current_date: currentDate.current_date,
      current_year: currentDate.current_year,
      current_month: currentDate.current_month,
      formatted_date: currentDate.formatted_date
    }
  };
  
  console.log('🎯 Test input:', JSON.stringify(testInput, null, 2));
  
  try {
    const agent = new EmailMakersAgent();
    console.log('🚀 Starting agent with updated prompts...');
    
    const result = await agent.run(testInput);
    
    console.log('✅ Agent completed successfully!');
    console.log('📊 Result preview:', result.substring(0, 500) + '...');
    
    // Check if result contains current year (should be 2025 or later)
    const currentYear = new Date().getFullYear();
    if (result.includes(currentYear.toString())) {
      console.log(`✅ Result contains current year ${currentYear}`);
    } else {
      console.log(`⚠️  Result may not contain current year ${currentYear}`);
    }
    
    // Check if result contains future dates
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    if (result.includes(futureDateStr.substring(0, 7))) { // Check year-month
      console.log(`✅ Result contains future dates (${futureDateStr.substring(0, 7)})`);
    } else {
      console.log(`⚠️  Result may not contain future dates`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testUpdatedPrompts();
}

module.exports = { testUpdatedPrompts, getCurrentDate }; 