# Email-Makers Agent Optimization Project - Tasks

## PROJECT STATUS: 🚧 LEVEL 3 INTERMEDIATE FEATURE - AGENT LOGIC OPTIMIZATION

**Task ID**: AGENT-LOGIC-OPT-001  
**Started**: 2025-01-07  
**Complexity**: Level 3 (Intermediate Feature)  
**Type**: Agent Logic & Data Flow Optimization + OpenAI SDK Integration

---

## 🎯 PROJECT OVERVIEW

**Objective**: Доработать логику работы агента в соответствии с OpenAI Agents SDK, добавить подготовку ассетов в Content Specialist, создать детальное ТЗ в JSON и исправить логирование output.

**Updated Scope**: 
- Использование context parameter для передачи данных между специалистами
- Добавление подготовки ассетов/креативов в Content Specialist
- Создание детального ТЗ в JSON для Design Specialist
- **КРИТИЧНО: Передача полных результатов работы, а не request'ов**
- Исправление логирования output функций
- Доработка функций каждого специалиста
- Замена замоканных данных на реальные

---

## 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА ОБНАРУЖЕНА

### **TRANSFER TOOLS ПЕРЕДАЮТ ТОЛЬКО REQUEST**
- **Файл**: `src/agent/core/transfer-tools.ts`
- **Проблема**: `baseSchema = z.object({ request: z.string() })`
- **Последствие**: Специалисты получают user request, а не результаты работы предыдущего специалиста
- **Требуется**: Полное переписывание transfer logic

### **КАЖДЫЙ СПЕЦИАЛИСТ ДОЛЖЕН ПЕРЕДАВАТЬ РЕЗУЛЬТАТЫ РАБОТЫ**
- **Content → Design**: Comprehensive Technical Specification + Assets
- **Design → Quality**: Готовый дизайн + MJML/HTML + Assets
- **Quality → Delivery**: Проверенные материалы + Quality Report
- **Delivery**: Final Package + Delivery Report

---

## 📊 ANALYSIS RESULTS - OPENAI SDK INTEGRATION

### **SDK DOCUMENTATION REVIEWED**
- **Library**: `/openai/openai-agents-js` (Trust Score: 9.1, 212 code snippets)
- **Key Features**: Context parameter, handoffs, tools, logging, streaming
- **Best Practices**: String returns, Zod validation, structured logging

### **CRITICAL ARCHITECTURAL DISCOVERIES**

#### **1. Context Parameter Support - РЕШЕНИЕ НАЙДЕНО**
- **OpenAI SDK**: Поддерживает context parameter для передачи данных между tools
- **Implementation**: `execute: async (args, context) => { ... }`
- **Transfer**: Context передается автоматически в handoff'ах
- **Solution**: Заменить globalCampaignState на context parameter

#### **2. Transfer Tools Неправильно Реализованы**
- **Status**: ❌ Передают только request string вместо результатов работы
- **Files**: `src/agent/core/transfer-tools.ts` - baseSchema только с request
- **Problem**: Специалисты не получают данные от предыдущих специалистов
- **Fix**: Полное переписывание transfer tools с context и results

#### **3. Output Logging Missing**
- **Problem**: Функции не логируют свой output
- **SDK Features**: Встроенное логирование, environment variables
- **Solution**: Структурированное логирование для каждой функции
- **Variables**: `DEBUG=openai-agents:*`, `OPENAI_AGENTS_DONT_LOG_TOOL_DATA`

---

## 🚀 CRITICAL UPDATED IMPLEMENTATION PLAN

### **Phase 0: КРИТИЧНАЯ ФАЗА - Transfer Tools Redesign**
**Priority**: CRITICAL  
**Estimated Time**: 3 hours

#### **Task 0.1: Создать Comprehensive Handoff Tools**
- [ ] **Создать**: `finalizeContentAndTransferToDesign` в Content Specialist
- [ ] **Создать**: `finalizeDesignAndTransferToQuality` в Design Specialist  
- [ ] **Создать**: `finalizeQualityAndTransferToDelivery` в Quality Specialist
- [ ] **Функции**: Собирают все результаты работы специалиста + передают полные данные

