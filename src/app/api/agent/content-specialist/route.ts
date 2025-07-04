import { NextRequest, NextResponse } from 'next/server';
import { ContentSpecialistAgent, ContentSpecialistInput } from '@/agent/specialists/content-specialist-agent';

// @ts-nocheck

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      task_type = 'generate_content',
      topic,
      content_type = 'complete_campaign',
      tone = 'friendly',
      language = 'ru',
      target_audience = 'general',
      origin,
      destination,
      campaign_context
    } = body;

    console.log('🧠 ContentSpecialist API called (OpenAI Agent SDK):', { 
      task_type, 
      topic, 
      content_type, 
      tone, 
      language,
      hasOriginDestination: !!(origin && destination)
    });

    // Prepare input for the content specialist agent
    const agentInput: ContentSpecialistInput = {
      task_type,
      campaign_brief: {
        topic: topic || 'Travel Campaign',
        campaign_type: content_type,
        target_audience,
        origin,
        destination
      },
      context_requirements: {
        include_seasonal: true,
        include_cultural: language === 'ru',
        include_marketing: true,
        include_travel: !!(origin || destination)
      },
      pricing_requirements: (origin && destination) ? {
        origin: origin,
        destination: destination,
        analysis_depth: 'basic' as const
      } : undefined,
      content_requirements: {
        content_type: content_type === 'subject_only' ? 'subject_line' : 'email',
        tone,
        language,
        generate_variants: false
      }
    };

    // Create and run the content specialist agent with OpenAI Agent SDK
    const agent = new ContentSpecialistAgent();
    const result = await agent.executeTask(agentInput);

    console.log('✅ ContentSpecialist agent completed:', {
      success: result.success,
      task_type: result.task_type,
      hasResults: !!result.results
    });

    return NextResponse.json({
      status: 'success',
      data: result,
      execution_time: result.analytics?.execution_time || 0,
      _meta: {
        agent: 'content-specialist',
        task_type: result.task_type,
        success: result.success,
        sdk: 'openai-agents'
      }
    });

  } catch (error) {
    console.error('❌ ContentSpecialist API error:', error);
    
    return NextResponse.json({
      success: false,
      task_type: 'generate_content',
      results: {},
      recommendations: {
        next_actions: ['Check error logs', 'Verify input parameters', 'Retry with different parameters']
      },
      analytics: {
        execution_time: 0,
        operations_performed: 0,
        confidence_score: 0,
        agent_efficiency: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      _meta: {
        agent: 'content-specialist',
        execution_time: 0,
        error_stack: error instanceof Error ? error.stack : undefined,
        sdk: 'openai-agents'
      }
    }, { status: 500 });
  }
}