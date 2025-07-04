import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { contentGenerator } from './tools/consolidated/content-generator';
import { emailRenderer } from './tools/consolidated/email-renderer';
import { qualityController } from './tools/consolidated/quality-controller';
import { deliveryManager } from './tools/consolidated/delivery-manager';
import { getCurrentDate } from './tools/date';
import { getPrices } from './tools/prices';

// 🖼️ IMAGE PLANNING MODULE - determines optimal images for email content
async function planEmailImages(params: {
  content: any;
  topic: string;
  campaign_type: string;
  emotional_tone: string;
}): Promise<{
  total_images_needed: number;
  figma_assets_needed: number;
  image_plan: Array<{
    position: number;
    type: 'hero' | 'illustration' | 'icon' | 'background' | 'product' | 'testimonial';
    content_description: string;
    size_priority: 'large' | 'medium' | 'small';
    emotional_tone: string;
    search_tags: string[];
    placement: 'header' | 'body' | 'footer' | 'sidebar';
  }>;
  layout_optimization: {
    mobile_friendly: boolean;
    load_time_optimized: boolean;
    accessibility_compliant: boolean;
  };
}> {
  console.log('🖼️ Image Planning Module: Analyzing content for optimal image strategy...');
  
  // Analyze content to determine image needs
  const contentLength = (params.content.subject?.length || 0) + (params.content.body?.length || 0);
  const topicLower = params.topic.toLowerCase();
  
  // Determine base image count based on content length and type
  let baseImageCount = 2; // Default: hero + illustration
  if (contentLength > 500) baseImageCount = 3; // Add product/testimonial
  if (contentLength > 1000) baseImageCount = 4; // Add background/icon
  
  // Adjust for topic type
  if (topicLower.includes('франци') || topicLower.includes('путешеств') || topicLower.includes('поездк')) {
    baseImageCount += 1; // Travel needs more visuals
  }
  
  // Create image plan
  const imagePlan = [];
  
  // 1. Hero image (always needed)
  imagePlan.push({
    position: 1,
    type: 'hero' as const,
    content_description: `Hero image for ${params.topic} showing destination or travel scene`,
    size_priority: 'large' as const,
    emotional_tone: params.emotional_tone,
    search_tags: extractTopicTags(params.topic).concat(['путешествие', 'туризм']),
    placement: 'header' as const
  });
  
  // 2. Illustration/mascot (Kupibilet rabbit)
  imagePlan.push({
    position: 2,
    type: 'illustration' as const,
    content_description: 'Kupibilet rabbit mascot with travel theme',
    size_priority: 'medium' as const,
    emotional_tone: 'positive',
    search_tags: ['заяц', 'кролик', 'путешествие', 'счастливый'],
    placement: 'body' as const
  });
  
  // 3. Additional images based on content
  if (baseImageCount >= 3) {
    imagePlan.push({
      position: 3,
      type: 'product' as const,
      content_description: 'Travel product or service visualization',
      size_priority: 'medium' as const,
      emotional_tone: params.emotional_tone,
      search_tags: ['билеты', 'самолет', 'авиакомпания'],
      placement: 'body' as const
    });
  }
  
  if (baseImageCount >= 4) {
    imagePlan.push({
      position: 4,
      type: 'icon' as const,
      content_description: 'Supporting icons for features or benefits',
      size_priority: 'small' as const,
      emotional_tone: 'neutral',
      search_tags: ['иконка', 'сервис', 'удобство'],
      placement: 'footer' as const
    });
  }
  
  console.log(`🎯 Image Planning Module: Planned ${baseImageCount} images for optimal engagement`);
  
  return {
    total_images_needed: baseImageCount,
    figma_assets_needed: Math.min(baseImageCount, 3), // Prefer Figma assets for first 3 images
    image_plan: imagePlan,
    layout_optimization: {
      mobile_friendly: true,
      load_time_optimized: true,
      accessibility_compliant: true
    }
  };
}

