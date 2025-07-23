/**
 * Campaign Logger - Centralized logging system that captures console logs
 * and saves them to campaign-specific log files
 */

import { promises as fs } from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  trace_id?: string;
  campaign_id?: string;
}

class CampaignLogger {
  private campaignPath: string | null = null;
  private logBuffer: LogEntry[] = [];
  private isEnabled = true;
  private flushInterval: NodeJS.Timeout | null = null;
  private originalConsole: {
    log: any;
    warn: any;
    error: any;
    info: any;
    debug: any;
  };
  private isLogging = false; // ✅ ДОБАВЛЕНО: флаг для предотвращения рекурсии

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
  }

  /**
   * Initialize logger for a specific campaign
   */
  async initializeForCampaign(campaignPath: string, campaignId?: string): Promise<void> {
    this.campaignPath = campaignPath;
    
    // Create logs directory
    const logsDir = path.join(campaignPath, 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Override console methods to capture logs
    this.overrideConsole();
    
    // Start periodic flush every 5 seconds for real-time logging
    this.flushInterval = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushLogs().catch(error => {
          this.originalConsole.error('❌ Failed to flush logs on interval:', error);
        });
      }
    }, 5000); // Flush every 5 seconds
    
    // Log initialization
    this.addLogEntry('info', `🔧 Campaign logger initialized for: ${campaignId || path.basename(campaignPath)}`, 'CampaignLogger');
    
    console.log(`📋 Campaign Logger: Initialized for ${campaignId || path.basename(campaignPath)}`);
    console.log(`📁 Logs will be saved to: ${logsDir}`);
  }

  /**
   * Override console methods to capture logs
   */
  private overrideConsole(): void {
    if (!this.isEnabled) return;

    const self = this;

    console.log = (...args: any[]) => {
      self.originalConsole.log(...args);
      if (!self.isLogging) { // ✅ ДОБАВЛЕНО: предотвращаем рекурсию
        self.isLogging = true;
        self.addLogEntry('info', self.formatArgs(args), 'console.log');
        self.isLogging = false;
      }
    };

    console.warn = (...args: any[]) => {
      self.originalConsole.warn(...args);
      if (!self.isLogging) { // ✅ ДОБАВЛЕНО: предотвращаем рекурсию
        self.isLogging = true;
        self.addLogEntry('warn', self.formatArgs(args), 'console.warn');
        self.isLogging = false;
      }
    };

    console.error = (...args: any[]) => {
      self.originalConsole.error(...args);
      if (!self.isLogging) { // ✅ ДОБАВЛЕНО: предотвращаем рекурсию
        self.isLogging = true;
        self.addLogEntry('error', self.formatArgs(args), 'console.error');
        self.isLogging = false;
      }
    };

    console.info = (...args: any[]) => {
      self.originalConsole.info(...args);
      if (!self.isLogging) { // ✅ ДОБАВЛЕНО: предотвращаем рекурсию
        self.isLogging = true;
        self.addLogEntry('info', self.formatArgs(args), 'console.info');
        self.isLogging = false;
      }
    };

    console.debug = (...args: any[]) => {
      self.originalConsole.debug(...args);
      if (!self.isLogging) { // ✅ ДОБАВЛЕНО: предотвращаем рекурсию
        self.isLogging = true;
        self.addLogEntry('debug', self.formatArgs(args), 'console.debug');
        self.isLogging = false;
      }
    };
  }

  /**
   * Restore original console methods
   */
  restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  /**
   * Format console arguments into a string
   */
  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Add log entry to buffer
   */
  private addLogEntry(level: LogEntry['level'], message: string, source?: string, trace_id?: string): void {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(source && { source }),
      ...(trace_id && { trace_id }),
      ...(this.campaignPath && { campaign_id: path.basename(this.campaignPath) })
    };

    this.logBuffer.push(entry);

    // Auto-flush more frequently for real-time logging
    if (this.logBuffer.length >= 10) { // Reduced from 100 to 10
      this.flushLogs().catch(error => {
        this.originalConsole.error('❌ Failed to flush logs:', error);
      });
    }
  }

  /**
   * Manually log a message with specific level
   */
  log(level: LogEntry['level'], message: string, source?: string, trace_id?: string): void {
    this.addLogEntry(level, message, source, trace_id);
    
    // Immediately flush for error and warn levels
    if (level === 'error' || level === 'warn') {
      this.flushLogs().catch(error => {
        this.originalConsole.error('❌ Failed to flush critical log:', error);
      });
    }
  }

  /**
   * Flush logs to file
   */
  async flushLogs(): Promise<void> {
    if (!this.campaignPath || this.logBuffer.length === 0) return;

    try {
      const logsDir = path.join(this.campaignPath, 'logs');
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(logsDir, `campaign-${timestamp}.log`);

      // Format log entries
      const logLines = this.logBuffer.map(entry => {
        const parts = [
          entry.timestamp,
          `[${entry.level.toUpperCase()}]`,
          entry.source ? `[${entry.source}]` : '',
          entry.trace_id ? `[${entry.trace_id}]` : '',
          entry.message
        ].filter(Boolean);
        
        return parts.join(' ');
      });

      // Append to log file
      const logContent = logLines.join('\n') + '\n';
      await fs.appendFile(logFile, logContent);

      // Clear buffer
      this.logBuffer = [];

    } catch (error) {
      this.originalConsole.error('❌ Failed to write logs to file:', error);
    }
  }

  /**
   * Save specialized log file for specific component
   */
  async saveComponentLog(componentName: string, logs: string[]): Promise<void> {
    if (!this.campaignPath) return;

    try {
      const logsDir = path.join(this.campaignPath, 'logs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(logsDir, `${componentName}-${timestamp}.log`);

      const logContent = logs.map(log => {
        return `${new Date().toISOString()} [${componentName.toUpperCase()}] ${log}`;
      }).join('\n') + '\n';

      await fs.writeFile(logFile, logContent);

    } catch (error) {
      this.originalConsole.error(`❌ Failed to save ${componentName} log:`, error);
    }
  }

  /**
   * Create summary log with key metrics
   */
  async createSummaryLog(summary: {
    campaign_id: string;
    start_time: string;
    end_time: string;
    status: 'success' | 'error' | 'partial';
    specialists_completed: string[];
    errors: string[];
    warnings: string[];
    performance_metrics?: any;
  }): Promise<void> {
    if (!this.campaignPath) return;

    try {
      const logsDir = path.join(this.campaignPath, 'logs');
      const summaryFile = path.join(logsDir, 'campaign-summary.log');

      const summaryContent = `
=== CAMPAIGN EXECUTION SUMMARY ===
Campaign ID: ${summary.campaign_id}
Start Time: ${summary.start_time}
End Time: ${summary.end_time}
Duration: ${new Date(summary.end_time).getTime() - new Date(summary.start_time).getTime()}ms
Status: ${summary.status.toUpperCase()}

SPECIALISTS COMPLETED: ${summary.specialists_completed.length}
${summary.specialists_completed.map(s => `✅ ${s}`).join('\n')}

ERRORS: ${summary.errors.length}
${summary.errors.map(e => `❌ ${e}`).join('\n')}

WARNINGS: ${summary.warnings.length}
${summary.warnings.map(w => `⚠️  ${w}`).join('\n')}

PERFORMANCE METRICS:
${summary.performance_metrics ? JSON.stringify(summary.performance_metrics, null, 2) : 'Not available'}

=== END SUMMARY ===
`;

      await fs.writeFile(summaryFile, summaryContent);

    } catch (error) {
      this.originalConsole.error('❌ Failed to create summary log:', error);
    }
  }

  /**
   * Finalize logging and flush remaining logs
   */
  async finalize(): Promise<void> {
    // Stop periodic flush
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining logs
    await this.flushLogs();
    
    // Restore original console
    this.restoreConsole();
    
    // Reset state
    this.campaignPath = null;
    this.logBuffer = [];
    
    this.originalConsole.log('📋 Campaign Logger: Finalized and restored console');
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      // Stop periodic flush
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
        this.flushInterval = null;
      }
      this.restoreConsole();
    }
  }

  /**
   * Get current log buffer (for debugging)
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }
}

// Export singleton instance
export const campaignLogger = new CampaignLogger();

// Export helper functions
export async function initializeCampaignLogging(campaignPath: string, campaignId?: string): Promise<void> {
  await campaignLogger.initializeForCampaign(campaignPath, campaignId);
}

export async function finalizeCampaignLogging(): Promise<void> {
  await campaignLogger.finalize();
}

export function logToFile(level: 'info' | 'warn' | 'error' | 'debug', message: string, source?: string, trace_id?: string): void {
  campaignLogger.log(level, message, source, trace_id);
}

export default campaignLogger; 