import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeEmailFolder } from './tools/email-folder-initializer';
import { getFigmaAssets } from './tools/figma';
import { splitFigmaSprite } from './tools/figma-sprite-splitter';
import { renderMjml } from './tools/mjml';
import EmailFolderManager from './tools/email-folder-manager';

/**
 * Test script for new email folder architecture
 */
async function testEmailFolderArchitecture() {
  console.log('🧪 Testing new email folder architecture...\n');

  try {
    // Step 1: Initialize email folder
    console.log('📁 Step 1: Initialize email folder');
    const folderResult = await initializeEmailFolder({
      topic: 'Тест новой архитектуры папок',
      campaign_type: 'promotional'
    });

    if (!folderResult.success) {
      throw new Error(`Failed to initialize folder: ${folderResult.error}`);
    }

    const emailFolder = folderResult.data.emailFolder;
    console.log(`✅ Email folder created: ${emailFolder.campaignId}\n`);

    // Step 2: Test Figma assets with emailFolder
    console.log('🎨 Step 2: Test Figma assets with email folder');
    const figmaResult = await getFigmaAssets({
      tags: ['заяц', 'счастлив'],
      emailFolder,
      context: {
        campaign_type: 'promotional',
        emotional_tone: 'positive',
        target_count: 2
      }
    });

    if (!figmaResult.success) {
      throw new Error(`Failed to get Figma assets: ${figmaResult.error}`);
    }

    console.log(`✅ Downloaded ${figmaResult.data.paths.length} assets to email folder\n`);

    // Step 3: Test sprite splitter with emailFolder (if we have assets)
    if (figmaResult.data.paths.length > 0) {
      console.log('🔪 Step 3: Test sprite splitter with email folder');
      
      const firstAsset = figmaResult.data.paths[0];
      console.log(`Testing sprite splitter on: ${firstAsset}`);
      
      const spriteResult = await splitFigmaSprite({
        path: firstAsset,
        emailFolder,
        h_gap: 15,
        v_gap: 15,
        confidence_threshold: 0.9
      });

      if (spriteResult.success) {
        console.log(`✅ Sprite splitter: ${spriteResult.slices_generated} slices generated\n`);
      } else {
        console.log(`⚠️ Sprite splitter failed (expected for non-sprite images): ${spriteResult.error}\n`);
      }
    }

    // Step 4: Test MJML rendering with emailFolder
    console.log('🏗️ Step 4: Test MJML rendering with email folder');
    const mjmlResult = await renderMjml({
      content: {
        subject: 'Тест новой архитектуры',
        preheader: 'Проверяем новую систему папок',
        body: 'Это тестовое письмо для проверки новой архитектуры папок email кампаний.',
        cta: 'Проверить архитектуру',
        language: 'ru',
        tone: 'friendly'
      },
      assets: {
        paths: figmaResult.data.paths
      },
      emailFolder
    });

    if (!mjmlResult.success) {
      throw new Error(`Failed to render MJML: ${mjmlResult.error}`);
    }

    console.log(`✅ MJML rendered successfully to email folder\n`);

    // Step 5: Verify folder structure
    console.log('🔍 Step 5: Verify folder structure');
    const assets = await EmailFolderManager.listAssets(emailFolder);
    const spriteSlices = await EmailFolderManager.listSpriteSlices(emailFolder);
    const metadata = await EmailFolderManager.getMetadata(emailFolder);

    console.log(`📊 Final folder structure:`);
    console.log(`   📁 Campaign ID: ${emailFolder.campaignId}`);
    console.log(`   📂 Base path: ${emailFolder.basePath}`);
    console.log(`   🖼️ Assets: ${assets.length} files`);
    console.log(`   🔪 Sprite slices: ${spriteSlices.length} files`);
    console.log(`   📋 Status: ${metadata.status}`);
    console.log(`   ⏱️ Created: ${metadata.created_at}`);

    // Step 6: Complete campaign
    console.log('\n🏁 Step 6: Complete campaign');
    await EmailFolderManager.completeCampaign(emailFolder, 30000, 'completed');
    
    const finalMetadata = await EmailFolderManager.getMetadata(emailFolder);
    console.log(`✅ Campaign completed with status: ${finalMetadata.status}`);
    console.log(`📊 Final stats: ${finalMetadata.assets_count} assets, ${finalMetadata.sprite_slices_generated} sprite slices`);

    console.log('\n🎉 All tests passed! New email folder architecture is working correctly.');
    
    return {
      success: true,
      campaignId: emailFolder.campaignId,
      basePath: emailFolder.basePath,
      finalStats: finalMetadata
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailFolderArchitecture()
    .then(result => {
      console.log('\n📋 Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test crashed:', error);
      process.exit(1);
    });
}

export { testEmailFolderArchitecture }; 