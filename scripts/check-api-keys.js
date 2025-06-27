#!/usr/bin/env node

/**
 * Email-Makers API Keys Checker
 * Проверяет настройку и доступность API ключей
 */

const fs = require('fs');
const path = require('path');

console.log('🔑 Email-Makers API Keys Checker\n');

// Загружаем переменные окружения
require('dotenv').config({ path: '.env.local' });

const checks = [
  {
    name: 'OpenAI API Key',
    env: 'OPENAI_API_KEY',
    required: true,
    pattern: /^sk-(proj-)?[a-zA-Z0-9-_]{48,}$/,
    description: 'Основной провайдер ИИ для генерации контента'
  },
  {
    name: 'Anthropic API Key',
    env: 'ANTHROPIC_API_KEY',
    required: false,
    pattern: /^sk-ant-[a-zA-Z0-9-_]{95,}$/,
    description: 'Резервный провайдер ИИ'
  },
  {
    name: 'JWT Secret',
    env: 'JWT_SECRET',
    required: true,
    pattern: /.{32,}/,
    description: 'Секретный ключ для JWT токенов'
  }
];

let hasErrors = false;
let warnings = 0;

console.log('📋 Проверка переменных окружения:\n');

// Проверяем наличие .env.local файла
if (!fs.existsSync('.env.local')) {
  console.log('❌ Файл .env.local не найден');
  console.log('💡 Создайте файл: cp env.example .env.local\n');
  hasErrors = true;
} else {
  console.log('✅ Файл .env.local найден');
}

// Проверяем каждый API ключ
checks.forEach(check => {
  const value = process.env[check.env];
  const status = check.required ? 'ОБЯЗАТЕЛЬНО' : 'ОПЦИОНАЛЬНО';
  
  console.log(`\n🔍 ${check.name} (${status})`);
  console.log(`   Описание: ${check.description}`);
  
  if (!value) {
    if (check.required) {
      console.log(`   ❌ Не настроен - переменная ${check.env} не найдена`);
      hasErrors = true;
    } else {
      console.log(`   ⚠️  Не настроен - функциональность недоступна`);
      warnings++;
    }
  } else if (!check.pattern.test(value)) {
    console.log(`   ❌ Неверный формат ключа`);
    if (check.required) {
      hasErrors = true;
    } else {
      warnings++;
    }
  } else {
    console.log(`   ✅ Настроен корректно`);
  }
});

// Результат проверки
console.log('\n' + '='.repeat(50));
console.log('📊 РЕЗУЛЬТАТ ПРОВЕРКИ:');

if (hasErrors) {
  console.log('❌ Обнаружены критические ошибки в настройке');
  console.log('💡 Исправьте ошибки перед запуском приложения');
  process.exit(1);
} else {
  console.log('✅ Все обязательные настройки корректны');
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} опциональных настроек не заданы`);
  }
  console.log('🚀 Приложение готово к запуску!');
}

console.log('\n📚 Дополнительная информация:');
console.log('   Документация: ./API_KEYS_SETUP.md');
console.log('   Пример конфигурации: ./env.example');
console.log('   Тест API: curl http://localhost:3000/api/health');
