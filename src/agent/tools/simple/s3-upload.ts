/**
 * ☁️ S3 UPLOAD - Simple Tool
 * 
 * Простая загрузка файлов в S3 с metadata
 * Заменяет часть функциональности delivery-manager
 */

import { z } from 'zod';
import { uploadToS3 } from '../upload';

export const s3UploadSchema = z.object({
  file_content: z.string().describe('File content to upload (HTML, image data, etc.)'),
  file_name: z.string().describe('Name for the uploaded file'),
  file_type: z.enum(['html', 'image', 'pdf', 'json', 'text']).describe('Type of file being uploaded'),
  upload_config: z.object({
    bucket_path: z.string().optional().nullable().describe('S3 bucket path (defaults to email-templates)'),
    public_access: z.boolean().default(false).describe('Whether file should be publicly accessible'),
    cache_control: z.string().optional().nullable().describe('Cache control headers'),
    content_encoding: z.string().optional().nullable().describe('Content encoding (gzip, etc.)')
  }).optional().nullable().describe('Upload configuration options'),
  metadata: z.object({
    campaign_id: z.string().optional(),
    template_version: z.string().optional(),
    created_by: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional().nullable().describe('File metadata for organization')
});

export type S3UploadParams = z.infer<typeof s3UploadSchema>;

export interface S3UploadResult {
  success: boolean;
  upload_result: {
    file_url: string;
    bucket_name: string;
    key: string;
    size_bytes: number;
    content_type: string;
    last_modified: string;
    etag: string;
  };
  upload_metadata: {
    upload_duration: number;
    compression_ratio?: number;
    security_scan: {
      safe: boolean;
      scan_results: string[];
    };
    access_info: {
      public_url?: string;
      signed_url?: string;
      expires_at?: string;
    };
  };
  error?: string;
}

export async function s3Upload(params: S3UploadParams): Promise<S3UploadResult> {
  const startTime = Date.now();
  
  try {
    console.log('☁️ Uploading to S3:', {
      file_name: params.file_name,
      file_type: params.file_type,
      size_kb: Math.round(params.file_content.length / 1024)
    });

    // Prepare file content and determine content type
    const contentType = getContentType(params.file_type);
    let processedContent = params.file_content;
    let compressionRatio = undefined;

    // Apply compression if beneficial
    if (shouldCompress(params.file_type, params.file_content.length)) {
      const compressed = await compressContent(params.file_content, params.file_type);
      if (compressed.success) {
        processedContent = compressed.content;
        compressionRatio = compressed.ratio;
      }
    }

    // Security scan for malicious content
    const securityScan = performSecurityScan(processedContent, params.file_type);
    if (!securityScan.safe) {
      return {
        success: false,
        upload_result: {
          file_url: '',
          bucket_name: '',
          key: '',
          size_bytes: 0,
          content_type: '',
          last_modified: '',
          etag: ''
        },
        upload_metadata: {
          upload_duration: Date.now() - startTime,
          compression_ratio,
          security_scan: securityScan,
          access_info: {}
        },
        error: `Security scan failed: ${securityScan.scan_results.join(', ')}`
      };
    }

    // Build upload parameters
    const uploadParams = {
      file_content: processedContent,
      file_name: params.file_name,
      content_type: contentType,
      bucket_path: params.upload_config?.bucket_path || 'email-templates',
      public_read: params.upload_config?.public_access || false,
      metadata: {
        ...params.metadata,
        original_size: params.file_content.length.toString(),
        upload_timestamp: new Date().toISOString(),
        file_type: params.file_type
      },
      cache_control: params.upload_config?.cache_control,
      content_encoding: params.upload_config?.content_encoding
    };

    // Perform the actual upload
    const uploadResult = await uploadToS3(uploadParams);

    if (!uploadResult.success) {
      return {
        success: false,
        upload_result: {
          file_url: '',
          bucket_name: '',
          key: '',
          size_bytes: 0,
          content_type: '',
          last_modified: '',
          etag: ''
        },
        upload_metadata: {
          upload_duration: Date.now() - startTime,
          compression_ratio,
          security_scan: securityScan,
          access_info: {}
        },
        error: uploadResult.error || 'Upload failed'
      };
    }

    // Generate access information
    const accessInfo = generateAccessInfo(uploadResult, params.upload_config);

    const uploadDuration = Date.now() - startTime;

    return {
      success: true,
      upload_result: {
        file_url: uploadResult.file_url,
        bucket_name: uploadResult.bucket || 'email-makers-assets',
        key: uploadResult.key || params.file_name,
        size_bytes: processedContent.length,
        content_type: contentType,
        last_modified: new Date().toISOString(),
        etag: uploadResult.etag || generateETag(processedContent)
      },
      upload_metadata: {
        upload_duration: uploadDuration,
        compression_ratio,
        security_scan: securityScan,
        access_info: accessInfo
      }
    };

  } catch (error) {
    const uploadDuration = Date.now() - startTime;
    console.error('❌ S3 upload failed:', error);

    return {
      success: false,
      upload_result: {
        file_url: '',
        bucket_name: '',
        key: '',
        size_bytes: 0,
        content_type: '',
        last_modified: '',
        etag: ''
      },
      upload_metadata: {
        upload_duration: uploadDuration,
        security_scan: {
          safe: false,
          scan_results: ['Upload process failed']
        },
        access_info: {}
      },
      error: error instanceof Error ? error.message : 'Unknown S3 upload error'
    };
  }
}

function getContentType(fileType: string): string {
  const contentTypes = {
    html: 'text/html; charset=utf-8',
    image: 'image/png',
    pdf: 'application/pdf',
    json: 'application/json',
    text: 'text/plain; charset=utf-8'
  };

  return contentTypes[fileType as keyof typeof contentTypes] || 'application/octet-stream';
}

function shouldCompress(fileType: string, contentLength: number): boolean {
  // Compress text-based files over 1KB
  const compressibleTypes = ['html', 'json', 'text'];
  return compressibleTypes.includes(fileType) && contentLength > 1024;
}

async function compressContent(content: string, fileType: string): Promise<{ success: boolean; content: string; ratio: number }> {
  try {
    // Simplified compression simulation
    // In real implementation, would use gzip or similar
    let compressed = content;
    
    if (fileType === 'html') {
      // Remove unnecessary whitespace
      compressed = content
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    } else if (fileType === 'json') {
      // Minify JSON
      try {
        const parsed = JSON.parse(content);
        compressed = JSON.stringify(parsed);
      } catch {
        // If JSON parsing fails, just trim whitespace
        compressed = content.replace(/\s+/g, ' ').trim();
      }
    }

    const originalSize = content.length;
    const compressedSize = compressed.length;
    const ratio = originalSize > 0 ? compressedSize / originalSize : 1;

    return {
      success: ratio < 0.9, // Only use if we achieved >10% compression
      content: ratio < 0.9 ? compressed : content,
      ratio: Math.round(ratio * 100) / 100
    };

  } catch (error) {
    console.warn('Compression failed:', error);
    return {
      success: false,
      content,
      ratio: 1
    };
  }
}

function performSecurityScan(content: string, fileType: string): { safe: boolean; scan_results: string[] } {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();

  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // event handlers
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push(`Potentially dangerous pattern detected: ${pattern.source}`);
    }
  });

  // File type specific checks
  if (fileType === 'html') {
    if (lowerContent.includes('<form') && lowerContent.includes('action=')) {
      issues.push('HTML form with action detected - potential security risk');
    }
  }

  // Check file size (prevent huge uploads)
  if (content.length > 10 * 1024 * 1024) { // 10MB limit
    issues.push('File size exceeds maximum allowed size');
  }

  return {
    safe: issues.length === 0,
    scan_results: issues
  };
}

function generateAccessInfo(uploadResult: any, uploadConfig?: any): any {
  const accessInfo: any = {};

  if (uploadConfig?.public_access) {
    accessInfo.public_url = uploadResult.file_url;
  } else {
    // Generate signed URL for private access (simplified)
    accessInfo.signed_url = `${uploadResult.file_url}?signature=temp_signed_url`;
    accessInfo.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  }

  return accessInfo;
}

function generateETag(content: string): string {
  // Simplified ETag generation
  const hash = Buffer.from(content).toString('base64').substring(0, 16);
  return `"${hash}"`;
}