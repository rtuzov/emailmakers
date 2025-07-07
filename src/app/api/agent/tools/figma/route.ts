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

    // Call the AssetManager to search for Figma assets
    const { AssetManager } = await import('@/agent/core/asset-manager');
    const assetManager = new AssetManager();
    const result = await assetManager.searchAssets({
      tags,
      emotional_tone: context.emotional_tone || 'positive',
      campaign_type: context.campaign_type || 'promotional',
      target_count: max_results
    }, context);
    
    console.log('✅ Figma API response:', {
      success: result.success,
      assets_count: result.assets?.length || 0,
      message: (result as any).message || 'Assets search completed'
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