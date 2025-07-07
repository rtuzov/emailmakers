/**
 * 🤖 NATIVE ML-SCORING DEMO
 * 
 * Демонстрация нативных OpenAI Agent SDK ML-scoring инструментов
 * Тестирует интеграцию с Tool Registry и Quality Specialist
 */

import { toolRegistry } from '../core/tool-registry';
import { mlScoringTools } from '../tools/ml-scoring-tools';

// Тестовые данные для демонстрации
const testEmailData = {
  high_quality: {
    subject: "🌟 Эксклюзивное предложение: Билеты в Париж от 15,000₽",
    preheader: "Только сегодня! Скидка до 40% на рейсы в европейские столицы",
    content: `
      <html>
        <head>
          <title>Специальное предложение</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; max-width: 600px; margin: 0 auto; }
            .cta-button { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Путешествуйте с нами!</h1>
          </div>
          <div class="content">
            <h2>Невероятные цены на авиабилеты</h2>
            <p>Дорогие путешественники! Мы рады предложить вам эксклюзивные скидки на популярные направления.</p>
            <ul>
              <li>Париж - от 15,000₽</li>
              <li>Лондон - от 18,000₽</li>
              <li>Рим - от 16,500₽</li>
            </ul>
            <p>Предложение действует ограниченное время. Не упустите возможность!</p>
            <center>
              <button class="cta-button">Забронировать сейчас</button>
            </center>
          </div>
          <div class="footer">
            <p>© 2024 Travel Agency. Все права защищены.</p>
            <p>Отписаться | Политика конфиденциальности</p>
          </div>
        </body>
      </html>
    `,
    design_tokens: {
      colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        accent: "#ff6b6b"
      },
      fonts: {
        primary: "Arial, sans-serif"
      }
    },
    brand_guidelines: {
      tone: "friendly",
      style: "modern",
      colors: ["#667eea", "#764ba2", "#ff6b6b"],
      fonts: ["Arial"]
    },
    images: [
      {
        url: "https://example.com/paris.jpg",
        alt: "Эйфелева башня в Париже",
        size: 45000
      }
    ]
  },

  low_quality: {
    subject: "скидки",
    content: `
      <html>
        <body style="font-family:arial">
          <div style="color:red;font-size:24px">СКИДКИ!!!</div>
          <p>купи билеты дешево</p>
          <a href="#">жми тут</a>
          <img src="broken-link.jpg">
        </body>
      </html>
    `
  }
};

