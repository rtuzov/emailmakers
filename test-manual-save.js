// Ручное тестирование сохранения файлов
const fs = require('fs').promises;
const path = require('path');

async function testManualSave() {
  try {
    console.log('🔍 Manual file saving test...');
    
    // Тестируем с последней кампанией
    const campaignId = 'kupibilet_newyear_sale_family_2025';
    const basePath = path.join(process.cwd(), 'mails', campaignId);
    const htmlPath = path.join(basePath, 'email.html');
    const mjmlPath = path.join(basePath, 'email.mjml');
    
    console.log(`\n📁 Testing with campaign: ${campaignId}`);
    console.log(`📂 Base path: ${basePath}`);
    console.log(`📄 HTML path: ${htmlPath}`);
    console.log(`📄 MJML path: ${mjmlPath}`);
    
    // Проверяем существование папки
    try {
      await fs.access(basePath);
      console.log(`✅ Campaign folder exists: ${basePath}`);
    } catch {
      console.log(`❌ Campaign folder missing: ${basePath}`);
      return;
    }
    
    // Тестовые данные
    const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test Email</title>
</head>
<body>
    <h1>Test Email - ${new Date().toISOString()}</h1>
    <p>This is a test email created manually by test script.</p>
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
    
    console.log(`\n💾 Attempting to save HTML file manually...`);
    try {
      await fs.writeFile(htmlPath, testHtml, 'utf8');
      console.log(`✅ HTML saved successfully to: ${htmlPath}`);
    } catch (error) {
      console.log(`❌ HTML save failed:`, error.message);
    }
    
    console.log(`\n💾 Attempting to save MJML file manually...`);
    try {
      await fs.writeFile(mjmlPath, testMjml, 'utf8');
      console.log(`✅ MJML saved successfully to: ${mjmlPath}`);
    } catch (error) {
      console.log(`❌ MJML save failed:`, error.message);
    }
    
    // Проверяем, что файлы созданы
    console.log(`\n🔍 Verifying files exist...`);
    try {
      await fs.access(htmlPath);
      console.log(`✅ HTML file exists: ${htmlPath}`);
      
      const htmlContent = await fs.readFile(htmlPath, 'utf8');
      console.log(`📄 HTML content length: ${htmlContent.length} characters`);
      console.log(`📄 HTML preview: ${htmlContent.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ HTML file verification failed:`, error.message);
    }
    
    try {
      await fs.access(mjmlPath);
      console.log(`✅ MJML file exists: ${mjmlPath}`);
      
      const mjmlContent = await fs.readFile(mjmlPath, 'utf8');
      console.log(`📄 MJML content length: ${mjmlContent.length} characters`);
      console.log(`📄 MJML preview: ${mjmlContent.substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ MJML file verification failed:`, error.message);
    }
    
    console.log('\n📊 Manual file saving test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testManualSave(); 