import { NextRequest, NextResponse } from 'next/server';
import { deliverySpecialistAgent } from '@/agent/core/tool-registry';
import { DeliverySpecialistInput } from '@/agent/specialists/delivery/common/delivery-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      task_type = 'finalize_delivery',
      email_package,
      deployment_config,
      upload_requirements,
      testing_requirements,
      campaign_context
    } = body;

    console.log('🚀 DeliverySpecialist API called (OpenAI Agents SDK):', { 
      task_type, 
      hasEmailPackage: !!email_package,
      hasDeploymentConfig: !!deployment_config,
      hasCampaignContext: !!campaign_context
    });

    // Prepare input for the delivery specialist agent
    const agentInput: DeliverySpecialistInput = {
      task_type,
      email_package: email_package || {
        html_output: '<html><body><h1>Sample Email</h1><p>Sample content</p></body></html>',
        mjml_source: undefined,
        quality_score: 85,
        compliance_status: {
          overall_score: 85,
          passed_checks: ['HTML validation', 'Email standards'],
          recommendations: []
        }
      },
      deployment_config: deployment_config || {
        environment: 'staging',
        rollout_strategy: 'immediate',
        validation_required: true,
        auto_monitoring: true
      },
      upload_requirements: upload_requirements || {
        s3_bucket: 'email-makers-assets',
        cdn_distribution: true,
        compression_enabled: true,
        versioning_enabled: true
      },
      testing_requirements: testing_requirements || {
        visual_regression: true,
        performance_benchmarks: true,
        cross_client_validation: true,
        screenshot_comparison: true
      },
      campaign_context: campaign_context || {
        campaign_id: `campaign_${Date.now()}`,
        folder_path: `campaigns/campaign_${Date.now()}`,
        performance_session: `session_${Date.now()}`,
        deployment_target: 'production'
      }
    };

    // Use the new OpenAI Agents SDK delivery specialist agent
    const startTime = Date.now();
    
    // Import and use the agent runner
    const { run } = await import('@openai/agents');
    
    // Create prompt for the agent
    const prompt = `Finalize email campaign delivery:

**Task Type:** ${task_type}
**Email Package:**
- HTML Output: ${agentInput.email_package.html_output ? 'Available' : 'Missing'}
- MJML Source: ${agentInput.email_package.mjml_source ? 'Available' : 'Missing'}
- Quality Score: ${agentInput.email_package.quality_score}

**Deployment Configuration:**
- Environment: ${agentInput.deployment_config?.environment}
- Strategy: ${agentInput.deployment_config?.rollout_strategy}

**Campaign Context:**
- Campaign ID: ${agentInput.campaign_context?.campaign_id}
- Folder Path: ${agentInput.campaign_context?.folder_path}

**Instructions:**
1. Process the email package for final delivery
2. Handle asset uploads and deployment
3. Generate screenshots and visual tests
4. Create final deliverable package
5. Ensure all quality checks are met

Please execute the delivery workflow and provide comprehensive results.`;

    console.log('🚀 Running Delivery Specialist Agent with OpenAI Agents SDK...');
    console.log('📋 Agent Input Summary:', {
      task_type: agentInput.task_type,
      email_package_available: !!agentInput.email_package,
      deployment_environment: agentInput.deployment_config?.environment,
      campaign_id: agentInput.campaign_context?.campaign_id
    });

    // Run the agent with the prepared input
    const result = await run(deliverySpecialistAgent, prompt, {
      context: {
        agentInput,
        apiCall: true,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
      }
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('✅ Delivery Specialist completed successfully');
    console.log('📊 Processing time:', processingTime, 'ms');

    // Parse the agent response
    let deliveryResults;
    try {
      // Try to extract structured data from the response
      if (typeof result === 'object' && result !== null) {
        deliveryResults = result;
      } else if (typeof result === 'string') {
        // Try to parse JSON from string response
        const stringResult = result as string;
        const jsonMatch = stringResult.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          deliveryResults = JSON.parse(jsonMatch[1]);
        } else {
          deliveryResults = { message: stringResult, raw_output: stringResult };
        }
      } else {
        deliveryResults = { message: 'Delivery completed', raw_output: result };
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse agent response as JSON, using raw output');
      deliveryResults = { 
        message: 'Delivery completed', 
        raw_output: result,
        parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      };
    }

    // Prepare successful response
    const response = {
      success: true,
      task_type,
      results: deliveryResults,
      processing_time_ms: processingTime,
      agent_info: {
        name: 'Delivery Specialist',
        version: 'OpenAI Agents SDK',
        model: 'gpt-4o-mini'
      },
      input_summary: {
        task_type: agentInput.task_type,
        email_package_available: !!agentInput.email_package,
        deployment_environment: agentInput.deployment_config?.environment,
        campaign_id: agentInput.campaign_context?.campaign_id
      },
      timestamp: new Date().toISOString()
    };

    console.log('📋 Final Response Summary:', {
      success: response.success,
      task_type: response.task_type,
      processing_time: response.processing_time_ms,
      has_results: !!response.results
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ DeliverySpecialist API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      agent_info: {
        name: 'Delivery Specialist',
        version: 'OpenAI Agents SDK',
        model: 'gpt-4o-mini'
      }
    }, { status: 500 });
  }
} 