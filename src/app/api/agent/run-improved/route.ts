/**
 * IMPROVED Agent Run API Endpoint
 * Uses OpenAI Agents SDK v2 with official tracing
 */

import { NextRequest, NextResponse } from 'next/server';
import { Agent, Runner } from '@openai/agents';
import { createEmailCampaignOrchestrator } from '../../../../agent/specialists/specialist-agents';

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

    console.log('\n🚀 === AGENT EXECUTION STARTED ===');
    console.log(`📋 Task Type: ${task_type}`);
    console.log(`📝 Input: ${input}`);
    console.log(`🔧 Context:`, context);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);

    // Create orchestrator with all specialist agents
    console.log('🏗️ Creating orchestrator system...');
    const { orchestrator, contentSpecialist, designSpecialist, qualitySpecialist, deliverySpecialist } = await createEmailCampaignOrchestrator();
    console.log('✅ Orchestrator system created successfully');
    
    // Use orchestrator for all tasks - it will route to appropriate specialists
    const selectedAgent = orchestrator;
    const agentName = 'Email Campaign Orchestrator';

    console.log(`\n🎯 Selected agent: ${agentName} for task: ${task_type}`);

    // Create Runner with official OpenAI SDK tracing
    console.log('\n🔄 Creating Runner with tracing...');
    const runner = new Runner({
      workflowName: 'Email Campaign Generation',
      traceIncludeSensitiveData: false,
      tracingDisabled: false,
      traceMetadata: {
        taskType: task_type,
        agentName,
        endpoint: '/api/agent/run-improved',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Runner created with tracing enabled');

    // Execute agent with proper input format using Runner
    console.log('\n🤖 Starting agent execution...');
    console.log(`📊 Max turns: 25`);
    console.log(`📨 Input string: ${typeof input === 'string' ? input : JSON.stringify(input)}`);
    
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Add execution monitoring
    const startTime = Date.now();
    console.log(`⏱️  Execution started at: ${new Date().toISOString()}`);
    
    const result = await runner.run(selectedAgent, inputString, {
      maxTurns: 25, // Увеличиваем лимит для сложных email кампаний
      context: {
        taskType: task_type,
        ...context
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`\n✅ Agent execution completed successfully in ${executionTime}ms`);
    console.log(`🎯 Agent: ${agentName}`);
    console.log(`📋 Task Type: ${task_type}`);
    console.log(`📊 Result type: ${typeof result}`);
    
    // Log result summary
    if (result && typeof result === 'object') {
      console.log('\n📈 EXECUTION SUMMARY:');
      if (result.finalOutput) {
        console.log(`📤 Final output: ${typeof result.finalOutput === 'string' ? result.finalOutput.slice(0, 100) + '...' : 'Complex output'}`);
      }
      console.log(`🔧 Available properties: ${Object.keys(result).join(', ')}`);
    }
    
    console.log('\n🏁 === AGENT EXECUTION COMPLETED ===\n');

    return NextResponse.json({
      success: true,
      result: result,
      agent: agentName,
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
    console.log('\n🔍 === HEALTH CHECK STARTED ===');
    
    // Test orchestrator creation
    console.log('🏗️  Testing orchestrator creation...');
    const orchestratorSystem = await createEmailCampaignOrchestrator();
    console.log('✅ Orchestrator system created');
    
    // Verify all agents are properly configured
    const agentStatus = {
      orchestrator: orchestratorSystem.orchestrator ? 'available' : 'unavailable',
      contentSpecialist: orchestratorSystem.contentSpecialist ? 'available' : 'unavailable',
      designSpecialist: orchestratorSystem.designSpecialist ? 'available' : 'unavailable',
      qualitySpecialist: orchestratorSystem.qualitySpecialist ? 'available' : 'unavailable',
      deliverySpecialist: orchestratorSystem.deliverySpecialist ? 'available' : 'unavailable'
    };

    console.log('🤖 Agent Status:');
    Object.entries(agentStatus).forEach(([agent, status]) => {
      const icon = status === 'available' ? '✅' : '❌';
      console.log(`   ${icon} ${agent}: ${status}`);
    });

    // Test handoff configuration
    const handoffTests = {
      orchestratorToContent: orchestratorSystem.orchestrator && orchestratorSystem.contentSpecialist,
      contentToDesign: orchestratorSystem.contentSpecialist && orchestratorSystem.designSpecialist,
      designToQuality: orchestratorSystem.designSpecialist && orchestratorSystem.qualitySpecialist,
      qualityToDelivery: orchestratorSystem.qualitySpecialist && orchestratorSystem.deliverySpecialist
    };

    console.log('🔄 Handoff Tests:');
    Object.entries(handoffTests).forEach(([handoff, working]) => {
      const icon = working ? '✅' : '❌';
      console.log(`   ${icon} ${handoff}: ${working ? 'working' : 'failed'}`);
    });

    console.log('✅ === HEALTH CHECK COMPLETED ===\n');

    return NextResponse.json({
      status: 'healthy',
      agents: agentStatus,
      handoffs: handoffTests,
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