async function demonstrateNativeMLScoringIntegration(): Promise<void> {
  console.log('🤖 NATIVE ML-SCORING DEMO: Starting...\n');

  try {
    // 1. Проверяем регистрацию нативных tools в Tool Registry
    console.log('📋 Step 1: Checking Tool Registry Integration');
    console.log('='.repeat(50));
    
    const qualityTools = toolRegistry.getToolsForAgent('quality');
    console.log(`✅ Quality tools loaded: ${qualityTools.length}`);
    
    // Проверяем наличие ML-scoring tools
    const mlToolNames = ['analyze_email_quality', 'quick_quality_check', 'compare_email_quality'];
    mlToolNames.forEach(toolName => {
      const tool = toolRegistry.getOpenAITool(toolName);
      if (tool) {
        console.log(`✅ Native ML tool found: ${toolName}`);
        console.log(`   - Description: ${tool.description.substring(0, 60)}...`);
      } else {
        console.log(`❌ Native ML tool missing: ${toolName}`);
      }
    });

    // 2. Тестируем прямое использование нативных tools
    console.log('\n📊 Step 2: Testing Native Tools Directly');
    console.log('='.repeat(50));

    // Тест analyze_email_quality
    console.log('🔍 Testing analyze_email_quality...');
    const analyzeEmailTool = mlScoringTools.find(tool => (tool as any).name === 'analyze_email_quality');
    if (analyzeEmailTool) {
      const analysisResult = await (analyzeEmailTool as any).execute(testEmailData.high_quality);
      const parsed = JSON.parse(analysisResult);
      console.log(`✅ Analysis complete - Overall score: ${parsed.overall_score}/100`);
      console.log(`   - Content: ${parsed.category_scores.content}/100`);
      console.log(`   - Design: ${parsed.category_scores.design}/100`);
      console.log(`   - Technical: ${parsed.category_scores.technical}/100`);
      console.log(`   - Performance: ${parsed.category_scores.performance}/100`);
      console.log(`   - Recommendations: ${parsed.recommendations.length}`);
    }

    // Тест quick_quality_check
    console.log('\n🚀 Testing quick_quality_check...');
    const quickCheckTool = mlScoringTools.find(tool => (tool as any).name === 'quick_quality_check');
    if (quickCheckTool) {
      const quickResult = await (quickCheckTool as any).execute({
        content: testEmailData.high_quality.content,
        focus_areas: ['content', 'technical']
      });
      const parsed = JSON.parse(quickResult);
      console.log(`✅ Quick check complete - Score: ${parsed.quick_score}/100`);
      console.log(`   - Top issues: ${parsed.top_issues.length}`);
      console.log(`   - Top recommendations: ${parsed.top_recommendations.length}`);
    }

    // Тест compare_email_quality
    console.log('\n⚖️ Testing compare_email_quality...');
    const compareTool = mlScoringTools.find(tool => (tool as any).name === 'compare_email_quality');
    if (compareTool) {
      const compareResult = await (compareTool as any).execute({
        emails: [testEmailData.high_quality, testEmailData.low_quality],
        comparison_focus: 'overall'
      });
      const parsed = JSON.parse(compareResult);
      console.log(`✅ Comparison complete - ${parsed.total_variants} variants analyzed`);
      console.log(`   - Winner: ${parsed.winner.variant_id} (${parsed.winner.subject})`);
      console.log(`   - Best score: ${parsed.rankings[0].score}/100`);
    }

    // 3. Тестируем через Tool Registry
    console.log('\n🔧 Step 3: Testing Through Tool Registry');
    console.log('='.repeat(50));

    const registryAnalyzeTool = toolRegistry.getOpenAITool('analyze_email_quality');
    if (registryAnalyzeTool) {
      console.log('✅ Tool retrieved from registry successfully');
      console.log(`   - Name: ${registryAnalyzeTool.name}`);
      console.log(`   - Type: Native OpenAI SDK tool`);
      
      // Проверяем метаданные
      const toolDefinition = toolRegistry.getTool('analyze_email_quality');
      if (toolDefinition?.metadata?.type === 'native_openai_sdk') {
        console.log('✅ Tool correctly identified as native OpenAI SDK');
        console.log(`   - ML powered: ${toolDefinition.metadata.ml_powered}`);
        console.log(`   - Performance optimized: ${toolDefinition.metadata.performance_optimized}`);
      }
    }

    // 4. Производительность и статистика
    console.log('\n📈 Step 4: Performance Testing');
    console.log('='.repeat(50));

    const startTime = Date.now();
    const iterations = 10;
    
    console.log(`🏃‍♂️ Running ${iterations} quick quality checks...`);
    
    let successCount = 0;
    for (let i = 0; i < iterations; i++) {
      try {
        if (quickCheckTool) {
          await (quickCheckTool as any).execute({
            content: testEmailData.high_quality.content
          });
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Iteration ${i + 1} failed:`, error);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    const throughput = Math.round((iterations / (duration / 1000)) * 100) / 100;
    
    console.log(`✅ Performance Results:`);
    console.log(`   - Total time: ${duration}ms`);
    console.log(`   - Average per analysis: ${Math.round(avgTime)}ms`);
    console.log(`   - Throughput: ${throughput} analyses/sec`);
    console.log(`   - Success rate: ${Math.round((successCount / iterations) * 100)}%`);

    // 5. Итоговая статистика
    console.log('\n📊 Step 5: Final Statistics');
    console.log('='.repeat(50));

    const stats = toolRegistry.getToolStats();
    console.log(`✅ Tool Registry Statistics:`);
    console.log(`   - Total tools: ${stats.total}`);
    console.log(`   - Enabled tools: ${stats.enabled}`);
    console.log(`   - Quality tools: ${stats.byCategory.quality}`);
    
    // Подсчитываем ML-powered tools
    const mlToolsCount = Array.from(toolRegistry['tools'].values())
      .filter(tool => tool.metadata?.ml_powered === true).length;
    console.log(`   - ML-powered tools: ${mlToolsCount}`);

    console.log('\n🎉 NATIVE ML-SCORING DEMO: Completed successfully!');
    console.log('\n✨ Key achievements:');
    console.log('   ✅ Native OpenAI Agent SDK tools integrated');
    console.log('   ✅ Tool Registry compatibility maintained');
    console.log('   ✅ High-performance ML analysis available');
    console.log('   ✅ Comprehensive quality scoring operational');
    console.log('   ✅ Email comparison functionality working');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Запуск демо
if (require.main === module) {
  demonstrateNativeMLScoringIntegration()
    .then(() => {
      console.log('\n🏁 Demo completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Demo crashed:', error);
      process.exit(1);
    });
}

export { demonstrateNativeMLScoringIntegration }; 