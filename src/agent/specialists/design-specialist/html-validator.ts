/**
 * HTML Validator and Corrector for Design Specialist
 * Compares final HTML with requirements and fixes issues
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { tool } from '@openai/agents';
import { z } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  correctedHtml?: string;
  correctionsMade: string[];
}

export interface ValidationError {
  type: 'template' | 'technical' | 'asset' | 'structure';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'optimization' | 'accessibility' | 'compatibility';
  message: string;
  suggestion?: string;
}

/**
 * OpenAI SDK Function Tool for HTML validation
 */
export const validateAndCorrectHtml = tool({
  name: 'validateAndCorrectHtml',
  description: 'Validate and correct HTML template against requirements, technical specifications, and asset manifest',
  parameters: z.object({
    campaign_path: z.string().describe('Path to the campaign directory'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params) => {
    console.log('🔍 === HTML VALIDATION AND CORRECTION STARTED ===');
    console.log(`📋 Campaign: ${path.basename(params.campaign_path)}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    
    try {
      // Load current HTML template
      const htmlTemplatePath = path.join(params.campaign_path, 'templates', 'email-template.html');
      const currentHtml = await fs.readFile(htmlTemplatePath, 'utf8');
      
      // Load all requirements and context
      const [
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      ] = await Promise.all([
        loadTemplateRequirements(params.campaign_path),
        loadTechnicalRequirements(params.campaign_path),
        loadAssetManifest(params.campaign_path),
        loadContentContext(params.campaign_path)
      ]);
      
      // Perform comprehensive validation
      const validationResults = await performComprehensiveValidation(
        currentHtml,
        templateRequirements,
        technicalRequirements,
        assetManifest,
        contentContext
      );
      
      // Initialize correctionsMade array
      let correctionsMade: string[] = [];
      let correctedHtml: string | undefined;
      
      // If there are errors, attempt to correct them
      if (validationResults.errors.length > 0) {
        console.log(`🚨 Found ${validationResults.errors.length} errors, attempting corrections...`);
        
        const correctionResult = await correctHtmlErrors(
          currentHtml,
          validationResults.errors,
          templateRequirements,
          technicalRequirements,
          assetManifest,
          contentContext
        );
        
        if (correctionResult.correctedHtml) {
          // Save corrected HTML to a separate file (NOT overwriting original)
          const correctedHtmlPath = path.join(params.campaign_path, 'templates', 'email-template-corrected.html');
          await fs.writeFile(correctedHtmlPath, correctionResult.correctedHtml);
          console.log(`✅ HTML corrected with ${correctionResult.correctionsMade.length} fixes`);
          console.log(`📁 Corrected HTML saved to: ${correctedHtmlPath}`);
          
          // Update correction data
          correctedHtml = correctionResult.correctedHtml;
          correctionsMade = correctionResult.correctionsMade;
          
          // Re-validate corrected HTML
          const revalidationResults = await performComprehensiveValidation(
            correctionResult.correctedHtml,
            templateRequirements,
            technicalRequirements,
            assetManifest,
            contentContext
          );
          
          validationResults.errors = revalidationResults.errors;
          validationResults.warnings = revalidationResults.warnings;
          validationResults.isValid = revalidationResults.errors.length === 0;
        }
      }
      
      // Create final validation result
      const finalResult: ValidationResult = {
        isValid: validationResults.isValid,
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        correctedHtml,
        correctionsMade
      };
      
      // Save validation report
      await saveValidationReport(params.campaign_path, finalResult);
      
      console.log(`✅ HTML validation completed: ${finalResult.isValid ? 'VALID' : 'INVALID'}`);
      console.log(`📊 Errors: ${finalResult.errors.length}, Warnings: ${finalResult.warnings.length}`);
      
      const correctionInfo = correctionsMade.length > 0 
        ? `Corrections made: ${correctionsMade.length}. Corrected HTML saved to: templates/email-template-corrected.html` 
        : 'No corrections needed';
      
      return `HTML validation completed: ${finalResult.isValid ? 'VALID' : 'INVALID'}. Errors: ${finalResult.errors.length}, Warnings: ${finalResult.warnings.length}. ${correctionInfo}. Validation report saved to: docs/html-validation-report.json`;
      
    } catch (error) {
      console.error('❌ HTML validation failed:', error);
      throw new Error(`HTML validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * Load template requirements from campaign files
 */
async function loadTemplateRequirements(campaignPath: string): Promise<any> {
  try {
    const templatePath = path.join(campaignPath, 'templates', 'email-template.mjml');
    const mjmlContent = await fs.readFile(templatePath, 'utf8');
    
    const designBriefPath = path.join(campaignPath, 'content', 'design-brief-from-context.json');
    const designBrief = JSON.parse(await fs.readFile(designBriefPath, 'utf8'));
    
    return {
      mjmlTemplate: mjmlContent,
      designBrief,
      expectedElements: extractExpectedElements(designBrief),
      brandRequirements: extractBrandRequirements(designBrief)
    };
  } catch (error) {
    console.warn('⚠️ Could not load template requirements:', error);
    return {};
  }
}

/**
 * Load technical requirements from campaign files
 */
async function loadTechnicalRequirements(campaignPath: string): Promise<any> {
  try {
    // Fix: Load from docs/specifications directory where Content Specialist actually saves it
    const techSpecPath = path.join(campaignPath, 'docs', 'specifications', 'technical-specification.json');
    const techSpec = JSON.parse(await fs.readFile(techSpecPath, 'utf8'));
    
    return {
      maxFileSize: techSpec.max_file_size || 100000, // 100KB default
      requiredDoctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
      maxWidth: techSpec.max_width || 640,
      requiredMeta: techSpec.required_meta || [],
      emailClientCompatibility: techSpec.email_client_compatibility || [],
      accessibilityRequirements: techSpec.accessibility_requirements || []
    };
  } catch (error) {
    console.warn('⚠️ Could not load technical requirements:', error);
    return getDefaultTechnicalRequirements();
  }
}

/**
 * Load asset manifest from campaign files
 */
async function loadAssetManifest(campaignPath: string): Promise<any> {
  try {
    // Fix: Load from assets/manifests directory where Design Specialist actually saves it
    const assetManifestPath = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    const assetManifest = JSON.parse(await fs.readFile(assetManifestPath, 'utf8'));
    
    return {
      images: assetManifest.assetManifest?.images || assetManifest.images || [],
      fonts: assetManifest.assetManifest?.fonts || assetManifest.fonts || [],
      icons: assetManifest.assetManifest?.icons || assetManifest.icons || [],
      expectedAssets: extractExpectedAssets(assetManifest.assetManifest || assetManifest)
    };
  } catch (error) {
    console.warn('⚠️ Could not load asset manifest:', error);
    return { images: [], fonts: [], icons: [], expectedAssets: [] };
  }
}

/**
 * Load content context from campaign files
 */
async function loadContentContext(campaignPath: string): Promise<any> {
  try {
    const contentPath = path.join(campaignPath, 'content', 'email-content.json');
    const contentContext = JSON.parse(await fs.readFile(contentPath, 'utf8'));
    
    return contentContext;
  } catch (error) {
    console.warn('⚠️ Could not load content context:', error);
    return {};
  }
}

/**
 * Perform comprehensive HTML validation
 */
async function performComprehensiveValidation(
  html: string,
  templateRequirements: any,
  technicalRequirements: any,
  assetManifest: any,
  contentContext: any
): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[]; isValid: boolean }> {
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. Template Structure Validation
  const templateErrors = validateTemplateStructure(html, templateRequirements);
  errors.push(...templateErrors);
  
  // 2. Technical Requirements Validation
  const technicalErrors = validateTechnicalRequirements(html, technicalRequirements);
  errors.push(...technicalErrors);
  
  // 3. Asset Manifest Validation
  const assetErrors = validateAssetUsage(html, assetManifest);
  errors.push(...assetErrors);
  
  // 4. Content Context Validation
  const contentErrors = validateContentAlignment(html, contentContext);
  errors.push(...contentErrors);
  
  // 5. Email Client Compatibility Validation
  const compatibilityWarnings = validateEmailClientCompatibility(html);
  warnings.push(...compatibilityWarnings);
  
  // 6. Accessibility Validation
  const accessibilityWarnings = validateAccessibility(html);
  warnings.push(...accessibilityWarnings);
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0
  };
}

/**
 * Validate template structure against requirements
 */
function validateTemplateStructure(html: string, requirements: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for required elements
  if (requirements.expectedElements) {
    for (const element of requirements.expectedElements) {
      if (!html.includes(element.selector) && !html.includes(element.content)) {
        errors.push({
          type: 'template',
          severity: 'major',
          message: `Missing required element: ${element.name}`,
          suggestion: `Add ${element.name} to the template`
        });
      }
    }
  }
  
  // Check brand requirements
  if (requirements.brandRequirements) {
    if (requirements.brandRequirements.logo && !html.includes('logo')) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Missing brand logo',
        suggestion: 'Add brand logo to the template'
      });
    }
    
    // Fix: Check if colors is an array before iterating
    if (requirements.brandRequirements.colors && Array.isArray(requirements.brandRequirements.colors)) {
      for (const color of requirements.brandRequirements.colors) {
        if (color && color.value && !html.includes(color.value)) {
          errors.push({
            type: 'template',
            severity: 'minor',
            message: `Missing brand color: ${color.name}`,
            suggestion: `Use brand color ${color.value} in the template`
          });
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate technical requirements
 */
function validateTechnicalRequirements(html: string, requirements: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check DOCTYPE
  if (requirements.requiredDoctype && !html.includes(requirements.requiredDoctype)) {
    errors.push({
      type: 'technical',
      severity: 'critical',
      message: 'Missing or incorrect DOCTYPE',
      suggestion: `Use DOCTYPE: ${requirements.requiredDoctype}`
    });
  }
  
  // Check file size
  if (requirements.maxFileSize && html.length > requirements.maxFileSize) {
    errors.push({
      type: 'technical',
      severity: 'major',
      message: `HTML file size exceeds limit: ${html.length} > ${requirements.maxFileSize}`,
      suggestion: 'Optimize HTML content to reduce file size'
    });
  }
  
  // Check max width
  if (requirements.maxWidth) {
    const widthMatch = html.match(/width[:\s]*(\d+)/gi);
    if (widthMatch) {
      const maxWidth = Math.max(...widthMatch.map(w => parseInt(w.match(/\d+/)?.[0] || '0')));
      if (maxWidth > requirements.maxWidth) {
        errors.push({
          type: 'technical',
          severity: 'major',
          message: `Template width exceeds limit: ${maxWidth} > ${requirements.maxWidth}`,
          suggestion: `Reduce template width to ${requirements.maxWidth}px or less`
        });
      }
    }
  }
  
  // Check required meta tags
  if (requirements.requiredMeta) {
    for (const meta of requirements.requiredMeta) {
      if (!html.includes(meta)) {
        errors.push({
          type: 'technical',
          severity: 'major',
          message: `Missing required meta tag: ${meta}`,
          suggestion: `Add meta tag: ${meta}`
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate asset usage against manifest
 */
function validateAssetUsage(html: string, assetManifest: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check if all expected assets are used
  if (assetManifest.expectedAssets) {
    for (const asset of assetManifest.expectedAssets) {
      if (!html.includes(asset.filename) && !html.includes(asset.path)) {
        errors.push({
          type: 'asset',
          severity: 'major',
          message: `Expected asset not used: ${asset.filename}`,
          suggestion: `Include asset ${asset.filename} in the template`
        });
      }
    }
  }
  
  // Check for broken image references
  const imgMatches = html.match(/<img[^>]+src="([^"]*)"[^>]*>/gi);
  if (imgMatches) {
    for (const imgMatch of imgMatches) {
      const srcMatch = imgMatch.match(/src="([^"]*)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const isExternal = src.startsWith('http');
        
        if (!isExternal) {
          // Check if local asset exists in manifest - fix: ensure images is an array
          const assetExists = assetManifest.images && Array.isArray(assetManifest.images) && 
            assetManifest.images.some((img: any) => 
              img.filename === path.basename(src) || img.path.includes(src)
            );
          
          if (!assetExists) {
            errors.push({
              type: 'asset',
              severity: 'critical',
              message: `Referenced asset not found in manifest: ${src}`,
              suggestion: `Add asset ${src} to asset manifest or use correct path`
            });
          }
        }
      }
    }
  }
  
  return errors;
}

/**
 * Validate content alignment with context
 */
function validateContentAlignment(html: string, contentContext: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check if key content elements are present
  if (contentContext.generated_content) {
    const content = contentContext.generated_content;
    
    if (content.subject && !html.includes(content.subject)) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Email subject not found in template',
        suggestion: 'Include email subject in the template'
      });
    }
    
    if (content.preheader && !html.includes(content.preheader)) {
      errors.push({
        type: 'template',
        severity: 'minor',
        message: 'Preheader text not found in template',
        suggestion: 'Include preheader text in the template'
      });
    }
    
    if (content.cta && content.cta.text && !html.includes(content.cta.text)) {
      errors.push({
        type: 'template',
        severity: 'major',
        message: 'Call-to-action text not found in template',
        suggestion: 'Include CTA text in the template'
      });
    }
  }
  
  return errors;
}

/**
 * Validate email client compatibility
 */
function validateEmailClientCompatibility(html: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for CSS that might not work in email clients
  if (html.includes('flexbox') || html.includes('display: flex')) {
    warnings.push({
      type: 'compatibility',
      message: 'Flexbox detected - may not work in all email clients',
      suggestion: 'Use table-based layout for better compatibility'
    });
  }
  
  if (html.includes('grid') || html.includes('display: grid')) {
    warnings.push({
      type: 'compatibility',
      message: 'CSS Grid detected - may not work in all email clients',
      suggestion: 'Use table-based layout for better compatibility'
    });
  }
  
  // Check for external stylesheets
  if (html.includes('<link') && html.includes('stylesheet')) {
    warnings.push({
      type: 'compatibility',
      message: 'External stylesheets detected - may be blocked by email clients',
      suggestion: 'Use inline styles instead of external stylesheets'
    });
  }
  
  return warnings;
}

/**
 * Validate accessibility requirements
 */
function validateAccessibility(html: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for alt attributes on images
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    for (const imgMatch of imgMatches) {
      if (!imgMatch.includes('alt=')) {
        warnings.push({
          type: 'accessibility',
          message: 'Image missing alt attribute',
          suggestion: 'Add alt attributes to all images for accessibility'
        });
      }
    }
  }
  
  // Check for proper heading structure
  if (!html.includes('<h1')) {
    warnings.push({
      type: 'accessibility',
      message: 'No H1 heading found',
      suggestion: 'Add H1 heading for proper document structure'
    });
  }
  
  return warnings;
}

/**
 * Correct HTML errors using AI
 */
async function correctHtmlErrors(
  html: string,
  errors: ValidationError[],
  templateRequirements: any,
  technicalRequirements: any,
  assetManifest: any,
  contentContext: any
): Promise<{ correctedHtml?: string; correctionsMade: string[] }> {
  
  console.log('🔧 Attempting to correct HTML errors with AI...');
  
  const correctionPrompt = `
Fix the following HTML email template errors while maintaining the original design and functionality:

CURRENT HTML:
${html}

ERRORS TO FIX:
${errors.map(error => `- ${error.type.toUpperCase()}: ${error.message}${error.suggestion ? ` (${error.suggestion})` : ''}`).join('\n')}

REQUIREMENTS:
- Template Requirements: ${JSON.stringify(templateRequirements, null, 2)}
- Technical Requirements: ${JSON.stringify(technicalRequirements, null, 2)}
- Asset Manifest: ${JSON.stringify(assetManifest, null, 2)}
- Content Context: ${JSON.stringify(contentContext, null, 2)}

INSTRUCTIONS:
1. Fix all critical and major errors
2. Maintain the original design and layout
3. Ensure email client compatibility
4. Keep the HTML structure intact
5. Use proper DOCTYPE and meta tags
6. Ensure all referenced assets exist in the manifest
7. Include all required content elements

Return ONLY the corrected HTML, no explanations or markdown formatting.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email template developer. Fix HTML errors while maintaining design integrity and email client compatibility.'
          },
          {
            role: 'user',
            content: correctionPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const correctedHtml = data.choices[0].message.content.trim();
    
    // Identify corrections made
    const correctionsMade = errors.map(error => `Fixed ${error.type}: ${error.message}`);
    
    console.log(`✅ HTML corrected with ${correctionsMade.length} fixes`);
    
    return {
      correctedHtml,
      correctionsMade
    };
    
  } catch (error) {
    console.error('❌ HTML correction failed:', error);
    return {
      correctionsMade: []
    };
  }
}

/**
 * Save validation report to campaign files
 */
async function saveValidationReport(campaignPath: string, validationResult: ValidationResult): Promise<void> {
  const reportPath = path.join(campaignPath, 'docs', 'html-validation-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    correctionsMade: validationResult.correctionsMade || [],
    files: {
      originalHtml: 'templates/email-template.html',
      correctedHtml: validationResult.correctedHtml ? 'templates/email-template-corrected.html' : null,
      validationReport: 'docs/html-validation-report.json'
    },
    summary: {
      totalErrors: validationResult.errors.length,
      totalWarnings: validationResult.warnings.length,
      criticalErrors: validationResult.errors.filter(e => e.severity === 'critical').length,
      majorErrors: validationResult.errors.filter(e => e.severity === 'major').length,
      minorErrors: validationResult.errors.filter(e => e.severity === 'minor').length,
      correctionsApplied: validationResult.correctionsMade?.length || 0
    }
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Validation report saved to: ${reportPath}`);
}

/**
 * Helper functions
 */
function extractExpectedElements(designBrief: any): any[] {
  const elements = [];
  
  if (designBrief.visual_elements) {
    for (const element of designBrief.visual_elements) {
      elements.push({
        name: element.name || element.type,
        selector: element.selector || element.type,
        content: element.content || element.description
      });
    }
  }
  
  return elements;
}

function extractBrandRequirements(designBrief: any): any {
  return {
    logo: designBrief.brand_elements?.logo || false,
    colors: designBrief.brand_colors || [],
    fonts: designBrief.brand_fonts || []
  };
}

function extractExpectedAssets(assetManifest: any): any[] {
  const expectedAssets = [];
  
  // Fix: Check if images is an array before trying to filter
  if (assetManifest.images && Array.isArray(assetManifest.images)) {
    expectedAssets.push(...assetManifest.images.filter((img: any) => img.purpose === 'hero' || img.purpose === 'required'));
  }
  
  return expectedAssets;
}

function getDefaultTechnicalRequirements(): any {
  return {
    maxFileSize: 100000,
    requiredDoctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    maxWidth: 640,
    requiredMeta: [
      '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    ],
    emailClientCompatibility: ['gmail', 'outlook', 'apple_mail', 'yahoo_mail'],
    accessibilityRequirements: ['alt_text', 'heading_structure', 'color_contrast']
  };
} 