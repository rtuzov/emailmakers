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

    // Импортируем функцию из основного модуля
    const { findAndSelectFigmaVariant } = await import('../../../../../agent/tools/figma');

    // Тестируем поиск и выбор варианта
    const result = await findAndSelectFigmaVariant(
      figmaToken,
      figmaProjectId,
      fileName,
      context
    );

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
      error: error.message
    });
  }
} 