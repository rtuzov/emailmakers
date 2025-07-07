/**
 * 📋 CENTRALIZED CONSTANTS INDEX
 * 
 * Единая точка доступа ко всем константам приложения
 * Организованы по категориям для лучшей структуры
 */

// Импорты констант
import { AGENT_CONSTANTS } from './agent-constants';
import { TRACING_CONSTANTS } from './tracing-constants';
import { API_CONSTANTS } from './api-constants';
import { UI_CONSTANTS } from './ui-constants';

// Экспорт всех констант и типов
export * from './agent-constants';
export * from './tracing-constants';
export * from './api-constants'; 
export * from './ui-constants';

// Экспорт основных объектов для удобного импорта
export { AGENT_CONSTANTS } from './agent-constants';
export { TRACING_CONSTANTS } from './tracing-constants';
export { API_CONSTANTS } from './api-constants';
export { UI_CONSTANTS } from './ui-constants';

// Legacy экспорты для обратной совместимости (временно)
export const BRAND_COLORS = UI_CONSTANTS.BRAND_COLORS;
export const DEFAULT_RETRY_POLICY = API_CONSTANTS.RETRY_POLICY;
export const QUALITY_SCORE_THRESHOLD = UI_CONSTANTS.QUALITY_THRESHOLDS.SCORE_THRESHOLD;
export const CAMPAIGN_TYPES = UI_CONSTANTS.CAMPAIGN_TYPES;
export const BRAND_REGEX = UI_CONSTANTS.VALIDATION_REGEX.BRAND_COLOR;
export const RETRY_BACKOFF_MAX = API_CONSTANTS.RETRY_POLICY.max_retry_delay_ms;

// Legacy типы для обратной совместимости
export type { CampaignType } from './ui-constants';

/**
 * Объект со всеми константами для удобного доступа
 */
export const ALL_CONSTANTS = {
  AGENT: AGENT_CONSTANTS,
  TRACING: TRACING_CONSTANTS,
  API: API_CONSTANTS,
  UI: UI_CONSTANTS
} as const;