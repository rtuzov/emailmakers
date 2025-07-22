import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { MetricsService } from '../monitoring/metrics-service';

export interface QueueJobData {
  jobId: string;
  templateHtml: string;
  clientIds: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  options?: {
    viewports?: Array<{ width: number; height: number; name: string }>;
    darkMode?: boolean;
    mobileSimulation?: boolean;
    accessibility?: boolean;
    performance?: boolean;
  };
  metadata?: {
    userId?: string;
    campaignId?: string;
    templateId?: string;
    createdAt: Date;
  };
}

export interface QueueJobResult {
  jobId: string;
  success: boolean;
  results: Array<{
    clientId: string;
    screenshots: Array<{
      viewport: string;
      lightMode?: string;
      darkMode?: string;
    }>;
    compatibility: {
      score: number;
      issues: string[];
      warnings: string[];
    };
    accessibility?: {
      score: number;
      violations: Array<{
        rule: string;
        severity: 'error' | 'warning' | 'info';
        description: string;
      }>;
    };
    performance?: {
      loadTime: number;
      renderTime: number;
      fileSize: number;
      optimizations: string[];
    };
  }>;
  completedAt: Date;
  processingTime: number;
  error?: string;
}

export class QueueService {
  private redis: Redis;
  private renderQueue: Queue<QueueJobData, QueueJobResult>;
  private workers: Map<string, Worker> = new Map();
  private metricsService: MetricsService;

  constructor(
    redisConfig: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    },
    metricsService: MetricsService
  ) {
    this.redis = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      ...(redisConfig.password ? { password: redisConfig.password } : {}),
      db: redisConfig.db || 0,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.metricsService = metricsService;

    const queueOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    this.renderQueue = new Queue('render-testing', queueOptions);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.renderQueue.on('global:completed' as any, (job: Job<QueueJobData, QueueJobResult>) => {
      this.metricsService.recordJobCompletion(job.id!, job.data.priority, job.processedOn! - job.processedOn!);
    });

    this.renderQueue.on('global:failed' as any, (job: Job<QueueJobData, QueueJobResult> | undefined, err: Error) => {
      if (job) {
        this.metricsService.recordJobFailure(job.id!, job.data.priority, err.message);
      }
    });

    this.renderQueue.on('global:stalled' as any, (jobId: string) => {
      this.metricsService.recordJobStall(jobId);
    });
  }

  async addRenderJob(data: QueueJobData): Promise<string> {
    const priorityMap = {
      low: 1,
      normal: 5,
      high: 10,
      urgent: 20,
    };

    const job = await this.renderQueue.add('render-email', data, {
      priority: priorityMap[data.priority],
      delay: data.priority === 'low' ? 5000 : 0, // Delay low priority jobs
      jobId: data.jobId,
    });

    this.metricsService.recordJobQueued(data.jobId, data.priority);
    return job.id!;
  }

  async getJobStatus(jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'stalled';
    progress?: number;
    result?: QueueJobResult;
    error?: string;
    position?: number;
  }> {
    const job = await this.renderQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const error = job.failedReason;

    let position: number | undefined;
    if (state === 'waiting') {
      const waitingJobs = await this.renderQueue.getWaiting();
      position = waitingJobs.findIndex(j => j.id === jobId) + 1;
    }

    return {
      status: state as any,
      ...(typeof progress === 'number' ? { progress } : {}),
      result,
      error,
      ...(position !== undefined ? { position } : {}),
    };
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.renderQueue.getJob(jobId);
    if (!job) {
      return false;
    }

    try {
      await job.remove();
      this.metricsService.recordJobCancellation(jobId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = await this.renderQueue.getJob(jobId);
    if (!job) {
      return false;
    }

    try {
      await job.retry();
      this.metricsService.recordJobRetry(jobId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    stalled: number;
    workers: number;
  }> {
    const counts = await this.renderQueue.getJobCounts();
    
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      stalled: counts.stalled || 0,
      workers: this.workers.size,
    };
  }

  async startWorker(
    workerId: string,
    processor: (job: Job<QueueJobData, QueueJobResult>) => Promise<QueueJobResult>,
    options: Partial<WorkerOptions> = {}
  ): Promise<void> {
    if (this.workers.has(workerId)) {
      throw new Error(`Worker ${workerId} already exists`);
    }

    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: options.concurrency || 1,
      limiter: {
        max: options.limiter?.max || 10,
        duration: options.limiter?.duration || 60000, // 1 minute
      },
      ...options,
    };

    const worker = new Worker('render-testing', processor, workerOptions);

    worker.on('completed', (job: Job<QueueJobData, QueueJobResult>) => {
      console.log(`Worker ${workerId} completed job ${job.id}`);
    });

    worker.on('failed', (job: Job<QueueJobData, QueueJobResult> | undefined, err: Error) => {
      console.error(`Worker ${workerId} failed job ${job?.id}:`, err.message);
    });

    worker.on('error', (err: Error) => {
      console.error(`Worker ${workerId} error:`, err.message);
    });

    this.workers.set(workerId, worker);
    this.metricsService.recordWorkerStart(workerId);
  }

  async stopWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    await worker.close();
    this.workers.delete(workerId);
    this.metricsService.recordWorkerStop(workerId);
  }

  async stopAllWorkers(): Promise<void> {
    const promises = Array.from(this.workers.keys()).map(workerId => 
      this.stopWorker(workerId)
    );
    await Promise.all(promises);
  }

  async getWorkerStats(): Promise<Array<{
    workerId: string;
    running: boolean;
    processed: number;
    failed: number;
    concurrency: number;
  }>> {
    const stats = [];
    
    for (const [workerId, worker] of this.workers) {
      stats.push({
        workerId,
        running: !worker.closing,
        processed: 0, // Would need to track this separately
        failed: 0,    // Would need to track this separately
        concurrency: worker.opts.concurrency || 1,
      });
    }

    return stats;
  }

  async cleanup(): Promise<void> {
    await this.stopAllWorkers();
    await this.renderQueue.close();
    await this.redis.quit();
  }

  // Health check method
  async healthCheck(): Promise<{
    redis: boolean;
    queue: boolean;
    workers: number;
    lastJobProcessed?: Date;
  }> {
    try {
      // Check Redis connection
      const redisStatus = await this.redis.ping();
      const redisHealthy = redisStatus === 'PONG';

      // Check queue status
      const queueStats = await this.getQueueStats();
      const queueHealthy = queueStats !== null;

      // Get last completed job timestamp
      const completedJobs = await this.renderQueue.getCompleted(0, 0);
      const lastJobProcessed = completedJobs.length > 0 && completedJobs[0]?.processedOn
        ? new Date(completedJobs[0].processedOn)
        : undefined;

      return {
        redis: redisHealthy,
        queue: queueHealthy,
        workers: this.workers.size,
        ...(lastJobProcessed ? { lastJobProcessed } : {}),
      };
    } catch (error) {
      return {
        redis: false,
        queue: false,
        workers: 0,
      };
    }
  }
}