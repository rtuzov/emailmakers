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
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
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