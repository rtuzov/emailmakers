/**
 * 🔧 AUTO FIX - Simple Tool
 * 
 * Простое автоматическое исправление email проблем
 * Заменяет часть функциональности quality-controller
 */

import { z } from 'zod';
import { patchHtml } from '../patch';

export const autoFixSchema = z.object({
  html_content: z.string().describe('HTML content to fix'),
  issues_to_fix: z.array(z.object({
    issue_type: z.enum(['missing_doctype', 'missing_alt_text', 'inline_styles', 'email_width', 'table_layout', 'outlook_compatibility', 'gmail_optimization', 'mobile_responsive', 'accessibility']).describe('Type of issue to fix'),
    severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Issue severity'),
    description: z.string().describe('Description of the issue'),
    auto_fixable: z.boolean().describe('Whether this issue can be auto-fixed')
  })).describe('List of issues to automatically fix'),
  fix_preferences: z.object({
    aggressive_fixes: z.boolean().describe('Apply aggressive fixes that might change layout'),
    preserve_styling: z.boolean().describe('Try to preserve existing styling'),
    optimize_for_client: z.enum(['outlook', 'gmail', 'apple_mail', 'universal']).describe('Optimize specifically for email client'),
    backup_original: z.boolean().describe('Keep reference to original content')
  }).optional().nullable().describe('Preferences for fix application'),
  validation_after_fix: z.boolean().describe('Validate HTML after applying fixes')
});

export type AutoFixParams = z.infer<typeof autoFixSchema>;

export interface AutoFixResult {
  success: boolean;
  fix_results: {
    original_html: string;
    fixed_html: string;
    fixes_applied: Array<{
      issue_type: string;
      fix_action: string;
      before_snippet: string;
      after_snippet: string;
      success: boolean;
      impact: 'minor' | 'moderate' | 'significant';
    }>;
    fixes_skipped: Array<{
      issue_type: string;
      reason: string;
      manual_action_required: string;
    }>;
    improvement_summary: {
      issues_fixed: number;
      issues_remaining: number;
      overall_improvement: number;
      client_compatibility_gain: number;
    };
  };
  fix_metadata: {
    fix_duration: number;
    html_size_change: {
      before_kb: number;
      after_kb: number;
      size_change_percent: number;
    };
    validation_results?: {
      valid: boolean;
      new_issues: string[];
      warnings: string[];
    };
    recommendations: string[];
  };
  error?: string;
}

