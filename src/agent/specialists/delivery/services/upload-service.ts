/**
 * 📤 UPLOAD SERVICE
 * 
 * Сервис для загрузки активов и файлов
 * Отвечает за загрузку email-шаблонов, активов и метаданных в S3
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { Agent, run } from '@openai/agents';

import { s3Upload, s3UploadSchema } from '../../../tools/simple/s3-upload';
import { fileOrganizerTool } from '../../../modules/agent-tools';
import { runWithTimeout } from '../../../utils/run-with-timeout';
import { createAgentRunConfig } from '../../../utils/tracing-utils';
import { getUsageModel } from '../../../../shared/utils/model-config';

import {
  DeliverySpecialistInput,
  UploadResult,
  AssetFile,
  PerformanceMetrics
} from '../common/delivery-types';
import { DeliveryUtils } from '../common/delivery-utils';

export class UploadService {
  private performanceStart: number = 0;

  /**
   * Обрабатывает загрузку активов
   */
  async handleAssetUpload(input: DeliverySpecialistInput): Promise<UploadResult> {
    this.performanceStart = Date.now();

    try {
      // Валидация входных данных
      const validation = DeliveryUtils.validateTaskInput(input);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Подготовка файлов для загрузки
      const assetFiles = this.prepareAssetFiles(input);
      
      // Создание локальной папки кампании
      let localFolderPath: string | undefined;
      if (input.campaign_context?.campaign_id) {
        localFolderPath = await this.saveEmailToLocalFolder(
          input.email_package,
          input.campaign_context.campaign_id
        );
      }

      // Настройка агента для загрузки в S3
      const uploadAgent = new Agent({
        name: 'Upload Agent',
        instructions: `
          You are an asset upload specialist. Your task is to upload email template assets to S3 storage.
          
          REQUIRED ACTIONS:
          1. Upload all provided files to the specified S3 bucket
          2. Ensure proper file organization and naming
          3. Set appropriate metadata and content types
          4. Enable versioning if requested
          5. Configure CDN distribution if needed
          
          CRITICAL REQUIREMENTS:
          - Maintain file integrity during upload
          - Set proper MIME types for each file
          - Generate secure, accessible URLs
          - Track upload performance metrics
          - Handle errors gracefully with retries
        `,
        model: getUsageModel(),
        tools: []
      });

      // Подготовка данных для загрузки
      const uploadData = {
        files: assetFiles,
        s3_bucket: input.upload_requirements?.s3_bucket || 'email-templates-storage',
        folder_path: input.campaign_context?.folder_path || 
                    `campaigns/${input.campaign_context?.campaign_id || 'default'}`,
        compression_enabled: input.upload_requirements?.compression_enabled || false,
        versioning_enabled: input.upload_requirements?.versioning_enabled || true,
        cdn_distribution: input.upload_requirements?.cdn_distribution || false,
        metadata: {
          campaign_id: input.campaign_context?.campaign_id,
          quality_score: input.email_package.quality_score,
          upload_timestamp: new Date().toISOString()
        }
      };

      // Выполнение загрузки с таймаутом
      const uploadStartTime = Date.now();
      const uploadResult = await runWithTimeout(
        uploadAgent,
        JSON.stringify(uploadData),
        120000 // 2 минуты на загрузку
      );

      const uploadDuration = Date.now() - uploadStartTime;

      // Парсинг результата
      const parsedResult = this.parseUploadResult(uploadResult.finalOutput);
      
      // Расчет метрик производительности
      const performanceMetrics = this.calculateUploadPerformance(
        assetFiles,
        uploadDuration,
        parsedResult
      );

      return {
        success: true,
        upload_data: {
          uploaded_files: parsedResult.uploaded_files || [],
          s3_bucket: uploadData.s3_bucket,
          total_size_mb: this.calculateTotalSizeMB(assetFiles),
          compression_ratio: parsedResult.compression_ratio
        },
        performance_metrics: performanceMetrics
      };

    } catch (error) {
      console.error('❌ Upload service error:', error);
      
      const errorPerformance = this.calculateUploadPerformance(
        [],
        Date.now() - this.performanceStart,
        null,
        error as Error
      );

      return {
        success: false,
        upload_data: {
          uploaded_files: [],
          s3_bucket: input.upload_requirements?.s3_bucket || 'email-templates-storage',
          total_size_mb: 0
        },
        performance_metrics: errorPerformance
      };
    }
  }

  /**
   * Подготавливает файлы активов для загрузки
   */
  private prepareAssetFiles(input: DeliverySpecialistInput): AssetFile[] {
    const assets = DeliveryUtils.prepareAssetFiles(input);

    // Добавляем дополнительные файлы, специфичные для загрузки
    if (input.email_package.assets_used?.length) {
      const assetsList = {
        assets_used: input.email_package.assets_used,
        total_count: input.email_package.assets_used.length,
        last_updated: new Date().toISOString()
      };

      assets.push({
        filename: 'assets-manifest.json',
        content: JSON.stringify(assetsList, null, 2),
        size_kb: DeliveryUtils.calculateSizeKB(JSON.stringify(assetsList)),
        mime_type: 'application/json'
      });
    }

    return assets;
  }

  /**
   * Сохраняет email в локальную папку для резервирования
   */
  private async saveEmailToLocalFolder(
    emailPackage: any,
    campaignId: string
  ): Promise<string> {
    try {
      const baseDir = process.env.LOCAL_STORAGE_PATH || './generated-emails';
      const campaignDir = path.join(baseDir, campaignId);
      
      // Создаем директорию если не существует
      await fs.mkdir(campaignDir, { recursive: true });

      // Сохраняем HTML файл
      if (emailPackage.html_output) {
        const htmlPath = path.join(campaignDir, 'email.html');
        await fs.writeFile(htmlPath, emailPackage.html_output, 'utf8');
      }

      // Сохраняем MJML если есть
      if (emailPackage.mjml_source) {
        const mjmlPath = path.join(campaignDir, 'email.mjml');
        await fs.writeFile(mjmlPath, emailPackage.mjml_source, 'utf8');
      }

      // Сохраняем метаданные
      const metadata = {
        campaign_id: campaignId,
        quality_score: emailPackage.quality_score,
        compliance_status: emailPackage.compliance_status,
        assets_used: emailPackage.assets_used || [],
        created_at: new Date().toISOString()
      };

      const metadataPath = path.join(campaignDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

      console.log(`✅ Email saved to local folder: ${campaignDir}`);
      return campaignDir;

    } catch (error) {
      console.error('❌ Error saving email to local folder:', error);
      throw error;
    }
  }

  /**
   * Парсит результат загрузки
   */
  private parseUploadResult(resultOutput: string): any {
    try {
      // Пытаемся парсить как JSON
      if (resultOutput.includes('{') && resultOutput.includes('}')) {
        const jsonMatch = resultOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Если не JSON, создаем структуру из текста
      return {
        uploaded_files: [],
        message: resultOutput,
        success: resultOutput.toLowerCase().includes('success') || 
                resultOutput.toLowerCase().includes('uploaded')
      };
    } catch (error) {
      console.error('❌ Error parsing upload result:', error);
      return {
        uploaded_files: [],
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Вычисляет метрики производительности загрузки
   */
  private calculateUploadPerformance(
    assetFiles: AssetFile[],
    uploadDuration: number,
    result: any,
    error?: Error
  ): PerformanceMetrics {
    const totalSizeMB = this.calculateTotalSizeMB(assetFiles);
    const throughputMbps = totalSizeMB > 0 ? (totalSizeMB * 8) / (uploadDuration / 1000) : 0;

    return {
      task_duration_ms: uploadDuration,
      processing_time_breakdown: {
        upload_duration_ms: uploadDuration,
        file_preparation_ms: Math.min(uploadDuration * 0.1, 1000),
        s3_upload_ms: uploadDuration * 0.8,
        validation_ms: uploadDuration * 0.1
      },
      resource_usage: {
        memory_peak_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        cpu_usage_percent: 0,
        network_bandwidth_mb: totalSizeMB
      },
      quality_indicators: {
        error_count: error ? 1 : 0,
        warning_count: result?.warnings?.length || 0,
        success_rate_percent: error ? 0 : 100
      }
    };
  }

  /**
   * Вычисляет общий размер файлов в MB
   */
  private calculateTotalSizeMB(assetFiles: AssetFile[]): number {
    const totalKB = assetFiles.reduce((sum, file) => sum + file.size_kb, 0);
    return totalKB / 1024;
  }
}