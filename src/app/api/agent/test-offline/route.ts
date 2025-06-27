import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Offline Agent Route
 * Tests the agent tools in offline mode without external API dependencies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 Test offline agent called with:', body);

    // A/B testing integration DISABLED
    // A/B testing has been temporarily disabled as requested
    let abTestingConfig = null;
    console.log('🚫 A/B testing is disabled - using default configuration');

    // COMMENTED OUT - Original A/B testing integration
    /*
    // Get A/B testing configuration if userId provided
    let abTestingConfig = null;
    if (body.userId) {
      try {
        const abResponse = await fetch(`http://localhost:3000/api/ab-testing?action=config&userId=${body.userId}`);
        const abData = await abResponse.json();
        if (abData.success) {
          abTestingConfig = abData.data;
          console.log('🧪 A/B Testing Config applied:', abTestingConfig);
        }
      } catch (abError) {
        console.warn('⚠️ A/B testing config failed, using defaults:', abError);
      }
    }
    */

    // Simulate the agent processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a successful response with mock HTML content
    const mockResponse = {
      status: 'success',
      data: {
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️ Москва ждет! Билеты от 7253 RUB</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .price { background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
        .cta { background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Москва ждет вас!</h1>
            <p>Откройте для себя столицу России по специальным ценам</p>
        </div>
        
        <div class="content">
            <h2>Мечтаете о поездке в сердце России?</h2>
            <p>Москва — это удивительный город, где история встречается с современностью! Специально для жителей Санкт-Петербурга мы подготовили лучшие предложения на авиабилеты.</p>
            
            <div class="price">
                <h3>✈️ Специальные цены на февраль 2025:</h3>
                <ul>
                    <li><strong>LED → MOW:</strong> от 7,253 ₽ (1 февраля)</li>
                    <li><strong>LED → MOW:</strong> от 8,150 ₽ (8 февраля)</li>
                    <li><strong>LED → MOW:</strong> от 7,890 ₽ (15 февраля)</li>
                </ul>
            </div>
            
            <h3>🎯 Что вас ждет в Москве:</h3>
            <ul>
                <li>🏛️ Красная площадь и Кремль</li>
                <li>🎭 Большой театр и Третьяковская галерея</li>
                <li>🍽️ Изысканная русская кухня</li>
                <li>🛍️ Торговые центры и бутики</li>
            </ul>
            
            <p>Не упустите возможность посетить столицу по выгодным ценам! Бронируйте билеты сейчас и получите гарантию лучшей цены.</p>
            
            <a href="https://kupibilet.ru" class="cta">Найти билеты →</a>
        </div>
        
        <div class="footer">
            <p>С уважением, команда Kupibilet<br>
            Ваши надежные помощники в путешествиях</p>
        </div>
    </div>
</body>
</html>`,
        subject: "🏛️ Москва ждет! Билеты от 7,253 ₽",
        preheader: "Откройте для себя столицу России по специальным ценам",
        metadata: {
          duration: 2000,
          mode: 'test_offline',
          tools_used: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
          generation_time: 2.0,
          token_usage: 1200,
          file_size: 2847
        }
      },
      layout_regression: 'pass',
      litmus: 'pass',
      generation_time: 2.0,
      token_usage: 1200
    };

    console.log('✅ Test offline agent returning mock response');
    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('❌ Test offline agent error:', error);
    return NextResponse.json({
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Test Offline Agent API',
    description: 'Simulates agent response for frontend testing'
  });
} 