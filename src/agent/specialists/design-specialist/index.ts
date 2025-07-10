/**
 * Design Specialist Tools - Modular Architecture
 * Exports all design specialist tools and utilities
 */

// Export all tools
export { loadDesignContext } from './design-context';
export { processContentAssets } from './asset-processor';
export { generateTemplateDesign } from './ai-template-designer';
export { generateMjmlTemplate } from './mjml-generator';
export { readTechnicalSpecification, documentDesignDecisions } from './design-documentation';
export { generatePreviewFiles } from './preview-generator';
export { analyzePerformance } from './performance-analyzer';
export { generateComprehensiveDesignPackage } from './design-package-generator';
export { createDesignHandoff } from './design-handoff';

// Export types and utilities
export * from './types';
export * from './design-helpers';

// Import all tools for registry
import { loadDesignContext } from './design-context';
import { processContentAssets } from './asset-processor';
import { generateTemplateDesign } from './ai-template-designer';
import { generateMjmlTemplate } from './mjml-generator';
import { readTechnicalSpecification, documentDesignDecisions } from './design-documentation';
import { generatePreviewFiles } from './preview-generator';
import { analyzePerformance } from './performance-analyzer';
import { generateComprehensiveDesignPackage } from './design-package-generator';
import { createDesignHandoff } from './design-handoff';

/**
 * All Design Specialist tools in recommended workflow order
 */
export const designSpecialistTools = [
  loadDesignContext,             // Step 0: Load context from handoff files
  processContentAssets,          // Step 1: Process content assets
  generateTemplateDesign,        // Step 2: AI template design
  generateMjmlTemplate,          // Step 3: MJML generation
  readTechnicalSpecification,    // Step 4: Read tech specs
  documentDesignDecisions,       // Step 5: Document decisions
  generatePreviewFiles,          // Step 6: Generate previews
  analyzePerformance,            // Step 7: Performance analysis
  generateComprehensiveDesignPackage, // Step 8: Comprehensive package
  createDesignHandoff            // Step 9: Create handoff for QA
];

/**
 * Design Specialist workflow order reference
 */
export const designWorkflowSteps = [
  'loadDesignContext',           // Step 0: Load context from handoff files
  'processContentAssets',        // Step 1: Process content assets
  'generateTemplateDesign',      // Step 2: AI template design
  'generateMjmlTemplate',        // Step 3: MJML generation
  'readTechnicalSpecification',  // Step 4: Read tech specs
  'documentDesignDecisions',     // Step 5: Document decisions
  'generatePreviewFiles',        // Step 6: Generate previews
  'analyzePerformance',          // Step 7: Performance analysis
  'generateComprehensiveDesignPackage', // Step 8: Comprehensive package
  'createDesignHandoff'          // Step 9: Create handoff for QA
];

/**
 * Tool registry mapping for easy access
 */
export const designToolRegistry = {
  loadDesignContext,
  processContentAssets,
  generateTemplateDesign,
  generateMjmlTemplate,
  readTechnicalSpecification,
  documentDesignDecisions,
  generatePreviewFiles,
  analyzePerformance,
  generateComprehensiveDesignPackage,
  createDesignHandoff
}; 