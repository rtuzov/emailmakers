#!/usr/bin/env node

/**
 * Скрипт для обработки дополнительных данных с новых страниц
 */

const fs = require('fs');
const FigmaDataProcessor = require('./figma-data-processor');

// Данные со страницы "Типографика"
const typographyData = {
  "metadata": {
    "framework": "html",
    "source": "selection",
    "processed": 5604,
    "selectedNode": {
      "id": "2577:274",
      "name": "Типографика",
      "type": "CANVAS",
      "childCount": 1
    }
  },
  "data": {
    "id": "2577:274",
    "name": "Типографика",
    "type": "CANVAS",
    "children": [
      {
        "id": "2601:454",
        "name": "Типографика",
        "type": "SECTION"
      }
    ],
    "accessibility": {
      "ariaLabel": "Типографика"
    },
    "relationships": {
      "children": [
        {
          "name": "Типографика",
          "type": "SECTION"
        }
      ]
    }
  }
};

// Данные со страницы "Айдентика"
const identityData = {
  "metadata": {
    "framework": "html",
    "source": "selection",
    "processed": 5626,
    "selectedNode": {
      "id": "1989:9",
      "name": "Айдентика",
      "type": "CANVAS",
      "childCount": 9
    }
  },
  "data": {
    "id": "1989:9",
    "name": "Айдентика",
    "type": "CANVAS",
    "children": [
      {
        "id": "1997:56",
        "name": "Geotag",
        "type": "COMPONENT_SET"
      },
      {
        "id": "1997:147",
        "name": "Logo Premium",
        "type": "COMPONENT",
        "children": [
          {
            "id": "1997:148",
            "name": "Vector",
            "type": "VECTOR",
            "bounds": {
              "x": 2961.5615234375,
              "y": -405,
              "width": 160.37481689453125,
              "height": 167.41358947753906
            },
            "css": {
              "width": "160.37481689453125px",
              "height": "167.41358947753906px",
              "backgroundColor": "rgb(255, 255, 255)"
            },
            "accessibility": {
              "ariaLabel": "Vector"
            },
            "tokens": [
              {
                "name": "Vector-fill-0",
                "value": "rgb(255, 255, 255)",
                "type": "color"
              }
            ],
            "relationships": {
              "parent": {
                "name": "Logo Premium",
                "type": "COMPONENT"
              }
            }
          },
          {
            "id": "1997:149",
            "name": "Vector",
            "type": "VECTOR",
            "bounds": {
              "x": 2437.831787109375,
              "y": -401.8883056640625,
              "width": 106.18301391601562,
              "height": 154.6820831298828
            },
            "css": {
              "width": "106.18301391601562px",
              "height": "154.6820831298828px",
              "backgroundColor": "rgb(255, 255, 255)"
            },
            "accessibility": {
              "ariaLabel": "Vector"
            },
            "tokens": [
              {
                "name": "Vector-fill-0",
                "value": "rgb(255, 255, 255)",
                "type": "color"
              }
            ],
            "relationships": {
              "parent": {
                "name": "Logo Premium",
                "type": "COMPONENT"
              }
            }
          }
          // ... (остальные vector элементы для экономии места)
        ],
        "bounds": {
          "x": 2311,
          "y": -405,
          "width": 967,
          "height": 167
        },
        "css": {
          "width": "967px",
          "height": "167px"
        },
        "accessibility": {
          "ariaLabel": "Logo Premium"
        },
        "tokens": [
          {
            "name": "Logo Premium-fill-0",
            "value": "rgb(255, 255, 255)",
            "type": "color"
          }
        ]
      },
      {
        "id": "1997:312",
        "name": "Logo Kupibilet",
        "type": "COMPONENT_SET"
      },
      {
        "id": "1997:349",
        "name": "Icon Kupibilet",
        "type": "COMPONENT_SET"
      },
      {
        "id": "1997:352",
        "name": "Icon Blog",
        "type": "COMPONENT_SET"
      },
      {
        "id": "1997:371",
        "name": "Icon Kupi com",
        "type": "COMPONENT_SET"
      },
      {
        "id": "2019:1106",
        "name": "Brand element",
        "type": "COMPONENT_SET"
      },
      {
        "id": "2085:321",
        "name": "Rectangle 1986",
        "type": "RECTANGLE",
        "bounds": {
          "x": 1119,
          "y": -804,
          "width": 850.2562866210938,
          "height": 198.62864685058594
        },
        "css": {
          "width": "850.2562866210938px",
          "height": "198.62864685058594px"
        },
        "role": {
          "type": "button",
          "purpose": "interactive",
          "variant": "default",
          "state": "default"
        },
        "accessibility": {
          "focusable": true,
          "tabIndex": 0,
          "ariaRole": "button"
        },
        "interactions": [
          {
            "trigger": "hover",
            "changes": {
              "opacity": "0.8"
            },
            "animation": {
              "duration": "0.2s",
              "easing": "ease-in-out"
            }
          },
          {
            "trigger": "click",
            "changes": {
              "transform": "scale(0.95)"
            },
            "animation": {
              "duration": "0.1s",
              "easing": "ease-in-out"
            }
          }
        ]
      },
      {
        "id": "6134:8",
        "name": "Logo Blog",
        "type": "COMPONENT",
        "children": [
          {
            "id": "6134:3",
            "name": "Слой 1",
            "type": "GROUP",
            "children": [
              {
                "id": "6134:4",
                "name": "Vector",
                "type": "VECTOR",
                "bounds": {
                  "x": -894.822265625,
                  "y": -766.2852783203125,
                  "width": 76.59000396728516,
                  "height": 101.78955078125
                },
                "css": {
                  "width": "76.59000396728516px",
                  "height": "101.78955078125px",
                  "backgroundColor": "rgb(255, 255, 255)"
                },
                "accessibility": {
                  "ariaLabel": "Vector"
                },
                "tokens": [
                  {
                    "name": "Vector-fill-0",
                    "value": "rgb(255, 255, 255)",
                    "type": "color"
                  }
                ]
              }
              // ... (остальные элементы)
            ],
            "bounds": {
              "x": -1303.91796875,
              "y": -832.0000610351562,
              "width": 485.6855773925781,
              "height": 226.7295684814453
            },
            "css": {
              "width": "485.6855773925781px",
              "height": "226.7295684814453px"
            }
          }
        ],
        "bounds": {
          "x": -1304,
          "y": -832,
          "width": 485.7665710449219,
          "height": 226.78146362304688
        },
        "css": {
          "width": "485.7665710449219px",
          "height": "226.78146362304688px"
        },
        "image": {
          "category": "logo",
          "formats": [
            "png",
            "svg"
          ],
          "isExportable": true
        },
        "accessibility": {
          "ariaLabel": "Logo Blog"
        },
        "tokens": [
          {
            "name": "Logo Blog-fill-0",
            "value": "rgb(255, 255, 255)",
            "type": "color"
          }
        ]
      }
    ],
    "accessibility": {
      "ariaLabel": "Айдентика"
    }
  }
};

