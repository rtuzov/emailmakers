/**
 * 🌐 API CONSTANTS
 * 
 * Централизованные константы для API конфигурации
 * Включает настройки для OpenAI, внешних API и внутренних endpoints
 */

export const API_CONSTANTS = {
  // Настройки retry политики
  RETRY_POLICY: {
    max_retries: 3,
    retry_delay_ms: 1000,
    retry_backoff_multiplier: 2,
    retry_on_failure: true,
    max_retry_delay_ms: 10_000
  } as const,
  
  // Таймауты для различных операций
  TIMEOUTS: {
    API_REQUEST: 30_000, // 30 секунд
    OPENAI_REQUEST: 60_000, // 1 минута
    ANTHROPIC_REQUEST: 45_000, // 45 секунд
    FIGMA_REQUEST: 20_000, // 20 секунд
    DATABASE_QUERY: 10_000, // 10 секунд
    FILE_UPLOAD: 120_000, // 2 минуты
    IMAGE_PROCESSING: 60_000 // 1 минута
  } as const,
  
  // Endpoints внутренних API
  INTERNAL_ENDPOINTS: {
    AGENT_STATUS: '/api/agent/status',
    AGENT_PROGRESS: '/api/agent/progress',
    CONTENT_SPECIALIST: '/api/agent/content-specialist',
    DESIGN_SPECIALIST: '/api/agent/design-specialist', 
    QUALITY_SPECIALIST: '/api/agent/quality-specialist',
    DELIVERY_SPECIALIST: '/api/agent/delivery-specialist',
    HEALTH_CHECK: '/api/health',
    METRICS: '/api/metrics',
    TRACING: '/api/tracing'
  } as const,
  
  // Статус коды HTTP
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
  } as const,
  
  // Rate limiting
  RATE_LIMITS: {
    OPENAI_RPM: 500, // requests per minute
    ANTHROPIC_RPM: 300,
    FIGMA_RPM: 100,
    INTERNAL_API_RPS: 10, // requests per second
    USER_API_RPM: 60 // per user
  } as const,
  
  // Размеры запросов и ответов
  LIMITS: {
    MAX_REQUEST_SIZE_MB: 10,
    MAX_RESPONSE_SIZE_MB: 50,
    MAX_FILE_SIZE_MB: 25,
    MAX_BATCH_SIZE: 100,
    MAX_CONCURRENT_REQUESTS: 10
  } as const,
  
  // Заголовки
  HEADERS: {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    USER_AGENT: 'User-Agent',
    X_API_KEY: 'X-API-Key',
    X_TRACE_ID: 'X-Trace-ID',
    X_REQUEST_ID: 'X-Request-ID',
    X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    X_RATE_LIMIT_RESET: 'X-RateLimit-Reset'
  } as const,
  
  // Content Types
  CONTENT_TYPES: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_PNG: 'image/png',
    IMAGE_SVG: 'image/svg+xml'
  } as const,
  
  // Базовые URL для внешних сервисов
  EXTERNAL_APIS: {
    OPENAI_BASE_URL: 'https://api.openai.com/v1',
    ANTHROPIC_BASE_URL: 'https://api.anthropic.com/v1',
    FIGMA_BASE_URL: 'https://api.figma.com/v1'
  } as const
} as const;

export type HttpStatus = typeof API_CONSTANTS.HTTP_STATUS[keyof typeof API_CONSTANTS.HTTP_STATUS];
export type ContentType = typeof API_CONSTANTS.CONTENT_TYPES[keyof typeof API_CONSTANTS.CONTENT_TYPES];
export type InternalEndpoint = typeof API_CONSTANTS.INTERNAL_ENDPOINTS[keyof typeof API_CONSTANTS.INTERNAL_ENDPOINTS];