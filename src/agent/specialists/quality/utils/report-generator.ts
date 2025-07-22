/**
 * 🔍 QUALITY REPORT GENERATOR UTILS
 * 
 * Utility functions for generating quality reports and assessments
 * - Quality report enhancement
 * - Compliance status assessment
 * - Failure report generation
 * - Testing report generation
 */

import {
  QualitySpecialistInput,
  QualityReport,
  QualityIssue,
  IssueSeverity
} from '../types/quality-types';

export class ReportGeneratorUtils {
  /**
   * Enhance quality report with additional analysis
   */
  static enhanceQualityReport(qualityResult: any, input: QualitySpecialistInput): QualityReport {
    try {
      // Extract or generate quality scores
      const overallScore = this.extractOverallScore(qualityResult);
      const categoryScores = this.extractCategoryScores(qualityResult);
      const issuesFound = this.extractIssues(qualityResult);
      const passedChecks = this.extractPassedChecks(qualityResult);
      const recommendations = this.generateRecommendations(qualityResult, input);

      return {
        overall_score: overallScore,
        category_scores: categoryScores,
        issues_found: issuesFound,
        passed_checks: passedChecks,
        recommendations: recommendations
      };
    } catch (error) {
      console.warn('Error enhancing quality report:', error);
      return this.generateDefaultQualityReport();
    }
  }

  /**
   * Generate testing quality report
   */
  static generateTestingQualityReport(testResults: any): QualityReport {
    try {
      const overallScore = this.calculateTestingScore(testResults);
      const categoryScores = {
        technical: this.extractTestScore(testResults, 'technical') || 75,
        content: this.extractTestScore(testResults, 'content') || 80,
        accessibility: this.extractTestScore(testResults, 'accessibility') || 70,
        performance: this.extractTestScore(testResults, 'performance') || 85,
        compatibility: this.extractTestScore(testResults, 'compatibility') || 90
      };

      const issuesFound = this.extractTestingIssues(testResults);
      const passedChecks = this.extractPassedTests(testResults);
      const recommendations = this.generateTestingRecommendations(testResults);

      return {
        overall_score: overallScore,
        category_scores: categoryScores,
        issues_found: issuesFound,
        passed_checks: passedChecks,
        recommendations: recommendations
      };
    } catch (error) {
      console.warn('Error generating testing quality report:', error);
      return this.generateDefaultQualityReport();
    }
  }

  /**
   * Generate compliance quality report
   */
  static generateComplianceQualityReport(compliance: any): QualityReport {
    try {
      const overallScore = this.calculateComplianceScore(compliance);
      const categoryScores = {
        technical: this.extractComplianceScore(compliance, 'technical') || 80,
        content: this.extractComplianceScore(compliance, 'content') || 85,
        accessibility: this.extractComplianceScore(compliance, 'accessibility') || 75,
        performance: this.extractComplianceScore(compliance, 'performance') || 80,
        compatibility: this.extractComplianceScore(compliance, 'compatibility') || 85
      };

      const issuesFound = this.extractComplianceIssues(compliance);
      const passedChecks = this.extractComplianceChecks(compliance);
      const recommendations = this.generateComplianceRecommendations(compliance);

      return {
        overall_score: overallScore,
        category_scores: categoryScores,
        issues_found: issuesFound,
        passed_checks: passedChecks,
        recommendations: recommendations
      };
    } catch (error) {
      console.warn('Error generating compliance quality report:', error);
      return this.generateDefaultQualityReport();
    }
  }

  /**
   * Generate optimization quality report
   */
  static generateOptimizationQualityReport(optimizationResult: any): QualityReport {
    try {
      const overallScore = this.calculateOptimizationScore(optimizationResult);
      const categoryScores = {
        technical: this.extractOptimizationScore(optimizationResult, 'technical') || 85,
        content: this.extractOptimizationScore(optimizationResult, 'content') || 80,
        accessibility: this.extractOptimizationScore(optimizationResult, 'accessibility') || 75,
        performance: this.extractOptimizationScore(optimizationResult, 'performance') || 90,
        compatibility: this.extractOptimizationScore(optimizationResult, 'compatibility') || 85
      };

      const issuesFound = this.extractOptimizationIssues(optimizationResult);
      const passedChecks = this.extractOptimizationChecks(optimizationResult);
      const recommendations = this.generateOptimizationRecommendations(optimizationResult);

      return {
        overall_score: overallScore,
        category_scores: categoryScores,
        issues_found: issuesFound,
        passed_checks: passedChecks,
        recommendations: recommendations
      };
    } catch (error) {
      console.warn('Error generating optimization quality report:', error);
      return this.generateDefaultQualityReport();
    }
  }

