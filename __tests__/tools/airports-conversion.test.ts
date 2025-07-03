/**
 * Tests for Russian city name to IATA code conversion
 */

import { convertRussianCityToIATA, getDestinationInfo } from '../../src/agent/tools/airports-loader';

describe('Russian City to IATA Conversion', () => {
  test('should convert common Russian cities to IATA codes', () => {
    expect(convertRussianCityToIATA('москва')).toBe('MOW');
    expect(convertRussianCityToIATA('Москва')).toBe('MOW');
    expect(convertRussianCityToIATA('МОСКВА')).toBe('MOW');
    
    expect(convertRussianCityToIATA('сочи')).toBe('AER');
    expect(convertRussianCityToIATA('Сочи')).toBe('AER');
    
    expect(convertRussianCityToIATA('санкт-петербург')).toBe('LED');
    expect(convertRussianCityToIATA('петербург')).toBe('LED');
    expect(convertRussianCityToIATA('питер')).toBe('LED');
  });

  test('should convert international destinations', () => {
    expect(convertRussianCityToIATA('париж')).toBe('PAR');
    expect(convertRussianCityToIATA('лондон')).toBe('LON');
    expect(convertRussianCityToIATA('дубай')).toBe('DXB');
    expect(convertRussianCityToIATA('бали')).toBe('DPS');
  });

  test('should return original value for unknown cities', () => {
    expect(convertRussianCityToIATA('неизвестныйгород')).toBe('неизвестныйгород');
    expect(convertRussianCityToIATA('авиабилеты')).toBe('авиабилеты');
    expect(convertRussianCityToIATA('билеты')).toBe('билеты');
  });

  test('should handle partial matches', () => {
    // Should match "ростов" even if input contains extra text
    expect(convertRussianCityToIATA('ростов-на-дону')).toBe('ROV');
    expect(convertRussianCityToIATA('ростов')).toBe('ROV');
  });

  test('getDestinationInfo should use Russian city conversion', () => {
    const result = getDestinationInfo('сочи');
    
    expect(result.originalCode).toBe('сочи');
    expect(result.finalCode).toBe('AER');
    expect(result.wasConverted).toBe(true);
  });

  test('should not convert words that are not cities', () => {
    const nonCityWords = [
      'авиабилеты', 'билеты', 'рейсы', 'путешествия', 'туры', 
      'отдых', 'каникулы', 'горящие', 'акции', 'скидки',
      'предложения', 'цены', 'стоимость', 'бронирование'
    ];

    nonCityWords.forEach(word => {
      expect(convertRussianCityToIATA(word)).toBe(word);
    });
  });
}); 