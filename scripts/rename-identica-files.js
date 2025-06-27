const fs = require('fs');
const path = require('path');

/**
 * Script to rename files in айдентика folder based on detailed descriptions from tag-dictionary.json
 */

const IDENTICA_DIR = 'src/agent/figma-all-pages-1750993353363/айдентика';
const TAG_DICT_PATH = 'src/agent/figma-all-pages-1750993353363/айдентика/tag-dictionary.json';

// Function to create descriptive filename from AI analysis
function createDescriptiveFilename(entry) {
    const { aiAnalysis, shortName } = entry;
    
    if (!aiAnalysis || !aiAnalysis.contentDescription) {
        return shortName; // fallback to short name
    }
    
    const description = aiAnalysis.contentDescription;
    let descriptiveParts = [];
    
    // Extract key description elements
    if (description.чтоИзображено) {
        descriptiveParts.push(description.чтоИзображено);
    } else if (description.whatIsDepicted) {
        descriptiveParts.push(description.whatIsDepicted);
    } else if (description.изображено) {
        descriptiveParts.push(description.изображено);
    }
    
    if (description.стильИдизайн) {
        descriptiveParts.push(description.стильИдизайн);
    } else if (description.styleAndDesign) {
        descriptiveParts.push(description.styleAndDesign);
    } else if (description.стиль) {
        descriptiveParts.push(description.стиль);
    }
    
    // Combine all parts into a descriptive filename
    let fullDescription = descriptiveParts.join(' ').toLowerCase();
    
    // Clean up the description for filename
    fullDescription = fullDescription
        .replace(/[^\u0400-\u04FF\w\s-]/g, '') // Keep Cyrillic, Latin, numbers, spaces, hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 100); // Limit length
    
    return fullDescription || shortName;
}

// Function to sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 200); // Reasonable length limit
}

async function renameIdenticaFiles() {
    try {
        console.log('🔄 Starting айдентика files renaming process...');
        
        // Read tag dictionary
        if (!fs.existsSync(TAG_DICT_PATH)) {
            throw new Error(`Tag dictionary not found at: ${TAG_DICT_PATH}`);
        }
        
        const tagDictData = JSON.parse(fs.readFileSync(TAG_DICT_PATH, 'utf8'));
        const entries = tagDictData.entries;
        
        if (!entries) {
            throw new Error('No entries found in tag dictionary');
        }
        
        // Get current files in directory
        if (!fs.existsSync(IDENTICA_DIR)) {
            throw new Error(`Directory not found: ${IDENTICA_DIR}`);
        }
        
        const files = fs.readdirSync(IDENTICA_DIR).filter(file => file.endsWith('.png'));
        console.log(`📁 Found ${files.length} PNG files in ${IDENTICA_DIR}`);
        
        let renamedCount = 0;
        const renameLog = [];
        
        // Process each entry in tag dictionary
        for (const [shortName, entry] of Object.entries(entries)) {
            const originalName = entry.originalName;
            
            // Find current file that matches this entry
            let currentFile = null;
            
            // Try to find by short name first
            currentFile = files.find(file => file.startsWith(shortName) && file.endsWith('.png'));
            
            if (!currentFile) {
                // Try to find by any part of the short name
                currentFile = files.find(file => {
                    const fileBaseName = path.basename(file, '.png');
                    return shortName.split('-').some(part => fileBaseName.includes(part));
                });
            }
            
            if (!currentFile) {
                console.log(`⚠️  Could not find file for entry: ${shortName}`);
                continue;
            }
            
            // Create new descriptive filename
            const descriptiveBase = createDescriptiveFilename(entry);
            const sanitizedBase = sanitizeFilename(descriptiveBase);
            const newFileName = `${sanitizedBase}.png`;
            
            const currentPath = path.join(IDENTICA_DIR, currentFile);
            const newPath = path.join(IDENTICA_DIR, newFileName);
            
            // Skip if already has the right name
            if (currentFile === newFileName) {
                console.log(`✅ File already correctly named: ${currentFile}`);
                continue;
            }
            
            // Rename the file
            try {
                fs.renameSync(currentPath, newPath);
                renamedCount++;
                
                const logEntry = {
                    originalFigmaName: originalName,
                    oldFileName: currentFile,
                    newFileName: newFileName,
                    shortName: shortName,
                    description: entry.aiAnalysis?.contentDescription || 'No description',
                    tags: entry.allTags || []
                };
                
                renameLog.push(logEntry);
                
                console.log(`✅ Renamed: ${currentFile} → ${newFileName}`);
                
            } catch (error) {
                console.error(`❌ Failed to rename ${currentFile}:`, error.message);
            }
        }
        
        // Save rename log
        const reportPath = path.join(IDENTICA_DIR, 'rename-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalFiles: files.length,
            renamedFiles: renamedCount,
            skippedFiles: files.length - renamedCount,
            renameLog: renameLog
        }, null, 2));
        
        console.log(`\n🎉 Renaming completed!`);
        console.log(`📊 Statistics:`);
        console.log(`   - Total PNG files: ${files.length}`);
        console.log(`   - Successfully renamed: ${renamedCount}`);
        console.log(`   - Skipped: ${files.length - renamedCount}`);
        console.log(`📄 Detailed report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error during renaming process:', error.message);
        process.exit(1);
    }
}

// Run the script
renameIdenticaFiles(); 