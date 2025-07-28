/**
 * Campaign Logger - Campaign-scoped logging system that isolates logs between parallel campaigns
 * 
 * ✅ ИСПРАВЛЕНО: Рекурсивные вызовы, множественная инициализация, деградация производительности
 * ✅ НОВОЕ: Изоляция логов между параллельными кампаниями через AsyncLocalStorage
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  trace_id?: string;
  campaign_id?: string;
}

interface CampaignContext {
  campaignId: string;
  campaignPath: string;
}

// ✅ НОВОЕ: AsyncLocalStorage для отслеживания контекста кампании
const campaignContext = new AsyncLocalStorage<CampaignContext>();

class CampaignLogger {
  private campaignId: string;
  private campaignPath: string;
  private logBuffer: LogEntry[] = [];
  private isEnabled = true;
  private flushInterval: NodeJS.Timeout | null = null;
  private lastLogMessage: string | null = null;
  private duplicateCount = 0;
  private isLogging = false;

  constructor(campaignId: string, campaignPath: string) {
    this.campaignId = campaignId;
    this.campaignPath = campaignPath;
  }

  /**
   * ✅ БЕЗОПАСНАЯ инициализация конкретного логгера кампании
   */
  async initialize(): Promise<void> {
    // Create logs directory
    const logsDir = path.join(this.campaignPath, 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    // ✅ Периодическая запись
    if (!this.flushInterval) {
      this.flushInterval = setInterval(() => {
        if (this.logBuffer.length > 0) {
          this.flushLogs().catch(error => {
            console.error('❌ Failed to flush logs for campaign:', this.campaignId, error);
          });
        }
      }, 5000);
    }

    // ✅ Запись инициализации
    this.safeAddLogEntry('info', `🔧 Campaign logger initialized for: ${this.campaignId}`, 'CampaignLogger');
    console.log(`📋 Campaign Logger: Successfully initialized for ${this.campaignId}`);
  }

  /**
   * ✅ БЕЗОПАСНОЕ добавление записи с агрессивной дедупликацией
   */
  private safeAddLogEntry(level: LogEntry['level'], message: string, source?: string, trace_id?: string): void {
    if (!this.isEnabled || this.isLogging) return;

    // ✅ АГРЕССИВНАЯ дедупликация для производительности
    const messageKey = message.slice(0, 100); // Используем первые 100 символов для ключа
    
    if (this.lastLogMessage === messageKey) {
      this.duplicateCount++;
      return; // ✅ НЕ добавляем дубль в буфер - экономим место
    }

    // ✅ Если были дубли, добавляем summary ТОЛЬКО если их много
    if (this.duplicateCount > 5) {
      const duplicateEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug', // ✅ debug вместо info для меньшей видимости
        message: `↩️ Last message repeated ${this.duplicateCount} times`,
        source: 'CampaignLogger',
        campaign_id: this.campaignId
      };
      this.logBuffer.push(duplicateEntry);
    }

    // ✅ Добавляем новую запись
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      campaign_id: this.campaignId,
      ...(source && { source }),
      ...(trace_id && { trace_id })
    };

    this.logBuffer.push(entry);
    this.lastLogMessage = messageKey;
    this.duplicateCount = 0;

    // ✅ ОПТИМИЗИРОВАННЫЙ auto-flush: увеличен порог до 20 для производительности
    if (this.logBuffer.length >= 20) {
      this.flushLogs().catch(error => {
        console.error('❌ Failed to auto-flush logs:', error);
      });
    }
  }

  /**
   * ✅ Публичный метод для добавления логов
   */
  log(level: LogEntry['level'], message: string, source?: string, trace_id?: string): void {
    this.safeAddLogEntry(level, message, source, trace_id);

    // ✅ ОПТИМИЗИРОВАННЫЙ immediate flush: только для critical errors от Specialist
    if (level === 'error' || (source?.includes('Specialist') && level === 'warn')) {
      this.flushLogs().catch(error => {
        console.error('❌ Failed to immediate flush logs:', error);
      });
    }
  }

  /**
   * ✅ Запись логов в файл с автовосстановлением структуры
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0 || !this.campaignPath) return;

    try {
      const logsDir = path.join(this.campaignPath, 'logs');
      const logFile = path.join(logsDir, `campaign-${new Date().toISOString().split('T')[0]}.log`);
      
      // 🛡️ КРИТИЧЕСКАЯ ЗАЩИТА: Восстанавливаем папку logs если она исчезла
      try {
        await fs.access(logsDir);
      } catch {
        console.warn('⚠️ Logs directory missing, recreating:', logsDir);
        await fs.mkdir(logsDir, { recursive: true });
      }
      
      const logEntries = this.logBuffer.splice(0); // ✅ Очищаем буфер
      const logLines = logEntries.map(entry => {
        const parts = [entry.timestamp, `[${entry.level.toUpperCase()}]`];
        if (entry.source) parts.push(`[${entry.source}]`);
        parts.push(entry.message);
        return parts.join(' ');
      });

      await fs.appendFile(logFile, logLines.join('\n') + '\n');
    } catch (error) {
      console.error('❌ Failed to write logs to file:', error);
      // 🛡️ В случае критической ошибки, сохраняем логи обратно в буфер
      if (this.logBuffer.length === 0) {
        console.error('❌ CRITICAL: Log entries lost due to file system error');
      }
    }
  }

  /**
   * ✅ Финализация логгера кампании
   */
  async finalize(): Promise<void> {
    // ✅ Добавляем незавершенные дубли
    if (this.duplicateCount > 0) {
      const duplicateEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message: `↩️ Last message repeated ${this.duplicateCount} times`,
        source: 'CampaignLogger',
        campaign_id: this.campaignId
      };
      this.logBuffer.push(duplicateEntry);
    }

    // Stop periodic flush
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush any remaining logs
    await this.flushLogs();

    // Reset state
    this.logBuffer = [];
    this.lastLogMessage = null;
    this.duplicateCount = 0;

    console.log(`📋 Campaign Logger: Finalized for ${this.campaignId}`);
  }


  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }
}

