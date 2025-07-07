import { tool } from '@openai/agents';
import { z } from 'zod';
import { MLQualityScorer } from './ml/quality-scoring';

// Zod schemas for ML-scoring tools (OpenAI Agents SDK compatible)
const EmailDataSchema = z.object({
  subject: z.string().describe('Email subject line'),
  preheader: z.string().nullable().optional().describe('Email preheader text'),
  content: z.string().describe('Email HTML content'),
  design_tokens: z.object({
    colors: z.record(z.string()).nullable().optional(),
    fonts: z.record(z.string()).nullable().optional(),
    spacing: z.record(z.string()).nullable().optional()
  }).nullable().optional().describe('Design tokens used in the email'),
  brand_guidelines: z.object({
    tone: z.string().nullable().optional(),
    style: z.string().nullable().optional(),
    colors: z.array(z.string()).nullable().optional(),
    fonts: z.array(z.string()).nullable().optional()
  }).nullable().optional().describe('Brand guidelines to evaluate against'),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().nullable().optional(),
    size: z.number().nullable().optional()
  })).nullable().optional().describe('Images used in the email')
});

const QuickAnalysisSchema = z.object({
  content: z.string().describe('Email content to analyze'),
  focus_areas: z.array(z.enum(['content', 'design', 'technical', 'performance'])).nullable().optional().describe('Specific areas to focus analysis on')
});

