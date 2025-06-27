#!/usr/bin/env node

/**
 * Анализ структуры спрайта для понимания компоновки элементов
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSET_PATH = path.join(process.cwd(), 'figma-assets', 'заяц -Общие- 09-x1.png');

async function analyzeSprite() {
    try {
        console.log('🔍 АНАЛИЗ СТРУКТУРЫ СПРАЙТА');
        console.log('═'.repeat(50));
        
        const image = sharp(ASSET_PATH);
        const metadata = await image.metadata();
        
        console.log(`📊 Размеры: ${metadata.width}×${metadata.height}`);
        console.log(`📋 Формат: ${metadata.format}`);
        console.log(`🎨 Каналы: ${metadata.channels}`);
        
        // Получаем данные пикселей
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        console.log('\n🧮 АНАЛИЗ ПРОФИЛЕЙ ПРОЕКЦИИ:');
        
        // Анализ горизонтального профиля (по строкам)
        const horizontalProfile = [];
        for (let y = 0; y < info.height; y++) {
            let nonTransparentPixels = 0;
            for (let x = 0; x < info.width; x++) {
                const pixelIndex = (y * info.width + x) * info.channels;
                const alpha = info.channels === 4 ? data[pixelIndex + 3] : 255;
                if (alpha > 10) {
                    nonTransparentPixels++;
                }
            }
            horizontalProfile.push(nonTransparentPixels);
        }
        
        // Анализ вертикального профиля (по столбцам)
        const verticalProfile = [];
        for (let x = 0; x < info.width; x++) {
            let nonTransparentPixels = 0;
            for (let y = 0; y < info.height; y++) {
                const pixelIndex = (y * info.width + x) * info.channels;
                const alpha = info.channels === 4 ? data[pixelIndex + 3] : 255;
                if (alpha > 10) {
                    nonTransparentPixels++;
                }
            }
            verticalProfile.push(nonTransparentPixels);
        }
        
        // Поиск пустых областей
        const emptyHorizontalLines = [];
        const emptyVerticalLines = [];
        
        for (let i = 0; i < horizontalProfile.length; i++) {
            if (horizontalProfile[i] === 0) {
                emptyHorizontalLines.push(i);
            }
        }
        
        for (let i = 0; i < verticalProfile.length; i++) {
            if (verticalProfile[i] === 0) {
                emptyVerticalLines.push(i);
            }
        }
        
        console.log(`📏 Горизонтальные пустые линии: ${emptyHorizontalLines.length}`);
        console.log(`📐 Вертикальные пустые линии: ${emptyVerticalLines.length}`);
        
        // Анализ непрерывных пустых областей
        const horizontalGaps = findContinuousGaps(emptyHorizontalLines);
        const verticalGaps = findContinuousGaps(emptyVerticalLines);
        
        console.log('\n🔲 ГОРИЗОНТАЛЬНЫЕ РАЗРЫВЫ:');
        horizontalGaps.forEach((gap, index) => {
            console.log(`   ${index + 1}. Строки ${gap.start}-${gap.end} (размер: ${gap.size}px)`);
        });
        
        console.log('\n🔳 ВЕРТИКАЛЬНЫЕ РАЗРЫВЫ:');
        verticalGaps.forEach((gap, index) => {
            console.log(`   ${index + 1}. Колонки ${gap.start}-${gap.end} (размер: ${gap.size}px)`);
        });
        
        // Анализ потенциальных сегментов
        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        
        if (horizontalGaps.length > 0) {
            const bigGaps = horizontalGaps.filter(gap => gap.size >= 10);
            console.log(`   • Найдено ${bigGaps.length} значительных горизонтальных разрывов (≥10px)`);
            if (bigGaps.length > 0) {
                console.log('   • Попробуйте h_gap: 8-12 для разделения по горизонтали');
            }
        }
        
        if (verticalGaps.length > 0) {
            const bigGaps = verticalGaps.filter(gap => gap.size >= 10);
            console.log(`   • Найдено ${bigGaps.length} значительных вертикальных разрывов (≥10px)`);
            if (bigGaps.length > 0) {
                console.log('   • Попробуйте v_gap: 8-12 для разделения по вертикали');
            }
        }
        
        if (horizontalGaps.length === 0 && verticalGaps.length === 0) {
            console.log('   ⚠️ Четких разрывов не найдено');
            console.log('   • Возможно, варианты расположены слишком близко');
            console.log('   • Попробуйте h_gap: 2-5 и v_gap: 2-5');
            console.log('   • Или используйте другие инструменты разделения');
        }
        
        // Анализ содержимого для определения типа компоновки
        console.log('\n📋 АНАЛИЗ КОМПОНОВКИ:');
        
        const aspectRatio = info.width / info.height;
        console.log(`   • Соотношение сторон: ${aspectRatio.toFixed(2)}`);
        
        if (aspectRatio > 1.8) {
            console.log('   • Вероятно горизонтальная компоновка (элементы рядом)');
        } else if (aspectRatio < 0.6) {
            console.log('   • Вероятно вертикальная компоновка (элементы друг под другом)');
        } else {
            console.log('   • Квадратная или почти квадратная компоновка (требует анализа)');
        }
        
        // Анализ плотности пикселей
        const totalPixels = info.width * info.height;
        const contentPixels = horizontalProfile.reduce((sum, count) => sum + count, 0);
        const fillRatio = contentPixels / totalPixels;
        
        console.log(`   • Заполненность: ${(fillRatio * 100).toFixed(1)}%`);
        
        if (fillRatio > 0.8) {
            console.log('   • Высокая плотность - возможно элементы перекрываются');
        } else if (fillRatio < 0.3) {
            console.log('   • Низкая плотность - много пустого пространства');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при анализе:', error.message);
    }
}

function findContinuousGaps(emptyLines) {
    if (emptyLines.length === 0) return [];
    
    const gaps = [];
    let start = emptyLines[0];
    let end = emptyLines[0];
    
    for (let i = 1; i < emptyLines.length; i++) {
        if (emptyLines[i] === end + 1) {
            end = emptyLines[i];
        } else {
            gaps.push({
                start: start,
                end: end,
                size: end - start + 1
            });
            start = emptyLines[i];
            end = emptyLines[i];
        }
    }
    
    // Добавляем последний разрыв
    gaps.push({
        start: start,
        end: end,
        size: end - start + 1
    });
    
    return gaps.filter(gap => gap.size >= 3); // Только значимые разрывы
}

analyzeSprite().then(() => {
    console.log('\n✨ Анализ завершен!');
}).catch(console.error); 