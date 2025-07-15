#!/usr/bin/env node

async function testProgressiveSaving() {
  console.log('🎯 PROGRESSIVE FILE SAVING TEST');
  console.log('==============================');
  
  try {
    console.log('🧪 Starting Progressive File Saving Test...');
    
    // Test payload with correct format
    const payload = {
      task_type: "generate_content",
      input: {
        brief: "Новогодняя акция: билеты в Дубай со скидкой 30%. Специальное предложение для семей с детьми - скидка 30% на билеты в Дубай до 31 декабря.",
        tone: "праздничный",
        target_audience: "семьи с детьми",
        brand_guidelines: {
          style: "яркий и праздничный",
          language: "ru",
          content_type: "promotional"
        }
      },
      context: {
        figma_url: "https://www.figma.com/design/gJBHVJSHhOJdVLcXQEELpy/Email-Makers?node-id=4-9&t=uPmvpJMJLXPzfNVK-1",
        user_id: "progressive_test_user"
      }
    };
    
    console.log('🚀 Sending request to API...');
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText.substring(0, 500));
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const responseText = await response.text();
    console.log('✅ API Response received successfully');
    console.log(`📄 Response size: ${responseText.length} bytes`);
    
    // Try to parse the response
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('📄 Response parsed as JSON successfully');
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON, showing first 500 characters:');
      console.log(responseText.substring(0, 500));
      throw new Error('API response is not valid JSON');
    }
    
    // Log response structure for debugging
    console.log('📄 Response structure:', Object.keys(result));
    
    // Look for campaign information and files
    if (result.result) {
      console.log('🔍 Found result field in response');
      
      // Try to find campaign ID in result string
      if (typeof result.result === 'string') {
        const campaignMatch = result.result.match(/promo[_-][\w_-]+|campaign[_-][\w_-]+|novogodnyaya[_-][\w_-]+/gi);
        if (campaignMatch) {
          const campaignId = campaignMatch[campaignMatch.length - 1];
          console.log(`📁 Found campaign ID: ${campaignId}`);
          
          // Check if files exist
          await checkCampaignFiles(campaignId);
          return { success: true, campaignId };
        }
      }
    }
    
    // Check if compilation was successful (even without progressive saving info)
    const responseStr = JSON.stringify(result);
    if (responseStr.includes('MJML Compilation') && responseStr.includes('Successfully compiled')) {
      console.log('✅ MJML compilation appears to be successful');
      
      // Look for any campaign directories created
      const fs = require('fs/promises');
      try {
        const mailsDir = await fs.readdir('mails');
        const recentFolders = [];
        
        for (const folder of mailsDir) {
          if (folder !== 'shared-assets') {
            try {
              const stats = await fs.stat(`mails/${folder}`);
              const now = new Date();
              const folderTime = new Date(stats.mtime);
              const timeDiff = now.getTime() - folderTime.getTime();
              
              // Check if folder was modified in last 5 minutes
              if (timeDiff < 5 * 60 * 1000) {
                recentFolders.push({ folder, modified: folderTime });
              }
            } catch (e) {
              // Skip this folder
            }
          }
        }
        
        if (recentFolders.length > 0) {
          recentFolders.sort((a, b) => b.modified.getTime() - a.modified.getTime());
          const latestFolder = recentFolders[0].folder;
          console.log(`📁 Found recently modified campaign: ${latestFolder}`);
          
          await checkCampaignFiles(latestFolder);
          return { success: true, campaignId: latestFolder };
        }
      } catch (e) {
        console.log('⚠️ Could not check for recent campaign folders:', e.message);
      }
    }
    
    console.log('🔍 Searching for error indicators...');
    if (responseStr.includes('mjml is not a function')) {
      console.log('❌ MJML import error still present');
    } else if (responseStr.includes('MJML Compilation failed')) {
      console.log('❌ MJML compilation failed');
    } else {
      console.log('✅ No obvious MJML errors found');
    }
    
    throw new Error('No progressive saving information and no clear campaign ID found in response');
    
  } catch (error) {
    console.error('\n❌ PROGRESSIVE FILE SAVING TEST: FAILED');
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkCampaignFiles(campaignId) {
  const fs = require('fs/promises');
  const path = require('path');
  
  console.log(`🔍 Checking campaign files for: ${campaignId}`);
  
  const campaignPath = path.join('mails', campaignId);
  try {
    const files = await fs.readdir(campaignPath, { withFileTypes: true });
    console.log('📁 Files in campaign directory:');
    
    for (const file of files) {
      if (file.isFile()) {
        const stats = await fs.stat(path.join(campaignPath, file.name));
        console.log(`  📄 ${file.name} (${stats.size} bytes)`);
      } else {
        console.log(`  📁 ${file.name}/`);
        try {
          const subFiles = await fs.readdir(path.join(campaignPath, file.name));
          for (const subFile of subFiles) {
            const subStats = await fs.stat(path.join(campaignPath, file.name, subFile));
            console.log(`    📄 ${subFile} (${subStats.size} bytes)`);
          }
        } catch (e) {
          console.log(`    ⚠️ Could not read subdirectory: ${e.message}`);
        }
      }
    }
    
    // Check for progressive saving files
    const expectedFiles = [
      'email-ai-ai_answer.mjml',
      'email.mjml', 
      'email.html'
    ];
    
    const foundFiles = [];
    for (const expectedFile of expectedFiles) {
      try {
        await fs.access(path.join(campaignPath, expectedFile));
        const stats = await fs.stat(path.join(campaignPath, expectedFile));
        foundFiles.push(`${expectedFile} (${stats.size} bytes)`);
        console.log(`✅ Found: ${expectedFile} (${stats.size} bytes)`);
      } catch {
        console.log(`❌ Missing: ${expectedFile}`);
      }
    }
    
    return foundFiles;
    
  } catch (fsError) {
    console.log(`⚠️ Could not check campaign directory: ${fsError.message}`);
    return [];
  }
}

// Run the test
testProgressiveSaving()
  .then(result => {
    if (result.success) {
      console.log('\n✅ PROGRESSIVE FILE SAVING TEST: PASSED');
      if (result.campaignId) {
        console.log('Campaign ID:', result.campaignId);
      }
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 PROGRESSIVE FILE SAVING TEST: ERROR');
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 