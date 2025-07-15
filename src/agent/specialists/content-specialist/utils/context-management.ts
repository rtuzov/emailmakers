/**
 * Campaign Context Management Utilities
 * 
 * Provides utilities for managing campaign context, file operations,
 * and data persistence throughout the Content Specialist workflow.
 */

import fs from 'fs';
import path from 'path';
import { CampaignWorkflowContext, ExtendedRunContext } from '../types';
import { getCampaignContextFromSdk } from '../../../tools/campaign-context';
import { getErrorMessage, logErrorWithContext } from './error-handling';

/**
 * Load analysis data from campaign files with error handling
 */
export async function loadAnalysisFromFiles(
  campaignPath: string,
  dataType: string
): Promise<any> {
  try {
    // Try multiple possible file locations and formats
    const possiblePaths = [
      path.join(campaignPath, 'content', `${dataType}.json`),
      path.join(campaignPath, 'data', `${dataType}.json`),
      path.join(campaignPath, 'content', 'email-content.json'), // fallback for content analysis
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Return specific field if it exists, otherwise return whole data
        if (data[dataType]) {
          return data[dataType];
        }
        
        // Handle specific data type extractions
        if (dataType === 'context-analysis' && data.context) {
          return data.context;
        }
        
        if (dataType === 'date-analysis' && data.dates) {
          return data.dates;
        }
        
        if (dataType === 'pricing-analysis' && data.pricing) {
          return data.pricing;
        }
        
        return data;
      }
    }
    
    throw new Error(`No ${dataType} file found in campaign folder`);
    
  } catch (error) {
    logErrorWithContext(error, 'loadAnalysisFromFiles', { campaignPath, dataType });
    throw error;
  }
}

/**
 * Save data to campaign file
 */
export async function saveToCampaignFile(
  campaignPath: string,
  fileName: string,
  data: any
): Promise<void> {
  try {
    const filePath = path.join(campaignPath, fileName);
    const directory = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
  } catch (error) {
    logErrorWithContext(error, 'saveToCampaignFile', { campaignPath, fileName });
    throw error;
  }
}

/**
 * Extract campaign context from OpenAI SDK with fallback
 */
export function extractCampaignContext(context: ExtendedRunContext): CampaignWorkflowContext {
  try {
    return getCampaignContextFromSdk(context) || {};
  } catch (error) {
    logErrorWithContext(error, 'extractCampaignContext');
    return {};
  }
}

/**
 * Validate campaign path exists
 */
export function validateCampaignPath(campaignPath?: string): string {
  if (!campaignPath) {
    throw new Error('Campaign path is required');
  }
  
  if (!fs.existsSync(campaignPath)) {
    throw new Error(`Campaign path does not exist: ${campaignPath}`);
  }
  
  return campaignPath;
}

/**
 * Get campaign metadata from campaign folder
 */
export async function getCampaignMetadata(campaignPath: string): Promise<any> {
  try {
    const metadataPath = path.join(campaignPath, 'campaign-metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Campaign metadata not found');
    }
    
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
  } catch (error) {
    logErrorWithContext(error, 'getCampaignMetadata', { campaignPath });
    throw error;
  }
}

/**
 * Ensure campaign directories exist
 */
export function ensureCampaignDirectories(campaignPath: string): void {
  const directories = [
    'content',
    'data',
    'docs',
    'handoffs',
    'assets/manifests'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(campaignPath, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
} 