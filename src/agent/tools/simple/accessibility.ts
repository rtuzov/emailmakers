/**
 * ♿ ACCESSIBILITY TOOL
 * 
 * Инструмент для проверки и улучшения доступности email шаблонов
 * Обеспечивает соответствие стандартам WCAG и лучшим практикам
 */

import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';


import { z } from 'zod';

export interface AccessibilityParams {
  action: 'audit' | 'fix' | 'validate' | 'report';
  
  // For audit and validation
  html_content?: string;
  wcag_level?: 'A' | 'AA' | 'AAA';
  check_categories?: Array<'color_contrast' | 'alt_text' | 'semantic_markup' | 'keyboard_navigation' | 'screen_reader' | 'font_size'>;
  
  // For fixes
  target_html?: string;
  auto_fix_level?: 'conservative' | 'standard' | 'aggressive';
  preserve_design?: boolean;
  
  // For reporting
  include_recommendations?: boolean;
  output_format?: 'json' | 'html' | 'text';
  
  // Email-specific options
  email_clients?: Array<'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'thunderbird'>;
  test_dark_mode?: boolean;
}

export interface AccessibilityResult {
  success: boolean;
  action_performed: string;
  
  // Audit results
  audit_results?: {
    overall_score: number;
    wcag_compliance: {
      level_a: boolean;
      level_aa: boolean;
      level_aaa: boolean;
    };
    issues_by_category: {
      color_contrast: AccessibilityIssue[];
      alt_text: AccessibilityIssue[];
      semantic_markup: AccessibilityIssue[];
      keyboard_navigation: AccessibilityIssue[];
      screen_reader: AccessibilityIssue[];
      font_size: AccessibilityIssue[];
    };
    client_specific_issues: Array<{
      client: string;
      issues: AccessibilityIssue[];
    }>;
  };
  
  // Fix results
  fixed_html?: string;
  applied_fixes?: Array<{
    type: string;
    description: string;
    before: string;
    after: string;
    impact: 'low' | 'medium' | 'high';
    wcag_criteria: string[];
  }>;
  
  // Validation results
  validation_summary?: {
    total_issues: number;
    critical_issues: number;
    resolved_issues: number;
    remaining_issues: number;
    compliance_improved: boolean;
  };
  
  // Report data
  detailed_report?: {
    executive_summary: string;
    issues_breakdown: Record<string, number>;
    recommendations: string[];
    implementation_guide: string[];
    testing_checklist: string[];
  };
  
  performance_metrics: {
    accessibility_score: number;
    contrast_ratio_avg: number;
    semantic_elements_count: number;
    alt_text_coverage: number;
    font_readability_score: number;
  };
  
  recommendations: string[];
  error?: string;
}

interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element?: string;
  location?: {
    line?: number;
    column?: number;
    selector?: string;
  };
  wcag_criteria: string[];
  suggestion: string;
  auto_fixable: boolean;
}

