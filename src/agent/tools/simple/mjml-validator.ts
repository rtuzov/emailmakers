import { z } from 'zod';
import { ToolResult } from '../base-tool';

const mjmlValidatorSchema = z.object({
  mjml_code: z.string().describe('MJML код для валидации'),
  validation_level: z.enum(['basic', 'strict', 'email_client']).default('strict').describe('Уровень валидации'),
  fix_suggestions: z.boolean().default(true).describe('Включить предложения по исправлению'),
  check_email_compatibility: z.boolean().default(true).describe('Проверить совместимость с email-клиентами')
});

export type MjmlValidatorParams = z.infer<typeof mjmlValidatorSchema>;

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  message: string;
  rule: string;
  fix_suggestion?: string;
}

interface ValidationResult {
  is_valid: boolean;
  issues: ValidationIssue[];
  email_compatibility: {
    gmail: number;
    outlook: number;
    apple_mail: number;
    yahoo: number;
    overall_score: number;
  };
  structure_analysis: {
    has_mjml_root: boolean;
    has_head: boolean;
    has_body: boolean;
    sections_count: number;
    components_used: string[];
  };
  recommendations: string[];
}

export async function mjmlValidator(params: MjmlValidatorParams): Promise<ToolResult> {
  try {
    console.log('🔍 Validating MJML code...');
    
    const mjmlCode = params.mjml_code.trim();
    
    if (!mjmlCode) {
      return {
        success: false,
        error: 'MJML code is required for validation'
      };
    }

    const validationResult: ValidationResult = {
      is_valid: true,
      issues: [],
      email_compatibility: {
        gmail: 100,
        outlook: 100,
        apple_mail: 100,
        yahoo: 100,
        overall_score: 100
      },
      structure_analysis: {
        has_mjml_root: false,
        has_head: false,
        has_body: false,
        sections_count: 0,
        components_used: []
      },
      recommendations: []
    };

    // 1. Базовая проверка структуры
    validateBasicStructure(mjmlCode, validationResult);
    
    // 2. Проверка синтаксиса и тегов
    validateSyntaxAndTags(mjmlCode, validationResult);
    
    // 3. Проверка атрибутов
    validateAttributes(mjmlCode, validationResult);
    
    // 4. Проверка email-совместимости
    if (params.check_email_compatibility) {
      validateEmailCompatibility(mjmlCode, validationResult);
    }
    
    // 5. Генерация рекомендаций
    if (params.fix_suggestions) {
      generateRecommendations(mjmlCode, validationResult);
    }

    // Проверяем через MJML компилятор если возможно
    try {
      const mjmlModule = await import('mjml');
      const mjml = (mjmlModule as any).default || mjmlModule;
      
      if (typeof mjml === 'function') {
        const result = mjml(mjmlCode, { validationLevel: params.validation_level });
        
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: any) => {
            validationResult.issues.push({
              type: error.level === 'error' ? 'error' : 'warning',
              line: error.line,
              message: error.message,
              rule: error.tagName || 'mjml-compiler',
              fix_suggestion: generateFixSuggestion(error)
            });
          });
          
          if (result.errors.some((e: any) => e.level === 'error')) {
            validationResult.is_valid = false;
          }
        }
      }
    } catch (error) {
      console.warn('MJML compiler not available for validation:', error);
    }

    console.log(`✅ MJML validation completed: ${validationResult.is_valid ? 'VALID' : 'INVALID'} (${validationResult.issues.length} issues)`);

    return {
      success: true,
      data: validationResult,
      metadata: {
        validation_level: params.validation_level,
        issues_count: validationResult.issues.length,
        errors_count: validationResult.issues.filter(i => i.type === 'error').length,
        warnings_count: validationResult.issues.filter(i => i.type === 'warning').length,
        overall_score: validationResult.email_compatibility.overall_score,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('❌ MJML validation failed:', error);
    return {
      success: false,
      error: `MJML validation failed: ${error.message}`
    };
  }
}

