#!/usr/bin/env node

/**
 * Migration Script: Consolidate existing mail folders to use shared assets
 * 
 * This script:
 * 1. Scans all existing "local-*" folders in /mails/
 * 2. Moves unique assets to shared-assets directory
 * 3. Converts campaigns to use proper EmailFolderManager structure
 * 4. Creates backup before migration
 * 5. Provides rollback option
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const MAILS_DIR = path.resolve(process.cwd(), 'mails');
const SHARED_ASSETS_DIR = path.join(MAILS_DIR, 'shared-assets');
const CAMPAIGNS_DIR = path.join(MAILS_DIR, 'campaigns');
const ARCHIVE_DIR = path.join(MAILS_DIR, 'archive');
const BACKUP_DIR = path.join(MAILS_DIR, 'migration-backup');

class MigrationManager {
  constructor() {
    this.stats = {
      totalFolders: 0,
      migratedFolders: 0,
      totalAssets: 0,
      uniqueAssets: 0,
      duplicateAssets: 0,
      savedSpaceBytes: 0,
      errors: []
    };
    this.assetRegistry = {};
  }

  async run() {
    console.log('🚀 Starting migration to shared assets system...\n');

    try {
      // Step 1: Create backup
      await this.createBackup();

      // Step 2: Initialize new directory structure
      await this.initializeDirectories();

      // Step 3: Scan existing folders
      const existingFolders = await this.scanExistingFolders();

      // Step 4: Process each folder
      for (const folder of existingFolders) {
        await this.migrateFolder(folder);
      }

      // Step 5: Save asset registry
      await this.saveAssetRegistry();

      // Step 6: Clean up old folders
      await this.cleanupOldFolders(existingFolders);

      // Step 7: Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('💡 Run rollback to restore from backup: npm run migrate:rollback');
      process.exit(1);
    }
  }

  async createBackup() {
    console.log('📦 Creating backup...');
    
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      
      // Copy entire mails directory structure
      const entries = await fs.readdir(MAILS_DIR, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'migration-backup') {
          const sourcePath = path.join(MAILS_DIR, entry.name);
          const backupPath = path.join(BACKUP_DIR, entry.name);
          await this.copyDirectory(sourcePath, backupPath);
        }
      }
      
      console.log(`✅ Backup created at: ${BACKUP_DIR}\n`);
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  async copyDirectory(source, destination) {
    await fs.mkdir(destination, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  async initializeDirectories() {
    console.log('📁 Initializing new directory structure...');
    
    await fs.mkdir(SHARED_ASSETS_DIR, { recursive: true });
    await fs.mkdir(CAMPAIGNS_DIR, { recursive: true });
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    
    // Create empty asset registry
    const registryPath = path.join(SHARED_ASSETS_DIR, 'asset-registry.json');
    await fs.writeFile(registryPath, JSON.stringify({}, null, 2));
    
    console.log('✅ New directory structure created\n');
  }

  async scanExistingFolders() {
    console.log('🔍 Scanning existing folders...');
    
    const entries = await fs.readdir(MAILS_DIR, { withFileTypes: true });
    const localFolders = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('local-'))
      .map(entry => entry.name);
    
    this.stats.totalFolders = localFolders.length;
    console.log(`📊 Found ${localFolders.length} folders to migrate\n`);
    
    return localFolders;
  }

  async migrateFolder(folderName) {
    console.log(`🔄 Migrating folder: ${folderName}`);
    
    try {
      const sourcePath = path.join(MAILS_DIR, folderName);
      
      // Read metadata if exists
      let metadata = null;
      try {
        const metadataPath = path.join(sourcePath, 'metadata.json');
        const metadataContent = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(metadataContent);
      } catch {
        // Create basic metadata if not exists
        metadata = {
          campaign_id: folderName,
          created_at: new Date().toISOString(),
          topic: 'Migrated Campaign',
          campaign_type: 'migrated'
        };
      }

      // Generate new campaign ID
      const timestamp = folderName.match(/local-(\d+)/)?.[1] || Date.now();
      const newCampaignId = `campaign_${timestamp.toString().substring(-8)}`;
      
      // Create new campaign directory
      const newCampaignPath = path.join(CAMPAIGNS_DIR, newCampaignId);
      await fs.mkdir(newCampaignPath, { recursive: true });
      await fs.mkdir(path.join(newCampaignPath, 'assets'), { recursive: true });

      // Process assets if they exist
      const assetsPath = path.join(sourcePath, 'assets');
      let migratedAssets = [];
      
      try {
        await fs.access(assetsPath);
        migratedAssets = await this.migrateAssets(assetsPath, newCampaignPath);
      } catch {
        console.log(`  ⚠️ No assets folder found in ${folderName}`);
      }

      // Copy HTML and MJML files
      await this.copyEmailFiles(sourcePath, newCampaignPath);

      // Update metadata
      const updatedMetadata = {
        ...metadata,
        campaign_id: newCampaignId,
        migrated_from: folderName,
        migrated_at: new Date().toISOString(),
        shared_assets_used: migratedAssets.length,
        asset_hashes: migratedAssets.map(asset => asset.hash),
        status: 'completed'
      };

      const newMetadataPath = path.join(newCampaignPath, 'metadata.json');
      await fs.writeFile(newMetadataPath, JSON.stringify(updatedMetadata, null, 2));

      this.stats.migratedFolders++;
      console.log(`  ✅ Migrated to: ${newCampaignId} (${migratedAssets.length} assets)`);

    } catch (error) {
      this.stats.errors.push(`Failed to migrate ${folderName}: ${error.message}`);
      console.log(`  ❌ Failed to migrate ${folderName}: ${error.message}`);
    }
  }

  async migrateAssets(assetsPath, campaignPath) {
    const migratedAssets = [];
    
    try {
      const assetFiles = await fs.readdir(assetsPath);
      const imageFiles = assetFiles.filter(file => 
        file.toLowerCase().endsWith('.png') || 
        file.toLowerCase().endsWith('.jpg') || 
        file.toLowerCase().endsWith('.jpeg') ||
        file.toLowerCase().endsWith('.gif') ||
        file.toLowerCase().endsWith('.svg')
      );

      for (const fileName of imageFiles) {
        const assetPath = path.join(assetsPath, fileName);
        const asset = await this.processAsset(assetPath, fileName);
        
        if (asset) {
          // Create link in campaign assets folder
          const linkPath = path.join(campaignPath, 'assets', fileName);
          const relativePath = path.relative(path.dirname(linkPath), asset.filePath);
          
          try {
            await fs.symlink(relativePath, linkPath);
          } catch {
            // If symlinks not supported, copy the file
            await fs.copyFile(asset.filePath, linkPath);
          }
          
          migratedAssets.push(asset);
        }
      }

      this.stats.totalAssets += imageFiles.length;
      
    } catch (error) {
      console.log(`    ⚠️ Error processing assets: ${error.message}`);
    }

    return migratedAssets;
  }

  async processAsset(assetPath, fileName) {
    try {
      // Calculate file hash
      const fileBuffer = await fs.readFile(assetPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').substring(0, 16);
      
      // Check if asset already exists
      if (this.assetRegistry[hash]) {
        this.stats.duplicateAssets++;
        this.stats.savedSpaceBytes += fileBuffer.length;
        console.log(`    ♻️ Reusing existing asset: ${fileName} (${hash})`);
        return this.assetRegistry[hash];
      }
      
      // Create new shared asset
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const sharedFileName = `${baseName}_${hash}${fileExtension}`;
      const sharedPath = path.join(SHARED_ASSETS_DIR, sharedFileName);
      
      await fs.copyFile(assetPath, sharedPath);
      
      const stats = await fs.stat(sharedPath);
      const assetInfo = {
        fileName: sharedFileName,
        filePath: sharedPath,
        hash,
        size: stats.size,
        createdAt: new Date().toISOString(),
        originalName: fileName
      };
      
      this.assetRegistry[hash] = assetInfo;
      this.stats.uniqueAssets++;
      
      console.log(`    📦 Added new shared asset: ${sharedFileName} (${hash})`);
      return assetInfo;
      
    } catch (error) {
      console.log(`    ❌ Failed to process asset ${fileName}: ${error.message}`);
      return null;
    }
  }

  async copyEmailFiles(sourcePath, destPath) {
    const filesToCopy = ['email.html', 'email.mjml'];
    
    for (const fileName of filesToCopy) {
      const sourcePath = path.join(sourcePath, fileName);
      const destPath = path.join(destPath, fileName);
      
      try {
        await fs.access(sourcePath);
        await fs.copyFile(sourcePath, destPath);
        console.log(`    📄 Copied: ${fileName}`);
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  async saveAssetRegistry() {
    const registryPath = path.join(SHARED_ASSETS_DIR, 'asset-registry.json');
    await fs.writeFile(registryPath, JSON.stringify(this.assetRegistry, null, 2));
    console.log(`📋 Saved asset registry with ${Object.keys(this.assetRegistry).length} assets`);
  }

  async cleanupOldFolders(folders) {
    console.log('\n🧹 Moving old folders to archive...');
    
    for (const folderName of folders) {
      try {
        const sourcePath = path.join(MAILS_DIR, folderName);
        const archivePath = path.join(ARCHIVE_DIR, folderName);
        
        await fs.rename(sourcePath, archivePath);
        console.log(`  📦 Archived: ${folderName}`);
      } catch (error) {
        console.log(`  ⚠️ Failed to archive ${folderName}: ${error.message}`);
      }
    }
  }

  displayResults() {
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('📊 Migration Statistics:');
    console.log(`  Total folders processed: ${this.stats.totalFolders}`);
    console.log(`  Successfully migrated: ${this.stats.migratedFolders}`);
    console.log(`  Total assets processed: ${this.stats.totalAssets}`);
    console.log(`  Unique assets created: ${this.stats.uniqueAssets}`);
    console.log(`  Duplicate assets found: ${this.stats.duplicateAssets}`);
    console.log(`  Space saved: ${Math.round(this.stats.savedSpaceBytes / 1024 / 1024 * 100) / 100}MB`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`  • ${error}`));
    }

    console.log('\n📁 New directory structure:');
    console.log(`  ${MAILS_DIR}/`);
    console.log(`  ├── shared-assets/          # Common assets (no duplicates)`);
    console.log(`  ├── campaigns/              # Campaign folders with proper structure`);
    console.log(`  ├── archive/                # Original folders (can be deleted after verification)`);
    console.log(`  └── migration-backup/       # Complete backup (for rollback)`);

    console.log('\n✅ Next steps:');
    console.log('  1. Test email generation with new system');
    console.log('  2. Verify assets are properly linked');
    console.log('  3. After verification, delete archive/ and migration-backup/ folders');
    console.log('  4. Configure your web server to serve shared-assets directory');
  }
}

// Rollback function
async function rollback() {
  console.log('🔄 Rolling back migration...');
  
  try {
    const backupPath = path.join(MAILS_DIR, 'migration-backup');
    
    // Check if backup exists
    await fs.access(backupPath);
    
    // Remove new directories
    const newDirs = [SHARED_ASSETS_DIR, CAMPAIGNS_DIR, ARCHIVE_DIR];
    
    for (const dir of newDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`🗑️ Removed: ${path.basename(dir)}/`);
      } catch (error) {
        console.log(`⚠️ Failed to remove ${dir}: ${error.message}`);
      }
    }
    
    // Restore from backup
    const backupEntries = await fs.readdir(backupPath, { withFileTypes: true });
    
    for (const entry of backupEntries) {
      const sourcePath = path.join(backupPath, entry.name);
      const destPath = path.join(MAILS_DIR, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, destPath);
        console.log(`📦 Restored: ${entry.name}/`);
      }
    }
    
    // Remove backup
    await fs.rm(backupPath, { recursive: true, force: true });
    
    console.log('✅ Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

// Helper function for rollback
async function copyDirectory(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    await rollback();
  } else {
    const manager = new MigrationManager();
    await manager.run();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { MigrationManager, rollback };