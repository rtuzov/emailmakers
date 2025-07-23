import { RenderJob, RenderJobConfig, JobPriorityType } from '../entities/render-job';
import { TestResult } from '../entities/test-result';
import { EmailClient } from '../entities/email-client';
import { Screenshot } from '../entities/screenshot';
import { RenderStatus } from '../value-objects/render-status';
import { Progress } from '../value-objects/render-status';
// import { JobPriority } from '../value-objects/render-status';
import { QueueService, QueueJobData /* , QueueJobResult */ } from '../../../shared/infrastructure/queue/queue-service';
// import { StorageService } from '../../../shared/infrastructure/storage/storage-service'; // Currently unused
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';
import { ScreenshotCaptureService } from './screenshot-capture-service';
import { AccessibilityTestingService, AccessibilityResult } from './accessibility-testing-service';
import { PerformanceAnalysisService, PerformanceResult } from './performance-analysis-service';
import { SpamAnalysisService, SpamAnalysisResult } from './spam-analysis-service';

/**
 * RenderOrchestrationService - Main service for coordinating email render testing
 * 
 * This service orchestrates the entire render testing process, managing job
 * lifecycle, client coordination, and result aggregation.
 */

export interface RenderJobRepository {
  save(job: RenderJob): Promise<void>;
  findById(id: string): Promise<RenderJob | null>;
  findByUserId(userId: string): Promise<RenderJob[]>;
  findByStatus(status: string): Promise<RenderJob[]>;
  update(job: RenderJob): Promise<void>;
}

export interface TestResultRepository {
  save(result: TestResult): Promise<void>;
  findById(id: string): Promise<TestResult | null>;
  findByJobId(jobId: string): Promise<TestResult | null>;
  update(result: TestResult): Promise<void>;
}

export interface EmailClientRepository {
  findAll(): Promise<EmailClient[]>;
  findActive(): Promise<EmailClient[]>;
  findById(id: string): Promise<EmailClient | null>;
  findByIds(ids: string[]): Promise<EmailClient[]>;
}

export interface ScreenshotRepository {
  save(screenshot: Screenshot): Promise<void>;
  findById(id: string): Promise<Screenshot | null>;
  findByJobId(jobId: string): Promise<Screenshot[]>;
  update(screenshot: Screenshot): Promise<void>;
}

export interface RenderEngineService {
  executeRenderJob(job: RenderJob, clients: EmailClient[]): Promise<void>;
  cancelJob(jobId: string): Promise<void>;
  getJobProgress(jobId: string): Promise<Progress>;
}

export interface NotificationService {
  notifyJobCompleted(jobId: string, userId: string): Promise<void>;
  notifyJobFailed(jobId: string, userId: string, error: string): Promise<void>;
  notifyJobProgress(jobId: string, userId: string, progress: Progress): Promise<void>;
}

export interface CreateRenderJobRequest {
  userId: string;
  htmlContent: string;
  config: RenderJobConfig;
  templateId?: string;
  subject?: string;
  preheader?: string;
  priority?: number;
}

export interface RenderJobSummary {
  id: string;
  status: string;
  progress: Progress;
  overallScore: number;
  clientCount: number;
  screenshotCount: number;
  createdAt: Date;
  estimatedCompletion?: Date;
}

export interface AdvancedTestResults {
  accessibility: AccessibilityResult;
  performance: PerformanceResult;
  spamAnalysis: SpamAnalysisResult;
}

export interface RenderTestResult {
  jobId: string;
  status: RenderStatus;
  screenshots: Screenshot[];
  compatibilityScore: number;
  clientResults: Array<{
    client: EmailClient;
    screenshot: Screenshot;
    renderTime: number;
    issues: string[];
    score: number;
  }>;
  advancedResults?: AdvancedTestResults;
  metadata: {
    totalTime: number;
    timestamp: Date;
    version: string;
  };
}

export class RenderOrchestrationService {
  constructor(
    private renderJobRepository: RenderJobRepository,
    private testResultRepository: TestResultRepository,
    private emailClientRepository: EmailClientRepository,
    private screenshotRepository: ScreenshotRepository,
    private renderEngineService: RenderEngineService,
    private queueService: QueueService,
    private notificationService: NotificationService,
    // private _storageService: StorageService, // Currently unused
    private metricsService: MetricsService,
    private screenshotCaptureService: ScreenshotCaptureService,
    private accessibilityService: AccessibilityTestingService,
    private performanceService: PerformanceAnalysisService,
    private spamService: SpamAnalysisService
  ) {}

