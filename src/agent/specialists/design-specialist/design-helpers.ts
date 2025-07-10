/**
 * Helper functions for Design Specialist modules
 */

import { AssetManifest, AssetImage, AssetIcon } from './types';

/**
 * Update email client support based on format and target clients
 */
export function updateEmailClientSupport(format: string, emailClients: any[]): any {
  const support: any = {};
  
  emailClients.forEach(client => {
    const clientName = client.client || client.name || client;
    
    switch (format) {
      case 'svg':
        support[clientName] = clientName !== 'outlook'; // SVG not supported in Outlook
        break;
      case 'webp':
        support[clientName] = !['outlook', 'yahoo-mail'].includes(clientName); // WebP limited support
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
        support[clientName] = true; // Universal support
        break;
      default:
        support[clientName] = true;
    }
  });
  
  return support;
}

/**
 * Check if format is supported by target email clients
 */
export function isFormatSupportedByClients(format: string, emailClients: any[]): boolean {
  const support = updateEmailClientSupport(format, emailClients);
  const supportValues = Object.values(support);
  return supportValues.length > 0 && supportValues.every(supported => supported === true);
}

/**
 * Enhance asset manifest with technical specification constraints
 */
export function enhanceAssetManifestWithTechSpec(assetManifest: AssetManifest, techSpec: any): AssetManifest {
  const layoutConstraints = techSpec.specification?.design?.constraints?.layout || {};
  const emailClients = techSpec.specification?.delivery?.emailClients || [];
  const maxWidth = layoutConstraints.maxWidth || 600;
  
  // Clone the manifest to avoid mutation
  const enhancedManifest = JSON.parse(JSON.stringify(assetManifest));
  
  // Update images with technical constraints
  enhancedManifest.images = enhancedManifest.images.map((image: AssetImage) => ({
    ...image,
    // Ensure dimensions respect max width constraint
    dimensions: {
      ...image.dimensions,
      width: Math.min(image.dimensions?.width || maxWidth, maxWidth),
      height: image.dimensions?.height || Math.round((image.dimensions?.width || maxWidth) * 0.6)
    },
    // Update email client support based on technical specification
    email_client_support: updateEmailClientSupport(image.format || 'jpg', emailClients),
    // Add technical compliance flag
    technical_compliance: {
      max_width_respected: (image.dimensions?.width || maxWidth) <= maxWidth,
      format_supported: isFormatSupportedByClients(image.format || 'jpg', emailClients),
      size_optimized: (image.file_size || 0) <= 100000 // 100KB max for email
    }
  }));
  
  // Update icons with technical constraints
  enhancedManifest.icons = enhancedManifest.icons.map((icon: AssetIcon) => ({
    ...icon,
    // Update email client support based on technical specification
    email_client_support: updateEmailClientSupport(icon.format || 'png', emailClients),
    // Add technical compliance flag
    technical_compliance: {
      format_supported: isFormatSupportedByClients(icon.format || 'png', emailClients),
      size_optimized: (icon.file_size || 0) <= 10000 // 10KB max for icons
    }
  }));
  
  return enhancedManifest;
}

/**
 * Generate asset usage instructions
 */
export function generateAssetUsageInstructions(assetManifest: AssetManifest, contentContext: any): any[] {
  const instructions = [];
  
  // Generate instructions for images
  assetManifest.images.forEach((image: AssetImage) => {
    instructions.push({
      asset_id: image.id,
      asset_type: 'image',
      usage_context: image.usage || 'general',
      placement_instructions: getImagePlacementInstructions(image),
      responsive_behavior: getResponsiveBehavior(image),
      accessibility_requirements: {
        alt_text: image.alt_text || 'Image description required',
        wcag_compliant: image.technical_compliance?.max_width_respected || false
      },
      email_client_notes: getEmailClientNotes(image),
      performance_considerations: {
        file_size: image.file_size,
        load_time_estimate: 'N/A',
        optimization_applied: image.optimized || false
      }
    });
  });
  
  // Generate instructions for icons
  assetManifest.icons.forEach((icon: AssetIcon) => {
    instructions.push({
      asset_id: icon.id,
      asset_type: 'icon',
      usage_context: icon.usage || 'general',
      placement_instructions: getIconPlacementInstructions(icon),
      accessibility_requirements: {
        alt_text: icon.alt_text || 'Icon description required',
        wcag_compliant: icon.technical_compliance?.format_supported || false
      },
      email_client_notes: getEmailClientNotes(icon),
      performance_considerations: {
        file_size: icon.file_size,
        optimization_applied: icon.optimized || false
      }
    });
  });
  
  return instructions;
}

