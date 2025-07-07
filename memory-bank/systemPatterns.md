# СИСТЕМНЫЕ ПАТТЕРНЫ

## 🏗️ АРХИТЕКТУРНЫЕ ПАТТЕРНЫ

### Domain-Driven Design (DDD)
Система организована по доменам с четкими границами:
- **Authentication Context** - управление пользователями и сессиями
- **Email Marketing Context** - кампании и шаблоны
- **Content Generation Context** - создание контента через ИИ
- **Design System Context** - дизайн-токены и компоненты
- **Template Processing Context** - обработка MJML и HTML
- **Quality Assurance Context** - валидация и тестирование

### Service-Oriented Architecture
Каждый специалист представляет отдельный сервис:
- **Content Specialist** - анализ и генерация контента
- **Design Specialist** - верстка и визуальное оформление
- **Quality Specialist** - контроль качества
- **Delivery Specialist** - финальная сборка и доставка

## 🆕 НОВЫЕ ПАТТЕРНЫ: МНОЖЕСТВЕННЫЕ НАПРАВЛЕНИЯ

### Multi-Destination Processing Pattern

#### 1. Geographical Analysis Pattern
```typescript
// Паттерн анализа географических запросов
class DestinationAnalyzer {
  async analyzeGeographicalScope(query: string): Promise<GeographicalScope> {
    const markers = this.extractGeographicalMarkers(query);
    const seasonal = this.extractSeasonalContext(query);
    const preferences = this.inferUserPreferences(query);
    
    return {
      regions: markers.regions,
      countries: markers.countries,
      season: seasonal.season,
      timeframe: seasonal.timeframe,
      preferences: preferences
    };
  }
  
  private extractGeographicalMarkers(query: string): GeographicalMarkers {
    // Регулярные выражения и NLP для извлечения географии
    // "Европа" → ["Europe"]
    // "Азия зимой" → ["Asia", "winter"]
  }
}
```

#### 2. Parallel Data Collection Pattern
```typescript
// Паттерн параллельного сбора данных
class MultiDestinationPlanner {
  async collectMultiDestinationData(
    destinations: DestinationPlan[]
  ): Promise<EnrichedDestinations> {
    // Параллельный сбор данных для всех направлений
    const dataPromises = destinations.map(async (destination) => ({
      ...destination,
      pricing: await this.pricingService.getPricing(destination),
      dates: await this.dateService.getOptimalDates(destination),
      images: await this.imageService.findImages(destination),
      weather: await this.weatherService.getSeasonalInfo(destination)
    }));
    
    return Promise.all(dataPromises);
  }
}
```

#### 3. Template Selection Pattern
```typescript
// Паттерн выбора шаблона на основе количества направлений
class MultiDestinationLayout {
  selectTemplateByCount(destinationCount: number): TemplateType {
    if (destinationCount <= 3) {
      return 'multi-destination-compact';
    } else if (destinationCount <= 6) {
      return 'multi-destination-grid';
    } else {
      return 'multi-destination-carousel';
    }
  }
  
  planImageLayout(destinations: DestinationPlan[]): ImageLayoutPlan {
    return {
      hero: this.selectHeroImage(destinations),
      destinations: destinations.map(d => this.planDestinationImages(d)),
      grid: this.calculateGridLayout(destinations.length)
    };
  }
}
```

### Content Strategy Pattern

#### 1. Unified Content Generation
```typescript
// Паттерн создания единого контента для множественных направлений
class UnifiedContentGenerator {
  async generateUnifiedContent(plan: MultiDestinationPlan): Promise<UnifiedContent> {
    const strategy = this.determineContentStrategy(plan);
    
    return {
      mainTitle: await this.generateMainTitle(plan.primary_theme),
      subtitle: await this.generateSubtitle(plan.destinations),
      introduction: await this.generateIntroduction(plan),
      destinationSections: await this.generateDestinationSections(plan.destinations),
      callToAction: await this.generateUnifiedCTA(strategy)
    };
  }
  
  private determineContentStrategy(plan: MultiDestinationPlan): ContentStrategy {
    return {
      personalization_level: this.calculatePersonalizationLevel(plan),
      seasonal_optimization: true,
      price_comparison_mode: this.determinePriceStrategy(plan.destinations),
      cta_strategy: this.determineCTAStrategy(plan.destinations.length)
    };
  }
}
```

