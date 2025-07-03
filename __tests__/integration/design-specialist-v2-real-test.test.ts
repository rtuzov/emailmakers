/**
 * 🚀 РЕАЛЬНЫЙ ТЕСТ DESIGN SPECIALIST AGENT V2
 * 
 * Демонстрация работы нового агента на реальных данных:
 * - Поиск ассетов
 * - Рендеринг email шаблонов  
 * - Создание файлов
 * - Проверка производительности
 */

import { DesignSpecialistAgentV2, DesignSpecialistInputV2 } from '../../src/agent/specialists/design-specialist-agent-v2';
import * as fs from 'fs';
import * as path from 'path';

describe('🚀 DESIGN SPECIALIST AGENT V2 - REAL PRODUCTION TEST', () => {
  let agent: DesignSpecialistAgentV2;
  const outputDir = path.join(__dirname, '../../test-results');

  beforeAll(() => {
    // Создаем выходную директорию
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  beforeEach(() => {
    agent = new DesignSpecialistAgentV2();
    console.log('\n🎨 Created new DesignSpecialistAgentV2 instance');
  });

  describe('🔍 Asset Search Task', () => {
    it('should find assets and create output file', async () => {
      console.log('🔍 Testing asset search functionality...');
      
      const input: DesignSpecialistInputV2 = {
        task_type: 'find_assets',
        content_package: {
          content: {
            subject: 'Exciting Travel Newsletter',
            preheader: 'Discover amazing destinations this summer!',
            body: 'Join thousands of travelers who trust our recommendations for unforgettable adventures.',
            cta: 'Book Your Trip Now'
          },
          brand_guidelines: {
            colors: {
              primary: '#FF6B35',
              secondary: '#004E89',
              accent: '#FFD23F'
            },
            fonts: {
              primary: 'Montserrat',
              secondary: 'Open Sans'
            }
          }
        },
        figma_project_id: '1750993353363',
        trace_id: 'test-asset-search-001'
      };

      const startTime = Date.now();
      const result = await agent.execute(input);
      const executionTime = Date.now() - startTime;

      console.log(`⏱️ Execution time: ${executionTime}ms`);
      console.log(`📊 Task completed: ${result.task_completed}`);
      console.log(`🎯 Found ${result.selected_assets?.length || 0} assets`);

      // Создаем файл с результатами
      const outputFile = path.join(outputDir, 'design-specialist-v2-asset-search.json');
      const outputData = {
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        input: input,
        result: result,
        performance_metrics: {
          memory_usage: process.memoryUsage(),
          execution_time_ms: executionTime
        }
      };

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Results saved to: ${outputFile}`);

      // Проверки
      expect(result.task_completed).toBe(true);
      expect(result.selected_assets).toBeDefined();
      expect(Array.isArray(result.selected_assets)).toBe(true);
      expect(executionTime).toBeLessThan(30000); // Максимум 30 секунд
      expect(result.trace_id).toBe('test-asset-search-001');
    }, 60000);
  });

  describe('📧 Email Rendering Task', () => {
    it('should render email template and create MJML file', async () => {
      console.log('📧 Testing email rendering functionality...');
      
      const input: DesignSpecialistInputV2 = {
        task_type: 'render_email',
        content_package: {
          content: {
            subject: 'Welcome to Our Newsletter!',
            preheader: 'Get ready for amazing content',
            body: `
              <h1>Welcome aboard!</h1>
              <p>We're excited to have you join our community of newsletter subscribers.</p>
              <p>You'll receive:</p>
              <ul>
                <li>Weekly tips and insights</li>
                <li>Exclusive offers and deals</li>
                <li>Industry news and updates</li>
              </ul>
              <p>Thank you for subscribing!</p>
            `,
            cta: 'Read Our Latest Article'
          },
          brand_guidelines: {
            colors: {
              primary: '#2563EB',
              secondary: '#EF4444',
              accent: '#10B981',
              background: '#F8FAFC',
              text: '#1E293B'
            },
            fonts: {
              primary: 'Inter',
              secondary: 'Roboto'
            }
          }
        },
        figma_project_id: '1750993353363',
        trace_id: 'test-email-render-001'
      };

      const startTime = Date.now();
      const result = await agent.execute(input);
      const executionTime = Date.now() - startTime;

      console.log(`⏱️ Execution time: ${executionTime}ms`);
      console.log(`📊 Task completed: ${result.task_completed}`);
      console.log(`📄 Generated template: ${result.mjml_template ? 'YES' : 'NO'}`);

      // Создаем MJML файл
      if (result.mjml_template) {
        const mjmlFile = path.join(outputDir, 'design-specialist-v2-email-template.mjml');
        fs.writeFileSync(mjmlFile, result.mjml_template);
        console.log(`💾 MJML template saved to: ${mjmlFile}`);
      }

      // Создаем файл с полными результатами
      const outputFile = path.join(outputDir, 'design-specialist-v2-email-render.json');
      const outputData = {
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        input: input,
        result: {
          ...result,
          mjml_template: result.mjml_template ? `${result.mjml_template.length} characters` : null
        },
        performance_metrics: {
          memory_usage: process.memoryUsage(),
          execution_time_ms: executionTime
        }
      };

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Results saved to: ${outputFile}`);

      // Проверки
      expect(result.task_completed).toBe(true);
      expect(result.mjml_template).toBeDefined();
      expect(typeof result.mjml_template).toBe('string');
      expect(result.mjml_template!.length).toBeGreaterThan(100);
      expect(executionTime).toBeLessThan(45000); // Максимум 45 секунд
      expect(result.trace_id).toBe('test-email-render-001');
    }, 90000);
  });

  describe('🎨 Design Optimization Task', () => {
    it('should optimize design and create recommendation file', async () => {
      console.log('🎨 Testing design optimization functionality...');
      
      const input: DesignSpecialistInputV2 = {
        task_type: 'optimize_design',
        content_package: {
          content: {
            subject: 'Product Launch Announcement',
            preheader: 'Introducing our revolutionary new product',
            body: 'After months of development, we are thrilled to announce the launch of our newest innovation.',
            cta: 'Learn More About the Product'
          },
          brand_guidelines: {
            colors: {
              primary: '#8B5CF6',
              secondary: '#06B6D4',
              accent: '#F59E0B'
            },
            fonts: {
              primary: 'Poppins',
              secondary: 'Source Sans Pro'
            }
          }
        },
        figma_project_id: '1750993353363',
        design_requirements: {
          target_audience: 'tech-savvy professionals',
          email_type: 'product_announcement',
          priority_elements: ['headline', 'product_image', 'cta_button']
        },
        trace_id: 'test-design-optimize-001'
      };

      const startTime = Date.now();
      const result = await agent.execute(input);
      const executionTime = Date.now() - startTime;

      console.log(`⏱️ Execution time: ${executionTime}ms`);
      console.log(`📊 Task completed: ${result.task_completed}`);
      console.log(`💡 Recommendations: ${result.optimization_recommendations ? 'YES' : 'NO'}`);

      // Создаем файл с результатами
      const outputFile = path.join(outputDir, 'design-specialist-v2-optimization.json');
      const outputData = {
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        input: input,
        result: result,
        performance_metrics: {
          memory_usage: process.memoryUsage(),
          execution_time_ms: executionTime
        }
      };

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Results saved to: ${outputFile}`);

      // Проверки
      expect(result.task_completed).toBe(true);
      expect(executionTime).toBeLessThan(30000); // Максимум 30 секунд
      expect(result.trace_id).toBe('test-design-optimize-001');
    }, 60000);
  });

  describe('⚡ Performance and Reliability Tests', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      console.log('⚡ Testing concurrent execution performance...');
      
      const concurrentRequests = 3;
      const promises: Promise<any>[] = [];
      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const input: DesignSpecialistInputV2 = {
          task_type: 'find_assets',
          content_package: {
            content: {
              subject: `Test Email ${i + 1}`,
              preheader: `Test preheader ${i + 1}`,
              body: `Test body content for email ${i + 1}`,
              cta: `CTA ${i + 1}`
            },
            brand_guidelines: {
              colors: { primary: '#000000' },
              fonts: { primary: 'Arial' }
            }
          },
          figma_project_id: '1750993353363',
          trace_id: `test-concurrent-${i + 1}`
        };

        const agentInstance = new DesignSpecialistAgentV2();
        promises.push(agentInstance.execute(input));
      }

      const results = await Promise.all(promises);
      const totalExecutionTime = Date.now() - startTime;

      console.log(`⏱️ Total execution time for ${concurrentRequests} requests: ${totalExecutionTime}ms`);
      console.log(`📊 Average time per request: ${Math.round(totalExecutionTime / concurrentRequests)}ms`);

      // Создаем файл с результатами производительности
      const outputFile = path.join(outputDir, 'design-specialist-v2-performance.json');
      const outputData = {
        timestamp: new Date().toISOString(),
        concurrent_requests: concurrentRequests,
        total_execution_time_ms: totalExecutionTime,
        average_time_per_request_ms: Math.round(totalExecutionTime / concurrentRequests),
        results_summary: results.map((result, index) => ({
          request_id: index + 1,
          task_completed: result.task_completed,
          trace_id: result.trace_id
        })),
        performance_metrics: {
          memory_usage: process.memoryUsage(),
          total_execution_time_ms: totalExecutionTime
        }
      };

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`💾 Performance results saved to: ${outputFile}`);

      // Проверки
      results.forEach((result, index) => {
        expect(result.task_completed).toBe(true);
        expect(result.trace_id).toBe(`test-concurrent-${index + 1}`);
      });

      expect(totalExecutionTime).toBeLessThan(60000); // Максимум 60 секунд для всех запросов
    }, 120000);

    it('should handle invalid input gracefully with clear error messages', async () => {
      console.log('🚨 Testing error handling...');
      
      const invalidInput = {
        task_type: 'invalid_task_type',
        content_package: {
          content: {
            subject: '',  // Пустой subject
            // Отсутствуют обязательные поля
          }
        }
      } as any;

      await expect(agent.execute(invalidInput)).rejects.toThrow();
      console.log('✅ Invalid input correctly rejected');
    });
  });

  afterAll(() => {
    console.log('\n📝 All test files saved to:', outputDir);
    console.log('🎉 DesignSpecialistAgentV2 testing completed successfully!');
  });
}); 