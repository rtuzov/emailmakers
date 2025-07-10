/**
 * 📦 ASSET PREPARATION TOOLS - Complete Suite
 * 
 * Comprehensive asset preparation tools for email campaign creation including:
 * - Asset collection from multiple sources
 * - Image optimization for email delivery
 * - Comprehensive validation and compliance checking
 * 
 * All tools are context-aware and integrate with OpenAI Agents SDK.
 */

// Asset Collection Tools
export {
  validateAssets as validateAssetsBasic,
  assetCollectionTools
} from './asset-collector';

// Asset Optimization Tools
export {
  optimizeAssets,
  assetOptimizationTools
} from './asset-optimizer';

// Asset Validation Tools
export {
  validateAssets,
  validateEmailClientCompatibility,
  validateAccessibility,
  assetValidationTools
} from './asset-validator';

// Asset Manifest Generation Tools
export {
  generateAssetManifest
} from './asset-manifest-generator';

// ============================================================================
// CONSOLIDATED ASSET PREPARATION TOOLS
// ============================================================================

import { assetCollectionTools } from './asset-collector';
import { assetOptimizationTools } from './asset-optimizer';
import { assetValidationTools } from './asset-validator';
import { generateAssetManifest } from './asset-manifest-generator';

// Create manifest generation tools array
const assetManifestGenerationTools = [generateAssetManifest];

/**
 * Complete suite of asset preparation tools
 */
export const assetPreparationTools = [
  ...assetCollectionTools,
  ...assetOptimizationTools,
  ...assetValidationTools,
  ...assetManifestGenerationTools
];

/**
 * Asset preparation workflow categories
 */
export const assetPreparationCategories = {
  collection: assetCollectionTools,
  optimization: assetOptimizationTools,
  validation: assetValidationTools,
  manifestGeneration: assetManifestGenerationTools
};

// Export for backward compatibility
export { assetManifestGenerationTools };

/**
 * Asset preparation tool registry for specialist agents
 */
export const assetPreparationRegistry = {
  tools: assetPreparationTools,
  categories: assetPreparationCategories,
  count: assetPreparationTools.length,
  description: 'Context-aware asset preparation tools for email campaigns'
};

// ============================================================================
// WORKFLOW HELPERS
// ============================================================================

/**
 * Get tools by category
 */
export function getAssetToolsByCategory(category: 'collection' | 'optimization' | 'validation' | 'manifestGeneration') {
  return assetPreparationCategories[category];
}

/**
 * Get all asset preparation tool names
 */
export function getAssetToolNames(): string[] {
  return assetPreparationTools.map(tool => tool.name);
}

/**
 * Asset preparation workflow summary
 */
export function getAssetPreparationSummary() {
  return {
    totalTools: assetPreparationTools.length,
    categories: Object.keys(assetPreparationCategories),
    toolNames: getAssetToolNames(),
    capabilities: [
      'Multi-source asset collection',
      'Email-optimized image compression',
      'Responsive image generation',
      'Email client compatibility validation',
      'Accessibility compliance checking',
      'Performance optimization',
      'Context-aware workflow integration',
      'Comprehensive asset manifest generation',
      'Usage instructions for Design Specialist',
      'Asset requirement analysis from content context'
    ]
  };
}