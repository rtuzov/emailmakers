import { promises as fs } from 'fs';
import * as path from 'path';

export interface EmailFolder {
  campaignId: string;
  basePath: string;
  assetsPath: string;
  spritePath: string;
  htmlPath: string;
  mjmlPath: string;
  metadataPath: string;
}

export interface EmailFolderMetadata {
  campaign_id: string;
  created_at: string;
  topic: string;
  campaign_type: string;
  target_audience?: string;
  assets_count: number;
  figma_assets_processed: number;
  sprite_slices_generated: number;
  html_size_kb?: number;
  mjml_size_kb?: number;
  generation_time_ms?: number;
  status: 'initializing' | 'processing' | 'completed' | 'failed';
}

/**
 * Email Folder Manager - создает и управляет структурой папок для email кампаний
 */
export class EmailFolderManager {
  /**
   * Создает новую папку для email кампании
   */
  static async createEmailFolder(
    topic: string, 
    campaignType: string = 'promotional',
    traceId?: string
  ): Promise<EmailFolder> {
    const timestamp = Date.now();
    
    // Используем trace_id если предоставлен, иначе генерируем короткий ID
    let campaignId: string;
    if (traceId) {
      // Извлекаем первые 8 символов из trace_id для краткости
      // trace_id имеет формат trace_<32_alphanumeric>, поэтому берем символы после "trace_"
      const traceIdWithoutPrefix = traceId.startsWith('trace_') ? traceId.substring(6) : traceId;
      const shortTraceId = traceIdWithoutPrefix.substring(0, 8);
      campaignId = `email_${timestamp}_${shortTraceId}`;
    } else {
      const shortId = Math.random().toString(36).substring(2, 10);
      campaignId = `email_${timestamp}_${shortId}`;
    }
    
    const basePath = path.resolve(process.cwd(), 'mails', campaignId);
    const assetsPath = path.join(basePath, 'assets');
    const spritePath = path.join(assetsPath, 'sprite-slices');
    
    // Создаем все необходимые папки
    await fs.mkdir(basePath, { recursive: true });
    await fs.mkdir(assetsPath, { recursive: true });
    await fs.mkdir(spritePath, { recursive: true });
    
    const emailFolder: EmailFolder = {
      campaignId,
      basePath,
      assetsPath,
      spritePath,
      htmlPath: path.join(basePath, 'email.html'),
      mjmlPath: path.join(basePath, 'email.mjml'),
      metadataPath: path.join(basePath, 'metadata.json')
    };
    
    // Создаем начальный metadata.json
    const initialMetadata: EmailFolderMetadata = {
      campaign_id: campaignId,
      created_at: new Date().toISOString(),
      topic,
      campaign_type: campaignType,
      assets_count: 0,
      figma_assets_processed: 0,
      sprite_slices_generated: 0,
      status: 'initializing'
    };
    
    await EmailFolderManager.updateMetadata(emailFolder, initialMetadata);
    
    console.log(`📁 Created email folder: ${campaignId}`);
    console.log(`📂 Assets path: ${assetsPath}`);
    
    return emailFolder;
  }
  
  /**
   * Загружает существующую папку email
   */
  static async loadEmailFolder(campaignId: string): Promise<EmailFolder | null> {
    try {
      const basePath = path.resolve(process.cwd(), 'mails', campaignId);
      const assetsPath = path.join(basePath, 'assets');
      const spritePath = path.join(assetsPath, 'sprite-slices');
      
      // Проверяем существование папки
      await fs.access(basePath);
      
      return {
        campaignId,
        basePath,
        assetsPath,
        spritePath,
        htmlPath: path.join(basePath, 'email.html'),
        mjmlPath: path.join(basePath, 'email.mjml'),
        metadataPath: path.join(basePath, 'metadata.json')
      };
    } catch {
      return null;
    }
  }
  
  /**
   * Сохраняет Figma ассет в папку кампании
   */
  static async saveFigmaAsset(
    emailFolder: EmailFolder, 
    assetUrl: string, 
    fileName: string
  ): Promise<string> {
    const assetPath = path.join(emailFolder.assetsPath, fileName);
    
    // Если это URL, скачиваем файл
    if (assetUrl.startsWith('http')) {
      const response = await fetch(assetUrl);
      if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(assetPath, Buffer.from(buffer));
    } else {
      // Если это локальный путь, копируем файл
      await fs.copyFile(assetUrl, assetPath);
    }
    
    console.log(`💾 Saved asset: ${fileName} -> ${assetPath}`);
    return assetPath;
  }
  
