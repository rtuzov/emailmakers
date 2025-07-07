// Тест EmailFolderManager.loadEmailFolder
const path = require('path');

async function testEmailFolderManager() {
  try {
    // Импортируем EmailFolderManager
    const EmailFolderManager = require('./src/agent/tools/email-folder-manager.ts').default;
    
    console.log('🔍 Testing EmailFolderManager.loadEmailFolder...');
    
    // Список существующих кампаний
    const existingCampaigns = [
      'kupibilet_newyear_sale_family_2025',
      'kupibilet-newyear_2024',
      'japan-winter-campaign-2024',
      'japan-winter-family-2024'
    ];
    
    for (const campaignId of existingCampaigns) {
      console.log(`\n📁 Testing campaign: ${campaignId}`);
      
      try {
        const emailFolder = await EmailFolderManager.loadEmailFolder(campaignId);
        
        if (emailFolder) {
          console.log(`✅ Found: ${campaignId}`);
          console.log(`📂 Base path: ${emailFolder.basePath}`);
          console.log(`📄 HTML path: ${emailFolder.htmlPath}`);
          console.log(`📄 MJML path: ${emailFolder.mjmlPath}`);
          
          // Проверяем существование файлов
          const fs = require('fs').promises;
          
          try {
            await fs.access(emailFolder.htmlPath);
            console.log(`✅ HTML file exists: ${emailFolder.htmlPath}`);
          } catch {
            console.log(`❌ HTML file missing: ${emailFolder.htmlPath}`);
          }
          
          try {
            await fs.access(emailFolder.mjmlPath);
            console.log(`✅ MJML file exists: ${emailFolder.mjmlPath}`);
          } catch {
            console.log(`❌ MJML file missing: ${emailFolder.mjmlPath}`);
          }
          
        } else {
          console.log(`❌ Not found: ${campaignId}`);
        }
      } catch (error) {
        console.log(`❌ Error loading ${campaignId}:`, error.message);
      }
    }
    
    console.log('\n📊 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailFolderManager(); 