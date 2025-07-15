/**
 * Asset collection from multiple sources
 */

import fs from 'fs/promises';
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
        case 'figma':
          // Both local and figma sources use local directory collection
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
          // Direct URL collection (e.g., external image URLs)
          sourceAssets = await collectFromExternalUrls(
            source.path,
            contentContext,
            campaignContext
          );
          break;
          
        default:
          // NO FALLBACK POLICY: Fail fast if source type not supported
          throw new Error(`❌ CRITICAL ERROR: Source type '${source.type}' not implemented. All source types must be supported - no fallback allowed.`);
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
    
    // Check if sourcePath is a file or directory first
    let figmaTagsPath: string;
    
    try {
      const sourceStats = await fs.stat(sourcePath);
      if (sourceStats.isFile()) {
        console.log(`⚠️ Source path is a file: ${sourcePath}, falling back to basic collection`);
        return await collectFromLocalDirectoryBasic(sourcePath, destination);
      }
      // If it's a directory, proceed with AI selection
      figmaTagsPath = path.join(sourcePath, 'ai-optimized-tags.json');
    } catch (error) {
      console.error(`❌ Could not access source path ${sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`❌ Invalid asset source path: ${sourcePath}. Asset sources must point to existing files or directories.`);
    }
    
    // Load Figma tags for AI selection
    let figmaTags: any = {};
    
    try {
      const figmaTagsContent = await fs.readFile(figmaTagsPath, 'utf8');
      figmaTags = JSON.parse(figmaTagsContent);
    } catch (error) {
      console.warn(`⚠️ Could not load Figma tags from ${figmaTagsPath}, using basic selection`);
      return await collectFromLocalDirectoryBasic(sourcePath, destination);
    }
    
    // Get AI-powered tag selection (new approach)
    const tagSelections = await selectFigmaAssetsWithAI(aiAnalysis, figmaTags, contentContext);
    
    // Process each tag selection
    for (const selection of tagSelections) {
      console.log(`🎯 Processing selection: ${selection.reasoning}`);
      
      // Find actual files by tags instead of filtering through GPT
      const actualFiles = await findActualFilesByTags(
        selection.tags,
        selection.folders,
        sourcePath,
        selection.max_files
      );
      
      // Copy selected files to destination
      for (const file of actualFiles) {
        const filePath = path.join(sourcePath, file.folder, file.filename);
        const destPath = path.join(destination, file.filename);
        
        try {
          const stats = await fs.stat(filePath);
          await fs.copyFile(filePath, destPath);
          
          assets.push({
            filename: file.filename,
            path: destPath,
            size: stats.size,
            format: path.extname(file.filename).toLowerCase().substring(1),
            hash: `ai_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            tags: selection.tags,
            description: `AI-selected by tags: ${file.matchedTags.join(', ')}`,
            purpose: 'visual',
            priority: file.score > 2 ? 'high' : 'medium',
            aiReasoning: selection.reasoning
          });
          
          console.log(`✅ Added asset: ${file.filename} (score: ${file.score}, tags: ${file.matchedTags.join(', ')})`);
          
        } catch (fileError) {
          throw new Error(`❌ Could not process file ${file.filename}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }
    }
    
    return assets;
    
  } catch (error) {
    console.error('❌ AI-powered asset collection failed:', error);
    throw new Error(`AI asset collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find actual files by tags from the file system
 */
async function findActualFilesByTags(
  selectedTags: string[],
  priorityFolders: string[],
  sourcePath: string,
  maxFiles: number = 5
): Promise<{ filename: string; folder: string; score: number; matchedTags: string[] }[]> {
  console.log(`🔍 Finding actual files by tags: ${selectedTags.join(', ')}`);
  
  const foundFiles: { filename: string; folder: string; score: number; matchedTags: string[] }[] = [];
  
  // Search in each priority folder
  for (const folderName of priorityFolders) {
    const folderPath = path.join(sourcePath, folderName);
    
    try {
      await fs.access(folderPath);
      const files = await fs.readdir(folderPath);
      const assetFiles = files.filter(file => 
        /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
      );
      
      // Score files based on tag matches in filename
      for (const filename of assetFiles) {
        const matchedTags = selectedTags.filter(tag => 
          filename.toLowerCase().includes(tag.toLowerCase()) ||
          // Also check for partial matches
          tag.toLowerCase().split('-').some(part => 
            filename.toLowerCase().includes(part)
          )
        );
        
        if (matchedTags.length > 0) {
          foundFiles.push({
            filename,
            folder: folderName,
            score: matchedTags.length,
            matchedTags
          });
        }
      }
      
      // If no tag matches, take a few representative files from high-priority folders
      if (foundFiles.filter(f => f.folder === folderName).length === 0 && assetFiles.length > 0) {
        const representativeFiles = assetFiles.slice(0, 2); // Take first 2 files
        representativeFiles.forEach(filename => {
          foundFiles.push({
            filename,
            folder: folderName,
            score: 0.5, // Low score for non-matching files
            matchedTags: []
          });
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not access folder ${folderName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Sort by score and return top files
  foundFiles.sort((a, b) => b.score - a.score);
  const selectedFiles = foundFiles.slice(0, maxFiles);
  
  console.log(`✅ Found ${selectedFiles.length} files by tags`);
  
  return selectedFiles;
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
    // Check if sourcePath is a file or directory
    const stats = await fs.stat(sourcePath);
    
    if (stats.isFile()) {
      // If it's a file, check if it's an asset file
      const filename = path.basename(sourcePath);
      if (/\.(jpg|jpeg|png|svg|webp|gif)$/i.test(filename)) {
        const destPath = path.join(destination, filename);
        
        try {
          await fs.copyFile(sourcePath, destPath);
          
          assets.push({
            filename,
            path: destPath,
            size: stats.size,
            format: path.extname(filename).toLowerCase().substring(1),
            hash: `basic_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            tags: [],
            description: `Basic selected asset: ${filename}`
          });
          
          console.log(`✅ Processed single asset file: ${filename}`);
        } catch (fileError) {
          // NO FALLBACK POLICY: Fail fast if file cannot be processed
          throw new Error(`❌ CRITICAL ERROR: Could not process required file ${filename}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}. All selected assets must be processable - no fallback allowed.`);
        }
      } else {
        // NO FALLBACK POLICY: Fail fast if source path is not an asset
        throw new Error(`❌ CRITICAL ERROR: Source path is a file but not an asset: ${sourcePath}. All source paths must point to valid assets - no fallback allowed.`);
      }
    } else if (stats.isDirectory()) {
      // If it's a directory, process as before
      const files = await fs.readdir(sourcePath);
      const assetFiles = files.filter(file => 
        /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(file)
      ).slice(0, 5); // Limit to 5 files for performance
      
      for (const file of assetFiles) {
        const filePath = path.join(sourcePath, file);
        const destPath = path.join(destination, file);
        
        try {
          const fileStats = await fs.stat(filePath);
          await fs.copyFile(filePath, destPath);
          
          assets.push({
            filename: file,
            path: destPath,
            size: fileStats.size,
            format: path.extname(file).toLowerCase().substring(1),
            hash: `basic_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            created: fileStats.birthtime.toISOString(),
            modified: fileStats.mtime.toISOString(),
            tags: [],
            description: `Basic selected asset: ${file}`
          });
        } catch (fileError) {
          console.warn(`⚠️ Could not process file ${file}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }
      
      console.log(`✅ Processed ${assetFiles.length} assets from directory: ${sourcePath}`);
    } else {
      console.warn(`⚠️ Source path is neither file nor directory: ${sourcePath}`);
    }
    
    return assets;
  } catch (error) {
    console.warn(`⚠️ Could not access source path ${sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // CRITICAL FIX: Convert warnings to errors for invalid asset paths
    throw new Error(`❌ Invalid asset source path: ${sourcePath}. Asset sources must point to existing files or directories. Check your asset source configuration.`);
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
  sourcePath: string,
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