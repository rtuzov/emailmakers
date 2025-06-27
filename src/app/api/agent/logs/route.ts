import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/agent/core/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/agent/logs
 * Получить логи работы агента и trace информацию
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'info'; // debug, info, warn, error
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since'); // ISO timestamp
    const tool = searchParams.get('tool'); // filter by specific tool
    const format = searchParams.get('format') || 'json'; // json, text, prometheus

    console.log('🔍 Agent logs request:', { level, limit, since, tool, format });

    // Handle Prometheus metrics format
    if (format === 'prometheus') {
      const metrics = await logger.metrics();
      return new NextResponse(metrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }

    // Get log files from temp directory
    const logsData = await getAgentLogs({ level, limit, since, tool });

    // Get current metrics
    const metricsData = await getAgentMetrics();

    // Get active traces if any
    const tracesData = await getActiveTraces();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      filters: { level, limit, since, tool },
      data: {
        logs: logsData,
        metrics: metricsData,
        traces: tracesData,
        summary: {
          total_logs: logsData.length,
          log_levels: getLogLevelCounts(logsData),
          time_range: getTimeRange(logsData),
          active_traces: tracesData.length
        }
      }
    };

    if (format === 'text') {
      const textOutput = formatLogsAsText(response);
      return new NextResponse(textOutput, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Failed to get agent logs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to retrieve agent logs'
    }, { status: 500 });
  }
}

