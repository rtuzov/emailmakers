/**
 * Example: Agent Integration with OpenAI Agents SDK
 * 
 * Демонстрирует интеграцию нового агент-анализатора с полным логированием
 * и трейсингом для системы Email-Makers.
 */

import { AgentEmailAnalyzer } from '../tools/ai-consultant/agent-analyzer';
import { AIConsultantRequest, AIConsultantConfig } from '../tools/ai-consultant/types';
import { logger } from '../core/logger';

/**
 * Пример использования агент-анализатора с детальным логированием
 */
export async function runAgentAnalysisExample() {
  try {
    logger.info('🚀 [Example] Starting Agent Integration Example');

    // Инициализируем SDK один раз
    await AgentEmailAnalyzer.initializeSDK();
    logger.info('✅ [Example] OpenAI Agents SDK initialized');

    // Конфигурация для анализатора
    const config: AIConsultantConfig = {
      quality_gate_threshold: 75,
      auto_execute_threshold: 0.8,
      critical_issue_threshold: 30,
      max_iterations: 3,
      max_auto_execute_per_iteration: 3,
      max_total_execution_time: 300,
      ai_model: 'gpt-4o-mini',
      analysis_temperature: 0.3,
      max_recommendations: 8,
      enable_auto_execution: false,
      enable_image_analysis: true,
      enable_brand_compliance: true,
      enable_accessibility_checks: true,
      log_level: 'info',
      enable_analytics: true,
      enable_progress_tracking: true
    };

    // Создаем анализатор
    const analyzer = new AgentEmailAnalyzer(config);
    logger.info('🤖 [Example] Agent analyzer created');

    // Пример запроса на анализ
    const analysisRequest: AIConsultantRequest = {
      topic: 'Summer Travel Deals - Example Campaign',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Summer Travel Deals</title>
        </head>
        <body>
          <table width="600" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color: #4BFF7E; padding: 20px; text-align: center;">
                <h1 style="color: #2C3959; font-family: Arial, sans-serif;">
                  🌞 Summer Travel Deals
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="color: #1DA857;">Discover Amazing Destinations</h2>
                <p style="font-family: Arial, sans-serif; line-height: 1.6;">
                  Get ready for the adventure of a lifetime! Our summer deals offer 
                  incredible savings on flights to your favorite destinations.
                </p>
                <a href="#" style="background-color: #FF6240; color: white; padding: 15px 30px; 
                                   text-decoration: none; border-radius: 5px; display: inline-block;">
                  Book Now - Save 30%
                </a>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      campaign_type: 'promotional',
      target_audience: 'Travel enthusiasts looking for summer vacation deals',
      mjml_source: null,
      assets_info: {
        original_assets: ['summer-banner.jpg', 'destination-icons.svg'],
        processed_assets: ['optimized-banner.webp', 'sprite-icons.svg'],
        sprite_metadata: JSON.stringify({ icons: 12, total_size: '45KB' })
      },
      render_results: {
        overall_score: 85,
        client_compatibility: {
          gmail: 95,
          outlook: 80,
          apple_mail: 90,
          yahoo: 75
        },
        issues_found: ['Minor CSS compatibility in Outlook 2016']
      },
      iteration_count: 0,
      previous_analysis: null,
      improvement_history: []
    };

    logger.info('📧 [Example] Starting email analysis with all agents');

    // Выполняем анализ с полным трейсингом
    const startTime = Date.now();
    const analysisResult = await analyzer.analyzeEmail(analysisRequest);
    const analysisTime = Date.now() - startTime;

    // Логируем детальные результаты
    logger.info('✅ [Example] Agent analysis completed successfully', {
      analysis_time_ms: analysisTime,
      overall_score: analysisResult.overall_score,
      quality_grade: analysisResult.quality_grade,
      quality_gate_passed: analysisResult.quality_gate_passed,
      confidence_level: analysisResult.confidence_level
    });

    // Логируем результаты по каждому измерению
    logger.info('📊 [Example] Dimension Analysis Results:');
    Object.entries(analysisResult.dimension_scores).forEach(([dimension, score]) => {
      logger.info(`   ${dimension}: ${score}/100`);
    });

    // Логируем проанализированные элементы
    logger.info('📋 [Example] Analyzed Elements:', {
      elements_count: analysisResult.analyzed_elements.length,
      elements: analysisResult.analyzed_elements.map(el => ({
        element: el.element,
        score: el.score,
        issues_count: el.issues.length
      }))
    });

    // Пример метрик производительности
    logger.info('📈 [Example] Performance Metrics:', {
      total_analysis_time: analysisTime,
      average_time_per_dimension: analysisTime / 5,
      improvement_potential: analysisResult.improvement_potential,
      estimated_final_score: analysisResult.estimated_final_score
    });

    return analysisResult;

  } catch (error) {
    logger.error('❌ [Example] Agent integration example failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Пример трейсинга множественных анализов для демонстрации логирования
 */
export async function runMultipleAnalysisExample() {
  logger.info('🔄 [Example] Starting multiple analysis example');

  const campaigns = [
    { topic: 'Flash Sale - Electronics', type: 'promotional' as const },
    { topic: 'Newsletter - Tech Updates', type: 'informational' as const },
    { topic: 'Holiday Greetings', type: 'seasonal' as const }
  ];

  // Инициализируем SDK один раз
  await AgentEmailAnalyzer.initializeSDK();

  const config: AIConsultantConfig = {
    quality_gate_threshold: 70,
    auto_execute_threshold: 0.8,
    critical_issue_threshold: 30,
    max_iterations: 2,
    max_auto_execute_per_iteration: 2,
    max_total_execution_time: 300,
    ai_model: 'gpt-4o-mini',
    analysis_temperature: 0.3,
    max_recommendations: 5,
    enable_auto_execution: false,
    enable_image_analysis: false,
    enable_brand_compliance: true,
    enable_accessibility_checks: true,
    log_level: 'info',
    enable_analytics: true,
    enable_progress_tracking: true
  };

  const analyzer = new AgentEmailAnalyzer(config);
  const results = [];

  // Анализируем каждую кампанию с отдельным трейсингом
  for (let i = 0; i < campaigns.length; i++) {
    const campaign = campaigns[i];
    
    logger.info(`🎯 [Example] Analyzing campaign ${i + 1}/${campaigns.length}:`, {
      topic: campaign.topic,
      type: campaign.type
    });

    const request: AIConsultantRequest = {
      topic: campaign.topic,
      html_content: `<html><body><h1>${campaign.topic}</h1><p>Sample content for ${campaign.type} campaign.</p></body></html>`,
      campaign_type: campaign.type,
      target_audience: 'General audience',
      iteration_count: 0
    };

    try {
      const result = await analyzer.analyzeEmail(request);
      results.push({
        campaign: campaign.topic,
        score: result.overall_score,
        grade: result.quality_grade,
        passed: result.quality_gate_passed
      });

      logger.info(`✅ [Example] Campaign ${i + 1} analyzed:`, {
        topic: campaign.topic,
        score: result.overall_score,
        grade: result.quality_grade
      });

    } catch (error) {
      logger.error(`❌ [Example] Campaign ${i + 1} analysis failed:`, {
        topic: campaign.topic,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  logger.info('🏁 [Example] Multiple analysis example completed', {
    total_campaigns: campaigns.length,
    successful_analyses: results.length,
    results: results
  });

  return results;
}

/**
 * Запуск всех примеров
 */
export async function runAllExamples() {
  try {
    logger.info('🎬 [Example] Starting all integration examples');

    // Пример 1: Детальный анализ одной кампании
    const singleAnalysis = await runAgentAnalysisExample();
    
    // Пример 2: Множественный анализ
    const multipleAnalysis = await runMultipleAnalysisExample();

    logger.info('🎉 [Example] All examples completed successfully', {
      single_analysis_score: singleAnalysis.overall_score,
      multiple_analysis_count: multipleAnalysis.length
    });

    return {
      single_analysis: singleAnalysis,
      multiple_analysis: multipleAnalysis
    };

  } catch (error) {
    logger.error('❌ [Example] Examples execution failed', { error });
    throw error;
  }
}

// Экспорт для использования в других местах
export { AgentEmailAnalyzer }; 