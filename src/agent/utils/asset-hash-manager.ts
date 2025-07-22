import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface AssetHash {
  fileName: string;
  filePath: string;
  hash: string;
  size: number;
  createdAt: string;
}

export interface SharedAssetRegistry {
  [hash: string]: AssetHash;
}

/**
 * Asset Hash Manager - управляет общими ассетами и предотвращает дублирование
 */
export class AssetHashManager {
  private static readonly SHARED_ASSETS_DIR = path.resolve(process.cwd(), 'mails', 'shared-assets');
  private static readonly REGISTRY_FILE = path.join(AssetHashManager.SHARED_ASSETS_DIR, 'asset-registry.json');
  
  /**
   * Инициализирует директорию общих ассетов
   */
  static async initialize(): Promise<void> {
    await fs.mkdir(AssetHashManager.SHARED_ASSETS_DIR, { recursive: true });
    
    // Создаем файл реестра если он не существует
    try {
      await fs.access(AssetHashManager.REGISTRY_FILE);
    } catch {
      await fs.writeFile(AssetHashManager.REGISTRY_FILE, JSON.stringify({}, null, 2));
      console.log('📝 Created shared assets registry');
    }
  }
  
  /**
   * Вычисляет хеш файла
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex').substring(0, 16); // Используем первые 16 символов
  }
  
  /**
   * Загружает реестр ассетов
   */
  static async loadRegistry(): Promise<SharedAssetRegistry> {
    try {
      const registryContent = await fs.readFile(AssetHashManager.REGISTRY_FILE, 'utf8');
      return JSON.parse(registryContent);
    } catch {
      return {};
    }
  }
  
  /**
   * Сохраняет реестр ассетов
   */
  static async saveRegistry(registry: SharedAssetRegistry): Promise<void> {
    await fs.writeFile(AssetHashManager.REGISTRY_FILE, JSON.stringify(registry, null, 2));
  }
  
  /**
   * Добавляет ассет в общее хранилище или возвращает существующий
   * @param sourceFilePath - путь к исходному файлу
   * @param originalFileName - оригинальное имя файла
   * @returns путь к ассету в общем хранилище
   */
  static async addOrGetSharedAsset(sourceFilePath: string, originalFileName: string): Promise<{
    sharedPath: string;
    hash: string;
    wasExisting: boolean;
  }> {
    await AssetHashManager.initialize();
    
    // Вычисляем хеш файла
    const hash = await AssetHashManager.calculateFileHash(sourceFilePath);
    const registry = await AssetHashManager.loadRegistry();
    
    // Проверяем, существует ли уже такой ассет
    if (registry[hash]) {
      const existingAsset = registry[hash];
      
      // Проверяем, что файл действительно существует
      try {
        await fs.access(existingAsset.filePath);
        console.log(`♻️ Using existing shared asset: ${existingAsset.fileName} (${hash})`);
        return {
          sharedPath: existingAsset.filePath,
          hash,
          wasExisting: true
        };
      } catch {
        // Файл был удален, убираем из реестра
        delete registry[hash];
        await AssetHashManager.saveRegistry(registry);
      }
    }
    
    // Создаем уникальное имя файла с хешем
    const fileExtension = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, fileExtension);
    const sharedFileName = `${baseName}_${hash}${fileExtension}`;
    const sharedPath = path.join(AssetHashManager.SHARED_ASSETS_DIR, sharedFileName);
    
    // Копируем файл в общее хранилище
    await fs.copyFile(sourceFilePath, sharedPath);
    
    // Получаем информацию о файле
    const stats = await fs.stat(sharedPath);
    
    // Обновляем реестр
    const assetInfo: AssetHash = {
      fileName: sharedFileName,
      filePath: sharedPath,
      hash,
      size: stats.size,
      createdAt: new Date().toISOString()
    };
    
    registry[hash] = assetInfo;
    await AssetHashManager.saveRegistry(registry);
    
    console.log(`📦 Added new shared asset: ${sharedFileName} (${hash})`);
    return {
      sharedPath,
      hash,
      wasExisting: false
    };
  }
  
  /**
   * Получает ассет по хешу
   */
  static async getAssetByHash(hash: string): Promise<AssetHash | null> {
    const registry = await AssetHashManager.loadRegistry();
    return registry[hash] || null;
  }
  
  /**
   * Очищает неиспользуемые ассеты (осторожно!)
   */
  static async cleanupUnusedAssets(keepDays: number = 30): Promise<number> {
    const registry = await AssetHashManager.loadRegistry();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    let deletedCount = 0;
    const updatedRegistry: SharedAssetRegistry = {};
    
    for (const [hash, asset] of (Object || {}).entries(registry)) {
      const assetDate = new Date(asset.createdAt);
      
      if (assetDate < cutoffDate) {
        try {
          await fs.unlink(asset.filePath);
          console.log(`🗑️ Deleted old asset: ${asset.fileName}`);
          deletedCount++;
        } catch (error) {
          // Файл уже не существует, просто убираем из реестра
          console.log(`🗑️ Removed missing asset from registry: ${asset.fileName}`);
        }
      } else {
        updatedRegistry[hash] = asset;
      }
    }
    
    await AssetHashManager.saveRegistry(updatedRegistry);
    console.log(`🧹 Cleanup completed: removed ${deletedCount} old assets`);
    
    return deletedCount;
  }
  
  /**
   * Получает статистику по общим ассетам
   */
  static async getStats(): Promise<{
    totalAssets: number;
    totalSizeBytes: number;
    oldestAsset: string;
    newestAsset: string;
  }> {
    const registry = await AssetHashManager.loadRegistry();
    const assets = (Object || {}).values(registry);
    
    if (assets.length === 0) {
      return {
        totalAssets: 0,
        totalSizeBytes: 0,
        oldestAsset: '',
        newestAsset: ''
      };
    }
    
    const totalSizeBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
    const sortedByDate = assets.sort((a, b) => new Date(a.createdAt).getTime() - new Date((b || {}).createdAt).getTime());
    
    return {
      totalAssets: assets.length,
      totalSizeBytes,
      oldestAsset: sortedByDate[0].fileName,
      newestAsset: sortedByDate[sortedByDate.length - 1].fileName
    };
  }
  
  /**
   * Получает относительный URL для ассета
   */
  static getAssetUrl(hash: string, campaignId: string): string {
    return `../shared-assets/${hash}`;
  }
  
  /**
   * Создает символическую ссылку на общий ассет в папке кампании
   */
  static async linkAssetToCampaign(assetHash: string, campaignAssetsPath: string, linkName: string): Promise<string> {
    const registry = await AssetHashManager.loadRegistry();
    const asset = registry[assetHash];
    
    if (!asset) {
      throw new Error(`Asset with hash ${assetHash} not found in registry`);
    }
    
    const linkPath = path.join(campaignAssetsPath, linkName);
    const relativePath = path.relative(campaignAssetsPath, asset.filePath);
    
    try {
      await fs.symlink(relativePath, linkPath);
      console.log(`🔗 Created asset link: ${linkName} -> ${asset.fileName}`);
    } catch (error) {
      // Если символические ссылки не поддерживаются, просто копируем файл
      await fs.copyFile(asset.filePath, linkPath);
      console.log(`📋 Copied asset: ${linkName} (symlink not supported)`);
    }
    
    return linkPath;
  }
}

export default AssetHashManager;