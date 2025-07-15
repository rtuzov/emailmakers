// Test Asset Tag Planner specifically
async function testAssetTagPlannerAPI() {
  console.log('🏷️ Testing Asset Tag Planner API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_type: "generate_content",
        input: {
          brief: "Создай промо-кампанию для летних путешествий в Японию с сакурой. Используй asset_tag_planner для планирования ассетов.",
          destination: "test-outputs",
          campaign_type: "promotional"
        }
      })
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Asset Tag Planner API Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAssetTagPlannerAPI(); 