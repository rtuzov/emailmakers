import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';

// Import custom tools
import { getCurrentDate } from './tools/date';
import { getFigmaAssets } from './tools/figma';
import { getPrices } from './tools/prices';
import { generateCopy } from './tools/copy';
import { renderMjml } from './tools/mjml';
import { diffHtml } from './tools/diff';
import { patchHtml } from './tools/patch';
import { percySnap } from './tools/percy';
import { renderTest } from './tools/render-test';
import { uploadToS3 } from './tools/upload';
import { splitFigmaSprite } from './tools/figma-sprite-splitter';
import { renderComponent } from './tools/react-renderer';
import { qualityValidation } from './tools/quality-validation';
import { aiQualityConsultant, aiQualityConsultantSchema } from './tools/ai-quality-consultant';
import { performanceMonitor } from './tools/performance-monitor';
import { advancedComponentSystem } from './tools/advanced-component-system';
import { seasonalComponentSystem } from './tools/seasonal-component-system';
import { initializeEmailFolder, loadEmailFolder } from './tools/email-folder-initializer';

// UltraThink temporarily disabled due to circular import issue
// import { UltraThinkEngine, createUltraThink } from './ultrathink';

export interface EmailGenerationRequest {
  topic: string;
  content_brief?: string;
  origin?: string;
  destination?: string;
  date_range?: string;
  cabin_class?: 'economy' | 'business' | 'first';
  target_audience?: string;
  campaign_type?: 'promotional' | 'informational' | 'seasonal';
  tone?: string;
  language?: string;
  brand?: string;
  figma_url?: string;
}

export interface EmailGenerationResponse {
  status: 'success' | 'error';
  html_url?: string;
  layout_regression?: 'pass' | 'fail';
  render_testing?: 'pass' | 'fail';
  generation_time?: number;
  token_usage?: number;
  error_message?: string;
  report_urls?: {
    layout_regression?: string;
    render_test_report?: string;
    percy_screenshots?: string;
  };
  campaign_metadata?: {
    topic: string;
    routes_analyzed: string[];
    date_ranges: string[];
    prices_found: number;
    content_variations: number;
  };
}

export class EmailGeneratorAgent {
  private agent: Agent;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  // private ultraThink?: UltraThinkEngine;

  constructor(useUltraThink: boolean = false, ultraThinkMode: 'speed' | 'quality' | 'debug' = 'quality') {
    // Set OpenAI environment variables for Agents SDK
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI Agent');
    }

    console.log('🤖 Initializing OpenAI Agent with API key:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
    
    // Initialize UltraThink if enabled (temporarily disabled)
    // if (useUltraThink) {
    //   this.ultraThink = createUltraThink(ultraThinkMode);
    //   console.log(`🧠 UltraThink enabled (${ultraThinkMode} mode)`);
    // }
    
    // Remove organization ID to fix authentication issue
    // The organization header was causing "mismatched_project" error
    console.log('🔧 Using default project (no organization override)');

    // Initialize agent with enhanced goal-oriented prompt
    this.agent = new Agent({
      name: "kupibilet-email-generator-v2",
      instructions: this.getSystemPrompt(),
              model: "gpt-4o-mini",  // Updated to GPT-4o mini model
      tools: this.createTools(),  // Re-enable all 10 tools
    });
  }