/**
 * POST /api/agent/logs
 * Очистить логи или изменить уровень логирования
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, level } = body;

    console.log('🔧 Agent logs action:', { action, level });

    let result;
    switch (action) {
      case 'clear':
        result = await clearAgentLogs();
        break;
      case 'set_level':
        result = await setLogLevel(level);
        break;
      case 'export':
        result = await exportLogs(body.format || 'json');
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to execute logs action:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to execute logs action'
    }, { status: 500 });
  }
}

// Helper functions

async function getAgentLogs(filters: {
  level: string;
  limit: number;
  since?: string | null;
  tool?: string | null;
}) {
  try {
    // Try to read from log files in temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    const logFiles = await fs.readdir(tempDir).catch(() => []);
    
    const agentLogFiles = logFiles.filter(file => 
      file.startsWith('agent-') && file.endsWith('.log')
    );

    let allLogs: any[] = [];

    // Read from log files
    for (const logFile of agentLogFiles) {
      try {
        const logPath = path.join(tempDir, logFile);
        const logContent = await fs.readFile(logPath, 'utf-8');
        const logs = logContent.split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return { 
                level: 'info', 
                msg: line, 
                timestamp: new Date().toISOString(),
                source: 'raw'
              };
            }
          });
        allLogs.push(...logs);
      } catch (error) {
        console.warn(`Failed to read log file ${logFile}:`, error);
      }
    }

    // Apply filters
    let filteredLogs = allLogs;

    if (filters.level && filters.level !== 'all') {
      const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
      const minLevel = levelPriority[filters.level as keyof typeof levelPriority] || 1;
      filteredLogs = filteredLogs.filter(log => {
        const logLevel = levelPriority[log.level as keyof typeof levelPriority] || 1;
        return logLevel >= minLevel;
      });
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp || log.time) >= sinceDate
      );
    }

    if (filters.tool) {
      filteredLogs = filteredLogs.filter(log => 
        log.tool === filters.tool || 
        log.msg?.includes(filters.tool) ||
        log.context?.tool === filters.tool
      );
    }

    // Sort by timestamp (newest first) and limit
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp || b.time).getTime() - 
      new Date(a.timestamp || a.time).getTime()
    );

    return filteredLogs.slice(0, filters.limit);

  } catch (error) {
    console.warn('Failed to read agent logs from files:', error);
    return [];
  }
}

async function getAgentMetrics() {
  try {
    const metricsText = await logger.metrics();
    
    // Parse Prometheus metrics to structured format
    const lines = metricsText.split('\n').filter(line => 
      line && !line.startsWith('#')
    );

    const metrics: Record<string, any> = {};
    
    for (const line of lines) {
      const [metricPart, value] = line.split(' ');
      if (metricPart && value) {
        const [name, labelsStr] = metricPart.includes('{') 
          ? metricPart.split('{')
          : [metricPart, ''];
        
        if (!metrics[name]) {
          metrics[name] = [];
        }
        
        const labels = labelsStr ? parsePrometheusLabels(labelsStr.replace('}', '')) : {};
        metrics[name].push({
          labels,
          value: parseFloat(value),
          timestamp: new Date().toISOString()
        });
      }
    }

    return metrics;
  } catch (error) {
    console.warn('Failed to get agent metrics:', error);
    return {};
  }
}

async function getActiveTraces() {
  try {
    // Check for active trace files in temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    const files = await fs.readdir(tempDir).catch(() => []);
    
    const traceFiles = files.filter(file => 
      file.startsWith('trace-') && file.endsWith('.json')
    );

    const traces = [];
    for (const traceFile of traceFiles) {
      try {
        const tracePath = path.join(tempDir, traceFile);
        const traceContent = await fs.readFile(tracePath, 'utf-8');
        const traceData = JSON.parse(traceContent);
        traces.push({
          ...traceData,
          file: traceFile,
          lastModified: (await fs.stat(tracePath)).mtime
        });
      } catch (error) {
        console.warn(`Failed to read trace file ${traceFile}:`, error);
      }
    }

    return traces.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

  } catch (error) {
    console.warn('Failed to get active traces:', error);
    return [];
  }
}

function getLogLevelCounts(logs: any[]) {
  const counts = { debug: 0, info: 0, warn: 0, error: 0 };
  logs.forEach(log => {
    if (counts.hasOwnProperty(log.level)) {
      counts[log.level as keyof typeof counts]++;
    }
  });
  return counts;
}

function getTimeRange(logs: any[]) {
  if (logs.length === 0) return null;
  
  const timestamps = logs
    .map(log => new Date(log.timestamp || log.time))
    .filter(date => !isNaN(date.getTime()));
  
  if (timestamps.length === 0) return null;
  
  timestamps.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    start: timestamps[0].toISOString(),
    end: timestamps[timestamps.length - 1].toISOString(),
    duration: timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()
  };
}

function parsePrometheusLabels(labelsStr: string): Record<string, string> {
  const labels: Record<string, string> = {};
  const pairs = labelsStr.split(',');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      labels[key.trim()] = value.replace(/"/g, '').trim();
    }
  }
  
  return labels;
}

function formatLogsAsText(response: any): string {
  let output = `=== AGENT LOGS REPORT ===\n`;
  output += `Generated: ${response.timestamp}\n`;
  output += `Filters: ${JSON.stringify(response.filters)}\n`;
  output += `Total logs: ${response.data.summary.total_logs}\n\n`;

  // Log levels summary
  output += `=== LOG LEVELS ===\n`;
  Object.entries(response.data.summary.log_levels).forEach(([level, count]) => {
    output += `${level.toUpperCase()}: ${count}\n`;
  });
  output += `\n`;

  // Time range
  if (response.data.summary.time_range) {
    output += `=== TIME RANGE ===\n`;
    output += `Start: ${response.data.summary.time_range.start}\n`;
    output += `End: ${response.data.summary.time_range.end}\n`;
    output += `Duration: ${response.data.summary.time_range.duration}ms\n\n`;
  }

  // Recent logs
  output += `=== RECENT LOGS ===\n`;
  response.data.logs.slice(0, 20).forEach((log: any) => {
    const timestamp = new Date(log.timestamp || log.time).toISOString();
    output += `[${timestamp}] ${log.level.toUpperCase()}: ${log.msg}\n`;
    if (log.tool) output += `  Tool: ${log.tool}\n`;
    if (log.error) output += `  Error: ${log.error}\n`;
    output += `\n`;
  });

  return output;
}

async function clearAgentLogs() {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    const files = await fs.readdir(tempDir).catch(() => []);
    
    const logFiles = files.filter(file => 
      file.startsWith('agent-') && file.endsWith('.log')
    );

    let cleared = 0;
    for (const logFile of logFiles) {
      try {
        await fs.unlink(path.join(tempDir, logFile));
        cleared++;
      } catch (error) {
        console.warn(`Failed to delete log file ${logFile}:`, error);
      }
    }

    return { message: `Cleared ${cleared} log files` };
  } catch (error) {
    throw new Error(`Failed to clear logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function setLogLevel(level: string) {
  // This would typically update the logger configuration
  // For now, we'll just return the requested level
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(level)) {
    throw new Error(`Invalid log level: ${level}. Valid levels: ${validLevels.join(', ')}`);
  }

  // In a real implementation, you'd update the logger configuration
  process.env.LOG_LEVEL = level;
  
  return { message: `Log level set to ${level}` };
}

async function exportLogs(format: string) {
  try {
    const logs = await getAgentLogs({ level: 'debug', limit: 10000, since: null, tool: null });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `agent-logs-export-${timestamp}.${format}`;
    const filepath = path.join(process.cwd(), 'temp', filename);

    let content: string;
    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
    } else {
      content = logs.map(log => 
        `[${log.timestamp || log.time}] ${log.level.toUpperCase()}: ${log.msg}`
      ).join('\n');
    }

    await fs.writeFile(filepath, content, 'utf-8');

    return { 
      message: `Logs exported to ${filename}`,
      filename,
      filepath,
      total_logs: logs.length
    };
  } catch (error) {
    throw new Error(`Failed to export logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 