/**
 * Airport Data Loader
 * Loads airport data from CSV and provides airport to city code mapping
 */

import fs from 'fs';
import path from 'path';

interface AirportData {
  code: string;
  city_code: string;
  country_code: string;
  time_zone: string;
  iata_type: string;
  flightable: string;
  name: string;
  name_en: string;
  lat: string;
  lon: string;
}

interface DestinationInfo {
  originalCode: string;
  finalCode: string;
  countryCode: string;
  isInternational: boolean;
  wasConverted: boolean;
}

let airportsData: Map<string, AirportData> | null = null;

/**
 * Load airports data from CSV file
 */
function loadAirportsData(): Map<string, AirportData> {
  if (airportsData) {
    return airportsData;
  }

  const csvPath = path.resolve(process.cwd(), 'airports.csv');
  
  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header line
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    airportsData = new Map();
    
    for (const line of dataLines) {
      // Split by semicolon as per CSV format
      const columns = line.split(';');
      
      if (columns.length >= 10) {
        const airport: AirportData = {
          code: columns[0].trim(),
          city_code: columns[1].trim(),
          country_code: columns[2].trim(),
          time_zone: columns[3].trim(),
          iata_type: columns[4].trim(),
          flightable: columns[5].trim(),
          name: columns[6].trim(),
          name_en: columns[7].trim(),
          lat: columns[8].trim(),
          lon: columns[9].trim()
        };
        
        airportsData.set(airport.code, airport);
      }
    }
    
    console.log(`✈️ Loaded ${airportsData.size} airports from CSV`);
    return airportsData;
    
  } catch (error) {
    console.error('❌ Failed to load airports.csv:', error);
    // Return empty map as fallback
    airportsData = new Map();
    return airportsData;
  }
}

/**
 * Convert airport code to city code using CSV data
 */
export function convertAirportToCity(airportCode: string): string {
  const airports = loadAirportsData();
  const airport = airports.get(airportCode);
  
  if (airport && airport.city_code) {
    return airport.city_code;
  }
  
  // Return original code if not found
  return airportCode;
}

/**
 * Get comprehensive destination information
 */
export function getDestinationInfo(destination: string): DestinationInfo {
  const airports = loadAirportsData();
  const airport = airports.get(destination);
  
  const originalCode = destination;
  const finalCode = airport?.city_code || destination;
  const countryCode = airport?.country_code || 'UNKNOWN';
  
  // Russian airports based on country code
  const isRussianDestination = countryCode === 'RU';
  
  return {
    originalCode,
    finalCode,
    countryCode,
    isInternational: !isRussianDestination,
    wasConverted: originalCode !== finalCode
  };
}

/**
 * Get airport details by code
 */
export function getAirportDetails(airportCode: string): AirportData | null {
  const airports = loadAirportsData();
  return airports.get(airportCode) || null;
}

/**
 * Search airports by name (Russian or English)
 */
export function searchAirportsByName(searchTerm: string): AirportData[] {
  const airports = loadAirportsData();
  const results: AirportData[] = [];
  const searchLower = searchTerm.toLowerCase();
  
  for (const airport of airports.values()) {
    if (airport.name.toLowerCase().includes(searchLower) || 
        airport.name_en.toLowerCase().includes(searchLower)) {
      results.push(airport);
    }
  }
  
  return results;
}

/**
 * Get all airports in a country
 */
export function getAirportsByCountry(countryCode: string): AirportData[] {
  const airports = loadAirportsData();
  const results: AirportData[] = [];
  
  for (const airport of airports.values()) {
    if (airport.country_code === countryCode) {
      results.push(airport);
    }
  }
  
  return results;
}