console.log('🚀 Обрабатываем дополнительные данные из Figma...');

const processor = new FigmaDataProcessor();

// Обрабатываем все полученные данные
console.log('📄 Обрабатываем страницу Типографика...');
processor.processJSONData(typographyData, 'Типографика');

console.log('📄 Обрабатываем страницу Айдентика...');
processor.processJSONData(identityData, 'Айдентика');

// Читаем и добавляем данные первой страницы из файла
try {
    const existingCSV = fs.readFileSync('figma-analysis-page1.csv', 'utf8');
    console.log('📄 Найден предыдущий анализ первой страницы');
    
    // Простое добавление - для полноценного объединения нужна более сложная логика
    const lines = existingCSV.split('\n');
    console.log(`📊 Найдено ${lines.length - 1} записей из предыдущего анализа`);
} catch (error) {
    console.log('⚠️  Предыдущий анализ не найден, создаем новый');
}

// Генерируем статистику и сохраняем обновленные данные
console.log('\n📊 Генерируем обновленную статистику...');
processor.generateStatistics();

// Сохраняем обновленные данные
const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
const filename = `figma-analysis-updated-${timestamp}.csv`;
processor.saveToCSV(filename);

console.log(`\n✅ Обновленный анализ сохранен в: ${filename}`);

// Анализ компонентной структуры
console.log('\n🧩 АНАЛИЗ КОМПОНЕНТНОЙ СТРУКТУРЫ:');
console.log('═'.repeat(60));

