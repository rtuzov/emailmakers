import fs from 'fs/promises';
import path from 'path';
import { 
  AgentLog, 
  LogEntry, 
  LogFilters, 
  LogsResponse,
  ErrorTrackingData 
} from '../types/log-types';

// In-memory storage for logs (in production, use Redis, ElasticSearch, or similar)
const logsStore = new Map<string, AgentLog[]>();

export class LogService {
  
  /**
   * Add a new log entry
   */
  async addLogEntry(params: {
    traceId: string;
    level: string;
    message: string;
    agent?: string;
    tool?: string;
    details?: any;
  }): Promise<void> {
    const { traceId, level, message, agent, tool, details } = params;
    
    if (!logsStore.has(traceId)) {
      logsStore.set(traceId, []);
    }
    
    const logEntry: AgentLog = {
      timestamp: new Date().toISOString(),
      level: level as 'info' | 'warn' | 'error',
      message,
      agent,
      tool,
      traceId,
      details
    };
    
    logsStore.get(traceId)!.push(logEntry);
    
    // Also track errors for monitoring
    if (level === 'error') {
      await this.trackError({
        errorId: `${traceId}-${Date.now()}`,
        message,
        level: 'error',
        agent: agent || 'unknown',
        tool,
        timestamp: logEntry.timestamp,
        context: details
      });
    }
  }

  /**
   * Get agent logs with filters
   */
  async getAgentLogs(filters: LogFilters): Promise<LogsResponse> {
    const { level, limit = 100, since, tool, agent, traceId } = filters;
    
    let allLogs: AgentLog[] = [];
    
    // Collect logs from all traces or specific trace
    if (traceId) {
      allLogs = logsStore.get(traceId) || [];
    } else {
      for (const logs of logsStore.values()) {
        allLogs.push(...logs);
      }
    }
    
    // Apply filters
    let filteredLogs = allLogs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (tool) {
      filteredLogs = filteredLogs.filter(log => log.tool === tool);
    }
    
    if (agent) {
      filteredLogs = filteredLogs.filter(log => log.agent === agent);
    }
    
    if (since) {
      const sinceDate = new Date(since);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) > sinceDate);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    const limitedLogs = filteredLogs.slice(0, limit);
    
    return {
      success: true,
      logs: limitedLogs,
      total_count: allLogs.length,
      filtered_count: filteredLogs.length,
      trace_id: traceId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear logs with optional filters
   */
  async clearLogs(filters?: LogFilters): Promise<void> {
    if (!filters || Object.keys(filters).length === 0) {
      // Clear all logs
      logsStore.clear();
      return;
    }
    
    // Clear specific logs based on filters
    for (const [traceId, logs] of logsStore.entries()) {
      let filteredLogs = logs;
      
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level !== filters.level);
      }
      
      if (filters.agent) {
        filteredLogs = filteredLogs.filter(log => log.agent !== filters.agent);
      }
      
      if (filters.tool) {
        filteredLogs = filteredLogs.filter(log => log.tool !== filters.tool);
      }
      
      if (filteredLogs.length === 0) {
        logsStore.delete(traceId);
      } else {
        logsStore.set(traceId, filteredLogs);
      }
    }
  }

  /**
   * Export logs in specified format
   */
  async exportFilteredLogs(filters: LogFilters, format: string = 'json'): Promise<string> {
    const logsResponse = await this.getAgentLogs(filters);
    
    if (format === 'json') {
      return JSON.stringify(logsResponse, null, 2);
    } else if (format === 'csv') {
      return this.formatLogsAsCsv(logsResponse.logs);
    } else if (format === 'text') {
      return this.formatLogsAsText(logsResponse);
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Get system logs from files
   */
  async getSystemLogs(): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      const files = await fs.readdir(logsDir);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line) as LogEntry;
              logs.push(logEntry);
            } catch (error) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading system logs:', error);
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get active traces
   */
  async getActiveTraces(): Promise<string[]> {
    return Array.from(logsStore.keys());
  }

  /**
   * Get log level counts
   */
  getLogLevelCounts(logs: AgentLog[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const log of logs) {
      counts[log.level] = (counts[log.level] || 0) + 1;
    }
    
    return counts;
  }

  /**
   * Get time range of logs
   */
  getTimeRange(logs: AgentLog[]): { start: string; end: string } {
    if (logs.length === 0) {
      return { start: '', end: '' };
    }
    
    const timestamps = logs.map(log => new Date(log.timestamp).getTime());
    const start = new Date(Math.min(...timestamps)).toISOString();
    const end = new Date(Math.max(...timestamps)).toISOString();
    
    return { start, end };
  }

  /**
   * Generate sample logs for testing
   */
  generateSampleLogs(traceId: string): AgentLog[] {
    const agents = ['content-specialist', 'design-specialist', 'quality-specialist', 'delivery-specialist'];
    const tools = ['content-generator', 'email-renderer', 'quality-controller', 'delivery-manager'];
    const levels: ('info' | 'warn' | 'error')[] = ['info', 'warn', 'error'];
    const messages = [
      'Agent started processing request',
      'Tool execution completed successfully',
      'Warning: Performance threshold exceeded',
      'Error: Failed to process request',
      'Agent handoff completed',
      'Quality check passed',
      'Content generation finished',
      'Email rendering completed'
    ];
    
    const logs: AgentLog[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      logs.push({
        timestamp: new Date(now - (i * 60000)).toISOString(), // 1 minute intervals
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        agent: agents[Math.floor(Math.random() * agents.length)],
        tool: tools[Math.floor(Math.random() * tools.length)],
        traceId,
        details: {
          duration: Math.floor(Math.random() * 5000),
          status: Math.random() > 0.8 ? 'error' : 'success'
        }
      });
    }
    
    return logs;
  }

  /**
   * Track error for monitoring
   */
  private async trackError(errorData: Partial<ErrorTrackingData>): Promise<void> {
    // In production, this would send to monitoring service
    console.error('Error tracked:', errorData);
  }

  /**
   * Format logs as CSV
   */
  private formatLogsAsCsv(logs: AgentLog[]): string {
    const headers = ['timestamp', 'level', 'message', 'agent', 'tool', 'traceId'];
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.message.replace(/"/g, '""'), // Escape quotes
      log.agent || '',
      log.tool || '',
      log.traceId || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * Format logs as text
   */
  private formatLogsAsText(response: LogsResponse): string {
    let output = `=== Agent Logs (${response.filtered_count}/${response.total_count}) ===\n\n`;
    
    for (const log of response.logs) {
      output += `[${log.timestamp}] ${log.level.toUpperCase()}`;
      if (log.agent) output += ` [${log.agent}]`;
      if (log.tool) output += ` [${log.tool}]`;
      output += `: ${log.message}\n`;
      
      if (log.details) {
        output += `  Details: ${JSON.stringify(log.details)}\n`;
      }
      output += '\n';
    }
    
    return output;
  }
} 