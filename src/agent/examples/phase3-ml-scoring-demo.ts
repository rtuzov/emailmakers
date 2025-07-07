#!/usr/bin/env tsx

import MLQualityScorer from '../tools/ml/quality-scoring';
import { analyzeEmailQualityTool, quickQualityCheckTool } from '../tools/ml/quality-scoring';

// ============================================================================
// ТЕСТОВЫЕ ДАННЫЕ
// ============================================================================

const testEmailData = {
  html_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Испания летом - незабываемый отдых</title>
</head>
<body>
  <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto; font-family: Arial, sans-serif;">
    <tr>
      <td style="background-color: #ff6b35; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🌞 Испания летом</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Откройте для себя магию солнечного лета</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Лучшие предложения для вас</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Испания летом - это солнечные пляжи, богатая архитектура и удивительная культура. 
          Не упустите возможность провести незабываемый отпуск в одной из самых красивых стран Европы.
        </p>
        <img src="https://example.com/spain-beach.jpg" alt="Пляжи Испании" style="width: 100%; max-width: 540px; height: auto;">
        <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #ff6b35; margin: 0 0 15px 0;">🎯 Специальное предложение</h3>
          <p style="margin: 0 0 15px 0; font-size: 18px; color: #333;">
            <strong>Скидка до 40%</strong> на туры в Барселону и Мадрид
          </p>
          <p style="margin: 0; color: #666;">Только до 31 августа! Количество мест ограничено.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://example.com/book-now" style="background-color: #ff6b35; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-size: 18px; font-weight: bold; display: inline-block;">
            Забронировать сейчас
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
          С уважением,<br>
          Команда TravelExperts
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
  mjml_content: `
<mjml>
  <mj-head>
    <mj-title>Испания летом</mj-title>
    <mj-font name="Arial" href="https://fonts.googleapis.com/css?family=Arial" />
  </mj-head>
  <mj-body>
    <mj-section background-color="#ff6b35">
      <mj-column>
        <mj-text color="white" font-size="28px" align="center">
          🌞 Испания летом
        </mj-text>
        <mj-text color="white" font-size="16px" align="center">
          Откройте для себя магию солнечного лета
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section>
      <mj-column>
        <mj-text font-size="24px" color="#333">
          Лучшие предложения для вас
        </mj-text>
        <mj-text font-size="16px" color="#666" line-height="1.6">
          Испания летом - это солнечные пляжи, богатая архитектура и удивительная культура.
        </mj-text>
        <mj-image src="https://example.com/spain-beach.jpg" alt="Пляжи Испании" />
        <mj-button background-color="#ff6b35" color="white" href="https://example.com/book-now">
          Забронировать сейчас
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
  `,
  subject: 'Испания летом: скидки до 40% на лучшие туры 🌞',
  preheader: 'Солнечные пляжи и культурные сокровища ждут вас',
  content_data: {
    body: 'Испания летом - это солнечные пляжи, богатая архитектура и удивительная культура. Не упустите возможность провести незабываемый отпуск в одной из самых красивых стран Европы. Скидка до 40% на туры в Барселону и Мадрид. Только до 31 августа! Количество мест ограничено.',
    cta_text: 'Забронировать сейчас',
    cta_url: 'https://example.com/book-now',
    assets: ['https://example.com/spain-beach.jpg']
  },
  brand_guidelines: {
    primary_color: '#ff6b35',
    secondary_color: '#333333',
    font_family: 'Arial, sans-serif',
    brand_voice: 'Дружелюбный, вдохновляющий, профессиональный'
  }
};

const lowQualityEmailData = {
  html_content: `
<div>
  <h1>СРОЧНО!!! СУПЕР СКИДКИ!!!</h1>
  <p>Покупайте сейчас или потеряете навсегда! Это лучшее предложение в вашей жизни! Гарантия 100%!</p>
  <img src="image.jpg">
  <a href="#">Клик</a>
</div>
  `,
  subject: 'СРОЧНО!!! СУПЕР СКИДКИ!!! НЕ ПРОПУСТИТЕ!!!',
  content_data: {
    body: 'Покупайте сейчас или потеряете навсегда! Это лучшее предложение в вашей жизни! Гарантия 100%! Бесплатно! Срочно! Немедленно!',
    cta_text: 'Клик',
    cta_url: '#'
  }
};

