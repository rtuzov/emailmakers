/**
 * 🔍 COMPLIANCE ASSESSMENT UTILS
 * 
 * Utility functions for compliance status assessment and validation
 * - Compliance status assessment
 * - Standards validation
 * - Failure compliance generation
 * - Detailed compliance checking
 */

import {
  QualitySpecialistInput,
  ComplianceStatusReport,
  ComplianceStatus
} from '../types/quality-types';

export class ComplianceAssessmentUtils {
  /**
   * Assess compliance status from quality results
   */
  static assessComplianceStatus(qualityResult: any, input: QualitySpecialistInput): ComplianceStatusReport {
    try {
      return {
        email_standards: this.assessEmailStandards(qualityResult, input),
        accessibility: this.assessAccessibility(qualityResult, input),
        performance: this.assessPerformance(qualityResult, input),
        security: this.assessSecurity(qualityResult, input),
        overall_compliance: this.assessOverallCompliance(qualityResult, input)
      };
    } catch (error) {
      console.warn('Error assessing compliance status:', error);
      return this.generateFailureComplianceStatus();
    }
  }

  /**
   * Generate detailed compliance status for testing
   */
  static assessTestingCompliance(testResults: any, _input: QualitySpecialistInput): ComplianceStatusReport {
    try {
      return {
        email_standards: this.assessTestingEmailStandards(testResults),
        accessibility: this.assessTestingAccessibility(testResults),
        performance: this.assessTestingPerformance(testResults),
        security: this.assessTestingSecurity(testResults),
        overall_compliance: this.calculateTestingOverallCompliance(testResults)
      };
    } catch (error) {
      console.warn('Error assessing testing compliance:', error);
      return this.generateFailureComplianceStatus();
    }
  }

  /**
   * Generate detailed compliance status for validation
   */
  static generateDetailedComplianceStatus(compliance: any): ComplianceStatusReport {
    try {
      return {
        email_standards: this.extractComplianceStatus(compliance, 'email_standards'),
        accessibility: this.extractComplianceStatus(compliance, 'accessibility'),
        performance: this.extractComplianceStatus(compliance, 'performance'),
        security: this.extractComplianceStatus(compliance, 'security'),
        overall_compliance: this.calculateOverallComplianceFromDetailed(compliance)
      };
    } catch (error) {
      console.warn('Error generating detailed compliance status:', error);
      return this.generateFailureComplianceStatus();
    }
  }

  /**
   * Assess optimized compliance status
   */
  static assessOptimizedCompliance(optimizationResult: any): ComplianceStatusReport {
    try {
      return {
        email_standards: this.assessOptimizedEmailStandards(optimizationResult),
        accessibility: this.assessOptimizedAccessibility(optimizationResult),
        performance: this.assessOptimizedPerformance(optimizationResult),
        security: this.assessOptimizedSecurity(optimizationResult),
        overall_compliance: this.calculateOptimizedOverallCompliance(optimizationResult)
      };
    } catch (error) {
      console.warn('Error assessing optimized compliance:', error);
      return this.generateFailureComplianceStatus();
    }
  }

  /**
   * Generate final compliance status for audit
   */
  static generateFinalComplianceStatus(auditResult: any): ComplianceStatusReport {
    try {
      return {
        email_standards: this.assessAuditEmailStandards(auditResult),
        accessibility: this.assessAuditAccessibility(auditResult),
        performance: this.assessAuditPerformance(auditResult),
        security: this.assessAuditSecurity(auditResult),
        overall_compliance: this.calculateAuditOverallCompliance(auditResult)
      };
    } catch (error) {
      console.warn('Error generating final compliance status:', error);
      return this.generateFailureComplianceStatus();
    }
  }

  /**
   * Generate failure compliance status
   */
  static generateFailureComplianceStatus(): ComplianceStatusReport {
    return {
      email_standards: 'fail' as ComplianceStatus,
      accessibility: 'fail' as ComplianceStatus,
      performance: 'fail' as ComplianceStatus,
      security: 'fail' as ComplianceStatus,
      overall_compliance: 'fail' as ComplianceStatus
    };
  }

