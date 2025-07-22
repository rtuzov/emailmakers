import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, context } = body;

    console.log(`🧪 Тестируем Figma variant selection для: ${fileName}`);
    console.log(`🎨 Контекст:`, context);

    // Проверяем переменные окружения
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
    const figmaProjectId = process.env.FIGMA_PROJECT_ID;

    if (!figmaToken) {
      return NextResponse.json({
        success: false,
        error: 'FIGMA_ACCESS_TOKEN или FIGMA_TOKEN не настроен'
      });
    }

    if (!figmaProjectId) {
      return NextResponse.json({
        success: false,
        error: 'FIGMA_PROJECT_ID не настроен'
      });
    }

    console.log(`✅ Figma токен найден: ${figmaToken.substring(0, 20)}...`);
    console.log(`✅ Figma проект ID: ${figmaProjectId}`);

    // Mock variant selection to avoid build errors
    const result = {
      success: true,
      variant_found: true,
      selected_variant: {
        id: 'mock-variant-id',
        name: `Mock variant for ${fileName}`,
        url: 'https://mock-figma-url.com/variant.png',
        metadata: {
          width: 400,
          height: 300,
          format: 'PNG'
        }
      },
      context_match_score: 0.85,
      _meta: {
        mock: true,
        message: 'Mock response - figma tools disabled to prevent build errors'
      }
    };

    if (result) {
      console.log(`✅ Найден и выбран вариант:`, result);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      console.log(`⚠️ Варианты не найдены для ${fileName}`);
      
      return NextResponse.json({
        success: false,
        message: `Варианты не найдены для ${fileName}`
      });
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования Figma variants:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 