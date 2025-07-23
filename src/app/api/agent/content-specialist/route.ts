import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { contentSpecialistAgent } from '@/agent/core/tool-registry';

/**
 * Zod schema for Content Specialist API request validation
 * Following OpenAI Agents SDK best practices for parameter validation
 */
const ContentSpecialistRequestSchema = z.object({
  task_type: z.enum([
    'analyze_context',
    'get_pricing', 
    'generate_content',
    'manage_campaign',
    'generate_copy',
    'create_variants',
    'analyze_multi_destination'
  ]).default('generate_content').describe('Type of content task to perform'),
  
  topic: z.string().min(1).max(500).optional().describe('Main topic or theme for content generation'),
  
  content_type: z.enum([
    'email',
    'subject_line', 
    'preheader',
    'call_to_action',
    'body_text',
    'complete_campaign',
    'subject_only'
  ]).default('complete_campaign').describe('Type of content to generate'),
  
  tone: z.enum([
    'professional',
    'friendly', 
    'urgent',
    'casual',
    'luxury',
    'family'
      ]).describe('Tone of voice for content'),
  
  language: z.enum(['ru', 'en']).default('ru').describe('Language for content generation'),
  
  target_audience: z.string().default('general').describe('Target audience description'),
  
  origin: z.string().optional().describe('Origin location for travel content'),
  destination: z.string().optional().describe('Destination location for travel content'),
  
      campaign_context: z.object({}).optional().describe('Additional campaign context and metadata')
});

