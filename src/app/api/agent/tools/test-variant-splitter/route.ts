import { NextRequest, NextResponse } from 'next/server';
// import * as path from 'path';

// @ts-nocheck

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { assetPath, context } = body;

    if (!assetPath) {
      return NextResponse.json(
        { error: 'assetPath is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing variant splitter directly');
    console.log(`📁 Asset path: ${assetPath}`);
    console.log(`🎨 Context:`, context);

    // Mock variant splitting to avoid build errors
    // const _fullPath = path.resolve(process.cwd(), assetPath);
    
    const result = {
      success: true,
      data: {
        variants: [
          {
            id: 'variant_1',
            name: 'Happy Bunny',
            path: 'mock/variant_1.png',
            confidence: 0.92
          },
          {
            id: 'variant_2', 
            name: 'Travel Bunny',
            path: 'mock/variant_2.png',
            confidence: 0.88
          },
          {
            id: 'variant_3',
            name: 'Adventure Bunny',
            path: 'mock/variant_3.png', 
            confidence: 0.85
          }
        ],
        selected_variant: {
          id: 'variant_1',
          name: 'Happy Bunny',
          path: 'mock/variant_1.png',
          confidence: 0.92
        },
        selection_reason: 'Highest emotional match for positive context',
        metadata: {
          extraction_method: 'mock_split',
          source_type: 'figma_sprite',
          processing_time: 450,
          total_variants_found: 3
        }
      },
      _meta: {
        mock: true,
        message: 'Mock response - variant splitter disabled to prevent build errors'
      }
    };

    if (!result.success) {
      return NextResponse.json(
        { error: ('error' in result ? result.error : null) || 'Failed to split variants' },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      variants: result.data.variants,
      selectedVariant: result.data.selected_variant,
      selectionReason: result.data.selection_reason,
      metadata: result.data.metadata,
      summary: {
        totalVariants: result.data.variants.length,
        extractionMethod: result.data.metadata.extraction_method,
        sourceType: result.data.metadata.source_type,
        hasSelectedVariant: !!result.data.selected_variant
      }
    };

    console.log(`✅ Variant splitting completed: ${result.data.variants.length} variants found`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in test-variant-splitter API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 