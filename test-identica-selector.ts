import { selectIdenticaCreatives } from './src/agent/tools/identica-selector';

async function testIdenticaSelector() {
  console.log('🧪 Testing Identica Creative Selector...');
  
  // Test 1: Promotional campaign with logo preference
  console.log('\n📋 Test 1: Promotional campaign with logo preference');
  try {
    const result1 = await selectIdenticaCreatives({
      campaign_type: 'promotional',
      prefer_logo: true,
      target_count: 2,
      tags: ['логотип', 'брендинг']
    });
    
    console.log('✅ Test 1 Result:', {
      success: result1.success,
      selectedCount: result1.data?.selected_assets?.length || 0,
      totalAvailable: result1.data?.total_available || 0,
      confidence: result1.data?.confidence_score || 0,
      assets: result1.data?.selected_assets?.map(asset => ({
        fileName: asset.fileName,
        tags: asset.tags.slice(0, 3), // показываем только первые 3 тега
        description: asset.description.substring(0, 50) + '...'
      })) || []
    });
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
  }
  
  // Test 2: Brand campaign
  console.log('\n📋 Test 2: Brand campaign');
  try {
    const result2 = await selectIdenticaCreatives({
      campaign_type: 'brand',
      emotional_tone: 'позитивный',
      target_count: 1,
      prefer_premium: true
    });
    
    console.log('✅ Test 2 Result:', {
      success: result2.success,
      selectedCount: result2.data?.selected_assets?.length || 0,
      selectionCriteria: result2.data?.selection_criteria || 'Unknown',
      assets: result2.data?.selected_assets?.map(asset => asset.fileName) || []
    });
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
  }
  
  // Test 3: Default selection
  console.log('\n📋 Test 3: Default selection (no specific criteria)');
  try {
    const result3 = await selectIdenticaCreatives({
      target_count: 3
    });
    
    console.log('✅ Test 3 Result:', {
      success: result3.success,
      selectedCount: result3.data?.selected_assets?.length || 0,
      diverseSelection: result3.data?.selected_assets?.map(asset => ({
        fileName: asset.fileName,
        tone: asset.tone,
        confidence: asset.confidence
      })) || []
    });
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }
  
  console.log('\n🏁 Identica Selector testing completed!');
}

// Run the test
testIdenticaSelector().catch(console.error); 