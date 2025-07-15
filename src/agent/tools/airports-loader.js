"use strict";
/**
 * Airport Data Loader - Automated CSV-based Destination Matching
 * Automatically finds correct city_code from airports.csv without hardcoded mappings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchDestination = searchDestination;
exports.getDestinationInfo = getDestinationInfo;
exports.convertAirportToCity = convertAirportToCity;
exports.getAirportDetails = getAirportDetails;
exports.searchAirportsByName = searchAirportsByName;
exports.getAirportsByCountry = getAirportsByCountry;
exports.getAirportsByCity = getAirportsByCity;
exports.getDestinationSuggestions = getDestinationSuggestions;
const fs = require("fs");
const path = require("path");
let airportsData = null;
let airportsByCity = null;
let airportsByCountry = null;
/**
 * Load airports data from CSV file and create indices
 */
function loadAirportsData() {
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
        airportsByCity = new Map();
        airportsByCountry = new Map();
        for (const line of dataLines) {
            // Split by semicolon as per CSV format
            const columns = line.split(';');
            if (columns.length >= 10) {
                const airport = {
                    code: columns[0]?.trim() || '',
                    city_code: columns[1]?.trim() || '',
                    country_code: columns[2]?.trim() || '',
                    time_zone: columns[3]?.trim() || '',
                    iata_type: columns[4]?.trim() || '',
                    flightable: columns[5]?.trim() || '',
                    name: columns[6]?.trim() || '',
                    name_en: columns[7]?.trim() || '',
                    lat: columns[8]?.trim() || '',
                    lon: columns[9]?.trim() || ''
                };
                // Index by airport code
                airportsData.set(airport.code, airport);
                // Index by city code
                if (!airportsByCity.has(airport.city_code)) {
                    airportsByCity.set(airport.city_code, []);
                }
                airportsByCity.get(airport.city_code).push(airport);
                // Index by country code
                if (!airportsByCountry.has(airport.country_code)) {
                    airportsByCountry.set(airport.country_code, []);
                }
                airportsByCountry.get(airport.country_code).push(airport);
            }
        }
        console.log(`✈️ Loaded ${airportsData.size} airports from CSV`);
        console.log(`🏙️ Indexed ${airportsByCity.size} city codes`);
        console.log(`🌍 Indexed ${airportsByCountry.size} countries`);
        return airportsData;
    }
    catch (error) {
        console.error('❌ Failed to load airports.csv:', error);
        throw error instanceof Error ? error : new Error(String(error));
    }
}
/**
 * Find airport by exact airport code match
 */
function findByAirportCode(code) {
    const airports = loadAirportsData();
    const airport = airports.get(code.toUpperCase());
    if (airport) {
        console.log(`✅ Exact airport code match: ${code} → ${airport.city_code}`);
        return {
            originalInput: code,
            finalCityCode: airport.city_code,
            matchedAirport: airport,
            countryCode: airport.country_code,
            isInternational: airport.country_code !== 'RU',
            matchType: 'exact_airport_code',
            confidence: 1.0
        };
    }
    return null;
}
/**
 * Find by exact city code match
 */
function findByCityCode(code) {
    loadAirportsData();
    const cityCode = code.toUpperCase();
    const airportsInCity = airportsByCity.get(cityCode);
    if (airportsInCity && airportsInCity.length > 0) {
        // Use the first airport as representative
        const airport = airportsInCity[0];
        console.log(`✅ Exact city code match: ${code} → ${airport.city_code}`);
        return {
            originalInput: code,
            finalCityCode: airport.city_code,
            matchedAirport: airport,
            countryCode: airport.country_code,
            isInternational: airport.country_code !== 'RU',
            matchType: 'exact_city_code',
            confidence: 1.0
        };
    }
    return null;
}
/**
 * Find by airport name (supports both Russian and English names)
 */
function findByName(searchName) {
    const airports = loadAirportsData();
    const searchLower = searchName.toLowerCase().trim();
    let bestMatch = null;
    for (const airport of Array.from(airports.values())) {
        const nameLower = airport.name.toLowerCase();
        const nameEnLower = airport.name_en.toLowerCase();
        // Exact name match (highest priority)
        if (nameLower === searchLower || nameEnLower === searchLower) {
            console.log(`✅ Exact name match: ${searchName} → ${airport.city_code} (${airport.name_en})`);
            return {
                originalInput: searchName,
                finalCityCode: airport.city_code,
                matchedAirport: airport,
                countryCode: airport.country_code,
                isInternational: airport.country_code !== 'RU',
                matchType: 'name_match',
                confidence: 1.0
            };
        }
        // Partial name matching
        let score = 0;
        if (nameLower.includes(searchLower) || searchLower.includes(nameLower)) {
            score = Math.max(score, searchLower.length / nameLower.length);
        }
        if (nameEnLower.includes(searchLower) || searchLower.includes(nameEnLower)) {
            score = Math.max(score, searchLower.length / nameEnLower.length);
        }
        if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { airport, score };
        }
    }
    if (bestMatch) {
        console.log(`✅ Partial name match: ${searchName} → ${bestMatch.airport.city_code} (${bestMatch.airport.name_en}, confidence: ${bestMatch.score.toFixed(2)})`);
        return {
            originalInput: searchName,
            finalCityCode: bestMatch.airport.city_code,
            matchedAirport: bestMatch.airport,
            countryCode: bestMatch.airport.country_code,
            isInternational: bestMatch.airport.country_code !== 'RU',
            matchType: 'fuzzy_match',
            confidence: bestMatch.score
        };
    }
    return null;
}
/**
 * Get main airport for a country (prioritizes capital cities and large airports)
 */
