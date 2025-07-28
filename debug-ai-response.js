console.log('🧪 Testing OpenAI API without key...');

const testContent = {
  generated_content: {
    subject: "🏔️ Гималаи от 17,932₽! Спешите, предложение до 20 октября!",
    body: "Представьте себе: живописные горные пейзажи, яркие культуры и незабываемые приключения. Осень в Гималаях — это идеальное время для вдохновляющего путешествия."
  },
  campaign_type: "promotional",
  target_audience: "travelers"
};

async function testAICall() {
  const imageAnalysisPrompt = `
Based on this campaign analysis, determine what types of images would be most appropriate.

Campaign Context:
- Subject: ${testContent.generated_content.subject}
- Body: ${testContent.generated_content.body}
- Campaign Type: ${testContent.campaign_type}
- Target Audience: ${testContent.target_audience}

Analyze the content and suggest 3-5 DESTINATION-SPECIFIC search terms for finding appropriate images.

Return JSON format:
{
  "search_terms": [
    {
      "query": "highly specific english search term for destination landmarks/culture",
      "purpose": "hero|support|decoration|branding",
      "description": "What this specific landmark/cultural element represents"
    }
  ],
  "campaign_theme": "Specific destination and cultural theme",
  "emotional_tone": "Target emotional response"
}
`;

  try {
    console.log('📝 Prompt being sent to AI:');
    console.log('---START---');
    console.log(imageAnalysisPrompt);
    console.log('---END---');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'invalid-key'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing campaign content and determining appropriate visual themes. Provide search terms in English for international image databases.'
          },
          {
            role: 'user',
            content: imageAnalysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    console.log(`🔍 Response status: ${response.status}`);
    console.log(`🔍 Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    const text = await response.text();
    console.log(`🔍 Response body: ${text}`);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log(`✅ AI Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      console.log(`❌ AI Error: ${text}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAICall(); 