import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import * as os from 'os';

/**
 * Create a temporary directory for processing
 */
export async function createTempDir(): Promise<string> {
  const tempBase = os.tmpdir();
  const randomSuffix = randomBytes(8).toString('hex');
  const tempDir = path.join(tempBase, `figma-sprite-${randomSuffix}`);
  
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Ensure a directory exists, creating it if necessary with proper error handling
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it with permission handling
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Directory created: ${dirPath}`);
    } catch (createError: any) {
      if (createError.code === 'EACCES') {
        // Permission denied - try alternative directory
        const fallbackDir = await createFallbackDirectory(dirPath);
        console.warn(`⚠️ Permission denied for ${dirPath}, using fallback: ${fallbackDir}`);
        return;
      } else if (createError.code === 'EEXIST') {
        // Directory already exists, continue
        console.log(`📁 Directory already exists: ${dirPath}`);
        return;
      } else {
        console.error(`❌ Failed to create directory ${dirPath}:`, createError);
        throw createError;
      }
    }
  }
}

/**
 * Create a fallback directory in a writable location when permission is denied
 */
export async function createFallbackDirectory(originalPath: string): Promise<string> {
  const os = await import('os');
  const path = await import('path');
  
  // Try user's temp directory first
  const tempDir = os.tmpdir();
  const projectName = 'email-makers';
  const fallbackBase = path.join(tempDir, projectName);
  
  // Extract relative path from original
  const relativePath = originalPath.replace(process.cwd(), '').replace(/^[\/\\]/, '');
  const fallbackPath = path.join(fallbackBase, relativePath);
  
  try {
    await fs.mkdir(fallbackPath, { recursive: true });
    console.log(`✅ Fallback directory created: ${fallbackPath}`);
    return fallbackPath;
  } catch (fallbackError) {
    // Last resort: use current directory subdirectory
    const currentDirFallback = path.join(process.cwd(), 'temp', relativePath);
    try {
      await fs.mkdir(currentDirFallback, { recursive: true });
      console.log(`✅ Current directory fallback created: ${currentDirFallback}`);
      return currentDirFallback;
    } catch (finalError) {
      console.error(`❌ All directory creation attempts failed:`, finalError);
      throw new Error(`Cannot create directory: ${originalPath}. Permission denied and fallback failed.`);
    }
  }
}

/**
 * Check if file exists
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
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * Clean up directory and all contents
 */
export async function cleanupDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup directory ${dirPath}: ${error}`);
  }
}

/**
 * Safe directory creation that handles permission errors gracefully
 * Returns the actual path created (might be different from requested if fallback was used)
 */
export async function safeCreateDirectory(dirPath: string): Promise<string> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Directory created: ${dirPath}`);
    return dirPath;
  } catch (createError: any) {
    if (createError.code === 'EACCES') {
      // Permission denied - create fallback directory
      const fallbackDir = await createFallbackDirectory(dirPath);
      console.warn(`⚠️ Permission denied for ${dirPath}, using fallback: ${fallbackDir}`);
      return fallbackDir;
    } else if (createError.code === 'EEXIST') {
      // Directory already exists
      console.log(`📁 Directory already exists: ${dirPath}`);
      return dirPath;
    } else {
      console.error(`❌ Failed to create directory ${dirPath}:`, createError);
      throw createError;
    }
  }
}

/**
 * Safe file write that handles permission errors gracefully
 */
export async function safeWriteFile(filePath: string, content: string): Promise<string> {
  try {
    // Ensure parent directory exists
    const parentDir = require('path').dirname(filePath);
    const actualParentDir = await safeCreateDirectory(parentDir);
    
    // Adjust file path if parent directory was changed
    const fileName = require('path').basename(filePath);
    const actualFilePath = require('path').join(actualParentDir, fileName);
    
    await fs.writeFile(actualFilePath, content, 'utf8');
    console.log(`✅ File written: ${actualFilePath}`);
    return actualFilePath;
  } catch (writeError: any) {
    if (writeError.code === 'EACCES') {
      // Permission denied - try in temp directory
      const os = await import('os');
      const path = await import('path');
      const fileName = path.basename(filePath);
      const tempFilePath = path.join(os.tmpdir(), 'email-makers', fileName);
      
      await safeCreateDirectory(path.dirname(tempFilePath));
      await fs.writeFile(tempFilePath, content, 'utf8');
      console.warn(`⚠️ Permission denied for ${filePath}, saved to: ${tempFilePath}`);
      return tempFilePath;
    } else {
      console.error(`❌ Failed to write file ${filePath}:`, writeError);
      throw writeError;
    }
  }
} 