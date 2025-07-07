// Basic types for backwards compatibility
export interface EmailGenerationRequest {
  task_type?: string;
  topic?: string;
  destination?: string;
  brief?: string;
  content?: any;
  [key: string]: any;
}

export interface AgentResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  metadata?: any;
}

export interface HandoffData {
  source_agent: string;
  target_agent: string;
  data: any;
  trace_id?: string;
}

export type AgentType = 'content' | 'design' | 'quality' | 'delivery';

// Additional types for state management
export interface PriceData {
  prices: Array<{
    origin: string;
    destination: string;
    price: number;
    currency: string;
  }>;
}

export interface AssetData {
  type: string;
  url: string;
  metadata?: any;
}

export interface ContentData {
  subject: string;
  body: string;
  metadata?: any;
}

export interface CampaignMetadata {
  topic: string;
  routes_analyzed: string[];
  date_ranges: string[];
  prices_found: number;
  content_variations: number;
}

export interface EmailGenerationState {
  brief: string;
  currentDate: Date;
  prices: PriceData | null;
  assets: AssetData[];
  copy: ContentData | null;
  html: string | null;
  qaScore: number;
  metadata: CampaignMetadata;
} 