/**
 * ✅ HTML VALIDATE - Simple Tool
 * 
 * Простая валидация HTML для email совместимости
 * Заменяет часть функциональности quality-controller
 */

import { z } from 'zod';
import { aiQualityConsultant } from '../ai-quality-consultant';

export const htmlValidateSchema = z.object({
  html_content: z.string().describe('HTML content to validate'),
  validation_options: z.object({
    validation_level: z.enum(['basic', 'standard', 'strict']).describe('Validation strictness level'),
    specific_checks: z.object({
      check_doctype: z.boolean().optional().nullable(),
      check_table_layout: z.boolean().optional().nullable(),
      check_inline_styles: z.boolean().optional().nullable(),
      check_image_alt: z.boolean().optional().nullable(),
      check_email_width: z.boolean().optional().nullable()
    }).optional().nullable(),
    target_clients: z.array(z.enum(['gmail', 'outlook', 'apple_mail', 'yahoo', 'thunderbird'])).describe('Target email clients for validation')
  }).describe('Validation configuration options')
});

export type HtmlValidateParams = z.infer<typeof htmlValidateSchema>;

export interface HtmlValidateResult {
  success: boolean;
  validation_results: {
    overall_status: 'pass' | 'warning' | 'fail';
    issues_found: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      category: 'structure' | 'compatibility' | 'accessibility' | 'performance';
      description: string;
      line_number?: number;
      suggestion: string;
      auto_fixable: boolean;
    }>;
    email_standards_check: {
      doctype_valid: boolean;
      table_based_layout: boolean;
      inline_styles_ratio: number;
      image_alt_coverage: number;
      width_compliance: boolean;
    };
    client_compatibility: Record<string, {
      compatible: boolean;
      issues: string[];
      confidence: number;
    }>;
  };
  validation_metadata: {
    validation_time: number;
    html_size_kb: number;
    total_issues: number;
    critical_issues: number;
    recommendations: string[];
  };
  error?: string;
}

