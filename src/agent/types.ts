export interface EmailGenerationRequest {
  topic: string;
  content_brief?: string;
  origin?: string;
  destination?: string;
  date_range?: string;
  cabin_class?: 'economy' | 'business' | 'first';
  target_audience?: string;
  campaign_type?: 'promotional' | 'informational' | 'seasonal';
  tone?: string;
  language?: string;
  brand?: string;
  figma_url?: string;
}

export interface EmailGenerationResponse {
  status: 'success' | 'error';
  html_url?: string;
  layout_regression?: 'pass' | 'fail';
  render_testing?: 'pass' | 'fail';
  quality_check?: 'pass' | 'fail' | 'not_executed';
  quality_score?: number;
  generation_time?: number;
  token_usage?: number;
  error_message?: string;
  trace_id?: string;
  report_urls?: {
    layout_regression?: string;
    render_test_report?: string;
    percy_screenshots?: string;
  };
  campaign_metadata?: {
    topic: string;
    routes_analyzed: string[];
    date_ranges: string[];
    prices_found: number;
    content_variations: number;
    quality_controlled?: boolean;
  };
}

// State management types for workflow orchestration
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

export interface PriceData {
  prices: Array<{
    origin: string;
    destination: string;
    price: number;
    currency: string;
    date: string;
  }>;
  currency: string;
  cheapest: number;
}

export interface AssetData {
  paths: string[];
  metadata: Record<string, any>;
  selection_strategy?: any;
}

export interface ContentData {
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  language: string;
  tone: string;
}

export interface CampaignMetadata {
  topic: string;
  routes_analyzed: string[];
  date_ranges: string[];
  prices_found: number;
  content_variations: number;
}
