/**
 * 🌐 EXTERNAL IMAGE AGENT
 * 
 * Поиск и генерация внешних изображений для email-кампаний
 * Интеграция с внешними API и AI-генерацией
 */

export interface ExternalImageSearchParams {
  search_query: string;
  image_requirements: {
    type: 'hero' | 'illustration' | 'icon' | 'background' | 'product';
    size_priority: 'large' | 'medium' | 'small';
    style: 'photo' | 'illustration' | 'vector' | 'cartoon';
    color_scheme?: string[];
    emotional_tone: string;
  };
  technical_requirements: {
    max_size_kb: number;
    min_width: number;
    min_height: number;
    formats: string[];
    mobile_optimized: boolean;
  };
  fallback_generation?: {
    ai_prompt: string;
    style: string;
    fallback_enabled: boolean;
  };
}

export interface ExternalImageResult {
  success: boolean;
  images: Array<{
    url: string;
    source: 'unsplash' | 'pexels' | 'generated' | 'fallback';
    metadata: {
      width: number;
      height: number;
      size_kb: number;
      format: string;
      alt_text: string;
      license: string;
    };
    optimization: {
      mobile_friendly: boolean;
      retina_ready: boolean;
      email_optimized: boolean;
    };
  }>;
  generation_info?: {
    ai_generated: boolean;
    prompt_used: string;
    generation_time_ms: number;
  };
  error?: string;
}

export class ExternalImageAgent {
  private readonly unsplashApiKey: string;
  private readonly pexelsApiKey: string;
  private readonly openaiApiKey: string;

