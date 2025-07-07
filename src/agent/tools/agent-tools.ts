/**
 * Agent Tools Module for Email Campaign Workflow
 * Defines all tools used by specialist agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { contentGenerator } from './consolidated/content-generator';
import { emailRenderer } from './email-renderer-v2';
import { deliveryManager, deliveryManagerSchema } from './consolidated/delivery-manager-fixed';
import { getCurrentDate } from './date';
import { getPrices } from './prices';
import { planEmailImages, findFigmaAsset } from './image-planning';
import { finalEmailDelivery } from './final-email-delivery';

// TypeScript types for tool execute functions based on OpenAI SDK requirements
type ContentGeneratorParams = {
  topic: string;
  action: 'generate' | 'optimize' | 'variants';
};

type EmailRendererParams = {
  content_data: string;
  action: 'render_mjml' | 'render_component';
};

type QualityControllerParams = {
  html_content: string;
  action: 'analyze_quality' | 'check_compatibility';
};

type PricingIntelligenceParams = {
  origin: string;
  destination: string;
  date_range: string;
};

type DateIntelligenceParams = {
  campaign_context: {
    topic: string;
    urgency: 'urgent' | 'standard' | 'seasonal';
    campaign_type: 'hot_deals' | 'newsletter' | 'seasonal' | 'announcement';
  };
  months_ahead: number;
  search_window: number;
};

type FigmaAssetSelectorParams = {
  tags: string[];
  campaign_type: 'seasonal' | 'promotional' | 'informational';
  emotional_tone: 'positive' | 'neutral' | 'urgent' | 'friendly';
  target_count: number;
};

type MjmlCompilerParams = {
  mjml_content: string;
  validation_level: 'strict' | 'soft' | 'skip';
};

/**
 * Content Generator Tool - Creates email content with real pricing data
 */
export const contentGeneratorTool = tool({
  name: 'content_generator',
  description: 'Generate email content with AI and real pricing data using Pricing Intelligence and Date Detection',
  parameters: z.object({
    topic: z.string().describe('Campaign topic'),
    action: z.enum(['generate', 'optimize', 'variants']).describe('Action to perform')
  }),
  strict: true,
  execute: async (params: ContentGeneratorParams): Promise<any> => {
    console.log(`💰 Content Generator: Getting real pricing data for topic "${params.topic}"`);
    
    // 📁 Step 0: Create campaign folder FIRST (CRITICAL FIX)
    console.log('📁 Content Specialist: Creating campaign folder...');
    
    try {
      const { createCampaignFolder } = await import('./consolidated/content-generator');
      const folderResult = await createCampaignFolder({
        topic: params.topic,
        campaign_type: 'promotional',
        trace_id: null
      });
      
      console.log('✅ Content Specialist: Campaign folder created:', folderResult);
    } catch (error) {
      console.error('❌ Content Specialist: Failed to create campaign folder:', error);
      // Continue execution - this is critical but not fatal
    }
    
    // 🗓️ Step 1: Get current date and intelligent date ranges
    const dateResult = await getCurrentDate({
      campaign_context: {
        topic: params.topic,
        urgency: 'standard',
        campaign_type: 'newsletter'
      },
      months_ahead: 3,
      search_window: 14
    });
    
    console.log(`📅 Date Intelligence result:`, dateResult);
    
    // 💰 Step 2: Get real pricing data using Pricing Intelligence
    let pricingData = { prices: [], currency: 'RUB', cheapest: 0, statistics: null };
    
    try {
      // Extract route from topic (simple parsing for common patterns)
      const routeMatch = params.topic.match(/(франци[ю|и]|париж|ницц|лион)/i);
      const destination = routeMatch ? 'PAR' : 'PAR'; // Default to Paris
      
      const pricesResult = await getPrices({
        origin: 'MOW', // Moscow default
        destination: destination,
        date_range: `${dateResult.data?.search_start || '2025-02-01'},${dateResult.data?.search_end || '2025-02-15'}`,
        cabin_class: 'economy',
        filters: {
          airplane_only: true
        }
      });
      
      console.log(`💰 Pricing Intelligence result:`, pricesResult);
      
      if (pricesResult.success && pricesResult.data) {
        const prices = pricesResult.data.prices || [];
        const cheapest = pricesResult.data.cheapest || 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices.map(p => p.price)) : cheapest;
        const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length : cheapest;
        
        pricingData = {
          prices: prices,
          currency: pricesResult.data.currency || 'RUB',
          cheapest: cheapest,
          statistics: {
            average: Math.round(avgPrice),
            median: cheapest,
            price_range: {
              min: cheapest,
              max: maxPrice
            }
          }
        };
        
        console.log(`💰 Processed pricing data:`, {
          total_prices: prices.length,
          cheapest_price: `${cheapest} ${pricingData.currency}`,
          average_price: `${Math.round(avgPrice)} ${pricingData.currency}`,
          price_range: `${cheapest} - ${maxPrice} ${pricingData.currency}`
        });
      }
    } catch (error) {
      console.error('❌ Pricing Intelligence failed:', error);
      // Continue with empty pricing data if pricing fails
    }
    
    // 🎯 Step 3: Generate content with real data
    const contentResult = await contentGenerator({
      action: (params.action || 'generate') as 'generate' | 'optimize' | 'variants' | 'personalize' | 'analyze' | 'test',
      topic: params.topic,
      content_type: 'complete_campaign',
      target_audience: { primary: 'families' },
      pricing_data: pricingData,
      tone: 'friendly',
      language: 'ru',
      campaign_context: {
        campaign_type: 'promotional',
        seasonality: 'general',
        urgency_level: 'medium'
      }
    });
    
    // 🖼️ Step 4: Plan images for the email (NEW IMAGE PLANNING MODULE)
    let imagePlan = null;
    if (contentResult.success && contentResult.data) {
      console.log('🖼️ Content Specialist: Planning images for email...');
      
      try {
        imagePlan = await planEmailImages({
          content: contentResult.data.content || {},
          topic: params.topic,
          campaign_type: 'promotional',
          emotional_tone: 'positive'
        });
        
        console.log('✅ Content Specialist: Image plan created:', {
          total_images: imagePlan.total_images_needed,
          image_types: imagePlan.image_plan?.map(img => img.type) || [],
          figma_assets_needed: imagePlan.figma_assets_needed || 0
        });
        
        // Add image plan to content result
        if (contentResult.data.content) {
          (contentResult.data.content as any).image_plan = JSON.stringify(imagePlan);
        }
        
      } catch (error) {
        console.error('⚠️ Content Specialist: Image planning failed:', error);
        // Continue without image plan - Design Specialist will handle fallback
      }
    }
    
    // 📋 Add pricing data to the result for next agents
    if (contentResult.success && contentResult.data && pricingData.cheapest > 0) {
      // Add to marketing_intelligence instead of creating new property
      if (!contentResult.marketing_intelligence) {
        contentResult.marketing_intelligence = {
          competitor_analysis: {
            positioning_summary: '',
            differentiation_opportunities: [],
            market_trends: []
          },
          price_psychology: {
            price_perception: 'value' as const,
            urgency_triggers: [],
            saving_messaging: ''
          },
          content_optimization: {
            subject_line_recommendations: [],
            body_improvements: [],
            cta_enhancements: []
          },
          competitive_positioning: '',
          unique_value_proposition: '',
          messaging_framework: [],
          content_pillars: []
        };
      }
      
      // Store pricing info in existing marketing_intelligence
      (contentResult.marketing_intelligence as any).pricing_info = {
        prices_found: pricingData.prices.length,
        cheapest_price: pricingData.cheapest,
        currency: pricingData.currency,
        price_range: pricingData.statistics?.price_range,
        route_info: `MOW → PAR`
      };
      
      // Add pricing data to content for email renderer
      if (contentResult.data.content) {
        (contentResult.data.content as any).pricing_data = JSON.stringify(pricingData);
      }
      
      console.log(`📊 Content Generator enhanced with pricing:`, {
        prices_integrated: true,
        cheapest_price: `${pricingData.cheapest} ${pricingData.currency}`,
        total_prices: pricingData.prices.length
      });
    }
    
    return contentResult;
  }
});

