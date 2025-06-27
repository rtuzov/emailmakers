# EMAIL-MAKERS AGENT ARCHITECTURE & LOGIC

**Document**: Complete Agent Architecture & Workflow Logic  
**Project**: Email-Makers - AI-Powered Email Template Generation  
**Version**: 2.0 - Advanced Component Integration Complete  
**Last Updated**: 2025-01-26

---

## 🤖 AGENT OVERVIEW

Email-Makers Agent - это интеллектуальная система для автоматической генерации email-шаблонов с использованием AI-технологий. Агент работает как оркестратор, координирующий 15 специализированных инструментов в едином pipeline для создания высококачественных email-кампаний.

### 🎯 ОСНОВНЫЕ ВОЗМОЖНОСТИ

- **AI-Powered Content Generation**: GPT-4o mini для создания контента
- **Figma Integration**: Автоматическое извлечение дизайн-токенов и ассетов
- **Component System**: React-компоненты с email-совместимостью
- **Quality Assurance**: Автоматическая валидация качества с AI-консультантом
- **Performance Monitoring**: Отслеживание производительности pipeline
- **Seasonal Intelligence**: Умный выбор сезонных вариантов компонентов

---

## 🏗️ AGENT PIPELINE ARCHITECTURE

### Complete Workflow (T1-T15)

```
📧 Email Request
    ↓
T1: get_figma_assets (Extract design assets)
    ↓
[Conditional] T10: split_figma_sprite (If PNG sprites detected)
    ↓
T2: get_prices (Get flight prices)
    ↓
T3: generate_copy (GPT-4o mini content generation)
    ↓
[Conditional] T12: render_component (If components needed)
    ↓
T4: render_mjml (Convert to email HTML)
    ↓
T5: diff_html (Compare versions)
    ↓
T6: patch_html (Apply patches)
    ↓
T7: percy_snap (Visual testing)
    ↓
T8: render_test (Email client testing)
    ↓
T11: ai_quality_consultant (Quality analysis + improvements)
    ↓
[Quality Gate: Score ≥ 70]
    ↓
T9: upload_s3 (Deploy to S3)
    ↓
T13: performance_monitor (Performance analysis)
    ↓
T14: advanced_component_system (Component optimization)
    ↓
T15: seasonal_component_system (Seasonal intelligence)
    ↓
📬 Email Complete
```

---

## 🛠️ TOOLS SPECIFICATION

### T1: get_figma_assets
**Purpose**: Извлечение дизайн-ассетов из Figma
**Input**: Figma URL или ID проекта
**Output**: Список ассетов с метаданными
**Logic**:
```typescript
interface FigmaAsset {
  id: string;
  name: string;
  type: 'image' | 'vector' | 'component';
  url: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}
```

### T2: get_prices
**Purpose**: Получение актуальных цен на авиабилеты
**Input**: Маршрут, даты
**Output**: Структурированные данные о ценах
**Logic**:
```typescript
interface PriceData {
  origin: string;
  destination: string;
  cheapest_price: number;
  currency: string;
  date_range: string;
  booking_url: string;
}
```

### T3: generate_copy
**Purpose**: Генерация контента с помощью GPT-4o mini
**Input**: Тема, целевая аудитория, данные о ценах
**Output**: Структурированный email-контент
**Logic**:
- Анализ темы и аудитории
- Интеграция данных о ценах
- Создание персонализированного контента
- Оптимизация для email-формата

### T4: render_mjml
**Purpose**: Конвертация контента в HTML через MJML
**Input**: Контент, компоненты, стили
**Output**: Email-совместимый HTML
**Logic**:
- MJML компиляция
- Инлайнинг CSS
- Оптимизация для email-клиентов
- Поддержка темного режима

### T5: diff_html
**Purpose**: Сравнение HTML-версий
**Input**: Исходный и новый HTML
**Output**: Список изменений
**Logic**: Построчное сравнение с выделением различий

### T6: patch_html
**Purpose**: Применение патчей к HTML
**Input**: HTML и список патчей
**Output**: Обновленный HTML
**Logic**: Автоматическое применение изменений

### T7: percy_snap
**Purpose**: Визуальное тестирование
**Input**: HTML контент
**Output**: Скриншоты для разных устройств
**Logic**: Кросс-браузерное тестирование внешнего вида

