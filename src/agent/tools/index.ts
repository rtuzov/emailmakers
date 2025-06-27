// Export all tools
export { getFigmaAssets } from './figma';
export { splitFigmaVariants } from './figma-variant-splitter';
export { processNewsRabbits } from './figma-news-rabbits-processor';
export { getPrices } from './prices';
export { getCurrentDate } from './date';
export { generateCopy } from './copy';
export { renderMjml } from './mjml';
export { diffHtml } from './diff';
export { patchHtml } from './patch';
export { uploadToS3 } from './upload';
export { percySnap } from './percy';
export { renderTest } from './render-test';

// T16: Identica Creative Selector
export { selectIdenticaCreatives, identicaSelectorSchema } from './identica-selector';

// Common types for tools
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AssetInfo {
  path: string;
  url?: string;
  width?: number;
  height?: number;
  size?: number;
  metadata?: Record<string, any>;
}

export interface PriceInfo {
  origin: string;
  destination: string;
  price: number;
  date: string;
  currency: string;
  metadata?: {
    airline?: string;
    flight_number?: string;
    duration?: number;
    stops?: number;
    estimated?: boolean;
    base_price?: number;
    variation_factor?: number;
  };
}

export interface ContentInfo {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
}

export interface TestResult {
  score: number;
  status: 'pass' | 'fail';
  issues: string[];
  report_url?: string;
  duration?: number;
}

export interface DiffResult {
  delta_percentage: number;
  critical_changes: Array<{
    tag: string;
    change: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
  }>;
  status: 'pass' | 'fail';
  baseline_path?: string;
  diff_report?: string;
}

import { handleToolErrorUnified } from '../core/error-orchestrator';
import { logger } from '../core/logger';

// Unified error handling utilities (delegates to core ErrorOrchestrator)
export function handleToolError(toolName: string, error: any): ToolResult {
  logger.error(`Tool ${toolName} failed`, { error });
  return handleToolErrorUnified(toolName, error);
} 