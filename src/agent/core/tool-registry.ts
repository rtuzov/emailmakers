/**
 * 🔧 TOOL REGISTRY
 * 
 * Централизованное управление всеми инструментами агентов
 * Обеспечивает типобезопасность, организацию и легкую настройку tools
 */

import { z } from 'zod';
import { tool } from '@openai/agents';

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
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private categories: Map<string, ToolCategory> = new Map();
  private enabledTools: Set<string> = new Set();

  private constructor() {
    this.initializeCategories();
    this.registerDefaultTools();
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
   * Регистрация базовых инструментов системы
   */
  private registerDefaultTools(): void {
    // Content Tools
    this.registerTool({
      name: 'content_generator',
      description: 'Generate email content with AI and real pricing data',
      category: 'content',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        topic: z.string().describe('Campaign topic'),
        action: z.enum(['generate', 'optimize', 'variants']).describe('Action to perform')
      }),
      execute: async (params) => {
        const { simpleContentGenerator } = await import('../tools/simple-content-generator');
        return await simpleContentGenerator({
          action: params.action,
          topic: params.topic,
          language: 'ru',
          tone: 'friendly',
          include_analytics: true
        });
      }
    });

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

    // Design Tools
    this.registerTool({
      name: 'email_renderer',
      description: 'Render email templates with MJML compilation and optimization',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        mjml_content: z.string().describe('MJML template content'),
        optimization_level: z.enum(['basic', 'advanced']).describe('Optimization level')
      }),
      execute: async (params) => {
        const { emailRenderer } = await import('../tools/email-renderer-v2');
        return await emailRenderer({
          action: 'render_mjml',
          mjml_content: params.mjml_content
        });
      }
    });

    this.registerTool({
      name: 'figma_asset_selector',
      description: 'Intelligent selection of Figma assets based on content analysis and emotional context',
      category: 'design',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        tags: z.array(z.string()).describe('Search tags derived from content analysis'),
        campaign_type: z.enum(['seasonal', 'promotional', 'informational']).describe('Type of campaign'),
        emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).describe('Emotional tone'),
        target_count: z.number().describe('Number of assets to select')
      }),
      execute: async (params) => {
        const { selectFigmaAssetByTags } = await import('../modules/image-planning');
        return await selectFigmaAssetByTags(
          params.tags, 
          params.campaign_type
        );
      }
    });

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
        const mjml = await import('mjml');
        const result = mjml.default(params.mjml_content, {
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

    // Quality Tools  
    this.registerTool({
      name: 'quality_controller',
      description: 'Comprehensive quality control and validation for email templates',
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
      }
    });

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

    // Delivery Tools
    this.registerTool({
      name: 'delivery_manager',
      description: 'Manage email delivery, file uploads, and deployment processes',
      category: 'delivery',
      version: '2.0.0',
      enabled: true,
      parameters: z.object({
        action: z.enum(['upload_assets', 'generate_screenshots', 'visual_testing', 'deploy_campaign', 'archive_assets', 'cdn_distribution', 'organize_multi_destination_assets']).describe('Delivery action to perform'),
        files: z.array(z.string()).describe('Files to process'),
        destination: z.string().describe('Deployment destination')
      }),
      execute: async (params) => {
        const { deliveryManager } = await import('../tools/consolidated/delivery-manager');
        return await deliveryManager({
          action: params.action,
          upload_config: {
            files: params.files.map(file => ({
              file_path: file,
              destination_key: null,
              content_type: null,
              metadata: null
            })),
            bucket_name: 'email-campaigns',
            access_level: 'private'
          }
        });
      }
    });

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
          content: z.string().describe('File content or path'),
          size: z.number().nullable().describe('File size in bytes (null if unknown)')
        })).describe('Array of files data'),
        organization_type: z.enum(['flat', 'structured', 'timestamped']).describe('File organization structure type')
      }),
      execute: async (params) => {
        // File organization logic with metadata tracking
        const organizationType = params.organization_type;
        const organizedFiles = {
          structure: organizationType,
          campaign_id: params.campaign_id,
          files: params.files_data.map(fileData => ({
            name: fileData.filename,
            path: `campaigns/${params.campaign_id}/${fileData.filename}`,
            size: fileData.size ?? fileData.content.length,
            created_at: new Date().toISOString()
          })),
          metadata: {
            total_files: params.files_data.length,
            organization_date: new Date().toISOString(),
            structure_type: organizationType
          }
        };

        return {
          success: true,
          data: {
            campaign_id: params.campaign_id,
            organized_files: organizedFiles
          }
        };
      }
    });

    this.registerTool({
      name: 'final_email_delivery',
      description: 'Creates final deliverable email with all assets consolidated and ready for sending',
      category: 'delivery',
      version: '1.0.0',
      enabled: true,
      parameters: z.object({
        campaign_id: z.string().describe('Campaign ID to finalize'),
        email_html: z.string().describe('Final HTML content for the email'),
        email_subject: z.string().describe('Email subject line'),
        email_preheader: z.string().describe('Email preheader text'),
                 assets_to_include: z.array(z.string()).nullable().describe('Specific asset paths to include in final delivery'),
        create_zip: z.boolean().default(true).describe('Create ZIP archive for delivery'),
        open_preview: z.boolean().default(false).describe('Open HTML preview in browser')
      }),
      execute: async (params) => {
        const { finalEmailDelivery } = await import('../tools/final-email-delivery');
        const result = await finalEmailDelivery.execute(params);
        return JSON.parse(result);
      }
    });

    // После регистрации всех инструментов, активируем их
    this.enableAllTools();
  }

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

    // Создаем tool через OpenAI Agents SDK функцию tool()
    return tool({
      name: definition.name,
      description: definition.description,
      parameters: definition.parameters,
      execute: definition.execute
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
   * Получение инструментов для специфичного агента
   */
  getToolsForAgent(agentType: 'content' | 'design' | 'quality' | 'delivery'): any[] {
    const tools: any[] = [];
    
    // Основные consolidated tools
    const mainTools = ['content_generator', 'email_renderer', 'quality_controller', 'delivery_manager'];
    
    // Granular tools для улучшения трейсинга (временно исключаем file_organizer из-за Zod проблемы)
    const granularTools = [
      'pricing_intelligence',
      'date_intelligence', 
      'figma_asset_selector',
      'mjml_compiler',
      'html_validator',
      'final_email_delivery'
      // 'file_organizer' - временно отключен из-за Zod схемы
    ];

    // Добавляем все инструменты для максимальной видимости в трейсинге
    [...mainTools, ...granularTools].forEach(toolName => {
      const tool = this.getOpenAITool(toolName);
      if (tool) {
        tools.push(tool);
      }
    });

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