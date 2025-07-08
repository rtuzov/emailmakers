/**
 * 🔧 AUTO-FIX TOOL
 * 
 * Инструмент для автоматического исправления проблем в email шаблонах
 * Исправляет распространенные ошибки и улучшает совместимость
 */


import { z } from 'zod';
import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';

export interface AutoFixParams {
  html_content: string;
  issues?: Array<{
    type: 'validation' | 'compatibility' | 'performance' | 'accessibility';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: {
      line?: number;
      column?: number;
      element?: string;
    };
  }>;
  fix_options?: {
    auto_fix_critical?: boolean;
    auto_fix_high?: boolean;
    auto_fix_medium?: boolean;
    preserve_formatting?: boolean;
    add_fallbacks?: boolean;
  };
}

export interface AutoFixResult {
  success: boolean;
  fixed_content: string;
  fixes_applied: Array<{
    issue_type: string;
    fix_description: string;
    original_code?: string;
    fixed_code?: string;
    impact: 'low' | 'medium' | 'high';
    location?: {
      line?: number;
      element?: string;
    };
  }>;
  remaining_issues: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
  }>;
  fix_summary: {
    total_issues_found: number;
    issues_fixed: number;
    issues_remaining: number;
    compatibility_improved: boolean;
    performance_improved: boolean;
  };
  error?: string;
}

