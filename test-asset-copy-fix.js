const fs = require('fs').promises;
const path = require('path');

async function testAssetCopy() {
  console.log('🧪 Testing asset copy functionality...');
  
  const sourceFile = '/Users/rtuzov/PycharmProjects/Email-Makers/src/agent/figma-all-pages-1750993353363/иллюстрации/изображение-подлока-который-может-использоваться-в-интерьере-или-для-организации-пространства.png';
  const targetDir = '/Users/rtuzov/PycharmProjects/Email-Makers/mails/email-1751447990665-hqi9ve100/assets';
  const targetFile = path.join(targetDir, 'изображение-подлока-который-может-использоваться-в-интерьере-или-для-организации-пространства.png');
  
  try {
    // 1. Проверяем исходный файл
    console.log('📂 Checking source file...');
    const sourceStats = await fs.stat(sourceFile);
    console.log(`✅ Source exists: ${sourceFile} (${sourceStats.size} bytes)`);
    
    // 2. Проверяем целевую папку
    console.log('📁 Checking target directory...');
    const targetStats = await fs.stat(targetDir);
    console.log(`✅ Target dir exists: ${targetDir}`);
    
    // 3. Копируем файл
    console.log('📋 Copying file...');
    await fs.copyFile(sourceFile, targetFile);
    console.log(`✅ File copied successfully!`);
    
    // 4. Проверяем результат
    const copiedStats = await fs.stat(targetFile);
    console.log(`✅ Copied file: ${targetFile} (${copiedStats.size} bytes)`);
    
    // 5. Проверяем содержимое папки assets
    console.log('📋 Listing assets directory...');
    const assetFiles = await fs.readdir(targetDir);
    console.log(`📁 Assets directory contents:`, assetFiles);
    
    console.log('🎉 Asset copy test SUCCESSFUL!');
    
  } catch (error) {
    console.error('❌ Asset copy test FAILED:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testAssetCopy(); 