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
- Исправление логирования output функций
- Доработка функций каждого специалиста
- Замена замоканных данных на реальные

---

## 📊 ANALYSIS RESULTS - OPENAI SDK INTEGRATION

### **ПРОБЛЕМЫ С ПЕРЕДАЧЕЙ ДАННЫХ - ИСПРАВЛЕНО**

#### 1. **Использование Context Parameter**
- **Решение**: OpenAI Agents SDK поддерживает context parameter для передачи данных между tools
- **Файл**: Все tools в каждом специалисте должны принимать context
- **Изменения**: Заменить globalCampaignState на context parameter

#### 2. **Transfer Tools работают правильно**
- **Статус**: ✅ Уже реализованы в `src/agent/core/transfer-tools.ts`
- **Функции**: transferToDesignSpecialist, transferToQualitySpecialist, transferToDeliverySpecialist
- **Проблема**: Не передают context между специалистами

#### 3. **Output Logging отсутствует**
- **Проблема**: Функции не логируют свои output для мониторинга
- **Решение**: Добавить structured logging для каждой функции

### **НОВЫЕ ТРЕБОВАНИЯ**

#### 1. **Подготовка ассетов в Content Specialist**
- **Добавить**: Функции для подготовки всех креативов/ассетов
- **Цель**: Готовые ассеты в папке кампании с JSON путями
- **Интеграция**: С существующей assetStrategy функцией

#### 2. **Детальное ТЗ в JSON**
- **Добавить**: Создание comprehensive technical specification
- **Формат**: JSON файл с детальными требованиями для дизайна
- **Передача**: В Design Specialist через context

#### 3. **Output Logging**
- **Проблема**: Пустое логирование output функций
- **Решение**: Structured logging для каждой функции

---

## 🚀 UPDATED IMPLEMENTATION PLAN

### **Phase 1: Context Parameter Integration**
**Priority**: CRITICAL  
**Estimated Time**: 2 hours

#### **Task 1.1: Обновить Content Specialist Tools**
- [ ] **Изменить**: Все tools принимают context parameter
- [ ] **Заменить**: globalCampaignState на context для передачи данных
- [ ] **Добавить**: Structured output logging в каждую функцию
- [ ] **Тестировать**: Передачу данных через context

#### **Task 1.2: Создать Context Schema**
- [ ] **Создать**: `src/agent/core/context-schema.ts`
- [ ] **Определить**: Zod схемы для каждого типа context
- [ ] **Типы**: CampaignContext, ContentContext, DesignContext, QualityContext
- [ ] **Валидация**: Проверка структуры данных

