import { NextRequest, NextResponse } from 'next/server';
import { getCurrentDate } from '@/agent/tools/date';
import { getFigmaAssets } from '@/agent/tools/figma';
import { renderTest } from '@/agent/tools/render-test';
import { uploadToS3 } from '@/agent/tools/upload';

/**
 * POST /api/test-tools
 * Test our improved date and figma tools
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 Testing tools with:', body);

    const results: any = {};

    // Test date tool with autumn context
    if (body.test_dates) {
      console.log('📅 Testing date tool...');
      const dateResult = await getCurrentDate({
        campaign_context: {
          topic: 'Путешествие в Париж осенью романтическая поездка',
          urgency: 'seasonal',
          campaign_type: 'seasonal',
          destination: 'Париж'
        }
      });
      results.date_test = dateResult;
    }

    // Test figma tool with context
    if (body.test_figma) {
      console.log('🖼️ Testing figma tool...');
      const figmaResult = await getFigmaAssets({
        tags: ['счастлив', 'заяц'],
        context: {
          campaign_type: 'seasonal',
          emotional_tone: 'positive',
          target_count: 2,
          diversity_mode: true
        }
      });
      results.figma_test = figmaResult;
    }

    // Test render test tool
    if (body.test_render) {
      console.log('🧪 Testing render test tool...');
      const testHtml = `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Test Email</title>
        </head>
        <body>
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td>
                <h1 style="color: #333;">Test Email</h1>
                <p style="color: #666;">This is a test email template.</p>
                <img src="https://example.com/image.jpg" alt="Test Image" width="200" height="100" />
              </td>
            </tr>
          </table>
          <style>
            @media only screen and (max-width: 600px) {
              .responsive { width: 100% !important; }
            }
          </style>
        </body>
        </html>
      `;
      
      const renderResult = await renderTest({
        html: testHtml,
        subject: 'Test Email Subject'
      });
      results.render_test = renderResult;
    }

    // Test render test tool with bad HTML
    if (body.test_render_bad) {
      console.log('🧪 Testing render test tool with bad HTML...');
      const badTestHtml = `
        <html>
        <head>
          <title>Bad Email</title>
        </head>
        <body>
          <div style="display: flex; width: 800px;">
            <h1>Bad Email Template</h1>
            <p>This uses flexbox and exceeds width limits.</p>
            <img src="https://example.com/image.jpg" />
          </div>
        </body>
        </html>
      `;
      
      const badRenderResult = await renderTest({
        html: badTestHtml,
        subject: 'Bad Email Subject'
      });
      results.render_test_bad = badRenderResult;
    }

    // Test upload tool with fallback handling
    if (body.test_upload) {
      console.log('📤 Testing upload tool with fallback handling...');
      const testHtml = `
        <html>
          <body>
            <p>Test email with missing asset: <img src="{{FIGMA_ASSET_URL:rabbit-happy.png}}" alt="Test rabbit"/></p>
          </body>
        </html>
      `;
      
      try {
        const uploadResult = await uploadToS3({
          html: testHtml,
          mjml_source: null
        });
        results.upload_test = uploadResult;
      } catch (error) {
        results.upload_test = {
          success: false,
          error: error.message
        };
      }
    }

    return NextResponse.json({
      status: 'success',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test tools error:', error);
    return NextResponse.json({
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Tools test endpoint',
    available_tests: ['test_dates', 'test_figma', 'test_render', 'test_render_bad', 'test_upload']
  });
} 