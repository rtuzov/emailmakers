# ТЕХНИЧЕСКИЙ КОНТЕКСТ

## 🏗️ АРХИТЕКТУРА СИСТЕМЫ

### Основные компоненты
- **Frontend**: Next.js 14.0.4 + App Router + TypeScript
- **Backend**: FastAPI (Python) + PostgreSQL + Drizzle ORM
- **Authentication**: NextAuth.js + JWT + bcrypt
- **AI Integration**: OpenAI GPT-4o mini + Anthropic Claude
- **Email Processing**: MJML + HTML optimization
- **Asset Management**: Figma API + External Image APIs

### Специалисты-агенты
1. **Content Specialist** - генерация контента и планирование
2. **Design Specialist** - верстка и подбор изображений
3. **Quality Specialist** - валидация и проверка качества
4. **Delivery Specialist** - финальная сборка и доставка

## 🆕 НОВЫЕ КОМПОНЕНТЫ: МНОЖЕСТВЕННЫЕ НАПРАВЛЕНИЯ

### Расширенная архитектура

#### Content Specialist Extensions
```typescript
// Новые сервисы для анализа географии
src/agent/specialists/content/services/
├── destination-analyzer.ts       # Анализ географических запросов
├── multi-destination-planner.ts  # Планирование множественных направлений
└── seasonal-optimizer.ts         # Сезонная оптимизация дат
```

**DestinationAnalyzer:**
- Анализ географических маркеров в запросах
- Определение списка стран по регионам
- Извлечение сезонной информации

**MultiDestinationPlanner:**
- Создание единого плана кампании
- Оптимизация набора направлений
- Балансировка цен и сезонности

**SeasonalOptimizer:**
- Расчет оптимальных дат для каждой страны
- Учет климатических особенностей
- Генерация сезонных рекомендаций

#### Design Specialist Extensions
```typescript
// MJML шаблоны для множественных направлений
src/agent/specialists/design/templates/
├── multi-destination-compact.mjml    # 2-3 направления
├── multi-destination-grid.mjml       # 4-6 направлений
└── multi-destination-carousel.mjml   # 6+ направлений

// Сервисы для layout логики
src/agent/specialists/design/services/
└── multi-destination-layout.ts       # Логика выбора шаблонов
```

**MJML Templates:**
- Адаптивная верстка для разного количества направлений
- Мобильная оптимизация
- Email client совместимость

**MultiDestinationLayout:**
- Автоматический выбор подходящего шаблона
- Планирование размещения изображений
- Оптимизация для мобильных устройств

#### Enhanced Tools
```typescript
// Расширенные инструменты
src/agent/tools/
├── enhanced-pricing-intelligence.ts  # Множественные цены
└── geographic-intelligence.ts        # Географический анализ
```

**Enhanced Pricing Intelligence:**
- Параллельный сбор цен для всех направлений
- Сравнение и ранжирование предложений
- Кэширование для оптимизации

**Geographic Intelligence:**
- База данных стран и регионов
- Сезонные характеристики
- Туристические особенности

### Новые типы данных

#### Основные интерфейсы
```typescript
// src/shared/types/multi-destination-types.ts
interface MultiDestinationPlan {
  primary_theme: string;
  destinations: DestinationPlan[];
  unified_layout: UnifiedLayoutPlan;
  content_strategy: ContentStrategy;
  generation_metadata: GenerationMetadata;
}

interface DestinationPlan {
  country: string;
  city?: string;
  country_code: string;
  optimal_dates: DateRange;
  seasonal_highlights: string[];
  pricing_context: PricingContext;
  image_requirements: ImageRequirements;
  relevance_score: number;
}

interface UnifiedLayoutPlan {
  layout_type: 'compact' | 'grid' | 'carousel';
  max_destinations: number;
  mobile_optimization: boolean;
  section_priorities: SectionPriority[];
}
```

#### Вспомогательные типы
```typescript
interface ContentStrategy {
  personalization_level: 'basic' | 'medium' | 'high';
  seasonal_optimization: boolean;
  price_comparison_mode: 'cheapest_first' | 'best_value' | 'premium_options';
  cta_strategy: 'unified' | 'per_destination' | 'mixed';
}

interface PricingContext {
  price_from: number;
  currency: string;
  price_category: 'budget' | 'mid' | 'premium';
  discount_available: boolean;
  last_updated: string;
}

interface DateRange {
  start_date: string;
  end_date: string;
  optimal_period: string;
  seasonal_notes: string[];
}
```

## 🔧 ТЕХНИЧЕСКИЕ СТАНДАРТЫ

### Email HTML Requirements
- **DOCTYPE**: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">`
- **Layout**: Table-based layout only
- **CSS**: Inline styles for critical rendering
- **Size**: <600KB total, <100KB per image
- **Compatibility**: Gmail, Outlook 2016+, Apple Mail, Yahoo Mail
- **Mobile**: Responsive with `@media` queries

### Performance Requirements
- **Generation Time**: <30 seconds per email
- **API Limits**: 
  - Pricing Intelligence: 100 requests/minute
  - External Images: 50 requests/minute
  - Figma API: 200 requests/hour
- **Concurrent Processing**: Support for parallel API calls

### Quality Standards
- **TypeScript**: Strict mode enabled
- **Test Coverage**: >80% for new components
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging with tracing
- **Documentation**: JSDoc for all public APIs

## 🗄️ СТРУКТУРА ДАННЫХ

