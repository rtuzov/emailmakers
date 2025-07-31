# AI SELF-CORRECTION STANDARD

## Принцип замены Fallback'ов

**КРИТИЧНО:** Все hardcoded fallback'ы заменены на AI self-correction механизм.

### ❌ ЗАПРЕЩЕНО:
```typescript
// ❌ НЕПРАВИЛЬНО: Hardcoded fallback
} catch (error) {
  const fallbackData = {
    field1: "default value",
    field2: "hardcoded data"
  };
  return fallbackData;
}
```

### ✅ ПРАВИЛЬНО:
```typescript
// ✅ ПРАВИЛЬНО: AI self-correction
} catch (error) {
  console.error('❌ AI generation failed:', error);
  console.log('🚫 No hardcoded fallback - letting AI retry mechanism handle error correction');
  
  // Let error bubble up for AI self-correction by caller
  throw new Error(`AI generation failed: ${error.message}. No fallback allowed per project rules - AI retry mechanism should handle self-correction.`);
}
```

## Стандартный AI Retry Pattern

### 1. Import AI Retry Utilities
```typescript
import { 
  enhancedOpenAICall, 
  parseJSONWithRetry, 
  aiSelfCorrectionRetry 
} from '../../../shared/utils/ai-retry-mechanism';
```

### 2. Use AI Self-Correction Function
```typescript
async function generateWithAIRetry(params: any): Promise<any> {
  return aiSelfCorrectionRetry({
    specialist_name: 'YourSpecialist',
    task_description: 'Generate specific content',
    max_attempts: 5,
    baseCallFunction: async (retryParams) => {
      const result = await enhancedOpenAICall({
        prompt: buildPrompt(retryParams),
        error_feedback: retryParams.error_feedback,
        retry_attempt: retryParams.retry_attempt,
        specialist_name: 'YourSpecialist'
      });
      
      return parseJSONWithRetry(result, 'YourSpecialist');
    },
    ...params
  });
}
```

### 3. Error Propagation Pattern
```typescript
} catch (error) {
  // ✅ NO FALLBACK: Let AI retry mechanism handle self-correction
  throw new Error(`[SpecialistName] failed: ${error.message}. No fallback allowed per project rules.`);
}
```

## Исправленные Файлы

### ✅ ai-template-designer.ts
- Удален hardcoded `generateFallbackTemplateDesign`
- Использует только AI retry механизм

### ✅ content-specialist-tools.ts  
- Удален hardcoded `fallbackManifest`
- Ошибки проходят до AI retry механизма

### ✅ ai-analysis.ts
- Удалены JSON parse fallback и complete fallback
- Использует `parseJSONWithRetry` + error propagation

### ✅ base-agent-types.ts
- `createFallbackContentData` выбрасывает ошибку
- Fallback контент запрещен

### ✅ asset-manifest-generator.ts
- Уже настроен правильно: "Fallback manifests are prohibited"

## Validation Checklist

При создании нового специалиста:

- [ ] Импортированы AI retry utilities
- [ ] Используется `aiSelfCorrectionRetry` или `enhancedOpenAICall`
- [ ] JSON парсинг через `parseJSONWithRetry`
- [ ] Нет hardcoded fallback структур
- [ ] Ошибки проходят до retry механизма
- [ ] Error messages включают "No fallback allowed per project rules"

## Benefits

1. **Consistent Quality**: AI исправляет свои ошибки вместо дефолтных значений
2. **Learning**: AI учится на ошибках и улучшает результаты
3. **Real Data**: Только реальные данные, никаких заглушек
4. **Maintainable**: Единообразный подход во всех специалистах
5. **Resilient**: Система автоматически восстанавливается от AI сбоев 