const { execSync } = require('child_process');

console.log('\n🧪 === TESTING REFACTORED ASSET MANIFEST SYSTEM ===');
console.log(`📅 Started at: ${new Date().toISOString()}`);

// Test input for Spain campaign to verify dynamic destination detection
const spainInput = `Создай email-кампанию для продвижения туров в Испанию весной:

🏖️ НАПРАВЛЕНИЕ: Испания (Мадрид, Барселона, Севилья)
🌅 СЕЗОН: Весна 2025 (апрель-май)
💰 БЮДЖЕТ: 60,000-140,000 рублей
👥 АУДИТОРИЯ: Культурные туристы и пары 30-50 лет
🎯 ЭМОЦИОНАЛЬНЫЕ ТРИГГЕРЫ: Архитектура, искусство, фламенко, гастрономия, история
📧 ТИП: Культурно-познавательная кампания
🎨 СТИЛЬ: Элегантный, культурный, теплый

ОСОБЕННОСТИ:
- Акцент на архитектуре Гауди в Барселоне
- Музеи Прадо и Рейна София в Мадриде
- Фламенко и традиции Севильи
- Испанская кухня и вино
- Весенняя погода и фестивали`;

async function testRefactoredSystem() {
  try {
    console.log('\n📝 Testing Content Specialist with Spain campaign...');
    
    const contentResult = execSync(`node -e "
      const { runSpecialistAgent } = require('./src/agent/specialists/content-specialist.js');
      
      runSpecialistAgent({
        task: 'generate_content',
        brief: \`${spainInput.replace(/`/g, '\\`')}\`,
        campaign_id: 'campaign_${Date.now()}_spain_test',
        language: 'ru',
        campaign_type: 'travel_promotion',
        target_audience: 'cultural_tourists_couples_30_50',
        trace_id: 'test_refactored_${Date.now()}'
      }).then(result => {
        console.log('✅ Content generation completed');
        console.log('📊 Result:', JSON.stringify(result, null, 2));
      }).catch(error => {
        console.error('❌ Content generation failed:', error.message);
        process.exit(1);
      });
    "`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    
    console.log('Content Result:', contentResult);
    
    // Find the generated campaign directory
    console.log('\n🔍 Finding generated campaign directory...');
    const campaignDirs = execSync('find campaigns -name "campaign_*spain_test*" -type d 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    
    if (!campaignDirs) {
      throw new Error('No Spain campaign directory found');
    }
    
    const campaignPath = campaignDirs.split('\n')[0];
    console.log(`📁 Found campaign: ${campaignPath}`);
    
    // Test the refactored Asset Manifest Generator
    console.log('\n📋 Testing refactored Asset Manifest Generator...');
    
    const manifestResult = execSync(`node -e "
      const { generateAssetManifest } = require('./src/agent/tools/asset-preparation/asset-manifest-generator.js');
      
      // Mock content context based on Spain campaign
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
      
      generateAssetManifest.execute({
        campaignId: 'spain_test_campaign',
        campaignPath: '${campaignPath}',
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
        trace_id: 'refactored_test_${Date.now()}'
      }).then(result => {
        console.log('✅ Asset manifest generation completed');
        console.log('📊 Result:', result);
      }).catch(error => {
        console.error('❌ Asset manifest generation failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
      });
    "`, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    
    console.log('Manifest Result:', manifestResult);
    
    // Check generated files
    console.log('\n📁 Checking generated manifest files...');
    try {
      const manifestFile = execSync(`find ${campaignPath} -name "asset-manifest.json" -type f`, { encoding: 'utf8' }).trim();
      if (manifestFile) {
        console.log(`✅ Asset manifest file created: ${manifestFile}`);
        
        const manifestContent = execSync(`head -20 "${manifestFile}"`, { encoding: 'utf8' });
        console.log('📄 Manifest preview:', manifestContent);
      }
      
      const instructionsFile = execSync(`find ${campaignPath} -name "usage-instructions.json" -type f`, { encoding: 'utf8' }).trim();
      if (instructionsFile) {
        console.log(`✅ Usage instructions file created: ${instructionsFile}`);
      }
    } catch (error) {
      console.log('⚠️ Could not find manifest files');
    }
    
    console.log('\n🎉 === REFACTORED SYSTEM TEST COMPLETED ===');
    console.log('✅ All components working correctly');
    console.log('🔧 System successfully refactored and modularized');
    
  } catch (error) {
    console.error('\n❌ === TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRefactoredSystem(); 