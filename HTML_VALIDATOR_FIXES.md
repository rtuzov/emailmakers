# HTML Validator Исправления

## 🚨 Проблемы, которые были исправлены:

### 1. **Обрезание HTML контента**
**Проблема**: `validateAndCorrectHtml` обрезал итоговый файл из-за ограничения `max_tokens: 4000`
- Оригинальный файл: 348 строк
- Исправленный файл: 273 строки (обрезан на "Успейте воспользоваться нашим предлож")

**Исправление**:
- Увеличил `max_tokens` с 4000 до 16000
- Добавил проверку на значительное сокращение размера HTML (>10%)
- Если обнаружено сокращение >10%, система использует оригинальный HTML

### 2. **Неправильное изменение путей к изображениям**
**Проблема**: Валидатор считал корректные локальные пути ошибкой и пытался их "исправить"

**Исправление**:
- Улучшил промпт для AI с четкими инструкциями не изменять существующие пути
- Добавил проверку на локальные пути разработки (`/Users/`, `/home/`, `C:\`)
- Изменил серьезность ошибки с 'critical' на 'minor' для несуществующих ассетов
- Улучшил сопоставление путей в asset manifest

## 🔧 Конкретные изменения:

### 1. **Увеличение лимита токенов**
```typescript
// Было:
max_tokens: 4000

// Стало:
max_tokens: 16000  // Increased from 4000 to prevent truncation
```

### 2. **Защита от обрезания контента**
```typescript
// Добавлена проверка размера:
const percentageDifference = (lengthDifference / originalLength) * 100;

if (percentageDifference > 10) {
  console.warn(`⚠️ WARNING: Corrected HTML is ${percentageDifference.toFixed(1)}% shorter than original`);
  console.warn(`⚠️ This may indicate content truncation. Using original HTML instead.`);
  
  // Return original HTML if significant truncation detected
  return {
    correctionsMade: [`Skipped correction due to potential content truncation`]
  };
}
```

### 3. **Улучшенный промпт для AI**
```typescript
// Добавлены критические инструкции:
CRITICAL INSTRUCTIONS:
1. Fix ONLY the specific errors listed above
2. DO NOT modify or truncate any existing content
3. DO NOT change existing image paths or src attributes unless they are specifically listed as errors
4. PRESERVE ALL text content completely - do not cut off or truncate anything
5. Maintain the original design and layout exactly

WHAT TO PRESERVE:
- All existing image paths and src attributes
- All text content in full
- All styling and CSS
- All HTML structure and elements
- All footer content and links
```

### 4. **Защита локальных путей**
```typescript
// Добавлена проверка на локальные пути:
const isLocalDevPath = src.startsWith('/Users/') || src.startsWith('/home/') || src.startsWith('C:\\');

if (!assetExists && !isLocalDevPath) {
  errors.push({
    type: 'asset',
    severity: 'minor', // Changed from 'critical' to 'minor'
    message: `Referenced asset not found in manifest: ${src}`,
    suggestion: `Add asset ${src} to asset manifest or use correct path`
  });
}
```

### 5. **Улучшенное сопоставление путей**
```typescript
// Более гибкое сопоставление путей:
const assetExists = assetManifest.images && Array.isArray(assetManifest.images) && 
  assetManifest.images.some((img: any) => {
    const imgPath = img.path || img.filename || '';
    const imgFilename = img.filename || path.basename(imgPath);
    const srcBasename = path.basename(src);
    
    return imgFilename === srcBasename || 
           imgPath.includes(srcBasename) || 
           src.includes(imgFilename) ||
           imgPath.includes(src);
  });
```

## 🎯 Результат:

✅ **Контент больше не обрезается** - система проверяет размер и отклоняет обрезанные версии
✅ **Пути к изображениям сохраняются** - локальные пути не изменяются без необходимости
✅ **Улучшенная валидация** - более точное определение реальных ошибок
✅ **Защита от ложных срабатываний** - локальные пути разработки не считаются ошибками

## 📍 Файл с исправлениями:
`src/agent/specialists/design-specialist/html-validator.ts`

Теперь `validateAndCorrectHtml` будет:
- Сохранять весь контент без обрезания
- Не изменять корректные пути к изображениям
- Правильно валидировать только реальные ошибки
- Предоставлять полный отчет о проделанных изменениях 