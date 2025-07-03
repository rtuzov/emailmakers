/**
 * 📝 CONTENT SPECIALIST AGENT API TESTS
 * 
 * Тестирование ContentSpecialistAgent через API endpoint
 * БЕЗ ПРЯМОГО ИМПОРТА МОДУЛЕЙ - используем HTTP запросы
 */

import { promises as fs } from 'fs';
import { statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';

describe('ContentSpecialistAgent API Tests', () => {
  const testResultsDir = path.join(__dirname, '../test-results');
  const baseUrl = 'http://localhost:3000';

  beforeAll(async () => {
    // Создаем директорию для результатов тестов
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for real tests');
    }

    console.log('🔑 OpenAI API Key found, proceeding with API tests...');
  });

  describe('Real Content Generation via API', () => {
    it('should generate real email content through API endpoint', async () => {
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

      console.log('🚀 Starting REAL Content Specialist API test...');
      console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('⏱️  Test timeout: 60 seconds');

      const startTime = Date.now();
      
      try {
        // Делаем реальный HTTP запрос к API
        const response = await fetch(`${baseUrl}/api/agent/content-specialist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const executionTime = Date.now() - startTime;

        console.log(`✅ API response received in ${executionTime}ms`);
        console.log('📊 Response status:', response.status);

        // Проверяем статус ответа
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);

        const result = await response.json();

        console.log('📊 Result structure:', Object.keys(result));

        // ВСЕГДА сохраняем РЕАЛЬНЫЙ результат для передачи в Design Specialist
        const resultFilePath = path.join(testResultsDir, 'content-specialist-openai-result.json');
        writeFileSync(resultFilePath, JSON.stringify(result, null, 2));

        console.log('💾 Real OpenAI result saved to:', resultFilePath);
        
        // Проверяем размер файла
        try {
          const fileStats = statSync(resultFilePath);
          console.log('📄 File size:', fileStats.size, 'bytes');
        } catch (err) {
          console.log('📄 File created successfully (size check skipped)');
        }

        // Основные проверки структуры
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.task_type).toBe('generate_content');
        expect(result.results).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(result.analytics).toBeDefined();

        // Проверяем что есть данные для следующего агента
        expect(result.recommendations.next_agent).toBe('design_specialist');
        
        // Логируем структуру для диагностики
        console.log('🔍 Detailed result structure:');
        console.log('   - success:', result.success);
        console.log('   - task_type:', result.task_type);
        console.log('   - results keys:', Object.keys(result.results || {}));
        console.log('   - recommendations keys:', Object.keys(result.recommendations || {}));
        console.log('   - analytics keys:', Object.keys(result.analytics || {}));
        
        if (result.recommendations.handoff_data) {
          console.log('   - handoff_data keys:', Object.keys(result.recommendations.handoff_data));
          
          if (result.recommendations.handoff_data.content_package) {
            console.log('   - content_package keys:', Object.keys(result.recommendations.handoff_data.content_package));
            
            if (result.recommendations.handoff_data.content_package.content) {
              const content = result.recommendations.handoff_data.content_package.content;
              
              console.log('📝 REAL Generated Content from OpenAI API:');
              console.log('   Subject:', content.subject);
              console.log('   Preheader:', content.preheader);
              console.log('   Body (first 150 chars):', content.body?.substring(0, 150) + '...');
              console.log('   CTA:', content.cta);
              console.log('   Language:', content.language);
              console.log('   Tone:', content.tone);

              // Проверяем реальный контент от OpenAI
              expect(content.subject).toBeDefined();
              expect(content.subject).not.toBe('');
              expect(typeof content.subject).toBe('string');
              expect(content.subject.length).toBeGreaterThan(5);

              expect(content.preheader).toBeDefined();
              expect(content.preheader).not.toBe('');
              expect(typeof content.preheader).toBe('string');
              expect(content.preheader.length).toBeGreaterThan(10);

              expect(content.body).toBeDefined();
              expect(content.body).not.toBe('');
              expect(typeof content.body).toBe('string');
              expect(content.body.length).toBeGreaterThan(20);

              expect(content.cta).toBeDefined();
              expect(content.cta).not.toBe('');
              expect(typeof content.cta).toBe('string');
              expect(content.cta.length).toBeGreaterThan(3);

              expect(content.language).toBe('ru');
              expect(content.tone).toBe('friendly');

              // Проверяем что контент на русском языке
              expect(content.subject).toMatch(/[а-яё]/i);
              expect(content.body).toMatch(/[а-яё]/i);

              // Проверяем что контент связан с темой
              const topicKeywords = ['сочи', 'авиабилет', 'билет', 'путешеств', 'отдых'];
              const fullText = (content.subject + ' ' + content.body + ' ' + content.preheader).toLowerCase();
              const hasTopicKeywords = topicKeywords.some(keyword => fullText.includes(keyword));
              expect(hasTopicKeywords).toBe(true);
            } else {
              console.log('⚠️  content_package.content is missing');
            }
          } else {
            console.log('⚠️  content_package is missing');
          }
        } else {
          console.log('⚠️  handoff_data is missing');
        }

        // Проверяем аналитику
        if (result.analytics) {
          expect(result.analytics.execution_time).toBeGreaterThan(0);
          expect(result.analytics.confidence_score).toBeGreaterThan(0);
          expect(result.analytics.confidence_score).toBeLessThanOrEqual(100);

          console.log('📈 Analytics from real API execution:');
          console.log('   Execution Time:', result.analytics.execution_time, 'ms');
          console.log('   Confidence Score:', result.analytics.confidence_score, '%');
          console.log('   Operations Performed:', result.analytics.operations_performed);
          console.log('   Agent Efficiency:', result.analytics.agent_efficiency, '%');
        }

        // Создаем также упрощенный файл для передачи в следующий агент
        const handoffFilePath = path.join(testResultsDir, 'content-specialist-handoff.json');
        const handoffData = {
          source_agent: 'content_specialist',
          timestamp: new Date().toISOString(),
          execution_time_ms: executionTime,
          openai_response: result,
          ready_for_design_agent: !!(result.recommendations?.handoff_data?.content_package?.content),
          content_summary: result.recommendations?.handoff_data?.content_package?.content ? {
            has_subject: !!result.recommendations.handoff_data.content_package.content.subject,
            has_body: !!result.recommendations.handoff_data.content_package.content.body,
            has_cta: !!result.recommendations.handoff_data.content_package.content.cta,
            language: result.recommendations.handoff_data.content_package.content.language,
            tone: result.recommendations.handoff_data.content_package.content.tone
          } : null
        };
        
        writeFileSync(handoffFilePath, JSON.stringify(handoffData, null, 2));
        console.log('🔗 Handoff data saved to:', handoffFilePath);

        console.log('✅ Content Specialist test completed!');
        console.log('🔄 Files ready for next agent:');
        console.log('   1. Full result:', resultFilePath);
        console.log('   2. Handoff data:', handoffFilePath);

      } catch (error) {
        console.error('❌ Real API test failed:', error);
        
        // Логируем детали ошибки для диагностики
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        
        // Сохраняем информацию об ошибке в файл
        const errorFilePath = path.join(testResultsDir, 'content-specialist-error.json');
        writeFileSync(errorFilePath, JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          test_type: 'content_specialist_api'
        }, null, 2));
        
        throw error;
      }

    }, 60000); // 60 секунд таймаут для реального API вызова
  });

  describe('Server Health Check', () => {
    it('should verify server is running', async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        expect(response.ok).toBe(true);
        
        const health = await response.json();
        console.log('🏥 Server health status:', health.status);
        
      } catch (error) {
        console.error('❌ Server is not running. Please start the server first:', error);
        throw new Error('Server is not running on port 3000. Please run: npm run dev');
      }
    });
  });

  describe('Environment Check', () => {
    it('should verify OpenAI API key is configured', async () => {
      try {
        const response = await fetch(`${baseUrl}/api/agent/env-check`);
        expect(response.ok).toBe(true);
        
        const envCheck = await response.json();
        console.log('🔧 Environment check summary:');
        console.log('   - Total services:', envCheck.summary?.total_services);
        console.log('   - Ready services:', envCheck.summary?.ready_services);
        console.log('   - Critical ready:', envCheck.summary?.critical_ready);
        
        expect(envCheck.summary?.critical_ready).toBe(true);
        
      } catch (error) {
        console.error('❌ Environment check failed:', error);
        throw error;
      }
    });
  });
});

/**
 * 📋 ФАЙЛЫ РЕЗУЛЬТАТОВ ДЛЯ СЛЕДУЮЩИХ АГЕНТОВ
 * 
 * После выполнения теста создаются файлы:
 * 
 * 1. content-specialist-openai-result.json
 *    - Полный ответ от OpenAI API
 *    - Используется для анализа и отладки
 * 
 * 2. content-specialist-handoff.json  
 *    - Структурированные данные для передачи в Design Specialist
 *    - Содержит метаданные и флаги готовности
 * 
 * 3. content-specialist-error.json (если ошибка)
 *    - Информация об ошибках для диагностики
 */ 