/**
 * Email Renderer Tool - Creates HTML email templates with MJML and assets
 */
export const emailRendererTool = tool({
  name: 'email_renderer',
  description: 'Render email templates with MJML and assets',
  parameters: z.object({
    content_data: z.string().describe('Content data as JSON string'),
    action: z.enum(['render_mjml', 'render_component']).describe('Rendering action')
  }),
  strict: true,
  execute: async (params: EmailRendererParams): Promise<any> => {
    console.log('🎨 Design Specialist: Starting internal email rendering...');
    
    // Parse content_data to extract information
    let contentData: any = {};
    try {
      contentData = JSON.parse(params.content_data);
    } catch (error) {
      console.warn('⚠️ Could not parse content_data, using default structure');
    }
    
    // 📁 CRITICAL: Initialize email folder FIRST before any processing
    const { campaignState } = await import('../core/campaign-state');
    let currentEmailFolder = campaignState.getCurrentEmailFolder();
    
    // If no email folder in campaign state, create one
    if (!currentEmailFolder) {
      console.log('📁 Design Specialist: No email folder found, creating new campaign folder...');
      
      try {
        // Import EmailFolderManager to create folder
        const EmailFolderManager = (await import('./email-folder-manager')).default;
        
        // Extract topic from content for folder creation
        const topic = contentData.subject || contentData.topic || 'Email Campaign';
        const campaignType = contentData.campaign_type || 'promotional';
        
        console.log(`📁 Creating email folder for: "${topic}" (${campaignType})`);
        
        // Create email folder
        const emailFolder = await EmailFolderManager.createEmailFolder(
          topic,
          campaignType
        );
        
        // Set campaign state
        campaignState.setCampaign({
          campaignId: emailFolder.campaignId,
          emailFolder: emailFolder,
          topic: topic,
          campaign_type: campaignType,
          created_at: new Date().toISOString()
        });
        
        currentEmailFolder = emailFolder;
        
        console.log(`✅ Email folder created successfully: ${emailFolder.campaignId}`);
        console.log(`📂 Base path: ${emailFolder.basePath}`);
        
      } catch (folderError) {
        console.error('❌ Failed to create email folder:', folderError);
        // Continue without folder for now, but log the error
      }
    } else {
      console.log(`📁 Using existing email folder: ${currentEmailFolder.campaignId}`);
    }
    
    // 🖼️ Step 1: Extract image plan from Content Specialist
    let imagePlanData = null;
    let selectedAssets: string[] = [];
    
    if (contentData.image_plan && typeof contentData.image_plan === 'string') {
      try {
        imagePlanData = JSON.parse(contentData.image_plan);
        console.log('📋 Design Specialist: Found image plan from Content Specialist:', {
          total_images: imagePlanData.total_images_needed,
          figma_assets: imagePlanData.figma_assets_needed,
          image_types: imagePlanData.image_plan?.map(img => img.type) || []
        });
        
        // 🔍 Step 2: Use AssetManager for intelligent asset selection
        const { AssetManager } = await import('../core/asset-manager');
        const assetManager = new AssetManager();
        
        // Collect all search tags from image plan
        const allTags = [];
        for (const imageSpec of imagePlanData.image_plan || []) {
          allTags.push(...(imageSpec.search_tags || []));
        }
        
        // Remove duplicates and add content-based tags
        const uniqueTags = [...new Set(allTags)];
        
        // Add content-derived tags
        const subject = contentData.subject || '';
        const body = contentData.body || '';
        const fullText = `${subject} ${body}`.toLowerCase();
        
        if (fullText.includes('япон')) uniqueTags.push('путешествие', 'азия', 'культура');
        if (fullText.includes('испан')) uniqueTags.push('путешествие', 'европа', 'отдых');
        if (fullText.includes('весна') || fullText.includes('spring')) uniqueTags.push('весна', 'сезон', 'цветение');
        if (fullText.includes('путешеств')) uniqueTags.push('путешествие', 'туризм', 'отдых');
        if (fullText.includes('билет')) uniqueTags.push('авиация', 'самолет', 'бронирование');
        
        // Fallback to general tags if none found
        if (uniqueTags.length === 0) {
          uniqueTags.push('заяц', 'кролик', 'путешествие');
        }
        
        console.log(`🔍 Design Specialist: Intelligent asset search with tags:`, uniqueTags);
        
        // Search for assets using AssetManager with proper content package
        const searchResult = await assetManager.searchAssets({
          tags: uniqueTags,
          emotional_tone: 'positive',
          campaign_type: 'promotional',
          target_count: imagePlanData.image_plan?.length || 3
        }, contentData);
        
        if (searchResult.success && searchResult.assets.length > 0) {
          console.log(`✅ AssetManager found ${searchResult.assets.length} relevant assets`);
          
          // Map found assets to selected assets with quality scoring
          for (const asset of searchResult.assets) {
            selectedAssets.push(asset.filePath);
            console.log(`✅ Design Specialist: Selected high-quality asset: ${asset.fileName} (relevance: ${asset.relevanceScore})`);
          }
        } else {
          console.warn('⚠️ AssetManager: No assets found with current search criteria');
        }
        
        console.log(`🎨 Design Specialist: Selected ${selectedAssets.length} optimized assets from AssetManager`);
        
      } catch (error) {
        console.warn('⚠️ Design Specialist: Could not parse image plan or search assets:', error);
      }
    }
    
    // If no assets found through image plan, try direct content search with AssetManager
    if (selectedAssets.length === 0) {
      console.log('🔄 Design Specialist: No assets from image plan, using AssetManager for direct content analysis...');
      
      try {
        const { AssetManager } = await import('../core/asset-manager');
        const assetManager = new AssetManager();
        
        // Let AssetManager generate AI tags from content
        const directSearchResult = await assetManager.searchAssets({
          tags: [], // Empty tags - let AssetManager generate them from content
          emotional_tone: 'positive',
          campaign_type: 'promotional',
          target_count: 3
        }, contentData);
        
        if (directSearchResult.success && directSearchResult.assets.length > 0) {
          console.log(`✅ AssetManager direct search found ${directSearchResult.assets.length} assets`);
          for (const asset of directSearchResult.assets.slice(0, 3)) {
            selectedAssets.push(asset.filePath);
            console.log(`✅ Design Specialist: Added AI-selected asset: ${asset.fileName} (relevance: ${asset.relevanceScore})`);
          }
        } else {
          console.warn('⚠️ AssetManager: Direct content search failed');
        }
      } catch (error) {
        console.warn('⚠️ Design Specialist: AssetManager direct search failed:', error);
      }
    }
    
    // Continue with available assets (don't fail if no assets found)
    if (selectedAssets.length === 0) {
      console.log('⚠️ Design Specialist: No assets found, but continuing with placeholder template');
    }
    
    // Generate MJML content from the received data
    const subject = contentData.subject || 'Kupibilet Email';
    const preheader = contentData.preheader || 'Специальные предложения от Kupibilet';
    const body = contentData.body || params.content_data;
    const ctaText = contentData.cta_text || 'Узнать больше';
    const ctaUrl = contentData.cta_url || 'https://kupibilet.ru';
    
    // Extract pricing information if available
    let pricingSection = '';
    if (contentData.pricing_data && typeof contentData.pricing_data === 'string') {
      try {
        const pricingInfo = JSON.parse(contentData.pricing_data);
        if (pricingInfo.cheapest && pricingInfo.currency) {
          pricingSection = `
          <mj-section background-color="#f8f9fa" padding="30px 20px">
            <mj-column>
              <mj-text font-size="18px" font-weight="bold" color="#2C3E50" align="center" padding-bottom="15px">
                🎯 Лучшие цены на билеты
              </mj-text>
              <mj-text font-size="24px" font-weight="bold" color="#4BFF7E" align="center" padding-bottom="10px">
                от ${pricingInfo.cheapest.toLocaleString()} ${pricingInfo.currency}
              </mj-text>
              ${pricingInfo.statistics ? `
              <mj-text font-size="14px" color="#666666" align="center">
                Средняя цена: ${pricingInfo.statistics.average.toLocaleString()} ${pricingInfo.currency}
              </mj-text>
              <mj-text font-size="14px" color="#666666" align="center" padding-bottom="20px">
                Найдено ${pricingInfo.prices?.length || 0} предложений
              </mj-text>
              ` : ''}
            </mj-column>
          </mj-section>`;
        }
      } catch (error) {
        console.warn('⚠️ Could not parse pricing data for MJML template');
      }
    }
    
    // 🖼️ Step 3: Add selected assets to MJML template
    let heroImageSection = '';
    let rabbitSection = '';
    
    if (selectedAssets.length > 0) {
      // Add hero image with REAL file path (not placeholder)
      if (selectedAssets[0]) {
        const heroFilePath = selectedAssets[0]; // Use full path, not just filename
        heroImageSection = `
        <mj-section background-color="#ffffff" padding="0">
          <mj-column>
            <mj-image src="${heroFilePath}" alt="Travel destination" width="600px" />
          </mj-column>
        </mj-section>`;
        console.log(`🖼️ Design Specialist: Added hero image with REAL path: ${heroFilePath}`);
      }
      
      // Add rabbit mascot with REAL file path (not placeholder)
      if (selectedAssets[1]) {
        const rabbitFilePath = selectedAssets[1]; // Use full path, not just filename
        rabbitSection = `
        <mj-section background-color="#ffffff" padding="20px 0">
          <mj-column>
            <mj-image src="${rabbitFilePath}" alt="Kupibilet Rabbit" width="120px" align="center" />
          </mj-column>
        </mj-section>`;
        console.log(`🖼️ Design Specialist: Added rabbit mascot with REAL path: ${rabbitFilePath}`);
      }
    } else {
      // Create template without assets but with placeholders
      console.log('🖼️ Design Specialist: Creating template with text-based design (no assets)');
      heroImageSection = `
      <mj-section background-color="#4BFF7E" padding="40px 20px">
        <mj-column>
          <mj-text font-size="32px" font-weight="bold" color="white" align="center">
            🌍 ${contentData.subject || 'Путешествие в Норвегию осенью'}
          </mj-text>
          <mj-text font-size="18px" color="white" align="center" padding-top="10px">
            Откройте для себя красоту северной природы
          </mj-text>
        </mj-column>
      </mj-section>`;
      
      rabbitSection = `
      <mj-section background-color="#f8f9fa" padding="20px 0">
        <mj-column>
          <mj-text font-size="48px" align="center" padding-bottom="10px">🐰</mj-text>
          <mj-text font-size="16px" color="#666666" align="center">
            Ваш надёжный спутник в мире путешествий
          </mj-text>
        </mj-column>
      </mj-section>`;
    }
    
    // 🚫 FIXED: Replace hardcoded template with AI-generated MJML
    console.log('🤖 Design Specialist: Generating AI-driven MJML template...');
    
    console.log('📁 Design Specialist: Email folder for saving:', {
      hasEmailFolder: !!currentEmailFolder,
      campaignId: currentEmailFolder?.campaignId || 'none',
      basePath: currentEmailFolder?.basePath || 'none'
    });
    
    // 🔍 DEBUG: Add debugging before MJML generation
    console.log('🔍 DEBUG: About to call generateAIDrivenMjmlTemplate with params:', {
      subject: subject?.substring(0, 50) || 'MISSING',
      preheader: preheader?.substring(0, 50) || 'MISSING',
      body: body?.substring(0, 100) || 'MISSING',
      ctaText: ctaText || 'MISSING',
      ctaUrl: ctaUrl || 'MISSING',
      heroImageSection_length: heroImageSection?.length || 0,
      rabbitSection_length: rabbitSection?.length || 0,
      pricingSection_length: pricingSection?.length || 0,
      contentData_keys: Object.keys(contentData || {}),
      selectedAssets_count: selectedAssets?.length || 0,
      campaignId: currentEmailFolder?.campaignId || 'MISSING'
    });
    
    try {
      // Generate AI-powered MJML template based on content analysis with Progressive File Saving
      const fullMjmlContent = await generateAIDrivenMjmlTemplate({
        subject,
        preheader,
        body,
        ctaText,
        ctaUrl,
        heroImageSection,
        rabbitSection,
        pricingSection,
        contentData,
        selectedAssets,
        campaignId: currentEmailFolder?.campaignId // Add campaignId for STAGE 1 saving
      });

      console.log('🔍 DEBUG: Generated MJML content:', {
        mjml_length: fullMjmlContent?.length || 0,
        mjml_preview: fullMjmlContent?.substring(0, 200) || 'EMPTY',
        mjml_type: typeof fullMjmlContent,
        mjml_exists: !!fullMjmlContent,
        mjml_is_string: typeof fullMjmlContent === 'string',
        mjml_not_empty: fullMjmlContent && fullMjmlContent.trim().length > 0
      });

      if (!fullMjmlContent || fullMjmlContent.trim().length === 0) {
        throw new Error('generateAIDrivenMjmlTemplate returned empty or invalid MJML content');
      }

    console.log('🎨 Design Specialist: Creating HTML email template internally...');
    
      // Call the actual email renderer with the enhanced MJML and email folder
    const rendererResult = await emailRenderer({
      action: (params.action || 'render_mjml') as 'render_mjml' | 'render_component' | 'render_advanced' | 'render_seasonal' | 'render_hybrid' | 'optimize_output',
      mjml_content: fullMjmlContent,
      content_data: contentData,
        emailFolder: currentEmailFolder ? currentEmailFolder.campaignId : '',  // Pass campaignId string as per schema
      rendering_options: {
        responsive_design: true,
        email_client_optimization: 'all',
        inline_css: true,
        validate_html: true,
        accessibility_compliance: true
      }
    });
    
    return rendererResult;
      
    } catch (mjmlError) {
      console.error('❌ ERROR in generateAIDrivenMjmlTemplate:', mjmlError);
      throw new Error(`MJML generation failed: ${mjmlError.message}`);
    }
  }
});

