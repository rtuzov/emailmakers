import { NextRequest, NextResponse } from 'next/server';
import { getFigmaAssets } from '@/agent/tools/figma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { tags, context } = body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'Tags array is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Testing Figma variants with auto-splitting');
    console.log(`📋 Tags: ${tags.join(', ')}`);
    console.log(`🎨 Context:`, context);

    // Включаем автоматическое разделение вариантов
    const enhancedContext = {
      ...context,
      auto_split_variants: true,
      preferred_variant: context?.preferred_variant || 'auto'
    };

    const result = await getFigmaAssets({
      tags,
      context: enhancedContext
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get Figma assets' },
        { status: 500 }
      );
    }

    // Анализируем результаты
    const assets = result.data.paths || [];
    const metadata = result.data.metadata || {};
    
    const variantInfo = Object.entries(metadata).map(([key, value]) => ({
      filename: key,
      path: value.path,
      hasVariants: value.metadata?.variantInfo ? true : false,
      variantDetails: value.metadata?.variantInfo || null,
      score: value.metadata?.score,
      category: value.metadata?.category,
      emotionalTone: value.metadata?.emotionalTone,
      selectionReason: value.metadata?.selectionReason
    }));

    const response = {
      success: true,
      assets: assets,
      totalAssets: assets.length,
      variantInfo: variantInfo,
      assetsWithVariants: variantInfo.filter(item => item.hasVariants).length,
      selectionStrategy: result.data.selection_strategy,
      metadata: {
        timestamp: new Date().toISOString(),
        tags: tags,
        context: enhancedContext
      }
    };

    console.log(`✅ Processed ${assets.length} assets, ${response.assetsWithVariants} with variants`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in figma-variants API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 