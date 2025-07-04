/**
 * 🎯 MJML VALIDATOR TOOL
 * 
 * Инструмент для валидации MJML кода
 * Проверяет синтаксис и структуру MJML шаблонов
 */

import { generateTraceId, tracedAsync } from '../../utils/tracing-utils';



export interface MjmlValidatorParams {
  mjml_code: string;
  validation_level?: 'basic' | 'strict' | 'comprehensive';
  check_components?: boolean;
  check_attributes?: boolean;
}

export interface MjmlValidatorResult {
  success: boolean;
  validation_results: {
    is_valid: boolean;
    syntax_errors: Array<{
      line: number;
      column: number;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    structure_issues: string[];
    component_analysis: {
      total_components: number;
      valid_components: number;
      invalid_components: Array<{
        component: string;
        issue: string;
        line?: number;
      }>;
    };
    best_practices: {
      score: number;
      recommendations: string[];
    };
  };
  error?: string;
}

export async function mjmlValidator(params: MjmlValidatorParams): Promise<MjmlValidatorResult> {
  const traceId = generateTraceId();
  
  return await tracedAsync({
    name: 'mjml_validator',
    metadata: { trace_id: traceId }
  }, async () => {
    const startTime = Date.now();
    console.log(`🎯 MJML Validator: Starting validation with level "${params.validation_level || 'basic'}"`);

    try {
      // Validate input
      if (!params.mjml_code || params.mjml_code.trim().length === 0) {
        const errorResult: MjmlValidatorResult = {
          success: false,
          validation_results: {
            is_valid: false,
            syntax_errors: [{
              line: 1,
              column: 1,
              message: 'No MJML code provided',
              severity: 'error'
            }],
            structure_issues: ['Empty MJML content'],
            component_analysis: {
              total_components: 0,
              valid_components: 0,
              invalid_components: []
            },
            best_practices: {
              score: 0,
              recommendations: ['Provide valid MJML code for validation']
            }
          },
          error: 'No MJML code provided'
        };

        console.log(`❌ MJML Validator failed: No MJML code provided`);
        return errorResult;
      }

      const validationLevel = params.validation_level || 'basic';
      const checkComponents = params.check_components !== false;
      const checkAttributes = params.check_attributes !== false;

      // Basic structure validation
      const syntaxErrors: Array<{
        line: number;
        column: number;
        message: string;
        severity: 'error' | 'warning' | 'info';
      }> = [];

      const structureIssues: string[] = [];
      
      // Check for basic MJML structure
      if (!params.mjml_code.includes('<mjml>')) {
        syntaxErrors.push({
          line: 1,
          column: 1,
          message: 'Missing <mjml> root element',
          severity: 'error'
        });
      }

      if (!params.mjml_code.includes('<mj-head>') && validationLevel !== 'basic') {
        syntaxErrors.push({
          line: 1,
          column: 1,
          message: 'Missing <mj-head> section',
          severity: 'warning'
        });
      }

      if (!params.mjml_code.includes('<mj-body>')) {
        syntaxErrors.push({
          line: 1,
          column: 1,
          message: 'Missing <mj-body> element',
          severity: 'error'
        });
      }

      // Check for unclosed tags
      const openTags = params.mjml_code.match(/<mj-[\w-]+(?:\s[^>]*)?>(?![^<]*<\/mj-[\w-]+>)/g) || [];
      openTags.forEach((tag, index) => {
        const tagName = tag.match(/<(mj-[\w-]+)/)?.[1];
        if (tagName && !params.mjml_code.includes(`</${tagName}>`)) {
          syntaxErrors.push({
            line: index + 1,
            column: 1,
            message: `Unclosed tag: ${tagName}`,
            severity: 'error'
          });
        }
      });

      // Component analysis
      const mjmlComponents = [
        'mj-section', 'mj-column', 'mj-text', 'mj-button', 'mj-image',
        'mj-divider', 'mj-spacer', 'mj-table', 'mj-social', 'mj-navbar'
      ];

      let totalComponents = 0;
      let validComponents = 0;
      const invalidComponents: Array<{
        component: string;
        issue: string;
        line?: number;
      }> = [];

      if (checkComponents) {
        mjmlComponents.forEach(component => {
          const regex = new RegExp(`<${component}[^>]*>`, 'g');
          const matches = params.mjml_code.match(regex) || [];
          totalComponents += matches.length;
          
          matches.forEach((match, index) => {
            // Basic component validation
            if (component === 'mj-button' && !match.includes('href=')) {
              invalidComponents.push({
                component,
                issue: 'Button missing href attribute',
                line: index + 1
              });
            } else if (component === 'mj-image' && !match.includes('src=')) {
              invalidComponents.push({
                component,
                issue: 'Image missing src attribute',
                line: index + 1
              });
            } else {
              validComponents++;
            }
          });
        });
      }

      // Best practices analysis
      let bestPracticesScore = 100;
      const recommendations: string[] = [];

      // Check for responsive design
      if (!params.mjml_code.includes('mj-column') || !params.mjml_code.includes('width=')) {
        bestPracticesScore -= 20;
        recommendations.push('Use mj-column with width attributes for responsive design');
      }

      // Check for meta tags
      if (!params.mjml_code.includes('mj-title')) {
        bestPracticesScore -= 10;
        recommendations.push('Add mj-title for better email client support');
      }

      if (!params.mjml_code.includes('mj-preview')) {
        bestPracticesScore -= 10;
        recommendations.push('Add mj-preview for email preview text');
      }

      // Check for font fallbacks
      if (params.mjml_code.includes('font-family') && !params.mjml_code.includes('Arial')) {
        bestPracticesScore -= 10;
        recommendations.push('Include fallback fonts like Arial for better compatibility');
      }

      // Check for alt text on images
      const imageMatches = params.mjml_code.match(/<mj-image[^>]*>/g) || [];
      const imagesWithoutAlt = imageMatches.filter(img => !img.includes('alt=')).length;
      if (imagesWithoutAlt > 0) {
        bestPracticesScore -= imagesWithoutAlt * 5;
        recommendations.push('Add alt text to all images for accessibility');
      }

      // Structure issues
      if (params.mjml_code.includes('<mj-column>') && !params.mjml_code.includes('<mj-section>')) {
        structureIssues.push('mj-column should be wrapped in mj-section');
      }

      const isValid = syntaxErrors.filter(e => e.severity === 'error').length === 0;

      const result: MjmlValidatorResult = {
        success: true,
        validation_results: {
          is_valid: isValid,
          syntax_errors: syntaxErrors,
          structure_issues: structureIssues,
          component_analysis: {
            total_components: totalComponents,
            valid_components: validComponents,
            invalid_components: invalidComponents
          },
          best_practices: {
            score: Math.max(0, bestPracticesScore),
            recommendations: recommendations
          }
        }
      };

      const duration = Date.now() - startTime;
      console.log(`✅ MJML Validator completed in ${duration}ms, valid: ${isValid}`);
      
      return result;

    } catch (error) {
      const errorResult: MjmlValidatorResult = {
        success: false,
        validation_results: {
          is_valid: false,
          syntax_errors: [{
            line: 1,
            column: 1,
            message: 'Validation failed due to internal error',
            severity: 'error'
          }],
          structure_issues: ['Internal validation error'],
          component_analysis: {
            total_components: 0,
            valid_components: 0,
            invalid_components: []
          },
          best_practices: {
            score: 0,
            recommendations: ['Check error logs', 'Verify MJML syntax']
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error during MJML validation'
      };

      const duration = Date.now() - startTime;
      console.log(`❌ MJML Validator failed after ${duration}ms:`, error);
      
      return errorResult;
    }
  });
} 