### T8: render_test
**Purpose**: Тестирование совместимости с email-клиентами
**Input**: HTML email
**Output**: Отчет о совместимости
**Logic**:
- Тестирование в Gmail, Outlook, Apple Mail
- Проверка мобильной адаптивности
- Валидация HTML-структуры

### T9: upload_s3
**Purpose**: Загрузка финального email в S3
**Input**: HTML, ассеты, метаданные
**Output**: Публичные URL
**Logic**: Оптимизированная загрузка с CDN

### T10: split_figma_sprite
**Purpose**: Разделение PNG спрайтов на компоненты
**Input**: PNG спрайт
**Output**: Отдельные компоненты с классификацией
**Logic**:
- Projection profiling для обнаружения границ
- AI-классификация компонентов
- Автоматическое именование

### T11: ai_quality_consultant
**Purpose**: Интеллектуальный анализ качества с улучшениями
**Input**: HTML, метаданные, контекст
**Output**: Анализ качества + рекомендации по улучшению
**Logic**:
```typescript
interface QualityAnalysis {
  overall_score: number; // 0-100
  dimensions: {
    logic_validation: number;     // 30% weight
    visual_compliance: number;    // 25% weight
    image_analysis: number;       // 20% weight
    content_coherence: number;    // 25% weight
  };
  recommendations: AgentCommand[];
  auto_improvements: string[];
  manual_approval_needed: string[];
}
```

### T12: render_component
**Purpose**: Рендеринг React-компонентов в email-совместимый HTML
**Input**: Спецификация компонента
**Output**: Table-based HTML
**Logic**:
- Конвертация React в HTML таблицы
- Поддержка RabbitCharacter и EmailIcon
- Email-клиент совместимость

### T13: performance_monitor
**Purpose**: Мониторинг производительности pipeline
**Input**: Метрики выполнения инструментов
**Output**: Анализ производительности и рекомендации
**Logic**:
- Отслеживание времени выполнения каждого инструмента
- Обнаружение bottlenecks
- Рекомендации по оптимизации

### T14: advanced_component_system
**Purpose**: Продвинутая система компонентов с кэшированием
**Input**: Тип компонента, контекст
**Output**: Оптимизированный компонент
**Logic**:
- Dynamic sizing (mobile 80%, tablet 90%, desktop 100%)
- Component caching с TTL
- Analytics tracking

### T15: seasonal_component_system
**Purpose**: Интеллектуальный выбор сезонных вариантов
**Input**: Дата, контекст email
**Output**: Подходящий сезонный компонент
**Logic**:
- 12+ сезонных вариантов
- Date-based автоматический выбор
- Context-aware scoring
- Fallback система

---

## 🧠 AGENT INTELLIGENCE SYSTEM

### 1. CONTEXT ANALYSIS ENGINE
```typescript
interface EmailContext {
  topic: string;
  target_audience: 'family' | 'business' | 'young_adults' | 'general';
  campaign_type: 'promotional' | 'informational' | 'seasonal';
  tone: 'professional' | 'casual' | 'festive' | 'promotional';
  region: 'US' | 'EU' | 'GLOBAL';
  date: Date;
  brand_guidelines: BrandGuidelines;
}
```

### 2. COMPONENT SELECTION LOGIC
```typescript
class ComponentSelector {
  selectComponent(context: EmailContext): ComponentSpec {
    // 1. Seasonal analysis
    const seasonalScore = this.analyzeSeasonalRelevance(context.date);
    
    // 2. Audience alignment
    const audienceScore = this.analyzeAudienceAlignment(context.target_audience);
    
    // 3. Tone matching
    const toneScore = this.analyzeToneMatching(context.tone);
    
    // 4. Combined scoring
    const finalScore = (seasonalScore * 0.4) + (audienceScore * 0.3) + (toneScore * 0.3);
    
    return this.selectBestComponent(finalScore);
  }
}
```

### 3. QUALITY GATE SYSTEM
```typescript
interface QualityGate {
  threshold: 70; // Minimum score to pass
  dimensions: {
    logic_validation: {
      weight: 0.30;
      checks: ['price_realism', 'date_consistency', 'route_accuracy'];
    };
    visual_compliance: {
      weight: 0.25;
      checks: ['brand_guidelines', 'accessibility', 'email_compatibility'];
    };
    image_analysis: {
      weight: 0.20;
      checks: ['content_relevance', 'emotional_tone', 'quality_assessment'];
    };
    content_coherence: {
      weight: 0.25;
      checks: ['text_image_alignment', 'thematic_consistency', 'cta_alignment'];
    };
  };
}
```

