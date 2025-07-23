import { NextRequest, NextResponse } from 'next/server';
import { AccessibilityTestingService } from '../../../../domains/render-testing/services/accessibility-testing-service';
import { PerformanceAnalysisService } from '../../../../domains/render-testing/services/performance-analysis-service';
import { SpamAnalysisService } from '../../../../domains/render-testing/services/spam-analysis-service';
// import { ScreenshotCaptureService } from '../../../../domains/render-testing/services/screenshot-capture-service';
// import { StorageService } from '../../../../shared/infrastructure/storage/storage-service';
import { MetricsService } from '../../../../shared/infrastructure/monitoring/metrics-service';

/**
 * POST /api/render-testing/advanced
 * Run comprehensive advanced testing on email template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent, subject, fromEmail, options = {} } = body;

    // Validation
    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const metricsService = new MetricsService();
    // const storageConfig = {
    //   provider: 'local' as const,
    //   basePath: '/tmp/storage',
    //   maxFileSize: 10 * 1024 * 1024,
    //   allowedTypes: ['image/png', 'image/jpeg', 'text/html']
    // };
    // const storageService = new StorageService({
    //   provider: 's3',
    //   s3: {
    //     region: process.env.AWS_REGION || 'us-east-1',
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    //     bucket: process.env.S3_BUCKET || 'email-makers-storage'
    //   }
    // }, metricsService);
    
    // Mock dependencies for screenshot service
    // const mockBrowserDriver = {
    //   navigate: async () => {},
    //   setViewport: async () => {},
    //   setDarkMode: async () => {},
    //   waitForLoad: async () => {},
    //   takeScreenshot: async () => Buffer.alloc(0),
    //   cleanup: async () => {}
    // };
    // const mockStorageProvider = {
    //   upload: async () => ({ url: '', key: '', size: 0 }),
    //   generateThumbnail: async () => Buffer.alloc(0),
    //   delete: async () => {},
    //   getSignedUrl: async () => ''
    // };
    // const mockContainerManager = {
    //   createContainer: async () => '',
    //   startContainer: async () => {},
    //   stopContainer: async () => {},
    //   removeContainer: async () => {},
    //   executeCommand: async () => ''
    // };
    // const mockVMManager = {
    //   createVM: async () => '',
    //   startVM: async () => {},
    //   stopVM: async () => {},
    //   removeVM: async () => {},
    //   executeCommand: async () => ''
    // };
    
    // const screenshotService = new ScreenshotCaptureService(
    //   storageService, 
    //   metricsService,
    //   mockBrowserDriver,
    //   mockStorageProvider,
    //   mockContainerManager,
    //   mockVMManager
    // );
    const accessibilityService = new AccessibilityTestingService(metricsService);
    const performanceService = new PerformanceAnalysisService(metricsService);
    const spamService = new SpamAnalysisService(metricsService);

    // Create browser for testing using playwright directly
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Run all advanced tests
      const [accessibility, performance, spamAnalysis] = await Promise.all([
        accessibilityService.testEmailAccessibility(page, htmlContent, {
          wcagLevel: options.wcagLevel || 'AA',
        }),
        performanceService.analyzeEmailPerformance(page, htmlContent, {
          maxFileSize: options.maxFileSize || 100,
          maxLoadTime: options.maxLoadTime || 3000,
          mobileSimulation: options.mobileSimulation || true,
        }),
        spamService.analyzeEmailSpam(
          htmlContent,
          subject || 'Test Email',
          fromEmail || 'test@example.com',
          {
            analyzeContent: true,
            checkStructure: true,
            includeAuthentication: true,
          }
        ),
      ]);

      // Calculate overall score
      const overallScore = Math.round(
        (accessibility.score * 0.33 + 
         performance.score * 0.33 + 
         spamAnalysis.deliverabilityScore * 0.34)
      );

      // Generate comprehensive recommendations
      const recommendations = [
        ...accessibility.recommendations,
        ...performance.optimizations,
        ...spamAnalysis.recommendations,
      ];

      const results = {
        overallScore,
        accessibility,
        performance,
        spamAnalysis,
        recommendations: [...new Set(recommendations)], // Remove duplicates
        summary: {
          accessibilityGrade: getGrade(accessibility.score),
          performanceGrade: getGrade(performance.score),
          deliverabilityGrade: getGrade(spamAnalysis.deliverabilityScore),
          overallGrade: getGrade(overallScore),
        },
      };

      return NextResponse.json({
        success: true,
        _data: results,
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Advanced testing failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Advanced testing failed',
        details: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/render-testing/advanced/capabilities
 * Get information about available advanced testing capabilities
 */
export async function GET() {
  try {
    const capabilities = {
      accessibility: {
        name: 'WCAG Accessibility Testing',
        description: 'Comprehensive accessibility testing following WCAG 2.1 AA standards',
        features: [
          'Color contrast analysis',
          'Alt text validation',
          'Keyboard navigation testing',
          'Screen reader compatibility',
          'Heading structure validation',
          'ARIA attributes checking',
        ],
        wcagLevels: ['AA', 'AAA'],
      },
      performance: {
        name: 'Email Performance Analysis',
        description: 'Detailed performance metrics and optimization recommendations',
        features: [
          'Load time measurement',
          'File size analysis',
          'Image optimization suggestions',
          'HTML/CSS optimization',
          'Mobile performance testing',
          'Email client compatibility',
        ],
        metrics: [
          'Total load time',
          'First contentful paint',
          'Largest contentful paint',
          'File size breakdown',
          'Resource count analysis',
        ],
      },
      spamAnalysis: {
        name: 'Spam & Deliverability Analysis',
        description: 'Comprehensive spam detection and deliverability optimization',
        features: [
          'Spam score calculation',
          'Content analysis',
          'Authentication checking',
          'Deliverability scoring',
          'Client-specific analysis',
          'Optimization recommendations',
        ],
        clients: ['Gmail', 'Outlook', 'Yahoo Mail', 'Apple Mail'],
        categories: ['Content', 'Structure', 'Authentication', 'Reputation'],
      },
    };

    return NextResponse.json({
      success: true,
      _data: capabilities,
    });

  } catch (error) {
    console.error('Failed to get capabilities:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get capabilities',
        details: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to convert score to grade
function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}