#### 2. Price Comparison Pattern
```typescript
// Паттерн сравнения и представления цен
class PriceComparisonEngine {
  optimizePricePresentation(destinations: DestinationPlan[]): PricePresentation {
    const sorted = this.sortByStrategy(destinations);
    
    return {
      featured: sorted[0], // Лучшее предложение
      alternatives: sorted.slice(1),
      comparison: this.generatePriceComparison(sorted),
      savings: this.calculatePotentialSavings(sorted)
    };
  }
  
  private sortByStrategy(destinations: DestinationPlan[]): DestinationPlan[] {
    // Сортировка по стратегии: cheapest_first, best_value, premium_options
    return destinations.sort((a, b) => this.compareByValue(a, b));
  }
}
```

### Asset Management Pattern

#### 1. Multi-Country Image Selection
```typescript
// Паттерн подбора изображений для множественных стран
class MultiCountryAssetManager {
  async planCountrySpecificImages(
    destinations: DestinationPlan[]
  ): Promise<MultiCountryImagePlan> {
    const imagePlan = new Map<string, CountryImageSet>();
    
    for (const destination of destinations) {
      const countryImages = await this.selectCountryImages(destination);
      imagePlan.set(destination.country, countryImages);
    }
    
    return {
      hero: await this.selectUnifiedHeroImage(destinations),
      countries: imagePlan,
      icons: await this.selectCountryIcons(destinations),
      backgrounds: await this.selectSeasonalBackgrounds(destinations)
    };
  }
  
  private async selectCountryImages(destination: DestinationPlan): Promise<CountryImageSet> {
    const searchTags = [
      destination.country.toLowerCase(),
      destination.city?.toLowerCase(),
      ...destination.seasonal_highlights.map(h => h.toLowerCase())
    ].filter(Boolean);
    
    return {
      main: await this.figmaAssets.findBestMatch(searchTags, 'hero'),
      thumbnail: await this.figmaAssets.findBestMatch(searchTags, 'thumbnail'),
      background: await this.externalImages.searchByTags(searchTags)
    };
  }
}
```

### Validation Pattern

#### 1. Multi-Destination Quality Assurance
```typescript
// Паттерн валидации множественного контента
class MultiDestinationValidator {
  async validateMultiDestinationContent(
    content: MultiDestinationPlan,
    html: string
  ): Promise<ValidationResult> {
    const validations = await Promise.all([
      this.validateContentCoherence(content),
      this.validateDateConsistency(content.destinations),
      this.validateImageAlignment(content),
      this.validateEmailSize(html),
      this.validateMobileExperience(html),
      this.validateAccessibility(html)
    ]);
    
    return this.aggregateValidationResults(validations);
  }
  
  private async validateDateConsistency(
    destinations: DestinationPlan[]
  ): Promise<DateValidationResult> {
    const dateIssues = [];
    
    for (const destination of destinations) {
      const seasonalCheck = await this.validateSeasonalDates(destination);
      if (!seasonalCheck.valid) {
        dateIssues.push({
          country: destination.country,
          issue: seasonalCheck.issue,
          suggestion: seasonalCheck.suggestion
        });
      }
    }
    
    return {
      valid: dateIssues.length === 0,
      issues: dateIssues
    };
  }
}
```

### Error Handling Pattern

#### 1. Graceful Degradation
```typescript
// Паттерн graceful degradation для множественных направлений
class MultiDestinationErrorHandler {
  async handlePartialFailures(
    destinations: DestinationPlan[],
    errors: Map<string, Error>
  ): Promise<RecoveryResult> {
    const successful = destinations.filter(d => !errors.has(d.country));
    const failed = destinations.filter(d => errors.has(d.country));
    
    if (successful.length >= 2) {
      // Можем продолжить с успешными направлениями
      return {
        strategy: 'continue_with_partial',
        destinations: successful,
        warnings: this.generateWarnings(failed)
      };
    } else {
      // Недостаточно данных, нужна альтернативная стратегия
      return {
        strategy: 'fallback_to_single',
        destinations: [this.selectBestAlternative(successful, failed)],
        errors: Array.from(errors.values())
      };
    }
  }
}
```

## 🔄 WORKFLOW PATTERNS

### Agent Handoff Pattern
```typescript
// Расширенный паттерн передачи между агентами
interface MultiDestinationHandoff {
  from_agent: AgentType;
  to_agent: AgentType;
  payload: MultiDestinationPlan;
  context: HandoffContext;
  validation_required: boolean;
}

class MultiDestinationOrchestrator {
  async executeWorkflow(brief: string): Promise<CampaignResult> {
    // 1. Content Specialist: Анализ и планирование
    const contentPlan = await this.contentSpecialist.analyzeMultiDestinationBrief(brief);
    
    // 2. Design Specialist: Верстка и изображения
    const designResult = await this.designSpecialist.processMultiDestinationPlan(contentPlan);
    
    // 3. Quality Specialist: Валидация
    const qualityResult = await this.qualitySpecialist.validateMultiDestination(designResult);
    
    // 4. Delivery Specialist: Финальная сборка
    if (qualityResult.approved) {
      return await this.deliverySpecialist.assembleMultiDestinationCampaign(qualityResult);
    } else {
      // Retry logic с исправлениями
      return await this.handleQualityIssues(qualityResult);
    }
  }
}
```

