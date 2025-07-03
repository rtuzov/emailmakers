import { NextRequest, NextResponse } from 'next/server';
import { DesignSpecialistAgentV2 } from '../../../../agent/specialists/design-specialist-agent-v2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      task_type = 'render_email',
      content_package,
      asset_requirements,
      rendering_requirements,
      handoff_data
    } = body;

    console.log('🎨 DesignSpecialist API called:', { task_type, hasContentPackage: !!content_package });

    const designSpecialist = new DesignSpecialistAgentV2();
    
    // Default content package if not provided
    const defaultContentPackage = {
      content: {
        subject: 'Тестовое письмо от DesignSpecialist',
        preheader: 'Тестовый preheader',
        body: 'Это тестовое содержимое письма для проверки работы DesignSpecialist агента. Здесь должен быть полный текст письма с описанием предложения.',
        cta: 'Забронировать',
        language: 'ru',
        tone: 'friendly'
      },
      design_requirements: {
        tone: 'friendly',
        style: 'modern',
        color_scheme: 'kupibilet_brand',
        imagery_focus: 'travel',
        layout_priority: 'mobile_first'
      },
      brand_guidelines: {
        brand_voice: 'friendly',
        visual_style: 'modern',
        color_palette: ['#2B5CE6', '#FF6B6B'],
        typography: 'Arial, sans-serif'
      }
    };
    
    const input = {
      task_type: task_type as any,
      content_package: content_package || defaultContentPackage,
      asset_requirements: asset_requirements || {
        tags: ['авиабилеты', 'путешествия'],
        emotional_tone: 'positive' as const,
        campaign_type: 'promotional' as const,
        target_count: 2
      },
      rendering_requirements: rendering_requirements || {
        output_format: 'html' as const,
        template_type: 'promotional' as const,
        email_client_optimization: 'universal' as const,
        responsive_design: true
      },
      handoff_data: handoff_data
    };

    const startTime = Date.now();
    const result = await designSpecialist.executeTask(input);
    const executionTime = Date.now() - startTime;

    console.log('✅ DesignSpecialist result:', {
      success: result.success,
      task_type: result.task_type,
      hasRenderedEmail: !!(result.results as any).rendered_email,
      hasDesignArtifacts: !!(result as any).design_artifacts,
      executionTime
    });

    return NextResponse.json({
      status: 'success',
      data: {
        agent: 'design-specialist',
        task_type: result.task_type,
        success: result.success,
        results: result.results,
        design_artifacts: (result as any).design_artifacts,
        handoff_data: (result.recommendations as any).handoff_data,
        analytics: result.analytics,
        execution_time: executionTime,
        capabilities: designSpecialist.getCapabilities()
      }
    });

  } catch (error) {
    console.error('❌ DesignSpecialist API error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 