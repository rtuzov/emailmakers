/**
 * Agent Tools Module for Email Campaign Workflow
 * Defines all tools used by specialist agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { contentGenerator } from '../tools/consolidated/content-generator';
import { emailRenderer } from '../tools/email-renderer-v2';
import { qualityController } from '../tools/consolidated/quality-controller';
import { deliveryManager } from '../tools/consolidated/delivery-manager';
import { getCurrentDate } from '../tools/date';
import { getPrices } from '../tools/prices';
import { planEmailImages, selectFigmaAssetByTags, findFigmaAsset } from './image-planning';

/**
 * Content Generator Tool - Creates email content with real pricing data
 */
export const contentGeneratorTool = tool({
  name: 'content_generator',
  description: 'Generate email content with AI and real pricing data using Pricing Intelligence and Date Detection',
  parameters: z.object({
    topic: z.string().describe('Campaign topic'),
    action: z.enum(['generate', 'optimize', 'variants']).nullable().default('generate')
  }),
  execute: async (params) => {
    console.log(`💰 Content Generator: Getting real pricing data for topic "${params.topic}"`);
    
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
      action: params.action || 'generate',
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
    action: z.enum(['render_mjml', 'render_component']).nullable().default('render_mjml')
  }),
  execute: async (params) => {
    console.log('🎨 Design Specialist: Starting internal email rendering...');
    
    // Parse content_data to extract information
    let contentData: any = {};
    try {
      contentData = JSON.parse(params.content_data);
    } catch (error) {
      console.warn('⚠️ Could not parse content_data, using default structure');
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
        
        // 🔍 Step 2: Use AssetManager to find Figma assets based on image plan
        const { AssetManager } = await import('../core/asset-manager');
        const assetManager = new AssetManager();
        
        // Collect all search tags from image plan
        const allTags = [];
        for (const imageSpec of imagePlanData.image_plan || []) {
          allTags.push(...(imageSpec.search_tags || []));
        }
        
        // Remove duplicates and add fallback tags
        const uniqueTags = [...new Set(allTags)];
        if (uniqueTags.length === 0) {
          uniqueTags.push('заяц', 'кролик', 'путешествие');
        }
        
        console.log(`🔍 Design Specialist: Searching assets with tags:`, uniqueTags);
        
        // Search for assets using AssetManager
        const searchResult = await assetManager.searchAssets({
          tags: uniqueTags,
          emotional_tone: 'positive',
          campaign_type: 'seasonal',
          target_count: imagePlanData.image_plan?.length || 3
        }, contentData);
        
        if (searchResult.success && searchResult.assets.length > 0) {
          // Map found assets to image plan positions
          for (let i = 0; i < Math.min(searchResult.assets.length, imagePlanData.image_plan?.length || 3); i++) {
            const asset = searchResult.assets[i];
            selectedAssets.push(asset.filePath);
            console.log(`✅ Design Specialist: Mapped asset ${asset.fileName} to position ${i + 1}`);
          }
        }
        
        console.log(`🎨 Design Specialist: Selected ${selectedAssets.length} Figma assets from search result`);
        
      } catch (error) {
        console.warn('⚠️ Design Specialist: Could not parse image plan or search assets:', error);
      }
    }
    
    // If no assets found through image plan, try direct search with content
    if (selectedAssets.length === 0) {
      console.log('🔄 Design Specialist: No assets from image plan, trying direct content search...');
      
      try {
        const { AssetManager } = await import('../core/asset-manager');
        const assetManager = new AssetManager();
        
        // Extract tags from content
        const contentTags = [];
        const subject = contentData.subject || '';
        const body = contentData.body || '';
        const fullText = `${subject} ${body}`.toLowerCase();
        
        if (fullText.includes('норвег')) contentTags.push('путешествие', 'страна', 'отпуск');
        if (fullText.includes('осень')) contentTags.push('сезон', 'время', 'природа');
        if (fullText.includes('путешеств')) contentTags.push('путешествие', 'туризм', 'отдых');
        
        // Fallback to general tags
        if (contentTags.length === 0) {
          contentTags.push('заяц', 'кролик', 'путешествие');
        }
        
        console.log(`🔍 Design Specialist: Direct search with content tags:`, contentTags);
        
        const directSearchResult = await assetManager.searchAssets({
          tags: contentTags,
          emotional_tone: 'positive',
          campaign_type: 'seasonal',
          target_count: 3
        }, contentData);
        
        if (directSearchResult.success && directSearchResult.assets.length > 0) {
          for (const asset of directSearchResult.assets.slice(0, 3)) {
            selectedAssets.push(asset.filePath);
            console.log(`✅ Design Specialist: Added asset from direct search: ${asset.fileName}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Design Specialist: Direct search failed:', error);
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
              <mj-text font-size="24px" font-weight="bold" color="#FF6B35" align="center" padding-bottom="10px">
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
      // Add hero image
      if (selectedAssets[0]) {
        const heroFileName = selectedAssets[0].split('/').pop() || 'hero-image.png';
        heroImageSection = `
        <mj-section background-color="#ffffff" padding="0">
          <mj-column>
            <mj-image src="{{FIGMA_ASSET_URL:${heroFileName}}}" alt="Travel destination" width="600px" />
          </mj-column>
        </mj-section>`;
        console.log(`🖼️ Design Specialist: Added hero image: ${heroFileName}`);
      }
      
      // Add rabbit mascot
      if (selectedAssets[1]) {
        const rabbitFileName = selectedAssets[1].split('/').pop() || 'rabbit-mascot.png';
        rabbitSection = `
        <mj-section background-color="#ffffff" padding="20px 0">
          <mj-column>
            <mj-image src="{{FIGMA_ASSET_URL:${rabbitFileName}}}" alt="Kupibilet Rabbit" width="120px" align="center" />
          </mj-column>
        </mj-section>`;
        console.log(`🖼️ Design Specialist: Added rabbit mascot: ${rabbitFileName}`);
      }
    } else {
      // Create template without assets but with placeholders
      console.log('🖼️ Design Specialist: Creating template with text-based design (no assets)');
      heroImageSection = `
      <mj-section background-color="#FF6B35" padding="40px 20px">
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
    
    // Create complete MJML template
    const fullMjmlContent = `
<mjml>
  <mj-head>
    <mj-title>${subject}</mj-title>
    <mj-preview>${preheader}</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="16px" color="#333333" line-height="1.6" />
      <mj-button background-color="#FF6B35" color="white" border-radius="4px" />
    </mj-attributes>
    <mj-style>
      .brand-header { background: linear-gradient(135deg, #FF6B35 0%, #2C3E50 100%); }
      .content-section { padding: 20px; }
      .footer-section { background-color: #f8f9fa; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#ffffff">
    <!-- Header with Kupibilet branding -->
    <mj-section css-class="brand-header" padding="20px">
      <mj-column>
        <mj-image src="https://kupibilet.ru/static/images/logo-white.png" alt="Kupibilet" width="200px" align="center" />
      </mj-column>
    </mj-section>
    
    ${heroImageSection}
    
    <!-- Main content -->
    <mj-section css-class="content-section" background-color="#ffffff" padding="40px 20px">
      <mj-column>
        <mj-text font-size="24px" font-weight="bold" color="#2C3E50" align="center" padding-bottom="20px">
          ${subject}
        </mj-text>
        <mj-text font-size="16px" color="#333333" line-height="1.6" padding-bottom="20px">
          ${body}
        </mj-text>
        <mj-button href="${ctaUrl}" background-color="#FF6B35" color="white" font-size="16px" font-weight="bold" border-radius="6px" padding="15px 30px">
          ${ctaText}
        </mj-button>
      </mj-column>
    </mj-section>
    
    ${rabbitSection}
    
    <!-- Pricing Section (if available) -->
    ${pricingSection}
    
    <!-- Footer -->
    <mj-section css-class="footer-section" background-color="#f8f9fa" padding="20px">
      <mj-column>
        <mj-text font-size="14px" color="#666666" align="center">
          © 2025 Kupibilet. Все права защищены.
        </mj-text>
        <mj-text font-size="12px" color="#999999" align="center" padding-top="10px">
          Вы получили это письмо, потому что подписаны на рассылку Kupibilet.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

    console.log('🎨 Design Specialist: Creating HTML email template internally...');
    
    // Call the actual email renderer with the enhanced MJML
    const rendererResult = await emailRenderer({
      action: params.action || 'render_mjml',
      mjml_content: fullMjmlContent,
      content_data: contentData,
      rendering_options: {
        responsive_design: true,
        email_client_optimization: 'all',
        inline_css: true,
        validate_html: true,
        accessibility_compliance: true
      }
    });
    
    return rendererResult;
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
    action: z.enum(['analyze_quality', 'check_compatibility']).nullable().default('analyze_quality')
  }),
  execute: async (params) => {
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
  parameters: z.object({
    campaign_data: z.string().describe('Campaign data as JSON string'),
    action: z.enum(['upload_assets', 'deploy_campaign']).nullable().default('deploy_campaign')
  }),
  execute: async (params) => {
    console.log('📦 Delivery Specialist: Starting internal file delivery...');
    
    // Parse campaign data
    let campaignData: any = {};
    try {
      campaignData = JSON.parse(params.campaign_data);
      console.log('📋 Delivery Specialist: Parsed campaign data:', {
        has_html: !!campaignData.html_content,
        has_html_alt: !!campaignData.html,
        has_validation: !!campaignData.validation_report,
        data_size: params.campaign_data.length,
        keys: Object.keys(campaignData),
        html_content_preview: campaignData.html_content ? campaignData.html_content.substring(0, 100) + '...' : 'N/A',
        html_preview: campaignData.html ? campaignData.html.substring(0, 100) + '...' : 'N/A'
      });
    } catch (error) {
      console.warn('⚠️ Delivery Specialist: Could not parse campaign data, using raw data');
      console.log('Raw campaign_data:', params.campaign_data.substring(0, 500));
      campaignData = { raw_data: params.campaign_data };
    }
    
    // 📁 CREATE REAL CAMPAIGN FOLDER AND FILES
    const campaignId = `france_autumn_campaign_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Create campaign directory structure
      const campaignPath = path.join(process.cwd(), 'mails', campaignId);
      const assetsPath = path.join(campaignPath, 'assets');
      
      await fs.mkdir(campaignPath, { recursive: true });
      await fs.mkdir(assetsPath, { recursive: true });
      
      console.log(`📁 Delivery Specialist: Created real campaign folder: ${campaignPath}`);
      
      // 🖼️ PROCESS FIGMA ASSETS AND COPY TO CAMPAIGN FOLDER
      let htmlContent = campaignData.html_content || campaignData.html || 'No HTML content available';
      const copiedAssets: string[] = [];
      
      // Find all Figma asset references in HTML
      const figmaAssetMatches = htmlContent.match(/\{\{FIGMA_ASSET_URL:([^}]+)\}\}/g);
      
      if (figmaAssetMatches && figmaAssetMatches.length > 0) {
        console.log(`🖼️ Found ${figmaAssetMatches.length} Figma assets to copy:`, figmaAssetMatches);
        
        for (const match of figmaAssetMatches) {
          const assetName = match.replace('{{FIGMA_ASSET_URL:', '').replace('}}', '');
          
          try {
            // Search for the asset in Figma directories
            const figmaBasePath = path.join(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
            const assetPath = await findFigmaAsset(figmaBasePath, assetName);
            
            if (assetPath) {
              // Copy asset to campaign assets folder
              const assetFileName = path.basename(assetPath);
              const targetAssetPath = path.join(assetsPath, assetFileName);
              
              await fs.copyFile(assetPath, targetAssetPath);
              copiedAssets.push(assetFileName);
              
              // Update HTML to use local asset path
              const localAssetUrl = `assets/${assetFileName}`;
              htmlContent = htmlContent.replace(match, localAssetUrl);
              
              console.log(`✅ Copied asset: ${assetName} → ${localAssetUrl}`);
            } else {
              console.warn(`⚠️ Asset not found: ${assetName}`);
              // Replace with placeholder image
              htmlContent = htmlContent.replace(match, 'https://via.placeholder.com/300x200?text=Image+Not+Found');
            }
          } catch (error) {
            console.error(`❌ Error copying asset ${assetName}:`, error);
            htmlContent = htmlContent.replace(match, 'https://via.placeholder.com/300x200?text=Error+Loading+Image');
          }
        }
      }
      
      const metadata = {
        campaign_id: campaignId,
        topic: 'Путешествие во Францию осенью',
        created_at: timestamp,
        quality_score: campaignData.quality_score || 0,
        validation_status: campaignData.status || 'unknown',
        file_size_bytes: htmlContent.length,
        file_size_kb: Math.round(htmlContent.length / 1024),
        brand: 'Kupibilet',
        assets_count: copiedAssets.length,
        copied_assets: copiedAssets,
        email_client_compatibility: campaignData.client_compatibility || {},
        validation_report: campaignData.validation_report || null
      };
      
      // 💾 SAVE REAL FILES
      // 1. Save HTML file
      await fs.writeFile(path.join(campaignPath, 'email.html'), htmlContent, 'utf-8');
      console.log(`💾 Saved: ${campaignPath}/email.html (${metadata.file_size_kb}KB)`);
      
      // 2. Save metadata file
      await fs.writeFile(
        path.join(campaignPath, 'metadata.json'), 
        JSON.stringify(metadata, null, 2), 
        'utf-8'
      );
      console.log(`💾 Saved: ${campaignPath}/metadata.json`);
      
      // 3. Save campaign data file
      await fs.writeFile(
        path.join(campaignPath, 'campaign_data.json'), 
        JSON.stringify(campaignData, null, 2), 
        'utf-8'
      );
      console.log(`💾 Saved: ${campaignPath}/campaign_data.json`);
      
      // 4. Create README file
      const readmeContent = `# Kupibilet Email Campaign: ${campaignId}

## Campaign Details
- **Topic**: Путешествие во Францию осенью
- **Created**: ${timestamp}
- **Quality Score**: ${campaignData.quality_score || 'N/A'}/100
- **Status**: ${campaignData.status || 'unknown'}
- **HTML Size**: ${metadata.file_size_kb}KB

## Files
- \`email.html\` - Final email template
- \`metadata.json\` - Campaign metadata
- \`campaign_data.json\` - Full campaign data
- \`assets/\` - Email assets (images, etc.)

## Usage
Open \`email.html\` in a browser to preview the email.
`;
      
      await fs.writeFile(path.join(campaignPath, 'README.md'), readmeContent, 'utf-8');
      console.log(`💾 Saved: ${campaignPath}/README.md`);
      
      // Create delivery report
      const deliveryReport = {
        status: 'deployed',
        campaign_id: campaignId,
        campaign_path: campaignPath,
        files_created: [
          `${campaignId}/email.html`,
          `${campaignId}/metadata.json`,
          `${campaignId}/campaign_data.json`,
          `${campaignId}/README.md`,
          `${campaignId}/assets/`
        ],
        preview_url: `file://${path.join(campaignPath, 'email.html')}`,
        deployment_time: timestamp,
        file_sizes: {
          html_kb: metadata.file_size_kb,
          total_kb: Math.round(params.campaign_data.length / 1024)
        }
      };
      
      console.log('✅ Delivery Specialist: Campaign deployed successfully:', {
        campaign_id: campaignId,
        campaign_path: campaignPath,
        files_count: deliveryReport.files_created.length,
        total_size_kb: deliveryReport.file_sizes.total_kb
      });
      
      return {
        success: true,
        action: 'deploy_campaign',
        data: {
          delivery_report: deliveryReport,
          campaign_metadata: metadata,
          deployment_status: 'completed',
          campaign_id: campaignId,
          campaign_path: campaignPath,
          preview_url: deliveryReport.preview_url
        },
        delivery_metadata: {
          deployment_engine: 'delivery_specialist_internal',
          deployment_time: timestamp,
          files_deployed: deliveryReport.files_created.length,
          total_size_bytes: params.campaign_data.length,
          delivery_status: 'success'
        }
      };
      
    } catch (error) {
      console.error('❌ Delivery Specialist: Failed to create campaign files:', error);
      
      // Return error result
      return {
        success: false,
        action: 'deploy_campaign',
        error: `File creation failed: ${error.message}`,
        data: {
          campaign_id: campaignId,
          deployment_status: 'failed',
          error_details: error.message
        },
        delivery_metadata: {
          deployment_engine: 'delivery_specialist_internal',
          deployment_time: timestamp,
          files_deployed: 0,
          total_size_bytes: 0,
          delivery_status: 'error'
        }
      };
    }
  }
}); 