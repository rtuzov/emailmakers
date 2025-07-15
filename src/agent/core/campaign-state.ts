/**
 * 📋 CAMPAIGN STATE MANAGER - OpenAI Agents SDK Compatible
 * 
 * Global campaign state management for multi-specialist workflows
 * Supports multiple concurrent campaigns and specialist handoffs
 */

import { EmailFolder } from '../tools/email-folder-manager';

// ============================================================================
// CAMPAIGN STATE INTERFACES
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  brand_name: string;
  campaign_type: string;
  status: 'content_phase' | 'design_phase' | 'quality_phase' | 'delivery_phase' | 'completed';
  current_specialist: 'content' | 'design' | 'quality' | 'delivery';
  created_at: string;
  updated_at: string;
  
  // Specialist completion tracking
  content_specialist_completed?: boolean;
  design_specialist_completed?: boolean;
  quality_specialist_completed?: boolean;
  delivery_specialist_completed?: boolean;
  
  // Content phase data
  content_data?: {
    subject?: string;
    preheader?: string;
    body_content?: string;
    cta_text?: string;
    cta_url?: string;
    asset_plan?: any;
  };
  
  // Design phase data
  selected_assets?: Array<{
    name: string;
    type: string;
    description: string;
    file_id: string;
    node_id: string;
    relevance_score: number;
    tags: string[];
    email_optimized?: boolean;
    formats?: string[];
    sizes?: Record<string, string>;
    alt_text?: string;
    figma_reference?: string;
  }>;
  mjml_template?: string;
  template_analysis?: any;
  design_progress?: string;
  asset_selection_timestamp?: string;
  template_timestamp?: string;
  
  // Quality phase data
  quality_results?: any;
  validation_results?: any;
  compatibility_results?: any;
  performance_results?: any;
  
  // Delivery phase data
  package_path?: string;
  delivery_method?: string;
  delivery_status?: string;
  
  // Handoff context
  handoff_context?: {
    from: string;
    to: string;
    timestamp: string;
    context: string;
    completed_tasks: string[];
    next_steps: string[];
  };
  
  // Legacy support
  emailFolder?: EmailFolder;
  topic?: string;
  trace_id?: string;
}

// ============================================================================
// CAMPAIGN STATE MANAGER CLASS
// ============================================================================

class CampaignStateManager {
  private static instance: CampaignStateManager;
  private campaigns: Map<string, Campaign> = new Map();
  private activeCampaignId: string | null = null;

  private constructor() {}

  static getInstance(): CampaignStateManager {
    if (!CampaignStateManager.instance) {
      CampaignStateManager.instance = new CampaignStateManager();
    }
    return CampaignStateManager.instance;
  }

  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================

  /**
   * Creates a new campaign
   */
  createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Campaign {
    const id = this.generateCampaignId();
    const now = new Date().toISOString();
    
    const newCampaign: Campaign = {
      ...campaign,
      id,
      created_at: now,
      updated_at: now
    };
    
    this.campaigns.set(id, newCampaign);
    this.activeCampaignId = id;
    
    console.log(`📋 Campaign created: ${id} - ${newCampaign.name}`);
    return newCampaign;
  }

  /**
   * Gets all campaigns
   */
  getAllCampaigns(): Record<string, Campaign> {
    const result: Record<string, Campaign> = {};
    this.campaigns.forEach((campaign, id) => {
      result[id] = campaign;
    });
    return result;
  }

  /**
   * Gets a specific campaign by ID
   */
  getCampaign(campaignId: string): Campaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Updates a campaign
   */
  updateCampaign(campaignId: string, updates: Partial<Campaign>): Campaign | null {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      console.error(`❌ Campaign not found: ${campaignId}`);
      return null;
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.campaigns.set(campaignId, updatedCampaign);
    console.log(`📋 Campaign updated: ${campaignId}`);
    return updatedCampaign;
  }

  /**
   * Deletes a campaign
   */
  deleteCampaign(campaignId: string): boolean {
    const deleted = this.campaigns.delete(campaignId);
    if (deleted && this.activeCampaignId === campaignId) {
      this.activeCampaignId = null;
    }
    if (deleted) {
      console.log(`🗑️ Campaign deleted: ${campaignId}`);
  }
    return deleted;
  }

  // ============================================================================
  // ACTIVE CAMPAIGN MANAGEMENT
  // ============================================================================

