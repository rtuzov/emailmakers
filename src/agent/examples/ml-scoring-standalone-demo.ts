/**
 * 🚀 STANDALONE ML-SCORING DEMO
 * 
 * Демонстрация ML-scoring системы без зависимости от OpenAI API
 * Показывает чистую функциональность ML-анализа качества
 */

import { MLQualityScorer } from '../tools/ml/quality-scoring';

// Тестовые данные для демонстрации
const HIGH_QUALITY_EMAIL = {
  html_content: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Специальные предложения от Aviasales</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h1 style="color: #ff6b35; font-family: Arial, sans-serif; font-size: 28px; margin: 0 0 20px 0;">
                🎯 Горячие предложения на билеты!
              </h1>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Москва → Париж от <strong style="color: #ff6b35;">15,000 ₽</strong><br>
                Санкт-Петербург → Лондон от <strong style="color: #ff6b35;">18,500 ₽</strong><br>
                Казань → Стамбул от <strong style="color: #ff6b35;">12,000 ₽</strong>
              </p>
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #ff6b35; border-radius: 6px; padding: 15px 30px;">
                    <a href="https://aviasales.ru/search" style="color: #ffffff; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; text-decoration: none;">
                      Найти билеты
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-family: Arial, sans-serif; font-size: 14px; margin: 30px 0 0 0;">
                Предложение действительно до 31 декабря 2024 года
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  subject: '🎯 Горячие предложения на билеты! Москва → Париж от 15,000 ₽',
  preheader: 'Специальные цены на популярные направления - успейте забронировать!',
  content_data: {
    body: 'Горячие предложения на билеты! Москва → Париж от 15,000 ₽, Санкт-Петербург → Лондон от 18,500 ₽, Казань → Стамбул от 12,000 ₽. Предложение действительно до 31 декабря 2024 года.',
    cta_text: 'Найти билеты',
    cta_url: 'https://aviasales.ru/search',
    assets: []
  },
  brand_guidelines: {
    primary_color: '#ff6b35',
    secondary_color: '#333333',
    font_family: 'Arial, sans-serif',
    brand_voice: 'Friendly and energetic'
  }
};

const LOW_QUALITY_EMAIL = {
  html_content: `
<html>
<body>
  <div style="color:red">
    <h1>СРОЧНО! СКИДКИ!</h1>
    <p>Билеты дешево! Покупайте сейчас!</p>
    <a href="#">КУПИТЬ</a>
  </div>
</body>
</html>`,
  subject: 'СРОЧНО!!! СКИДКИ НА БИЛЕТЫ!!! ПОКУПАЙТЕ СЕЙЧАС!!!',
  preheader: '',
  content_data: {
    body: 'СРОЧНО! СКИДКИ! Билеты дешево! Покупайте сейчас!',
    cta_text: 'КУПИТЬ',
    cta_url: '#',
    assets: []
  },
  brand_guidelines: {
    primary_color: '#ff0000',
    secondary_color: '#000000',
    font_family: 'Arial',
    brand_voice: 'Aggressive'
  }
};

/**
 * Демонстрация ML-анализа качества
 */