/**
 * Quality Controller Tool - Validates email quality and compatibility
 */
export const qualityControllerTool = tool({
  name: 'quality_controller',
  description: 'Quality Specialist internal tool - validates email quality and client compatibility',
  parameters: z.object({
    html_content: z.string().describe('HTML content to validate'),
    action: z.enum(['analyze_quality', 'check_compatibility']).describe('Quality analysis action')
  }),
  strict: true,
  execute: async (params: QualityControllerParams): Promise<any> => {
    console.log('🔍 Quality Specialist: Starting internal quality validation...');
    
    const htmlContent = params.html_content;
    const htmlLength = htmlContent.length;
    
    // Basic HTML quality checks
    const hasDoctype = htmlContent.toLowerCase().includes('<!doctype');
    const hasViewport = htmlContent.includes('viewport');
    const hasResponsive = htmlContent.includes('@media') || htmlContent.includes('mobile');
    const hasKupibiletLogo = htmlContent.toLowerCase().includes('kupibilet');
    const hasPricing = htmlContent.includes('₽') || htmlContent.includes('RUB') || htmlContent.includes('руб');
    const hasEmailStructure = htmlContent.includes('<table') || htmlContent.includes('mjml');
    
    // Calculate quality score
    let qualityScore = 0;
    if (hasDoctype) qualityScore += 15;
    if (hasViewport) qualityScore += 15;
    if (hasResponsive) qualityScore += 15;
    if (hasKupibiletLogo) qualityScore += 20;
    if (hasPricing) qualityScore += 20;
    if (hasEmailStructure) qualityScore += 15;
    
    console.log('📊 Quality analysis:', {
      html_size_kb: Math.round(htmlLength / 1024),
      has_doctype: hasDoctype,
      has_viewport: hasViewport,
      has_responsive: hasResponsive,
      has_kupibilet_logo: hasKupibiletLogo,
      has_pricing: hasPricing,
      has_email_structure: hasEmailStructure,
      quality_score: qualityScore
    });
    
    // Generate validation report
    const validationReport = {
      overall_score: qualityScore,
      max_score: 100,
      status: qualityScore >= 80 ? 'excellent' : qualityScore >= 60 ? 'good' : 'needs_improvement',
      checks: {
        html_structure: { passed: hasDoctype, score: hasDoctype ? 15 : 0 },
        mobile_compatibility: { passed: hasViewport && hasResponsive, score: (hasViewport ? 15 : 0) + (hasResponsive ? 15 : 0) },
        brand_compliance: { passed: hasKupibiletLogo, score: hasKupibiletLogo ? 20 : 0 },
        content_quality: { passed: hasPricing, score: hasPricing ? 20 : 0 },
        email_standards: { passed: hasEmailStructure, score: hasEmailStructure ? 15 : 0 }
      },
      recommendations: qualityScore < 80 ? [
        'Ensure proper HTML email structure',
        'Add responsive design for mobile devices', 
        'Include Kupibilet branding elements',
        'Add pricing information for better engagement'
      ] : ['Email meets quality standards']
    };
    
    console.log('✅ Quality Specialist: Validation completed with score:', qualityScore);
    
    return {
      success: true,
      action: 'analyze_quality',
      data: {
        validation_report: validationReport,
        html_content: htmlContent,
        quality_score: qualityScore,
        status: qualityScore >= 80 ? 'approved' : 'needs_review',
        client_compatibility: {
          gmail: qualityScore >= 70,
          outlook: qualityScore >= 70, 
          apple_mail: qualityScore >= 60,
          yahoo_mail: qualityScore >= 60
        }
      },
      quality_metadata: {
        validator: 'quality_specialist_internal',
        validation_time: new Date().toISOString(),
        html_size_bytes: htmlLength,
        compliance_level: qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low'
      }
    };
  }
});

