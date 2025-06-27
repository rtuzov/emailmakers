interface TagOptimizationConfig {
  maxTagsPerFile: number;
  maxFileNameLength: number;
  priorityTags: string[];
  synonymGroups: string[][];
  excludePatterns: string[];
}

interface OptimizedTagResult {
  originalTags: string[];
  optimizedTags: string[];
  shortFileName: string;
  removedDuplicates: string[];
  appliedSynonyms: { [key: string]: string };
}

export class TagOptimizationService {
  private config: TagOptimizationConfig = {
    maxTagsPerFile: 6,
    maxFileNameLength: 80,
    priorityTags: [
      'заяц',
      'билет',
      'авиабилеты', 
      'путешествия',
      'новости',
      'акция',
      'скидка'
    ],
    synonymGroups: [
      ['дешевые', 'дешевыебилеты', 'дешевые_билеты', 'дешевые билеты'],
      ['авиабилет', 'авиабилеты', 'билеты', 'билет'],
      ['путешествие', 'путешествия', 'авиапутешествия'],
      ['новости', 'новости_авиакомпаний', 'новостиавиакомпаний'],
      ['авиаперелет', 'авиаперелеты', 'перелеты', 'дешевые перелеты'],
      ['москва', 'Москва'],
      ['батуми', 'Батуми'],
      ['сочи', 'Сочи'],
      ['питер', 'Питер', 'Санкт-Петербург'],
      ['владикавказ', 'Владикавказ'],
      ['ягадугу', 'Ягадугу', 'Ягодугу'],
      ['цена', 'цена_3000', '3000рублей', '3000руб']
    ],
    excludePatterns: [
      'яркий',
      'зеленый', 
      'дружелюбный',
      'позитивный',
      'позитив',
      'веселый',
      'анимация',
      'иллюстрация',
      'маршрут',
      'юмор',
      'бронирование',
      'предложение',
      'спецпредложение'
    ]
  };

  /**
   * Оптимизирует теги, удаляя дубли и применяя синонимы
   */
  optimizeTags(tags: string[], hasRabbit: boolean = true): OptimizedTagResult {
    const originalTags = [...tags];
    let processedTags = [...tags];
    const removedDuplicates: string[] = [];
    const appliedSynonyms: { [key: string]: string } = {};

    // 1. Удаляем теги-исключения
    processedTags = processedTags.filter(tag => {
      const shouldExclude = this.config.excludePatterns.some(pattern => 
        tag.toLowerCase().includes(pattern.toLowerCase())
      );
      if (shouldExclude) {
        removedDuplicates.push(tag);
      }
      return !shouldExclude;
    });

    // 2. Применяем группы синонимов
    processedTags = processedTags.map(tag => {
      for (const synonymGroup of this.config.synonymGroups) {
        const matchedSynonym = synonymGroup.find(synonym => 
          tag.toLowerCase() === synonym.toLowerCase()
        );
        if (matchedSynonym && matchedSynonym !== synonymGroup[0]) {
          appliedSynonyms[tag] = synonymGroup[0];
          return synonymGroup[0];
        }
      }
      return tag;
    });

    // 3. Удаляем дубли после применения синонимов
    const uniqueTags = Array.from(new Set(processedTags.map(tag => tag.toLowerCase())))
      .map(lowerTag => processedTags.find(tag => tag.toLowerCase() === lowerTag)!)
      .filter(Boolean);

    // 4. Удаляем "заяц" если его нет на изображении
    let finalTags = uniqueTags;
    if (!hasRabbit) {
      finalTags = finalTags.filter(tag => tag.toLowerCase() !== 'заяц');
    }

    // 5. Приоритизируем теги
    const priorityTags = finalTags.filter(tag => 
      this.config.priorityTags.some(priority => 
        tag.toLowerCase().includes(priority.toLowerCase())
      )
    );
    const otherTags = finalTags.filter(tag => 
      !this.config.priorityTags.some(priority => 
        tag.toLowerCase().includes(priority.toLowerCase())
      )
    );

    // 6. Ограничиваем количество тегов
    const optimizedTags = [
      ...priorityTags.slice(0, 4),
      ...otherTags.slice(0, this.config.maxTagsPerFile - priorityTags.length)
    ].slice(0, this.config.maxTagsPerFile);

    // 7. Создаем короткое имя файла
    const shortFileName = this.createShortFileName(optimizedTags);

    return {
      originalTags,
      optimizedTags,
      shortFileName,
      removedDuplicates,
      appliedSynonyms
    };
  }

  /**
   * Создает короткое имя файла из оптимизированных тегов
   */
  private createShortFileName(tags: string[]): string {
    const fileName = tags
      .map(tag => tag.toLowerCase().replace(/\s+/g, ''))
      .join('-');
    
    if (fileName.length <= this.config.maxFileNameLength) {
      return fileName;
    }

    // Если имя слишком длинное, берем только первые теги
    let shortName = '';
    for (const tag of tags) {
      const tagFormatted = tag.toLowerCase().replace(/\s+/g, '');
      if ((shortName + '-' + tagFormatted).length <= this.config.maxFileNameLength) {
        shortName = shortName ? shortName + '-' + tagFormatted : tagFormatted;
      } else {
        break;
      }
    }
    
    return shortName || tags[0]?.toLowerCase().replace(/\s+/g, '') || 'unknown';
  }
}

export default TagOptimizationService; 