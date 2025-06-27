# Agent Logs & Traces API

Система логирования и трейсинга агента предоставляет полную видимость в работу Email Generator Agent через REST API.

## Обзор

API позволяет:
- Получать логи работы агента с фильтрацией
- Просматривать trace выполнения задач
- Получать метрики производительности
- Управлять логами (очистка, экспорт)
- Изменять уровень логирования

## API Endpoints

### GET /api/agent/logs

Получить логи и trace информацию агента.

**Параметры запроса:**
- `level` (string, optional): Уровень логирования (`debug`, `info`, `warn`, `error`, `all`). По умолчанию: `info`
- `limit` (number, optional): Максимальное количество логов. По умолчанию: `100`
- `since` (string, optional): ISO timestamp для фильтрации логов с определенного времени
- `tool` (string, optional): Фильтр по названию инструмента
- `format` (string, optional): Формат ответа (`json`, `text`, `prometheus`). По умолчанию: `json`

**Пример запроса:**
```bash
curl "http://localhost:3000/api/agent/logs?level=error&limit=50&tool=get_prices"
```

**Ответ:**
```json
{
  "success": true,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "filters": {
    "level": "error",
    "limit": 50,
    "since": null,
    "tool": "get_prices"
  },
  "data": {
    "logs": [
      {
        "level": "error",
        "msg": "Failed to fetch prices",
        "timestamp": "2025-01-27T10:25:00.000Z",
        "tool": "get_prices",
        "error": "API timeout"
      }
    ],
    "metrics": {
      "tool_success_total": [
        {
          "labels": { "tool": "get_prices" },
          "value": 45,
          "timestamp": "2025-01-27T10:30:00.000Z"
        }
      ]
    },
    "traces": [
      {
        "traceId": "email-gen-1738056000000-abc123",
        "status": "completed",
        "duration": 15000,
        "context": {
          "topic": "Путешествие в Париж",
          "destination": "CDG",
          "origin": "LED"
        },
        "steps": [
          {
            "stepId": 1,
            "tool": "get_prices",
            "action": "fetch_flight_prices",
            "timestamp": "2025-01-27T10:25:00.000Z",
            "duration": 2000,
            "result": { "success": true }
          }
        ]
      }
    ],
    "summary": {
      "total_logs": 1,
      "log_levels": {
        "error": 1,
        "warn": 0,
        "info": 0,
        "debug": 0
      },
      "time_range": {
        "start": "2025-01-27T10:25:00.000Z",
        "end": "2025-01-27T10:25:00.000Z",
        "duration": 0
      },
      "active_traces": 0
    }
  }
}
```

### POST /api/agent/logs

Управление логами агента.

**Тело запроса:**
```json
{
  "action": "clear|set_level|export",
  "level": "debug|info|warn|error",  // для action: set_level
  "format": "json|text"              // для action: export
}
```

**Действия:**

#### Очистка логов
```bash
curl -X POST http://localhost:3000/api/agent/logs \
  -H "Content-Type: application/json" \
  -d '{"action": "clear"}'
```

#### Изменение уровня логирования
```bash
curl -X POST http://localhost:3000/api/agent/logs \
  -H "Content-Type: application/json" \
  -d '{"action": "set_level", "level": "debug"}'
```

#### Экспорт логов
```bash
curl -X POST http://localhost:3000/api/agent/logs \
  -H "Content-Type: application/json" \
  -d '{"action": "export", "format": "json"}'
```

## Trace System

Система трейсинга автоматически отслеживает выполнение задач агента.

### Структура Trace

```typescript
interface TraceEntry {
  traceId: string;                    // Уникальный ID трейса
  startTime: number;                  // Время начала (timestamp)
  startTimestamp: string;             // ISO timestamp начала
  endTime?: number;                   // Время окончания (timestamp)
  endTimestamp?: string;              // ISO timestamp окончания
  duration?: number;                  // Длительность в миллисекундах
  status: 'active' | 'completed' | 'failed';
  context: {                          // Контекст выполнения
    topic: string;
    destination?: string;
    origin?: string;
    workflow: string;
  };
  steps: TraceStep[];                 // Шаги выполнения
  result?: any;                       // Результат выполнения
  error?: any;                        // Ошибка (если есть)
}

interface TraceStep {
  stepId: number;                     // Номер шага
  tool: string;                       // Название инструмента
  action: string;                     // Действие
  timestamp: string;                  // Время выполнения
  params?: any;                       // Параметры
  result?: any;                       // Результат
  error?: any;                        // Ошибка
  duration?: number;                  // Длительность шага
}
```

