# 📋 ДЕТАЛЬНАЯ ДИАГРАММА ПОТОКА ДАННЫХ ДЛЯ ДЖУНИОР РАЗРАБОТЧИКА
## Email-Makers: Полный Поток Файлов, Функций и Данных

*Создано: 15 января 2025*
*Максимально подробная схема для понимания системы*

---

## 🎯 ОБЗОР

Эта диаграмма показывает **ТОЧНО**:
- Какая функция создает какой файл
- Что записывается в контекст и кем извлекается
- Какие данные передаются между функциями
- Размеры файлов и время выполнения
- Последовательность операций чтения/записи

---

## 📊 1. ДЕТАЛЬНЫЙ ПОТОК СОЗДАНИЯ И ЧТЕНИЯ ФАЙЛОВ

### Полная схема: Функция → Файл → Данные → Размер

```mermaid
graph TD
    subgraph "🎯 ORCHESTRATOR - НАЧАЛО"
        START["🚀 main_agent_run()<br/>📥 INPUT: user_brief (текст)<br/>📊 SIZE: ~0.5-2KB"]
    end
    
    subgraph "📊 DATA COLLECTION SPECIALIST"
        DC1["📁 create_campaign_folder()<br/>⏰ TIME: 0-2s"]
        DC1_WRITE["📝 СОЗДАЕТ ФАЙЛЫ:<br/>📂 campaigns/campaign_[id]/README.md<br/>📂 campaigns/campaign_[id]/campaign-metadata.json<br/>📊 SIZE: ~1KB each"]
        DC1_CONTEXT["🧠 В КОНТЕКСТ:<br/>• campaign_id: string<br/>• folder_path: string<br/>• created_timestamp: datetime<br/>📊 CONTEXT SIZE: 2KB → 3KB"]
        
        DC2["📋 process_brief()<br/>⏰ TIME: 2-5s"]
        DC2_READ["📖 ЧИТАЕТ:<br/>• user_brief из параметра<br/>• campaign-metadata.json"]
        DC2_CONTEXT["🧠 В КОНТЕКСТ:<br/>• parsed_brief: object<br/>• target_audience: string<br/>• campaign_type: string<br/>📊 CONTEXT SIZE: 3KB → 5KB"]
        
        DC3["🔍 extract_requirements()<br/>⏰ TIME: 5-8s"]
        DC3_WRITE["📝 СОЗДАЕТ:<br/>📄 data/requirements-analysis.json<br/>📊 SIZE: ~2-3KB"]
        DC3_CONTEXT["🧠 В КОНТЕКСТ:<br/>• requirements: array<br/>• constraints: object<br/>• preferences: object<br/>📊 CONTEXT SIZE: 5KB → 7KB"]
        
        DC4["📊 analyze_target_audience()<br/>⏰ TIME: 8-12s"]
        DC4_WRITE["📝 СОЗДАЕТ:<br/>📄 data/emotional-profile.json<br/>📄 data/destination-analysis.json<br/>📊 SIZE: ~500B + 932B"]
        DC4_CONTEXT["🧠 В КОНТЕКСТ:<br/>• audience_profile: object<br/>• demographics: object<br/>• psychographics: object<br/>📊 CONTEXT SIZE: 7KB → 9KB"]
        
        DC5["🎯 determine_content_strategy()<br/>⏰ TIME: 12-15s"]
        DC5_WRITE["📝 СОЗДАЕТ:<br/>📄 data/market-intelligence.json<br/>📄 data/trend-analysis.json<br/>📊 SIZE: ~654B + 797B"]
        DC5_CONTEXT["🧠 В КОНТЕКСТ:<br/>• content_strategy: object<br/>• messaging_framework: object<br/>• tone_guidelines: object<br/>📊 CONTEXT SIZE: 9KB → 11KB"]
        
        DC6["📝 create_content_outline()<br/>⏰ TIME: 15-18s"]
        DC6_WRITE["📝 СОЗДАЕТ:<br/>📄 content/outline-structure.json<br/>📊 SIZE: ~2-3KB"]
        DC6_CONTEXT["🧠 В КОНТЕКСТ:<br/>• content_outline: object<br/>• section_priorities: array<br/>• content_blocks: array<br/>📊 CONTEXT SIZE: 11KB → 13KB"]
        
        DC7["💾 cache_analysis_results()<br/>⏰ TIME: 18-19s"]
        DC7_WRITE["📝 СОЗДАЕТ:<br/>📄 data/consolidated-insights.json<br/>📊 SIZE: ~703B"]
        
        DC8["🔄 update_context()<br/>⏰ TIME: 19-20s"]
        DC8_CONTEXT["🧠 В КОНТЕКСТ:<br/>• analysis_complete: boolean<br/>• next_phase: string<br/>📊 CONTEXT SIZE: 13KB → 14KB"]
        
        DC9["📤 prepare_handoff()<br/>⏰ TIME: 20s"]
        DC9_WRITE["📝 СОЗДАЕТ:<br/>📄 handoffs/data-to-content.json<br/>📊 SIZE: ~3-5KB"]
        DC9_READ["📖 ЧИТАЕТ ИЗ КОНТЕКСТА:<br/>• campaign_id<br/>• requirements<br/>• audience_profile<br/>• content_strategy<br/>• content_outline"]
    end
    
    subgraph "📝 CONTENT SPECIALIST"
        CS1["📥 receive_data_handoff()<br/>⏰ TIME: 20-22s"]
        CS1_READ["📖 ЧИТАЕТ:<br/>📄 handoffs/data-to-content.json<br/>📄 campaign-metadata.json<br/>📄 data/*.json (все файлы)"]
        CS1_CONTEXT["🧠 В КОНТЕКСТ:<br/>• handoff_data: object<br/>• previous_analysis: object<br/>📊 CONTEXT SIZE: 14KB → 16KB"]
        
        CS2["🎨 generate_email_content()<br/>⏰ TIME: 22-35s<br/>🤖 OpenAI GPT-4o-mini"]
        CS2_API["🌐 API CALL:<br/>📤 REQUEST: prompt + context<br/>📥 RESPONSE: generated_content<br/>⏰ API TIME: 8-15s"]
        CS2_WRITE["📝 СОЗДАЕТ:<br/>📄 content/email-content.json<br/>📄 content/email-content.md<br/>📊 SIZE: ~4.8KB + 2.8KB"]
        CS2_CONTEXT["🧠 В КОНТЕКСТ:<br/>• email_content: object<br/>• content_blocks: array<br/>• generated_text: string<br/>📊 CONTEXT SIZE: 16KB → 20KB"]
        
        CS3["✈️ integrate_travel_data()<br/>⏰ TIME: 35-40s<br/>🌐 Kupibilet API v2"]
        CS3_API["🌐 API CALL:<br/>📤 REQUEST: destination + dates<br/>📥 RESPONSE: travel_data<br/>⏰ API TIME: 2-5s"]
        CS3_WRITE["📝 СОЗДАЕТ:<br/>📄 content/pricing-analysis.json<br/>📄 content/date-analysis.json<br/>📊 SIZE: ~2.9KB + 1.8KB"]
        CS3_CONTEXT["🧠 В КОНТЕКСТ:<br/>• travel_data: object<br/>• pricing_info: object<br/>• availability: object<br/>📊 CONTEXT SIZE: 20KB → 22KB"]
        
        CS4["🔄 optimize_content()<br/>⏰ TIME: 40-50s<br/>🤖 OpenAI GPT-4o-mini"]
        CS4_API["🌐 API CALL:<br/>📤 REQUEST: content + optimization_rules<br/>📥 RESPONSE: optimized_content<br/>⏰ API TIME: 8-12s"]
        CS4_READ["📖 ЧИТАЕТ ИЗ КОНТЕКСТА:<br/>• email_content<br/>• travel_data<br/>• audience_profile"]
        CS4_CONTEXT["🧠 В КОНТЕКСТ:<br/>• optimized_content: object<br/>• optimization_metrics: object<br/>📊 CONTEXT SIZE: 22KB → 24KB"]
        
        CS5["📱 adapt_for_mobile()<br/>⏰ TIME: 50-52s"]
        CS5_CONTEXT["🧠 В КОНТЕКСТ:<br/>• mobile_adaptations: object<br/>• responsive_rules: array<br/>📊 CONTEXT SIZE: 24KB → 25KB"]
        
        CS6["🎭 personalize_content()<br/>⏰ TIME: 52-60s<br/>🤖 OpenAI GPT-4o-mini"]
        CS6_API["🌐 API CALL:<br/>📤 REQUEST: content + personalization_rules<br/>📥 RESPONSE: personalized_content<br/>⏰ API TIME: 6-10s"]
        CS6_CONTEXT["🧠 В КОНТЕКСТ:<br/>• personalized_content: object<br/>• personalization_tokens: array<br/>📊 CONTEXT SIZE: 25KB → 26KB"]
        
        CS7["📤 finalize_content()<br/>⏰ TIME: 60-62s"]
        CS7_WRITE["📝 ОБНОВЛЯЕТ:<br/>📄 content/email-content.json (финальная версия)<br/>📊 SIZE: ~5-6KB"]
        CS7_CONTEXT["🧠 В КОНТЕКСТ:<br/>• final_content: object<br/>• content_ready: boolean<br/>📊 CONTEXT SIZE: 26KB → 27KB"]
        
        CS8["🔄 update_context()<br/>⏰ TIME: 62-63s"]
        CS8_CONTEXT["🧠 В КОНТЕКСТ:<br/>• content_phase_complete: boolean<br/>• next_specialist: string<br/>📊 CONTEXT SIZE: 27KB → 28KB"]
        
        CS9["📋 prepare_design_handoff()<br/>⏰ TIME: 63-65s"]
        CS9_WRITE["📝 СОЗДАЕТ:<br/>📄 handoffs/content-to-design.json<br/>📊 SIZE: ~5-7KB"]
        CS9_READ["📖 ЧИТАЕТ ИЗ КОНТЕКСТА:<br/>• final_content<br/>• travel_data<br/>• mobile_adaptations<br/>• personalization_tokens"]
    end
    
    subgraph "🎨 DESIGN SPECIALIST V3"
        DS1["📥 receive_content_handoff()<br/>⏰ TIME: 65-67s"]
        DS1_READ["📖 ЧИТАЕТ:<br/>📄 handoffs/content-to-design.json<br/>📄 content/email-content.json<br/>📄 content/asset-strategy.json"]
        DS1_CONTEXT["🧠 В КОНТЕКСТ:<br/>• content_handoff: object<br/>• design_requirements: object<br/>📊 CONTEXT SIZE: 28KB → 30KB"]
        
        DS2["🎨 create_design_brief()<br/>⏰ TIME: 67-69s"]
        DS2_WRITE["📝 СОЗДАЕТ:<br/>📄 content/design-brief-from-context.json<br/>📊 SIZE: ~3.1KB"]
        DS2_CONTEXT["🧠 В КОНТЕКСТ:<br/>• design_brief: object<br/>• visual_guidelines: object<br/>📊 CONTEXT SIZE: 30KB → 31KB"]
        
        DS3["🖼️ generate_visual_concepts()<br/>⏰ TIME: 69-71s"]
        DS3_CONTEXT["🧠 В КОНТЕКСТ:<br/>• visual_concepts: array<br/>• color_palette: object<br/>📊 CONTEXT SIZE: 31KB → 32KB"]
        
        DS4["🎭 apply_brand_guidelines()<br/>⏰ TIME: 71-73s"]
        DS4_CONTEXT["🧠 В КОНТЕКСТ:<br/>• brand_applied: boolean<br/>• brand_elements: object<br/>📊 CONTEXT SIZE: 32KB → 33KB"]
        
        DS5["📐 create_layout_structure()<br/>⏰ TIME: 73-75s"]
        DS5_CONTEXT["🧠 В КОНТЕКСТ:<br/>• layout_structure: object<br/>• grid_system: object<br/>📊 CONTEXT SIZE: 33KB → 34KB"]
        
        DS6["🏗️ generate_mjml_template()<br/>⏰ TIME: 75-78s"]
        DS6_WRITE["📝 СОЗДАЕТ:<br/>📄 templates/email-template.mjml<br/>📊 SIZE: ~8-12KB"]
        DS6_CONTEXT["🧠 В КОНТЕКСТ:<br/>• mjml_template: string<br/>• template_structure: object<br/>📊 CONTEXT SIZE: 34KB → 36KB"]
        
        DS7["🎨 apply_styling()<br/>⏰ TIME: 78-80s"]
        DS7_CONTEXT["🧠 В КОНТЕКСТ:<br/>• css_styles: object<br/>• style_tokens: object<br/>📊 CONTEXT SIZE: 36KB → 37KB"]
        
        DS8["📱 implement_responsive_design()<br/>⏰ TIME: 80-82s"]
        DS8_CONTEXT["🧠 В КОНТЕКСТ:<br/>• responsive_rules: object<br/>• breakpoints: array<br/>📊 CONTEXT SIZE: 37KB → 38KB"]
        
        DS9["🌙 add_dark_mode_support()<br/>⏰ TIME: 82-84s"]
        DS9_CONTEXT["🧠 В КОНТЕКСТ:<br/>• dark_mode_styles: object<br/>• dark_mode_enabled: boolean<br/>📊 CONTEXT SIZE: 38KB → 39KB"]
        
        DS10["🔍 validate_design_ai()<br/>⏰ TIME: 84-85s<br/>🤖 Internal AI"]
        DS10_API["🤖 AI VALIDATION:<br/>📤 REQUEST: mjml_template<br/>📥 RESPONSE: validation_result<br/>⏰ AI TIME: 1-2s"]
        DS10_CONTEXT["🧠 В КОНТЕКСТ:<br/>• validation_result: object<br/>• design_valid: boolean<br/>📊 CONTEXT SIZE: 39KB → 39KB"]
        
        DS11["📊 optimize_performance()<br/>⏰ TIME: 85-86s"]
        DS11_CONTEXT["🧠 В КОНТЕКСТ:<br/>• performance_metrics: object<br/>• optimization_applied: boolean<br/>📊 CONTEXT SIZE: 39KB → 40KB"]
        
        DS12["💾 save_design_assets()<br/>⏰ TIME: 86-87s"]
        DS12_WRITE["📝 СОЗДАЕТ:<br/>📄 assets/email-template.html<br/>📄 assets/styles.css<br/>📄 design-decisions.json<br/>📊 SIZE: ~12KB + 3KB + 709B"]
        
        DS13["🔄 update_context()<br/>⏰ TIME: 87-88s"]
        DS13_CONTEXT["🧠 В КОНТЕКСТ:<br/>• design_complete: boolean<br/>• assets_saved: boolean<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        DS14["📋 prepare_quality_handoff()<br/>⏰ TIME: 88-90s"]
        DS14_WRITE["📝 СОЗДАЕТ:<br/>📄 handoffs/design-to-quality.json<br/>📄 handoffs/design-specialist-to-qa-specialist.json<br/>📊 SIZE: ~1KB + 1.4KB"]
        DS14_READ["📖 ЧИТАЕТ ИЗ КОНТЕКСТА:<br/>• mjml_template<br/>• design_assets<br/>• validation_result<br/>• performance_metrics"]
    end
    
    subgraph "✅ QUALITY SPECIALIST"
        QS1["📥 receive_design_handoff()<br/>⏰ TIME: 90-92s"]
        QS1_READ["📖 ЧИТАЕТ:<br/>📄 handoffs/design-specialist-to-qa-specialist.json<br/>📄 assets/email-template.html<br/>📄 templates/email-template.mjml"]
        QS1_CONTEXT["🧠 В КОНТЕКСТ:<br/>• design_handoff: object<br/>• qa_requirements: array<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS2["🔍 validate_html_structure()<br/>⏰ TIME: 92-95s"]
        QS2_CONTEXT["🧠 В КОНТЕКСТ:<br/>• html_validation: object<br/>• structure_valid: boolean<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS3["📧 test_email_clients()<br/>⏰ TIME: 95-100s"]
        QS3_CONTEXT["🧠 В КОНТЕКСТ:<br/>• client_test_results: array<br/>• compatibility_score: number<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS4["♿ check_accessibility()<br/>⏰ TIME: 100-103s"]
        QS4_CONTEXT["🧠 В КОНТЕКСТ:<br/>• accessibility_score: number<br/>• accessibility_issues: array<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS5["📱 validate_responsive_design()<br/>⏰ TIME: 103-105s"]
        QS5_CONTEXT["🧠 В КОНТЕКСТ:<br/>• responsive_valid: boolean<br/>• mobile_score: number<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS6["🌙 test_dark_mode()<br/>⏰ TIME: 105-107s"]
        QS6_CONTEXT["🧠 В КОНТЕКСТ:<br/>• dark_mode_valid: boolean<br/>• dark_mode_score: number<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS7["⚡ analyze_performance()<br/>⏰ TIME: 107-109s"]
        QS7_CONTEXT["🧠 В КОНТЕКСТ:<br/>• performance_analysis: object<br/>• load_time: number<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS8["📊 generate_quality_report()<br/>⏰ TIME: 109-110s"]
        QS8_WRITE["📝 СОЗДАЕТ:<br/>📄 docs/quality-report.json<br/>📄 docs/test-results.json<br/>📊 SIZE: ~3-5KB each"]
        QS8_CONTEXT["🧠 В КОНТЕКСТ:<br/>• quality_report: object<br/>• overall_score: number<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS9["🔄 update_context()<br/>⏰ TIME: 110-111s"]
        QS9_CONTEXT["🧠 В КОНТЕКСТ:<br/>• qa_complete: boolean<br/>• quality_approved: boolean<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        QS10["📋 prepare_delivery_handoff()<br/>⏰ TIME: 111-112s"]
        QS10_WRITE["📝 СОЗДАЕТ:<br/>📄 handoffs/quality-to-delivery.json<br/>📊 SIZE: ~2-3KB"]
        QS10_READ["📖 ЧИТАЕТ ИЗ КОНТЕКСТА:<br/>• quality_report<br/>• test_results<br/>• performance_analysis<br/>• validation_results"]
    end
    
    subgraph "📦 DELIVERY SPECIALIST"
        DL1["📥 receive_quality_handoff()<br/>⏰ TIME: 112-113s"]
        DL1_READ["📖 ЧИТАЕТ:<br/>📄 handoffs/quality-to-delivery.json<br/>📄 docs/quality-report.json<br/>📄 assets/email-template.html"]
        DL1_CONTEXT["🧠 В КОНТЕКСТ:<br/>• delivery_requirements: object<br/>• approved_assets: array<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
        
        DL2["📦 package_final_template()<br/>⏰ TIME: 113-115s"]
        DL2_WRITE["📝 СОЗДАЕТ:<br/>📄 exports/final-email-template.html<br/>📄 exports/template-package.zip<br/>📊 SIZE: ~15KB + 25KB"]
        DL2_READ["📖 ЧИТАЕТ:<br/>• Все assets/ файлы<br/>• templates/ файлы<br/>• docs/ файлы"]
        
        DL3["📁 create_export_package()<br/>⏰ TIME: 115-117s"]
        DL3_WRITE["📝 СОЗДАЕТ:<br/>📄 exports/campaign-complete.zip<br/>📄 exports/delivery-manifest.json<br/>📊 SIZE: ~50KB + 2KB"]
        
        DL4["✅ finalize_delivery()<br/>⏰ TIME: 117-118s"]
        DL4_WRITE["📝 ОБНОВЛЯЕТ:<br/>📄 campaign-metadata.json (status: completed)<br/>📄 README.md (final summary)"]
        DL4_CONTEXT["🧠 В КОНТЕКСТ:<br/>• delivery_complete: boolean<br/>• final_package_path: string<br/>📊 CONTEXT SIZE: 40KB (maintained)"]
    end
    
    %% FLOW CONNECTIONS
    START --> DC1
    DC1 --> DC1_WRITE --> DC1_CONTEXT --> DC2
    DC2 --> DC2_READ --> DC2_CONTEXT --> DC3
    DC3 --> DC3_WRITE --> DC3_CONTEXT --> DC4
    DC4 --> DC4_WRITE --> DC4_CONTEXT --> DC5
    DC5 --> DC5_WRITE --> DC5_CONTEXT --> DC6
    DC6 --> DC6_WRITE --> DC6_CONTEXT --> DC7
    DC7 --> DC7_WRITE --> DC8
    DC8 --> DC8_CONTEXT --> DC9
    DC9 --> DC9_WRITE --> DC9_READ --> CS1
    
    CS1 --> CS1_READ --> CS1_CONTEXT --> CS2
    CS2 --> CS2_API --> CS2_WRITE --> CS2_CONTEXT --> CS3
    CS3 --> CS3_API --> CS3_WRITE --> CS3_CONTEXT --> CS4
    CS4 --> CS4_API --> CS4_READ --> CS4_CONTEXT --> CS5
    CS5 --> CS5_CONTEXT --> CS6
    CS6 --> CS6_API --> CS6_CONTEXT --> CS7
    CS7 --> CS7_WRITE --> CS7_CONTEXT --> CS8
    CS8 --> CS8_CONTEXT --> CS9
    CS9 --> CS9_WRITE --> CS9_READ --> DS1
    
    DS1 --> DS1_READ --> DS1_CONTEXT --> DS2
    DS2 --> DS2_WRITE --> DS2_CONTEXT --> DS3
    DS3 --> DS3_CONTEXT --> DS4
    DS4 --> DS4_CONTEXT --> DS5
    DS5 --> DS5_CONTEXT --> DS6
    DS6 --> DS6_WRITE --> DS6_CONTEXT --> DS7
    DS7 --> DS7_CONTEXT --> DS8
    DS8 --> DS8_CONTEXT --> DS9
    DS9 --> DS9_CONTEXT --> DS10
    DS10 --> DS10_API --> DS10_CONTEXT --> DS11
    DS11 --> DS11_CONTEXT --> DS12
    DS12 --> DS12_WRITE --> DS13
    DS13 --> DS13_CONTEXT --> DS14
    DS14 --> DS14_WRITE --> DS14_READ --> QS1
    
    QS1 --> QS1_READ --> QS1_CONTEXT --> QS2
    QS2 --> QS2_CONTEXT --> QS3
    QS3 --> QS3_CONTEXT --> QS4
    QS4 --> QS4_CONTEXT --> QS5
    QS5 --> QS5_CONTEXT --> QS6
    QS6 --> QS6_CONTEXT --> QS7
    QS7 --> QS7_CONTEXT --> QS8
    QS8 --> QS8_WRITE --> QS8_CONTEXT --> QS9
    QS9 --> QS9_CONTEXT --> QS10
    QS10 --> QS10_WRITE --> QS10_READ --> DL1
    
    DL1 --> DL1_READ --> DL1_CONTEXT --> DL2
    DL2 --> DL2_WRITE --> DL2_READ --> DL3
    DL3 --> DL3_WRITE --> DL4
    DL4 --> DL4_WRITE --> DL4_CONTEXT
    
    %% STYLING
    style START fill:#ff6b6b,stroke:#e55555,color:white,stroke-width:3px
    style DC1 fill:#4ecdc4,stroke:#45b7aa,color:white
    style CS1 fill:#45b7d1,stroke:#3a9bc1,color:white
    style DS1 fill:#96ceb4,stroke:#85b7a3,color:white
    style QS1 fill:#feca57,stroke:#fd9644,color:white
    style DL1 fill:#ff9ff3,stroke:#f368e0,color:white
    style DC1_WRITE fill:#e8f8f5,stroke:#4ecdc4,color:black
    style CS2_API fill:#ffcccb,stroke:#ff6b6b,color:black
    style DS10_API fill:#fff2cc,stroke:#feca57,color:black
```

