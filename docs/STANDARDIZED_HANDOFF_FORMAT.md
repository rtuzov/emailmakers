# Стандартизированный Формат Handoff Файлов

## Обзор

Данная документация описывает единый стандартизированный формат handoff файлов для передачи контекста между специалистами в системе Email-Makers. Этот формат заменяет разрозненные форматы файлов передачи и обеспечивает единообразие данных.

## Основные Компоненты

### 1. Handoff Info (Информация о передаче)
```json
{
  "handoff_info": {
    "from_specialist": "data-collection | content | design | quality | delivery",
    "to_specialist": "content | design | quality | delivery",
    "handoff_id": "handoff_1234567890_abc123",
    "created_at": "2025-07-16T12:00:00.000Z",
    "campaign_id": "campaign_1234567890_xyz",
    "campaign_path": "/path/to/campaign",
    "trace_id": "trace_abc123",
    "data_version": "2.0",
    "execution_time": 1500
  }
}
```

### 2. Campaign Context (Контекст кампании)
```json
{
  "campaign_context": {
    "campaign_id": "campaign_1234567890_xyz",
    "campaign_name": "Summer Thailand Campaign",
    "brand": "Travel Company",
    "type": "promotional",
    "target_audience": "young travelers",
    "language": "ru",
    "campaign_path": "/path/to/campaign",
    "status": "active"
  }
}
```

### 3. Specialist Outputs (Выходы специалистов)
```json
{
  "specialist_outputs": {
    "data_collection": {
      "destination_analysis": { /* данные анализа направления */ },
      "market_intelligence": { /* рыночная аналитика */ },
      "emotional_profile": { /* эмоциональный профиль */ },
      "trend_analysis": { /* анализ трендов */ },
      "consolidated_insights": { /* консолидированные инсайты */ },
      "travel_intelligence": { /* туристическая аналитика */ },
      "collection_metadata": { /* метаданные сбора */ }
    },
    "content": {
      "context_analysis": { /* анализ контекста */ },
      "date_analysis": { /* анализ дат */ },
      "pricing_analysis": { /* анализ цен */ },
      "asset_strategy": { /* стратегия ассетов */ },
      "generated_content": { /* сгенерированный контент */ },
      "technical_requirements": { /* технические требования */ },
      "design_brief": { /* дизайн-бриф */ }
    },
    "design": {
      "asset_manifest": { /* манифест ассетов */ },
      "mjml_template": { /* MJML шаблон */ },
      "design_decisions": { /* дизайн решения */ },
      "preview_files": [ /* файлы предпросмотра */ ],
      "performance_metrics": { /* метрики производительности */ },
      "template_specifications": { /* спецификации шаблона */ }
    },
    "quality": {
      "quality_report": { /* отчёт о качестве */ },
      "test_artifacts": { /* артефакты тестирования */ },
      "compliance_status": { /* статус соответствия */ },
      "validation_results": { /* результаты валидации */ },
      "client_compatibility": { /* совместимость с клиентами */ },
      "accessibility_results": { /* результаты доступности */ }
    }
  }
}
```

### 4. Workflow Status (Статус рабочего процесса)
```json
{
  "workflow_status": {
    "completed_specialists": ["data-collection", "content", "design"],
    "current_specialist": "quality",
    "next_specialist": "delivery",
    "workflow_phase": "quality-assurance",
    "completion_percentage": 80,
    "estimated_completion_time": "2025-07-16T14:00:00.000Z"
  }
}
```

### 5. Deliverables (Результаты)
```json
{
  "deliverables": {
    "created_files": [
      {
        "file_name": "email-template.mjml",
        "file_path": "/path/to/email-template.mjml",
        "file_type": "template",
        "file_size": 15642,
        "description": "MJML email template with responsive design",
        "created_at": "2025-07-16T12:00:00.000Z",
        "is_primary": true
      }
    ],
    "output_directories": [
      {
        "directory_name": "templates",
        "directory_path": "/path/to/templates",
        "content_type": "templates",
        "file_count": 3,
        "total_size": 45000
      }
    ],
    "key_outputs": ["email-template.mjml", "quality-report.json"]
  }
}
```

### 6. Handoff Data (Данные передачи)
```json
{
  "handoff_data": {
    "summary": "Quality assurance completed successfully with 95% compatibility",
    "context_for_next": "All tests passed, ready for delivery packaging",
    "recommendations": [
      "Include mobile preview in package",
      "Add deployment instructions"
    ],
    "priority_items": [
      "Email client compatibility report",
      "Accessibility compliance certificate"
    ],
    "potential_issues": [
      "Large file size may affect load time",
      "Complex CSS may not render in older clients"
    ],
    "validation_notes": [
      "HTML validation passed",
      "CSS validation passed with warnings"
    ],
    "success_criteria": [
      "95%+ email client compatibility",
      "WCAG AA accessibility compliance",
      "Load time under 3 seconds"
    ]
  }
}
```