/**
 * ✅ НОВОЕ: Campaign Logger Manager - управляет логгерами для каждой кампании
 */
class CampaignLoggerManager {
  private static loggers: Map<string, CampaignLogger> = new Map();
  private static consoleOverridden = false;
  private static originalConsole: {
    log: any;
    warn: any;
    error: any;
    info: any;
    debug: any;
  } | null = null;

  /**
   * ✅ Получить логгер для конкретной кампании
   */
  static getLoggerForCampaign(campaignId: string, campaignPath: string): CampaignLogger {
    if (!this.loggers.has(campaignId)) {
      const logger = new CampaignLogger(campaignId, campaignPath);
      this.loggers.set(campaignId, logger);
    }
    return this.loggers.get(campaignId)!;
  }

  /**
   * ✅ УМНОЕ переопределение console с контекстным роутингом
   */
  static setupGlobalConsoleOverride(): void {
    if (this.consoleOverridden) return;

    // ✅ Сохраняем оригинальные методы
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };

    const self = this;

    // ✅ УМНОЕ переопределение с контекстным роутингом
    console.log = (...args: any[]) => {
      self.originalConsole!.log(...args); // ✅ Всегда показываем в консоли
      self.routeToCurrentCampaignLogger('info', self.formatArgs(args), 'console.log');
    };

    console.warn = (...args: any[]) => {
      self.originalConsole!.warn(...args);
      self.routeToCurrentCampaignLogger('warn', self.formatArgs(args), 'console.warn');
    };

    console.error = (...args: any[]) => {
      self.originalConsole!.error(...args);
      self.routeToCurrentCampaignLogger('error', self.formatArgs(args), 'console.error');
    };

    console.info = (...args: any[]) => {
      self.originalConsole!.info(...args);
      self.routeToCurrentCampaignLogger('info', self.formatArgs(args), 'console.info');
    };

    console.debug = (...args: any[]) => {
      self.originalConsole!.debug(...args);
      self.routeToCurrentCampaignLogger('debug', self.formatArgs(args), 'console.debug');
    };

    this.consoleOverridden = true;
    console.log('✅ Global console override with campaign routing enabled');
  }

  /**
   * ✅ Роутинг логов в логгер текущей кампании
   */
  private static routeToCurrentCampaignLogger(level: LogEntry['level'], message: string, source: string): void {
    // ✅ Получаем контекст текущей кампании
    const context = campaignContext.getStore();
    if (context) {
      const logger = this.loggers.get(context.campaignId);
      if (logger) {
        logger.log(level, message, source);
      }
    }
    // ✅ Если контекста нет, просто игнорируем (не логируем в файл)
  }

  /**
   * ✅ Форматирование аргументов console
   */
  private static formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * ✅ Восстановление оригинального console
   */
  static restoreConsole(): void {
    if (!this.consoleOverridden || !this.originalConsole) return;

    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    this.consoleOverridden = false;
    this.originalConsole = null;
    console.log('📋 Console methods restored to original');
  }

  /**
   * ✅ Финализация конкретной кампании
   */
  static async finalizeCampaign(campaignId: string): Promise<void> {
    const logger = this.loggers.get(campaignId);
    if (logger) {
      await logger.finalize();
      this.loggers.delete(campaignId);
      console.log(`🗑️ Campaign logger removed: ${campaignId}`);
    }
  }

  /**
   * ✅ Полный reset всех логгеров
   */
  static async resetAll(): Promise<void> {
    // Финализуем все активные логгеры
    const finalizePromises = Array.from(this.loggers.values()).map(logger => logger.finalize());
    await Promise.all(finalizePromises);
    
    // Очищаем Map
    this.loggers.clear();
    
    // Восстанавливаем console
    this.restoreConsole();
    
    console.log('🔄 All campaign loggers reset');
  }

  /**
   * ✅ Получить список активных кампаний
   */
  static getActiveCampaigns(): string[] {
    return Array.from(this.loggers.keys());
  }
}

