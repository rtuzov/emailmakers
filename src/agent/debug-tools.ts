#!/usr/bin/env tsx

import { getFigmaAssets } from './tools/figma';
import { getPrices } from './tools/prices';
import { generateCopy } from './tools/copy';
import { renderMjml } from './tools/mjml';
import { diffHtml } from './tools/diff';
import { patchHtml } from './tools/patch';
import { percySnap } from './tools/percy';
import { renderTest } from './tools/render-test';
import { uploadToS3 } from './tools/upload';

async function debugTool(toolName: string, toolFunction: Function, params: any) {
  console.log(`\n🔧 Testing ${toolName}...`);
  console.log(`Parameters:`, JSON.stringify(params, null, 2));
  
  try {
    const startTime = Date.now();
    const result = await toolFunction(params);
    const endTime = Date.now();
    
    console.log(`✅ ${toolName} completed in ${endTime - startTime}ms`);
    console.log(`Result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.log(`❌ ${toolName} failed:`, error);
    return null;
  }
}

async function debugAllTools() {
  console.log('🚀 Starting tool debugging session...\n');
  
  // T1 - Figma Assets
  const figmaResult = await debugTool('T1 - Figma Assets', getFigmaAssets, {
    tags: ['moscow', 'travel', 'header']
  });
  
  // T2 - Flight Prices
  const pricesResult = await debugTool('T2 - Flight Prices', getPrices, {
    origin: 'LED',
    destination: 'MOW',
    date_range: '2025-02-01,2025-02-15'
  });
  
  // T3 - Content Generation (only if we have prices)
  let contentResult = null;
  if (pricesResult && pricesResult.success) {
    contentResult = await debugTool('T3 - Content Generation', generateCopy, {
      topic: 'Путешествие в Москву',
      prices: pricesResult.data
    });
  } else {
    console.log('⏭️ Skipping T3 - Content Generation (no price data)');
  }
  
  // T4 - MJML Rendering (only if we have content and assets)
  let mjmlResult = null;
  if (contentResult && contentResult.success && figmaResult && figmaResult.success) {
    mjmlResult = await debugTool('T4 - MJML Rendering', renderMjml, {
      content: contentResult.data,
      assets: figmaResult.data
    });
  } else {
    console.log('⏭️ Skipping T4 - MJML Rendering (missing dependencies)');
  }
  
  // T5 - HTML Diff (only if we have HTML)
  let diffResult = null;
  if (mjmlResult && mjmlResult.success && mjmlResult.data.html) {
    diffResult = await debugTool('T5 - HTML Diff', diffHtml, {
      html: mjmlResult.data.html
    });
  } else {
    console.log('⏭️ Skipping T5 - HTML Diff (no HTML content)');
  }
  
  // T6 - HTML Patch (only if diff shows significant issues >10%)
  if (diffResult && diffResult.success && diffResult.data.delta_percentage > 10) {
    await debugTool('T6 - HTML Patch', patchHtml, {
      html: mjmlResult.data.html,
      issues: diffResult.data.critical_changes
    });
  } else {
    console.log(`⏭️ Skipping T6 - HTML Patch (diff: ${diffResult?.data?.delta_percentage || 0}% ≤ 10%)`);
  }
  
  // T7 - Percy Visual Testing (only if we have HTML)
  if (mjmlResult && mjmlResult.success && mjmlResult.data.html) {
    await debugTool('T7 - Percy Visual Testing', percySnap, {
      html: mjmlResult.data.html
    });
  } else {
    console.log('⏭️ Skipping T7 - Percy Visual Testing (no HTML content)');
  }
  
  // T8 - Internal Render Testing (only if we have HTML)
  if (mjmlResult && mjmlResult.success && mjmlResult.data.html) {
    await debugTool('T8 - Internal Render Testing', renderTest, {
      html: mjmlResult.data.html,
      subject: 'Debug Test Email'
    });
  } else {
    console.log('⏭️ Skipping T8 - Internal Render Testing (no HTML content)');
  }
  
  // T9 - S3 Upload (only if we have HTML)
  if (mjmlResult && mjmlResult.success && mjmlResult.data.html) {
    await debugTool('T9 - S3 Upload', uploadToS3, {
      html: mjmlResult.data.html,
      render_test_report: JSON.stringify({ status: 'completed' })
    });
  } else {
    console.log('⏭️ Skipping T9 - S3 Upload (no HTML to upload)');
  }
  
  console.log('\n🏁 Tool debugging session completed!');
}

// Run the debugging session
if (require.main === module) {
  debugAllTools().catch(console.error);
}

export { debugAllTools, debugTool }; 