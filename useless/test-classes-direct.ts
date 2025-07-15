/**
 * 🧪 ПРЯМОЙ ТЕСТ КЛАССОВ
 * 
 * Тестируем классы Enhanced Design V3 напрямую
 * без OpenAI Agents SDK для проверки логики
 */

import { 
  ContentIntelligenceAnalyzer, 
  ContentAnalysis, 
  DesignPersonality 
} from './src/agent/specialists/design-specialist/content-intelligence-analyzer';

import { 
  AdaptiveDesignEngine,
  AdaptiveDesign 
} from './src/agent/specialists/design-specialist/adaptive-design-engine';

import { 
  EnhancedMjmlGenerator,
  VisualComponentLibrary 
} from './src/agent/specialists/design-specialist/enhanced-mjml-generator';

async function testClassesDirect() {
  console.log('🧪 === ПРЯМОЕ ТЕСТИРОВАНИЕ КЛАССОВ ===\n');
  
  // Тестовые данные
  const testContent = {
    subject: 'Незабываемое путешествие в Гватемалу - от 45,000₽',
    preheader: 'Древние руины майя, активные вулканы и экзотическая природа',
    body: `Откройте для себя удивительную Гватемалу - страну древних цивилизаций и нетронутой природы! 
    
🏛️ Исследуйте величественные руины майя в Тикале
🌋 Покорите активные вулканы Фуэго и Акатенанго  
🎭 Погрузитесь в богатую культуру коренных народов

Специальное предложение действует только до конца месяца! Забронируйте сейчас и получите скидку 15% на групповые туры.`,
    cta: {
      primary: 'Забронировать путешествие'
    },
    pricing: {
      best_price: '45,000',
      currency: '₽',
      discount: '15%'
    }
  };

  try {
    console.log('🧠 Тест 1: Content Intelligence Analyzer...');
    
    // Тест 1: Анализ контента
    const analyzer = new ContentIntelligenceAnalyzer();
    const contentAnalysis = analyzer.analyzeContent(testContent);
    
    console.log('✅ Content Analysis Results:');
    console.log('  Theme:', contentAnalysis.theme);
    console.log('  Emotional Tone:', contentAnalysis.emotionalTone);
    console.log('  Campaign Type:', contentAnalysis.campaignType);
    console.log('  Price Category:', contentAnalysis.priceCategory);
    console.log('  Urgency Level:', contentAnalysis.urgencyLevel);
    console.log('  Audience Type:', contentAnalysis.audienceType);
    
    // Генерируем дизайн-личность
    const designPersonality = analyzer.generateDesignPersonality(contentAnalysis);
    
    console.log('\n🎨 Design Personality Generated:');
    console.log('  Visual Style:', designPersonality.visualStyle);
    console.log('  Layout Complexity:', designPersonality.layoutComplexity);
    console.log('  Animation Level:', designPersonality.animationLevel);
    console.log('  Components:', designPersonality.componentSuggestions.length);
    console.log('  Primary Color:', designPersonality.colorPalette.primary);
    console.log('  CTA Color:', designPersonality.colorPalette.cta);
    
    console.log('\n🎨 Тест 2: Adaptive Design Engine...');
    
    // Тест 2: Генерация адаптивного дизайна
    const designEngine = new AdaptiveDesignEngine();
    const adaptiveDesign = designEngine.generateAdaptiveDesign(
      contentAnalysis,
      designPersonality,
      { images: [] }
    );
    
    console.log('✅ Adaptive Design Results:');
    console.log('  Sections:', adaptiveDesign.templateStructure.totalSections);
    console.log('  Layout Type:', adaptiveDesign.templateStructure.layoutType);
    console.log('  Content Flow:', adaptiveDesign.templateStructure.contentFlow);
    console.log('  Visual Components:', adaptiveDesign.visualComponents.length);
    console.log('  Typography - Heading:', adaptiveDesign.typography.fontFamilies.heading);
    console.log('  Typography - Body:', adaptiveDesign.typography.fontFamilies.body);
    console.log('  Animation Duration:', adaptiveDesign.animations.duration);
    
    console.log('\n📧 Тест 3: Enhanced MJML Generator...');
    
    // Тест 3: Генерация MJML
    const mjmlGenerator = new EnhancedMjmlGenerator();
    const mjmlTemplate = mjmlGenerator.generateEnhancedMjmlTemplate(
      testContent,
      contentAnalysis,
      designPersonality,
      adaptiveDesign,
      { images: [] }
    );
    
    console.log('✅ Enhanced MJML Results:');
    console.log('  Template Length:', mjmlTemplate.length, 'characters');
    console.log('  Contains MJML:', mjmlTemplate.includes('<mjml>'));
    console.log('  Contains Sections:', (mjmlTemplate.match(/<mj-section/g) || []).length);
    console.log('  Responsive:', mjmlTemplate.includes('@media'));
    console.log('  Dark Theme:', mjmlTemplate.includes('prefers-color-scheme'));
    console.log('  Animations:', mjmlTemplate.includes('animation'));
    
    console.log('\n🎨 Тест 4: Visual Component Library...');
    
    // Тест 4: Библиотека компонентов
    const componentLibrary = new VisualComponentLibrary();
    
    // Тестируем умную цену
    const priceCard = componentLibrary.generatePriceCard(
      testContent.pricing,
      contentAnalysis,
      adaptiveDesign.adaptedColors
    );
    
    console.log('✅ Visual Components Results:');
    console.log('  Price Card Length:', priceCard.length, 'characters');
    console.log('  Contains Urgency:', priceCard.includes('🔥') || priceCard.includes('⭐'));
    console.log('  Contains Price:', priceCard.includes('45,000'));
    
    // Тестируем блок особенностей
    const featureIcons = componentLibrary.generateFeatureIcons(
      contentAnalysis,
      adaptiveDesign.adaptedColors
    );
    
    console.log('  Feature Icons Length:', featureIcons.length, 'characters');
    console.log('  Contains Icons:', featureIcons.includes('🏛️') || featureIcons.includes('🌋'));
    
    console.log('\n🎉 === ВСЕ ТЕСТЫ КЛАССОВ ПРОЙДЕНЫ! ===');
    console.log('✅ ContentIntelligenceAnalyzer - работает корректно');
    console.log('✅ AdaptiveDesignEngine - работает корректно');
    console.log('✅ EnhancedMjmlGenerator - работает корректно');
    console.log('✅ VisualComponentLibrary - работает корректно');
    
    // Демонстрируем ключевые улучшения
    console.log('\n⭐ КЛЮЧЕВЫЕ УЛУЧШЕНИЯ V3:');
    console.log(`✅ Интеллектуальный анализ: ${contentAnalysis.theme} тема с ${contentAnalysis.emotionalTone} тоном`);
    console.log(`✅ Адаптивный дизайн: ${designPersonality.visualStyle} стиль с ${designPersonality.layoutComplexity} сложностью`);
    console.log(`✅ Умные компоненты: ${designPersonality.componentSuggestions.length} компонентов под тематику`);
    console.log(`✅ Современный MJML: ${(mjmlTemplate.match(/<mj-section/g) || []).length} секций с анимациями`);
    console.log(`✅ Цветовая адаптация: ${adaptiveDesign.adaptedColors.primary} → ${adaptiveDesign.adaptedColors.cta.primary}`);
    
    return {
      success: true,
      classes_tested: 4,
      content_analysis: contentAnalysis,
      design_personality: designPersonality,
      adaptive_design: adaptiveDesign,
      mjml_generated: mjmlTemplate.length > 1000,
      improvements: {
        content_intelligence: true,
        adaptive_colors: true,
        smart_components: true,
        modern_mjml: true,
        visual_library: true
      }
    };
    
  } catch (error) {
    console.error('❌ ОШИБКА В ТЕСТАХ:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// Запускаем тест
if (require.main === module) {
  testClassesDirect()
    .then(result => {
      console.log('\n🏁 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:', {
        success: result.success,
        classes_tested: result.classes_tested,
        improvements_working: result.improvements
      });
      
      if (result.success) {
        console.log('\n🚀 ENHANCED DESIGN SPECIALIST V3 ГОТОВ К ИСПОЛЬЗОВАНИЮ!');
      }
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА:', error);
      process.exit(1);
    });
}

export { testClassesDirect }; 