/**
 * 📁 CAMPAIGN MANAGER - Consolidated Tool
 * 
 * Консолидирует функциональность:
 * - initialize_email_folder (создание структуры кампании)
 * - load_email_folder (загрузка существующей кампании)
 * - performance_monitor (мониторинг производительности)
 * 
 * Единый интерфейс для управления жизненным циклом email кампаний
 */

import { z } from 'zod';
import { initializeEmailFolder, loadEmailFolder } from '../email-folder-initializer';
import { performanceMonitor } from '../performance-monitor';

// Unified schema for all campaign management operations
export const campaignManagerSchema = z.object({
  action: z.enum(['initialize', 'load', 'monitor', 'finalize', 'get_stats']).describe('Campaign management action'),
  
  // For initialize action
  topic: z.string().optional().nullable().describe('Email campaign topic (required for initialize)'),
  campaign_type: z.enum(['urgent', 'newsletter', 'seasonal', 'promotional', 'informational']).optional().nullable().describe('Type of email campaign'),
  
  // For load action
  campaign_id: z.string().optional().nullable().describe('Campaign ID to load (required for load)'),
  
  // For monitor action
  performance_action: z.enum(['start_session', 'log_tool', 'end_session', 'get_report']).optional().nullable().describe('Performance monitoring action'),
  session_id: z.string().optional().nullable().describe('Performance session ID'),
  tool_name: z.string().optional().nullable().describe('Name of tool being monitored'),
  start_time: z.number().optional().nullable().describe('Tool start timestamp'),
  end_time: z.number().optional().nullable().describe('Tool end timestamp'),
  success: z.boolean().optional().nullable().describe('Whether tool execution was successful'),
  error_message: z.string().optional().nullable().describe('Error message if tool failed'),
  metadata: z.object({}).passthrough().optional().nullable().describe('Additional metadata'),
  
  // For finalize action
  final_results: z.object({}).optional().nullable().describe('Final campaign results for archiving'),
  
  // Common options
  trace_id: z.string().optional().nullable().describe('Trace ID for cross-system tracking'),
  include_analytics: z.boolean().default(true).describe('Include performance analytics in response')
});

export type CampaignManagerParams = z.infer<typeof campaignManagerSchema>;

interface CampaignManagerResult {
  success: boolean;
  action: string;
  data?: any;
  analytics?: any;
  error?: string;
  campaign_info?: {
    campaign_id: string;
    folder_path: string;
    assets_path: string;
    created_at?: string;
    status?: string;
  };
  performance_metrics?: {
    session_id?: string;
    total_tools_executed?: number;
    average_execution_time?: number;
    error_rate?: number;
    current_session_duration?: number;
  };
}

/**
 * Campaign Manager - Unified campaign lifecycle management
 */