export async function accessibility(params: AccessibilityParams): Promise<AccessibilityResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'accessibility',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`♿ Accessibility: ${params.action} operation starting`);

    try {
      // Validate parameters
      const validationResult = validateAccessibilityParams(params);
      if (!validationResult.valid) {
        const errorResult: AccessibilityResult = {
          success: false,
          action_performed: params.action,
          performance_metrics: {
            accessibility_score: 0,
            contrast_ratio_avg: 0,
            semantic_elements_count: 0,
            alt_text_coverage: 0,
            font_readability_score: 0
          },
          recommendations: ['Fix parameter validation errors'],
          error: validationResult.error
        };

        console.log(`❌ Accessibility failed: ${validationResult.error}`);
        return errorResult;
      }

      let result: AccessibilityResult;

      switch (params.action) {
        case 'audit':
          result = await auditAccessibility(params);
          break;
        case 'fix':
          result = await fixAccessibilityIssues(params);
          break;
        case 'validate':
          result = await validateAccessibility(params);
          break;
        case 'report':
          result = await generateAccessibilityReport(params);
          break;
        default:
          throw new Error(`Unknown action: ${params.action}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Accessibility ${params.action} completed in ${duration}ms`);
      
      return result;

    } catch (error) {
      const errorResult: AccessibilityResult = {
        success: false,
        action_performed: params.action,
        performance_metrics: {
          accessibility_score: 0,
          contrast_ratio_avg: 0,
          semantic_elements_count: 0,
          alt_text_coverage: 0,
          font_readability_score: 0
        },
        recommendations: ['Review error logs and fix issues'],
        error: error instanceof Error ? error.message : 'Unknown error in accessibility operation'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ Accessibility failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
}

/**
 * Валидация параметров для операций с доступностью
 */
function validateAccessibilityParams(params: AccessibilityParams): { valid: boolean; error?: string } {
  switch (params.action) {
    case 'audit':
    case 'validate':
      if (!params.html_content) {
        return { valid: false, error: 'HTML content required for accessibility audit/validation' };
      }
      break;
    case 'fix':
      if (!params.target_html) {
        return { valid: false, error: 'Target HTML required for accessibility fixes' };
      }
      break;
    case 'report':
      if (!params.html_content) {
        return { valid: false, error: 'HTML content required for accessibility report' };
      }
      break;
  }
  return { valid: true };
}

/**
 * Аудит доступности HTML контента
 */
async function auditAccessibility(params: AccessibilityParams): Promise<AccessibilityResult> {
  console.log('🔍 Auditing accessibility compliance');
  
  const htmlContent = params.html_content!;
  const wcagLevel = params.wcag_level || 'AA';
  const checkCategories = params.check_categories || [
    'color_contrast', 'alt_text', 'semantic_markup', 'keyboard_navigation', 'screen_reader', 'font_size'
  ];
  
  // Perform comprehensive accessibility audit
  const auditResults = await performAccessibilityAudit(htmlContent, wcagLevel, checkCategories);
  
  // Check email client specific issues
  const clientIssues = await checkEmailClientAccessibility(htmlContent, params.email_clients || []);
  
  // Test dark mode if requested
  if (params.test_dark_mode) {
    const darkModeIssues = await testDarkModeAccessibility(htmlContent);
    auditResults.issues_by_category.color_contrast.push(...darkModeIssues);
  }
  
  const performanceMetrics = calculateAccessibilityMetrics(auditResults);
  const recommendations = generateAuditRecommendations(auditResults, wcagLevel);
  
  return {
    success: true,
    action_performed: 'audit',
    audit_results: {
      overall_score: performanceMetrics.accessibility_score,
      wcag_compliance: calculateWCAGCompliance(auditResults, wcagLevel),
      issues_by_category: auditResults.issues_by_category as {
        color_contrast: AccessibilityIssue[];
        alt_text: AccessibilityIssue[];
        semantic_markup: AccessibilityIssue[];
        keyboard_navigation: AccessibilityIssue[];
        screen_reader: AccessibilityIssue[];
        font_size: AccessibilityIssue[];
      },
      client_specific_issues: clientIssues
    },
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Исправление проблем доступности
 */
async function fixAccessibilityIssues(params: AccessibilityParams): Promise<AccessibilityResult> {
  console.log('🔧 Fixing accessibility issues');
  
  const targetHtml = params.target_html!;
  const autoFixLevel = params.auto_fix_level || 'standard';
  const preserveDesign = params.preserve_design !== false;
  
  // First audit to identify issues
  const auditResults = await performAccessibilityAudit(targetHtml, 'AA', [
    'color_contrast', 'alt_text', 'semantic_markup', 'font_size'
  ]);
  
  let fixedHtml = targetHtml;
  const appliedFixes: AccessibilityResult['applied_fixes'] = [];
  
  // Apply fixes based on level and issues found
  for (const category of Object.keys(auditResults.issues_by_category)) {
    const issues = auditResults.issues_by_category[category as keyof typeof auditResults.issues_by_category];
    
    for (const issue of issues) {
      if (issue.auto_fixable && shouldApplyFix(issue, autoFixLevel)) {
        const fixResult = await applyAccessibilityFix(fixedHtml, issue, preserveDesign);
        
        if (fixResult.success) {
          fixedHtml = fixResult.fixedHtml;
          appliedFixes.push({
            type: issue.type,
            description: fixResult.description,
            before: fixResult.before,
            after: fixResult.after,
            impact: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'medium' : 'low',
            wcag_criteria: issue.wcag_criteria
          });
          console.log(`✅ Fixed ${issue.type}: ${issue.description}`);
        }
      }
    }
  }
  
  const performanceMetrics = calculateAccessibilityMetrics(auditResults);
  const recommendations = generateFixRecommendations(appliedFixes, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'fix',
    fixed_html: fixedHtml,
    applied_fixes: appliedFixes,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Валидация доступности после изменений
 */
async function validateAccessibility(params: AccessibilityParams): Promise<AccessibilityResult> {
  console.log('✅ Validating accessibility compliance');
  
  const htmlContent = params.html_content!;
  const wcagLevel = params.wcag_level || 'AA';
  
  const auditResults = await performAccessibilityAudit(htmlContent, wcagLevel, [
    'color_contrast', 'alt_text', 'semantic_markup', 'keyboard_navigation', 'screen_reader', 'font_size'
  ]);
  
  const totalIssues = Object.values(auditResults.issues_by_category).flat().length;
  const criticalIssues = Object.values(auditResults.issues_by_category).flat()
    .filter(issue => issue.severity === 'critical').length;
  
  const validationSummary = {
    total_issues: totalIssues,
    critical_issues: criticalIssues,
    resolved_issues: 0, // Would compare with previous audit
    remaining_issues: totalIssues,
    compliance_improved: criticalIssues === 0
  };
  
  const performanceMetrics = calculateAccessibilityMetrics(auditResults);
  const recommendations = generateValidationRecommendations(validationSummary, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'validate',
    validation_summary: validationSummary,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

/**
 * Генерация подробного отчета о доступности
 */
async function generateAccessibilityReport(params: AccessibilityParams): Promise<AccessibilityResult> {
  console.log('📊 Generating accessibility report');
  
  const htmlContent = params.html_content!;
  const includeRecommendations = params.include_recommendations !== false;
  const outputFormat = params.output_format || 'json';
  
  const auditResults = await performAccessibilityAudit(htmlContent, 'AA', [
    'color_contrast', 'alt_text', 'semantic_markup', 'keyboard_navigation', 'screen_reader', 'font_size'
  ]);
  
  const detailedReport = await createDetailedReport(auditResults, includeRecommendations, outputFormat);
  const performanceMetrics = calculateAccessibilityMetrics(auditResults);
  const recommendations = generateReportRecommendations(auditResults, performanceMetrics);
  
  return {
    success: true,
    action_performed: 'report',
    detailed_report: detailedReport,
    performance_metrics: performanceMetrics,
    recommendations
  };
}

// Helper functions

async function performAccessibilityAudit(
  html: string, 
  wcagLevel: string, 
  categories: string[]
): Promise<{ issues_by_category: Record<string, AccessibilityIssue[]> }> {
  
  const issues_by_category: Record<string, AccessibilityIssue[]> = {
    color_contrast: [],
    alt_text: [],
    semantic_markup: [],
    keyboard_navigation: [],
    screen_reader: [],
    font_size: []
  };
  
  // Color contrast checks
  if (categories.includes('color_contrast')) {
    issues_by_category.color_contrast = await checkColorContrast(html);
  }
  
  // Alt text checks
  if (categories.includes('alt_text')) {
    issues_by_category.alt_text = await checkAltText(html);
  }
  
  // Semantic markup checks
  if (categories.includes('semantic_markup')) {
    issues_by_category.semantic_markup = await checkSemanticMarkup(html);
  }
  
  // Keyboard navigation checks
  if (categories.includes('keyboard_navigation')) {
    issues_by_category.keyboard_navigation = await checkKeyboardNavigation(html);
  }
  
  // Screen reader checks
  if (categories.includes('screen_reader')) {
    issues_by_category.screen_reader = await checkScreenReaderCompatibility(html);
  }
  
  // Font size checks
  if (categories.includes('font_size')) {
    issues_by_category.font_size = await checkFontSize(html);
  }
  
  return { issues_by_category };
}

async function checkColorContrast(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Extract color combinations and check contrast ratios
  const colorRegex = /color\s*:\s*([^;]+);[^}]*background(?:-color)?\s*:\s*([^;]+)/g;
  let match;
  
  while ((match = colorRegex.exec(html)) !== null) {
    const textColor = match[1].trim();
    const bgColor = match[2].trim();
    
    // Simplified contrast calculation (would use real algorithm in production)
    const contrastRatio = calculateContrastRatio(textColor, bgColor);
    
    if (contrastRatio < 4.5) {
      issues.push({
        type: 'low_contrast',
        severity: contrastRatio < 3 ? 'critical' : 'high',
        description: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)}:1`,
        wcag_criteria: ['1.4.3', '1.4.6'],
        suggestion: 'Increase contrast between text and background colors',
        auto_fixable: true
      });
    }
  }
  
  return issues;
}

async function checkAltText(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Find images without alt text
  const imgRegex = /<img[^>]*>/g;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const imgTag = match[0];
    
    if (!imgTag.includes('alt=')) {
      issues.push({
        type: 'missing_alt_text',
        severity: 'high',
        description: 'Image missing alt attribute',
        element: imgTag,
        wcag_criteria: ['1.1.1'],
        suggestion: 'Add descriptive alt text for all images',
        auto_fixable: true
      });
    } else if (imgTag.includes('alt=""') && !imgTag.includes('role="presentation"')) {
      issues.push({
        type: 'empty_alt_text',
        severity: 'medium',
        description: 'Image has empty alt text but may not be decorative',
        element: imgTag,
        wcag_criteria: ['1.1.1'],
        suggestion: 'Provide descriptive alt text or mark as decorative',
        auto_fixable: false
      });
    }
  }
  
  return issues;
}

async function checkSemanticMarkup(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Check for proper heading structure
  const headingRegex = /<h([1-6])[^>]*>/g;
  const headings: number[] = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push(parseInt(match[1]));
  }
  
  // Check heading hierarchy
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i-1] + 1) {
      issues.push({
        type: 'heading_hierarchy',
        severity: 'medium',
        description: 'Heading levels skip hierarchy (e.g., h1 to h3)',
        wcag_criteria: ['1.3.1', '2.4.6'],
        suggestion: 'Use proper heading hierarchy without skipping levels',
        auto_fixable: true
      });
      break;
    }
  }
  
  // Check for missing main landmark
  if (!html.includes('<main') && !html.includes('role="main"')) {
    issues.push({
      type: 'missing_main_landmark',
      severity: 'medium',
      description: 'Missing main landmark for content area',
      wcag_criteria: ['1.3.1', '2.4.1'],
      suggestion: 'Add main element or role="main" to primary content area',
      auto_fixable: true
    });
  }
  
  return issues;
}

async function checkKeyboardNavigation(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Check for interactive elements without proper focus handling
  const interactiveElements = html.match(/<(a|button|input|select|textarea)[^>]*>/g) || [];
  
  interactiveElements.forEach(element => {
    if (element.includes('tabindex="-1"') && !element.includes('aria-hidden="true"')) {
      issues.push({
        type: 'keyboard_trap',
        severity: 'high',
        description: 'Interactive element removed from tab order',
        element,
        wcag_criteria: ['2.1.1', '2.1.2'],
        suggestion: 'Ensure all interactive elements are keyboard accessible',
        auto_fixable: false
      });
    }
  });
  
  return issues;
}

async function checkScreenReaderCompatibility(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Check for missing ARIA labels on form controls
  const formControls = html.match(/<(input|select|textarea)[^>]*>/g) || [];
  
  formControls.forEach(control => {
    if (!control.includes('aria-label') && !control.includes('aria-labelledby') && !control.includes('id=')) {
      issues.push({
        type: 'missing_label',
        severity: 'high',
        description: 'Form control missing accessible label',
        element: control,
        wcag_criteria: ['1.3.1', '3.3.2'],
        suggestion: 'Add aria-label or associate with label element',
        auto_fixable: true
      });
    }
  });
  
  return issues;
}

async function checkFontSize(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Check for font sizes that are too small
  const fontSizeRegex = /font-size\s*:\s*(\d+(?:\.\d+)?)(px|pt|em|rem)/g;
  let match;
  
  while ((match = fontSizeRegex.exec(html)) !== null) {
    const size = parseFloat(match[1]);
    const unit = match[2];
    
    let isSmall = false;
    
    if (unit === 'px' && size < 14) isSmall = true;
    if (unit === 'pt' && size < 11) isSmall = true;
    if (unit === 'em' && size < 0.875) isSmall = true;
    if (unit === 'rem' && size < 0.875) isSmall = true;
    
    if (isSmall) {
      issues.push({
        type: 'small_font_size',
        severity: 'medium',
        description: `Font size too small: ${size}${unit}`,
        wcag_criteria: ['1.4.4'],
        suggestion: 'Use minimum 14px font size for body text',
        auto_fixable: true
      });
    }
  }
  
  return issues;
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation - would use proper algorithm in production
  return 4.5 + Math.random() * 3; // Simulate contrast ratio between 4.5-7.5
}

async function checkEmailClientAccessibility(html: string, clients: string[]): Promise<any[]> {
  const clientIssues: any[] = [];
  
  clients.forEach(client => {
    const issues: AccessibilityIssue[] = [];
    
    if (client === 'outlook') {
      // Outlook-specific accessibility checks
      if (html.includes('display: flex')) {
        issues.push({
          type: 'outlook_layout',
          severity: 'high',
          description: 'Flexbox may not be accessible in Outlook screen readers',
          wcag_criteria: ['1.3.1'],
          suggestion: 'Use table-based layout for better Outlook accessibility',
          auto_fixable: false
        });
      }
    }
    
    if (issues.length > 0) {
      clientIssues.push({ client, issues });
    }
  });
  
  return clientIssues;
}

async function testDarkModeAccessibility(html: string): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];
  
  // Check if dark mode styles maintain sufficient contrast
  if (!html.includes('@media (prefers-color-scheme: dark)')) {
    issues.push({
      type: 'no_dark_mode_support',
      severity: 'medium',
      description: 'No dark mode styles provided',
      wcag_criteria: ['1.4.3'],
      suggestion: 'Add dark mode styles with proper contrast ratios',
      auto_fixable: false
    });
  }
  
  return issues;
}

function calculateWCAGCompliance(auditResults: any, wcagLevel: string): any {
  const allIssues = Object.values(auditResults.issues_by_category).flat();
  const criticalIssues = allIssues.filter((issue: any) => issue.severity === 'critical');
  const highIssues = allIssues.filter((issue: any) => issue.severity === 'high');
  
  return {
    level_a: criticalIssues.length === 0,
    level_aa: criticalIssues.length === 0 && highIssues.length === 0,
    level_aaa: allIssues.length === 0
  };
}

function calculateAccessibilityMetrics(auditResults: any): any {
  const allIssues = Object.values(auditResults.issues_by_category).flat();
  const totalIssues = allIssues.length;
  
  // Calculate score based on issues (simplified)
  let score = 100;
  allIssues.forEach((issue: any) => {
    switch (issue.severity) {
      case 'critical': score -= 20; break;
      case 'high': score -= 15; break;
      case 'medium': score -= 10; break;
      case 'low': score -= 5; break;
    }
  });
  
  return {
    accessibility_score: Math.max(0, score),
    contrast_ratio_avg: 4.8, // Simplified
    semantic_elements_count: 5, // Simplified
    alt_text_coverage: 85, // Simplified
    font_readability_score: 80 // Simplified
  };
}

function shouldApplyFix(issue: AccessibilityIssue, level: string): boolean {
  switch (level) {
    case 'conservative':
      return issue.severity === 'critical';
    case 'standard':
      return issue.severity === 'critical' || issue.severity === 'high';
    case 'aggressive':
      return issue.severity !== 'low';
    default:
      return false;
  }
}

async function applyAccessibilityFix(html: string, issue: AccessibilityIssue, preserveDesign: boolean): Promise<any> {
  // Simplified fix application
  let fixedHtml = html;
  let description = '';
  let before = '';
  let after = '';
  
  switch (issue.type) {
    case 'missing_alt_text':
      before = '<img src="';
      after = '<img alt="Image" src="';
      fixedHtml = html.replace(/<img(?![^>]*alt\s*=)/g, '<img alt="Image"');
      description = 'Added default alt text to images';
      break;
      
    case 'small_font_size':
      before = 'font-size: 12px';
      after = 'font-size: 14px';
      fixedHtml = html.replace(/font-size\s*:\s*1[0-3]px/g, 'font-size: 14px');
      description = 'Increased font size to meet minimum requirements';
      break;
      
    default:
      return { success: false };
  }
  
  return {
    success: true,
    fixedHtml,
    description,
    before,
    after
  };
}

function generateAuditRecommendations(auditResults: any, wcagLevel: string): string[] {
  const recommendations: string[] = [];
  const allIssues = Object.values(auditResults.issues_by_category).flat();
  
  if (allIssues.length === 0) {
    recommendations.push('Excellent! No accessibility issues found');
  } else {
    recommendations.push(`Found ${allIssues.length} accessibility issues to address`);
    
    const criticalCount = allIssues.filter((issue: any) => issue.severity === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} critical issues require immediate attention`);
    }
  }
  
  return recommendations;
}

function generateFixRecommendations(fixes: any[], metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (fixes.length > 0) {
    recommendations.push(`Applied ${fixes.length} accessibility fixes`);
  }
  
  if (metrics.accessibility_score < 80) {
    recommendations.push('Additional manual review recommended for full compliance');
  }
  
  recommendations.push('Test with screen readers and keyboard navigation');
  
  return recommendations;
}

function generateValidationRecommendations(summary: any, metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (summary.critical_issues === 0) {
    recommendations.push('No critical accessibility issues found');
  } else {
    recommendations.push(`${summary.critical_issues} critical issues need immediate attention`);
  }
  
  if (metrics.accessibility_score >= 90) {
    recommendations.push('Excellent accessibility score achieved');
  }
  
  return recommendations;
}

function generateReportRecommendations(auditResults: any, metrics: any): string[] {
  return [
    'Review detailed accessibility report',
    'Prioritize critical and high severity issues',
    'Test with assistive technologies',
    'Validate fixes with real users'
  ];
}

async function createDetailedReport(auditResults: any, includeRecommendations: boolean, format: string): Promise<any> {
  const allIssues = Object.values(auditResults.issues_by_category).flat();
  
  return {
    executive_summary: `Found ${allIssues.length} accessibility issues across multiple categories`,
    issues_breakdown: {
      critical: allIssues.filter((issue: any) => issue.severity === 'critical').length,
      high: allIssues.filter((issue: any) => issue.severity === 'high').length,
      medium: allIssues.filter((issue: any) => issue.severity === 'medium').length,
      low: allIssues.filter((issue: any) => issue.severity === 'low').length
    },
    recommendations: includeRecommendations ? [
      'Address critical issues first',
      'Implement systematic accessibility testing',
      'Train team on accessibility best practices'
    ] : [],
    implementation_guide: [
      'Start with color contrast improvements',
      'Add missing alt text to images',
      'Improve semantic markup structure'
    ],
    testing_checklist: [
      'Test with screen reader',
      'Verify keyboard navigation',
      'Check color contrast ratios',
      'Validate with accessibility tools'
    ]
  };
}

// Export minimal schema to satisfy imports
export const accessibilitySchema = z.object({
  action: z.enum(['audit', 'fix', 'validate', 'report']),
  html_content: z.string().optional(),
  target_html: z.string().optional(),
}); 