export async function htmlValidate(params: HtmlValidateParams): Promise<HtmlValidateResult> {
  const startTime = Date.now();
  
  try {
    console.log('✅ Validating HTML content:', {
      html_size: params.html_content.length,
      validation_level: params.validation_options.validation_level,
      target_clients: params.validation_options.target_clients
    });

    // Basic HTML structure validation
    const structureValidation = validateHtmlStructure(params.html_content);
    
    // Email standards validation
    const emailStandardsValidation = validateEmailStandards(params.html_content, params.validation_options.specific_checks);
    
    // Client compatibility check
    const clientCompatibility = checkClientCompatibility(params.html_content, params.validation_options.target_clients);
    
    // Use AI quality consultant for advanced validation if needed
    let aiValidation = null;
    if (params.validation_options.validation_level === 'strict') {
      try {
        aiValidation = await aiQualityConsultant({
          html_content: params.html_content,
          topic: 'HTML Validation Analysis',
          campaign_type: 'informational',
          assets_used: {
            original_assets: [],
            processed_assets: [],
            sprite_metadata: null
          }
        });
      } catch (error) {
        console.warn('AI validation failed, continuing with basic validation');
      }
    }

    // Combine all validation results
    const allIssues = [
      ...structureValidation.issues,
      ...emailStandardsValidation.issues,
      ...clientCompatibility.issues
    ];

    // Add AI validation issues if available
    if (aiValidation?.success && aiValidation.analysis?.issues_found) {
      allIssues.push(...aiValidation.analysis.issues_found.map((issue: any) => ({
        severity: issue.severity,
        category: issue.category,
        description: issue.description,
        suggestion: issue.fix_suggestion || 'Review and fix manually',
        auto_fixable: issue.auto_fixable || false
      })));
    }

    // Determine overall status
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
    const highIssues = allIssues.filter(issue => issue.severity === 'high');
    
    let overallStatus: 'pass' | 'warning' | 'fail' = 'pass';
    if (criticalIssues.length > 0) {
      overallStatus = 'fail';
    } else if (highIssues.length > 0) {
      overallStatus = 'warning';
    }

    const validationTime = Date.now() - startTime;
    const htmlSizeKb = Math.round(params.html_content.length / 1024);

    return {
      success: true,
      validation_results: {
        overall_status: overallStatus,
        issues_found: allIssues,
        email_standards_check: emailStandardsValidation.standards,
        client_compatibility: clientCompatibility.compatibility
      },
      validation_metadata: {
        validation_time: validationTime,
        html_size_kb: htmlSizeKb,
        total_issues: allIssues.length,
        critical_issues: criticalIssues.length,
        recommendations: generateValidationRecommendations(allIssues, htmlSizeKb)
      }
    };

  } catch (error) {
    const validationTime = Date.now() - startTime;
    console.error('❌ HTML validation failed:', error);

    return {
      success: false,
      validation_results: {
        overall_status: 'fail',
        issues_found: [],
        email_standards_check: {
          doctype_valid: false,
          table_based_layout: false,
          inline_styles_ratio: 0,
          image_alt_coverage: 0,
          width_compliance: false
        },
        client_compatibility: {}
      },
      validation_metadata: {
        validation_time: validationTime,
        html_size_kb: 0,
        total_issues: 0,
        critical_issues: 0,
        recommendations: ['Check validation parameters', 'Verify HTML content']
      },
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

function validateHtmlStructure(html: string): { issues: any[] } {
  const issues: any[] = [];
  
  // Basic HTML structure checks
  if (!html.includes('<html')) {
    issues.push({
      severity: 'high',
      category: 'structure',
      description: 'Missing HTML tag',
      suggestion: 'Add proper HTML document structure',
      auto_fixable: true
    });
  }

  if (!html.includes('<head>')) {
    issues.push({
      severity: 'medium',
      category: 'structure',
      description: 'Missing HEAD section',
      suggestion: 'Add HEAD section with meta tags',
      auto_fixable: true
    });
  }

  if (!html.includes('<body>')) {
    issues.push({
      severity: 'high',
      category: 'structure',
      description: 'Missing BODY tag',
      suggestion: 'Wrap content in BODY tag',
      auto_fixable: true
    });
  }

  // Check for common email-breaking elements
  const problematicElements = ['<script', '<style>', '<link', 'position:', 'z-index:', 'float:'];
  problematicElements.forEach(element => {
    if (html.toLowerCase().includes(element.toLowerCase())) {
      issues.push({
        severity: element.includes('script') ? 'critical' : 'high',
        category: 'compatibility',
        description: `Potentially problematic element: ${element}`,
        suggestion: `Remove or replace ${element} with email-safe alternatives`,
        auto_fixable: false
      });
    }
  });

  return { issues };
}

function validateEmailStandards(html: string, standards?: any): { issues: any[]; standards: any } {
  const issues: any[] = [];
  const lowerHtml = html.toLowerCase();
  
  // DOCTYPE check
  const doctypeValid = lowerHtml.includes('<!doctype html');
  if (!doctypeValid && standards?.check_doctype !== false) {
    issues.push({
      severity: 'high',
      category: 'structure',
      description: 'Missing or incorrect DOCTYPE',
      suggestion: 'Add DOCTYPE html for better email client compatibility',
      auto_fixable: true
    });
  }

  // Table-based layout check
  const hasTable = lowerHtml.includes('<table');
  const tableBasedLayout = hasTable;
  if (!tableBasedLayout && standards?.check_table_layout !== false) {
    issues.push({
      severity: 'medium',
      category: 'compatibility',
      description: 'No table-based layout detected',
      suggestion: 'Consider using tables for better email client support',
      auto_fixable: false
    });
  }

  // Inline styles ratio
  const styleMatches = html.match(/style\s*=/gi) || [];
  const elementMatches = html.match(/<[^>]+>/g) || [];
  const inlineStylesRatio = elementMatches.length > 0 ? styleMatches.length / elementMatches.length : 0;
  
  if (inlineStylesRatio < 0.5 && standards?.check_inline_styles !== false) {
    issues.push({
      severity: 'medium',
      category: 'compatibility',
      description: 'Low inline styles usage',
      suggestion: 'Use more inline styles for better email client compatibility',
      auto_fixable: false
    });
  }

  // Image alt text coverage
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const altMatches = html.match(/<img[^>]*alt\s*=/gi) || [];
  const imageAltCoverage = imgMatches.length > 0 ? altMatches.length / imgMatches.length : 1;
  
  if (imageAltCoverage < 1 && standards?.check_image_alt !== false) {
    issues.push({
      severity: 'medium',
      category: 'accessibility',
      description: 'Missing alt text on some images',
      suggestion: 'Add alt text to all images for accessibility',
      auto_fixable: true
    });
  }

  // Width compliance (600-640px standard)
  const widthMatches = html.match(/width\s*[:=]\s*["']?(\d+)/gi) || [];
  const hasProperWidth = widthMatches.some(match => {
    const width = parseInt(match.replace(/\D/g, ''));
    return width >= 600 && width <= 640;
  });
  
  if (!hasProperWidth && standards?.check_email_width !== false) {
    issues.push({
      severity: 'low',
      category: 'compatibility',
      description: 'Email width may not be optimal',
      suggestion: 'Set main table width to 600-640px for best compatibility',
      auto_fixable: true
    });
  }

  return {
    issues,
    standards: {
      doctype_valid: doctypeValid,
      table_based_layout: tableBasedLayout,
      inline_styles_ratio: Math.round(inlineStylesRatio * 100) / 100,
      image_alt_coverage: Math.round(imageAltCoverage * 100) / 100,
      width_compliance: hasProperWidth
    }
  };
}

function checkClientCompatibility(html: string, targetClients: string[]): { issues: any[]; compatibility: any } {
  const issues: any[] = [];
  const compatibility: Record<string, any> = {};
  
  targetClients.forEach(client => {
    const clientIssues: string[] = [];
    let compatible = true;
    let confidence = 95;

    // Client-specific checks
    switch (client) {
      case 'outlook':
        if (html.includes('flexbox') || html.includes('display:flex')) {
          clientIssues.push('Flexbox not supported');
          compatible = false;
          confidence -= 20;
        }
        if (html.includes('position:')) {
          clientIssues.push('CSS positioning may not work');
          confidence -= 10;
        }
        break;
        
      case 'gmail':
        if (html.includes('<style>')) {
          clientIssues.push('Style tags may be stripped');
          confidence -= 15;
        }
        if (html.length > 102000) {
          clientIssues.push('Email may be clipped due to size');
          compatible = false;
          confidence -= 25;
        }
        break;
        
      case 'apple_mail':
        // Apple Mail is generally more forgiving
        if (!html.includes('meta')) {
          clientIssues.push('Missing meta tags for mobile optimization');
          confidence -= 5;
        }
        break;
    }

    compatibility[client] = {
      compatible,
      issues: clientIssues,
      confidence
    };

    // Add issues to main list
    clientIssues.forEach(issue => {
      issues.push({
        severity: 'medium',
        category: 'compatibility',
        description: `${client}: ${issue}`,
        suggestion: `Optimize for ${client} compatibility`,
        auto_fixable: false
      });
    });
  });

  return { issues, compatibility };
}

function generateValidationRecommendations(issues: any[], htmlSizeKb: number): string[] {
  const recommendations: string[] = [];
  
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  
  if (criticalIssues > 0) {
    recommendations.push('Fix critical issues before deployment');
  }
  
  if (highIssues > 0) {
    recommendations.push('Address high-priority compatibility issues');
  }
  
  if (htmlSizeKb > 100) {
    recommendations.push('Optimize email size to prevent clipping');
  }
  
  const accessibilityIssues = issues.filter(i => i.category === 'accessibility').length;
  if (accessibilityIssues > 0) {
    recommendations.push('Improve accessibility with alt text and semantic markup');
  }
  
  const compatibilityIssues = issues.filter(i => i.category === 'compatibility').length;
  if (compatibilityIssues > 2) {
    recommendations.push('Review email client compatibility guidelines');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('HTML validation passed - ready for testing');
  }
  
  return recommendations;
}