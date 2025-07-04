# ПЛАН РЕФАКТОРИНГА ДЛИННЫХ ФАЙЛОВ

**Дата создания**: January 27, 2025  
**Приоритет**: HIGH - Критические улучшения архитектуры  
**Статус**: 📋 В планировании  

---

## 📊 АНАЛИЗ ДЛИННЫХ ФАЙЛОВ

### 🔴 КРИТИЧЕСКИЕ ФАЙЛЫ (>1500 строк)

| Файл | Строки | Приоритет | Сложность |
|------|---------|-----------|-----------|
| `src/app/api/agent/logs/route.ts` | 2829 | 🔴 КРИТИЧЕСКИЙ | HIGH |
| `src/agent/specialists/quality-specialist-agent.ts` | 1927 | 🔴 КРИТИЧЕСКИЙ | HIGH |
| `src/agent/specialists/design-specialist-agent-v2.ts` | 1817 | 🔴 КРИТИЧЕСКИЙ | HIGH |
| `src/agent/tools/consolidated/email-renderer.ts` | 1767 | 🔴 КРИТИЧЕСКИЙ | HIGH |

### 🟡 ВЫСОКИЙ ПРИОРИТЕТ (1000-1500 строк)

| Файл | Строки | Приоритет | Сложность |
|------|---------|-----------|-----------|
| `src/agent/specialists/delivery-specialist-agent.ts` | 1357 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/agent/multi-handoff-agent.ts` | 1186 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/domains/template-processing/services/mjml-processor-service.ts` | 1112 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/agent/tools/simple/email-optimization.ts` | 1076 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/agent/tools/consolidated/content-generator.ts` | 1066 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/domains/render-testing/services/screenshot-capture-service.ts` | 1037 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/agent/agent.ts` | 1016 | 🟡 ВЫСОКИЙ | MEDIUM |
| `src/agent/optimization/optimization-engine.ts` | 1002 | 🟡 ВЫСОКИЙ | MEDIUM |

---

## 🎯 ПРИОРИТЕТНЫЕ ЗАДАЧИ РЕФАКТОРИНГА

### 1. 🔴 КРИТИЧЕСКИЙ: agent/logs/route.ts (2829 строк)

**Проблемы**:
- Огромный API route файл
- Множество endpoints в одном файле
- Отсутствие модульности

**План рефакторинга**:
```typescript
// БЫЛО: src/app/api/agent/logs/route.ts (2829 строк)
// СТАЛО: Модульная структура

src/app/api/agent/logs/
├── route.ts                    // 50-100 строк (роутинг)
├── controllers/
│   ├── log-controller.ts       // 200-300 строк
│   ├── analytics-controller.ts // 200-300 строк
│   └── metrics-controller.ts   // 200-300 строк
├── services/
│   ├── log-service.ts          // 300-400 строк
│   ├── analytics-service.ts    // 300-400 строк
│   └── metrics-service.ts      // 300-400 строк
├── middleware/
│   └── log-middleware.ts       // 100-200 строк
└── types/
    └── log-types.ts            // 50-100 строк
```

**Задачи**:
- [ ] Выделить контроллеры для разных типов логов
- [ ] Создать отдельные сервисы для analytics и metrics
- [ ] Добавить middleware для валидации
- [ ] Создать типы для всех log entities

### 2. 🔴 КРИТИЧЕСКИЙ: quality-specialist-agent.ts (1927 строк)

**Проблемы**:
- Монолитный агент с множеством функций
- Все проверки качества в одном файле
- Отсутствие модульности

**План рефакторинга**:
```typescript
// БЫЛО: quality-specialist-agent.ts (1927 строк)
// СТАЛО: Модульная архитектура

src/agent/specialists/quality/
├── quality-specialist-agent.ts     // 200-300 строк (основа)
├── validators/
│   ├── html-validator.ts           // 200-300 строк
│   ├── accessibility-validator.ts  // 200-300 строк
│   ├── performance-validator.ts    // 200-300 строк
│   └── brand-validator.ts          // 200-300 строк
├── analyzers/
│   ├── content-analyzer.ts         // 200-300 строк
│   ├── design-analyzer.ts          // 200-300 строк
│   └── technical-analyzer.ts       // 200-300 строк
├── tools/
│   ├── quality-tools.ts            // 150-200 строк
│   └── reporting-tools.ts          // 150-200 строк
└── types/
    └── quality-types.ts            // 50-100 строк
```

**Задачи**:
- [ ] Выделить валидаторы по типам проверок
- [ ] Создать анализаторы для разных аспектов качества
- [ ] Выделить инструменты в отдельные модули
- [ ] Создать базовый класс BaseQualityValidator

### 3. 🔴 КРИТИЧЕСКИЙ: design-specialist-agent-v2.ts (1817 строк)

**Проблемы**:
- Сложная логика дизайна в одном файле
- Множество Figma интеграций
- Отсутствие разделения concerns

**План рефакторинга**:
```typescript
// БЫЛО: design-specialist-agent-v2.ts (1817 строк)
// СТАЛО: Модульная архитектура

src/agent/specialists/design/
├── design-specialist-agent.ts      // 200-300 строк (основа)
├── figma/
│   ├── figma-asset-manager.ts      // 300-400 строк
│   ├── figma-color-extractor.ts    // 200-300 строк
│   └── figma-component-mapper.ts   // 200-300 строк
├── generators/
│   ├── mjml-generator.ts           // 300-400 строк
│   ├── css-generator.ts            // 200-300 строк
│   └── html-generator.ts           // 200-300 строк
├── tools/
│   ├── design-tools.ts             // 200-300 строк
│   └── color-tools.ts              // 100-200 строк
└── types/
    └── design-types.ts             // 50-100 строк
```