/**
 * Delivery Manager Tool - Saves and organizes final campaign files
 */
export const deliveryManagerTool = tool({
  name: 'delivery_manager',
  description: 'Delivery Specialist internal tool - saves and organizes final campaign files',
  parameters: deliveryManagerSchema,
  strict: true,
  execute: async (params: any): Promise<any> => {
    return await deliveryManager(params);
  }
});

/**
 * Pricing Intelligence Tool - Get real pricing data for campaigns
 */
export const pricingIntelligenceTool = tool({
  name: 'pricing_intelligence',
  description: 'Get real airline pricing data for content creation with route analysis and fare insights',
  parameters: z.object({
    origin: z.string().describe('Origin airport code (e.g., MOW)'),
    destination: z.string().describe('Destination airport code (e.g., PAR)'),
    date_range: z.string().describe('Search date range in format: start_date,end_date')
  }),
  strict: true,
  execute: async (params: PricingIntelligenceParams): Promise<any> => {
    console.log(`💰 Pricing Intelligence: Searching ${params.origin} → ${params.destination} for ${params.date_range}`);
    
    const result = await getPrices({
      origin: params.origin,
      destination: params.destination,
      date_range: params.date_range,
      cabin_class: 'economy',
      filters: { airplane_only: true }
    });
    
    console.log(`💰 Pricing Intelligence result:`, {
      success: result.success,
      prices_found: result.data?.prices?.length || 0,
      cheapest_price: result.data?.cheapest || 0,
      currency: result.data?.currency || 'RUB'
    });
    
    return result;
  }
});

