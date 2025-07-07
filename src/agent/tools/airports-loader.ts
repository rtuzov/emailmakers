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

// Russian city names to IATA codes mapping
const RUSSIAN_CITY_TO_IATA: Record<string, string> = {
  // Major Russian cities
  'москва': 'MOW',
  'санкт-петербург': 'LED',
  'петербург': 'LED',
  'спб': 'LED',
  'питер': 'LED',
  'сочи': 'AER',
  'екатеринбург': 'SVX',
  'новосибирск': 'OVB',
  'казань': 'KZN',
  'нижний новгород': 'GOJ',
  'челябинск': 'CEK',
  'омск': 'OMS',
  'самара': 'KUF',
  'ростов-на-дону': 'ROV',
  'ростов': 'ROV',
  'уфа': 'UFA',
  'красноярск': 'KJA',
  'воронеж': 'VOZ',
  'пермь': 'PEE',
  'волгоград': 'VOG',
  'краснодар': 'KRR',
  'саратов': 'RTW',
  'тюмень': 'TJM',
  'иркутск': 'IKT',
  'хабаровск': 'KHV',
  'владивосток': 'VVO',
  'калининград': 'KGD',
  'мурманск': 'MMK',
  'архангельск': 'ARH',
  'сыктывкар': 'SCW',
  'киров': 'KVX',
  'ижевск': 'IJK',
  'оренбург': 'REN',
  'пенза': 'PEZ',
  'ульяновск': 'ULY',
  'курск': 'URS',
  'белгород': 'EGO',
  'тула': 'TYA',
  'рязань': 'RZN',
  'липецк': 'LPK',
  'тамбов': 'TBW',
  'брянск': 'BZK',
  'калуга': 'KLF',
  'орел': 'OEL',
  'смоленск': 'LNX',
  'тверь': 'KLD',
  'ярославль': 'IAR',
  'кострома': 'KMW',
  'иваново': 'IWA',
  'владимир': 'VLM',
  
  // International destinations
  'париж': 'PAR',
  'лондон': 'LON',
  'рим': 'ROM',
  'берлин': 'BER',
  'мадрид': 'MAD',
  'барселона': 'BCN',
  'амстердам': 'AMS',
  'вена': 'VIE',
  'прага': 'PRG',
  'варшава': 'WAW',
  'стокгольм': 'STO',
  'хельсинки': 'HEL',
  'копенгаген': 'CPH',
  'осло': 'OSL',
  'цюрих': 'ZUR',
  'женева': 'GVA',
  'милан': 'MIL',
  'венеция': 'VCE',
  'неаполь': 'NAP',
  'афины': 'ATH',
  'стамбул': 'IST',
  'анкара': 'ANK',
  'анталья': 'AYT',
  'дубай': 'DXB',
  'абу-даби': 'AUH',
  'доха': 'DOH',
  'эр-рияд': 'RUH',
  'кувейт': 'KWI',
  'тель-авив': 'TLV',
  'каир': 'CAI',
  'касабланка': 'CAS',
  'тунис': 'TUN',
  'алжир': 'ALG',
  'нью-йорк': 'NYC',
  'лос-анджелес': 'LAX',
  'чикаго': 'CHI',
  'майами': 'MIA',
  'торонто': 'YTO',
  'ванкувер': 'YVR',
  'токио': 'TYO',
  'осака': 'OSA',
  'сеул': 'SEL',
  'пекин': 'BJS',
  'шанхай': 'SHA',
  'гонконг': 'HKG',
  'сингапур': 'SIN',
  'куала-лумпур': 'KUL',
  'джакарта': 'JKT',
  'бангкок': 'BKK',
  'хошимин': 'SGN',
  'ханой': 'HAN',
  'манила': 'MNL',
  'дели': 'DEL',
  'мумбаи': 'BOM',
  'бангалор': 'BLR',
  'коломбо': 'CMB',
  'катманду': 'KTM',
  'ташкент': 'TAS',
  'алматы': 'ALA',
  'астана': 'NUR',
  'бишкек': 'FRU',
  'душанбе': 'DYU',
  'ашхабад': 'ASB',
  'баку': 'BAK',
  'ереван': 'EVN',
  'тбилиси': 'TBS',
  'минск': 'MSQ',
  'киев': 'KBP',
  'одесса': 'ODS',
  'львов': 'LWO',
  'кишинев': 'KIV',
  'рига': 'RIX',
  'таллин': 'TLL',
  'вильнюс': 'VNO',
  'краков': 'KRK',
  'гданьск': 'GDN',
  'будапешт': 'BUD',
  'бухарест': 'BUH',
  'софия': 'SOF',
  'белград': 'BEG',
  'загреб': 'ZAG',
  'любляна': 'LJU',
  'скопье': 'SKP',
  'подгорица': 'TGD',
  'сараево': 'SJJ',
  'тирана': 'TIA',
  
  // Popular resort destinations
  'бали': 'DPS',
  'пхукет': 'HKT',
  'самуи': 'USM',
  'паттайя': 'BKK', // Паттайя использует Бангкок
  'гоа': 'GOI',
  'мальдивы': 'MLE',
  'сейшелы': 'SEZ',
  'маврикий': 'MRU',
  'занзибар': 'ZNZ',
  'кипр': 'LCA',
  'крит': 'HER',
  'родос': 'RHO',
  'корфу': 'CFU',
  'санторини': 'JTR',
  'миконос': 'JMK',
  'ибица': 'IBZ',
  'майорка': 'PMI',
  'тенерифе': 'TFS',
  'лас-пальмас': 'LPA',
  'мальта': 'MLA',
  'ницца': 'NCE',
  'канны': 'NCE', // Канны используют Ниццу
  'монако': 'NCE', // Монако использует Ниццу
};

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
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Convert Russian city name to IATA code
 */