---

## 📁 2. ПОЛНАЯ СТРУКТУРА ФАЙЛОВ И ИХ СОЗДАТЕЛИ

### Таблица: Файл → Функция → Размер → Время

| **Файл** | **Создается функцией** | **Размер** | **Время** | **Содержание** |
|----------|----------------------|------------|-----------|----------------|
| `campaign-metadata.json` | `create_campaign_folder()` | ~1KB | 0-2s | Метаданные кампании, статус, структура |
| `README.md` | `create_campaign_folder()` | ~1KB | 0-2s | Описание кампании и структуры |
| `data/requirements-analysis.json` | `extract_requirements()` | ~2-3KB | 5-8s | Извлеченные требования и ограничения |
| `data/emotional-profile.json` | `analyze_target_audience()` | ~500B | 8-12s | Эмоциональный профиль аудитории |
| `data/destination-analysis.json` | `analyze_target_audience()` | ~932B | 8-12s | Анализ направления путешествия |
| `data/market-intelligence.json` | `determine_content_strategy()` | ~654B | 12-15s | Рыночная аналитика |
| `data/trend-analysis.json` | `determine_content_strategy()` | ~797B | 12-15s | Анализ трендов |
| `content/outline-structure.json` | `create_content_outline()` | ~2-3KB | 15-18s | Структура контента |
| `data/consolidated-insights.json` | `cache_analysis_results()` | ~703B | 18-19s | Консолидированные инсайты |
| `handoffs/data-to-content.json` | `prepare_handoff()` | ~3-5KB | 20s | Передача данных к контенту |
| `content/email-content.json` | `generate_email_content()` | ~4.8KB | 22-35s | Сгенерированный контент email |
| `content/email-content.md` | `generate_email_content()` | ~2.8KB | 22-35s | Markdown версия контента |
| `content/pricing-analysis.json` | `integrate_travel_data()` | ~2.9KB | 35-40s | Анализ цен от Kupibilet API |
| `content/date-analysis.json` | `integrate_travel_data()` | ~1.8KB | 35-40s | Анализ дат поездки |
| `handoffs/content-to-design.json` | `prepare_design_handoff()` | ~5-7KB | 63-65s | Передача контента к дизайну |
| `content/design-brief-from-context.json` | `create_design_brief()` | ~3.1KB | 67-69s | Дизайн-бриф из контекста |
| `templates/email-template.mjml` | `generate_mjml_template()` | ~8-12KB | 75-78s | MJML шаблон email |
| `assets/email-template.html` | `save_design_assets()` | ~12KB | 86-87s | HTML версия шаблона |
| `assets/styles.css` | `save_design_assets()` | ~3KB | 86-87s | CSS стили |
| `design-decisions.json` | `save_design_assets()` | ~709B | 86-87s | Дизайнерские решения |
| `handoffs/design-to-quality.json` | `prepare_quality_handoff()` | ~1KB | 88-90s | Передача к QA |
| `handoffs/design-specialist-to-qa-specialist.json` | `prepare_quality_handoff()` | ~1.4KB | 88-90s | Детальная передача к QA |
| `docs/quality-report.json` | `generate_quality_report()` | ~3-5KB | 109-110s | Отчет о качестве |
| `docs/test-results.json` | `generate_quality_report()` | ~3-5KB | 109-110s | Результаты тестирования |
| `handoffs/quality-to-delivery.json` | `prepare_delivery_handoff()` | ~2-3KB | 111-112s | Передача к доставке |
| `exports/final-email-template.html` | `package_final_template()` | ~15KB | 113-115s | Финальный HTML шаблон |
| `exports/template-package.zip` | `package_final_template()` | ~25KB | 113-115s | Пакет шаблона |
| `exports/campaign-complete.zip` | `create_export_package()` | ~50KB | 115-117s | Полный пакет кампании |
| `exports/delivery-manifest.json` | `create_export_package()` | ~2KB | 115-117s | Манифест доставки |

