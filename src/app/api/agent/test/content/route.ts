import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent } from '@/agent/main-agent';

/**
 * POST /api/agent/test/content
 * Test Content Specialist with context from Data Collection Specialist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      useLatest = true, 
      customRequest,
      testMode = 'full', // 'full' | 'quick' | 'validation'
      skipDataCollection = false, // Skip if data collection context not available
      campaign_name,
      destination,
      brief
    } = body;

    console.log('\n🧪 === CONTENT SPECIALIST TEST STARTED ===');
    console.log(`📋 Test Mode: ${testMode}`);
    console.log(`🎯 Use Latest Campaign: ${useLatest}`);
    console.log(`📁 Campaign ID: ${campaignId || 'auto-detect'}`);
    console.log(`⏭️ Skip Data Collection Check: ${skipDataCollection}`);

    // Get latest campaign if not specified
    let targetCampaignId = campaignId;
    if (useLatest && !campaignId) {
      const utilsResponse = await fetch(`${request.nextUrl.origin}/api/agent/test/utils?action=get_latest`);
      const utilsData = await utilsResponse.json();
      
      if (utilsData.success && utilsData.campaign) {
        targetCampaignId = utilsData.campaign.id;
        console.log(`✅ Latest campaign detected: ${targetCampaignId}`);
      } else {
        console.log('⚠️ No latest campaign found, starting fresh');
      }
    }

    // Load campaign context including data collection results
    let campaignContext = null;
    if (targetCampaignId) {
      try {
        const contextResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=content`
        );
        const contextData = await contextResponse.json();
        
        if (contextData.success) {
          campaignContext = contextData.context;
          console.log(`📦 Campaign context loaded: ${contextData.message}`);
          
          // STRICT MODE: Check if data collection context is available
          if (!skipDataCollection) {
            const hasDataCollection = !!campaignContext.previous_data['data-collection'];
            console.log(`📊 Data Collection context: ${hasDataCollection ? '✅ Available' : '❌ Missing'}`);
            
            // STRICT MODE: Fail if Data Collection context is missing
            if (!hasDataCollection) {
              throw new Error('❌ STRICT MODE: Data Collection Specialist context is required for Content Specialist. Run Data Collection Specialist first or use skipDataCollection=true to override.');
            }
            
            console.log('✅ Data Collection context found - Content Specialist can proceed with rich context');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load campaign context:', error);
      }
    }

    // Prepare test request
    const testRequest = customRequest || 
      campaignContext?.readme?.user_request || 
      'Create compelling email content for travel campaign';

    console.log(`📝 Test Request: ${testRequest}`);

    // STRICT MODE: Require existing campaign - no creation in test endpoints
    if (!targetCampaignId) {
      throw new Error('❌ STRICT MODE: Campaign ID is required for testing. Test endpoints cannot create new campaigns. Use the main workflow to create campaigns first.');
    }

    // Initialize EmailMakersAgent
    const agent = new EmailMakersAgent();
    await agent.initialize();

    // Prepare enhanced context for content specialist
    const enhancedContext = {
      campaign_id: targetCampaignId,
      campaign_path: campaignContext?.campaign_path,
      absolute_campaign_path: campaignContext?.campaign_path,
      test_mode: testMode,
      api_test: true,
      existing_context: campaignContext,
      specialist_focus: 'content',
      
      // Campaign info from context or request
      campaign_info: campaignContext?.readme ? {
        brand: campaignContext.readme.brand || 'Kupibilet',
        type: campaignContext.readme.type || 'promotional',
        audience: campaignContext.readme.audience || 'travelers',
        user_request: campaignContext.readme.user_request,
        name: campaignContext.readme.name || campaign_name
      } : {
        brand: 'Kupibilet',
        type: 'promotional',
        audience: 'travelers',
        name: campaign_name,
        destination,
        brief
      },
      
      // Data Collection context if available
      data_collection_results: campaignContext?.previous_data['data-collection'] || null,
      
      // Test configuration
      test_config: {
        mode: testMode,
        enable_validation: true,
        save_results: testMode === 'full',
        quick_mode: testMode === 'quick',
        has_data_context: !!campaignContext?.previous_data['data-collection']
      }
    };

    console.log('🚀 Starting Content Specialist...');
    const startTime = Date.now();

    // Run Content Specialist directly
    const result = await agent.runSpecialist('content', testRequest, enhancedContext);
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Content Specialist test completed');
    console.log(`⏱️ Execution time: ${executionTime}ms`);

    // Extract key information from result
    const analysis = {
      success: true,
      specialist: 'content',
      test_mode: testMode,
      execution_time: executionTime,
      campaign_id: targetCampaignId,
      request: testRequest,
      context_loaded: !!campaignContext,
      data_collection_available: !!campaignContext?.previous_data['data-collection'],
      
      // Result analysis
      result_type: typeof result,
      has_final_output: !!result?.finalOutput,
      has_state: !!result?.state,
      
      // Extract key outputs if available
      outputs: extractContentOutputs(result),
      
      // Context analysis
      context_analysis: {
        handoff_chain_length: campaignContext?.handoff_chain?.length || 0,
        loaded_files_count: campaignContext?.loaded_files?.length || 0,
        has_data_files: !!campaignContext?.data_files,
        previous_specialists: Object.keys(campaignContext?.previous_data || {})
      },
      
      // Performance metrics
      performance: {
        execution_time_ms: executionTime,
        context_size: campaignContext ? JSON.stringify(campaignContext).length : 0,
        success_rate: result ? 100 : 0
      }
    };

    return NextResponse.json({
      success: true,
      test_results: analysis,
      agent_result: result,
      campaign_context: campaignContext,
      data_collection_context: campaignContext?.previous_data['data-collection'] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === CONTENT SPECIALIST TEST FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`📍 Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      specialist: 'content',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/test/content
 * Get Content Specialist test information and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return NextResponse.json({
          specialist: 'content',
          description: 'Content Specialist - Email content generation with context intelligence',
          capabilities: [
            'Email content generation',
            'Subject line creation',
            'Call-to-action optimization',
            'Pricing intelligence integration',
            'Multi-language support (RU/EN)',
            'Context-aware content adaptation'
          ],
          dependencies: [
            'Data Collection Specialist (recommended)'
          ],
          test_modes: {
            full: 'Complete content generation with file saving',
            quick: 'Fast content generation without file operations',
            validation: 'Validation of existing content'
          },
          endpoints: {
            test: 'POST /api/agent/test/content',
            info: 'GET /api/agent/test/content?action=info',
            status: 'GET /api/agent/test/content?action=status'
          }
        });

      case 'status':
        // Check agent availability
        try {
          const agent = new EmailMakersAgent();
          await agent.initialize();
          const specialist = agent.getSpecialist('content');
          
          return NextResponse.json({
            specialist: 'content',
            status: 'available',
            agent_initialized: true,
            specialist_available: !!specialist,
            last_check: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            specialist: 'content',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            last_check: new Date().toISOString()
          });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Content test GET error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract key outputs from Content Specialist result
 */
