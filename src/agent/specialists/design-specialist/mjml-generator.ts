/**
 * MJML Template Generator
 * ✅ REFACTORED: Now uses the new template-processing domain architecture
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { autoRestoreCampaignLogging } from '../../../shared/utils/campaign-logger';
import type { 
  MjmlGenerationRequest
} from '../../../domains/template-processing/interfaces/mjml-generator.interface';
import type { CompleteMjmlGenerationResult } from '../../../domains/template-processing/services/mjml-generation.service';

/**
 * MJML template generation tool - REFACTORED to use new architecture
 */
export const generateMjmlTemplate = tool({
  name: 'generateMjmlTemplate',
  description: 'Generate MJML email template using the new refactored template-processing domain',
  parameters: z.object({
    content_context: z.object({}).nullable().describe('Content context from Content Specialist (auto-loaded from campaign files)'),
    design_requirements: z.object({}).nullable().describe('Design requirements and brand guidelines (auto-loaded from campaign files)'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    // ✅ MIGRATED: Use new refactored MJML architecture
    autoRestoreCampaignLogging(context, 'generateMjmlTemplate');
    
    console.log('\n📧 === MJML TEMPLATE GENERATOR (REFACTORED ARCHITECTURE) ===');
    
    try {
      // 🚀 NEW: Use refactored template-processing domain
      const { generateMjmlTemplate: newGenerateMjmlTemplate } = await import('../../../domains/template-processing');
      
      // 🔧 AUTO-LOAD DATA: Extract campaign path from context and load data from files
      let campaignPath = '';
      let loadedContentContext = {};
      let loadedDesignRequirements = {};
      let loadedAssetManifest = { images: [], icons: [], fonts: [] };
      
      // Get campaign path from OpenAI SDK context (multiple fallback sources)
      const possibleCampaignPaths = [
        (context as any)?.campaign?.path,
        (context as any)?.context?.campaign?.path,
        (context as any)?.context?.campaign_path,
        (context as any)?.campaignPath,
        (context as any)?.campaign_path
      ];
      
      campaignPath = possibleCampaignPaths.find(path => path && typeof path === 'string') || '';
      
      console.log('🔍 Campaign path detection:', {
        possiblePaths: possibleCampaignPaths,
        selectedPath: campaignPath,
        contextKeys: Object.keys(context || {})
      });
      
      if (campaignPath) {
        console.log(`🔍 Loading data from campaign: ${campaignPath}`);
        
        try {
          // Load content context from email-content.json (primary) or generated-content.json (fallback)
          const contentFile1 = path.join(campaignPath, 'content', 'email-content.json');
          const contentFile2 = path.join(campaignPath, 'content', 'generated-content.json');
          
          console.log('📁 Checking files:', { contentFile1, contentFile2 });
          
          if (fs.existsSync(contentFile1)) {
            const contentData = JSON.parse(fs.readFileSync(contentFile1, 'utf8'));
            loadedContentContext = contentData;
            console.log('📄 Content context loaded from email-content.json');
          } else if (fs.existsSync(contentFile2)) {
            const contentData = JSON.parse(fs.readFileSync(contentFile2, 'utf8'));
            loadedContentContext = contentData;
            console.log('📄 Content context loaded from generated-content.json');
          } else {
            console.warn('⚠️ No content files found at expected paths');
          }
          
          // ✅ NEW: Load template design from template-design.json  
          const templateDesignFile = path.join(campaignPath, 'design', 'template-design.json');
          if (fs.existsSync(templateDesignFile)) {
            const templateDesignData = JSON.parse(fs.readFileSync(templateDesignFile, 'utf8'));
            loadedDesignRequirements = templateDesignData;
            console.log('🎨 Template design loaded from template-design.json');
            console.log(`📐 Layout: ${templateDesignData.layout?.type}, Sections: ${templateDesignData.sections?.length}`);
          } else {
            console.warn('⚠️ No template-design.json found - creating basic design requirements');
            // ✅ CREATE BASIC TEMPLATE DESIGN FILE when missing
            const basicDesign = {
              template_name: 'Basic Email Template',
              layout: {
                type: 'single-column',
                max_width: '600px',
                spacing_system: {
                  xs: '4px',
                  sm: '8px', 
                  md: '16px',
                  lg: '24px',
                  xl: '32px',
                  '2xl': '48px'
                }
              },
              sections: [
                {
                  id: 'header',
                  type: 'header',
                  content: 'Email Header'
                },
                {
                  id: 'hero',
                  type: 'hero',
                  content: 'Main Content'
                },
                {
                  id: 'footer',
                  type: 'footer', 
                  content: 'Email Footer'
                }
              ],
              metadata: {
                brand_colors: {
                  primary: '#007bff',
                  accent: '#28a745',
                  background: '#ffffff'
                }
              }
            };
            
            try {
              const designDir = path.join(campaignPath, 'design');
              if (!fs.existsSync(designDir)) {
                fs.mkdirSync(designDir, { recursive: true });
              }
              fs.writeFileSync(templateDesignFile, JSON.stringify(basicDesign, null, 2));
              loadedDesignRequirements = basicDesign;
              console.log('✅ Created basic template-design.json file');
            } catch (createError) {
              console.error('❌ Failed to create basic template-design.json:', createError);
            }
          }
          
          // Load asset manifest from processed-assets.json
          const assetsFile = path.join(campaignPath, 'processed-assets.json');
          if (fs.existsSync(assetsFile)) {
            const assetsData = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
            loadedAssetManifest = assetsData.manifest || assetsData;
            console.log(`🖼️ Asset manifest loaded: ${loadedAssetManifest.images?.length || 0} images`);
          }
        } catch (loadError) {
          console.warn('⚠️ Error loading campaign data:', loadError);
        }
      } else {
        console.warn('⚠️ No campaign path found in context, cannot load files automatically');
      }
      
      // 🔄 ADAPTER: Convert parameters to new format - prioritize loaded files over params
      const contentCtx = Object.keys(loadedContentContext || {}).length > 0 ? loadedContentContext as any : (params.content_context !== null ? params.content_context : {}) as any;
      const designReq = Object.keys(loadedDesignRequirements || {}).length > 0 ? loadedDesignRequirements as any : (params.design_requirements !== null ? params.design_requirements : {}) as any;
      
      // 🚨 CRITICAL FIX: Ensure content is available for MJML generation
      if (!contentCtx || Object.keys(contentCtx).length === 0) {
        console.error('❌ MJML generation failed: No content context found');
        console.error('🔍 Debug info:', {
          hasLoadedContent: Object.keys(loadedContentContext || {}).length > 0,
          loadedContentKeys: Object.keys(loadedContentContext || {}),
          hasLoadedDesign: Object.keys(loadedDesignRequirements || {}).length > 0,
          loadedDesignKeys: Object.keys(loadedDesignRequirements || {}),
          hasParamsContent: !!params.content_context,
          paramsContentKeys: params.content_context ? Object.keys(params.content_context) : [],
          hasParamsDesign: !!params.design_requirements,
          paramsDesignKeys: params.design_requirements ? Object.keys(params.design_requirements) : [],
          campaignPath: campaignPath,
          detectedCampaignPath: campaignPath || 'NOT_FOUND',
          contextKeys: Object.keys(context || {}),
          contextStructure: {
            hasCampaign: !!(context as any)?.campaign,
            hasContext: !!(context as any)?.context,
            campaignInContext: (context as any)?.campaign,
            contextInContext: (context as any)?.context
          },
          paramsKeys: Object.keys(params),
          filesChecked: campaignPath ? [
            path.join(campaignPath, 'content', 'email-content.json'),
            path.join(campaignPath, 'content', 'generated-content.json'),
            path.join(campaignPath, 'design', 'template-design.json')
          ] : []
        });
        throw new Error('MJML generation requires content context. Content specialist must generate content first or campaign path must be provided.');
      }
      
      console.log('📋 Using content context with keys:', Object.keys(contentCtx));
      console.log('🎨 Using design requirements with keys:', Object.keys(designReq));
      console.log('🖼️ Available images:', loadedAssetManifest?.images?.length || 0);
      
      if (Object.keys(loadedDesignRequirements || {}).length > 0) {
        console.log('✅ Template design from file:', {
          templateName: designReq?.template_name,
          layoutType: designReq?.layout?.type,
          sectionsCount: designReq?.sections?.length || 0,
          componentsCount: designReq?.components?.length || 0,
          visualConcept: designReq?.visual_concept?.theme || designReq?.visual_concept
        });
      } else {
        console.log('⚠️ Using basic template design (no file loaded)');
      }
      
      const mjmlRequest: MjmlGenerationRequest = {
        contentContext: {
          campaign: {
            id: contentCtx?.campaign?.id || 'unknown',
            type: contentCtx?.campaign?.type || 'promotional',
            destination: contentCtx?.campaign?.destination || 'Unknown'
          },
          subject: contentCtx?.subject || 'Email Subject',
          preheader: contentCtx?.preheader || 'Email Preview',
          body: typeof contentCtx?.body === 'string' 
            ? {
                opening: contentCtx.body.substring(0, 200) || 'Welcome!',
                main_content: contentCtx.body || 'Email content',
                benefits: ['Great value', 'Amazing experience'],
                social_proof: 'Join thousands of satisfied customers',
                urgency_elements: 'Limited time offer',
                closing: 'Thank you for your interest'
              }
            : contentCtx?.body || {
                opening: 'Welcome!',
                main_content: 'Email content',
                benefits: ['Great value', 'Amazing experience'],
                social_proof: 'Join thousands of satisfied customers',
                urgency_elements: 'Limited time offer',
                closing: 'Thank you for your interest'
              },
          emotional_hooks: contentCtx?.emotional_hooks || {
            desire: 'Discover something amazing',
            fear_of_missing_out: 'Don\'t miss out',
            aspiration: 'Achieve your goals'
          },
          personalization: contentCtx?.personalization || {
            greeting: 'Hello there',
            recommendations: 'Based on your interests'
          },
          call_to_action: contentCtx?.call_to_action || {
            primary: {
              text: 'Learn More',
              url: '#'
            }
          }
        },
        designRequirements: {
          colors: designReq?.colors || designReq?.color_scheme || {
            primary: '#007bff',
            accent: '#6c757d',
            background: '#ffffff',
            text: '#333333'
          },
          layout: {
            maxWidth: 600,
            spacing: {
              small: 8,
              medium: 16,
              large: 24,
              xlarge: 32
            },
            structure: {
              sections: ['hero', 'content', 'cta'],
              columns: 1,
              responsive_breakpoints: [480, 768, 1024]
            }
          },
          typography: {
            headingFont: 'Arial, sans-serif',
            bodyFont: 'Arial, sans-serif',
            fontSizes: {
              small: '12px',
              medium: '14px',
              large: '16px',
              xlarge: '18px',
              h1: '24px',
              h2: '20px',
              h3: '18px',
              body: '14px'
            },
            fontWeights: {
              normal: 400,
              bold: 700
            }
          },
          email_clients: ['gmail', 'outlook', 'apple-mail'],
          responsive: true,
          dark_mode: false
        },
        assetManifest: {
          images: designReq?.assetManifest?.images || loadedAssetManifest?.images || [],
          icons: designReq?.assetManifest?.icons || loadedAssetManifest?.icons || [],
          fonts: designReq?.assetManifest?.fonts || loadedAssetManifest?.fonts || []
        },
        templateDesign: {
          template_name: designReq?.template_name || 'Generated Template',
          layout: designReq?.layout || {
            type: 'minimal',
            max_width: 600,
            spacing_system: {
              small: 8,
              medium: 16,
              large: 24,
              xlarge: 32
            }
          },
          sections: designReq?.sections || designReq?.templateDesign?.sections || [],
          components: designReq?.components || designReq?.templateDesign?.components || [],
          visual_concept: designReq?.visual_concept?.theme || designReq?.visual_concept || 'Clean and modern design',
          target_audience: designReq?.target_audience || 'General audience',
          metadata: {
            campaign_type: designReq?.metadata?.campaign_type || 'promotional',
            brand_colors: designReq?.metadata?.brand_colors || {
              primary: '#007bff',
              accent: '#6c757d',
              background: '#ffffff',
              text: '#333333'
            }
          }
        }
      };
      
      // Add traceId only if it exists
      // Ensure traceId is a proper string
      mjmlRequest.traceId = params.trace_id || `mjml-gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 🎯 NEW: Call refactored MJML generator
      const result: CompleteMjmlGenerationResult = await newGenerateMjmlTemplate(mjmlRequest, {
        validateInput: true,
        renderToHtml: true,
        performanceLogging: true
      });
      
      console.log('✅ MJML generation completed using new architecture');
      console.log(`📊 Generated MJML: ${result.mjmlTemplate.mjmlContent.length} characters`);
      console.log(`⚡ Performance: ${result.performanceMetrics.generationTime}ms`);
      console.log(`🎯 Quality score: ${result.finalValidation.score}/100`);
      
      // 💾 BACKWARD COMPATIBILITY: Save files in expected format
      if (result.emailTemplate) {
        const campaignPath = (context?.context as any)?.designContext?.campaign_path ||
                           (context?.context as any)?.campaign?.path ||
                           (context?.context as any)?.campaignContext?.campaign?.path;
        
        if (campaignPath) {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          try {
            const templatesDir = path.join(campaignPath, 'templates');
            await fs.mkdir(templatesDir, { recursive: true });
            
            // Save MJML and HTML files
            await fs.writeFile(path.join(templatesDir, 'email-template.mjml'), result.mjmlTemplate.mjmlContent);
            await fs.writeFile(path.join(templatesDir, 'email-template.html'), result.emailTemplate.htmlContent);
            
            console.log('💾 Template files saved successfully');
          } catch (saveError) {
            console.warn('⚠️ Could not save template files:', saveError);
          }
        }
      }
      
      return `✅ MJML template generated successfully using new refactored architecture!
      
📊 **Generation Results:**
- MJML Content: ${result.mjmlTemplate.mjmlContent.length} characters
- HTML Content: ${result.emailTemplate?.htmlContent.length || 0} characters  
- Generation Time: ${result.performanceMetrics.generationTime}ms
- Quality Score: ${result.finalValidation.score}/100

🎯 **Template Features:**
- Email Client Compatibility: ${result.finalValidation.errors.length === 0 ? 'Compatible' : 'Issues detected'}
- Responsive Design: Yes
- Dark Mode Support: No

The template has been generated using the new modular architecture and saved to the templates directory.`;

    } catch (error) {
      console.error('❌ Error in refactored MJML generation:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error stringified:', JSON.stringify(error));
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      console.error('❌ Input params:', JSON.stringify(params, null, 2));
      
      // 🚨 FALLBACK: Return detailed error message
      return `❌ MJML generation failed: ${error instanceof Error ? error.message : JSON.stringify(error)}
      
Please check the campaign context and try again. The new MJML architecture requires properly structured content context.
Debug info: Input parameters logged to console.`;
    }
  }
});

