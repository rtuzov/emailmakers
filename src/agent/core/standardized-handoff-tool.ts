/**
 * 🔄 STANDARDIZED HANDOFF TOOL
 * 
 * Единый инструмент для создания стандартизированных handoff файлов
 * между всеми специалистами в Email-Makers системе.
 * 
 * Заменяет разрозненные createHandoffFile функции единым стандартом.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import * as path from 'path';
import { 
  createHandoffMetadata,
  validateHandoffData,
  serializeHandoffData
} from './handoff-schemas';

// ============================================================================
// STANDARDIZED HANDOFF SCHEMA
// ============================================================================

/**
 * Единая структура handoff файла для всех специалистов
 */
const StandardizedHandoffSchema = z.object({
  // Основная информация о handoff
  handoff_info: z.object({
    from_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Специалист-отправитель'),
    to_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Специалист-получатель'),
    handoff_id: z.string().describe('Уникальный ID передачи'),
    created_at: z.string().describe('Время создания ISO'),
    campaign_id: z.string().describe('ID кампании'),
    campaign_path: z.string().describe('Путь к кампании'),
    trace_id: z.string().nullable().describe('ID трассировки'),
    data_version: z.string().default('2.0').describe('Версия формата данных'),
    execution_time: z.number().nullable().describe('Время выполнения в мс')
  }).describe('Метаданные передачи'),

  // Контекст кампании
  campaign_context: z.object({
    campaign_id: z.string().describe('ID кампании'),
    campaign_name: z.string().optional().describe('Название кампании'),
    brand: z.string().optional().describe('Бренд'),
    type: z.enum(['promotional', 'transactional', 'newsletter', 'announcement']).optional().describe('Тип кампании'),
    target_audience: z.string().optional().describe('Целевая аудитория'),
    language: z.string().default('ru').describe('Язык кампании'),
    campaign_path: z.string().describe('Путь к файлам кампании'),
    status: z.enum(['active', 'draft', 'completed', 'archived']).default('active').describe('Статус кампании')
  }).describe('Контекст кампании'),

  // Данные от предыдущих специалистов
  specialist_outputs: z.object({
    data_collection: z.object({
          destination_analysis: z.object({}).nullable().describe('Анализ направления'),
    market_intelligence: z.object({}).nullable().describe('Маркетинговая аналитика'),
    emotional_profile: z.object({}).nullable().describe('Эмоциональный профиль'),
    trend_analysis: z.object({}).nullable().describe('Анализ трендов'),
    consolidated_insights: z.object({}).nullable().describe('Консолидированные инсайты'),
    travel_intelligence: z.object({}).nullable().describe('Туристическая аналитика'),
    collection_metadata: z.object({}).nullable().describe('Метаданные сбора')
    }).optional().describe('Выходы Data Collection Specialist'),

    content: z.object({
          context_analysis: z.object({}).nullable().describe('Анализ контекста'),
    date_analysis: z.object({}).nullable().describe('Анализ дат'),
    pricing_analysis: z.object({}).nullable().describe('Анализ цен'),
    asset_strategy: z.object({}).nullable().describe('Стратегия ассетов'),
    generated_content: z.object({}).nullable().describe('Сгенерированный контент'),
    technical_requirements: z.object({}).nullable().describe('Технические требования'),
    design_brief: z.object({}).nullable().describe('Дизайн-бриф')
    }).optional().describe('Выходы Content Specialist'),

    design: z.object({
          asset_manifest: z.object({}).nullable().describe('Манифест ассетов'),
    mjml_template: z.object({}).nullable().describe('MJML шаблон'),
    design_decisions: z.object({}).nullable().describe('Дизайн решения'),
    preview_files: z.array(z.object({})).optional().describe('Файлы предпросмотра'),
    performance_metrics: z.object({}).nullable().describe('Метрики производительности'),
    template_specifications: z.object({}).nullable().describe('Спецификации шаблона')
    }).optional().describe('Выходы Design Specialist'),

    quality: z.object({
          quality_report: z.object({}).nullable().describe('Отчёт о качестве'),
    test_artifacts: z.object({}).nullable().describe('Артефакты тестирования'),
    compliance_status: z.object({}).nullable().describe('Статус соответствия'),
    validation_results: z.object({}).nullable().describe('Результаты валидации'),
    client_compatibility: z.object({}).nullable().describe('Совместимость с клиентами'),
    accessibility_results: z.object({}).nullable().describe('Результаты доступности')
    }).optional().describe('Выходы Quality Specialist')
  }).describe('Выходы всех специалистов'),

  // Статус рабочего процесса
  workflow_status: z.object({
    completed_specialists: z.array(z.enum(['data-collection', 'content', 'design', 'quality', 'delivery'])).describe('Завершённые специалисты'),
    current_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Текущий специалист'),
    next_specialist: z.enum(['content', 'design', 'quality', 'delivery']).nullable().describe('Следующий специалист'),
    workflow_phase: z.enum(['data-collection', 'content-generation', 'design-creation', 'quality-assurance', 'delivery-preparation']).describe('Фаза процесса'),
    completion_percentage: z.number().min(0).max(100).describe('Процент завершения'),
    estimated_completion_time: z.string().nullable().describe('Оценочное время завершения')
  }).describe('Статус рабочего процесса'),

  // Файлы и ресурсы
  deliverables: z.object({
    created_files: z.array(z.object({
      file_name: z.string().describe('Имя файла'),
      file_path: z.string().describe('Путь к файлу'),
      file_type: z.enum(['data', 'content', 'template', 'asset', 'report', 'documentation']).describe('Тип файла'),
      file_size: z.number().optional().describe('Размер файла в байтах'),
      description: z.string().describe('Описание файла'),
      created_at: z.string().describe('Время создания'),
      is_primary: z.boolean().default(false).describe('Основной файл')
    })).describe('Созданные файлы'),
    
    output_directories: z.array(z.object({
      directory_name: z.string().describe('Имя директории'),
      directory_path: z.string().describe('Путь к директории'),
      content_type: z.enum(['data', 'content', 'assets', 'templates', 'reports', 'handoffs']).describe('Тип содержимого'),
      file_count: z.number().describe('Количество файлов'),
      total_size: z.number().optional().describe('Общий размер в байтах')
    })).describe('Выходные директории'),

    key_outputs: z.array(z.string()).describe('Ключевые выходы (список имён файлов)')
  }).describe('Поставляемые результаты'),

  // Рекомендации и инструкции
  handoff_data: z.object({
    summary: z.string().describe('Краткое описание выполненной работы'),
    context_for_next: z.string().describe('Контекст для следующего специалиста'),
    recommendations: z.array(z.string()).describe('Рекомендации для следующего специалиста'),
    priority_items: z.array(z.string()).describe('Приоритетные элементы для внимания'),
    potential_issues: z.array(z.string()).describe('Потенциальные проблемы для внимания'),
    validation_notes: z.array(z.string()).describe('Заметки по валидации'),
    success_criteria: z.array(z.string()).describe('Критерии успеха для следующего этапа')
  }).describe('Данные передачи'),

  // Метаданные качества
  quality_metadata: z.object({
    data_quality_score: z.number().min(0).max(100).describe('Оценка качества данных'),
    completeness_score: z.number().min(0).max(100).describe('Оценка полноты'),
    validation_status: z.enum(['passed', 'warning', 'failed']).describe('Статус валидации'),
    error_count: z.number().describe('Количество ошибок'),
    warning_count: z.number().describe('Количество предупреждений'),
    processing_time: z.number().describe('Время обработки в мс'),
    memory_usage: z.number().optional().describe('Использование памяти в байтах')
  }).describe('Метаданные качества')
});

