import { NextRequest, NextResponse } from 'next/server';
import { LogService } from './services/log-service';
import { AnalyticsService } from './services/analytics-service';
import { MetricsService } from './services/metrics-service';
import { 
  LogFilters, 
  SearchConfig, 
  AnalysisConfig,
  ProfilingConfig 
} from './types/log-types';

// Initialize services
const logService = new LogService();
const analyticsService = new AnalyticsService();
const metricsService = new MetricsService();

/**
 * GET /api/agent/logs
 * Retrieve agent logs with filtering and analysis options
 */
export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_logs';

    switch (action) {
      case 'get_logs':
        return await handleGetLogs(searchParams);
      
      case 'get_metrics':
        return await handleGetMetrics(searchParams);
      
      case 'get_traces':
        return await handleGetTraces();
      
      case 'search':
        return await handleSearch(searchParams);
      
      case 'analyze':
        return await handleAnalyze(searchParams);
      
      case 'export':
        return await handleExport(searchParams);
      
      case 'performance':
        return await handlePerformanceAnalysis(searchParams);
      
      case 'bottlenecks':
        return await handleBottlenecks(searchParams);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/agent/logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/logs
 * Add log entries, start profiling, or perform other operations
 */
export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'add_log':
        return await handleAddLog(body);
      
      case 'clear_logs':
        return await handleClearLogs(body);
      
      case 'start_profiling':
        return await handleStartProfiling(body);
      
      case 'stop_profiling':
        return await handleStopProfiling(body);
      
      case 'debug_agent':
        return await handleDebugAgent(body);
      
      case 'trace_execution':
        return await handleTraceExecution(body);
      
      case 'monitor_resources':
        return await handleMonitorResources(body);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in POST /api/agent/logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler functions

async function handleGetLogs(searchParams: URLSearchParams) {
  const filters: LogFilters = {
    level: searchParams.get('level') || undefined,
    limit: parseInt(searchParams.get('limit') || '100'),
    since: searchParams.get('since'),
    tool: searchParams.get('tool'),
    agent: searchParams.get('agent') || undefined,
    traceId: searchParams.get('traceId') || undefined
  };

  const response = await logService.getAgentLogs(filters);
  return NextResponse.json(response);
}

async function handleGetMetrics(searchParams: URLSearchParams) {
  const agentId = searchParams.get('agent_id') || undefined;
  const timeWindowMinutes = parseInt(searchParams.get('time_window_minutes') || '60');
  const metricTypes = searchParams.get('metric_types')?.split(',') || undefined;

  const metrics = await metricsService.getPerformanceMetrics({
    agent_id: agentId,
    time_window_minutes: timeWindowMinutes,
    metric_types: metricTypes
  });

  return NextResponse.json(metrics);
}

async function handleGetTraces() {
  const traces = await logService.getActiveTraces();
  return NextResponse.json({
    success: true,
    traces,
    count: traces.length
  });
}

async function handleSearch(searchParams: URLSearchParams) {
  const query = searchParams.get('query');
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  const searchConfig: SearchConfig = {
    query,
    fuzzy: searchParams.get('fuzzy') === 'true',
    highlight: searchParams.get('highlight') === 'true',
    sort: (searchParams.get('sort') as 'asc' | 'desc') || 'desc',
    limit: parseInt(searchParams.get('limit') || '100'),
    offset: parseInt(searchParams.get('offset') || '0')
  };

  const results = await analyticsService.performAdvancedSearch(searchConfig);
  return NextResponse.json(results);
}

async function handleAnalyze(searchParams: URLSearchParams) {
  const filters: LogFilters = {
    level: searchParams.get('level') || undefined,
    agent: searchParams.get('agent') || undefined,
    tool: searchParams.get('tool') || undefined,
    startTime: searchParams.get('start_time') || undefined,
    endTime: searchParams.get('end_time') || undefined
  };

  const patterns = await analyticsService.analyzeLogPatterns(filters);
  return NextResponse.json(patterns);
}

async function handleExport(searchParams: URLSearchParams) {
  const format = searchParams.get('format') || 'json';
  const filters: LogFilters = {
    level: searchParams.get('level') || undefined,
    agent: searchParams.get('agent') || undefined,
    tool: searchParams.get('tool') || undefined
  };

  const exportData = await logService.exportFilteredLogs(filters, format);
  
  const contentType = format === 'json' ? 'application/json' : 
                     format === 'csv' ? 'text/csv' : 'text/plain';
  
  return new NextResponse(exportData, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="agent-logs.${format}"`
    }
  });
}

async function handlePerformanceAnalysis(searchParams: URLSearchParams) {
  const analysisConfig: AnalysisConfig = {
    agent_id: searchParams.get('agent_id') || undefined,
    time_range: searchParams.get('start_time') && searchParams.get('end_time') ? {
      start: searchParams.get('start_time')!,
      end: searchParams.get('end_time')!
    } : undefined,
    include_trends: searchParams.get('include_trends') !== 'false',
    include_recommendations: searchParams.get('include_recommendations') !== 'false'
  };

  const analysis = await metricsService.analyzeAgentPerformance(analysisConfig);
  return NextResponse.json(analysis);
}

async function handleBottlenecks(searchParams: URLSearchParams) {
  const detectionConfig = {
    agent_id: searchParams.get('agent_id') || undefined,
    time_range: searchParams.get('start_time') && searchParams.get('end_time') ? {
      start: searchParams.get('start_time')!,
      end: searchParams.get('end_time')!
    } : undefined,
    severity_threshold: (searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical') || 'medium'
  };

  const bottlenecks = await metricsService.detectBottlenecks(detectionConfig);
  return NextResponse.json({
    success: true,
    bottlenecks,
    count: bottlenecks.length
  });
}

async function handleAddLog(body: any) {
  const { traceId, level, message, agent, tool, details } = body;
  
  if (!traceId || !level || !message) {
    return NextResponse.json(
      { error: 'traceId, level, and message are required' },
      { status: 400 }
    );
  }

  await logService.addLogEntry({
    traceId,
    level,
    message,
    agent,
    tool,
    details
  });

  return NextResponse.json({ success: true });
}

async function handleClearLogs(body: any) {
  const { filters } = body;
  await logService.clearLogs(filters);
  return NextResponse.json({ success: true });
}

async function handleStartProfiling(body: any) {
  const { config } = body;
  
  if (!config || !config.agent_id) {
    return NextResponse.json(
      { error: 'Profiling config with agent_id is required' },
      { status: 400 }
    );
  }

  const profilingConfig: ProfilingConfig = {
    agent_id: config.agent_id,
    duration_ms: config.duration_ms,
    sample_interval_ms: config.sample_interval_ms,
    include_memory: config.include_memory,
    include_cpu: config.include_cpu,
    include_network: config.include_network,
    include_call_stack: config.include_call_stack,
    filters: config.filters
  };

  const profilingId = await metricsService.startPerformanceProfiling(profilingConfig);
  
  return NextResponse.json({
    success: true,
    profiling_id: profilingId
  });
}

async function handleStopProfiling(body: any) {
  const { profiling_id } = body;
  
  if (!profiling_id) {
    return NextResponse.json(
      { error: 'profiling_id is required' },
      { status: 400 }
    );
  }

  const profile = await metricsService.stopPerformanceProfiling(profiling_id);
  
  if (!profile) {
    return NextResponse.json(
      { error: 'Profiling session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    profile
  });
}

async function handleDebugAgent(body: any) {
  const { agent_id, debug_config } = body;
  
  if (!agent_id) {
    return NextResponse.json(
      { error: 'agent_id is required' },
      { status: 400 }
    );
  }

  const sessionId = await metricsService.debugAgent(agent_id, debug_config || {});
  
  return NextResponse.json({
    success: true,
    session_id: sessionId
  });
}

async function handleTraceExecution(body: any) {
  const { trace_config } = body;
  
  if (!trace_config || !trace_config.agent_id) {
    return NextResponse.json(
      { error: 'trace_config with agent_id is required' },
      { status: 400 }
    );
  }

  const traceResult = await metricsService.traceAgentExecution(trace_config);
  
  return NextResponse.json({
    success: true,
    ...traceResult
  });
}

async function handleMonitorResources(body: any) {
  const { monitoring_config } = body;
  
  const monitoringResult = await metricsService.monitorResources(monitoring_config || {});
  
  return NextResponse.json({
    success: true,
    ...monitoringResult
  });
} 