#!/usr/bin/env node

/**
 * Массовое исправление TypeScript ошибок
 * Скрипт обрабатывает наиболее частые типы ошибок автоматически
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptErrorFixer {
  constructor() {
    this.fixedFiles = new Set();
    this.errorCounts = {
      'TS6133': 0, // Unused variables
      'TS6138': 0, // Unused properties
      'TS2532': 0, // Possibly undefined
      'TS18048': 0, // Possibly undefined
      'TS2345': 0, // Type mismatch
      'TS2322': 0, // Type assignment
      'TS18046': 0, // Unknown error type
      'TS2375': 0, // exactOptionalPropertyTypes
      'TS2379': 0, // Argument type mismatch
      'others': 0
    };
  }

  // Получить все TypeScript ошибки
  getErrors() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      return [];
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorLines = output.split('\n').filter(line => line.includes('error TS'));
      return errorLines.map(line => this.parseErrorLine(line)).filter(Boolean);
    }
  }

  // Парсинг строки ошибки
  parseErrorLine(line) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
    if (!match) return null;
    
    return {
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      code: match[4],
      message: match[5],
      fullLine: line
    };
  }

  // Читать файл
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.warn(`Cannot read file ${filePath}:`, error.message);
      return null;
    }
  }

  // Записать файл
  writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      this.fixedFiles.add(filePath);
      return true;
    } catch (error) {
      console.warn(`Cannot write file ${filePath}:`, error.message);
      return false;
    }
  }

  // Исправить неиспользуемые переменные/импорты
  fixUnusedVariables(filePath, errors) {
    const content = this.readFile(filePath);
    if (!content) return false;

    let lines = content.split('\n');
    let modified = false;

    errors.forEach(error => {
      if (error.code === 'TS6133' || error.code === 'TS6138') {
        const lineIndex = error.line - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          
          // Исправления для параметров функций
          const paramMatch = line.match(/(\w+):\s*[^,)]+/);
          if (paramMatch && error.message.includes(paramMatch[1])) {
            lines[lineIndex] = line.replace(paramMatch[1], '_' + paramMatch[1]);
            modified = true;
            this.errorCounts['TS6133']++;
          }
          
          // Исправления для переменных
          const varMatch = line.match(/(const|let|var)\s+(\w+)/);
          if (varMatch && error.message.includes(varMatch[2])) {
            lines[lineIndex] = line.replace(varMatch[2], '_' + varMatch[2] + ' // Currently unused');
            modified = true;
            this.errorCounts['TS6133']++;
          }
        }
      }
    });

    if (modified) {
      return this.writeFile(filePath, lines.join('\n'));
    }
    return false;
  }

  // Исправить possibly undefined ошибки
  fixPossiblyUndefined(filePath, errors) {
    const content = this.readFile(filePath);
    if (!content) return false;

    let updatedContent = content;
    let modified = false;

    errors.forEach(error => {
      if (error.code === 'TS2532' || error.code === 'TS18048') {
        // Найти паттерны для исправления
        const patterns = [
          // object.property -> (object || {}).property
          /(\w+)\.(\w+)/g,
          // array[index] -> (array || [])[index]  
          /(\w+)\[(\d+)\]/g,
          // match[1] -> (match && match[1] ? match[1] : '')
          /(match|result)\[(\d+)\]/g
        ];

        patterns.forEach(pattern => {
          const matches = [...updatedContent.matchAll(pattern)];
          matches.forEach(match => {
            if (error.message.includes(match[1])) {
              if (pattern.toString().includes('match')) {
                updatedContent = updatedContent.replace(
                  match[0], 
                  `(${match[1]} && ${match[1]}[${match[2]}] ? ${match[1]}[${match[2]}] : '')`
                );
              } else if (pattern.toString().includes('\\[')) {
                updatedContent = updatedContent.replace(
                  match[0],
                  `(${match[1]} || [])[${match[2]}]`
                );
              } else {
                updatedContent = updatedContent.replace(
                  match[0],
                  `(${match[1]} || {}).${match[2]}`
                );
              }
              modified = true;
              this.errorCounts['TS2532']++;
            }
          });
        });
      }
    });

    if (modified && updatedContent !== content) {
      return this.writeFile(filePath, updatedContent);
    }
    return false;
  }

  // Исправить unknown error type
  fixUnknownErrorType(filePath, errors) {
    const content = this.readFile(filePath);
    if (!content) return false;

    let updatedContent = content;
    let modified = false;

    errors.forEach(error => {
      if (error.code === 'TS18046' && error.message.includes("'error' is of type 'unknown'")) {
        // error -> error instanceof Error ? error.message : String(error)
        updatedContent = updatedContent.replace(
          /error\.message/g,
          'error instanceof Error ? error.message : String(error)'
        );
        // throw new Error(`... ${error}`) -> throw new Error(`... ${String(error)}`)
        updatedContent = updatedContent.replace(
          /\$\{error\}/g,
          '${error instanceof Error ? error.message : String(error)}'
        );
        modified = true;
        this.errorCounts['TS18046']++;
      }
    });

    if (modified && updatedContent !== content) {
      return this.writeFile(filePath, updatedContent);
    }
    return false;
  }

  // Исправить exactOptionalPropertyTypes ошибки  
  fixExactOptionalProperties(filePath, errors) {
    const content = this.readFile(filePath);
    if (!content) return false;

    let updatedContent = content;
    let modified = false;

    errors.forEach(error => {
      if (error.code === 'TS2375' || error.code === 'TS2379') {
        // Найти объекты с потенциально undefined свойствами
        const objectPatterns = [
          // property: value || undefined -> ...(value ? { property: value } : {})
          /(\w+):\s*([^,}]+\s*\|\|\s*undefined)/g,
          // traceId: config.traceId -> ...(config.traceId ? { traceId: config.traceId } : {})
          /traceId:\s*(\w+\.\w+)/g,
          // result: someValue -> ...(someValue ? { result: someValue } : {})
          /result:\s*([^,}]+)/g
        ];

        objectPatterns.forEach(pattern => {
          const matches = [...updatedContent.matchAll(pattern)];
          matches.forEach(match => {
            if (match[1] && match[2]) {
              const replacement = `...(${match[2].replace(' || undefined', '')} ? { ${match[1]}: ${match[2].replace(' || undefined', '')} } : {})`;
              updatedContent = updatedContent.replace(match[0], replacement);
              modified = true;
              this.errorCounts['TS2375']++;
            }
          });
        });
      }
    });

    if (modified && updatedContent !== content) {
      return this.writeFile(filePath, updatedContent);
    }
    return false;
  }

  // Основной метод исправления
  fixFile(filePath, errors) {
    const fileErrors = errors.filter(e => e.file === filePath);
    if (fileErrors.length === 0) return false;

    let hasChanges = false;

    // Применяем исправления в порядке приоритета
    hasChanges |= this.fixUnusedVariables(filePath, fileErrors);
    hasChanges |= this.fixUnknownErrorType(filePath, fileErrors);  
    hasChanges |= this.fixPossiblyUndefined(filePath, fileErrors);
    hasChanges |= this.fixExactOptionalProperties(filePath, fileErrors);

    return hasChanges;
  }

  // Запуск массового исправления
  async run() {
    console.log('🚀 Starting TypeScript error mass fixing...');
    
    const errors = this.getErrors();
    console.log(`📊 Found ${errors.length} TypeScript errors`);

    if (errors.length === 0) {
      console.log('✅ No TypeScript errors found!');
      return;
    }

    // Группировка ошибок по файлам
    const fileGroups = {};
    errors.forEach(error => {
      if (!fileGroups[error.file]) {
        fileGroups[error.file] = [];
      }
      fileGroups[error.file].push(error);
    });

    console.log(`📁 Processing ${Object.keys(fileGroups).length} files...`);

    // Исправляем файлы
    let processedFiles = 0;
    for (const [filePath, fileErrors] of Object.entries(fileGroups)) {
      if (this.fixFile(filePath, fileErrors)) {
        processedFiles++;
        console.log(`✅ Fixed: ${filePath} (${fileErrors.length} errors)`);
      }
    }

    // Финальная статистика
    console.log('\n📈 Mass fixing completed!');
    console.log(`📁 Files processed: ${processedFiles}`);
    console.log('🔧 Fixes applied:');
    Object.entries(this.errorCounts).forEach(([code, count]) => {
      if (count > 0) {
        console.log(`   ${code}: ${count} fixes`);
      }
    });

    // Проверяем результат
    const remainingErrors = this.getErrors();
    const fixed = errors.length - remainingErrors.length;
    console.log(`\n🎯 Progress: ${fixed}/${errors.length} errors fixed (${((fixed/errors.length)*100).toFixed(1)}%)`);
    console.log(`📉 Remaining errors: ${remainingErrors.length}`);
  }
}

// Запуск скрипта
if (require.main === module) {
  const fixer = new TypeScriptErrorFixer();
  fixer.run().catch(console.error);
}

module.exports = TypeScriptErrorFixer;