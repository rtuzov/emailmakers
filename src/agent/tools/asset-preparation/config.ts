/**
 * 🔧 КОНФИГУРАЦИЯ ASSET MANIFEST - БЕЗ ЗАХАРДКОЖЕННЫХ ПАРАМЕТРОВ
 * 
 * Все параметры настраиваются через переменные окружения
 */

export interface AssetManifestConfig {
  // AI параметры
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  aiSystemPrompt: string;
  aiMaxFiles: number;
  
  // Лимиты файлов
  assetFileLimit: number;
  maxImageSize: number;
  maxTotalSize: number;
  
  // Unsplash API
  unsplashApiKey: string;
  unsplashImagesPerQuery: number;
  
  // Качество и оптимизация
  imageQuality: number;
  compressionLevel: number;
  
  // Email клиенты
  emailClientLimits: {
    gmail: { maxSize: number; formats: string[] };
    outlook: { maxSize: number; formats: string[] };
    appleMail: { maxSize: number; formats: string[] };
    yahooMail: { maxSize: number; formats: string[] };
  };
  
  // Валидация
  minImageWidth: number;
  maxImageWidth: number;
  minImageHeight: number;
  maxImageHeight: number;
  
  // Пороги качества
  minAccessibilityScore: number;
  minEmailCompatibility: number;
  minOptimizationScore: number;
}

/**
 * ✅ КОНФИГУРАЦИЯ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
 */
export function getAssetManifestConfig(): AssetManifestConfig {
  return {
    // AI параметры
    aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
    aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    aiSystemPrompt: process.env.AI_SYSTEM_PROMPT || 'You are an expert in email marketing and visual asset curation.',
    aiMaxFiles: parseInt(process.env.AI_MAX_FILES || '3'),
    
    // Лимиты файлов
    assetFileLimit: parseInt(process.env.ASSET_FILE_LIMIT || '5'),
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE || '500000'), // 500KB
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE || '5000000'), // 5MB
    
    // Unsplash API
    unsplashApiKey: process.env.UNSPLASH_API_KEY || '',
    unsplashImagesPerQuery: parseInt(process.env.UNSPLASH_IMAGES_PER_QUERY || '1'),
    
    // Качество и оптимизация  
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '80'),
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '80'),
    
    // Email клиенты (настраиваемые лимиты)
    emailClientLimits: {
      gmail: {
        maxSize: parseInt(process.env.GMAIL_MAX_SIZE || '500000'),
        formats: (process.env.GMAIL_FORMATS || 'jpg,png').split(',')
      },
      outlook: {
        maxSize: parseInt(process.env.OUTLOOK_MAX_SIZE || '400000'),
        formats: (process.env.OUTLOOK_FORMATS || 'jpg,png').split(',')
      },
      appleMail: {
        maxSize: parseInt(process.env.APPLE_MAIL_MAX_SIZE || '600000'),
        formats: (process.env.APPLE_MAIL_FORMATS || 'jpg,png,gif').split(',')
      },
      yahooMail: {
        maxSize: parseInt(process.env.YAHOO_MAIL_MAX_SIZE || '450000'),
        formats: (process.env.YAHOO_MAIL_FORMATS || 'jpg,png').split(',')
      }
    },
    
    // Валидация
    minImageWidth: parseInt(process.env.MIN_IMAGE_WIDTH || '50'),
    maxImageWidth: parseInt(process.env.MAX_IMAGE_WIDTH || '600'),
    minImageHeight: parseInt(process.env.MIN_IMAGE_HEIGHT || '50'),
    maxImageHeight: parseInt(process.env.MAX_IMAGE_HEIGHT || '400'),
    
    // Пороги качества
    minAccessibilityScore: parseInt(process.env.MIN_ACCESSIBILITY_SCORE || '95'),
    minEmailCompatibility: parseInt(process.env.MIN_EMAIL_COMPATIBILITY || '90'),
    minOptimizationScore: parseInt(process.env.MIN_OPTIMIZATION_SCORE || '80')
  };
}

/**
 * 📋 ПРИМЕР .ENV ФАЙЛА
 * 
 * Создайте файл .env в корне проекта с такими параметрами:
 * 
 * # AI Configuration
 * AI_MODEL=gpt-4o-mini
 * AI_TEMPERATURE=0.3
 * AI_MAX_TOKENS=2000
 * AI_MAX_FILES=3
 * 
 * # File Limits
 * ASSET_FILE_LIMIT=5
 * MAX_IMAGE_SIZE=500000
 * MAX_TOTAL_SIZE=5000000
 * 
 * # Unsplash API
 * UNSPLASH_API_KEY=your_unsplash_key_here
 * UNSPLASH_IMAGES_PER_QUERY=1
 * 
 * # Image Quality
 * IMAGE_QUALITY=80
 * COMPRESSION_LEVEL=80
 * 
 * # Email Client Limits
 * GMAIL_MAX_SIZE=500000
 * GMAIL_FORMATS=jpg,png
 * OUTLOOK_MAX_SIZE=400000
 * OUTLOOK_FORMATS=jpg,png
 * 
 * # Image Validation
 * MIN_IMAGE_WIDTH=50
 * MAX_IMAGE_WIDTH=600
 * MIN_IMAGE_HEIGHT=50
 * MAX_IMAGE_HEIGHT=400
 * 
 * # Quality Thresholds
 * MIN_ACCESSIBILITY_SCORE=95
 * MIN_EMAIL_COMPATIBILITY=90
 * MIN_OPTIMIZATION_SCORE=80
 */

export default getAssetManifestConfig; 