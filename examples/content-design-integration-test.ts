/**
 * 🧪 INTEGRATION TEST: ContentSpecialistAgent + DesignSpecialistAgentV2
 * 
 * Тестирует полный workflow создания email:
 * 1. ContentSpecialistAgent генерирует контент
 * 2. DesignSpecialistAgentV2 создает email template
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
  console.log(`${(colors as any)[color]}${message}${colors.reset}`);
}

function logSection(title: string, color: string = 'cyan') {
  console.log(`\n${(colors as any)[color]}${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

function logStep(step: number, description: string, color: string = 'yellow') {
  console.log(`${(colors as any)[color]}📋 STEP ${step}: ${description}${colors.reset}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

// Сохранение результата в файл
function saveResult(filename: string, data: any) {
  const outputDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  logInfo(`Results saved to: ${filePath}`);
}

async function runIntegrationTest() {
  logSection('CONTENT-DESIGN INTEGRATION TEST', 'bright');
  
  try {
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
        origin: 'MOW', // Москва
        destination: 'PAR', // Париж
        analysis_depth: 'advanced'
      }
    };
    
    logInfo('Content input prepared:');
    log(JSON.stringify(contentInput, null, 2), 'dim');
    
    // =============================================
    // STEP 3: Выполнение генерации контента
    // =============================================
    logStep(3, 'Executing content generation', 'magenta');
    
    const contentStartTime = Date.now();
    log('⏳ Running ContentSpecialistAgent...', 'yellow');
    
    const contentResult: ContentSpecialistOutput = await contentAgent.executeTask(contentInput);
    
    const contentExecutionTime = Date.now() - contentStartTime;
    
    if (contentResult.success) {
      logSuccess(`Content generation completed in ${contentExecutionTime}ms`);
      
      // Детальный анализ результата
      logInfo('Content generation results:');
      log(`- Task Type: ${contentResult.task_type}`, 'dim');
      log(`- Success: ${contentResult.success}`, 'dim');
      log(`- Execution Time: ${contentResult.analytics?.execution_time}ms`, 'dim');
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
      
      if (contentResult.recommendations?.handoff_data) {
        logInfo('Handoff data prepared for DesignSpecialist');
      }
      
      // Сохранение результата контента
      saveResult('content-specialist-result.json', contentResult);
      
    } else {
      logError(`Content generation failed: ${contentResult.error}`);
      return;
    }
    
    // =============================================
    // STEP 4: Поиск ассетов для дизайна
    // =============================================
    logStep(4, 'Searching for design assets', 'magenta');
    
    // Извлекаем handoff_data из результата ContentSpecialist
    const handoffData = contentResult.recommendations?.handoff_data;
    
    if (!handoffData) {
      logError('No handoff data found from ContentSpecialist');
      return;
    }
    
    const assetSearchInput: DesignSpecialistInputV2 = {
      task_type: 'find_assets',
      asset_requirements: {
        tags: ['travel', 'paris', 'autumn', 'france'],
        emotional_tone: 'positive',
        campaign_type: 'seasonal',
        target_count: 3,
        preferred_emotion: 'happy',
        image_requirements: {
          total_images_needed: 2,
          figma_images_count: 1,
          internet_images_count: 1,
          require_logo: true,
          image_categories: ['illustration', 'photo']
        }
      }
    };
    
    logInfo('Asset search input prepared:');
    log(JSON.stringify(assetSearchInput, null, 2), 'dim');
    
    log('⏳ Running DesignSpecialistAgentV2 for asset search...', 'yellow');
    const assetResult: DesignSpecialistOutputV2 = await designAgent.executeTask(assetSearchInput);
    
    if (!assetResult.success) {
      logError(`Asset search failed: ${assetResult.error}`);
      return;
    }
    
    logSuccess('Asset search completed');
    logInfo('Asset search results:');
    log(`- Assets Found: ${assetResult.results?.assets_found?.length || 0}`, 'dim');
    log(`- Figma Images: ${assetResult.results?.figma_images?.length || 0}`, 'dim');
    log(`- Internet Images: ${assetResult.results?.internet_images?.length || 0}`, 'dim');
    
    // =============================================
    // STEP 5: Рендеринг email с найденными ассетами
    // =============================================
    logStep(5, 'Rendering email with found assets', 'magenta');
    
    const designInput: DesignSpecialistInputV2 = {
      task_type: 'render_email',
      content_package: handoffData,
      rendering_requirements: {
        template_type: 'promotional',
        email_client_optimization: 'universal',
        responsive_design: true,
        seasonal_theme: true,
        include_dark_mode: false
      },
      asset_requirements: {
        tags: ['travel', 'paris', 'autumn', 'france'],
        emotional_tone: 'positive',
        campaign_type: 'seasonal',
        target_count: 3,
        preferred_emotion: 'happy',
        image_requirements: {
          total_images_needed: 2,
          figma_images_count: 1,
          internet_images_count: 1,
          require_logo: true,
          image_categories: ['illustration', 'photo']
        }
      },
      // Передаем найденные ассеты
      found_assets: assetResult.results?.assets_found || []
    };
    
    logInfo('Design input prepared with found assets:');
    log(JSON.stringify({
      task_type: designInput.task_type,
      has_content_package: !!designInput.content_package,
      found_assets_count: designInput.found_assets?.length || 0,
      rendering_requirements: designInput.rendering_requirements
    }, null, 2), 'dim');
    
    const designStartTime = Date.now();
    log('⏳ Running DesignSpecialistAgentV2 for email rendering...', 'yellow');
    
    const designResult: DesignSpecialistOutputV2 = await designAgent.executeTask(designInput);
    
    const designExecutionTime = Date.now() - designStartTime;
    
    if (designResult.success) {
      logSuccess(`Email rendering completed in ${designExecutionTime}ms`);
      
      // Детальный анализ результата
      logInfo('Email rendering results:');
      log(`- Task Type: ${designResult.task_type}`, 'dim');
      log(`- Success: ${designResult.success}`, 'dim');
      log(`- Execution Time: ${designResult.analytics?.execution_time_ms}ms`, 'dim');
      log(`- Operations Performed: ${designResult.analytics?.operations_performed}`, 'dim');
      log(`- Confidence Score: ${designResult.analytics?.confidence_score}%`, 'dim');
      log(`- Cache Hit Rate: ${designResult.analytics?.cache_hit_rate}%`, 'dim');
      
      if (designResult.results?.rendering) {
        const rendering = designResult.results.rendering;
        log('\n🎨 Rendering results:', 'cyan');
        log(`- Template Type: ${rendering.metadata?.template_type}`, 'dim');
        log(`- File Size: ${rendering.metadata?.file_size_bytes} bytes`, 'dim');
        log(`- Total Size: ${rendering.performance_metrics?.total_size_kb}KB`, 'dim');
        log(`- Images Count: ${rendering.performance_metrics?.images_count}`, 'dim');
        log(`- CSS Rules: ${rendering.performance_metrics?.css_rules_count}`, 'dim');
        log(`- Load Time: ${rendering.performance_metrics?.estimated_load_time_ms}ms`, 'dim');
        
        if (rendering.html_content) {
          log(`- HTML Content Length: ${rendering.html_content.length} characters`, 'dim');
        }
        
        if (rendering.mjml_source) {
          log(`- MJML Source Length: ${rendering.mjml_source.length} characters`, 'dim');
        }
      }
      
      if (designResult.handoff_data) {
        logInfo('Handoff data prepared for QualitySpecialist');
      }
      
      // Сохранение результата дизайна
      saveResult('design-specialist-result.json', designResult);
      
      // Сохранение HTML и MJML если есть
      if (designResult.results?.rendering?.html_content) {
        const htmlPath = path.join(__dirname, '..', 'test-results', 'generated-email.html');
        fs.writeFileSync(htmlPath, designResult.results.rendering.html_content, 'utf8');
        logInfo(`HTML email saved to: ${htmlPath}`);
      }
      
      if (designResult.results?.rendering?.mjml_source) {
        const mjmlPath = path.join(__dirname, '..', 'test-results', 'generated-email.mjml');
        fs.writeFileSync(mjmlPath, designResult.results.rendering.mjml_source, 'utf8');
        logInfo(`MJML source saved to: ${mjmlPath}`);
      }
      
    } else {
      logError(`Email rendering failed: ${designResult.error}`);
      return;
    }
    
    // =============================================
    // STEP 6: Финальный анализ и сводка
    // =============================================
    logStep(6, 'Final analysis and summary', 'magenta');
    
    const totalExecutionTime = contentExecutionTime + designExecutionTime;
    
    logInfo('Integration test summary:');
    log(`✅ Total execution time: ${totalExecutionTime}ms`, 'green');
    log(`🎯 Content generation: ${contentExecutionTime}ms`, 'dim');
    log(`🎨 Email rendering: ${designExecutionTime}ms`, 'dim');
    log(`📊 Content confidence: ${contentResult.analytics?.confidence_score || 0}%`, 'dim');
    log(`📊 Design confidence: ${designResult.analytics?.confidence_score || 0}%`, 'dim');
    
    // Создание сводного отчета
    const integrationReport = {
      test_summary: {
        topic: 'путешествие в Париж в сентябре',
        total_execution_time_ms: totalExecutionTime,
        success: true,
        agents_tested: ['ContentSpecialistAgent', 'DesignSpecialistAgentV2'],
        workflow_phases: ['content_generation', 'asset_search', 'email_rendering']
      },
      content_phase: {
        execution_time_ms: contentExecutionTime,
        success: contentResult.success,
        confidence_score: contentResult.analytics?.confidence_score,
        operations_performed: contentResult.analytics?.operations_performed,
        generated_content: contentResult.results?.content_data?.content
      },
      asset_search_phase: {
        success: assetResult.success,
        assets_found_count: assetResult.results?.assets_found?.length || 0,
        figma_images_count: assetResult.results?.figma_images?.length || 0,
        internet_images_count: assetResult.results?.internet_images?.length || 0,
        confidence_score: assetResult.analytics?.confidence_score,
        operations_performed: assetResult.analytics?.operations_performed
      },
      email_rendering_phase: {
        execution_time_ms: designExecutionTime,
        success: designResult.success,
        confidence_score: designResult.analytics?.confidence_score,
        operations_performed: designResult.analytics?.operations_performed,
        cache_hit_rate: designResult.analytics?.cache_hit_rate,
        rendering_metrics: designResult.results?.rendering?.performance_metrics
      },
      handoff_validation: {
        content_to_design: !!contentResult.recommendations?.handoff_data,
        design_to_quality: !!designResult.handoff_data,
        assets_to_rendering: !!(assetResult.results?.assets_found?.length)
      },
      final_deliverables: {
        html_generated: !!designResult.results?.rendering?.html_content,
        mjml_generated: !!designResult.results?.rendering?.mjml_source,
        assets_found: assetResult.results?.assets_found?.length || 0,
        total_workflow_success: contentResult.success && assetResult.success && designResult.success
      }
    };
    
    saveResult('integration-test-report.json', integrationReport);
    
    logSuccess('Integration test completed successfully!');
    logInfo('Check test-results/ directory for detailed outputs');
    
  } catch (error) {
    logError(`Integration test failed: ${(error as Error).message}`);
    console.error('Full error details:', error);
    
    // Сохранение ошибки для анализа
    saveResult('integration-test-error.json', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });
  }
}

// Запуск теста
runIntegrationTest().catch(console.error);

export { runIntegrationTest }; 