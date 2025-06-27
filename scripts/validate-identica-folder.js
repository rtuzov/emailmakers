const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const sharp = require('sharp');

// Загружаем переменные окружения
require('dotenv').config({ path: '.env.local' });

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const IDENTICA_FOLDER = 'figma-all-pages-1750993353363/айдентика';
const TAG_DICTIONARY_PATH = path.join(IDENTICA_FOLDER, 'tag-dictionary.json');

class IdenticalFolderValidator {
  constructor() {
    this.errors = [];
    this.corrections = [];
    this.tagDictionary = null;
  }

  async validateFolder() {
    console.log('🔍 Начинаю валидацию папки айдентика...');
    
    try {
      // Загружаем текущий tag-dictionary
      await this.loadTagDictionary();
      
      // Получаем список всех PNG файлов
      const imageFiles = await this.getImageFiles();
      console.log(`📁 Найдено ${imageFiles.length} изображений для проверки`);
      
      // Проверяем каждое изображение
      for (const imageFile of imageFiles) {
        await this.validateImageEntry(imageFile);
      }
      
      // Исправляем найденные ошибки
      await this.correctErrors();
      
      // Сохраняем исправленный tag-dictionary
      await this.saveCorrections();
      
      console.log('✅ Валидация завершена');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Ошибка при валидации:', error);
    }
  }

  async loadTagDictionary() {
    try {
      const data = fs.readFileSync(TAG_DICTIONARY_PATH, 'utf8');
      this.tagDictionary = JSON.parse(data);
      console.log(`📖 Загружен tag-dictionary с ${Object.keys(this.tagDictionary.entries).length} записями`);
    } catch (error) {
      throw new Error(`Не удалось загрузить tag-dictionary: ${error.message}`);
    }
  }

  async getImageFiles() {
    const files = fs.readdirSync(IDENTICA_FOLDER);
    return files.filter(file => file.endsWith('.png'));
  }

  async validateImageEntry(imageFile) {
    console.log(`🔍 Проверяю: ${imageFile}`);
    
    const fileName = path.parse(imageFile).name;
    const imagePath = path.join(IDENTICA_FOLDER, imageFile);
    
    // Ищем соответствующую запись в tag-dictionary
    const entry = this.findEntryByFileName(fileName);
    
    if (!entry) {
      this.errors.push({
        type: 'missing_entry',
        file: imageFile,
        message: `Отсутствует запись в tag-dictionary для файла ${imageFile}`
      });
      return;
    }

    // Проверяем изображение через OpenAI
    const aiAnalysis = await this.analyzeImageWithAI(imagePath, fileName);
    
    // Сравниваем с текущими данными
    await this.compareWithExisting(entry, aiAnalysis, imageFile);
  }

  findEntryByFileName(fileName) {
    const entries = this.tagDictionary.entries;
    
    // Ищем по shortName или originalName
    for (const [key, entry] of Object.entries(entries)) {
      if (entry.shortName === fileName || 
          entry.originalName === fileName ||
          key === fileName) {
        return { key, ...entry };
      }
    }
    
    return null;
  }

