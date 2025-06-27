#!/usr/bin/env npx ts-node

/**
 * Тестовый скрипт для разделения спрайта Figma
 * Использует существующий инструмент figma-sprite-splitter
 */

import * as path from 'path';
import { promises as fs } from 'fs';
import { splitFigmaSprite } from '../src/agent/tools/figma-sprite-splitter';
import sharp from 'sharp';

// Путь к вашему ассету
const ASSET_PATH = path.join(process.cwd(), 'figma-assets', 'заяц -Общие- 09-x1.png');
const OUTPUT_DIR = path.join(process.cwd(), 'mails', 'sprite-test-' + Date.now());

async function testSpriteSpitter() {
    try {
        console.log('🔍 Тестирование разделения спрайта...');
        console.log(`📁 Исходный файл: ${ASSET_PATH}`);
        
        // Проверяем существование файла
        try {
            await fs.access(ASSET_PATH);
            console.log('✅ Файл найден');
        } catch (error) {
            console.error('❌ Файл не найден:', ASSET_PATH);
            console.log('📂 Доступные файлы в figma-assets:');
            try {
                const files = await fs.readdir(path.join(process.cwd(), 'figma-assets'));
                files.filter(f => f.includes('заяц')).forEach(file => console.log(`   - ${file}`));
            } catch (e) {
                console.log('   Не могу прочитать директорию figma-assets');
            }
            return;
        }
        
        // Создаем выходную директорию
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        console.log(`📁 Выходная директория: ${OUTPUT_DIR}`);
        
        // Параметры разделения
        const params = {
            path: ASSET_PATH,
            h_gap: 15,     // горизонтальный зазор между элементами
            v_gap: 15,     // вертикальный зазор между элементами  
            confidence_threshold: 0.7  // порог уверенности классификации
        };
        
        console.log('⚡ Запускаем разделение...');
        const startTime = Date.now();
        
        const result = await splitFigmaSprite(params);
        
        const endTime = Date.now();
        console.log(`⏱️ Время обработки: ${endTime - startTime}ms`);
        
        if (result.success && result.manifest) {
            console.log('\n🎉 УСПЕШНО РАЗДЕЛЕНО!');
            console.log(`📊 Найдено сегментов: ${result.slices_generated}`);
            console.log(`🎯 Точность: ${result.manifest.accuracy_score}%`);
            console.log(`⏱️ Время: ${result.processing_time}s`);
            
            console.log('\n📋 СЕГМЕНТЫ:');
            result.manifest.slices.forEach((slice, index) => {
                console.log(`${index + 1}. ${slice.filename}`);
                console.log(`   Тип: ${slice.type}`);
                console.log(`   Уверенность: ${slice.confidence}`);
                console.log(`   Размер: ${slice.bounds.width}x${slice.bounds.height}`);
                console.log(`   Файл: ${slice.size_kb}KB`);
                console.log('');
            });
            
            // Создаем manifest.json
            await fs.writeFile(
                path.join(OUTPUT_DIR, 'manifest.json'),
                JSON.stringify(result.manifest, null, 2),
                'utf8'
            );
            
            console.log(`✅ Манифест сохранен: ${OUTPUT_DIR}/manifest.json`);
            
            // Анализируем результат
            console.log('\n🔍 АНАЛИЗ РЕЗУЛЬТАТА:');
            if (result.manifest.slices.length === 2) {
                console.log('✅ Найдено 2 варианта - именно то, что вы хотели!');
                console.log('💡 Каждый вариант сохранен как отдельный файл');
                console.log('📋 Можете использовать любой из файлов отдельно');
            } else if (result.manifest.slices.length > 2) {
                console.log(`⚠️ Найдено ${result.manifest.slices.length} сегментов - возможно, нужна настройка параметров`);
            } else {
                console.log('❌ Найден только 1 сегмент - возможно, изображение не содержит отдельных вариантов');
            }
            
        } else {
            console.error('❌ ОШИБКА РАЗДЕЛЕНИЯ:');
            console.error(result.error);
        }
        
    } catch (error: any) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
    }
}

// Дополнительная функция для вывода информации об изображении
async function analyzeImage() {
    try {
        const image = sharp(ASSET_PATH);
        const metadata = await image.metadata();
        
        console.log('\n📸 ИНФОРМАЦИЯ ОБ ИЗОБРАЖЕНИИ:');
        console.log(`   Размер: ${metadata.width}x${metadata.height}`);
        console.log(`   Формат: ${metadata.format}`);
        console.log(`   Каналы: ${metadata.channels}`);
        console.log(`   Размер файла: ${(await fs.stat(ASSET_PATH)).size} байт`);
        
        // Дополнительный анализ для определения возможности разделения
        if (metadata.width && metadata.height) {
            const aspectRatio = metadata.width / metadata.height;
            console.log(`   Соотношение сторон: ${aspectRatio.toFixed(2)}`);
            
            if (aspectRatio > 1.5) {
                console.log('💡 Изображение горизонтальное - возможно разделение по вертикали');
            } else if (aspectRatio < 0.7) {
                console.log('💡 Изображение вертикальное - возможно разделение по горизонтали');
            } else {
                console.log('💡 Изображение квадратное - может потребоваться анализ содержимого');
            }
        }
        
    } catch (error: any) {
        console.warn('⚠️ Не удалось проанализировать изображение:', error.message);
    }
}

async function main() {
    console.log('🚀 ТЕСТИРОВАНИЕ РАЗДЕЛЕНИЯ СПРАЙТА FIGMA');
    console.log('═'.repeat(50));
    
    await analyzeImage();
    await testSpriteSpitter();
    
    console.log('\n✨ Готово!');
}

if (require.main === module) {
    main().catch(console.error);
} 