/**
 * 🧪 VITEST CONFIGURATION
 * 
 * Конфигурация для жестких тестов системы валидации
 * Zero tolerance принцип: все тесты должны проходить без исключений
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Строгий режим тестирования
    globals: true,
    environment: 'node',
    
    // Покрытие кода - минимум 80%
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      include: [
        'src/agent/validators/**/*.ts',
        'src/agent/specialists/**/*.ts',
        'src/agent/types/**/*.ts'
      ],
      exclude: [
        'src/agent/tests/**',
        'src/agent/tools/**', // Инструменты не тестируем в этой фазе
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**'
      ]
    },
    
    // Таймауты для zero tolerance
    testTimeout: 30000, // 30 секунд максимум на тест
    hookTimeout: 10000, // 10 секунд на setup/teardown
    
    // Строгий режим выполнения
    bail: 0, // Не останавливаться на первой ошибке, показать все
    retry: 0, // Без повторных попыток - тест должен работать с первого раза
    
    // Параллельность для производительности
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2
      }
    },
    
    // Фильтры для фокусировки на валидации
    include: [
      'src/agent/tests/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts'
    ],
    
    // Репортеры для детального анализа
    reporters: ['verbose', 'html', 'json'],
    outputFile: {
      html: './test-results/index.html',
      json: './test-results/results.json'
    },
    
    // Настройки для изоляции тестов
    isolate: true,
    
    // Mock настройки
    setupFiles: ['./src/agent/tests/setup.ts'],
    
    // Дополнительные проверки
    typecheck: {
      enabled: true,
      only: false
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/agent': path.resolve(__dirname, './src/agent'),
      '@/shared': path.resolve(__dirname, './src/shared')
    }
  },
  
  // Определения для TypeScript
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});