  async analyzeImageWithAI(imagePath, fileName) {
    try {
      // Получаем метаданные изображения
      const imageBuffer = fs.readFileSync(imagePath);
      const metadata = await sharp(imageBuffer).metadata();
      
      // Конвертируем в base64 для отправки в OpenAI
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `
Проанализируй это изображение из папки "айдентика" и предоставь точную информацию:

1. ТЕГИ (3-5 наиболее точных тегов на русском языке):
   - Основная тематика
   - Визуальные элементы
   - Назначение/контекст использования

2. ОПИСАНИЕ КОНТЕНТА:
   - Что изображено
   - Стиль и дизайн
   - Цветовая схема

3. ЭМОЦИОНАЛЬНЫЙ ТОН:
   - позитивный/нейтральный/негативный
   - дружелюбный/формальный/игривый

4. КОНТЕКСТ ИСПОЛЬЗОВАНИЯ:
   - Где можно использовать
   - Для каких целей подходит

5. КАЧЕСТВО И ТЕХНИЧЕСКАЯ ОЦЕНКА:
   - Разрешение и четкость
   - Оптимизация для email
   - Рекомендации по использованию

Файл: ${fileName}
Размер: ${metadata.width}x${metadata.height}

Ответь в формате JSON с полями: tags, contentDescription, emotionalTone, usageContext, technicalAssessment, recommendations.
`;

      const response = await openai.chat.completions.create({
        model: process.env.USAGE_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      let responseContent = response.choices[0].message.content;
      
      // Удаляем markdown блоки если есть
      if (responseContent.includes('```json')) {
        responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      let aiResult;
      try {
        aiResult = JSON.parse(responseContent);
      } catch (parseError) {
        console.error(`❌ Ошибка парсинга JSON для ${fileName}:`, parseError.message);
        console.error('Ответ OpenAI:', responseContent.substring(0, 200) + '...');
        return null;
      }
      
      return {
        ...aiResult,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          fileSize: fs.statSync(imagePath).size
        }
      };
      
    } catch (error) {
      console.error(`❌ Ошибка анализа ${fileName}:`, error.message);
      return null;
    }
  }

  async compareWithExisting(entry, aiAnalysis, imageFile) {
    if (!aiAnalysis) return;

    const issues = [];
    
    // Сравниваем теги
    const currentTags = entry.selectedTags || entry.allTags || [];
    const aiTags = aiAnalysis.tags || [];
    
    const tagsSimilarity = this.calculateTagsSimilarity(currentTags, aiTags);
    if (tagsSimilarity < 0.5) {
      issues.push({
        type: 'tags_mismatch',
        current: currentTags,
        suggested: aiTags,
        similarity: tagsSimilarity
      });
    }

    // Сравниваем описание
    const currentDescription = entry.aiAnalysis?.contentDescription || '';
    const aiDescription = aiAnalysis.contentDescription || '';
    
    if (currentDescription && aiDescription && this.calculateTextSimilarity(currentDescription, aiDescription) < 0.6) {
      issues.push({
        type: 'description_mismatch',
        current: currentDescription,
        suggested: aiDescription
      });
    }

    // Сравниваем эмоциональный тон
    const currentTone = entry.aiAnalysis?.emotionalTone || '';
    const aiTone = aiAnalysis.emotionalTone || '';
    
    if (currentTone !== aiTone) {
      issues.push({
        type: 'tone_mismatch',
        current: currentTone,
        suggested: aiTone
      });
    }

    // Проверяем техническую информацию
    const currentMetadata = entry.imageMetadata?.technical;
    const aiMetadata = aiAnalysis.metadata;
    
    if (currentMetadata && aiMetadata) {
      if (currentMetadata.width !== aiMetadata.width || 
          currentMetadata.height !== aiMetadata.height) {
        issues.push({
          type: 'metadata_mismatch',
          current: `${currentMetadata.width}x${currentMetadata.height}`,
          suggested: `${aiMetadata.width}x${aiMetadata.height}`
        });
      }
    }

    if (issues.length > 0) {
      this.errors.push({
        type: 'content_mismatch',
        file: imageFile,
        entryKey: entry.key,
        issues: issues,
        aiAnalysis: aiAnalysis
      });
    }
  }

  calculateTagsSimilarity(tags1, tags2) {
    if (!tags1.length && !tags2.length) return 1;
    if (!tags1.length || !tags2.length) return 0;
    
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  calculateTextSimilarity(text1, text2) {
    if (!text1 && !text2) return 1;
    if (!text1 || !text2) return 0;
    
    // Приводим к строке если это не строка
    const str1 = String(text1 || '');
    const str2 = String(text2 || '');
    
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  async correctErrors() {
    console.log(`🔧 Исправляю ${this.errors.length} найденных ошибок...`);
    
    for (const error of this.errors) {
      if (error.type === 'content_mismatch') {
        const correction = await this.createCorrection(error);
        if (correction) {
          this.corrections.push(correction);
        }
      }
    }
  }

  async createCorrection(error) {
    const { entryKey, aiAnalysis, issues } = error;
    const currentEntry = this.tagDictionary.entries[entryKey];
    
    if (!currentEntry) return null;

    // Создаем исправленную версию
    const correctedEntry = { ...currentEntry };
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'tags_mismatch':
          // Обновляем теги, если AI уверен в своем анализе
          if (issue.similarity < 0.3) {
            correctedEntry.selectedTags = issue.suggested;
            correctedEntry.allTags = [...new Set([...correctedEntry.allTags, ...issue.suggested])];
          }
          break;
          
        case 'description_mismatch':
          // Обновляем описание
          if (!correctedEntry.aiAnalysis) correctedEntry.aiAnalysis = {};
          correctedEntry.aiAnalysis.contentDescription = issue.suggested;
          break;
          
        case 'tone_mismatch':
          // Обновляем эмоциональный тон
          if (!correctedEntry.aiAnalysis) correctedEntry.aiAnalysis = {};
          correctedEntry.aiAnalysis.emotionalTone = issue.suggested;
          break;
          
        case 'metadata_mismatch':
          // Обновляем метаданные (если есть серьезные расхождения)
          console.log(`⚠️ Обнаружено расхождение в метаданных для ${entryKey}: ${issue.current} vs ${issue.suggested}`);
          break;
      }
    }

    // Добавляем информацию о коррекции
    correctedEntry.correctionInfo = {
      correctedAt: new Date().toISOString(),
      correctedBy: 'AI_Validator_GPT4o-mini',
      originalIssues: issues.map(i => i.type),
      confidence: this.calculateCorrectionConfidence(issues)
    };

    return {
      entryKey,
      originalEntry: currentEntry,
      correctedEntry,
      issues
    };
  }

  calculateCorrectionConfidence(issues) {
    // Рассчитываем уверенность в коррекции на основе типов и количества проблем
    let confidence = 1.0;
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'tags_mismatch':
          confidence -= (1 - issue.similarity) * 0.3;
          break;
        case 'description_mismatch':
          confidence -= 0.2;
          break;
        case 'tone_mismatch':
          confidence -= 0.1;
          break;
        case 'metadata_mismatch':
          confidence -= 0.1;
          break;
      }
    }
    
    return Math.max(0.1, confidence);
  }