---

## 🧠 3. ДЕТАЛЬНАЯ ЭВОЛЮЦИЯ КОНТЕКСТА

### Что добавляется в контекст на каждом этапе

```mermaid
graph LR
    subgraph "📊 КОНТЕКСТ: 2KB → 40KB (20x рост)"
        CTX1["🌱 НАЧАЛЬНЫЙ КОНТЕКСТ<br/>2KB<br/>• user_brief: string<br/>• timestamp: datetime"]
        
        CTX2["📋 ПОСЛЕ DATA COLLECTION<br/>15KB (+13KB)<br/>• campaign_id: string<br/>• requirements: array<br/>• audience_profile: object<br/>• content_strategy: object<br/>• content_outline: object<br/>• analysis_cache: object"]
        
        CTX3["📝 ПОСЛЕ CONTENT<br/>29KB (+14KB)<br/>• email_content: object<br/>• travel_data: object<br/>• pricing_info: object<br/>• optimized_content: object<br/>• mobile_adaptations: object<br/>• personalization_tokens: array<br/>• final_content: object"]
        
        CTX4["🎨 ПОСЛЕ DESIGN<br/>40KB (+11KB)<br/>• design_brief: object<br/>• visual_concepts: array<br/>• mjml_template: string<br/>• css_styles: object<br/>• responsive_rules: object<br/>• dark_mode_styles: object<br/>• validation_result: object<br/>• design_assets: array"]
        
        CTX5["✅ ПОСЛЕ QUALITY<br/>40KB (maintained)<br/>• html_validation: object<br/>• client_test_results: array<br/>• accessibility_score: number<br/>• performance_analysis: object<br/>• quality_report: object<br/>• overall_score: number"]
        
        CTX6["📦 ПОСЛЕ DELIVERY<br/>40KB (maintained)<br/>• delivery_complete: boolean<br/>• final_package_path: string<br/>• export_manifest: object"]
    end
    
    CTX1 --> CTX2 --> CTX3 --> CTX4 --> CTX5 --> CTX6
    
    style CTX1 fill:#e8f5e8,stroke:#4caf50,color:black
    style CTX2 fill:#e3f2fd,stroke:#2196f3,color:black
    style CTX3 fill:#f3e5f5,stroke:#9c27b0,color:black
    style CTX4 fill:#fff3e0,stroke:#ff9800,color:black
    style CTX5 fill:#e8f5e8,stroke:#4caf50,color:black
    style CTX6 fill:#f1f8e9,stroke:#8bc34a,color:black
```

