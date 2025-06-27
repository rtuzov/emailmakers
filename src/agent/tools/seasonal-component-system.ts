/**
 * Seasonal Component System - Email-Makers
 * Intelligent seasonal variant selection for components based on date and context
 */

import { ToolResult, handleToolError } from './index';

// Seasonal variant definitions
interface SeasonalVariant {
  id: string;
  name: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  themes: string[];
  emotions: string[];
  date_range: {
    start_month: number;
    start_day: number;
    end_month: number;
    end_day: number;
  };
  regional_holidays?: string[];
  asset_path: string;
  description: string;
}

interface SeasonalContext {
  current_date: Date;
  region: 'RU' | 'EU' | 'US' | 'GLOBAL';
  email_content_tone?: 'festive' | 'professional' | 'casual' | 'promotional' | null;
  target_audience?: 'family' | 'business' | 'young_adults' | 'general' | null;
}

interface SeasonalSelection {
  selected_variant: SeasonalVariant;
  confidence_score: number;
  reasoning: string[];
  fallback_variants: SeasonalVariant[];
  seasonal_context: SeasonalContext;
}

// Comprehensive seasonal rabbit variants
const SEASONAL_RABBIT_VARIANTS: SeasonalVariant[] = [
  // Winter Collection
  {
    id: 'winter_snow',
    name: 'Snow Rabbit',
    season: 'winter',
    themes: ['snow', 'winter', 'cold'],
    emotions: ['happy', 'playful', 'cozy'],
    date_range: { start_month: 12, start_day: 1, end_month: 2, end_day: 28 },
    asset_path: '/assets/rabbit-winter-snow-01.png',
    description: 'Rabbit enjoying snow activities'
  },
  {
    id: 'winter_holiday',
    name: 'Holiday Rabbit',
    season: 'winter',
    themes: ['christmas', 'new_year', 'holidays'],
    emotions: ['festive', 'excited', 'joyful'],
    date_range: { start_month: 12, start_day: 15, end_month: 1, end_day: 15 },
    regional_holidays: ['Christmas', 'New Year'],
    asset_path: '/assets/rabbit-winter-holiday-01.png',
    description: 'Festive rabbit with holiday decorations'
  },
  {
    id: 'winter_cozy',
    name: 'Cozy Winter Rabbit',
    season: 'winter',
    themes: ['warmth', 'indoor', 'comfort'],
    emotions: ['relaxed', 'content', 'warm'],
    date_range: { start_month: 1, start_day: 16, end_month: 3, end_day: 15 },
    asset_path: '/assets/rabbit-winter-cozy-01.png',
    description: 'Rabbit in warm winter clothing'
  },

  // Spring Collection
  {
    id: 'spring_flowers',
    name: 'Spring Blossom Rabbit',
    season: 'spring',
    themes: ['flowers', 'growth', 'renewal'],
    emotions: ['fresh', 'optimistic', 'energetic'],
    date_range: { start_month: 3, start_day: 16, end_month: 5, end_day: 15 },
    asset_path: '/assets/rabbit-spring-flowers-01.png',
    description: 'Rabbit surrounded by spring flowers'
  },
  {
    id: 'spring_easter',
    name: 'Easter Rabbit',
    season: 'spring',
    themes: ['easter', 'eggs', 'celebration'],
    emotions: ['joyful', 'playful', 'celebratory'],
    date_range: { start_month: 3, start_day: 20, end_month: 4, end_day: 25 },
    regional_holidays: ['Easter'],
    asset_path: '/assets/rabbit-spring-easter-01.png',
    description: 'Traditional Easter bunny with eggs'
  },
  {
    id: 'spring_rain',
    name: 'Spring Rain Rabbit',
    season: 'spring',
    themes: ['rain', 'umbrella', 'puddles'],
    emotions: ['cheerful', 'adventurous', 'playful'],
    date_range: { start_month: 4, start_day: 1, end_month: 5, end_day: 31 },
    asset_path: '/assets/rabbit-spring-rain-01.png',
    description: 'Rabbit playing in spring rain'
  },

  // Summer Collection
  {
    id: 'summer_beach',
    name: 'Beach Rabbit',
    season: 'summer',
    themes: ['beach', 'vacation', 'sun'],
    emotions: ['relaxed', 'happy', 'carefree'],
    date_range: { start_month: 6, start_day: 1, end_month: 8, end_day: 31 },
    asset_path: '/assets/rabbit-summer-beach-01.png',
    description: 'Rabbit enjoying beach vacation'
  },
  {
    id: 'summer_travel',
    name: 'Travel Rabbit',
    season: 'summer',
    themes: ['travel', 'adventure', 'exploration'],
    emotions: ['excited', 'adventurous', 'curious'],
    date_range: { start_month: 6, start_day: 15, end_month: 8, end_day: 15 },
    asset_path: '/assets/rabbit-summer-travel-01.png',
    description: 'Rabbit ready for summer adventures'
  },
  {
    id: 'summer_ice_cream',
    name: 'Ice Cream Rabbit',
    season: 'summer',
    themes: ['ice_cream', 'treats', 'cooling'],
    emotions: ['delighted', 'satisfied', 'cool'],
    date_range: { start_month: 7, start_day: 1, end_month: 8, end_day: 31 },
    asset_path: '/assets/rabbit-summer-ice-cream-01.png',
    description: 'Rabbit enjoying summer ice cream'
  },

  // Autumn Collection
  {
    id: 'autumn_leaves',
    name: 'Autumn Leaves Rabbit',
    season: 'autumn',
    themes: ['leaves', 'harvest', 'golden'],
    emotions: ['peaceful', 'contemplative', 'warm'],
    date_range: { start_month: 9, start_day: 1, end_month: 11, end_day: 15 },
    asset_path: '/assets/rabbit-autumn-leaves-01.png',
    description: 'Rabbit playing in autumn leaves'
  },
  {
    id: 'autumn_halloween',
    name: 'Halloween Rabbit',
    season: 'autumn',
    themes: ['halloween', 'costume', 'spooky'],
    emotions: ['playful', 'mischievous', 'fun'],
    date_range: { start_month: 10, start_day: 15, end_month: 11, end_day: 5 },
    regional_holidays: ['Halloween'],
    asset_path: '/assets/rabbit-autumn-halloween-01.png',
    description: 'Rabbit in Halloween costume'
  },
  {
    id: 'autumn_harvest',
    name: 'Harvest Rabbit',
    season: 'autumn',
    themes: ['harvest', 'thanksgiving', 'abundance'],
    emotions: ['grateful', 'satisfied', 'content'],
    date_range: { start_month: 10, start_day: 1, end_month: 11, end_day: 30 },
    regional_holidays: ['Thanksgiving'],
    asset_path: '/assets/rabbit-autumn-harvest-01.png',
    description: 'Rabbit celebrating harvest season'
  },

  // Special Occasion Variants
  {
    id: 'valentines',
    name: 'Valentine Rabbit',
    season: 'winter',
    themes: ['love', 'hearts', 'romance'],
    emotions: ['loving', 'romantic', 'sweet'],
    date_range: { start_month: 2, start_day: 10, end_month: 2, end_day: 16 },
    regional_holidays: ['Valentine\'s Day'],
    asset_path: '/assets/rabbit-valentines-01.png',
    description: 'Romantic rabbit for Valentine\'s Day'
  }
];

