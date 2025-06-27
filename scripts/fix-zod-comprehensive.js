#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Zod Schema Fixer
 * 
 * Исправляет все проблемы с OpenAI Agents SDK:
 * - .optional() без .nullable()
 * - Вложенные объекты и массивы
 * - Сложные структуры anyOf/oneOf
 */

console.log('🔧 Comprehensive Zod Schema Fixer - исправляем ВСЕ проблемы OpenAI Agents SDK');

// Находим все TypeScript файлы
const findFiles = () => {
  try {
    const output = execSync('find src -name "*.ts" -type f', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
};

// Комплексное исправление файла
const fixFileComprehensively = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let totalFixes = 0;
    
    // Паттерны для исправления (в порядке приоритета)
    const patterns = [
      // 1. Простые случаи: .optional().describe(
      {
        regex: /\.optional\(\)\.describe\(/g,
        replacement: '.optional().nullable().describe(',
        description: '.optional().describe() → .optional().nullable().describe()'
      },
      
      // 2. Объекты: }).optional().describe(
      {
        regex: /\}\)\.optional\(\)\.describe\(/g,
        replacement: '}).optional().nullable().describe(',
        description: '}).optional().describe() → }).optional().nullable().describe()'
      },
      
      // 3. Массивы: ])).optional().describe(
      {
        regex: /\]\)\)\.optional\(\)\.describe\(/g,
        replacement: '])).optional().nullable().describe(',
        description: '])).optional().describe() → ])).optional().nullable().describe()'
      },
      
      // 4. Enum в конце строки: .optional().describe(
      {
        regex: /\]\)\.optional\(\)\.describe\(/g,
        replacement: ']).optional().nullable().describe(',
        description: ']).optional().describe() → ]).optional().nullable().describe()'
      },
      
      // 5. Случаи без .describe(): .optional(),
      {
        regex: /\.optional\(\),/g,
        replacement: '.optional().nullable(),',
        description: '.optional(), → .optional().nullable(),'
      },
      
      // 6. Случаи в конце строки: .optional()
      {
        regex: /\.optional\(\)$/gm,
        replacement: '.optional().nullable()',
        description: '.optional() → .optional().nullable()'
      },
      
      // 7. Случаи перед закрывающей скобкой: .optional()
      {
        regex: /\.optional\(\)(\s*\})/g,
        replacement: '.optional().nullable()$1',
        description: '.optional() перед } → .optional().nullable()'
      },
      
      // 8. Enum массивы: ['value']).optional()
      {
        regex: /\]\)\.optional\(\)([,\s])/g,
        replacement: ']).optional().nullable()$1',
        description: ']).optional() → ]).optional().nullable()'
      }
    ];
    
    // Применяем каждый паттерн
    patterns.forEach(pattern => {
      const matches = newContent.match(pattern.regex);
      if (matches) {
        console.log(`  📝 ${filePath}: ${matches.length} × ${pattern.description}`);
        newContent = newContent.replace(pattern.regex, pattern.replacement);
        totalFixes += matches.length;
      }
    });
    
    // Дополнительная проверка на дублированные .nullable()
    const duplicateNullable = /\.optional\(\)\.nullable\(\)\.nullable\(\)/g;
    const duplicateMatches = newContent.match(duplicateNullable);
    if (duplicateMatches) {
      console.log(`  🔧 ${filePath}: Исправляем ${duplicateMatches.length} дублированных .nullable()`);
      newContent = newContent.replace(duplicateNullable, '.optional().nullable()');
    }
    
    if (totalFixes > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return totalFixes;
    }
    
    return 0;
  } catch (error) {
    console.error(`  ❌ Error fixing ${filePath}:`, error.message);
    return 0;
  }
};

// Проверяем, есть ли еще проблемы
const checkForRemainingIssues = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ищем все .optional() без .nullable()
    const problematicPatterns = [
      /\.optional\(\)\.describe\(/g,
      /\.optional\(\),/g,
      /\.optional\(\)$/gm,
      /\.optional\(\)\s*\}/g
    ];
    
    let issues = [];
    problematicPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          pattern: index,
          count: matches.length,
          matches: matches.slice(0, 3) // Показываем первые 3 примера
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
};

// Основная функция
const main = () => {
  const files = findFiles();
  console.log(`🔍 Найдено ${files.length} TypeScript файлов для проверки\n`);
  
  let fixedFiles = 0;
  let totalFixes = 0;
  let remainingIssues = 0;
  
  // Первый проход - исправляем все файлы
  console.log('📋 ПЕРВЫЙ ПРОХОД: Исправление всех файлов\n');
  files.forEach(file => {
    const fixes = fixFileComprehensively(file);
    if (fixes > 0) {
      fixedFiles++;
      totalFixes += fixes;
    }
  });
  
  console.log(`\n✅ Первый проход завершен: ${fixedFiles} файлов исправлено, ${totalFixes} исправлений\n`);
  
  // Второй проход - проверяем оставшиеся проблемы
  console.log('🔍 ВТОРОЙ ПРОХОД: Проверка оставшихся проблем\n');
  files.forEach(file => {
    const issues = checkForRemainingIssues(file);
    if (issues.length > 0) {
      console.log(`⚠️  ${file}:`);
      issues.forEach(issue => {
        console.log(`    - Паттерн ${issue.pattern}: ${issue.count} проблем`);
        issue.matches.forEach(match => {
          console.log(`      "${match}"`);
        });
      });
      remainingIssues += issues.reduce((sum, issue) => sum + issue.count, 0);
    }
  });
  
  // Третий проход - если есть оставшиеся проблемы, делаем еще один раунд исправлений
  if (remainingIssues > 0) {
    console.log(`\n🔄 ТРЕТИЙ ПРОХОД: Исправление оставшихся ${remainingIssues} проблем\n`);
    
    files.forEach(file => {
      const fixes = fixFileComprehensively(file);
      if (fixes > 0) {
        totalFixes += fixes;
        console.log(`  ✅ ${file}: дополнительно исправлено ${fixes} проблем`);
      }
    });
  }
  
  // Финальная статистика
  console.log(`\n📊 ФИНАЛЬНАЯ СТАТИСТИКА:`);
  console.log(`  📁 Файлов обработано: ${files.length}`);
  console.log(`  🔧 Файлов исправлено: ${fixedFiles}`);
  console.log(`  ✨ Всего исправлений: ${totalFixes}`);
  
  // Финальная проверка
  let finalIssues = 0;
  files.forEach(file => {
    const issues = checkForRemainingIssues(file);
    finalIssues += issues.reduce((sum, issue) => sum + issue.count, 0);
  });
  
  if (finalIssues === 0) {
    console.log(`\n🎉 ВСЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ! OpenAI Agents SDK теперь должен работать корректно.`);
  } else {
    console.log(`\n⚠️  Осталось ${finalIssues} проблем. Возможно, требуется ручное исправление.`);
  }
};

// Запускаем скрипт
main(); 