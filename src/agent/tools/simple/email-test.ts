/**
 * 🧪 EMAIL TEST - Simple Tool
 * 
 * Простое тестирование email в различных клиентах и устройствах
 * Заменяет часть функциональности quality-controller
 */

import { z } from 'zod';
import { renderTest } from '../render-test';

export const emailTestSchema = z.object({
  html_content: z.string().describe('HTML email content to test'),
  test_suite: z.enum(['basic', 'comprehensive', 'custom']).default('basic').describe('Test suite to run'),
  target_clients: z.array(z.enum(['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird', 'samsung_mail'])).default(['gmail', 'outlook', 'apple_mail']).describe('Email clients to test'),
  device_targets: z.array(z.enum(['desktop', 'mobile', 'tablet'])).default(['desktop', 'mobile']).describe('Device types to test'),
  test_criteria: z.object({
    functionality_tests: z.array(z.enum(['links', 'images', 'responsive_layout', 'fonts', 'spacing'])).default(['links', 'images', 'responsive_layout']),
    performance_tests: z.array(z.enum(['load_time', 'rendering_speed', 'image_loading'])).default(['load_time']),
    accessibility_tests: z.array(z.enum(['screen_reader', 'keyboard_navigation', 'color_contrast'])).default(['screen_reader']),
    visual_tests: z.array(z.enum(['layout_consistency', 'image_display', 'text_rendering', 'spacing_accuracy'])).default(['layout_consistency'])
  }).optional().nullable().describe('Specific test criteria to check'),
  test_settings: z.object({
    timeout_seconds: z.number().default(30).describe('Maximum time to wait for rendering'),
    take_screenshots: z.boolean().default(true).describe('Capture screenshots for visual comparison'),
    check_dark_mode: z.boolean().default(false).describe('Test dark mode compatibility'),
    test_image_blocking: z.boolean().default(true).describe('Test with images blocked')
  }).optional().nullable().describe('Test execution settings')
});

export type EmailTestParams = z.infer<typeof emailTestSchema>;

export interface EmailTestResult {
  success: boolean;
  test_results: {
    overall_status: 'pass' | 'warning' | 'fail';
    test_summary: {
      total_tests: number;
      tests_passed: number;
      tests_failed: number;
      tests_skipped: number;
    };
    client_results: Record<string, {
      status: 'pass' | 'warning' | 'fail';
      device_results: Record<string, {
        functionality_score: number;
        performance_score: number;
        accessibility_score: number;
        visual_score: number;
        issues_found: Array<{
          severity: 'critical' | 'high' | 'medium' | 'low';
          category: string;
          description: string;
          screenshot_url?: string;
        }>;
      }>;
      client_specific_issues: string[];
      compatibility_rating: number;
    }>;
    cross_client_analysis: {
      consistency_score: number;
      common_issues: string[];
      client_specific_behaviors: Array<{
        client: string;
        behavior: string;
        impact: 'critical' | 'high' | 'medium' | 'low';
      }>;
    };
  };
  test_metadata: {
    test_duration: number;
    test_timestamp: string;
    test_suite_used: string;
    screenshots_captured: number;
    recommendations: string[];
  };
  error?: string;
}