// Default fallback variants
const DEFAULT_VARIANTS: Record<string, SeasonalVariant> = {
  happy: {
    id: 'default_happy',
    name: 'Happy Rabbit',
    season: 'spring',
    themes: ['general', 'positive'],
    emotions: ['happy', 'cheerful'],
    date_range: { start_month: 1, start_day: 1, end_month: 12, end_day: 31 },
    asset_path: '/assets/заяц -Общие- 01-x1.png',
    description: 'Standard happy rabbit'
  },
  neutral: {
    id: 'default_neutral',
    name: 'Neutral Rabbit',
    season: 'spring',
    themes: ['general', 'professional'],
    emotions: ['neutral', 'professional'],
    date_range: { start_month: 1, start_day: 1, end_month: 12, end_day: 31 },
    asset_path: '/assets/заяц -Общие- 05-x1.png',
    description: 'Standard neutral rabbit'
  },
  general: {
    id: 'default_general',
    name: 'General Rabbit',
    season: 'spring',
    themes: ['general', 'versatile'],
    emotions: ['friendly', 'approachable'],
    date_range: { start_month: 1, start_day: 1, end_month: 12, end_day: 31 },
    asset_path: '/assets/заяц -Общие- 02-x1.png',
    description: 'Standard general purpose rabbit'
  }
};