export async function autoFix(params: AutoFixParams): Promise<AutoFixResult> {
  const startTime = Date.now();
  const originalSize = params.html_content.length;
  
  try {
    // Validate required parameters - fail if missing
    if (!params.validation_after_fix && params.validation_after_fix !== false) {
      throw new Error('validation_after_fix parameter is required');
    }
    
    console.log('🔧 Starting auto-fix process:', {
      issues_count: params.issues_to_fix.length,
      fixable_issues: params.issues_to_fix.filter(i => i.auto_fixable).length,
      optimize_for: params.fix_preferences?.optimize_for_client
    });

    let currentHtml = params.html_content;
    const fixesApplied: any[] = [];
    const fixesSkipped: any[] = [];
    let backupHtml = params.fix_preferences?.backup_original ? params.html_content : '';

    // Process each fixable issue
    for (const issue of params.issues_to_fix) {
      if (!issue.auto_fixable) {
        fixesSkipped.push({
          issue_type: issue.issue_type,
          reason: 'Issue marked as not auto-fixable',
          manual_action_required: getManualActionForIssue(issue.issue_type)
        });
        continue;
      }

      console.log(`🔧 Applying fix for: ${issue.issue_type}`);
      
      const fixResult = await applySingleFix(
        currentHtml, 
        issue, 
        params.fix_preferences
      );

      if (fixResult.success) {
        fixesApplied.push({
          issue_type: issue.issue_type,
          fix_action: fixResult.fix_action,
          before_snippet: fixResult.before_snippet,
          after_snippet: fixResult.after_snippet,
          success: true,
          impact: fixResult.impact
        });
        currentHtml = fixResult.fixed_html;
      } else {
        fixesSkipped.push({
          issue_type: issue.issue_type,
          reason: fixResult.error || 'Fix failed',
          manual_action_required: getManualActionForIssue(issue.issue_type)
        });
      }
    }

    // Calculate improvement metrics
    const improvementSummary = calculateImprovementSummary(
      params.issues_to_fix,
      fixesApplied,
      fixesSkipped
    );

    // Validate fixed HTML if requested
    let validationResults = undefined;
    if (params.validation_after_fix) {
      validationResults = await validateFixedHtml(currentHtml);
    }

    const fixDuration = Date.now() - startTime;
    const finalSize = currentHtml.length;
    const sizeChangePercent = originalSize > 0 ? ((finalSize - originalSize) / originalSize) * 100 : 0;

    // Generate recommendations
    const recommendations = generateFixRecommendations(
      fixesApplied, 
      fixesSkipped, 
      validationResults
    );

    return {
      success: true,
      fix_results: {
        original_html: backupHtml,
        fixed_html: currentHtml,
        fixes_applied: fixesApplied,
        fixes_skipped: fixesSkipped,
        improvement_summary: improvementSummary
      },
      fix_metadata: {
        fix_duration: fixDuration,
        html_size_change: {
          before_kb: Math.round(originalSize / 1024 * 100) / 100,
          after_kb: Math.round(finalSize / 1024 * 100) / 100,
          size_change_percent: Math.round(sizeChangePercent * 100) / 100
        },
        validation_results: validationResults,
        recommendations: recommendations
      }
    };

  } catch (error) {
    const fixDuration = Date.now() - startTime;
    console.error('❌ Auto-fix process failed:', error);

    return {
      success: false,
      fix_results: {
        original_html: params.html_content,
        fixed_html: params.html_content,
        fixes_applied: [],
        fixes_skipped: params.issues_to_fix.map(issue => ({
          issue_type: issue.issue_type,
          reason: 'Auto-fix process failed',
          manual_action_required: 'Manual review and fixing required'
        })),
        improvement_summary: {
          issues_fixed: 0,
          issues_remaining: params.issues_to_fix.length,
          overall_improvement: 0,
          client_compatibility_gain: 0
        }
      },
      fix_metadata: {
        fix_duration: fixDuration,
        html_size_change: {
          before_kb: Math.round(originalSize / 1024 * 100) / 100,
          after_kb: Math.round(originalSize / 1024 * 100) / 100,
          size_change_percent: 0
        },
        recommendations: ['Review auto-fix configuration', 'Check error logs', 'Consider manual fixes']
      },
      error: error instanceof Error ? error.message : 'Unknown auto-fix error'
    };
  }
}

