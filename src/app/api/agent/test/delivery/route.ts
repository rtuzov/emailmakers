import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent } from '@/agent/main-agent';

/**
 * POST /api/agent/test/delivery
 * Test Delivery Specialist with latest campaign context from all previous specialists
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

    console.log('\n🧪 === DELIVERY SPECIALIST TEST STARTED ===');
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
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=delivery`
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

    // Load all previous specialists context (Delivery Specialist is the final step)
    let qualityContext = null;
    let designContext = null;
    let contentContext = null;
    let dataCollectionContext = null;
    
    if (targetCampaignId) {
      try {
        // Load Quality Specialist handoff (recommended dependency)
        const qualityResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=quality`
        );
        const qualityData = await qualityResponse.json();
        
        if (qualityData.success) {
          qualityContext = qualityData.context;
          console.log(`🔍 Quality Specialist context loaded for Delivery`);
        }

        // Load Design Specialist handoff
        const designResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=design`
        );
        const designData = await designResponse.json();
        
        if (designData.success) {
          designContext = designData.context;
          console.log(`🎨 Design Specialist context loaded for Delivery`);
        }

        // Load Content Specialist handoff
        const contentResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=content`
        );
        const contentData = await contentResponse.json();
        
        if (contentData.success) {
          contentContext = contentData.context;
          console.log(`📝 Content Specialist context loaded for Delivery`);
        }

        // Load Data Collection Specialist handoff
        const dataResponse = await fetch(
          `${request.nextUrl.origin}/api/agent/test/utils?action=load_context&campaignId=${targetCampaignId}&specialist=data-collection`
        );
        const dataData = await dataResponse.json();
        
        if (dataData.success) {
          dataCollectionContext = dataData.context;
          console.log(`📊 Data Collection Specialist context loaded for Delivery`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load specialist contexts:', error);
      }
    }

    // Prepare test request
    const testRequest = customRequest || 
      'Package and deliver the final email campaign with all assets and documentation';

    console.log(`📝 Test Request: ${testRequest}`);

    // STRICT MODE: Check dependencies - Delivery needs all previous specialists
    const hasQualityContext = !!qualityContext;
    const hasDesignContext = !!designContext;
    const hasContentContext = !!contentContext;
    const hasDataCollectionContext = !!dataCollectionContext;
    
    console.log(`🔍 Quality Specialist context: ${hasQualityContext ? '✅ Available' : '❌ Missing'}`);
    console.log(`🎨 Design Specialist context: ${hasDesignContext ? '✅ Available' : '❌ Missing'}`);
    console.log(`📝 Content Specialist context: ${hasContentContext ? '✅ Available' : '❌ Missing'}`);
    console.log(`📊 Data Collection context: ${hasDataCollectionContext ? '✅ Available' : '❌ Missing'}`);
    
    // STRICT MODE: Fail if Quality context is missing (Delivery depends on Quality validation)
    if (!hasQualityContext) {
      throw new Error('❌ STRICT MODE: Quality Specialist context is required for Delivery Specialist. Run Quality Specialist first.');
    }
    
    // STRICT MODE: Fail if Design context is missing (Delivery needs templates)
    if (!hasDesignContext) {
      throw new Error('❌ STRICT MODE: Design Specialist context is required for Delivery Specialist. Run Design Specialist first.');
    }
    
    // STRICT MODE: Fail if Content context is missing (Delivery needs content)
    if (!hasContentContext) {
      throw new Error('❌ STRICT MODE: Content Specialist context is required for Delivery Specialist. Run Content Specialist first.');
    }
    
    // STRICT MODE: Fail if Data Collection context is missing (Delivery needs campaign data)
    if (!hasDataCollectionContext) {
      throw new Error('❌ STRICT MODE: Data Collection Specialist context is required for Delivery Specialist. Run Data Collection Specialist first.');
    }
    
    console.log('✅ All required specialist contexts found - Delivery Specialist can proceed');

    // STRICT MODE: Require existing campaign - no creation in test endpoints
    if (!targetCampaignId) {
      throw new Error('❌ STRICT MODE: Campaign ID is required for testing. Test endpoints cannot create new campaigns. Use the main workflow to create campaigns first.');
    }

    // Initialize EmailMakersAgent
    const agent = new EmailMakersAgent();
    await agent.initialize();

    // Prepare enhanced context for delivery specialist
    const enhancedContext = {
      campaign_id: targetCampaignId,
      test_mode: testMode,
      api_test: true,
      existing_context: campaignContext,
      specialist_focus: 'delivery',
      
      // All previous specialists context
      quality_context: qualityContext,
      design_context: designContext,
      content_context: contentContext,
      data_collection_context: dataCollectionContext,
      
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

      // Delivery-specific configuration
      delivery_config: {
        package_format: 'zip',
        include_documentation: true,
        include_assets: true,
        include_source_files: true,
        generate_preview: true,
        create_deployment_guide: true,
        validate_final_package: true,
        max_file_size: '600KB'
      },

      // Test configuration
      test_config: {
        save_files: testMode === 'full',
        generate_package: true,
        include_analytics: testMode === 'full',
        create_deployment_ready: testMode === 'full',
        quick_package: testMode === 'quick'
      },

      // Quality gates for delivery
      quality_gates: {
        min_quality_score: 85,
        required_validations: ['html', 'css', 'accessibility'],
        required_files: ['html', 'assets', 'documentation'],
        max_package_size: '600KB'
      }
    };

    console.log(`🚀 Starting Delivery Specialist with enhanced context...`);
    console.log(`📦 Delivery Config:`, enhancedContext.delivery_config);

    const startTime = Date.now();

    // Run Delivery Specialist with enhanced context
    const result = await agent.runSpecialist('delivery', testRequest, enhancedContext);

    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Delivery Specialist execution completed in ${executionTime}ms`);

    // Extract key outputs from result
    const outputs = extractDeliveryOutputs(result);

    console.log('\n✅ === DELIVERY SPECIALIST TEST COMPLETED ===');
    console.log(`📦 Delivery Package:`, outputs.summary);
    console.log(`📁 Package Size: ${outputs.packageSize || 'N/A'}`);
    console.log(`📋 Files Included: ${outputs.filesIncluded?.length || 0} files`);
    console.log(`🚀 Deployment Status: ${outputs.deploymentStatus || 'N/A'}`);

    return NextResponse.json({
      success: true,
      specialist: 'delivery',
      campaign_id: targetCampaignId,
      execution_time: executionTime,
      test_mode: testMode,
      
      context: {
        had_quality_context: !!qualityContext,
        had_design_context: !!designContext,
        had_content_context: !!contentContext,
        had_data_collection_context: !!dataCollectionContext,
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
    console.error('❌ Delivery Specialist test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/agent/test/delivery
 * Get Delivery Specialist information and testing capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return NextResponse.json({
          specialist: 'Delivery Specialist',
          description: 'Packages and delivers final email campaigns with all assets and documentation',
          capabilities: [
            'Campaign packaging (ZIP format)',
            'Asset organization and optimization',
            'Documentation generation',
            'Deployment guide creation',
            'Quality gate validation',
            'Preview generation',
            'Analytics setup',
            'Production deployment'
          ],
          dependencies: {
            recommended: ['Quality Specialist', 'Design Specialist'],
            optional: ['Content Specialist', 'Data Collection Specialist']
          },
          test_modes: {
            full: 'Complete packaging with deployment-ready output',
            quick: 'Fast packaging without deployment setup',
            validation: 'Package validation only'
          },
          outputs: [
            'Final campaign package (ZIP)',
            'Deployment documentation',
            'Asset manifest',
            'Quality validation report',
            'Preview files',
            'Analytics configuration',
            'Production deployment guide'
          ]
        });

      case 'status':
        return NextResponse.json({
          status: 'available',
          agent_type: 'delivery',
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
 * Extract key outputs from Delivery Specialist result
 */
