import { NextRequest, NextResponse } from 'next/server';
import { processAllFigmaPages } from '@/agent/tools/figma-all-pages-processor';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Запуск обработки всех страниц Figma');

    const body = await request.json();
    
    const { figmaUrl, outputDirectory, context } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'figmaUrl is required' },
        { status: 400 }
      );
    }

    console.log('📋 Параметры обработки:', {
      figmaUrl,
      outputDirectory: outputDirectory || 'auto-generated',
      context: context || 'default'
    });

    // Запускаем обработку всех страниц
    const result = await processAllFigmaPages({
      figmaUrl,
      outputDirectory,
      context
    });

    if (!result.success) {
      console.error('❌ Ошибка обработки:', result.error);
      return NextResponse.json(
        { error: result.error || 'Processing failed' },
        { status: 500 }
      );
    }

    console.log('✅ Обработка завершена успешно');
    console.log(`📊 Результат: ${result.data.summary.totalPages} страниц, ${result.data.summary.totalAssets} ассетов`);

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Успешно обработано ${result.data.summary.totalPages} страниц с ${result.data.summary.totalAssets} ассетами`
    });

  } catch (error) {
    console.error('💥 Критическая ошибка в API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'info') {
      return NextResponse.json({
        endpoint: '/api/figma/process-all-pages',
        description: 'Процессор для обработки всех страниц Figma файла',
        methods: {
          POST: {
            description: 'Запускает обработку всех страниц',
            parameters: {
              figmaUrl: 'string (required) - URL Figma файла',
              outputDirectory: 'string (optional) - Директория для результатов',
              context: {
                campaign_type: 'urgent | newsletter | seasonal | promotional | informational',
                content_theme: 'string - Тема контента',
                target_audience: 'string - Целевая аудитория', 
                brand_guidelines: 'string[] - Бренд-гайдлайны'
              }
            }
          },
          GET: {
            description: 'Получает информацию о API',
            parameters: {
              action: 'info - Получить информацию об API'
            }
          }
        },
        features: [
          'Автоматическое определение всех страниц в Figma файле',
          'Создание отдельной папки для каждой страницы',
          'Обработка компонентов и вариантов',
          'Генерация тегов с помощью GPT-4',
          'Оптимизация тегов и имен файлов',
          'Автоматическое сохранение словаря после каждого файла',
          'Генерация отчетов по страницам и общего отчета'
        ],
        example: {
          figmaUrl: 'https://www.figma.com/design/YOUR_FILE_ID/...',
          outputDirectory: './figma-output',
          context: {
            campaign_type: 'promotional',
            content_theme: 'авиабилеты и путешествия',
            target_audience: 'молодые путешественники',
            brand_guidelines: ['дружелюбный тон', 'яркие цвета']
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Figma All Pages Processor API',
      usage: 'POST с параметрами figmaUrl, outputDirectory, context',
      info: 'GET ?action=info для подробной информации'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get API info' },
      { status: 500 }
    );
  }
} 