### 4. IMPROVEMENT LOOP CONTROLLER
```typescript
class ImprovementLoop {
  async executeImprovements(analysis: QualityAnalysis): Promise<void> {
    let iteration = 0;
    const maxIterations = 3;
    
    while (analysis.overall_score < 70 && iteration < maxIterations) {
      // Auto-execute safe improvements
      await this.executeAutoImprovements(analysis.auto_improvements);
      
      // Request manual approval for content changes
      await this.requestManualApproval(analysis.manual_approval_needed);
      
      // Re-analyze quality
      analysis = await this.reanalyzeQuality();
      iteration++;
    }
  }
}
```

---

## 📊 PERFORMANCE BENCHMARKS

### Target Performance Metrics
```typescript
interface PerformanceBenchmarks {
  total_pipeline_time: 72; // seconds
  individual_tools: {
    get_figma_assets: 8;      // seconds
    get_prices: 5;            // seconds
    generate_copy: 18;        // seconds
    render_mjml: 10;          // seconds
    render_test: 8;           // seconds
    ai_quality_consultant: 15; // seconds
    upload_s3: 8;             // seconds
  };
  success_rate: 95;           // percentage
  cache_hit_rate: 80;         // percentage
}
```

### Bottleneck Detection Algorithm
```typescript
class BottleneckDetector {
  detectBottlenecks(metrics: PerformanceMetrics): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    Object.entries(metrics.tool_times).forEach(([tool, time]) => {
      const benchmark = this.benchmarks[tool];
      if (time > benchmark * 1.5) {
        bottlenecks.push({
          tool,
          actual_time: time,
          expected_time: benchmark,
          severity: time > benchmark * 2 ? 'high' : 'medium'
        });
      }
    });
    
    return bottlenecks;
  }
}
```

---

## 🎨 COMPONENT SYSTEM ARCHITECTURE

### 1. RABBIT CHARACTER COMPONENTS
```typescript
interface RabbitCharacter {
  emotions: ['happy', 'angry', 'neutral', 'general'];
  seasonal_variants: {
    winter: ['holiday', 'snow', 'valentine'];
    spring: ['easter', 'flowers', 'rain'];
    summer: ['beach', 'travel', 'adventure'];
    autumn: ['leaves', 'halloween', 'harvest'];
  };
  sizing: {
    mobile: '80%';
    tablet: '90%';
    desktop: '100%';
  };
}
```

### 2. EMAIL ICON COMPONENTS
```typescript
interface EmailIcon {
  types: ['arrow', 'heart', 'vector'];
  styles: ['outline', 'filled', 'gradient'];
  sizes: ['small', 'medium', 'large'];
  colors: BrandColors;
}
```

### 3. DYNAMIC SIZING SYSTEM
```typescript
class DynamicSizer {
  calculateSize(context: SizingContext): ComponentSize {
    const baseSize = this.getBaseSize(context.component_type);
    const contentFactor = this.calculateContentFactor(context.emailContentLength);
    const deviceFactor = this.getDeviceFactor(context.target_device);
    
    return {
      width: baseSize.width * contentFactor * deviceFactor,
      height: baseSize.height * contentFactor * deviceFactor
    };
  }
}
```

---

## 🔄 WORKFLOW EXECUTION LOGIC