#### **Task 1.3: Обновить Transfer Tools**
- [ ] **Изменить**: transfer-tools.ts для передачи context
- [ ] **Добавить**: context parameter в каждый transfer tool
- [ ] **Обеспечить**: Сохранение context между handoff'ами
- [ ] **Логирование**: Отслеживание передачи context

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
    "hero_image": "/assets/hero-thailand.jpg",
    "icons": ["/assets/plane.svg", "/assets/hotel.svg"],
    "backgrounds": ["/assets/bg-pattern.png"],
    "logo": "/assets/brand-logo.svg"
  }
  ```
- [ ] **Передача**: В Design Specialist через context

### **Phase 3: Technical Specification Creation**
**Priority**: HIGH  
**Estimated Time**: 3 hours

#### **Task 3.1: Создать Technical Specification Generator**
- [ ] **Создать**: `generateTechnicalSpec` tool в Content Specialist
- [ ] **Формат**: Comprehensive JSON specification
- [ ] **Структура**: 
  ```json
  {
    "campaign_info": { "id": "...", "theme": "..." },
    "content_requirements": { "subject": "...", "body": "..." },
    "design_requirements": { "style": "...", "colors": "..." },
    "assets_manifest": { "hero_image": "...", "icons": [...] },
    "technical_constraints": { "max_width": "600px", "email_clients": [...] },
    "quality_criteria": { "accessibility": "...", "performance": "..." }
  }
  ```

#### **Task 3.2: Интеграция с существующими данными**
- [ ] **Объединить**: Данные из всех предыдущих функций
- [ ] **Включить**: pricingData, dateAnalysis, context, assetPlan
- [ ] **Создать**: Единый JSON документ для передачи
- [ ] **Валидировать**: Структуру через Zod схемы

#### **Task 3.3: Сохранение и передача ТЗ**
- [ ] **Сохранить**: ТЗ в `campaigns/{id}/docs/technical-spec.json`
- [ ] **Передать**: В Design Specialist через context
- [ ] **Логировать**: Создание и передачу ТЗ
- [ ] **Валидировать**: Получение ТЗ в Design Specialist

### **Phase 4: Output Logging Implementation**
**Priority**: HIGH  
**Estimated Time**: 2 hours

#### **Task 4.1: Создать Logging System**
- [ ] **Создать**: `src/agent/core/output-logger.ts`
- [ ] **Функции**: logToolOutput, logHandoff, logError
- [ ] **Формат**: Structured JSON logging
- [ ] **Интеграция**: С существующими console.log

#### **Task 4.2: Обновить все Tools**
- [ ] **Добавить**: Output logging в каждую функцию
- [ ] **Логировать**: Input parameters, execution time, output result
- [ ] **Сохранить**: Логи в `campaigns/{id}/logs/`
- [ ] **Формат**: 
  ```json
  {
    "timestamp": "2025-01-07T21:00:00Z",
    "tool_name": "contentGenerator",
    "specialist": "Content",
    "input": { "campaign_theme": "Thailand" },
    "output": "Контент сгенерирован...",
    "execution_time": 1200,
    "success": true
  }
  ```

#### **Task 4.3: Monitoring Dashboard**
- [ ] **Создать**: Simple monitoring для output logs
- [ ] **Отслеживать**: Успешность выполнения функций
- [ ] **Алерты**: При ошибках в выполнении
- [ ] **Метрики**: Время выполнения каждой функции

### **Phase 5: Design Specialist Enhancement**
**Priority**: HIGH  
**Estimated Time**: 4 hours

#### **Task 5.1: Обновить Design Specialist Tools**
- [ ] **Получать**: Technical specification через context
- [ ] **Использовать**: Asset manifest для обработки ассетов
- [ ] **Создать**: processAssetsFromManifest функцию
- [ ] **Интегрировать**: С существующими v2 инструментами

#### **Task 5.2: MJML Template Generation**
- [ ] **Расширить**: generateTemplate для использования ТЗ
- [ ] **Создать**: MJML код на основе technical specification
- [ ] **Использовать**: Реальные пути к ассетам из manifest
- [ ] **Валидировать**: Генерируемый MJML

#### **Task 5.3: Context Data Processing**
- [ ] **Создать**: processContextData функцию
- [ ] **Обрабатывать**: Данные от Content Specialist
- [ ] **Создать**: DesignOutputData для Quality Specialist
- [ ] **Передавать**: Context в Quality Specialist

### **Phase 6: Quality & Delivery Specialist Updates**
**Priority**: MEDIUM  
**Estimated Time**: 3 hours

#### **Task 6.1: Quality Specialist Context Integration**
- [ ] **Получать**: DesignOutputData через context
- [ ] **Валидировать**: MJML, HTML, CSS
- [ ] **Создать**: QualityReportData
- [ ] **Передавать**: В Delivery Specialist

#### **Task 6.2: Delivery Specialist Context Integration**
- [ ] **Получать**: QualityReportData через context
- [ ] **Создать**: Final package на основе данных
- [ ] **Генерировать**: Comprehensive delivery report
- [ ] **Архивировать**: Все данные кампании

#### **Task 6.3: End-to-End Workflow Testing**
- [ ] **Тестировать**: Полный workflow с context
- [ ] **Проверить**: Передачу данных между всеми специалистами
- [ ] **Валидировать**: Итоговый результат кампании
- [ ] **Исправить**: Обнаруженные проблемы

### **Phase 7: Mock Data Replacement**
**Priority**: LOW  
**Estimated Time**: 2 hours

#### **Task 7.1: Dynamic Data Sources**
- [ ] **Заменить**: getSeasonalTrends на API данные
- [ ] **Заменить**: getEmotionalTriggers на AI анализ
- [ ] **Заменить**: getMarketPositioning на аналитику
- [ ] **Создать**: Переключение между mock и real данными

#### **Task 7.2: Configuration Management**
- [ ] **Создать**: Environment-based configuration
- [ ] **Настроить**: Development/production modes
- [ ] **Добавить**: Fallback на mock данные при недоступности API
- [ ] **Тестировать**: Оба режима работы

---

## 🎯 EXPECTED DELIVERABLES

### **Phase 1 Deliverables:**
1. ✅ Context parameter integration
2. ✅ Context schema definitions  
3. ✅ Updated transfer tools
4. ✅ Output logging system

### **Phase 2 Deliverables:**
1. ✅ Asset preparation tools in Content Specialist
2. ✅ Figma API integration
3. ✅ Asset JSON manifest generation
4. ✅ Assets in campaign folders

### **Phase 3 Deliverables:**
1. ✅ Technical specification generator
2. ✅ Comprehensive JSON ТЗ
3. ✅ Context-based data transfer
4. ✅ ТЗ validation and storage

### **Phase 4 Deliverables:**
1. ✅ Structured output logging
2. ✅ Tool execution monitoring
3. ✅ Log storage system
4. ✅ Error tracking

### **Phase 5-6 Deliverables:**
1. ✅ Enhanced Design Specialist
2. ✅ Context-aware Quality Specialist
3. ✅ Context-aware Delivery Specialist
4. ✅ End-to-end workflow

### **Phase 7 Deliverables:**
1. ✅ Dynamic data integration
2. ✅ Environment configuration
3. ✅ Fallback mechanisms
4. ✅ Production-ready system

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### **OpenAI Agents SDK Best Practices:**
1. **Context Parameter**: Используется для передачи данных между tools
2. **String Return**: Все functions должны возвращать string
3. **Zod Validation**: Для всех параметров и схем данных
4. **Structured Logging**: Для мониторинга и отладки
5. **Error Handling**: Proper error handling в каждой функции

### **Architecture Changes:**
1. **SharedDataService удален** - используется context parameter
2. **Global state минимизирован** - данные в context
3. **Transfer tools обновлены** - поддержка context
4. **Logging centralized** - единая система логирования

### **Next Steps:**
1. Начать с Phase 1 - Context Parameter Integration
2. Параллельно работать над Phase 2 - Asset Preparation
3. Тестировать каждую фазу перед переходом к следующей
4. Обеспечить backward compatibility

---

## 📝 COMPLETION CRITERIA

- [ ] Все специалисты используют context parameter
- [ ] Content Specialist готовит все ассеты
- [ ] Создается детальное ТЗ в JSON
- [ ] Все функции логируют свой output
- [ ] Данные передаются между специалистами
- [ ] Workflow работает end-to-end
- [ ] Замоканные данные заменены на реальные
- [ ] Система готова к production

**Estimated Total Time**: 20 hours  
**Priority**: HIGH  
**Complexity**: Level 3 (Intermediate Feature)
