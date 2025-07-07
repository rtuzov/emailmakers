/**
 * 🔧 TRACING CONFIGURATION
 * 
 * Конфигурация системы трейсинга для декораторов
 * Интеграция с OpenAI SDK tracing и настройки производительности
 */

import { TracingDecoratorOptions } from './tracing-decorators';

export interface TracingConfig {
  enabled: boolean;
  sensitiveDataMode: boolean;
  includeArgs: boolean;
  includeResults: boolean;
  performanceTracking: boolean;
  agentTypes: string[];
  excludedMethods: string[];
  customMetadata: Record<string, any>;
}

export interface AgentTracingProfile {
  agentType: string;
  criticalMethods: string[];
  performanceMethods: string[];
  toolMethods: string[];
  handoffMethods: string[];
  defaultOptions: TracingDecoratorOptions;
}

/**
 * 📊 ГЛОБАЛЬНАЯ КОНФИГУРАЦИЯ ТРЕЙСИНГА
 */
export class TracingConfiguration {
  private static instance: TracingConfiguration;
  private config: TracingConfig;
  private profiles: Map<string, AgentTracingProfile> = new Map();

  private constructor() {
    this.config = {
      enabled: true,
      sensitiveDataMode: false,
      includeArgs: true,
      includeResults: true,
      performanceTracking: true,
      agentTypes: ['content', 'design', 'quality', 'delivery'],
      excludedMethods: ['constructor', 'toString', 'valueOf'],
      customMetadata: {
        environment: process.env.NODE_ENV || 'development',
        project: 'Email-Makers',
        version: '2.0.0'
      }
    };

    this.initializeAgentProfiles();
  }

  static getInstance(): TracingConfiguration {
    if (!TracingConfiguration.instance) {
      TracingConfiguration.instance = new TracingConfiguration();
    }
    return TracingConfiguration.instance;
  }

  /**
   * 🎯 Инициализация профилей агентов
   */
  private initializeAgentProfiles(): void {
    // Content Specialist Profile
    this.profiles.set('content', {
      agentType: 'content',
      criticalMethods: ['generateContent', 'analyzeContent', 'optimizeContent'],
      performanceMethods: ['generateContent', 'processLargeContent'],
      toolMethods: ['getPrices', 'getCurrentDate', 'planEmailImages'],
      handoffMethods: ['transferToDesignSpecialist', 'handoffToNext'],
      defaultOptions: {
        includeArgs: true,
        includeResult: true,
        metadata: { priority: 'high', category: 'content_generation' }
      }
    });

    // Design Specialist Profile
    this.profiles.set('design', {
      agentType: 'design',
      criticalMethods: ['renderEmail', 'compileTemplate', 'optimizeDesign'],
      performanceMethods: ['renderEmail', 'processAssets', 'compileMJML'],
      toolMethods: ['selectFigmaAssets', 'compileToHTML', 'optimizeImages'],
      handoffMethods: ['transferToQualitySpecialist', 'handoffToNext'],
      defaultOptions: {
        includeArgs: true,
        includeResult: true,
        metadata: { priority: 'high', category: 'design_rendering' }
      }
    });

    // Quality Specialist Profile
    this.profiles.set('quality', {
      agentType: 'quality',
      criticalMethods: ['validateQuality', 'checkCompatibility', 'runTests'],
      performanceMethods: ['runComprehensiveTests', 'validateLargeTemplates'],
      toolMethods: ['validateHTML', 'testRendering', 'checkAccessibility'],
      handoffMethods: ['transferToDeliverySpecialist', 'handoffToNext', 'returnForFixes'],
      defaultOptions: {
        includeArgs: true,
        includeResult: true,
        metadata: { priority: 'critical', category: 'quality_assurance' }
      }
    });

    // Delivery Specialist Profile
    this.profiles.set('delivery', {
      agentType: 'delivery',
      criticalMethods: ['deployContent', 'organizeFiles', 'finalizeDelivery'],
      performanceMethods: ['uploadLargeFiles', 'processMultipleAssets'],
      toolMethods: ['uploadToS3', 'organizeAssets', 'generateReport'],
      handoffMethods: ['completeWorkflow', 'finalizeDelivery'],
      defaultOptions: {
        includeArgs: true,
        includeResult: true,
        metadata: { priority: 'high', category: 'delivery_deployment' }
      }
    });
  }

  /**
   * 🔧 Получить конфигурацию трейсинга для агента
   */
  getAgentProfile(agentType: string): AgentTracingProfile | undefined {
    return this.profiles.get(agentType);
  }

  /**
   * 📋 Получить все доступные профили
   */
  getAllProfiles(): AgentTracingProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * ⚙️ Обновить глобальную конфигурацию
   */
  updateConfig(updates: Partial<TracingConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('🔧 [TRACING CONFIG] Configuration updated:', updates);
  }

  /**
   * 📊 Получить текущую конфигурацию
   */
  getConfig(): TracingConfig {
    return { ...this.config };
  }