  async saveCorrections() {
    if (this.corrections.length === 0) {
      console.log('✅ Ошибок для исправления не найдено');
      return;
    }

    // Применяем коррекции к tag-dictionary
    for (const correction of this.corrections) {
      this.tagDictionary.entries[correction.entryKey] = correction.correctedEntry;
    }

    // Обновляем метаданные
    this.tagDictionary.updatedAt = new Date().toISOString();
    this.tagDictionary.correctionInfo = {
      lastCorrectionAt: new Date().toISOString(),
      correctionsTotalCount: this.corrections.length,
      validationVersion: '2.0.0',
      validatedBy: 'AI_Validator_GPT4o-mini'
    };

    // Создаем бэкап
    const backupPath = TAG_DICTIONARY_PATH.replace('.json', '_backup_before_correction.json');
    fs.writeFileSync(backupPath, JSON.stringify(this.tagDictionary, null, 2));
    console.log(`💾 Создан бэкап: ${backupPath}`);

    // Сохраняем исправленную версию
    fs.writeFileSync(TAG_DICTIONARY_PATH, JSON.stringify(this.tagDictionary, null, 2));
    console.log(`💾 Сохранен исправленный tag-dictionary: ${TAG_DICTIONARY_PATH}`);

    // Сохраняем отчет о коррекциях
    const reportPath = path.join(IDENTICA_FOLDER, 'correction-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      totalCorrections: this.corrections.length,
      corrections: this.corrections,
      errors: this.errors
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Сохранен отчет о коррекциях: ${reportPath}`);
  }

  printSummary() {
    console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
    console.log('==================');
    console.log(`🔍 Проверено файлов: ${Object.keys(this.tagDictionary.entries).length}`);
    console.log(`❌ Найдено ошибок: ${this.errors.length}`);
    console.log(`🔧 Выполнено исправлений: ${this.corrections.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n📝 Типы найденных ошибок:');
      const errorTypes = {};
      this.errors.forEach(error => {
        errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`   • ${type}: ${count}`);
      });
    }
    
    if (this.corrections.length > 0) {
      console.log('\n🔧 Выполненные исправления:');
      this.corrections.forEach((correction, index) => {
        console.log(`   ${index + 1}. ${correction.entryKey}`);
        correction.issues.forEach(issue => {
          console.log(`      - ${issue.type}`);
        });
      });
    }
    
    console.log('\n✅ Валидация завершена успешно!');
  }
}

// Запуск валидации
async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Не установлен OPENAI_API_KEY');
    process.exit(1);
  }

  const validator = new IdenticalFolderValidator();
  await validator.validateFolder();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = IdenticalFolderValidator; 