### 7. Quality Metadata (Метаданные качества)
```json
{
  "quality_metadata": {
    "data_quality_score": 95,
    "completeness_score": 98,
    "validation_status": "passed",
    "error_count": 0,
    "warning_count": 2,
    "processing_time": 15000,
    "memory_usage": 52428800
  }
}
```

## Workflow Phases (Фазы рабочего процесса)

1. **data-collection** → **content-generation**
2. **content-generation** → **design-creation**
3. **design-creation** → **quality-assurance**
4. **quality-assurance** → **delivery-preparation**

## Типы файлов

- **data**: Файлы данных (JSON, CSV)
- **content**: Контентные файлы (MD, TXT)
- **template**: Шаблоны (MJML, HTML)
- **asset**: Ассеты (изображения, иконки)
- **report**: Отчёты (качества, производительности)
- **documentation**: Документация (README, инструкции)

## Статусы валидации

- **passed**: Валидация прошла успешно
- **warning**: Валидация прошла с предупреждениями
- **failed**: Валидация не прошла

## Использование

### Создание handoff файла

```typescript
import { createStandardizedHandoff } from '../core/standardized-handoff-tool';

const result = await createStandardizedHandoff.execute({
  from_specialist: 'quality',
  to_specialist: 'delivery',
  campaign_id: 'campaign_1234567890_xyz',
  campaign_path: '/path/to/campaign',
  specialist_data: {
    quality_report: qualityData,
    test_artifacts: testResults,
    compliance_status: complianceData
  },
  handoff_context: {
    summary: 'Quality assurance completed successfully',
    context_for_next: 'Ready for delivery packaging',
    recommendations: ['Include mobile preview', 'Add deployment instructions'],
    priority_items: ['Compatibility report', 'Accessibility certificate'],
    potential_issues: ['Large file size warning'],
    success_criteria: ['95%+ compatibility', 'WCAG AA compliance']
  },
  deliverables: {
    created_files: [
      {
        file_name: 'quality-report.json',
        file_path: '/path/to/quality-report.json',
        file_type: 'report',
        description: 'Comprehensive quality assurance report',
        is_primary: true
      }
    ],
    key_outputs: ['quality-report.json', 'test-results.json']
  },
  quality_metadata: {
    data_quality_score: 95,
    completeness_score: 98,
    validation_status: 'passed',
    error_count: 0,
    warning_count: 2,
    processing_time: 15000
  },
  trace_id: 'trace_abc123'
});
```

### Чтение handoff файла

```typescript
import { deserializeHandoffData, validateHandoffData, StandardizedHandoffSchema } from '../core/standardized-handoff-tool';

const handoffPath = '/path/to/handoffs/quality-to-delivery.json';
const handoffContent = await fs.readFile(handoffPath, 'utf-8');
const handoffData = deserializeHandoffData(handoffContent);

const validation = validateHandoffData(handoffData, StandardizedHandoffSchema);
if (validation.success) {
  console.log('Handoff data is valid:', validation.data);
} else {
  console.error('Handoff validation failed:', validation.errors);
}
```

## Файловая Структура

```
campaigns/
├── campaign_1234567890_xyz/
│   ├── handoffs/
│   │   ├── data-collection-to-content.json
│   │   ├── content-to-design.json
│   │   ├── design-to-quality.json
│   │   └── quality-to-delivery.json
│   ├── data/
│   ├── content/
│   ├── templates/
│   ├── assets/
│   └── campaign-metadata.json
```

## Преимущества Стандартизации

1. **Единообразие**: Все handoff файлы имеют одинаковую структуру
2. **Валидация**: Автоматическая проверка корректности данных
3. **Трассировка**: Полная история передач между специалистами
4. **Метрики**: Детальные метрики качества и производительности
5. **Масштабируемость**: Легко добавлять новых специалистов
6. **Совместимость**: Обратная совместимость с существующими системами

## Миграция

Существующие handoff файлы автоматически мигрируют в новый формат при первом использовании стандартизированного инструмента. Старые файлы сохраняются как резервные копии.

## Мониторинг

Все handoff операции логируются с подробными метриками:
- Время выполнения
- Размер данных
- Количество ошибок
- Статус валидации
- Идентификаторы трассировки

## Безопасность

- Валидация всех входных данных
- Проверка путей файлов
- Контроль размера данных
- Шифрование чувствительных данных (при необходимости)

## Поддержка

При возникновении проблем с handoff файлами:
1. Проверьте логи агента
2. Убедитесь в корректности campaign_path
3. Проверьте права доступа к файлам
4. Используйте trace_id для отслеживания операций