export async function emailTest(params: EmailTestParams): Promise<EmailTestResult> {
  const startTime = Date.now();
  const testTimestamp = new Date().toISOString();
  
  try {
    console.log('🧪 Starting email testing suite:', {
      test_suite: params.test_suite,
      target_clients: params.target_clients,
      device_targets: params.device_targets
    });

    // Initialize test results structure
    const clientResults: Record<string, any> = {};
    let totalTests = 0;
    let testsPassedCount = 0;
    let testsFailedCount = 0;
    let testsSkippedCount = 0;
    let screenshotsCaptured = 0;

    // Run tests for each client
    for (const client of params.target_clients) {
      console.log(`📧 Testing in ${client}...`);
      
      const clientResult = await testEmailInClient(
        client, 
        params.html_content, 
        params.device_targets, 
        params.test_criteria,
        params.test_settings
      );
      
      clientResults[client] = clientResult;
      
      // Update counters
      Object.values(clientResult.device_results).forEach((deviceResult: any) => {
        totalTests += deviceResult.tests_run || 0;
        testsPassedCount += deviceResult.tests_passed || 0;
        testsFailedCount += deviceResult.tests_failed || 0;
        testsSkippedCount += deviceResult.tests_skipped || 0;
      });
      
      if (params.test_settings?.take_screenshots) {
        screenshotsCaptured += params.device_targets.length;
      }
    }

    // Perform cross-client analysis
    const crossClientAnalysis = analyzeCrossClientResults(clientResults);
    
    // Determine overall status
    const overallStatus = determineOverallTestStatus(clientResults);
    
    // Generate recommendations
    const recommendations = generateTestRecommendations(clientResults, crossClientAnalysis);

    const testDuration = Date.now() - startTime;

    return {
      success: true,
      test_results: {
        overall_status: overallStatus,
        test_summary: {
          total_tests: totalTests,
          tests_passed: testsPassedCount,
          tests_failed: testsFailedCount,
          tests_skipped: testsSkippedCount
        },
        client_results: clientResults,
        cross_client_analysis: crossClientAnalysis
      },
      test_metadata: {
        test_duration: testDuration,
        test_timestamp: testTimestamp,
        test_suite_used: params.test_suite,
        screenshots_captured: screenshotsCaptured,
        recommendations: recommendations
      }
    };

  } catch (error) {
    const testDuration = Date.now() - startTime;
    console.error('❌ Email testing failed:', error);

    return {
      success: false,
      test_results: {
        overall_status: 'fail',
        test_summary: {
          total_tests: 0,
          tests_passed: 0,
          tests_failed: 0,
          tests_skipped: 0
        },
        client_results: {},
        cross_client_analysis: {
          consistency_score: 0,
          common_issues: [],
          client_specific_behaviors: []
        }
      },
      test_metadata: {
        test_duration: testDuration,
        test_timestamp: testTimestamp,
        test_suite_used: params.test_suite,
        screenshots_captured: 0,
        recommendations: ['Check test configuration', 'Verify HTML content', 'Review error logs']
      },
      error: error instanceof Error ? error.message : 'Unknown email testing error'
    };
  }
}

