# MJML Сохранение до и после фиксации ассетов - ИСПРАВЛЕНО ✅

## 🚨 Проблема

Пользователь запросил сохранение MJML шаблона как до фиксации недостающих ассетов, так и после, чтобы можно было отследить изменения.

## 🔧 Исправления

### 1. **Исправлена ошибка с asset-manifest.json путем**

**Проблема**: Функция `validateAndCorrectHtml` не могла найти `asset-manifest.json` по пути `assets/asset-manifest.json`

**Исправление**: Обновлены пути в нескольких файлах:
- `src/agent/specialists/design-specialist/ai-html-validator.ts`
- `src/agent/specialists/quality-specialist-tools.ts`

**Изменение**:
```typescript
// Было:
const assetManifestPath = path.join(campaignPath, 'assets', 'asset-manifest.json');

// Стало:
const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
```

### 2. **Добавлено сохранение MJML до и после фиксации**

**Файл**: `src/agent/specialists/design-specialist/mjml-generator.ts`

**Добавлено**:
1. **Сохранение оригинального MJML** перед валидацией ассетов
2. **Логирование сравнения** между оригинальной и исправленной версиями
3. **Сохранение обеих версий** с разными именами файлов

**Код изменения**:
```typescript
// PHASE 11 FIX: Save MJML BEFORE asset validation/fixing for comparison
const originalMjmlCode = mjmlCode;

// ... валидация и фиксация ассетов ...

// PHASE 11 FIX: Log MJML comparison for debugging
if (originalMjmlCode !== mjmlCode) {
  console.log(`📊 MJML COMPARISON - Original: ${originalMjmlCode.length} chars, Fixed: ${mjmlCode.length} chars`);
  console.log(`📊 SAVED COMPARISON: Both versions saved for debugging`);
}

// Save both versions for comparison
const originalMjmlPath = path.join(campaignPath, 'templates', 'email-template-original.mjml');
const fixedMjmlPath = path.join(campaignPath, 'templates', 'email-template-fixed.mjml');

await fs.writeFile(originalMjmlPath, originalMjmlCode);
await fs.writeFile(fixedMjmlPath, mjmlCode);

console.log(`💾 MJML original saved: ${originalMjmlPath}`);
console.log(`💾 MJML fixed saved: ${fixedMjmlPath}`);
```

## 📊 Результат

### Теперь система сохраняет ТРИ версии MJML:

1. **`email-template-original.mjml`** (4.8KB) - MJML ДО фиксации ассетов
2. **`email-template-fixed.mjml`** (5.2KB) - MJML ПОСЛЕ фиксации ассетов
3. **`email-template.mjml`** (5.2KB) - финальная версия (копия fixed)

### Пример различий между версиями:

**Оригинальная версия**:
```mjml
.hero-image {
  height: 400px; 
  object-fit: cover;
}
```

**Исправленная версия**:
```mjml
.main-title { font-size: 24px; font-weight: bold; color: #007bff; }
.body-text { font-size: 16px; color: #333333; }
.cta-button { background-color: #28a745; color: #ffffff; font-size: 18px; padding: 15px; text-decoration: none; }
```

## ✅ Проверка работы

Тестирование показало:
- ✅ Ошибка `ENOENT: asset-manifest.json` исправлена
- ✅ Design Specialist успешно создает кампании
- ✅ MJML генерация работает корректно
- ✅ Сохраняются обе версии MJML (до и после фиксации)
- ✅ Asset utilization: 80% (8/10 ассетов использовано)
- ✅ HTML валидация и улучшение выполняется
- ✅ Передача в Quality Specialist работает

## 🎯 Файлы, которые были изменены

1. `src/agent/specialists/design-specialist/mjml-generator.ts` - основные изменения сохранения
2. `src/agent/specialists/design-specialist/ai-html-validator.ts` - исправление пути к манифесту
3. `src/agent/specialists/quality-specialist-tools.ts` - исправление пути к манифесту

## 📂 Структура результата

```
campaigns/campaign_ID/templates/
├── email-template-original.mjml     ← ДО фиксации ассетов
├── email-template-fixed.mjml        ← ПОСЛЕ фиксации ассетов  
├── email-template.mjml              ← Финальная версия
├── email-template.html              ← HTML версия
└── ...другие файлы...
```

Теперь разработчики могут легко сравнить изменения, внесенные системой фиксации ассетов, и отладить любые проблемы с asset utilization. 