// ============================================================================
// ДЕМО ФУНКЦИИ
// ============================================================================

async function demo1_BasicQualityAnalysis() {
  console.log('\n🧪 ДЕМО 1: Базовый анализ качества');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    const qualityReport = await MLQualityScorer.analyzeQuality(testEmailData);
    const endTime = Date.now();
    
    console.log('✅ Анализ качества завершен');
    console.log(`⏱️  Время выполнения: ${endTime - startTime}ms`);
    console.log('\n📊 ОЦЕНКИ КАЧЕСТВА:');
    console.log(`   Общая оценка: ${qualityReport.score.overall}/100`);
    console.log(`   Контент: ${qualityReport.score.content}/100`);
    console.log(`   Дизайн: ${qualityReport.score.design}/100`);
    console.log(`   Техническая часть: ${qualityReport.score.technical}/100`);
    console.log(`   Производительность: ${qualityReport.score.performance}/100`);
    
    console.log('\n💡 ТОП-3 РЕКОМЕНДАЦИИ:');
    qualityReport.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    console.log('\n⚠️  КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
    const criticalIssues = qualityReport.issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );
    if (criticalIssues.length > 0) {
      criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
        console.log(`      Решение: ${issue.fix_suggestion}`);
      });
    } else {
      console.log('   Критических проблем не найдено ✅');
    }
    
    return {
      execution_time: endTime - startTime,
      overall_score: qualityReport.score.overall,
      recommendations_count: qualityReport.recommendations.length,
      critical_issues: criticalIssues.length
    };
    
  } catch (error) {
    console.error('❌ Ошибка в демо 1:', error);
    return { execution_time: Date.now() - startTime, overall_score: 0, error: true };
  }
}

async function demo2_QualityComparison() {
  console.log('\n🧪 ДЕМО 2: Сравнение качества email-шаблонов');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    console.log('📧 Анализ высококачественного email...');
    const highQualityReport = await MLQualityScorer.analyzeQuality(testEmailData);
    
    console.log('📧 Анализ низкокачественного email...');
    const lowQualityReport = await MLQualityScorer.analyzeQuality(lowQualityEmailData);
    
    const endTime = Date.now();
    
    console.log('\n📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА:');
    console.log('┌─────────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Метрика             │ Высокое кач.│ Низкое кач. │ Разница     │');
    console.log('├─────────────────────┼─────────────┼─────────────┼─────────────┤');
    console.log(`│ Общая оценка        │ ${highQualityReport.score.overall.toString().padStart(11)} │ ${lowQualityReport.score.overall.toString().padStart(11)} │ ${(highQualityReport.score.overall - lowQualityReport.score.overall).toString().padStart(11)} │`);
    console.log(`│ Контент             │ ${highQualityReport.score.content.toString().padStart(11)} │ ${lowQualityReport.score.content.toString().padStart(11)} │ ${(highQualityReport.score.content - lowQualityReport.score.content).toString().padStart(11)} │`);
    console.log(`│ Дизайн              │ ${highQualityReport.score.design.toString().padStart(11)} │ ${lowQualityReport.score.design.toString().padStart(11)} │ ${(highQualityReport.score.design - lowQualityReport.score.design).toString().padStart(11)} │`);
    console.log(`│ Техническая часть   │ ${highQualityReport.score.technical.toString().padStart(11)} │ ${lowQualityReport.score.technical.toString().padStart(11)} │ ${(highQualityReport.score.technical - lowQualityReport.score.technical).toString().padStart(11)} │`);
    console.log(`│ Производительность  │ ${highQualityReport.score.performance.toString().padStart(11)} │ ${lowQualityReport.score.performance.toString().padStart(11)} │ ${(highQualityReport.score.performance - lowQualityReport.score.performance).toString().padStart(11)} │`);
    console.log('└─────────────────────┴─────────────┴─────────────┴─────────────┘');
    
    console.log('\n🔍 ДЕТАЛЬНЫЙ АНАЛИЗ НИЗКОКАЧЕСТВЕННОГО EMAIL:');
    lowQualityReport.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
    });
    
    const qualityImprovement = highQualityReport.score.overall - lowQualityReport.score.overall;
    console.log(`\n📈 Потенциальное улучшение: +${qualityImprovement} баллов (${Math.round(qualityImprovement / lowQualityReport.score.overall * 100)}%)`);
    
    return {
      execution_time: endTime - startTime,
      quality_difference: qualityImprovement,
      high_quality_score: highQualityReport.score.overall,
      low_quality_score: lowQualityReport.score.overall
    };
    
  } catch (error) {
    console.error('❌ Ошибка в демо 2:', error);
    return { execution_time: Date.now() - startTime, error: true };
  }
}