function extractContentOutputs(result: any) {
  if (!result) return null;

  const outputs: any = {
    has_subject_line: false,
    has_preheader: false,
    has_body_content: false,
    has_cta: false,
    has_pricing_data: false,
    language_detected: null,
    content_sections: [],
    files_mentioned: [],
    key_insights: []
  };

  const resultText = result.finalOutput || JSON.stringify(result);
  
  // Check for common content outputs
  if (resultText.includes('subject') || resultText.includes('Subject') || resultText.includes('тема')) {
    outputs.has_subject_line = true;
  }
  
  if (resultText.includes('preheader') || resultText.includes('Preheader') || resultText.includes('прехедер')) {
    outputs.has_preheader = true;
  }
  
  if (resultText.includes('body') || resultText.includes('Body') || resultText.includes('содержание') || resultText.includes('текст письма')) {
    outputs.has_body_content = true;
  }
  
  if (resultText.includes('cta') || resultText.includes('CTA') || resultText.includes('call-to-action') || resultText.includes('призыв к действию')) {
    outputs.has_cta = true;
  }

  if (resultText.includes('цена') || resultText.includes('price') || resultText.includes('pricing') || resultText.includes('руб') || resultText.includes('RUB')) {
    outputs.has_pricing_data = true;
  }

  // Detect language
  if (resultText.includes('Откройте') || resultText.includes('Путешествие') || resultText.includes('руб')) {
    outputs.language_detected = 'ru';
  } else if (resultText.includes('Discover') || resultText.includes('Travel') || resultText.includes('USD')) {
    outputs.language_detected = 'en';
  }

  // Extract file mentions
  const fileMatches = resultText.match(/[\w-]+\.json/g);
  if (fileMatches) {
    outputs.files_mentioned = [...new Set(fileMatches)];
  }

  // Extract content sections
  const sectionPatterns = [
    /subject[:\s]+(.*?)(?:\n|$)/gi,
    /preheader[:\s]+(.*?)(?:\n|$)/gi,
    /body[:\s]+(.*?)(?:\n|$)/gi,
    /cta[:\s]+(.*?)(?:\n|$)/gi
  ];

  for (const pattern of sectionPatterns) {
    const matches = resultText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 300) {
        outputs.content_sections.push({
          type: match[0].split(':')[0].toLowerCase(),
          content: match[1].trim()
        });
      }
    }
  }

  // Extract key insights
  const insightPatterns = [
    /✅\s+([^\.]+)/g,
    /📊\s+([^\.]+)/g,
    /🎯\s+([^\.]+)/g,
    /💡\s+([^\.]+)/g,
    /📧\s+([^\.]+)/g
  ];

  for (const pattern of insightPatterns) {
    const matches = resultText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 200) {
        outputs.key_insights.push(match[1].trim());
      }
    }
  }

  return outputs;
} 