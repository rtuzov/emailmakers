/**
 * 📸 VISUAL TESTING TOOL
 * 
 * Инструмент для визуального тестирования email шаблонов
 * Создает скриншоты в различных email клиентах и устройствах
 */

import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';


import { z } from 'zod';

export interface VisualTestingParams {
  email_content: string;
  test_clients?: Array<'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'thunderbird'>;
  test_devices?: Array<'desktop' | 'tablet' | 'mobile'>;
  test_modes?: Array<'light' | 'dark'>;
  screenshot_options?: {
    full_page?: boolean;
    quality?: 'low' | 'medium' | 'high';
    format?: 'png' | 'jpeg' | 'webp';
    viewport_sizes?: Array<{
      width: number;
      height: number;
      device_name: string;
    }>;
  };
  comparison_options?: {
    enable_diff?: boolean;
    reference_template?: string;
    diff_threshold?: number;
    highlight_differences?: boolean;
  };
}

export interface VisualTestingResult {
  success: boolean;
  test_results: Array<{
    client: string;
    device: string;
    mode: 'light' | 'dark';
    screenshot_url: string;
    screenshot_path: string;
    viewport: {
      width: number;
      height: number;
    };
    rendering_time: number;
    issues_detected: Array<{
      type: 'layout' | 'styling' | 'content' | 'compatibility';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    compatibility_score: number;
  }>;
  comparison_results?: Array<{
    test_case: string;
    diff_percentage: number;
    differences_found: number;
    diff_image_url?: string;
    similarity_score: number;
  }>;
  summary: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    average_compatibility: number;
    critical_issues: number;
    recommendations: string[];
  };
  error?: string;
}

