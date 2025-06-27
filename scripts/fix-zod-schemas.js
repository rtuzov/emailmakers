#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to fix Zod schema issues: .optional().describe() without .nullable()
 * 
 * OpenAI Agents SDK требует, чтобы все optional поля также были nullable.
 * Этот скрипт находит и исправляет все такие случаи.
 */

console.log('🔧 Fixing Zod schema issues: .optional().describe() → .optional().nullable().describe()');

// Находим все TypeScript файлы с потенциальными проблемами
const findFiles = () => {
  try {
    const output = execSync('find src -name "*.ts" -type f', { encoding: 'utf8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
};

// Исправляем файл
const fixFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    
    // Паттерны для исправления
    const patterns = [
      // Основной паттерн: .optional().describe(
      {
        regex: /\.optional\(\)\.describe\(/g,
        replacement: '.optional().nullable().describe(',
        description: '.optional().describe() → .optional().nullable().describe()'
      },
      // Объекты: }).optional().describe(
      {
        regex: /\}\)\.optional\(\)\.describe\(/g,
        replacement: '}).optional().nullable().describe(',
        description: '}).optional().describe() → }).optional().nullable().describe()'
      },
      // Массивы: ])).optional().describe(
      {
        regex: /\]\)\)\.optional\(\)\.describe\(/g,
        replacement: '])).optional().nullable().describe(',
        description: '])).optional().describe() → ])).optional().nullable().describe()'
      },
      // Случаи без .describe(): .optional(),
      {
        regex: /\.optional\(\),/g,
        replacement: '.optional().nullable(),',
        description: '.optional(), → .optional().nullable(),'
      },
      // Случаи без .describe() в конце строки: .optional()
      {
        regex: /\.optional\(\)$/gm,
        replacement: '.optional().nullable()',
        description: '.optional() → .optional().nullable()'
      }
    ];
    
    let newContent = content;
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        console.log(`  📝 Fixing ${matches.length} instances of ${pattern.description} in ${filePath}`);
        newContent = newContent.replace(pattern.regex, pattern.replacement);
        fixed = true;
      }
    });
    
    if (fixed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✅ Fixed ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  ❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
};

// Основная функция
const main = () => {
  const files = findFiles();
  console.log(`🔍 Found ${files.length} TypeScript files to check`);
  
  let fixedFiles = 0;
  let totalFixes = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Проверяем, есть ли потенциальные проблемы
    if (content.includes('.optional().describe(')) {
      console.log(`\n🔧 Processing ${file}...`);
      
      if (fixFile(file)) {
        fixedFiles++;
        
        // Подсчитываем количество исправлений
        const newContent = fs.readFileSync(file, 'utf8');
        const oldMatches = content.match(/\.optional\(\)\.describe\(/g) || [];
        const newMatches = newContent.match(/\.optional\(\)\.nullable\(\)\.describe\(/g) || [];
        totalFixes += newMatches.length;
      }
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  📁 Files processed: ${files.length}`);
  console.log(`  🔧 Files fixed: ${fixedFiles}`);
  console.log(`  ✨ Total fixes applied: ${totalFixes}`);
  
  if (fixedFiles > 0) {
    console.log(`\n✅ All Zod schema issues have been fixed!`);
    console.log(`💡 The OpenAI Agents SDK now requires all optional fields to also be nullable.`);
  } else {
    console.log(`\n✅ No Zod schema issues found!`);
  }
};

// Запускаем скрипт
main(); 