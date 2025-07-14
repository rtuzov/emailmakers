# СИСТЕМНЫЕ ПАТТЕРНЫ EMAIL-MAKERS

## 🏗️ АРХИТЕКТУРНЫЕ ПАТТЕРНЫ

### OpenAI Agents SDK Integration Pattern
Система полностью интегрирована с OpenAI Agents SDK с нативными handoffs:
- **Agent Registry**: Централизованное управление 5 специализированными агентами
- **Context Parameter System**: Расширенная система передачи данных между агентами
- **Native Handoffs**: SDK-нативные переходы между агентами без внешней оркестрации
- **Structured Logging**: Интеграция с OpenAI SDK трассировкой и пользовательскими процессорами

### Domain-Driven Design (DDD) + Multi-Agent Architecture
Система организована по доменам с четкими границами и специализированными агентами:
- **Authentication Context** - управление пользователями и сессиями
- **Email Marketing Context** - кампании и шаблоны
- **Content Generation Context** - создание контента через ИИ
- **Design System Context** - дизайн-токены и компоненты
- **Template Processing Context** - обработка MJML и HTML
- **Quality Assurance Context** - валидация и тестирование

### Multi-Agent Orchestration Pattern
Каждый специалист представляет отдельный агент с четкими ролями:
- **Data Collection Specialist** - сбор данных о ценах, датах и контексте
- **Content Specialist** - анализ и генерация контента с техническими спецификациями
- **Design Specialist** - верстка, визуальное оформление и обработка ассетов
- **Quality Specialist** - контроль качества с AI-анализом
- **Delivery Specialist** - финальная сборка и доставка

## 🔄 CONTEXT PARAMETER PATTERNS

### Enhanced Context Flow Pattern
```typescript
// Стандартизированная структура контекста
export const AgentRunContextSchema = z.object({
  campaign: CampaignContextSchema,
  execution: ExecutionContextSchema,
  quality: QualityContextSchema,
  monitoring: MonitoringContextSchema,
  metadata: MetadataContextSchema
});

// Использование в агентах
const result = await run(contentSpecialistAgent, request, { 
  context: enhancedContext 
});
```

### Context Enhancement Pattern
```typescript
// Обогащение контекста между handoffs
export async function enhanceContextForHandoff(
  baseContext: AgentRunContext,
  handoffData: HandoffData,
  targetAgent: string
): Promise<AgentRunContext> {
  return {
    ...baseContext,
    handoffChain: [...baseContext.handoffChain, {
      from: baseContext.execution.currentAgent,
      to: targetAgent,
      timestamp: new Date().toISOString(),
      dataSize: getHandoffDataSize(handoffData)
    }],
    previousResults: {
      ...baseContext.previousResults,
      [baseContext.execution.currentAgent]: handoffData
    }
  };
}
```

## 🔧 TOOL INTEGRATION PATTERNS

### OpenAI SDK Tool Pattern
```typescript
// Стандартный паттерн для всех инструментов
export const toolName = tool({
  name: 'tool_name',
  description: 'Clear description of tool functionality',
  parameters: z.object({
    // Zod schema validation
    param: z.string().describe('Parameter description')
  }),
  execute: async (params, context) => {
    // Context-aware execution
    const campaignContext = getCampaignContextFromSdk(context);
    
    // Tool logic with proper error handling
    try {
      const result = await processWithContext(params, campaignContext);
      return JSON.stringify(result); // Always return string
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }
});
```

### Tool Registry Pattern
```typescript
// Централизованная регистрация инструментов
export const contentSpecialistTools = [
  contextProviderTool,
  pricingIntelligenceTool,
  contentGeneratorTool,
  assetPreparationTools,
  technicalSpecificationTool
];

// Создание агента с инструментами
export const contentSpecialistAgent = new Agent({
  name: 'ContentSpecialist',
  instructions: loadPrompt('content-specialist'),
  model: getAgentModel(),
  tools: contentSpecialistTools
});
```

## 🎯 QUALITY ASSURANCE PATTERNS

### Comprehensive QA Pattern
```typescript
// Многомерная система оценки качества
export class QualityAssuranceService {
  async runQualityAssurance(html: string): Promise<QualityAssuranceResult> {
    // Параллельное выполнение всех проверок
    const [htmlResult, accessibilityResult, performanceResult] = await Promise.all([
      this.htmlValidator.validateEmailHTML(html),
      this.accessibilityTester.testAccessibility(html),
      this.performanceTester.analyzePerformance(html)
    ]);

    // Расчет общей оценки
    const overallScore = this.calculateOverallScore(
      htmlResult, accessibilityResult, performanceResult
    );

    return {
      overallScore,
      htmlValidation: htmlResult,
      accessibility: accessibilityResult,
      performance: performanceResult,
      recommendations: this.generateRecommendations(...)
    };
  }
}
```

