# Context Validation Documentation

## Описание

Система валидации контекста обеспечивает целостность и корректность данных при передаче между специалистами в системе Email-Makers. Эта документация описывает инструменты и процедуры валидации, которые были добавлены в рамках задачи 11.

## Основные компоненты

### 1. Context Validation Tool

**Файл:** `/src/agent/core/context-validation-tool.ts`

Основной инструмент для валидации контекста при передаче между специалистами, включающий:

- **validateHandoffContext** - Полная валидация контекста handoff
- **quickValidateHandoff** - Быстрая валидация основных параметров

### 2. Интеграция с Standardized Handoff

**Файл:** `/src/agent/core/standardized-handoff-tool.ts`

Обновленный инструмент создания стандартизированных handoff с интегрированной валидацией:

- Добавлен параметр `validate_context` (по умолчанию: true)
- Автоматическая валидация перед созданием handoff
- Логирование результатов валидации

## Типы валидации

### 1. Валидация workflow статуса

Проверяет корректность последовательности передачи между специалистами:

```
data-collection → content → design → quality → delivery
```

**Проверки:**
- Корректность названий специалистов
- Правильность последовательности переходов
- Завершенность работы предыдущих специалистов
- Соответствие процента завершения ожидаемому

### 2. Валидация качества данных

Проверяет метрики качества данных:

- **data_quality_score** (0-100): Оценка качества данных
- **completeness_score** (0-100): Оценка полноты данных
- **validation_status** (passed/warning/failed): Статус валидации
- **error_count/warning_count**: Количество ошибок и предупреждений

### 3. Валидация специфических данных

Проверяет структуру и содержимое данных для каждого типа передачи:

#### Data Collection → Content
```typescript
{
  destination_analysis: object (required),
  market_intelligence: object (required),
  emotional_profile: object (required),
  trend_analysis: object (required),
  consolidated_insights: object (required)
}
```

#### Content → Design
```typescript
{
  context_analysis: object (required),
  date_analysis: object (required),
  pricing_analysis: object (required),
  asset_strategy: object (required),
  generated_content: object (required),
  design_brief: object (required)
}
```

#### Design → Quality
```typescript
{
  mjml_template: object (required),
  asset_manifest: object (required),
  design_decisions: object (required),
  performance_metrics: object (required),
  template_specifications: object (required)
}
```

#### Quality → Delivery
```typescript
{
  quality_report: object (required),
  validation_results: object (required),
  client_compatibility: object (required),
  accessibility_results: object (required),
  compliance_status: object (required)
}
```

### 4. Валидация файлов и ресурсов

Проверяет наличие и корректность файлов:

- Существование директории кампании
- Наличие обязательных директорий (data, handoffs, content, templates, assets, docs)
- Существование указанных файлов в deliverables
- Проверка на пустые файлы

## Инструменты валидации

### validateHandoffContext

Основной инструмент для полной валидации контекста handoff.

**Параметры:**
- `from_specialist` - Специалист-отправитель
- `to_specialist` - Специалист-получатель
- `campaign_path` - Путь к кампании
- `specialist_data` - Данные от специалиста
- `workflow_status` - Статус workflow
- `quality_metadata` - Метаданные качества
- `deliverables` - Результаты работы
- `trace_id` - ID трассировки

**Возвращает:**
Строку с результатами валидации, включая статус, количество ошибок и предупреждений.

### quickValidateHandoff

Быстрая валидация основных параметров без проверки файлов.

**Параметры:**
- `from_specialist` - Специалист-отправитель
- `to_specialist` - Специалист-получатель
- `specialist_data` - Данные от специалиста
- `quality_metadata` - Метаданные качества

**Возвращает:**
Строку с результатами быстрой валидации.

## Интеграция в специалистов

### Data Collection Specialist

**Файл:** `/src/agent/specialists/data-collection-specialist-tools.ts`

Интеграция валидации в `createHandoffFile`:

```typescript
// Добавлен параметр validate_context: boolean (default: true)
// Выполняется quickValidateHandoff перед созданием handoff
// Передается validate_context в createStandardizedHandoff
```

### Content Specialist

**Файл:** `/src/agent/specialists/content/tools/handoff-tools.ts`

