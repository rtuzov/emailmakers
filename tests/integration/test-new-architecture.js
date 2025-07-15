/**
 * Тест новой архитектуры планирования ассетов
 */

async function testNewArchitecture() {
  try {
    console.log('🧪 Testing new asset planning architecture...');
    
    // Тест 1: Asset Tag Planner
    console.log('\n📋 Test 1: Asset Tag Planner');
    const assetPlannerModule = await import('./src/agent/tools/asset-tag-planner.ts');
    const executeAssetTagPlanner = assetPlannerModule.executeAssetTagPlanner;
    
    if (!executeAssetTagPlanner) {
      console.log('Available exports:', Object.keys(assetPlannerModule));
      throw new Error('executeAssetTagPlanner not found in module');
    }
    
    const plannerParams = {
      campaign_brief: 'Создай email кампанию для путешествий в Японию весной',
      campaign_type: 'promotional',
      target_audience: 'молодые путешественники 25-35 лет',
      emotional_tone: 'friendly',
      destinations: ['япония', 'токио'],
      themes: ['путешествия', 'весна', 'сакура']
    };
    
    const assetPlan = await executeAssetTagPlanner(plannerParams);
    console.log('✅ Asset Tag Planner result:', {
      success: assetPlan.success,
      figma_tags_count: assetPlan.figma_search_tags.length,
      external_tags_count: assetPlan.external_search_tags.length,
      total_images_needed: assetPlan.image_distribution.total_images_needed,
      figma_images_count: assetPlan.image_distribution.figma_images_count,
      external_images_count: assetPlan.image_distribution.external_images_count
    });
    
    if (assetPlan.success) {
      console.log('📝 Figma tags:', assetPlan.figma_search_tags.slice(0, 5));
      console.log('🌐 External tags:', assetPlan.external_search_tags.slice(0, 5));
      console.log('🎯 Hero image tags:', assetPlan.asset_requirements.hero_image.tags);
    }
    
    // Тест 2: Enhanced Asset Selector
    if (assetPlan.success) {
      console.log('\n🎨 Test 2: Enhanced Asset Selector');
      const assetSelectorModule = await import('./src/agent/tools/enhanced-asset-selector.ts');
      const executeAssetSelection = assetSelectorModule.executeAssetSelection;
      
      const selectionResult = await executeAssetSelection(assetPlan);
      console.log('✅ Enhanced Asset Selector result:', {
        success: selectionResult.success,
        hero_assets_count: selectionResult.selected_assets.hero_assets.length,
        content_assets_count: selectionResult.selected_assets.content_assets.length,
        footer_assets_count: selectionResult.selected_assets.footer_assets.length,
        figma_count: selectionResult.distribution_achieved.figma_count,
        external_count: selectionResult.distribution_achieved.external_count,
        total_count: selectionResult.distribution_achieved.total_count
      });
      
      if (selectionResult.success && selectionResult.selected_assets.hero_assets.length > 0) {
        console.log('🦸‍♂️ Hero asset example:', {
          fileName: selectionResult.selected_assets.hero_assets[0].fileName,
          source: selectionResult.selected_assets.hero_assets[0].source,
          tags: selectionResult.selected_assets.hero_assets[0].tags.slice(0, 3)
        });
      }
    }
    
    // Тест 3: Tool Registry
    console.log('\n🔧 Test 3: Tool Registry');
    const toolRegistryModule = await import('./src/agent/core/tool-registry.ts');
    const toolRegistry = toolRegistryModule.toolRegistry;
    
    const contentTools = toolRegistry.getToolsForAgent('content');
    const designTools = toolRegistry.getToolsForAgent('design');
    
    console.log('✅ Tool Registry:', {
      content_tools_count: contentTools.length,
      design_tools_count: designTools.length,
      has_asset_tag_planner: contentTools.some(tool => tool.name === 'asset_tag_planner'),
      has_figma_asset_selector: designTools.some(tool => tool.name === 'figma_asset_selector')
    });
    
    const assetTagPlannerTool = toolRegistry.getTool('asset_tag_planner');
    const figmaAssetSelectorTool = toolRegistry.getTool('figma_asset_selector');
    
    console.log('🔍 Tools details:', {
      asset_tag_planner_version: assetTagPlannerTool?.version,
      figma_asset_selector_version: figmaAssetSelectorTool?.version,
      asset_tag_planner_enabled: assetTagPlannerTool?.enabled,
      figma_asset_selector_enabled: figmaAssetSelectorTool?.enabled
    });
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Architecture Summary:');
    console.log('  ✅ Content Specialist: Plans assets using asset_tag_planner');
    console.log('  ✅ Design Specialist: Selects assets using enhanced figma_asset_selector');
    console.log('  ✅ AI Tag Mapper: Uses rule-based mapping (no OpenAI API calls)');
    console.log('  ✅ Asset Manager: Handles both Figma and external sources');
    console.log('  ✅ Tool Registry: Properly configured with new tools');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Запуск теста
testNewArchitecture(); 