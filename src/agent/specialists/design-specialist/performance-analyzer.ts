/**
 * Performance Analyzer
 * Analyzes email template performance and optimization
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildDesignContext } from './design-context';
import { PerformanceMetrics } from './types';

/**
 * Analyze email template performance
 */
export const analyzePerformance = tool({
  name: 'analyzePerformance',
  description: 'Analyze email template performance metrics and optimization opportunities',
  parameters: z.object({
    content_context: z.object({}).strict().describe('Content context from Content Specialist'),
    mjml_template: z.object({}).strict().describe('Generated MJML template data'),
    asset_manifest: z.object({}).strict().describe('Asset manifest with optimization details'),
    trace_id: z.string().nullable().describe('Trace ID for debugging')
  }),
  execute: async (params, context) => {
    console.log('\n⚡ === PERFORMANCE ANALYSIS ===');
    
    try {
      // Load data from design context if parameters are empty
      const designContext = (context?.context as any)?.designContext || {};
      
      let contentContext = params.content_context;
      let mjmlTemplate = params.mjml_template;
      let assetManifest = params.asset_manifest;
      
      // If parameters are empty, try to load from design context
      if (Object.keys(contentContext).length === 0 && designContext.content_context) {
        contentContext = designContext.content_context;
        console.log('📋 Loaded content context from design context');
      }
      
      if (Object.keys(mjmlTemplate).length === 0 && designContext.mjml_template) {
        mjmlTemplate = designContext.mjml_template;
        console.log('📋 Loaded MJML template from design context');
      }
      
      if (Object.keys(assetManifest).length === 0 && designContext.asset_manifest) {
        assetManifest = designContext.asset_manifest;
        console.log('📋 Loaded asset manifest from design context');
      }
      
      // If still empty, try to load from file system
      if (Object.keys(assetManifest).length === 0 && designContext.campaign_path) {
        try {
          const manifestPath = path.join(designContext.campaign_path, 'assets', 'manifests', 'asset-manifest.json');
          const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
          assetManifest = manifestData.assetManifest || manifestData;
          console.log('📋 Loaded asset manifest from file system');
        } catch (error) {
          console.warn('⚠️ Could not load asset manifest from file system:', (error as Error).message);
        }
      }
      
      if (Object.keys(mjmlTemplate).length === 0 && designContext.campaign_path) {
        try {
          const mjmlPath = path.join(designContext.campaign_path, 'templates', 'email-template.mjml');
          const mjmlContent = await fs.readFile(mjmlPath, 'utf8');
          const htmlPath = path.join(designContext.campaign_path, 'templates', 'email-template.html');
          const htmlContent = await fs.readFile(htmlPath, 'utf8');
          mjmlTemplate = {
            mjml_content: mjmlContent,
            html_content: htmlContent,
            file_size: Buffer.byteLength(htmlContent, 'utf8')
          };
          console.log('📋 Loaded MJML template from file system');
        } catch (error) {
          console.warn('⚠️ Could not load MJML template from file system:', (error as Error).message);
        }
      }
      
      // Calculate performance metrics - fix: ensure arrays exist before spreading
          const images = Array.isArray((assetManifest as any)?.assetManifest?.images) ? (assetManifest as any).assetManifest.images : [];
    const icons = Array.isArray((assetManifest as any)?.assetManifest?.icons) ? (assetManifest as any).assetManifest.icons : [];
      const allAssets = [...images, ...icons];
      const totalAssetSize = allAssets.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
      const templateSize = (mjmlTemplate as any).file_size || 0;
      const totalSize = totalAssetSize + templateSize;
      
      const performanceMetrics: PerformanceMetrics = {
        html_size: templateSize,
        total_assets_size: totalAssetSize,
        estimated_load_time: Math.round(totalSize / 1024 / 10), // Rough estimate in seconds
        optimization_score: Math.max(0, 100 - Math.round(totalSize / 1024 / 10))
      };
      
      // Generate recommendations as a separate variable
      const recommendations = [];
      if (totalSize > 100000) {
        recommendations.push('Consider reducing image sizes - total size exceeds 100KB');
      }
      
      if (allAssets.length > 10) {
        recommendations.push('Consider reducing number of images for better performance');
      }
      
      if (performanceMetrics.optimization_score < 80) {
        recommendations.push('Optimize images and reduce template complexity');
      }
      
      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        performance_metrics: performanceMetrics,
        trace_id: params.trace_id
      });
      
      if (context && context.context) {
        (context.context as any).designContext = updatedDesignContext;
      }
      
      console.log('✅ Performance analysis completed');
      console.log(`📊 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`⚡ Optimization score: ${performanceMetrics.optimization_score}/100`);
      
      return `Performance analysis completed! Total size: ${(totalSize / 1024).toFixed(2)} KB. Load time estimate: ${performanceMetrics.estimated_load_time}s. Optimization score: ${performanceMetrics.optimization_score}/100. Recommendations: ${recommendations.length}. Ready for preview generation.`;
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
      throw error;
    }
  }
}); 