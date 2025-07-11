/**
 * Design Specialist Tools - Modular Architecture
 * Exports all design specialist tools and utilities
 */

// Import asset manifest and technical specification generators
import { generateAssetManifest } from '../../tools/asset-preparation/asset-manifest-generator';
import { generateTechnicalSpecification } from '../../tools/technical-specification/technical-spec-generator';

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
export { validateAndCorrectHtml } from './html-validator';

// Export the imported generators
export { generateAssetManifest, generateTechnicalSpecification };

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
import { validateAndCorrectHtml } from './html-validator';
import { finalizeDesignAndTransferToQuality } from '../../core/specialist-finalization-tools';

/**
 * All Design Specialist tools in recommended workflow order
 * UPDATED: Asset Manifest Generation and Technical Specification Generation moved to first
 */
export const designSpecialistTools = [
  loadDesignContext,             // Step 0: Load context from handoff files
  generateAssetManifest,         // Step 1: 📋 === ASSET MANIFEST GENERATION STARTED ===
  generateTechnicalSpecification, // Step 2: 📋 === TECHNICAL SPECIFICATION GENERATION STARTED ===
  processContentAssets,          // Step 3: Process content assets (now reads from generated manifest)
  generateTemplateDesign,        // Step 4: AI template design
  generateMjmlTemplate,          // Step 5: MJML generation
  readTechnicalSpecification,    // Step 6: Read tech specs (now reads from generated spec)
  documentDesignDecisions,       // Step 7: Document decisions
  generatePreviewFiles,          // Step 8: Generate previews
  validateAndCorrectHtml,        // Step 9: Validate and correct HTML
  analyzePerformance,            // Step 10: Performance analysis
  generateComprehensiveDesignPackage, // Step 11: Comprehensive package
  createDesignHandoff,           // Step 12: Create handoff for QA
  finalizeDesignAndTransferToQuality // Step 13: CRITICAL - Transfer to Quality Specialist
];

/**
 * Design Specialist workflow order reference
 * UPDATED: Asset Manifest Generation and Technical Specification Generation first
 */
export const designWorkflowSteps = [
  'loadDesignContext',           // Step 0: Load context from handoff files
  'generateAssetManifest',       // Step 1: 📋 === ASSET MANIFEST GENERATION STARTED ===
  'generateTechnicalSpecification', // Step 2: 📋 === TECHNICAL SPECIFICATION GENERATION STARTED ===
  'processContentAssets',        // Step 3: Process content assets (reads from generated manifest)
  'generateTemplateDesign',      // Step 4: AI template design
  'generateMjmlTemplate',        // Step 5: MJML generation
  'readTechnicalSpecification',  // Step 6: Read tech specs (reads from generated spec)
  'documentDesignDecisions',     // Step 7: Document decisions
  'generatePreviewFiles',        // Step 8: Generate previews
  'validateAndCorrectHtml',      // Step 9: Validate and correct HTML
  'analyzePerformance',          // Step 10: Performance analysis
  'generateComprehensiveDesignPackage', // Step 11: Comprehensive package
  'createDesignHandoff'          // Step 12: Create handoff for QA
];

/**
 * Tool registry mapping for easy access
 * UPDATED: Include asset manifest and technical specification generators
 */
export const designToolRegistry = {
  loadDesignContext,
  generateAssetManifest,
  generateTechnicalSpecification,
  processContentAssets,
  generateTemplateDesign,
  generateMjmlTemplate,
  readTechnicalSpecification,
  documentDesignDecisions,
  generatePreviewFiles,
  validateAndCorrectHtml,
  analyzePerformance,
  generateComprehensiveDesignPackage,
  createDesignHandoff
}; 