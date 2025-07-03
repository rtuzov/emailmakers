import { NextRequest, NextResponse } from 'next/server';
import { ContentSpecialistAgent } from '../../../../agent/specialists/content-specialist-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      task_type = 'generate_content',
      campaign_brief,
      content_requirements,
      pricing_requirements,
      context_requirements,
      // Legacy parameters for backward compatibility
      topic,
      content_type = 'complete_campaign',
      tone = 'friendly',
      language = 'ru',
      target_audience = 'general',
      origin,
      destination
    } = body;

    console.log('🧠 ContentSpecialist API called:', { 
      task_type, 
      topic, 
      content_type, 
      tone, 
      language,
      hasPricingRequirements: !!pricing_requirements,
      pricingRequirements: pricing_requirements,
      hasOriginDestination: !!(origin && destination)
    });

    const contentSpecialist = new ContentSpecialistAgent();
    
    const input = {
      task_type: task_type as 'analyze_context' | 'get_pricing' | 'generate_content' | 'manage_campaign',
      campaign_brief: campaign_brief || {
        topic: topic || 'авиабилеты специальное предложение',
        campaign_type: 'promotional' as const,
        target_audience: target_audience,
        origin: origin,
        destination: destination
      },
      content_requirements: content_requirements || {
        content_type: content_type as 'complete_campaign',
        tone: tone as 'friendly',
        language: language as 'ru',
        generate_variants: false
      },
      context_requirements: context_requirements || {
        include_seasonal: true,
        include_cultural: true,
        include_marketing: true,
        include_travel: true
      },
      pricing_requirements: pricing_requirements || (origin && destination ? {
        origin,
        destination,
        analysis_depth: 'advanced' as const
      } : undefined)
    };

    const startTime = Date.now();
    const result = await contentSpecialist.executeTask(input);
    const executionTime = Date.now() - startTime;

    console.log('✅ ContentSpecialist result:', {
      success: result.success,
      task_type: result.task_type,
      hasContentData: !!result.results.content_data,
      hasHandoffData: !!result.recommendations.handoff_data,
      executionTime
    });

    // Возвращаем прямую структуру агента для валидации
    return NextResponse.json({
      success: result.success,
      task_type: result.task_type,
      results: result.results,
      recommendations: result.recommendations,
      analytics: result.analytics,
      error: result.error,
      // Дополнительные метаданные для отладки
      _meta: {
        agent: 'content-specialist',
        execution_time: executionTime,
        capabilities: contentSpecialist.getCapabilities()
      }
    });

  } catch (error) {
    console.error('❌ ContentSpecialist API error:', error);
    
    // Возвращаем структуру агента с ошибкой
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
        error_stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 