/**
 * 📝 CONTENT SPECIALIST AGENT REAL TESTS
 * 
 * Реальное тестирование ContentSpecialistAgent с OpenAI API
 * БЕЗ МОКОВ - проверяем настоящие ответы нейросети
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentSpecialistAgent } from '../../src/agent/specialists/content-specialist-agent';

describe('ContentSpecialistAgent REAL OpenAI Tests', () => {
  let agent: ContentSpecialistAgent;
  const testResultsDir = path.join(__dirname, '../test-results');

  beforeAll(async () => {
    // Создаем директорию для результатов тестов
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for real tests');
    }

    console.log('🔑 OpenAI API Key found, proceeding with real tests...');
  });

  beforeEach(() => {
    agent = new ContentSpecialistAgent();
    console.log('🚀 New ContentSpecialistAgent instance created');
  });

  afterEach(async () => {
    if (agent) {
      await agent.shutdown();
      console.log('🔄 ContentSpecialistAgent shutdown completed');
    }
  });

  describe('Real Content Generation with OpenAI', () => {
    it('should generate real email content using OpenAI API', async () => {
      const input = {
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

      console.log('🚀 Starting REAL Content Specialist test with OpenAI...');
      console.log('📋 Input:', JSON.stringify(input, null, 2));
      console.log('⏱️  Test timeout: 60 seconds');

      const startTime = Date.now();
      
      try {
        const result = await agent.executeTask(input as any);
        const executionTime = Date.now() - startTime;

        console.log(`✅ Content Specialist completed in ${executionTime}ms`);
        console.log('📊 Result structure:', Object.keys(result));

        // Сохраняем РЕАЛЬНЫЙ результат для передачи в Design Specialist
        const resultFilePath = path.join(testResultsDir, 'content-specialist-real-result.json');
        fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2));

        console.log('💾 Real result saved to:', resultFilePath);

        // Основные проверки структуры
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.task_type).toBe('generate_content');
        expect(result.results).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(result.analytics).toBeDefined();

        // Проверяем что есть данные для следующего агента
        expect(result.recommendations.next_agent).toBe('design_specialist');
        expect(result.recommendations.handoff_data).toBeDefined();

        const handoffData = result.recommendations.handoff_data;
        expect(handoffData.content_package).toBeDefined();
        expect(handoffData.content_package.content).toBeDefined();

        // Проверяем реальный контент от OpenAI
        const content = handoffData.content_package.content;
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

        console.log('📝 REAL Generated Content from OpenAI:');
        console.log('   Subject:', content.subject);
        console.log('   Preheader:', content.preheader);
        console.log('   Body (first 150 chars):', content.body.substring(0, 150) + '...');
        console.log('   CTA:', content.cta);
        console.log('   Language:', content.language);
        console.log('   Tone:', content.tone);

        // Проверяем дополнительные поля handoff_data
        expect(handoffData.design_requirements).toBeDefined();
        expect(handoffData.brand_guidelines).toBeDefined();
        expect(handoffData.content_metadata).toBeDefined();

        // Проверяем аналитику
        expect(result.analytics.execution_time).toBeGreaterThan(0);
        expect(result.analytics.confidence_score).toBeGreaterThan(0);
        expect(result.analytics.confidence_score).toBeLessThanOrEqual(100);

        console.log('📈 Analytics from real execution:');
        console.log('   Execution Time:', result.analytics.execution_time, 'ms');
        console.log('   Confidence Score:', result.analytics.confidence_score, '%');
        console.log('   Operations Performed:', result.analytics.operations_performed);
        console.log('   Agent Efficiency:', result.analytics.agent_efficiency, '%');

        // Проверяем что контент на русском языке
        expect(content.subject).toMatch(/[а-яё]/i);
        expect(content.body).toMatch(/[а-яё]/i);

        // Проверяем что контент связан с темой
        const topicKeywords = ['сочи', 'авиабилет', 'билет', 'путешеств', 'отдых'];
        const fullText = (content.subject + ' ' + content.body + ' ' + content.preheader).toLowerCase();
        const hasTopicKeywords = topicKeywords.some(keyword => fullText.includes(keyword));
        expect(hasTopicKeywords).toBe(true);

        console.log('✅ All real content validation passed!');
        console.log('🔄 Ready for handoff to Design Specialist Agent');

      } catch (error) {
        console.error('❌ Real test failed:', error);
        
        // Логируем детали ошибки для диагностики
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        
        throw error;
      }

    }, 60000); // 60 секунд таймаут для реального API вызова
  });

  describe('Agent Capabilities', () => {
    it('should return correct capabilities information', () => {
      const capabilities = agent.getCapabilities();
      
      expect(capabilities.agent_id).toContain('content-specialist');
      expect(capabilities.specialization).toBe('Content Intelligence & Campaign Context');
      expect(capabilities.tools).toContain('context_provider');
      expect(capabilities.tools).toContain('pricing_intelligence');
      expect(capabilities.handoff_support).toBe(true);
      expect(capabilities.next_agents).toContain('design_specialist');

      console.log('📋 Agent Capabilities:', capabilities);
    });
  });

  describe('Performance Metrics', () => {
    it('should track and return performance metrics', () => {
      const metrics = agent.getPerformanceMetrics();
      
      expect(metrics.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
      expect(metrics.totalExecutions).toBeGreaterThanOrEqual(0);
      expect(metrics.toolUsageStats).toBeDefined();

      console.log('📊 Performance Metrics:', metrics);
    });
  });
});

/**
 * 📋 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ ОТ РЕАЛЬНОГО OPENAI API
 * 
 * Результат должен содержать реальные данные от OpenAI:
 * - subject: реальная тема письма от нейросети
 * - preheader: реальный превью текст от нейросети  
 * - body: реальный основной текст от нейросети
 * - cta: реальный призыв к действию от нейросети
 * - аналитика выполнения с реальными метриками
 * - handoff_data для передачи в Design Specialist
 */