async function demonstrateMLAnalysis(): Promise<void> {
  console.log('🤖 ДЕМОНСТРАЦИЯ ML-АНАЛИЗА КАЧЕСТВА EMAIL');
  console.log('=' .repeat(50));

  try {
    // 1. Анализ высококачественного email
    console.log('\n📊 1. Анализ высококачественного email...');
    const startTime1 = Date.now();
    const highQualityReport = await MLQualityScorer.analyzeQuality(HIGH_QUALITY_EMAIL);
    const executionTime1 = Date.now() - startTime1;

    console.log(`   ⏱️ Время анализа: ${executionTime1}ms`);
    console.log(`   🎯 Общая оценка: ${highQualityReport.score.overall}/100`);
    console.log(`   📝 Контент: ${highQualityReport.score.content}/100`);
    console.log(`   🎨 Дизайн: ${highQualityReport.score.design}/100`);
    console.log(`   ⚙️ Техническая часть: ${highQualityReport.score.technical}/100`);
    console.log(`   ⚡ Производительность: ${highQualityReport.score.performance}/100`);

    // 2. Анализ низкокачественного email
    console.log('\n📊 2. Анализ низкокачественного email...');
    const startTime2 = Date.now();
    const lowQualityReport = await MLQualityScorer.analyzeQuality(LOW_QUALITY_EMAIL);
    const executionTime2 = Date.now() - startTime2;

    console.log(`   ⏱️ Время анализа: ${executionTime2}ms`);
    console.log(`   🎯 Общая оценка: ${lowQualityReport.score.overall}/100`);
    console.log(`   📝 Контент: ${lowQualityReport.score.content}/100`);
    console.log(`   🎨 Дизайн: ${lowQualityReport.score.design}/100`);
    console.log(`   ⚙️ Техническая часть: ${lowQualityReport.score.technical}/100`);
    console.log(`   ⚡ Производительность: ${lowQualityReport.score.performance}/100`);

    // 3. Сравнение результатов
    console.log('\n📈 3. Сравнение результатов:');
    const scoreDifference = highQualityReport.score.overall - lowQualityReport.score.overall;
    console.log(`   🏆 Высококачественный email: ${highQualityReport.score.overall}/100`);
    console.log(`   📉 Низкокачественный email: ${lowQualityReport.score.overall}/100`);
    console.log(`   📊 Разница: ${scoreDifference} баллов`);
    console.log(`   💡 ML-система ${scoreDifference > 10 ? '✅ успешно' : '⚠️ частично'} различает качество`);

    // 4. Детальный анализ проблем
    console.log('\n🔍 4. Анализ проблем в низкокачественном email:');
    if (lowQualityReport.issues.length > 0) {
      lowQualityReport.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.issue}`);
        console.log(`      💡 Решение: ${issue.fix_suggestion}`);
      });
    } else {
      console.log('   ✅ Проблем не обнаружено');
    }

    // 5. Рекомендации для улучшения
    console.log('\n💡 5. Рекомендации для улучшения низкокачественного email:');
    if (lowQualityReport.recommendations.length > 0) {
      lowQualityReport.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // 6. Анализ производительности
    console.log('\n⚡ 6. Анализ производительности ML-системы:');
    console.log(`   🚀 Скорость анализа высококачественного email: ${executionTime1}ms`);
    console.log(`   🚀 Скорость анализа низкокачественного email: ${executionTime2}ms`);
    console.log(`   📊 Средняя скорость: ${Math.round((executionTime1 + executionTime2) / 2)}ms`);
    console.log(`   💾 Объем анализируемых данных: ~${(HIGH_QUALITY_EMAIL.html_content.length + LOW_QUALITY_EMAIL.html_content.length) / 1024}KB`);

  } catch (error) {
    console.error('❌ Ошибка в ML-анализе:', error);
    throw error;
  }
}

/**
 * Демонстрация категориального анализа
 */
async function demonstrateCategoricalAnalysis(): Promise<void> {
  console.log('\n🔬 ДЕТАЛЬНЫЙ КАТЕГОРИАЛЬНЫЙ АНАЛИЗ');
  console.log('=' .repeat(40));

  try {
    const report = await MLQualityScorer.analyzeQuality(HIGH_QUALITY_EMAIL);

    // Контентный анализ
    console.log('\n📝 КОНТЕНТНЫЙ АНАЛИЗ:');
    console.log(`   📖 Читаемость: ${report.content_analysis.readability_score.toFixed(1)}/100`);
    console.log(`   😊 Настроение: ${report.content_analysis.sentiment_score.toFixed(1)}/100`);
    console.log(`   🎯 Потенциал вовлечения: ${report.content_analysis.engagement_potential.toFixed(1)}/100`);
    console.log(`   🏢 Соответствие бренду: ${report.content_analysis.brand_alignment.toFixed(1)}/100`);
    console.log(`   📢 Эффективность CTA: ${report.content_analysis.call_to_action_effectiveness.toFixed(1)}/100`);
    console.log(`   ✍️ Качество языка: ${report.content_analysis.language_quality.toFixed(1)}/100`);

    // Дизайн-анализ
    console.log('\n🎨 ДИЗАЙН-АНАЛИЗ:');
    console.log(`   📊 Визуальная иерархия: ${report.design_analysis.visual_hierarchy.toFixed(1)}/100`);
    console.log(`   🌈 Цветовая гармония: ${report.design_analysis.color_harmony.toFixed(1)}/100`);
    console.log(`   🔤 Типографическая согласованность: ${report.design_analysis.typography_consistency.toFixed(1)}/100`);
    console.log(`   ⚖️ Баланс макета: ${report.design_analysis.layout_balance.toFixed(1)}/100`);
    console.log(`   📱 Качество адаптивного дизайна: ${report.design_analysis.responsive_design_quality.toFixed(1)}/100`);
    console.log(`   🎭 Соответствие бренду: ${report.design_analysis.brand_consistency.toFixed(1)}/100`);

    // Технический анализ
    console.log('\n⚙️ ТЕХНИЧЕСКИЙ АНАЛИЗ:');
    console.log(`   ✅ Валидность HTML: ${report.technical_analysis.html_validity.toFixed(1)}/100`);
    console.log(`   📧 Совместимость с email-клиентами: ${report.technical_analysis.email_client_compatibility.toFixed(1)}/100`);
    console.log(`   ♿ Соответствие доступности: ${report.technical_analysis.accessibility_compliance.toFixed(1)}/100`);
    console.log(`   🔄 Согласованность рендеринга: ${report.technical_analysis.rendering_consistency.toFixed(1)}/100`);
    console.log(`   💻 Качество кода: ${report.technical_analysis.code_quality.toFixed(1)}/100`);
    console.log(`   📋 Соответствие стандартам: ${report.technical_analysis.standards_compliance.toFixed(1)}/100`);

    // Анализ производительности
    console.log('\n⚡ АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ:');
    console.log(`   📦 Оптимизация размера файла: ${report.performance_analysis.file_size_optimization.toFixed(1)}/100`);
    console.log(`   ⏱️ Оценка времени загрузки: ${report.performance_analysis.load_time_estimate.toFixed(1)}/100`);
    console.log(`   🖼️ Оптимизация изображений: ${report.performance_analysis.image_optimization.toFixed(1)}/100`);
    console.log(`   🎨 Эффективность CSS: ${report.performance_analysis.css_efficiency.toFixed(1)}/100`);
    console.log(`   📱 Производительность на мобильных: ${report.performance_analysis.mobile_performance.toFixed(1)}/100`);
    console.log(`   📬 Оценка доставляемости: ${report.performance_analysis.delivery_score.toFixed(1)}/100`);

  } catch (error) {
    console.error('❌ Ошибка в категориальном анализе:', error);
  }
}

/**
 * Бенчмарк производительности
 */
async function performanceBenchmark(): Promise<void> {
  console.log('\n🏁 БЕНЧМАРК ПРОИЗВОДИТЕЛЬНОСТИ ML-SCORING');
  console.log('=' .repeat(45));

  const iterations = 100;
  const results: number[] = [];

  try {
    console.log(`\n🚀 Выполнение ${iterations} итераций анализа...`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await MLQualityScorer.analyzeQuality(HIGH_QUALITY_EMAIL);
      const executionTime = Date.now() - startTime;
      results.push(executionTime);
      
      if ((i + 1) % 20 === 0) {
        console.log(`   📊 Прогресс: ${i + 1}/${iterations} (${Math.round((i + 1) / iterations * 100)}%)`);
      }
    }

    // Статистический анализ
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
    const minTime = Math.min(...results);
    const maxTime = Math.max(...results);
    const medianTime = results.sort((a, b) => a - b)[Math.floor(results.length / 2)];

    console.log('\n📈 РЕЗУЛЬТАТЫ БЕНЧМАРКА:');
    console.log(`   ⏱️ Среднее время: ${avgTime.toFixed(2)}ms`);
    console.log(`   ⚡ Минимальное время: ${minTime}ms`);
    console.log(`   🐌 Максимальное время: ${maxTime}ms`);
    console.log(`   📊 Медианное время: ${medianTime}ms`);
    console.log(`   🚀 Анализов в секунду: ${(1000 / avgTime).toFixed(0)}`);
    console.log(`   💪 Производительность: ${results.length === iterations ? '100%' : 'Частичная'} успешность`);

    // Анализ стабильности
    const variance = results.reduce((acc, val) => acc + Math.pow(val - avgTime, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    const stability = ((avgTime - stdDev) / avgTime) * 100;

    console.log(`   📊 Стандартное отклонение: ${stdDev.toFixed(2)}ms`);
    console.log(`   ⚖️ Стабильность: ${stability.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Ошибка в бенчмарке:', error);
  }
}

/**
 * Основная функция демонстрации
 */
async function main(): Promise<void> {
  try {
    await demonstrateMLAnalysis();
    await demonstrateCategoricalAnalysis();
    await performanceBenchmark();
    
    console.log('\n🎉 ВСЕ ДЕМОНСТРАЦИИ ML-SCORING ЗАВЕРШЕНЫ УСПЕШНО!');
    console.log('🚀 ML-система готова к интеграции в production workflow!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка в демонстрации:', error);
    process.exit(1);
  }
}

// Запуск демонстрации
if (require.main === module) {
  main();
}

export { demonstrateMLAnalysis, demonstrateCategoricalAnalysis, performanceBenchmark }; 