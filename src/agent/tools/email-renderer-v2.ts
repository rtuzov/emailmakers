/**
 * 📧 EMAIL RENDERER V2 - Refactored Agent Tool
 * 
 * Refactored from 1768-line monolithic file to clean, modular architecture
 * Following OpenAI Agents SDK patterns and service-based design
 * 
 * Features:
 * - Clean separation of concerns
 * - Service-based architecture following OpenAI Agents patterns
 * - Proper error handling with AgentsError compatibility
 * - Type safety with Zod validation
 * - Performance optimization
 * - Comprehensive tracing and analytics
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { recordToolUsage } from '../utils/tracing-utils';

// Import modular services
import { MjmlCompilationService } from './email-renderer/services/mjml-compilation-service';
import { ComponentRenderingService } from './email-renderer/services/component-rendering-service';
import { OptimizationService } from './email-renderer/services/optimization-service';
import EmailFolderManager from './email-folder-manager';
import { campaignState } from '../core/campaign-state';

// Import types and schema
import { 
  emailRendererSchema,
  EmailRendererParams, 
  EmailRendererResult,
  ServiceExecutionContext
} from './email-renderer/types/email-renderer-types';

/**
 * Email Renderer V2 Tool - OpenAI Agents SDK Compatible
 * 
 * This tool orchestrates email rendering using specialized services:
 * - MJML Compilation Service: Handles MJML to HTML conversion
 * - Component Rendering Service: Manages React component rendering
 * - Optimization Service: Applies performance and compatibility optimizations
 */
