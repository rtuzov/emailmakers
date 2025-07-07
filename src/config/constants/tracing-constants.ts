/**
 * 📊 TRACING CONSTANTS
 * 
 * Централизованные константы для трейсинга и мониторинга
 * OpenAI Agents SDK и OpenTelemetry совместимые значения
 */

export const TRACING_CONSTANTS = {
  // Основные настройки трейсинга
  DEFAULT_WORKFLOW_NAME: 'Email Generation Workflow',
  TRACE_ID_PREFIX: 'email_makers_',
  SPAN_PREFIX: 'email_makers_span_',
  
  // Типы spans
  SPAN_TYPES: {
    AGENT_RUN: 'agent.run',
    TOOL_CALL: 'tool.call',
    LLM_GENERATION: 'llm.generation',
    HANDOFF: 'agent.handoff',
    GUARDRAIL: 'guardrail.check',
    CUSTOM: 'custom.operation'
  } as const,
  
  // Атрибуты spans
  SPAN_ATTRIBUTES: {
    // Общие атрибуты
    SERVICE_NAME: 'email-makers',
    SERVICE_VERSION: '2.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    
    // Агент-специфичные атрибуты
    AGENT_NAME: 'agent.name',
    AGENT_TYPE: 'agent.type',
    AGENT_VERSION: 'agent.version',
    
    // Tool-специфичные атрибуты
    TOOL_NAME: 'tool.name',
    TOOL_VERSION: 'tool.version',
    TOOL_CATEGORY: 'tool.category',
    
    // LLM-специфичные атрибуты
    LLM_MODEL: 'llm.model',
    LLM_PROVIDER: 'llm.provider',
    LLM_TOKEN_COUNT: 'llm.token_count',
    
    // Кампания-специфичные атрибуты
    CAMPAIGN_ID: 'campaign.id',
    CAMPAIGN_TYPE: 'campaign.type',
    USER_ID: 'user.id'
  } as const,
  
  // Настройки производительности
  PERFORMANCE: {
    batch_timeout_ms: 5000,
    max_batch_size: 100,
    max_queue_size: 1000,
    export_timeout_ms: 30_000
  } as const,
  
  // Уровни логирования
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn', 
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace'
  } as const,
  
  // Метрики
  METRICS: {
    AGENT_RUNS_TOTAL: 'email_makers_agent_runs_total',
    AGENT_RUN_DURATION: 'email_makers_agent_run_duration_seconds',
    TOOL_CALLS_TOTAL: 'email_makers_tool_calls_total',
    TOOL_CALL_DURATION: 'email_makers_tool_call_duration_seconds',
    LLM_REQUESTS_TOTAL: 'email_makers_llm_requests_total',
    LLM_TOKEN_USAGE: 'email_makers_llm_token_usage_total',
    ERRORS_TOTAL: 'email_makers_errors_total',
    QUALITY_SCORE: 'email_makers_quality_score'
  } as const,
  
  // Конфигурация экспорта
  EXPORT_CONFIG: {
    include_sensitive_data: false,
    max_span_events: 128,
    max_span_links: 128,
    max_span_attribute_length: 4096
  } as const
} as const;

export type SpanType = typeof TRACING_CONSTANTS.SPAN_TYPES[keyof typeof TRACING_CONSTANTS.SPAN_TYPES];
export type LogLevel = typeof TRACING_CONSTANTS.LOG_LEVELS[keyof typeof TRACING_CONSTANTS.LOG_LEVELS];