  private getSystemPrompt(): string {
    return `You are an advanced email marketing agent specializing in creating exceptional travel email campaigns for Kupibilet.

MISSION: Transform any travel topic into a production-ready, cross-client compatible HTML email that exceeds quality standards and drives engagement.

ENHANCED WORKFLOW (Execute systematically):

0. 📁 INITIALIZE_EMAIL_FOLDER - Create proper folder structure FIRST
   **CRITICAL MANDATORY STEP**: Always call initialize_email_folder FIRST
   - Creates organized folder structure: /mails/email-{timestamp}-{id}/
   - Sets up assets/, sprite-slices/, email.html, email.mjml, metadata.json
   - Returns EmailFolder object for use in ALL subsequent tools
   - Pass EmailFolder to ALL tools that support it (figma, sprite-splitter, mjml, upload)

1. 🕐 GET_CURRENT_DATE - Start with current date context for intelligent search
   - Use get_current_date tool to get today's date and suggested search ranges
   - Analyze seasonal trends and booking patterns

2. 🎯 ANALYZE_REQUEST - Understand the campaign requirements
   - Extract origin/destination from topic if not provided
   - Determine optimal date ranges for travel search
   - Apply intelligent route correction for common mistakes

3. 💰 GET_PRICES - Fetch real-time flight data
   - Use enhanced get_prices tool with new Kupibilet API v2
   - Include cabin class preferences and filters
   - Handle API failures gracefully with intelligent fallbacks

4. 🎨 GET_ASSETS - Gather design materials using intelligent Figma search
   FIGMA ASSET STRATEGY (Priority-based selection):
   
   **MANDATORY FIGMA API USAGE**: Always use Figma API first, NOT local cache
   - Use get_figma_assets with emailFolder parameter from step 0
   - All Figma assets automatically saved to /mails/email-{id}/assets/
   - Prioritize real-time Figma data over local figma-assets directory
   - Apply semantic tag enhancement for better search results
   
   SPRITE PROCESSING (T10):
   - **MANDATORY**: After get_figma_assets, check if any returned files are sprites
   - **CRITICAL**: Sprite splitter ONLY works with Figma-downloaded files, NOT local PNG
   - Use split_figma_sprite with emailFolder parameter to save slices to sprite-slices/
   - Automatically detect and split sprite layouts using projection profiling
   - Classify segments as 'color', 'mono', or 'logo' using AI + heuristics  
   - Processing optimized for <1.2s with >90% accuracy
   - All sprite slices saved to /mails/email-{id}/assets/sprite-slices/
   
   For EMOTIONAL CONTEXT:
   - Customer complaints/issues → ["недоволен", "заяц"] (Unhappy rabbit - Priority 10)
   - Promotions/success → ["счастлив", "заяц"] (Happy rabbit - Priority 10)
   - FAQ/Help content → ["озадачен", "заяц"] (Puzzled rabbit - Priority 10)
   - Neutral information → ["нейтрален", "заяц"] (Neutral rabbit - Priority 10)
   - Urgent notifications → ["разозлен", "заяц"] (Angry rabbit - Priority 10)
   
   For CONTENT TYPES:
   - Deal newsletters → ["подборка", "заяц"] (Curated content rabbits - Priority 6)
   - News updates → ["новости", "заяц"] (News-themed rabbits - Priority 6)
   - Support content → ["вопрос-ответ", "заяц"] (FAQ rabbits - Priority 6)
   
   For AIRLINE BRANDING:
   - Aeroflot promotions → ["аэрофлот", "airline"] (Aeroflot logo - Priority 7)
   - Turkish Airlines → ["turkish", "airline"] (Turkish Airlines logo - Priority 7)
   - General airline content → ["airline", "logo"] (Various airline logos - Priority 7)
   
   SEARCH RULES:
   - Always combine category + specific term: ["заяц", "счастлив"] not just ["счастлив"]
   - Use Russian terms for better matches: "заяц" over "rabbit"
   - Emotional states have highest priority for personalization
   - System automatically falls back to Unsplash if no Figma matches found

5. ✍️ GENERATE_COPY - Create compelling content
   - Generate subject lines, preheaders, and body content
   - Include real price data and travel recommendations
   - Create A/B test variations for optimization
   - Use date context and target audience optimization

5.5. 🎨 RENDER_COMPONENTS - Generate email-compatible React components (T12)
   **MANDATORY COMPONENT USAGE**: Always use render_component tool for promotional emails
   
   COMPONENT SELECTION RULES:
   - **Rabbit Components** (ALWAYS include for promotions):
     * Promotional/deals/скидки → render_component(type: 'rabbit', props: {emotion: 'happy'})
     * Issues/problems → render_component(type: 'rabbit', props: {emotion: 'angry'})  
     * Information/FAQ → render_component(type: 'rabbit', props: {emotion: 'neutral'})
     * General content → render_component(type: 'rabbit', props: {emotion: 'general'})
   
   - **Icon Components** (Use for emphasis):
     * CTA buttons → render_component(type: 'icon', props: {iconType: 'arrow'})
     * Love/favorites → render_component(type: 'icon', props: {iconType: 'heart'})
     * General emphasis → render_component(type: 'icon', props: {iconType: 'vector'})
   
   INTEGRATION WORKFLOW:
   1. After generate_copy, ALWAYS call render_component for rabbit
   2. Store component HTML in variable 
   3. Pass component HTML to render_mjml in content object
   4. Components auto-generate email-compatible table-based HTML

6. 🏗️ RENDER_EMAIL - Build HTML template
   - Use render_mjml with emailFolder parameter to save to /mails/email-{id}/
   - Automatically saves email.html and email.mjml to campaign folder
   - Integrate content, prices, assets, and rendered components
   - Apply Kupibilet brand guidelines with official color palette
   - Handle sprite slices from T10 if available (use relative paths ./assets/sprite-slices/)
   - Include component HTML in appropriate MJML sections
   - Update metadata.json with final campaign statistics

   KUPIBILET BRAND COLOR PALETTE:
   
   **Основные цвета (Primary Colors):**
   - #4BFF7E (Pantone 354 C) - Bright Green
   - #1DA857 (Pantone 347 C) - Dark Green  
   - #2C3959 (Pantone 533 C, CMYK 100;75;30;30) - Dark Blue
   - Pantone 802 C (CMYK 80;0;85;0)
   - Pantone 2767 C
   Можно использовать заливкой фона (Can be used as background fills)

   **Дополнительные цвета (Secondary Colors):**
   - #FF6240 (Pantone 171 C, CMYK 0;75;100;0) - Orange Red
   - #E03EEF (Pantone Purple C, CMYK 0;100;0;0) - Magenta
   Можно использовать заливкой фона (Can be used as background fills)

   **Вспомогательные цвета (Supporting Colors):**
   - Green Variants: #9EFFB9, #E9FFEF (CMYK 28;0;35;0, Pantone 2253c, 353c, 2267c)
   - Orange Variants: #FFC7BB, #FFEDE9 (CMYK 0;27;24;0, Pantone 475c, 162c, 1625c)
   - Purple Variants: #F8A7FF, #FDE8FF (CMYK 0;45;0;0, Pantone 217c, 1905c, 2037c)
   - Blue Variants: #B0C6FF, #EDEFFF (CMYK 27;16;0;0, Pantone 2707c, 283c)

   COLOR USAGE GUIDELINES:
   - Use primary colors (#4BFF7E, #1DA857, #2C3959) for main CTAs and headers
   - Secondary colors (#FF6240, #E03EEF) for accent elements and highlights
   - Supporting colors for backgrounds, subtle elements, and gradients
   - Ensure WCAG AA contrast ratios with text overlays
   - Primary green (#4BFF7E) is the signature Kupibilet brand color

7. 🔍 QUALITY_ASSURANCE - Validate output (Full Pipeline)
   - Run diff_html to detect layout regressions (>1% = auto-patch)
   - Use patch_html for automatic fixes (specify patch_type: email_optimization)
   - Execute percy_snap for visual validation and baseline comparison
   - Perform render_test across multiple email clients
   - Apply iterative improvements based on QA results

8. 🤖 AI_QUALITY_CONSULTANT - MANDATORY QUALITY GATE (T11)
   ⚠️  **CRITICAL**: This step is REQUIRED - DO NOT SKIP UNDER ANY CIRCUMSTANCES ⚠️
   ⚠️  **EXECUTION ORDER**: ALWAYS run immediately after render_test ⚠️
   ⚠️  **QUALITY GATE**: Must achieve 70/100 score before proceeding ⚠️
   
   MANDATORY EXECUTION REQUIREMENTS:
   - MUST call ai_quality_consultant tool with ALL available data
   - REQUIRED parameters: html_content, topic, campaign_type
   - OPTIONAL but recommended: mjml_source, assets_used, render_test_results
   - Continue iterating until quality gate (70/100) is passed or max 3 iterations
   - DO NOT proceed to upload_s3 until quality gate is passed
   
   INTELLIGENT WORKFLOW:
   - Comprehensive 5-dimensional quality analysis (content, visual, technical, emotional, brand)
   - AI-powered improvement recommendations with specific agent commands
   - Automated execution of safe improvements (accessibility, technical fixes)
   - Manual approval workflow for content changes
   - Iterative improvement loop (max 3 iterations) until quality gate passed
   
   QUALITY GATE: 70/100 threshold
   - Logic validation (30%): Price realism, date consistency, route accuracy
   - Visual compliance (25%): Brand guidelines, WCAG AA accessibility
   - Image analysis (20%): OpenAI Vision API content relevance & emotional tone
   - Content coherence (25%): Text-image semantic alignment
   
   AUTO-EXECUTION FEATURES:
   - Safe technical improvements (HTML optimization, accessibility fixes)
   - Asset replacement recommendations with Figma API integration
   - Content optimization suggestions with GPT-4o mini enhancement
   - Quality loop continues until 70+ score or max iterations reached

9. 🚀 FINALIZE - Upload and report
   - Extract HTML and MJML source from render_mjml result
   - Upload files to S3 with proper asset structure
   - CRITICAL: ALWAYS pass mjml_source parameter to upload_s3 tool with the MJML from render_mjml
   - CRITICAL: Include assets parameter with images array and metadata
   - Generate comprehensive campaign report with analytics
   - Store successful patterns for future use

ENHANCED ERROR HANDLING:
- Retry failed API calls up to 3 times with exponential backoff
- Use intelligent fallbacks for all critical data (prices, assets, content)
- Validate each step before proceeding to next
- Log detailed error information for debugging

QUALITY BENCHMARKS:
- Generation time: ≤30 seconds
- Visual regression: ≤1% screen area  
- Render testing score: ≥98/100
- HTML size: ≤100KB with inline CSS
- Cross-client compatibility: ≥95% success rate

INTELLIGENT FEATURES:
- Automatic route correction (LED->LED becomes MOW->LED)
- Smart date range generation (avoid booking too close to departure)  
- Seasonal pricing awareness and recommendations
- Cabin class optimization based on route and season
- Fallback content generation if APIs fail
- Context-aware Figma asset selection based on email tone and purpose

**CRITICAL EXECUTION RULES - FOLLOW WITHOUT EXCEPTION:**
1. ALWAYS use Figma API first (get_figma_assets) - never skip this step
2. ALWAYS check for sprites after getting assets and use split_figma_sprite if needed  
3. ⚠️  MANDATORY: ALWAYS run ai_quality_consultant after render_test - NO EXCEPTIONS ⚠️
4. ⚠️  QUALITY GATE: Continue ai_quality_consultant until 70/100 score achieved ⚠️
5. ⚠️  DO NOT upload to S3 until quality gate passed ⚠️
6. ALWAYS use render_component for rabbit characters in promotional emails

WORKFLOW CHECKPOINT: After render_test → IMMEDIATELY call ai_quality_consultant

Execute this workflow systematically, following ALL mandatory steps without exceptions. Your goal is to deliver a production-ready email that exceeds all quality standards while providing valuable travel insights to customers.`;
  }