/**
 * 📝 SIMPLE CONTENT SPECIALIST TEST - SAVE OPENAI RESULT TO FILE
 * 
 * Простой тест для получения и сохранения реального результата от OpenAI
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import * as path from 'path';

describe('Content Specialist - Save OpenAI Result', () => {
  const testResultsDir = path.join(__dirname, '../test-results');
  const baseUrl = 'http://localhost:3000';

  beforeAll(() => {
    // Создаем директорию для результатов
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
  });

  it('should get real OpenAI result and save to file', async () => {
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

    console.log('🚀 Making real API call to Content Specialist...');
    
    const response = await fetch(`${baseUrl}/api/agent/content-specialist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    // СОХРАНЯЕМ РЕЗУЛЬТАТ В ФАЙЛ
    const resultFilePath = path.join(testResultsDir, 'content-specialist-openai-result.json');
    
    console.log('💾 Saving OpenAI result to:', resultFilePath);
    
    writeFileSync(resultFilePath, JSON.stringify(result, null, 2), 'utf8');
    
    console.log('✅ File saved successfully!');
    console.log('📁 File location:', resultFilePath);
    
    // Также создаем упрощенный файл для следующего агента
    const handoffData = {
      source_agent: 'content_specialist',
      timestamp: new Date().toISOString(),
      success: result.success,
      openai_response: result,
      ready_for_next_agent: result.success && result.recommendations?.next_agent
    };
    
    const handoffFilePath = path.join(testResultsDir, 'content-specialist-handoff.json');
    writeFileSync(handoffFilePath, JSON.stringify(handoffData, null, 2), 'utf8');
    
    console.log('🔗 Handoff file saved:', handoffFilePath);
    
    // Основные проверки
    expect(result.success).toBe(true);
    expect(result.task_type).toBe('generate_content');
    expect(result.recommendations?.next_agent).toBe('design_specialist');
    
    console.log('📊 Result summary:');
    console.log('   - Success:', result.success);
    console.log('   - Next agent:', result.recommendations?.next_agent);
    console.log('   - Execution time:', result.analytics?.execution_time, 'ms');
    console.log('   - Confidence score:', result.analytics?.confidence_score, '%');

  }, 60000); // 60 секунд таймаут
});

/**
 * 📋 РЕЗУЛЬТАТ СОХРАНЕН В ФАЙЛАХ:
 * 
 * 1. content-specialist-openai-result.json - полный ответ от OpenAI
 * 2. content-specialist-handoff.json - данные для передачи следующему агенту
 * 
 * Эти файлы можно использовать для тестирования следующих агентов в цепочке.
 */ 