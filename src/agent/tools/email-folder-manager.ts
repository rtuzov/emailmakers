import { promises as fs } from 'fs';
import * as path from 'path';
import { AssetHashManager } from '../utils/asset-hash-manager';

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
  shared_assets_used: number;
  asset_hashes: string[];
  html_size_kb?: number;
  mjml_size_kb?: number;
  generation_time_ms?: number;
  status: 'initializing' | 'processing' | 'completed' | 'failed';
}

/**
 * Email Folder Manager - создает и управляет структурой папок для email кампаний
 */
export default class EmailFolderManager {
  /**
   * Создает новую папку для email кампании
   */
  static async createEmailFolder(
    topic: string, 
    campaignType: string = 'promotional',
    traceId?: string
  ): Promise<EmailFolder> {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Очистка топика для создания имени папки
    const cleanTopic = topic
      .toLowerCase()
      .replace(/[^a-z0-9а-я\s]/g, '') // Убираем специальные символы
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .substring(0, 50); // Ограничиваем длину
    
    // Создаем УНИКАЛЬНЫЙ campaignId с timestamp для предотвращения переиспользования
    let campaignId: string;
    const timestamp = Date.now().toString(36); // Короткий timestamp в base36
    const shortId = Math.random().toString(36).substring(2, 6); // Короткий случайный ID
    
    if (traceId) {
      campaignId = `${cleanTopic}-${traceId}-${timestamp}`;
    } else {
      campaignId = `${cleanTopic}-${shortId}-${timestamp}`;
    }
    
    // Ensure the folder name is valid and unique
    if (!campaignId || campaignId.length < 3) {
      campaignId = `campaign-${shortId}-${timestamp}`;
    }
    
    console.log(`📁 Creating NEW unique campaign folder: "${campaignId}" for topic: "${topic}"`);
    
    // ❌ REMOVED: Don't check for existing folders - always create new ones
    // const existingFolder = await EmailFolderManager.loadEmailFolder(campaignId);
    // if (existingFolder) {
    //   console.log(`📁 Using existing email folder: ${campaignId}`);
    //   return existingFolder;
    // }
    
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
      shared_assets_used: 0,
      asset_hashes: [],
      status: 'initializing'
    };
    
    await EmailFolderManager.updateMetadata(emailFolder, initialMetadata);
    
    console.log(`📁 Created NEW email folder: ${campaignId}`);
    console.log(`📂 Assets path: ${assetsPath}`);
    
