/**
 * Integration Test: Russian City to IATA Conversion
 * Tests the complete pipeline from Russian city names to IATA codes and pricing
 */

import { ContentSpecialistAgent } from '../../src/agent/specialists/content-specialist-agent';
import { convertRussianCityToIATA } from '../../src/agent/tools/airports-loader';

describe('Russian City Integration Test', () => {
  let contentSpecialist: ContentSpecialistAgent;

  beforeEach(() => {
    contentSpecialist = new ContentSpecialistAgent();
  });

  afterEach(async () => {
    await contentSpecialist.shutdown();
  });

  describe('Russian City to IATA Conversion', () => {
    test('should convert common Russian cities to IATA codes', () => {
      expect(convertRussianCityToIATA('москва')).toBe('MOW');
      expect(convertRussianCityToIATA('сочи')).toBe('AER');
      expect(convertRussianCityToIATA('санкт-петербург')).toBe('LED');
      expect(convertRussianCityToIATA('париж')).toBe('PAR');
      expect(convertRussianCityToIATA('лондон')).toBe('LON');
      expect(convertRussianCityToIATA('дубай')).toBe('DXB');
    });

    test('should handle case insensitive input', () => {
      expect(convertRussianCityToIATA('МОСКВА')).toBe('MOW');
      expect(convertRussianCityToIATA('СоЧи')).toBe('AER');
      expect(convertRussianCityToIATA('Париж')).toBe('PAR');
    });

    test('should return null for non-city words', () => {
      expect(convertRussianCityToIATA('авиабилеты')).toBeNull();
      expect(convertRussianCityToIATA('билеты')).toBeNull();
      expect(convertRussianCityToIATA('путешествия')).toBeNull();
      expect(convertRussianCityToIATA('рейсы')).toBeNull();
    });
  });

  describe('Route Extraction from Marketing Text', () => {
    test('should extract correct routes from promotional text', async () => {
      const input = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Горящие предложения на авиабилеты в Сочи из Москвы на новогодние каникулы',
          campaign_type: 'promotional',
          target_audience: 'семьи с детьми'
        },
        content_requirements: {
          content_type: 'complete_campaign' as const,
          tone: 'friendly' as const,
          language: 'ru' as const
        }
      };

      // This should extract MOW → AER, not "АВИАБИЛЕТЫ → AER"
      const briefAnalysis = (contentSpecialist as any).analyzeBriefForTravelData(
        input.campaign_brief, 
        new Date()
      );

      expect(briefAnalysis.routes).toHaveLength(1);
      expect(briefAnalysis.routes[0]).toEqual({
        origin: 'MOW',
        destination: 'AER'
      });
    });

    test('should handle Paris destination correctly', async () => {
      const input = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Авиабилеты из Москвы в Париж на весенние каникулы',
          campaign_type: 'promotional',
          target_audience: 'семьи с детьми'
        },
        content_requirements: {
          content_type: 'complete_campaign' as const,
          tone: 'friendly' as const,
          language: 'ru' as const
        }
      };

      const briefAnalysis = (contentSpecialist as any).analyzeBriefForTravelData(
        input.campaign_brief, 
        new Date()
      );

      expect(briefAnalysis.routes).toHaveLength(1);
      expect(briefAnalysis.routes[0]).toEqual({
        origin: 'MOW',
        destination: 'PAR'
      });
    });

    test('should filter out non-city words from route extraction', async () => {
      const input = {
        task_type: 'generate_content' as const,
        campaign_brief: {
          topic: 'Авиабилеты, билеты, рейсы в Сочи - путешествия из Москвы',
          campaign_type: 'promotional',
          target_audience: 'general'
        },
        content_requirements: {
          content_type: 'complete_campaign' as const,
          tone: 'friendly' as const,
          language: 'ru' as const
        }
      };

      const briefAnalysis = (contentSpecialist as any).analyzeBriefForTravelData(
        input.campaign_brief, 
        new Date()
      );

      // Should extract only MOW → AER, filtering out авиабилеты, билеты, рейсы, путешествия
      expect(briefAnalysis.routes).toHaveLength(1);
      expect(briefAnalysis.routes[0]).toEqual({
        origin: 'MOW',
        destination: 'AER'
      });
    });
  });

  describe('Enhanced Content Prompt Building', () => {
    test('should build prompt with IATA codes and pricing instructions', () => {
      const contentParams = {
        topic: 'Авиабилеты в Сочи',
        tone: 'friendly',
        language: 'ru',
        target_audience: 'семьи с детьми',
        urgency_level: 'high'
      };

      const briefAnalysis = {
        routes: [{ origin: 'MOW', destination: 'AER' }],
        suggestedDates: '2025-07-15,2025-08-14',
        travelPurpose: 'отпуск',
        urgency: 'high',
        seasonality: 'summer'
      };

      const pricingData = {
        data: {
          cheapest: 19753,
          currency: 'RUB'
        }
      };

      const prompt = (contentSpecialist as any).buildEnhancedContentPrompt(
        contentParams,
        briefAnalysis,
        pricingData
      );

      // Should include IATA codes
      expect(prompt).toContain('Маршруты (IATA коды): MOW → AER');
      
      // Should include real pricing
      expect(prompt).toContain('РЕАЛЬНЫЕ ЦЕНЫ: от 19753 RUB');
      
      // Should include pricing instruction
      expect(prompt).toContain('ОБЯЗАТЕЛЬНО используй реальную цену 19753 RUB в контенте');
      
      // Should warn against placeholder prices
      expect(prompt).toContain('НЕ используй "от 0 RUB" или другие placeholder цены');
      
      // Should explain IATA code conversion
      expect(prompt).toContain('IATA коды уже конвертированы из русских названий городов');
      expect(prompt).toContain('НЕ проси пользователя указать коды аэропортов');
    });

    test('should handle missing pricing data gracefully', () => {
      const contentParams = {
        topic: 'Авиабилеты в Сочи',
        tone: 'friendly',
        language: 'ru',
        target_audience: 'семьи с детьми',
        urgency_level: 'medium'
      };

      const briefAnalysis = {
        routes: [{ origin: 'MOW', destination: 'AER' }],
        suggestedDates: '2025-07-15,2025-08-14',
        travelPurpose: 'отпуск',
        urgency: 'medium',
        seasonality: 'summer'
      };

      const pricingData = null;

      const prompt = (contentSpecialist as any).buildEnhancedContentPrompt(
        contentParams,
        briefAnalysis,
        pricingData
      );

      // Should still include IATA codes
      expect(prompt).toContain('Маршруты (IATA коды): MOW → AER');
      
      // Should handle missing pricing gracefully
      expect(prompt).toContain('Цены не найдены - сосредоточься на ценностных предложениях');
      
      // Should not include specific pricing instructions
      expect(prompt).not.toContain('РЕАЛЬНЫЕ ЦЕНЫ:');
    });
  });
}); 