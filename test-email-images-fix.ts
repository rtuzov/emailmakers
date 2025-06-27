import { EmailGeneratorAgent } from './src/agent/agent';

async function testEmailImagesFix() {
  console.log('🧪 Testing Email Images Fix...');
  
  const agent = new EmailGeneratorAgent(true, 'quality');
  
  const testRequest = {
    topic: 'Специальные предложения в Париж',
    content_brief: 'Создай рекламное письмо о скидках на билеты в Париж. Добавь зайца-талисмана и красивое изображение города.',
    origin: 'LED',
    destination: 'CDG',
    target_audience: 'travelers',
    campaign_type: 'promotional' as const,
    tone: 'friendly',
    language: 'ru',
    brand: 'Kupibilet'
  };
  
  try {
    console.log('🚀 Generating email with image fixes...');
    const result = await agent.generateEmail(testRequest);
    
    console.log('✅ Email generation result:', {
      status: result.status,
      hasHtmlUrl: !!result.html_url,
      campaignId: result.campaign_metadata?.campaign_id,
      hasImages: result.status === 'success' ? 'Check HTML file' : 'N/A'
    });
    
    if (result.status === 'success') {
      console.log('🎯 Generated email successfully!');
      console.log('📧 HTML URL:', result.html_url);
      console.log('📊 Generation time:', result.generation_time);
      console.log('🔍 Check the HTML file for:');
      console.log('  - Working logo in header');
      console.log('  - Hero image from Figma assets');
      console.log('  - Rabbit component if promotional');
    } else {
      console.error('❌ Email generation failed:', result.error_message);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testEmailImagesFix().catch(console.error); 