#### **Task 0.2: Content Specialist Final Handoff**
- [ ] **Создать**: `finalizeContentAndTransferToDesign` tool
- [ ] **Собирать**: 
  ```json
  {
    "campaign_metadata": { "id": "...", "theme": "..." },
    "content_specification": { "subject": "...", "body": "...", "cta": "..." },
    "pricing_analysis": { "best_price": 123, "currency": "RUB" },
    "date_analysis": { "optimal_dates": [...], "season": "..." },
    "context_analysis": { "emotional_triggers": "...", "positioning": "..." },
    "asset_strategy": { "visual_style": "...", "concepts": [...] },
    "assets_manifest": { "hero_image": "/path", "icons": [...] },
    "technical_constraints": { "max_width": "600px", "clients": [...] },
    "generated_content": { "subject": "...", "preheader": "..." }
  }
  ```
- [ ] **Сохранить**: Complete Technical Specification в `docs/technical-spec.json`
- [ ] **Передать**: В Design Specialist через context

#### **Task 0.3: Design Specialist Final Handoff**
- [ ] **Создать**: `finalizeDesignAndTransferToQuality` tool
- [ ] **Получать**: Technical Specification от Content Specialist
- [ ] **Создавать**: Design Output Package
- [ ] **Собирать**: 
  ```json
  {
    "technical_spec_received": { ... },
    "processed_assets": { "optimized_images": [...], "generated_graphics": [...] },
    "mjml_template": "MJML code here",
    "html_output": "Compiled HTML",
    "css_styles": "Inline CSS",
    "design_decisions": { "layout": "...", "typography": "..." },
    "asset_usage": { "hero_image": "where used", "icons": "where used" },
    "responsive_design": { "mobile_breakpoints": [...] },
    "dark_mode_support": true/false
  }
  ```
- [ ] **Сохранить**: Design Package в `templates/design-package.json`
- [ ] **Передать**: В Quality Specialist через context

#### **Task 0.4: Quality Specialist Final Handoff**
- [ ] **Создать**: `finalizeQualityAndTransferToDelivery` tool
- [ ] **Получать**: Design Package от Design Specialist
- [ ] **Валидировать**: HTML, CSS, MJML, Assets, Accessibility
- [ ] **Собирать**: 
  ```json
  {
    "design_package_received": { ... },
    "html_validation": { "valid": true, "errors": [] },
    "css_validation": { "valid": true, "warnings": [] },
    "mjml_validation": { "compiled": true, "output_size": "45KB" },
    "accessibility_check": { "wcag_aa": true, "contrast_ratio": "4.5:1" },
    "email_client_compatibility": { "gmail": "✅", "outlook": "✅" },
    "performance_metrics": { "load_time": "1.2s", "image_size": "150KB" },
    "quality_score": 95,
    "approved_for_delivery": true
  }
  ```
- [ ] **Сохранить**: Quality Report в `docs/quality-report.json`
- [ ] **Передать**: В Delivery Specialist через context

#### **Task 0.5: Delivery Specialist Final Package**
- [ ] **Создать**: `createFinalDeliveryPackage` tool
- [ ] **Получать**: Quality Report + все материалы
- [ ] **Создавать**: Final Delivery Package
- [ ] **Собирать**: 
  ```json
  {
    "quality_report_received": { ... },
    "final_files": {
      "mjml_template": "/exports/template.mjml",
      "html_email": "/exports/email.html", 
      "assets": ["/exports/assets/..."],
      "preview_images": ["/exports/previews/..."]
    },
    "zip_package": "/exports/campaign_final.zip",
    "delivery_metadata": {
      "created_at": "2025-01-07T22:00:00Z",
      "total_size": "580KB",
      "file_count": 15
    },
    "deployment_ready": true
  }
  ```
- [ ] **Создать**: ZIP package со всеми материалами
- [ ] **Сохранить**: Delivery Report в `docs/delivery-report.json`

### **Phase 1: Context Parameter Integration**
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### **Task 1.1: Создать Context Schema**
- [ ] **Создать**: `src/agent/core/context-schema.ts`
- [ ] **Определить**: Zod схемы для каждого этапа workflow
- [ ] **Типы**: 
  ```typescript
  interface ContentContext {
    technicalSpec: TechnicalSpecification;
    assets: AssetManifest;
    content: GeneratedContent;
  }
  
  interface DesignContext {
    contentContext: ContentContext;
    designPackage: DesignPackage;
  }
  
  interface QualityContext {
    designContext: DesignContext;
    qualityReport: QualityReport;
  }
  ```

