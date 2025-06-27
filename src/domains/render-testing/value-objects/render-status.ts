import { z } from 'zod';

/**
 * Value Objects for Render Testing Domain - Status and Progress
 * 
 * These value objects represent immutable data structures for tracking
 * render job status, progress, and completion states.
 */

// Render status enumeration and value object
export const RenderStatusEnum = {
  PENDING: 'pending',
  QUEUED: 'queued',
  INITIALIZING: 'initializing',
  PROCESSING: 'processing',
  CAPTURING: 'capturing',
  ANALYZING: 'analyzing',
  COMPLETING: 'completing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout'
} as const;

export type RenderStatusType = typeof RenderStatusEnum[keyof typeof RenderStatusEnum];

export const RenderStatusSchema = z.enum([
  RenderStatusEnum.PENDING,
  RenderStatusEnum.QUEUED,
  RenderStatusEnum.INITIALIZING,
  RenderStatusEnum.PROCESSING,
  RenderStatusEnum.CAPTURING,
  RenderStatusEnum.ANALYZING,
  RenderStatusEnum.COMPLETING,
  RenderStatusEnum.COMPLETED,
  RenderStatusEnum.FAILED,
  RenderStatusEnum.CANCELLED,
  RenderStatusEnum.TIMEOUT
]);

export class RenderStatus {
  private constructor(private readonly status: RenderStatusType) {}

  static create(status: RenderStatusType): RenderStatus {
    const validated = RenderStatusSchema.parse(status);
    return new RenderStatus(validated);
  }

