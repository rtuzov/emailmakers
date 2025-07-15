// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { cors } from '@/lib/cors';
import { designSpecialistAgent as EnhancedDesignSpecialistAgent } from '@/agent/core/tool-registry';

// Type for Design Specialist Input
interface DesignSpecialistInputV2 {
  task_type: string;
  content_package?: any;
  rendering_requirements?: any;
  asset_requirements?: any;
  campaign_context?: any;
  multi_destination_requirements?: any;
}

// Helper function to build prompt from input
function buildDesignPrompt(input: any): string {
  const task = input.task_type || 'render_email';
  
  switch (task) {
    case 'find_assets':
      return `Find optimal Figma assets for campaign. Use the figma_asset_selector tool with search tags based on the content.`;
      
    case 'render_email':
      return `Create HTML email template using MJML. Content: ${JSON.stringify(input.content_package?.content || {})}. Use email_renderer tool for template generation and mjml_compiler for final HTML.`;
      
    case 'optimize_design':
      return `Optimize email design for responsiveness and accessibility. Use design_optimization tool for improvements.`;
      
    case 'select_multi_destination_template':
      return `Select optimal template for multi-destination campaign with ${input.multi_destination_requirements?.destinations?.length || 0} destinations. Use select_multi_destination_template tool.`;
      
    default:
      return `Design email template for campaign. Task: ${task}. Use appropriate design tools based on requirements: ${JSON.stringify(input.rendering_requirements || {})}`;
  }
}

// Helper function to parse agent result
function parseDesignAgentResult(result: any, originalInput: any): any {
  try {
    // Extract tool outputs from agent result
    const toolOutputs = result.output?.filter((item: any) => 
      item.rawItem?.type === 'tool_call_output'
    ) || [];
    
    console.log('🔧 Design Agent - Found tool outputs:', toolOutputs.length);
    
    let toolData = {};
    for (const output of toolOutputs) {
      try {
        const parsedOutput = JSON.parse(output.rawItem?.content || '{}');
        Object.assign(toolData, parsedOutput);
      } catch (e) {
        console.warn('⚠️ Failed to parse design tool output:', e);
      }
    }
    
    // Build design specialist result structure
    return {
      success: true,
      task_type: originalInput.task_type || 'render_email',
      results: {
        rendering: toolData.html_content ? {
          html_output: toolData.html_content,
          mjml_source: toolData.mjml_source || toolData.mjml_content,
          text_version: toolData.text_version
        } : undefined,
        assets: toolData.selected_assets || undefined,
        optimization: toolData.optimized_html ? {
          optimized_html: toolData.optimized_html,
          improvements: toolData.optimizations_applied || []
        } : undefined
      },
      design_artifacts: {
        html_output: toolData.html_content,
        mjml_source: toolData.mjml_source || toolData.mjml_content,
        assets_used: toolData.assets_used || [],
        performance_metrics: toolData.performance_metrics
      },
      recommendations: {
        next_actions: ['Review design quality', 'Test email clients', 'Validate accessibility']
      },
      analytics: {
        execution_time_ms: Date.now(),
        operations_performed: toolOutputs.length,
        confidence_score: 85,
        cache_hit_rate: 0
      },
      trace_id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_output: result.finalOutput || 'Design completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Failed to parse design agent result:', error);
    return {
      success: false,
      task_type: originalInput.task_type || 'render_email',
      results: {},
      recommendations: {
        next_actions: ['Check error logs', 'Verify input parameters', 'Retry with different parameters']
      },
      analytics: {
        execution_time_ms: 0,
        operations_performed: 0,
        confidence_score: 0,
        cache_hit_rate: 0
      },
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      trace_id: `design_error_${Date.now()}`
    };
  }
}

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
    const { run } = await import('@openai/agents');
    
    // Build prompt from input
    const prompt = buildDesignPrompt(agentInput);
    console.log('🎨 Design Specialist prompt:', prompt);
    
    const result = await run(EnhancedDesignSpecialistAgent, prompt);

    // Parse agent result
    const parsedResult = parseDesignAgentResult(result, agentInput);
    
    console.log('✅ DesignSpecialist agent completed:', {
      success: parsedResult.success,
      task_type: parsedResult.task_type,
      hasResults: !!parsedResult.results
    });

    return NextResponse.json({
      status: 'success',
      data: parsedResult,
      execution_time: parsedResult.analytics?.execution_time || 0,
      _meta: {
        agent: 'design-specialist-v2',
        task_type: parsedResult.task_type,
        success: parsedResult.success,
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