    return emailFolder;
  }
  
  /**
   * Загружает существующую папку email
   */
  static async loadEmailFolder(campaignId: string): Promise<EmailFolder | null> {
    try {
      // Пробуем различные варианты имени папки
      const possibleNames = [
        campaignId, // Оригинальное имя
        campaignId.replace(/-/g, '_'), // Заменяем дефисы на подчеркивания
        campaignId.replace(/_/g, '-'), // Заменяем подчеркивания на дефисы
        campaignId.toLowerCase(), // В нижнем регистре
        campaignId.toLowerCase().replace(/-/g, '_'), // Нижний регистр с подчеркиваниями
        campaignId.toLowerCase().replace(/_/g, '-'), // Нижний регистр с дефисами
      ];

      // Удаляем дубликаты
      const uniqueNames = Array.from(new Set(possibleNames));
      
      for (const name of uniqueNames) {
        try {
          const basePath = path.resolve(process.cwd(), 'mails', name);
          const assetsPath = path.join(basePath, 'assets');
          const spritePath = path.join(assetsPath, 'sprite-slices');
          
          // Проверяем существование папки
          await fs.access(basePath);
          
          // Создаем недостающие подпапки если они не существуют
          try {
            await fs.mkdir(assetsPath, { recursive: true });
            await fs.mkdir(spritePath, { recursive: true });
            console.log(`📁 Ensured directory structure for: ${name}`);
          } catch (dirError) {
            console.warn(`⚠️ Could not create directories for ${name}:`, dirError);
          }
          
          console.log(`📁 Found email folder: ${name} (searched for: ${campaignId})`);
          
          return {
            campaignId: name, // Используем найденное имя
            basePath,
            assetsPath,
            spritePath,
            htmlPath: path.join(basePath, 'email.html'),
            mjmlPath: path.join(basePath, 'email.mjml'),
            metadataPath: path.join(basePath, 'metadata.json')
          };
        } catch {
          // Продолжаем поиск
          continue;
        }
      }
      
      // Если ничего не найдено, пробуем найти по части имени
      try {
        const mailsDir = path.resolve(process.cwd(), 'mails');
        const existingFolders = await fs.readdir(mailsDir);
        
        // Ищем папку, которая содержит ключевые слова из campaignId
        const searchTerms = campaignId.toLowerCase().split(/[-_\s]+/).filter(term => term.length > 2);
        
        for (const folder of existingFolders) {
          if (folder === 'shared-assets') continue; // Пропускаем служебную папку
          
          const folderLower = folder.toLowerCase();
          const matchCount = searchTerms.filter(term => folderLower.includes(term)).length;
          
          // Если папка содержит большинство ключевых слов, считаем её подходящей
          if (matchCount >= Math.max(1, searchTerms.length - 1)) {
            const basePath = path.resolve(process.cwd(), 'mails', folder);
            const assetsPath = path.join(basePath, 'assets');
            const spritePath = path.join(assetsPath, 'sprite-slices');
            
            // Создаем недостающие подпапки если они не существуют
            try {
              await fs.mkdir(assetsPath, { recursive: true });
              await fs.mkdir(spritePath, { recursive: true });
              console.log(`📁 Ensured directory structure for: ${folder}`);
            } catch (dirError) {
              console.warn(`⚠️ Could not create directories for ${folder}:`, dirError);
            }
            
            console.log(`📁 Found similar email folder: ${folder} (searched for: ${campaignId}, matched ${matchCount}/${searchTerms.length} terms)`);
            
            return {
              campaignId: folder,
              basePath,
              assetsPath,
              spritePath,
              htmlPath: path.join(basePath, 'email.html'),
              mjmlPath: path.join(basePath, 'email.mjml'),
              metadataPath: path.join(basePath, 'metadata.json')
            };
          }
        }
      } catch {
        // Если не удалось прочитать директорию
      }
      
      return null;
    } catch {
      return null;
    }
  }
  
  /**
   * Сохраняет Figma ассет в папку кампании (legacy метод)
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
   * Добавляет ассет в общее хранилище и создает ссылку в кампании
   */
  static async addSharedAsset(
    emailFolder: EmailFolder,
    sourceFilePath: string,
    fileName: string
  ): Promise<{
    assetPath: string;
    hash: string;
    wasExisting: boolean;
  }> {
    // Добавляем или получаем ассет из общего хранилища
    const { sharedPath: _sharedPath, hash, wasExisting } = await AssetHashManager.addOrGetSharedAsset(
      sourceFilePath,
      fileName
    );

    // Создаем ссылку в папке кампании
    const linkPath = await AssetHashManager.linkAssetToCampaign(
      hash,
      emailFolder.assetsPath,
      fileName
    );

    // Обновляем метаданные кампании
    const currentMetadata = await EmailFolderManager.getMetadata(emailFolder);
    const assetHashes = [...(currentMetadata.asset_hashes || [])];
    
    if (!assetHashes.includes(hash)) {
      assetHashes.push(hash);
      await EmailFolderManager.updateMetadata(emailFolder, {
        asset_hashes: assetHashes,
        shared_assets_used: assetHashes.length
      });
    }

    return {
      assetPath: linkPath,
      hash,
      wasExisting
    };
  }

  /**
   * Добавляет ассет из Figma с использованием общего хранилища
   */
  static async addFigmaAsset(
    emailFolder: EmailFolder,
    assetUrl: string,
    fileName: string
  ): Promise<{
    assetPath: string;
    hash: string;
    wasExisting: boolean;
  }> {
    console.log(`🔍 DEBUG: addFigmaAsset called with:`, {
      campaignId: emailFolder.campaignId,
      assetUrl,
      fileName,
      metadataPath: emailFolder.metadataPath
    });

    // Ensure the assets directory exists
    try {
      await fs.mkdir(emailFolder.assetsPath, { recursive: true });
      console.log(`📁 Assets directory ensured: ${emailFolder.assetsPath}`);
    } catch (dirError) {
      console.warn(`⚠️ Could not create assets directory: ${emailFolder.assetsPath}`, dirError);
    }

    // Проверяем существование metadata.json ПЕРЕД операцией
    try {
      await fs.access(emailFolder.metadataPath);
      console.log(`✅ Metadata file exists: ${emailFolder.metadataPath}`);
    } catch (metadataError) {
      console.warn(`⚠️ Metadata file not accessible: ${emailFolder.metadataPath}`, metadataError);
      // Создаем файл metadata.json если его нет
      await EmailFolderManager.updateMetadata(emailFolder, {
        campaign_id: emailFolder.campaignId,
        created_at: new Date().toISOString(),
        topic: 'Unknown',
        campaign_type: 'promotional',
        assets_count: 0,
        figma_assets_processed: 0,
        sprite_slices_generated: 0,
        shared_assets_used: 0,
        asset_hashes: [],
        status: 'initializing'
      });
      console.log(`✅ Created metadata file: ${emailFolder.metadataPath}`);
    }

    // Временно скачиваем файл
    const tempPath = path.join(emailFolder.assetsPath, `.temp_${fileName}`);
    console.log(`📥 Temp file path: ${tempPath}`);
    
    try {
      // Скачиваем или копируем файл во временное место
      if (assetUrl.startsWith('http')) {
        console.log(`🌐 Downloading from URL: ${assetUrl}`);
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error(`Failed to download asset: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        await fs.writeFile(tempPath, Buffer.from(buffer));
        console.log(`✅ Downloaded to temp file: ${tempPath}`);
      } else {
        console.log(`📁 Copying local file: ${assetUrl}`);
        // Проверяем существование исходного файла
        try {
          await fs.access(assetUrl);
        await fs.copyFile(assetUrl, tempPath);
          console.log(`✅ Copied to temp file: ${tempPath}`);
        } catch (accessError) {
          console.warn(`⚠️ Could not access source file: ${assetUrl}`, accessError);
          throw new Error(`Source file does not exist: ${assetUrl}`);
        }
      }

      // Добавляем в общее хранилище
      console.log(`🔄 Adding to shared storage...`);
      const result = await EmailFolderManager.addSharedAsset(emailFolder, tempPath, fileName);
      console.log(`✅ Added to shared storage:`, result);

      // Удаляем временный файл
      try {
      await fs.unlink(tempPath);
        console.log(`🗑️ Removed temp file: ${tempPath}`);
      } catch (unlinkError) {
        console.warn(`⚠️ Could not remove temp file: ${tempPath}`, unlinkError);
      }

      console.log(`🎨 Added Figma asset: ${fileName} (${result.wasExisting ? 'existing' : 'new'})`);
      return result;

    } catch (error) {
      console.error(`❌ Error in addFigmaAsset:`, error);
      // Очищаем временный файл в случае ошибки
      try {
        await fs.unlink(tempPath);
      } catch {}
      
      // Более информативная ошибка
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add Figma asset ${fileName}: ${errorMessage}`);
    }
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
        shared_assets_used: 0,
        asset_hashes: [],
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
    try {
    const metadataContent = await fs.readFile(emailFolder.metadataPath, 'utf8');
    return JSON.parse(metadataContent);
    } catch (error) {
      // Если файл не существует или поврежден, возвращаем базовую структуру
      console.warn(`⚠️ Could not read metadata from ${emailFolder.metadataPath}, creating default`);
      return {
        campaign_id: emailFolder.campaignId,
        created_at: new Date().toISOString(),
        topic: 'Unknown',
        campaign_type: 'promotional',
        assets_count: 0,
        figma_assets_processed: 0,
        sprite_slices_generated: 0,
        shared_assets_used: 0,
        asset_hashes: [],
        status: 'initializing'
      };
    }
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
  static getAssetUrl(_emailFolder: EmailFolder, fileName: string): string {
    // Возвращаем относительный путь для использования в email
    return `./assets/${fileName}`;
  }
  
  /**
   * Получает полный путь к ассету
   */
  static getAssetPath(emailFolder: EmailFolder, fileName: string): string {
    return path.join(emailFolder.assetsPath, fileName);
  }

  /**
   * Получает статистику по общим ассетам системы
   */
  static async getSharedAssetsStats(): Promise<{
    totalAssets: number;
    totalSizeBytes: number;
    totalSizeMB: number;
    oldestAsset: string;
    newestAsset: string;
  }> {
    const stats = await AssetHashManager.getStats();
    return {
      ...stats,
      totalSizeMB: Math.round(stats.totalSizeBytes / (1024 * 1024) * 100) / 100
    };
  }

  /**
   * Очищает старые неиспользуемые ассеты
   */
  static async cleanupSharedAssets(keepDays: number = 30): Promise<number> {
    return await AssetHashManager.cleanupUnusedAssets(keepDays);
  }

  /**
   * Возвращает использование общих ассетов конкретной кампанией
   */
  static async getCampaignSharedAssets(emailFolder: EmailFolder): Promise<{
    hashes: string[];
    count: number;
    details: Array<{
      hash: string;
      fileName: string;
      size: number;
      createdAt: string;
    }>;
  }> {
    const metadata = await EmailFolderManager.getMetadata(emailFolder);
    const hashes = metadata.asset_hashes || [];
    
    const details = [];
    for (const hash of hashes) {
      const asset = await AssetHashManager.getAssetByHash(hash);
      if (asset) {
        details.push({
          hash,
          fileName: asset.fileName,
          size: asset.size,
          createdAt: asset.createdAt
        });
      }
    }

    return {
      hashes,
      count: hashes.length,
      details
    };
  }
}

// Named export for compatibility
export { EmailFolderManager }; 