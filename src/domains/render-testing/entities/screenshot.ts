import { z } from 'zod';

/**
 * Screenshot Entity - Manages screenshot metadata and operations
 * 
 * This entity represents a screenshot captured during email render testing,
 * including metadata, storage information, and comparison capabilities.
 */

// Screenshot status enumeration
export const ScreenshotStatus = {
  PENDING: 'pending',
  CAPTURING: 'capturing',
  CAPTURED: 'captured',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
  ARCHIVED: 'archived'
} as const;

export type ScreenshotStatusType = typeof ScreenshotStatus[keyof typeof ScreenshotStatus];

// Screenshot format enumeration
export const ScreenshotFormat = {
  PNG: 'png',
  JPEG: 'jpeg',
  WEBP: 'webp'
} as const;

export type ScreenshotFormatType = typeof ScreenshotFormat[keyof typeof ScreenshotFormat];

// Screenshot comparison result schema
export const ComparisonResultSchema = z.object({
  baselineScreenshotId: z.string().uuid(),
  similarityScore: z.number().min(0).max(100),
  differencePixels: z.number().min(0),
  totalPixels: z.number().positive(),
  differencePercentage: z.number().min(0).max(100),
  diffImageUrl: z.string().url().optional().nullable(),
  comparedAt: z.date(),
  algorithm: z.enum(['pixelmatch', 'ssim', 'custom']).default('pixelmatch'),
  threshold: z.number().min(0).max(1).default(0.1)
});

export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;

// Image processing metadata schema
export const ImageMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.enum([ScreenshotFormat.PNG, ScreenshotFormat.JPEG, ScreenshotFormat.WEBP]),
  quality: z.number().min(1).max(100).optional().nullable(),
  fileSize: z.number().positive(), // bytes
  compression: z.number().min(0).max(1).optional().nullable(),
  colorDepth: z.number().positive().optional().nullable(),
  hasAlpha: z.boolean().optional().nullable(),
  dpi: z.number().positive().optional().nullable()
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

// Storage information schema
export const StorageInfoSchema = z.object({
  provider: z.enum(['s3', 'gcs', 'azure', 'local', 'minio']),
  bucket: z.string().optional().nullable(),
  key: z.string(),
  region: z.string().optional().nullable(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  cdnUrl: z.string().url().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
  isPublic: z.boolean().default(false),
  tags: z.record(z.string()).optional().nullable()
});

export type StorageInfo = z.infer<typeof StorageInfoSchema>;

// Main Screenshot entity schema
export const ScreenshotSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  clientId: z.string(),
  clientName: z.string(),
  viewport: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    devicePixelRatio: z.number().min(1).max(3),
    name: z.string()
  }),
  darkMode: z.boolean(),
  status: z.enum([
    ScreenshotStatus.PENDING,
    ScreenshotStatus.CAPTURING,
    ScreenshotStatus.CAPTURED,
    ScreenshotStatus.PROCESSING,
    ScreenshotStatus.READY,
    ScreenshotStatus.FAILED,
    ScreenshotStatus.ARCHIVED
  ]),
  imageMetadata: ImageMetadataSchema.optional().nullable(),
  storageInfo: StorageInfoSchema.optional().nullable(),
  captureConfig: z.object({
    fullPage: z.boolean().default(true),
    clip: z.object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().positive(),
      height: z.number().positive()
    }).optional().nullable(),
    omitBackground: z.boolean().default(false),
    encoding: z.enum(['base64', 'binary']).default('binary'),
    delay: z.number().min(0).default(0), // milliseconds
    animations: z.enum(['disabled', 'allow']).default('disabled'),
    caret: z.enum(['hide', 'initial']).default('hide')
  }),
  comparisonResults: z.array(ComparisonResultSchema).default([]),
  processingTime: z.number().positive().optional().nullable(), // milliseconds
  errorMessage: z.string().optional().nullable(),
  retryCount: z.number().min(0).default(0),
  maxRetries: z.number().min(0).default(3),
  capturedAt: z.date().optional().nullable(),
  processedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ScreenshotData = z.infer<typeof ScreenshotSchema>;

