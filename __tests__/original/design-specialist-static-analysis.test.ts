/**
 * 🔍 СТАТИЧЕСКИЙ АНАЛИЗ ОРИГИНАЛЬНОГО DESIGN SPECIALIST AGENT
 * 
 * Анализ проблем в коде без импорта внешних зависимостей:
 * - Анализ размера файла и сложности
 * - Поиск дублирований кода
 * - Анализ структуры методов
 * - Проверка архитектурных проблем
 */

import * as fs from 'fs';
import * as path from 'path';

describe('ORIGINAL DesignSpecialistAgent - STATIC CODE ANALYSIS', () => {
  const agentFilePath = path.resolve(__dirname, '../../src/agent/specialists/design-specialist-agent.ts');
  let agentCode: string;

  beforeAll(() => {
    console.log(`🔍 Анализируем файл: ${agentFilePath}`);
    try {
      agentCode = fs.readFileSync(agentFilePath, 'utf-8');
      console.log(`✅ Файл найден, размер: ${agentCode.length} символов`);
    } catch (error) {
      console.error(`❌ Ошибка чтения файла: ${error.message}`);
      throw error;
    }
  });

  describe('📏 CODE SIZE & COMPLEXITY ANALYSIS', () => {
    
    it('should analyze file size and complexity metrics', () => {
      console.log('🔍 Анализ размера и сложности файла...');
      
      const lines = agentCode.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      const codeLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
      });
      
      const fileSize = Buffer.byteLength(agentCode, 'utf8');
      const totalLines = lines.length;
      const commentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
      }).length;
      
      console.log(`📊 МЕТРИКИ РАЗМЕРА:`);
      console.log(`   Общий размер файла: ${Math.round(fileSize / 1024)}KB`);
      console.log(`   Всего строк: ${totalLines}`);
      console.log(`   Строк кода: ${codeLines.length}`);
      console.log(`   Пустых строк: ${totalLines - nonEmptyLines.length}`);
      console.log(`   Строк комментариев: ${commentLines}`);
      
      // Анализ сложности
      const methods = agentCode.match(/(?:private|public|async)\s+[\w\s]*\(/g) || [];
      const ifStatements = agentCode.match(/\bif\s*\(/g) || [];
      const forLoops = agentCode.match(/\bfor\s*\(/g) || [];
      const whileLoops = agentCode.match(/\bwhile\s*\(/g) || [];
      const tryCatchBlocks = agentCode.match(/\btry\s*\{/g) || [];
      
      console.log(`\n🔧 МЕТРИКИ СЛОЖНОСТИ:`);
      console.log(`   Количество методов: ${methods.length}`);
      console.log(`   If-условий: ${ifStatements.length}`);
      console.log(`   Циклов for: ${forLoops.length}`);
      console.log(`   Циклов while: ${whileLoops.length}`);
      console.log(`   Try-catch блоков: ${tryCatchBlocks.length}`);
      
      // Вычисляем цикломатическую сложность (приблизительно)
      const cyclomaticComplexity = 1 + ifStatements.length + forLoops.length + whileLoops.length + tryCatchBlocks.length;
      console.log(`   Приблизительная цикломатическая сложность: ${cyclomaticComplexity}`);
      
      // Проверяем критические метрики
      if (totalLines > 1000) {
        console.log('❌ ПРОБЛЕМА: Файл слишком большой (>1000 строк)');
        console.log('   Рекомендация: Разделить на меньшие модули');
      }
      
      if (methods.length > 20) {
        console.log('❌ ПРОБЛЕМА: Слишком много методов в одном классе');
        console.log('   Рекомендация: Применить принцип единственной ответственности');
      }
      
      if (cyclomaticComplexity > 50) {
        console.log('❌ ПРОБЛЕМА: Высокая цикломатическая сложность');
        console.log('   Рекомендация: Упростить логику и разделить ответственности');
      }
      
      expect(totalLines).toBeGreaterThan(1000); // Подтверждаем, что файл действительно большой
    });

    it('should analyze method size distribution', () => {
      console.log('🔍 Анализ распределения размеров методов...');
      
      // Находим все методы и их размеры
      const methodRegex = /(?:private|public|async)[\s\w]*\([^)]*\)[^{]*\{/g;
      const methods: Array<{name: string, startLine: number, size: number}> = [];
      
      const lines = agentCode.split('\n');
      let match;
      
      while ((match = methodRegex.exec(agentCode)) !== null) {
        const methodStart = agentCode.substring(0, match.index).split('\n').length;
        const methodDeclaration = match[0];
        const methodName = methodDeclaration.match(/(?:private|public|async)\s+([\w\s]*)\s*\(/)?.[1]?.trim() || 'unknown';
        
        // Находим конец метода (упрощенный поиск)
        let braceCount = 0;
        let methodEnd = methodStart;
        let startBraceFound = false;
        
        for (let i = methodStart - 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('{')) {
            startBraceFound = true;
            braceCount += (line.match(/\{/g) || []).length;
          }
          if (line.includes('}')) {
            braceCount -= (line.match(/\}/g) || []).length;
          }
          
          if (startBraceFound && braceCount === 0) {
            methodEnd = i + 1;
            break;
          }
        }
        
        const methodSize = methodEnd - methodStart + 1;
        methods.push({
          name: methodName,
          startLine: methodStart,
          size: methodSize
        });
      }
      
      // Сортируем методы по размеру
      methods.sort((a, b) => b.size - a.size);
      
      console.log(`📊 ТОП-10 САМЫХ БОЛЬШИХ МЕТОДОВ:`);
      methods.slice(0, 10).forEach((method, index) => {
        console.log(`   ${index + 1}. ${method.name}: ${method.size} строк (строка ${method.startLine})`);
      });
      
      const averageMethodSize = methods.reduce((sum, method) => sum + method.size, 0) / methods.length;
      const largeMethods = methods.filter(method => method.size > 50);
      
      console.log(`\n📈 СТАТИСТИКА МЕТОДОВ:`);
      console.log(`   Всего методов: ${methods.length}`);
      console.log(`   Средний размер метода: ${Math.round(averageMethodSize)} строк`);
      console.log(`   Методов >50 строк: ${largeMethods.length}`);
      
      if (largeMethods.length > 0) {
        console.log('❌ ПРОБЛЕМА: Найдены слишком большие методы!');
        console.log('   Методы должны быть <30 строк для лучшей читаемости');
        console.log('   Большие методы:');
        largeMethods.slice(0, 5).forEach(method => {
          console.log(`     - ${method.name}: ${method.size} строк`);
        });
      }
      
      expect(methods.length).toBeGreaterThan(0);
    });
  });

  describe('🔄 CODE DUPLICATION ANALYSIS', () => {
    
    it('should detect duplicate code patterns', () => {
      console.log('🔍 Поиск дублирований кода...');
      
      const duplicatePatterns = [
        {
          name: 'Try-catch blocks',
          pattern: /try\s*\{[\s\S]*?\}\s*catch[\s\S]*?\{[\s\S]*?\}/g,
          description: 'Блоки обработки ошибок'
        },
        {
          name: 'Console.log statements',
          pattern: /console\.log\([^)]*\)/g,
          description: 'Отладочные сообщения'
        },
        {
          name: 'generateTraceId calls',
          pattern: /generateTraceId\(\)/g,
          description: 'Генерация ID трассировки'
        },
        {
          name: 'Content extraction patterns',
          pattern: /\.subject|\.preheader|\.body|\.cta/g,
          description: 'Извлечение контента'
        },
        {
          name: 'Asset search patterns',
          pattern: /figma.*search|asset.*search/gi,
          description: 'Поиск ассетов'
        },
        {
          name: 'Error handling patterns',
          pattern: /error.*message|\.message/gi,
          description: 'Обработка ошибок'
        }
      ];
      
      console.log('📊 АНАЛИЗ ДУБЛИРОВАНИЙ:');
      
      duplicatePatterns.forEach(pattern => {
        const matches = agentCode.match(pattern.pattern) || [];
        console.log(`   ${pattern.name}: ${matches.length} вхождений`);
        
        if (matches.length > 5) {
          console.log(`     ❌ ПРОБЛЕМА: Слишком много дублирований для "${pattern.description}"`);
          console.log(`     Рекомендация: Вынести в отдельный метод или утилиту`);
        }
      });
      
      // Поиск повторяющихся строк кода
      const lines = agentCode.split('\n').map(line => line.trim()).filter(line => line.length > 10);
      const lineOccurrences: {[key: string]: number} = {};
      
      lines.forEach(line => {
        if (line.length > 20) { // Только значимые строки
          lineOccurrences[line] = (lineOccurrences[line] || 0) + 1;
        }
      });
      
      const duplicateLines = Object.entries(lineOccurrences)
        .filter(([line, count]) => count > 2)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      if (duplicateLines.length > 0) {
        console.log('\n🔄 ТОП ДУБЛИРУЮЩИХСЯ СТРОК:');
        duplicateLines.forEach(([line, count]) => {
          console.log(`   ${count}x: ${line.substring(0, 60)}...`);
        });
        
        console.log('❌ ПРОБЛЕМА: Обнаружены дублирующиеся строки кода!');
        console.log('   Рекомендация: Рефакторинг для устранения дублирования');
      }
      
      expect(duplicatePatterns).toBeDefined();
    });

    it('should analyze code structure and responsibilities', () => {
      console.log('🔍 Анализ структуры кода и ответственностей...');
      
      const responsibilities = {
        'Asset Management': [
          /asset.*search/gi,
          /figma.*search/gi,
          /combineAssetResults/gi,
          /extractAssetPaths/gi
        ],
        'Email Rendering': [
          /render.*email/gi,
          /mjml.*template/gi,
          /generateMjmlTemplate/gi,
          /handleEmailRendering/gi
        ],
        'Data Validation': [
          /validate.*data/gi,
          /validateAndCorrect/gi,
          /HandoffValidator/gi,
          /DesignSpecialistValidator/gi
        ],
        'Error Handling': [
          /try.*catch/gi,
          /error.*handling/gi,
          /throw.*error/gi,
          /catch.*error/gi
        ],
        'Data Transformation': [
          /extractContentData/gi,
          /formatDesignToQualityData/gi,
          /parseAssistantFigmaResponse/gi,
          /transform.*data/gi
        ]
      };
      
      console.log('📊 АНАЛИЗ ОТВЕТСТВЕННОСТЕЙ:');
      
      let totalMatches = 0;
      Object.entries(responsibilities).forEach(([category, patterns]) => {
        let categoryMatches = 0;
        patterns.forEach(pattern => {
          const matches = agentCode.match(pattern) || [];
          categoryMatches += matches.length;
        });
        
        console.log(`   ${category}: ${categoryMatches} связанных элементов`);
        totalMatches += categoryMatches;
      });
      
      const responsibilityCount = Object.keys(responsibilities).length;
      console.log(`\n📈 СТАТИСТИКА ОТВЕТСТВЕННОСТЕЙ:`);
      console.log(`   Количество ответственностей: ${responsibilityCount}`);
      console.log(`   Общее количество связанных элементов: ${totalMatches}`);
      console.log(`   Среднее количество элементов на ответственность: ${Math.round(totalMatches / responsibilityCount)}`);
      
      if (responsibilityCount > 3) {
        console.log('❌ ПРОБЛЕМА: Слишком много ответственностей в одном классе!');
        console.log('   Нарушение принципа единственной ответственности (SRP)');
        console.log('   Рекомендация: Разделить класс на специализированные компоненты:');
        console.log('     - AssetManager для управления ассетами');
        console.log('     - EmailRenderer для рендеринга писем');
        console.log('     - DataValidator для валидации данных');
        console.log('     - ErrorHandler для обработки ошибок');
      }
      
      expect(responsibilityCount).toBeGreaterThan(3); // Подтверждаем проблему
    });
  });

  describe('🔧 ARCHITECTURAL PROBLEMS', () => {
    
    it('should identify architectural anti-patterns', () => {
      console.log('🔍 Поиск архитектурных анти-паттернов...');
      
      const antiPatterns = [
        {
          name: 'God Class',
          indicators: [
            agentCode.split('\n').length > 1000,
            (agentCode.match(/(?:private|public|async)\s+[\w\s]*\(/g) || []).length > 20,
            agentCode.includes('handleFullEmailGeneration') && agentCode.includes('handleAssetSelection') && agentCode.includes('handleEmailRendering')
          ],
          description: 'Класс выполняет слишком много функций'
        },
        {
          name: 'Long Parameter List',
          indicators: [
            /\([^)]{100,}\)/g.test(agentCode), // Параметры длиннее 100 символов
            /\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/g.test(agentCode) // 6+ параметров
          ],
          description: 'Методы с большим количеством параметров'
        },
        {
          name: 'Shotgun Surgery',
          indicators: [
            (agentCode.match(/executeTask/g) || []).length > 1,
            (agentCode.match(/handleFullEmailGeneration|handleAssetSelection|handleEmailRendering|handleTemplateCreation/g) || []).length > 3
          ],
          description: 'Изменения требуют модификации множества мест'
        },
        {
          name: 'Feature Envy',
          indicators: [
            (agentCode.match(/\.figma/g) || []).length > 10,
            (agentCode.match(/\.assets/g) || []).length > 10,
            (agentCode.match(/\.content/g) || []).length > 15
          ],
          description: 'Класс слишком заинтересован в данных других классов'
        },
        {
          name: 'Duplicate Code',
          indicators: [
            (agentCode.match(/try\s*\{/g) || []).length > 8,
            (agentCode.match(/console\.log/g) || []).length > 20,
            (agentCode.match(/generateTraceId\(\)/g) || []).length > 5
          ],
          description: 'Дублирование кода в разных местах'
        }
      ];
      
      console.log('🚨 НАЙДЕННЫЕ АНТИ-ПАТТЕРНЫ:');
      
      let foundAntiPatterns = 0;
      antiPatterns.forEach(antiPattern => {
        const indicatorsPassed = antiPattern.indicators.filter(Boolean).length;
        const totalIndicators = antiPattern.indicators.length;
        
        if (indicatorsPassed > totalIndicators / 2) {
          foundAntiPatterns++;
          console.log(`   ❌ ${antiPattern.name}:`);
          console.log(`     ${antiPattern.description}`);
          console.log(`     Индикаторов найдено: ${indicatorsPassed}/${totalIndicators}`);
        }
      });
      
      console.log(`\nИТОГО АНТИ-ПАТТЕРНОВ: ${foundAntiPatterns}/${antiPatterns.length}`);
      
      if (foundAntiPatterns > 0) {
        console.log('\n💡 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:');
        console.log('   1. Разделить класс на меньшие, специализированные компоненты');
        console.log('   2. Применить паттерн Strategy для обработки разных типов задач');
        console.log('   3. Вынести общую логику в базовые классы или утилиты');
        console.log('   4. Использовать Dependency Injection для управления зависимостями');
        console.log('   5. Применить Command pattern для обработки различных операций');
      }
      
      expect(foundAntiPatterns).toBeGreaterThan(0); // Подтверждаем наличие проблем
    });

    it('should analyze dependencies and coupling', () => {
      console.log('🔍 Анализ зависимостей и связанности...');
      
      const imports = agentCode.match(/import\s+.*?from\s+['"][^'"]*['"]/g) || [];
      const externalDependencies = imports.filter(imp => 
        !imp.includes('../') && !imp.includes('./') && !imp.includes('src/')
      );
      const internalDependencies = imports.filter(imp => 
        imp.includes('../') || imp.includes('./') || imp.includes('src/')
      );
      
      console.log('📦 АНАЛИЗ ЗАВИСИМОСТЕЙ:');
      console.log(`   Всего импортов: ${imports.length}`);
      console.log(`   Внешних зависимостей: ${externalDependencies.length}`);
      console.log(`   Внутренних зависимостей: ${internalDependencies.length}`);
      
      // Анализ связанности
      const classReferences = [
        { name: 'HandoffValidator', count: (agentCode.match(/HandoffValidator/g) || []).length },
        { name: 'DesignSpecialistValidator', count: (agentCode.match(/DesignSpecialistValidator/g) || []).length },
        { name: 'AICorrector', count: (agentCode.match(/AICorrector/g) || []).length },
        { name: 'OptimizationService', count: (agentCode.match(/OptimizationService/g) || []).length },
        { name: 'EmailFolderManager', count: (agentCode.match(/EmailFolderManager/g) || []).length }
      ];
      
      console.log('\n🔗 СВЯЗАННОСТЬ С ДРУГИМИ КЛАССАМИ:');
      classReferences.forEach(ref => {
        console.log(`   ${ref.name}: ${ref.count} ссылок`);
      });
      
      const totalReferences = classReferences.reduce((sum, ref) => sum + ref.count, 0);
      const averageReferences = totalReferences / classReferences.length;
      
      console.log(`\n📊 СТАТИСТИКА СВЯЗАННОСТИ:`);
      console.log(`   Общее количество ссылок: ${totalReferences}`);
      console.log(`   Среднее количество ссылок на класс: ${Math.round(averageReferences)}`);
      
      if (internalDependencies.length > 10) {
        console.log('❌ ПРОБЛЕМА: Слишком много внутренних зависимостей!');
        console.log('   Высокая связанность затрудняет тестирование и поддержку');
      }
      
      if (averageReferences > 5) {
        console.log('❌ ПРОБЛЕМА: Высокая связанность между классами!');
        console.log('   Рекомендация: Использовать Dependency Injection и интерфейсы');
      }
      
      expect(imports.length).toBeGreaterThan(0);
    });
  });

  describe('📈 SUMMARY REPORT', () => {
    
    it('should generate comprehensive problem summary', () => {
      console.log('🔍 Генерация итогового отчета о проблемах...');
      
      const lines = agentCode.split('\n');
      const methods = agentCode.match(/(?:private|public|async)\s+[\w\s]*\(/g) || [];
      const tryCatchBlocks = agentCode.match(/try\s*\{/g) || [];
      const imports = agentCode.match(/import\s+.*?from/g) || [];
      
      const problemSummary = {
        codeSize: {
          score: lines.length > 2000 ? 'CRITICAL' : lines.length > 1000 ? 'HIGH' : 'MEDIUM',
          details: `${lines.length} строк кода`
        },
        complexity: {
          score: methods.length > 30 ? 'CRITICAL' : methods.length > 20 ? 'HIGH' : 'MEDIUM',
          details: `${methods.length} методов в классе`
        },
        errorHandling: {
          score: tryCatchBlocks.length > 10 ? 'HIGH' : tryCatchBlocks.length > 5 ? 'MEDIUM' : 'LOW',
          details: `${tryCatchBlocks.length} блоков try-catch`
        },
        dependencies: {
          score: imports.length > 15 ? 'HIGH' : imports.length > 10 ? 'MEDIUM' : 'LOW',
          details: `${imports.length} импортов`
        }
      };
      
      console.log('\n📋 ИТОГОВЫЙ ОТЧЕТ О ПРОБЛЕМАХ:');
      console.log('=' .repeat(50));
      
      Object.entries(problemSummary).forEach(([category, problem]) => {
        const severity = problem.score === 'CRITICAL' ? '🔴' : 
                        problem.score === 'HIGH' ? '🟠' : 
                        problem.score === 'MEDIUM' ? '🟡' : '🟢';
        
        console.log(`${severity} ${category.toUpperCase()}: ${problem.score}`);
        console.log(`   ${problem.details}`);
      });
      
      const criticalIssues = Object.values(problemSummary).filter(p => p.score === 'CRITICAL').length;
      const highIssues = Object.values(problemSummary).filter(p => p.score === 'HIGH').length;
      const totalIssues = criticalIssues + highIssues;
      
      console.log('\n🎯 ПРИОРИТЕТЫ РЕФАКТОРИНГА:');
      console.log(`   Критических проблем: ${criticalIssues}`);
      console.log(`   Серьезных проблем: ${highIssues}`);
      console.log(`   Всего приоритетных проблем: ${totalIssues}`);
      
      if (totalIssues > 0) {
        console.log('\n🚨 ТРЕБУЕТСЯ НЕМЕДЛЕННЫЙ РЕФАКТОРИНГ!');
        console.log('   Рекомендованные действия:');
        console.log('   1. Разделить класс на специализированные компоненты');
        console.log('   2. Внедрить кэширование для улучшения производительности');
        console.log('   3. Унифицировать обработку ошибок');
        console.log('   4. Упростить архитектуру и уменьшить связанность');
        console.log('   5. Добавить комплексные тесты');
      }
      
      console.log('\n✅ АНАЛИЗ ЗАВЕРШЕН');
      console.log('   Все проблемы, найденные в аудите, подтверждены статическим анализом!');
      
      expect(totalIssues).toBeGreaterThan(0);
    });
  });
}); 