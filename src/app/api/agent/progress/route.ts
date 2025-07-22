import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/agent/progress/:traceId
 * Real-time progress tracking for 4-agent pipeline
 */

interface AgentProgress {
  agent: 'content_specialist' | 'design_specialist' | 'quality_specialist' | 'delivery_specialist';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  start_time?: number;
  end_time?: number;
  current_operation?: string;
  confidence_score?: number;
  error?: string;
}

interface PipelineProgress {
  trace_id: string;
  overall_progress: number;
  current_agent: string;
  agents: AgentProgress[];
  status: 'initializing' | 'running' | 'completed' | 'failed';
  start_time: number;
  estimated_completion?: number;
  error?: string;
}

// In-memory storage for progress tracking (in production, use Redis or database)
const progressCache = new Map<string, PipelineProgress>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const traceId = searchParams.get('traceId');

    if (!traceId) {
      return NextResponse.json({
        error: 'Missing traceId parameter',
        message: 'Trace ID is required for progress tracking',
        code: 'MISSING_TRACE_ID'
      }, { status: 400 });
    }

    // Validate trace ID format
    if (!/^create_\d+_[a-zA-Z0-9]{9}$/.test(traceId)) {
      return NextResponse.json({
        error: 'Invalid trace ID format',
        message: 'Trace ID must match expected format',
        code: 'INVALID_TRACE_ID'
      }, { status: 400 });
    }

    // Get progress from cache or create initial state
    let progress = progressCache.get(traceId);

    if (!progress) {
      // Initialize progress for new trace
      progress = {
        trace_id: traceId,
        overall_progress: 0,
        current_agent: 'content_specialist',
        status: 'initializing',
        start_time: Date.now(),
        agents: [
          {
            agent: 'content_specialist',
            status: 'pending',
            progress_percentage: 0
          },
          {
            agent: 'design_specialist', 
            status: 'pending',
            progress_percentage: 0
          },
          {
            agent: 'quality_specialist',
            status: 'pending',
            progress_percentage: 0
          },
          {
            agent: 'delivery_specialist',
            status: 'pending',
            progress_percentage: 0
          }
        ]
      };
      progressCache.set(traceId, progress);
    }

    // Simulate real-time progress updates (in production, this would come from actual agent execution)
    updateSimulatedProgress(progress);

    return NextResponse.json({
      success: true,
      progress: progress
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Agent progress tracking error:', error);
    
    // Enhanced error response with context
    return NextResponse.json({
      error: 'Failed to get agent progress',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'PROGRESS_TRACKING_ERROR',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : null,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      } : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trace_id, agent, status, progress_percentage, current_operation, confidence_score, error } = body;

    if (!trace_id || !agent) {
      return NextResponse.json({
        error: 'Missing required fields: trace_id, agent',
        message: 'Both trace_id and agent are required for progress updates',
        code: 'MISSING_REQUIRED_FIELDS',
        required_fields: ['trace_id', 'agent']
      }, { status: 400 });
    }

    // Validate agent type
    const validAgents = ['content_specialist', 'design_specialist', 'quality_specialist', 'delivery_specialist'];
    if (!validAgents.includes(agent)) {
      return NextResponse.json({
        error: 'Invalid agent type',
        message: `Agent must be one of: ${validAgents.join(', ')}`,
        code: 'INVALID_AGENT_TYPE',
        valid_agents: validAgents
      }, { status: 400 });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
          valid_statuses: validStatuses
        }, { status: 400 });
      }
    }

    // Validate progress percentage if provided
    if (progress_percentage !== undefined && (progress_percentage < 0 || progress_percentage > 100)) {
      return NextResponse.json({
        error: 'Invalid progress percentage',
        message: 'Progress percentage must be between 0 and 100',
        code: 'INVALID_PROGRESS_PERCENTAGE'
      }, { status: 400 });
    }

    // Get existing progress or create new
    let progress = progressCache.get(trace_id) || {
      trace_id,
      overall_progress: 0,
      current_agent: agent,
      status: 'running' as const,
      start_time: Date.now(),
      agents: [
        { agent: 'content_specialist', status: 'pending' as const, progress_percentage: 0 },
        { agent: 'design_specialist', status: 'pending' as const, progress_percentage: 0 },
        { agent: 'quality_specialist', status: 'pending' as const, progress_percentage: 0 },
        { agent: 'delivery_specialist', status: 'pending' as const, progress_percentage: 0 }
      ]
    };

    // Update specific agent progress
    const agentIndex = progress.agents.findIndex(a => a.agent === agent);
    if (agentIndex !== -1) {
      progress.agents[agentIndex] = {
        ...progress.agents[agentIndex],
        status: status || progress.agents[agentIndex].status,
        progress_percentage: progress_percentage !== undefined ? progress_percentage : progress.agents[agentIndex].progress_percentage,
        current_operation,
        confidence_score,
        error,
        start_time: (progress.agents[agentIndex] as AgentProgress).start_time || (status === 'in_progress' ? Date.now() : undefined),
        end_time: status === 'completed' || status === 'failed' ? Date.now() : undefined
      };
    }

    // Update overall progress
    progress.current_agent = agent;
    progress.overall_progress = Math.round(
      progress.agents.reduce((sum, agent) => sum + agent.progress_percentage, 0) / 4
    );

    // Update pipeline status
    if (progress.agents.every(a => a.status === 'completed')) {
      progress.status = 'completed';
    } else if (progress.agents.some(a => a.status === 'failed')) {
      progress.status = 'failed';
      (progress as any).error = (progress.agents.find(a => a.status === 'failed') as AgentProgress)?.error;
    } else {
      progress.status = 'running';
    }

    // Estimate completion time
    if (progress.overall_progress > 0) {
      const elapsed = Date.now() - progress.start_time;
      const estimatedTotal = (elapsed / progress.overall_progress) * 100;
      (progress as PipelineProgress).estimated_completion = progress.start_time + estimatedTotal;
    }

    progressCache.set(trace_id, progress);

    return NextResponse.json({
      success: true,
      progress: progress
    });

  } catch (error) {
    console.error('❌ Agent progress update error:', error);
    
    // Enhanced error response with context
    return NextResponse.json({
      error: 'Failed to update agent progress',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'PROGRESS_UPDATE_ERROR',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : null,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      } : undefined
    }, { status: 500 });
  }
}