### Caching Pattern
```typescript
// Паттерн кэширования для множественных направлений
class MultiDestinationCache {
  private cache = new Map<string, CachedData>();
  
  async getCachedDestinationData(
    country: string,
    season: string
  ): Promise<DestinationData | null> {
    const key = `${country}:${season}`;
    const cached = this.cache.get(key);
    
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    return null;
  }
  
  async setCachedDestinationData(
    country: string,
    season: string,
    data: DestinationData
  ): Promise<void> {
    const key = `${country}:${season}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.getTTLForDataType(data.type)
    });
  }
}
```

## 📊 PERFORMANCE PATTERNS

### Parallel Processing Pattern
```typescript
// Паттерн параллельной обработки
class ParallelProcessor {
  async processDestinationsInParallel<T>(
    destinations: DestinationPlan[],
    processor: (destination: DestinationPlan) => Promise<T>
  ): Promise<T[]> {
    const chunks = this.chunkArray(destinations, this.maxConcurrency);
    const results: T[] = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(destination => processor(destination))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

### Resource Management Pattern
```typescript
// Паттерн управления ресурсами
class ResourceManager {
  private apiLimits = {
    pricing: { limit: 100, window: 60000, current: 0 },
    images: { limit: 50, window: 60000, current: 0 },
    figma: { limit: 200, window: 3600000, current: 0 }
  };
  
  async executeWithRateLimit<T>(
    apiType: keyof typeof this.apiLimits,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.waitForRateLimit(apiType);
    
    try {
      const result = await operation();
      this.apiLimits[apiType].current++;
      return result;
    } catch (error) {
      // Не увеличиваем счетчик при ошибке
      throw error;
    }
  }
}
```

## 🧪 TESTING PATTERNS

### Multi-Destination Test Pattern
```typescript
// Паттерн тестирования множественных направлений
describe('MultiDestinationWorkflow', () => {
  const testScenarios = [
    {
      name: 'European Autumn',
      input: 'Путешествие в Европу осенью',
      expectedDestinations: 4,
      expectedCountries: ['Франция', 'Италия', 'Германия', 'Испания']
    },
    {
      name: 'Asian Winter',
      input: 'Зимний отдых в Азии',
      expectedDestinations: 5,
      expectedSeason: 'winter'
    }
  ];
  
  testScenarios.forEach(scenario => {
    test(`should handle ${scenario.name}`, async () => {
      const result = await generateMultiDestinationEmail(scenario.input);
      
      expect(result.success).toBe(true);
      expect(result.destinations).toHaveLength(scenario.expectedDestinations);
      
      if (scenario.expectedCountries) {
        const countries = result.destinations.map(d => d.country);
        scenario.expectedCountries.forEach(country => {
          expect(countries).toContain(country);
        });
      }
    });
  });
});
```

## 🔧 CONFIGURATION PATTERNS

### Feature Flag Pattern
```typescript
// Паттерн feature flags для постепенного внедрения
class FeatureFlags {
  private flags = {
    multiDestination: process.env.ENABLE_MULTI_DESTINATION === 'true',
    parallelApiCalls: process.env.ENABLE_PARALLEL_API_CALLS === 'true',
    imageOptimization: process.env.ENABLE_IMAGE_OPTIMIZATION === 'true',
    maxDestinations: parseInt(process.env.MAX_DESTINATIONS || '6')
  };
  
  shouldUseMultiDestination(query: string): boolean {
    return this.flags.multiDestination && 
           this.containsMultipleDestinationMarkers(query);
  }
  
  getMaxDestinations(): number {
    return this.flags.maxDestinations;
  }
}
```

---

**Принципы проектирования:**
1. **Модульность** - каждый компонент может работать независимо
2. **Расширяемость** - легко добавлять новые направления и функции
3. **Отказоустойчивость** - graceful degradation при частичных сбоях
4. **Производительность** - параллельная обработка где возможно
5. **Тестируемость** - каждый паттерн покрыт тестами

**Последнее обновление:** 2024-12-19  
**Версия паттернов:** 2.0 (Multiple Destinations Support)
