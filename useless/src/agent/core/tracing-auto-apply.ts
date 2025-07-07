/**
 * 🎯 AUTOMATIC TRACING APPLICATION
 * 
 * Автоматическое применение декораторов трейсинга к существующим классам
 * Без необходимости модификации исходного кода
 */

import { tracingConfig, AgentTracingProfile } from './tracing-config';
import { 
  Traced, 
  TracedAgent, 
  TracedTool, 
  TracedHandoff, 
  TracedPerformance,
  TracingDecoratorOptions 
} from './tracing-decorators';

export interface AutoApplyOptions {
  agentType: string;
  targetClass: any;
  includePrivateMethods: boolean;
  customMethodMap?: Record<string, TracingDecoratorOptions>;
}

/**
 * 🔧 AUTO TRACING APPLICATOR
 * 
 * Автоматически применяет декораторы к методам класса
 */
export class AutoTracingApplicator {
  private static appliedClasses = new Set<string>();
  
  /**
   * 🎯 Применить трейсинг к классу агента
   */
  static applyToAgent(targetClass: any, agentType: string, options: Partial<AutoApplyOptions> = {}): void {
    const className = targetClass.name || targetClass.constructor.name;
    const classId = `${className}_${agentType}`;
    
    // Избегаем повторного применения
    if (this.appliedClasses.has(classId)) {
      console.log(`⚠️ [AUTO TRACING] Skipping already traced class: ${className}`);
      return;
    }
    
    console.log(`🎯 [AUTO TRACING] Applying tracing to agent class: ${className} (${agentType})`);
    
    const profile = tracingConfig.getAgentProfile(agentType);
    if (!profile) {
      console.warn(`⚠️ [AUTO TRACING] No profile found for agent type: ${agentType}`);
      return;
    }
    
    const prototype = targetClass.prototype;
    const methodNames = this.getMethodNames(prototype, options.includePrivateMethods || false);
    
    let appliedCount = 0;
    
    methodNames.forEach(methodName => {
      if (this.shouldTraceMethod(methodName, profile)) {
        const decoratorType = this.determineDecoratorType(methodName, profile);
        const decoratorOptions = tracingConfig.getDecoratorOptions(agentType, methodName);
        
        // Применяем соответствующий декоратор
        this.applyMethodDecorator(prototype, methodName, decoratorType, agentType, decoratorOptions);
        appliedCount++;
      }
    });
    
    this.appliedClasses.add(classId);
    console.log(`✅ [AUTO TRACING] Applied tracing to ${appliedCount} methods in ${className}`);
  }
  
  /**
   * 🔧 Получить имена методов класса
   */
  private static getMethodNames(prototype: any, includePrivate: boolean): string[] {
    const methodNames = Object.getOwnPropertyNames(prototype);
    
    return methodNames.filter(name => {
      if (name === 'constructor') return false;
      if (!includePrivate && name.startsWith('_')) return false;
      if (typeof prototype[name] !== 'function') return false;
      
      return true;
    });
  }
  
  /**
   * 🎯 Определить, следует ли трейсить метод
   */
  private static shouldTraceMethod(methodName: string, profile: AgentTracingProfile): boolean {
    const excludedMethods = ['toString', 'valueOf', 'hasOwnProperty'];
    return !excludedMethods.includes(methodName);
  }
  
  /**
   * 🔍 Определить тип декоратора для метода
   */
  private static determineDecoratorType(methodName: string, profile: AgentTracingProfile): string {
    if (profile.criticalMethods.includes(methodName)) return 'critical';
    if (profile.performanceMethods.includes(methodName)) return 'performance';
    if (profile.toolMethods.includes(methodName)) return 'tool';
    if (profile.handoffMethods.includes(methodName)) return 'handoff';
    
    return 'default';
  }
  
