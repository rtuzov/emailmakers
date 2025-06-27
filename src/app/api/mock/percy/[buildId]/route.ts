import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Percy API
 * Handles requests to /api/mock/percy/{buildId} and returns mock Percy build data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { buildId: string } }
) {
  try {
    const { buildId } = params;
    console.log('🎭 Mock Percy build requested:', buildId);

    // Generate mock Percy build data
    const mockBuild = generateMockPercyBuild(buildId);

    return NextResponse.json(mockBuild, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Percy': 'true',
        'X-Build-ID': buildId,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Mock Percy error:', error);
    return NextResponse.json({
      error: 'Mock Percy build generation failed',
      buildId: params.buildId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateMockPercyBuild(buildId: string) {
  const timestamp = new Date().toISOString();
  const snapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Simulate visual diff analysis
  const diffPercentage = Math.floor(Math.random() * 5); // 0-5% diff
  const hasVisualDiff = diffPercentage > 1;
  const status = diffPercentage <= 1 ? 'approved' : 'pending';

  return {
    type: 'mock_percy_build',
    data: {
      id: buildId,
      attributes: {
        'build-number': parseInt(buildId.replace(/\D/g, '')) || 1,
        branch: 'main',
        'created-at': timestamp,
        'finished-at': timestamp,
        state: 'finished',
        'review-state': status,
        'review-state-reason': status === 'approved' ? 'auto-approved' : 'visual-changes-detected',
        'total-snapshots': 3,
        'total-snapshots-unreviewed': status === 'pending' ? 1 : 0,
        'failure-reason': null,
        'failure-details': null,
        'web-url': `http://localhost:3000/mock/percy/${buildId}`,
        'user-agent': 'Mock Percy Agent v1.0'
      },
      relationships: {
        snapshots: {
          data: [
            {
              type: 'snapshot',
              id: snapshotId,
              attributes: {
                name: 'Email Template - Desktop',
                'review-state': status,
                'review-state-reason': status === 'approved' ? 'auto-approved' : 'visual-changes-detected',
                'diff-ratio': diffPercentage / 100,
                'created-at': timestamp,
                'updated-at': timestamp
              }
            }
          ]
        }
      }
    },
    snapshots: [
      {
        id: snapshotId,
        name: 'Email Template - Desktop',
        status: status,
        diff_percentage: diffPercentage,
        visual_diff_detected: hasVisualDiff,
        screenshots: {
          desktop: `http://localhost:3000/api/mock/screenshots/email-desktop-${Date.now()}.png`,
          mobile: `http://localhost:3000/api/mock/screenshots/email-mobile-${Date.now()}.png`,
          tablet: `http://localhost:3000/api/mock/screenshots/email-tablet-${Date.now()}.png`
        },
        comparison_url: `http://localhost:3000/mock/percy/${buildId}/comparisons/${snapshotId}`,
        created_at: timestamp
      }
    ],
    build_summary: {
      total_snapshots: 3,
      approved_snapshots: status === 'approved' ? 3 : 2,
      pending_snapshots: status === 'pending' ? 1 : 0,
      rejected_snapshots: 0,
      overall_status: status,
      visual_changes_detected: hasVisualDiff,
      average_diff_percentage: diffPercentage,
      build_duration_ms: 2500,
      percy_version: 'mock-v1.0.0'
    },
    mock_metadata: {
      generated_at: timestamp,
      mock_service: 'percy',
      note: 'This is mock data for development/testing purposes',
      real_service_url: 'https://percy.io'
    }
  };
} 