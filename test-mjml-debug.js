/**
 * TEST MJML DEBUG - Direct tool call to debug MJML content path issue
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project directory
process.chdir(__dirname);

async function testMjmlDebug() {
  try {
    console.log('🔧 Starting MJML Debug Test...');
    
    // Import email renderer tool
    const { emailRendererTool } = await import('./src/agent/tools/agent-tools.js');
    
    // Test parameters that should generate MJML
    const testParams = {
      content_data: JSON.stringify({
        topic: "Travel to Spain",
        urgency: "standard",
        campaign_type: "promotional",
        subject: "Amazing Spanish Adventure Awaits",
        body: "Discover the beauty of Spain with our special travel packages"
      }),
      action: 'render_mjml'
    };
    
    console.log('📧 Calling emailRendererTool with test params...');
    console.log('📋 Test params:', testParams);
    
    // Execute the tool
    const result = await emailRendererTool.execute(testParams);
    
    console.log('\n✅ Tool execution completed!');
    console.log('📄 Result type:', typeof result);
    console.log('📄 Result length:', result?.length || 'unknown');
    
    if (typeof result === 'string') {
      console.log('📄 First 200 chars of result:', result.substring(0, 200));
    } else {
      console.log('📄 Result structure:', Object.keys(result || {}));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Run the test
testMjmlDebug(); 