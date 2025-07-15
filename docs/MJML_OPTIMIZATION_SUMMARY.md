# ОПТИМИЗАЦИЯ MJML ГЕНЕРАТОРА - РЕЗЮМЕ

## Проблема
Пользователь обратил внимание, что MJML генератор постоянно выгружает все ответы от AI ассистента, что приводит к накоплению огромного объема данных и потенциальным проблемам с производительностью.

## Проведенные оптимизации

### 1. Упрощение извлечения MJML кода
**До:** Система пыталась извлечь MJML из множественных путей:
- `lastModelResponse.output[0].content[0].text`
- `currentStep.output`
- `generatedItems[0].rawItem.content[0].text`
- `modelResponses[0].output[0].content[0].text`
- Поиск по всему JSON

**После:** Приоритизированный подход:
1. **ПРИОРИТЕТ 1:** Последний ответ модели (`lastModelResponse`) - самый свежий
2. **ПРИОРИТЕТ 2:** Текущий шаг (`currentStep.output`) - если нет последнего ответа
3. **ПРИОРИТЕТ 3:** Ограниченный поиск по JSON (максимум 50KB)

### 2. Ограничение размера данных для поиска
- Добавлено ограничение в 50KB для поиска MJML в JSON структурах
- Предотвращает обработку гигантских ответов AI
- Ускоряет извлечение MJML кода

### 3. Усиленная очистка от JSON структур
**Проблема:** MJML код содержал полные JSON ответы AI вместо чистого MJML.

**Решение:** Добавлена усиленная проверка на JSON маркеры:
- `{"state":`
- `"lastModelResponse"`
- `"currentStep"`
- `"output"`
- JSON объекты, содержащие MJML

### 4. Оптимизация логики исправления ошибок
Применены те же принципы к процессу исправления ассетов:
- Извлечение только последнего ответа
- Ограничение размера поиска
- Улучшенная очистка от JSON

### 5. Улучшенное сохранение файлов
- Двойная проверка на JSON перед сохранением MJML файлов
- Автоматическое удаление символов экранирования (`\n`, `\"`, `\t`)
- Логирование размера сохраняемых файлов для мониторинга

## Технические детали

### Код до оптимизации:
```typescript
// Множественные пути извлечения
if (resultObj.lastModelResponse?.output?.[0]?.content?.[0]?.text) { ... }
else if (resultObj.currentStep?.output) { ... }
else if (resultObj.generatedItems?.[0]?.rawItem?.content?.[0]?.text) { ... }
else if (resultObj.modelResponses?.[0]?.output?.[0]?.content?.[0]?.text) { ... }
else {
  // Поиск по всему JSON без ограничений
  const jsonStr = JSON.stringify(result);
  const mjmlMatch = jsonStr.match(/<mjml>[\s\S]*?<\/mjml>/);
}
```

### Код после оптимизации:
```typescript
// Приоритизированный подход с ограничениями
if (resultObj.lastModelResponse?.output?.[0]?.content?.[0]?.text) {
  mjmlCode = resultObj.lastModelResponse.output[0].content[0].text;
  console.log('✅ Extracted MJML from lastModelResponse (latest)');
}
else if (resultObj.currentStep?.output) {
  mjmlCode = resultObj.currentStep.output;
  console.log('✅ Extracted MJML from currentStep.output');
}
else {
  // Ограниченный поиск (максимум 50KB)
  const maxSearchSize = 50000;
  const resultString = JSON.stringify(result);
  const searchString = resultString.length > maxSearchSize 
    ? resultString.substring(0, maxSearchSize) + '...[truncated]'
    : resultString;
  
  const mjmlMatch = searchString.match(/<mjml>[\s\S]*?<\/mjml>/);
}
```

## Результаты оптимизации

### Преимущества:
1. **Предотвращение накопления данных:** Система больше не сохраняет все ответы AI
2. **Улучшенная производительность:** Ограничение размера обрабатываемых данных
3. **Более чистый MJML:** Усиленная фильтрация JSON структур
4. **Лучшая отладка:** Улучшенное логирование с указанием размеров

### Решенные проблемы:
- ❌ **Экспоненциальный рост ответов:** Теперь берется только последний ответ
- ❌ **Огромные JSON структуры:** Ограничение в 50KB для поиска
- ❌ **JSON в MJML файлах:** Усиленная очистка перед сохранением
- ❌ **Медленная обработка:** Приоритизированные пути извлечения

## Мониторинг
Добавлено логирование для отслеживания:
- Размера извлекаемого MJML кода
- Метода извлечения (lastModelResponse, currentStep, pattern match)
- Размера сохраняемых файлов
- Результатов очистки JSON

## Рекомендации на будущее
1. Мониторить размеры MJML файлов в логах
2. При появлении файлов размером >10KB проверять на наличие JSON
3. Рассмотреть добавление лимитов на размер AI ответов
4. Периодически очищать старые кампании для освобождения места

---

**Дата оптимизации:** 2025-01-14  
**Файл:** `src/agent/specialists/design-specialist/mjml-generator.ts`  
**Статус:** ✅ Завершено и готово к тестированию 