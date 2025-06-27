import { NextRequest, NextResponse } from 'next/server';
import { getFigmaAssets } from '../../../../../agent/tools/figma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Figma API request:', body);

    const result = await getFigmaAssets(body);
    
    console.log('✅ Figma API response:', {
      success: result.success,
      paths: result.data?.paths?.length || 0,
      metadata: Object.keys(result.data?.metadata || {}).length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Figma API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
} 