/**
 * IMPROVED Agent Run API Endpoint - OpenAI SDK Compatible
 * Uses EmailMakersAgent with Orchestrator + SDK handoffs
 * 
 * IMPORTANT: This endpoint requires campaign context to be provided.
 * It no longer creates automatic "api_campaign_*" folders.
 * Use the orchestrator workflow to create proper campaign structure first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailMakersAgent, getSystemInfo } from '../../../../agent/main-agent';
import { getContextManager } from '../../../../agent/core/context-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simple validation
    if (!body.task_type || !body.input) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: task_type and input'
        },
        { status: 400 }
      );
    }

    const { task_type, input, context = {}, /* _threadId */ } = body;

    console.log('\n🚀 === AGENT EXECUTION STARTED (FIXED JSON PARSING) ===');
    console.log(`📋 Task Type: ${task_type}`);
    console.log(`📝 Input: ${typeof input === 'object' ? JSON.stringify(input) : input}`);
    console.log(`🔧 Context:`, context);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    // Create EmailMakersAgent with Orchestrator (REQUIRED)
    console.log('🏗️ Creating EmailMakersAgent with Orchestrator...');
    const agent = new EmailMakersAgent();
    await agent.initialize();
    console.log('✅ EmailMakersAgent initialized successfully');
    
    // Prepare request string
    const requestString = typeof input === 'string' ? input : 
                         typeof input === 'object' && input.topic ? input.topic :
                         JSON.stringify(input);

    console.log(`\n🎯 Processing request: "${requestString}"`);
    console.log('🔄 Using Orchestrator → Data Collection → Content → Design → Quality → Delivery');

    // Execute with enhanced context and tracing
    console.log('\n🤖 Starting agent execution with FIXED JSON parsing...');
    const startTime = Date.now();
    console.log(`⏱️  Execution started at: ${new Date().toISOString()}`);
    
    const result = await agent.processRequest(requestString, {
      traceId: `api-${Date.now()}`,
      campaignId: context.campaignId, // Remove auto-generation, only use provided campaignId
      campaignPath: context.campaignPath,
      metadata: {
        // Map metadata from both body.metadata and input.metadata for flexibility
        campaignName: body.metadata?.campaignName || body.metadata?.campaign_name || 
                     input.metadata?.campaign_name || input.metadata?.campaignName,
        brand: body.metadata?.brand || input.metadata?.brand,
        language: body.metadata?.language || input.metadata?.language,
        campaignType: body.metadata?.campaignType || body.metadata?.type || 
                     input.metadata?.type || input.metadata?.campaignType,
        
        // API metadata
        taskType: task_type,
        endpoint: '/api/agent/run-improved',
        inputType: typeof input,
        apiRequest: true,
        validationLevel: context.validationLevel || 'standard',
        qualityThreshold: context.qualityThreshold || 85,
        ...context
      },
      context: {
        apiEndpoint: '/api/agent/run-improved',
        httpMethod: 'POST',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        clientIp: request.headers.get('x-forwarded-for') || 'Unknown',
        ...context
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`\n✅ Agent execution completed successfully in ${executionTime}ms`);
    console.log(`🎯 System: EmailMakersAgent with FIXED JSON parsing`);
    console.log(`📋 Task Type: ${task_type}`);
    console.log(`📊 Result type: ${typeof result}`);
    
    // Log context manager statistics
    const contextManager = getContextManager();
    console.log(`📊 Context Manager: ${contextManager ? 'Active' : 'Inactive'}`);
    
    // Log result summary
    if (result && typeof result === 'object') {
      console.log('\n📈 EXECUTION SUMMARY:');
      if (result.finalOutput) {
        console.log(`📤 Final output: ${typeof result.finalOutput === 'string' ? result.finalOutput.slice(0, 100) + '...' : 'Complex output'}`);
      }
      if (result.state) {
        console.log(`🔧 State available: ${typeof result.state}`);
      }
      console.log(`🔧 Available properties: ${Object.keys(result).join(', ')}`);
    }
    
    console.log('\n🏁 === AGENT EXECUTION COMPLETED ===\n');

    return NextResponse.json({
      success: true,
      result: result,
      system: 'EmailMakersAgent',
      architecture: 'OpenAI SDK Handoffs with Fixed JSON Parsing',
      taskType: task_type,
      executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === AGENT EXECUTION FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`📍 Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);
    console.error('🔚 === ERROR END ===\n');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('\n🔍 === HEALTH CHECK STARTED (SDK SYSTEM) ===');
    
    // Get system info from new architecture
    console.log('🏗️  Testing EmailMakersAgent system...');
    const systemInfo = getSystemInfo();
    console.log('✅ System info retrieved');
    
    console.log('🤖 System Status:');
    console.log(`   ✅ System: ${systemInfo.system}`);
    console.log(`   ✅ Version: ${systemInfo.version}`);
    console.log(`   ✅ Architecture: ${systemInfo.architecture}`);
    
    console.log('\n✅ === HEALTH CHECK COMPLETED ===');
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      system: systemInfo.system,
      version: systemInfo.version,
      architecture: systemInfo.architecture,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === HEALTH CHECK FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`📍 Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error('🔚 === ERROR END ===\n');
    
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}