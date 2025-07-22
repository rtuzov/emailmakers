#!/usr/bin/env node

/**
 * Исправление синтаксических ошибок, созданных предыдущим скриптом
 */

const fs = require('fs');
const { execSync } = require('child_process');

class SyntaxErrorFixer {
  constructor() {
    this.fixedFiles = new Set();
  }

  // Получить синтаксические ошибки
  getSyntaxErrors() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      return [];
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorLines = output.split('\n').filter(line => line.includes('error TS1'));
      return errorLines.map(line => this.parseErrorLine(line)).filter(Boolean);
    }
  }

  parseErrorLine(line) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
    if (!match) return null;
    
    return {
      file: match[1],
      line: parseInt(match[2]),
      column: parseInt(match[3]),
      code: match[4],
      message: match[5]
    };
  }

  // Исправить файл с синтаксическими ошибками
  fixSyntaxErrors(filePath, errors) {
    const content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let modified = false;

    // Исправляем проблемные строки
    errors.forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // Исправляем неправильные комментарии переменных
        if (line.includes('// Currently unused =')) {
          // Превращаем "const _var // Currently unused = value;" в "const _var = value; // Currently unused"
          const fixed = line
            .replace(/(\w+)\s+\/\/ Currently unused\s*=/, '$1 =')
            .replace(/;$/, '; // Currently unused');
          lines[lineIndex] = fixed;
          modified = true;
        }
        
        // Исправляем многострочные комментарии
        if (line.includes('const __') && line.includes('// Currently unused')) {
          if (line.includes('= ')) {
            // Это нормальное объявление переменной
            lines[lineIndex] = line.replace('// Currently unused', '/* Currently unused */');
            modified = true;
          } else {
            // Это неправильно разбитая строка
            const varName = line.match(/const (__\w+)/)?.[1];
            if (varName) {
              lines[lineIndex] = `  const ${varName} = null; // Currently unused (was broken)`;
              modified = true;
            }
          }
        }

        // Исправляем проблемы с объявлениями функций
        if (line.includes('): never { // Currently unused') && line.includes('(')) {
          // Находим неправильно обработанную функцию
          const functionMatch = line.match(/(\w+)\([^)]*\): never \{ \/\/ Currently unused/);
          if (functionMatch) {
            const functionName = '_' + functionMatch[1];
            lines[lineIndex] = line.replace(functionMatch[1], functionName);
            modified = true;
          }
        }

        // Исправляем незакрытые выражения
        if ((error.code === 'TS1005' || error.code === 'TS1128') && line.trim() !== '') {
          // Добавляем недостающие закрывающие символы
          if (line.includes('(') && !line.includes(')')) {
            lines[lineIndex] = line + ')';
            modified = true;
          } else if (line.includes('{') && !line.includes('}')) {
            lines[lineIndex] = line + '}';
            modified = true;
          } else if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
            lines[lineIndex] = line + ';';
            modified = true;
          }
        }
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      this.fixedFiles.add(filePath);
      return true;
    }
    return false;
  }

  // Запуск исправления
  async run() {
    console.log('🔧 Fixing syntax errors from previous mass fixing...');
    
    const errors = this.getSyntaxErrors();
    console.log(`📊 Found ${errors.length} syntax errors`);

    if (errors.length === 0) {
      console.log('✅ No syntax errors found!');
      return;
    }

    // Группировка по файлам
    const fileGroups = {};
    errors.forEach(error => {
      if (!fileGroups[error.file]) {
        fileGroups[error.file] = [];
      }
      fileGroups[error.file].push(error);
    });

    console.log(`📁 Processing ${Object.keys(fileGroups).length} files with syntax errors...`);

    // Исправляем файлы
    let fixedFilesCount = 0;
    for (const [filePath, fileErrors] of Object.entries(fileGroups)) {
      try {
        if (this.fixSyntaxErrors(filePath, fileErrors)) {
          fixedFilesCount++;
          console.log(`✅ Fixed syntax in: ${filePath}`);
        }
      } catch (error) {
        console.log(`❌ Error fixing ${filePath}: ${error.message}`);
      }
    }

    console.log(`\n🎯 Syntax fixing completed!`);
    console.log(`📁 Files fixed: ${fixedFilesCount}`);
    
    // Проверяем результат
    const remainingErrors = this.getSyntaxErrors();
    console.log(`📉 Remaining syntax errors: ${remainingErrors.length}`);
    
    if (remainingErrors.length > 0) {
      console.log('\n⚠️ Some syntax errors remain. Running TypeScript check...');
      try {
        execSync('npm run type-check | head -10', { stdio: 'inherit' });
      } catch (e) {
        // Expected to fail, we just want to see the output
      }
    }
  }
}

// Запуск скрипта
if (require.main === module) {
  const fixer = new SyntaxErrorFixer();
  fixer.run().catch(console.error);
}

module.exports = SyntaxErrorFixer;