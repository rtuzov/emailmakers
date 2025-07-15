import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent } from '@/agent/main-agent';

/**
 * POST /api/agent/test/data-collection
 * Test Data Collection Specialist with latest campaign context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      useLatest = true, 
      customRequest,
      testMode = 'full' // 'full' | 'quick' | 'validation'
    } = body;

    console.log('\n🧪 === DATA COLLECTION SPECIALIST TEST STARTED ===');
    console.log(`📋 Test Mode: ${testMode}`);
    console.log(`🎯 Use Latest Campaign: ${useLatest}`);
    console.log(`📁 Campaign ID: ${campaignId || 'auto-detect'}`);

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

    // Load campaign context if available
    let campaignContext = null;
    if (targetCampaignId) {
      try {
        const contextResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=data-collection`
        );
        const contextData = await contextResponse.json();
        
        if (contextData.success) {
          campaignContext = contextData.context;
          console.log(`📦 Campaign context loaded: ${contextData.message}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load campaign context:', error);
      }
    }

    // Prepare test request
    const testRequest = customRequest || 
      campaignContext?.readme?.user_request || 
      'Analyze travel destination and market intelligence for email campaign';

    console.log(`📝 Test Request: ${testRequest}`);

    // STRICT MODE: Require existing campaign - no creation in test endpoints
    if (!targetCampaignId) {
      throw new Error('❌ STRICT MODE: Campaign ID is required for testing. Test endpoints cannot create new campaigns. Use the main workflow to create campaigns first.');
    }

    // Initialize EmailMakersAgent
    const agent = new EmailMakersAgent();
    await agent.initialize();

    // Prepare enhanced context for data collection specialist
    const enhancedContext = {
      campaign_id: targetCampaignId,
      test_mode: testMode,
      api_test: true,
      existing_context: campaignContext,
      specialist_focus: 'data-collection',
      
      // Campaign info from context
      campaign_info: campaignContext?.readme ? {
        brand: campaignContext.readme.brand || 'Kupibilet',
        type: campaignContext.readme.type || 'promotional',
        audience: campaignContext.readme.audience || 'travelers',
        user_request: campaignContext.readme.user_request
      } : {
        brand: 'Kupibilet',
        type: 'promotional',
        audience: 'travelers'
      },
      
      // Test configuration
      test_config: {
        mode: testMode,
        enable_validation: true,
        save_results: testMode === 'full',
        quick_mode: testMode === 'quick'
      }
    };

    console.log('🚀 Starting Data Collection Specialist...');
    const startTime = Date.now();

    // Run Data Collection Specialist directly
    const result = await agent.runSpecialist('data-collection', testRequest, enhancedContext);
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Data Collection Specialist test completed');
    console.log(`⏱️ Execution time: ${executionTime}ms`);

    // Extract key information from result
    const analysis = {
      success: true,
      specialist: 'data-collection',
      test_mode: testMode,
      execution_time: executionTime,
      campaign_id: targetCampaignId,
      request: testRequest,
      context_loaded: !!campaignContext,
      
      // Result analysis
      result_type: typeof result,
      has_final_output: !!result?.finalOutput,
      has_state: !!result?.state,
      
      // Extract key outputs if available
      outputs: extractDataCollectionOutputs(result),
      
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === DATA COLLECTION SPECIALIST TEST FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`📍 Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      specialist: 'data-collection',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/test/data-collection
 * Get Data Collection Specialist test information and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return NextResponse.json({
          specialist: 'data-collection',
          description: 'Data Collection Specialist - LLM-powered data gathering and analysis',
          capabilities: [
            'Destination analysis',
            'Market intelligence gathering',
            'Emotional profile creation',
            'Trend analysis',
            'Travel intelligence insights'
          ],
          test_modes: {
            full: 'Complete data collection with file saving',
            quick: 'Fast analysis without file operations',
            validation: 'Validation of existing data'
          },
          endpoints: {
            test: 'POST /api/agent/test/data-collection',
            info: 'GET /api/agent/test/data-collection?action=info',
            status: 'GET /api/agent/test/data-collection?action=status'
          }
        });

      case 'status':
        // Check agent availability
        try {
          const agent = new EmailMakersAgent();
          await agent.initialize();
          const specialist = agent.getSpecialist('data-collection');
          
          return NextResponse.json({
            specialist: 'data-collection',
            status: 'available',
            agent_initialized: true,
            specialist_available: !!specialist,
            last_check: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            specialist: 'data-collection',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            last_check: new Date().toISOString()
          });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Data Collection test GET error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract key outputs from Data Collection Specialist result
 */
function extractDataCollectionOutputs(result: any) {
  if (!result) return null;

  const outputs: any = {
    has_destination_analysis: false,
    has_market_intelligence: false,
    has_emotional_profile: false,
    has_trend_analysis: false,
    files_mentioned: [],
    key_insights: []
  };

  const resultText = result.finalOutput || JSON.stringify(result);
  
  // Check for common data collection outputs
  if (resultText.includes('destination-analysis') || resultText.includes('Destination Analysis')) {
    outputs.has_destination_analysis = true;
  }
  
  if (resultText.includes('market-intelligence') || resultText.includes('Market Intelligence')) {
    outputs.has_market_intelligence = true;
  }
  
  if (resultText.includes('emotional-profile') || resultText.includes('Emotional Profile')) {
    outputs.has_emotional_profile = true;
  }
  
  if (resultText.includes('trend-analysis') || resultText.includes('Trend Analysis')) {
    outputs.has_trend_analysis = true;
  }

  // Extract file mentions
  const fileMatches = resultText.match(/[\w-]+\.json/g);
  if (fileMatches) {
    outputs.files_mentioned = [...new Set(fileMatches)];
  }

  // Extract key insights (simple pattern matching)
  const insightPatterns = [
    /✅\s+([^\.]+)/g,
    /📊\s+([^\.]+)/g,
    /🎯\s+([^\.]+)/g,
    /💡\s+([^\.]+)/g
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