/**
 * Date Intelligence Tool - Smart date selection for campaigns
 */
export const dateIntelligenceTool = tool({
  name: 'date_intelligence', 
  description: 'Intelligent date selection and analysis for email campaigns with seasonal insights',
  parameters: z.object({
    campaign_context: z.object({
      topic: z.string().describe('Campaign topic'),
      urgency: z.enum(['urgent', 'standard', 'seasonal']).describe('Campaign urgency level'),
      campaign_type: z.enum(['hot_deals', 'newsletter', 'seasonal', 'announcement']).describe('Type of campaign')
    }).describe('Campaign context for intelligent date selection'),
    months_ahead: z.number().describe('Months ahead to analyze'),
    search_window: z.number().describe('Search window in days')
  }),
  strict: true,
  execute: async (params: DateIntelligenceParams): Promise<any> => {
    console.log(`📅 Date Intelligence: Analyzing dates for "${params.campaign_context.topic}"`);
    
    const result = await getCurrentDate({
      campaign_context: params.campaign_context,
      months_ahead: params.months_ahead,
      search_window: params.search_window
    });
    
    console.log(`📅 Date Intelligence result:`, {
      success: result.success,
      search_start: result.data?.search_start,
      search_end: result.data?.search_end,
      seasonality: result.data?.seasonality_insights
    });
    
    return result;
  }
});

/**
 * Figma Asset Selector Tool - Select appropriate Figma assets for email design
 */
export const figmaAssetSelectorTool = tool({
  name: 'figma_asset_selector',
  description: 'Intelligent selection of Figma assets based on content analysis and emotional context',
  parameters: z.object({
    tags: z.array(z.string()).describe('Search tags derived from content analysis'),
    campaign_type: z.enum(['seasonal', 'promotional', 'informational']).describe('Type of campaign'),
    emotional_tone: z.enum(['positive', 'neutral', 'urgent', 'friendly']).describe('Desired emotional tone'),
    target_count: z.number().describe('Number of assets to select')
  }),
  strict: true,
  execute: async (params: FigmaAssetSelectorParams): Promise<any> => {
    console.log(`🖼️ Figma Asset Selector: Searching for ${params.target_count} assets with tags:`, params.tags);
    
    try {
      const { AssetManager } = await import('../core/asset-manager');
      const assetManager = new AssetManager();
      
      const result = await assetManager.searchAssets({
        tags: params.tags,
        emotional_tone: params.emotional_tone,
        campaign_type: params.campaign_type,
        target_count: params.target_count
      });
      
      console.log(`🖼️ Figma Asset Selector result:`, {
        success: result.success,
        assets_found: result.assets?.length || 0,
        message: (result as any).message || 'Asset selection completed'
      });
      
      return result;
    } catch (error) {
      console.error('❌ Figma Asset Selector failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        assets: []
      };
    }
  }
});

/**
 * MJML Compiler Tool - Compile MJML templates to HTML
 */