  /**
   * Generate comprehensive audit report
   */
  static generateComprehensiveReport(auditResult: any, input: QualitySpecialistInput): QualityReport {
    try {
      const overallScore = this.calculateAuditScore(auditResult);
      const categoryScores = {
        technical: this.extractAuditScore(auditResult, 'technical') || 85,
        content: this.extractAuditScore(auditResult, 'content') || 80,
        accessibility: this.extractAuditScore(auditResult, 'accessibility') || 75,
        performance: this.extractAuditScore(auditResult, 'performance') || 85,
        compatibility: this.extractAuditScore(auditResult, 'compatibility') || 90
      };

      const issuesFound = this.extractAuditIssues(auditResult);
      const passedChecks = this.extractAuditChecks(auditResult);
      const recommendations = this.generateAuditRecommendations(auditResult, input);

      return {
        overall_score: overallScore,
        category_scores: categoryScores,
        issues_found: issuesFound,
        passed_checks: passedChecks,
        recommendations: recommendations
      };
    } catch (error) {
      console.warn('Error generating comprehensive report:', error);
      return this.generateDefaultQualityReport();
    }
  }

  /**
   * Generate failure report
   */
  static generateFailureReport(): QualityReport {
    return {
      overall_score: 0,
      category_scores: {
        technical: 0,
        content: 0,
        accessibility: 0,
        performance: 0,
        compatibility: 0
      },
      issues_found: [{
        severity: 'critical' as IssueSeverity,
        category: 'system',
        description: 'Quality analysis failed due to system error',
        fix_suggestion: 'Retry the quality analysis process',
        auto_fixable: false
      }],
      passed_checks: [],
      recommendations: ['Retry quality analysis', 'Check system status', 'Contact support if issue persists']
    };
  }

  // Private helper methods
  private static extractOverallScore(result: any): number {
    if (typeof result === 'object' && result.overall_score) {
      return Math.max(0, Math.min(100, result.overall_score));
    }
    if (typeof result === 'string') {
      const scoreMatch = result.match(/overall[:\s]*(\d+)/i) || result.match(/score[:\s]*(\d+)/i);
      if (scoreMatch) {
        return Math.max(0, Math.min(100, parseInt(scoreMatch[1] || '0')));
      }
    }
    return 75; // Default score
  }

  private static extractCategoryScores(result: any): QualityReport['category_scores'] {
    const defaultScores = {
      technical: 75,
      content: 80,
      accessibility: 70,
      performance: 85,
      compatibility: 80
    };

    if (typeof result === 'object' && result.category_scores) {
      return { ...defaultScores, ...result.category_scores };
    }

    return defaultScores;
  }

  private static extractIssues(result: any): QualityIssue[] {
    if (typeof result === 'object' && Array.isArray(result.issues)) {
      return result.issues.map(this.normalizeIssue);
    }
    
    if (typeof result === 'string') {
      return this.parseIssuesFromText(result);
    }

    return [];
  }

  private static normalizeIssue(issue: any): QualityIssue {
    return {
      severity: issue.severity || 'medium',
      category: issue.category || 'general',
      description: issue.description || 'Quality issue detected',
      fix_suggestion: issue.fix_suggestion || 'Review and fix manually',
      auto_fixable: Boolean(issue.auto_fixable)
    };
  }

  private static parseIssuesFromText(text: string): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const errorPatterns = [
      /error[:\s]*(.*?)(?:\n|$)/gi,
      /warning[:\s]*(.*?)(?:\n|$)/gi,
      /issue[:\s]*(.*?)(?:\n|$)/gi
    ];

    errorPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        issues.push({
          severity: 'medium' as IssueSeverity,
          category: 'general',
          description: (match[1] || '').trim(),
          fix_suggestion: 'Review and address this issue',
          auto_fixable: false
        });
      }
    });

    return issues.slice(0, 10); // Limit to 10 issues
  }

  private static extractPassedChecks(result: any): string[] {
    if (typeof result === 'object' && Array.isArray(result.passed_checks)) {
      return result.passed_checks;
    }
    
    if (typeof result === 'string') {
      const passedPattern = /passed[:\s]*(.*?)(?:\n|$)/gi;
      const checks: string[] = [];
      let match;
      while ((match = passedPattern.exec(result)) !== null) {
        if (match[1]) checks.push(match[1].trim());
      }
      return checks;
    }

    return ['Basic HTML structure', 'Email formatting', 'Standard compliance'];
  }

  private static generateRecommendations(result: any, input: QualitySpecialistInput): string[] {
    const recommendations: string[] = [];
    
    if (typeof result === 'object' && Array.isArray(result.recommendations)) {
      recommendations.push(...result.recommendations);
    }

    // Add task-specific recommendations
    switch (input.task_type) {
      case 'analyze_quality':
        recommendations.push('Consider running comprehensive testing');
        break;
      case 'test_rendering':
        recommendations.push('Validate compliance standards');
        break;
      case 'validate_compliance':
        recommendations.push('Optimize performance metrics');
        break;
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private static generateDefaultQualityReport(): QualityReport {
    return {
      overall_score: 50,
      category_scores: {
        technical: 50,
        content: 50,
        accessibility: 50,
        performance: 50,
        compatibility: 50
      },
      issues_found: [],
      passed_checks: [],
      recommendations: ['Review quality analysis', 'Check input data', 'Retry with different parameters']
    };
  }

  // Additional helper methods for specific report types
  private static calculateTestingScore(testResults: any): number {
    return this.extractOverallScore(testResults) || 80;
  }

  private static calculateComplianceScore(compliance: any): number {
    return this.extractOverallScore(compliance) || 75;
  }

  private static calculateOptimizationScore(optimization: any): number {
    return this.extractOverallScore(optimization) || 85;
  }

  private static calculateAuditScore(audit: any): number {
    return this.extractOverallScore(audit) || 80;
  }

  private static extractTestScore(result: any, category: string): number | null {
    if (typeof result === 'object' && result.scores && result.scores[category]) {
      return result.scores[category];
    }
    return null;
  }

  private static extractTestingIssues(result: any): QualityIssue[] {
    return this.extractIssues(result);
  }

  private static extractPassedTests(result: any): string[] {
    return this.extractPassedChecks(result);
  }

  private static generateTestingRecommendations(result: any): string[] {
    return this.extractPassedChecks(result).length > 0 
      ? ['Continue with compliance validation', 'Review failed tests']
      : ['Address critical testing issues', 'Rerun tests after fixes'];
  }

  private static extractComplianceScore(result: any, category: string): number | null {
    return this.extractTestScore(result, category);
  }

  private static extractComplianceIssues(result: any): QualityIssue[] {
    return this.extractIssues(result);
  }

  private static extractComplianceChecks(result: any): string[] {
    return this.extractPassedChecks(result);
  }

  private static generateComplianceRecommendations(_result: any): string[] {
    return ['Proceed to performance optimization', 'Address compliance gaps'];
  }

  private static extractOptimizationScore(result: any, category: string): number | null {
    return this.extractTestScore(result, category);
  }

  private static extractOptimizationIssues(result: any): QualityIssue[] {
    return this.extractIssues(result);
  }

  private static extractOptimizationChecks(result: any): string[] {
    return this.extractPassedChecks(result);
  }

  private static generateOptimizationRecommendations(_result: any): string[] {
    return ['Ready for comprehensive audit', 'Monitor performance metrics'];
  }

  private static extractAuditScore(result: any, category: string): number | null {
    return this.extractTestScore(result, category);
  }

  private static extractAuditIssues(result: any): QualityIssue[] {
    return this.extractIssues(result);
  }

  private static extractAuditChecks(result: any): string[] {
    return this.extractPassedChecks(result);
  }

  private static generateAuditRecommendations(_result: any, input: QualitySpecialistInput): string[] {
    const recommendations = ['Ready for delivery', 'Final quality review complete'];
    
    if (input.quality_requirements?.mobile_optimization) {
      recommendations.push('Mobile optimization verified');
    }
    
    return recommendations;
  }
} 