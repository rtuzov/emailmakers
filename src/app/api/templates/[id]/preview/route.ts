import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/connection';
import { email_templates } from '@/shared/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/templates/[id]/preview
 * Get template preview content (HTML, MJML, metadata)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const templateId = params.id;

    if (!templateId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template ID is required',
          code: 'MISSING_TEMPLATE_ID'
        },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(templateId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid template ID format',
          code: 'INVALID_TEMPLATE_ID'
        },
        { status: 400 }
      );
    }

    // Query database for template
    const templates = await db
      .select({
        id: email_templates.id,
        name: email_templates.name,
        description: email_templates.description,
        brief_text: email_templates.brief_text,
        generated_content: email_templates.generated_content,
        mjml_code: email_templates.mjml_code,
        html_output: email_templates.html_output,
        design_tokens: email_templates.design_tokens,
        status: email_templates.status,
        quality_score: email_templates.quality_score,
        created_at: email_templates.created_at,
        updated_at: email_templates.updated_at,
      })
      .from(email_templates)
      .where(eq(email_templates.id, templateId))
      .limit(1);

    if (templates.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const template = templates[0];

    // Extract content data
    const generatedContent = (template || {}).generated_content as any;
    const designTokens = (template || {}).design_tokens as any;

    // Prepare preview data
    const previewData = {
      id: (template || {}).id,
      name: (template || {}).name,
      description: (template || {}).description,
      status: (template || {}).status,
      quality_score: (template || {}).quality_score,
      created_at: (template || {}).created_at,
      updated_at: (template || {}).updated_at,
      
      // Content data
      html_content: (template || {}).html_output,
      mjml_code: (template || {}).mjml_code,
      
      // Email metadata
      subject_line: generatedContent?.subject_line || generatedContent?.subject || null,
      preheader_text: generatedContent?.preheader_text || generatedContent?.preheader || null,
      
      // Generation metadata
      metadata: {
        generation_time: generatedContent?.metadata?.generation_time || null,
        token_usage: generatedContent?.metadata?.token_usage || null,
        model: generatedContent?.metadata?.model || 'gpt-4o-mini',
        workflow: generatedContent?.metadata?.workflow || 'Standard',
        flow: generatedContent?.metadata?.flow || 'Email Generation',
        brief_type: generatedContent?.brief_type || null,
        tone: generatedContent?.tone || null,
        target_audience: generatedContent?.target_audience || null,
      },
      
      // Design data
      design_tokens: designTokens || null,
      
      // Performance data
      has_content: Boolean((template || {}).html_output || (template || {}).mjml_code),
      content_length: (template || {}).html_output?.length || 0,
      mjml_length: (template || {}).mjml_code?.length || 0,
    };

    const queryTime = Date.now() - startTime;

    // Set caching headers for preview content
    const response = NextResponse.json(
      {
        success: true,
        data: previewData,
        metadata: {
          query_time: queryTime,
          timestamp: new Date().toISOString(),
          template_id: templateId,
        }
      },
      { status: 200 }
    );

    // Cache for 5 minutes for preview content
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('X-Query-Time', queryTime.toString());
    response.headers.set('X-Template-ID', templateId);

    return response;

  } catch (error) {
    console.error('Template preview error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load template preview',
        code: 'PREVIEW_LOAD_ERROR',
        metadata: {
          query_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/templates/[id]/preview
 * Update template preview content (for real-time editing)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const templateId = params.id;
    const body = await request.json();

    if (!templateId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template ID is required',
          code: 'MISSING_TEMPLATE_ID'
        },
        { status: 400 }
      );
    }

    // Validate input
    const { html_content, mjml_code, subject_line, preheader_text } = body;

    if (!html_content && !mjml_code) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either HTML content or MJML code is required',
          code: 'MISSING_CONTENT'
        },
        { status: 400 }
      );
    }

    // Update template with new content
    const updateData: any = {
      updated_at: new Date(),
    };

    if (html_content) {
      updateData.html_output = html_content;
    }

    if (mjml_code) {
      updateData.mjml_code = mjml_code;
    }

    // Update generated_content with new metadata
    if (subject_line || preheader_text) {
      // First get current generated_content
      const currentTemplate = await db
        .select({ generated_content: email_templates.generated_content })
        .from(email_templates)
        .where(eq(email_templates.id, templateId))
        .limit(1);

      if (currentTemplate.length > 0) {
        const currentContent = (currentTemplate[0].generated_content as any) || {};
        
        updateData.generated_content = {
          ...currentContent,
          ...(subject_line && { subject_line }),
          ...(preheader_text && { preheader_text }),
          metadata: {
            ...currentContent.metadata,
            last_updated: new Date().toISOString(),
            update_type: 'preview_edit'
          }
        };
      }
    }

    // Perform update
    const result = await db
      .update(email_templates)
      .set(updateData)
      .where(eq(email_templates.id, templateId))
      .returning({
        id: email_templates.id,
        name: email_templates.name,
        updated_at: email_templates.updated_at,
      });

    if (result.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template not found or update failed',
          code: 'UPDATE_FAILED'
        },
        { status: 404 }
      );
    }

    const queryTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result[0].id,
          name: result[0].name,
          updated_at: result[0].updated_at,
          content_updated: Boolean(html_content || mjml_code),
          metadata_updated: Boolean(subject_line || preheader_text),
        },
        metadata: {
          query_time: queryTime,
          timestamp: new Date().toISOString(),
          template_id: templateId,
          update_type: 'preview_content'
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Template preview update error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update template preview',
        code: 'PREVIEW_UPDATE_ERROR',
        metadata: {
          query_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}