### 1. REQUEST PROCESSING
```typescript
class AgentWorkflow {
  async processEmailRequest(request: EmailRequest): Promise<EmailResult> {
    const session = this.createSession(request);
    
    try {
      // Phase 1: Asset Collection
      const assets = await this.executeT1(request.figma_url);
      const processedAssets = await this.conditionalT10(assets);
      const prices = await this.executeT2(request.route);
      
      // Phase 2: Content Generation
      const content = await this.executeT3(request.topic, prices);
      const components = await this.conditionalT12(content);
      const html = await this.executeT4(content, components);
      
      // Phase 3: Quality Assurance
      const diffResult = await this.executeT5(html);
      const patchedHtml = await this.executeT6(html, diffResult);
      const visualTest = await this.executeT7(patchedHtml);
      const compatibilityTest = await this.executeT8(patchedHtml);
      
      // Phase 4: Quality Gate
      const qualityAnalysis = await this.executeT11(patchedHtml, {
        assets, prices, content, compatibilityTest
      });
      
      if (qualityAnalysis.overall_score < 70) {
        await this.executeImprovementLoop(qualityAnalysis);
      }
      
      // Phase 5: Finalization
      const uploadResult = await this.executeT9(patchedHtml, assets);
      
      // Phase 6: Analytics & Optimization
      await this.executeT13(session.metrics);
      await this.executeT14(components);
      await this.executeT15(session.context);
      
      return this.buildResult(uploadResult, session);
      
    } catch (error) {
      await this.handleError(error, session);
      throw error;
    }
  }
}
```

### 2. ERROR HANDLING STRATEGY
```typescript
class ErrorHandler {
  async handleToolError(tool: string, error: Error, context: any): Promise<void> {
    // STRICT NO-FALLBACK POLICY
    
    switch (tool) {
      case 'get_figma_assets':
        throw new FigmaIntegrationError(`Figma asset extraction failed: ${error.message}`);
      
      case 'generate_copy':
        throw new ContentGenerationError(`GPT-4o mini content generation failed: ${error.message}`);
      
      case 'render_mjml':
        throw new TemplateRenderError(`MJML rendering failed: ${error.message}`);
      
      default:
        throw new AgentExecutionError(`Tool ${tool} failed: ${error.message}`);
    }
    
    // NO FALLBACK LOGIC - FAIL FAST PRINCIPLE
  }
}
```

---

## 🎯 QUALITY ASSURANCE SYSTEM

### 1. AI QUALITY CONSULTANT LOGIC
```typescript
class AIQualityConsultant {
  async analyzeQuality(email: EmailData): Promise<QualityAnalysis> {
    const analysis = await Promise.all([
      this.logicValidator.validate(email),
      this.visualValidator.validate(email),
      this.imageAnalyzer.analyze(email),
      this.coherenceChecker.check(email)
    ]);
    
    const overall_score = this.calculateWeightedScore(analysis);
    const recommendations = await this.generateRecommendations(analysis);
    
    return {
      overall_score,
      dimensions: this.buildDimensionsReport(analysis),
      recommendations: recommendations.agent_commands,
      auto_improvements: recommendations.auto_safe,
      manual_approval_needed: recommendations.manual_review
    };
  }
  
  private calculateWeightedScore(analysis: ValidationResult[]): number {
    const weights = [0.30, 0.25, 0.20, 0.25]; // logic, visual, image, coherence
    return analysis.reduce((sum, result, index) => 
      sum + (result.score * weights[index]), 0
    );
  }
}
```

### 2. IMPROVEMENT RECOMMENDATION ENGINE
```typescript
interface ImprovementRecommendation {
  type: 'auto_safe' | 'manual_review' | 'agent_command';
  priority: 'high' | 'medium' | 'low';
  description: string;
  agent_command?: {
    tool: string;
    parameters: any;
    reasoning: string;
  };
  expected_impact: number; // 0-100 score improvement
}

class RecommendationEngine {
  generateRecommendations(analysis: ValidationResult[]): ImprovementRecommendation[] {
    const recommendations: ImprovementRecommendation[] = [];
    
    // Logic improvements
    if (analysis[0].score < 80) {
      recommendations.push({
        type: 'agent_command',
        priority: 'high',
        description: 'Update price data with current market rates',
        agent_command: {
          tool: 'get_prices',
          parameters: { refresh: true },
          reasoning: 'Price data appears outdated'
        },
        expected_impact: 15
      });
    }
    
    // Visual improvements
    if (analysis[1].score < 70) {
      recommendations.push({
        type: 'auto_safe',
        priority: 'medium',
        description: 'Fix accessibility contrast ratios',
        expected_impact: 10
      });
    }
    
    return recommendations.sort((a, b) => 
      this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
    );
  }
}
```

---

## 📈 ANALYTICS & MONITORING