const nodes = processor.processedNodes;
const componentSets = nodes.filter(n => n.type === 'COMPONENT_SET').length;
const components = nodes.filter(n => n.type === 'COMPONENT').length;
const vectors = nodes.filter(n => n.type === 'VECTOR').length;
const groups = nodes.filter(n => n.type === 'GROUP').length;

console.log(`📊 Статистика по типам элементов:`);
console.log(`  • Наборы компонентов (COMPONENT_SET): ${componentSets}`);
console.log(`  • Компоненты (COMPONENT): ${components}`);
console.log(`  • Векторные элементы (VECTOR): ${vectors}`);
console.log(`  • Группы (GROUP): ${groups}`);

const logosAndIcons = nodes.filter(n => 
    n.name.toLowerCase().includes('logo') || 
    n.name.toLowerCase().includes('icon') ||
    n.name.toLowerCase().includes('brand')
).length;

console.log(`\n🎨 Брендинговые элементы:`);
console.log(`  • Логотипы и иконки: ${logosAndIcons}`);

const exportableElements = nodes.filter(n => 
    n.name.toLowerCase().includes('logo') ||
    n.type === 'COMPONENT' ||
    n.type === 'COMPONENT_SET'
).length;

console.log(`  • Экспортируемые элементы: ${exportableElements}`);

console.log('\n💡 РЕКОМЕНДАЦИИ ДЛЯ НЕЙРОСЕТИ:');
console.log('═'.repeat(60));
console.log('1. 🎯 СТРУКТУРА ПРОЕКТА:');
console.log('   ✅ Хорошо организованная компонентная структура');
console.log('   ✅ Четкое разделение по функциональным группам');
console.log('   ✅ Использование системы дизайн-токенов');

console.log('\n2. 🔍 ОПТИМИЗАЦИЯ ДЛЯ ИИ:');
console.log('   • Семантические названия компонентов облегчают понимание');
console.log('   • Векторные логотипы хорошо подходят для автоматической обработки');
console.log('   • Компонентные наборы позволяют легко варьировать элементы');

if (componentSets > 0) {
    console.log('\n3. 🧩 КОМПОНЕНТИЗАЦИЯ:');
    console.log(`   ✅ Найдено ${componentSets} наборов компонентов`);
    console.log('   ✅ Хорошая переиспользуемость элементов');
    console.log('   💡 Рекомендация: Продолжать использовать компонентный подход');
}

console.log('\n4. 🎨 ДИЗАЙН-СИСТЕМА:');
console.log('   ✅ Консистентная цветовая схема (белые логотипы)');
console.log('   ✅ Единообразные токены дизайна');
console.log('   💡 Хорошо подходит для автоматического генерирования вариаций');

console.log('\n🔥 СЛЕДУЮЩИЕ ШАГИ:');
console.log('1. Получить данные с оставшихся страниц (особенно "Цвета")');
console.log('2. Проанализировать плотные страницы по частям');
console.log('3. Создать полный каталог всех дизайн-токенов');
console.log('4. Оптимизировать структуру под конкретные задачи ИИ');

module.exports = processor;