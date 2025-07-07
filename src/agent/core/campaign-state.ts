/**
 * Campaign State Manager - глобальное состояние email кампании
 * Обеспечивает единый campaignId для всех инструментов в рамках одной сессии
 */

import { EmailFolder } from '../tools/email-folder-manager';

interface CampaignState {
  campaignId: string;
  emailFolder: EmailFolder;
  topic: string;
  campaign_type: string;
  created_at: string;
  trace_id?: string;
}

class CampaignStateManager {
  private static instance: CampaignStateManager;
  private currentCampaign: CampaignState | null = null;

  private constructor() {}

  static getInstance(): CampaignStateManager {
    if (!CampaignStateManager.instance) {
      CampaignStateManager.instance = new CampaignStateManager();
    }
    return CampaignStateManager.instance;
  }

  /**
   * Устанавливает текущую кампанию
   */
  setCampaign(campaign: CampaignState): void {
    this.currentCampaign = campaign;
    console.log(`📋 Campaign state set: ${campaign.campaignId}`);
  }

  /**
   * Получает текущую кампанию
   */
  getCurrentCampaign(): CampaignState | null {
    return this.currentCampaign;
  }

  /**
   * Получает campaignId текущей кампании
   */
  getCurrentCampaignId(): string | null {
    return this.currentCampaign?.campaignId || null;
  }

  /**
   * Получает EmailFolder текущей кампании
   */
  getCurrentEmailFolder(): EmailFolder | null {
    return this.currentCampaign?.emailFolder || null;
  }

  /**
   * Обновляет EmailFolder в текущей кампании
   */
  updateEmailFolder(emailFolder: EmailFolder): void {
    if (this.currentCampaign) {
      this.currentCampaign.emailFolder = emailFolder;
      console.log(`📁 Email folder updated for campaign: ${this.currentCampaign.campaignId}`);
    }
  }

  /**
   * Очищает состояние кампании (для новой кампании)
   */
  clearCampaign(): void {
    this.currentCampaign = null;
    console.log('🗑️ Campaign state cleared');
  }

  /**
   * Проверяет, есть ли активная кампания
   */
  hasActiveCampaign(): boolean {
    return this.currentCampaign !== null;
  }
}

export const campaignState = CampaignStateManager.getInstance();
export type { CampaignState }; 