import { z } from 'zod';

/**
 * RenderJob Entity - Core domain entity for email render testing jobs
 * 
 * This entity represents a complete email render testing job that includes
 * testing across multiple email clients with various configurations.
 */

// RenderJob Status enumeration
export const RenderJobStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type RenderJobStatusType = typeof RenderJobStatus[keyof typeof RenderJobStatus];

// Priority levels for job processing
export const JobPriority = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4
} as const;

export type JobPriorityType = typeof JobPriority[keyof typeof JobPriority];

// Render job configuration schema
export const RenderJobConfigSchema = z.object({
  clients: z.array(z.string()).min(1, 'At least one client must be specified'),
  viewports: z.array(z.object({
    width: z.number().min(320).max(1920),
    height: z.number().min(568).max(1080),
    devicePixelRatio: z.number().min(1).max(3).default(1),
    name: z.string()
  })).default([
    { width: 600, height: 800, devicePixelRatio: 1, name: 'desktop' },
    { width: 375, height: 667, devicePixelRatio: 2, name: 'mobile' }
  ]),
  darkModeEnabled: z.boolean().default(true),
  accessibilityTesting: z.boolean().default(true),
  performanceAnalysis: z.boolean().default(true),
  spamAnalysis: z.boolean().default(true),
  screenshotFormat: z.enum(['png', 'jpeg', 'webp']).default('png'),
  screenshotQuality: z.number().min(60).max(100).default(90)
});

export type RenderJobConfig = z.infer<typeof RenderJobConfigSchema>;

// Main RenderJob entity schema
export const RenderJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  templateId: z.string().uuid().optional().nullable(),
  htmlContent: z.string().min(1, 'HTML content is required'),
  subject: z.string().optional().nullable(),
  preheader: z.string().optional().nullable(),
  config: RenderJobConfigSchema,
  status: z.enum([
    RenderJobStatus.PENDING,
    RenderJobStatus.QUEUED,
    RenderJobStatus.PROCESSING,
    RenderJobStatus.COMPLETED,
    RenderJobStatus.FAILED,
    RenderJobStatus.CANCELLED
  ]),
  priority: z.number().min(1).max(4).default(JobPriority.NORMAL),
  progress: z.number().min(0).max(100).default(0),
  startedAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  estimatedDuration: z.number().positive().optional().nullable(), // seconds
  actualDuration: z.number().positive().optional().nullable(), // seconds
  createdAt: z.date(),
  updatedAt: z.date()
});

export type RenderJobData = z.infer<typeof RenderJobSchema>;

/**
 * RenderJob Domain Entity
 * 
 * Encapsulates the business logic and invariants for email render testing jobs.
 * Follows DDD principles with rich domain behavior.
 */
export class RenderJob {
  private constructor(private data: RenderJobData) {
    this.validateInvariants();
  }

  /**
   * Factory method to create a new RenderJob
   */
  static create(params: {
    userId: string;
    htmlContent: string;
    config: RenderJobConfig;
    templateId?: string;
    subject?: string;
    preheader?: string;
    priority?: JobPriorityType;
  }): RenderJob {
    const now = new Date();
    const id = crypto.randomUUID();

    const jobData: RenderJobData = {
      id,
      userId: params.userId,
      templateId: params.templateId,
      htmlContent: params.htmlContent,
      subject: params.subject,
      preheader: params.preheader,
      config: params.config,
      status: RenderJobStatus.PENDING,
      priority: params.priority || JobPriority.NORMAL,
      progress: 0,
      createdAt: now,
      updatedAt: now
    };

    return new RenderJob(jobData);
  }

  /**
   * Factory method to reconstruct RenderJob from persistence
   */
  static fromData(data: RenderJobData): RenderJob {
    return new RenderJob(data);
  }

  /**
   * Domain invariants validation
   */
  private validateInvariants(): void {
    if (this.data.status === RenderJobStatus.COMPLETED && !this.data.completedAt) {
      throw new Error('Completed jobs must have a completion timestamp');
    }

    if (this.data.status === RenderJobStatus.PROCESSING && !this.data.startedAt) {
      throw new Error('Processing jobs must have a start timestamp');
    }

    if (this.data.progress > 0 && this.data.status === RenderJobStatus.PENDING) {
      throw new Error('Pending jobs cannot have progress');
    }

    if (this.data.config.clients.length === 0) {
      throw new Error('At least one email client must be specified');
    }
  }