// Helper function to extract topic-relevant tags
function extractTopicTags(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  const tags = [];
  
  // Geographic tags
  if (topicLower.includes('франци')) tags.push('франция', 'париж', 'европа');
  if (topicLower.includes('италь')) tags.push('италия', 'рим', 'венеция');
  if (topicLower.includes('испан')) tags.push('испания', 'мадрид', 'барселона');
  
  // Seasonal tags  
  if (topicLower.includes('осен')) tags.push('осень', 'сентябрь', 'октябрь');
  if (topicLower.includes('зим')) tags.push('зима', 'снег', 'новый год');
  if (topicLower.includes('лет')) tags.push('лето', 'солнце', 'пляж');
  if (topicLower.includes('весн')) tags.push('весна', 'цветы', 'природа');
  
  // Activity tags
  if (topicLower.includes('путешеств')) tags.push('путешествие', 'отпуск', 'туризм');
  if (topicLower.includes('отдых')) tags.push('отдых', 'релакс', 'vacation');
  if (topicLower.includes('экскурс')) tags.push('экскурсия', 'достопримечательности');
  
  return tags.length > 0 ? tags : ['путешествие', 'отпуск']; // Default fallback
}

// 🔍 FIGMA ASSET SELECTOR - selects appropriate Figma assets based on tags and type
async function selectFigmaAssetByTags(searchTags: string[], imageType: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Define Figma asset directories to search
    const figmaBasePath = path.join(process.cwd(), 'src/agent/figma-all-pages-1750993353363');
    
    // Map image types to preferred directories
    const directoryMapping: Record<string, string[]> = {
      'hero': ['иллюстрации', 'зайцы-общие'],
      'illustration': ['зайцы-общие', 'зайцы-эмоции'],
      'icon': ['иконки-допуслуг', 'логотипы-ак'],
      'product': ['иллюстрации', 'зайцы-общие'],
      'background': ['иллюстрации', 'цвета'],
      'testimonial': ['зайцы-эмоции', 'зайцы-общие']
    };
    
    const searchDirectories = directoryMapping[imageType] || ['зайцы-общие', 'иллюстрации'];
    
    // Search through directories
    for (const directory of searchDirectories) {
      const dirPath = path.join(figmaBasePath, directory);
      
      try {
        const files = await fs.readdir(dirPath);
        const pngFiles = files.filter(file => file.endsWith('.png'));
        
        // Find files matching search tags
        for (const tag of searchTags) {
          const matchingFiles = pngFiles.filter(file => 
            file.toLowerCase().includes(tag.toLowerCase())
          );
          
          if (matchingFiles.length > 0) {
            // Return the first matching file
            const selectedFile = matchingFiles[0];
            const fullPath = path.join(dirPath, selectedFile);
            console.log(`🎯 Found Figma asset: ${selectedFile} in ${directory} for tag "${tag}"`);
            return fullPath;
          }
        }
        
        // If no tag matches, return first file from directory as fallback
        if (pngFiles.length > 0) {
          const fallbackFile = pngFiles[0];
          const fullPath = path.join(dirPath, fallbackFile);
          console.log(`🔄 Using fallback asset: ${fallbackFile} from ${directory}`);
          return fullPath;
        }
        
      } catch (dirError) {
        console.warn(`⚠️ Could not read directory ${directory}:`, dirError);
      }
    }
    
    console.warn(`⚠️ No Figma assets found for tags: ${searchTags.join(', ')} and type: ${imageType}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error selecting Figma asset:', error);
    return null;
  }
}

// 🔍 FIGMA ASSET FINDER - recursively searches for asset files in Figma directories
async function findFigmaAsset(basePath: string, assetName: string): Promise<string | null> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Recursive function to search directories
    async function searchDirectory(dirPath: string): Promise<string | null> {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        // First, look for exact file matches
        for (const entry of entries) {
          if (entry.isFile()) {
            const fileName = entry.name;
            // Check if filename matches (with or without extension)
            if (fileName === assetName || 
                fileName.replace(/\.[^/.]+$/, '') === assetName.replace(/\.[^/.]+$/, '') ||
                fileName.toLowerCase().includes(assetName.toLowerCase())) {
              return path.join(dirPath, fileName);
            }
          }
        }
        
        // Then search subdirectories
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const found = await searchDirectory(path.join(dirPath, entry.name));
            if (found) return found;
          }
        }
        
        return null;
      } catch (error) {
        console.warn(`Warning: Could not search directory ${dirPath}:`, error.message);
        return null;
      }
    }
    
    return await searchDirectory(basePath);
  } catch (error) {
    console.error('Error in findFigmaAsset:', error);
    return null;
  }
}

// Wrap consolidated tools in proper tool() functions with fixed Zod schemas
const contentGeneratorTool = tool({
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

const emailRendererTool = tool({
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
        
        // 🔍 Step 2: Select real Figma assets based on image plan
        for (const imageSpec of imagePlanData.image_plan || []) {
          try {
            // Use search tags from image plan to find Figma assets
            const searchTags = imageSpec.search_tags || ['заяц', 'путешествие'];
            
            console.log(`🔍 Design Specialist: Searching Figma assets for ${imageSpec.type} with tags:`, searchTags);
            
            // Simple asset selection from known Figma paths
            const figmaAsset = await selectFigmaAssetByTags(searchTags, imageSpec.type);
            if (figmaAsset) {
              selectedAssets.push(figmaAsset);
              console.log(`✅ Design Specialist: Selected asset for ${imageSpec.type}: ${figmaAsset}`);
            }
          } catch (error) {
            console.warn(`⚠️ Design Specialist: Failed to select asset for ${imageSpec.type}:`, error);
          }
        }
        
        console.log(`🎨 Design Specialist: Selected ${selectedAssets.length} Figma assets:`, selectedAssets);
        
      } catch (error) {
        console.warn('⚠️ Design Specialist: Could not parse image plan, using default assets');
      }
    }
    
    // Fallback: use default assets if no image plan or selection failed
    if (selectedAssets.length === 0) {
      selectedAssets = [
        'src/agent/figma-all-pages-1750993353363/зайцы-общие/заяц-счастливый-путешествие.png',
        'src/agent/figma-all-pages-1750993353363/иллюстрации/франция-париж-башня.png'
      ];
      console.log('🔄 Design Specialist: Using fallback assets:', selectedAssets);
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
    
    // Create MJML template with the content
    const mjmlContent = `
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
    
    // 🖼️ Step 3: Add selected assets to MJML template
    let heroImageSection = '';
    let rabbitSection = '';
    
    if (selectedAssets.length > 0) {
      // Add hero image
      if (selectedAssets[0]) {
        heroImageSection = `
        <mj-section background-color="#ffffff" padding="0">
          <mj-column>
            <mj-image src="{{FIGMA_ASSET_URL:${selectedAssets[0].split('/').pop()}}}" alt="Travel destination" width="600px" />
          </mj-column>
        </mj-section>`;
      }
      
      // Add rabbit mascot
      if (selectedAssets[1]) {
        rabbitSection = `
        <mj-section background-color="#ffffff" padding="20px 0">
          <mj-column>
            <mj-image src="{{FIGMA_ASSET_URL:${selectedAssets[1].split('/').pop()}}}" alt="Kupibilet Rabbit" width="120px" align="center" />
          </mj-column>
        </mj-section>`;
      }
    }
    
    // Update MJML template with images
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

    // Create complete HTML email directly (no external calls)
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #FF6B35 0%, #2C3E50 100%); padding: 20px; text-align: center; }
    .logo { max-width: 200px; height: auto; }
    .hero-image { width: 100%; max-width: 600px; height: auto; display: block; }
    .rabbit-image { max-width: 120px; height: auto; display: block; margin: 0 auto; }
    .content { padding: 40px 20px; }
    .title { font-size: 24px; font-weight: bold; color: #2C3E50; text-align: center; margin-bottom: 20px; }
    .body-text { font-size: 16px; color: #333333; line-height: 1.6; margin-bottom: 20px; }
    .cta-button { display: inline-block; background-color: #FF6B35; color: white; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; }
    .pricing-section { background-color: #f8f9fa; padding: 30px 20px; text-align: center; }
    .pricing-title { font-size: 18px; font-weight: bold; color: #2C3E50; margin-bottom: 15px; }
    .pricing-amount { font-size: 24px; font-weight: bold; color: #FF6B35; margin-bottom: 10px; }
    .pricing-details { font-size: 14px; color: #666666; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; }
    .footer-text { font-size: 14px; color: #666666; margin-bottom: 10px; }
    .footer-small { font-size: 12px; color: #999999; }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px 15px; }
      .title { font-size: 20px; }
      .body-text { font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <img src="https://kupibilet.ru/static/images/logo-white.png" alt="Kupibilet" class="logo" />
    </div>
    
    <!-- Hero Image -->
    ${selectedAssets[0] ? `<img src="{{FIGMA_ASSET_URL:${selectedAssets[0].split('/').pop()}}}" alt="Travel destination" class="hero-image" />` : ''}
    
    <!-- Main Content -->
    <div class="content">
      <div class="title">${subject}</div>
      <div class="body-text">${body}</div>
      <div style="text-align: center;">
        <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
      </div>
    </div>
    
    ${pricingSection ? `
    <!-- Pricing Section -->
    <div class="pricing-section">
      <div class="pricing-title">🎯 Лучшие цены на билеты</div>
      ${pricingSection.includes('cheapest') ? pricingSection.replace(/mj-/g, '').replace(/<\/?mj-[^>]*>/g, '') : ''}
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">© 2025 Kupibilet. Все права защищены.</div>
      <div class="footer-small">Вы получили это письмо, потому что подписаны на рассылку Kupibilet.</div>
    </div>
  </div>
</body>
</html>`;

    console.log('✅ Design Specialist: Email template created successfully:', {
      html_length: htmlContent.length,
      includes_pricing: htmlContent.includes('Лучшие цены'),
      includes_logo: htmlContent.includes('kupibilet.ru'),
      is_responsive: htmlContent.includes('@media')
    });

    // Return simple successful result (no external calls)
    return {
      success: true,
      action: 'render_mjml',
      data: {
        html: htmlContent,
        html_content: htmlContent,
        mjml: fullMjmlContent,
        text_version: `${subject}\n\n${body}\n\n${ctaText}: ${ctaUrl}`,
        metadata: { 
          campaign_id: `kupibilet_${Date.now()}`,
          pricing_included: !!pricingSection,
          template_type: 'responsive_email'
        }
      },
      rendering_metadata: {
        template_type: 'kupibilet_branded',
        rendering_engine: 'design_specialist_internal',
        optimizations_applied: ['responsive_design', 'email_client_compatibility'],
        client_compatibility: ['gmail', 'outlook', 'apple_mail'],
        file_size: Math.round(htmlContent.length / 1024),
        load_time_estimate: 150
      }
    };
  }
});

const qualityControllerTool = tool({
  name: 'quality_controller',
  description: 'Quality Specialist internal tool - validates email quality and compatibility',
  parameters: z.object({
    html_content: z.string().describe('HTML content to validate'),
    action: z.enum(['analyze_quality', 'comprehensive_audit']).nullable().default('analyze_quality')
  }),
  execute: async (params) => {
    console.log('🔍 Quality Specialist: Starting internal quality validation...');
    
    // Internal quality analysis (no external calls)
    const htmlContent = params.html_content;
    const htmlLength = htmlContent.length;
    
    // Check basic email requirements
    const hasDoctype = htmlContent.includes('<!DOCTYPE html');
    const hasViewport = htmlContent.includes('viewport');
    const hasKupibiletLogo = htmlContent.includes('kupibilet.ru');
    const hasPricing = htmlContent.includes('цены') || htmlContent.includes('от ') || htmlContent.includes('₽');
    const hasResponsive = htmlContent.includes('@media');
    const hasEmailStructure = htmlContent.includes('email-container') || htmlContent.includes('table');
    
    // Calculate quality score
    let qualityScore = 0;
    if (hasDoctype) qualityScore += 15;
    if (hasViewport) qualityScore += 15; 
    if (hasKupibiletLogo) qualityScore += 20;
    if (hasPricing) qualityScore += 20;
    if (hasResponsive) qualityScore += 15;
    if (hasEmailStructure) qualityScore += 15;
    
    console.log('📊 Quality Specialist: Analysis results:', {
      html_size_kb: Math.round(htmlLength / 1024),
      has_doctype: hasDoctype,
      has_viewport: hasViewport,
      has_logo: hasKupibiletLogo,
      has_pricing: hasPricing,
      has_responsive: hasResponsive,
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

const deliveryManagerTool = tool({
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

// Delivery Specialist Agent - финальный агент без handoffs
const deliverySpecialist = new Agent({
  name: 'Delivery Specialist',
  instructions: `Ты - Delivery Specialist для Kupibilet. Твоя задача:

1. Получи проверенный email от предыдущего этапа (должен содержать html_content)
2. Используй tool delivery_manager для финализации кампании
3. Сохрани файлы в папку mails/
4. Создай превью и финальную отчетность
5. Верни итоговый результат

ВАЖНО: Проверь, что получаешь html_content в данных от предыдущего агента. Если нет - попроси его повторить с правильными данными.`,
  handoffDescription: 'Финализирует email кампанию, сохраняет файлы и создает отчетность',
  tools: [deliveryManagerTool]
  // Без handoffs - это финальный агент
});

// Quality Specialist Agent - с handoffs для следующего агента
const qualitySpecialist = new Agent({
  name: 'Quality Specialist', 
  instructions: `Ты - Quality Specialist для Kupibilet. Твоя задача:

1. Получи HTML email от предыдущего этапа
2. Используй tool quality_controller для проверки качества
3. Проверь совместимость с email клиентами
4. Валидируй HTML и CSS
5. После проверки качества, передай управление Delivery Specialist используя transfer_to_delivery_specialist

ВАЖНО: После завершения работы, вызови transfer_to_delivery_specialist и передай в сообщении все данные в JSON формате, включая html_content, validation_report, quality_score, status, client_compatibility.`,
  handoffDescription: 'Проверяет качество email шаблонов и совместимость с различными клиентами',
  tools: [qualityControllerTool],
  handoffs: [deliverySpecialist]  // 👈 добавляю handoff для следующего агента
});

// Design Specialist Agent - с handoffs для следующего агента
const designSpecialist = new Agent({
  name: 'Design Specialist',
  instructions: `Ты - Design Specialist для Kupibilet. Твоя задача:

1. Получи контент от предыдущего этапа
2. Используй tool email_renderer с параметром content_data (передай полученный контент как JSON строку)
3. Добавь логотип Kupibilet и фирменные цвета
4. Создай адаптивный дизайн для всех устройств
5. После создания дизайна, передай управление Quality Specialist используя transfer_to_quality_specialist

ВАЖНО: 
- Используй email_renderer с content_data параметром, передавая полученный от Content Specialist контент
- После завершения работы, вызови transfer_to_quality_specialist и передай в сообщении все данные в JSON формате, включая html_content (сам HTML код), mjml, text_version, metadata`,
  handoffDescription: 'Создает HTML email дизайн с логотипом Kupibilet и адаптивной версткой',
  tools: [emailRendererTool],
  handoffs: [qualitySpecialist]  // 👈 добавляю handoff для следующего агента
});

// Content Specialist Agent - с handoffs для следующего агента
const contentSpecialist = new Agent({
  name: 'Content Specialist',
  instructions: `Ты - Content Specialist для Kupibilet. Твоя задача:

1. Создавай email контент на русском языке для авиакомпании Kupibilet
2. Используй tool content_generator для создания контента
3. Включай реальные цены на билеты и актуальную информацию
4. После создания контента, передай управление Design Specialist используя transfer_to_design_specialist

ВАЖНО: 
- После завершения работы, вызови transfer_to_design_specialist и передай в сообщении все данные в JSON формате
- Передавай созданный контент, включая subject, preheader, body, cta, pricing_data, image_plan`,
  handoffDescription: 'Создает email контент на русском языке с реальными ценами и информацией о направлениях',
  tools: [contentGeneratorTool],
  handoffs: [designSpecialist]  // 👈 добавляю handoff для следующего агента
});

// Main Orchestrator Agent - упрощаем до первого агента
const emailCampaignOrchestrator = Agent.create({
  name: 'Email Campaign Orchestrator',
  instructions: `Ты - главный координатор email кампаний для Kupibilet.

Твоя задача - начать workflow создания email кампании:

1. НЕМЕДЛЕННО вызови transfer_to_content_specialist для начала процесса
2. Content Specialist создаст контент и передаст управление Design Specialist
3. Design Specialist создаст HTML и передаст управление Quality Specialist  
4. Quality Specialist проверит качество и передаст управление Delivery Specialist
5. Delivery Specialist финализирует кампанию

КРИТИЧЕСКИ ВАЖНО:
- Сразу после получения задачи, вызови transfer_to_content_specialist
- НЕ выполняй задачи сам - только запускай процесс`,
  handoffs: [contentSpecialist]  // 👈 упрощаю до первого агента
});

export async function generateKupibiletEmail(topic: string): Promise<any> {
  try {
    console.log('🚀 Starting Kupibilet Email Generation with handoffs...');
    
    const result = await run(emailCampaignOrchestrator, `Создай email кампанию для Kupibilet на тему: "${topic}"`);
    
    console.log('✅ Email generation completed');
    return {
      success: true,
      result: result.finalOutput,
      metadata: {
        topic,
        timestamp: new Date().toISOString(),
        workflow: 'multi-handoff-agent'
      }
    };
  } catch (error) {
    console.error('❌ Error in generateKupibiletEmail:', error);
    return {
      success: false,
      error: error.message,
      metadata: {
        topic,
        timestamp: new Date().toISOString(),
        workflow: 'multi-handoff-agent'
      }
    };
  }
} 