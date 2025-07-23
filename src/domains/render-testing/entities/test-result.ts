import { z } from 'zod';

/**
 * TestResult Entity - Aggregates all test results for a render job
 * 
 * This entity contains the complete results of email render testing
 * including screenshots, compatibility analysis, accessibility reports,
 * performance metrics, and spam analysis.
 */

// Test result status for individual client tests
export const TestStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
  ERROR: 'error',
  SKIPPED: 'skipped'
} as const;

export type TestStatusType = typeof TestStatus[keyof typeof TestStatus];

// Compatibility score levels
export const CompatibilityLevel = {
  EXCELLENT: 'excellent',  // 90-100%
  GOOD: 'good',           // 75-89%
  FAIR: 'fair',           // 60-74%
  POOR: 'poor'            // <60%
} as const;

export type CompatibilityLevelType = typeof CompatibilityLevel[keyof typeof CompatibilityLevel];

// Individual client test result schema
export const ClientTestResultSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
    devicePixelRatio: z.number(),
    name: z.string()
  }),
  status: z.enum([
    TestStatus.PENDING,
    TestStatus.RUNNING,
    TestStatus.PASSED,
    TestStatus.FAILED,
    TestStatus.ERROR,
    TestStatus.SKIPPED
  ]),
  screenshots: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional().nullable(),
    darkMode: z.boolean(),
    timestamp: z.date(),
    fileSize: z.number().positive(),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    })
  })),
  compatibilityScore: z.number().min(0).max(100),
  compatibilityLevel: z.enum([
    CompatibilityLevel.EXCELLENT,
    CompatibilityLevel.GOOD,
    CompatibilityLevel.FAIR,
    CompatibilityLevel.POOR
  ]),
  compatibilityIssues: z.array(z.object({
    severity: z.enum(['critical', 'major', 'minor', 'info']),
    category: z.enum(['css', 'html', 'images', 'fonts', 'layout', 'interactive']),
    description: z.string(),
      recommendation: z.string().optional().nullable(),
  affectedElements: z.array(z.string()).optional().nullable()
  })),
  renderTime: z.number().positive(), // milliseconds
  errorMessage: z.string().optional().nullable(),
  startedAt: z.date(),
  completedAt: z.date().optional().nullable()
});

export type ClientTestResult = z.infer<typeof ClientTestResultSchema>;

// Accessibility test result schema
export const AccessibilityResultSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(['AA', 'AAA']),
  violations: z.array(z.object({
    id: z.string(),
    impact: z.enum(['critical', 'serious', 'moderate', 'minor']),
    description: z.string(),
    help: z.string(),
    helpUrl: z.string().url().optional().nullable(),
    nodes: z.array(z.object({
      target: z.string(),
      html: z.string(),
      failureSummary: z.string()
    }))
  })),
  passes: z.array(z.object({
    id: z.string(),
    description: z.string(),
    help: z.string()
  })),
  incomplete: z.array(z.object({
    id: z.string(),
    description: z.string(),
    help: z.string(),
    reason: z.string()
  })),
  testEngine: z.object({
    name: z.string(),
    version: z.string()
  }),
  timestamp: z.date()
});

export type AccessibilityResult = z.infer<typeof AccessibilityResultSchema>;

// Performance analysis result schema
export const PerformanceResultSchema = z.object({
  totalSize: z.number().positive(), // bytes
  htmlSize: z.number().positive(),
  cssSize: z.number().positive(),
  imageSize: z.number().positive(),
  loadTime: z.number().positive(), // milliseconds
  renderTime: z.number().positive(), // milliseconds
  compressionRatio: z.number().min(0).max(1),
  optimizationScore: z.number().min(0).max(100),
  recommendations: z.array(z.object({
    type: z.enum(['size', 'compression', 'images', 'css', 'html']),
    priority: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    potentialSavings: z.number().positive().optional().nullable(), // bytes
    implementation: z.string()
  })),
  metrics: z.object({
      firstContentfulPaint: z.number().positive().optional().nullable(),
  largestContentfulPaint: z.number().positive().optional().nullable(),
  cumulativeLayoutShift: z.number().min(0).optional().nullable(),
  totalBlockingTime: z.number().positive().optional().nullable()
  }),
  timestamp: z.date()
});

