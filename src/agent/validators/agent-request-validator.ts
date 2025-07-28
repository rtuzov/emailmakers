/**
 * Agent Request Validator
 * Validates incoming agent requests to ensure proper format and required fields
 */

import { z } from 'zod';

// Define the schema for agent requests
const AgentRequestSchema = z.object({
  task_type: z.enum([
    'generate_content',
    'analyze_brief',
    'analyze_multi_destination',
    'create_design',
    'extract_figma_assets',
    'render_template',
    'validate_html',
    'upload_assets',
    'deploy_template'
  ]).describe('Type of task to perform'),
  
  input: z.union([
    z.string().min(1).describe('Text input'),
    z.object({}).passthrough().describe('Structured input object')
  ]).describe('Input data for the agent'),
  
  context: z.object({}).passthrough().nullable().optional().describe('Additional context for the task'),
  
  threadId: z.string().nullable().optional().describe('Thread ID for conversation continuity'),
  
  metadata: z.object({
    traceId: z.string().nullable().optional(),
    parentTraceId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
    sessionId: z.string().nullable().nullable().optional()
  }).nullable().optional().describe('Request metadata')
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: AgentRequest;
}

/**
 * Validate agent request
 */
export async function validateAgentRequest(request: any): Promise<ValidationResult> {
  try {
    const validatedData = AgentRequestSchema.parse(request);
    
    return {
      isValid: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      return {
        isValid: false,
        errors
      };
    }
    
    return {
      isValid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate specific task type input
 */
export function validateTaskInput(taskType: string, input: any): ValidationResult {
  switch (taskType) {
    case 'generate_content':
      return validateContentGenerationInput(input);
    case 'analyze_brief':
      return validateBriefAnalysisInput(input);
    case 'analyze_multi_destination':
      return validateMultiDestinationInput(input);
    case 'create_design':
      return validateDesignCreationInput(input);
    case 'extract_figma_assets':
      return validateFigmaExtractionInput(input);
    case 'render_template':
      return validateTemplateRenderingInput(input);
    case 'validate_html':
      return validateHtmlValidationInput(input);
    case 'upload_assets':
      return validateAssetUploadInput(input);
    case 'deploy_template':
      return validateTemplateDeploymentInput(input);
    default:
      return {
        isValid: false,
        errors: [`Unknown task type: ${taskType}`]
      };
  }
}

function validateContentGenerationInput(input: any): ValidationResult {
  const schema = z.object({
    brief: z.string().min(10).describe('Content brief'),
    tone: z.string().nullable().optional().describe('Content tone'),
    target_audience: z.string().nullable().optional().describe('Target audience'),
    brand_guidelines: z.object({}).passthrough().nullable().optional().describe('Brand guidelines')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid content generation input'] };
  }
}

function validateBriefAnalysisInput(input: any): ValidationResult {
  const schema = z.object({
    brief: z.string().min(5).describe('Brief to analyze'),
    analysis_type: z.enum(['basic', 'detailed', 'strategic']).nullable().optional().describe('Analysis depth')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid brief analysis input'] };
  }
}

function validateMultiDestinationInput(input: any): ValidationResult {
  const schema = z.object({
    destinations: z.array(z.string()).min(2).describe('List of destinations'),
    campaign_type: z.enum(['vacation', 'business', 'adventure']).nullable().optional().describe('Campaign type'),
    budget_range: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().nullable().optional()
    }).nullable().optional().describe('Budget range')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid multi-destination input'] };
  }
}

function validateDesignCreationInput(input: any): ValidationResult {
  const schema = z.object({
    design_brief: z.string().min(10).describe('Design brief'),
    layout_type: z.enum(['compact', 'grid', 'carousel']).nullable().optional().describe('Layout type'),
    color_scheme: z.string().nullable().optional().describe('Color scheme preference')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid design creation input'] };
  }
}

function validateFigmaExtractionInput(input: any): ValidationResult {
  const schema = z.object({
    figma_url: z.string().url().describe('Figma URL'),
    extraction_type: z.enum(['tokens', 'assets', 'components']).nullable().optional().describe('What to extract')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid Figma extraction input'] };
  }
}

function validateTemplateRenderingInput(input: any): ValidationResult {
  const schema = z.object({
    template_data: z.object({}).passthrough().describe('Template data'),
    template_type: z.enum(['mjml', 'html']).nullable().optional().describe('Template type')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid template rendering input'] };
  }
}

function validateHtmlValidationInput(input: any): ValidationResult {
  const schema = z.object({
    html_content: z.string().min(1).describe('HTML content to validate'),
    validation_rules: z.array(z.string()).nullable().optional().describe('Specific validation rules')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid HTML validation input'] };
  }
}

function validateAssetUploadInput(input: any): ValidationResult {
  const schema = z.object({
    assets: z.array(z.object({
      name: z.string(),
      type: z.string(),
      size: z.number().nullable().optional(),
      url: z.string().url().nullable().nullable().optional()
    })).min(1).describe('Assets to upload')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid asset upload input'] };
  }
}

function validateTemplateDeploymentInput(input: any): ValidationResult {
  const schema = z.object({
    template_id: z.string().min(1).describe('Template ID'),
    deployment_target: z.enum(['staging', 'production']).describe('Deployment target'),
    configuration: z.object({}).passthrough().nullable().optional().describe('Deployment configuration')
  });
  
  try {
    schema.parse(input);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Invalid template deployment input'] };
  }
}

const AgentValidator = {
  validateAgentRequest,
  validateTaskInput,
  AgentRequestSchema
};

export default AgentValidator; 