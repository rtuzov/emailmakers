# ТЕКУЩИЕ ЗАДАЧИ ПО УЛУЧШЕНИЮ MULTI-HANDOFF-AGENT

## 🎯 ПРИОРИТЕТНЫЕ ЗАДАЧИ (В РАБОТЕ)

### HIGH PRIORITY - Рефакторинг multi-handoff-agent.ts
**Статус**: 🔄 В планировании  
**Дедлайн**: 2 недели  
**Ответственный**: Команда разработки

#### ✅ Задачи:
- [ ] **Создать структуру модулей**
  ```bash
  mkdir -p src/agent/modules
  mkdir -p src/agent/prompts/{specialists,orchestrator,tools,feedback,templates}
  mkdir -p src/agent/core
  ```

- [ ] **Выделить Image Planning Module** (`src/agent/modules/image-planning.ts`)
  - Перенести функции: `planEmailImages`, `extractTopicTags`, `selectFigmaAssetByTags`
  - Создать интерфейс `ImagePlanningConfig`
  - Добавить unit тесты

- [ ] **Выделить Specialist Agents Module** (`src/agent/modules/specialist-agents.ts`)
  - Перенести определения агентов: `contentSpecialist`, `designSpecialist`, `qualitySpecialist`, `deliverySpecialist`
  - Создать фабрику `createSpecialistAgents()`
  - Добавить типы конфигурации

- [ ] **Выделить Agent Tools Module** (`src/agent/modules/agent-tools.ts`)
  - Перенести tool definitions: `contentGeneratorTool`, `emailRendererTool`, `qualityControllerTool`, `deliveryManagerTool`
  - Создать фабрику `createAgentTools()`
  - Добавить интерфейсы параметров

- [ ] **Выделить Orchestration Module** (`src/agent/modules/orchestration.ts`)
  - Перенести функцию `generateKupibiletEmail`
  - Создать класс `EmailCampaignOrchestrator`
  - Добавить конфигурацию workflow

### MEDIUM PRIORITY - Система промптов
**Статус**: 🔄 В планировании  
**Дедлайн**: 3 недели  

#### ✅ Задачи:
- [ ] **Создать PromptManager** (`src/agent/core/prompt-manager.ts`)
  - Загрузка промптов из файлов
  - Кэширование и валидация
  - Поддержка переменных

- [ ] **Создать промпты для специалистов**
  - `src/agent/prompts/specialists/content-specialist.md`
  - `src/agent/prompts/specialists/design-specialist.md`
  - `src/agent/prompts/specialists/quality-specialist.md`
  - `src/agent/prompts/specialists/delivery-specialist.md`

- [ ] **Создать промпты для оркестратора**
  - `src/agent/prompts/orchestrator/main-orchestrator.md`
  - `src/agent/prompts/orchestrator/workflow-instructions.md`

### MEDIUM PRIORITY - Трейсинг OpenAI Agent SDK
**Статус**: 📋 Запланировано  
**Дедлайн**: 4 недели  

#### ✅ Задачи:
- [ ] **Настроить базовый трейсинг** (`src/agent/core/tracing-setup.ts`)
  ```typescript
  import { withTrace, getGlobalTraceProvider } from '@openai/agents';
  
  const traceConfig = {
    workflowName: 'Kupibilet Email Campaign',
    traceIncludeSensitiveData: false,
    traceMetadata: {
      version: '1.0',
      environment: process.env.NODE_ENV,
      campaign_type: 'email_generation'
    }
  };
  ```

- [ ] **Создать custom spans для агентов**
  - Content Specialist span
  - Design Specialist span  
  - Quality Specialist span
  - Delivery Specialist span

- [ ] **Интегрировать HandoffSpan для переходов**
  - Автоматическое создание spans при handoffs
  - Метаданные переходов между агентами

## 🔄 ЗАДАЧИ В РАЗРАБОТКЕ

### Система обратной связи
**Статус**: 🔄 В планировании  

#### ✅ Задачи:
- [ ] **Создать FeedbackLoop класс** (`src/agent/core/feedback-loop.ts`)
  - Система оценки качества работы агентов
  - Механизм повторного выполнения
  - Счетчик итераций (лимит: 3)
  - Логирование причин повторов

- [ ] **Интеграция обратной связи в Quality Specialist**
  - Критерии отклонения работы (качество < 80%)
  - Handoff обратно к Content/Design Specialist
  - Улучшенные промпты с конкретными замечаниями

- [ ] **Интеграция обратной связи в Delivery Specialist**
  - Финальная проверка кампании
  - Handoff обратно к Quality Specialist при проблемах

### Визуальный контроль
**Статус**: 📋 Запланировано  

#### ✅ Задачи:
- [ ] **Создать VisualValidator класс** (`src/agent/core/visual-validator.ts`)
  - Интеграция с Playwright для скриншотов
  - Скриншоты: desktop (1920x1080), mobile (375x667), tablet (768x1024)
  - Отправка на анализ GPT-4V

- [ ] **Интеграция в Quality Specialist**
  - Создание скриншотов Gmail/Outlook/Apple Mail preview
  - AI анализ визуального качества
  - Проверка соответствия брендингу Kupibilet

## 📋 ЗАДАЧИ В ОЧЕРЕДИ (LOW PRIORITY)

### Обучение специалистов
- [ ] Создать обучающие материалы для Content Specialist
- [ ] Система валидации контента (не сокращать текст!)
- [ ] Интеграция примеров в промпты

### Мониторинг и аналитика
- [ ] MetricsCollector для сбора метрик
- [ ] Dashboard для визуализации
- [ ] Система алертов

### Тестирование
- [ ] Unit тесты для всех модулей
- [ ] Интеграционные тесты для workflow
- [ ] Performance тесты

## 📊 МЕТРИКИ УСПЕХА

### Технические метрики:
- **Размер кода**: multi-handoff-agent.ts < 400 строк
- **Модульность**: 80%+ кода в отдельных модулях
- **Покрытие тестами**: 90%+
- **Трейсинг**: 100% покрытие операций

### Качественные метрики:
- **Success rate**: 90%+ для email генерации
- **Итерации**: <3 в среднем для качества
- **Время выполнения**: <60 секунд на кампанию
- **Качество контента**: Score >= 80/100

## 🚀 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ

### Сегодня:
1. Создать структуру папок для модулей
2. Начать выделение Image Planning Module
3. Настроить базовое окружение для трейсинга

### На этой неделе:
1. Завершить выделение всех модулей
2. Создать базовые промпты для специалистов  
3. Интегрировать PromptManager

### На следующей неделе:
1. Настроить полный трейсинг OpenAI Agent SDK
2. Реализовать базовые циклы обратной связи
3. Начать работу над визуальным контролем

## 🔗 СВЯЗАННЫЕ ФАЙЛЫ

- **Детальный план**: `memory-bank/comprehensive-improvement-plan.md`
- **Схемы системы**: См. детальный план
- **Технические требования**: См. `.cursorrules`
- **Архитектура**: `memory-bank/systemPatterns.md`

---

**Последнее обновление**: $(date)  
**Статус проекта**: 🔄 Активная разработка  
**Приоритет**: HIGH - Критические улучшения архитектуры