export function convertRussianCityToIATA(cityName: string): string {
  const normalizedName = cityName.toLowerCase().trim();
  
  // Direct mapping lookup
  const iataCode = RUSSIAN_CITY_TO_IATA[normalizedName];
  if (iataCode) {
    console.log(`🌍 Russian city → IATA conversion: ${cityName} → ${iataCode}`);
    return iataCode;
  }
  
  // Try partial matches for compound city names
  for (const [russianCity, iata] of Object.entries(RUSSIAN_CITY_TO_IATA)) {
    if (normalizedName.includes(russianCity) || russianCity.includes(normalizedName)) {
      console.log(`🌍 Partial Russian city → IATA conversion: ${cityName} → ${iata} (matched: ${russianCity})`);
      return iata;
    }
  }
  
  // If no mapping found, return original (it might be already an IATA code)
  return cityName;
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
 * Get comprehensive destination information with Russian city name support
 */
export function getDestinationInfo(destination: string): DestinationInfo {
  const originalCode = destination;
  
  // First try to convert Russian city name to IATA
  const convertedFromRussian = convertRussianCityToIATA(destination);
  
  // If conversion happened, use the IATA code
  let finalCode = convertedFromRussian;
  let wasConverted = convertedFromRussian !== destination;
  
  // Then try to get airport info from CSV
  const airports = loadAirportsData();
  const airport = airports.get(convertedFromRussian);
  
  if (airport) {
    // If we found airport data, use city_code if available
    if (airport.city_code && airport.city_code !== convertedFromRussian) {
      finalCode = airport.city_code;
      wasConverted = true;
      console.log(`🏢 Airport → City conversion: ${convertedFromRussian} → ${airport.city_code}`);
    }
    
    const countryCode = airport.country_code;
    const isRussianDestination = countryCode === 'RU';
    
    return {
      originalCode,
      finalCode,
      countryCode,
      isInternational: !isRussianDestination,
      wasConverted
    };
  }
  
  // If no airport data found, assume it's international if we converted from Russian
  return {
    originalCode,
    finalCode,
    countryCode: wasConverted ? 'UNKNOWN' : 'UNKNOWN',
    isInternational: wasConverted,
    wasConverted
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