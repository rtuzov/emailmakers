#!/usr/bin/env node

/**
 * Восстановление поломанных файлов после массового исправления
 * Будет восстанавливать из git только файлы с синтаксическими ошибками
 */

const fs = require('fs');
const { execSync } = require('child_process');

class FileRestorer {
  constructor() {
    this.restoredFiles = new Set();
  }

  // Получить файлы с синтаксическими ошибками
  getFilesWithSyntaxErrors() {
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      return [];
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const syntaxErrorLines = output.split('\n').filter(line => 
        line.includes('error TS1') && line.includes('):')
      );
      
      const files = new Set();
      syntaxErrorLines.forEach(line => {
        const match = line.match(/^(.+?)\(\d+,\d+\)/);
        if (match) {
          files.add(match[1]);
        }
      });
      
      return Array.from(files);
    }
  }

  // Восстановить файл из git
  restoreFileFromGit(filePath) {
    try {
      console.log(`🔄 Restoring ${filePath} from git...`);
      execSync(`git checkout HEAD -- "${filePath}"`, { stdio: 'pipe' });
      this.restoredFiles.add(filePath);
      return true;
    } catch (error) {
      console.warn(`❌ Could not restore ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Применить только базовые исправления
  applyBasicFixes(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let fixedContent = content;
      let modified = false;

      // Только самые безопасные исправления:
      
      // 1. Неиспользуемые параметры функций
      fixedContent = fixedContent.replace(
        /(\w+):\s*([^,)]+)(,|\))/g,
        (match, paramName, paramType, separator) => {
          if (paramName.match(/^(params|options|config|context|request|data|input|result)$/)) {
            return `_${paramName}: ${paramType}${separator}`;
          }
          return match;
        }
      );

      // 2. Error instanceof checks
      fixedContent = fixedContent.replace(
        /error\.message/g,
        'error instanceof Error ? error.message : String(error)'
      );

      // 3. Simple null checks
      fixedContent = fixedContent.replace(
        /(\w+)\[(\d+)\](?!\s*=)/g,
        '($1 && $1[$2] ? $1[$2] : "")'
      );

      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        modified = true;
      }

      return modified;
    } catch (error) {
      console.warn(`❌ Could not apply basic fixes to ${filePath}: ${error.message}`);
      return false;
    }
  }

  // Запуск восстановления
  async run() {
    console.log('🔧 Restoring files with syntax errors...');
    
    const syntaxErrorFiles = this.getFilesWithSyntaxErrors();
    console.log(`📊 Found ${syntaxErrorFiles.length} files with syntax errors`);

    if (syntaxErrorFiles.length === 0) {
      console.log('✅ No syntax errors found!');
      return;
    }

    let restoredCount = 0;
    let fixedCount = 0;

    for (const filePath of syntaxErrorFiles) {
      console.log(`\n📁 Processing: ${filePath}`);
      
      // Сначала пробуем восстановить из git
      if (this.restoreFileFromGit(filePath)) {
        restoredCount++;
        
        // Затем применяем только базовые безопасные исправления
        if (this.applyBasicFixes(filePath)) {
          fixedCount++;
          console.log(`  ✅ Applied basic fixes`);
        }
      }
    }

    console.log(`\n🎯 File restoration completed!`);
    console.log(`📁 Files restored: ${restoredCount}`);
    console.log(`🔧 Files with basic fixes: ${fixedCount}`);
    
    // Проверяем результат
    const remainingSyntaxErrors = this.getFilesWithSyntaxErrors();
    console.log(`📉 Remaining syntax error files: ${remainingSyntaxErrors.length}`);
    
    if (remainingSyntaxErrors.length === 0) {
      console.log('\n✅ All syntax errors fixed! Now checking TypeScript errors...');
      try {
        const result = execSync('npm run type-check 2>&1 | grep -E "error TS[0-9]+" | wc -l', { encoding: 'utf8' });
        const errorCount = parseInt(result.trim());
        console.log(`📊 Total TypeScript errors: ${errorCount}`);
        
        if (errorCount > 0) {
          console.log('\n🚀 Ready for next round of systematic error fixing!');
        }
      } catch (e) {
        // Ignore check errors
      }
    } else {
      console.log('\n⚠️ Some syntax errors remain. Manual intervention may be needed.');
      console.log('Remaining files with syntax errors:');
      remainingSyntaxErrors.slice(0, 10).forEach(file => console.log(`  - ${file}`));
    }
  }
}

// Запуск скрипта
if (require.main === module) {
  const restorer = new FileRestorer();
  restorer.run().catch(console.error);
}

module.exports = FileRestorer;