// Import only what we need to break circular dependency
import { handleToolErrorUnified } from '../core/error-handler';
import { logger } from '../core/logger';
import { recordToolUsage, tracedAsync } from '../utils/tracing-utils';

// Import file path constants (commented out - unused)
// import { 
//   EmailFilePaths
// } from '../../shared/constants/file-paths';

// Import EmailFolder type
import { EmailFolder } from './email-renderer/types/email-renderer-types';

// Define types locally to avoid circular import
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

interface ContentInfo {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
}

// Local error handling function
function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
}

/**
 * 📁 PROGRESSIVE FILE SAVER
 * 
 * Implements progressive file saving scheme for email generation pipeline:
 * - STAGE 1: Save MJML after AI generation with "AI_answer" tag
 * - STAGE 2: Save MJML after technical modifications locally  
 * - STAGE 3: Save HTML after MJML to HTML conversion
 */

import { promises as fs } from 'fs';
import * as path from 'path';
// Using CAMPAIGN_STRUCTURE already imported above

export class ProgressiveFileSaver {
  // private _campaignId: string;
  private basePath: string;

  constructor(campaignId: string) {
    // this._campaignId = campaignId;
    this.basePath = path.resolve(process.cwd(), 'mails', campaignId);
  }

  /**
   * STAGE 1: Save AI-generated MJML immediately after creation
   */
  async saveAiGeneratedMjml(mjmlContent: string, tag: string = 'ai_answer'): Promise<void> {
    try {
      const fileName = `email-ai-${tag}.mjml`;
      const filePath = path.join(this.basePath, fileName);
      
      // Ensure directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Save MJML with AI tag
      await fs.writeFile(filePath, mjmlContent, 'utf8');
      
      console.log(`✅ STAGE 1: AI MJML saved to ${fileName} (${mjmlContent.length} chars)`);
      
      // Update metadata
      await this.updateStageMetadata('stage1_ai_mjml', {
        file_name: fileName,
        size_chars: mjmlContent.length,
        saved_at: new Date().toISOString(),
        tag: tag
      });
      
    } catch (error) {
      console.error('❌ STAGE 1: Failed to save AI-generated MJML:', error);
      throw error;
    }
  }