async function testEmailInClient(
  client: string, 
  htmlContent: string, 
  deviceTargets: string[],
  testCriteria?: any,
  testSettings?: any
): Promise<any> {
  
  const clientResult: any = {
    status: 'pass',
    device_results: {},
    client_specific_issues: [],
    compatibility_rating: 100
  };

  try {
    // Test on each device target
    for (const device of deviceTargets) {
      console.log(`📱 Testing ${client} on ${device}...`);
      
      const deviceResult = await testEmailOnDevice(
        client, 
        device, 
        htmlContent, 
        testCriteria,
        testSettings
      );
      
      clientResult.device_results[device] = deviceResult;
      
      // Update client status based on device results
      if (deviceResult.issues_found.some((issue: any) => issue.severity === 'critical')) {
        clientResult.status = 'fail';
        clientResult.compatibility_rating -= 30;
      } else if (deviceResult.issues_found.some((issue: any) => issue.severity === 'high')) {
        if (clientResult.status === 'pass') clientResult.status = 'warning';
        clientResult.compatibility_rating -= 15;
      }
    }

    // Add client-specific issues based on known limitations
    clientResult.client_specific_issues = getKnownClientIssues(client, htmlContent);
    
    return clientResult;

  } catch (error) {
    console.warn(`Failed to test ${client}:`, error);
    
    return {
      status: 'fail',
      device_results: {},
      client_specific_issues: [`Testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      compatibility_rating: 0
    };
  }
}

async function testEmailOnDevice(
  client: string, 
  device: string, 
  htmlContent: string,
  testCriteria?: any,
  testSettings?: any
): Promise<any> {
  
  const issues: any[] = [];
  let functionalityScore = 100;
  let performanceScore = 100;
  let accessibilityScore = 100;
  let visualScore = 100;

  try {
    // Use existing render test tool if available
    const renderTestParams = {
      html_content: htmlContent,
      test_clients: [client],
      test_devices: [device],
      include_screenshots: testSettings?.take_screenshots || false,
      test_settings: {
        timeout: testSettings?.timeout_seconds || 30,
        check_images: testSettings?.test_image_blocking || true
      }
    };

    const renderResult = await renderTest(renderTestParams);
    
    if (renderResult.success && renderResult.test_results) {
      // Extract issues from render test
      const clientResults = renderResult.test_results.client_results?.[client];
      if (clientResults?.issues_found) {
        issues.push(...clientResults.issues_found.map((issue: any) => ({
          severity: issue.severity,
          category: 'rendering',
          description: issue.description,
          screenshot_url: issue.screenshot_url
        })));
      }
      
      // Update scores based on render test results
      if (clientResults?.compatibility_score) {
        functionalityScore = clientResults.compatibility_score;
      }
    }

  } catch (error) {
    console.warn(`Render test failed for ${client}/${device}:`, error);
    issues.push({
      severity: 'high',
      category: 'testing',
      description: 'Render testing failed - manual verification needed'
    });
    functionalityScore -= 20;
  }

  // Additional client/device specific checks
  const specificIssues = checkClientDeviceSpecificIssues(client, device, htmlContent);
  issues.push(...specificIssues);

  // Update scores based on issues
  issues.forEach(issue => {
    const scoreReduction = {
      'critical': 25,
      'high': 15,
      'medium': 10,
      'low': 5
    }[issue.severity] || 5;

    switch (issue.category) {
      case 'functionality':
      case 'rendering':
        functionalityScore = Math.max(0, functionalityScore - scoreReduction);
        break;
      case 'performance':
        performanceScore = Math.max(0, performanceScore - scoreReduction);
        break;
      case 'accessibility':
        accessibilityScore = Math.max(0, accessibilityScore - scoreReduction);
        break;
      case 'visual':
        visualScore = Math.max(0, visualScore - scoreReduction);
        break;
    }
  });

  return {
    functionality_score: functionalityScore,
    performance_score: performanceScore,
    accessibility_score: accessibilityScore,
    visual_score: visualScore,
    issues_found: issues,
    tests_run: 4, // Simplified count
    tests_passed: Math.round((functionalityScore + performanceScore + accessibilityScore + visualScore) / 100),
    tests_failed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length,
    tests_skipped: 0
  };
}

function checkClientDeviceSpecificIssues(client: string, device: string, htmlContent: string): any[] {
  const issues: any[] = [];
  const lowerContent = htmlContent.toLowerCase();

  // Client-specific checks
  switch (client) {
    case 'outlook':
      if (lowerContent.includes('background-image')) {
        issues.push({
          severity: 'medium',
          category: 'visual',
          description: 'Background images may not display in Outlook'
        });
      }
      if (lowerContent.includes('flexbox') || lowerContent.includes('display:flex')) {
        issues.push({
          severity: 'high',
          category: 'functionality',
          description: 'Flexbox layout not supported in Outlook'
        });
      }
      break;
      
    case 'gmail':
      if (htmlContent.length > 102000) {
        issues.push({
          severity: 'critical',
          category: 'functionality',
          description: 'Email may be clipped in Gmail due to size limit'
        });
      }
      if (lowerContent.includes('<style>')) {
        issues.push({
          severity: 'medium',
          category: 'visual',
          description: 'Style tags may be stripped in Gmail'
        });
      }
      break;
      
    case 'apple_mail':
      if (device === 'mobile' && !lowerContent.includes('viewport')) {
        issues.push({
          severity: 'medium',
          category: 'visual',
          description: 'Missing viewport meta tag for mobile optimization'
        });
      }
      break;
  }

  // Device-specific checks
  if (device === 'mobile') {
    if (!lowerContent.includes('media') && !lowerContent.includes('@media')) {
      issues.push({
        severity: 'medium',
        category: 'visual',
        description: 'No responsive design detected for mobile'
      });
    }
    
    // Check for touch-friendly buttons
    const buttonMatches = htmlContent.match(/<a[^>]*>/gi) || [];
    const hasTouchFriendlyButtons = buttonMatches.some(button => 
      button.includes('padding') || button.includes('height')
    );
    
    if (!hasTouchFriendlyButtons && buttonMatches.length > 0) {
      issues.push({
        severity: 'low',
        category: 'accessibility',
        description: 'Buttons may not be touch-friendly on mobile'
      });
    }
  }

  return issues;
}

function getKnownClientIssues(client: string, htmlContent: string): string[] {
  const issues: string[] = [];
  
  const clientLimitations = {
    outlook: [
      'Limited CSS support',
      'No web fonts support',
      'Background image limitations',
      'No CSS Grid or Flexbox'
    ],
    gmail: [
      'Clips emails over 102KB',
      'Strips style tags',
      'Limited CSS support',
      'Caches images aggressively'
    ],
    apple_mail: [
      'Good CSS support but may have quirks',
      'Image scaling issues on retina displays'
    ],
    yahoo: [
      'Limited CSS support',
      'May modify HTML structure'
    ]
  };

  return clientLimitations[client as keyof typeof clientLimitations] || [];
}

function analyzeCrossClientResults(clientResults: Record<string, any>): any {
  const clients = Object.keys(clientResults);
  let consistencyScore = 100;
  const commonIssues: string[] = [];
  const clientSpecificBehaviors: any[] = [];

  if (clients.length < 2) {
    return {
      consistency_score: 100,
      common_issues: [],
      client_specific_behaviors: []
    };
  }

  // Find common issues across clients
  const allIssues = clients.flatMap(client => 
    Object.values(clientResults[client].device_results || {}).flatMap((deviceResult: any) => 
      deviceResult.issues_found || []
    )
  );

  const issueFrequency: Record<string, number> = {};
  allIssues.forEach((issue: any) => {
    issueFrequency[issue.description] = (issueFrequency[issue.description] || 0) + 1;
  });

  Object.entries(issueFrequency).forEach(([issue, frequency]) => {
    if (frequency >= Math.ceil(clients.length / 2)) {
      commonIssues.push(issue);
    }
  });

  // Calculate consistency score
  const clientScores = clients.map(client => {
    const deviceResults = Object.values(clientResults[client].device_results || {});
    const avgScore = deviceResults.reduce((sum: number, result: any) => 
      sum + (result.functionality_score + result.visual_score) / 2, 0) / deviceResults.length || 0;
    return avgScore;
  });

  const maxScore = Math.max(...clientScores);
  const minScore = Math.min(...clientScores);
  consistencyScore = Math.round(100 - (maxScore - minScore));

  // Identify client-specific behaviors
  clients.forEach(client => {
    const clientIssues = clientResults[client].client_specific_issues || [];
    clientIssues.forEach((issue: string) => {
      clientSpecificBehaviors.push({
        client,
        behavior: issue,
        impact: 'medium' as const
      });
    });
  });

  return {
    consistency_score: Math.max(0, consistencyScore),
    common_issues: commonIssues,
    client_specific_behaviors: clientSpecificBehaviors
  };
}

function determineOverallTestStatus(clientResults: Record<string, any>): 'pass' | 'warning' | 'fail' {
  const clients = Object.keys(clientResults);
  const failedClients = clients.filter(client => clientResults[client].status === 'fail');
  const warningClients = clients.filter(client => clientResults[client].status === 'warning');

  if (failedClients.length > 0) {
    return 'fail';
  } else if (warningClients.length > 0) {
    return 'warning';
  } else {
    return 'pass';
  }
}

function generateTestRecommendations(clientResults: Record<string, any>, crossClientAnalysis: any): string[] {
  const recommendations: string[] = [];
  
  const clients = Object.keys(clientResults);
  const failedClients = clients.filter(client => clientResults[client].status === 'fail');
  const warningClients = clients.filter(client => clientResults[client].status === 'warning');

  if (failedClients.length > 0) {
    recommendations.push(`Critical issues found in: ${failedClients.join(', ')} - fix before deployment`);
  }

  if (warningClients.length > 0) {
    recommendations.push(`Minor issues in: ${warningClients.join(', ')} - consider improvements`);
  }

  if (crossClientAnalysis.consistency_score < 80) {
    recommendations.push('Low cross-client consistency - review layout and styling');
  }

  if (crossClientAnalysis.common_issues.length > 0) {
    recommendations.push('Address common issues affecting multiple clients');
  }

  // Outlook-specific recommendations
  if (clientResults.outlook?.status === 'fail' || clientResults.outlook?.status === 'warning') {
    recommendations.push('Use table-based layout and inline styles for Outlook compatibility');
  }

  // Gmail-specific recommendations
  if (clientResults.gmail?.status === 'fail') {
    recommendations.push('Reduce email size and use inline styles for Gmail compatibility');
  }

  // Mobile-specific recommendations
  const mobileIssues = clients.some(client => 
    clientResults[client].device_results?.mobile?.issues_found?.length > 0
  );
  if (mobileIssues) {
    recommendations.push('Improve mobile responsiveness with media queries and touch-friendly elements');
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passed - email is ready for deployment');
  }

  return recommendations;
}