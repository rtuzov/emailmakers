#!/usr/bin/env tsx

/**
 * Тестовый скрипт для проверки улучшений в поиске локальных Figma ассетов
 */

import { getLocalFigmaAssets } from './tools/figma-local-processor';

async function testFigmaSearchImprovements() {
  console.log('🧪 Тестирование улучшений поиска Figma ассетов\n');

  // Тест 1: Исходный проблемный запрос
  console.log('='.repeat(80));
  console.log('🔍 ТЕСТ 1: Исходный проблемный запрос');
  console.log('='.repeat(80));
  
  const test1Params = {
    tags: ['заяц', 'счастлив', 'турция', 'акции'],
    context: {
      campaign_type: 'promotional' as const,
      emotional_tone: 'positive' as const,
      target_count: 2,
      diversity_mode: true,
      preferred_emotion: 'happy' as const,
      airline: 'Turkish Airlines',
      use_local_only: true
    }
  };

  try {
    const result1 = await getLocalFigmaAssets(test1Params);
    console.log('\n📊 РЕЗУЛЬТАТ ТЕСТА 1:');
    console.log('Success:', result1.success);
    if (result1.success && result1.data) {
      console.log('Найдено файлов:', result1.data.paths?.length || 0);
      result1.data.paths?.forEach((path: string, index: number) => {
        const fileName = path.split('/').pop();
        console.log(`  ${index + 1}. ${fileName}`);
      });
    } else {
      console.log('Error:', result1.error);
    }
  } catch (error) {
    console.error('❌ Ошибка в тесте 1:', error);
  }

  // Тест 2: Поиск только зайцев с эмоциями
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ТЕСТ 2: Поиск зайцев с эмоциями (без авиакомпании)');
  console.log('='.repeat(80));
  
  const test2Params = {
    tags: ['заяц', 'счастлив', 'радость'],
    context: {
      campaign_type: 'promotional' as const,
      emotional_tone: 'positive' as const,
      target_count: 3,
      diversity_mode: true,
      preferred_emotion: 'happy' as const,
      use_local_only: true
    }
  };

  try {
    const result2 = await getLocalFigmaAssets(test2Params);
    console.log('\n📊 РЕЗУЛЬТАТ ТЕСТА 2:');
    console.log('Success:', result2.success);
    if (result2.success && result2.data) {
      console.log('Найдено файлов:', result2.data.paths?.length || 0);
      result2.data.paths?.forEach((path: string, index: number) => {
        const fileName = path.split('/').pop();
        console.log(`  ${index + 1}. ${fileName}`);
      });
    } else {
      console.log('Error:', result2.error);
    }
  } catch (error) {
    console.error('❌ Ошибка в тесте 2:', error);
  }

  // Тест 3: Поиск только логотипов авиакомпаний
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ТЕСТ 3: Поиск логотипов авиакомпаний');
  console.log('='.repeat(80));
  
  const test3Params = {
    tags: ['турция', 'авиаперевозки', 'логотип'],
    context: {
      campaign_type: 'promotional' as const,
      target_count: 2,
      diversity_mode: false,
      airline: 'Turkish Airlines',
      use_local_only: true
    }
  };

  try {
    const result3 = await getLocalFigmaAssets(test3Params);
    console.log('\n📊 РЕЗУЛЬТАТ ТЕСТА 3:');
    console.log('Success:', result3.success);
    if (result3.success && result3.data) {
      console.log('Найдено файлов:', result3.data.paths?.length || 0);
      result3.data.paths?.forEach((path: string, index: number) => {
        const fileName = path.split('/').pop();
        console.log(`  ${index + 1}. ${fileName}`);
      });
    } else {
      console.log('Error:', result3.error);
    }
  } catch (error) {
    console.error('❌ Ошибка в тесте 3:', error);
  }

  // Тест 4: Широкий поиск с fallback
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ТЕСТ 4: Широкий поиск с fallback механизмом');
  console.log('='.repeat(80));
  
  const test4Params = {
    tags: ['несуществующий-тег', 'заяц'],
    context: {
      target_count: 2,
      diversity_mode: true,
      use_local_only: true
    }
  };

  try {
    const result4 = await getLocalFigmaAssets(test4Params);
    console.log('\n📊 РЕЗУЛЬТАТ ТЕСТА 4:');
    console.log('Success:', result4.success);
    if (result4.success && result4.data) {
      console.log('Найдено файлов:', result4.data.paths?.length || 0);
      result4.data.paths?.forEach((path: string, index: number) => {
        const fileName = path.split('/').pop();
        console.log(`  ${index + 1}. ${fileName}`);
      });
    } else {
      console.log('Error:', result4.error);
    }
  } catch (error) {
    console.error('❌ Ошибка в тесте 4:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Тестирование завершено');
  console.log('='.repeat(80));
}

// Запуск тестов
if (require.main === module) {
  testFigmaSearchImprovements().catch(console.error);
}

export { testFigmaSearchImprovements }; 