/**
 * Screenshot Domain Entity
 * 
 * Manages screenshot lifecycle, metadata, and comparison operations.
 * Provides business logic for screenshot capture, processing, and storage.
 */
export class Screenshot {
  private constructor(private data: ScreenshotData) {
    this.validateInvariants();
  }

  /**
   * Factory method to create a new Screenshot
   */
  static create(params: {
    jobId: string;
    clientId: string;
    clientName: string;
    viewport: ScreenshotData['viewport'];
    darkMode: boolean;
    captureConfig?: Partial<ScreenshotData['captureConfig']>;
    maxRetries?: number;
  }): Screenshot {
    const now = new Date();
    const id = crypto.randomUUID();

    const defaultCaptureConfig: ScreenshotData['captureConfig'] = {
      fullPage: true,
      omitBackground: false,
      encoding: 'binary',
      delay: 0,
      animations: 'disabled',
      caret: 'hide'
    };

    const screenshotData: ScreenshotData = {
      id,
      jobId: params.jobId,
      clientId: params.clientId,
      clientName: params.clientName,
      viewport: params.viewport,
      darkMode: params.darkMode,
      status: ScreenshotStatus.PENDING,
      captureConfig: { ...defaultCaptureConfig, ...params.captureConfig },
      comparisonResults: [],
      retryCount: 0,
      maxRetries: params.maxRetries || 3,
      createdAt: now,
      updatedAt: now
    };

    return new Screenshot(screenshotData);
  }

  /**
   * Factory method to reconstruct Screenshot from persistence
   */
  static fromData(data: ScreenshotData): Screenshot {
    return new Screenshot(data);
  }

  /**
   * Domain invariants validation
   */
  private validateInvariants(): void {
    if (this.data.status === ScreenshotStatus.READY && !this.data.storageInfo) {
      throw new Error('Ready screenshots must have storage information');
    }

    if (this.data.status === ScreenshotStatus.CAPTURED && !this.data.capturedAt) {
      throw new Error('Captured screenshots must have capture timestamp');
    }

    if (this.data.retryCount > this.data.maxRetries) {
      throw new Error('Retry count cannot exceed maximum retries');
    }

    if (this.data.comparisonResults.some(r => r.similarityScore < 0 || r.similarityScore > 100)) {
      throw new Error('Similarity scores must be between 0 and 100');
    }
  }

