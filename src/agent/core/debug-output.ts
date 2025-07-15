/**
 * 🐛 DEBUG OUTPUT SYSTEM - Enhanced Debugging with Environment Variables
 * 
 * Advanced debugging system with support for:
 * - Environment variable configuration
 * - Verbose logging modes
 * - Component-specific filtering
 * - Performance profiling
 * - Interactive debugging
 * 
 * Environment Variables:
 * - DEBUG=openai-agents:* (enable all agent debugging)
 * - DEBUG=email-makers:* (enable all email-makers debugging)
 * - DEBUG=email-makers:content-specialist (enable specific component)
 * - DEBUG_VERBOSE=1 (enable verbose mode)
 * - DEBUG_PERFORMANCE=1 (enable performance profiling)
 * - DEBUG_INTERACTIVE=1 (enable interactive debugging)
 * - DEBUG_OUTPUT_FILE=path/to/debug.log (output to file)
 */

import { promises as fs } from 'fs';
import { AgentLogger } from './agent-logger';

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

export interface DebugConfig {
  namespace: string;
  enabled: boolean;
  verbose: boolean;
  performanceProfiling: boolean;
  interactiveMode: boolean;
  outputFile?: string | undefined;
  colorOutput: boolean;
  includeTimestamp: boolean;
  includeMemoryUsage: boolean;
  includeStackTrace: boolean;
  filterComponents: string[];
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export interface DebugEntry {
  timestamp: string;
  namespace: string;
  component: string;
  level: string;
  message: string;
  data?: any;
  stackTrace?: string | undefined;
  memoryUsage?: NodeJS.MemoryUsage;
  performance?: {
    timeOrigin: number;
    duration: number;
  };
}

// ============================================================================
// DEBUG NAMESPACES
// ============================================================================

export const DEBUG_NAMESPACES = {
  CORE: 'email-makers:core',
  AGENTS: 'email-makers:agents',
  CONTENT_SPECIALIST: 'email-makers:content-specialist',
  DESIGN_SPECIALIST: 'email-makers:design-specialist',
  QUALITY_SPECIALIST: 'email-makers:quality-specialist',
  DELIVERY_SPECIALIST: 'email-makers:delivery-specialist',
  TOOLS: 'email-makers:tools',
  HANDOFFS: 'email-makers:handoffs',
  PERFORMANCE: 'email-makers:performance',
  ASSETS: 'email-makers:assets',
  VALIDATION: 'email-makers:validation',
  LOGGING: 'email-makers:logging'
} as const;

// ============================================================================
// DEBUG OUTPUT CLASS
// ============================================================================

export class DebugOutput {
  private config: DebugConfig;
  private entries: DebugEntry[] = [];
  private startTime: number = Date.now();
  private performanceMarks: Map<string, number> = new Map();

  constructor(namespace: string, config: Partial<DebugConfig> = {}) {
    this.config = {
      namespace,
      enabled: this.isDebuggingEnabled(namespace),
      verbose: this.isVerboseMode(),
      performanceProfiling: this.isPerformanceProfilingEnabled(),
      interactiveMode: this.isInteractiveModeEnabled(),
      outputFile: this.getOutputFile(),
      colorOutput: this.isColorOutputEnabled(),
      includeTimestamp: true,
      includeMemoryUsage: this.isPerformanceProfilingEnabled(),
      includeStackTrace: this.isVerboseMode(),
      filterComponents: this.getFilterComponents(),
      logLevel: this.getLogLevel(),
      ...config
    };
  }

  // ============================================================================
  // CORE DEBUG METHODS
  // ============================================================================

