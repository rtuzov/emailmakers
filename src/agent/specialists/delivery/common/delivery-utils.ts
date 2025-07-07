/**
 * 🛠️ DELIVERY UTILITIES
 * 
 * Общие утилиты для всех delivery сервисов
 * Используется в upload-service, screenshot-service, deployment-service
 */

import {
  PerformanceMetrics,
  DeliveryArtifacts,
  DeliverySpecialistInput,
  AssetFile
} from './delivery-types';

export class DeliveryUtils {
  /**
   * Вычисляет метрики производительности для задачи
   */
  static calculatePerformance(
    taskType: string,
    result: any,
    startTime: number,
    additionalMetrics?: Record<string, number>
  ): PerformanceMetrics {
    const endTime = Date.now();
    const taskDuration = endTime - startTime;

    // Базовые метрики
    const baseMetrics: PerformanceMetrics = {
      task_duration_ms: taskDuration,
      processing_time_breakdown: {
        [`${taskType}_ms`]: taskDuration,
        ...additionalMetrics
      },
      resource_usage: {
        memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage_percent: 0, // Placeholder - can be enhanced
        network_bandwidth_mb: 0 // Placeholder - can be enhanced
      },
      quality_indicators: {
        error_count: result?.error_count || 0,
        warning_count: result?.warning_count || 0,
        success_rate_percent: result?.success ? 100 : 0
      }
    };

    // Специфичные метрики по типу задачи
    switch (taskType) {
      case 'upload_assets':
        return {
          ...baseMetrics,
          processing_time_breakdown: {
            ...baseMetrics.processing_time_breakdown,
            file_preparation_ms: additionalMetrics?.file_preparation_ms || 0,
            s3_upload_ms: additionalMetrics?.s3_upload_ms || 0,
            validation_ms: additionalMetrics?.validation_ms || 0
          }
        };
        
      case 'generate_screenshots':
        return {
          ...baseMetrics,
          processing_time_breakdown: {
            ...baseMetrics.processing_time_breakdown,
            browser_setup_ms: additionalMetrics?.browser_setup_ms || 0,
            screenshot_capture_ms: additionalMetrics?.screenshot_capture_ms || 0,
            comparison_ms: additionalMetrics?.comparison_ms || 0
          }
        };
        
      case 'deploy_campaign':
        return {
          ...baseMetrics,
          processing_time_breakdown: {
            ...baseMetrics.processing_time_breakdown,
            deployment_preparation_ms: additionalMetrics?.deployment_preparation_ms || 0,
            deployment_execution_ms: additionalMetrics?.deployment_execution_ms || 0,
            monitoring_setup_ms: additionalMetrics?.monitoring_setup_ms || 0
          }
        };
        
      default:
        return baseMetrics;
    }
  }

  /**
   * Строит артефакты доставки на основе результатов
   */
  static buildArtifacts(
    taskType: string,
    primaryResult: any,
    secondaryResult?: any
  ): DeliveryArtifacts {
    const artifacts: DeliveryArtifacts = {};

    switch (taskType) {
      case 'upload_assets':
        if (primaryResult?.upload_data?.uploaded_files) {
          artifacts.asset_urls = primaryResult.upload_data.uploaded_files.map(
            (file: any) => `s3://${primaryResult.upload_data.s3_bucket}/${file.s3_key}`
          );
        }
        break;

      case 'generate_screenshots':
        if (primaryResult?.screenshot_data?.generated_screenshots) {
          artifacts.screenshot_urls = primaryResult.screenshot_data.generated_screenshots.map(
            (screenshot: any) => screenshot.screenshot_url
          );
        }
        break;

      case 'deploy_campaign':
        if (primaryResult?.deployment_data?.deployment_url) {
          artifacts.deployment_urls = [primaryResult.deployment_data.deployment_url];
        }
        if (secondaryResult?.monitoring_data?.monitoring_endpoints) {
          artifacts.monitoring_endpoints = secondaryResult.monitoring_data.monitoring_endpoints;
        }
        break;

      case 'visual_testing':
        if (primaryResult?.testing_data?.test_results) {
          artifacts.screenshot_urls = primaryResult.testing_data.test_results
            .filter((test: any) => test.screenshot_url)
            .map((test: any) => test.screenshot_url);
        }
        break;

      case 'finalize_delivery':
        if (primaryResult?.finalization_data?.backup_locations) {
          artifacts.backup_locations = primaryResult.finalization_data.backup_locations;
        }
        break;
    }

    return artifacts;
  }