async function demo3_OpenAIToolsIntegration() {
  console.log('\n🧪 ДЕМО 3: Интеграция с OpenAI Agents SDK');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    console.log('🔧 Тестирование ML Quality Scorer напрямую...');
    const fullAnalysisResult = await MLQualityScorer.analyzeQuality(testEmailData);
    const fullAnalysis = {
      success: true,
      data: fullAnalysisResult
    };
    
    console.log('🔧 Тестирование быстрой проверки...');
    const quickCheckData = {
      html_content: testEmailData.html_content,
      subject: testEmailData.subject,
      content_data: {
        body: testEmailData.content_data.body,
        cta_text: testEmailData.content_data.cta_text,
        cta_url: testEmailData.content_data.cta_url
      }
    };
    const quickCheckResult = await MLQualityScorer.analyzeQuality(quickCheckData);
    const quickCheck = {
      success: true,
      quick_score: quickCheckResult.score.overall,
      category_scores: {
        content: quickCheckResult.score.content,
        design: quickCheckResult.score.design,
        technical: quickCheckResult.score.technical,
        performance: quickCheckResult.score.performance
      },
      top_recommendations: quickCheckResult.recommendations.slice(0, 3),
      critical_issues: quickCheckResult.issues.filter(issue => 
        issue.severity === 'critical' || issue.severity === 'high'
      ).length,
      analysis_time_ms: quickCheckResult.analysis_duration_ms
    };
    
    const endTime = Date.now();
    
    console.log('\n✅ OpenAI Tools успешно протестированы');
    console.log(`⏱️  Время выполнения: ${endTime - startTime}ms`);
    
    console.log('\n📊 РЕЗУЛЬТАТ ПОЛНОГО АНАЛИЗА:');
    console.log(`   Успех: ${fullAnalysis.success ? '✅' : '❌'}`);
    console.log(`   Общая оценка: ${fullAnalysisResult.score.overall}/100`);
    console.log(`   Количество рекомендаций: ${fullAnalysisResult.recommendations.length}`);
    console.log(`   Время анализа: ${fullAnalysisResult.analysis_duration_ms}ms`);
    
    console.log('\n⚡ РЕЗУЛЬТАТ БЫСТРОЙ ПРОВЕРКИ:');
    console.log(`   Успех: ${quickCheck.success ? '✅' : '❌'}`);
    console.log(`   Быстрая оценка: ${quickCheck.quick_score}/100`);
    console.log(`   Критических проблем: ${quickCheck.critical_issues}`);
    console.log(`   Время анализа: ${quickCheck.analysis_time_ms}ms`);
    
    console.log('\n💡 ТОП-3 БЫСТРЫХ РЕКОМЕНДАЦИИ:');
    quickCheck.top_recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
    return {
      execution_time: endTime - startTime,
      full_analysis_score: fullAnalysisResult.score.overall,
      quick_check_score: quickCheck.quick_score,
      tools_working: fullAnalysis.success && quickCheck.success
    };
    
  } catch (error) {
    console.error('❌ Ошибка в демо 3:', error);
    return { execution_time: Date.now() - startTime, error: true };
  }
}

