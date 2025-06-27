/**
 * Performance Monitor Tool - Email-Makers
 * Tracks and reports performance metrics for T1-T11 pipeline
 */

import { ToolResult, handleToolError } from './index';

interface PerformanceMetrics {
  tool_name: string;
  start_time: number;
  end_time: number;
  duration_ms: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

interface PipelinePerformanceReport {
  session_id: string;
  total_duration_ms: number;
  tools_executed: number;
  success_rate: number;
  bottlenecks: string[];
  recommendations: string[];
  tool_metrics: PerformanceMetrics[];
  timestamp: string;
}

interface PerformanceMonitorParams {
  action: 'start_session' | 'log_tool' | 'end_session' | 'get_report';
  session_id?: string | null;
  tool_name?: string | null;
  start_time?: number | null;
  end_time?: number | null;
  success?: boolean | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
}

// In-memory storage for performance data (in production, use Redis/DB)
const performanceSessions = new Map<string, {
  start_time: number;
  metrics: PerformanceMetrics[];
  active: boolean;
}>();

/**
 * Performance Monitor Tool for Email Generation Pipeline
 * Tracks execution times and identifies bottlenecks
 */
export async function performanceMonitor(params: PerformanceMonitorParams): Promise<ToolResult> {
  try {
    console.log(`📊 Performance Monitor: ${params.action}`);

    switch (params.action) {
      case 'start_session':
        return startPerformanceSession();
      
      case 'log_tool':
        return logToolPerformance(params);
      
      case 'end_session':
        return endPerformanceSession(params.session_id!);
      
      case 'get_report':
        return getPerformanceReport(params.session_id!);
      
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }

  } catch (error) {
    return handleToolError('performance_monitor', error);
  }
}

/**
 * Start a new performance monitoring session
 */
function startPerformanceSession(): ToolResult {
  const sessionId = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const startTime = Date.now();
  
  performanceSessions.set(sessionId, {
    start_time: startTime,
    metrics: [],
    active: true
  });
  
  console.log(`📊 Started performance session: ${sessionId}`);
  
  return {
    success: true,
    data: {
      session_id: sessionId,
      start_time: startTime,
      status: 'session_started'
    },
    metadata: {
      action: 'start_session',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Log performance metrics for a specific tool
 */
function logToolPerformance(params: PerformanceMonitorParams): ToolResult {
  if (!params.session_id || !params.tool_name) {
    throw new Error('Session ID and tool name are required for logging');
  }
  
  const session = performanceSessions.get(params.session_id);
  if (!session) {
    throw new Error(`Performance session not found: ${params.session_id}`);
  }
  
  if (!session.active) {
    throw new Error(`Performance session is not active: ${params.session_id}`);
  }
  
  const startTime = params.start_time || Date.now();
  const endTime = params.end_time || Date.now();
  const duration = endTime - startTime;
  
  const metric: PerformanceMetrics = {
    tool_name: params.tool_name,
    start_time: startTime,
    end_time: endTime,
    duration_ms: duration,
    success: params.success ?? true,
    error_message: params.error_message,
    metadata: params.metadata
  };
  
  session.metrics.push(metric);
  
  console.log(`📊 Logged ${params.tool_name}: ${duration}ms (${params.success ? 'success' : 'failed'})`);
  
  return {
    success: true,
    data: {
      session_id: params.session_id,
      tool_logged: params.tool_name,
      duration_ms: duration,
      total_tools: session.metrics.length
    },
    metadata: {
      action: 'log_tool',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * End performance monitoring session and generate report
 */
function endPerformanceSession(sessionId: string): ToolResult {
  const session = performanceSessions.get(sessionId);
  if (!session) {
    throw new Error(`Performance session not found: ${sessionId}`);
  }
  
  session.active = false;
  const endTime = Date.now();
  const totalDuration = endTime - session.start_time;
  
  console.log(`📊 Ended performance session: ${sessionId} (${totalDuration}ms total)`);
  
  return {
    success: true,
    data: {
      session_id: sessionId,
      total_duration_ms: totalDuration,
      tools_executed: session.metrics.length,
      status: 'session_ended'
    },
    metadata: {
      action: 'end_session',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate comprehensive performance report
 */
function getPerformanceReport(sessionId: string): ToolResult {
  const session = performanceSessions.get(sessionId);
  if (!session) {
    throw new Error(`Performance session not found: ${sessionId}`);
  }
  
  const endTime = session.active ? Date.now() : Math.max(...session.metrics.map(m => m.end_time));
  const totalDuration = endTime - session.start_time;
  const successfulTools = session.metrics.filter(m => m.success).length;
  const successRate = session.metrics.length > 0 ? (successfulTools / session.metrics.length) * 100 : 0;
  
  // Identify bottlenecks (tools taking >10% of total time)
  const bottlenecks: string[] = [];
  const recommendations: string[] = [];
  
  session.metrics.forEach(metric => {
    const percentageOfTotal = (metric.duration_ms / totalDuration) * 100;
    if (percentageOfTotal > 10) {
      bottlenecks.push(`${metric.tool_name} (${metric.duration_ms}ms, ${percentageOfTotal.toFixed(1)}%)`);
    }
    
    // Generate recommendations based on performance
    if (metric.tool_name === 'get_figma_assets' && metric.duration_ms > 8000) {
      recommendations.push('Consider caching Figma assets to reduce API call time');
    }
    if (metric.tool_name === 'generate_copy' && metric.duration_ms > 20000) {
      recommendations.push('GPT-4o mini content generation is slow - consider optimizing prompts');
    }
    if (metric.tool_name === 'render_test' && metric.duration_ms > 10000) {
      recommendations.push('Render testing is slow - consider parallel client testing');
    }
  });
  
  // Add general recommendations
  if (totalDuration > 90000) { // >90 seconds
    recommendations.push('Total pipeline time exceeds target (90s) - consider parallel processing');
  }
  if (successRate < 95) {
    recommendations.push('Tool failure rate is high - investigate error handling');
  }
  
  const report: PipelinePerformanceReport = {
    session_id: sessionId,
    total_duration_ms: totalDuration,
    tools_executed: session.metrics.length,
    success_rate: successRate,
    bottlenecks,
    recommendations,
    tool_metrics: session.metrics,
    timestamp: new Date().toISOString()
  };
  
  console.log(`📊 Generated performance report for ${sessionId}`);
  console.log(`   Total: ${totalDuration}ms, Tools: ${session.metrics.length}, Success: ${successRate.toFixed(1)}%`);
  
  return {
    success: true,
    data: report,
    metadata: {
      action: 'get_report',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Get performance benchmarks for comparison
 */
export function getPerformanceBenchmarks(): {
  target_times: Record<string, number>;
  total_target: number;
  quality_thresholds: Record<string, number>;
} {
  return {
    target_times: {
      'get_figma_assets': 8000,      // 8s
      'split_figma_sprite': 3000,    // 3s  
      'get_prices': 5000,            // 5s
      'generate_copy': 18000,        // 18s
      'render_component': 3000,      // 3s
      'render_mjml': 10000,          // 10s
      'diff_html': 2000,             // 2s
      'patch_html': 2000,            // 2s
      'percy_snap': 5000,            // 5s
      'render_test': 8000,           // 8s
      'quality_validation': 5000,    // 5s
      'upload_s3': 3000              // 3s
    },
    total_target: 72000, // 72 seconds total target
    quality_thresholds: {
      success_rate: 95,              // 95% success rate
      bottleneck_threshold: 10,      // 10% of total time
      max_tool_failures: 1          // Max 1 tool failure per session
    }
  };
}

/**
 * Format performance report for human consumption
 */
export function formatPerformanceReport(report: PipelinePerformanceReport): string {
  const benchmarks = getPerformanceBenchmarks();
  
  let output = `📊 PIPELINE PERFORMANCE REPORT\\n`;
  output += `Session: ${report.session_id}\\n`;
  output += `Timestamp: ${report.timestamp}\\n\\n`;
  
  // Overall metrics
  output += `⏱️ OVERALL METRICS\\n`;
  output += `Total Duration: ${report.total_duration_ms}ms (${(report.total_duration_ms / 1000).toFixed(1)}s)\\n`;
  output += `Target Duration: ${benchmarks.total_target}ms (${(benchmarks.total_target / 1000).toFixed(1)}s)\\n`;
  output += `Performance: ${report.total_duration_ms <= benchmarks.total_target ? '✅ ON TARGET' : '⚠️ OVER TARGET'}\\n`;
  output += `Tools Executed: ${report.tools_executed}\\n`;
  output += `Success Rate: ${report.success_rate.toFixed(1)}% ${report.success_rate >= 95 ? '✅' : '❌'}\\n\\n`;
  
  // Tool breakdown
  output += `🔧 TOOL PERFORMANCE\\n`;
  report.tool_metrics.forEach(metric => {
    const target = benchmarks.target_times[metric.tool_name] || 5000;
    const status = metric.success ? '✅' : '❌';
    const timing = metric.duration_ms <= target ? '⏱️' : '⚠️';
    output += `${status} ${timing} ${metric.tool_name}: ${metric.duration_ms}ms (target: ${target}ms)\\n`;
  });
  
  // Bottlenecks
  if (report.bottlenecks.length > 0) {
    output += `\\n🚨 BOTTLENECKS\\n`;
    report.bottlenecks.forEach(bottleneck => {
      output += `• ${bottleneck}\\n`;
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    output += `\\n💡 RECOMMENDATIONS\\n`;
    report.recommendations.forEach(rec => {
      output += `• ${rec}\\n`;
    });
  }
  
  return output;
} 