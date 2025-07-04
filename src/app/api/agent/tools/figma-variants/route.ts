import { NextRequest, NextResponse } from 'next/server';

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

    console.log('🎯 Testing Figma variants (API temporarily disabled)');
    console.log(`📋 Tags: ${tags.join(', ')}`);
    console.log(`🎨 Context:`, context);

    // Temporary mock response to avoid build errors
    const response = {
      success: true,
      disabled: true,
      message: 'Figma variants API temporarily disabled during system fixes',
      assets: [],
      totalAssets: 0,
      variantInfo: [],
      assetsWithVariants: 0,
      metadata: {
        timestamp: new Date().toISOString(),
        tags: tags,
        context: context
      }
    };

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