function getMainAirportForCountry(countryCode) {
    loadAirportsData();
    const countryAirports = airportsByCountry.get(countryCode.toUpperCase());
    if (!countryAirports || countryAirports.length === 0) {
        return null;
    }
    // Priority keywords for finding main airports
    const mainAirportKeywords = [
        'international', 'capital', 'main', 'central', 'primary',
        'metropolitan', 'city', 'urban', 'airport'
    ];
    // First, try to find airports with "international" in the name
    const internationalAirports = countryAirports.filter(airport => airport.name_en.toLowerCase().includes('international') &&
        airport.flightable === 'True');
    if (internationalAirports.length > 0) {
        return internationalAirports[0];
    }
    // Then try airports with main city keywords
    const mainAirports = countryAirports.filter(airport => {
        const nameEnLower = airport.name_en.toLowerCase();
        return mainAirportKeywords.some(keyword => nameEnLower.includes(keyword)) &&
            airport.flightable === 'True';
    });
    if (mainAirports.length > 0) {
        return mainAirports[0];
    }
    // Finally, return the first flightable airport
    const flightableAirports = countryAirports.filter(airport => airport.flightable === 'True');
    return flightableAirports.length > 0 ? flightableAirports[0] : countryAirports[0];
}
/**
 * Find by country code
 */
function findByCountry(countryCode) {
    const mainAirport = getMainAirportForCountry(countryCode);
    if (mainAirport) {
        console.log(`✅ Country code match: ${countryCode} → ${mainAirport.city_code} (${mainAirport.name_en})`);
        return {
            originalInput: countryCode,
            finalCityCode: mainAirport.city_code,
            matchedAirport: mainAirport,
            countryCode: mainAirport.country_code,
            isInternational: mainAirport.country_code !== 'RU',
            matchType: 'country_main_airport',
            confidence: 0.8
        };
    }
    return null;
}
/**
 * Main search function - tries multiple strategies to find destination
 */
function searchDestination(input) {
    const trimmedInput = input.trim();
    console.log(`🔍 Searching for destination: "${trimmedInput}"`);
    // Strategy 1: Exact airport code match
    const airportMatch = findByAirportCode(trimmedInput);
    if (airportMatch)
        return airportMatch;
    // Strategy 2: Exact city code match
    const cityMatch = findByCityCode(trimmedInput);
    if (cityMatch)
        return cityMatch;
    // Strategy 3: Country code match (2-3 letter codes)
    if (trimmedInput.length === 2 || trimmedInput.length === 3) {
        const countryMatch = findByCountry(trimmedInput);
        if (countryMatch)
            return countryMatch;
    }
    // Strategy 4: Name-based search
    const nameMatch = findByName(trimmedInput);
    if (nameMatch)
        return nameMatch;
    // No match found
    console.log(`❌ No match found for: "${trimmedInput}"`);
    return {
        originalInput: trimmedInput,
        finalCityCode: trimmedInput, // Return original as fallback
        matchedAirport: null,
        countryCode: 'UNKNOWN',
        isInternational: false,
        matchType: 'not_found',
        confidence: 0.0
    };
}
/**
 * Legacy function for backward compatibility
 */
function getDestinationInfo(destination) {
    const result = searchDestination(destination);
    return {
        originalCode: result.originalInput,
        finalCode: result.finalCityCode,
        countryCode: result.countryCode,
        isInternational: result.isInternational,
        wasConverted: result.originalInput !== result.finalCityCode
    };
}
/**
 * Convert airport code to city code (legacy function)
 */
function convertAirportToCity(airportCode) {
    const result = searchDestination(airportCode);
    return result.finalCityCode;
}
/**
 * Get airport details by code
 */
function getAirportDetails(airportCode) {
    const airports = loadAirportsData();
    return airports.get(airportCode.toUpperCase()) || null;
}
/**
 * Search airports by name (Russian or English)
 */
function searchAirportsByName(searchTerm) {
    const airports = loadAirportsData();
    const results = [];
    const searchLower = searchTerm.toLowerCase();
    for (const airport of Array.from(airports.values())) {
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
function getAirportsByCountry(countryCode) {
    loadAirportsData();
    return airportsByCountry.get(countryCode.toUpperCase()) || [];
}
/**
 * Get all airports for a city code
 */
function getAirportsByCity(cityCode) {
    loadAirportsData();
    return airportsByCity.get(cityCode.toUpperCase()) || [];
}
/**
 * Get destination suggestions based on partial input
 */
function getDestinationSuggestions(partialInput, limit = 10) {
    const airports = loadAirportsData();
    const suggestions = [];
    const searchLower = partialInput.toLowerCase().trim();
    if (searchLower.length < 2)
        return suggestions;
    for (const airport of Array.from(airports.values())) {
        if (suggestions.length >= limit)
            break;
        const matches = [
            airport.code.toLowerCase().startsWith(searchLower),
            airport.city_code.toLowerCase().startsWith(searchLower),
            airport.name.toLowerCase().includes(searchLower),
            airport.name_en.toLowerCase().includes(searchLower)
        ];
        if (matches.some(Boolean)) {
            suggestions.push({
                originalInput: partialInput,
                finalCityCode: airport.city_code,
                matchedAirport: airport,
                countryCode: airport.country_code,
                isInternational: airport.country_code !== 'RU',
                matchType: 'fuzzy_match',
                confidence: matches[0] || matches[1] ? 1.0 : 0.7
            });
        }
    }
    return suggestions.sort((a, b) => b.confidence - a.confidence);
}
