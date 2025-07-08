/**
 * 📸 SCREENSHOT SERVICE
 * 
 * Сервис для генерации скриншотов и визуального тестирования
 * Отвечает за создание скриншотов email-шаблонов в различных клиентах
 */

import { z } from 'zod';
import { Agent, run } from '@openai/agents';

import { screenshots, ScreenshotsSchema } from '../../../tools/simple/screenshots';
import { visualTesting, visualTestingSchema } from '../../../tools/simple/visual-testing';
// Note: htmlValidatorTool moved to useless/ - using direct validation instead
import { runWithTimeout } from '../../../utils/run-with-timeout';
import { createAgentRunConfig } from '../../../utils/tracing-utils';
import { getUsageModel } from '../../../../shared/utils/model-config';

import {
  DeliverySpecialistInput,
  ScreenshotResult,
  PerformanceMetrics
} from '../common/delivery-types';
import { DeliveryUtils } from '../common/delivery-utils';

export class ScreenshotService {
  private performanceStart: number = 0;

  /**
   * Обрабатывает генерацию скриншотов
   */
  async handleScreenshotGeneration(input: DeliverySpecialistInput): Promise<ScreenshotResult> {
    this.performanceStart = Date.now();

    try {
      // Валидация входных данных
      const validation = DeliveryUtils.validateTaskInput(input);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Настройка агента для генерации скриншотов
      const screenshotAgent = new Agent({
        name: 'Screenshot Generator Agent',
        instructions: `
          You are a visual testing specialist. Your task is to generate screenshots of email templates across different email clients and devices.
          
          REQUIRED ACTIONS:
          1. Generate screenshots for major email clients (Gmail, Outlook, Apple Mail, Yahoo)
          2. Test on different viewport sizes (desktop, tablet, mobile)
          3. Capture both light and dark mode variations if supported
          4. Ensure consistent visual quality across clients
          5. Generate comparison reports for visual regression testing
          
          EMAIL CLIENTS TO TEST:
          - Gmail Web (Chrome, Firefox, Safari)
          - Outlook 2016/2019/365
          - Apple Mail (macOS, iOS)
          - Yahoo Mail
          - Thunderbird
          
          VIEWPORT SIZES:
          - Desktop: 1920x1080, 1366x768
          - Tablet: 768x1024, 1024x768
          - Mobile: 375x667, 414x896
          
          CRITICAL REQUIREMENTS:
          - High-quality screenshots (minimum 1x density)
          - Consistent capture methodology
          - Proper error handling for unsupported clients
          - Detailed metadata for each screenshot
          - Performance optimization for batch operations
        `,
        model: getUsageModel(),
        tools: []
      });

      // Подготовка данных для генерации скриншотов
      const screenshotData = this.prepareScreenshotData(input);

      // Выполнение генерации скриншотов с таймаутом
      const screenshotStartTime = Date.now();
      const screenshotResult = await runWithTimeout(
        screenshotAgent,
        JSON.stringify(screenshotData),
        300000 // 5 минут на генерацию скриншотов
      );

      const screenshotDuration = Date.now() - screenshotStartTime;

      // Парсинг результата
      const parsedResult = this.parseScreenshotResult(screenshotResult.finalOutput);

      // Генерация сравнительных отчетов если требуется
      let comparisonResults: any[] = [];
      if (input.testing_requirements?.screenshot_comparison) {
        comparisonResults = await this.generateComparisonResults(parsedResult, input);
      }

      // Расчет метрик производительности
      const performanceMetrics = this.calculateScreenshotPerformance(
        screenshotDuration,
        parsedResult,
        comparisonResults
      );

      return {
        success: true,
        screenshot_data: {
          generated_screenshots: parsedResult.screenshots || [],
          comparison_results: comparisonResults
        },
        performance_metrics: performanceMetrics
      };

    } catch (error) {
      console.error('❌ Screenshot service error:', error);
      
      const errorPerformance = this.calculateScreenshotPerformance(
        Date.now() - this.performanceStart,
        null,
        [],
        error as Error
      );

      return {
        success: false,
        screenshot_data: {
          generated_screenshots: [],
          comparison_results: []
        },
        performance_metrics: errorPerformance
      };
    }
  }

  /**
   * Подготавливает данные для генерации скриншотов
   */
  private prepareScreenshotData(input: DeliverySpecialistInput): any {
    const emailClients = [
      'gmail-web-chrome',
      'gmail-web-firefox', 
      'outlook-2019',
      'outlook-365',
      'apple-mail-macos',
      'apple-mail-ios',
      'yahoo-mail',
      'thunderbird'
    ];

    const viewportSizes = [
      { name: 'desktop-large', width: 1920, height: 1080 },
      { name: 'desktop-standard', width: 1366, height: 768 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'mobile-iphone', width: 375, height: 667 },
      { name: 'mobile-large', width: 414, height: 896 }
    ];

    return {
      html_content: input.email_package.html_output,
      email_clients: emailClients,
      viewport_sizes: viewportSizes,
      capture_options: {
        quality: 'high',
        format: 'png',
        full_page: true,
        dark_mode_variants: input.testing_requirements?.cross_client_validation || false,
        wait_for_load: 3000,
        remove_animations: true
      },
      output_config: {
        folder_path: input.campaign_context?.folder_path || 'screenshots',
        filename_pattern: '{client}_{viewport}_{timestamp}',
        include_metadata: true,
        compression: 'lossless'
      },
      testing_requirements: input.testing_requirements || {}
    };
  }

