/**
 * IMPROVED Agent Run API Endpoint
 * Uses OpenAI Agents SDK v2 with proper tracing and handoff configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { Agent, run } from '@openai/agents';
import { generateTraceId, addTraceContext } from '../../../../agent/utils/tracing-utils';
import { createEmailCampaignOrchestratorImproved } from '../../../../agent/modules/specialist-agents-improved';
import { validateAgentRequest } from '../../../../agent/validators/agent-request-validator';
import { getLogger } from '../../../../shared/utils/logger';

const logger = getLogger({ component: 'agent-run-api' });

export async function POST(request: NextRequest) {
  const traceId = generateTraceId();
  
  try {
    // Add initial trace context
    addTraceContext(traceId, {
      endpoint: '/api/agent/run-improved',
      method: 'POST',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    });

    const body = await request.json();
    
    // Validate request
    const validationResult = await validateAgentRequest(body);
    if (!validationResult.isValid) {
      logger.error('Invalid agent request', { errors: validationResult.errors, traceId });
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validationResult.errors,
          traceId 
        },
        { status: 400 }
      );
    }

    const { task_type, input, context = {}, threadId } = body;

    // Create orchestrator with all specialist agents
    const orchestratorSystem = await createEmailCampaignOrchestratorImproved();
    
    // Add trace context for agent creation
    addTraceContext(traceId, {
      agentsCreated: Object.keys(orchestratorSystem).length,
      taskType: task_type,
      hasContext: Object.keys(context).length > 0
    });

    // Use orchestrator for all tasks - it will route to appropriate specialists
    const selectedAgent = orchestratorSystem.orchestrator;
    const agentName = 'Email Campaign Orchestrator';

    logger.info(`Selected agent: ${agentName} for task: ${task_type}`, { traceId });

    // Add trace context for agent selection
    addTraceContext(traceId, {
      selectedAgent: agentName,
      taskType: task_type,
      executionStarted: new Date().toISOString()
    });

    // Execute agent with proper input format - using OpenAI Agents SDK run() function
    const inputString = typeof input === 'string' ? input : JSON.stringify(input);
    const result = await run(selectedAgent, inputString);

    // Add success trace context
    addTraceContext(traceId, {
      status: 'success',
      executionCompleted: new Date().toISOString(),
      resultSize: JSON.stringify(result).length
    });

    logger.info(`Agent execution completed successfully`, { 
      traceId, 
      agentName, 
      taskType: task_type 
    });

    return NextResponse.json({
      success: true,
      result: result,
      agent: agentName,
      traceId,
      taskType: task_type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Add error trace context
    addTraceContext(traceId, {
      status: 'error',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      failedAt: new Date().toISOString()
    });

    logger.error('Agent execution failed', { 
      error: errorMessage, 
      traceId,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        traceId,
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
  const traceId = generateTraceId();
  
  try {
    // Test orchestrator creation
    const orchestratorSystem = await createEmailCampaignOrchestratorImproved();
    
    // Verify all agents are properly configured
    const agentStatus = {
      orchestrator: orchestratorSystem.orchestrator ? 'available' : 'unavailable',
      contentSpecialist: orchestratorSystem.contentSpecialist ? 'available' : 'unavailable',
      designSpecialist: orchestratorSystem.designSpecialist ? 'available' : 'unavailable',
      qualitySpecialist: orchestratorSystem.qualitySpecialist ? 'available' : 'unavailable',
      deliverySpecialist: orchestratorSystem.deliverySpecialist ? 'available' : 'unavailable'
    };

    // Test handoff configuration
    const handoffTests = {
      orchestratorToContent: orchestratorSystem.orchestrator && orchestratorSystem.contentSpecialist,
      contentToDesign: orchestratorSystem.contentSpecialist && orchestratorSystem.designSpecialist,
      designToQuality: orchestratorSystem.designSpecialist && orchestratorSystem.qualitySpecialist,
      qualityToDelivery: orchestratorSystem.qualitySpecialist && orchestratorSystem.deliverySpecialist
    };

    addTraceContext(traceId, {
      endpoint: '/api/agent/run-improved',
      method: 'GET',
      agentStatus,
      handoffTests,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      status: 'healthy',
      agents: agentStatus,
      handoffs: handoffTests,
      traceId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    addTraceContext(traceId, {
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        traceId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 