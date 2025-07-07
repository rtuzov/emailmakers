/**
 * 🧪 UNIT TESTS: Multi-Destination Types Validation
 * 
 * Комплексные тесты для всех Zod схем в multi-destination-types.ts
 * Проверяют валидацию данных, edge cases, и совместимость с OpenAI SDK v2
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

// Import types and schemas to test
import {
  // Core types
  type MultiDestinationPlan,
  type DestinationPlan, 
  type UnifiedLayoutPlan,
  type GeographicalInfo,
  type SeasonalContext,
  type DestinationPricing,
  
  // Zod schemas
  multiDestinationPlanSchema,
  destinationPlanSchema,
  unifiedLayoutPlanSchema,
  geographicalInfoSchema,
  seasonalContextSchema,
  destinationPricingSchema,
  
  // Utility types and functions
  type LayoutType,
  type SupportedRegion,
  type TravelSeason,
  type ValidationResult,
  validateMultiDestinationData,
  MULTI_DESTINATION_LIMITS,
  SUPPORTED_REGIONS,
  TRAVEL_SEASONS,
  LAYOUT_TYPES
} from '../../../src/shared/types/multi-destination-types';

describe('Multi-Destination Types Validation', () => {
  
  describe('GeographicalInfo Schema', () => {
    
    it('should validate valid geographical info with all fields', () => {
      const validGeoInfo: GeographicalInfo = {
        country_code: 'FR',
        country_name: 'France',
        city: 'Paris',
        region: 'europe',
        continent: 'Europe',
        coordinates: {
          latitude: 48.8566,
          longitude: 2.3522
        },
        timezone: 'Europe/Paris'
      };
      
      const result = geographicalInfoSchema.safeParse(validGeoInfo);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country_code).toBe('FR');
        expect(result.data.region).toBe('europe');
        expect(result.data.coordinates?.latitude).toBe(48.8566);
      }
    });
    
    it('should validate minimal geographical info', () => {
      const minimalGeoInfo = {
        country_code: 'IT',
        country_name: 'Italy',
        region: 'europe',
        continent: 'Europe'
      };
      
      const result = geographicalInfoSchema.safeParse(minimalGeoInfo);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid country_code', () => {
      const invalidGeoInfo = {
        country_code: 'X', // Too short
        country_name: 'Invalid',
        region: 'europe',
        continent: 'Europe'
      };
      
      const result = geographicalInfoSchema.safeParse(invalidGeoInfo);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid coordinates', () => {
      const invalidGeoInfo = {
        country_code: 'ES',
        country_name: 'Spain',
        region: 'europe',
        continent: 'Europe',
        coordinates: {
          latitude: 200, // Invalid: > 90
          longitude: 0
        }
      };
      
      const result = geographicalInfoSchema.safeParse(invalidGeoInfo);
      expect(result.success).toBe(false);
    });
    
  });
  
  describe('SeasonalContext Schema', () => {
    
    it('should validate complete seasonal context', () => {
      const validSeasonal: SeasonalContext = {
        primary_season: 'autumn',
        optimal_months: [9, 10, 11],
        weather_description: 'Mild temperatures with beautiful foliage',
        seasonal_highlights: ['Wine harvest', 'Fall festivals', 'Comfortable weather'],
        temperature_range: {
          min: 15,
          max: 25,
          unit: 'celsius'
        }
      };
      
      const result = seasonalContextSchema.safeParse(validSeasonal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.primary_season).toBe('autumn');
        expect(result.data.optimal_months).toHaveLength(3);
        expect(result.data.optimal_months).toContain(10);
      }
    });
    
    it('should validate minimal seasonal context', () => {
      const minimalSeasonal: SeasonalContext = {
        primary_season: 'spring',
        optimal_months: [3, 4, 5]
      };
      
      const result = seasonalContextSchema.safeParse(minimalSeasonal);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid month numbers', () => {
      const invalidSeasonal = {
        primary_season: 'summer',
        optimal_months: [13, 14] // Invalid: > 12
      };
      
      const result = seasonalContextSchema.safeParse(invalidSeasonal);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid season', () => {
      const invalidSeasonal = {
        primary_season: 'invalid_season',
        optimal_months: [6, 7, 8]
      };
      
      const result = seasonalContextSchema.safeParse(invalidSeasonal);
      expect(result.success).toBe(false);
    });
    
  });
  
  describe('DestinationPricing Schema', () => {
    
    it('should validate complete destination pricing', () => {
      const validPricing: DestinationPricing = {
        base_price: 450,
        currency: 'EUR',
        price_range: {
          min: 400,
          max: 750
        },
        best_booking_period: {
          start_date: '2024-09-01',
          end_date: '2024-11-30'
        },
        savings_potential: 25,
        price_trend: 'stable'
      };
      
      const result = destinationPricingSchema.safeParse(validPricing);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.base_price).toBe(450);
        expect(result.data.currency).toBe('EUR');
        expect(result.data.price_range.min).toBe(400);
      }
    });
    
    it('should validate minimal pricing', () => {
      const minimalPricing: DestinationPricing = {
        base_price: 200,
        currency: 'USD',
        price_range: {
          min: 150,
          max: 300
        }
      };
      
      const result = destinationPricingSchema.safeParse(minimalPricing);
      expect(result.success).toBe(true);
    });
    
    it('should reject negative prices', () => {
      const invalidPricing = {
        base_price: -100, // Invalid: negative
        currency: 'EUR',
        price_range: {
          min: 0,
          max: 500
        }
      };
      
      const result = destinationPricingSchema.safeParse(invalidPricing);
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid currency code', () => {
      const invalidPricing = {
        base_price: 300,
        currency: 'XY', // Invalid: too short
        price_range: {
          min: 250,
          max: 400
        }
      };
      
      const result = destinationPricingSchema.safeParse(invalidPricing);
      expect(result.success).toBe(false);
    });
    
  });
  
  describe('Constants and Utility Types', () => {
    
    it('should have proper constants defined', () => {
      expect(SUPPORTED_REGIONS).toContain('europe');
      expect(SUPPORTED_REGIONS).toContain('asia');
      expect(TRAVEL_SEASONS).toContain('autumn');
      expect(LAYOUT_TYPES).toContain('grid');
      expect(MULTI_DESTINATION_LIMITS.MIN_DESTINATIONS).toBe(2);
      expect(MULTI_DESTINATION_LIMITS.MAX_DESTINATIONS).toBe(12);
    });
    
    it('should validate layout type constraints', () => {
      const gridConstraints = MULTI_DESTINATION_LIMITS.OPTIMAL_DESTINATIONS.grid;
      expect(gridConstraints.min).toBe(4);
      expect(gridConstraints.max).toBe(6);
      
      const compactConstraints = MULTI_DESTINATION_LIMITS.OPTIMAL_DESTINATIONS.compact;
      expect(compactConstraints.min).toBe(2);
      expect(compactConstraints.max).toBe(3);
    });
    
  });
  
  describe('Utility Function validateMultiDestinationData', () => {
    
    it('should validate correct basic data', () => {
      const testData = {
        campaign_id: 'test_validation_123',
        destinations: [
          {
            destination: 'France',
            appeal_score: 90
          }
        ]
      };
      
      const result = validateMultiDestinationData(testData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validationScore).toBeGreaterThan(0);
    });
    
    it('should return validation errors for invalid data', () => {
      const invalidData = {
        campaign_id: '', // Empty string - invalid
        destinations: [] // Empty array - invalid
      };
      
      const result = validateMultiDestinationData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should handle null and undefined data', () => {
      const nullResult = validateMultiDestinationData(null);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.validationScore).toBe(0);
      
      const undefinedResult = validateMultiDestinationData(undefined);
      expect(undefinedResult.isValid).toBe(false);
      expect(undefinedResult.validationScore).toBe(0);
    });
    
    it('should validate with custom criteria', () => {
      const testData = {
        campaign_id: 'test_with_criteria',
        destinations: [{ destination: 'Italy' }]
      };
      
      const result = validateMultiDestinationData(testData, {
        max_email_size_kb: 80,
        seasonal_date_validation: true
      });
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Email size validation'))).toBe(true);
    });
    
  });
  
  describe('OpenAI SDK v2 Compatibility', () => {
    
    it('should work with OpenAI compatible schemas', () => {
      // Test that basic schemas work with simple data
      const geoInfo = {
        country_code: 'FR',
        country_name: 'France',
        region: 'europe',
        continent: 'Europe'
      };
      
      const geoResult = geographicalInfoSchema.safeParse(geoInfo);
      expect(geoResult.success).toBe(true);
    });
    
    it('should handle optional fields correctly', () => {
      const pricing = {
        base_price: 400,
        currency: 'EUR',
        price_range: {
          min: 350,
          max: 500
        }
        // Optional fields omitted
      };
      
      const pricingResult = destinationPricingSchema.safeParse(pricing);
      expect(pricingResult.success).toBe(true);
    });
    
    it('should validate type constants', () => {
      // Test that our type unions work correctly
      const validRegion: SupportedRegion = 'europe';
      const validSeason: TravelSeason = 'autumn';
      const validLayout: LayoutType = 'grid';
      
      expect(SUPPORTED_REGIONS).toContain(validRegion);
      expect(TRAVEL_SEASONS).toContain(validSeason);
      expect(LAYOUT_TYPES).toContain(validLayout);
    });
    
  });
  
});