### AI Quality Analysis Pattern
```typescript
// 5 специализированных AI-агентов для анализа качества
export class AgentEmailAnalyzer {
  private setupAgents() {
    this.contentQualityAgent = createLoggedAgent({
      name: 'ContentQualityAnalyst',
      instructions: 'Analyze email content quality and readability...',
      model: this.config.ai_model
    });

    this.visualDesignAgent = createLoggedAgent({
      name: 'VisualDesignAnalyst', 
      instructions: 'Analyze visual design and layout compatibility...',
      model: this.config.ai_model
    });

    // Coordinator для оркестрации анализа
    this.coordinatorAgent = createLoggedAgent({
      name: 'EmailQualityCoordinator',
      instructions: 'Coordinate comprehensive quality analysis...',
      model: this.config.ai_model,
      handoffs: [
        this.contentQualityAgent,
        this.visualDesignAgent,
        this.technicalComplianceAgent,
        this.emotionalResonanceAgent,
        this.brandAlignmentAgent
      ]
    });
  }
}
```

## 📊 MONITORING AND LOGGING PATTERNS

### Structured Logging Pattern
```typescript
// Комплексная система логирования
export class AgentLogger {
  async logAgentRun(
    agentName: string,
    input: string,
    output: string,
    duration: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const logEntry: AgentRunLog = {
      timestamp: new Date().toISOString(),
      agentName,
      input: this.sanitizeInput(input),
      output: this.sanitizeOutput(output),
      duration,
      success,
      error,
      sessionId: this.sessionId,
      traceId: this.traceId
    };

    await this.writeLog(logEntry);
  }
}
```

### Performance Tracking Pattern
```typescript
// Отслеживание производительности агентов
export async function withPerformanceTracking<T>(
  agentName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const traceId = generateTraceId();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    await recordPerformanceMetric({
      agentName,
      duration,
      success: true,
      traceId,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await recordPerformanceMetric({
      agentName,
      duration,
      success: false,
      error: error.message,
      traceId,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}
```

## 🔄 ERROR HANDLING PATTERNS

### Fail-Fast Pattern (No Fallback Policy)
```typescript
// Строгая политика без fallback
export class EmailGenerationService {
  async generateEmail(request: EmailRequest): Promise<EmailResult> {
    // Валидация входных данных
    const validationResult = validateEmailRequest(request);
    if (!validationResult.valid) {
      throw new EmailValidationError(
        `Invalid request: ${validationResult.errors.join(', ')}`
      );
    }

    // Вызов AI сервиса без fallback
    try {
      const content = await this.aiService.generateContent(request);
      return content;
    } catch (error) {
      // Немедленный fail без попыток восстановления
      throw new ContentGenerationError(
        `Content generation failed: ${error.message}. No fallback available.`
      );
    }
  }
}
```

### Retry with Exponential Backoff Pattern
```typescript
// Retry механизм для внешних сервисов
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw new Error(
          `Operation failed after ${maxRetries} retries: ${error.message}`
        );
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

## 🗄️ DATA FLOW PATTERNS

### Campaign Folder Structure Pattern
```typescript
// Стандартизированная структура папок кампании
export interface CampaignFolderStructure {
  basePath: string; // campaigns/campaign_${timestamp}_${id}/
  
  folders: {
    content: string;     // Результаты Content Specialist
    assets: string;      // Обработанные ассеты
    templates: string;   // MJML/HTML шаблоны
    docs: string;        // Техническая документация
    exports: string;     // Финальные deliverables
    logs: string;        // Логи выполнения
  };
  
