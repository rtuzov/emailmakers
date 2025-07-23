import { promises as fs } from 'fs';
import path from 'path';

// Define ToolResult locally to avoid circular dependency
// interface ToolResult {
//   success: boolean;
//   data?: any;
//   error?: string;
//   metadata?: Record<string, any>;
// }

/**
 * Интерфейс для записи в словаре тегов
 */
export interface TagDictionaryEntry {
  originalName: string;
  shortName: string;
  allTags: string[];
  selectedTags: string[];
  aiAnalysis: {
    contentDescription: string;
    emotionalTone: string;
    usageContext: string[];
    confidence: number;
    reasoning: string;
  };
  metadata: {
    figmaNodeId: string;
    componentType: string;
    hasVariants: boolean;
    createdAt: string;
    fileSize?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

/**
 * Интерфейс для всего словаря
 */
export interface TagDictionary {
  version: string;
  createdAt: string;
  updatedAt: string;
  totalFiles: number;
  totalTags: number;
  uniqueTags: string[];
  entries: Record<string, TagDictionaryEntry>;
}

/**
 * Класс для работы со словарем тегов
 */
export class TagDictionaryManager {
  private dictionaryPath: string;
  private csvPath: string;

  constructor(outputDir: string) {
    this.dictionaryPath = path.join(outputDir, 'tag-dictionary.json');
    this.csvPath = path.join(outputDir, 'tag-dictionary.csv');
  }

  /**
   * Создает новый словарь или загружает существующий
   */
  async loadOrCreateDictionary(): Promise<TagDictionary> {
    try {
      const data = await fs.readFile(this.dictionaryPath, 'utf-8');
      const dictionary = JSON.parse(data) as TagDictionary;
      console.log(`📖 Загружен существующий словарь с ${dictionary.totalFiles} файлами`);
      return dictionary;
    } catch (error) {
      console.log('📝 Создаем новый словарь тегов');
      return {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalFiles: 0,
        totalTags: 0,
        uniqueTags: [],
        entries: {}
      };
    }
  }

  /**
   * Добавляет запись в словарь
   */
  addEntry(
    shortName: string,
    originalName: string,
    allTags: string[],
    selectedTags: string[],
    aiAnalysis: TagDictionaryEntry['aiAnalysis'],
    metadata: TagDictionaryEntry['metadata']
  ): TagDictionaryEntry {
    const entry: TagDictionaryEntry = {
      originalName,
      shortName,
      allTags,
      selectedTags,
      aiAnalysis,
      metadata
    };

    console.log(`📝 Добавляем в словарь: ${shortName}`);
    console.log(`   Все теги (${allTags.length}): ${allTags.join(', ')}`);
    console.log(`   Выбранные теги (${selectedTags.length}): ${selectedTags.join(', ')}`);

    return entry;
  }

  /**
   * Сохраняет словарь в JSON и CSV форматах
   */
  async saveDictionary(dictionary: TagDictionary): Promise<void> {
    // Обновляем метаданные
    dictionary.updatedAt = new Date().toISOString();
    dictionary.totalFiles = Object.keys(dictionary.entries).length;
    
    // Собираем все уникальные теги
    const allTags = new Set<string>();
    Object.values(dictionary.entries).forEach(entry => {
      entry.allTags.forEach(tag => allTags.add(tag));
    });
    
    dictionary.uniqueTags = Array.from(allTags).sort();
    dictionary.totalTags = dictionary.uniqueTags.length;

    // Сохраняем JSON
    await fs.writeFile(
      this.dictionaryPath, 
      JSON.stringify(dictionary, null, 2),
      'utf-8'
    );

    // Сохраняем CSV
    await this.saveAsCSV(dictionary);

    console.log(`💾 Словарь сохранен:`);
    console.log(`   JSON: ${this.dictionaryPath}`);
    console.log(`   CSV: ${this.csvPath}`);
    console.log(`   Файлов: ${dictionary.totalFiles}`);
    console.log(`   Уникальных тегов: ${dictionary.totalTags}`);
  }

  /**
   * Сохраняет словарь в CSV формате
   */
  private async saveAsCSV(dictionary: TagDictionary): Promise<void> {
    const headers = [
      'Short Name',
      'Original Name',
      'All Tags',
      'Selected Tags',
      'Content Description',
      'Emotional Tone',
      'Usage Context',
      'Confidence',
      'Reasoning',
      'Figma Node ID',
      'Component Type',
      'Has Variants',
      'Created At',
      'File Size',
      'Width',
      'Height'
    ];

    const rows = Object.values(dictionary.entries).map(entry => [
      entry.shortName,
      entry.originalName,
      `"${entry.allTags.join(', ')}"`,
      `"${entry.selectedTags.join(', ')}"`,
      `"${entry.aiAnalysis.contentDescription}"`,
      entry.aiAnalysis.emotionalTone,
      `"${entry.aiAnalysis.usageContext.join(', ')}"`,
      entry.aiAnalysis.confidence,
      `"${entry.aiAnalysis.reasoning}"`,
      entry.metadata.figmaNodeId,
      entry.metadata.componentType,
      entry.metadata.hasVariants,
      entry.metadata.createdAt,
      entry.metadata.fileSize || '',
      entry.metadata.dimensions?.width || '',
      entry.metadata.dimensions?.height || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    await fs.writeFile(this.csvPath, csvContent, 'utf-8');
  }

  /**
   * Поиск файла по тегам
   */
  async findByTags(dictionary: TagDictionary, searchTags: string[]): Promise<TagDictionaryEntry[]> {
    const results: TagDictionaryEntry[] = [];
    
    for (const entry of Object.values(dictionary.entries)) {
      const hasAllTags = searchTags.every(searchTag => 
        entry.allTags.some(tag => 
          tag.toLowerCase().includes(searchTag.toLowerCase())
        )
      );
      
      if (hasAllTags) {
        results.push(entry);
      }
    }

    return results;
  }

  /**
   * Получает статистику по тегам
   */
  getTagStatistics(dictionary: TagDictionary): Record<string, number> {
    const tagCounts: Record<string, number> = {};
    
    Object.values(dictionary.entries).forEach(entry => {
      entry.allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return tagCounts;
  }

  /**
   * Экспортирует словарь для использования в агенте
   */
  async exportForAgent(dictionary: TagDictionary, outputPath: string): Promise<void> {
    const agentData = {
      version: dictionary.version,
      updatedAt: dictionary.updatedAt,
      totalFiles: dictionary.totalFiles,
      fileMapping: {} as Record<string, {
        allTags: string[];
        description: string;
        tone: string;
        confidence: number;
      }>
    };

    // Создаем упрощенный mapping для агента
    Object.values(dictionary.entries).forEach(entry => {
      agentData.fileMapping[entry.shortName] = {
        allTags: entry.allTags,
        description: entry.aiAnalysis.contentDescription,
        tone: entry.aiAnalysis.emotionalTone,
        confidence: entry.aiAnalysis.confidence
      };
    });

    await fs.writeFile(
      outputPath,
      JSON.stringify(agentData, null, 2),
      'utf-8'
    );

    console.log(`🤖 Экспорт для агента сохранен: ${outputPath}`);
  }
}

/**
 * Утилита для генерации короткого имени файла
 */
export function generateShortFileName(allTags: string[], maxLength: number = 247): {
  shortName: string;
  selectedTags: string[];
} {
  const cleanTags = allTags.map(tag => 
    tag.replace(/[^a-zA-Zа-яА-Я0-9\-]/g, '').toLowerCase()
  ).filter(tag => tag.length > 0);

  let shortName = cleanTags.join('-');
  let selectedTags = [...cleanTags];

  if (shortName.length > maxLength) {
    let truncatedName = '';
    selectedTags = [];
    
    for (const tag of cleanTags) {
      const testName = truncatedName ? `${truncatedName}-${tag}` : tag;
      if (testName.length <= maxLength) {
        truncatedName = testName;
        selectedTags.push(tag);
      } else {
        break;
      }
    }
    
    shortName = truncatedName;
  }

  return { shortName, selectedTags };
} 