export type ContentSpecialistRequest = z.infer<typeof ContentSpecialistRequestSchema>;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Enhanced request validation following OpenAI Agents SDK best practices
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }
    
    // Parse and validate request body using Zod schema with size check
    const rawBody = await request.text();
    if (!rawBody || rawBody.trim() === '') {
      throw new Error('Request body cannot be empty');
    }
    
    if (rawBody.length > 10000) { // 10KB limit for request body
      throw new Error('Request body too large (max 10KB)');
    }
    
    const body = JSON.parse(rawBody);
    const validatedRequest = ContentSpecialistRequestSchema.parse(body);
    
    const {
      task_type,
      topic,
      content_type,
      tone,
      language,
      target_audience,
      origin,
      destination,
      // _campaign_context
    } = validatedRequest;

    console.log('🧠 ContentSpecialist API called (OpenAI Agents SDK v2):', { 
      task_type, 
      topic: topic || 'Travel Campaign', 
      content_type, 
      tone, 
      language,
      target_audience,
      hasOriginDestination: !!(origin && destination),
      timestamp: new Date().toISOString()
    });

    // Prepare input for the content specialist agent following OpenAI Agents SDK patterns
    const agentInput = {
      task_type,
      campaign_brief: {
        topic: topic || 'Travel Campaign'
      },
      context_requirements: {
        include_seasonal: true,
        include_cultural: language === 'ru',
        include_marketing: true,
        include_travel: !!(origin || destination)
      },
      pricing_requirements: (origin && destination) ? {
        origin,
        destination,
        analysis_depth: 'basic' as const
      } : undefined,
      content_requirements: {
        content_type: content_type === 'subject_only' ? 'subject_line' : 
                     content_type === 'complete_campaign' ? 'email' : content_type,
        tone,
        language,
        generate_variants: false
      }
    };

    // Execute the content specialist task with OpenAI Agents SDK
    const { run } = await import('@openai/agents');
    
    // Create prompt for the agent
    const prompt = `Process content generation task:

**Task Type:** ${task_type}
**Topic:** ${topic}
**Destination:** ${destination}
**Language:** ${language}

**Instructions:**
1. Analyze the topic and destination context
2. Generate compelling email content
3. Create asset strategy and manifest  
4. Prepare pricing analysis if needed
5. Generate technical specifications

Please execute the content workflow and provide comprehensive results.`;

    console.log('🚀 Running Content Specialist Agent with OpenAI Agents SDK...');
    
    // Run the agent with the prepared input
    const result = await run(contentSpecialistAgent, prompt, {
      context: {
        agentInput,
        apiCall: true,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
      }
    });
    
    const executionTime = Date.now() - startTime;

    console.log('✅ ContentSpecialist agent completed (OpenAI Agents SDK v2):', {
      success: result.success,
      task_type: result.task_type,
      execution_time: executionTime,
      confidence_score: result.analytics?.confidence_score || 0,
      hasResults: !!result.results,
      next_agent: (result as any).recommendations?.next_agent || 'none'
    });

    // Return modern structured response following OpenAI Agents SDK patterns
    return NextResponse.json({
      success: result.success,
      task_type: result.task_type,
      results: result.results,
      recommendations: (result as any).recommendations,
      analytics: {
        ...result.analytics,
        execution_time: executionTime,
        sdk_version: 'openai-agents-v2'
      },
      _meta: {
        agent: 'content-specialist',
        task_type: result.task_type,
        execution_time: executionTime,
        success: result.success,
        sdk: 'openai-agents-v2',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ ContentSpecialist API error:', error);
    
    // Enhanced error handling with proper categorization following OpenAI Agents SDK patterns
    if (error instanceof z.ZodError) {
      // Input validation errors - return 400 with detailed field errors
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: 'received' in err ? err.received : undefined,
        expected: 'expected' in err ? err.expected : undefined
      }));
      
      return NextResponse.json({
        success: false,
        task_type: 'generate_content',
        results: {},
        recommendations: {
          next_actions: [
            'Fix validation errors in request body',
            'Check field types and constraints',
            'Refer to API documentation for correct format'
          ]
        },
        analytics: {
          execution_time: executionTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        error: 'Input validation failed',
        validation_errors: fieldErrors,
        _meta: {
          agent: 'content-specialist',
          task_type: 'generate_content',
          execution_time: executionTime,
          success: false,
          error_type: 'validation_error',
          sdk: 'openai-agents-v2',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
    if (error instanceof SyntaxError || error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error)?.includes('JSON')) {
      // JSON parsing errors - return 400
      return NextResponse.json({
        success: false,
        task_type: 'generate_content',
        results: {},
        recommendations: {
          next_actions: [
            'Check request body JSON syntax',
            'Ensure Content-Type is application/json',
            'Validate JSON structure'
          ]
        },
        analytics: {
          execution_time: executionTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        error: 'Invalid JSON in request body',
        _meta: {
          agent: 'content-specialist',
          task_type: 'generate_content',
          execution_time: executionTime,
          success: false,
          error_type: 'json_parse_error',
          sdk: 'openai-agents-v2',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
    if (error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error)?.includes('Content-Type') || 
        error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error)?.includes('empty') || 
        error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error)?.includes('too large')) {
      // Request validation errors - return 400
      return NextResponse.json({
        success: false,
        task_type: 'generate_content',
        results: {},
        recommendations: {
          next_actions: [
            'Ensure Content-Type header is application/json',
            'Provide non-empty request body',
            'Keep request body under 10KB limit'
          ]
        },
        analytics: {
          execution_time: executionTime,
          operations_performed: 0,
          confidence_score: 0,
          agent_efficiency: 0
        },
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error),
        _meta: {
          agent: 'content-specialist',
          task_type: 'generate_content',
          execution_time: executionTime,
          success: false,
          error_type: 'request_validation_error',
          sdk: 'openai-agents-v2',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }
    
    // Agent execution errors - return 500 with diagnostic info
    const errorMessage = error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : String(error) : String(error) : String(error) : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      task_type: 'generate_content',
      results: {},
      recommendations: {
        next_actions: [
          'Check OpenAI API key configuration',
          'Verify agent initialization',
          'Check system logs for detailed error information',
          'Retry request with different parameters'
        ]
      },
      analytics: {
        execution_time: executionTime,
        operations_performed: 0,
        confidence_score: 0,
        agent_efficiency: 0
      },
      error: errorMessage,
      _meta: {
        agent: 'content-specialist',
        task_type: 'generate_content',
        execution_time: executionTime,
        success: false,
        error_type: 'agent_execution_error',
        error_stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        sdk: 'openai-agents-v2',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}