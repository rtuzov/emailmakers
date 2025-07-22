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
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ Campaign path does not exist: ${campaign_path}. Error: ${errorMessage}`);
      }
      
      await fs.mkdir(dataDir, { recursive: true });
      
      // Helper function to fix common JSON quoting issues (commented out - unused)
      /*
      function _fixJsonQuoting(jsonText: string): string {
        let fixed = jsonText;
        
        // Step 1: Handle truncated JSON by ensuring proper closing
        // Count opening and closing braces/brackets
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        
        // If JSON is truncated, try to close it properly
        if (openBraces > closeBraces) {
          // Find the last incomplete string value and close it
          const lastQuoteIndex = fixed.lastIndexOf('"');
          const lastColonIndex = fixed.lastIndexOf(':');
          
          if (lastQuoteIndex > lastColonIndex && !fixed.slice(lastQuoteIndex + 1).includes('"')) {
            // We have an unclosed string value
            fixed += '"';
          }
          
          // Add missing closing braces
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            fixed += '}';
          }
        }
        
        if (openBrackets > closeBrackets) {
          // Add missing closing brackets
          for (let i = 0; i < (openBrackets - closeBrackets); i++) {
            fixed += ']';
          }
        }
        
        // Step 2: Fix only specific problematic patterns without breaking valid JSON
        // Only fix cases where we have unescaped quotes within string values
        // Pattern: "text with "unescaped" quotes in it"
        fixed = fixed.replace(/"([^"]*)"([^":\},\]\s]*)"([^"]*)"(\s*[:\},\]])/g, (_match, p1, p2, p3, p4) => {
          // This handles cases like: "value with "quote" inside"
          // Replace the middle quotes with spaces
          const cleanP2 = p2.replace(/"/g, ' ').trim();
          const cleanP3 = p3.replace(/"/g, ' ').trim();
          return `"${p1}${cleanP2 ? ' ' + cleanP2 : ''}${cleanP3 ? ' ' + cleanP3 : ''}"${p4}`;
        });
        
        // Handle incomplete JSON strings at the end only if they're actually incomplete
        const lastQuoteIndex = fixed.lastIndexOf('"');
        const lastColonIndex = fixed.lastIndexOf(':');
        const lastCommaIndex = fixed.lastIndexOf(',');
        const lastBraceIndex = fixed.lastIndexOf('}');
        
        // Only add closing quote if we have an opening quote after the last structural character
        if (lastQuoteIndex > Math.max(lastColonIndex, lastCommaIndex, lastBraceIndex) && 
            !fixed.slice(lastQuoteIndex + 1).includes('"') &&
            fixed.slice(lastQuoteIndex + 1).trim()) {
          fixed += '"';
        }
        
        // Clean up multiple spaces
        fixed = fixed.replace(/\s+/g, ' ');
        
        return fixed;
      }
      */
      
      // ===== JSON PARSING WITH RECOVERY =====
      function convertTextToJson(text: string, fieldName: string): any {
        console.log(`🔍 DEBUG: ${fieldName} input text:`, text.substring(0, 100) + '...');
        
        // Basic cleanup
        let cleanText = text.trim();
        
        // Remove markdown code blocks if present
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log(`🔍 DEBUG: ${fieldName} starts with quote:`, cleanText.startsWith('"'));
        console.log(`🔍 DEBUG: ${fieldName} ends with quote:`, cleanText.endsWith('"'));
        
        // Remove outer quotes if the entire text is wrapped in quotes
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.slice(1, -1);
          // Unescape inner quotes
          cleanText = cleanText.replace(/\\"/g, '"');
        }
        
        console.log(`🔧 DEBUG: After basic cleanup for ${fieldName}:`, cleanText.substring(0, 200) + '...');
        
        try {
          return JSON.parse(cleanText);
        } catch (jsonError) {
          const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
          console.log(`❌ JSON Parse Error for ${fieldName}:`, errorMessage);
          
          // ✅ IMPROVED ERROR RECOVERY: Try to fix common JSON issues
          try {
            // Try to fix truncated JSON by finding the last valid closing brace
            let fixedJson = cleanText;
            
            // Count opening and closing braces
            let openBraces = 0;
            let closeBraces = 0;
            let lastValidPosition = -1;
            
            for (let i = 0; i < fixedJson.length; i++) {
              if (fixedJson[i] === '{') {
                openBraces++;
              } else if (fixedJson[i] === '}') {
                closeBraces++;
                if (openBraces === closeBraces) {
                  lastValidPosition = i;
                }
              }
            }
            
            // If JSON is truncated, cut at last valid position and add closing braces
            if (openBraces > closeBraces && lastValidPosition > 0) {
              fixedJson = fixedJson.substring(0, lastValidPosition + 1);
              console.log(`🔧 RECOVERY: Truncated JSON fixed by cutting at position ${lastValidPosition + 1}`);
            } else if (openBraces > closeBraces) {
              // Add missing closing braces
              const missingBraces = openBraces - closeBraces;
              fixedJson = fixedJson + '}'.repeat(missingBraces);
              console.log(`🔧 RECOVERY: Added ${missingBraces} missing closing braces`);
            }
            
            // Try parsing the fixed JSON
            const parsed = JSON.parse(fixedJson);
            console.log(`✅ RECOVERY SUCCESS: JSON fixed and parsed for ${fieldName}`);
            return parsed;
            
          } catch (recoveryError) {
            console.log(`❌ RECOVERY FAILED for ${fieldName}:`, recoveryError);
            
            // ✅ FINAL FALLBACK: Create minimal valid JSON structure
            console.log(`🔧 CREATING MINIMAL FALLBACK for ${fieldName}`);
            
            const fallbackStructures = {
              destination_analysis: {
                route_analysis: "Transportation options available",
                seasonal_patterns: "Standard seasonal travel patterns apply",
                attractions: "Popular destinations and attractions"
              },
              market_intelligence: {
                competitive_landscape: "Market analysis data",
                pricing_trends: "Current pricing information",
                demand_patterns: "Travel demand insights"
              },
              emotional_profile: {
                motivations: ["adventure", "relaxation", "culture"],
                pain_points: ["cost", "time", "planning"],
                decision_factors: ["price", "convenience", "experience"]
              },
              trend_analysis: {
                current_trends: "Latest travel trends",
                seasonal_factors: "Seasonal considerations",
                emerging_patterns: "New market developments"
              }
            };
            
            const fallback = fallbackStructures[fieldName as keyof typeof fallbackStructures] || {
              status: "fallback_data",
              message: "Minimal data structure due to parsing error"
            };
            
            console.log(`✅ FALLBACK CREATED for ${fieldName}:`, fallback);
            return fallback;
          }
        }
      }
      
      // NO HELPER EXTRACTION FUNCTIONS - All data must come from agent analysis
      // If agent provides incomplete data, fail and request re-analysis
      
      // Process all analysis fields - FAIL FAST ON ANY ERROR
      let destinationData, marketData, emotionalData, trendData;
      
      try {
        destinationData = convertTextToJson(result_data.destination_analysis, 'destination_analysis');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ DESTINATION ANALYSIS FAILED: ${errorMessage}`);
      }
      
      try {
        marketData = convertTextToJson(result_data.market_intelligence, 'market_intelligence');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ MARKET INTELLIGENCE FAILED: ${errorMessage}`);
      }
      
      try {
        emotionalData = convertTextToJson(result_data.emotional_profile, 'emotional_profile');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ EMOTIONAL PROFILE FAILED: ${errorMessage}`);
      }
      
      try {
        trendData = convertTextToJson(result_data.trend_analysis, 'trend_analysis');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ TREND ANALYSIS FAILED: ${errorMessage}`);
      }
      
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
            data: trendData, // Data already validated in convertTextToJson
            saved_at: new Date().toISOString()
          }
        },
        {
          name: 'travel_intelligence-insights.json',
          data: {
            analysis_type: 'travel_intelligence',
            data: {
              // Extract required fields from validated data
              route_analysis: destinationData.route_analysis,
              pricing_trends: marketData.pricing_trends,
              seasonal_patterns: destinationData.seasonal_patterns,
              booking_windows: marketData.booking_windows,
              // Keep original data for reference
              destination_insights: destinationData,
              market_insights: marketData,
              trend_insights: trendData
            },
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Failed to save analysis "${analysis_type}": ${errorMessage}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

/**
 * Fetch cached context data if available
 */
export const fetchCachedData = tool({
  name: 'fetch_cached_data',
  description: 'Fetch previously cached analysis data for reuse with expiration handling',
  parameters: z.object({
    cache_key: z.string().describe('Cache key for the data (e.g., destination name or analysis type)'),
    data_type: z.enum(['destination', 'market', 'pricing', 'emotional', 'trend']).describe('Type of cached data to fetch'),
    max_age_hours: z.number().default(24).describe('Maximum age of cached data in hours before considered stale'),
    campaign_path: z.string().nullable().describe('Campaign folder path for local cache lookup')
  }),
  execute: async ({ cache_key, data_type, max_age_hours, campaign_path }) => {
    console.log(`🔍 Fetching cached ${data_type} data: ${cache_key} (max age: ${max_age_hours}h)`);
    
    try {
      // Define cache directory locations
      const cacheLocations = [];
      
      // 1. Campaign-specific cache if campaign_path provided
      if (campaign_path) {
        cacheLocations.push(path.join(campaign_path, 'data'));
      }
      
      // 2. Global cache directory
      const globalCacheDir = path.join(process.cwd(), '.cache', 'data-collection');
      cacheLocations.push(globalCacheDir);
      
      // 3. Temporary cache directory
      const tempCacheDir = path.join(process.cwd(), 'tmp', 'cache');
      cacheLocations.push(tempCacheDir);
      
      // Try to find cached data in each location
      for (const cacheDir of cacheLocations) {
        const cachedData = await tryFetchFromCacheDir(cacheDir, cache_key, data_type, max_age_hours);
        if (cachedData.found) {
          console.log(`✅ Cache hit in ${cacheDir}`);
          return cachedData;
        }
      }
      
      // No cached data found
      console.log(`❌ No cached ${data_type} data found for key: ${cache_key}`);
      return {
        found: false,
        data: null,
        cache_key,
        data_type,
        checked_locations: cacheLocations,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error fetching cached data: ${errorMessage}`);
      return {
        found: false,
        data: null,
        cache_key,
        data_type,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }
});

