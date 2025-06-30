export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  execution_time?: number;
  metadata?: {
    tool_name: string;
    version: string;
    timestamp: string;
  };
}

export interface ToolParams {
  [key: string]: any;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: any;
} 