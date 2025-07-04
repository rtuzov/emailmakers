const fetch = require('node-fetch');

async function testAgent() {
  console.log('🧪 Testing agent API...');
  
  const payload = {
    briefText: "путешествие во францию осенью",
    destination: "Париж", 
    origin: "Москва",
    tone: "professional",
    language: "ru"
  };
  
  try {
    console.log('📤 Sending request:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('http://localhost:3000/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('📥 Response body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('📥 Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testAgent(); 