  constructor() {
    this.unsplashApiKey = process.env.UNSPLASH_API_KEY || '';
    this.pexelsApiKey = process.env.PEXELS_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * 🔍 ПОИСК ВНЕШНИХ ИЗОБРАЖЕНИЙ
   * Ищет изображения в Unsplash, Pexels и других источниках
   */
  async searchExternalImages(params: ExternalImageSearchParams): Promise<ExternalImageResult> {
    try {
      console.log(`🔍 Поиск внешних изображений: "${params.search_query}"`);
      
      const results: ExternalImageResult = {
        success: false,
        images: []
      };

      // Поиск в Unsplash
      if (this.unsplashApiKey) {
        const unsplashResults = await this.searchUnsplash(params);
        results.images.push(...unsplashResults);
      }

      // Поиск в Pexels
      if (this.pexelsApiKey) {
        const pexelsResults = await this.searchPexels(params);
        results.images.push(...pexelsResults);
      }

      // ❌ FALLBACK POLICY: do not auto-generate images when none are found
      if (results.images.length === 0) {
        throw new Error('ExternalImageAgent: No external images found and auto-generation is disabled by policy.');
      }

      results.success = results.images.length > 0;
      
      console.log(`✅ Найдено ${results.images.length} изображений`);
      return results;

    } catch (error) {
      console.error('❌ Ошибка поиска внешних изображений:', error);
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * 🎨 ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ С ПОМОЩЬЮ AI
   * Использует DALL-E для создания уникальных изображений
   */
  async generateAIImage(params: ExternalImageSearchParams): Promise<any | null> {
    try {
      if (!this.openaiApiKey) {
        console.log('⚠️ OpenAI API ключ не настроен, пропускаем генерацию');
        return null;
      }

      const prompt = this.buildAIPrompt(params);
      
      // Здесь должен быть вызов DALL-E API
      // Для демонстрации возвращаем заглушку
      console.log(`🎨 AI Prompt: ${prompt}`);
      
      return {
        url: 'https://placeholder.ai-generated-image.com/generated.jpg',
        source: 'generated',
        metadata: {
          width: 800,
          height: 600,
          size_kb: 85,
          format: 'jpg',
          alt_text: `AI-generated image: ${params.search_query}`,
          license: 'Generated'
        },
        optimization: {
          mobile_friendly: true,
          retina_ready: true,
          email_optimized: true
        }
      };

    } catch (error) {
      console.error('❌ Ошибка генерации AI изображения:', error);
      return null;
    }
  }

  private buildAIPrompt(params: ExternalImageSearchParams): string {
    const { search_query, image_requirements } = params;
    
    let prompt = `Create a ${image_requirements.style} style image of ${search_query}`;
    
    if (image_requirements.emotional_tone) {
      prompt += ` with a ${image_requirements.emotional_tone} emotional tone`;
    }
    
    if (image_requirements.color_scheme) {
      prompt += ` using colors: ${image_requirements.color_scheme.join(', ')}`;
    }
    
    prompt += '. The image should be professional, high-quality, and suitable for email marketing.';
    
    return prompt;
  }

  /**
   * 📸 ПОИСК В UNSPLASH
   */
  private async searchUnsplash(params: ExternalImageSearchParams): Promise<any[]> {
    try {
      if (!this.unsplashApiKey) {
        console.log('⚠️ Unsplash API ключ не настроен');
        return [];
      }

      const query = this.translateQueryToEnglish(params.search_query);
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashApiKey}`
        }
      });

      if (!response.ok) {
        console.error('❌ Ошибка Unsplash API:', response.status);
        return [];
      }

      const data = await response.json();
      
      return data.results.map((photo: any) => ({
        url: photo.urls.regular,
        source: 'unsplash',
        metadata: {
          width: photo.width,
          height: photo.height,
          size_kb: this.estimateImageSize(photo.width, photo.height),
          format: 'jpg',
          alt_text: photo.alt_description || params.search_query,
          license: 'Unsplash License'
        },
        optimization: {
          mobile_friendly: true,
          retina_ready: photo.width >= 800,
          email_optimized: this.estimateImageSize(photo.width, photo.height) <= params.technical_requirements.max_size_kb
        }
      }));

    } catch (error) {
      console.error('❌ Ошибка поиска в Unsplash:', error);
      return [];
    }
  }

  /**
   * 📷 ПОИСК В PEXELS
   */
  private async searchPexels(params: ExternalImageSearchParams): Promise<any[]> {
    try {
      if (!this.pexelsApiKey) {
        console.log('⚠️ Pexels API ключ не настроен');
        return [];
      }

      const query = this.translateQueryToEnglish(params.search_query);
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.pexelsApiKey
        }
      });

      if (!response.ok) {
        console.error('❌ Ошибка Pexels API:', response.status);
        return [];
      }

      const data = await response.json();
      
      return data.photos.map((photo: any) => ({
        url: photo.src.large,
        source: 'pexels',
        metadata: {
          width: photo.width,
          height: photo.height,
          size_kb: this.estimateImageSize(photo.width, photo.height),
          format: 'jpg',
          alt_text: `Photo by ${photo.photographer} from Pexels`,
          license: 'Pexels License'
        },
        optimization: {
          mobile_friendly: true,
          retina_ready: photo.width >= 800,
          email_optimized: this.estimateImageSize(photo.width, photo.height) <= params.technical_requirements.max_size_kb
        }
      }));

    } catch (error) {
      console.error('❌ Ошибка поиска в Pexels:', error);
      return [];
    }
  }

  /**
   * 🌍 ПЕРЕВОД ЗАПРОСА НА АНГЛИЙСКИЙ
   */
  private translateQueryToEnglish(query: string): string {
    const translations: Record<string, string> = {
      'путешествие': 'travel',
      'путешествия': 'travel',
      'авиация': 'aviation',
      'самолет': 'airplane',
      'билеты': 'tickets',
      'отпуск': 'vacation',
      'море': 'ocean',
      'горы': 'mountains',
      'город': 'city',
      'заяц': 'rabbit',
      'кролик': 'rabbit',
      'чемодан': 'suitcase',
      'багаж': 'luggage',
      'аэропорт': 'airport',
      'отель': 'hotel',
      'пляж': 'beach',
      'солнце': 'sun',
      'счастье': 'happiness',
      'радость': 'joy',
      'веселье': 'fun',
      'семья': 'family',
      'дети': 'children',
      'бизнес': 'business',
      'работа': 'work'
    };

    let translatedQuery = query.toLowerCase();
    
    Object.entries(translations).forEach(([russian, english]) => {
      translatedQuery = translatedQuery.replace(new RegExp(russian, 'gi'), english);
    });

    return translatedQuery;
  }

  /**
   * 📏 ОЦЕНКА РАЗМЕРА ИЗОБРАЖЕНИЯ
   */
  private estimateImageSize(width: number, height: number): number {
    // Примерная оценка размера в KB для JPEG
    const pixels = width * height;
    const bytesPerPixel = 0.5; // Среднее сжатие JPEG
    return Math.round((pixels * bytesPerPixel) / 1024);
  }

  /**
   * 🔧 ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЯ ДЛЯ EMAIL
   */
  async optimizeImageForEmail(
    imageUrl: string,
    targetSizeKb: number = 100
  ): Promise<{
    optimized_url: string;
    original_size_kb: number;
    optimized_size_kb: number;
    compression_ratio: number;
  }> {
    try {
      console.log(`🔧 Оптимизируем изображение для email: ${imageUrl}`);
      
      // Здесь должна быть логика оптимизации изображения
      // Для демонстрации возвращаем заглушку
      
      return {
        optimized_url: imageUrl + '?w=600&q=85', // Добавляем параметры оптимизации
        original_size_kb: 150,
        optimized_size_kb: targetSizeKb,
        compression_ratio: 0.67
      };

    } catch (error) {
      console.error('❌ Ошибка оптимизации изображения:', error);
      throw error;
    }
  }

  /**
   * 📊 ПОЛУЧЕНИЕ СТАТИСТИКИ
   */
  getCapabilities() {
    return {
      sources: {
        unsplash: !!this.unsplashApiKey,
        pexels: !!this.pexelsApiKey,
        ai_generation: !!this.openaiApiKey
      },
      features: [
        'external_image_search',
        'ai_image_generation',
        'image_optimization',
        'multi_source_search',
        'automatic_translation',
        'email_optimization'
      ],
      supported_formats: ['jpg', 'png', 'webp'],
      max_image_size_kb: 200,
      ai_generation_available: !!this.openaiApiKey
    };
  }
} 