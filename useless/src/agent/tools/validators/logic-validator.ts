/**
 * T11 Logic Validator - Business Logic & Data Accuracy Validation
 * 
 * Validates data accuracy and business logic for email campaigns
 * Weight: 30% of total quality score (critical for functionality)
 */

import { 
  LogicValidationResult, 
  ValidationCheck, 
  QualityValidationRequest,
  QualityValidationError 
} from './types';

/**
 * Logic Validator Service
 * Validates business logic and data accuracy
 */
export class LogicValidator {
  
  /**
   * Validate business logic and data accuracy
   */
  async validate(request: QualityValidationRequest): Promise<LogicValidationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 T11 Logic Validator: Starting business logic validation');
      
      // Run all logic validation checks in parallel
      const [
        priceRealism,
        dateConsistency,
        routeAccuracy,
        dataCompleteness
      ] = await Promise.all([
        this.validatePriceRealism(request),
        this.validateDateConsistency(request),
        this.validateRouteAccuracy(request),
        this.validateDataCompleteness(request)
      ]);
      
      // Calculate overall logic score
      const checks = {
        price_realism: priceRealism,
        date_consistency: dateConsistency,
        route_accuracy: routeAccuracy,
        data_completeness: dataCompleteness
      };
      
      const score = this.calculateLogicScore(checks);
      const passed = score >= 70;
      
      // Collect issues and recommendations
      const issues = Object.values(checks)
        .filter(check => !check.passed)
        .map(check => check.message);
      
      const recommendations = this.generateRecommendations(checks);
      
      const validationTime = Date.now() - startTime;
      console.log(`✅ T11 Logic Validator: Completed in ${validationTime}ms, score: ${score}`);
      
