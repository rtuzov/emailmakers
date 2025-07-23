// import { simpleParser } from 'mailparser'; // Currently unused
import { MetricsService } from '../../../shared/infrastructure/monitoring/metrics-service';

export interface SpamRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  category: 'content' | 'structure' | 'authentication' | 'reputation';
}

export interface SpamViolation {
  rule: SpamRule;
  matched: boolean;
  details: string;
  impact: number;
}

export interface DeliverabilityIssue {
  type: 'spam_trigger' | 'authentication' | 'content' | 'structure' | 'reputation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  impact: string;
}

export interface SpamAnalysisResult {
  spamScore: number;
  deliverabilityScore: number;
  classification: 'excellent' | 'good' | 'fair' | 'poor' | 'spam';
  violations: SpamViolation[];
  issues: DeliverabilityIssue[];
  recommendations: string[];
  clientSpecificAnalysis: {
    gmail: { score: number; issues: string[] };
    outlook: { score: number; issues: string[] };
    yahoo: { score: number; issues: string[] };
    appleMail: { score: number; issues: string[] };
  };
}

export interface SpamAnalysisOptions {
  includeAuthentication?: boolean;
  checkReputation?: boolean;
  analyzeContent?: boolean;
  checkStructure?: boolean;
  strictMode?: boolean;
}

export class SpamAnalysisService {
  private spamRules: SpamRule[] = [];

  constructor(private metricsService: MetricsService) {
    this.initializeSpamRules();
  }