export async function campaignManager(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  const startTime = Date.now();
  
  try {
    console.log(`📁 Campaign Manager: Executing action "${params.action}"`);
    
    switch (params.action) {
      case 'initialize':
        return await handleInitialize(params);
        
      case 'load':
        return await handleLoad(params);
        
      case 'monitor':
        return await handleMonitor(params);
        
      case 'finalize':
        return await handleFinalize(params);
        
      case 'get_stats':
        return await handleGetStats(params);
        
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
    
  } catch (error) {
    console.error('❌ Campaign Manager error:', error);
    
    return {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
      analytics: params.include_analytics ? {
        execution_time: Date.now() - startTime,
        error_type: 'campaign_manager_error'
      } : undefined
    };
  }
}

/**
 * Handle campaign initialization
 */
async function handleInitialize(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  if (!params.topic) {
    throw new Error('Topic is required for campaign initialization');
  }
  
  console.log(`🚀 Initializing campaign: "${params.topic}"`);
  
  // Use trace_id from environment if available, otherwise generate
  const traceId = params.trace_id || process.env.OPENAI_TRACE_ID || `trace_${Date.now()}`;
  
  // Initialize email folder with enhanced parameters
  const folderResult = await initializeEmailFolder({
    topic: params.topic,
    campaign_type: params.campaign_type || 'promotional'
  });
  
  if (!folderResult.success) {
    throw new Error(`Failed to initialize campaign folder: ${folderResult.error}`);
  }
  
  // Start performance monitoring session for this campaign
  let performanceSession = null;
  if (params.include_analytics) {
    try {
      performanceSession = await performanceMonitor({
        action: 'start_session',
        session_id: `campaign_${folderResult.data.campaignId}`,
        metadata: {
          campaign_id: folderResult.data.campaignId,
          topic: params.topic,
          campaign_type: params.campaign_type || 'promotional',
          trace_id: traceId,
          initialized_at: new Date().toISOString()
        }
      });
    } catch (perfError) {
      console.warn('⚠️ Performance monitoring initialization failed:', perfError);
    }
  }
  
  console.log(`✅ Campaign initialized successfully: ${folderResult.data.campaignId}`);
  
  return {
    success: true,
    action: 'initialize',
    data: folderResult.data,
    campaign_info: {
      campaign_id: folderResult.data.campaignId,
      folder_path: folderResult.data.folderPath,
      assets_path: folderResult.data.assetsPath,
      created_at: new Date().toISOString(),
      status: 'initialized'
    },
    performance_metrics: performanceSession?.success ? {
      session_id: performanceSession.data?.session_id
    } : undefined,
    analytics: params.include_analytics ? {
      initialization_time: Date.now() - Date.now(),
      trace_id: traceId
    } : undefined
  };
}

/**
 * Handle campaign loading
 */
async function handleLoad(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  if (!params.campaign_id) {
    throw new Error('Campaign ID is required for loading');
  }
  
  console.log(`📂 Loading campaign: ${params.campaign_id}`);
  
  const loadResult = await loadEmailFolder({
    campaignId: params.campaign_id
  });
  
  if (!loadResult.success) {
    throw new Error(`Failed to load campaign: ${loadResult.error}`);
  }
  
  console.log(`✅ Campaign loaded successfully: ${params.campaign_id}`);
  
  return {
    success: true,
    action: 'load',
    data: loadResult.data,
    campaign_info: {
      campaign_id: params.campaign_id,
      folder_path: loadResult.data.folderPath,
      assets_path: loadResult.data.assetsPath,
      status: 'loaded'
    },
    analytics: params.include_analytics ? {
      load_time: Date.now() - Date.now()
    } : undefined
  };
}

/**
 * Handle performance monitoring
 */
async function handleMonitor(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  if (!params.performance_action) {
    throw new Error('Performance action is required for monitoring');
  }
  
  console.log(`📊 Performance monitoring: ${params.performance_action}`);
  
  const monitorResult = await performanceMonitor({
    action: params.performance_action,
    session_id: params.session_id,
    tool_name: params.tool_name,
    start_time: params.start_time,
    end_time: params.end_time,
    success: params.success,
    error_message: params.error_message,
    metadata: params.metadata
  });
  
  return {
    success: monitorResult.success,
    action: 'monitor',
    data: monitorResult.data,
    performance_metrics: monitorResult.success ? {
      session_id: params.session_id,
      current_action: params.performance_action,
      ...monitorResult.data
    } : undefined,
    error: monitorResult.success ? undefined : monitorResult.error
  };
}

/**
 * Handle campaign finalization
 */
async function handleFinalize(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  console.log('🏁 Finalizing campaign');
  
  // End performance monitoring session if running
  let finalPerformanceReport = null;
  if (params.session_id) {
    try {
      finalPerformanceReport = await performanceMonitor({
        action: 'get_report',
        session_id: params.session_id
      });
    } catch (perfError) {
      console.warn('⚠️ Could not retrieve final performance report:', perfError);
    }
  }
  
  const finalizationData = {
    finalized_at: new Date().toISOString(),
    performance_report: finalPerformanceReport?.data
  };
  
  console.log('✅ Campaign finalized successfully');
  
  return {
    success: true,
    action: 'finalize',
    data: finalizationData,
    performance_metrics: finalPerformanceReport?.data,
    analytics: params.include_analytics ? {
      finalization_time: Date.now() - Date.now()
    } : undefined
  };
}

/**
 * Handle getting campaign statistics
 */
async function handleGetStats(params: CampaignManagerParams): Promise<CampaignManagerResult> {
  console.log('📈 Getting campaign statistics');
  
  // Get performance report if session_id provided
  let performanceStats = null;
  if (params.session_id) {
    try {
      const reportResult = await performanceMonitor({
        action: 'get_report',
        session_id: params.session_id
      });
      
      if (reportResult.success) {
        performanceStats = reportResult.data;
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve performance stats:', error);
    }
  }
  
  const stats = {
    requested_at: new Date().toISOString(),
    session_id: params.session_id,
    performance_available: !!performanceStats,
    performance_stats: performanceStats
  };
  
  return {
    success: true,
    action: 'get_stats',
    data: stats,
    performance_metrics: performanceStats,
    analytics: params.include_analytics ? {
      stats_retrieval_time: Date.now() - Date.now()
    } : undefined
  };
}