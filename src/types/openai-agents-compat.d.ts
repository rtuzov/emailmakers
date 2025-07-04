/*
  Temporary compatibility layer for older code written against prior
  versions of the `@openai/agents` SDK.  These ambient declarations make the
  compiler happy while we migrate the codebase.  The goal is *zero* runtime
  impact – we are only augmenting the type system.
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Agent as BaseAgent, RunOptions } from '@openai/agents';

declare module '@openai/agents' {
  // Add a .run convenience wrapper that was removed in newer SDK versions
  interface Agent<I = unknown, O extends 'text' | 'json' = 'text'> extends BaseAgent<I, O> {
    /** @deprecated – use run(agent, prompt, opts) at callsites.  Provided here for backwards-compat only. */
    run(prompt: string, opts?: Partial<RunOptions>): Promise<any>;
  }

  // Older code expects a RunResult with a .content field
  // (the SDK now returns .output).  Provide alias.
  interface RunResult<R = any, A extends BaseAgent = BaseAgent> {
    /** @deprecated – use .output */
    content?: R;
    output?: R;
    // for legacy app-layer expectations
    success?: boolean;
    task_type?: string;
    results?: any;
    analytics?: any;
    handoff_data?: any;
  }
}

// Generic trace helper shape in earlier versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TraceMetadata { [k: string]: any }

declare interface Trace {
  name: string;
  metadata?: TraceMetadata;
}

declare function withTrace<T>(trace: string | Trace, fn: () => Promise<T>): Promise<T>;

declare module '@openai/agents' {
  // Re-export so imports keep working
  export { withTrace };
}

// Provide legacy ToolOptions.inputSchema key so old wrappers type-check
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ZodSchema } from 'zod';

declare module '@openai/agents' {
  interface ToolOptions<I = unknown, O = unknown> {
    /** @deprecated – replaced by `parameters` in SDK v0.6 */
    inputSchema?: ZodSchema<I>;
  }
} 