export const emailRendererV2 = tool({
  name: 'email_renderer_v2',
  description: 'Advanced email rendering tool with modular architecture supporting MJML, React components, and optimization',
  parameters: emailRendererSchema,
  execute: async (params: EmailRendererParams): Promise<string> => {
    const startTime = Date.now();
    
    try {
      // Record tool usage for analytics
      recordToolUsage({
        tool: 'email_renderer_v2',
        operation: params.action
      });

      // Load email folder - try from params first, then campaign state
      let emailFolder = undefined;
      
      console.log(`🔍 DEBUG: EmailRenderer V2 - params.emailFolder:`, params.emailFolder);
      console.log(`🔍 DEBUG: EmailRenderer V2 - typeof params.emailFolder:`, typeof params.emailFolder);
      
      if (params.emailFolder) {
        console.log(`🔍 DEBUG: Attempting to load email folder: ${params.emailFolder}`);
        emailFolder = await EmailFolderManager.loadEmailFolder(params.emailFolder);
        console.log(`🔍 DEBUG: LoadEmailFolder result:`, emailFolder);
        if (!emailFolder) {
          console.warn(`⚠️ Email folder not found: ${params.emailFolder}`);
          
          // 🔧 CRITICAL FIX: Create email folder if it doesn't exist
          console.log(`📁 Creating missing email folder: ${params.emailFolder}`);
          try {
            // Extract topic from content_data or use folder name
            const topic = (params.content_data as any)?.subject || (params.content_data as any)?.topic || params.emailFolder;
            const campaignType = (params.content_data as any)?.campaign_type || 'promotional';
            
            console.log(`📁 Creating folder with topic: "${topic}", type: ${campaignType}`);
            
            emailFolder = await EmailFolderManager.createEmailFolder(topic, campaignType);
            
            console.log(`✅ Email folder created successfully: ${emailFolder.campaignId}`);
            console.log(`📂 Base path: ${emailFolder.basePath}`);
            
            // Update campaign state with the new folder
            const { campaignState } = await import('../core/campaign-state');
            campaignState.setCampaign({
              campaignId: emailFolder.campaignId,
              emailFolder: emailFolder,
              topic: topic,
              campaign_type: campaignType,
              created_at: new Date().toISOString()
            });
            
          } catch (createError) {
            console.error(`❌ Failed to create email folder for ${params.emailFolder}:`, createError);
            console.warn(`⚠️ Continuing without email folder - files won't be saved`);
          }
        } else {
          console.log(`✅ Email folder loaded successfully: ${emailFolder.campaignId}`);
        }
      } else {
        // Try to get from campaign state
        console.log(`🔍 DEBUG: No emailFolder in params, trying campaign state`);
        emailFolder = campaignState.getCurrentEmailFolder();
        if (emailFolder) {
          console.log(`📁 Using email folder from campaign state: ${emailFolder.campaignId}`);
        } else {
          console.log(`⚠️ No email folder found in campaign state either`);
        }
      }

      // Create execution context
      const context: ServiceExecutionContext = {
        params,
        start_time: startTime,
        email_folder: emailFolder,
        trace_id: generateTraceId()
      };

      // Initialize services
      const mjmlService = new MjmlCompilationService();
      const componentService = new ComponentRenderingService();
      const optimizationService = new OptimizationService();

      // Route to appropriate service based on action
      let result: EmailRendererResult;
      
      switch (params.action) {
        case 'render_mjml':
          result = await mjmlService.handleMjmlRendering(context);
          break;
          
        case 'render_component':
          result = await componentService.handleComponentRendering(context);
          break;
          
        case 'render_advanced':
          result = await componentService.handleAdvancedRendering(context);
          break;
          
        case 'render_seasonal':
          result = await componentService.handleSeasonalRendering(context);
          break;
          
        case 'render_hybrid':
          result = await handleHybridRendering(context, mjmlService, componentService, optimizationService);
          break;
          
        case 'optimize_output':
          result = await optimizationService.handleOutputOptimization(context);
          break;
          
        default:
          throw new Error(`Unsupported action: ${params.action}`);
      }

      // Apply final optimizations if requested
      if (params.rendering_options?.minify_output && result.success) {
        result = await optimizationService.handleOutputOptimization({
          ...context,
          params: {
            ...params,
            action: 'optimize_output',
            mjml_content: result.data?.mjml || params.mjml_content || '',
            content_data: {
              subject: '',
              preheader: '',
              body: '',
              cta_text: '',
              cta_url: '',
              pricing_data: '',
              assets: [],
              personalization: ''
            }
          }
        });
      }

      // Add execution time to analytics
      if (result.analytics) {
        result.analytics.execution_time = Date.now() - startTime;
      }

      // Return formatted result for OpenAI Agents SDK
      return formatResultForAgent(result);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Create error result
      const errorResult: EmailRendererResult = {
        success: false,
        action: params.action,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        analytics: {
          execution_time: executionTime,
          rendering_complexity: 0,
          cache_efficiency: 0,
          components_rendered: 0,
          optimizations_performed: 0
        }
      };

      return formatResultForAgent(errorResult);
    }
  }
});

/**
 * Handle hybrid rendering that combines multiple services
 */
async function handleHybridRendering(
  context: ServiceExecutionContext,
  mjmlService: MjmlCompilationService,
  componentService: ComponentRenderingService,
  optimizationService: OptimizationService
): Promise<EmailRendererResult> {
  const { params } = context;
  const hybridConfig = params.hybrid_config;
  
  if (!hybridConfig?.base_template) {
    throw new Error('Hybrid rendering requires base_template configuration');
  }

  // Start with base template
  let result: EmailRendererResult;
  
  switch (hybridConfig.base_template) {
    case 'mjml':
      result = await mjmlService.handleMjmlRendering(context);
      break;
    case 'react':
      result = await componentService.handleComponentRendering(context);
      break;
    case 'advanced':
      result = await componentService.handleAdvancedRendering(context);
      break;
    case 'seasonal':
      result = await componentService.handleSeasonalRendering(context);
      break;
    default:
      throw new Error(`Unsupported base template: ${hybridConfig.base_template}`);
  }

  // Apply enhancements in order
  if (hybridConfig.enhancements && result.success) {
    for (const enhancement of hybridConfig.enhancements) {
      result = await applyEnhancement(result, enhancement, context, mjmlService, componentService, optimizationService);
    }
  }

  return result;
}

/**
 * Apply enhancement to existing result
 */