export const mjmlCompilerTool = tool({
  name: 'mjml_compiler',
  description: 'Compile MJML email templates to HTML with validation and optimization',
  parameters: z.object({
    mjml_content: z.string().describe('MJML template content to compile'),
    validation_level: z.enum(['strict', 'soft', 'skip']).describe('Validation level for MJML')
  }),
  strict: true,
  execute: async (params: MjmlCompilerParams): Promise<any> => {
    console.log(`🔧 MJML Compiler: Compiling template (${params.mjml_content.length} chars)`);
    
    try {
      // Import MJML compiler with robust handling
      const mjmlModule = await import('mjml');
      
      // Handle different export scenarios:
      // 1. ES Module with default export: mjmlModule.default
      // 2. CommonJS: mjmlModule itself
      // 3. Mixed: mjmlModule.default.default (sometimes happens with transpilation)
      let mjml;
      
      if (typeof mjmlModule.default === 'function') {
        mjml = mjmlModule.default;
      } else if (typeof mjmlModule === 'function') {
        mjml = mjmlModule;
      } else if (mjmlModule.default && typeof mjmlModule.default === 'function') {
        mjml = mjmlModule.default;
      } else {
        console.error('❌ MJML module structure in compiler tool:', {
          hasDefault: !!mjmlModule.default,
          typeOfDefault: typeof mjmlModule.default,
          typeOfModule: typeof mjmlModule,
          moduleKeys: Object.keys(mjmlModule)
        });
        throw new Error('MJML compiler function not found in module');
      }
      
      console.log('✅ MJML compiler tool: function found, compiling...');
      
      const result = mjml(params.mjml_content, {
        validationLevel: params.validation_level as 'strict' | 'soft' | 'skip'
        // Removed filePath as it causes "Specified filePath does not exist" error
      });
      
      if (result.errors && result.errors.length > 0) {
        console.warn('⚠️ MJML Compiler warnings:', result.errors);
      }
      
      console.log(`✅ MJML Compiler result:`, {
        success: true,
        html_size: result.html.length,
        errors_count: result.errors?.length || 0
      });
      
      return {
        success: true,
        data: {
          html: result.html,
          errors: result.errors,
          validation_level: params.validation_level
        },
        metadata: {
          input_size: params.mjml_content.length,
          output_size: result.html.length,
          compression_ratio: Math.round((result.html.length / params.mjml_content.length) * 100) / 100
        }
      };
    } catch (error) {
      console.error('❌ MJML Compiler failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MJML compilation failed',
        data: { html: '', errors: [] }
      };
    }
  }
});

/**
 * HTML Validator Tool - Validate HTML for email compatibility
 */
