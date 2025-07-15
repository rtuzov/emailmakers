# FIGMA ASSETS GUIDE - KUPIBILET MARKETING LIBRARY (OPTIMIZED)

## 📅 ТЕКУЩАЯ ДАТА
**КРИТИЧЕСКИ ВАЖНО**: Используйте эту функцию для получения актуальной даты:

```javascript
function getCurrentDate() {
  const now = new Date();
  return {
    current_date: now.toISOString().split('T')[0], // YYYY-MM-DD
    current_datetime: now.toISOString(),
    current_year: now.getFullYear(),
    current_month: now.getMonth() + 1,
    current_day: now.getDate(),
    formatted_date: now.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }),
    weekday: now.toLocaleDateString('ru-RU', { weekday: 'long' })
  };
}
```

**ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙТЕ** эту функцию для:
- Планирования дат поездок (только будущие даты!)
- Расчета сезонности
- Определения оптимальных периодов бронирования
- Генерации контента с актуальными датами

**ЗАПРЕЩЕНО** использовать хардкоженные даты 2024 года или прошлые даты!

## 🎯 OPTIMIZED ASSET CATEGORIES

### 1. RABBIT CHARACTERS (Primary Mascots) - **107 TOTAL**
**Search tags**: `["заяц", "rabbit", "эмоция", "контекст"]`

#### ✅ EMOTIONAL STATES (Priority 10) - **6 AVAILABLE**
- `Счастлив` (Happy) - For promotions, success stories, positive news
- `Недоволен` (Unhappy) - For service issues, complaints, problems
- `Озадачен` (Puzzled) - For FAQ, help sections, instructions
- `Нейтрален` (Neutral) - For informational content, standard messages
- `Разозлен` (Angry) - For urgent notifications, critical issues
- `Грустный` (Sad) - For apologies, empathy, compensations

#### ✅ CONTEXTUAL VARIANTS (Priority 6) - **2 AVAILABLE**
- `Подборка` (Curated) - For newsletter with deals and selections
- `Новости` (News) - For news updates and announcements
- ❌ `FAQ` - Missing (needs to be created)

#### General Rabbit Characters (Priority 8) - **107 variations**
- `заяц "Общие" 01-107` - Different poses and situations
- Use for: General marketing, friendly messaging, travel themes

**AI Usage**: ALWAYS prioritize emotional states for personalized content. Use contextual variants for specific email types.

### 2. AIRLINE LOGOS & BRANDING
**Search tags**: `["аэрофлот", "airline", "turkish", "utair"]`

#### Available Airlines
- `Аэрофлот` - Russian flagship carrier
- `Turkish Airlines` - International carrier
- `Utair` - Regional Russian airline  
- `Nordwind` - Charter airline

**AI Usage**: Use airline-specific logos when generating emails about specific carriers or partnerships.

### 3. EMAIL TEMPLATE CATEGORIES
**Search tags**: `["подборка", "новости", "вопрос-ответ"]`

#### Template Types
- `заяц «Подборка»` (1-21) - Curated content/deals
- `заяц «Новости»` (01-02) - News and updates
- `заяц «Вопрос-ответ»` (01-05) - FAQ and support

**AI Usage**: Match email content type with appropriate template category.

### 4. UI ELEMENTS & ICONS
**Search tags**: `["icon", "element", "component"]`

#### Available Elements
- `Icon Kupibilet` - Main brand icon
- `Icon Blog` - Blog-related content
- `Icon Kupi com` - E-commerce elements
- `Brand element` - General branding components
- `element_1` through `element_18` - Various UI components

## 🤖 AI SEARCH STRATEGIES

### Emotional Context Matching
```javascript
// For customer service emails
tags: ["недоволен", "заяц"] // → Unhappy rabbit

// For promotional emails  
tags: ["счастлив", "заяц"] // → Happy rabbit

// For FAQ/Help content
tags: ["озадачен", "заяц"] // → Puzzled rabbit
```

### Content Type Matching
```javascript
// For deal newsletters
tags: ["подборка", "заяц"] // → Curated content rabbits

// For news updates
tags: ["новости", "заяц"] // → News-themed rabbits

// For support content
tags: ["вопрос-ответ", "заяц"] // → FAQ rabbits
```

## 📋 SEARCH PRIORITY SYSTEM

1. **Priority 10**: Emotional rabbit states (perfect emotion match)
2. **Priority 9**: General rabbit characters  
3. **Priority 8**: Rabbit characters with keyword match
4. **Priority 7**: Airline logos and branding
5. **Priority 6**: Email template categories
6. **Priority 5**: UI elements and icons
7. **Priority 4**: General keyword matches

## 💡 BEST PRACTICES FOR AI

### Context-Aware Selection
- **Customer complaints** → Search for "недоволен" (unhappy rabbit)
- **Success stories** → Search for "счастлив" (happy rabbit)  
- **Travel deals** → Search for "подборка" + airline name
- **Help content** → Search for "вопрос-ответ" or "озадачен"

### Multi-Tag Strategy
Always combine category + specific term:
- `["заяц", "счастлив"]` instead of just `["счастлив"]`
- `["airline", "аэрофлот"]` instead of just `["аэрофлот"]`

This guide helps AI understand the rich asset library available and make contextually appropriate choices for email generation.