  /**
   * Сохраняет результаты sprite splitter
   */
  static async saveSpriteSlices(
    emailFolder: EmailFolder,
    slices: Array<{ filename: string; buffer: Buffer }>,
    manifest: any
  ): Promise<string[]> {
    const savedPaths: string[] = [];
    
    // Сохраняем каждый slice
    for (const slice of slices) {
      const slicePath = path.join(emailFolder.spritePath, slice.filename);
      await fs.writeFile(slicePath, slice.buffer);
      savedPaths.push(slicePath);
      console.log(`🔪 Saved sprite slice: ${slice.filename}`);
    }
    
    // Сохраняем manifest
    const manifestPath = path.join(emailFolder.spritePath, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Saved sprite manifest: ${manifestPath}`);
    
    return savedPaths;
  }
  
  /**
   * Сохраняет HTML email
   */
  static async saveHtml(emailFolder: EmailFolder, html: string): Promise<void> {
    await fs.writeFile(emailFolder.htmlPath, html, 'utf8');
    
    // Обновляем размер в metadata
    const stats = await fs.stat(emailFolder.htmlPath);
    const sizeKb = stats.size / 1024;
    
    await EmailFolderManager.updateMetadata(emailFolder, { 
      html_size_kb: Math.round(sizeKb * 100) / 100 
    });
    
    console.log(`💾 Saved HTML: ${emailFolder.htmlPath} (${sizeKb.toFixed(2)}KB)`);
  }
  
  /**
   * Сохраняет MJML source
   */
  static async saveMjml(emailFolder: EmailFolder, mjml: string): Promise<void> {
    await fs.writeFile(emailFolder.mjmlPath, mjml, 'utf8');
    
    // Обновляем размер в metadata
    const stats = await fs.stat(emailFolder.mjmlPath);
    const sizeKb = stats.size / 1024;
    
    await EmailFolderManager.updateMetadata(emailFolder, { 
      mjml_size_kb: Math.round(sizeKb * 100) / 100 
    });
    
    console.log(`💾 Saved MJML: ${emailFolder.mjmlPath} (${sizeKb.toFixed(2)}KB)`);
  }
  
  /**
   * Обновляет metadata.json
   */
  static async updateMetadata(
    emailFolder: EmailFolder, 
    updates: Partial<EmailFolderMetadata>
  ): Promise<void> {
    let currentMetadata: EmailFolderMetadata;
    
    try {
      const metadataContent = await fs.readFile(emailFolder.metadataPath, 'utf8');
      currentMetadata = JSON.parse(metadataContent);
    } catch {
      // Если файл не существует, создаем базовую структуру
      currentMetadata = {
        campaign_id: emailFolder.campaignId,
        created_at: new Date().toISOString(),
        topic: 'Unknown',
        campaign_type: 'promotional',
        assets_count: 0,
        figma_assets_processed: 0,
        sprite_slices_generated: 0,
        status: 'initializing'
      };
    }
    
    // Обновляем metadata
    const updatedMetadata = { ...currentMetadata, ...updates };
    await fs.writeFile(
      emailFolder.metadataPath, 
      JSON.stringify(updatedMetadata, null, 2),
      'utf8'
    );
  }
  
  /**
   * Получает metadata кампании
   */
  static async getMetadata(emailFolder: EmailFolder): Promise<EmailFolderMetadata> {
    const metadataContent = await fs.readFile(emailFolder.metadataPath, 'utf8');
    return JSON.parse(metadataContent);
  }
  
  /**
   * Получает список всех ассетов в папке
   */
  static async listAssets(emailFolder: EmailFolder): Promise<string[]> {
    try {
      const files = await fs.readdir(emailFolder.assetsPath);
      return files
        .filter(file => file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg'))
        .map(file => path.join(emailFolder.assetsPath, file));
    } catch {
      return [];
    }
  }
  
  /**
   * Получает список sprite slices
   */
  static async listSpriteSlices(emailFolder: EmailFolder): Promise<string[]> {
    try {
      const files = await fs.readdir(emailFolder.spritePath);
      return files
        .filter(file => file.toLowerCase().endsWith('.png'))
        .map(file => path.join(emailFolder.spritePath, file));
    } catch {
      return [];
    }
  }
  
  /**
   * Завершает кампанию и обновляет статус
   */
  static async completeCampaign(
    emailFolder: EmailFolder, 
    generationTimeMs: number,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<void> {
    const assets = await EmailFolderManager.listAssets(emailFolder);
    const spriteSlices = await EmailFolderManager.listSpriteSlices(emailFolder);
    
    await EmailFolderManager.updateMetadata(emailFolder, {
      status,
      generation_time_ms: generationTimeMs,
      assets_count: assets.length,
      sprite_slices_generated: spriteSlices.length
    });
    
    console.log(`🏁 Campaign ${status}: ${emailFolder.campaignId}`);
    console.log(`📊 Final stats: ${assets.length} assets, ${spriteSlices.length} sprite slices`);
  }
  
  /**
   * Получает URL для ассета (для использования в email)
   */
  static getAssetUrl(emailFolder: EmailFolder, fileName: string): string {
    // Возвращаем относительный путь для использования в email
    return `./assets/${fileName}`;
  }
  
  /**
   * Получает полный путь к ассету
   */
  static getAssetPath(emailFolder: EmailFolder, fileName: string): string {
    return path.join(emailFolder.assetsPath, fileName);
  }
}

export default EmailFolderManager; 