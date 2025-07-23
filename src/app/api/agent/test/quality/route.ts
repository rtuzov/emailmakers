import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent } from '@/agent/main-agent';

/**
 * POST /api/agent/test/quality
 * Test Quality Specialist with latest campaign context from previous specialists
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

    console.log('\n🧪 === QUALITY SPECIALIST TEST STARTED ===');
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
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=quality`
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

    // Check for Design Specialist context (Quality Specialist depends on Design output)
    let designContext = null;
    let contentContext = null;
    if (targetCampaignId) {
      try {
        // Load Design Specialist handoff (recommended dependency)
        const designResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=design`
        );
        const designData = await designResponse.json();
        
        if (designData.success) {
          designContext = designData.context;
          console.log(`🎨 Design Specialist context loaded for Quality analysis`);
        }

        // Load Content Specialist handoff (optional but helpful)
        const contentResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=content`
        );
        const contentData = await contentResponse.json();
        
        if (contentData.success) {
          contentContext = contentData.context;
          console.log(`📝 Content Specialist context loaded for Quality analysis`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load specialist contexts:', error);
      }
    }

    // Prepare test request
    const testRequest = customRequest || 
      'Perform comprehensive quality analysis on the email template and validate cross-client compatibility';

    console.log(`📝 Test Request: ${testRequest}`);

    // STRICT MODE: Check dependencies
    const hasDesignContext = !!designContext;
    const hasContentContext = !!contentContext;
    
    console.log(`🎨 Design Specialist context: ${hasDesignContext ? '✅ Available' : '❌ Missing'}`);
    console.log(`📝 Content Specialist context: ${hasContentContext ? '✅ Available' : '❌ Missing'}`);
    
    // STRICT MODE: Fail if Design context is missing (Quality depends on Design output)
    if (!hasDesignContext) {
      throw new Error('❌ STRICT MODE: Design Specialist context is required for Quality Specialist. Run Design Specialist first.');
    }
    
    // STRICT MODE: Fail if Content context is missing (Quality needs content for validation)
    if (!hasContentContext) {
      throw new Error('❌ STRICT MODE: Content Specialist context is required for Quality Specialist. Run Content Specialist first.');
    }
    
    console.log('✅ All required specialist contexts found - Quality Specialist can proceed');

    // STRICT MODE: Require existing campaign - no creation in test endpoints
    if (!targetCampaignId) {
      throw new Error('❌ STRICT MODE: Campaign ID is required for testing. Test endpoints cannot create new campaigns. Use the main workflow to create campaigns first.');
    }

    // Initialize EmailMakersAgent
    const agent = new EmailMakersAgent();
    await agent.initialize();

    // Prepare enhanced context for quality specialist
    const enhancedContext = {
      campaign_id: targetCampaignId,
      test_mode: testMode,
      api_test: true,
      existing_context: campaignContext,
      specialist_focus: 'quality',
      
      // Previous specialists context
      design_context: designContext,
      content_context: contentContext,
      
      // Campaign info from context
      campaign_info: campaignContext?.readme ? {
        brand: campaignContext.readme.brand || 'Kupibilet',
        type: campaignContext.readme.type || 'promotional',
        audience: campaignContext.readme.audience || 'travelers',
        user_request: campaignContext.readme.user_request
      } : {
        brand: 'Kupibilet',
        type: 'promotional',
        audience: 'travelers',
        user_request: testRequest
      },

      // Quality-specific configuration
      quality_config: {
        validation_level: 'comprehensive',
        test_clients: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail'],
        accessibility_level: 'WCAG_AA',
        performance_threshold: 85,
        compatibility_threshold: 95,
        enable_ai_analysis: true
      },

      // Test configuration
      test_config: {
        save_files: testMode === 'full',
        generate_reports: true,
        include_screenshots: testMode === 'full',
        run_litmus_tests: testMode === 'full',
        quick_validation: testMode === 'quick'
      }
    };

    console.log(`🚀 Starting Quality Specialist with enhanced context...`);
    console.log(`📊 Quality Config:`, enhancedContext.quality_config);

    const startTime = Date.now();

    // Run Quality Specialist with enhanced context
    const result = await agent.runSpecialist('quality', testRequest, enhancedContext);

    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Quality Specialist execution completed in ${executionTime}ms`);

    // Extract key outputs from result
    const outputs = extractQualityOutputs(result);

    console.log('\n✅ === QUALITY SPECIALIST TEST COMPLETED ===');
    console.log(`📊 Quality Analysis Results:`, outputs.summary);
    console.log(`🎯 Overall Quality Score: ${outputs.qualityScore || 'N/A'}`);
    console.log(`📋 Validation Results: ${outputs.validationResults?.length || 0} checks`);
    console.log(`🔧 Recommendations: ${outputs.recommendations?.length || 0} items`);

    return NextResponse.json({
      success: true,
      specialist: 'quality',
      campaign_id: targetCampaignId,
      execution_time: executionTime,
      test_mode: testMode,
      
      context: {
        had_design_context: !!designContext,
        had_content_context: !!contentContext,
        campaign_context: !!campaignContext
      },
      
      outputs,
      
      result: {
        finalOutput: result.finalOutput,
        output: result.output,
        success: result.success,
        task_type: result.task_type,
        results: result.results,
        analytics: result.analytics,
        handoff_data: result.handoff_data
      }
    });

  } catch (error) {
    console.error('❌ Quality Specialist test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/test/quality
 * Get Quality Specialist information and testing capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return NextResponse.json({
          specialist: 'Quality Specialist',
          description: 'Validates email templates for cross-client compatibility, accessibility, and performance',
          capabilities: [
            'HTML/CSS validation',
            'Cross-client compatibility testing',
            'Accessibility compliance (WCAG AA)',
            'Performance optimization',
            'Email standards compliance',
            'AI-powered quality analysis',
            'Litmus integration testing',
            'Dark mode validation'
          ],
          dependencies: {
            recommended: ['Design Specialist'],
            optional: ['Content Specialist']
          },
          test_modes: {
            full: 'Complete quality analysis with file generation and external testing',
            quick: 'Fast validation without file generation',
            validation: 'HTML/CSS validation only'
          },
          outputs: [
            'Quality analysis report',
            'Validation results',
            'Compatibility matrix',
            'Performance metrics',
            'Accessibility audit',
            'Optimization recommendations'
          ]
        });

      case 'status':
        return NextResponse.json({
          status: 'available',
          agent_type: 'quality',
          sdk_version: 'OpenAI Agents SDK',
          last_updated: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract key outputs from Quality Specialist result
 */
