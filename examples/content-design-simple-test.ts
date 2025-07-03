/**
 * 🧪 SIMPLIFIED INTEGRATION TEST: ContentSpecialistAgent + DesignSpecialistAgentV2
 * 
 * Упрощенный тест без seasonal theme для демонстрации базового workflow:
 * 1. ContentSpecialistAgent генерирует контент
 * 2. DesignSpecialistAgentV2 рендерит простой email
 * 
 * Тема: "путешествие в Париж в сентябре"
 */

import { ContentSpecialistAgent, ContentSpecialistInput, ContentSpecialistOutput } from '../src/agent/specialists/content-specialist-agent';
import { DesignSpecialistAgentV2, DesignSpecialistInputV2, DesignSpecialistOutputV2 } from '../src/agent/specialists/design-specialist-agent-v2';
import * as fs from 'fs';
import * as path from 'path';

// Утилиты для вывода логов
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message: string, color: string = 'white') {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`);
}

function logStep(step: number, description: string, color: string = 'yellow') {
  log(`📋 STEP ${step}: ${description}`, color);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan');
}

function saveResult(filename: string, data: any) {
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filePath = path.join(resultsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  logInfo(`Results saved to: ${filePath}`);
}

async function runSimpleIntegrationTest() {
  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('🧪 SIMPLE CONTENT-DESIGN INTEGRATION TEST', 'cyan');
    log('='.repeat(60), 'cyan');

    // =============================================
    // STEP 1: Инициализация агентов
    // =============================================
    logStep(1, 'Initializing agents', 'magenta');

    const contentAgent = new ContentSpecialistAgent();
    const designAgent = new DesignSpecialistAgentV2();

    logSuccess('Both agents initialized successfully');

    // =============================================
    // STEP 2: Подготовка входных данных для ContentSpecialist
    // =============================================
    logStep(2, 'Preparing content generation input', 'magenta');

    const contentInput: ContentSpecialistInput = {
      task_type: 'generate_content',
      campaign_brief: {
        topic: 'путешествие в Париж в сентябре',
        campaign_type: 'seasonal',
        target_audience: 'путешественники, семьи',
        brand_voice: 'дружелюбный, вдохновляющий'
      },
      content_requirements: {
        content_type: 'complete_campaign',
        tone: 'friendly',
        language: 'ru',
        generate_variants: false
      },
      context_requirements: {
        include_seasonal: true,
        include_cultural: true,
        include_travel: true
      },
      pricing_requirements: {
        origin: 'MOW',
        destination: 'PAR',
        analysis_depth: 'advanced'
      }
    };

    logInfo('Content input prepared');

    // =============================================
    // STEP 3: Выполнение генерации контента
    // =============================================
    logStep(3, 'Executing content generation', 'magenta');

    log('⏳ Running ContentSpecialistAgent...', 'yellow');
    const contentStartTime = Date.now();
    const contentResult: ContentSpecialistOutput = await contentAgent.executeTask(contentInput);
    const contentExecutionTime = Date.now() - contentStartTime;

    if (contentResult.success) {
      logSuccess(`Content generation completed in ${contentExecutionTime}ms`);
      
      logInfo('Content generation results:');
      log(`- Task Type: ${contentResult.task_type}`, 'dim');
      log(`- Success: ${contentResult.success}`, 'dim');
      log(`- Execution Time: ${contentExecutionTime}ms`, 'dim');
      log(`- Operations Performed: ${contentResult.analytics?.operations_performed}`, 'dim');
      log(`- Confidence Score: ${contentResult.analytics?.confidence_score}%`, 'dim');

      if (contentResult.results?.content_data?.content) {
        const content = contentResult.results.content_data.content;
        log('\n📝 Generated content:', 'cyan');
        log(`Subject: ${content.subject}`, 'dim');
        log(`Preheader: ${content.preheader}`, 'dim');
        log(`CTA: ${content.cta}`, 'dim');
        log(`Body length: ${content.body?.length || 0} characters`, 'dim');
      }
      
      saveResult('simple-content-result.json', contentResult);
      
    } else {
      logError(`Content generation failed: ${contentResult.error}`);
      return;
    }

    // =============================================
    // STEP 4: Простой рендеринг email (без seasonal theme)
    // =============================================
    logStep(4, 'Simple email rendering', 'magenta');

    const handoffData = contentResult.recommendations?.handoff_data;
    
    if (!handoffData) {
      logError('No handoff data found from ContentSpecialist');
      return;
    }

    const designInput: DesignSpecialistInputV2 = {
      task_type: 'render_email',
      content_package: handoffData,
      rendering_requirements: {
        template_type: 'promotional',
        email_client_optimization: 'universal',
        responsive_design: true,
        seasonal_theme: false, // Отключаем seasonal theme для простоты
        include_dark_mode: false
      },
      asset_requirements: {
        tags: ['travel', 'paris', 'vacation', 'airplane', 'happy'],
        emotional_tone: 'positive',
        campaign_type: 'promotional',
        target_count: 3,
        preferred_emotion: 'happy',
        image_requirements: {
          total_images_needed: 2,
          figma_images_count: 2,
          internet_images_count: 0,
          require_logo: false,
          image_categories: ['illustration', 'icon']
        }
      }
    };

    logInfo('Design input prepared (without seasonal theme)');

    const designStartTime = Date.now();
    log('⏳ Running DesignSpecialistAgentV2 for simple rendering...', 'yellow');
    
    const designResult: DesignSpecialistOutputV2 = await designAgent.executeTask(designInput);
    const designExecutionTime = Date.now() - designStartTime;

    if (designResult.success) {
      logSuccess(`Email rendering completed in ${designExecutionTime}ms`);
      
      logInfo('Email rendering results:');
      log(`- Task Type: ${designResult.task_type}`, 'dim');
      log(`- Success: ${designResult.success}`, 'dim');
      log(`- Execution Time: ${designResult.analytics?.execution_time_ms}ms`, 'dim');
      log(`- Operations Performed: ${designResult.analytics?.operations_performed}`, 'dim');
      log(`- Confidence Score: ${designResult.analytics?.confidence_score}%`, 'dim');
      
      if (designResult.results?.rendering) {
        const rendering = designResult.results.rendering;
        log('\n🎨 Rendering results:', 'cyan');
        log(`- Template Type: ${rendering.metadata?.template_type}`, 'dim');
        log(`- File Size: ${rendering.metadata?.file_size_bytes} bytes`, 'dim');
        log(`- Total Size: ${rendering.performance_metrics?.total_size_kb}KB`, 'dim');
        log(`- Images Count: ${rendering.performance_metrics?.images_count}`, 'dim');
        log(`- Load Time: ${rendering.performance_metrics?.estimated_load_time_ms}ms`, 'dim');
        
        if (rendering.html_content) {
          log(`- HTML Content Length: ${rendering.html_content.length} characters`, 'dim');
        }
        
        if (rendering.mjml_source) {
          log(`- MJML Source Length: ${rendering.mjml_source.length} characters`, 'dim');
        }
      }
      
      saveResult('simple-design-result.json', designResult);
      
      // Сохранение HTML и MJML если есть
      if (designResult.results?.rendering?.html_content) {
        const htmlPath = path.join(__dirname, '..', 'test-results', 'simple-email.html');
        fs.writeFileSync(htmlPath, designResult.results.rendering.html_content, 'utf8');
        logInfo(`HTML email saved to: ${htmlPath}`);
      }
      
      if (designResult.results?.rendering?.mjml_source) {
        const mjmlPath = path.join(__dirname, '..', 'test-results', 'simple-email.mjml');
        fs.writeFileSync(mjmlPath, designResult.results.rendering.mjml_source, 'utf8');
        logInfo(`MJML source saved to: ${mjmlPath}`);
      }
      
    } else {
      logError(`Email rendering failed: ${designResult.error}`);
      return;
    }

    // =============================================
    // STEP 5: Финальный анализ
    // =============================================
    logStep(5, 'Final analysis', 'magenta');

    const totalExecutionTime = contentExecutionTime + designExecutionTime;
    
    logInfo('Simple integration test summary:');
    log(`✅ Total execution time: ${totalExecutionTime}ms`, 'green');
    log(`🎯 Content generation: ${contentExecutionTime}ms`, 'dim');
    log(`🎨 Email rendering: ${designExecutionTime}ms`, 'dim');
    log(`📊 Content confidence: ${contentResult.analytics?.confidence_score || 0}%`, 'dim');
    log(`📊 Design confidence: ${designResult.analytics?.confidence_score || 0}%`, 'dim');

    // Создание простого отчета
    const simpleReport = {
      test_summary: {
        topic: 'путешествие в Париж в сентябре',
        total_execution_time_ms: totalExecutionTime,
        success: true,
        agents_tested: ['ContentSpecialistAgent', 'DesignSpecialistAgentV2'],
        workflow_type: 'simple_rendering'
      },
      content_phase: {
        execution_time_ms: contentExecutionTime,
        success: contentResult.success,
        confidence_score: contentResult.analytics?.confidence_score,
        operations_performed: contentResult.analytics?.operations_performed,
        generated_content: {
          subject: contentResult.results?.content_data?.content?.subject,
          preheader: contentResult.results?.content_data?.content?.preheader,
          cta: contentResult.results?.content_data?.content?.cta,
          body_length: contentResult.results?.content_data?.content?.body?.length || 0
        }
      },
      design_phase: {
        execution_time_ms: designExecutionTime,
        success: designResult.success,
        confidence_score: designResult.analytics?.confidence_score,
        operations_performed: designResult.analytics?.operations_performed,
        cache_hit_rate: designResult.analytics?.cache_hit_rate,
        rendering_metrics: designResult.results?.rendering?.performance_metrics
      },
      deliverables: {
        html_generated: !!designResult.results?.rendering?.html_content,
        mjml_generated: !!designResult.results?.rendering?.mjml_source,
        handoff_data_valid: !!contentResult.recommendations?.handoff_data,
        total_workflow_success: contentResult.success && designResult.success
      }
    };

    saveResult('simple-integration-report.json', simpleReport);
    
    logSuccess('Simple integration test completed successfully!');
    logInfo('✨ Both agents working together perfectly!');
    logInfo('Check test-results/ directory for detailed outputs');
    
  } catch (error) {
    logError(`Simple integration test failed: ${(error as Error).message}`);
    console.error('Full error details:', error);
    
    saveResult('simple-integration-error.json', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });
  }
}

// Запуск простого теста
runSimpleIntegrationTest().catch(console.error);

export { runSimpleIntegrationTest }; 