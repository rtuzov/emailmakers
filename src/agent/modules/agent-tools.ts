/**
 * 🛠️ AGENT TOOLS MODULE
 * 
 * Central registry and exports for all agent tools used across the system.
 * Provides a unified interface for tool management and discovery.
 */

// Content generation tools
export { contentCreate } from '../tools/simple/content-create';
export { copyGenerate } from '../tools/simple/copy-generate';
export { variantsCreate } from '../tools/simple/variants-create';

// Design and asset tools  
// export { figmaAssetManager } from '../tools/consolidated/figma-asset-manager'; // Moved to useless/
export { figmaFolders } from '../tools/simple/figma-folders';
export { figmaSearch } from '../tools/simple/figma-search';

// Quality and validation tools
// export { qualityController } from '../tools/consolidated/quality-controller'; // Moved to useless/
export { accessibility } from '../tools/simple/accessibility';

// Delivery and deployment tools
// export { deliveryManager } from '../tools/consolidated/delivery-manager-fixed'; // Moved to useless/
export { campaignDeployment } from '../tools/simple/campaign-deployment';
export { s3Upload } from '../tools/simple/s3-upload';
export { screenshots } from '../tools/simple/screenshots';

// AI and ML tools  
export { aiQualityConsultant } from '../tools/ai-quality-consultant';

// Specialized tools
export { default as mjmlTool } from '../tools/mjml';
export { getLocalFigmaAssets } from '../tools/figma-local-processor';
export { finalEmailDelivery } from '../tools/final-email-delivery';
export { qualityValidation } from '../tools/quality-validation';

// Tool categories for organization
export const TOOL_CATEGORIES = {
  content: [
    'generateEmailContent',
    'contentCreate', 
    'brandVoiceAnalyzer'
  ],
  design: [
    // 'figmaAssetManager', // Moved to useless/
    'assetSplitter',
    'figmaFolders',
    'figmaSearch'
  ],
  quality: [
    // 'qualityController', // Moved to useless/
    'accessibilityTool',
    'htmlValidate',
    'emailTest'
  ],
  delivery: [
    // 'deliveryManager', // Moved to useless/
    'campaignDeployment',
    's3Upload',
    'screenshots'
  ],
  utility: [
    'emailOptimization',
    'iataCodeResolver',
    'dateTool',
    'pricesTool'
  ],
  ai: [
    'aiConsultant',
    'aiQualityConsultant',
    'externalImageAgent'
  ],
  specialized: [
    'mjmlTool',
    'emailRendererV2',
    'figmaLocalProcessor',
    'finalEmailDelivery',
    'qualityValidation'
  ]
} as const;

export type ToolCategory = keyof typeof TOOL_CATEGORIES;
export type ToolName = typeof TOOL_CATEGORIES[ToolCategory][number];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): string[] {
  return TOOL_CATEGORIES[category] as unknown as string[];
}

/**
 * Get all available tools
 */
export function getAllTools(): string[] {
  return Object.values(TOOL_CATEGORIES).flat() as string[];
}

/**
 * Check if a tool exists
 */
export function toolExists(toolName: string): boolean {
  return getAllTools().includes(toolName);
}