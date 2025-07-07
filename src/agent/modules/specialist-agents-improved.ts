/**
 * IMPROVED Specialist Agents Module with Type-Safe Handoffs
 * Uses Agent.create() for proper type inference across handoffs
 * Based on OpenAI Agents SDK v2 best practices
 */

import { Agent } from '@openai/agents';
import { PromptManager } from '../core/prompt-manager';
import { toolRegistry } from '../core/tool-registry';

export async function createSpecialistAgentsImproved() {
  const promptManager = PromptManager.getInstance();
  
  // Load prompts
  const contentPrompt = promptManager.getSpecialistPrompt('content');
  const designPrompt = promptManager.getSpecialistPrompt('design');
  const qualityPrompt = promptManager.getSpecialistPrompt('quality');
  const deliveryPrompt = promptManager.getSpecialistPrompt('delivery');

  // Get tools from Tool Registry
  const deliveryTools = toolRegistry.getToolsForAgent('delivery');
  const qualityTools = toolRegistry.getToolsForAgent('quality');
  const designTools = toolRegistry.getToolsForAgent('design');
  const contentTools = toolRegistry.getToolsForAgent('content');

  console.log('🔧 Loading tools from Tool Registry (Type-Safe Version):', {
    delivery_tools: deliveryTools.length,
    quality_tools: qualityTools.length,
    design_tools: designTools.length,
    content_tools: contentTools.length
  });

  // Create agents in correct order using Agent.create() for type safety
  const deliverySpecialist = new Agent({
    name: 'Delivery Specialist',
    instructions: deliveryPrompt,
    handoffDescription: 'Финализирует email кампанию, сохраняет файлы и создает итоговую отчетность',
    tools: deliveryTools,
    // Last in chain - no handoffs
  });

  const qualitySpecialist = new Agent({
    name: 'Quality Specialist', 
    instructions: qualityPrompt,
    handoffDescription: 'Проверяет качество email шаблонов, совместимость с клиентами и отправляет на доработку при необходимости',
    tools: qualityTools,
    handoffs: [deliverySpecialist]
  });

  const designSpecialist = new Agent({
    name: 'Design Specialist',
    instructions: designPrompt,
    handoffDescription: 'Создает красивые, адаптивные HTML email шаблоны с логотипом Kupibilet и фирменными цветами',
    tools: designTools,
    handoffs: [qualitySpecialist]
  });

  const contentSpecialist = new Agent({
    name: 'Content Specialist',
    instructions: contentPrompt,
    handoffDescription: 'Создает качественный email контент на русском языке с реальными ценами и актуальной информацией',
    tools: contentTools,
    handoffs: [designSpecialist]
  });

  return {
    contentSpecialist,
    designSpecialist,
    qualitySpecialist,
    deliverySpecialist
  };
}

export async function createEmailCampaignOrchestratorImproved() {
  const specialists = await createSpecialistAgentsImproved();
  
  // Create orchestrator with proper handoffs
  const orchestrator = new Agent({
    name: 'Email Campaign Orchestrator',
    instructions: `Ты - главный оркестратор email кампаний для авиакомпании Kupibilet. 
Твоя задача - анализировать запросы пользователей и передавать их соответствующему специалисту.

Всегда начинай с Content Specialist для создания новых email кампаний.
Используй transfer_to_Content_Specialist для начала работы над кампанией.

ВАЖНО: После передачи управления специалисту, ЗАВЕРШАЙ свою работу. Не продолжай выполнение.`,
    handoffDescription: 'Управляет процессом создания email кампаний, координирует работу всех специалистов',
    handoffs: [
      specialists.contentSpecialist,
      specialists.designSpecialist,
      specialists.qualitySpecialist,
      specialists.deliverySpecialist
    ]
  });

  return {
    orchestrator,
    ...specialists
  };
} 