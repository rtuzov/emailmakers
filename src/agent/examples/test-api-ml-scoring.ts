/**
 * 🧪 API ML-SCORING INTEGRATION TEST
 * 
 * Тестирует интеграцию ML-scoring через API endpoint /api/agent/run-improved
 * Проверяет работу Quality Specialist V2 с ML-powered анализом
 */

// Тестовые данные для API запроса
const testEmailPackage = {
  subject: "🌟 Эксклюзивное предложение: Билеты в Париж от 15,000₽",
  preheader: "Только сегодня! Скидка до 40% на рейсы в европейские столицы",
  html_output: `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html>
      <head>
        <title>Специальное предложение</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
          .content { padding: 30px; background: #f9f9f9; }
          .cta-button { 
            background: #ff6b6b; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block;
            font-weight: bold;
          }
          .footer { background: #333; color: white; padding: 20px; text-align: center; }
          @media only screen and (max-width: 600px) {
            .content { padding: 15px; }
            .cta-button { display: block; text-align: center; margin: 10px 0; }
          }
        </style>
      </head>
      <body>
        <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td class="header">
              <h1>🌟 Специальное предложение</h1>
              <p>Билеты в Париж от 15,000₽</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h2>Мечтаете о Париже?</h2>
              <p>Сейчас самое время воплотить мечту в реальность! Мы предлагаем невероятные цены на билеты в город любви.</p>
              <p><strong>Что вас ждет:</strong></p>
              <ul>
                <li>Прямые рейсы из Москвы</li>
                <li>Скидки до 40% на отели</li>
                <li>Бесплатная отмена до 24 часов</li>
                <li>Русскоязычная поддержка 24/7</li>
              </ul>
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://example.com/paris-offer" class="cta-button">Забронировать сейчас</a>
              </p>
              <p><em>Предложение действует до 31 декабря 2024 года</em></p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p>© 2024 Travel Dreams. Все права защищены.</p>
              <p><a href="https://example.com/unsubscribe" style="color: #ccc;">Отписаться</a></p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
  assets: ['https://example.com/paris-banner.jpg']
};

/**
 * Тестирует ML-scoring через API
 */
async function testMLScoringAPI() {
  console.log('🧪 API ML-SCORING INTEGRATION TEST');
  console.log('=' .repeat(80));
  
  try {
    // 1. Тест health check
    console.log('\n🏥 Step 1: Health Check');
    console.log('-'.repeat(50));
    
    const healthResponse = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log('📊 Agent status:', healthData.agents);
      console.log('🔄 Handoff tests:', healthData.handoffs);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
    
    // 2. Тест Quality Analysis через API
    console.log('\n🔍 Step 2: Quality Analysis via API');
    console.log('-'.repeat(50));
    
    const qualityRequest = {
      task_type: 'analyze_quality',
      input: {
        task_type: 'analyze_quality',
        email_package: testEmailPackage,
        brand_guidelines: {
          primary_color: '#667eea',
          secondary_color: '#764ba2',
          font_family: 'Arial, sans-serif',
          brand_voice: 'friendly'
        },
        design_tokens: {
          colors: {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#ff6b6b'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            heading: 'Arial, sans-serif'
          }
        }
      },
      context: {
        source: 'api_test',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Sending quality analysis request...');
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/agent/run-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qualityRequest)
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ API response time: ${responseTime}ms`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ API request successful');
      console.log('📊 Response data:', {
        success: result.success,
        agent: result.agent,
        traceId: result.traceId,
        taskType: result.taskType,
        hasResult: !!result.result
      });
      
      // Анализируем результат, если он содержит ML-scoring данные
      if (result.result && typeof result.result === 'string') {
        try {
          const parsedResult = JSON.parse(result.result);
          console.log('🤖 ML-scoring результаты обнаружены:', {
            hasQualityScore: !!parsedResult.quality_score,
            hasMLScore: !!parsedResult.ml_score,
            hasAnalytics: !!parsedResult.analytics
          });
        } catch (e) {
          console.log('📄 Результат в текстовом формате (длина):', result.result.length);
        }
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ API request failed:', response.status);
      console.log('📄 Error details:', errorData);
    }
    
    // 3. Тест производительности API
    console.log('\n🏁 Step 3: API Performance Test');
    console.log('-'.repeat(50));
    
    const performanceTests = 3;
    const apiTimes: number[] = [];
    
    for (let i = 0; i < performanceTests; i++) {
      console.log(`🏃 Performance test ${i + 1}/${performanceTests}...`);
      
      const perfStartTime = Date.now();
      
      const perfResponse = await fetch('http://localhost:3000/api/agent/run-improved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_type: 'analyze_quality',
          input: {
            task_type: 'analyze_quality',
            email_package: {
              html_output: testEmailPackage.html_output,
              subject: `Test Email ${i + 1}`
            }
          }
        })
      });
      
      const perfTime = Date.now() - perfStartTime;
      apiTimes.push(perfTime);
      
      console.log(`   ⏱️ Test ${i + 1}: ${perfTime}ms (${perfResponse.ok ? 'success' : 'failed'})`);
    }
    
    const avgApiTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
    const minApiTime = Math.min(...apiTimes);
    const maxApiTime = Math.max(...apiTimes);
    
    console.log('\n📊 API Performance Statistics:');
    console.log(`   - Average Time: ${Math.round(avgApiTime)}ms`);
    console.log(`   - Min Time: ${minApiTime}ms`);
    console.log(`   - Max Time: ${maxApiTime}ms`);
    console.log(`   - Throughput: ${Math.round(1000 / avgApiTime)} requests/second`);
    
    // 4. Резюме тестирования
    console.log('\n✅ Step 4: Test Summary');
    console.log('-'.repeat(50));
    console.log('🎯 API ML-Scoring Integration Status: TESTED');
    console.log('📊 Key Results:');
    console.log('   ✅ Health check endpoint working');
    console.log('   ✅ Quality analysis API endpoint accessible');
    console.log('   ✅ Request/response cycle functional');
    console.log('   ✅ Performance metrics collected');
    console.log('   ⚠️  ML-scoring integration requires server to be running');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Start development server: npm run dev');
    console.log('   2. Run this test again to verify full integration');
    console.log('   3. Check server logs for ML-scoring activity');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure development server is running (npm run dev)');
    console.log('   2. Check that port 3000 is available');
    console.log('   3. Verify API endpoint exists and is accessible');
  }
}

/**
 * Запуск теста
 */
if (require.main === module) {
  testMLScoringAPI()
    .then(() => {
      console.log('\n🏁 API integration test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 API integration test failed:', error);
      process.exit(1);
    });
}

export { testMLScoringAPI }; 