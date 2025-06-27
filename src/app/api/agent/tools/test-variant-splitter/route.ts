import { NextRequest, NextResponse } from 'next/server';
import { splitFigmaVariants } from '@/agent/tools/figma-variant-splitter';
import * as path from 'path';

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

    // Строим полный путь к файлу
    const fullPath = path.resolve(process.cwd(), assetPath);
    
    const result = await splitFigmaVariants({
      assetPath: fullPath,
      context: context || {}
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to split variants' },
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