  /**
   * Perform detailed compliance check
   */
  static performDetailedComplianceCheck(complianceResult: any, input: QualitySpecialistInput): any {
    try {
      const detailedCheck = {
        email_standards: this.checkEmailStandardsCompliance(complianceResult, input),
        accessibility: this.checkAccessibilityCompliance(complianceResult, input),
        performance: this.checkPerformanceCompliance(complianceResult, input),
        security: this.checkSecurityCompliance(complianceResult, input),
        summary: this.generateComplianceSummary(complianceResult, input)
      };

      return detailedCheck;
    } catch (error) {
      console.warn('Error performing detailed compliance check:', error);
      return {
        email_standards: { status: 'fail', issues: ['Compliance check failed'] },
        accessibility: { status: 'fail', issues: ['Compliance check failed'] },
        performance: { status: 'fail', issues: ['Compliance check failed'] },
        security: { status: 'fail', issues: ['Compliance check failed'] },
        summary: { overall: 'fail', critical_issues: 1 }
      };
    }
  }

  // Private helper methods for compliance assessment
  private static assessEmailStandards(result: any, _input: QualitySpecialistInput): ComplianceStatus {
    if (this.hasEmailStandardsIssues(result)) {
      return 'fail';
    }
    if (this.hasEmailStandardsWarnings(result)) {
      return 'warning';
    }
    return 'pass';
  }

  private static assessAccessibility(result: any, input: QualitySpecialistInput): ComplianceStatus {
    const requiredLevel = input.quality_requirements?.accessibility_compliance || 'basic';
    
    if (this.hasAccessibilityIssues(result, requiredLevel)) {
      return 'fail';
    }
    if (this.hasAccessibilityWarnings(result, requiredLevel)) {
      return 'warning';
    }
    return 'pass';
  }

  private static assessPerformance(result: any, input: QualitySpecialistInput): ComplianceStatus {
    const targets = input.quality_requirements?.performance_targets;
    
    if (this.hasPerformanceIssues(result, targets)) {
      return 'fail';
    }
    if (this.hasPerformanceWarnings(result, targets)) {
      return 'warning';
    }
    return 'pass';
  }

  private static assessSecurity(result: any, _input: QualitySpecialistInput): ComplianceStatus {
    if (this.hasSecurityIssues(result)) {
      return 'fail';
    }
    if (this.hasSecurityWarnings(result)) {
      return 'warning';
    }
    return 'pass';
  }

  private static assessOverallCompliance(result: any, input: QualitySpecialistInput): ComplianceStatus {
    const emailStandards = this.assessEmailStandards(result, input);
    const accessibility = this.assessAccessibility(result, input);
    const performance = this.assessPerformance(result, input);
    const security = this.assessSecurity(result, input);

    if ([emailStandards, accessibility, performance, security].includes('fail')) {
      return 'fail';
    }
    if ([emailStandards, accessibility, performance, security].includes('warning')) {
      return 'warning';
    }
    return 'pass';
  }

  // Helper methods for checking specific compliance areas
  private static hasEmailStandardsIssues(result: any): boolean {
    if (typeof result === 'string') {
      return /email.*standard.*error|invalid.*email|doctype.*missing/i.test(result);
    }
    return result?.email_standards?.status === 'fail' || false;
  }

  private static hasEmailStandardsWarnings(result: any): boolean {
    if (typeof result === 'string') {
      return /email.*standard.*warning|deprecated.*tag/i.test(result);
    }
    return result?.email_standards?.status === 'warning' || false;
  }

  private static hasAccessibilityIssues(result: any, _level: string): boolean {
    if (typeof result === 'string') {
      return /accessibility.*error|alt.*missing|contrast.*fail/i.test(result);
    }
    return result?.accessibility?.status === 'fail' || false;
  }

