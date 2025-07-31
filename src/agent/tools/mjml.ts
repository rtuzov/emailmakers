/**
 * ✅ REFACTORED MJML Tools - Using New Architecture
 * 
 * This file now uses the refactored template-processing domain
 * through backward-compatible adapters
 */

// ✅ NEW: Import refactored MJML adapters for backward compatibility
import { 
  renderMjml as newRenderMjml, 
  generateMjmlWithProgressiveSaving as newGenerateMjmlWithProgressiveSaving 
} from '../../domains/template-processing/adapters/mjml-tool-adapter';

// ===== TYPES (preserved from original) =====

// Import ToolResult from adapter to maintain consistency
import type { ToolResult as AdapterToolResult } from '../../domains/template-processing/adapters/mjml-tool-adapter';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Helper function to convert adapter result to expected format
function convertToolResult(adapterResult: AdapterToolResult): ToolResult {
  const result: ToolResult = {
    success: adapterResult.type === 'success',
    data: adapterResult.data,
    metadata: {}
  };
  
  if (adapterResult.type === 'error') {
    result.error = adapterResult.message;
  }
  
  return result;
}

export interface MjmlParams {
  content: string | any;
  assets: {
    paths: string[];
    metadata: any;
  };
  emailFolder?: string;
  mjmlContent?: string;
}

export interface MjmlResult {
  mjml_content: string;
  html: string;
  campaign_id: string;
  mjml_length?: number;
  progressive_saves?: {
    ai_mjml_saved: boolean;
    technical_mjml_saved: boolean;
    final_html_saved: boolean;
  };
}

/**
 * T4: Render MJML Tool with Progressive File Saving
 * ✅ MIGRATED: Now uses refactored architecture through adapter
 * Render email using MJML template with content and assets
 */
export async function renderMjml(params: MjmlParams): Promise<ToolResult> {
  try {
    // ✅ MIGRATED: Use new refactored architecture through adapter
    console.log('🔄 MJML Tool Migration: Using new refactored architecture...');
    const adapterResult = await newRenderMjml(params);
    return convertToolResult(adapterResult);
  } catch (error) {
    console.error('❌ renderMjml migration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Enhanced MJML Generator with Progressive File Saving
 * ✅ MIGRATED: Now uses refactored architecture through adapter
 * Генерирует MJML с поэтапным сохранением на этапе ИИ генерации
 */
export async function generateMjmlWithProgressiveSaving(
  mjmlContent: string, 
  campaignId: string,
  stage: 'AI_answer' = 'AI_answer'
): Promise<{ mjmlContent: string; aiSaveSuccess: boolean }> {
  try {
    // ✅ MIGRATED: Use new refactored architecture through adapter
    console.log('🔄 MJML Tool Migration: Using new refactored architecture for progressive saving...');
    return await newGenerateMjmlWithProgressiveSaving(mjmlContent, campaignId, stage);
  } catch (error) {
    console.error('❌ generateMjmlWithProgressiveSaving migration error:', error);
    return {
      mjmlContent,
      aiSaveSuccess: false
    };
  }
}

// ===== LEGACY EXPORTS (for backward compatibility) =====

/**
 * ✅ MIGRATION COMPLETE
 * 
 * This file has been successfully refactored to use the new template-processing domain.
 * All functionality is now routed through:
 * 
 * 1. Domain Services:
 *    - MjmlGeneratorService (core MJML generation logic)
 *    - TemplateRendererService (MJML to HTML compilation)
 *    - TemplateValidatorService (validation and quality checks)
 * 
 * 2. Application Services:
 *    - CachedMjmlGenerationService (high-performance with caching)
 * 
 * 3. Adapters:
 *    - MjmlToolAdapter (maintains tool interface compatibility)
 *    - LegacyMjmlAdapter (maintains old function signatures)
 * 
 * Benefits achieved:
 * - ✅ Improved testability through mocked services
 * - ✅ Better performance through caching
 * - ✅ Cleaner architecture following DDD principles
 * - ✅ Maintained backward compatibility
 * - ✅ Enhanced validation and error handling
 */

// Default export for backward compatibility
export default {
  renderMjml,
  generateMjmlWithProgressiveSaving
}; 