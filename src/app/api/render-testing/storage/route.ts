import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/render-testing/storage
 * Get storage statistics and health status
 * TEMPORARILY DISABLED - Configuration issues during build
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'temporarily_disabled',
      message: 'Storage service temporarily disabled during mock system setup',
      provider: 'mock',
      timestamp: new Date().toISOString(),
      health: {
        status: 'healthy',
        provider: 'mock',
        connectivity: true,
        latency_ms: 0
      },
      stats: {
        total_files: 0,
        total_size_bytes: 0,
        available_space_bytes: 1000000000, // 1GB mock
        used_space_bytes: 0
      }
    });
  } catch (error) {
    console.error('Error getting storage info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get storage information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/render-testing/storage/upload
 * Upload a file to storage
 * TEMPORARILY DISABLED - Configuration issues during build
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' },
        { status: 400 }
      );
    }

    // Mock upload response
    const mockResult = {
      key: key,
      url: `http://localhost:3000/api/mock/s3/email-makers-screenshots/${key}`,
      public_url: `http://localhost:3000/api/mock/s3/email-makers-screenshots/${key}`,
      size: file.size,
      content_type: file.type,
      uploaded_at: new Date().toISOString(),
      provider: 'mock'
    };

    return NextResponse.json({
      success: true,
      result: mockResult,
      note: 'Mock upload - storage service temporarily disabled'
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/render-testing/storage
 * Delete a file from storage
 * TEMPORARILY DISABLED - Configuration issues during build
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'No key provided' },
        { status: 400 }
      );
    }

    // Mock delete response
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully (mock)',
      key,
      note: 'Mock deletion - storage service temporarily disabled'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 