  private static hasAccessibilityWarnings(result: any, _level: string): boolean {
    if (typeof result === 'string') {
      return /accessibility.*warning|contrast.*low/i.test(result);
    }
    return result?.accessibility?.status === 'warning' || false;
  }

  private static hasPerformanceIssues(result: any, _targets?: any): boolean {
    if (typeof result === 'string') {
      return /performance.*error|size.*too.*large|load.*slow/i.test(result);
    }
    return result?.performance?.status === 'fail' || false;
  }

  private static hasPerformanceWarnings(result: any, _targets?: any): boolean {
    if (typeof result === 'string') {
      return /performance.*warning|size.*large/i.test(result);
    }
    return result?.performance?.status === 'warning' || false;
  }

  private static hasSecurityIssues(result: any): boolean {
    if (typeof result === 'string') {
      return /security.*error|xss.*vulnerability|unsafe.*content/i.test(result);
    }
    return result?.security?.status === 'fail' || false;
  }

  private static hasSecurityWarnings(result: any): boolean {
    if (typeof result === 'string') {
      return /security.*warning|potential.*risk/i.test(result);
    }
    return result?.security?.status === 'warning' || false;
  }

  // Testing-specific compliance assessment methods
  private static assessTestingEmailStandards(testResults: any): ComplianceStatus {
    const passRate = this.extractTestPassRate(testResults, 'email_standards');
    return passRate >= 90 ? 'pass' : passRate >= 70 ? 'warning' : 'fail';
  }

  private static assessTestingAccessibility(testResults: any): ComplianceStatus {
    const passRate = this.extractTestPassRate(testResults, 'accessibility');
    return passRate >= 85 ? 'pass' : passRate >= 65 ? 'warning' : 'fail';
  }

  private static assessTestingPerformance(testResults: any): ComplianceStatus {
    const passRate = this.extractTestPassRate(testResults, 'performance');
    return passRate >= 80 ? 'pass' : passRate >= 60 ? 'warning' : 'fail';
  }

  private static assessTestingSecurity(testResults: any): ComplianceStatus {
    const passRate = this.extractTestPassRate(testResults, 'security');
    return passRate >= 95 ? 'pass' : passRate >= 80 ? 'warning' : 'fail';
  }

  private static calculateTestingOverallCompliance(testResults: any): ComplianceStatus {
    const avgPassRate = this.calculateAveragePassRate(testResults);
    return avgPassRate >= 85 ? 'pass' : avgPassRate >= 70 ? 'warning' : 'fail';
  }

  private static extractTestPassRate(testResults: any, category: string): number {
    if (typeof testResults === 'object' && testResults.pass_rates && testResults.pass_rates[category]) {
      return testResults.pass_rates[category];
    }
    return 75; // Default pass rate
  }

  private static calculateAveragePassRate(testResults: any): number {
    const categories = ['email_standards', 'accessibility', 'performance', 'security'];
    const passRates = categories.map(cat => this.extractTestPassRate(testResults, cat));
    return passRates.reduce((sum, rate) => sum + rate, 0) / passRates.length;
  }

  // Detailed compliance checking methods
  private static extractComplianceStatus(compliance: any, category: string): ComplianceStatus {
    if (typeof compliance === 'object' && compliance[category]) {
      return compliance[category].status || 'warning';
    }
    return 'warning';
  }

  private static calculateOverallComplianceFromDetailed(compliance: any): ComplianceStatus {
    const categories = ['email_standards', 'accessibility', 'performance', 'security'];
    const statuses = categories.map(cat => this.extractComplianceStatus(compliance, cat));
    
    if (statuses.includes('fail')) return 'fail';
    if (statuses.includes('warning')) return 'warning';
    return 'pass';
  }

  // Optimization-specific compliance assessment
  private static assessOptimizedEmailStandards(result: any): ComplianceStatus {
    return this.extractOptimizedStatus(result, 'email_standards') || 'pass';
  }

  private static assessOptimizedAccessibility(result: any): ComplianceStatus {
    return this.extractOptimizedStatus(result, 'accessibility') || 'pass';
  }

