import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent } from '@/agent/main-agent';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * POST /api/agent/test/design
 * Test Design Specialist with context from Data Collection and Content Specialists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      campaignId, 
      useLatest = true, 
      customRequest,
      testMode = 'full', // 'full' | 'quick' | 'validation'
      skipPreviousChecks = false // Skip if previous specialists context not available
    } = body;

    console.log('\n🧪 === DESIGN SPECIALIST TEST STARTED ===');
    console.log(`📋 Test Mode: ${testMode}`);
    console.log(`🎯 Use Latest Campaign: ${useLatest}`);
    console.log(`📁 Campaign ID: ${campaignId || 'auto-detect'}`);
    console.log(`⏭️ Skip Previous Checks: ${skipPreviousChecks}`);

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

    // Load campaign context including previous specialists results
    let campaignContext = null;
    if (targetCampaignId) {
      try {
        const contextResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=design`
        );
        const contextData = await contextResponse.json();
        
        if (contextData.success) {
          campaignContext = contextData.context;
          console.log(`📦 Campaign context loaded: ${contextData.message}`);
          
          // STRICT MODE: Check if previous specialists context is available
          if (!skipPreviousChecks) {
            const hasDataCollection = !!campaignContext.previous_data['data-collection'];
            const hasContent = !!campaignContext.previous_data['content'];
            
            console.log(`📊 Data Collection context: ${hasDataCollection ? '✅ Available' : '❌ Missing'}`);
            console.log(`📝 Content context: ${hasContent ? '✅ Available' : '❌ Missing'}`);
            
            // STRICT MODE: Fail if Content Specialist context is missing
            if (!hasContent) {
              throw new Error('❌ STRICT MODE: Content Specialist context is required for Design Specialist. Run Content Specialist first or use skipPreviousChecks=true to override.');
            }
            
            // STRICT MODE: Fail if Data Collection context is missing  
            if (!hasDataCollection) {
              throw new Error('❌ STRICT MODE: Data Collection Specialist context is required for Design Specialist. Run Data Collection Specialist first or use skipPreviousChecks=true to override.');
            }
            
            console.log('✅ All required specialist contexts found - Design Specialist can proceed');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load campaign context:', error);
      }
    }

    // Prepare test request
    const testRequest = customRequest || 
      'Create HTML email design with MJML templates and visual assets';

    console.log(`📝 Test Request: ${testRequest}`);

    // STRICT MODE: Require existing campaign - no creation in test endpoints
    if (!targetCampaignId) {
      throw new Error('❌ STRICT MODE: Campaign ID is required for testing. Test endpoints cannot create new campaigns. Use the main workflow to create campaigns first.');
    }

    // Initialize EmailMakersAgent
    const agent = new EmailMakersAgent();
    await agent.initialize();

    // Load campaign metadata for enhanced context
    let campaignMetadata = null;
    try {
      const metadataPath = path.resolve(process.cwd(), 'campaigns', targetCampaignId, 'campaign-metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      campaignMetadata = JSON.parse(metadataContent);
      console.log('✅ Campaign metadata loaded for context');
    } catch (error) {
      console.warn('⚠️ Could not load campaign metadata, using defaults');
    }

    // Prepare enhanced context for design specialist
    const enhancedContext = {
      campaign_id: targetCampaignId,
      campaign_path: `campaigns/${targetCampaignId}`,
      absolute_campaign_path: path.resolve(process.cwd(), 'campaigns', targetCampaignId),
      test_mode: testMode,
      api_test: true,
      existing_context: campaignContext,
      specialist_focus: 'design',
      
      // Campaign info from metadata or context
      campaign_info: campaignMetadata ? {
        id: campaignMetadata.id,
        name: campaignMetadata.name,
        brand: campaignMetadata.brand,
        type: campaignMetadata.type,
        target_audience: campaignMetadata.target_audience,
        user_request: campaignMetadata.user_request
      } : (campaignContext?.readme ? {
        brand: campaignContext.readme.brand || 'Kupibilet',
        type: campaignContext.readme.type || 'promotional',
        audience: campaignContext.readme.audience || 'travelers',
        user_request: campaignContext.readme.user_request
      } : {
        brand: 'Kupibilet',
        type: 'promotional',
        audience: 'travelers'
      }),
      
      // Previous specialists context if available
      data_collection_results: campaignContext?.previous_data['data-collection'] || null,
      content_results: campaignContext?.previous_data['content'] || null,
      
      // Test configuration
      test_config: {
        mode: testMode,
        enable_validation: true,
        save_results: testMode === 'full',
        quick_mode: testMode === 'quick',
        has_data_context: !!campaignContext?.previous_data['data-collection'],
        has_content_context: !!campaignContext?.previous_data['content']
      }
    };

    console.log('🚀 Starting Design Specialist...');
    const startTime = Date.now();

    // Run Design Specialist directly with proper campaign context
    const result = await agent.runSpecialist('design', testRequest, {
      ...enhancedContext,
      // Provide campaign data in the format expected by context manager
      campaign: campaignMetadata ? {
        id: campaignMetadata.id,
        name: campaignMetadata.name,
        path: path.resolve(process.cwd(), 'campaigns', targetCampaignId),
        brand: campaignMetadata.brand,
        language: 'ru',
        type: campaignMetadata.type
      } : {
        id: targetCampaignId,
        name: 'Test Campaign',
        path: path.resolve(process.cwd(), 'campaigns', targetCampaignId),
        brand: 'Kupibilet',
        language: 'ru',
        type: 'promotional'
      }
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Design Specialist test completed');
    console.log(`⏱️ Execution time: ${executionTime}ms`);

    // Extract key information from result
    const analysis = {
      success: true,
      specialist: 'design',
      test_mode: testMode,
      execution_time: executionTime,
      campaign_id: targetCampaignId,
      request: testRequest,
      context_loaded: !!campaignContext,
      data_collection_available: !!campaignContext?.previous_data['data-collection'],
      content_available: !!campaignContext?.previous_data['content'],
      
      // Result analysis
      result_type: typeof result,
      has_final_output: !!result?.finalOutput,
      has_state: !!result?.state,
      
      // Extract key outputs if available
      outputs: extractDesignOutputs(result),
      
      // Context analysis
      context_analysis: {
        handoff_chain_length: campaignContext?.handoff_chain?.length || 0,
        loaded_files_count: campaignContext?.loaded_files?.length || 0,
        has_data_files: !!campaignContext?.data_files,
        has_content_files: !!campaignContext?.content_files,
        has_assets_files: !!campaignContext?.assets_files,
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
      content_context: campaignContext?.previous_data['content'] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === DESIGN SPECIALIST TEST FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`📍 Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      specialist: 'design',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/test/design
 * Get Design Specialist test information and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return NextResponse.json({
          specialist: 'design',
          description: 'Design Specialist - HTML email design with MJML templates and visual assets',
          capabilities: [
            'MJML template generation',
            'HTML email rendering',
            'Figma asset integration',
            'Responsive design optimization',
            'Brand guidelines application',
            'Visual asset selection and optimization'
          ],
          dependencies: [
            'Content Specialist (recommended)',
            'Data Collection Specialist (optional)'
          ],
          test_modes: {
            full: 'Complete design generation with MJML/HTML and assets',
            quick: 'Fast design generation without asset processing',
            validation: 'Validation of existing design templates'
          },
          endpoints: {
            test: 'POST /api/agent/test/design',
            info: 'GET /api/agent/test/design?action=info',
            status: 'GET /api/agent/test/design?action=status'
          }
        });

      case 'status':
        // Check agent availability
        try {
          const agent = new EmailMakersAgent();
          await agent.initialize();
          const specialist = agent.getSpecialist('design');
          
          return NextResponse.json({
            specialist: 'design',
            status: 'available',
            agent_initialized: true,
            specialist_available: !!specialist,
            last_check: new Date().toISOString()
          });
        } catch (error) {
          return NextResponse.json({
            specialist: 'design',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            last_check: new Date().toISOString()
          });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Design test GET error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract key outputs from Design Specialist result
 */
function extractDesignOutputs(result: any) {
  if (!result) return null;

  const outputs: any = {
    has_mjml_template: false,
    has_html_output: false,
    has_css_styles: false,
    has_assets: false,
    has_responsive_design: false,
    template_type: null,
    assets_mentioned: [],
    files_mentioned: [],
    design_elements: [],
    key_insights: []
  };

  const resultText = result.finalOutput || JSON.stringify(result);
  
  // Check for common design outputs
  if (resultText.includes('mjml') || resultText.includes('MJML') || resultText.includes('<mj-')) {
    outputs.has_mjml_template = true;
  }
  
  if (resultText.includes('<html') || resultText.includes('HTML') || resultText.includes('<!DOCTYPE')) {
    outputs.has_html_output = true;
  }
  
  if (resultText.includes('css') || resultText.includes('CSS') || resultText.includes('style') || resultText.includes('@media')) {
    outputs.has_css_styles = true;
  }
  
  if (resultText.includes('assets') || resultText.includes('images') || resultText.includes('figma') || resultText.includes('.jpg') || resultText.includes('.png')) {
    outputs.has_assets = true;
  }

  if (resultText.includes('responsive') || resultText.includes('mobile') || resultText.includes('@media') || resultText.includes('max-width')) {
    outputs.has_responsive_design = true;
  }

  // Detect template type
  if (resultText.includes('travel') || resultText.includes('Thailand') || resultText.includes('Таиланд')) {
    outputs.template_type = 'travel';
  } else if (resultText.includes('promotional') || resultText.includes('promo')) {
    outputs.template_type = 'promotional';
  }

  // Extract asset mentions
  const assetMatches = resultText.match(/[\w-]+\.(jpg|png|svg|gif)/gi);
  if (assetMatches) {
    outputs.assets_mentioned = [...new Set(assetMatches)];
  }

  // Extract file mentions
  const fileMatches = resultText.match(/[\w-]+\.(json|mjml|html)/gi);
  if (fileMatches) {
    outputs.files_mentioned = [...new Set(fileMatches)];
  }

  // Extract design elements
  const elementPatterns = [
    /header[:\s]+(.*?)(?:\n|$)/gi,
    /hero[:\s]+(.*?)(?:\n|$)/gi,
    /content[:\s]+(.*?)(?:\n|$)/gi,
    /footer[:\s]+(.*?)(?:\n|$)/gi,
    /button[:\s]+(.*?)(?:\n|$)/gi
  ];

  for (const pattern of elementPatterns) {
    const matches = resultText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length < 200) {
        outputs.design_elements.push({
          type: match[0].split(':')[0].toLowerCase(),
          description: match[1].trim()
        });
      }
    }
  }

  // Extract key insights
  const insightPatterns = [
    /✅\s+([^\.]+)/g,
    /🎨\s+([^\.]+)/g,
    /📱\s+([^\.]+)/g,
    /🖼️\s+([^\.]+)/g,
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