### Автоматическое трейсирование

Трейсирование включается автоматически при каждом вызове агента:

```typescript
// В коде агента автоматически создается trace
const traceId = `email-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
logger.startTrace(traceId, {
  topic: request.topic,
  destination: request.destination,
  origin: request.origin,
  workflow: 'email_generation'
});

// Каждый шаг автоматически записывается
logger.addTraceStep(traceId, {
  tool: 'get_prices',
  action: 'fetch_flight_prices',
  params: { origin, destination },
  result: { success: true, prices: [...] },
  duration: 2000
});

// Trace завершается автоматически
await logger.endTrace(traceId, result);
```

## Метрики

Система собирает метрики в формате Prometheus:

### Доступные метрики

- `tool_success_total` - Количество успешных выполнений инструментов
- `tool_failure_total` - Количество неудачных выполнений инструментов

### Получение метрик Prometheus

```bash
curl "http://localhost:3000/api/agent/logs?format=prometheus"
```

Ответ в формате Prometheus:
```
# HELP tool_success_total Total successful tool executions
# TYPE tool_success_total counter
tool_success_total{tool="get_prices"} 45
tool_success_total{tool="render_mjml"} 38

# HELP tool_failure_total Total failed tool executions  
# TYPE tool_failure_total counter
tool_failure_total{tool="get_prices"} 2
tool_failure_total{tool="render_mjml"} 1
```

## Веб-интерфейс

Доступен веб-интерфейс для удобного просмотра логов и трейсов:

```
http://localhost:3000/agent-logs
```

### Возможности интерфейса:

- **Фильтрация логов** по уровню, времени, инструменту
- **Просмотр трейсов** с детальной информацией о каждом шаге
- **Мониторинг метрик** в реальном времени
- **Экспорт данных** в JSON или текстовом формате
- **Очистка логов** одним кликом
- **Автообновление** данных

## Примеры использования

### Мониторинг ошибок

```bash
# Получить все ошибки за последний час
curl "http://localhost:3000/api/agent/logs?level=error&since=2025-01-27T09:30:00.000Z"
```

### Анализ производительности

```bash
# Получить все трейсы для анализа времени выполнения
curl "http://localhost:3000/api/agent/logs" | jq '.data.traces[] | {traceId, duration, status}'
```

### Отладка конкретного инструмента

```bash
# Получить логи только для инструмента get_prices
curl "http://localhost:3000/api/agent/logs?tool=get_prices&level=debug"
```

### Экспорт для анализа

```bash
# Экспортировать все логи в файл
curl -X POST http://localhost:3000/api/agent/logs \
  -H "Content-Type: application/json" \
  -d '{"action": "export", "format": "json"}'
```

## Хранение данных

- **Логи**: Сохраняются в файлы в директории `temp/agent-*.log`
- **Трейсы**: Сохраняются в файлы в директории `temp/trace-*.json`
- **Буферизация**: Логи буферизуются в памяти и сохраняются каждые 30 секунд
- **Ротация**: Старые файлы автоматически не удаляются (требуется ручная очистка)

## Безопасность

- API не требует аутентификации (только для локальной разработки)
- Логи могут содержать чувствительную информацию
- Рекомендуется ограничить доступ к API в продакшене
- Файлы логов должны быть защищены от несанкционированного доступа

## Ограничения

- Максимум 1000 логов в буфере памяти
- Максимум 10000 логов при экспорте
- Файлы логов не ротируются автоматически
- Трейсы хранятся только до перезапуска сервера (активные трейсы)

## Интеграция с мониторингом

Для интеграции с системами мониторинга (Prometheus, Grafana):

1. Настройте Prometheus для сбора метрик с `/api/agent/logs?format=prometheus`
2. Создайте дашборды в Grafana для визуализации метрик
3. Настройте алерты на основе метрик ошибок и производительности 