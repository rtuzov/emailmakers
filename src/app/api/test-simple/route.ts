import { NextRequest, NextResponse } from 'next/server';
import { contentGenerator } from '../../../agent/tools/consolidated/content-generator';
import { simplePricing } from '../../../agent/tools/simple-pricing';
import { createEmailCampaignOrchestratorImproved } from '../../../agent/specialists/specialist-agents-improved';
import { emailRenderer } from '../../../agent/tools/email-renderer-v2';
import EmailFolderManager from '../../../agent/tools/email-folder-manager';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { test } = body;

  console.log('🧪 Test Simple: Starting basic test');

  try {
    if (test === 'content') {
      // Test content generator (consolidated)
      const result = await contentGenerator({
        topic: 'Испания летом',
        action: 'generate',
        content_type: 'complete_campaign',
        target_audience: { primary: 'families' },
        tone: 'friendly',
        language: 'ru',
        campaign_context: {
          campaign_type: 'promotional',
          seasonality: 'summer',
          urgency_level: 'medium'
        }
      });
      
      console.log('✅ Content generator test completed');
      return NextResponse.json({ 
        success: true, 
        test: 'content',
        result 
      });
    }

    if (test === 'pricing') {
      // Test simple pricing
      const result = await simplePricing({
        origin: 'MOW',
        destination: 'BCN',
        date_range: ''
      });
      
      console.log('✅ Simple pricing test completed');
      return NextResponse.json({ 
        success: true, 
        test: 'pricing',
        result 
      });
    }

    if (test === 'agent') {
      // Test agent creation
      const orchestratorSystem = await createEmailCampaignOrchestratorImproved();
      
      console.log('✅ Simple agent creation test completed');
      return NextResponse.json({ 
        success: true, 
        test: 'agent',
        agents: Object.keys(orchestratorSystem)
      });
    }

    if (test === 'mjml-direct') {
      // Test MJML service directly
      const { MjmlCompilationService } = await import('../../../agent/tools/email-renderer/services/mjml-compilation-service');
      const EmailFolderManager = (await import('../../../agent/tools/email-folder-manager')).default;
      
      // Create email folder
      const emailFolder = await EmailFolderManager.createEmailFolder('MJML Direct Test', 'promotional');
      console.log('📁 Created email folder:', emailFolder.campaignId);
      
      // Create MJML service
      const mjmlService = new MjmlCompilationService();
      
      // Create context with content data
      const context = {
        params: {
          content_data: {
            topic: 'Испания летом - солнечные пляжи, архитектура и культура',
            content: 'Откройте для себя магию испанского лета! Солнечные пляжи, богатая архитектура и удивительная культура ждут вас.'
          }
        },
        email_folder: emailFolder,
        start_time: Date.now()
      };
      
      // Call MJML service directly
      const result = await mjmlService.handleMjmlRendering(context);
      
      console.log('✅ MJML service test completed');
      console.log('HTML contains images:', result.data.html.includes('<img'));
      console.log('Image count:', (result.data.html.match(/<img/g) || []).length);
      
      return NextResponse.json({
        success: true,
        test: 'mjml-direct',
        emailFolder: emailFolder.campaignId,
        hasImages: result.data.html.includes('<img'),
        imageCount: (result.data.html.match(/<img/g) || []).length,
        htmlLength: result.data.html.length,
        mjmlLength: result.data.mjml.length
      });
      
    } else if (test === 'full-workflow') {
      // Test full workflow with HTML saving
      console.log('🧪 Starting full workflow test with HTML saving');
      
      // 1. Create email folder
      const emailFolder = await EmailFolderManager.createEmailFolder(
        'Испания летом - солнечные пляжи',
        'promotional'
      );
      console.log(`📁 Created email folder: ${emailFolder.campaignId}`);
      
      // 2. Generate content using consolidated generator
      const contentResult = await contentGenerator({
        topic: 'Испания летом - солнечные пляжи, архитектура и культура',
        action: 'generate',
        content_type: 'complete_campaign',
        target_audience: { primary: 'families' },
        tone: 'friendly',
        language: 'ru',
        campaign_context: {
          campaign_type: 'promotional',
          seasonality: 'summer',
          urgency_level: 'medium'
        }
      });
      console.log('✅ Content generated');
      
      // 3. Get pricing
      const pricingResult = await simplePricing({
        origin: 'MOW',
        destination: 'BCN',
        date_range: ''
      });
      const pricingData = typeof pricingResult === 'string' ? JSON.parse(pricingResult) : pricingResult;
      console.log('✅ Pricing data obtained');
      
      // 4. Render HTML email
      const htmlResult = await emailRenderer({
        action: 'render_mjml',
        content_data: {
          subject: contentResult.data?.content?.subject || 'Испания летом',
          body: contentResult.data?.content?.body || 'Откройте для себя Испанию!',
          cta_text: contentResult.data?.content?.cta || 'Забронировать',
          pricing_data: JSON.stringify(pricingData.data.prices)
        },
        emailFolder: emailFolder.campaignId,
        rendering_options: {
          minify_output: false,
          validate_html: true,
          accessibility_compliance: true
        },
        include_analytics: true
      });
      console.log('✅ HTML email rendered');
      
      console.log('✅ Full workflow test completed');
      return NextResponse.json({ 
        success: true, 
        test: 'full-workflow',
        emailFolder: emailFolder.campaignId,
        results: {
          content: contentResult,
          pricing: pricingResult,
          html: htmlResult
        }
      });
    }

    // Default test - content generator (consolidated)
    const result = await contentGenerator({
      topic: 'Испания летом',
      action: 'generate',
      content_type: 'complete_campaign',
      target_audience: { primary: 'families' },
      tone: 'friendly',
      language: 'ru',
      campaign_context: {
        campaign_type: 'promotional',
        seasonality: 'summer',
        urgency_level: 'medium'
      }
    });
    
    console.log('✅ Content generator test completed');
    return NextResponse.json({ 
      success: true, 
      test: 'default',
      result 
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 