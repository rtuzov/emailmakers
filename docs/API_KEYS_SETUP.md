# 🔑 Email-Makers API Keys Setup Guide

Полная инструкция по настройке API ключей для платформы Email-Makers.

## 📋 Обзор

Email-Makers использует несколько внешних сервисов для генерации и обработки email-шаблонов:

- **OpenAI GPT-4o mini** - Основной провайдер ИИ для генерации контента
- **Anthropic Claude** - Резервный провайдер ИИ
- **Figma API** - Извлечение дизайн-токенов и компонентов
- **Litmus API** - Тестирование совместимости email-клиентов

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
```

---

## 🚀 Быстрый старт

### Минимальная настройка (5 минут):

1. **Получите OpenAI API ключ** (обязательно)
2. **Скопируйте env.example в .env.local**
3. **Добавьте OPENAI_API_KEY**
4. **Запустите приложение**

```bash
# Быстрая настройка
cp env.example .env.local
echo "OPENAI_API_KEY=sk-your-key-here" >> .env.local
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
npm run dev
```

---

## 🧪 Тестирование API

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

**Статус документации:** Обновлено 27.01.2025