  /**
   * 🎨 Применить декоратор к методу
   */
  private static applyMethodDecorator(
    prototype: any, 
    methodName: string, 
    decoratorType: string, 
    agentType: string, 
    options: TracingDecoratorOptions
  ): void {
    const originalMethod = prototype[methodName];
    if (!originalMethod || typeof originalMethod !== 'function') return;
    
    let wrappedMethod: any;
    
    switch (decoratorType) {
      case 'critical':
      case 'default':
        wrappedMethod = this.wrapWithAgentDecorator(originalMethod, agentType, methodName, options);
        break;
        
      case 'performance':
        wrappedMethod = this.wrapWithPerformanceDecorator(originalMethod, agentType, methodName, options);
        break;
        
      case 'tool':
        wrappedMethod = this.wrapWithToolDecorator(originalMethod, agentType, methodName, options);
        break;
        
      case 'handoff':
        wrappedMethod = this.wrapWithHandoffDecorator(originalMethod, agentType, methodName, options);
        break;
        
      default:
        wrappedMethod = this.wrapWithAgentDecorator(originalMethod, agentType, methodName, options);
    }
    
    // Заменяем оригинальный метод обернутым
    prototype[methodName] = wrappedMethod;
    
    console.log(`🔧 [AUTO TRACING] Applied ${decoratorType} tracing to ${agentType}.${methodName}`);
  }
  
  /**
   * 🤖 Обернуть метод агентом декоратором
   */
  private static wrapWithAgentDecorator(
    originalMethod: Function, 
    agentType: string, 
    methodName: string, 
    options: TracingDecoratorOptions
  ): Function {
    return async function (this: any, ...args: any[]) {
      const decoratorInstance = TracedAgent(agentType, options);
      const descriptor = { value: originalMethod };
      decoratorInstance(this, methodName, descriptor);
      return descriptor.value.apply(this, args);
    };
  }
  
  /**
   * ⚡ Обернуть метод декоратором производительности
   */
  private static wrapWithPerformanceDecorator(
    originalMethod: Function, 
    agentType: string, 
    methodName: string, 
    options: TracingDecoratorOptions
  ): Function {
    return async function (this: any, ...args: any[]) {
      const decoratorInstance = TracedPerformance(options);
      const descriptor = { value: originalMethod };
      decoratorInstance(this, methodName, descriptor);
      return descriptor.value.apply(this, args);
    };
  }
  
  /**
   * 🔧 Обернуть метод инструмента декоратором
   */
  private static wrapWithToolDecorator(
    originalMethod: Function, 
    agentType: string, 
    methodName: string, 
    options: TracingDecoratorOptions
  ): Function {
    return async function (this: any, ...args: any[]) {
      const decoratorInstance = TracedTool(agentType, options);
      const descriptor = { value: originalMethod };
      decoratorInstance(this, methodName, descriptor);
      return descriptor.value.apply(this, args);
    };
  }
  
  /**
   * 🔄 Обернуть метод handoff декоратором
   */
  private static wrapWithHandoffDecorator(
    originalMethod: Function, 
    agentType: string, 
    methodName: string, 
    options: TracingDecoratorOptions
  ): Function {
    return async function (this: any, ...args: any[]) {
      const decoratorInstance = TracedHandoff(options);
      const descriptor = { value: originalMethod };
      decoratorInstance(this, methodName, descriptor);
      return descriptor.value.apply(this, args);
    };
  }
  
  /**
   * 📊 Получить статистику применения
   */
  static getApplicationStats(): {
    appliedClasses: number;
    classNames: string[];
  } {
    return {
      appliedClasses: this.appliedClasses.size,
      classNames: Array.from(this.appliedClasses)
    };
  }
  
  /**
   * 🔄 Сброс статистики (для тестирования)
   */
  static resetApplicationStats(): void {
    this.appliedClasses.clear();
    console.log('🔄 [AUTO TRACING] Application stats reset');
  }
}

/**
 * 🚀 BATCH AUTO APPLICATOR
 * 
 * Массовое применение трейсинга к группе классов
 */
