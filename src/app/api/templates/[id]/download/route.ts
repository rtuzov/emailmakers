import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/connection';
import { email_templates } from '@/shared/infrastructure/database/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/templates/[id]/download?format=html|mjml|both
 * Download template content in specified format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const templateId = params.id;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'html';

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

    // Validate format parameter
    if (!['html', 'mjml', 'both'].includes(format)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid format. Must be html, mjml, or both',
          code: 'INVALID_FORMAT'
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
        mjml_code: email_templates.mjml_code,
        html_output: email_templates.html_output,
        generated_content: email_templates.generated_content,
        status: email_templates.status,
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
    const generatedContent = (template || {}).generated_content as any;

    // Check if template has the requested content
    if (format === 'html' && !(template || {}).html_output) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'HTML content not available for this template',
          code: 'HTML_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    if (format === 'mjml' && !(template || {}).mjml_code) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MJML content not available for this template',
          code: 'MJML_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    if (format === 'both' && !(template || {}).html_output && !(template || {}).mjml_code) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No content available for this template',
          code: 'NO_CONTENT_AVAILABLE'
        },
        { status: 404 }
      );
    }

    // Generate safe filename with enhanced security
    const safeName = (template || {}).name
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/script|javascript|vbscript|onload|onerror|onclick/gi, '') // Remove dangerous keywords
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
      .toLowerCase()
      .substring(0, 50); // Limit length to prevent filesystem issues
    
    // Fallback to UUID if name becomes empty after sanitization
    const fileName = safeName || `template-${(template || {}).id.split('-')[0]}`;
    const timestamp = new Date().toISOString().split('T')[0];

    const queryTime = Date.now() - startTime;

    // Handle different download formats
    switch (format) {
      case 'html': {
        const filename = `${fileName}-${timestamp}.html`;
        const response = new NextResponse((template || {}).html_output, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Template-ID': templateId,
            'X-Query-Time': queryTime.toString(),
            'X-Download-Format': 'html'
          }
        });
        return response;
      }

      case 'mjml': {
        const filename = `${fileName}-${timestamp}.mjml`;
        const response = new NextResponse((template || {}).mjml_code, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Template-ID': templateId,
            'X-Query-Time': queryTime.toString(),
            'X-Download-Format': 'mjml'
          }
        });
        return response;
      }

      case 'both': {
        // Create a ZIP file containing both formats
        const JSZip = require('jszip');
        const zip = new JSZip();

        // Add HTML if available
        if ((template || {}).html_output) {
          zip.file(`${fileName}-${timestamp}.html`, (template || {}).html_output);
        }

        // Add MJML if available
        if ((template || {}).mjml_code) {
          zip.file(`${fileName}-${timestamp}.mjml`, (template || {}).mjml_code);
        }

        // Add metadata file
        const metadata = {
          template: {
            id: (template || {}).id,
            name: (template || {}).name,
            description: (template || {}).description,
            status: (template || {}).status,
            created_at: (template || {}).created_at,
            updated_at: (template || {}).updated_at
          },
          email_details: {
            subject_line: generatedContent?.subject_line || null,
            preheader_text: generatedContent?.preheader_text || null,
          },
          generation_metadata: generatedContent?.metadata || null,
          download_info: {
            format: 'both',
            downloaded_at: new Date().toISOString(),
            query_time: queryTime
          }
        };

        zip.file(`${fileName}-${timestamp}-metadata.json`, JSON.stringify(metadata, null, 2));

        // Generate ZIP buffer
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const filename = `${fileName}-${timestamp}.zip`;

        const response = new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Template-ID': templateId,
            'X-Query-Time': queryTime.toString(),
            'X-Download-Format': 'both'
          }
        });
        return response;
      }

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unsupported format',
            code: 'UNSUPPORTED_FORMAT'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Template download error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download template',
        code: 'DOWNLOAD_ERROR',
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
 * POST /api/templates/[id]/download
 * Download template with custom options and packaging
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();

  try {
    const templateId = params.id;
    const body = await request.json();
    const { 
      format = 'html',
      include_metadata = true,
      include_images = false,
      filename_prefix = '',
      packaging = 'single' // 'single' or 'zip'
    } = body;

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
        mjml_code: email_templates.mjml_code,
        html_output: email_templates.html_output,
        generated_content: email_templates.generated_content,
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
    const generatedContent = (template || {}).generated_content as any;

    // Generate safe filename with enhanced security
    const baseFileName = (template || {}).name
      .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/script|javascript|vbscript|onload|onerror|onclick/gi, '') // Remove dangerous keywords
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-+|-+$/g, '') // Trim leading/trailing dashes
      .toLowerCase()
      .substring(0, 50); // Limit length to prevent filesystem issues
    
    // Fallback to UUID if name becomes empty after sanitization
    const sanitizedName = baseFileName || `template-${(template || {}).id.split('-')[0]}`;
    const safeName = (filename_prefix ? filename_prefix + '-' : '') + sanitizedName;
    const timestamp = new Date().toISOString().split('T')[0];

    const queryTime = Date.now() - startTime;

    if (packaging === 'zip' || format === 'both' || include_metadata || include_images) {
      // Create ZIP package
      const JSZip = require('jszip');
      const zip = new JSZip();

      // Add requested content
      if (format === 'html' || format === 'both') {
        if ((template || {}).html_output) {
          zip.file(`${safeName}-${timestamp}.html`, (template || {}).html_output);
        }
      }

      if (format === 'mjml' || format === 'both') {
        if ((template || {}).mjml_code) {
          zip.file(`${safeName}-${timestamp}.mjml`, (template || {}).mjml_code);
        }
      }

      // Add metadata if requested
      if (include_metadata) {
        const metadata = {
          template: {
            id: (template || {}).id,
            name: (template || {}).name,
            description: (template || {}).description,
            status: (template || {}).status,
            quality_score: (template || {}).quality_score,
            created_at: (template || {}).created_at,
            updated_at: (template || {}).updated_at
          },
          email_details: {
            subject_line: generatedContent?.subject_line || null,
            preheader_text: generatedContent?.preheader_text || null,
          },
          generation_metadata: generatedContent?.metadata || null,
          design_tokens: (template || {}).design_tokens || null,
          download_info: {
            format,
            packaging,
            include_metadata,
            include_images,
            downloaded_at: new Date().toISOString(),
            query_time: queryTime
          }
        };

        zip.file(`${safeName}-${timestamp}-metadata.json`, JSON.stringify(metadata, null, 2));
      }

      // TODO: Add image extraction logic if include_images is true
      // This would require parsing HTML/MJML for image references and downloading them

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const filename = `${safeName}-${timestamp}.zip`;

      const response = new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Template-ID': templateId,
          'X-Query-Time': queryTime.toString(),
          'X-Download-Format': format,
          'X-Packaging': packaging
        }
      });

      return response;
    } else {
      // Single file download
      if (format === 'html' && (template || {}).html_output) {
        const filename = `${safeName}-${timestamp}.html`;
        return new NextResponse((template || {}).html_output, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Template-ID': templateId,
            'X-Query-Time': queryTime.toString(),
            'X-Download-Format': 'html'
          }
        });
      }

      if (format === 'mjml' && (template || {}).mjml_code) {
        const filename = `${safeName}-${timestamp}.mjml`;
        return new NextResponse((template || {}).mjml_code, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'X-Template-ID': templateId,
            'X-Query-Time': queryTime.toString(),
            'X-Download-Format': 'mjml'
          }
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Requested content not available',
          code: 'CONTENT_NOT_AVAILABLE'
        },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Template download error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download template',
        code: 'DOWNLOAD_ERROR',
        metadata: {
          query_time: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}