async function applySingleFix(
  html: string, 
  issue: any, 
  preferences: any
): Promise<any> {
  
  try {
    let fixedHtml = html;
    let fixAction = '';
    let beforeSnippet = '';
    let afterSnippet = '';
    let impact: 'minor' | 'moderate' | 'significant' = 'minor';

    switch (issue.issue_type) {
      case 'missing_doctype':
        if (!html.toLowerCase().includes('<!doctype')) {
          beforeSnippet = html.substring(0, 50);
          fixedHtml = '<!DOCTYPE html>\n' + html;
          afterSnippet = fixedHtml.substring(0, 50);
          fixAction = 'Added DOCTYPE html declaration';
          impact = 'moderate';
        }
        break;

      case 'missing_alt_text':
        const imgRegex = /<img([^>]*?)(?:\s+alt\s*=\s*["'][^"']*["'])?([^>]*?)>/gi;
        fixedHtml = html.replace(imgRegex, (match, before, after) => {
          if (!match.includes('alt=')) {
            beforeSnippet = match.substring(0, 50);
            const fixed = `<img${before} alt="Image"${after}>`;
            afterSnippet = fixed.substring(0, 50);
            fixAction = 'Added alt text to images';
            impact = 'minor';
            return fixed;
          }
          return match;
        });
        break;

      case 'email_width':
        if (!html.includes('width="600"') && !html.includes('width="640"')) {
          const tableRegex = /<table([^>]*)>/gi;
          fixedHtml = html.replace(tableRegex, (match, attributes) => {
            if (!attributes.includes('width=')) {
              beforeSnippet = match.substring(0, 50);
              const fixed = `<table${attributes} width="600">`;
              afterSnippet = fixed.substring(0, 50);
              fixAction = 'Set email width to 600px';
              impact = 'moderate';
              return fixed;
            }
            return match;
          });
        }
        break;

      case 'outlook_compatibility':
        // Add Outlook-specific fixes
        if (html.includes('display:flex') || html.includes('flexbox')) {
          beforeSnippet = 'flexbox/flex layout detected';
          fixedHtml = html.replace(/display\s*:\s*flex/gi, 'display:table-cell');
          afterSnippet = 'converted to table-cell';
          fixAction = 'Converted flexbox to table layout for Outlook';
          impact = 'significant';
        }
        break;

      case 'gmail_optimization':
        // Optimize for Gmail
        if (html.length > 102000) {
          beforeSnippet = `Size: ${Math.round(html.length/1024)}KB`;
          // This is complex - would need content compression
          fixAction = 'Gmail size optimization attempted';
          afterSnippet = 'Size optimization needed';
          impact = 'significant';
        }
        break;

      case 'inline_styles':
        // Convert style tags to inline styles (simplified)
        const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let styles = '';
        fixedHtml = html.replace(styleTagRegex, (match, content) => {
          styles += content;
          beforeSnippet = match.substring(0, 50);
          fixAction = 'Extracted styles for inlining';
          afterSnippet = '/* styles extracted */';
          impact = 'moderate';
          return '<!-- styles extracted -->';
        });
        break;

      case 'mobile_responsive':
        if (!html.includes('viewport') && !html.includes('@media')) {
          const headMatch = html.match(/<head[^>]*>/i);
          if (headMatch) {
            beforeSnippet = headMatch[0];
            const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
            fixedHtml = html.replace(/<head([^>]*)>/i, `<head$1>\n${viewport}`);
            afterSnippet = `<head$1>\n${viewport}`;
            fixAction = 'Added viewport meta tag for mobile';
            impact = 'moderate';
          }
        }
        break;

      case 'accessibility':
        // Basic accessibility improvements
        if (!html.includes('role=') || !html.includes('aria-')) {
          const mainTableRegex = /<table([^>]*?)>/i;
          fixedHtml = html.replace(mainTableRegex, (match, attributes) => {
            if (!attributes.includes('role=')) {
              beforeSnippet = match;
              const fixed = `<table${attributes} role="presentation">`;
              afterSnippet = fixed;
              fixAction = 'Added accessibility roles';
              impact = 'minor';
              return fixed;
            }
            return match;
          });
        }
        break;

      default:
        throw new Error(`Unknown issue type: ${issue.issue_type}`);
    }

    // Use patch tool for complex fixes if needed
    if (issue.severity === 'critical' && fixedHtml === html) {
      try {
        const patchResult = await patchHtml({
          html: html,
          issues: [issue.description],
          patch_type: 'email_optimization'
        });
        
        if (patchResult.success && patchResult.data) {
          fixedHtml = patchResult.data.patched_html;
          fixAction = 'Applied patch fix';
          impact = 'moderate';
        }
      } catch (patchError) {
        console.warn('Patch tool failed, continuing with basic fix');
      }
    }

    return {
      success: fixedHtml !== html,
      fixed_html: fixedHtml,
      fix_action: fixAction,
      before_snippet: beforeSnippet.substring(0, 100),
      after_snippet: afterSnippet.substring(0, 100),
      impact: impact
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fix application failed'
    };
  }
}

function getManualActionForIssue(issueType: string): string {
  const manualActions: Record<string, string> = {
    'missing_doctype': 'Add "<!DOCTYPE html>" at the beginning of the document',
    'missing_alt_text': 'Add descriptive alt text to all images',
    'inline_styles': 'Convert CSS styles to inline styles for better email client support',
    'email_width': 'Set main table width to 600-640px',
    'table_layout': 'Convert div-based layout to table-based layout',
    'outlook_compatibility': 'Remove flexbox, CSS Grid, and use table layouts',
    'gmail_optimization': 'Reduce email size below 102KB and use inline styles',
    'mobile_responsive': 'Add viewport meta tag and responsive CSS',
    'accessibility': 'Add ARIA labels, roles, and improve semantic markup'
  };

  return manualActions[issueType] || 'Review and fix manually according to best practices';
}