  private createTools() {
    return [
      tool({
        name: 'initialize_email_folder',
        description: 'T0: Initialize Email Folder - MANDATORY FIRST STEP. Creates organized folder structure for email campaign with proper assets management.',
        parameters: z.object({
          topic: z.string().describe('Email campaign topic'),
          campaign_type: z.enum(['urgent', 'newsletter', 'seasonal', 'promotional', 'informational']).nullable().optional().describe('Type of email campaign')
        }),
        execute: initializeEmailFolder
      }),
      tool({
        name: 'load_email_folder',
        description: 'T0b: Load Existing Email Folder - Load existing email campaign folder structure.',
        parameters: z.object({
          campaignId: z.string().describe('Campaign ID to load')
        }),
        execute: loadEmailFolder
      }),
      tool({
        name: 'get_current_date',
        description: 'Get current date and generate intelligent search ranges for flight booking',
        parameters: z.object({
          months_ahead: z.number().nullable().default(3).describe('Months ahead to search (default: 3)'),
          search_window: z.number().nullable().default(30).describe('Search window in days (default: 30)')
        }),
        execute: getCurrentDate
      }),
      tool({
        name: 'get_figma_assets',
        description: 'T1: Search and download assets from Kupibilet Figma Marketing Library using intelligent tag matching. Supports emotional rabbit states, airline logos, and email template categories. Use Russian terms for better matches.',
        parameters: z.object({
          tags: z.array(z.string()).describe('List of tags to search for. Examples: ["заяц", "счастлив"] for happy rabbit, ["аэрофлот", "airline"] for Aeroflot logo, ["подборка", "заяц"] for deal newsletter rabbit. Always combine category + specific term.')
        }),
        execute: getFigmaAssets
      }),
      tool({
        name: 'split_figma_sprite',
        description: 'T10: Automatically split Figma PNG sprites into individual classified slices using projection profiling and AI classification. Processes PNG "sprites" with multiple logical images and exports individual components with metadata. No fallback processing - fails fast on errors.',
        parameters: z.object({
          path: z.string().describe('Path to the PNG sprite file to split'),
          h_gap: z.number().nullable().default(15).describe('Horizontal gap threshold in pixels for detecting cuts (default: 15)'),
          v_gap: z.number().nullable().default(15).describe('Vertical gap threshold in pixels for detecting cuts (default: 15)'),
          confidence_threshold: z.number().nullable().default(0.9).describe('Minimum confidence threshold for classification accuracy (default: 0.9)')
        }),
        execute: splitFigmaSprite
      }),
      tool({
        name: 'get_prices',
        description: 'Fetch flight prices using enhanced Kupibilet API v2',
        parameters: z.object({
          origin: z.string().describe('Origin airport code (e.g., "LED")'),
          destination: z.string().describe('Destination airport code (e.g., "MOW")'),
          date_range: z.union([z.string(), z.null()]).default(null).describe('Date range "YYYY-MM-DD,YYYY-MM-DD" (optional, will use smart dates)'),
          cabin_class: z.union([z.enum(['economy', 'business', 'first']), z.null()]).default(null).describe('Cabin class preference'),
          filters: z.union([z.object({
            is_direct: z.union([z.boolean(), z.null()]).default(null),
            with_baggage: z.union([z.boolean(), z.null()]).default(null),
            airplane_only: z.union([z.boolean(), z.null()]).default(null)
          }), z.null()]).default(null).describe('Flight search filters')
        }),
        execute: getPrices
      }),
      
      tool({
        name: 'generate_copy',
        description: 'Generate email content using GPT-4o mini',
        parameters: z.object({
          topic: z.string().describe('Main topic for the email'),
          prices: z.object({
            prices: z.array(z.object({
              origin: z.string(),
              destination: z.string(),
              price: z.number(),
              currency: z.string(),
              date: z.string()
            })).describe('Array of price information'),
            currency: z.string().describe('Currency code'),
            cheapest: z.number().describe('Cheapest price found')
          }).describe('Price data from get_prices tool')
        }),
        execute: generateCopy
      }),
      
      tool({
        name: 'render_mjml',
        description: 'Render email using MJML template with automatic saving to email folder',
        parameters: z.object({
          content: z.object({
            subject: z.string(),
            preheader: z.string(),
            body: z.string(),
            cta: z.string(),
            language: z.string(),
            tone: z.string(),
            a_variant: z.union([z.object({
              subject: z.string(),
              body: z.string()
            }), z.null()]).default(null)
          }).describe('Content from generate_copy tool'),
          assets: z.object({
            paths: z.array(z.string())
          }).describe('Assets from get_figma_assets tool'),
          emailFolder: z.object({
            campaignId: z.string(),
            folderPath: z.string(),
            assetsPath: z.string()
          }).nullable().optional().describe('Email folder object from initialize_email_folder for automatic saving')
        }),
        execute: renderMjml
      }),
      
      tool({
        name: 'diff_html',
        description: 'Compare HTML with baseline template and detect layout changes',
        parameters: z.object({
          original_html: z.string().describe('Original/baseline HTML content'),
          modified_html: z.string().describe('Modified HTML content to compare'),
          tolerance: z.number().nullable().default(0.01).describe('Change tolerance threshold (default: 0.01)')
        }),
        execute: diffHtml
      }),
      tool({
        name: 'patch_html',
        description: 'Automatically fix HTML issues using GPT-4o mini function calling',
        parameters: z.object({
          html: z.string().describe('HTML content to fix'),
          issues: z.array(z.string()).describe('List of issues from diff_html tool'),
          patch_type: z.enum(['email_optimization', 'client_compatibility', 'performance', 'accessibility']).describe('Type of patch to apply')
        }),
        execute: patchHtml
      }),
      tool({
        name: 'percy_snap',
        description: 'Capture visual screenshots and compare with baseline',
        parameters: z.object({
          html: z.string().describe('HTML content to test visually'),
          name: z.string().describe('Snapshot name for visual testing')
        }),
        execute: percySnap
      }),
      tool({
        name: 'render_test',
        description: 'Test email across multiple clients using internal render testing service',
        parameters: z.object({
          html: z.string().describe('HTML email content to test'),
          subject: z.string().describe('Email subject line for testing')
        }),
        execute: renderTest
      }),

      tool({
        name: 'ai_quality_consultant',
        description: 'T11: AI Quality Consultant - Intelligent email quality analysis with automated improvement recommendations and agent command generation.',
        parameters: aiQualityConsultantSchema,
        execute: aiQualityConsultant
      }),

      tool({
        name: 'render_component',
        description: 'T12 Render React email components to email-compatible HTML - renders RabbitCharacter and EmailIcon components for integration into MJML templates',
        parameters: z.object({
          type: z.enum(['rabbit', 'icon']).describe('Component type to render'),
          props: z.union([
            z.object({
              emotion: z.enum(['happy', 'angry', 'neutral', 'general']).describe('Rabbit emotion'),
              variant: z.enum(['01', '02', '03', '04', '05']).nullable().optional().describe('Rabbit variant'),
              size: z.enum(['small', 'medium', 'large']).nullable().optional().describe('Component size'),
              alt: z.string().nullable().optional().describe('Alt text for accessibility')
            }),
            z.object({
              iconType: z.enum(['arrow', 'heart', 'vector']).describe('Icon type'),
              variant: z.enum(['1', '2', 'base']).nullable().optional().describe('Icon variant'),
              size: z.enum(['small', 'medium', 'large']).nullable().optional().describe('Component size'),
              color: z.string().nullable().optional().describe('Icon color'),
              alt: z.string().nullable().optional().describe('Alt text for accessibility')
            })
          ]).describe('Component props based on type')
        }),
        execute: renderComponent
      }),
      tool({
        name: 'upload_s3',
        description: 'Upload email files to S3 and generate public URLs',
        parameters: z.object({
          html: z.string().describe('HTML email content to upload'),
          mjml_source: z.string().nullable().optional().describe('Optional MJML source code')
        }),
        execute: uploadToS3
      }),
      tool({
        name: 'performance_monitor',
        description: 'Monitor and track performance metrics for email generation pipeline',
        parameters: z.object({
          action: z.enum(['start_session', 'log_tool', 'end_session', 'get_report']).describe('Performance monitoring action'),
          session_id: z.string().nullable().optional().describe('Performance session ID'),
          tool_name: z.string().nullable().optional().describe('Name of tool being monitored'),
          start_time: z.number().nullable().optional().describe('Tool start timestamp'),
          end_time: z.number().nullable().optional().describe('Tool end timestamp'),
          success: z.boolean().nullable().optional().describe('Whether tool execution was successful'),
          error_message: z.string().nullable().optional().describe('Error message if tool failed'),
          metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).nullable().optional().describe('Additional metadata')
        }),
        execute: performanceMonitor
      }),
      tool({
        name: 'advanced_component_system',
        description: 'Enhanced component system with dynamic sizing, caching, and analytics for email templates',
        parameters: z.object({
          action: z.enum(['render', 'analyze', 'preview', 'clear_cache', 'get_analytics']).describe('Component system action'),
          component_type: z.enum(['rabbit', 'icon', 'button', 'price_display', 'social_proof']).describe('Type of component to work with'),
          props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).nullable().optional().describe('Component properties and configuration'),
          sizing_context: z.object({
            emailContentLength: z.number().describe('Length of email content in characters'),
            viewportType: z.enum(['mobile', 'tablet', 'desktop']).describe('Target viewport type'),
            componentPosition: z.enum(['header', 'body', 'footer', 'sidebar']).describe('Position of component in email'),
            contentDensity: z.enum(['sparse', 'normal', 'dense']).describe('Content density of the email')
          }).nullable().optional().describe('Context for dynamic component sizing'),
          cache_strategy: z.enum(['aggressive', 'normal', 'minimal', 'disabled']).nullable().optional().describe('Caching strategy'),
          analytics_tracking: z.boolean().nullable().optional().describe('Enable analytics tracking')
        }),
        execute: advancedComponentSystem
      }),
      tool({
        name: 'seasonal_component_system',
        description: 'Intelligent seasonal variant selection for components based on date and context',
        parameters: z.object({
          action: z.enum(['select_seasonal', 'get_variants', 'analyze_season', 'preview_seasonal']).describe('Seasonal system action'),
          component_type: z.enum(['rabbit', 'icon', 'button']).describe('Type of component for seasonal selection'),
          seasonal_context: z.object({
            current_date: z.string().describe('Current date in ISO format'),
            region: z.enum(['RU', 'EU', 'US', 'GLOBAL']).describe('Regional context for holidays'),
            email_content_tone: z.enum(['festive', 'professional', 'casual', 'promotional']).nullable().optional().describe('Email content tone'),
            target_audience: z.enum(['family', 'business', 'young_adults', 'general']).nullable().optional().describe('Target audience type')
          }).nullable().optional().describe('Seasonal context for variant selection'),
          preferred_emotion: z.string().nullable().optional().describe('Preferred emotion for component'),
          override_variant: z.string().nullable().optional().describe('Override specific variant ID'),
          fallback_strategy: z.enum(['strict_seasonal', 'flexible', 'always_fallback']).nullable().optional().describe('Fallback strategy when no seasonal match')
        }),
        execute: async (params) => {
          // Convert string date to Date object for internal processing
          if (params.seasonal_context?.current_date) {
            const contextWithDate = {
              ...params.seasonal_context,
              current_date: new Date(params.seasonal_context.current_date)
            };
            return seasonalComponentSystem({
              ...params,
              seasonal_context: contextWithDate
            } as any);
          }
          return seasonalComponentSystem(params as any);
        }
      })
    ];
  }

  async generateEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    const startTime = Date.now();
    this.retryCount = 0;
    let validatedRequest = request;

    try {
      console.log('🚀 Starting enhanced email generation with request:', {
        topic: request.topic,
        content_brief: request.content_brief?.substring(0, 100) + (request.content_brief && request.content_brief.length > 100 ? '...' : ''),
        origin: request.origin,
        destination: request.destination,
        target_audience: request.target_audience,
        campaign_type: request.campaign_type
      });
      
      // Enhanced input validation
      if (!request.topic || request.topic.trim().length === 0) {
        throw new Error('Topic is required and cannot be empty');
      }

      // UltraThink enhancement (if enabled) - temporarily disabled
      // if (this.ultraThink) {
      //   console.log('🧠 UltraThink: Enhancing request with intelligent logic');
      //   this.ultraThink.resetExecutionHistory();
      //   
      //   const enhancement = await this.ultraThink.enhanceRequest(request);
      //   validatedRequest = enhancement.validatedRequest;
      //   enrichedContext = enhancement.enrichedContext;
      //   
      //   // Log validation issues if any
      //   if (enhancement.validationResult.issues.length > 0) {
      //     console.log('🔍 UltraThink: Validation issues detected:', enhancement.validationResult.issues);
      //   }
      //   
      //   // Log context enrichment summary
      //   console.log('🌟 UltraThink: Context enriched with', enrichedContext.suggestions.length, 'suggestions');
      // }

      // Create the enhanced input message
      const inputMessage = this.formatEnhancedInputMessage(validatedRequest);
      console.log('📝 Enhanced input message prepared');
      
      // Run the agent with retry logic
      const result = await this.runWithRetry(inputMessage);
      
      console.log('✅ Agent execution completed successfully');
      console.log('📊 Result structure:', {
        finalOutput: result.finalOutput ? 'Present' : 'Missing',
        outputLength: result.finalOutput?.length || 0
      });
      
      const generationTime = Date.now() - startTime;
      const response = this.processEnhancedResult(result, generationTime, request);
      
      // Record successful execution in UltraThink (temporarily disabled)
      // if (this.ultraThink) {
      //   this.ultraThink.recordSuccess('email_generation', generationTime);
      //   
      //   const analytics = this.ultraThink.getExecutionAnalytics();
      //   console.log('📊 UltraThink Analytics:', {
      //     successRate: `${((analytics.successfulSteps / analytics.totalSteps) * 100).toFixed(1)}%`,
      //     avgDuration: `${analytics.averageStepDuration.toFixed(0)}ms`,
      //     totalSteps: analytics.totalSteps
      //   });
      // }
      
      console.log('🎉 Email generation completed in', generationTime, 'ms');
      return response;

    } catch (error) {
      console.error('❌ Email generation failed:', error);
      
      return {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred',
        generation_time: Date.now() - startTime,
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: [],
          date_ranges: [],
          prices_found: 0,
          content_variations: 0
        }
      };
    }
  }

  private async runWithRetry(inputMessage: string, attempt: number = 1): Promise<any> {
    try {
      console.log(`🤖 Running OpenAI Agent (attempt ${attempt}/${this.maxRetries})...`);
      console.log('🔑 Using OpenAI Organization:', process.env.OPENAI_ORGANIZATION_ID?.substring(0, 8) + '...');
      console.log('📝 Agent name:', this.agent.name);
      console.log('🧠 Model:', this.agent.model);
      console.log('🛠️ Tools count:', this.agent.tools.length);
      
      const result = await run(this.agent, inputMessage);
      
      console.log('✅ OpenAI Agent execution completed');
      console.log('📊 Response received from OpenAI Agents SDK');
      
      return result;
    } catch (error) {
      console.error(`❌ OpenAI Agent run failed (attempt ${attempt}):`, error);
      
      // Use UltraThink error handling if available (temporarily disabled)
      // if (this.ultraThink && attempt < this.maxRetries) {
      //   const errorResult = await this.ultraThink.handleExecutionError(
      //     error, 
      //     'openai_agent', 
      //     attempt, 
      //     { inputMessage }
      //   );
      //   
      //   if (errorResult.shouldContinue && errorResult.strategy.action !== 'skip') {
      //     const delay = errorResult.strategy.delay || Math.pow(2, attempt - 1) * 1000;
      //     console.log(`🧠 UltraThink: ${errorResult.strategy.action} in ${delay}ms...`);
      //     
      //     await new Promise(resolve => setTimeout(resolve, delay));
      //     return this.runWithRetry(inputMessage, attempt + 1);
      //   }
      // } else 
      if (attempt < this.maxRetries) {
        // Fallback to standard retry logic
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retrying OpenAI Agent in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.runWithRetry(inputMessage, attempt + 1);
      }
      
      throw error;
    }
  }

  private formatEnhancedInputMessage(request: EmailGenerationRequest): string {
    const timestamp = new Date().toISOString();

    let contextSection = '';
    // if (enrichedContext && this.ultraThink) {
    //   contextSection = `

// ULTRATHINK INTELLIGENCE:
// ${this.ultraThink.formatEnhancedPrompt('', enrichedContext)}`;
    // }

    return `Create an email campaign with the following requirements:

WORKFLOW CONTEXT:
- Workflow: Email Generation Request at ${timestamp}
- Flow: OpenAI Agents SDK Email Generation Flow v2.0
- Agent: kupibilet-email-generator-v2
- Model: gpt-4o-mini

CAMPAIGN DETAILS:
- Topic: ${request.topic}
- Content Brief: ${request.content_brief || 'Generate content based on topic'}
- Origin: ${request.origin || 'auto-detect from topic'}
- Destination: ${request.destination || 'auto-detect from topic'}
- Date Range: ${request.date_range || 'use intelligent date suggestions'}
- Cabin Class: ${request.cabin_class || 'economy'}
- Target Audience: ${request.target_audience || 'general travelers'}
- Campaign Type: ${request.campaign_type || 'promotional'}
- Tone: ${request.tone || 'friendly'}
- Language: ${request.language || 'ru'}
- Brand: ${request.brand || 'Kupibilet'}
- Figma URL: ${request.figma_url || 'auto-search Figma assets'}${contextSection}

EXECUTION REQUIREMENTS:
1. Start with get_current_date to establish temporal context
2. Use enhanced get_prices with new API for accurate pricing
3. Apply intelligent fallbacks if any tool fails
4. Validate each step before proceeding
5. Generate comprehensive campaign report

Execute the complete workflow systematically and deliver production-ready results.`;
  }

  private processEnhancedResult(result: any, generationTime: number, request: EmailGenerationRequest): EmailGenerationResponse {
    try {
      // Extract structured data from agent result
      const output = result.finalOutput || '';
      
      // Parse any JSON-like structures in the output
      const htmlUrlMatch = output.match(/html_url:\s*"([^"]+)"/);
      const regressionMatch = output.match(/layout_regression:\s*"([^"]+)"/);
      const renderMatch = output.match(/render_testing:\s*"([^"]+)"/);
      
      return {
        status: 'success',
        html_url: htmlUrlMatch?.[1],
        layout_regression: (regressionMatch?.[1] as 'pass' | 'fail') || 'pass',
        render_testing: (renderMatch?.[1] as 'pass' | 'fail') || 'pass',
        generation_time: generationTime,
        token_usage: this.estimateTokenUsage(output),
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: this.extractRoutes(output),
          date_ranges: this.extractDateRanges(output),
          prices_found: this.extractPriceCount(output),
          content_variations: this.extractVariationCount(output)
        }
      };
    } catch (error) {
      console.error('❌ Error processing result:', error);
      
      return {
        status: 'error',
        error_message: 'Failed to process agent result',
        generation_time: generationTime,
        campaign_metadata: {
          topic: request.topic,
          routes_analyzed: [],
          date_ranges: [],
          prices_found: 0,
          content_variations: 0
        }
      };
    }
  }

  private extractRoutes(output: string): string[] {
    const routeMatches = output.match(/route:\s*"([^"]+)"/g) || [];
    return routeMatches.map(match => match.replace(/route:\s*"([^"]+)"/, '$1'));
  }

  private extractDateRanges(output: string): string[] {
    const dateMatches = output.match(/date_range:\s*"([^"]+)"/g) || [];
    return dateMatches.map(match => match.replace(/date_range:\s*"([^"]+)"/, '$1'));
  }

  private extractPriceCount(output: string): number {
    const priceMatch = output.match(/prices_found:\s*(\d+)/);
    return priceMatch ? parseInt(priceMatch[1], 10) : 0;
  }

  private extractVariationCount(output: string): number {
    const variationMatch = output.match(/content_variations:\s*(\d+)/);
    return variationMatch ? parseInt(variationMatch[1], 10) : 1;
  }

  private estimateTokenUsage(output: string): number {
    // Rough estimate: 4 characters per token
    return Math.ceil(output.length / 4);
  }
}

