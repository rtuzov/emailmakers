import { NextRequest, NextResponse } from 'next/server';
import { aiQualityConsultant, aiQualityConsultantSchema } from '@/agent/tools/ai-quality-consultant';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 AI Quality Consultant API endpoint called');
    
    const body = await request.json();
    console.log('📋 Request body received:', {
      topic: body.topic,
      campaign_type: body.campaign_type,
      html_length: body.html_content?.length || 0
    });
    
    // Validate request using Zod schema
    const validatedParams = aiQualityConsultantSchema.parse(body);
    console.log('✅ Request validation passed');
    
    // Call AI Quality Consultant
    console.log('🤖 Calling AI Quality Consultant...');
    const result = await aiQualityConsultant(validatedParams);
    
    console.log('✅ AI Quality Consultant completed successfully');
    console.log('📊 Result summary:', {
      success: result.success,
      quality_gate_passed: result.quality_gate_passed,
      recommendations_count: result.recommendations?.length || 0,
      overall_score: result.score
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'AI Quality Consultant executed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ AI Quality Consultant API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI Quality Consultant execution failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    tool: 'ai_quality_consultant',
    description: 'T11: AI Quality Consultant - Intelligent email quality analysis with automated improvement recommendations',
    version: '1.0.0',
    status: 'active',
    schema: {
      required: ['html_content', 'topic'],
      optional: ['mjml_source', 'target_audience', 'campaign_type', 'assets_used', 'prices', 'content_metadata', 'render_test_results', 'config_overrides'],
      example: {
        html_content: '<!DOCTYPE html>...',
        topic: 'Email campaign topic',
        campaign_type: 'promotional'
      }
    }
  });
} 