function calculateImprovementSummary(
  originalIssues: any[], 
  fixesApplied: any[], 
  fixesSkipped: any[]
): any {
  const issuesFixed = fixesApplied.length;
  const issuesRemaining = fixesSkipped.length;
  const totalIssues = originalIssues.length;
  
  const overallImprovement = totalIssues > 0 ? Math.round((issuesFixed / totalIssues) * 100) : 0;
  
  // Calculate client compatibility gain based on fix types
  let compatibilityGain = 0;
  fixesApplied.forEach(fix => {
    const gainMap: Record<string, number> = {
      'missing_doctype': 15,
      'email_width': 10,
      'outlook_compatibility': 25,
      'gmail_optimization': 20,
      'mobile_responsive': 15,
      'inline_styles': 10,
      'accessibility': 5,
      'missing_alt_text': 5
    };
    compatibilityGain += gainMap[fix.issue_type] || 5;
  });

  return {
    issues_fixed: issuesFixed,
    issues_remaining: issuesRemaining,
    overall_improvement: overallImprovement,
    client_compatibility_gain: Math.min(100, compatibilityGain)
  };
}

async function validateFixedHtml(html: string): Promise<any> {
  try {
    // Basic post-fix validation
    const newIssues: string[] = [];
    const warnings: string[] = [];

    // Check if basic structure is still intact
    if (!html.includes('<html') && !html.includes('<body')) {
      newIssues.push('HTML structure may have been corrupted');
    }

    // Check for broken tags
    const openTags = (html.match(/<[^/][^>]*[^/]>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (html.match(/<[^>]*\/>/g) || []).length;
    
    if (Math.abs(openTags - closeTags - selfClosingTags) > 2) {
      warnings.push('Potential tag mismatch detected');
    }

    // Check if content is still present
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 50) {
      newIssues.push('Content may have been lost during fixes');
    }

    return {
      valid: newIssues.length === 0,
      new_issues: newIssues,
      warnings: warnings
    };

  } catch (error) {
    return {
      valid: false,
      new_issues: ['Validation failed'],
      warnings: ['Could not validate fixed HTML']
    };
  }
}

function generateFixRecommendations(
  fixesApplied: any[], 
  fixesSkipped: any[], 
  validationResults?: any
): string[] {
  const recommendations: string[] = [];

  if (fixesApplied.length > 0) {
    recommendations.push(`Successfully applied ${fixesApplied.length} automatic fixes`);
    
    const significantFixes = fixesApplied.filter(fix => fix.impact === 'significant');
    if (significantFixes.length > 0) {
      recommendations.push('Significant layout changes made - review visual appearance');
    }
  }

  if (fixesSkipped.length > 0) {
    recommendations.push(`${fixesSkipped.length} issues require manual attention`);
    
    const criticalSkipped = fixesSkipped.filter(fix => 
      fix.issue_type.includes('outlook') || fix.issue_type.includes('gmail')
    );
    if (criticalSkipped.length > 0) {
      recommendations.push('Critical email client compatibility issues need manual fixing');
    }
  }

  if (validationResults?.new_issues?.length > 0) {
    recommendations.push('New issues detected after fixes - review carefully');
  }

  if (validationResults?.warnings?.length > 0) {
    recommendations.push('Validation warnings found - consider additional testing');
  }

  // Specific recommendations based on fix types
  const outlookFixes = fixesApplied.filter(fix => fix.issue_type.includes('outlook'));
  if (outlookFixes.length > 0) {
    recommendations.push('Test thoroughly in Outlook after layout changes');
  }

  const mobileFixes = fixesApplied.filter(fix => fix.issue_type.includes('mobile'));
  if (mobileFixes.length > 0) {
    recommendations.push('Test mobile rendering after responsive fixes');
  }

  if (recommendations.length === 0) {
    recommendations.push('No fixes were needed - email appears to be well-formed');
  } else {
    recommendations.push('Run email testing to verify fixes work correctly');
  }

  return recommendations;
}