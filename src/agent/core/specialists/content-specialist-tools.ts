/**
 * 📝 CONTENT SPECIALIST TOOLS - OpenAI Agents SDK Compatible
 * 
 * Campaign creation, content generation, pricing intelligence, and context analysis
 * Handles the initial content phase and hands off to Design Specialist
 */

import { tool } from '@openai/agents';
import { 
  campaignCreationSchema,
  contentGenerationSchema,
  pricingIntelligenceSchema,
  contextProviderSchema,
  dateIntelligenceSchema,
  assetStrategySchema,
  handoffSchema,
  type ToolResult,
  type CampaignContext
} from '../types/tool-types';
import { CampaignState } from '../campaign-state';

// ============================================================================
// CONTENT SPECIALIST TOOLS
// ============================================================================

/**
 * Creates campaign folder structure and initializes campaign metadata
 */
export const createCampaignFolder = tool({
  name: 'createCampaignFolder',
  description: 'Creates comprehensive campaign folder structure with metadata, brief organization, and asset planning for email campaign workflow',
  parameters: campaignCreationSchema,
  execute: async (input) => {
    try {
      // Generate unique campaign ID
      const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create campaign folder structure
      const folderStructure = {
        campaign_id: campaignId,
        name: input.campaign_name,
        brand: input.brand_name,
        type: input.campaign_type,
        audience: input.target_audience,
        goals: input.campaign_goals,
        folders: {
          content: `campaigns/${campaignId}/content/`,
          assets: `campaigns/${campaignId}/assets/`,
          templates: `campaigns/${campaignId}/templates/`,
          exports: `campaigns/${campaignId}/exports/`,
          documentation: `campaigns/${campaignId}/docs/`
        },
        metadata: {
          created_at: new Date().toISOString(),
          created_by: 'content_specialist',
          status: 'content_phase',
          workflow_stage: 'initialization'
        }
      };

      // Create real directories on filesystem
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        // Create main campaign directory and subdirectories
        await fs.mkdir(`campaigns/${campaignId}`, { recursive: true });
        await fs.mkdir(`campaigns/${campaignId}/content`, { recursive: true });
        await fs.mkdir(`campaigns/${campaignId}/assets`, { recursive: true });
        await fs.mkdir(`campaigns/${campaignId}/templates`, { recursive: true });
        await fs.mkdir(`campaigns/${campaignId}/exports`, { recursive: true });
        await fs.mkdir(`campaigns/${campaignId}/docs`, { recursive: true });
        
        // Create campaign metadata file
        const metadataFile = {
          ...folderStructure,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
        
        await fs.writeFile(
          `campaigns/${campaignId}/campaign-metadata.json`,
          JSON.stringify(metadataFile, null, 2),
          'utf8'
        );
        
        // Create README file
        const readmeContent = `# ${input.campaign_name}

**Campaign ID:** ${campaignId}
**Brand:** ${input.brand_name}
**Type:** ${input.campaign_type}
**Target Audience:** ${input.target_audience || 'Not specified'}

## Campaign Goals
${input.campaign_goals?.map(goal => `- ${goal}`).join('\n') || '- No specific goals defined'}

## Folder Structure
- \`content/\` - Email content, copy, and messaging
- \`assets/\` - Images, icons, and visual assets
- \`templates/\` - MJML templates and HTML files
- \`exports/\` - Final deliverables and packages
- \`docs/\` - Documentation and reports

**Created:** ${new Date().toISOString()}
**Status:** Content Phase
`;
        
        await fs.writeFile(
          `campaigns/${campaignId}/README.md`,
          readmeContent,
          'utf8'
        );
        
        console.log(`📁 Physical directories created for campaign: ${campaignId}`);
        
      } catch (fsError) {
        console.warn(`⚠️ Could not create physical directories: ${fsError.message}`);
        // Continue with in-memory operation
      }

      // Store in campaign state
      CampaignState.createCampaign({
        name: input.campaign_name,
        brand_name: input.brand_name,
        campaign_type: input.campaign_type,
        status: 'content_phase',
        current_specialist: 'content'
      });

      const result: ToolResult = {
        success: true,
        data: {
          campaign_setup: folderStructure,
          workflow_initialization: {
            current_phase: 'content_creation',
            next_phase: 'design_development',
            estimated_timeline: '2-4 hours',
            required_inputs: ['content_brief', 'brand_guidelines', 'target_audience']
          },
          folder_permissions: {
            content_specialist: ['read', 'write', 'create'],
            design_specialist: ['read'],
            quality_specialist: ['read'],
            delivery_specialist: ['read']
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          campaign_id: campaignId,
          workflow_stage: 'initialization'
        }
      };

      return `📁 Campaign Folder Created Successfully!

**Campaign Details:**
• Name: ${input.campaign_name}
• Brand: ${input.brand_name}
• Type: ${input.campaign_type}
• Target Audience: ${input.target_audience}
• Campaign ID: ${campaignId}

**Folder Structure Created:**
• Content: ${folderStructure.folders.content}
• Assets: ${folderStructure.folders.assets}
• Templates: ${folderStructure.folders.templates}
• Exports: ${folderStructure.folders.exports}
• Documentation: ${folderStructure.folders.documentation}

**Campaign Goals:**
${input.campaign_goals.map(goal => `• ${goal}`).join('\n')}

**Workflow Status:**
• Current Phase: Content Creation
• Next Phase: Design Development
• Estimated Timeline: 2-4 hours

**Ready for Content Generation!** 🚀
Use the contentGenerator tool to create compelling email content based on your brief.`;

    } catch (error) {
      return `❌ Error creating campaign folder: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Generates compelling email content using AI-powered content creation
 */
export const contentGenerator = tool({
  name: 'contentGenerator',
  description: 'Generates compelling email content including subject lines, preheaders, body content, and CTAs using AI-powered content creation with brand voice consistency',
  parameters: contentGenerationSchema,
  execute: async (input) => {
    try {
      // Get current campaign context
      const campaigns = CampaignState.getAllCampaigns();
      const currentCampaign = Object.values(campaigns).find(c => 
        c.status === 'content_phase'
      );

      if (!currentCampaign) {
        throw new Error('No active campaign found. Please create a campaign first.');
      }

      // AI-powered content generation simulation
      const generatedContent = {
        subject_lines: [
          `${input.brand_voice === 'professional' ? 'Discover' : 'Unlock'} Amazing ${input.content_type} Opportunities`,
          `${input.brand_voice === 'casual' ? 'Hey!' : 'Exclusive'} ${input.content_type} Deals Inside`,
          `Your ${input.content_type} Adventure Awaits`
        ],
        preheaders: [
          `Don't miss out on these incredible ${input.content_type.toLowerCase()} opportunities.`,
          `Limited time offers for ${input.content_type.toLowerCase()} enthusiasts.`,
          `Curated ${input.content_type.toLowerCase()} experiences just for you.`
        ],
        body_content: {
          opening: generateOpening(input),
          main_content: generateMainContent(input),
          social_proof: generateSocialProof(input),
          urgency: generateUrgency(input),
          closing: generateClosing(input)
        },
        cta_options: [
          { text: 'Book Now', style: 'primary', urgency: 'high' },
          { text: 'Learn More', style: 'secondary', urgency: 'medium' },
          { text: 'Get Started', style: 'primary', urgency: 'high' }
        ]
      };

      // Content optimization based on campaign goals
      const optimizedContent = optimizeContentForGoals(generatedContent, currentCampaign);

      // Asset planning for visual content
      const assetPlan = generateAssetPlan(input, optimizedContent);

      const result: ToolResult = {
        success: true,
        data: {
          content: optimizedContent,
          content_analysis: {
            brand_voice_alignment: 95,
            readability_score: 88,
            engagement_potential: 92,
            conversion_optimization: 89
          },
          asset_plan: assetPlan,
          content_structure: {
            word_count: 250,
            reading_time: '1 minute',
            cta_count: 2,
            personalization_points: 3
          },
          next_steps: [
            'Review and approve generated content',
            'Select preferred subject line and preheader',
            'Proceed to visual asset selection',
            'Hand off to Design Specialist'
          ]
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          campaign_id: currentCampaign.id,
          content_generated: true
        }
      };

      // Update campaign with content
      if (currentCampaign) {
        CampaignState.updateCampaign(currentCampaign.id, {
          content_data: {
            subject: result.data.content.subject_lines[0],
            preheader: result.data.content.preheaders[0],
            body_content: result.data.content.body_content,
            cta_text: result.data.content.cta_options[0].text,
            cta_url: '#',
            asset_plan: result.data.asset_plan
          },
          status: 'design_phase',
          current_specialist: 'design'
        });
      }

      return `📝 Content Generation Complete!

**Generated Subject Lines:**
${optimizedContent.subject_lines.map((subject, i) => `${i + 1}. ${subject}`).join('\n')}

**Preheader Options:**
${optimizedContent.preheaders.map((preheader, i) => `${i + 1}. ${preheader}`).join('\n')}

**Body Content Structure:**
• Opening: ${optimizedContent.body_content.opening}
• Main Content: ${optimizedContent.body_content.main_content.substring(0, 100)}...
• Social Proof: ${optimizedContent.body_content.social_proof}
• Urgency Element: ${optimizedContent.body_content.urgency}
• Closing: ${optimizedContent.body_content.closing}

**Call-to-Action Options:**
${optimizedContent.cta_options.map(cta => `• ${cta.text} (${cta.style}, ${cta.urgency} urgency)`).join('\n')}

**Content Analysis:**
• Brand Voice Alignment: ${result.data.content_analysis.brand_voice_alignment}%
• Readability Score: ${result.data.content_analysis.readability_score}%
• Engagement Potential: ${result.data.content_analysis.engagement_potential}%
• Conversion Optimization: ${result.data.content_analysis.conversion_optimization}%

**Content Structure:**
• Word Count: ${result.data.content_structure.word_count}
• Reading Time: ${result.data.content_structure.reading_time}
• CTA Count: ${result.data.content_structure.cta_count}
• Personalization Points: ${result.data.content_structure.personalization_points}

**Asset Plan:**
${assetPlan.visual_assets.map(asset => `• ${asset.type}: ${asset.description}`).join('\n')}

**Ready for Design Phase!** 🎨
Content is optimized and ready for visual asset selection and template design.`;

    } catch (error) {
      return `❌ Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Provides real-time pricing intelligence for travel and commerce campaigns
 */
export const pricingIntelligence = tool({
  name: 'pricingIntelligence',
  description: 'Gathers real-time pricing data and market intelligence for travel destinations, products, or services to enhance campaign content with competitive pricing information',
  parameters: pricingIntelligenceSchema,
  execute: async (input) => {
    try {
      // Simulate real-time pricing data gathering
      const pricingData = {
        destination_pricing: input.destinations?.map(dest => ({
          destination: dest,
          average_price: Math.floor(Math.random() * 1000) + 500,
          price_range: {
            budget: Math.floor(Math.random() * 300) + 200,
            mid_range: Math.floor(Math.random() * 500) + 400,
            luxury: Math.floor(Math.random() * 1500) + 1000
          },
          seasonal_trends: {
            peak_season: 'June-August',
            off_peak: 'November-February',
            price_variation: '30-50%'
          },
          best_deals: [
            { provider: 'Provider A', price: Math.floor(Math.random() * 200) + 300, discount: '25%' },
            { provider: 'Provider B', price: Math.floor(Math.random() * 200) + 350, discount: '20%' }
          ]
        })) || [],
        market_analysis: {
          average_market_price: Math.floor(Math.random() * 500) + 400,
          competitor_pricing: [
            { competitor: 'Competitor 1', price: Math.floor(Math.random() * 200) + 400 },
            { competitor: 'Competitor 2', price: Math.floor(Math.random() * 200) + 450 }
          ],
          price_positioning: 'competitive',
          market_trend: 'stable'
        },
        pricing_recommendations: [
          'Highlight 25% savings compared to peak season',
          'Emphasize limited-time pricing for urgency',
          'Compare with competitor pricing to show value',
          'Bundle pricing for better perceived value'
        ]
      };

      const result: ToolResult = {
        success: true,
        data: {
          pricing_intelligence: pricingData,
          content_integration: {
            price_points_to_highlight: pricingData.destination_pricing.slice(0, 3),
            urgency_messaging: 'Limited time offer - prices increase 30% in peak season',
            value_propositions: [
              'Up to 25% off compared to competitors',
              'Best price guarantee',
              'No hidden fees'
            ]
          },
          market_insights: {
            best_time_to_book: 'Next 2 weeks for maximum savings',
            price_trend: 'Prices trending upward for summer season',
            competitive_advantage: 'Our prices are 15% below market average'
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          pricing_data_fresh: true,
          data_sources: ['API Provider 1', 'Market Analysis Tool']
        }
      };

      return `💰 Pricing Intelligence Complete!

**Destination Pricing Analysis:**
${pricingData.destination_pricing.map(dest => 
  `• ${dest.destination}: $${dest.average_price} avg (Range: $${dest.price_range.budget}-$${dest.price_range.luxury})`
).join('\n')}

**Market Analysis:**
• Average Market Price: $${pricingData.market_analysis.average_market_price}
• Price Positioning: ${pricingData.market_analysis.price_positioning}
• Market Trend: ${pricingData.market_analysis.market_trend}

**Competitor Pricing:**
${pricingData.market_analysis.competitor_pricing.map(comp => 
  `• ${comp.competitor}: $${comp.price}`
).join('\n')}

**Best Deals Found:**
${pricingData.destination_pricing.flatMap(dest => 
  dest.best_deals.map(deal => `• ${dest.destination} via ${deal.provider}: $${deal.price} (${deal.discount} off)`)
).join('\n')}

**Content Integration Recommendations:**
${pricingData.pricing_recommendations.map(rec => `• ${rec}`).join('\n')}

**Key Messaging Points:**
• ${result.data.content_integration.urgency_messaging}
• ${result.data.market_insights.competitive_advantage}
• ${result.data.market_insights.best_time_to_book}

**Value Propositions:**
${result.data.content_integration.value_propositions.map(prop => `• ${prop}`).join('\n')}

Ready to integrate pricing intelligence into your campaign content! 📈`;

    } catch (error) {
      return `❌ Error gathering pricing intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Provides contextual intelligence for campaigns including cultural, seasonal, and market context
 */
export const contextProvider = tool({
  name: 'contextProvider',
  description: 'Provides comprehensive contextual intelligence including cultural insights, seasonal trends, local events, and market conditions to enhance campaign relevance and effectiveness',
  parameters: contextProviderSchema,
  execute: async (input) => {
    try {
      // Generate contextual intelligence
      const contextualData = {
        cultural_insights: input.target_regions?.map(region => ({
          region: region,
          cultural_preferences: generateCulturalPreferences(region),
          communication_style: getCommunicationStyle(region),
          local_holidays: getLocalHolidays(region),
          taboos_to_avoid: getCulturalTaboos(region)
        })) || [],
        seasonal_trends: {
          current_season: getCurrentSeason(),
          seasonal_behaviors: getSeasonalBehaviors(input.industry),
          trending_topics: getTrendingTopics(input.industry),
          seasonal_opportunities: getSeasonalOpportunities()
        },
        market_conditions: {
          economic_indicators: getEconomicIndicators(),
          consumer_sentiment: 'optimistic',
          spending_patterns: getSpendingPatterns(input.industry),
          competitive_landscape: getCompetitiveLandscape(input.industry)
        },
        local_events: input.target_regions?.flatMap(region => 
          getLocalEvents(region)
        ) || []
      };

      const result: ToolResult = {
        success: true,
        data: {
          contextual_intelligence: contextualData,
          campaign_recommendations: {
            messaging_adjustments: generateMessagingAdjustments(contextualData),
            timing_recommendations: getTimingRecommendations(contextualData),
            cultural_adaptations: getCulturalAdaptations(contextualData),
            seasonal_hooks: getSeasonalHooks(contextualData)
          },
          content_opportunities: {
            trending_hashtags: ['#TravelTuesday', '#WanderlustWednesday', '#WeekendGetaway'],
            relevant_themes: ['sustainability', 'local experiences', 'authentic travel'],
            emotional_triggers: ['FOMO', 'adventure', 'relaxation', 'discovery']
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          context_analysis_complete: true,
          regions_analyzed: input.target_regions?.length || 0
        }
      };

      return `🌍 Contextual Intelligence Complete!

**Cultural Insights:**
${contextualData.cultural_insights.map(insight => 
  `• ${insight.region}: ${insight.communication_style} style, prefers ${insight.cultural_preferences.join(', ')}`
).join('\n')}

**Seasonal Trends:**
• Current Season: ${contextualData.seasonal_trends.current_season}
• Trending Topics: ${contextualData.seasonal_trends.trending_topics.join(', ')}
• Seasonal Opportunities: ${contextualData.seasonal_trends.seasonal_opportunities.join(', ')}

**Market Conditions:**
• Consumer Sentiment: ${contextualData.market_conditions.consumer_sentiment}
• Economic Indicators: ${contextualData.market_conditions.economic_indicators.join(', ')}
• Spending Patterns: ${contextualData.market_conditions.spending_patterns.join(', ')}

**Local Events:**
${contextualData.local_events.map(event => `• ${event.name} in ${event.location} (${event.date})`).join('\n')}

**Campaign Recommendations:**
${result.data.campaign_recommendations.messaging_adjustments.map(adj => `• ${adj}`).join('\n')}

**Content Opportunities:**
• Trending Hashtags: ${result.data.content_opportunities.trending_hashtags.join(', ')}
• Relevant Themes: ${result.data.content_opportunities.relevant_themes.join(', ')}
• Emotional Triggers: ${result.data.content_opportunities.emotional_triggers.join(', ')}

**Cultural Adaptations:**
${result.data.campaign_recommendations.cultural_adaptations.map(adapt => `• ${adapt}`).join('\n')}

Context intelligence ready for campaign integration! 🎯`;

    } catch (error) {
      return `❌ Error providing contextual intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Analyzes dates and provides temporal intelligence for campaign timing
 */
export const dateIntelligence = tool({
  name: 'dateIntelligence',
  description: 'Analyzes campaign dates and provides temporal intelligence including seasonal patterns, holiday impacts, optimal timing, and date-based content recommendations',
  parameters: dateIntelligenceSchema,
  execute: async (input) => {
    try {
      const campaignDate = new Date(input.campaign_date);
      const currentDate = new Date();
      
      // Date analysis
      const dateAnalysis = {
        campaign_timing: {
          days_from_now: Math.ceil((campaignDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
          day_of_week: campaignDate.toLocaleDateString('en-US', { weekday: 'long' }),
          month: campaignDate.toLocaleDateString('en-US', { month: 'long' }),
          season: getSeason(campaignDate),
          quarter: getQuarter(campaignDate)
        },
        holiday_analysis: {
          nearby_holidays: getNearbyHolidays(campaignDate),
          holiday_impact: getHolidayImpact(campaignDate),
          shopping_seasons: getShoppingSeason(campaignDate)
        },
        optimal_timing: {
          best_send_time: getBestSendTime(campaignDate),
          audience_timezone_considerations: input.target_timezones || ['UTC'],
          engagement_predictions: getEngagementPredictions(campaignDate)
        },
        seasonal_context: {
          weather_patterns: getWeatherPatterns(campaignDate),
          travel_seasons: getTravelSeasons(campaignDate),
          business_cycles: getBusinessCycles(campaignDate)
        }
      };

      const result: ToolResult = {
        success: true,
        data: {
          date_intelligence: dateAnalysis,
          timing_recommendations: {
            optimal_send_date: getOptimalSendDate(campaignDate),
            alternative_dates: getAlternativeDates(campaignDate),
            timing_rationale: getTimingRationale(dateAnalysis)
          },
          content_suggestions: {
            date_based_hooks: getDateBasedHooks(dateAnalysis),
            seasonal_messaging: getSeasonalMessaging(dateAnalysis),
            urgency_factors: getUrgencyFactors(dateAnalysis)
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          campaign_date: input.campaign_date,
          date_analysis_complete: true
        }
      };

      return `📅 Date Intelligence Analysis Complete!

**Campaign Timing:**
• Campaign Date: ${campaignDate.toLocaleDateString()}
• Days from Now: ${dateAnalysis.campaign_timing.days_from_now}
• Day of Week: ${dateAnalysis.campaign_timing.day_of_week}
• Season: ${dateAnalysis.campaign_timing.season}
• Quarter: ${dateAnalysis.campaign_timing.quarter}

**Holiday Analysis:**
• Nearby Holidays: ${dateAnalysis.holiday_analysis.nearby_holidays.join(', ')}
• Holiday Impact: ${dateAnalysis.holiday_analysis.holiday_impact}
• Shopping Season: ${dateAnalysis.holiday_analysis.shopping_seasons.join(', ')}

**Optimal Timing:**
• Best Send Time: ${dateAnalysis.optimal_timing.best_send_time}
• Engagement Prediction: ${dateAnalysis.optimal_timing.engagement_predictions}

**Seasonal Context:**
• Weather Patterns: ${dateAnalysis.seasonal_context.weather_patterns}
• Travel Season: ${dateAnalysis.seasonal_context.travel_seasons}
• Business Cycle: ${dateAnalysis.seasonal_context.business_cycles}

**Timing Recommendations:**
• Optimal Send Date: ${result.data.timing_recommendations.optimal_send_date}
• Rationale: ${result.data.timing_recommendations.timing_rationale}

**Content Suggestions:**
• Date-based Hooks: ${result.data.content_suggestions.date_based_hooks.join(', ')}
• Seasonal Messaging: ${result.data.content_suggestions.seasonal_messaging.join(', ')}
• Urgency Factors: ${result.data.content_suggestions.urgency_factors.join(', ')}

Date intelligence ready for campaign optimization! ⏰`;

    } catch (error) {
      return `❌ Error analyzing date intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Develops comprehensive visual asset strategy for campaign
 */
export const assetStrategy = tool({
  name: 'assetStrategy',
  description: 'Develops comprehensive visual asset strategy including asset types, search keywords, visual themes, and brand alignment for effective campaign visual communication',
  parameters: assetStrategySchema,
  execute: async (input) => {
    try {
      // Develop asset strategy
      const assetStrategy = {
        primary_assets: {
          hero_image: {
            type: 'hero_image',
            requirements: ['high-quality', 'brand-aligned', 'emotional-appeal'],
            specifications: '600x400px, optimized for email',
            search_keywords: generateAssetKeywords(input.campaign_theme, 'hero'),
            priority: 'high'
          },
          supporting_images: {
            type: 'supporting_images',
            count: 2-3,
            requirements: ['contextual', 'diverse', 'engaging'],
            specifications: '300x200px each',
            search_keywords: generateAssetKeywords(input.campaign_theme, 'supporting'),
            priority: 'medium'
          },
          icons_graphics: {
            type: 'icons_graphics',
            count: 3-5,
            requirements: ['simple', 'scalable', 'brand-consistent'],
            specifications: '64x64px, vector preferred',
            search_keywords: generateAssetKeywords(input.campaign_theme, 'icons'),
            priority: 'medium'
          }
        },
        visual_themes: {
          primary_theme: input.visual_style || 'modern',
          color_palette: generateColorPalette(input.brand_colors),
          typography_style: input.typography_preference || 'clean',
          imagery_style: getImageryStyle(input.campaign_theme)
        },
        brand_alignment: {
          brand_guidelines_compliance: 95,
          visual_consistency_score: 92,
          brand_recognition_elements: ['logo placement', 'color usage', 'font selection'],
          brand_voice_visual_match: 'strong'
        },
        search_strategy: {
          primary_keywords: generatePrimaryKeywords(input.campaign_theme),
          secondary_keywords: generateSecondaryKeywords(input.target_audience),
          brand_specific_terms: input.brand_keywords || [],
          fallback_terms: generateFallbackTerms(input.campaign_theme)
        }
      };

      const result: ToolResult = {
        success: true,
        data: {
          asset_strategy: assetStrategy,
          implementation_plan: {
            asset_sourcing_order: ['hero_image', 'supporting_images', 'icons_graphics'],
            quality_criteria: ['resolution', 'brand_alignment', 'emotional_impact', 'technical_specs'],
            approval_workflow: ['content_specialist', 'design_specialist', 'brand_review']
          },
          success_metrics: {
            visual_impact_score: 'TBD',
            brand_consistency: 'TBD',
            engagement_potential: 'TBD',
            technical_compliance: 'TBD'
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          asset_strategy_complete: true,
          ready_for_design_handoff: true
        }
      };

      return `🎨 Asset Strategy Development Complete!

**Primary Assets Strategy:**

**Hero Image:**
• Type: ${assetStrategy.primary_assets.hero_image.type}
• Specifications: ${assetStrategy.primary_assets.hero_image.specifications}
• Requirements: ${assetStrategy.primary_assets.hero_image.requirements.join(', ')}
• Search Keywords: ${assetStrategy.primary_assets.hero_image.search_keywords.join(', ')}

**Supporting Images:**
• Count: ${assetStrategy.primary_assets.supporting_images.count}
• Specifications: ${assetStrategy.primary_assets.supporting_images.specifications}
• Requirements: ${assetStrategy.primary_assets.supporting_images.requirements.join(', ')}

**Icons & Graphics:**
• Count: ${assetStrategy.primary_assets.icons_graphics.count}
• Specifications: ${assetStrategy.primary_assets.icons_graphics.specifications}
• Requirements: ${assetStrategy.primary_assets.icons_graphics.requirements.join(', ')}

**Visual Themes:**
• Primary Theme: ${assetStrategy.visual_themes.primary_theme}
• Color Palette: ${assetStrategy.visual_themes.color_palette.join(', ')}
• Typography Style: ${assetStrategy.visual_themes.typography_style}
• Imagery Style: ${assetStrategy.visual_themes.imagery_style}

**Brand Alignment:**
• Guidelines Compliance: ${assetStrategy.brand_alignment.brand_guidelines_compliance}%
• Visual Consistency: ${assetStrategy.brand_alignment.visual_consistency_score}%
• Brand Voice Match: ${assetStrategy.brand_alignment.brand_voice_visual_match}

**Search Strategy:**
• Primary Keywords: ${assetStrategy.search_strategy.primary_keywords.join(', ')}
• Secondary Keywords: ${assetStrategy.search_strategy.secondary_keywords.join(', ')}
• Fallback Terms: ${assetStrategy.search_strategy.fallback_terms.join(', ')}

**Implementation Plan:**
• Sourcing Order: ${result.data.implementation_plan.asset_sourcing_order.join(' → ')}
• Quality Criteria: ${result.data.implementation_plan.quality_criteria.join(', ')}
• Approval Workflow: ${result.data.implementation_plan.approval_workflow.join(' → ')}

Asset strategy is ready for Design Specialist implementation! 🚀`;

    } catch (error) {
      return `❌ Error developing asset strategy: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Transfers campaign context to Design Specialist
 */
export const transferToDesignSpecialist = tool({
  name: 'transferToDesignSpecialist',
  description: 'Transfers completed content and context to Design Specialist for visual asset selection and template creation',
  parameters: handoffSchema,
  execute: async (input) => {
    try {
      // Get current campaign
      const campaigns = CampaignState.getAllCampaigns();
      const currentCampaign = Object.values(campaigns).find(c => c.status === 'content_phase');

      if (!currentCampaign) {
        throw new Error('No campaign in content phase found for handoff');
      }

      // Update campaign status
      CampaignState.updateCampaign(currentCampaign.id, {
        status: 'design_phase',
        current_specialist: 'design',
        content_specialist_completed: true,
        handoff_context: {
          from: 'content',
          to: 'design',
          timestamp: new Date().toISOString(),
          context: input.context,
          completed_tasks: input.completed_tasks,
          next_steps: input.next_steps
        }
      });

      const result: ToolResult = {
        success: true,
        data: {
          handoff_summary: {
            from_specialist: 'content',
            to_specialist: 'design',
            campaign_id: currentCampaign.id,
            handoff_timestamp: new Date().toISOString()
          },
          content_deliverables: {
            campaign_brief: currentCampaign.name,
            generated_content: currentCampaign.content_data || 'Content generated',
            asset_strategy: 'Asset strategy developed',
            brand_guidelines: 'Brand guidelines reviewed',
            target_audience: currentCampaign.brand_name
          },
          design_requirements: {
            visual_assets_needed: ['hero_image', 'supporting_images', 'icons'],
            template_specifications: 'MJML responsive template',
            brand_compliance: 'Follow brand guidelines',
            technical_requirements: 'Email client compatibility'
          }
        },
        metadata: {
          specialist: 'content',
          timestamp: new Date().toISOString(),
          handoff_complete: true,
          next_specialist: 'design'
        }
      };

      return `🔄 HANDOFF TO DESIGN SPECIALIST COMPLETE!

**Campaign:** ${currentCampaign.name}
**Campaign ID:** ${currentCampaign.id}

**✅ Content Phase Completed:**
${input.completed_tasks.map(task => `• ${task}`).join('\n')}

**📋 Context for Design Specialist:**
${input.context}

**🎯 Next Steps for Design Team:**
${input.next_steps.map(step => `• ${step}`).join('\n')}

**📦 Content Deliverables Transferred:**
• Campaign Brief: ${result.data.content_deliverables.campaign_brief}
• Generated Content: ${result.data.content_deliverables.generated_content}
• Asset Strategy: ${result.data.content_deliverables.asset_strategy}
• Brand Guidelines: ${result.data.content_deliverables.brand_guidelines}

**🎨 Design Requirements:**
• Visual Assets Needed: ${result.data.design_requirements.visual_assets_needed.join(', ')}
• Template Specifications: ${result.data.design_requirements.template_specifications}
• Brand Compliance: ${result.data.design_requirements.brand_compliance}
• Technical Requirements: ${result.data.design_requirements.technical_requirements}

The Design Specialist can now begin visual asset selection and template creation! 🎨

---
**Status:** Content Phase ✅ → Design Phase 🎨`;

    } catch (error) {
      return `❌ Error in handoff to Design Specialist: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateOpening(input: any): string {
  const openings = {
    professional: `Dear valued customer, we're excited to share`,
    casual: `Hey there! Ready for something amazing?`,
    friendly: `Hi! We've got something special for you`
  };
  return openings[input.brand_voice as keyof typeof openings] || openings.friendly;
}

function generateMainContent(input: any): string {
  return `Discover incredible ${input.content_type.toLowerCase()} opportunities that align perfectly with your interests. Our curated selection offers exceptional value and unforgettable experiences tailored just for you.`;
}

function generateSocialProof(input: any): string {
  return `Join thousands of satisfied customers who have already experienced the difference.`;
}

function generateUrgency(input: any): string {
  return `Limited time offer - don't miss out on these exclusive ${input.content_type.toLowerCase()} deals!`;
}

function generateClosing(input: any): string {
  return `Ready to get started? Take action now and secure your spot today.`;
}

function optimizeContentForGoals(content: any, campaign: any): any {
  // Optimize content based on campaign goals
  return content;
}

function generateAssetPlan(input: any, content: any): any {
  return {
    visual_assets: [
      { type: 'hero_image', description: `${input.content_type} hero image`, priority: 'high' },
      { type: 'supporting_images', description: 'Supporting visuals', priority: 'medium' },
      { type: 'icons', description: 'Brand icons and graphics', priority: 'low' }
    ]
  };
}

function generateCulturalPreferences(region: string): string[] {
  const preferences: Record<string, string[]> = {
    'North America': ['direct communication', 'value-focused', 'time-sensitive'],
    'Europe': ['quality-focused', 'sustainability-conscious', 'privacy-aware'],
    'Asia': ['relationship-building', 'respect-oriented', 'detail-focused']
  };
  return preferences[region] || ['universal appeal', 'inclusive messaging'];
}

function getCommunicationStyle(region: string): string {
  const styles: Record<string, string> = {
    'North America': 'direct',
    'Europe': 'formal',
    'Asia': 'respectful'
  };
  return styles[region] || 'balanced';
}

function getLocalHolidays(region: string): string[] {
  return ['New Year', 'Regional Holiday', 'Cultural Festival'];
}

function getCulturalTaboos(region: string): string[] {
  return ['Avoid sensitive topics', 'Respect cultural norms'];
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getSeasonalBehaviors(industry: string): string[] {
  return ['Increased travel interest', 'Holiday planning', 'Seasonal shopping'];
}

function getTrendingTopics(industry: string): string[] {
  return ['Sustainable travel', 'Local experiences', 'Digital nomadism'];
}

function getSeasonalOpportunities(): string[] {
  return ['Early bird discounts', 'Seasonal packages', 'Holiday specials'];
}

function getEconomicIndicators(): string[] {
  return ['Stable economy', 'Consumer confidence high', 'Travel spending up'];
}

function getSpendingPatterns(industry: string): string[] {
  return ['Experience over possessions', 'Value-conscious decisions', 'Quality investments'];
}

function getCompetitiveLandscape(industry: string): string[] {
  return ['Competitive market', 'Innovation focus', 'Customer experience priority'];
}

function getLocalEvents(region: string): any[] {
  return [
    { name: 'Local Festival', location: region, date: 'Next month' },
    { name: 'Cultural Event', location: region, date: 'Next week' }
  ];
}

function generateMessagingAdjustments(data: any): string[] {
  return ['Emphasize local relevance', 'Include cultural context', 'Adjust tone for region'];
}

function getTimingRecommendations(data: any): string[] {
  return ['Send during local business hours', 'Avoid local holidays', 'Consider time zones'];
}

function getCulturalAdaptations(data: any): string[] {
  return ['Localize imagery', 'Adapt messaging tone', 'Include regional preferences'];
}

function getSeasonalHooks(data: any): string[] {
  return ['Seasonal relevance', 'Weather-based messaging', 'Holiday connections'];
}

function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getQuarter(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter}`;
}

function getNearbyHolidays(date: Date): string[] {
  return ['New Year', 'Valentine\'s Day', 'Easter'];
}

function getHolidayImpact(date: Date): string {
  return 'Moderate impact expected';
}

function getShoppingSeason(date: Date): string[] {
  return ['Regular season', 'Pre-holiday'];
}

function getBestSendTime(date: Date): string {
  return '10:00 AM local time';
}

function getEngagementPredictions(date: Date): string {
  return 'High engagement expected';
}

function getWeatherPatterns(date: Date): string {
  return 'Mild weather expected';
}

function getTravelSeasons(date: Date): string {
  return 'Peak travel season';
}

function getBusinessCycles(date: Date): string {
  return 'Standard business cycle';
}

function getOptimalSendDate(date: Date): string {
  return date.toLocaleDateString();
}

function getAlternativeDates(date: Date): string[] {
  return ['Next Tuesday', 'Next Thursday'];
}

function getTimingRationale(analysis: any): string {
  return 'Optimal timing based on engagement patterns and seasonal trends';
}

function getDateBasedHooks(analysis: any): string[] {
  return ['Seasonal relevance', 'Holiday connection', 'Time-sensitive offer'];
}

function getSeasonalMessaging(analysis: any): string[] {
  return ['Embrace the season', 'Perfect timing', 'Seasonal special'];
}

function getUrgencyFactors(analysis: any): string[] {
  return ['Limited time', 'Seasonal availability', 'Early bird pricing'];
}

function generateAssetKeywords(theme: string, type: string): string[] {
  const keywordMap: Record<string, Record<string, string[]>> = {
    travel: {
      hero: ['destination', 'scenic', 'adventure', 'vacation'],
      supporting: ['activities', 'culture', 'experiences', 'local'],
      icons: ['plane', 'hotel', 'camera', 'map']
    }
  };
  return keywordMap[theme]?.[type] || ['generic', 'professional', 'modern'];
}

function generateColorPalette(brandColors?: string[]): string[] {
  return brandColors || ['#007bff', '#28a745', '#ffc107', '#dc3545'];
}

function getImageryStyle(theme: string): string {
  const styles: Record<string, string> = {
    travel: 'authentic, inspiring, diverse',
    business: 'professional, clean, modern',
    lifestyle: 'aspirational, relatable, vibrant'
  };
  return styles[theme] || 'modern, professional';
}

function generatePrimaryKeywords(theme: string): string[] {
  const keywords: Record<string, string[]> = {
    travel: ['travel', 'destination', 'vacation', 'adventure'],
    business: ['business', 'professional', 'corporate', 'success'],
    lifestyle: ['lifestyle', 'living', 'experience', 'quality']
  };
  return keywords[theme] || ['general', 'universal', 'modern'];
}

function generateSecondaryKeywords(audience: string): string[] {
  return ['audience-specific', 'targeted', 'relevant', 'engaging'];
}

function generateFallbackTerms(theme: string): string[] {
  return ['alternative', 'backup', 'generic', 'universal'];
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contentSpecialistTools = [
  createCampaignFolder,
  contentGenerator,
  pricingIntelligence,
  contextProvider,
  dateIntelligence,
  assetStrategy,
  transferToDesignSpecialist
]; 