export type PerformanceResult = z.infer<typeof PerformanceResultSchema>;

// Spam analysis result schema
export const SpamResultSchema = z.object({
  score: z.number(), // SpamAssassin score (lower is better)
  status: z.enum(['ham', 'spam', 'uncertain']),
  threshold: z.number(),
  rules: z.array(z.object({
    name: z.string(),
    score: z.number(),
    description: z.string(),
    category: z.enum(['content', 'headers', 'uri', 'body', 'meta'])
  })),
  deliverabilityScore: z.number().min(0).max(100),
  authenticationChecks: z.object({
      spf: z.enum(['pass', 'fail', 'neutral', 'none']).optional().nullable(),
  dkim: z.enum(['pass', 'fail', 'none']).optional().nullable(),
  dmarc: z.enum(['pass', 'fail', 'none']).optional().nullable()
  }),
  recommendations: z.array(z.object({
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.enum(['content', 'headers', 'authentication', 'reputation']),
    description: z.string(),
    solution: z.string()
  })),
  timestamp: z.date()
});

export type SpamResult = z.infer<typeof SpamResultSchema>;

// Main TestResult entity schema
export const TestResultSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  userId: z.string().uuid(),
  overallStatus: z.enum([
    TestStatus.PENDING,
    TestStatus.RUNNING,
    TestStatus.PASSED,
    TestStatus.FAILED,
    TestStatus.ERROR
  ]),
  overallScore: z.number().min(0).max(100),
  clientResults: z.array(ClientTestResultSchema),
  accessibilityResult: AccessibilityResultSchema.optional().nullable(),
  performanceResult: PerformanceResultSchema.optional().nullable(),
  spamResult: SpamResultSchema.optional().nullable(),
  summary: z.object({
    totalClients: z.number().positive(),
    passedClients: z.number().min(0),
    failedClients: z.number().min(0),
    averageCompatibilityScore: z.number().min(0).max(100),
    totalRenderTime: z.number().positive(), // milliseconds
    totalScreenshots: z.number().min(0),
    criticalIssues: z.number().min(0),
    majorIssues: z.number().min(0),
    minorIssues: z.number().min(0)
  }),
  metadata: z.object({
    testDuration: z.number().positive(), // seconds
    testEnvironment: z.string(),
    testVersion: z.string(),
    userAgent: z.string().optional().nullable()
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional().nullable()
});

export type TestResultData = z.infer<typeof TestResultSchema>;

/**
 * TestResult Domain Entity
 * 
 * Aggregates and manages all test results for an email render testing job.
 * Provides business logic for result analysis and scoring.
 */
export class TestResult {
  private constructor(private data: TestResultData) {
    this.validateInvariants();
  }

  /**
   * Factory method to create a new TestResult
   */
  static create(params: {
    jobId: string;
    userId: string;
    totalClients: number;
  }): TestResult {
    const now = new Date();
    const id = crypto.randomUUID();

    const resultData: TestResultData = {
      id,
      jobId: params.jobId,
      userId: params.userId,
      overallStatus: TestStatus.PENDING,
      overallScore: 0,
      clientResults: [],
      summary: {
        totalClients: params.totalClients,
        passedClients: 0,
        failedClients: 0,
        averageCompatibilityScore: 0,
        totalRenderTime: 0,
        totalScreenshots: 0,
        criticalIssues: 0,
        majorIssues: 0,
        minorIssues: 0
      },
      metadata: {
        testDuration: 0,
        testEnvironment: process.env.NODE_ENV || 'development',
        testVersion: '1.0.0'
      },
      createdAt: now,
      updatedAt: now
    };

    return new TestResult(resultData);
  }

  /**
   * Factory method to reconstruct TestResult from persistence
   */
  static fromData(data: TestResultData): TestResult {
    return new TestResult(data);
  }

