import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Screenshots API
 * Handles requests to /api/mock/screenshots/* and returns mock screenshot data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    console.log('📸 Mock screenshot requested:', path);

    // Parse the requested screenshot path
    const [filename] = path.split('/').slice(-1);
    const [client, platform, timestamp] = filename.replace('.png', '').split('-');

    // Generate mock screenshot metadata
    const mockScreenshot = {
      filename,
      client: client || 'gmail',
      platform: platform || 'desktop',
      timestamp: timestamp || Date.now().toString(),
      dimensions: getDimensionsForPlatform(platform),
      compatibility_score: getCompatibilityScore(client),
      status: 'rendered',
      url: `${request.nextUrl.origin}/api/mock/screenshots/${path}`,
      mock: true,
      generated_at: new Date().toISOString()
    };

    // Return mock image response headers
    const mockData = generateMockImageData(mockScreenshot);
    const response = new NextResponse(JSON.stringify(mockData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Screenshot': 'true',
        'X-Client': mockScreenshot.client,
        'X-Platform': mockScreenshot.platform,
        'Cache-Control': 'no-cache'
      }
    });

    return response;

  } catch (error) {
    console.error('❌ Mock screenshot error:', error);
    return NextResponse.json({
      error: 'Mock screenshot generation failed',
      path: params.path.join('/'),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getDimensionsForPlatform(platform: string) {
  const dimensions = {
    'desktop': { width: 1280, height: 800 },
    'mobile': { width: 375, height: 667 },
    'tablet': { width: 768, height: 1024 }
  };
  return dimensions[platform] || dimensions.desktop;
}

function getCompatibilityScore(client: string) {
  const scores = {
    'gmail': 95,
    'outlook': 88,
    'apple-mail': 92,
    'yahoo-mail': 85,
    'thunderbird': 90
  };
  return scores[client] || 85;
}

function generateMockImageData(screenshot: any) {
  return {
    type: 'mock_screenshot',
    data: screenshot,
    message: 'This is a mock screenshot for development/testing purposes',
    note: 'In production, this would return actual PNG image data',
    alternatives: {
      placeholder_url: `https://via.placeholder.com/${screenshot.dimensions.width}x${screenshot.dimensions.height}/4285f4/ffffff?text=${screenshot.client}+${screenshot.platform}`,
      mock_data_url: `data:image/svg+xml;base64,${Buffer.from(generateMockSVG(screenshot)).toString('base64')}`
    }
  };
}

function generateMockSVG(screenshot: any): string {
  return `<svg width="${screenshot.dimensions.width}" height="${screenshot.dimensions.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f8f9fa"/>
    <rect x="20" y="20" width="${screenshot.dimensions.width - 40}" height="60" fill="#4285f4" rx="5"/>
    <text x="30" y="50" font-family="Arial, sans-serif" font-size="16" fill="white">
      ${screenshot.client.toUpperCase()} - ${screenshot.platform.toUpperCase()}
    </text>
    <text x="30" y="70" font-family="Arial, sans-serif" font-size="12" fill="white">
      Compatibility Score: ${screenshot.compatibility_score}%
    </text>
    <rect x="20" y="100" width="${screenshot.dimensions.width - 40}" height="${screenshot.dimensions.height - 140}" fill="white" stroke="#e0e0e0"/>
    <text x="30" y="130" font-family="Arial, sans-serif" font-size="14" fill="#666">
      Mock Email Content Rendered in ${screenshot.client}
    </text>
    <text x="30" y="160" font-family="Arial, sans-serif" font-size="12" fill="#999">
      This is a mock screenshot for testing purposes
    </text>
    <text x="30" y="${screenshot.dimensions.height - 30}" font-family="Arial, sans-serif" font-size="10" fill="#ccc">
      Generated: ${new Date().toLocaleString()}
    </text>
  </svg>`;
} 