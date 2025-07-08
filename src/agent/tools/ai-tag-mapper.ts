/**
 * 🤖 AI TAG MAPPER
 * 
 * Intelligent mapping of English/concept tags to Russian Figma tags
 * Uses ai-optimized-tags.json and AI to find the best matching tags
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Agent, run } from '@openai/agents';
import { getUsageModel } from '../../shared/utils/model-config';

interface FigmaTagsData {
  ai_instructions: {
    purpose: string;
    usage: string;
    search_strategy: string;
    folder_priority: Record<string, string>;
  };
  summary: {
    total_folders: number;
    total_files: number;
    total_unique_tags: number;
    created_at: string;
  };
  most_common_tags: Record<string, number>;
  folders: Record<string, {
    description: string;
    files_count: number;
    unique_tags_count: number;
    tags: string[];
    top_tags: string[];
  }>;
  all_tags: string[];
  search_recommendations: Record<string, {
    primary_folders: string[];
    recommended_tags: string[];
  }>;
  tag_categories: Record<string, string[]>;
}

interface TagMappingRequest {
  inputTags: string[];
  campaignType: 'seasonal' | 'promotional' | 'informational';
  emotionalTone: 'positive' | 'neutral' | 'urgent' | 'friendly';
  contentContext?: string;
}

interface TagMappingResult {
  success: boolean;
  mappedTags: string[];
  selectedFolders: string[];
  mappingReasoning: string;
  confidence: number;
  error?: string;
}

export class AITagMapper {
  private tagsData: FigmaTagsData | null = null;
  private agent: Agent | null = null;

  constructor() {
    // Using rule-based mapping only - no AI agent needed
  }

  private async initializeAgent() {
    try {
      this.agent = new Agent({
        name: 'AI Tag Mapper',
        model: getUsageModel(),
        tools: [],
        instructions: `Ты эксперт по маппингу тегов для поиска изображений в Figma ассетах.

Твоя задача - анализировать входящие теги (часто на английском) и находить наиболее подходящие русские теги из доступных в Figma коллекции.

ПРИНЦИПЫ МАППИНГА:
1. Концептуальное соответствие важнее прямого перевода
2. Учитывай эмоциональный тон и тип кампании  
3. Выбирай 3-5 наиболее релевантных тегов
4. Приоритизируй папки по важности
5. Всегда включай теги персонажа (заяц/кролик) для брендинга

ПАПКИ ПО ПРИОРИТЕТУ:
1. зайцы-общие - основные персонажи
2. зайцы-эмоции - эмоциональные состояния  
3. иллюстрации - концептуальные изображения
4. зайцы-новости - информационный контент
5. логотипы-ак - авиакомпании
6. иконки-допуслуг - сервисные элементы

ПРИМЕРЫ МАППИНГА:
- "Japan spring travel" → ["путешествия", "весна", "заяц", "авиация"]
- "promotion urgent sale" → ["акция", "скидки", "заяц", "срочно"]
- "happy mascot hero" → ["заяц", "веселый", "позитив", "герой"]

Отвечай только JSON с выбранными тегами и обоснованием.`
      });
    } catch (error) {
      console.error('❌ Failed to initialize AI Tag Mapper agent:', error);
    }
  }

  /**
   * Load Figma tags data from JSON file
   */
  private async loadTagsData(): Promise<void> {
    if (this.tagsData) return; // Already loaded

    try {
      const tagsPath = path.join(process.cwd(), 'figma-all-pages-1750993353363', 'ai-optimized-tags.json');
      const tagsContent = await fs.readFile(tagsPath, 'utf-8');
      this.tagsData = JSON.parse(tagsContent);
      console.log(`✅ Loaded ${this.tagsData.summary.total_unique_tags} Figma tags from ${this.tagsData.summary.total_folders} folders`);
    } catch (error) {
      console.error('❌ Failed to load Figma tags data:', error);
      throw new Error('AI Tag Mapper: Cannot load Figma tags data');
    }
  }

  /**
   * Map input tags to Russian Figma tags using AI
   */
  async mapTags(request: TagMappingRequest): Promise<TagMappingResult> {
    try {
      await this.loadTagsData();
      
      if (!this.tagsData) {
        throw new Error('AI Tag Mapper: Tags data not loaded');
      }

      console.log(`🤖 AI Tag Mapper: Mapping tags [${request.inputTags.join(', ')}] for ${request.campaignType} campaign`);

      // Use simple rule-based mapping first, then enhance with AI if available
      const ruleMappedTags = this.performRuleBasedMapping(request);
      
      let finalTags = ruleMappedTags;
      let reasoning = 'Rule-based mapping with predefined patterns';

             // Using only rule-based mapping for performance and reliability
      
      // Validate and enhance results
      const validatedTags = this.validateTags(finalTags);
      const selectedFolders = this.identifyFolders(validatedTags);
      
      const result: TagMappingResult = {
        success: true,
        mappedTags: validatedTags,
        selectedFolders,
        mappingReasoning: reasoning,
        confidence: this.calculateConfidence(validatedTags, request)
      };

      console.log(`✅ AI Tag Mapper: Mapped to [${validatedTags.join(', ')}] from folders [${selectedFolders.join(', ')}]`);
      return result;

    } catch (error) {
      console.error('❌ AI Tag Mapper error:', error);
      throw new Error(`AI Tag Mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform rule-based mapping using predefined patterns
   */
  private performRuleBasedMapping(request: TagMappingRequest): string[] {
    const mappedTags: string[] = [];
    const inputTags = request.inputTags.map(tag => tag.toLowerCase());
    
    // Base character tags - always include for branding
    mappedTags.push('заяц', 'кролик');
    
    // Travel and aviation mapping
    if (inputTags.some(tag => ['travel', 'путешествия', 'japan', 'япония', 'trip', 'vacation'].includes(tag))) {
      mappedTags.push('путешествия', 'авиация', 'отдых');
    }
    
    // Seasonal mapping
    if (inputTags.some(tag => ['spring', 'весна', 'sakura', 'сакура'].includes(tag))) {
      mappedTags.push('весна', 'цветение', 'природа');
    }
    
    // Hero and mascot mapping
    if (inputTags.some(tag => ['hero', 'mascot', 'maskot', 'персонаж', 'герой'].includes(tag))) {
      mappedTags.push('персонаж', 'герой', 'главный');
    }
    
    // Icon and header mapping
    if (inputTags.some(tag => ['icon', 'header', 'logo', 'brand'].includes(tag))) {
      mappedTags.push('иконка', 'логотип', 'значок');
    }
    
    // Campaign type specific mapping
    if (request.campaignType === 'promotional') {
      mappedTags.push('акция', 'предложение');
    } else if (request.campaignType === 'seasonal') {
      mappedTags.push('сезон', 'праздник');
    }
    
    // Emotional tone mapping
    if (request.emotionalTone === 'friendly' || request.emotionalTone === 'positive') {
      mappedTags.push('веселый', 'дружелюбный', 'позитивный');
    }
    
    // Youth and target audience
    if (inputTags.some(tag => ['young', 'youth', 'молодежь', 'молодой'].includes(tag))) {
      mappedTags.push('молодежь', 'активный');
    }
    
    return [...new Set(mappedTags)]; // Remove duplicates
  }

  /**
   * Try AI-enhanced mapping (return empty if fails)
   */
  private async tryAIMapping(request: TagMappingRequest): Promise<string[]> {
    if (!this.agent) return [];
    
    try {
      const mappingPrompt = this.createMappingPrompt(request);
      const aiResult = await run(this.agent, mappingPrompt);
      
      if (!aiResult || !aiResult.content || aiResult.content.length === 0) {
        return [];
      }
      
      const aiResponse = aiResult.content[0];
      if (aiResponse.type !== 'text') {
        return [];
      }

      const mappingData = this.parseAIResponse(aiResponse.text);
      return mappingData.tags || [];
    } catch (error) {
      console.warn('AI mapping attempt failed:', error);
      return [];
    }
  }

  /**
   * Create detailed mapping prompt for AI
   */
  private createMappingPrompt(request: TagMappingRequest): string {
    const availableTags = this.tagsData!.all_tags.slice(0, 100); // Limit for prompt size
    const folderPriorities = this.tagsData!.ai_instructions.folder_priority;
    const searchRecommendations = this.tagsData!.search_recommendations;

    return `ЗАДАЧА: Найди наиболее подходящие русские теги для поиска изображений.

ВХОДНЫЕ ДАННЫЕ:
- Теги: ${request.inputTags.join(', ')}
- Тип кампании: ${request.campaignType}
- Эмоциональный тон: ${request.emotionalTone}
- Контекст: ${request.contentContext || 'Не указан'}

ДОСТУПНЫЕ ТЕГИ (выборка):
${availableTags.slice(0, 50).join(', ')}

ПАПКИ И ПРИОРИТЕТЫ:
${Object.entries(folderPriorities).map(([folder, desc]) => `- ${folder}: ${desc}`).join('\n')}

РЕКОМЕНДАЦИИ ПО ПОИСКУ:
${Object.entries(searchRecommendations).map(([type, rec]) => 
  `${type}: ${rec.recommended_tags.join(', ')}`
).join('\n')}

ТРЕБОВАНИЯ:
1. Выбери 3-5 наиболее релевантных тегов
2. Обязательно включи теги персонажа (заяц/кролик) 
3. Учитывай эмоциональный тон и тип кампании
4. Приоритизируй концептуальное соответствие

Ответь JSON:
{
  "tags": ["тег1", "тег2", "тег3"],
  "reasoning": "объяснение выбора"
}`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(aiText: string): { tags: string[]; reasoning?: string } {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          tags: parsed.tags || [],
          reasoning: parsed.reasoning
        };
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON:', error);
    }

    // Alternative: extract tags from text
    const tags = this.extractTagsFromText(aiText);
    return { tags };
  }

  /**
   * Extract tags from free text
   */
  private extractTagsFromText(text: string): string[] {
    const availableTags = this.tagsData!.all_tags;
    const foundTags: string[] = [];

    for (const tag of availableTags) {
      if (text.toLowerCase().includes(tag.toLowerCase())) {
        foundTags.push(tag);
      }
    }

    return foundTags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Validate that tags exist in Figma collection
   */
  private validateTags(tags: string[]): string[] {
    const availableTags = this.tagsData!.all_tags;
    return tags.filter(tag => availableTags.includes(tag));
  }

  /**
   * Identify which folders contain the selected tags
   */
  private identifyFolders(tags: string[]): string[] {
    const folders: string[] = [];
    
    for (const [folderName, folderData] of Object.entries(this.tagsData!.folders)) {
      const hasMatchingTag = tags.some(tag => folderData.tags.includes(tag));
      if (hasMatchingTag) {
        folders.push(folderName);
      }
    }

    return folders;
  }



  /**
   * Calculate confidence score for mapping
   */
  private calculateConfidence(mappedTags: string[], request: TagMappingRequest): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for more mapped tags
    confidence += Math.min(mappedTags.length * 0.1, 0.3);

    // Higher confidence for common tags
    const commonTags = this.tagsData!.most_common_tags;
    const commonTagsFound = mappedTags.filter(tag => commonTags[tag]);
    confidence += commonTagsFound.length * 0.1;

    // Higher confidence for brand tags (rabbit)
    const hasBrandTag = mappedTags.some(tag => ['заяц', 'кролик'].includes(tag));
    if (hasBrandTag) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  /**
   * Get recommended tags for specific campaign types
   */
  getRecommendedTags(campaignType: string): string[] {
    if (!this.tagsData) return [];
    
    const recommendations = this.tagsData.search_recommendations;
    const typeMapping: Record<string, string> = {
      'seasonal': 'travel_content',
      'promotional': 'promotional_content', 
      'informational': 'informational_content'
    };

    const recommendationType = typeMapping[campaignType] || 'travel_content';
    return recommendations[recommendationType]?.recommended_tags || [];
  }

  /**
   * Get all available tags
   */
  getAllTags(): string[] {
    return this.tagsData?.all_tags || [];
  }

  /**
   * Get folder information
   */
  getFolderInfo(): Record<string, any> {
    return this.tagsData?.folders || {};
  }
} 