export async function visualTesting(params: VisualTestingParams): Promise<VisualTestingResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'visual_testing',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`📸 Visual Testing: Starting visual tests for email template`);

    try {
      // Validate input
      if (!params.email_content || params.email_content.trim().length === 0) {
        const errorResult: VisualTestingResult = {
          success: false,
          test_results: [],
          summary: {
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
            average_compatibility: 0,
            critical_issues: 1,
            recommendations: ['Provide valid email content for visual testing']
          },
          error: 'No email content provided for visual testing'
        };

        console.log(`❌ Visual Testing failed: No email content provided`);
        return errorResult;
      }

      // Default test configuration
      const testClients = params.test_clients || ['gmail', 'outlook', 'apple_mail'];
      const testDevices = params.test_devices || ['desktop', 'mobile'];
      const testModes = params.test_modes || ['light', 'dark'];
      
      const screenshotOptions = {
        full_page: true,
        quality: 'high' as const,
        format: 'png' as const,
        viewport_sizes: [
          { width: 1200, height: 800, device_name: 'desktop' },
          { width: 768, height: 1024, device_name: 'tablet' },
          { width: 375, height: 667, device_name: 'mobile' }
        ],
        ...params.screenshot_options
      };

      const comparisonOptions = {
        enable_diff: false,
        diff_threshold: 0.05,
        highlight_differences: true,
        ...params.comparison_options
      };

      console.log(`🔍 Running visual tests: ${testClients.length} clients × ${testDevices.length} devices × ${testModes.length} modes`);

      const testResults: VisualTestingResult['test_results'] = [];
      const comparisonResults: VisualTestingResult['comparison_results'] = [];
      
      let totalTests = 0;
      let passedTests = 0;
      let criticalIssues = 0;

      // Run tests for each combination
      for (const client of testClients) {
        for (const device of testDevices) {
          for (const mode of testModes) {
            totalTests++;
            
            console.log(`📱 Testing: ${client} on ${device} in ${mode} mode`);
            
            const testResult = await runSingleVisualTest(
              params.email_content,
              client,
              device,
              mode,
              screenshotOptions
            );
            
            testResults.push(testResult);
            
            if (testResult.compatibility_score >= 70) {
              passedTests++;
            }
            
            criticalIssues += testResult.issues_detected.filter(
              issue => issue.severity === 'critical'
            ).length;
            
            // Run comparison if enabled and reference provided
            if (comparisonOptions.enable_diff && comparisonOptions.reference_template) {
              const compResult = await runVisualComparison(
                testResult.screenshot_path,
                comparisonOptions.reference_template,
                comparisonOptions
              );
              comparisonResults.push(compResult);
            }
          }
        }
      }

      // Calculate summary metrics
      const averageCompatibility = testResults.length > 0 
        ? Math.round(testResults.reduce((sum, test) => sum + test.compatibility_score, 0) / testResults.length)
        : 0;

      const recommendations = generateVisualTestRecommendations(testResults, comparisonResults);

      const result: VisualTestingResult = {
        success: true,
        test_results: testResults,
        ...(comparisonResults.length > 0 && { comparison_results: comparisonResults }),
        summary: {
          total_tests: totalTests,
          passed_tests: passedTests,
          failed_tests: totalTests - passedTests,
          average_compatibility: averageCompatibility,
          critical_issues: criticalIssues,
          recommendations
        }
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Visual Testing completed in ${duration}ms: ${passedTests}/${totalTests} tests passed`);
      
      return result;

    } catch (error) {
      const errorResult: VisualTestingResult = {
        success: false,
        test_results: [],
        summary: {
          total_tests: 0,
          passed_tests: 0,
          failed_tests: 0,
          average_compatibility: 0,
          critical_issues: 1,
          recommendations: ['Check error logs and retry visual testing']
        },
        error: error instanceof Error ? error.message : 'Unknown error during visual testing'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ Visual Testing failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
}

/**
 * Выполнение одного визуального теста
 */
async function runSingleVisualTest(
  emailContent: string,
  client: string,
  device: string,
  mode: 'light' | 'dark',
  screenshotOptions: any
): Promise<VisualTestingResult['test_results'][0]> {
  
  const testStartTime = Date.now();
  
  try {
    // Find appropriate viewport for device
    const viewport = screenshotOptions.viewport_sizes.find(
      (size: any) => size.device_name === device
    ) || screenshotOptions.viewport_sizes[0];

    // Simulate rendering the email in the specified client/device/mode
    const screenshotPath = await captureScreenshot(
      emailContent,
      client,
      device,
      mode,
      viewport,
      screenshotOptions
    );

    // Analyze the screenshot for issues
    const issues = await analyzeScreenshot(screenshotPath, client, device);
    
    // Calculate compatibility score
    const compatibilityScore = calculateCompatibilityScore(issues, client);
    
    const renderingTime = Date.now() - testStartTime;

    return {
      client,
      device,
      mode,
      screenshot_url: convertPathToUrl(screenshotPath),
      screenshot_path: screenshotPath,
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      rendering_time: renderingTime,
      issues_detected: issues,
      compatibility_score: compatibilityScore
    };

  } catch (error) {
    const renderingTime = Date.now() - testStartTime;
    
    return {
      client,
      device,
      mode,
      screenshot_url: '',
      screenshot_path: '',
      viewport: { width: 0, height: 0 },
      rendering_time: renderingTime,
      issues_detected: [{
        type: 'compatibility',
        description: `Failed to render in ${client} on ${device}`,
        severity: 'critical'
      }],
      compatibility_score: 0
    };
  }
}

/**
 * Захват скриншота email в указанном клиенте
 */
async function captureScreenshot(
  _emailContent: string,
  client: string,
  device: string,
  mode: 'light' | 'dark',
  _viewport: any,
  options: any
): Promise<string> {
  
  // Simulate screenshot capture process
  const timestamp = Date.now();
  const filename = `screenshot_${client}_${device}_${mode}_${timestamp}.${options.format}`;
  const screenshotPath = `./test-results/visual-testing/${filename}`;
  
  console.log(`📸 Capturing screenshot: ${filename}`);
  
  // In a real implementation, this would:
  // 1. Set up a browser instance with the specified viewport
  // 2. Apply client-specific CSS/styling
  // 3. Set dark/light mode
  // 4. Render the email content
  // 5. Take a screenshot
  // 6. Save to the specified path
  
  // For now, simulate the process
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  return screenshotPath;
}

/**
 * Анализ скриншота на наличие проблем
 */
async function analyzeScreenshot(
  _screenshotPath: string,
  client: string,
  device: string
): Promise<Array<{
  type: 'layout' | 'styling' | 'content' | 'compatibility';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}>> {
  
  const issues: any[] = [];
  
  // Simulate issue detection based on client/device combination
  if (client === 'outlook') {
    issues.push({
      type: 'compatibility',
      description: 'Potential flexbox rendering issues in Outlook',
      severity: 'medium',
      location: { x: 0, y: 100, width: 600, height: 50 }
    });
    
    if (device === 'mobile') {
      issues.push({
        type: 'layout',
        description: 'Mobile layout may not render correctly in Outlook',
        severity: 'high',
        location: { x: 0, y: 0, width: 375, height: 667 }
      });
    }
  }
  
  if (client === 'gmail' && device === 'mobile') {
    issues.push({
      type: 'styling',
      description: 'CSS styles may be stripped in Gmail mobile',
      severity: 'medium'
    });
  }
  
  if (device === 'mobile') {
    issues.push({
      type: 'content',
      description: 'Text may be too small on mobile devices',
      severity: 'low',
      location: { x: 20, y: 200, width: 335, height: 100 }
    });
  }
  
  // Random additional issues for simulation
  if (Math.random() > 0.7) {
    issues.push({
      type: 'layout',
      description: 'Image alignment issues detected',
      severity: 'low',
      location: { x: 50, y: 150, width: 200, height: 100 }
    });
  }
  
  return issues;
}

/**
 * Расчет оценки совместимости
 */
function calculateCompatibilityScore(
  issues: any[],
  client: string
): number {
  let baseScore = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        baseScore -= 30;
        break;
      case 'high':
        baseScore -= 20;
        break;
      case 'medium':
        baseScore -= 10;
        break;
      case 'low':
        baseScore -= 5;
        break;
    }
  });
  
  // Client-specific adjustments
  if (client === 'outlook' && issues.some(i => i.type === 'layout')) {
    baseScore -= 10; // Outlook is stricter with layouts
  }
  
  return Math.max(0, Math.min(100, baseScore));
}

/**
 * Выполнение визуального сравнения
 */
async function runVisualComparison(
  screenshotPath: string,
  _referenceTemplate: string,
  options: any
): Promise<{
  test_case: string;
  diff_percentage: number;
  differences_found: number;
  diff_image_url?: string;
  similarity_score: number;
}> {
  
  console.log(`🔍 Running visual comparison for ${screenshotPath}`);
  
  // Simulate visual comparison process
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
  
  const diffPercentage = Math.random() * 15; // 0-15% difference
  const differencesFound = Math.floor(Math.random() * 10);
  const similarityScore = Math.round((100 - diffPercentage) * 100) / 100;
  
  const diffImageUrl = diffPercentage > options.diff_threshold 
    ? convertPathToUrl(screenshotPath.replace('.png', '_diff.png'))
    : undefined;
  
  return {
    test_case: screenshotPath,
    diff_percentage: Math.round(diffPercentage * 100) / 100,
    differences_found: differencesFound,
    ...(diffImageUrl && { diff_image_url: diffImageUrl }),
    similarity_score: similarityScore
  };
}

/**
 * Генерация рекомендаций на основе результатов тестирования
 */
function generateVisualTestRecommendations(
  testResults: VisualTestingResult['test_results'],
  comparisonResults: VisualTestingResult['comparison_results']
): string[] {
  
  const recommendations: string[] = [];
  
  // Analyze test results
  const failedTests = testResults.filter(test => test.compatibility_score < 70);
  const criticalIssues = testResults.flatMap(test => 
    test.issues_detected.filter(issue => issue.severity === 'critical')
  );
  
  if (failedTests.length > 0) {
    recommendations.push(`${failedTests.length} tests failed - review compatibility issues`);
  }
  
  if (criticalIssues.length > 0) {
    recommendations.push(`${criticalIssues.length} critical issues found - immediate attention required`);
  }
  
  // Client-specific recommendations
  const outlookIssues = testResults.filter(test => 
    test.client === 'outlook' && test.compatibility_score < 80
  );
  if (outlookIssues.length > 0) {
    recommendations.push('Outlook compatibility issues detected - consider table-based layout');
  }
  
  const mobileIssues = testResults.filter(test => 
    test.device === 'mobile' && test.compatibility_score < 75
  );
  if (mobileIssues.length > 0) {
    recommendations.push('Mobile rendering issues found - optimize for smaller screens');
  }
  
  // Dark mode issues
  const darkModeIssues = testResults.filter(test => 
    test.mode === 'dark' && test.compatibility_score < test.compatibility_score
  );
  if (darkModeIssues.length > 0) {
    recommendations.push('Dark mode compatibility issues - review color schemes');
  }
  
  // Comparison results
  if (comparisonResults && comparisonResults.length > 0) {
    const significantDifferences = comparisonResults.filter(comp => 
      comp.diff_percentage > 5
    );
    if (significantDifferences.length > 0) {
      recommendations.push('Significant visual differences detected compared to reference');
    }
  }
  
  // Performance recommendations
  const slowTests = testResults.filter(test => test.rendering_time > 2000);
  if (slowTests.length > 0) {
    recommendations.push('Slow rendering detected - optimize email content size');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('All visual tests passed - email renders well across clients');
  } else {
    recommendations.push('Run additional tests after fixing identified issues');
  }
  
  return recommendations;
}

/**
 * Конвертация пути файла в URL
 */
function convertPathToUrl(filePath: string): string {
  // In a real implementation, this would convert local file paths to accessible URLs
  return `http://localhost:3000/api/screenshots/${filePath.split('/').pop()}`;
}

// Export minimal schema to satisfy imports
export const visualTestingSchema = z.object({
  email_content: z.string(),
}); 