import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test Simple: Starting basic test');
    
    const body = await request.json();
    const { test_type = 'content' } = body;
    
    if (test_type === 'content') {
      // Тест простого content generator
      const { simpleContentGenerator } = await import('../../../agent/tools/simple-content-generator');
      
      const result = await simpleContentGenerator({
        topic: 'Испания летом',
        action: 'generate',
        language: 'ru',
        tone: 'friendly',
        include_analytics: true
      });
      
      console.log('✅ Simple content generator test completed');
      
      return NextResponse.json({
        success: true,
        test_type: 'content',
        result: JSON.parse(result)
      });
    }
    
    if (test_type === 'pricing') {
      // Тест простого pricing tool
      const { simplePricing } = await import('../../../agent/tools/simple-pricing');
      
      const result = await simplePricing({
        origin: 'MOW',
        destination: 'BCN',
        date_range: '2025-08-01,2025-08-15'
      });
      
      console.log('✅ Simple pricing test completed');
      
      return NextResponse.json({
        success: true,
        test_type: 'pricing',
        result: JSON.parse(result)
      });
    }
    
    if (test_type === 'agent') {
      // Тест создания простого агента
      const { Agent } = await import('@openai/agents');
      
      const testAgent = new Agent({
        name: 'Test Agent',
        instructions: 'Ты простой тестовый агент. Отвечай кратко и по делу.'
      });
      
      console.log('✅ Simple agent creation test completed');
      
      return NextResponse.json({
        success: true,
        test_type: 'agent',
        result: {
          agent_created: true,
          agent_name: testAgent.name
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: `Unknown test_type: ${test_type}. Available: content, pricing, agent`
    });
    
  } catch (error) {
    console.error('❌ Test Simple error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 