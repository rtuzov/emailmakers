import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface CampaignInfo {
  id: string;
  path: string;
  timestamp: number;
  readme?: any;
  hasData?: boolean;
  hasContent?: boolean;
  hasAssets?: boolean;
  hasTemplates?: boolean;
  hasHandoffs?: boolean;
  hasExports?: boolean;
}

interface HandoffData {
  from_specialist: string;
  to_specialist: string;
  handoff_data: any;
  created_at: string;
  file_path: string;
}

/**
 * GET /api/agent/test/utils
 * Utility functions for campaign management and testing
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_campaigns';

    switch (action) {
      case 'list_campaigns':
        return await listCampaigns();
      
      case 'get_latest':
        return await getLatestCampaign();
      
      case 'get_campaign_info':
        const campaignId = searchParams.get('campaignId');
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId parameter required' }, { status: 400 });
        }
        return await getCampaignInfo(campaignId);
      
      case 'load_context':
        const loadCampaignId = searchParams.get('campaignId');
        const specialist = searchParams.get('specialist');
        if (!loadCampaignId || !specialist) {
          return NextResponse.json({ 
            error: 'campaignId and specialist parameters required' 
          }, { status: 400 });
        }
        return await loadSpecialistContext(loadCampaignId, specialist);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Test utils API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * List all campaigns sorted by timestamp (newest first)
 */
async function listCampaigns(): Promise<NextResponse> {
  try {
    const campaignsDir = path.join(process.cwd(), 'campaigns');
    const entries = await fs.readdir(campaignsDir);
    
    const campaigns: CampaignInfo[] = [];
    
    for (const entry of entries) {
      // Skip API campaigns and test campaigns
      if (entry.startsWith('api_campaign_') || entry.includes('test_2024')) {
        continue;
      }
      
      // Extract timestamp from campaign ID
      const match = entry.match(/campaign_(\d+)_/);
      if (!match) continue;
      
      const timestamp = parseInt(match[1]);
      const campaignPath = path.join(campaignsDir, entry);
      
      try {
        const stats = await fs.stat(campaignPath);
        if (stats.isDirectory()) {
          const campaignInfo: CampaignInfo = {
            id: entry,
            path: campaignPath,
            timestamp,
            hasData: await directoryExists(path.join(campaignPath, 'data')),
            hasContent: await directoryExists(path.join(campaignPath, 'content')),
            hasAssets: await directoryExists(path.join(campaignPath, 'assets')),
            hasTemplates: await directoryExists(path.join(campaignPath, 'templates')),
            hasHandoffs: await directoryExists(path.join(campaignPath, 'handoffs')),
            hasExports: await directoryExists(path.join(campaignPath, 'exports'))
          };
          
          // Try to load README
          try {
            const readmePath = path.join(campaignPath, 'README.md');
            const readmeContent = await fs.readFile(readmePath, 'utf-8');
            campaignInfo.readme = parseReadme(readmeContent);
          } catch {
            // README not found or not readable
          }
          
          campaigns.push(campaignInfo);
        }
      } catch {
        // Skip campaigns we can't access
      }
    }
    
    // Sort by timestamp (newest first)
    campaigns.sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json({
      success: true,
      campaigns: campaigns.slice(0, 20), // Return last 20 campaigns
      total: campaigns.length,
      latest: campaigns[0] || null
    });
  } catch (error) {
    throw new Error(`Failed to list campaigns: ${error.message}`);
  }
}

/**
 * Get the latest campaign
 */
async function getLatestCampaign(): Promise<NextResponse> {
  try {
    const campaignsResponse = await listCampaigns();
    const data = await campaignsResponse.json();
    
    if (!data.success || !data.latest) {
      return NextResponse.json({
        success: false,
        error: 'No campaigns found'
      });
    }
    
    return NextResponse.json({
      success: true,
      campaign: data.latest
    });
  } catch (error) {
    throw new Error(`Failed to get latest campaign: ${error.message}`);
  }
}

/**
 * Get detailed campaign information
 */
async function getCampaignInfo(campaignId: string): Promise<NextResponse> {
  try {
    const campaignPath = path.join(process.cwd(), 'campaigns', campaignId);
    
    // Check if campaign exists
    try {
      await fs.access(campaignPath);
    } catch {
      return NextResponse.json({
        success: false,
        error: `Campaign ${campaignId} not found`
      }, { status: 404 });
    }
    
    const info: any = {
      id: campaignId,
      path: campaignPath,
      directories: {},
      files: {},
      handoffs: []
    };
    
    // Check directories
    const directories = ['data', 'content', 'assets', 'templates', 'docs', 'handoffs', 'exports', 'logs'];
    for (const dir of directories) {
      const dirPath = path.join(campaignPath, dir);
      info.directories[dir] = {
        exists: await directoryExists(dirPath),
        files: []
      };
      
      if (info.directories[dir].exists) {
        try {
          const files = await fs.readdir(dirPath);
          info.directories[dir].files = files;
        } catch {
          // Can't read directory
        }
      }
    }
    
    // Load handoff files
    if (info.directories.handoffs.exists) {
      const handoffFiles = info.directories.handoffs.files.filter(f => f.endsWith('.json'));
      for (const handoffFile of handoffFiles) {
        try {
          const handoffPath = path.join(campaignPath, 'handoffs', handoffFile);
          const handoffContent = await fs.readFile(handoffPath, 'utf-8');
          const handoffData = JSON.parse(handoffContent);
          info.handoffs.push({
            file: handoffFile,
            ...handoffData
          });
        } catch {
          // Skip invalid handoff files
        }
      }
    }
    
    // Load README
    try {
      const readmePath = path.join(campaignPath, 'README.md');
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      info.readme = parseReadme(readmeContent);
    } catch {
      // README not found
    }
    
    return NextResponse.json({
      success: true,
      campaign: info
    });
  } catch (error) {
    throw new Error(`Failed to get campaign info: ${error.message}`);
  }
}

