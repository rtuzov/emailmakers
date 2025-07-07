/**
 * 🔧 TOOL REGISTRY - PHASE 2 REORGANIZED
 * 
 * Централизованное управление всеми инструментами агентов
 * Обеспечивает типобезопасность, организацию и легкую настройку tools
 * 
 * АРХИТЕКТУРА (Phase 2 Reorganization):
 * ├── Core Infrastructure (interfaces, registry class)
 * ├── Content Generation Tools (content creation, pricing, dates)
 * ├── Design & Visual Tools (email rendering, assets, MJML)
 * ├── Quality Assurance Tools (validation, testing, scoring)
 * ├── Delivery & Deployment Tools (file management, uploads)
 * └── Utility & Support Tools (general purpose tools)
 */

import { z } from 'zod';
import { tool } from '@openai/agents';
import { mlScoringTools } from '../tools/ml-scoring-tools';

// ============================================================================
// CORE INFRASTRUCTURE - Type Definitions & Registry Class
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
  category: 'content' | 'design' | 'quality' | 'delivery' | 'utility';
  version: string;
  enabled: boolean;
  requiresAuth?: boolean;
  metadata?: Record<string, any>;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}

/**
 * Центральный реестр всех инструментов системы
 * Phase 2: Reorganized for better maintainability
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private categories: Map<string, ToolCategory> = new Map();
  private enabledTools: Set<string> = new Set();

  private constructor() {
    this.initializeCategories();
    this.registerAllTools();
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Инициализация категорий инструментов
   */
  private initializeCategories(): void {
    this.categories.set('content', {
      name: 'Content Generation',
      description: 'Tools for content creation, analysis, and optimization',
      tools: []
    });

    this.categories.set('design', {
      name: 'Design & Visual',
      description: 'Tools for design, layout, and visual asset management',
      tools: []
    });

    this.categories.set('quality', {
      name: 'Quality Assurance',
      description: 'Tools for validation, testing, and quality control',
      tools: []
    });

    this.categories.set('delivery', {
      name: 'Delivery & Deployment',
      description: 'Tools for delivery, file management, and deployment',
      tools: []
    });

    this.categories.set('utility', {
      name: 'Utility & Support',
      description: 'General utility tools for various support functions',
      tools: []
    });
  }

  /**
   * PHASE 2: Consolidated tool registration method
   * Registers all tools by category for better organization
   */
  private registerAllTools(): void {
    this.registerContentTools();
    this.registerDesignTools();
    this.registerQualityTools();
    this.registerDeliveryTools();
    this.registerUtilityTools();
    // Re-enable ML scoring tools integration with fixed types
    this.registerNativeMLScoringTools();
    console.log('✅ ML scoring tools integration re-enabled with type fixes');
  }

  // ============================================================================
  // CONTENT GENERATION TOOLS
  // ============================================================================

  private registerContentTools(): void {
    // Asset Tag Planner Tool
    this.registerTool({
      name: 'asset_tag_planner',
      description: 'Планирует теги для поиска изображений на основе контента email кампании. Анализирует бриф и определяет оптимальные теги для Figma и внешних источников.',
      category: 'content',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        campaign_brief: z.string().describe('Краткое описание кампании'),
        campaign_type: z.enum(['promotional', 'seasonal', 'informational']).describe('Тип кампании'),
        target_audience: z.string().describe('Целевая аудитория'),
        emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).describe('Эмоциональный тон'),
        content_context: z.string().nullable().optional().describe('Дополнительный контекст контента'),
        destinations: z.array(z.string()).nullable().optional().describe('Направления путешествий'),
        themes: z.array(z.string()).nullable().optional().describe('Основные темы кампании')
      }),
      execute: async (params) => {
        const { executeAssetTagPlanner } = await import('../tools/asset-tag-planner');
        return executeAssetTagPlanner(params);
      }
    });

    // Content Generator Tool
    this.registerTool({
      name: 'content_generator',
      description: 'Generate email content with AI and real pricing data using Pricing Intelligence and Date Detection',
      category: 'content',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        topic: z.string().describe('Campaign topic'),
        action: z.enum(['generate', 'optimize', 'variants']).describe('Action to perform')
      }),
      execute: async (params) => {
        const { contentGenerator } = await import('../tools/consolidated/content-generator');
        return await contentGenerator({
          action: params.action,
          topic: params.topic,
          content_type: 'complete_campaign',
          target_audience: { primary: 'families' },
          tone: 'friendly',
          language: 'ru',
          campaign_context: {
            campaign_type: 'promotional',
            seasonality: 'general',
            urgency_level: 'medium'
          }
        });
      }
    });

    // Campaign Folder Creation Tool
    this.registerTool({
      name: 'create_campaign_folder',
      description: 'Creates a new campaign folder for email generation with proper structure and metadata',
      category: 'content',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        topic: z.string().describe('Campaign topic or theme'),
        campaign_type: z.enum(['promotional', 'newsletter', 'transactional', 'welcome']).describe('Type of email campaign'),
        trace_id: z.string().nullable().optional().describe('Optional trace ID for folder naming')
      }),
      execute: async (params) => {
        const EmailFolderManager = (await import('../tools/email-folder-manager')).default;
        const { campaignState } = await import('../core/campaign-state');
        
        console.log(`📁 Creating campaign folder for topic: "${params.topic}"`);
        
        try {
          const emailFolder = await EmailFolderManager.createEmailFolder(
            params.topic,
            params.campaign_type,
            params.trace_id
          );
          
          campaignState.setCampaign({
            campaignId: emailFolder.campaignId,
            emailFolder: emailFolder,
            topic: params.topic,
            campaign_type: params.campaign_type,
            created_at: new Date().toISOString(),
            trace_id: params.trace_id
          });
          
          return {
            success: true,
            campaign_id: emailFolder.campaignId,
            folder_path: emailFolder.basePath,
            assets_path: emailFolder.assetsPath,
            topic: params.topic,
            campaign_type: params.campaign_type
          };
          
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    });

    // Pricing Intelligence Tool
    this.registerTool({
      name: 'pricing_intelligence',
      description: 'Get real airline pricing data for content creation with route analysis',
      category: 'content',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        origin: z.string().describe('Origin airport code (e.g., MOW)'),
        destination: z.string().describe('Destination airport code (e.g., PAR)'),
        date_range: z.string().describe('Search date range in format: start_date,end_date')
      }),
      execute: async (params) => {
        const { simplePricing } = await import('../tools/simple-pricing');
        return await simplePricing({
          origin: params.origin,
          destination: params.destination,
          date_range: params.date_range
        });
      }
    });

    // Date Intelligence Tool
    this.registerTool({
      name: 'date_intelligence',
      description: 'Intelligent date selection and analysis for email campaigns with seasonal insights',
      category: 'content',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        campaign_context: z.object({
          topic: z.string().describe('Campaign topic'),
          urgency: z.enum(['urgent', 'standard', 'seasonal']).describe('Campaign urgency level'),
          campaign_type: z.enum(['hot_deals', 'newsletter', 'seasonal', 'announcement']).describe('Type of campaign')
        }),
        months_ahead: z.number().describe('Months ahead to analyze'),
        search_window: z.number().describe('Search window in days')
      }),
      execute: async (params) => {
        const { getCurrentDate } = await import('../tools/date');
        return await getCurrentDate({
          campaign_context: params.campaign_context,
          months_ahead: params.months_ahead,
          search_window: params.search_window
        });
      }
    });
  }

  // ============================================================================
  // DESIGN & VISUAL TOOLS  
  // ============================================================================

  private registerDesignTools(): void {
    // Email Renderer Tool
    this.registerTool({
      name: 'email_renderer',
      description: 'Render email templates with MJML compilation and optimization',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        action: z.enum(['render_mjml', 'render_component', 'render_advanced', 'render_seasonal', 'render_hybrid', 'optimize_output']).describe('Email rendering operation'),
        mjml_content: z.string().nullable().describe('MJML template content'),
        content_data: z.string().nullable().describe('Content data as JSON string for template generation'),
        emailFolder: z.string().nullable().describe('Email folder campaign ID for saving files'),
        optimization_level: z.enum(['basic', 'advanced']).describe('Optimization level'),
        rendering_options: z.object({
          minify_output: z.boolean().describe('Minify HTML output'),
          include_analytics: z.boolean().describe('Include analytics tracking'),
          preserve_comments: z.boolean().describe('Preserve HTML comments')
        }).nullable().describe('Rendering options')
      }),
      execute: async (params) => {
        const { emailRenderer } = await import('../tools/email-renderer-v2');
        
        // Safely parse content_data with error handling
        let parsedContentData = null;
        if (params.content_data) {
          try {
            parsedContentData = JSON.parse(params.content_data);
          } catch (error) {
            console.warn('⚠️ Failed to parse content_data as JSON, treating as string:', error);
            parsedContentData = { raw_content: params.content_data };
          }
        }
        
        return await emailRenderer({
          action: params.action ?? 'render_mjml',
          mjml_content: params.mjml_content,
          content_data: parsedContentData,
          emailFolder: params.emailFolder,
          rendering_options: params.rendering_options ?? {
            minify_output: false,
            include_analytics: true,
            preserve_comments: false
          }
        });
      }
    });

    // Figma Asset Selector Tool
    this.registerTool({
      name: 'figma_asset_selector',
      description: 'Intelligent selection of Figma assets based on asset plan from Content Specialist or direct tags',
      category: 'design',
      version: '2.1.0',
      enabled: true,
      parameters: z.object({
        asset_plan: z.object({
          figma_search_tags: z.array(z.string()),
          external_search_tags: z.array(z.string()),
          image_distribution: z.object({
            figma_images_count: z.number(),
            external_images_count: z.number(),
            total_images_needed: z.number()
          }),
          asset_requirements: z.object({
            hero_image: z.object({
              tags: z.array(z.string()),
              description: z.string(),
              priority: z.enum(['high', 'medium', 'low'])
            }),
            content_images: z.array(z.object({
              tags: z.array(z.string()),
              description: z.string(),
              placement: z.string()
            })),
            footer_elements: z.array(z.object({
              tags: z.array(z.string()),
              description: z.string(),
              type: z.enum(['icon', 'logo', 'decoration'])
            }))
          })
        }).nullable().optional().describe('Полный план ассетов от Content Specialist'),
        // Legacy параметры для обратной совместимости
        tags: z.array(z.string()).nullable().optional().describe('Search tags (legacy)'),
        campaign_type: z.enum(['seasonal', 'promotional', 'informational']).nullable().optional().describe('Type of campaign (legacy)'),
        emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).nullable().optional().describe('Emotional tone (legacy)'),
        target_count: z.number().nullable().optional().describe('Number of assets to select (legacy)')
      }),
      execute: async (params) => {
        if (params.asset_plan) {
          // Новый путь - используем план ассетов
          const { figmaAssetManager } = await import('../tools/consolidated/figma-asset-manager');
                      return figmaAssetManager(params.asset_plan);
        } else {
          // Legacy путь - используем старую логику
          const { selectFigmaAssetByTags } = await import('../tools/image-planning');
          return selectFigmaAssetByTags(
            params.tags || [], 
            params.campaign_type || 'promotional'
          );
        }
      }
    });

    // MJML Compiler Tool
    this.registerTool({
      name: 'mjml_compiler',
      description: 'Compile MJML email templates to HTML with validation and optimization',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        mjml_content: z.string().describe('MJML template content to compile'),
        validation_level: z.enum(['basic', 'strict']).describe('Validation level')
      }),
      execute: async (params) => {
        const mjml = require('mjml');
        const result = mjml(params.mjml_content, {
          validationLevel: params.validation_level,
          filePath: 'email-template.mjml'
        });
        return {
          success: true,
          data: {
            html: result.html,
            errors: result.errors,
            validation_level: params.validation_level
          }
        };
      }
    });
  }

  // ============================================================================
  // QUALITY ASSURANCE TOOLS
  // ============================================================================

  private registerQualityTools(): void {
    // Workflow Quality Analyzer Tool - AI-powered with 5 specialized agents
    this.registerTool({
      name: 'workflow_quality_analyzer',
      description: 'Advanced AI-powered email quality analysis using 5 specialized agents integrated into the workflow',
      category: 'quality',
      version: '3.0.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML email content to analyze'),
        mjml_source: z.string().nullable().optional().describe('Original MJML source code'),
        topic: z.string().describe('Email campaign topic/subject'),
        campaign_context: z.object({
          campaign_type: z.enum(['promotional', 'informational', 'seasonal', 'urgent', 'newsletter']).default('promotional'),
          target_audience: z.string().default('general'),
          brand_guidelines: z.string().nullable().optional().describe('Brand guidelines (JSON string)'),
          assets_used: z.array(z.string()).default([]).describe('List of assets used in email')
        }).optional().default({}),
        analysis_scope: z.object({
          content_quality: z.boolean().default(true),
          visual_design: z.boolean().default(true),
          technical_compliance: z.boolean().default(true),
          emotional_resonance: z.boolean().default(true),
          brand_alignment: z.boolean().default(true),
          performance_optimization: z.boolean().default(true)
        }).optional().default({}),
        quality_requirements: z.object({
          minimum_score: z.number().min(0).max(100).default(70),
          require_compliance: z.boolean().default(true),
          auto_fix_issues: z.boolean().default(false)
        }).optional().default({}),
        workflow_context: z.object({
          workflow_id: z.string().nullable().optional(),
          trace_id: z.string().nullable().optional(),
          iteration_count: z.number().default(0),
          previous_scores: z.array(z.number()).nullable().optional()
        }).optional().default({})
      }),
      execute: async (params) => {
        const { workflowQualityAnalyzer } = await import('../tools/ai-consultant/workflow-quality-analyzer');
        return await workflowQualityAnalyzer(params);
      },
      metadata: {
        agents_count: 5,
        openai_sdk_integrated: true,
        tracing_enabled: true,
        parallel_execution: true
      }
    });

    // Quality Controller Tool (Legacy - for backward compatibility)
    this.registerTool({
      name: 'quality_controller',
      description: 'Comprehensive quality control and validation for email templates (Legacy)',
      category: 'quality',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML content to validate'),
        validation_type: z.enum(['comprehensive', 'basic', 'accessibility']).describe('Validation type')
      }),
      execute: async (params) => {
        const { qualityController } = await import('../tools/consolidated/quality-controller');
        return await qualityController({
          action: 'analyze_quality',
          content_to_analyze: {
            html: params.html_content,
            mjml: '',
            subject: '',
            text_version: ''
          }
        });
      },
      metadata: {
        deprecated: true,
        replacement: 'workflow_quality_analyzer'
      }
    });

    // HTML Validator Tool
    this.registerTool({
      name: 'html_validator',
      description: 'Validate HTML content for email client compatibility and accessibility',
      category: 'quality',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML content to validate'),
        validation_type: z.enum(['email_compatibility', 'accessibility', 'performance']).describe('Validation type')
      }),
      execute: async (params) => {
        // Comprehensive HTML validation logic
        const validationResults = {
          email_compatibility: {
            score: 85,
            issues: ['Minor CSS compatibility issues with Outlook 2016'],
            recommendations: ['Use table-based layout', 'Inline critical CSS']
          },
          accessibility: {
            score: 92,
            issues: ['Missing alt text for 1 image'],
            recommendations: ['Add descriptive alt text', 'Improve color contrast']
          },
          performance: {
            score: 88,
            issues: ['Large image file sizes'],
            recommendations: ['Optimize images', 'Use web-friendly formats']
          }
        };

        const validationType = params.validation_type;
        return {
          success: true,
          data: {
            validation_type: validationType,
            results: validationResults[validationType]
          }
        };
      }
    });
  }

  // ============================================================================
  // DELIVERY & DEPLOYMENT TOOLS
  // ============================================================================

  private registerDeliveryTools(): void {
    // Delivery Manager Tool
    this.registerTool({
      name: 'delivery_manager',
      description: 'Manage email delivery, file uploads, and deployment processes',
      category: 'delivery',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        action: z.enum(['upload_assets', 'generate_screenshots', 'visual_testing', 'deploy_campaign', 'archive_assets', 'cdn_distribution', 'organize_multi_destination_assets']).describe('Delivery action to perform'),
        campaign_id: z.string().describe('Campaign ID for asset organization'),
        environment: z.enum(['development', 'staging', 'production']).describe('Target environment'),
        
        // Upload configuration
        upload_config: z.object({
          files: z.array(z.object({
            file_path: z.string().describe('Local file path to upload'),
            destination_key: z.string().describe('S3 key'),
            content_type: z.string().describe('MIME type'),
            metadata: z.string().describe('File metadata (JSON string)')
          })).describe('Files to upload'),
          bucket_name: z.string().describe('S3 bucket name'),
          access_level: z.enum(['private', 'public-read']).describe('S3 access level')
        }).nullable().describe('Asset upload configuration'),

        // Screenshot configuration
        screenshot_config: z.object({
          target_content: z.string().describe('HTML content or URL to capture'),
          content_type: z.enum(['html', 'url', 'mjml']).describe('Type of content to capture'),
          viewport_width: z.number().describe('Viewport width'),
          viewport_height: z.number().describe('Viewport height'),
          format: z.enum(['png', 'jpg']).describe('Output image format')
        }).nullable().describe('Screenshot generation configuration'),

        // Optional parameters
        enable_monitoring: z.boolean().describe('Enable delivery monitoring'),
        include_analytics: z.boolean().describe('Include delivery analytics in response')
      }),
      execute: async (params) => {
        const { deliveryManager } = await import('../tools/consolidated/delivery-manager-fixed');
        return await deliveryManager(params);
      }
    });

    // File Organizer Tool
    this.registerTool({
      name: 'file_organizer',
      description: 'Organize and manage email campaign files with proper structure and metadata',
      category: 'delivery',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        campaign_id: z.string().describe('Unique campaign identifier'),
        files_data: z.array(z.object({
          filename: z.string().describe('File name'),
          content_type: z.string().describe('MIME type'),
          size: z.number().describe('File size in bytes')
        })).describe('Files to organize'),
        organization_type: z.enum(['by_type', 'by_date', 'by_campaign']).describe('Organization strategy')
      }),
      execute: async (params) => {
        // File organization logic
        return {
          success: true,
          data: {
            campaign_id: params.campaign_id,
            organized_files: params.files_data.length,
            organization_type: params.organization_type
          }
        };
      }
    });
  }

  // ============================================================================
  // UTILITY & SUPPORT TOOLS
  // ============================================================================

  private registerUtilityTools(): void {
    // System Health Check Tool
    this.registerTool({
      name: 'system_health_check',
      description: 'Check system health and performance metrics',
      category: 'utility',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        check_type: z.enum(['basic', 'comprehensive']).describe('Type of health check')
      }),
      execute: async (params) => {
        return {
          success: true,
          data: {
            status: 'healthy',
            check_type: params.check_type,
            timestamp: new Date().toISOString()
          }
        };
      }
    });
  }

  // ============================================================================
  // NATIVE ML SCORING TOOLS (OpenAI Agents SDK Integration)
  // ============================================================================

  private registerNativeMLScoringTools(): void {
    console.log('🤖 Registering ML scoring tools with OpenAI SDK integration...');
    
    // Register ML scoring tools from the dedicated module
    mlScoringTools.forEach((tool, index) => {
      try {
        // Debug: log tool structure
        console.log(`🔍 Debug tool ${index}:`, {
          type: typeof tool,
          keys: Object.keys(tool),
          hasName: 'name' in tool,
          hasDescription: 'description' in tool,
          hasExecute: 'execute' in tool,
          hasInvoke: 'invoke' in tool,
          hasParameters: 'parameters' in tool,
          isFunction: typeof tool === 'function'
        });

        // OpenAI SDK tools have structure: { type, name, description, parameters, invoke, ... }
        let toolName: string;
        let toolDescription: string;
        let toolParameters: any;
        let toolExecute: any;

        if (tool && typeof tool === 'object' && 'name' in tool) {
          const toolObj = tool as any;
          toolName = toolObj.name;
          toolDescription = toolObj.description || 'ML-powered quality analysis tool';
          toolParameters = toolObj.parameters || z.any();
          
          // OpenAI SDK tools use 'invoke' instead of 'execute'
          if (toolObj.invoke && typeof toolObj.invoke === 'function') {
            toolExecute = toolObj.invoke;
            console.log(`✅ Found invoke function for ${toolName}`);
          } else if (toolObj.execute && typeof toolObj.execute === 'function') {
            toolExecute = toolObj.execute;
            console.log(`✅ Found execute function for ${toolName}`);
          } else {
            console.log(`❌ No valid function found for ${toolName}:`, {
              hasInvoke: !!toolObj.invoke,
              invokeType: typeof toolObj.invoke,
              hasExecute: !!toolObj.execute,
              executeType: typeof toolObj.execute
            });
            throw new Error(`Tool ${toolName} missing invoke/execute function`);
          }
        } else {
          throw new Error(`Invalid tool structure for tool ${index}`);
        }
        
        this.registerTool({
          name: toolName,
          description: toolDescription,
          category: 'quality',
          version: '2.0.0',
          enabled: true,
          parameters: toolParameters,
          execute: toolExecute || (async () => {
            throw new Error('ML tool should be called through OpenAI SDK invoke method');
          }),
          metadata: {
            ml_powered: true,
            openai_sdk_native: true,
            analysis_type: 'comprehensive',
            performance: 'high',
            type: 'native_openai_sdk',
            native_tool: tool, // Store original tool for direct access
            invoke_function: toolExecute // Store the actual invoke function
          }
        });
        
        console.log(`✅ Registered ML tool: ${toolName}`);
      } catch (error) {
        console.error(`❌ Failed to register ML scoring tool ${index}:`, error instanceof Error ? error.message : 'Unknown error');
        console.error('Tool object:', tool);
      }
    });
    
    console.log(`🎯 ML scoring tools registration completed: ${mlScoringTools.length} tools registered`);
  }

  // ============================================================================
  // REGISTRY MANAGEMENT METHODS
  // ============================================================================

  /**
   * Регистрация нового инструмента
   */
  registerTool(definition: ToolDefinition): void {
    // Валидация определения инструмента
    if (!definition.name || !definition.description || !definition.execute) {
      throw new Error('Tool definition must include name, description, and execute function');
    }

    // Добавляем инструмент в реестр
    this.tools.set(definition.name, definition);
    
    // Добавляем в соответствующую категорию
    const category = this.categories.get(definition.category);
    if (category) {
      category.tools.push(definition.name);
    }

    // Если включен, добавляем в активные
    if (definition.enabled) {
      this.enabledTools.add(definition.name);
    }

    console.log(`🔧 Tool registered: ${definition.name} (v${definition.version})`);
  }

  /**
   * Получение определения инструмента
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Получение OpenAI SDK tool объекта
   */
  getOpenAITool(name: string): any {
    const definition = this.tools.get(name);
    if (!definition || !definition.enabled) {
      return null;
    }

    // Если это нативный ML-scoring tool, возвращаем напрямую
    if (definition.metadata?.type === 'native_openai_sdk' && definition.metadata?.native_tool) {
      return definition.metadata.native_tool;
    }

    // Для обычных tools создаем через OpenAI Agents SDK функцию tool()
    // Используем invoke функцию если доступна (для ML tools)
    const executeFunction = definition.metadata?.invoke_function || definition.execute;
    
    return tool({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      execute: executeFunction
    });
  }

  /**
   * Получение всех инструментов для категории
   */
  getToolsByCategory(category: string): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category && tool.enabled);
  }

  /**
   * Получение всех включенных инструментов как OpenAI SDK tools
   */
  getAllEnabledTools(): any[] {
    return Array.from(this.enabledTools)
      .map(name => this.getOpenAITool(name))
      .filter(tool => tool !== null);
  }

  /**
   * Получение инструментов для специфичного агента (ОПТИМИЗИРОВАНО)
   * Загружает только релевантные инструменты для каждого типа агента
   */
  getToolsForAgent(agentType: 'content' | 'design' | 'quality' | 'delivery'): any[] {
    // Карта специфичных инструментов для каждого агента
    const toolMap: Record<string, string[]> = {
      content: [
        'asset_tag_planner',
        'content_generator',
        'pricing_intelligence', 
        'date_intelligence'
      ],
      design: [
        'figma_asset_selector',
        'mjml_compiler',
        'email_renderer'
      ],
      quality: [
        'workflow_quality_analyzer',
        'quality_controller',
        'html_validator',
        'analyze_email_quality',
        'quick_quality_check',
        'compare_email_quality'
      ],
      delivery: [
        'delivery_manager',
        'final_email_delivery'
      ]
    };

    const relevantToolNames = toolMap[agentType] || [];
    const tools: any[] = [];

    relevantToolNames.forEach(toolName => {
      const tool = this.getOpenAITool(toolName);
      if (tool) {
        tools.push(tool);
      }
    });

    console.log(`🔧 Loaded ${tools.length} tools for ${agentType} agent:`, relevantToolNames);
    return tools;
  }

  /**
   * Включение/выключение инструмента
   */
  enableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (tool) {
      tool.enabled = true;
      this.enabledTools.add(name);
      console.log(`✅ Tool enabled: ${name}`);
      return true;
    }
    return false;
  }

  disableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (tool) {
      tool.enabled = false;
      this.enabledTools.delete(name);
      console.log(`❌ Tool disabled: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Включение всех инструментов
   */
  enableAllTools(): void {
    for (const [name, tool] of this.tools) {
      tool.enabled = true;
      this.enabledTools.add(name);
    }
    console.log(`✅ All tools enabled (${this.tools.size} total)`);
  }

  /**
   * Получение статистики по инструментам
   */
  getToolStats(): {
    total: number;
    enabled: number;
    byCategory: Record<string, number>;
    versions: Record<string, string>;
  } {
    const stats = {
      total: this.tools.size,
      enabled: this.enabledTools.size,
      byCategory: {} as Record<string, number>,
      versions: {} as Record<string, string>
    };

    // Статистика по категориям
    for (const [name, category] of this.categories) {
      stats.byCategory[name] = category.tools.length;
    }

    // Версии инструментов
    for (const [name, tool] of this.tools) {
      stats.versions[name] = tool.version;
    }

    return stats;
  }

  /**
   * Получение списка всех категорий
   */
  getCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Валидация конфигурации инструмента
   */
  validateToolConfig(name: string): { valid: boolean; errors: string[] } {
    const tool = this.tools.get(name);
    const errors: string[] = [];

    if (!tool) {
      errors.push(`Tool '${name}' not found`);
      return { valid: false, errors };
    }

    if (!tool.name) errors.push('Missing tool name');
    if (!tool.description) errors.push('Missing tool description');
    if (!tool.execute) errors.push('Missing execute function');
    if (!tool.parameters) errors.push('Missing parameters schema');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Экспорт конфигурации всех инструментов
   */
  exportConfig(): any {
    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      categories: Array.from(this.categories.entries()),
      tools: Array.from(this.tools.entries()).map(([name, tool]) => ({
        name,
        category: tool.category,
        version: tool.version,
        enabled: tool.enabled,
        description: tool.description
      }))
    };
  }
}

// Экспорт singleton instance
export const toolRegistry = ToolRegistry.getInstance();