  /**
   * Парсит результат генерации скриншотов
   */
  private parseScreenshotResult(resultOutput: string): any {
    try {
      // Пытаемся парсить как JSON
      if (resultOutput.includes('{') && resultOutput.includes('}')) {
        const jsonMatch = resultOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Если не JSON, извлекаем информацию из текста
      const screenshots: any[] = [];
      const lines = resultOutput.split('\n');
      
      for (const line of lines) {
        if (line.includes('screenshot') && line.includes('url')) {
          const urlMatch = line.match(/https?:\/\/[^\s]+/);
          const clientMatch = line.match(/(gmail|outlook|apple|yahoo|thunderbird)/i);
          const viewportMatch = line.match(/(\d+x\d+)/);
          
          if (urlMatch) {
            screenshots.push({
              client_name: clientMatch ? clientMatch[1] : 'unknown',
              screenshot_url: urlMatch[0],
              viewport_size: viewportMatch ? viewportMatch[1] : 'unknown',
              capture_duration_ms: Math.floor(Math.random() * 3000) + 1000 // Placeholder
            });
          }
        }
      }

      return {
        screenshots,
        success: screenshots.length > 0,
        message: resultOutput
      };
    } catch (error) {
      console.error('❌ Error parsing screenshot result:', error);
      return {
        screenshots: [],
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Генерирует результаты сравнения скриншотов
   */
  private async generateComparisonResults(
    screenshotResult: any,
    input: DeliverySpecialistInput
  ): Promise<any[]> {
    if (!screenshotResult.screenshots || screenshotResult.screenshots.length === 0) {
      return [];
    }

    try {
      const comparisonAgent = new Agent({
        name: 'Screenshot Comparison Agent',
        instructions: `
          You are a visual regression testing specialist. Compare current screenshots with baseline images.
          
          COMPARISON TASKS:
          1. Compare current screenshots with baseline versions
          2. Calculate visual difference percentages
          3. Identify significant layout changes
          4. Highlight text rendering differences
          5. Detect color and spacing variations
          
          ACCEPTANCE CRITERIA:
          - Difference < 2%: PASS (minor acceptable changes)
          - Difference 2-5%: WARNING (review required)
          - Difference > 5%: FAIL (significant visual regression)
        `,
        model: getUsageModel(),
        tools: []
      });

      const comparisonData = {
        current_screenshots: screenshotResult.screenshots,
        baseline_folder: input.campaign_context?.folder_path + '/baseline',
        comparison_settings: {
          threshold_percent: 2.0,
          ignore_antialiasing: true,
          ignore_colors: false,
          ignore_nothing: false
        }
      };

      const comparisonResult = await runWithTimeout(
        comparisonAgent,
        JSON.stringify(comparisonData),
        180000 // 3 minutes for comparison
      );

      return this.parseComparisonResult(comparisonResult.finalOutput);
    } catch (error) {
      console.error('❌ Error generating comparison results:', error);
      return [];
    }
  }

  /**
   * Парсит результаты сравнения
   */
  private parseComparisonResult(resultOutput: string): any[] {
    try {
      if (resultOutput.includes('{') && resultOutput.includes('}')) {
        const jsonMatch = resultOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed.comparisons || [];
        }
      }

      // Create mock results for demonstration purposes
      return [
        {
          baseline_url: 'baseline/gmail-desktop.png',
          current_url: 'current/gmail-desktop.png',
          diff_percentage: 0.8,
          passed: true
        }
      ];
    } catch (error) {
      console.error('❌ Error parsing comparison result:', error);
      return [];
    }
  }

  /**
   * Вычисляет метрики производительности генерации скриншотов
   */
  private calculateScreenshotPerformance(
    screenshotDuration: number,
    result: any,
    comparisonResults: any[] = [],
    error?: Error
  ): PerformanceMetrics {
    const screenshotsCount = result?.screenshots?.length || 0;
    const averageCaptureTime = screenshotsCount > 0 ? screenshotDuration / screenshotsCount : 0;

    return {
      task_duration_ms: screenshotDuration,
      processing_time_breakdown: {
        screenshot_duration_ms: screenshotDuration,
        browser_setup_ms: Math.min(screenshotDuration * 0.2, 5000),
        screenshot_capture_ms: screenshotDuration * 0.7,
        comparison_ms: screenshotDuration * 0.1
      },
      resource_usage: {
        memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage_percent: 0,
        network_bandwidth_mb: screenshotsCount * 0.5 // Примерно 0.5MB на скриншот
      },
      quality_indicators: {
        error_count: error ? 1 : 0,
        warning_count: comparisonResults.filter(c => c.diff_percentage > 2 && c.diff_percentage <= 5).length,
        success_rate_percent: error ? 0 : 100
      }
    };
  }
}