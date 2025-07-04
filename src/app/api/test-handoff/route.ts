import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // const { testHandoffs } = await import('../../../agent/test-handoff');
    
    // Stub implementation
    async function testHandoffs(message: string) {
      return { success: false, error: 'testHandoffs not implemented' };
    }
    const result = await testHandoffs(message);

    return NextResponse.json({
      status: 'success',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test handoff API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 