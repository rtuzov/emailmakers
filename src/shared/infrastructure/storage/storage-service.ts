import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Client as MinioClient } from 'minio';
import sharp from 'sharp';
import { MetricsService } from '../monitoring/metrics-service';

export interface StorageConfig {
  provider: 's3' | 'minio';
  s3?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint?: string;
  };
  minio?: {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  cdn?: {
    baseUrl: string;
    enabled: boolean;
  };
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  generateThumbnail?: boolean;
  thumbnailSizes?: Array<{ width: number; height: number; suffix: string }>;
  optimize?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
  thumbnails?: Array<{
    key: string;
    url: string;
    cdnUrl?: string;
    size: { width: number; height: number };
  }>;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
  recentUploads: number; // Last 24 hours
}

export class StorageService {
  private s3Client?: S3Client;
  private minioClient?: MinioClient;
  private config: StorageConfig;
  private metricsService: MetricsService;

  constructor(config: StorageConfig, metricsService: MetricsService) {
    this.config = config;
    this.metricsService = metricsService;

    if (config.provider === 's3' && config.s3) {
      this.s3Client = new S3Client({
        region: config.s3.region,
        credentials: {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        },
        ...(config.s3.endpoint && { endpoint: config.s3.endpoint }),
      });
    } else if (config.provider === 'minio' && config.minio) {
      this.minioClient = new MinioClient({
        endPoint: config.minio.endPoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        accessKey: config.minio.accessKey,
        secretKey: config.minio.secretKey,
      });
    } else {
      throw new Error('Invalid storage configuration');
    }
  }

  async uploadScreenshot(
    jobId: string,
    clientId: string,
    viewport: string,
    imageBuffer: Buffer,
    mode: 'light' | 'dark' = 'light',
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const key = `screenshots/${timestamp}/${jobId}/${clientId}/${viewport}-${mode}.png`;

    // Optimize image if requested
    let processedBuffer = imageBuffer;
    if (options.optimize !== false) {
      processedBuffer = await this.optimizeImage(imageBuffer, 'png');
    }

    const uploadOptions: UploadOptions = {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000', // 1 year
      metadata: {
        jobId,
        clientId,
        viewport,
        mode,
        uploadedAt: new Date().toISOString(),
        ...options.metadata,
      },
      generateThumbnail: true,
      thumbnailSizes: [
        { width: 300, height: 200, suffix: 'thumb' },
        { width: 150, height: 100, suffix: 'small' },
      ],
      ...options,
    };

    const result = await this.uploadFile(key, processedBuffer, uploadOptions);
    
    this.metricsService.recordScreenshotUpload(jobId, clientId, result.size);
    return result;
  }

