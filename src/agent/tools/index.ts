// generateCopy removed - now using consolidated content generator

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function handleToolError(error: any, toolName: string): ToolResult {
  console.error(`❌ ${toolName} error:`, error);
  return {
    success: false,
    error: error.message || String(error)
  };
} 