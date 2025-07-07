/**
 * 📁 FILE PATH CONSTANTS
 * 
 * Стандартизированные пути для файловой системы
 * Заменяет hardcoded пути в соответствии с fail-fast политикой
 */

import * as path from 'path';

/**
 * Базовые директории проекта
 */
export const BASE_PATHS = {
  PROJECT_ROOT: process.cwd(),
  MAILS_DIR: path.join(process.cwd(), 'mails'),
  TEMP_DIR: path.join(process.cwd(), 'temp'),
  LOGS_DIR: path.join(process.cwd(), 'logs'),
  ASSETS_DIR: path.join(process.cwd(), 'assets'),
  TEST_RESULTS_DIR: path.join(process.cwd(), 'test-results'),
  TEST_OUTPUTS_DIR: path.join(process.cwd(), 'test-outputs')
} as const;

/**
 * Структура папки кампании
 */
export const CAMPAIGN_STRUCTURE = {
  /**
   * Получить базовую папку кампании
   */
  getCampaignDir: (campaignId: string) => path.join(BASE_PATHS.MAILS_DIR, campaignId),
  
  /**
   * Получить папку финальной доставки
   */
  getFinalDeliveryDir: (campaignId: string) => path.join(BASE_PATHS.MAILS_DIR, campaignId, 'final-delivery'),
  
  /**
   * Получить папку скриншотов
   */
  getScreenshotsDir: (campaignId: string) => path.join(BASE_PATHS.MAILS_DIR, campaignId, 'screenshots'),
  
  /**
   * Получить папку ассетов
   */
  getAssetsDir: (campaignId: string) => path.join(BASE_PATHS.MAILS_DIR, campaignId, 'assets')
} as const;

/**
 * Стандартные имена файлов
 */
export const FILE_NAMES = {
  EMAIL_HTML: 'email.html',
  EMAIL_MJML: 'email.mjml',
  EMAIL_FINAL_HTML: 'email-final.html',
  EMAIL_FINAL_MJML: 'email-final.mjml',
  CAMPAIGN_METADATA: 'campaign-metadata.json',
  CONTENT_DATA: 'content-data.json',
  DELIVERY_MANIFEST: 'delivery-manifest.json'
} as const;

/**
 * Приоритетные пути поиска файлов email
 * ВАЖНО: Система должна fail если файл не найден - НЕТ FALLBACK
 */
export class EmailFilePaths {
  private readonly campaignId: string;
  
  constructor(campaignId: string) {
    if (!campaignId || typeof campaignId !== 'string') {
      throw new Error('Campaign ID is required and must be a valid string');
    }
    this.campaignId = campaignId;
  }
  
  /**
   * Получить возможные пути для HTML файла
   * Возвращает массив путей в порядке приоритета
   */
  getHtmlFilePaths(): string[] {
    return [
      path.join(CAMPAIGN_STRUCTURE.getCampaignDir(this.campaignId), FILE_NAMES.EMAIL_HTML),
      path.join(CAMPAIGN_STRUCTURE.getFinalDeliveryDir(this.campaignId), FILE_NAMES.EMAIL_FINAL_HTML),
      path.join(CAMPAIGN_STRUCTURE.getFinalDeliveryDir(this.campaignId), FILE_NAMES.EMAIL_HTML)
    ];
  }
  
  /**
   * Получить возможные пути для MJML файла
   * Возвращает массив путей в порядке приоритета
   */
  getMjmlFilePaths(): string[] {
    return [
      path.join(CAMPAIGN_STRUCTURE.getCampaignDir(this.campaignId), FILE_NAMES.EMAIL_MJML),
      path.join(CAMPAIGN_STRUCTURE.getFinalDeliveryDir(this.campaignId), FILE_NAMES.EMAIL_FINAL_MJML),
      path.join(CAMPAIGN_STRUCTURE.getFinalDeliveryDir(this.campaignId), FILE_NAMES.EMAIL_MJML)
    ];
  }
  
  /**
   * Получить путь к папке скриншотов
   */
  getScreenshotsDir(): string {
    return CAMPAIGN_STRUCTURE.getScreenshotsDir(this.campaignId);
  }
  
  /**
   * Получить путь к папке ассетов
   */
  getAssetsDir(): string {
    return CAMPAIGN_STRUCTURE.getAssetsDir(this.campaignId);
  }
  
  /**
   * Получить путь к файлу метаданных кампании
   */
  getMetadataFilePath(): string {
    return path.join(CAMPAIGN_STRUCTURE.getCampaignDir(this.campaignId), FILE_NAMES.CAMPAIGN_METADATA);
  }
  
  /**
   * Получить путь к файлу данных контента
   */
  getContentDataFilePath(): string {
    return path.join(CAMPAIGN_STRUCTURE.getCampaignDir(this.campaignId), FILE_NAMES.CONTENT_DATA);
  }
  
  /**
   * Получить путь к манифесту доставки
   */
  getDeliveryManifestPath(): string {
    return path.join(CAMPAIGN_STRUCTURE.getFinalDeliveryDir(this.campaignId), FILE_NAMES.DELIVERY_MANIFEST);
  }
}

/**
 * Утилита для проверки существования файлов
 * FAIL-FAST: Не предоставляет fallback значения
 */
export class FileValidator {
  /**
   * Найти первый существующий файл из списка путей
   * @param filePaths Массив путей для проверки
   * @returns Путь к первому найденному файлу
   * @throws Error если ни один файл не найден
   */
  static async findExistingFile(filePaths: string[]): Promise<string> {
    const fs = await import('fs/promises');
    
    for (const filePath of filePaths) {
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // Файл не существует, продолжаем поиск
      }
    }
    
    throw new Error(`No file found in any of the specified paths: ${filePaths.join(', ')}`);
  }
  
  /**
   * Проверить существование файла
   * @param filePath Путь к файлу
   * @returns true если файл существует
   * @throws Error если файл не найден
   */
  static async validateFileExists(filePath: string): Promise<boolean> {
    const fs = await import('fs/promises');
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      throw new Error(`Required file not found: ${filePath}`);
    }
  }
  
  /**
   * Проверить существование директории
   * @param dirPath Путь к директории
   * @returns true если директория существует
   * @throws Error если директория не найдена
   */
  static async validateDirectoryExists(dirPath: string): Promise<boolean> {
    const fs = await import('fs/promises');
    
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${dirPath}`);
      }
      return true;
    } catch {
      throw new Error(`Required directory not found: ${dirPath}`);
    }
  }
}

/**
 * Генератор путей для новых файлов
 */
export class FilePathGenerator {
  /**
   * Генерировать уникальное имя файла с timestamp
   */
  static generateTimestampedFileName(baseName: string, extension: string): string {
    const timestamp = Date.now();
    return `${baseName}-${timestamp}.${extension}`;
  }
  
  /**
   * Генерировать путь для скриншота
   */
  static generateScreenshotPath(campaignId: string, viewport: 'desktop' | 'mobile', timestamp?: number): string {
    const ts = timestamp || Date.now();
    const fileName = `email-${viewport}-${ts}.png`;
    return path.join(CAMPAIGN_STRUCTURE.getScreenshotsDir(campaignId), fileName);
  }
  
  /**
   * Генерировать путь для архива
   */
  static generateArchivePath(campaignId: string, format: 'zip' | 'tar' = 'zip'): string {
    const timestamp = Date.now();
    const fileName = `${campaignId}-archive-${timestamp}.${format}`;
    return path.join(BASE_PATHS.TEMP_DIR, fileName);
  }
} 