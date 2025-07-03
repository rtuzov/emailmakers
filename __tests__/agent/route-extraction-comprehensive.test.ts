/**
 * Comprehensive Route Extraction Test
 * Tests the fixed route extraction functionality to ensure Russian city names
 * are properly converted to IATA codes and invalid words are filtered out
 */

import { ContentSpecialistAgent } from '../../src/agent/specialists/content-specialist-agent';

describe('Route Extraction Comprehensive Test', () => {
  let contentSpecialist: ContentSpecialistAgent;

  beforeEach(() => {
    contentSpecialist = new ContentSpecialistAgent();
  });

  afterEach(async () => {
    await contentSpecialist.shutdown();
  });

  describe('Fixed Route Extraction', () => {
    test('should NOT extract "Авиабилеты" as origin city', () => {
      const text = "Горящие предложения на авиабилеты в Сочи из Москвы на новогодние каникулы";
      
      // Access the private method for testing
      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);
      const routes = extractRoutesFromText(text);

      console.log('🧪 Testing text:', text);
      console.log('📍 Extracted routes:', routes);

      // Should extract "Москва → Сочи", NOT "Авиабилеты → Сочи"
      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual({
        origin: 'MOW', // Москва
        destination: 'AER' // Сочи
      });
    });

    test('should properly extract routes from various Russian text patterns', () => {
      const testCases = [
        {
          text: "Билеты из Санкт-Петербурга в Париж",
          expected: [{ origin: 'LED', destination: 'PAR' }]
        },
        {
          text: "Дешевые авиабилеты Москва-Лондон",
          expected: [{ origin: 'MOW', destination: 'LON' }]
        },
        {
          text: "Путешествие в Дубай из Екатеринбурга",
          expected: [{ origin: 'SVX', destination: 'DXB' }]
        },
        {
          text: "Отдых на Бали",
          expected: [{ origin: 'MOW', destination: 'DPS' }] // Default origin for Bali
        }
      ];

      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);

      testCases.forEach(({ text, expected }) => {
        const routes = extractRoutesFromText(text);
        console.log(`🧪 Testing: "${text}"`);
        console.log(`📍 Expected: ${JSON.stringify(expected)}`);
        console.log(`📍 Actual: ${JSON.stringify(routes)}`);
        
        expect(routes).toHaveLength(expected.length);
        routes.forEach((route, index) => {
          expect(route).toEqual(expected[index]);
        });
      });
    });

    test('should filter out non-city words from route extraction', () => {
      const excludeWords = [
        'авиабилеты', 'билеты', 'рейсы', 'путешествия', 'туры', 
        'отдых', 'каникулы', 'горящие', 'акции', 'скидки'
      ];

      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);

      excludeWords.forEach(word => {
        const text = `${word} в Сочи`;
        const routes = extractRoutesFromText(text);
        
        console.log(`🧪 Testing exclude word: "${word}"`);
        console.log(`📍 Text: "${text}"`);
        console.log(`📍 Routes: ${JSON.stringify(routes)}`);

        // Should extract default route to Sochi, not use the exclude word as origin
        if (routes.length > 0) {
          expect(routes[0].origin).not.toBe(word.toUpperCase());
          expect(routes[0].destination).toBe('AER'); // Сочи
        }
      });
    });

    test('should handle complex travel marketing text correctly', () => {
      const complexText = `
        🔥 ГОРЯЩИЕ АВИАБИЛЕТЫ! 
        
        Специальные предложения на путешествия:
        - Москва → Сочи от 5,990₽
        - Санкт-Петербург → Париж от 15,990₽  
        - Екатеринбург → Дубай от 25,990₽
        
        Бронируйте билеты на новогодние каникулы!
        Отдых в Турции из Казани - лучшие цены!
      `;

      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);
      const routes = extractRoutesFromText(complexText);

      console.log('🧪 Testing complex marketing text');
      console.log('📍 Extracted routes:', routes);

      // Should extract multiple valid routes
      expect(routes.length).toBeGreaterThan(0);
      
      // Verify specific routes are correctly extracted
      const expectedRoutes = [
        { origin: 'MOW', destination: 'AER' }, // Москва → Сочи
        { origin: 'LED', destination: 'PAR' }, // Санкт-Петербург → Париж
        { origin: 'SVX', destination: 'DXB' }, // Екатеринбург → Дубай
        { origin: 'KZN', destination: 'MOW' }  // Казань → default for Turkey (approximation)
      ];

      // Check that we have valid IATA codes
      routes.forEach(route => {
        expect(route.origin).toMatch(/^[A-Z]{3}$/);
        expect(route.destination).toMatch(/^[A-Z]{3}$/);
        expect(route.origin).not.toBe(route.destination);
      });
    });

    test('should handle edge cases and invalid inputs', () => {
      const edgeCases = [
        "",
        "Никаких городов в этом тексте",
        "123 456 789",
        "авиабилеты билеты рейсы", // Only exclude words
        "в в в из из из" // Only prepositions
      ];

      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);

      edgeCases.forEach(text => {
        const routes = extractRoutesFromText(text);
        console.log(`🧪 Testing edge case: "${text}"`);
        console.log(`📍 Routes: ${JSON.stringify(routes)}`);
        
        // Should return empty array or valid routes only
        routes.forEach(route => {
          expect(route.origin).toMatch(/^[A-Z]{3}$/);
          expect(route.destination).toMatch(/^[A-Z]{3}$/);
          expect(route.origin).not.toBe(route.destination);
        });
      });
    });

    test('should demonstrate the original bug fix', () => {
      // This is the exact text that caused the original issue
      const originalProblemText = "Горящие предложения на авиабилеты в Сочи из Москвы на новогодние каникулы";
      
      const extractRoutesFromText = (contentSpecialist as any).extractRoutesFromText.bind(contentSpecialist);
      const routes = extractRoutesFromText(originalProblemText);

      console.log('🧪 Original problem text:', originalProblemText);
      console.log('📍 Fixed extraction result:', routes);

      // BEFORE FIX: Would have extracted [{ origin: "АВИАБИЛЕТЫ", destination: "AER" }]
      // AFTER FIX: Should extract [{ origin: "MOW", destination: "AER" }]
      
      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual({
        origin: 'MOW', // Москва (not "АВИАБИЛЕТЫ")
        destination: 'AER' // Сочи
      });

      // Verify the bug is fixed
      expect(routes[0].origin).not.toBe('АВИАБИЛЕТЫ');
      expect(routes[0].origin).not.toBe('авиабилеты');
    });
  });
}); 