  trace(component: string, message: string, data?: any): void {
    if (this.shouldLog('trace', component)) {
      this.log('trace', component, message, data);
    }
  }

  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('debug', component)) {
      this.log('debug', component, message, data);
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('info', component)) {
      this.log('info', component, message, data);
    }
  }

  warn(component: string, message: string, data?: any): void {
    if (this.shouldLog('warn', component)) {
      this.log('warn', component, message, data);
    }
  }

  error(component: string, message: string, data?: any): void {
    if (this.shouldLog('error', component)) {
      this.log('error', component, message, data);
    }
  }

  // ============================================================================
  // SPECIALIZED DEBUG METHODS
  // ============================================================================

  performanceStart(component: string, operation: string): string {
    const markId = `${component}:${operation}:${Date.now()}`;
    this.performanceMarks.set(markId, Date.now());
    
    if (this.config.performanceProfiling) {
      this.debug(component, `🚀 Starting ${operation}`, { markId });
    }
    
    return markId;
  }

  performanceEnd(markId: string, component: string, operation: string, metadata?: any): number {
    const startTime = this.performanceMarks.get(markId);
    if (!startTime) {
      this.warn('Performance', `No start mark found for ${markId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.performanceMarks.delete(markId);

    if (this.config.performanceProfiling) {
      this.debug(component, `✅ Completed ${operation} in ${duration}ms`, { 
        duration, 
        metadata,
        markId 
      });
    }

    return duration;
  }

  dataFlow(component: string, operation: string, inputData: any, outputData: any): void {
    if (this.config.verbose) {
      this.debug(component, `📊 Data Flow: ${operation}`, {
        input: this.sanitizeData(inputData),
        output: this.sanitizeData(outputData),
        inputSize: JSON.stringify(inputData).length,
        outputSize: JSON.stringify(outputData).length
      });
    }
  }

  contextFlow(component: string, contextBefore: any, contextAfter: any): void {
    if (this.config.verbose) {
      this.debug(component, `🔄 Context Flow`, {
        before: this.sanitizeData(contextBefore),
        after: this.sanitizeData(contextAfter),
        changes: this.getContextChanges(contextBefore, contextAfter)
      });
    }
  }

  apiCall(component: string, method: string, url: string, params: any, response: any, duration: number): void {
    this.debug(component, `🌐 API Call: ${method} ${url}`, {
      method,
      url,
      params: this.sanitizeData(params),
      response: this.sanitizeData(response),
      duration,
      success: !response.error
    });
  }

  fileOperation(component: string, operation: string, filePath: string, size?: number): void {
    this.debug(component, `📁 File Operation: ${operation}`, {
      operation,
      filePath,
      size,
      exists: size !== undefined
    });
  }

  // ============================================================================
  // INTERACTIVE DEBUGGING
  // ============================================================================

  breakpoint(component: string, message: string, data?: any): void {
    if (this.config.interactiveMode) {
      console.log(`\n🛑 BREAKPOINT: ${component} - ${message}`);
      if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
      }
      console.log('Press any key to continue...');
      // In a real interactive environment, you'd wait for input
      // For now, we'll just log the breakpoint
    }
  }

  inspect(component: string, variable: string, value: any): void {
    if (this.config.interactiveMode) {
      console.log(`\n🔍 INSPECT: ${component}.${variable}`);
      console.log('Value:', JSON.stringify(value, null, 2));
      console.log('Type:', typeof value);
      console.log('Constructor:', value?.constructor?.name || 'N/A');
    }
  }

  // ============================================================================
  // CORE LOGGING IMPLEMENTATION
  // ============================================================================

  private log(level: string, component: string, message: string, data?: any): void {
    const entry: DebugEntry = {
      timestamp: new Date().toISOString(),
      namespace: this.config.namespace,
      component,
      level,
      message,
      data: this.sanitizeData(data)
    };

    if (this.config.includeStackTrace && (level === 'error' || this.config.verbose)) {
      entry.stackTrace = new Error().stack;
    }

    if (this.config.includeMemoryUsage) {
      entry.memoryUsage = process.memoryUsage();
    }

    if (this.config.performanceProfiling) {
      entry.performance = {
        timeOrigin: this.startTime,
        duration: Date.now() - this.startTime
      };
    }

    this.entries.push(entry);
    this.outputToConsole(entry);
    this.outputToFile(entry);
  }

  private shouldLog(level: string, component: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Check component filtering
    if (this.config.filterComponents.length > 0) {
      const allowed = this.config.filterComponents.some(filter => 
        component.toLowerCase().includes(filter.toLowerCase())
      );
      if (!allowed) {
        return false;
      }
    }

    // Check log level
    const levels = ['trace', 'debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    return messageLevel >= configLevel;
  }

  private outputToConsole(entry: DebugEntry): void {
    if (!this.config.colorOutput) {
      console.log(this.formatEntryPlain(entry));
      return;
    }

    const colors = {
      trace: '\x1b[90m',    // gray
      debug: '\x1b[36m',    // cyan
      info: '\x1b[34m',     // blue
      warn: '\x1b[33m',     // yellow
      error: '\x1b[31m',    // red
      reset: '\x1b[0m',     // reset
      bold: '\x1b[1m',      // bold
      dim: '\x1b[2m'        // dim
    };

    const color = colors[entry.level as keyof typeof colors] || colors.debug;
    const timestamp = this.config.includeTimestamp ? 
      `${colors.dim}${entry.timestamp}${colors.reset} ` : '';
    const namespace = `${colors.dim}${entry.namespace}${colors.reset}`;
    const component = `${colors.bold}[${entry.component}]${colors.reset}`;
    const level = `${color}${entry.level.toUpperCase()}${colors.reset}`;
    const message = `${color}${entry.message}${colors.reset}`;

    console.log(`${timestamp}${namespace} ${level} ${component} ${message}`);

    if (entry.data && Object.keys(entry.data).length > 0) {
      console.log(`${colors.dim}  Data:${colors.reset}`, JSON.stringify(entry.data, null, 2));
    }

    if (entry.memoryUsage && this.config.verbose) {
      const mem = entry.memoryUsage;
      console.log(`${colors.dim}  Memory: RSS=${Math.round(mem.rss/1024/1024)}MB, Heap=${Math.round(mem.heapUsed/1024/1024)}MB${colors.reset}`);
    }
  }

  private formatEntryPlain(entry: DebugEntry): string {
    const parts = [];
    
    if (this.config.includeTimestamp) {
      parts.push(entry.timestamp);
    }
    
    parts.push(entry.namespace);
    parts.push(entry.level.toUpperCase());
    parts.push(`[${entry.component}]`);
    parts.push(entry.message);
    
    let output = parts.join(' ');
    
    if (entry.data && Object.keys(entry.data).length > 0) {
      output += '\n  Data: ' + JSON.stringify(entry.data, null, 2);
    }
    
    return output;
  }

  private async outputToFile(entry: DebugEntry): Promise<void> {
    if (!this.config.outputFile) {
      return;
    }

    try {
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.config.outputFile, logLine);
    } catch (error) {
      console.error('Failed to write debug log to file:', error);
    }
  }

  // ============================================================================
  // ENVIRONMENT VARIABLE PARSING
  // ============================================================================

  private isDebuggingEnabled(namespace: string): boolean {
    const debugEnv = process.env.DEBUG || '';
    
    if (debugEnv === '*') {
      return true;
    }

    const patterns = debugEnv.split(',').map(p => p.trim());
    
    return patterns.some(pattern => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return namespace.startsWith(prefix);
      }
      return namespace === pattern;
    });
  }

  private isVerboseMode(): boolean {
    return process.env.DEBUG_VERBOSE === '1' || process.env.DEBUG_VERBOSE === 'true';
  }

  private isPerformanceProfilingEnabled(): boolean {
    return process.env.DEBUG_PERFORMANCE === '1' || process.env.DEBUG_PERFORMANCE === 'true';
  }

  private isInteractiveModeEnabled(): boolean {
    return process.env.DEBUG_INTERACTIVE === '1' || process.env.DEBUG_INTERACTIVE === 'true';
  }

  private getOutputFile(): string | undefined {
    return process.env.DEBUG_OUTPUT_FILE;
  }

  private isColorOutputEnabled(): boolean {
    return process.env.DEBUG_COLOR !== '0' && process.env.DEBUG_COLOR !== 'false';
  }

  private getFilterComponents(): string[] {
    const filter = process.env.DEBUG_FILTER_COMPONENTS;
    return filter ? filter.split(',').map(c => c.trim()) : [];
  }

  private getLogLevel(): 'trace' | 'debug' | 'info' | 'warn' | 'error' {
    const level = process.env.DEBUG_LOG_LEVEL?.toLowerCase();
    if (['trace', 'debug', 'info', 'warn', 'error'].includes(level || '')) {
      return level as any;
    }
    return 'debug';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private sanitizeData(data: any): any {
    if (!data) return data;

    try {
      const serialized = JSON.stringify(data);
      if (serialized.length > 10000) {
        return `[Large object: ${serialized.length} characters]`;
      }
      
      // Remove sensitive data
      const sanitized = JSON.parse(serialized);
      this.removeSensitiveFields(sanitized);
      return sanitized;
    } catch (error) {
      return `[Unserializable object: ${typeof data}]`;
    }
  }

  private removeSensitiveFields(obj: any): void {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          this.removeSensitiveFields(obj[key]);
        }
      }
    }
  }

  private getContextChanges(before: any, after: any): string[] {
    const changes: string[] = [];
    
    try {
      const beforeKeys = Object.keys(before || {});
      const afterKeys = Object.keys(after || {});
      
      // New keys
      afterKeys.forEach(key => {
        if (!beforeKeys.includes(key)) {
          changes.push(`+ ${key}`);
        }
      });
      
      // Removed keys
      beforeKeys.forEach(key => {
        if (!afterKeys.includes(key)) {
          changes.push(`- ${key}`);
        }
      });
      
      // Modified keys
      beforeKeys.forEach(key => {
        if (afterKeys.includes(key)) {
          const beforeValue = JSON.stringify(before[key]);
          const afterValue = JSON.stringify(after[key]);
          if (beforeValue !== afterValue) {
            changes.push(`~ ${key}`);
          }
        }
      });
    } catch (error) {
      changes.push('Error calculating changes');
    }
    
    return changes;
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  async generateDebugReport(): Promise<any> {
    const report = {
      namespace: this.config.namespace,
      generatedAt: new Date().toISOString(),
      sessionDuration: Date.now() - this.startTime,
      totalEntries: this.entries.length,
      entriesByLevel: this.getEntriesByLevel(),
      entriesByComponent: this.getEntriesByComponent(),
      topErrors: this.getTopErrors(),
      performanceStats: this.getPerformanceStats(),
      memoryUsage: this.getMemoryUsageStats(),
      config: this.config
    };

    if (this.config.outputFile) {
      const reportFile = this.config.outputFile.replace('.log', '-report.json');
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    }

    return report;
  }

  private getEntriesByLevel(): Record<string, number> {
    const counts = { trace: 0, debug: 0, info: 0, warn: 0, error: 0 };
    this.entries.forEach(entry => {
      const level = entry.level as keyof typeof counts;
      counts[level] = (counts[level] || 0) + 1;
    });
    return counts;
  }

  private getEntriesByComponent(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.entries.forEach(entry => {
      counts[entry.component] = (counts[entry.component] || 0) + 1;
    });
    return counts;
  }

  private getTopErrors(): any[] {
    return this.entries
      .filter(entry => entry.level === 'error')
      .slice(0, 10)
      .map(entry => ({
        timestamp: entry.timestamp,
        component: entry.component,
        message: entry.message,
        data: entry.data
      }));
  }

  private getPerformanceStats(): any {
    const performanceEntries = this.entries.filter(entry => entry.performance);
    
    if (performanceEntries.length === 0) {
      return null;
    }

    const durations = performanceEntries.map(entry => entry.performance!.duration);
    
    return {
      totalEntries: performanceEntries.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations)
    };
  }

  private getMemoryUsageStats(): any {
    const memoryEntries = this.entries.filter(entry => entry.memoryUsage);
    
    if (memoryEntries.length === 0) {
      return null;
    }

    const lastEntry = memoryEntries[memoryEntries.length - 1];
    if (!lastEntry?.memoryUsage) {
      return { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
    }
    const mem = lastEntry.memoryUsage;
    
    return {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024)
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createDebugger(namespace: string, config?: Partial<DebugConfig>): DebugOutput {
  return new DebugOutput(namespace, config);
}

// Create pre-configured debuggers for different components
export const debuggers = {
  core: createDebugger(DEBUG_NAMESPACES.CORE),
  agents: createDebugger(DEBUG_NAMESPACES.AGENTS),
  contentSpecialist: createDebugger(DEBUG_NAMESPACES.CONTENT_SPECIALIST),
  designSpecialist: createDebugger(DEBUG_NAMESPACES.DESIGN_SPECIALIST),
  qualitySpecialist: createDebugger(DEBUG_NAMESPACES.QUALITY_SPECIALIST),
  deliverySpecialist: createDebugger(DEBUG_NAMESPACES.DELIVERY_SPECIALIST),
  tools: createDebugger(DEBUG_NAMESPACES.TOOLS),
  handoffs: createDebugger(DEBUG_NAMESPACES.HANDOFFS),
  performance: createDebugger(DEBUG_NAMESPACES.PERFORMANCE),
  assets: createDebugger(DEBUG_NAMESPACES.ASSETS),
  validation: createDebugger(DEBUG_NAMESPACES.VALIDATION),
  logging: createDebugger(DEBUG_NAMESPACES.LOGGING)
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const debug = {
  core: debuggers.core,
  agents: debuggers.agents,
  contentSpecialist: debuggers.contentSpecialist,
  designSpecialist: debuggers.designSpecialist,
  qualitySpecialist: debuggers.qualitySpecialist,
  deliverySpecialist: debuggers.deliverySpecialist,
  tools: debuggers.tools,
  handoffs: debuggers.handoffs,
  performance: debuggers.performance,
  assets: debuggers.assets,
  validation: debuggers.validation,
  logging: debuggers.logging
};

// ============================================================================
// INTEGRATION WITH AGENT LOGGER
// ============================================================================

export function integrateWithAgentLogger(agentLogger: AgentLogger): void {
  const originalLog = console.log;
  
  console.log = (...args: any[]) => {
    // Forward console.log to agent logger if it looks like a debug message
    const message = args.join(' ');
    if (message.includes('email-makers:') || message.includes('openai-agents:')) {
      agentLogger.debug('Console', message);
    }
    originalLog(...args);
  };
}