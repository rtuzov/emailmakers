import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo API endpoint that provides a realistic success response
 * for testing the enhanced success notifications and download functionality
 */
export async function GET(request: NextRequest) {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockSuccessResult = {
      status: 'success' as const,
      data: {
        template_id: 'tpl_' + Date.now(),
        html_content: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ваш отпуск в Париже ждет вас!</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background-color: #ff6b6b; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .cta-button { background-color: #4ecdc4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇫🇷 Волшебный Париж ждет вас!</h1>
    </div>
    <div class="content">
      <h2>Эксклюзивное предложение от Kupibilet</h2>
      <p>Откройте для себя романтику и красоту Парижа с нашими специальными предложениями. Забронируйте прямо сейчас и получите скидку до 30%!</p>
      <a href="#" class="cta-button">Забронировать сейчас</a>
      <p>✈️ Прямые рейсы из Москвы<br>🏨 Лучшие отели в центре города<br>🎫 Билеты в музеи в подарок</p>
    </div>
  </div>
</body>
</html>`,
        mjml_content: `<mjml>
  <mj-head>
    <mj-title>Ваш отпуск в Париже ждет вас!</mj-title>
    <mj-preview>Откройте для себя романтику и красоту Парижа</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section background-color="#ff6b6b">
      <mj-column>
        <mj-text align="center" color="white" font-size="28px" font-weight="bold">
          🇫🇷 Волшебный Париж ждет вас!
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" color="#333333">
          Эксклюзивное предложение от Kupibilet
        </mj-text>
        <mj-text font-size="16px" line-height="1.6" color="#555555">
          Откройте для себя романтику и красоту Парижа с нашими специальными предложениями. Забронируйте прямо сейчас и получите скидку до 30%!
        </mj-text>
        <mj-button background-color="#4ecdc4" color="white" href="#" border-radius="5px">
          Забронировать сейчас
        </mj-button>
        <mj-text font-size="16px" line-height="1.8">
          ✈️ Прямые рейсы из Москвы<br/>
          🏨 Лучшие отели в центре города<br/>
          🎫 Билеты в музеи в подарок
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
        text_content: `ВОЛШЕБНЫЙ ПАРИЖ ЖДЕТ ВАС!

Эксклюзивное предложение от Kupibilet

Откройте для себя романтику и красоту Парижа с нашими специальными предложениями. Забронируйте прямо сейчас и получите скидку до 30%!

Забронировать: [ссылка]

✈️ Прямые рейсы из Москвы
🏨 Лучшие отели в центре города
🎫 Билеты в музеи в подарок

С уважением,
Команда Kupibilet`,
        subject_line: '🇫🇷 Ваш отпуск в Париже ждет вас! Скидка до 30%',
        preview_text: 'Откройте для себя романтику и красоту Парижа с нашими эксклюзивными предложениями',
        design_tokens: {
          colors: {
            primary: '#ff6b6b',
            secondary: '#4ecdc4',
            text: '#333333',
            background: '#ffffff'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            size: {
              heading: '28px',
              subheading: '24px',
              body: '16px'
            }
          },
          spacing: {
            padding: '20px',
            margin: '30px'
          }
        },
        quality_scores: {
          content_quality: 92,
          design_quality: 88,
          deliverability_score: 95,
          overall_quality: 91
        },
        file_urls: {
          html_file: '/api/demo/download/template.html',
          mjml_file: '/api/demo/download/template.mjml',
          text_file: '/api/demo/download/template.txt',
          preview_image: '/api/demo/preview/template-preview.png'
        }
      },
      metadata: {
        generation_time: 1850,
        mode: 'production',
        apis_used: ['openai-gpt4o-mini', 'mjml-compiler', 'css-inline'],
        template_size: 2048,
        agent_confidence_scores: {
          content_specialist: 94,
          design_specialist: 87,
          quality_specialist: 95,
          delivery_specialist: 89
        }
      }
    };

    return NextResponse.json(mockSuccessResult, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Demo success API error:', error);
    
    return NextResponse.json({
      status: 'error',
      error_message: 'Failed to generate demo success response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🎯 Demo success POST request:', body);

    // Simulate form submission with success
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockSuccessResult = {
      status: 'success' as const,
      data: {
        template_id: 'tpl_demo_' + Date.now(),
        html_content: generateDemoEmailContent(body),
        mjml_content: generateDemoMJMLContent(body),
        text_content: generateDemoTextContent(body),
        subject_line: generateSubjectLine(body),
        preview_text: generatePreviewText(body),
        design_tokens: {
          colors: { primary: '#ff6b6b', secondary: '#4ecdc4' },
          fonts: { primary: 'Arial, sans-serif' }
        },
        quality_scores: {
          content_quality: 88 + Math.random() * 12,
          design_quality: 85 + Math.random() * 15,
          deliverability_score: 90 + Math.random() * 10,
          overall_quality: 87 + Math.random() * 13
        }
      },
      metadata: {
        generation_time: 1500 + Math.random() * 1000,
        mode: 'demo',
        apis_used: ['openai-demo', 'mjml-compiler'],
        template_size: 1800 + Math.random() * 500,
        agent_confidence_scores: {
          content_specialist: 90 + Math.random() * 10,
          design_specialist: 85 + Math.random() * 15,
          quality_specialist: 92 + Math.random() * 8,
          delivery_specialist: 88 + Math.random() * 12
        }
      }
    };

    return NextResponse.json(mockSuccessResult);

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error_message: 'Demo generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions for demo content generation
function generateDemoEmailContent(formData: any): string {
  const destination = formData.destination || 'Париж';
  const origin = formData.origin || 'Москва';
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ваше путешествие в ${destination}</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px 20px; background: white; }
    .cta-button { background-color: #4ecdc4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .features { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌟 Незабываемое путешествие в ${destination}!</h1>
      <p>Эксклюзивные предложения от Kupibilet</p>
    </div>
    <div class="content">
      <h2>Специально для вас!</h2>
      <p>Откройте для себя удивительный ${destination} с нашими тщательно подобранными турами из ${origin}. Получите до 35% скидки при бронировании в течение 48 часов!</p>
      
      <div class="features">
        <h3>🎯 Что включено:</h3>
        <ul>
          <li>✈️ Прямые перелеты ${origin} → ${destination}</li>
          <li>🏨 Проверенные отели с отличными отзывами</li>
          <li>🗺️ Персональные экскурсии с местными гидами</li>
          <li>📱 Мобильное приложение с offline картами</li>
        </ul>
      </div>
      
      <a href="#" class="cta-button">Забронировать со скидкой 35%</a>
      
      <p><small>Предложение действительно до ${new Date(Date.now() + 48*60*60*1000).toLocaleDateString('ru-RU')}. Количество мест ограничено.</small></p>
    </div>
  </div>
</body>
</html>`;
}

function generateDemoMJMLContent(formData: any): string {
  const destination = formData.destination || 'Париж';
  
  return `<mjml>
  <mj-head>
    <mj-title>Путешествие в ${destination}</mj-title>
    <mj-preview>Эксклюзивные предложения от Kupibilet</mj-preview>
  </mj-head>
  <mj-body>
    <mj-section background-color="#ff6b6b">
      <mj-column>
        <mj-text align="center" color="white" font-size="32px" font-weight="bold">
          🌟 Незабываемое путешествие в ${destination}!
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text font-size="20px">Специально для вас!</mj-text>
        <mj-text>Откройте для себя удивительный ${destination} с нашими эксклюзивными предложениями.</mj-text>
        <mj-button background-color="#4ecdc4" href="#">Забронировать со скидкой 35%</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}

function generateDemoTextContent(formData: any): string {
  const destination = formData.destination || 'Париж';
  const origin = formData.origin || 'Москва';
  
  return `НЕЗАБЫВАЕМОЕ ПУТЕШЕСТВИЕ В ${destination.toUpperCase()}!

Эксклюзивные предложения от Kupibilet

Откройте для себя удивительный ${destination} с нашими тщательно подобранными турами из ${origin}. 

🎯 ЧТО ВКЛЮЧЕНО:
✈️ Прямые перелеты ${origin} → ${destination}
🏨 Проверенные отели с отличными отзывами  
🗺️ Персональные экскурсии с местными гидами
📱 Мобильное приложение с offline картами

ЗАБРОНИРОВАТЬ СО СКИДКОЙ 35%: [ссылка]

Предложение действительно ограниченное время.

С уважением,
Команда Kupibilet`;
}

function generateSubjectLine(formData: any): string {
  const destination = formData.destination || 'Париж';
  const subjects = [
    `🌟 ${destination}: скидка 35% только сегодня!`,
    `✈️ Билеты в ${destination} со скидкой до 35%`,
    `🎯 Эксклюзив: ${destination} с Kupibilet (-35%)`,
    `🏨 ${destination} ждет вас! Скидки до 35%`
  ];
  
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generatePreviewText(formData: any): string {
  const destination = formData.destination || 'Париж';
  
  return `Откройте для себя удивительный ${destination} с эксклюзивными предложениями от Kupibilet. Скидки до 35%!`;
}