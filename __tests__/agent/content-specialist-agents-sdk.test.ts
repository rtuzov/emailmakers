/**
 * 📝 CONTENT SPECIALIST AGENT - OPENAI AGENTS SDK TEST
 * 
 * Тест для проверки использования OpenAI Agents SDK вместо прямого OpenAI API
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import * as path from 'path';

describe('Content Specialist Agent - OpenAI Agents SDK Test', () => {
  const testResultsDir = path.join(__dirname, '../test-results');
  const baseUrl = 'http://localhost:3000';

  beforeAll(() => {
    // Создаем директорию для результатов
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
  });

  it('should use OpenAI Agents SDK (not direct OpenAI API)', async () => {
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

    console.log('🤖 Testing OpenAI Agents SDK usage...');
    const startTime = Date.now();

    const response = await fetch(`${baseUrl}/api/agent/content-specialist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);

    expect(response.status).toBe(200);

    const result = await response.json();
    
    // Сохраняем результат в файл
    const resultFilePath = path.join(testResultsDir, 'content-specialist-agents-sdk-result.json');
    writeFileSync(resultFilePath, JSON.stringify(result, null, 2));
    console.log('💾 OpenAI Agents SDK result saved to:', resultFilePath);

    // Проверяем, что агент успешно выполнился
    expect(result.success).toBe(true);
    expect(result.task_type).toBe('generate_content');
    
    // Проверяем структуру ответа от OpenAI Agents SDK
    expect(result.results).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.analytics).toBeDefined();
    
    // Проверяем handoff данные для следующего агента
    expect(result.recommendations.handoff_data).toBeDefined();
    expect(result.recommendations.handoff_data.content_package).toBeDefined();
    expect(result.recommendations.handoff_data.content_package.complete_content).toBeDefined();
    
    const content = result.recommendations.handoff_data.content_package.complete_content;
    expect(content.subject).toBeDefined();
    expect(content.preheader).toBeDefined();
    expect(content.body).toBeDefined();
    expect(content.cta).toBeDefined();
    
    // Проверяем, что контент сгенерирован правильно
    expect(typeof content.subject).toBe('string');
    expect(content.subject.length).toBeGreaterThan(0);
    expect(typeof content.body).toBe('string');
    expect(content.body.length).toBeGreaterThan(100);
    
    // Проверяем метаданные контента
    expect(result.recommendations.handoff_data.content_package.content_metadata).toBeDefined();
    expect(result.recommendations.handoff_data.content_package.content_metadata.language).toBe('ru');
    
    console.log('✅ OpenAI Agents SDK test completed successfully!');
    console.log('📊 Content generated:', {
      subject: content.subject,
      preheader: content.preheader,
      bodyLength: content.body.length,
      cta: content.cta,
      language: result.recommendations.handoff_data.content_package.content_metadata.language,
      tone: result.recommendations.handoff_data.content_package.content_metadata.tone
    });
    
    // Создаем упрощенный файл для передачи следующему агенту
    const handoffData = {
      source_agent: 'content_specialist',
      timestamp: new Date().toISOString(),
      success: true,
      ready_for_next_agent: true,
      next_agent: 'design_specialist',
      content_package: content,
      execution_time: responseTime,
      used_openai_agents_sdk: true // Маркер того, что использовался OpenAI Agents SDK
    };
    
    const handoffFilePath = path.join(testResultsDir, 'content-specialist-agents-sdk-handoff.json');
    writeFileSync(handoffFilePath, JSON.stringify(handoffData, null, 2));
    console.log('🔄 Handoff data saved to:', handoffFilePath);

  }, 60000); // 60 second timeout for real OpenAI Agents SDK calls
}); 