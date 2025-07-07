/**
 * 🚀 WORKFLOW INTEGRATION EXAMPLE
 * 
 * Демонстрирует интеграцию AgentEmailAnalyzer с 5 специализированными агентами
 * в существующий Email Campaign Orchestrator workflow.
 * 
 * Показывает:
 * - Замену quality_controller на workflow_quality_analyzer
 * - Использование данных от 5 AI-агентов для принятия решений
 * - Полную интеграцию с OpenAI tracing
 * - Workflow-совместимые handoff рекомендации
 */

import { initializeOpenAIAgents } from '../core/openai-agents-config';
import { workflowQualityAnalyzer, WorkflowQualityAnalyzerParams } from '../tools/ai-consultant/workflow-quality-analyzer';
import { ToolRegistry } from '../core/tool-registry';
import { getLogger } from '../../shared/utils/logger';

const logger = getLogger({ component: 'workflow-integration-example' });

/**
 * Пример полной интеграции Quality Specialist с новым AI-анализатором
 */
export async function runQualitySpecialistWorkflowExample() {
  logger.info('🚀 [Workflow Integration] Starting Quality Specialist workflow example...');

  try {
    // 1. Инициализация OpenAI Agents SDK
    logger.info('⚙️ [Workflow Integration] Initializing OpenAI Agents SDK...');
    await initializeOpenAIAgents();

    // 2. Получение tool из Tool Registry
    const toolRegistry = ToolRegistry.getInstance();
    const qualityTool = toolRegistry.getTool('workflow_quality_analyzer');
    
    if (!qualityTool) {
      throw new Error('workflow_quality_analyzer tool not found in registry');
    }

    logger.info('✅ [Workflow Integration] Tool found:', {
      name: qualityTool.name,
      version: qualityTool.version,
      enabled: qualityTool.enabled,
      metadata: qualityTool.metadata
    });

    // 3. Подготовка тестового HTML email
    const testEmailHTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Горящие туры в Испанию - Kupibilet</title>
  <style type="text/css">
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <table class="container" style="width: 600px; margin: 0 auto; background-color: white;">
    <tr>
      <td class="header" style="background-color: #4BFF7E; padding: 20px; text-align: center;">
        <img src="https://kupibilet.ru/logo.png" alt="Kupibilet Logo" style="height: 40px;">
        <h1 style="color: #1DA857; margin: 10px 0;">Горящие туры в Испанию!</h1>
      </td>
    </tr>
    <tr>
      <td class="content" style="padding: 30px;">
        <h2 style="color: #1DA857;">Успей забронировать!</h2>
        <p>Невероятные цены на туры в солнечную Испанию. Только до конца недели!</p>
        
        <table style="width: 100%; margin: 20px 0;">
          <tr>
            <td style="background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
              <h3 style="color: #FF6240; margin: 0;">Мадрид + Барселона</h3>
              <p style="margin: 5px 0;">7 дней / 6 ночей</p>
              <p style="font-size: 24px; color: #1DA857; font-weight: bold; margin: 0;">
                от 45,990 ₽
              </p>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://kupibilet.ru/spain-tours" 
             style="background-color: #FF6240; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;
                    display: inline-block;">
            Забронировать тур
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Предложение действительно до 31 декабря 2024 года.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f0f0f0; padding: 20px; text-align: center;">
        <p style="color: #666; margin: 0;">© 2024 Kupibilet. Все права защищены.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 4. Настройка параметров для workflow качества
    const workflowParams: WorkflowQualityAnalyzerParams = {
      html_content: testEmailHTML,
      topic: 'Горящие туры в Испанию - зимние предложения',
      mjml_source: undefined, // В реальном workflow будет передан из Design Specialist
      
      campaign_context: {
        campaign_type: 'promotional',
        target_audience: 'семьи с детьми, возраст 25-45',
        brand_guidelines: JSON.stringify({
          primary_colors: ['#4BFF7E', '#1DA857', '#FF6240'],
          fonts: ['Arial', 'Helvetica'],
          tone: 'дружелюбный и энергичный',
          logo_placement: 'header center'
        }),
        assets_used: ['logo.png', 'spain-background.jpg']
      },
      
      analysis_scope: {
        content_quality: true,
        visual_design: true,
        technical_compliance: true,
        emotional_resonance: true,
        brand_alignment: true,
        performance_optimization: true
      },
      
      quality_requirements: {
        minimum_score: 70,
        require_compliance: true,
        auto_fix_issues: false
      },
      
      workflow_context: {
        workflow_id: 'spain-summer-campaign-2025',
        trace_id: `quality-check-${Date.now()}`,
        iteration_count: 0,
        previous_scores: []
      }
    };

    // 5. Выполнение анализа качества через Tool Registry
    logger.info('🔍 [Workflow Integration] Running quality analysis with 5 AI agents...');
    const startTime = Date.now();
    
    const analysisResult = await qualityTool.execute(workflowParams);
    const executionTime = Date.now() - startTime;

    logger.info('✅ [Workflow Integration] Quality analysis completed', {
      execution_time: executionTime,
      quality_score: analysisResult.quality_score,
      quality_gate_passed: analysisResult.quality_gate_passed,
      agents_executed: analysisResult.analytics.agents_executed
    });

    // 6. Демонстрация workflow decision logic
    logger.info('🧠 [Workflow Integration] Processing workflow decisions...');
    
    const workflowDecision = processQualitySpecialistDecision(analysisResult, workflowParams);
    
    logger.info('📋 [Workflow Integration] Workflow decision:', workflowDecision);

    // 7. Демонстрация handoff данных
    if (analysisResult.handoff_recommendations.next_agent) {
      logger.info('🔄 [Workflow Integration] Handoff recommendations:', {
        next_agent: analysisResult.handoff_recommendations.next_agent,
        next_actions: analysisResult.handoff_recommendations.next_actions,
        critical_fixes: analysisResult.handoff_recommendations.critical_fixes,
        requires_manual_review: analysisResult.handoff_recommendations.requires_manual_review
      });
    }

    // 8. Детальный вывод результатов анализа
    displayDetailedAnalysisResults(analysisResult);

    return {
      success: true,
      analysis_result: analysisResult,
      workflow_decision: workflowDecision,
      execution_time: executionTime
    };

  } catch (error) {
    logger.error('❌ [Workflow Integration] Example failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Обработка решений Quality Specialist на основе результатов AI-анализа
 */
function processQualitySpecialistDecision(analysisResult: any, params: WorkflowQualityAnalyzerParams) {
  const qualityScore = analysisResult.quality_score;
  const qualityGatePassed = analysisResult.quality_gate_passed;
  const iterationCount = params.workflow_context.iteration_count || 0;

  // Логика принятия решений из обновленного промпта Quality Specialist
  if (qualityScore >= 70 && qualityGatePassed) {
    return {
      decision: 'APPROVE',
      next_agent: 'delivery_specialist',
      action: 'proceed_to_delivery',
      reason: `Quality score ${qualityScore}/100 meets requirements`,
      use_final_email_delivery: true
    };
  }

  if (qualityScore < 50) {
    return {
      decision: 'FORCE_DELIVERY',
      next_agent: 'delivery_specialist',
      action: 'force_delivery_with_warning',
      reason: `Critical quality score ${qualityScore}/100 - requires manual intervention`,
      use_final_email_delivery: true,
      warning: 'Low quality email delivered due to critical score'
    };
  }

  if (qualityScore < 70 && iterationCount === 0) {
    // Определяем, какому специалисту отправить
    const nextAgent = determineTargetSpecialist(analysisResult);
    
    return {
      decision: 'SEND_FOR_IMPROVEMENT',
      next_agent: nextAgent,
      action: 'request_improvements',
      reason: `Quality score ${qualityScore}/100 below threshold, first iteration`,
      iteration_count: 1,
      feedback_data: prepareFeedbackData(analysisResult, nextAgent)
    };
  }

  if (qualityScore < 70 && iterationCount >= 1) {
    return {
      decision: 'FORCE_DELIVERY',
      next_agent: 'delivery_specialist',
      action: 'force_delivery_after_iteration',
      reason: `Quality score ${qualityScore}/100 but maximum iterations reached`,
      use_final_email_delivery: true,
      warning: 'Email delivered after failed improvement iteration'
    };
  }

  return {
    decision: 'UNKNOWN',
    reason: 'Unexpected quality score or iteration state'
  };
}

/**
 * Определение целевого специалиста для улучшений
 */
function determineTargetSpecialist(analysisResult: any): 'content_specialist' | 'design_specialist' {
  const contentScore = analysisResult.agent_analysis.content_quality.score;
  const emotionalScore = analysisResult.agent_analysis.emotional_resonance.score;
  const designScore = analysisResult.agent_analysis.visual_design.score;
  const technicalScore = analysisResult.agent_analysis.technical_compliance.score;
  const brandScore = analysisResult.agent_analysis.brand_alignment.score;

  // Средние баллы по направлениям
  const contentAverage = (contentScore + emotionalScore) / 2;
  const designAverage = (designScore + technicalScore + brandScore) / 3;

  return contentAverage < designAverage ? 'content_specialist' : 'design_specialist';
}

/**
 * Подготовка данных обратной связи для специалистов
 */
function prepareFeedbackData(analysisResult: any, targetAgent: string) {
  if (targetAgent === 'content_specialist') {
    return {
      content_quality_score: analysisResult.agent_analysis.content_quality.score,
      emotional_resonance_score: analysisResult.agent_analysis.emotional_resonance.score,
      content_insights: analysisResult.agent_analysis.content_quality.insights,
      emotional_insights: analysisResult.agent_analysis.emotional_resonance.insights,
      content_recommendations: analysisResult.agent_analysis.content_quality.recommendations,
      emotional_recommendations: analysisResult.agent_analysis.emotional_resonance.recommendations
    };
  } else {
    return {
      visual_design_score: analysisResult.agent_analysis.visual_design.score,
      technical_compliance_score: analysisResult.agent_analysis.technical_compliance.score,
      brand_alignment_score: analysisResult.agent_analysis.brand_alignment.score,
      visual_insights: analysisResult.agent_analysis.visual_design.insights,
      technical_insights: analysisResult.agent_analysis.technical_compliance.insights,
      brand_insights: analysisResult.agent_analysis.brand_alignment.insights,
      visual_recommendations: analysisResult.agent_analysis.visual_design.recommendations,
      technical_recommendations: analysisResult.agent_analysis.technical_compliance.recommendations,
      brand_recommendations: analysisResult.agent_analysis.brand_alignment.recommendations
    };
  }
}

/**
 * Детальный вывод результатов анализа
 */
function displayDetailedAnalysisResults(result: any) {
  console.log('\n🎯 ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ AI-АНАЛИЗА КАЧЕСТВА');
  console.log('━'.repeat(80));
  
  console.log(`\n📊 ОБЩИЕ РЕЗУЛЬТАТЫ:`);
  console.log(`   Quality Score: ${result.quality_score}/100`);
  console.log(`   Quality Gate: ${result.quality_gate_passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   ML Confidence: ${result.analytics.ml_confidence}%`);
  
  console.log(`\n🤖 АНАЛИЗ ОТ 5 AI-АГЕНТОВ:`);
  
  console.log(`\n   🎯 Content Quality Agent: ${result.agent_analysis.content_quality.score}/20`);
  result.agent_analysis.content_quality.insights.forEach((insight: string, i: number) => {
    console.log(`      💡 ${insight}`);
  });
  
  console.log(`\n   🎨 Visual Design Agent: ${result.agent_analysis.visual_design.score}/20`);
  result.agent_analysis.visual_design.insights.forEach((insight: string, i: number) => {
    console.log(`      💡 ${insight}`);
  });
  
  console.log(`\n   🔧 Technical Compliance Agent: ${result.agent_analysis.technical_compliance.score}/20`);
  result.agent_analysis.technical_compliance.insights.forEach((insight: string, i: number) => {
    console.log(`      💡 ${insight}`);
  });
  
  console.log(`\n   💫 Emotional Resonance Agent: ${result.agent_analysis.emotional_resonance.score}/20`);
  result.agent_analysis.emotional_resonance.insights.forEach((insight: string, i: number) => {
    console.log(`      💡 ${insight}`);
  });
  
  console.log(`\n   🎯 Brand Alignment Agent: ${result.agent_analysis.brand_alignment.score}/20`);
  result.agent_analysis.brand_alignment.insights.forEach((insight: string, i: number) => {
    console.log(`      💡 ${insight}`);
  });

  console.log(`\n⚡ ПРОИЗВОДИТЕЛЬНОСТЬ:`);
  console.log(`   Execution Time: ${result.analytics.execution_time_ms}ms`);
  console.log(`   Parallel Execution: ${result.analytics.performance_metrics.parallel_execution_time}ms`);
  console.log(`   Agent Efficiency: ${result.analytics.performance_metrics.agent_efficiency.toFixed(2)}`);
  
  console.log(`\n🔄 WORKFLOW HANDOFF:`);
  console.log(`   Next Agent: ${result.handoff_recommendations.next_agent || 'None'}`);
  console.log(`   Requires Manual Review: ${result.handoff_recommendations.requires_manual_review ? 'Yes' : 'No'}`);
  
  if (result.quality_report.issues_found.length > 0) {
    console.log(`\n⚠️  НАЙДЕННЫЕ ПРОБЛЕМЫ:`);
    result.quality_report.issues_found.forEach((issue: any, i: number) => {
      console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      console.log(`      💡 Fix: ${issue.fix_suggestion}`);
    });
  }
  
  console.log('\n━'.repeat(80));
}

/**
 * Пример сравнения производительности: новый vs старый подход
 */
export async function compareAnalysisPerformance() {
  logger.info('📊 [Performance Comparison] Comparing workflow_quality_analyzer vs quality_controller...');

  const testHTML = '<html><body><h1>Test Email</h1></body></html>';
  
  try {
    // Тест нового подхода
    const newStartTime = Date.now();
    const newResult = await workflowQualityAnalyzer({
      html_content: testHTML,
      topic: 'Performance Test',
      campaign_context: { campaign_type: 'promotional', target_audience: 'test' },
      analysis_scope: {},
      quality_requirements: {},
      workflow_context: {}
    });
    const newTime = Date.now() - newStartTime;

    // Тест старого подхода (через Tool Registry)
    const toolRegistry = ToolRegistry.getInstance();
    const oldTool = toolRegistry.getTool('quality_controller');
    
    const oldStartTime = Date.now();
    const oldResult = await oldTool?.execute({
      html_content: testHTML,
      validation_type: 'comprehensive'
    });
    const oldTime = Date.now() - oldStartTime;

    console.log('\n📊 СРАВНЕНИЕ ПРОИЗВОДИТЕЛЬНОСТИ:');
    console.log('━'.repeat(50));
    console.log(`🤖 Workflow Quality Analyzer (5 AI Agents):`);
    console.log(`   Время выполнения: ${newTime}ms`);
    console.log(`   Качество анализа: ${newResult.quality_score}/100`);
    console.log(`   Агентов выполнено: ${newResult.analytics.agents_executed}`);
    console.log(`   ML Confidence: ${newResult.analytics.ml_confidence}%`);
    
    console.log(`\n🔧 Quality Controller (Legacy):`);
    console.log(`   Время выполнения: ${oldTime}ms`);
    console.log(`   Базовый анализ: упрощенная проверка`);
    
    console.log(`\n📈 ПРЕИМУЩЕСТВА НОВОГО ПОДХОДА:`);
    console.log(`   ✅ 5 специализированных AI-агентов`);
    console.log(`   ✅ Параллельное выполнение анализа`);
    console.log(`   ✅ OpenAI Agents SDK интеграция`);
    console.log(`   ✅ Полное трейсинг логирование`);
    console.log(`   ✅ Workflow-совместимые handoffs`);
    console.log(`   ✅ Детальные рекомендации от AI`);
    
    return {
      new_approach: { time: newTime, score: newResult.quality_score },
      old_approach: { time: oldTime, basic_analysis: true },
      improvement_factor: Math.round((oldTime / newTime) * 100) / 100
    };

  } catch (error) {
    logger.error('❌ [Performance Comparison] Failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Functions are already exported inline above 