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
  description: 'Load technical specification from campaign directory to understand design constraints and requirements',
  parameters: z.object({
    handoff_directory: z.string().describe('Directory containing handoff files from Content Specialist'),
  }),
  execute: async (params) => {
    try {
      console.log(`📋 Reading technical specification from: ${params.handoff_directory}`);
      
      // First try to load context from handoff files
      const context = await loadDesignContextFromHandoffDirectory(params.handoff_directory);
      
      let technicalSpec = context.technical_spec;
      
      // If not found in handoff files, try to load from docs/specifications
      if (!technicalSpec) {
        console.log(`📋 Technical specification not found in handoff files, trying docs/specifications...`);
        
        // Get campaign directory from handoff directory
        const campaignDir = path.dirname(params.handoff_directory);
        const specsPath = path.join(campaignDir, 'docs', 'specifications', 'technical-specification.json');
        
        try {
          const specsContent = await fs.readFile(specsPath, 'utf-8');
          technicalSpec = JSON.parse(specsContent);
          console.log(`✅ Technical specification loaded from: ${specsPath}`);
        } catch (specsError) {
          throw new Error(`Technical specification not found in handoff files or docs/specifications directory`);
        }
      }
      
      // Validate required technical specification
      if (!technicalSpec) {
        throw new Error('Technical specification not found');
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
    handoff_directory: z.string().describe('Directory containing handoff files'),
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
  execute: async (params) => {
    try {
      console.log(`📝 Documenting design decisions for: ${params.handoff_directory}`);
      
      // Load context to validate handoff directory
      const context = await loadDesignContextFromHandoffDirectory(params.handoff_directory);
      
      // Validate required context
      if (!context.content_context) {
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
        timestamp: new Date().toISOString(),
        campaign_id: context.content_context.campaign_id,
        layout_choice: params.design_decisions.layout_choice,
        color_strategy: params.design_decisions.color_strategy,
        typography_decisions: params.design_decisions.typography_decisions,
        component_structure: params.design_decisions.component_structure,
        responsive_approach: params.design_decisions.responsive_approach,
        accessibility_measures: params.design_decisions.accessibility_measures,
        performance_optimizations: params.design_decisions.performance_optimizations,
        client_compatibility: params.design_decisions.client_compatibility
      };
      
      // Save design decisions to handoff directory
      const decisionsPath = path.join(params.handoff_directory, 'design-decisions.json');
      await fs.writeFile(decisionsPath, JSON.stringify(designDecisions, null, 2));
      
      console.log(`✅ Design decisions documented successfully!`);
      console.log(`📁 Saved to: ${decisionsPath}`);
      
      // Log design decisions summary
      console.log(`🎨 Visual Style: ${context.content_context.asset_strategy?.visual_style}`);
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