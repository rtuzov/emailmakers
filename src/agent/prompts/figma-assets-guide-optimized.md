# FIGMA ASSETS GUIDE - KUPIBILET MARKETING LIBRARY (OPTIMIZED)

## 🎯 OPTIMIZATION STATUS: 62% COMPLETE

**Total Nodes**: 13,624 | **Optimized**: 8/13 categories | **Progress**: 62%

---

## 🎭 EMOTIONAL STATES (Priority 10) - ✅ 100% COMPLETE

### Available Emotional Rabbits (6/6)
- ✅ `Счастлив` (Happy) - For promotions, success stories, positive news
- ✅ `Недоволен` (Unhappy) - For service issues, complaints, problems  
- ✅ `Озадачен` (Puzzled) - For FAQ, help sections, instructions
- ✅ `Нейтрален` (Neutral) - For informational content, standard messages
- ✅ `Разозлен` (Angry) - For urgent notifications, critical issues
- ✅ `Грустный` (Sad) - For apologies, empathy, compensations

**Search Strategy**:
```javascript
// For customer service emails
tags: ["недоволен", "заяц"] // → Unhappy rabbit

// For promotional emails  
tags: ["счастлив", "заяц"] // → Happy rabbit

// For FAQ/Help content
tags: ["озадачен", "заяц"] // → Puzzled rabbit

// For urgent notifications
tags: ["разозлен", "заяц"] // → Angry rabbit

// For apologies
tags: ["грустный", "заяц"] // → Sad rabbit

// For neutral content
tags: ["нейтрален", "заяц"] // → Neutral rabbit
```

---

## 📧 CONTEXTUAL VARIANTS (Priority 6) - ⚠️ 67% COMPLETE

### Available Context Rabbits (2/3)
- ✅ `Подборка` (Curated) - For newsletter with deals and selections
- ✅ `Новости` (News) - For news updates and announcements
- ❌ `FAQ` - **MISSING** (needs to be created)

**Search Strategy**:
```javascript
// For deal newsletters
tags: ["подборка", "заяц"] // → Curated content rabbits

// For news updates
tags: ["новости", "заяц"] // → News-themed rabbits

// For support content (fallback to emotional)
tags: ["озадачен", "заяц"] // → Use puzzled rabbit until FAQ variant created
```

---

## 🐰 GENERAL RABBITS (Priority 8) - ✅ AVAILABLE

### General Rabbit Characters (107 variations)
- `заяц "Общие" 01-107` - Different poses and situations
- Use for: General marketing, friendly messaging, travel themes
- **Fallback**: When specific emotional or contextual rabbits not found

---

## ✈️ AIRLINE LOGOS (Priority 7) - ❌ 0% STANDARDIZED

### Current Status (Needs Standardization)
- ❌ `Аэрофлот` (has duplicates =1, =2)
- ❌ `Turkish Airlines` (has duplicates =1, =2)
- ❌ `Nordwind` (has duplicates =1, =2)
- ❌ `Utair` (needs standardization)

**Target Names** (After Optimization):
- `авиакомпания-аэрофлот`
- `авиакомпания-turkish-airlines`
- `авиакомпания-nordwind`
- `авиакомпания-utair`

---

## 🗑️ CLEANUP STATUS - ❌ 18 DUPLICATES REMAINING

### Duplicates to Remove:
```
Priority Cleanup List:
- Недоволен=1, Недоволен=2
- Счастлив 2=1
- Property 1=1, Property 1=2 (all variants)
- Nordwind=1, Nordwind=2
- Turkish airlines=1, Turkish airlines=2
- Аэрофлот=1, Аэрофлот=2
```

---

## 🤖 UPDATED AI SEARCH STRATEGIES

### 1. Emotional Context Matching (PRIORITY)
```javascript
// Customer service scenarios
const emotionalMapping = {
  complaint: ["недоволен", "заяц"],
  success: ["счастлив", "заяц"],
  help: ["озадачен", "заяц"],
  urgent: ["разозлен", "заяц"],
  apology: ["грустный", "заяц"],
  neutral: ["нейтрален", "заяц"]
};
```

### 2. Content Type Matching
```javascript
// Email type scenarios  
const contentMapping = {
  newsletter: ["подборка", "заяц"],
  news: ["новости", "заяц"],
  faq: ["озадачен", "заяц"], // Fallback until FAQ variant created
  general: ["заяц", "общие"]
};
```

### 3. Airline-Specific Content
```javascript
// Use current names (will be standardized)
const airlineMapping = {
  aeroflot: ["аэрофлот"],
  turkish: ["turkish", "airlines"],
  nordwind: ["nordwind"],
  utair: ["utair"]
};
```

---

## 📋 PRIORITY SEARCH SYSTEM (UPDATED)

1. **Priority 10**: ✅ Emotional rabbit states (6/6 available)
2. **Priority 9**: ✅ General rabbit characters (107 available)
3. **Priority 8**: ✅ Rabbit characters with keyword match
4. **Priority 7**: ❌ Airline logos (needs standardization)
5. **Priority 6**: ⚠️ Contextual variants (2/3 available)
6. **Priority 5**: ✅ UI elements and icons
7. **Priority 4**: ✅ General keyword matches

---

## 💡 BEST PRACTICES FOR AI (UPDATED)

### Context-Aware Selection
- **Customer complaints** → `["недоволен", "заяц"]` ✅ Available
- **Success stories** → `["счастлив", "заяц"]` ✅ Available
- **Travel deals** → `["подборка", "заяц"]` ✅ Available
- **Help content** → `["озадачен", "заяц"]` ✅ Available
- **Urgent issues** → `["разозлен", "заяц"]` ✅ Available
- **Apologies** → `["грустный", "заяц"]` ✅ Available

### Multi-Tag Strategy
Always combine emotional state + category:
- `["заяц", "счастлив"]` for happy content
- `["заяц", "недоволен"]` for complaint handling
- `["заяц", "подборка"]` for curated content

### Fallback Strategy
1. Try emotional state first
2. Try contextual variant second  
3. Fall back to general rabbits
4. Use UI elements as last resort

---

## 🎯 REMAINING OPTIMIZATION TASKS

### High Priority:
1. **Create FAQ contextual variant** (1 component)
2. **Standardize airline names** (4 components)
3. **Remove 18 duplicates** (cleanup)

### Expected Final Result:
- ✅ **100% emotional coverage** (6/6)
- ✅ **100% contextual coverage** (3/3)
- ✅ **100% standardized airlines** (4/4)
- ✅ **0 duplicates remaining**

**Final Optimization Target**: 100% complete library ready for AI-powered email generation.

---

*Guide updated: 25.06.2025 | Current Status: 62% optimized*