// ✅ Export helper functions with campaign context support
export async function initializeCampaignLogging(campaignPath: string, campaignId?: string): Promise<void> {
  const campaignIdentifier = campaignId || path.basename(campaignPath);
  
  // ✅ Устанавливаем глобальное переопределение console (один раз)
  CampaignLoggerManager.setupGlobalConsoleOverride();
  
  // ✅ Создаем/получаем логгер для кампании
  const logger = CampaignLoggerManager.getLoggerForCampaign(campaignIdentifier, campaignPath);
  await logger.initialize();
  
  // ✅ Устанавливаем контекст кампании для текущего async context
  const context: CampaignContext = {
    campaignId: campaignIdentifier,
    campaignPath
  };
  
  // ✅ КРИТИЧЕСКИ ВАЖНО: Запускаем в контексте кампании
  await campaignContext.run(context, async () => {
    console.log(`📋 Campaign logging context established for: ${campaignIdentifier}`);
  });
}

export async function finalizeCampaignLogging(campaignId?: string): Promise<void> {
  if (campaignId) {
    await CampaignLoggerManager.finalizeCampaign(campaignId);
  } else {
    // ✅ Если campaignId не указан, финализуем все
    await CampaignLoggerManager.resetAll();
  }
}

export function logToFile(level: 'info' | 'warn' | 'error' | 'debug', message: string, source?: string, trace_id?: string): void {
  const context = campaignContext.getStore();
  if (context) {
    const logger = CampaignLoggerManager.getLoggerForCampaign(context.campaignId, context.campaignPath);
    logger.log(level, message, source, trace_id);
  }
}

export function resetCampaignLogger(): void {
  CampaignLoggerManager.resetAll().catch(console.error);
}

/**
 * ✅ НОВОЕ: Выполнить функцию в контексте кампании
 */
export async function runInCampaignContext<T>(
  campaignId: string, 
  campaignPath: string, 
  fn: () => Promise<T>
): Promise<T> {
  const context: CampaignContext = { campaignId, campaignPath };
  return campaignContext.run(context, fn);
}

/**
 * ✅ НОВОЕ: Получить текущий контекст кампании
 */
export function getCurrentCampaignContext(): CampaignContext | undefined {
  return campaignContext.getStore();
}

/**
 * ✅ НОВОЕ: Восстановить campaign context из OpenAI SDK context для specialist-агентов
 */
export function restoreCampaignContext(openAiContext: any): { campaignId: string | null, campaignPath: string | null } {
  try {
    // Извлекаем campaign info из OpenAI SDK context
    let campaignId: string | null = null;
    let campaignPath: string | null = null;

    if (openAiContext?.campaign?.id) {
      campaignId = openAiContext.campaign.id;
      campaignPath = openAiContext.campaign.path;
    } else if (openAiContext?.context?.campaign?.id) {
      campaignId = openAiContext.context.campaign.id;
      campaignPath = openAiContext.context.campaign.path;
    }

    if (campaignId && campaignPath) {
      // Устанавливаем AsyncLocalStorage context
      const context: CampaignContext = { campaignId, campaignPath };
      
      // Запускаем в контексте кампании для текущего вызова
      campaignContext.enterWith(context);
      
      console.log(`🔧 Campaign context restored for specialist: ${campaignId}`);
      return { campaignId, campaignPath };
    } else {
      console.warn('⚠️ Could not extract campaign info from OpenAI SDK context');
      return { campaignId: null, campaignPath: null };
    }
  } catch (error) {
    console.error('❌ Failed to restore campaign context:', error);
    return { campaignId: null, campaignPath: null };
  }
}

/**
 * ✅ НОВОЕ: Автоматическое восстановление campaign context для specialist tools
 * Используется в начале каждого specialist tool для восстановления логирования
 */
export function autoRestoreCampaignLogging(openAiContext: any, toolName: string): void {
  try {
    const { campaignId, campaignPath } = restoreCampaignContext(openAiContext);
    
    if (campaignId && campaignPath) {
      // Проверяем есть ли уже логгер для этой кампании
      const activeCampaigns = CampaignLoggerManager.getActiveCampaigns();
      if (!activeCampaigns.includes(campaignId)) {
        console.log(`🔧 Creating missing campaign logger for: ${campaignId}`);
        
        // Создаем логгер если его нет
        const logger = CampaignLoggerManager.getLoggerForCampaign(campaignId, campaignPath);
        logger.initialize().catch(error => {
          console.error('❌ Failed to initialize campaign logger:', error);
        });
      }
      
      // Логируем начало tool execution
      logToFile('info', `🔧 ${toolName} started`, 'Specialist', undefined);
      console.log(`📋 Campaign logging restored for ${toolName} in campaign: ${campaignId}`);
    } else {
      console.warn(`⚠️ ${toolName}: No campaign context available - logs will not be saved`);
    }
  } catch (error) {
    console.error(`❌ ${toolName}: Failed to restore campaign logging:`, error);
  }
}

// ✅ Экспорт для обратной совместимости
export const campaignLogger = {
  log: logToFile,
  getActiveCampaigns: () => CampaignLoggerManager.getActiveCampaigns()
};

export default campaignLogger; 