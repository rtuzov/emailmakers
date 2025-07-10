/**
 * Asset collection from multiple sources
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  AssetSource,
  AssetCollectionResult,
  AssetItem,
  ContentContext,
  CampaignContext
} from './types';
import {
  analyzeContentWithAI,
  selectFigmaAssetsWithAI,
  filterFilesWithAI,
  generateAISelectedExternalImages
} from './ai-analysis';

/**
 * Collect assets from multiple sources with AI-powered selection
 */
export async function collectAssetsFromSources(
  sources: AssetSource[],
  destination: string,
  contentContext: ContentContext,
  campaignContext?: CampaignContext
): Promise<AssetCollectionResult> {
  console.log('🤖 Starting AI-powered asset collection...');
  
  await fs.mkdir(destination, { recursive: true });
  
  const collectedAssets: AssetItem[] = [];
  const errors: string[] = [];
  const formatCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  
  for (const source of sources) {
    console.log(`🔍 Processing ${source.type} source: ${source.path}`);
    
    try {
      let sourceAssets: AssetItem[] = [];
      
      switch (source.type) {
        case 'local':
          sourceAssets = await collectFromLocalDirectoryWithAI(
            source.path,
            destination,
            contentContext,
            campaignContext
          );
          break;
          
        case 'campaign':
          sourceAssets = await collectFromCampaignDirectory(
            source.path,
            destination
          );
          break;
          
        case 'url':
          if (source.path === 'external_fallback') {
            sourceAssets = await collectFromExternalUrls(
              contentContext,
              campaignContext
            );
          }
          break;
          
        default:
          console.warn(`⚠️ ${source.type} source type not implemented`);
      }
      
      // Update counters
      sourceAssets.forEach(asset => {
        formatCounts[asset.format] = (formatCounts[asset.format] || 0) + 1;
        sourceCounts[source.type] = (sourceCounts[source.type] || 0) + 1;
      });
      
      collectedAssets.push(...sourceAssets);
      
    } catch (error) {
      const errorMsg = `Failed to collect from ${source.type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }
  
  const totalSize = collectedAssets.reduce((sum, asset) => sum + (asset.size || 0), 0);
  
  console.log(`✅ Asset collection completed: ${collectedAssets.length} assets, ${totalSize} bytes`);
  
  return {
    success: true,
    assets: collectedAssets,
    summary: {
      totalAssets: collectedAssets.length,
      totalSize,
      formats: formatCounts,
      sources: sourceCounts,
      duplicatesRemoved: 0, // TODO: Implement deduplication
      errors
    }
  };
}

/**
 * AI-powered collection from local directory (Figma assets)
 */
async function collectFromLocalDirectoryWithAI(
  sourcePath: string,
  destination: string,
  contentContext: ContentContext,
  campaignContext?: CampaignContext
): Promise<AssetItem[]> {
  console.log('🎨 Using AI to select optimal assets from Figma directory...');
  
  const assets: AssetItem[] = [];
  
  try {
    // Get AI analysis for this campaign
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext);
    
    // Load Figma tags for AI selection
    const figmaTagsPath = path.join(sourcePath, 'ai-optimized-tags.json');
    let figmaTags: any = {};
    
    try {
      const figmaTagsContent = await fs.readFile(figmaTagsPath, 'utf8');
      figmaTags = JSON.parse(figmaTagsContent);
    } catch (error) {
      console.warn(`⚠️ Could not load Figma tags from ${figmaTagsPath}, using basic selection`);
      return await collectFromLocalDirectoryBasic(sourcePath, destination);
    }
    
    // Get AI-powered asset selection
    const assetSelection = await selectFigmaAssetsWithAI(aiAnalysis, figmaTags, contentContext);
    
    // Process each selected asset group
    for (const selection of assetSelection) {
      const folderPath = path.join(sourcePath, selection.folder);
      
      try {
        await fs.access(folderPath);
        const files = await fs.readdir(folderPath);
        const assetFiles = files.filter(file => 
          /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
        );
        
        // Use AI to filter files based on search criteria
        const selectedFiles = await filterFilesWithAI(
          assetFiles,
          selection.search_criteria,
          selection.expected_count || 3
        );
        
        // Copy selected files to destination
        for (const file of selectedFiles) {
          const filePath = path.join(folderPath, file);
          const destPath = path.join(destination, file);
          
          try {
            const stats = await fs.stat(filePath);
            await fs.copyFile(filePath, destPath);
            
            assets.push({
              filename: file,
              path: destPath,
              size: stats.size,
              format: path.extname(file).toLowerCase().substring(1),
              hash: `ai_${Date.now()}_${Math.random().toString(36).substring(2)}`,
              created: stats.birthtime.toISOString(),
              modified: stats.mtime.toISOString(),
              tags: selection.search_criteria.tags || [],
              description: `AI-selected ${selection.usage}`,
              purpose: selection.search_criteria.purpose,
              priority: selection.priority,
              aiReasoning: selection.search_criteria.emotional_match
            });
          } catch (fileError) {
            console.warn(`⚠️ Could not process file ${file}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
          }
        }
        
        console.log(`✅ Selected ${selectedFiles.length} assets from ${selection.folder}`);
        
      } catch (error) {
        console.warn(`⚠️ Could not access folder ${selection.folder}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return assets;
    
  } catch (error) {
    console.error('❌ AI-powered asset collection failed:', error);
    throw new Error(`AI asset collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Basic collection method as fallback
 */
async function collectFromLocalDirectoryBasic(
  sourcePath: string,
  destination: string
): Promise<AssetItem[]> {
  console.log('🔄 Using basic asset collection...');
  
  const assets: AssetItem[] = [];
  
  try {
    const files = await fs.readdir(sourcePath);
    const assetFiles = files.filter(file => 
      /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
    ).slice(0, 5); // Limit to 5 files as fallback
    
    for (const file of assetFiles) {
      const filePath = path.join(sourcePath, file);
      const destPath = path.join(destination, file);
      
      try {
        const stats = await fs.stat(filePath);
        await fs.copyFile(filePath, destPath);
        
        assets.push({
          filename: file,
          path: destPath,
          size: stats.size,
          format: path.extname(file).toLowerCase().substring(1),
          hash: `basic_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          tags: [],
          description: `Basic selected asset: ${file}`
        });
      } catch (fileError) {
        console.warn(`⚠️ Could not process file ${file}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }
    
    return assets;
  } catch (error) {
    throw new Error(`Failed to collect from local directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Collect assets from campaign directory
 */
async function collectFromCampaignDirectory(
  campaignPath: string,
  destination: string
): Promise<AssetItem[]> {
  console.log('📁 Collecting assets from campaign directory...');
  
  const assetsDir = path.join(campaignPath, 'assets');
  
  try {
    await fs.access(assetsDir);
    return await collectFromLocalDirectoryBasic(assetsDir, destination);
  } catch (error) {
    console.log(`⚠️ No assets directory found in campaign: ${campaignPath}`);
    return [];
  }
}

/**
 * Collect external images using AI selection
 */
async function collectFromExternalUrls(
  contentContext: ContentContext,
  campaignContext?: CampaignContext
): Promise<AssetItem[]> {
  console.log('🌐 Using AI to select appropriate external images...');
  
  try {
    // Get AI analysis to determine what external assets are needed
    const aiAnalysis = await analyzeContentWithAI(contentContext, campaignContext);
    
    // Use AI to generate appropriate external image URLs
    const aiSelectedImages = await generateAISelectedExternalImages(aiAnalysis, contentContext);
    
    console.log(`✅ AI selected ${aiSelectedImages.length} external images`);
    return aiSelectedImages;
    
  } catch (error) {
    console.error('❌ AI external image selection failed:', error);
    throw new Error(`Failed to select external images: ${error instanceof Error ? error.message : 'AI selection unavailable'}`);
  }
} 