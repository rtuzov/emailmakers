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
      const contentContext = params.content_context;
      const mjmlTemplate = params.mjml_template;
      const campaignPath = contentContext.campaign?.campaignPath;
      
      if (!campaignPath) {
        throw new Error('Campaign path is missing from content context');
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
      ${mjmlTemplate.html_content || 'HTML content not available'}
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
      ${mjmlTemplate.html_content || 'HTML content not available'}
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