# 🔑 Email-Makers API Keys Setup Guide

Полная инструкция по настройке API ключей для платформы Email-Makers.

## 📋 Обзор

Email-Makers использует несколько внешних сервисов для генерации и обработки email-шаблонов:

- **OpenAI GPT-4o mini** - Основной провайдер ИИ для генерации контента
- **Anthropic Claude** - Резервный провайдер ИИ
- **Figma API** - Извлечение дизайн-токенов и компонентов
- **Litmus API** - Тестирование совместимости email-клиентов
- **Дополнительные сервисы** - Мониторинг, хранение, кеширование

---

## 🚨 Критически важные API ключи

### 1. OpenAI API (ОБЯЗАТЕЛЬНО)

**Назначение:** Основной движок для генерации email-контента и шаблонов.

**Получение ключа:**
1. Перейдите на [OpenAI Platform](https://platform.openai.com/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Перейдите в раздел "API Keys"
4. Нажмите "Create new secret key"
5. Скопируйте ключ (начинается с `sk-`)

**Настройка:**
```bash
# В файле .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
```

**Рекомендации:**
- Используйте модель `gpt-4o-mini` для лучшего качества
- Установите лимиты использования в OpenAI Dashboard
- Мониторьте расходы в разделе "Usage"

### 2. Anthropic Claude API (РЕКОМЕНДУЕТСЯ)

**Назначение:** Резервный провайдер ИИ, активируется при недоступности OpenAI.

**Получение ключа:**
1. Перейдите на [Anthropic Console](https://console.anthropic.com/)
2. Создайте аккаунт или войдите
3. Перейдите в "API Keys"
4. Создайте новый ключ
5. Скопируйте ключ (начинается с `sk-ant-`)

**Настройка:**
```bash
# В файле .env.local
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
ANTHROPIC_TEMPERATURE=0.7
```

---

## 🎨 Дизайн и интеграции

### 3. Figma API (ОПЦИОНАЛЬНО)

**Назначение:** Извлечение дизайн-токенов, цветов, шрифтов и компонентов из Figma проектов.

**Получение токена:**
1. Войдите в [Figma](https://figma.com/)
2. Перейдите в Settings → Account
3. Найдите раздел "Personal access tokens"
4. Нажмите "Generate new token"
5. Скопируйте токен (начинается с `figd_`)

**Настройка:**
```bash
# В файле .env.local
FIGMA_ACCESS_TOKEN=figd_your-figma-personal-access-token-here
FIGMA_TEAM_ID=your-figma-team-id
FIGMA_PROJECT_ID=your-figma-project-id
```

**Получение Team ID и Project ID:**
- Team ID: URL вида `https://www.figma.com/files/team/123456789/Team-Name`
- Project ID: URL вида `https://www.figma.com/file/ABC123DEF456/Project-Name`

---

## 🧪 Тестирование и валидация

### 4. Litmus API (ОПЦИОНАЛЬНО)

**Назначение:** Тестирование email-шаблонов в различных почтовых клиентах.

**Получение ключа:**
1. Зарегистрируйтесь на [Litmus](https://litmus.com/)
2. Выберите план с API доступом
3. Перейдите в Account Settings → API
4. Скопируйте API ключ

**Настройка:**
```bash
# В файле .env.local
LITMUS_API_KEY=your-litmus-api-key-here
LITMUS_API_URL=https://api.litmus.com/v1
```

---

## 🗄️ Хранение и инфраструктура

### 5. AWS S3 (ОПЦИОНАЛЬНО)

**Назначение:** Хранение сгенерированных шаблонов и ресурсов.

**Настройка:**
```bash
# В файле .env.local
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=email-makers-templates
```

### 6. Redis (ОПЦИОНАЛЬНО)

**Назначение:** Кеширование результатов и сессий.

**Настройка:**
```bash
# В файле .env.local
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

---

## 📊 Мониторинг и аналитика

### 7. Sentry (ОПЦИОНАЛЬНО)

**Назначение:** Отслеживание ошибок и производительности.

**Получение DSN:**
1. Зарегистрируйтесь на [Sentry](https://sentry.io/)
2. Создайте новый проект
3. Скопируйте DSN из настроек проекта

**Настройка:**
```bash
# В файле .env.local
SENTRY_DSN=your-sentry-dsn-here
SENTRY_ENVIRONMENT=development
```

---

## 🛠️ Пошаговая настройка

### Шаг 1: Создание файла окружения

```bash
# Скопируйте пример файла
cp env.example .env.local

# Откройте файл для редактирования
nano .env.local  # или используйте ваш любимый редактор
```

### Шаг 2: Настройка обязательных ключей

**Минимальная конфигурация для работы:**

```bash
# Обязательные настройки
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/email_makers_db

# Критически важно для генерации шаблонов
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Безопасность
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-minimum
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Шаг 3: Проверка конфигурации

```bash
# Запустите проверку конфигурации
npm run config:check

# Или проверьте API endpoint
curl http://localhost:3000/api/health
```

### Шаг 4: Тестирование API

```bash
# Тест генерации шаблона
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Create a welcome email for new users",
    "type": "text",
    "title": "Welcome Email",
    "options": {
      "campaignType": "welcome",
      "tone": "friendly"
    }
  }'
```

---

## 🔒 Безопасность

### Рекомендации по безопасности:

1. **Никогда не коммитьте .env.local в Git**
2. **Используйте разные ключи для разработки и продакшена**
3. **Регулярно ротируйте API ключи**
4. **Устанавливайте лимиты использования**
5. **Мониторьте использование API**

### Переменные для продакшена:

```bash
# Продакшен настройки
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_SSL=true
DEBUG=false
LOG_LEVEL=warn

# Используйте более строгие настройки безопасности
RATE_LIMIT_MAX_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
```

---

## 💰 Стоимость использования

### OpenAI GPT-4o mini:
- **Input:** ~$5.00 / 1M токенов
- **Output:** ~$15.00 / 1M токенов
- **Средняя стоимость одного шаблона:** $0.01-0.05

### Anthropic Claude:
- **Input:** ~$3.00 / 1M токенов  
- **Output:** ~$15.00 / 1M токенов
- **Средняя стоимость одного шаблона:** $0.008-0.04

### Рекомендации по оптимизации затрат:
1. Настройте кеширование результатов
2. Используйте более дешевые модели для простых задач
3. Оптимизируйте промпты для сокращения токенов
4. Установите месячные лимиты

---

## 🚀 Быстрый старт

### Минимальная настройка (5 минут):

1. **Получите OpenAI API ключ** (обязательно)
2. **Скопируйте env.example в .env.local**
3. **Добавьте OPENAI_API_KEY**
4. **Установите JWT_SECRET и NEXTAUTH_SECRET**
5. **Запустите приложение**

```bash
# Быстрая настройка
cp env.example .env.local
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
npm run dev
```

---

## 🆘 Решение проблем

### Частые ошибки:

**"OpenAI API key not found"**
- Проверьте правильность ключа
- Убедитесь, что файл .env.local в корне проекта
- Перезапустите сервер разработки

**"Invalid API key format"**
- OpenAI ключи начинаются с `sk-`
- Anthropic ключи начинаются с `sk-ant-`
- Figma токены начинаются с `figd_`

**"Rate limit exceeded"**
- Проверьте лимиты в панели провайдера
- Настройте кеширование
- Используйте fallback провайдера

### Логи и диагностика:

```bash
# Включите детальные логи
DEBUG=true
LOG_LEVEL=debug

# Проверьте статус API
curl http://localhost:3000/api/health

# Просмотрите логи
tail -f logs/application.log
```

---

## 📞 Поддержка

Если у вас возникли проблемы с настройкой:

1. Проверьте [документацию API](./API_ENDPOINTS.md)
2. Изучите [примеры использования](./examples/)
3. Создайте issue в репозитории проекта

---

**Статус документации:** Обновлено 27.01.2025  
**Версия API:** v1.0.0 