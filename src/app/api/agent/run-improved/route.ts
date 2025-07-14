/**
 * IMPROVED Agent Run API Endpoint - OpenAI SDK Compatible
 * Uses EmailMakersAgent with Orchestrator + SDK handoffs
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

    const { task_type, input, context = {}, threadId } = body;

    console.log('\n🚀 === AGENT EXECUTION STARTED (SDK HANDOFFS) ===');
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
    console.log('\n🤖 Starting agent execution with enhanced context management...');
    const startTime = Date.now();
    console.log(`⏱️  Execution started at: ${new Date().toISOString()}`);
    
    const result = await agent.processRequest(requestString, {
      traceId: `api-${Date.now()}`,
      campaignId: context.campaignId || `api_campaign_${Date.now()}`,
      campaignPath: context.campaignPath,
      metadata: {
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
    console.log(`🎯 System: EmailMakersAgent with enhanced context management`);
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
      architecture: 'OpenAI SDK Handoffs',
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
export async function GET(request: NextRequest) {
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
    console.log(`   ✅ Entry Point: ${systemInfo.entryPoint}`);
    console.log(`   ✅ Handoff Chain: ${systemInfo.handoffChain}`);
    console.log(`   ✅ Total Tools: ${systemInfo.totalTools}`);
    console.log(`   ✅ Total Agents: ${systemInfo.totalAgents}`);
    console.log(`   ✅ SDK Compliant: ${systemInfo.sdkCompliant}`);

    // Test agent creation
    console.log('\n🧪 Testing agent creation...');
    const agent = new EmailMakersAgent();
    await agent.initialize();
    console.log('✅ EmailMakersAgent created and initialized');

    // Verify specialists are available
    const specialists = ['data-collection', 'content', 'design', 'quality', 'delivery'];
    const specialistStatus = {};
    
    specialists.forEach(type => {
      try {
        const specialist = agent.getSpecialist(type as 'data-collection' | 'content' | 'design' | 'quality' | 'delivery');
        specialistStatus[type] = specialist ? 'available' : 'unavailable';
      } catch (error) {
        specialistStatus[type] = 'error';
      }
    });

    console.log('🎯 Specialist Status:');
    Object.entries(specialistStatus).forEach(([specialist, status]) => {
      const icon = status === 'available' ? '✅' : '❌';
      console.log(`   ${icon} ${specialist}: ${status}`);
    });

    console.log('✅ === HEALTH CHECK COMPLETED ===\n');

    return NextResponse.json({
      status: 'healthy',
      system: systemInfo.system,
      version: systemInfo.version,
      architecture: systemInfo.architecture,
      entryPoint: systemInfo.entryPoint,
      handoffChain: systemInfo.handoffChain,
      agents: specialistStatus,
      capabilities: systemInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('\n❌ === HEALTH CHECK FAILED ===');
    console.error(`💥 Error: ${errorMessage}`);
    console.error(`⏰ Failed at: ${new Date().toISOString()}`);
    console.error('🔚 === ERROR END ===\n');
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 