---

## 🔄 4. ДЕТАЛЬНАЯ СХЕМА ЧТЕНИЯ/ЗАПИСИ ДАННЫХ

### Операции файловой системы по времени

```mermaid
gantt
    title Операции Чтения/Записи по Времени
    dateFormat X
    axisFormat %Ls
    
    section Data Collection (0-20s)
    Создание папки кампании                    :milestone, 0, 2
    Запись campaign-metadata.json              :2, 3
    Запись README.md                           :2, 3
    Запись requirements-analysis.json          :5, 8
    Запись emotional-profile.json              :8, 12
    Запись destination-analysis.json           :8, 12
    Запись market-intelligence.json            :12, 15
    Запись trend-analysis.json                 :12, 15
    Запись outline-structure.json              :15, 18
    Запись consolidated-insights.json          :18, 19
    Запись data-to-content.json                :20, 20
    
    section Content (20-65s)
    Чтение handoff файлов                      :20, 22
    OpenAI API: генерация контента             :22, 35
    Запись email-content.json                  :22, 35
    Запись email-content.md                    :22, 35
    Kupibilet API: данные о поездках           :35, 40
    Запись pricing-analysis.json               :35, 40
    Запись date-analysis.json                  :35, 40
    OpenAI API: оптимизация                    :40, 50
    OpenAI API: персонализация                 :52, 60
    Запись content-to-design.json              :63, 65
    
    section Design (65-90s)
    Чтение content handoff                     :65, 67
    Запись design-brief-from-context.json      :67, 69
    Запись email-template.mjml                 :75, 78
    Internal AI: валидация дизайна             :84, 85
    Запись email-template.html                 :86, 87
    Запись styles.css                          :86, 87
    Запись design-decisions.json               :86, 87
    Запись design-to-quality.json              :88, 90
    
    section Quality (90-112s)
    Чтение design handoff                      :90, 92
    Чтение HTML/MJML файлов                    :90, 92
    Тестирование email клиентов                :95, 100
    Проверка доступности                       :100, 103
    Валидация responsive дизайна               :103, 105
    Тестирование dark mode                     :105, 107
    Анализ производительности                  :107, 109
    Запись quality-report.json                 :109, 110
    Запись test-results.json                   :109, 110
    Запись quality-to-delivery.json            :111, 112
    
    section Delivery (112-118s)
    Чтение quality handoff                     :112, 113
    Чтение всех assets                         :112, 113
    Запись final-email-template.html           :113, 115
    Запись template-package.zip                :113, 115
    Запись campaign-complete.zip               :115, 117
    Запись delivery-manifest.json              :115, 117
    Обновление campaign-metadata.json          :117, 118
    Обновление README.md                       :117, 118
```