  /**
   * Вычисляет размер контента в KB
   */
  static calculateSizeKB(content: string | Buffer): number {
    if (typeof content === 'string') {
      return Buffer.byteLength(content, 'utf8') / 1024;
    }
    return content.length / 1024;
  }

  /**
   * Извлекает список используемых инструментов для задачи
   */
  static extractToolsUsed(taskType: string): string[] {
    const toolMapping: Record<string, string[]> = {
      'upload_assets': ['s3Upload', 'fileOrganizer'],
      'generate_screenshots': ['screenshots', 'visualTesting'],
      'deploy_campaign': ['campaignDeployment', 'deliveryManager'],
      'visual_testing': ['visualTesting', 'htmlValidator'],
      'finalize_delivery': ['fileOrganizer', 'deliveryManager'],
      'monitor_performance': ['deliveryManager']
    };

    return toolMapping[taskType] || [];
  }

  /**
   * Подготавливает файлы активов для загрузки
   */
  static prepareAssetFiles(input: DeliverySpecialistInput): AssetFile[] {
    const assets: AssetFile[] = [];

    // Основной HTML файл
    if (input.email_package.html_output) {
      assets.push({
        filename: 'email.html',
        content: input.email_package.html_output,
        size_kb: this.calculateSizeKB(input.email_package.html_output),
        mime_type: 'text/html'
      });
    }

    // MJML исходник
    if (input.email_package.mjml_source) {
      assets.push({
        filename: 'email.mjml',
        content: input.email_package.mjml_source,
        size_kb: this.calculateSizeKB(input.email_package.mjml_source),
        mime_type: 'text/plain'
      });
    }

    // Метаданные кампании
    const metadata = {
      quality_score: input.email_package.quality_score,
      compliance_status: input.email_package.compliance_status,
      generation_timestamp: new Date().toISOString(),
      assets_used: input.email_package.assets_used || []
    };

    assets.push({
      filename: 'campaign-metadata.json',
      content: JSON.stringify(metadata, null, 2),
      size_kb: this.calculateSizeKB(JSON.stringify(metadata)),
      mime_type: 'application/json'
    });

    return assets;
  }

  /**
   * Обновляет метрики производительности
   */
  static updatePerformanceMetrics(
    existingMetrics: PerformanceMetrics,
    newData: Partial<PerformanceMetrics>
  ): PerformanceMetrics {
    return {
      ...existingMetrics,
      ...newData,
      processing_time_breakdown: {
        ...existingMetrics.processing_time_breakdown,
        ...newData.processing_time_breakdown
      },
      resource_usage: {
        ...existingMetrics.resource_usage,
        ...newData.resource_usage
      },
      quality_indicators: {
        ...existingMetrics.quality_indicators,
        ...newData.quality_indicators
      }
    };
  }

  /**
   * Создает уникальный ID для кампании или задачи
   */
  static generateId(prefix: string = 'delivery'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Форматирует timestamp для логирования
   */
  static formatTimestamp(date: Date = new Date()): string {
    return date.toISOString();
  }

  /**
   * Валидирует входные данные задачи
   */
  static validateTaskInput(input: DeliverySpecialistInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.task_type) {
      errors.push('task_type is required');
    }

    if (!input.email_package) {
      errors.push('email_package is required');
    } else {
      if (!input.email_package.html_output) {
        errors.push('email_package.html_output is required');
      }
      if (typeof input.email_package.quality_score !== 'number') {
        errors.push('email_package.quality_score must be a number');
      }
    }

    // Специфичная валидация по типу задачи
    switch (input.task_type) {
      case 'upload_assets':
        if (!input.upload_requirements) {
          errors.push('upload_requirements is required for upload_assets task');
        }
        break;
        
      case 'deploy_campaign':
        if (!input.deployment_config) {
          errors.push('deployment_config is required for deploy_campaign task');
        }
        break;
        
      case 'generate_screenshots':
      case 'visual_testing':
        if (!input.testing_requirements) {
          errors.push('testing_requirements is required for screenshot/testing tasks');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}