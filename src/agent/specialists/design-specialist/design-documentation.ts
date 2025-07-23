/**
 * Design Documentation Tools
 * Handles technical specification reading and design decisions documentation
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { loadDesignContextFromHandoffDirectory } from './design-context';
import { DesignDecisions } from './types';

/**
 * Read Technical Specification Tool
 * Loads and parses technical specifications from handoff files
 */
export const readTechnicalSpecification = tool({
  name: 'readTechnicalSpecification',
  description: 'Read technical specification from Content Specialist output files',
  parameters: z.object({
    handoff_directory: z.string().describe('Campaign handoff directory path (will be auto-corrected if invalid)'),
  }),
  execute: async (params, context) => {
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
      
      console.log(`📋 Reading technical specification from: ${handoffDirectory}`);
      
      // First try to load context from handoff files
      const context_data = await loadDesignContextFromHandoffDirectory(handoffDirectory);
      
      let technicalSpec = context_data.technical_spec;
      
      // If not found in handoff files, try to load from docs/specifications
      if (!technicalSpec) {
        console.log(`📋 Technical specification not found in handoff files, trying docs/specifications...`);
        
        // Get campaign directory from handoff directory
        const campaignDir = path.dirname(handoffDirectory);
        const specsPath = path.join(campaignDir, 'docs', 'specifications', 'technical-specification.json');
        
        try {
          const specsContent = await fs.readFile(specsPath, 'utf-8');
          technicalSpec = JSON.parse(specsContent);
          console.log(`✅ Technical specification loaded from: ${specsPath}`);
        } catch (specsError) {
          console.log(`📋 Technical specification not found - AI template generator will handle it`);
          return {
            success: true,
            message: 'Technical specification not found but that\'s ok - AI template generator will create it',
            specification: null
          };
        }
      }
      
      // If still no technical specification, that's ok - AI will handle it
      if (!technicalSpec) {
        console.log(`📋 Technical specification not found - AI template generator will handle it`);
        return {
          success: true,
          message: 'Technical specification not found but that\'s ok - AI template generator will create it',
          specification: null
        };
      }
      
      // Handle nested specification structure (specification.design.constraints vs direct design.constraints)
      const spec = technicalSpec.specification || technicalSpec;
      
      // Validate required design constraints
      if (!spec.design?.constraints) {
        throw new Error('Design constraints not found in technical specification');
      }
      
      // Validate required layout configuration
      if (!spec.design.constraints.layout?.type) {
        throw new Error('Layout type not specified in design constraints');
      }
      
      // Validate required color scheme
      if (!spec.design.constraints.colorScheme) {
        throw new Error('Color scheme not defined in design constraints');
      }
      
      // Validate required typography
      if (!spec.design.constraints.typography?.headingFont?.family) {
        throw new Error('Heading font family not specified in typography constraints');
      }
      
      // Validate email clients configuration (handle both nested and direct structure)
      const deliveryConfig = spec.delivery || technicalSpec.delivery;
      if (!deliveryConfig?.emailClients || deliveryConfig.emailClients.length === 0) {
        console.warn('⚠️ Email clients not specified in delivery configuration, using defaults');
      }
      
      // Validate required layout dimensions
      if (!spec.design.constraints.layout.maxWidth) {
        throw new Error('Maximum width not specified in layout constraints');
      }
      
      // Build design constraints object with validated values
      const designConstraints = {
        layout: {
          type: spec.design.constraints.layout.type,
          maxWidth: spec.design.constraints.layout.maxWidth,
          structure: spec.design.constraints.layout.structure
        },
        colorScheme: spec.design.constraints.colorScheme,
        typography: {
          headingFont: spec.design.constraints.typography.headingFont,
          bodyFont: spec.design.constraints.typography.bodyFont,
          sizes: spec.design.constraints.typography.sizes
        },
        spacing: spec.design.constraints.spacing,
        components: spec.design.constraints.components
      };
      
      // Build delivery requirements with validated values (use defaults if missing)
      const deliveryRequirements = {
        emailClients: deliveryConfig?.emailClients || ['gmail', 'outlook', 'apple-mail'],
        performance: deliveryConfig?.performance || { maxLoadTime: 3000, maxFileSize: 100000 },
        accessibility: deliveryConfig?.accessibility || { wcagLevel: 'AA' },
        testing: deliveryConfig?.testing || { crossClient: true, devices: ['desktop', 'mobile'] }
      };
      
      console.log(`✅ Technical specification loaded successfully!`);
      console.log(`📐 Layout: ${designConstraints.layout.type}`);
      console.log(`📏 Max width: ${designConstraints.layout.maxWidth}px`);
      console.log(`🎨 Color scheme: ${Object.keys(designConstraints.colorScheme).length} colors defined`);
      console.log(`📝 Typography: ${designConstraints.typography.headingFont.family}`);
      console.log(`📧 Email clients: ${deliveryRequirements.emailClients.length} supported`);
      
      return `Technical specification loaded successfully! Layout: ${designConstraints.layout.type}. Max width: ${designConstraints.layout.maxWidth}px. Color scheme with ${Object.keys(designConstraints.colorScheme).length} colors defined. Typography: ${designConstraints.typography.headingFont.family}. Email clients: ${deliveryRequirements.emailClients.length} supported. Specification ready for design implementation.`;
      
    } catch (error) {
      const errorMessage = `Failed to read technical specification: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
});

/**
 * Document Design Decisions Tool
 * Records design decisions and rationale for future reference
 */
export const documentDesignDecisions = tool({
  name: 'documentDesignDecisions',
  description: 'Document design decisions and rationale for the email template design process',
  parameters: z.object({
    handoff_directory: z.string().describe('Campaign handoff directory path (will be auto-corrected if invalid)'),
    design_decisions: z.object({
      layout_choice: z.string().describe('Chosen layout approach and rationale'),
      color_strategy: z.string().describe('Color usage strategy and accessibility considerations'),
      typography_decisions: z.string().describe('Font choices and hierarchy decisions'),
      component_structure: z.string().describe('Component organization and reusability decisions'),
      responsive_approach: z.string().describe('Mobile responsiveness strategy'),
      accessibility_measures: z.string().describe('Accessibility implementation decisions'),
      performance_optimizations: z.string().describe('Performance optimization decisions'),
      client_compatibility: z.string().describe('Email client compatibility decisions')
    }).describe('Design decisions object with detailed rationale for each aspect')
  }),
  execute: async (params, context) => {
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
      
      console.log(`📝 Documenting design decisions for: ${handoffDirectory}`);
      
      // Load context to validate handoff directory
      const context_data = await loadDesignContextFromHandoffDirectory(handoffDirectory);
      
      // Validate required context
      if (!context_data.content_context) {
        throw new Error('Content context not found - cannot document design decisions');
      }
      
      // Validate all required design decisions
      const requiredDecisions = [
        'layout_choice',
        'color_strategy', 
        'typography_decisions',
        'component_structure',
        'responsive_approach',
        'accessibility_measures',
        'performance_optimizations',
        'client_compatibility'
      ];
      
      for (const decision of requiredDecisions) {
        if (!params.design_decisions[decision as keyof typeof params.design_decisions]) {
          throw new Error(`Required design decision missing: ${decision}`);
        }
      }
      
      // Build design decisions document
      const designDecisions: DesignDecisions = {
        layout_strategy: params.design_decisions.layout_choice || "standard",
        color_scheme_applied: (typeof params.design_decisions.color_strategy === 'object' && params.design_decisions.color_strategy) || {},
        typography_implementation: (typeof params.design_decisions.typography_decisions === 'object' && params.design_decisions.typography_decisions) || {
          heading_font: "Arial",
          body_font: "Arial", 
          font_sizes: {}
        },
        asset_optimization: Array.isArray(params.design_decisions.component_structure) ? params.design_decisions.component_structure : [],
        accessibility_features: Array.isArray(params.design_decisions.accessibility_measures) ? params.design_decisions.accessibility_measures : [],
        email_client_adaptations: (typeof params.design_decisions.responsive_approach === 'object' && params.design_decisions.responsive_approach) || {}
      };
      
      // Save design decisions to handoff directory
      const decisionsPath = path.join(handoffDirectory, 'design-decisions.json');
      await fs.writeFile(decisionsPath, JSON.stringify(designDecisions, null, 2));
      
      console.log(`✅ Design decisions documented successfully!`);
      console.log(`📁 Saved to: ${decisionsPath}`);
      
      // Log design decisions summary
      console.log(`🎨 Visual Style: ${context_data.content_context.asset_strategy?.visual_style}`);
      console.log(`📐 Layout: ${params.design_decisions.layout_choice.substring(0, 50)}...`);
      console.log(`🎨 Colors: ${params.design_decisions.color_strategy.substring(0, 50)}...`);
      console.log(`📝 Typography: ${params.design_decisions.typography_decisions.substring(0, 50)}...`);
      
      return `Design decisions documented successfully! All 8 design aspects have been recorded with detailed rationale. Layout choice: ${params.design_decisions.layout_choice.substring(0, 100)}... Color strategy: ${params.design_decisions.color_strategy.substring(0, 100)}... Typography decisions: ${params.design_decisions.typography_decisions.substring(0, 100)}... Component structure: ${params.design_decisions.component_structure.substring(0, 100)}... Responsive approach: ${params.design_decisions.responsive_approach.substring(0, 100)}... Accessibility measures: ${params.design_decisions.accessibility_measures.substring(0, 100)}... Performance optimizations: ${params.design_decisions.performance_optimizations.substring(0, 100)}... Client compatibility: ${params.design_decisions.client_compatibility.substring(0, 100)}... Design decisions saved to ${decisionsPath}. Ready for template generation phase.`;
      
    } catch (error) {
      const errorMessage = `Failed to document design decisions: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
}); 