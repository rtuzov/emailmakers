/**
 * 🔧 SPECIALIST TRACING CONFIGURATION
 * 
 * Конфигурация трейсинга специально для specialist агентов
 * Дополнение к основной tracing-config.ts
 */

import { tracingConfig } from './tracing-config';
import { TracingDecoratorOptions } from './tracing-decorators';

/**
 * 🎯 Конфигурация для специфических методов специалистов
 */
export const SpecialistTracingConfig = {
  // Content Specialist
  content: {
    executeTask: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'task_execution' } 
    },
    generateContent: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'content_generation' } 
    },
    analyzeContent: { 
      spanType: 'agent' as const, 
      includeArgs: false, 
      metadata: { importance: 'high', category: 'content_analysis' } 
    },
    transferToDesignSpecialist: { 
      spanType: 'custom' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'agent_handoff' } 
    }
  },
  
  // Design Specialist  
  design: {
    executeTask: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'task_execution' } 
    },
    renderEmail: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'email_rendering' } 
    },
    compileTemplate: { 
      spanType: 'agent' as const, 
      includeArgs: false, 
      metadata: { importance: 'high', category: 'template_compilation' } 
    },
    transferToQualitySpecialist: { 
      spanType: 'custom' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'agent_handoff' } 
    }
  },
  
  // Quality Specialist
  quality: {
    executeTask: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'task_execution' } 
    },
    validateQuality: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'quality_validation' } 
    },
    checkCompatibility: { 
      spanType: 'agent' as const, 
      includeArgs: false, 
      metadata: { importance: 'high', category: 'compatibility_check' } 
    },
    transferToDeliverySpecialist: { 
      spanType: 'custom' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'agent_handoff' } 
    }
  },
  
  // Delivery Specialist
  delivery: {
    executeTask: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'task_execution' } 
    },
    deployContent: { 
      spanType: 'agent' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'content_deployment' } 
    },
    organizeFiles: { 
      spanType: 'agent' as const, 
      includeArgs: false, 
      metadata: { importance: 'medium', category: 'file_organization' } 
    },
    completeWorkflow: { 
      spanType: 'custom' as const, 
      includeArgs: true, 
      metadata: { importance: 'critical', category: 'workflow_completion' } 
    }
  }
};

/**
 * 🔧 Получить конфигурацию трейсинга для метода специалиста
 */
export function getSpecialistMethodConfig(
  agentType: 'content' | 'design' | 'quality' | 'delivery',
  methodName: string
): TracingDecoratorOptions {
  const agentConfig = SpecialistTracingConfig[agentType];
  const methodConfig = agentConfig?.[methodName];
  
  if (methodConfig) {
    return methodConfig;
  }
  
  // Fallback к базовой конфигурации
  return tracingConfig.getDecoratorOptions(agentType, methodName);
}

/**
 * 📊 Экспорт всех конфигураций для валидации
 */
export function getAllSpecialistConfigs(): any {
  return {
    content: Object.keys(SpecialistTracingConfig.content),
    design: Object.keys(SpecialistTracingConfig.design), 
    quality: Object.keys(SpecialistTracingConfig.quality),
    delivery: Object.keys(SpecialistTracingConfig.delivery),
    totalMethods: Object.values(SpecialistTracingConfig).reduce(
      (sum, config) => sum + Object.keys(config).length, 0
    )
  };
}
