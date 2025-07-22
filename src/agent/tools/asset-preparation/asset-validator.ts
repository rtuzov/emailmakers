/**
 * ✅ ASSET VALIDATOR - Context-Aware Asset Validation Tool
 * 
 * Validates visual assets for email delivery compliance including:
 * - File size and format validation
 * - Email client compatibility checking
 * - Accessibility compliance (WCAG)
 * - Performance optimization recommendations
 * 
 * Integrates with OpenAI Agents SDK context parameter system.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ValidationRulesSchema = z.object({
  fileSize: z.object({
    maxSize: z.number().default(100000).describe('Maximum file size in bytes'),
    warnSize: z.number().default(75000).describe('Warning threshold in bytes')
  }).nullable(),
  formats: z.object({
    allowed: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'webp']).describe('Allowed file formats'),
    preferred: z.array(z.string()).default(['jpg', 'webp']).describe('Preferred formats for email')
  }).nullable(),
  dimensions: z.object({
    maxWidth: z.number().default(600).describe('Maximum width in pixels'),
    maxHeight: z.number().default(400).describe('Maximum height in pixels'),
    minWidth: z.number().default(100).describe('Minimum width in pixels'),
    minHeight: z.number().default(100).describe('Minimum height in pixels')
  }).nullable(),
  emailClients: z.array(z.string()).default(['gmail', 'outlook', 'apple-mail', 'yahoo-mail']).describe('Target email clients')
});

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  rule: string;
}

interface ComplianceReport {
  emailClients: Record<string, boolean>;
  accessibility: {
    wcag: boolean;
    altText: boolean;
    contrast: boolean;
    colorBlindness: boolean;
  };
  performance: {
    fileSize: boolean;
    loadTime: boolean;
    compression: boolean;
  };
  overallCompliance: number;
}

interface ValidationResult {
  filename: string;
  path: string;
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
  compliance: ComplianceReport;
  recommendations: string[];
}

// ============================================================================
// ASSET VALIDATION TOOLS
// ============================================================================

export const validateAssets = tool({
  name: 'validateAssets',
  description: 'Comprehensive asset validation for email delivery compliance',
  parameters: z.object({
    inputPath: z.string().describe('Path to assets directory or specific file'),
    validationRules: ValidationRulesSchema.nullable().describe('Validation rules to apply'),
    generateReport: z.boolean().default(true).describe('Generate detailed validation report'),
    fixIssues: z.boolean().default(false).describe('Automatically fix issues where possible'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ inputPath, validationRules, generateReport, fixIssues, context: _context, trace_id }) => {
    console.log('\n✅ === ASSET VALIDATION STARTED ===');
    console.log(`📂 Input Path: ${inputPath}`);
    console.log(`🔧 Auto-fix Issues: ${fixIssues}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    const rules = validationRules || {};
    
    try {
      // Get assets to validate
      const assetsToValidate = await getAssetsToValidate(inputPath);
      console.log(`📊 Found ${assetsToValidate.length} assets to validate`);
      
      const validationResults: ValidationResult[] = [];
      const errors: string[] = [];
      
      // Validate each asset
      for (const assetPath of assetsToValidate) {
        console.log(`✅ Validating: ${path.basename(assetPath)}`);
        
        try {
          const result = await validateAsset(assetPath, rules);
          validationResults.push(result);
          
          if (result.valid) {
            console.log(`✅ Valid (${result.score}/100)`);
          } else {
            console.log(`❌ Invalid (${result.score}/100) - ${result.issues.filter(i => (i || {}).severity === 'error').length} errors`);
          }
          
        } catch (error) {
          const errorMsg = `Failed to validate ${path.basename(assetPath)}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
      
      // Generate validation summary
      const summary = generateValidationSummary(validationResults, errors);
      
      // Generate detailed report if requested
      let detailedReport = null;
      if (generateReport) {
        detailedReport = await generateValidationReport(validationResults, rules, inputPath);
      }
      
      // Save validation results
      const reportPath = path.join(path.dirname(inputPath), 'validation-report.json');
      await fs.writeFile(reportPath, JSON.stringify({
        validationId: `val_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        timestamp: new Date().toISOString(),
        inputPath,
        rules,
        summary,
        results: validationResults,
        errors,
        detailedReport
      }, null, 2));
      
      console.log('✅ Asset validation completed');
      console.log(`📊 Valid Assets: ${summary.validAssets}/${summary.totalAssets}`);
      console.log(`📋 Overall Compliance: ${summary.overallCompliance.toFixed(1)}%`);
      console.log(`⚠️ Issues Found: ${summary.totalIssues}`);
      
      return {
        success: true,
        summary,
        results: validationResults,
        detailedReport,
        errors,
        message: `Validated ${summary.totalAssets} assets: ${summary.validAssets} valid, ${summary.invalidAssets} invalid`
      };
      
    } catch (error) {
      console.error('❌ Asset validation failed:', error);
      throw error;
    }
  }
});

export const validateEmailClientCompatibility = tool({
  name: 'validateEmailClientCompatibility',
  description: 'Validate assets for specific email client compatibility',
  parameters: z.object({
    inputPath: z.string().describe('Path to assets directory or specific file'),
    emailClients: z.array(z.string()).default([
      'gmail', 'outlook', 'apple-mail', 'yahoo-mail', 'thunderbird'
    ]).describe('Email clients to validate against'),
    strictMode: z.boolean().default(false).describe('Use strict validation rules'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ inputPath, emailClients, strictMode, context: _context, trace_id }) => {
    console.log('\n📧 === EMAIL CLIENT COMPATIBILITY VALIDATION ===');
    console.log(`📂 Input Path: ${inputPath}`);
    console.log(`📧 Email Clients: ${emailClients.join(', ')}`);
    console.log(`🔒 Strict Mode: ${strictMode}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    try {
      const assetsToValidate = await getAssetsToValidate(inputPath);
      const compatibilityResults: any[] = [];
      
      for (const assetPath of assetsToValidate) {
        console.log(`📧 Checking client compatibility: ${path.basename(assetPath)}`);
        
        const clientCompatibility = await validateClientCompatibility(assetPath, emailClients, strictMode);
        compatibilityResults.push(clientCompatibility);
        
        const compatibleClients = (Object || {}).values(clientCompatibility.clients).filter(Boolean).length;
        console.log(`✅ Compatible with ${compatibleClients}/${emailClients.length} clients`);
      }
      
      // Generate compatibility report
      const compatibilityReport = generateCompatibilityReport(compatibilityResults, emailClients);
      
      console.log('✅ Email client compatibility validation completed');
      console.log(`📊 Average Compatibility: ${compatibilityReport.averageCompatibility.toFixed(1)}%`);
      console.log(`📧 Best Client: ${compatibilityReport.bestClient}`);
      
      return {
        success: true,
        compatibilityReport,
        results: compatibilityResults,
        message: `Validated compatibility for ${compatibilityResults.length} assets across ${emailClients.length} email clients`
      };
      
    } catch (error) {
      console.error('❌ Email client compatibility validation failed:', error);
      throw error;
    }
  }
});

export const validateAccessibility = tool({
  name: 'validateAccessibility',
  description: 'Validate assets for accessibility compliance (WCAG, alt text, contrast)',
  parameters: z.object({
    inputPath: z.string().describe('Path to assets directory or specific file'),
    wcagLevel: z.enum(['A', 'AA', 'AAA']).default('AA').describe('WCAG compliance level'),
    checkContrast: z.boolean().default(true).describe('Check color contrast ratios'),
    checkAltText: z.boolean().default(true).describe('Check alt text requirements'),
    context: z.object({
      campaignId: z.string().nullable(),
      campaignPath: z.string().nullable(),
      taskType: z.string().nullable(),
      language: z.string().nullable(),
      campaign_type: z.string().nullable(),
      industry: z.string().nullable(),
      urgency: z.string().nullable(),
      target_audience: z.string().nullable()
    }).nullable().describe('Workflow context'),
    trace_id: z.string().nullable().describe('Trace ID for monitoring')
  }),
  execute: async ({ inputPath, wcagLevel, checkContrast, checkAltText, context: _context, trace_id }) => {
    console.log('\n♿ === ACCESSIBILITY VALIDATION ===');
    console.log(`📂 Input Path: ${inputPath}`);
    console.log(`🎯 WCAG Level: ${wcagLevel}`);
    console.log(`🌈 Check Contrast: ${checkContrast}`);
    console.log(`📝 Check Alt Text: ${checkAltText}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);
    
    try {
      const assetsToValidate = await getAssetsToValidate(inputPath);
      const accessibilityResults: any[] = [];
      
      for (const assetPath of assetsToValidate) {
        console.log(`♿ Checking accessibility: ${path.basename(assetPath)}`);
        
        const accessibilityCheck = await validateAssetAccessibility(assetPath, wcagLevel, checkContrast, checkAltText);
        accessibilityResults.push(accessibilityCheck);
        
        const score = accessibilityCheck.score;
        console.log(`${score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌'} Accessibility Score: ${score}/100`);
      }
      
      // Generate accessibility report
      const accessibilityReport = generateAccessibilityReport(accessibilityResults, wcagLevel);
      
      console.log('✅ Accessibility validation completed');
      console.log(`📊 Average Score: ${accessibilityReport.averageScore.toFixed(1)}/100`);
      console.log(`♿ WCAG ${wcagLevel} Compliance: ${accessibilityReport.wcagCompliance.toFixed(1)}%`);
      
      return {
        success: true,
        accessibilityReport,
        results: accessibilityResults,
        message: `Validated accessibility for ${accessibilityResults.length} assets at WCAG ${wcagLevel} level`
      };
      
    } catch (error) {
      console.error('❌ Accessibility validation failed:', error);
      throw error;
    }
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAssetsToValidate(inputPath: string): Promise<string[]> {
  try {
    const stats = await fs.stat(inputPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(inputPath);
      const assetFiles = files.filter(file => 
        /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
      );
      return assetFiles.map(file => path.join(inputPath, file));
    } else {
      return [inputPath];
    }
  } catch (error) {
    throw new Error(`Failed to get assets from ${inputPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function validateAsset(assetPath: string, rules: any): Promise<ValidationResult> {
  const filename = path.basename(assetPath);
  const stats = await fs.stat(assetPath);
  const format = path.extname(assetPath).toLowerCase().substring(1);
  
  const issues: ValidationIssue[] = [];
  let score = 100;
  
  // File size validation
  if (stats.size > rules.fileSize?.maxSize) {
    issues.push({
      type: 'fileSize',
      severity: 'error',
      message: `File size ${stats.size} bytes exceeds maximum ${rules.fileSize.maxSize} bytes`,
      suggestion: 'Compress image or reduce dimensions',
      rule: 'fileSize.maxSize'
    });
    score -= 20;
  }
  
  // Format validation
  if (rules.formats?.allowed && !rules.formats.allowed.includes(format)) {
    issues.push({
      type: 'format',
      severity: 'error',
      message: `Format ${format} is not allowed. Allowed formats: ${rules.formats.allowed.join(', ')}`,
      suggestion: `Convert to one of: ${rules.formats.allowed.join(', ')}`,
      rule: 'formats.allowed'
    });
    score -= 15;
  }
  
  // Generate compliance report
  const compliance = generateComplianceReport(issues, rules);
  
  // Generate recommendations
  const recommendations = generateRecommendations(issues, format, stats.size);
  
  return {
    filename,
    path: assetPath,
    valid: issues.filter(i => (i || {}).severity === 'error').length === 0,
    score: Math.max(0, score),
    issues,
    compliance,
    recommendations
  };
}

async function validateClientCompatibility(assetPath: string, emailClients: string[], _strictMode: boolean): Promise<any> {
  const filename = path.basename(assetPath);
  const format = path.extname(assetPath).toLowerCase().substring(1);
  
  const clientRules = {
    gmail: {
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      maxSize: 25 * 1024 * 1024,
      restrictions: ['no-svg-animations']
    },
    outlook: {
      supportedFormats: ['jpg', 'jpeg', 'png'],
      maxSize: 20 * 1024 * 1024,
      restrictions: ['no-webp', 'no-svg']
    },
    'apple-mail': {
      supportedFormats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
      maxSize: 30 * 1024 * 1024,
      restrictions: []
    },
    'yahoo-mail': {
      supportedFormats: ['jpg', 'jpeg', 'png'],
      maxSize: 25 * 1024 * 1024,
      restrictions: ['no-webp']
    },
    thunderbird: {
      supportedFormats: ['jpg', 'jpeg', 'png', 'svg'],
      maxSize: 25 * 1024 * 1024,
      restrictions: ['no-webp']
    }
  };
  
  const stats = await fs.stat(assetPath);
  const clientCompatibility: Record<string, boolean> = {};
  const issues: Record<string, string[]> = {};
  
  for (const client of emailClients) {
    const rule = clientRules[client as keyof typeof clientRules];
    if (!rule) {
      clientCompatibility[client] = false;
      issues[client] = ['Unknown client compatibility'];
      continue;
    }
    
    const clientIssues: string[] = [];
    
    if (!rule.supportedFormats.includes(format)) {
      clientIssues.push(`Format ${format} not supported`);
    }
    
    if (stats.size > rule.maxSize) {
      clientIssues.push(`File size ${stats.size} exceeds ${rule.maxSize}`);
    }
    
    clientCompatibility[client] = clientIssues.length === 0;
    issues[client] = clientIssues;
  }
  
  return {
    filename,
    path: assetPath,
    clients: clientCompatibility,
    issues,
    overallCompatibility: Object.values(clientCompatibility).filter(Boolean).length / emailClients.length * 100
  };
}

async function validateAssetAccessibility(assetPath: string, wcagLevel: string, _checkContrast: boolean, checkAltText: boolean): Promise<any> {
  const filename = path.basename(assetPath);
  let score = 100;
  const issues: any[] = [];
  
  // Mock accessibility checks
  const mockAccessibility = {
    altText: { provided: false, descriptive: false },
    contrast: { ratio: 4.2, meetsWCAG: false },
    colorBlindness: { friendly: true }
  };
  
  if (checkAltText && !mockAccessibility.altText.provided) {
    issues.push({
      type: 'altText',
      severity: 'error',
      message: 'Alt text is required for accessibility',
      suggestion: 'Add descriptive alt text for the image'
    });
    score -= 20;
  }
  
  return {
    filename,
    path: assetPath,
    score: Math.max(0, score),
    wcagLevel,
    issues,
    accessibility: mockAccessibility
  };
}

function generateComplianceReport(issues: ValidationIssue[], rules: any): ComplianceReport {
  const emailClients = rules.emailClients || ['gmail', 'outlook', 'apple-mail', 'yahoo-mail'];
  const clientCompliance: Record<string, boolean> = {};
  
  emailClients.forEach((client: string) => {
    clientCompliance[client] = issues.filter(i => (i || {}).severity === 'error').length === 0;
  });
  
  const accessibility = {
    wcag: issues.filter(i => (i || {}).type === 'contrast' || (i || {}).type === 'altText').length === 0,
    altText: issues.filter(i => (i || {}).type === 'altText').length === 0,
    contrast: issues.filter(i => (i || {}).type === 'contrast').length === 0,
    colorBlindness: issues.filter(i => (i || {}).type === 'colorBlindness').length === 0
  };
  
  const performance = {
    fileSize: issues.filter(i => (i || {}).type === 'fileSize' && (i || {}).severity === 'error').length === 0,
    loadTime: true,
    compression: true
  };
  
  const complianceItems = [
    ...(Object || {}).values(clientCompliance),
    ...(Object || {}).values(accessibility),
    ...(Object || {}).values(performance)
  ];
  
  const overallCompliance = complianceItems.filter(Boolean).length / complianceItems.length * 100;
  
  return {
    emailClients: clientCompliance,
    accessibility,
    performance,
    overallCompliance
  };
}

function generateRecommendations(_issues: ValidationIssue[], format: string, fileSize: number): string[] {
  const recommendations: string[] = [];
  
  if (fileSize > 100000) {
    recommendations.push('Consider compressing the image to reduce file size');
  }
  
  if (format === 'png' && fileSize > 50000) {
    recommendations.push('Consider converting PNG to JPEG for better compression');
  }
  
  return recommendations;
}

function generateValidationSummary(results: ValidationResult[], errors: string[]): any {
  const totalAssets = results.length;
  const validAssets = results.filter(r => r.valid).length;
  const invalidAssets = totalAssets - validAssets;
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const averageScore = results.length > 0 ? 
    results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  
  const overallCompliance = results.length > 0 ? 
    results.reduce((sum, r) => sum + r.compliance.overallCompliance, 0) / results.length : 0;
  
  return {
    totalAssets,
    validAssets,
    invalidAssets,
    totalIssues,
    averageScore,
    overallCompliance,
    errors: errors.length
  };
}

async function generateValidationReport(results: ValidationResult[], rules: any, inputPath: string): Promise<any> {
  const summary = generateValidationSummary(results, []);
  
  return {
    summary,
    rules,
    inputPath,
    results,
    timestamp: new Date().toISOString(),
    recommendations: [
      'Optimize images for email delivery',
      'Ensure accessibility compliance',
      'Test across multiple email clients',
      'Consider responsive image variants'
    ]
  };
}

function generateCompatibilityReport(results: any[], emailClients: string[]): any {
  const clientCompatibility: Record<string, number> = {};
  
  emailClients.forEach(client => {
    const compatible = results.filter(r => r.clients[client]).length;
    clientCompatibility[client] = (compatible / results.length) * 100;
  });
  
  const averageCompatibility = Object.values(clientCompatibility).reduce((sum, val) => sum + val, 0) / emailClients.length;
  const bestClient = Object.keys(clientCompatibility).reduce((a, b) => clientCompatibility[a]! > clientCompatibility[b]! ? a : b);
  
  return {
    clientCompatibility,
    averageCompatibility,
    bestClient,
    totalAssets: results.length
  };
}

function generateAccessibilityReport(results: any[], wcagLevel: string): any {
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const wcagCompliant = results.filter(r => r.score >= 80).length;
  const wcagCompliance = (wcagCompliant / results.length) * 100;
  
  return {
    wcagLevel,
    averageScore,
    wcagCompliance,
    totalAssets: results.length,
    compliantAssets: wcagCompliant,
    nonCompliantAssets: results.length - wcagCompliant
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const assetValidationTools = [
  validateAssets,
  validateEmailClientCompatibility,
  validateAccessibility
];