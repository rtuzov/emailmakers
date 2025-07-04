import { tool } from '@openai/agents';

// Import consolidated tools statically
import { figmaAssetManager, figmaAssetManagerSchema } from './tools/consolidated/figma-asset-manager';
import { pricingIntelligence, pricingIntelligenceSchema } from './tools/consolidated/pricing-intelligence';
import { contentGenerator, contentGeneratorSchema } from './tools/consolidated/content-generator';
import { emailRenderer, emailRendererSchema } from './tools/email-renderer-v2';
import { qualityController, qualityControllerSchema } from './tools/consolidated/quality-controller';
import { deliveryManager, deliveryManagerSchema } from './tools/consolidated/delivery-manager';
import { contextProvider, contextProviderSchema } from './tools/consolidated/context-provider';

/**
 * Returns the full list of tools for EmailGeneratorAgent.
 * Using static imports for synchronous execution
 */
export function createAgentTools() {

  return [
    // 🎨 Figma Asset Manager - Consolidated asset operations
    tool({
      name: 'figma_asset_manager',
      description:
        'Figma Asset Manager - Unified asset management for all Figma operations including search, folder listing, sprite splitting, and identica selection. Uses LOCAL files only, no API calls. Replaces get_figma_assets, get_figma_folders_info, split_figma_sprite, and select_identica_creatives.',
      parameters: figmaAssetManagerSchema,
      execute: figmaAssetManager,
    }),

    // 💰 Pricing Intelligence - Enhanced price analysis
    tool({
      name: 'pricing_intelligence',
      description:
        'Pricing Intelligence - Advanced price analysis with market insights, trend forecasting, route comparison, and intelligent recommendations. Enhanced version of get_prices with analytics and market intelligence.',
      parameters: pricingIntelligenceSchema,
      execute: pricingIntelligence,
    }),

    // ✍️ Content Generator - Intelligent content creation
    tool({
      name: 'content_generator',
      description:
        'Content Generator - Intelligent content creation with context awareness, A/B testing variants, audience personalization, and optimization. Enhanced version of generate_copy with advanced features.',
      parameters: contentGeneratorSchema,
      execute: contentGenerator,
    }),

    // 📧 Email Renderer - Unified rendering system
    tool({
      name: 'email_renderer',
      description:
        'Email Renderer - Unified email rendering with multiple engine support including MJML, React components, advanced systems, and seasonal components. Replaces render_mjml, render_component, advanced_component_system, and seasonal_component_system.',
      parameters: emailRendererSchema,
      execute: emailRenderer,
    }),

    // 🔍 Quality Controller - Comprehensive QA system
    tool({
      name: 'quality_controller',
      description:
        'Quality Controller - Comprehensive email quality assurance including AI analysis, version comparison, patch application, rendering tests, and automated fixes. Replaces ai_quality_consultant, diff_html, patch_html, and render_test.',
      parameters: qualityControllerSchema,
      execute: qualityController,
    }),

    // 🚀 Delivery Manager - Unified deployment system
    tool({
      name: 'delivery_manager',
      description:
        'Delivery Manager - Unified email campaign delivery and deployment including asset upload, screenshot generation, visual testing, campaign deployment, and CDN distribution. Replaces upload_s3, generate_screenshots, and percy_snap.',
      parameters: deliveryManagerSchema,
      execute: deliveryManager,
    }),

    // 🌍 Context Provider - Enhanced contextual intelligence
    tool({
      name: 'context_provider',
      description:
        'Context Provider - Comprehensive contextual intelligence including temporal, seasonal, cultural, marketing, and travel context for email campaigns. Enhanced version of get_current_date with multi-dimensional context analysis.',
      parameters: contextProviderSchema,
      execute: contextProvider,
    }),
  ];
} 