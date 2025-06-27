# Централизованная настройка AI модели

## Обзор

Email-Makers использует централизованную систему настройки AI модели через переменную окружения `USAGE_MODEL`. Это позволяет легко переключаться между различными моделями в одном месте.

## Настройка

### Переменные окружения

В файле `.env.local`:

```env
# Основная модель для backend операций
USAGE_MODEL=gpt-4o-mini

# Модель для frontend отображения (должна совпадать с USAGE_MODEL)
NEXT_PUBLIC_USAGE_MODEL=gpt-4o-mini
```

### Поддерживаемые модели

- `gpt-4o-mini` (рекомендуется - оптимальное соотношение цена/качество)
- `gpt-4o` (высокое качество, высокая стоимость)
- `gpt-4` (предыдущее поколение)
- `gpt-3.5-turbo` (быстрая, но менее качественная)
- `claude-3-5-sonnet-20241022` (Anthropic, для будущей поддержки)

## Использование в коде

### Backend (Node.js)

```typescript
import { getUsageModel, getValidatedUsageModel } from '../shared/utils/model-config';

// Простое получение модели
const model = getUsageModel(); // возвращает USAGE_MODEL или 'gpt-4o-mini'

// С валидацией
const validModel = getValidatedUsageModel(); // проверяет на поддерживаемые модели

// Использование в OpenAI API
const response = await openai.chat.completions.create({
  model: getUsageModel(),
  messages: [...],
});
```

### Frontend (React)

```typescript
import { getPublicUsageModel } from '../shared/utils/model-config';

// Для отображения в UI
const currentModel = getPublicUsageModel(); // использует NEXT_PUBLIC_USAGE_MODEL
```

## Файлы, использующие централизованную настройку

### Core Agent
- `src/agent/agent.ts` - основной агент
- `src/agent/tools/copy.ts` - генерация контента
- `src/agent/tools/patch.ts` - оптимизация HTML

### Figma Integration
- `src/agent/tools/figma.ts` - работа с Figma API
- `src/agent/tools/figma-sprite-splitter.ts` - обработка спрайтов
- `src/agent/tools/figma-all-pages-processor.ts` - обработка страниц

### AI Consultant
- `src/agent/tools/ai-quality-consultant.ts` - консультант качества
- `src/agent/tools/ai-consultant/ai-consultant.ts` - основной консультант
- `src/agent/tools/ai-consultant/types.ts` - типы и конфигурация

### API Endpoints
- `src/app/api/figma/process-single-page/route.ts` - API для Figma

### UI Components
- `src/ui/components/email/simple-live-preview.tsx` - превью
- `src/ui/components/email/live-preview.tsx` - расширенное превью

### Scripts
- `scripts/validate-identica-folder.js` - валидация файлов
- `scripts/test-openai-agent.js` - тестирование агента

## Смена модели

Для смены модели достаточно изменить значение в `.env.local`:

```env
# Переключение на более мощную модель
USAGE_MODEL=gpt-4o
NEXT_PUBLIC_USAGE_MODEL=gpt-4o

# Или на более экономичную
USAGE_MODEL=gpt-3.5-turbo
NEXT_PUBLIC_USAGE_MODEL=gpt-3.5-turbo
```

После изменения переменной:
1. Перезапустите сервер разработки
2. Все инструменты автоматически начнут использовать новую модель

## Стоимость моделей (примерная)

| Модель | Input (за 1M токенов) | Output (за 1M токенов) | Рекомендация |
|--------|----------------------|------------------------|--------------|
| gpt-4o-mini | $0.15 | $0.60 | ✅ Оптимально |
| gpt-4o | $5.00 | $15.00 | 💰 Дорого |
| gpt-4 | $30.00 | $60.00 | 💸 Очень дорого |
| gpt-3.5-turbo | $0.50 | $1.50 | ⚡ Быстро, но качество ниже |

## Валидация модели

Система автоматически проверяет корректность указанной модели:

```typescript
// Если указана неподдерживаемая модель
USAGE_MODEL=invalid-model

// Система выведет предупреждение и использует fallback
console.warn('Invalid model "invalid-model" in USAGE_MODEL, falling back to gpt-4o-mini');
```

## Миграция с жестко прописанных моделей

Все файлы проекта были обновлены для использования централизованной настройки. Старые жестко прописанные значения:

```typescript
// Старый способ ❌
model: "gpt-4o-mini"
model: process.env.OPENAI_MODEL || "gpt-4o-mini"

// Новый способ ✅
model: getUsageModel()
```

## Troubleshooting

### Модель не меняется
1. Проверьте, что `.env.local` содержит правильные значения
2. Перезапустите сервер разработки
3. Убедитесь, что нет кэшированных значений

### Ошибки API
1. Проверьте, что указанная модель доступна в вашем OpenAI аккаунте
2. Убедитесь, что у вас достаточно квоты для выбранной модели
3. Проверьте правильность API ключей

### Высокие расходы
1. Переключитесь на `gpt-4o-mini` для экономии
2. Мониторьте использование в OpenAI Dashboard
3. Установите лимиты расходов в настройках OpenAI 