  /**
   * Domain invariants validation
   */
  private validateInvariants(): void {
    if (this.data.overallStatus === TestStatus.PASSED && this.data.summary.failedClients > 0) {
      throw new Error('Cannot have passed overall status with failed clients');
    }

    if (this.data.summary.passedClients + this.data.summary.failedClients > this.data.summary.totalClients) {
      throw new Error('Passed + failed clients cannot exceed total clients');
    }

    if (this.data.overallScore < 0 || this.data.overallScore > 100) {
      throw new Error('Overall score must be between 0 and 100');
    }
  }

  // Getters
  get id(): string { return this.data.id; }
  get jobId(): string { return this.data.jobId; }
  get userId(): string { return this.data.userId; }
  get overallStatus(): TestStatusType { return this.data.overallStatus; }
  get overallScore(): number { return this.data.overallScore; }
  get clientResults(): ClientTestResult[] { return this.data.clientResults; }
  get accessibilityResult(): AccessibilityResult | undefined { return this.data.accessibilityResult ?? undefined; }
  get performanceResult(): PerformanceResult | undefined { return this.data.performanceResult ?? undefined; }
  get spamResult(): SpamResult | undefined { return this.data.spamResult ?? undefined; }
  get summary(): TestResultData['summary'] { return this.data.summary; }
  get metadata(): TestResultData['metadata'] { return this.data.metadata; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }
  get completedAt(): Date | undefined { return this.data.completedAt ?? undefined; }

  /**
   * Business logic methods
   */

  /**
   * Start testing process
   */
  start(): void {
    if (this.data.overallStatus !== TestStatus.PENDING) {
      throw new Error(`Cannot start testing in ${this.data.overallStatus} status`);
    }

    this.data.overallStatus = TestStatus.RUNNING;
    this.data.updatedAt = new Date();
  }

  /**
   * Add client test result
   */
  addClientResult(result: ClientTestResult): void {
    if (this.data.overallStatus !== TestStatus.RUNNING) {
      throw new Error('Cannot add client results when not running');
    }

    // Check if result already exists for this client/viewport combination
    const existingIndex = this.data.clientResults.findIndex(
      r => r.clientId === result.clientId && 
           r.viewport.name === result.viewport.name
    );

    if (existingIndex >= 0) {
      this.data.clientResults[existingIndex] = result;
    } else {
      this.data.clientResults.push(result);
    }

    this.updateSummary();
    this.data.updatedAt = new Date();
  }

  /**
   * Set accessibility result
   */
  setAccessibilityResult(result: AccessibilityResult): void {
    this.data.accessibilityResult = result;
    this.updateOverallScore();
    this.data.updatedAt = new Date();
  }

  /**
   * Set performance result
   */
  setPerformanceResult(result: PerformanceResult): void {
    this.data.performanceResult = result;
    this.updateOverallScore();
    this.data.updatedAt = new Date();
  }

  /**
   * Set spam analysis result
   */
  setSpamResult(result: SpamResult): void {
    this.data.spamResult = result;
    this.updateOverallScore();
    this.data.updatedAt = new Date();
  }

  /**
   * Complete testing process
   */
  complete(): void {
    if (this.data.overallStatus !== TestStatus.RUNNING) {
      throw new Error(`Cannot complete testing in ${this.data.overallStatus} status`);
    }

    const now = new Date();
    this.data.completedAt = now;
    this.data.metadata.testDuration = Math.floor((now.getTime() - this.data.createdAt.getTime()) / 1000);
    
    // Determine overall status based on client results
    const hasErrors = this.data.clientResults.some(r => r.status === TestStatus.ERROR);
    const hasFailures = this.data.clientResults.some(r => r.status === TestStatus.FAILED);
    
    if (hasErrors) {
      this.data.overallStatus = TestStatus.ERROR;
    } else if (hasFailures) {
      this.data.overallStatus = TestStatus.FAILED;
    } else {
      this.data.overallStatus = TestStatus.PASSED;
    }

    this.updateSummary();
    this.updateOverallScore();
    this.data.updatedAt = now;
    this.validateInvariants();
  }

  /**
   * Fail testing with error
   */
  fail(_errorMessage: string): void {
    this.data.overallStatus = TestStatus.ERROR;
    this.data.completedAt = new Date();
    this.data.metadata.testDuration = Math.floor((this.data.completedAt.getTime() - this.data.createdAt.getTime()) / 1000);
    this.data.updatedAt = new Date();
  }