---

## 📊 5. РАЗМЕРЫ ДАННЫХ И PERFORMANCE МЕТРИКИ

### Детальная таблица производительности

| **Фаза** | **Функций** | **Время** | **Размер контекста** | **Файлов создано** | **API вызовов** | **Файлов прочитано** |
|-----------|-------------|-----------|---------------------|-------------------|-----------------|---------------------|
| **Data Collection** | 10 | 0-20s | 2KB → 15KB | 8 файлов | 0 | 1 файл |
| **Content** | 9 | 20-65s | 15KB → 29KB | 5 файлов | 4 (3 OpenAI + 1 Kupibilet) | 8 файлов |
| **Design** | 14 | 65-90s | 29KB → 40KB | 6 файлов | 1 (Internal AI) | 3 файла |
| **Quality** | 10 | 90-112s | 40KB (maintained) | 4 файла | 0 | 6 файлов |
| **Delivery** | 4 | 112-118s | 40KB (maintained) | 4 файла | 0 | 15+ файлов |
| **ИТОГО** | **47** | **118s** | **2KB → 40KB** | **27 файлов** | **5 API** | **33+ файлов** |

---

## 🔍 6. КРИТИЧЕСКИЕ УЗКИЕ МЕСТА ДЛЯ ДЖУНИОРА

