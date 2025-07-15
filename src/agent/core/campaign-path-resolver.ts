/**
 * 🎯 CAMPAIGN PATH RESOLVER UTILITY
 * 
 * Centralized utility for resolving and validating campaign paths across all specialists.
 * Eliminates inconsistent path extraction methods found in finalization tools.
 */

import { promises as fs } from 'fs';
import path from 'path';
// import { getGlobalLogger } from './agent-logger'; // Reserved for future logging
import { debuggers } from './debug-output';

// const logger = getGlobalLogger(); // Reserved for future logging
const debug = debuggers.core;

export class CampaignPathError extends Error {
  constructor(message: string, public readonly providedPath?: string) {
    super(message);
    this.name = 'CampaignPathError';
  }
}

export class CampaignPathResolver {
  /**
   * Resolves campaign path from various input formats
   * Handles handoff file paths, content context objects, and direct paths
   */
  static resolvePath(input: any): string {
    debug.info('CampaignPathResolver', 'Resolving campaign path', {
      inputType: typeof input,
      inputKeys: typeof input === 'object' ? Object.keys(input) : undefined
    });

    let campaignPath: string | undefined;

    // Method 1: Direct string path
    if (typeof input === 'string') {
      campaignPath = this.extractFromPath(input);
    }
    // Method 2: Content context object (from Content Specialist)
    else if (input?.campaign?.campaignPath) {
      campaignPath = this.extractFromPath(input.campaign.campaignPath);
    }
    // Method 3: Alternative campaign_path field
    else if (input?.campaign_path) {
      campaignPath = this.extractFromPath(input.campaign_path);
    }
    // Method 4: Handoff context structure
    else if (input?.content_context?.campaign?.campaignPath) {
      campaignPath = this.extractFromPath(input.content_context.campaign.campaignPath);
    }
    // Method 5: Direct campaign ID (build path)
    else if (input?.campaign?.id) {
      campaignPath = path.join(process.cwd(), 'campaigns', input.campaign.id);
    }

    if (!campaignPath) {
      debug.error('CampaignPathResolver', 'Failed to resolve campaign path', {
        input: typeof input === 'object' ? Object.keys(input) : input
      });
      throw new CampaignPathError(
        'Campaign path could not be resolved from input. Required: campaign.campaignPath, campaign_path, or valid handoff structure.',
        typeof input === 'string' ? input : undefined
      );
    }

    debug.info('CampaignPathResolver', 'Campaign path resolved', {
      resolvedPath: campaignPath,
      isAbsolute: path.isAbsolute(campaignPath)
    });

    return campaignPath;
  }

  /**
   * Extracts campaign directory from various path formats
   * Handles handoff file paths and direct directory paths
   */
  static extractFromPath(inputPath: string): string {
    if (!inputPath) {
      throw new CampaignPathError('Input path is empty or undefined');
    }

    let campaignPath = inputPath;

    // Handle handoff file path: /path/to/campaign/handoffs/file.json -> /path/to/campaign
    if (campaignPath && campaignPath.includes('/handoffs/')) {
      const extractedPath = campaignPath.split('/handoffs/')[0];
      if (extractedPath) {
        campaignPath = extractedPath;
        debug.info('CampaignPathResolver', 'Extracted from handoff path', {
          original: inputPath,
          extracted: campaignPath
        });
      }
    }
    // Handle direct file path: /path/to/campaign/file.json -> /path/to/campaign
    else if (campaignPath && (campaignPath.endsWith('.json') || path.extname(campaignPath))) {
      campaignPath = path.dirname(campaignPath);
      debug.info('CampaignPathResolver', 'Extracted from file path', {
        original: inputPath,
        extracted: campaignPath
      });
    }

    // Ensure absolute path
    if (!path.isAbsolute(campaignPath)) {
      campaignPath = path.resolve(campaignPath);
    }

    return campaignPath;
  }

