# 💰 CONTENT SPECIALIST - PRICING INTELLIGENCE INTEGRATION

## Обзор

ContentSpecialist теперь автоматически получает актуальные цены на авиабилеты для создания более точного и релевантного контента. Интеграция позволяет генерировать email-кампании с реальными ценами, что повышает конверсию и доверие пользователей.

## Ключевые функции

### 1. Автоматическое получение цен
- **Условие активации**: Наличие `pricing_requirements` в входных данных
- **Параметры**: `origin`, `destination`, `analysis_depth`
- **Fallback**: Если pricing недоступен, контент генерируется без цен

### 2. Интеграция в контент
- **Уровень срочности**: Определяется на основе актуальных цен
- **Тон сообщения**: Адаптируется под ценовые тренды
- **CTA**: Оптимизируется с учетом рыночной ситуации

### 3. Передача данных
- **В результатах**: `results.pricing_data` содержит полную информацию о ценах
- **В handoff**: `handoff_data.pricing_context` для следующих агентов

## Техническая реализация

### Архитектура

```typescript
interface ContentSpecialistInput {
  // ... другие поля
  pricing_requirements?: {
    origin: string;           // Код аэропорта отправления (MOW, LED)
    destination: string;      // Код аэропорта назначения (AER, KZN)
    analysis_depth?: 'basic' | 'advanced' | 'predictive' | 'comprehensive';
  };
}
```

### Workflow

1. **Проверка pricing_requirements** → Если есть origin/destination
2. **Вызов pricing_intelligence** → Получение актуальных цен
3. **Анализ данных** → Определение urgency_level и тональности
4. **Генерация контента** → С учетом ценовой информации
5. **Handoff данные** → Передача pricing_context следующему агенту

### Обработка ошибок

```typescript
// Graceful degradation - если pricing недоступен
try {
  const pricingResult = await pricingIntelligence(pricingParams);
  if (pricingResult.success) {
    pricingData = pricingResult;
  }
} catch (error) {
  console.log('⚠️ Pricing unavailable, continuing without pricing data');
  // Контент генерируется без цен
}
```

## Структура данных

### Pricing Context в Handoff

```typescript
interface PricingContext {
  action: string;                    // 'get_prices'
  data?: {
    prices?: any[];                  // Массив найденных цен
    currency?: string;               // 'RUB', 'USD', 'EUR'
    cheapest?: number;               // Минимальная цена
    average?: number;                // Средняя цена
    median?: number;                 // Медианная цена
  };
  pricing_insights?: {
    price_trend: 'increasing' | 'decreasing' | 'stable';
    seasonality_factor: number;      // Сезонный коэффициент
    booking_recommendation: string;  // Рекомендация по бронированию
    optimal_dates?: string[];        // Оптимальные даты
  };
  marketing_copy?: {
    headline: string;                // Маркетинговый заголовок
    description: string;             // Описание предложения
    urgency_level: 'low' | 'medium' | 'high';
    call_to_action: string;          // Призыв к действию
  };
}
```

## Примеры использования

### 1. Базовый запрос с ценами

```json
{
  "task_type": "generate_content",
  "campaign_brief": {
    "topic": "Авиабилеты Москва - Сочи",
    "campaign_type": "promotional",
    "target_audience": "семьи с детьми"
  },
  "content_requirements": {
    "content_type": "complete_campaign",
    "tone": "friendly",
    "language": "ru"
  },
  "pricing_requirements": {
    "origin": "MOW",
    "destination": "AER",
    "analysis_depth": "advanced"
  }
}
```

### 2. Результат с интегрированными ценами

