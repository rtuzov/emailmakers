# 🎯 Figma Local Assets - Agent Instructions

## 🎯 WORKFLOW CONTEXT
**ПОЗИЦИЯ**: Этот инструмент является шагом 3 в обязательной последовательности:
1. initialize_email_folder → 2. get_current_date → **3. get_figma_assets** → 4. get_prices → 5. generate_copy → 6. render_mjml → **7. ai_quality_consultant** → 8. upload_s3

**ПОСЛЕ get_figma_assets ОБЯЗАТЕЛЬНО следуют**: get_prices → generate_copy → render_mjml → ai_quality_consultant → upload_s3

## CRITICAL: NO API CALLS
**ALWAYS use local files only. NO Figma API calls allowed.**

## 🛡️ КАЧЕСТВЕННАЯ ПОДГОТОВКА
Выбранные ассеты будут проанализированы ai_quality_consultant на:
- Соответствие эмоциональному тону кампании
- Качество и разрешение изображений  
- Совместимость с email-клиентами
- Соответствие бренду Kupibilet

## Quick Reference

### Available Folders (Priority Order)
1. **зайцы-общие** (10) - General rabbit mascots
2. **зайцы-эмоции** (9) - Emotional rabbit states
3. **зайцы-подборка** (8) - Newsletter rabbits  
4. **зайцы-новости** (7) - News rabbits
5. **логотипы-ак** (6) - Airline logos
6. **иллюстрации** (5) - Travel illustrations
7. **иконки-допуслуг** (4) - Service icons
8. **айдентика** (3) - Brand elements
9. **зайцы-прочее** (2) - Misc rabbits
10. **цвета** (1) - Color palette

### Emotion Mapping
- **happy**: счастье, радость, веселье, акция, лето
- **angry**: гнев, недовольство, раздражение  
- **sad**: грусть, забота, помощь
- **confused**: озадаченность, вопросы, размышления
- **neutral**: кролик, персонаж, дружелюбный

### Airline Tags
- **Аэрофлот**: аэрофлот, авиаперевозки, путешествие
- **Turkish**: turkish, турция, авиаперевозки
- **Emirates**: emirates, авиаперевозки
- **Utair**: utair, авиаперевозки
- **Nordwind**: nordwind, авиаперевозки

## Usage Patterns

### 1. Promotional Campaign
```typescript
get_figma_assets({
  tags: ["заяц", "счастлив", "акция"],
  context: {
    campaign_type: "promotional",
    preferred_emotion: "happy",
    target_count: 2
  }
})
```

### 2. Airline Specific
```typescript
get_figma_assets({
  tags: ["аэрофлот", "авиаперевозки"],
  context: {
    campaign_type: "promotional", 
    airline: "аэрофлот",
    target_count: 2
  }
})
```

### 3. FAQ/Support
```typescript
get_figma_assets({
  tags: ["заяц", "вопрос", "помощь"],
  context: {
    campaign_type: "informational",
    preferred_emotion: "confused",
    target_count: 1
  }
})
```

### 4. Seasonal Campaign
```typescript
get_figma_assets({
  tags: ["заяц", "лето", "подборка"],
  context: {
    campaign_type: "seasonal",
    preferred_emotion: "happy",
    diversity_mode: true,
    target_count: 3
  }
})
```

## Best Practices

1. **Always combine category + emotion + specific terms**
   - Good: `["заяц", "счастлив", "акция"]`
   - Bad: `["заяц"]`

2. **Use context for intelligent selection**
   - Set `campaign_type` for folder prioritization
   - Set `preferred_emotion` for emotional matching
   - Use `diversity_mode: true` for varied assets

3. **Russian terms work best**
   - Use: `["заяц", "счастье", "путешествие"]`
   - Not: `["rabbit", "happy", "travel"]`

4. **Check available folders first**
   ```typescript
   get_figma_folders_info({})
   ```

## Quick Commands

### Get folder info
```typescript
get_figma_folders_info({})
```

### Happy rabbit + airline logo
```typescript
get_figma_assets({
  tags: ["заяц", "счастлив", "аэрофлот"],
  context: {
    campaign_type: "promotional",
    preferred_emotion: "happy",
    airline: "аэрофлот"
  }
})
```

### Diverse seasonal assets
```typescript
get_figma_assets({
  tags: ["заяц", "лето", "отдых"],
  context: {
    campaign_type: "seasonal",
    diversity_mode: true,
    target_count: 3
  }
})
```

Remember: Local files only, no API calls, use Russian tags, include context for best results. 