type StandardizedHandoff = z.infer<typeof StandardizedHandoffSchema>;

// Context validation will be handled externally

// ============================================================================
// STANDARDIZED HANDOFF TOOL
// ============================================================================

/**
 * Единый инструмент для создания стандартизированных handoff файлов
 */
const createStandardizedHandoff = tool({
  name: 'createStandardizedHandoff',
  description: 'Создаёт стандартизированный handoff файл для передачи между специалистами с единым форматом данных и валидацией контекста',
  parameters: z.object({
    // Основные параметры
    from_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Специалист-отправитель'),
    to_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Специалист-получатель'),
    campaign_id: z.string().describe('ID кампании'),
    campaign_path: z.string().describe('Путь к кампании'),
    
    // Данные специалиста
    specialist_data: z.object({}).describe('Данные от текущего специалиста (структура зависит от специалиста)'),
    
    // Контекст handoff
    handoff_context: z.object({
      summary: z.string().describe('Краткое описание выполненной работы'),
      context_for_next: z.string().describe('Контекст для следующего специалиста'),
      recommendations: z.array(z.string()).describe('Рекомендации для следующего специалиста'),
      priority_items: z.array(z.string()).nullable().describe('Приоритетные элементы'),
      potential_issues: z.array(z.string()).nullable().describe('Потенциальные проблемы'),
      success_criteria: z.array(z.string()).nullable().describe('Критерии успеха')
    }).describe('Контекст передачи'),
    
    // Файлы и результаты
    deliverables: z.object({
      created_files: z.array(z.object({
        file_name: z.string().describe('Имя файла'),
        file_path: z.string().describe('Путь к файлу'),
        file_type: z.enum(['data', 'content', 'template', 'asset', 'report', 'documentation']).describe('Тип файла'),
        description: z.string().describe('Описание файла'),
        is_primary: z.boolean().default(false).describe('Основной файл')
      })).describe('Созданные файлы'),
      key_outputs: z.array(z.string()).describe('Ключевые выходы')
    }).describe('Поставляемые результаты'),
    
    // Метаданные качества
    quality_metadata: z.object({
      data_quality_score: z.number().min(0).max(100).describe('Оценка качества данных'),
      completeness_score: z.number().min(0).max(100).describe('Оценка полноты'),
      validation_status: z.enum(['passed', 'warning', 'failed']).describe('Статус валидации'),
      error_count: z.number().default(0).describe('Количество ошибок'),
      warning_count: z.number().default(0).describe('Количество предупреждений'),
      processing_time: z.number().describe('Время обработки в мс')
    }).describe('Метаданные качества'),
    
    // Дополнительные параметры
    trace_id: z.string().nullable().describe('ID трассировки'),
    execution_time: z.number().nullable().describe('Время выполнения в мс'),
    
    // Опциональная валидация контекста
    validate_context: z.boolean().default(true).describe('Выполнять валидацию контекста (по умолчанию true)')
  }),
  
  execute: async (params) => {
    console.log(`\n🔄 === CREATING STANDARDIZED HANDOFF ===`);
    console.log(`📤 From: ${params.from_specialist}`);
    console.log(`📥 To: ${params.to_specialist}`);
    console.log(`🆔 Campaign: ${params.campaign_id}`);
    console.log(`📁 Path: ${params.campaign_path}`);
    console.log(`🔍 Trace ID: ${params.trace_id || 'none'}`);
    console.log(`✅ Context Validation: ${params.validate_context ? 'enabled' : 'disabled'}`);
    
    try {
      // 1. Валидация контекста обрабатывается внешне перед вызовом этого инструмента
      if (params.validate_context) {
        console.log('🔍 Context validation is handled externally');
      }
      // Создаём метаданные handoff
      const handoffMetadata = createHandoffMetadata(
        params.from_specialist as any,
        params.to_specialist as any,
        params.trace_id || undefined
      );
      
      // Загружаем существующие данные от предыдущих специалистов
      const existingData = await loadExistingSpecialistData(params.campaign_path);
      
      // Добавляем данные текущего специалиста
      const updatedSpecialistOutputs = {
        ...existingData.specialist_outputs,
        [params.from_specialist.replace('-', '_')]: params.specialist_data
      };
      
      // Определяем статус workflow
      const completedSpecialists = [
        ...existingData.workflow_status?.completed_specialists || [],
        params.from_specialist
      ];
      
      const workflowPhaseMap = {
        'data-collection': 'data-collection',
        'content': 'content-generation',
        'design': 'design-creation',
        'quality': 'quality-assurance',
        'delivery': 'delivery-preparation'
      } as const;
      
      // Вычисляем процент завершения
      const totalSpecialists = 5; // data-collection, content, design, quality, delivery
      const completionPercentage = (completedSpecialists.length / totalSpecialists) * 100;
      
      // Создаём стандартизированный handoff объект
      const standardizedHandoff: StandardizedHandoff = {
        handoff_info: {
          from_specialist: params.from_specialist as any,
          to_specialist: params.to_specialist as any,
          handoff_id: handoffMetadata.handoffId,
          created_at: handoffMetadata.timestamp,
          campaign_id: params.campaign_id,
          campaign_path: params.campaign_path,
          trace_id: params.trace_id,
          data_version: '2.0',
          execution_time: params.execution_time
        },
        
        campaign_context: {
          campaign_id: params.campaign_id,
          campaign_path: params.campaign_path,
          language: 'ru',
          status: 'active'
        },
        
        specialist_outputs: updatedSpecialistOutputs,
        
        workflow_status: {
          completed_specialists: completedSpecialists as any,
          current_specialist: params.to_specialist as any,
          next_specialist: getNextSpecialist(params.to_specialist),
          workflow_phase: workflowPhaseMap[params.from_specialist],
          completion_percentage: completionPercentage,
          estimated_completion_time: null
        },
        
        deliverables: {
          created_files: params.deliverables.created_files.map(file => ({
            ...file,
            created_at: new Date().toISOString(),
            file_size: undefined
          })),
          output_directories: [], // Будет заполнено автоматически
          key_outputs: params.deliverables.key_outputs
        },
        
        handoff_data: {
          summary: params.handoff_context.summary,
          context_for_next: params.handoff_context.context_for_next,
          recommendations: params.handoff_context.recommendations,
          priority_items: params.handoff_context.priority_items || [],
          potential_issues: params.handoff_context.potential_issues || [],
          validation_notes: [],
          success_criteria: params.handoff_context.success_criteria || []
        },
        
        quality_metadata: params.quality_metadata
      };
      
      // Валидируем данные
      const validation = validateHandoffData(standardizedHandoff, StandardizedHandoffSchema);
      if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Unknown validation error'];
        console.error('❌ Handoff validation failed:', errors);
        throw new Error(`Handoff validation failed: ${errors.join(', ')}`);
      }
      
      // Сохраняем handoff файл
      await saveStandardizedHandoff(standardizedHandoff);
      
      // Обновляем метаданные кампании
      await updateCampaignMetadata(params.campaign_path, {
        last_handoff: {
          from: params.from_specialist,
          to: params.to_specialist,
          created_at: new Date().toISOString(),
          handoff_id: handoffMetadata.handoffId
        },
        workflow_status: {
          current_phase: workflowPhaseMap[params.from_specialist],
          completion_percentage: completionPercentage,
          last_updated: new Date().toISOString()
        }
      });
      
      console.log('✅ Standardized handoff created successfully');
      console.log(`📋 Handoff ID: ${handoffMetadata.handoffId}`);
      console.log(`📊 Completion: ${completionPercentage.toFixed(1)}%`);
      console.log(`📁 Files created: ${params.deliverables.created_files.length}`);
      
      return {
        success: true,
        handoff_id: handoffMetadata.handoffId,
        from_specialist: params.from_specialist,
        to_specialist: params.to_specialist,
        campaign_id: params.campaign_id,
        completion_percentage: completionPercentage,
        files_created: params.deliverables.created_files.length,
        data_quality_score: params.quality_metadata.data_quality_score,
        validation_status: params.quality_metadata.validation_status,
        handoff_file_path: path.join(params.campaign_path, 'handoffs', `${params.from_specialist}-to-${params.to_specialist}.json`),
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Failed to create standardized handoff:', error);
      throw error;
    }
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Загружает существующие данные от предыдущих специалистов
 */
async function loadExistingSpecialistData(campaignPath: string): Promise<{
  specialist_outputs: any;
  workflow_status: any;
}> {
  try {
    // Пытаемся загрузить последний handoff файл
    const handoffsDir = path.join(campaignPath, 'handoffs');
    const handoffFiles = await fs.readdir(handoffsDir).catch(() => []);
    
    if (handoffFiles.length === 0) {
      return {
        specialist_outputs: {},
        workflow_status: { completed_specialists: [] }
      };
    }
    
    // Находим последний handoff файл
    const latestHandoffFile = handoffFiles
      .filter(file => file.endsWith('.json'))
      .sort()
      .pop();
    
    if (!latestHandoffFile) {
      return {
        specialist_outputs: {},
        workflow_status: { completed_specialists: [] }
      };
    }
    
    const handoffPath = path.join(handoffsDir, latestHandoffFile);
    const handoffContent = await fs.readFile(handoffPath, 'utf-8');
    const handoffData = JSON.parse(handoffContent);
    
    // Возвращаем данные в стандартизированном формате
    return {
      specialist_outputs: handoffData.specialist_outputs || {},
      workflow_status: handoffData.workflow_status || { completed_specialists: [] }
    };
    
  } catch (error) {
    console.warn('⚠️ Failed to load existing specialist data:', error);
    return {
      specialist_outputs: {},
      workflow_status: { completed_specialists: [] }
    };
  }
}

/**
 * Определяет следующего специалиста в workflow
 */
function getNextSpecialist(currentSpecialist: string): 'content' | 'design' | 'quality' | 'delivery' | null {
  const workflow = ['content', 'design', 'quality', 'delivery'];
  const currentIndex = workflow.indexOf(currentSpecialist);
  
  if (currentIndex === -1 || currentIndex === workflow.length - 1) {
    return null;
  }
  
  return workflow[currentIndex + 1] as any;
}

/**
 * Сохраняет стандартизированный handoff файл
 */
async function saveStandardizedHandoff(handoff: StandardizedHandoff): Promise<void> {
  const handoffsDir = path.join(handoff.campaign_context.campaign_path, 'handoffs');
  
  // Создаём директорию, если она не существует
  await fs.mkdir(handoffsDir, { recursive: true });
  
  // Создаём имя файла
  const fileName = `${handoff.handoff_info.from_specialist}-to-${handoff.handoff_info.to_specialist}.json`;
  const filePath = path.join(handoffsDir, fileName);
  
  // Сохраняем файл
  const serializedData = serializeHandoffData(handoff);
  await fs.writeFile(filePath, serializedData);
  
  console.log(`📄 Handoff saved: ${fileName}`);
}

/**
 * Обновляет метаданные кампании
 */
async function updateCampaignMetadata(campaignPath: string, updates: any): Promise<void> {
  try {
    const metadataPath = path.join(campaignPath, 'campaign-metadata.json');
    
    // Читаем существующие метаданные
    let metadata = {};
    try {
      const existingMetadata = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existingMetadata);
    } catch {
      // Файл не существует, создаём новый
    }
    
    // Обновляем метаданные
    const updatedMetadata = {
      ...metadata,
      ...updates,
      last_updated: new Date().toISOString()
    };
    
    // Сохраняем обновлённые метаданные
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    console.log('📊 Campaign metadata updated');
    
  } catch (error) {
    console.warn('⚠️ Failed to update campaign metadata:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { createStandardizedHandoff, StandardizedHandoffSchema };
export type { StandardizedHandoff };