import * as fs from 'fs';
import * as path from 'path';

export interface ComponentAsset {
  filename: string;
  sourcePath: string;
  destinationPath: string;
  url: string;
}

/**
 * Copy component assets to mail directory for email compatibility
 */
export async function copyComponentAssets(
  assetsNeeded: string[], 
  mailId: string
): Promise<ComponentAsset[]> {
  const assetsDir = path.join(process.cwd(), 'mails', mailId, 'assets');
  const componentAssetsDir = path.join(process.cwd(), 'src', 'ui', 'components', 'email', 'assets');
  
  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const copiedAssets: ComponentAsset[] = [];

  for (const assetFilename of assetsNeeded) {
    const sourcePath = path.join(componentAssetsDir, assetFilename);
    const destinationPath = path.join(assetsDir, assetFilename);
    
    // Check if source file exists
    if (fs.existsSync(sourcePath)) {
      // Copy file
      fs.copyFileSync(sourcePath, destinationPath);
      
      // Create asset info
      const asset: ComponentAsset = {
        filename: assetFilename,
        sourcePath,
        destinationPath,
        url: `assets/${assetFilename}` // Relative URL for email
      };
      
      copiedAssets.push(asset);
      console.log(`📁 Copied component asset: ${assetFilename}`);
    } else {
      console.warn(`⚠️ Component asset not found: ${sourcePath}`);
    }
  }

  return copiedAssets;
}

/**
 * Update component HTML with proper asset URLs
 */
export function updateComponentAssetUrls(
  componentHtml: string, 
  assetMappings: ComponentAsset[]
): string {
  let updatedHtml = componentHtml;
  
  // Replace local asset paths with email-compatible URLs
  for (const asset of assetMappings) {
    const localPath = `/src/ui/components/email/assets/${asset.filename}`;
    updatedHtml = updatedHtml.replace(
      new RegExp(localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      asset.url
    );
  }
  
  return updatedHtml;
}

/**
 * Get required assets for rabbit component using real Figma assets
 */
export function getRabbitAssets(emotion: string, variant: string = '01'): string[] {
  switch (emotion) {
    case 'happy':
      return ['заяц -Общие- 01-x1.png'];
    case 'angry':
      return ['заяц -Общие- 03-x1.png'];
    case 'excited':
      return ['заяц «Подборка»01-x1.png'];
    case 'confused':
      return ['заяц «Вопрос-ответ» 01-x1.png'];
    case 'news':
      return ['заяц «Новости» 01-x1.png'];
    case 'deal':
      return ['заяц -Билет дня- 01-x1.png'];
    case 'general':
      return [`заяц -Общие- ${variant.padStart(2, '0')}-x1.png`];
    case 'neutral':
    default:
      return ['заяц -Общие- 01-x1.png']; // Use real asset as fallback
  }
}

/**
 * Get required assets for icon component
 */
export function getIconAssets(iconType: string): string[] {
  switch (iconType) {
    case 'arrow':
      return ['arrow-icon.png'];
    case 'heart':
      return ['heart-icon.png'];
    case 'vector':
      return ['vector-icon.png'];
    default:
      return ['arrow-icon.png']; // Fallback
  }
} 