import { ZodTypeAny } from 'zod';
import { logger } from './logger';

export interface ToolExecutionContext {
  sessionId?: string;
  correlationId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: ZodTypeAny;
  execute: (params: any, ctx?: ToolExecutionContext) => Promise<any>;
  safeAutoExecute?: boolean;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool ${tool.name} already registered, ignoring duplicate`);
      return;
    }
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: ${tool.name}`);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry(); 