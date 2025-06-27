const { contentCreate } = require('./src/agent/tools/simple/content-create.ts');

async function testContentCreate() {
  console.log('🧪 Testing content_create tool...');
  
  const params = {
    topic: 'Дешевые авиабилеты из Москвы в Сочи на выходные',
    content_type: 'email',
    tone: 'friendly',
    language: 'ru',
    target_audience: 'молодые путешественники',
    urgency_level: 'medium',
    include_personalization: true,
    include_cta: true,
    content_length: 'medium',
    generation_quality: 'quality'
  };

  try {
    const result = await contentCreate(params);
    console.log('✅ Content Create Result:', JSON.stringify(result, null, 2));
    
    console.log('\n🔍 Result Analysis:');
    console.log('- Success:', result.success);
    console.log('- Has content_data:', !!result.content_data);
    console.log('- Content_data keys:', Object.keys(result.content_data || {}));
    console.log('- Has complete_content:', !!result.content_data?.complete_content);
    
  } catch (error) {
    console.error('❌ Content Create Error:', error);
  }
}

testContentCreate(); 