  // Getters
  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get templateId(): string | undefined { return this.data.templateId ?? undefined; }
  get htmlContent(): string { return this.data.htmlContent; }
  get subject(): string | undefined { return this.data.subject ?? undefined; }
  get preheader(): string | undefined { return this.data.preheader ?? undefined; }
  get config(): RenderJobConfig { return this.data.config; }
  get status(): RenderJobStatusType { return this.data.status; }
  get priority(): JobPriorityType { return this.data.priority as JobPriorityType; }
  get progress(): number { return this.data.progress; }
  get startedAt(): Date | undefined { return this.data.startedAt ?? undefined; }
  get completedAt(): Date | undefined { return this.data.completedAt ?? undefined; }
  get errorMessage(): string | undefined { return this.data.errorMessage ?? undefined; }
  get estimatedDuration(): number | undefined { return this.data.estimatedDuration ?? undefined; }
  get actualDuration(): number | undefined { return this.data.actualDuration ?? undefined; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Business logic methods
   */

  /**
   * Start job processing
   */
  start(): void {
    if (this.data.status !== RenderJobStatus.PENDING && this.data.status !== RenderJobStatus.QUEUED) {
      throw new Error(`Cannot start job in ${this.data.status} status`);
    }

    this.data.status = RenderJobStatus.PROCESSING;
    this.data.startedAt = new Date();
    this.data.updatedAt = new Date();
    this.validateInvariants();
  }

  /**
   * Update job progress
   */
  updateProgress(progress: number): void {
    if (this.data.status !== RenderJobStatus.PROCESSING) {
      throw new Error(`Cannot update progress for job in ${this.data.status} status`);
    }

    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    this.data.progress = progress;
    this.data.updatedAt = new Date();
  }

  /**
   * Complete job successfully
   */
  complete(): void {
    if (this.data.status !== RenderJobStatus.PROCESSING) {
      throw new Error(`Cannot complete job in ${this.data.status} status`);
    }

    const now = new Date();
    this.data.status = RenderJobStatus.COMPLETED;
    this.data.completedAt = now;
    this.data.progress = 100;
    this.data.updatedAt = now;

    // Calculate actual duration if started
    if (this.data.startedAt) {
      this.data.actualDuration = Math.floor((now.getTime() - this.data.startedAt.getTime()) / 1000);
    }

    this.validateInvariants();
  }

  /**
   * Fail job with error message
   */
  fail(errorMessage: string): void {
    if (this.data.status === RenderJobStatus.COMPLETED) {
      throw new Error('Cannot fail a completed job');
    }

    const now = new Date();
    this.data.status = RenderJobStatus.FAILED;
    this.data.errorMessage = errorMessage;
    this.data.updatedAt = now;

    // Calculate actual duration if started
    if (this.data.startedAt) {
      this.data.actualDuration = Math.floor((now.getTime() - this.data.startedAt.getTime()) / 1000);
    }
  }

  /**
   * Cancel job
   */
  cancel(): void {
    if (this.data.status === RenderJobStatus.COMPLETED || this.data.status === RenderJobStatus.FAILED) {
      throw new Error(`Cannot cancel job in ${this.data.status} status`);
    }

    const now = new Date();
    this.data.status = RenderJobStatus.CANCELLED;
    this.data.updatedAt = now;

    // Calculate actual duration if started
    if (this.data.startedAt) {
      this.data.actualDuration = Math.floor((now.getTime() - this.data.startedAt.getTime()) / 1000);
    }
  }

  /**
   * Queue job for processing
   */
  queue(): void {
    if (this.data.status !== RenderJobStatus.PENDING) {
      throw new Error(`Cannot queue job in ${this.data.status} status`);
    }

    this.data.status = RenderJobStatus.QUEUED;
    this.data.updatedAt = new Date();
  }

  /**
   * Set estimated duration
   */
  setEstimatedDuration(seconds: number): void {
    if (seconds <= 0) {
      throw new Error('Estimated duration must be positive');
    }

    this.data.estimatedDuration = seconds;
    this.data.updatedAt = new Date();
  }

  /**
   * Check if job is in terminal status
   */
  isTerminal(): boolean {
    const terminalStatuses = [
      RenderJobStatus.COMPLETED,
      RenderJobStatus.FAILED,
      RenderJobStatus.CANCELLED
    ] as const;
    return terminalStatuses.includes(this.data.status as any);
  }

  /**
   * Check if job is active (processing or queued)
   */
  isActive(): boolean {
    const activeStatuses = [
      RenderJobStatus.QUEUED,
      RenderJobStatus.PROCESSING
    ] as const;
    return activeStatuses.includes(this.data.status as any);
  }

  /**
   * Get total number of render tasks (clients × viewports)
   */
  getTotalTasks(): number {
    return this.data.config.clients.length * this.data.config.viewports.length;
  }

  /**
   * Export entity data for persistence
   */
  toData(): RenderJobData {
    return { ...this.data };
  }

  /**
   * Create a copy with updated data
   */
  update(updates: Partial<Omit<RenderJobData, 'id' | 'createdAt'>>): RenderJob {
    const updatedData = {
      ...this.data,
      ...updates,
      updatedAt: new Date()
    };

    return new RenderJob(updatedData);
  }
} 