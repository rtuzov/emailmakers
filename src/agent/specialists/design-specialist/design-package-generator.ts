/**
 * Design Package Generator
 * Generates comprehensive design package for Quality Assurance Specialist
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext } from './design-context';
import { calculateTechnicalCompliance, calculateAssetOptimization, calculateAccessibilityScore, calculateEmailClientCompatibility } from './design-helpers';

/**
 * Generate Comprehensive Design Package Tool
 * Creates complete design package with all artifacts for Quality Assurance Specialist review
 */
export const generateComprehensiveDesignPackage = tool({
  name: 'generateComprehensiveDesignPackage',
  description: 'Generate comprehensive design package with all artifacts for Quality Assurance Specialist review',
  parameters: z.object({
    handoff_directory: z.string().describe('Directory containing handoff files'),
    mjml_template: z.object({
      mjml_code: z.string().describe('Generated MJML code'),
      specifications_used: z.object({
        layout: z.string().describe('Layout specification used'),
        typography: z.string().describe('Typography specification used'),
        colors: z.string().describe('Color scheme specification used'),
        components: z.string().describe('Component specifications used')
      }).describe('Specifications used in template generation'),
      validation_status: z.string().describe('Template validation status'),
      file_path: z.string().describe('Path to MJML template file')
    }).describe('Generated MJML template data'),
    asset_manifest: z.object({
      images: z.array(z.object({
        id: z.string(),
        path: z.string(),
        original_path: z.string(),
        optimization_applied: z.string(),
        size_reduction: z.number(),
        alt_text: z.string()
      })).describe('Processed images with optimization details'),
      icons: z.array(z.object({
        id: z.string(),
        path: z.string(),
        format: z.string(),
        size: z.string()
      })).describe('Processed icons'),
      total_size: z.number().describe('Total asset size in bytes'),
      optimization_summary: z.string().describe('Asset optimization summary')
    }).describe('Asset manifest with optimization details'),
    preview_files: z.object({
      desktop_preview: z.string().describe('Path to desktop preview file'),
      mobile_preview: z.string().describe('Path to mobile preview file')
    }).describe('Generated preview files'),
    performance_metrics: z.object({
      load_time: z.number().describe('Estimated load time in milliseconds'),
      file_size: z.number().describe('Total file size in bytes'),
      image_optimization: z.number().describe('Image optimization percentage'),
      accessibility_score: z.number().describe('Accessibility score percentage')
    }).describe('Performance analysis metrics')
  }),
  execute: async (params) => {
    try {
      console.log(`📦 Generating comprehensive design package for: ${params.handoff_directory}`);
      
      // Load context to validate handoff directory
      const context = await buildDesignContext(params.handoff_directory);
      
      // Validate required context
      if (!context.contentContext) {
        throw new Error('Content context not found - cannot generate design package');
      }
      
      if (!context.technical_specification) {
        throw new Error('Technical specification not found - cannot generate design package');
      }
      
      // Validate MJML template
      if (!params.mjml_template.mjml_code) {
        throw new Error('MJML code is required for design package generation');
      }
      
      if (!params.mjml_template.specifications_used.typography) {
        throw new Error('Typography specification is required for design package');
      }
      
      // Validate asset manifest
      if (!params.asset_manifest.images || params.asset_manifest.images.length === 0) {
        throw new Error('Asset manifest must contain at least one image');
      }
      
      // Validate preview files
      if (!params.preview_files.desktop_preview || !params.preview_files.mobile_preview) {
        throw new Error('Both desktop and mobile preview files are required');
      }
      
      // Calculate quality metrics
      const technicalCompliance = calculateTechnicalCompliance({ mjml_template: params.mjml_template });
      const assetOptimization = calculateAssetOptimization(params.asset_manifest);
      const accessibilityScore = calculateAccessibilityScore({ accessibility_features: [] }); // Will be calculated based on actual features
      const emailClientCompatibility = calculateEmailClientCompatibility(params.asset_manifest, context.technical_specification);
      
      // Build comprehensive design package
      const designPackage = {
        package_info: {
          generated_at: new Date().toISOString(),
          campaign_id: context.contentContext.campaign_id || context.campaignId,
          design_specialist_version: '2.0.0',
          package_type: 'comprehensive_design_review'
        },
        template_specifications: {
          layout: params.mjml_template.specifications_used.layout,
          typography: params.mjml_template.specifications_used.typography,
          colors: params.mjml_template.specifications_used.colors,
          components: params.mjml_template.specifications_used.components,
          validation_status: params.mjml_template.validation_status,
          mjml_file_path: params.mjml_template.file_path
        },
        asset_summary: {
          total_images: params.asset_manifest.images.length,
          total_icons: params.asset_manifest.icons.length,
          total_size_kb: Math.round(params.asset_manifest.total_size / 1024),
          optimization_applied: params.asset_manifest.optimization_summary,
          images_with_alt_text: params.asset_manifest.images.filter(img => img.alt_text).length
        },
        quality_metrics: {
          technical_compliance: technicalCompliance,
          asset_optimization: assetOptimization,
          accessibility_score: accessibilityScore,
          email_client_compatibility: emailClientCompatibility,
          overall_quality_score: Math.round((technicalCompliance + assetOptimization + accessibilityScore + emailClientCompatibility) / 4)
        },
        preview_files: {
          desktop_preview: params.preview_files.desktop_preview,
          mobile_preview: params.preview_files.mobile_preview
        },
        performance_analysis: {
          estimated_load_time_ms: params.performance_metrics.load_time,
          total_file_size_bytes: params.performance_metrics.file_size,
          image_optimization_percentage: params.performance_metrics.image_optimization,
          accessibility_score_percentage: params.performance_metrics.accessibility_score
        },
        qa_checklist: {
          template_validation: params.mjml_template.validation_status === 'valid',
          asset_optimization: params.asset_manifest.optimization_summary.includes('optimized'),
          accessibility_compliance: params.asset_manifest.images.every(img => img.alt_text),
          preview_generation: true,
          performance_analysis: true
        },
        next_steps: [
          'Quality Assurance Specialist review',
          'Cross-client compatibility testing',
          'Performance optimization validation',
          'Accessibility compliance verification',
          'Final template approval'
        ]
      };
      
      // Save design package to handoff directory
      const packagePath = path.join(params.handoff_directory, 'design-package.json');
      await fs.writeFile(packagePath, JSON.stringify(designPackage, null, 2));
      
      console.log(`✅ Design package generated successfully!`);
      console.log(`📁 Package saved to: ${packagePath}`);
      console.log(`📊 Overall quality score: ${designPackage.quality_metrics.overall_quality_score}%`);
      console.log(`🎯 Technical compliance: ${technicalCompliance}%`);
      console.log(`🚀 Asset optimization: ${assetOptimization}%`);
      console.log(`♿ Accessibility score: ${accessibilityScore}%`);
      console.log(`📧 Email client compatibility: ${emailClientCompatibility}%`);
      
      return `Comprehensive design package generated successfully! Package includes template specifications, asset summary with ${params.asset_manifest.images.length} images and ${params.asset_manifest.icons.length} icons, quality metrics with ${designPackage.quality_metrics.overall_quality_score}% overall score, preview files for desktop and mobile, performance analysis, and QA checklist. Technical compliance: ${technicalCompliance}%. Asset optimization: ${assetOptimization}%. Accessibility score: ${accessibilityScore}%. Email client compatibility: ${emailClientCompatibility}%. Package saved to ${packagePath}. Ready for Quality Assurance Specialist review.`;
      
    } catch (error) {
      const errorMessage = `Failed to generate design package: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
}); 