// Simulate realistic progress updates for demo purposes with error scenarios
function updateSimulatedProgress(progress: PipelineProgress) {
  if (progress.status === 'completed' || progress.status === 'failed') {
    return;
  }

  // Simulate random failures for testing (1% chance)
  if (Math.random() < 0.01) {
    const failureReasons = [
      'OpenAI API rate limit exceeded',
      'Figma API connection timeout',
      'MJML compilation failed',
      'Email validation service unavailable'
    ];
    
    progress.status = 'failed';
    progress.error = failureReasons[Math.floor(Math.random() * failureReasons.length)];
    
    // Mark current agent as failed
    const currentAgent = progress.agents.find(a => a.status === 'in_progress');
    if (currentAgent) {
      currentAgent.status = 'failed';
      currentAgent.error = progress.error;
    }
    
    return;
  }

  const elapsed = Date.now() - progress.start_time;
  const targetDuration = 30000; // 30 seconds total pipeline

  // Agent timings (cumulative)
  const agentTimings = {
    content_specialist: 0.3,    // 0-30% (0-9s)
    design_specialist: 0.6,     // 30-60% (9-18s)  
    quality_specialist: 0.85,   // 60-85% (18-25.5s)
    delivery_specialist: 1.0    // 85-100% (25.5-30s)
  };

  const progressRatio = Math.min(elapsed / targetDuration, 1);

  // Update agent statuses based on timing
  progress.agents.forEach((agent, index) => {
    const agentKeys = (Object || {}).keys(agentTimings) as Array<keyof typeof agentTimings>;
    const agentKey = agentKeys[index];
    const agentThreshold = agentTimings[agentKey];
    const prevThreshold = index > 0 ? agentTimings[agentKeys[index - 1]] : 0;

    if (progressRatio >= agentThreshold) {
      // Agent completed
      agent.status = 'completed';
      agent.progress_percentage = 100;
      agent.confidence_score = 85 + Math.random() * 15; // 85-100%
    } else if (progressRatio > prevThreshold) {
      // Agent in progress
      agent.status = 'in_progress';
      const agentProgressRatio = (progressRatio - prevThreshold) / (agentThreshold - prevThreshold);
      agent.progress_percentage = Math.round(agentProgressRatio * 100);
      
      // Set current operation based on agent
      switch (agent.agent) {
        case 'content_specialist':
          agent.current_operation = agentProgressRatio < 0.5 ? 'Анализ брифа и целевой аудитории' : 'Генерация контента и заголовков';
          break;
        case 'design_specialist':
          agent.current_operation = agentProgressRatio < 0.5 ? 'Извлечение токенов дизайна из Figma' : 'Создание MJML макета';
          break;
        case 'quality_specialist':
          agent.current_operation = agentProgressRatio < 0.5 ? 'Проверка качества контента' : 'Валидация HTML и совместимости';
          break;
        case 'delivery_specialist':
          agent.current_operation = agentProgressRatio < 0.5 ? 'Оптимизация для почтовых клиентов' : 'Финальная валидация и сохранение';
          break;
      }
      
      progress.current_agent = agent.agent;
    } else {
      // Agent pending
      agent.status = 'pending';
      agent.progress_percentage = 0;
    }
  });

  // Update overall progress
  progress.overall_progress = Math.round(progressRatio * 100);
  progress.status = progressRatio >= 1 ? 'completed' : 'running';

  if (progressRatio >= 1) {
    progress.estimated_completion = Date.now();
  } else if (progress.overall_progress > 0) {
    const estimatedTotal = (elapsed / progressRatio);
    progress.estimated_completion = progress.start_time + estimatedTotal;
  }
}

// Cleanup old progress entries periodically
setInterval(() => {
  const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
  for (const [traceId, progress] of progressCache.entries()) {
    if (progress.start_time < cutoff) {
      progressCache.delete(traceId);
    }
  }
}, 300000); // Cleanup every 5 minutes