  static pending(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.PENDING);
  }

  static queued(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.QUEUED);
  }

  static processing(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.PROCESSING);
  }

  static completed(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.COMPLETED);
  }

  static failed(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.FAILED);
  }

  static cancelled(): RenderStatus {
    return new RenderStatus(RenderStatusEnum.CANCELLED);
  }

  get value(): RenderStatusType {
    return this.status;
  }

  /**
   * Check if status is pending
   */
  isPending(): boolean {
    return this.status === RenderStatusEnum.PENDING;
  }

  /**
   * Check if status is queued
   */
  isQueued(): boolean {
    return this.status === RenderStatusEnum.QUEUED;
  }

  /**
   * Check if status is active (processing)
   */
  isActive(): boolean {
    return [
      RenderStatusEnum.QUEUED,
      RenderStatusEnum.PROCESSING,
      RenderStatusEnum.CAPTURING,
      RenderStatusEnum.INITIALIZING,
      RenderStatusEnum.ANALYZING,
      RenderStatusEnum.COMPLETING
    ].includes(this.status as any);
  }

  /**
   * Check if status is terminal (cannot change)
   */
  isTerminal(): boolean {
    return [
      RenderStatusEnum.COMPLETED,
      RenderStatusEnum.FAILED,
      RenderStatusEnum.CANCELLED,
      RenderStatusEnum.TIMEOUT
    ].includes(this.status as any);
  }

  /**
   * Check if status represents an error state
   */
  isError(): boolean {
    return [
      RenderStatusEnum.FAILED,
      RenderStatusEnum.CANCELLED,
      RenderStatusEnum.TIMEOUT
    ].includes(this.status as any);
  }

  /**
   * Check if status represents a failure
   */
  isFailure(): boolean {
    return [
      RenderStatusEnum.FAILED,
      RenderStatusEnum.TIMEOUT
    ].includes(this.status as any);
  }

  /**
   * Check if job can be cancelled
   */
  canBeCancelled(): boolean {
    return !this.isTerminal();
  }

  /**
   * Check if job can be retried
   */
  canBeRetried(): boolean {
    return [
      RenderStatusEnum.FAILED,
      RenderStatusEnum.TIMEOUT
    ].includes(this.status as any);
  }

  /**
   * Get status display name
   */
  getDisplayName(): string {
    const displayNames: Record<RenderStatusType, string> = {
      [RenderStatusEnum.PENDING]: 'Pending',
      [RenderStatusEnum.QUEUED]: 'Queued',
      [RenderStatusEnum.INITIALIZING]: 'Initializing',
      [RenderStatusEnum.PROCESSING]: 'Processing',
      [RenderStatusEnum.CAPTURING]: 'Capturing Screenshots',
      [RenderStatusEnum.ANALYZING]: 'Analyzing Results',
      [RenderStatusEnum.COMPLETING]: 'Finalizing',
      [RenderStatusEnum.COMPLETED]: 'Completed',
      [RenderStatusEnum.FAILED]: 'Failed',
      [RenderStatusEnum.CANCELLED]: 'Cancelled',
      [RenderStatusEnum.TIMEOUT]: 'Timed Out'
    };

    return displayNames[this.status];
  }

  /**
   * Get status color for UI
   */
  getColor(): string {
    const colors: Record<RenderStatusType, string> = {
      [RenderStatusEnum.PENDING]: 'gray',
      [RenderStatusEnum.QUEUED]: 'blue',
      [RenderStatusEnum.INITIALIZING]: 'blue',
      [RenderStatusEnum.PROCESSING]: 'yellow',
      [RenderStatusEnum.CAPTURING]: 'yellow',
      [RenderStatusEnum.ANALYZING]: 'yellow',
      [RenderStatusEnum.COMPLETING]: 'yellow',
      [RenderStatusEnum.COMPLETED]: 'green',
      [RenderStatusEnum.FAILED]: 'red',
      [RenderStatusEnum.CANCELLED]: 'gray',
      [RenderStatusEnum.TIMEOUT]: 'orange'
    };

    return colors[this.status];
  }

  /**
   * Get next valid statuses
   */
  getNextValidStatuses(): RenderStatusType[] {
    const transitions: Record<RenderStatusType, RenderStatusType[]> = {
      [RenderStatusEnum.PENDING]: [RenderStatusEnum.QUEUED, RenderStatusEnum.CANCELLED],
      [RenderStatusEnum.QUEUED]: [RenderStatusEnum.INITIALIZING, RenderStatusEnum.CANCELLED],
      [RenderStatusEnum.INITIALIZING]: [RenderStatusEnum.PROCESSING, RenderStatusEnum.FAILED, RenderStatusEnum.CANCELLED],
      [RenderStatusEnum.PROCESSING]: [RenderStatusEnum.CAPTURING, RenderStatusEnum.FAILED, RenderStatusEnum.CANCELLED, RenderStatusEnum.TIMEOUT],
      [RenderStatusEnum.CAPTURING]: [RenderStatusEnum.ANALYZING, RenderStatusEnum.FAILED, RenderStatusEnum.CANCELLED, RenderStatusEnum.TIMEOUT],
      [RenderStatusEnum.ANALYZING]: [RenderStatusEnum.COMPLETING, RenderStatusEnum.FAILED, RenderStatusEnum.CANCELLED, RenderStatusEnum.TIMEOUT],
      [RenderStatusEnum.COMPLETING]: [RenderStatusEnum.COMPLETED, RenderStatusEnum.FAILED],
      [RenderStatusEnum.COMPLETED]: [],
      [RenderStatusEnum.FAILED]: [],
      [RenderStatusEnum.CANCELLED]: [],
      [RenderStatusEnum.TIMEOUT]: []
    };

    return transitions[this.status] || [];
  }

  /**
   * Check if transition to new status is valid
   */
  canTransitionTo(newStatus: RenderStatusType): boolean {
    return this.getNextValidStatuses().includes(newStatus);
  }

  /**
   * Get progress percentage for status
   */
  getProgressPercentage(): number {
    const progressMap: Record<RenderStatusType, number> = {
      [RenderStatusEnum.PENDING]: 0,
      [RenderStatusEnum.QUEUED]: 5,
      [RenderStatusEnum.INITIALIZING]: 10,
      [RenderStatusEnum.PROCESSING]: 25,
      [RenderStatusEnum.CAPTURING]: 50,
      [RenderStatusEnum.ANALYZING]: 75,
      [RenderStatusEnum.COMPLETING]: 90,
      [RenderStatusEnum.COMPLETED]: 100,
      [RenderStatusEnum.FAILED]: 0,
      [RenderStatusEnum.CANCELLED]: 0,
      [RenderStatusEnum.TIMEOUT]: 0
    };

    return progressMap[this.status];
  }

  /**
   * Check equality with another status
   */
  equals(other: RenderStatus): boolean {
    return this.status === other.status;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.status;
  }
}

