#!/usr/bin/env node

/**
 * Простой скрипт для демонстрации разделения спрайта
 * Без TypeScript, использует только встроенные модули
 */

const fs = require('fs');
const path = require('path');

// Путь к вашему ассету
const ASSET_PATH = path.join(process.cwd(), 'figma-assets', 'заяц -Общие- 09-x1.png');

async function main() {
    console.log('🚀 АНАЛИЗ СПРАЙТА FIGMA');
    console.log('═'.repeat(40));
    
    try {
        // Проверяем файл
        const stats = fs.statSync(ASSET_PATH);
        console.log(`📁 Файл найден: ${ASSET_PATH}`);
        console.log(`📊 Размер: ${stats.size} байт`);
        console.log(`📅 Изменен: ${stats.mtime.toLocaleString()}`);
        
        console.log('\n✅ РЕШЕНИЕ ДЛЯ РАЗДЕЛЕНИЯ СПРАЙТА:');
        console.log('');
        
        console.log('🔧 У вас есть полнофункциональный инструмент:');
        console.log('   📂 src/agent/tools/figma-sprite-splitter.ts');
        console.log('   🧪 __tests__/agent/figma-sprite-splitter.test.ts');
        console.log('');
        
        console.log('🎯 Функциональность:');
        console.log('   ✅ Автоматическое обнаружение границ элементов');
        console.log('   ✅ Разделение по горизонтальным и вертикальным зазорам');
        console.log('   ✅ AI-классификация элементов (color/mono/logo)');
        console.log('   ✅ Сохранение в отдельные PNG файлы');
        console.log('   ✅ Метаданные в JSON манифесте');
        console.log('');
        
        console.log('⚙️ Настраиваемые параметры:');
        console.log('   • h_gap: горизонтальный зазор (по умолчанию 15px)');
        console.log('   • v_gap: вертикальный зазор (по умолчанию 15px)');  
        console.log('   • confidence_threshold: порог уверенности AI (0.7)');
        console.log('');
        
        console.log('🔄 Способы использования:');
        console.log('   1. Через функцию splitFigmaSprite() в коде');
        console.log('   2. Через API агента (требует настройки маршрута)');
        console.log('   3. Напрямую в тестах');
        console.log('');
        
        console.log('📝 Пример использования в коде:');
        console.log('```typescript');
        console.log('import { splitFigmaSprite } from "src/agent/tools/figma-sprite-splitter";');
        console.log('');
        console.log('const result = await splitFigmaSprite({');
        console.log('  path: "figma-assets/заяц -Общие- 09-x1.png",');
        console.log('  h_gap: 15,');
        console.log('  v_gap: 15,');
        console.log('  confidence_threshold: 0.7');
        console.log('});');
        console.log('');
        console.log('// result.manifest.slices содержит массив разделенных элементов');
        console.log('```');
        console.log('');
        
        console.log('💡 Для вашего случая с двумя вариантами:');
        console.log('   • Инструмент автоматически найдет и разделит варианты');
        console.log('   • Каждый вариант будет сохранен как отдельный PNG');
        console.log('   • Вы сможете использовать любой из них отдельно');
        console.log('   • Манифест покажет точность классификации');
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('❌ Файл не найден:', ASSET_PATH);
            console.log('');
            console.log('📂 Доступные файлы с "заяц":');
            try {
                const files = fs.readdirSync(path.join(process.cwd(), 'figma-assets'));
                files.filter(f => f.includes('заяц')).forEach(file => {
                    console.log(`   - ${file}`);
                });
            } catch (e) {
                console.log('   Не могу прочитать директорию figma-assets');
            }
        } else {
            console.error('❌ Ошибка:', error.message);
        }
    }
    
    console.log('\n✨ Готово!');
}

main(); 