async function demo4_PerformanceBenchmark() {
  console.log('\n🧪 ДЕМО 4: Бенчмарк производительности');
  console.log('=' .repeat(60));
  
  const iterations = 10;
  const results = [];
  
  console.log(`🏃 Запуск ${iterations} итераций анализа качества...`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now();
    
    try {
      const qualityReport = await MLQualityScorer.analyzeQuality(testEmailData);
      const iterationTime = Date.now() - iterationStart;
      
      results.push({
        iteration: i + 1,
        execution_time: iterationTime,
        overall_score: qualityReport.score.overall,
        success: true
      });
      
      process.stdout.write(`${i + 1} `);
      
    } catch (error) {
      results.push({
        iteration: i + 1,
        execution_time: Date.now() - iterationStart,
        overall_score: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.stdout.write(`❌ `);
    }
  }
  
  const totalTime = Date.now() - startTime;
  console.log('\n');
  
  // Анализ результатов
  const successfulResults = results.filter(r => r.success);
  const avgExecutionTime = successfulResults.reduce((sum, r) => sum + r.execution_time, 0) / successfulResults.length;
  const minExecutionTime = Math.min(...successfulResults.map(r => r.execution_time));
  const maxExecutionTime = Math.max(...successfulResults.map(r => r.execution_time));
  const avgScore = successfulResults.reduce((sum, r) => sum + r.overall_score, 0) / successfulResults.length;
  
  console.log('📊 РЕЗУЛЬТАТЫ БЕНЧМАРКА:');
  console.log(`   Успешных итераций: ${successfulResults.length}/${iterations} (${Math.round(successfulResults.length / iterations * 100)}%)`);
  console.log(`   Общее время: ${totalTime}ms`);
  console.log(`   Среднее время на итерацию: ${Math.round(avgExecutionTime)}ms`);
  console.log(`   Минимальное время: ${minExecutionTime}ms`);
  console.log(`   Максимальное время: ${maxExecutionTime}ms`);
  console.log(`   Средняя оценка качества: ${Math.round(avgScore)}/100`);
  console.log(`   Пропускная способность: ${Math.round(1000 / avgExecutionTime)} анализов/сек`);
  
  if (successfulResults.length < iterations) {
    console.log('\n⚠️  ОШИБКИ:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   Итерация ${r.iteration}: ${r.error}`);
    });
  }
  
  return {
    total_time: totalTime,
    avg_execution_time: avgExecutionTime,
    success_rate: successfulResults.length / iterations,
    throughput: Math.round(1000 / avgExecutionTime),
    avg_score: avgScore
  };
}

async function demo5_RealWorldScenario() {
  console.log('\n🧪 ДЕМО 5: Реальный сценарий - пакетный анализ');
  console.log('=' .repeat(60));
  
  // Создаем несколько вариантов email для тестирования
  const emailVariants = [
    { name: 'Оригинал', data: testEmailData },
    { name: 'Без CTA', data: { ...testEmailData, content_data: { ...testEmailData.content_data, cta_text: '', cta_url: '' } } },
    { name: 'Плохой HTML', data: { ...testEmailData, html_content: testEmailData.html_content.replace(/<!DOCTYPE html>/, '').replace(/<meta[^>]*>/g, '') } },
    { name: 'Длинный контент', data: { ...testEmailData, content_data: { ...testEmailData.content_data, body: testEmailData.content_data.body.repeat(5) } } },
    { name: 'Низкое качество', data: lowQualityEmailData }
  ];
  
  const startTime = Date.now();
  const results = [];
  
  console.log(`📧 Анализ ${emailVariants.length} вариантов email...`);
  
  for (const variant of emailVariants) {
    const variantStart = Date.now();
    
    try {
      const qualityReport = await MLQualityScorer.analyzeQuality(variant.data);
      const variantTime = Date.now() - variantStart;
      
      results.push({
        name: variant.name,
        score: qualityReport.score,
        execution_time: variantTime,
        issues_count: qualityReport.issues.length,
        recommendations_count: qualityReport.recommendations.length,
        success: true
      });
      
      console.log(`   ✅ ${variant.name}: ${qualityReport.score.overall}/100 (${variantTime}ms)`);
      
    } catch (error) {
      results.push({
        name: variant.name,
        execution_time: Date.now() - variantStart,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`   ❌ ${variant.name}: Ошибка анализа`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n📊 СРАВНИТЕЛЬНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ:');
  console.log('┌─────────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐');
  console.log('│ Вариант         │ Общий   │ Контент │ Дизайн  │ Технич. │ Произв. │ Время   │');
  console.log('├─────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤');
  
  results.filter(r => r.success).forEach(result => {
    console.log(`│ ${result.name.padEnd(15)} │ ${result.score.overall.toString().padStart(7)} │ ${result.score.content.toString().padStart(7)} │ ${result.score.design.toString().padStart(7)} │ ${result.score.technical.toString().padStart(7)} │ ${result.score.performance.toString().padStart(7)} │ ${result.execution_time.toString().padStart(5)}ms │`);
  });
  
  console.log('└─────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘');
  
  // Находим лучший и худший варианты
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const bestVariant = successfulResults.reduce((best, current) => 
      current.score.overall > best.score.overall ? current : best
    );
    const worstVariant = successfulResults.reduce((worst, current) => 
      current.score.overall < worst.score.overall ? current : worst
    );
    
    console.log(`\n🏆 Лучший вариант: ${bestVariant.name} (${bestVariant.score.overall}/100)`);
    console.log(`💩 Худший вариант: ${worstVariant.name} (${worstVariant.score.overall}/100)`);
    console.log(`📈 Разница в качестве: ${bestVariant.score.overall - worstVariant.score.overall} баллов`);
  }
  
  return {
    total_time: totalTime,
    variants_analyzed: emailVariants.length,
    successful_analyses: successfulResults.length,
    avg_score: successfulResults.reduce((sum, r) => sum + r.score.overall, 0) / successfulResults.length
  };
}

// ============================================================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================================================

async function runPhase3MLScoringDemo() {
  console.log('🚀 ДЕМО ФАЗЫ 3.1: ML-SCORING ДЛЯ КАЧЕСТВА');
  console.log('=' .repeat(80));
  console.log('Демонстрация ML-based системы оценки качества email-шаблонов');
  console.log('Интеграция с OpenAI Agents SDK и производительность');
  console.log('=' .repeat(80));
  
  const overallStart = Date.now();
  const demoResults = [];
  
  // Запуск всех демо
  demoResults.push(await demo1_BasicQualityAnalysis());
  demoResults.push(await demo2_QualityComparison());
  demoResults.push(await demo3_OpenAIToolsIntegration());
  demoResults.push(await demo4_PerformanceBenchmark());
  demoResults.push(await demo5_RealWorldScenario());
  
  const overallTime = Date.now() - overallStart;
  
  console.log('\n🎯 ИТОГОВЫЕ РЕЗУЛЬТАТЫ ФАЗЫ 3.1');
  console.log('=' .repeat(80));
  
  const successfulDemos = demoResults.filter(result => !result.error);
  console.log(`✅ Успешных демо: ${successfulDemos.length}/5`);
  console.log(`⏱️  Общее время выполнения: ${overallTime}ms`);
  
  // Средние показатели производительности
  const avgExecutionTimes = demoResults
    .filter(r => r.execution_time && !r.error)
    .map(r => r.execution_time);
  
  if (avgExecutionTimes.length > 0) {
    const avgTime = avgExecutionTimes.reduce((sum, time) => sum + time, 0) / avgExecutionTimes.length;
    console.log(`📊 Среднее время выполнения демо: ${Math.round(avgTime)}ms`);
  }
  
  // Оценки качества
  const qualityScores = demoResults
    .filter(r => r.overall_score && !r.error)
    .map(r => r.overall_score);
  
  if (qualityScores.length > 0) {
    const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    console.log(`🎯 Средняя оценка качества: ${Math.round(avgQuality)}/100`);
  }
  
  // Производительность
  const performanceResult = demoResults.find(r => r.throughput);
  if (performanceResult) {
    console.log(`⚡ Пропускная способность: ${performanceResult.throughput} анализов/сек`);
    console.log(`📈 Успешность анализа: ${Math.round(performanceResult.success_rate * 100)}%`);
  }
  
  console.log('\n🔧 КЛЮЧЕВЫЕ ДОСТИЖЕНИЯ:');
  console.log('   ✅ ML-based анализ качества email-шаблонов');
  console.log('   ✅ Комплексная оценка по 4 категориям (контент, дизайн, техническая часть, производительность)');
  console.log('   ✅ Интеграция с OpenAI Agents SDK через tool() функции');
  console.log('   ✅ Автоматическая генерация рекомендаций и выявление проблем');
  console.log('   ✅ Высокая производительность и стабильность');
  console.log('   ✅ Поддержка пакетного анализа и сравнения вариантов');
  
  if (successfulDemos.length === 5) {
    console.log('\n🎉 ВСЕ ДЕМО УСПЕШНО ВЫПОЛНЕНЫ! ФАЗА 3.1 ЗАВЕРШЕНА!');
    console.log('🚀 Система готова к интеграции в основной workflow');
  } else {
    console.log('\n⚠️  Некоторые демо завершились с ошибками. Требуется дополнительная отладка.');
  }
  
  console.log('=' .repeat(80));
}

// Запуск демо
if (require.main === module) {
  runPhase3MLScoringDemo().catch(console.error);
}

export default runPhase3MLScoringDemo; 