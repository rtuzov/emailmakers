/**
 * Test Orchestrator functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { Agent, run } from '@openai/agents';
import { generateTraceId } from '../../../agent/utils/tracing-utils';
import { createEmailCampaignOrchestrator } from '../../../agent/specialists/specialist-agents';

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    const body = await request.json();
    const { input } = body;

    console.log('🧪 Testing Orchestrator creation...');

    // Create orchestrator system
    const orchestratorSystem = await createEmailCampaignOrchestrator();
    
    console.log('✅ Orchestrator system created');
    console.log('Available agents:', Object.keys(orchestratorSystem));

    // Test orchestrator with simple input and timeout
    const testPromise = run(orchestratorSystem.orchestrator, input || 'Create a simple test email for airline tickets', {
      maxTurns: 3,
      context: { traceId }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Orchestrator test timeout after 30 seconds')), 30000);
    });

    const result = await Promise.race([testPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      result: result,
      availableAgents: Object.keys(orchestratorSystem),
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ Orchestrator test failed:', errorMessage);

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