  async uploadFile(
    key: string,
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();

    try {
      if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
        return await this.uploadToS3(key, buffer, options);
      } else if (this.config.provider === 'minio' && this.minioClient && this.config.minio) {
        return await this.uploadToMinio(key, buffer, options);
      } else {
        throw new Error('No storage client configured');
      }
    } finally {
      const uploadTime = Date.now() - startTime;
      this.metricsService.recordUploadTime(uploadTime);
    }
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 client not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || 'application/octet-stream',
      CacheControl: options.cacheControl,
      Metadata: options.metadata,
    });

    await this.s3Client.send(command);

    const url = `https://${this.config.s3.bucket}.s3.${this.config.s3.region}.amazonaws.com/${key}`;
    const cdnUrl = this.config.cdn?.enabled 
      ? `${this.config.cdn.baseUrl}/${key}` 
      : undefined;

    const result: UploadResult = {
      key,
      url,
      ...(cdnUrl ? { cdnUrl } : {}),
      size: buffer.length,
      contentType: options.contentType || 'application/octet-stream',
    };

    // Generate thumbnails if requested
    if (options.generateThumbnail && options.thumbnailSizes) {
      result.thumbnails = await this.generateThumbnails(key, buffer, options.thumbnailSizes);
    }

    return result;
  }

  private async uploadToMinio(
    key: string,
    buffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    if (!this.minioClient || !this.config.minio) {
      throw new Error('MinIO client not configured');
    }

    const metadata: Record<string, string> = {
      'Content-Type': options.contentType || 'application/octet-stream',
      ...(options.cacheControl && { 'Cache-Control': options.cacheControl }),
      ...options.metadata,
    };

    await this.minioClient.putObject(
      this.config.minio.bucket,
      key,
      buffer,
      buffer.length,
      metadata
    );

    const url = await this.minioClient.presignedGetObject(
      this.config.minio.bucket,
      key,
      24 * 60 * 60 // 24 hours
    );

    const cdnUrl = this.config.cdn?.enabled 
      ? `${this.config.cdn.baseUrl}/${key}` 
      : undefined;

    const result: UploadResult = {
      key,
      url,
      ...(cdnUrl ? { cdnUrl } : {}),
      size: buffer.length,
      contentType: options.contentType || 'application/octet-stream',
    };

    // Generate thumbnails if requested
    if (options.generateThumbnail && options.thumbnailSizes) {
      result.thumbnails = await this.generateThumbnails(key, buffer, options.thumbnailSizes);
    }

    return result;
  }

  private async generateThumbnails(
    originalKey: string,
    originalBuffer: Buffer,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<Array<{
    key: string;
    url: string;
    cdnUrl?: string;
    size: { width: number; height: number };
  }>> {
    const thumbnails = [];
    const basePath = originalKey.substring(0, originalKey.lastIndexOf('.'));
    const extension = originalKey.substring(originalKey.lastIndexOf('.'));

    for (const size of sizes) {
      const thumbnailKey = `${basePath}-${size.suffix}${extension}`;
      
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ quality: 80 })
        .toBuffer();

      const uploadResult = await this.uploadFile(thumbnailKey, thumbnailBuffer, {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      });

      thumbnails.push({
        key: thumbnailKey,
        url: uploadResult.url,
        ...(uploadResult.cdnUrl ? { cdnUrl: uploadResult.cdnUrl } : {}),
        size: { width: size.width, height: size.height },
      });
    }

    return thumbnails;
  }

  private async optimizeImage(buffer: Buffer, format: 'png' | 'jpeg' | 'webp'): Promise<Buffer> {
    const sharpInstance = sharp(buffer);

    switch (format) {
      case 'png':
        return sharpInstance
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();
      case 'jpeg':
        return sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      case 'webp':
        return sharpInstance
          .webp({ quality: 85 })
          .toBuffer();
      default:
        return buffer;
    }
  }

  async getFile(key: string): Promise<Buffer> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as any;
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } else if (this.config.provider === 'minio' && this.minioClient && this.config.minio) {
      const stream = await this.minioClient.getObject(this.config.minio.bucket, key);
      const chunks: Buffer[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } else {
      throw new Error('No storage client configured');
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } else if (this.config.provider === 'minio' && this.minioClient && this.config.minio) {
      await this.minioClient.removeObject(this.config.minio.bucket, key);
    } else {
      throw new Error('No storage client configured');
    }

    this.metricsService.recordFileDeletion(key);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
        const command = new HeadObjectCommand({
          Bucket: this.config.s3.bucket,
          Key: key,
        });

        await this.s3Client.send(command);
        return true;
      } else if (this.config.provider === 'minio' && this.minioClient && this.config.minio) {
        await this.minioClient.statObject(this.config.minio.bucket, key);
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.provider === 's3' && this.s3Client && this.config.s3) {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } else if (this.config.provider === 'minio' && this.minioClient && this.config.minio) {
      return await this.minioClient.presignedGetObject(
        this.config.minio.bucket,
        key,
        expiresIn
      );
    } else {
      throw new Error('No storage client configured');
    }
  }

  async cleanupOldFiles(olderThanDays: number = 30): Promise<{
    deletedCount: number;
    freedSpace: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    let freedSpace = 0;

    // Implementation would depend on storage provider's listing capabilities
    // This is a placeholder for the cleanup logic
    
    this.metricsService.recordCleanupOperation(deletedCount, freedSpace);
    
    return {
      deletedCount,
      freedSpace,
    };
  }

  async getStorageStats(): Promise<StorageStats> {
    // This would require implementing listing and statistics gathering
    // which varies by storage provider
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {},
      recentUploads: 0,
    };
  }

  async healthCheck(): Promise<{
    provider: string;
    connected: boolean;
    bucket: string;
    lastUpload?: Date;
  }> {
    try {
      const testKey = `health-check-${Date.now()}.txt`;
      const testBuffer = Buffer.from('health check');

      await this.uploadFile(testKey, testBuffer, { contentType: 'text/plain' });
      await this.deleteFile(testKey);

      return {
        provider: this.config.provider,
        connected: true,
        bucket: this.config.provider === 's3' 
          ? this.config.s3!.bucket 
          : this.config.minio!.bucket,
        lastUpload: new Date(),
      };
    } catch (error) {
      return {
        provider: this.config.provider,
        connected: false,
        bucket: this.config.provider === 's3' 
          ? this.config.s3!.bucket 
          : this.config.minio!.bucket,
      };
    }
  }
} 