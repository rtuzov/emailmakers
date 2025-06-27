import { NextRequest, NextResponse } from 'next/server'
import ABTestingService from '../../../lib/ab-testing'

// A/B TESTING API - TEMPORARILY DISABLED
// This API has been disabled as requested by the user

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId') || 'anonymous-' + Date.now()
    const testId = searchParams.get('testId')

    // Return disabled status for all requests
    return NextResponse.json({
      success: false,
      disabled: true,
      message: 'A/B testing framework is currently disabled',
      data: null,
      metadata: {
        userId,
        testId,
        action,
        timestamp: new Date().toISOString(),
        status: 'disabled'
      }
    }, { status: 503 }) // Service Unavailable

    // COMMENTED OUT - Original implementation
    /*
    // Initialize A/B testing service
    ABTestingService.initialize()

    switch (action) {
      case 'config':
        // Get optimized email configuration for user
        const config = ABTestingService.getOptimizedEmailConfig(userId)
        return NextResponse.json({
          success: true,
          data: config,
          metadata: {
            userId,
            timestamp: new Date().toISOString()
          }
        })

      case 'summary':
        // Get active tests summary
        const summary = ABTestingService.getActiveTestsSummary()
        return NextResponse.json({
          success: true,
          data: summary,
          metadata: {
            timestamp: new Date().toISOString()
          }
        })

      case 'results':
        // Get test results
        if (!testId) {
          return NextResponse.json({
            success: false,
            error: 'testId is required for results'
          }, { status: 400 })
        }
        
        const results = ABTestingService.getTestResults(testId)
        return NextResponse.json({
          success: true,
          data: results,
          metadata: {
            testId,
            timestamp: new Date().toISOString()
          }
        })

      default:
        // Default: return user's A/B test assignments
        const legacyConfig = ABTestingService.getRecommendedEmailConfig(userId)
        return NextResponse.json({
          success: true,
          data: legacyConfig,
          metadata: {
            userId,
            timestamp: new Date().toISOString()
          }
        })
    }
    */

  } catch (error) {
    console.error('A/B Testing API Error (Disabled):', error)
    return NextResponse.json({
      success: false,
      disabled: true,
      error: 'A/B testing framework is disabled',
      details: 'Service has been temporarily disabled',
      metadata: {
        timestamp: new Date().toISOString(),
        status: 'disabled'
      }
    }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, testId, data } = body

    // Return disabled status for all POST requests
    return NextResponse.json({
      success: false,
      disabled: true,
      message: 'A/B testing framework is currently disabled - cannot process requests',
      action,
      metadata: {
        userId,
        testId,
        timestamp: new Date().toISOString(),
        status: 'disabled'
      }
    }, { status: 503 }) // Service Unavailable

    // COMMENTED OUT - Original implementation
    /*
    // Initialize A/B testing service
    ABTestingService.initialize()

    switch (action) {
      case 'track-conversion':
        // Track conversion for analytics
        if (!userId || !testId) {
          return NextResponse.json({
            success: false,
            error: 'userId and testId are required for tracking'
          }, { status: 400 })
        }

        ABTestingService.trackConversion(userId, testId)
        return NextResponse.json({
          success: true,
          message: 'Conversion tracked successfully',
          metadata: {
            userId,
            testId,
            timestamp: new Date().toISOString()
          }
        })

      case 'create-test':
        // Create new A/B test
        if (!data || !data.id || !data.name || !data.variants) {
          return NextResponse.json({
            success: false,
            error: 'Test data with id, name, and variants is required'
          }, { status: 400 })
        }

        const newTest = ABTestingService.createTest(data)
        return NextResponse.json({
          success: true,
          data: newTest,
          message: 'A/B test created successfully',
          metadata: {
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action for POST request'
        }, { status: 400 })
    }
    */

  } catch (error) {
    console.error('A/B Testing POST API Error (Disabled):', error)
    return NextResponse.json({
      success: false,
      disabled: true,
      error: 'A/B testing framework is disabled',
      details: 'Service has been temporarily disabled'
    }, { status: 503 })
  }
}