```json
{
  "success": true,
  "results": {
    "content_data": {
      "complete_content": {
        "subject": "Авиабилеты в Сочи от 5279 RUB — успей забронировать!",
        "preheader": "Специальные цены на зимние рейсы",
        "body": "Мечтаете о теплом морском побережье? Сочи ждет вас! Авиабилеты от 5279 RUB...",
        "cta": "Найти билеты"
      }
    },
    "pricing_data": {
      "action": "get_prices",
      "data": {
        "cheapest": 5279,
        "currency": "RUB",
        "prices": [...] 
      }
    }
  },
  "recommendations": {
    "handoff_data": {
      "pricing_context": {
        "action": "get_prices",
        "data": {
          "cheapest": 5279,
          "currency": "RUB"
        },
        "pricing_insights": {
          "price_trend": "stable",
          "booking_recommendation": "Цены стабильны, можно бронировать"
        }
      }
    }
  }
}
```

## Влияние на контент

### Уровни срочности

- **high**: Цены растут, ограниченное предложение
- **medium**: Стабильные цены, хорошие предложения  
- **low**: Цены снижаются, можно подождать

### Адаптация тональности

- **Растущие цены**: "Успейте забронировать!", "Ограниченное предложение"
- **Стабильные цены**: "Отличные предложения", "Качественный сервис"
- **Снижающиеся цены**: "Специальные скидки", "Выгодные условия"

## Интеграция с другими агентами

### DesignSpecialist
- Получает `pricing_context` для визуального оформления цен
- Адаптирует дизайн под уровень срочности
- Выбирает соответствующие цветовые схемы

### QualitySpecialist  
- Проверяет корректность указанных цен
- Валидирует соответствие цен и контента
- Контролирует актуальность ценовой информации

## Мониторинг и метрики

### Ключевые показатели
- **Время получения цен**: < 5 секунд
- **Успешность pricing API**: > 95%
- **Влияние на конверсию**: +15-25% CTR

### Логирование
```
💰 Getting pricing intelligence for content generation...
✅ Pricing intelligence obtained: cheapest=5279, currency=RUB
✅ Content generation successful with pricing integration
```

## Конфигурация

### Настройки pricing_intelligence

```typescript
const pricingParams = {
  action: 'get_prices',
  analysis_depth: 'advanced',     // Глубина анализа
  include_historical: true,       // Исторические данные
  seasonal_adjustment: true,      // Сезонные корректировки
  target_audience: 'general',     // Целевая аудитория
  booking_window: 'optimal',      // Окно бронирования
  response_format: 'marketing',   // Формат ответа
  include_analytics: true         // Аналитика
};
```

## Лучшие практики

### 1. Обработка ошибок
- Всегда предусматривать fallback без цен
- Логировать ошибки pricing API
- Не блокировать генерацию контента

### 2. Кэширование
- Кэшировать цены на 5-10 минут
- Обновлять при значительных изменениях
- Учитывать время жизни данных

### 3. Тестирование
- Тестировать с разными направлениями
- Проверять edge cases (нет рейсов, высокие цены)
- Валидировать handoff данные

## Roadmap

### Ближайшие улучшения
- [ ] Интеграция с календарем низких цен
- [ ] Персонализация цен по истории пользователя
- [ ] A/B тестирование влияния цен на контент
- [ ] Интеграция с системой уведомлений о снижении цен

### Долгосрочные планы
- [ ] Машинное обучение для оптимизации ценовых стратегий
- [ ] Интеграция с системами динамического ценообразования
- [ ] Расширение на другие виды транспорта
- [ ] Международные валюты и локализация

## Заключение

Интеграция pricing intelligence в ContentSpecialist значительно повышает качество и релевантность генерируемого контента. Система обеспечивает:

- ✅ **Актуальность**: Реальные цены в реальном времени
- ✅ **Релевантность**: Контент адаптируется под рыночную ситуацию  
- ✅ **Надежность**: Graceful degradation при недоступности цен
- ✅ **Интеграция**: Seamless handoff между агентами
- ✅ **Производительность**: Быстрое получение и обработка данных

Эта интеграция является ключевым шагом к созданию по-настоящему интеллектуальной системы генерации email-кампаний. 