# 🔧 КОНФИГУРАЦИЯ ASSET MANIFEST - БЕЗ ЗАХАРДКОЖЕННЫХ ПАРАМЕТРОВ

## 🎯 ОБЗОР

Все захардкоженные параметры удалены из системы Asset Manifest. Теперь все настройки конфигурируются через переменные окружения, что обеспечивает максимальную гибкость.

## ✅ УДАЛЕННЫЕ ЗАХАРДКОЖЕННЫЕ ПАРАМЕТРЫ

### Что было удалено:
- `temperature: 0.3` → `parseFloat(process.env.AI_TEMPERATURE || '0.3')`
- `max_tokens: 2000` → `parseInt(process.env.AI_MAX_TOKENS || '2000')`
- `slice(0, 5)` → `slice(0, parseInt(process.env.ASSET_FILE_LIMIT || '5'))`
- Фиксированные размеры изображений
- Жестко заданные лимиты email клиентов
- Предустановленные пороги качества

### Удаленные файлы:
- ❌ `asset-manifest-generator-old.ts` (содержал множество захардкоженных значений)

## 🔧 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

### 🤖 AI CONFIGURATION
```bash
AI_MODEL=gpt-4o-mini                    # Модель AI
AI_TEMPERATURE=0.3                      # Температура генерации
AI_MAX_TOKENS=2000                      # Максимум токенов
AI_MAX_FILES=3                          # Максимум файлов для AI анализа
AI_SYSTEM_PROMPT="Your custom prompt"   # Системный промпт
```

### 📁 FILE LIMITS  
```bash
ASSET_FILE_LIMIT=5         # Лимит файлов на папку
MAX_IMAGE_SIZE=500000      # Максимум размера изображения (байты)
MAX_TOTAL_SIZE=5000000     # Максимум общего размера (байты)
```

### 🌄 UNSPLASH API
```bash
UNSPLASH_API_KEY=your_key               # API ключ Unsplash
UNSPLASH_IMAGES_PER_QUERY=1             # Изображений на запрос
```

### 🎨 IMAGE QUALITY
```bash
IMAGE_QUALITY=80           # Качество изображений (0-100)
COMPRESSION_LEVEL=80       # Уровень сжатия (0-100)
```

### 📧 EMAIL CLIENT LIMITS
```bash
# Gmail
GMAIL_MAX_SIZE=500000
GMAIL_FORMATS=jpg,png

# Outlook  
OUTLOOK_MAX_SIZE=400000
OUTLOOK_FORMATS=jpg,png

# Apple Mail
APPLE_MAIL_MAX_SIZE=600000
APPLE_MAIL_FORMATS=jpg,png,gif

# Yahoo Mail
YAHOO_MAIL_MAX_SIZE=450000
YAHOO_MAIL_FORMATS=jpg,png
```

### 📏 IMAGE VALIDATION
```bash
MIN_IMAGE_WIDTH=50         # Минимальная ширина
MAX_IMAGE_WIDTH=600        # Максимальная ширина
MIN_IMAGE_HEIGHT=50        # Минимальная высота
MAX_IMAGE_HEIGHT=400       # Максимальная высота
```

### ✅ QUALITY THRESHOLDS
```bash
MIN_ACCESSIBILITY_SCORE=95      # Минимальный балл доступности
MIN_EMAIL_COMPATIBILITY=90      # Минимальная совместимость с email
MIN_OPTIMIZATION_SCORE=80       # Минимальный балл оптимизации
```

## 📝 ИСПОЛЬЗОВАНИЕ КОНФИГУРАЦИИ

### В коде:
```typescript
import { getAssetManifestConfig } from './config';

const config = getAssetManifestConfig();

// Использование
temperature: config.aiTemperature,
max_tokens: config.aiMaxTokens,
slice(0, config.assetFileLimit)
```

### Проверка конфигурации:
```typescript
import { getAssetManifestConfig } from './config';

console.log('🔧 Asset Manifest Configuration:', getAssetManifestConfig());
```

## 🚀 ПРЕИМУЩЕСТВА

### 1. **Гибкость**
- Настройка под разные окружения (dev/staging/prod)
- Индивидуальная конфигурация для каждого клиента
- A/B тестирование параметров

### 2. **Безопасность**
- API ключи не в коде
- Настройки изолированы в переменных окружения
- Нет утечки секретов в репозиторий

### 3. **Простота поддержки**
- Изменение настроек без пересборки
- Легкое тестирование разных конфигураций
- Централизованное управление параметрами

## 🔄 МИГРАЦИЯ

### До (захардкожено):
```typescript
temperature: 0.3,
max_tokens: 2000,
.slice(0, 5)
```

### После (конфигурируемо):
```typescript
temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
max_tokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
.slice(0, parseInt(process.env.ASSET_FILE_LIMIT || '5'))
```

## 📋 ПРИМЕР .ENV ФАЙЛА

Создайте файл `.env` в корне проекта:

```bash
# =================================================================
# 🔧 EMAIL-MAKERS КОНФИГУРАЦИЯ
# =================================================================

# AI Configuration
AI_MODEL=gpt-4o-mini
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=2000
AI_MAX_FILES=3

# File Limits
ASSET_FILE_LIMIT=5
MAX_IMAGE_SIZE=500000
MAX_TOTAL_SIZE=5000000

# Unsplash API
UNSPLASH_API_KEY=your_unsplash_key_here
UNSPLASH_IMAGES_PER_QUERY=1

# Image Quality
IMAGE_QUALITY=80
COMPRESSION_LEVEL=80

# Email Client Limits
GMAIL_MAX_SIZE=500000
GMAIL_FORMATS=jpg,png
OUTLOOK_MAX_SIZE=400000
OUTLOOK_FORMATS=jpg,png

# Image Validation
MIN_IMAGE_WIDTH=50
MAX_IMAGE_WIDTH=600
MIN_IMAGE_HEIGHT=50
MAX_IMAGE_HEIGHT=400

# Quality Thresholds
MIN_ACCESSIBILITY_SCORE=95
MIN_EMAIL_COMPATIBILITY=90
MIN_OPTIMIZATION_SCORE=80

# API Keys
OPENAI_API_KEY=your_openai_key_here
FIGMA_ACCESS_TOKEN=your_figma_token_here
```

## ✅ РЕЗУЛЬТАТ

🎉 **Все преднастроенные параметры успешно удалены!**

- ✅ AI параметры → конфигурируемые
- ✅ Лимиты файлов → конфигурируемые  
- ✅ Настройки качества → конфигурируемые
- ✅ Пороги валидации → конфигурируемые
- ✅ API ключи → переменные окружения
- ✅ Старый файл с захардкоженными значениями удален

Система теперь полностью гибкая и настраиваемая! 🚀 