/**
 * Seasonal Component System Parameters
 */
interface SeasonalComponentParams {
  action: 'select_seasonal' | 'get_variants' | 'analyze_season' | 'preview_seasonal';
  component_type: 'rabbit' | 'icon' | 'button';
  seasonal_context?: SeasonalContext | null;
  preferred_emotion?: string | null;
  override_variant?: string | null;
  fallback_strategy?: 'strict_seasonal' | 'flexible' | 'always_fallback' | null;
}

/**
 * Main Seasonal Component System Tool
 */
export async function seasonalComponentSystem(params: SeasonalComponentParams): Promise<ToolResult> {
  try {
    console.log(`🎭 Seasonal Component System: ${params.action} - ${params.component_type}`);

    switch (params.action) {
      case 'select_seasonal':
        return selectSeasonalVariant(params);
      
      case 'get_variants':
        return getAvailableVariants(params);
      
      case 'analyze_season':
        return analyzeCurrentSeason(params.seasonal_context);
      
      case 'preview_seasonal':
        return previewSeasonalVariants(params);
      
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }

  } catch (error) {
    return handleToolError('seasonal_component_system', error);
  }
}

/**
 * Select optimal seasonal variant based on context
 */
function selectSeasonalVariant(params: SeasonalComponentParams): ToolResult {
  const context = params.seasonal_context || {
    current_date: new Date(),
    region: 'GLOBAL'
  };

  // Find matching seasonal variants
  const matchingVariants = findMatchingVariants(context);
  
  // Score and rank variants
  const scoredVariants = scoreVariants(matchingVariants, context, params.preferred_emotion);
  
  // Select best variant
  const selectedVariant = scoredVariants[0];
  
  if (!selectedVariant && params.fallback_strategy !== 'strict_seasonal') {
    // Fallback to default variants
    const fallbackEmotion = params.preferred_emotion || 'happy';
    const fallbackVariant = DEFAULT_VARIANTS[fallbackEmotion] || DEFAULT_VARIANTS.general;
    
    return {
      success: true,
      data: {
        selected_variant: fallbackVariant,
        confidence_score: 0.3,
        reasoning: ['No seasonal match found', 'Using fallback variant'],
        fallback_used: true,
        seasonal_context: context
      },
      metadata: {
        action: 'select_seasonal',
        fallback_applied: true
      }
    };
  }

  if (!selectedVariant) {
    throw new Error('No suitable seasonal variant found and fallback disabled');
  }

  const selection: SeasonalSelection = {
    selected_variant: selectedVariant.variant,
    confidence_score: selectedVariant.score,
    reasoning: selectedVariant.reasoning,
    fallback_variants: scoredVariants.slice(1, 4).map(v => v.variant),
    seasonal_context: context
  };

  return {
    success: true,
    data: selection,
    metadata: {
      action: 'select_seasonal',
      total_candidates: matchingVariants.length,
      selection_method: 'seasonal_algorithm'
    }
  };
}

/**
 * Find variants matching current seasonal context
 */
function findMatchingVariants(context: SeasonalContext): SeasonalVariant[] {
  const currentDate = context.current_date;
  const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const day = currentDate.getDate();

  return SEASONAL_RABBIT_VARIANTS.filter(variant => {
    return isDateInRange(month, day, variant.date_range);
  });
}

/**
 * Check if current date falls within variant's date range
 */
