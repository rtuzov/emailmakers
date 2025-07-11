/**
 * Performance Analyzer
 * Analyzes email template performance and optimization
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
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
      const contentContext = params.content_context;
      const mjmlTemplate = params.mjml_template;
      const assetManifest = params.asset_manifest;
      
      // Calculate performance metrics - fix: ensure arrays exist before spreading
      const images = Array.isArray(assetManifest.images) ? assetManifest.images : [];
      const icons = Array.isArray(assetManifest.icons) ? assetManifest.icons : [];
      const allAssets = [...images, ...icons];
      const totalAssetSize = allAssets.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
      const templateSize = mjmlTemplate.file_size || 0;
      const totalSize = totalAssetSize + templateSize;
      
      const performanceMetrics: PerformanceMetrics = {
        total_size: totalSize,
        template_size: templateSize,
        asset_size: totalAssetSize,
        load_time_estimate: Math.round(totalSize / 1024 / 10), // Rough estimate in seconds
        optimization_score: Math.max(0, 100 - Math.round(totalSize / 1024 / 10)),
        recommendations: []
      };
      
      // Add recommendations based on analysis
      if (totalSize > 100000) {
        performanceMetrics.recommendations.push('Consider reducing image sizes - total size exceeds 100KB');
      }
      
      if (allAssets.length > 10) {
        performanceMetrics.recommendations.push('Consider reducing number of images for better performance');
      }
      
      if (performanceMetrics.optimization_score < 80) {
        performanceMetrics.recommendations.push('Optimize images and reduce template complexity');
      }
      
      // Update design context
      const updatedDesignContext = buildDesignContext(context, {
        performance_metrics: performanceMetrics,
        trace_id: params.trace_id
      });
      
      if (context) {
        context.designContext = updatedDesignContext;
      }
      
      console.log('✅ Performance analysis completed');
      console.log(`📊 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log(`⚡ Optimization score: ${performanceMetrics.optimization_score}/100`);
      
      return `Performance analysis completed! Total size: ${(totalSize / 1024).toFixed(2)} KB. Load time estimate: ${performanceMetrics.load_time_estimate}s. Optimization score: ${performanceMetrics.optimization_score}/100. Recommendations: ${performanceMetrics.recommendations.length}. Ready for preview generation.`;
      
    } catch (error) {
      console.error('❌ Performance analysis failed:', error);
      throw error;
    }
  }
}); 