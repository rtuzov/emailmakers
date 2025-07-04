# ФАЙЛЫ ДЛЯ УДАЛЕНИЯ - КРАТКИЙ СПИСОК

## 🔥 КРИТИЧНО (УДАЛИТЬ НЕМЕДЛЕННО)

### 1. BACKUP ФАЙЛЫ
```bash
src/agent/multi-handoff-agent-original.ts                    # 49KB, 1178 строк
```

### 2. ДУБЛИРОВАННЫЕ SPECIALIST АГЕНТЫ
```bash
src/agent/specialists/design-specialist-agent-v2.ts          # 69KB, 1818 строк
src/agent/specialists/quality-specialist-agent.ts            # 74KB, 1928 строк  
src/agent/specialists/content-specialist-agent.ts            # 26KB, 781 строк
src/agent/specialists/delivery-specialist-agent.ts           # 50KB, 1358 строк
```

### 3. СИСТЕМЫ КООРДИНАЦИИ (ЗАМЕНЕНЫ OPENAI AGENT SDK)
```bash
src/agent/core/agent-handoffs.ts                             # 36KB, 966 строк
src/agent/core/brief-analyzer.ts                             # 27KB, 694 строки
src/agent/core/state-manager.ts                              # 8.7KB, 348 строк
```

## ⚡ ВЫСОКИЙ ПРИОРИТЕТ

### 4. СЛОЖНЫЕ СИСТЕМЫ
```bash
src/agent/core/feedback-loop.ts                              # 16KB, 565 строк
src/agent/core/tracing.ts                                    # 16KB, 605 строк
src/agent/utils/tracing-utils.ts                             # 8.0KB, 303 строки
```

### 5. ЦЕЛАЯ ДИРЕКТОРИЯ ОПТИМИЗАЦИИ
```bash
src/agent/optimization/                                      # ВСЯ ДИРЕКТОРИЯ (~135KB)
├── optimization-engine.ts                                   # 39KB, 1003 строки
├── optimization-analyzer.ts                                 # 29KB, 737 строк
├── optimization-service.ts                                  # 22KB, 656 строк
├── optimization-integration.ts                              # 22KB, 565 строк
├── optimization-types.ts                                    # 16KB, 563 строки
└── index.ts                                                 # 7.5KB, 194 строки
```

## 📊 СРЕДНИЙ ПРИОРИТЕТ

### 6. ДУБЛИРОВАННЫЕ CORE СЕРВИСЫ
```bash
src/agent/core/content-extractor.ts                          # 15KB, 385 строк
src/agent/core/email-rendering-service.ts                    # 19KB, 552 строки
src/agent/core/asset-manager.ts                              # 11KB, 337 строк
src/agent/core/cache-manager.ts                              # 12KB, 433 строки
src/agent/core/agent-response-validator.ts                   # 8.9KB, 269 строк
```

### 7. МОНИТОРИНГ
```bash
src/agent/monitoring/validation-monitor.ts                   # 23KB, 707 строк
```

## 🔧 НИЗКИЙ ПРИОРИТЕТ

### 8. УСТАРЕВШИЕ ФАЙЛЫ АРХИТЕКТУРЫ
```bash
src/agent/types.ts                                           # 2.1KB, 94 строки
src/agent/prompt-builder.ts                                  # 6.6KB, 152 строки
src/agent/tool-factory.ts                                    # 4.0KB, 82 строки
```

---

## 📊 ИТОГОВАЯ СТАТИСТИКА

- **ВСЕГО ФАЙЛОВ**: 23 файла + 1 директория
- **ОБЩИЙ РАЗМЕР**: ~500KB+ кода
- **СТРОК КОДА**: ~15,000+ строк
- **СОКРАЩЕНИЕ СЛОЖНОСТИ**: ~80%

## 🚀 КОМАНДЫ ДЛЯ УДАЛЕНИЯ

### КРИТИЧНО (выполнить сначала):
```bash
# Backup файлы
rm src/agent/multi-handoff-agent-original.ts

# Дублированные specialist агенты
rm src/agent/specialists/design-specialist-agent-v2.ts
rm src/agent/specialists/quality-specialist-agent.ts
rm src/agent/specialists/content-specialist-agent.ts
rm src/agent/specialists/delivery-specialist-agent.ts

# Системы координации
rm src/agent/core/agent-handoffs.ts
rm src/agent/core/brief-analyzer.ts
rm src/agent/core/state-manager.ts
```

### ВЫСОКИЙ ПРИОРИТЕТ:
```bash
# Сложные системы
rm src/agent/core/feedback-loop.ts
rm src/agent/core/tracing.ts
rm src/agent/utils/tracing-utils.ts

# Целая директория оптимизации
rm -rf src/agent/optimization/
```

### СРЕДНИЙ ПРИОРИТЕТ:
```bash
# Дублированные сервисы
rm src/agent/core/content-extractor.ts
rm src/agent/core/email-rendering-service.ts
rm src/agent/core/asset-manager.ts
rm src/agent/core/cache-manager.ts
rm src/agent/core/agent-response-validator.ts

# Мониторинг
rm src/agent/monitoring/validation-monitor.ts
```

### НИЗКИЙ ПРИОРИТЕТ:
```bash
# Устаревшие файлы
rm src/agent/types.ts
rm src/agent/prompt-builder.ts
rm src/agent/tool-factory.ts
```

## ✅ РЕЗУЛЬТАТ ОЧИСТКИ

После удаления архитектура станет:
- **На 80% проще**
- **Полностью совместимой с OpenAI Agent SDK**
- **Без дублирования кода**
- **Без TypeScript ошибок**
- **Готовой к продакшену** 