  /**
   * STAGE 2: Save MJML after technical modifications
   */
  async saveTechnicalMjml(mjmlContent: string): Promise<void> {
    try {
      const fileName = 'email.mjml';
      const filePath = path.join(this.basePath, fileName);
      
      // Ensure directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Save final MJML
      await fs.writeFile(filePath, mjmlContent, 'utf8');
      
      console.log(`✅ STAGE 2: Technical MJML saved to ${fileName} (${mjmlContent.length} chars)`);
      
      // Update metadata
      await this.updateStageMetadata('stage2_technical_mjml', {
        file_name: fileName,
        size_chars: mjmlContent.length,
        saved_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ STAGE 2: Failed to save technical MJML:', error);
      throw error;
    }
  }

  /**
   * STAGE 3: Save HTML after MJML to HTML conversion
   */
  async saveFinalHtml(htmlContent: string): Promise<void> {
    try {
      const fileName = 'email.html';
      const filePath = path.join(this.basePath, fileName);
      
      // Ensure directory exists
      await fs.mkdir(this.basePath, { recursive: true });
      
      // Save final HTML
      await fs.writeFile(filePath, htmlContent, 'utf8');
      
      console.log(`✅ STAGE 3: Final HTML saved to ${fileName} (${htmlContent.length} chars)`);
      
      // Update metadata
      await this.updateStageMetadata('stage3_final_html', {
        file_name: fileName,
        size_chars: htmlContent.length,
        saved_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ STAGE 3: Failed to save final HTML:', error);
      throw error;
    }
  }

  /**
   * Check which stages have been completed
   */
  async checkSavedStages(): Promise<{
    stage1_ai_mjml: boolean;
    stage2_technical_mjml: boolean;
    stage3_final_html: boolean;
    details: any;
  }> {
    try {
      const metadataPath = path.join(this.basePath, 'progressive-saving.json');
      
      let metadata = {};
      try {
        const content = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(content);
      } catch {
        // File doesn't exist yet
      }
      
      return {
        stage1_ai_mjml: !!(metadata as any).stage1_ai_mjml,
        stage2_technical_mjml: !!(metadata as any).stage2_technical_mjml,
        stage3_final_html: !!(metadata as any).stage3_final_html,
        details: metadata
      };
      
    } catch (error) {
      console.error('❌ Failed to check saved stages:', error);
      return {
        stage1_ai_mjml: false,
        stage2_technical_mjml: false,
        stage3_final_html: false,
        details: {}
      };
    }
  }

  /**
   * Update metadata for progressive saving stages
   */
  private async updateStageMetadata(stage: string, data: any): Promise<void> {
    try {
      const metadataPath = path.join(this.basePath, 'progressive-saving.json');
      
      let metadata = {};
      try {
        const content = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(content);
      } catch {
        // File doesn't exist yet, start with empty metadata
      }
      
      (metadata as any)[stage] = data;
      (metadata as any).last_updated = new Date().toISOString();
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      
    } catch (error) {
      console.warn(`⚠️ Failed to update stage metadata for ${stage}:`, error);
    }
  }
}

/**
 * Экспорт типов для использования в других файлах
 */
export interface ProgressiveFileSaverOptions {
  campaignId: string;
  stage: 'ai_generated' | 'technical' | 'final';
  content: string;
  tag?: string;
}

export default ProgressiveFileSaver;


interface MjmlParams {
  content: ContentInfo;
  assets: MjmlAssetInfo;
  identica_assets?: {
    selected_assets: Array<{
      fileName: string;
      filePath: string;
      tags: string[];
      description: string;
    }>;
  };
  emailFolder?: EmailFolder;
  mjmlContent?: string; // Предварительно сгенерированный MJML контент
}

interface MjmlAssetInfo {
  paths?: string[]; // Array of valid file paths (strings only)
  metadata?: Record<string, any>;
}

interface MjmlResult {
  html: string; // Сокращенная версия для агента
  size_kb: number;
  mjml_source: string; // Сокращенная версия для агента
  full_html_saved?: boolean; // Индикатор что полный HTML сохранен
  html_length?: number; // Полная длина HTML
  mjml_length?: number; // Полная длина MJML
  progressive_saves?: {
    ai_mjml_saved: boolean;
    technical_mjml_saved: boolean;
    final_html_saved: boolean;
  };
}

/**
 * T4: Render MJML Tool with Progressive File Saving
 * Render email using MJML template with content and assets
 */
export async function renderMjml(params: MjmlParams): Promise<ToolResult> {
  return await tracedAsync({
    toolName: 'render-mjml',
    operation: 'compile',
    params
  }, async () => {
    try {
      console.log('T4: Rendering MJML template with Progressive File Saving');
      console.log('🔍 T4: Input params validation:', {
        hasContent: !!params.content,
        hasAssets: !!params.assets,
        hasEmailFolder: !!params.emailFolder,
        contentType: typeof params.content,
        assetsType: typeof params.assets
      });

      // Add tracing
      const { logger } = await import('../core/logger');
      const traceId = `render_mjml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.startTrace(traceId, {
        tool: 'render_mjml',
        hasContent: !!params.content,
        hasAssets: !!params.assets,
        hasEmailFolder: !!params.emailFolder,
        assetsCount: params.assets?.paths?.length || 0
      });

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'validate_parameters',
      params: {
        contentType: typeof params.content,
        assetsType: typeof params.assets,
        hasEmailFolder: !!params.emailFolder
      }
    });

    // Validate parameters with proper null checks
    if (!params.content) {
      throw new Error('Content is required');
    }
    
    if (!params.assets) {
      // Provide default assets structure if missing
      params.assets = {
        paths: [],
        metadata: {},
      };
    }
    
    // Ensure assets.paths exists and is an array with valid string values
    if (!params.assets.paths) {
      params.assets.paths = [];
    } else if (Array.isArray(params.assets.paths)) {
      // Filter out undefined, null, or non-string values
      const originalLength = params.assets.paths.length;
      params.assets.paths = params.assets.paths.filter(path => 
        path && typeof path === 'string' && path.trim().length > 0
      );
      console.log('🔍 T4: Filtered asset paths:', {
        originalLength,
        filteredLength: params.assets.paths.length,
        removedCount: originalLength - params.assets.paths.length,
        validPaths: params.assets.paths
      });
    }

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'parameters_validated',
      result: { valid: true, assetsCount: params.assets.paths.length }
    });

    // 🚫 FAIL-FAST: MJML content is required
    if (!params.mjmlContent) {
      throw new Error('MJML content is required - no fallback templates available');
    }
    
    console.log('🔄 T4: Using provided MJML content for progressive saving...');
    const renderedMjml = params.mjmlContent;
    
    // 📁 STEP 1: Получить campaignId для Progressive File Saver
    let campaignId: string | null = null;
    
    // Попробовать получить из campaign state
    try {
      const { campaignState } = await import('../core/campaign-state');
      const currentEmailFolder = campaignState.getCurrentEmailFolder();
      if (currentEmailFolder?.campaignId) {
        campaignId = currentEmailFolder.campaignId;
        console.log('✅ T4: Campaign ID получен из campaign state:', campaignId);
      }
    } catch (error) {
      console.warn('⚠️ T4: Campaign state недоступен:', error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error));
    }
    
    // Alternative: get from emailFolder parameter
    if (!campaignId && params.emailFolder) {
      if (typeof params.emailFolder === 'string') {
        campaignId = params.emailFolder;
      } else if (typeof params.emailFolder === 'object' && params.emailFolder.campaignId) {
        campaignId = params.emailFolder.campaignId;
      }
      console.log('✅ T4: Campaign ID получен из emailFolder parameter:', campaignId);
    }
    
    // FAIL-FAST: Не можем продолжить без campaignId
    if (!campaignId) {
      throw new Error('Campaign ID is required for progressive file saving - no campaign context available');
    }
    
    // 📁 STEP 2: Инициализировать Progressive File Saver
    const progressiveSaver = new ProgressiveFileSaver(campaignId);
    
    // 📁 STEP 2.1: Сохранить Technical MJML (после возможных правок)
    console.log('💾 T4: STAGE 2 - Saving Technical MJML...');
    await progressiveSaver.saveTechnicalMjml(renderedMjml);
    const technicalMjmlSaved = true;
    
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'save_technical_mjml',
      result: { success: technicalMjmlSaved, campaignId }
    });
    
    // Compile MJML to HTML
    console.log('🔄 T4: Starting MJML compilation...');
    console.log('🔍 T4: MJML content preview:', renderedMjml.substring(0, 500) + '...');
    
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'compile_mjml_to_html',
      params: { mjmlLength: renderedMjml.length }
    });
    
    let html: string;
    try {
      const compileStartTime = Date.now();
      html = await compileMjmlToHtml(renderedMjml);
      const compileDuration = Date.now() - compileStartTime;
      
      console.log('✅ T4: MJML compilation completed, HTML length:', html.length);
      
      logger.addTraceStep(traceId, {
        tool: 'render_mjml',
        action: 'mjml_compiled',
        result: { htmlLength: html.length },
        duration: compileDuration
      });
    } catch (compilationError) {
      console.error('❌ T4: MJML compilation failed:', compilationError);
      
      logger.addTraceStep(traceId, {
        tool: 'render_mjml',
        action: 'mjml_compilation_failed',
        error: compilationError instanceof Error ? compilationError.message : String(compilationError)
      });
      
      await logger.endTrace(traceId, undefined, compilationError);
      throw new Error(`MJML compilation failed: ${compilationError instanceof Error ? compilationError.message : String(compilationError)}`);
    }
    
    // 📁 STEP 3: Сохранить Final HTML после конвертации
    console.log('💾 T4: STAGE 3 - Saving Final HTML...');
    await progressiveSaver.saveFinalHtml(html);
    const finalHtmlSaved = true;
    
    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'save_final_html',
      result: { success: finalHtmlSaved, htmlLength: html.length }
    });
    
    // Calculate size
    const sizeKb = Buffer.byteLength(html, 'utf8') / 1024;
    
    if (sizeKb > 100) {
      console.warn(`Email size ${sizeKb.toFixed(1)}KB exceeds 100KB limit`);
    }

    // 📁 STEP 4: Проверить состояние всех сохранений
    const savedStages = await progressiveSaver.checkSavedStages();
    
    console.log('📊 T4: Progressive File Saving Summary:', {
      campaign_id: campaignId,
      technical_mjml_saved: technicalMjmlSaved,
      final_html_saved: finalHtmlSaved,
      stages_check: savedStages,
      all_stages_completed: savedStages.stage2_technical_mjml && savedStages.stage3_final_html
    });

    // Агрессивная оптимизация: возвращаем минимум данных агенту
    const htmlPreview = html.substring(0, 200) + '...[truncated]';
    const mjmlPreview = renderedMjml.substring(0, 150) + '...[truncated]';
    
    const result: MjmlResult = {
      html: htmlPreview, // Сокращенная версия для агента
      size_kb: Math.round(sizeKb * 10) / 10,
      mjml_source: mjmlPreview, // Сокращенная версия для агента
      full_html_saved: finalHtmlSaved,
      html_length: html.length,
      mjml_length: renderedMjml.length,
      progressive_saves: {
        ai_mjml_saved: savedStages.stage1_ai_mjml,
        technical_mjml_saved: savedStages.stage2_technical_mjml,
        final_html_saved: savedStages.stage3_final_html
      }
    };

    console.log('✅ T4: MJML rendering completed with Progressive File Saving:', {
      htmlLength: html.length,
      sizeKb: result.size_kb,
      mjmlLength: renderedMjml.length,
      hasValidHtml: html.includes('<html>') && html.includes('</html>'),
      progressive_saves_summary: result.progressive_saves
    });

    console.log(`🔄 T4: Response optimization: HTML ${html.length}→${htmlPreview.length} chars (${Math.round((1-htmlPreview.length/html.length)*100)}% reduction)`);
    console.log(`💾 T4: Progressive saves completed: ${JSON.stringify(result.progressive_saves)}`);

    logger.addTraceStep(traceId, {
      tool: 'render_mjml',
      action: 'create_result',
      result: {
        htmlLength: html.length,
        sizeKb: result.size_kb,
        mjmlLength: renderedMjml.length,
        progressive_saves: result.progressive_saves
      }
    });

    const finalResult = {
      success: true,
      data: result,
      metadata: {
        size_status: sizeKb <= 100 ? 'pass' : 'fail',
        template_source: 'ai-generated-progressive',
        assets_count: (params.assets.paths || []).length,
        campaign_id: campaignId,
        progressive_saving_enabled: true,
        saved_stages: result.progressive_saves,
        timestamp: new Date().toISOString()
      }
    };

    // Record tracing statistics
    recordToolUsage({
      tool: 'render-mjml',
      operation: 'compile',
      duration: Date.now() - Date.now(), // Will be calculated by withToolTrace
      success: true
    });

    await logger.endTrace(traceId, finalResult);
    return finalResult;

    } catch (error) {
      // Error will be automatically traced by OpenAI Agents SDK
      console.error('❌ MJML rendering failed:', error);
      
      // Record error statistics
      recordToolUsage({
        tool: 'render-mjml',
        operation: 'compile',
        duration: Date.now() - Date.now(), // Will be calculated by withToolTrace
        success: false,
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : 'Unknown error'
      });
      
      return handleToolError('render_mjml', error);
    }
  }).then(traceResult => traceResult.data || traceResult);
}

/**
 * Enhanced MJML Generator with Progressive File Saving
 * Генерирует MJML с поэтапным сохранением на этапе ИИ генерации
 */
export async function generateMjmlWithProgressiveSaving(
  mjmlContent: string, 
  campaignId: string,
  stage: 'AI_answer' = 'AI_answer'
): Promise<{ mjmlContent: string; aiSaveSuccess: boolean }> {
  try {
    console.log(`🤖 Generating MJML with Progressive Saving - Stage: ${stage}`);
    
    // 📁 STEP 1: Сохранить AI-сгенерированный MJML
    const progressiveSaver = new ProgressiveFileSaver(campaignId);
    await progressiveSaver.saveAiGeneratedMjml(mjmlContent, stage);
    const aiSaveSuccess = true;
    
    console.log(`✅ Progressive MJML Generation completed:`, {
      stage,
      campaign_id: campaignId,
      mjml_length: mjmlContent.length,
      ai_save_success: aiSaveSuccess
    });
    
    return {
      mjmlContent,
      aiSaveSuccess
    };
  } catch (error) {
    console.error('❌ Progressive MJML Generation failed:', error);
    throw new Error(`Progressive MJML generation failed: ${error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error)}`);
  }
}





/*
async function _convertImageToDataUrl(imagePath: string): Promise<string> { // Currently unused
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Validate imagePath parameter
    if (!imagePath || typeof imagePath !== 'string') {
      throw new Error(`Invalid image path: ${imagePath}`);
    }
    
    // Check if file exists
    await fs.access(imagePath);
    
    // Read image file
    const imageBuffer = await fs.readFile(imagePath);
    
    // Determine MIME type based on file extension - строгая валидация без fallback
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType: string;
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      default:
        console.error(`❌ MJML: Неподдерживаемое расширение файла: ${ext} для ${imagePath}`);
        throw new Error(`Неподдерживаемый формат изображения: ${ext}. Поддерживаются: .jpg, .jpeg, .png, .svg, .gif`);
    }
    
    // Convert to base64 data URL
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error(`Failed to convert image to data URL: ${imagePath}`, error);
    throw new Error(`Image conversion failed: ${error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error)}`);
  }
}
*/

async function compileMjmlToHtml(mjmlContent: string): Promise<string> {
  try {
    // Use dynamic import with proper error handling for Next.js
    const mjml = await import('mjml');
    
    if (typeof mjml.default !== 'function') {
      throw new Error('MJML compiler function not found');
    }
    
    const result = mjml.default(mjmlContent, {
      minify: false,
      // Removed deprecated 'beautify' option
      validationLevel: 'soft'
    });
    
    if (result.errors && result.errors.length > 0) {
      console.warn('MJML compilation warnings:', result.errors);
    }
    
    return result.html;
  } catch (error) {
    console.error('MJML compilation error:', error);
    throw new Error(`MJML compiler not available: ${error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error)}. Please install mjml package.`);
  }
} 