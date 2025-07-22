import { tool } from '@openai/agents';
import { z } from 'zod';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { 
  createCampaignFolder, 
  updateCampaignMetadata,
  contextProvider,
  dateIntelligence,
  createHandoffFile,
  type ExtendedRunContext,
  type CampaignWorkflowContext
} from './content/tools';
import { finalizeContentAndTransferToDesign } from '../core/specialist-finalization-tools';
import { getErrorMessage } from './content/utils/error-handling';

/**
 * Pricing Intelligence Tool
 * Analyzes pricing strategies and market positioning
 */
export const pricingIntelligence = tool({
  name: 'pricing_intelligence',
  description: 'Analyze pricing strategies, market positioning, and competitive landscape for campaign content',
  parameters: z.object({
    company: z.string().describe('Company or brand name'),
    industry: z.string().describe('Industry sector'),
    targetMarket: z.string().describe('Target market segment'),
    priceRange: z.string().describe('Price range or positioning (budget/mid/premium)'),
    competitors: z.array(z.string()).describe('Key competitors to analyze').optional(),
    campaignType: z.string().describe('Type of campaign (promotional/brand/product launch)').optional()
  }),
  execute: async (args: any, context?: any) => {
    try {
      const campaignContext = context as CampaignWorkflowContext;
      
      console.log('🔍 Analyzing pricing intelligence...');
      
      // const _analysisSchema = z.object({ // Unused variable
      //   pricePositioning: z.object({
      //     strategy: z.string(),
      //     justification: z.string(),
      //     marketPosition: z.enum(['budget', 'value', 'premium', 'luxury'])
      //   }),
      //   competitiveAnalysis: z.object({
      //     strengths: z.array(z.string()),
      //     opportunities: z.array(z.string()),
      //     threats: z.array(z.string())
      //   }),
      //   messagingRecommendations: z.object({
      //     valueProposition: z.string(),
      //     keyMessages: z.array(z.string()),
      //     avoidancePoints: z.array(z.string())
      //   }),
      //   marketInsights: z.object({
      //     trends: z.array(z.string()),
      //     opportunities: z.array(z.string()),
      //     seasonality: z.string()
      //   })
      // });

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: `Analyze pricing intelligence for ${args.company} in the ${args.industry} industry.
        
Target Market: ${args.targetMarket}
Price Range: ${args.priceRange}
${args.competitors ? `Competitors: ${args.competitors.join(', ')}` : ''}
${args.campaignType ? `Campaign Type: ${args.campaignType}` : ''}

Provide comprehensive pricing intelligence including market positioning, competitive analysis, messaging recommendations, and market insights.

Return as JSON with this structure:
{
  "pricePositioning": {
    "strategy": "string",
    "justification": "string", 
    "marketPosition": "budget|value|premium|luxury"
  },
  "competitiveAnalysis": {
    "strengths": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "messagingRecommendations": {
    "valueProposition": "string",
    "keyMessages": ["string"],
    "avoidancePoints": ["string"]
  },
  "marketInsights": {
    "trends": ["string"],
    "opportunities": ["string"],
    "seasonality": "string"
  }
}`
        }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      const result = { object: JSON.parse(content) };

      // Save analysis to campaign folder
      if (campaignContext.campaignId) {
        const analysisPath = path.join('campaigns', campaignContext.campaignId, 'data', 'pricing-analysis.json');
        await fs.promises.mkdir(path.dirname(analysisPath), { recursive: true });
        await fs.promises.writeFile(analysisPath, JSON.stringify(result.object, null, 2));
      }
    
    return {
        success: true,
        analysis: result.object,
        summary: `Pricing intelligence analysis completed for ${args.company}. Market position: ${result.object.pricePositioning.marketPosition}. Key opportunity: ${result.object.competitiveAnalysis.opportunities[0] || 'Enhanced value communication'}.`
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Pricing intelligence analysis failed:', errorMessage);
    return {
        success: false,
        error: `Pricing analysis failed: ${errorMessage}`
      };
    }
  }
});

/**
 * Asset Strategy Tool
 * Develops comprehensive asset and content strategy
 */