  /**
   * Create and submit a new render testing job with Phase 7.2 infrastructure
   */
  async createRenderJob(request: CreateRenderJobRequest): Promise<RenderJob> {
    const startTime = Date.now();
    
    try {
      // Validate HTML content
      if (!request.htmlContent || request.htmlContent.trim().length === 0) {
        throw new Error('HTML content is required');
      }

      // Validate client configuration
      if (!request.config.clients || request.config.clients.length === 0) {
        throw new Error('At least one email client must be specified');
      }

      // Verify clients exist and are active
      const clients = await this.emailClientRepository.findByIds(request.config.clients);
      const activeClients = clients.filter(client => client.isActive);
      
      if (activeClients.length === 0) {
        throw new Error('No active email clients found for the specified configuration');
      }

      // Create render job
      const renderJob = RenderJob.create({
        userId: request.userId,
        htmlContent: request.htmlContent,
        config: request.config,
        ...(request.templateId !== undefined && { templateId: request.templateId }),
        ...(request.subject !== undefined && { subject: request.subject }),
        ...(request.preheader !== undefined && { preheader: request.preheader }),
        ...(request.priority !== undefined && { priority: request.priority as JobPriorityType })
      });

      // Estimate duration based on client configurations
      const estimatedDuration = this.calculateEstimatedDuration(activeClients, request.config);
      renderJob.setEstimatedDuration(estimatedDuration);

      // Save job
      await this.renderJobRepository.save(renderJob);

      // Create test result placeholder
      const testResult = TestResult.create({
        jobId: renderJob.id,
        userId: renderJob.userId,
        totalClients: activeClients.length
      });
      await this.testResultRepository.save(testResult);

      // Create queue job data
      const queueJobData: QueueJobData = {
        jobId: renderJob.id,
        templateHtml: request.htmlContent,
        clientIds: activeClients.map(c => c.id),
        priority: this.mapJobPriorityToQueuePriority(renderJob.priority),
        options: {
          viewports: (request.config.viewports || [
            { width: 600, height: 800, name: 'desktop' },
            { width: 375, height: 667, name: 'mobile' },
          ]).map(v => ({ width: v.width || 600, height: v.height || 800, name: v.name || 'default' })),
          darkMode: request.config.darkModeEnabled || false,
          mobileSimulation: request.config.darkModeEnabled || false,
          accessibility: request.config.accessibilityTesting || false,
          performance: request.config.performanceAnalysis || false,
        },
        metadata: {
          userId: request.userId,
          ...(request.templateId && { templateId: request.templateId }),
          createdAt: new Date(),
        },
      };

      // Queue job for processing
      renderJob.queue();
      await this.renderJobRepository.update(renderJob);
      await this.queueService.addRenderJob(queueJobData);

      // Record metrics
      this.metricsService.recordRenderTestStart(renderJob.id, activeClients.length);

      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('render.job.creation', duration);

      return renderJob;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('render.job.creation', duration, { success: 'false' });
      throw error;
    }
  }