  /**
   * Update summary statistics
   */
  private updateSummary(): void {
    const completedResults = this.data.clientResults.filter(
      r => r.status === TestStatus.PASSED || r.status === TestStatus.FAILED
    );

    this.data.summary.passedClients = this.data.clientResults.filter(
      r => r.status === TestStatus.PASSED
    ).length;

    this.data.summary.failedClients = this.data.clientResults.filter(
      r => r.status === TestStatus.FAILED || r.status === TestStatus.ERROR
    ).length;

    if (completedResults.length > 0) {
      this.data.summary.averageCompatibilityScore = 
        completedResults.reduce((sum, r) => sum + r.compatibilityScore, 0) / completedResults.length;
    }

    this.data.summary.totalRenderTime = this.data.clientResults.reduce(
      (sum, r) => sum + (r.renderTime || 0), 0
    );

    this.data.summary.totalScreenshots = this.data.clientResults.reduce(
      (sum, r) => sum + r.screenshots.length, 0
    );

    // Count issues by severity
    const allIssues = this.data.clientResults.flatMap(r => r.compatibilityIssues);
    this.data.summary.criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    this.data.summary.majorIssues = allIssues.filter(i => i.severity === 'major').length;
    this.data.summary.minorIssues = allIssues.filter(i => i.severity === 'minor').length;
  }

  /**
   * Calculate overall score based on all test results
   */
  private updateOverallScore(): void {
    let totalScore = 0;
    let weightSum = 0;

    // Compatibility score (weight: 40%)
    if (this.data.summary.averageCompatibilityScore > 0) {
      totalScore += this.data.summary.averageCompatibilityScore * 0.4;
      weightSum += 0.4;
    }

    // Accessibility score (weight: 25%)
    if (this.data.accessibilityResult) {
      totalScore += this.data.accessibilityResult.score * 0.25;
      weightSum += 0.25;
    }

    // Performance score (weight: 20%)
    if (this.data.performanceResult) {
      totalScore += this.data.performanceResult.optimizationScore * 0.2;
      weightSum += 0.2;
    }

    // Spam/deliverability score (weight: 15%)
    if (this.data.spamResult) {
      totalScore += this.data.spamResult.deliverabilityScore * 0.15;
      weightSum += 0.15;
    }

    // Normalize score based on available components
    this.data.overallScore = weightSum > 0 ? Math.round(totalScore / weightSum) : 0;
  }

  /**
   * Get compatibility level based on overall score
   */
  getCompatibilityLevel(): CompatibilityLevelType {
    if (this.data.overallScore >= 90) return CompatibilityLevel.EXCELLENT;
    if (this.data.overallScore >= 75) return CompatibilityLevel.GOOD;
    if (this.data.overallScore >= 60) return CompatibilityLevel.FAIR;
    return CompatibilityLevel.POOR;
  }

  /**
   * Check if testing is complete
   */
  isComplete(): boolean {
    return [TestStatus.PASSED, TestStatus.FAILED, TestStatus.ERROR].includes(this.data.overallStatus as any);
  }

  /**
   * Get failed clients
   */
  getFailedClients(): ClientTestResult[] {
    return this.data.clientResults.filter(
      r => r.status === TestStatus.FAILED || r.status === TestStatus.ERROR
    );
  }

  /**
   * Get critical issues across all clients
   */
  getCriticalIssues(): Array<ClientTestResult['compatibilityIssues'][0] & { clientName: string }> {
    return this.data.clientResults.flatMap(result =>
      result.compatibilityIssues
        .filter(issue => issue.severity === 'critical')
        .map(issue => ({ ...issue, clientName: result.clientName }))
    );
  }

  /**
   * Export entity data for persistence
   */
  toData(): TestResultData {
    return { ...this.data };
  }

  /**
   * Create a copy with updated metadata
   */
  updateMetadata(metadata: Partial<TestResultData['metadata']>): TestResult {
    const updatedData = {
      ...this.data,
      metadata: { ...this.data.metadata, ...metadata },
      updatedAt: new Date()
    };

    return new TestResult(updatedData);
  }
} 