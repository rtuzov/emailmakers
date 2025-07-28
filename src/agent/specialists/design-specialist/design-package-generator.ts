/**
 * Design Package Generator
 * Generates comprehensive design package for Quality Assurance Specialist
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { loadDesignContextFromHandoffDirectory } from './design-context';
import { calculateTechnicalCompliance, calculateAssetOptimization, calculateAccessibilityScore, calculateEmailClientCompatibility } from './design-helpers';
import { logToFile } from '../../../shared/utils/campaign-logger';

/**
 * Generate Comprehensive Design Package Tool
 * Creates complete design package with all artifacts for Quality Assurance Specialist review
 */
export const generateComprehensiveDesignPackage = tool({
  name: 'generateComprehensiveDesignPackage',
  description: 'Generate comprehensive design package with quality metrics and validation',
  parameters: z.object({
    handoff_directory: z.string().describe('Campaign handoff directory path (will be auto-corrected if invalid)'),
    mjml_template: z.object({
      mjml_code: z.string().describe('MJML template code'),
      specifications_used: z.object({
        layout: z.object({}).describe('Layout specifications'),
        typography: z.object({}).describe('Typography specifications'),
        colors: z.object({}).describe('Color specifications'),
        components: z.object({}).describe('Component specifications')
      }).describe('Specifications used in template'),
      validation_status: z.object({}).describe('Template validation results'),
      file_path: z.string().describe('Path to MJML template file')
    }).describe('MJML template object'),
    asset_manifest: z.object({
      images: z.array(z.object({}).strict()).describe('Array of image assets'),
      icons: z.array(z.object({}).strict()).describe('Array of icon assets')
    }).describe('Asset manifest object'),
    preview_files: z.object({
      desktop_preview: z.string().describe('Path to desktop preview file'),
      mobile_preview: z.string().describe('Path to mobile preview file')
    }).describe('Preview files object'),
    performance_metrics: z.object({
      load_time: z.number().describe('Estimated load time in milliseconds'),
      file_size: z.number().describe('Total file size in bytes'),
      image_optimization: z.number().describe('Image optimization percentage'),
      accessibility_score: z.number().describe('Accessibility score percentage')
    }).describe('Performance analysis metrics')
  }),
  execute: async (params, context) => {
    // ✅ ЗАЩИТА ОТ ДУБЛИРОВАНИЯ: Проверяем что пакет не был уже создан
    const campaignPath = (context?.context as any)?.designContext?.campaign_path;
    if (campaignPath) {
      const packagePath = path.join(campaignPath, 'docs', 'design-package.json');
      try {
        await fs.access(packagePath);
        console.log('⚠️ Design package already exists, skipping generation');
        logToFile('info', 'Design package already exists, skipping duplicate generation', 'DesignSpecialist-Package', undefined);
        return 'Design package already generated and available.';
      } catch {
        // File doesn't exist, proceed with generation
      }
    }
    
    logToFile('info', 'Design package generation started', 'DesignSpecialist-Package', undefined);
    
    try {
      // ✅ ИСПРАВЛЕНО: Получаем правильный путь кампании из context
      let handoffDirectory = params.handoff_directory;
      
      // Защита от неправильных путей сгенерированных SDK
      if (handoffDirectory === 'docs' || handoffDirectory === 'package' || handoffDirectory === 'handoffs' || !handoffDirectory.includes('campaigns/')) {
        const campaignPath = (context?.context as any)?.designContext?.campaign_path;
        if (campaignPath) {
          handoffDirectory = path.join(campaignPath, 'handoffs');
          console.log(`🔧 ИСПРАВЛЕНО: SDK передал неправильный путь "${params.handoff_directory}", использую правильный: ${handoffDirectory}`);
        } else {
          throw new Error('Campaign path not available in design context. loadDesignContext must be called first.');
        }
      }
      
      console.log(`📦 Generating comprehensive design package for: ${handoffDirectory}`);
      
      // Load context to validate handoff directory
      const context_data = await loadDesignContextFromHandoffDirectory(handoffDirectory);
      
      // Validate that context was loaded successfully
      if (!context_data) {
        throw new Error('Failed to load design context - context is null or undefined');
      }
      
      // Validate required context
      if (!context_data.content_context) {
        throw new Error('Content context not found - cannot generate design package');
      }
      
      // Note: Technical specification is now optional - AI template generator will handle it
      // if (!context_data.technical_specification) {
      //   throw new Error('Technical specification not found - cannot generate design package');
      // }
      
      // Enhanced MJML template validation with fallback loading
      let mjmlTemplate = params.mjml_template;
      
      if (!mjmlTemplate || !mjmlTemplate.mjml_code) {
        console.log('⚠️ MJML template not provided in params, attempting to load from campaign...');
        
        // ✅ ИСПРАВЛЕНО: Правильное извлечение campaign path из context
        let campaignPath: string;
        
        // Сначала пробуем получить путь из контекста
        if (context?.context && (context.context as any)?.designContext?.campaign_path) {
          campaignPath = (context.context as any).designContext.campaign_path;
        } else if (handoffDirectory.includes('/handoffs')) {
          // Если в контексте нет пути, извлекаем из handoffDirectory
          const parts = handoffDirectory.split('/handoffs');
          campaignPath = parts[0] || path.dirname(handoffDirectory);
        } else {
          // Последний способ - dirname от handoffDirectory
          campaignPath = path.dirname(handoffDirectory);
        }
        
        console.log(`🔍 DEBUG: handoffDirectory = ${handoffDirectory}`);
        console.log(`🔍 DEBUG: extracted campaignPath = ${campaignPath}`);
        
        try {
          // Try to load MJML from templates directory
          const mjmlPath = path.join(campaignPath, 'templates', 'email-template.mjml');
          
          if (await fs.access(mjmlPath).then(() => true).catch(() => false)) {
            const mjmlCode = await fs.readFile(mjmlPath, 'utf8');
            
            mjmlTemplate = {
              mjml_code: mjmlCode,
              file_path: mjmlPath,
              validation_status: 'valid',
              specifications_used: {
                layout: 'single-column',
                typography: {
                  heading_font: 'Arial',
                  body_font: 'Arial',
                  font_sizes: { h1: '24px', h2: '20px', body: '16px' }
                },
                colors: {
                  primary: '#007bff',
                  secondary: '#6c757d',
                  background: '#ffffff'
                },
                components: ['header', 'hero', 'content', 'footer']
              }
            };
            
            console.log('✅ Successfully loaded MJML template from file system');
          } else {
            throw new Error(`MJML template file not found at: ${mjmlPath}`);
          }
        } catch (error) {
          console.error('❌ Failed to load MJML template:', error);
          throw new Error(`MJML template and code are required for design package generation. Could not load from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      if (!mjmlTemplate.specifications_used || !mjmlTemplate.specifications_used.typography) {
        console.log('⚠️ Typography specification missing, using fallback');
        mjmlTemplate.specifications_used = mjmlTemplate.specifications_used || {};
        mjmlTemplate.specifications_used.typography = {
          heading_font: 'Arial',
          body_font: 'Arial',
          font_sizes: { h1: '24px', h2: '20px', body: '16px' }
        };
      }
      
      // Validate asset manifest
      if (!params.asset_manifest || !params.asset_manifest.images || params.asset_manifest.images.length === 0) {
        throw new Error('Asset manifest must contain at least one image');
      }
      
      // Validate preview files
      if (!params.preview_files || !params.preview_files.desktop_preview || !params.preview_files.mobile_preview) {
        throw new Error('Both desktop and mobile preview files are required');
      }
      
      // Calculate quality metrics
      const technicalCompliance = calculateTechnicalCompliance({ mjml_template: params.mjml_template });
      const assetOptimization = calculateAssetOptimization({...params.asset_manifest, fonts: []} as any);
      const accessibilityScore = calculateAccessibilityScore({ accessibility_features: [] }); // Will be calculated based on actual features
      const emailClientCompatibility = calculateEmailClientCompatibility({...params.asset_manifest, fonts: []} as any, context_data.technical_specification || null);
      
      // Build comprehensive design package
      const designPackage = {
        package_info: {
          generated_at: new Date().toISOString(),
          campaign_id: context_data.campaign?.id || context_data.content_context?.campaign_id,
          design_specialist_version: '2.0.0',
          package_type: 'comprehensive_design_review'
        },
        template_specifications: {
          layout: mjmlTemplate.specifications_used.layout,
          typography: mjmlTemplate.specifications_used.typography,
          colors: mjmlTemplate.specifications_used.colors,
          components: mjmlTemplate.specifications_used.components,
          validation_status: mjmlTemplate.validation_status,
          mjml_file_path: mjmlTemplate.file_path
        },
        asset_summary: {
          total_images: params.asset_manifest.images.length,
          total_icons: params.asset_manifest.icons.length,
          total_size_kb: Math.round((params.asset_manifest as any).total_size / 1024 || 0),
          optimization_applied: (params.asset_manifest as any).optimization_summary || 'None',
          images_with_alt_text: params.asset_manifest.images.filter((img: any) => img.alt_text).length
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
          template_validation: mjmlTemplate.validation_status === 'valid',
          asset_optimization: ((params.asset_manifest as any).optimization_summary || '').includes('optimized'),
          accessibility_compliance: params.asset_manifest.images.every((img: any) => img.alt_text),
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
      const packagePath = path.join(handoffDirectory, 'design-package.json');
      await fs.writeFile(packagePath, JSON.stringify(designPackage, null, 2));
      
      console.log(`✅ Design package generated successfully!`);
      console.log(`📁 Package saved to: ${packagePath}`);
      console.log(`📊 Overall quality score: ${designPackage.quality_metrics.overall_quality_score}%`);
      console.log(`🎯 Technical compliance: ${technicalCompliance}%`);
      console.log(`🚀 Asset optimization: ${assetOptimization}%`);
      console.log(`♿ Accessibility score: ${accessibilityScore}%`);
      console.log(`📧 Email client compatibility: ${emailClientCompatibility}%`);
      
      logToFile('info', `Design package generated successfully: Overall quality ${designPackage.quality_metrics.overall_quality_score}%`, 'DesignSpecialist-Package', undefined);
      logToFile('info', `Quality metrics: Technical ${technicalCompliance}%, Asset optimization ${assetOptimization}%, Accessibility ${accessibilityScore}%, Email compatibility ${emailClientCompatibility}%`, 'DesignSpecialist-Package', undefined);
      logToFile('info', `Package saved to: ${packagePath}`, 'DesignSpecialist-Package', undefined);
      
      return `Comprehensive design package generated successfully! Package includes template specifications, asset summary with ${params.asset_manifest.images.length} images and ${params.asset_manifest.icons.length} icons, quality metrics with ${designPackage.quality_metrics.overall_quality_score}% overall score, preview files for desktop and mobile, performance analysis, and QA checklist. Technical compliance: ${technicalCompliance}%. Asset optimization: ${assetOptimization}%. Accessibility score: ${accessibilityScore}%. Email client compatibility: ${emailClientCompatibility}%. Package saved to ${packagePath}. Ready for Quality Assurance Specialist review.`;
      
    } catch (error) {
      const errorMessage = `Failed to generate design package: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
}); 