### Что нужно понимать для оптимизации

#### 🐌 **Узкое место #1: Рост контекста**
```
ПРОБЛЕМА: Контекст растет с 2KB до 40KB (20x)
ГДЕ: Каждая функция добавляет данные, но ничего не удаляет
РЕШЕНИЕ: Очистка неиспользуемых данных после каждой фазы
```

#### 🐌 **Узкое место #2: Последовательные AI вызовы**
```
ПРОБЛЕМА: 3 OpenAI вызова выполняются последовательно (41-63s)
ГДЕ: generate_email_content() → optimize_content() → personalize_content()
РЕШЕНИЕ: Параллельные вызовы или batching
```

#### 🐌 **Узкое место #3: Множественные файловые операции**
```
ПРОБЛЕМА: 27 файлов создается, 33+ читается
ГДЕ: Каждая функция создает отдельные файлы
РЕШЕНИЕ: Batch операции или in-memory кэширование
```

---

## 🎯 7. ШПАРГАЛКА ДЛЯ ДЖУНИОРА

### Быстрый справочник по файлам

#### **📁 Что где лежит:**
- `data/` - Аналитические данные от Data Collection
- `content/` - Контент и дизайн-брифы от Content Specialist
- `assets/` - Финальные HTML/CSS файлы от Design Specialist
- `templates/` - MJML шаблоны
- `docs/` - Отчеты о качестве от Quality Specialist
- `handoffs/` - JSON файлы передачи между специалистами
- `exports/` - Финальные пакеты от Delivery Specialist

