import { EmailGeneratorAgent } from './agent';
import { splitFigmaSprite } from './tools/figma-sprite-splitter';
import { aiQualityConsultant } from './tools/ai-quality-consultant';
import { getFigmaAssets } from './tools/figma';

/**
 * Test script to verify T10 and T11 tools are working correctly
 */
async function testAgentTools() {
  console.log('🧪 Testing Agent Tools (T10 & T11)');
  console.log('=====================================\n');

  // Test 1: Figma Assets API vs Local
  console.log('📋 Test 1: Figma Assets Retrieval');
  console.log('----------------------------------');
  
  try {
    const figmaResult = await getFigmaAssets({
      tags: ['заяц', 'счастлив'],
      context: {
        campaign_type: 'promotional',
        emotional_tone: 'positive',
        target_count: 2
      }
    });
    
    console.log('✅ Figma Assets Result:');
    console.log(`   Source: ${figmaResult.metadata?.source}`);
    console.log(`   Assets found: ${figmaResult.data?.paths?.length || 0}`);
    
    if (figmaResult.data?.paths?.length > 0) {
      console.log(`   First asset: ${figmaResult.data.paths[0]}`);
    }
    
  } catch (error) {
    console.log('❌ Figma Assets failed:', error.message);
  }

  console.log('\n');

  // Test 2: Sprite Splitter (if we have a sprite file)
  console.log('📋 Test 2: Figma Sprite Splitter');
  console.log('----------------------------------');
  
  try {
    // Check if we have any sprite files in figma-assets
    const fs = require('fs').promises;
    const path = require('path');
    
    const figmaAssetsDir = path.resolve(process.cwd(), 'figma-assets');
    
    try {
      const files = await fs.readdir(figmaAssetsDir);
      const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
      
      if (pngFiles.length > 0) {
        const testFile = path.join(figmaAssetsDir, pngFiles[0]);
        console.log(`   Testing sprite splitter on: ${pngFiles[0]}`);
        
        const spriteResult = await splitFigmaSprite({
          path: testFile,
          h_gap: 15,
          v_gap: 15,
          confidence_threshold: 0.8
        });
        
        console.log('✅ Sprite Splitter Result:');
        console.log(`   Success: ${spriteResult.success}`);
        console.log(`   Slices generated: ${spriteResult.slices_generated || 0}`);
        console.log(`   Processing time: ${spriteResult.processing_time || 0}ms`);
        
      } else {
        console.log('⚠️ No PNG files found in figma-assets directory');
      }
    } catch (dirError) {
      console.log('⚠️ figma-assets directory not found or empty');
    }
    
  } catch (error) {
    console.log('❌ Sprite Splitter failed:', error.message);
  }

  console.log('\n');

  // Test 3: AI Quality Consultant
  console.log('📋 Test 3: AI Quality Consultant');
  console.log('----------------------------------');
  
  try {
    const mockHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Email</title>
    </head>
    <body>
      <h1>Тестовое письмо</h1>
      <p>Это тестовое письмо для проверки AI Quality Consultant</p>
      <a href="#" style="background: #4BFF7E; color: white; padding: 10px;">Купить билет</a>
    </body>
    </html>
    `;

    const consultantResult = await aiQualityConsultant({
      html_content: mockHtml,
      mjml_source: '<mjml><mj-body><mj-text>Test</mj-text></mj-body></mjml>',
      topic: 'Тестовая кампания',
      campaign_type: 'promotional',
      target_audience: 'travelers',
      assets_used: {
        original_assets: [],
        processed_assets: []
      },
      render_test_results: {
        overall_score: 85,
        client_compatibility: { gmail: 90, outlook: 80 },
        issues_found: ['Minor spacing issue']
      }
    });
    
    console.log('✅ AI Quality Consultant Result:');
    console.log(`   Overall Score: ${(consultantResult as any).score}/100`);
    console.log(`   Quality Grade: ${(consultantResult as any).grade || 'N/A'}`);
    console.log(`   Recommendations: ${(consultantResult as any).recommendations?.length || 0}`);
    console.log(`   Should Continue: ${(consultantResult as any).should_continue || false}`);
    console.log(`   Next Action: ${(consultantResult as any).next_action || 'None'}`);
    
  } catch (error) {
    console.log('❌ AI Quality Consultant failed:', error.message);
  }

  console.log('\n');

  // Test 4: Full Agent Integration Test
  console.log('📋 Test 4: Full Agent Integration');
  console.log('----------------------------------');
  
  try {
    const agent = new EmailGeneratorAgent(false); // Без UltraThink для простоты
    
    const testRequest = {
      topic: 'Скидки на билеты в Париж',
      origin: 'MOW',
      destination: 'CDG',
      campaign_type: 'promotional' as const,
      target_audience: 'leisure travelers',
      tone: 'friendly'
    };
    
    console.log(`   Starting email generation for: ${testRequest.topic}`);
    console.log(`   Route: ${testRequest.origin} → ${testRequest.destination}`);
    
    // Это займет время, поэтому добавим таймаут
    const result = await Promise.race([
      agent.generateEmail(testRequest),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 60 seconds')), 60000)
      )
    ]) as any; // Type assertion for testing
    
    console.log('✅ Full Agent Result:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Generation time: ${result.generation_time}ms`);
    console.log(`   HTML URL: ${result.html_url || 'Not generated'}`);
    console.log(`   QA Results: Layout ${result.layout_regression}, Render ${result.render_testing}`);
    
  } catch (error) {
    console.log('❌ Full Agent failed:', error.message);
  }

  console.log('\n🏁 Testing completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAgentTools().catch(console.error);
}

export { testAgentTools }; 