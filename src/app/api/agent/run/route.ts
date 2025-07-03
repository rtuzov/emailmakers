import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

/**
 * POST /api/agent/run
 * Run the Email Generator Agent
 * ACTIVATED - Real agent execution for Paris campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 Real Agent run request:', body);

    // Support both old format (topic, destination, origin) and new format (briefText, tone, language)
    let topic: string;
    let destination: string | undefined;
    let origin: string | undefined;

    if (body.briefText) {
      // New format - convert briefText to topic
      topic = body.briefText;
      destination = body.destination || 'Париж'; // Default for Paris travel
      origin = body.origin || 'Москва'; // Default origin
    } else {
      // Old format - validate required parameters
      const { topic: oldTopic, destination: oldDestination, origin: oldOrigin } = body;
      if (!oldTopic || !oldDestination || !oldOrigin) {
        return NextResponse.json({
          status: 'error',
          error_message: 'Missing required parameters: either briefText OR (topic, destination, origin)',
          generation_time: 0
        }, { status: 400 });
      }
      topic = oldTopic;
      destination = oldDestination;
      origin = oldOrigin;
    }

    // Run the real agent
    const startTime = Date.now();
    const result = await runAgent({
      topic,
      destination,
      origin,
      options: {
        use_real_apis: true,
        mock_mode: false,
        use_ultrathink: true,
        ultrathink_mode: 'debug'
      }
    });
    const generationTime = Date.now() - startTime;

    if (!result.success) {
      return NextResponse.json({
        status: 'error',
        error_message: result.error || 'Agent execution failed',
        generation_time: generationTime
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      data: result.data,
      metadata: {
        ...result.data.metadata,
        generation_time: generationTime,
        mode: 'real_agent',
        apis_used: result.apis_used || []
      }
    });

  } catch (error) {
    console.error('❌ Real Agent run error:', error);
    return NextResponse.json({
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      generation_time: 0,
      note: 'Real agent execution failed'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Kupibilet Email Generator Agent API',
    version: '1.0.0',
    mode: 'REAL_AGENT_ACTIVE',
    endpoints: {
      'POST /api/agent/run': 'Generate email from topic (Real Agent)',
    }
  });
} 