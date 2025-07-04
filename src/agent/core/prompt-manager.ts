/**
 * Prompt Manager - Dynamic prompt loading and management system
 * Loads prompts from markdown files and provides them to agents
 */

import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'src', 'agent', 'prompts', 'specialists');

export interface PromptConfig {
  role: string;
  instructions: string;
  examples?: string[];
  requirements?: string[];
  reminders?: string[];
}

/**
 * PromptManager class for loading and managing agent prompts
 */
export class PromptManager {
  private static instance: PromptManager;
  private promptCache: Map<string, string> = new Map();
  private promptsPath: string;

  constructor() {
    this.promptsPath = path.join(process.cwd(), 'src/agent/prompts');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Load prompt from markdown file
   */
  loadPrompt(promptPath: string): string {
    // Check cache first
    if (this.promptCache.has(promptPath)) {
      return this.promptCache.get(promptPath)!;
    }

    try {
      const fullPath = path.join(this.promptsPath, promptPath);
      const promptContent = fs.readFileSync(fullPath, 'utf-8');
      
      // Cache the prompt
      this.promptCache.set(promptPath, promptContent);
      
      console.log(`📋 PromptManager: Loaded prompt from ${promptPath}`);
      return promptContent;
    } catch (error) {
      console.error(`❌ PromptManager: Failed to load prompt from ${promptPath}:`, error);
      return this.getDefaultPrompt(promptPath);
    }
  }

  /**
   * Get prompt for specific specialist
   */
  getSpecialistPrompt(specialistName: string): string {
    const promptPath = `specialists/${specialistName.toLowerCase()}-specialist.md`;
    return this.loadPrompt(promptPath);
  }

  /**
   * Get orchestrator prompt
   */
  getOrchestratorPrompt(): string {
    return this.loadPrompt('orchestrator/main-orchestrator.md');
  }

  /**
   * Get feedback template
   */
  getFeedbackTemplate(feedbackType: string): string {
    return this.loadPrompt(`feedback/${feedbackType}-feedback.md`);
  }

  /**
   * Parse prompt markdown into structured config
   */
  parsePromptConfig(promptContent: string): PromptConfig {
    const lines = promptContent.split('\n');
    let role = '';
    let instructions = '';
    let currentSection = '';
    const examples: string[] = [];
    const requirements: string[] = [];
    const reminders: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## Роль')) {
        currentSection = 'role';
        continue;
      } else if (line.startsWith('## Инструкции')) {
        currentSection = 'instructions';
        continue;
      } else if (line.startsWith('## Примеры')) {
        currentSection = 'examples';
        continue;
      } else if (line.startsWith('## Требования')) {
        currentSection = 'requirements';
        continue;
      } else if (line.startsWith('## Важные напоминания')) {
        currentSection = 'reminders';
        continue;
      }

      // Process content based on current section
      if (currentSection === 'role' && line.trim() && !line.startsWith('#')) {
        role += line + '\n';
      } else if (currentSection === 'instructions' && line.trim() && !line.startsWith('#')) {
        instructions += line + '\n';
      } else if (currentSection === 'examples' && line.trim().startsWith('- ')) {
        examples.push(line.substring(2));
      } else if (currentSection === 'requirements' && line.trim().startsWith('- ✅')) {
        requirements.push(line.substring(4));
      } else if (currentSection === 'reminders' && line.trim().startsWith('- **')) {
        reminders.push(line.substring(2));
      }
    }

    return {
      role: role.trim(),
      instructions: instructions.trim(),
      examples,
      requirements,
      reminders
    };
  }

  /**
   * Get enhanced instructions for agent with full prompt context
   */
  getEnhancedInstructions(specialistName: string): string {
    const promptContent = this.getSpecialistPrompt(specialistName);
    const config = this.parsePromptConfig(promptContent);
    
    // Combine role and instructions for comprehensive agent instructions
    return `${config.role}\n\n${config.instructions}`;
  }

  /**
   * Clear prompt cache (useful for development)
   */
  clearCache(): void {
    this.promptCache.clear();
    console.log('🔄 PromptManager: Cache cleared');
  }

  /**
   * Get default prompt for fallback
   */
  private getDefaultPrompt(promptPath: string): string {
    const specialistName = promptPath.split('/')[1]?.replace('-specialist.md', '') || 'agent';
    
    return `Ты - ${specialistName} специалист для Kupibilet. 
    
Выполняй свои задачи профессионально и передавай управление следующему агенту после завершения работы.

ВАЖНО: Файл промпта ${promptPath} не найден. Используется базовый промпт.`;
  }

  /**
   * Preload all specialist prompts
   */
  preloadSpecialistPrompts(): void {
    const specialists = ['content', 'design', 'quality', 'delivery'];
    
    for (const specialist of specialists) {
      try {
        this.getSpecialistPrompt(specialist);
        console.log(`✅ PromptManager: Preloaded ${specialist} specialist prompt`);
      } catch (error) {
        console.warn(`⚠️ PromptManager: Failed to preload ${specialist} specialist prompt`);
      }
    }
  }

  /**
   * Get prompt statistics
   */
  getStats(): { cachedPrompts: number; promptPaths: string[] } {
    return {
      cachedPrompts: this.promptCache.size,
      promptPaths: Array.from(this.promptCache.keys())
    };
  }
}

/**
 * Global prompt manager instance
 */
export const promptManager = PromptManager.getInstance();

/**
 * Convenience functions for quick access
 */
export const getSpecialistPrompt = (specialistName: string) => 
  promptManager.getSpecialistPrompt(specialistName);

export const getEnhancedInstructions = (specialistName: string) => 
  promptManager.getEnhancedInstructions(specialistName);

export const getFeedbackTemplate = (feedbackType: string) => 
  promptManager.getFeedbackTemplate(feedbackType); 