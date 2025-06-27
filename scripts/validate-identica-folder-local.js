const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IDENTICA_FOLDER = 'figma-all-pages-1750993353363/айдентика';
const TAG_DICTIONARY_PATH = path.join(IDENTICA_FOLDER, 'tag-dictionary.json');

class LocalIdenticalFolderValidator {
  constructor() {
    this.errors = [];
    this.corrections = [];
    this.tagDictionary = null;
    this.imageFiles = [];
  }

  async validateFolder() {
    console.log('🔍 Начинаю локальную валидацию папки айдентика...');
    
    try {
      // Загружаем текущий tag-dictionary
      await this.loadTagDictionary();
      
      // Получаем список всех PNG файлов
      this.imageFiles = await this.getImageFiles();
      console.log(`📁 Найдено ${this.imageFiles.length} изображений для проверки`);
      
      // Проверяем каждое изображение
      for (const imageFile of this.imageFiles) {
        await this.validateImageEntry(imageFile);
      }
      
      // Проверяем структуру данных
      await this.validateDataStructure();
      
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

    // Получаем актуальные метаданные изображения
    const actualMetadata = await this.getImageMetadata(imagePath);
    
    // Сравниваем с сохраненными метаданными
    await this.compareMetadata(entry, actualMetadata, imageFile);
    
    // Проверяем структуру данных записи
    await this.validateEntryStructure(entry, imageFile);
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

  async getImageMetadata(imagePath) {
    try {
      const stats = fs.statSync(imagePath);
      const metadata = await sharp(imagePath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        fileSize: stats.size,
        fileSizeFormatted: this.formatFileSize(stats.size),
        aspectRatio: (metadata.width / metadata.height).toFixed(2),
        orientation: this.getOrientation(metadata.width, metadata.height),
        density: metadata.density || 72,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        colorSpace: metadata.space,
        lastModified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString()
      };
    } catch (error) {
      console.error(`❌ Ошибка получения метаданных ${imagePath}:`, error.message);
      return null;
    }
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getOrientation(width, height) {
    if (width === height) return 'square';
    return width > height ? 'landscape' : 'portrait';
  }

  async compareMetadata(entry, actualMetadata, imageFile) {
    if (!actualMetadata) return;

    const issues = [];
    const storedMetadata = entry.imageMetadata?.technical;
    
    if (!storedMetadata) {
      issues.push({
        type: 'missing_metadata',
        message: 'Отсутствуют технические метаданные'
      });
    } else {
      // Проверяем размеры
      if (storedMetadata.width !== actualMetadata.width || 
          storedMetadata.height !== actualMetadata.height) {
        issues.push({
          type: 'dimensions_mismatch',
          stored: `${storedMetadata.width}x${storedMetadata.height}`,
          actual: `${actualMetadata.width}x${actualMetadata.height}`
        });
      }

      // Проверяем размер файла
      if (Math.abs(storedMetadata.fileSize - actualMetadata.fileSize) > 1000) {
        issues.push({
          type: 'filesize_mismatch',
          stored: storedMetadata.fileSize,
          actual: actualMetadata.fileSize
        });
      }

      // Проверяем формат
      if (storedMetadata.format !== actualMetadata.format) {
        issues.push({
          type: 'format_mismatch',
          stored: storedMetadata.format,
          actual: actualMetadata.format
        });
      }

      // Проверяем aspect ratio
      if (storedMetadata.aspectRatio !== actualMetadata.aspectRatio) {
        issues.push({
          type: 'aspect_ratio_mismatch',
          stored: storedMetadata.aspectRatio,
          actual: actualMetadata.aspectRatio
        });
      }
    }

    if (issues.length > 0) {
      this.errors.push({
        type: 'metadata_mismatch',
        file: imageFile,
        entryKey: entry.key,
        issues: issues,
        actualMetadata: actualMetadata
      });
    }
  }

  async validateEntryStructure(entry, imageFile) {
    const issues = [];
    
    // Проверяем обязательные поля
    const requiredFields = ['shortName', 'allTags', 'selectedTags', 'aiAnalysis', 'metadata'];
    
    for (const field of requiredFields) {
      if (!entry[field]) {
        issues.push({
          type: 'missing_required_field',
          field: field
        });
      }
    }

    // Проверяем структуру aiAnalysis
    if (entry.aiAnalysis) {
      const requiredAiFields = ['contentDescription', 'emotionalTone', 'usageContext', 'confidence'];
      for (const field of requiredAiFields) {
        if (!entry.aiAnalysis[field]) {
          issues.push({
            type: 'missing_ai_analysis_field',
            field: field
          });
        }
      }
    }

    // Проверяем теги
    if (entry.allTags && entry.selectedTags) {
      const missingTags = entry.selectedTags.filter(tag => !entry.allTags.includes(tag));
      if (missingTags.length > 0) {
        issues.push({
          type: 'tags_inconsistency',
          missingTags: missingTags
        });
      }
    }

    // Проверяем наличие анализа
    if (!entry.analysis) {
      issues.push({
        type: 'missing_analysis',
        message: 'Отсутствует блок analysis'
      });
    } else {
      // Проверяем структуру analysis
      const requiredAnalysisFields = ['visual', 'content', 'technical', 'usage', 'scores'];
      for (const field of requiredAnalysisFields) {
        if (!entry.analysis[field]) {
          issues.push({
            type: 'missing_analysis_field',
            field: field
          });
        }
      }
    }

    if (issues.length > 0) {
      this.errors.push({
        type: 'structure_validation',
        file: imageFile,
        entryKey: entry.key,
        issues: issues
      });
    }
  }

  async validateDataStructure() {
    console.log('🔍 Проверяю общую структуру данных...');
    
    // Проверяем наличие всех изображений в tag-dictionary
    const entryFiles = Object.values(this.tagDictionary.entries).map(entry => entry.shortName + '.png');
    const missingInDictionary = this.imageFiles.filter(file => {
      const fileName = path.parse(file).name;
      return !entryFiles.includes(file) && !Object.values(this.tagDictionary.entries).some(entry => 
        entry.shortName === fileName || entry.originalName === fileName
      );
    });

    if (missingInDictionary.length > 0) {
      this.errors.push({
        type: 'missing_dictionary_entries',
        files: missingInDictionary
      });
    }

    // Проверяем наличие файлов для записей в словаре
    const missingFiles = [];
    for (const [key, entry] of Object.entries(this.tagDictionary.entries)) {
      const expectedFile = entry.shortName + '.png';
      if (!this.imageFiles.includes(expectedFile)) {
        missingFiles.push({
          entryKey: key,
          expectedFile: expectedFile
        });
      }
    }

    if (missingFiles.length > 0) {
      this.errors.push({
        type: 'missing_image_files',
        files: missingFiles
      });
    }

    // Проверяем уникальность тегов
    const allTags = [];
    Object.values(this.tagDictionary.entries).forEach(entry => {
      if (entry.allTags) {
        allTags.push(...entry.allTags);
      }
    });

    const uniqueTags = [...new Set(allTags)];
    if (this.tagDictionary.uniqueTags) {
      const storedUniqueTags = this.tagDictionary.uniqueTags;
      const missingInStored = uniqueTags.filter(tag => !storedUniqueTags.includes(tag));
      const extraInStored = storedUniqueTags.filter(tag => !uniqueTags.includes(tag));
      
      if (missingInStored.length > 0 || extraInStored.length > 0) {
        this.errors.push({
          type: 'unique_tags_mismatch',
          missingInStored: missingInStored,
          extraInStored: extraInStored,
          actualUniqueTags: uniqueTags
        });
      }
    }
  }

  async correctErrors() {
    console.log(`🔧 Исправляю ${this.errors.length} найденных ошибок...`);
    
    for (const error of this.errors) {
      const correction = await this.createCorrection(error);
      if (correction) {
        this.corrections.push(correction);
      }
    }
  }

  async createCorrection(error) {
    switch (error.type) {
      case 'metadata_mismatch':
        return this.correctMetadataMismatch(error);
      
      case 'structure_validation':
        return this.correctStructureIssues(error);
      
      case 'unique_tags_mismatch':
        return this.correctUniqueTagsMismatch(error);
      
      case 'missing_dictionary_entries':
        return this.correctMissingDictionaryEntries(error);
        
      default:
        console.log(`⚠️ Не могу исправить ошибку типа: ${error.type}`);
        return null;
    }
  }

  correctMetadataMismatch(error) {
    const { entryKey, actualMetadata, issues } = error;
    const currentEntry = this.tagDictionary.entries[entryKey];
    
    if (!currentEntry) return null;

    const correctedEntry = JSON.parse(JSON.stringify(currentEntry));
    
    // Обновляем технические метаданные
    if (!correctedEntry.imageMetadata) {
      correctedEntry.imageMetadata = {};
    }
    
    correctedEntry.imageMetadata.technical = actualMetadata;
    
    // Обновляем analysis метаданные, если они есть
    if (correctedEntry.analysis && correctedEntry.analysis.technical) {
      correctedEntry.analysis.technical.fileSize = actualMetadata.fileSize;
      correctedEntry.analysis.technical.dimensions = `${actualMetadata.width}x${actualMetadata.height}`;
      
      if (correctedEntry.analysis.technical.file) {
        correctedEntry.analysis.technical.file.sizeBytes = actualMetadata.fileSize;
        correctedEntry.analysis.technical.file.sizeKB = Math.round(actualMetadata.fileSize / 1024);
        correctedEntry.analysis.technical.file.sizeMB = Math.round(actualMetadata.fileSize / (1024 * 1024) * 100) / 100;
      }
    }

    return {
      entryKey,
      correctedEntry,
      issues: issues.map(i => i.type)
    };
  }

  correctStructureIssues(error) {
    const { entryKey, issues } = error;
    const currentEntry = this.tagDictionary.entries[entryKey];
    
    if (!currentEntry) return null;

    const correctedEntry = JSON.parse(JSON.stringify(currentEntry));
    
    for (const issue of issues) {
      switch (issue.type) {
        case 'missing_required_field':
          this.addMissingField(correctedEntry, issue.field);
          break;
          
        case 'missing_ai_analysis_field':
          this.addMissingAiField(correctedEntry, issue.field);
          break;
          
        case 'tags_inconsistency':
          this.fixTagsInconsistency(correctedEntry, issue.missingTags);
          break;
          
        case 'missing_analysis':
          this.addMissingAnalysis(correctedEntry);
          break;
          
        case 'missing_analysis_field':
          this.addMissingAnalysisField(correctedEntry, issue.field);
          break;
      }
    }

    return {
      entryKey,
      correctedEntry,
      issues: issues.map(i => i.type)
    };
  }

  addMissingField(entry, field) {
    switch (field) {
      case 'shortName':
        if (!entry.shortName && entry.originalName) {
          entry.shortName = entry.originalName.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');
        }
        break;
      case 'allTags':
        entry.allTags = entry.selectedTags || [];
        break;
      case 'selectedTags':
        entry.selectedTags = entry.allTags || [];
        break;
      case 'aiAnalysis':
        entry.aiAnalysis = {
          contentDescription: '',
          emotionalTone: 'нейтральный',
          usageContext: [],
          confidence: 0.5
        };
        break;
      case 'metadata':
        entry.metadata = {
          figmaNodeId: '',
          componentType: 'COMPONENT',
          hasVariants: false,
          createdAt: new Date().toISOString()
        };
        break;
    }
  }

  addMissingAiField(entry, field) {
    if (!entry.aiAnalysis) entry.aiAnalysis = {};
    
    switch (field) {
      case 'contentDescription':
        entry.aiAnalysis.contentDescription = '';
        break;
      case 'emotionalTone':
        entry.aiAnalysis.emotionalTone = 'нейтральный';
        break;
      case 'usageContext':
        entry.aiAnalysis.usageContext = [];
        break;
      case 'confidence':
        entry.aiAnalysis.confidence = 0.5;
        break;
    }
  }

  fixTagsInconsistency(entry, missingTags) {
    if (!entry.allTags) entry.allTags = [];
    entry.allTags = [...new Set([...entry.allTags, ...missingTags])];
  }

  addMissingAnalysis(entry) {
    entry.analysis = {
      visual: {
        colors: {},
        composition: {},
        quality: {},
        dimensions: {}
      },
      content: {
        categories: [],
        primaryTheme: 'general',
        contentElements: [],
        complexity: 'single_theme'
      },
      technical: {
        fileSize: 0,
        dimensions: '0x0',
        format: 'png'
      },
      usage: {
        email: {},
        general: {}
      },
      scores: {
        visual: 0,
        content: 0,
        technical: 0,
        overall: 0
      }
    };
  }

  addMissingAnalysisField(entry, field) {
    if (!entry.analysis) this.addMissingAnalysis(entry);
    
    switch (field) {
      case 'visual':
        entry.analysis.visual = {
          colors: {},
          composition: {},
          quality: {},
          dimensions: {}
        };
        break;
      case 'content':
        entry.analysis.content = {
          categories: [],
          primaryTheme: 'general',
          contentElements: [],
          complexity: 'single_theme'
        };
        break;
      case 'technical':
        entry.analysis.technical = {
          fileSize: 0,
          dimensions: '0x0',
          format: 'png'
        };
        break;
      case 'usage':
        entry.analysis.usage = {
          email: {},
          general: {}
        };
        break;
      case 'scores':
        entry.analysis.scores = {
          visual: 0,
          content: 0,
          technical: 0,
          overall: 0
        };
        break;
    }
  }

  correctUniqueTagsMismatch(error) {
    const { actualUniqueTags } = error;
    
    // Обновляем список уникальных тегов
    this.tagDictionary.uniqueTags = actualUniqueTags.sort();
    this.tagDictionary.totalTags = actualUniqueTags.length;
    
    return {
      entryKey: 'global_unique_tags',
      correctedEntry: null,
      issues: ['unique_tags_updated']
    };
  }

  correctMissingDictionaryEntries(error) {
    // Для отсутствующих записей создаем базовые шаблоны
    // Это требует дополнительной логики для создания новых записей
    console.log(`⚠️ Найдены файлы без записей в словаре: ${error.files.join(', ')}`);
    return null;
  }

  async saveCorrections() {
    if (this.corrections.length === 0) {
      console.log('✅ Ошибок для исправления не найдено');
      return;
    }

    // Применяем коррекции к tag-dictionary
    for (const correction of this.corrections) {
      if (correction.entryKey === 'global_unique_tags') {
        // Уже применено выше
        continue;
      }
      
      if (correction.correctedEntry) {
        this.tagDictionary.entries[correction.entryKey] = correction.correctedEntry;
      }
    }

    // Обновляем метаданные
    this.tagDictionary.updatedAt = new Date().toISOString();
    this.tagDictionary.validationInfo = {
      lastValidationAt: new Date().toISOString(),
      correctionsCount: this.corrections.length,
      validationVersion: '1.0.0',
      validatedBy: 'Local_Validator'
    };

    // Создаем бэкап
    const backupPath = TAG_DICTIONARY_PATH.replace('.json', '_backup_before_local_correction.json');
    const originalData = fs.readFileSync(TAG_DICTIONARY_PATH, 'utf8');
    fs.writeFileSync(backupPath, originalData);
    console.log(`💾 Создан бэкап: ${backupPath}`);

    // Сохраняем исправленную версию
    fs.writeFileSync(TAG_DICTIONARY_PATH, JSON.stringify(this.tagDictionary, null, 2));
    console.log(`💾 Сохранен исправленный tag-dictionary: ${TAG_DICTIONARY_PATH}`);

    // Сохраняем отчет о коррекциях
    const reportPath = path.join(IDENTICA_FOLDER, 'local-validation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      totalCorrections: this.corrections.length,
      corrections: this.corrections,
      errors: this.errors,
      imageFiles: this.imageFiles
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📋 Сохранен отчет о валидации: ${reportPath}`);
  }

  printSummary() {
    console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ ЛОКАЛЬНОЙ ВАЛИДАЦИИ:');
    console.log('=====================================');
    console.log(`📁 Найдено изображений: ${this.imageFiles.length}`);
    console.log(`📖 Записей в словаре: ${Object.keys(this.tagDictionary.entries).length}`);
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
        if (correction.issues) {
          correction.issues.forEach(issue => {
            console.log(`      - ${issue}`);
          });
        }
      });
    }
    
    console.log('\n✅ Локальная валидация завершена успешно!');
  }
}

// Запуск валидации
async function main() {
  const validator = new LocalIdenticalFolderValidator();
  await validator.validateFolder();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LocalIdenticalFolderValidator; 