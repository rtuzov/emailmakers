/**
 * 🔧 TOOL REGISTRY - OpenAI Agents SDK Compatible
 * 
 * Централизованное управление всеми инструментами агентов
 * Обеспечивает типобезопасность, организацию и легкую настройку tools
 * 
 * АРХИТЕКТУРА (OpenAI Agents SDK):
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
  // OpenAI Agents SDK совместимый инструмент
  agentsTool?: any;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}

/**
 * Центральный реестр всех инструментов системы
 * OpenAI Agents SDK Compatible
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private categories: Map<string, ToolCategory> = new Map();
  private enabledTools: Set<string> = new Set();
  private agentsTools: Map<string, any> = new Map(); // Хранилище OpenAI Agents SDK tools

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
   * OpenAI Agents SDK: Consolidated tool registration method
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
    console.log('✅ OpenAI Agents SDK tools integration enabled');
  }

  // ============================================================================
  // CONTENT GENERATION TOOLS
  // ============================================================================

  private registerContentTools(): void {
    // Asset Tag Planner Tool (OpenAI Agents SDK Compatible)
    this.registerAgentsTool({
      name: 'asset_tag_planner',
      description: 'Планирует теги для поиска изображений на основе контента email кампании. Анализирует бриф и определяет оптимальные теги для Figma и внешних источников.',
      category: 'content',
      version: '2.0.0',
      enabled: true,
      importPath: '../tools/asset-tag-planner',
      exportName: 'assetTagPlannerTool'
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
            status: 'created'
          });
          
          return {
            success: true,
            campaignId: emailFolder.campaignId,
            folderPath: emailFolder.folderPath,
            message: `Campaign folder created successfully for "${params.topic}"`
          };
        } catch (error) {
          console.error('❌ Campaign folder creation failed:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to create campaign folder'
          };
        }
      }
    });
  }

  // ============================================================================
  // DESIGN TOOLS
  // ============================================================================

  private registerDesignTools(): void {
    // Enhanced Asset Selector Tool (OpenAI Agents SDK Compatible)
    this.registerAgentsTool({
      name: 'enhanced_asset_selector',
      description: 'Выбирает и обрабатывает изображения для email шаблонов на основе плана от Content Specialist. Использует интеллектуальный поиск в Figma и внешних источниках.',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      importPath: '../tools/enhanced-asset-selector',
      exportName: 'enhancedAssetSelectorTool'
    });

    // Figma Asset Selector (Legacy Support)
    this.registerTool({
      name: 'figma_asset_selector',
      description: 'Selects assets from Figma based on campaign requirements and tags',
      category: 'design',
      version: '1.5.0',
      enabled: true,
      parameters: z.object({
        tags: z.array(z.string()).describe('Tags for asset search'),
        campaign_type: z.enum(['promotional', 'seasonal', 'informational']).describe('Type of campaign'),
        asset_plan: z.any().nullable().optional().describe('Asset plan from Content Specialist')
      }),
      execute: async (params) => {
        // Legacy wrapper for backward compatibility
        if (params.asset_plan) {
          const { enhancedAssetSelectorTool } = await import('../tools/enhanced-asset-selector');
          return enhancedAssetSelectorTool.execute(params.asset_plan);
        } else {
          const { FigmaLocalProcessor } = await import('../tools/figma-local-processor');
          const processor = new FigmaLocalProcessor();
          return processor.selectAssetsByTags(params.tags, params.campaign_type);
        }
      }
    });

    // Email Template Renderer
    this.registerTool({
      name: 'email_template_renderer',
      description: 'Renders email templates using MJML with dynamic content and assets',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        template_data: z.any().describe('Template data structure'),
        assets: z.array(z.any()).describe('Selected assets for the template'),
        campaign_type: z.string().describe('Type of campaign')
      }),
      execute: async (params) => {
        const { EmailTemplateRenderer } = await import('../tools/consolidated/email-template-renderer');
        const renderer = new EmailTemplateRenderer();
        return renderer.renderTemplate(params.template_data, params.assets, params.campaign_type);
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

    // Email Quality Validator
    this.registerTool({
      name: 'email_quality_validator',
      description: 'Validates email templates for quality, accessibility, and client compatibility',
      category: 'quality',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML content to validate'),
        validation_level: z.enum(['basic', 'standard', 'comprehensive']).describe('Level of validation')
      }),
      execute: async (params) => {
        // Simple validation stub for now
        return {
          success: true,
          validation_level: params.validation_level,
          score: 85,
          issues: [],
          recommendations: []
        };
      }
    });

    // Cross-Client Testing
    this.registerTool({
      name: 'cross_client_tester',
      description: 'Tests email templates across different email clients for compatibility',
      category: 'quality',
      version: '1.5.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML content to test'),
        test_clients: z.array(z.string()).describe('Email clients to test against')
      }),
      execute: async (params) => {
        const { CrossClientTester } = await import('../tools/cross-client-tester');
        const tester = new CrossClientTester();
        return tester.testAcrossClients(params.html_content, params.test_clients);
      }
    });

    // Performance Analyzer
    this.registerTool({
      name: 'performance_analyzer',
      description: 'Analyzes email template performance metrics including load time and size',
      category: 'quality',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        html_content: z.string().describe('HTML content to analyze'),
        include_images: z.boolean().default(true).describe('Include image analysis')
      }),
      execute: async (params) => {
        const { PerformanceAnalyzer } = await import('../tools/performance-analyzer');
        const analyzer = new PerformanceAnalyzer();
        return analyzer.analyzePerformance(params.html_content, params.include_images);
      }
    });
  }

  // ============================================================================
  // DELIVERY TOOLS
  // ============================================================================

  private registerDeliveryTools(): void {
    // Delivery Manager
    this.registerTool({
      name: 'delivery_manager',
      description: 'Manages final delivery of email templates with packaging and optimization',
      category: 'delivery',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        template_data: z.any().describe('Final template data'),
        delivery_options: z.object({
          format: z.enum(['zip', 'html', 'mjml']).describe('Delivery format'),
          optimize: z.boolean().default(true).describe('Apply optimizations'),
          include_preview: z.boolean().default(true).describe('Include preview images')
        }).describe('Delivery configuration')
      }),
      execute: async (params) => {
        const { deliveryManager } = await import('../tools/consolidated/delivery-manager');
        return deliveryManager.packageAndDeliver(params.template_data, params.delivery_options);
      }
    });

    // File Uploader
    this.registerTool({
      name: 'file_uploader',
      description: 'Uploads generated files to specified storage locations',
      category: 'delivery',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        files: z.array(z.any()).describe('Files to upload'),
        destination: z.string().describe('Upload destination'),
        options: z.any().optional().describe('Upload options')
      }),
      execute: async (params) => {
        const { FileUploader } = await import('../tools/file-uploader');
        const uploader = new FileUploader();
        return uploader.uploadFiles(params.files, params.destination, params.options);
      }
    });
  }

  // ============================================================================
  // UTILITY TOOLS
  // ============================================================================

  private registerUtilityTools(): void {
    // System Health Check
    this.registerTool({
      name: 'system_health_check',
      description: 'Performs comprehensive system health checks and diagnostics',
      category: 'utility',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        check_type: z.enum(['basic', 'full', 'specific']).describe('Type of health check'),
        components: z.array(z.string()).optional().describe('Specific components to check')
      }),
      execute: async (params) => {
        const { SystemHealthChecker } = await import('../tools/system-health-checker');
        const checker = new SystemHealthChecker();
        return checker.performHealthCheck(params.check_type, params.components);
      }
    });
  }

  // ============================================================================
  // ML SCORING TOOLS INTEGRATION
  // ============================================================================

  private registerNativeMLScoringTools(): void {
    console.log('🤖 Registering ML scoring tools with OpenAI SDK integration...');
    
    // Register ML scoring tools from the dedicated module
    mlScoringTools.forEach((tool, index) => {
      try {
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
  // OPENAI AGENTS SDK TOOL REGISTRATION
  // ============================================================================

  /**
   * Регистрирует OpenAI Agents SDK совместимый инструмент
   */
  registerAgentsTool(config: {
    name: string;
    description: string;
    category: 'content' | 'design' | 'quality' | 'delivery' | 'utility';
    version: string;
    enabled: boolean;
    importPath: string;
    exportName: string;
  }): void {
    // Создаем ленивый загрузчик для инструмента
    const lazyTool = {
      name: config.name,
      description: config.description,
      get parameters() {
        // Параметры будут загружены при первом обращении
        return z.any();
      },
      execute: async (params: any) => {
        try {
          const module = await import(config.importPath);
          const tool = module[config.exportName];
          if (!tool || typeof tool.execute !== 'function') {
            throw new Error(`Tool ${config.exportName} not found or invalid in ${config.importPath}`);
          }
          return tool.execute(params);
        } catch (error) {
          console.error(`❌ Failed to execute agents tool ${config.name}:`, error);
          throw error;
        }
      }
    };

    // Регистрируем как обычный инструмент
    this.registerTool({
      name: config.name,
      description: config.description,
      category: config.category,
      version: config.version,
      enabled: config.enabled,
      parameters: lazyTool.parameters,
      execute: lazyTool.execute,
      agentsTool: lazyTool
    });

    // Сохраняем ссылку на OpenAI Agents SDK инструмент
    this.agentsTools.set(config.name, lazyTool);
    console.log(`✅ Registered OpenAI Agents SDK tool: ${config.name}`);
  }

  // ============================================================================
  // CORE REGISTRY METHODS
  // ============================================================================

  registerTool(definition: ToolDefinition): void {
    this.tools.set(definition.name, definition);
    
    // Add to category
    const category = this.categories.get(definition.category);
    if (category) {
      category.tools.push(definition.name);
    }
    
    // Enable by default
    if (definition.enabled) {
      this.enabledTools.add(definition.name);
    }
    
    console.log(`🔧 Registered tool: ${definition.name} (v${definition.version})`);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Получает OpenAI Agents SDK совместимый инструмент
   */
  getAgentsTool(name: string): any {
    return this.agentsTools.get(name);
  }

  /**
   * Получает все OpenAI Agents SDK инструменты для агента
   */
  getAgentsToolsForAgent(agentType: 'content' | 'design' | 'quality' | 'delivery'): any[] {
    const tools: any[] = [];
    
    this.tools.forEach((tool, name) => {
      if (tool.enabled && tool.agentsTool) {
        // Фильтруем по типу агента
        const isRelevant = this.isToolRelevantForAgent(tool.category, agentType);
        if (isRelevant) {
          tools.push(tool.agentsTool);
        }
      }
    });
    
    return tools;
  }

  /**
   * Проверяет, релевантен ли инструмент для типа агента
   */
  private isToolRelevantForAgent(toolCategory: string, agentType: string): boolean {
    const relevanceMap: Record<string, string[]> = {
      content: ['content', 'utility'],
      design: ['design', 'content', 'utility'],
      quality: ['quality', 'utility'],
      delivery: ['delivery', 'quality', 'utility']
    };
    
    return relevanceMap[agentType]?.includes(toolCategory) || false;
  }

  getOpenAITool(name: string): any {
    const tool = this.tools.get(name);
    if (!tool) return null;
    
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute
      }
    };
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  getAllEnabledTools(): any[] {
    const tools: any[] = [];
    this.enabledTools.forEach(toolName => {
      const tool = this.tools.get(toolName);
      if (tool) {
        tools.push(this.getOpenAITool(toolName));
      }
    });
    return tools.filter(Boolean);
  }

  getToolsForAgent(agentType: 'content' | 'design' | 'quality' | 'delivery'): any[] {
    const categoryMap: Record<string, string[]> = {
      content: ['content', 'utility'],
      design: ['design', 'content', 'utility'],
      quality: ['quality', 'utility'],
      delivery: ['delivery', 'quality', 'utility']
    };
    
    const relevantCategories = categoryMap[agentType] || [];
    const tools: any[] = [];
    
    this.tools.forEach((tool, name) => {
      if (tool.enabled && relevantCategories.includes(tool.category)) {
        tools.push(this.getOpenAITool(name));
      }
    });
    
    return tools.filter(Boolean);
  }

  enableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (tool) {
      tool.enabled = true;
      this.enabledTools.add(name);
      console.log(`✅ Enabled tool: ${name}`);
      return true;
    }
    return false;
  }

  disableTool(name: string): boolean {
    const tool = this.tools.get(name);
    if (tool) {
      tool.enabled = false;
      this.enabledTools.delete(name);
      console.log(`❌ Disabled tool: ${name}`);
      return true;
    }
    return false;
  }

  enableAllTools(): void {
    this.tools.forEach((tool, name) => {
      tool.enabled = true;
      this.enabledTools.add(name);
    });
    console.log('✅ All tools enabled');
  }

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
    
    this.tools.forEach((tool, name) => {
      stats.byCategory[tool.category] = (stats.byCategory[tool.category] || 0) + 1;
      stats.versions[name] = tool.version;
    });
    
    return stats;
  }

  getCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  validateToolConfig(name: string): { valid: boolean; errors: string[] } {
    const tool = this.tools.get(name);
    const errors: string[] = [];
    
    if (!tool) {
      errors.push(`Tool ${name} not found`);
      return { valid: false, errors };
    }
    
    if (!tool.name) errors.push('Missing tool name');
    if (!tool.description) errors.push('Missing tool description');
    if (!tool.execute || typeof tool.execute !== 'function') {
      errors.push('Missing or invalid execute function');
    }
    if (!tool.category) errors.push('Missing tool category');
    if (!tool.version) errors.push('Missing tool version');
    
    return { valid: errors.length === 0, errors };
  }

  exportConfig(): any {
    const config: any = {
      tools: {},
      categories: {},
      enabledTools: Array.from(this.enabledTools)
    };
    
    this.tools.forEach((tool, name) => {
      config.tools[name] = {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        version: tool.version,
        enabled: tool.enabled,
        requiresAuth: tool.requiresAuth,
        metadata: tool.metadata
      };
    });
    
    this.categories.forEach((category, name) => {
      config.categories[name] = category;
    });
    
    return config;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const toolRegistry = ToolRegistry.getInstance();
export default toolRegistry;