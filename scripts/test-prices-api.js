#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки нового API Купибилет
 * Проверяет работу endpoint https://lpc.kupibilet.ru/api/v2/one_way
 */

const fetch = require('node-fetch');

// Тестирование модуля prices.ts для получения цен Москва-Париж
import { getPrices } from '../src/agent/tools/prices.js';

async function testKupibiletAPI() {
  console.log('🧪 Тестирование нового API Купибилет...\n');

  // Тестовые данные - популярные маршруты
  const testRoutes = [
    {
      name: 'Москва -> Санкт-Петербург',
      departure: 'MOW',
      arrival: 'LED',
      dateFrom: '2025-06-25',
      dateTo: '2026-06-20'
    },
    {
      name: 'Санкт-Петербург -> Москва',
      departure: 'LED', 
      arrival: 'MOW',
      dateFrom: '2025-03-01',
      dateTo: '2025-06-01'
    },
    {
      name: 'Москва -> Сочи',
      departure: 'MOW',
      arrival: 'AER',
      dateFrom: '2025-05-01',
      dateTo: '2025-08-31'
    }
  ];

  const results = [];

  for (const route of testRoutes) {
    try {
      console.log(`📍 Тестирование маршрута: ${route.name}`);
      console.log(`   ${route.departure} -> ${route.arrival}`);
      console.log(`   Период: ${route.dateFrom} - ${route.dateTo}`);
      
      const requestBody = {
        arrival: route.arrival,
        cabin_class: "economy",
        currency: "RUB", 
        departure: route.departure,
        departure_date: {
          from: route.dateFrom,
          to: route.dateTo
        },
        filters: {
          airplane_only: null,
          is_direct: null,
          with_baggage: null
        }
      };

      console.log('📤 Отправляем запрос:', JSON.stringify(requestBody, null, 2));

      const startTime = Date.now();
      
      const response = await fetch('https://lpc.kupibilet.ru/api/v2/one_way', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          'origin': 'https://www.kupibilet.ru',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://www.kupibilet.ru/',
          'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Статус ответа: ${response.status} ${response.statusText}`);
      console.log(`⏱️ Время ответа: ${responseTime}ms`);

      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ Успешный ответ получен!');
        console.log('📈 Структура ответа:');
        console.log(`   - Поля: ${Object.keys(data).join(', ')}`);
        
        if (data.flights && Array.isArray(data.flights)) {
          console.log(`   - Количество рейсов: ${data.flights.length}`);
          if (data.flights.length > 0) {
            const firstFlight = data.flights[0];
            console.log(`   - Пример рейса:`, JSON.stringify(firstFlight, null, 4));
          }
        }
        
        if (data.min_price) {
          console.log(`   - Минимальная цена: ${data.min_price} ${data.currency || 'RUB'}`);
        }

        results.push({
          route: route.name,
          status: 'success',
          responseTime,
          flightCount: data.flights?.length || 0,
          minPrice: data.min_price,
          currency: data.currency,
          data: data
        });

      } else {
        const errorText = await response.text();
        console.log('❌ Ошибка API:');
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${errorText}`);
        
        results.push({
          route: route.name,
          status: 'error',
          responseTime,
          error: `${response.status}: ${errorText}`
        });
      }

    } catch (error) {
      console.log('💥 Исключение при запросе:');
      console.log(`   Ошибка: ${error.message}`);
      
      results.push({
        route: route.name,
        status: 'exception',
        error: error.message
      });
    }

    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Итоговый отчет
  console.log('📋 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ\n');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');
  
  console.log(`✅ Успешных запросов: ${successful.length}/${results.length}`);
  console.log(`❌ Неудачных запросов: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 Успешные результаты:');
    successful.forEach(result => {
      console.log(`   ${result.route}: ${result.flightCount} рейсов, от ${result.minPrice} ${result.currency}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n⚠️ Неудачные результаты:');
    failed.forEach(result => {
      console.log(`   ${result.route}: ${result.error}`);
    });
  }

  // Анализ структуры данных
  if (successful.length > 0) {
    console.log('\n📊 АНАЛИЗ СТРУКТУРЫ ДАННЫХ:');
    const sampleData = successful[0].data;
    
    console.log('Основные поля ответа:');
    Object.keys(sampleData).forEach(key => {
      const value = sampleData[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      console.log(`   - ${key}: ${type}`);
    });
    
    if (sampleData.flights && sampleData.flights.length > 0) {
      console.log('\nПоля объекта рейса:');
      Object.keys(sampleData.flights[0]).forEach(key => {
        const value = sampleData.flights[0][key];
        const type = typeof value;
        console.log(`   - ${key}: ${type}`);
      });
    }
  }

  return results;
}

async function testPricesAPI() {
  console.log('🧪 Тестирование модуля prices.ts');
  console.log('📍 Направление: Москва (MOW) → Париж (CDG)');
  console.log('📅 Даты: 30.06.2025 - 05.07.2025');
  console.log('-------------------------------------------');

  try {
    const result = await getPrices({
      origin: 'MOW',
      destination: 'CDG', 
      date_range: '2025-06-30,2025-07-05',
      cabin_class: 'economy',
      filters: {
        is_direct: false,
        with_baggage: false,
        airplane_only: true
      }
    });

    console.log('✅ Результат получен:');
    console.log('📊 Success:', result.success);
    
    if (result.success && result.data) {
      const data = result.data;
      console.log('💰 Валюта:', data.currency);
      console.log('🏆 Минимальная цена:', data.cheapest);
      console.log('📈 Найдено цен:', data.search_metadata.total_found);
      console.log('🛣️ Маршрут:', data.search_metadata.route);
      console.log('📅 Период поиска:', data.search_metadata.date_range);
      
      console.log('\n📋 Список цен:');
      data.prices.forEach((price, index) => {
        console.log(`${index + 1}. ${price.date}: ${price.price} ${price.currency}`);
        if (price.metadata?.airline) {
          console.log(`   ✈️ Авиакомпания: ${price.metadata.airline}`);
        }
        if (price.metadata?.duration) {
          console.log(`   ⏱️ Длительность: ${price.metadata.duration} мин`);
        }
        if (price.metadata?.stops !== undefined) {
          console.log(`   🔄 Пересадки: ${price.metadata.stops}`);
        }
      });
    }

    if (result.metadata) {
      console.log('\n🔧 Метаданные:');
      console.log('📡 Источник:', result.metadata.source);
      if (result.metadata.reason) {
        console.log('ℹ️ Причина:', result.metadata.reason);
      }
      console.log('⏰ Время запроса:', result.metadata.timestamp);
    }

    if (!result.success) {
      console.log('❌ Ошибка:', result.error);
    }

  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    console.error('📍 Stack trace:', error.stack);
  }
}

// Запуск тестирования
if (require.main === module) {
  testKupibiletAPI()
    .then(results => {
      console.log('\n🏁 Тестирование завершено!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = { testKupibiletAPI }; 