  // Getters
  get id(): string { return this.data.id; }
  get jobId(): string { return this.data.jobId; }
  get clientId(): string { return this.data.clientId; }
  get clientName(): string { return this.data.clientName; }
  get viewport(): ScreenshotData['viewport'] { return this.data.viewport; }
  get darkMode(): boolean { return this.data.darkMode; }
  get status(): ScreenshotStatusType { return this.data.status; }
  get imageMetadata(): ImageMetadata | undefined { return this.data.imageMetadata ?? undefined; }
  get storageInfo(): StorageInfo | undefined { return this.data.storageInfo ?? undefined; }
  get captureConfig(): ScreenshotData['captureConfig'] { return this.data.captureConfig; }
  get comparisonResults(): ComparisonResult[] { return this.data.comparisonResults; }
  get processingTime(): number | undefined { return this.data.processingTime ?? undefined; }
  get errorMessage(): string | undefined { return this.data.errorMessage ?? undefined; }
  get retryCount(): number { return this.data.retryCount; }
  get maxRetries(): number { return this.data.maxRetries; }
  get capturedAt(): Date | undefined { return this.data.capturedAt ?? undefined; }
  get processedAt(): Date | undefined { return this.data.processedAt ?? undefined; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business logic methods
   */

  /**
   * Start screenshot capture
   */
  startCapture(): void {
    if (this.data.status !== ScreenshotStatus.PENDING) {
      throw new Error(`Cannot start capture from ${this.data.status} status`);
    }

    this.data.status = ScreenshotStatus.CAPTURING;
    this.data.updatedAt = new Date();
  }

  /**
   * Mark screenshot as captured
   */
  markCaptured(imageMetadata: ImageMetadata, processingTime?: number): void {
    if (this.data.status !== ScreenshotStatus.CAPTURING) {
      throw new Error(`Cannot mark as captured from ${this.data.status} status`);
    }

    const now = new Date();
    this.data.status = ScreenshotStatus.CAPTURED;
    this.data.imageMetadata = imageMetadata;
    this.data.capturedAt = now;
    this.data.processingTime = processingTime;
    this.data.updatedAt = now;
    this.validateInvariants();
  }

  /**
   * Start processing
   */
  startProcessing(): void {
    if (this.data.status !== ScreenshotStatus.CAPTURED) {
      throw new Error(`Cannot start processing from ${this.data.status} status`);
    }

    this.data.status = ScreenshotStatus.PROCESSING;
    this.data.updatedAt = new Date();
  }

  /**
   * Mark screenshot as ready with storage information
   */
  markReady(storageInfo: StorageInfo): void {
    if (this.data.status !== ScreenshotStatus.PROCESSING) {
      throw new Error(`Cannot mark as ready from ${this.data.status} status`);
    }

    const now = new Date();
    this.data.status = ScreenshotStatus.READY;
    this.data.storageInfo = storageInfo;
    this.data.processedAt = now;
    this.data.updatedAt = now;
    this.validateInvariants();
  }

  /**
   * Fail screenshot capture/processing
   */
  fail(errorMessage: string): void {
    if ([ScreenshotStatus.READY, ScreenshotStatus.ARCHIVED].includes(this.data.status as any)) {
      throw new Error(`Cannot fail screenshot in ${this.data.status} status`);
    }

    this.data.status = ScreenshotStatus.FAILED;
    this.data.errorMessage = errorMessage;
    this.data.updatedAt = new Date();
  }

  /**
   * Retry screenshot capture
   */
  retry(): void {
    if (this.data.status !== ScreenshotStatus.FAILED) {
      throw new Error('Can only retry failed screenshots');
    }

    if (this.data.retryCount >= this.data.maxRetries) {
      throw new Error('Maximum retries exceeded');
    }

    this.data.retryCount += 1;
    this.data.status = ScreenshotStatus.PENDING;
    this.data.errorMessage = undefined;
    this.data.updatedAt = new Date();
  }

  /**
   * Archive screenshot
   */
  archive(): void {
    if (this.data.status !== ScreenshotStatus.READY) {
      throw new Error('Can only archive ready screenshots');
    }

    this.data.status = ScreenshotStatus.ARCHIVED;
    this.data.updatedAt = new Date();
  }

  /**
   * Add comparison result
   */
  addComparisonResult(result: ComparisonResult): void {
    if (this.data.status !== ScreenshotStatus.READY) {
      throw new Error('Can only add comparison results to ready screenshots');
    }

    // Remove existing comparison with same baseline
    this.data.comparisonResults = this.data.comparisonResults.filter(
      r => r.baselineScreenshotId !== result.baselineScreenshotId
    );

    this.data.comparisonResults.push(result);
    this.data.updatedAt = new Date();
    this.validateInvariants();
  }

  /**
   * Get comparison result with specific baseline
   */
  getComparisonResult(baselineScreenshotId: string): ComparisonResult | undefined {
    return this.data.comparisonResults.find(
      r => r.baselineScreenshotId === baselineScreenshotId
    );
  }

  /**
   * Check if screenshot is ready for use
   */
  isReady(): boolean {
    return this.data.status === ScreenshotStatus.READY;
  }

  /**
   * Check if screenshot failed
   */
  isFailed(): boolean {
    return this.data.status === ScreenshotStatus.FAILED;
  }

  /**
   * Check if screenshot can be retried
   */
  canRetry(): boolean {
    return this.data.status === ScreenshotStatus.FAILED && 
           this.data.retryCount < this.data.maxRetries;
  }

  /**
   * Check if screenshot is in terminal state
   */
  isTerminal(): boolean {
    return [ScreenshotStatus.READY, ScreenshotStatus.FAILED, ScreenshotStatus.ARCHIVED]
      .includes(this.data.status as any) && !this.canRetry();
  }

  /**
   * Get screenshot URL
   */
  getUrl(): string | undefined {
    return this.data.storageInfo?.url;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(): string | undefined {
    return this.data.storageInfo?.thumbnailUrl ?? undefined;
  }

  /**
   * Get CDN URL if available
   */
  getCdnUrl(): string | undefined {
    return this.data.storageInfo?.cdnUrl || this.data.storageInfo?.url;
  }

  /**
   * Get file size in bytes
   */
  getFileSize(): number | undefined {
    return this.data.imageMetadata?.fileSize;
  }

  /**
   * Get file size in human readable format
   */
  getFileSizeFormatted(): string | undefined {
    const size = this.getFileSize();
    if (!size) return undefined;

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let formattedSize = size;

    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024;
      unitIndex++;
    }

    return `${formattedSize.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get screenshot dimensions
   */
  getDimensions(): { width: number; height: number } | undefined {
    if (!this.data.imageMetadata) return undefined;
    
    return {
      width: this.data.imageMetadata.width,
      height: this.data.imageMetadata.height
    };
  }

  /**
   * Get aspect ratio
   */
  getAspectRatio(): number | undefined {
    const dimensions = this.getDimensions();
    if (!dimensions) return undefined;
    
    return dimensions.width / dimensions.height;
  }

  /**
   * Check if screenshot has high similarity with baseline
   */
  hasHighSimilarity(baselineScreenshotId: string, threshold: number = 95): boolean {
    const comparison = this.getComparisonResult(baselineScreenshotId);
    return comparison ? comparison.similarityScore >= threshold : false;
  }

  /**
   * Get best comparison result (highest similarity)
   */
  getBestComparison(): ComparisonResult | undefined {
    if (this.data.comparisonResults.length === 0) return undefined;
    
    return this.data.comparisonResults.reduce((best, current) =>
      current.similarityScore > best.similarityScore ? current : best
    );
  }

  /**
   * Get viewport description
   */
  getViewportDescription(): string {
    const { width, height, devicePixelRatio, name } = this.data.viewport;
    const dprText = devicePixelRatio > 1 ? ` @${devicePixelRatio}x` : '';
    return `${name} (${width}×${height}${dprText})`;
  }

  /**
   * Get theme description
   */
  getThemeDescription(): string {
    return this.data.darkMode ? 'Dark Mode' : 'Light Mode';
  }

  /**
   * Get full description
   */
  getDescription(): string {
    return `${this.data.clientName} - ${this.getViewportDescription()} - ${this.getThemeDescription()}`;
  }

  /**
   * Export entity data for persistence
   */
  toData(): ScreenshotData {
    return { ...this.data };
  }

  /**
   * Create a copy with updated storage info
   */
  updateStorageInfo(storageInfo: Partial<StorageInfo>): Screenshot {
    if (!this.data.storageInfo) {
      throw new Error('Cannot update storage info for screenshot without existing storage info');
    }

    const updatedData = {
      ...this.data,
      storageInfo: { ...this.data.storageInfo, ...storageInfo },
      updatedAt: new Date()
    };

    return new Screenshot(updatedData);
  }

  /**
   * Create a copy with updated capture config
   */
  updateCaptureConfig(config: Partial<ScreenshotData['captureConfig']>): Screenshot {
    if (this.data.status !== ScreenshotStatus.PENDING) {
      throw new Error('Cannot update capture config after capture has started');
    }

    const updatedData = {
      ...this.data,
      captureConfig: { ...this.data.captureConfig, ...config },
      updatedAt: new Date()
    };

    return new Screenshot(updatedData);
  }
} 