const fs = require('fs').promises;
const path = require('path');

// Тест процесса копирования ассетов в email-renderer
async function testAssetCopyProcess() {
  console.log('🔍 Тестирование процесса копирования ассетов в email-renderer...\n');

  try {
    // Симулируем данные от Design Specialist Agent
    const mockAssets = [
      'src/agent/figma-all-pages-1750993353363/зайцы-эмоции/иллюстрация-грустного-оранжевого-кролика-выражающего-эмоции.png'
    ];
    
    const mockEmailFolder = {
      campaignId: 'test-asset-copy-1751445497597',
      basePath: 'mails/test-asset-copy-1751445497597',
      assetsPath: 'mails/test-asset-copy-1751445497597/assets',
      spritePath: 'mails/test-asset-copy-1751445497597/assets/sprite-slices',
      htmlPath: 'mails/test-asset-copy-1751445497597/email.html',
      mjmlPath: 'mails/test-asset-copy-1751445497597/email.mjml',
      metadataPath: 'mails/test-asset-copy-1751445497597/metadata.json'
    };

    console.log('📁 Создаем тестовую папку email...');
    await fs.mkdir(mockEmailFolder.basePath, { recursive: true });
    await fs.mkdir(mockEmailFolder.assetsPath, { recursive: true });
    console.log(`✅ Папка создана: ${mockEmailFolder.basePath}`);

    console.log('\n🔍 Проверяем существование исходных ассетов:');
    for (const assetPath of mockAssets) {
      try {
        const stats = await fs.stat(assetPath);
        console.log(`✅ Ассет найден: ${assetPath} (${Math.round(stats.size / 1024)}KB)`);
      } catch (error) {
        console.log(`❌ Ассет не найден: ${assetPath}`);
        console.log(`   Ошибка: ${error.message}`);
      }
    }

    console.log('\n💾 Тестируем процесс копирования ассетов:');
    const processedAssets = [];
    
    for (let i = 0; i < mockAssets.length; i++) {
      const assetPath = mockAssets[i];
      try {
        console.log(`🔍 Обрабатываем ассет ${i + 1}/${mockAssets.length}: ${assetPath}`);
        
        // Проверяем существование файла
        await fs.access(assetPath);
        console.log(`  ✅ Файл существует`);
        
        // Extract filename from path
        const fileName = assetPath.split('/').pop();
        console.log(`  📝 Имя файла: ${fileName}`);
        
        // Симулируем EmailFolderManager.saveFigmaAsset
        const destinationPath = path.join(mockEmailFolder.assetsPath, fileName);
        await fs.copyFile(assetPath, destinationPath);
        console.log(`  💾 Скопировано в: ${destinationPath}`);
        
        // Generate relative URL for email
        const relativeUrl = `./assets/${fileName}`;
        processedAssets.push(relativeUrl);
        console.log(`  🔗 Относительный URL: ${relativeUrl}`);
        
        console.log(`  ✅ Ассет ${i + 1} обработан успешно`);
      } catch (error) {
        console.log(`  ❌ Ошибка обработки ассета ${i + 1}:`);
        console.log(`     Код ошибки: ${error.code}`);
        console.log(`     Сообщение: ${error.message}`);
        console.log(`     Путь: ${assetPath}`);
      }
    }

    console.log(`\n📊 РЕЗУЛЬТАТЫ КОПИРОВАНИЯ:`);
    console.log(`🎯 Исходных ассетов: ${mockAssets.length}`);
    console.log(`✅ Успешно скопировано: ${processedAssets.length}`);
    console.log(`🔗 Обработанные URLs: ${processedAssets.join(', ')}`);

    console.log('\n🔍 Проверяем скопированные файлы:');
    const copiedFiles = await fs.readdir(mockEmailFolder.assetsPath);
    console.log(`📁 Файлы в папке assets: ${copiedFiles.length}`);
    copiedFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });

    console.log('\n🏗️ Создаем тестовый HTML с ассетами:');
    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Тест ассетов</title>
</head>
<body>
    <h1>Тест отображения ассетов</h1>
    ${processedAssets.map((asset, index) => `
    <div>
        <h3>Ассет ${index + 1}:</h3>
        <img src="${asset}" alt="Test asset ${index + 1}" style="max-width: 300px;" />
        <p>Путь: ${asset}</p>
    </div>
    `).join('')}
</body>
</html>
    `;

    await fs.writeFile(path.join(mockEmailFolder.basePath, 'test.html'), testHtml);
    console.log(`✅ Тестовый HTML создан: ${mockEmailFolder.basePath}/test.html`);

    console.log('\n🎉 ТЕСТ ЗАВЕРШЕН УСПЕШНО!');
    console.log(`📂 Тестовые файлы в: ${mockEmailFolder.basePath}`);
    console.log(`🌐 Откройте file://${path.resolve(mockEmailFolder.basePath, 'test.html')} в браузере`);

  } catch (error) {
    console.error('❌ Ошибка в тесте:', error);
    throw error;
  }
}

// Запуск теста
if (require.main === module) {
  testAssetCopyProcess()
    .then(() => {
      console.log('\n✅ Тест копирования ассетов завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Тест завершился с ошибкой:', error);
      process.exit(1);
    });
}

module.exports = { testAssetCopyProcess }; 