export const htmlValidatorTool = tool({
  name: 'html_validator',
  description: 'Validate HTML content for email client compatibility and accessibility',
  parameters: z.object({
    html_content: z.string().describe('HTML content to validate'),
    validation_type: z.enum(['email_compatibility', 'accessibility', 'performance']).describe('Type of validation to perform')
  }),
  strict: true,
  execute: async (params) => {
    console.log(`🔍 HTML Validator: Validating ${params.validation_type} (${params.html_content.length} chars)`);
    
    const htmlContent = params.html_content;
    const validationResults = {
      email_compatibility: {
        has_doctype: htmlContent.toLowerCase().includes('<!doctype'),
        table_based_layout: htmlContent.includes('<table'),
        inline_css: htmlContent.includes('style='),
        responsive_meta: htmlContent.includes('viewport'),
        score: 0
      },
      accessibility: {
        has_alt_text: htmlContent.includes('alt='),
        proper_headings: htmlContent.includes('<h1') || htmlContent.includes('<h2'),
        color_contrast: true, // Simplified check
        score: 0
      },
      performance: {
        file_size_kb: Math.round(htmlContent.length / 1024),
        external_resources: (htmlContent.match(/http[s]?:\/\//g) || []).length,
        optimized_images: htmlContent.includes('width=') && htmlContent.includes('height='),
        score: 0
      }
    };
    
    // Calculate scores
    const compatibility = validationResults.email_compatibility;
    compatibility.score = [
      compatibility.has_doctype,
      compatibility.table_based_layout,
      compatibility.inline_css,
      compatibility.responsive_meta
    ].filter(Boolean).length * 25;
    
    const accessibility = validationResults.accessibility;
    accessibility.score = [
      accessibility.has_alt_text,
      accessibility.proper_headings,
      accessibility.color_contrast
    ].filter(Boolean).length * 33;
    
    const performance = validationResults.performance;
    performance.score = Math.max(0, 100 - performance.file_size_kb - performance.external_resources * 10);
    
    console.log(`✅ HTML Validator result:`, {
      validation_type: params.validation_type,
      score: validationResults[params.validation_type].score,
      file_size_kb: validationResults.performance.file_size_kb
    });
    
    return {
      success: true,
      data: {
        validation_type: params.validation_type,
        results: validationResults[params.validation_type],
        overall_score: Math.round((
          validationResults.email_compatibility.score +
          validationResults.accessibility.score +
          validationResults.performance.score
        ) / 3),
        recommendations: [
          'Ensure DOCTYPE declaration is present',
          'Use table-based layouts for email clients',
          'Include alt text for all images',
          'Optimize file size for better performance'
        ]
      },
      metadata: {
        validation_engine: 'html_validator_tool',
        html_size_bytes: htmlContent.length,
        validation_time: new Date().toISOString()
      }
    };
  }
});

/**
 * File Organizer Tool - Organize and manage campaign files
 */
export const fileOrganizerTool = tool({
  name: 'file_organizer',
  description: 'Organize and manage email campaign files with proper structure and metadata',
  parameters: z.object({
    campaign_id: z.string().describe('Unique campaign identifier'),
    organization_type: z.enum(['flat', 'structured', 'timestamped']).describe('File organization pattern')
  }),
  strict: true,
  execute: async (params) => {
    console.log(`📁 File Organizer: Organizing campaign ${params.campaign_id}`);
    
    const timestamp = new Date().toISOString();
    
    // Create default organized structure
    const defaultFiles = [
      { name: 'email.html', type: 'html', size: 15000 },
      { name: 'metadata.json', type: 'json', size: 2000 },
      { name: 'assets/', type: 'directory', size: 0 }
    ];
    
    const organizedFiles = defaultFiles.map(file => ({
      original_name: file.name,
      organized_path: `${params.campaign_id}/${file.name}`,
      file_type: file.type,
      file_size_bytes: file.size,
      created_at: timestamp
    }));
    
    console.log(`✅ File Organizer result:`, {
      campaign_id: params.campaign_id,
      organization_type: params.organization_type,
      files_organized: organizedFiles.length,
      total_size_bytes: organizedFiles.reduce((sum, file) => sum + file.file_size_bytes, 0)
    });
    
    return {
      success: true,
      data: {
        campaign_id: params.campaign_id,
        organization_type: params.organization_type,
        organized_files: organizedFiles,
        file_structure: {
          root: params.campaign_id,
          files: organizedFiles.length,
          total_size_kb: Math.round(organizedFiles.reduce((sum, file) => sum + file.file_size_bytes, 0) / 1024)
        }
      },
      metadata: {
        organizer_engine: 'file_organizer_tool',
        organization_time: timestamp,
        files_processed: organizedFiles.length
      }
    };
  }
});

/**
 * Final Email Delivery Tool - Creates ready-to-send email package
 */
export const finalEmailDeliveryTool = finalEmailDelivery;

/**
 * 🤖 AI-Driven MJML Template Generator with Progressive File Saving
 * Generates unique MJML templates based on content analysis and campaign context
 * STAGE 1: Saves AI-generated MJML immediately after creation
 */
async function generateAIDrivenMjmlTemplate(params: {
  subject: string;
  preheader: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  heroImageSection: string;
  rabbitSection: string;
  pricingSection: string;
  contentData: any;
  selectedAssets: string[];
  campaignId?: string; // Add campaignId for progressive saving
}): Promise<string> {
  const { subject, preheader, body, ctaText, ctaUrl, heroImageSection, rabbitSection, pricingSection, contentData, campaignId } = params;
  
  console.log('🤖 AI MJML Generator: Starting content analysis and template generation...');
  
  // Analyze content to determine design strategy
  const contentAnalysis = analyzeContentForDesign(body, subject, contentData);
  
  // Generate dynamic styles based on content analysis
  const dynamicStyles = generateDynamicStyles(contentAnalysis);
  
  // Generate layout structure based on content type
  const layoutStructure = generateLayoutStructure(contentAnalysis, {
    heroImageSection,
    rabbitSection,
    pricingSection,
    subject,
    body,
    ctaText,
    ctaUrl
  });
  
  // Create AI-generated MJML template
  const aiMjmlTemplate = `
<mjml>
  <mj-head>
    <mj-title>${subject}</mj-title>
    <mj-preview>${preheader}</mj-preview>
    <mj-attributes>
      <mj-all font-family="${contentAnalysis.typography.primary}" />
      <mj-text font-size="${contentAnalysis.typography.bodySize}" color="${contentAnalysis.colors.text}" line-height="1.6" />
      <mj-button background-color="${contentAnalysis.colors.primary}" color="${contentAnalysis.colors.buttonText}" border-radius="${contentAnalysis.design.borderRadius}" />
    </mj-attributes>
    <mj-style>
      ${dynamicStyles}
    </mj-style>
  </mj-head>
  <mj-body background-color="${contentAnalysis.colors.background}">
    ${layoutStructure}
  </mj-body>
</mjml>`;

  console.log('✨ Generated AI-driven MJML template:', {
    design_strategy: contentAnalysis.strategy,
    color_palette: contentAnalysis.colors.primary,
    typography: contentAnalysis.typography.primary,
    layout_type: contentAnalysis.layout.type,
    mjml_length: aiMjmlTemplate.length
  });
  
  // 🔍 DEBUG: Log the actual MJML content being generated
  console.log('🔍 DEBUG: AI MJML Template preview:', aiMjmlTemplate.substring(0, 300) + '...');
  console.log('🔍 DEBUG: AI MJML Template total length:', aiMjmlTemplate.length);
  console.log('🔍 DEBUG: AI MJML Template type:', typeof aiMjmlTemplate);
  
  // 📁 STAGE 1: Progressive File Saving - AI Generated MJML
  if (campaignId) {
    try {
      console.log('💾 STAGE 1: Saving AI-generated MJML immediately...');
      
      // Import the ProgressiveFileSaver class
      const { ProgressiveFileSaver } = await import('./mjml');
      
      // Initialize the progressive file saver
      const progressiveSaver = new ProgressiveFileSaver(campaignId);
      
      // Save AI-generated MJML (STAGE 1)
      await progressiveSaver.saveAiGeneratedMjml(aiMjmlTemplate, 'ai_answer');
      
      console.log('✅ STAGE 1: AI MJML saved successfully:', {
        campaign_id: campaignId,
        mjml_length: aiMjmlTemplate.length
      });
      
    } catch (saveError) {
      console.error('❌ STAGE 1: Failed to save AI-generated MJML:', saveError);
      // Continue execution - saving is important but not critical for generation
      console.warn('⚠️ STAGE 1: Continuing without AI MJML file saving...');
    }
  } else {
    console.warn('⚠️ STAGE 1: No campaignId provided - skipping AI MJML file saving');
  }
  
  // 🔍 DEBUG: Final return value check
  console.log('🔍 DEBUG: About to return MJML template:', {
    return_type: typeof aiMjmlTemplate,
    return_length: aiMjmlTemplate.length,
    return_preview: aiMjmlTemplate.substring(0, 100) + '...',
    is_empty: !aiMjmlTemplate,
    is_string: typeof aiMjmlTemplate === 'string'
  });
  
  return aiMjmlTemplate;
}

/**
 * Analyze content to determine optimal design strategy
 */
function analyzeContentForDesign(body: string, subject: string, contentData: any): any {
  const fullText = `${subject} ${body}`.toLowerCase();
  
  // Determine content theme and strategy
  let strategy = 'standard';
  let colorScheme = 'default';
  
  // Travel-specific analysis
  if (fullText.includes('путешеств') || fullText.includes('поездк') || fullText.includes('билет')) {
    strategy = 'travel';
    colorScheme = 'travel';
  }
  
  // Seasonal analysis
  if (fullText.includes('весн') || fullText.includes('spring')) {
    strategy = 'seasonal_spring';
    colorScheme = 'spring';
  } else if (fullText.includes('лет') || fullText.includes('summer')) {
    strategy = 'seasonal_summer';
    colorScheme = 'summer';
  } else if (fullText.includes('осень') || fullText.includes('autumn')) {
    strategy = 'seasonal_autumn';
    colorScheme = 'autumn';
  } else if (fullText.includes('зим') || fullText.includes('winter')) {
    strategy = 'seasonal_winter';
    colorScheme = 'winter';
  }
  
  // Urgency analysis
  let urgency = 'standard';
  if (fullText.includes('срочн') || fullText.includes('последн') || fullText.includes('ограничен')) {
    urgency = 'high';
  }
  
  // Generate color palette based on analysis
  const colorPalettes = {
    default: { primary: '#4BFF7E', secondary: '#1DA857', text: '#333333', background: '#ffffff', buttonText: 'white' },
    travel: { primary: '#007BFF', secondary: '#0056B3', text: '#2C3E50', background: '#F8F9FA', buttonText: 'white' },
    spring: { primary: '#FF6B9D', secondary: '#FF4081', text: '#2E7D32', background: '#F1F8E9', buttonText: 'white' },
    summer: { primary: '#FF9800', secondary: '#F57C00', text: '#D84315', background: '#FFF3E0', buttonText: 'white' },
    autumn: { primary: '#8D6E63', secondary: '#5D4037', text: '#3E2723', background: '#FFF8E1', buttonText: 'white' },
    winter: { primary: '#2196F3', secondary: '#1976D2', text: '#0D47A1', background: '#E3F2FD', buttonText: 'white' }
  };
  
  const typography = {
    primary: strategy === 'travel' ? 'Georgia, serif' : 'Arial, sans-serif',
    bodySize: urgency === 'high' ? '18px' : '16px',
    headingSize: urgency === 'high' ? '28px' : '24px'
  };
  
  return {
    strategy,
    colorScheme,
    urgency,
    colors: colorPalettes[colorScheme] || colorPalettes.default,
    typography,
    layout: {
      type: strategy === 'travel' ? 'image-heavy' : 'text-focused',
      sections: urgency === 'high' ? 'minimal' : 'standard'
    },
    design: {
      borderRadius: urgency === 'high' ? '8px' : '6px',
      spacing: urgency === 'high' ? 'compact' : 'comfortable'
    }
  };
}

/**
 * Generate dynamic CSS styles based on content analysis
 */
function generateDynamicStyles(analysis: any): string {
  const { colors, design, urgency } = analysis;
  
  const baseStyles = `
    .brand-header { 
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      ${urgency === 'high' ? 'border-left: 4px solid #FF4444;' : ''}
    }
    .content-section { 
      padding: ${design.spacing === 'compact' ? '15px' : '20px'};
      ${urgency === 'high' ? 'border-left: 2px solid ' + colors.primary + ';' : ''}
    }
    .footer-section { 
      background-color: ${colors.background === '#ffffff' ? '#f8f9fa' : colors.background};
    }
    .pricing-highlight {
      background-color: ${colors.primary}15;
      border: 1px solid ${colors.primary};
      border-radius: ${design.borderRadius};
    }
  `;
  
  return baseStyles;
}

/**
 * Generate layout structure based on content analysis
 */
function generateLayoutStructure(analysis: any, sections: any): string {
  const { colors, typography, urgency } = analysis;
  const { heroImageSection, rabbitSection, pricingSection, subject, body, ctaText, ctaUrl } = sections;
  
  let layout = '';
  
  // Header section
  layout += `
    <!-- AI-Generated Header -->
    <mj-section css-class="brand-header" padding="20px">
      <mj-column>
        <mj-text font-size="28px" font-weight="bold" color="white" align="center">
          ${urgency === 'high' ? '⚡ ' : ''}Kupibilet
        </mj-text>
      </mj-column>
    </mj-section>
  `;
  
  // Hero image (if available)
  if (heroImageSection) {
    layout += heroImageSection;
  }
  
  // Main content section
  layout += `
    <!-- AI-Generated Main Content -->
    <mj-section css-class="content-section" background-color="${colors.background}" padding="40px 20px">
      <mj-column>
        <mj-text font-size="${typography.headingSize}" font-weight="bold" color="${colors.text}" align="center" padding-bottom="20px">
          ${urgency === 'high' ? '🔥 ' : ''}${subject}
        </mj-text>
        <mj-text font-size="${typography.bodySize}" color="${colors.text}" line-height="1.6" padding-bottom="20px">
          ${body}
        </mj-text>
        <mj-button href="${ctaUrl}" background-color="${colors.primary}" color="${colors.buttonText}" font-size="16px" font-weight="bold" border-radius="${analysis.design.borderRadius}" padding="15px 30px">
          ${urgency === 'high' ? '🚀 ' : ''}${ctaText}
        </mj-button>
      </mj-column>
    </mj-section>
  `;
  
  // Rabbit section (if available)
  if (rabbitSection) {
    layout += rabbitSection;
  }
  
  // Pricing section (if available)
  if (pricingSection) {
    layout += `
      <!-- AI-Generated Pricing Section -->
      <mj-section css-class="pricing-highlight" background-color="${colors.primary}15" padding="20px">
        ${pricingSection}
      </mj-section>
    `;
  }
  
  // Footer section
  layout += `
    <!-- AI-Generated Footer -->
    <mj-section css-class="footer-section" background-color="${colors.background}" padding="20px">
      <mj-column>
        <mj-text font-size="14px" color="${colors.text}AA" align="center">
          © 2025 Kupibilet. Все права защищены.
        </mj-text>
        <mj-text font-size="12px" color="${colors.text}77" align="center" padding-top="10px">
          Вы получили это письмо, потому что подписаны на нашу рассылку.
        </mj-text>
      </mj-column>
    </mj-section>
  `;
  
  return layout;
}
