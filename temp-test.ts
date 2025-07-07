
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
