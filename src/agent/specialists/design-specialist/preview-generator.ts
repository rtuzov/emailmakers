/**
 * Preview Generator
 * Generates preview files for email templates
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext } from './design-context';

/**
 * Generate preview files for email template
 */
export const generatePreviewFiles = tool({
  name: 'generatePreviewFiles',
  description: 'Generate preview files for email template including desktop and mobile previews',
  parameters: z.object({
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    mjml_template: z.object({}).strict().describe('Generated MJML template data'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n👁️ === PREVIEW GENERATION ===');
    
    try {
      // Load content context from OpenAI SDK context parameter - prioritize loaded context
      let contentContext;
      let mjmlTemplate;
      let campaignPath;
      
      // Try to get content context from design context first (loaded by loadDesignContext)
      if (context?.designContext?.content_context) {
        contentContext = context.designContext.content_context;
        campaignPath = context.designContext.campaign_path;
        console.log('✅ Using content context from design context (loaded by loadDesignContext)');
      } else if (params.content_context && Object.keys(params.content_context).length > 0) {
        contentContext = params.content_context;
        campaignPath = contentContext.campaign?.campaignPath;
        console.log('⚠️ Using content context from parameters (fallback)');
      } else if (context?.content_context) {
        contentContext = context.content_context;
        campaignPath = contentContext.campaign?.campaignPath;
        console.log('⚠️ Using content context from SDK context (fallback)');
      } else {
        throw new Error('Content context not found in parameters or context. loadDesignContext must be called first to load campaign context.');
      }
      
      // Get MJML template from design context or parameters
      if (context?.designContext?.mjml_template) {
        mjmlTemplate = context.designContext.mjml_template;
        console.log('✅ Using MJML template from design context');
      } else if (params.mjml_template && Object.keys(params.mjml_template).length > 0) {
        mjmlTemplate = params.mjml_template;
        console.log('⚠️ Using MJML template from parameters (fallback)');
      } else {
        throw new Error('MJML template not found in design context. generateMjmlTemplate must be completed first.');
      }
      
      // 🔧 LOAD HTML CONTENT FROM COMPILED FILE IF NOT AVAILABLE IN TEMPLATE
      let htmlContent = mjmlTemplate.html_content;
      if (!htmlContent) {
        try {
          const htmlTemplatePath = path.join(campaignPath, 'templates', 'email-template.html');
          htmlContent = await fs.readFile(htmlTemplatePath, 'utf8');
          console.log('✅ Loaded HTML content from compiled file');
        } catch (error) {
          console.warn('⚠️ Could not load HTML content from file:', error);
          htmlContent = 'HTML content not available - template may not be compiled yet';
        }
      }
      
      if (!campaignPath) {
        throw new Error('Campaign path is missing from content context. loadDesignContext must provide valid campaign path.');
      }
      
      // Create preview directory
      const previewDir = path.join(campaignPath, 'previews');
      await fs.mkdir(previewDir, { recursive: true });
      
      // Generate desktop preview HTML
      const desktopPreviewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Preview - Desktop</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      background: #f5f5f5; 
      font-family: Arial, sans-serif; 
    }
    .preview-container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    .preview-header { 
      background: #333; 
      color: white; 
      padding: 15px 20px; 
      font-size: 16px; 
      font-weight: bold; 
    }
    .email-content { 
      padding: 0; 
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      📧 Email Preview - Desktop (${contentContext.subject})
    </div>
    <div class="email-content">
      ${htmlContent}
    </div>
  </div>
</body>
</html>`;
      
      // Generate mobile preview HTML
      const mobilePreviewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preview - Mobile</title>
  <style>
    body { 
      margin: 0; 
      padding: 10px; 
      background: #f5f5f5; 
      font-family: Arial, sans-serif; 
    }
    .preview-container { 
      max-width: 375px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    }
    .preview-header { 
      background: #333; 
      color: white; 
      padding: 10px 15px; 
      font-size: 14px; 
      font-weight: bold; 
    }
    .email-content { 
      padding: 0; 
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      📱 Email Preview - Mobile (${contentContext.subject})
    </div>
    <div class="email-content">
      ${htmlContent}
    </div>
  </div>
</body>
</html>`;
      
      // Save preview files
      const desktopPreviewPath = path.join(previewDir, 'desktop-preview.html');
      const mobilePreviewPath = path.join(previewDir, 'mobile-preview.html');
      
      await fs.writeFile(desktopPreviewPath, desktopPreviewHtml, 'utf8');
      await fs.writeFile(mobilePreviewPath, mobilePreviewHtml, 'utf8');
      
      const previewFiles = {
        desktop_preview: desktopPreviewPath,
        mobile_preview: mobilePreviewPath,
        generated_at: new Date().toISOString()
      };
      
      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        preview_files: previewFiles,
        trace_id: params.trace_id
      });
      
      if (context) {
        context.designContext = updatedDesignContext;
      }
      
      console.log('✅ Preview files generated');
      console.log(`🖥️ Desktop preview: ${desktopPreviewPath}`);
      console.log(`📱 Mobile preview: ${mobilePreviewPath}`);
      
      return `Preview files generated successfully! Desktop preview: ${desktopPreviewPath}. Mobile preview: ${mobilePreviewPath}. Previews ready for review and testing.`;
      
    } catch (error) {
      console.error('❌ Preview generation failed:', error);
      throw error;
    }
  }
}); 