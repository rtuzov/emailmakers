/**
 * 🤖 AGENT CONSTANTS
 * 
 * Централизованные константы для агентов и их конфигурации
 * OpenAI Agents SDK совместимые значения
 */

export const AGENT_CONSTANTS = {
  // Основные лимиты агентов
  MAX_TURNS: 10,
  DEFAULT_TIMEOUT_MS: 120_000, // 2 минуты
  MAX_RETRY_ATTEMPTS: 3,
  
  // Конфигурация OpenAI Agents SDK
  MODEL_SETTINGS: {
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.95,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  },
  
  // Типы агентов
  AGENT_TYPES: [
    'content',
    'design', 
    'quality',
    'delivery'
  ] as const,
  
  // Статусы выполнения
  EXECUTION_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress', 
    COMPLETED: 'completed',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
  } as const,
  
  // Приоритеты задач
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium', 
    HIGH: 'high',
    CRITICAL: 'critical'
  } as const,
  
  // Конфигурация handoffs
  HANDOFF_CONFIG: {
    max_handoffs: 5,
    timeout_ms: 30_000,
    require_confirmation: false
  } as const,
  
  // Tool choice настройки 
  TOOL_CHOICE: {
    AUTO: 'auto',
    REQUIRED: 'required',
    NONE: 'none'
  } as const
} as const;

export type AgentType = typeof AGENT_CONSTANTS.AGENT_TYPES[number];
export type ExecutionStatus = typeof AGENT_CONSTANTS.EXECUTION_STATUS[keyof typeof AGENT_CONSTANTS.EXECUTION_STATUS];
export type TaskPriority = typeof AGENT_CONSTANTS.TASK_PRIORITY[keyof typeof AGENT_CONSTANTS.TASK_PRIORITY];
export type ToolChoice = typeof AGENT_CONSTANTS.TOOL_CHOICE[keyof typeof AGENT_CONSTANTS.TOOL_CHOICE];