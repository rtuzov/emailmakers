// Тест прямого сохранения файлов
const path = require('path');

async function testFileSaving() {
  try {
    // Импортируем EmailFolderManager
    const EmailFolderManager = require('./src/agent/tools/email-folder-manager.ts').default;
    
    console.log('🔍 Testing direct file saving...');
    
    // Тестируем с последней кампанией
    const campaignId = 'kupibilet_newyear_sale_family_2025';
    console.log(`\n📁 Testing with campaign: ${campaignId}`);
    
    // Загружаем emailFolder
    const emailFolder = await EmailFolderManager.loadEmailFolder(campaignId);
    
    if (!emailFolder) {
      console.log(`❌ EmailFolder not found for: ${campaignId}`);
      return;
    }
    
    console.log(`✅ EmailFolder loaded successfully`);
    console.log(`📂 Base path: ${emailFolder.basePath}`);
    console.log(`📄 HTML path: ${emailFolder.htmlPath}`);
    console.log(`📄 MJML path: ${emailFolder.mjmlPath}`);
    
    // Тестовые данные
    const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test Email</title>
</head>
<body>
    <h1>Test Email - ${new Date().toISOString()}</h1>
    <p>This is a test email created directly by test script.</p>
</body>
</html>`;
    
    const testMjml = `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>Test MJML - ${new Date().toISOString()}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
    
    console.log(`\n💾 Attempting to save HTML file...`);
    try {
      await EmailFolderManager.saveHtml(emailFolder, testHtml);
      console.log(`✅ HTML saved successfully to: ${emailFolder.htmlPath}`);
    } catch (error) {
      console.log(`❌ HTML save failed:`, error.message);
    }
    
    console.log(`\n💾 Attempting to save MJML file...`);
    try {
      await EmailFolderManager.saveMjml(emailFolder, testMjml);
      console.log(`✅ MJML saved successfully to: ${emailFolder.mjmlPath}`);
    } catch (error) {
      console.log(`❌ MJML save failed:`, error.message);
    }
    
    // Проверяем, что файлы созданы
    const fs = require('fs').promises;
    
    console.log(`\n🔍 Verifying files exist...`);
    try {
      await fs.access(emailFolder.htmlPath);
      console.log(`✅ HTML file exists: ${emailFolder.htmlPath}`);
      
      const htmlContent = await fs.readFile(emailFolder.htmlPath, 'utf8');
      console.log(`📄 HTML content length: ${htmlContent.length} characters`);
      console.log(`📄 HTML preview: ${htmlContent.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ HTML file verification failed:`, error.message);
    }
    
    try {
      await fs.access(emailFolder.mjmlPath);
      console.log(`✅ MJML file exists: ${emailFolder.mjmlPath}`);
      
      const mjmlContent = await fs.readFile(emailFolder.mjmlPath, 'utf8');
      console.log(`📄 MJML content length: ${mjmlContent.length} characters`);
      console.log(`📄 MJML preview: ${mjmlContent.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ MJML file verification failed:`, error.message);
    }
    
    console.log('\n📊 File saving test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFileSaving(); 