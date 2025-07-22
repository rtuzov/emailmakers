import { Job } from 'bullmq';
import { QueueService, QueueJobData, QueueJobResult } from '../queue/queue-service';
import { StorageService } from '../storage/storage-service';
import { MetricsService } from '../monitoring/metrics-service';
import { ScreenshotCaptureService } from '../../../domains/render-testing/services/screenshot-capture-service';
import { EmailClient } from '../../../domains/render-testing/entities/email-client';

export interface WorkerConfig {
  workerId: string;
  concurrency: number;
  maxJobs: number;
  jobTimeout: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

export interface WorkerStats {
  workerId: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  processedJobs: number;
  failedJobs: number;
  currentJobs: number;
  uptime: number;
  lastJobAt?: Date;
  lastError?: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

export class WorkerManager {
  private workers: Map<string, WorkerInstance> = new Map();
  private queueService: QueueService;
  private storageService: StorageService;
  private metricsService: MetricsService;
  private screenshotCaptureService: ScreenshotCaptureService;
  private emailClients: Map<string, EmailClient> = new Map();
  
  constructor(
    queueService: QueueService,
    storageService: StorageService,
    metricsService: MetricsService,
    screenshotCaptureService: ScreenshotCaptureService
  ) {
    this.queueService = queueService;
    this.storageService = storageService;
    this.metricsService = metricsService;
    this.screenshotCaptureService = screenshotCaptureService;
    
    // Initialize email clients (in production, this would be loaded from database)
    this.initializeEmailClients();
  }