  /**
   * Analyze email for spam characteristics and deliverability
   */
  async analyzeEmailSpam(
    htmlContent: string,
    subject: string,
    fromEmail: string,
    options: SpamAnalysisOptions = {}
  ): Promise<SpamAnalysisResult> {
    const startTime = Date.now();

    try {
      // Parse email content
      const emailData = await this.parseEmailContent(htmlContent, subject, fromEmail);

      // Run spam rule analysis
      const violations = await this.checkSpamRules(emailData, options);

      // Analyze deliverability issues
      const issues = this.analyzeDeliverabilityIssues(emailData, violations);

      // Generate recommendations
      const recommendations = this.generateSpamRecommendations(violations, issues);

      // Calculate scores
      const spamScore = this.calculateSpamScore(violations);
      const deliverabilityScore = this.calculateDeliverabilityScore(spamScore, issues);

      // Classify email
      const classification = this.classifyEmail(spamScore, deliverabilityScore);

      // Client-specific analysis
      const clientSpecificAnalysis = this.analyzeClientSpecificIssues(emailData, violations);

      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('spam.analysis.duration', duration);

      return {
        spamScore,
        deliverabilityScore,
        classification,
        violations,
        issues,
        recommendations,
        clientSpecificAnalysis,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.metricsService.recordDuration('spam.analysis.duration', duration, { success: 'false' });

      throw new Error(`Spam analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize spam detection rules
   */
  private initializeSpamRules(): void {
    this.spamRules = [
      // Content-based rules
      {
        id: 'excessive_caps',
        name: 'Excessive Capital Letters',
        description: 'Too many capital letters in subject or content',
        weight: 2.0,
        category: 'content',
      },
      {
        id: 'spam_words',
        name: 'Spam Keywords',
        description: 'Contains common spam trigger words',
        weight: 3.0,
        category: 'content',
      },
      {
        id: 'excessive_exclamation',
        name: 'Excessive Exclamation Marks',
        description: 'Too many exclamation marks',
        weight: 1.5,
        category: 'content',
      },
      {
        id: 'suspicious_urls',
        name: 'Suspicious URLs',
        description: 'Contains suspicious or shortened URLs',
        weight: 4.0,
        category: 'content',
      },

      // Structure-based rules
      {
        id: 'html_to_text_ratio',
        name: 'Poor HTML to Text Ratio',
        description: 'Too much HTML markup compared to text content',
        weight: 2.5,
        category: 'structure',
      },
      {
        id: 'excessive_images',
        name: 'Excessive Images',
        description: 'Too many images relative to text content',
        weight: 2.0,
        category: 'structure',
      },

      // Authentication rules
      {
        id: 'missing_spf',
        name: 'Missing SPF Record',
        description: 'Domain lacks SPF authentication',
        weight: 3.0,
        category: 'authentication',
      },
      {
        id: 'missing_dkim',
        name: 'Missing DKIM Signature',
        description: 'Email lacks DKIM authentication',
        weight: 2.5,
        category: 'authentication',
      },
    ];
  }

  /**
   * Parse email content for analysis
   */
  private async parseEmailContent(
    htmlContent: string,
    subject: string,
    fromEmail: string
  ): Promise<{
    html: string;
    text: string;
    subject: string;
    from: string;
    links: string[];
    images: string[];
    textLength: number;
    htmlLength: number;
  }> {
    // Extract text content from HTML
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract links
    const linkMatches = htmlContent.match(/href\s*=\s*["']([^"']+)["']/gi) || [];
    const links = linkMatches.map(match => {
      const urlMatch = match.match(/href\s*=\s*["']([^"']+)["']/i);
      return urlMatch ? urlMatch[1] : '';
    }).filter((url): url is string => Boolean(url));

    // Extract images
    const imageMatches = htmlContent.match(/src\s*=\s*["']([^"']+)["']/gi) || [];
    const images = imageMatches.map(match => {
      const srcMatch = match.match(/src\s*=\s*["']([^"']+)["']/i);
      return srcMatch ? srcMatch[1] : '';
    }).filter((src): src is string => Boolean(src) && typeof src === 'string' && (src.includes('.jpg') || src.includes('.png') || src.includes('.gif') || src.includes('.webp')));

    return {
      html: htmlContent,
      text: textContent,
      subject,
      from: fromEmail,
      links,
      images,
      textLength: textContent.length,
      htmlLength: htmlContent.length,
    };
  }

  /**
   * Check email against spam rules
   */
  private async checkSpamRules(
    emailData: any,
    options: SpamAnalysisOptions
  ): Promise<SpamViolation[]> {
    const violations: SpamViolation[] = [];

    for (const rule of this.spamRules) {
      // Skip certain categories based on options
      if (!options.analyzeContent && rule.category === 'content') continue;
      if (!options.checkStructure && rule.category === 'structure') continue;
      if (!options.includeAuthentication && rule.category === 'authentication') continue;
      if (!options.checkReputation && rule.category === 'reputation') continue;

      const violation = await this.checkRule(rule, emailData, options);
      violations.push(violation);
    }

    return violations;
  }

  /**
   * Check individual spam rule
   */
  private async checkRule(
    rule: SpamRule,
    emailData: any,
    options: SpamAnalysisOptions
  ): Promise<SpamViolation> {
    let matched = false;
    let details = '';
    let impact = 0;

    switch (rule.id) {
      case 'excessive_caps':
        const capsRatio = this.calculateCapsRatio(emailData.subject + ' ' + emailData.text);
        if (capsRatio > 0.3) {
          matched = true;
          details = `${Math.round(capsRatio * 100)}% capital letters detected`;
          impact = rule.weight * capsRatio;
        }
        break;

      case 'spam_words':
        const spamWords = this.detectSpamWords(emailData.subject + ' ' + emailData.text);
        if (spamWords.length > 0) {
          matched = true;
          details = `Spam words detected: ${spamWords.join(', ')}`;
          impact = rule.weight * Math.min(spamWords.length, 3);
        }
        break;

      case 'excessive_exclamation':
        const exclamationCount = (emailData.subject + ' ' + emailData.text).match(/!/g)?.length || 0;
        if (exclamationCount > 3) {
          matched = true;
          details = `${exclamationCount} exclamation marks detected`;
          impact = rule.weight * Math.min(exclamationCount / 3, 2);
        }
        break;

      case 'suspicious_urls':
        const suspiciousUrls = this.detectSuspiciousUrls(emailData.links);
        if (suspiciousUrls.length > 0) {
          matched = true;
          details = `Suspicious URLs: ${suspiciousUrls.join(', ')}`;
          impact = rule.weight * suspiciousUrls.length;
        }
        break;

      case 'html_to_text_ratio':
        const ratio = emailData.htmlLength / Math.max(emailData.textLength, 1);
        if (ratio > 5) {
          matched = true;
          details = `HTML to text ratio: ${ratio.toFixed(2)}:1`;
          impact = rule.weight * Math.min(ratio / 5, 2);
        }
        break;

      case 'excessive_images':
        const imageToTextRatio = emailData.images.length / Math.max(emailData.textLength / 100, 1);
        if (imageToTextRatio > 1) {
          matched = true;
          details = `${emailData.images.length} images for ${emailData.textLength} characters of text`;
          impact = rule.weight * imageToTextRatio;
        }
        break;

      case 'missing_spf':
        // Simulate SPF check (in production, would query DNS)
        if (options.includeAuthentication) {
          matched = true;
          details = 'SPF record not verified';
          impact = rule.weight;
        }
        break;

      case 'missing_dkim':
        // Simulate DKIM check
        if (options.includeAuthentication) {
          matched = true;
          details = 'DKIM signature not verified';
          impact = rule.weight;
        }
        break;
    }

    return {
      rule,
      matched,
      details,
      impact,
    };
  }

  /**
   * Calculate capital letters ratio
   */
  private calculateCapsRatio(text: string): number {
    const letters = text.replace(/[^A-Za-z]/g, '');
    const caps = text.replace(/[^A-Z]/g, '');
    return letters.length > 0 ? caps.length / letters.length : 0;
  }

  /**
   * Detect spam trigger words
   */
  private detectSpamWords(text: string): string[] {
    const spamWords = [
      'free', 'urgent', 'limited time', 'act now', 'click here', 'guarantee',
      'no obligation', 'risk free', 'winner', 'congratulations', 'viagra',
      'casino', 'lottery', 'million dollars', 'make money', 'work from home',
      'lose weight', 'credit repair', 'debt', 'refinance', 'mortgage'
    ];

    const lowerText = text.toLowerCase();
    return spamWords.filter(word => lowerText.includes(word));
  }

  /**
   * Detect suspicious URLs
   */
  private detectSuspiciousUrls(urls: string[]): string[] {
    const suspiciousPatterns = [
      /bit\.ly|tinyurl|t\.co|goo\.gl/, // URL shorteners
      /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
      /[a-z0-9]{10,}\.com/, // Random domains
    ];

    return urls.filter(url =>
      suspiciousPatterns.some(pattern => pattern.test(url))
    );
  }

  /**
   * Analyze deliverability issues
   */
  private analyzeDeliverabilityIssues(
    _emailData: any,
    violations: SpamViolation[]
  ): DeliverabilityIssue[] {
    const issues: DeliverabilityIssue[] = [];

    // High spam score issue
    const spamScore = this.calculateSpamScore(violations);
    if (spamScore > 5) {
      issues.push({
        type: 'spam_trigger',
        severity: 'high',
        description: `High spam score (${spamScore.toFixed(1)}) may trigger filters`,
        recommendation: 'Review and fix spam rule violations',
        impact: 'Email may be filtered to spam folder',
      });
    }

    // Authentication issues
    const authViolations = violations.filter(v => v.rule.category === 'authentication' && v.matched);
    if (authViolations.length > 0) {
      issues.push({
        type: 'authentication',
        severity: 'medium',
        description: 'Missing email authentication records',
        recommendation: 'Implement SPF, DKIM, and DMARC for your domain',
        impact: 'Reduced deliverability and trustworthiness',
      });
    }

    return issues;
  }

  /**
   * Generate spam reduction recommendations
   */
  private generateSpamRecommendations(
    violations: SpamViolation[],
    _issues: DeliverabilityIssue[]
  ): string[] {
    const recommendations: string[] = [];

    const matchedViolations = violations.filter(v => v.matched);

    if (matchedViolations.some(v => v.rule.category === 'content')) {
      recommendations.push(
        'Review subject line and content for spam trigger words',
        'Reduce use of capital letters and exclamation marks',
        'Use descriptive, non-promotional language'
      );
    }

    if (matchedViolations.some(v => v.rule.category === 'structure')) {
      recommendations.push(
        'Balance HTML and text content ratios',
        'Include a plain text version of your email',
        'Optimize image to text ratio'
      );
    }

    if (matchedViolations.some(v => v.rule.category === 'authentication')) {
      recommendations.push(
        'Set up SPF records for your domain',
        'Implement DKIM email signing',
        'Configure DMARC policy for authentication'
      );
    }

    // General recommendations
    recommendations.push(
      'Test emails with multiple spam checkers',
      'Monitor sender reputation and delivery rates',
      'Use consistent sender information',
      'Provide clear unsubscribe options'
    );

    return recommendations;
  }

  /**
   * Calculate spam score
   */
  private calculateSpamScore(violations: SpamViolation[]): number {
    return violations
      .filter(v => v.matched)
      .reduce((score, violation) => score + violation.impact, 0);
  }

  /**
   * Calculate deliverability score
   */
  private calculateDeliverabilityScore(spamScore: number, issues: DeliverabilityIssue[]): number {
    let score = 100;

    // Deduct for spam score
    score -= Math.min(spamScore * 5, 50);

    // Deduct for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    return Math.max(0, Math.round(score));
  }

  /**
   * Classify email based on scores
   */
  private classifyEmail(spamScore: number, deliverabilityScore: number): 'excellent' | 'good' | 'fair' | 'poor' | 'spam' {
    if (spamScore > 10) return 'spam';
    if (deliverabilityScore >= 90) return 'excellent';
    if (deliverabilityScore >= 75) return 'good';
    if (deliverabilityScore >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Analyze client-specific issues
   */
  private analyzeClientSpecificIssues(
    emailData: any,
    violations: SpamViolation[]
  ): {
    gmail: { score: number; issues: string[] };
    outlook: { score: number; issues: string[] };
    yahoo: { score: number; issues: string[] };
    appleMail: { score: number; issues: string[] };
  } {
    const baseScore = 100 - this.calculateSpamScore(violations) * 5;

    return {
      gmail: {
        score: Math.max(0, Math.round(baseScore - (emailData.htmlLength > 102400 ? 20 : 0))),
        issues: emailData.htmlLength > 102400 ? ['Email may be clipped due to size'] : [],
      },
      outlook: {
        score: Math.max(0, Math.round(baseScore - (violations.some(v => v.rule.id === 'suspicious_urls' && v.matched) ? 15 : 0))),
        issues: violations.some(v => v.rule.id === 'suspicious_urls' && v.matched) ? ['Suspicious URLs may trigger filters'] : [],
      },
      yahoo: {
        score: Math.max(0, Math.round(baseScore - (violations.some(v => v.rule.category === 'authentication' && v.matched) ? 10 : 0))),
        issues: violations.some(v => v.rule.category === 'authentication' && v.matched) ? ['Missing authentication may affect delivery'] : [],
      },
      appleMail: {
        score: Math.max(0, Math.round(baseScore)),
        issues: [],
      },
    };
  }
}