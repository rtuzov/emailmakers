/**
 * 📝 CONTENT EXTRACTOR
 * 
 * Унифицированное извлечение контента из различных структур данных:
 * - Стандартизация форматов контента
 * - Валидация обязательных полей
 * - Трансформация метаданных
 * - Строгая проверка без fallback
 */

export interface StandardContent {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: 'ru' | 'en';
  tone: string;
}

export interface ContentMetadata {
  language: 'ru' | 'en';
  tone: string;
  word_count: number;
  reading_time: number;
}

export interface BrandGuidelines {
  voice_tone: string;
  key_messages: string[];
  compliance_notes: string[];
  color_palette?: string[];
  typography?: string;
  visual_style?: string;
}

export interface ExtractedContentPackage {
  content: StandardContent;
  metadata: ContentMetadata;
  brand_guidelines: BrandGuidelines;
}

export class ContentExtractor {
  
  /**
   * Извлечение контента из входных данных
   */
  extractContent(contentPackage: any): ExtractedContentPackage {
    if (!contentPackage) {
      throw new Error('ContentExtractor: Content package is required');
    }

    const content = this.extractStandardContent(contentPackage);
    const metadata = this.extractMetadata(contentPackage);
    const brandGuidelines = this.extractBrandGuidelines(contentPackage);

    return {
      content,
      metadata,
      brand_guidelines: brandGuidelines
    };
  }

  /**
   * Извлечение стандартного контента
   */
  private extractStandardContent(contentPackage: any): StandardContent {
    // Определяем источник контента на основе реальной структуры данных
    const contentSource = contentPackage.content || contentPackage.content_package?.complete_content || contentPackage;
    
    const body = contentSource.body || contentSource.email_body || '';

    if (!body || body.trim() === '') {
      throw new Error('ContentExtractor: Body is required and cannot be empty');
    }

    // Извлекаем обязательные поля из правильного источника
    const subject = contentSource.subject?.trim();
    const preheader = contentSource.preheader?.trim();
    const cta = contentSource.cta?.trim();

    // Строгая валидация без fallback
    if (!subject) {
      throw new Error('ContentExtractor: Subject is required and cannot be empty');
    }
    if (!preheader) {
      throw new Error('ContentExtractor: Preheader is required and cannot be empty');
    }
    if (!cta) {
      throw new Error('ContentExtractor: CTA is required and cannot be empty');
    }

    // Дополнительная валидация длины
    if (subject.length < 3) {
      throw new Error('ContentExtractor: Subject must be at least 3 characters long');
    }
    if (preheader.length < 3) {
      throw new Error('ContentExtractor: Preheader must be at least 3 characters long');
    }
    if (body.length < 10) {
      throw new Error('ContentExtractor: Body must be at least 10 characters long');
    }
    if (cta.length < 2) {
      throw new Error('ContentExtractor: CTA must be at least 2 characters long');
    }

    // Извлекаем язык и тон
    const language = this.extractLanguage(contentPackage);
    const tone = this.extractTone(contentPackage);

    return {
      subject,
      preheader,
      body,
      cta,
      language,
      tone
    };
  }

  /**
   * Извлечение метаданных контента
   */
  private extractMetadata(contentPackage: any): ContentMetadata {
    const metadataSource = contentPackage.content_package?.content_metadata ||
                          contentPackage.content_metadata || 
                          contentPackage.metadata || 
                          {};

    const language = this.extractLanguage(contentPackage);
    const tone = this.extractTone(contentPackage);
    
    // Вычисляем word_count если отсутствует
    let wordCount = metadataSource.word_count;
    if (!wordCount || wordCount === 0) {
      const body = contentPackage.complete_content?.body || 
                  contentPackage.content?.body || 
                  contentPackage.body || '';
      
      if (!body) {
        throw new Error('ContentExtractor: Cannot calculate word count - body content missing');
      }
      
      wordCount = this.calculateWordCount(body);
    }

    if (wordCount === 0) {
      throw new Error('ContentExtractor: Word count must be greater than 0');
    }

    // Вычисляем reading_time
    const readingTime = metadataSource.reading_time || Math.ceil(wordCount / 200); // 200 words per minute

    return {
      language,
      tone,
      word_count: wordCount,
      reading_time: readingTime
    };
  }

  /**
   * Извлечение брендовых рекомендаций
   */
  private extractBrandGuidelines(contentPackage: any): BrandGuidelines {
    const brandSource = contentPackage.content_package?.brand_guidelines ||
                       contentPackage.brand_guidelines || {};

    return {
      voice_tone: brandSource.voice_tone || 'professional',
      key_messages: Array.isArray(brandSource.key_messages) ? brandSource.key_messages : [],
      compliance_notes: Array.isArray(brandSource.compliance_notes) ? brandSource.compliance_notes : [],
      color_palette: Array.isArray(brandSource.color_palette) ? brandSource.color_palette : undefined,
      typography: brandSource.typography || undefined,
      visual_style: brandSource.visual_style || undefined
    };
  }