  /**
   * Validates that the path exists and is a valid campaign directory
   */
  static async validatePath(campaignPath: string): Promise<boolean> {
    debug.info('CampaignPathResolver', 'Validating campaign path', {
      campaignPath
    });

    try {
      // Check if path exists
      const stats = await fs.stat(campaignPath);
      if (!stats.isDirectory()) {
        debug.error('CampaignPathResolver', 'Path is not a directory', { campaignPath });
        throw new CampaignPathError(`Path is not a directory: ${campaignPath}`, campaignPath);
      }

      // Check for campaign metadata file (indicates valid campaign)
      const metadataPath = path.join(campaignPath, 'campaign-metadata.json');
      try {
        await fs.access(metadataPath);
        debug.info('CampaignPathResolver', 'Campaign metadata found', { metadataPath });
      } catch {
        debug.warn('CampaignPathResolver', 'Campaign metadata not found', { 
          metadataPath,
          warning: 'Directory exists but may not be a valid campaign folder'
        });
      }

      return true;
    } catch (error) {
      debug.error('CampaignPathResolver', 'Path validation failed', {
        campaignPath,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof CampaignPathError) {
        throw error;
      }
      
      throw new CampaignPathError(`Campaign path does not exist: ${campaignPath}`, campaignPath);
    }
  }

  /**
   * Resolves and validates campaign path in one step
   * This is the main method specialists should use
   */
  static async resolveAndValidate(input: any): Promise<string> {
    const campaignPath = this.resolvePath(input);
    await this.validatePath(campaignPath);
    
    debug.info('CampaignPathResolver', 'Campaign path resolved and validated', {
      campaignPath
    });
    
    return campaignPath;
  }

  /**
   * STRICT MODE: Only verify subdirectories exist, do not create them
   * Campaign creation should only happen through the main workflow
   */
  static async ensureSubdirectories(campaignPath: string): Promise<void> {
    const requiredDirs = [
      'data',
      'content', 
      'assets',
      'templates',
      'handoffs',
      'docs',
      'exports',
      'logs'
    ];

    debug.info('CampaignPathResolver', 'Verifying campaign subdirectories exist', {
      campaignPath,
      requiredDirs
    });

    // Only verify, don't create
    for (const dir of requiredDirs) {
      const dirPath = path.join(campaignPath, dir);
      try {
        await fs.access(dirPath);
        debug.info('CampaignPathResolver', 'Subdirectory exists', { dirPath });
      } catch (error) {
        debug.warn('CampaignPathResolver', 'Subdirectory missing (will not create)', {
          dirPath,
          message: 'Use main workflow to create proper campaign structure'
        });
      }
    }
  }

  /**
   * Gets standard file paths within a campaign directory
   */
  static getStandardPaths(campaignPath: string) {
    return {
      metadata: path.join(campaignPath, 'campaign-metadata.json'),
      data: {
        destination: path.join(campaignPath, 'data', 'destination-analysis.json'),
        market: path.join(campaignPath, 'data', 'market-intelligence.json'),
        emotional: path.join(campaignPath, 'data', 'emotional-profile.json'),
        consolidated: path.join(campaignPath, 'data', 'consolidated-insights.json'),
        trends: path.join(campaignPath, 'data', 'trend-analysis.json'),
        travel: path.join(campaignPath, 'data', 'travel_intelligence-insights.json')
      },
      handoffs: {
        dataToContent: path.join(campaignPath, 'handoffs', 'data-collection-specialist-to-content-specialist.json'),
        contentToDesign: path.join(campaignPath, 'handoffs', 'content-to-design.json'),
        designToQuality: path.join(campaignPath, 'handoffs', 'design-to-quality.json'),
        qualityToDelivery: path.join(campaignPath, 'handoffs', 'quality-to-delivery.json')
      },
      content: {
        brief: path.join(campaignPath, 'content', 'design-brief-from-context.json'),
        email: path.join(campaignPath, 'content', 'email-content.json'),
        markdown: path.join(campaignPath, 'content', 'email-content.md')
      },
      assets: {
        manifest: path.join(campaignPath, 'assets', 'manifests', 'asset-manifest.json'),
        usage: path.join(campaignPath, 'assets', 'manifests', 'usage-instructions.json'),
        collected: path.join(campaignPath, 'assets', 'collected'),
        optimized: path.join(campaignPath, 'assets', 'optimized')
      }
    };
  }
}