  /**
   * Process render job with advanced testing capabilities
   */
  async processRenderJob(jobData: any): Promise<RenderTestResult> {
    const startTime = Date.now();
    const jobId = jobData.jobId;

    try {
      this.metricsService.recordRenderTestStart(jobId, 1);

      // Basic render testing
      const basicResults = await this.performBasicRenderTesting(jobData);

      // Advanced testing if requested
      let advancedResults: AdvancedTestResults | undefined;
      if (jobData.options?.includeAdvancedTesting) {
        advancedResults = await this.performAdvancedTesting(jobData);
      }

      // Calculate final compatibility score
      const compatibilityScore = this.calculateFinalCompatibilityScore(
        basicResults.compatibilityScore,
        advancedResults
      );

      const totalTime = Date.now() - startTime;
      this.metricsService.recordJobCompletion(jobId, 'normal', totalTime);

      return {
        jobId,
        status: RenderStatus.completed(),
        screenshots: basicResults.screenshots,
        compatibilityScore,
        clientResults: basicResults.clientResults,
        ...(advancedResults !== undefined && { advancedResults }),
        metadata: {
          totalTime,
          timestamp: new Date(),
          version: '1.0.0',
        },
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      this.metricsService.recordJobCompletion(jobId, 'normal', totalTime);

      throw new Error(`Render job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform advanced testing capabilities
   */
  private async performAdvancedTesting(jobData: any): Promise<AdvancedTestResults> {
    const { htmlContent, subject, fromEmail } = jobData;

    // Create a browser page for testing
    const browser = await (this.screenshotCaptureService as any).createBrowser();
    const page = await browser.newPage();

    try {
      // Accessibility testing
      const accessibility = await this.accessibilityService.testEmailAccessibility(
        page,
        htmlContent,
        { wcagLevel: 'AA' }
      );

      // Performance analysis
      const performance = await this.performanceService.analyzeEmailPerformance(
        page,
        htmlContent,
        {
          maxFileSize: 100, // 100KB
          maxLoadTime: 3000, // 3 seconds
          mobileSimulation: true,
        }
      );

      // Spam analysis
      const spamAnalysis = await this.spamService.analyzeEmailSpam(
        htmlContent,
        subject || 'Test Email',
        fromEmail || 'test@example.com',
        {
          analyzeContent: true,
          checkStructure: true,
          includeAuthentication: true,
        }
      );

      return {
        accessibility,
        performance,
        spamAnalysis,
      };

    } finally {
      await browser.close();
    }
  }

  /**
   * Calculate final compatibility score including advanced testing
   */
  private calculateFinalCompatibilityScore(
    basicScore: number,
    advancedResults?: AdvancedTestResults
  ): number {
    if (!advancedResults) {
      return basicScore;
    }

    // Weight the different aspects
    const weights = {
      basic: 0.4,
      accessibility: 0.2,
      performance: 0.2,
      spam: 0.2,
    };

    const weightedScore = 
      basicScore * weights.basic +
      advancedResults.accessibility.score * weights.accessibility +
      advancedResults.performance.score * weights.performance +
      advancedResults.spamAnalysis.deliverabilityScore * weights.spam;

    return Math.round(weightedScore);
  }

  /**
   * Get render job by ID
   */
  async getRenderJob(jobId: string): Promise<RenderJob | null> {
    return await this.renderJobRepository.findById(jobId);
  }

  /**
   * Get render job with results
   */
  async getRenderJobWithResults(jobId: string): Promise<{
    job: RenderJob;
    result: TestResult | null;
    screenshots: Screenshot[];
  } | null> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) return null;

    const [result, screenshots] = await Promise.all([
      this.testResultRepository.findByJobId(jobId),
      this.screenshotRepository.findByJobId(jobId)
    ]);

    return { job, result, screenshots };
  }

  /**
   * Get user's render jobs
   */
  async getUserRenderJobs(userId: string): Promise<RenderJobSummary[]> {
    const jobs = await this.renderJobRepository.findByUserId(userId);
    
    const summaries = await Promise.all(
      jobs.map(async (job) => {
        const [result, screenshots] = await Promise.all([
          this.testResultRepository.findByJobId(job.id),
          this.screenshotRepository.findByJobId(job.id)
        ]);

        const progress = job.isActive() ? 
          await this.renderEngineService.getJobProgress(job.id) :
          Progress.completed();

        const estimatedCompletion = this.calculateEstimatedCompletion(job, progress);
        return {
          id: job.id,
          status: job.status as string,
          progress,
          overallScore: result?.overallScore || 0,
          clientCount: job.config.clients.length,
          screenshotCount: screenshots.length,
          createdAt: job.createdAt,
          ...(estimatedCompletion && { estimatedCompletion })
        };
      })
    );

    return summaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel render job
   */
  async cancelRenderJob(jobId: string, userId: string): Promise<void> {
    const job = await this.renderJobRepository.findById(jobId);
    
    if (!job) {
      throw new Error('Render job not found');
    }

    if (job.userId !== userId) {
      throw new Error('Unauthorized to cancel this job');
    }

    if (typeof job.status === 'string' && (job.status === 'completed' || job.status === 'failed')) {
      throw new Error('Cannot cancel completed job');
    }

    // Cancel in queue
    await this.queueService.cancelJob(jobId);

    // Update job status
    job.cancel();
    await this.renderJobRepository.update(job);

    // Record metrics
    this.metricsService.recordRenderTestCompletion(jobId, 0, false, []);

    // Notify user
    await this.notificationService.notifyJobFailed(jobId, userId, 'Job cancelled by user');
  }

  /**
   * Retry failed render job
   */
  async retryRenderJob(jobId: string, userId: string): Promise<RenderJob> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    if (job.userId !== userId) {
      throw new Error('Unauthorized to retry this job');
    }

    if (job.status !== 'failed') {
      throw new Error('Can only retry failed jobs');
    }

    // Create new job with same configuration
    const retryRequest: CreateRenderJobRequest = {
      userId: job.userId,
      htmlContent: job.htmlContent,
      config: job.config,
      ...(job.templateId && { templateId: job.templateId }),
      ...(job.subject && { subject: job.subject }),
      ...(job.preheader && { preheader: job.preheader }),
      ...(job.priority !== undefined && { priority: job.priority })
    };

    return await this.createRenderJob(retryRequest);
  }

  /**
   * Get queue status for a job
   */
  async getQueueStatus(jobId: string): Promise<{
    position: number;
    queueLength: number;
    estimatedWaitTime: number; // seconds
  }> {
    const [position, queueLength] = await Promise.all([
      (this.queueService as any).getJobPosition ? (this.queueService as any).getJobPosition(jobId) : 0,
      (this.queueService as any).getActiveJobCount ? (this.queueService as any).getActiveJobCount() : 0
    ]);

    // Estimate wait time based on position and average processing time
    const averageProcessingTime = 30; // seconds per job
    const estimatedWaitTime = position * averageProcessingTime;

    return {
      position: position || 0,
      queueLength: queueLength || 0,
      estimatedWaitTime
    };
  }

  /**
   * Get active email clients
   */
  async getActiveEmailClients(): Promise<EmailClient[]> {
    return await this.emailClientRepository.findActive();
  }

  /**
   * Get render job progress
   */
  async getRenderJobProgress(jobId: string): Promise<Progress> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    if (job.isTerminal()) {
      return Progress.completed();
    }

    if (!job.isActive()) {
      return Progress.empty();
    }

    return await this.renderEngineService.getJobProgress(jobId);
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics(): Promise<{
    totalJobs: number;
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
    systemLoad: number;
  }> {
    const [allJobs, activeJobs] = await Promise.all([
      this.renderJobRepository.findByUserId(''), // Get all jobs
      this.renderJobRepository.findByStatus('active')
    ]);

    const queueLength = (this.queueService as any).getActiveJobCount ? 
      await (this.queueService as any).getActiveJobCount() : 0;

    return {
      totalJobs: allJobs.length,
      activeJobs: activeJobs.length,
      queuedJobs: queueLength,
      completedJobs: allJobs.filter(j => (j.status as any).isCompleted()).length,
      failedJobs: allJobs.filter(j => (j.status as any).isFailed()).length,
      averageProcessingTime: 30, // Mock value
      systemLoad: 0.5 // Mock value
    };
  }

  /**
   * Handle job completion notification from render engine
   */
  async handleJobCompleted(jobId: string): Promise<void> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    job.complete();
    await this.renderJobRepository.update(job);

    // Notify user
    await this.notificationService.notifyJobCompleted(jobId, job.userId);
  }

  /**
   * Handle job failure notification from render engine
   */
  async handleJobFailed(jobId: string, errorMessage: string): Promise<void> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    job.fail(errorMessage);
    await this.renderJobRepository.update(job);

    // Notify user
    await this.notificationService.notifyJobFailed(jobId, job.userId, errorMessage);
  }

  /**
   * Handle job progress update from render engine
   */
  async handleJobProgress(jobId: string, progress: Progress): Promise<void> {
    const job = await this.renderJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Render job not found');
    }

    job.updateProgress(progress.percentage);
    await this.renderJobRepository.update(job);

    // Notify user of significant progress updates
    if (progress.percentage % 25 === 0) {
      await this.notificationService.notifyJobProgress(jobId, job.userId, progress);
    }
  }

  /**
   * Calculate estimated duration for job
   */
  private calculateEstimatedDuration(clients: EmailClient[], _config: RenderJobConfig): number {
    let totalDuration = 0;

    for (const client of clients) {
      const clientDuration = client.getEstimatedTestDuration();
      totalDuration += clientDuration;
    }

    // Add overhead for job setup and result processing
    const overhead = 30; // 30 seconds
    return Math.round(totalDuration / 1000) + overhead; // Convert to seconds
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(job: RenderJob, progress: Progress): Date | undefined {
    if (job.isTerminal() || !job.estimatedDuration) {
      return undefined;
    }

    const remainingTime = progress.estimatedTimeRemaining || 
      (job.estimatedDuration * (1 - progress.percentage / 100));

    return new Date(Date.now() + remainingTime * 1000);
  }

  /**
   * Validate render job configuration
   */
  /*
  private async _validateRenderJobConfig(config: RenderJobConfig): Promise<void> {
    // Validate clients exist
    const clients = await this.emailClientRepository.findByIds(config.clients);
    if (clients.length !== config.clients.length) {
      throw new Error('Some specified email clients do not exist');
    }

    // Validate viewport configurations
    for (const viewport of config.viewports) {
      if (viewport.width < 320 || viewport.width > 1920) {
        throw new Error('Viewport width must be between 320 and 1920 pixels');
      }
      if (viewport.height < 568 || viewport.height > 1080) {
        throw new Error('Viewport height must be between 568 and 1080 pixels');
      }
    }

    // Validate screenshot settings
    if (config.screenshotQuality < 60 || config.screenshotQuality > 100) {
      throw new Error('Screenshot quality must be between 60 and 100');
    }
  }
  */

  private mapJobPriorityToQueuePriority(priority: JobPriorityType): 'low' | 'normal' | 'high' | 'urgent' {
    // Handle both string and enum types
    const priorityValue = typeof priority === 'string' ? priority : priority.toString();
    
    switch (priorityValue) {
      case 'low':
        return 'low';
      case 'normal':
        return 'normal';
      case 'high':
        return 'high';
      case 'urgent':
        return 'urgent';
      default:
        return 'normal';
    }
  }

  /*
  private _calculateCompatibilityScore(result: any): number {
    if (!result.success) {
      return 0;
    }

    let score = 100;
    
    // Deduct points for missing screenshots
    const expectedScreenshots = result.screenshots.length;
    const actualScreenshots = result.screenshots.filter((s: any) => s.lightMode || s.darkMode).length;
    
    if (actualScreenshots < expectedScreenshots) {
      score -= (expectedScreenshots - actualScreenshots) * 20;
    }

    // Additional scoring logic based on client-specific criteria
    // This would be expanded based on actual compatibility requirements
    
    return Math.max(0, Math.min(100, score));
  }
  */

  /**
   * Get queue status for a job using new queue service
   */
  async getJobQueueStatus(jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'stalled';
    progress?: number;
    position?: number;
    error?: string;
  }> {
    try {
      return await this.queueService.getJobStatus(jobId);
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel job using new queue service
   */
  async cancelJobInQueue(jobId: string): Promise<boolean> {
    return await this.queueService.cancelJob(jobId);
  }

  /**
   * Retry job using new queue service
   */
  async retryJobInQueue(jobId: string): Promise<boolean> {
    return await this.queueService.retryJob(jobId);
  }

  /**
   * Get comprehensive queue statistics
   */
  async getQueueStatistics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    stalled: number;
    workers: number;
  }> {
    return await this.queueService.getQueueStats();
  }

  /**
   * Perform basic render testing
   */
  private async performBasicRenderTesting(_jobData: any): Promise<{
    screenshots: Screenshot[];
    compatibilityScore: number;
    clientResults: Array<{
      client: EmailClient;
      screenshot: Screenshot;
      renderTime: number;
      issues: string[];
      score: number;
    }>;
  }> {
    // Mock implementation - in real implementation would capture screenshots
    return {
      screenshots: [],
      compatibilityScore: 85,
      clientResults: []
    };
  }
} 