### 1. PERFORMANCE ANALYTICS
```typescript
interface PerformanceAnalytics {
  session_metrics: {
    total_execution_time: number;
    tool_breakdown: Record<string, number>;
    cache_hits: number;
    cache_misses: number;
    error_count: number;
  };
  
  quality_metrics: {
    initial_quality_score: number;
    final_quality_score: number;
    improvement_iterations: number;
    auto_fixes_applied: number;
  };
  
  component_metrics: {
    components_used: string[];
    seasonal_matches: number;
    dynamic_sizing_applied: boolean;
    cache_efficiency: number;
  };
}
```

### 2. BUSINESS INTELLIGENCE
```typescript
interface BusinessMetrics {
  email_generation_success_rate: number;
  average_quality_score: number;
  user_satisfaction_rating: number;
  pipeline_efficiency: number;
  cost_per_email: number;
  time_to_completion: number;
}
```

---

## 🔧 CONFIGURATION & CUSTOMIZATION

### 1. AGENT CONFIGURATION
```typescript
interface AgentConfig {
  ai_models: {
    content_generation: 'gpt-4o-mini';
    image_analysis: 'gpt-4o-mini-vision';
    quality_analysis: 'gpt-4o-mini';
  };
  
  quality_thresholds: {
    minimum_score: 70;
    auto_improvement_threshold: 80;
    excellence_threshold: 90;
  };
  
  performance_limits: {
    max_execution_time: 120; // seconds
    max_improvement_iterations: 3;
    max_component_cache_size: 1000;
  };
  
  integrations: {
    figma_api_key: string;
    openai_api_key: string;
    s3_bucket: string;
    percy_project_token: string;
  };
}
```

### 2. BRAND CUSTOMIZATION
```typescript
interface BrandGuidelines {
  colors: {
    primary: '#FF6B35';
    secondary: '#004E89';
    accent: '#FFD23F';
    neutral: '#F5F5F5';
  };
  
  typography: {
    heading_font: 'Montserrat';
    body_font: 'Open Sans';
    font_sizes: {
      h1: '24px';
      h2: '20px';
      body: '16px';
      small: '14px';
    };
  };
  
  components: {
    rabbit_character: {
      default_emotion: 'happy';
      seasonal_preference: true;
      size_preference: 'medium';
    };
  };
}
```

---

## 🚀 DEPLOYMENT & SCALING

### 1. PRODUCTION ARCHITECTURE
```typescript
interface ProductionConfig {
  infrastructure: {
    agent_instances: 3;
    load_balancer: 'nginx';
    database: 'postgresql';
    cache: 'redis';
    monitoring: 'prometheus';
  };
  
  scaling: {
    auto_scaling: true;
    min_instances: 2;
    max_instances: 10;
    cpu_threshold: 70;
    memory_threshold: 80;
  };
  
  reliability: {
    health_checks: true;
    circuit_breaker: true;
    retry_policy: {
      max_retries: 3;
      backoff_strategy: 'exponential';
    };
  };
}
```

### 2. MONITORING & ALERTING
```typescript
interface MonitoringConfig {
  metrics: {
    response_time: 'p95 < 30s';
    success_rate: '> 95%';
    error_rate: '< 5%';
    quality_score: '> 75 average';
  };
  
  alerts: {
    high_error_rate: 'slack://errors';
    performance_degradation: 'email://ops';
    quality_issues: 'dashboard://quality';
  };
}
```

---

## 📋 SUMMARY

Email-Makers Agent представляет собой комплексную систему для автоматической генерации email-шаблонов с использованием передовых AI-технологий. Система включает:

### ✅ CORE FEATURES
- **15 специализированных инструментов** в едином pipeline
- **AI-powered качественный анализ** с автоматическими улучшениями
- **Интеллектуальная система компонентов** с сезонными вариантами
- **Мониторинг производительности** с обнаружением bottlenecks
- **Строгая политика NO-FALLBACK** для надежности

### 🎯 BUSINESS VALUE
- **90% автоматизация** процесса создания email-кампаний
- **95% success rate** генерации качественных шаблонов
- **70+ качественный порог** с автоматической валидацией
- **Email-client совместимость** для всех популярных клиентов

### 🔮 FUTURE ENHANCEMENTS
- **T17**: Email Template Optimization Engine
- **T18**: API Performance Enhancement  
- **T19**: Advanced Analytics Dashboard
- **Multi-language support** для международных кампаний

Система готова к production deployment и масштабированию для enterprise-уровня использования. 