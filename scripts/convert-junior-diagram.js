const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the junior developer diagram file
const diagramsFile = 'docs/DETAILED_JUNIOR_DEVELOPER_FLOW_DIAGRAM.md';
const content = fs.readFileSync(diagramsFile, 'utf8');

// Create output directory
const outputDir = 'docs/diagrams/junior-developer-detailed';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Extract mermaid diagrams
const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
let match;
let diagramCount = 1;

const diagramNames = [
    '01-complete-detailed-flow',
    '02-context-evolution',
    '03-file-operations-timeline'
];

console.log('🎯 Extracting Mermaid diagrams from DETAILED_JUNIOR_DEVELOPER_FLOW_DIAGRAM.md...');

while ((match = mermaidRegex.exec(content)) !== null) {
    const diagramContent = match[1];
    const fileName = diagramNames[diagramCount - 1] || `junior-diagram-${diagramCount}`;
    const mmdFile = path.join(outputDir, `${fileName}.mmd`);
    const pngFile = path.join(outputDir, `${fileName}.png`);
    
    // Write .mmd file
    fs.writeFileSync(mmdFile, diagramContent);
    
    try {
        // Convert to PNG with larger dimensions for detailed diagrams
        console.log(`📊 Converting ${fileName}...`);
        execSync(`mmdc -i "${mmdFile}" -o "${pngFile}" -w 2400 -H 1800 -b white --theme neutral`, 
                 { stdio: 'pipe' });
        console.log(`✅ Created: ${pngFile}`);
    } catch (error) {
        console.error(`❌ Error converting ${fileName}:`, error.message);
    }
    
    diagramCount++;
}

// Create README for junior developer diagrams
const readmeContent = `# 📋 Детальные Диаграммы для Джуниор Разработчика

*Создано: 15 января 2025*
*Email-Makers: Максимально подробная документация*

---

## 🎯 Диаграммы для Понимания Системы

### 1. **Полный Детальный Поток**
![Complete Detailed Flow](01-complete-detailed-flow.png)
> **Описание**: Полная схема всех 47 функций с детализацией файлов, контекста, API вызовов и времени выполнения.

---

### 2. **Эволюция Контекста**  
![Context Evolution](02-context-evolution.png)
> **Описание**: Как растет контекст с 2KB до 40KB - что добавляется на каждом этапе.

---

### 3. **Временная Линия Файловых Операций**
![File Operations Timeline](03-file-operations-timeline.png)
> **Описание**: Gantt-диаграмма всех операций чтения/записи файлов по времени.

---

## 📚 Дополнительная Информация

- **Полный документ**: [DETAILED_JUNIOR_DEVELOPER_FLOW_DIAGRAM.md](../../DETAILED_JUNIOR_DEVELOPER_FLOW_DIAGRAM.md)
- **Таблицы файлов**: 27 файлов с детальным описанием
- **Метрики производительности**: Полная разбивка по временам и размерам
- **Шпаргалка для кода**: Примеры JavaScript для работы с файлами и контекстом

---

## 🔍 Как Использовать

1. **Изучите диаграмму потока** - поймите последовательность функций
2. **Найдите функцию в коде** - используйте названия из диаграммы
3. **Проследите файловые операции** - где создаются и читаются файлы
4. **Изучите контекст** - что передается между функциями
5. **Оптимизируйте узкие места** - используйте рекомендации из документа

---

*Максимум деталей для быстрого понимания архитектуры Email-Makers* 🚀
`;

const readmePath = path.join(outputDir, 'README.md');
fs.writeFileSync(readmePath, readmeContent);

console.log(`\n🎉 Conversion complete! Generated ${diagramCount - 1} detailed PNG diagrams in ${outputDir}/`);
console.log('\n📂 Generated files:');
fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).forEach(file => {
    console.log(`   📊 ${file}`);
});

console.log('\n🔍 To view detailed diagrams:');
console.log(`   1. Open folder: ${outputDir}`);
console.log('   2. Or use: open docs/diagrams/junior-developer-detailed/ (macOS)');
console.log('   3. Study the detailed markdown file for complete context'); 