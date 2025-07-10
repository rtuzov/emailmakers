/**
 * 📋 TECHNICAL SPECIFICATION TOOLS - Index File
 * 
 * Centralizes all technical specification generation tools for easy import and management.
 * Provides comprehensive tools for generating, validating, and managing technical specifications
 * for email campaigns within the OpenAI Agents SDK framework.
 */

export {
  generateTechnicalSpecification,
  validateTechnicalSpecification,
  technicalSpecificationTools
} from './technical-spec-generator';

// Re-export commonly used schemas and types
export type {
  TechnicalSpecification,
  EmailClientConstraint,
  DesignConstraint,
  QualityCriteria,
  TechnicalSpecificationResult,
  SpecificationValidationResult
} from './technical-spec-generator';

// Import tools array for local use
import { technicalSpecificationTools } from './technical-spec-generator';

/**
 * All technical specification tools for easy import
 */
export const allTechnicalSpecificationTools = [
  ...technicalSpecificationTools
];

/**
 * Technical specification tool categories
 */
export const technicalSpecificationCategories = {
  generation: ['generateTechnicalSpecification'],
  validation: ['validateTechnicalSpecification']
};

/**
 * Tool metadata for documentation and monitoring
 */
export const technicalSpecificationToolMetadata = {
  category: 'technical-specification',
  description: 'Tools for generating and validating comprehensive technical specifications for email campaigns',
  version: '1.0.0',
  totalTools: technicalSpecificationTools.length,
  capabilities: [
    'Technical specification generation',
    'Email client constraint analysis',
    'Design constraint validation',
    'Quality criteria definition',
    'Specification validation and scoring',
    'Implementation guidance generation'
  ],
  integrations: [
    'OpenAI Agents SDK',
    'Zod validation',
    'Campaign folder structure',
    'Content context analysis',
    'Asset manifest integration'
  ]
};