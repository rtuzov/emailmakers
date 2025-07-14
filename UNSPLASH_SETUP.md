# 🚨 ОБЯЗАТЕЛЬНАЯ настройка Unsplash API

## ⚠️ КРИТИЧЕСКАЯ ПРОБЛЕМА
Система **НЕ БУДЕТ РАБОТАТЬ** без настройки Unsplash API ключа!

Согласно FALLBACK POLICY проекта:
- ❌ **СТРОГО ЗАПРЕЩЕНО**: Никакой fallback логики
- ❌ **СТРОГО ЗАПРЕЩЕНО**: Демо/моковые данные
- ✅ **ОБЯЗАТЕЛЬНО**: Система должна падать с ошибкой, если API недоступен

## 🔧 Обязательная настройка

### 1. Создание аккаунта разработчика Unsplash

1. **Регистрация**: [https://unsplash.com/join](https://unsplash.com/join)
2. **Переход к API**: Menu → Product → Developers/API
3. **Создание приложения**: Your Apps → New Application
4. **Согласие с условиями**: Обязательно согласитесь с API Guidelines
5. **Заполнение данных**: Название и описание приложения
6. **Получение ключа**: Скопируйте **Access Key** из раздела 🔑 **Keys**

### 2. Настройка переменных окружения

**Обязательно** добавьте в файл `.env.local`:
```env
# Unsplash API Configuration (REQUIRED)
UNSPLASH_ACCESS_KEY=your_actual_unsplash_access_key_here
```

### 3. Проверка настройки

После настройки API ключа система будет:
- ✅ Использовать **только** настоящие изображения из Unsplash API
- ✅ Подбирать изображения по поисковым запросам
- ✅ Обеспечивать разнообразие изображений
- ✅ Падать с ошибкой, если API недоступен (как и должно быть)

### 4. Что происходит БЕЗ API ключа

```
❌ UNSPLASH_ACCESS_KEY not configured. Please set up your Unsplash API key in environment variables. See UNSPLASH_SETUP.md for instructions.
```

Система **полностью остановится** - это правильное поведение!

## 📊 Ограничения API

- **Demo режим**: 50 запросов в час
- **Production режим**: 5000 запросов в час (требует одобрения)

## 🚀 Переход в Production

Для получения production доступа (5000 запросов/час):
1. Загрузите скриншоты приложения
2. Убедитесь в правильной атрибуции фотографов
3. Соблюдайте API Guidelines
4. Нажмите "Request Approval" в панели приложения

## 🔗 Полезные ссылки

- [Unsplash API Documentation](https://unsplash.com/documentation)
- [API Guidelines](https://unsplash.com/api-terms)
- [Developer Dashboard](https://unsplash.com/oauth/applications)

## 🛠️ Требования к атрибуции

Каждое изображение должно содержать:
- Имя фотографа
- Ссылку на профиль фотографа
- Упоминание Unsplash
- Ссылку на Unsplash

**Пример**: "Photo by [Photographer Name](link) on [Unsplash](https://unsplash.com)"

## 🔄 Исправленные проблемы

### ❌ Старое поведение (с fallback):
```
⚠️ UNSPLASH_ACCESS_KEY not configured, using demo images
📸 Processing image 3: EXTERNAL - https://images.unsplash.com/photo-1506905925346-21bda4d32df4
📸 Processing image 4: EXTERNAL - https://images.unsplash.com/photo-1506905925346-21bda4d32df4
📸 Processing image 5: EXTERNAL - https://images.unsplash.com/photo-1506905925346-21bda4d32df4
```

### ✅ Новое поведение (только реальный API):
```
🔍 Unsplash API returned 5 results for "autumn beach Thailand"
📸 Processing image 3: EXTERNAL - https://images.unsplash.com/photo-xxx/real-image-1
📸 Processing image 4: EXTERNAL - https://images.unsplash.com/photo-yyy/real-image-2
📸 Processing image 5: EXTERNAL - https://images.unsplash.com/photo-zzz/real-image-3
```

## ⚡ Быстрый старт

1. Получите API ключ: https://unsplash.com/oauth/applications
2. Добавьте в `.env.local`: `UNSPLASH_ACCESS_KEY=your_key_here`
3. Перезапустите приложение
4. Готово! Теперь система использует только реальные изображения 