function getImagePlacementInstructions(image: AssetImage): string {
  switch (image.usage) {
    case 'hero':
      return 'Place as full-width header image at top of email template';
    case 'product':
      return 'Place in product showcase section with appropriate spacing';
    case 'logo':
    case 'brand':
      return 'Place in header area, typically center-aligned';
    case 'badge':
    case 'price':
      return 'Place near pricing information as visual enhancement';
    default:
      return 'Place according to design specifications and content context';
  }
}

function getIconPlacementInstructions(icon: AssetIcon): string {
  switch (icon.usage) {
    case 'date-indicator':
    case 'calendar':
      return 'Place next to date information as visual indicator';
    case 'social':
      return 'Place in footer area with social media links';
    case 'navigation':
      return 'Place in header or navigation area';
    default:
      return 'Place as decorative element according to design specifications';
  }
}

function getResponsiveBehavior(asset: AssetImage | AssetIcon): string {
  const width = asset.dimensions?.width || 0;
  
  if (width > 400) {
    return 'Scale proportionally for mobile devices, maintain aspect ratio';
  } else if (width > 200) {
    return 'May require slight scaling for very small screens';
  } else {
    return 'Maintain fixed size across all devices';
  }
}

function getEmailClientNotes(asset: AssetImage | AssetIcon): string[] {
  const notes = [];
  
  if (asset.format === 'svg') {
    notes.push('SVG not supported in Outlook - ensure PNG fallback is available');
  }
  
  if (asset.format === 'webp') {
    notes.push('WebP not supported in older email clients - provide JPEG fallback');
  }
  
  if ((asset.file_size || 0) > 100000) {
    notes.push('Large file size may cause loading issues in some email clients');
  }
  
  if (asset.email_client_support) {
    const unsupportedClients = Object.entries(asset.email_client_support)
      .filter(([_, supported]) => !supported)
      .map(([client, _]) => client);
    
    if (unsupportedClients.length > 0) {
      notes.push(`Not supported in: ${unsupportedClients.join(', ')}`);
    }
  }
  
  return notes;
}

/**
 * Helper functions for design package generation
 */
export function calculateTechnicalCompliance(params: any): number {
  const compliance = params.mjml_template.technical_compliance;
  const checks = [
    compliance?.max_width_respected,
    compliance?.color_scheme_applied,
    compliance?.typography_followed,
    compliance?.email_client_optimized,
    compliance?.real_asset_paths
  ];
  
  const passedChecks = checks.filter(check => check === true).length;
  return Math.round((passedChecks / checks.length) * 100);
}

export function calculateAssetOptimization(assetManifest: AssetManifest): number {
  const allAssets = [...assetManifest.images, ...assetManifest.icons];
  if (allAssets.length === 0) return 100;
  
  const optimizedAssets = allAssets.filter(asset => asset.optimized === true).length;
  return Math.round((optimizedAssets / allAssets.length) * 100);
}

export function calculateAccessibilityScore(designDecisions: any): number {
  const features = designDecisions.accessibility_features || [];
  const baseScore = 70;
  const featureBonus = features.length * 7.5; // Up to 30 points for 4 features
  
  return Math.min(100, Math.round(baseScore + featureBonus));
}

export function calculateEmailClientCompatibility(assetManifest: AssetManifest, techSpec: any): number {
  const emailClients = techSpec.specification?.delivery?.emailClients || [];
  const allAssets = [...assetManifest.images, ...assetManifest.icons];
  
  if (allAssets.length === 0 || emailClients.length === 0) return 85;
  
  let totalCompatibility = 0;
  let compatibilityCount = 0;
  
  allAssets.forEach(asset => {
    if (asset.email_client_support) {
      emailClients.forEach(client => {
        const clientName = client.client || client.name || client;
        if (asset.email_client_support && asset.email_client_support[clientName] !== undefined) {
          totalCompatibility += asset.email_client_support[clientName] ? 100 : 0;
          compatibilityCount++;
        }
      });
    }
  });
  
  return compatibilityCount > 0 ? Math.round(totalCompatibility / compatibilityCount) : 85;
} 