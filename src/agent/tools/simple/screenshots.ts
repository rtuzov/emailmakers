/**
 * 📸 SCREENSHOTS - Simple Tool
 * 
 * Простое создание скриншотов email рендеринга
 * Заменяет часть функциональности delivery-manager
 */

import { z } from 'zod';
import { generateScreenshots } from '../screenshot-generator';

export const screenshotsSchema = z.object({
  html_content: z.string().describe('HTML email content to screenshot'),
  screenshot_config: z.object({
    clients: z.array(z.enum(['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird'])).default(['gmail', 'outlook']).describe('Email clients to capture'),
    devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).default(['desktop', 'mobile']).describe('Device types to capture'),
    capture_modes: z.array(z.enum(['light', 'dark', 'images_blocked', 'images_enabled'])).default(['light', 'images_enabled']).describe('Rendering modes')
  }).optional().nullable().describe('Screenshot capture configuration'),
  output_settings: z.object({
    format: z.enum(['png', 'jpg', 'webp']).default('png').describe('Image format'),
    quality: z.number().min(50).max(100).default(90).describe('Image quality percentage'),
    resolution: z.enum(['standard', 'high', 'retina']).default('standard').describe('Screenshot resolution'),
    include_annotations: z.boolean().default(false).describe('Add client/device annotations')
  }).optional().nullable().describe('Output format settings'),
  comparison_options: z.object({
    enable_comparison: z.boolean().default(true).describe('Generate comparison views'),
    highlight_differences: z.boolean().default(true).describe('Highlight rendering differences'),
    baseline_client: z.enum(['gmail', 'outlook', 'apple_mail']).default('gmail').describe('Reference client for comparison')
  }).optional().nullable().describe('Cross-client comparison options')
});

export type ScreenshotsParams = z.infer<typeof screenshotsSchema>;

export interface ScreenshotsResult {
  success: boolean;
  screenshots: Array<{
    client: string;
    device: string;
    mode: string;
    image_url: string;
    image_path: string;
    dimensions: {
      width: number;
      height: number;
    };
    capture_metadata: {
      timestamp: string;
      render_time: number;
      file_size_kb: number;
      issues_detected: string[];
    };
  }>;
  comparison_analysis: {
    consistency_score: number;
    major_differences: Array<{
      clients_affected: string[];
      difference_type: 'layout' | 'styling' | 'content' | 'rendering';
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
    }>;
    recommendations: string[];
  };
  delivery_package: {
    archive_url?: string;
    individual_files: string[];
    total_size_mb: number;
    summary_report: string;
  };
  error?: string;
}

