import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Figma API called:', body);

    const {
      tags = [],
      context = {},
      require_diversity = true,
      max_results = 5
    } = body;

    // Call the figma tool implementation directly to avoid OpenAI Agent SDK issues
    const { getFigmaAssetsImpl } = await import('@/agent/tools/figma-impl');
    const result = await getFigmaAssetsImpl({
      tags,
      context: {
        campaign_type: context.campaign_type || 'promotional',
        emotional_tone: context.emotional_tone || 'positive',
        target_count: context.target_count || max_results,
        diversity_mode: require_diversity,
        ...context
      }
    });
    
    console.log('✅ Figma API response:', {
      success: result.success,
      paths: result.data?.paths?.length || 0,
      metadata: result.data?.metadata ? Object.keys(result.data.metadata).length : 0,
      selectionStrategy: result.data?.selection_strategy?.strategy_used
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Figma API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
} 