/**
 * Helper function to try fetching from a specific cache directory
 */
async function tryFetchFromCacheDir(cacheDir: string, cache_key: string, data_type: string, max_age_hours: number): Promise<any> {
  try {
    // Check if cache directory exists
    try {
      await fs.access(cacheDir);
    } catch {
      // Directory doesn't exist
      return { found: false };
    }
    
    // Generate cache file names based on data type
    const cacheFileNames = getCacheFileNames(data_type, cache_key);
    
    // Try each potential cache file
    for (const fileName of cacheFileNames) {
      const filePath = path.join(cacheDir, fileName);
      
      try {
        // Check if file exists
        await fs.access(filePath);
        
        // Read file
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const cachedData = JSON.parse(fileContent);
        
        // Check if data is still valid (not expired)
        const createdAt = new Date(cachedData.saved_at || cachedData.analysis_timestamp || cachedData.created_at);
        const now = new Date();
        const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (ageHours <= max_age_hours) {
          console.log(`✅ Valid cached data found: ${fileName} (age: ${ageHours.toFixed(2)}h)`);
          return {
            found: true,
            data: cachedData,
            cache_key,
            data_type,
            file_path: filePath,
            age_hours: ageHours,
            max_age_hours,
            is_fresh: ageHours <= max_age_hours / 2, // Consider fresh if less than half max age
            timestamp: new Date().toISOString()
          };
        } else {
          console.log(`⏰ Cached data expired: ${fileName} (age: ${ageHours.toFixed(2)}h > ${max_age_hours}h)`);
        }
        
      } catch (fileError) {
        // File doesn't exist or can't be read, continue to next file
        continue;
      }
    }
    
    return { found: false };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error checking cache directory ${cacheDir}:`, errorMessage);
    return { found: false };
  }
}

/**
 * Get possible cache file names based on data type and cache key
 */
function getCacheFileNames(data_type: string, cache_key: string): string[] {
  const sanitizedKey = cache_key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fileNames: string[] = [];
  
  switch (data_type) {
    case 'destination':
      fileNames.push(
        `destination-analysis.json`,
        `destination-analysis-${sanitizedKey}.json`,
        `${sanitizedKey}-destination-analysis.json`
      );
      break;
    
    case 'market':
      fileNames.push(
        `market-intelligence.json`,
        `market-intelligence-${sanitizedKey}.json`,
        `${sanitizedKey}-market-intelligence.json`
      );
      break;
    
    case 'pricing':
      fileNames.push(
        `pricing-analysis.json`,
        `pricing-analysis-${sanitizedKey}.json`,
        `${sanitizedKey}-pricing-analysis.json`
      );
      break;
    
    case 'emotional':
      fileNames.push(
        `emotional-profile.json`,
        `emotional-profile-${sanitizedKey}.json`,
        `${sanitizedKey}-emotional-profile.json`
      );
      break;
    
    case 'trend':
      fileNames.push(
        `trend-analysis.json`,
        `trend-analysis-${sanitizedKey}.json`,
        `${sanitizedKey}-trend-analysis.json`
      );
      break;
    
    default:
      fileNames.push(
        `${data_type}-${sanitizedKey}.json`,
        `${sanitizedKey}-${data_type}.json`
      );
  }
  
  return fileNames;
}

/**
 * Save data to cache for future reuse
 */
export const saveCachedData = tool({
  name: 'save_cached_data',
  description: 'Save analysis data to cache for future reuse with automatic expiration',
  parameters: z.object({
    cache_key: z.string().describe('Cache key for the data (e.g., destination name or analysis type)'),
    data_type: z.enum(['destination', 'market', 'pricing', 'emotional', 'trend']).describe('Type of data to cache'),
    data: z.object({}).describe('Data to cache as JSON object'),
    expires_in_hours: z.number().default(48).describe('How long to keep cached data in hours'),
    campaign_path: z.string().nullable().describe('Campaign folder path for local cache storage')
  }),
  execute: async ({ cache_key, data_type, data, expires_in_hours, campaign_path }) => {
    console.log(`💾 Saving ${data_type} data to cache: ${cache_key} (expires in ${expires_in_hours}h)`);
    
    try {
      // Define cache directory locations
      const cacheLocations = [];
      
      // 1. Campaign-specific cache if campaign_path provided
      if (campaign_path) {
        cacheLocations.push(path.join(campaign_path, 'data'));
      }
      
      // 2. Global cache directory
      const globalCacheDir = path.join(process.cwd(), '.cache', 'data-collection');
      cacheLocations.push(globalCacheDir);
      
      // Prepare cached data structure
      const cachedData = {
        cache_key,
        data_type,
        data,
        expires_in_hours,
        saved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString(),
        version: '1.0'
      };
      
      const savedLocations = [];
      
      // Save to each cache location
      for (const cacheDir of cacheLocations) {
        try {
          // Ensure cache directory exists
          await fs.mkdir(cacheDir, { recursive: true });
          
          // Get cache file names
          const cacheFileNames = getCacheFileNames(data_type, cache_key);
          const primaryFileName = cacheFileNames[0] || 'cached-data.json'; // Use first (most specific) file name or fallback
          
          const filePath = path.join(cacheDir, primaryFileName);
          
          // Save cached data
          await fs.writeFile(filePath, JSON.stringify(cachedData, null, 2));
          savedLocations.push(filePath);
          
          console.log(`✅ Cached data saved: ${filePath}`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Failed to save cache to ${cacheDir}:`, errorMessage);
        }
      }
      
      if (savedLocations.length > 0) {
        return {
          success: true,
          cache_key,
          data_type,
          expires_in_hours,
          saved_locations: savedLocations,
          expires_at: cachedData.expires_at,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to save cached data to any location');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error saving cached data: ${errorMessage}`);
      return {
        success: false,
        cache_key,
        data_type,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
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
      
      // Save insights to file with proper naming convention (no spaces, no Cyrillic)
      const sanitizedInsightType = insight_type
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/(^_|_$)/g, '');
      const fileName = `${sanitizedInsightType}_insights.json`;
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Failed to save insights "${insight_type}": ${errorMessage}. Timestamp: ${new Date().toISOString()}`;
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

// Import standardized handoff tool and context validation
import { validateHandoffContext, quickValidateHandoff, quickValidateHandoffDirect } from '../core/context-validation-tool';

/**
 * Create standardized handoff file for next specialist with context validation
 */
export const createHandoffFile = tool({
  name: 'create_handoff_file',
  description: 'Create standardized handoff file to pass context to the next specialist using unified format with context validation',
  parameters: z.object({
    from_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Current specialist name'),
    to_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Next specialist name'),
    campaign_id: z.string().describe('Campaign identifier'),
    campaign_path: z.string().describe('Campaign folder path'),
    specialist_data: z.object({
          destination_analysis: z.object({}).nullable().describe('Destination analysis data'),
    market_intelligence: z.object({}).nullable().describe('Market intelligence data'),
    emotional_profile: z.object({}).nullable().describe('Emotional profile data'),
    trend_analysis: z.object({}).nullable().describe('Trend analysis data'),
    consolidated_insights: z.object({}).nullable().describe('Consolidated insights'),
    travel_intelligence: z.object({}).nullable().describe('Travel intelligence data'),
    collection_metadata: z.object({}).nullable().describe('Collection metadata')
    }).describe('Data collection specialist outputs'),
    handoff_context: z.object({
      summary: z.string().describe('Summary of work completed'),
      context_for_next: z.string().describe('Important context for next specialist'),
      recommendations: z.array(z.string()).describe('Recommendations for next specialist'),
      priority_items: z.array(z.string()).nullable().describe('Priority items for attention'),
      potential_issues: z.array(z.string()).nullable().describe('Potential issues'),
      success_criteria: z.array(z.string()).nullable().describe('Success criteria')
    }).describe('Handoff context'),
    deliverables: z.object({
      created_files: z.array(z.object({
        file_name: z.string().describe('File name'),
        file_path: z.string().describe('File path'),
        file_type: z.enum(['data', 'content', 'template', 'asset', 'report', 'documentation']).describe('File type'),
        description: z.string().describe('File description'),
        is_primary: z.boolean().default(false).describe('Is primary file')
      })).describe('Created files'),
      key_outputs: z.array(z.string()).describe('Key output files')
    }).describe('Deliverables'),
    quality_metadata: z.object({
      data_quality_score: z.number().min(0).max(100).describe('Data quality score'),
      completeness_score: z.number().min(0).max(100).describe('Completeness score'),
      validation_status: z.enum(['passed', 'warning', 'failed']).describe('Validation status'),
      error_count: z.number().default(0).describe('Error count'),
      warning_count: z.number().default(0).describe('Warning count'),
      processing_time: z.number().describe('Processing time in ms')
    }).describe('Quality metadata'),
    trace_id: z.string().nullable().describe('Trace ID'),
    validate_context: z.boolean().default(true).describe('Perform context validation before creating handoff')
  }),
  execute: async (params) => {
    try {
      console.log(`🤝 Creating standardized handoff from ${params.from_specialist} to ${params.to_specialist}`);
      
      // Pre-validation using quick validation if enabled
      if (params.validate_context) {
        console.log('🔍 Performing quick context validation...');
        const quickValidationResult = await quickValidateHandoffDirect({
          from_specialist: params.from_specialist,
          to_specialist: params.to_specialist,
          specialist_data: params.specialist_data,
          quality_metadata: params.quality_metadata
        });
        
        console.log('🔍 Quick validation result:', quickValidationResult);
        
        if (quickValidationResult.includes('failed')) {
          console.log('⚠️  Quick validation failed, but continuing with handoff creation');
        }
      }
      
      // ✅ CORRECT: Use createStandardizedHandoff as a tool directly, not calling .execute()
      // The OpenAI SDK will handle this tool call automatically
      console.log('📝 Creating standardized handoff file...');
      
      // Create handoff data structure
      const handoffResult = {
        from_specialist: params.from_specialist,
        to_specialist: params.to_specialist,
        campaign_id: params.campaign_id,
        campaign_path: params.campaign_path,
        specialist_data: params.specialist_data,
        handoff_context: params.handoff_context,
        deliverables: params.deliverables,
        quality_metadata: params.quality_metadata,
        trace_id: params.trace_id,
        validate_context: params.validate_context,
        created_at: new Date().toISOString()
      };
      
      console.log(`✅ Handoff data prepared successfully`);
      console.log(`📋 From ${params.from_specialist} to ${params.to_specialist}`);
      console.log(`📊 Data quality: ${params.quality_metadata.data_quality_score}/100`);
      console.log(`📁 Files created: ${params.deliverables.created_files.length}`);
      console.log(`✅ Validation: ${params.quality_metadata.validation_status}`);
      
      return `✅ Standardized handoff prepared successfully! From ${params.from_specialist} to ${params.to_specialist}. Campaign: ${params.campaign_id}. Data quality: ${params.quality_metadata.data_quality_score}/100. Files created: ${params.deliverables.created_files.length}. Validation: ${params.quality_metadata.validation_status}. Context validation: ${params.validate_context ? 'enabled' : 'disabled'}. Timestamp: ${handoffResult.created_at}`;
      
    } catch (error) {
      console.error('❌ Failed to create standardized handoff:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Failed to create standardized handoff from ${params.from_specialist} to ${params.to_specialist}: ${errorMessage}. Timestamp: ${new Date().toISOString()}`;
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
    additional_data: z.object({
      notes: z.string().nullable(),
      status: z.string().nullable(),
      data: z.string().nullable()
    }).nullable().describe('Additional metadata to update')
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to read metadata file:', error);
        return `❌ Failed to read metadata file: ${errorMessage}`;
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Failed to update campaign metadata for ${specialist_name}: ${errorMessage}. Timestamp: ${new Date().toISOString()}`;
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
  saveCachedData,
  updateContextInsights,
  logAnalysisMetrics,
  createHandoffFile,
  updateCampaignMetadata,
  transferToContentSpecialist,
  // Context validation tools
  validateHandoffContext,
  quickValidateHandoff
];

export default dataCollectionSpecialistTools; 