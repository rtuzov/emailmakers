#!/usr/bin/env node

/**
 * Скрипт для запуска оптимизации Figma нодов
 * Использование: node optimize-figma.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

// Поскольку TypeScript модуль, используем прямой вызов API
async function optimizeFigmaNodes() {
  const figmaToken = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN;
  const figmaProjectId = process.env.FIGMA_PROJECT_ID;
  
  if (!figmaToken || !figmaProjectId) {
    throw new Error('Figma credentials not found in environment variables');
  }

  console.log('📊 Анализ текущей структуры...');
  
  // Получение данных из Figma API
  const response = await fetch(`https://api.figma.com/v1/files/${figmaProjectId}`, {
    headers: { 'X-Figma-Token': figmaToken }
  });

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const allNodes = [];

  function extractNodes(node) {
    if (node.name && node.type) {
      allNodes.push({
        id: node.id,
        name: node.name,
        type: node.type,
        visible: node.visible !== false
      });
    }
    
    if (node.children) {
      node.children.forEach(extractNodes);
    }
  }

  extractNodes(data.document);
  
  // Анализ зайцев
  const rabbits = allNodes.filter(node => 
    node.name.toLowerCase().includes('заяц') || 
    node.name.toLowerCase().includes('rabbit')
  );
  
  // Анализ авиакомпаний
  const airlines = allNodes.filter(node => {
    const name = node.name.toLowerCase();
    return name.includes('аэрофлот') || name.includes('turkish') || 
           name.includes('utair') || name.includes('nordwind');
  });

  // Поиск дублей
  const duplicates = allNodes.filter(node => 
    node.name.includes('=1') || 
    node.name.includes('=2') || 
    node.name.includes('=3')
  );

  // Эмоциональные состояния (отсутствуют)
  const emotionalKeywords = ['недоволен', 'озадачен', 'нейтрален', 'разозлен', 'счастлив', 'грустн'];
  const emotionalRabbits = rabbits.filter(rabbit => 
    emotionalKeywords.some(keyword => rabbit.name.toLowerCase().includes(keyword))
  );

  return {
    totalNodes: allNodes.length,
    rabbits: rabbits.length,
    emotionalRabbits: emotionalRabbits.length,
    airlines: airlines.length,
    duplicates: duplicates.length,
    duplicatesList: duplicates.map(d => d.name),
    rabbitsList: rabbits.slice(0, 10).map(r => r.name), // Первые 10 для примера
    airlinesList: airlines.map(a => a.name)
  };
}

async function main() {
  console.log('🎯 ЗАПУСК АНАЛИЗА И ОПТИМИЗАЦИИ FIGMA НОДОВ');
  console.log('==========================================');
  
  try {
    // Запуск анализа
    const result = await optimizeFigmaNodes();
    
    // Вывод результатов
    console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log(`✅ Всего нодов: ${result.totalNodes}`);
    console.log(`🐰 Зайцев общих: ${result.rabbits}`);
    console.log(`😟 Эмоциональных зайцев: ${result.emotionalRabbits} (КРИТИЧНО: нужно 6!)`);
    console.log(`✈️ Авиакомпаний: ${result.airlines}`);
    console.log(`🗑️ Дублей для удаления: ${result.duplicates}`);
    
    console.log('\n🐰 ПРИМЕРЫ ЗАЙЦЕВ:');
    result.rabbitsList.forEach(name => console.log(`- ${name}`));
    
    console.log('\n✈️ АВИАКОМПАНИИ:');
    result.airlinesList.forEach(name => console.log(`- ${name}`));
    
    console.log('\n🗑️ ДУБЛИ ДЛЯ УДАЛЕНИЯ:');
    result.duplicatesList.forEach(name => console.log(`- ${name}`));
    
    // Создание плана оптимизации
    const optimizationPlan = `# 🎯 ПЛАН ОПТИМИЗАЦИИ FIGMA

## 📊 АНАЛИЗ ЗАВЕРШЕН
- **Всего нодов**: ${result.totalNodes}
- **Зайцев**: ${result.rabbits} (${result.emotionalRabbits} эмоциональных)
- **Авиакомпаний**: ${result.airlines}
- **Дублей**: ${result.duplicates}

## 🚨 КРИТИЧЕСКИЕ ЗАДАЧИ

### 1. СОЗДАТЬ ЭМОЦИОНАЛЬНЫЕ СОСТОЯНИЯ (ПРИОРИТЕТ 10)
Отсутствуют все 6 эмоциональных состояний:
- ❌ заяц-эмоция-счастлив
- ❌ заяц-эмоция-недоволен
- ❌ заяц-эмоция-озадачен
- ❌ заяц-эмоция-нейтрален
- ❌ заяц-эмоция-разозлен
- ❌ заяц-эмоция-грустный

### 2. УДАЛИТЬ ДУБЛИ
${result.duplicatesList.map(name => `- 🗑️ ${name}`).join('\n')}

### 3. СТАНДАРТИЗИРОВАТЬ АВИАКОМПАНИИ
${result.airlinesList.map(name => `- 📝 ${name} → стандартное название`).join('\n')}

### 4. СОЗДАТЬ КОНТЕКСТУАЛЬНЫЕ ВАРИАНТЫ
- ❌ заяц-контекст-подборка
- ❌ заяц-контекст-новости  
- ❌ заяц-контекст-faq

## 🎯 СЛЕДУЮЩИЕ ШАГИ
1. Открыть Figma: https://www.figma.com/design/GBnGxSQlfM1XhjSkLHogk6/
2. Создать новые эмоциональные компоненты
3. Удалить дубли
4. Переименовать существующие компоненты
5. Организовать в новую структуру папок

---
*Анализ создан: ${new Date().toLocaleString()}*
`;

    // Сохранение плана
    const fs = require('fs').promises;
    await fs.writeFile('figma-optimization-plan.md', optimizationPlan);
    
    console.log('\n📄 План оптимизации сохранен в figma-optimization-plan.md');
    console.log('�� Следующий шаг: Открыть Figma и реализовать план');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
}
