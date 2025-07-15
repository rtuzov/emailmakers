// Простой тест для проверки loadEmailFolder
const { execSync } = require('child_process');

async function testLoadFolder() {
  try {
    console.log('🔍 Testing loadEmailFolder via TypeScript...');
    
    // Создаем простой TypeScript скрипт для теста
    const testScript = `
import EmailFolderManager from './src/agent/tools/email-folder-manager';

async function test() {
  const campaignId = 'kupibilet_newyear_sale_family_2025';
  console.log('Testing campaign:', campaignId);
  
  try {
    const emailFolder = await EmailFolderManager.loadEmailFolder(campaignId);
    
    if (emailFolder) {
      console.log('✅ EmailFolder loaded successfully');
      console.log('📁 Campaign ID:', emailFolder.campaignId);
      console.log('📂 Base path:', emailFolder.basePath);
      console.log('📄 HTML path:', emailFolder.htmlPath);
      console.log('📄 MJML path:', emailFolder.mjmlPath);
      
      return emailFolder;
    } else {
      console.log('❌ EmailFolder not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

test().then(result => {
  if (result) {
    console.log('Test completed successfully');
  } else {
    console.log('Test failed');
  }
}).catch(error => {
  console.error('Test error:', error);
});
`;
    
    // Записываем скрипт во временный файл
    const fs = require('fs').promises;
    await fs.writeFile('temp-test.ts', testScript);
    
    // Выполняем с помощью ts-node
    console.log('Executing TypeScript test...');
    const result = execSync('npx ts-node temp-test.ts', { encoding: 'utf8' });
    console.log('Test output:', result);
    
    // Удаляем временный файл
    await fs.unlink('temp-test.ts');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoadFolder(); 