export async function screenshots(params: ScreenshotsParams): Promise<ScreenshotsResult> {
  try {
    console.log('📸 Generating email screenshots:', {
      clients: params.screenshot_config?.clients || ['gmail', 'outlook'],
      devices: params.screenshot_config?.devices || ['desktop', 'mobile'],
      html_size: params.html_content.length
    });

    const config = params.screenshot_config || {};
    const clients = config.clients || ['gmail', 'outlook'];
    const devices = config.devices || ['desktop', 'mobile'];
    const modes = config.capture_modes || ['light', 'images_enabled'];

    const screenshots: any[] = [];
    const captureErrors: string[] = [];

    // Generate screenshots for each combination
    for (const client of clients) {
      for (const device of devices) {
        for (const mode of modes) {
          console.log(`📱 Capturing ${client}/${device}/${mode}...`);
          
          try {
            const screenshot = await captureSingleScreenshot(
              params.html_content,
              client,
              device,
              mode,
              params.output_settings
            );
            
            if (screenshot) {
              screenshots.push(screenshot);
            } else {
              captureErrors.push(`Failed to capture ${client}/${device}/${mode}`);
            }
          } catch (error) {
            console.warn(`Screenshot failed for ${client}/${device}/${mode}:`, error);
            captureErrors.push(`Error capturing ${client}/${device}/${mode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }

    if (screenshots.length === 0) {
      return {
        success: false,
        screenshots: [],
        comparison_analysis: {
          consistency_score: 0,
          major_differences: [],
          recommendations: ['Check screenshot configuration', 'Verify HTML content']
        },
        delivery_package: {
          individual_files: [],
          total_size_mb: 0,
          summary_report: 'No screenshots generated'
        },
        error: `All screenshot captures failed: ${captureErrors.join('; ')}`
      };
    }

    // Perform cross-client analysis
    const comparisonAnalysis = await performComparisonAnalysis(
      screenshots,
      params.comparison_options
    );

    // Create delivery package
    const deliveryPackage = await createDeliveryPackage(
      screenshots,
      comparisonAnalysis,
      params.output_settings
    );

    return {
      success: true,
      screenshots,
      comparison_analysis: comparisonAnalysis,
      delivery_package: deliveryPackage
    };

  } catch (error) {
    console.error('❌ Screenshots generation failed:', error);

    return {
      success: false,
      screenshots: [],
      comparison_analysis: {
        consistency_score: 0,
        major_differences: [],
        recommendations: ['Check error logs', 'Verify screenshot configuration']
      },
      delivery_package: {
        individual_files: [],
        total_size_mb: 0,
        summary_report: 'Screenshot generation failed'
      },
      error: error instanceof Error ? error.message : 'Unknown screenshots error'
    };
  }
}

async function captureSingleScreenshot(
  htmlContent: string,
  client: string,
  device: string,
  mode: string,
  outputSettings?: any
): Promise<any | null> {
  try {
    // Use existing screenshot generator tool
    const screenshotParams = {
      html_content: htmlContent,
      client_simulation: {
        client_type: client,
        device_type: device,
        dark_mode: mode === 'dark',
        images_enabled: mode === 'images_enabled'
      },
      capture_settings: {
        format: outputSettings?.format || 'png',
        quality: outputSettings?.quality || 90,
        full_page: true,
        wait_for_load: true
      },
      output_config: {
        include_metadata: true,
        add_annotations: outputSettings?.include_annotations || false
      }
    };

    const result = await generateScreenshots(screenshotParams);
    
    if (!result.success || !result.screenshots?.[0]) {
      return null;
    }

    const screenshot = result.screenshots[0];
    const issuesDetected = analyzeScreenshotIssues(screenshot, client, device);

    return {
      client,
      device,
      mode,
      image_url: screenshot.image_url,
      image_path: screenshot.local_path || screenshot.image_url,
      dimensions: {
        width: screenshot.dimensions?.width || 800,
        height: screenshot.dimensions?.height || 600
      },
      capture_metadata: {
        timestamp: new Date().toISOString(),
        render_time: screenshot.render_time || 0,
        file_size_kb: Math.round((screenshot.file_size || 100000) / 1024),
        issues_detected: issuesDetected
      }
    };

  } catch (error) {
    console.warn(`Failed to capture screenshot for ${client}/${device}/${mode}:`, error);
    return null;
  }
}

function analyzeScreenshotIssues(screenshot: any, client: string, device: string): string[] {
  const issues: string[] = [];

  // Analyze based on known client limitations
  if (client === 'outlook') {
    issues.push('Check for flexbox/grid layout issues');
    issues.push('Verify background image support');
  }

  if (client === 'gmail') {
    issues.push('Verify style tag handling');
    issues.push('Check for content clipping');
  }

  if (device === 'mobile') {
    issues.push('Verify touch-friendly button sizes');
    issues.push('Check responsive layout behavior');
  }

  // Check screenshot quality indicators
  if (screenshot.file_size && screenshot.file_size < 50000) {
    issues.push('Screenshot file size unusually small - possible rendering issue');
  }

  if (screenshot.render_time && screenshot.render_time > 10000) {
    issues.push('Long render time detected - performance concern');
  }

  return issues;
}

async function performComparisonAnalysis(
  screenshots: any[],
  comparisonOptions?: any
): Promise<any> {
  const options = comparisonOptions || {};
  const baselineClient = options.baseline_client || 'gmail';
  
  // Find baseline screenshots
  const baselineScreenshots = screenshots.filter(s => s.client === baselineClient);
  const otherScreenshots = screenshots.filter(s => s.client !== baselineClient);

  const differences: any[] = [];
  let totalConsistencyPoints = 0;
  let maxConsistencyPoints = 0;

  // Compare each non-baseline screenshot with baseline
  for (const baselineShot of baselineScreenshots) {
    const matchingShots = otherScreenshots.filter(s => 
      s.device === baselineShot.device && s.mode === baselineShot.mode
    );

    for (const shot of matchingShots) {
      maxConsistencyPoints += 100;
      
      // Simplified visual comparison (in real implementation would use image diff)
      const consistencyScore = compareScreenshots(baselineShot, shot);
      totalConsistencyPoints += consistencyScore;

      if (consistencyScore < 80) {
        differences.push({
          clients_affected: [baselineClient, shot.client],
          difference_type: 'rendering' as const,
          description: `${shot.client} rendering differs from ${baselineClient} on ${shot.device}`,
          severity: consistencyScore < 50 ? 'critical' as const : 
                   consistencyScore < 70 ? 'high' as const : 'medium' as const
        });
      }
    }
  }

  const overallConsistency = maxConsistencyPoints > 0 ? 
    Math.round((totalConsistencyPoints / maxConsistencyPoints) * 100) / 100 : 100;

  const recommendations = generateAnalysisRecommendations(differences, overallConsistency);

  return {
    consistency_score: overallConsistency,
    major_differences: differences,
    recommendations
  };
}

function compareScreenshots(baseline: any, comparison: any): number {
  // Simplified comparison logic
  // In real implementation would use image processing libraries
  
  let score = 100;

  // Compare dimensions
  const baselineDims = baseline.dimensions;
  const comparisonDims = comparison.dimensions;
  
  if (baselineDims && comparisonDims) {
    const widthDiff = Math.abs(baselineDims.width - comparisonDims.width) / baselineDims.width;
    const heightDiff = Math.abs(baselineDims.height - comparisonDims.height) / baselineDims.height;
    
    score -= widthDiff * 20; // Penalize width differences
    score -= heightDiff * 15; // Penalize height differences
  }

  // Compare file sizes (indicator of content differences)
  const baselineSize = baseline.capture_metadata.file_size_kb;
  const comparisonSize = comparison.capture_metadata.file_size_kb;
  
  if (baselineSize && comparisonSize) {
    const sizeDiff = Math.abs(baselineSize - comparisonSize) / baselineSize;
    score -= sizeDiff * 10; // Small penalty for size differences
  }

  // Factor in detected issues
  const baselineIssues = baseline.capture_metadata.issues_detected.length;
  const comparisonIssues = comparison.capture_metadata.issues_detected.length;
  
  score -= Math.abs(baselineIssues - comparisonIssues) * 5;

  return Math.max(0, Math.round(score));
}

function generateAnalysisRecommendations(differences: any[], consistencyScore: number): string[] {
  const recommendations: string[] = [];

  if (consistencyScore < 70) {
    recommendations.push('Significant cross-client inconsistencies detected - review email structure');
  }

  if (differences.some(d => d.severity === 'critical')) {
    recommendations.push('Critical rendering issues found - fix before deployment');
  }

  if (differences.some(d => d.clients_affected.includes('outlook'))) {
    recommendations.push('Use table-based layout for better Outlook compatibility');
  }

  if (differences.some(d => d.clients_affected.includes('gmail'))) {
    recommendations.push('Optimize for Gmail rendering constraints');
  }

  const mobileIssues = differences.filter(d => d.description.includes('mobile'));
  if (mobileIssues.length > 0) {
    recommendations.push('Improve mobile responsive design');
  }

  if (recommendations.length === 0) {
    recommendations.push('Screenshots show good cross-client consistency');
  }

  return recommendations;
}

async function createDeliveryPackage(
  screenshots: any[],
  analysis: any,
  outputSettings?: any
): Promise<any> {
  try {
    const individualFiles = screenshots.map(s => s.image_path || s.image_url);
    
    // Calculate total size
    const totalSizeBytes = screenshots.reduce((sum, s) => 
      sum + (s.capture_metadata.file_size_kb * 1024), 0
    );
    const totalSizeMB = Math.round(totalSizeBytes / (1024 * 1024) * 100) / 100;

    // Generate summary report
    const summaryReport = generateSummaryReport(screenshots, analysis);

    return {
      individual_files: individualFiles,
      total_size_mb: totalSizeMB,
      summary_report: summaryReport,
      // archive_url would be generated by actual archiving service
    };

  } catch (error) {
    console.warn('Failed to create delivery package:', error);
    
    return {
      individual_files: [],
      total_size_mb: 0,
      summary_report: 'Package creation failed'
    };
  }
}

function generateSummaryReport(screenshots: any[], analysis: any): string {
  const clientCount = new Set(screenshots.map(s => s.client)).size;
  const deviceCount = new Set(screenshots.map(s => s.device)).size;
  
  const report = [
    `Email Screenshot Analysis Report`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `COVERAGE:`,
    `- ${clientCount} email clients tested`,
    `- ${deviceCount} device types tested`,
    `- ${screenshots.length} total screenshots captured`,
    ``,
    `CONSISTENCY ANALYSIS:`,
    `- Overall consistency score: ${Math.round(analysis.consistency_score * 100)}%`,
    `- Major differences found: ${analysis.major_differences.length}`,
    ``,
    `RECOMMENDATIONS:`,
    ...analysis.recommendations.map((r: string) => `- ${r}`),
    ``,
    `NEXT STEPS:`,
    `- Review screenshots for visual quality`,
    `- Address any critical rendering issues`,
    `- Test email in actual client environments`
  ].join('\n');

  return report;
}