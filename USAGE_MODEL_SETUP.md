# 🚀 Быстрая настройка модели USAGE_MODEL

## Что изменилось

Теперь все AI модели в проекте управляются через одну переменную окружения `USAGE_MODEL`. Это позволяет легко переключаться между моделями в одном месте.

## Настройка

### 1. Обновите `.env.local`

```env
# Основная модель (backend)
USAGE_MODEL=gpt-4o-mini

# Модель для frontend (должна совпадать)
NEXT_PUBLIC_USAGE_MODEL=gpt-4o-mini

# Остальные настройки OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
```

### 2. Перезапустите сервер

```bash
npm run dev
```

## Доступные модели

| Модель | Стоимость | Рекомендация |
|--------|-----------|--------------|
| `gpt-4o-mini` | Низкая | ✅ **Рекомендуется** |
| `gpt-4o` | Высокая | 💰 Для важных задач |
| `gpt-4` | Очень высокая | 💸 Только при необходимости |
| `gpt-3.5-turbo` | Очень низкая | ⚡ Для тестирования |

## Смена модели

Просто измените значение в `.env.local`:

```env
# Для экономии
USAGE_MODEL=gpt-4o-mini

# Для максимального качества
USAGE_MODEL=gpt-4o

# Для быстрого тестирования
USAGE_MODEL=gpt-3.5-turbo
```

## Что обновлено

✅ **Основной агент** - `src/agent/agent.ts`
✅ **Генерация контента** - `src/agent/tools/copy.ts`
✅ **Figma инструменты** - все файлы обновлены
✅ **AI консультант** - полностью централизован
✅ **API эндпоинты** - используют новую систему
✅ **UI компоненты** - отображают текущую модель
✅ **Скрипты** - обновлены для новой системы

## Проверка работы

1. Запустите тест:
```bash
node scripts/test-openai-agent.js
```

2. Проверьте лог - должна отображаться выбранная модель:
```
• Model used: gpt-4o-mini
```

## Документация

Полная документация: [`docs/MODEL_CONFIGURATION.md`](docs/MODEL_CONFIGURATION.md)

## Поддержка

Если возникли проблемы:
1. Проверьте `.env.local`
2. Перезапустите сервер
3. Убедитесь, что модель доступна в вашем OpenAI аккаунте 