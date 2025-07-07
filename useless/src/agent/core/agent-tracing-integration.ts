/**
 * 🔗 SPECIALIST TRACING INTEGRATION
 * 
 * Интеграционный слой для подключения трейсинга к существующим specialist агентам
 * Минимальные изменения в исходном коде
 */

import { initializeSpecialistTracing, getTracingStatus } from './specialist-tracing-init';
import { getAllSpecialistConfigs } from './specialist-tracing-config';

/**
 * 🚀 Основная функция инициализации трейсинга
 * Вызывается при старте приложения
 */
export async function initializeAgentTracing(): Promise<void> {
  console.log('🎯 [AGENT TRACING] Starting agent tracing initialization...');
  
  try {
    // Инициализируем трейсинг для специалистов
    initializeSpecialistTracing();
    
    // Проверяем статус
    const status = getTracingStatus();
    console.log('📊 [AGENT TRACING] Tracing status:', status);
    
    // Проверяем конфигурации
    const configs = getAllSpecialistConfigs();
    console.log('🔧 [AGENT TRACING] Specialist configs:', configs);
    
    console.log('✅ [AGENT TRACING] Agent tracing initialization completed successfully');
    
  } catch (error) {
    console.error('❌ [AGENT TRACING] Failed to initialize agent tracing:', error);
    throw error;
  }
}

/**
 * 🔍 Проверка готовности трейсинга
 */
export function checkTracingReadiness(): boolean {
  try {
    const status = getTracingStatus();
    const configs = getAllSpecialistConfigs();
    
    const isReady = status.appliedClasses > 0 && configs.totalMethods > 0;
    console.log(`🔍 [AGENT TRACING] Tracing readiness: ${isReady ? 'READY' : 'NOT READY'}`);
    
    return isReady;
  } catch (error) {
    console.error('❌ [AGENT TRACING] Failed to check tracing readiness:', error);
    return false;
  }
}

// Экспорт для использования в других модулях
export { getTracingStatus, getAllSpecialistConfigs };
