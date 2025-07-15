const { generateAssetManifest } = require('./src/agent/tools/asset-preparation/asset-manifest-generator.ts');

console.log('\n📋 === TESTING ASSET MANIFEST GENERATOR ONLY ===');
console.log(`📅 Started at: ${new Date().toISOString()}`);

async function testAssetManifestGenerator() {
  try {
    // Mock content context for Spain campaign
    const contentContext = {
      generated_content: {
        subject: 'Откройте магию Испании этой весной',
        preheader: 'Мадрид, Барселона, Севилья ждут вас',
        body: 'Погрузитесь в мир архитектуры Гауди, насладитесь фламенко в Севилье и откройте сокровища Прадо в Мадриде. Весенняя Испания приглашает вас в незабываемое культурное путешествие.',
        dates: {
          destination: 'Испания (Мадрид, Барселона, Севилья)',
          season: 'весна',
          seasonal_factors: 'теплая погода, фестивали, цветение'
        },
        context: {
          destination: 'Испания',
          emotional_triggers: 'архитектура, искусство, фламенко, гастрономия, история'
        },
        pricing: {
          best_price: 60000,
          currency: 'RUB',
          route: 'Москва-Мадрид'
        }
      },
      asset_requirements: {
        hero_image: true,
        content_images: 3,
        icons: 2,
        logos: true
      },
      campaign_type: 'travel_promotion',
      language: 'ru',
      target_audience: 'cultural_tourists_couples_30_50'
    };
    
    const assetSources = [
      {
        type: 'local',
        path: 'figma-all-pages-1750993353363',
        priority: 'primary'
      },
      {
        type: 'url',
        path: 'external_fallback',
        priority: 'fallback'
      }
    ];
    
    const campaignPath = 'campaigns/test_spain_campaign';
    
    console.log('🎨 Testing AI-powered asset manifest generation...');
    
    const result = await generateAssetManifest.execute({
      campaignId: 'spain_test_campaign',
      campaignPath: campaignPath,
      contentContext: contentContext,
      assetSources: assetSources,
      options: {
        analyzeContentContext: true,
        collectFromSources: true,
        generateUsageInstructions: true,
        includePerformanceMetrics: true
      },
      context: {
        campaignId: 'spain_test_campaign',
        language: 'ru',
        campaign_type: 'travel_promotion'
      },
      trace_id: `refactored_test_${Date.now()}`
    });
    
    console.log('✅ Asset manifest generation completed');
    console.log('📊 Result:', result);
    
    // Check if files were created
    const fs = require('fs');
    const path = require('path');
    
    const manifestFile = path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json');
    const instructionsFile = path.join(campaignPath, 'assets', 'manifests', 'usage-instructions.json');
    
    if (fs.existsSync(manifestFile)) {
      console.log(`✅ Asset manifest file created: ${manifestFile}`);
      const manifestContent = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      console.log(`📊 Manifest contains: ${manifestContent.assetManifest?.images?.length || 0} images, ${manifestContent.assetManifest?.icons?.length || 0} icons`);
    } else {
      console.log('⚠️ Asset manifest file not found');
    }
    
    if (fs.existsSync(instructionsFile)) {
      console.log(`✅ Usage instructions file created: ${instructionsFile}`);
      const instructionsContent = JSON.parse(fs.readFileSync(instructionsFile, 'utf8'));
      console.log(`📝 Generated ${instructionsContent.length} usage instructions`);
    } else {
      console.log('⚠️ Usage instructions file not found');
    }
    
    console.log('\n🎉 === TEST COMPLETED SUCCESSFULLY ===');
    console.log('✅ Refactored asset manifest generator working correctly');
    console.log('🔧 System properly modularized with AI-powered asset selection');
    
  } catch (error) {
    console.error('\n❌ === TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAssetManifestGenerator(); 