      return {
        score,
        passed,
        checks,
        issues,
        recommendations
      };
      
    } catch (error) {
      const validationTime = Date.now() - startTime;
      console.error('❌ T11 Logic Validator: Validation failed:', error);
      
      throw new QualityValidationError(
        `Logic validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LOGIC_VALIDATION_FAILED',
        { validationTime, error }
      );
    }
  }
  
  /**
   * Validate price realism
   * Checks if flight prices are within realistic ranges
   */
  private async validatePriceRealism(request: QualityValidationRequest): Promise<ValidationCheck> {
    try {
      const prices = request.campaign_metadata.prices;
      
      if (!prices) {
        return {
          passed: false,
          score: 0,
          message: 'No price data found in campaign',
          details: { reason: 'missing_prices' }
        };
      }
      
      const { cheapest_price, currency, origin, destination } = prices;
      
      // Define realistic price ranges by route type
      const priceRanges = this.getPriceRanges(origin, destination, currency);
      
      // Check if price is within realistic range
      const isRealistic = cheapest_price >= priceRanges.min && cheapest_price <= priceRanges.max;
      
      if (!isRealistic) {
        return {
          passed: false,
          score: 20,
          message: `Price ${cheapest_price} ${currency} is unrealistic for route ${origin}-${destination}`,
          details: { 
            price: cheapest_price,
            currency,
            route: `${origin}-${destination}`,
            expected_range: priceRanges
          }
        };
      }
      
      // Additional checks for suspiciously low prices
      if (cheapest_price < priceRanges.min * 0.5) {
        return {
          passed: true,
          score: 80,
          message: `Price seems very low but within range`,
          details: { 
            price: cheapest_price,
            warning: 'suspiciously_low'
          }
        };
      }
      
      return {
        passed: true,
        score: 100,
        message: `Price ${cheapest_price} ${currency} is realistic for route ${origin}-${destination}`,
        details: { price: cheapest_price, currency, route: `${origin}-${destination}` }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Price validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
  
  /**
   * Validate date consistency
   * Checks if dates are logical and consistent
   */
  private async validateDateConsistency(request: QualityValidationRequest): Promise<ValidationCheck> {
    try {
      const prices = request.campaign_metadata.prices;
      
      if (!prices || !prices.date_range) {
        return {
          passed: false,
          score: 0,
          message: 'No date information found in campaign',
          details: { reason: 'missing_dates' }
        };
      }
      
      const dateRange = prices.date_range;
      const dates = this.parseDateRange(dateRange);
      
      if (!dates) {
        return {
          passed: false,
          score: 0,
          message: `Invalid date format: ${dateRange}`,
          details: { date_range: dateRange }
        };
      }
      
      const { startDate, endDate } = dates;
      const now = new Date();
      
      // Check if dates are in the future
      if (startDate <= now) {
        return {
          passed: false,
          score: 30,
          message: `Departure date ${startDate.toISOString().split('T')[0]} is in the past`,
          details: { 
            departure_date: startDate.toISOString().split('T')[0],
            current_date: now.toISOString().split('T')[0]
          }
        };
      }
      
      // Check if return date is after departure date
      if (endDate && endDate <= startDate) {
        return {
          passed: false,
          score: 40,
          message: `Return date must be after departure date`,
          details: { 
            departure_date: startDate.toISOString().split('T')[0],
            return_date: endDate.toISOString().split('T')[0]
          }
        };
      }
      
      // Check if dates are not too far in the future (booking window)
      const maxBookingWindow = 365; // days
      const daysDifference = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference > maxBookingWindow) {
        return {
          passed: true,
          score: 80,
          message: `Departure date is very far in the future (${daysDifference} days)`,
          details: { 
            days_ahead: daysDifference,
            warning: 'far_future_booking'
          }
        };
      }
      
      return {
        passed: true,
        score: 100,
        message: `Date range ${dateRange} is consistent and logical`,
        details: { 
          date_range: dateRange,
          days_ahead: daysDifference
        }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Date validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
  
  /**
   * Validate route accuracy
   * Checks if airport codes and routes are valid
   */
  private async validateRouteAccuracy(request: QualityValidationRequest): Promise<ValidationCheck> {
    try {
      const prices = request.campaign_metadata.prices;
      
      if (!prices) {
        return {
          passed: false,
          score: 0,
          message: 'No route information found in campaign',
          details: { reason: 'missing_routes' }
        };
      }
      
      const { origin, destination } = prices;
      
      // Validate airport codes format (3-letter IATA codes)
      const iataRegex = /^[A-Z]{3}$/;
      
      if (!iataRegex.test(origin)) {
        return {
          passed: false,
          score: 20,
          message: `Invalid origin airport code: ${origin}`,
          details: { origin, expected_format: 'XXX (3-letter IATA code)' }
        };
      }
      
      if (!iataRegex.test(destination)) {
        return {
          passed: false,
          score: 20,
          message: `Invalid destination airport code: ${destination}`,
          details: { destination, expected_format: 'XXX (3-letter IATA code)' }
        };
      }
      
      // Check if origin and destination are different
      if (origin === destination) {
        return {
          passed: false,
          score: 10,
          message: `Origin and destination cannot be the same: ${origin}`,
          details: { origin, destination }
        };
      }
      
      // Validate against known airport codes (basic validation)
      const knownAirports = this.getKnownAirportCodes();
      const originValid = knownAirports.includes(origin);
      const destinationValid = knownAirports.includes(destination);
      
      if (!originValid || !destinationValid) {
        const invalidCodes = [];
        if (!originValid) invalidCodes.push(origin);
        if (!destinationValid) invalidCodes.push(destination);
        
        return {
          passed: false,
          score: 60,
          message: `Unknown airport codes: ${invalidCodes.join(', ')}`,
          details: { 
            invalid_codes: invalidCodes,
            warning: 'unknown_airports'
          }
        };
      }
      
      return {
        passed: true,
        score: 100,
        message: `Route ${origin}-${destination} is valid`,
        details: { origin, destination }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Route validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
  
  /**
   * Validate data completeness
   * Checks if all required data is present and complete
   */
  private async validateDataCompleteness(request: QualityValidationRequest): Promise<ValidationCheck> {
    try {
      const issues: string[] = [];
      const warnings: string[] = [];
      
      // Check HTML content
      if (!request.html_content || request.html_content.trim().length === 0) {
        issues.push('HTML content is missing or empty');
      }
      
      // Check MJML source
      if (!request.mjml_source || request.mjml_source.trim().length === 0) {
        issues.push('MJML source is missing or empty');
      }
      
      // Check topic
      if (!request.topic || request.topic.trim().length === 0) {
        issues.push('Email topic is missing or empty');
      }
      
      // Check assets
      if (!request.assets_used.original_assets || request.assets_used.original_assets.length === 0) {
        warnings.push('No assets found in campaign');
      }
      
      // Check campaign metadata
      const metadata = request.campaign_metadata;
      if (!metadata.prices) {
        issues.push('Price data is missing from campaign metadata');
      }
      
      if (!metadata.content) {
        issues.push('Content data is missing from campaign metadata');
      }
      
      // Check content completeness
      if (metadata.content) {
        const { subject, tone, language } = metadata.content;
        
        if (!subject || subject.trim().length === 0) {
          issues.push('Email subject is missing or empty');
        }
        
        if (!tone || tone.trim().length === 0) {
          warnings.push('Content tone is not specified');
        }
        
        if (!language || language.trim().length === 0) {
          warnings.push('Content language is not specified');
        }
      }
      
      // Calculate completeness score
      let score = 100;
      score -= issues.length * 20; // -20 points per critical issue
      score -= warnings.length * 5; // -5 points per warning
      score = Math.max(0, score);
      
      const passed = issues.length === 0;
      
      if (!passed) {
        return {
          passed: false,
          score,
          message: `Data completeness issues: ${issues.join(', ')}`,
          details: { 
            critical_issues: issues,
            warnings,
            completeness_score: score
          }
        };
      }
      
      if (warnings.length > 0) {
        return {
          passed: true,
          score,
          message: `Data is complete with minor warnings: ${warnings.join(', ')}`,
          details: { 
            warnings,
            completeness_score: score
          }
        };
      }
      
      return {
        passed: true,
        score: 100,
        message: 'All required data is present and complete',
        details: { completeness_score: 100 }
      };
      
    } catch (error) {
      return {
        passed: false,
        score: 0,
        message: `Data completeness validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      };
    }
  }
  
  /**
   * Calculate overall logic score from individual checks
   */
  private calculateLogicScore(checks: Record<string, ValidationCheck>): number {
    const weights = {
      price_realism: 0.35,      // 35% - Most critical
      date_consistency: 0.25,   // 25% - Very important
      route_accuracy: 0.25,     // 25% - Very important
      data_completeness: 0.15   // 15% - Important but less critical
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [checkName, check] of Object.entries(checks)) {
      const weight = weights[checkName as keyof typeof weights] || 0;
      totalScore += check.score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }
  
  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(checks: Record<string, ValidationCheck>): string[] {
    const recommendations: string[] = [];
    
    // Price realism recommendations
    if (!checks.price_realism.passed) {
      recommendations.push('Review price data for accuracy and realism');
      recommendations.push('Consider using dynamic pricing APIs for real-time data');
    }
    
    // Date consistency recommendations
    if (!checks.date_consistency.passed) {
      recommendations.push('Ensure departure dates are in the future');
      recommendations.push('Verify return dates are after departure dates');
    }
    
    // Route accuracy recommendations
    if (!checks.route_accuracy.passed) {
      recommendations.push('Validate airport codes against IATA standards');
      recommendations.push('Consider using airport code validation service');
    }
    
    // Data completeness recommendations
    if (!checks.data_completeness.passed) {
      recommendations.push('Ensure all required fields are populated');
      recommendations.push('Add data validation to prevent incomplete campaigns');
    }
    
    return recommendations;
  }
  
  /**
   * Get realistic price ranges for different route types
   */
  private getPriceRanges(origin: string, destination: string, currency: string): { min: number; max: number } {
    // Basic price range logic (can be enhanced with real data)
    const basePrices = {
      'RUB': { domestic: { min: 3000, max: 50000 }, international: { min: 15000, max: 150000 } },
      'USD': { domestic: { min: 50, max: 800 }, international: { min: 200, max: 2000 } },
      'EUR': { domestic: { min: 50, max: 700 }, international: { min: 180, max: 1800 } }
    };
    
    const currencyRanges = basePrices[currency as keyof typeof basePrices] || basePrices.USD;
    
    // Simple domestic/international detection (can be enhanced)
    const russianAirports = ['LED', 'SVO', 'DME', 'VKO', 'KZN', 'ROV', 'UFA', 'NOZ'];
    const isDomestic = russianAirports.includes(origin) && russianAirports.includes(destination);
    
    return isDomestic ? currencyRanges.domestic : currencyRanges.international;
  }
  
  /**
   * Parse date range string into start and end dates
   */
  private parseDateRange(dateRange: string): { startDate: Date; endDate?: Date } | null {
    try {
      // Handle different date range formats
      if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        return {
          startDate: new Date(start.trim()),
          endDate: new Date(end.trim())
        };
      } else {
        return {
          startDate: new Date(dateRange.trim())
        };
      }
    } catch {
      return null;
    }
  }
  
  /**
   * Get known airport codes for validation
   * In production, this would be loaded from a comprehensive database
   */
  private getKnownAirportCodes(): string[] {
    return [
      // Russian airports
      'LED', 'SVO', 'DME', 'VKO', 'KZN', 'ROV', 'UFA', 'NOZ', 'KRR', 'AER',
      // International airports
      'JFK', 'LAX', 'LHR', 'CDG', 'FRA', 'AMS', 'IST', 'DXB', 'SIN', 'NRT',
      'ICN', 'PEK', 'PVG', 'HKG', 'BKK', 'DEL', 'BOM', 'MAD', 'BCN', 'FCO',
      'MUC', 'ZUR', 'VIE', 'PRG', 'WAW', 'ARN', 'CPH', 'OSL', 'HEL', 'RIX'
    ];
  }
} 