async function applyEnhancement(
  result: EmailRendererResult,
  enhancement: string,
  context: ServiceExecutionContext,
  mjmlService: MjmlCompilationService,
  componentService: ComponentRenderingService,
  optimizationService: OptimizationService
): Promise<EmailRendererResult> {
  try {
    switch (enhancement) {
      case 'seasonal_overlay':
        // Apply seasonal enhancements to existing result
        return await componentService.handleSeasonalRendering({
          ...context,
          params: {
            ...context.params,
            mjml_content: result.data?.html || result.data?.mjml || ''
          }
        });
        
      case 'advanced_components':
        // Apply advanced component enhancements
        return await componentService.handleAdvancedRendering({
          ...context,
          params: {
            ...context.params,
            mjml_content: result.data?.html || result.data?.mjml || ''
          }
        });
        
      case 'react_widgets':
        // Apply React widget enhancements
        return await componentService.handleComponentRendering({
          ...context,
          params: {
            ...context.params,
            mjml_content: result.data?.html || result.data?.mjml || ''
          }
        });
        
      case 'mjml_structure':
        // Apply MJML structure enhancements
        return await mjmlService.handleMjmlRendering({
          ...context,
          params: {
            ...context.params,
            mjml_content: result.data?.html || result.data?.mjml || ''
          }
        });
        
      default:
        console.warn(`Unknown enhancement: ${enhancement}`);
        return result;
    }
  } catch (error) {
    console.error(`Enhancement ${enhancement} failed:`, error);
    return result; // Return original result if enhancement fails
  }
}

/**
 * Format result for OpenAI Agents SDK consumption
 */
function formatResultForAgent(result: EmailRendererResult): string {
  if (!result.success) {
    return `❌ Email rendering failed: ${result.error}

Analytics:
- Execution time: ${result.analytics?.execution_time || 0}ms
- Action: ${result.action}

Please check the input parameters and try again.`;
  }

  const output = [];
  output.push(`✅ Email rendering successful: ${result.action}`);
  
  if (result.data?.html) {
    output.push(`\n📄 HTML Output: ${result.data.html.length} characters`);
  }
  
  if (result.data?.mjml) {
    output.push(`\n📧 MJML Output: ${result.data.mjml.length} characters`);
  }
  
  if (result.rendering_metadata) {
    output.push(`\n🔧 Rendering Engine: ${result.rendering_metadata.rendering_engine}`);
    output.push(`📊 File Size: ${result.rendering_metadata.file_size} bytes`);
    output.push(`⚡ Load Time Estimate: ${result.rendering_metadata.load_time_estimate}ms`);
  }
  
  if (result.analytics) {
    output.push(`\n📈 Analytics:`);
    output.push(`- Execution time: ${result.analytics.execution_time}ms`);
    output.push(`- Components rendered: ${result.analytics.components_rendered}`);
    output.push(`- Optimizations performed: ${result.analytics.optimizations_performed}`);
  }
  
  if (result.recommendations?.length) {
    output.push(`\n💡 Recommendations:`);
    result.recommendations.forEach(rec => output.push(`- ${rec}`));
  }
  
  return output.join('\n');
}

/**
 * Generate unique trace ID for tracking
 */
