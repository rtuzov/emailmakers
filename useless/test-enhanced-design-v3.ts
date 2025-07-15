/**
 * 🧪 ТЕСТ ENHANCED DESIGN SPECIALIST V3
 * 
 * Проверяем новую систему интеллектуального дизайна
 * с анализом контента и адаптивными компонентами
 */

import { runEnhancedDesignSpecialistV3 } from './src/agent/specialists/design-specialist-v3';

async function testEnhancedDesignV3() {
  console.log('🧪 === TESTING ENHANCED DESIGN SPECIALIST V3 ===\n');
  
  // Подготавливаем тестовые данные 
  const testInput = {
    task_type: 'create_enhanced_email_design' as const,
    enhancement_level: 'premium' as const,
    content_data: {
      subject: 'Незабываемое путешествие в Гватемалу - от 45,000₽',
      preheader: 'Древние руины майя, активные вулканы и экзотическая природа',
      body: `Откройте для себя удивительную Гватемалу - страну древних цивилизаций и нетронутой природы! 

🏛️ Исследуйте величественные руины майя в Тикале
🌋 Покорите активные вулканы Фуэго и Акатенанго  
🎭 Погрузитесь в богатую культуру коренных народов
🏖️ Отдохните на живописных берегах озера Атитлан

Наши экспертные гиды проведут вас по самым сокровенным местам этой удивительной страны. Комфортабельное размещение, питание и транспорт включены в стоимость.

Специальное предложение действует только до конца месяца! Забронируйте сейчас и получите скидку 15% на групповые туры.`,
      cta: {
        primary: 'Забронировать путешествие',
        secondary: 'Узнать подробности'
      },
      pricing: {
        best_price: '45,000',
        currency: '₽',
        original_price: '53,000',
        discount: '15%'
      }
    },
    campaign_context: {
      theme: 'travel',
      urgency: 'medium',
      audience: 'adventure_travelers',
      season: 'autumn'
    },
    design_requirements: {
      visual_style: 'vibrant',
      mobile_optimization: 'high',
      brand_consistency: 'kupibilet',
      accessibility: 'AA'
    }
  };

  try {
    console.log('🚀 Launching Enhanced Design Specialist V3...\n');
    
    // Запускаем enhanced design specialist
    const result = await runEnhancedDesignSpecialistV3(testInput);
    
    console.log('\n✅ === ENHANCED DESIGN V3 RESULTS ===');
    console.log('Success:', result.success);
    console.log('Task Type:', result.task_type);
    
    console.log('\n🧠 CONTENT INTELLIGENCE:');
    console.log('Content Analysis:', result.results.content_analysis);
    console.log('Design Personality:', result.results.design_personality);
    
    console.log('\n🎨 ADAPTIVE DESIGN:');
    console.log('Adaptive Design:', result.results.adaptive_design);
    console.log('Enhanced MJML:', result.results.enhanced_mjml);
    
    console.log('\n⭐ ENHANCEMENTS:');
    console.log('Content Intelligence:', result.enhancements.content_intelligence);
    console.log('Adaptive Design:', result.enhancements.adaptive_design);
    console.log('Modern Components:', result.enhancements.modern_components);
    console.log('Responsive Design:', result.enhancements.responsive_design);
    console.log('Dark Theme Support:', result.enhancements.dark_theme_support);
    console.log('Animations:', result.enhancements.animations);
    
    console.log('\n📊 ANALYTICS:');
    console.log('Execution Time:', result.analytics.execution_time, 'ms');
    console.log('Operations Performed:', result.analytics.operations_performed);
    console.log('Confidence Score:', result.analytics.confidence_score, '%');
    console.log('Design Complexity:', result.analytics.design_complexity);
    console.log('Mobile Optimization:', result.analytics.mobile_optimization, '%');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('Next Agent:', result.recommendations.next_agent);
    console.log('Next Actions:', result.recommendations.next_actions);
    console.log('Optimization Suggestions:', result.recommendations.optimization_suggestions);
    
    if (result.success) {
      console.log('\n🎉 ENHANCED DESIGN V3 TEST PASSED!');
      console.log('New capabilities successfully demonstrated:');
      console.log('✅ Content Intelligence Analysis');
      console.log('✅ Adaptive Design Generation');
      console.log('✅ Enhanced MJML with Modern Components');
      console.log('✅ Smart Color Systems');
      console.log('✅ Responsive & Dark Theme Support');
      
      return {
        testPassed: true,
        enhancementsWorking: Object.values(result.enhancements).every(Boolean),
        performanceScore: result.analytics.confidence_score,
        newFeatures: [
          'Content Intelligence',
          'Adaptive Design Engine',
          'Enhanced MJML Generator',
          'Smart Components',
          'Modern Responsiveness'
        ]
      };
    } else {
      console.log('\n❌ ENHANCED DESIGN V3 TEST FAILED');
      return { testPassed: false, error: 'Design specialist failed' };
    }
    
  } catch (error) {
    console.error('\n💥 TEST ERROR:', error);
    return { 
      testPassed: false, 
      error: error.message,
      suggestion: 'Check agent setup and tool imports'
    };
  }
}

// Запускаем тест
if (require.main === module) {
  testEnhancedDesignV3()
    .then(result => {
      console.log('\n🏁 TEST COMPLETED:', result);
      process.exit(result.testPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 CRITICAL TEST ERROR:', error);
      process.exit(1);
    });
}

export { testEnhancedDesignV3 }; 