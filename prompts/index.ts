/**
 * Email-Makers Prompts Index
 * Centralized access to all prompt files
 */

import path from 'path';

const PROMPTS_ROOT = path.join(process.cwd(), 'prompts');

export const PROMPT_PATHS = {
  // Specialists
  SPECIALISTS: {
    CONTENT: path.join(PROMPTS_ROOT, 'specialists', 'content-specialist.md'),
    DATA_COLLECTION: path.join(PROMPTS_ROOT, 'specialists', 'data-collection-specialist.md'),
    DESIGN: path.join(PROMPTS_ROOT, 'specialists', 'design-specialist.md'),
    QUALITY: path.join(PROMPTS_ROOT, 'specialists', 'quality-specialist.md'),
    DELIVERY: path.join(PROMPTS_ROOT, 'specialists', 'delivery-specialist.md'),
  },
  
  // Orchestrator
  ORCHESTRATOR: {
    MAIN: path.join(PROMPTS_ROOT, 'orchestrator', 'main-orchestrator.md'),
  },
  
  // Figma
  FIGMA: {
    ASSETS_GUIDE: path.join(PROMPTS_ROOT, 'figma', 'figma-assets-guide.md'),
    ASSETS_GUIDE_OPTIMIZED: path.join(PROMPTS_ROOT, 'figma', 'figma-assets-guide-optimized.md'),
    LOCAL_INSTRUCTIONS: path.join(PROMPTS_ROOT, 'figma', 'figma-local-instructions.md'),
  },
  
  // Content
  CONTENT: {
    MAIN: path.join(PROMPTS_ROOT, 'content', 'content.md'),
  },
  
  // Workflow
  WORKFLOW: {
    UNIVERSAL_INSTRUCTIONS: path.join(PROMPTS_ROOT, 'workflow', 'universal-workflow-instructions.md'),
  },
} as const;

export const PROMPTS_DIRECTORIES = {
  ROOT: PROMPTS_ROOT,
  SPECIALISTS: path.join(PROMPTS_ROOT, 'specialists'),
  ORCHESTRATOR: path.join(PROMPTS_ROOT, 'orchestrator'),
  FIGMA: path.join(PROMPTS_ROOT, 'figma'),
  CONTENT: path.join(PROMPTS_ROOT, 'content'),
  WORKFLOW: path.join(PROMPTS_ROOT, 'workflow'),
} as const;

/**
 * Helper function to get prompt content
 */
export async function getPromptContent(promptPath: string): Promise<string> {
  const fs = await import('fs/promises');
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt from ${promptPath}: ${error}`);
  }
}

/**
 * Helper function to check if prompt file exists
 */
export async function promptExists(promptPath: string): Promise<boolean> {
  const fs = await import('fs/promises');
  try {
    await fs.access(promptPath);
    return true;
  } catch {
    return false;
  }
} 