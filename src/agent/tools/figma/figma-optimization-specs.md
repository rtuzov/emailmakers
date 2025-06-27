# Figma & Email Storage Optimization Fixes

## Problems Fixed:

### 1. ❌ Figma API возвращает "Недоволен" (заяц) вместо парижских изображений
**Root Cause**: Приоритеты категорий в NODE_CATEGORIES были неправильными
**Fix Applied**: ✅ Установлены приоритеты:
- travel: 12 (highest priority)
- landmarks: 11 (high priority)  
- rabbits: 9 (lower priority)

### 2. ❌ Claude API error: 404 "model: claude-3-sonnet-20240229"
**Root Cause**: Устаревшая модель Claude в API запросе
**Fix Applied**: ✅ Обновлена модель на `claude-3-5-sonnet-20241022`

### 3. ❌ Письма сохраняются не в папку mails/
**Root Cause**: Изображения сохраняются в /tmp/figma, письма в /tmp/email-campaigns
**Fix Required**: Нужно исправить пути в:

#### src/agent/tools/figma.ts - downloadImage function (line ~340):
```typescript
async function downloadImage(url: string, fileName: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  // CHANGE: Save to mails/ directory in project root
  const mailsDir = path.join(process.cwd(), 'mails');
  await fs.mkdir(mailsDir, { recursive: true });

  const filePath = path.join(mailsDir, fileName);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buffer));

  return filePath;
}
```

#### src/agent/tools/upload.ts - saveToLocal function (line ~155):
```typescript
async function saveToLocal(params: UploadParams, campaignId: string): Promise<void> {
  try {
    // CHANGE: Create directory in project root mails folder
    const fs = await import('fs/promises');
    const path = await import('path');
    const localDir = path.join(process.cwd(), 'mails', campaignId);
    
    await fs.mkdir(localDir, { recursive: true });
    await fs.mkdir(`${localDir}/assets`, { recursive: true });

    // Save HTML file
    await fs.writeFile(`${localDir}/email.html`, params.html);
    console.log(`💾 Saved HTML to: ${localDir}/email.html`);

    // ... rest of function
    console.log(`✅ Local campaign saved in mails/: ${campaignId}`);
  } catch (error) {
    console.error('Failed to save files locally:', error);
  }
}
```

## Expected Results After Fixes:

1. ✅ Figma будет возвращать парижские изображения с приоритетом
2. ✅ Claude API будет работать с новой моделью
3. ✅ Все файлы (изображения и письма) будут сохраняться в mails/
4. ✅ Структура: mails/campaign-id/email.html, email.mjml, assets/

## Test Command:
```bash
# Test the Paris campaign generation
curl -X POST http://localhost:3000/api/agent/paris-campaign \
  -H "Content-Type: application/json" \
  -d '{"destination": "Paris", "theme": "romantic"}'
```

Expected to see files in: `mails/email-TIMESTAMP-HASH/` 