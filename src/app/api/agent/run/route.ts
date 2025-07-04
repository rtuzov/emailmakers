import { NextRequest, NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

/**
 * POST /api/agent/run
 * Run the Email Generator Agent
 * ACTIVATED - Real agent execution for Paris campaign
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 [Agent API] Starting agent execution...');
    
    const body = await request.json();
    console.log('📝 [Agent API] Input data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.topic) {
      const error = {
          status: 'error',
        error_type: 'validation_error',
        error_message: 'Missing required field: topic',
        timestamp: new Date().toISOString(),
        generation_time: Date.now() - startTime
      };
      console.error('❌ [Agent API] Validation failed:', error);
      return NextResponse.json(error, { status: 400 });
      }

    // Support both old and new request formats
    const agentInput = {
      topic: body.topic,
      destination: body.destination || 'Paris',
      origin: body.origin || 'Moscow',
      content_requirements: body.content_requirements,
      design_preferences: body.design_preferences,
      campaign_goals: body.campaign_goals,
      target_audience: body.target_audience,
      brand_voice: body.brand_voice,
      request_id: body.request_id || `req_${Date.now()}`
    };

    console.log('🎯 [Agent API] Processed input:', JSON.stringify(agentInput, null, 2));

    // Run the agent with detailed error handling
    console.log('⚡ [Agent API] Executing runAgent...');
    const result = await runAgent(agentInput);
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ [Agent API] Agent completed successfully in ${generationTime}ms`);
    console.log('📄 [Agent API] Result:', JSON.stringify(result, null, 2));

    return NextResponse.json({
      status: 'success',
      result,
          generation_time: generationTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const generationTime = Date.now() - startTime;
    
    // Detailed error logging for debugging
    console.error('💥 [Agent API] CRITICAL ERROR OCCURRED:');
    console.error('📍 Error Type:', error.constructor.name);
    console.error('💬 Error Message:', error.message);
    console.error('📚 Full Error Object:', error);
    
    if (error.stack) {
      console.error('📋 Stack Trace:');
      console.error(error.stack);
    }

    // Additional debugging info for specific error types
    if (error.name === 'TypeError' && error.message.includes('getAllTools')) {
      console.error('🔧 [Debug] Agent tools configuration issue detected');
      console.error('🔧 [Debug] This suggests tools are not properly configured with tool() wrapper');
    }

    if (error.message.includes('API')) {
      console.error('🔑 [Debug] API configuration issue detected');
      console.error('🔑 [Debug] Check environment variables: OPENAI_API_KEY');
    }

    // Enhanced error response with full debugging information
    const errorResponse = {
      status: 'error',
      error_type: error.constructor.name,
      error_message: error.message,
      error_details: {
        name: error.name,
        stack: error.stack,
        cause: error.cause,
        code: error.code
      },
        generation_time: generationTime,
      timestamp: new Date().toISOString(),
      debugging_info: {
        agent_execution_failed: true,
        execution_stopped_immediately: true,
        check_server_logs: true
      }
    };

    console.error('📤 [Agent API] Sending error response:', JSON.stringify(errorResponse, null, 2));

    // Return error immediately - no retries, no fallbacks
    return NextResponse.json(errorResponse, { status: 500 });
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