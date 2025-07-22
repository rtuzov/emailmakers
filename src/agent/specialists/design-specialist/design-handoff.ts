/**
 * Design Handoff
 * Creates handoff files for the next specialist
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Create design handoff for Quality Assurance Specialist
 */
export const createDesignHandoff = tool({
  name: 'createDesignHandoff',
  description: 'Create design handoff file for Quality Assurance Specialist with all design outputs',
  parameters: z.object({
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    design_package: z.object({}).strict().describe('Comprehensive design package'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n🤝 === DESIGN HANDOFF ===');
    
    try {
      const contentContext = params.content_context;
      const designPackage = params.design_package;
      
      // Try to get campaign path from context
      let campaignPath = (context?.context as any)?.campaignContext?.campaignPath;
      
      if (!campaignPath) {
        // Try multiple ways to get campaign path from parameters
        campaignPath = (contentContext as any).campaign?.campaignPath || 
                      (contentContext as any).campaign?.path ||
                      (contentContext as any).campaignPath ||
                      (contentContext as any).campaign_path ||
                      (designPackage as any).campaign_path ||
                      (designPackage as any).campaignPath;
      }
      
      // If still no path, try to extract from any file paths in the context
      if (!campaignPath) {
        // Look for campaign path in design package deliverables
        const mjmlPath = (designPackage as any).deliverables?.mjml_template?.source_file;
        const htmlPath = (designPackage as any).deliverables?.mjml_template?.compiled_html;
        const previewPath = (designPackage as any).deliverables?.preview_files?.desktop_preview;
        
        for (const filePath of [mjmlPath, htmlPath, previewPath]) {
          if (filePath && filePath.includes('/campaigns/')) {
            const match = filePath.match(/^(.*\/campaigns\/[^\/]+)/);
            if (match) {
              campaignPath = match[1];
              break;
            }
          }
        }
      }
      
      // If still no path, try to construct from campaign ID
      if (!campaignPath && (contentContext as any).campaign?.id) {
        campaignPath = path.join(process.cwd(), 'campaigns', (contentContext as any).campaign.id);
      }
      
      if (!campaignPath) {
        console.error('❌ Campaign path not found in context. Available keys:', Object.keys(contentContext));
        console.error('❌ Design package keys:', Object.keys(designPackage));
        console.error('❌ SDK context keys:', context ? Object.keys(context) : 'No context');
        console.error('❌ SDK context keys:', context?.context ? Object.keys(context.context) : 'No context');
        throw new Error(`Campaign path is missing from content context. Available context keys: ${Object.keys(contentContext).join(', ')}`);
      }
      
      console.log(`📁 Using campaign path: ${campaignPath}`);
      
      // Create handoff directory
      const handoffDir = path.join(campaignPath, 'handoffs');
      await fs.mkdir(handoffDir, { recursive: true });
      
      // Create comprehensive handoff data
      const handoffData = {
        metadata: {
          handoff_type: 'design-to-qa',
          created_at: new Date().toISOString(),
          campaign_id: (contentContext as any).campaign?.id,
          source_specialist: 'Design Specialist',
          target_specialist: 'Quality Assurance Specialist',
          trace_id: params.trace_id
        },
        
        request: {
          action: 'quality_assurance_review',
          priority: 'high',
          requirements: [
            'Email client compatibility verification',
            'Accessibility compliance validation',
            'Performance optimization review',
            'Cross-client compatibility verification',
            'Mobile responsiveness verification'
          ]
        },
        
        design_context: {
          campaign: (contentContext as any).campaign,
          design_package: designPackage,
          
          // Key deliverables for QA
          template_files: {
            mjml_source: (designPackage as any).deliverables?.mjml_template?.source_file,
            html_output: (designPackage as any).deliverables?.mjml_template?.compiled_html,
            desktop_preview: (designPackage as any).deliverables?.preview_files?.desktop_preview,
            mobile_preview: (designPackage as any).deliverables?.preview_files?.mobile_preview
          },
          
          // Quality metrics for validation
          quality_targets: {
            technical_compliance: (designPackage as any).quality_metrics?.technical_compliance,
            accessibility_score: (designPackage as any).quality_metrics?.accessibility_score,
            performance_score: (designPackage as any).quality_metrics?.performance_score,
            email_client_compatibility: (designPackage as any).quality_metrics?.email_client_compatibility
          },
          
          // Technical specifications
          technical_requirements: {
            max_width: (designPackage as any).technical_summary?.max_width,
            layout_type: (designPackage as any).technical_summary?.layout_type,
            email_clients_supported: (designPackage as any).technical_summary?.email_clients_supported,
            total_size: (designPackage as any).performance_analysis?.total_size,
            load_time_estimate: (designPackage as any).performance_analysis?.load_time_estimate
          },
          
          // Asset information
          assets: {
            total_count: (designPackage as any).deliverables?.assets?.total_count,
            images: (designPackage as any).deliverables?.assets?.images,
            icons: (designPackage as any).deliverables?.assets?.icons,
            total_size: (designPackage as any).deliverables?.assets?.total_size,
            optimization_rate: (designPackage as any).deliverables?.assets?.optimization_rate
          }
        },
        
        validation_checklist: [
          'Email renders correctly in Gmail',
          'Email renders correctly in Outlook',
          'Email renders correctly in Apple Mail',
          'Email renders correctly in Yahoo Mail',
          'Mobile responsiveness works properly',
          'All images load correctly',
          'All links are functional',
          'Accessibility standards are met',
          'Performance targets are achieved',
          'Dark mode support works (if applicable)'
        ],
        
        success_criteria: {
          email_client_compatibility: '>= 95%',
          accessibility_score: '>= 80%',
          performance_score: '>= 85%',
          technical_compliance: '>= 90%',
          load_time: '<= 3 seconds'
        }
      };
      
      // Save handoff file
      const handoffPath = path.join(handoffDir, 'design-specialist-to-qa-specialist.json');
      await fs.writeFile(handoffPath, JSON.stringify(handoffData, null, 2), 'utf8');
      
      console.log('✅ Design handoff created successfully');
      console.log(`🤝 Handoff file: ${handoffPath}`);
      console.log(`📋 Validation checklist: ${handoffData.validation_checklist.length} items`);
      console.log(`🎯 Success criteria: ${Object.keys(handoffData.success_criteria).length} metrics`);
      
      return `Design handoff created successfully! Handoff file: ${handoffPath}. Quality targets: Technical compliance ${handoffData.design_context.quality_targets.technical_compliance}%, Accessibility ${handoffData.design_context.quality_targets.accessibility_score}%, Performance ${handoffData.design_context.quality_targets.performance_score}%. Validation checklist: ${handoffData.validation_checklist.length} items. Ready for Quality Assurance Specialist review.`;
      
    } catch (error) {
      console.error('❌ Design handoff creation failed:', error);
      throw error;
    }
  }
}); 