  /**
   * Sets the active campaign
   */
  setActiveCampaign(campaignId: string): boolean {
    if (this.campaigns.has(campaignId)) {
      this.activeCampaignId = campaignId;
      console.log(`🎯 Active campaign set: ${campaignId}`);
      return true;
    }
    console.error(`❌ Cannot set active campaign - not found: ${campaignId}`);
    return false;
  }

  /**
   * Gets the active campaign
   */
  getActiveCampaign(): Campaign | null {
    if (!this.activeCampaignId) return null;
    return this.campaigns.get(this.activeCampaignId) || null;
  }

  /**
   * Gets the active campaign ID
   */
  getActiveCampaignId(): string | null {
    return this.activeCampaignId;
  }

  // ============================================================================
  // LEGACY SUPPORT METHODS
  // ============================================================================

  /**
   * Legacy method: Sets current campaign (creates if doesn't exist)
   */
  setCampaign(campaignData: {
    campaignId: string;
    emailFolder: EmailFolder;
    topic: string;
    campaign_type: string;
    created_at?: string;
    trace_id?: string;
  }): void {
    const existing = this.campaigns.get(campaignData.campaignId);
    
    if (existing) {
      this.updateCampaign(campaignData.campaignId, {
        emailFolder: campaignData.emailFolder,
        topic: campaignData.topic,
        trace_id: campaignData.trace_id || 'default-trace'
      });
    } else {
      const campaign: Campaign = {
        id: campaignData.campaignId,
        name: campaignData.topic || 'Unnamed Campaign',
        brand_name: 'Unknown Brand',
        campaign_type: campaignData.campaign_type,
        status: 'content_phase',
        current_specialist: 'content',
        created_at: campaignData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        emailFolder: campaignData.emailFolder,
        topic: campaignData.topic,
        trace_id: campaignData.trace_id || 'default-trace'
      };
      
      this.campaigns.set(campaignData.campaignId, campaign);
    }
    
    this.activeCampaignId = campaignData.campaignId;
    console.log(`📋 Legacy campaign set: ${campaignData.campaignId}`);
  }

  /**
   * Legacy method: Gets current campaign
   */
  getCurrentCampaign(): Campaign | null {
    return this.getActiveCampaign();
  }

  /**
   * Legacy method: Gets current campaign ID
   */
  getCurrentCampaignId(): string | null {
    return this.getActiveCampaignId();
  }

  /**
   * Legacy method: Gets current email folder
   */
  getCurrentEmailFolder(): EmailFolder | null {
    const campaign = this.getActiveCampaign();
    return campaign?.emailFolder || null;
  }

  /**
   * Legacy method: Updates email folder
   */
  updateEmailFolder(emailFolder: EmailFolder): void {
    if (this.activeCampaignId) {
      this.updateCampaign(this.activeCampaignId, { emailFolder });
    }
  }

  /**
   * Legacy method: Clears campaign
   */
  clearCampaign(): void {
    this.activeCampaignId = null;
    console.log('🗑️ Active campaign cleared');
  }

  /**
   * Legacy method: Checks if has active campaign
   */
  hasActiveCampaign(): boolean {
    return this.activeCampaignId !== null && this.campaigns.has(this.activeCampaignId);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generates a unique campaign ID
   */
  private generateCampaignId(): string {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets campaigns by status
   */
  getCampaignsByStatus(status: Campaign['status']): Campaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.status === status);
  }

  /**
   * Gets campaigns by specialist
   */
  getCampaignsBySpecialist(specialist: Campaign['current_specialist']): Campaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.current_specialist === specialist);
  }

  /**
   * Clears all campaigns
   */
  clearAllCampaigns(): void {
    this.campaigns.clear();
    this.activeCampaignId = null;
    console.log('🗑️ All campaigns cleared');
  }

  /**
   * Gets campaign statistics
   */
  getStatistics(): {
    total: number;
    by_status: Record<string, number>;
    by_specialist: Record<string, number>;
    active_campaign: string | null;
  } {
    const campaigns = Array.from(this.campaigns.values());
    
    const by_status: Record<string, number> = {};
    const by_specialist: Record<string, number> = {};
    
    campaigns.forEach(campaign => {
      by_status[campaign.status] = (by_status[campaign.status] || 0) + 1;
      by_specialist[campaign.current_specialist] = (by_specialist[campaign.current_specialist] || 0) + 1;
    });
    
    return {
      total: campaigns.length,
      by_status,
      by_specialist,
      active_campaign: this.activeCampaignId
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CampaignState = CampaignStateManager.getInstance();
export const campaignState = CampaignStateManager.getInstance(); // Legacy export
export type { Campaign as CampaignStateType }; 