/**
 * Preview Generator
 * Generates preview files for email templates
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { buildDesignContext, loadContextFromHandoffFiles } from './design-context';
import { logToFile } from '../../../shared/utils/campaign-logger';

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
    logToFile('info', 'Preview generation started', 'DesignSpecialist-Preview', params.trace_id || undefined);
    
    try {
      // Load content context from OpenAI SDK context parameter - prioritize loaded context
      let contentContext;
      let mjmlTemplate;
      let campaignPath;
      
      // Enhanced campaign path extraction with multiple fallback strategies
      if ((context?.context as any)?.designContext?.content_context) {
        contentContext = (context?.context as any)?.designContext?.content_context;
        campaignPath = (context?.context as any)?.designContext?.campaign_path;
        console.log('✅ Using content context from design context (loaded by loadDesignContext)');
      } else {
        console.warn('⚠️ Content context not found in design context, attempting multiple fallback strategies...');
        
        // Strategy 1: Try from context campaign
        campaignPath = (context as any)?.campaign?.path || 
                      (context as any)?.campaign?.campaignPath ||
                      (context as any)?.campaignContext?.campaignPath ||
                      (context as any)?.agentInput?.context?.campaignPath;
        
        // Strategy 2: Try from context properties
        if (!campaignPath) {
          campaignPath = (context as any)?.campaignPath || 
                        (context as any)?.campaign_path;
        }
        
        // Strategy 3: Auto-detect latest campaign
        if (!campaignPath) {
          console.log('⚠️ Campaign path not in context, auto-detecting latest campaign...');
          try {
            const fs = await import('fs/promises');
            const pathModule = await import('path');
            const campaignsDir = pathModule.join(process.cwd(), 'campaigns');
            const folders = await fs.readdir(campaignsDir);
            
            const latestCampaign = folders
              .filter(folder => folder.startsWith('campaign_'))
              .sort()
              .pop();
              
            if (latestCampaign) {
              campaignPath = pathModule.join(campaignsDir, latestCampaign);
              console.log('✅ Auto-detected campaign path:', campaignPath);
            }
          } catch (error) {
            console.error('❌ Auto-detection failed:', error);
          }
        }
        
        // Load content context if we have a path
        if (campaignPath) {
          try {
            const contextData = await loadContextFromHandoffFiles(campaignPath);
            contentContext = contextData?.content_context;
            if (!contentContext) {
              throw new Error('Content context not found in handoff files. loadDesignContext must be called first.');
            }
            console.log('✅ Loaded content context from handoff files via fallback strategy');
          } catch (error) {
            console.error('❌ Failed to load context from handoff files:', error);
            throw new Error(`Failed to load content context: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          throw new Error('Campaign path could not be determined from any source. Ensure campaign context is properly passed.');
        }
      }
      
      // Get MJML template from design context  
      if ((context?.context as any)?.designContext?.mjml_template) {
        mjmlTemplate = (context?.context as any)?.designContext?.mjml_template;
        console.log('✅ Using MJML template from design context');
      } else {
        console.log('⚠️ MJML template not found in design context, attempting to load from file...');
        // Fallback: try to load from file
        if (campaignPath) {
          const mjmlPath = path.join(campaignPath, 'templates', 'email-template.mjml');
          const htmlPath = path.join(campaignPath, 'templates', 'email-template.html');
          
          // ✅ FIX: Check if files exist before reading
          const mjmlExists = await fs.access(mjmlPath).then(() => true).catch(() => false);
          const htmlExists = await fs.access(htmlPath).then(() => true).catch(() => false);
          
          if (mjmlExists && htmlExists) {
            try {
              const mjmlSource = await fs.readFile(mjmlPath, 'utf8');
              const htmlContent = await fs.readFile(htmlPath, 'utf8');
              mjmlTemplate = {
                source: mjmlSource,
                html_content: htmlContent,
                mjml_path: mjmlPath,
                html_path: htmlPath
              };
              console.log('✅ MJML template loaded from file');
            } catch (error) {
              throw new Error(`Failed to read MJML template files: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            console.log('📁 Available template files:', {
              mjmlExists,
              htmlExists,
              mjmlPath,
              htmlPath
            });
            throw new Error('MJML template files not found in templates directory. generateMjmlTemplate must be completed first.');
          }
        } else {
          throw new Error('Campaign path not available. MJML template cannot be loaded.');
        }
      }
      
      // Get HTML content from MJML template
      let htmlContent = mjmlTemplate.html_content;
      if (!htmlContent) {
        throw new Error('HTML content not available - MJML template must be compiled first');
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
      
      if (context && context.context) {
        (context.context as any).designContext = updatedDesignContext;
      }
      
      console.log('✅ Preview files generated');
      console.log(`🖥️ Desktop preview: ${desktopPreviewPath}`);
      console.log(`📱 Mobile preview: ${mobilePreviewPath}`);
      
      logToFile('info', `Preview files generated successfully: Desktop and Mobile previews created`, 'DesignSpecialist-Preview', params.trace_id || undefined);
      logToFile('info', `Desktop preview: ${desktopPreviewPath}`, 'DesignSpecialist-Preview', params.trace_id || undefined);
      logToFile('info', `Mobile preview: ${mobilePreviewPath}`, 'DesignSpecialist-Preview', params.trace_id || undefined);
      
      return `Preview files generated successfully! Desktop preview: ${desktopPreviewPath}. Mobile preview: ${mobilePreviewPath}. Previews ready for review and testing.`;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error('❌ Preview generation failed:', errorMessage);
      console.error('❌ Error stack:', errorStack);
      console.error('❌ Preview generation error:', errorMessage);
      throw new Error(`Preview generation failed: ${errorMessage}`);
    }
  }
}); 