  /**
   * Определение языка контента
   */
  private extractLanguage(contentPackage: any): 'ru' | 'en' {
    // Проверяем различные источники языка (включая вложенные структуры)
    const languageFromMeta = contentPackage.content_package?.content_metadata?.language ||
                            contentPackage.content_metadata?.language || 
                            contentPackage.metadata?.language;
    const languageFromContent = contentPackage.content_package?.complete_content?.language ||
                               contentPackage.complete_content?.language || 
                               contentPackage.content?.language;
    const languageFromPackage = contentPackage.language;

    const language = languageFromMeta || languageFromContent || languageFromPackage;

    // Валидируем и нормализуем язык
    if (language === 'ru' || language === 'russian') {
      return 'ru';
    }
    if (language === 'en' || language === 'english') {
      return 'en';
    }

    // Попытка автоопределения языка по контенту
    const content = contentPackage.complete_content?.subject || 
                   contentPackage.content?.subject || 
                   contentPackage.subject || '';

    if (this.isRussianText(content)) {
      return 'ru';
    }

    // По умолчанию русский для нашего проекта
    return 'ru';
  }

  /**
   * Определение тона контента
   */
  private extractTone(contentPackage: any): string {
    const toneFromMeta = contentPackage.content_package?.content_metadata?.tone ||
                        contentPackage.content_metadata?.tone || 
                        contentPackage.metadata?.tone;
    const toneFromContent = contentPackage.content_package?.complete_content?.tone ||
                           contentPackage.complete_content?.tone || 
                           contentPackage.content?.tone;
    const toneFromPackage = contentPackage.tone;

    const tone = toneFromMeta || toneFromContent || toneFromPackage;

    if (!tone) {
      throw new Error('ContentExtractor: Tone is required but not found in content package');
    }

    // Валидируем тон
    const validTones = ['friendly', 'professional', 'casual', 'formal', 'urgent', 'enthusiastic'];
    if (!validTones.includes(tone)) {
      throw new Error(`ContentExtractor: Invalid tone "${tone}". Must be one of: ${validTones.join(', ')}`);
    }

    return tone;
  }

  /**
   * Подсчет количества слов
   */
  private calculateWordCount(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Убираем HTML теги и лишние пробелы
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Убираем HTML теги
      .replace(/\s+/g, ' ')    // Заменяем множественные пробелы на одинарные
      .trim();

    if (!cleanText) {
      return 0;
    }

    // Разделяем по пробелам и фильтруем пустые строки
    const words = cleanText.split(' ').filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Проверка на русский текст
   */
  private isRussianText(text: string): boolean {
    if (!text) return false;
    
    // Проверяем наличие кириллических символов
    const cyrillicPattern = /[а-яё]/i;
    return cyrillicPattern.test(text);
  }

  /**
   * Валидация извлеченного контента
   */
  validateExtractedContent(extracted: ExtractedContentPackage): void {
    // Проверяем основной контент
    if (!extracted.content.subject || extracted.content.subject.length < 3) {
      throw new Error('ContentExtractor: Invalid subject in extracted content');
    }
    if (!extracted.content.preheader || extracted.content.preheader.length < 3) {
      throw new Error('ContentExtractor: Invalid preheader in extracted content');
    }
    if (!extracted.content.body || extracted.content.body.length < 10) {
      throw new Error('ContentExtractor: Invalid body in extracted content');
    }
    if (!extracted.content.cta || extracted.content.cta.length < 2) {
      throw new Error('ContentExtractor: Invalid CTA in extracted content');
    }

    // Проверяем метаданные
    if (extracted.metadata.word_count <= 0) {
      throw new Error('ContentExtractor: Invalid word count in metadata');
    }
    if (extracted.metadata.reading_time <= 0) {
      throw new Error('ContentExtractor: Invalid reading time in metadata');
    }
    if (!['ru', 'en'].includes(extracted.metadata.language)) {
      throw new Error('ContentExtractor: Invalid language in metadata');
    }
  }

  /**
   * Статистика извлечения
   */
  getExtractionStats(extracted: ExtractedContentPackage) {
    return {
      content_length: {
        subject: extracted.content.subject.length,
        preheader: extracted.content.preheader.length,
        body: extracted.content.body.length,
        cta: extracted.content.cta.length
      },
      metadata: {
        language: extracted.metadata.language,
        tone: extracted.metadata.tone,
        word_count: extracted.metadata.word_count,
        reading_time: extracted.metadata.reading_time
      },
      brand_guidelines: {
        has_color_palette: !!extracted.brand_guidelines.color_palette,
        has_typography: !!extracted.brand_guidelines.typography,
        key_messages_count: extracted.brand_guidelines.key_messages.length,
        compliance_notes_count: extracted.brand_guidelines.compliance_notes.length
      }
    };
  }
} 