// Comprehensive ML-powered email quality analysis tool
export const analyzeEmailQualityTool = tool({
  name: 'analyze_email_quality',
  description: 'Comprehensive ML-powered analysis of email quality across content, design, technical, and performance dimensions. Provides detailed scoring and actionable recommendations.',
  parameters: EmailDataSchema,
  execute: async (input) => {
    console.log('🤖 ML-SCORING: Starting comprehensive email quality analysis...');
    console.log('📧 Email data:', {
      subject: input.subject?.substring(0, 50) + '...',
      contentLength: input.content?.length || 0,
      hasDesignTokens: !!input.design_tokens,
      hasBrandGuidelines: !!input.brand_guidelines,
      imageCount: input.images?.length || 0
    });

    try {
      // Prepare data for ML analysis
      const emailData = {
        subject: input.subject,
        preheader: input.preheader ?? '',
        content: input.content,
        design_tokens: input.design_tokens || {},
        brand_guidelines: input.brand_guidelines || {},
        images: input.images || []
      };

      console.log('⚙️ ML-SCORING: Running ML analysis engine...');
      const startTime = Date.now();

      // Run comprehensive ML analysis
      const analysis = await MLQualityScorer.analyzeQuality(emailData);
      
      const analysisTime = Date.now() - startTime;
      console.log(`✅ ML-SCORING: Analysis completed in ${analysisTime}ms`);
      console.log('📊 Quality scores:', {
        overall: analysis.score.overall,
        content: analysis.score.content,
        design: analysis.score.design,
        technical: analysis.score.technical,
        performance: analysis.score.performance
      });
      console.log(`🔍 Found ${analysis.issues.length} issues and ${analysis.recommendations.length} recommendations`);

      // Format results for agent consumption
      const result = {
        overall_score: analysis.score.overall,
        category_scores: {
          content: analysis.score.content,
          design: analysis.score.design,
          technical: analysis.score.technical,
          performance: analysis.score.performance
        },
        recommendations: analysis.recommendations,
        issues: analysis.issues,
        analysis_summary: `Email quality analysis complete. Overall score: ${analysis.score.overall}/100. ${analysis.recommendations.length} recommendations generated.`,
        detailed_breakdown: {
          content_analysis: {
            score: analysis.score.content,
            details: analysis.content_analysis
          },
          design_analysis: {
            score: analysis.score.design,
            details: analysis.design_analysis
          },
          technical_analysis: {
            score: analysis.score.technical,
            details: analysis.technical_analysis
          },
          performance_analysis: {
            score: analysis.score.performance,
            details: analysis.performance_analysis
          }
        },
        generation_info: {
          timestamp: analysis.generation_timestamp,
          analysis_type: 'comprehensive_ml_analysis',
          version: '2.0.0',
          duration_ms: analysis.analysis_duration_ms
        }
      };

      console.log('📤 ML-SCORING: Returning analysis results');
      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error('❌ ML-SCORING ERROR:', error instanceof Error ? error.message : 'Unknown error');
      return `ML Quality Analysis Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }
});

// Quick ML-powered quality assessment tool
export const quickQualityCheckTool = tool({
  name: 'quick_quality_check',
  description: 'Fast ML-powered quality assessment focusing on key quality indicators. Ideal for rapid evaluation during email development.',
  parameters: QuickAnalysisSchema,
  execute: async (input) => {
    console.log('🚀 ML-SCORING: Starting quick quality check...');
    console.log('📝 Content length:', input.content?.length || 0);
    console.log('🎯 Focus areas:', input.focus_areas || ['all']);

    try {
      // Prepare minimal data for quick analysis
      const emailData = {
        subject: 'Quick Analysis',
        preheader: '',
        content: input.content,
        design_tokens: {},
        brand_guidelines: {},
        images: []
      };

      console.log('⚡ ML-SCORING: Running quick ML analysis...');
      const startTime = Date.now();

      // Run targeted ML analysis
      const analysis = await MLQualityScorer.analyzeQuality(emailData);
      
      const analysisTime = Date.now() - startTime;
      console.log(`✅ ML-SCORING: Quick check completed in ${analysisTime}ms`);

      // Focus on specific areas if requested
      const focusAreas = input.focus_areas || ['content', 'design', 'technical', 'performance'];
      const focusedScores = Object.fromEntries(
        Object.entries({
          content: analysis.score.content,
          design: analysis.score.design,
          technical: analysis.score.technical,
          performance: analysis.score.performance
        }).filter(([key]) => 
          focusAreas.includes(key as any)
        )
      );

      console.log('📊 Quick scores:', focusedScores);
      console.log(`🔍 Top issues: ${analysis.issues.slice(0, 3).length}`);

      // Generate quick assessment
      const quickResult = {
        quick_score: analysis.score.overall,
        focus_scores: focusedScores,
        top_issues: analysis.issues.slice(0, 3),
        top_recommendations: analysis.recommendations.slice(0, 3),
        assessment_summary: `Quick quality check complete. Score: ${analysis.score.overall}/100. ${analysis.issues.length} issues found.`
      };

      console.log('📤 ML-SCORING: Returning quick check results');
      return JSON.stringify(quickResult, null, 2);
    } catch (error) {
      console.error('❌ ML-SCORING QUICK CHECK ERROR:', error instanceof Error ? error.message : 'Unknown error');
      return `Quick Quality Check Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }
});

// ML-powered email comparison tool
export const compareEmailQualityTool = tool({
  name: 'compare_email_quality',
  description: 'Compare quality scores between multiple email variants using ML analysis. Helps identify the best performing version.',
  parameters: z.object({
    emails: z.array(EmailDataSchema).min(2).max(5).describe('Array of email variants to compare (2-5 emails)'),
    comparison_focus: z.enum(['overall', 'content', 'design', 'technical', 'performance']).nullable().optional().describe('Specific aspect to focus comparison on')
  }),
  execute: async (input) => {
    console.log('⚖️ ML-SCORING: Starting email quality comparison...');
    console.log('📊 Comparing', input.emails.length, 'email variants');
    console.log('🎯 Comparison focus:', input.comparison_focus || 'overall');

    try {
      const comparisonFocus = input.comparison_focus || 'overall';
      
      console.log('⚙️ ML-SCORING: Analyzing each email variant...');
      const startTime = Date.now();

      // Analyze each email variant
      const analyses = await Promise.all(
        input.emails.map(async (email, index) => {
          console.log(`📧 ML-SCORING: Analyzing variant ${index + 1}/${input.emails.length}...`);
          
          const emailData = {
            subject: email.subject,
            preheader: email.preheader || '',
            content: email.content,
            design_tokens: email.design_tokens || {},
            brand_guidelines: email.brand_guidelines || {},
            images: email.images || []
          };
          
          const analysis = await MLQualityScorer.analyzeQuality(emailData);
          console.log(`✅ Variant ${index + 1} analyzed - Score: ${analysis.score.overall}/100`);
          
          return {
            variant_id: `variant_${index + 1}`,
            subject: email.subject,
            analysis
          };
        })
      );

      const analysisTime = Date.now() - startTime;
      console.log(`🏁 ML-SCORING: All variants analyzed in ${analysisTime}ms`);

      // Compare variants
      const comparison = {
        total_variants: analyses.length,
        comparison_focus: comparisonFocus,
        rankings: analyses
          .map((variant, index) => ({
            rank: index + 1,
            variant_id: variant.variant_id,
            subject: variant.subject,
            score: comparisonFocus === 'overall' 
              ? variant.analysis.score.overall 
              : variant.analysis.score[comparisonFocus as keyof typeof variant.analysis.score],
            key_strengths: variant.analysis.recommendations.slice(0, 2),
            key_issues: variant.analysis.issues.slice(0, 2)
          }))
          .sort((a, b) => b.score - a.score)
          .map((item, index) => ({ ...item, rank: index + 1 })),
        
        winner: analyses.reduce((best, current) => {
          const bestScore = comparisonFocus === 'overall' 
            ? best.analysis.score.overall 
            : best.analysis.score[comparisonFocus as keyof typeof best.analysis.score];
          const currentScore = comparisonFocus === 'overall' 
            ? current.analysis.score.overall 
            : current.analysis.score[comparisonFocus as keyof typeof current.analysis.score];
          
          return currentScore > bestScore ? current : best;
        }),
        comparison_summary: `Compared ${analyses.length} email variants analyzed successfully.`
      };

      const winner = comparison.winner;
      const winnerScore = comparisonFocus === 'overall' 
        ? winner.analysis.score.overall 
        : winner.analysis.score[comparisonFocus as keyof typeof winner.analysis.score];

      console.log('🏆 ML-SCORING: Winner determined!');
      console.log(`🥇 Best variant: ${winner.variant_id} with ${comparisonFocus} score of ${winnerScore}/100`);
      console.log('📤 ML-SCORING: Returning comparison results');

      return JSON.stringify(comparison, null, 2);
    } catch (error) {
      console.error('❌ ML-SCORING COMPARISON ERROR:', error instanceof Error ? error.message : 'Unknown error');
      return `Email Comparison Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
    }
  }
});

// Export all ML-scoring tools as an array for easy registration
export const mlScoringTools = [
  analyzeEmailQualityTool,
  quickQualityCheckTool,
  compareEmailQualityTool
]; 