export class BatchAutoTracing {
  /**
   * 🎯 Применить трейсинг ко всем агентам
   */
  static applyToAllAgents(agentClasses: Record<string, any>): void {
    console.log('🚀 [BATCH TRACING] Starting batch application to all agents');
    
    const agentTypes = Object.keys(agentClasses);
    let totalApplied = 0;
    
    agentTypes.forEach(agentType => {
      const agentClass = agentClasses[agentType];
      if (agentClass) {
        try {
          AutoTracingApplicator.applyToAgent(agentClass, agentType);
          totalApplied++;
        } catch (error) {
          console.error(`❌ [BATCH TRACING] Failed to apply tracing to ${agentType}:`, error);
        }
      }
    });
    
    console.log(`✅ [BATCH TRACING] Applied tracing to ${totalApplied}/${agentTypes.length} agent classes`);
  }
  
  /**
   * 🎯 Применить трейсинг к специалистам
   */
  static applyToSpecialists(specialists: {
    contentSpecialist?: any;
    designSpecialist?: any;
    qualitySpecialist?: any;
    deliverySpecialist?: any;
  }): void {
    console.log('🎯 [BATCH TRACING] Applying tracing to specialist agents');
    
    const agentMap = {
      content: specialists.contentSpecialist,
      design: specialists.designSpecialist,
      quality: specialists.qualitySpecialist,
      delivery: specialists.deliverySpecialist
    };
    
    this.applyToAllAgents(agentMap);
  }
  
  /**
   * 🔧 Применить трейсинг к инструментам
   */
  static applyToTools(toolClasses: Record<string, any>): void {
    console.log('🔧 [BATCH TRACING] Applying tracing to tool classes');
    
    Object.entries(toolClasses).forEach(([toolName, toolClass]) => {
      if (toolClass && typeof toolClass === 'function') {
        try {
          AutoTracingApplicator.applyToAgent(toolClass, 'tool', {
            customMethodMap: {
              execute: { spanType: 'tool', includeArgs: true, includeResult: true }
            }
          });
          console.log(`✅ [BATCH TRACING] Applied tracing to tool: ${toolName}`);
        } catch (error) {
          console.error(`❌ [BATCH TRACING] Failed to apply tracing to tool ${toolName}:`, error);
        }
      }
    });
  }
}

/**
 * 🎨 ДЕКОРАТОР ДЛЯ АВТОМАТИЧЕСКОГО ПРИМЕНЕНИЯ
 * 
 * Класс-декоратор для автоматического применения трейсинга
 */
export function AutoTracedAgent(agentType: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // Применяем трейсинг при создании класса
    AutoTracingApplicator.applyToAgent(constructor, agentType);
    
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // Добавляем метаданные агента
        (this as any).agentType = agentType;
        (this as any).tracingApplied = true;
        (this as any).tracingTimestamp = new Date().toISOString();
        
        console.log(`🤖 [AUTO TRACED] Created traced agent instance: ${agentType}`);
      }
    };
  };
}

/**
 * 🔧 УТИЛИТЫ ДЛЯ ПРОВЕРКИ ТРЕЙСИНГА
 */
export class TracingValidator {
  /**
   * Проверить, применен ли трейсинг к классу
   */
  static isClassTraced(className: string, agentType: string): boolean {
    const classId = `${className}_${agentType}`;
    return AutoTracingApplicator.getApplicationStats().classNames.includes(classId);
  }
  
  /**
   * Проверить, есть ли трейсинг у экземпляра
   */
  static isInstanceTraced(instance: any): boolean {
    return !!(instance.tracingApplied && instance.agentType);
  }
  
  /**
   * Получить информацию о трейсинге экземпляра
   */
  static getInstanceTracingInfo(instance: any): any {
    if (!this.isInstanceTraced(instance)) {
      return { traced: false };
    }
    
    return {
      traced: true,
      agentType: instance.agentType,
      appliedAt: instance.tracingTimestamp,
      className: instance.constructor.name
    };
  }
}