function validateBasicStructure(mjmlCode: string, result: ValidationResult) {
  // Проверка корневого тега <mjml>
  if (!mjmlCode.includes('<mjml>') || !mjmlCode.includes('</mjml>')) {
    result.issues.push({
      type: 'error',
      message: 'MJML code must be wrapped in <mjml></mjml> tags',
      rule: 'mjml-root-required',
      fix_suggestion: 'Wrap your content in <mjml></mjml> tags'
    });
    result.is_valid = false;
  } else {
    result.structure_analysis.has_mjml_root = true;
  }

  // Проверка наличия <mj-head>
  if (mjmlCode.includes('<mj-head>')) {
    result.structure_analysis.has_head = true;
  }

  // Проверка наличия <mj-body>
  if (!mjmlCode.includes('<mj-body>') || !mjmlCode.includes('</mj-body>')) {
    result.issues.push({
      type: 'error',
      message: 'MJML must contain <mj-body></mj-body>',
      rule: 'mj-body-required',
      fix_suggestion: 'Add <mj-body></mj-body> section to your MJML'
    });
    result.is_valid = false;
  } else {
    result.structure_analysis.has_body = true;
  }

  // Подсчёт секций
  const sectionMatches = mjmlCode.match(/<mj-section/g);
  result.structure_analysis.sections_count = sectionMatches ? sectionMatches.length : 0;

  // Анализ используемых компонентов
  const componentRegex = /<(mj-[a-z-]+)/g;
  const components = new Set<string>();
  let match;
  while ((match = componentRegex.exec(mjmlCode)) !== null) {
    components.add(match[1]);
  }
  result.structure_analysis.components_used = Array.from(components);
}

function validateSyntaxAndTags(mjmlCode: string, result: ValidationResult) {
  // Проверка закрытых тегов
  const openTags = mjmlCode.match(/<(mj-[a-z-]+)(?:\s[^>]*)?>/g) || [];
  const closeTags = mjmlCode.match(/<\/(mj-[a-z-]+)>/g) || [];
  
  const openTagNames = openTags.map(tag => tag.match(/<(mj-[a-z-]+)/)?.[1]).filter(Boolean);
  const closeTagNames = closeTags.map(tag => tag.match(/<\/(mj-[a-z-]+)>/)?.[1]).filter(Boolean);
  
  // Проверка парности тегов
  openTagNames.forEach(tagName => {
    if (tagName && !closeTagNames.includes(tagName)) {
      // Исключаем самозакрывающиеся теги
      const selfClosingTags = ['mj-image', 'mj-spacer', 'mj-divider'];
      if (!selfClosingTags.includes(tagName)) {
        result.issues.push({
          type: 'error',
          message: `Unclosed tag: <${tagName}>`,
          rule: 'unclosed-tag',
          fix_suggestion: `Add closing tag </${tagName}>`
        });
        result.is_valid = false;
      }
    }
  });

  // Проверка недопустимых тегов
  const validMjmlTags = [
    'mjml', 'mj-head', 'mj-body', 'mj-section', 'mj-column', 'mj-text', 
    'mj-button', 'mj-image', 'mj-table', 'mj-spacer', 'mj-divider',
    'mj-title', 'mj-preview', 'mj-attributes', 'mj-style', 'mj-font',
    'mj-hero', 'mj-wrapper', 'mj-group', 'mj-raw', 'mj-include',
    'mj-navbar', 'mj-accordion', 'mj-carousel', 'mj-social'
  ];

  result.structure_analysis.components_used.forEach(component => {
    if (!validMjmlTags.includes(component)) {
      result.issues.push({
        type: 'warning',
        message: `Unknown MJML component: ${component}`,
        rule: 'unknown-component',
        fix_suggestion: `Check if ${component} is correctly spelled or supported`
      });
    }
  });
}

