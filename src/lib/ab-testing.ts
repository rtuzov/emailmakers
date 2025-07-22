// A/B TESTING FRAMEWORK - TEMPORARILY DISABLED
// This framework has been disabled as requested by the user
// To re-enable, uncomment the implementation below

interface ABTestVariant {
  id: string
  name: string
  weight: number
  config: Record<string, any>
}

interface ABTest {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'disabled'
  variants: ABTestVariant[]
  startDate: Date
  endDate?: Date
  metrics: {
    impressions: number
    conversions: number
    conversionRate: number
    clickThroughRate: number
    openRate: number
  }
}

interface ABTestResult {
  testId: string
  winningVariant: string
  confidenceLevel: number
  improvementPercent: number
  recommendations: string[]
}

export class ABTestingService {
  private static _tests: Map<string, ABTest> = new Map()
  private static _userAssignments: Map<string, Map<string, string>> = new Map()
  private static _results: Map<string, ABTestResult> = new Map()
  private static _isEnabled = false // DISABLED (renamed to avoid unused warning)

  /**
   * Initialize A/B testing - DISABLED
   */
  static initialize() {
    console.log('🚫 A/B testing service is currently DISABLED')
    this._isEnabled = false
    return
    
    // COMMENTED OUT - Original implementation
    /*
    console.log('🧪 Initializing enhanced A/B testing service...')
    
    // Email Tone Optimization Test
    this.createTest({
      id: 'email-tone-test',
      name: 'Email Tone Optimization',
      description: 'Test different tones for email campaigns',
      variants: [
        {
          id: 'friendly',
          name: 'Friendly Tone',
          weight: 0.33,
          config: {
            tone: 'friendly',
            contentStyle: 'conversational',
            subjectPrefix: '😊',
            personalization: 'high'
          }
        },
        {
          id: 'professional',
          name: 'Professional Tone',
          weight: 0.33,
          config: {
            tone: 'professional',
            contentStyle: 'formal',
            subjectPrefix: '',
            personalization: 'medium'
          }
        },
        {
          id: 'exciting',
          name: 'Exciting Tone',
          weight: 0.34,
          config: {
            tone: 'exciting',
            contentStyle: 'energetic',
            subjectPrefix: '🚀',
            personalization: 'high'
          }
        }
      ]
    })

    // Email Layout Test
    this.createTest({
      id: 'email-layout-test',
      name: 'Email Layout Optimization',
      description: 'Test different layout structures for better engagement',
      variants: [
        {
          id: 'single-column',
          name: 'Single Column Layout',
          weight: 0.5,
          config: {
            layoutType: 'single-column',
            imageStyle: 'full-width',
            ctaStyle: 'primary-button'
          }
        },
        {
          id: 'two-column',
          name: 'Two Column Layout',
          weight: 0.5,
          config: {
            layoutType: 'two-column',
            imageStyle: 'side-by-side',
            ctaStyle: 'inline-link'
          }
        }
      ]
    })

    // Color Scheme Test
    this.createTest({
      id: 'color-scheme-test',
      name: 'Color Scheme Impact',
      description: 'Test different color schemes for brand consistency and engagement',
      variants: [
        {
          id: 'brand-primary',
          name: 'Primary Brand Colors',
          weight: 0.4,
          config: {
            colorScheme: 'brand-primary',
            ctaStyle: 'brand-button'
          }
        },
        {
          id: 'high-contrast',
          name: 'High Contrast',
          weight: 0.3,
          config: {
            colorScheme: 'high-contrast',
            ctaStyle: 'contrast-button'
          }
        },
        {
          id: 'minimal',
          name: 'Minimal Colors',
          weight: 0.3,
          config: {
            colorScheme: 'minimal',
            ctaStyle: 'minimal-button'
          }
        }
      ]
    })

    console.log('✅ Enhanced A/B testing service initialized with 3 active tests')
    */
  }

  /**
   * Create a new A/B test - DISABLED
   */
  static createTest(config: {
    id: string
    name: string
    description: string
    variants: ABTestVariant[]
  }): ABTest {
    console.log('🚫 A/B testing is disabled - cannot create test')
    
    const disabledTest: ABTest = {
      ...config,
      status: 'disabled',
      startDate: new Date(),
      metrics: {
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
        clickThroughRate: 0,
        openRate: 0
      }
    }

    return disabledTest
  }

  /**
   * Assign user to a test variant - DISABLED
   */
  static assignUserToVariant(_testId: string, _userId: string): ABTestVariant | null {
    console.log('🚫 A/B testing is disabled - returning null variant')
    return null
  }

  /**
   * Get comprehensive email configuration - RETURNS DEFAULTS
   */
  static getOptimizedEmailConfig(_userId: string): {
    tone: string
    contentStyle: string
    subjectPrefix: string
    layoutType: string
    imageStyle: string
    ctaStyle: string
    colorScheme: string
    personalization: string
    testVariants: string[]
    disabled: boolean
  } {
    console.log('🚫 A/B testing disabled - returning default email configuration')
    
    return {
      tone: 'friendly',
      contentStyle: 'conversational',
      subjectPrefix: '',
      layoutType: 'single-column',
      imageStyle: 'full-width',
      ctaStyle: 'primary-button',
      colorScheme: 'brand-primary',
      personalization: 'medium',
      testVariants: [],
      disabled: true
    }
  }

  /**
   * Legacy method for backward compatibility - RETURNS DEFAULTS
   */
  static getRecommendedEmailConfig(_userId: string): {
    tone: string
    contentStyle: string
    subjectPrefix: string
    layoutType: string
    imageStyle: string
    ctaStyle: string
    colorScheme: string
    personalization: string
    testVariants: string[]
    disabled: boolean
  } {
    return this.getOptimizedEmailConfig(_userId)
  }

  /**
   * Track conversion - DISABLED
   */
  static trackConversion(_userId: string, _testId: string) {
    console.log('🚫 A/B testing disabled - conversion tracking skipped')
    return
  }

  /**
   * Get test results - RETURNS EMPTY
   */
  static getTestResults(_testId: string): ABTestResult | null {
    console.log('🚫 A/B testing disabled - no test results available')
    return null
  }

  /**
   * Get all active tests summary - RETURNS EMPTY
   */
  static getActiveTestsSummary() {
    console.log('🚫 A/B testing disabled - returning empty summary')
    
    return {
      totalTests: 0,
      totalImpressions: 0,
      totalConversions: 0,
      averageConversionRate: 0,
      disabled: true,
      tests: []
    }
  }
}

export default ABTestingService