export const assetStrategy = {
  description: 'Develop comprehensive asset strategy including visual assets, content types, and distribution channels',
  parameters: z.object({
    campaignGoals: z.array(z.string()).describe('Primary campaign objectives'),
    targetAudience: z.string().describe('Target audience description'),
    channels: z.array(z.string()).describe('Distribution channels (email, social, web, etc.)'),
    brandGuidelines: z.string().describe('Brand guidelines and restrictions').optional(),
    contentTypes: z.array(z.string()).describe('Required content types').optional(),
    timeline: z.string().describe('Campaign timeline and key dates').optional()
  }),
  execute: async (args: any, context: ExtendedRunContext) => {
    try {
      const campaignContext = context as CampaignWorkflowContext;
      
      console.log('📋 Developing asset strategy...');
      
      // const _strategySchema = z.object({ // Unused variable
      //   assetPlan: z.object({
      //     visualAssets: z.array(z.object({
      //       type: z.string(),
      //       purpose: z.string(),
      //       specifications: z.string(),
      //       priority: z.enum(['high', 'medium', 'low'])
      //     })),
      //     contentAssets: z.array(z.object({
      //       type: z.string(),
      //       format: z.string(),
      //       purpose: z.string(),
      //       wordCount: z.number().optional()
      //     }))
      //   }),
      //   channelStrategy: z.object({
      //     primary: z.array(z.string()),
      //     secondary: z.array(z.string()),
      //     adaptations: z.array(z.object({
      //       channel: z.string(),
      //       requirements: z.string(),
      //       modifications: z.string()
      //     }))
      //   }),
      //   productionTimeline: z.object({
      //     phases: z.array(z.object({
      //       phase: z.string(),
      //       duration: z.string(),
      //       deliverables: z.array(z.string()),
      //       dependencies: z.array(z.string()).optional()
      //     }))
      //   }),
      //   qualityGuidelines: z.object({
      //     brandCompliance: z.array(z.string()),
      //     technicalSpecs: z.array(z.string()),
      //     approvalProcess: z.array(z.string())
      //   })
      // });

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: `Develop a comprehensive asset strategy for a campaign with the following requirements:

Campaign Goals: ${args.campaignGoals.join(', ')}
Target Audience: ${args.targetAudience}
Distribution Channels: ${args.channels.join(', ')}
${args.brandGuidelines ? `Brand Guidelines: ${args.brandGuidelines}` : ''}
${args.contentTypes ? `Required Content Types: ${args.contentTypes.join(', ')}` : ''}
${args.timeline ? `Timeline: ${args.timeline}` : ''}

Create a detailed asset strategy including visual and content assets, channel-specific adaptations, production timeline, and quality guidelines.

Return as JSON with this structure:
{
  "assetPlan": {
    "visualAssets": [{"type": "string", "purpose": "string", "specifications": "string", "priority": "high|medium|low"}],
    "contentAssets": [{"type": "string", "format": "string", "purpose": "string", "wordCount": number}]
  },
  "channelStrategy": {
    "primary": ["string"],
    "secondary": ["string"],
    "adaptations": [{"channel": "string", "requirements": "string", "modifications": "string"}]
  },
  "productionTimeline": {
    "phases": [{"phase": "string", "duration": "string", "deliverables": ["string"], "dependencies": ["string"]}]
  },
  "qualityGuidelines": {
    "brandCompliance": ["string"],
    "technicalSpecs": ["string"],
    "approvalProcess": ["string"]
  }
}`
        }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      const result = { object: JSON.parse(content) };

      // Save strategy to campaign folder
      if (campaignContext.campaignId) {
        const strategyPath = path.join('campaigns', campaignContext.campaignId, 'data', 'asset-strategy.json');
        await fs.promises.mkdir(path.dirname(strategyPath), { recursive: true });
        await fs.promises.writeFile(strategyPath, JSON.stringify(result.object, null, 2));
      }
    
      return {
        success: true,
        strategy: result.object,
        summary: `Asset strategy developed with ${result.object.assetPlan.visualAssets.length} visual assets and ${result.object.assetPlan.contentAssets.length} content assets across ${result.object.channelStrategy.primary.length} primary channels.`
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Asset strategy development failed:', errorMessage);
      return {
        success: false,
        error: `Asset strategy failed: ${errorMessage}`
      };
    }
  }
};

/**
 * Content Generator Tool
 * Generates specific content pieces based on strategy and requirements
 */
