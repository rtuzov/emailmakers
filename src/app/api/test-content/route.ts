/**
 * Test Content Specialist directly
 */

import { NextRequest, NextResponse } from 'next/server';
import { run } from '@openai/agents';
import { generateTraceId } from '../../../agent/utils/tracing-utils';
import { createSpecialistAgents } from '../../../agent/specialists/specialist-agents';

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    const body = await request.json();
    const { input } = body;

    console.log('🧪 Testing Content Specialist directly...');

    // Create specialists and get content specialist
    const specialists = await createSpecialistAgents();
    const contentSpecialist = specialists.contentSpecialist;
    
    console.log('✅ Content Specialist created');

    // Test with timeout
    const testPromise = run(contentSpecialist, input || 'Create email content for airline tickets to Saint Petersburg for 3000 rubles', {
      maxTurns: 5,
      context: { traceId }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Content Specialist test timeout after 30 seconds')), 30000);
    });

    const result = await Promise.race([testPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      result: result,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ Content Specialist test failed:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        traceId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 