import { Page } from 'playwright';
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalSize: number;
  htmlSize: number;
  cssSize: number;
  imageSize: number;
  fontSize: number;
  resourceCount: {
    total: number;
    images: number;
    stylesheets: number;
    fonts: number;
    scripts: number;
  };
}

export interface PerformanceIssue {
  type: 'size' | 'speed' | 'optimization' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  impact: string;
  estimatedSavings?: {
    size?: number;
    time?: number;
  };
}

export interface PerformanceResult {
  score: number;
  metrics: PerformanceMetrics;
  issues: PerformanceIssue[];
  optimizations: string[];
  emailClientCompatibility: {
    gmail: { score: number; issues: string[] };
    outlook: { score: number; issues: string[] };
    appleMail: { score: number; issues: string[] };
    mobileClients: { score: number; issues: string[] };
  };
}

export interface PerformanceTestOptions {
  timeout?: number;
  includeImages?: boolean;
  simulateSlowNetwork?: boolean;
  mobileSimulation?: boolean;
  maxFileSize?: number; // in KB
  maxLoadTime?: number; // in ms
}

export class PerformanceAnalysisService {
  constructor(private metricsService: MetricsService) {}

  /**
   * Run comprehensive performance analysis on email template
   */
  async analyzeEmailPerformance(
    page: Page,
    htmlContent: string,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceResult> {
    const startTime = Date.now();

    try {
      // Configure performance monitoring
      await this.setupPerformanceMonitoring(page, options);

      // Load and measure performance
      const metrics = await this.measurePerformanceMetrics(page, htmlContent, options);

      // Analyze for issues and optimizations
      const issues = this.analyzePerformanceIssues(metrics, htmlContent, options);
      const optimizations = this.generateOptimizationRecommendations(issues, metrics);

      // Test email client compatibility
      const emailClientCompatibility = await this.testEmailClientCompatibility(htmlContent, metrics);

      // Calculate overall performance score
      const score = this.calculatePerformanceScore(metrics, issues, emailClientCompatibility);

      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('performance.analysis.duration', duration);

      return {
        score,
        metrics,
        issues,
        optimizations,
        emailClientCompatibility,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('performance.analysis.duration', duration, { success: 'false' });

      throw new Error(`Performance analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Setup performance monitoring for the page
   */
  private async setupPerformanceMonitoring(page: Page, options: PerformanceTestOptions): Promise<void> {
    // Simulate slow network if requested
    if (options.simulateSlowNetwork) {
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay
      });
    }

    // Mobile simulation
    if (options.mobileSimulation) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    // Track resource loading
    const resources: Array<{ url: string; type: string; size: number; time: number }> = [];
    
    page.on('response', async response => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      const size = parseInt(response.headers()['content-length'] || '0');
      
      resources.push({
        url,
        type: this.getResourceType(contentType, url),
        size,
        time: Date.now(),
      });
    });

    // Store resources for later analysis
    (page as any)._performanceResources = resources;
  }

  /**
   * Measure comprehensive performance metrics
   */
  private async measurePerformanceMetrics(
    page: Page,
    htmlContent: string,
    options: PerformanceTestOptions
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    // Set content and wait for load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle',
      timeout: options.timeout || 30000 
    });

    const loadTime = Date.now() - startTime;

    // Get performance timing
    const performanceTiming = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: (perf?.domContentLoadedEventEnd || 0) - (perf?.domContentLoadedEventStart || 0),
        loadComplete: (perf?.loadEventEnd || 0) - (perf?.loadEventStart || 0),
        renderTime: (perf?.domInteractive || 0) - (perf?.fetchStart || 0),
      };
    });

    // Get paint timing
    const paintTiming = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const lcp = paintEntries.find(entry => entry.name === 'largest-contentful-paint');
      
      return {
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
      };
    });

    // Analyze resource sizes
    const resources = (page as any)._performanceResources || [];
    const resourceAnalysis = this.analyzeResourceSizes(resources, htmlContent);

    return {
      loadTime,
      renderTime: performanceTiming.renderTime,
      domContentLoaded: performanceTiming.domContentLoaded,
      firstContentfulPaint: paintTiming.firstContentfulPaint,
      largestContentfulPaint: paintTiming.largestContentfulPaint,
      totalSize: resourceAnalysis.totalSize,
      htmlSize: resourceAnalysis.htmlSize,
      cssSize: resourceAnalysis.cssSize,
      imageSize: resourceAnalysis.imageSize,
      fontSize: resourceAnalysis.fontSize,
      resourceCount: resourceAnalysis.resourceCount,
    };
  }

  /**
   * Analyze resource sizes and types
   */
  private analyzeResourceSizes(resources: any[], htmlContent: string): {
    totalSize: number;
    htmlSize: number;
    cssSize: number;
    imageSize: number;
    fontSize: number;
    resourceCount: {
      total: number;
      images: number;
      stylesheets: number;
      fonts: number;
      scripts: number;
    };
  } {
    const htmlSize = new Blob([htmlContent]).size;
    
    let cssSize = 0;
    let imageSize = 0;
    let fontSize = 0;
    let scriptSize = 0;

    const resourceCount = {
      total: resources.length,
      images: 0,
      stylesheets: 0,
      fonts: 0,
      scripts: 0,
    };

    resources.forEach(resource => {
      switch (resource.type) {
        case 'stylesheet':
          cssSize += resource.size;
          resourceCount.stylesheets++;
          break;
        case 'image':
          imageSize += resource.size;
          resourceCount.images++;
          break;
        case 'font':
          fontSize += resource.size;
          resourceCount.fonts++;
          break;
        case 'script':
          scriptSize += resource.size;
          resourceCount.scripts++;
          break;
      }
    });

    return {
      totalSize: htmlSize + cssSize + imageSize + fontSize + scriptSize,
      htmlSize,
      cssSize,
      imageSize,
      fontSize,
      resourceCount,
    };
  }

  /**
   * Get resource type from content type and URL
   */
  private getResourceType(contentType: string, url: string): string {
    if (contentType.includes('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
      return 'image';
    }
    if (contentType.includes('text/css') || url.includes('.css')) {
      return 'stylesheet';
    }
    if (contentType.includes('font/') || /\.(woff|woff2|ttf|otf|eot)$/i.test(url)) {
      return 'font';
    }
    if (contentType.includes('javascript') || url.includes('.js')) {
      return 'script';
    }
    return 'other';
  }

  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(
    metrics: PerformanceMetrics,
    _htmlContent: string,
    options: PerformanceTestOptions
  ): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const maxFileSize = (options.maxFileSize || 100) * 1024; // Convert KB to bytes
    const maxLoadTime = options.maxLoadTime || 3000; // 3 seconds

    // File size issues
    if (metrics.totalSize > maxFileSize) {
      issues.push({
        type: 'size',
        severity: 'high',
        description: `Total email size (${Math.round(metrics.totalSize / 1024)}KB) exceeds recommended limit`,
        recommendation: `Reduce total size to under ${options.maxFileSize || 100}KB`,
        impact: 'May cause clipping in Gmail and slow loading',
        estimatedSavings: {
          size: metrics.totalSize - maxFileSize,
        },
      });
    }

    // HTML size issues
    if (metrics.htmlSize > 102400) { // 100KB
      issues.push({
        type: 'size',
        severity: 'critical',
        description: `HTML size (${Math.round(metrics.htmlSize / 1024)}KB) may cause Gmail clipping`,
        recommendation: 'Reduce HTML to under 100KB to prevent Gmail clipping',
        impact: 'Gmail will clip the email content',
        estimatedSavings: {
          size: metrics.htmlSize - 102400,
        },
      });
    }

    // Load time issues
    if (metrics.loadTime > maxLoadTime) {
      issues.push({
        type: 'speed',
        severity: 'medium',
        description: `Load time (${metrics.loadTime}ms) exceeds recommended limit`,
        recommendation: 'Optimize images and reduce external resources',
        impact: 'Poor user experience, especially on mobile',
        estimatedSavings: {
          time: metrics.loadTime - maxLoadTime,
        },
      });
    }

    // Image optimization issues
    if (metrics.imageSize > 50 * 1024) { // 50KB
      issues.push({
        type: 'optimization',
        severity: 'medium',
        description: `Image size (${Math.round(metrics.imageSize / 1024)}KB) could be optimized`,
        recommendation: 'Compress images and use appropriate formats (WebP, optimized JPEG)',
        impact: 'Slower loading and higher bandwidth usage',
        estimatedSavings: {
          size: Math.round(metrics.imageSize * 0.3), // Estimate 30% savings
        },
      });
    }

    return issues;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    issues: PerformanceIssue[],
    _metrics: PerformanceMetrics
  ): string[] {
    const optimizations: string[] = [];

    // Size optimizations
    if (issues.some(issue => issue.type === 'size')) {
      optimizations.push(
        'Compress and optimize all images before embedding',
        'Use inline CSS instead of external stylesheets',
        'Minify HTML and remove unnecessary whitespace'
      );
    }

    // Speed optimizations
    if (issues.some(issue => issue.type === 'speed')) {
      optimizations.push(
        'Optimize image loading with appropriate formats',
        'Reduce the number of external resources',
        'Use email-safe fonts to avoid font loading delays'
      );
    }

    // General email optimizations
    optimizations.push(
      'Keep email width between 600-640px for optimal display',
      'Use alt text for all images',
      'Test on multiple email clients and devices'
    );

    return optimizations;
  }

  /**
   * Test email client compatibility
   */
  private async testEmailClientCompatibility(
    htmlContent: string,
    metrics: PerformanceMetrics
  ): Promise<{
    gmail: { score: number; issues: string[] };
    outlook: { score: number; issues: string[] };
    appleMail: { score: number; issues: string[] };
    mobileClients: { score: number; issues: string[] };
  }> {
    const compatibility = {
      gmail: { score: 100, issues: [] as string[] },
      outlook: { score: 100, issues: [] as string[] },
      appleMail: { score: 100, issues: [] as string[] },
      mobileClients: { score: 100, issues: [] as string[] },
    };

    // Gmail compatibility checks
    if (metrics.htmlSize > 102400) {
      compatibility.gmail.score -= 50;
      compatibility.gmail.issues.push('HTML size exceeds Gmail clipping limit (100KB)');
    }

    // Outlook compatibility checks
    if (htmlContent.includes('flexbox') || htmlContent.includes('display: flex')) {
      compatibility.outlook.score -= 30;
      compatibility.outlook.issues.push('Flexbox not supported in Outlook');
    }

    // Mobile client compatibility checks
    if (!htmlContent.includes('@media')) {
      compatibility.mobileClients.score -= 40;
      compatibility.mobileClients.issues.push('No responsive design detected');
    }

    return compatibility;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(
    _metrics: PerformanceMetrics,
    issues: PerformanceIssue[],
    compatibility: any
  ): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Factor in compatibility scores
    const avgCompatibility = (
      compatibility.gmail.score +
      compatibility.outlook.score +
      compatibility.appleMail.score +
      compatibility.mobileClients.score
    ) / 4;

    score = (score + avgCompatibility) / 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
} 