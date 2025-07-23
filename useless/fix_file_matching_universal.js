const fs = require('fs');
const path = require('path');

// Функция для обработки одной папки
function processFolderMatching(folderPath, folderName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 ОБРАБОТКА ПАПКИ: ${folderName}`);
  console.log(`${'='.repeat(60)}`);

  // Проверяем наличие необходимых файлов
  const tagDictPath = path.join(folderPath, 'tag-dictionary.json');
  const reportPath = path.join(folderPath, 'page-processing-report.json');
  const renamePath = path.join(folderPath, 'rename-report.json');

  if (!fs.existsSync(tagDictPath)) {
    console.log(`❌ Файл tag-dictionary.json не найден в ${folderName}`);
    return false;
  }

  // Читаем файлы
  const tagDict = JSON.parse(fs.readFileSync(tagDictPath, 'utf8'));
  let report = null;
  let renameReport = null;

  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  }
  
  if (fs.existsSync(renamePath)) {
    renameReport = JSON.parse(fs.readFileSync(renamePath, 'utf8'));
  }

  // Получаем список всех файлов в папке
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));

  console.log(`📁 Файлов в папке: ${files.length}`);
  console.log(`📝 Записей в tag-dictionary: ${Object.keys(tagDict.entries).length}`);

  // Анализируем дубли
  const fileUsage = {};
  Object.entries(tagDict.entries).forEach(([key, entry]) => {
    const fileName = entry.originalName;
    if (!fileUsage[fileName]) {
      fileUsage[fileName] = [];
    }
    fileUsage[fileName].push(key);
  });

  const duplicates = Object.entries(fileUsage).filter(([, keys]) => keys.length > 1);
  console.log(`🔍 Найдено дублей: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('\n📋 ДУБЛИ ФАЙЛОВ:');
    duplicates.forEach(([fileName, keys]) => {
      console.log(`  "${fileName}" используется ${keys.length} раз:`);
      keys.forEach(key => console.log(`    - ${key}`));
    });
  }

  // Функция для вычисления совместимости между shortName и fileName
  function calculateCompatibility(shortName, fileName) {
    const shortWords = shortName.split('-');
    const fileWords = fileName.replace('.png', '').split('-');
    
    let score = 0;
    const maxScore = shortWords.length;
    
    // Прямые совпадения слов
    shortWords.forEach(word => {
      if (fileWords.some(fw => fw.includes(word) || word.includes(fw))) {
        score += 1;
      }
    });
    
    // Семантические соответствия для зайцев и новостей
    const semanticMap = {
      'заяц': ['заяц', 'кролик', 'зайчик'],
      'новости': ['новости', 'новость', 'информация', 'сообщение'],
      'путешествия': ['путешествие', 'поездка', 'отпуск', 'туризм', 'самолет', 'билет'],
      'билеты': ['билет', 'авиабилет', 'покупка', 'бронирование'],
      'авиакомпания': ['авиакомпания', 'авиация', 'самолет', 'полет'],
      'дешевые': ['дешевый', 'скидка', 'акция', 'выгодно'],
      'быстро': ['быстро', 'скорость', 'экспресс'],
      'удобно': ['удобно', 'комфорт', 'сервис'],
      'безопасно': ['безопасно', 'надежно', 'защита'],
      'надежно': ['надежно', 'безопасно', 'качество'],
      'качество': ['качество', 'премиум', 'лучший'],
      'сервис': ['сервис', 'обслуживание', 'поддержка'],
      'поддержка': ['поддержка', 'помощь', 'консультация'],
      'помощь': ['помощь', 'поддержка', 'сервис'],
      'консультация': ['консультация', 'помощь', 'совет'],
      'бронирование': ['бронирование', 'заказ', 'резерв'],
      'оплата': ['оплата', 'платеж', 'деньги'],
      'карта': ['карта', 'банк', 'платеж'],
      'банк': ['банк', 'карта', 'финансы'],
      'безналичный': ['безналичный', 'карта', 'электронный'],
      'наличные': ['наличные', 'деньги', 'кэш'],
      'рассрочка': ['рассрочка', 'кредит', 'платеж'],
      'кредит': ['кредит', 'рассрочка', 'займ'],
      'льготы': ['льготы', 'скидка', 'выгода'],
      'пенсионеры': ['пенсионер', 'льготы', 'старший'],
      'студенты': ['студент', 'молодежь', 'учеба'],
      'молодежь': ['молодежь', 'студент', 'молодой'],
      'взрослые': ['взрослый', 'люди', 'клиент'],
      'эмоции': ['эмоция', 'чувство', 'настроение'],
      'радость': ['радость', 'счастье', 'позитив'],
      'грусть': ['грусть', 'печаль', 'тоска'],
      'удивление': ['удивление', 'шок', 'восторг'],
      'страх': ['страх', 'тревога', 'беспокойство']
    };
    
    // Добавляем семантические баллы
    shortWords.forEach(word => {
      if (semanticMap[word]) {
        semanticMap[word].forEach(semantic => {
          if (fileWords.some(fw => fw.includes(semantic))) {
            score += 0.5;
          }
        });
      }
    });
    
    return score / maxScore;
  }

  // Создаем матрицу совместимости
  const shortNames = Object.keys(tagDict.entries);
  const compatibilityMatrix = {};

  shortNames.forEach(shortName => {
    compatibilityMatrix[shortName] = {};
    files.forEach(fileName => {
      compatibilityMatrix[shortName][fileName] = calculateCompatibility(shortName, fileName);
    });
  });

  // Алгоритм максимального паросочетания (жадный подход)
  const usedFiles = new Set();
  const finalMatching = {};

  // Сортируем shortNames по убыванию максимального score для лучшего результата
  const sortedShortNames = shortNames.sort((a, b) => {
    const maxScoreA = Math.max(...Object.values(compatibilityMatrix[a]));
    const maxScoreB = Math.max(...Object.values(compatibilityMatrix[b]));
    return maxScoreB - maxScoreA;
  });

  console.log('\n🎯 СОПОСТАВЛЕНИЕ ФАЙЛОВ:');
  sortedShortNames.forEach(shortName => {
    // Находим лучший доступный файл для этого shortName
    const availableFiles = files.filter(f => !usedFiles.has(f));
    
    if (availableFiles.length > 0) {
      const bestFile = availableFiles.reduce((best, file) => {
        return compatibilityMatrix[shortName][file] > compatibilityMatrix[shortName][best] ? file : best;
      });
      
      finalMatching[shortName] = bestFile;
      usedFiles.add(bestFile);
      
      const score = compatibilityMatrix[shortName][bestFile];
      console.log(`✓ ${shortName} -> ${bestFile.substring(0, 60)}... (${score.toFixed(2)})`);
    } else {
      console.log(`❌ Нет доступного файла для ${shortName}`);
    }
  });

  console.log('\n📝 ОБНОВЛЕНИЕ TAG-DICTIONARY:');
  let updatedCount = 0;

  // Обновляем tag-dictionary.json
  Object.entries(finalMatching).forEach(([shortName, fileName]) => {
    if (tagDict.entries[shortName]) {
      const oldFileName = tagDict.entries[shortName].originalName;
      if (oldFileName !== fileName) {
        tagDict.entries[shortName].originalName = fileName;
        updatedCount++;
        console.log(`  ✓ ${shortName}: ${oldFileName.substring(0, 40)}... -> ${fileName.substring(0, 40)}...`);
      }
    }
  });

  // Сохраняем обновленный файл
  if (updatedCount > 0) {
    fs.writeFileSync(tagDictPath, JSON.stringify(tagDict, null, 2));
    console.log(`\n✅ Обновлено записей: ${updatedCount}`);
  } else {
    console.log('\n✅ Обновления не требуются');
  }

  // Финальная проверка на дубли
  console.log('\n🔍 ФИНАЛЬНАЯ ПРОВЕРКА:');
  const finalFileUsage = {};
  Object.entries(tagDict.entries).forEach(([key, entry]) => {
    const fileName = entry.originalName;
    if (!finalFileUsage[fileName]) {
      finalFileUsage[fileName] = [];
    }
    finalFileUsage[fileName].push(key);
  });

  const finalDuplicates = Object.entries(finalFileUsage).filter(([, keys]) => keys.length > 1);
  if (finalDuplicates.length === 0) {
    console.log('✅ Дублей не найдено! Каждый файл используется только один раз.');
  } else {
    console.log('❌ Остались дубли:');
    finalDuplicates.forEach(([fileName, keys]) => {
      console.log(`  ${fileName}: ${keys.join(', ')}`);
    });
  }

  const missingFiles = Object.values(tagDict.entries).filter(entry => {
    return !files.includes(entry.originalName);
  });

  console.log(`📊 СТАТИСТИКА: Файлов: ${files.length}, Записей: ${Object.keys(tagDict.entries).length}, Отсутствующих: ${missingFiles.length}`);
  
  return true;
}

// Обрабатываем текущую папку
const currentDir = process.cwd();
const folderName = path.basename(currentDir);
processFolderMatching(currentDir, folderName); 