### Campaign Folder Structure
```
campaign_folder/
├── email.html              # Финальный HTML email
├── metadata.json           # Метаданные кампании
├── assets/
│   ├── hero/               # Главное изображение
│   ├── destinations/       # Изображения по странам
│   │   ├── france/
│   │   ├── italy/
│   │   └── germany/
│   └── icons/              # Иконки и логотипы
└── debug/                  # Отладочная информация
    ├── content-plan.json
    ├── image-plan.json
    └── validation-report.json
```

### Metadata Structure
```json
{
  "campaign_id": "europe_autumn_2024_12_19",
  "generation_date": "2024-12-19T15:30:00Z",
  "primary_theme": "Путешествие в Европу осенью",
  "destinations": [
    {
      "country": "Франция",
      "city": "Париж",
      "optimal_dates": "15 сентября - 15 ноября",
      "price_from": 15000,
      "seasonal_highlights": ["Осенние парки", "Музеи", "Кафе"],
      "images": ["hero.jpg", "paris_autumn.jpg"]
    }
  ],
  "layout_type": "grid",
  "quality_score": 85,
  "generation_time": 24.5,
  "file_sizes": {
    "html": 45632,
    "total_assets": 234567
  }
}
```

## 🔄 WORKFLOW ПРОЦЕСС

### Обработка множественных направлений

1. **Content Specialist Phase**:
   ```
   Input: "Путешествие в Европу осенью"
   ↓
   DestinationAnalyzer.analyzeGeographicalScope()
   ↓
   MultiDestinationPlanner.generateDestinationOptions()
   ↓
   SeasonalOptimizer.optimizeDatesForDestinations()
   ↓
   Enhanced Pricing Intelligence (parallel API calls)
   ↓
   Output: MultiDestinationPlan
   ```

2. **Design Specialist Phase**:
   ```
   Input: MultiDestinationPlan
   ↓
   MultiDestinationLayout.selectTemplateByCount()
   ↓
   AssetManager.searchMultiDestinationImages()
   ↓
   MJML Template Selection & Compilation
   ↓
   HTML Generation with inline CSS
   ↓
   Output: Optimized HTML + Assets
   ```

3. **Quality Specialist Phase**:
   ```
   Input: HTML + MultiDestinationPlan
   ↓
   validateMultiDestinationContent()
   ↓
   validateSeasonalDates() for each destination
   ↓
   validateDestinationImages()
   ↓
   validateEmailSize()
   ↓
   Output: Validation Report + Recommendations
   ```

4. **Delivery Specialist Phase**:
   ```
   Input: Validated HTML + Assets
   ↓
   organizeMultiDestinationAssets()
   ↓
   createMultiDestinationMetadata()
   ↓
   File optimization & compression
   ↓
   Output: Campaign Folder
   ```

## 🧪 ТЕСТИРОВАНИЕ

### Unit Tests Structure
```
__tests__/
├── multi-destination/
│   ├── content-specialist.test.ts
│   ├── design-specialist.test.ts
│   ├── quality-specialist.test.ts
│   └── delivery-specialist.test.ts
├── integration/
│   └── multi-destination-integration.test.ts
├── e2e/
│   └── multi-destination-workflow.e2e.test.ts
└── fixtures/
    └── multi-destination-samples.json
```

### Test Scenarios
- **Basic Functionality**: 4-6 европейских направлений
- **Edge Cases**: 2 направления, 6+ направлений
- **Error Handling**: Неизвестные страны, API failures
- **Performance**: Время генерации <30 сек
- **Quality**: Email size <600KB, image optimization

## 🔍 МОНИТОРИНГ И ЛОГИРОВАНИЕ

### Metrics to Track
- **Generation Time**: По фазам и общее время
- **API Performance**: Время ответа внешних API
- **Email Quality**: Размер, совместимость, scores
- **Error Rates**: По типам ошибок и компонентам
- **User Experience**: Время загрузки, mobile performance

### Logging Structure
```typescript
{
  "timestamp": "2024-12-19T15:30:00Z",
  "level": "info",
  "component": "MultiDestinationPlanner",
  "action": "generateDestinationOptions",
  "input": {
    "query": "Путешествие в Европу осенью",
    "scope": "Europe"
  },
  "output": {
    "destinations_count": 5,
    "generation_time": 2.3
  },
  "metadata": {
    "campaign_id": "europe_autumn_2024_12_19",
    "user_id": "anonymous"
  }
}
```

## 🚀 РАЗВЕРТЫВАНИЕ

### Environment Variables
```bash
# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# External APIs
FIGMA_ACCESS_TOKEN=figd_...
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...

# Performance Settings
MAX_DESTINATIONS=6
EMAIL_SIZE_LIMIT=600000
GENERATION_TIMEOUT=30000

# Feature Flags
ENABLE_MULTI_DESTINATION=true
ENABLE_PARALLEL_API_CALLS=true
ENABLE_IMAGE_OPTIMIZATION=true
```

### Build Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": [
    "src/**/*",
    "__tests__/**/*"
  ],
  "exclude": [
    "useless/**/*",
    "node_modules"
  ]
}
```

## 📊 ПРОИЗВОДИТЕЛЬНОСТЬ

### Benchmarks
- **Single Destination**: ~8 секунд
- **Multi Destination (4-6)**: ~25 секунд
- **API Calls**: Параллельные запросы сокращают время на 60%
- **Image Processing**: Оптимизация снижает размер на 40%

### Optimization Strategies
- **Parallel Processing**: Одновременные API вызовы
- **Caching**: Кэширование цен и изображений
- **Image Optimization**: Автоматическое сжатие
- **Template Reuse**: Переиспользование MJML шаблонов

---

**Последнее обновление:** 2024-12-19  
**Версия архитектуры:** 2.0 (Multiple Destinations)  
**Совместимость:** OpenAI Agents SDK v2, Next.js 14+ 