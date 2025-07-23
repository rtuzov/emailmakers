/**
 * Test Orchestrator Handoff functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { /* Agent, */ run } from '@openai/agents';
import { generateTraceId } from '../../../agent/utils/tracing-utils';
import { createEmailCampaignOrchestrator } from '../../../agent/specialists/specialist-agents';

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    const body = await request.json();
    const { input } = body;

    console.log('🧪 Testing Orchestrator Handoff...');

    // Create orchestrator system
    const orchestratorSystem = await createEmailCampaignOrchestrator();
    
    console.log('✅ Orchestrator system created');

    // Test orchestrator with very simple input and low maxTurns
    const testPromise = run(orchestratorSystem.orchestrator, input || 'Create simple email for airline tickets', {
      maxTurns: 5,  // Increased to see what happens
      context: { traceId }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Orchestrator handoff test timeout after 30 seconds')), 30000);
    });

    const result = await Promise.race([testPromise, timeoutPromise]);

    return NextResponse.json({
      success: true,
      result: {
        finalOutput: (result as any).currentStep?.output || (result as any).lastModelResponse?.output?.[0]?.content?.[0]?.text || 'Handoff completed',
        currentAgent: (result as any).state?.currentAgent?.name || 'Unknown',
        turns: (result as any).state?.currentTurn || 0,
        toolsUsed: (result as any).toolUseTracker || {}
      },
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('❌ Orchestrator handoff test failed:', errorMessage);

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