function extractQualityOutputs(result: any) {
  const outputs = {
    summary: 'Quality analysis completed',
    qualityScore: null as number | null,
    validationResults: [] as string[],
    compatibilityMatrix: null as string | null,
    performanceMetrics: null as string | null,
    accessibilityAudit: null as string | null,
    recommendations: [] as string[],
    files: [] as string[]
  };

  try {
    // Extract from finalOutput if it's a string
    if (typeof result.finalOutput === 'string') {
      const content = result.finalOutput;
      
      // Extract quality score
      const scoreMatch = content.match(/(?:quality|overall|total)\s*score[:\s]*(\d+(?:\.\d+)?)/i);
      if (scoreMatch) {
        outputs.qualityScore = parseFloat(scoreMatch[1]);
      }

      // Extract validation results
      const validationMatches = content.match(/✅|❌|⚠️[^\n]+/g);
      if (validationMatches) {
        outputs.validationResults = validationMatches.slice(0, 10); // Limit to 10 items
      }

      // Extract recommendations
      const recommendationMatches = content.match(/(?:recommend|suggest|improve)[^\n]+/gi);
      if (recommendationMatches) {
        outputs.recommendations = recommendationMatches.slice(0, 5); // Limit to 5 items
      }

      // Extract file references
      const fileMatches = content.match(/(?:saved|generated|created)[^\n]*\.(html|css|json|pdf|png|jpg)/gi);
      if (fileMatches) {
        outputs.files = fileMatches;
      }
    }

    // Extract from structured result if available
    if (result.finalOutput && typeof result.finalOutput === 'object') {
      const structured = result.finalOutput;
      
      outputs.qualityScore = structured.quality_score || structured.score || outputs.qualityScore;
      outputs.validationResults = structured.validation_results || outputs.validationResults;
      outputs.compatibilityMatrix = structured.compatibility_matrix;
      outputs.performanceMetrics = structured.performance_metrics;
      outputs.accessibilityAudit = structured.accessibility_audit;
      outputs.recommendations = structured.recommendations || outputs.recommendations;
    }

  } catch (error) {
    console.warn('⚠️ Error extracting quality outputs:', error);
  }

  return outputs;
} 