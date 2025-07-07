# Shared Assets System Guide

## Overview

The shared assets system eliminates duplicate files in email campaigns by using a centralized asset storage with hash-based deduplication. This significantly reduces disk usage and improves performance.

## How It Works

### Before (Old System)
```
mails/
├── local-1751868652308-2ebf5d1e/
│   ├── assets/
│   │   ├── rabbit-happy.png     # 150KB
│   │   └── logo.png             # 50KB
│   └── email.html
├── local-1751868652309-4175d79f/
│   ├── assets/
│   │   ├── rabbit-happy.png     # 150KB (DUPLICATE!)
│   │   └── logo.png             # 50KB (DUPLICATE!)
│   └── email.html
└── ... (many more duplicates)
```

### After (New System)
```
mails/
├── shared-assets/               # Centralized, no duplicates
│   ├── rabbit-happy_a1b2c3d4.png  # 150KB (only one copy)
│   ├── logo_e5f6g7h8.png          # 50KB (only one copy)
│   └── asset-registry.json        # Asset metadata
├── campaigns/                   # Campaign-specific content
│   ├── campaign_12345/
│   │   ├── assets/             # Links to shared assets
│   │   │   ├── rabbit-happy.png -> ../../shared-assets/rabbit-happy_a1b2c3d4.png
│   │   │   └── logo.png -> ../../shared-assets/logo_e5f6g7h8.png
│   │   ├── email.html
│   │   └── metadata.json
│   └── campaign_67890/
│       ├── assets/             # Same assets, different campaign
│       │   ├── rabbit-happy.png -> ../../shared-assets/rabbit-happy_a1b2c3d4.png
│       │   └── logo.png -> ../../shared-assets/logo_e5f6g7h8.png
│       ├── email.html
│       └── metadata.json
```

## Key Features

### 1. Hash-Based Deduplication
- Files are identified by SHA-256 hash (first 16 chars)
- Identical files stored only once
- Automatic detection of duplicates

### 2. Asset Registry
- Centralized metadata in `shared-assets/asset-registry.json`
- Tracks file hashes, sizes, creation dates
- Enables cleanup and statistics

### 3. Campaign Linking
- Campaigns link to shared assets via symlinks or file copies
- Preserves original file names in campaigns
- Backward compatibility with existing email generation

### 4. Migration Support
- Automatic migration from old `local-*` folders
- Backup creation before migration
- Rollback functionality

## Usage

### For Developers

#### Creating New Campaigns
```typescript
import EmailFolderManager from './src/agent/tools/email-folder-manager';

// Create campaign with shared assets
const emailFolder = await EmailFolderManager.createEmailFolder(
  'Holiday Promotion',
  'promotional'
);

// Add assets (automatically deduplicated)
const { hash, wasExisting } = await EmailFolderManager.addFigmaAsset(
  emailFolder,
  '/path/to/rabbit-happy.png',
  'rabbit-happy.png'
);

console.log(`Asset ${wasExisting ? 'reused' : 'added'}: ${hash}`);
```

#### Checking System Statistics
```typescript
// Get shared assets statistics
const stats = await EmailFolderManager.getSharedAssetsStats();
console.log(`Total assets: ${stats.totalAssets}`);
console.log(`Total size: ${stats.totalSizeMB}MB`);

// Get campaign asset usage
const campaignAssets = await EmailFolderManager.getCampaignSharedAssets(emailFolder);
console.log(`Campaign uses ${campaignAssets.count} shared assets`);
```

#### Cleanup Old Assets
```typescript
// Remove assets older than 30 days
const deletedCount = await EmailFolderManager.cleanupSharedAssets(30);
console.log(`Cleaned up ${deletedCount} old assets`);
```

### For System Administration

#### Migration from Old System
```bash
# Run migration script
node scripts/migrate-to-shared-assets.js

# Check migration results
node scripts/test-shared-assets.js

# If needed, rollback
node scripts/migrate-to-shared-assets.js --rollback
```

#### Testing the System
```bash
# Run comprehensive tests
node scripts/test-shared-assets.js

# Check TypeScript compilation
npm run type-check

# Test email generation
npm run dev
```

#### Monitoring
```bash
# Check shared assets directory size
du -sh mails/shared-assets/

# Count unique assets
ls mails/shared-assets/*.png | wc -l

# View asset registry
cat mails/shared-assets/asset-registry.json | jq '.| keys | length'
```

## Configuration

### Environment Variables
```bash
# Optional: Configure asset storage location
SHARED_ASSETS_PATH=/custom/path/to/shared-assets

# Optional: Configure cleanup retention
ASSET_CLEANUP_DAYS=30
```

### Web Server Configuration
Ensure your web server can serve the shared assets directory:

#### Nginx
```nginx
location /generated/ {
    alias /path/to/project/mails/;
    try_files $uri $uri/ =404;
}
```

#### Express.js
```javascript
app.use('/generated', express.static('mails'));
```

## Best Practices

### 1. Regular Cleanup
Set up a cron job to clean old assets:
```bash
# Weekly cleanup of assets older than 30 days
0 0 * * 0 cd /path/to/project && node scripts/cleanup-assets.js
```

### 2. Monitoring
- Monitor shared assets directory growth
- Set up alerts for disk usage
- Track deduplication rates

### 3. Backup Strategy
- Backup shared-assets directory regularly
- Consider the asset registry critical data
- Test restore procedures

### 4. Development Workflow
- Use shared assets system in development
- Test with representative asset volumes
- Validate symlink support on deployment environment

## Troubleshooting

### Symlinks Not Working
If symbolic links aren't supported:
1. The system automatically falls back to file copying
2. Check file system permissions
3. Consider using a different file system

### Assets Not Found
1. Check asset registry: `cat mails/shared-assets/asset-registry.json`
2. Verify file permissions
3. Ensure web server can access shared-assets directory

### Migration Issues
1. Check migration logs
2. Verify backup exists: `ls mails/migration-backup/`
3. Use rollback if needed: `node scripts/migrate-to-shared-assets.js --rollback`

### Performance Issues
1. Monitor asset directory size
2. Run cleanup regularly
3. Consider asset compression for large files

## API Reference

### AssetHashManager
- `addOrGetSharedAsset(sourcePath, fileName)` - Add or retrieve shared asset
- `getAssetByHash(hash)` - Get asset info by hash
- `cleanupUnusedAssets(keepDays)` - Remove old assets
- `getStats()` - Get system statistics

### EmailFolderManager (New Methods)
- `addSharedAsset(emailFolder, sourcePath, fileName)` - Add asset to campaign
- `addFigmaAsset(emailFolder, assetUrl, fileName)` - Add Figma asset
- `getSharedAssetsStats()` - Get global statistics
- `getCampaignSharedAssets(emailFolder)` - Get campaign asset usage

## Migration Script
- Location: `scripts/migrate-to-shared-assets.js`
- Features: Backup, deduplication, rollback
- Usage: `node scripts/migrate-to-shared-assets.js [--rollback]`

## Support

For issues or questions:
1. Check this guide first
2. Run test script: `node scripts/test-shared-assets.js`
3. Check project logs
4. Review TypeScript compilation: `npm run type-check`