function extractDeliveryOutputs(result: any) {
  const outputs = {
    summary: 'Campaign delivery completed',
    packageSize: null,
    filesIncluded: [],
    deploymentStatus: null,
    qualityValidation: null,
    deliveryPath: null,
    previewUrls: [],
    documentation: []
  };

  try {
    // Extract from finalOutput if it's a string
    if (typeof result.finalOutput === 'string') {
      const content = result.finalOutput;
      
      // Extract package size
      const sizeMatch = content.match(/(?:package|zip|file)\s*size[:\s]*(\d+(?:\.\d+)?)\s*(kb|mb|bytes?)/i);
      if (sizeMatch) {
        outputs.packageSize = `${sizeMatch[1]} ${sizeMatch[2].toUpperCase()}`;
      }

      // Extract deployment status
      const deploymentMatch = content.match(/(?:deployment|delivery)\s*(?:status[:\s]*)?(\w+)/i);
      if (deploymentMatch) {
        outputs.deploymentStatus = deploymentMatch[1];
      }

      // Extract file references
      const fileMatches = content.match(/(?:created|generated|packaged|included)[^\n]*\.(html|css|json|pdf|png|jpg|zip)/gi);
      if (fileMatches) {
        outputs.filesIncluded = fileMatches;
      }

      // Extract delivery path
      const pathMatch = content.match(/(?:saved|delivered|exported)\s*(?:to|at)[:\s]*([^\n]+)/i);
      if (pathMatch) {
        outputs.deliveryPath = pathMatch[1].trim();
      }

      // Extract preview URLs
      const previewMatches = content.match(/(?:preview|demo|view)[^\n]*(?:http[s]?:\/\/[^\s]+|\.html)/gi);
      if (previewMatches) {
        outputs.previewUrls = previewMatches.slice(0, 3); // Limit to 3 URLs
      }
    }

    // Extract from structured result if available
    if (result.finalOutput && typeof result.finalOutput === 'object') {
      const structured = result.finalOutput;
      
      outputs.packageSize = structured.package_size || outputs.packageSize;
      outputs.filesIncluded = structured.files_included || outputs.filesIncluded;
      outputs.deploymentStatus = structured.deployment_status || outputs.deploymentStatus;
      outputs.qualityValidation = structured.quality_validation;
      outputs.deliveryPath = structured.delivery_path || outputs.deliveryPath;
      outputs.previewUrls = structured.preview_urls || outputs.previewUrls;
      outputs.documentation = structured.documentation || outputs.documentation;
    }

  } catch (error) {
    console.warn('⚠️ Error extracting delivery outputs:', error);
  }

  return outputs;
} 