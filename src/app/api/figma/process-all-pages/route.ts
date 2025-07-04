import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API: Обработка всех страниц Figma (temporarily disabled)');

    const body = await request.json();
    
    const { figmaUrl, outputDirectory, context } = body;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: 'figmaUrl is required' },
        { status: 400 }
      );
    }

    console.log('📋 Параметры обработки (mock):', {
      figmaUrl,
      outputDirectory: outputDirectory || 'auto-generated',
      context: context || 'default'
    });

    // Temporary mock response to avoid build errors
    const result = {
      success: true,
      disabled: true,
      message: 'Figma all pages processor temporarily disabled during system fixes',
      data: {
        summary: {
          totalPages: 0,
          totalAssets: 0,
          processedPages: 0,
          skippedPages: 0
        },
        pages: [],
        globalReport: {
          timestamp: new Date().toISOString(),
          disabled: true
        }
      }
    };

    console.log('✅ Mock response generated');

    return NextResponse.json(result);

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