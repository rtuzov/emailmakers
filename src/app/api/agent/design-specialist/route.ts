// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { cors } from '@/lib/cors';
import { DesignSpecialistAgentV2, DesignSpecialistInputV2 } from '@/agent/specialists/design-specialist-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      task_type = 'render_email',
      content_package,
      asset_requirements,
      rendering_requirements,
      handoff_data,
      campaign_context
    } = body;

    console.log('🎨 DesignSpecialist API called (OpenAI Agent SDK):', { 
      task_type, 
      hasContentPackage: !!content_package,
      hasAssetRequirements: !!asset_requirements,
      hasRenderingRequirements: !!rendering_requirements
    });

    // Prepare input for the design specialist agent
    const agentInput: DesignSpecialistInputV2 = {
      task_type,
      content_package: content_package || {
        content: {
          subject: 'Default Subject',
          body: 'Default email content',
          cta: 'Default CTA',
          preheader: 'Default preheader'
        },
        metadata: {
          language: 'ru',
          tone: 'friendly',
          word_count: 50,
          reading_time: 15
        },
        brand_guidelines: {
          voice_tone: 'дружелюбный',
          key_messages: ['Качественный сервис'],
          compliance_notes: ['Стандартные требования']
        }
      },
      rendering_requirements,
      asset_requirements,
      campaign_context: campaign_context || {
        campaign_id: `campaign_${Date.now()}`,
        performance_session: `session_${Date.now()}`
      }
    };

    // Create and run the design specialist agent with OpenAI Agent SDK
    const agent = new DesignSpecialistAgentV2();
    const result = await agent.executeTask(agentInput);

    console.log('✅ DesignSpecialist agent completed:', {
      success: result.success,
      task_type: result.task_type,
      hasResults: !!result.results
    });

    return NextResponse.json({
      status: 'success',
      data: result,
      execution_time: result.analytics?.execution_time || 0,
      _meta: {
        agent: 'design-specialist-v2',
        task_type: result.task_type,
        success: result.success,
        sdk: 'openai-agents'
      }
    });

  } catch (error) {
    console.error('❌ DesignSpecialist API error:', error);
    
    return NextResponse.json({
      success: false,
      task_type: 'render_email',
      results: {},
      recommendations: {
        next_actions: ['Check error logs', 'Verify input parameters', 'Retry with different parameters']
      },
      analytics: {
        execution_time: 0,
        operations_performed: 0,
        confidence_score: 0,
        cache_hit_rate: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      _meta: {
        agent: 'design-specialist-v2',
        execution_time: 0,
        error_stack: error instanceof Error ? error.stack : undefined,
        sdk: 'openai-agents'
      }
    }, { status: 500 });
  }
}