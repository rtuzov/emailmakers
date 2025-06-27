// Load environment variables
import { config } from 'dotenv';
import path from 'path';

// Load .env.local file
config({ path: path.resolve(process.cwd(), '.env.local') });

import * as fs from 'fs';

export interface AirportData {
  code: string;
  cityCode: string;
  countryCode: string;
  timeZone: string;
  iataType: string;
  flightable: boolean;
  name: string;
  nameEn: string;
  lat: number;
  lon: number;
}

let airportToCity: Map<string, string> | null = null;
let cityToCountry: Map<string, string> | null = null;

/**
 * Загружает данные из airports.csv и создает индекс аэропорт → город
 */
export function loadAirportsData(): { airportToCity: Map<string, string>; cityToCountry: Map<string, string> } {
  if (airportToCity && cityToCountry) {
    return { airportToCity, cityToCountry };
  }

  console.log('📂 Loading airports data from CSV...');
  
  try {
    const csvPath = path.resolve(process.cwd(), 'airports.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Пропускаем заголовок
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    airportToCity = new Map();
    cityToCountry = new Map();
    
    let processedCount = 0;
    let airportCount = 0;
    
    for (const line of dataLines) {
      const columns = line.split(';');
      
      if (columns.length >= 10) {
        const code = columns[0]?.trim();
        const cityCode = columns[1]?.trim();
        const countryCode = columns[2]?.trim();
        const iataType = columns[4]?.trim();
        const flightableStr = columns[5]?.trim();
        
        if (code && cityCode && code !== cityCode) {
          // Добавляем только если это аэропорт и он отличается от кода города
          if (iataType === 'airport' && flightableStr === 'True') {
            airportToCity.set(code, cityCode);
            airportCount++;
          }
          
          // Сохраняем связь город → страна
          if (cityCode && countryCode) {
            cityToCountry.set(cityCode, countryCode);
          }
          
          processedCount++;
        }
      }
    }
    
    console.log(`✅ Loaded ${airportCount} airport mappings from ${processedCount} total records`);
    console.log(`📊 Country mappings: ${cityToCountry.size} cities`);
    
    return { airportToCity, cityToCountry };
    
  } catch (error) {
    console.error('❌ Failed to load airports data:', error);
    
    // Возвращаем пустые Maps в случае ошибки
    airportToCity = new Map();
    cityToCountry = new Map();
    
    return { airportToCity, cityToCountry };
  }
}

/**
 * Конвертирует код аэропорта в код города на основе загруженных данных
 */
export function convertAirportToCity(airportCode: string): { cityCode: string; wasConverted: boolean; countryCode?: string } {
  const { airportToCity: mappings, cityToCountry: countries } = loadAirportsData();
  
  const cityCode = mappings.get(airportCode);
  
  if (cityCode) {
    const countryCode = countries.get(cityCode);
    return {
      cityCode,
      wasConverted: true,
      countryCode
    };
  } else {
    // Если конвертация не найдена, возвращаем исходный код
    const countryCode = countries.get(airportCode);
    return {
      cityCode: airportCode,
      wasConverted: false,
      countryCode
    };
  }
}

/**
 * Проверяет, является ли код международным направлением (не Россия/СНГ)
 */
export function isInternationalDestination(code: string): boolean {
  const { cityToCountry } = loadAirportsData();
  const countryCode = cityToCountry.get(code);
  
  // Коды стран России и СНГ
  const domesticCountries = ['RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ', 'AM', 'AZ', 'GE', 'MD'];
  
  return countryCode ? !domesticCountries.includes(countryCode) : false;
}

/**
 * Получает информацию о направлении
 */
export function getDestinationInfo(code: string): {
  originalCode: string;
  finalCode: string;
  cityName?: string;
  countryCode?: string;
  isInternational: boolean;
  wasConverted: boolean;
} {
  const conversion = convertAirportToCity(code);
  
  return {
    originalCode: code,
    finalCode: conversion.cityCode,
    countryCode: conversion.countryCode,
    isInternational: isInternationalDestination(conversion.cityCode),
    wasConverted: conversion.wasConverted
  };
} 