/**
 * Load context for a specific specialist from previous handoffs
 */
async function loadSpecialistContext(campaignId: string, specialist: string): Promise<NextResponse> {
  try {
    const campaignPath = path.join(process.cwd(), 'campaigns', campaignId);
    const handoffsPath = path.join(campaignPath, 'handoffs');
    
    // Check if handoffs directory exists
    if (!await directoryExists(handoffsPath)) {
      return NextResponse.json({
        success: true,
        context: null,
        message: 'No handoffs directory found - starting from scratch'
      });
    }
    
    const context: any = {
      campaign_id: campaignId,
      campaign_path: campaignPath,
      specialist,
      previous_data: {},
      handoff_chain: [],
      loaded_files: []
    };
    
    // Define specialist order
    const specialistOrder = ['data-collection', 'content', 'design', 'quality', 'delivery'];
    const currentIndex = specialistOrder.indexOf(specialist);
    
    if (currentIndex === -1) {
      return NextResponse.json({
        success: false,
        error: `Unknown specialist: ${specialist}`
      }, { status: 400 });
    }
    
    // Load context from previous specialists
    const handoffFiles = await fs.readdir(handoffsPath);
    
    for (let i = 0; i < currentIndex; i++) {
      const fromSpecialist = specialistOrder[i];
      const toSpecialist = specialistOrder[i + 1];
      
      // Find handoff file with multiple possible patterns
      // Priority: no spaces first, then variations with spaces
      const patterns = [
        `${fromSpecialist}-specialist-to-${toSpecialist}-specialist.json`,
        `${fromSpecialist}-to-${toSpecialist}.json`,
        `${fromSpecialist} specialist-to-${toSpecialist} specialist.json`,
        `${fromSpecialist} specialist-to-${toSpecialist}-specialist.json`,
        `${fromSpecialist}-specialist-to-${toSpecialist} specialist.json`,
        `${fromSpecialist} to ${toSpecialist}.json`
      ];
      
      let handoffFile = handoffFiles.find(f => patterns.includes(f));
      
      if (handoffFile) {
        try {
          const handoffPath = path.join(handoffsPath, handoffFile);
          const handoffContent = await fs.readFile(handoffPath, 'utf-8');
          const handoffData = JSON.parse(handoffContent);
          
          // Handle different handoff file structures
          let actualHandoffData;
          if (handoffData.handoff_data) {
            // Old format with handoff_data field
            actualHandoffData = handoffData.handoff_data;
          } else {
            // New format - use entire content except metadata
            actualHandoffData = { ...handoffData };
            delete actualHandoffData.metadata;
            delete actualHandoffData.request;
          }
          
          context.previous_data[fromSpecialist] = actualHandoffData;
          context.handoff_chain.push({
            from: handoffData.from_specialist || handoffData.metadata?.fromAgent || fromSpecialist,
            to: handoffData.to_specialist || handoffData.metadata?.toAgent || toSpecialist,
            created_at: handoffData.created_at || handoffData.metadata?.timestamp,
            file: handoffFile
          });
          context.loaded_files.push(handoffPath);
        } catch (error) {
          console.warn(`Failed to load handoff file ${handoffFile}:`, error);
        }
      }
    }
    
    // Load additional data files if available
    const dataFiles = ['data', 'content', 'assets', 'docs'];
    for (const dataDir of dataFiles) {
      const dirPath = path.join(campaignPath, dataDir);
      if (await directoryExists(dirPath)) {
        try {
          const files = await fs.readdir(dirPath);
          context[`${dataDir}_files`] = files;
          
          // Load key files
          for (const file of files) {
            if (file.endsWith('.json') && files.length <= 5) { // Only load if not too many files
              try {
                const filePath = path.join(dirPath, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const fileData = JSON.parse(fileContent);
                
                if (!context[`${dataDir}_data`]) {
                  context[`${dataDir}_data`] = {};
                }
                context[`${dataDir}_data`][file] = fileData;
              } catch {
                // Skip files that can't be loaded
              }
            }
          }
        } catch {
          // Can't read directory
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      context,
      message: `Context loaded for ${specialist} specialist from ${context.handoff_chain.length} previous handoffs`
    });
  } catch (error) {
    throw new Error(`Failed to load specialist context: ${error.message}`);
  }
}

/**
 * Helper functions
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function parseReadme(content: string): any {
  const lines = content.split('\n');
  const readme: any = {};
  
  for (const line of lines) {
    if (line.startsWith('**Campaign ID:**')) {
      readme.campaign_id = line.replace('**Campaign ID:**', '').trim();
    } else if (line.startsWith('**Brand:**')) {
      readme.brand = line.replace('**Brand:**', '').trim();
    } else if (line.startsWith('**Type:**')) {
      readme.type = line.replace('**Type:**', '').trim();
    } else if (line.startsWith('**Audience:**')) {
      readme.audience = line.replace('**Audience:**', '').trim();
    } else if (line.startsWith('**Created:**')) {
      readme.created = line.replace('**Created:**', '').trim();
    } else if (line.startsWith('## User Request')) {
      const nextLine = lines[lines.indexOf(line) + 1];
      if (nextLine && !nextLine.startsWith('##')) {
        readme.user_request = nextLine.trim();
      }
    }
  }
  
  return readme;
} 