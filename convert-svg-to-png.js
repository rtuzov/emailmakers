const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, 'docs/diagrams/agent-architecture-complete.svg');
    const pngPath = path.join(__dirname, 'docs/diagrams/agent-architecture-complete.png');
    
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Convert SVG to PNG with high resolution
    await sharp(svgBuffer)
      .png({
        quality: 100,
        compressionLevel: 1
      })
      .resize(2400, 1800, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(pngPath);
    
    console.log(`✅ PNG diagram created successfully: ${pngPath}`);
    
    // Clean up the temporary script
    fs.unlinkSync(__filename);
    
  } catch (error) {
    console.error('❌ Error converting SVG to PNG:', error);
    process.exit(1);
  }
}

convertSvgToPng();