/**
 * 🔍 CONTEXT VALIDATION TOOL
 * 
 * Инструмент для валидации контекста при передаче между специалистами
 * в системе Email-Makers. Обеспечивает целостность данных и корректность
 * workflow переходов.
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Схема валидации для передачи от Data Collection к Content
 */
const DataCollectionToContentValidationSchema = z.object({
  destination_analysis: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Destination analysis must be a non-empty object'
  }),
  market_intelligence: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Market intelligence must be a non-empty object'
  }),
  emotional_profile: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Emotional profile must be a non-empty object'
  }),
  trend_analysis: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Trend analysis must be a non-empty object'
  }),
  consolidated_insights: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Consolidated insights must be a non-empty object'
  })
});

/**
 * Схема валидации для передачи от Content к Design
 */
const ContentToDesignValidationSchema = z.object({
  context_analysis: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Context analysis must be a non-empty object'
  }),
  date_analysis: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Date analysis must be a non-empty object'
  }),
  pricing_analysis: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Pricing analysis must be a non-empty object'
  }),
  asset_strategy: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Asset strategy must be a non-empty object'
  }),
  generated_content: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Generated content must be a non-empty object'
  }),
  design_brief: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Design brief must be a non-empty object'
  })
});

/**
 * Схема валидации для передачи от Design к Quality
 */
const DesignToQualityValidationSchema = z.object({
  mjml_template: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'MJML template must be a non-empty object'
  }),
  asset_manifest: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Asset manifest must be a non-empty object'
  }),
  design_decisions: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Design decisions must be a non-empty object'
  }),
  performance_metrics: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Performance metrics must be a non-empty object'
  }),
  template_specifications: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Template specifications must be a non-empty object'
  })
});

/**
 * Схема валидации для передачи от Quality к Delivery
 */
const QualityToDeliveryValidationSchema = z.object({
  quality_report: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Quality report must be a non-empty object'
  }),
  validation_results: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Validation results must be a non-empty object'
  }),
  client_compatibility: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Client compatibility must be a non-empty object'
  }),
  accessibility_results: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Accessibility results must be a non-empty object'
  }),
  compliance_status: z.object({}).refine(val => val && typeof val === 'object', {
    message: 'Compliance status must be a non-empty object'
  })
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Валидация качества данных
 */