// Progress tracking value object
export const ProgressSchema = z.object({
  percentage: z.number().min(0).max(100),
  currentStep: z.string(),
  totalSteps: z.number().positive(),
  completedSteps: z.number().min(0),
  estimatedTimeRemaining: z.number().min(0).optional(), // seconds
  details: z.string().optional()
});

export type ProgressData = z.infer<typeof ProgressSchema>;

export class Progress {
  private constructor(private readonly data: ProgressData) {}

  static create(data: ProgressData): Progress {
    const validated = ProgressSchema.parse(data);
    
    // Validate business rules
    if (validated.completedSteps > validated.totalSteps) {
      throw new Error('Completed steps cannot exceed total steps');
    }

    return new Progress(validated);
  }

  static empty(): Progress {
    return new Progress({
      percentage: 0,
      currentStep: 'Initializing',
      totalSteps: 1,
      completedSteps: 0
    });
  }

  static completed(): Progress {
    return new Progress({
      percentage: 100,
      currentStep: 'Completed',
      totalSteps: 1,
      completedSteps: 1
    });
  }

  get percentage(): number { return this.data.percentage; }
  get currentStep(): string { return this.data.currentStep; }
  get totalSteps(): number { return this.data.totalSteps; }
  get completedSteps(): number { return this.data.completedSteps; }
  get estimatedTimeRemaining(): number | undefined { return this.data.estimatedTimeRemaining; }
  get details(): string | undefined { return this.data.details; }

  /**
   * Check if progress is complete
   */
  isComplete(): boolean {
    return this.data.percentage >= 100;
  }

  /**
   * Check if progress has started
   */
  hasStarted(): boolean {
    return this.data.percentage > 0;
  }

  /**
   * Get remaining steps
   */
  getRemainingSteps(): number {
    return this.data.totalSteps - this.data.completedSteps;
  }

  /**
   * Get completion ratio
   */
  getCompletionRatio(): number {
    return this.data.completedSteps / this.data.totalSteps;
  }

  /**
   * Get estimated time remaining formatted
   */
  getEstimatedTimeRemainingFormatted(): string | undefined {
    if (!this.data.estimatedTimeRemaining) return undefined;

    const seconds = this.data.estimatedTimeRemaining;
    
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Create updated progress
   */
  withUpdates(updates: Partial<ProgressData>): Progress {
    return Progress.create({ ...this.data, ...updates });
  }

  /**
   * Update percentage
   */
  updatePercentage(percentage: number): Progress {
    return this.withUpdates({ percentage });
  }

  /**
   * Update current step
   */
  updateCurrentStep(currentStep: string, details?: string): Progress {
    return this.withUpdates({ currentStep, details });
  }

  /**
   * Increment completed steps
   */
  incrementCompletedSteps(): Progress {
    const newCompletedSteps = Math.min(this.data.completedSteps + 1, this.data.totalSteps);
    const newPercentage = Math.round((newCompletedSteps / this.data.totalSteps) * 100);
    
    return this.withUpdates({ 
      completedSteps: newCompletedSteps,
      percentage: newPercentage 
    });
  }

  /**
   * Set completed steps
   */
  setCompletedSteps(completedSteps: number): Progress {
    const clampedSteps = Math.max(0, Math.min(completedSteps, this.data.totalSteps));
    const newPercentage = Math.round((clampedSteps / this.data.totalSteps) * 100);
    
    return this.withUpdates({ 
      completedSteps: clampedSteps,
      percentage: newPercentage 
    });
  }

  /**
   * Update estimated time remaining
   */
  updateEstimatedTimeRemaining(seconds: number): Progress {
    return this.withUpdates({ estimatedTimeRemaining: seconds });
  }

  /**
   * Export data
   */
  toData(): ProgressData {
    return { ...this.data };
  }

  /**
   * String representation
   */
  toString(): string {
    const timeText = this.getEstimatedTimeRemainingFormatted();
    const timeDisplay = timeText ? ` (${timeText} remaining)` : '';
    return `${this.data.percentage}% - ${this.data.currentStep}${timeDisplay}`;
  }
}

// Job priority value object
export const JobPriorityEnum = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5
} as const;

