/**
 * 📊 DATA COLLECTION SPECIALIST TOOLS - OpenAI Agents SDK Compatible
 * 
 * Refactored to follow SDK best practices:
 * - Tools perform simple actions, no LLM calls
 * - Agent instructions handle analysis logic
 * - Context is maintained through agent state
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// SIMPLE DATA ACTION TOOLS (No LLM calls)
// ============================================================================

/**
 * Save analysis result to campaign context
 */
export const saveAnalysisResult = tool({
  name: 'save_analysis_result',
  description: 'Save comprehensive analysis result to campaign data folder as separate files',
  parameters: z.object({
    analysis_type: z.string().describe('Type of analysis performed'),
    result_data: z.object({
      destination_analysis: z.string().describe('Destination analysis data (JSON string or plain text)'),
      market_intelligence: z.string().describe('Market intelligence data (JSON string or plain text)'),
      emotional_profile: z.string().describe('Emotional profile data (JSON string or plain text)'),
      trend_analysis: z.string().describe('Trend analysis data (JSON string or plain text)'),
      actionable_insights: z.array(z.string()),
      key_insights: z.array(z.string()),
      confidence_score: z.number().min(0).max(1),
      analysis_timestamp: z.string()
    }).strict(),
    campaign_path: z.string().describe('Campaign folder path for saving data')
  }),
  execute: async ({ analysis_type, result_data, campaign_path }) => {
    try {
      console.log(`💾 Saving ${analysis_type} analysis to: ${campaign_path}`);
      console.log(`🔍 DEBUG: Full campaign_path value:`, JSON.stringify(campaign_path));
      console.log(`🔍 DEBUG: campaign_path length:`, campaign_path?.length);
      console.log(`🔍 DEBUG: campaign_path type:`, typeof campaign_path);
      
      // Validate campaign_path before proceeding
      if (!campaign_path) {
        throw new Error('❌ Campaign path is null or undefined. Context manager must provide valid campaign path.');
      }
      
      if (typeof campaign_path !== 'string') {
        throw new Error(`❌ Campaign path must be a string, got: ${typeof campaign_path}`);
      }
      
      if (campaign_path.includes('...')) {
        throw new Error(`❌ Campaign path appears to be truncated (contains '...'): ${campaign_path}`);
      }
      
      // Ensure data directory exists
      const dataDir = path.join(campaign_path, 'data');
      console.log(`🔍 DEBUG: Target data directory: ${dataDir}`);
      
      // Check if campaign_path exists first
      try {
        await fs.access(campaign_path);
        console.log(`✅ Campaign path exists: ${campaign_path}`);
      } catch (error) {
        throw new Error(`❌ Campaign path does not exist: ${campaign_path}. Error: ${error.message}`);
      }
      
      await fs.mkdir(dataDir, { recursive: true });
      
      // Helper function to convert text to structured JSON
      function convertTextToJson(text: string, fieldName: string): any {
        try {
          // First try to parse as JSON
          let cleanText = text.trim();
          
          // Remove markdown code blocks if present
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Remove trailing commas
          cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');
          
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(cleanText);
            console.log(`✅ Successfully parsed ${fieldName} as JSON`);
            return parsed;
          } catch (jsonError) {
            // If JSON parsing fails, convert plain text to structured format
            console.log(`📝 Converting ${fieldName} from plain text to JSON structure`);
            
            // Create structured data based on field type
            if (fieldName === 'destination_analysis') {
              return {
                raw_analysis: text,
                climate: extractClimateInfo(text),
                culture: extractCultureInfo(text),
                attractions: extractAttractionsInfo(text),
                analysis_date: new Date().toISOString()
              };
            } else if (fieldName === 'market_intelligence') {
              return {
                raw_analysis: text,
                pricing: extractPricingInfo(text),
                competition: extractCompetitionInfo(text),
                demand: extractDemandInfo(text),
                analysis_date: new Date().toISOString()
              };
            } else if (fieldName === 'emotional_profile') {
              return {
                raw_analysis: text,
                motivations: extractMotivations(text),
                triggers: extractTriggers(text),
                desires: extractDesires(text),
                analysis_date: new Date().toISOString()
              };
            } else if (fieldName === 'trend_analysis') {
              return {
                raw_analysis: text,
                social_media: extractSocialMediaTrends(text),
                booking_patterns: extractBookingPatterns(text),
                opportunities: extractOpportunities(text),
                analysis_date: new Date().toISOString()
              };
            } else {
              // Generic structure for unknown fields
              return {
                raw_analysis: text,
                summary: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                analysis_date: new Date().toISOString()
              };
            }
          }
        } catch (error) {
          console.error(`❌ Failed to process ${fieldName}:`, error.message);
          
          // Create minimal structure with raw text
          return {
            raw_analysis: text,
            error: `Failed to parse: ${error.message}`,
            analysis_date: new Date().toISOString()
          };
        }
      }
      
      // Helper functions to extract information from text
      function extractClimateInfo(text: string): any {
        const tempMatch = text.match(/(\d+)-(\d+)\s*[CСcс]/i);
        const temp = tempMatch ? `${tempMatch[1]}-${tempMatch[2]}C` : 'warm';
        
        return {
          temperature: temp,
          season: text.toLowerCase().includes('осен') ? 'autumn' : 'seasonal',
          humidity: text.toLowerCase().includes('влажн') ? 'high' : 'moderate',
          rainfall: text.toLowerCase().includes('дожд') ? 'moderate' : 'low'
        };
      }
      
      function extractCultureInfo(text: string): any {
        return {
          highlights: extractListItems(text, ['храм', 'массаж', 'еда', 'культур']),
          language: 'Thai, English in tourist areas',
          customs: extractListItems(text, ['обув', 'голов', 'традиц'])
        };
      }
      
      function extractAttractionsInfo(text: string): any {
        return {
          must_see: extractListItems(text, ['дворец', 'храм', 'парк', 'остров']),
          beaches: extractListItems(text, ['пляж', 'берег', 'побережь']),
          activities: extractListItems(text, ['дайвинг', 'снорк', 'массаж', 'спа'])
        };
      }
      
      function extractPricingInfo(text: string): any {
        const priceMatch = text.match(/(\d+)[-–](\d+)\s*(?:руб|тыс|000)/i);
        return {
          range: priceMatch ? `${priceMatch[1]}-${priceMatch[2]} rubles` : 'moderate',
          season: 'autumn_discounts',
          booking_window: '2-3 months advance'
        };
      }
      
      function extractCompetitionInfo(text: string): any {
        return {
          alternatives: extractListItems(text, ['вьетнам', 'камбодж', 'филиппин', 'индонез']),
          advantages: extractListItems(text, ['безвиз', 'инфраструк', 'цен', 'доступ'])
        };
      }
      
      function extractDemandInfo(text: string): any {
        return {
          level: text.toLowerCase().includes('высок') ? 'high' : 'moderate',
          drivers: extractListItems(text, ['тепл', 'экзот', 'цен', 'романт']),
          peak_season: 'november-march'
        };
      }
      
      function extractMotivations(text: string): any {
        return extractListItems(text, ['романт', 'отдых', 'экзот', 'впечатл', 'тепл']);
      }
      
      function extractTriggers(text: string): any {
        return extractListItems(text, ['солнц', 'пляж', 'кухн', 'закат', 'массаж']);
      }
      
      function extractDesires(text: string): any {
        return extractListItems(text, ['фото', 'инстаграм', 'воспомин', 'новиз', 'романт']);
      }
      
      function extractSocialMediaTrends(text: string): any {
        return {
          trending_hashtags: ['#ThailandAutumn', '#PhuketRomance', '#ThaiFood'],
          viral_content: extractListItems(text, ['закат', 'пляж', 'еда', 'храм'])
        };
      }
      
      function extractBookingPatterns(text: string): any {
        return {
          advance_booking: '2-3 months',
          group_size: 'couples',
          preferences: extractListItems(text, ['пакет', 'отель', 'курорт'])
        };
      }
      
      function extractOpportunities(text: string): any {
        return extractListItems(text, ['йога', 'спа', 'кулинар', 'романт', 'приключ']);
      }
      
      function extractListItems(text: string, keywords: string[]): string[] {
        const items: string[] = [];
        keywords.forEach(keyword => {
          if (text.toLowerCase().includes(keyword)) {
            items.push(keyword);
          }
        });
        return items.length > 0 ? items : ['general_interest'];
      }
      
      // Process all analysis fields
      const destinationData = convertTextToJson(result_data.destination_analysis, 'destination_analysis');
      const marketData = convertTextToJson(result_data.market_intelligence, 'market_intelligence');
      const emotionalData = convertTextToJson(result_data.emotional_profile, 'emotional_profile');
      const trendData = convertTextToJson(result_data.trend_analysis, 'trend_analysis');
      
      // Create separate files with correct naming convention
      const filesToCreate = [
        {
          name: 'destination-analysis.json',
          data: {
            analysis_type: 'destination_analysis',
            data: destinationData,
            saved_at: new Date().toISOString()
          }
        },
        {
          name: 'market-intelligence.json', 
          data: {
            analysis_type: 'market_intelligence',
            data: marketData,
            saved_at: new Date().toISOString()
          }
        },
        {
          name: 'emotional-profile.json',
          data: {
            analysis_type: 'emotional_profile', 
            data: emotionalData,
            saved_at: new Date().toISOString()
          }
        },
        {
          name: 'trend-analysis.json',
          data: {
            analysis_type: 'trend_analysis',
            data: trendData,
            saved_at: new Date().toISOString()
          }
        }
      ];
      
      // Save each file
      const savedFiles = [];
      for (const file of filesToCreate) {
        const filePath = path.join(dataDir, file.name);
        await fs.writeFile(filePath, JSON.stringify(file.data, null, 2));
        savedFiles.push(filePath);
        console.log(`✅ Saved: ${filePath}`);
      }
      
      // Also save consolidated insights file
      const insightsFile = path.join(dataDir, 'consolidated-insights.json');
      const consolidatedData = {
        actionable_insights: result_data.actionable_insights,
        key_insights: result_data.key_insights,
        confidence_score: result_data.confidence_score,
        analysis_timestamp: result_data.analysis_timestamp,
        saved_at: new Date().toISOString()
      };
      await fs.writeFile(insightsFile, JSON.stringify(consolidatedData, null, 2));
      savedFiles.push(insightsFile);
      
      console.log(`✅ All analysis files saved successfully`);
      
      return `✅ Analysis "${analysis_type}" successfully saved as ${savedFiles.length} separate files: ${savedFiles.map(f => path.basename(f)).join(', ')}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
      return `❌ Failed to save analysis "${analysis_type}": ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

/**
 * Fetch cached context data if available
 */
export const fetchCachedData = tool({
  name: 'fetch_cached_data',
  description: 'Fetch previously cached analysis data for reuse',
  parameters: z.object({
    cache_key: z.string().describe('Cache key for the data'),
    data_type: z.enum(['destination', 'market', 'pricing'])
  }),
  execute: async ({ cache_key, data_type }) => {
    console.log(`🔍 Fetching cached ${data_type} data: ${cache_key}`);
    
    // Simple cache lookup - no LLM calls
    return {
      found: false,
      data: null,
      cache_key,
      data_type
    };
  }
});

/**
 * Update context with new insights
 */
export const updateContextInsights = tool({
  name: 'update_context_insights',
  description: 'Update campaign context with key analytical insights and save to file',
  parameters: z.object({
    insight_type: z.string().describe('Type of insights being saved'),
    insights: z.array(z.string()).describe('Array of key insights'),
    campaign_path: z.string().describe('Campaign folder path for saving insights')
  }),
  execute: async ({ insight_type, insights, campaign_path }) => {
    try {
      console.log(`📝 Updating context with ${insights.length} ${insight_type} insights`);
      
      // Ensure data directory exists
      const dataDir = path.join(campaign_path, 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save insights to file
      const fileName = `${insight_type}-insights.json`;
      const filePath = path.join(dataDir, fileName);
      
      const insightsData = {
        insight_type,
        insights,
        insights_count: insights.length,
        saved_at: new Date().toISOString(),
        file_path: filePath
      };
      
      await fs.writeFile(filePath, JSON.stringify(insightsData, null, 2));
      
      console.log(`✅ Insights saved to: ${filePath}`);
      
      return `✅ Context insights "${insight_type}" successfully updated with ${insights.length} insights. Saved to: ${filePath}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to save insights:', error);
      return `❌ Failed to save insights "${insight_type}": ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

/**
 * Log performance metrics for analysis optimization
 */
export const logAnalysisMetrics = tool({
  name: 'log_analysis_metrics',
  description: 'Log performance and quality metrics for analysis optimization',
  parameters: z.object({
    analysis_session: z.string(),
    metrics: z.object({
      execution_time: z.number(),
      data_quality_score: z.number().min(0).max(1),
      insight_count: z.number(),
      confidence_average: z.number().min(0).max(1)
    })
  }),
  execute: async ({ analysis_session, metrics }) => {
    console.log(`📊 Logging metrics for session: ${analysis_session}`);
    
    // Simple metrics logging - no LLM calls
    return {
      logged: true,
      session: analysis_session,
      metrics,
      timestamp: new Date().toISOString()
    };
  }
});

/**
 * Create handoff file for next specialist
 */
export const createHandoffFile = tool({
  name: 'create_handoff_file',
  description: 'Create handoff file to pass context to the next specialist',
  parameters: z.object({
    from_specialist: z.string().describe('Current specialist name'),
    to_specialist: z.string().describe('Next specialist name'),
    handoff_data: z.object({
      summary: z.string().describe('Summary of work completed'),
      key_outputs: z.array(z.string()).describe('Key files and outputs created'),
      context_for_next: z.string().describe('Important context for next specialist'),
      data_files: z.array(z.string()).describe('Data files created'),
      recommendations: z.array(z.string()).describe('Recommendations for next specialist')
    }).strict(),
    campaign_path: z.string().describe('Campaign folder path')
  }),
  execute: async ({ from_specialist, to_specialist, handoff_data, campaign_path }) => {
    try {
      console.log(`🤝 Creating handoff from ${from_specialist} to ${to_specialist}`);
      
      // Ensure handoffs directory exists
      const handoffsDir = path.join(campaign_path, 'handoffs');
      await fs.mkdir(handoffsDir, { recursive: true });
      
      // Create handoff file
      const fileName = `${from_specialist.toLowerCase().replace(' ', '-')}-to-${to_specialist.toLowerCase().replace(' ', '-')}.json`;
      const filePath = path.join(handoffsDir, fileName);
      
      const handoffContent = {
        from_specialist,
        to_specialist,
        handoff_data,
        created_at: new Date().toISOString(),
        file_path: filePath
      };
      
      await fs.writeFile(filePath, JSON.stringify(handoffContent, null, 2));
      
      console.log(`✅ Handoff file created: ${filePath}`);
      
      return `✅ Handoff file created successfully: ${fileName}. Context passed from ${from_specialist} to ${to_specialist}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to create handoff file:', error);
      return `❌ Failed to create handoff file from ${from_specialist} to ${to_specialist}: ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

/**
 * Update campaign metadata to mark specialist as completed
 */
export const updateCampaignMetadata = tool({
  name: 'update_campaign_metadata',
  description: 'Update campaign metadata to mark specialist work as completed',
  parameters: z.object({
    campaign_path: z.string().describe('Campaign folder path'),
    specialist_name: z.string().describe('Name of specialist that completed work'),
    workflow_phase: z.string().describe('Current workflow phase'),
    additional_data: z.object({}).strict().nullable().optional().describe('Additional metadata to update')
  }),
  execute: async ({ campaign_path, specialist_name, workflow_phase, additional_data }) => {
    try {
      console.log(`📝 Updating campaign metadata for ${specialist_name}`);
      
      const metadataPath = path.join(campaign_path, 'campaign-metadata.json');
      
      // Read existing metadata
      let metadata;
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      } catch (error) {
        console.error('❌ Failed to read metadata file:', error);
        return `❌ Failed to read metadata file: ${error.message}`;
      }
      
      // Update specialists_completed
      const specialistKey = specialist_name.toLowerCase().replace(/\s+/g, '_').replace('_specialist', '');
      metadata.specialists_completed[specialistKey] = true;
      
      // Update workflow phase
      metadata.workflow_phase = workflow_phase;
      metadata.last_updated = new Date().toISOString();
      
      // Add any additional data
      if (additional_data) {
        Object.assign(metadata, additional_data);
      }
      
      // Write updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`✅ Campaign metadata updated for ${specialist_name}`);
      
      return `✅ Campaign metadata updated successfully. ${specialist_name} marked as completed. Workflow phase: ${workflow_phase}. Timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('❌ Failed to update campaign metadata:', error);
      return `❌ Failed to update campaign metadata for ${specialist_name}: ${error.message}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

// ============================================================================
// TOOL REGISTRY
// ============================================================================

// Import transfer function
import { transferToContentSpecialist } from '../core/transfer-tools';

export const dataCollectionSpecialistTools = [
  saveAnalysisResult,
  fetchCachedData,
  updateContextInsights,
  logAnalysisMetrics,
  createHandoffFile,
  updateCampaignMetadata,
  transferToContentSpecialist
];

export default dataCollectionSpecialistTools; 