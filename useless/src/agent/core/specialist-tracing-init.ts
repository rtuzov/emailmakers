/**
 * 🎯 TRACING INITIALIZATION FOR SPECIALISTS
 * 
 * Автоматическое применение декораторов трейсинга ко всем specialist агентам
 * Вызывается при инициализации приложения
 */

import { AutoTracingApplicator, BatchAutoTracing } from '../core/tracing-auto-apply';
import { ContentSpecialistAgent } from '../specialists/content-specialist-agent';
import { DesignSpecialistAgentV2 } from '../specialists/design-specialist-v2';
import { QualitySpecialistV2 } from '../specialists/quality-specialist-v2';
import { DeliverySpecialistAgent } from '../specialists/delivery-specialist-agent';

/**
 * 🚀 Инициализация трейсинга для всех специалистов
 */
export function initializeSpecialistTracing(): void {
  console.log('🎯 [TRACING INIT] Initializing specialist tracing...');
  
  // Применяем трейсинг к каждому типу специалиста
  const specialists = {
    content: ContentSpecialistAgent,
    design: DesignSpecialistAgentV2,
    quality: QualitySpecialistV2,
    delivery: DeliverySpecialistAgent
  };
  
  // Используем BatchAutoTracing для массового применения
  BatchAutoTracing.applyToAllAgents(specialists);
  
  console.log('✅ [TRACING INIT] Specialist tracing initialized successfully');
}

/**
 * 🔧 Применение трейсинга к конкретному специалисту
 */
export function applyTracingToSpecialist(
  specialistClass: any, 
  agentType: 'content' | 'design' | 'quality' | 'delivery'
): void {
  AutoTracingApplicator.applyToAgent(specialistClass, agentType, {
    includePrivateMethods: false // Только публичные методы
  });
}

/**
 * 📊 Проверка статуса трейсинга
 */
export function getTracingStatus(): any {
  const stats = AutoTracingApplicator.getApplicationStats();
  
  return {
    appliedClasses: stats.appliedClasses,
    classNames: stats.classNames,
    specialists: ['content', 'design', 'quality', 'delivery'].map(type => ({
      type,
      isTraced: stats.classNames.some(name => name.includes(type))
    }))
  };
}