function validateDataQuality(qualityMetadata: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Проверка базовых метрик качества
  if (!qualityMetadata.data_quality_score || qualityMetadata.data_quality_score < 0 || qualityMetadata.data_quality_score > 100) {
    errors.push('Data quality score must be between 0 and 100');
  } else if (qualityMetadata.data_quality_score < 70) {
    warnings.push('Data quality score is below 70, consider improving data quality');
  }

  if (!qualityMetadata.completeness_score || qualityMetadata.completeness_score < 0 || qualityMetadata.completeness_score > 100) {
    errors.push('Completeness score must be between 0 and 100');
  } else if (qualityMetadata.completeness_score < 80) {
    warnings.push('Completeness score is below 80, some data may be missing');
  }

  if (!qualityMetadata.validation_status || !['passed', 'warning', 'failed'].includes(qualityMetadata.validation_status)) {
    errors.push('Validation status must be one of: passed, warning, failed');
  } else if (qualityMetadata.validation_status === 'failed') {
    errors.push('Validation status is failed, cannot proceed with handoff');
  }

  if (qualityMetadata.error_count > 0) {
    if (qualityMetadata.error_count > 5) {
      errors.push(`Too many errors (${qualityMetadata.error_count}), must be resolved before handoff`);
    } else {
      warnings.push(`Found ${qualityMetadata.error_count} errors, consider resolving before handoff`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Валидация файлов и ресурсов
 */
async function validateFilesAndResources(
  campaignPath: string,
  expectedFiles: string[],
  expectedDirectories: string[]
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Проверка существования базовой директории кампании
    await fs.access(campaignPath);
  } catch (error) {
    errors.push(`Campaign directory does not exist: ${campaignPath}`);
    return { isValid: false, errors, warnings };
  }

  // Проверка обязательных директорий
  for (const dir of expectedDirectories) {
    const dirPath = path.join(campaignPath, dir);
    try {
      await fs.access(dirPath);
    } catch (error) {
      errors.push(`Required directory missing: ${dir}`);
    }
  }

  // Проверка обязательных файлов
  for (const file of expectedFiles) {
    const filePath = path.join(campaignPath, file);
    try {
      await fs.access(filePath);
      
      // Проверка что файл не пустой
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        warnings.push(`File is empty: ${file}`);
      }
    } catch (error) {
      errors.push(`Required file missing: ${file}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Валидация workflow статуса
 */
function validateWorkflowStatus(
  fromSpecialist: string,
  toSpecialist: string,
  workflowStatus: any
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const expectedWorkflow = ['data-collection', 'content', 'design', 'quality', 'delivery'];
  const fromIndex = expectedWorkflow.indexOf(fromSpecialist);
  const toIndex = expectedWorkflow.indexOf(toSpecialist);

  // Проверка корректности последовательности
  if (fromIndex === -1) {
    errors.push(`Unknown source specialist: ${fromSpecialist}`);
  }
  if (toIndex === -1) {
    errors.push(`Unknown target specialist: ${toSpecialist}`);
  }
  if (fromIndex !== -1 && toIndex !== -1 && toIndex !== fromIndex + 1) {
    errors.push(`Invalid workflow transition: ${fromSpecialist} -> ${toSpecialist}`);
  }

  // Проверка что предыдущие специалисты завершили работу
  if (workflowStatus?.completed_specialists) {
    const completed = workflowStatus.completed_specialists;
    for (let i = 0; i < fromIndex; i++) {
      const specialist = expectedWorkflow[i];
      if (!completed.includes(specialist)) {
        errors.push(`Specialist ${specialist} has not completed work yet`);
      }
    }
  }

  // Проверка процента завершения
  if (workflowStatus?.completion_percentage !== undefined) {
    const expectedPercentage = ((fromIndex + 1) / expectedWorkflow.length) * 100;
    if (Math.abs(workflowStatus.completion_percentage - expectedPercentage) > 5) {
      warnings.push(`Completion percentage (${workflowStatus.completion_percentage}%) does not match expected (${expectedPercentage}%)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// MAIN VALIDATION TOOL
// ============================================================================

/**
 * Основной инструмент валидации контекста при передаче между специалистами
 */
export const validateHandoffContext = tool({
  name: 'validate_handoff_context',
  description: 'Валидирует контекст и данные при передаче между специалистами в системе Email-Makers',
  parameters: z.object({
    from_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Специалист-отправитель'),
    to_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Специалист-получатель'),
    campaign_path: z.string().describe('Путь к кампании'),
    specialist_data: z.object({}).describe('Данные от специалиста'),
    workflow_status: z.object({}).describe('Статус workflow'),
    quality_metadata: z.object({}).describe('Метаданные качества'),
    deliverables: z.object({
      created_files: z.array(z.object({
        file_name: z.string(),
        file_path: z.string(),
        file_type: z.string(),
        description: z.string()
      })),
      key_outputs: z.array(z.string())
    }).describe('Результаты работы'),
    trace_id: z.string().nullable().describe('ID трассировки')
  }),
  execute: async ({
    from_specialist,
    to_specialist,
    campaign_path,
    specialist_data,
    workflow_status,
    quality_metadata,
    deliverables,
    trace_id
  }) => {
    console.log(`\n🔍 === VALIDATING HANDOFF CONTEXT ===`);
    console.log(`📤 From: ${from_specialist}`);
    console.log(`📥 To: ${to_specialist}`);
    console.log(`🆔 Campaign Path: ${campaign_path}`);
    console.log(`🔍 Trace ID: ${trace_id || 'none'}`);

    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      validationDetails: {} as Record<string, any>
    };

    try {
      // 1. Валидация workflow статуса
      console.log('📊 Validating workflow status...');
      const workflowValidation = validateWorkflowStatus(from_specialist, to_specialist, workflow_status);
      validationResults.errors.push(...workflowValidation.errors);
      validationResults.warnings.push(...workflowValidation.warnings);
      validationResults.validationDetails.workflow = workflowValidation;

      // 2. Валидация качества данных
      console.log('📈 Validating data quality...');
      const qualityValidation = validateDataQuality(quality_metadata);
      validationResults.errors.push(...qualityValidation.errors);
      validationResults.warnings.push(...qualityValidation.warnings);
      validationResults.validationDetails.quality = qualityValidation;

      // 3. Валидация специфических данных в зависимости от типа передачи
      console.log('🔄 Validating specialist-specific data...');
      
      switch (`${from_specialist}-to-${to_specialist}`) {
        case 'data-collection-to-content':
          try {
            DataCollectionToContentValidationSchema.parse(specialist_data);
            validationResults.validationDetails.specialist = { success: true, type: 'data-collection-to-content' };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            validationResults.errors.push(`Data collection to content validation failed: ${errorMessage}`);
          }
          break;

        case 'content-to-design':
          try {
            ContentToDesignValidationSchema.parse(specialist_data);
            validationResults.validationDetails.specialist = { success: true, type: 'content-to-design' };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            validationResults.errors.push(`Content to design validation failed: ${errorMessage}`);
          }
          break;

        case 'design-to-quality':
          try {
            DesignToQualityValidationSchema.parse(specialist_data);
            validationResults.validationDetails.specialist = { success: true, type: 'design-to-quality' };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            validationResults.errors.push(`Design to quality validation failed: ${errorMessage}`);
          }
          break;

        case 'quality-to-delivery':
          try {
            QualityToDeliveryValidationSchema.parse(specialist_data);
            validationResults.validationDetails.specialist = { success: true, type: 'quality-to-delivery' };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            validationResults.errors.push(`Quality to delivery validation failed: ${errorMessage}`);
          }
          break;

        default:
          validationResults.errors.push(`Unsupported handoff type: ${from_specialist} -> ${to_specialist}`);
      }

      // 4. Валидация файлов и ресурсов
      console.log('📁 Validating files and resources...');
      const expectedDirectories = ['data', 'handoffs', 'content', 'templates', 'assets', 'docs'];
      const expectedFiles = deliverables.created_files.map(f => f.file_path.replace(campaign_path, '').replace(/^\//, ''));
      
      const fileValidation = await validateFilesAndResources(campaign_path, expectedFiles, expectedDirectories);
      validationResults.errors.push(...fileValidation.errors);
      validationResults.warnings.push(...fileValidation.warnings);
      validationResults.validationDetails.files = fileValidation;

      // 5. Валидация deliverables
      console.log('📦 Validating deliverables...');
      if (!deliverables.created_files || deliverables.created_files.length === 0) {
        validationResults.errors.push('No created files found in deliverables');
      }
      if (!deliverables.key_outputs || deliverables.key_outputs.length === 0) {
        validationResults.warnings.push('No key outputs specified in deliverables');
      }

      // Определение итогового результата валидации
      validationResults.isValid = validationResults.errors.length === 0;

      // Логирование результатов
      if (validationResults.isValid) {
        console.log('✅ Handoff context validation passed');
        if (validationResults.warnings.length > 0) {
          console.log(`⚠️  Found ${validationResults.warnings.length} warnings`);
        }
      } else {
        console.log('❌ Handoff context validation failed');
        console.log(`❌ Errors: ${validationResults.errors.length}`);
        console.log(`⚠️  Warnings: ${validationResults.warnings.length}`);
      }

      // Формирование результата
      const result = {
        validation_status: validationResults.isValid ? 'passed' : 'failed',
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        error_count: validationResults.errors.length,
        warning_count: validationResults.warnings.length,
        validation_details: validationResults.validationDetails,
        timestamp: new Date().toISOString(),
        trace_id
      };

      return `🔍 Handoff context validation completed! From ${from_specialist} to ${to_specialist}. Status: ${result.validation_status}. Errors: ${result.error_count}. Warnings: ${result.warning_count}. Campaign: ${campaign_path}. Timestamp: ${result.timestamp}`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Validation error:', errorMessage);
      return `❌ Handoff context validation failed with error: ${errorMessage}. From ${from_specialist} to ${to_specialist}. Campaign: ${campaign_path}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Быстрая валидация handoff без полной проверки - прямая функция
 */
export const quickValidateHandoffDirect = async ({ 
  from_specialist, 
  to_specialist, 
  quality_metadata 
}: {
  from_specialist: string;
  to_specialist: string;
  specialist_data?: any;
  quality_metadata: any;
}) => {
  console.log(`🔍 Quick validation: ${from_specialist} -> ${to_specialist}`);

  try {
    // Валидация качества данных
    const qualityValidation = validateDataQuality(quality_metadata);
    
    // Валидация workflow последовательности
    const workflowValidation = validateWorkflowStatus(from_specialist, to_specialist, {});
    
    const isValid = qualityValidation.isValid && workflowValidation.isValid;
    const totalErrors = qualityValidation.errors.length + workflowValidation.errors.length;
    const totalWarnings = qualityValidation.warnings.length + workflowValidation.warnings.length;

    return `🔍 Quick handoff validation completed! From ${from_specialist} to ${to_specialist}. Status: ${isValid ? 'passed' : 'failed'}. Errors: ${totalErrors}. Warnings: ${totalWarnings}. Timestamp: ${new Date().toISOString()}`;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Quick validation error:', errorMessage);
    return `❌ Quick handoff validation failed: ${errorMessage}. From ${from_specialist} to ${to_specialist}. Timestamp: ${new Date().toISOString()}`;
  }
};

/**
 * Быстрая валидация handoff без полной проверки - tool версия
 */
export const quickValidateHandoff = tool({
  name: 'quick_validate_handoff',
  description: 'Быстрая валидация основных параметров handoff без полной проверки файлов',
  parameters: z.object({
    from_specialist: z.enum(['data-collection', 'content', 'design', 'quality', 'delivery']).describe('Специалист-отправитель'),
    to_specialist: z.enum(['content', 'design', 'quality', 'delivery']).describe('Специалист-получатель'),
    specialist_data: z.object({}).describe('Данные от специалиста'),
    quality_metadata: z.object({}).describe('Метаданные качества')
  }),
  execute: async ({ from_specialist, to_specialist, quality_metadata }) => {
    console.log(`🔍 Quick validation: ${from_specialist} -> ${to_specialist}`);

    try {
      // Валидация качества данных
      const qualityValidation = validateDataQuality(quality_metadata);
      
      // Валидация workflow последовательности
      const workflowValidation = validateWorkflowStatus(from_specialist, to_specialist, {});
      
      const isValid = qualityValidation.isValid && workflowValidation.isValid;
      const totalErrors = qualityValidation.errors.length + workflowValidation.errors.length;
      const totalWarnings = qualityValidation.warnings.length + workflowValidation.warnings.length;

      console.log(`${isValid ? '✅' : '❌'} Quick validation ${isValid ? 'passed' : 'failed'}`);
      
      return `🔍 Quick handoff validation completed! From ${from_specialist} to ${to_specialist}. Status: ${isValid ? 'passed' : 'failed'}. Errors: ${totalErrors}. Warnings: ${totalWarnings}. Timestamp: ${new Date().toISOString()}`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Quick validation error:', errorMessage);
      return `❌ Quick handoff validation failed: ${errorMessage}. From ${from_specialist} to ${to_specialist}. Timestamp: ${new Date().toISOString()}`;
    }
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export const contextValidationTools = [
  validateHandoffContext,
  quickValidateHandoff
];

export default contextValidationTools;