function validateAttributes(mjmlCode: string, result: ValidationResult) {
  // Проверка обязательных атрибутов для изображений
  const imageMatches = mjmlCode.match(/<mj-image[^>]*>/g) || [];
  imageMatches.forEach(imageTag => {
    if (!imageTag.includes('src=')) {
      result.issues.push({
        type: 'error',
        message: 'mj-image requires src attribute',
        rule: 'image-src-required',
        fix_suggestion: 'Add src="your-image-url" to mj-image tag'
      });
      result.is_valid = false;
    }
    
    if (!imageTag.includes('alt=')) {
      result.issues.push({
        type: 'warning',
        message: 'mj-image should have alt attribute for accessibility',
        rule: 'image-alt-recommended',
        fix_suggestion: 'Add alt="description" to mj-image tag'
      });
    }
  });

  // Проверка ссылок в кнопках
  const buttonMatches = mjmlCode.match(/<mj-button[^>]*>/g) || [];
  buttonMatches.forEach(buttonTag => {
    if (!buttonTag.includes('href=')) {
      result.issues.push({
        type: 'warning',
        message: 'mj-button should have href attribute',
        rule: 'button-href-recommended',
        fix_suggestion: 'Add href="your-link" to mj-button tag'
      });
    }
  });
}

function validateEmailCompatibility(mjmlCode: string, result: ValidationResult) {
  let compatibilityScore = 100;
  
  // Проверка CSS свойств, которые не поддерживаются в Outlook
  const outlookIncompatible = [
    'border-radius', 'box-shadow', 'transform', 'opacity', 'position: absolute',
    'position: fixed', 'flexbox', 'grid'
  ];
  
  outlookIncompatible.forEach(property => {
    if (mjmlCode.includes(property)) {
      compatibilityScore -= 10;
      result.issues.push({
        type: 'warning',
        message: `${property} may not be supported in Outlook`,
        rule: 'outlook-compatibility',
        fix_suggestion: `Consider alternative approach for ${property} to support Outlook`
      });
    }
  });

  // Проверка размеров изображений
  const imageSizeRegex = /width="(\d+)"/g;
  let match;
  while ((match = imageSizeRegex.exec(mjmlCode)) !== null) {
    const width = parseInt(match[1]);
    if (width > 600) {
      result.issues.push({
        type: 'warning',
        message: `Image width ${width}px exceeds recommended 600px`,
        rule: 'image-width-limit',
        fix_suggestion: 'Keep image width under 600px for better email client support'
      });
      compatibilityScore -= 5;
    }
  }

  result.email_compatibility = {
    gmail: Math.max(90, compatibilityScore),
    outlook: Math.max(70, compatibilityScore - 20),
    apple_mail: Math.max(95, compatibilityScore),
    yahoo: Math.max(85, compatibilityScore - 10),
    overall_score: compatibilityScore
  };
}

function generateRecommendations(mjmlCode: string, result: ValidationResult) {
  const recommendations: string[] = [];

  // Рекомендации по структуре
  if (result.structure_analysis.sections_count === 0) {
    recommendations.push('Add at least one mj-section to organize your content');
  }

  if (!result.structure_analysis.has_head) {
    recommendations.push('Add mj-head section with mj-title and mj-preview for better email client display');
  }

  // Рекомендации по производительности
  if (mjmlCode.length > 100000) {
    recommendations.push('Consider reducing email size for better loading performance');
  }

  // Рекомендации по доступности
  if (!mjmlCode.includes('alt=')) {
    recommendations.push('Add alt attributes to all images for accessibility');
  }

  // Рекомендации по мобильной оптимизации
  if (!mjmlCode.includes('@media')) {
    recommendations.push('Consider adding responsive styles for mobile optimization');
  }

  result.recommendations = recommendations;
}

function generateFixSuggestion(error: any): string {
  const suggestions: Record<string, string> = {
    'mj-column': 'Ensure mj-column is inside mj-section',
    'mj-text': 'Check that mj-text content is properly formatted',
    'mj-button': 'Verify mj-button has href attribute and is inside mj-column',
    'mj-image': 'Make sure mj-image has src attribute and valid URL'
  };

  return suggestions[error.tagName] || 'Check MJML documentation for proper usage';
}

export const mjmlValidatorTool = {
  name: 'mjml_validator',
  description: 'Validate MJML code for syntax, structure, and email client compatibility',
  inputSchema: mjmlValidatorSchema,
  execute: mjmlValidator
}; 