Интеграция валидации в `createHandoffFile`:

```typescript
// Добавлен параметр validate_context: boolean (default: true)
// Выполняется quickValidateHandoff перед созданием handoff
// Логирование результатов валидации
// Передается validate_context в createStandardizedHandoff
```

## Результаты валидации

### Структура результата

```typescript
{
  validation_status: 'passed' | 'failed',
  errors: string[],
  warnings: string[],
  error_count: number,
  warning_count: number,
  validation_details: {
    workflow: { isValid: boolean, errors: string[], warnings: string[] },
    quality: { isValid: boolean, errors: string[], warnings: string[] },
    specialist: { success: boolean, type: string },
    files: { isValid: boolean, errors: string[], warnings: string[] }
  },
  timestamp: string,
  trace_id: string | null
}
```

### Критерии успешной валидации

Валидация считается успешной если:
- Нет критических ошибок (errors.length === 0)
- Workflow статус корректен
- Качество данных соответствует минимальным требованиям
- Структура данных специалиста корректна
- Все необходимые файлы присутствуют

## Логирование

Система валидации интегрирована с системой логирования Email-Makers:

- **INFO** - Успешная валидация
- **WARN** - Предупреждения валидации
- **ERROR** - Ошибки валидации

Все события логируются с trace_id для отслеживания.

## Конфигурация

### Включение/отключение валидации

Валидация может быть отключена для отдельных handoff:

```typescript
// В параметрах инструмента
validate_context: false
```

### Настройка критериев качества

Критерии качества данных настраиваются в `validateDataQuality`:

```typescript
// Минимальные значения
data_quality_score >= 70  // warning if < 70
completeness_score >= 80  // warning if < 80
error_count <= 5          // error if > 5
```

## Обработка ошибок

### Критические ошибки

Останавливают выполнение handoff:
- Отсутствие обязательных данных
- Некорректная структура данных
- Критические ошибки файловой системы

### Предупреждения

Не останавливают выполнение, но логируются:
- Низкое качество данных
- Отсутствие необязательных файлов
- Предупреждения workflow

## Примеры использования

### Создание handoff с валидацией

```typescript
const result = await createHandoffFile.execute({
  from_specialist: 'data-collection',
  to_specialist: 'content',
  campaign_id: 'campaign_123',
  campaign_path: '/path/to/campaign',
  specialist_data: {
    destination_analysis: { ... },
    market_intelligence: { ... },
    // ... другие данные
  },
  validate_context: true // Включить валидацию
});
```

### Только валидация без создания handoff

```typescript
const validationResult = await validateHandoffContext.execute({
  from_specialist: 'content',
  to_specialist: 'design',
  campaign_path: '/path/to/campaign',
  specialist_data: { ... },
  workflow_status: { ... },
  quality_metadata: { ... },
  deliverables: { ... },
  trace_id: 'trace_123'
});
```

## Лучшие практики

1. **Всегда включайте валидацию** для production handoff
2. **Проверяйте результаты валидации** перед продолжением workflow
3. **Устраняйте все критические ошибки** перед передачей
4. **Логируйте предупреждения** для мониторинга качества
5. **Используйте trace_id** для отслеживания проблем

## Расширение системы

Для добавления новых типов валидации:

1. Создайте новую схему валидации в `context-validation-tool.ts`
2. Добавьте соответствующий case в `validateHandoffContext`
3. Обновите документацию
4. Добавьте тесты для новой валидации

## Мониторинг и отладка

Для отслеживания проблем валидации:

1. Используйте trace_id в логах
2. Мониторьте метрики качества данных
3. Отслеживайте частоту ошибок валидации
4. Анализируйте предупреждения для улучшения качества

## Совместимость

Система валидации контекста:
- Совместима с существующими handoff инструментами
- Может быть отключена для обратной совместимости
- Не влияет на производительность при отключении
- Интегрирована со всеми типами специалистов

## Заключение

Система валидации контекста обеспечивает надежность и целостность данных при передаче между специалистами в Email-Makers. Она предоставляет гибкие инструменты для проверки качества данных, структуры handoff и состояния workflow, что повышает общее качество системы и снижает количество ошибок.