const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the final diagrams file
const diagramsFile = 'docs/FINAL_SYSTEM_DATA_FLOW_DIAGRAMS.md';
const content = fs.readFileSync(diagramsFile, 'utf8');

// Create output directory
const outputDir = 'docs/diagrams/final-system-flow';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Extract mermaid diagrams
const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
let match;
let diagramCount = 1;

const diagramNames = [
    '01-master-system-data-flow',
    '02-data-transformation-pipeline', 
    '03-inter-specialist-handoffs',
    '04-performance-bottleneck-analysis',
    '05-external-integration-architecture',
    '06-error-flow-recovery-patterns',
    '07-function-dependency-matrix',
    '08-optimization-roadmap'
];

console.log('🎯 Extracting Mermaid diagrams from FINAL_SYSTEM_DATA_FLOW_DIAGRAMS.md...');

while ((match = mermaidRegex.exec(content)) !== null) {
    const diagramContent = match[1];
    const fileName = diagramNames[diagramCount - 1] || `diagram-${diagramCount}`;
    const mmdFile = path.join(outputDir, `${fileName}.mmd`);
    const pngFile = path.join(outputDir, `${fileName}.png`);
    
    // Write .mmd file
    fs.writeFileSync(mmdFile, diagramContent);
    
    try {
        // Convert to PNG
        console.log(`📊 Converting ${fileName}...`);
        execSync(`mmdc -i "${mmdFile}" -o "${pngFile}" -w 1920 -H 1080 -b white --theme neutral`, 
                 { stdio: 'pipe' });
        console.log(`✅ Created: ${pngFile}`);
    } catch (error) {
        console.error(`❌ Error converting ${fileName}:`, error.message);
    }
    
    diagramCount++;
}

console.log(`\n🎉 Conversion complete! Generated ${diagramCount - 1} PNG diagrams in ${outputDir}/`);
console.log('\n📂 Generated files:');
fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).forEach(file => {
    console.log(`   📊 ${file}`);
});

console.log('\n🔍 To view diagrams:');
console.log(`   1. Open folder: ${outputDir}`);
console.log('   2. Or use: open docs/diagrams/final-system-flow/ (macOS)');
console.log('   3. Or use VS Code Markdown Preview with Mermaid extension'); 