export const contentGenerator = {
  description: 'Generate specific content pieces including copy, headlines, CTAs, and messaging based on campaign strategy',
  parameters: z.object({
    contentType: z.enum(['email', 'social', 'web', 'ad', 'newsletter', 'landing_page']).describe('Type of content to generate'),
    purpose: z.string().describe('Specific purpose or goal of the content'),
    audience: z.string().describe('Target audience for this content'),
    tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful', 'urgent']).describe('Desired tone'),
    length: z.enum(['short', 'medium', 'long']).describe('Content length preference'),
    keyMessages: z.array(z.string()).describe('Key messages to include'),
    cta: z.string().describe('Call-to-action requirement').optional(),
    constraints: z.string().describe('Any specific constraints or requirements').optional()
  }),
  execute: async (args: any, context: ExtendedRunContext) => {
    try {
      const campaignContext = context as CampaignWorkflowContext;
      
      console.log(`✍️ Generating ${args.contentType} content...`);
      
      // const _contentSchema = z.object({ // Unused variable
      //   content: z.object({
      //     headline: z.string(),
      //     subheadline: z.string().optional(),
      //     body: z.string(),
      //     cta: z.string(),
      //     alternatives: z.array(z.object({
      //       element: z.string(),
      //       variation: z.string()
      //     }))
      //   }),
      //   optimization: z.object({
      //     seoKeywords: z.array(z.string()).optional(),
      //     readabilityScore: z.string(),
      //     engagementTactics: z.array(z.string()),
      //     testingRecommendations: z.array(z.string())
      //   }),
      //   metadata: z.object({
      //     wordCount: z.number(),
      //     characterCount: z.number(),
      //     estimatedReadTime: z.string(),
      //     audience: z.string(),
      //     purpose: z.string()
      //   })
      // });

      const lengthGuide: Record<string, string> = {
        short: '50-150 words',
        medium: '150-300 words', 
        long: '300-500 words'
      };

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: `Generate ${args.contentType} content with the following specifications:

Purpose: ${args.purpose}
Target Audience: ${args.audience}
Tone: ${args.tone}
Length: ${args.length} (${lengthGuide[args.length]})
Key Messages: ${args.keyMessages.join(', ')}
${args.cta ? `CTA Requirement: ${args.cta}` : ''}
${args.constraints ? `Constraints: ${args.constraints}` : ''}

Create compelling, audience-appropriate content that achieves the stated purpose. Include optimization recommendations and alternatives for A/B testing.

Return as JSON with this structure:
{
  "content": {
    "headline": "string",
    "subheadline": "string",
    "body": "string",
    "cta": "string",
    "alternatives": [{"element": "string", "variation": "string"}]
  },
  "optimization": {
    "seoKeywords": ["string"],
    "readabilityScore": "string",
    "engagementTactics": ["string"],
    "testingRecommendations": ["string"]
  },
  "metadata": {
    "wordCount": number,
    "characterCount": number,
    "estimatedReadTime": "string",
    "audience": "string",
    "purpose": "string"
  }
}`
        }],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      const result = { object: JSON.parse(content) };

      // Save content to campaign folder
      if (campaignContext.campaignId) {
        const contentPath = path.join('campaigns', campaignContext.campaignId, 'content', `${args.contentType}-content.json`);
        await fs.promises.mkdir(path.dirname(contentPath), { recursive: true });
        await fs.promises.writeFile(contentPath, JSON.stringify(result.object, null, 2));
      }

      return {
        success: true,
        content: result.object,
        summary: `${args.contentType} content generated successfully. ${result.object.metadata.wordCount} words, ${result.object.metadata.estimatedReadTime} read time. Includes ${result.object.content.alternatives.length} A/B test variations.`
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      console.error(`❌ Content generation failed for ${args.contentType}:`, errorMessage);
      return {
        success: false,
        error: `Content generation failed: ${errorMessage}`
      };
    }
  }
};

// Export all tools for the Content Specialist
export const contentSpecialistTools = [
  createCampaignFolder,
  updateCampaignMetadata,
  contextProvider,
  dateIntelligence,
  createHandoffFile,
  finalizeContentAndTransferToDesign,
  pricingIntelligence,
  assetStrategy,
  contentGenerator
]; 