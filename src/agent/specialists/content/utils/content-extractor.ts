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
  title?: string;
  description?: string;
  brief_text?: string;
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
   * Извлечение стандартизированного контента
   */
  private extractStandardContent(contentPackage: any): StandardContent {
    
    // Находим источник контента
    const contentSource = contentPackage.content || 
                         contentPackage.generated_content || 
                         contentPackage.email_content ||
                         contentPackage;

    if (!contentSource) {
      throw new Error('ContentExtractor: No content source found in package');
    }

    // Извлекаем subject из различных возможных источников
    let subject = contentSource.subject || 
                  contentSource.email_subject || 
                  contentSource.title ||
                  contentSource.headline ||
                  '';

    // Если subject пустой, извлекаем из содержимого
    if (!subject && contentSource.content) {
      // Попытка извлечь заголовок из первой строки content
      const lines = contentSource.content.split('\n');
      subject = lines[0]?.trim() || '';
    }

    // Извлекаем preheader
    let preheader = contentSource.preheader || 
                    contentSource.email_preheader ||
                    contentSource.subtitle ||
                    contentSource.description ||
                    '';

    // Если preheader пустой, создаем из первого предложения body
    if (!preheader && contentSource.body) {
      const firstSentence = contentSource.body.split('.')[0];
      preheader = firstSentence ? firstSentence.trim() + '.' : '';
    }
    
    // Расширенный поиск body из разных источников
    let body = contentSource.body || 
               contentSource.email_body || 
               contentSource.content_body ||
               contentSource.main_content ||
               contentSource.text ||
               '';

    // Если body по-прежнему пустой, генерируем базовый контент
    // ❌ FALLBACK POLICY: если body отсутствует – ошибка
    if (!body || body.trim() === '') {
      throw new Error('ContentExtractor: Body content is required and cannot be empty');
    }

    // Извлекаем CTA
    const cta = contentSource.cta?.trim() || 
                contentSource.call_to_action?.trim() ||
                contentSource.button_text?.trim() ||
                '';

    // Ensure we have final trimmed values
    subject = subject?.trim() || '';
    preheader = preheader?.trim() || '';
    body = body?.trim() || '';

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
   * Извлечение метаданных
   */
  private extractMetadata(contentPackage: any): ContentMetadata {
    const content = contentPackage.content || contentPackage.generated_content || contentPackage;
    
    const language = this.extractLanguage(contentPackage);
    const tone = this.extractTone(contentPackage);
    const wordCount = this.calculateWordCount(content.body || content.text || '');
    const readingTime = Math.ceil(wordCount / 200); // Средняя скорость чтения 200 слов в минуту

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
    const brandSource = contentPackage.brand_guidelines || 
                       contentPackage.brand || 
                       contentPackage.guidelines ||
                       {};

    return {
      voice_tone: brandSource.voice_tone || brandSource.tone || 'professional',
      key_messages: brandSource.key_messages || brandSource.messages || [],
      compliance_notes: brandSource.compliance_notes || brandSource.notes || []
    };
  }

  /**
   * Извлечение языка
   */
  private extractLanguage(contentPackage: any): 'ru' | 'en' {
    // Проверяем явно указанный язык
    const explicitLanguage = contentPackage.language || 
                            contentPackage.lang || 
                            contentPackage.locale;

    if (explicitLanguage) {
      const normalized = explicitLanguage.toLowerCase().substring(0, 2);
      if (normalized === 'ru' || normalized === 'en') {
        return normalized as 'ru' | 'en';
      }
    }

    // Автоопределение языка по содержимому
    const textToAnalyze = [
      contentPackage.content?.subject,
      contentPackage.content?.body,
      contentPackage.generated_content?.subject,
      contentPackage.generated_content?.body,
      contentPackage.subject,
      contentPackage.body
    ].filter(Boolean).join(' ');

    if (textToAnalyze) {
      return this.isRussianText(textToAnalyze) ? 'ru' : 'en';
    }

    // NO FALLBACK POLICY: Fail fast with clear error
    throw new Error('ContentExtractor: Could not determine language from content package. Language must be explicitly specified.');
  }

  /**
   * Извлечение тона
   */
  private extractTone(contentPackage: any): string {
    // Проверяем явно указанный тон
    const explicitTone = contentPackage.tone || 
                        contentPackage.voice_tone ||
                        contentPackage.brand_guidelines?.voice_tone ||
                        contentPackage.content?.tone;

    if (explicitTone && typeof explicitTone === 'string') {
      return explicitTone;
    }

    // Автоопределение тона по содержимому
    const textToAnalyze = [
      contentPackage.content?.subject,
      contentPackage.content?.body,
      contentPackage.generated_content?.subject,
      contentPackage.generated_content?.body
    ].filter(Boolean).join(' ').toLowerCase();

    // Ключевые слова для определения тона
    if (textToAnalyze.includes('срочно') || textToAnalyze.includes('спешите')) {
      return 'urgent';
    }
    if (textToAnalyze.includes('эксклюзив') || textToAnalyze.includes('премиум')) {
      return 'premium';
    }
    if (textToAnalyze.includes('друз') || textToAnalyze.includes('привет')) {
      return 'friendly';
    }

    return 'professional';
  }

  /**
   * Подсчет слов
   */
  private calculateWordCount(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // Удаляем HTML теги и лишние пробелы
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText === '') {
      return 0;
    }

    return cleanText.split(' ').length;
  }

  /**
   * Определение русского текста
   */
  private isRussianText(text: string): boolean {
    // const _russianPattern = /[а-яё]/i;
    const russianMatches = (text.match(/[а-яё]/gi) || []).length;
    const totalLetters = (text.match(/[a-zа-яё]/gi) || []).length;
    
    return russianMatches > totalLetters * 0.3;
  }

  /**
   * Валидация извлеченного контента
   */
  validateExtractedContent(extracted: ExtractedContentPackage): void {
    const { content, metadata } = extracted;
    
    // Валидация обязательных полей
    if (!content.subject || content.subject.trim() === '') {
      throw new Error('ContentExtractor: Subject is required');
    }
    
    if (!content.body || content.body.trim() === '') {
      throw new Error('ContentExtractor: Body content is required');
    }
    
    if (!content.cta || content.cta.trim() === '') {
      throw new Error('ContentExtractor: CTA is required');
    }

    // Валидация минимальной длины
    if (content.subject.length < 10) {
      throw new Error('ContentExtractor: Subject too short (minimum 10 characters)');
    }
    
    if (content.body.length < 50) {
      throw new Error('ContentExtractor: Body content too short (minimum 50 characters)');
    }

    // Валидация метаданных
    if (metadata.word_count < 10) {
      throw new Error('ContentExtractor: Content too short for email campaign');
    }
  }

  /**
   * Статистика извлечения
   */
  getExtractionStats(extracted: ExtractedContentPackage) {
    return {
      content_length: extracted.content.body.length,
      word_count: extracted.metadata.word_count,
      reading_time: extracted.metadata.reading_time,
      language: extracted.metadata.language,
      tone: extracted.metadata.tone,
      has_brand_guidelines: extracted.brand_guidelines.key_messages.length > 0
    };
  }
} 