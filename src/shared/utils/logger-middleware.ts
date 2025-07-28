/**
 * Logger Middleware - Automatic campaign logging helpers for API routes
 */

import { NextResponse } from 'next/server';
import { logToFile } from './campaign-logger';
// import { finalizeCampaignLogging } from './campaign-logger'; // Currently unused

/**
 * Enhanced wrapper for campaign requests with automatic logging
 */
export async function withCampaignLogging<T>(
  requestHandler: () => Promise<T>,
  options: {
    requestId?: string;
    source?: string;
    enableAutoLogging?: boolean;
  } = {}
): Promise<T> {
  const { requestId = `req_${Date.now()}`, source = 'API', enableAutoLogging = true } = options;
  
  try {
    if (enableAutoLogging) {
      console.log(`🚀 === ${source} REQUEST STARTED (${requestId}) ===`);
    }
    
    const result = await requestHandler();
    
    if (enableAutoLogging) {
      console.log(`✅ === ${source} REQUEST COMPLETED (${requestId}) ===`);
    }
    
    return result;
    
  } catch (error) {
    if (enableAutoLogging) {
      console.error(`❌ === ${source} REQUEST FAILED (${requestId}) ===`);
      console.error('Error:', error);
    }
    
    // Try to log error if campaign logging is active
    try {
      logToFile('error', `${source} request failed: ${error instanceof Error ? error.message : String(error)}`, source, requestId);
    } catch (loggingError) {
      console.warn('Failed to log error to campaign:', loggingError);
    }
    
    throw error;
  }
}

/**
 * Wrapper for campaign API responses with logging
 */
export function createCampaignResponse(
  data: any,
  options: {
    status?: number;
    requestId?: string;
    logSummary?: boolean;
  } = {}
): NextResponse {
  const { status = 200, requestId, logSummary = true } = options;
  
  if (logSummary && requestId) {
    try {
      logToFile('info', `API response generated with status ${status}`, 'APIResponse', requestId);
    } catch (loggingError) {
      console.warn('Failed to log API response:', loggingError);
    }
  }
  
  return NextResponse.json(data, { status });
}

/**
 * Extract campaign information from request body
 */
export function extractCampaignInfo(body: any): {
  campaignId?: string;
  topic?: string;
  taskType?: string;
} {
  return {
    campaignId: body.campaignId || body.campaign_id,
    topic: body.input?.topic || body.topic,
    taskType: body.task_type || body.taskType
  };
}

/**
 * Initialize logging if campaign path is available in response
 * ✅ ОТКЛЮЧЕНО: Автоматическая инициализация конфликтует с Orchestrator
 */
export async function initializeLoggingFromResponse(result: any): Promise<void> {
  try {
    // ✅ ИСПРАВЛЕНО: Отключаем автоматическую инициализацию
    // Оркестратор уже инициализирует логирование правильно
    console.log('🔍 Logger Middleware: Skipping auto-initialization (handled by Orchestrator)');
    
    // Look for campaign path in various possible locations in the response
    let campaignPath: string | undefined;
    let campaignId: string | undefined;
    
    if (typeof result === 'object' && result !== null) {
      // Check various possible locations for campaign info
      campaignPath = result.campaignPath || 
                   result.campaign?.path || 
                   result.context?.campaign?.path ||
                   result.data?.campaign?.path;
                   
      campaignId = result.campaignId || 
                  result.campaign?.id || 
                  result.context?.campaign?.id ||
                  result.data?.campaign?.id;
    }
    
    // ✅ ИСПРАВЛЕНО: Только логируем информацию, не инициализируем повторно
    if (campaignPath && campaignId) {
      console.log(`📋 Campaign found: ${campaignId} (path: ${campaignPath}) - logging already initialized by Orchestrator`);
    } else {
      console.log('📋 No campaign info found in response - logging managed by Orchestrator');
    }
    
  } catch (error) {
    console.warn('Failed to check campaign info:', error);
    // Don't throw - this is optional
  }
}

const LoggerMiddleware = {
  withCampaignLogging,
  createCampaignResponse,
  extractCampaignInfo,
  initializeLoggingFromResponse
};

export default LoggerMiddleware; 