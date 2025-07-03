/**
 * 📝 SIMPLE API TEST - SAVE OPENAI RESULT
 * 
 * Простейший тест для получения результата от OpenAI API и сохранения в файл
 */

describe('Content Specialist - Save Result', () => {
  it('should save OpenAI result to file', async () => {
    const fs = require('fs');
    const path = require('path');
    
    // Создаем директорию
    const testResultsDir = path.join(__dirname, '../test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    const requestBody = {
      task_type: 'generate_content',
      campaign_brief: {
        topic: 'Горящие предложения на авиабилеты в Сочи',
        campaign_type: 'promotional',
        target_audience: 'семьи с детьми',
        seasonal_context: 'зима',
        brand_context: 'kupibilet'
      },
      content_requirements: {
        content_type: 'complete_campaign',
        tone: 'friendly',
        language: 'ru',
        generate_variants: false
      },
      previous_results: {
        pricing_data: {
          pricing_insights: {
            price_trend: 'increasing',
            urgency_level: 'high'
          },
          marketing_copy: {
            urgency_level: 'high'
          }
        }
      }
    };

    console.log('🚀 Calling Content Specialist API...');
    
    const response = await fetch('http://localhost:3000/api/agent/content-specialist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    // СОХРАНЯЕМ В ФАЙЛ
    const resultFilePath = path.join(testResultsDir, 'content-specialist-openai-result.json');
    fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2), 'utf8');
    
    console.log('✅ OpenAI result saved to:', resultFilePath);
    
    // Создаем handoff файл
    const handoffData = {
      source_agent: 'content_specialist',
      timestamp: new Date().toISOString(),
      success: result.success,
      openai_response: result,
      ready_for_next_agent: result.success && result.recommendations?.next_agent
    };
    
    const handoffFilePath = path.join(testResultsDir, 'content-specialist-handoff.json');
    fs.writeFileSync(handoffFilePath, JSON.stringify(handoffData, null, 2), 'utf8');
    
    console.log('🔗 Handoff data saved to:', handoffFilePath);
    
    // Проверки
    expect(result.success).toBe(true);
    expect(result.task_type).toBe('generate_content');
    
    console.log('📊 Summary:');
    console.log('   Success:', result.success);
    console.log('   Next agent:', result.recommendations?.next_agent);
    console.log('   Execution time:', result.analytics?.execution_time, 'ms');

  }, 60000);
}); 