// ТЕСТ ASSET MANIFEST GENERATION
const fs = require('fs').promises;
const path = require('path');

async function testAssetManifestGeneration() {
  console.log('🧪 ТЕСТ ASSET MANIFEST GENERATION');
  console.log('===================================');
  
  // 1. Проверяем переменные окружения
  console.log('\n1️⃣ ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:');
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'УСТАНОВЛЕН' : 'НЕ УСТАНОВЛЕН'}`);
  console.log(`OPENAI_API_KEY длина: ${process.env.OPENAI_API_KEY?.length || 0}`);
  console.log(`UNSPLASH_ACCESS_KEY: ${process.env.UNSPLASH_ACCESS_KEY ? 'УСТАНОВЛЕН' : 'НЕ УСТАНОВЛЕН'}`);
  
  // 2. Проверяем figma-assets
  console.log('\n2️⃣ ПРОВЕРКА FIGMA-ASSETS:');
  try {
    const figmaAssetsPath = path.resolve('figma-assets');
    await fs.access(figmaAssetsPath);
    console.log(`✅ figma-assets существует: ${figmaAssetsPath}`);
    
    // Проверяем ai-optimized-tags.json
    const tagsPath = path.join(figmaAssetsPath, 'ai-optimized-tags.json');
    await fs.access(tagsPath);
    console.log(`✅ ai-optimized-tags.json существует`);
    
    // Читаем размер файла
    const tagsStats = await fs.stat(tagsPath);
    console.log(`📊 ai-optimized-tags.json размер: ${tagsStats.size} bytes`);
    
  } catch (error) {
    console.log(`❌ Ошибка с figma-assets: ${error.message}`);
  }
  
  // 3. Тестируем OpenAI API соединение
  console.log('\n3️⃣ ТЕСТ OPENAI API:');
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: 'Test connection'
            }
          ],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        console.log(`✅ OpenAI API подключение успешно (${response.status})`);
      } else {
        console.log(`❌ OpenAI API ошибка: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`📄 Ответ: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ OpenAI API соединение не удалось: ${error.message}`);
    }
  } else {
    console.log(`⚠️ OPENAI_API_KEY не установлен, пропускаем тест API`);
  }
  
  // 4. Симуляция создания Asset Manifest
  console.log('\n4️⃣ СИМУЛЯЦИЯ ASSET MANIFEST:');
  try {
    const campaignPath = './campaigns/campaign_1752739134448_5j9jw4jgcl6';
    const manifestsDir = path.join(campaignPath, 'assets', 'manifests');
    
    // Проверяем существует ли campaign
    await fs.access(campaignPath);
    console.log(`✅ Campaign path существует: ${campaignPath}`);
    
    // Проверяем manifests директорию
    await fs.access(manifestsDir);
    console.log(`✅ Manifests directory существует: ${manifestsDir}`);
    
    // Читаем содержимое manifests
    const manifestFiles = await fs.readdir(manifestsDir);
    console.log(`📁 Файлы в manifests: ${manifestFiles.length}`);
    manifestFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    // Создаем тестовый базовый манифест
    const testManifest = {
      manifestId: `test_${Date.now()}`,
      assetManifest: {
        images: [{
          id: 'test-hero',
          path: '/test/hero.jpg',
          alt_text: 'Test image',
          usage: 'hero-section'
        }],
        icons: [],
        fonts: [{
          id: 'default-font',
          family: 'Arial, sans-serif',
          weights: ['400', '700']
        }]
      },
      testCreated: new Date().toISOString()
    };
    
    const testManifestPath = path.join(manifestsDir, 'test-asset-manifest.json');
    await fs.writeFile(testManifestPath, JSON.stringify(testManifest, null, 2));
    console.log(`✅ Тестовый манифест создан: ${testManifestPath}`);
    
  } catch (error) {
    console.log(`❌ Ошибка симуляции: ${error.message}`);
  }
  
  console.log('\n🎯 РЕЗУЛЬТАТ ТЕСТА:');
  console.log('Тест завершен. Проверьте результаты выше.');
}

// Запуск теста
testAssetManifestGeneration().catch(console.error); 