#### **Task 1.2: Обновить Transfer Tools**
- [ ] **Изменить**: `src/agent/core/transfer-tools.ts`
- [ ] **Удалить**: baseSchema с request string
- [ ] **Добавить**: context parameter в каждый transfer tool
- [ ] **Обеспечить**: Передачу полных результатов работы

#### **Task 1.3: Обновить Content Specialist Tools**
- [ ] **Изменить**: Все tools принимают context parameter
- [ ] **Заменить**: globalCampaignState на context
- [ ] **Добавить**: Structured output logging в каждую функцию
- [ ] **Интегрировать**: С новым finalizeContentAndTransferToDesign

### **Phase 2: Content Specialist Asset Preparation**
**Priority**: HIGH  
**Estimated Time**: 4 hours

#### **Task 2.1: Добавить Asset Preparation Tools**
- [ ] **Создать**: `assetCollector` - сбор всех необходимых ассетов
- [ ] **Создать**: `assetOptimizer` - оптимизация изображений
- [ ] **Создать**: `assetValidator` - проверка качества ассетов
- [ ] **Создать**: `assetPathGenerator` - создание JSON с путями

#### **Task 2.2: Интеграция с Figma API**
- [ ] **Расширить**: assetStrategy для загрузки ассетов из Figma
- [ ] **Добавить**: Автоматическую загрузку и сохранение
- [ ] **Создать**: Mapping между Figma assets и campaign assets
- [ ] **Сохранить**: Ассеты в `campaigns/{id}/assets/`

#### **Task 2.3: Asset JSON Generation**
- [ ] **Создать**: `generateAssetManifest` функцию
- [ ] **Формат**: JSON с путями к ассетам и их описанием
- [ ] **Структура**: 
  ```json
  {
    "hero_image": {
      "path": "/assets/hero-thailand.jpg",
      "size": "1200x600",
      "optimized": true,
      "alt_text": "Beautiful Thailand beach"
    },
    "icons": [
      {
        "path": "/assets/plane.svg", 
        "usage": "transportation",
        "size": "24x24"
      }
    ],
    "backgrounds": [
      {
        "path": "/assets/bg-pattern.png",
        "usage": "email_background",
        "size": "600x400"
      }
    ]
  }
  ```
- [ ] **Интеграция**: С finalizeContentAndTransferToDesign

### **Phase 3: Technical Specification Creation**
**Priority**: HIGH  
**Estimated Time**: 3 hours

#### **Task 3.1: Создать Technical Specification Generator**
- [ ] **Создать**: `generateTechnicalSpec` tool в Content Specialist
- [ ] **Формат**: Comprehensive JSON specification
- [ ] **Объединить**: Данные из всех Content Specialist tools
- [ ] **Валидировать**: Структуру через Zod схемы

#### **Task 3.2: Comprehensive ТЗ Structure**
- [ ] **Создать**: Детальную структуру ТЗ
- [ ] **Включить**: Campaign info, content, design requirements, assets, constraints
- [ ] **Добавить**: Quality criteria, performance requirements
- [ ] **Интегрировать**: С finalizeContentAndTransferToDesign

### **Phase 4: Output Logging Implementation**
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### **Task 4.1: Создать Logging System**
- [ ] **Создать**: `src/agent/core/output-logger.ts`
- [ ] **Функции**: logToolOutput, logHandoff, logError
- [ ] **Формат**: Structured JSON logging
- [ ] **Интеграция**: С каждым specialist tool

#### **Task 4.2: Handoff Logging**
- [ ] **Логировать**: Все handoff'ы между специалистами
- [ ] **Отслеживать**: Размер передаваемых данных
- [ ] **Мониторить**: Время выполнения каждого этапа
- [ ] **Сохранять**: Логи в `campaigns/{id}/logs/`

### **Phase 5: Design Specialist Enhancement**
**Priority**: HIGH  
**Estimated Time**: 4 hours

#### **Task 5.1: Context-Aware Design Tools**
- [ ] **Обновить**: processAssets для работы с Technical Specification
- [ ] **Обновить**: generateTemplate для использования Asset Manifest
- [ ] **Создать**: processContextData функцию
- [ ] **Интегрировать**: С finalizeDesignAndTransferToQuality