**Задачи**:
- [ ] Выделить Figma интеграции в отдельные модули
- [ ] Создать генераторы для разных типов кода
- [ ] Выделить дизайн-инструменты
- [ ] Создать базовый класс BaseDesignGenerator

### 4. 🔴 КРИТИЧЕСКИЙ: email-renderer.ts (1767 строк)

**Проблемы**:
- Сложная логика рендеринга
- Множество форматов вывода
- Отсутствие модульности

**План рефакторинга**:
```typescript
// БЫЛО: email-renderer.ts (1767 строк)
// СТАЛО: Модульная архитектура

src/agent/tools/consolidated/email-renderer/
├── email-renderer.ts               // 200-300 строк (основа)
├── renderers/
│   ├── mjml-renderer.ts            // 300-400 строк
│   ├── html-renderer.ts            // 200-300 строк
│   └── text-renderer.ts            // 200-300 строк
├── processors/
│   ├── css-processor.ts            // 200-300 строк
│   ├── image-processor.ts          // 200-300 строк
│   └── content-processor.ts        // 200-300 строк
├── validators/
│   ├── render-validator.ts         // 150-200 строк
│   └── output-validator.ts         // 150-200 строк
└── types/
    └── renderer-types.ts           // 50-100 строк
```

**Задачи**:
- [ ] Выделить рендереры по типам вывода
- [ ] Создать процессоры для разных частей email
- [ ] Добавить валидаторы рендеринга
- [ ] Создать базовый класс BaseRenderer

---

## 🟡 ЗАДАЧИ СРЕДНЕГО ПРИОРИТЕТА

### 5. delivery-specialist-agent.ts (1357 строк)

**План рефакторинга**:
```typescript
src/agent/specialists/delivery/
├── delivery-specialist-agent.ts    // 200-300 строк
├── managers/
│   ├── file-manager.ts             // 200-300 строк
│   ├── zip-manager.ts              // 200-300 строк
│   └── upload-manager.ts           // 200-300 строк
├── validators/
│   ├── delivery-validator.ts       // 200-300 строк
│   └── final-validator.ts          // 200-300 строк
└── types/
    └── delivery-types.ts           // 50-100 строк
```

### 6. mjml-processor-service.ts (1112 строк)

**План рефакторинга**:
```typescript
src/domains/template-processing/services/mjml/
├── mjml-processor-service.ts       // 200-300 строк
├── processors/
│   ├── mjml-compiler.ts            // 200-300 строк
│   ├── mjml-optimizer.ts           // 200-300 строк
│   └── mjml-validator.ts           // 200-300 строк
├── transformers/
│   ├── html-transformer.ts         // 200-300 строк
│   └── css-transformer.ts          // 200-300 строк
└── types/
    └── mjml-types.ts               // 50-100 строк
```

### 7. content-generator.ts (1066 строк)

**План рефакторинга**:
```typescript
src/agent/tools/consolidated/content-generator/
├── content-generator.ts            // 200-300 строк
├── generators/
│   ├── text-generator.ts           // 200-300 строк
│   ├── subject-generator.ts        // 200-300 строк
│   └── cta-generator.ts            // 200-300 строк
├── processors/
│   ├── content-processor.ts        // 200-300 строк
│   └── content-optimizer.ts        // 200-300 строк
└── types/
    └── content-types.ts            // 50-100 строк
```

---

## 📋 ОБЩИЕ ПРИНЦИПЫ РЕФАКТОРИНГА

### 1. Модульность
- Каждый модуль не более 400 строк
- Четкое разделение ответственности
- Единая точка входа (index.ts)

### 2. Архитектурные паттерны
- Factory pattern для создания объектов
- Strategy pattern для разных алгоритмов
- Observer pattern для событий
- Interface segregation principle

### 3. Структура модулей
```
module-name/
├── index.ts                        // Публичное API
├── [module-name].ts                // Основной класс
├── types/                          // Типы TypeScript
├── services/                       // Бизнес-логика
├── utils/                          // Утилиты
├── validators/                     // Валидация
└── __tests__/                      // Тесты
```

### 4. Naming conventions
- Классы: PascalCase
- Файлы: kebab-case
- Интерфейсы: PascalCase с префиксом I
- Типы: PascalCase с суффиксом Type

---

## 🚀 ПЛАН РАЗВЕРТЫВАНИЯ

### Неделя 1: Критические файлы
- [ ] agent/logs/route.ts → модульная структура
- [ ] quality-specialist-agent.ts → базовое разделение

### Неделя 2: Специалисты
- [ ] design-specialist-agent-v2.ts → модули дизайна
- [ ] delivery-specialist-agent.ts → менеджеры доставки

### Неделя 3: Инструменты
- [ ] email-renderer.ts → рендереры
- [ ] content-generator.ts → генераторы контента

### Неделя 4: Сервисы
- [ ] mjml-processor-service.ts → MJML модули
- [ ] screenshot-capture-service.ts → капчуры

### Неделя 5: Оптимизация
- [ ] optimization-engine.ts → оптимизаторы
- [ ] email-optimization.ts → оптимизация email

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### Технические улучшения:
- **Размер файлов**: <400 строк на модуль
- **Модульность**: 100% файлов разделены
- **Maintainability**: Легкость сопровождения
- **Testability**: Юнит-тесты для каждого модуля

### Качественные улучшения:
- ✅ Лучшая читаемость кода
- ✅ Упрощение добавления новых функций
- ✅ Улучшенная отладка
- ✅ Более быстрая разработка

---

**Статус**: 📋 Готов к реализации  
**Команда**: Full-stack development team  
**Время выполнения**: 5 недель 