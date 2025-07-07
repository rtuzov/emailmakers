/**
 * Specialist Agents Module for Email Campaign Workflow
 * Defines all specialized agents for the multi-handoff email generation system
 * 
 * Features:
 * - Dynamic prompt loading from markdown files
 * - Feedback loop integration
 * - Enhanced specialist instructions
 * - Handoff coordination
 */

import { Agent } from '@openai/agents';
import { PromptManager } from '../core/prompt-manager';
import { toolRegistry } from '../core/tool-registry';

export async function createSpecialistAgents() {
  const promptManager = PromptManager.getInstance();
  
  // Загружаем промпты
  const contentPrompt = promptManager.getSpecialistPrompt('content');
  const designPrompt = promptManager.getSpecialistPrompt('design');
  const qualityPrompt = promptManager.getSpecialistPrompt('quality');
  const deliveryPrompt = promptManager.getSpecialistPrompt('delivery');

  // Получаем инструменты из Tool Registry для каждого типа агента
  const deliveryTools = toolRegistry.getToolsForAgent('delivery');
  const qualityTools = toolRegistry.getToolsForAgent('quality');
  const designTools = toolRegistry.getToolsForAgent('design');
  const contentTools = toolRegistry.getToolsForAgent('content');

  console.log('🔧 Loading tools from Tool Registry:', {
    delivery_tools: deliveryTools.length,
    quality_tools: qualityTools.length,
    design_tools: designTools.length,
    content_tools: contentTools.length
  });

  // Создаем агентов в правильном порядке (от конца к началу цепочки)
  const deliverySpecialist = new Agent({
    name: 'Delivery Specialist',
    instructions: deliveryPrompt,
    handoffDescription: 'Финализирует email кампанию, сохраняет файлы и создает итоговую отчетность',
    tools: deliveryTools,
    handoffs: [] // Последний в цепочке
  });

  const qualitySpecialist = new Agent({
    name: 'Quality Specialist', 
    instructions: qualityPrompt,
    handoffDescription: 'Проверяет качество email шаблонов, совместимость с клиентами и отправляет на доработку при необходимости',
    tools: qualityTools,
    handoffs: [deliverySpecialist] // Может передавать только Delivery Specialist
  });

  const designSpecialist = new Agent({
    name: 'Design Specialist',
    instructions: designPrompt,
    handoffDescription: 'Создает красивые, адаптивные HTML email шаблоны с логотипом Kupibilet и фирменными цветами',
    tools: designTools,
    handoffs: [qualitySpecialist] // Может передавать только Quality Specialist
  });

  const contentSpecialist = new Agent({
    name: 'Content Specialist',
    instructions: contentPrompt,
    handoffDescription: 'Создает качественный email контент на русском языке с реальными ценами и актуальной информацией',
    tools: contentTools,
    handoffs: [designSpecialist] // Может передавать только Design Specialist
  });

  // Добавляем возможность возврата для Quality Specialist
  qualitySpecialist.handoffs.push(contentSpecialist, designSpecialist);

  return {
    contentSpecialist,
    designSpecialist,
    qualitySpecialist,
    deliverySpecialist
  };
}

export async function createEmailCampaignOrchestrator() {
  const specialists = await createSpecialistAgents();
  
  // Главный оркестратор начинает с Content Specialist
  const orchestrator = new Agent({
    name: 'Email Campaign Orchestrator',
    instructions: `Ты - главный оркестратор email кампаний для авиакомпании Kupibilet. 
Твоя задача - анализировать запросы пользователей и передавать их соответствующему специалисту.

Всегда начинай с Content Specialist для создания новых email кампаний.
Используй transfer_to_content_specialist для начала работы над кампанией.`,
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