function isDateInRange(month: number, day: number, range: SeasonalVariant['date_range']): boolean {
  const currentDate = month * 100 + day; // MMDD format
  const startDate = range.start_month * 100 + range.start_day;
  let endDate = range.end_month * 100 + range.end_day;

  // Handle year-crossing ranges (e.g., Dec 15 - Jan 15)
  if (endDate < startDate) {
    return currentDate >= startDate || currentDate <= endDate;
  }

  return currentDate >= startDate && currentDate <= endDate;
}

/**
 * Score and rank variants based on context and preferences
 */
function scoreVariants(
  variants: SeasonalVariant[], 
  context: SeasonalContext, 
  preferredEmotion?: string
): Array<{ variant: SeasonalVariant; score: number; reasoning: string[] }> {
  
  return variants.map(variant => {
    let score = 0.5; // Base score
    const reasoning: string[] = [];

    // Seasonal match bonus
    score += 0.3;
    reasoning.push(`Seasonal match for ${variant.season}`);

    // Emotion preference match
    if (preferredEmotion && variant.emotions.includes(preferredEmotion)) {
      score += 0.2;
      reasoning.push(`Emotion match: ${preferredEmotion}`);
    }

    // Content tone alignment
    if (context.email_content_tone) {
      const toneMatch = getToneAlignment(context.email_content_tone, variant.themes);
      score += toneMatch * 0.15;
      if (toneMatch > 0) {
        reasoning.push(`Content tone alignment: ${context.email_content_tone}`);
      }
    }

    // Regional holiday bonus
    if (variant.regional_holidays && context.region !== 'GLOBAL') {
      score += 0.1;
      reasoning.push(`Regional holiday relevance`);
    }

    // Target audience alignment
    if (context.target_audience) {
      const audienceMatch = getAudienceAlignment(context.target_audience, variant.themes);
      score += audienceMatch * 0.1;
      if (audienceMatch > 0) {
        reasoning.push(`Target audience alignment: ${context.target_audience}`);
      }
    }

    return { variant, score: Math.min(score, 1.0), reasoning };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Calculate tone alignment score
 */
function getToneAlignment(tone: string, themes: string[]): number {
  const toneThemeMap: Record<string, string[]> = {
    festive: ['christmas', 'new_year', 'holidays', 'celebration', 'easter', 'halloween'],
    professional: ['general', 'neutral', 'business'],
    casual: ['playful', 'fun', 'relaxed', 'beach', 'ice_cream'],
    promotional: ['travel', 'vacation', 'adventure', 'excitement']
  };

  const relevantThemes = toneThemeMap[tone] || [];
  const matchCount = themes.filter(theme => relevantThemes.includes(theme)).length;
  
  return matchCount / Math.max(themes.length, 1);
}

/**
 * Calculate audience alignment score
 */
function getAudienceAlignment(audience: string, themes: string[]): number {
  const audienceThemeMap: Record<string, string[]> = {
    family: ['christmas', 'easter', 'thanksgiving', 'harvest', 'snow', 'flowers'],
    business: ['professional', 'general', 'neutral'],
    young_adults: ['travel', 'adventure', 'beach', 'halloween', 'ice_cream'],
    general: ['happy', 'cheerful', 'positive', 'friendly']
  };

  const relevantThemes = audienceThemeMap[audience] || [];
  const matchCount = themes.filter(theme => relevantThemes.includes(theme)).length;
  
  return matchCount / Math.max(themes.length, 1);
}

/**
 * Get all available seasonal variants
 */
function getAvailableVariants(params: SeasonalComponentParams): ToolResult {
  const context = params.seasonal_context || {
    current_date: new Date(),
    region: 'GLOBAL'
  };

  const currentVariants = findMatchingVariants(context);
  const allVariants = SEASONAL_RABBIT_VARIANTS;

  return {
    success: true,
    data: {
      current_seasonal: currentVariants,
      all_variants: allVariants,
      default_variants: Object.values(DEFAULT_VARIANTS),
      variant_count: {
        total: allVariants.length,
        current_seasonal: currentVariants.length,
        winter: allVariants.filter(v => v.season === 'winter').length,
        spring: allVariants.filter(v => v.season === 'spring').length,
        summer: allVariants.filter(v => v.season === 'summer').length,
        autumn: allVariants.filter(v => v.season === 'autumn').length
      }
    },
    metadata: {
      action: 'get_variants',
      context_date: context.current_date.toISOString(),
      region: context.region
    }
  };
}

/**
 * Analyze current seasonal context
 */
function analyzeCurrentSeason(context?: SeasonalContext): ToolResult {
  const currentContext = context || {
    current_date: new Date(),
    region: 'GLOBAL'
  };

  const currentDate = currentContext.current_date;
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();

  // Determine current season
  let currentSeason: string;
  if (month >= 12 || month <= 2) {
    currentSeason = 'winter';
  } else if (month >= 3 && month <= 5) {
    currentSeason = 'spring';
  } else if (month >= 6 && month <= 8) {
    currentSeason = 'summer';
  } else {
    currentSeason = 'autumn';
  }

  // Find active variants
  const activeVariants = findMatchingVariants(currentContext);
  
  // Check for special occasions
  const specialOccasions = activeVariants.filter(v => v.regional_holidays && v.regional_holidays.length > 0);

  return {
    success: true,
    data: {
      current_season: currentSeason,
      current_date: currentDate.toISOString().split('T')[0],
      active_variants: activeVariants.length,
      special_occasions: specialOccasions.map(v => ({
        name: v.name,
        holidays: v.regional_holidays,
        themes: v.themes
      })),
      seasonal_recommendations: {
        primary_emotion: getSuggestedEmotion(currentSeason),
        suggested_themes: getSuggestedThemes(currentSeason),
        optimal_variants: activeVariants.slice(0, 3).map(v => v.id)
      }
    },
    metadata: {
      action: 'analyze_season',
      analysis_date: new Date().toISOString()
    }
  };
}

/**
 * Get suggested emotion for current season
 */
function getSuggestedEmotion(season: string): string {
  const seasonEmotionMap: Record<string, string> = {
    winter: 'cozy',
    spring: 'fresh',
    summer: 'relaxed',
    autumn: 'peaceful'
  };

  return seasonEmotionMap[season] || 'happy';
}

/**
 * Get suggested themes for current season
 */
function getSuggestedThemes(season: string): string[] {
  const seasonThemeMap: Record<string, string[]> = {
    winter: ['snow', 'warmth', 'holidays', 'cozy'],
    spring: ['flowers', 'growth', 'renewal', 'fresh'],
    summer: ['beach', 'vacation', 'sun', 'relaxation'],
    autumn: ['leaves', 'harvest', 'golden', 'contemplative']
  };

  return seasonThemeMap[season] || ['general', 'positive'];
}

/**
 * Preview seasonal variants with sample renderings
 */
function previewSeasonalVariants(params: SeasonalComponentParams): ToolResult {
  const context = params.seasonal_context || {
    current_date: new Date(),
    region: 'GLOBAL'
  };

  const currentVariants = findMatchingVariants(context);
  const previews = currentVariants.slice(0, 6).map(variant => ({
    variant_id: variant.id,
    name: variant.name,
    description: variant.description,
    themes: variant.themes,
    emotions: variant.emotions,
    asset_path: variant.asset_path,
    sample_html: generateSampleHTML(variant),
    preview_url: `/preview/seasonal/${variant.id}`
  }));

  return {
    success: true,
    data: {
      previews,
      total_available: currentVariants.length,
      seasonal_context: context,
      preview_generated: new Date().toISOString()
    },
    metadata: {
      action: 'preview_seasonal',
      preview_count: previews.length
    }
  };
}

/**
 * Generate sample HTML for variant preview
 */
function generateSampleHTML(variant: SeasonalVariant): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="text-align: center; padding: 10px;">
          <img 
            src="${variant.asset_path}" 
            alt="${variant.description}"
            style="display: block; margin: 0 auto; width: 120px; height: 120px;"
            width="120"
            height="120"
          />
          <div style="margin-top: 8px; font-family: Arial, sans-serif; font-size: 12px; color: #666;">
            ${variant.name}
          </div>
        </td>
      </tr>
    </table>
  `;
} 