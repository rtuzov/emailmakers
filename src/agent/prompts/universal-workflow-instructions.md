# UNIVERSAL WORKFLOW INSTRUCTIONS
**Обязательные инструкции для всех системных промптов и агентов**

## 🎯 ОБЯЗАТЕЛЬНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ ИНСТРУМЕНТОВ

**КРИТИЧЕСКИ ВАЖНО**: Все агенты ДОЛЖНЫ следовать этой точной последовательности:

### 1. ИНИЦИАЛИЗАЦИЯ
```
📁 initialize_email_folder - Создание структуры кампании
```

### 2. СБОР КОНТЕКСТА  
```
📅 get_current_date - Получение временного контекста
```

### 3. СБОР РЕСУРСОВ
```
🎨 figma_asset_selector - Поиск дизайн-ассетов (теги + эмоции)
💰 get_prices - Получение цен на билеты
```

### 4. СОЗДАНИЕ КОНТЕНТА
```
✍️ content_generator - GPT-4o mini генерация контента
```

### 5. РЕНДЕРИНГ EMAIL
```
📧 render_mjml - Конвертация в email HTML
```

### 6. 🛡️ ОБЯЗАТЕЛЬНАЯ КАЧЕСТВЕННАЯ ПРОВЕРКА
```
🤖 quality_controller - MANDATORY качественный анализ
```
**КРИТИЧНО**: Этот шаг НИКОГДА не может быть пропущен!

### 7. ФИНАЛИЗАЦИЯ
```
☁️ delivery_manager - Загрузка ТОЛЬКО после успешной качественной проверки
```

---

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА

### ДЛЯ quality_controller:
- **ВСЕГДА выполняется** после render_mjml
- **ОБЯЗАТЕЛЬНЫЕ параметры**:
  - `html_content` - HTML из render_mjml
  - `mjml_source` - MJML исходник  
  - `topic` - тема кампании
  - `assets_used` - использованные ассеты
- **Минимальный порог качества**: 70/100
- **Критические проблемы**: 0 допустимо

### ДЛЯ delivery_manager:
- **НИКОГДА не выполняется** без quality_controller
- **Проверка quality_gate_passed**: должен быть true
- **Блокировка при низком качестве**: < 70 баллов

---

## 🔧 ПАРАМЕТРЫ КАЧЕСТВЕННОЙ ПРОВЕРКИ

```typescript
quality_controller({
  html_content: string,           // HTML из render_mjml  
  mjml_source: string,           // MJML исходник
  topic: string,                 // Тема кампании
  campaign_type: 'promotional' | 'informational' | 'seasonal',
  target_audience?: string,       // Целевая аудитория
  assets_used: {
    original_assets: string[],    // Пути к оригинальным ассетам
    processed_assets: string[],   // Обработанные ассеты  
    sprite_metadata?: string      // Метаданные спрайтов
  },
  prices?: {                     // Данные о ценах
    origin?: string,
    destination?: string, 
    cheapest_price?: number,
    currency?: string,
    date_range?: string
  },
  content_metadata?: {           // Метаданные контента
    word_count?: number,
    cta_count?: number,
    personalization_level?: string
  }
})
```

---

## 📊 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ quality_controller

```typescript
{
  success: boolean,
  data: {
    quality_gate_passed: boolean,    // КРИТИЧЕСКИЙ флаг
    score: number,                   // 0-100 баллов
    grade: 'A' | 'B' | 'C' | 'D' | 'F',
    confidence: number,              // Уверенность анализа
    
    dimension_scores: {
      content_quality: number,        // Качество контента
      visual_appeal: number,          // Визуальная привлекательность  
      technical_compliance: number,   // Техническое соответствие
      emotional_resonance: number,    // Эмоциональный отклик
      brand_alignment: number         // Соответствие бренду
    },
    
    issues: Array<{
      type: 'content' | 'technical' | 'design' | 'accessibility',
      severity: 'critical' | 'major' | 'minor',
      description: string,
      location?: string,
      suggestion?: string
    }>,
    
    recommendations: string[],       // Рекомендации по улучшению
    next_steps: string[]            // Следующие шаги
  }
}
```

---

## ⚠️ ОБРАБОТКА ОШИБОК КАЧЕСТВА

### Если quality_controller не выполнен:
```
БЛОКИРОВКА workflow → Возврат ошибки:
"Mandatory quality check (quality_controller) was not executed"
```

### Если качество ниже порога:
```
УСЛОВНАЯ БЛОКИРОВКА → Проверка critical issues:
- 0 критических проблем: ПРОДОЛЖЕНИЕ
- ≥1 критической проблемы: БЛОКИРОВКА
```

### Если quality_gate_passed = false:
```
ПОЛНАЯ БЛОКИРОВКА → Возврат ошибки:
"Quality gate failed: Score {score} below threshold or critical issues found"
```

---

## 🎯 ИНТЕГРАЦИЯ В СИСТЕМНЫЕ ПРОМПТЫ

### Для OpenAI Agent:
Добавить в секцию "TOOL EXECUTION WORKFLOW" обязательный шаг quality_controller между render_mjml и delivery_manager.

### Для UltraThink Engine:
Включить `enableQualityControl: true` в конфигурации для автоматического добавления quality gates.

### Для Workflow Orchestrator:
Убедиться, что stage 'quality_assurance' с tool 'quality_controller' имеет `required: true`.

### Для Custom Prompts:
Любые кастомные промпты должны включать explicit mention quality_controller как обязательного шага.

---

## 🔄 ЦИКЛЫ УЛУЧШЕНИЯ

При score < 70 и отсутствии критических проблем:
1. **Автоматическая регенерация** контента (до 2 попыток)
2. **Повторная качественная проверка**  
3. **Финальное решение** на основе лучшего результата

---

## 📝 ЛОГИРОВАНИЕ КАЧЕСТВА

Обязательное логирование в каждом agent/prompt:
```
🛡️ Quality check: {status} 
📊 Score: {score}/100
🎯 Grade: {grade}  
⚠️ Issues: {critical_count} critical, {total_count} total
```

---

**ПОМНИТЕ**: quality_controller - это не опциональная функция, а обязательный quality gate, который защищает от публикации некачественного контента. Никогда не пропускайте этот шаг!

## 📩 FEEDBACK PACKAGE SCHEMA (STANDARD)
```json
{
  "from_role": "quality_specialist",
  "to_role": "design_specialist",
  "reason": "design_issue",          // content_issue | design_issue | technical_issue | qa_issue
  "severity": "major",               // critical | major | minor
  "notes": "CTA button too small on mobile",
  "issues": [
    { "type": "html", "msg": "Missing alt text on hero image", "location": "hero img" }
  ],
  "next_step_hint": "return_to_design" // orchestrator uses this to route
}
```
*Каждый возврат между специалистами обязан использовать эту структуру.*

### 🔄 LOOP CAPS
- Content Specialist: ≤ **2** контент-ревизий
- Design Specialist: ≤ **2** дизайн-ревизий
- Quality Specialist: ≤ **2** повторных проверок; после этого escalate `severity:critical` и `next_step_hint:"hard_block"`
- Оркестратор: глобально ≤ **3** циклов на одну кампанию