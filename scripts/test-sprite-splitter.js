#!/usr/bin/env node

/**
 * Тестовый скрипт для разделения спрайта Figma
 * Использует существующий инструмент figma-sprite-splitter
 */

const path = require('path');
const fs = require('fs/promises');

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
        
        // Импортируем функцию разделения
        const { splitFigmaSprite } = await import('../src/agent/tools/figma-sprite-splitter.ts');
        
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
            
            // Копируем результаты в выходную директорию
            if (result.manifest.metadata.processing_config.tempDir) {
                try {
                    // Ищем временную директорию или создаем файлы
                    console.log('📦 Копирование результатов...');
                    
                    // Создаем manifest.json
                    await fs.writeFile(
                        path.join(OUTPUT_DIR, 'manifest.json'),
                        JSON.stringify(result.manifest, null, 2),
                        'utf8'
                    );
                    
                    console.log(`✅ Манифест сохранен: ${OUTPUT_DIR}/manifest.json`);
                    
                } catch (copyError) {
                    console.warn('⚠️ Не удалось скопировать файлы:', copyError.message);
                }
            }
            
        } else {
            console.error('❌ ОШИБКА РАЗДЕЛЕНИЯ:');
            console.error(result.error);
        }
        
    } catch (error) {
        console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.error(error.stack);
    }
}

// Дополнительная функция для вывода информации об изображении
async function analyzeImage() {
    try {
        const sharp = (await import('sharp')).default;
        const image = sharp(ASSET_PATH);
        const metadata = await image.metadata();
        
        console.log('\n📸 ИНФОРМАЦИЯ ОБ ИЗОБРАЖЕНИИ:');
        console.log(`   Размер: ${metadata.width}x${metadata.height}`);
        console.log(`   Формат: ${metadata.format}`);
        console.log(`   Каналы: ${metadata.channels}`);
        console.log(`   Размер файла: ${(await fs.stat(ASSET_PATH)).size} байт`);
        
    } catch (error) {
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