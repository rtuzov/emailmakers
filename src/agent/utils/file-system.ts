import { promises as fs } from 'fs';
import path from 'path';

/**
 * STRICT NO-FALLBACK FILE SYSTEM UTILITIES
 * According to project policy: NO FALLBACK LOGIC ALLOWED
 * System must fail fast if operations cannot be completed
 */

/**
 * Ensures a directory exists, creating it if necessary
 * STRICT MODE: Fails immediately if directory cannot be created
 */
export async function ensureDirectoryExists(dirPath: string): Promise<string> {
  try {
    await fs.access(dirPath);
    console.log(`✅ Directory exists: ${dirPath}`);
    return dirPath;
  } catch (error) {
    console.log(`📁 Creating directory: ${dirPath}`);
    
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Directory created successfully: ${dirPath}`);
      return dirPath;
    } catch (createError) {
      // NO FALLBACK - FAIL IMMEDIATELY
      throw new Error(`Failed to create directory: ${dirPath}. Error: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
    }
  }
}

/**
 * Creates a directory with strict error handling
 * NO FALLBACK - fails immediately if cannot create
 */
export async function createDirectory(dirPath: string): Promise<string> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Directory created: ${dirPath}`);
    return dirPath;
  } catch (error) {
    // NO FALLBACK - FAIL IMMEDIATELY
    throw new Error(`Cannot create directory: ${dirPath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Writes content to a file with strict error handling
 * NO FALLBACK - fails immediately if cannot write
 */
export async function writeFileStrict(filePath: string, content: string): Promise<void> {
  try {
    // Ensure parent directory exists first
    const parentDir = path.dirname(filePath);
    await ensureDirectoryExists(parentDir);
    
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ File written: ${filePath}`);
  } catch (error) {
    // NO FALLBACK - FAIL IMMEDIATELY
    throw new Error(`Cannot write file: ${filePath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Reads a file with strict error handling
 * NO FALLBACK - fails immediately if cannot read
 */
export async function readFileStrict(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`✅ File read: ${filePath}`);
    return content;
  } catch (error) {
    // NO FALLBACK - FAIL IMMEDIATELY
    throw new Error(`Cannot read file: ${filePath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if a file exists with strict error handling
 * Returns boolean - does not use fallback
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures a campaign directory structure exists
 * NO FALLBACK - fails immediately if cannot create required structure
 */
export async function ensureCampaignDirectoryStructure(campaignPath: string): Promise<string> {
  const requiredDirs = [
    campaignPath,
    path.join(campaignPath, 'assets'),
    path.join(campaignPath, 'templates'),
    path.join(campaignPath, 'handoffs'),
    path.join(campaignPath, 'docs'),
    path.join(campaignPath, 'outputs')
  ];

  try {
    for (const dir of requiredDirs) {
      await ensureDirectoryExists(dir);
    }
    
    console.log(`✅ Campaign directory structure created: ${campaignPath}`);
    return campaignPath;
  } catch (error) {
    // NO FALLBACK - FAIL IMMEDIATELY
    throw new Error(`Failed to create campaign directory structure: ${campaignPath}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 