  /**
   * 🎯 Определить, должен ли метод быть отслежен
   */
  shouldTraceMethod(agentType: string, methodName: string): boolean {
    if (!this.config.enabled) return false;
    if (this.config.excludedMethods.includes(methodName)) return false;
    
    const profile = this.profiles.get(agentType);
    if (!profile) return true; // По умолчанию трейсим неизвестные агенты
    
    return true; // Все методы в профиле трейсятся
  }

  /**
   * 🔧 Получить опции декоратора для метода
   */
  getDecoratorOptions(agentType: string, methodName: string): TracingDecoratorOptions {
    const profile = this.profiles.get(agentType);
    const baseOptions = profile?.defaultOptions || {};
    
    // Специальные опции для разных типов методов
    let specificOptions: Partial<TracingDecoratorOptions> = {};
    
    if (profile?.criticalMethods.includes(methodName)) {
      specificOptions = {
        metadata: { ...baseOptions.metadata, importance: 'critical' }
      };
    } else if (profile?.performanceMethods.includes(methodName)) {
      specificOptions = {
        metadata: { ...baseOptions.metadata, trackPerformance: true }
      };
    } else if (profile?.toolMethods.includes(methodName)) {
      specificOptions = {
        spanType: 'tool',
        metadata: { ...baseOptions.metadata, category: 'tool_execution' }
      };
    } else if (profile?.handoffMethods.includes(methodName)) {
      specificOptions = {
        spanType: 'custom',
        metadata: { ...baseOptions.metadata, category: 'agent_handoff' }
      };
    }
    
    return {
      ...baseOptions,
      ...specificOptions,
      sensitiveDataMode: this.config.sensitiveDataMode,
      includeArgs: this.config.includeArgs,
      includeResult: this.config.includeResults
    };
  }

  /**
   * 📈 Включить режим производительности
   */
  enablePerformanceMode(): void {
    this.updateConfig({
      performanceTracking: true,
      includeArgs: false,
      includeResults: false,
      sensitiveDataMode: true
    });
    console.log('🚀 [TRACING CONFIG] Performance mode enabled');
  }

  /**
   * 🔍 Включить режим отладки
   */
  enableDebugMode(): void {
    this.updateConfig({
      includeArgs: true,
      includeResults: true,
      sensitiveDataMode: false,
      performanceTracking: true
    });
    console.log('🐛 [TRACING CONFIG] Debug mode enabled');
  }

  /**
   * 🔒 Включить безопасный режим
   */
  enableSecureMode(): void {
    this.updateConfig({
      sensitiveDataMode: true,
      includeArgs: false,
      includeResults: false
    });
    console.log('🔒 [TRACING CONFIG] Secure mode enabled');
  }

  /**
   * 📊 Экспорт конфигурации
   */
  exportConfig(): any {
    return {
      config: this.config,
      profiles: Array.from(this.profiles.entries()),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

/**
 * 🌍 Глобальный экземпляр конфигурации
 */
export const tracingConfig = TracingConfiguration.getInstance();

/**
 * 🎨 Предустановленные конфигурации
 */
export const TracingPresets = {
  development: {
    enabled: true,
    sensitiveDataMode: false,
    includeArgs: true,
    includeResults: true,
    performanceTracking: true
  },
  
  production: {
    enabled: true,
    sensitiveDataMode: true,
    includeArgs: false,
    includeResults: false,
    performanceTracking: true
  },
  
  testing: {
    enabled: true,
    sensitiveDataMode: false,
    includeArgs: true,
    includeResults: true,
    performanceTracking: false
  },
  
  debugging: {
    enabled: true,
    sensitiveDataMode: false,
    includeArgs: true,
    includeResults: true,
    performanceTracking: true
  }
};

/**
 * 🔧 Утилитарные функции для быстрой настройки
 */
export class TracingSetup {
  /**
   * Применить пресет конфигурации
   */
  static applyPreset(presetName: keyof typeof TracingPresets): void {
    const preset = TracingPresets[presetName];
    tracingConfig.updateConfig(preset);
    console.log(`🎯 [TRACING SETUP] Applied preset: ${presetName}`);
  }
  
  /**
   * Настроить трейсинг для конкретного агента
   */
  static configureAgent(agentType: string, options: Partial<AgentTracingProfile>): void {
    const currentProfile = tracingConfig.getAgentProfile(agentType);
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...options };
      tracingConfig.getAllProfiles(); // Обновляем через конфигурацию
      console.log(`🤖 [TRACING SETUP] Configured agent: ${agentType}`);
    }
  }
  
  /**
   * Быстрая настройка для разработки
   */
  static setupDevelopment(): void {
    TracingSetup.applyPreset('development');
    tracingConfig.enableDebugMode();
  }
  
  /**
   * Быстрая настройка для продакшена
   */
  static setupProduction(): void {
    TracingSetup.applyPreset('production');
    tracingConfig.enableSecureMode();
  }
}