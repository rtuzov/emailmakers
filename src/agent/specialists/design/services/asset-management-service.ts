/**
 * 🎨 ASSET MANAGEMENT SERVICE
 * 
 * Handles asset finding, tag selection, and external image search
 * for the Design Specialist Agent V2
 */

import { AssetManager, AssetSearchParams, AssetSearchResult, StandardAsset } from '../../../core/asset-manager';
import { ExtractedContentPackage } from '../../content/utils/content-extractor';
import {
  DesignSpecialistInputV2,
  AssetRequirements,
  TagSelectionContext,
  TagSelectionResult,
  ExternalImageResult,
  ExternalImage,
  ServiceExecutionResult,
  ContentAnalysis
} from '../types/design-types';
import { ImagePlan, ImagePlanItem } from '../../../tools/image-planning';

export class AssetManagementService {
  private assetManager: AssetManager;
  private tagsCache: Map<string, any> = new Map();
  
  constructor() {
    this.assetManager = new AssetManager();
  }

  /**
   * Execute asset finding with enhanced tag selection
   */
  async executeAssetFinding(
    input: DesignSpecialistInputV2,
    content: ExtractedContentPackage | null
  ): Promise<ServiceExecutionResult<AssetSearchResult>> {
    const startTime = Date.now();
    
    try {
      if (!content) {
        throw new Error('Content is required for asset finding');
      }

      // Step 1: Select optimal tags
      const tagSelection = await this.selectOptimalTags(content, input.asset_requirements);
      
      // Step 2: Search Figma assets
      const searchParams: AssetSearchParams = {
        tags: tagSelection.selected_tags,
        emotional_tone: input.asset_requirements?.emotional_tone || 'neutral',
        campaign_type: input.asset_requirements?.campaign_type || 'informational',
        target_count: input.asset_requirements?.target_count || 10
      };
      
      const figmaAssets = await this.assetManager.searchAssets(searchParams);
      
      // Step 3: Search external images if needed
      let externalImages: ExternalImageResult | null = null;
      if (input.asset_requirements?.image_requirements?.internet_images_count && input.asset_requirements.image_requirements.internet_images_count > 0) {
        const imagePlan = await this.planEmailImages(content, null);
        externalImages = await this.searchExternalImages(imagePlan);
      }
      
      // Step 4: Combine results
      const combinedResults = this.combineAssetResults(figmaAssets, externalImages);
      
      // Step 5: Проверяем, что хотя бы какие-то ассеты найдены
      if (combinedResults.assets.length === 0) {
        console.log('⚠️ AssetManagementService: No assets found, but continuing with empty result');
        combinedResults.search_metadata.recommendations.push(
          'No assets found for the specified topic - consider using more general themes or check asset availability'
        );
      }
      
      return {
        success: true,
        data: combinedResults,
        execution_time_ms: Date.now() - startTime,
        confidence_score: this.calculateAssetConfidence(combinedResults),
        operations_performed: 3
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Asset finding failed',
        execution_time_ms: Date.now() - startTime,
        confidence_score: 0,
        operations_performed: 0
      };
    }
  }