#### **Task 5.2: MJML Generation from ТЗ**
- [ ] **Создать**: MJML templates на основе Technical Specification
- [ ] **Использовать**: Реальные пути к ассетам из manifest
- [ ] **Валидировать**: Генерируемый MJML
- [ ] **Оптимизировать**: Для различных email clients

### **Phase 6: Quality & Delivery Specialist Updates**
**Priority**: MEDIUM  
**Estimated Time**: 3 hours

#### **Task 6.1: Context-Aware Quality Tools**
- [ ] **Обновить**: validateTemplate для работы с Design Package
- [ ] **Обновить**: testCompatibility для real email client testing
- [ ] **Создать**: Real validation tools
- [ ] **Интегрировать**: С finalizeQualityAndTransferToDelivery

#### **Task 6.2: Context-Aware Delivery Tools**
- [ ] **Обновить**: packageCampaign для создания final packages
- [ ] **Обновить**: deliverCampaign для real delivery
- [ ] **Создать**: ZIP generation с всеми материалами
- [ ] **Интегрировать**: С createFinalDeliveryPackage

### **Phase 7: End-to-End Testing**
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### **Task 7.1: Workflow Validation**
- [ ] **Тестировать**: Полный workflow с real data transfer
- [ ] **Проверить**: Content → Design → Quality → Delivery
- [ ] **Валидировать**: Каждый handoff передает полные данные
- [ ] **Исправить**: Обнаруженные проблемы в data flow

---

## 🎯 EXPECTED DELIVERABLES

### **Phase 0 - КРИТИЧНЫЕ DELIVERABLES:**
1. ✅ Comprehensive handoff tools для каждого специалиста
2. ✅ Technical Specification creation и передача
3. ✅ Design Package creation и передача  
4. ✅ Quality Report creation и передача
5. ✅ Final Delivery Package creation

### **Phase 1-2 Deliverables:**
1. ✅ Context parameter integration
2. ✅ Asset preparation tools in Content Specialist
3. ✅ Asset JSON manifest generation
4. ✅ Figma API integration

### **Phase 3-4 Deliverables:**
1. ✅ Comprehensive JSON ТЗ generation
2. ✅ Structured output logging system
3. ✅ Handoff monitoring и tracking

### **Phase 5-6 Deliverables:**
1. ✅ Context-aware Design Specialist
2. ✅ Context-aware Quality Specialist  
3. ✅ Context-aware Delivery Specialist
4. ✅ Real tools вместо placeholder'ов

### **Phase 7 Deliverables:**
1. ✅ End-to-end workflow validation
2. ✅ Complete data flow между всеми специалистами
3. ✅ Production-ready system

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### **OpenAI Agents SDK Best Practices:**
1. **Context Parameter**: Используется для передачи данных между tools
2. **String Return**: Все functions должны возвращать string
3. **Zod Validation**: Для всех параметров и схем данных
4. **Structured Logging**: Для мониторинга и отладки
5. **Error Handling**: Proper error handling в каждой функции

### **Critical Architecture Changes:**
1. **Transfer Tools полностью переписаны** - передача результатов работы
2. **Handoff Logic изменен** - comprehensive data transfer
3. **Context Schema создана** - валидация всех передаваемых данных
4. **Specialist Integration** - каждый специалист получает полные данные

### **Data Flow Architecture (Fixed):**
```
Content Specialist 
    ↓ [Technical Specification + Assets]
Design Specialist
    ↓ [Design Package + MJML + HTML]  
Quality Specialist
    ↓ [Quality Report + Validated Materials]
Delivery Specialist
    ↓ [Final Package + ZIP + Reports]
```

---

## 📝 COMPLETION CRITERIA

- [ ] Content Specialist создает comprehensive Technical Specification
- [ ] Design Specialist получает полное ТЗ и создает Design Package
- [ ] Quality Specialist получает готовый дизайн и создает Quality Report  
- [ ] Delivery Specialist получает проверенные материалы и создает Final Package
- [ ] Все handoff'ы передают полные результаты работы, не request'ы
- [ ] Каждый этап логируется структурированно
- [ ] End-to-end workflow работает с real data transfer
- [ ] Система готова к production

**Estimated Total Time**: 25 hours  
**Priority**: CRITICAL  
**Complexity**: Level 3 (Intermediate Feature)

**КРИТИЧНО**: Без Phase 0 система не будет работать правильно!
