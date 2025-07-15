// Simple API test for figma_asset_selector fix
async function testSimpleAPI() {
  console.log('🌐 Testing Simple API Call...');
  
  try {
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brief: "Летние путешествия с зайцами",
        destination: "test-outputs",
        agent_type: "content"
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📊 Response body length:', responseText.length);
    console.log('📊 Response body preview:', responseText.substring(0, 500) + '...');

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return false;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('✅ API Response parsed:', {
        success: result.success,
        message: result.message,
        hasData: !!result.data,
        hasErrors: !!result.errors
      });

      if (result.errors && result.errors.length > 0) {
        console.log('❌ API Errors:');
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
        return false;
      }

      return true;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      return false;
    }
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    return false;
  }
}

testSimpleAPI().catch(console.error); 