function generateTraceId(): string {
  return `email_render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export for backward compatibility
export async function emailRenderer(params: EmailRendererParams): Promise<EmailRendererResult> {
  const startTime = Date.now();
  
  try {
    // Record tool usage for analytics
    recordToolUsage({
      tool: 'email_renderer_v2',
      operation: params.action
    });

    // Load email folder - try from params first, then campaign state
    let emailFolder = undefined;
    
    console.log(`🔍 DEBUG: EmailRenderer (compat) - params.emailFolder:`, params.emailFolder);
    console.log(`🔍 DEBUG: EmailRenderer (compat) - typeof params.emailFolder:`, typeof params.emailFolder);
    
    if (params.emailFolder) {
      console.log(`🔍 DEBUG: Attempting to load email folder: ${params.emailFolder}`);
      emailFolder = await EmailFolderManager.loadEmailFolder(params.emailFolder);
      console.log(`🔍 DEBUG: LoadEmailFolder result:`, emailFolder);
      if (!emailFolder) {
        console.warn(`⚠️ Email folder not found: ${params.emailFolder}`);
        
        // 🔧 CRITICAL FIX: Create email folder if it doesn't exist
        console.log(`📁 Creating missing email folder: ${params.emailFolder}`);
        try {
          // Extract topic from content_data or use folder name
          const topic = (params.content_data as any)?.subject || (params.content_data as any)?.topic || params.emailFolder;
          const campaignType = (params.content_data as any)?.campaign_type || 'promotional';
          
          console.log(`📁 Creating folder with topic: "${topic}", type: ${campaignType}`);
          
          emailFolder = await EmailFolderManager.createEmailFolder(topic, campaignType);
          
          console.log(`✅ Email folder created successfully: ${emailFolder.campaignId}`);
          console.log(`📂 Base path: ${emailFolder.basePath}`);
          
          // Update campaign state with the new folder
          const { campaignState } = await import('../core/campaign-state');
          campaignState.setCampaign({
            campaignId: emailFolder.campaignId,
            emailFolder: emailFolder,
            topic: topic,
            campaign_type: campaignType,
            created_at: new Date().toISOString()
          });
          
        } catch (createError) {
          console.error(`❌ Failed to create email folder for ${params.emailFolder}:`, createError);
          console.warn(`⚠️ Continuing without email folder - files won't be saved`);
        }
      } else {
        console.log(`✅ Email folder loaded successfully: ${emailFolder.campaignId}`);
      }
    } else {
      // Try to get from campaign state
      console.log(`🔍 DEBUG: No emailFolder in params, trying campaign state`);
      emailFolder = campaignState.getCurrentEmailFolder();
      if (emailFolder) {
        console.log(`📁 Using email folder from campaign state: ${emailFolder.campaignId}`);
      } else {
        console.log(`⚠️ No email folder found in campaign state either`);
      }
    }

    // Create execution context
    const context: ServiceExecutionContext = {
      params,
      start_time: startTime,
      email_folder: emailFolder,
      trace_id: generateTraceId()
    };

    // Initialize services
    const mjmlService = new MjmlCompilationService();
    const componentService = new ComponentRenderingService();
    const optimizationService = new OptimizationService();

    // Route to appropriate service based on action
    let result: EmailRendererResult;
    
    switch (params.action) {
      case 'render_mjml':
        result = await mjmlService.handleMjmlRendering(context);
        break;
        
      case 'render_component':
        result = await componentService.handleComponentRendering(context);
        break;
        
      case 'render_advanced':
        result = await componentService.handleAdvancedRendering(context);
        break;
        
      case 'render_seasonal':
        result = await componentService.handleSeasonalRendering(context);
        break;
        
      case 'render_hybrid':
        result = await handleHybridRendering(context, mjmlService, componentService, optimizationService);
        break;
        
      case 'optimize_output':
        result = await optimizationService.handleOutputOptimization(context);
        break;
        
      default:
        throw new Error(`Unsupported action: ${params.action}`);
    }

    // Apply final optimizations if requested
    if (params.rendering_options?.minify_output && result.success) {
      result = await optimizationService.handleOutputOptimization({
        ...context,
        params: {
          ...params,
          action: 'optimize_output',
          mjml_content: result.data?.mjml || params.mjml_content || '',
          content_data: {
            subject: '',
            preheader: '',
            body: '',
            cta_text: '',
            cta_url: '',
            pricing_data: '',
            assets: [],
            personalization: ''
          }
        }
      });
    }

    // Add execution time to analytics
    if (result.analytics) {
      result.analytics.execution_time = Date.now() - startTime;
    }

    return result;
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      analytics: {
        execution_time: executionTime,
        rendering_complexity: 0,
        cache_efficiency: 0,
        components_rendered: 0,
        optimizations_performed: 0
      }
    };
  }
}

// Export the tool and schema
export { emailRendererSchema };
export type { EmailRendererParams, EmailRendererResult };
export default emailRendererV2; 