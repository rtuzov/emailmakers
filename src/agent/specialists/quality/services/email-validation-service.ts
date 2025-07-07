import { EmailPackage } from '../types/quality-types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export class EmailValidationService {
  private static instance: EmailValidationService;

  private constructor() {}

  static getInstance(): EmailValidationService {
    if (!EmailValidationService.instance) {
      EmailValidationService.instance = new EmailValidationService();
    }
    return EmailValidationService.instance;
  }

  async validateEmailPackage(emailPackage?: EmailPackage): Promise<ValidationResult> {
    console.log('🔧 EMAIL VALIDATION: Starting traditional validation...');
    
    if (!emailPackage) {
      console.log('❌ EMAIL VALIDATION: No email package provided');
      return {
        isValid: false,
        errors: ['Email package is required'],
        warnings: [],
        score: 0
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate HTML content
    if (!emailPackage.html_output || emailPackage.html_output.trim().length === 0) {
      errors.push('HTML content is missing or empty');
    } else {
      console.log('✅ EMAIL VALIDATION: HTML content present');
      
      // Basic HTML structure validation
      if (!emailPackage.html_output.includes('<html') && !emailPackage.html_output.includes('<table')) {
        warnings.push('HTML structure may be incomplete');
      }
      
      // Check for DOCTYPE
      if (!emailPackage.html_output.includes('<!DOCTYPE')) {
        warnings.push('DOCTYPE declaration missing');
      }
      
      // Check for table-based layout
      if (!emailPackage.html_output.includes('<table')) {
        warnings.push('Table-based layout recommended for email compatibility');
      }
    }

    // Validate subject
    if (!emailPackage.subject || emailPackage.subject.trim().length === 0) {
      warnings.push('Subject line is missing');
    } else if (emailPackage.subject.length > 60) {
      warnings.push('Subject line may be too long (>60 characters)');
    } else {
      console.log('✅ EMAIL VALIDATION: Subject line present');
    }

    // Validate preheader
    if (emailPackage.preheader && emailPackage.preheader.length > 90) {
      warnings.push('Preheader may be too long (>90 characters)');
    }

    // Calculate score
    const totalChecks = 5;
    const passedChecks = totalChecks - errors.length - (warnings.length * 0.5);
    const score = Math.max(0, Math.min(100, (passedChecks / totalChecks) * 100));

    const isValid = errors.length === 0;

    console.log('📊 EMAIL VALIDATION: Results:', {
      isValid,
      errors: errors.length,
      warnings: warnings.length,
      score: Math.round(score)
    });

    return {
      isValid,
      errors,
      warnings,
      score: Math.round(score)
    };
  }
} 