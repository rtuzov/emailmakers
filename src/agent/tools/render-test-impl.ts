/**
 * Render Test Tool Implementation (No OpenAI Agent SDK)
 */

interface RenderTestParams {
  html: string;
  subject: string;
}

interface RenderTestResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function renderTestImpl(params: RenderTestParams): Promise<RenderTestResult> {
  try {
    const { html, subject } = params;
    
    const validation = validateEmailHTML(html);
    const compatibility = checkEmailCompatibility(html);
    const performance = analyzePerformance(html);
    
    const overallScore = Math.round(
      (validation.score * 0.4 + compatibility.score * 0.4 + performance.score * 0.2)
    );

    return {
      success: true,
      data: {
        validation_score: overallScore,
        issues: [
          ...validation.issues,
          ...compatibility.issues,
          ...performance.issues
        ],
        compatibility: getCompatibilityRating(overallScore),
        details: {
          html_validation: validation,
          email_compatibility: compatibility,
          performance_analysis: performance
        },
        recommendations: generateRecommendations(validation, compatibility, performance)
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Render test error'
    };
  }
}

function validateEmailHTML(html: string) {
  const issues: string[] = [];
  let score = 100;

  // Check DOCTYPE
  if (!html.includes('<!DOCTYPE html PUBLIC')) {
    issues.push('Missing proper email DOCTYPE');
    score -= 15;
  }

  // Check table-based layout
  if (!html.includes('<table')) {
    issues.push('Should use table-based layout for email compatibility');
    score -= 20;
  }

  // Check for flexbox (bad for email)
  if (html.includes('display: flex') || html.includes('display:flex')) {
    issues.push('Flexbox not supported in email clients');
    score -= 25;
  }

  // Check width
  if (html.includes('width: 800px') || html.includes('width:800px')) {
    issues.push('Width exceeds recommended 600-640px limit');
    score -= 10;
  }

  // Check for inline CSS
  const inlineStylesCount = (html.match(/style="/g) || []).length;
  if (inlineStylesCount < 5) {
    issues.push('Consider using more inline styles for better compatibility');
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    inline_styles_count: inlineStylesCount
  };
}

function checkEmailCompatibility(html: string) {
  const issues: string[] = [];
  let score = 100;

  // Check meta viewport
  if (!html.includes('meta name="viewport"')) {
    issues.push('Missing viewport meta tag for mobile');
    score -= 10;
  }

  // Check for CSS3 features that might not work
  if (html.includes('border-radius') || html.includes('box-shadow')) {
    issues.push('CSS3 features may not work in older email clients');
    score -= 5;
  }

  // Check for media queries
  if (!html.includes('@media')) {
    issues.push('Consider adding media queries for responsive design');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    responsive: html.includes('@media'),
    mobile_optimized: html.includes('meta name="viewport"')
  };
}

function analyzePerformance(html: string) {
  const issues: string[] = [];
  let score = 100;

  const htmlSize = Buffer.byteLength(html, 'utf8');
  const htmlSizeKB = htmlSize / 1024;

  // Check file size
  if (htmlSizeKB > 100) {
    issues.push(`HTML size (${htmlSizeKB.toFixed(1)}KB) exceeds 100KB Gmail limit`);
    score -= 20;
  } else if (htmlSizeKB > 80) {
    issues.push(`HTML size (${htmlSizeKB.toFixed(1)}KB) approaching 100KB limit`);
    score -= 10;
  }

  // Check image count
  const imageCount = (html.match(/<img/g) || []).length;
  if (imageCount > 10) {
    issues.push(`Too many images (${imageCount}), consider reducing`);
    score -= 10;
  }

  // Check for external resources
  const externalResources = (html.match(/src="http/g) || []).length;
  if (externalResources > 5) {
    issues.push(`Many external resources (${externalResources}), may slow loading`);
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    file_size_kb: htmlSizeKB,
    image_count: imageCount,
    external_resources: externalResources,
    estimated_load_time: estimateLoadTime(htmlSizeKB, imageCount)
  };
}

function getCompatibilityRating(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

function estimateLoadTime(sizeKB: number, imageCount: number): string {
  // Simple estimation based on size and image count
  const baseTime = sizeKB * 10; // 10ms per KB
  const imageTime = imageCount * 200; // 200ms per image
  const totalMs = baseTime + imageTime;
  
  if (totalMs < 1000) return `${Math.round(totalMs)}ms`;
  return `${(totalMs / 1000).toFixed(1)}s`;
}

function generateRecommendations(validation: any, compatibility: any, performance: any): string[] {
  const recommendations: string[] = [];

  if (validation.score < 80) {
    recommendations.push('Improve HTML validation by using proper email DOCTYPE and table layout');
  }

  if (!compatibility.responsive) {
    recommendations.push('Add media queries for better mobile experience');
  }

  if (performance.file_size_kb > 80) {
    recommendations.push('Optimize file size by reducing HTML content or compressing images');
  }

  if (performance.image_count > 5) {
    recommendations.push('Consider reducing number of images for faster loading');
  }

  if (recommendations.length === 0) {
    recommendations.push('Email template looks good! Consider testing in actual email clients');
  }

  return recommendations;
}