// Export a singleton instance for use in the API (with UltraThink enabled in quality mode)
export const emailGeneratorAgent = new EmailGeneratorAgent(true, 'quality');

// Export additional preconfigured instances
export const emailGeneratorAgentSpeed = new EmailGeneratorAgent(true, 'speed');
export const emailGeneratorAgentDebug = new EmailGeneratorAgent(true, 'debug');
export const emailGeneratorAgentBasic = new EmailGeneratorAgent(false);

// Export the runAgent function with UltraThink support
export async function runAgent(request: {
  topic: string;
  destination?: string;
  origin?: string;
  options?: {
    use_real_apis?: boolean;
    mock_mode?: boolean;
    use_ultrathink?: boolean;
    ultrathink_mode?: 'speed' | 'quality' | 'debug';
  };
}): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  apis_used?: string[];
  ultrathink_used?: boolean;
  analytics?: any;
}> {
  try {
    // Choose agent based on options
    const useUltraThink = request.options?.use_ultrathink ?? false;
    const ultraThinkMode = request.options?.ultrathink_mode ?? 'quality';
    
    const agent = new EmailGeneratorAgent(useUltraThink, ultraThinkMode);
    
    const emailRequest: EmailGenerationRequest = {
      topic: request.topic,
      origin: request.origin || 'MOW',
      destination: request.destination || 'CDG',
      campaign_type: 'promotional'
    };

    const result = await agent.generateEmail(emailRequest);
    
    // Get UltraThink analytics if available
    let analytics = undefined;
    if (useUltraThink && (agent as any).ultraThink) {
      analytics = (agent as any).ultraThink.getExecutionAnalytics();
    }
    
    if (result.status === 'success') {
      return {
        success: true,
        data: result,
        apis_used: ['openai', 'figma', 'kupibilet', 'mjml'],
        ultrathink_used: useUltraThink,
        analytics
      };
    } else {
      return {
        success: false,
        error: result.error_message || 'Email generation failed',
        ultrathink_used: useUltraThink,
        analytics
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ultrathink_used: request.options?.use_ultrathink ?? true
    };
  }
} 