export type JobPriorityType = typeof JobPriorityEnum[keyof typeof JobPriorityEnum];

export const JobPrioritySchema = z.number().min(1).max(5);

export class JobPriority {
  private constructor(private readonly priority: JobPriorityType) {}

  static create(priority: JobPriorityType): JobPriority {
    const validated = JobPrioritySchema.parse(priority);
    return new JobPriority(validated as JobPriorityType);
  }

  static low(): JobPriority {
    return new JobPriority(JobPriorityEnum.LOW);
  }

  static normal(): JobPriority {
    return new JobPriority(JobPriorityEnum.NORMAL);
  }

  static high(): JobPriority {
    return new JobPriority(JobPriorityEnum.HIGH);
  }

  static urgent(): JobPriority {
    return new JobPriority(JobPriorityEnum.URGENT);
  }

  static critical(): JobPriority {
    return new JobPriority(JobPriorityEnum.CRITICAL);
  }

  get value(): JobPriorityType {
    return this.priority;
  }

  /**
   * Check if priority is high (3+)
   */
  isHigh(): boolean {
    return this.priority >= JobPriorityEnum.HIGH;
  }

  /**
   * Check if priority is urgent (4+)
   */
  isUrgent(): boolean {
    return this.priority >= JobPriorityEnum.URGENT;
  }

  /**
   * Check if priority is critical
   */
  isCritical(): boolean {
    return this.priority === JobPriorityEnum.CRITICAL;
  }

  /**
   * Get priority display name
   */
  getDisplayName(): string {
    const names: Record<JobPriorityType, string> = {
      [JobPriorityEnum.LOW]: 'Low',
      [JobPriorityEnum.NORMAL]: 'Normal',
      [JobPriorityEnum.HIGH]: 'High',
      [JobPriorityEnum.URGENT]: 'Urgent',
      [JobPriorityEnum.CRITICAL]: 'Critical'
    };

    return names[this.priority];
  }

  /**
   * Get priority color for UI
   */
  getColor(): string {
    const colors: Record<JobPriorityType, string> = {
      [JobPriorityEnum.LOW]: 'gray',
      [JobPriorityEnum.NORMAL]: 'blue',
      [JobPriorityEnum.HIGH]: 'yellow',
      [JobPriorityEnum.URGENT]: 'orange',
      [JobPriorityEnum.CRITICAL]: 'red'
    };

    return colors[this.priority];
  }

  /**
   * Get queue weight for priority scheduling
   */
  getQueueWeight(): number {
    return this.priority * 10;
  }

  /**
   * Compare with another priority
   */
  isHigherThan(other: JobPriority): boolean {
    return this.priority > other.priority;
  }

  /**
   * Compare with another priority
   */
  isLowerThan(other: JobPriority): boolean {
    return this.priority < other.priority;
  }

  /**
   * Check equality with another priority
   */
  equals(other: JobPriority): boolean {
    return this.priority === other.priority;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.getDisplayName();
  }
} 