  private static assessOptimizedPerformance(result: any): ComplianceStatus {
    return this.extractOptimizedStatus(result, 'performance') || 'pass';
  }

  private static assessOptimizedSecurity(result: any): ComplianceStatus {
    return this.extractOptimizedStatus(result, 'security') || 'pass';
  }

  private static calculateOptimizedOverallCompliance(result: any): ComplianceStatus {
    return this.extractOptimizedStatus(result, 'overall') || 'pass';
  }

  private static extractOptimizedStatus(result: any, category: string): ComplianceStatus | null {
    if (typeof result === 'object' && result.compliance && result.compliance[category]) {
      return result.compliance[category];
    }
    return null;
  }

  // Audit-specific compliance assessment
  private static assessAuditEmailStandards(result: any): ComplianceStatus {
    return this.extractAuditStatus(result, 'email_standards') || 'pass';
  }

  private static assessAuditAccessibility(result: any): ComplianceStatus {
    return this.extractAuditStatus(result, 'accessibility') || 'pass';
  }

  private static assessAuditPerformance(result: any): ComplianceStatus {
    return this.extractAuditStatus(result, 'performance') || 'pass';
  }

  private static assessAuditSecurity(result: any): ComplianceStatus {
    return this.extractAuditStatus(result, 'security') || 'pass';
  }

  private static calculateAuditOverallCompliance(result: any): ComplianceStatus {
    return this.extractAuditStatus(result, 'overall') || 'pass';
  }

  private static extractAuditStatus(result: any, category: string): ComplianceStatus | null {
    if (typeof result === 'object' && result.final_compliance && result.final_compliance[category]) {
      return result.final_compliance[category];
    }
    return null;
  }

  // Detailed compliance checking helper methods
  private static checkEmailStandardsCompliance(result: any, input: QualitySpecialistInput): any {
    return {
      status: this.assessEmailStandards(result, input),
      checks: ['DOCTYPE validation', 'Table layout', 'Inline styles', 'Image alt text'],
      issues: this.extractComplianceIssues(result, 'email_standards')
    };
  }

  private static checkAccessibilityCompliance(result: any, input: QualitySpecialistInput): any {
    return {
      status: this.assessAccessibility(result, input),
      checks: ['Color contrast', 'Alt text', 'Screen reader compatibility', 'Keyboard navigation'],
      issues: this.extractComplianceIssues(result, 'accessibility')
    };
  }

  private static checkPerformanceCompliance(result: any, input: QualitySpecialistInput): any {
    return {
      status: this.assessPerformance(result, input),
      checks: ['File size', 'Load time', 'Image optimization', 'CSS efficiency'],
      issues: this.extractComplianceIssues(result, 'performance')
    };
  }

  private static checkSecurityCompliance(result: any, input: QualitySpecialistInput): any {
    return {
      status: this.assessSecurity(result, input),
      checks: ['XSS prevention', 'Safe content', 'Secure links', 'Data protection'],
      issues: this.extractComplianceIssues(result, 'security')
    };
  }

  private static extractComplianceIssues(result: any, category: string): string[] {
    if (typeof result === 'object' && result[category] && Array.isArray(result[category].issues)) {
      return result[category].issues;
    }
    return [];
  }

  private static generateComplianceSummary(result: any, input: QualitySpecialistInput): any {
    const emailStandards = this.assessEmailStandards(result, input);
    const accessibility = this.assessAccessibility(result, input);
    const performance = this.assessPerformance(result, input);
    const security = this.assessSecurity(result, input);
    const overall = this.assessOverallCompliance(result, input);

    const criticalIssues = [emailStandards, accessibility, performance, security]
      .filter(status => status === 'fail').length;

    return {
      overall,
      critical_issues: criticalIssues,
      areas_passed: [emailStandards, accessibility, performance, security]
        .filter(status => status === 'pass').length,
      areas_with_warnings: [emailStandards, accessibility, performance, security]
        .filter(status => status === 'warning').length
    };
  }
} 