  /**
   * Select optimal tags using AI and context analysis
   */
  private async selectOptimalTags(
    content: ExtractedContentPackage,
    assetRequirements?: AssetRequirements
  ): Promise<TagSelectionResult> {
    try {
      // Analyze content context
      const contentAnalysis = this.analyzeContentContext(content);
      
      // Extract keywords from content
      const keywords = this.extractKeywordsFromContent(content);
      
      // Load tags data
      const tagsData = await this.loadTagsData();
      
      // Create selection context
      const context: TagSelectionContext = {
        keywords,
        campaign_context: contentAnalysis,
        content_theme: contentAnalysis.theme,
        target_audience: contentAnalysis.target_audience,
        seasonal_context: contentAnalysis.seasonal_context,
        geographic_context: contentAnalysis.geographic_context,
        max_tags: assetRequirements?.target_count || 10
      };
      
      // Try AI-based tag selection first
      try {
        const aiTags = await this.runTagSelectionAI(context, tagsData);
        return {
          selected_tags: aiTags,
          confidence_score: 0.9,
          selection_method: 'ai',
          reasoning: 'AI-based tag selection using content analysis'
        };
      } catch (aiError) {
        console.error('❌ AI-based tag selection failed:', aiError);
        throw aiError instanceof Error ? aiError : new Error(String(aiError));
      }
      
    } catch (error) {
      console.error('❌ Tag selection failed:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Analyze content context for tag selection
   */
  private analyzeContentContext(content: ExtractedContentPackage): ContentAnalysis {
    return {
      theme: this.determineContentTheme(content),
      target_audience: this.determineTargetAudience(content),
      seasonal_context: this.determineSeasonalContext(content),
      geographic_context: this.determineGeographicContext(content),
      content_length: this.calculateContentLength(content),
      campaign_type: this.determineCampaignTypeFromContent(content),
      emotional_requirements: this.determineEmotionalRequirements(content),
      brand_requirements: this.determineBrandRequirements(content),
      technical_constraints: this.determineTechnicalConstraints()
    };
  }

  /**
   * Extract keywords from content
   */
  private extractKeywordsFromContent(content: ExtractedContentPackage): string[] {
    const keywords: string[] = [];
    
    // Extract from title
    if (content.title) {
      keywords.push(...content.title.toLowerCase().split(/\s+/));
    }
    
    // Extract from description
    if (content.description) {
      keywords.push(...content.description.toLowerCase().split(/\s+/));
    }
    
    // Extract from brief text
    if (content.brief_text) {
      keywords.push(...content.brief_text.toLowerCase().split(/\s+/));
    }
    
    // Filter and clean keywords
    return keywords
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'end', 'few', 'got', 'let', 'own', 'say', 'she', 'too', 'use'].includes(word))
      .slice(0, 20);
  }

  /**
   * Load tags data with caching
   */
  private async loadTagsData(): Promise<any> {
    const cacheKey = 'tags_data';
    
    if (this.tagsCache.has(cacheKey)) {
      return this.tagsCache.get(cacheKey);
    }
    
    try {
      // In a real implementation, this would load from a database or API
      const tagsData = {
        categories: ['travel', 'business', 'lifestyle', 'technology', 'food', 'health'],
        seasonal: ['spring', 'summer', 'autumn', 'winter', 'holiday'],
        emotional: ['happy', 'excited', 'calm', 'energetic', 'professional'],
        geographic: ['urban', 'rural', 'coastal', 'mountain', 'international']
      };
      
      this.tagsCache.set(cacheKey, tagsData);
      return tagsData;
    } catch (error) {
      console.error('❌ Failed to load tags data.');
      throw error;
    }
  }

  /**
   * Run AI-based tag selection
   */
  private async runTagSelectionAI(
    context: TagSelectionContext,
    tagsData: any
  ): Promise<string[]> {
    // Simplified AI simulation - in real implementation would use actual AI
    const availableTags = [
      ...tagsData.categories,
      ...tagsData.seasonal,
      ...tagsData.emotional,
      ...tagsData.geographic
    ];
    
    // Select tags based on keywords and context
    const selectedTags = availableTags
      .filter(tag => context.keywords.some(keyword => keyword.includes(tag.toLowerCase())))
      .slice(0, context.max_tags);
    
    if (selectedTags.length === 0) {
      throw new Error('No relevant tags found');
    }
    
    return selectedTags;
  }

  /**
   * Select tags by context analysis
   */
  /*
  private _selectTagsByContext(
    context: TagSelectionContext,
    _tagsData: any
  ): string[] {
    const contextualTags = [
      ...this.getContextualTags(context.campaign_context),
      ...context.keywords.slice(0, 5)
    ];
    
    return contextualTags.slice(0, context.max_tags);
  }
  */

  /**
   * Get contextual tags based on campaign context
   */
  /*
  private getContextualTags(campaignContext: any): string[] {
    const tags: string[] = [];
    
    if (campaignContext.theme) {
      tags.push(campaignContext.theme);
    }
    
    if (campaignContext.target_audience) {
      tags.push(campaignContext.target_audience);
    }
    
    if (campaignContext.seasonal_context) {
      tags.push(campaignContext.seasonal_context);
    }
    
    return tags;
  }
  */

  /**
   * Get fallback tags
   */
  /*
  private __getFallbackTags(_: ExtractedContentPackage): never { // Currently unused - disabled fallback
    throw new Error('getFallbackTags is disabled by project policy.');
  }
  */

  /**
   * Plan email images based on content and template
   */
  private async planEmailImages(
    content: ExtractedContentPackage,
    templateDesign: any
  ): Promise<ImagePlan> {
    const imageContext = this.analyzeImageContext(content, templateDesign);
    
    try {
      // Try AI-based image planning
      return await this.runImagePlanningAI(imageContext);
    } catch (error) {
      // Alternative: context-based planning
      return this.planImagesByContext(imageContext);
    }
  }

  /**
   * Analyze image context
   */
  private analyzeImageContext(content: ExtractedContentPackage, _templateDesign: any): any {
    return {
      content_type: this.determineCampaignTypeFromContent(content),
      content_length: this.calculateContentLength(content),
      emotional_tone: this.determineEmotionalRequirements(content),
      brand_requirements: this.determineBrandRequirements(content),
      technical_constraints: this.determineTechnicalConstraints(),
      target_audience: this.determineTargetAudience(content),
      seasonal_context: this.determineSeasonalContext(content)
    };
  }

  /**
   * Run AI-based image planning
   */
  private async runImagePlanningAI(imageContext: any): Promise<ImagePlan> {
    // Simplified AI simulation
    const totalImages = Math.min(imageContext.content_length === 'long' ? 5 : 3, 6);
    
    const imagePlan: ImagePlanItem[] = Array.from({ length: totalImages }, (_, index) => ({
      position: index + 1,
      type: index === 0 ? 'hero' : 'illustration',
      content_description: `Image ${index + 1} for ${imageContext.content_type}`,
      size_priority: index === 0 ? 'large' : 'medium',
      emotional_tone: imageContext.emotional_tone[0] || 'neutral',
      search_tags: [imageContext.content_type, imageContext.seasonal_context],
      fallback_options: ['general', 'abstract']
    }));
    
    return {
      total_images_needed: totalImages,
      image_plan: imagePlan,
      figma_assets_needed: Math.ceil(totalImages / 2),
      layout_optimization: {
        mobile_friendly: true,
        load_time_optimized: true,
        accessibility_compliant: true
      }
    };
  }

  /**
   * Plan images by context
   */
  private planImagesByContext(_imageContext: any): ImagePlan {
    const totalImages = 2; // Conservative fallback
    
    const imagePlan: ImagePlanItem[] = Array.from({ length: totalImages }, (_, index) => ({
      position: index + 1,
      type: index === 0 ? 'hero' : 'illustration',
      content_description: `Contextual image ${index + 1}`,
      size_priority: 'medium',
      emotional_tone: 'neutral',
      search_tags: ['general', 'email'],
      fallback_options: ['abstract', 'geometric']
    }));
    
    return {
      total_images_needed: totalImages,
      image_plan: imagePlan,
      figma_assets_needed: Math.ceil(totalImages / 2),
      layout_optimization: {
        mobile_friendly: true,
        load_time_optimized: true,
        accessibility_compliant: true
      }
    };
  }

  /**
   * Search external images
   */
  private async searchExternalImages(imagePlan: ImagePlan): Promise<ExternalImageResult> {
    const images: ExternalImage[] = [];
    const searchQueries: string[] = [];
    
    for (const planItem of imagePlan.image_plan) {
      const query = planItem.search_tags.join(' ');
      searchQueries.push(query);
      
      // Simulate external image search
      const mockImage: ExternalImage = {
        url: `https://example.com/image-${planItem.position}.jpg`,
        title: `${planItem.type} image`,
        description: planItem.content_description,
        tags: planItem.search_tags,
        size: { width: 800, height: 600 },
        format: 'jpg',
        quality_score: 0.8
      };
      
      images.push(mockImage);
    }
    
    return {
      images,
      total_found: images.length,
      search_queries_used: searchQueries,
      confidence_score: 0.7
    };
  }

  /**
   * Combine asset results
   */
  private combineAssetResults(
    figmaAssets: AssetSearchResult,
    externalImages: ExternalImageResult | null
  ): AssetSearchResult {
    const combinedAssets: StandardAsset[] = [...figmaAssets.assets];
    
    if (externalImages) {
      const externalAssets: StandardAsset[] = externalImages.images.map(img => ({
        fileName: img.title,
        filePath: img.url,
        tags: img.tags,
        description: img.description,
        emotion: 'neutral',
        category: 'image',
        relevanceScore: img.quality_score / 100,
        source: 'internet' as const
      }));
      
      combinedAssets.push(...externalAssets);
    }
    
    return {
      success: true,
      assets: combinedAssets,
      total_found: combinedAssets.length,
      ...(figmaAssets.search_query ? { search_query: figmaAssets.search_query } : {}),
      confidence_score: Math.min(
        figmaAssets.confidence_score || 1,
        externalImages?.confidence_score || 1
      ),
      search_metadata: {
        query_tags: [],
        search_time_ms: 0,
        recommendations: [],
        figma_tags_used: []
      }
    } as any; // Cast to any for exactOptionalPropertyTypes compatibility
  }

  /**
   * Calculate asset confidence score
   */
  private calculateAssetConfidence(assetResult: AssetSearchResult): number {
    if (assetResult.assets.length === 0) return 0;
    
    const baseScore = Math.min(assetResult.assets.length / 10, 1);
    const qualityScore = assetResult.confidence_score || 0;
    
    return (baseScore + qualityScore) / 2;
  }

  // Content analysis helper methods
  private determineContentTheme(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    
    if (text.includes('travel') || text.includes('vacation')) return 'travel';
    if (text.includes('business') || text.includes('professional')) return 'business';
    if (text.includes('health') || text.includes('wellness')) return 'health';
    if (text.includes('technology') || text.includes('tech')) return 'technology';
    if (text.includes('food') || text.includes('restaurant')) return 'food';
    
    return 'general';
  }

  private determineTargetAudience(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    
    if (text.includes('young') || text.includes('student')) return 'youth';
    if (text.includes('professional') || text.includes('business')) return 'professionals';
    if (text.includes('family') || text.includes('parent')) return 'families';
    if (text.includes('senior') || text.includes('elderly')) return 'seniors';
    
    return 'general';
  }

  private determineSeasonalContext(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    const now = new Date();
    const month = now.getMonth();
    
    if (text.includes('spring') || (month >= 2 && month <= 4)) return 'spring';
    if (text.includes('summer') || (month >= 5 && month <= 7)) return 'summer';
    if (text.includes('autumn') || text.includes('fall') || (month >= 8 && month <= 10)) return 'autumn';
    if (text.includes('winter') || text.includes('holiday') || (month >= 11 || month <= 1)) return 'winter';
    
    return 'general';
  }

  private determineGeographicContext(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    
    if (text.includes('city') || text.includes('urban')) return 'urban';
    if (text.includes('rural') || text.includes('countryside')) return 'rural';
    if (text.includes('beach') || text.includes('coastal')) return 'coastal';
    if (text.includes('mountain') || text.includes('hiking')) return 'mountain';
    if (text.includes('international') || text.includes('global')) return 'international';
    
    return 'general';
  }

  private calculateContentLength(content: ExtractedContentPackage): 'short' | 'medium' | 'long' {
    const totalLength = (content.title?.length || 0) + (content.description?.length || 0) + (content.brief_text?.length || 0);
    
    if (totalLength < 200) return 'short';
    if (totalLength < 500) return 'medium';
    return 'long';
  }

  private determineCampaignTypeFromContent(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    
    if (text.includes('sale') || text.includes('discount') || text.includes('offer')) return 'promotional';
    if (text.includes('news') || text.includes('update') || text.includes('announcement')) return 'informational';
    if (text.includes('season') || text.includes('holiday')) return 'seasonal';
    if (text.includes('welcome') || text.includes('thank')) return 'transactional';
    
    return 'informational';
  }

  private determineEmotionalRequirements(content: ExtractedContentPackage): string[] {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    const emotions: string[] = [];
    
    if (text.includes('excited') || text.includes('amazing') || text.includes('great')) emotions.push('excited');
    if (text.includes('calm') || text.includes('peaceful') || text.includes('relaxing')) emotions.push('calm');
    if (text.includes('professional') || text.includes('business')) emotions.push('professional');
    if (text.includes('urgent') || text.includes('important') || text.includes('act now')) emotions.push('urgent');
    if (text.includes('happy') || text.includes('joy') || text.includes('celebrate')) emotions.push('happy');
    
    return emotions.length > 0 ? emotions : ['neutral'];
  }

  private determineBrandRequirements(content: ExtractedContentPackage): any {
    return {
      brand_character: this.detectBrandCharacter(content),
      color_preferences: ['blue', 'white', 'gray'],
      style_preferences: ['modern', 'clean', 'professional'],
      tone_of_voice: 'professional'
    };
  }

  private detectBrandCharacter(content: ExtractedContentPackage): string {
    const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();
    
    if (text.includes('fun') || text.includes('playful')) return 'playful';
    if (text.includes('professional') || text.includes('business')) return 'professional';
    if (text.includes('luxury') || text.includes('premium')) return 'luxury';
    if (text.includes('friendly') || text.includes('casual')) return 'friendly';
    
    return 'professional';
  }

  private determineTechnicalConstraints(): any {
    return {
      max_width: '600px',
      max_file_size_kb: 100,
      supported_email_clients: ['gmail', 'outlook', 'apple_mail'],
      responsive_required: true,
      dark_mode_required: false
    };
  }
} 