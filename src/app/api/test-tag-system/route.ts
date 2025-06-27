import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { TagDictionaryManager, generateShortFileName } from '../../../agent/tools/figma-tag-dictionary';

// Симулируем анализ GPT-4 для тестирования
function simulateGPTAnalysis(fileName: string) {
  const mockResponses: Record<string, any> = {
    'заяц-новости-путешествия-билеты.png': {
      suggestedTags: [
        'заяц', 'новости', 'путешествия', 'билеты', 'авиакомпания', 'дешевые',
        'быстро', 'удобно', 'безопасно', 'надежно', 'качество', 'сервис',
        'поддержка', 'помощь', 'консультация', 'бронирование', 'оплата',
        'карта', 'банк', 'безналичный', 'наличные', 'рассрочка', 'кредит',
        'льготы', 'пенсионеры', 'студенты', 'молодежь', 'взрослые', 'семейные',
        'корпоративные', 'бизнес', 'эконом', 'комфорт', 'премиум', 'класс',
        'салон', 'место', 'окно', 'проход', 'багаж', 'ручная', 'кладь'
      ],
      contentDescription: 'Рекламное изображение с зайцем для новостей о путешествиях и билетах',
      emotionalTone: 'позитивный',
      usageContext: ['email-маркетинг', 'новости', 'путешествия'],
      confidence: 0.95,
      reasoning: 'Изображение содержит персонажа-зайца и тематику путешествий'
    },
    'дешевые-билеты-москва-батуми.png': {
      suggestedTags: [
        'дешевые', 'билеты', 'москва', 'батуми', 'акция', 'скидка',
        'предложение', 'лето', 'отпуск', 'море', 'пляж', 'солнце',
        'отдых', 'релакс', 'спокойствие', 'красота', 'природа',
        'грузия', 'кавказ', 'горы', 'культура', 'история', 'вино',
        'кухня', 'гостеприимство', 'традиции', 'архитектура', 'тбилиси',
        'старый', 'город', 'крепость', 'церковь', 'монастырь'
      ],
      contentDescription: 'Предложение дешевых билетов по маршруту Москва-Батуми',
      emotionalTone: 'срочный',
      usageContext: ['email-маркетинг', 'акции', 'направления'],
      confidence: 0.92,
      reasoning: 'Акционное предложение с конкретным маршрутом'
    },
    'летние-предложения-отпуск-семья.png': {
      suggestedTags: [
        'летние', 'предложения', 'отпуск', 'семья', 'дети', 'родители',
        'каникулы', 'школьники', 'студенты', 'отдых', 'развлечения',
        'аттракционы', 'парки', 'музеи', 'экскурсии', 'туры',
        'гиды', 'программы', 'активности', 'спорт', 'игры',
        'фестивали', 'концерты', 'шоу', 'представления', 'анимация',
        'детский', 'клуб', 'няня', 'присмотр', 'безопасность'
      ],
      contentDescription: 'Летние семейные предложения для отпуска с детьми',
      emotionalTone: 'дружелюбный',
      usageContext: ['email-маркетинг', 'семейные туры', 'лето'],
      confidence: 0.88,
      reasoning: 'Семейная тематика с акцентом на летний отдых'
    }
  };

  return mockResponses[fileName] || mockResponses['заяц-новости-путешествия-билеты.png'];
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Запуск тестирования системы тегов...');

    const testDir = path.join(process.cwd(), 'test-images');
    
    // Проверяем, существует ли директория с тестовыми изображениями
    try {
      await fs.access(testDir);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Тестовые изображения не найдены. Запустите create-test-images.js сначала.'
      }, { status: 400 });
    }

    const tagManager = new TagDictionaryManager(testDir);
    const dictionary = await tagManager.loadOrCreateDictionary();

    // Получаем список PNG файлов
    const allFiles = await fs.readdir(testDir);
    const pngFiles = allFiles.filter(f => f.endsWith('.png') && !f.includes('tag-dictionary'));

    console.log(`📁 Найдено ${pngFiles.length} PNG файлов для обработки`);

    const results = [];

    for (const fileName of pngFiles) {
      console.log(`\n🔍 Обрабатываем: ${fileName}`);
      
      // Симулируем анализ GPT-4
      const aiAnalysis = simulateGPTAnalysis(fileName);
      
      console.log(`🏷️ GPT-4 предложил ${aiAnalysis.suggestedTags.length} тегов`);

      // Генерируем короткое имя
      const { shortName, selectedTags } = generateShortFileName(aiAnalysis.suggestedTags);
      
      console.log(`📄 Короткое имя: ${shortName}.png`);
      console.log(`📊 Использовано ${selectedTags.length} из ${aiAnalysis.suggestedTags.length} тегов`);

      // Добавляем в словарь
      const entry = tagManager.addEntry(
        shortName,
        fileName,
        aiAnalysis.suggestedTags,
        selectedTags,
        {
          contentDescription: aiAnalysis.contentDescription,
          emotionalTone: aiAnalysis.emotionalTone,
          usageContext: aiAnalysis.usageContext,
          confidence: aiAnalysis.confidence,
          reasoning: aiAnalysis.reasoning
        },
        {
          figmaNodeId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          componentType: 'TEST_COMPONENT',
          hasVariants: false,
          createdAt: new Date().toISOString()
        }
      );

      dictionary.entries[shortName] = entry;

      // Сохраняем словарь после каждого файла
      await tagManager.saveDictionary(dictionary);
      console.log(`💾 Словарь обновлен после обработки: ${shortName}`);

      // Переименовываем файл
      const oldPath = path.join(testDir, fileName);
      const newPath = path.join(testDir, `${shortName}.png`);
      
      if (fileName !== `${shortName}.png`) {
        try {
          await fs.rename(oldPath, newPath);
          console.log(`📁 Файл переименован: ${fileName} → ${shortName}.png`);
        } catch (error) {
          console.log(`⚠️ Файл уже переименован или недоступен: ${fileName}`);
        }
      }

      results.push({
        originalName: fileName,
        shortName: shortName,
        allTagsCount: aiAnalysis.suggestedTags.length,
        selectedTagsCount: selectedTags.length,
        allTags: aiAnalysis.suggestedTags,
        selectedTags: selectedTags,
        confidence: aiAnalysis.confidence,
        emotionalTone: aiAnalysis.emotionalTone
      });
    }

    // Экспортируем для агента
    const agentExportPath = path.join(testDir, 'agent-file-mapping.json');
    await tagManager.exportForAgent(dictionary, agentExportPath);

    // Получаем финальный список файлов
    const finalFiles = await fs.readdir(testDir);

    return NextResponse.json({
      success: true,
      data: {
        processedFiles: results.length,
        totalTags: dictionary.totalTags,
        totalFiles: dictionary.totalFiles,
        results: results,
        outputDirectory: testDir,
        files: finalFiles,
        dictionary: {
          jsonPath: path.join(testDir, 'tag-dictionary.json'),
          csvPath: path.join(testDir, 'tag-dictionary.csv'),
          agentPath: agentExportPath
        }
      },
      message: `Обработано ${results.length} файлов с ${dictionary.totalTags} уникальными тегами`
    });

  } catch (error) {
    console.error('❌ Ошибка тестирования системы тегов:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const testDir = path.join(process.cwd(), 'test-images');
    
    try {
      const files = await fs.readdir(testDir);
      const tagDictionaryPath = path.join(testDir, 'tag-dictionary.json');
      
      let dictionary = null;
      try {
        const dictionaryData = await fs.readFile(tagDictionaryPath, 'utf-8');
        dictionary = JSON.parse(dictionaryData);
      } catch {
        dictionary = { message: 'Словарь тегов не найден' };
      }

      return NextResponse.json({
        success: true,
        data: {
          testDirectory: testDir,
          files: files,
          dictionary: dictionary
        }
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Тестовая директория не найдена'
      }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 