#### **🔄 Как читать контекст:**
```javascript
// В каждой функции доступен объект context
const requirements = context.requirements;        // из Data Collection
const email_content = context.final_content;      // из Content
const mjml_template = context.mjml_template;       // из Design
const quality_report = context.quality_report;    // из Quality
```

#### **📝 Как записать в файл:**
```javascript
// Стандартный паттерн записи
await writeFile(`${campaignPath}/data/analysis.json`, JSON.stringify(data, null, 2));
await updateContext(context, { analysis_complete: true });
```

#### **📖 Как прочитать файл:**
```javascript
// Стандартный паттерн чтения
const handoffData = await readFile(`${campaignPath}/handoffs/data-to-content.json`);
const parsedData = JSON.parse(handoffData);
```

---

## 🏆 ЗАКЛЮЧЕНИЕ ДЛЯ ДЖУНИОРА

### Главные принципы системы:

1. **Последовательность**: Каждый специалист ждет завершения предыдущего
2. **Накопление**: Контекст только растет, данные накапливаются
3. **Персистентность**: Все важные данные сохраняются в файлы
4. **Handoffs**: Передачи между специалистами через JSON файлы
5. **Валидация**: Каждая фаза проверяет результаты предыдущей

### Для понимания кода ищите:
- `writeFile()` - где создаются файлы
- `readFile()` - где читаются файлы  
- `context.` - где используется контекст
- `handoff` - где происходят передачи
- `await` - где происходят API вызовы

**Этой диаграммы достаточно чтобы понять всю архитектуру Email-Makers!** 🚀

---

*Создано специально для джуниор разработчиков - максимум деталей, минимум путаницы* 📚 