  private initializeEmailClients(): void {
    // This would typically load from a repository
    const clients = [
      EmailClient.create({
        id: 'gmail-web',
        name: 'gmail-web',
        displayName: 'Gmail Web',
        vendor: 'Google',
        type: 'web' as const,
        platform: 'web' as const,
        renderingEngine: 'blink' as const,
        capabilities: {
          darkMode: true,
          responsiveDesign: true,
          css3Support: true,
          webFonts: true,
          backgroundImages: true,
          mediaQueries: true,
          flexbox: true,
          grid: false,
          animations: true,
          interactiveElements: true,
          customProperties: false,
          maxEmailWidth: 600,
          imageFormats: ['jpeg', 'png', 'gif', 'webp'],
          videoSupport: false,
          accessibilityFeatures: true
        },
        testConfig: {
          enabled: true,
          priority: 9,
          timeout: 30000,
          retries: 2,
          screenshotDelay: 2000,
          loadWaitTime: 3000,
          darkModeTest: true,
          viewports: [
            { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
            { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
          ]
        },
        automationConfig: {
          workerType: 'docker',
          containerImage: 'render-testing/gmail-chrome:latest',
          browserConfig: {
            browser: 'chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
          }
        }
      }),
      EmailClient.create({
        id: 'outlook-web',
        name: 'outlook-web',
        displayName: 'Outlook Web',
        vendor: 'Microsoft',
        type: 'web' as const,
        platform: 'web' as const,
        renderingEngine: 'blink' as const,
        capabilities: {
          darkMode: true,
          responsiveDesign: true,
          css3Support: true,
          webFonts: true,
          backgroundImages: true,
          mediaQueries: true,
          flexbox: true,
          grid: false,
          animations: true,
          interactiveElements: true,
          customProperties: false,
          maxEmailWidth: 600,
          imageFormats: ['jpeg', 'png', 'gif'],
          videoSupport: false,
          accessibilityFeatures: true
        },
        testConfig: {
          enabled: true,
          priority: 8,
          timeout: 35000,
          retries: 2,
          screenshotDelay: 2500,
          loadWaitTime: 4000,
          darkModeTest: true,
          viewports: [
            { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop', isDefault: true },
            { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile', isDefault: false }
          ]
        },
        automationConfig: {
          workerType: 'docker',
          containerImage: 'render-testing/outlook-web-chrome:latest',
          browserConfig: {
            browser: 'chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage']
          }
        }
      }),
      EmailClient.create({
        id: 'apple-mail',
        name: 'apple-mail',
        displayName: 'Apple Mail',
        vendor: 'Apple',
        type: 'desktop' as const,
        platform: 'macos' as const,
        renderingEngine: 'webkit' as const,
        capabilities: {
          darkMode: true,
          responsiveDesign: true,
          css3Support: true,
          webFonts: true,
          backgroundImages: true,
          mediaQueries: true,
          flexbox: true,
          grid: true,
          animations: true,
          interactiveElements: true,
          customProperties: true,
          maxEmailWidth: 600,
          imageFormats: ['jpeg', 'png', 'gif', 'webp', 'svg'],
          videoSupport: true,
          accessibilityFeatures: true
        },
        testConfig: {
          enabled: true,
          priority: 7,
          timeout: 40000,
          retries: 2,
          screenshotDelay: 2000,
          loadWaitTime: 4000,
          darkModeTest: true,
          viewports: [
            { width: 600, height: 800, devicePixelRatio: 2, name: 'desktop', isDefault: true }
          ]
        },
        automationConfig: {
          workerType: 'vm',
          vmTemplate: 'macos-mail',
          setupCommands: [
            'open -a Mail',
            'sleep 5'
          ],
          teardownCommands: [
            'osascript -e "quit app \\"Mail\\""'
          ]
        }
      })
    ];

    clients.forEach(client => {
      this.emailClients.set(client.id, client);
    });
  }

  async startWorker(config: WorkerConfig): Promise<void> {
    if (this.workers.has(config.workerId)) {
      throw new Error(`Worker ${config.workerId} already exists`);
    }

    const worker = new WorkerInstance(
      config,
      this.queueService,
      this.storageService,
      this.metricsService,
      this.screenshotCaptureService,
      this.emailClients
    );

    await worker.start();
    this.workers.set(config.workerId, worker);
  }

  async stopWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    await worker.stop();
    this.workers.delete(workerId);
  }

  async stopAllWorkers(): Promise<void> {
    const promises = Array.from(this.workers.keys()).map(workerId => 
      this.stopWorker(workerId)
    );
    await Promise.all(promises);
  }

  getWorkerStats(workerId?: string): WorkerStats[] {
    if (workerId) {
      const worker = this.workers.get(workerId);
      return worker ? [worker.getStats()] : [];
    }

    return Array.from(this.workers.values()).map(worker => worker.getStats());
  }

  async getSystemStats(): Promise<{
    totalWorkers: number;
    runningWorkers: number;
    totalProcessedJobs: number;
    totalFailedJobs: number;
    averageJobProcessingTime: number;
    systemLoad: {
      cpu: number;
      memory: number;
    };
  }> {
    const stats = this.getWorkerStats();
    
    return {
      totalWorkers: stats.length,
      runningWorkers: stats.filter(s => s.status === 'running').length,
      totalProcessedJobs: stats.reduce((sum, s) => sum + s.processedJobs, 0),
      totalFailedJobs: stats.reduce((sum, s) => sum + s.failedJobs, 0),
      averageJobProcessingTime: 0, // Would calculate from metrics
      systemLoad: {
        cpu: process.cpuUsage().user / 1000000, // Convert to seconds
        memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      },
    };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    workers: Array<{
      workerId: string;
      healthy: boolean;
      status: string;
      lastSeen: Date;
    }>;
  }> {
    const workerHealths = Array.from(this.workers.values()).map(worker => ({
      workerId: worker.config.workerId,
      healthy: worker.isHealthy(),
      status: worker.getStats().status,
      lastSeen: worker.getStats().lastJobAt || new Date(),
    }));

    const allHealthy = workerHealths.every(w => w.healthy);

    return {
      healthy: allHealthy,
      workers: workerHealths,
    };
  }
}

class WorkerInstance {
  public config: WorkerConfig;
  private startTime: Date;
  private processedJobs = 0;
  private failedJobs = 0;
  private currentJobs = 0;
  private status: WorkerStats['status'] = 'stopped';
  private lastJobAt?: Date;
  private lastError?: string;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    config: WorkerConfig,
    private queueService: QueueService,
    private _storageService: StorageService, // Marked as private for future use
    private _metricsService: MetricsService, // Marked as private for future use
    private screenshotCaptureService: ScreenshotCaptureService,
    private emailClients: Map<string, EmailClient>
  ) {
    this.config = config;
    this.startTime = new Date();
  }

  async start(): Promise<void> {
    this.status = 'starting';
    
    try {
      await this.queueService.startWorker(
        this.config.workerId,
        this.processJob.bind(this),
        {
          concurrency: this.config.concurrency,
          limiter: {
            max: this.config.maxJobs,
            duration: 60000, // 1 minute
          },
        }
      );

      this.status = 'running';
      this.startHealthCheck();
      
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.status = 'stopping';
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    try {
      await this.queueService.stopWorker(this.config.workerId);
      this.status = 'stopped';
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  private async processJob(job: Job<QueueJobData, QueueJobResult>): Promise<QueueJobResult> {
    const startTime = Date.now();
    this.currentJobs++;
    this.lastJobAt = new Date();

    try {
      const { jobId, templateHtml, clientIds, options } = job.data;

      // Get email clients
      const clients = clientIds
        .map(id => this.emailClients.get(id))
        .filter((client): client is EmailClient => client !== undefined);

      if (clients.length === 0) {
        throw new Error('No valid email clients found');
      }

      // Update job progress
      await job.updateProgress(10);

      // Capture screenshots
      const captureResults = await this.screenshotCaptureService.captureScreenshots(
        jobId,
        templateHtml,
        clients,
        {
          viewports: options?.viewports || [
            { width: 600, height: 800, name: 'desktop' },
            { width: 375, height: 667, name: 'mobile' },
          ],
          darkMode: options?.darkMode || false,
          mobileSimulation: options?.mobileSimulation || false,
          timeout: 30000,
          delay: 2000,
        }
      );

      await job.updateProgress(80);

      // Process results
      const results = captureResults.map(result => ({
        clientId: result.clientId,
        screenshots: result.screenshots.map(screenshot => {
          const screenshotData: { viewport: string; lightMode?: string; darkMode?: string } = {
            viewport: screenshot.viewport
          };
          if (screenshot.lightMode?.url) {
            screenshotData.lightMode = screenshot.lightMode.url;
          }
          if (screenshot.darkMode?.url) {
            screenshotData.darkMode = screenshot.darkMode.url;
          }
          return screenshotData;
        }),
        compatibility: {
          score: result.success ? 95 : 0, // Simplified scoring
          issues: result.error ? [result.error] : [],
          warnings: [], // CaptureResult doesn't have warnings property
        },
        ...(options?.accessibility ? {
          accessibility: {
            score: 90, // Placeholder
            violations: [] as Array<{
              rule: string;
              severity: 'error' | 'warning' | 'info';
              description: string;
            }>, // CaptureResult doesn't have accessibility property
          }
        } : {}),
        ...(options?.performance ? {
          performance: {
            loadTime: result.metadata.captureTime,
            renderTime: result.metadata.captureTime,
            fileSize: 0, // Would calculate from screenshots
            optimizations: [],
          }
        } : {}),
      }));

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      const success = results.every(r => r.compatibility.score > 0);

      this.processedJobs++;
      this.currentJobs--;

      return {
        jobId,
        success,
        results,
        completedAt: new Date(),
        processingTime,
      };

    } catch (error) {
      this.failedJobs++;
      this.currentJobs--;
      this.lastError = error instanceof Error ? error.message : 'Unknown error';

      const processingTime = Date.now() - startTime;

      return {
        jobId: job.data.jobId,
        success: false,
        results: [],
        completedAt: new Date(),
        processingTime,
        error: this.lastError,
      };
    }
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      // Perform health checks
      const stats = this.getStats();
      
      // Check if worker is responsive
      if (stats.status === 'running' && stats.lastJobAt) {
        const timeSinceLastJob = Date.now() - stats.lastJobAt.getTime();
        if (timeSinceLastJob > this.config.healthCheckInterval * 2) {
          console.warn(`Worker ${this.config.workerId} hasn't processed jobs recently`);
        }
      }

      // Check memory usage
      if (stats.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn(`Worker ${this.config.workerId} has high memory usage`);
      }

    }, this.config.healthCheckInterval);
  }

  getStats(): WorkerStats {
    const stats: WorkerStats = {
      workerId: this.config.workerId,
      status: this.status,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      currentJobs: this.currentJobs,
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
    
    if (this.lastJobAt) {
      stats.lastJobAt = this.lastJobAt;
    }
    
    if (this.lastError) {
      stats.lastError = this.lastError;
    }
    
    return stats;
  }

  isHealthy(): boolean {
    return this.status === 'running' && !this.lastError;
  }
} 