export async function autoFix(params: AutoFixParams): Promise<AutoFixResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'auto_fix',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`🔧 Auto-Fix: Starting automatic fixes for email template`);

    try {
      // Validate input
      if (!params.html_content || params.html_content.trim().length === 0) {
        const errorResult: AutoFixResult = {
          success: false,
          fixed_content: '',
          fixes_applied: [],
          remaining_issues: [{
            type: 'validation',
            description: 'No HTML content provided',
            severity: 'critical',
            recommendation: 'Provide valid HTML content for auto-fixing'
          }],
          fix_summary: {
            total_issues_found: 1,
            issues_fixed: 0,
            issues_remaining: 1,
            compatibility_improved: false,
            performance_improved: false
          },
          error: 'No HTML content provided for auto-fixing'
        };

        console.log(`❌ Auto-Fix failed: No HTML content provided`);
        return errorResult;
      }

      // Default fix options
      const fixOptions = {
        auto_fix_critical: true,
        auto_fix_high: true,
        auto_fix_medium: params.fix_options?.auto_fix_medium !== false,
        preserve_formatting: params.fix_options?.preserve_formatting !== false,
        add_fallbacks: params.fix_options?.add_fallbacks !== false,
        ...params.fix_options
      };

      let fixedContent = params.html_content;
      const fixesApplied: AutoFixResult['fixes_applied'] = [];
      const remainingIssues: AutoFixResult['remaining_issues'] = [];

      // Detect issues if not provided
      const issues = params.issues || await detectIssues(params.html_content);
      
      console.log(`🔍 Found ${issues.length} issues to analyze`);

      // Apply fixes based on severity and options
      for (const issue of issues) {
        const shouldFix = shouldApplyFix(issue.severity, fixOptions);
        
        if (shouldFix) {
          const fixResult = applyFix(fixedContent, issue);
          if (fixResult.fixed_content !== fixedContent) {
            fixedContent = fixResult.fixed_content;
            fixesApplied.push({
              issue_type: issue.type,
              fix_description: fixResult.description,
              original_code: fixResult.originalCode,
              fixed_code: fixResult.fixedCode,
              impact: mapSeverityToImpact(issue.severity),
              location: issue.location
            });
            console.log(`✅ Fixed ${issue.type}: ${issue.description}`);
          } else {
            remainingIssues.push({
              type: issue.type,
              description: issue.description,
              severity: issue.severity,
              recommendation: fixResult.recommendation || 'Manual fix required'
            });
            console.log(`⚠️ Could not fix ${issue.type}: ${issue.description}`);
          }
        } else {
          remainingIssues.push({
            type: issue.type,
            description: issue.description,
            severity: issue.severity,
            recommendation: 'Fix disabled in options or requires manual intervention'
          });
        }
      }

      // Analyze improvements
      const compatibilityImproved = fixesApplied.some(fix => 
        fix.issue_type === 'compatibility' || fix.issue_type === 'validation'
      );
      
      const performanceImproved = fixesApplied.some(fix => 
        fix.issue_type === 'performance'
      );

      const result: AutoFixResult = {
        success: true,
        fixed_content: fixedContent,
        fixes_applied: fixesApplied,
        remaining_issues: remainingIssues,
        fix_summary: {
          total_issues_found: issues.length,
          issues_fixed: fixesApplied.length,
          issues_remaining: remainingIssues.length,
          compatibility_improved: compatibilityImproved,
          performance_improved: performanceImproved
        }
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Auto-Fix completed in ${duration}ms: ${fixesApplied.length} fixes applied, ${remainingIssues.length} issues remaining`);
      
      return result;

    } catch (error) {
      const errorResult: AutoFixResult = {
        success: false,
        fixed_content: params.html_content,
        fixes_applied: [],
        remaining_issues: [{
          type: 'system',
          description: 'Auto-fix process failed',
          severity: 'critical',
          recommendation: 'Check error logs and retry'
        }],
        fix_summary: {
          total_issues_found: 0,
          issues_fixed: 0,
          issues_remaining: 1,
          compatibility_improved: false,
          performance_improved: false
        },
        error: error instanceof Error ? error.message : 'Unknown error during auto-fixing'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ Auto-Fix failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
}

/**
 * Обнаружение проблем в HTML контенте
 */
async function detectIssues(htmlContent: string): Promise<AutoFixParams['issues']> {
  const issues: NonNullable<AutoFixParams['issues']> = [];

  // Check for missing DOCTYPE
  if (!htmlContent.includes('<!DOCTYPE')) {
    issues.push({
      type: 'validation',
      description: 'Missing DOCTYPE declaration',
      severity: 'high',
      location: { line: 1, element: 'document' }
    });
  }

  // Check for missing meta tags
  if (!htmlContent.includes('<meta charset')) {
    issues.push({
      type: 'validation',
      description: 'Missing charset meta tag',
      severity: 'medium',
      location: { element: 'head' }
    });
  }

  if (!htmlContent.includes('viewport')) {
    issues.push({
      type: 'compatibility',
      description: 'Missing viewport meta tag',
      severity: 'medium',
      location: { element: 'head' }
    });
  }

  // Check for images without alt text
  const imgMatches = htmlContent.match(/<img[^>]*>/g) || [];
  imgMatches.forEach((img, index) => {
    if (!img.includes('alt=')) {
      issues.push({
        type: 'accessibility',
        description: 'Image missing alt attribute',
        severity: 'medium',
        location: { element: `img[${index}]` }
      });
    }
  });

  // Check for inline styles vs external
  const inlineStyleCount = (htmlContent.match(/style\s*=/g) || []).length;
  if (inlineStyleCount > 50) {
    issues.push({
      type: 'performance',
      description: 'Excessive inline styles detected',
      severity: 'low',
      location: { element: 'document' }
    });
  }

  // Check for missing font fallbacks
  const fontFamilyMatches = htmlContent.match(/font-family\s*:\s*[^;]+/g) || [];
  fontFamilyMatches.forEach((fontDecl, index) => {
    if (!fontDecl.includes('Arial') && !fontDecl.includes('sans-serif')) {
      issues.push({
        type: 'compatibility',
        description: 'Font declaration missing fallback fonts',
        severity: 'low',
        location: { element: `font-declaration[${index}]` }
      });
    }
  });

  // Check for table-based layout
  if (!htmlContent.includes('<table') && htmlContent.includes('<div')) {
    issues.push({
      type: 'compatibility',
      description: 'Using div-based layout instead of table-based for email',
      severity: 'high',
      location: { element: 'layout' }
    });
  }

  return issues;
}

/**
 * Определение необходимости применения исправления
 */
function shouldApplyFix(severity: string, options: any): boolean {
  switch (severity) {
    case 'critical':
      return options.auto_fix_critical;
    case 'high':
      return options.auto_fix_high;
    case 'medium':
      return options.auto_fix_medium;
    case 'low':
      return false; // Low severity issues require manual review
    default:
      return false;
  }
}

/**
 * Применение конкретного исправления
 */
function applyFix(content: string, issue: NonNullable<AutoFixParams['issues']>[0]): {
  fixed_content: string;
  description: string;
  originalCode?: string;
  fixedCode?: string;
  recommendation?: string;
} {
  
  switch (issue.type) {
    case 'validation':
      return applyValidationFix(content, issue);
    case 'compatibility':
      return applyCompatibilityFix(content, issue);
    case 'performance':
      return applyPerformanceFix(content, issue);
    case 'accessibility':
      return applyAccessibilityFix(content, issue);
    default:
      return {
        
        fixed_content: content,
        description: 'Unknown issue type',
        recommendation: 'Manual review required'
      };
  }
}

/**
 * Исправления валидации
 */
function applyValidationFix(content: string, issue: any): ReturnType<typeof applyFix> {
  if (issue.description.includes('DOCTYPE')) {
    const doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n';
    const fixedContent = doctype + content;
    
    return {
      fixed_content: fixedContent,
      description: 'Added XHTML DOCTYPE declaration',
      originalCode: content.substring(0, 50) + '...',
      fixedCode: doctype + content.substring(0, 50) + '...'
    };
  }

  if (issue.description.includes('charset')) {
    const metaCharset = '<meta charset="UTF-8">';
    const fixedContent = content.replace(
      /<head>/i,
      `<head>\n  ${metaCharset}`
    );
    
    return {
      fixed_content: fixedContent,
      description: 'Added charset meta tag',
      originalCode: '<head>',
      fixedCode: `<head>\n  ${metaCharset}`
    };
  }

  return {
    
    fixed_content: content,
    description: 'Validation fix not implemented',
    recommendation: 'Manual validation fix required'
  };
}

/**
 * Исправления совместимости
 */
function applyCompatibilityFix(content: string, issue: any): ReturnType<typeof applyFix> {
  if (issue.description.includes('viewport')) {
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    const fixedContent = content.replace(
      /<head>/i,
      `<head>\n  ${viewportMeta}`
    );
    
    return {
      
      fixed_content: fixedContent,
      description: 'Added viewport meta tag',
      originalCode: '<head>',
      fixedCode: `<head>\n  ${viewportMeta}`
    };
  }

  if (issue.description.includes('fallback fonts')) {
    const fixedContent = content.replace(
      /font-family\s*:\s*([^;,]+)(?=[;,])/g,
      'font-family: $1, Arial, sans-serif'
    );
    
    return {
      
      fixed_content: fixedContent,
      description: 'Added fallback fonts to font-family declarations',
      originalCode: 'font-family: CustomFont',
      fixedCode: 'font-family: CustomFont, Arial, sans-serif'
    };
  }

  return {
    
    fixed_content: content,
    description: 'Compatibility fix not implemented',
    recommendation: 'Manual compatibility review required'
  };
}

/**
 * Исправления производительности
 */
function applyPerformanceFix(content: string, issue: any): ReturnType<typeof applyFix> {
  // Performance fixes are typically more complex and may require manual review
  return {
    
    fixed_content: content,
    description: 'Performance optimization requires manual review',
    recommendation: 'Consider moving inline styles to CSS classes or optimizing style usage'
  };
}

/**
 * Исправления доступности
 */
function applyAccessibilityFix(content: string, issue: any): ReturnType<typeof applyFix> {
  if (issue.description.includes('alt attribute')) {
    const fixedContent = content.replace(
      /<img([^>]*?)(?<!alt\s*=\s*"[^"]*")\s*>/g,
      '<img$1 alt="Image">'
    );
    
    return {
      
      fixed_content: fixedContent,
      description: 'Added default alt attributes to images',
      originalCode: '<img src="...">',
      fixedCode: '<img src="..." alt="Image">'
    };
  }

  return {
    
    fixed_content: content,
    description: 'Accessibility fix not implemented',
    recommendation: 'Manual accessibility review required'
  };
}

/**
 * Маппинг серьезности в воздействие
 */
function mapSeverityToImpact(severity: string): 'low' | 'medium' | 'high' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    default:
      return 'low';
  }
}

// Minimal schema export
export const autoFixSchema = z.object({
  html_content: z.string(),
});