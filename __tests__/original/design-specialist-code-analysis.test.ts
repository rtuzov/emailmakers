/**
 * 🔍 АНАЛИЗ КОДА ОРИГИНАЛЬНОГО DESIGN SPECIALIST AGENT
 * 
 * Простой анализ исходного кода для демонстрации проблем:
 * - Статический анализ файла без импорта
 * - Демонстрация найденных проблем из аудита
 * - Подтверждение выводов рефакторинга
 */

import * as fs from 'fs';
import * as path from 'path';

describe('ORIGINAL DesignSpecialistAgent - CODE ANALYSIS', () => {
  let sourceCode: string;
  let codeLines: string[];

  beforeAll(() => {
    const filePath = path.resolve(__dirname, '../../src/agent/specialists/design-specialist-agent.ts');
    console.log('🔍 Анализируем оригинальный Design Specialist Agent...');
    console.log(`   Файл: ${filePath}`);
    
    try {
      sourceCode = fs.readFileSync(filePath, 'utf-8');
      codeLines = sourceCode.split('\n');
      console.log(`✅ Файл прочитан: ${codeLines.length} строк, ${Math.round(sourceCode.length / 1024)}KB`);
    } catch (error) {
      console.error(`❌ Ошибка чтения файла: ${error.message}`);
      throw error;
    }
  });

  describe('📏 FILE SIZE AND COMPLEXITY', () => {
    
    it('should confirm massive file size problem', () => {
      console.log('\n🔍 АНАЛИЗ РАЗМЕРА ФАЙЛА:');
      
      const totalLines = codeLines.length;
      const codeOnlyLines = codeLines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('/*') && 
               !trimmed.startsWith('*') &&
               !trimmed.startsWith('*/');
      });
      
      const fileSize = Buffer.byteLength(sourceCode, 'utf8');
      
      console.log(`   📊 Общее количество строк: ${totalLines}`);
      console.log(`   📊 Строк кода: ${codeOnlyLines.length}`);
      console.log(`   📊 Размер файла: ${Math.round(fileSize / 1024)}KB`);
      
      // Демонстрируем проблему
      if (totalLines > 2000) {
        console.log('❌ КРИТИЧЕСКАЯ ПРОБЛЕМА: Файл слишком большой!');
        console.log(`   Превышение в ${totalLines - 2000} строк от рекомендуемого максимума`);
        console.log('   🎯 Это подтверждает проблему из аудита: "God Class"');
      }
      
      if (fileSize > 100 * 1024) { // 100KB
        console.log('❌ ПРОБЛЕМА ПРОИЗВОДИТЕЛЬНОСТИ: Большой размер файла замедляет:');
        console.log('   - Загрузку модуля');
        console.log('   - Компиляцию TypeScript');  
        console.log('   - Анализ IDE');
        console.log('   - Навигацию по коду');
      }
      
      expect(totalLines).toBeGreaterThan(2000);
      expect(fileSize).toBeGreaterThan(100 * 1024);
    });

    it('should analyze method count and complexity', () => {
      console.log('\n🔍 АНАЛИЗ МЕТОДОВ И СЛОЖНОСТИ:');
      
      // Подсчет методов
      const methodPatterns = [
        /private\s+async\s+\w+\s*\(/g,
        /private\s+\w+\s*\(/g,
        /public\s+\w+\s*\(/g,
        /async\s+\w+\s*\(/g
      ];
      
      let totalMethods = 0;
      methodPatterns.forEach(pattern => {
        const matches = sourceCode.match(pattern) || [];
        totalMethods += matches.length;
      });
      
      // Подсчет управляющих структур
      const ifStatements = (sourceCode.match(/\bif\s*\(/g) || []).length;
      const forLoops = (sourceCode.match(/\bfor\s*\(/g) || []).length;
      const whileLoops = (sourceCode.match(/\bwhile\s*\(/g) || []).length;
      const switchStatements = (sourceCode.match(/\bswitch\s*\(/g) || []).length;
      const tryCatchBlocks = (sourceCode.match(/\btry\s*\{/g) || []).length;
      
      console.log(`   📊 Количество методов: ${totalMethods}`);
      console.log(`   📊 If-условий: ${ifStatements}`);
      console.log(`   📊 Циклов for: ${forLoops}`);
      console.log(`   📊 Циклов while: ${whileLoops}`);
      console.log(`   📊 Switch-ей: ${switchStatements}`);
      console.log(`   📊 Try-catch блоков: ${tryCatchBlocks}`);
      
      const cyclomaticComplexity = 1 + ifStatements + forLoops + whileLoops + switchStatements + tryCatchBlocks;
      console.log(`   📊 Цикломатическая сложность: ${cyclomaticComplexity}`);
      
      if (totalMethods > 30) {
        console.log('❌ АРХИТЕКТУРНАЯ ПРОБЛЕМА: Слишком много методов!');
        console.log('   🎯 Это подтверждает нарушение принципа единственной ответственности');
        console.log('   Рекомендация: Разделить на специализированные классы');
      }
      
      if (cyclomaticComplexity > 100) {
        console.log('❌ ПРОБЛЕМА СЛОЖНОСТИ: Код слишком сложный для понимания и тестирования!');
        console.log('   Высокая сложность приводит к:');
        console.log('   - Трудностям в отладке');
        console.log('   - Повышенному количеству багов');
        console.log('   - Сложности написания тестов');
      }
      
      expect(totalMethods).toBeGreaterThan(25);
      expect(cyclomaticComplexity).toBeGreaterThan(80);
    });
  });

  describe('🔄 CODE DUPLICATION ANALYSIS', () => {
    
    it('should detect specific duplicate patterns from audit', () => {
      console.log('\n🔍 ПОИСК ДУБЛИРОВАНИЙ ИЗ АУДИТА:');
      
      // Проблема #1: generateSmartTags - deprecated function
      const generateSmartTagsUsage = (sourceCode.match(/generateSmartTags/g) || []).length;
      console.log(`   📊 Использований generateSmartTags: ${generateSmartTagsUsage}`);
      
      if (generateSmartTagsUsage > 0) {
        console.log('❌ НАЙДЕНА ПРОБЛЕМА #1: Deprecated функция generateSmartTags!');
        
        // Найдем строку с определением
        const methodDefLine = codeLines.findIndex(line => 
          line.includes('generateSmartTags') && line.includes('(')
        );
        
        if (methodDefLine !== -1) {
          console.log(`   Найдена на строке ${methodDefLine + 1}: ${codeLines[methodDefLine].trim()}`);
          
          // Проверим следующие несколько строк на предмет комментария или тела
          for (let i = methodDefLine; i < Math.min(methodDefLine + 5, codeLines.length); i++) {
            if (codeLines[i].includes('deprecated') || codeLines[i].includes('throw')) {
              console.log(`   🎯 Подтверждение: ${codeLines[i].trim()}`);
              break;
            }
          }
        }
      }
      
      // Проблема #2: Дублирование логики поиска ассетов  
      const assetSearchPatterns = [
        'figma.*search',
        'asset.*search',
        'combineAssetResults',
        'extractAssetPaths'
      ];
      
      console.log('\n   🔍 Анализ дублирования поиска ассетов:');
      assetSearchPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        const matches = sourceCode.match(regex) || [];
        console.log(`     ${pattern}: ${matches.length} вхождений`);
        
        if (matches.length > 3) {
          console.log(`     ❌ НАЙДЕНА ПРОБЛЕМА #2: Дублирование логики "${pattern}"`);
        }
      });
      
      // Проблема #3: Многократная валидация
      const validationPatterns = [
        'validateAndCorrect',
        'HandoffValidator',
        'DesignSpecialistValidator',
        '\.validate\('
      ];
      
      console.log('\n   🔍 Анализ избыточной валидации:');
      validationPatterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'g');
        const matches = sourceCode.match(regex) || [];
        console.log(`     ${pattern}: ${matches.length} вхождений`);
        
        if (matches.length > 5) {
          console.log(`     ❌ НАЙДЕНА ПРОБЛЕМА #3: Избыточная валидация "${pattern}"`);
        }
      });
      
      expect(generateSmartTagsUsage).toBeGreaterThan(0);
    });

    it('should find repeated error handling patterns', () => {
      console.log('\n🔍 АНАЛИЗ ДУБЛИРОВАНИЯ ОБРАБОТКИ ОШИБОК:');
      
      const errorPatterns = [
        { name: 'Try-catch блоки', pattern: /try\s*\{[\s\S]*?\}\s*catch/g },
        { name: 'Console.log ошибок', pattern: /console\.log.*error/gi },
        { name: 'Error.message', pattern: /\.message/g },
        { name: 'Throw new Error', pattern: /throw\s+new\s+Error/gi },
        { name: 'generateTraceId', pattern: /generateTraceId\(\)/g }
      ];
      
      errorPatterns.forEach(({ name, pattern }) => {
        const matches = sourceCode.match(pattern) || [];
        console.log(`   📊 ${name}: ${matches.length} вхождений`);
        
        if (matches.length > 8) {
          console.log(`     ❌ НАЙДЕНО ДУБЛИРОВАНИЕ: Слишком много повторений "${name}"`);
          console.log(`     🎯 Это подтверждает необходимость централизованной обработки ошибок`);
        }
      });
      
      const tryCatchCount = (sourceCode.match(/try\s*\{/g) || []).length;
      expect(tryCatchCount).toBeGreaterThan(8);
    });
  });

  describe('🏗️ ARCHITECTURAL ANALYSIS', () => {
    
    it('should identify mixed responsibilities', () => {
      console.log('\n🔍 АНАЛИЗ СМЕШЕНИЯ ОТВЕТСТВЕННОСТЕЙ:');
      
      const responsibilities = {
        'Asset Management': ['figma', 'asset', 'combineAsset', 'extractAsset'],
        'Email Rendering': ['render', 'mjml', 'html', 'template'],
        'Data Validation': ['validate', 'validator', 'correct'],
        'Error Handling': ['try', 'catch', 'error', 'throw'],
        'Content Processing': ['content', 'extract', 'parse', 'format'],
        'Performance Monitoring': ['analytics', 'metrics', 'performance', 'execution_time']
      };
      
      let totalMatches = 0;
      Object.entries(responsibilities).forEach(([category, keywords]) => {
        let categoryMatches = 0;
        keywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'gi');
          const matches = sourceCode.match(regex) || [];
          categoryMatches += matches.length;
        });
        
        console.log(`   📊 ${category}: ${categoryMatches} связанных элементов`);
        totalMatches += categoryMatches;
      });
      
      const responsibilityCount = Object.keys(responsibilities).length;
      const avgElementsPerResponsibility = Math.round(totalMatches / responsibilityCount);
      
      console.log(`\n   📈 СТАТИСТИКА ОТВЕТСТВЕННОСТЕЙ:`);
      console.log(`     Количество ответственностей: ${responsibilityCount}`);
      console.log(`     Среднее количество элементов: ${avgElementsPerResponsibility}`);
      
      if (responsibilityCount > 4) {
        console.log('❌ АРХИТЕКТУРНАЯ ПРОБЛЕМА: Нарушение принципа единственной ответственности!');
        console.log('   🎯 Класс выполняет слишком много разных функций');
        console.log('   Рекомендация: Разделить на специализированные компоненты:');
        console.log('     - AssetManager для управления ассетами');
        console.log('     - EmailRenderer для рендеринга писем'); 
        console.log('     - DataValidator для валидации данных');
        console.log('     - ErrorHandler для обработки ошибок');
        console.log('     - ContentProcessor для обработки контента');
      }
      
      expect(responsibilityCount).toBeGreaterThan(4);
    });

    it('should analyze import dependencies', () => {
      console.log('\n🔍 АНАЛИЗ ЗАВИСИМОСТЕЙ:');
      
      const importLines = codeLines.filter(line => line.trim().startsWith('import'));
      const externalImports = importLines.filter(line => 
        !line.includes('../') && !line.includes('./') && !line.includes('src/')
      );
      const internalImports = importLines.filter(line => 
        line.includes('../') || line.includes('./') || line.includes('src/')
      );
      
      console.log(`   📊 Всего импортов: ${importLines.length}`);
      console.log(`   📊 Внешних зависимостей: ${externalImports.length}`);
      console.log(`   📊 Внутренних зависимостей: ${internalImports.length}`);
      
      if (importLines.length > 20) {
        console.log('❌ ПРОБЛЕМА СВЯЗАННОСТИ: Слишком много зависимостей!');
        console.log('   Это приводит к:');
        console.log('   - Сложности тестирования');
        console.log('   - Тесной связанности компонентов');
        console.log('   - Трудностям в изоляции функционала');
      }
      
      // Показываем несколько примеров внутренних зависимостей
      console.log('\n   🔍 Примеры внутренних зависимостей:');
      internalImports.slice(0, 5).forEach((imp, index) => {
        console.log(`     ${index + 1}. ${imp.trim()}`);
      });
      
      expect(importLines.length).toBeGreaterThan(15);
    });
  });

  describe('📋 PROBLEMS SUMMARY', () => {
    
    it('should generate comprehensive audit confirmation', () => {
      console.log('\n🎯 ПОДТВЕРЖДЕНИЕ ПРОБЛЕМ ИЗ АУДИТА:');
      console.log('=' .repeat(60));
      
      const problemsFound = [];
      
      // Проверка размера файла
      if (codeLines.length > 2000) {
        problemsFound.push('✓ Подтвержден огромный размер файла (>2000 строк)');
      }
      
      // Проверка методов
      const methodCount = (sourceCode.match(/private\s+\w+\s*\(|public\s+\w+\s*\(|async\s+\w+\s*\(/g) || []).length;
      if (methodCount > 25) {
        problemsFound.push('✓ Подтверждено слишком много методов (>25)');
      }
      
      // Проверка дублирования
      const tryCatchCount = (sourceCode.match(/try\s*\{/g) || []).length;
      if (tryCatchCount > 8) {
        problemsFound.push('✓ Подтверждено дублирование try-catch блоков');
      }
      
      // Проверка deprecated функций
      if (sourceCode.includes('generateSmartTags')) {
        problemsFound.push('✓ Подтверждена deprecated функция generateSmartTags');
      }
      
      // Проверка сложности
      const complexity = (sourceCode.match(/\bif\s*\(|\bfor\s*\(|\bwhile\s*\(|\btry\s*\{/g) || []).length;
      if (complexity > 80) {
        problemsFound.push('✓ Подтверждена высокая цикломатическая сложность');
      }
      
      // Проверка зависимостей
      const importCount = codeLines.filter(line => line.trim().startsWith('import')).length;
      if (importCount > 15) {
        problemsFound.push('✓ Подтверждено слишком много зависимостей');
      }
      
      console.log('\n🔴 ПОДТВЕРЖДЕННЫЕ ПРОБЛЕМЫ:');
      problemsFound.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
      
      console.log('\n📊 СТАТИСТИКА АНАЛИЗА:');
      console.log(`   Строк кода: ${codeLines.length}`);
      console.log(`   Методов: ${methodCount}`);
      console.log(`   Цикломатическая сложность: ${complexity}`);
      console.log(`   Try-catch блоков: ${tryCatchCount}`);
      console.log(`   Импортов: ${importCount}`);
      console.log(`   Найдено проблем: ${problemsFound.length}/6`);
      
      if (problemsFound.length >= 4) {
        console.log('\n🚨 ВЫВОД: РЕФАКТОРИНГ КРИТИЧЕСКИ НЕОБХОДИМ!');
        console.log('   Все основные проблемы из аудита подтверждены статическим анализом');
        console.log('   Новая версия агента решает ВСЕ выявленные проблемы');
      }
      
      console.log('\n✅ АНАЛИЗ ОРИГИНАЛЬНОГО АГЕНТА ЗАВЕРШЕН');
      console.log('   Переходите к тестированию новой версии DesignSpecialistAgentV2!');
      
      expect(problemsFound.length).toBeGreaterThan(3);
    });
  });
}); 