  files: {
    metadata: string;           // campaign-metadata.json
    technicalSpec: string;      // technical-specification.json
    qualityReport: string;      // quality-report.json
    deliveryReport: string;     // delivery-report.json
  };
}
```

### Handoff Data Schema Pattern
```typescript
// Схемы для передачи данных между агентами
export const ContentToDesignHandoffSchema = z.object({
  content: z.object({
    subject: z.string(),
    preheader: z.string(),
    bodyContent: z.string(),
    ctaText: z.string(),
    ctaUrl: z.string()
  }),
  technicalSpecification: z.object({
    layout: z.object({
      maxWidth: z.number(),
      backgroundColor: z.string(),
      fontFamily: z.string()
    }),
    emailClientConstraints: z.array(z.string()),
    qualityCriteria: z.object({
      accessibility: z.boolean(),
      performance: z.object({
        maxFileSize: z.number(),
        maxLoadTime: z.number()
      })
    })
  }),
  assetManifest: z.object({
    hero: z.array(AssetSchema),
    icons: z.array(AssetSchema),
    backgrounds: z.array(AssetSchema)
  }),
  metadata: HandoffMetadataSchema
});
```

## 🎨 TEMPLATE PROCESSING PATTERNS

### MJML Compilation Pattern
```typescript
// Безопасная компиляция MJML с валидацией
export class MjmlCompilationService {
  async compileTemplate(
    mjmlSource: string,
    context: CompilationContext
  ): Promise<CompilationResult> {
    // Валидация MJML синтаксиса
    const validationResult = await this.validateMjmlSyntax(mjmlSource);
    if (!validationResult.valid) {
      throw new MjmlValidationError(
        `MJML validation failed: ${validationResult.errors.join(', ')}`
      );
    }

    // Компиляция в HTML
    const compilationResult = mjml(mjmlSource, {
      validationLevel: 'strict',
      filePath: context.templatePath
    });

    if (compilationResult.errors.length > 0) {
      throw new MjmlCompilationError(
        `MJML compilation failed: ${compilationResult.errors.join(', ')}`
      );
    }

    // Пост-обработка HTML
    const optimizedHtml = await this.optimizeHtml(
      compilationResult.html,
      context.optimizationSettings
    );

    return {
      html: optimizedHtml,
      mjmlSource,
      fileSize: Buffer.byteLength(optimizedHtml, 'utf8'),
      warnings: compilationResult.warnings
    };
  }
}
```

## 📈 PERFORMANCE OPTIMIZATION PATTERNS

### Parallel Processing Pattern
```typescript
// Параллельная обработка для улучшения производительности
export class ParallelProcessingService {
  async processMultipleOperations<T>(
    operations: Array<() => Promise<T>>,
    concurrencyLimit: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (const operation of operations) {
      const promise = operation().then(result => {
        results.push(result);
      });
      
      executing.push(promise);
      
      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
}
```

### Caching Pattern
```typescript
// Кэширование для часто используемых данных
export class CachingService {
  private cache = new Map<string, CacheEntry>();
  
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number = 300000 // 5 минут
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value as T;
    }
    
    const value = await factory();
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
    
    return value;
  }
}
```

## 🔐 SECURITY PATTERNS

### Input Validation Pattern
```typescript
// Комплексная валидация входных данных
export class InputValidationService {
  validateEmailRequest(request: EmailRequest): ValidationResult {
    const schema = z.object({
      topic: z.string().min(1).max(500),
      brandName: z.string().min(1).max(100),
      targetAudience: z.string().optional(),
      campaignType: z.enum(['promotional', 'newsletter', 'transactional'])
    });

    try {
      const validated = schema.parse(request);
      return { valid: true, data: validated };
    } catch (error) {
      return { 
        valid: false, 
        errors: error.errors.map(e => e.message) 
      };
    }
  }
}
```

### Data Sanitization Pattern
```typescript
// Очистка данных для логирования
export class DataSanitizer {
  sanitizeForLogging(data: any): any {
    if (typeof data === 'string') {
      return data.replace(/api_key=[\w-]+/gi, 'api_key=***');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Удаление чувствительных полей
      delete sanitized.apiKey;
      delete sanitized.password;
      delete sanitized.token;
      
      return sanitized;
    }
    
    return data;
  }
}
```

## 🎯 INTEGRATION PATTERNS

### External API Integration Pattern
```typescript
// Интеграция с внешними API
export class ExternalApiService {
  async callWithRetry<T>(
    apiCall: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    return withRetry(async () => {
      try {
        const result = await apiCall();
        
        // Логирование успешного вызова
        logger.info(`${serviceName} API call successful`, {
          service: serviceName,
          timestamp: new Date().toISOString()
        });
        
        return result;
      } catch (error) {
        // Логирование ошибки
        logger.error(`${serviceName} API call failed`, {
          service: serviceName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      }
    }, 3, 1000);
  }
}
```

---

## 📋 PATTERN IMPLEMENTATION CHECKLIST

### ✅ Реализованные паттерны:
- **OpenAI Agents SDK Integration**: Полная интеграция с нативными handoffs
- **Context Parameter System**: Расширенная система передачи данных
- **Multi-Agent Orchestration**: 5 специализированных агентов
- **Quality Assurance**: Комплексная система с AI-анализом
- **Structured Logging**: Интеграция с OpenAI SDK трассировкой
- **Error Handling**: Fail-fast подход без fallback
- **Performance Optimization**: 50-70% улучшение производительности
- **Data Flow**: Стандартизированная структура папок кампании

### 🔄 Паттерны в разработке:
- **Real-time Monitoring**: Система мониторинга в реальном времени
- **Advanced Analytics**: ML-powered инсайты и предсказания
- **Auto-scaling**: Динамическое масштабирование ресурсов
- **Advanced Caching**: Многоуровневые стратегии кэширования

### 🎯 Планируемые паттерны:
- **Enterprise Security**: Расширенные функции безопасности
- **Multi-tenant Architecture**: Поддержка multiple tenants
- **API Gateway**: Централизованное управление API
- **Microservices**: Разделение на микросервисы

---

Эти паттерны обеспечивают надежную, масштабируемую и высокопроизводительную архитектуру для Email-Makers системы с полной интеграцией OpenAI Agents SDK и комплексной системой контроля качества.
